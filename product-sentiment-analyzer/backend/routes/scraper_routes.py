from flask import Blueprint, request, jsonify
from scrapers.amazon_scraper import AmazonScraper
from scrapers.flipkart_scraper import FlipkartScraper

scraper_bp = Blueprint("scraper", __name__)

@scraper_bp.route("/scrape", methods=["POST"])
def direct_scrape():
    """
    Direct scraper preview endpoint.
    """
    data = request.get_json() or {}
    query_or_url = data.get("query_or_url") or data.get("url", "")
    source = data.get("source", "Amazon")
    max_reviews = data.get("max_reviews", 20)

    if not query_or_url:
        return jsonify({"success": False, "error": "URL or query is required."}), 400

    scraper = FlipkartScraper() if source.lower() == "flipkart" else AmazonScraper()
    result = scraper.scrape(query_or_url, max_reviews=max_reviews)
    return jsonify({"success": True, **result}), 200
