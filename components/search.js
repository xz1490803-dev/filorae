// ============================================
// FILORAE — Search Overlay Component
// ============================================

import { searchProducts } from '../firebase/firestore.js';
import { createProductCard } from './product-card.js';
import { debounce, sanitize } from '../js/utils/helpers.js';
import { getLocal, setLocal } from '../js/utils/cache.js';

/**
 * Render and initialize the search overlay
 */
export function renderSearchOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.id = 'search-overlay';

  overlay.innerHTML = `
    <button class="search-overlay__close" aria-label="Close search">
      <i data-lucide="x" style="width:24px;height:24px;"></i>
    </button>
    <div class="search-overlay__input-wrap">
      <input type="search" class="search-overlay__input" placeholder="Search for products..." aria-label="Search products" autocomplete="off">
    </div>
    <div class="search-overlay__results" id="search-results">
      <div class="search-recent" id="search-recent"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.search-overlay__close');
  const input = overlay.querySelector('.search-overlay__input');
  const resultsContainer = document.getElementById('search-results');

  // Close
  closeBtn.addEventListener('click', closeSearch);

  // ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeSearch();
    }
  });

  // Search on input
  const debouncedSearch = debounce(async (query) => {
    if (!query || query.length < 2) {
      showRecentSearches();
      return;
    }

    resultsContainer.innerHTML = `
      <div style="display:flex;justify-content:center;padding:var(--space-8);">
        <div class="spinner"></div>
      </div>
    `;

    const results = await searchProducts(query);

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align:center;padding:var(--space-10);">
          <i data-lucide="search-x" style="width:48px;height:48px;color:var(--sage-300);margin:0 auto var(--space-4);display:block;"></i>
          <p style="color:var(--color-text-muted);">No products found for "<strong>${sanitize(query)}</strong>"</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);text-align:center;">${results.length} result${results.length > 1 ? 's' : ''} for "${sanitize(query)}"</p>
        <div class="search-results-grid" id="search-results-grid"></div>
      `;
      const grid = document.getElementById('search-results-grid');
      results.forEach(product => {
        grid.appendChild(createProductCard(product));
      });

      // Save to recent
      saveRecentSearch(query);
    }

    if (window.lucide) window.lucide.createIcons();
  }, 400);

  input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.trim());
  });

  // Show recent searches on open
  showRecentSearches();
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    const input = overlay.querySelector('.search-overlay__input');
    if (input) input.value = '';
  }
}

function showRecentSearches() {
  const container = document.getElementById('search-recent');
  if (!container) return;

  const recent = getLocal('recent_searches') || [];

  if (recent.length === 0) {
    container.innerHTML = `
      <div style="padding:var(--space-10);text-align:center;">
        <i data-lucide="search" style="width:48px;height:48px;color:var(--sage-200);margin:0 auto var(--space-4);display:block;"></i>
        <p style="color:var(--color-text-muted);font-size:var(--text-sm);">Start typing to search products...</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <h3>Recent Searches</h3>
      <div class="search-recent-tags">
        ${recent.map(s => `<span class="tag" data-search="${sanitize(s)}">${sanitize(s)}</span>`).join('')}
      </div>
    `;

    container.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const input = document.querySelector('.search-overlay__input');
        if (input) {
          input.value = tag.dataset.search;
          input.dispatchEvent(new Event('input'));
        }
      });
    });
  }

  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer && !resultsContainer.querySelector('.search-recent')) {
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(container);
  }

  if (window.lucide) window.lucide.createIcons();
}

function saveRecentSearch(query) {
  let recent = getLocal('recent_searches') || [];
  recent = recent.filter(s => s !== query);
  recent.unshift(query);
  recent = recent.slice(0, 8);
  setLocal('recent_searches', recent);
}
