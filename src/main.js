import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { experience } from './experience.js';
import { testimonials } from './testimonials.js';
import { services } from './services.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = window.matchMedia('(min-width: 721px)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let animDead = false;
let menuOpen = false;

/* ================= SMOOTH SCROLL ================= */
let lenis = null;
const lenisRaf = (time) => lenis?.raf(time * 1000);
if (!prefersReduced) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(lenisRaf);
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
}

/* ================= JOURNEY TIMELINE ================= */
// Rendered from src/experience.js. Active states use IntersectionObserver and
// the progress bar uses plain scroll math — no GSAP dependency, so this
// section stays fully functional even when animations are unavailable.
const journeyList = document.getElementById('journeyList');
if (journeyList) {
  journeyList.innerHTML = experience.map((e) => `
    <li class="jentry">
      <span class="jentry__marker" aria-hidden="true"></span>
      <p class="jentry__company">${e.company} — ${e.role}</p>
      <p class="jentry__meta">${e.meta}</p>
      <h3 class="jentry__headline">${e.headline}</h3>
      <p class="jentry__text">${e.text}</p>
    </li>`).join('');

  const entries = Array.from(journeyList.querySelectorAll('.jentry'));
  const markers = entries.map((e) => e.querySelector('.jentry__marker'));
  const fill = document.getElementById('journeyFill');
  const bar = document.getElementById('journeyBar');
  const rail = journeyList.parentElement; // .journey__rail
  const orb = rail.querySelector('.journey__orb');
  const lastEntry = entries[entries.length - 1];
  function updateJourney() {
    const rect = journeyList.getBoundingClientRect();
    const center = window.innerHeight * 0.5;

    // Progress bar: 100% when the viewport center reaches the final entry.
    const denom = Math.max(1, rect.height - lastEntry.offsetHeight * 0.5);
    const p = Math.min(1, Math.max(0, (center - rect.top) / denom));
    fill.style.width = `${(p * 100).toFixed(2)}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));

    // Orb rides the FULL line, its vertical position tied to where the viewport
    // centre crosses the timeline — so it keeps travelling past the last marker,
    // down the remaining line. When it nears a node it docks sideways onto the
    // marker (x≈13) and lights it; once it moves past, it slides back onto the
    // line (x≈6.5) and the marker it passed stays lit.
    const railBox = rail.getBoundingClientRect();
    const railTop = railBox.top;
    const inset = 0.6 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const markerY = markers.map((m) => {
      const r = m.getBoundingClientRect();
      return r.top + r.height / 2 - railTop;
    });
    const orbY = Math.min(railBox.height - inset, Math.max(inset, center - railTop));

    let best = 0;
    let bestDist = Infinity;
    markerY.forEach((y, i) => {
      const dist = Math.abs(y - orbY);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });

    const DOCK_ZONE = 18; // px: how close (vertically) before the orb docks
    const docked = bestDist <= DOCK_ZONE;
    if (orb) {
      orb.style.top = `${orbY.toFixed(1)}px`;
      if (docked) {
        const b = markers[best].getBoundingClientRect();
        orb.style.left = `${(b.left + b.width / 2 - railBox.left).toFixed(1)}px`;
      } else {
        orb.style.left = '6.5px';
      }
    }

    // The nearest entry stays readable (is-active); markers light cumulatively
    // (is-lit) — every one the orb has reached stays lit.
    entries.forEach((el, i) => {
      el.classList.toggle('is-active', i === best);
      el.classList.toggle('is-lit', orbY >= markerY[i] - DOCK_ZONE);
    });
  }
  window.addEventListener('scroll', updateJourney, { passive: true });
  window.addEventListener('resize', updateJourney);
  updateJourney();
}

/* ================= RADIAL DIAGRAM ================= */
// Connector layout + signal pulses for the hero's outbound-system diagram.
// Layout math is plain JS (works without GSAP); signals/intro use GSAP.
let drawConnectors = () => gsap.timeline();
let startSignals = () => {};
let highlightMeetings = () => {};

const radial = document.getElementById('radial');
if (radial) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('radialSvg');
  const frame = radial.querySelector('.radial__frame');
  const TEAL = '#2f8f83';
  const AMBER = '#d4943a';

  const conns = Array.from(radial.querySelectorAll('.rmodule')).map((li, i) => {
    const color = i % 2 ? AMBER : TEAL;
    const base = document.createElementNS(svgNS, 'path');
    base.setAttribute('class', 'radial__line');
    const dash = document.createElementNS(svgNS, 'path');
    dash.setAttribute('class', 'radial__dash');
    dash.style.stroke = color;
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('class', 'radial__dot');
    dot.setAttribute('r', '3.2');
    dot.style.fill = color;
    svg.append(base, dash, dot);
    return { li, card: li.querySelector('.rmodule__card'), base, dash, dot, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
  });

  // Keep the Qualified Meetings connector as the hero's primary signal.
  const primaryConn = conns[conns.length - 1];
  primaryConn.base.classList.add('radial__line--primary');
  primaryConn.dash.classList.add('radial__dash--primary');
  primaryConn.dash.style.stroke = ''; // let the CSS class color it
  primaryConn.dot.style.fill = '#d6336c';

  function layoutRadial() {
    if (getComputedStyle(svg).display === 'none') return; // stacked mobile layout
    const rr = radial.getBoundingClientRect();
    if (!rr.width || !rr.height) return;
    svg.setAttribute('viewBox', `0 0 ${rr.width} ${rr.height}`);
    const fr = frame.getBoundingClientRect();
    const hx = fr.left - rr.left + fr.width / 2;
    const hy = fr.top - rr.top + fr.height / 2;
    const hubR = fr.width / 2 + 10;
    conns.forEach((c) => {
      const mr = c.li.getBoundingClientRect();
      const mx = mr.left - rr.left + mr.width / 2;
      const my = mr.top - rr.top + mr.height / 2;
      let dx = mx - hx, dy = my - hy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const sx = hx + dx * hubR, sy = hy + dy * hubR;
      // End the line at the card's edge (tucked 2px under so it visually touches)
      const s = Math.min(
        mr.width / 2 / Math.max(Math.abs(dx), 1e-6),
        mr.height / 2 / Math.max(Math.abs(dy), 1e-6)
      ) - 2;
      const ex = mx - dx * s, ey = my - dy * s;
      const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      c.base.setAttribute('d', d);
      c.dash.setAttribute('d', d);
      c.from = { x: sx, y: sy };
      c.to = { x: ex, y: ey };
      c.dot.setAttribute('cx', sx);
      c.dot.setAttribute('cy', sy);
    });
  }
  layoutRadial();
  window.addEventListener('resize', layoutRadial);
  document.fonts?.ready.then(layoutRadial);

  function flash(card) {
    card.classList.add('is-lit');
    setTimeout(() => card.classList.remove('is-lit'), 480);
  }

  function sendPulse(c, dur, cb) {
    if (prefersReduced || animDead || getComputedStyle(svg).display === 'none') { cb?.(); return; }
    gsap.killTweensOf(c.dot);
    gsap.fromTo(c.dot,
      { attr: { cx: c.from.x, cy: c.from.y }, opacity: 1 },
      {
        attr: { cx: c.to.x, cy: c.to.y },
        duration: dur,
        ease: 'power1.in',
        onComplete: () => {
          gsap.to(c.dot, { opacity: 0, duration: 0.25 });
          flash(c.card);
          cb?.();
        },
      });
  }

  drawConnectors = () => {
    const tl = gsap.timeline();
    conns.forEach((c, i) => {
      const len = c.base.getTotalLength() || 1;
      tl.fromTo(c.base,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' },
        i * 0.06);
      tl.from(c.dash, { opacity: 0, duration: 0.4, clearProps: 'opacity' }, i * 0.06 + 0.25);
    });
    return tl;
  };

  startSignals = () => {
    if (prefersReduced || animDead) return;
    conns.forEach((c, i) => {
      const loop = () => {
        if (animDead) return;
        sendPulse(c, 1.1 + Math.random() * 0.9, () => {
          gsap.delayedCall(1.6 + Math.random() * 3.4, loop);
        });
      };
      gsap.delayedCall(0.35 * i + Math.random() * 0.8, loop);
    });
  };

  highlightMeetings = () => {
    const c = conns[conns.length - 1];
    flash(c.card);
    if (!prefersReduced && !animDead) {
      gsap.fromTo(c.card, { scale: 1 }, {
        scale: 1.04, duration: 0.28, yoyo: true, repeat: 1,
        ease: 'power2.inOut', clearProps: 'transform',
      });
    }
  };

  // Hover / focus / tap interaction
  conns.forEach((c) => {
    const on = () => {
      radial.classList.add('is-focus');
      c.card.classList.add('is-hot');
      c.base.classList.add('is-hot');
      c.dash.classList.add('is-hot');
      sendPulse(c, 0.5);
    };
    const off = () => {
      radial.classList.remove('is-focus');
      c.card.classList.remove('is-hot');
      c.base.classList.remove('is-hot');
      c.dash.classList.remove('is-hot');
    };
    c.card.addEventListener('mouseenter', on);
    c.card.addEventListener('mouseleave', off);
    c.card.addEventListener('focus', on);
    c.card.addEventListener('blur', off);
  });

  // As the hero leaves, the secondary connectors recede so the primary
  // outcome remains the visual anchor.
  if (!prefersReduced) {
    const secondary = conns.slice(0, -1).flatMap((c) => [c.base, c.dash]);
    gsap.to(secondary, {
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom 60%',
        scrub: true,
      },
    });
  }
}

/* ================= THREE.JS HERO ================= */
const miniCanvases = document.querySelectorAll('[data-mininet]');
if (miniCanvases.length) {
  // Lazy chunk: Three.js loads in parallel, never blocks first paint.
  import('./network.js')
    .then(({ createNetwork }) => {
      miniCanvases.forEach((c) => createNetwork(c, {
        count: 34,
        linkDist: 6,
        pointSize: 0.14,
        lineOpacity: 0.12,
        nodeOpacity: 0.6,
        parallax: false,
      }));
    })
    .catch((e) => console.warn('WebGL unavailable, network canvases skipped', e));
}

/* ================= PRELOADER ================= */
const preloader = document.getElementById('preloader');
const countEl = document.getElementById('preloaderCount');
const barEl = document.getElementById('preloaderBar');

function runIntro() {
  const introTl = gsap.timeline();

  introTl
    .to(preloader, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' })
    .set(preloader, { display: 'none' })
    .from('.hero__title', {
      autoAlpha: 0, y: 26, scale: 0.97,
      duration: 0.6, ease: 'power3.out', clearProps: 'all',
    }, '-=0.3')
    .from('.hero__desc', {
      autoAlpha: 0, y: 18, duration: 0.45, ease: 'power3.out', clearProps: 'all',
    }, '-=0.35')
    .from('.hero__ctas .btn', {
      autoAlpha: 0, y: 14, duration: 0.4, stagger: 0.07, ease: 'power3.out', clearProps: 'all',
    }, '-=0.28')
    .from('.radial__hub', {
      autoAlpha: 0, scale: 0.82, duration: 0.55, ease: 'back.out(1.5)', clearProps: 'all',
    }, '-=0.2')
    // Cards reveal alongside the hub so the lines draw toward modules that are
    // already present — snappy stagger keeps them from trailing the diagram.
    .from('.rmodule__card', {
      autoAlpha: 0, y: 12, scale: 0.96,
      duration: 0.4, stagger: 0.045, ease: 'power3.out', clearProps: 'all',
    }, '-=0.35')
    .add(drawConnectors(), '-=0.2')
    .call(() => { startSignals(); highlightMeetings(); })
    .from('.nav', {
      yPercent: -120, duration: 0.6, ease: 'power3.out',
    }, '-=0.5');
}

let introStarted = false;
function skipIntro() {
  if (introStarted) return;
  introStarted = true;
  gsap.killTweensOf([preloader, '.preloader__word', barEl]);
  preloader.style.display = 'none';
}

if (prefersReduced) {
  skipIntro();
} else {
  // Safety: if rAF is throttled (hidden/background tab), never trap the
  // visitor behind the preloader.
  setTimeout(() => {
    if (document.visibilityState === 'hidden') skipIntro();
  }, 3500);
  setTimeout(skipIntro, 6000);
  const loadTl = gsap.timeline({ onComplete: () => {
    if (introStarted) return;
    introStarted = true;
    runIntro();
  } });
  const counter = { v: 0 };
  loadTl
    .to('.preloader__word', {
      y: 0,
      yPercent: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power4.out',
      startAt: { yPercent: 110 },
    })
    .to(counter, {
      v: 100,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = Math.round(counter.v); },
    }, '<')
    .to(barEl, { width: '100%', duration: 1.4, ease: 'power2.inOut' }, '<');
}

/* ================= CUSTOM CURSOR ================= */
const cursor = document.getElementById('cursor');
if (cursor && hasFinePointer && !prefersReduced) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power2.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power2.out' });
  window.addEventListener('pointermove', (e) => {
    cursor.classList.add('is-active');
    xTo(e.clientX);
    yTo(e.clientY);
  }, { passive: true });
  document.querySelectorAll('[data-cursor="hover"], a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });
}

/* ================= NAV: hide on scroll down ================= */
const nav = document.getElementById('nav');
let lastScroll = 0;
let navHidden = false;
function setNavHidden(hide) {
  if (navHidden === hide) return;
  navHidden = hide;
  document.documentElement.classList.toggle('nav-hidden', hide);
  gsap.to(nav, { yPercent: hide ? -120 : 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
}
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle('is-scrolled', y > 40);
    setNavHidden(y > 140 && y > lastScroll && !menuOpen);
    lastScroll = y;
  },
});

/* ================= MOBILE MENU ================= */
const burger = document.getElementById('burger');
const menu = document.getElementById('mobileMenu');
const menuTl = gsap.timeline({ paused: true })
  .set(menu, { visibility: 'visible' })
  .to(menu, { clipPath: 'inset(0% 0 0% 0)', duration: 0.65, ease: 'power4.inOut' })
  .from('.menu__link', { yPercent: 60, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' }, '-=0.25')
  .from('.menu__foot a', { autoAlpha: 0, y: 14, stagger: 0.05, duration: 0.35 }, '-=0.3');

gsap.set(menu, { clipPath: 'inset(0 0 100% 0)' });

function toggleMenu(force) {
  menuOpen = typeof force === 'boolean' ? force : !menuOpen;
  burger.setAttribute('aria-expanded', String(menuOpen));
  menu.setAttribute('aria-hidden', String(!menuOpen));
  menu.classList.toggle('is-open', menuOpen); // .anim-dead CSS fallback hook
  if (animDead) return;
  if (menuOpen) { menuTl.timeScale(1).play(); lenis?.stop(); }
  else { menuTl.timeScale(1.6).reverse(); lenis?.start(); }
}
burger.addEventListener('click', () => toggleMenu());
menu.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMenu(false);
    setTimeout(() => scrollToTarget(a.getAttribute('href')), 450);
  });
});

/* ================= ANCHOR SCROLL (desktop nav + hero cta) ================= */
document.querySelectorAll('.nav__links a, .hero__ctas a').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (href?.startsWith('#')) { e.preventDefault(); scrollToTarget(href); }
  });
});
document.getElementById('toTop')?.addEventListener('click', () => scrollToTarget('#top'));
document.querySelector('.nav__logo')?.addEventListener('click', (e) => {
  e.preventDefault(); scrollToTarget('#top');
});

/* ================= MARQUEES ================= */
if (!prefersReduced) {
  document.querySelectorAll('[data-marquee]').forEach((track) => {
    const dir = Number(track.dataset.direction || 1);
    // Forward: 0 → -50 (half the duplicated track). Reverse: -50 → 0.
    const tween = gsap.fromTo(track,
      { xPercent: dir === -1 ? -50 : 0 },
      { xPercent: dir === -1 ? 0 : -50, repeat: -1, duration: 22, ease: 'none' });
    // Scroll velocity nudges marquee speed
    ScrollTrigger.create({
      trigger: track.closest('.marquee'),
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = Math.abs(self.getVelocity()) / 3000;
        gsap.to(tween, { timeScale: 1 + Math.min(v, 2.2), duration: 0.4, overwrite: true });
      },
    });
  });
}

/* ================= SECTION HEAD REVEALS ================= */
gsap.utils.toArray('.section-head__title').forEach((title) => {
  if (prefersReduced) return;
  const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
  gsap.from(split.lines, {
    yPercent: 110,
    duration: 1,
    stagger: 0.08,
    ease: 'power4.out',
    scrollTrigger: { trigger: title, start: 'top 85%' },
  });
});

/* ================= GENERIC REVEALS ================= */
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  if (prefersReduced) return;
  if (el.closest('.hero')) return; // hero handled in intro
  gsap.from(el, {
    autoAlpha: 0,
    y: 30,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});

/* ================= STAT COUNTERS ================= */
gsap.utils.toArray('[data-stat]').forEach((stat, i) => {
  const numEl = stat.querySelector('[data-count]');
  const target = Number(numEl.dataset.count);
  if (prefersReduced) { numEl.textContent = target.toLocaleString('en-US'); return; }
  gsap.from(stat, {
    autoAlpha: 0,
    y: 40,
    duration: 0.8,
    delay: (i % 4) * 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: stat, start: 'top 88%' },
  });
  const counter = { v: 0 };
  gsap.to(counter, {
    v: target,
    duration: 1.8,
    delay: (i % 4) * 0.08,
    ease: 'power2.out',
    scrollTrigger: { trigger: stat, start: 'top 88%' },
    onUpdate: () => { numEl.textContent = Math.round(counter.v).toLocaleString('en-US'); },
  });
});

/* ================= TESTIMONIAL MARQUEE ROWS ================= */
// "Proof, not promises": two rows of testimonial cards rendered from
// src/testimonials.js. Top row drifts left, bottom row drifts right;
// hovering a row pauses only that row. Edge fading comes from a CSS mask.
const tRows = document.querySelectorAll('[data-trow]');
if (tRows.length) {
  const cardHTML = (t) => `
    <article class="tcard">
      <p class="tcard__quote">“${t.quote}”</p>
      <footer class="tcard__foot">
        <strong class="tcard__name">${t.name}</strong>
        <span class="tcard__handle">${t.handle}</span>
      </footer>
    </article>`;

  tRows.forEach((row, ri) => {
    const items = ri % 2 ? [...testimonials].reverse() : testimonials;
    const half = items.map(cardHTML).join('');
    const track = document.createElement('div');
    track.className = 'tmarquee__track';
    track.innerHTML = half + half; // duplicated for a seamless loop
    row.appendChild(track);

    if (prefersReduced) return;
    const dir = row.dataset.trow === 'right' ? -1 : 1;
    const tween = gsap.fromTo(track,
      { xPercent: dir === -1 ? -50 : 0 },
      { xPercent: dir === -1 ? 0 : -50, repeat: -1, duration: 42, ease: 'none' });
    // Pause only this row on hover; the other keeps moving.
    row.addEventListener('pointerenter', () => gsap.to(tween, { timeScale: 0, duration: 0.35, overwrite: true }));
    row.addEventListener('pointerleave', () => gsap.to(tween, { timeScale: 1, duration: 0.5, overwrite: true }));
  });

  if (!prefersReduced) {
    gsap.from(tRows, {
      autoAlpha: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.cases__rows', start: 'top 88%' },
    });
  }
}

/* ================= SERVICES (data-driven beats) ================= */
// Rendered from src/services.js into the cinema panels. Runs unconditionally
// so the beats exist for both the scroll choreography (below) and the static
// reduced-motion fallback (handled in CSS).
const servicesPanels = document.getElementById('servicesPanels');
if (servicesPanels) {
  servicesPanels.insertAdjacentHTML('beforeend', services.map((s, i) => `
    <article class="service-beat service-beat--${s.side}" data-service-beat="${i + 1}">
      <div class="service-beat__card">
        <span class="service-beat__num">${s.num}</span>
        <p class="service-beat__tag">${s.tag}</p>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
      </div>
    </article>`).join(''));
}

if (!prefersReduced) {
  const servicesCinema = document.getElementById('servicesCinema');
  if (servicesCinema) {
    const serviceMedia = document.getElementById('servicesMedia');
    const serviceShade = document.getElementById('servicesShade');
    const serviceImages = gsap.utils.toArray('[data-service-image]');
    const serviceCards = gsap.utils.toArray('.service-beat__card');
    const firstServiceCard = serviceCards[0];
    const serviceIntro = document.getElementById('servicesIntroTitle');
    const narrow = () => window.matchMedia('(max-width: 720px)').matches;
    // Flip completes when the card has scrolled up to this fraction of the
    // viewport (0.35 = 35% from the top). Tweak to re-time the flip vs. text.
    const FLIP_END = 'top 35%';
    const FLIP_START = 'top 80%';

    const serviceDock = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (narrow()) {
        return {
          top: vh * 0.1,
          left: vw * 0.08,
          width: vw * 0.84,
          height: Math.min(vh * 0.34, vw * 0.78),
          borderRadius: 22,
        };
      }
      const size = Math.min(vw * 0.34, vh * 0.64);
      return {
        top: (vh - size) / 2,
        left: vw * 0.58,
        width: size,
        height: size,
        borderRadius: 28,
      };
    };

    gsap.set(serviceImages, { autoAlpha: 0, scale: 1.04, zIndex: 0 });
    gsap.set(serviceImages[0], { autoAlpha: 1, scale: 1.035, zIndex: 1 });
    if (firstServiceCard) gsap.set(firstServiceCard, { autoAlpha: 0, y: 42, scale: 0.97 });
    gsap.set(serviceMedia, {
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      rotationY: 0,
      transformPerspective: 1600,
      borderRadius: 0,
      transformOrigin: '50% 50%',
    });

    const servicesTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: servicesCinema,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        // Only promote the animated layers to their own compositor layer while
        // the section is actually being scrubbed (see .is-live in style.css),
        // instead of leaving will-change on for the life of the page.
        onToggle: (self) => servicesCinema.classList.toggle('is-live', self.isActive),
      },
    });
    servicesTl
      .to(serviceIntro, { autoAlpha: 0, y: -42, duration: 0.42 }, 0.38)
      .to(serviceMedia, {
        top: () => serviceDock().top,
        left: () => serviceDock().left,
        width: () => serviceDock().width,
        height: () => serviceDock().height,
        borderRadius: () => serviceDock().borderRadius,
        duration: 0.95,
      }, 0.12)
      .to(serviceShade, { opacity: 0.44, duration: 0.85 }, 0.24)
      .to(serviceImages[0], { autoAlpha: 0, scale: 1.02, duration: 0.35 }, 0.88)
      .fromTo(serviceImages[1],
        { autoAlpha: 0, scale: 1.08, rotationY: 0, zIndex: 3 },
        { autoAlpha: 1, scale: 1.035, duration: 0.45 },
        0.88)
      .call(() => {
        serviceImages.forEach((img, imageIndex) => {
          img.classList.toggle('is-active', imageIndex === 1);
          gsap.set(img, { autoAlpha: imageIndex === 1 ? 1 : 0, zIndex: imageIndex === 1 ? 1 : 0 });
        });
      }, null, 1.08)
      .set({}, {}, 4.4);

    // Fixed counter-rotations so every service image renders upright at its own
    // rest angle while the shared media plane accumulates 180° per flip
    // (image i rests when the plane is at (i-1)*180°).
    [1, 2, 3, 4].forEach((i) => gsap.set(serviceImages[i], { rotationY: -(i - 1) * 180 }));

    // Scroll-linked image flips for beats 2–4. Each transition rotates the media
    // plane 180° and cross-fades prev → next. Scrubbed, so it tracks scroll
    // exactly (no snap on slow scroll), reverses when you scroll back up, and
    // completes when the card reaches FLIP_END (35% of the viewport).
    // immediateRender:false + a pinned fromTo start keep the rotation continuous
    // across flip boundaries (flip N ends where flip N+1 begins).
    [2, 3, 4].forEach((index) => {
      const prevImg = serviceImages[index - 1];
      const nextImg = serviceImages[index];
      const card = serviceCards[index - 1]; // serviceCards[0] is beat 1's card
      if (!prevImg || !nextImg || !card) return;
      const startRotation = (index - 2) * 180; // image 1 rests at 0°
      const targetRotation = startRotation + 180;

      gsap.timeline({
        defaults: { ease: 'none', immediateRender: false },
        scrollTrigger: {
          trigger: card,
          start: FLIP_START,
          end: FLIP_END,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
        .set(serviceMedia, { transformPerspective: 1600, transformOrigin: '50% 50%' }, 0)
        .fromTo(serviceMedia, { rotationY: startRotation }, { rotationY: targetRotation, duration: 1 }, 0)
        .to(serviceMedia, { z: -70, scale: 0.965, duration: 0.5, ease: 'power2.in' }, 0)
        .to(serviceMedia, { z: 0, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.5)
        .to(prevImg, { autoAlpha: 0, duration: 0.24 }, 0.38)
        .fromTo(nextImg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24 }, 0.38);
    });

    gsap.from(serviceIntro, {
      autoAlpha: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.service-beat--intro', start: 'top 70%' },
    });
    if (firstServiceCard) {
      gsap.to(firstServiceCard, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        delay: 0.18,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: firstServiceCard,
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
      });
    }
    serviceCards.slice(1).forEach((card) => {
      gsap.from(card, {
        autoAlpha: 0,
        y: 42,
        scale: 0.97,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 82%' },
      });
    });
  }

}

/* ================= PROCESS: horizontal scroll (desktop) ================= */
const processTrack = document.getElementById('processTrack');
if (processTrack && isDesktop && !prefersReduced) {
  const pin = document.querySelector('.process__pin');
  // Pin the panel (not the inner wrapper): the pin-spacer then lives in the
  // transparent section, so the solid panel keeps its natural content height
  // and the photo stays visible above/below it during the pin.
  const panel = document.querySelector('.process__panel');
  // The track slides within the panel (narrower than the viewport)
  const getScrollAmount = () => -(processTrack.scrollWidth - pin.clientWidth + 2 * 16);
  gsap.to(processTrack, {
    x: getScrollAmount,
    ease: 'none',
    scrollTrigger: {
      trigger: '.process',
      start: 'top top',
      end: () => `+=${Math.abs(getScrollAmount())}`,
      pin: panel,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

} else if (processTrack && !prefersReduced) {
  gsap.utils.toArray('.pcard').forEach((card) => {
    gsap.from(card, {
      autoAlpha: 0,
      y: 46,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 90%' },
    });
  });
}

/* ================= TOOL CARDS ================= */
if (!prefersReduced) {
  const tools = gsap.utils.toArray('[data-tool]');
  if (tools.length) {
    gsap.from(tools, {
      autoAlpha: 0,
      y: 30,
      duration: 0.65,
      stagger: 0.05,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.tools__grid', start: 'top 88%' },
    });
  }
}

/* ================= ABOUT: pipeline media scroll story ================= */
const pipeline = document.getElementById('pipeline');
if (pipeline && !prefersReduced) {
  const media = document.getElementById('pipelineMedia');
  const introImage = media?.querySelector('.pipeline-media__landscape-intro');
  const portraitImage = media?.querySelector('.pipeline-media__portrait');
  const finalImage = media?.querySelector('.pipeline-media__landscape-final');
  const shade = document.getElementById('pipelineShade');
  const name = document.getElementById('pipelineName');
  const introNum = document.getElementById('pipelineIntroNum');
  const bio = document.getElementById('pipelineBio');
  const card = document.getElementById('pipelineCard');
  const aboutText = document.getElementById('aboutText');
  const narrow = () => window.matchMedia('(max-width: 720px)').matches;

  const stage2 = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = narrow() ? Math.min(vw * 0.72, vh * 0.34) : Math.min(vw * 0.34, vh * 0.64);
    return {
      top: narrow() ? vh * 0.57 : (vh - size) / 2,
      left: narrow() ? (vw - size) / 2 : vw * 0.58,
      size,
    };
  };

  const stageCenter = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = Math.min(vw * 0.58, vh * 0.72);
    return {
      top: (vh - size) / 2,
      left: (vw - size) / 2,
      size,
    };
  };

  gsap.set(media, {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    rotationY: 0,
    borderRadius: 0,
    transformOrigin: '50% 50%',
  });
  gsap.set(introImage, { autoAlpha: 1 });
  gsap.set(portraitImage, { autoAlpha: 1 });
  // The final landscape is revealed explicitly at the flip (see below). It stays
  // hidden until then instead of relying on 3D backface culling, which fails once
  // the flipping layer is composited (preserve-3d gets flattened).
  gsap.set(finalImage, { autoAlpha: 0 });
  gsap.set(bio, { autoAlpha: 0, y: 38 });
  gsap.set(card, { autoAlpha: 0, y: 42, scale: 0.96 });
  let aboutWords = [];
  if (aboutText) {
    const aboutSplit = SplitText.create(aboutText, { type: 'words' });
    aboutWords = aboutSplit.words;
    aboutWords.forEach((w) => w.classList.add('word'));
    gsap.set(aboutWords, { color: 'rgba(51, 32, 46, 0.18)' });
  }

  function updateAboutWordColors() {
    if (!aboutWords.length) return;
    const rect = bio.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const start = narrow() ? 0.88 : 0.78;
    const end = narrow() ? 0.42 : 0.45;
    const denom = Math.max(1, vh * (start - end));
    const progress = Math.min(1, Math.max(0, (vh * start - rect.top) / denom));
    const sweep = narrow() ? 0.68 : 0.78;
    const fadeWidth = narrow() ? 0.22 : 0.28;

    aboutWords.forEach((word, i) => {
      const offset = aboutWords.length > 1 ? (i / (aboutWords.length - 1)) * sweep : 0;
      const local = Math.min(1, Math.max(0, (progress - offset) / fadeWidth));
      const alpha = 0.18 + local * 0.82;
      word.style.color = `rgba(51, 32, 46, ${alpha.toFixed(3)})`;
    });
  }

  if (aboutWords.length) {
    document.documentElement.classList.add('manual-about-reveal');
    window.addEventListener('scroll', updateAboutWordColors, { passive: true });
    window.addEventListener('resize', updateAboutWordColors);
    ScrollTrigger.addEventListener('refresh', updateAboutWordColors);
    setInterval(updateAboutWordColors, 80);
    updateAboutWordColors();
  }

  const pipelineTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: pipeline,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  pipelineTl
    .to([name, introNum], { autoAlpha: 0, duration: 0.38 }, 0.12)
    .to(media, {
      top: () => stage2().top,
      left: () => stage2().left,
      width: () => stage2().size,
      height: () => stage2().size,
      borderRadius: 28,
      duration: 1.2,
    }, 0.18)
    .to(shade, { opacity: 0.08, duration: 0.95 }, 0.35)
    .to(introImage, { autoAlpha: 0, duration: 0.35 }, 0.72)
    .to(bio, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.95)
    .to(bio, { autoAlpha: 1, duration: 0.6 }, 1.45)
    .to(bio, { autoAlpha: 0, y: -34, duration: 0.45, ease: 'power3.inOut' }, 2.05)
    .to(media, {
      top: () => stageCenter().top,
      left: () => stageCenter().left,
      width: () => stageCenter().size,
      height: () => stageCenter().size,
      borderRadius: 26,
      rotationY: -90,
      duration: 0.55,
    }, 2.05)
    .to(shade, { opacity: 0.52, duration: 0.45 }, 2.45)
    .to(media, {
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      rotationY: -180,
      borderRadius: 0,
      duration: 0.65,
    }, 2.55)
    // As the card passes edge-on (~-90deg) swap the portrait for the final
    // landscape via opacity. z-index and backface-visibility can't decide this
    // (the preserve-3d context is flattened once the layer is composited), so the
    // handoff is driven explicitly. finalImage keeps its rotateY(180deg) so the
    // container's -180deg flip cancels out and it reads un-mirrored.
    .to(portraitImage, { autoAlpha: 0, duration: 0.2 }, 2.62)
    .to(finalImage, { autoAlpha: 1, duration: 0.2 }, 2.62)
    .to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }, 3.08)
    .set({}, {}, 3.65);

}

/* ================= ABOUT: cinematic scroll story ================= */
// Three beats over one CSS-sticky photo (no ScrollTrigger pinning needed):
// 1. fullscreen photo + big name  2. photo clips into a card docked right
// (bottom on mobile) while the bio reads  3. photo returns fullscreen behind
// the centered facts card. clip-path percentages keep it resize-proof.
const cine = document.getElementById('cine');
if (cine && !prefersReduced) {
  const flip = document.getElementById('cineFlip');
  const faces = flip.querySelectorAll('.cine__face');
  const shade = document.getElementById('cineShade');
  const narrow = () => window.matchMedia('(max-width: 720px)').matches;
  // The whole photo scales down into the docked card (right on desktop,
  // bottom on mobile) — percentages of the sticky stage keep it resize-proof.
  const full = { top: '0%', left: '0%', width: '100%', height: '100%' };
  const dockTop = () => (narrow() ? '52%' : '14%');
  const dockLeft = () => (narrow() ? '4%' : '52%');
  const dockWidth = () => (narrow() ? '92%' : '42%');
  const dockHeight = () => (narrow() ? '42%' : '72%');
  gsap.set(flip, { ...full, rotationY: 0 });

  const beats = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: cine,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
  // 0–100 = the 2 viewport-heights of scroll while the stage is sticky
  beats
    // Beat 1 → 2: fullscreen photo shrinks into the docked card
    .to(flip, { top: dockTop, left: dockLeft, width: dockWidth, height: dockHeight, duration: 30 }, 8)
    .to(faces, { borderRadius: 26, duration: 30 }, 8)
    .to(shade, { opacity: 0.15, duration: 30 }, 8)
    // Beat 2 → 3: the card flips in 3D while growing back to fullscreen,
    // landing on its back face — the second photo
    .to(flip, { rotationY: -180, ...full, duration: 34 }, 58)
    .to(faces, { borderRadius: 0, duration: 34 }, 58)
    .set({}, {}, 100);

  // Big name: scrubbed in as the section arrives, out as beat 2 approaches
  const name = document.getElementById('cineName');
  gsap.fromTo(name,
    { autoAlpha: 0, yPercent: 30 },
    {
      autoAlpha: 1, yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: cine, start: 'top 80%', end: 'top 25%', scrub: true },
    });
  gsap.fromTo(name,
    { autoAlpha: 1, yPercent: 0 },
    {
      autoAlpha: 0, yPercent: -50, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: cine, start: 'top top', end: '+=60%', scrub: true },
    });
}

/* ================= CONTACT REVEAL ================= */
if (!prefersReduced) {
  gsap.from('.contact__big-line', {
    yPercent: 55,
    autoAlpha: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: 'power4.out',
    scrollTrigger: { trigger: '.contact', start: 'top 70%' },
  });
  gsap.from('.contact__links li', {
    autoAlpha: 0,
    y: 26,
    duration: 0.7,
    stagger: 0.07,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.contact__links', start: 'top 92%' },
  });
}

/* ================= MAGNETIC BUTTONS ================= */
if (hasFinePointer && !prefersReduced) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ================= ANIMATION WATCHDOG ================= */
// If the GSAP ticker never advances (throttled/embedded/background contexts),
// scroll-triggered content would stay invisible and interactions would appear
// dead. Detect a stalled ticker and fall back to a fully static, visible page.
// Also triggerable explicitly via ?static=1 for constrained embeds.
function degradeToStatic() {
  if (animDead) return;
  animDead = true;
  document.documentElement.classList.add('anim-dead');
  ScrollTrigger.getAll().forEach((st) => st.kill());
  skipIntro();
  document.querySelectorAll('[data-count]').forEach((el) => {
    el.textContent = Number(el.dataset.count).toLocaleString('en-US');
  });
  gsap.ticker.remove(lenisRaf);
  lenis?.destroy();
  lenis = null;
}
// Keep-alive: GSAP's ticker rAF loop can silently stall (its internal active
// flag stays set, so new tweens never wake it). setInterval survives rAF
// death — if the frame counter stops advancing while visible, nudge it awake.
if (!prefersReduced) {
  let lastTickerFrame = -1;
  setInterval(() => {
    if (animDead || document.visibilityState !== 'visible') return;
    if (gsap.ticker.frame === lastTickerFrame) gsap.ticker.wake();
    lastTickerFrame = gsap.ticker.frame;
  }, 500);
}

if (new URLSearchParams(location.search).has('static')) {
  degradeToStatic();
} else if (!prefersReduced) {
  let ticks = 0;
  const countTick = () => { ticks++; };
  gsap.ticker.add(countTick);
  setTimeout(() => {
    gsap.ticker.remove(countTick);
    if (ticks < 5) degradeToStatic();
  }, 1800);
}

/* ================= MANILA CLOCK ================= */
const timeEl = document.getElementById('manilaTime');
const noteEl = document.getElementById('manilaNote');
if (timeEl) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const hourFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', hour: 'numeric', hour12: false,
  });
  function tickClock() {
    const now = new Date();
    timeEl.textContent = fmt.format(now);
    const h = Number(hourFmt.format(now));
    noteEl.textContent = (h >= 7 && h < 22) ? 'probably online right now' : 'replies by your morning';
  }
  tickClock();
  setInterval(tickClock, 30000);
}

/* ================= FONT-READY REFRESH ================= */
document.fonts?.ready.then(() => ScrollTrigger.refresh());
