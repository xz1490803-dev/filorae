export function initLightbox() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Check if clicked element is an image
    if (target.tagName === 'IMG') {
      // Ignore clicks on images inside links (unless they have a specific lightbox class), logos, or small icons
      const isInsideLink = target.closest('a') !== null;
      const isLogoOrIcon = target.classList.contains('logo') || target.classList.contains('icon') || target.closest('.navbar');
      
      // We will allow lightbox if it has data-lightbox, or if it's not a logo/icon/link
      if (isLogoOrIcon) return;
      if (isInsideLink && !target.hasAttribute('data-lightbox')) return;

      openLightbox(target.src, target.alt);
    }
  });
}

function openLightbox(src, alt) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  
  // Create image container
  const imgContainer = document.createElement('div');
  imgContainer.className = 'lightbox-content';
  
  // Create image
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || 'Enlarged Image';
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.setAttribute('aria-label', 'Close image');
  
  // Append elements
  imgContainer.appendChild(img);
  overlay.appendChild(imgContainer);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
  
  // Prevent body scrolling
  document.body.style.overflow = 'hidden';
  
  // Close logic
  const closeLightbox = () => {
    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 300); // Matches CSS animation duration
  };
  
  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === imgContainer) {
      closeLightbox();
    }
  });
  
  // Close on Escape key
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}
