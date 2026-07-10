// ============================================
// FILORAE — Helpers / Utilities
// ============================================

import { SITE_CONFIG } from '../../firebase/firebase.js';

/**
 * Format price with currency symbol
 */
export function formatPrice(price) {
  if (price == null) return '';
  return `${SITE_CONFIG.currency}${Number(price).toLocaleString('en-IN')}`;
}

/**
 * Calculate discount percentage
 */
export function calcDiscount(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/**
 * Generate star rating HTML
 */
export function renderStars(rating, size = 14) {
  let html = '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  for (let i = 0; i < full; i++) {
    html += `<i data-lucide="star" style="width:${size}px;height:${size}px;fill:currentColor;stroke:none;"></i>`;
  }
  if (half) {
    html += `<i data-lucide="star-half" style="width:${size}px;height:${size}px;fill:currentColor;"></i>`;
  }
  for (let i = 0; i < empty; i++) {
    html += `<i data-lucide="star" class="empty" style="width:${size}px;height:${size}px;"></i>`;
  }
  return html;
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(fn, delay = 100) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Get URL search params as object
 */
export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
}

/**
 * Update URL params without reload
 */
export function setUrlParams(params) {
  const url = new URL(window.location);
  Object.entries(params).forEach(([key, val]) => {
    if (val === null || val === undefined || val === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, val);
    }
  });
  window.history.replaceState({}, '', url);
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generate unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '...';
}

/**
 * Slugify text
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Relative time (e.g., "2 days ago")
 */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

/**
 * Check if element is in viewport
 */
export function isInViewport(el, threshold = 0) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) - threshold &&
    rect.bottom >= threshold
  );
}

/**
 * Wait / sleep
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Badge config
 */
export const BADGE_CONFIG = {
  'best-seller': { label: 'Best Seller', class: 'badge-best-seller' },
  'trending': { label: 'Trending', class: 'badge-trending' },
  'limited': { label: 'Limited', class: 'badge-limited' },
  'new': { label: 'New', class: 'badge-new' },
  'handmade': { label: 'Handmade', class: 'badge-handmade' },
  'custom': { label: 'Custom', class: 'badge-custom' },
};

/**
 * Render badge HTML
 */
export function renderBadge(badge) {
  if (!badge || !BADGE_CONFIG[badge]) return '';
  const config = BADGE_CONFIG[badge];
  return `<span class="badge ${config.class}">${config.label}</span>`;
}
