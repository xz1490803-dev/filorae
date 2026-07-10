// ============================================
// FILORAE — Product Card Component
// ============================================

import { formatPrice, calcDiscount, renderStars, renderBadge, sanitize } from '../js/utils/helpers.js';
import { getCurrentUser } from '../firebase/auth.js';
import { addToWishlist, removeFromWishlist } from '../firebase/firestore.js';
import { getLocal, setLocal } from '../js/utils/cache.js';
import { showToast } from './toast.js';
import { updateWishlistCount } from './navbar.js';

/**
 * Create a product card HTML element
 */
export function createProductCard(product) {
  const {
    id, name, slug, price, oldPrice, images = [], hoverImage,
    category, badge, rating = 0, reviewCount = 0, inStock = true
  } = product;

  const discount = calcDiscount(price, oldPrice);
  const normalizedImages = images.map(img => typeof img === 'string' ? img : (img ? img.url : ''));
  const primaryImage = normalizedImages[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23e8dfd0"%3E%3Crect width="400" height="400"/%3E%3C/svg%3E';
  const hoverImg = hoverImage || normalizedImages[1] || primaryImage;
  const productUrl = `product.html?id=${id}`;
  const wishlist = getLocal('wishlist') || [];
  const isWished = wishlist.includes(id);

  const card = document.createElement('article');
  card.className = `product-card animate-on-scroll fade-up ${!inStock ? 'out-of-stock' : ''}`;
  card.setAttribute('data-product-id', id);

  card.innerHTML = `
    <!-- Image -->
    <div class="product-card__image-wrap">
      <a href="${productUrl}" aria-label="View ${sanitize(name)}">
        <img src="${primaryImage}" alt="${sanitize(name)}" class="product-card__image product-card__image--primary" loading="lazy" width="400" height="400">
        <img src="${hoverImg}" alt="" class="product-card__image product-card__image--hover" loading="lazy" width="400" height="400" aria-hidden="true">
      </a>

      ${badge ? `<div class="product-card__badge">${renderBadge(badge)}</div>` : ''}

      <button class="product-card__wishlist ${isWished ? 'active' : ''}" aria-label="${isWished ? 'Remove from' : 'Add to'} wishlist" data-product-id="${id}">
        <i data-lucide="${isWished ? 'heart' : 'heart'}" style="width:18px;height:18px;${isWished ? 'fill:currentColor;' : ''}"></i>
      </button>

      <div class="product-card__actions">
        <button class="product-card__action-btn" data-quickview="${id}" aria-label="Quick view">
          <i data-lucide="eye" style="width:16px;height:16px;"></i>
        </button>
        <button class="product-card__action-btn share-btn" data-share="${id}" data-name="${sanitize(name)}" aria-label="Share">
          <i data-lucide="share-2" style="width:16px;height:16px;"></i>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="product-card__body">
      ${category ? `<span class="product-card__category">${sanitize(category)}</span>` : ''}

      <h3 class="product-card__name">
        <a href="${productUrl}">${sanitize(name)}</a>
      </h3>

      <div class="product-card__pricing">
        <span class="product-card__price">${formatPrice(price)}</span>
        ${oldPrice ? `<span class="product-card__old-price">${formatPrice(oldPrice)}</span>` : ''}
        ${discount > 0 ? `<span class="product-card__discount">-${discount}%</span>` : ''}
      </div>

      ${rating > 0 ? `
        <div class="product-card__rating">
          <div class="product-card__stars">${renderStars(rating, 12)}</div>
          <span class="product-card__review-count">(${reviewCount})</span>
        </div>
      ` : ''}

      <div class="product-card__stock ${inStock ? 'product-card__stock--available' : 'product-card__stock--out'}">
        <i data-lucide="${inStock ? 'check-circle' : 'x-circle'}" style="width:12px;height:12px;"></i>
        ${inStock ? 'Available' : 'Out of Stock'}
      </div>
    </div>
  `;

  // Wishlist toggle handler
  const wishlistBtn = card.querySelector('.product-card__wishlist');
  wishlistBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id, wishlistBtn);
  });

  // Quick view handler
  const quickViewBtn = card.querySelector('[data-quickview]');
  quickViewBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Dispatch custom event for modal
    window.dispatchEvent(new CustomEvent('quickview', { detail: { product } }));
  });

  // Share handler
  const shareBtn = card.querySelector('.share-btn');
  shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    shareProduct(name, productUrl);
  });

  return card;
}

/**
 * Toggle wishlist for a product
 */
async function toggleWishlist(productId, btn) {
  let wishlist = getLocal('wishlist') || [];
  const isWished = wishlist.includes(productId);

  if (isWished) {
    wishlist = wishlist.filter(id => id !== productId);
    btn.classList.remove('active');
    btn.innerHTML = '<i data-lucide="heart" style="width:18px;height:18px;"></i>';
    showToast('Removed from wishlist', 'info');
  } else {
    wishlist.push(productId);
    btn.classList.add('active');
    btn.innerHTML = '<i data-lucide="heart" style="width:18px;height:18px;fill:currentColor;"></i>';
    showToast('Added to wishlist ♥', 'success');
  }

  setLocal('wishlist', wishlist);
  updateWishlistCount();

  // Sync with Firebase if logged in
  const user = getCurrentUser();
  if (user) {
    if (isWished) {
      await removeFromWishlist(user.uid, productId);
    } else {
      await addToWishlist(user.uid, productId);
    }
  }

  // Re-init Lucide icons
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Share product
 */
function shareProduct(name, url) {
  const fullUrl = window.location.origin + '/' + url;

  if (navigator.share) {
    navigator.share({
      title: name + ' | Filorae',
      text: `Check out this handmade crochet product: ${name}`,
      url: fullUrl,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Could not copy link', 'error');
    });
  }
}

/**
 * Create a skeleton product card
 */
export function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'product-card skeleton-card';
  card.innerHTML = `
    <div class="skeleton skeleton-image" style="aspect-ratio:1;"></div>
    <div style="padding:var(--space-4);">
      <div class="skeleton skeleton-text" style="width:40%;height:10px;"></div>
      <div class="skeleton skeleton-text" style="width:80%;height:14px;margin-top:var(--space-2);"></div>
      <div class="skeleton skeleton-text" style="width:50%;height:16px;margin-top:var(--space-3);"></div>
      <div class="skeleton skeleton-text" style="width:60%;height:10px;margin-top:var(--space-2);"></div>
    </div>
  `;
  return card;
}
