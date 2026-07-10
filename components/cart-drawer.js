// ============================================
// FILORAE — Cart Drawer Component
// ============================================

import { getCart, getCartTotals, updateCartQuantity, removeFromCart, clearCart, CART_UPDATED_EVENT } from '../js/utils/cart.js';
import { formatPrice } from '../js/utils/helpers.js';
import { openInstagramCheckout } from './instagram-checkout.js';

export function renderCartDrawer() {
  const overlay = document.createElement('div');
  overlay.className = 'cart-drawer-overlay';
  overlay.id = 'cart-drawer-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'cart-drawer';
  drawer.id = 'cart-drawer';

  overlay.appendChild(drawer);
  document.body.appendChild(overlay);

  // Re-render UI when cart updates
  window.addEventListener(CART_UPDATED_EVENT, updateCartUI);

  // Close when clicking overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeCart();
    }
  });

  // Listen for open cart event
  window.addEventListener('filorae_open_cart', openCart);

  // Initial render
  updateCartUI();
}

function updateCartUI() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  const cart = getCart();
  const totals = getCartTotals();

  let bodyHTML = '';

  if (cart.length === 0) {
    bodyHTML = `
      <div class="cart-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:var(--space-8);text-align:center;">
        <i data-lucide="shopping-cart" style="width:48px;height:48px;color:var(--cream-400);margin-bottom:var(--space-4);"></i>
        <h3 style="font-family:var(--font-heading);font-size:var(--text-xl);color:var(--color-heading);margin-bottom:var(--space-2);">Your cart is empty</h3>
        <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-6);">Looks like you haven't added anything to your cart yet.</p>
        <button class="btn btn-primary" onclick="window.dispatchEvent(new CustomEvent('filorae_close_cart')); window.location.href='shop.html';">Shop Now</button>
      </div>
    `;
  } else {
    bodyHTML = `
      <div class="cart-items" style="flex:1;overflow-y:auto;padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4);">
        ${cart.map((item, index) => `
          <div class="cart-item" style="display:flex;gap:var(--space-3);padding-bottom:var(--space-4);border-bottom:1px solid var(--color-border-light);">
            <img src="${item.image}" alt="${item.name}" style="width:72px;height:72px;object-fit:cover;border-radius:var(--radius-sm);background:var(--cream-200);">
            <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <h4 style="font-size:var(--text-sm);font-weight:var(--fw-semibold);color:var(--color-heading);margin-bottom:2px;">${item.name}</h4>
                  ${item.variant ? `<div style="font-size:var(--text-xs);color:var(--color-text-muted);">${item.variant}</div>` : ''}
                </div>
                <button class="btn-remove-item" data-id="${item.productId}" data-variant="${item.variant || ''}" aria-label="Remove item" style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;padding:2px;">
                  <i data-lucide="x" style="width:16px;height:16px;"></i>
                </button>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-2);">
                <div class="qty-selector" style="height:28px;">
                  <button class="qty-btn btn-qty-minus" data-id="${item.productId}" data-variant="${item.variant || ''}" style="width:28px;height:28px;"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
                  <input type="text" class="qty-input" value="${item.quantity}" readonly style="width:30px;height:28px;font-size:var(--text-sm);">
                  <button class="qty-btn btn-qty-plus" data-id="${item.productId}" data-variant="${item.variant || ''}" style="width:28px;height:28px;"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
                </div>
                <div style="font-weight:var(--fw-semibold);font-size:var(--text-sm);color:var(--sage-900);">
                  ${formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-footer" style="padding:var(--space-4);background:var(--sage-50);border-top:1px solid var(--color-border-light);">
        <div style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-4);">
          <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);color:var(--color-text-light);">
            <span>Subtotal</span>
            <span>${formatPrice(totals.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);color:var(--color-text-light);">
            <span>Shipping</span>
            <span>${totals.shipping > 0 ? formatPrice(totals.shipping) : 'Free'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:var(--fw-bold);font-size:var(--text-base);color:var(--color-heading);margin-top:var(--space-2);padding-top:var(--space-2);border-top:1px dashed var(--sage-200);">
            <span>Total</span>
            <span>${formatPrice(totals.total)}</span>
          </div>
        </div>
        <button class="btn btn-instagram btn-full" id="cart-checkout-btn">
          <i data-lucide="send" style="width:16px;height:16px;"></i>
          Checkout on Instagram
        </button>
      </div>
    `;
  }

  drawer.innerHTML = `
    <div class="cart-header" style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4);border-bottom:1px solid var(--color-border-light);">
      <h2 style="font-family:var(--font-heading);font-size:var(--text-xl);margin:0;">Your Cart <span style="font-size:var(--text-sm);color:var(--color-text-muted);font-family:var(--font-body);font-weight:normal;">(${totals.itemCount} items)</span></h2>
      <button class="modal-close" id="cart-close-btn" aria-label="Close cart" style="position:static;">
        <i data-lucide="x" style="width:20px;height:20px;"></i>
      </button>
    </div>
    ${bodyHTML}
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach events
  const closeBtn = document.getElementById('cart-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeCart);

  // Quantity and Remove buttons
  drawer.querySelectorAll('.btn-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.id, btn.dataset.variant, -1));
  });
  drawer.querySelectorAll('.btn-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.id, btn.dataset.variant, 1));
  });
  drawer.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id, btn.dataset.variant));
  });

  // Checkout button
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      closeCart();
      // Pass the whole cart to instagram checkout (we will modify it to handle an array)
      openInstagramCheckout(cart);
    });
  }
}

export function openCart() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  if (overlay && drawer) {
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.classList.add('no-scroll');
  }
}

export function closeCart() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  if (overlay && drawer) {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
}

// Custom event to close cart externally
window.addEventListener('filorae_close_cart', closeCart);
