"""
CineRank — IMDb Movie Intelligence Dashboard
Flask web application providing real-time scraping controls, interactive Top 250 explorer,
rich Chart.js analytics, and Pandas CSV export.
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from flask import Flask, render_template, request, jsonify, send_file, Response
import pandas as pd

from scraper import IMDbScraper, get_scraper_instance

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("CineRank.App")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "movies.csv")

app = Flask(__name__)
app.secret_key = "cinerank_cinematic_gold_secret_key_2026"

scraper_service = get_scraper_instance()


# ==========================================
# DATA ACCESS & UTILITY HELPERS
# ==========================================

def get_movies_df() -> pd.DataFrame:
    """Load movies from CSV into a cleaned Pandas DataFrame with safe fallbacks."""
    if not os.path.exists(CSV_PATH):
        logger.info("movies.csv not found; regenerating baseline demo dataset...")
        try:
            import seed_data
            seed_data.generate_csv()
        except Exception as e:
            logger.error(f"Error seeding dataset: {e}")
            return pd.DataFrame(
                columns=["Rank", "Title", "Year", "IMDb Rating", "Poster", "IMDb URL"]
            )

    try:
        df = pd.read_csv(CSV_PATH)

        # Defensive type conversions
        if "Rank" in df.columns:
            df["Rank"] = pd.to_numeric(
                df["Rank"], errors="coerce"
            ).fillna(0).astype(int)

        if "Year" in df.columns:
            df["Year"] = pd.to_numeric(
                df["Year"], errors="coerce"
            ).fillna(2000).astype(int)

        if "IMDb Rating" in df.columns:
            df["IMDb Rating"] = pd.to_numeric(
                df["IMDb Rating"], errors="coerce"
            ).fillna(8.0).astype(float)

        if "Title" in df.columns:
            df["Title"] = df["Title"].fillna(
                "Unknown Title"
            ).astype(str)

        if "Poster" in df.columns:
            df["Poster"] = df["Poster"].fillna("").astype(str)

        if "IMDb URL" in df.columns:
            df["IMDb URL"] = df["IMDb URL"].fillna("").astype(str)

        return df

    except Exception as e:
        logger.error(f"Failed to read movies CSV: {e}")
        return pd.DataFrame(
            columns=["Rank", "Title", "Year", "IMDb Rating", "Poster", "IMDb URL"]
        )


def compute_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Derive global summary statistics from the current DataFrame."""

    if df.empty:
        return {
            "total_movies": 0,
            "avg_rating": 0.0,
            "highest_rated_movie": "N/A",
            "highest_rating": 0.0,
            "lowest_rated_movie": "N/A",
            "lowest_rating": 0.0,
            "oldest_year": 0,
            "newest_year": 0,
            "latest_scrape_time": scraper_service.last_scraped_time or "Never",
            "is_demo": scraper_service.is_demo
        }

    highest_row = df.sort_values(
        by="IMDb Rating",
        ascending=False
    ).iloc[0]

    lowest_row = df.sort_values(
        by="IMDb Rating",
        ascending=True
    ).iloc[0]

    return {
        "total_movies": int(len(df)),
        "avg_rating": round(
            float(df["IMDb Rating"].mean()), 2
        ),
        "highest_rated_movie": str(
            highest_row["Title"]
        ),
        "highest_rating": float(
            highest_row["IMDb Rating"]
        ),
        "highest_rank": int(
            highest_row["Rank"]
        ),
        "lowest_rated_movie": str(
            lowest_row["Title"]
        ),
        "lowest_rating": float(
            lowest_row["IMDb Rating"]
        ),
        "oldest_year": int(
            df["Year"].min()
        ),
        "newest_year": int(
            df["Year"].max()
        ),
        "latest_scrape_time":
            scraper_service.last_scraped_time or "Never",
        "is_demo":
            scraper_service.is_demo
    }


def compute_analytics_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Generate aggregated metrics for all 4 Chart.js analytics visualizers."""

    if df.empty:
        return {
            "rating_distribution": {
                "labels": [],
                "data": []
            },
            "movies_by_decade": {
                "labels": [],
                "data": []
            },
            "top_rated": {
                "titles": [],
                "ratings": []
            },
            "rating_vs_year": []
        }

    # 1. Rating Distribution
    bins = [7.0, 7.5, 8.0, 8.5, 9.0, 10.0]

    labels = [
        "7.0–7.5",
        "7.5–8.0",
        "8.0–8.5",
        "8.5–9.0",
        "9.0+"
    ]

    cuts = pd.cut(
        df["IMDb Rating"],
        bins=bins,
        labels=labels,
        right=False
    )

    dist_series = (
        cuts.value_counts()
        .reindex(labels, fill_value=0)
    )

    rating_distribution = {
        "labels": labels,
        "data": [
            int(x)
            for x in dist_series.values
        ]
    }

    # 2. Movies by Decade
    df_decade = df.copy()

    df_decade["Decade"] = (
        df_decade["Year"] // 10
    ) * 10

    decade_counts = (
        df_decade["Decade"]
        .value_counts()
        .sort_index()
    )

    decade_labels = [
        f"{d}s"
        for d in decade_counts.index
    ]

    movies_by_decade = {
        "labels": decade_labels,
        "data": [
            int(x)
            for x in decade_counts.values
        ]
    }

    # 3. Top 10 Rated Movies
    top_10 = (
        df.sort_values(
            by=["IMDb Rating", "Rank"],
            ascending=[False, True]
        )
        .head(10)
    )

    top_rated = {
        "titles": [
            f"#{r['Rank']} {r['Title']}"
            for _, r in top_10.iterrows()
        ],
        "ratings": [
            float(r["IMDb Rating"])
            for _, r in top_10.iterrows()
        ],
        "years": [
            int(r["Year"])
            for _, r in top_10.iterrows()
        ]
    }

    # 4. Rating vs Release Year
    scatter_points = []

    for _, row in df.iterrows():
        scatter_points.append({
            "x": int(row["Year"]),
            "y": float(row["IMDb Rating"]),
            "title": str(row["Title"]),
            "rank": int(row["Rank"])
        })

    return {
        "rating_distribution": rating_distribution,
        "movies_by_decade": movies_by_decade,
        "top_rated": top_rated,
        "rating_vs_year": scatter_points
    }


# ==========================================
# PAGE ROUTES (HTML VIEWS)
# ==========================================

@app.route("/")
@app.route("/dashboard")
def dashboard():
    """Main dashboard page."""

    df = get_movies_df()

    stats = compute_statistics(df)

    top_10 = (
        df.sort_values(
            by="Rank",
            ascending=True
        )
        .head(10)
        .to_dict(orient="records")
        if not df.empty else []
    )

    scraper_status = scraper_service.get_status()

    return render_template(
        "dashboard.html",
        stats=stats,
        top_10=top_10,
        scraper_status=scraper_status,
        page_title="Dashboard"
    )


@app.route("/movies")
def movies():
    """Top 250 movies page."""

    df = get_movies_df()

    stats = compute_statistics(df)

    scraper_status = scraper_service.get_status()

    return render_template(
        "movies.html",
        stats=stats,
        scraper_status=scraper_status,
        page_title="Top 250 Movies"
    )


@app.route("/movies/<int:rank>")
def movie_details(rank):
    """Movie details page."""

    df = get_movies_df()

    match = df[df["Rank"] == rank]

    if match.empty:
        match = df.head(1)

    movie = (
        match.iloc[0].to_dict()
        if not match.empty
        else {
            "Rank": rank,
            "Title": f"Movie #{rank}",
            "Year": 2000,
            "IMDb Rating": 8.0,
            "Poster": "",
            "IMDb URL": ""
        }
    )

    stats = compute_statistics(df)

    return render_template(
        "movie_details.html",
        movie=movie,
        stats=stats,
        page_title=f"#{movie['Rank']} - {movie['Title']}"
    )


@app.route("/analytics")
def analytics():
    """Interactive analytics page."""

    df = get_movies_df()

    stats = compute_statistics(df)

    scraper_status = scraper_service.get_status()

    return render_template(
        "analytics.html",
        stats=stats,
        scraper_status=scraper_status,
        page_title="Analytics"
    )


@app.route("/scraper")
def scraper_page():
    """Scraper control center."""

    df = get_movies_df()

    stats = compute_statistics(df)

    scraper_status = scraper_service.get_status()

    return render_template(
        "scraper.html",
        stats=stats,
        scraper_status=scraper_status,
        page_title="IMDb Scraper Control"
    )


@app.route("/about")
def about():
    """Project documentation page."""

    df = get_movies_df()

    stats = compute_statistics(df)

    return render_template(
        "about.html",
        stats=stats,
        page_title="About CineRank"
    )


# ==========================================
# REST API ENDPOINTS
# ==========================================

@app.route("/api/stats", methods=["GET"])
def api_stats():
    """Return statistics as JSON."""

    df = get_movies_df()

    stats = compute_statistics(df)

    return jsonify({
        "success": True,
        "stats": stats
    })


@app.route("/api/movies", methods=["GET"])
def api_movies():
    """Search, filter, sort and paginate movies."""

    df = get_movies_df()

    if df.empty:
        return jsonify({
            "success": True,
            "total": 0,
            "filtered_count": 0,
            "page": 1,
            "limit": 25,
            "total_pages": 1,
            "movies": []
        })

    filtered = df.copy()

    # Search
    q = request.args.get(
        "q", ""
    ).strip().lower()

    if q:
        filtered = filtered[
            filtered["Title"]
            .str.lower()
            .str.contains(q, na=False)
        ]

    # Rating filter
    min_rating = request.args.get(
        "min_rating",
        type=float
    )

    max_rating = request.args.get(
        "max_rating",
        type=float
    )

    if min_rating is not None:
        filtered = filtered[
            filtered["IMDb Rating"] >= min_rating
        ]

    if max_rating is not None:
        filtered = filtered[
            filtered["IMDb Rating"] <= max_rating
        ]

    # Year filter
    min_year = request.args.get(
        "min_year",
        type=int
    )

    max_year = request.args.get(
        "max_year",
        type=int
    )

    if min_year is not None:
        filtered = filtered[
            filtered["Year"] >= min_year
        ]

    if max_year is not None:
        filtered = filtered[
            filtered["Year"] <= max_year
        ]

    # Rank filter
    min_rank = request.args.get(
        "min_rank",
        type=int
    )

    max_rank = request.args.get(
        "max_rank",
        type=int
    )

    if min_rank is not None:
        filtered = filtered[
            filtered["Rank"] >= min_rank
        ]

    if max_rank is not None:
        filtered = filtered[
            filtered["Rank"] <= max_rank
        ]

    # Sorting
    sort_by = request.args.get(
        "sort_by",
        "rank_asc"
    )

    sort_map = {
        "rank_asc": ("Rank", True),
        "rank_desc": ("Rank", False),
        "rating_desc": ("IMDb Rating", False),
        "rating_asc": ("IMDb Rating", True),
        "year_desc": ("Year", False),
        "year_asc": ("Year", True),
        "title_asc": ("Title", True),
        "title_desc": ("Title", False)
    }

    col, asc = sort_map.get(
        sort_by,
        ("Rank", True)
    )

    filtered = filtered.sort_values(
        by=col,
        ascending=asc
    )

    # Pagination
    total_filtered = len(filtered)

    page = max(
        1,
        request.args.get(
            "page",
            1,
            type=int
        )
    )

    limit = max(
        1,
        min(
            request.args.get(
                "limit",
                25,
                type=int
            ),
            250
        )
    )

    total_pages = max(
        1,
        (total_filtered + limit - 1) // limit
    )

    start_idx = (
        page - 1
    ) * limit

    end_idx = start_idx + limit

    page_data = (
        filtered.iloc[
            start_idx:end_idx
        ]
        .to_dict(
            orient="records"
        )
    )

    return jsonify({
        "success": True,
        "total": int(len(df)),
        "filtered_count": total_filtered,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "movies": page_data
    })


@app.route("/api/movies/<int:rank>", methods=["GET"])
def api_movie_by_rank(rank):
    """Return one movie by rank."""

    df = get_movies_df()

    match = df[
        df["Rank"] == rank
    ]

    if match.empty:
        return jsonify({
            "success": False,
            "error": f"Movie with rank #{rank} not found."
        }), 404

    return jsonify({
        "success": True,
        "movie": match.iloc[0].to_dict()
    })


@app.route("/api/analytics", methods=["GET"])
def api_analytics():
    """Return analytics data."""

    df = get_movies_df()

    analytics_data = compute_analytics_data(df)

    return jsonify({
        "success": True,
        "data": analytics_data
    })


@app.route("/api/scrape", methods=["POST"])
def api_start_scrape():
    """Start Selenium scraper."""

    payload = request.get_json(
        silent=True
    ) or {}

    headless = payload.get(
        "headless",
        True
    )

    started = scraper_service.start_scraping(
        headless=headless
    )

    if not started:
        return jsonify({
            "success": False,
            "message": "Scraper is already running.",
            "status": scraper_service.get_status()
        }), 409

    return jsonify({
        "success": True,
        "message": (
            f"Scraping initialized in background "
            f"(headless={headless})."
        ),
        "status": scraper_service.get_status()
    })


@app.route("/api/scrape/status", methods=["GET"])
def api_scrape_status():
    """Return scraper status."""

    status = scraper_service.get_status()

    return jsonify({
        "success": True,
        "status": status
    })


@app.route("/api/scrape/stop", methods=["POST"])
def api_scrape_stop():
    """Stop running scraper."""

    scraper_service.stop_scraping()

    return jsonify({
        "success": True,
        "message": "Stop signal transmitted to scraper.",
        "status": scraper_service.get_status()
    })


@app.route("/api/clear", methods=["POST"])
def api_clear_data():
    """Reset dataset to demo data."""

    try:
        import seed_data

        seed_data.generate_csv()

        scraper_service.is_demo = True
        scraper_service.last_scraped_time = "Sample Reset"

        return jsonify({
            "success": True,
            "message": (
                "Dataset cleared and re-initialized "
                "with baseline demo data."
            ),
            "stats": compute_statistics(
                get_movies_df()
            )
        })

    except Exception as e:

        logger.error(
            f"Error resetting data: {e}"
        )

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/download")
@app.route("/download/csv")
def download_csv():
    """Download movies.csv."""

    if not os.path.exists(CSV_PATH):
        import seed_data
        seed_data.generate_csv()

    filename = (
        f"imdb_top_250_movies_"
        f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )

    return send_file(
        CSV_PATH,
        mimetype="text/csv",
        as_attachment=True,
        download_name=filename
    )


# ==========================================
# APPLICATION ENTRYPOINT
# ==========================================

if __name__ == "__main__":

    # Ensure data directory exists
    os.makedirs(
        DATA_DIR,
        exist_ok=True
    )

    # Create seed data if required
    if not os.path.exists(CSV_PATH):
        import seed_data
        seed_data.generate_csv()

    print(
        "================================================================"
    )

    print(
        " CineRank — IMDb Movie Intelligence Dashboard & Scraper"
    )

    print(
        " Server active at: http://127.0.0.1:5000"
    )

    print(
        "================================================================"
    )

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )