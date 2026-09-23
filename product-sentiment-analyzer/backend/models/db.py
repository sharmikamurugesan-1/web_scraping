import json
import sqlite3
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from config import Config

logger = logging.getLogger(__name__)

class DatabaseClient:
    """
    Unified database client that connects to MongoDB Atlas if MONGO_URI is set,
    or gracefully falls back to an embedded SQLite + JSON store.
    """
    def __init__(self):
        self.provider = "sqlite"
        self.mongo_client = None
        self.mongo_db = None
        self._init_db()

    def _init_db(self):
        # 1. Try MongoDB if MONGO_URI is provided
        if Config.MONGO_URI:
            try:
                from pymongo import MongoClient
                self.mongo_client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2000)
                # Trigger server ping
                self.mongo_client.admin.command('ping')
                self.mongo_db = self.mongo_client[Config.MONGO_DB_NAME]
                self.provider = "mongodb"
                logger.info(f"Connected to MongoDB Atlas: {Config.MONGO_DB_NAME}")
                return
            except Exception as e:
                logger.warning(f"Failed to connect to MongoDB Atlas ({e}). Falling back to SQLite.")
                self.mongo_client = None
                self.mongo_db = None

        # 2. Setup SQLite Fallback
        self.provider = "sqlite"
        self._init_sqlite()

    def _get_connection(self):
        conn = sqlite3.connect(Config.SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Products table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT,
                source TEXT NOT NULL,
                rating REAL,
                review_count INTEGER,
                image_url TEXT,
                is_demo INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT,
                metadata_json TEXT
            )
            """)
            # Reviews table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL,
                review_text TEXT NOT NULL,
                rating REAL,
                sentiment TEXT,
                sentiment_score REAL,
                pos_score REAL,
                neu_score REAL,
                neg_score REAL,
                reviewer TEXT,
                review_date TEXT,
                verified_purchase INTEGER DEFAULT 1,
                source TEXT,
                aspects_json TEXT DEFAULT '[]',
                created_at TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
            """)
            # Check for aspects_json column migration if table already existed
            cursor.execute("PRAGMA table_info(reviews)")
            col_names = [col[1] for col in cursor.fetchall()]
            if "aspects_json" not in col_names:
                cursor.execute("ALTER TABLE reviews ADD COLUMN aspects_json TEXT DEFAULT '[]'")
            # Analytics cache table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS analytics (
                product_id TEXT PRIMARY KEY,
                data_json TEXT NOT NULL,
                updated_at TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
            """)
            conn.commit()

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "status": "connected",
            "mongo_configured": bool(Config.MONGO_URI),
            "sqlite_path": Config.SQLITE_PATH
        }

    # ==================== PRODUCT METHODS ====================

    def save_product(self, product_data: Dict[str, Any]) -> str:
        prod_id = product_data.get("id") or product_data.get("product_id")
        now = datetime.now(timezone.utc).isoformat()
        product_data["id"] = prod_id
        product_data["updated_at"] = now
        if "created_at" not in product_data:
            product_data["created_at"] = now

        if self.provider == "mongodb":
            self.mongo_db.products.update_one(
                {"_id": prod_id},
                {"$set": product_data},
                upsert=True
            )
            return prod_id
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO products (id, name, url, source, rating, review_count, image_url, is_demo, created_at, updated_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,
                    url=excluded.url,
                    source=excluded.source,
                    rating=excluded.rating,
                    review_count=excluded.review_count,
                    image_url=excluded.image_url,
                    is_demo=excluded.is_demo,
                    updated_at=excluded.updated_at,
                    metadata_json=excluded.metadata_json
                """, (
                    prod_id,
                    product_data.get("name", "Unknown Product"),
                    product_data.get("url", ""),
                    product_data.get("source", "Amazon"),
                    product_data.get("rating", 0.0),
                    product_data.get("review_count", 0),
                    product_data.get("image_url", ""),
                    1 if product_data.get("is_demo", False) else 0,
                    product_data.get("created_at", now),
                    now,
                    json.dumps(product_data.get("metadata", {}))
                ))
                conn.commit()
            return prod_id

    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        if self.provider == "mongodb":
            doc = self.mongo_db.products.find_one({"_id": product_id})
            if doc:
                doc["id"] = doc.pop("_id")
            return doc
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
                row = cursor.fetchone()
                if not row:
                    return None
                prod = dict(row)
                prod["is_demo"] = bool(prod["is_demo"])
                if prod.get("metadata_json"):
                    prod["metadata"] = json.loads(prod["metadata_json"])
                return prod

    def list_products(self, limit: int = 50) -> List[Dict[str, Any]]:
        if self.provider == "mongodb":
            docs = list(self.mongo_db.products.find().sort("updated_at", -1).limit(limit))
            for d in docs:
                d["id"] = d.pop("_id")
            return docs
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM products ORDER BY updated_at DESC LIMIT ?", (limit,))
                rows = cursor.fetchall()
                products = []
                for row in rows:
                    p = dict(row)
                    p["is_demo"] = bool(p["is_demo"])
                    if p.get("metadata_json"):
                        p["metadata"] = json.loads(p["metadata_json"])
                    products.append(p)
                return products

    def delete_product(self, product_id: str) -> bool:
        if self.provider == "mongodb":
            self.mongo_db.products.delete_one({"_id": product_id})
            self.mongo_db.reviews.delete_many({"product_id": product_id})
            self.mongo_db.analytics.delete_one({"product_id": product_id})
            return True
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
                cursor.execute("DELETE FROM reviews WHERE product_id = ?", (product_id,))
                cursor.execute("DELETE FROM analytics WHERE product_id = ?", (product_id,))
                conn.commit()
            return True

    # ==================== REVIEW METHODS ====================

    def save_reviews(self, product_id: str, reviews: List[Dict[str, Any]]) -> int:
        now = datetime.now(timezone.utc).isoformat()
        if self.provider == "mongodb":
            # Remove old reviews for fresh sync
            self.mongo_db.reviews.delete_many({"product_id": product_id})
            for r in reviews:
                r["product_id"] = product_id
                if "created_at" not in r:
                    r["created_at"] = now
            if reviews:
                self.mongo_db.reviews.insert_many(reviews)
            return len(reviews)
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM reviews WHERE product_id = ?", (product_id,))
                for r in reviews:
                    rev_id = r.get("id") or f"{product_id}_{r.get('reviewer', 'anon')}_{now}"
                    aspects_list = r.get("aspects", [])
                    cursor.execute("""
                    INSERT INTO reviews (
                        id, product_id, review_text, rating, sentiment, sentiment_score,
                        pos_score, neu_score, neg_score, reviewer, review_date, verified_purchase, source, aspects_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        rev_id,
                        product_id,
                        r.get("review_text", ""),
                        r.get("rating", 5.0),
                        r.get("sentiment", "Neutral"),
                        r.get("sentiment_score", 0.0),
                        r.get("pos_score", 0.0),
                        r.get("neu_score", 0.0),
                        r.get("neg_score", 0.0),
                        r.get("reviewer", "Amazon Customer"),
                        r.get("review_date", now[:10]),
                        1 if r.get("verified_purchase", True) else 0,
                        r.get("source", "Amazon"),
                        json.dumps(aspects_list),
                        now
                    ))
                conn.commit()
            return len(reviews)

    def get_reviews(self, product_id: str, filter_sentiment: Optional[str] = None,
                    filter_rating: Optional[float] = None, search: Optional[str] = None,
                    filter_aspect: Optional[str] = None,
                    limit: Optional[int] = None) -> List[Dict[str, Any]]:
        if self.provider == "mongodb":
            query = {"product_id": product_id}
            if filter_sentiment:
                query["sentiment"] = filter_sentiment.capitalize()
            if filter_rating:
                query["rating"] = float(filter_rating)
            if filter_aspect and filter_aspect.lower() != "all":
                query["aspects"] = {"$regex": filter_aspect, "$options": "i"}
            if search:
                query["review_text"] = {"$regex": search, "$options": "i"}
            cursor = self.mongo_db.reviews.find(query).sort("created_at", -1)
            if limit:
                cursor = cursor.limit(limit)
            results = list(cursor)
            for r in results:
                if "_id" in r:
                    r["id"] = str(r.pop("_id"))
            return results
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM reviews WHERE product_id = ?"
                params: List[Any] = [product_id]

                if filter_sentiment and filter_sentiment.lower() != "all":
                    query += " AND LOWER(sentiment) = ?"
                    params.append(filter_sentiment.lower())

                if filter_rating:
                    query += " AND rating = ?"
                    params.append(float(filter_rating))

                if filter_aspect and filter_aspect.lower() != "all":
                    query += " AND LOWER(aspects_json) LIKE ?"
                    params.append(f"%{filter_aspect.lower()}%")

                if search:
                    query += " AND LOWER(review_text) LIKE ?"
                    params.append(f"%{search.lower()}%")

                query += " ORDER BY rowid ASC"
                if limit:
                    query += " LIMIT ?"
                    params.append(limit)

                cursor.execute(query, params)
                rows = cursor.fetchall()
                results = []
                for row in rows:
                    r = dict(row)
                    r["verified_purchase"] = bool(r["verified_purchase"])
                    aspects_val = r.get("aspects_json")
                    if aspects_val:
                        try:
                            r["aspects"] = json.loads(aspects_val)
                        except Exception:
                            r["aspects"] = []
                    else:
                        r["aspects"] = r.get("aspects", [])
                    results.append(r)
                return results

    # ==================== ANALYTICS METHODS ====================

    def save_analytics(self, product_id: str, analytics_data: Dict[str, Any]):
        now = datetime.now(timezone.utc).isoformat()
        if self.provider == "mongodb":
            self.mongo_db.analytics.update_one(
                {"product_id": product_id},
                {"$set": {"product_id": product_id, "data": analytics_data, "updated_at": now}},
                upsert=True
            )
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO analytics (product_id, data_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(product_id) DO UPDATE SET
                    data_json=excluded.data_json,
                    updated_at=excluded.updated_at
                """, (product_id, json.dumps(analytics_data), now))
                conn.commit()

    def get_analytics(self, product_id: str) -> Optional[Dict[str, Any]]:
        if self.provider == "mongodb":
            doc = self.mongo_db.analytics.find_one({"product_id": product_id})
            return doc.get("data") if doc else None
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT data_json FROM analytics WHERE product_id = ?", (product_id,))
                row = cursor.fetchone()
                if row and row["data_json"]:
                    return json.loads(row["data_json"])
                return None

# Global Singleton Instance
db = DatabaseClient()
