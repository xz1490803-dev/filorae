// ============================================
// FILORAE — Product Detail Page Script
// ============================================

import { initApp, refreshUI } from '../app.js';
import { getProduct, getRelatedProducts } from '../../firebase/firestore.js';
import { createProductCard } from '../../components/product-card.js';
import { openInstagramCheckout } from '../../components/instagram-checkout.js';
import { formatPrice, calcDiscount, renderStars, renderBadge, sanitize, getUrlParams } from '../utils/helpers.js';
import { addToCart } from '../utils/cart.js';
import { showToast } from '../../components/toast.js';

initApp();

const params = getUrlParams();
const productId = params.id;

if (!productId) {
  window.location.href = 'shop.html';
} else {
  loadProduct(productId);
}

async function loadProduct(id) {
  const product = await getProduct(id);

  if (!product) {
    document.getElementById('product-container').innerHTML = `
      <div class="empty-state">
        <i data-lucide="package-x" class="empty-state__icon" style="width:80px;height:80px;"></i>
        <h2 class="empty-state__title">Product Not Found</h2>
        <p class="empty-state__text">The product you're looking for doesn't exist or has been removed.</p>
        <a href="shop.html" class="btn btn-primary">Browse Products</a>
      </div>
    `;
    refreshUI();
    return;
  }

  renderProduct(product);

  // Load related
  const related = await getRelatedProducts(id, product.category, 4);
  renderRelated(related);

  refreshUI();

  // Update page title
  document.title = `${product.name} | Filorae`;
}

function renderProduct(product) {
  const {
    id, name, price, oldPrice, images = [], category, badge,
    rating = 0, reviewCount = 0, inStock = true, description = '',
    materials = '', careInstructions = '', dimensions = '',
    deliveryTime = '5-7 business days', variants = [], tags = [],
    shippingType = 'free', shippingCharge = 0
  } = product;

  // Normalize images to always be strings for frontend rendering
  const normalizedImages = images.map(img => typeof img === 'string' ? img : (img ? img.url : ''));

  const discount = calcDiscount(price, oldPrice);
  const container = document.getElementById('product-container');

  // Gallery
  const galleryHTML = `
    <div class="product-gallery">
      <div class="product-gallery__main" id="gallery-main">
        <img src="${normalizedImages[0] || ''}" alt="${sanitize(name)}" id="main-image" width="600" height="600">
        ${normalizedImages.length > 1 ? `
          <button class="product-gallery__nav-btn product-gallery__nav-btn--prev" id="gallery-prev" aria-label="Previous image">
            <i data-lucide="chevron-left" style="width:20px;height:20px;"></i>
          </button>
          <button class="product-gallery__nav-btn product-gallery__nav-btn--next" id="gallery-next" aria-label="Next image">
            <i data-lucide="chevron-right" style="width:20px;height:20px;"></i>
          </button>
        ` : ''}
      </div>
      <div class="product-gallery__thumbs">
        ${normalizedImages.map((img, i) => `
          <div class="product-gallery__thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
            <img src="${img}" alt="Product view ${i + 1}" width="72" height="72" loading="lazy">
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Info
  const infoHTML = `
    <div class="product-info">
      ${badge ? `<div class="product-info__badge">${renderBadge(badge)}</div>` : ''}

      <nav class="product-breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a>
        <span class="separator">/</span>
        <a href="shop.html">Shop</a>
        ${category ? `<span class="separator">/</span><a href="category.html?cat=${category}">${sanitize(category)}</a>` : ''}
        <span class="separator">/</span>
        <span aria-current="page">${sanitize(name)}</span>
      </nav>

      <h1 class="product-info__title">${sanitize(name)}</h1>

      ${rating > 0 ? `
        <div class="product-info__rating">
          <div class="product-info__stars">${renderStars(rating, 16)}</div>
          <span class="product-info__review-count">${reviewCount} review${reviewCount !== 1 ? 's' : ''}</span>
        </div>
      ` : ''}

      <div class="product-info__pricing">
        <span class="product-info__price">${formatPrice(price)}</span>
        ${oldPrice ? `<span class="product-info__old-price">${formatPrice(oldPrice)}</span>` : ''}
        ${discount > 0 ? `<span class="product-info__discount-badge">${discount}% OFF</span>` : ''}
        <span class="product-info__shipping" style="font-size: var(--text-sm); color: var(--color-text-muted); margin-left: var(--space-2); align-self: center;">
          ${shippingType === 'charge' && shippingCharge > 0 ? `+ ${formatPrice(shippingCharge)} Shipping` : '+ Free Shipping'}
        </span>
      </div>

      ${description ? `<p class="product-info__desc">${sanitize(description)}</p>` : ''}

      ${variants.length > 0 ? `
        <div class="product-info__variants">
          <span class="variant-label">Select Variant</span>
          <div class="variant-options" id="variant-options">
            ${variants.map((v, i) => `
              <button class="variant-option ${i === 0 ? 'selected' : ''}" data-variant="${sanitize(v)}">${sanitize(v)}</button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="product-info__actions">
        <div class="product-info__qty-row">
          <div class="qty-selector">
            <button class="qty-btn" id="qty-minus" aria-label="Decrease quantity">
              <i data-lucide="minus" style="width:16px;height:16px;"></i>
            </button>
            <input type="number" class="qty-input" id="qty-input" value="1" min="1" max="10" aria-label="Quantity">
            <button class="qty-btn" id="qty-plus" aria-label="Increase quantity">
              <i data-lucide="plus" style="width:16px;height:16px;"></i>
            </button>
          </div>
          <div class="product-info__stock ${inStock ? 'in-stock' : 'out-of-stock'}">
            <i data-lucide="${inStock ? 'check-circle' : 'x-circle'}" style="width:16px;height:16px;"></i>
            ${inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        ${inStock ? `
          <div class="instagram-order-section">
            <p><svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> Order directly via Instagram DM</p>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
              <button class="btn btn-secondary btn-lg" id="add-to-cart-btn" style="flex:1;">
                <i data-lucide="shopping-cart" style="width:18px;height:18px;"></i>
                Add to Cart
              </button>
              <button class="btn btn-instagram btn-lg" id="order-instagram-btn" style="flex:1;">
                <i data-lucide="send" style="width:18px;height:18px;"></i>
                Buy Now
              </button>
            </div>
          </div>
        ` : `
          <button class="btn btn-primary btn-full btn-lg" disabled>Out of Stock</button>
        `}
      </div>

      <div class="product-meta">
        ${category ? `<div class="product-meta__row"><span class="product-meta__label">Category</span><a href="category.html?cat=${category}" class="product-meta__value">${sanitize(category)}</a></div>` : ''}
        ${deliveryTime ? `<div class="product-meta__row"><span class="product-meta__label">Delivery</span><span class="product-meta__value">${sanitize(deliveryTime)}</span></div>` : ''}
        ${dimensions ? `<div class="product-meta__row"><span class="product-meta__label">Dimensions</span><span class="product-meta__value">${sanitize(dimensions)}</span></div>` : ''}
        ${tags.length > 0 ? `<div class="product-meta__row"><span class="product-meta__label">Tags</span><span class="product-meta__value">${tags.map(t => `<a href="shop.html?search=${t}" class="tag" style="margin-right:4px;">${sanitize(t)}</a>`).join('')}</span></div>` : ''}
      </div>

      <div class="product-share">
        <span>Share:</span>
        <div class="product-share__btns">
          <button class="btn-icon btn-icon-sm btn-ghost" onclick="shareOnWhatsApp()" aria-label="Share on WhatsApp"><i data-lucide="message-circle" style="width:16px;height:16px;"></i></button>
          <button class="btn-icon btn-icon-sm btn-ghost" onclick="copyLink()" aria-label="Copy link"><i data-lucide="link" style="width:16px;height:16px;"></i></button>
        </div>
      </div>
    </div>
  `;

  // Tabs
  const tabsHTML = `
    <div class="product-tabs">
      <div class="tabs">
        <div class="tabs-nav">
          <button class="tab-btn active" data-tab="description">Description</button>
          ${materials ? '<button class="tab-btn" data-tab="materials">Materials</button>' : ''}
          ${careInstructions ? '<button class="tab-btn" data-tab="care">Care Instructions</button>' : ''}
        </div>
        <div class="tab-panel active" id="tab-description">
          <p style="line-height:var(--lh-relaxed);color:var(--color-text-light);">${sanitize(description) || 'No description available.'}</p>
        </div>
        ${materials ? `<div class="tab-panel" id="tab-materials"><p style="line-height:var(--lh-relaxed);color:var(--color-text-light);">${sanitize(materials)}</p></div>` : ''}
        ${careInstructions ? `<div class="tab-panel" id="tab-care"><p style="line-height:var(--lh-relaxed);color:var(--color-text-light);">${sanitize(careInstructions)}</p></div>` : ''}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="product-detail">${galleryHTML}${infoHTML}</div>
    ${tabsHTML}
    <div class="related-products" id="related-products">
      <h2 class="section-title" style="margin-bottom:var(--space-6);">You May Also Like</h2>
      <div class="product-grid" id="related-grid"></div>
    </div>
  `;

  // ---- Event Handlers ----

  // Gallery thumbnails
  let currentImageIndex = 0;
  const thumbs = container.querySelectorAll('.product-gallery__thumb');
  const mainImg = document.getElementById('main-image');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentImageIndex = parseInt(thumb.dataset.index);
      mainImg.src = normalizedImages[currentImageIndex];
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Gallery nav
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentImageIndex = (currentImageIndex - 1 + normalizedImages.length) % normalizedImages.length;
      mainImg.src = normalizedImages[currentImageIndex];
      thumbs.forEach(t => t.classList.remove('active'));
      thumbs[currentImageIndex]?.classList.add('active');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentImageIndex = (currentImageIndex + 1) % normalizedImages.length;
      mainImg.src = normalizedImages[currentImageIndex];
      thumbs.forEach(t => t.classList.remove('active'));
      thumbs[currentImageIndex]?.classList.add('active');
    });
  }

  // Zoom
  const galleryMain = document.getElementById('gallery-main');
  if (galleryMain) {
    galleryMain.addEventListener('click', () => {
      galleryMain.classList.toggle('zoomed');
    });

    galleryMain.addEventListener('mousemove', (e) => {
      if (!galleryMain.classList.contains('zoomed')) return;
      const rect = galleryMain.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    });
  }

  // Quantity
  const qtyInput = document.getElementById('qty-input');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  if (qtyMinus) {
    qtyMinus.addEventListener('click', () => {
      const val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener('click', () => {
      const val = parseInt(qtyInput.value);
      if (val < 10) qtyInput.value = val + 1;
    });
  }

  // Variants
  container.querySelectorAll('.variant-option').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.variant-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Instagram order
  const orderBtn = document.getElementById('order-instagram-btn');
  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput?.value || 1);
      const selectedVariant = container.querySelector('.variant-option.selected');
      const variant = selectedVariant ? selectedVariant.dataset.variant : '';
      openInstagramCheckout([{
        productId: id,
        name: name,
        price: price,
        variant: variant,
        quantity: qty,
        image: normalizedImages[0] || '',
        shippingCharge: shippingType === 'charge' ? shippingCharge : 0
      }]);
    });
  }

  // Add to cart
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput?.value || 1);
      if (variants.length > 0 && !container.querySelector('.variant-option.selected')) {
        showToast('Please select a variant first', 'error');
        return;
      }
      const selectedVariant = container.querySelector('.variant-option.selected');
      const variant = selectedVariant ? selectedVariant.dataset.variant : '';
      
      addToCart({
        productId: id,
        name: name,
        price: price,
        variant: variant,
        quantity: qty,
        image: normalizedImages[0] || '',
        shippingCharge: shippingType === 'charge' ? shippingCharge : 0
      });
      
      showToast('Added to cart!', 'success');
      window.dispatchEvent(new CustomEvent('filorae_open_cart'));
    });
  }

  // Tabs
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`tab-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // Share functions
  window.shareOnWhatsApp = () => {
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${name} on Filorae! ${url}`)}`, '_blank');
  };

  window.copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Link copied!', 'success');
    });
  };
}

function renderRelated(products) {
  const grid = document.getElementById('related-grid');
  if (!grid || products.length === 0) {
    const section = document.getElementById('related-products');
    if (section) section.style.display = 'none';
    return;
  }

  products.forEach(p => grid.appendChild(createProductCard(p)));
}
