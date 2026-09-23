import pytest
from app import create_app
from services.analytics_service import AnalyticsService
from services.sentiment_service import sentiment_service
from services.product_service import product_service

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_score_calculation():
    # Test healthy scenario
    health = AnalyticsService.calculate_health_score(
        avg_rating=4.8,
        pos_pct=85.0,
        neg_pct=8.0,
        total_reviews=50,
        avg_sentiment=0.65
    )
    assert 80.0 <= health["score"] <= 100.0
    assert health["status"] in ("Healthy", "Exceptional")
    assert "factors" in health
    assert len(health["factors"]) == 5
    assert "disclaimer" in health

def test_aspect_tagging_in_sentiment():
    text = "The battery backup lasts 12 hours, camera zoom is super clear, but build quality feels plasticky."
    res = sentiment_service.detect_aspects_for_text(text)
    assert "Battery & Power" in res
    assert "Camera & Optics" in res
    assert "Quality & Durability" in res

def test_customer_insights_and_ai_summary():
    product = {"name": "Test Smartphone Pro", "source": "Amazon", "id": "test_p", "is_demo": True}
    reviews = [
        {"review_text": "Battery life is sensational and camera is stellar!", "sentiment": "Positive", "sentiment_score": 0.8, "rating": 5.0, "aspects": ["Battery & Power", "Camera & Optics"]},
        {"review_text": "Camera takes breathtaking portraits.", "sentiment": "Positive", "sentiment_score": 0.75, "rating": 5.0, "aspects": ["Camera & Optics"]},
        {"review_text": "Overheating issues and battery drain after software update.", "sentiment": "Negative", "sentiment_score": -0.65, "rating": 2.0, "aspects": ["Battery & Power"]}
    ]
    aspects = sentiment_service.analyze_aspects(reviews)
    analytics = AnalyticsService.compute_analytics(reviews, product, aspects)

    assert "health_score" in analytics
    assert "customer_insights" in analytics
    assert "ai_summary" in analytics
    assert "data_quality" in analytics
    assert "alerts" in analytics

    assert len(analytics["customer_insights"]["pain_points"]) > 0 or len(analytics["customer_insights"]["loved_features"]) > 0
    assert "executive_verdict" in analytics["ai_summary"]

def test_3_product_comparison(client):
    # Ensure 3 demo products are analyzed
    p1 = product_service.analyze_product("demo_iphone_15_pro", source="Amazon", max_reviews=10)
    p2 = product_service.analyze_product("demo_sony_wh1000xm5", source="Amazon", max_reviews=10)
    p3 = product_service.analyze_product("demo_samsung_s24_ultra", source="Flipkart", max_reviews=10)

    comparison = product_service.compare_products(product_ids=["demo_iphone_15_pro", "demo_sony_wh1000xm5", "demo_samsung_s24_ultra"])
    assert len(comparison["products"]) == 3
    assert len(comparison["comparison_matrix"]) > 0
    # Confirm no "winner" label is declared
    assert "winner" not in comparison.get("comparison", {})
