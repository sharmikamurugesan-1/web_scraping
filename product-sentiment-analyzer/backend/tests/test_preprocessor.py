import pytest
from utils.text_preprocessor import TextPreprocessor

def test_clean_text_basic():
    raw = "<p>This is a <b>great</b> phone!</p>"
    cleaned = TextPreprocessor.clean_text_for_vader(raw)
    assert "<p>" not in cleaned
    assert "great" in cleaned

def test_clean_text_url_removal():
    raw = "Check this link https://example.com/item for details. It works!"
    cleaned = TextPreprocessor.clean_text_for_vader(raw)
    assert "https://" not in cleaned
    assert "works" in cleaned

def test_preserves_negations():
    raw = "The phone is not good and barely works."
    cleaned = TextPreprocessor.clean_text_for_vader(raw)
    assert "not" in cleaned
    assert "barely" in cleaned

def test_extract_keywords():
    text = "The battery life is phenomenal and screen display is super clear and bright."
    keywords = TextPreprocessor.extract_keywords(text)
    assert "battery" in keywords
    assert "screen" in keywords
    # Stopwords should be removed
    assert "the" not in keywords
    assert "and" not in keywords
