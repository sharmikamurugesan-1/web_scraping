/**
 * CineRank — Top 250 Analytics Engine
 * Visualizes 4 specialized Chart.js charts:
 * 1. Rating Distribution (Histogram/Bar)
 * 2. Movies by Decade (Bar / Area Trend)
 * 3. Top 10 Rated Movies (Horizontal Leaderboard)
 * 4. Rating vs. Release Year (Scatter Plot)
 */

let chartInstances = {};

document.addEventListener("DOMContentLoaded", () => {
  renderAllCharts();

  const refreshBtn = document.getElementById("refreshChartsBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      const icon = refreshBtn.querySelector("i");
      if (icon) icon.classList.add("fa-spin");

      renderAllCharts().finally(() => {
        if (icon) setTimeout(() => icon.classList.remove("fa-spin"), 500);
        if (window.showToast) {
          window.showToast("Updated", "Analytics visualizers refreshed successfully.", "green");
        }
      });
    });
  }
});

async function renderAllCharts() {
  try {
    const response = await fetch("/api/analytics");
    if (!response.ok) throw new Error("Failed to fetch analytics data");
    const json = await response.json();
    if (!json.success || !json.data) throw new Error("Invalid analytics format");

    const data = json.data;

    buildRatingDistChart(data.rating_distribution);
    buildDecadeChart(data.movies_by_decade);
    buildTopRatedChart(data.top_rated);
    buildScatterChart(data.rating_vs_year);

  } catch (err) {
    console.error("Error rendering analytics charts:", err);
    if (window.showToast) {
      window.showToast("Error", "Could not render analytics charts.", "error");
    }
  }
}

// Global Dark Theme Chart.js Defaults
const commonTooltipOptions = {
  backgroundColor: "rgba(11, 12, 16, 0.95)",
  titleColor: "#f5c518",
  bodyColor: "#ffffff",
  borderColor: "rgba(245, 197, 24, 0.35)",
  borderWidth: 1,
  padding: 12,
  cornerRadius: 6
};

const commonScaleOptions = {
  x: {
    grid: { color: "rgba(255, 255, 255, 0.05)" },
    ticks: { color: "#a1a1aa", font: { size: 12 } }
  },
  y: {
    grid: { color: "rgba(255, 255, 255, 0.05)" },
    ticks: { color: "#a1a1aa", font: { size: 12 } }
  }
};

/**
 * Chart 1: Rating Tier Distribution
 */
function buildRatingDistChart(distData) {
  const canvas = document.getElementById("ratingDistributionChart");
  if (!canvas || !distData) return;

  if (chartInstances.distChart) {
    chartInstances.distChart.destroy();
  }

  chartInstances.distChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: distData.labels,
      datasets: [
        {
          label: "Number of Movies",
          data: distData.data,
          backgroundColor: [
            "rgba(100, 116, 139, 0.65)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.75)",
            "rgba(245, 197, 24, 0.85)",
            "rgba(229, 9, 20, 0.95)"
          ],
          borderColor: [
            "#94a3b8",
            "#3b82f6",
            "#10b981",
            "#f5c518",
            "#e50914"
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...commonTooltipOptions,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} movies in bracket (${ctx.label})`
          }
        }
      },
      scales: {
        x: commonScaleOptions.x,
        y: {
          ...commonScaleOptions.y,
          beginAtZero: true,
          ticks: { color: "#a1a1aa", precision: 0 }
        }
      }
    }
  });
}

/**
 * Chart 2: Movies by Decade
 */
function buildDecadeChart(decadeData) {
  const canvas = document.getElementById("moviesByDecadeChart");
  if (!canvas || !decadeData) return;

  if (chartInstances.decadeChart) {
    chartInstances.decadeChart.destroy();
  }

  chartInstances.decadeChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: decadeData.labels,
      datasets: [
        {
          label: "Movies",
          data: decadeData.data,
          backgroundColor: "rgba(245, 197, 24, 0.75)",
          borderColor: "#f5c518",
          borderWidth: 1.5,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...commonTooltipOptions,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} top 250 films in ${ctx.label}`
          }
        }
      },
      scales: {
        x: commonScaleOptions.x,
        y: {
          ...commonScaleOptions.y,
          beginAtZero: true,
          ticks: { color: "#a1a1aa", precision: 0 }
        }
      }
    }
  });
}

/**
 * Chart 3: Top 10 Rated Movies (Horizontal Leaderboard)
 */
function buildTopRatedChart(topData) {
  const canvas = document.getElementById("topRatedMoviesChart");
  if (!canvas || !topData) return;

  if (chartInstances.topChart) {
    chartInstances.topChart.destroy();
  }

  // Reverse arrays so #1 is at the top of horizontal bar chart
  const titles = [...topData.titles].reverse();
  const ratings = [...topData.ratings].reverse();

  chartInstances.topChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: titles,
      datasets: [
        {
          label: "IMDb Rating",
          data: ratings,
          backgroundColor: "rgba(245, 197, 24, 0.8)",
          borderColor: "#f5c518",
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...commonTooltipOptions,
          callbacks: {
            label: (ctx) => `Rating: ${ctx.parsed.x.toFixed(1)} / 10`
          }
        }
      },
      scales: {
        x: {
          min: 8.0,
          max: 10.0,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#a1a1aa", stepSize: 0.5 }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#ffffff", font: { size: 11.5, weight: "500" } }
        }
      }
    }
  });
}

/**
 * Chart 4: Rating vs. Release Year Scatter
 */
function buildScatterChart(scatterPoints) {
  const canvas = document.getElementById("ratingVsYearChart");
  if (!canvas || !scatterPoints) return;

  if (chartInstances.scatterChart) {
    chartInstances.scatterChart.destroy();
  }

  chartInstances.scatterChart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Movie",
          data: scatterPoints,
          backgroundColor: "rgba(245, 197, 24, 0.65)",
          borderColor: "#f5c518",
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: "#e50914",
          pointHoverBorderColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...commonTooltipOptions,
          callbacks: {
            title: (items) => {
              const raw = items[0].raw;
              return `#${raw.rank} - ${raw.title}`;
            },
            label: (item) => {
              const raw = item.raw;
              return `Year: ${raw.x} | Rating: ${raw.y.toFixed(1)} / 10`;
            }
          }
        }
      },
      scales: {
        x: {
          ...commonScaleOptions.x,
          title: { display: true, text: "Release Year", color: "#a1a1aa" }
        },
        y: {
          min: 7.5,
          max: 9.5,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#a1a1aa", stepSize: 0.5 },
          title: { display: true, text: "IMDb Rating", color: "#a1a1aa" }
        }
      }
    }
  });
}
