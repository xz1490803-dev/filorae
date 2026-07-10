// ============================================
// FILORAE ADMIN — Users Page Logic
// ============================================

import { db } from '../../../firebase/firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('users-table-body');
  
  if (!tableBody) return;

  try {
    const q = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;padding:var(--space-8);color:var(--text-tertiary);">
            <i data-lucide="users" style="width:48px;height:48px;margin-bottom:var(--space-2);opacity:0.5;"></i>
            <p>No registered users found.</p>
            <p style="font-size:var(--text-xs);margin-top:var(--space-1);">Users will appear here once they log in.</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const user = doc.data();
      
      const tr = document.createElement('tr');
      
      // Name & Avatar
      const initial = (user.displayName || '?').charAt(0).toUpperCase();
      const avatarHtml = user.photoURL 
        ? `<img src="${user.photoURL}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
        : `<div style="width:32px;height:32px;border-radius:50%;background:var(--brand-primary);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;">${initial}</div>`;
      
      // Format Date
      let dateString = 'N/A';
      if (user.lastLoginAt) {
        const d = user.lastLoginAt.toDate();
        dateString = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
      }

      tr.innerHTML = `
        <td>
          <div style="display:flex;align-items:center;gap:var(--space-3);">
            ${avatarHtml}
            <span style="font-weight:var(--fw-medium);">${user.displayName || 'Unnamed User'}</span>
          </div>
        </td>
        <td style="color:var(--text-secondary);">${user.email || 'N/A'}</td>
        <td><code style="font-size:12px;color:var(--text-tertiary);background:var(--bg-elevated);padding:2px 6px;border-radius:4px;">${user.uid}</code></td>
        <td style="color:var(--text-secondary);font-size:var(--text-sm);">${dateString}</td>
      `;
      tableBody.appendChild(tr);
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:var(--space-8);color:var(--color-error);">
          <p>Failed to load users.</p>
          <p style="font-size:12px;margin-top:4px;">${error.message}</p>
        </td>
      </tr>
    `;
  }
});
