// ─────────────────────────────────────────────────────────
//  Awesome Hacking Directory – Application Logic
//  Search, filter, render
//  Built by Vatsal
// ─────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────────────────
  const searchInput = document.getElementById("search-input");
  const filtersContainer = document.getElementById("filters");
  const awesomeGrid = document.getElementById("awesome-grid");
  const otherGrid = document.getElementById("other-grid");
  const awesomeCount = document.getElementById("awesome-count");
  const otherCount = document.getElementById("other-count");
  const searchCount = document.getElementById("search-count");
  const totalCount = document.getElementById("total-count");
  const awesomeSection = document.getElementById("awesome-section");
  const otherSection = document.getElementById("other-section");
  const emptyState = document.getElementById("empty-state");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  // ── State ─────────────────────────────────────────────
  let activeCategory = "All";
  let searchQuery = "";

  // ── Initialize ────────────────────────────────────────
  function init() {
    renderFilters();
    renderAll();
    bindEvents();
    updateStats();
  }

  // ── Render filter pills ───────────────────────────────
  function renderFilters() {
    const allBtn = createFilterBtn("All", true);
    filtersContainer.appendChild(allBtn);

    CATEGORIES.forEach(cat => {
      const btn = createFilterBtn(cat, false);
      filtersContainer.appendChild(btn);
    });
  }

  function createFilterBtn(label, isActive) {
    const btn = document.createElement("button");
    btn.className = `filter-btn${isActive ? " active" : ""}`;
    btn.textContent = label;
    btn.setAttribute("data-category", label);
    btn.addEventListener("click", () => {
      activeCategory = label;
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderAll();
    });
    return btn;
  }

  // ── Filter resources ──────────────────────────────────
  function getFiltered(section) {
    return RESOURCES.filter(r => {
      const matchSection = r.section === section;
      const matchCategory = activeCategory === "All" || r.category === activeCategory;
      const matchSearch = searchQuery === "" ||
        r.name.toLowerCase().includes(searchQuery) ||
        r.description.toLowerCase().includes(searchQuery) ||
        r.category.toLowerCase().includes(searchQuery);
      return matchSection && matchCategory && matchSearch;
    });
  }

  // ── Render all ────────────────────────────────────────
  function renderAll() {
    const awesome = getFiltered("awesome");
    const other = getFiltered("other");

    renderGrid(awesomeGrid, awesome);
    renderGrid(otherGrid, other);

    awesomeCount.textContent = awesome.length;
    otherCount.textContent = other.length;

    const total = awesome.length + other.length;
    searchCount.innerHTML = `Showing <strong>${total}</strong> of <strong>${RESOURCES.length}</strong> resources`;

    awesomeSection.style.display = awesome.length ? "" : "none";
    otherSection.style.display = other.length ? "" : "none";
    emptyState.style.display = total === 0 ? "" : "none";
  }

  // ── Render grid ───────────────────────────────────────
  function renderGrid(container, items) {
    container.innerHTML = "";
    items.forEach((item, i) => {
      const card = createCard(item, i);
      container.appendChild(card);
    });
  }

  // ── Create card element ───────────────────────────────
  function createCard(item) {
    const a = document.createElement("a");
    a.className = "resource-card";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    a.innerHTML = `
      <div class="card-header">
        <div class="card-icon">${item.icon}</div>
        <div class="card-title-group">
          <div class="card-title">${highlight(item.name)}</div>
          <div class="card-category">${item.category}</div>
        </div>
      </div>
      <div class="card-description">${highlight(item.description)}</div>
      <div class="card-footer">
        <span class="card-section-tag">${item.section === "awesome" ? "⭐ Awesome List" : "📂 Resource"}</span>
        <span class="card-link-indicator">
          Open
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </span>
      </div>
    `;

    return a;
  }

  // ── Highlight search matches ──────────────────────────
  function highlight(text) {
    if (!searchQuery) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, "gi");
    return escaped.replace(regex, '<mark style="background:rgba(0,240,255,0.2);color:var(--accent-primary);border-radius:2px;padding:0 2px;">$1</mark>');
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ── Bind events ───────────────────────────────────────
  function bindEvents() {
    // Search
    searchInput.addEventListener("input", debounce(function () {
      searchQuery = this.value.toLowerCase().trim();
      renderAll();
    }, 200));

    // Keyboard shortcut: / to focus search
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInput) {
        searchInput.blur();
        searchInput.value = "";
        searchQuery = "";
        renderAll();
      }
    });

    // Smooth scroll nav links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // Close mobile nav
          navLinks.classList.remove("open");
        }
      });
    });

    // Mobile nav toggle
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
  }

  // ── Update hero stats ─────────────────────────────────
  function updateStats() {
    totalCount.textContent = RESOURCES.length;
    document.getElementById("stat-categories").textContent = CATEGORIES.length;
    document.getElementById("stat-awesome").textContent = RESOURCES.filter(r => r.section === "awesome").length;
  }

  // ── Debounce helper ───────────────────────────────────
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ── Boot ──────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);
})();
