// ============================================
// FILORAE — Navbar Component
// ============================================

import { onAuthChange, signOut } from '../firebase/auth.js';
import { getCategories } from '../firebase/firestore.js';
import { getLocal } from '../js/utils/cache.js';
import { getCartTotals, CART_UPDATED_EVENT } from '../js/utils/cart.js';
import { throttle } from '../js/utils/helpers.js';

const NAV_LINKS = [
  { label: 'Home', href: 'index.html' },
  {
    label: 'Shop', href: 'shop.html',
    dropdown: [
      { label: 'All Products', href: 'shop.html' },
      { label: 'Best Sellers', href: 'shop.html?badge=best-seller' },
      { label: 'Trending', href: 'shop.html?badge=trending' },
      { label: 'New Arrivals', href: 'shop.html?sort=createdAt' },
      { label: 'Gift Collections', href: 'category.html?cat=gifts' },
    ]
  },
  { label: 'About', href: 'about.html' },
  { label: 'Contact', href: 'contact.html' },
  { label: 'Order Guide', href: 'order-guide.html' },
];

/**
 * Render the site header/navbar
 */
export function renderNavbar() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const header = document.createElement('header');
  header.className = 'site-header';
  header.id = 'site-header';
  header.setAttribute('role', 'banner');

  header.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to content</a>
    <div class="container header-inner">
      <!-- Logo -->
      <a href="index.html" class="header-logo" aria-label="Filorae - Home">
        <span>filörae</span>
        <small class="header-tagline">♥ handmade with love ♥</small>
      </a>

      <!-- Desktop Nav -->
      <nav class="header-nav" aria-label="Main navigation">
        ${NAV_LINKS.map(link => {
          if (link.dropdown) {
            return `
              <div class="nav-dropdown">
                <a href="${link.href}" class="nav-link ${currentPage === link.href ? 'active' : ''}">
                  ${link.label}
                  <i data-lucide="chevron-down" style="width:14px;height:14px;margin-left:2px;"></i>
                </a>
                <div class="nav-dropdown-menu">
                  ${link.dropdown.map(sub => `
                    <a href="${sub.href}" class="nav-dropdown-item">${sub.label}</a>
                  `).join('')}
                </div>
              </div>
            `;
          }
          return `<a href="${link.href}" class="nav-link ${currentPage === link.href ? 'active' : ''}">${link.label}</a>`;
        }).join('')}
      </nav>

      <!-- Actions -->
      <div class="header-actions">
        <button class="header-action-btn" id="search-toggle" aria-label="Search">
          <i data-lucide="search" style="width:20px;height:20px;"></i>
        </button>
        <a href="wishlist.html" class="header-action-btn" aria-label="Wishlist">
          <i data-lucide="heart" style="width:20px;height:20px;"></i>
          <span class="count-badge" id="wishlist-count" style="display:none;">0</span>
        </a>
        <button class="header-action-btn" id="cart-toggle" aria-label="Cart">
          <i data-lucide="shopping-bag" style="width:20px;height:20px;"></i>
          <span class="count-badge" id="cart-count" style="display:none;">0</span>
        </button>
        <div id="auth-nav-item">
          <a href="login.html" class="header-action-btn" aria-label="Login">
            <i data-lucide="user" style="width:20px;height:20px;"></i>
          </a>
        </div>
        <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false">
          <div class="hamburger-lines">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div class="mobile-nav-overlay" id="mobile-nav-overlay"></div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
      <div class="mobile-nav-header">
        <a href="index.html" class="header-logo">
          <span>filörae</span>
        </a>
        <button class="modal-close" id="mobile-nav-close" aria-label="Close menu">
          <i data-lucide="x" style="width:20px;height:20px;"></i>
        </button>
      </div>
      <div class="mobile-nav-body">
        ${NAV_LINKS.map(link => {
          if (link.dropdown) {
            return `
              <a href="${link.href}" class="mobile-nav-link ${currentPage === link.href ? 'active' : ''}">${link.label}</a>
              ${link.dropdown.map(sub => `
                <a href="${sub.href}" class="mobile-nav-link" style="padding-left:var(--space-8);font-size:var(--text-sm);">${sub.label}</a>
              `).join('')}
            `;
          }
          return `<a href="${link.href}" class="mobile-nav-link ${currentPage === link.href ? 'active' : ''}">${link.label}</a>`;
        }).join('')}
        <hr class="divider">
        <a href="wishlist.html" class="mobile-nav-link">
          <span>Wishlist</span>
          <i data-lucide="heart" style="width:18px;height:18px;"></i>
        </a>
        <a href="#" class="mobile-nav-link" id="mobile-cart-toggle">
          <span>Cart</span>
          <div style="display:flex;align-items:center;gap:4px;">
            <span id="mobile-cart-count" style="background:var(--terracotta-500);color:white;border-radius:50%;padding:2px 6px;font-size:10px;font-weight:bold;display:none;">0</span>
            <i data-lucide="shopping-bag" style="width:18px;height:18px;"></i>
          </div>
        </a>
        <a href="faq.html" class="mobile-nav-link">FAQ</a>
        <a href="order-guide.html" class="mobile-nav-link">How to Order</a>
      </div>
      <div class="mobile-nav-footer" id="mobile-auth-footer">
        <a href="login.html" class="btn btn-primary btn-full">Sign In</a>
      </div>
    </nav>
  `;

  document.body.prepend(header);
  initNavbarBehavior();
  initAuthState();
}

/**
 * Initialize navbar scroll & mobile behavior
 */
function initNavbarBehavior() {
  const header = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');
  const searchToggle = document.getElementById('search-toggle');

  let lastScroll = 0;

  // Scroll hide/show
  const onScroll = throttle(() => {
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (currentScroll > lastScroll && currentScroll > 200) {
      header.classList.add('hidden-up');
    } else {
      header.classList.remove('hidden-up');
    }

    lastScroll = currentScroll;
  }, 50);

  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu toggle
  function openMobileNav() {
    mobileNav.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    if (mobileNav.classList.contains('open')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });

  overlay.addEventListener('click', closeMobileNav);
  closeBtn.addEventListener('click', closeMobileNav);

  // Search toggle
  searchToggle.addEventListener('click', () => {
    const searchOverlay = document.getElementById('search-overlay');
    if (searchOverlay) {
      searchOverlay.classList.add('open');
      document.body.classList.add('no-scroll');
      const input = searchOverlay.querySelector('.search-overlay__input');
      if (input) setTimeout(() => input.focus(), 100);
    }
  });

  // Close mobile nav on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNav();
    }
  });

  // Cart toggle
  const cartToggle = document.getElementById('cart-toggle');
  const mobileCartToggle = document.getElementById('mobile-cart-toggle');
  
  const openCart = (e) => {
    e.preventDefault();
    closeMobileNav(); // Close mobile nav if open
    window.dispatchEvent(new CustomEvent('filorae_open_cart'));
  };

  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (mobileCartToggle) mobileCartToggle.addEventListener('click', openCart);
}

/**
 * Update nav based on auth state
 */
function initAuthState() {
  onAuthChange(user => {
    const authNavItem = document.getElementById('auth-nav-item');
    const mobileAuthFooter = document.getElementById('mobile-auth-footer');

    if (user) {
      const initial = (user.displayName || user.email || '?')[0].toUpperCase();
      const avatar = user.photoURL
        ? `<img src="${user.photoURL}" alt="" class="avatar" style="width:32px;height:32px;">`
        : `<span class="avatar-placeholder" style="width:32px;height:32px;font-size:12px;">${initial}</span>`;

      authNavItem.innerHTML = `
        <a href="profile.html" class="header-action-btn" aria-label="Profile" style="padding:4px;">
          ${avatar}
        </a>
      `;

      mobileAuthFooter.innerHTML = `
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
          ${avatar}
          <div>
            <div style="font-weight:var(--fw-semibold);font-size:var(--text-sm);">${user.displayName || 'User'}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${user.email}</div>
          </div>
        </div>
        <a href="profile.html" class="btn btn-secondary btn-full btn-sm" style="margin-bottom:var(--space-2);">My Profile</a>
        <button class="btn btn-ghost btn-full btn-sm" id="mobile-signout">Sign Out</button>
      `;

      const signOutBtn = document.getElementById('mobile-signout');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
          await signOut();
          window.location.href = 'index.html';
        });
      }
    }
  });

  // Update wishlist count
  updateWishlistCount();
  updateCartBadge();
  window.addEventListener(CART_UPDATED_EVENT, updateCartBadge);
}

/**
 * Update wishlist badge count
 */
export function updateWishlistCount() {
  const badge = document.getElementById('wishlist-count');
  if (!badge) return;

  const wishlist = getLocal('wishlist') || [];
  if (wishlist.length > 0) {
    badge.textContent = wishlist.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Update cart badge count
 */
export function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  const mobileBadge = document.getElementById('mobile-cart-count');
  const { itemCount } = getCartTotals();

  if (itemCount > 0) {
    if (badge) {
      badge.textContent = itemCount;
      badge.style.display = 'flex';
    }
    if (mobileBadge) {
      mobileBadge.textContent = itemCount;
      mobileBadge.style.display = 'inline-block';
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (mobileBadge) mobileBadge.style.display = 'none';
  }
}
