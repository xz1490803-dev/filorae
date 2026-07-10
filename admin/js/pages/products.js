// ============================================
// FILORAE ADMIN — Products List Logic
// ============================================

import { requireAdmin } from '../services/auth.js';
import { db } from '../config/firebase.js';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';

requireAdmin();

let allProducts = [];
let categories = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) window.lucide.createIcons();
  
  await loadCategories();
  await loadProducts();
  
  document.getElementById('search-input').addEventListener('input', renderProducts);
  document.getElementById('category-filter').addEventListener('change', renderProducts);
  document.getElementById('stock-filter').addEventListener('change', renderProducts);
});

async function loadCategories() {
  const select = document.getElementById('category-filter');
  try {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories", error);
  }
}

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts();
  } catch (error) {
    console.error("Error loading products", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-error);">Error loading products.</td></tr>`;
  }
}

function renderProducts() {
  const tbody = document.getElementById('products-tbody');
  const search = document.getElementById('search-input').value.toLowerCase();
  const categoryId = document.getElementById('category-filter').value;
  const stockFilter = document.getElementById('stock-filter').value;
  
  let filtered = allProducts;
  
  if (search) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.slug && p.slug.includes(search)));
  }
  if (categoryId) {
    filtered = filtered.filter(p => p.category === categoryId);
  }
  if (stockFilter === 'in_stock') {
    filtered = filtered.filter(p => p.inStock === true);
  } else if (stockFilter === 'out_of_stock') {
    filtered = filtered.filter(p => p.inStock === false);
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">No products found.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = '';
  filtered.forEach(p => {
    const tr = document.createElement('tr');
    
    // Find category name
    const cat = categories.find(c => c.id === p.category);
    const catName = cat ? cat.name : p.category;
    
    // Image (Handle both old string array and new object array)
    const imgObj = p.images && p.images.length > 0 ? p.images[0] : null;
    const imgUrl = typeof imgObj === 'string' ? imgObj : (imgObj ? imgObj.url : 'https://placehold.co/100x100?text=No+Image');
    
    // Status badge
    const statusBadge = p.inStock 
      ? `<span class="badge badge-success">In Stock</span>`
      : `<span class="badge badge-error">Out of Stock</span>`;
      
    // Badges
    const featuredBadge = p.featured ? `<span class="badge badge-warning" style="margin-left:4px;">Featured</span>` : '';
      
    tr.innerHTML = `
      <td><img src="${imgUrl}" alt="${p.name}" class="table-img"></td>
      <td>
        <div style="font-weight:var(--fw-medium);color:var(--text-primary);">${p.name}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary);">SKU: ${p.slug || 'N/A'} ${featuredBadge}</div>
      </td>
      <td>${catName}</td>
      <td style="font-weight:var(--fw-medium);">₹${p.price}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="table-actions">
          <a href="product-form.html?id=${p.id}" class="icon-btn" title="Edit" style="color:var(--brand-primary);"><i data-lucide="edit" style="width:16px;height:16px;"></i></a>
          <button class="icon-btn btn-toggle-stock" data-id="${p.id}" data-stock="${p.inStock}" title="${p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}" style="color:var(--color-warning);"><i data-lucide="${p.inStock ? 'x-circle' : 'check-circle'}" style="width:16px;height:16px;"></i></button>
          <button class="icon-btn btn-delete" data-id="${p.id}" title="Delete" style="color:var(--color-error);"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  if (window.lucide) window.lucide.createIcons();
  
  // Attach Action Listeners
  document.querySelectorAll('.btn-toggle-stock').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const currentStock = e.currentTarget.dataset.stock === 'true';
      await toggleStock(id, !currentStock);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        await deleteProduct(id);
      }
    });
  });
}

async function toggleStock(id, newStatus) {
  try {
    await updateDoc(doc(db, 'products', id), { inStock: newStatus });
    // Update local state
    const p = allProducts.find(x => x.id === id);
    if (p) p.inStock = newStatus;
    renderProducts();
  } catch (error) {
    console.error("Error updating stock", error);
    alert('Failed to update stock status.');
  }
}

async function deleteProduct(id) {
  try {
    const product = allProducts.find(x => x.id === id);
    if (product && product.images) {
      // Delete all Cloudinary images first
      for (const img of product.images) {
        if (typeof img === 'object' && img.public_id) {
          try {
            await fetch('/api/deleteImage', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer filorae_admin_secret' 
              },
              body: JSON.stringify({ public_id: img.public_id })
            });
          } catch(err) {
            console.error('Failed to delete image from Cloudinary', err);
          }
        }
      }
    }

    await deleteDoc(doc(db, 'products', id));
    // Remove from local state
    allProducts = allProducts.filter(x => x.id !== id);
    renderProducts();
  } catch (error) {
    console.error("Error deleting product", error);
    alert('Failed to delete product.');
  }
}
