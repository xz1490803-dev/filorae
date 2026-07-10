// ============================================
// FILORAE — Footer Component
// ============================================

import { SITE_CONFIG } from '../firebase/firebase.js';
import { subscribeNewsletter } from '../firebase/firestore.js';
import { showToast } from './toast.js';

/**
 * Render the site footer
 */
export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.setAttribute('role', 'contentinfo');

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-brand">
          <a href="index.html" class="header-logo">
            <span>filörae</span>
          </a>
          <p>Premium handmade crochet gifts crafted with love. Each piece is unique, made by hand, and designed to bring warmth and joy.</p>
          <div class="footer-social">
            <a href="${SITE_CONFIG.instagramUrl}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Pinterest">
              <i data-lucide="pin" style="width:18px;height:18px;"></i>
            </a>
            <a href="mailto:${SITE_CONFIG.email}" aria-label="Email">
              <i data-lucide="mail" style="width:18px;height:18px;"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-column">
          <h4>Shop</h4>
          <ul>
            <li><a href="shop.html">All Products</a></li>
            <li><a href="shop.html?badge=best-seller">Best Sellers</a></li>
            <li><a href="shop.html?badge=trending">Trending</a></li>
            <li><a href="shop.html?sort=createdAt">New Arrivals</a></li>
            <li><a href="category.html?cat=gifts">Gift Collections</a></li>
          </ul>
        </div>

        <!-- Company -->
        <div class="footer-column">
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="order-guide.html">How to Order</a></li>
          </ul>
        </div>

        <!-- Legal -->
        <div class="footer-column">
          <h4>Legal</h4>
          <ul>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="shipping.html">Shipping Policy</a></li>
            <li><a href="terms.html">Terms & Conditions</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Filorae. All rights reserved. Made with ♥ in India.</p>
        <div class="footer-bottom-links">
          <a href="privacy.html">Privacy</a>
          <a href="terms.html">Terms</a>
          <a href="shipping.html">Shipping</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(footer);

  // Re-initialize Lucide icons for footer
  if (window.lucide) window.lucide.createIcons();
}
