// ============================================
// FILORAE — Instagram Checkout Component
// ============================================

import { INSTAGRAM_USERNAME, SITE_CONFIG } from '../firebase/firebase.js';
import { formatPrice } from '../js/utils/helpers.js';
import { showToast } from './toast.js';

/**
 * Open Instagram DM checkout modal
 */
export function openInstagramCheckout(cartItems = []) {
  if (cartItems.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'instagram-checkout-modal';

  let totalItems = 0;
  let subtotal = 0;
  let totalShipping = 0;

  cartItems.forEach(item => {
    totalItems += item.quantity;
    subtotal += (item.price * item.quantity);
    if (item.shippingCharge) totalShipping += (item.shippingCharge * item.quantity);
  });

  const grandTotal = subtotal + totalShipping;

  // Build items preview HTML (show up to 2 items, then "+ X more")
  let itemsPreviewHTML = '';
  cartItems.slice(0, 2).forEach(item => {
    itemsPreviewHTML += `
      <div style="display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-2);">
        <img src="${item.image}" alt="${item.name}" style="width:50px;height:50px;border-radius:var(--radius-sm);object-fit:cover;">
        <div>
          <div style="font-weight:var(--fw-semibold);font-size:var(--text-sm);">${item.name} <span style="color:var(--color-text-muted);font-weight:normal;">x${item.quantity}</span></div>
          ${item.variant ? `<div style="font-size:var(--text-xs);color:var(--color-text-muted);">${item.variant}</div>` : ''}
        </div>
      </div>
    `;
  });

  if (cartItems.length > 2) {
    itemsPreviewHTML += `<div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-2);">+ ${cartItems.length - 2} more item(s)</div>`;
  }

  overlay.innerHTML = `
    <div class="modal" style="max-width:500px;">
      <div class="modal-header">
        <h3 class="modal-title">
          <svg xmlns="http://www.w3.org/2000/svg" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          Order on Instagram
        </h3>
        <button class="modal-close" aria-label="Close">
          <i data-lucide="x" style="width:18px;height:18px;"></i>
        </button>
      </div>
      <div class="modal-body">
        <!-- Order Summary -->
        <div style="padding:var(--space-4);background:var(--sage-50);border-radius:var(--radius-lg);margin-bottom:var(--space-6);">
          <div style="margin-bottom:var(--space-3);border-bottom:1px solid var(--sage-200);padding-bottom:var(--space-3);">
            ${itemsPreviewHTML}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-bottom:4px;">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-bottom:8px;">
            <span>Shipping</span>
            <span>${totalShipping > 0 ? formatPrice(totalShipping) : 'Free'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:var(--fw-bold);color:var(--sage-900);">
            <span>Total (${totalItems} items)</span>
            <span>${formatPrice(grandTotal)}</span>
          </div>
        </div>

        <!-- Customer Details Form -->
        <form id="checkout-form" class="flex-col gap-4" style="display:flex;flex-direction:column;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label" for="checkout-name">Your Name *</label>
            <input type="text" id="checkout-name" class="input-field" placeholder="Full name" required>
          </div>
          <div class="input-group">
            <label class="input-label" for="checkout-phone">Phone Number *</label>
            <input type="tel" id="checkout-phone" class="input-field" placeholder="+91 XXXXXXXXXX" required>
          </div>
          <div class="input-group">
            <label class="input-label" for="checkout-address">Delivery Address *</label>
            <textarea id="checkout-address" class="input-field" rows="3" placeholder="Full address with pincode" required></textarea>
          </div>
          <div class="input-group">
            <label class="input-label" for="checkout-notes">Notes (optional)</label>
            <input type="text" id="checkout-notes" class="input-field" placeholder="Any special requests...">
          </div>
        </form>
      </div>
      <div class="modal-footer" style="flex-direction:column;gap:var(--space-3);">
        <button class="btn btn-instagram btn-full btn-lg" id="send-to-instagram">
          <i data-lucide="send" style="width:18px;height:18px;"></i>
          Send Order on Instagram
        </button>
        <p style="font-size:var(--text-xs);color:var(--color-text-muted);text-align:center;margin:0;">
          Your order details will be copied. If the message box is empty, just <strong>PASTE</strong> and Send!
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add('no-scroll');

  if (window.lucide) window.lucide.createIcons();

  // Close handlers
  const closeBtn = overlay.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });

  // Send to Instagram
  const sendBtn = document.getElementById('send-to-instagram');
  sendBtn.addEventListener('click', () => {
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    const notes = document.getElementById('checkout-notes').value.trim();

    if (!name || !phone || !address) {
      // Validate
      const fields = ['checkout-name', 'checkout-phone', 'checkout-address'];
      fields.forEach(fId => {
        const el = document.getElementById(fId);
        if (!el.value.trim()) {
          el.classList.add('input-field--error');
          el.addEventListener('input', () => el.classList.remove('input-field--error'), { once: true });
        }
      });
      return;
    }

    const customer = {
      name,
      phone,
      address,
      notes,
    };
    
    // Build the DM message
    const message = buildOrderMessage(cartItems, customer);

    // Instagram Web often blocks the ?text= parameter.
    // The most reliable way is to copy to clipboard so they can paste it.
    const copyToClipboard = (text) => {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      } else {
        return new Promise((resolve, reject) => {
          let textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy') ? resolve() : reject(new Error('execCommand failed'));
          } catch (e) {
            reject(e);
          }
          textArea.remove();
        });
      }
    };

    copyToClipboard(message).then(() => {
      showToast('Order details copied! Please PASTE them in Instagram.', 'success');
    }).catch(err => {
      console.warn('Failed to copy to clipboard', err);
    });

    // Open Instagram DM
    const instagramDmUrl = `https://ig.me/m/${INSTAGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
    window.open(instagramDmUrl, '_blank');

    closeModal(overlay);
  });

  // ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(overlay);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function buildOrderMessage(cartItems, customer) {
  let msg = `🧶 NEW ORDER — Filorae\n`;
  msg += `━━━━━━━━━━━━━━━━━━━\n\n`;
  
  let subtotal = 0;
  let shipping = 0;
  
  cartItems.forEach((item, index) => {
    msg += `📦 Item ${index + 1}: ${item.name}\n`;
    if (item.variant) msg += `🎨 Variant: ${item.variant}\n`;
    msg += `🔢 Quantity: ${item.quantity}\n`;
    msg += `💰 Price: ${formatPrice(item.price * item.quantity)}\n`;
    if (item.shippingCharge) {
      msg += `🚚 Shipping: ${formatPrice(item.shippingCharge * item.quantity)}\n`;
      shipping += (item.shippingCharge * item.quantity);
    }
    msg += `\n`;
    subtotal += (item.price * item.quantity);
  });
  
  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💳 Subtotal: ${formatPrice(subtotal)}\n`;
  if (shipping > 0) msg += `🚚 Total Shipping: ${formatPrice(shipping)}\n`;
  msg += `💸 GRAND TOTAL: ${formatPrice(subtotal + shipping)}\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `👤 Name: ${customer.name}\n`;
  msg += `📞 Phone: ${customer.phone}\n`;
  msg += `📍 Address: ${customer.address}\n`;
  if (customer.notes) msg += `📝 Notes: ${customer.notes}\n`;
  msg += `\n━━━━━━━━━━━━━━━━━━━\n`;
  msg += `♥ Thank you for choosing Filorae! ♥`;

  return msg;
}

/**
 * Close the modal
 */
function closeModal(overlay) {
  overlay.classList.add('closing');
  const modal = overlay.querySelector('.modal');
  if (modal) modal.classList.add('closing');

  setTimeout(() => {
    overlay.remove();
    document.body.classList.remove('no-scroll');
  }, 200);
}
