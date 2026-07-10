// ============================================
// FILORAE — Profile Page Script
// ============================================

import { initApp, refreshUI } from '../app.js';
import { getCurrentUser, onAuthChange, signOut, updateProfile } from '../../firebase/auth.js';
import { uploadProfilePicture } from '../../firebase/storage.js';
import { showToast } from '../../components/toast.js';

initApp();

// Redirect if not logged in
onAuthChange(user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  renderProfile(user);
});

function renderProfile(user) {
  const container = document.getElementById('profile-container');
  if (!container) return;

  const initial = (user.displayName || user.email || '?')[0].toUpperCase();

  container.innerHTML = `
    <div class="profile-layout">
      <aside class="profile-sidebar">
        <div class="profile-avatar-section">
          <div class="profile-avatar-wrap">
            ${user.photoURL
              ? `<img src="${user.photoURL}" alt="Profile photo" id="profile-img">`
              : `<div class="avatar-placeholder" style="width:100px;height:100px;font-size:2rem;" id="profile-img">${initial}</div>`
            }
            <label class="profile-avatar-edit" for="avatar-upload" aria-label="Change photo">
              <i data-lucide="camera" style="width:14px;height:14px;"></i>
            </label>
            <input type="file" id="avatar-upload" accept="image/*" style="display:none;">
          </div>
          <h2 class="profile-name">${user.displayName || 'User'}</h2>
          <p class="profile-email">${user.email}</p>
        </div>

        <nav class="profile-nav">
          <button class="profile-nav-link active" data-section="info">
            <i data-lucide="user" style="width:18px;height:18px;"></i>
            My Profile
          </button>
          <a href="wishlist.html" class="profile-nav-link">
            <i data-lucide="heart" style="width:18px;height:18px;"></i>
            Wishlist
          </a>
          <a href="order-guide.html" class="profile-nav-link">
            <i data-lucide="book-open" style="width:18px;height:18px;"></i>
            How to Order
          </a>
          <button class="profile-nav-link" id="signout-btn" style="color:var(--color-error);">
            <i data-lucide="log-out" style="width:18px;height:18px;"></i>
            Sign Out
          </button>
        </nav>
      </aside>

      <div class="profile-content">
        <div class="profile-content__header">
          <h2>My Profile</h2>
        </div>
        <form class="profile-form" id="profile-form">
          <div class="input-group">
            <label class="input-label" for="profile-name">Display Name</label>
            <input type="text" id="profile-name" class="input-field" value="${user.displayName || ''}" placeholder="Your name">
          </div>
          <div class="input-group">
            <label class="input-label" for="profile-email">Email</label>
            <input type="email" id="profile-email" class="input-field" value="${user.email || ''}" disabled>
            <small class="text-muted" style="font-size:var(--text-xs);">Email cannot be changed</small>
          </div>
          <div class="input-group">
            <label class="input-label" for="profile-phone">Phone (for orders)</label>
            <input type="tel" id="profile-phone" class="input-field" placeholder="+91 XXXXXXXXXX">
          </div>
          <div class="input-group">
            <label class="input-label" for="profile-address">Default Address</label>
            <textarea id="profile-address" class="input-field" rows="3" placeholder="Your delivery address"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  `;

  refreshUI();

  // Avatar upload
  const avatarInput = document.getElementById('avatar-upload');
  if (avatarInput) {
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB', 'error');
        return;
      }

      showToast('Uploading photo...', 'info');
      const result = await uploadProfilePicture(user.uid, file);
      if (result.success) {
        await updateProfile({ photoURL: result.url });
        showToast('Profile photo updated! ♥', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('Upload failed. Try again.', 'error');
      }
    });
  }

  // Save profile
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const displayName = document.getElementById('profile-name').value.trim();
      const btn = profileForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      const result = await updateProfile({ displayName });
      if (result.success) {
        showToast('Profile updated! ♥', 'success');
      } else {
        showToast('Could not update profile', 'error');
      }

      btn.disabled = false;
      btn.textContent = 'Save Changes';
    });
  }

  // Sign out
  const signoutBtn = document.getElementById('signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      await signOut();
      window.location.href = 'index.html';
    });
  }
}
