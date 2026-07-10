// ============================================
// FILORAE ADMIN — Product Form Logic
// ============================================

import { requireAdmin } from '../services/auth.js';
import { db } from '../config/firebase.js';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';
import { compressImage } from '../utils/image-compressor.js';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/iwdexpzg/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'filorae_admin';

requireAdmin();

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const isEditing = !!productId;

// State
let uploadedFiles = []; // New files to upload
let existingImages = []; // URLs of already uploaded images

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) window.lucide.createIcons();
  
  await loadCategories();

  if (isEditing) {
    document.getElementById('page-title').textContent = 'Edit Product';
    await loadProductData(productId);
  } else {
    // Auto-generate slug from name if new
    document.getElementById('p-name').addEventListener('input', (e) => {
      if(!document.getElementById('p-slug').dataset.manuallyEdited) {
        document.getElementById('p-slug').value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });
    document.getElementById('p-slug').addEventListener('input', (e) => {
      e.target.dataset.manuallyEdited = 'true';
    });
  }


  setupImageUploader();

  document.getElementById('btn-cancel').addEventListener('click', () => {
    window.location.href = 'products.html';
  });

  document.getElementById('btn-save').addEventListener('click', saveProduct);
});

async function loadCategories() {
  const select = document.getElementById('p-category');
  try {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = doc.data().name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories", error);
  }
}

async function loadProductData(id) {
  try {
    const docSnap = await getDoc(doc(db, 'products', id));
    if (docSnap.exists()) {
      const p = docSnap.data();
      document.getElementById('p-name').value = p.name || '';
      document.getElementById('p-desc').value = p.description || '';
      document.getElementById('p-materials').value = p.materials || '';
      document.getElementById('p-dimensions').value = p.dimensions || '';
      document.getElementById('p-care').value = p.careInstructions || '';
      document.getElementById('p-price').value = p.price || '';
      document.getElementById('p-oldprice').value = p.oldPrice || '';
      document.getElementById('p-stock').value = p.inStock ? 'true' : 'false';
      document.getElementById('p-category').value = p.category || '';
      document.getElementById('p-badge').value = p.badge || '';
      document.getElementById('p-featured').checked = !!p.featured;
      document.getElementById('p-slug').value = p.slug || id;
      document.getElementById('p-slug').dataset.manuallyEdited = 'true';
      document.getElementById('p-tags').value = (p.tags || []).join(', ');

      existingImages = p.images || [];
      renderImagePreviews();
    }
  } catch (error) {
    console.error("Error loading product", error);
    alert('Failed to load product data.');
  }
}

// --- Image Upload Logic ---
function setupImageUploader() {
  const dropzone = document.getElementById('image-dropzone');
  const input = document.getElementById('image-input');

  dropzone.addEventListener('click', (e) => {
    if (e.target === input) return;
    input.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  input.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    input.value = ''; // Reset
  });
}

async function handleFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    // Compress
    try {
      const compressedFile = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.8, type: 'image/webp' });
      // Create local preview URL
      compressedFile.previewUrl = URL.createObjectURL(compressedFile);
      uploadedFiles.push(compressedFile);
    } catch (err) {
      console.error('Compression failed for', file.name, err);
      alert(`Failed to process image: ${file.name}`);
    }
  }
  renderImagePreviews();
}

function renderImagePreviews() {
  const container = document.getElementById('image-preview-container');
  container.innerHTML = '';

  // Render existing images (from Firestore)
  existingImages.forEach((img, index) => {
    // Backwards compatibility for old string URLs
    const url = typeof img === 'string' ? img : img.url;
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    div.innerHTML = `
      <img src="${url}" alt="Existing">
      <div class="remove-btn" data-type="existing" data-index="${index}"><i data-lucide="x" style="width:14px;height:14px;"></i></div>
    `;
    container.appendChild(div);
  });

  // Render new uploads
  uploadedFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    div.innerHTML = `
      <img src="${file.previewUrl}" alt="New">
      <div class="remove-btn" data-type="new" data-index="${index}"><i data-lucide="x" style="width:14px;height:14px;"></i></div>
    `;
    container.appendChild(div);
  });

  if (window.lucide) window.lucide.createIcons();

  // Attach remove listeners
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const index = parseInt(btn.dataset.index);
      
      if (type === 'existing') {
        const removed = existingImages[index];
        // Only delete from Cloudinary if it's an object with a public_id
        if (typeof removed === 'object' && removed.public_id) {
          try {
            await fetch('/api/deleteImage', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                // Assuming admin token logic is needed, placeholder for now
                'Authorization': 'Bearer filorae_admin_secret' 
              },
              body: JSON.stringify({ public_id: removed.public_id })
            });
          } catch (err) {
            console.error('Failed to delete image from Cloudinary', err);
          }
        }
        existingImages.splice(index, 1);
      } else {
        uploadedFiles.splice(index, 1);
      }
      renderImagePreviews();
    });
  });
}

// --- Save Logic ---
async function saveProduct() {
  const btn = document.getElementById('btn-save');
  const form = document.getElementById('product-form');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;border-color:white;border-top-color:transparent;display:inline-block;margin-right:8px;"></span> Saving...`;

  try {
    // 1. Upload new images to Cloudinary
    const uploadedImages = [];
    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'products');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      // Generate optimized delivery URL
      // Automatically uses f_auto and q_auto
      const optimizedUrl = `https://res.cloudinary.com/iwdexpzg/image/upload/f_auto,q_auto/${data.public_id}`;

      uploadedImages.push({
        url: optimizedUrl,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format
      });
    }

    // Combine existing + new images
    const finalImages = [...existingImages, ...uploadedImages];

    // 2. Prepare Data
    const slug = document.getElementById('p-slug').value.trim();
    const productData = {
      name: document.getElementById('p-name').value.trim(),
      description: document.getElementById('p-desc').value.trim(),
      materials: document.getElementById('p-materials').value.trim(),
      dimensions: document.getElementById('p-dimensions').value.trim(),
      careInstructions: document.getElementById('p-care').value.trim(),
      price: parseFloat(document.getElementById('p-price').value),
      oldPrice: document.getElementById('p-oldprice').value ? parseFloat(document.getElementById('p-oldprice').value) : null,
      inStock: document.getElementById('p-stock').value === 'true',
      category: document.getElementById('p-category').value,
      badge: document.getElementById('p-badge').value,
      bestSeller: document.getElementById('p-badge').value === 'best-seller',
      trending: document.getElementById('p-badge').value === 'trending',
      featured: document.getElementById('p-featured').checked,
      slug: slug,
      tags: document.getElementById('p-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      images: finalImages,
      updatedAt: serverTimestamp()
    };

    // 3. Save to Firestore
    if (isEditing) {
      await updateDoc(doc(db, 'products', productId), productData);
    } else {
      productData.createdAt = serverTimestamp();
      productData.rating = 0;
      productData.reviewCount = 0;
      // Use slug as doc ID or auto-gen
      const targetId = slug || Date.now().toString();
      await setDoc(doc(db, 'products', targetId), productData);
    }

    // Clear frontend cache so changes reflect immediately
    const targetId = isEditing ? productId : (slug || Date.now().toString());
    localStorage.removeItem('filo_v2_product_' + targetId);
    localStorage.removeItem('filo_v2_all_products_catalog');
    
    // Success
    window.location.href = 'products.html';

  } catch (error) {
    console.error("Error saving product", error);
    alert('Failed to save product. Check console for details.');
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="save" style="width:16px;height:16px;"></i> Save Product`;
    if (window.lucide) window.lucide.createIcons();
  }
}
