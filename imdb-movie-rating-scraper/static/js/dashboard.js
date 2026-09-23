/**
 * CineRank — Dashboard Analytics & Quick Insights
 * Renders mini Chart.js charts for rating distribution and decade trends on the dashboard.
 */

document.addEventListener("DOMContentLoaded", () => {
  initMiniCharts();
});

async function initMiniCharts() {
  const distCanvas = document.getElementById("miniRatingDistChart");
  const decadeCanvas = document.getElementById("miniDecadeChart");

  if (!distCanvas || !decadeCanvas) return;

  try {
    const response = await fetch("/api/analytics");
    if (!response.ok) throw new Error("Network response was not ok");
    const json = await response.json();
    if (!json.success || !json.data) throw new Error("Invalid analytics payload");

    const data = json.data;

    // Mini Rating Distribution Chart
    if (distCanvas && data.rating_distribution) {
      new Chart(distCanvas, {
        type: "bar",
        data: {
          labels: data.rating_distribution.labels,
          datasets: [
            {
              label: "Count",
              data: data.rating_distribution.data,
              backgroundColor: [
                "rgba(100, 116, 139, 0.6)",
                "rgba(59, 130, 246, 0.6)",
                "rgba(16, 185, 129, 0.7)",
                "rgba(245, 197, 24, 0.85)",
                "rgba(229, 9, 20, 0.9)"
              ],
              borderColor: [
                "#94a3b8",
                "#3b82f6",
                "#10b981",
                "#f5c518",
                "#e50914"
              ],
              borderWidth: 1,
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
              backgroundColor: "rgba(11, 12, 16, 0.95)",
              titleColor: "#f5c518",
              bodyColor: "#ffffff",
              borderColor: "rgba(245, 197, 24, 0.3)",
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (ctx) => `${ctx.parsed.y} movies in ${ctx.label}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa", font: { size: 11 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa", font: { size: 11 }, precision: 0 }
            }
          }
        }
      });
    }

    // Mini Decade Chart
    if (decadeCanvas && data.movies_by_decade) {
      new Chart(decadeCanvas, {
        type: "line",
        data: {
          labels: data.movies_by_decade.labels,
          datasets: [
            {
              label: "Movies",
              data: data.movies_by_decade.data,
              borderColor: "#f5c518",
              backgroundColor: "rgba(245, 197, 24, 0.12)",
              borderWidth: 2,
              pointBackgroundColor: "#f5c518",
              pointBorderColor: "#0b0c10",
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.35,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(11, 12, 16, 0.95)",
              titleColor: "#f5c518",
              bodyColor: "#ffffff",
              borderColor: "rgba(245, 197, 24, 0.3)",
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (ctx) => `${ctx.parsed.y} movies produced`
              }
            }
          },
          scales: {
            x: {
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa", font: { size: 11 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(255, 255, 255, 0.05)" },
              ticks: { color: "#a1a1aa", font: { size: 11 }, precision: 0 }
            }
          }
        }
      });
    }
  } catch (err) {
    console.error("Failed to load mini charts data:", err);
  }
}
