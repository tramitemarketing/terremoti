# Spec: S4 — Sezione 4 Improvements
Date: 2026-06-03

---

## S4-s1 — Sismografo LIVE

### Bug: traccia ferma all'apertura
**Root cause:** quando `stopSlideLoop(0)` viene chiamato da `goTo()` cancella il RAF (`s4Loops['slide0']`) e setta `running = false`. Il riavvio nella guard (`s4SlideInited[0] = true`) chiama `requestAnimationFrame(seismoLoop)` ma `seismoLoop` è un riferimento alla chiusura del PRIMO `initSlide1()`. Poiché il canvas NON ha attributo `width` (solo `height="300"`), la prima volta che il loop gira il canvas potrebbe non essere ancora layout-computed (`offsetWidth = 0`) e il DPR scaling è scorretto.

**Fix:**
1. Aggiungere nel `canvas` HTML `width="800"` come default che verrà sovrascritto dal resize handler
2. Aggiungere in `initSlide1()` un `ResizeObserver` (o listener su `visibilitychange`) che resetta `canvas.width = canvas.offsetWidth * dpr` quando la slide diventa visibile
3. Nel ramo guard (`s4SlideInited[0]` già true): oltre a settare `running = true`, fare un `canvas.width` resize e ri-riempire il buffer prima di `requestAnimationFrame(seismoLoop)`

### Etichetta LIVE / modalità
- In modalità LIVE con `liveSimulated = true` (IRIS non risponde): mostrare sotto i pulsanti un `<div id="s4-iris-status">SIMULATO · IRIS non disponibile</div>` in terracotta; nasconderlo quando `liveSimulated = false`
- Il puntino `#s4-live-dot` è già presente: aggiungere `animation: s4-blink 1.4s ease-in-out infinite` in CSS — verde (#32CD32) se live reale, grigio se simulato
- In modalità 2009: nascondere `#s4-iris-status`, togliere animazione dal dot

### Unità di misura
- Asse Y del canvas: aggiungere label testuale "μm" (micrometri) — nota didattica: i valori sono normalizzati, etichetta puramente indicativa
- Posizione: angolo top-left del canvas, sopra la colonna scala, `font: '8px JetBrains Mono'`, `fillStyle: 'rgba(245,237,224,0.45)'`

---

## S4-s2 — Come funziona un sismografo

### Layout 50/50 centrato
- `#s4-s2-inner`: `display: flex; align-items: center; justify-content: center; gap: 2rem; padding: 2rem 3rem`
- `.s4-s2-text`: `flex: 0 0 46%; align-self: center`
- `.s4-s2-anim`: `flex: 0 0 46%; align-self: center; display: flex; flex-direction: column; align-items: center; justify-content: center`
- Il canvas `#s4-anim-canvas` rimane 460×380 (non modificare)

---

## S4-s4 — Verifica marker P/S

### Bug: nessuna spunta visiva
**Root cause:** il codice calcola `giudizio` come stringa testuale ma non mostra un simbolo visivo.

**Fix in JS** (dentro il click handler `s4-verify`):
```js
let icon, color;
if (errAvg < 1)      { icon = '✓'; color = '#32CD32'; }  // verde
else if (errAvg < 3) { icon = '~'; color = '#D4893A'; }  // ochre
else                 { icon = '✗'; color = '#8B1A1A'; }  // blood

// Aggiungere in cima a r2.innerHTML:
'<div style="font-size:2rem;text-align:center;color:' + color + ';margin-bottom:0.5rem">' + icon + '</div>'
```

- Anche il bottone `s4-verify` dopo il click: aggiungere `border-color: [colore]` corrispondente

---

## S4-s5 — Nomogramma di Richter

### Fix punto di intersezione geometrica
**Root cause:** il pallino è disegnato a `magToY(computeML(gap, amp))` = posizione ML *calcolata*. Ma la retta disegnata va da `(leftX, yLeft)` a `(rightX, yRight)`. Se le scale non sono perfettamente allineate, il punto calcolato non coincide con l'intersezione geometrica della retta con `centerX`.

**Fix:** calcolare l'intersezione geometrica:
```js
const yGeom = yLeft + (yRight - yLeft) * (centerX - leftX) / (rightX - leftX);
// Disegnare il pallino a yGeom invece di yCenter
ctx.arc(centerX, yGeom, 6, 0, Math.PI * 2);
```
Aggiornare anche `magToY` in modo che le scale sx/dx/centro siano coerenti per rendere `yGeom ≈ yCenter`.

### Slider in-canvas sugli assi
**Aggiungere drag diretto sugli assi nel canvas:**
- In `drawNomo()`, disegnare un triangolo/marker draggabile (`▶`) sull'asse sx alla y-posizione del punto distanza, e uno sull'asse dx per l'ampiezza
- Aggiungere `mousedown/mousemove/mouseup` e `touchstart/touchmove/touchend` listener sul canvas
- Se click cade entro `±12px` di `leftX` → drag su asse distanza (mappa y → km via `yToDist()`)
- Se click cade entro `±12px` di `rightX` → drag su asse ampiezza (mappa y → mm via `yToAmp()`)
- Aggiornare `s4NomoState.gap` / `s4NomoState.amp` e `redrawNomo()` in tempo reale
- Sincronizzare con gli HTML range/number inputs esistenti

---

## S4-s6 — Calcolo Richter formula

### Centrare verticalmente
- `#s4-s6-inner`: aggiungere `display: flex; flex-direction: column; justify-content: center; height: 100%`

### Spiegazione completa formula
Nel pannello `#s4-s6-result`, sotto `.s4-s6-formula-block`, aggiungere:
```html
<div class="s4-s6-formula-explain">
  <div class="s4-s6-explain-row">
    <span class="s4-s6-explain-term">log₁₀(A)</span>
    <span>Logaritmo dell'ampiezza max in mm — scala logaritmica</span>
  </div>
  <div class="s4-s6-explain-row">
    <span class="s4-s6-explain-term">3·log₁₀(Δ)</span>
    <span>Correzione distanza in km — onda si attenua con la distanza</span>
  </div>
  <div class="s4-s6-explain-row">
    <span class="s4-s6-explain-term">−2.92</span>
    <span>Costante di calibrazione Richter 1935 — definisce ML=0 per il minimo percettibile a 100 km</span>
  </div>
  <div class="s4-s6-explain-history">
    Charles Richter, Caltech 1935. Calibrata su sismografi Wood-Anderson, stazione a 100 km.
    La costante −2.92 normalizza la scala in modo che M=0 corrisponda a ~1 μm di ampiezza a 100 km.
  </div>
</div>
```

### Passaggi numerici nel risultato
In `#s4-s6-result-display`, dopo `#s4-ml-big`, aggiungere `#s4-ml-steps`:
```
ML = log₁₀([A]) + 3·log₁₀([Δ]) − 2.92
   = [logA] + [3logD] − 2.92
   = [risultato]
```
Popolato da JS quando calcola la magnitudo dall'evento INGV corrente.

---

## S4-s8 — Richter vs MCS

### Compattare le colonne
- `.s4-s8-cols`: `gap: 1rem` (ridotto)
- `.s4-compare-col`: `padding: 0.8rem 1rem` (ridotto da 1.5rem)
- `.s4-compare-row`: `padding: 0.2rem 0; font-size: 0.85rem`
- `.s4-formula-box`: `padding: 0.4rem; margin: 0.4rem 0`
- `#s4-s8-inner`: `display: flex; flex-direction: column; justify-content: center; height: 100%`

### Tabella riassuntiva centrata
- `#s4-s8-summary`: `text-align: center; margin: 0 auto; max-width: 560px`
- `.s4-s8-table`: `margin: 0.6rem auto; min-width: 320px`
- La citazione in corsivo sopra la tabella: rimane

---

## S4-s9 — Triangolazione sismica

### Layout 30/70
- `#s4-s9-inner`: `display: flex; align-items: center; gap: 1.5rem; padding: 1rem 2rem 1rem 1.5rem; height: 100%`
- `#s4-s9-controls`: `flex: 0 0 28%; align-self: flex-start; padding-top: 3rem`
- `#s4-map9`: `flex: 1; max-width: 65%; aspect-ratio: 4/3; max-height: 75vh; align-self: center`

### Fix titolo
- `#s4-s9-inner .s4-eyebrow` e `.s4-title`: spostare DENTRO `#s4-s9-controls` come prima cosa
- Rimuovere il titolo dalla posizione corrente (che è probabilmente fuori dal layout flex)

---

## S4-s10 — Richter comparatore (fix layout)

### Problema: layout "bucato" con troppo spazio vuoto
**Diagnosi:** `.s4-richter-viz` ha `grid-template-columns: 35% 12% 1fr` con `gap: 2rem`. La barra centrale (12%) è stretta e c'è troppo spazio tra gli elementi.

**Fix layout:**
- `.s4-richter-viz`: `grid-template-columns: 40% 8% 1fr; gap: 1.2rem; align-items: center`
- `#s4-richter-illus`: `min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center`
- `#s4-richter-illus svg`: `max-height: 160px`
- `#s4-s10-inner`: `padding: 1.5rem 3rem; gap: 0.8rem`

### Miglioramento SVG illustrazioni
Le illustrazioni SVG esistono già (`generateRichterIllus`). Miglioramento:
- Aumentare viewBox a `0 0 160 160` e height a 160
- Aumentare la dimensione del font delle label all'interno a `11px`
- Aggiungere una barra di scala all'interno dell'SVG o sotto mostrando l'energia in joule comparativa con colori

---

## S4-s12 — Mappa isosismica

### Layout 70/30 con titolo a destra
**HTML:**
- Spostare `<div class="s4-eyebrow">` e `<h2 class="s4-title">` DENTRO `#s4-s12-legend` (prima della legenda MCS)

**CSS `.s4-s12-layout`:**
- `display: flex; gap: 1.5rem; height: 100%; padding: 1rem 1.5rem`
- `#s4-map12`: `flex: 0 0 68%; height: 100%`
- `#s4-s12-legend`: `flex: 1; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto`

**Nessuna spiegazione lunga aggiuntiva** (come richiesto: "anzi non una spiegazione") — solo il titolo e la legenda esistente. Eventualmente aggiungere una riga mono sotto il titolo: "Le isosisme collegano punti di uguale intensità MCS."

---

## File modificati

| File | Slide |
|------|-------|
| `index.html` | s4-s1 (iris-status div), s4-s6 (explain block), s4-s9 (title reorder), s4-s12 (title reorder) |
| `css/s4-seismograph.css` | s4-s1 (dot animation), s4-s2 (layout), s4-s6 (explain styles), s4-s8 (compact), s4-s9 (layout), s4-s10 (layout), s4-s12 (layout) |
| `js/s4-seismograph.js` | s4-s1 (loop fix, resize, IRIS status), s4-s4 (spunta visiva), s4-s5 (nomo drag + intersezione), s4-s6 (passaggi formula) |
