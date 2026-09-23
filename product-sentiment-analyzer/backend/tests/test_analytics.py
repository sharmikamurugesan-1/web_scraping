import pytest
from services.analytics_service import AnalyticsService

def test_compute_analytics_metrics():
    product = {"id": "test_p1", "name": "Test Earbuds", "source": "Amazon", "rating": 4.5, "is_demo": True}
    reviews = [
        {"id": "1", "review_text": "Superb sound and bass.", "rating": 5.0, "sentiment": "Positive", "sentiment_score": 0.85, "review_date": "2026-03-01"},
        {"id": "2", "review_text": "Decent for the price.", "rating": 3.0, "sentiment": "Neutral", "sentiment_score": 0.02, "review_date": "2026-03-02"},
        {"id": "3", "review_text": "Stopped working in a week.", "rating": 1.0, "sentiment": "Negative", "sentiment_score": -0.65, "review_date": "2026-03-03"}
    ]
    aspects = []
    
    analytics = AnalyticsService.compute_analytics(reviews, product, aspects)
    assert analytics["total_reviews"] == 3
    assert analytics["sentiment_counts"]["positive"] == 1
    assert analytics["sentiment_counts"]["neutral"] == 1
    assert analytics["sentiment_counts"]["negative"] == 1
    assert len(analytics["rating_distribution"]) == 5
    assert len(analytics["top_positive_reviews"]) >= 1
    assert len(analytics["top_negative_reviews"]) >= 1
