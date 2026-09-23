"""
Unit Tests for CineRank Flask REST API and HTML Page Routes.
"""

import unittest
import json
import os
import sys

# Ensure application package is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app, CSV_PATH


class CineRankApiTestCase(unittest.TestCase):
    """Test suite for CineRank web routes and API endpoints."""

    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_page_routes_status_codes(self):
        """Verify all main HTML views render with HTTP 200 OK."""
        routes = ["/", "/dashboard", "/movies", "/movies/1", "/analytics", "/scraper", "/about"]
        for route in routes:
            with self.subTest(route=route):
                response = self.client.get(route)
                self.assertEqual(response.status_code, 200)
                self.assertIn(b"Cine", response.data)

    def test_api_stats_endpoint(self):
        """Test /api/stats returns accurate statistics payload."""
        response = self.client.get("/api/stats")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        self.assertIn("stats", data)
        stats = data["stats"]
        self.assertIn("total_movies", stats)
        self.assertGreaterEqual(stats["total_movies"], 1)
        self.assertIn("avg_rating", stats)
        self.assertIn("highest_rated_movie", stats)

    def test_api_movies_pagination(self):
        """Test /api/movies default pagination and limit."""
        response = self.client.get("/api/movies?page=1&limit=10")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("page"), 1)
        self.assertEqual(data.get("limit"), 10)
        self.assertEqual(len(data.get("movies", [])), 10)

    def test_api_movies_search_filter(self):
        """Test searching by query string."""
        response = self.client.get("/api/movies?q=godfather")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        movies = data.get("movies", [])
        self.assertGreater(len(movies), 0)
        for m in movies:
            self.assertIn("godfather", m["Title"].lower())

    def test_api_movies_rating_filter(self):
        """Test filtering by min_rating parameter."""
        response = self.client.get("/api/movies?min_rating=9.0")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        for m in data.get("movies", []):
            self.assertGreaterEqual(float(m["IMDb Rating"]), 9.0)

    def test_api_movies_by_rank(self):
        """Test retrieving a single movie by rank."""
        response = self.client.get("/api/movies/1")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        self.assertEqual(data["movie"]["Rank"], 1)

    def test_api_movies_invalid_rank_404(self):
        """Test 404 response when querying a non-existent rank."""
        response = self.client.get("/api/movies/99999")
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data.get("success"))

    def test_api_analytics_endpoint(self):
        """Test /api/analytics returns chart-ready payloads."""
        response = self.client.get("/api/analytics")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        payload = data["data"]
        self.assertIn("rating_distribution", payload)
        self.assertIn("movies_by_decade", payload)
        self.assertIn("top_rated", payload)
        self.assertIn("rating_vs_year", payload)

    def test_api_scrape_status(self):
        """Test /api/scrape/status endpoint."""
        response = self.client.get("/api/scrape/status")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertTrue(data.get("success"))
        self.assertIn("status", data)
        self.assertIn("progress", data["status"])

    def test_csv_download_endpoint(self):
        """Test direct CSV download endpoint returns text/csv."""
        response = self.client.get("/api/download")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.headers["Content-Type"].startswith("text/csv"))


if __name__ == "__main__":
    unittest.main()
