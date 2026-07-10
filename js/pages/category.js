// ============================================
// FILORAE — Category Page Script
// ============================================

import { initApp, refreshUI } from '../app.js';
import { getProducts, getCategories } from '../../firebase/firestore.js';
import { createProductCard, createSkeletonCard } from '../../components/product-card.js';
import { getUrlParams, sanitize } from '../utils/helpers.js';

initApp();

const params = getUrlParams();
const categorySlug = params.cat || '';

loadCategoryPage();

async function loadCategoryPage() {
  const titleEl = document.getElementById('category-title');
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  // Show skeleton
  for (let i = 0; i < 8; i++) {
    grid.appendChild(createSkeletonCard());
  }

  // Get category name
  const categories = await getCategories();
  const cat = categories.find(c => c.slug === categorySlug || c.id === categorySlug);

  if (titleEl) {
    titleEl.textContent = cat ? cat.name : categorySlug || 'All Products';
    document.title = `${cat ? cat.name : 'Category'} — Filorae`;
  }

  // Load products
  const result = await getProducts({ category: categorySlug, pageSize: 50 });
  grid.innerHTML = '';

  if (result.products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i data-lucide="package-x" class="empty-state__icon" style="width:80px;height:80px;"></i>
        <h2 class="empty-state__title">No products found</h2>
        <p class="empty-state__text">This category doesn't have any products yet.</p>
        <a href="shop.html" class="btn btn-primary">Browse All Products</a>
      </div>
    `;
  } else {
    result.products.forEach(p => grid.appendChild(createProductCard(p)));
  }

  refreshUI();
}
