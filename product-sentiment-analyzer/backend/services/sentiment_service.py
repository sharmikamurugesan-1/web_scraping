import logging
from typing import Dict, Any, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from utils.text_preprocessor import TextPreprocessor
from config import Config

logger = logging.getLogger(__name__)

class SentimentService:
    """
    NLP Sentiment Analysis Service using VADER.
    Optimized for social and consumer product review sentiment.
    """
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.pos_threshold = Config.VADER_POS_THRESHOLD
        self.neg_threshold = Config.VADER_NEG_THRESHOLD

        # 9 Core Consumer Product Dimensions for Aspect-Based Sentiment Mining
        self.aspect_keywords = {
            "Battery & Power": ["battery", "charging", "charger", "backup", "drain", "power", "mah", "runtime", "heating", "warm"],
            "Performance & Speed": ["performance", "speed", "fast", "slow", "lag", "smooth", "processor", "chip", "gaming", "multitasking", "hang", "snapdragon", "bionic", "m2", "a17"],
            "Camera & Optics": ["camera", "photo", "picture", "lens", "night mode", "video", "sensor", "portrait", "selfie", "clarity", "zoom", "megapixels", "prores"],
            "Display & Screen": ["display", "screen", "amoled", "brightness", "bezel", "colors", "resolution", "refresh rate", "oled", "glare", "retina", "promotion"],
            "Price & Value": ["price", "value", "worth", "expensive", "cheap", "cost", "affordable", "deal", "investment", "overpriced", "bargain"],
            "Quality & Durability": ["build", "quality", "durability", "durable", "sturdy", "premium", "plastic", "metal", "weight", "finish", "titanium", "hinges", "creak", "cracked"],
            "Design & Ergonomics": ["design", "look", "sleek", "compact", "comfort", "comfortable", "headband", "earcups", "fit", "form factor", "grip", "heavy"],
            "Delivery & Packaging": ["delivery", "shipping", "delivered", "package", "packaging", "box", "fast delivery", "delayed", "courier", "arrived"],
            "Customer Service & Support": ["service", "support", "warranty", "return", "refund", "replacement", "customer care", "apple care", "seller", "policy"]
        }

    def classify_compound(self, compound: float) -> str:
        if compound >= self.pos_threshold:
            return "Positive"
        elif compound <= self.neg_threshold:
            return "Negative"
        else:
            return "Neutral"

    def analyze_text(self, raw_text: str) -> Dict[str, Any]:
        """
        Analyzes a single text string and returns full sentiment metrics.
        """
        cleaned_text = TextPreprocessor.clean_text_for_vader(raw_text)
        if not cleaned_text:
            return {
                "sentiment": "Neutral",
                "sentiment_score": 0.0,
                "pos_score": 0.0,
                "neu_score": 1.0,
                "neg_score": 0.0,
                "cleaned_text": "",
                "keywords": []
            }

        scores = self.analyzer.polarity_scores(cleaned_text)
        compound = round(scores["compound"], 4)
        pos = round(scores["pos"], 4)
        neu = round(scores["neu"], 4)
        neg = round(scores["neg"], 4)
        sentiment = self.classify_compound(compound)
        keywords = TextPreprocessor.extract_keywords(cleaned_text, top_n=8)

        return {
            "sentiment": sentiment,
            "sentiment_score": compound,
            "pos_score": pos,
            "neu_score": neu,
            "neg_score": neg,
            "cleaned_text": cleaned_text,
            "keywords": keywords
        }

    def detect_aspects_for_text(self, text: str) -> List[str]:
        """
        Detects which aspects are mentioned in a review text.
        """
        lower = text.lower()
        detected = []
        for aspect_name, terms in self.aspect_keywords.items():
            if any(term in lower for term in terms):
                detected.append(aspect_name)
        return detected

    def analyze_aspects(self, reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Computes aspect-based sentiment metrics across a collection of reviews.
        """
        aspect_results = {}
        for aspect_name in self.aspect_keywords:
            aspect_results[aspect_name] = {
                "aspect": aspect_name,
                "mention_count": 0,
                "pos_count": 0,
                "neu_count": 0,
                "neg_count": 0,
                "avg_score": 0.0,
                "scores": []
            }

        for r in reviews:
            text = (r.get("review_text", "")).lower()
            sentiment = r.get("sentiment", "Neutral")
            score = r.get("sentiment_score", 0.0)

            for aspect_name, terms in self.aspect_keywords.items():
                if any(term in text for term in terms):
                    aspect_results[aspect_name]["mention_count"] += 1
                    aspect_results[aspect_name]["scores"].append(score)
                    if sentiment == "Positive":
                        aspect_results[aspect_name]["pos_count"] += 1
                    elif sentiment == "Negative":
                        aspect_results[aspect_name]["neg_count"] += 1
                    else:
                        aspect_results[aspect_name]["neu_count"] += 1

        output = []
        for aspect_name, data in aspect_results.items():
            if data["mention_count"] > 0:
                avg = sum(data["scores"]) / len(data["scores"])
                output.append({
                    "aspect": aspect_name,
                    "mention_count": data["mention_count"],
                    "pos_percent": round((data["pos_count"] / data["mention_count"]) * 100, 1),
                    "neu_percent": round((data["neu_count"] / data["mention_count"]) * 100, 1),
                    "neg_percent": round((data["neg_count"] / data["mention_count"]) * 100, 1),
                    "avg_sentiment": round(avg, 3),
                    "overall": "Positive" if avg >= 0.05 else ("Negative" if avg <= -0.05 else "Neutral")
                })

        output.sort(key=lambda x: x["mention_count"], reverse=True)
        return output

    def process_review_list(self, raw_reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes a list of raw review dictionaries, executes NLP analysis,
        and annotates each review with sentiment metrics and detected aspects.
        """
        processed = []
        for r in raw_reviews:
            text = r.get("review_text", "")
            metrics = self.analyze_text(text)
            detected_aspects = self.detect_aspects_for_text(text)

            review_dict = {
                "id": r.get("id"),
                "product_id": r.get("product_id"),
                "review_text": text,
                "rating": float(r.get("rating", 5.0)),
                "sentiment": metrics["sentiment"],
                "sentiment_score": metrics["sentiment_score"],
                "pos_score": metrics["pos_score"],
                "neu_score": metrics["neu_score"],
                "neg_score": metrics["neg_score"],
                "reviewer": r.get("reviewer", "Customer"),
                "review_date": r.get("review_date", ""),
                "verified_purchase": r.get("verified_purchase", True),
                "source": r.get("source", "Amazon"),
                "keywords": metrics["keywords"],
                "aspects": detected_aspects
            }
            processed.append(review_dict)
        return processed

sentiment_service = SentimentService()
