# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A web presentation about the 2009 L'Aquila earthquake (`index.html`), written in Italian. Designed as a school presentation (anno scolastico 2025–2026). No build system, no package manager — open the file directly in a browser.

## Running / Developing

```
# Open in browser — any of these work:
start index.html          # Windows default browser
# Or use a local server to avoid CORS issues with canvas fonts:
npx serve .
python -m http.server 8080
```

External CDN dependencies (internet required):
- **Leaflet.js** — also bundled locally at `lib/leaflet.js` + `lib/leaflet.css` (used for INGV map and s5 pericolosità map)
- **Google Fonts** — `Cormorant Garamond` and `JetBrains Mono`

## Architecture

`index.html` (~3640 lines) contains all HTML structure, with CSS and JS loaded as external files. Inline `<link>` and `<script>` tags are placed immediately before the section that needs them (not in `<head>` / end of `<body>`), so each section's assets are co-located in the HTML.

```
css/global.css          ← design tokens, layout, shared components
css/s1-science.css      ← section 1 carousel
css/s2-epicenter.css    ← section 2
css/s3-waves.css        ← section 3
css/s4-seismograph.css  ← section 4
css/s5-pericolosita.css ← section 5
css/s6-rebuild.css      ← section 6

js/main.js              ← cursor, slide tracker, keyboard/fullscreen, section 1 IIFE (INGV + all canvas)
js/s2-epicenter.js      ← section 2 IIFE (4 sub-slides)
js/s3-waves.js          ← section 3 IIFE (10 sub-slides, namespace S3)
js/s4-seismograph.js    ← section 4 (seismogram canvas + interactive replay)
js/s5-pericolosita.js   ← section 5 (Leaflet PGA map + province hazard)
js/s6-rebuild.js        ← section 6 IIFE (namespace S6, early-warning canvas + reconstruction cards)
js/init.js              ← popup handlers: Reid, Gutenberg-Richter, S5 PGA, S5 DPC
lib/leaflet.js          ← bundled Leaflet (offline-safe)
lib/leaflet.css
```

### Vertical slide structure (scroll-snap) — 12 slides

| idx | ID | Content |
|-----|----|---------|
| 0 | `#s-hero` | Hero — animated wave canvas (`#hero-canvas`) |
| 1 | `#s-data` | Statistics — count-up animation |
| 2 | `#s-section1` | **Horizontal carousel** — 7 sci-slides (`SCIENCE_IDX = 2`) |
| 3 | `#s-section2` | L'epicentro — horizontal carousel 4 sub-slides |
| 4 | `#s-section3` | Onde sismiche — horizontal carousel 10 sub-slides (`WAVES_IDX = 4`) |
| 5 | `#s-section4` | Sismografo — canvas seismogram + replay |
| 6 | `#s-section5` | Pericolosità sismica — Leaflet PGA map |
| 7 | `#s-section6` | La difesa possibile — early-warning canvas + reconstruction |
| 8 | `#s-city` | Impatto urbano |
| 9 | `#s-art` | Patrimonio culturale (interactive list) |
| 10 | `#s-rebuild` | Ricostruzione — horizontal case-study carousel (5 items) |
| 11 | `#s-end` | Chiusura — smoke canvas + quote |

### Science section carousel (`#s-section1`) — 7 sub-slides

Self-contained IIFE in `js/main.js`. All IDs/classes use `s1-` prefix.

| idx | ID | Content |
|-----|----|---------|
| 0 | `#s1-s1` | INGV live map (Leaflet) — earthquakes last 24h, M ≥ 1.5 |
| 1 | `#s1-s2` | Text definition + animated SVG branch (4-phase CSS animation) |
| 2 | `#s1-s3` | Elastic rebound — 2D canvas, 4-phase fault cycle |
| 3 | `#s1-s4` | Gutenberg-Richter law — two interactive sliders + energy tank |
| 4 | `#s1-s5` | Paganica fault narrative + 3-phase canvas animation |
| 5 | `#s1-s6` | Transition slide ("Le onde sismiche") |
| 6 | `#s1-s7` | (additional slide) |

### Key JavaScript systems

- **Slide tracker** (`js/main.js`): `IntersectionObserver` on `.slide` elements → `onSlideEnter(i, el)` once per slide (guarded by `triggered` Set); `SCIENCE_IDX = 2`, `WAVES_IDX = 4`
- **Section carousels** (all IIFEs): `goToSlide(idx)` drives `#sN-track` via `translateX(calc(idx * -100vw))`; each section has its own `triggered` Set; handles wheel/touch/keyboard/button navigation
- **INGV API** (`js/main.js`): `fetchINGV()` — fetches last-24h earthquakes from `webservices.ingv.it`, renders Leaflet markers colored by magnitude
- **Elastic rebound canvas** (`#s1-fault-canvas`): `startFaultAnim()` / `_animFault()` — 4-phase 2D canvas (accumulo → deformazione → rottura → rimbalzo)
- **Sliders** (`#s1-s4`): `initSliders()` — 9-point Gutenberg-Richter lookup table, linear interpolation, energy tank fill
- **Paganica canvas** (`#s1-paganica-canvas`): `initPaganicanCanvas()` — 3-phase non-looping (tensione → frattura → scorrimento)
- **Seismograph canvas** (`js/s4-seismograph.js`): deterministic LCG-generated seismogram data for L'Aquila 2009 AQU station
- **PGA map** (`js/s5-pericolosita.js`): Leaflet map with DPC seismic zones GeoJSON + INGV last-12-months markers + L'Aquila pulse marker
- **Hero canvas** (`#hero-canvas`): per-row spring oscillator (`heroDisp`/`heroVel`) reacting to mouse
- **Count-up**: `countUp(el)` reads `data-val` and `data-dec`; fires on slide entry
- **Popups** (`js/init.js`): `makePopup()` for Reid / Gutenberg-Richter overlays; `makeS5Popup()` for PGA / DPC info overlays
- **Slide restore**: `R` key saves `sessionStorage.slideIdx` before reload; restored on page load

### CSS design tokens

```css
--black:      #080808
--charcoal:   #101010
--terracotta: #C4612A   /* primary accent */
--ochre:      #D4893A
--cream:      #F5EDE0   /* body text */
--blood:      #8B1A1A
--blue:       #3A7EC4   /* science slides */
--red-wave:   #C43A3A
```

Fonts: `Cormorant Garamond` (body/headings) and `JetBrains Mono` (labels/data), both from Google Fonts.

Each section uses its own CSS namespace prefix: `.s1-`, `.s2-`, `.s3-`, `.s4-`, `.s5-`, `.s6-`.

### Navigation

- Mouse wheel / trackpad: vertical slide navigation (CSS `scroll-snap-type: y mandatory`); intercepted inside horizontal-carousel sections to drive sub-slides
- `↑↓` / `PageUp/PageDown`: vertical slide navigation
- `←→`: horizontal carousel navigation (only when the active section is in view)
- `F`: fullscreen toggle
- `R`: reload preserving current slide position (via `sessionStorage`)
- Right-side nav dots (`#nav-dots`) and slide counter (`#slide-counter`) reflect vertical position
- Touch swipe supported on all carousels

## `_build/` directory

Staging area for building sections in pieces before merging into `index.html`. Contains per-section master prompts (`master-prompt-s*.md`), HTML fragments (`sN-part-*.html`), and assembled blocks (`sectionN-block.html`). The canonical source is always `index.html`.

## Reference material

`documenti guida/6.Terremoti.pdf` — source document used as content reference.
