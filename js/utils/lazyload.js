// ============================================
// FILORAE — Lazy Loading
// ============================================

/**
 * Initialize lazy loading for images
 * Uses native loading="lazy" with IntersectionObserver blur-up fallback
 */
export function initLazyLoad() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px 0px', // Start loading 200px before visible
        threshold: 0
      }
    );

    images.forEach(img => observer.observe(img));
  } else {
    // Fallback: load all images
    images.forEach(img => loadImage(img));
  }
}

/**
 * Load a single lazy image
 */
function loadImage(img) {
  const src = img.dataset.src;
  const srcset = img.dataset.srcset;

  if (!src) return;

  // Create a temporary image to preload
  const tempImg = new Image();

  tempImg.onload = () => {
    img.src = src;
    if (srcset) img.srcset = srcset;
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
    img.classList.add('loaded');
  };

  tempImg.onerror = () => {
    img.classList.add('error');
  };

  tempImg.src = src;
}

/**
 * Observe dynamically added images (e.g., after AJAX load)
 */
export function observeNewImages(container) {
  const images = container.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '200px 0px', threshold: 0 }
  );

  images.forEach(img => observer.observe(img));
}
