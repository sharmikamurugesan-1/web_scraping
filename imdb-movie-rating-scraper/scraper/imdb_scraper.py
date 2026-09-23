"""
CineRank - IMDb Top 250 Scraper Engine
Thread-safe background scraper utilizing Selenium Chrome WebDriver and Pandas.
Extracts Rank, Title, Release Year, IMDb Rating, and Poster URLs with live progress tracking.
"""

import os
import re
import time
import logging
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from .browser import create_driver, close_driver

logger = logging.getLogger("CineRank.Scraper")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "movies.csv")


class IMDbScraper:
    """Singleton scraper class with thread-safe execution and live status tracking."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(IMDbScraper, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        self.status = "idle"  # idle | running | completed | error | stopped
        self.progress = 0  # 0 to 100 percentage
        self.total_movies = 250
        self.scraped_count = 0
        self.current_movie = ""
        self.message = "Scraper is idle. Ready to scrape IMDb Top 250."
        self.error = None
        self.last_scraped_time = None
        self.is_demo = True
        self.cancel_requested = False
        self._thread = None
        self._state_lock = threading.Lock()

        # Check existing CSV
        self._check_existing_dataset()

    def _check_existing_dataset(self):
        """Check if movies.csv exists and determine initial metadata."""
        if os.path.exists(CSV_PATH):
            try:
                df = pd.read_csv(CSV_PATH)
                if not df.empty:
                    mtime = os.path.getmtime(CSV_PATH)
                    self.last_scraped_time = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                    # If file has 'is_demo' marker or default sample, note it
                    self.is_demo = False if "is_demo" not in df.columns else bool(df.get("is_demo", [False])[0])
                    logger.info(f"Loaded existing dataset with {len(df)} movies from {CSV_PATH}")
            except Exception as e:
                logger.warning(f"Could not read existing CSV: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Return a copy of the current scraper progress and telemetry."""
        with self._state_lock:
            return {
                "status": self.status,
                "progress": self.progress,
                "total_movies": self.total_movies,
                "scraped_count": self.scraped_count,
                "current_movie": self.current_movie,
                "message": self.message,
                "error": self.error,
                "last_scraped_time": self.last_scraped_time or "Never",
                "is_demo": self.is_demo
            }

    def start_scraping(self, headless: bool = True) -> bool:
        """Launch scraper in a dedicated background daemon thread."""
        with self._state_lock:
            if self.status == "running":
                logger.warning("Scrape requested while already running.")
                return False

            self.status = "running"
            self.progress = 0
            self.scraped_count = 0
            self.current_movie = "Initializing Chrome WebDriver..."
            self.message = "Starting background scraping job..."
            self.error = None
            self.cancel_requested = False

        self._thread = threading.Thread(
            target=self._scrape_job,
            args=(headless,),
            daemon=True,
            name="IMDbScraperThread"
        )
        self._thread.start()
        logger.info(f"Scraper background thread started (headless={headless}).")
        return True

    def stop_scraping(self):
        """Signal the running scraper thread to abort."""
        with self._state_lock:
            self.cancel_requested = True
            if self.status == "running":
                self.message = "Stopping scraper..."
                logger.info("Scraper cancellation requested by user.")

    def _scrape_job(self, headless: bool):
        """Internal worker executing the Selenium scraping process."""
        driver = None
        movies_data: List[Dict[str, Any]] = []

        try:
            with self._state_lock:
                self.message = "Launching Google Chrome WebDriver..."
                self.current_movie = "Opening browser session..."

            driver = create_driver(headless=headless, timeout=25)

            target_url = "https://www.imdb.com/chart/top/"
            with self._state_lock:
                self.message = f"Navigating to {target_url}..."
                self.current_movie = "Loading IMDb Top 250 chart..."

            logger.info(f"Navigating to {target_url}...")
            driver.get(target_url)

            # Wait for list items to appear
            wait = WebDriverWait(driver, 15)
            # Modern IMDb Top 250 list items use 'ipc-metadata-list-summary-item'
            logger.info("Waiting for Top 250 movie list items to hydrate...")
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.ipc-metadata-list-summary-item")))
            except Exception:
                # Fallback to alternate or older IMDb selector
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".lister-list tr, [data-testid='chart-layout-main-column']")))

            time.sleep(2)  # Give JS time to populate metadata

            # Locate movie elements
            items = driver.find_elements(By.CSS_SELECTOR, "li.ipc-metadata-list-summary-item")
            if not items:
                # Try table format if legacy layout served
                items = driver.find_elements(By.CSS_SELECTOR, ".lister-list tr")

            total_found = len(items)
            logger.info(f"Located {total_found} movie elements on IMDb page.")

            if total_found == 0:
                raise ValueError("Could not find movie entries on IMDb page. IMDb structure may have changed.")

            target_count = min(total_found, 250)
            with self._state_lock:
                self.total_movies = target_count
                self.message = f"Extracting movie records (0 of {target_count})..."

            for idx in range(target_count):
                if self.cancel_requested:
                    logger.info("Scraping cancelled by user during loop.")
                    with self._state_lock:
                        self.status = "stopped"
                        self.message = f"Scraping stopped by user. {len(movies_data)} movies captured."
                    return

                try:
                    item = items[idx]
                    movie_info = self._parse_movie_element(item, idx + 1)
                    movies_data.append(movie_info)

                    # Update live state
                    with self._state_lock:
                        self.scraped_count = len(movies_data)
                        self.current_movie = movie_info["Title"]
                        self.progress = int((self.scraped_count / target_count) * 100)
                        self.message = f"Scraping IMDb Top 250... ({self.scraped_count}/{target_count})"

                    # Short non-blocking pause for safety
                    time.sleep(0.04)

                except Exception as parse_err:
                    logger.debug(f"Error parsing item index {idx}: {parse_err}")
                    continue

            # Check extracted count
            if len(movies_data) < 20:
                raise ValueError(f"Only extracted {len(movies_data)} movies. Possible bot block or network drop.")

            # Save extracted dataset using Pandas
            df = pd.DataFrame(movies_data)
            os.makedirs(DATA_DIR, exist_ok=True)
            df.to_csv(CSV_PATH, index=False)

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with self._state_lock:
                self.status = "completed"
                self.progress = 100
                self.scraped_count = len(movies_data)
                self.current_movie = "All movies processed!"
                self.last_scraped_time = now_str
                self.is_demo = False
                self.message = f"Successfully scraped and saved {len(movies_data)} IMDb Top 250 movies to CSV!"

            logger.info(f"Scrape completed successfully! Saved {len(movies_data)} movies to {CSV_PATH}")

        except Exception as e:
            error_text = str(e)
            logger.error(f"Scraper error encountered: {error_text}", exc_info=True)

            with self._state_lock:
                self.status = "error"
                self.error = error_text
                self.message = "Unable to retrieve IMDb data right now. Please try again."
                self.current_movie = "Scraping interrupted."

        finally:
            if driver is not None:
                close_driver(driver)

    def _parse_movie_element(self, element, default_rank: int) -> Dict[str, Any]:
        """Defensively extract movie fields from a single row/card element."""
        text_content = element.text
        lines = [line.strip() for line in text_content.split("\n") if line.strip()]

        rank = default_rank
        title = f"Movie {default_rank}"
        year = 2000
        rating = 8.0
        poster_url = ""
        imdb_url = ""

        # 1. Try finding title and rank from link or header
        try:
            link_el = element.find_element(By.CSS_SELECTOR, "a.ipc-title-link-wrapper, a[href*='/title/']")
            raw_title = link_el.text.strip()
            href = link_el.get_attribute("href")
            if href:
                # Clean query parameters from URL
                imdb_url = href.split("?")[0]

            # Parse "1. The Shawshank Redemption"
            match = re.match(r"^(\d+)[\.\s]+(.*)$", raw_title)
            if match:
                rank = int(match.group(1))
                title = match.group(2).strip()
            elif raw_title:
                title = raw_title
        except Exception:
            # Fallback text parsing
            if lines:
                match = re.match(r"^(\d+)[\.\s]+(.*)$", lines[0])
                if match:
                    rank = int(match.group(1))
                    title = match.group(2).strip()

        # 2. Extract year (look for 4-digit number between 1920 and 2030)
        try:
            year_matches = re.findall(r"\b(19\d{2}|20\d{2})\b", text_content)
            if year_matches:
                year = int(year_matches[0])
        except Exception:
            year = 2000

        # 3. Extract IMDb Rating (look for format like 9.3 or 8.4)
        try:
            rating_match = re.search(r"\b([789]\.\d)\b", text_content)
            if rating_match:
                rating = float(rating_match.group(1))
            else:
                # Try finding rating element specifically
                rating_el = element.find_element(By.CSS_SELECTOR, "[data-testid='ratingGroup--imdb-rating'], .ipc-rating-star")
                r_match = re.search(r"([789]\.\d)", rating_el.text)
                if r_match:
                    rating = float(r_match.group(1))
        except Exception:
            rating = 8.1

        # 4. Extract Poster URL if available
        try:
            img_el = element.find_element(By.CSS_SELECTOR, "img.ipc-image, .loadlate")
            src = img_el.get_attribute("src")
            if src and "http" in src:
                poster_url = src
        except Exception:
            poster_url = ""

        return {
            "Rank": int(rank),
            "Title": str(title),
            "Year": int(year),
            "IMDb Rating": float(rating),
            "Poster": str(poster_url),
            "IMDb URL": str(imdb_url)
        }


# Global singleton helper
_global_scraper = IMDbScraper()


def get_scraper_instance() -> IMDbScraper:
    """Retrieve the singleton IMDbScraper instance."""
    return _global_scraper
