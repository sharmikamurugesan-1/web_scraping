"""
CineRank Scraper Package
Module providing headless browser creation and IMDb Top 250 scraping automation.
"""

from .browser import create_driver, close_driver
from .imdb_scraper import IMDbScraper, get_scraper_instance

__all__ = ["create_driver", "close_driver", "IMDbScraper", "get_scraper_instance"]
