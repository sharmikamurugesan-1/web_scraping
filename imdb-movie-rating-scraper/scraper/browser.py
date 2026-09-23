"""
Browser automation helper for CineRank IMDb Scraper.
Manages headless and standard Chrome WebDriver instances safely with anti-detection flags.
"""

import os
import sys
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

logger = logging.getLogger("CineRank.Browser")


def build_chrome_options(headless: bool = True) -> Options:
    """Build optimized ChromeOptions with modern headless and stealth arguments."""
    options = Options()

    if headless:
        # Modern Chrome headless flag
        options.add_argument("--headless=new")

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-notifications")
    options.add_argument("--lang=en-US,en")
    options.add_argument("--disable-blink-features=AutomationControlled")

    # Anti-bot user-agent
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    )

    # If Chrome binary is in standard Windows installation path, specify it
    standard_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser"
    ]
    for p in standard_paths:
        if os.path.exists(p):
            options.binary_location = p
            break

    # Performance improvements
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    return options


def create_driver(headless: bool = True, timeout: int = 20) -> webdriver.Chrome:
    """
    Instantiate Chrome WebDriver.
    Tries webdriver-manager first, falling back to direct driver instantiation.
    """
    options = build_chrome_options(headless=headless)
    driver = None

    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        logger.info(f"ChromeDriver initialized via webdriver_manager (headless={headless})")
    except Exception as e:
        logger.warning(f"webdriver-manager error ({e}), attempting native ChromeDriver on PATH...")
        try:
            driver = webdriver.Chrome(options=options)
            logger.info(f"ChromeDriver initialized natively on PATH (headless={headless})")
        except Exception as native_err:
            logger.error(f"Failed to initialize ChromeDriver: {native_err}")
            raise RuntimeError(
                f"Could not launch Chrome WebDriver. Ensure Google Chrome is installed. Details: {native_err}"
            ) from native_err

    driver.set_page_load_timeout(timeout)
    driver.implicitly_wait(4)
    return driver


def close_driver(driver):
    """Safely terminate and clean up a Selenium WebDriver instance."""
    if driver is not None:
        try:
            driver.quit()
            logger.info("WebDriver instance terminated cleanly.")
        except Exception as e:
            logger.warning(f"Error while closing WebDriver: {e}")
