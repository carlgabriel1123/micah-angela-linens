/*
  Motion: smooth scrolling, headline reveals, the moving ribbon, the pinned
  hospital bed, cursor effects. All of it is polish: without GSAP, or for
  visitors who ask for less motion, the page shows its final state.
*/

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function nativeApi(reduce) {
  return {
    lenis: null,
    scrollTo(target) {
      const el = typeof target === 'string' ? $(target) : target;
      el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    },
    scrollTop() {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    },
    stop() {},
    start() {},
    revealAllCards() {},
  };
}

function watchHeader(onScroll) {
  const header = $('[data-header]');
  if (!header) return;
  let lastY = window.scrollY;
  const update = (y, dir) => {
    header.classList.toggle('is-scrolled', y > 8);
    const dialogOpen = !!document.querySelector('dialog[open]');
    if (dir > 0 && y > 160 && !dialogOpen) header.classList.add('is-hidden');
    else if (dir < 0 || y <= 160) header.classList.remove('is-hidden');
    onScroll && onScroll(y);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      update(y, Math.sign(y - lastY));
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
  update(lastY, 0);
}

/**
 * @param {{ reduce: boolean, onBedStep?: (n: string|null) => void, onScroll?: (y: number) => void }} opts
 */
export function initMotion({ reduce, onBedStep, onScroll }) {
  const root = document.documentElement;
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;

  watchHeader(onScroll);

  if (!gsap || !ScrollTrigger || reduce) {
    root.classList.add('no-motion');
    return nativeApi(reduce);
  }

  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);
  if (window.Flip) gsap.registerPlugin(window.Flip);

  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Hero intro: header drops in, headline lines rise, the linen panel opens. */
  function heroIntro() {
    const title = $('[data-hero-title]');
    const fades = $$('[data-hero-fade]');
    const hero = $('.hero');
    const media = $('[data-hero-media]');
    const img = $('[data-hero-img]');
    const header = $('[data-header]');

    // The linen photo settles in right away, then drifts slowly like fabric
    // in a breeze, and moves a little slower than the page on scroll.
    if (img) {
      gsap.to(img, { scale: 1.06, duration: 2.8, ease: 'expo.out' });
      gsap.to(img, { xPercent: -2.5, yPercent: -1.5, rotation: 0.4, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.2 });
    }
    if (hero && media) {
      gsap.to(media, { yPercent: 16, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-copy', { yPercent: -12, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    const run = () => {
      gsap.from(header, { yPercent: -100, duration: 0.9, ease: 'expo.out' });
      if (title) {
        gsap.set(title, { autoAlpha: 1 });
        if (SplitText) {
          SplitText.create(title, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, { yPercent: 115, duration: 1.25, ease: 'expo.out', stagger: 0.1, delay: 0.1 });
            },
          });
        } else {
          gsap.from(title, { y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out' });
        }
      }
      gsap.from(fades, { y: 26, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.09, delay: 0.35 });
    };
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(run);
  }

  /* Section headings rise line by line as they enter. */
  function headings() {
    $$('[data-split]').forEach((el) => {
      const trigger = { trigger: el, start: 'top 88%', once: true };
      if (SplitText) {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: trigger });
          },
        });
      } else {
        gsap.from(el, { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: trigger });
      }
    });
    $$('.section-head .label, .section-note, .bed-copy > .label, .about-copy > .label, .inquire .label').forEach((el) => {
      gsap.from(el, { y: 16, autoAlpha: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }

  /* The ribbon loops forever and speeds up while you scroll. */
  let ribbonLoop = null;
  function ribbon() {
    const track = $('[data-marquee]');
    if (!track) return;
    ribbonLoop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 42, repeat: -1 });
    ScrollTrigger.create({
      onUpdate(self) {
        if (ribbonLoop.paused()) return;
        const v = Math.abs(self.getVelocity());
        if (v < 30) return;
        gsap.to(ribbonLoop, {
          timeScale: 1 + Math.min(v / 220, 7),
          duration: 0.2,
          overwrite: true,
          onComplete: () => gsap.to(ribbonLoop, { timeScale: 1, duration: 1.4, ease: 'power2.out' }),
        });
      },
    });
    const toggle = $('[data-marquee-toggle]');
    toggle?.addEventListener('click', () => {
      const paused = !ribbonLoop.paused();
      ribbonLoop.paused(paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Play the moving list' : 'Pause the moving list');
      toggle.innerHTML = `<svg aria-hidden="true"><use href="#${paused ? 'i-play' : 'i-pause'}"/></svg>`;
    });
  }

  function bento() {
    const wrap = $('[data-bento]');
    if (!wrap) return;
    gsap.from($$('.tile', wrap), {
      y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09,
      scrollTrigger: { trigger: wrap, start: 'top 82%', once: true },
    });
  }

  /* Product cards fade up in batches the first time they appear. */
  let cardsRevealed = false;
  const cardTriggers = [];
  function cards() {
    const visible = $$('.card:not([hidden])');
    gsap.set(visible, { autoAlpha: 0, y: 40 });
    cardTriggers.push(...ScrollTrigger.batch(visible, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07 }),
    }));
  }
  function revealAllCards() {
    if (cardsRevealed) return;
    cardsRevealed = true;
    cardTriggers.forEach((t) => t.kill());
    gsap.set('.card', { autoAlpha: 1, y: 0 });
  }

  /* Hospital bed: layers drop onto the bed in dressing order as you scroll. */
  function bed() {
    const stage = $('[data-bed-stage]');
    const svg = $('.bed-svg');
    if (!stage || !svg) return;
    const layers = $$('.layer', svg);
    const pins = layers.map((l) => $('.pin', l));
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px) and (min-height: 820px)', () => {
      gsap.set(layers, { y: -90, autoAlpha: 0 });
      gsap.set(pins, { scale: 0, transformOrigin: '50% 50%' });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'center center',
          end: '+=140%',
          pin: true,
          scrub: 0.6,
          onUpdate(self) {
            const step = Math.min(6, Math.max(1, Math.ceil(self.progress * 6.4)));
            onBedStep && onBedStep(self.progress > 0.02 && self.progress < 0.995 ? String(step) : null);
          },
          onLeave: () => onBedStep && onBedStep(null),
          onLeaveBack: () => onBedStep && onBedStep(null),
        },
      });
      layers.forEach((layer, i) => {
        tl.to(layer, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out' }, i)
          .to(pins[i], { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, i + 0.55);
      });
      tl.to({}, { duration: 0.6 });
    });

    mm.add('(max-width: 1023px), (max-height: 819px)', () => {
      gsap.set(layers, { y: -70, autoAlpha: 0 });
      gsap.set(pins, { scale: 0, transformOrigin: '50% 50%' });
      const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 75%', once: true } });
      layers.forEach((layer, i) => {
        tl.to(layer, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out' }, i * 0.14)
          .to(pins[i], { scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, i * 0.14 + 0.35);
      });
    });
  }

  /* Beyond linens: a photo follows the cursor across the list. */
  function beyondHover() {
    const list = $('[data-beyond-list]');
    const preview = $('[data-hover-preview]');
    const img = $('[data-hover-img]');
    if (!list || !preview || !img || !fine) return;
    gsap.set(preview, { autoAlpha: 0, scale: 0.8 });
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
    let shown = false;
    list.addEventListener('mousemove', (e) => {
      const flip = e.clientX > window.innerWidth * 0.6;
      xTo(e.clientX + (flip ? -170 : 170));
      yTo(e.clientY);
    });
    $$('.beyond-row', list).forEach((row) => {
      row.addEventListener('mouseenter', (e) => {
        if (row.dataset.preview && img.getAttribute('src') !== row.dataset.preview) img.setAttribute('src', row.dataset.preview);
        if (!shown) {
          shown = true;
          const flip = e.clientX > window.innerWidth * 0.6;
          gsap.set(preview, { x: e.clientX + (flip ? -170 : 170), y: e.clientY });
          gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
        }
        gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 0.7, ease: 'power3.out', overwrite: true });
      });
    });
    list.addEventListener('mouseleave', () => {
      shown = false;
      gsap.to(preview, { autoAlpha: 0, scale: 0.8, duration: 0.3, ease: 'power2.out' });
    });
    gsap.from($$('.beyond-row', list), {
      y: 30, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: list, start: 'top 85%', once: true },
    });
  }

  function steps() {
    const wrap = $('[data-steps]');
    if (!wrap) return;
    gsap.fromTo('[data-steps-fill]', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top 80%', end: 'top 30%', scrub: 0.6 },
    });
    gsap.from($$('[data-step]', wrap), {
      y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: wrap, start: 'top 82%', once: true },
    });
  }

  function about() {
    const media = $('[data-clip-reveal]');
    if (media) {
      const st = { trigger: media, start: 'top 92%', end: 'top 35%', scrub: 0.6 };
      gsap.fromTo(media, { clipPath: 'inset(14% 12% 14% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: st });
      const img = $('img', media);
      if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: st });
    }
    const facts = $$('.facts li');
    if (facts.length) {
      gsap.from(facts, { x: -24, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: facts[0], start: 'top 90%', once: true } });
    }
    const form = $('[data-inquiry-form]');
    if (form) gsap.from(form, { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: form, start: 'top 88%', once: true } });
  }

  function wordmark() {
    const el = $('[data-wordmark]');
    if (!el || !SplitText) return;
    SplitText.create(el, {
      type: 'chars',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.chars, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 98%', once: true } });
      },
    });
  }

  function magnetic() {
    if (!fine) return;
    $$('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      btn.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* Highlight the nav link for the section in view. */
  function scrollSpy() {
    $$('.nav-link').forEach((link) => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => link.classList.toggle('is-active', self.isActive),
      });
    });
  }

  heroIntro();
  headings();
  ribbon();
  bento();
  cards();
  bed();
  beyondHover();
  steps();
  about();
  wordmark();
  magnetic();
  scrollSpy();

  window.addEventListener('load', () => ScrollTrigger.refresh());

  return {
    lenis,
    scrollTo(target) {
      const el = typeof target === 'string' ? $(target) : target;
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.3 });
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    scrollTop() {
      if (lenis) lenis.scrollTo(0, { duration: 1.3 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    stop() {
      lenis && lenis.stop();
    },
    start() {
      lenis && lenis.start();
    },
    revealAllCards,
  };
}
