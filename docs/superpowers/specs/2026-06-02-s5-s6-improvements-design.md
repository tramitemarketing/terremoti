# Spec: S5 + S6 Improvements
Date: 2026-06-02

## S5 — Sezione 5

### S5-s1: Mappa INGV (Leaflet)

**Ripristino sidebar sinistra**
- Aggiungere HTML `.s5-control-panel` dentro `#s5-s1` (il CSS esiste già: `position:absolute; top:5rem; left:1.2rem; z-index:1000`)
- Contenuto: eyebrow "LIVE · INGV 12 MESI", toggle "Zone sismiche" (`#s5-toggle-zones`), toggle "Terremoti 12 mesi" (`#s5-toggle-quakes`), gruppo radio filtro magnitudine (`s5-magfilter`, valori: all/3/4), contatore eventi (`#s5-quake-count`), stato API (`#s5-api-status`)
- Il box DPC a destra rimane invariato

**Bounds Leaflet**
- In `s5_initSlide1()` in `js/s5-pericolosita.js`: aggiungere `maxBounds: L.latLngBounds([33.0, 4.0], [49.0, 22.0])` e `minZoom: 5` alle opzioni di `L.map()`
- `map.setMaxBounds(...)` dopo `fitBounds`

---

### S5-s2: Formula del rischio + ingranaggi

**Verticalizzazione (–20%)**
- `css/s5-pericolosita.css`: `.s5-s2-left` padding da `2rem 2rem 2rem 3rem` → `1.2rem 1.5rem 1.2rem 2.5rem`
- `.s5-s2-title` margin-bottom da `1.2rem` → `0.7rem`
- `.s5-formula-box` padding da `1.2rem` e margin da `1.5rem 0` → `0.8rem` e `0.9rem 0`
- `.s5-btn-row` gap da `0.8rem` → `0.5rem`
- `canvas#s5-gear-canvas` height da `380` → `330` (attributo HTML)

**Ingranaggi più grandi + direzione blu**
- In `s5_initSlide2()` in `js/s5-pericolosita.js`:
  - `gearP.r`: 80 → 90, `gearV.r`: 70 → 80, `gearE.r`: 65 → 75
  - `gearVTarget`: 70 → 80, `gearETarget`: 65 → 75 (per reset)
  - Posizioni: `gearV.x`: 300 → 310, `gearV.y`: 130 → 120; `gearE.x`: 310 → 320, `gearE.y`: 280 → 295
  - Direzione ingranaggio E (blu): `gearE.angle -= ...` → `gearE.angle += BASE_SPEED * (gearE.r / 75)` (orario come P)

**Restringere formula**
- `.s5-formula-text` font-size da `clamp(0.7rem, 1.2vw, 0.9rem)` → `clamp(0.6rem, 0.9vw, 0.75rem)`

---

### S5-s5: Mappa zone sismiche (Leaflet)

**Bounds Leaflet**
- In `s5_initSlide5()` in `js/s5-pericolosita.js`: aggiungere alle opzioni di `L.map('s5-zone-map', {...})`:
  - `maxBounds: L.latLngBounds([33.0, 4.0], [49.0, 22.0])`
  - `minZoom: 5`
- Dopo `map.fitBounds(...)` aggiungere `map.setMaxBounds(...)`

---

## S6 — Sezione 6

### S6-s2: Early warning canvas

**3 box sistema in colonna verticale**
- In `index.html` sezione `#s6-s2`: il `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">` diventa `display:flex; flex-direction:column; gap:8px; margin-bottom:12px`
- I 3 `.s6-system-box` diventano `padding:10px 14px` (ridotto da default 13px 16px)

**Testo più stretto, canvas più grande**
- Il grid esterno `grid-template-columns:1fr 420px` → `grid-template-columns:1fr 480px`
- La colonna testo: rimuovere padding destro o ridurlo (`padding:0 8px 0 0`)
- Canvas `#s6-ew-canvas`: attributi `width="460" height="380"` (era 380×320); stile `width:100%` rimane

**Padding verticale testo**
- Aggiungere `padding-top:0` sulla colonna testo (rimuovere lo spazio inutilizzato in cima)

---

### S6-s11: Timeline orizzontale

**Titolo più grande**
- In `index.html` `#s6-s11`: `font-size:clamp(22px,3vw,34px)` → `font-size:clamp(28px,3.8vw,42px)`

**Wrapper più alto**
- `css/s6-rebuild.css`: `.s6-htl-wrap { height: 220px }` → `height: 320px`

**Altezze connettori aumentate**
- In `s6InitTimeline()` in `js/s6-rebuild.js`: `var heights = { xlarge: 90, large: 65, normal: 45 }` → `{ xlarge: 140, large: 105, normal: 80 }`

**Larghezza contenuto nodi aumentata**
- `width:120px` nei content style → `width:160px`

**Rimuovi troncamento testo**
- Rimuovere la riga `var shortText = node.text.length > 60 ? node.text.substring(0, 58) + '…' : node.text`
- Usare `node.text` direttamente

**Font size testo nodi**
- `.s6-htl-text { font-size: 11px }` → `font-size: 13px`
- `.s6-htl-date { font-size: 8px }` → `font-size: 10px`

---

### S6-s13: Box LastQuake

**Stile uguale a box HTML/CSV**
- In `index.html` `#s6-s13`, il terzo box (LastQuake):
  - `background:var(--charcoal)` (già ok)
  - `border:1px solid rgba(196,97,42,0.2)` (uguale agli altri due box sopra)
  - Rimuovere `padding:20px` e allinearlo agli altri box

**Titolo box**
- Label `📱 APP · LASTQUAKE (EMSC)` → `📱 APP · LASTQUAKE · EMSC`
- Descrizione aggiornata: "L'app ufficiale EMSC per ricevere notifiche in tempo reale dei terremoti. Gratuita, iOS e Android."

**Bottoni iOS/Android — stile opaco**
- Rimuovere le sotto-card `background:rgba(196,97,42,0.12); border:1px solid var(--terracotta); padding:14px`
- Rimpiazzare con due pulsanti diretti, stile uguale ai bottoni dei box HTML/CSV:
  - `background:rgba(196,97,42,0.15); border:1px solid var(--terracotta); color:var(--cream); padding:10px 20px; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:1px; width:100%; cursor:pointer`
- Testi: `⬇ App Store — iOS` e `⬇ Play Store — Android`
- Link iOS: `https://apps.apple.com/app/id890799748`
- Link Android: `https://play.google.com/store/apps/details?id=org.emsc_csem.lastquake`

---

## File modificati

| File | Modifiche |
|------|-----------|
| `index.html` | S5-s1 HTML sidebar, S6-s2 layout/canvas, S6-s13 box LastQuake |
| `css/s5-pericolosita.css` | S5-s2 padding/margins/formula |
| `css/s6-rebuild.css` | S6-s11 timeline height + font sizes |
| `js/s5-pericolosita.js` | S5-s1 bounds, S5-s2 ingranaggi+direzione, S5-s5 bounds |
| `js/s6-rebuild.js` | S6-s11 altezze connettori + testo |
