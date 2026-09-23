"""
Unit Tests for CineRank Scraper Engine, Data Validation, and Analytics Functions.
"""

import unittest
import os
import sys
import pandas as pd

# Ensure application package is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scraper import IMDbScraper, get_scraper_instance
from app import CSV_PATH, get_movies_df, compute_statistics, compute_analytics_data


class CineRankScraperTestCase(unittest.TestCase):
    """Test suite for Scraper state machine and Pandas data processing."""

    def test_singleton_instance(self):
        """Verify get_scraper_instance returns a stable singleton."""
        instance1 = get_scraper_instance()
        instance2 = get_scraper_instance()
        self.assertIs(instance1, instance2)

    def test_scraper_status_contract(self):
        """Verify get_status returns dictionary conforming to schema."""
        scraper = get_scraper_instance()
        status = scraper.get_status()

        self.assertIsInstance(status, dict)
        self.assertIn("status", status)
        self.assertIn("progress", status)
        self.assertIn("scraped_count", status)
        self.assertIn("current_movie", status)
        self.assertIn("message", status)
        self.assertIn("last_scraped_time", status)
        self.assertIn("is_demo", status)

    def test_scraper_stop_flag(self):
        """Verify stop_scraping triggers the internal stop flag."""
        scraper = get_scraper_instance()
        scraper.stop_scraping()
        self.assertTrue(scraper.cancel_requested)

    def test_movies_csv_schema_and_integrity(self):
        """Verify data/movies.csv has standard required columns and valid records."""
        self.assertTrue(os.path.exists(CSV_PATH), f"CSV path {CSV_PATH} must exist.")
        df = pd.read_csv(CSV_PATH)

        expected_cols = ["Rank", "Title", "Year", "IMDb Rating", "Poster", "IMDb URL"]
        for col in expected_cols:
            self.assertIn(col, df.columns, f"Column '{col}' must be present in movies.csv")

        self.assertGreaterEqual(len(df), 250, "Dataset should contain at least 250 records.")

        # Data integrity checks
        self.assertTrue((df["Rank"] > 0).all(), "All ranks should be positive integers.")
        self.assertTrue((df["Year"] >= 1900).all(), "All movie release years should be >= 1900.")
        self.assertTrue((df["IMDb Rating"] >= 5.0).all(), "Top 250 ratings should be >= 5.0.")
        self.assertTrue((df["IMDb Rating"] <= 10.0).all(), "IMDb ratings cannot exceed 10.0.")

    def test_compute_statistics(self):
        """Verify global statistics derivation accuracy."""
        df = get_movies_df()
        stats = compute_statistics(df)

        self.assertGreaterEqual(stats["total_movies"], 250)
        self.assertGreaterEqual(stats["avg_rating"], 7.0)
        self.assertLessEqual(stats["avg_rating"], 9.5)
        self.assertGreaterEqual(stats["highest_rating"], 9.0)
        self.assertIn("The Shawshank Redemption", stats["highest_rated_movie"])

    def test_compute_statistics_empty_dataframe(self):
        """Verify safe handling of empty DataFrames without crash."""
        empty_df = pd.DataFrame(columns=["Rank", "Title", "Year", "IMDb Rating", "Poster", "IMDb URL"])
        stats = compute_statistics(empty_df)
        self.assertEqual(stats["total_movies"], 0)
        self.assertEqual(stats["highest_rated_movie"], "N/A")

    def test_compute_analytics_data_structure(self):
        """Verify analytics aggregation keys and shapes."""
        df = get_movies_df()
        analytics = compute_analytics_data(df)

        # 1. Rating Distribution
        self.assertIn("rating_distribution", analytics)
        dist = analytics["rating_distribution"]
        self.assertEqual(len(dist["labels"]), len(dist["data"]))
        self.assertEqual(sum(dist["data"]), len(df))

        # 2. Decade Breakdown
        self.assertIn("movies_by_decade", analytics)
        decades = analytics["movies_by_decade"]
        self.assertEqual(len(decades["labels"]), len(decades["data"]))
        self.assertEqual(sum(decades["data"]), len(df))

        # 3. Top 10 Rated
        self.assertIn("top_rated", analytics)
        top = analytics["top_rated"]
        self.assertEqual(len(top["titles"]), 10)
        self.assertEqual(len(top["ratings"]), 10)

        # 4. Rating vs Year Scatter
        self.assertIn("rating_vs_year", analytics)
        scatter = analytics["rating_vs_year"]
        self.assertEqual(len(scatter), len(df))
        self.assertIn("x", scatter[0])
        self.assertIn("y", scatter[0])
        self.assertIn("title", scatter[0])


if __name__ == "__main__":
    unittest.main()
