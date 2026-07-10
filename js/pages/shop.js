// ============================================
// FILORAE — Shop Page Script
// ============================================

import { initApp, refreshUI } from '../app.js';
import { getProducts, getCategories } from '../../firebase/firestore.js';
import { createProductCard, createSkeletonCard } from '../../components/product-card.js';
import { getUrlParams, setUrlParams, debounce } from '../utils/helpers.js';

initApp();

// State
let currentProducts = [];
let lastDoc = null;
let hasMore = true;
let isLoading = false;

const state = {
  category: '',
  badge: '',
  sortBy: 'createdAt',
  minPrice: 0,
  maxPrice: 10000,
  inStock: undefined,
  search: '',
  view: 'grid',
};

// Init from URL params
const params = getUrlParams();
if (params.cat) state.category = params.cat;
if (params.badge) state.badge = params.badge;
if (params.sort) state.sortBy = params.sort;
if (params.search) state.search = params.search;
if (params.view) state.view = params.view;

// Load
loadFilters();
loadProducts(true);
updateActiveFilters();

// ---- Load Filters Sidebar ----
async function loadFilters() {
  const categories = await getCategories();
  const container = document.getElementById('filter-categories');
  if (!container) return;

  container.innerHTML = '';

  const allItem = document.createElement('div');
  allItem.className = 'filter-item';
  allItem.innerHTML = `
    <div class="checkbox-group">
      <input type="radio" name="category" id="cat-all" value="" ${!state.category ? 'checked' : ''}>
      <label class="checkbox-label" for="cat-all">All Products</label>
    </div>
  `;
  container.appendChild(allItem);

  const items = categories.length > 0 ? categories : [
    { id: 'keychains', name: 'Keychains', slug: 'keychains' },
    { id: 'bouquets', name: 'Bouquets', slug: 'bouquets' },
    { id: 'amigurumi', name: 'Amigurumi', slug: 'amigurumi' },
    { id: 'accessories', name: 'Accessories', slug: 'accessories' },
    { id: 'gifts', name: 'Gift Sets', slug: 'gifts' },
  ];

  items.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'filter-item';
    item.innerHTML = `
      <div class="checkbox-group">
        <input type="radio" name="category" id="cat-${cat.slug || cat.id}" value="${cat.slug || cat.id}" ${state.category === (cat.slug || cat.id) ? 'checked' : ''}>
        <label class="checkbox-label" for="cat-${cat.slug || cat.id}">${cat.name}</label>
      </div>
    `;
    container.appendChild(item);
  });

  // Category change
  container.querySelectorAll('input[name="category"]').forEach(input => {
    input.addEventListener('change', () => {
      state.category = input.value;
      setUrlParams({ cat: input.value || null });
      loadProducts(true);
      updateActiveFilters();
    });
  });

  // Price range
  const priceSlider = document.getElementById('price-range');
  const priceMax = document.getElementById('price-max-val');
  if (priceSlider) {
    priceSlider.addEventListener('input', debounce(() => {
      state.maxPrice = parseInt(priceSlider.value);
      if (priceMax) priceMax.textContent = `₹${state.maxPrice.toLocaleString('en-IN')}`;
      loadProducts(true);
    }, 500));
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = state.sortBy;
    sortSelect.addEventListener('change', () => {
      state.sortBy = sortSelect.value;
      setUrlParams({ sort: sortSelect.value });
      loadProducts(true);
    });
  }

  refreshUI();
}

// ---- Load Products ----
async function loadProducts(reset = false) {
  if (isLoading) return;
  isLoading = true;

  const grid = document.getElementById('product-grid');
  const loader = document.getElementById('infinite-loader');
  if (!grid) return;

  if (reset) {
    lastDoc = null;
    hasMore = true;
    currentProducts = [];
    grid.innerHTML = '';

    // Show skeletons
    for (let i = 0; i < 8; i++) {
      grid.appendChild(createSkeletonCard());
    }
  }

  const result = await getProducts({
    category: state.category,
    badge: state.badge,
    sortBy: state.sortBy,
    minPrice: state.minPrice > 0 ? state.minPrice : undefined,
    maxPrice: state.maxPrice < 10000 ? state.maxPrice : undefined,
    inStock: state.inStock,
    search: state.search,
    lastDoc,
  });

  if (reset) grid.innerHTML = '';

  // Update count even if 0
  const countEl = document.getElementById('product-count');

  if (result.products.length === 0 && currentProducts.length === 0) {
    if (countEl) countEl.textContent = '0 products';
    grid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1;">
        <i data-lucide="package-x" class="no-results__icon" style="width:80px;height:80px;display:block;margin:0 auto var(--space-6);color:var(--sage-300);"></i>
        <h3 class="no-results__title">No products found</h3>
        <p class="no-results__text">Try adjusting your filters or search terms.</p>
        <button class="btn btn-primary" onclick="window.location.href='shop.html'">View All Products</button>
      </div>
    `;
    refreshUI();
    isLoading = false;
    return;
  }

  result.products.forEach(product => {
    currentProducts.push(product);
    grid.appendChild(createProductCard(product));
  });

  lastDoc = result.lastDoc;
  hasMore = result.hasMore;

  // Update count
  if (countEl) countEl.textContent = `${currentProducts.length} product${currentProducts.length !== 1 ? 's' : ''}`;

  // Toggle loader
  if (loader) loader.style.display = hasMore ? 'flex' : 'none';

  refreshUI();
  isLoading = false;
}

// ---- Infinite Scroll ----
const infiniteObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && hasMore && !isLoading) {
      loadProducts(false);
    }
  });
}, { rootMargin: '300px' });

const loader = document.getElementById('infinite-loader');
if (loader) infiniteObserver.observe(loader);

// ---- Active Filters ----
function updateActiveFilters() {
  const container = document.getElementById('active-filters');
  if (!container) return;

  container.innerHTML = '';

  if (state.category) {
    addFilterTag(container, `Category: ${state.category}`, () => {
      state.category = '';
      setUrlParams({ cat: null });
      document.querySelector('input[name="category"][value=""]')?.click();
    });
  }

  if (state.badge) {
    addFilterTag(container, `Badge: ${state.badge}`, () => {
      state.badge = '';
      setUrlParams({ badge: null });
      loadProducts(true);
    });
  }

  refreshUI();
}

function addFilterTag(container, text, onRemove) {
  const tag = document.createElement('span');
  tag.className = 'active-filter-tag';
  tag.innerHTML = `${text} <button aria-label="Remove filter"><i data-lucide="x" style="width:12px;height:12px;"></i></button>`;
  tag.querySelector('button').addEventListener('click', () => {
    onRemove();
    updateActiveFilters();
  });
  container.appendChild(tag);
}

// ---- View Toggle ----
document.querySelectorAll('.view-toggle__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const grid = document.getElementById('product-grid');
    if (btn.dataset.view === 'list') {
      grid.classList.add('list-view');
    } else {
      grid.classList.remove('list-view');
    }
  });
});

// ---- Mobile Filter Toggle ----
const mobileFilterBtn = document.getElementById('mobile-filter-btn');
const filtersSidebar = document.getElementById('filters-sidebar');
const filtersOverlay = document.getElementById('filters-overlay');

if (mobileFilterBtn && filtersSidebar) {
  mobileFilterBtn.addEventListener('click', () => {
    filtersSidebar.classList.add('open');
    if (filtersOverlay) filtersOverlay.classList.add('open');
    document.body.classList.add('no-scroll');
  });

  if (filtersOverlay) {
    filtersOverlay.addEventListener('click', () => {
      filtersSidebar.classList.remove('open');
      filtersOverlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
    });
  }
}

// ---- Clear All Filters ----
const clearBtn = document.getElementById('clear-filters');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    state.category = '';
    state.badge = '';
    state.sortBy = 'createdAt';
    state.minPrice = 0;
    state.maxPrice = 10000;
    state.inStock = undefined;
    state.search = '';
    setUrlParams({ cat: null, badge: null, sort: null, search: null });
    document.querySelector('input[name="category"][value=""]')?.click();
    loadProducts(true);
    updateActiveFilters();
  });
}
