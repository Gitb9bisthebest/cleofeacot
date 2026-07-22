# Cleofe Acot — Portfolio

Awwwards-style portfolio for **Cleofe Torres Acot**, Lead Generation & Appointment Setting Specialist. Built with vanilla HTML/CSS/JS on Vite, animated with GSAP (ScrollTrigger + SplitText) and Lenis smooth scroll. Light feminine palette (cream / blush / rose), portrait-led hero with a subtle Three.js particle network, plus smaller particle accents in the stats and contact sections. Portrait lives at `public/cleofe.jpg` (optimized from `heroImage.png`).

## Run it

```bash
npm install
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## Structure

| File | What it does |
|---|---|
| `index.html` | All content/sections (hero, stats, services, process, toolbox, about, contact) |
| `src/style.css` | Design system (dark editorial theme, acid-lime accent, responsive + reduced-motion) |
| `src/main.js` | Preloader, smooth scroll, scroll choreography, accordion, mobile menu, magnetic buttons, custom cursor |
| `src/network.js` | Three.js particle network (lazy-loaded chunk; pauses offscreen; static frame under reduced motion) |
| `scripts/shoot.mjs` | Headless-Chrome screenshot sweep (desktop + mobile) for visual QA |
| `scripts/interact.mjs` | Headless interaction tests (accordion, mobile menu, reduced-motion) |

QA scripts need the dev server running: `node scripts/shoot.mjs <output-dir>`.

## ⚠️ Placeholder content to replace

Search `index.html` for `PLACEHOLDER CONTENT` — two blocks are sample data awaiting Cleofe's real input:

1. **Testimonials** (`src/testimonials.js`, rendered in the "Proof, not promises" section as two auto-scrolling rows): all six names, handles, and quotes are invented. Replace with real client quotes (her Upwork / OnlineJobs reviews are a good source). Each array entry is one card; both rows re-render automatically.
2. **Personal note** (`.about__note` in the About section): swap in a line in her actual voice + preferred sign-off.
3. **Career timeline** (`src/experience.js` + the summary paragraph in the `.journey` section): all five entries (companies, roles, dates, stories) are invented. Edit the array — each object is one timeline entry, ordered oldest → newest; the section re-renders automatically.

The footer Manila clock is real (live `Asia/Manila` time; the tagline switches between "probably online right now" (7:00–21:59 PH time) and "replies by your morning").

## Content sources

All copy, metrics, tools, industries, and profile links come from `CLEOFE.docx` (Upwork, LinkedIn, OnlineJobs.ph, Facebook). To change the primary CTA target, edit the `Book a call` / `LET'S talk` hrefs in `index.html`.

## Accessibility & performance notes

- `prefers-reduced-motion` disables all animation; content renders fully visible.
- Keyboard focus rings, 44px touch targets, semantic landmarks, aria states on the menu.
- Three.js is code-split (~55 kB gzip critical JS), capped pixel ratio, fewer particles on mobile, rendering pauses when the hero leaves the viewport.
