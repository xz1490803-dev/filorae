// ============================================
// FILORAE — Firebase Auth Service
// ============================================

import { auth, db } from './firebase.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Helper to save user profile to Firestore
 */
async function saveUserToFirestore(user) {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'No Name',
      photoURL: user.photoURL || '',
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
  }
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserToFirestore(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
}

/**
 * Sign in with email & password
 */
export async function signInWithEmail(email, password, rememberMe = false) {
  try {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    await saveUserToFirestore(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Email sign-in error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
}

/**
 * Create new account with email & password
 */
export async function signUp(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await firebaseUpdateProfile(result.user, { displayName });
      // Update local user object so saveUserToFirestore gets the name
      result.user.displayName = displayName;
    }
    await saveUserToFirestore(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Sign-up error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
}

/**
 * Send password reset email
 */
export async function forgotPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: getErrorMessage(error.code) };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Update user profile
 */
export async function updateProfile(data) {
  try {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await firebaseUpdateProfile(auth.currentUser, data);
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Human-readable error messages
 */
function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  return messages[code] || 'An unexpected error occurred. Please try again.';
}
