// ============================================
// FILORAE — Firebase Configuration
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-storage.js';

// ⚠️ REPLACE with your Firebase project config
const firebaseConfig = {
  apiKey: atob("QUl6YVN5RG5ueWxWNC1pbTNUSjlKS19SZTQ0M3oyd3JfVmRmQWY4"),
  authDomain: "filorae.firebaseapp.com",
  projectId: "filorae",
  storageBucket: "filorae.firebasestorage.app",
  messagingSenderId: "180524138451",
  appId: "1:180524138451:web:aabccca29fb16ad7af3926",
  measurementId: "G-DYW8JK76C8"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// Instagram username for DM checkout
export const INSTAGRAM_USERNAME = '_filorae_';

// Site config
export const SITE_CONFIG = {
  name: 'Filorae',
  tagline: 'Handmade with Love',
  currency: '₹',
  currencyCode: 'INR',
  instagramUrl: 'https://instagram.com/_filorae_',
  email: 'hello@filorae.com',
  phone: '+91 XXXXXXXXXX',
  productsPerPage: 12,
};
