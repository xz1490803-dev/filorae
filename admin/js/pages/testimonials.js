// ============================================
// FILORAE ADMIN — Testimonials Page
// ============================================

import { requireAdmin } from '../services/auth.js';
import { subscribeToTestimonials, deleteTestimonial } from '../../../firebase/firestore.js';
import { sanitize, renderStars } from '../../../js/utils/helpers.js';

requireAdmin();
if (window.lucide) window.lucide.createIcons();

let allTestimonials = [];
const tbody = document.getElementById('testimonials-tbody');
const searchInput = document.getElementById('search-input');
const featuredFilter = document.getElementById('featured-filter');
const ratingFilter = document.getElementById('rating-filter');

function loadData() {
  subscribeToTestimonials((testimonials) => {
    allTestimonials = testimonials;
    renderTable();
  });
}

function renderTable() {
  if (!allTestimonials.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No testimonials found.</td></tr>';
    return;
  }

  const query = searchInput.value.toLowerCase();
  const featured = featuredFilter.value;
  const rating = ratingFilter.value;

  const filtered = allTestimonials.filter(t => {
    if (query) {
      const matchName = t.name?.toLowerCase().includes(query);
      const matchHandle = t.igHandle?.toLowerCase().includes(query);
      const matchText = t.text?.toLowerCase().includes(query);
      const matchProduct = t.product?.toLowerCase().includes(query);
      if (!matchName && !matchHandle && !matchText && !matchProduct) return false;
    }
    if (featured === 'featured' && !t.isFeatured) return false;
    if (featured === 'standard' && t.isFeatured) return false;
    if (rating && String(t.rating) !== rating) return false;
    return true;
  });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No testimonials match your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const initial = (t.name || '?')[0].toUpperCase();
    const avatarHtml = t.avatar 
      ? `<img src="${sanitize(t.avatar)}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
      : `<div style="width:40px;height:40px;border-radius:50%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:bold;color:var(--text-secondary);">${initial}</div>`;
      
    const handleHtml = t.igHandle 
      ? `<div style="font-size:var(--text-xs);color:var(--text-tertiary);">@${sanitize(t.igHandle)}</div>` 
      : '';

    return `
      <tr>
        <td>${avatarHtml}</td>
        <td>
          <div style="font-weight:var(--fw-medium);color:var(--text-primary);">${sanitize(t.name)}</div>
          ${handleHtml}
        </td>
        <td>
          <div style="font-size:var(--text-sm);max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${sanitize(t.text)}">
            ${sanitize(t.text)}
          </div>
          <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px;">Product: ${sanitize(t.product || 'N/A')}</div>
        </td>
        <td>
          <div style="display:flex;gap:2px;color:#FFB800;">
            ${renderStars(t.rating || 5, 14)}
          </div>
        </td>
        <td>
          <span class="badge ${t.isFeatured ? 'badge-success' : 'badge-neutral'}">
            ${t.isFeatured ? 'Featured' : 'Standard'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:0.5rem;">
            <a href="testimonial-form.html?id=${t.id}" class="icon-btn" title="Edit">
              <i data-lucide="edit" style="width:16px;height:16px;"></i>
            </a>
            <button class="icon-btn btn-delete" data-id="${t.id}" title="Delete" style="color:var(--color-error);">
              <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();

  // Attach delete listeners
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('Are you sure you want to delete this testimonial?')) {
        const btnEl = e.currentTarget;
        const originalHtml = btnEl.innerHTML;
        btnEl.innerHTML = '<span class="spinner" style="width:14px;height:14px;"></span>';
        
        const success = await deleteTestimonial(id);
        if (success) {
          allTestimonials = allTestimonials.filter(t => t.id !== id);
          renderTable();
        } else {
          alert('Failed to delete testimonial.');
          btnEl.innerHTML = originalHtml;
        }
      }
    });
  });
}

searchInput.addEventListener('input', renderTable);
featuredFilter.addEventListener('change', renderTable);
ratingFilter.addEventListener('change', renderTable);

loadData();
