/**
 * CineRank — Scraper Control Center Client
 * Handles real-time telemetry polling, start/stop scraping lifecycle,
 * headless toggle parameters, animated progress bar, and terminal log stream.
 */

let pollInterval = null;
let lastLogMessage = "";

document.addEventListener("DOMContentLoaded", () => {
  initScraperConsole();
});

function initScraperConsole() {
  const startBtn = document.getElementById("startScrapeBtn");
  const stopBtn = document.getElementById("stopScrapeBtn");
  const clearBtn = document.getElementById("clearDataBtn");
  const clearLogsBtn = document.getElementById("clearLogsBtn");
  const headlessToggle = document.getElementById("headlessModeToggle");

  // Initial status check
  checkScraperStatus();

  // Start button
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      const isHeadless = headlessToggle ? headlessToggle.checked : true;
      appendTerminalLog(`[Controller] Initializing scraper job (Headless Mode: ${isHeadless})...`);

      try {
        startBtn.disabled = true;
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headless: isHeadless })
        });

        const data = await res.json();
        if (data.success) {
          appendTerminalLog(`[Controller] ${data.message}`);
          if (window.showToast) {
            window.showToast("Scraper Started", "Selenium Chrome engine launched in background.", "gold");
          }
          startPolling();
        } else {
          appendTerminalLog(`[Error] ${data.message || "Could not launch scraper."}`);
          if (window.showToast) {
            window.showToast("Scraper Busy", data.message, "error");
          }
          startBtn.disabled = false;
        }
      } catch (err) {
        console.error("Failed to start scrape:", err);
        appendTerminalLog(`[Fatal Error] Communication failure: ${err.message}`);
        startBtn.disabled = false;
      }
    });
  }

  // Stop button
  if (stopBtn) {
    stopBtn.addEventListener("click", async () => {
      appendTerminalLog("[Controller] Transmitting abort signal to Selenium engine...");
      stopBtn.disabled = true;

      try {
        const res = await fetch("/api/scrape/stop", { method: "POST" });
        const data = await res.json();
        appendTerminalLog(`[Controller] ${data.message}`);
        if (window.showToast) {
          window.showToast("Stopping Scraper", "Shutdown signal sent to Chrome driver.", "gold");
        }
      } catch (err) {
        console.error("Failed to stop scraper:", err);
      }
    });
  }

  // Clear data button
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to reset the movie dataset back to verified baseline data?")) {
        return;
      }

      appendTerminalLog("[System] Resetting dataset to baseline seed data...");
      try {
        const res = await fetch("/api/clear", { method: "POST" });
        const data = await res.json();
        appendTerminalLog(`[System] ${data.message}`);
        if (window.showToast) {
          window.showToast("Dataset Reset", "Restored verified baseline movie dataset.", "green");
        }
        checkScraperStatus();
      } catch (err) {
        console.error("Failed to reset dataset:", err);
      }
    });
  }

  // Clear terminal logs
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener("click", () => {
      const logBox = document.getElementById("terminalLogBox");
      if (logBox) {
        logBox.innerHTML = '<div class="text-muted">[System] Logs cleared. Ready.</div>';
      }
    });
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkScraperStatus, 800);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function checkScraperStatus() {
  try {
    const res = await fetch("/api/scrape/status");
    if (!res.ok) return;
    const json = await res.json();
    if (!json.success || !json.status) return;

    updateConsoleUI(json.status);
  } catch (err) {
    console.error("Status check failed:", err);
  }
}

function updateConsoleUI(st) {
  const startBtn = document.getElementById("startScrapeBtn");
  const stopBtn = document.getElementById("stopScrapeBtn");
  const dot = document.getElementById("scraperStatusDot");
  const title = document.getElementById("scraperStatusTitle");
  const percentText = document.getElementById("scraperProgressPercent");
  const progressBar = document.getElementById("scraperProgressBar");
  const countText = document.getElementById("scraperCountText");
  const currentMovieText = document.getElementById("scraperCurrentMovieText");

  const isRunning = st.status === "running";
  const progress = Math.min(100, Math.max(0, Math.round(st.progress || 0)));

  // Button state toggle
  if (startBtn && stopBtn) {
    if (isRunning) {
      startBtn.classList.add("d-none");
      stopBtn.classList.remove("d-none");
      stopBtn.disabled = false;
    } else {
      startBtn.classList.remove("d-none");
      startBtn.disabled = false;
      stopBtn.classList.add("d-none");
    }
  }

  // Status Dot & Badge
  if (dot) {
    dot.className = "pulse-dot";
    if (st.status === "running") dot.classList.add("running");
    else if (st.status === "completed") dot.classList.add("completed");
    else if (st.status === "error") dot.classList.add("error");
    else dot.classList.add("idle");
  }

  // Title Status text
  if (title) {
    const capitalized = st.status.charAt(0).toUpperCase() + st.status.slice(1);
    title.textContent = `Status: ${capitalized}`;
  }

  // Progress Bar & Percentage
  if (percentText) percentText.textContent = `${progress}%`;
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute("aria-valuenow", progress);
    progressBar.textContent = `${progress}%`;
  }

  // Movie counters
  if (countText) {
    countText.textContent = `${st.scraped_count || 0} / 250 movies scraped`;
  }
  if (currentMovieText) {
    currentMovieText.textContent = st.current_movie || "None";
  }

  // Terminal log injection
  if (st.message && st.message !== lastLogMessage) {
    lastLogMessage = st.message;
    appendTerminalLog(`[Engine] ${st.message}`);
  }

  // If scraper has completed or errored, stop aggressive polling
  if (!isRunning && pollInterval) {
    stopPolling();
    if (st.status === "completed") {
      appendTerminalLog(`[Finished] Successfully scraped ${st.scraped_count} movies. Dataset saved to data/movies.csv.`);
      if (window.showToast) {
        window.showToast("Scraping Completed", "All 250 IMDb movies updated.", "green");
      }
    } else if (st.status === "error") {
      appendTerminalLog(`[Halted] Scraper terminated with status: ${st.message}`);
    }
  } else if (isRunning && !pollInterval) {
    // If running on initial page load, start polling loop
    startPolling();
  }
}

function appendTerminalLog(text) {
  const logBox = document.getElementById("terminalLogBox");
  if (!logBox) return;

  const timestamp = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.style.marginBottom = "3px";
  line.innerHTML = `<span style="color: #64748b;">[${timestamp}]</span> ${escapeLog(text)}`;
  logBox.appendChild(line);

  // Auto-scroll to bottom
  logBox.scrollTop = logBox.scrollHeight;
}

function escapeLog(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
