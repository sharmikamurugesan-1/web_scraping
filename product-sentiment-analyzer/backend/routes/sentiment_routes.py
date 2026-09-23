from flask import Blueprint, request, jsonify
from services.sentiment_service import sentiment_service

sentiment_bp = Blueprint("sentiment", __name__)

@sentiment_bp.route("/analyze", methods=["POST"])
def analyze_single_text():
    """
    On-the-fly sentiment analysis for individual sentences or custom reviews.
    Used by the Interactive Live Sentiment Playground!
    """
    data = request.get_json() or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"success": False, "error": "Text parameter is required."}), 400

    result = sentiment_service.analyze_text(text)
    return jsonify({"success": True, "analysis": result}), 200
