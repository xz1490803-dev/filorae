// ============================================
// FILORAE — Quick View Modal Component
// ============================================

import { formatPrice, calcDiscount, renderStars, renderBadge, sanitize } from '../js/utils/helpers.js';
import { openInstagramCheckout } from './instagram-checkout.js';

/**
 * Initialize quick view listener
 */
export function initQuickView() {
  window.addEventListener('quickview', (e) => {
    const { product } = e.detail;
    openQuickView(product);
  });
}

/**
 * Open quick view modal
 */
function openQuickView(product) {
  const {
    id, name, price, oldPrice, images = [], category, badge,
    rating = 0, reviewCount = 0, inStock = true, description = '', variants = []
  } = product;

  const discount = calcDiscount(price, oldPrice);
  const normalizedImages = images.map(img => typeof img === 'string' ? img : (img ? img.url : ''));
  const primaryImage = normalizedImages[0] || '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal modal-quickview">
      <button class="modal-close" style="position:absolute;top:var(--space-4);right:var(--space-4);z-index:10;" aria-label="Close">
        <i data-lucide="x" style="width:20px;height:20px;"></i>
      </button>
      <div class="modal-body">
        <!-- Image Side -->
        <div>
          <div style="border-radius:var(--radius-lg);overflow:hidden;background:var(--cream-200);aspect-ratio:1;">
            <img id="qv-main-img" src="${primaryImage}" alt="${sanitize(name)}" style="width:100%;height:100%;object-fit:cover;">
          </div>
          ${normalizedImages.length > 1 ? `
            <div class="quickview-thumbnails">
              ${normalizedImages.map((img, i) => `
                <img src="${img}" alt="${sanitize(name)}" class="quickview-thumb ${i===0?'active':''}" onclick="document.getElementById('qv-main-img').src='${img}'; document.querySelectorAll('.quickview-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active');">
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Info Side -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4);">
          ${badge ? renderBadge(badge) : ''}

          ${category ? `<span style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.1em;">${sanitize(category)}</span>` : ''}

          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:var(--fw-semibold);color:var(--color-heading);">
            ${sanitize(name)}
          </h2>

          ${rating > 0 ? `
            <div style="display:flex;align-items:center;gap:var(--space-2);">
              <div style="display:flex;gap:2px;color:var(--terracotta-400);">${renderStars(rating, 14)}</div>
              <span style="font-size:var(--text-sm);color:var(--color-text-muted);">(${reviewCount} reviews)</span>
            </div>
          ` : ''}

          <div style="display:flex;align-items:baseline;gap:var(--space-3);">
            <span style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:var(--fw-bold);color:var(--sage-900);">${formatPrice(price)}</span>
            ${oldPrice ? `<span style="font-size:var(--text-md);color:var(--color-text-muted);text-decoration:line-through;">${formatPrice(oldPrice)}</span>` : ''}
            ${discount > 0 ? `<span class="price-discount">-${discount}%</span>` : ''}
          </div>

          ${description ? `<p style="font-size:var(--text-sm);color:var(--color-text-light);line-height:var(--lh-relaxed);">${sanitize(description).substring(0, 200)}...</p>` : ''}

          <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-sm);font-weight:var(--fw-medium);color:${inStock ? 'var(--color-success)' : 'var(--color-error)'};">
            <i data-lucide="${inStock ? 'check-circle' : 'x-circle'}" style="width:14px;height:14px;"></i>
            ${inStock ? 'In Stock' : 'Out of Stock'}
          </div>

          ${inStock ? `
            <div style="display:flex;gap:var(--space-3);margin-top:var(--space-2);">
              <button class="btn btn-instagram btn-full" id="qv-order-btn">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Order on Instagram
              </button>
            </div>
          ` : ''}

          <a href="product.html?id=${id}" class="btn btn-secondary btn-full" style="margin-top:auto;">
            View Full Details
            <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add('no-scroll');

  if (window.lucide) window.lucide.createIcons();

  // Close
  const closeBtn = overlay.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });

  // Thumbnail click
  overlay.querySelectorAll('[data-qv-thumb]').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.getElementById('qv-main-img').src = thumb.dataset.qvThumb;
      overlay.querySelectorAll('[data-qv-thumb]').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Order button
  const orderBtn = overlay.querySelector('#qv-order-btn');
  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      closeModal(overlay);
      setTimeout(() => openInstagramCheckout(product), 250);
    });
  }

  // ESC
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(overlay);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeModal(overlay) {
  overlay.classList.add('closing');
  const modal = overlay.querySelector('.modal');
  if (modal) modal.classList.add('closing');
  setTimeout(() => {
    overlay.remove();
    document.body.classList.remove('no-scroll');
  }, 200);
}
