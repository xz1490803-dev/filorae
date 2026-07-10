// ============================================
// FILORAE ADMIN — Testimonial Form Script
// ============================================

import { requireAdmin } from '../services/auth.js';
import { getTestimonial, saveTestimonial } from '../../../firebase/firestore.js';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/iwdexpzg/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'filorae_admin';

requireAdmin();
if (window.lucide) window.lucide.createIcons();

const urlParams = new URLSearchParams(window.location.search);
const testimonialId = urlParams.get('id');
const isEditMode = !!testimonialId;

let existingImage = null; // Can be a string (URL) or an object with public_id
let uploadedFile = null;

const form = document.getElementById('testimonial-form');
const btnSave = document.getElementById('btn-save');

const fieldName = document.getElementById('t-name');
const fieldIgHandle = document.getElementById('t-igHandle');
const fieldRating = document.getElementById('t-rating');
const fieldProduct = document.getElementById('t-product');
const fieldText = document.getElementById('t-text');
const fieldIgUrl = document.getElementById('t-igUrl');
const fieldDate = document.getElementById('t-date');
const fieldFeatured = document.getElementById('t-featured');
const fieldVerified = document.getElementById('t-verified');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('image-upload');
const previewContainer = document.getElementById('image-preview-container');

// Set default date to today
if (!isEditMode) {
  fieldDate.valueAsDate = new Date();
}

// --- Load Existing Data ---
if (isEditMode) {
  document.getElementById('page-title').textContent = 'Edit Testimonial';
  loadTestimonialData();
}

async function loadTestimonialData() {
  try {
    const data = await getTestimonial(testimonialId);
    if (!data) throw new Error('Testimonial not found');

    fieldName.value = data.name || '';
    fieldIgHandle.value = data.igHandle || '';
    fieldRating.value = data.rating || 5;
    fieldProduct.value = data.product || '';
    fieldText.value = data.text || '';
    fieldIgUrl.value = data.igUrl || '';
    
    if (data.date) {
      fieldDate.value = new Date(data.date).toISOString().split('T')[0];
    }
    
    fieldFeatured.checked = !!data.isFeatured;
    fieldVerified.checked = data.isVerified !== false;

    if (data.avatar) {
      existingImage = data.avatar;
    }
    renderImagePreview();
  } catch (error) {
    console.error('Error loading testimonial:', error);
    alert('Failed to load testimonial.');
  }
}

// --- Drag & Drop Image ---
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener('change', e => {
  if (e.target.files && e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
});

function handleFiles(files) {
  const file = files[0];
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('File exceeds 5MB limit.');
    return;
  }
  
  // Set as the only uploaded file (replace existing preview)
  uploadedFile = file;
  uploadedFile.previewUrl = URL.createObjectURL(file);
  renderImagePreview();
}

function renderImagePreview() {
  previewContainer.innerHTML = '';
  
  if (uploadedFile) {
    // Show newly uploaded file
    const div = document.createElement('div');
    div.className = 'image-preview';
    div.innerHTML = `
      <img src="${uploadedFile.previewUrl}" alt="New">
      <div class="image-remove" id="btn-remove-new"><i data-lucide="x" style="width:14px;height:14px;"></i></div>
    `;
    previewContainer.appendChild(div);
  } else if (existingImage) {
    // Show existing image
    const url = typeof existingImage === 'object' ? existingImage.url : existingImage;
    const div = document.createElement('div');
    div.className = 'image-preview';
    div.innerHTML = `
      <img src="${url}" alt="Existing">
      <div class="image-remove" id="btn-remove-existing"><i data-lucide="x" style="width:14px;height:14px;"></i></div>
    `;
    previewContainer.appendChild(div);
  }

  if (window.lucide) window.lucide.createIcons();

  // Attach remove listeners
  const btnRemoveNew = document.getElementById('btn-remove-new');
  if (btnRemoveNew) {
    btnRemoveNew.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedFile = null;
      fileInput.value = '';
      renderImagePreview();
    });
  }
  
  const btnRemoveExisting = document.getElementById('btn-remove-existing');
  if (btnRemoveExisting) {
    btnRemoveExisting.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Only delete from Cloudinary if it's an object with a public_id
      if (typeof existingImage === 'object' && existingImage.public_id) {
        try {
          await fetch('/api/deleteImage', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer filorae_admin_secret' 
            },
            body: JSON.stringify({ public_id: existingImage.public_id })
          });
        } catch (err) {
          console.error('Failed to delete image from Cloudinary', err);
        }
      }
      existingImage = null;
      renderImagePreview();
    });
  }
}

// --- Save Logic ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  btnSave.disabled = true;
  btnSave.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:8px;"></span> Saving...';

  try {
    let finalAvatar = existingImage;

    // 1. Upload new image to Cloudinary if selected
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'testimonials');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const optimizedUrl = `https://res.cloudinary.com/iwdexpzg/image/upload/f_auto,q_auto/${data.public_id}`;

      finalAvatar = {
        url: optimizedUrl,
        public_id: data.public_id
      };
    }

    // 2. Prepare payload
    const payload = {
      name: fieldName.value.trim(),
      igHandle: fieldIgHandle.value.trim().replace('@', ''),
      rating: parseInt(fieldRating.value) || 5,
      product: fieldProduct.value.trim(),
      text: fieldText.value.trim(),
      igUrl: fieldIgUrl.value.trim(),
      date: fieldDate.value ? new Date(fieldDate.value).getTime() : Date.now(),
      isFeatured: fieldFeatured.checked,
      isVerified: fieldVerified.checked,
      avatar: finalAvatar,
      updatedAt: Date.now()
    };
    
    if (!isEditMode) {
      payload.createdAt = Date.now();
    }

    // 3. Save to Firestore
    await saveTestimonial(testimonialId, payload);
    
    // 4. Redirect
    window.location.href = 'testimonials.html';
  } catch (error) {
    console.error('Error saving testimonial:', error);
    alert('Failed to save testimonial: ' + error.message);
    btnSave.disabled = false;
    btnSave.textContent = 'Save Testimonial';
  }
});
