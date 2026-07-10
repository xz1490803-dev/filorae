// ============================================
// FILORAE — Client-Side Cache Service
// ============================================

const CACHE_PREFIX = 'filo_v2_';

/**
 * Get item from cache if not expired
 */
export function getFromCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Set item to cache with TTL
 * @param {string} key
 * @param {*} data
 * @param {number} ttl - Time to live in milliseconds
 */
export function setToCache(key, data, ttl = 5 * 60 * 1000) {
  try {
    const entry = {
      data,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // localStorage full — clear old entries
    localStorage.clear();
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        data,
        expiry: Date.now() + ttl
      }));
    } catch {}
  }
}

/**
 * Remove item from cache
 */
export function removeFromCache(key) {
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clear all Filorae cache entries
 */
export function clearCache() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_PREFIX)) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Clear only expired entries
 */
export function clearExpiredCache() {
  const now = Date.now();
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_PREFIX)) keys.push(key);
  }
  keys.forEach(key => {
    try {
      const { expiry } = JSON.parse(localStorage.getItem(key));
      if (now > expiry) localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  });
}

// ---- LocalStorage helpers for persistent data (wishlists, preferences) ----

export function getLocal(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocal(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {
    // Storage full
  }
}

export function removeLocal(key) {
  localStorage.removeItem(CACHE_PREFIX + key);
}
