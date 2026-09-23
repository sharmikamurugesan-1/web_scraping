# CryptoLens - Luxury Cryptocurrency Price Tracker & Analytics Terminal

A modern, full-stack cryptocurrency price tracking and market intelligence web terminal built with **Python (Flask)**, **Selenium Chrome WebDriver**, **SQLite + Pandas**, and **Vanilla HTML5/CSS/JavaScript** with **Chart.js**.

Designed with an ultra-premium **Dark + Gold + Silver** luxury aesthetic inspired by institutional financial platforms.

---

## 1. Project Description

**CryptoLens** tracks, analyzes, and visualizes real-time and historical cryptocurrency market trends for top cryptocurrencies (Bitcoin, Ethereum, Solana, XRP, BNB, Dogecoin, and more). It delivers live price feeds, market capitalization, 24-hour volume, dominance ratios, fear & greed sentiment, and responsive candlestick/sparkline charts with zero external UI frameworks (no Bootstrap).

---

## 2. Key Features

- **Live Headless Selenium Scraping**:
  - Automatically launches headless Google Chrome in background threads to fetch live prices, 1h/24h/7d percentage changes, 24h trading volume, and market cap.
  - Fault-tolerant design: in case of network timeouts or Cloudflare rate-limiting, the scraper handles exceptions smoothly and displays `"Data temporarily unavailable. Retrying..."` while serving resilient cached data to preserve 100% web application uptime.
- **Interactive Dark & Gold Charting (Chart.js)**:
  - Hero Price Chart for Bitcoin & any selected asset with glowing gold gradients and multi-timeframe switching (`1H`, `6H`, `12H`, `24H`, `7D`, `30D`, `90D`, `1Y`).
  - Mini Trend Sparklines rendered dynamically on HTML5 canvas elements for every coin in the table and top stat cards.
- **Real-Time Search & Screener**:
  - Filter coins instantly by name or ticker symbol (e.g. `BTC` -> `Bitcoin`).
  - One-click tabs: `All`, `Gainers` (positive 24h return), `Losers` (negative 24h return), and `Watchlist`.
  - Multi-column sorting on `#` (Rank), `Name`, `Price`, `1h`, `24h`, `7d`, `Market Cap`, and `24h Volume`.
- **Persistent LocalStorage & Database Watchlist**:
  - Click the gold star `★` next to any cryptocurrency to toggle watchlist membership. Persisted locally and synchronized with the SQLite database.
- **Side-by-Side Coin Comparison Matrix**:
  - Compare any two or three cryptocurrencies side-by-side with synchronized normalized percentage return charts and key valuation metrics.
- **Real-Time Price Alert Engine**:
  - Set custom target price alerts (e.g. Alert if `Bitcoin` crosses `Above $60,000`).
  - In-browser notification toast alerts trigger immediately when thresholds are reached.
- **Pandas Analytics & One-Click CSV Export**:
  - Download complete current or filtered cryptocurrency records directly as formatted CSV files (`/export/csv`).
- **Live Auto-Refresh Countdown**:
  - Configurable auto-refresh toggle with 15s, 30s, or 60s countdown timer with asynchronous AJAX updates without full-page reloads.

---

## 3. Technologies Used

- **Backend**: Python 3.10+ / 3.11 / 3.12 / 3.14, Flask 3.x
- **Web Scraping**: Selenium 4.x, Chrome WebDriver (`--headless=new`), `webdriver-manager`
- **Database & Data Processing**: SQLite3, Pandas, JSON
- **Frontend**: HTML5, Custom CSS3 (Bespoke Luxury Dark/Gold theme, Grid & Flexbox, no Bootstrap), Vanilla JavaScript (ES6+)
- **Data Visualization**: Chart.js 4.4.x (via CDN)

---

## 4. Project Folder Structure

```
cryptocurrency-price-tracker/
│
├── app.py                     # Flask web server, REST routes, and background scraping scheduler
├── scraper.py                 # Headless Selenium scraper, exception handling, and resilient fallback
├── database.py                # SQLite connection, snapshots, watchlists, alerts, and Pandas CSV sync
├── requirements.txt           # Python dependencies
├── README.md                  # Complete documentation and setup guide
│
├── data/
│   └── crypto_data.csv        # Current cryptocurrency snapshot exported via Pandas
│
├── database/
│   └── crypto.db              # SQLite database storing multi-day historical snapshots and alerts
│
├── templates/
│   ├── index.html             # Main terminal dashboard matching user UI mockup
│   ├── markets.html           # Dedicated cryptocurrency screener and markets table
│   └── coin_details.html      # Deep-dive analytics page with high-res timeframe Chart.js chart
│
└── static/
    ├── css/
    │   └── style.css          # Bespoke Luxury Dark + Gold + Silver responsive stylesheet
    └── js/
        └── script.js          # Core JavaScript: search, filter, sort, watchlist, charts, alerts, refresh
```

---

## 5. Required Python Packages (`requirements.txt`)

```
Flask>=3.0.0
selenium>=4.20.0
webdriver-manager>=4.0.0
pandas>=2.2.0
requests>=2.31.0
python-dotenv>=1.0.0
```

---

## 6. Installation Steps

### Step 1: Clone or Extract the Project
Extract the downloadable ZIP archive to your preferred directory:
```bash
cd cryptocurrency-price-tracker
```

### Step 2: Set Up a Python Virtual Environment (Recommended)
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r requirements.txt
```

---

## 7. How to Run the Project

1. Start the Flask application:
   ```bash
   python app.py
   ```
2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```
3. The dashboard will load with live cryptocurrency prices, interactive charts, and background Selenium scraping telemetry active!

---

## 8. How Selenium Scraping Works

1. **Headless Execution**:
   - `scraper.py` configures Google Chrome using `--headless=new`, `--no-sandbox`, and `--disable-dev-shm-usage` flags to run silently in the background without opening GUI browser windows.
2. **Dynamic DOM Extraction**:
   - Uses `WebDriverWait` with expected conditions to locate live financial tables, extracting coin ranks, names, ticker symbols, prices, 1h/24h/7d percentage changes, market capitalization, and 24h volume.
3. **Resilience & Fallback Handling**:
   - In the event of network dropouts, IP rate-limits, or timeout exceptions, the scraper catches the errors safely, updates the status bar with `"Data temporarily unavailable. Retrying..."`, and serves high-fidelity cached records. This guarantees that the user interface never crashes, freezes, or displays broken error pages.
4. **Automated Background Synchronization**:
   - A background daemon thread in `app.py` triggers the scraper periodically (every 45s), automatically appending historical snapshots to `database/crypto.db`, updating `data/crypto_data.csv` using Pandas, and checking if any user price alerts have been triggered.

---

## 9. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Main CryptoLens Dashboard |
| `GET` | `/markets` | Full Cryptocurrency Market Screener |
| `GET` | `/coin/<symbol>` | Standalone coin details & high-res chart |
| `GET` | `/api/data` | Real-time JSON market data, gainers/losers, global stats |
| `GET` | `/api/history/<symbol>?timeframe=24h` | Time-series data points for Chart.js |
| `GET` | `/api/compare?coins=BTC,ETH` | Synchronized side-by-side comparison series |
| `GET / POST` | `/api/watchlist` | Retrieve or toggle coin in watchlist |
| `GET / POST` | `/api/alerts` | Retrieve active alerts or create a new alert rule |
| `DELETE` | `/api/alerts/<id>` | Remove a price alert |
| `POST` | `/api/trigger-scrape` | Manually invoke Selenium scraper immediately |
| `GET` | `/export/csv` | Download complete market data as CSV |

---

## 10. License & Credits

Developed with precision for high-performance cryptocurrency market analysis.
All financial metrics and chart visualizers are provided for educational and analytical purposes.
