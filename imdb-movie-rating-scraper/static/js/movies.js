/**
 * CineRank — IMDb Top 250 Movie Screener Client
 * Handles live search with debounce, multifaceted filters, sorting, view switching,
 * dynamic pagination, and details modal rendering.
 */

let state = {
  q: "",
  minRating: "",
  yearRange: "",
  rankRange: "",
  sortBy: "rank_asc",
  page: 1,
  limit: 24,
  viewMode: "grid" // 'grid' or 'table'
};

let debounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initUrlParams();
  attachEventListeners();
  loadMovies();
});

function initUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("q")) {
    state.q = params.get("q");
    const searchInput = document.getElementById("movieSearchInput");
    if (searchInput) searchInput.value = state.q;
  }
}

function attachEventListeners() {
  // Search input
  const searchInput = document.getElementById("movieSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.q = e.target.value.trim();
        state.page = 1;
        loadMovies();
      }, 300);
    });
  }

  // Clear search button
  const clearBtn = document.getElementById("clearSearchBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      state.q = "";
      state.page = 1;
      loadMovies();
    });
  }

  // Rating Filter
  const ratingSelect = document.getElementById("ratingFilterSelect");
  if (ratingSelect) {
    ratingSelect.addEventListener("change", (e) => {
      state.minRating = e.target.value;
      state.page = 1;
      loadMovies();
    });
  }

  // Year Filter
  const yearSelect = document.getElementById("yearFilterSelect");
  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      state.yearRange = e.target.value;
      state.page = 1;
      loadMovies();
    });
  }

  // Rank Filter
  const rankSelect = document.getElementById("rankFilterSelect");
  if (rankSelect) {
    rankSelect.addEventListener("change", (e) => {
      state.rankRange = e.target.value;
      state.page = 1;
      loadMovies();
    });
  }

  // Sort Select
  const sortSelect = document.getElementById("movieSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      state.page = 1;
      loadMovies();
    });
  }

  // Items per page
  const itemsPerPageSelect = document.getElementById("itemsPerPageSelect");
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      state.limit = parseInt(e.target.value, 10) || 24;
      state.page = 1;
      loadMovies();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById("resetFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.q = "";
      state.minRating = "";
      state.yearRange = "";
      state.rankRange = "";
      state.sortBy = "rank_asc";
      state.page = 1;

      if (searchInput) searchInput.value = "";
      if (ratingSelect) ratingSelect.value = "";
      if (yearSelect) yearSelect.value = "";
      if (rankSelect) rankSelect.value = "";
      if (sortSelect) sortSelect.value = "rank_asc";

      loadMovies();
    });
  }

  // View Mode Toggles
  const gridBtn = document.getElementById("viewModeGridBtn");
  const tableBtn = document.getElementById("viewModeTableBtn");
  const gridView = document.getElementById("moviesGridView");
  const tableView = document.getElementById("moviesTableView");

  if (gridBtn && tableBtn && gridView && tableView) {
    gridBtn.addEventListener("click", () => {
      state.viewMode = "grid";
      gridBtn.classList.add("active");
      tableBtn.classList.remove("active");
      gridView.classList.remove("d-none");
      tableView.classList.add("d-none");
    });

    tableBtn.addEventListener("click", () => {
      state.viewMode = "table";
      tableBtn.classList.add("active");
      gridBtn.classList.remove("active");
      gridView.classList.add("d-none");
      tableView.classList.remove("d-none");
    });
  }
}

async function loadMovies() {
  const spinner = document.getElementById("moviesLoadingSpinner");
  const emptyState = document.getElementById("moviesEmptyState");
  const gridView = document.getElementById("moviesGridView");
  const tableView = document.getElementById("moviesTableView");
  const tableBody = document.getElementById("moviesTableBody");
  const countDisplay = document.getElementById("showingCountDisplay");

  if (spinner) spinner.classList.remove("d-none");
  if (emptyState) emptyState.classList.add("d-none");

  // Build API Query URL
  const params = new URLSearchParams();
  if (state.q) params.append("q", state.q);
  if (state.minRating) params.append("min_rating", state.minRating);

  if (state.yearRange) {
    const parts = state.yearRange.split("-");
    if (parts.length === 2) {
      params.append("min_year", parts[0]);
      params.append("max_year", parts[1]);
    }
  }

  if (state.rankRange) {
    const parts = state.rankRange.split("-");
    if (parts.length === 2) {
      params.append("min_rank", parts[0]);
      params.append("max_rank", parts[1]);
    }
  }

  params.append("sort_by", state.sortBy);
  params.append("page", state.page);
  params.append("limit", state.limit);

  try {
    const res = await fetch(`/api/movies?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load movies");
    const data = await res.json();

    if (spinner) spinner.classList.add("d-none");

    const movies = data.movies || [];
    const totalFiltered = data.filtered_count || 0;
    const totalAll = data.total || 250;

    // Update Showing Count
    if (countDisplay) {
      const start = movies.length > 0 ? (data.page - 1) * data.limit + 1 : 0;
      const end = (data.page - 1) * data.limit + movies.length;
      countDisplay.textContent = `Showing ${start}–${end} of ${totalFiltered} movies (Total dataset: ${totalAll})`;
    }

    if (movies.length === 0) {
      if (emptyState) emptyState.classList.remove("d-none");
      if (gridView) gridView.innerHTML = "";
      if (tableBody) tableBody.innerHTML = "";
      renderPagination(1, 1);
      return;
    }

    renderGridView(movies);
    renderTableView(movies);
    renderPagination(data.page, data.total_pages);

  } catch (err) {
    console.error("Error loading movies:", err);
    if (spinner) spinner.classList.add("d-none");
    if (window.showToast) {
      window.showToast("Error", "Failed to fetch movie data.", "error");
    }
  }
}

function getSvgPoster(title, year, rank) {
  const safeTitle = (title || "Movie").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const displayTitle = safeTitle.length > 22 ? safeTitle.substring(0, 20) + "…" : safeTitle;
  const rankStr = rank ? `#${rank}` : "";
  const yearStr = year ? `(${year})` : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="200" height="300">
    <defs>
      <linearGradient id="g_${rank || 1}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e2230"/>
        <stop offset="100%" stop-color="#0b0c10"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g_${rank || 1})"/>
    <rect x="8" y="8" width="184" height="284" rx="6" fill="none" stroke="#f5c518" stroke-width="1" stroke-opacity="0.3" stroke-dasharray="4 4"/>
    <text x="100" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" text-anchor="middle">🎬</text>
    <text x="100" y="155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#f5c518">${rankStr}</text>
    <text x="100" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" text-anchor="middle" fill="#ffffff">${displayTitle}</text>
    <text x="100" y="205" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" text-anchor="middle" fill="#94a3b8">${yearStr}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function renderGridView(movies) {
  const gridView = document.getElementById("moviesGridView");
  if (!gridView) return;

  gridView.innerHTML = movies.map(m => {
    const fallbackSvg = getSvgPoster(m.Title, m.Year, m.Rank);
    const poster = (m.Poster && m.Poster.startsWith("http")) ? m.Poster : fallbackSvg;
    const titleEscaped = escapeHtml(m.Title);

    return `
      <div class="col">
        <div class="movie-card h-100 position-relative" onclick="openDetailsModal(${m.Rank})" role="button" tabindex="0" title="Click to view ${titleEscaped}">
          <span class="movie-card-rank">#${m.Rank}</span>
          <div class="movie-poster-wrap">
            <img src="${poster}" 
                 alt="${titleEscaped}" 
                 loading="lazy" 
                 referrerpolicy="no-referrer"
                 onerror="this.onerror=null; this.src='${fallbackSvg}';">
            <div class="movie-poster-overlay">
              <button class="btn btn-gold btn-sm px-3 py-1 shadow" onclick="event.stopPropagation(); openDetailsModal(${m.Rank})">
                <i class="fa-solid fa-circle-info"></i> Details
              </button>
            </div>
          </div>
          <div class="movie-card-body p-3">
            <div class="movie-card-title text-truncate" title="${titleEscaped}">
              ${titleEscaped}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2" style="font-size: 13px;">
              <span class="text-secondary"><i class="fa-regular fa-calendar me-1"></i>${m.Year}</span>
              <span class="rating-star-badge">
                <i class="fa-solid fa-star"></i> ${parseFloat(m["IMDb Rating"]).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderTableView(movies) {
  const tableBody = document.getElementById("moviesTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = movies.map(m => {
    const fallbackSvg = getSvgPoster(m.Title, m.Year, m.Rank);
    const poster = (m.Poster && m.Poster.startsWith("http")) ? m.Poster : fallbackSvg;
    const titleEscaped = escapeHtml(m.Title);

    return `
      <tr onclick="openDetailsModal(${m.Rank})" style="cursor: pointer;">
        <td class="fw-bold text-gold">#${m.Rank}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${poster}" alt="${titleEscaped}" class="table-poster-thumb" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackSvg}';">
            <div>
              <div class="fw-bold text-white">${titleEscaped}</div>
              ${m["IMDb URL"] ? `
                <a href="${m["IMDb URL"]}" target="_blank" rel="noopener noreferrer" class="text-muted text-decoration-none" style="font-size: 11px;" onclick="event.stopPropagation();">
                  IMDb Profile <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 9px;"></i>
                </a>
              ` : ""}
            </div>
          </div>
        </td>
        <td>${m.Year}</td>
        <td>
          <span class="rating-star-badge">
            <i class="fa-solid fa-star"></i> ${parseFloat(m["IMDb Rating"]).toFixed(1)}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-dark-custom btn-sm" onclick="event.stopPropagation(); openDetailsModal(${m.Rank})">
            Details
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderPagination(currentPage, totalPages) {
  const container = document.getElementById("paginationControls");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" onclick="goToPage(${currentPage - 1})" aria-label="Previous">
        &laquo;
      </button>
    </li>
  `;

  // Page Numbers with Smart Window
  const maxButtons = 7;
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<li class="page-item"><button class="page-link" onclick="goToPage(1)">1</button></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    html += `
      <li class="page-item ${p === currentPage ? "active" : ""}">
        <button class="page-link" onclick="goToPage(${p})">${p}</button>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    }
    html += `<li class="page-item"><button class="page-link" onclick="goToPage(${totalPages})">${totalPages}</button></li>`;
  }

  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <button class="page-link" onclick="goToPage(${currentPage + 1})" aria-label="Next">
        &raquo;
      </button>
    </li>
  `;

  container.innerHTML = html;
}

window.goToPage = function(pageNumber) {
  state.page = pageNumber;
  loadMovies();
  window.scrollTo({ top: 120, behavior: "smooth" });
};

window.openDetailsModal = async function(rank) {
  try {
    const res = await fetch(`/api/movies/${rank}`);
    if (!res.ok) throw new Error("Failed to fetch movie details");
    const data = await res.json();
    if (!data.success || !data.movie) return;

    const movie = data.movie;
    const fallbackSvg = getSvgPoster(movie.Title, movie.Year, movie.Rank);

    const rankEl = document.getElementById("modalMovieRank");
    if (rankEl) rankEl.textContent = `Rank #${movie.Rank}`;

    const titleEl = document.getElementById("modalMovieTitle");
    if (titleEl) titleEl.textContent = movie.Title;

    const ratingEl = document.getElementById("modalMovieRating");
    if (ratingEl) ratingEl.textContent = parseFloat(movie["IMDb Rating"]).toFixed(1);

    const yearEl = document.getElementById("modalMovieYear");
    if (yearEl) yearEl.textContent = movie.Year;

    const posterEl = document.getElementById("modalMoviePoster");
    if (posterEl) {
      posterEl.referrerPolicy = "no-referrer";
      posterEl.onerror = function() {
        this.onerror = null;
        this.src = fallbackSvg;
      };
      posterEl.src = (movie.Poster && movie.Poster.startsWith("http")) ? movie.Poster : fallbackSvg;
      posterEl.alt = movie.Title;
    }

    const descEl = document.getElementById("modalPlacementDescription");
    if (descEl) {
      descEl.textContent = `Movie #${movie.Rank} on the IMDb Top 250 with an aggregate score of ${parseFloat(movie["IMDb Rating"]).toFixed(1)}/10 from verified international audiences.`;
    }

    const imdbLinkEl = document.getElementById("modalImdbExternalLink");
    if (imdbLinkEl) {
      imdbLinkEl.href = movie["IMDb URL"] || `https://www.imdb.com/find?q=${encodeURIComponent(movie.Title)}`;
    }

    const modalEl = document.getElementById("movieDetailsModal");
    if (modalEl && window.bootstrap) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    }
  } catch (err) {
    console.error("Error opening movie modal:", err);
    if (window.showToast) {
      window.showToast("Error", "Could not load movie details.", "error");
    }
  }
};

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
