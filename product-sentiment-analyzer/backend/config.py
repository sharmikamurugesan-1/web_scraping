import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

class Config:
    HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
    PORT = int(os.environ.get("FLASK_PORT", 5000))
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1")
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-sentiment-analyzer-2026")
    
    # MongoDB Atlas Configuration
    # Example: mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
    MONGO_URI = os.environ.get("MONGO_URI", "")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "sentiment_analyzer_db")
    
    # Local Storage Fallback (SQLite & JSON Store)
    SQLITE_PATH = str(DATA_DIR / "sentiment_store.db")
    JSON_STORE_PATH = str(DATA_DIR / "products_store.json")
    
    # Scraper & Driver Settings
    SELENIUM_HEADLESS = os.environ.get("SELENIUM_HEADLESS", "True").lower() in ("true", "1")
    SCRAPER_TIMEOUT = int(os.environ.get("SCRAPER_TIMEOUT", 15))
    DEMO_FALLBACK_ON_ERROR = os.environ.get("DEMO_FALLBACK_ON_ERROR", "True").lower() in ("true", "1")
    
    # NLP Configuration
    VADER_POS_THRESHOLD = float(os.environ.get("VADER_POS_THRESHOLD", 0.05))
    VADER_NEG_THRESHOLD = float(os.environ.get("VADER_NEG_THRESHOLD", -0.05))
