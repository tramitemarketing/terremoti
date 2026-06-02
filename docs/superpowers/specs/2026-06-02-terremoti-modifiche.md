# Spec: Modifiche presentazione Terremoti — round 2
## 2026-06-02

---

## Approccio: Batch per sezione (B)

Ogni sezione viene implementata e committata in modo autonomo.
Ordine: S6-s13 fix (rapido) → S1 → S2 → S4 → S5 → S6 resto.

---

## Principi trasversali (applicati a ogni slide)

- **Spazio:** ridistribuire il contenuto per occupare l'intera area disponibile; eliminare fasce nere inutilizzate.
- **Tipografia:** uniformare eyebrow (mono, maiuscolo, letter-spacing 0.2–0.35em), titolo (Cormorant Garamond), corpo.
- **Slide di transizione:** font/dimensione identici — riferimento visivo = `s1-s6` (attuale versione stabile).
- **Canvas nitidezza:** ogni canvas che mostra testo deve usare `devicePixelRatio` (dpr). Pattern standard:
  ```js
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.scale(dpr, dpr);
  // font in px interi, textBaseline/textAlign espliciti
  ```

---

## Batch 0 — Fix immediato (5 min)

### `s6-s13` — Bug virgolette curve LastQuake

**File:** `index.html` (blocco HTML del box LastQuake, ~righe 3200–3212)

**Problema verificato:** attributi `style=…` e `onclick=…` usano `"` `"` (virgolette curve) invece di `"` dritte → i due bottoni non si renderizzano né funzionano.

**Fix:** sostituire tutte le virgolette curve `"` e `"` con `"` dritte nell'intero blocco del box LastQuake.

**Risultato atteso:** due bottoni arancioni affiancati, formattati come gli altri link (GitHub, GEM Platform, Docs).

**Link da preservare:**
- Apple App Store: `https://apps.apple.com/app/id890799748`
- Google Play: `https://play.google.com/store/apps/details?id=org.emsc_csem.lastquake`

---

## Batch 1 — Sezione 1

### `s1-s2` — Layout + popup etimologia "terremoto"

**File:** `index.html` (HTML slide), `css/s1-science.css`, `js/init.js`

**Layout:**
- Restringere la colonna di testo (da full-width a ~55–60% della larghezza).
- Alzare il titolo: aumentare il padding-top o margin-top dell'area testo.

**Popup etimologia:**
- La parola "terremoto" nel corpo del testo diventa `<button class="s1-reid-trigger" id="s1-etim-trigger">terremoto</button>` — stesso stile sottolieatura arancione degli altri trigger (`.s1-reid-trigger`).
- Aggiungere il div popup con `id="s1-etim-popup"` e `id="s1-etim-close"` — stesso markup del popup Reid esistente.
- Registrare in `js/init.js`: `makePopup('s1-etim-trigger', 's1-etim-popup', 's1-etim-close')`.
- **Testo popup:**
  - **Terremoto** — dal latino *terraemotus*, composto di *terrae* (genitivo di *terra*) e *motus* ("movimento"): letteralmente **"movimento della terra"**. Il sinonimo **sisma** viene invece dal greco *seismós* (σεισμός), "scuotimento", dal verbo *séiō* (σείω), "scuotere".

### `s1-s4` — Ridistribuzione spazio Gutenberg-Richter

**File:** `index.html`, `css/s1-science.css`

- Lato sinistro (testo): usare più larghezza (almeno 45%).
- Lato destro (tool: serbatoio + slider): ingrandire il blocco grafico — il serbatoio deve essere visivamente prominente (almeno 200px di altezza CSS), i due slider ben spaziati.
- Eliminare fasce nere sopra/sotto: usare `height: 100%; align-items: center` sul wrapper.

### `s1-s6` — Canvas HiDPI (nitidezza testo)

**File:** `js/main.js` (funzione `startFaultAnim` / `_animFault`)

- Aggiungere gestione `devicePixelRatio` al canvas `#s1-fault-canvas`:
  - Al setup: `canvas.width = cssW * dpr; canvas.height = cssH * dpr; ctx.scale(dpr, dpr);`
  - Font in `px` interi, `textBaseline = 'middle'`, `textAlign` espliciti.
- Non modificare la logica delle 4 fasi (accumulo → deformazione → rottura → rimbalzo).

---

## Batch 2 — Sezione 2

### `s2-s2` — Layout testo sinistra

**File:** `index.html`, `css/s2-epicenter.css`

- Riorganizzare solo il pannello testo sinistro: spaziatura interna, font size, line-height per usare meglio l'altezza disponibile.
- Canvas `s2-hypo-canvas` a destra: lasciare invariato, eventualmente ingrandire leggermente il wrapper CSS se rimane spazio.

### `s2-s3` — Griglia statica + cerchio variabile in funzione della profondità

**File:** `js/s2-epicenter.js` (funzione che disegna `s2-depth-canvas`), `css/s2-epicenter.css`

**Comportamento attuale (da correggere):** griglia e linea si muovono insieme al cerchio → sbagliato.

**Comportamento corretto:**
1. **Griglia statica** — disegnata una volta sola (o ridisegnata solo al resize), mai animata.
   - Due livelli di opacità: linee principali (ogni 5 km) `rgba(cream, 0.20)`, linee secondarie (ogni 1 km) `rgba(cream, 0.06)`.
   - Etichette sugli assi: `0 km, 5 km, 10 km, 15 km, 20 km` su entrambi gli assi.
2. **Solo il cerchio dell'epicentro** si anima/aggiorna al cambio slider.
3. **Raggio cerchio proporzionale alla profondità:** profondità maggiore → raggio maggiore (area percepita più diffusa). Formula suggerita: `r = baseR + (depth / maxDepth) * extraR` dove `baseR ≈ 15px`, `extraR ≈ 45px`.

---

## Batch 3 — Sezione 4 (blocco più grande — 13 slide)

### `s4-s1` — Sismografo: traccia scrolling + unità di misura

**File:** `js/s4-seismograph.js` (`initSlide1` / loop canvas)

- **Comportamento traccia:** al caricamento, il canvas deve apparire già popolato con ~30 s di storico (buffer pre-riempito a zero o con rumore microseismico). I nuovi campioni entrano dal bordo destro, il buffer scorre a sinistra — non deve partire da metà canvas e camminare verso destra.
- **Dimensione traccia:** aumentare l'altezza del canvas CSS (da attuale a ~320–360px) per rendere la traccia più visibile.
- **Unità di misura sull'ampiezza:** aggiungere scala verticale (es. tick a ±0.5, ±1.0 con etichette "0.5 mm", "1.0 mm" — valori illustrativi coerenti). Scala fissa, linee orizzontali tratteggiate leggere.

### `s4-s2` — Layout "principio inerzia"

**File:** `index.html`, `css/s4-seismograph.css`

- Spostare il contenuto più a destra: testo a sinistra in colonna stretta, animazione sismografo-molla al centro/destra, spazio bilanciato.
- Non modificare l'animazione a molla.

### `s4-s3` — Timeline 2000 anni: ridimensionamento carte

**File:** `index.html` (HTML), `css/s4-seismograph.css`

- Ridurre le dimensioni delle carte (meno `width/height` o padding interno).
- Aumentare il font size del testo dentro le carte.
- Aumentare lo `gap` tra le carte per distribuirle meglio orizzontalmente.

### `s4-s4` — "Fai il sismologo": centratura verticale

**File:** `index.html`, `css/s4-seismograph.css`

- Il contenuto è troppo schiacciato verso l'alto: aggiungere `align-items: center` o aumentare il `padding-top` dinamicamente così da centrare verticalmente.

### `s4-s5` — Nomogramma Richter: graduazione asse + pallini draggabili

**File:** `index.html` (HTML), `js/s4-seismograph.js` (`initSlide5`), `css/s4-seismograph.css`

**Asse magnitudo:** aggiungere tick e label visibili (stile uniforme agli altri tick/etichette s4).

**Pallino draggabile sull'asse distanza e sull'asse ampiezza:**
- Implementazione: SVG draggabile nativo (`mousedown`/`touchstart`).
- Un pallino bianco su ciascun asse (distanza-km, ampiezza-mm).
- Trascinar il pallino aggiorna il valore corrispondente → ricalcola ML → ridisegna la retta + sposta il pallino di lettura sull'asse magnitudo.

**Pallino di lettura sull'asse magnitudo:**
- Posizionato nel punto esatto di intersezione tra la retta di congiunzione e l'asse magnitudo centrale.
- Label `ML = x.x` aggiornata in tempo reale.
- Colore: arancione (`--terracotta`).

**Bug intersezione:** la retta deve intersecare l'asse magnitudo nel punto matematicamente corretto secondo il nomogramma Richter originale (formula: `ML = log10(A) − log10(A0)` dove `A0` dipende dalla distanza). Verificare il calcolo e correggerlo se sbagliato.

**Slider esistente:** lasciarlo al suo posto, non rimuoverlo.

**Preset iniziale:** L'Aquila (distanza ~8 km, ampiezza corrispondente a ML 6.3).

### `s4-s6` — Richter calcolo step: ridimensionamento riquadri

**File:** `index.html`, `css/s4-seismograph.css`

- Riquadro magnitudo calcolata: ridurre dimensione (da `~200px` a `~140px`), aumentare font del valore dentro.
- Rettangoli procedimenti 01/02/03/04: ridurre padding interno, ridurre `height` o `min-height`, aumentare il font size del testo dentro.
- Ridistribuire per non lasciare fasce nere sopra/sotto.

### `s4-s7` — Scala MCS: frecce visibili + marker L'Aquila condizionale + layout

**File:** `js/s4-seismograph.js` (`initSlide7` / `updateMCS`), `index.html`, `css/s4-seismograph.css`

**Frecce:**
- Aggiungere `<button>` freccia su ▲ e freccia giù ▼ ben visibili accanto al selettore del grado MCS (non nascosti, sempre visibili).

**Marker L'Aquila:**
- Mostrare il confronto "L'Aquila 2009" **solo** quando il grado selezionato è IX (9) o X (10).
- Su tutti gli altri gradi: nascondere l'elemento.

**Layout:**
- Bilanciare meglio numero-grado vs descrizione: il numero romano deve essere visualmente grande ma la descrizione deve occupare lo spazio rimanente in modo leggibile.
- Rimuovere spazio nero eccessivo.

### `s4-s8` — Due scale: riduzione riquadri verso il basso

**File:** `index.html`, `css/s4-seismograph.css`

- Portare i rettangoli (Richter / MCS) leggermente più in alto riducendo `margin-top` o `padding-top` del wrapper.
- Riduzione leggera — non stravolgere l'impatto visivo del riquadro inferiore.

### `s4-s9` — Triangolazione: flusso passo-passo

**File:** `js/s4-seismograph.js` (`initSlide9` / `calcEpicenter`), `index.html`, `css/s4-seismograph.css`

**Nuovo flusso:**
1. Mostrare 3 stazioni fisse sulla mappa (AQU, SULM, TERO — posizioni reali).
2. Per ogni stazione: un bottone **"Calcola"** dedicato → al clic disegna la circonferenza con raggio = distanza reale di quella stazione dall'epicentro de L'Aquila (coordinate vere, scala coerente).
3. Rimuovere il bottone "Aggiungi stazione".
4. Dopo che le 3 cerchia sono state disegnate (o automaticamente dopo il terzo calcolo): appare il bottone **"Triangola"** → evidenzia il punto di intersezione come epicentro, mostra label "EPICENTRO".

**Distanze reali (da usare per i raggi):**
- AQU (L'Aquila, 42.354°N 13.403°E) → ~3 km dall'epicentro (Paganica, 42.342°N 13.380°E)
- SULM (Sulmona, 42.050°N 13.930°E) → ~35 km
- TERO (Teramo, 42.661°N 13.704°E) → ~55 km

**Titolo/occhiello:** uniformare allo stile s4 (eyebrow monospace, titolo serif).

### `s4-s10` — Scala Richter comparatore: ridisegno layout

**File:** `index.html` (HTML s4-s10), `js/s4-seismograph.js` (`initSlide10`), `css/s4-seismograph.css`

**Riferimento spec:** `_build/master-prompt-s4-new-slides.md` §SLIDE 10.

La logica JS è corretta — il problema è il layout. Ridisegnare il CSS seguendo la spec:
- Layout: slider centrale, SVG illustrazione sinistra, barra energia verticale centro, joule + confronto destra.
- Le tre zone devono occupare l'intera larghezza disponibile (grid `35% 12% 53%`).
- Testo "Frequenza globale" sotto lo slider, visibile e leggibile.

### `s4-s11` — Simulatore MCS: ridisegno layout

**File:** `index.html` (HTML s4-s11), `js/s4-seismograph.js` (`initSlide11`), `css/s4-seismograph.css`

**Riferimento spec:** `_build/master-prompt-s4-new-slides.md` §SLIDE 11.

Ridisegnare il layout (la logica JS è corretta):
- Layout split: pannello controlli 35% sinistra, visualizzazione 65% destra.
- Il grado MCS in numero romano deve essere visualmente grande (almeno 8rem).
- I 4 slider ben spaziati con label leggibili.
- Preset cliccabili in fondo al pannello sinistro.
- Niente spazio nero eccessivo.

### `s4-s12` — Mappa isosismica: riorganizzazione + legenda

**File:** `index.html` (HTML s4-s12), `js/s4-seismograph.js` (`initSlide12`), `css/s4-seismograph.css`

**Riferimento spec:** `_build/master-prompt-s4-new-slides.md` §SLIDE 12.

- Struttura: eyebrow in alto a sinistra + titolo sotto, mappa al centro (70%), legenda a destra (30%).
- **Aggiungere la legenda:** scala MCS XII→I con colori e descrizione sintetica.
- La mappa Leaflet deve essere posizionata correttamente (non flottante a caso).

### `s4-s13` — Slide di transizione: uniformare stile

**File:** `index.html`, `css/s4-seismograph.css`

- Font size del titolo: allinearlo alle altre slide di transizione (riferimento `s1-s6`).
- Stessa struttura: eyebrow, titolo multiriga, sottotitolo, freccia bounce.

---

## Batch 4 — Sezione 5

### `s5-s2` — Formula rischio: layout + ripristino bottoni ingranaggio

**File:** `js/s5-pericolosita.js`, `index.html`, `css/s5-pericolosita.css`

**Riferimento spec:** `_build/master-prompt-s5.md` §SLIDE 2.

- Layout: usare l'intera larghezza (split 50/50: testo sinistra, canvas destra).
- Ripristinare la logica dei tre bottoni:
  - [Riduci Vulnerabilità] → ingranaggio V da 70px a 30px in 1.5s, cerchio rischio rosso → arancio, label appare.
  - [Riduci Valore Esposto] → ingranaggio E da 65px a 25px, cerchio rischio → giallo, label.
  - [Reset — L'Aquila 2009] → tutti tornano alla dimensione massima in 1s, cerchio → --blood, label reset.

### `s5-s3` — Confronto 110 capoluoghi: riduzione riquadro + testo

**File:** `index.html`, `css/s5-pericolosita.css`

- Restringere il rettangolo del confronto rischio: ridurre padding e `max-width`.
- Avvicinare il cerchio/valore numerico al contenitore (eliminare gap eccessivo).
- Parte edifici: restringere il rettangolo, aumentare font size del testo.

### `s5-s5` — PGA: rimozione mappa doppia + spiegazione PGA

**File:** `index.html` (HTML s5-s5), `js/s5-pericolosita.js`, `css/s5-pericolosita.css`

**Rimozione mappa duplicata:** rimuovere il layer/elemento della mappa di tipo slide-1 che sta dietro la mappa PGA.

**Blocco spiegazione PGA** (da aggiungere tra legenda arcobaleno e descrizione colori):
> **PGA — Peak Ground Acceleration** ("picco di accelerazione del suolo"). È il valore massimo di accelerazione che il terreno subisce durante un terremoto, espresso in frazioni di *g* (accelerazione di gravità, 9,81 m/s²). A differenza della magnitudo — che misura l'energia liberata alla sorgente — il PGA descrive **quanto forte trema il suolo in un punto specifico**, ed è il parametro che gli ingegneri usano per progettare edifici antisismici. La mappa di pericolosità nazionale (MPS) esprime il PGA con probabilità di superamento del 10% in 50 anni: più alto il PGA atteso, maggiore la pericolosità.

---

## Batch 5 — Sezione 6 (resto)

### `s6-s2` — Allerta precoce: uso spazio

**File:** `index.html`, `css/s6-rebuild.css`

- Allargare il layout: ridurre la concentrazione orizzontale, usare l'intera larghezza della slide.

### `s6-s4` — I modelli (5 card): ingrandimento leggero

**File:** `index.html`, `css/s6-rebuild.css`

- Aumentare leggermente le dimensioni delle card in entrambe le direzioni (isometria: `scale` CSS o aumento `width`/`height`/`padding`).

### `s6-s10` — Analisi retrospettiva 1908–2016: orientazione

**File:** `index.html`, `css/s6-rebuild.css`

- Riorganizzare la tabella per usare l'intera altezza verticale disponibile; spostare il contenuto verso il centro verticale.

### `s6-s11` — Timeline 31 marzo–6 aprile 2009: layout orizzontale

**File:** `index.html` (HTML), `js/s6-rebuild.js`, `css/s6-rebuild.css`

- Convertire la timeline da verticale a **orizzontale** con asse centrale.
- Punti/eventi alternati sopra e sotto l'asse (uno in alto, uno in basso).
- Distanza dall'asse variabile in base all'importanza dell'evento (es. +80px / +150px sopra, −80px / −150px sotto).
- Ogni punto: data sull'asse + descrizione sopra/sotto.
- Freccia di progressione sull'asse orizzontale.

### `s6-s12` — Ingegneria sismica: layout

**File:** `index.html`, `css/s6-rebuild.css`

- Riorganizzare lo spazio (isolamento alla base, pareti di taglio, ecc.): bilanciare il layout, eliminare disordine.
- Se serve, ingrandire leggermente le card come in `s6-s4`.

### `s6-s14` — Slide di transizione: uniformare stile

**File:** `index.html`, `css/s6-rebuild.css`

- Uniformare al template di transizione (riferimento `s1-s6`): stessi font, stessa dimensione, stessa struttura eyebrow + titolo + freccia.

---

## File modificati per batch

| Batch | File |
|-------|------|
| 0 | `index.html` |
| 1 | `index.html`, `css/s1-science.css`, `js/main.js`, `js/init.js` |
| 2 | `index.html`, `css/s2-epicenter.css`, `js/s2-epicenter.js` |
| 3 | `index.html`, `css/s4-seismograph.css`, `js/s4-seismograph.js` |
| 4 | `index.html`, `css/s5-pericolosita.css`, `js/s5-pericolosita.js` |
| 5 | `index.html`, `css/s6-rebuild.css`, `js/s6-rebuild.js` |

## Dati verificati

- **Intensità MCS L'Aquila 2009:** IX–X epicentrale (Onna 9.5). Usare per `s4-s7` e `s4-s12`.
- **App LastQuake:** App Store `apps.apple.com/app/id890799748` · Google Play `play.google.com/store/apps/details?id=org.emsc_csem.lastquake`.
- **Etimologia:** latino *terraemotus* = *terrae* + *motus*. Greco *seismós* = "scuotimento".
