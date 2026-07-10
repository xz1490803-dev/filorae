// ============================================
// FILORAE — Cart State Management
// ============================================

import { getLocal, setLocal } from './cache.js';

const CART_KEY = 'shopping_cart';

// Custom event for cart updates
export const CART_UPDATED_EVENT = 'filorae_cart_updated';

/**
 * Get all items in the cart
 */
export function getCart() {
  return getLocal(CART_KEY) || [];
}

/**
 * Save cart and dispatch event
 */
function saveCart(cart) {
  setLocal(CART_KEY, cart);
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: cart }));
}

/**
 * Add an item to the cart
 * @param {Object} item { productId, name, price, variant, quantity, image, shippingCharge }
 */
export function addToCart(item) {
  const cart = getCart();
  
  // Check if item already exists (same ID and variant)
  const existingIndex = cart.findIndex(i => i.productId === item.productId && i.variant === item.variant);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  
  saveCart(cart);
}

/**
 * Update quantity of a specific item
 */
export function updateCartQuantity(productId, variant, delta) {
  const cart = getCart();
  const index = cart.findIndex(i => i.productId === productId && i.variant === variant);
  
  if (index > -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
}

/**
 * Remove an item from the cart
 */
export function removeFromCart(productId, variant) {
  let cart = getCart();
  cart = cart.filter(i => !(i.productId === productId && i.variant === variant));
  saveCart(cart);
}

/**
 * Clear the entire cart
 */
export function clearCart() {
  saveCart([]);
}

/**
 * Calculate totals
 */
export function getCartTotals() {
  const cart = getCart();
  let subtotal = 0;
  let shipping = 0;
  
  cart.forEach(item => {
    subtotal += (item.price * item.quantity);
  });
  
  if (cart.length > 0) {
    shipping = 80;
  }
  
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    itemCount: cart.reduce((acc, item) => acc + item.quantity, 0)
  };
}
