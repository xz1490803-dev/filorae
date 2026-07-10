// ============================================
// FILORAE — Firestore Service
// ============================================

import { db } from './firebase.js';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, updateDoc,
  query, where, orderBy, limit, startAfter,
  onSnapshot, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';
import { getFromCache, setToCache } from '../js/utils/cache.js';

// ---- Products ----

/**
 * Get paginated products with filters and sorting
 */
export async function getProducts({ category, badge, minPrice, maxPrice, inStock, search, sortBy = 'createdAt', sortDir = 'desc', pageSize = 12, lastDoc = null } = {}) {
  try {
    let products = getFromCache('all_products_catalog');
    
    if (!products) {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      products = [];
      snapshot.forEach(docSnap => products.push({ id: docSnap.id, ...docSnap.data() }));
      setToCache('all_products_catalog', products, 5 * 60 * 1000); // 5 min cache
    }

    // Client-side filters
    let filtered = products;
    if (category) filtered = filtered.filter(p => p.category === category);
    if (badge) filtered = filtered.filter(p => p.badge === badge);
    if (inStock !== undefined) filtered = filtered.filter(p => !!p.inStock === inStock);
    if (minPrice !== undefined) filtered = filtered.filter(p => p.price >= minPrice);
    if (maxPrice !== undefined) filtered = filtered.filter(p => p.price <= maxPrice);
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(s))) ||
        (p.description && p.description.toLowerCase().includes(s))
      );
    }

    // Client-side Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'popular') return (b.reviewCount || 0) - (a.reviewCount || 0);
      
      // Default: createdAt desc
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });

    // Client-side Pagination (lastDoc acts as offset)
    const offset = lastDoc || 0;
    const paginated = filtered.slice(offset, offset + pageSize);
    const newOffset = offset + pageSize;
    const hasMore = newOffset < filtered.length;

    return {
      products: paginated,
      lastDoc: newOffset,
      hasMore: hasMore
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId) {
  try {
    const cached = getFromCache(`product_${productId}`);
    if (cached) return cached;

    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const product = { id: docSnap.id, ...docSnap.data() };
    setToCache(`product_${productId}`, product, 5 * 60 * 1000); // 5 min cache
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(count = 8) {
  const cached = getFromCache('featured_products');
  if (cached) return cached;

  try {
    const q = query(
      collection(db, 'products'),
      where('featured', '==', true)
    );
    const snapshot = await getDocs(q);
    let products = [];
    snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    
    // Sort locally by createdAt desc to avoid composite index (featured + createdAt)
    products.sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
    
    products = products.slice(0, count);
    setToCache('featured_products', products, 10 * 60 * 1000);
    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * Get best-selling products
 */
export async function getBestSellers(count = 8) {
  const cached = getFromCache('best_sellers');
  if (cached) return cached;

  try {
    const q = query(
      collection(db, 'products'),
      where('bestSeller', '==', true)
    );
    const snapshot = await getDocs(q);
    let products = [];
    snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    
    // Sort locally by reviewCount desc to avoid composite index (bestSeller + reviewCount)
    products.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    
    products = products.slice(0, count);
    setToCache('best_sellers', products, 10 * 60 * 1000);
    return products;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
}

/**
 * Get trending products
 */
export async function getTrendingProducts(count = 8) {
  const cached = getFromCache('trending_products');
  if (cached) return cached;

  try {
    const q = query(
      collection(db, 'products'),
      where('trending', '==', true)
    );
    const snapshot = await getDocs(q);
    let products = [];
    snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    
    // Sort locally by createdAt desc to avoid composite index (trending + createdAt)
    products.sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
    
    products = products.slice(0, count);
    setToCache('trending_products', products, 10 * 60 * 1000);
    return products;
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return [];
  }
}

/**
 * Get new arrivals
 */
export async function getNewArrivals(count = 8) {
  const cached = getFromCache('new_arrivals');
  if (cached) return cached;

  try {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    const products = [];
    snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    setToCache('new_arrivals', products, 10 * 60 * 1000);
    return products;
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

/**
 * Get related products by category
 */
export async function getRelatedProducts(productId, category, count = 4) {
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      limit(count + 1)
    );
    const snapshot = await getDocs(q);
    const products = [];
    snapshot.forEach(d => {
      if (d.id !== productId) products.push({ id: d.id, ...d.data() });
    });
    return products.slice(0, count);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

// ---- Categories ----

export async function getCategories() {
  const cached = getFromCache('categories');
  if (cached) return cached;

  try {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const categories = [];
    snapshot.forEach(d => categories.push({ id: d.id, ...d.data() }));
    setToCache('categories', categories, 30 * 60 * 1000); // 30 min
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// ---- Testimonials ----

export async function getTestimonials() {
  // Use cached if available for getDocs, but prefer subscribeToTestimonials for realtime
  const cached = getFromCache('testimonials');
  if (cached) return cached;

  try {
    const q = query(collection(db, 'testimonials'));
    const snapshot = await getDocs(q);
    const testimonials = [];
    snapshot.forEach(d => testimonials.push({ id: d.id, ...d.data() }));
    setToCache('testimonials', testimonials, 30 * 60 * 1000);
    return testimonials;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export function subscribeToTestimonials(callback) {
  const q = query(collection(db, 'testimonials'));
  return onSnapshot(q, (snapshot) => {
    const testimonials = [];
    snapshot.forEach(d => testimonials.push({ id: d.id, ...d.data() }));
    setToCache('testimonials', testimonials, 30 * 60 * 1000);
    callback(testimonials);
  }, (error) => {
    console.error('Error subscribing to testimonials:', error);
    callback([]);
  });
}

export async function getTestimonial(id) {
  try {
    const d = await getDoc(doc(db, 'testimonials', id));
    if (d.exists()) return { id: d.id, ...d.data() };
    return null;
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return null;
  }
}

export async function saveTestimonial(id, data) {
  try {
    if (id) {
      await updateDoc(doc(db, 'testimonials', id), data);
    } else {
      await addDoc(collection(db, 'testimonials'), data);
    }
    localStorage.removeItem('filo_v2_testimonials');
    return true;
  } catch (error) {
    console.error('Error saving testimonial:', error);
    throw error;
  }
}

export async function deleteTestimonial(id) {
  try {
    const t = await getTestimonial(id);
    if (t && t.avatar && typeof t.avatar === 'object' && t.avatar.public_id) {
      // Optional: Best effort delete from Cloudinary
      fetch('/api/deleteImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer filorae_admin_secret' },
        body: JSON.stringify({ public_id: t.avatar.public_id })
      }).catch(err => console.error('Failed to delete image from Cloudinary', err));
    }
    
    await deleteDoc(doc(db, 'testimonials', id));
    localStorage.removeItem('filo_v2_testimonials');
    return true;
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return false;
  }
}

// ---- FAQs ----

export async function getFAQs() {
  const cached = getFromCache('faqs');
  if (cached) return cached;

  try {
    const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const faqs = [];
    snapshot.forEach(d => faqs.push({ id: d.id, ...d.data() }));
    setToCache('faqs', faqs, 60 * 60 * 1000); // 1 hour
    return faqs;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

// ---- Banners ----

export async function getBanners() {
  const cached = getFromCache('banners');
  if (cached) return cached;

  try {
    // Fetch all banners ordered by order, then filter locally for active
    const q = query(
      collection(db, 'banners'),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    const banners = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (data.active) {
        banners.push({ id: d.id, ...data });
      }
    });
    setToCache('banners', banners, 15 * 60 * 1000);
    return banners;
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

// ---- Wishlist ----

export async function getWishlist(userId) {
  try {
    const q = query(collection(db, 'wishlists', userId, 'items'));
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

export async function addToWishlist(userId, productId) {
  try {
    const ref = doc(db, 'wishlists', userId, 'items', productId);
    await setDoc(ref, { addedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return { success: false, error: error.message };
  }
}

export async function removeFromWishlist(userId, productId) {
  try {
    const ref = doc(db, 'wishlists', userId, 'items', productId);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return { success: false, error: error.message };
  }
}

export async function isInWishlist(userId, productId) {
  try {
    const ref = doc(db, 'wishlists', userId, 'items', productId);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch (error) {
    return false;
  }
}

// ---- Newsletter Subscribers ----

export async function subscribeNewsletter(email) {
  try {
    const ref = doc(db, 'subscribers', email);
    await setDoc(ref, { subscribedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error subscribing:', error);
    return { success: false, error: error.message };
  }
}

// ---- Search ----

export async function searchProducts(searchQuery, maxResults = 20) {
  try {
    // Simple client-side search since Firestore doesn't support full-text search natively
    const q = query(collection(db, 'products'), limit(100));
    const snapshot = await getDocs(q);
    const search = searchQuery.toLowerCase();

    const results = [];
    snapshot.forEach(d => {
      const data = d.data();
      const score = calculateSearchScore(data, search);
      if (score > 0) {
        results.push({ id: d.id, ...data, _score: score });
      }
    });

    results.sort((a, b) => b._score - a._score);
    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

function calculateSearchScore(product, search) {
  let score = 0;
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  const cat = (product.category || '').toLowerCase();

  if (name === search) score += 100;
  if (name.includes(search)) score += 50;
  if (cat.includes(search)) score += 30;
  if (tags.some(t => t.includes(search))) score += 20;
  if (desc.includes(search)) score += 10;

  return score;
}

// ---- Orders ----

/**
 * Save a new order
 */
export async function addOrder(orderData) {
  try {
    const data = {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'orders'), data);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding order:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all orders for admin
 */
export async function getOrders() {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders = [];
    snapshot.forEach(d => orders.push({ id: d.id, ...d.data() }));
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId, newStatus) {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status: newStatus });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete ALL orders (Reset Dashboard)
 */
export async function deleteAllOrders() {
  try {
    const q = query(collection(db, 'orders'));
    const snapshot = await getDocs(q);
    
    // In Firestore, to delete a collection, you must delete all documents inside it.
    const deletePromises = [];
    snapshot.forEach(d => {
      deletePromises.push(deleteDoc(d.ref));
    });
    
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error('Error deleting all orders:', error);
    return { success: false, error: error.message };
  }
}
