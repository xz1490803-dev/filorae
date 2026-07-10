// ============================================
// FILORAE — App Entry Point
// ============================================

import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderSearchOverlay } from '../components/search.js';
import { initQuickView } from '../components/product-modal.js';
import { initChatbot } from '../components/chatbot.js';
import { renderCartDrawer } from '../components/cart-drawer.js';
import { initAllAnimations } from './utils/animations.js';
import { initLazyLoad } from './utils/lazyload.js';
import { initLightbox } from './utils/lightbox.js';

/**
 * Initialize the application
 */
export function initApp({ showFooter = true, showNavbar = true } = {}) {
  // Render shared components
  if (showNavbar) renderNavbar();
  if (showFooter) renderFooter();

  // Search overlay
  renderSearchOverlay();
  
  // Cart drawer
  renderCartDrawer();

  // Quick view modal listener
  initQuickView();
  
  // Initialize AI Chatbot
  initChatbot();

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Scroll animations
  requestAnimationFrame(() => {
    initAllAnimations();
    initLazyLoad();
  });

  // Image lightbox
  initLightbox();

  // Back to top button
  initBackToTop();

  // Page transition effect
  document.body.classList.add('page-transition-enter');

  // Hide loading overlay
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 500);
    }, 300);
  }

  console.log('%c♥ Filorae — Handmade with Love ♥', 'color:#5C7A5C;font-size:14px;font-weight:bold;');
}

/**
 * Back to top button
 */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i data-lucide="chevron-up" style="width:20px;height:20px;"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Re-initialize dynamic content (after AJAX)
 */
export function refreshUI() {
  if (window.lucide) window.lucide.createIcons();
  initAllAnimations();
  initLazyLoad();
}
