# Spec: Sezione 2 — fix canvas depth + swap mag/depth
## 2026-06-02

---

## Modifica 1 — s2-s3: fix canvas "vista dall'alto"

**File:** `js/s2-epicenter.js` — funzione `s2InitDepthSlider()`

### Problema
Due formule separate per `km` producono valori incompatibili:
- Testo (`infoR`, `infoArea`): `km = Math.round(10 + (depth / MAX_D) * 390)` → a L'Aquila (8,8 km): 21 km, 1385 km²
- Cerchio visivo (`drawSurfaceCircle`): `km = rPx / pxPerKm` con scala fissa 30 km → a L'Aquila: 2 km

### Fix

**Formula unificata:** `km = Math.round(10 + (depth / MAX_D) * 390)`
- Usata sia per infoR/infoArea che per il raggio del cerchio visivo

**Griglia dinamica:**
```
GRID_MAX_KM = Math.ceil(km * 1.6 / 10) * 10  // sempre 60% più larga del raggio, in multipli di 10
```
- Step linee principali: `GRID_MAX_KM / 3` (circa 3 linee per lato)
- Step linee secondarie: `GRID_MAX_KM / 6`
- Etichette km aggiornate ad ogni cambio slider

**Cerchio:**
```
pxPerKm = (DW / 2 - 20) / GRID_MAX_KM
rPx = km * pxPerKm   // coerente con la griglia
```
- Il cerchio occupa sempre circa 60% del semiasse del canvas
- Clamp: `rPx = Math.min(rPx, DW / 2 - 15)` per non uscire dal canvas

**Non cambia:** colori, gradiente radiale, crosshair epicentro, label "EPICENTRO"

### Valori attesi
| Profondità | km raggio | Area | Griglia max |
|---|---|---|---|
| 8,8 km (L'Aquila) | ~21 km | ~1.385 km² | 40 km |
| 50 km | ~75 km | ~17.671 km² | 120 km |
| 150 km | ~205 km | ~132.024 km² | 330 km |
| 300 km | ~400 km | ~502.655 km² | 640 km |

---

## Modifica 2 — s2-s1: swap profondità ↔ magnitudo

**File:** `js/s2-epicenter.js` — rendering lista eventi + info panel

### Attuale struttura lista eventi (linee ~220-230)
```
[dot magColor]  [luogo]       [M 4.5]  ← grande, classe s2-event-mag
                [↓ 8,8 km]             ← piccolo, classe s2-event-depth
```

### Dopo lo swap
```
[dot magColor]  [luogo]       [↓ 8,8 km]  ← grande, classe s2-event-mag (riuso stile)
                [M 4.5]                    ← piccolo, classe s2-event-depth (riuso stile)
```

Solo l'ordine/contenuto cambia — le classi CSS rimangono invariate (nessun cambio CSS).

### Info panel basso (hover marker)
Attuale: profondità con classe `s2-info-val--hypo` (teal), magnitudo normale
Dopo: profondità come valore principale (font grande), magnitudo come secondario

**Colore dot:** rimane basato su magnitudo (`s2MagColor(ev.mag)`) — aiuta a leggere la forza del sisma.

---

## Self-review
- [x] Nessun TBD o placeholder
- [x] Le due modifiche sono indipendenti (file diversi del codice, ma stesso file js/s2-epicenter.js)
- [x] Formula km verificata: a depth=8.8 → km=21, area=1385 ✓
- [x] Griglia dinamica: a km=21 → GRID_MAX_KM=ceil(21*1.6/10)*10=ceil(3.36)*10=40 ✓
