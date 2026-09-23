# 🎬 CineRank — IMDb Movie Intelligence Dashboard

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Selenium](https://img.shields.io/badge/Selenium-4.18%2B-43B02A.svg?logo=selenium&logoColor=white)](https://www.selenium.dev/)
[![Pandas](https://img.shields.io/badge/Pandas-2.2%2B-150458.svg?logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4%2B-FF6384.svg?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3%2B-7952B3.svg?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-brightgreen.svg)]()

> A production-ready, full-stack IMDb Movie Intelligence Web Application and Selenium automation suite. CineRank scrapes, sanitizes, analyzes, and visualizes the world-renowned **IMDb Top 250** movies in real-time within a responsive dark cinematic interface.

---

## 🌟 Key Features

### 1. 🤖 Selenium Headless Scraping Engine
- **Headless Chrome WebDriver**: Modern `--headless=new` support with anti-detection fingerprint masking (`blink-settings=imagesEnabled=true`, customized User-Agent, disabled automation flags).
- **Explicit Dynamic Waiting**: Utilizes `WebDriverWait` with expected conditions (`presence_of_element_located`) and dynamic scroll triggers rather than brittle hardcoded sleep intervals.
- **Thread-Safe Asynchronous Execution**: Scraping runs in a dedicated background `threading.Thread`, allowing uninterrupted browsing and client responsiveness.
- **Telemetry & Cancellation**: Polls live execution progress (0–100%), current movie title, and terminal logs via REST API, with an instantaneous abort mechanism.

### 2. 📊 High-Performance Data Processing & Persistence
- **Pandas Pipeline**: Structured data parsing, type coercion (ratings to `float64`, years and ranks to `int64`), null value imputation, and RFC 4180 CSV export.
- **Offline Baseline Fallback**: Ships with a curated 250-movie baseline dataset (`data/movies.csv`), ensuring zero initial downtime or empty screens before the first live scrape.
- **One-Click CSV Export**: Direct download endpoint (`/api/download`) for offline research and spreadsheet analysis.

### 3. 🎥 Luxury Cinematic User Interface
- **Dark Cinema Aesthetic**: Designed with deep charcoal/black background (`#0b0c10`), gold accents (`#f5c518`), and crimson red highlights (`#e50914`).
- **Interactive Top 250 Screener**:
  - Instant live search with 300ms debouncing.
  - Multi-tier filtering: Rating (9.0+, 8.5+, 8.0+), Era/Decade (2020s, 1990s, vintage classics), and Rank buckets (#1–50, #51–100).
  - Multi-column sorting: Rank (Asc/Desc), Rating (Highest/Lowest), Year (Newest/Oldest), Title (A–Z).
  - Dual View Modes: Responsive Movie Poster Grid vs Compact Table View.
  - Quick-view Details Modal with direct links to official IMDb movie profiles.

### 4. 📈 Interactive Chart.js Analytics Suite
1. **Rating Tier Distribution**: Histogram bar chart displaying movie frequency across rating brackets (7.0–7.5 up to 9.0+).
2. **Movies by Decade**: Timeline trend visualizing the historical volume of Top 250 movies from the 1920s to the 2020s.
3. **Top 10 Rated Leaderboard**: Horizontal ranking bar chart showcasing highest rated films.
4. **Rating vs. Release Year Scatter Plot**: Scatter graph plotting every movie's release year against user rating to uncover historical score distributions.

---

## 📂 Project Directory Structure

```text
imdb-movie-dashboard/
│
├── app.py                      # Flask main application & REST API controllers
├── requirements.txt            # Python dependencies (Flask, Selenium, Pandas, etc.)
├── seed_data.py                # Standalone baseline dataset generator (250 movies)
├── README.md                   # Comprehensive project documentation
│
├── scraper/                    # Selenium Web Scraping Package
│   ├── __init__.py             # Exports create_driver, close_driver, IMDbScraper
│   ├── browser.py              # ChromeOptions, anti-detection flags & WebDriver manager
│   └── imdb_scraper.py         # Thread-safe scraper singleton with state machine
│
├── data/                       # Data Persistence Directory
│   └── movies.csv              # IMDb Top 250 dataset (Rank, Title, Year, Rating, Poster, URL)
│
├── static/                     # Frontend Assets
│   ├── css/
│   │   └── style.css           # Cinematic dark gold design system
│   └── js/
│       ├── dashboard.js        # Mini analytics previews for dashboard
│       ├── movies.js           # Screener filters, pagination, search, & modal
│       ├── analytics.js        # 4 Chart.js visualization engines
│       └── scraper.js          # Scraper control console & live terminal polling
│
├── templates/                  # Jinja2 HTML Templates
│   ├── base.html               # Global layout, navbar, footer, & toast alerts
│   ├── dashboard.html          # Executive stats, hero spotlight, Top 10 table
│   ├── movies.html             # Top 250 screener (Grid & Table views)
│   ├── movie_details.html      # Dedicated single-movie standalone page
│   ├── analytics.html          # 4 full-scale Chart.js analytics cards
│   ├── scraper.html            # Scraper controller, progress bar, & terminal
│   └── about.html              # Architecture breakdown & API documentation
│
└── tests/                      # Automated Unit & Integration Tests
    ├── test_api.py             # Route & REST API endpoint test suite
    └── test_scraper.py         # Data validation, stats calculation & engine tests
```

---

## 🚀 Quickstart Guide

### Prerequisites
1. **Python 3.10+** installed on your system.
2. **Google Chrome** browser installed.

### Step 1: Clone or Extract the Project
```bash
cd imdb-movie-dashboard
```

### Step 2: Create and Activate Virtual Environment
On Windows (PowerShell / Command Prompt):
```powershell
python -m venv venv
.\venv\Scripts\activate
```

On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Application
```bash
python app.py
```

Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## 📡 REST API Specifications

All endpoints return standard JSON responses:

| Method | Endpoint | Description | Sample Query / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats` | Global summary statistics (total, average rating, highest rated) | `None` |
| `GET` | `/api/movies` | Filtered & paginated Top 250 list | `?q=godfather&min_rating=8.5&page=1&limit=24` |
| `GET` | `/api/movies/<rank>` | Single movie attributes by rank (#1 to #250) | `None` |
| `GET` | `/api/analytics` | Aggregated datasets formatted for Chart.js | `None` |
| `POST` | `/api/scrape` | Trigger asynchronous background Selenium scraper | `{"headless": true}` |
| `GET` | `/api/scrape/status` | Poll execution status, percentage, count, & logs | `None` |
| `POST` | `/api/scrape/stop` | Request cancellation of active scraping job | `None` |
| `POST` | `/api/clear` | Reset dataset back to verified baseline data | `None` |
| `GET` | `/api/download` | Download `data/movies.csv` file directly | `None` |

---

## 🧪 Automated Testing

Run the comprehensive unit test suite:

```bash
python -m unittest discover -s tests -v
```

### Test Coverage Highlights:
- **`test_api.py`**: Validates all HTML view routes return HTTP 200, tests query parameter filtering, pagination calculations, single-movie rank lookup, 404 handling, and CSV download MIME type.
- **`test_scraper.py`**: Verifies singleton scraper state machine, stop flag signaling, dataset CSV column validation, data integrity bounds (ratings 5.0–10.0, years >= 1900), and statistical computations.

---

## 🛠️ Technology Stack

- **Backend**: Python 3, Flask 3.0, Pandas 2.2
- **Web Automation**: Selenium 4, Chrome WebDriver, webdriver-manager
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3 (CDN)
- **Data Visualization**: Chart.js 4.4 (CDN)
- **Icons**: Font Awesome 6.5 (CDN)
- **Testing**: Python `unittest`

---

## 📄 License
This project is open-source and available under the **MIT License**.
All movie data and trademarks belong to their respective copyright holders on IMDb.com.
