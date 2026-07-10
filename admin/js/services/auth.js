// ============================================
// FILORAE ADMIN — Auth Service & Guard
// ============================================

import { auth, db } from '../config/firebase.js';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';

/**
 * Check if a user UID is an Admin
 */
export async function isAdmin(uid) {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Admin Login
 */
export async function loginAdmin(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Verify Admin status
    const isUserAdmin = await isAdmin(user.uid);
    if (!isUserAdmin) {
      await firebaseSignOut(auth);
      return { success: false, error: 'Access Denied: You do not have administrator privileges.' };
    }
    
    return { success: true, user };
  } catch (error) {
    let msg = 'Invalid email or password.';
    if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    return { success: false, error: msg };
  }
}

/**
 * Sign Out
 */
export async function logoutAdmin() {
  await firebaseSignOut(auth);
  window.location.href = 'login.html';
}

/**
 * Admin Route Guard
 * Call this at the top of every authenticated admin page.
 */
export function requireAdmin() {
  // Show a loading overlay immediately
  const loader = document.createElement('div');
  loader.style.cssText = 'position:fixed;inset:0;background:var(--bg-base);z-index:9999;display:flex;align-items:center;justify-content:center;';
  loader.innerHTML = '<div style="width:40px;height:40px;border:3px solid var(--border-color);border-top-color:var(--brand-primary);border-radius:50%;animation:spin 1s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  document.body.appendChild(loader);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    const isUserAdmin = await isAdmin(user.uid);
    if (!isUserAdmin) {
      await firebaseSignOut(auth);
      window.location.replace('login.html?error=unauthorized');
      return;
    }

    // User is authorized
    loader.remove();
    
    // Setup global user info in header if available
    const userNameEl = document.getElementById('admin-user-name');
    const userInitialEl = document.getElementById('admin-user-initial');
    if (userNameEl) userNameEl.textContent = user.displayName || user.email;
    if (userInitialEl) userInitialEl.textContent = (user.displayName || user.email || '?')[0].toUpperCase();
    
    // Bind logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutAdmin);
    }
  });
}

// ============================================
// GLOBAL THEME LOGIC
// ============================================
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  const getPreferredTheme = () => {
    const saved = localStorage.getItem('filorae-admin-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    }
    localStorage.setItem('filorae-admin-theme', theme);
    if (window.lucide) window.lucide.createIcons();
    
    // Dispatch event for charts
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
  };

  setTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

// Initialize theme immediately
initTheme();

// ============================================
// Mobile Navigation Setup
// ============================================
function initMobileNav() {
  const headerLeft = document.querySelector('.header__left');
  if (headerLeft && !document.querySelector('.mobile-menu-btn')) {
    // Inject Menu Button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'icon-btn mobile-menu-btn';
    menuBtn.innerHTML = '<i data-lucide=""menu""></i>';
    menuBtn.style.marginRight = 'var(--space-2)';
    headerLeft.prepend(menuBtn);

    // Inject Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    const sidebar = document.querySelector('.sidebar');
    
    // Toggle Logic
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
    
    // Close sidebar on nav item click (mobile)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}
