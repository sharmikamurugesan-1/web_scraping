import abc
import logging
import random
from typing import Dict, Any, List, Optional
from config import Config

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
]

class BaseScraper(abc.ABC):
    def __init__(self, headless: bool = True, timeout: int = 15):
        self.headless = headless
        self.timeout = timeout
        self.user_agent = random.choice(USER_AGENTS)

    def get_chrome_options(self):
        from selenium.webdriver.chrome.options import Options
        options = Options()
        if self.headless:
            options.add_argument("--headless=new")
        options.add_argument(f"user-agent={self.user_agent}")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-extensions")
        options.add_argument("--mute-audio")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        return options

    def create_driver(self):
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        options = self.get_chrome_options()
        try:
            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(self.timeout)
            return driver
        except Exception as e:
            logger.warning(f"Failed to create standard Chrome driver: {e}")
            # Try without service if path is default
            driver = webdriver.Chrome(options=options)
            return driver

    @abc.abstractmethod
    def scrape(self, query_or_url: str, max_reviews: int = 50) -> Dict[str, Any]:
        """
        Extracts product information and reviews.
        Returns dictionary with:
        {
            "product": { ... },
            "reviews": [ ... ],
            "is_demo": bool
        }
        """
        pass
