// ============================================
// FILORAE — Home Page Script
// ============================================

import { initApp, refreshUI } from '../app.js';
import { getBanners, getFeaturedProducts, getBestSellers, getTrendingProducts, getNewArrivals, getCategories, subscribeToTestimonials, getFAQs } from '../../firebase/firestore.js';
import { createProductCard, createSkeletonCard } from '../../components/product-card.js';
import { formatPrice, renderStars, sanitize } from '../utils/helpers.js';
import { subscribeNewsletter } from '../../firebase/firestore.js';
import { showToast } from '../../components/toast.js';

// Initialize app
initApp();

// Load all home page sections
loadHomePage();

async function loadHomePage() {
  await Promise.all([
    loadHero(),
    loadCategories(),
    loadBestSellers(),
    loadTrending(),
    loadNewArrivals(),
    loadTestimonials(),
    loadFAQs(),
  ]);

  refreshUI();
}

// ---- Hero Section ----
async function loadHero() {
  const banners = await getBanners();
  const container = document.getElementById('hero-content');
  if (!container || banners.length === 0) return;

  const banner = banners[0];
  const titleEl = container.querySelector('.hero__title');
  const descEl = container.querySelector('.hero__desc');

  if (banner.title && titleEl) titleEl.innerHTML = banner.title;
  if (banner.subtitle && descEl) descEl.textContent = banner.subtitle;
}

// ---- Categories ----
async function loadCategories() {
  const categories = await getCategories();
  const container = document.getElementById('categories-scroll');
  if (!container) return;

  container.innerHTML = '';

  if (categories.length === 0) {
    // Demo categories
    const demo = [
      { name: 'Keychains', slug: 'keychains', image: '', description: 'Cute crochet keychains' },
      { name: 'Bouquets', slug: 'bouquets', image: '', description: 'Handmade flower bouquets' },
      { name: 'Amigurumi', slug: 'amigurumi', image: '', description: 'Adorable stuffed animals' },
      { name: 'Accessories', slug: 'accessories', image: '', description: 'Hair clips, scrunchies & more' },
      { name: 'Gift Sets', slug: 'gifts', image: '', description: 'Curated gift collections' },
      { name: 'Home Decor', slug: 'home-decor', image: '', description: 'Cozy home decorations' },
    ];
    demo.forEach(cat => container.appendChild(createCategoryCard(cat)));
  } else {
    categories.forEach(cat => container.appendChild(createCategoryCard(cat)));
  }
}

function createCategoryCard(cat) {
  const card = document.createElement('a');
  card.className = 'category-card animate-on-scroll scale-in';
  card.href = `category.html?cat=${cat.slug || cat.id}`;

  const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='%23d4e4d4'%3E%3Crect width='120' height='120' rx='60'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%235C7A5C' font-size='14' font-family='sans-serif'%3E${encodeURIComponent(cat.name?.[0] || '?')}%3C/text%3E%3C/svg%3E`;

  card.innerHTML = `
    <div class="category-card__image">
      <img src="${cat.image || placeholder}" alt="${sanitize(cat.name)}" loading="lazy" width="120" height="120">
    </div>
    <h3 class="category-card__name">${sanitize(cat.name)}</h3>
  `;
  return card;
}

// ---- Product Sections ----
async function loadBestSellers() {
  await loadProductSection('best-sellers-grid', getBestSellers);
}

async function loadTrending() {
  await loadProductSection('trending-grid', getTrendingProducts);
}

async function loadNewArrivals() {
  await loadProductSection('new-arrivals-grid', getNewArrivals);
}

async function loadProductSection(containerId, fetchFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Show skeletons
  container.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    container.appendChild(createSkeletonCard());
  }

  const products = await fetchFn(8);
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:var(--space-8);grid-column:1/-1;">Coming soon! ♥</p>';
    return;
  }

  products.forEach(product => {
    container.appendChild(createProductCard(product));
  });
}

// ---- Testimonials ----
async function loadTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;

  subscribeToTestimonials((testimonials) => {
    let items = testimonials.filter(t => t.isFeatured);
    if (items.length === 0 && testimonials.length === 0) {
      container.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--color-text-muted);">No testimonials yet.</p>';
      return;
    }
    if (items.length === 0) {
      items = testimonials.slice(0, 3);
    }

    container.innerHTML = '';
    items.forEach(t => {
      const card = document.createElement('div');
      card.className = 'testimonial-card animate-on-scroll fade-up';
      
      const avatarUrl = (t.avatar && typeof t.avatar === 'object') ? t.avatar.url : (t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || 'C')}&background=EAE7E0&color=5C7A5C`);
      const verifiedHtml = t.isVerified ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="var(--color-success)" style="margin-left:4px;vertical-align:middle;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>` : '';
      const nameHtml = t.igHandle ? `${sanitize(t.name)} <span style="color:var(--color-text-muted);font-weight:normal;">(@${sanitize(t.igHandle)})</span>` : sanitize(t.name);

      card.innerHTML = `
        <div class="testimonial-card__quote">"</div>
        <p class="testimonial-card__text">${sanitize(t.text)}</p>
        <div class="testimonial-card__author">
          ${t.avatar 
            ? `<img src="${sanitize(avatarUrl)}" alt="" class="testimonial-card__avatar" style="object-fit:cover;">`
            : `<div class="testimonial-card__avatar" style="background:var(--color-bg-alt);display:flex;align-items:center;justify-content:center;font-weight:bold;color:var(--color-text-muted);">${(t.name||'')[0]?.toUpperCase()||'C'}</div>`
          }
          <div>
            <div class="testimonial-card__name">${nameHtml}${verifiedHtml}</div>
            <div class="testimonial-card__rating" style="display:flex;gap:2px;color:#FFB800;">${renderStars(t.rating || 5, 12)}</div>
            ${t.product ? `<div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:2px;">Purchased: ${sanitize(t.product)}</div>` : ''}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
    
    if (window.lucide) window.lucide.createIcons();
    refreshUI();
  });
}

// ---- FAQs ----
async function loadFAQs() {
  const faqs = await getFAQs();
  const container = document.getElementById('home-faqs');
  if (!container) return;

  container.innerHTML = '';

  const items = faqs.length > 0 ? faqs : [
    { question: 'How do I place an order?', answer: 'Simply browse our products, click "Order on Instagram", fill in your details, and send the message directly to our Instagram DM. We\'ll confirm your order within 24 hours!' },
    { question: 'How long does delivery take?', answer: 'Since each item is handmade, delivery typically takes 5-7 business days. Custom orders may take 7-14 days depending on complexity.' },
    { question: 'Can I request custom designs?', answer: 'Absolutely! We love creating custom pieces. Send us a message on Instagram with your idea and we\'ll work together to bring it to life.' },
    { question: 'What payment methods do you accept?', answer: 'We accept UPI, bank transfer, and cash on delivery for select locations. Payment details will be shared after order confirmation.' },
  ];

  items.forEach((faq, i) => {
    const item = document.createElement('div');
    item.className = 'accordion-item';

    item.innerHTML = `
      <button class="accordion-header" aria-expanded="false">
        <span class="accordion-title">${sanitize(faq.question)}</span>
        <i data-lucide="chevron-down" class="accordion-icon" style="width:18px;height:18px;"></i>
      </button>
      <div class="accordion-body">
        <div class="accordion-content">${sanitize(faq.answer)}</div>
      </div>
    `;

    item.querySelector('.accordion-header').addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close others
      container.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
        item.querySelector('.accordion-header').setAttribute('aria-expanded', 'true');
      }
    });

    container.appendChild(item);
  });
}

// ---- Newsletter ----
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input[type="email"]');
    const email = input.value.trim();

    if (!email) return;

    const btn = newsletterForm.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Subscribing...';

    const result = await subscribeNewsletter(email);

    if (result.success) {
      showToast('Welcome to the Filorae family! ♥', 'success');
      input.value = '';
    } else {
      showToast('Something went wrong. Please try again.', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Subscribe';
  });
}
