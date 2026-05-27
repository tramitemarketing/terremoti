# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-file web presentation about the 2009 L'Aquila earthquake (`index.html`), written in Italian. Designed as a school presentation (anno scolastico 2025–2026). No build system, no package manager — open the file directly in a browser.

## Running / Developing

```
# Open in browser — any of these work:
start index.html          # Windows default browser
# Or use a local server to avoid CORS issues with canvas fonts:
npx serve .
python -m http.server 8080
```

External CDN dependencies (internet required):
- **Three.js** `https://cdn.jsdelivr.net/npm/three@0.160/build/three.min.js` — removed in current version; may reappear
- **Leaflet.js** `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` + CSS — powers the INGV live earthquake map in `#s-section1`
- **Google Fonts** — `Cormorant Garamond` and `JetBrains Mono`

## Architecture

Everything lives in `index.html` (~3037 lines): HTML structure, all `<style>` CSS, and all `<script>` JavaScript in one file.

### Vertical slide structure (scroll-snap)

| # | ID | Content |
|---|-----|---------|
| 1 | `#s-hero` | Hero with animated wave canvas (`#hero-canvas`) |
| 2 | `#s-data` | Statistics with count-up animation |
| 3 | `#s-section1` | **Horizontal carousel** — 6 sci-slides (`SCIENCE_IDX = 2`) |
| 4 | `#s-city` | Urban impact |
| 5 | `#s-art` | Cultural heritage damage (interactive list) |
| 6 | `#s-rebuild` | Reconstruction cards |
| 7 | `#s-end` | Closing quote |

### Science section carousel (`#s-section1`) — 6 sub-slides

The section is implemented as a self-contained IIFE. All IDs/classes use the `s1-` prefix to avoid conflicts.

| idx | ID | Content |
|-----|----|---------|
| 0 | `#s1-s1` | INGV live map (Leaflet) — earthquakes in Italy, last 24h, M ≥ 1.5 |
| 1 | `#s1-s2` | Text definition + animated SVG branch (4-phase CSS animation) |
| 2 | `#s1-s3` | Elastic rebound animation — 2D canvas, 4-phase fault cycle |
| 3 | `#s1-s4` | Gutenberg-Richter law — two interactive sliders + energy tank |
| 4 | `#s1-s5` | Paganica fault narrative + 3-phase canvas animation |
| 5 | `#s1-s6` | Transition slide ("Le onde sismiche") |

### Key JavaScript systems

- **Slide tracker**: `IntersectionObserver` on all `.slide` elements → calls `onSlideEnter(i, el)` once per slide (guarded by `triggered` Set)
- **Science carousel IIFE**: `goToSlide(idx)` drives `#s1-track` via `translateX(-${idx*100}vw)`; entry triggers guarded by inner `triggered` Set; handles wheel/touch/keyboard/button events within `#s-section1`
- **INGV API**: `fetchINGV()` — fetches last-24h earthquakes from `webservices.ingv.it`, renders Leaflet markers colored by magnitude
- **Elastic rebound canvas** (`#s1-fault-canvas`): `startFaultAnim()` / `_animFault()` — 4-phase 2D canvas animation (accumulo → deformazione → rottura → rimbalzo); play/pause via `#s1-play-btn`
- **Sliders** (`#s1-s4`): `initSliders()` — syncs period and magnitude sliders with linear interpolation from a 9-point Gutenberg-Richter lookup table; updates energy tank fill and `#s1-energy-label`
- **Paganica canvas** (`#s1-paganica-canvas`): `initPaganicanCanvas()` — 3-phase non-looping animation (tensione → frattura → scorrimento)
- **Hero canvas** (`#hero-canvas`): per-row spring oscillator (`heroDisp`/`heroVel` arrays) reacting to mouse movement
- **Count-up**: `countUp(el)` reads `data-val` and `data-dec` attributes; fires on slide entry

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

All `#s-section1` styles use the `s1-` prefix (`.s1-slide`, `.s1-dot`, `#s1-track`, etc.).

### Navigation

- Mouse wheel / trackpad: vertical slide navigation (CSS `scroll-snap-type: y mandatory`); wheel is intercepted inside `#s-section1` to drive horizontal carousel instead
- `↑↓` / `PageUp/PageDown`: vertical slide navigation
- `←→`: horizontal carousel navigation (only when `#s-section1` is in view)
- `F`: fullscreen toggle
- Right-side nav dots (`#nav-dots`) and slide counter (`#slide-counter`) reflect current vertical position
- Touch swipe supported on the science carousel

## `_build/` directory

Staging area for developing `#s-section1` in pieces before merging into `index.html`. Contains:

- `master-prompt.md` — full spec for the section (slide layouts, API details, canvas animation specs, class/ID naming conventions)
- `slides-1-2.html`, `slide-3.html`, `slide-4.html`, `slides-5-6.html` — HTML fragments per sub-slide
- `section1.css` — scoped CSS for the section
- `carousel.js` — IIFE carousel logic

These files are reference/drafts; the canonical source is `index.html`.

## Reference material

`documenti guida/6.Terremoti.pdf` — source document used as content reference for the presentation.
