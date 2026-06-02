# Spec: S4 Round 3
Date: 2026-06-03

## S4-s6: Centramento verticale + animazione
- CSS: aggiungere `justify-content: center` a `#s4-s6-inner`
- L'animazione step-by-step esiste già in JS (initSlide6), nessuna modifica

## S4-s7: Rimuovere frecce MCS
- HTML: rimuovere `<div class="s4-mcs-arrows">...</div>` da slide s4-s7

## S4-s9: Raggio cerchi triangolazione
- AQU: 3km ok
- SULM: 35km → 56km (distanza reale da epicentro Paganica 42.342,13.380)
- TERO: 55km → 44km
- Aggiornare HTML labels + JS STAZIONI + mappa zoom 7

## S4-s10: Layout pulito con etichetta M visibile
- Aggiungere `<div id="s4-richter-val">M 6.5</div>` sopra la viz
- CSS: `.s4-richter-viz` align-items:stretch, energia bar più alta
- JS: aggiornare anche `#s4-richter-val` in updateRichter()

## S4-s12: Coordinate poligoni corrette + nested
Nuove coordinate isosisme concentriche attorno a epicentro (42.342,13.380):
- X: ~3km
- IX: ~15km  
- VIII: ~35km
- VII: ~70km
- VI: ~120km
- V: ~200km
Ogni zona è contenuta nella successiva.
