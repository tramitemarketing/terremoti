/* ===== SEZIONE 6 — La difesa possibile ===== */
const S6 = (function() {
  'use strict';

// ===== SEZIONE 6 — Funzioni slide 1-4 + Carousel Infrastructure =====

// ----- SLIDE 2: Early Warning Canvas -----

function s6InitEWCanvas() {
  const canvas = document.getElementById('s6-ew-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let t = 0;
  let paused = false;
  let animId = null;

  const events = [
    { t: 0.0, label: 'Frattura — Faglia di Paganica', color: '#8B1A1A', type: 'dot' },
    { t: 1.5, label: 'Onda P raggiunge prima stazione', color: '#C4612A', type: 'wave' },
    { t: 2.0, label: "PRESTo elabora — ALLERTA EMESSA", color: '#FF3333', type: 'alert' },
    { t: 8.0, label: "Onde S raggiungono L'Aquila — SCOSSA", color: '#8B1A1A', type: 'shake' },
  ];

  const actions = [
    { tMin: 3, tMax: 5, label: '3s → Riparati sotto un tavolo' },
    { tMin: 5, tMax: 7, label: '5s → Un treno ad alta velocità può frenare' },
    { tMin: 7, tMax: 8, label: "8s → Un chirurgo può fermare l'operazione" },
  ];

  function timeToY(sec) {
    return 60 + (sec / 30) * (H - 100);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    const sx = (t >= 8 && t < 10) ? (Math.random() - 0.5) * 6 : 0;
    ctx.save();
    ctx.translate(sx, 0);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(245,237,224,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 60); ctx.lineTo(40, H - 40); ctx.stroke();

    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.4)';
    for (let sec = 0; sec <= 30; sec += 5) {
      const y = timeToY(sec);
      ctx.fillText('T+' + sec + 's', 2, y + 4);
      ctx.strokeStyle = 'rgba(245,237,224,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Finestra disponibile
    if (t >= 2) {
      const y3 = timeToY(3), y8 = timeToY(8);
      const barH = Math.min(timeToY(Math.min(t, 8)), y8) - y3;
      if (barH > 0) {
        ctx.fillStyle = 'rgba(50,180,80,0.15)';
        ctx.fillRect(45, y3, W - 50, barH);
        ctx.strokeStyle = 'rgba(50,180,80,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(45, y3, W - 50, barH);
        if (t >= 3 && t < 8) {
          ctx.font = 'bold 11px JetBrains Mono';
          ctx.fillStyle = 'rgba(50,200,80,0.9)';
          ctx.fillText('FINESTRA DISPONIBILE', 55, y3 + 18);
          const remaining = Math.max(0, 8 - t).toFixed(1);
          ctx.font = 'bold 20px JetBrains Mono';
          ctx.fillStyle = '#32FF64';
          ctx.fillText(remaining + 's', 55, y3 + 45);
        }
      }
    }

    // Azioni
    actions.forEach(function(a) {
      if (t >= a.tMin && t < a.tMax) {
        const y = timeToY((a.tMin + a.tMax) / 2);
        ctx.font = '12px Cormorant Garamond';
        ctx.fillStyle = 'rgba(50,200,80,0.85)';
        ctx.fillText('→ ' + a.label, 55, y);
      }
    });

    // Onda P avanzante
    if (t >= 1.5 && t < 8) {
      const waveFrac = Math.min((t - 1.5) / 6.5, 1);
      const waveY = timeToY(1.5 + waveFrac * 6.5);
      ctx.strokeStyle = 'rgba(196,97,42,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(45, waveY); ctx.lineTo(W - 10, waveY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '11px JetBrains Mono';
      ctx.fillStyle = 'rgba(196,97,42,0.9)';
      ctx.fillText('→ onda P', W - 75, waveY - 5);
    }

    // Banner ALLERTA
    if (t >= 2 && t < 4) {
      const alpha = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.fillStyle = 'rgba(255,30,30,' + (alpha * 0.8) + ')';
      const ay = timeToY(2);
      ctx.fillRect(45, ay - 18, W - 55, 24);
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillStyle = '#fff';
      ctx.fillText('⚠ ALLERTA SISMICA EMESSA', 55, ay - 1);
    }

    // Event dots
    events.forEach(function(ev) {
      if (t >= ev.t) {
        const y = timeToY(ev.t);
        const pulse = (ev.type === 'dot' && t < ev.t + 3) ? 0.5 + 0.5 * Math.sin(t * 5) : 1;
        ctx.beginPath();
        ctx.arc(40, y, 6 * pulse + 2, 0, Math.PI * 2);
        ctx.fillStyle = ev.color;
        ctx.fill();
        ctx.font = ev.type === 'shake' ? 'bold 13px Cormorant Garamond' : '12px Cormorant Garamond';
        ctx.fillStyle = ev.type === 'shake' ? '#FF4444' : ev.color;
        ctx.fillText(ev.label, 55, y + 4);
      }
    });

    // Cursore tempo corrente
    const curY = timeToY(t);
    ctx.strokeStyle = 'rgba(245,237,224,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(40, curY); ctx.lineTo(W, curY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  let lastTs = 0;
  function loop(ts) {
    if (!paused) {
      const dt = (ts - lastTs) / 1000;
      t = (t + dt * 1.5) % 32;
    }
    lastTs = ts;
    drawFrame();
    animId = requestAnimationFrame(loop);
  }

  // Draw static first frame — animation starts only on AVVIA click
  drawFrame();

  const btn = document.getElementById('s6-ew-pause');
  if (btn) {
    btn.addEventListener('click', function() {
      if (animId === null) {
        // First click: avvia
        paused = false;
        lastTs = 0;
        animId = requestAnimationFrame(loop);
        btn.textContent = '|| PAUSA';
      } else {
        paused = !paused;
        btn.textContent = paused ? '▶ RIPRENDI' : '|| PAUSA';
      }
    });
  }

  return { stop: function() { if (animId !== null) { cancelAnimationFrame(animId); animId = null; } } };
}

// ----- SLIDE 3: PSHA SVG -----

function s6InitPSHASvg() {
  const svg = document.getElementById('s6-psha-svg');
  if (!svg || svg.childElementCount > 0) return;

  const W = 460, H = 340;
  const pad = { top: 30, right: 30, bottom: 50, left: 60 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const points = [
    [0.05, 90], [0.08, 75], [0.10, 60], [0.13, 48], [0.15, 40],
    [0.18, 32], [0.20, 25], [0.24, 17], [0.275, 10], [0.35, 5],
    [0.40, 3], [0.50, 1.2], [0.60, 0.5]
  ];

  function px(g) { return pad.left + (g / 0.6) * cW; }
  function py(p) { return pad.top + (1 - p / 100) * cH; }

  var ns = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(ns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Sfondo
  el('rect', { x: 0, y: 0, width: W, height: H, fill: '#0d0d0d' }, svg);

  // Griglia
  var grid = el('g', { stroke: 'rgba(245,237,224,0.06)', 'stroke-width': '1' }, svg);
  [0, 20, 40, 60, 80, 100].forEach(function(p) {
    el('line', { x1: pad.left, y1: py(p), x2: W - pad.right, y2: py(p) }, grid);
  });
  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function(g) {
    el('line', { x1: px(g), y1: pad.top, x2: px(g), y2: H - pad.bottom }, grid);
  });

  // Asse X
  el('line', { x1: pad.left, y1: H - pad.bottom, x2: W - pad.right, y2: H - pad.bottom, stroke: 'rgba(245,237,224,0.3)', 'stroke-width': '1' }, svg);
  var axX = el('g', { fill: 'rgba(245,237,224,0.5)', 'font-size': '10', 'font-family': 'JetBrains Mono' }, svg);
  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function(g) {
    var t = el('text', { x: px(g), y: H - pad.bottom + 16, 'text-anchor': 'middle' }, axX);
    t.textContent = g.toFixed(1) + 'g';
  });
  var lblX = el('text', { x: W / 2, y: H - 5, 'text-anchor': 'middle', fill: 'rgba(245,237,224,0.5)', 'font-size': '11', 'font-family': 'JetBrains Mono' }, svg);
  lblX.textContent = 'PGA (accelerazione picco)';

  // Asse Y
  el('line', { x1: pad.left, y1: pad.top, x2: pad.left, y2: H - pad.bottom, stroke: 'rgba(245,237,224,0.3)', 'stroke-width': '1' }, svg);
  var axY = el('g', { fill: 'rgba(245,237,224,0.5)', 'font-size': '10', 'font-family': 'JetBrains Mono' }, svg);
  [0, 20, 40, 60, 80, 100].forEach(function(p) {
    var t = el('text', { x: pad.left - 6, y: py(p) + 4, 'text-anchor': 'end' }, axY);
    t.textContent = p + '%';
  });
  var lblY = el('text', {
    transform: 'rotate(-90,' + 12 + ',' + (H / 2) + ')',
    x: 12, y: H / 2,
    'text-anchor': 'middle', fill: 'rgba(245,237,224,0.5)',
    'font-size': '10', 'font-family': 'JetBrains Mono'
  }, svg);
  lblY.textContent = 'P(superamento in 50 anni)';

  // Area sotto curva
  var pathD = 'M ' + px(points[0][0]) + ' ' + py(points[0][1]);
  points.forEach(function(pt) { pathD += ' L ' + px(pt[0]) + ' ' + py(pt[1]); });
  pathD += ' L ' + px(0.6) + ' ' + py(0) + ' L ' + px(0.05) + ' ' + py(0) + ' Z';
  el('path', { d: pathD, fill: 'rgba(196,97,42,0.08)', stroke: 'none' }, svg);

  // Curva principale
  var lineD = 'M ' + px(points[0][0]) + ' ' + py(points[0][1]);
  points.forEach(function(pt) { lineD += ' L ' + px(pt[0]) + ' ' + py(pt[1]); });
  el('path', { d: lineD, fill: 'none', stroke: '#C4612A', 'stroke-width': '2.5' }, svg);

  // Marker (0.275g, 10%)
  var mx = px(0.275), my = py(10);
  el('line', { x1: pad.left, y1: my, x2: mx, y2: my, stroke: 'rgba(196,97,42,0.5)', 'stroke-width': '1', 'stroke-dasharray': '4,4' }, svg);
  el('line', { x1: mx, y1: my, x2: mx, y2: H - pad.bottom, stroke: 'rgba(196,97,42,0.5)', 'stroke-width': '1', 'stroke-dasharray': '4,4' }, svg);
  el('circle', { cx: mx, cy: my, r: 6, fill: '#C4612A', stroke: '#FF8C42', 'stroke-width': '1.5' }, svg);

  // Box label marker
  var lbg = el('g', {}, svg);
  el('rect', { x: mx - 120, y: my - 62, width: 210, height: 58, rx: '3', fill: 'rgba(10,10,10,0.9)', stroke: 'rgba(196,97,42,0.4)', 'stroke-width': '1' }, lbg);
  var lt = el('text', { x: mx - 114, y: my - 44, fill: '#C4612A', 'font-size': '10', 'font-family': 'JetBrains Mono' }, lbg);
  lt.textContent = "L'Aquila 2009";
  var lt2 = el('text', { x: mx - 114, y: my - 30, fill: 'rgba(245,237,224,0.8)', 'font-size': '10', 'font-family': 'JetBrains Mono' }, lbg);
  lt2.textContent = 'PGA registrata: ~0.35g';
  var lt3 = el('text', { x: mx - 114, y: my - 16, fill: 'rgba(245,237,224,0.8)', 'font-size': '10', 'font-family': 'JetBrains Mono' }, lbg);
  lt3.textContent = 'â† sulla mappa INGV dal 2004';

  // Punto PGA reale 0.35g
  el('circle', { cx: px(0.35), cy: py(5), r: 5, fill: '#8B1A1A', stroke: '#FF3333', 'stroke-width': '1.5' }, svg);
  el('line', { x1: px(0.35), y1: H - pad.bottom, x2: px(0.35), y2: py(5), stroke: 'rgba(139,26,26,0.5)', 'stroke-width': '1', 'stroke-dasharray': '3,3' }, svg);
  var pReal = el('text', { x: px(0.35) + 4, y: H - pad.bottom - 8, fill: '#FF4444', 'font-size': '10', 'font-family': 'JetBrains Mono' }, svg);
  pReal.textContent = '0.35g reale';
}

// ----- SLIDE 4: Model Cards -----

function s6InitModelCards() {
  document.querySelectorAll('.s6-model-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var target = parseInt(card.dataset.goto);
      if (!isNaN(target)) s6GoTo(target);
    });
  });
}

// ===== CAROSELLO S6 =====

var s6Current = 0;
var S6_TOTAL = 14;
var s6IsActive = false;
var s6Canvases = {};

function s6GoTo(idx) {
  idx = Math.max(0, Math.min(S6_TOTAL - 1, idx));
  s6Current = idx;
  var track = document.getElementById('s6-track');
  if (track) track.style.transform = 'translateX(-' + (idx * 100) + 'vw)';

  document.querySelectorAll('.s6-dot').forEach(function(d, i) {
    d.classList.toggle('active', i === idx);
  });

  var counter = document.getElementById('s6-counter');
  if (counter) counter.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(S6_TOTAL).padStart(2, '0');

  s6LazyInit(idx);
}

function s6LazyInit(idx) {
  var inits = {
    1: function() { if (!s6Canvases.ew) s6Canvases.ew = s6InitEWCanvas(); },
    2: function() { if (!s6Canvases.psha) { s6InitPSHASvg(); s6Canvases.psha = true; } },
    3: function() { if (!s6Canvases.models) { s6InitModelCards(); s6Canvases.models = true; } },
    4: function() { if (typeof s6InitGRCanvas === 'function' && !s6Canvases.gr) s6Canvases.gr = s6InitGRCanvas(); },
    5: function() { if (typeof s6InitPoissonCanvas === 'function' && !s6Canvases.poisson) s6Canvases.poisson = s6InitPoissonCanvas(); },
    6: function() { if (typeof s6InitBPTCanvas === 'function' && !s6Canvases.bpt) s6Canvases.bpt = s6InitBPTCanvas(); },
    7: function() { if (typeof s6InitETASCanvas === 'function' && !s6Canvases.etas) s6Canvases.etas = s6InitETASCanvas(); },
    8: function() { if (typeof s6InitNNCanvas === 'function' && !s6Canvases.nn) s6Canvases.nn = s6InitNNCanvas(); },
    9: function() { if (typeof s6InitComparatore === 'function' && !s6Canvases.comp) { s6InitComparatore(); s6Canvases.comp = true; } },
    10: function() { if (typeof s6InitTimeline === 'function' && !s6Canvases.tl) { s6InitTimeline(); s6Canvases.tl = true; } },
    11: function() { if (typeof s6InitEngineering === 'function' && !s6Canvases.eng) { s6InitEngineering(); s6Canvases.eng = true; } },
    12: function() { if (typeof s6InitOpenQuake === 'function' && !s6Canvases.oq) { s6InitOpenQuake(); s6Canvases.oq = true; } },
  };
  if (inits[idx]) inits[idx]();
}

function s6HandleWheel(e) {
  if (!s6IsActive) return;
  e.preventDefault();
  var delta = e.deltaY || e.deltaX;
  if (delta > 0) {
    if (s6Current < S6_TOTAL - 1) {
      s6GoTo(s6Current + 1);
    } else {
      s6IsActive = false;
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  } else if (delta < 0) {
    if (s6Current > 0) {
      s6GoTo(s6Current - 1);
    } else {
      s6IsActive = false;
    }
  }
}

var s6TouchStartX = 0;
function s6HandleTouchStart(e) {
  s6TouchStartX = e.touches[0].clientX;
}
function s6HandleTouchEnd(e) {
  if (!s6IsActive) return;
  var dx = e.changedTouches[0].clientX - s6TouchStartX;
  if (Math.abs(dx) > 50) {
    s6GoTo(s6Current + (dx < 0 ? 1 : -1));
  }
}

function s6HandleKey(e) {
  if (!s6IsActive) return;
  if (e.key === 'ArrowRight') s6GoTo(s6Current + 1);
  if (e.key === 'ArrowLeft') s6GoTo(s6Current - 1);
}

function s6InitCarousel() {
  var section = document.getElementById('s-section6');
  if (!section) return;

  var prev = document.getElementById('s6-prev');
  var next = document.getElementById('s6-next');
  if (prev) prev.addEventListener('click', function() { s6GoTo(s6Current - 1); });
  if (next) next.addEventListener('click', function() { s6GoTo(s6Current + 1); });

  document.querySelectorAll('.s6-dot').forEach(function(dot, i) {
    dot.addEventListener('click', function() { s6GoTo(i); });
  });

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      s6IsActive = entry.isIntersecting && entry.intersectionRatio > 0.5;
    });
  }, { threshold: 0.5 });
  observer.observe(section);

  section.addEventListener('wheel', s6HandleWheel, { passive: false });
  section.addEventListener('touchstart', s6HandleTouchStart, { passive: true });
  section.addEventListener('touchend', s6HandleTouchEnd, { passive: true });
  document.addEventListener('keydown', s6HandleKey);

  s6GoTo(0);
  s6InitPSHASvg();
  s6InitModelCards();
}

function s6InitGRCanvas() {
  const canvas = document.getElementById('s6-gr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  // G-R parameters (Appennino centrale)
  const a = 4.2, b = 1.0;

  // Dati scatter reali hardcoded (M, log10_N_anno) approssimati da catalogo INGV
  const scatterData = [
    [2.5, 2.8],[2.7, 2.6],[2.9, 2.4],[3.0, 2.2],[3.2, 2.0],
    [3.5, 1.75],[3.7, 1.55],[4.0, 1.2],[4.2, 1.0],[4.5, 0.7],
    [4.8, 0.45],[5.0, 0.2],[5.3, -0.1],[5.5, -0.3],[5.8, -0.6],
    [6.0, -0.8],[6.3, -1.6]
  ];

  let currentM = 6.3;

  function mToX(m) { return pad.left + ((m - 2.0) / (8.0 - 2.0)) * cW; }
  function logNToY(logN) { return pad.top + (1 - (logN + 3) / 6) * cH; }

  function drawGR() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Griglia
    ctx.strokeStyle = 'rgba(245,237,224,0.05)';
    ctx.lineWidth = 1;
    for (let logN = -3; logN <= 3; logN++) {
      const y = logNToY(logN);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }
    for (let m = 2; m <= 8; m++) {
      const x = mToX(m);
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke();
    }

    // Assi
    ctx.strokeStyle = 'rgba(245,237,224,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, H - pad.bottom);
    ctx.moveTo(pad.left, H - pad.bottom); ctx.lineTo(W - pad.right, H - pad.bottom);
    ctx.stroke();

    // Labels asse X
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.5)';
    ctx.textAlign = 'center';
    for (let m = 2; m <= 8; m += 1) {
      ctx.fillText('M' + m, mToX(m), H - pad.bottom + 16);
    }

    // Labels asse Y
    ctx.textAlign = 'right';
    for (let logN = -3; logN <= 3; logN++) {
      ctx.fillText(logN, pad.left - 5, logNToY(logN) + 4);
    }
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('logâ‚₀(N/anno)', 0, 0);
    ctx.restore();

    // Linea G-R
    ctx.strokeStyle = '#C4612A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let m = 2.0; m <= 8.0; m += 0.1) {
      const logN = a - b * m;
      const x = mToX(m);
      const y = logNToY(logN);
      m === 2.0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Scatter INGV
    scatterData.forEach(([m, logN]) => {
      ctx.beginPath();
      ctx.arc(mToX(m), logNToY(logN), 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(196,97,42,0.7)';
      ctx.fill();
    });

    // Marker M corrente
    const curLogN = a - b * currentM;
    const curX = mToX(currentM);
    const curY = logNToY(curLogN);

    // Linee tratteggiate
    ctx.strokeStyle = 'rgba(212,137,58,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pad.left, curY); ctx.lineTo(curX, curY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(curX, curY); ctx.lineTo(curX, H - pad.bottom); ctx.stroke();
    ctx.setLineDash([]);

    // Punto corrente
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#D4893A';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Marker fisso M=6.3
    if (Math.abs(currentM - 6.3) > 0.2) {
      const fx = mToX(6.3), fy = logNToY(a - b * 6.3);
      ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,26,26,0.6)'; ctx.fill();
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = 'rgba(139,26,26,0.8)';
      ctx.textAlign = 'left';
      ctx.fillText("L'Aq.", fx + 6, fy - 4);
    }
  }

  function updateStats() {
    const M = currentM;
    const logN = a - b * M;
    const N = Math.pow(10, logN);
    const returnYears = 1 / N;
    const prob50 = (1 - Math.exp(-N * 50)) * 100;
    const stats = document.getElementById('s6-gr-stats');
    if (stats) {
      stats.innerHTML = 'N = ' + (N < 0.01 ? N.toExponential(2) : N.toFixed(3)) + ' eventi/anno con M≥' + M.toFixed(1) + '<br>' +
        'In 50 anni: <strong style="color:var(--terracotta)">' + prob50.toFixed(1) + '%</strong><br>' +
        'Tempo di ritorno medio: ' + Math.round(returnYears) + ' anni';
    }
  }

  drawGR();
  updateStats();

  const slider = document.getElementById('s6-gr-slider');
  const mVal = document.getElementById('s6-gr-m-val');
  if (slider) {
    slider.addEventListener('input', () => {
      currentM = parseInt(slider.value) / 10;
      if (mVal) mVal.textContent = currentM.toFixed(1);
      drawGR();
      updateStats();
    });
  }

  return { stop: () => {} };
}

function s6InitPoissonCanvas() {
  const canvas = document.getElementById('s6-poisson-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let events = [];
  let simRunning = false;

  function drawTimeline(highlightN) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Asse timeline
    ctx.strokeStyle = 'rgba(245,237,224,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, H - 40);
    ctx.lineTo(W - 20, H - 40);
    ctx.stroke();

    // Labels anno
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.4)';
    ctx.textAlign = 'center';
    [0, 500, 1000, 1500, 2000].forEach(yr => {
      const x = 20 + (yr / 2000) * (W - 40);
      ctx.fillText(yr, x, H - 25);
      ctx.strokeStyle = 'rgba(245,237,224,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, H - 40); ctx.stroke();
    });

    // Label asse
    ctx.fillStyle = 'rgba(245,237,224,0.4)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('anni', W - 20, H - 25);

    // Titolo
    ctx.fillStyle = 'rgba(245,237,224,0.5)';
    ctx.textAlign = 'left';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText('EVENTI M≥6.3 · SIMULAZIONE POISSON (λ=0.0016/anno)', 20, 20);

    // Eventi
    events.forEach((yr, i) => {
      const x = 20 + (yr / 2000) * (W - 40);
      const isHighlighted = highlightN !== undefined && i === highlightN;
      ctx.strokeStyle = isHighlighted ? '#FF8C42' : 'rgba(196,97,42,0.7)';
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, H - 42);
      ctx.stroke();
    });
  }

  function generatePoisson() {
    const lambda = 1 / 630; // eventi M>=6.3 per anno
    const years = 2000;
    events = [];
    let t = 0;
    while (t < years) {
      // Distribuzione esponenziale: -ln(U)/lambda
      const dt = -Math.log(1 - Math.random()) / lambda;
      t += dt;
      if (t < years) events.push(t);
    }
    return events;
  }

  async function runSimulation() {
    if (simRunning) return;
    simRunning = true;
    const btn = document.getElementById('s6-poisson-btn');
    const log = document.getElementById('s6-poisson-log');
    const stats = document.getElementById('s6-poisson-stats');
    if (btn) btn.disabled = true;
    if (stats) stats.style.display = 'none';

    generatePoisson();

    // Animazione: rivelazione progressiva
    for (let i = 0; i < events.length; i++) {
      if (log) log.textContent = 'Evento ' + (i+1) + ' — anno ' + Math.round(events[i]);
      drawTimeline(i);
      await new Promise(r => setTimeout(r, Math.max(5, 100 - i * 2)));
    }

    drawTimeline();

    // Statistiche finali
    const intervals = events.slice(1).map((y, i) => y - events[i]);
    const avgI = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const minI = Math.min(...intervals);
    const maxI = Math.max(...intervals);

    if (stats) {
      stats.style.display = 'block';
      stats.innerHTML = 'Numero eventi: ' + events.length + '<br>' +
        'Intervallo medio: ' + Math.round(avgI) + ' anni (atteso: ~630)<br>' +
        'Intervallo minimo: ' + Math.round(minI) + ' anni<br>' +
        'Intervallo massimo: ' + Math.round(maxI) + ' anni';
    }
    if (log) log.textContent = '';
    if (btn) { btn.disabled = false; btn.textContent = '↺ NUOVA SIMULAZIONE'; }
    simRunning = false;
  }

  drawTimeline();

  const btn = document.getElementById('s6-poisson-btn');
  if (btn) btn.addEventListener('click', runSimulation);

  return { stop: () => {} };
}

function s6InitBPTCanvas() {
  const canvas = document.getElementById('s6-bpt-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Parametri BPT Faglia di Paganica
  const mu = 500;    // intervallo medio anni (paleosismica Cinti 2011)
  const alpha = 0.5; // COV
  const resetYear = 1461; // anno ultima rottura faglia Paganica (Cinti 2011)

  // Distribuzione log-normale (BPT approssimata con lognormal)
  function bptPDF(t) {
    if (t <= 0) return 0;
    const sigma = alpha;
    const lnMu = Math.log(mu) - 0.5 * sigma * sigma;
    const x = Math.log(t);
    return Math.exp(-Math.pow(x - lnMu, 2) / (2 * sigma * sigma)) / (t * sigma * Math.sqrt(2 * Math.PI));
  }

  // CDF numerica
  function bptCDF(t, steps) {
    if (t <= 0) return 0;
    steps = steps || 200;
    const dt = t / steps;
    let sum = 0;
    for (let i = 1; i <= steps; i++) {
      sum += bptPDF(i * dt - dt/2) * dt;
    }
    return Math.min(sum, 0.9999);
  }

  // Hazard h(t) = f(t)/(1-F(t))
  function bptHazard(t) {
    const f = bptPDF(t);
    const F = bptCDF(t);
    return f / Math.max(1 - F, 0.001);
  }

  // Probabilita' condizionale in T anni dato che l'evento non e' ancora avvenuto dopo t anni
  function conditionalProb(t, T) {
    const F_t = bptCDF(t);
    const F_tT = bptCDF(t + T);
    return (F_tT - F_t) / Math.max(1 - F_t, 0.001);
  }

  let currentYear = 2009;

  function drawBPT() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    const t = Math.max(1, currentYear - resetYear);
    const maxT = 1400;

    // GRAFICO 1 — PDF (meta' superiore)
    const g1 = { x: 50, y: 15, w: W - 65, h: H/2 - 25 };

    // Max PDF per scaling
    let maxPDF = 0;
    for (let i = 1; i <= 200; i++) {
      maxPDF = Math.max(maxPDF, bptPDF(i * maxT / 200));
    }

    function pdf_px(t_) { return g1.x + (t_ / maxT) * g1.w; }
    function pdf_py(f) { return g1.y + g1.h - (f / maxPDF) * g1.h * 0.9; }

    // Griglia G1
    ctx.strokeStyle = 'rgba(245,237,224,0.05)';
    ctx.lineWidth = 1;
    [0, 350, 700, 1050, 1400].forEach(tt => {
      const x = pdf_px(tt);
      ctx.beginPath(); ctx.moveTo(x, g1.y); ctx.lineTo(x, g1.y + g1.h); ctx.stroke();
    });

    // Asse X G1
    ctx.strokeStyle = 'rgba(245,237,224,0.2)';
    ctx.beginPath(); ctx.moveTo(g1.x, g1.y+g1.h); ctx.lineTo(g1.x+g1.w, g1.y+g1.h); ctx.stroke();
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.4)';
    ctx.textAlign = 'center';
    [0,350,700,1050,1400].forEach(tt => {
      ctx.fillText(tt + ' a.', pdf_px(tt), g1.y + g1.h + 12);
    });

    // Label G1
    ctx.fillStyle = 'rgba(245,237,224,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('f(t) — densità BPT', g1.x + 4, g1.y + 12);

    // Area sotto curva fino a t corrente
    ctx.fillStyle = 'rgba(196,97,42,0.08)';
    ctx.beginPath();
    ctx.moveTo(pdf_px(0), pdf_py(0));
    for (let i = 1; i <= 200; i++) {
      const ti = (i / 200) * Math.min(t, maxT);
      ctx.lineTo(pdf_px(ti), pdf_py(bptPDF(ti)));
    }
    ctx.lineTo(pdf_px(Math.min(t, maxT)), pdf_py(0));
    ctx.closePath();
    ctx.fill();

    // Curva PDF completa
    ctx.strokeStyle = '#C4612A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const ti = (i / 200) * maxT;
      const py = pdf_py(bptPDF(ti));
      i === 0 ? ctx.moveTo(pdf_px(ti), py) : ctx.lineTo(pdf_px(ti), py);
    }
    ctx.stroke();

    // Marker reset 1461
    ctx.strokeStyle = 'rgba(245,237,224,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(pdf_px(0), g1.y); ctx.lineTo(pdf_px(0), g1.y+g1.h); ctx.stroke();
    ctx.setLineDash([]);

    // Marker anno corrente
    const curX = pdf_px(Math.min(t, maxT));
    ctx.strokeStyle = '#D4893A';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(curX, g1.y); ctx.lineTo(curX, g1.y+g1.h); ctx.stroke();
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.fillStyle = '#D4893A';
    ctx.textAlign = 'center';
    ctx.fillText('Siamo qui · ' + currentYear, Math.min(curX, W - 60), g1.y + 26);

    // GRAFICO 2 — Hazard (meta' inferiore)
    const g2 = { x: 50, y: H/2 + 15, w: W - 65, h: H/2 - 30 };

    let maxH = 0;
    for (let i = 1; i <= 200; i++) {
      maxH = Math.max(maxH, bptHazard(i * maxT / 200));
    }

    function haz_px(t_) { return g2.x + (t_ / maxT) * g2.w; }
    function haz_py(h) { return g2.y + g2.h - (h / maxH) * g2.h * 0.85; }

    // Asse G2
    ctx.strokeStyle = 'rgba(245,237,224,0.2)';
    ctx.beginPath(); ctx.moveTo(g2.x, g2.y+g2.h); ctx.lineTo(g2.x+g2.w, g2.y+g2.h); ctx.stroke();
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.4)';
    ctx.textAlign = 'center';
    [0,350,700,1050,1400].forEach(tt => {
      ctx.fillText(tt + ' a.', haz_px(tt), g2.y + g2.h + 12);
    });

    ctx.fillStyle = 'rgba(245,237,224,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('h(t) — hazard rate', g2.x + 4, g2.y + 12);

    // Curva hazard
    ctx.strokeStyle = '#3A7EC4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i <= 200; i++) {
      const ti = (i / 200) * maxT;
      const py = haz_py(bptHazard(ti));
      i === 1 ? ctx.moveTo(haz_px(ti), py) : ctx.lineTo(haz_px(ti), py);
    }
    ctx.stroke();

    // Marker anno corrente su hazard
    const curHX = haz_px(Math.min(t, maxT));
    ctx.strokeStyle = '#D4893A';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(curHX, g2.y); ctx.lineTo(curHX, g2.y+g2.h); ctx.stroke();
  }

  function updateDisplay() {
    const t = Math.max(1, currentYear - resetYear);
    const p50 = conditionalProb(t, 50) * 100;
    const p10 = conditionalProb(t, 10) * 100;
    const disp = document.getElementById('s6-bpt-display');
    if (disp) {
      disp.innerHTML = 'Anno: ' + currentYear + '<br>' +
        'Tempo dalla faglia: ' + t + ' anni<br>' +
        'P(evento nei prossimi 50 anni): <strong style="color:var(--terracotta)">' + p50.toFixed(1) + '%</strong><br>' +
        'P(evento nei prossimi 10 anni): <strong style="color:var(--ochre)">' + p10.toFixed(1) + '%</strong>';
    }
    const label = document.getElementById('s6-bpt-year-label');
    if (label) label.textContent = currentYear;
  }

  drawBPT();
  updateDisplay();

  const slider = document.getElementById('s6-bpt-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      currentYear = parseInt(slider.value);
      drawBPT();
      updateDisplay();
    });
  }

  // Preset buttons
  document.querySelectorAll('.s6-bpt-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const year = parseInt(btn.dataset.year);
      currentYear = year;
      if (slider) slider.value = year;
      drawBPT();
      updateDisplay();
    });
  });

  return { stop: () => {} };
}

function s6InitETASCanvas() {
  const canvas = document.getElementById('s6-etas-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Dati sciame L'Aquila hardcoded (t = giorni dal 1 dic 2008)
  // Fonte: approssimazione bollettino INGV, dati pubblici
  const SCIAME = [
    // Dicembre 2008 — background sismicita'
    {t:1,m:1.5},{t:2,m:1.6},{t:3,m:1.7},{t:4,m:1.5},{t:5,m:1.8},
    {t:6,m:1.5},{t:7,m:2.0},{t:8,m:1.6},{t:9,m:1.5},{t:10,m:1.7},
    {t:11,m:1.5},{t:12,m:2.1},{t:13,m:1.6},{t:14,m:1.5},{t:15,m:1.8},
    {t:16,m:1.5},{t:17,m:1.7},{t:18,m:1.5},{t:19,m:2.2},{t:20,m:1.5},
    {t:21,m:1.6},{t:22,m:1.5},{t:23,m:1.7},{t:24,m:1.5},{t:25,m:1.9},
    {t:26,m:1.5},{t:27,m:2.3},{t:28,m:1.5},{t:29,m:1.6},{t:30,m:1.7},
    // Gennaio 2009
    {t:31,m:1.5},{t:32,m:1.8},{t:33,m:1.5},{t:34,m:2.0},{t:35,m:1.6},
    {t:36,m:1.5},{t:37,m:1.7},{t:38,m:1.5},{t:39,m:1.8},{t:40,m:1.5},
    {t:41,m:1.6},{t:42,m:1.5},{t:43,m:2.4},{t:44,m:1.7},{t:45,m:1.5},
    {t:46,m:1.6},{t:47,m:1.5},{t:48,m:2.0},{t:49,m:1.5},{t:50,m:1.7},
    // 30 gennaio M3.9 + cluster aftershock
    {t:61,m:3.9},{t:61.1,m:2.8},{t:61.3,m:2.2},{t:61.5,m:2.0},
    {t:62,m:2.5},{t:62.5,m:1.9},{t:63,m:2.1},{t:63.5,m:1.8},
    {t:64,m:2.3},{t:65,m:2.0},{t:66,m:1.8},{t:67,m:1.7},{t:68,m:2.1},
    // Febbraio-Marzo crescita
    {t:70,m:1.5},{t:72,m:1.8},{t:74,m:2.0},{t:76,m:1.7},{t:78,m:1.9},
    {t:80,m:2.2},{t:82,m:1.6},{t:84,m:1.8},{t:86,m:2.0},{t:88,m:1.7},
    {t:90,m:1.9},{t:92,m:2.1},{t:94,m:1.8},{t:96,m:2.0},{t:98,m:1.7},
    {t:100,m:2.3},{t:102,m:1.8},{t:104,m:2.0},{t:106,m:1.9},{t:108,m:2.2},
    {t:110,m:1.7},{t:112,m:2.0},{t:114,m:1.8},{t:116,m:2.1},{t:118,m:1.9},
    // 30 marzo M4.0 + cluster
    {t:120,m:4.0},{t:120.2,m:3.1},{t:120.4,m:2.6},{t:120.7,m:2.3},
    {t:121,m:2.8},{t:121.5,m:2.4},{t:122,m:2.7},{t:122.5,m:2.2},
    {t:123,m:3.0},{t:123.5,m:2.5},{t:124,m:2.2},{t:124.5,m:2.0},
    {t:125,m:2.4},{t:125.5,m:2.1},{t:126,m:2.3},{t:126.5,m:2.0},
    // 6 aprile = giorno 127 (dal 1 dic)
    {t:127,m:6.3},
    // Aftershock mainshock
    {t:127.05,m:5.6},{t:127.1,m:4.8},{t:127.15,m:4.2},{t:127.2,m:3.8},
    {t:127.3,m:3.5},{t:127.5,m:3.2},{t:128,m:3.8},{t:128.5,m:3.0},
    {t:129,m:3.4},{t:130,m:3.0}
  ];

  // Parametri ETAS (calibrati su Appennino centrale)
  const MU = 2.0;    // tasso background eventi/giorno M>=1.5
  const K = 0.02;
  const ALPHA = 1.2;
  const M0 = 1.5;
  const C = 0.01;
  const P = 1.1;

  function etasRate(t, events_before_t) {
    let rate = MU;
    events_before_t.forEach(ev => {
      if (ev.t < t) {
        const dt = t - ev.t + C;
        rate += K * Math.exp(ALPHA * (ev.m - M0)) / Math.pow(dt, P);
      }
    });
    return rate;
  }

  const MAX_T = 130; // giorni
  const MAINSHOCK_T = 127;

  let animT = 0;
  let playing = false;
  let speed = 5;
  let animId = null;
  let lastTs = 0;

  function tToX(t) { return 30 + (t / MAX_T) * (W - 45); }

  function draw(currentT) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Calcola tasso ETAS su griglia temporale
    const STEPS = 200;
    const rates = [];
    for (let i = 0; i <= STEPS; i++) {
      const t_ = (i / STEPS) * Math.min(currentT, MAX_T);
      const evBefore = SCIAME.filter(e => e.t <= t_);
      rates.push({ t: t_, r: Math.min(etasRate(t_, evBefore), 50) });
    }

    // maxRate fisso a 50 per evitare rescaling continuo (bug visivo "su e giù")
    const maxRate = 50;

    function rToY(r) { return H - 50 - (r / maxRate) * (H - 70); }

    // Griglia
    ctx.strokeStyle = 'rgba(245,237,224,0.05)';
    ctx.lineWidth = 1;
    [0,1,3,7,14,30,60,90,120].forEach(d => {
      if (d <= currentT) {
        const x = tToX(d);
        ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 48); ctx.stroke();
      }
    });

    // Linea background mu
    ctx.strokeStyle = 'rgba(58,126,196,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    ctx.moveTo(tToX(0), rToY(MU));
    ctx.lineTo(tToX(Math.min(currentT, MAX_T)), rToY(MU));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'rgba(58,126,196,0.7)';
    ctx.fillText('μ background', tToX(2), rToY(MU) - 4);

    // Asse Y
    ctx.strokeStyle = 'rgba(245,237,224,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 20); ctx.lineTo(30, H - 48); ctx.stroke();
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('λ(t)', 26, 28);

    // Asse X
    ctx.strokeStyle = 'rgba(245,237,224,0.2)';
    ctx.beginPath(); ctx.moveTo(30, H - 48); ctx.lineTo(W - 10, H - 48); ctx.stroke();
    ctx.textAlign = 'center';
    [1,30,60,90,120].forEach(d => {
      ctx.fillText('giu ' + d, tToX(d), H - 35);
    });
    ctx.fillText('giorni dal 1 dic 2008', W/2, H - 20);

    // Curva tasso ETAS
    if (rates.length > 1) {
      ctx.strokeStyle = '#C4612A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      rates.forEach((r, i) => {
        const x = tToX(r.t);
        const y = rToY(r.r);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Spike eventi
    SCIAME.forEach(ev => {
      if (ev.t > currentT) return;
      if (ev.m < 2.5 && ev.m !== 6.3) return; // solo eventi visibili
      const x = tToX(ev.t);
      const h = Math.min((ev.m - 1) * 15, H - 60);
      const isMain = ev.m === 6.3;
      ctx.strokeStyle = isMain ? '#FF2222' : 'rgba(196,97,42,0.8)';
      ctx.lineWidth = isMain ? 3 : 1.5;
      ctx.beginPath(); ctx.moveTo(x, H - 48); ctx.lineTo(x, H - 48 - h); ctx.stroke();
      if (ev.m >= 3.5) {
        ctx.font = (isMain ? 'bold ' : '') + '9px JetBrains Mono';
        ctx.fillStyle = isMain ? '#FF4444' : '#C4612A';
        ctx.textAlign = 'center';
        ctx.fillText('M' + ev.m.toFixed(1), x, H - 52 - h);
      }
    });

    // Marker mainshock
    if (currentT >= MAINSHOCK_T) {
      const mx = tToX(MAINSHOCK_T);
      ctx.strokeStyle = 'rgba(139,26,26,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(mx, 20); ctx.lineTo(mx, H - 48); ctx.stroke();
      ctx.fillStyle = '#FF3333';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('6 APR 2009', mx, 15);
    }

    // Titolo
    ctx.fillStyle = 'rgba(245,237,224,0.5)';
    ctx.textAlign = 'left';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('TASSO SISMICITÀ ETAS · SCIAME AQUILANO', 35, 12);
  }

  function updateDisplay(t) {
    const evBefore = SCIAME.filter(e => e.t <= t);
    const rate = etasRate(t, evBefore);
    const prob24h = 1 - Math.exp(-rate * (1/24));
    const probM6 = prob24h * 0.001; // scaling approssimato per M>=6

    const disp = document.getElementById('s6-etas-display');
    if (disp) {
      const dayLabel = t < 31 ? 'dic' : t < 62 ? 'gen' : t < 90 ? 'feb' : t < 120 ? 'mar' : 'apr';
      disp.innerHTML = 'Giorno ' + Math.floor(t) + ' (' + dayLabel + ' 2009)<br>' +
        'Tasso ETAS: ' + rate.toFixed(1) + ' eventi/giorno M≥1.5<br>' +
        'P(M≥6 nelle prossime 24h): ' + (t >= MAINSHOCK_T ? '--' : (probM6 * 100).toFixed(4) + '%');
    }
  }

  draw(0);
  updateDisplay(0);

  function loop(ts) {
    if (playing) {
      const dt = (ts - lastTs) / 1000 * speed;
      animT = Math.min(animT + dt, MAX_T);
      draw(animT);
      updateDisplay(animT);
      if (animT >= MAX_T) {
        playing = false;
        const btn = document.getElementById('s6-etas-play');
        if (btn) btn.textContent = '↺ RICOMINCIA';
      }
    }
    lastTs = ts;
    if (playing) animId = requestAnimationFrame(loop);
  }

  const btn = document.getElementById('s6-etas-play');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!playing && animT >= MAX_T) { animT = 0; draw(0); }
      playing = !playing;
      btn.textContent = playing ? '|| PAUSA' : '▶ PLAY';
      if (playing) { lastTs = performance.now(); animId = requestAnimationFrame(loop); }
    });
  }

  const speedSel = document.getElementById('s6-etas-speed');
  if (speedSel) speedSel.addEventListener('change', () => { speed = parseInt(speedSel.value); });

  return { stop: () => { cancelAnimationFrame(animId); } };
}

function s6InitNNCanvas() {
  const canvas = document.getElementById('s6-nn-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Architettura: 8 -> 6 -> 4 -> 1
  const layers = [
    { n: 8, labels: ['Sismicità 7gg','Sismicità 30gg','M max recente','Profondità media','GPS deform.','Tipo faglia','Distanza faglia','Strato geologico'], x: 60 },
    { n: 6, x: 180 },
    { n: 4, x: 300 },
    { n: 1, labels: ['P(M≥6\n50 anni)'], x: 390 }
  ];

  let activations = null;
  let animProgress = 0;
  let animId = null;
  let animRunning = false;

  function nodeY(layer_idx, node_idx) {
    const n = layers[layer_idx].n;
    const spacing = Math.min((H - 60) / (n + 1), 38);
    const totalH = spacing * (n - 1);
    const startY = (H - totalH) / 2;
    return startY + node_idx * spacing;
  }

  function drawNetwork(acts, progress) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Connessioni
    for (let li = 0; li < layers.length - 1; li++) {
      for (let ni = 0; ni < layers[li].n; ni++) {
        for (let nj = 0; nj < layers[li+1].n; nj++) {
          const x1 = layers[li].x + 14;
          const y1 = nodeY(li, ni);
          const x2 = layers[li+1].x - 14;
          const y2 = nodeY(li+1, nj);

          let alpha = 0.07;
          if (acts && progress > li / (layers.length - 1)) {
            alpha = 0.2 + (acts[li][ni] || 0) * 0.3;
          }
          ctx.strokeStyle = 'rgba(245,237,224,' + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }

    // Nodi
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const layerActivated = acts && progress > (li / (layers.length - 1));

      for (let ni = 0; ni < layer.n; ni++) {
        const x = layer.x;
        const y = nodeY(li, ni);
        const act = (acts && layerActivated) ? (acts[li][ni] || 0) : 0;

        // Colore nodo
        let nodeColor = '#1a1a1a';
        if (layerActivated) {
          if (act > 0.7) nodeColor = '#C4612A';
          else if (act > 0.4) nodeColor = '#8B5A2B';
          else if (act > 0.1) nodeColor = '#3A7EC4';
          else nodeColor = '#222';
        }

        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.strokeStyle = layerActivated ? 'rgba(196,97,42,0.6)' : 'rgba(245,237,224,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label input
        if (li === 0 && layer.labels) {
          ctx.font = '9px JetBrains Mono';
          ctx.fillStyle = layerActivated && act > 0.3 ? '#C4612A' : 'rgba(245,237,224,0.55)';
          ctx.textAlign = 'right';
          ctx.fillText(layer.labels[ni], x - 17, y + 4);
        }

        // Label output
        if (li === layers.length - 1 && acts && layerActivated) {
          ctx.font = 'bold 14px JetBrains Mono';
          ctx.fillStyle = '#C4612A';
          ctx.textAlign = 'left';
          ctx.fillText(acts.output || '?', x + 18, y + 5);
        } else if (li === layers.length - 1) {
          ctx.font = '9px JetBrains Mono';
          ctx.fillStyle = 'rgba(245,237,224,0.5)';
          ctx.textAlign = 'left';
          ctx.fillText('output', x + 18, y + 4);
        }
      }
    }

    // Label layer
    const layerLabels = ['INPUT', 'HIDDEN 1', 'HIDDEN 2', 'OUTPUT'];
    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = 'rgba(245,237,224,0.3)';
    ctx.textAlign = 'center';
    layers.forEach((l, i) => {
      ctx.fillText(layerLabels[i], l.x, H - 10);
    });
  }

  function runForward(inputValues, outputStr) {
    if (animRunning) return;
    animRunning = true;

    // Crea attivazioni fake proporzionali agli input
    const acts = [
      inputValues, // layer 0: input
      inputValues.slice(0,6).map(v => Math.min(v + (Math.random()-0.5)*0.2, 1)), // hidden 1
      inputValues.slice(0,4).map(v => Math.min(v + (Math.random()-0.5)*0.3, 1)), // hidden 2
      [parseFloat(outputStr) / 20] // output
    ];
    acts.output = outputStr;

    let startTs = null;
    const DURATION = 1800; // ms

    function step(ts) {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      animProgress = Math.min(elapsed / DURATION, 1);
      drawNetwork(acts, animProgress);
      if (animProgress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        animRunning = false;
        const res = document.getElementById('s6-nn-result');
        if (res) res.innerHTML = '';
      }
    }
    animId = requestAnimationFrame(step);
  }

  drawNetwork(null, 0);

  // L'Aquila 2009
  document.getElementById('s6-nn-aquila') && document.getElementById('s6-nn-aquila').addEventListener('click', () => {
    cancelAnimationFrame(animId);
    animRunning = false;
    animProgress = 0;
    const result = document.getElementById('s6-nn-result');
    if (result) result.innerHTML = 'Elaborazione in corso...';
    // Input: sismicita' alta, M max 4.0, GPS deformazione, faglia normale
    runForward([0.85, 0.70, 0.72, 0.45, 0.80, 0.65, 0.60, 0.55], '11.2%');
    setTimeout(() => {
      const r = document.getElementById('s6-nn-result');
      if (r) r.innerHTML = '<strong style="color:#C4612A">Output: P(M≥6.3 / 50 anni) = 11.2%</strong>';
    }, 1900);
  });

  // Emilia 2012
  document.getElementById('s6-nn-emilia') && document.getElementById('s6-nn-emilia').addEventListener('click', () => {
    cancelAnimationFrame(animId);
    animRunning = false;
    animProgress = 0;
    const result = document.getElementById('s6-nn-result');
    if (result) result.innerHTML = 'Elaborazione in corso...';
    // Input: sismicita' bassa, zona poco caratterizzata
    runForward([0.20, 0.15, 0.18, 0.40, 0.10, 0.30, 0.70, 0.25], '4.8%');
    setTimeout(() => {
      const r = document.getElementById('s6-nn-result');
      if (r) r.innerHTML = '<strong style="color:#3A7EC4">Output: P(M≥6 / 50 anni) = 4.8%</strong><br><span style="color:rgba(245,237,224,0.5)">â† Anche ML è stata sorpresa dall\'Emilia 2012</span>';
    }, 1900);
  });

  return { stop: () => cancelAnimationFrame(animId) };
}

// ===== DATI HARDCODED =====

var COMPARATORE_DATA = [
  {
    id: 'messina', event: 'Messina 1908', mag: 7.1,
    gr: 14.2, bpt: 11.8, etas: 3.1, ml: 17.5, psha: 'Alta',
    note: 'Stretto di Messina — zona nota ad altissima pericolosità',
    vittime: '75.000–200.000', zona: 'Sicilia/Calabria',
    detail: 'G-R/Poisson e ML riflettono la sismicità storica dello Stretto. BPT alto per il lungo tempo trascorso dall\'evento del 1783. ETAS basso: non c\'era uno sciame precursore documentato. PSHA Alta: la zona era già classificata pericolosissima. Il decision-maker del 1908 avrebbe dovuto costruire edifici antisismici — ma le norme antisismiche italiane arrivarono solo dopo questa catastrofe.',
    highlight: null
  },
  {
    id: 'avezzano', event: 'Avezzano 1915', mag: 6.7,
    gr: 11.4, bpt: 8.2, etas: 2.3, ml: 10.8, psha: 'Alta',
    note: 'Appennino centrale — zona nota',
    vittime: '~30.000', zona: 'Abruzzo',
    detail: 'Tutti i modelli mostrano un rischio medio-alto, consistente con la pericolosità dell\'Appennino centrale. BPT leggermente inferiore a G-R perché il tempo trascorso dall\'ultimo grande evento era relativamente breve. ETAS basso: nessuno sciame precursore. La catastrofe non fu causata da mancata previsione del rischio, ma dalla totale assenza di costruzioni antisismiche.',
    highlight: null
  },
  {
    id: 'friuli', event: 'Friuli 1976', mag: 6.4,
    gr: 9.8, bpt: 15.3, etas: 4.2, ml: 13.1, psha: 'Alta',
    note: 'BPT alto: 465 anni dall\'evento del 1511',
    vittime: '989', zona: 'Friuli-Venezia Giulia',
    detail: 'BPT è il modello che avrebbe dato il segnale più forte: erano passati 465 anni dall\'ultimo grande evento del 1511, portando la probabilità condizionale molto alta. G-R/ML mostrano rischio moderato-alto. Il Friuli post-1976 è diventato il modello di ricostruzione antisismica italiana. Il decision-maker avrebbe dovuto agire sul BPT, che segnalava chiaramente un ciclo sismico maturo.',
    highlight: 'bpt'
  },
  {
    id: 'irpinia', event: 'Irpinia 1980', mag: 6.9,
    gr: 13.6, bpt: 17.9, etas: 3.4, ml: 15.7, psha: 'Alta',
    note: 'BPT alto: 286 anni dall\'evento del 1694',
    vittime: '2.914', zona: 'Campania/Basilicata',
    detail: 'BPT al massimo: 286 anni dall\'evento del 1694 sulla Faglia di Irpinia, che ha un intervallo di ricorrenza di ~250-350 anni. G-R e ML anch\'essi alti. PSHA aveva classificato la zona come altissima pericolosità già negli anni \'70. La strage dell\'Irpinia è l\'esempio più chiaro di come il rischio fosse noto ma non comunicato in modo efficace alla governance territoriale.',
    highlight: 'bpt'
  },
  {
    id: 'umbria', event: 'Umbria-Marche 1997', mag: 5.7,
    gr: 24.1, bpt: 9.7, etas: 8.3, ml: 19.4, psha: 'Media-Alta',
    note: 'Soglia M5.7 più bassa → G-R molto più alto',
    vittime: '11', zona: 'Umbria/Marche',
    detail: 'G-R è molto alto (24%) perché la soglia M5.7 è molto più frequente nella legge G-R. BPT basso per la faglia specifica dell\'Appennino umbro-marchigiano. ETAS in crescita durante la lunga sequenza del 1997. Il basso numero di vittime (rispetto all\'entità del sisma) fu dovuto in parte all\'ora (mattina) e alla evacuazione parziale durante la sequenza. PSHA Media-Alta.',
    highlight: 'gr'
  },
  {
    id: 'molise', event: 'Molise 2002', mag: 5.7,
    gr: 17.6, bpt: 5.1, etas: 2.1, ml: 9.8, psha: 'Media',
    note: 'BPT basso: faglia poco caratterizzata',
    vittime: '29 (scuola S. Giuliano)', zona: 'Molise',
    detail: 'G-R moderato-alto per M5.7. BPT molto basso: la faglia molisana era poco caratterizzata e il tempo dall\'ultimo evento era incerto. ETAS basso: nessuno sciame precursore significativo. PSHA Media: la zona non era nelle aree di massima pericolosità. La tragedia della scuola elementare di San Giuliano di Puglia fu causata da un edificio non adeguato sismicamente in una zona che il legislatore aveva classificato a bassa sismicità.',
    highlight: null
  },
  {
    id: 'aquila', event: "L'Aquila 2009", mag: 6.3,
    gr: 7.7, bpt: 7.2, etas: 15.4, ml: 11.2, psha: 'Alta',
    note: "ETAS molto alto grazie allo sciame sismico di 4 mesi!",
    vittime: '309', zona: 'Abruzzo',
    detail: 'ETAS è il modello che avrebbe dato il segnale più forte: la sequenza di microscosse dic 2008–apr 2009 aveva portato il tasso ETAS a valori 5-8 volte superiori al background. G-R e BPT mostravano rischio moderato. PSHA classificava L\'Aquila come zona ad altissima pericolosità (PGA 0.275g/10%/50anni) dal 2004. Il decision-maker aveva a disposizione tutte le informazioni necessarie: PSHA storica, sciame attivo, modelli ETAS operativi. La tragedia fu di comunicazione, non di conoscenza.',
    highlight: 'etas',
    isAquila: true
  },
  {
    id: 'emilia', event: 'Emilia 2012', mag: 6.1,
    gr: 5.8, bpt: 3.2, etas: 2.0, ml: 4.8, psha: 'Media-Bassa',
    note: 'Tutti i modelli bassi — la "sorpresa" sismica italiana',
    vittime: '27', zona: 'Pianura Padana',
    detail: 'Tutti i modelli avevano valori bassi. La pianura Padana era classificata come zona di media-bassa pericolosità: storia sismica relativamente breve (pochi secoli di documenti), faglie sepolte sotto i sedimenti padani difficili da caratterizzare. Nessuno sciame precursore significativo. L\'Emilia 2012 è la dimostrazione dei limiti di tutti i modelli quando la sismicità storica è scarsa. È anche la prova che "bassa probabilità" non significa "nessun rischio".',
    highlight: null,
    isEmilia: true
  },
  {
    id: 'amatrice', event: 'Amatrice 2016', mag: 6.2,
    gr: 8.9, bpt: 12.3, etas: 5.1, ml: 13.8, psha: 'Alta',
    note: 'BPT alto: 377 anni dall\'evento del 1639',
    vittime: '299', zona: 'Lazio/Marche/Umbria',
    detail: 'BPT alto: la faglia del Monte Vettore non aveva avuto un grande evento dal 1639 (377 anni). G-R e ML mostravano rischio moderato-alto. PSHA classificava la zona come altissima pericolosità. Il sisma colpì alle 3:36 di notte. Amatrice era parzialmente ricostruita dopo i terremoti precedenti, ma non secondo criteri antisismici moderni. Il decision-maker disponeva di PSHA Alta e BPT elevato per quella faglia specifica.',
    highlight: 'bpt'
  },
  {
    id: 'norcia', event: 'Norcia 2016', mag: 6.5,
    gr: 9.2, bpt: 11.8, etas: 42.1, ml: 14.2, psha: 'Alta',
    note: 'ETAS altissimo: era in corso la sequenza di Amatrice',
    vittime: '0 (città evacuata)', zona: 'Umbria',
    detail: 'ETAS completamente fuori scala: il terremoto di Norcia (30 ottobre) avvenne 65 giorni dopo il mainshock di Amatrice (24 agosto) e 4 giorni dopo un M5.9. Lo sciame era attivo e il tasso ETAS era elevatissimo. Norcia è l\'esempio di successo: la città era stata evacuata preventivamente, gli edifici antisismici resistettero, le vittime furono zero. BPT e G-R mostravano rischio alto già prima della sequenza. Una storia che finisce bene — grazie a infrastrutture e sistemi di allerta.',
    highlight: 'etas'
  }
];

var TIMELINE_NODES = [
  {
    date: 'Dicembre 2008',
    text: 'Inizia lo sciame sismico aquilano. Centinaia di piccole scosse nel mese.',
    color: 'var(--ochre)', size: 'normal'
  },
  {
    date: '27 Marzo 2009',
    text: 'Giampaolo Giuliani deposita una "previsione" basata su emissioni di radon. Viene denunciato per procurato allarme.',
    color: 'rgba(245,237,224,0.5)', size: 'normal'
  },
  {
    date: '30 Marzo 2009',
    text: 'Scossa M 4.0. Molti aquilani escono di casa e dormono in automobile. La città è in panico.',
    color: 'var(--ochre)', size: 'normal'
  },
  {
    date: '31 Marzo 2009',
    text: 'Riunione Commissione Grandi Rischi — 1 ora. Dichiarazione pubblica: "Situazione normale, nessun pericolo imminente". Intervista TV di un funzionario DPC: "Bevetevi un bicchiere di vino rosso."',
    color: 'var(--blood)', size: 'large', isKey: true
  },
  {
    date: '1–5 Aprile 2009',
    text: 'Lo sciame continua. Scosse M 2–3 ogni giorno. La popolazione, rassicurata, rientra nelle case.',
    color: 'rgba(245,237,224,0.5)', size: 'normal'
  },
  {
    date: '6 Aprile 2009 · ore 03:32',
    text: 'MAINSHOCK — M 6.3. 309 morti. Quasi tutti nel sonno, nelle case in muratura del centro storico. 67.000 sfollati.',
    color: 'var(--blood)', size: 'xlarge', isMain: true
  },
  {
    date: '2012',
    text: 'Processo: 7 membri della Commissione Grandi Rischi condannati a 6 anni per omicidio colposo. Accusa: aver dato "rassicurazioni approssimative, generiche e inefficaci" che avevano convinto la gente a restare in casa.',
    color: 'rgba(245,237,224,0.5)', size: 'normal'
  },
  {
    date: '2015',
    text: 'Corte d\'Appello: assoluzione definitiva. "I rischi non erano prevedibili con certezza sufficiente. La scienza non può essere imputata per ciò che non può prevedere con precisione. Ma deve essere più onesta su ciò che non sa."',
    color: 'var(--blue)', size: 'normal', isResolution: true
  }
];

// ===== FUNZIONI =====

function s6GetSciameCSV() {
  // Dati approssimati sciame aquilano, bollettino INGV 2009
  var header = 'EventID,Data,Lat,Lon,Profondita_km,Magnitudo\n';
  var rows = [
    'AQ001,2008-12-01,42.35,13.40,10.2,1.5','AQ002,2008-12-03,42.38,13.41,9.8,1.6',
    'AQ003,2008-12-05,42.34,13.39,11.0,2.0','AQ004,2008-12-08,42.36,13.42,10.5,1.7',
    'AQ005,2008-12-12,42.35,13.40,9.5,2.1','AQ006,2008-12-15,42.37,13.41,10.8,1.8',
    'AQ007,2008-12-19,42.34,13.38,11.2,2.2','AQ008,2008-12-23,42.36,13.40,10.0,1.9',
    'AQ009,2008-12-27,42.35,13.41,9.8,2.3','AQ010,2008-12-30,42.37,13.39,10.5,1.7',
    'AQ011,2009-01-02,42.34,13.40,11.0,1.8','AQ012,2009-01-05,42.36,13.42,10.2,2.0',
    'AQ013,2009-01-08,42.35,13.39,9.8,2.4','AQ014,2009-01-12,42.37,13.41,10.5,1.9',
    'AQ015,2009-01-16,42.34,13.40,11.2,2.0','AQ016,2009-01-20,42.35,13.38,9.5,1.8',
    'AQ017,2009-01-24,42.36,13.41,10.8,2.1','AQ018,2009-01-27,42.35,13.40,10.0,2.5',
    'AQ019,2009-01-29,42.34,13.39,9.8,2.0','AQ020,2009-01-30,42.34,13.39,9.5,3.9',
    'AQ021,2009-01-30,42.35,13.40,9.2,2.8','AQ022,2009-01-30,42.35,13.39,9.8,2.2',
    'AQ023,2009-01-31,42.36,13.40,10.2,2.5','AQ024,2009-02-01,42.34,13.41,10.5,2.0',
    'AQ025,2009-02-03,42.35,13.40,9.8,2.3','AQ026,2009-02-06,42.36,13.38,11.0,1.9',
    'AQ027,2009-02-10,42.35,13.41,10.2,2.1','AQ028,2009-02-14,42.34,13.39,9.5,1.8',
    'AQ029,2009-02-18,42.36,13.40,10.8,2.0','AQ030,2009-02-22,42.35,13.41,11.0,2.2',
    'AQ031,2009-02-26,42.34,13.39,9.8,2.4','AQ032,2009-03-02,42.35,13.40,10.2,2.1',
    'AQ033,2009-03-06,42.36,13.38,9.5,2.3','AQ034,2009-03-10,42.35,13.41,11.2,2.0',
    'AQ035,2009-03-14,42.34,13.40,10.5,2.2','AQ036,2009-03-18,42.35,13.39,9.8,1.9',
    'AQ037,2009-03-22,42.36,13.41,10.2,2.1','AQ038,2009-03-26,42.35,13.40,11.0,2.3',
    'AQ039,2009-03-29,42.34,13.38,9.5,2.0','AQ040,2009-03-30,42.34,13.39,8.5,4.0',
    'AQ041,2009-03-30,42.35,13.40,9.0,3.1','AQ042,2009-03-30,42.35,13.39,9.5,2.6',
    'AQ043,2009-03-31,42.34,13.40,9.8,2.3','AQ044,2009-03-31,42.36,13.41,10.2,2.8',
    'AQ045,2009-04-01,42.35,13.39,9.5,2.4','AQ046,2009-04-01,42.35,13.40,10.0,2.7',
    'AQ047,2009-04-02,42.34,13.41,9.8,2.2','AQ048,2009-04-02,42.36,13.38,10.5,3.0',
    'AQ049,2009-04-03,42.35,13.40,9.2,2.5','AQ050,2009-04-03,42.34,13.39,9.8,2.1',
    'AQ051,2009-04-04,42.35,13.41,10.2,2.4','AQ052,2009-04-04,42.36,13.40,9.5,2.0',
    'AQ053,2009-04-05,42.35,13.39,9.8,2.3','AQ054,2009-04-05,42.34,13.40,10.5,3.1',
    'AQ055,2009-04-05,42.35,13.41,9.0,2.8','AQ056,2009-04-05,42.36,13.39,9.5,2.3',
    'AQ057,2009-04-06,42.34,13.39,8.8,6.3','AQ058,2009-04-06,42.38,13.40,9.0,5.6',
    'AQ059,2009-04-06,42.36,13.41,9.5,4.8','AQ060,2009-04-06,42.35,13.38,10.0,4.2',
    'AQ061,2009-04-06,42.34,13.40,9.8,3.8','AQ062,2009-04-06,42.36,13.39,10.2,3.5',
    'AQ063,2009-04-07,42.35,13.41,9.0,3.8','AQ064,2009-04-07,42.34,13.40,9.5,3.2',
    'AQ065,2009-04-07,42.35,13.39,10.0,3.0','AQ066,2009-04-07,42.36,13.38,9.8,3.4',
    'AQ067,2009-04-08,42.35,13.40,9.2,2.8','AQ068,2009-04-08,42.34,13.41,9.8,2.5',
    'AQ069,2009-04-09,42.35,13.39,10.2,2.6','AQ070,2009-04-09,42.36,13.40,9.5,2.9',
    'AQ071,2009-04-10,42.34,13.38,9.8,2.4','AQ072,2009-04-10,42.35,13.41,10.5,2.2',
    'AQ073,2009-04-11,42.36,13.40,9.2,2.8','AQ074,2009-04-12,42.35,13.39,9.8,2.3',
    'AQ075,2009-04-13,42.34,13.40,10.2,2.5','AQ076,2009-04-14,42.35,13.41,9.5,2.1',
    'AQ077,2009-04-15,42.36,13.38,9.8,2.4','AQ078,2009-04-16,42.35,13.40,10.5,2.0',
    'AQ079,2009-04-18,42.34,13.39,9.2,2.3','AQ080,2009-04-20,42.35,13.41,9.8,2.1'
  ];
  return header + rows.join('\n');
}

function s6InitComparatore() {
  var heatmap = document.getElementById('s6-comp-heatmap');
  if (!heatmap) return;

  var selectedId = null;
  var detail = document.getElementById('s6-comp-detail');
  var MAX_PROB = 45;

  function probColor(v) {
    if (v >= 20) return '#FF6B35';
    if (v >= 10) return '#C4612A';
    if (v >= 5) return '#D4893A';
    return 'rgba(196,97,42,0.32)';
  }
  function pshaBg(v) {
    if (v === 'Alta') return { bg:'rgba(196,97,42,0.22)', txt:'#C4612A' };
    if (v === 'Media-Alta') return { bg:'rgba(212,137,58,0.18)', txt:'#D4893A' };
    if (v === 'Media') return { bg:'rgba(139,139,90,0.18)', txt:'#8B8B5A' };
    return { bg:'rgba(245,237,224,0.04)', txt:'rgba(245,237,224,0.35)' };
  }

  var MODELS = ['G‑R / POISSON', 'BPT', 'ETAS', 'ML', 'PSHA'];
  var COLS   = ['gr', 'bpt', 'etas', 'ml', 'psha'];
  var GRID   = 'display:grid;grid-template-columns:190px repeat(5,1fr);gap:2px;';

  // Intestazione colonne
  var hdr = document.createElement('div');
  hdr.style.cssText = GRID + 'margin-bottom:2px';
  hdr.innerHTML = '<div style="padding:6px 8px;font-family:\'JetBrains Mono\',monospace;font-size:9px;color:rgba(245,237,224,0.25);letter-spacing:1px">EVENTO</div>' +
    MODELS.map(function(m) {
      return '<div style="padding:6px 8px;text-align:center;background:rgba(196,97,42,0.08);font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--ochre);letter-spacing:1px;text-transform:uppercase">' + m + '</div>';
    }).join('');
  heatmap.appendChild(hdr);

  // Righe eventi
  COMPARATORE_DATA.forEach(function(d) {
    var row = document.createElement('div');
    var outline = d.isAquila ? '1.5px solid rgba(139,26,26,0.7)' : d.isEmilia ? '1.5px solid rgba(58,126,196,0.5)' : 'none';
    row.style.cssText = GRID + 'cursor:pointer;transition:filter 0.18s;outline:' + outline + ';outline-offset:-1px;margin-bottom:2px';

    // Cella nome evento
    var nameCell = document.createElement('div');
    nameCell.style.cssText = 'padding:7px 8px;background:rgba(245,237,224,0.025);display:flex;flex-direction:column;justify-content:center';
    nameCell.innerHTML =
      '<span style="font-family:\'Cormorant Garamond\',serif;font-size:13px;color:var(--cream);line-height:1.2">' + d.event + '</span>' +
      '<span style="font-family:\'JetBrains Mono\',monospace;font-size:8px;color:rgba(245,237,224,0.3);margin-top:2px">M' + d.mag.toFixed(1) + '</span>';
    row.appendChild(nameCell);

    // 4 celle probabilità con barra visuale
    ['gr','bpt','etas','ml'].forEach(function(col) {
      var val = d[col];
      var pct = Math.min(val / MAX_PROB * 100, 100);
      var isHl = d.highlight === col;
      var cell = document.createElement('div');
      cell.style.cssText = 'padding:5px 7px;background:rgba(8,8,8,0.55);display:flex;flex-direction:column;justify-content:center;gap:3px';
      cell.innerHTML =
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:' + probColor(val) + ';text-align:right;' + (isHl ? 'font-weight:bold' : '') + '">' + val + '%</div>' +
        '<div style="height:3px;background:rgba(245,237,224,0.06);border-radius:2px">' +
          '<div style="height:100%;width:' + pct + '%;background:' + probColor(val) + ';border-radius:2px;' + (isHl ? 'box-shadow:0 0 5px ' + probColor(val) : '') + ';transition:width 0.4s ease"></div>' +
        '</div>';
      row.appendChild(cell);
    });

    // Cella PSHA (categorica)
    var pc = pshaBg(d.psha);
    var pshaCell = document.createElement('div');
    pshaCell.style.cssText = 'padding:5px 7px;background:rgba(8,8,8,0.55);display:flex;align-items:center;justify-content:center';
    pshaCell.innerHTML = '<span style="font-family:\'JetBrains Mono\',monospace;font-size:8.5px;padding:3px 6px;background:' + pc.bg + ';color:' + pc.txt + ';text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">' + d.psha + '</span>';
    row.appendChild(pshaCell);

    // Hover + click
    row.addEventListener('mouseenter', function() { this.style.filter = 'brightness(1.18)'; });
    row.addEventListener('mouseleave', function() { this.style.filter = ''; });
    row.addEventListener('click', function() {
      if (!detail) return;
      if (selectedId === d.id) {
        detail.style.display = 'none';
        selectedId = null;
        // Rimuovi evidenziazione
        row.style.outline = outline;
        return;
      }
      // Rimuovi evidenziazione precedente da tutte le righe
      heatmap.querySelectorAll('[data-selected]').forEach(function(r) {
        r.removeAttribute('data-selected');
        var prevOutline = r.getAttribute('data-outline') || 'none';
        r.style.outline = prevOutline;
      });
      row.setAttribute('data-selected', '1');
      row.setAttribute('data-outline', outline);
      row.style.outline = '1.5px solid var(--terracotta)';
      selectedId = d.id;
      detail.style.display = 'block';
      detail.innerHTML =
        '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
          '<div style="min-width:160px;flex:0 0 auto">' +
            '<p style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--terracotta);letter-spacing:1px;margin:0 0 4px">' + d.event.toUpperCase() + '</p>' +
            '<p style="font-size:11px;color:rgba(245,237,224,0.5);margin:0">Zona: ' + d.zona + '</p>' +
            '<p style="font-size:11px;color:rgba(245,237,224,0.5);margin:3px 0 0">Vittime: ' + d.vittime + '</p>' +
            '<p style="font-size:11px;color:rgba(245,237,224,0.4);margin:5px 0 0;font-style:italic">' + d.note + '</p>' +
          '</div>' +
          '<div style="flex:1;min-width:260px">' +
            '<p style="font-size:13px;line-height:1.8;color:rgba(245,237,224,0.85);margin:0">' + d.detail + '</p>' +
          '</div>' +
        '</div>';
    });

    heatmap.appendChild(row);
  });
}

function s6InitTimeline() {
  var container = document.getElementById('s6-timeline');
  if (!container) return;

  TIMELINE_NODES.forEach(function(node, i) {
    var div = document.createElement('div');
    div.style.cssText = 'position:relative;margin-bottom:' + (node.size==='xlarge'?18:11) + 'px;opacity:0;transform:translateX(-10px);transition:opacity 0.5s,transform 0.5s;transition-delay:' + (i*80) + 'ms';

    // Dot
    var dot = document.createElement('div');
    var dotSize = node.size==='xlarge' ? 18 : node.size==='large' ? 14 : 10;
    dot.style.cssText = 'position:absolute;left:-' + (40 - 12 - dotSize/2) + 'px;top:4px;width:' + dotSize + 'px;height:' + dotSize + 'px;border-radius:50%;background:' + node.color + ';border:2px solid rgba(8,8,8,0.8)';
    if (node.isMain) dot.style.boxShadow = '0 0 12px rgba(139,26,26,0.8)';

    // Contenuto
    var content = document.createElement('div');
    var border = node.isMain ? 'border-left:3px solid var(--blood);background:rgba(139,26,26,0.08)' :
                 node.isKey ? 'border-left:3px solid var(--blood);background:rgba(139,26,26,0.05)' :
                 node.isResolution ? 'border-left:3px solid var(--blue);background:rgba(58,126,196,0.05)' : '';
    content.style.cssText = 'padding:' + (node.size==='xlarge'?'11px 14px':'8px 12px') + ';' + border;

    var dateEl = document.createElement('p');
    dateEl.style.cssText = 'font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:1px;color:' + node.color + ';margin:0 0 4px;text-transform:uppercase';
    dateEl.textContent = node.date;

    var textEl = document.createElement('p');
    textEl.style.cssText = 'font-size:' + (node.size==='xlarge'?'17px':node.size==='large'?'15px':'14px') + ';line-height:1.7;color:rgba(245,237,224,' + (node.isMain||node.isKey?'0.95':'0.8') + ');margin:0';
    textEl.textContent = node.text;

    content.appendChild(dateEl);
    content.appendChild(textEl);
    div.appendChild(dot);
    div.appendChild(content);
    container.appendChild(div);

    // Animazione entrata
    setTimeout(function() {
      div.style.opacity = '1';
      div.style.transform = 'translateX(0)';
    }, 100 + i * 80);
  });

  // Scroll indicator — mostra/nascondi in base allo scroll
  var tl   = document.getElementById('s6-timeline');
  var btn  = document.getElementById('s6-tl-scroll-btn');
  var fade = document.getElementById('s6-tl-fade');
  if (tl && btn) {
    function updateScrollHint() {
      var atBottom = tl.scrollHeight - tl.scrollTop <= tl.clientHeight + 8;
      btn.style.opacity  = atBottom ? '0' : '1';
      btn.style.pointerEvents = atBottom ? 'none' : 'auto';
      if (fade) fade.style.opacity = atBottom ? '0' : '1';
    }
    tl.addEventListener('scroll', updateScrollHint);
    // Controlla dopo che i nodi vengono animati
    setTimeout(updateScrollHint, 800);
  }
}

function s6InitEngineering() {
  // Tab switching
  var tabs = document.querySelectorAll('.s6-eng-tab');
  var contents = document.querySelectorAll('.s6-eng-content');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var idx = parseInt(this.dataset.tab);
      tabs.forEach(function(t) {
        t.style.borderBottomColor = 'transparent';
        t.style.color = 'rgba(245,237,224,0.5)';
        t.classList.remove('s6-eng-tab-active');
      });
      this.style.borderBottomColor = 'var(--terracotta)';
      this.style.color = 'var(--cream)';
      this.classList.add('s6-eng-tab-active');

      contents.forEach(function(c, i) {
        c.style.display = i === idx ? 'flex' : 'none';
      });
    });
  });

  // Slider isolamento
  var isoSlider = document.getElementById('s6-iso-slider');
  var magLabel = document.getElementById('s6-eng-mag');
  var isoResult = document.getElementById('s6-iso-result');

  function updateIso() {
    var val = parseInt(isoSlider.value);
    var mag = (val / 10).toFixed(1);
    if (magLabel) magLabel.textContent = mag;

    var noIso, withIso, color;
    if (val < 50) {
      noIso = 'Danni lievi'; withIso = 'Nessun danno'; color = '#32CD32';
    } else if (val < 55) {
      noIso = 'Danni moderati, alcune crepe'; withIso = 'Danni minimi'; color = '#90EE90';
    } else if (val < 60) {
      noIso = 'Danni gravi, crepe strutturali'; withIso = 'Danni lievi'; color = '#FFD700';
    } else if (val < 65) {
      noIso = 'Crollo parziale'; withIso = 'Danni moderati'; color = '#FFA500';
    } else {
      noIso = 'Crollo totale'; withIso = 'Struttura integra'; color = '#C4612A';
    }

    if (isoResult) {
      isoResult.innerHTML =
        'Senza isolatori: <span style="color:rgba(255,100,50,0.9)">' + noIso + '</span><br>' +
        'Con isolatori: <span style="color:' + color + '">' + withIso + '</span>';
    }
    updateIsoSvg(val);
  }

  function updateIsoSvg(val) {
    var svg = document.getElementById('s6-iso-svg');
    if (!svg) return;
    var shake = Math.max(0, (val - 40) / 30 * 12);
    var crack = val > 54;
    var collapse = val > 64;

    svg.innerHTML = '<defs><marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#C4612A"/></marker></defs>' +
      // Suolo
      '<rect x="0" y="240" width="300" height="40" fill="rgba(100,80,60,0.3)" stroke="rgba(196,97,42,0.3)" stroke-width="1"/>' +
      '<text x="20" y="258" fill="rgba(245,237,224,0.3)" font-size="9" font-family="JetBrains Mono">terreno</text>' +
      // Freccia scossa
      '<line x1="20" y1="260" x2="60" y2="260" stroke="#C4612A" stroke-width="2" marker-end="url(#arrow2)"/>' +
      '<text x="18" y="275" fill="rgba(196,97,42,0.7)" font-size="9" font-family="JetBrains Mono">M' + (val/10).toFixed(1) + ' scossa</text>' +

      // SENZA isolatori (sinistra) — si sposta con la scossa
      '<g transform="translate(' + shake + ',0)">' +
      '<text x="10" y="20" fill="rgba(245,237,224,0.4)" font-size="9" font-family="JetBrains Mono">SENZA</text>' +
      '<rect x="10" y="80" width="110" height="150" fill="rgba(245,237,224,0.06)" stroke="rgba(245,237,224,0.3)" stroke-width="2"/>' +
      '<rect x="10" y="25" width="110" height="55" fill="rgba(245,237,224,0.04)" stroke="rgba(245,237,224,0.3)" stroke-width="1.5"/>' +
      (crack ? '<line x1="30" y1="150" x2="110" y2="170" stroke="rgba(196,97,42,0.9)" stroke-width="2"/><line x1="40" y1="170" x2="100" y2="150" stroke="rgba(196,97,42,0.9)" stroke-width="1.5"/>' : '') +
      (collapse ? '<line x1="10" y1="80" x2="30" y2="230" stroke="rgba(196,97,42,0.8)" stroke-width="3"/><line x1="120" y1="80" x2="100" y2="230" stroke="rgba(196,97,42,0.8)" stroke-width="3"/><text x="20" y="245" fill="rgba(196,97,42,0.9)" font-size="9" font-family="JetBrains Mono">CROLLO</text>' : '') +
      '</g>' +

      // CON isolatori (destra) — quasi fermo
      '<g transform="translate(' + Math.min(shake*0.1, 1) + ',0)">' +
      '<text x="165" y="20" fill="rgba(245,237,224,0.4)" font-size="9" font-family="JetBrains Mono">CON ISOLATORI</text>' +
      '<rect x="165" y="80" width="110" height="150" fill="rgba(58,126,196,0.06)" stroke="rgba(245,237,224,0.3)" stroke-width="2"/>' +
      '<rect x="165" y="25" width="110" height="55" fill="rgba(58,126,196,0.04)" stroke="rgba(245,237,224,0.3)" stroke-width="1.5"/>' +
      // Isolatori alla base
      '<rect x="165" y="228" width="110" height="12" rx="3" fill="rgba(58,126,196,0.3)" stroke="var(--blue)" stroke-width="1.5"/>' +
      '<text x="195" y="238" fill="var(--blue)" font-size="8" font-family="JetBrains Mono">isolatori</text>' +
      '<text x="172" y="275" fill="rgba(50,200,80,0.7)" font-size="9" font-family="JetBrains Mono">struttura integra</text>' +
      '</g>';
  }

  if (isoSlider) {
    isoSlider.addEventListener('input', updateIso);
    updateIso();
  }
}

function s6InitOpenQuake() {
  // Download HTML
  var dlHtml = document.getElementById('s6-dl-html');
  if (dlHtml) {
    dlHtml.addEventListener('click', function() {
      try {
        var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        var blob = new Blob([html], {type: 'text/html;charset=utf-8'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'terremoti-laquila-2009.html';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
      } catch(e) { console.warn('Download HTML fallito:', e); }
    });
  }

  // Download CSV
  var dlCsv = document.getElementById('s6-dl-csv');
  if (dlCsv) {
    dlCsv.addEventListener('click', function() {
      try {
        var csv = s6GetSciameCSV();
        var blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'sciame-aquilano-2008-2009.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
      } catch(e) { console.warn('Download CSV fallito:', e); }
    });
  }
}

  // Avvia il carosello quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', s6InitCarousel);
  } else {
    s6InitCarousel();
  }

  return {};
})();