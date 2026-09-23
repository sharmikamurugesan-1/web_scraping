import pytest
from services.sentiment_service import sentiment_service

def test_positive_sentiment():
    text = "Absolutely love this laptop! Fast, gorgeous screen and amazing battery life."
    result = sentiment_service.analyze_text(text)
    assert result["sentiment"] == "Positive"
    assert result["sentiment_score"] > 0.05
    assert result["pos_score"] > 0

def test_negative_sentiment():
    text = "Horrible device. Overheats immediately and screen cracked on first drop. Waste of money."
    result = sentiment_service.analyze_text(text)
    assert result["sentiment"] == "Negative"
    assert result["sentiment_score"] < -0.05
    assert result["neg_score"] > 0

def test_neutral_sentiment():
    text = "The package arrived on Tuesday. It is rectangular and wrapped in cardboard."
    result = sentiment_service.analyze_text(text)
    assert result["sentiment"] in ("Neutral", "Positive") # neutral statement
    assert abs(result["sentiment_score"]) < 0.3

def test_aspect_analysis():
    reviews = [
        {"review_text": "Battery life is sensational and charges fast.", "sentiment": "Positive", "sentiment_score": 0.8},
        {"review_text": "Battery drains in 2 hours. Terrible power backup.", "sentiment": "Negative", "sentiment_score": -0.7}
    ]
    aspects = sentiment_service.analyze_aspects(reviews)
    battery_aspect = next((a for a in aspects if "Battery" in a["aspect"]), None)
    assert battery_aspect is not None
    assert battery_aspect["mention_count"] == 2
