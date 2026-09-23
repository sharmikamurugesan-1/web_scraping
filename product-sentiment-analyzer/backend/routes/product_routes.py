import logging
from flask import Blueprint, request, jsonify, Response
from models.db import db
from services.product_service import product_service
from scrapers.demo_scraper import DemoScraper

logger = logging.getLogger(__name__)
product_bp = Blueprint("products", __name__)

@product_bp.route("/analyze", methods=["POST"])
def analyze_product():
    """
    Main analysis endpoint: collects reviews, performs NLP, calculates metrics.
    """
    data = request.get_json() or {}
    query_or_url = data.get("query_or_url") or data.get("url") or data.get("query", "")
    source = data.get("source", "Amazon")
    max_reviews = data.get("max_reviews", 40)

    if not query_or_url:
        return jsonify({"success": False, "error": "Query or Product URL is required."}), 400

    try:
        result = product_service.analyze_product(query_or_url, source=source, max_reviews=max_reviews)
        return jsonify(result), 200
    except Exception as e:
        logger.exception("Error in analyze_product")
        return jsonify({"success": False, "error": str(e)}), 500

@product_bp.route("", methods=["GET"])
def list_products():
    """
    Returns previously analyzed products with health score summaries.
    """
    limit = int(request.args.get("limit", 50))
    products = db.list_products(limit=limit)
    # Augment with cached health scores if available
    for p in products:
        analytics = db.get_analytics(p["id"])
        if analytics and "health_score" in analytics:
            p["health_score"] = analytics["health_score"]["score"]
            p["health_status"] = analytics["health_score"]["status"]
        else:
            p["health_score"] = round((p.get("rating", 4.5) / 5.0) * 85.0, 1)
            p["health_status"] = "Healthy"
    return jsonify({"success": True, "products": products, "count": len(products)}), 200

@product_bp.route("/presets", methods=["GET"])
def get_presets():
    """
    Returns curated demo presets for one-click instant testing.
    """
    presets = DemoScraper.get_all_products()
    sanitized = [
        {
            "id": p["id"],
            "name": p["name"],
            "source": p["source"],
            "rating": p["rating"],
            "review_count": p["review_count"],
            "image_url": p["image_url"],
            "is_demo": True
        }
        for p in presets
    ]
    return jsonify({"success": True, "presets": sanitized}), 200

@product_bp.route("/<product_id>", methods=["GET"])
def get_product(product_id: str):
    """
    Fetches product information and cached analytics.
    """
    dashboard = product_service.get_product_dashboard(product_id)
    if not dashboard:
        return jsonify({"success": False, "error": f"Product with ID '{product_id}' not found."}), 404
    return jsonify({"success": True, **dashboard}), 200

@product_bp.route("/<product_id>/reviews", methods=["GET"])
def get_reviews(product_id: str):
    """
    Fetches filtered reviews for a product.
    Supports query params: sentiment, rating, search, aspect, limit.
    """
    sentiment = request.args.get("sentiment")
    rating = request.args.get("rating")
    search = request.args.get("search")
    aspect = request.args.get("aspect")
    limit = request.args.get("limit")
    limit_val = int(limit) if limit and limit.isdigit() else None

    reviews = db.get_reviews(
        product_id,
        filter_sentiment=sentiment,
        filter_rating=float(rating) if rating else None,
        search=search,
        filter_aspect=aspect,
        limit=limit_val
    )
    return jsonify({"success": True, "reviews": reviews, "count": len(reviews)}), 200

@product_bp.route("/<product_id>/analytics", methods=["GET"])
def get_analytics(product_id: str):
    """
    Retrieves analytics metrics for a product.
    """
    analytics = db.get_analytics(product_id)
    if not analytics:
        return jsonify({"success": False, "error": "Analytics not found."}), 404
    return jsonify({"success": True, "analytics": analytics}), 200

@product_bp.route("/<product_id>/health-score", methods=["GET"])
def get_health_score(product_id: str):
    """
    Returns the application-defined analytical health score.
    """
    analytics = db.get_analytics(product_id)
    if not analytics or "health_score" not in analytics:
        dashboard = product_service.get_product_dashboard(product_id)
        if not dashboard:
            return jsonify({"success": False, "error": "Product not found."}), 404
        analytics = dashboard["analytics"]
    return jsonify({"success": True, "health_score": analytics.get("health_score")}), 200

@product_bp.route("/<product_id>/insights", methods=["GET"])
def get_insights(product_id: str):
    """
    Returns mined Customer Pain Points and What Customers Love.
    """
    analytics = db.get_analytics(product_id)
    if not analytics or "customer_insights" not in analytics:
        dashboard = product_service.get_product_dashboard(product_id)
        if not dashboard:
            return jsonify({"success": False, "error": "Product not found."}), 404
        analytics = dashboard["analytics"]
    return jsonify({"success": True, "insights": analytics.get("customer_insights")}), 200

@product_bp.route("/<product_id>/summary", methods=["GET"])
def get_ai_summary(product_id: str):
    """
    Returns the deterministic extractive AI review summary.
    """
    analytics = db.get_analytics(product_id)
    if not analytics or "ai_summary" not in analytics:
        dashboard = product_service.get_product_dashboard(product_id)
        if not dashboard:
            return jsonify({"success": False, "error": "Product not found."}), 404
        analytics = dashboard["analytics"]
    return jsonify({"success": True, "ai_summary": analytics.get("ai_summary")}), 200

@product_bp.route("/<product_id>/alerts", methods=["GET"])
def get_alerts(product_id: str):
    """
    Returns threshold alerts for sentiment and ratings.
    """
    analytics = db.get_analytics(product_id)
    if not analytics or "alerts" not in analytics:
        dashboard = product_service.get_product_dashboard(product_id)
        if not dashboard:
            return jsonify({"success": False, "error": "Product not found."}), 404
        analytics = dashboard["analytics"]
    return jsonify({"success": True, "alerts": analytics.get("alerts", [])}), 200

@product_bp.route("/compare", methods=["POST"])
def compare_products():
    """
    Compares 2 to 3 analyzed products side-by-side with transparent differences.
    """
    data = request.get_json() or {}
    product_ids = data.get("product_ids") or []
    if not product_ids:
        p1 = data.get("product_id_1")
        p2 = data.get("product_id_2")
        p3 = data.get("product_id_3")
        product_ids = [p for p in (p1, p2, p3) if p]

    if len(product_ids) < 2:
        return jsonify({"success": False, "error": "At least two product IDs are required for comparison."}), 400

    try:
        comparison = product_service.compare_products(product_ids=product_ids)
        return jsonify({"success": True, **comparison}), 200
    except Exception as e:
        logger.exception("Error in compare_products")
        return jsonify({"success": False, "error": str(e)}), 400

@product_bp.route("/<product_id>/export", methods=["GET"])
def export_data(product_id: str):
    """
    Exports product reviews with sentiment scores as CSV or JSON.
    """
    export_format = request.args.get("format", "csv").lower()
    try:
        if export_format == "json":
            json_data = product_service.export_json(product_id)
            return Response(
                json_data,
                mimetype="application/json",
                headers={"Content-disposition": f"attachment; filename=intelligence_{product_id}.json"}
            )
        else:
            csv_data = product_service.export_csv(product_id)
            return Response(
                csv_data,
                mimetype="text/csv",
                headers={"Content-disposition": f"attachment; filename=reviews_{product_id}.csv"}
            )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 404

@product_bp.route("/<product_id>", methods=["DELETE"])
def delete_product(product_id: str):
    """
    Deletes product and its reviews.
    """
    db.delete_product(product_id)
    return jsonify({"success": True, "message": f"Product {product_id} deleted."}), 200
