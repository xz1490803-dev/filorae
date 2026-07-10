// ============================================
// FILORAE — Auth Page Script
// ============================================

import { initApp } from '../app.js';
import { signInWithGoogle, signInWithEmail, signUp, forgotPassword, getCurrentUser } from '../../firebase/auth.js';
import { showToast } from '../../components/toast.js';

initApp({ showNavbar: false, showFooter: false });

// Redirect if already logged in
if (getCurrentUser()) {
  window.location.href = 'profile.html';
}

// Tab toggle
const loginTab = document.getElementById('tab-login');
const registerTab = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPanel = document.getElementById('forgot-panel');
const authForms = document.getElementById('auth-forms');

if (loginTab && registerTab) {
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    if (forgotPanel) forgotPanel.classList.remove('active');
    if (authForms) authForms.style.display = 'block';
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    if (forgotPanel) forgotPanel.classList.remove('active');
    if (authForms) authForms.style.display = 'block';
  });
}

// Google Sign In
document.querySelectorAll('.google-signin-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const result = await signInWithGoogle();
    if (result.success) {
      showToast('Welcome to Filorae! ♥', 'success');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.1 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 5.8 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 5.8 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.5-1.7 13.1-4.5l-6-5.2C29.1 35.9 26.7 36 24 36c-5.3 0-9.8-3-11.2-7.2l-6.5 5C9.5 40 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6 5.2C36.6 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg> Continue with Google';
    }
  });
});

// Email Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    const btn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) return;

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const result = await signInWithEmail(email, password, rememberMe);
    if (result.success) {
      showToast('Welcome back! ♥', 'success');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

// Email Register
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const btn = registerForm.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const result = await signUp(email, password, name);
    if (result.success) {
      showToast('Account created! Welcome to Filorae ♥', 'success');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// Forgot Password
const forgotLink = document.getElementById('forgot-password-link');
const forgotBack = document.getElementById('forgot-back');
const forgotForm = document.getElementById('forgot-form');

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (authForms) authForms.style.display = 'none';
    if (forgotPanel) forgotPanel.classList.add('active');
  });
}

if (forgotBack) {
  forgotBack.addEventListener('click', () => {
    if (forgotPanel) forgotPanel.classList.remove('active');
    if (authForms) authForms.style.display = 'block';
  });
}

if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const btn = forgotForm.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = 'Sending...';

    const result = await forgotPassword(email);
    if (result.success) {
      forgotForm.innerHTML = `
        <div class="auth-success">
          <div class="auth-success__icon"><i data-lucide="mail-check" style="width:28px;height:28px;"></i></div>
          <h3>Email Sent!</h3>
          <p>Check your inbox for a password reset link.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    } else {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
  });
}

// Password visibility toggle
document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '<i data-lucide="eye-off" style="width:18px;height:18px;"></i>';
    } else {
      input.type = 'password';
      btn.innerHTML = '<i data-lucide="eye" style="width:18px;height:18px;"></i>';
    }
    if (window.lucide) window.lucide.createIcons();
  });
});
