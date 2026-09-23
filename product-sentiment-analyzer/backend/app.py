import os
import sys
import logging
from datetime import datetime, timezone
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models.db import db
from routes.product_routes import product_bp
from routes.sentiment_routes import sentiment_bp
from routes.scraper_routes import scraper_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentiment_analyzer")

from flask import Flask, jsonify, send_from_directory

def create_app(config_class=Config):
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
    app = Flask(__name__, static_folder=dist_dir if os.path.exists(dist_dir) else None)
    app.config.from_object(config_class)

    # Enable CORS for frontend communication
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(sentiment_bp, url_prefix="/api/sentiment")
    app.register_blueprint(scraper_bp, url_prefix="/api/scraper")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_status = db.get_status()
        return jsonify({
            "status": "healthy",
            "service": "Product Sentiment Analyzer API",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": db_status
        }), 200

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"success": False, "error": "Endpoint not found"}), 404
        if os.path.exists(os.path.join(dist_dir, path)) and path != "":
            return send_from_directory(dist_dir, path)
        if os.path.exists(os.path.join(dist_dir, "index.html")):
            return send_from_directory(dist_dir, "index.html")
        return jsonify({
            "service": "Product Sentiment Analyzer API",
            "message": "Frontend build not detected. Run 'npm run build' or access Vite on port 3000.",
            "health": "/api/health"
        }), 200

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    logger.info(f"Starting Product Sentiment Analyzer backend on port {Config.PORT}...")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
