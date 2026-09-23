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

class AmazonScraper(BaseScraper):
    def __init__(self, headless: bool = True, timeout: int = 15):
        super().__init__(headless=headless, timeout=timeout)

    def scrape(self, query_or_url: str, max_reviews: int = 50) -> Dict[str, Any]:
        """
        Scrapes Amazon reviews for a given URL or query.
        Falls back smoothly to curated demo data if blocked or unavailable.
        """
        is_url = bool(re.match(r'^https?://', query_or_url.strip(), re.IGNORECASE))
        
        # If user passed a demo product id or fallback is forced
        if not is_url or "demo_" in query_or_url:
            logger.info(f"Using demo data for query: {query_or_url}")
            return DemoScraper.search_or_fallback(query_or_url, source="Amazon", max_reviews=max_reviews)

        target_url = query_or_url.strip()
        driver = None
        try:
            logger.info(f"Starting Selenium Chrome to scrape Amazon: {target_url}")
            driver = self.create_driver()
            driver.get(target_url)
            time.sleep(3) # Allow dynamic content to settle

            soup = BeautifulSoup(driver.page_source, "html.parser")

            # Check if Amazon blocked with CAPTCHA
            if "Type the characters you see in this image" in soup.text or "Robot Check" in soup.text:
                logger.warning("Amazon CAPTCHA / bot challenge triggered. Utilizing Demo Mode fallback.")
                return DemoScraper.search_or_fallback(query_or_url, source="Amazon", max_reviews=max_reviews)

            # Extract product title
            title_tag = soup.find("span", {"id": "productTitle"}) or soup.find("h1")
            product_title = title_tag.get_text(strip=True) if title_tag else "Amazon Product"

            # Extract rating
            rating_tag = soup.find("span", {"class": "a-icon-alt"})
            rating = 4.5
            if rating_tag:
                match = re.search(r'([\d\.]+)\s+out of', rating_tag.text)
                if match:
                    rating = float(match.group(1))

            # Extract product image
            img_tag = soup.find("img", {"id": "landingImage"}) or soup.find("img", {"data-a-image-name": "landingImage"})
            image_url = img_tag.get("src") if img_tag else "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"

            # Extract reviews
            review_cards = soup.find_all("div", {"data-hook": "review"}) or soup.find_all("div", {"class": "review"})
            extracted_reviews = []

            for card in review_cards[:max_reviews]:
                body = card.find("span", {"data-hook": "review-body"})
                text = body.get_text(strip=True) if body else ""
                
                rev_rating = rating
                r_tag = card.find("i", {"data-hook": "review-star-rating"}) or card.find("span", {"class": "a-icon-alt"})
                if r_tag:
                    m = re.search(r'([\d\.]+)', r_tag.text)
                    if m:
                        rev_rating = float(m.group(1))

                reviewer_tag = card.find("span", {"class": "a-profile-name"})
                reviewer = reviewer_tag.get_text(strip=True) if reviewer_tag else "Amazon Customer"

                date_tag = card.find("span", {"data-hook": "review-date"})
                rev_date = date_tag.get_text(strip=True) if date_tag else ""

                verified = bool(card.find("span", {"data-hook": "avp-badge"}))

                if text:
                    extracted_reviews.append({
                        "id": str(uuid.uuid4())[:16],
                        "product_id": "",
                        "review_text": text,
                        "rating": rev_rating,
                        "reviewer": reviewer,
                        "review_date": rev_date,
                        "verified_purchase": verified,
                        "source": "Amazon"
                    })

            if len(extracted_reviews) >= 3:
                prod_id = f"amz_{str(uuid.uuid4())[:8]}"
                for r in extracted_reviews:
                    r["product_id"] = prod_id
                return {
                    "product": {
                        "id": prod_id,
                        "name": product_title,
                        "url": target_url,
                        "source": "Amazon",
                        "rating": rating,
                        "review_count": len(extracted_reviews),
                        "image_url": image_url,
                        "is_demo": False
                    },
                    "reviews": extracted_reviews,
                    "is_demo": False
                }
            else:
                logger.info("Insufficient reviews scraped directly. Falling back gracefully to Demo dataset.")
                return DemoScraper.search_or_fallback(query_or_url, source="Amazon", max_reviews=max_reviews)

        except Exception as e:
            logger.warning(f"Live Amazon scraping encountered error ({e}). Returning high-fidelity Demo dataset.")
            return DemoScraper.search_or_fallback(query_or_url, source="Amazon", max_reviews=max_reviews)
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception:
                    pass
