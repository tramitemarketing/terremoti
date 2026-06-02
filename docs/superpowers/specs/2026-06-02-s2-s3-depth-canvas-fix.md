# Spec: s2-s3 depth canvas — fix griglia statica 80 km
## 2026-06-02

## Problema
Il CSS `#s2-section-canvas, #s2-depth-canvas { height: calc(100vh-120px) }` ha distorto entrambi i canvas. La griglia dinamica cambia scala ad ogni tick. La label "r" è dentro il cerchio.

## Fix

### CSS (`css/s2-epicenter.css`)
- Separare i selettori: section canvas torna a `max-height: calc(100vh - 170px)` senza height fissa
- Depth canvas: `width: 400px; max-width: 100%; max-height: calc(100vh - 120px)` — più grande del sinistro

### JS `drawSurface` (`js/s2-epicenter.js`)
- `GRID_MAX_KM = 80` — fisso, mai cambia
- Step principali: 20 km; step secondari: 10 km — fissi
- `rPx = km * pxPerKm` — NO clamp: il cerchio può uscire dal canvas
- Calabria (374 km): rPx > canvas → gradiente opaco copre tutto il canvas → visivamente "area enorme"
- Label: se rPx <= canvas/2 - 10 → `cx + rPx + 10, cy - rPx * 0.4` (fuori cerchio); altrimenti angolo top-right

## Self-review
- [x] CSS separato — section canvas non toccato
- [x] Griglia 80 km fissa — non dinamica
- [x] Label sempre fuori dal cerchio
- [x] Nessun placeholder
