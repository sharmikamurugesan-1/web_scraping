import csv
import io
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from models.db import db
from utils.validators import InputValidator
from scrapers.amazon_scraper import AmazonScraper
from scrapers.flipkart_scraper import FlipkartScraper
from scrapers.demo_scraper import DemoScraper
from services.sentiment_service import sentiment_service
from services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

class ProductService:
    def __init__(self):
        self.amazon_scraper = AmazonScraper()
        self.flipkart_scraper = FlipkartScraper()

    def analyze_product(self, query_or_url: str, source: str = "Amazon", max_reviews: int = 50) -> Dict[str, Any]:
        """
        Orchestrates scraping -> sentiment analysis -> persistence -> analytics calculation.
        """
        # Validate input
        is_valid, err_msg, meta = InputValidator.validate_input(query_or_url, source=source, max_reviews=max_reviews)
        if not is_valid:
            raise ValueError(err_msg)

        detected_source = meta["source"]
        count = meta["max_reviews"]

        # Step 1: Scrape
        if detected_source.lower() == "flipkart":
            scraped_data = self.flipkart_scraper.scrape(query_or_url, max_reviews=count)
        else:
            scraped_data = self.amazon_scraper.scrape(query_or_url, max_reviews=count)

        product_info = scraped_data["product"]
        raw_reviews = scraped_data["reviews"]
        is_demo = scraped_data.get("is_demo", False)

        # Step 2: NLP Sentiment Analysis & Aspect Tagging
        processed_reviews = sentiment_service.process_review_list(raw_reviews)
        aspects = sentiment_service.analyze_aspects(processed_reviews)

        # Update product metadata
        product_info["is_demo"] = is_demo
        product_info["review_count"] = len(processed_reviews)

        # Step 3: Persistence
        db.save_product(product_info)
        db.save_reviews(product_info["id"], processed_reviews)

        # Step 4: Analytics
        analytics = AnalyticsService.compute_analytics(processed_reviews, product_info, aspects)
        db.save_analytics(product_info["id"], analytics)

        return {
            "success": True,
            "product": product_info,
            "analytics": analytics,
            "review_sample": processed_reviews[:10],
            "total_reviews": len(processed_reviews),
            "is_demo": is_demo
        }

    def get_product_dashboard(self, product_id: str) -> Optional[Dict[str, Any]]:
        product = db.get_product(product_id)
        if not product:
            return None

        analytics = db.get_analytics(product_id)
        if not analytics:
            reviews = db.get_reviews(product_id)
            aspects = sentiment_service.analyze_aspects(reviews)
            analytics = AnalyticsService.compute_analytics(reviews, product, aspects)
            db.save_analytics(product_id, analytics)

        return {
            "product": product,
            "analytics": analytics
        }

    def compare_products(self, product_ids: List[str] = None, product_id_1: str = None, product_id_2: str = None) -> Dict[str, Any]:
        """
        Transparent comparison across 2 to 3 products without declaring an overall winner.
        Displays metric-by-metric differences and neutral comparative labels (Higher, Lower, Similar).
        """
        ids = []
        if product_ids and isinstance(product_ids, list):
            ids = [i for i in product_ids if i]
        else:
            if product_id_1:
                ids.append(product_id_1)
            if product_id_2:
                ids.append(product_id_2)

        # Limit to 3 products
        ids = ids[:3]
        if len(ids) < 2:
            raise ValueError("At least two product IDs are required for comparative intelligence.")

        dashboards = []
        for pid in ids:
            dash = self.get_product_dashboard(pid)
            if not dash:
                raise ValueError(f"Product '{pid}' not found in database.")
            dashboards.append(dash)

        # Metric-by-metric matrix
        metrics = [
            {"id": "rating", "label": "Average Star Rating", "unit": "★"},
            {"id": "total_reviews", "label": "Total Reviews Evaluated", "unit": ""},
            {"id": "health_score", "label": "Product Health Score", "unit": "/100"},
            {"id": "positive_pct", "label": "Positive Sentiment %", "unit": "%"},
            {"id": "neutral_pct", "label": "Neutral Sentiment %", "unit": "%"},
            {"id": "negative_pct", "label": "Negative Sentiment %", "unit": "%"},
            {"id": "sentiment_score", "label": "Net Sentiment Polarity", "unit": "index"}
        ]

        # Extract values for each product
        extracted = []
        for d in dashboards:
            p = d["product"]
            a = d["analytics"]
            hs = a.get("health_score", {}).get("score", 70.0)
            extracted.append({
                "id": p["id"],
                "name": p["name"],
                "source": p["source"],
                "image_url": p.get("image_url", ""),
                "values": {
                    "rating": a["average_rating"],
                    "total_reviews": a["total_reviews"],
                    "health_score": hs,
                    "positive_pct": a["sentiment_percentages"]["positive"],
                    "neutral_pct": a["sentiment_percentages"]["neutral"],
                    "negative_pct": a["sentiment_percentages"]["negative"],
                    "sentiment_score": a["average_sentiment_score"]
                },
                "aspects": a.get("aspect_analysis", [])
            })

        # Calculate peer averages for neutral labels
        comparison_matrix = []
        for m in metrics:
            m_id = m["id"]
            vals = [p["values"][m_id] for p in extracted]
            mean_val = sum(vals) / len(vals)

            product_cells = []
            for p in extracted:
                val = p["values"][m_id]
                diff = round(val - mean_val, 2)
                # Determine neutral trend descriptor
                tolerance = 0.5 if m_id in ("positive_pct", "neutral_pct", "negative_pct", "health_score") else 0.05
                if abs(diff) <= tolerance:
                    label = "Similar"
                    badge_style = "neutral"
                elif diff > 0:
                    label = "Higher" if m_id != "negative_pct" else "Elevated"
                    badge_style = "positive" if m_id != "negative_pct" else "negative"
                else:
                    label = "Lower" if m_id != "negative_pct" else "Controlled"
                    badge_style = "negative" if m_id != "negative_pct" else "positive"

                product_cells.append({
                    "product_id": p["id"],
                    "product_name": p["name"],
                    "value": val,
                    "diff_from_avg": diff,
                    "trend_label": label,
                    "badge_style": badge_style
                })

            comparison_matrix.append({
                "metric_id": m["id"],
                "metric_label": m["label"],
                "unit": m["unit"],
                "cells": product_cells
            })

        # Aspect Comparison Matrix across products
        all_aspect_names = set()
        for p in extracted:
            for asp in p["aspects"]:
                all_aspect_names.add(asp["aspect"])

        aspect_comparison = []
        for asp_name in sorted(all_aspect_names):
            asp_cells = []
            for p in extracted:
                match = next((a for a in p["aspects"] if a["aspect"] == asp_name), None)
                if match:
                    asp_cells.append({
                        "product_id": p["id"],
                        "mention_count": match["mention_count"],
                        "pos_percent": match["pos_percent"],
                        "neg_percent": match["neg_percent"],
                        "avg_sentiment": match["avg_sentiment"],
                        "overall": match["overall"]
                    })
                else:
                    asp_cells.append({
                        "product_id": p["id"],
                        "mention_count": 0,
                        "pos_percent": 0.0,
                        "neg_percent": 0.0,
                        "avg_sentiment": 0.0,
                        "overall": "N/A"
                    })
            aspect_comparison.append({
                "aspect": asp_name,
                "products": asp_cells
            })

        return {
            "products": dashboards,
            "comparison_matrix": comparison_matrix,
            "aspect_comparison": aspect_comparison,
            # Backwards compatibility fields for 2-product consumers
            "product_1": dashboards[0] if len(dashboards) >= 1 else None,
            "product_2": dashboards[1] if len(dashboards) >= 2 else None,
            "product_3": dashboards[2] if len(dashboards) >= 3 else None
        }

    def export_csv(self, product_id: str) -> str:
        product = db.get_product(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found.")

        reviews = db.get_reviews(product_id)
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Review ID", "Product Name", "Product Source", "Rating", "Sentiment Label",
            "Compound Sentiment Score", "Positive Score", "Neutral Score", "Negative Score",
            "Detected Aspects", "Reviewer Name", "Review Date", "Verified Purchase", "Review Text"
        ])

        for r in reviews:
            aspects_str = ", ".join(r.get("aspects", []))
            writer.writerow([
                r.get("id"),
                product.get("name"),
                product.get("source"),
                r.get("rating"),
                r.get("sentiment"),
                r.get("sentiment_score"),
                r.get("pos_score"),
                r.get("neu_score"),
                r.get("neg_score"),
                aspects_str,
                r.get("reviewer"),
                r.get("review_date"),
                "Yes" if r.get("verified_purchase") else "No",
                r.get("review_text")
            ])

        return output.getvalue()

    def export_json(self, product_id: str) -> str:
        dash = self.get_product_dashboard(product_id)
        if not dash:
            raise ValueError(f"Product {product_id} not found.")

        reviews = db.get_reviews(product_id)
        export_payload = {
            "metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "export_format": "Sentilytics AI Intelligence Report v2.0",
            },
            "product": dash["product"],
            "analytics": dash["analytics"],
            "reviews": reviews
        }
        return json.dumps(export_payload, indent=2)

product_service = ProductService()
