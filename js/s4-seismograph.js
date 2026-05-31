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

  // [5] Descrizioni MCS per ogni grado I–XII
  const S4_MCS_DESC = [
    '',
    'Non percepito dall\'uomo — registrato solo dai sismografi.',
    'Percepito da persone sensibili ai piani alti. Oscillazione oggetti appesi.',
    'Percepito da più persone. Vibrazione simile a un camion.',
    'Percepito da tutti. Tintinnio vetri, vibrazioni vasellame e pareti.',
    'Sveglia chi dorme. Scricchiolii, tintinnii, spavento. Cadono calcinacci.',
    'Fa fuggire le persone all\'aperto. Caduta oggetti pesanti. Lesioni edifici.',
    'Panico. Caduta intonaci e tegole. Rottura vetri. Piccole frane.',
    'Danni anche a murature buone. Caduta torri e palizzate. Crepacci.',
    'Distrugge edifici non resistenti. Rompe tubazioni. Ampi crepacci nel suolo.',
    'Distrugge buona parte degli edifici. Danneggia dighe. Grandi frane.',
    'Rovina completa. Ogni tubazione rotta. Molte vittime.',
    'Distrugge ogni opera umana. Sposta grandi masse rocciose. Migliaia di vittime.'
  ];

  // [6] Poligoni isosismici approssimati (slide 12)
  const S4_ISO_ZONES = [
    {
      grade: 10, label: 'X — Distruttivo', color: '#4a0000', opacity: 0.75,
      zones: ['L\'Aquila centro storico', 'Onna', 'Paganica'],
      popup: 'Centro storico di L\'Aquila, Onna, Paganica. Tipo terreno: alluvionale.',
      coords: [[42.347, 13.382], [42.363, 13.382], [42.368, 13.405], [42.360, 13.420], [42.345, 13.418], [42.335, 13.405], [42.338, 13.385]]
    },
    {
      grade: 9, label: 'IX — Molto forte', color: '#8B1A1A', opacity: 0.70,
      zones: ['Poggio Picenze', 'San Gregorio', 'Roio'],
      popup: 'Comuni limitrofi all\'epicentro. Danni gravi a murature.',
      coords: [[42.320, 13.355], [42.382, 13.355], [42.390, 13.440], [42.375, 13.470], [42.330, 13.460], [42.310, 13.430], [42.310, 13.375]]
    },
    {
      grade: 8, label: 'VIII — Molto forte', color: '#C4612A', opacity: 0.65,
      zones: ['Pizzoli', 'Barete', 'Cagnano Amiterno'],
      popup: 'Pizzoli, Barete, Cagnano Amiterno. Danni strutturali diffusi.',
      coords: [[42.295, 13.300], [42.410, 13.300], [42.430, 13.490], [42.400, 13.530], [42.295, 13.510], [42.270, 13.420]]
    },
    {
      grade: 7, label: 'VII — Forte', color: '#D4893A', opacity: 0.60,
      zones: ['Area Sulmona', 'Avezzano', 'Teramo'],
      popup: 'Sulmona, Avezzano, Teramo. Danni locali, panico diffuso.',
      coords: [[42.20, 13.15], [42.50, 13.10], [42.65, 13.20], [42.70, 13.60], [42.50, 13.70], [42.20, 13.65], [42.10, 13.40]]
    },
    {
      grade: 6, label: 'VI — Moderato', color: '#8B8B00', opacity: 0.50,
      zones: ['Pescara', 'Rieti'],
      popup: 'Pescara, Rieti. Percepito nettamente, danni lievi.',
      coords: [[42.00, 12.90], [43.00, 12.90], [43.30, 14.00], [42.50, 14.20], [42.00, 13.90]]
    },
    {
      grade: 5, label: 'V — Avvertito', color: '#4a6a4a', opacity: 0.40,
      zones: ['Roma'],
      popup: 'Roma e circondario. Avvertito da molti, nessun danno.',
      coords: [[41.70, 12.30], [42.20, 12.20], [42.50, 13.00], [42.00, 13.10], [41.60, 12.80]]
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

    // Aggiorna counter
    const counter = document.getElementById('s4-counter');
    if (counter) counter.textContent = (idx + 1) + ' / ' + S4_TOTAL;

    // Aggiorna frecce
    const prev = document.getElementById('s4-prev');
    const next = document.getElementById('s4-next');
    if (prev) prev.style.opacity = idx === 0 ? '0.3' : '1';
    if (next) next.style.opacity = idx === S4_TOTAL - 1 ? '0.3' : '1';

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
      // Riavvia il loop
      if (s4SeismoState) {
        s4SeismoState.running = true;
        requestAnimationFrame(seismoLoop);
      }
      return;
    }
    s4SlideInited[0] = true;

    const canvas = document.getElementById('s4-seismo-canvas');
    if (!canvas) return;
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

    // Ridimensiona canvas
    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight || 300;
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

    // Inizializza buffer live
    for (let i = 0; i < 600; i++) {
      s4SeismoState.liveBuffer.push(generateNoiseSample(s4SeismoState));
    }

    // Fetch IRIS con fallback
    function fetchIRIS() {
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
            const lbl = document.getElementById('s4-sim-label');
            if (lbl) lbl.style.display = 'none';
            const lu = document.getElementById('s4-last-update');
            if (lu) lu.textContent = new Date().toLocaleTimeString('it-IT');
          }
        })
        .catch(function () {
          clearTimeout(timeout);
          // Fallback: continua con rumore sintetico
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

      const W = canvas.width;
      const H = canvas.height;
      const ctx2 = ctx;

      ctx2.clearRect(0, 0, W, H);

      // Sfondo
      ctx2.fillStyle = '#050505';
      ctx2.fillRect(0, 0, W, H);

      // Griglia orizzontale
      ctx2.strokeStyle = '#1a1a1a';
      ctx2.lineWidth = 1;
      const gridStep = H / 8;
      for (let y = 0; y < H; y += gridStep) {
        ctx2.beginPath();
        ctx2.moveTo(0, y);
        ctx2.lineTo(W, y);
        ctx2.stroke();
      }

      // Linea zero centrale tratteggiata
      ctx2.strokeStyle = '#2a2a2a';
      ctx2.setLineDash([4, 8]);
      ctx2.beginPath();
      ctx2.moveTo(0, H / 2);
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

        // Disegna tracciato live
        const lineColor = s4SeismoState.eventActive ? '#C4612A' : '#F5EDE0';
        ctx2.strokeStyle = lineColor;
        ctx2.lineWidth = 1.2;
        ctx2.beginPath();
        const pts = slice;
        for (let i = 0; i < pts.length; i++) {
          const x = i;
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
      s4AnimState.playing = true;
      requestAnimationFrame(animSismoLoop);
      return;
    }
    s4SlideInited[1] = true;

    const canvas = document.getElementById('s4-anim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width = canvas.offsetWidth || 460;
    const H = canvas.height = canvas.offsetHeight || 380;

    s4AnimState = {
      playing: true,
      phase: 0,       // 0=silenzio, 1=scossa, 2=lettura
      phaseT: 0,      // tempo dentro la fase (ms)
      totalT: 0,      // tempo totale
      supportX: 0,    // oscillazione supporto
      massX: 0,       // posizione massa
      massV: 0,       // velocità massa
      trace: [],      // tracciato pennino
      lastTs: 0
    };

    const PHASE_DUR = [2000, 3000, 1500]; // ms per fase

    const playBtn = document.getElementById('s4-anim-play');
    if (playBtn) playBtn.addEventListener('click', function () {
      s4AnimState.playing = !s4AnimState.playing;
      playBtn.textContent = s4AnimState.playing ? '⏸' : '▶';
      if (s4AnimState.playing) requestAnimationFrame(animSismoLoop);
    });

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
      const baseY   = H - 40 + supportOscY;
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
        const PPU        = 0.5;
        const YSCALE     = 1.4;
        s4AnimState.trace.forEach(function(pt, i) {
          const tx = traceRight - (newestT - pt.t) * PPU;
          const ty = rollTop + rollH / 2 + pt.y * YSCALE;
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

      const phase = s4AnimState.phase;

      let supportOscY = 0;
      let massOscY = 0;

      if (phase === 0) {
        // Silenzio — massa decade a zero
        s4AnimState.massV *= 0.94;
        s4AnimState.massX += s4AnimState.massV;
        massOscY = s4AnimState.massX;

        traceScroll += dt * 0.02;
        s4AnimState.trace.push({ t: traceScroll, y: s4AnimState.massX });

      } else if (phase === 1) {
        // Scossa — singola frequenza → picchi uguali
        const t = s4AnimState.phaseT / 1000;
        const env = Math.min(1, t * 3) * Math.max(0, 1 - (t - 2.6) * 4);
        supportOscY = env * 12 * Math.sin(t * 7.5);
        const force = (supportOscY - s4AnimState.massX) * 0.12;
        s4AnimState.massV = s4AnimState.massV * 0.90 + force;
        s4AnimState.massX += s4AnimState.massV;
        massOscY = s4AnimState.massX;

        traceScroll += dt * 0.025;
        const diff = supportOscY - s4AnimState.massX;
        s4AnimState.trace.push({ t: traceScroll, y: diff });

      } else if (phase === 2) {
        // Lettura — smorzamento
        s4AnimState.massV *= 0.90;
        s4AnimState.massX *= 0.94;
        massOscY = s4AnimState.massX;

        traceScroll += dt * 0.015;
        s4AnimState.trace.push({ t: traceScroll, y: s4AnimState.massX });
      }

      // Limita traccia
      if (s4AnimState.trace.length > 400) s4AnimState.trace.shift();

      // Avanza fase
      if (s4AnimState.phaseT > PHASE_DUR[phase]) {
        s4AnimState.phaseT = 0;
        s4AnimState.phase = (phase + 1) % 3;
        if (s4AnimState.phase === 0) { s4AnimState.trace = []; traceScroll = 0; }
        const labels = ['Terreno fermo — traccia piatta', 'Il suolo oscilla — la massa no — il pennino registra', 'Lettura del sismogramma'];
        const lbl = document.getElementById('s4-anim-label');
        if (lbl) lbl.textContent = labels[s4AnimState.phase];
      }

      drawSismograph(supportOscY, massOscY);
    }

    requestAnimationFrame(animSismoLoop);
  }

  // ════════════════════════════════════════
  // SLIDE 3 — STORIA (sub-carousel)
  // ════════════════════════════════════════

  let s4HistIdx = 0;

  function initSlide3() {
    if (s4SlideInited[2]) return;
    s4SlideInited[2] = true;

    const track = document.getElementById('s4-hist-track');
    if (!track) return;

    const HIST_TOTAL = 6;
    s4HistIdx = 0;

    function goHist(idx) {
      if (idx < 0) idx = 0;
      if (idx >= HIST_TOTAL) idx = HIST_TOTAL - 1;
      s4HistIdx = idx;
      track.style.transition = 'transform 0.35s ease';
      track.style.transform = 'translateX(-' + (idx * 280) + 'px)';
      const prev = document.getElementById('s4-hist-prev');
      const next = document.getElementById('s4-hist-next');
      if (prev) prev.style.opacity = idx === 0 ? '0.3' : '1';
      if (next) next.style.opacity = idx === HIST_TOTAL - 1 ? '0.3' : '1';
    }

    const prevBtn = document.getElementById('s4-hist-prev');
    const nextBtn = document.getElementById('s4-hist-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { goHist(s4HistIdx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goHist(s4HistIdx + 1); });

    // Drag/touch sul track
    let histDragStartX = 0;
    let histDragging = false;

    track.addEventListener('mousedown', function (e) {
      histDragStartX = e.clientX;
      histDragging = true;
    });
    document.addEventListener('mousemove', function (e) {
      if (!histDragging) return;
    });
    document.addEventListener('mouseup', function (e) {
      if (!histDragging) return;
      histDragging = false;
      const dx = e.clientX - histDragStartX;
      if (dx < -40) goHist(s4HistIdx + 1);
      else if (dx > 40) goHist(s4HistIdx - 1);
    });

    track.addEventListener('touchstart', function (e) {
      histDragStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - histDragStartX;
      if (dx < -40) goHist(s4HistIdx + 1);
      else if (dx > 40) goHist(s4HistIdx - 1);
    }, { passive: true });

    goHist(0);
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

    const W = canvas.width = canvas.offsetWidth || 800;
    const H = canvas.height = canvas.offsetHeight || 280;

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

      let giudizio;
      if (errAvg < 1) giudizio = 'Precisione da sismologo!';
      else if (errAvg < 3) giudizio = 'Buona approssimazione.';
      else giudizio = 'Riprova — cerca il cambio brusco di ampiezza.';

      const r2 = document.getElementById('s4-res2');
      if (r2) {
        r2.style.display = 'block';
        r2.innerHTML = '<div class="s4-verify-box"><p><strong>P reale:</strong> 03:32:41 UTC</p><p><strong>S reale:</strong> 03:32:49 UTC</p><p><strong>Gap reale:</strong> 8 s</p><p><strong>Distanza reale:</strong> ~65 km</p></div>';
      }
      const r2j = document.getElementById('s4-res2-judge');
      if (r2j) { r2j.textContent = giudizio; r2j.style.display = 'block'; }
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

    const W = canvas.width = canvas.offsetWidth || 340;
    const H = canvas.height = canvas.offsetHeight || 360;

    // Valori L'Aquila per animazione automatica
    const defaultGap = 0.8;   // secondi → 6.7 km
    const defaultAmp = 23;    // mm
    const defaultML = (Math.log10(defaultAmp) + 3 * Math.log10(6.7) - 2.92).toFixed(1);

    s4NomoState = {
      freeMode: false,
      gap: defaultGap,
      amp: defaultAmp,
      animProgress: 0,   // 0→1
      animDone: false
    };

    // Scala assi
    // Asse SX: distanza km, 0–500 (log approssimato)
    // Asse CX: magnitudo 0–7
    // Asse DX: ampiezza mm, log 0.1–100

    const leftX = 50, centerX = W / 2, rightX = W - 50;
    const topY = 30, bottomY = H - 30;
    const axisH = bottomY - topY;

    function distToY(km) {
      // Scala lineare 0–500
      return bottomY - (km / 500) * axisH;
    }
    function magToY(ml) {
      return bottomY - (ml / 7) * axisH;
    }
    function ampToY(mm) {
      // Log 0.1 → 100
      const logMin = Math.log10(0.1), logMax = Math.log10(100);
      return bottomY - ((Math.log10(Math.max(0.01, mm)) - logMin) / (logMax - logMin)) * axisH;
    }

    function gapToDist(gapS) {
      // distanza = Δt × 9.0 km/s (formula slide 9, approssimata)
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

      // Tick asse SX (distanza)
      ctx.fillStyle = cream;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      [10, 50, 100, 200, 500].forEach(function (km) {
        const y = distToY(km);
        ctx.beginPath();
        ctx.moveTo(leftX - 4, y);
        ctx.lineTo(leftX + 4, y);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(km + ' km', leftX - 6, y + 3);
      });

      // Tick asse centro (magnitudo)
      ctx.textAlign = 'center';
      ctx.fillStyle = terra;
      for (let m = 0; m <= 7; m++) {
        const y = magToY(m);
        ctx.beginPath();
        ctx.moveTo(centerX - 5, y);
        ctx.lineTo(centerX + 5, y);
        ctx.strokeStyle = terra;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(m, centerX, y + 3);
      }

      // Tick asse DX (ampiezza log)
      ctx.textAlign = 'left';
      ctx.fillStyle = cream;
      [0.1, 0.5, 1, 5, 10, 50, 100].forEach(function (mm) {
        const y = ampToY(mm);
        ctx.beginPath();
        ctx.moveTo(rightX - 4, y);
        ctx.lineTo(rightX + 4, y);
        ctx.strokeStyle = cream;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(mm + ' mm', rightX + 6, y + 3);
      });

      // Calcola riga
      const dist = gapToDist(gap);
      const ml = computeML(gap, amp);
      const yLeft = distToY(Math.min(dist, 500));
      const yRight = ampToY(Math.min(amp, 100));
      const yCenter = magToY(Math.max(0, Math.min(ml, 7)));

      // Disegna riga animata
      if (lineProgress > 0) {
        const p = Math.min(lineProgress, 1);
        // Interpolazione SX→centro→DX
        let x1, y1, x2, y2;
        if (p <= 0.5) {
          const t = p * 2;
          x1 = leftX; y1 = yLeft;
          x2 = leftX + (centerX - leftX) * t;
          y2 = yLeft + (yCenter - yLeft) * t;
        } else {
          const t = (p - 0.5) * 2;
          x1 = centerX; y1 = yCenter;
          x2 = centerX + (rightX - centerX) * t;
          y2 = yCenter + (yRight - yCenter) * t;
        }

        // Linea parziale SX→CX
        ctx.strokeStyle = terra;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (p <= 0.5) {
          ctx.moveTo(leftX, yLeft);
          ctx.lineTo(x2, y2);
        } else {
          ctx.moveTo(leftX, yLeft);
          ctx.lineTo(centerX, yCenter);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX, yCenter);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();

        // Pallino su asse centro
        if (p >= 0.5) {
          ctx.beginPath();
          ctx.arc(centerX, yCenter, 5, 0, Math.PI * 2);
          ctx.fillStyle = terra;
          ctx.fill();
        }

        // Label ML
        if (p >= 1 && showLabel) {
          const mlDisp = ml.toFixed(1);
          ctx.fillStyle = terra;
          ctx.font = 'bold 13px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('ML = ' + mlDisp + ' ✓', centerX, yCenter - 14);
          if (!freeMode) {
            ctx.font = '10px Cormorant Garamond, serif';
            ctx.fillStyle = ochre;
            ctx.fillText("L'Aquila 2009 · Stazione AQU", centerX, bottomY + 18);
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
      }
    }

    function updateMLDisplay() {
      const ml = computeML(s4NomoState.gap, s4NomoState.amp);
      const disp = document.getElementById('s4-ml-display');
      if (disp) disp.textContent = 'ML = ' + ml.toFixed(1);
    }

    function redrawFree() {
      drawNomo(1, s4NomoState.gap, s4NomoState.amp, true, true);
      updateMLDisplay();
    }

    requestAnimationFrame(nomoAnimLoop);

    // Toggle modalità libera
    const freeToggle = document.getElementById('s4-nomo-free');
    if (freeToggle) freeToggle.addEventListener('change', function () {
      s4NomoState.freeMode = freeToggle.checked;
      const inputs = document.getElementById('s4-nomo-inputs');
      if (inputs) inputs.style.display = s4NomoState.freeMode ? 'flex' : 'none';
      redrawFree();
    });

    const gapInput = document.getElementById('s4-nomo-gap');
    const ampInput = document.getElementById('s4-nomo-amp');
    if (gapInput) gapInput.addEventListener('input', function () {
      s4NomoState.gap = parseFloat(gapInput.value) || 0.8;
      redrawFree();
    });
    if (ampInput) ampInput.addEventListener('input', function () {
      s4NomoState.amp = parseFloat(ampInput.value) || 23;
      redrawFree();
    });
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

    function runCalcWithData(ev) {
      // Step 1 — evento
      const step1 = document.getElementById('s4-step1');
      if (step1) {
        const d = new Date(ev.time);
        const dateStr = d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT');
        const evDesc = document.getElementById('s4-ev-desc');
        if (evDesc) evDesc.innerHTML = '<strong>' + dateStr + ' &middot; ' + ev.place + '</strong><br>Magnitudo INGV: M ' + ev.mag.toFixed(1) + '<br>Coordinate: ' + ev.lat.toFixed(4) + '&deg;N ' + ev.lon.toFixed(4) + '&deg;E<br>Profondità: ' + ev.depth.toFixed(1) + ' km';
        step1.style.opacity = '1';
      }

      setTimeout(function () {
        // Step 2 — stazione più vicina
        let nearest = S4_STAZIONI[0];
        let nearDist = haversineKm(ev.lat, ev.lon, nearest.lat, nearest.lon);
        S4_STAZIONI.forEach(function (st) {
          const d = haversineKm(ev.lat, ev.lon, st.lat, st.lon);
          if (d < nearDist) { nearDist = d; nearest = st; }
        });

        const step2 = document.getElementById('s4-step2');
        if (step2) {
          const staDesc = document.getElementById('s4-sta-desc');
          if (staDesc) staDesc.innerHTML = 'Stazione più vicina: <strong>' + nearest.name + '</strong> &middot; ' + nearDist.toFixed(1) + ' km<br><small>(calcolata con formula Haversine)</small>';
          step2.style.opacity = '1';
        }

        setTimeout(function () {
          // Step 3 — calcolo
          const dtPS = Math.max(0.5, nearDist / 9.0);
          const ampEst = Math.pow(10, (ev.mag - 2.5) / 2);
          const step3 = document.getElementById('s4-step3');
          if (step3) {
            const calcDesc = document.getElementById('s4-calc-desc');
            if (calcDesc) calcDesc.innerHTML = 'Gap P-S stimato: <strong>' + dtPS.toFixed(1) + ' s</strong><br>Ampiezza stimata: <strong>' + ampEst.toFixed(2) + ' mm</strong><br><small>Stima didattica dalla magnitudo + distanza</small>';
            step3.style.opacity = '1';
          }

          setTimeout(function () {
            // Step 4 — verifica
            const logA = Math.log10(Math.max(0.01, ampEst));
            const logD = 3 * Math.log10(Math.max(0.1, nearDist));
            const mlCalc = logA + logD - 2.92;
            const diff = Math.abs(mlCalc - ev.mag).toFixed(1);

            const step4 = document.getElementById('s4-step4');
            if (step4) {
              const verDesc = document.getElementById('s4-verify-desc');
              if (verDesc) verDesc.innerHTML =
                'ML = log₁₀(' + ampEst.toFixed(2) + ') + 3&middot;log₁₀(' + nearDist.toFixed(1) + ') &minus; 2.92<br>' +
                '&nbsp;&nbsp;&nbsp; = ' + logA.toFixed(2) + ' + ' + logD.toFixed(2) + ' &minus; 2.92<br>' +
                '&nbsp;&nbsp;&nbsp; &asymp; <strong>' + mlCalc.toFixed(1) + '</strong><br>' +
                'Magnitudo INGV: M ' + ev.mag.toFixed(1) + '<br>' +
                'Differenza: &plusmn;' + diff + ' unit&agrave;';
              step4.style.opacity = '1';
            }
          }, 800);
        }, 800);
      }, 800);
    }

    // Reset steps
    ['s4-step1', 's4-step2', 's4-step3', 's4-step4'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.style.opacity = '0';
    });

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

    const slider = document.getElementById('s4-mcs-slider');
    if (!slider) return;

    function updateMCS(grade) {
      const roman = document.getElementById('s4-mcs-roman');
      const illus = document.getElementById('s4-mcs-illus');
      const textEl = document.getElementById('s4-mcs-text');
      const compareEl = document.getElementById('s4-mcs-compare-label');

      const color = mcsColor(grade);

      if (roman) { roman.textContent = toRoman(grade); roman.style.color = color; }
      if (textEl) textEl.textContent = S4_MCS_DESC[grade] || '';
      if (illus) illus.innerHTML = generateMCSIllus(grade, color);

      // Confronto L'Aquila
      let compareText;
      if (grade < 6) compareText = 'Non ancora il livello raggiunto a Roma quel giorno.';
      else if (grade <= 7) compareText = 'Come la periferia de L\'Aquila (Pile, Pettino).';
      else if (grade <= 9) compareText = 'Come i quartieri semicentrali.';
      else if (grade === 10) compareText = '← Centro storico e Onna.';
      else compareText = 'Più intenso di L\'Aquila.';
      if (compareEl) compareEl.textContent = compareText;
    }

    slider.addEventListener('input', function () {
      updateMCS(parseInt(slider.value));
    });

    updateMCS(parseInt(slider.value) || 6);
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
      // Riprova dopo un attimo (Leaflet potrebbe non essere ancora carico)
      setTimeout(initSlide9, 500);
      s4Map9Inited = false;
      return;
    }

    const map = L.map('s4-map9', {
      center: [42.2, 13.1],
      zoom: 8,
      scrollWheelZoom: false
    });
    s4Map9Instance = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 18
    }).addTo(map);

    // Colori stazioni
    const staColors = ['#C4612A', '#3A7EC4', '#D4893A', '#F5EDE0'];
    const staMarkers = [];
    const dtValues = S4_TRIA_STA.map(function (s) { return s.defaultDt; });
    let sta4Enabled = false;
    let circlesOnMap = [];
    let epiMarker = null;
    let realEpiMarker = null;

    // Crea marker stazioni
    S4_TRIA_STA.forEach(function (sta, i) {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:12px;height:12px;background:' + staColors[i] + ';clip-path:polygon(50% 0%,0% 100%,100% 100%);transform:translateX(-6px) translateY(-6px)"></div>',
        iconSize: [1, 1]
      });
      const mk = L.marker([sta.lat, sta.lon], { icon: icon }).addTo(map);
      mk.bindTooltip(sta.name, { permanent: true, direction: 'top', offset: [0, -8], className: 's4-map-tooltip' });
      staMarkers.push(mk);
    });
    // Nasconde stazione 4 inizialmente
    staMarkers[3].remove();

    // Slider stazioni
    document.querySelectorAll('.s4-sta-slider').forEach(function (sl, i) {
      sl.value = S4_TRIA_STA[i].defaultDt;
      sl.addEventListener('input', function () {
        dtValues[i] = parseFloat(sl.value);
        const lbl = document.getElementById('s4-sta-val-' + i);
        if (lbl) lbl.textContent = dtValues[i].toFixed(1) + ' s → ' + (dtValues[i] * 9.0).toFixed(0) + ' km';
      });
      const lbl = document.getElementById('s4-sta-val-' + i);
      if (lbl) lbl.textContent = dtValues[i].toFixed(1) + ' s → ' + (dtValues[i] * 9.0).toFixed(0) + ' km';
    });

    // Toggle stazione 4
    const togSta4 = document.getElementById('s4-sta4-toggle');
    if (togSta4) togSta4.addEventListener('change', function () {
      sta4Enabled = togSta4.checked;
      if (sta4Enabled) staMarkers[3].addTo(map);
      else staMarkers[3].remove();
      const sta4row = document.getElementById('s4-sta4-row');
      if (sta4row) sta4row.style.display = sta4Enabled ? 'block' : 'none';
    });

    // Calcola epicentro
    function calcEpicenter() {
      const nSta = sta4Enabled ? 4 : 3;
      const usedSta = S4_TRIA_STA.slice(0, nSta);
      const radii = dtValues.slice(0, nSta).map(function (dt) { return dt * 9.0; });

      // Griglia least squares: area 41-44N, 11-16E, passo 0.05°
      let bestLat = 42.3, bestLon = 13.3, bestErr = Infinity;
      for (let lat = 41.0; lat <= 44.0; lat += 0.05) {
        for (let lon = 11.0; lon <= 16.0; lon += 0.05) {
          let err = 0;
          usedSta.forEach(function (sta, i) {
            const d = haversineKm(lat, lon, sta.lat, sta.lon);
            err += (d - radii[i]) ** 2;
          });
          if (err < bestErr) { bestErr = err; bestLat = lat; bestLon = lon; }
        }
      }

      return { lat: bestLat, lon: bestLon };
    }

    const calcBtn = document.getElementById('s4-calc-epi');
    if (calcBtn) calcBtn.addEventListener('click', function () {
      // Rimuovi cerchi precedenti
      circlesOnMap.forEach(function (c) { c.remove(); });
      circlesOnMap = [];
      if (epiMarker) { epiMarker.remove(); epiMarker = null; }
      if (realEpiMarker) { realEpiMarker.remove(); realEpiMarker = null; }

      const nSta = sta4Enabled ? 4 : 3;
      const usedSta = S4_TRIA_STA.slice(0, nSta);
      const radii = dtValues.slice(0, nSta).map(function (dt) { return dt * 9.0; });

      // Anima cerchi con espansione
      usedSta.forEach(function (sta, i) {
        const targetR = radii[i] * 1000; // m
        const circle = L.circle([sta.lat, sta.lon], {
          radius: 10,
          color: staColors[i],
          fillColor: staColors[i],
          fillOpacity: 0.08,
          weight: 2
        }).addTo(map);
        circlesOnMap.push(circle);

        // Espansione animata
        let step = 0;
        const steps = 30;
        const timer = setInterval(function () {
          step++;
          const r = targetR * (step / steps);
          circle.setRadius(r);
          if (step >= steps) clearInterval(timer);
        }, 50);
      });

      // Calcola dopo l'animazione
      setTimeout(function () {
        const epi = calcEpicenter();
        const realLat = 42.3476, realLon = 13.3800;
        const errKm = haversineKm(epi.lat, epi.lon, realLat, realLon);

        // Marker epicentro calcolato
        const epiIcon = L.divIcon({
          className: '',
          html: '<div class="s4-epi-pulse" style="width:14px;height:14px;background:#C4612A;border-radius:50%;border:2px solid #fff;animation:s4-pulse 1s infinite"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        epiMarker = L.marker([epi.lat, epi.lon], { icon: epiIcon }).addTo(map);
        epiMarker.bindPopup('<strong>Epicentro calcolato</strong><br>' + epi.lat.toFixed(4) + '°N ' + epi.lon.toFixed(4) + '°E');

        // Marker epicentro reale
        const realIcon = L.divIcon({
          className: '',
          html: '<div style="width:12px;height:12px;background:#8B1A1A;border-radius:50%;border:2px solid #fff"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        realEpiMarker = L.marker([realLat, realLon], { icon: realIcon }).addTo(map);
        realEpiMarker.bindPopup('<strong>Epicentro INGV reale</strong><br>42.3476°N 13.3800°E');

        // Risultato
        const res = document.getElementById('s4-epi-result');
        if (res) res.innerHTML =
          'Epicentro calcolato: <strong>' + epi.lat.toFixed(4) + '°N ' + epi.lon.toFixed(4) + '°E</strong><br>' +
          'Epicentro INGV reale: <strong>42.3476°N 13.3800°E</strong><br>' +
          'Errore: <strong>' + errKm.toFixed(1) + ' km</strong>';
      }, 1600);
    });

    // Reset
    const resetBtn = document.getElementById('s4-reset-epi');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      circlesOnMap.forEach(function (c) { c.remove(); });
      circlesOnMap = [];
      if (epiMarker) { epiMarker.remove(); epiMarker = null; }
      if (realEpiMarker) { realEpiMarker.remove(); realEpiMarker = null; }
      document.querySelectorAll('.s4-sta-slider').forEach(function (sl, i) {
        sl.value = S4_TRIA_STA[i].defaultDt;
        dtValues[i] = S4_TRIA_STA[i].defaultDt;
        const lbl = document.getElementById('s4-sta-val-' + i);
        if (lbl) lbl.textContent = dtValues[i].toFixed(1) + ' s → ' + (dtValues[i] * 9.0).toFixed(0) + ' km';
      });
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

    const slider = document.getElementById('s4-richter-slider');
    if (!slider) return;

    function updateRichter(mag) {
      const E = Math.pow(10, 1.5 * mag + 4.8);
      const jouleEl = document.getElementById('s4-richter-joule');
      if (jouleEl) jouleEl.innerHTML = formatJoules(E);

      // Barra energia
      const barEl = document.getElementById('s4-richter-bar');
      if (barEl) {
        const pct = Math.min((mag / 10) * 100, 100);
        barEl.style.height = pct + '%';
        if (mag > 8) {
          barEl.setAttribute('data-overflow', 'true');
          const over = barEl.nextElementSibling;
          if (over) over.style.display = 'block';
        } else {
          barEl.removeAttribute('data-overflow');
          const over = barEl.nextElementSibling;
          if (over) over.style.display = 'none';
        }
      }

      // SVG illustrazione
      const illusEl = document.getElementById('s4-richter-illus');
      if (illusEl) illusEl.innerHTML = generateRichterIllus(mag);

      // Confronto
      const compareEl = document.getElementById('s4-richter-compare');
      if (compareEl) {
        const aquilaE = Math.pow(10, 1.5 * 6.3 + 4.8);
        if (Math.abs(mag - 6.3) < 0.15) {
          compareEl.textContent = '= L\'Aquila 2009';
        } else if (mag < 6.3) {
          const ratio = (aquilaE / E).toFixed(0);
          compareEl.textContent = ratio + '× meno energia di L\'Aquila';
        } else {
          const ratio = (E / aquilaE).toFixed(0);
          compareEl.textContent = ratio + '× più energia di L\'Aquila';
        }
      }

      // Frequenza
      const freqEl = document.getElementById('s4-richter-freq');
      if (freqEl) freqEl.textContent = 'Frequenza globale: ' + getRichterFreq(mag);

      // Aggiorna label slider
      const valEl = document.getElementById('s4-richter-val');
      if (valEl) valEl.textContent = 'M ' + parseFloat(mag).toFixed(1);
    }

    slider.addEventListener('input', function () {
      updateRichter(parseFloat(slider.value));
    });

    updateRichter(parseFloat(slider.value) || 6.3);
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
      scrollWheelZoom: false
    });
    s4Map12Instance = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 18
    }).addTo(map);

    // Aggiungi poligoni isosismici (dal più grande al più piccolo = Z-order corretto)
    const zonesReversed = S4_ISO_ZONES.slice().reverse();
    zonesReversed.forEach(function (zone) {
      const poly = L.polygon(zone.coords, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: zone.opacity,
        weight: 2,
        opacity: 0.9
      }).addTo(map);

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

    // Wheel event
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
    }, { passive: false });

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