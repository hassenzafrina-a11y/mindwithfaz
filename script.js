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
// If a newer service worker REPLACES one that was already controlling this
// page (a fresh deploy landing while the site is open), reload automatically
// so nobody is stuck looking at a stale cached version. `controllerchange`
// also fires the very first time any service worker takes control of a page
// (e.g. on a normal refresh with no prior controller) — that's not a stale-
// content situation, so only reload when a controller is being swapped out,
// not when one is attaching for the first time.
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let hasReloaded = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Hero headline: a slow, breath-paced typewriter reveal, not a fast/
// mechanical one. Characters are pre-laid-out as spans (so nothing reflows
// or jumps as they appear) and revealed with a gentle per-character delay
// plus extra pauses at punctuation, like someone speaking calmly rather
// than text being dumped on screen.
(() => {
  const h1 = document.querySelector('.hero h1');
  if (!h1) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sourceHTML = h1.innerHTML.trim();
  const segments = [];
  const segmentRe = /<em>(.*?)<\/em>|([^<]+)/g;
  let match;
  while ((match = segmentRe.exec(sourceHTML))) {
    if (match[1] !== undefined) segments.push({ text: match[1], em: true });
    else if (match[2] !== undefined) segments.push({ text: match[2], em: false });
  }

  h1.innerHTML = '';
  const chars = [];

  segments.forEach((segment) => {
    const parent = segment.em ? document.createElement('em') : h1;
    if (segment.em) h1.appendChild(parent);
    Array.from(segment.text).forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      parent.appendChild(span);
      chars.push({ span, ch });
    });
  });

  const BASE_DELAY_MS = 40;
  const JITTER_MS = 20;
  const PAUSE_PERIOD_MS = 380;
  const PAUSE_COMMA_MS = 200;
  const PAUSE_SPACE_MS = 25;

  let t = 300; // initial pause before typing begins
  chars.forEach(({ span, ch }) => {
    span.style.transitionDelay = `${t}ms`;

    if (ch === '.' || ch === '!' || ch === '?') t += BASE_DELAY_MS + PAUSE_PERIOD_MS;
    else if (ch === ',') t += BASE_DELAY_MS + PAUSE_COMMA_MS;
    else if (ch === ' ') t += BASE_DELAY_MS + PAUSE_SPACE_MS;
    else t += BASE_DELAY_MS + Math.random() * JITTER_MS;
  });

  requestAnimationFrame(() => h1.classList.add('typing'));
})();

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
    const RING_FILL_TRANSITION_MS = 350; // matches .triad-ring's own CSS transition

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

      // Once the last ring (Grow) has actually finished filling, reveal
      // whatever section is waiting on that moment.
      if (i === rings.length - 1) {
        const nextBlock = document.getElementById('after-triad');
        if (nextBlock) {
          setTimeout(() => nextBlock.classList.add('in-view'), delay + RING_FILL_TRANSITION_MS);
        }
      }
    });

    line.classList.add('grow');
  }

  measure();
  // Wait for the hero's own fade-up entrance to settle before starting.
  setTimeout(play, 7800);
  // Keep the line correctly positioned on resize, without replaying the fill sequence.
  window.addEventListener('resize', measure);
})();
