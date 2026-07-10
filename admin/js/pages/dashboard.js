// ============================================
// FILORAE ADMIN — Dashboard Logic
// ============================================

import { requireAdmin } from '../services/auth.js';

// 1. Guard route
requireAdmin();

import { collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';
import { db } from '../config/firebase.js';

// 2. Initialize UI
if (window.lucide) {
  window.lucide.createIcons();
}

async function fetchDashboardStats() {
  try {
    const gridEl = document.getElementById('category-stock-grid');
    if (!gridEl) return;

    // Fetch all products
    const productsSnap = await getDocs(collection(db, 'products'));
    const categoriesMap = {}; // { 'categoryName': { totalItems: 0, inStockItems: 0, lowStockItems: 0, outOfStockItems: 0 } }

    productsSnap.forEach(doc => {
      const data = doc.data();
      const cat = data.category || 'Uncategorized';
      
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { totalItems: 0, inStockItems: 0, lowStockItems: 0, outOfStockItems: 0 };
      }

      categoriesMap[cat].totalItems++;

      if (data.inStock === false) {
        categoriesMap[cat].outOfStockItems++;
      } else {
        categoriesMap[cat].inStockItems++;
        if (data.stock !== undefined && data.stock < 5) {
          categoriesMap[cat].lowStockItems++;
        }
      }
    });

    const categoryNames = Object.keys(categoriesMap).sort();

    if (categoryNames.length === 0) {
      gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:var(--space-8);color:var(--text-tertiary);">No products found in the database.</div>`;
      return;
    }

    let html = '';
    for (const cat of categoryNames) {
      const stats = categoriesMap[cat];
      
      let statusHtml = '';
      if (stats.outOfStockItems > 0) {
        statusHtml = `<span class="badge badge-error" style="margin-top:var(--space-2);">${stats.outOfStockItems} Out of Stock</span>`;
      } else if (stats.lowStockItems > 0) {
        statusHtml = `<span class="badge badge-warning" style="margin-top:var(--space-2);">${stats.lowStockItems} Low Stock</span>`;
      } else {
        statusHtml = `<span class="badge badge-success" style="margin-top:var(--space-2);">All Good</span>`;
      }

      html += `
        <div class="card card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-4);">
            <div>
              <p style="font-size:var(--text-xs);color:var(--text-secondary);text-transform:uppercase;font-weight:var(--fw-semibold);">Category</p>
              <h3 style="font-size:var(--text-lg);font-weight:var(--fw-bold);margin:0;">${cat}</h3>
            </div>
            <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--bg-surface-hover);color:var(--brand-primary);display:flex;align-items:center;justify-content:center;">
              <i data-lucide="tag" style="width:20px;height:20px;"></i>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:var(--space-3);">
            <div>
              <p style="font-size:var(--text-xs);color:var(--text-tertiary);">Total Products</p>
              <p style="font-size:var(--text-md);font-weight:var(--fw-semibold);">${stats.totalItems}</p>
            </div>
            <div style="text-align:right;">
              ${statusHtml}
            </div>
          </div>
        </div>
      `;
    }

    gridEl.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

  } catch (error) {
    console.error("Error fetching stats:", error);
    const gridEl = document.getElementById('category-stock-grid');
    if (gridEl) {
      gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:var(--space-8);color:var(--color-error);">Error loading stock data.</div>`;
    }
  }
}

// 4. Initialize Charts (Mock data for now, would connect to Firestore in prod)
let revenueChartInstance = null;
let categoryChartInstance = null;

function initCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#CBD5E1' : '#475569';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "'Outfit', sans-serif";

  // Revenue Chart
  const revCtx = document.getElementById('revenueChart');
  if (revCtx) {
    revenueChartInstance = new Chart(revCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Revenue (₹)',
          data: [], // Removed dummy data
          borderColor: '#5C7A5C',
          backgroundColor: 'rgba(92, 122, 92, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#5C7A5C'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false, drawBorder: false } },
          y: { 
            grid: { color: gridColor, drawBorder: false },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Category Chart
  const catCtx = document.getElementById('categoryChart');
  if (catCtx) {
    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: ['Keychains', 'Bouquets', 'Amigurumi', 'Accessories'],
        datasets: [{
          data: [], // Removed dummy data
          backgroundColor: [
            '#5C7A5C', // brand primary
            '#F59E0B', // warning
            '#3B82F6', // blue
            '#EC4899'  // pink
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        },
        cutout: '70%'
      }
    });
  }
}

function updateChartsTheme(theme) {
  if (!revenueChartInstance) return;
  const isDark = theme === 'dark';
  const textColor = isDark ? '#CBD5E1' : '#475569';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  Chart.defaults.color = textColor;
  
  revenueChartInstance.options.scales.y.grid.color = gridColor;
  revenueChartInstance.update();
  
  categoryChartInstance.update();
}

// Start charts on load
document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardStats();
});

// Listen for theme changes from auth.js
window.addEventListener('themeChanged', (e) => {
  updateChartsTheme(e.detail);
});
