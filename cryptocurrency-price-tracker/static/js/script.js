/**
 * CryptoLens - Core Interactive Application Logic
 * Pure Vanilla JavaScript (ES6+) with Chart.js Integration
 */

// Global Application State
const AppState = {
  coins: [],
  filteredCoins: [],
  watchlist: new Set(),
  searchQuery: "",
  currentFilter: "all", // 'all' | 'gainers' | 'losers' | 'watchlist'
  sortColumn: "rank",
  sortAscending: true,
  autoRefresh: true,
  refreshInterval: 30, // seconds
  countdownSeconds: 30,
  refreshTimerId: null,
  countdownTimerId: null,
  activeHeroSymbol: "BTC",
  activeHeroTimeframe: "24H",
  charts: {
    heroChart: null,
    modalChart: null,
    compareChart: null
  }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initWatchlistFromStorage();
  fetchInitialData();
  setupEventListeners();
  startAutoRefreshCountdown();
});

function initWatchlistFromStorage() {
  try {
    const saved = localStorage.getItem("cryptolens_watchlist");
    if (saved) {
      const arr = JSON.parse(saved);
      AppState.watchlist = new Set(arr);
    } else {
      AppState.watchlist = new Set(["BTC", "SOL"]);
    }
  } catch (e) {
    AppState.watchlist = new Set(["BTC", "SOL"]);
  }
}

function saveWatchlistToStorage() {
  try {
    localStorage.setItem("cryptolens_watchlist", JSON.stringify([...AppState.watchlist]));
  } catch (e) {
    console.error("Failed to save watchlist to localStorage", e);
  }
}

// ==========================================
// DATA FETCHING & AUTO-REFRESH ENGINE
// ==========================================
async function fetchInitialData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    if (data.status === "success") {
      AppState.coins = data.coins;
      // Sync server watchlist if any
      if (data.watchlist && data.watchlist.length > 0) {
        data.watchlist.forEach(sym => AppState.watchlist.add(sym));
        saveWatchlistToStorage();
      }
      applyFiltersAndRender();
      renderHeroChart(AppState.activeHeroSymbol, AppState.activeHeroTimeframe);
      updateStatusTelemetry(data.scraper_status, data.timestamp);
      
      // Check triggered price alerts
      if (data.triggered_alerts && data.triggered_alerts.length > 0) {
        data.triggered_alerts.forEach(alert => showPriceAlertToast(alert));
      }
    }
  } catch (err) {
    console.warn("Initial data load error:", err);
  }
}

async function refreshMarketData() {
  const refreshBtn = document.getElementById("manualRefreshBtn");
  if (refreshBtn) refreshBtn.classList.add("rotating");

  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    if (data.status === "success") {
      AppState.coins = data.coins;
      applyFiltersAndRender();
      updateStatusTelemetry(data.scraper_status, data.timestamp);
      
      // Check triggered price alerts
      if (data.triggered_alerts && data.triggered_alerts.length > 0) {
        data.triggered_alerts.forEach(alert => showPriceAlertToast(alert));
      }
    }
  } catch (err) {
    console.error("Auto-refresh fetch failed:", err);
  } finally {
    if (refreshBtn) refreshBtn.classList.remove("rotating");
  }
}

function startAutoRefreshCountdown() {
  clearInterval(AppState.countdownTimerId);
  AppState.countdownSeconds = AppState.refreshInterval;

  AppState.countdownTimerId = setInterval(() => {
    if (!AppState.autoRefresh) return;

    AppState.countdownSeconds--;
    const displaySec = AppState.countdownSeconds < 10 ? `0${AppState.countdownSeconds}` : AppState.countdownSeconds;
    
    // Update footer countdown and sidebar
    const footerCountdown = document.getElementById("nextUpdateCountdown");
    if (footerCountdown) footerCountdown.textContent = `00:00:${displaySec}`;
    
    const sidebarCountdown = document.getElementById("sidebarNextUpdate");
    if (sidebarCountdown) sidebarCountdown.textContent = `00:00:${displaySec}`;

    if (AppState.countdownSeconds <= 0) {
      AppState.countdownSeconds = AppState.refreshInterval;
      refreshMarketData();
    }
  }, 1000);
}

function updateStatusTelemetry(statusObj, timestamp) {
  if (!statusObj) return;

  const scraperStatusEl = document.getElementById("scraperStatusText");
  if (scraperStatusEl) {
    scraperStatusEl.textContent = statusObj.status || "Selenium Scraper: Running";
    if (statusObj.status && statusObj.status.includes("unavailable")) {
      scraperStatusEl.style.color = "#f39c12";
    } else {
      scraperStatusEl.style.color = "#10b981";
    }
  }

  const lastUpdateEl = document.getElementById("lastUpdatedTime");
  if (lastUpdateEl) lastUpdateEl.textContent = timestamp || statusObj.last_scraped || "Just now";

  const sidebarLastUpdate = document.getElementById("sidebarLastUpdate");
  if (sidebarLastUpdate) sidebarLastUpdate.textContent = timestamp || statusObj.last_scraped || "Just now";
}

// ==========================================
// SEARCH, FILTER, AND SORT LOGIC
// ==========================================
function applyFiltersAndRender() {
  let result = [...AppState.coins];

  // 1. Filter by Tab (All, Gainers, Losers, Watchlist)
  if (AppState.currentFilter === "gainers") {
    result = result.filter(c => c.change_24h > 0);
  } else if (AppState.currentFilter === "losers") {
    result = result.filter(c => c.change_24h < 0);
  } else if (AppState.currentFilter === "watchlist") {
    result = result.filter(c => AppState.watchlist.has(c.symbol));
  }

  // 2. Filter by Search Query
  if (AppState.searchQuery.trim() !== "") {
    const q = AppState.searchQuery.trim().toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.symbol.toLowerCase().includes(q)
    );
  }

  // 3. Sort by Column
  result.sort((a, b) => {
    let valA = a[AppState.sortColumn];
    let valB = b[AppState.sortColumn];

    if (typeof valA === "string") {
      return AppState.sortAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return AppState.sortAscending ? (valA - valB) : (valB - valA);
  });

  AppState.filteredCoins = result;
  renderCoinsTable(result);
}

function handleSort(columnKey) {
  if (AppState.sortColumn === columnKey) {
    AppState.sortAscending = !AppState.sortAscending;
  } else {
    AppState.sortColumn = columnKey;
    AppState.sortAscending = (columnKey === "rank"); // Default asc for rank, desc for prices/mcap
  }
  updateSortIndicators();
  applyFiltersAndRender();
}

function updateSortIndicators() {
  document.querySelectorAll("th.sortable").forEach(th => {
    const col = th.getAttribute("data-col");
    const icon = th.querySelector(".sort-icon");
    if (!icon) return;

    if (col === AppState.sortColumn) {
      icon.textContent = AppState.sortAscending ? "▲" : "▼";
      icon.style.opacity = "1";
      icon.style.color = "var(--gold-primary)";
    } else {
      icon.textContent = "↕";
      icon.style.opacity = "0.4";
      icon.style.color = "inherit";
    }
  });
}

// ==========================================
// TABLE RENDERING & SPARKLINE DRAWING
// ==========================================
function renderCoinsTable(coins) {
  const tbody = document.getElementById("cryptoTableBody");
  if (!tbody) return;

  if (coins.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 40px; color: var(--silver-primary);">
          No cryptocurrencies match your criteria.
        </td>
      </tr>
    `;
    return;
  }

  let html = "";
  coins.forEach(coin => {
    const isStarred = AppState.watchlist.has(coin.symbol);
    const starClass = isStarred ? "starred" : "";
    
    const c1hClass = coin.change_1h >= 0 ? "change-up" : "change-down";
    const c24hClass = coin.change_24h >= 0 ? "change-up" : "change-down";
    const c7dClass = coin.change_7d >= 0 ? "change-up" : "change-down";

    const c1hSign = coin.change_1h > 0 ? "+" : "";
    const c24hSign = coin.change_24h > 0 ? "+" : "";
    const c7dSign = coin.change_7d > 0 ? "+" : "";

    const formattedPrice = formatUSD(coin.price);
    const formattedMcap = formatShortCurrency(coin.market_cap);
    const formattedVol = formatShortCurrency(coin.volume_24h);

    html += `
      <tr data-symbol="${coin.symbol}">
        <td style="color: var(--silver-primary); font-weight: 500;">${coin.rank}</td>
        <td>
          <div class="coin-cell">
            <div class="coin-avatar" style="background-color: ${coin.color || '#F3BA2F'}">
              ${coin.symbol.slice(0, 3)}
            </div>
            <div class="coin-meta">
              <span class="coin-name-text" onclick="openCoinModal('${coin.symbol}')">${coin.name}</span>
              <span class="coin-sym-text">${coin.symbol}</span>
            </div>
          </div>
        </td>
        <td class="price-text">${formattedPrice}</td>
        <td class="${c1hClass}">${c1hSign}${coin.change_1h.toFixed(2)}%</td>
        <td class="${c24hClass}">${c24hSign}${coin.change_24h.toFixed(2)}%</td>
        <td class="${c7dClass}">${c7dSign}${coin.change_7d.toFixed(2)}%</td>
        <td style="color: var(--text-white); font-weight: 500;">${formattedMcap}</td>
        <td style="color: var(--silver-light);">${formattedVol}</td>
        <td>
          <canvas class="sparkline-canvas" id="spark_${coin.symbol}" width="95" height="30"></canvas>
        </td>
        <td>
          <button class="star-btn ${starClass}" onclick="toggleWatchlist('${coin.symbol}', event)" title="Watchlist">
            ★
          </button>
        </td>
        <td>
          <button class="table-action-btn" onclick="openCoinModal('${coin.symbol}')" title="Analytics">
            Details
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // Render sparklines onto canvas elements
  coins.forEach(coin => {
    const canvas = document.getElementById(`spark_${coin.symbol}`);
    if (canvas && coin.sparkline && coin.sparkline.length > 0) {
      const isUp = coin.change_24h >= 0;
      drawSparkline(canvas, coin.sparkline, isUp ? "#10b981" : "#ef4444");
    }
  });
}

function drawSparkline(canvas, dataPoints, color) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (!dataPoints || dataPoints.length < 2) return;

  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);
  const range = (max - min) || 1;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";

  dataPoints.forEach((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * (width - 4) + 2;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

// ==========================================
// WATCHLIST ACTIONS
// ==========================================
async function toggleWatchlist(symbol, event) {
  if (event) event.stopPropagation();
  
  if (AppState.watchlist.has(symbol)) {
    AppState.watchlist.delete(symbol);
  } else {
    AppState.watchlist.add(symbol);
  }

  saveWatchlistToStorage();
  applyFiltersAndRender();

  // Inform backend database asynchronously
  try {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: symbol })
    });
  } catch (err) {
    console.error("Watchlist server sync error:", err);
  }
}

// ==========================================
// CHART.JS INTEGRATIONS
// ==========================================
async function renderHeroChart(symbol = "BTC", timeframe = "24H") {
  AppState.activeHeroSymbol = symbol;
  AppState.activeHeroTimeframe = timeframe;

  const canvas = document.getElementById("heroPriceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Fetch historical data
  try {
    const response = await fetch(`/api/history/${symbol}?timeframe=${timeframe.toLowerCase()}`);
    const res = await response.json();
    const historyData = res.data || [];

    const labels = historyData.map(d => {
      const date = new Date(d.timestamp);
      return timeframe === "24H" || timeframe === "1H" || timeframe === "6H" || timeframe === "12H" 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });

    const prices = historyData.map(d => d.price);

    // Gradient fill for luxury gold
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, "rgba(212, 175, 55, 0.45)");
    gradient.addColorStop(0.6, "rgba(212, 175, 55, 0.12)");
    gradient.addColorStop(1, "rgba(212, 175, 55, 0.0)");

    if (AppState.charts.heroChart) {
      AppState.charts.heroChart.destroy();
    }

    AppState.charts.heroChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: `${symbol} Price (USD)`,
          data: prices,
          borderColor: "#D4AF37",
          borderWidth: 2.2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#D4AF37",
          pointHoverBorderWidth: 2,
          fill: true,
          backgroundColor: gradient,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1c1f2e",
            titleColor: "#D4AF37",
            bodyColor: "#FFFFFF",
            borderColor: "rgba(212, 175, 55, 0.4)",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => `$${Number(context.raw).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.04)" },
            ticks: { color: "#8b92a5", maxTicksLimit: 7, font: { size: 10 } }
          },
          y: {
            position: "right",
            grid: { color: "rgba(255, 255, 255, 0.04)" },
            ticks: {
              color: "#8b92a5",
              font: { size: 10 },
              callback: (v) => `$${Number(v).toLocaleString()}`
            }
          }
        }
      }
    });

  } catch (err) {
    console.error("Hero chart render error:", err);
  }
}

// ==========================================
// MODAL: COIN DETAILS
// ==========================================
async function openCoinModal(symbol) {
  const modal = document.getElementById("coinDetailsModal");
  if (!modal) return;

  const coin = AppState.coins.find(c => c.symbol === symbol) || {
    name: symbol, symbol: symbol, price: 0, change_24h: 0, market_cap: 0, volume_24h: 0, circulating_supply: "N/A"
  };

  document.getElementById("modalCoinName").textContent = coin.name;
  document.getElementById("modalCoinSymbol").textContent = coin.symbol;
  document.getElementById("modalCoinPrice").textContent = formatUSD(coin.price);
  
  const changeEl = document.getElementById("modalCoinChange");
  changeEl.textContent = `${coin.change_24h >= 0 ? '+' : ''}${coin.change_24h.toFixed(2)}% (24h)`;
  changeEl.className = coin.change_24h >= 0 ? "hero-price-badge change-up" : "hero-price-badge change-down";

  document.getElementById("modalMcap").textContent = formatShortCurrency(coin.market_cap);
  document.getElementById("modalVol").textContent = formatShortCurrency(coin.volume_24h);
  document.getElementById("modalSupply").textContent = coin.circulating_supply || "N/A";

  modal.classList.add("active");

  // Render Modal Chart (24H default)
  renderModalChart(symbol, "24h");
}

async function renderModalChart(symbol, timeframe = "24h") {
  const canvas = document.getElementById("modalDetailChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  try {
    const response = await fetch(`/api/history/${symbol}?timeframe=${timeframe}`);
    const res = await response.json();
    const historyData = res.data || [];

    const labels = historyData.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const prices = historyData.map(d => d.price);

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(212, 175, 55, 0.4)");
    gradient.addColorStop(1, "rgba(212, 175, 55, 0.0)");

    if (AppState.charts.modalChart) {
      AppState.charts.modalChart.destroy();
    }

    AppState.charts.modalChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: `${symbol} Price`,
          data: prices,
          borderColor: "#D4AF37",
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: gradient,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1c1f2e",
            titleColor: "#D4AF37",
            callbacks: {
              label: (c) => `$${Number(c.raw).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8b92a5", maxTicksLimit: 6 } },
          y: { position: "right", grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8b92a5" } }
        }
      }
    });
  } catch (err) {
    console.error("Modal chart error:", err);
  }
}

// ==========================================
// MODAL: COIN COMPARISON
// ==========================================
function openCompareModal() {
  const modal = document.getElementById("compareModal");
  if (!modal) return;
  modal.classList.add("active");
  loadComparisonChart();
}

async function loadComparisonChart() {
  const c1 = document.getElementById("compareCoin1") ? document.getElementById("compareCoin1").value : "BTC";
  const c2 = document.getElementById("compareCoin2") ? document.getElementById("compareCoin2").value : "ETH";
  const timeframe = "24h";

  const canvas = document.getElementById("compareChartCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  try {
    const response = await fetch(`/api/compare?coins=${c1},${c2}&timeframe=${timeframe}`);
    const res = await response.json();
    const comparison = res.comparison || {};

    const coin1Data = comparison[c1] || {};
    const coin2Data = comparison[c2] || {};

    // Render Side by side metrics table
    const metricsDiv = document.getElementById("compareMetricsSummary");
    if (metricsDiv) {
      metricsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; border-left: 3px solid #D4AF37;">
            <h4 style="color: #D4AF37;">${coin1Data.name} (${c1})</h4>
            <div style="font-size: 18px; font-weight: 700; margin: 4px 0;">$${Number(coin1Data.current_price || 0).toLocaleString()}</div>
            <div style="color: ${coin1Data.pct_return >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
              24h Return: ${coin1Data.pct_return >= 0 ? '+' : ''}${coin1Data.pct_return}%
            </div>
            <div style="font-size: 11px; color: var(--silver-primary); margin-top: 4px;">
              High: $${Number(coin1Data.high || 0).toLocaleString()} | Low: $${Number(coin1Data.low || 0).toLocaleString()}
            </div>
          </div>
          <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; border-left: 3px solid #627EEA;">
            <h4 style="color: #627EEA;">${coin2Data.name} (${c2})</h4>
            <div style="font-size: 18px; font-weight: 700; margin: 4px 0;">$${Number(coin2Data.current_price || 0).toLocaleString()}</div>
            <div style="color: ${coin2Data.pct_return >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
              24h Return: ${coin2Data.pct_return >= 0 ? '+' : ''}${coin2Data.pct_return}%
            </div>
            <div style="font-size: 11px; color: var(--silver-primary); margin-top: 4px;">
              High: $${Number(coin2Data.high || 0).toLocaleString()} | Low: $${Number(coin2Data.low || 0).toLocaleString()}
            </div>
          </div>
        </div>
      `;
    }

    // Prepare normalized percentage charts (% change from window start)
    const h1 = coin1Data.history || [];
    const h2 = coin2Data.history || [];
    const base1 = h1[0] ? h1[0].price : 1;
    const base2 = h2[0] ? h2[0].price : 1;

    const labels = h1.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const p1Norm = h1.map(d => Number((((d.price - base1) / base1) * 100).toFixed(2)));
    const p2Norm = h2.map(d => Number((((d.price - base2) / base2) * 100).toFixed(2)));

    if (AppState.charts.compareChart) {
      AppState.charts.compareChart.destroy();
    }

    AppState.charts.compareChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `${c1} (% Return)`,
            data: p1Norm,
            borderColor: "#D4AF37",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: `${c2} (% Return)`,
            data: p2Norm,
            borderColor: "#627EEA",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#8b92a5", maxTicksLimit: 6 } },
          y: {
            position: "right",
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#8b92a5", callback: v => `${v}%` }
          }
        }
      }
    });

  } catch (err) {
    console.error("Comparison load error:", err);
  }
}

// ==========================================
// MODAL: PRICE ALERTS
// ==========================================
function openAlertModal() {
  const modal = document.getElementById("alertModal");
  if (!modal) return;
  modal.classList.add("active");
  loadExistingAlerts();
}

async function loadExistingAlerts() {
  const alertsList = document.getElementById("currentAlertsList");
  if (!alertsList) return;

  try {
    const response = await fetch("/api/alerts");
    const data = await response.json();
    const alerts = data.alerts || [];

    if (alerts.length === 0) {
      alertsList.innerHTML = `<div style="color: var(--silver-primary); font-size: 12px; padding: 10px;">No price alerts set.</div>`;
      return;
    }

    let html = "";
    alerts.forEach(a => {
      const statusBadge = a.is_triggered 
        ? `<span style="color: var(--gold-primary); font-size: 10px; font-weight: 700;">TRIGGERED</span>` 
        : `<span style="color: var(--green-up); font-size: 10px;">ACTIVE</span>`;

      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-input); border-radius: 6px; margin-bottom: 6px;">
          <div>
            <strong>${a.symbol}</strong> ${a.condition} $${Number(a.target_price).toLocaleString()}
            <div style="font-size: 10px; color: var(--silver-primary);">${statusBadge} | Created: ${a.created_at}</div>
          </div>
          <button onclick="deleteAlert(${a.id})" style="background: none; border: none; color: var(--red-down); cursor: pointer; font-size: 14px;">✕</button>
        </div>
      `;
    });
    alertsList.innerHTML = html;
  } catch (err) {
    console.error("Load alerts error:", err);
  }
}

async function submitNewAlert(e) {
  e.preventDefault();
  const symbol = document.getElementById("alertSymbol").value;
  const targetPrice = parseFloat(document.getElementById("alertTargetPrice").value);
  const condition = document.getElementById("alertCondition").value;

  if (!symbol || isNaN(targetPrice)) {
    alert("Please enter a valid coin and price target.");
    return;
  }

  try {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: symbol,
        target_price: targetPrice,
        condition: condition
      })
    });
    const result = await response.json();
    if (result.status === "success") {
      document.getElementById("alertTargetPrice").value = "";
      loadExistingAlerts();
      showToastNotification("Alert Set", result.message);
    }
  } catch (err) {
    console.error("Submit alert error:", err);
  }
}

async function deleteAlert(alertId) {
  try {
    await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
    loadExistingAlerts();
  } catch (err) {
    console.error("Delete alert error:", err);
  }
}

function showPriceAlertToast(alert) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "alert-toast";
  toast.innerHTML = `
    <div class="toast-icon">🔔</div>
    <div class="toast-body">
      <div class="toast-title">PRICE ALERT TRIGGERED!</div>
      <div class="toast-message">
        <strong>${alert.symbol}</strong> is now <strong>$${Number(alert.current_price).toLocaleString()}</strong> (${alert.condition} $${Number(alert.target_price).toLocaleString()})
      </div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 10000);
}

function showToastNotification(title, message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "alert-toast";
  toast.innerHTML = `
    <div class="toast-icon">✨</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 5000);
}

// ==========================================
// CSV EXPORT ACTION
// ==========================================
function triggerCsvExport() {
  let url = "/export/csv";
  if (AppState.currentFilter === "watchlist" && AppState.watchlist.size > 0) {
    url += `?symbols=${[...AppState.watchlist].join(",")}`;
  }
  window.location.href = url;
}

// ==========================================
// EVENT LISTENERS & UI WIRING
// ==========================================
function setupEventListeners() {
  // Search Input
  const searchInput = document.getElementById("cryptoSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      AppState.searchQuery = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Filter Tabs
  document.querySelectorAll(".filter-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      AppState.currentFilter = btn.getAttribute("data-filter");
      applyFiltersAndRender();
    });
  });

  // Table Header Sorts
  document.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-col");
      handleSort(col);
    });
  });

  // Auto-Refresh Switch
  const refreshToggle = document.getElementById("autoRefreshToggle");
  if (refreshToggle) {
    refreshToggle.addEventListener("change", (e) => {
      AppState.autoRefresh = e.target.checked;
    });
  }

  // Refresh Interval Select
  const intervalSelect = document.getElementById("refreshIntervalSelect");
  if (intervalSelect) {
    intervalSelect.addEventListener("change", (e) => {
      AppState.refreshInterval = parseInt(e.target.value, 10);
      startAutoRefreshCountdown();
    });
  }

  // Manual Refresh Button
  const manualRefresh = document.getElementById("manualRefreshBtn");
  if (manualRefresh) {
    manualRefresh.addEventListener("click", () => {
      refreshMarketData();
    });
  }

  // Hero Timeframe Buttons
  document.querySelectorAll(".tf-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tf = btn.getAttribute("data-tf");
      renderHeroChart(AppState.activeHeroSymbol, tf);
    });
  });

  // Modal Close Buttons
  document.querySelectorAll(".modal-close-btn, .close-modal-trigger").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    });
  });

  // Close modals on overlay backdrop click
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  });

  // Quick Action Buttons
  const openCompareBtn = document.getElementById("actionCompareCoins");
  if (openCompareBtn) openCompareBtn.addEventListener("click", openCompareModal);

  const openAlertBtn = document.getElementById("actionSetAlert");
  if (openAlertBtn) openAlertBtn.addEventListener("click", openAlertModal);

  const exportCsvBtn = document.getElementById("actionExportCsv");
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", triggerCsvExport);

  // New Alert Form Submit
  const alertForm = document.getElementById("createAlertForm");
  if (alertForm) alertForm.addEventListener("submit", submitNewAlert);

  // Compare Coin Dropdown Change
  const cmp1 = document.getElementById("compareCoin1");
  const cmp2 = document.getElementById("compareCoin2");
  if (cmp1 && cmp2) {
    cmp1.addEventListener("change", loadComparisonChart);
    cmp2.addEventListener("change", loadComparisonChart);
  }

  // Theme Toggle (Dark/Light)
  const themeToggle = document.getElementById("themeToggleBtn");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
    });
  }
}

// ==========================================
// UTILITY FORMATTERS
// ==========================================
function formatUSD(val) {
  if (val === undefined || val === null) return "$0.00";
  return "$" + Number(val).toLocaleString(undefined, {
    minimumFractionDigits: val < 1 ? 4 : 2,
    maximumFractionDigits: val < 1 ? 4 : 2
  });
}

function formatShortCurrency(val) {
  if (!val) return "$0";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${Number(val).toLocaleString()}`;
}
