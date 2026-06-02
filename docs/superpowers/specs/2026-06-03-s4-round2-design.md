# Spec: S4 Round 2 — Fix definitivi
Date: 2026-06-03

---

## S4-s1 — Sismografo

### Bug loop definitivo
Nella guard `if (s4SlideInited[0])`, rimuovere il check `if (!s4Loops['slide0'])`.
Sostituire con: always call `requestAnimationFrame(seismoLoop)` when `running = true`.
Il loop usa già `if (!s4SeismoState.running) return` per prevenire loop duplicati.

```js
if (s4SlideInited[0]) {
  if (s4SeismoState) {
    const cvs = document.getElementById('s4-seismo-canvas');
    if (cvs && cvs.offsetWidth > 0) {
      const dpr2 = window.devicePixelRatio || 1;
      cvs.width = Math.round(cvs.offsetWidth * dpr2);
      cvs.height = Math.round(cvs.offsetHeight * dpr2) || 300 * dpr2;
    }
    s4SeismoState.running = true;
    requestAnimationFrame(seismoLoop); // sempre — il loop si auto-esclude se running=false
  }
  return;
}
```

### Toggle LIVE / 6 APR 2009

**HTML** (già in index.html, mantenere i due bottoni):
- Bottone LIVE: `<span id="s4-live-dot"></span> LIVE`
- Bottone 2009: `<span id="s4-2009-dot"></span> 6 APR 2009 · 03:32`

**Aggiungere `#s4-2009-dot` in index.html** accanto al testo "6 APR 2009" nel button `#s4-mode-2009`.

**CSS** (`#s4-2009-dot`): dot terracotta `#C4612A`, statico (no animation).
`#s4-live-dot` già verde con blink — aggiungere `.simulated` → grigio (già fatto).

**JS logica**:
- `fetchIRIS()` ha un timeout di 5s. Aggiungere un secondo timeout di 10s:
  - Se dopo 10s `s4SeismoState.liveSimulated` è ancora `true` (IRIS non ha risposto):
    - Cambiare mode a `'2009'` automaticamente
    - Aggiornare UI bottoni (2009 active, live inactive)
    - Mostrare label `#s4-iris-status` con "NON DISPONIBILE · Visualizzo 6 aprile 2009"
    - Rimuovere il rumore simulato — avviare replay traccia 2009

**Implementazione timeout 10s in fetchIRIS()**:
```js
const _autoFallback = setTimeout(function() {
  if (s4SeismoState && s4SeismoState.liveSimulated && s4SeismoState.mode === 'live') {
    // Passa automaticamente a 2009
    s4SeismoState.mode = '2009';
    s4SeismoState.seismo2009Pos = 0;
    const btnLive = document.getElementById('s4-mode-live');
    const btn2009 = document.getElementById('s4-mode-2009');
    if (btnLive) { btnLive.classList.remove('s4-mode-active'); btnLive.setAttribute('aria-pressed','false'); }
    if (btn2009) { btn2009.classList.add('s4-mode-active'); btn2009.setAttribute('aria-pressed','true'); }
    const irisStatus = document.getElementById('s4-iris-status');
    if (irisStatus) { irisStatus.textContent = 'NON DISPONIBILE · Visualizzo 6 aprile 2009'; irisStatus.classList.add('visible'); }
    const speedCtrl = document.getElementById('s4-speed-ctrl');
    if (speedCtrl) speedCtrl.style.display = 'flex';
  }
}, 10000);
// Nel .then di fetchIRIS (dati arrivati): clearTimeout(_autoFallback)
// Nel .catch di fetchIRIS: clearTimeout(_autoFallback) (già gestito)
```

### Centrare verticalmente
**CSS** `#s4-s1-inner`: cambiare da grid a flex:
```css
#s4-s1-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  gap: 1.5rem;
}
#s4-s1-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
```

### 3 righe aggiuntive nel pannello info
In `#s4-side-info`, aggiungere DOPO le righe esistenti (prima di `.s4-info-source`):
```html
<div class="s4-info-row"><span class="s4-info-key">RETE</span><span class="s4-info-val">IV INGV</span></div>
<div class="s4-info-row"><span class="s4-info-key">EVENTO</span><span class="s4-info-val" id="s4-mode-label">Live</span></div>
<div class="s4-info-row"><span class="s4-info-key">NOTE</span><span class="s4-info-val" style="font-size:0.6rem;line-height:1.4">Traccia HHZ banda larga. M6.3 · 03:32 UTC</span></div>
```
JS: aggiornare `#s4-mode-label` quando cambia mode ('Live' vs '6 apr 2009').

---

## S4-s5 — Nomogramma

### Fix linea retta SX→DX
Nel drawNomo, la linea deve essere una retta unica da (leftX, yLeft) a (rightX, yRight).
Il pallino è già corretto a yGeom.

Sostituire entrambe le rami dell'animazione:
```js
if (lineProgress > 0) {
  const p = Math.min(lineProgress, 1);
  // Retta unica SX→DX interpolata linearmente — nessun passaggio per yCenter
  const xEnd = leftX + (rightX - leftX) * p;
  const yEnd = yLeft + (yRight - yLeft) * p;

  ctx.strokeStyle = terra;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX, yLeft);
  ctx.lineTo(xEnd, yEnd);
  ctx.stroke();

  // Pallino solo quando la linea supera l'asse centrale
  const pCenter = (centerX - leftX) / (rightX - leftX);
  if (p >= pCenter) {
    const yGeom = yLeft + (yRight - yLeft) * (centerX - leftX) / (rightX - leftX);
    ctx.beginPath();
    ctx.arc(centerX, yGeom, 6, 0, Math.PI * 2);
    ctx.fillStyle = terra;
    ctx.fill();
    // Label
    if (p >= 1 && showLabel) {
      ctx.fillStyle = terra;
      ctx.font = 'bold 13px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ML = ' + computeML(gap, amp).toFixed(1), centerX, yGeom - 14);
      if (computeML(gap, amp) >= 5.8 && computeML(gap, amp) <= 6.8) {
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = ochre;
        ctx.fillText("L'Aquila 2009 ≈ 6.3", centerX, yGeom - 26);
      }
    }
  }
}
```

### Fix DPR pointer coordinates per drag
In `nomoPointerY` e `nomoPointerX`, aggiungere scaling DPR:
```js
function nomoPointerY(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return (clientY - rect.top) * (canvas.height / (rect.height * dpr));
}
function nomoPointerX(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  return (clientX - rect.left) * (canvas.width / (rect.width * dpr));
}
```
Nota: `canvas.height / (rect.height * dpr)` → normalmente ≈ 1 su schermi normali.
Alternativa più semplice: `(clientY - rect.top) / rect.height * canvas.height / dpr`.

### Pallini drag più visibili
I pallini bianchi nel drawNomoWithDots hanno raggio 7. Aumentare a 9 e aggiungere cursore:
```css
#s4-nomo-canvas { cursor: default; }
#s4-nomo-canvas:active { cursor: grabbing; }
```

---

## S4-s6 — Rimuovere pipe-connectors

**HTML**: rimuovere i 3 `<div class="s4-pipe-connector">↓</div>` (connettori freccia tra gli step della pipeline).
File: index.html, dentro `#s4-s6-layout > #s4-s6-pipeline`.

---

## S4-s9 — Zoom e pan mappa

**JS** in `initSlide9()`, `L.map('s4-map9', {...})`:
```js
scrollWheelZoom: true,
dragging: true,
```

---

## S4-s10 — Ripristino vecchio layout Richter comparatore

**Root cause**: il codice attuale (s4-s10) usa un layout diverso da quello del commit pre-split (732ce04~1). Il vecchio layout funzionava meglio.

### HTML da ripristinare (index.html, slide `id="s4-s10"`)
```html
<div id="s4-s10-inner">
  <div class="s4-eyebrow">SCALA RICHTER · MAGNITUDO</div>
  <h2 class="s4-title" style="text-align:center">Ogni grado vale 30 volte più energia.</h2>

  <div class="s4-richter-slider-wrap">
    <span class="s4-slider-label-sm">M 0</span>
    <div class="s4-richter-slider-inner">
      <input type="range" id="s4-richter-slider" min="0" max="10" step="0.5" value="6.5">
      <div class="s4-richter-fixed-marker" style="left:63%">
        <span class="s4-richter-marker-label">L'Aquila 2009</span>
      </div>
    </div>
    <span class="s4-slider-label-sm">M 10</span>
  </div>
  <div class="s4-richter-ref-note">M 6.3 = L'Aquila 2009</div>
  <div id="s4-richter-val" style="font-family:'JetBrains Mono',monospace;font-size:1.2rem;color:var(--terracotta);text-align:center;margin-bottom:0.3rem">M 6.5</div>

  <div class="s4-richter-viz">
    <!-- Zona SVG -->
    <div id="s4-richter-illus" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px"></div>
    <!-- Barra energia -->
    <div id="s4-richter-bar-wrap" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
      <div id="s4-richter-bar-label" style="font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--blood);writing-mode:vertical-rl;margin-bottom:0.3rem">ENERGIA</div>
      <div id="s4-richter-bar-container" style="width:20px;flex:1;background:rgba(255,255,255,0.05);position:relative;border-radius:2px">
        <div id="s4-richter-bar" style="position:absolute;bottom:0;width:100%;border-radius:2px;transition:height 0.4s,background 0.4s"></div>
      </div>
    </div>
    <!-- Dati joule -->
    <div id="s4-richter-data">
      <div id="s4-richter-joule" class="s4-big-mono">—</div>
      <div id="s4-richter-formula" class="s4-formula-note">E = 10^(1.5M + 4.8) J</div>
      <div id="s4-richter-compare" class="s4-richter-compare-txt">—</div>
      <div id="s4-richter-freq" class="s4-richter-freq-txt">—</div>
    </div>
  </div>
</div>
```

**CSS**: `.s4-richter-viz { grid-template-columns: 40% 10% 1fr; gap: 1rem; align-items: center; min-height: 200px; }`
`#s4-richter-illus svg { max-height: 180px; max-width: 160px; }`

Il JS `initSlide10()` mantiene lo stesso codice — usa già `generateRichterIllus` e gli stessi ID.

---

## S4-s12 — Zone isosismiche non sovrapposte + zoom

### Zoom e pan
```js
// in initSlide12():
scrollWheelZoom: true,
dragging: true,
```

### Poligoni ad anello (no sovrapposizione)
Il fix è creare ogni zona come anello con il buco della zona interna.
In Leaflet: `L.polygon([outerCoords, innerHoleCoords])`.

Ordine zone: X (più piccola) → V (più grande).
- Zona X: solo outerCoords (nessun buco)
- Zona IX: outerCoords + buco = zona X coords
- Zona VIII: outerCoords + buco = zona IX coords
- Zona VII: outerCoords + buco = zona VIII coords
- Zona VI: outerCoords + buco = zona VII coords
- Zona V: outerCoords + buco = zona VI coords

```js
// In initSlide12(), invece di:
zonesReversed.forEach(function(zone) { L.polygon(zone.coords, ...) });

// Fare:
const sortedByGrade = S4_ISO_ZONES.slice().sort((a,b) => b.grade - a.grade); // X prima, V ultima
sortedByGrade.forEach(function(zone, i) {
  const outerCoords = zone.coords;
  const holeCoords = i > 0 ? sortedByGrade[i-1].coords : null; // zona interna come buco
  const latLngs = holeCoords ? [outerCoords, holeCoords] : [outerCoords];
  L.polygon(latLngs, {
    color: zone.color,
    fillColor: zone.color,
    fillOpacity: zone.opacity,
    weight: 2,
    ...
  }).addTo(map);
});
```

### Testo nota più grande
In index.html, `#s4-s12-legend` → la riga con "Le isosisme collegano...":
Cambiare `font-size: 0.52rem` → `font-size: 0.68rem`.

### Spiegazione MCS
Aggiungere in `#s4-s12-legend` una frase:
```html
<p class="s4-legend-note" style="font-size:0.68rem;line-height:1.6;color:rgba(245,237,224,0.65);margin-top:0.6rem">
  L'Aquila 2009 (M 6.3): dal grado X (centro storico, Onna — distruzione quasi totale) 
  al grado V (Roma — percepito senza danni). La stessa scossa produce intensità MCS 
  completamente diverse a seconda della distanza, del tipo di terreno e degli edifici.
</p>
```

---

## File modificati

| File | Cambiamento |
|------|-------------|
| `index.html` | s4-s1 side-info righe, s4-s1 dot-2009, s4-s6 rimuovi pipe-connectors, s4-s10 HTML, s4-s12 testo+spiegazione |
| `css/s4-seismograph.css` | s4-s1 inner layout flex, s4-s10 viz grid |
| `js/s4-seismograph.js` | s4-s1 loop fix + fallback 10s, s4-s5 linea retta + DPR drag, s4-s9 zoom, s4-s12 zoom + anello poligoni |
