// FAQ accordion
function setFaqState(item, open) {
  const a = item.querySelector('.faq-a');
  item.classList.toggle('open', open);
  a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
}

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  setFaqState(item, item.classList.contains('open'));

  item.querySelector('.faq-q').addEventListener('click', () => {
    const willOpen = !item.classList.contains('open');
    faqItems.forEach((other) => setFaqState(other, false));
    setFaqState(item, willOpen);
  });
});

// Gentle reveal-on-scroll — tags content sections so they fade up softly
// as they're reached, rather than everything appearing at once on load.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealSelectors = [
  '.folio', '.about-flow', '.list-row', '.tl-step',
  '.marquee', '.blog-card', '.faq-list', '.cta-band',
  '.calendar', '.mock-form', '.page-hero'
];

const revealEls = document.querySelectorAll(revealSelectors.join(','));

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in-view'));
} else {
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
}

// Nav bar switches to a solid fill once the page has scrolled past the top.
let navScrollTicking = false;
function updateNavScrollState() {
  document.body.classList.toggle('scrolled', window.scrollY > 12);
  navScrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!navScrollTicking) {
    window.requestAnimationFrame(updateNavScrollState);
    navScrollTicking = true;
  }
}, { passive: true });
updateNavScrollState();

// Register the service worker for offline access and faster repeat visits.
// If a newer service worker takes over (a fresh deploy), reload automatically
// so nobody is stuck looking at a stale cached version of the site.
if ('serviceWorker' in navigator) {
  let hasReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Understand / Heal / Grow: the first ring fills, a line draws down to the
// next ring, and that ring fills right as the line reaches it — repeating
// down the list. Ring positions are measured (not hardcoded) so it stays
// accurate regardless of how the description text wraps.
(() => {
  const track = document.querySelector('.hero-triad');
  if (!track) return;

  const rings = track.querySelectorAll('.triad-ring');
  if (rings.length < 2) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rings.forEach((ring) => ring.classList.add('filled'));
    return;
  }

  const line = document.createElement('span');
  line.className = 'triad-line';
  track.insertBefore(line, track.firstChild);

  const LINE_DURATION = 1400;

  function measure() {
    const trackTop = track.getBoundingClientRect().top;
    const firstRect = rings[0].getBoundingClientRect();
    const lastRect = rings[rings.length - 1].getBoundingClientRect();
    const top = firstRect.top - trackTop + firstRect.height / 2;
    const bottom = lastRect.top - trackTop + lastRect.height / 2;
    const span = bottom - top;

    line.style.top = `${top}px`;
    line.style.height = `${Math.max(span, 0)}px`;

    return { trackTop, top, span };
  }

  function play() {
    const { trackTop, top, span } = measure();

    rings.forEach((ring, i) => {
      if (i === 0) {
        ring.classList.add('filled');
        return;
      }
      const ringRect = ring.getBoundingClientRect();
      const ringCenter = ringRect.top - trackTop + ringRect.height / 2;
      const fraction = span > 0 ? (ringCenter - top) / span : 1;
      const delay = Math.max(0, fraction * LINE_DURATION);
      setTimeout(() => ring.classList.add('filled'), delay);
    });

    line.classList.add('grow');
  }

  measure();
  // Wait for the hero's own fade-up entrance to settle before starting.
  setTimeout(play, 1300);
  // Keep the line correctly positioned on resize, without replaying the fill sequence.
  window.addEventListener('resize', measure);
})();
