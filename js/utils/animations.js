// ============================================
// FILORAE — Scroll Animations & Parallax
// ============================================

/**
 * Initialize IntersectionObserver-based scroll animations
 */
export function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add stagger delay based on element position in its parent
          const parent = entry.target.parentElement;
          if (parent) {
            const siblings = parent.querySelectorAll('.animate-on-scroll');
            const idx = Array.from(siblings).indexOf(entry.target);
            entry.target.style.transitionDelay = `${idx * 0.08}s`;
          }

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  elements.forEach(el => observer.observe(el));
}

/**
 * Initialize parallax effects on scroll
 */
export function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (!parallaxElements.length) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        parallaxElements.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0.3;
          const rect = el.getBoundingClientRect();
          const inView = rect.bottom > 0 && rect.top < window.innerHeight;

          if (inView) {
            const offset = scrollY * speed;
            el.style.transform = `translateY(${offset}px)`;
          }
        });

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Counter animation
 */
export function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Animate counters when they enter viewport
 */
export function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.counter);
          const duration = parseInt(entry.target.dataset.counterDuration) || 2000;
          animateCounter(entry.target, target, duration);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
}

/**
 * Staggered entrance animation for grid items
 */
export function staggeredEntrance(container, selector = '.animate-on-scroll') {
  const items = container.querySelectorAll(selector);
  items.forEach((item, i) => {
    item.style.animationDelay = `${i * 0.08}s`;
    item.classList.add('is-visible');
  });
}

/**
 * Initialize all animation systems
 */
export function initAllAnimations() {
  initScrollAnimations();
  initParallax();
  initCounterAnimations();
}
