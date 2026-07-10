// ============================================
// FILORAE — Firebase Storage Service
// ============================================

import { storage } from './firebase.js';
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-storage.js';

/**
 * Get download URL for a storage path
 */
export async function getImageUrl(path) {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(userId, file) {
  try {
    const extension = file.name.split('.').pop();
    const storageRef = ref(storage, `avatars/${userId}.${extension}`);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: { uploadedBy: userId }
    });

    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
}
