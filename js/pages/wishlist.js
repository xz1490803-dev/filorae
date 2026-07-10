// ============================================
// FILORAE — Wishlist Page Script
// ============================================

import { initApp, refreshUI } from '../app.js';
import { getProduct } from '../../firebase/firestore.js';
import { createProductCard } from '../../components/product-card.js';
import { getLocal } from '../utils/cache.js';

initApp();
loadWishlist();

async function loadWishlist() {
  const grid = document.getElementById('wishlist-grid');
  const countEl = document.getElementById('wishlist-count-text');
  if (!grid) return;

  const wishlistIds = getLocal('wishlist') || [];

  if (wishlistIds.length === 0) {
    if (countEl) countEl.textContent = '0 items';
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i data-lucide="heart" class="empty-state__icon" style="width:80px;height:80px;"></i>
        <h2 class="empty-state__title">Your wishlist is empty</h2>
        <p class="empty-state__text">Save your favorite items to revisit them later.</p>
        <a href="shop.html" class="btn btn-primary">Browse Products</a>
      </div>
    `;
    refreshUI();
    return;
  }

  if (countEl) countEl.textContent = `${wishlistIds.length} item${wishlistIds.length !== 1 ? 's' : ''}`;

  // Load products
  grid.innerHTML = '<div class="spinner" style="margin:var(--space-8) auto;"></div>';

  const products = await Promise.all(
    wishlistIds.map(id => getProduct(id))
  );

  grid.innerHTML = '';
  products.filter(Boolean).forEach(product => {
    grid.appendChild(createProductCard(product));
  });

  refreshUI();
}
