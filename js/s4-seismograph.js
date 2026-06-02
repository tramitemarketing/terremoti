(function () {
  'use strict';

  // ════════════════════════════════════════
  // DATI HARDCODED
  // ════════════════════════════════════════

  // [1] Sismogramma L'Aquila 2009 — stazione AQU
  const S4_SEISMO_DATA = (function generateAquilaSeismogram() {
    const data = [];
    // Generatore LCG deterministico
    const rng = (function () {
      let s = 42;
      return function () {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 1) / 0x7fffffff - 1;
      };
    })();
    for (let t = 0; t <= 200; t += 0.4) {
      let amp = rng() * 0.005; // rumore microseismico di base
      // Onda P (60-70s)
      if (t >= 60 && t < 70) {
        const dt = t - 60;
        amp += Math.sin(dt * 12) * 0.05 * Math.exp(-dt * 0.8);
      }
      // Onda S (68-82s)
      if (t >= 68 && t < 82) {
        const dt = t - 68;
        amp += Math.sin(dt * 8) * 0.15 * Math.exp(-dt * 0.4);
      }
      // Onde superficiali (79-200s)
      if (t >= 79 && t <= 200) {
        const dt = t - 79;
        amp += Math.sin(dt * 3.5) * 0.80 * Math.exp(-dt / 30);
        amp += Math.sin(dt * 5.2) * 0.35 * Math.exp(-dt / 25);
        amp += Math.sin(dt * 2.1) * 0.20 * Math.exp(-dt / 40);
      }
      data.push({ t: parseFloat(t.toFixed(1)), amp: parseFloat(amp.toFixed(4)) });
    }
    return data;
  })();

  // [2] Tabella frequenze Richter
  const S4_RICHTER_FREQ = [
    { mag: 0, freq: '~8000/giorno' }, { mag: 1, freq: '~4000/giorno' },
    { mag: 1.5, freq: '~2000/giorno' }, { mag: 2, freq: '~1000/giorno' },
    { mag: 2.5, freq: '~400/giorno' }, { mag: 3, freq: '~130/giorno' },
    { mag: 3.5, freq: '~50/giorno' }, { mag: 4, freq: '~15/giorno' },
    { mag: 4.5, freq: '~6/giorno' }, { mag: 5, freq: '2–3/giorno' },
    { mag: 5.5, freq: '~1/giorno' }, { mag: 6, freq: '~120/anno' },
    { mag: 6.5, freq: '~50/anno' }, { mag: 7, freq: '18/anno' },
    { mag: 7.5, freq: '6/anno' }, { mag: 8, freq: '1/anno' },
    { mag: 8.5, freq: '1 ogni 8 anni' }, { mag: 9, freq: '1 ogni 20 anni' },
    { mag: 10, freq: 'evento sconosciuto' }
  ];

  // [3] 20 stazioni INGV con coordinate
  const S4_STAZIONI = [
    { name: 'AQU', lat: 42.354, lon: 13.403 },
    { name: 'MAGA', lat: 40.563, lon: 16.008 },
    { name: 'HVAR', lat: 43.185, lon: 16.443 },
    { name: 'PSAN', lat: 44.521, lon: 11.623 },
    { name: 'VAGA', lat: 42.562, lon: 13.729 },
    { name: 'NRCA', lat: 42.828, lon: 13.117 },
    { name: 'CERT', lat: 42.035, lon: 12.785 },
    { name: 'CESI', lat: 42.589, lon: 12.802 },
    { name: 'TRII', lat: 40.920, lon: 15.073 },
    { name: 'MRVN', lat: 40.730, lon: 15.830 },
    { name: 'MSAG', lat: 38.073, lon: 15.637 },
    { name: 'INTR', lat: 38.185, lon: 13.296 },
    { name: 'ENAS', lat: 37.523, lon: 14.261 },
    { name: 'BEFN', lat: 44.951, lon: 12.006 },
    { name: 'FUSE', lat: 44.203, lon: 11.768 },
    { name: 'CAVE', lat: 45.812, lon: 13.523 },
    { name: 'BRIZ', lat: 46.363, lon: 11.658 },
    { name: 'RADO', lat: 45.683, lon: 9.519 },
    { name: 'VARE', lat: 45.880, lon: 8.817 },
    { name: 'SRM', lat: 37.752, lon: 12.583 }
  ];

  // [4] Stazioni per triangolazione (slide 9)
  const S4_TRIA_STA = [
    { name: "AQU · L'Aquila", lat: 42.3540, lon: 13.4028, defaultDt: 0.8 },
    { name: 'CESI · Terni', lat: 42.5890, lon: 12.8020, defaultDt: 9.4 },
    { name: 'CERT · Roma nord', lat: 42.0350, lon: 12.7850, defaultDt: 11.2 },
    { name: 'VAGA', lat: 42.5620, lon: 13.7290, defaultDt: 5.1 }
  ];

  // [5] Descrizioni MCS per ogni grado I–XII (arricchite)
  const S4_MCS_DESC = [
    '',
    'Strumentale. Non percepito dall\'uomo in nessuna condizione. Registrato solo dagli strumenti sismografici più sensibili.',
    'Molto leggero. Percepito soltanto da persone particolarmente sensibili, in stato di riposo e ai piani alti. Oscillazione lieve degli oggetti appesi.',
    'Leggero. Avvertito da molte persone in casa, soprattutto ai piani superiori. Vibrazione simile al passaggio di un camion pesante. Oggetti appesi oscillano visibilmente.',
    'Moderato. Avvertito chiaramente all\'interno degli edifici da molte persone. Tintinnio di stoviglie e vetri. Scricchiolio di porte e pareti. Qualche persona si sveglia di notte.',
    'Abbastanza forte. Avvertito da quasi tutti; molte persone si svegliano dal sonno. Qualche caduta di intonaco. Gli alberi oscillano. Campanelli suonano. Pendoli degli orologi si arrestano.',
    'Forte. Avvertito da tutti con spavento. Molte persone fuggono all\'aperto. Caduta di oggetti. Danni leggeri in edifici di cattiva costruzione. Lesioni a camini.',
    'Molto forte. Panico generale. Caduta di intonaci e mattoni. Tegole scivolate. Rottura di vetri. Piccole frane su terreni in pendio. Danni a edifici di costruzione ordinaria.',
    'Rovinoso. Danni anche a edifici ben costruiti. Caduta di comignoli, monumenti, colonne. Crepacci nel suolo. Gravi danni a dighe e argini. Rami di alberi spezzati.',
    'Devastante. Distrugge edifici non resistenti. Gravi danni agli edifici ben costruiti. Fondamenta spostate. Tubazioni rotte. Ampie e profonde fratture nel terreno.',
    'Completamente devastante. Rovina quasi tutti gli edifici. Grandi frane. L\'acqua dei laghi e dei fiumi tracima. Binari ferroviari piegati. Catastrofe.',
    'Catastrofe. Rovina totale. Ogni opera umana distrutta. Vaste aree abbassano il suolo. Fenditure estese con rigetti verticali. Molte vittime.',
    'Catastrofe massima. Modifica il paesaggio. Sposta grandi masse rocciose. Onde sulle superfici dei laghi e dei fiumi. Migliaia di vittime. Irreparabile.'
  ];

  // [6] Poligoni isosismici approssimati (slide 12)
  // Coordinate concentriche attorno all'epicentro (42.342°N 13.380°E)
  // Ogni zona è contenuta nella successiva — nessuna sovrapposizione
  const S4_ISO_ZONES = [
    {
      grade: 10, label: 'X — Distruttivo', color: '#4a0000', opacity: 0.80,
      zones: ['L\'Aquila centro storico', 'Onna', 'Paganica'],
      popup: 'Centro storico di L\'Aquila, Onna, Paganica. MCS X — distruzione quasi totale.',
      coords: [[42.310, 13.348], [42.348, 13.345], [42.378, 13.362], [42.382, 13.398], [42.362, 13.425], [42.330, 13.428], [42.305, 13.408], [42.300, 13.372]]
    },
    {
      grade: 9, label: 'IX — Molto forte', color: '#8B1A1A', opacity: 0.72,
      zones: ['Poggio Picenze', 'San Gregorio', 'Roio'],
      popup: 'Comuni limitrofi all\'epicentro. Danni gravi a murature.',
      coords: [[42.230, 13.272], [42.348, 13.258], [42.448, 13.295], [42.475, 13.378], [42.460, 13.468], [42.392, 13.518], [42.290, 13.510], [42.210, 13.458], [42.185, 13.365]]
    },
    {
      grade: 8, label: 'VIII — Molto forte', color: '#C4612A', opacity: 0.62,
      zones: ['Pizzoli', 'Barete', 'Cagnano Amiterno'],
      popup: 'Pizzoli, Barete, Cagnano Amiterno. Danni strutturali diffusi.',
      coords: [[42.092, 13.118], [42.348, 13.055], [42.618, 13.082], [42.755, 13.225], [42.772, 13.498], [42.672, 13.672], [42.422, 13.768], [42.100, 13.718], [41.948, 13.518], [41.882, 13.258]]
    },
    {
      grade: 7, label: 'VII — Forte', color: '#D4893A', opacity: 0.52,
      zones: ['Area Sulmona', 'Avezzano', 'Teramo'],
      popup: 'Sulmona, Avezzano, Teramo. Danni locali, panico diffuso.',
      coords: [[41.818, 12.778], [42.348, 12.618], [42.948, 12.748], [43.218, 13.178], [43.182, 13.848], [42.848, 14.178], [42.298, 14.218], [41.878, 13.978], [41.598, 13.448], [41.578, 12.998]]
    },
    {
      grade: 6, label: 'VI — Moderato', color: '#8B8B00', opacity: 0.42,
      zones: ['Pescara', 'Rieti'],
      popup: 'Pescara, Rieti. Percepito nettamente, danni lievi.',
      coords: [[41.548, 12.218], [42.348, 12.038], [43.388, 12.248], [43.748, 12.898], [43.688, 14.108], [43.308, 14.728], [42.348, 14.808], [41.658, 14.448], [41.188, 13.618], [41.118, 12.878]]
    },
    {
      grade: 5, label: 'V — Avvertito', color: '#4a6a4a', opacity: 0.32,
      zones: ['Roma'],
      popup: 'Roma e circondario. Avvertito da molti, nessun danno.',
      coords: [[40.998, 11.448], [42.348, 11.148], [43.928, 11.578], [44.428, 12.648], [44.288, 14.418], [43.648, 15.488], [42.008, 15.548], [40.788, 14.778], [40.198, 13.448], [40.378, 12.098]]
    }
  ];

  // ════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ════════════════════════════════════════

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function toRoman(n) {
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
      while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
    }
    return result;
  }

  function formatJoules(E) {
    if (E <= 0) return '0 J';
    const exp = Math.floor(Math.log10(E));
    const mantissa = E / Math.pow(10, exp);
    return mantissa.toFixed(2) + ' &times; 10<sup>' + exp + '</sup> J';
  }

  function mcsColor(grade) {
    if (grade <= 3) return '#4CAF50';
    if (grade <= 5) return '#D4893A';
    if (grade <= 7) return '#C4612A';
    if (grade <= 9) return '#8B1A1A';
    return '#4a0000';
  }

  function getRichterFreq(mag) {
    // Trova la voce più vicina nella tabella
    let best = S4_RICHTER_FREQ[0];
    let bestDiff = Math.abs(mag - best.mag);
    for (let i = 1; i < S4_RICHTER_FREQ.length; i++) {
      const diff = Math.abs(mag - S4_RICHTER_FREQ[i].mag);
      if (diff < bestDiff) { bestDiff = diff; best = S4_RICHTER_FREQ[i]; }
    }
    return best.freq;
  }

  // ════════════════════════════════════════
  // STATO GLOBALE
  // ════════════════════════════════════════
  let s4CurrentSlide = 0;
  const S4_TOTAL = 13;
  let s4IsAnimating = false;

  // Flag lazy-init per mappe Leaflet
  let s4Map9Inited = false;
  let s4Map12Inited = false;
  let s4Map9Instance = null;
  let s4Map12Instance = null;

  // Handles per cancelAnimationFrame
  const s4Loops = {};

  // Flag per slide già inizializzate
  const s4SlideInited = {};

  // ════════════════════════════════════════
  // CAROSELLO PRINCIPALE
  // ════════════════════════════════════════

  function goTo(idx, animate) {
    if (animate === undefined) animate = true;
    if (idx < 0 || idx >= S4_TOTAL) return;
    if (s4IsAnimating && animate) return;

    // Ferma i loop della slide precedente
    stopSlideLoop(s4CurrentSlide);

    s4CurrentSlide = idx;

    const track = document.getElementById('s4-track');
    if (!track) return;

    if (animate) {
      s4IsAnimating = true;
      track.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = 'translateX(-' + (idx * 100) + 'vw)';

    // Aggiorna dots
    document.querySelectorAll('.s4-dot').forEach(function (d) {
      d.classList.toggle('s4-active', parseInt(d.dataset.dot) === idx);
    });

    // Aggiorna counter (formato "01 · 13" come s1/s3)
    const counter = document.getElementById('s4-counter');
    if (counter) counter.textContent = String(idx + 1).padStart(2, '0') + ' · ' + String(S4_TOTAL).padStart(2, '0');

    // Aggiorna frecce — disabled toggling, la visibilità è gestita via CSS :hover
    const prev = document.getElementById('s4-prev');
    const next = document.getElementById('s4-next');
    if (prev) { prev.disabled = idx === 0; }
    if (next) { next.disabled = idx === S4_TOTAL - 1; }

    // Fine animazione
    setTimeout(function () {
      s4IsAnimating = false;
      // Avvia logica slide corrente
      activateSlide(idx);
    }, animate ? 420 : 0);
  }

  function stopSlideLoop(idx) {
    // Ferma il loop canvas della slide indicata
    if (s4Loops['slide' + idx]) {
      cancelAnimationFrame(s4Loops['slide' + idx]);
      delete s4Loops['slide' + idx];
    }
    // Pausa player slide 2
    if (idx === 1) {
      if (s4AnimState) s4AnimState.playing = false;
    }
    // Pausa sismografo live slide 0
    if (idx === 0) {
      if (s4SeismoState) s4SeismoState.running = false;
    }
  }

  function activateSlide(idx) {
    switch (idx) {
      case 0: initSlide1(); break;
      case 1: initSlide2(); break;
      case 2: initSlide3(); break;
      case 3: initSlide4(); break;
      case 4: initSlide5(); break;
      case 5: initSlide6(); break;
      case 6: initSlide7(); break;
      case 7: /* slide 8 statica */ break;
      case 8: initSlide9(); break;
      case 9: initSlide10(); break;
      case 10: initSlide11(); break;
      case 11: initSlide12(); break;
      case 12: /* slide 13 statica */ break;
    }
  }

  // ════════════════════════════════════════
  // SLIDE 1 — SISMOGRAFO LIVE
  // ════════════════════════════════════════

  let s4SeismoState = null;

  function initSlide1() {
    if (s4SlideInited[0]) {
      if (s4SeismoState) {
        // Ridimensiona il canvas prima di riavviare
        const cvs = document.getElementById('s4-seismo-canvas');
        if (cvs && cvs.offsetWidth > 0) {
          const dpr2 = window.devicePixelRatio || 1;
          if (cvs.width !== Math.round(cvs.offsetWidth * dpr2)) {
            cvs.width = Math.round(cvs.offsetWidth * dpr2);
            cvs.height = Math.round(cvs.offsetHeight * dpr2) || 300 * dpr2;
          }
        }
        s4SeismoState.running = true;
        requestAnimationFrame(seismoLoop);
      }
      return;
    }
    s4SlideInited[0] = true;

    const canvas = document.getElementById('s4-seismo-canvas');
    if (!canvas) return;
    // Inizializza dimensioni canvas con DPR corretto
    (function resizeSeismoCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth || 800;
      const h = canvas.offsetHeight || 300;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    })();
    const ctx = canvas.getContext('2d');

    // Stato sismografo
    s4SeismoState = {
      mode: 'live',        // 'live' o '2009'
      running: true,
      speed: 1,            // ×1 ×2 ×5
      liveBuffer: [],      // dati live (rumore o IRIS)
      liveSimulated: true,
      seismo2009Pos: 0,    // indice corrente in S4_SEISMO_DATA
      lastFetch: 0,
      rng: (function () { let s = 99; return function () { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 1) / 0x7fffffff - 1; }; })(),
      phase2009: 0,        // posizione temporale animazione 2009 (in punti/frame)
      noisePhase: 0,
      eventActive: false,
      eventTimer: 0
    };

    // Ridimensiona canvas con DPR support
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.offsetWidth || 800;
      const cssH = canvas.offsetHeight || 320;
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width  = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();

    // Genera rumore sintetico realistico
    function generateNoiseSample(st) {
      const r = st.rng;
      let v = r() * 0.005;
      v += Math.sin(st.noisePhase * 0.031) * 0.003;
      v += Math.sin(st.noisePhase * 0.017) * 0.002;
      st.noisePhase++;
      return v;
    }

    // Inizializza buffer live con abbastanza campioni da riempire subito il canvas
    const initBufSize = Math.max(canvas.offsetWidth || 800, 800);
    for (let i = 0; i < initBufSize; i++) {
      s4SeismoState.liveBuffer.push(generateNoiseSample(s4SeismoState));
    }

    // Fetch IRIS con fallback
    function fetchIRIS() {
      const _autoFallback = setTimeout(function() {
        if (s4SeismoState && s4SeismoState.liveSimulated && s4SeismoState.mode === 'live') {
          s4SeismoState.mode = '2009';
          s4SeismoState.seismo2009Pos = 0;
          const btnLive = document.getElementById('s4-mode-live');
          const btn2009 = document.getElementById('s4-mode-2009');
          if (btnLive) { btnLive.classList.remove('s4-mode-active'); btnLive.setAttribute('aria-pressed', 'false'); }
          if (btn2009) { btn2009.classList.add('s4-mode-active'); btn2009.setAttribute('aria-pressed', 'true'); }
          const irisStatus = document.getElementById('s4-iris-status');
          if (irisStatus) { irisStatus.textContent = 'NON DISPONIBILE · Visualizzo 6 apr 2009'; irisStatus.classList.add('visible'); }
          const speedCtrl = document.getElementById('s4-speed-ctrl');
          if (speedCtrl) speedCtrl.style.display = 'flex';
          const liveDot = document.getElementById('s4-live-dot');
          if (liveDot) liveDot.classList.add('simulated');
        }
      }, 10000);

      const now = new Date();
      const end = now.toISOString().replace(/\.\d+Z$/, 'Z');
      const start = new Date(now - 5 * 60000).toISOString().replace(/\.\d+Z$/, 'Z');
      const url = 'https://service.iris.edu/irisws/timeseries/1/query?net=IV&sta=AQU&loc=--&cha=HHZ&starttime=' + start + '&endtime=' + end + '&output=ascii&demean=true';

      const controller = new AbortController();
      const timeout = setTimeout(function () { controller.abort(); }, 5000);

      fetch(url, { signal: controller.signal })
        .then(function (r) { return r.text(); })
        .then(function (text) {
          clearTimeout(timeout);
          clearTimeout(_autoFallback);
          const lines = text.trim().split('\n');
          const vals = [];
          lines.forEach(function (line) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              const v = parseFloat(parts[1]);
              if (!isNaN(v)) vals.push(v);
            }
          });
          if (vals.length > 50) {
            // Normalizza
            let mx = 0;
            vals.forEach(function (v) { if (Math.abs(v) > mx) mx = Math.abs(v); });
            if (mx === 0) mx = 1;
            s4SeismoState.liveBuffer = vals.map(function (v) { return v / mx; });
            s4SeismoState.liveSimulated = false;
            const irisStatus = document.getElementById('s4-iris-status');
            const liveDot = document.getElementById('s4-live-dot');
            if (irisStatus) irisStatus.classList.remove('visible');
            if (liveDot) liveDot.classList.remove('simulated');
            const lbl = document.getElementById('s4-sim-label');
            if (lbl) lbl.style.display = 'none';
            const lu = document.getElementById('s4-last-update');
            if (lu) lu.textContent = new Date().toLocaleTimeString('it-IT');
          }
        })
        .catch(function () {
          clearTimeout(timeout);
          clearTimeout(_autoFallback);
          // Fallback: continua con rumore sintetico
          const irisStatus = document.getElementById('s4-iris-status');
          const liveDot = document.getElementById('s4-live-dot');
          if (irisStatus) irisStatus.classList.add('visible');
          if (liveDot) liveDot.classList.add('simulated');
          const lbl = document.getElementById('s4-sim-label');
          if (lbl) lbl.style.display = 'block';
        });
    }

    // Fetch iniziale e ogni 30s
    if (s4SeismoState.mode === 'live') fetchIRIS();
    const fetchInterval = setInterval(function () {
      if (s4SeismoState && s4SeismoState.mode === 'live') fetchIRIS();
    }, 30000);
    // Salva interval per cleanup eventuale
    s4SeismoState.fetchInterval = fetchInterval;

    // Loop di rendering
    let s4SeismoLastTime = 0;
    let s4SeismoAccum = 0;

    function seismoLoop(ts) {
      if (!s4SeismoState || !s4SeismoState.running) return;
      s4Loops['slide0'] = requestAnimationFrame(seismoLoop);

      const dt = ts - s4SeismoLastTime;
      s4SeismoLastTime = ts;
      if (dt > 200) return; // primo frame o tab blur

      const dpr = window.devicePixelRatio || 1;
      const W = Math.round(canvas.width / dpr);
      const H = Math.round(canvas.height / dpr);
      if (W < 10 || H < 10) { s4Loops['slide0'] = requestAnimationFrame(seismoLoop); return; }
      const ctx2 = ctx;

      ctx2.clearRect(0, 0, W, H);

      // Sfondo
      ctx2.fillStyle = '#050505';
      ctx2.fillRect(0, 0, W, H);

      // Scala ampiezza sinistra (0.5 mm, 1.0 mm illustrativi)
      const SCALE_W = 40; // larghezza colonna scala
      const ampLevels = [0.5, 1.0];
      ctx2.strokeStyle = 'rgba(245,237,224,0.06)';
      ctx2.setLineDash([2, 6]);
      ctx2.lineWidth = 0.5;
      ampLevels.forEach(function (a) {
        const yp = H / 2 - a * (H / 2 - 8);
        const yn = H / 2 + a * (H / 2 - 8);
        ctx2.beginPath(); ctx2.moveTo(SCALE_W, yp); ctx2.lineTo(W, yp); ctx2.stroke();
        ctx2.beginPath(); ctx2.moveTo(SCALE_W, yn); ctx2.lineTo(W, yn); ctx2.stroke();
      });
      ctx2.setLineDash([]);
      ctx2.font = '8px "JetBrains Mono", monospace';
      ctx2.fillStyle = 'rgba(245,237,224,0.30)';
      ctx2.textAlign = 'right';
      ctx2.textBaseline = 'middle';
      ampLevels.forEach(function (a) {
        const yp = H / 2 - a * (H / 2 - 8);
        const yn = H / 2 + a * (H / 2 - 8);
        ctx2.fillText('+' + a.toFixed(1), SCALE_W - 3, yp);
        ctx2.fillText('-' + a.toFixed(1), SCALE_W - 3, yn);
      });
      // Label unità μm
      ctx2.font = '8px "JetBrains Mono", monospace';
      ctx2.fillStyle = 'rgba(245,237,224,0.40)';
      ctx2.textAlign = 'left';
      ctx2.fillText('μm', 2, 14);
      ctx2.textBaseline = 'alphabetic';

      // Griglia orizzontale
      ctx2.strokeStyle = '#1a1a1a';
      ctx2.lineWidth = 1;
      const gridStep = H / 8;
      for (let y = 0; y < H; y += gridStep) {
        ctx2.beginPath();
        ctx2.moveTo(SCALE_W, y);
        ctx2.lineTo(W, y);
        ctx2.stroke();
      }

      // Linea zero centrale tratteggiata
      ctx2.strokeStyle = '#2a2a2a';
      ctx2.setLineDash([4, 8]);
      ctx2.beginPath();
      ctx2.moveTo(SCALE_W, H / 2);
      ctx2.lineTo(W, H / 2);
      ctx2.stroke();
      ctx2.setLineDash([]);

      if (s4SeismoState.mode === 'live') {
        // Accodi nuovo rumore
        s4SeismoAccum += dt * 0.06 * s4SeismoState.speed;
        while (s4SeismoAccum >= 1) {
          s4SeismoAccum -= 1;
          s4SeismoState.liveBuffer.push(generateNoiseSample(s4SeismoState));
          if (s4SeismoState.liveBuffer.length > W * 2) {
            s4SeismoState.liveBuffer.shift();
          }
        }

        // Calcola σ per rilevamento evento
        const slice = s4SeismoState.liveBuffer.slice(-W);
        let mean = 0, variance = 0;
        slice.forEach(function (v) { mean += v; });
        mean /= slice.length;
        slice.forEach(function (v) { variance += (v - mean) ** 2; });
        const sigma = Math.sqrt(variance / slice.length);
        const lastAmp = slice[slice.length - 1];
        const eventDetected = Math.abs(lastAmp) > 3 * sigma && sigma > 0.001;

        if (eventDetected && !s4SeismoState.eventActive) {
          s4SeismoState.eventActive = true;
          s4SeismoState.eventTimer = 60;
          const evLbl = document.getElementById('s4-event-label');
          if (evLbl) { evLbl.style.display = 'block'; evLbl.style.opacity = '1'; }
        }
        if (s4SeismoState.eventTimer > 0) {
          s4SeismoState.eventTimer--;
          if (s4SeismoState.eventTimer === 0) {
            s4SeismoState.eventActive = false;
            const evLbl = document.getElementById('s4-event-label');
            if (evLbl) evLbl.style.display = 'none';
          }
        }

        // Disegna tracciato live — scala orizzontale su larghezza intera
        const lineColor = s4SeismoState.eventActive ? '#C4612A' : '#F5EDE0';
        ctx2.strokeStyle = lineColor;
        ctx2.lineWidth = 1.5;
        ctx2.beginPath();
        const pts = slice;
        const traceW = W - SCALE_W;
        for (let i = 0; i < pts.length; i++) {
          const x = SCALE_W + (i / Math.max(pts.length - 1, 1)) * traceW;
          const y = H / 2 - pts[i] * (H / 2 - 8);
          if (i === 0) ctx2.moveTo(x, y);
          else ctx2.lineTo(x, y);
        }
        ctx2.stroke();

        // Flash canvas se evento
        if (s4SeismoState.eventActive) {
          ctx2.fillStyle = 'rgba(196,97,42,0.08)';
          ctx2.fillRect(0, 0, W, H);
        }

      } else {
        // Modalità 2009
        const spd = s4SeismoState.speed;
        s4SeismoAccum += dt * 0.05 * spd;
        while (s4SeismoAccum >= 1) {
          s4SeismoAccum -= 1;
          s4SeismoState.seismo2009Pos++;
          if (s4SeismoState.seismo2009Pos >= S4_SEISMO_DATA.length) {
            s4SeismoState.seismo2009Pos = 0;
          }
        }

        // Mostra finestra scorrevole di W punti centrata su pos
        const pos = s4SeismoState.seismo2009Pos;
        const totalPts = S4_SEISMO_DATA.length;
        const windowSize = Math.min(W, totalPts);

        ctx2.strokeStyle = '#F5EDE0';
        ctx2.lineWidth = 1.2;
        ctx2.beginPath();
        for (let i = 0; i < windowSize; i++) {
          const dataIdx = (pos - windowSize + i + totalPts) % totalPts;
          const d = S4_SEISMO_DATA[dataIdx];
          const x = (i / windowSize) * W;
          const y = H / 2 - d.amp * (H / 2 - 8);
          if (i === 0) ctx2.moveTo(x, y);
          else ctx2.lineTo(x, y);
        }
        ctx2.stroke();

        // Marker P, S, SUP
        const markerInfo = [
          { t: 60, label: 'P · 03:32:41', color: '#C4612A' },
          { t: 68, label: 'S · 03:32:49', color: '#3A7EC4' },
          { t: 79, label: 'Superficiali · 03:33:00', color: '#D4893A' }
        ];
        const mkContainer = document.getElementById('s4-markers-2009');
        if (mkContainer) {
          const startT = S4_SEISMO_DATA[pos >= windowSize ? (pos - windowSize + totalPts) % totalPts : 0].t;
          const endT = S4_SEISMO_DATA[pos].t || 200;
          // Gestione marker overlay è statica nello HTML — aggiorna visibilità
          const mkp = document.getElementById('s4-mk-p');
          const mks = document.getElementById('s4-mk-s');
          const mksup = document.getElementById('s4-mk-sup');
          const inWindow = function (t) {
            const tStart = S4_SEISMO_DATA[Math.max(0, (pos - windowSize + totalPts) % totalPts)].t;
            const tEnd = S4_SEISMO_DATA[pos].t;
            return t >= tStart && t <= tEnd;
          };
          if (mkp) mkp.style.display = 'block';
          if (mks) mks.style.display = 'block';
          if (mksup) mksup.style.display = 'block';

          // Disegna marker verticali sul canvas
          markerInfo.forEach(function (mk) {
            // Trova x proporzionale
            const tRelStart = S4_SEISMO_DATA[Math.max(0, (pos - windowSize + totalPts) % totalPts)].t;
            const tRelEnd = S4_SEISMO_DATA[pos].t;
            const tRange = tRelEnd - tRelStart;
            if (tRange <= 0) return;
            if (mk.t < tRelStart || mk.t > tRelEnd) return;
            const xPos = ((mk.t - tRelStart) / tRange) * W;
            ctx2.save();
            ctx2.strokeStyle = mk.color;
            ctx2.lineWidth = 1.5;
            ctx2.setLineDash([4, 4]);
            ctx2.beginPath();
            ctx2.moveTo(xPos, 0);
            ctx2.lineTo(xPos, H);
            ctx2.stroke();
            ctx2.setLineDash([]);
            ctx2.fillStyle = mk.color;
            ctx2.font = '10px JetBrains Mono, monospace';
            ctx2.fillText(mk.label, xPos + 3, 16);
            ctx2.restore();
          });
        }
      }
    }

    seismoLoop(0);

    // Toggle live / 2009
    const btnLive = document.getElementById('s4-mode-live');
    const btn2009 = document.getElementById('s4-mode-2009');
    if (btnLive) btnLive.addEventListener('click', function () {
      s4SeismoState.mode = 'live';
      btnLive.classList.add('s4-toggle--active');
      if (btn2009) btn2009.classList.remove('s4-toggle--active');
      const mk = document.getElementById('s4-markers-2009');
      if (mk) mk.style.display = 'none';
      const spd = document.getElementById('s4-speed-btns');
      if (spd) spd.style.display = 'none';
      const lbl = document.getElementById('s4-mode-label');
      if (lbl) lbl.textContent = 'Live';
      const irisStatus = document.getElementById('s4-iris-status');
      if (irisStatus) irisStatus.classList.remove('visible');
      const liveDot = document.getElementById('s4-live-dot');
      if (liveDot) liveDot.classList.remove('simulated');
    });
    if (btn2009) btn2009.addEventListener('click', function () {
      s4SeismoState.mode = '2009';
      btn2009.classList.add('s4-toggle--active');
      if (btnLive) btnLive.classList.remove('s4-toggle--active');
      s4SeismoState.seismo2009Pos = 0;
      const mk = document.getElementById('s4-markers-2009');
      if (mk) mk.style.display = 'block';
      const spd = document.getElementById('s4-speed-btns');
      if (spd) spd.style.display = 'flex';
      const lbl = document.getElementById('s4-mode-label');
      if (lbl) lbl.textContent = '6 apr 2009';
    });

    // Bottoni velocità
    document.querySelectorAll('.s4-speed-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        s4SeismoState.speed = parseFloat(btn.dataset.spd) || 1;
        document.querySelectorAll('.s4-speed-btn').forEach(function (b) { b.classList.remove('s4-speed--active'); });
        btn.classList.add('s4-speed--active');
      });
    });
  }

  // ════════════════════════════════════════
  // SLIDE 2 — ANIMAZIONE SISMOGRAFO
  // ════════════════════════════════════════

  let s4AnimState = null;

  function initSlide2() {
    if (s4SlideInited[1] && s4AnimState) {
      // rientro nella slide: non auto-avviare, mostra stato corrente
      drawSismograph(0, 0);
      return;
    }
    s4SlideInited[1] = true;

    const canvas = document.getElementById('s4-anim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width = canvas.offsetWidth || 460;
    const H = canvas.height = canvas.offsetHeight || 380;

    s4AnimState = {
      playing: false,
      phase: 0,       // 0=silenzio, 1=scossa, 2=lettura
      phaseT: 0,      // tempo dentro la fase (ms)
      totalT: 0,      // tempo totale
      supportX: 0,    // oscillazione supporto
      massX: 0,       // posizione massa
      massV: 0,       // velocità massa
      trace: [],      // tracciato pennino
      lastTs: 0
    };

    const VSCALE = 0.85;

    const playBtn = document.getElementById('s4-anim-play');
    if (playBtn) {
      playBtn.textContent = '▶ Avvia';
      playBtn.addEventListener('click', function () {
        s4AnimState.playing = !s4AnimState.playing;
        playBtn.textContent = s4AnimState.playing ? '⏸ Pausa' : '▶ Avvia';
        if (s4AnimState.playing) requestAnimationFrame(animSismoLoop);
      });
    }

    function drawSismograph(supportOscY, massOscY) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      const cream = '#F5EDE0';
      const terra = '#C4612A';
      const ochre = '#D4893A';
      const charcoal = '#181818';

      // ── Layout: supporto + rullo oscillano verticalmente con il suolo ──
      const cx      = 148;
      const supW    = 74;  const supH = 160;
      const baseY   = H - 40 + supportOscY * 0.50;
      const supLeft = cx - supW / 2;
      const supTop  = baseY - supH;

      const rollX   = cx + 80;
      const rollW   = 210;
      const rollH   = 190;
      const rollTop = supTop - 6;

      // massa: ferma nel canvas (inerzia), oscillazione massOscY piccola
      const massR     = 18;
      const massRestY = (H - 40 - supH - 6) + rollH / 2;
      const massDrawY = massRestY + massOscY;

      // ── Suolo ──
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, baseY, cx + supW / 2 + 6, H);

      // ── Supporto ──
      ctx.fillStyle = charcoal;
      ctx.strokeStyle = cream;
      ctx.lineWidth = 1.5;
      ctx.fillRect(supLeft, supTop, supW, supH);
      ctx.strokeRect(supLeft, supTop, supW, supH);
      ctx.fillStyle = '#222';
      ctx.fillRect(supLeft - 14, supTop - 5, supW + 28, 10);
      ctx.strokeRect(supLeft - 14, supTop - 5, supW + 28, 10);

      // ── Molla (si deforma: topY con supporto, bottomY con massa) ──
      const springTopY = supTop + 12;
      const springBotY = massDrawY - massR;
      ctx.strokeStyle = cream;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, springTopY);
      const coils = 8;
      for (let i = 1; i <= coils; i++) {
        const frac = i / coils;
        const sy = springTopY + frac * (springBotY - springTopY);
        const sx = cx + (i % 2 === 0 ? 0 : (i % 4 < 2 ? 9 : -9));
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(cx, springBotY);
      ctx.stroke();

      // ── Massa ──
      ctx.beginPath();
      ctx.arc(cx, massDrawY, massR, 0, Math.PI * 2);
      ctx.fillStyle = '#2c2c2c';
      ctx.fill();
      ctx.strokeStyle = cream;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Rullo carta (solidale col supporto) ──
      ctx.fillStyle = '#f0e8d0';
      ctx.strokeStyle = '#c8b888';
      ctx.lineWidth = 1;
      ctx.fillRect(rollX, rollTop, rollW, rollH);
      ctx.strokeRect(rollX, rollTop, rollW, rollH);
      for (let l = rollTop + 4; l < rollTop + rollH - 2; l += 7) {
        ctx.strokeStyle = 'rgba(0,0,0,0.045)';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(rollX, l);
        ctx.lineTo(rollX + rollW, l);
        ctx.stroke();
      }

      // ── Annotazioni intestazione sismogramma ──
      ctx.save();
      ctx.font = '500 6.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillText('INGV · AQU', rollX + 5, rollTop + 13);
      ctx.fillText('BHZ  Z', rollX + 5, rollTop + 23);
      ctx.font = '400 5.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillText('06/04/2009', rollX + 5, rollTop + rollH - 16);
      ctx.fillText('03:32 UTC', rollX + 5, rollTop + rollH - 7);
      const zeroY = rollTop + rollH / 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(rollX + 2, zeroY);
      ctx.lineTo(rollX + rollW - 2, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── Tracciato: newest a DESTRA (punta pennino), scorre verso sinistra ──
      if (s4AnimState.trace.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rollX + 2, rollTop + 28, rollW - 4, rollH - 56);
        ctx.clip();
        ctx.strokeStyle = terra;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const newestT    = s4AnimState.trace[s4AnimState.trace.length - 1].t;
        const traceRight = rollX + rollW - 3;
        const PPU = 1.0;
        s4AnimState.trace.forEach(function(pt, i) {
          const tx = traceRight - (newestT - pt.t) * PPU;
          const ty = rollTop + rollH / 2 + pt.y;
          if (i === 0) ctx.moveTo(tx, ty);
          else         ctx.lineTo(tx, ty);
        });
        ctx.stroke();
        ctx.restore();
      }

      // ── Pennino: da massa fino al BORDO DESTRO del rullo (punto di scrittura) ──
      const penY = massDrawY;
      ctx.strokeStyle = ochre;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + massR, penY);
      ctx.lineTo(rollX + rollW, penY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rollX + rollW, penY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ochre;
      ctx.fill();

      // ── Cap cilindrici rullo ──
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rollX + rollW / 2, rollTop, rollW / 2, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(rollX + rollW / 2, rollTop + rollH, rollW / 2, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    let traceScroll = 0;

    function animSismoLoop(ts) {
      if (!s4AnimState || !s4AnimState.playing) return;
      s4Loops['slide1'] = requestAnimationFrame(animSismoLoop);

      const dt = ts - s4AnimState.lastTs;
      s4AnimState.lastTs = ts;
      if (dt > 200) return;

      s4AnimState.phaseT += dt;
      s4AnimState.totalT += dt;

      const t = s4AnimState.totalT / 1000;

      // Loop: dopo 22 s riparte
      if (t > 22) { s4AnimState.totalT = 0; s4AnimState.trace = []; traceScroll = 0; }

      // ── Envelope ampiezza — profilo L'Aquila (P → S → superficiali → decay) ──
      let amp;
      if      (t < 1.5)  amp = 0;
      else if (t < 3.5)  amp = 2  * (t - 1.5) / 2;
      else if (t < 6.5)  amp = 2  + 18 * (t - 3.5) / 3;
      else if (t < 9.5)  amp = 20;
      else               amp = 20 * Math.exp(-(t - 9.5) * 0.42);

      const massOscY    = amp * Math.sin(t * 6.5) * VSCALE;
      // terreno oscilla SOLO durante le onde superficiali al picco
      const supportOscY = (t > 6.5 && t < 9.5) ? amp * 0.30 * Math.sin(t * 6.5) : 0;

      traceScroll += dt * 0.014;
      s4AnimState.trace.push({ t: traceScroll, y: massOscY });
      if (s4AnimState.trace.length > 1100) s4AnimState.trace.shift();

      // Label dinamica per ogni fase
      const lbl = document.getElementById('s4-anim-label');
      if (lbl) {
        let msg;
        if      (t < 1.5)  msg = 'Terreno fermo — il pendolo è in quiete';
        else if (t < 3.5)  msg = 'Onde P in arrivo — prime piccole oscillazioni';
        else if (t < 6.5)  msg = 'Onde S — ampiezza in crescita';
        else if (t < 9.5)  msg = 'Onde superficiali — scossa principale · il terreno si muove';
        else               msg = 'Smorzamento — il pendolo torna lentamente alla quiete';
        if (lbl.textContent !== msg) lbl.textContent = msg;
      }

      drawSismograph(supportOscY, massOscY);
    }

    // Mostra stato fermo in attesa del click
    drawSismograph(0, 0);
  }

  // ════════════════════════════════════════
  // SLIDE 3 — STORIA (sub-carousel)
  // ════════════════════════════════════════

  let s4HistIdx = 0;

  function initSlide3() {
    // Le card sono ora in una grid 3×2 sempre visibile — nessun sub-carosello
    s4SlideInited[2] = true;
  }

  // ════════════════════════════════════════
  // SLIDE 4 — LEGGI IL SISMOGRAMMA
  // ════════════════════════════════════════

  let s4ReadState = null;

  function initSlide4() {
    if (s4SlideInited[3] && s4ReadState) return;
    s4SlideInited[3] = true;

    const canvas = document.getElementById('s4-read-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Canvas fills its flex parent — read rendered size
    const W = canvas.width = canvas.offsetWidth || 800;
    const H = canvas.height = Math.max(canvas.offsetHeight, 200) || 280;

    // Posizioni iniziali dei marker (in pixel X, non corrette)
    s4ReadState = {
      markers: [
        { id: 'P', x: W * 0.25, color: '#C4612A', label: 'P' },
        { id: 'S', x: W * 0.45, color: '#3A7EC4', label: 'S' },
        { id: 'SUP', x: W * 0.65, color: '#D4893A', label: 'SUP' }
      ],
      dragging: -1,
      verified: false
    };

    // Mappa pixel X → tempo in secondi del sismogramma
    const tMin = S4_SEISMO_DATA[0].t;
    const tMax = S4_SEISMO_DATA[S4_SEISMO_DATA.length - 1].t;

    function xToT(x) { return tMin + (x / W) * (tMax - tMin); }
    function tToX(t) { return ((t - tMin) / (tMax - tMin)) * W; }

    // Posizioni reali (secondi)
    const realP = 60, realS = 68, realSup = 79;

    function drawAll() {
      ctx.clearRect(0, 0, W, H);
      // Sfondo
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);

      // Griglia
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let yy = 0; yy < H; yy += H / 8) {
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
      }

      // Linea zero
      ctx.strokeStyle = '#2a2a2a';
      ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.setLineDash([]);

      // Sismogramma
      ctx.strokeStyle = '#F5EDE0';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      S4_SEISMO_DATA.forEach(function (d, i) {
        const x = ((d.t - tMin) / (tMax - tMin)) * W;
        const y = H / 2 - d.amp * (H / 2 - 8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Marker draggabili
      s4ReadState.markers.forEach(function (mk) {
        ctx.save();
        ctx.strokeStyle = mk.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mk.x, 0);
        ctx.lineTo(mk.x, H);
        ctx.stroke();

        // Triangolino handle in alto
        ctx.fillStyle = mk.color;
        ctx.beginPath();
        ctx.moveTo(mk.x - 8, 0);
        ctx.lineTo(mk.x + 8, 0);
        ctx.lineTo(mk.x, 14);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = mk.color;
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillText(mk.label, mk.x + 4, 26);
        ctx.restore();
      });

      // Aggiorna risultati in tempo reale
      updateReadResults();
    }

    function updateReadResults() {
      const tP = xToT(s4ReadState.markers[0].x);
      const tS = xToT(s4ReadState.markers[1].x);
      const dtPS = Math.abs(tS - tP);
      const dist = (dtPS * 8.4).toFixed(1);

      const r1dt = document.getElementById('s4-res1-dt');
      const r1dist = document.getElementById('s4-res1-dist');
      if (r1dt) r1dt.textContent = dtPS.toFixed(1) + ' s';
      if (r1dist) r1dist.textContent = '~' + dist + ' km';

      const tSup = xToT(s4ReadState.markers[2].x);
      const dtSup = Math.abs(tSup - tP).toFixed(1);
      const r3 = document.getElementById('s4-res3-text');
      if (r3) r3.textContent = 'Con questo gap stimi l\'epicentro a circa ' + dist + ' km. Le superficiali sono arrivate ' + dtSup + ' s dopo le P.';
    }

    // Mouse events per drag
    canvas.addEventListener('mousedown', function (e) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      s4ReadState.dragging = -1;
      s4ReadState.markers.forEach(function (mk, i) {
        if (Math.abs(mx - mk.x) < 14) s4ReadState.dragging = i;
      });
    });

    canvas.addEventListener('mousemove', function (e) {
      if (s4ReadState.dragging < 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      s4ReadState.markers[s4ReadState.dragging].x = Math.max(0, Math.min(W, mx));
      drawAll();
    });

    canvas.addEventListener('mouseup', function () { s4ReadState.dragging = -1; });
    canvas.addEventListener('mouseleave', function () { s4ReadState.dragging = -1; });

    // Touch drag
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = (e.touches[0].clientX - rect.left) * (W / rect.width);
      s4ReadState.dragging = -1;
      s4ReadState.markers.forEach(function (mk, i) {
        if (Math.abs(mx - mk.x) < 18) s4ReadState.dragging = i;
      });
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
      if (s4ReadState.dragging < 0) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = (e.touches[0].clientX - rect.left) * (W / rect.width);
      s4ReadState.markers[s4ReadState.dragging].x = Math.max(0, Math.min(W, mx));
      drawAll();
    }, { passive: false });

    canvas.addEventListener('touchend', function () { s4ReadState.dragging = -1; }, { passive: true });

    // Cursore mano sui marker
    canvas.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      let onMarker = false;
      s4ReadState.markers.forEach(function (mk) {
        if (Math.abs(mx - mk.x) < 14) onMarker = true;
      });
      canvas.style.cursor = onMarker ? 'ew-resize' : 'default';
    });

    // Pulsante Verifica
    const verifyBtn = document.getElementById('s4-verify');
    if (verifyBtn) verifyBtn.addEventListener('click', function () {
      s4ReadState.verified = true;
      const tP = xToT(s4ReadState.markers[0].x);
      const tS = xToT(s4ReadState.markers[1].x);
      const errP = Math.abs(tP - realP);
      const errS = Math.abs(tS - realS);
      const errAvg = (errP + errS) / 2;

      let giudizio, verIcon, verColor;
      if (errAvg < 1) {
        giudizio = 'Precisione da sismologo!';
        verIcon = '✓';  verColor = '#32CD32';
      } else if (errAvg < 3) {
        giudizio = 'Buona approssimazione.';
        verIcon = '≈';  verColor = '#D4893A';
      } else {
        giudizio = 'Riprova — cerca il cambio brusco di ampiezza.';
        verIcon = '✗';  verColor = '#8B1A1A';
      }

      const r2 = document.getElementById('s4-res2');
      if (r2) {
        r2.style.display = 'block';
        r2.innerHTML = '<div style="font-size:2.4rem;text-align:center;color:' + verColor + ';line-height:1;margin-bottom:0.5rem;font-family:\'JetBrains Mono\',monospace">' + verIcon + '</div>' +
          '<div class="s4-verify-box"><p><strong>P reale:</strong> 03:32:41 UTC</p><p><strong>S reale:</strong> 03:32:49 UTC</p><p><strong>Gap reale:</strong> 8 s</p><p><strong>Distanza reale:</strong> ~65 km</p></div>';
      }
      const r2j = document.getElementById('s4-res2-judge');
      if (r2j) { r2j.textContent = giudizio; r2j.style.color = verColor; r2j.style.display = 'block'; }
    });

    // Reset
    const resetBtn = document.getElementById('s4-read-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      s4ReadState.markers[0].x = W * 0.25;
      s4ReadState.markers[1].x = W * 0.45;
      s4ReadState.markers[2].x = W * 0.65;
      s4ReadState.verified = false;
      const r2 = document.getElementById('s4-res2');
      if (r2) r2.style.display = 'none';
      const r2j = document.getElementById('s4-res2-judge');
      if (r2j) r2j.style.display = 'none';
      drawAll();
    });

    drawAll();
  }

  // ════════════════════════════════════════
  // SLIDE 5 — NOMOGRAMMA
  // ════════════════════════════════════════

  let s4NomoState = null;

  function initSlide5() {
    if (s4SlideInited[4]) return;
    s4SlideInited[4] = true;

    const canvas = document.getElementById('s4-nomo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Size canvas to its CSS-rendered dimensions (flex container)
    const rect = canvas.getBoundingClientRect();
    const W = canvas.width = Math.max(rect.width || canvas.offsetWidth || 340, 200);
    const H = canvas.height = Math.max(rect.height || canvas.offsetHeight || 360, 200);

    // Valori L'Aquila 2009 — stazione AQU, gap P-S osservato 8s → ~72km, ML 6.3
    // Per ML=6.3 a 72km: A = 10^(6.3 - 3·log10(72) + 2.92) ≈ 5000 mm
    const defaultGap = 8.0;   // secondi → ~72 km
    const defaultAmp = 5000;  // mm (Wood-Anderson, scala reale)

    s4NomoState = {
      freeMode: false,
      gap: defaultGap,
      amp: defaultAmp,
      animProgress: 0,
      animDone: false
    };

    // Scala assi
    // Asse SX: distanza km, log 1–500
    // Asse CX: magnitudo 0–8
    // Asse DX: ampiezza mm, log 0.1–10000

    const leftX = 50, centerX = W / 2, rightX = W - 50;
    const topY = 30, bottomY = H - 30;
    const axisH = bottomY - topY;

    function distToY(km) {
      // Scala log 1–500
      const logMin = Math.log10(1), logMax = Math.log10(500);
      return bottomY - ((Math.log10(Math.max(1, km)) - logMin) / (logMax - logMin)) * axisH;
    }
    function magToY(ml) {
      return bottomY - (Math.max(0, Math.min(ml, 8)) / 8) * axisH;
    }
    function ampToY(mm) {
      // Log 0.1 → 10000
      const logMin = Math.log10(0.1), logMax = Math.log10(10000);
      return bottomY - ((Math.log10(Math.max(0.01, mm)) - logMin) / (logMax - logMin)) * axisH;
    }

    function gapToDist(gapS) {
      return gapS * 9.0;
    }

    function computeML(gapS, ampMm) {
      const dist = gapToDist(gapS);
      if (dist < 0.1) return 0;
      return Math.log10(ampMm) + 3 * Math.log10(dist) - 2.92;
    }

    function drawNomo(lineProgress, gap, amp, showLabel, freeMode) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      const cream = '#F5EDE0';
      const terra = '#C4612A';
      const blue = '#3A7EC4';
      const ochre = '#D4893A';

      // Titolo assi
      ctx.fillStyle = cream;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Dist. (km)', leftX, topY - 12);
      ctx.fillStyle = terra;
      ctx.fillText('MAGNITUDO', centerX, topY - 12);
      ctx.fillStyle = cream;
      ctx.fillText('Ampiezza (mm)', rightX, topY - 12);

      // Assi verticali
      [leftX, centerX, rightX].forEach(function (x, i) {
        ctx.strokeStyle = i === 1 ? terra : cream;
        ctx.lineWidth = i === 1 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
      });

      // Tick asse SX (distanza log 1–500)
      ctx.fillStyle = cream;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      [1, 5, 10, 50, 100, 300, 500].forEach(function (km) {
        const y = distToY(km);
        ctx.beginPath();
        ctx.moveTo(leftX - 4, y);
        ctx.lineTo(leftX + 4, y);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(km + ' km', leftX - 6, y + 3);
      });

      // Tick asse centro (magnitudo 0–8)
      ctx.textAlign = 'center';
      ctx.fillStyle = terra;
      for (let m = 0; m <= 8; m++) {
        const y = magToY(m);
        ctx.beginPath();
        ctx.moveTo(centerX - 5, y);
        ctx.lineTo(centerX + 5, y);
        ctx.strokeStyle = terra;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(m, centerX, y + 3);
      }

      // Tick asse DX (ampiezza log 0.1–10000)
      ctx.textAlign = 'left';
      ctx.fillStyle = cream;
      [0.1, 1, 10, 100, 1000, 10000].forEach(function (mm) {
        const y = ampToY(mm);
        ctx.beginPath();
        ctx.moveTo(rightX - 4, y);
        ctx.lineTo(rightX + 4, y);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 1;
        ctx.stroke();
        const label = mm >= 1000 ? (mm / 1000) + 'k' : mm;
        ctx.fillText(label + ' mm', rightX + 6, y + 3);
      });

      // Calcola riga
      const dist = gapToDist(gap);
      const ml = computeML(gap, amp);
      const yLeft = distToY(Math.min(dist, 500));
      const yRight = ampToY(Math.min(amp, 10000));
      const yCenter = magToY(Math.max(0, Math.min(ml, 8)));

      // Disegna riga animata
      if (lineProgress > 0) {
        const p = Math.min(lineProgress, 1);
        const yGeom = yLeft + (yRight - yLeft) * (centerX - leftX) / (rightX - leftX);

        // Retta unica SX→DX — interpolazione lineare pura
        const xEnd = leftX + (rightX - leftX) * p;
        const yEnd = yLeft + (yRight - yLeft) * p;

        ctx.strokeStyle = terra;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX, yLeft);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        // Pallino quando la linea supera il centro
        const pCenter = (centerX - leftX) / (rightX - leftX);
        if (p >= pCenter) {
          ctx.beginPath();
          ctx.arc(centerX, yGeom, 6, 0, Math.PI * 2);
          ctx.fillStyle = terra;
          ctx.fill();
        }

        // Label ML — visibile solo quando animazione completa
        if (p >= 1 && showLabel) {
          const ml = computeML(gap, amp);
          const mlDisp = ml.toFixed(1);
          ctx.fillStyle = terra;
          ctx.font = 'bold 13px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('ML = ' + mlDisp, centerX, yGeom - 14);
          if (ml >= 5.8 && ml <= 6.8) {
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillStyle = ochre;
            ctx.fillText("L'Aquila 2009 ≈ 6.3", centerX, yGeom - 26);
          }
        }
      }
    }

    // Animazione automatica al primo ingresso
    let nomoAnimStart = null;
    const NOMO_ANIM_DUR = 2000;

    function nomoAnimLoop(ts) {
      if (!nomoAnimStart) nomoAnimStart = ts;
      const prog = Math.min((ts - nomoAnimStart) / NOMO_ANIM_DUR, 1);
      s4NomoState.animProgress = prog;
      drawNomo(prog, s4NomoState.gap, s4NomoState.amp, prog >= 1, s4NomoState.freeMode);

      if (prog < 1) {
        s4Loops['slide4nomo'] = requestAnimationFrame(nomoAnimLoop);
      } else {
        s4NomoState.animDone = true;
        updateMLDisplay();
        // Disegna i pallini drag subito dopo la fine dell'animazione
        if (typeof drawNomoWithDots === 'function') {
          drawNomoWithDots(1, s4NomoState.gap, s4NomoState.amp, true, true);
        }
      }
    }

    function updateMLDisplay() {
      const ml = computeML(s4NomoState.gap, s4NomoState.amp);
      const num = document.getElementById('s4-ml-number');
      if (num) num.textContent = ml.toFixed(1);
      const dist = gapToDist(s4NomoState.gap);
      const distEl = document.getElementById('s4-dist-display');
      if (distEl) distEl.textContent = dist.toFixed(1);
    }

    function redrawNomo() {
      drawNomo(1, s4NomoState.gap, s4NomoState.amp, true, true);
      updateMLDisplay();
    }

    requestAnimationFrame(nomoAnimLoop);

    // Inputs + sliders sincronizzati — aggiornano nomogramma e ML in tempo reale
    const gapInput = document.getElementById('s4-nomo-gap');
    const gapSlider = document.getElementById('s4-gap-slider');
    const ampInput = document.getElementById('s4-nomo-amp');
    const ampSlider = document.getElementById('s4-amp-slider');

    function onGapChange(val) {
      s4NomoState.gap = parseFloat(val) || 8.0;
      if (gapInput) gapInput.value = s4NomoState.gap.toFixed(1);
      if (gapSlider) gapSlider.value = Math.min(30, s4NomoState.gap);
      redrawNomo();
    }
    function onAmpChange(val) {
      s4NomoState.amp = parseFloat(val) || 5000;
      if (ampInput) ampInput.value = s4NomoState.amp;
      // Slider range 1-200: map logarithmically (log10)
      if (ampSlider) {
        const logVal = Math.log10(Math.max(1, s4NomoState.amp));
        const logMin = 0, logMax = Math.log10(10000);
        ampSlider.value = Math.round(((logVal - logMin) / (logMax - logMin)) * 200);
      }
      redrawNomo();
    }

    if (gapInput) gapInput.addEventListener('input', function () { onGapChange(gapInput.value); });
    if (gapSlider) gapSlider.addEventListener('input', function () { onGapChange(gapSlider.value); });
    if (ampInput) ampInput.addEventListener('input', function () { onAmpChange(ampInput.value); });
    if (ampSlider) ampSlider.addEventListener('input', function () {
      // Converte slider 0-200 → amp 1-10000 in scala logaritmica
      const logMin = 0, logMax = Math.log10(10000);
      const ampVal = Math.round(Math.pow(10, logMin + (parseInt(ampSlider.value) / 200) * (logMax - logMin)));
      onAmpChange(ampVal);
    });

    // Pallini draggabili sull'asse distanza (sinistra) e ampiezza (destra)
    // Sovrascrive drawNomo per aggiungere i cerchi draggabili al rendering
    const _drawNomoOrig = drawNomo;
    function drawNomoWithDots(lineProgress, gap, amp, showLabel, freeMode) {
      _drawNomoOrig(lineProgress, gap, amp, showLabel, freeMode);
      if (!s4NomoState.animDone && lineProgress < 1) return;
      const dist = gapToDist(gap);
      const yLeft  = distToY(Math.min(dist, 500));
      const yRight = ampToY(Math.min(amp, 10000));
      // Pallino asse distanza (sinistra)
      ctx.beginPath();
      ctx.arc(leftX, yLeft, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#C4612A';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Pallino asse ampiezza (destra)
      ctx.beginPath();
      ctx.arc(rightX, yRight, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#C4612A';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    let dragging = null; // 'left' | 'right' | null

    function nomoPointerY(e) {
      const rect = canvas.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return (clientY - rect.top) / rect.height * canvas.height / (window.devicePixelRatio || 1);
    }
    function nomoPointerX(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return (clientX - rect.left) / rect.width * canvas.width / (window.devicePixelRatio || 1);
    }

    canvas.addEventListener('mousedown', function (e) {
      const px = nomoPointerX(e), py = nomoPointerY(e);
      const dist = gapToDist(s4NomoState.gap);
      const yLeft  = distToY(Math.min(dist, 500));
      const yRight = ampToY(Math.min(s4NomoState.amp, 10000));
      if (Math.abs(px - leftX) < 18 && Math.abs(py - yLeft) < 18)  { dragging = 'left';  e.preventDefault(); }
      if (Math.abs(px - rightX) < 18 && Math.abs(py - yRight) < 18) { dragging = 'right'; e.preventDefault(); }
    });
    canvas.addEventListener('touchstart', function (e) {
      const px = nomoPointerX(e), py = nomoPointerY(e);
      const dist = gapToDist(s4NomoState.gap);
      const yLeft  = distToY(Math.min(dist, 500));
      const yRight = ampToY(Math.min(s4NomoState.amp, 10000));
      if (Math.abs(px - leftX) < 22 && Math.abs(py - yLeft) < 22)  { dragging = 'left';  e.preventDefault(); }
      if (Math.abs(px - rightX) < 22 && Math.abs(py - yRight) < 22) { dragging = 'right'; e.preventDefault(); }
    }, { passive: false });

    function onNomoMove(e) {
      if (!dragging || !s4NomoState.animDone) return;
      e.preventDefault();
      const py = nomoPointerY(e);
      const t = Math.max(0, Math.min(1, (bottomY - py) / axisH));
      if (dragging === 'left') {
        // y → distanza (log inversa) → gap
        const logMin = Math.log10(1), logMax = Math.log10(500);
        const km = Math.pow(10, logMin + t * (logMax - logMin));
        const newGap = km / 9.0;
        onGapChange(Math.max(0.1, Math.min(newGap, 90)));
      } else {
        // y → ampiezza (log inversa)
        const logMin = Math.log10(0.1), logMax = Math.log10(10000);
        const mm = Math.pow(10, logMin + t * (logMax - logMin));
        onAmpChange(Math.max(0.1, Math.min(mm, 10000)));
      }
      drawNomoWithDots(1, s4NomoState.gap, s4NomoState.amp, true, true);
    }
    canvas.addEventListener('mousemove', onNomoMove);
    canvas.addEventListener('touchmove', onNomoMove, { passive: false });
    document.addEventListener('mouseup',  function () { dragging = null; });
    document.addEventListener('touchend', function () { dragging = null; });

    // Sostituire redrawNomo con versione con pallini
    window._s4redrawNomo = function () {
      drawNomoWithDots(1, s4NomoState.gap, s4NomoState.amp, true, true);
      updateMLDisplay();
    };
    // Patch redrawNomo per chiamate successive
    const origRedraw = redrawNomo;
    redrawNomo = window._s4redrawNomo;

    // Resize canvas when slide becomes active
    const nomoCanvas = document.getElementById('s4-nomo-canvas');
    if (nomoCanvas && nomoCanvas.parentElement) {
      const observer = new ResizeObserver(function () {
        if (s4NomoState && s4NomoState.animDone) {
          drawNomoWithDots(1, s4NomoState.gap, s4NomoState.amp, true, true);
          updateMLDisplay();
        }
      });
      observer.observe(nomoCanvas.parentElement);
    }
  }

  // ════════════════════════════════════════
  // SLIDE 6 — CALCOLO RICHTER LIVE
  // ════════════════════════════════════════

  function initSlide6() {
    if (s4SlideInited[5]) return;
    s4SlideInited[5] = true;

    // Fallback hardcoded
    const fallback = {
      time: '2009-04-06T01:32:39',
      lat: 42.3476, lon: 13.3800,
      depth: 8.3, mag: 6.3,
      place: 'Onna, L\'Aquila'
    };

    function showStep(id) {
      const el = document.getElementById(id);
      if (el) { el.classList.add('s4-visible'); el.removeAttribute('aria-hidden'); }
    }

    function runCalcWithData(ev) {
      // Step 1 — evento
      const evDesc = document.getElementById('s4-ev-desc');
      if (evDesc) {
        const d = new Date(ev.time);
        const dateStr = d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT');
        evDesc.innerHTML = '<strong>' + dateStr + ' &middot; ' + ev.place + '</strong><br>' +
          'Magnitudo INGV: M ' + ev.mag.toFixed(1) + '<br>' +
          'Coordinate: ' + ev.lat.toFixed(4) + '&deg;N ' + ev.lon.toFixed(4) + '&deg;E<br>' +
          'Profondità: ' + ev.depth.toFixed(1) + ' km';
      }
      showStep('s4-step1');

      setTimeout(function () {
        // Step 2 — stazione più vicina
        let nearest = S4_STAZIONI[0];
        let nearDist = haversineKm(ev.lat, ev.lon, nearest.lat, nearest.lon);
        S4_STAZIONI.forEach(function (st) {
          const d = haversineKm(ev.lat, ev.lon, st.lat, st.lon);
          if (d < nearDist) { nearDist = d; nearest = st; }
        });
        const staDesc = document.getElementById('s4-sta-desc');
        if (staDesc) staDesc.innerHTML = 'Stazione più vicina: <strong>' + nearest.name + '</strong> &middot; ' + nearDist.toFixed(1) + ' km<br><small>calcolata con formula Haversine</small>';
        showStep('s4-step2');

        setTimeout(function () {
          // Step 3 — calcolo
          const dtPS = Math.max(0.5, nearDist / 9.0);
          const ampEst = Math.pow(10, (ev.mag - 2.5) / 2);
          const calcDesc = document.getElementById('s4-calc-desc');
          if (calcDesc) calcDesc.innerHTML = 'Gap P-S stimato: <strong>' + dtPS.toFixed(1) + ' s</strong><br>' +
            'Ampiezza stimata: <strong>' + ampEst.toFixed(0) + ' mm</strong>';
          showStep('s4-step3');

          setTimeout(function () {
            // Step 4 — verifica + aggiorna display grande
            const logA = Math.log10(Math.max(0.01, ampEst));
            const logD = 3 * Math.log10(Math.max(0.1, nearDist));
            const mlCalc = logA + logD - 2.92;
            const diff = Math.abs(mlCalc - ev.mag).toFixed(1);
            const verDesc = document.getElementById('s4-verify-desc');
            if (verDesc) verDesc.innerHTML =
              'ML = log₁₀(' + ampEst.toFixed(0) + ') + 3·log₁₀(' + nearDist.toFixed(1) + ') − 2.92<br>' +
              '&nbsp;&nbsp;&nbsp; ≈ <strong>' + mlCalc.toFixed(1) + '</strong><br>' +
              'INGV: M ' + ev.mag.toFixed(1) + ' · Δ = ±' + diff;
            showStep('s4-step4');
            // Mostra il risultato grande a destra
            const mlBig = document.getElementById('s4-ml-big');
            if (mlBig) mlBig.textContent = 'M ' + mlCalc.toFixed(1);
            const cmpNote = document.getElementById('s4-ml-compare-note');
            if (cmpNote) {
              const diff2 = Math.abs(mlCalc - ev.mag);
              cmpNote.textContent = diff2 <= 0.3 ? 'Ottima stima — in linea con INGV' :
                diff2 <= 0.7 ? 'Stima ragionevole (errore ' + diff + ' unità)' :
                'Stima approssimativa — valori esatti dal sismogramma grezzo';
            }
          }, 700);
        }, 700);
      }, 700);
    }

    // Reset: step1 rimane visibile (carica subito), 2-4 nascosti
    ['s4-step2', 's4-step3', 's4-step4'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('s4-visible'); el.setAttribute('aria-hidden', 'true'); }
    });
    const mlBig = document.getElementById('s4-ml-big');
    if (mlBig) mlBig.textContent = '—';

    // Fetch INGV
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 5000);

    fetch('https://webservices.ingv.it/fdsnws/event/1/query?format=text&minmag=1.5&orderby=time&limit=1', { signal: controller.signal })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        clearTimeout(timeout);
        const lines = text.trim().split('\n').filter(function (l) { return l && l[0] !== '#'; });
        if (lines.length === 0) throw new Error('no data');
        const parts = lines[0].split('|');
        if (parts.length < 11) throw new Error('parse error');
        const ev = {
          time: parts[1] || fallback.time,
          lat: parseFloat(parts[2]) || fallback.lat,
          lon: parseFloat(parts[3]) || fallback.lon,
          depth: parseFloat(parts[4]) || fallback.depth,
          mag: parseFloat(parts[10]) || fallback.mag,
          place: parts[12] || fallback.place
        };
        runCalcWithData(ev);
      })
      .catch(function () {
        clearTimeout(timeout);
        runCalcWithData(fallback);
      });
  }

  // ════════════════════════════════════════
  // SLIDE 7 — SCALA MCS
  // ════════════════════════════════════════

  function initSlide7() {
    if (s4SlideInited[6]) return;
    s4SlideInited[6] = true;

    // Colori per i chip (intensità crescente)
    const chipColors = [
      '#4CAF50', '#6BBF50', '#9fc92d', '#D4893A', '#d07030',
      '#C4612A', '#b84020', '#a03010', '#8B1A1A', '#701010',
      '#550a0a', '#4a0000'
    ];

    function updateMCS(grade) {
      const roman = document.getElementById('s4-mcs-roman');
      const illus = document.getElementById('s4-mcs-illus');
      const textEl = document.getElementById('s4-mcs-text');
      const compareEl = document.getElementById('s4-mcs-compare-label');
      const color = mcsColor(grade);

      // Aggiorna barra verticale: blocco attivo colorato
      document.querySelectorAll('.s4-mcs-bar-item').forEach(function (btn) {
        const g = parseInt(btn.dataset.grade);
        const isActive = g === grade;
        btn.classList.toggle('s4-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
        btn.style.background = isActive ? chipColors[g - 1] : 'rgba(245,237,224,0.04)';
        btn.style.borderColor = isActive ? chipColors[g - 1] : 'transparent';
        const roman = btn.querySelector('.s4-bar-roman');
        if (roman) roman.style.color = isActive ? '#080808' : 'rgba(245,237,224,0.35)';
      });

      if (roman) { roman.textContent = toRoman(grade); roman.style.color = color; }
      if (textEl) textEl.textContent = S4_MCS_DESC[grade] || '';
      if (illus) illus.innerHTML = generateMCSIllus(grade, color);

      let compareText = '';
      if (grade >= 9 && grade <= 10) {
        compareText = grade === 10
          ? 'L\'Aquila 2009 — centro storico e Onna (IX–X MCS, Onna 9.5)'
          : 'L\'Aquila 2009 — quartieri semicentrali (IX MCS)';
      }
      const compareBox = document.getElementById('s4-mcs-compare');
      if (compareBox) {
        compareBox.style.display = (grade === 9 || grade === 10) ? 'block' : 'none';
      }
      if (compareEl) compareEl.textContent = compareText;
    }

    let currentMCSGrade = 6;

    function setGrade(g) {
      currentMCSGrade = Math.max(1, Math.min(12, g));
      updateMCS(currentMCSGrade);
      const slider = document.getElementById('s4-mcs-slider');
      if (slider) slider.value = currentMCSGrade;
    }

    // Barra verticale: click su ciascun blocco
    document.querySelectorAll('.s4-mcs-bar-item').forEach(function (btn) {
      btn.addEventListener('click', function () { setGrade(parseInt(btn.dataset.grade)); });
    });

    // Slider fallback (accessibilità keyboard)
    const slider = document.getElementById('s4-mcs-slider');
    if (slider) {
      slider.addEventListener('input', function () { setGrade(parseInt(slider.value)); });
    }

    // Frecce su/giù
    const upBtn   = document.getElementById('s4-mcs-up');
    const downBtn = document.getElementById('s4-mcs-down');
    if (upBtn)   upBtn.addEventListener('click',   function () { setGrade(currentMCSGrade + 1); });
    if (downBtn) downBtn.addEventListener('click', function () { setGrade(currentMCSGrade - 1); });

    updateMCS(6);
  }

  function generateMCSIllus(grade, color) {
    // SVG stilizzato semplice per ogni grado
    const w = 160, h = 140;
    let content = '';

    if (grade <= 3) {
      // Persona tranquilla
      content = '<circle cx="80" cy="50" r="18" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="68" x2="80" y2="105" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="80" x2="60" y2="95" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="80" x2="100" y2="95" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="105" x2="65" y2="125" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="105" x2="95" y2="125" stroke="' + color + '" stroke-width="2"/>' +
        '<text x="80" y="138" text-anchor="middle" font-size="11" fill="' + color + '" font-family="JetBrains Mono,monospace">Grado ' + grade + '</text>';
    } else if (grade <= 5) {
      // Persona allarmata + vetri vibranti
      content = '<circle cx="80" cy="45" r="16" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="61" x2="80" y2="95" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="72" x2="58" y2="60" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="72" x2="102" y2="60" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="95" x2="67" y2="118" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="80" y1="95" x2="93" y2="118" stroke="' + color + '" stroke-width="2"/>' +
        '<rect x="20" y="30" width="25" height="40" fill="none" stroke="' + color + '" stroke-width="1" stroke-dasharray="3,2"/>' +
        '<rect x="115" y="30" width="25" height="40" fill="none" stroke="' + color + '" stroke-width="1" stroke-dasharray="3,2"/>' +
        '<text x="80" y="135" text-anchor="middle" font-size="11" fill="' + color + '" font-family="JetBrains Mono,monospace">Grado ' + grade + '</text>';
    } else if (grade <= 7) {
      // Casa con crepe
      content = '<polygon points="80,20 130,65 30,65" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<rect x="35" y="65" width="90" height="60" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<rect x="55" y="90" width="20" height="35" fill="none" stroke="' + color + '" stroke-width="1"/>' +
        '<rect x="85" y="80" width="18" height="18" fill="none" stroke="' + color + '" stroke-width="1"/>' +
        '<path d="M 50 75 Q 60 90 55 105" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<path d="M 110 80 Q 100 95 108 110" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<text x="80" y="138" text-anchor="middle" font-size="11" fill="' + color + '" font-family="JetBrains Mono,monospace">Grado ' + grade + '</text>';
    } else if (grade <= 9) {
      // Casa con danni gravi
      content = '<polygon points="80,15 135,60 25,60" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<rect x="30" y="60" width="100" height="65" fill="none" stroke="' + color + '" stroke-width="2"/>' +
        '<path d="M 30 90 L 70 75 L 80 90 L 100 65 L 130 85" fill="none" stroke="' + color + '" stroke-width="2.5"/>' +
        '<line x1="30" y1="60" x2="80" y2="125" stroke="' + color + '" stroke-width="1.5" stroke-dasharray="4,3"/>' +
        '<line x1="130" y1="60" x2="80" y2="125" stroke="' + color + '" stroke-width="1.5" stroke-dasharray="4,3"/>' +
        '<text x="80" y="138" text-anchor="middle" font-size="11" fill="' + color + '" font-family="JetBrains Mono,monospace">Grado ' + grade + '</text>';
    } else {
      // Macerie / distruzione totale
      content = '<polygon points="20,120 50,50 80,80 110,40 140,120" fill="' + color + '" fill-opacity="0.2" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="20" y1="120" x2="140" y2="120" stroke="' + color + '" stroke-width="3"/>' +
        '<line x1="35" y1="120" x2="55" y2="70" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="55" y1="70" x2="85" y2="95" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="85" y1="95" x2="110" y2="55" stroke="' + color + '" stroke-width="2"/>' +
        '<line x1="110" y1="55" x2="130" y2="120" stroke="' + color + '" stroke-width="2"/>' +
        '<circle cx="40" cy="110" r="5" fill="' + color + '"/>' +
        '<circle cx="100" cy="108" r="4" fill="' + color + '"/>' +
        '<text x="80" y="138" text-anchor="middle" font-size="11" fill="' + color + '" font-family="JetBrains Mono,monospace">Grado ' + grade + '</text>';
    }

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + content + '</svg>';
  }

  // ════════════════════════════════════════
  // SLIDE 9 — TRIANGOLAZIONE (Leaflet)
  // ════════════════════════════════════════

  function initSlide9() {
    if (s4Map9Inited) return;
    s4Map9Inited = true;

    const mapEl = document.getElementById('s4-map9');
    if (!mapEl || typeof L === 'undefined') {
      setTimeout(initSlide9, 500);
      s4Map9Inited = false;
      return;
    }

    const EPICENTRO = [42.342, 13.380]; // Paganica
    const STAZIONI = [
      { name: 'AQU', lat: 42.354, lon: 13.403, rKm: 3,  color: '#C4612A' },
      { name: 'SULM', lat: 42.050, lon: 13.930, rKm: 56, color: '#3A7EC4' },
      { name: 'TERO', lat: 42.661, lon: 13.704, rKm: 44, color: '#D4893A' }
    ];

    const map = L.map('s4-map9', {
      center: [42.35, 13.55],
      zoom: 7,
      scrollWheelZoom: true,
      dragging: true
    });
    s4Map9Instance = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 18
    }).addTo(map);

    const circlesDrawn = [false, false, false];
    const circlesOnMap = [null, null, null];
    let epiMarker = null;

    // Marker stazioni
    STAZIONI.forEach(function (sta) {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:12px;height:12px;background:' + sta.color + ';clip-path:polygon(50% 0%,0% 100%,100% 100%);transform:translate(-6px,-6px)"></div>',
        iconSize: [1, 1]
      });
      L.marker([sta.lat, sta.lon], { icon: icon }).addTo(map)
        .bindTooltip(sta.name, { permanent: true, direction: 'top', offset: [0, -8], className: 's4-map-tooltip' });
    });

    function checkAllDrawn() {
      const triBtn = document.getElementById('s4-triangulate-btn');
      if (circlesDrawn.every(Boolean) && triBtn) triBtn.disabled = false;
    }

    // Bottoni "Calcola" per ciascuna stazione
    document.querySelectorAll('.s4-tria-calc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const i = parseInt(btn.dataset.idx);
        const sta = STAZIONI[i];
        if (circlesOnMap[i]) { circlesOnMap[i].remove(); }
        const circle = L.circle([sta.lat, sta.lon], {
          radius: sta.rKm * 1000,
          color: sta.color,
          fillColor: sta.color,
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '6 4'
        }).addTo(map);
        circlesOnMap[i] = circle;
        circlesDrawn[i] = true;
        btn.textContent = '✓';
        btn.disabled = true;
        checkAllDrawn();
      });
    });

    // Bottone "Triangola"
    const triBtn = document.getElementById('s4-triangulate-btn');
    if (triBtn) triBtn.addEventListener('click', function () {
      const epiIcon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;background:#C4612A;border-radius:50%;border:3px solid #fff;transform:translate(-9px,-9px);box-shadow:0 0 0 4px rgba(196,97,42,0.35)"></div>',
        iconSize: [1, 1]
      });
      if (epiMarker) epiMarker.remove();
      epiMarker = L.marker(EPICENTRO, { icon: epiIcon }).addTo(map);
      epiMarker.bindPopup('<strong>EPICENTRO</strong><br>Paganica · 42.342°N 13.380°E<br>Faglia Paganica · 6 apr 2009').openPopup();
      const res = document.getElementById('s4-epi-result');
      if (res) res.innerHTML = '<strong>Epicentro risolto:</strong> 42.342°N 13.380°E — Paganica<br>I tre cerchi si intersecano in questo punto.';
    });

    // Reset
    const resetBtn = document.getElementById('s4-reset-tria');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      circlesOnMap.forEach(function (c, i) { if (c) { c.remove(); circlesOnMap[i] = null; circlesDrawn[i] = false; } });
      if (epiMarker) { epiMarker.remove(); epiMarker = null; }
      document.querySelectorAll('.s4-tria-calc-btn').forEach(function (btn) { btn.textContent = 'Calcola'; btn.disabled = false; });
      if (triBtn) triBtn.disabled = true;
      const res = document.getElementById('s4-epi-result');
      if (res) res.innerHTML = '';
    });
  }

  // ════════════════════════════════════════
  // SLIDE 10 — RICHTER COMPARATORE
  // ════════════════════════════════════════

  function initSlide10() {
    if (s4SlideInited[9]) return;
    s4SlideInited[9] = true;

    var slider = document.getElementById('s4-mag-slider');
    if (!slider) return;
    var magValEl   = document.getElementById('s4-mag-val');
    var svgBox     = document.getElementById('s4-svgbox');
    var svgLabel   = document.getElementById('s4-svglabel');
    var jouleDisp  = document.getElementById('s4-joule-display');
    var compareEl  = document.getElementById('s4-compare');
    var freqEl     = document.getElementById('s4-freq');
    var barCanvas  = document.getElementById('s4-energy-bar');
    var aqPin      = document.getElementById('s4-aq-pin');
    if (!barCanvas) return;
    var bCtx = barCanvas.getContext('2d');
    var E_LAQUILA = Math.pow(10, 1.5 * 6.3 + 4.8);

    // Posiziona marker L'Aquila
    if (aqPin) aqPin.style.left = '63%';

    function drawEnergyBar(mag) {
      var W = barCanvas.width, H = barCanvas.height;
      bCtx.clearRect(0, 0, W, H);
      // Sfondo
      bCtx.fillStyle = 'rgba(255,255,255,0.04)';
      bCtx.fillRect(0, 0, W, H);
      // Barra
      var pct = Math.max(0.02, Math.min(1, mag / 10));
      var barH = Math.round(H * pct);
      var r = Math.round(pct * 200), g = Math.round((1 - pct) * 100);
      bCtx.fillStyle = 'rgb(' + r + ',' + g + ',30)';
      bCtx.fillRect(0, H - barH, W, barH);
      // Marker L'Aquila
      var aqY = Math.round(H * (1 - 0.63));
      bCtx.strokeStyle = 'rgba(245,237,224,0.5)';
      bCtx.lineWidth = 1;
      bCtx.setLineDash([2, 2]);
      bCtx.beginPath(); bCtx.moveTo(0, aqY); bCtx.lineTo(W, aqY); bCtx.stroke();
      bCtx.setLineDash([]);
    }

    function updateSlide10(mag) {
      mag = parseFloat(mag) || 0;
      if (magValEl) magValEl.textContent = 'M ' + mag.toFixed(1);
      var E = Math.pow(10, 1.5 * mag + 4.8);
      // Joule
      if (jouleDisp) jouleDisp.innerHTML = formatJoules(E);
      // Barra canvas
      drawEnergyBar(mag);
      // SVG
      var svgData = generateRichterIllus(mag);
      if (svgBox) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(svgData, 'text/html');
        var svgEl = doc.querySelector('svg');
        var labelEl = doc.querySelector('div');
        svgBox.innerHTML = svgEl ? svgEl.outerHTML : '';
        if (svgLabel && labelEl) svgLabel.textContent = labelEl.textContent;
      }
      // Confronto
      if (compareEl) {
        if (Math.abs(mag - 6.3) < 0.15) {
          compareEl.textContent = '= L\'Aquila 2009';
        } else if (mag < 6.3) {
          compareEl.textContent = Math.round(E_LAQUILA / E) + '× meno energia di L\'Aquila';
        } else {
          compareEl.textContent = Math.round(E / E_LAQUILA) + '× più energia di L\'Aquila';
        }
      }
      // Frequenza
      if (freqEl) freqEl.textContent = 'Frequenza globale: ' + getRichterFreq(mag);
    }

    slider.addEventListener('input', function () { updateSlide10(slider.value); });
    updateSlide10(slider.value || 6.3);
  }

  function generateRichterIllus(mag) {
    const terra = '#C4612A';
    const blue = '#3A7EC4';
    const cream = '#F5EDE0';
    let content = '', label = '';

    if (mag < 2.0) {
      label = 'Impercettibile — solo i sismografi';
      content = '<circle cx="80" cy="70" r="25" fill="none" stroke="' + cream + '" stroke-width="1.5"/>' +
        '<text x="80" y="75" text-anchor="middle" font-size="20" fill="' + cream + '">😴</text>';
    } else if (mag < 3.0) {
      label = 'Raramente sveglia qualcuno';
      content = '<circle cx="80" cy="65" r="22" fill="none" stroke="' + cream + '" stroke-width="1.5"/>' +
        '<text x="80" y="73" text-anchor="middle" font-size="22" fill="' + cream + '">😧</text>';
    } else if (mag < 3.5) {
      label = 'Energia di una grande mina';
      content = '<ellipse cx="80" cy="70" rx="20" ry="30" fill="none" stroke="' + cream + '" stroke-width="2"/>' +
        '<circle cx="80" cy="42" r="6" fill="' + cream + '"/>' +
        '<line x1="80" y1="38" x2="80" y2="25" stroke="' + cream + '" stroke-width="2"/>' +
        '<circle cx="80" cy="22" r="3" fill="#D4893A"/>';
    } else if (mag < 5.0) {
      label = 'Una piccola bomba atomica';
      content = '<ellipse cx="80" cy="75" rx="18" ry="28" fill="' + terra + '" fill-opacity="0.3" stroke="' + terra + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="50" rx="10" ry="14" fill="' + terra + '" fill-opacity="0.5" stroke="' + terra + '" stroke-width="1.5"/>' +
        '<ellipse cx="80" cy="30" rx="14" ry="8" fill="' + terra + '" fill-opacity="0.6" stroke="' + terra + '" stroke-width="1.5"/>' +
        '<text x="80" y="115" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="JetBrains Mono,monospace">Little Boy</text>';
    } else if (mag < 6.0) {
      label = 'Una grande bomba atomica';
      content = '<ellipse cx="80" cy="80" rx="22" ry="32" fill="' + terra + '" fill-opacity="0.4" stroke="' + terra + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="50" rx="28" ry="10" fill="' + terra + '" fill-opacity="0.5" stroke="' + terra + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="28" rx="18" ry="10" fill="' + terra + '" fill-opacity="0.6" stroke="' + terra + '" stroke-width="1.5"/>' +
        '<text x="80" y="122" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="JetBrains Mono,monospace">Fat Man</text>';
    } else if (mag < 6.5) {
      label = 'Una piccola bomba all\'idrogeno';
      content = '<polygon points="80,10 95,40 128,40 103,60 113,90 80,70 47,90 57,60 32,40 65,40" fill="' + terra + '" fill-opacity="0.3" stroke="' + terra + '" stroke-width="2"/>' +
        '<text x="80" y="115" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="JetBrains Mono,monospace">Bomba H</text>';
    } else if (mag < 7.0) {
      label = 'I maggiori test nucleari';
      content = '<ellipse cx="80" cy="90" rx="30" ry="18" fill="' + terra + '" fill-opacity="0.4" stroke="' + terra + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="60" rx="16" ry="38" fill="' + terra + '" fill-opacity="0.5" stroke="' + terra + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="30" rx="28" ry="14" fill="' + terra + '" fill-opacity="0.6" stroke="' + terra + '" stroke-width="2"/>' +
        '<text x="80" y="120" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="JetBrains Mono,monospace">Fungo nucleare</text>';
    } else if (mag < 9.0) {
      label = 'Migliaia di miliardi di joule';
      content = '<circle cx="80" cy="65" r="40" fill="none" stroke="' + blue + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="65" rx="40" ry="12" fill="none" stroke="' + blue + '" stroke-width="1" stroke-dasharray="4,3"/>' +
        '<ellipse cx="80" cy="65" rx="14" ry="40" fill="none" stroke="' + blue + '" stroke-width="1" stroke-dasharray="4,3"/>' +
        '<circle cx="80" cy="65" r="14" fill="' + blue + '" fill-opacity="0.3"/>' +
        '<text x="80" y="120" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="JetBrains Mono,monospace">Globo terrestre</text>';
    } else {
      label = 'Energia mondiale in 10 giorni';
      content = '<circle cx="80" cy="65" r="30" fill="#ffcc00" fill-opacity="0.3" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="80" y1="20" x2="80" y2="10" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="80" y1="110" x2="80" y2="120" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="35" y1="65" x2="25" y2="65" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="125" y1="65" x2="135" y2="65" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="51" y1="36" x2="44" y2="29" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="109" y1="94" x2="116" y2="101" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="109" y1="36" x2="116" y2="29" stroke="#ffcc00" stroke-width="2"/>' +
        '<line x1="51" y1="94" x2="44" y2="101" stroke="#ffcc00" stroke-width="2"/>' +
        '<text x="80" y="138" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="JetBrains Mono,monospace">Sole raggiante</text>';
    }

    const labelSvg = '<text x="80" y="128" text-anchor="middle" font-size="9" fill="' + cream + '" font-family="Cormorant Garamond,serif" font-style="italic">' + label + '</text>';

    return '<svg viewBox="0 0 160 140" width="160" height="140">' + content + '</svg>' +
      '<div style="text-align:center;font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:12px;color:#F5EDE0;margin-top:4px">' + label + '</div>';
  }

  // ════════════════════════════════════════
  // SLIDE 11 — SIMULATORE MCS
  // ════════════════════════════════════════

  function initSlide11() {
    if (s4SlideInited[10]) return;
    s4SlideInited[10] = true;

    const sliderTer = document.getElementById('s4-sim-ter');
    const sliderPop = document.getElementById('s4-sim-pop');
    const sliderEd = document.getElementById('s4-sim-ed');
    const sliderMag = document.getElementById('s4-sim-mag');
    if (!sliderTer) return;

    const terLabels = ['Roccia compatta (+0)', 'Calcari (+0.5)', 'Argilla compatta (+1)', 'Alluvionale (+1.5)', 'Terreno saturo (+2)'];
    const edLabels = ['Moderno antisismico (−1)', 'Cemento armato anni \'70–\'90 (0)', 'Muratura rinforzata (+0.5)', 'Muratura semplice (+1)', 'Storico medievale (+2)'];
    const popLabels = ['Rurale isolata < 10 ab/km²', 'Piccolo centro 10–100', 'Centro medio 100–500', 'Città 500–2000', 'Area metropolitana > 2000'];

    const terDeltas = [0, 0.5, 1, 1.5, 2];
    const edDeltas = [-1, 0, 0.5, 1, 2];

    function updateLabels() {
      const tv = document.getElementById('s4-sim-ter-val');
      const pv = document.getElementById('s4-sim-pop-val');
      const ev = document.getElementById('s4-sim-ed-val');
      const mv = document.getElementById('s4-sim-mag-val');
      if (tv) tv.textContent = terLabels[(sliderTer.value || 1) - 1] || '';
      if (pv) pv.textContent = popLabels[(sliderPop.value || 1) - 1] || '';
      if (ev) ev.textContent = edLabels[(sliderEd.value || 1) - 1] || '';
      if (mv) mv.textContent = 'M ' + parseFloat(sliderMag.value || 6.3).toFixed(1);
    }

    [sliderTer, sliderPop, sliderEd, sliderMag].forEach(function (sl) {
      if (sl) sl.addEventListener('input', updateLabels);
    });

    function simulate() {
      const mag = parseFloat(sliderMag.value) || 6.3;
      const terIdx = parseInt(sliderTer.value) - 1;
      const edIdx = parseInt(sliderEd.value) - 1;

      const baseMCS = Math.max(1, Math.min(12, Math.round((mag - 2.5) * 1.5 + 2)));
      const dTer = terDeltas[terIdx] || 0;
      const dEd = edDeltas[edIdx] || 0;
      const grade = Math.max(1, Math.min(12, Math.round(baseMCS + dTer + dEd)));

      const gradeEl = document.getElementById('s4-sim-grade');
      const descEl = document.getElementById('s4-sim-desc');
      const barEl = document.getElementById('s4-sim-bar');
      const pctEl = document.getElementById('s4-sim-pct');

      if (gradeEl) {
        gradeEl.textContent = toRoman(grade);
        gradeEl.style.color = mcsColor(grade);
      }
      if (descEl) descEl.textContent = S4_MCS_DESC[grade] || '';
      if (barEl) {
        const pct = (grade / 12) * 100;
        barEl.style.width = pct + '%';
        barEl.style.background = mcsColor(grade);
      }
      if (pctEl) {
        const aquilaGrade = 9.5; // IX-X
        const ratio = ((grade / aquilaGrade) * 100).toFixed(0);
        pctEl.textContent = 'Intensità: ' + ratio + '% rispetto a L\'Aquila centro storico (IX–X)';
      }

      // Risultato visibile
      const res = document.getElementById('s4-sim-result');
      if (res) res.style.display = 'block';
    }

    const simBtn = document.getElementById('s4-sim-btn');
    if (simBtn) simBtn.addEventListener('click', simulate);

    // Preset
    const presets = [
      // [ter, pop, ed, mag]
      [4, 4, 5, 6.3],  // L'Aquila centro storico
      [3, 3, 2, 6.3],  // L'Aquila periferia Pile
      [2, 2, 4, 6.9]   // Irpinia 1980
    ];

    document.querySelectorAll('.s4-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const p = presets[parseInt(btn.dataset.preset) || 0];
        if (!p) return;
        sliderTer.value = p[0];
        sliderPop.value = p[1];
        sliderEd.value = p[2];
        sliderMag.value = p[3];
        updateLabels();
        simulate();
      });
    });

    updateLabels();
  }

  // ════════════════════════════════════════
  // SLIDE 12 — MAPPA ISOSISMICA (Leaflet)
  // ════════════════════════════════════════

  function initSlide12() {
    if (s4Map12Inited) return;
    s4Map12Inited = true;

    const mapEl = document.getElementById('s4-map12');
    if (!mapEl || typeof L === 'undefined') {
      setTimeout(initSlide12, 500);
      s4Map12Inited = false;
      return;
    }

    const map = L.map('s4-map12', {
      center: [42.3476, 13.3800],
      zoom: 10,
      scrollWheelZoom: true,
      dragging: true
    });
    s4Map12Instance = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 18
    }).addTo(map);

    // Aggiungi poligoni isosismici come anelli (donut) per evitare sovrapposizioni
    // Ordina dal grado più alto (X) al più basso (V)
    const zonesSorted = S4_ISO_ZONES.slice().sort(function(a, b) { return b.grade - a.grade; });
    zonesSorted.forEach(function (zone, i) {
      // Zona interna (grado superiore) usata come buco per evitare sovrapposizioni
      const innerZone = i > 0 ? zonesSorted[i - 1] : null;
      const latLngs = innerZone ? [zone.coords, innerZone.coords] : [zone.coords];
      const poly = L.polygon(latLngs, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: zone.opacity,
        weight: 2,
        opacity: 0.9
      });
      poly.bindTooltip(zone.label + '<br><small>' + zone.zones.join(', ') + '</small>', { sticky: true });
      poly.addTo(map);

      poly.bindPopup(
        '<strong>Grado MCS ' + toRoman(zone.grade) + ' — ' + zone.label + '</strong><br>' +
        zone.popup + '<br>' +
        '<em>Zone: ' + zone.zones.join(', ') + '</em>'
      );

      poly.on('mouseover', function () {
        poly.setStyle({ weight: 4, opacity: 1 });
      });
      poly.on('mouseout', function () {
        poly.setStyle({ weight: 2, opacity: 0.9 });
      });
      poly.on('click', function () {
        poly.openPopup();
      });
    });

    // Marker epicentro pulsante
    const epiIcon = L.divIcon({
      className: '',
      html: '<div class="s4-epi-marker-pulse"><div class="s4-epi-inner"></div><div class="s4-epi-ring"></div></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker([42.3476, 13.3800], { icon: epiIcon })
      .addTo(map)
      .bindPopup('<strong>EPICENTRO</strong><br>Faglia Paganica<br>42.3476°N 13.3800°E<br>Profondità: 8.3 km');
  }

  // ════════════════════════════════════════
  // EVENTI WHEEL / KEYBOARD / TOUCH
  // ════════════════════════════════════════

  function setupCarouselEvents() {
    const section = document.getElementById('s-section4');
    if (!section) return;

    // Wheel event — capture:true intercetta PRIMA degli elementi overflow-y:auto interni
    section.addEventListener('wheel', function (e) {
      if (s4IsAnimating) return;
      const goingDown = e.deltaY > 0;
      // Prima slide e scroll su → passa al padre (scroll verticale)
      if (!goingDown && s4CurrentSlide === 0) return;
      // Ultima slide e scroll giù → passa al padre
      if (goingDown && s4CurrentSlide === S4_TOTAL - 1) return;
      e.preventDefault();
      e.stopPropagation();
      goTo(s4CurrentSlide + (goingDown ? 1 : -1));
    }, { passive: false, capture: true });

    // Keyboard ← →
    document.addEventListener('keydown', function (e) {
      const s4 = document.getElementById('s-section4');
      if (!s4) return;
      const rect = s4.getBoundingClientRect();
      if (rect.top < -50 || rect.top > window.innerHeight) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(s4CurrentSlide + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(s4CurrentSlide - 1); }
    });

    // Touch swipe
    let touchStartX = 0, touchStartY = 0;
    section.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    section.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 40) return;
      if (dx < 0) goTo(s4CurrentSlide + 1);
      else goTo(s4CurrentSlide - 1);
    }, { passive: true });

    // Frecce
    const prevBtn = document.getElementById('s4-prev');
    const nextBtn = document.getElementById('s4-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(s4CurrentSlide - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(s4CurrentSlide + 1); });

    // Dots
    document.querySelectorAll('.s4-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        const idx = parseInt(dot.dataset.dot);
        if (!isNaN(idx)) goTo(idx);
      });
    });
  }

  // ════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════

  function init() {
    setupCarouselEvents();
    goTo(0, false);
  }

  // Aspetta il DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();