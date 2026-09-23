import re
import time
import logging
import uuid
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseScraper
from scrapers.demo_scraper import DemoScraper
from config import Config

logger = logging.getLogger(__name__)

class FlipkartScraper(BaseScraper):
    def __init__(self, headless: bool = True, timeout: int = 15):
        super().__init__(headless=headless, timeout=timeout)

    def scrape(self, query_or_url: str, max_reviews: int = 50) -> Dict[str, Any]:
        """
        Scrapes Flipkart reviews for a given URL or query.
        Falls back smoothly to curated demo data if blocked or unavailable.
        """
        is_url = bool(re.match(r'^https?://', query_or_url.strip(), re.IGNORECASE))
        
        if not is_url or "demo_" in query_or_url:
            logger.info(f"Using demo data for Flipkart query: {query_or_url}")
            return DemoScraper.search_or_fallback(query_or_url, source="Flipkart", max_reviews=max_reviews)

        target_url = query_or_url.strip()
        driver = None
        try:
            logger.info(f"Starting Selenium Chrome to scrape Flipkart: {target_url}")
            driver = self.create_driver()
            driver.get(target_url)
            time.sleep(3)

            soup = BeautifulSoup(driver.page_source, "html.parser")

            # Extract title
            title_tag = soup.find("span", {"class": "B_NuCI"}) or soup.find("h1")
            product_title = title_tag.get_text(strip=True) if title_tag else "Flipkart Product"

            # Extract rating
            rating_tag = soup.find("div", {"class": "_3LWZlK"}) or soup.find("div", {"class": "XQDdHH"})
            rating = 4.4
            if rating_tag:
                try:
                    rating = float(rating_tag.get_text(strip=True)[:3])
                except Exception:
                    pass

            # Extract image
            img_tag = soup.find("img", {"class": "_396cs4"}) or soup.find("img", {"class": "DByuf4"})
            image_url = img_tag.get("src") if img_tag else "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"

            # Extract reviews
            review_cards = soup.find_all("div", {"class": "col _2wzgFH"}) or soup.find_all("div", {"class": "EPCmJX"}) or soup.find_all("div", {"class": "cPHDOP"})
            extracted_reviews = []

            for card in review_cards[:max_reviews]:
                body = card.find("div", {"class": "t-ZTKy"}) or card.find("div", {"class": "ZmyHeo"})
                text = body.get_text(strip=True) if body else ""
                
                # Flipkart often appends 'READ MORE' to collapsed text
                if text.endswith("READ MORE"):
                    text = text[:-9].strip()

                rev_rating = rating
                r_div = card.find("div", {"class": "_3LWZlK"}) or card.find("div", {"class": "XQDdHH"})
                if r_div:
                    try:
                        rev_rating = float(r_div.get_text(strip=True)[:3])
                    except Exception:
                        pass

                reviewer_tag = card.find("p", {"class": "_2sc7ZR"}) or card.find("p", {"class": "_2NsDsF"})
                reviewer = reviewer_tag.get_text(strip=True) if reviewer_tag else "Flipkart Customer"

                verified = bool(card.find(text=re.compile("Certified Buyer|Verified Buyer", re.IGNORECASE)))

                if text:
                    extracted_reviews.append({
                        "id": str(uuid.uuid4())[:16],
                        "product_id": "",
                        "review_text": text,
                        "rating": rev_rating,
                        "reviewer": reviewer,
                        "review_date": "Recently",
                        "verified_purchase": verified,
                        "source": "Flipkart"
                    })

            if len(extracted_reviews) >= 3:
                prod_id = f"flp_{str(uuid.uuid4())[:8]}"
                for r in extracted_reviews:
                    r["product_id"] = prod_id
                return {
                    "product": {
                        "id": prod_id,
                        "name": product_title,
                        "url": target_url,
                        "source": "Flipkart",
                        "rating": rating,
                        "review_count": len(extracted_reviews),
                        "image_url": image_url,
                        "is_demo": False
                    },
                    "reviews": extracted_reviews,
                    "is_demo": False
                }
            else:
                logger.info("Insufficient Flipkart reviews scraped directly. Falling back gracefully to Demo dataset.")
                return DemoScraper.search_or_fallback(query_or_url, source="Flipkart", max_reviews=max_reviews)

        except Exception as e:
            logger.warning(f"Live Flipkart scraping encountered error ({e}). Returning high-fidelity Demo dataset.")
            return DemoScraper.search_or_fallback(query_or_url, source="Flipkart", max_reviews=max_reviews)
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception:
                    pass
