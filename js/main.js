// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CURSOR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function animCursor() {
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SLIDE TRACKING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const slides      = document.querySelectorAll('.slide');
const dots        = document.querySelectorAll('.dot');
const progressBar = document.getElementById('progress-bar');
const counter     = document.getElementById('slide-counter');
const scrollHint  = document.getElementById('scroll-hint');

let currentIdx  = 0;
let scrolledOnce = false;
const triggered = new Set();

const SCIENCE_IDX = 2; // indice di #s-section1 nell'array verticale
const WAVES_IDX   = 4; // indice di #s-section3 (onde sismiche)

const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            const i = [...slides].indexOf(e.target);
            if (i !== currentIdx) {
                currentIdx = i;
                updateUI(i);
                if (i > 0 && !scrolledOnce) { scrolledOnce = true; scrollHint.classList.add('hidden'); }
                onSlideEnter(i, e.target);
            }
        }
    });
}, { threshold: 0.5 });
slides.forEach(s => observer.observe(s));

/* ── Ripristino slide dopo reload (tasto R) ── */
(function() {
    const saved = sessionStorage.getItem('slideIdx');
    if (saved !== null) {
        sessionStorage.removeItem('slideIdx');
        const idx = parseInt(saved, 10);
        if (idx > 0 && idx < slides.length) {
            slides[idx].scrollIntoView({ behavior: 'instant' });
        }
    }
})();

function updateUI(i) {
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
    progressBar.style.height = (i / (slides.length - 1) * 100) + '%';
    counter.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
}

dots.forEach(d => d.addEventListener('click', () =>
    slides[+d.dataset.i].scrollIntoView({ behavior: 'smooth' })));

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FULLSCREEN + KEYBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
document.getElementById('fullscreen-btn').addEventListener('click', toggleFS);
document.getElementById('btn-enter').addEventListener('click', () =>
    slides[1].scrollIntoView({ behavior: 'smooth' }));

function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

document.addEventListener('keydown', e => {
    // Navigazione verticale (frecce su/giù — le sx/dx sono gestite dall'IIFE sezione1)
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        slides[Math.min(currentIdx + 1, slides.length - 1)].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        slides[Math.max(currentIdx - 1, 0)].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'f' || e.key === 'F') toggleFS();
    else if (e.key === 'r' || e.key === 'R') { sessionStorage.setItem('slideIdx', currentIdx); location.reload(); }
    else if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SEZIONE 1 — Carousel + INGV + Canvas
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(function() {
  'use strict';

  /* ── Costanti ── */
  const TOTAL_SLIDES = 7;
  const triggered = new Set();
  let currentIdx = 0;
  let isAnimating = false;
  let fetchDone   = false;

  /* ── Elementi DOM ── */
  const section  = document.getElementById('s-section1');
  const track    = document.getElementById('s1-track');
  const dots     = document.querySelectorAll('.s1-dot');
  const prevBtn  = document.getElementById('s1-prev');
  const nextBtn  = document.getElementById('s1-next');
  const counter  = document.getElementById('s1-counter');

  /* ── Navigazione ── */
  function goToSlide(idx, animate) {
    if (idx < 0 || idx >= TOTAL_SLIDES) return;
    isAnimating = true;
    if (animate === false) {
      track.style.transition = 'none';
      track.style.transform = `translateX(calc(${idx} * -100vw))`;
      requestAnimationFrame(() => { track.style.transition = ''; isAnimating = false; });
    } else {
      track.style.transform = `translateX(calc(${idx} * -100vw))`;
      track.addEventListener('transitionend', () => { isAnimating = false; }, { once: true });
      setTimeout(() => { isAnimating = false; }, 700); // safety fallback
    }
    currentIdx = idx;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (counter) counter.textContent = String(idx + 1).padStart(2,'0') + ' · ' + String(TOTAL_SLIDES).padStart(2,'0');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === TOTAL_SLIDES - 1;
    onSlideEnter(idx);
  }

  function onSlideEnter(idx) {
    if (triggered.has(idx)) return;
    triggered.add(idx);
    if (idx === 0) { fetchINGV(); initMap(); }
    if (idx === 1) { initBranchAnim(); }
    if (idx === 2) { startFaultAnim(); }
    if (idx === 3) { initSliders(); }
    if (idx === 5) { initPaganicanCanvas(); }
  }

  /* ── Wheel ── */
  function onWheel(e) {
    const goingDown = e.deltaY > 0;
    const goingUp   = e.deltaY < 0;
    if (goingDown && currentIdx === TOTAL_SLIDES - 1) return;
    if (goingUp   && currentIdx === 0)                return;
    e.preventDefault(); e.stopPropagation();
    if (isAnimating) return;
    goingDown ? goToSlide(currentIdx + 1) : goToSlide(currentIdx - 1);
  }
  section.addEventListener('wheel', onWheel, { passive: false });

  /* ── Touch ── */
  let touchX = 0;
  section.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', e => {
    if (isAnimating) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx < -50) goToSlide(currentIdx + 1);
    else if (dx > 50) goToSlide(currentIdx - 1);
  });

  /* ── Frecce + Dots ── */
  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIdx + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goToSlide(i)));

  /* ── Tastiera ── */
  document.addEventListener('keydown', e => {
    const rect = section.getBoundingClientRect();
    if (Math.abs(rect.top) > 50) return;
    if (e.key === 'ArrowRight' && currentIdx < TOTAL_SLIDES - 1) { e.preventDefault(); goToSlide(currentIdx + 1); }
    else if (e.key === 'ArrowLeft' && currentIdx > 0) { e.preventDefault(); goToSlide(currentIdx - 1); }
  });

  /* â•â•â• API INGV â•â•â• */
  /* ── INGV Canvas Map — Slide 1 ── */
  const _PROJ = { lnMin:6.6, lnMax:18.5, ltMin:35.5, ltMax:47.1 };
  let _regionsGJ = null;

  function _projPt(lon, lat, W, H) {
    return [
      (lon - _PROJ.lnMin) / (_PROJ.lnMax - _PROJ.lnMin) * W,
      (_PROJ.ltMax - lat) / (_PROJ.ltMax - _PROJ.ltMin) * H
    ];
  }

  function _drawRegions(ctx, gj, W, H) {
    const FILL = {
      1:'rgba(139,26,26,0.40)', 2:'rgba(196,97,42,0.30)',
      3:'rgba(212,137,58,0.20)', 4:'rgba(88,160,88,0.14)'
    };
    const ZONES = {
      'calabria':1,'campania':1,'basilicata':1,'sicilia':1,'abruzzo':1,
      'molise':2,'friuli venezia giulia':2,'marche':2,'umbria':2,'lazio':2,
      'liguria':3,'toscana':3,'emilia-romagna':3,'veneto':3,'piemonte':3,
      'lombardia':3,'trentino-alto adige/sudtirol':3,'puglia':3,
      "valle d'aosta":4,'sardegna':4
    };
    gj.features.forEach(feat => {
      const name = (feat.properties.name || '').toLowerCase();
      const z = ZONES[name] || 3;
      ctx.fillStyle = FILL[z];
      ctx.strokeStyle = 'rgba(245,237,224,0.12)';
      ctx.lineWidth = 0.5;
      const geom = feat.geometry;
      const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
      polys.forEach(poly => {
        poly.forEach(ring => {
          ctx.beginPath();
          ring.forEach(([ln, lt], i) => {
            const [x, y] = _projPt(ln, lt, W, H);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.closePath(); ctx.fill(); ctx.stroke();
        });
      });
    });
  }

  function _drawMarkers(ctx, events, W, H) {
    events.forEach(ev => {
      const [x, y] = _projPt(ev.lon, ev.lat, W, H);
      const r = ev.mag < 2 ? 2 : ev.mag < 3 ? 3.5 : ev.mag < 4 ? 5.5 : ev.mag < 5 ? 8 : 12;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = ev.mag < 3 ? 'rgba(245,237,224,0.55)' : ev.mag < 4 ? 'rgba(212,137,58,0.9)' : 'rgba(196,58,58,1)';
      ctx.fill();
    });
  }

  function _renderMapCanvas(events) {
    const canvas = document.getElementById('s1-map-canvas');
    if (!canvas) return;
    const W = canvas.parentElement.clientWidth || 500;
    const H = Math.round(W * 1.25);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);
    if (_regionsGJ) _drawRegions(ctx, _regionsGJ, W, H);
    if (events && events.length) _drawMarkers(ctx, events, W, H);
    /* Marcatore fisso L'Aquila */
    const [ax, ay] = _projPt(13.3995, 42.3498, W, H);
    ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#F5EDE0'; ctx.fill();
    ctx.strokeStyle = '#C4612A'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(245,237,224,0.65)';
    ctx.fillText("L'AQUILA", ax + 8, ay + 3);
  }

  function countUpElement(el, target, duration) {
    if (!el) return;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function showFallback() {
    const fb = document.getElementById('s1-api-fallback');
    const cq = document.getElementById('s1-quake-count');
    if (fb) fb.style.display = 'block';
    if (cq) cq.textContent = '~15';
  }

  function fetchINGV() {
    const tEnd   = new Date().toISOString().slice(0, 19);
    const tStart = new Date(Date.now() - 86400000).toISOString().slice(0, 19);
    const url = `https://webservices.ingv.it/fdsnws/event/1/query?format=text&minmag=1.5&starttime=${tStart}&endtime=${tEnd}&orderby=time`;
    fetch(url)
      .then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(text => {
        const events = text.trim().split('\n').slice(1).map(l => {
          const c = l.split('|');
          return c.length >= 11 ? { lat:+c[2], lon:+c[3], mag:+c[10], location:(c[12]||'').trim(), time:(c[1]||'') } : null;
        }).filter(e => e && !isNaN(e.lat) && !isNaN(e.mag));
        if (!events.length) { showFallback(); _renderMapCanvas([]); return; }
        const cnt = document.getElementById('s1-quake-count');
        if (cnt) { fetchDone ? cnt.textContent = events.length : countUpElement(cnt, events.length, 1400); fetchDone = true; }
        const first = events[0];
        const le = document.getElementById('s1-last-event');
        if (le && first) {
          const loc = document.getElementById('s1-last-loc'), tim = document.getElementById('s1-last-time'), mag = document.getElementById('s1-last-mag');
          if (loc) loc.textContent = first.location;
          if (tim) tim.textContent = first.time.slice(0,16).replace('T',' ');
          if (mag) mag.textContent = first.mag.toFixed(1);
          le.style.display = 'block';
        }
        _renderMapCanvas(events);
      })
      .catch(() => { showFallback(); _renderMapCanvas([]); });
  }

  function initMap() {
    fetch('italy-regions.json')
      .then(r => r.json())
      .then(gj => { _regionsGJ = gj; _renderMapCanvas([]); })
      .catch(() => _renderMapCanvas([]));
  }

•â• BRANCH ANIMATION — Slide 2 â•â•â• */

  function initBranchAnim() {
    const mainPath  = document.getElementById('s1-b-main');
    const leftLine  = document.getElementById('s1-b-left');
    const rightLine = document.getElementById('s1-b-right');
    const flash     = document.getElementById('s1-b-flash');
    const svgLabel  = document.getElementById('s1-b-label');
    const btn       = document.getElementById('s1-branch-btn');
    const phaseItems = document.querySelectorAll('#s1-s2 .s1-phase-item');

    if (!mainPath) return;

    const CYCLE = 9000; // ms totali
    const T = { integro: 2000, deform: 5200, rottura: 5700, rimbalzo: 7200, reset: 9000 };
    const LABEL_COLOR = { 1: 'rgba(245,237,224,0.55)', 2: '#C4612A', 3: '#8B1A1A', 4: '#8B1A1A' };
    const LABEL_TEXT  = { 1: 'INTEGRO', 2: 'DEFORMAZIONE', 3: 'ROTTURA', 4: 'RIMBALZO' };

    let elapsed = 0, lastTs = null, running = true;

    function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    function setPhase(n) {
      phaseItems.forEach(el => el.classList.toggle('active', +el.dataset.phase === n));
      if (svgLabel) {
        svgLabel.textContent = LABEL_TEXT[n];
        svgLabel.setAttribute('fill', LABEL_COLOR[n]);
      }
    }

    function frame(ts) {
      if (!running) return;
      if (lastTs !== null) elapsed = (elapsed + ts - lastTs) % CYCLE;
      lastTs = ts;
      const e = elapsed;

      if (e < T.integro) {
        /* INTEGRO — ramo dritto, statico */
        mainPath.setAttribute('d', 'M20,92 Q170,92 320,92');
        mainPath.setAttribute('stroke', 'rgba(245,237,224,0.85)');
        mainPath.setAttribute('opacity', '1');
        leftLine.setAttribute('opacity', '0');
        rightLine.setAttribute('opacity', '0');
        flash.setAttribute('opacity', '0');
        setPhase(1);

      } else if (e < T.deform) {
        /* DEFORMAZIONE — curvatura fluida del bezier */
        const raw = (e - T.integro) / (T.deform - T.integro);
        const t = ease(raw);
        /* aggiunge una leggera oscillazione sul 70-100% per simulare tensione */
        const tension = raw > 0.7 ? Math.sin((raw - 0.7) / 0.3 * Math.PI * 4) * 3 * (1 - raw) : 0;
        const cy = 92 - t * 30 + tension;
        const r = Math.round(180 + t * 16), g = Math.round(97 - t * 30), b = Math.round(42 - t * 30);
        mainPath.setAttribute('d', `M20,92 Q170,${cy.toFixed(1)} 320,92`);
        mainPath.setAttribute('stroke', `rgb(${r},${g},${b})`);
        mainPath.setAttribute('opacity', '1');
        leftLine.setAttribute('opacity', '0');
        rightLine.setAttribute('opacity', '0');
        flash.setAttribute('opacity', '0');
        setPhase(2);

      } else if (e < T.rottura) {
        /* ROTTURA — flash + pezzi appaiono */
        const ft = (e - T.deform) / (T.rottura - T.deform);
        mainPath.setAttribute('opacity', '0');
        leftLine.setAttribute('opacity', '1');
        rightLine.setAttribute('opacity', '1');
        leftLine.setAttribute('y1', '92'); leftLine.setAttribute('y2', '87');
        rightLine.setAttribute('y1', '97'); rightLine.setAttribute('y2', '92');
        flash.setAttribute('opacity', String(Math.max(0, 1 - ft * 2.5)));
        setPhase(3);

      } else if (e < T.rimbalzo) {
        /* RIMBALZO — i pezzi oscillano e si assestano */
        const rt = (e - T.rottura) / (T.rimbalzo - T.rottura);
        const bounce = Math.sin(rt * Math.PI * 2.5) * (1 - rt) * 5;
        leftLine.setAttribute('y1', String(92 - bounce));
        leftLine.setAttribute('y2', String(87 - bounce));
        rightLine.setAttribute('y1', String(97 + bounce));
        rightLine.setAttribute('y2', String(92 + bounce));
        leftLine.setAttribute('opacity', '1');
        rightLine.setAttribute('opacity', '1');
        mainPath.setAttribute('opacity', '0');
        flash.setAttribute('opacity', '0');
        setPhase(4);

      } else {
        /* RESET — pezzi sfumano, ramo ritorna */
        const p = (e - T.rimbalzo) / (T.reset - T.rimbalzo);
        leftLine.setAttribute('opacity', String(1 - p));
        rightLine.setAttribute('opacity', String(1 - p));
        /* reset posizioni per il prossimo ciclo */
        leftLine.setAttribute('y1', '92'); leftLine.setAttribute('y2', '87');
        rightLine.setAttribute('y1', '97'); rightLine.setAttribute('y2', '92');
        mainPath.setAttribute('d', 'M20,92 Q170,92 320,92');
        mainPath.setAttribute('stroke', 'rgba(245,237,224,0.85)');
        mainPath.setAttribute('opacity', String(p));
        flash.setAttribute('opacity', '0');
        setPhase(1);
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    if (btn) {
      btn.addEventListener('click', () => {
        running = !running;
        const sp = btn.querySelector('span');
        if (running) {
          lastTs = null;
          sp.innerHTML = '&#9646;&#9646; Pausa';
          requestAnimationFrame(frame);
        } else {
          sp.innerHTML = '&#9654; Riprendi';
        }
      });
    }
  }

  /* â•â•â• FAULT ANIMATION — Slide 3 â•â•â• */

  /* Stato animazione faglia */
  const FAULT_ANIM = { running: false, animId: null, initialized: false, phase: 1, paused: false, phaseStart: 0, t: 0 };

  function startFaultAnim() {
    const canvas      = document.getElementById('s1-fault-canvas');
    const phaseLabel  = document.getElementById('s1-fault-phase-label');
    const yearsEl     = document.getElementById('s1-fault-years');
    const playBtn     = document.getElementById('s1-play-btn');
    const phaseItems  = document.querySelectorAll('#s1-s3 .s1-phase-item');

    if (!canvas) return;

    if (FAULT_ANIM.initialized && FAULT_ANIM.running) {
      cancelAnimationFrame(FAULT_ANIM.animId);
      FAULT_ANIM.running = false;
      if (playBtn) playBtn.querySelector('span').innerHTML = '&#9654; Riprendi';
      return;
    }

    if (FAULT_ANIM.initialized && !FAULT_ANIM.running) {
      FAULT_ANIM.running = true;
      if (playBtn) playBtn.querySelector('span').innerHTML = '&#9646;&#9646; Pausa';
      FAULT_ANIM.phaseStart = performance.now() - FAULT_ANIM.t;
      loop(performance.now());
      return;
    }

    FAULT_ANIM.initialized = true;
    FAULT_ANIM.running     = true;
    FAULT_ANIM.phase       = 1;
    FAULT_ANIM.t           = 0;

    if (playBtn) playBtn.querySelector('span').innerHTML = '&#9646;&#9646; Pausa';

    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 380;

    const ctx    = canvas.getContext('2d');
    const W      = canvas.width;
    const H      = canvas.height;

    const faultX  = W / 2;
    const blockW  = W / 2 - 20;
    const numRefLines = 5;
    const refLineSpacing = H / (numRefLines + 1);

    let leftOffY  = 0;
    let rightOffY = 0;
    let shearAmt  = 0;
    let waves     = [];
    let flashAlpha = 0;

    const PHASE_DUR = { 1: 1500, 2: 3000, 3: 400, 4: 1000 };
    const YEARS_MAX = 306;

    FAULT_ANIM.phaseStart = performance.now();

    function aggiornaFaseUI(fase) {
      phaseItems.forEach(function(item) {
        item.classList.toggle('active', parseInt(item.dataset.phase) === fase);
      });
    }

    const FASE_LABELS = {
      1: 'Fase 1 — Accumulo di tensione in corso',
      2: 'Fase 2 — Deformazione elastica dei blocchi',
      3: 'Fase 3 — Rottura — rilascio istantaneo di energia',
      4: 'Fase 4 — Rimbalzo alla posizione di equilibrio'
    };

    function aggiornaLabel(fase) {
      if (phaseLabel) phaseLabel.textContent = FASE_LABELS[fase] || '';
    }

    function disegnaBlocco(x, y, w, h, lato) {
      const gradColore = lato === 'sinistro'
        ? ctx.createLinearGradient(x, y, x + w, y + h)
        : ctx.createLinearGradient(x + w, y, x, y + h);
      gradColore.addColorStop(0,   '#1a1e2e');
      gradColore.addColorStop(0.5, '#141824');
      gradColore.addColorStop(1,   '#0e1018');
      ctx.fillStyle = gradColore;
      ctx.fillRect(x, y, w, h);
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 237, 224, 0.03)';
      ctx.lineWidth = 0.5;
      const righeStrati = Math.floor(h / 18);
      for (let i = 1; i <= righeStrati; i++) {
        ctx.beginPath(); ctx.moveTo(x, y + i * 18); ctx.lineTo(x + w, y + i * 18); ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(196, 97, 42, 0.08)';
      ctx.lineWidth = 1;
      if (lato === 'sinistro') {
        ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
      }
      ctx.restore();
    }

    function disegnaLineeRiferimento(shear, fase) {
      const alpha = fase === 2 ? 0.55 : 0.22;
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 237, 224, ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 1; i <= numRefLines; i++) {
        const yBase  = i * refLineSpacing;
        const yLeft  = yBase - shear / 2;
        const yRight = yBase + shear / 2;
        ctx.beginPath(); ctx.moveTo(20, yLeft + leftOffY); ctx.lineTo(faultX - 15, yLeft + leftOffY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(faultX + 15, yRight + rightOffY); ctx.lineTo(W - 20, yRight + rightOffY); ctx.stroke();
      }
      ctx.restore();
    }

    function disegnaFaglia(fase, flashA) {
      ctx.save();
      if (fase <= 2) {
        ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(196, 97, 42, 0.35)'; ctx.lineWidth = 1.5;
      } else {
        const intensita = Math.min(1, flashA + 0.6);
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(196, 97, 42, ' + intensita + ')';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(196, 97, 42, 0.8)';
        ctx.shadowBlur  = 12 * intensita;
      }
      ctx.beginPath(); ctx.moveTo(faultX, 0); ctx.lineTo(faultX, H); ctx.stroke();
      ctx.restore();
    }

    function disegnaFrecce(progresso) {
      const alpha   = Math.min(0.75, progresso * 1.5);
      const arrowLen = 28 + progresso * 14;
      const arrowPx  = 7;
      ctx.save();
      ctx.strokeStyle = 'rgba(196, 97, 42, ' + alpha + ')';
      ctx.fillStyle   = 'rgba(196, 97, 42, ' + alpha + ')';
      ctx.lineWidth   = 1.5;
      for (let i = 0; i < 3; i++) {
        const xF = 40 + i * (blockW / 4); const yF = H * 0.35;
        ctx.beginPath(); ctx.moveTo(xF, yF); ctx.lineTo(xF, yF + arrowLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xF, yF + arrowLen); ctx.lineTo(xF - arrowPx/2, yF + arrowLen - arrowPx); ctx.lineTo(xF + arrowPx/2, yF + arrowLen - arrowPx); ctx.closePath(); ctx.fill();
      }
      for (let i = 0; i < 3; i++) {
        const xF = faultX + 35 + i * (blockW / 4); const yF = H * 0.65;
        ctx.beginPath(); ctx.moveTo(xF, yF); ctx.lineTo(xF, yF - arrowLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xF, yF - arrowLen); ctx.lineTo(xF - arrowPx/2, yF - arrowLen + arrowPx); ctx.lineTo(xF + arrowPx/2, yF - arrowLen + arrowPx); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    function disegnaOnde() {
      waves.forEach(function(w) {
        ctx.save(); ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = w.color; ctx.globalAlpha = Math.max(0, w.alpha); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      });
    }

    function disegnaFlash(alpha) {
      if (alpha <= 0) return;
      ctx.save(); ctx.fillStyle = 'rgba(196, 97, 42, ' + alpha * 0.18 + ')'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    function spawnaOnde() {
      waves.push({ x: faultX, y: H / 3, r: 2, maxR: 200, speed: 2.5, color: '#C4612A', alpha: 0.9, baseAlpha: 0.9 });
      waves.push({ x: faultX, y: H * 0.7, r: 2, maxR: 200, speed: 2.5, color: '#C4612A', alpha: 0.9, baseAlpha: 0.9 });
      setTimeout(function() {
        waves.push({ x: faultX, y: H / 3, r: 2, maxR: 200, speed: 1.5, color: '#3A7EC4', alpha: 0.85, baseAlpha: 0.85 });
        waves.push({ x: faultX, y: H * 0.7, r: 2, maxR: 200, speed: 1.5, color: '#3A7EC4', alpha: 0.85, baseAlpha: 0.85 });
      }, 200);
    }

    function aggiornaOnde() {
      waves = waves.filter(function(w) {
        w.r += w.speed; w.alpha = (1 - w.r / w.maxR) * w.baseAlpha; return w.r < w.maxR;
      });
    }

    let ondePSpawnate = false;

    function cambiafase(nuovaFase, ora) {
      FAULT_ANIM.phase = nuovaFase; FAULT_ANIM.phaseStart = ora;
      aggiornaFaseUI(nuovaFase); aggiornaLabel(nuovaFase);
      if (nuovaFase === 1) {
        leftOffY = 0; rightOffY = 0; shearAmt = 0; waves = []; flashAlpha = 0; ondePSpawnate = false;
        if (yearsEl) { yearsEl.style.display = 'none'; yearsEl.textContent = ''; }
      }
      if (nuovaFase === 2) { if (yearsEl) yearsEl.style.display = 'block'; }
      if (nuovaFase === 3) { ondePSpawnate = false; if (yearsEl) yearsEl.style.display = 'none'; }
    }

    function loop(ora) {
      if (!FAULT_ANIM.running) return;
      FAULT_ANIM.t = ora; // tempo assoluto per effetti come il pulse
      const elapsoPase = ora - FAULT_ANIM.phaseStart;
      const fase       = FAULT_ANIM.phase;
      const durata     = PHASE_DUR[fase];
      const progresso  = Math.min(1, elapsoPase / durata);

      if (elapsoPase >= durata) {
        const prossima = fase < 4 ? fase + 1 : 1;
        cambiafase(prossima, ora);
        FAULT_ANIM.animId = requestAnimationFrame(loop);
        return;
      }

      if (fase === 1) {
        shearAmt = 0; leftOffY = 0; rightOffY = 0; flashAlpha = 0;
        /* frecce di accumulo piccole e crescenti (fino a 30% della forza massima) */
        disegnaFrecce(progresso * 0.3);
      }
      if (fase === 2) {
        shearAmt = progresso * 18;
        const anni = Math.round(progresso * YEARS_MAX);
        if (yearsEl) yearsEl.textContent = anni + ' anni';
      }
      if (fase === 3) {
        const ease = 1 - Math.pow(1 - progresso, 3);
        shearAmt   = 18 * (1 - ease);
        flashAlpha = progresso < 0.3 ? progresso / 0.3 : 1 - (progresso - 0.3) / 0.7;
        leftOffY   = -Math.sin(progresso * Math.PI) * 5;
        rightOffY  =  Math.sin(progresso * Math.PI) * 5;
        if (!ondePSpawnate) { spawnaOnde(); ondePSpawnate = true; }
      }
      if (fase === 4) {
        const ease = 1 - Math.pow(1 - progresso, 2);
        shearAmt   = 0;
        leftOffY   = -(1 - ease) * 4;
        rightOffY  =  (1 - ease) * 4;
        flashAlpha = 0;
      }

      aggiornaOnde();

      let shakeX = 0, shakeY = 0;
      if (fase === 3) {
        const intensitaShake = (1 - progresso) * 4;
        shakeX = (Math.random() - 0.5) * intensitaShake;
        shakeY = (Math.random() - 0.5) * intensitaShake;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(shakeX, shakeY);
      disegnaBlocco(0, leftOffY, faultX - 15, H, 'sinistro');
      disegnaBlocco(faultX + 15, rightOffY, W - (faultX + 15), H, 'destro');
      disegnaLineeRiferimento(shearAmt, fase);
      /* glow sulla faglia in fase 1 che pulsa lentamente */
      if (fase === 1) {
        const pulse = 0.5 + 0.5 * Math.sin(FAULT_ANIM.t / 400);
        ctx.save();
        ctx.strokeStyle = `rgba(196,97,42,${0.12 + pulse * 0.1})`;
        ctx.lineWidth = 6; ctx.shadowColor = '#C4612A'; ctx.shadowBlur = 18 * pulse;
        ctx.beginPath(); ctx.moveTo(faultX, 0); ctx.lineTo(faultX, H); ctx.stroke();
        ctx.restore();
      }
      disegnaFaglia(fase, flashAlpha);
      if (fase === 1) { disegnaFrecce(progresso * 0.3); }
      if (fase === 2) { disegnaFrecce(progresso); }
      if (fase === 3) { disegnaFlash(flashAlpha); }
      disegnaOnde();
      /* etichette blocchi e faglia */
      ctx.save();
      ctx.font = '700 9px \'JetBrains Mono\', monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(245,237,224,0.18)';
      ctx.fillText('BLOCCO A', faultX / 2, 14);
      ctx.fillText('BLOCCO B', faultX + (W - faultX) / 2, 14);
      ctx.fillStyle = 'rgba(196,97,42,0.25)';
      ctx.save(); ctx.translate(faultX, H / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('FAGLIA', 0, -6); ctx.restore();
      ctx.restore();

      FAULT_ANIM.animId = requestAnimationFrame(loop);
    }

    aggiornaFaseUI(1);
    aggiornaLabel(1);
    FAULT_ANIM.phaseStart = performance.now();
    FAULT_ANIM.animId = requestAnimationFrame(loop);
  }

  /* â•â•â• SLIDERS — Slide 4 â•â•â• */

  const GR_TABLE = [
    { anni: 0.003, label: '1 giorno',     mag: 1.0 },
    { anni: 0.02,  label: '1 settimana',  mag: 1.5 },
    { anni: 0.08,  label: '1 mese',       mag: 2.0 },
    { anni: 1,     label: '1 anno',       mag: 2.8 },
    { anni: 10,    label: '10 anni',      mag: 3.8 },
    { anni: 50,    label: '50 anni',      mag: 4.9 },
    { anni: 100,   label: '100 anni',     mag: 5.5 },
    { anni: 200,   label: '200 anni',     mag: 6.0 },
    { anni: 500,   label: '500 anni',     mag: 6.5 },
  ];

  function getMagDesc(m) {
    if (m < 2.0) return 'Impercettibile — solo i sismografi lo registrano';
    if (m < 3.0) return 'Raramente percepito dalle persone';
    if (m < 4.0) return 'Spesso percepito, danni rarissimi';
    if (m < 5.0) return 'Avvertito da tutti, piccoli danni';
    if (m < 6.0) return 'Danni moderati agli edifici';
    if (m < 7.0) return "Danni gravi — come L'Aquila 2009 (M 6.3)";
    return 'Catastrofico';
  }

  function formatEnergy(m) {
    const e = Math.pow(10, 1.5 * m + 4.8);
    if (e >= 1e15) return `~${(e/1e15).toFixed(0)} quadrilioni di joule`;
    if (e >= 1e12) return `~${(e/1e12).toFixed(0)} miliardi di joule`;
    if (e >= 1e9)  return `~${(e/1e9).toFixed(0)} milioni di joule`;
    return `~${e.toFixed(0)} joule`;
  }

  function energyColor(mag) {
    const t = Math.min(Math.max((mag - 1.0) / (7.5 - 1.0), 0), 1);
    const r = Math.round(76  + t * (139 - 76));
    const g = Math.round(175 + t * (26  - 175));
    const b = Math.round(80  + t * (26  - 80));
    return `rgb(${r},${g},${b})`;
  }

  function updateEnergy(mag) {
    const fill  = document.getElementById('s1-energy-fill');
    const label = document.getElementById('s1-energy-label');
    const pct   = ((mag - 1.0) / (7.5 - 1.0)) * 100;
    if (fill) {
      fill.style.height = pct + '%';
      fill.style.background = `linear-gradient(to top, #8B1A1A, ${energyColor(mag)})`;
    }
    if (label) label.textContent = formatEnergy(mag);
  }

  function updateFromTimeIdx(idx) {
    idx = Math.max(0, Math.min(GR_TABLE.length - 1, idx));
    const row = GR_TABLE[idx];
    const mag = row.mag;
    const magSlider = document.getElementById('s1-mag-slider');
    const timeLabel = document.getElementById('s1-time-label');
    const magLabel  = document.getElementById('s1-mag-label');
    const magDesc   = document.getElementById('s1-mag-desc');
    if (magSlider) magSlider.value = Math.round(mag * 10);
    if (timeLabel) timeLabel.textContent = 'circa ' + row.label;
    if (magLabel)  magLabel.textContent  = 'M ' + mag.toFixed(1);
    if (magDesc)   magDesc.textContent   = getMagDesc(mag);
    updateEnergy(mag);
  }

  function updateFromMagVal(val) {
    const mag = val / 10;
    let closest = 0, minDiff = Infinity;
    GR_TABLE.forEach((row, i) => {
      const diff = Math.abs(row.mag - mag);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });
    const timeSlider = document.getElementById('s1-time-slider');
    const timeLabel  = document.getElementById('s1-time-label');
    const magLabel   = document.getElementById('s1-mag-label');
    const magDesc    = document.getElementById('s1-mag-desc');
    if (timeSlider) timeSlider.value = closest;
    if (timeLabel)  timeLabel.textContent  = 'circa ' + GR_TABLE[closest].label;
    if (magLabel)   magLabel.textContent   = 'M ' + mag.toFixed(1);
    if (magDesc)    magDesc.textContent    = getMagDesc(mag);
    updateEnergy(mag);
  }

  function initSliders() {
    const ts = document.getElementById('s1-time-slider');
    const ms = document.getElementById('s1-mag-slider');
    if (!ts || !ms) return;
    ts.addEventListener('input', function () { updateFromTimeIdx(+this.value); });
    ms.addEventListener('input', function () { updateFromMagVal(+this.value); });
    updateFromTimeIdx(3);
  }

  /* â•â•â• CANVAS PAGANICA — Slide 5 â•â•â• */

  function drawPagStrati(ctx, W, H) {
    ctx.fillStyle = '#1a2030'; ctx.fillRect(0, 0, W, H * 0.13);
    ctx.fillStyle = '#232d3f'; ctx.fillRect(0, H * 0.13, W, H * 0.40);
    ctx.fillStyle = '#1c2535'; ctx.fillRect(0, H * 0.53, W, H * 0.47);
    ctx.fillStyle = 'rgba(245,237,224,0.6)';
    ctx.font = '600 9px "JetBrains Mono"';
    ctx.fillText('0–2 km  ·  sedimenti', 10, H * 0.08);
    ctx.fillText('2–8 km  ·  calcari', 10, H * 0.33);
    ctx.fillText('8–15 km  ·  roccia cristallina', 10, H * 0.75);
  }

  function drawPagFault(ctx, W, H, solid, glowing) {
    const x0 = W * 0.35, y0 = H, x1 = W * 0.65, y1 = 0;
    ctx.strokeStyle = glowing ? '#E8C060' : '#C4612A';
    ctx.lineWidth   = glowing ? 2.5 : 1.5;
    ctx.setLineDash(solid ? [] : [6, 4]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPagArrow(ctx, x1, y1, x2, y2, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const hw = 7;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hw * Math.cos(angle - 0.4), y2 - hw * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - hw * Math.cos(angle + 0.4), y2 - hw * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
  }

  function setLabelPag(text) {
    const el = document.getElementById('s1-paganica-label');
    if (el) el.textContent = text;
  }

  function pagSetup(c) {
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth || 800, H = 320;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = '320px';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, W, H };
  }

  function drawPaganicanPhase1() {
    const c = document.getElementById('s1-paganica-canvas');
    if (!c) return;
    const { ctx, W, H } = pagSetup(c);
    ctx.clearRect(0, 0, W, H);
    drawPagStrati(ctx, W, H);
    drawPagFault(ctx, W, H, false, false);
    drawPagArrow(ctx, W * 0.25, H * 0.50, W * 0.12, H * 0.35, 'rgba(196,58,58,0.65)');
    drawPagArrow(ctx, W * 0.75, H * 0.50, W * 0.88, H * 0.65, 'rgba(196,58,58,0.65)');
    setLabelPag('Tensione accumulata — ~550 anni');
  }


  function initPaganicanCanvas() {
    const btn = document.getElementById('s1-paganica-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (this.textContent.includes('Rivedi')) {
        this.textContent = '▶ Avvia';
        drawPaganicanPhase1();
      } else {
        this.textContent = 'â³';
        this.disabled = true;
        runPaganicanAnim();
      }
    });
    drawPaganicanPhase1();
  }

  function runPaganicanAnim() {
    const canvas = document.getElementById('s1-paganica-canvas');
    if (!canvas) return;
    const { ctx, W, H } = pagSetup(canvas);

    let leftOffY = 0, rightOffY = 0;
    let cracks = [];
    let flashAlpha = 0;
    let shakeFrames = 0;
    const animStart = performance.now();

    const faultX0 = W * 0.35, faultY0 = H;
    const faultX1 = W * 0.65, faultY1 = 0;
    const numCracks = 18;
    for (let i = 0; i < numCracks; i++) {
      const t  = i / numCracks;
      const cx = faultX0 + (faultX1 - faultX0) * t;
      const cy = faultY0 + (faultY1 - faultY0) * t;
      const angle = Math.atan2(faultY1 - faultY0, faultX1 - faultX0) + Math.PI / 2;
      const side  = (Math.random() > 0.5) ? 1 : -1;
      const len   = 4 + Math.random() * 5;
      cracks.push({ cx, cy, dx: Math.cos(angle) * side * len, dy: Math.sin(angle) * side * len, visible: false, alpha: 1.0 });
    }

    function frame(now) {
      const elapsed = now - animStart;
      const PHASE1_END = 2000, PHASE2_END = 2600, PHASE3_END = 3800;

      ctx.save();
      if (shakeFrames > 0) { ctx.translate((Math.random()-0.5)*4, (Math.random()-0.5)*4); shakeFrames--; }
      ctx.clearRect(-10,-10,W+20,H+20);

      if (elapsed < PHASE1_END) {
        drawPagStrati(ctx, W, H);
        drawPagFault(ctx, W, H, false, false);
        drawPagArrow(ctx, W*0.25, H*0.5, W*0.12, H*0.35, 'rgba(196,58,58,0.65)');
        drawPagArrow(ctx, W*0.75, H*0.5, W*0.88, H*0.65, 'rgba(196,58,58,0.65)');
        setLabelPag('Tensione accumulata — ~550 anni');
      } else if (elapsed < PHASE2_END) {
        const p2 = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END);
        if (p2 > 0.05 && shakeFrames === 0) shakeFrames = 8;
        drawPagStrati(ctx, W, H);
        drawPagFault(ctx, W, H, true, true);
        const visibleCount = Math.floor(p2 * numCracks);
        cracks.forEach((c, i) => {
          if (i < visibleCount) {
            ctx.strokeStyle = `rgba(255,200,100,${c.alpha * 0.7})`; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(c.cx, c.cy); ctx.lineTo(c.cx + c.dx, c.cy + c.dy); ctx.stroke();
          }
        });
        flashAlpha = Math.sin(p2 * Math.PI) * 0.6;
        if (flashAlpha > 0) { ctx.fillStyle = `rgba(255,240,200,${flashAlpha})`; ctx.fillRect(0,0,W,H); }
        setLabelPag('6 aprile 2009 · 03:32:39 UTC — Rottura');
      } else if (elapsed < PHASE3_END) {
        const p3 = (elapsed - PHASE2_END) / (PHASE3_END - PHASE2_END);
        const ease = 1 - Math.pow(1 - p3, 3);
        leftOffY  = -8  * ease;
        rightOffY =  28 * ease;
        /* clip diagonale che segue la faglia */
        ctx.save();
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.65,0); ctx.lineTo(W*0.35,H); ctx.lineTo(0,H); ctx.closePath();
        ctx.clip(); ctx.translate(0, leftOffY); drawPagStrati(ctx, W, H); ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.moveTo(W*0.65,0); ctx.lineTo(W,0); ctx.lineTo(W,H); ctx.lineTo(W*0.35,H); ctx.closePath();
        ctx.clip(); ctx.translate(0, rightOffY); drawPagStrati(ctx, W, H); ctx.restore();
        drawPagFault(ctx, W, H, true, false);
        if (p3 > 0.3) {
          const labelAlpha = Math.min((p3 - 0.3) / 0.3, 1);
          drawPagArrow(ctx, W*0.78, H*0.35, W*0.78, H*0.35 + 28*ease, `rgba(196,58,58,${labelAlpha * 0.9})`);
          ctx.fillStyle = `rgba(245,237,224,${labelAlpha * 0.85})`; ctx.font = '600 10px "JetBrains Mono"';
          ctx.fillText('~25 cm', W*0.80, H*0.35 + 14*ease);
        }
        cracks.forEach(c => {
          c.alpha = Math.max(0, 1 - p3 * 2);
          if (c.alpha > 0) {
            ctx.strokeStyle = `rgba(255,200,100,${c.alpha * 0.5})`; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(c.cx, c.cy); ctx.lineTo(c.cx + c.dx, c.cy + c.dy); ctx.stroke();
          }
        });
        setLabelPag('Scorrimento completato in < 7 secondi');
      } else {
        /* FREEZE — disegna il fotogramma finale e si ferma */
        ctx.save();
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*0.65,0); ctx.lineTo(W*0.35,H); ctx.lineTo(0,H); ctx.closePath();
        ctx.clip(); ctx.translate(0, -8); drawPagStrati(ctx, W, H); ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.moveTo(W*0.65,0); ctx.lineTo(W,0); ctx.lineTo(W,H); ctx.lineTo(W*0.35,H); ctx.closePath();
        ctx.clip(); ctx.translate(0, 28); drawPagStrati(ctx, W, H); ctx.restore();
        drawPagFault(ctx, W, H, true, false);
        drawPagArrow(ctx, W*0.78, H*0.35, W*0.78, H*0.35 + 28, 'rgba(196,58,58,0.9)');
        ctx.fillStyle = 'rgba(245,237,224,0.85)'; ctx.font = '600 10px "JetBrains Mono"';
        ctx.fillText('~25 cm', W*0.80, H*0.35 + 14);
        setLabelPag('Scorrimento completato — 6 aprile 2009');
        const btn = document.getElementById('s1-paganica-btn');
        if (btn) { btn.textContent = '↺ Rivedi'; btn.disabled = false; }
        ctx.restore(); return;
      }

      ctx.restore();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ── Init ── */
  goToSlide(0, false);

})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  HERO CANVAS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const hc   = document.getElementById('hero-canvas');
const hctx = hc.getContext('2d');
let ht = 0;

function resizeHero() { hc.width = hc.offsetWidth; hc.height = hc.offsetHeight; }
resizeHero();
new ResizeObserver(resizeHero).observe(hc.parentElement);

let heroHover = false, heroMX = 0, heroMY = 0, heroSpeed = 0;
hc.addEventListener('mousemove', e => {
    const rect = hc.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const dx = mx - heroMX, dy = my - heroMY;
    heroSpeed += Math.sqrt(dx*dx + dy*dy);
    heroMX = mx; heroMY = my; heroHover = true;
});
hc.addEventListener('mouseleave', () => { heroHover = false; heroSpeed = 0; });

const heroRows = 22;
const heroDisp = new Float32Array(heroRows);
const heroVel  = new Float32Array(heroRows);

function drawHero() {
    hctx.clearRect(0, 0, hc.width, hc.height);
    const W = hc.width, H = hc.height;
    const rowH = H / heroRows;
    const impulse = heroHover ? Math.min(heroSpeed * 0.06, 2.0) : 0;
    heroSpeed = 0;
    for (let r = 0; r < heroRows; r++) {
        const y0 = rowH * r + rowH / 2;
        const distY = Math.abs(heroMY - y0);
        const prox = heroHover ? Math.max(0, 1 - distY / (rowH * 2)) : 0;
        heroVel[r] += impulse * prox;
        heroVel[r] = (heroVel[r] - heroDisp[r] * 0.012) * 0.94;
        heroDisp[r] += heroVel[r];
    }
    for (let r = 0; r < heroRows; r++) {
        const y0 = rowH * r + rowH / 2;
        const baseAmp = 1.8 + Math.sin(r * 0.6 + ht * 0.25) * 1.2;
        const freq = 0.013 + r * 0.0008;
        const phase = ht * 0.9 + r * 0.9;
        const disp = heroDisp[r];
        hctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
            const env = Math.sin((x / W) * Math.PI);
            const wave = Math.sin(x * freq + phase) * baseAmp * env;
            x === 0 ? hctx.moveTo(x, y0 + wave + disp * env) : hctx.lineTo(x, y0 + wave + disp * env);
        }
        const nearRow = heroHover && Math.abs(heroMY - y0) < rowH;
        const alpha = 0.28 + Math.sin(r * 0.5 + ht * 0.15) * 0.06 + (nearRow ? 0.07 : 0);
        hctx.strokeStyle = `rgba(196,97,42,${alpha})`;
        hctx.lineWidth = nearRow ? 1.8 : 1.35;
        hctx.stroke();
    }
    ht += 0.035;
    requestAnimationFrame(drawHero);
}
drawHero();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  WAVE CANVAS — sci-3 (canvas rimosso con il vecchio carousel)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const wc   = document.getElementById('wave-canvas');
const wctx = wc ? wc.getContext('2d') : null;
let wt = 0, wAnimating = false;

function resizeWave() { if (wc) { wc.width = wc.offsetWidth; wc.height = wc.offsetHeight || 240; } }
if (wc) resizeWave();

function drawWaves() {
    if (!wctx) return;
    wctx.clearRect(0, 0, wc.width, wc.height);
    const W = wc.width, H = wc.height;

    // Grid
    wctx.strokeStyle = 'rgba(58,126,196,0.06)';
    wctx.lineWidth = 1;
    for (let y = 0; y < H; y += 32) { wctx.beginPath(); wctx.moveTo(0,y); wctx.lineTo(W,y); wctx.stroke(); }
    for (let x = 0; x < W; x += 64) { wctx.beginPath(); wctx.moveTo(x,0); wctx.lineTo(x,H); wctx.stroke(); }

    // Onde P
    wctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
        const env  = Math.sin((x / W) * Math.PI);
        const wave = Math.sin(x * 0.04 - wt * 3.2) * 28 * env;
        x === 0 ? wctx.moveTo(x, H * 0.28 + wave) : wctx.lineTo(x, H * 0.28 + wave);
    }
    wctx.strokeStyle = 'rgba(58,126,196,0.9)';
    wctx.lineWidth = 2;
    wctx.stroke();

    // Label P
    wctx.fillStyle = 'rgba(58,126,196,0.5)';
    wctx.font = '500 9px "JetBrains Mono"';
    wctx.fillText('P · 6 km/s', 8, H * 0.28 - 12);

    // Onde S
    wctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
        const env  = Math.sin((x / W) * Math.PI);
        const wave = Math.sin(x * 0.025 - wt * 1.9) * 42 * env;
        x === 0 ? wctx.moveTo(x, H * 0.72 + wave) : wctx.lineTo(x, H * 0.72 + wave);
    }
    wctx.strokeStyle = 'rgba(196,58,58,0.9)';
    wctx.lineWidth = 2;
    wctx.stroke();

    // Label S
    wctx.fillStyle = 'rgba(196,58,58,0.5)';
    wctx.fillText('S · 3.6 km/s', 8, H * 0.72 - 15);

    wt += 0.04;
    if (wAnimating) requestAnimationFrame(drawWaves);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SEISMOGRAPH CANVAS — sci-5
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const sc   = document.getElementById('seismo-canvas');
const sctx = sc ? sc.getContext('2d') : null;
let sgData = [];

function resizeSeismo() { if (sc) { sc.width = sc.offsetWidth; sc.height = sc.offsetHeight || 180; } }
if (sc) resizeSeismo();

function buildSeismoData(n) {
    const d = [];
    for (let i = 0; i < n; i++) {
        const t = i / n;
        const noise = () => (Math.random() - 0.5) * 2;
        let amp;
        if (t < 0.33)      amp = noise() * 3;
        else if (t < 0.42) amp = noise() * 18 * ((t - 0.33) / 0.09);
        else if (t < 0.58) amp = noise() * 110 * (1 - (t - 0.42) / 0.16 * 0.25);
        else               amp = noise() * 85 * Math.exp(-(t - 0.58) * 6);
        d.push(amp);
    }
    return d;
}
sgData = buildSeismoData(600);

function drawSeismo(prog) {
    if (!sctx) return;
    sctx.clearRect(0, 0, sc.width, sc.height);
    const W = sc.width, H = sc.height, mid = H / 2;

    // Grid
    sctx.strokeStyle = 'rgba(245,237,224,0.025)';
    sctx.lineWidth = 1;
    for (let y = 0; y < H; y += 20) { sctx.beginPath(); sctx.moveTo(0,y); sctx.lineTo(W,y); sctx.stroke(); }

    // Linea evento
    const ex = W * 0.42;
    sctx.setLineDash([5, 5]);
    sctx.strokeStyle = 'rgba(139,26,26,0.45)';
    sctx.lineWidth = 1;
    sctx.beginPath(); sctx.moveTo(ex,0); sctx.lineTo(ex,H); sctx.stroke();
    sctx.setLineDash([]);
    sctx.fillStyle = 'rgba(139,26,26,0.55)';
    sctx.font = '500 9px "JetBrains Mono"';
    sctx.fillText('03:32:39', ex + 5, 13);

    // Fasi P e S labels
    const px = W * 0.34, sx = W * 0.38;
    sctx.fillStyle = 'rgba(58,126,196,0.5)';
    sctx.fillText('P', px, H - 5);
    sctx.fillStyle = 'rgba(196,58,58,0.5)';
    sctx.fillText('S', sx, H - 5);

    // Waveform
    const count = Math.floor(sgData.length * prog);
    sctx.beginPath();
    for (let i = 0; i < count; i++) {
        const x = (i / sgData.length) * W;
        const y = mid + sgData[i];
        i === 0 ? sctx.moveTo(x,y) : sctx.lineTo(x,y);
    }
    const grad = sctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,    'rgba(245,237,224,0.15)');
    grad.addColorStop(0.33, 'rgba(58,126,196,0.6)');
    grad.addColorStop(0.40, 'rgba(245,237,224,0.35)');
    grad.addColorStop(0.44, 'rgba(196,97,42,0.95)');
    grad.addColorStop(0.58, 'rgba(139,26,26,0.85)');
    grad.addColorStop(1,    'rgba(245,237,224,0.25)');
    sctx.strokeStyle = grad;
    sctx.lineWidth = 1.5;
    sctx.stroke();
}
drawSeismo(1);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  EPICENTRO CANVAS — sci-6
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function drawEpicentroCanvas() {
    const ec   = document.getElementById('epicentro-canvas');
    if (!ec) return;
    const ectx = ec.getContext('2d');
    const W = ec.width, H = ec.height;

    // Stazioni (coordinate normalizzate 0-1 sullo spazio canvas)
    const stations = [
        { name: 'AQU',  nx: 0.46, ny: 0.52, d: 9,  color: 'rgba(58,126,196,' },
        { name: 'FIAM', nx: 0.28, ny: 0.22, d: 38, color: 'rgba(196,97,42,' },
        { name: 'AMAT', nx: 0.72, ny: 0.18, d: 61, color: 'rgba(139,26,26,' },
        { name: 'SUL',  nx: 0.74, ny: 0.72, d: 50, color: 'rgba(212,137,58,' },
    ];

    // Epicentro (circa al centro)
    const EX = 0.48 * W, EY = 0.46 * H;

    // Scale: pixels per km — usiamo la stazione più lontana (AMAT 61 km)
    // La stazione AMAT è a (0.72,0.18) → distanza pixel dall'epicentro
    const amat = stations[2];
    const dxPx = (amat.nx - 0.48) * W;
    const dyPx = (amat.ny - 0.46) * H;
    const distAMAT_px = Math.sqrt(dxPx*dxPx + dyPx*dyPx);
    const scale = distAMAT_px / amat.d; // px per km

    let animFrame = 0;
    const totalFrames = 90;

    function drawFrame() {
        ectx.clearRect(0, 0, W, H);

        // Sfondo
        ectx.fillStyle = '#050709';
        ectx.fillRect(0, 0, W, H);

        // Griglia leggera
        ectx.strokeStyle = 'rgba(58,126,196,0.04)';
        ectx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ectx.beginPath(); ectx.moveTo(x,0); ectx.lineTo(x,H); ectx.stroke(); }
        for (let y = 0; y < H; y += 40) { ectx.beginPath(); ectx.moveTo(0,y); ectx.lineTo(W,y); ectx.stroke(); }

        const progress = Math.min(animFrame / totalFrames, 1);
        const eased = 1 - Math.pow(1 - progress, 2);

        // Cerchi che crescono
        stations.forEach(st => {
            const sx = st.nx * W, sy = st.ny * H;
            const maxR = st.d * scale;
            const r = maxR * eased;

            // Cerchio principale
            ectx.beginPath();
            ectx.arc(sx, sy, r, 0, Math.PI * 2);
            ectx.strokeStyle = st.color + '0.5)';
            ectx.lineWidth = 1.5;
            ectx.setLineDash([4, 4]);
            ectx.stroke();
            ectx.setLineDash([]);

            // Area fill leggera
            ectx.beginPath();
            ectx.arc(sx, sy, r, 0, Math.PI * 2);
            ectx.fillStyle = st.color + '0.03)';
            ectx.fill();

            // Punto stazione
            ectx.beginPath();
            ectx.arc(sx, sy, 5, 0, Math.PI * 2);
            ectx.fillStyle = st.color + '0.9)';
            ectx.fill();

            // Label stazione
            ectx.fillStyle = 'rgba(245,237,224,0.55)';
            ectx.font = '500 10px "JetBrains Mono"';
            ectx.fillText(st.name, sx + 8, sy - 6);
        });

        // Epicentro — appare quando i cerchi si intersecano (~75% animazione)
        if (progress > 0.65) {
            const alpha = Math.min((progress - 0.65) / 0.35, 1);
            // Glow
            const grd = ectx.createRadialGradient(EX, EY, 0, EX, EY, 20);
            grd.addColorStop(0, `rgba(196,97,42,${0.4 * alpha})`);
            grd.addColorStop(1, 'transparent');
            ectx.beginPath();
            ectx.arc(EX, EY, 20, 0, Math.PI * 2);
            ectx.fillStyle = grd;
            ectx.fill();

            // Punto epicentro
            ectx.beginPath();
            ectx.arc(EX, EY, 6, 0, Math.PI * 2);
            ectx.fillStyle = `rgba(196,97,42,${alpha})`;
            ectx.fill();

            // Label
            ectx.fillStyle = `rgba(196,97,42,${alpha})`;
            ectx.font = '600 10px "JetBrains Mono"';
            ectx.fillText('EPICENTRO', EX + 10, EY + 4);
            ectx.fillStyle = `rgba(245,237,224,${alpha * 0.4})`;
            ectx.font = '9px "JetBrains Mono"';
            ectx.fillText('42.348°N · 13.380°E', EX + 10, EY + 16);
        }

        if (animFrame < totalFrames + 20) {
            animFrame++;
            requestAnimationFrame(drawFrame);
        }
    }
    drawFrame();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  COUNT-UP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function countUp(el) {
    const target = parseFloat(el.dataset.val);
    const dec    = parseInt(el.dataset.dec || '0');
    const dur    = 1400;
    const t0     = performance.now();
    (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        const v = target * e;
        el.textContent = dec > 0 ? v.toFixed(dec) : Math.floor(v).toLocaleString('it-IT');
        if (p < 1) requestAnimationFrame(tick);
    })(t0);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PER-SLIDE ENTRY ANIMATIONS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function onSlideEnter(i, el) {
    if (triggered.has(i)) { return; }
    triggered.add(i);

    if (i === 1) { // dati
        el.querySelectorAll('.stat-num[data-val]').forEach((n, j) =>
            setTimeout(() => countUp(n), j * 180));
    }
    // sezione 1 (SCIENCE_IDX): gestita dal proprio IIFE
    if (i === 3 && window._s2InitSlide0) window._s2InitSlide0(); // sezione 2 — mappa INGV
    if (i === 7) { // città (s-city ora all'indice 7, dopo l'aggiunta di s-section5)
        el.querySelectorAll('.damage-num[data-val]').forEach((n, j) =>
            setTimeout(() => countUp(n), 300 + j * 200));
    }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CAROSELLO ARTE - scorre a sinistra (row-reverse)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(function() {
  'use strict';
  var ART_TOTAL  = 6;
  var artTrack   = document.getElementById('art-track');
  var artDots    = document.querySelectorAll('.art-nav-dot');
  var artPrevBtn = document.getElementById('art-prev');
  var artNextBtn = document.getElementById('art-next');
  var curArt = 0;
  var artAnimating = false;

  function artTranslate(visual, animate) {
    var pos = ART_TOTAL - 1 - visual;
    if (!animate) { artTrack.style.transition = 'none'; }
    artTrack.style.transform = 'translateX(calc(' + pos + ' * -100vw))';
    if (!animate) { requestAnimationFrame(function(){ artTrack.style.transition = ''; }); }
  }

  function goArt(visual, animate) {
    if (visual < 0 || visual >= ART_TOTAL || artAnimating) return;
    artAnimating = true;
    curArt = visual;
    artTranslate(visual, animate !== false);
    artTrack.addEventListener('transitionend', function(){ artAnimating = false; }, { once: true });
    setTimeout(function(){ artAnimating = false; }, 800);
    artDots.forEach(function(d, i){ d.classList.toggle('active', i === visual); });
    if (artPrevBtn) artPrevBtn.disabled = visual === 0;
    if (artNextBtn) artNextBtn.disabled = visual === ART_TOTAL - 1;
    var artSlides = artTrack.querySelectorAll('.art-slide');
    var bar = artSlides[visual] ? artSlides[visual].querySelector('.art-sl-dmg-bar') : null;
    if (bar) {
      bar.style.width = '0%';
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        bar.style.width = (bar.dataset.dmg || '0') + '%';
      }); });
    }
  }

  artTranslate(0, false);
  artAnimating = false;

  var artSection = document.getElementById('s-art');
  artSection.addEventListener('wheel', function(e) {
    var goingDown = e.deltaY > 0;
    if (goingDown && curArt === ART_TOTAL - 1) return;
    if (!goingDown && curArt === 0) return;
    e.preventDefault(); e.stopPropagation();
    if (artAnimating) return;
    goArt(goingDown ? curArt + 1 : curArt - 1);
  }, { passive: false });

  var artTouchX = 0, artTouchY = 0;
  artSection.addEventListener('touchstart', function(e){ artTouchX = e.touches[0].clientX; artTouchY = e.touches[0].clientY; }, { passive: true });
  artSection.addEventListener('touchend', function(e) {
    if (artAnimating) return;
    var dx = e.changedTouches[0].clientX - artTouchX;
    var dy = e.changedTouches[0].clientY - artTouchY;
    if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 35) {
      goArt(dx < 0 ? curArt + 1 : curArt - 1);
    }
  }, { passive: true });

  if (artPrevBtn) artPrevBtn.addEventListener('click', function(){ goArt(curArt - 1); });
  if (artNextBtn) artNextBtn.addEventListener('click', function(){ goArt(curArt + 1); });
  artDots.forEach(function(d){ d.addEventListener('click', function(){ goArt(+d.dataset.ai); }); });

  document.addEventListener('keydown', function(e) {
    var rect = artSection.getBoundingClientRect();
    if (Math.abs(rect.top) > 50) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goArt(curArt + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goArt(curArt - 1); }
  });
})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CAROSELLO C.A.S.E.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(function() {
  'use strict';
  var CASE_TOTAL  = 5;
  var caseTrack   = document.getElementById('case-track');
  var caseDots    = document.querySelectorAll('.case-nav-dot');
  var casePrevBtn = document.getElementById('case-prev');
  var caseNextBtn = document.getElementById('case-next');
  var curCase = 0;
  var caseAnimating = false;

  function goCase(idx, animate) {
    if (idx < 0 || idx >= CASE_TOTAL || caseAnimating) return;
    caseAnimating = true;
    curCase = idx;
    if (animate === false) {
      caseTrack.style.transition = 'none';
      caseTrack.style.transform = 'translateX(calc(' + idx + ' * -100vw))';
      requestAnimationFrame(function(){ caseTrack.style.transition = ''; caseAnimating = false; });
    } else {
      caseTrack.style.transform = 'translateX(calc(' + idx + ' * -100vw))';
      caseTrack.addEventListener('transitionend', function(){ caseAnimating = false; }, { once: true });
      setTimeout(function(){ caseAnimating = false; }, 800);
    }
    caseDots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
    if (casePrevBtn) casePrevBtn.disabled = idx === 0;
    if (caseNextBtn) caseNextBtn.disabled = idx === CASE_TOTAL - 1;
  }

  goCase(0, false);

  var caseSection = document.getElementById('s-rebuild');
  caseSection.addEventListener('wheel', function(e) {
    var goingDown = e.deltaY > 0;
    if (goingDown && curCase === CASE_TOTAL - 1) return;  // ultima card → slide successiva
    if (!goingDown && curCase === 0) return;               // prima card → slide precedente
    e.preventDefault(); e.stopPropagation();
    if (caseAnimating) return;
    goCase(goingDown ? curCase + 1 : curCase - 1);
  }, { passive: false });

  var caseTouchX = 0, caseTouchY = 0;
  caseSection.addEventListener('touchstart', function(e){ caseTouchX = e.touches[0].clientX; caseTouchY = e.touches[0].clientY; }, { passive: true });
  caseSection.addEventListener('touchend', function(e) {
    if (caseAnimating) return;
    var dx = e.changedTouches[0].clientX - caseTouchX;
    var dy = e.changedTouches[0].clientY - caseTouchY;
    if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 35) {
      goCase(dx < 0 ? curCase + 1 : curCase - 1);
    }
  }, { passive: true });

  if (casePrevBtn) casePrevBtn.addEventListener('click', function(){ goCase(curCase - 1); });
  if (caseNextBtn) caseNextBtn.addEventListener('click', function(){ goCase(curCase + 1); });
  caseDots.forEach(function(d){ d.addEventListener('click', function(){ goCase(+d.dataset.ci); }); });

  document.addEventListener('keydown', function(e) {
    var rect = caseSection.getBoundingClientRect();
    if (Math.abs(rect.top) > 50) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goCase(curCase + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goCase(curCase - 1); }
  });
})();


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  RIBALTAMENTO CANVAS — onde + pareti esterne
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(function() {
  'use strict';
  var canvas = document.getElementById('ribalt-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var t = 0;
  var CYCLE = 320; // frames per ciclo

  function ease(x) {
    return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2) / 2;
  }

  function drawWaves(phase, amp) {
    var layers = [
      { y0: H-30, f: 0.038, a: 1.00, alpha: 0.70, lw: 1.6 },
      { y0: H-18, f: 0.058, a: 0.60, alpha: 0.40, lw: 1.1 },
      { y0: H- 7, f: 0.024, a: 0.35, alpha: 0.22, lw: 0.8 }
    ];
    layers.forEach(function(l) {
      ctx.beginPath();
      for (var x = 0; x <= W; x++) {
        var y = l.y0
          + Math.sin(x * l.f + phase)           * amp * l.a
          + Math.sin(x * l.f * 1.8 + phase*1.4) * amp * l.a * 0.35;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(196,97,42,' + l.alpha + ')';
      ctx.lineWidth   = l.lw;
      ctx.stroke();
    });
  }

  function drawWall(pivX, pivY, wallH, wallW, angle, side) {
    ctx.save();
    ctx.translate(pivX, pivY);
    ctx.rotate(angle);

    var x0 = side === 'L' ? -wallW : 0;

    // Corpo
    ctx.fillStyle   = 'rgba(196,97,42,0.10)';
    ctx.strokeStyle = 'rgba(196,97,42,0.80)';
    ctx.lineWidth   = 1.6;
    ctx.fillRect(x0, -wallH, wallW, wallH);
    ctx.strokeRect(x0, -wallH, wallW, wallH);

    // Giunti orizzontali (corsi di mattoni)
    ctx.lineWidth = 0.5;
    for (var hy = 11; hy < wallH; hy += 11) {
      ctx.strokeStyle = 'rgba(196,97,42,0.28)';
      ctx.beginPath();
      ctx.moveTo(x0,       -wallH + hy);
      ctx.lineTo(x0+wallW, -wallH + hy);
      ctx.stroke();
    }
    // Giunti verticali alternati
    for (var hy2 = 0; hy2 < wallH; hy2 += 11) {
      var off = (Math.floor(hy2/11) % 2) ? wallW*0.5 : wallW*0.33;
      ctx.strokeStyle = 'rgba(196,97,42,0.20)';
      ctx.beginPath();
      ctx.moveTo(x0 + off, -wallH + hy2);
      ctx.lineTo(x0 + off, -wallH + hy2 + 11);
      ctx.stroke();
    }

    ctx.restore();
  }

  function arrow(x1, y1, x2, y2, alpha) {
    var dx = x2-x1, dy = y2-y1;
    var ang = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(196,97,42,' + alpha + ')';
    ctx.lineWidth   = 1.4;
    ctx.stroke();
    var s = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s*Math.cos(ang-0.42), y2 - s*Math.sin(ang-0.42));
    ctx.lineTo(x2 - s*Math.cos(ang+0.42), y2 - s*Math.sin(ang+0.42));
    ctx.closePath();
    ctx.fillStyle = 'rgba(196,97,42,' + alpha + ')';
    ctx.fill();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    var p = (t % CYCLE) / CYCLE;           // 0 → 1

    // Ampiezza onde: cresce, picco, poi cala
    var wAmp;
    if      (p < 0.12) wAmp = 2 + p/0.12 * 7;
    else if (p < 0.38) wAmp = 9 + (p-0.12)/0.26 * 12;
    else if (p < 0.72) wAmp = 21;
    else                wAmp = 21 * (1-(p-0.72)/0.28);

    // Angolo di ribaltamento: 0 → ~75° → reset
    var tilt;
    if      (p < 0.28) tilt = 0;
    else if (p < 0.68) tilt = ease((p-0.28)/0.40) * 1.28;
    else if (p < 0.84) tilt = 1.28;
    else                tilt = 1.28 * (1-(p-0.84)/0.16);

    var wPhase = t * 0.09;
    var cx     = W / 2;
    var baseY  = H - 38;
    var wallH  = 82;
    var wallW  = 17;
    var span   = 50;   // semidistanza tra i pilastri

    // ── terreno ──────────────────────────────
    ctx.beginPath();
    ctx.moveTo(0, baseY+2); ctx.lineTo(W, baseY+2);
    ctx.strokeStyle = 'rgba(196,97,42,0.25)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ── onde sotterranee (sotto il terreno) ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, baseY+2, W, H - baseY - 2);
    ctx.clip();
    drawWaves(wPhase, wAmp);
    ctx.restore();

    // ── onde in superficie (propagazione leggera) ──
    ctx.save();
    ctx.globalAlpha = Math.min(0.22, wAmp * 0.010);
    ctx.beginPath(); ctx.rect(0, 0, W, baseY+2); ctx.clip();
    drawWaves(wPhase + 0.5, wAmp * 0.3);
    ctx.restore();

    // ── parete sinistra (pivot cx-span, ruota a sinistra) ──
    drawWall(cx - span, baseY, wallH, wallW, -tilt, 'L');

    // ── parete destra (pivot cx+span, ruota a destra) ──
    drawWall(cx + span, baseY, wallH, wallW, tilt, 'R');

    // ── arco/volta che collega le pareti (decade con il crollo) ──
    if (tilt < 1.15) {
      var archFade = Math.max(0, 0.75 - tilt * 0.55);
      var drop     = tilt * 18;
      var lAX = cx - span + Math.sin(tilt) * wallH * 0.08;
      var lAY = baseY - wallH * Math.cos(tilt) + drop;
      var rAX = cx + span - Math.sin(tilt) * wallH * 0.08;
      var rAY = baseY - wallH * Math.cos(tilt) + drop;
      ctx.beginPath();
      ctx.moveTo(lAX, lAY);
      ctx.quadraticCurveTo(cx, lAY - 24 + tilt*18, rAX, rAY);
      ctx.strokeStyle = 'rgba(196,97,42,' + archFade + ')';
      ctx.lineWidth   = 1.6;
      ctx.stroke();

      // cornice base arco (linee orizzontali sulle pareti)
      ctx.beginPath();
      ctx.moveTo(lAX - wallW*Math.cos(-tilt), lAY - wallW*Math.sin(-tilt));
      ctx.lineTo(lAX, lAY);
      ctx.strokeStyle = 'rgba(196,97,42,' + archFade*0.5 + ')';
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    // ── frecce di forza verso l'esterno ──────
    if (tilt > 0.05) {
      var aAlpha = Math.min(0.85, tilt * 1.4);
      var aLen   = 16 + tilt * 14;

      // Calcola punto mediano parete sinistra dopo rotazione
      var lMX = (cx - span) - Math.sin(tilt) * wallH * 0.5;
      var lMY = baseY       - Math.cos(tilt) * wallH * 0.5;
      // Direzione perpendicolare outward per parete sinistra
      var lDX = -Math.cos(tilt), lDY = -Math.sin(tilt);
      arrow(lMX, lMY, lMX + lDX*aLen, lMY + lDY*aLen, aAlpha);

      // Parete destra
      var rMX = (cx + span) + Math.sin(tilt) * wallH * 0.5;
      var rMY = baseY       - Math.cos(tilt) * wallH * 0.5;
      var rDX =  Math.cos(tilt), rDY = -Math.sin(tilt);
      arrow(rMX, rMY, rMX + rDX*aLen, rMY + rDY*aLen, aAlpha);
    }

    // ── etichetta testuale (appare solo durante il crollo) ──
    if (tilt > 0.25 && tilt < 1.20) {
      var tAlpha = Math.min(0.5, (tilt-0.25)*1.2);
      ctx.fillStyle = 'rgba(196,97,42,' + tAlpha + ')';
      ctx.font      = '500 8px "JetBrains Mono", monospace';
      ctx.letterSpacing = '0.12em';
      ctx.textAlign = 'center';
      ctx.fillText('FUORI DAL PIANO', cx, baseY + 22);
    }

    t++;
    requestAnimationFrame(loop);
  }

  loop();
})();


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CAZZUOLA — restauro conservativo
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(function() {
  'use strict';
  var canvas = document.getElementById('cazzuola-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  var TC = 'rgba(196,97,42,';   // terracotta
  var MT = 'rgba(210,178,135,'; // malta / mortar
  var CR = 'rgba(245,237,224,'; // cream / trowel

  // Mattoni
  var BW = 30, BH = 11, JH = 4, JV = 3;
  var COLS = 7, ROWS = 4;
  var padX = 6, padY = 10;
  var rowStride = BH + JH;
  var totalW = COLS * (BW + JV);

  // Stato malta: progress 0..1 per ogni giunto orizzontale [0..ROWS-2]
  var mortarPct = [0, 0, 0];

  var trowelX = -35;
  var curJoint = 0; // quale giunto sta riempiendo (0 = tra riga 0 e 1, etc.)
  var paused = 0;
  var SPEED = 1.3;

  function rowY(r) { return padY + r * rowStride; }
  function brickX(c, r) { return padX + c*(BW+JV) + (r%2 ? (BW+JV)/2 : 0); }

  /* ── mattoni ── */
  function drawBricks() {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var bx = brickX(c, r), by = rowY(r);
        if (bx + BW < 0 || bx > W) continue;
        ctx.fillStyle   = TC + '0.11)';
        ctx.strokeStyle = TC + '0.48)';
        ctx.lineWidth   = 0.8;
        ctx.fillRect(bx, by, BW, BH);
        ctx.strokeRect(bx, by, BW, BH);
      }
      // mezzi mattoni bordo (sfalsamento)
      if (r % 2 === 1) {
        ctx.fillStyle   = TC + '0.11)';
        ctx.strokeStyle = TC + '0.48)';
        ctx.lineWidth   = 0.8;
        var hbw = (BW + JV)/2 - JV;
        if (hbw > 0) {
          ctx.fillRect(padX, rowY(r), hbw, BH);
          ctx.strokeRect(padX, rowY(r), hbw, BH);
          ctx.fillRect(padX + totalW - hbw, rowY(r), hbw, BH);
          ctx.strokeRect(padX + totalW - hbw, rowY(r), hbw, BH);
        }
      }
    }
  }

  /* ── malta nei giunti ── */
  function drawMortar() {
    for (var j = 0; j < ROWS - 1; j++) {
      if (mortarPct[j] <= 0) continue;
      var jy = rowY(j) + BH;
      var fw = totalW * mortarPct[j];
      // gradiente: pieno → sfumato alla punta
      var g = ctx.createLinearGradient(padX, 0, padX + fw, 0);
      g.addColorStop(0,    MT + '0.60)');
      g.addColorStop(0.88, MT + '0.50)');
      g.addColorStop(1,    MT + '0.00)');
      ctx.fillStyle = g;
      ctx.fillRect(padX, jy, fw, JH);
    }
  }

  /* ── cazzuola ── */
  function drawTrowel(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.32);

    /* lama — forma a punta di diamante piatta */
    var bL = 40, bHH = 9;
    ctx.beginPath();
    ctx.moveTo(-6,       bHH * 0.45);   // tallone sx-basso
    ctx.lineTo(-6,      -bHH * 0.45);   // tallone sx-alto
    ctx.lineTo( bL*0.55,-bHH * 0.70);   // spalla dx-alto
    ctx.lineTo( bL,       0);             // punta
    ctx.lineTo( bL*0.55, bHH * 0.70);   // spalla dx-basso
    ctx.closePath();
    ctx.fillStyle   = CR + '0.13)';
    ctx.strokeStyle = CR + '0.82)';
    ctx.lineWidth   = 1.3;
    ctx.fill();
    ctx.stroke();

    /* malta sulla lama (blob che si stende) */
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(bL * 0.40, bHH * 0.05, 13, 4, 0, 0, Math.PI*2);
    ctx.fillStyle = MT + '0.55)';
    ctx.fill();
    ctx.restore();

    /* manico */
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // asta
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-46, 6);
    ctx.strokeStyle = CR + '0.55)';
    ctx.lineWidth   = 5;
    ctx.stroke();
    ctx.strokeStyle = TC + '0.30)';
    ctx.lineWidth   = 2;
    ctx.stroke();
    // impugnatura ovale
    ctx.beginPath();
    ctx.ellipse(-46, 6, 5, 3.5, 0.18, 0, Math.PI*2);
    ctx.fillStyle   = CR + '0.22)';
    ctx.strokeStyle = CR + '0.60)';
    ctx.lineWidth   = 1;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /* ── loop ── */
  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawBricks();
    drawMortar();

    if (paused > 0) {
      paused--;
      if (paused === 0) {
        // reset
        curJoint = 0;
        trowelX  = -35;
        for (var i = 0; i < mortarPct.length; i++) mortarPct[i] = 0;
      }
      requestAnimationFrame(loop);
      return;
    }

    if (curJoint < ROWS - 1) {
      trowelX += SPEED;

      // Riempi malta proporzionalmente all'avanzamento della punta
      var tip = trowelX;
      mortarPct[curJoint] = Math.min(1, Math.max(0, (tip - padX + 10) / totalW));

      var ty = rowY(curJoint) + BH + JH * 0.5;
      if (trowelX < W + 55) drawTrowel(trowelX, ty);

      if (trowelX > W + 38) {
        curJoint++;
        trowelX = -35;
        if (curJoint >= ROWS - 1) paused = 95; // ~1.6s pausa prima del reset
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
})();

/* resizeWave e resizeSeismo rimossi insieme al vecchio carousel scientifico */
window.addEventListener('resize', () => { resizeHero(); });


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  SMOKE BACKGROUND — #s-end (WebGL2)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
(function() {
  'use strict';

  var canvas = document.getElementById('end-smoke');
  if (!canvas) return;
  var gl = canvas.getContext('webgl2');
  if (!gl) return;

  // ── Shaders ──────────────────────────────
  var vertSrc = [
    '#version 300 es',
    'precision highp float;',
    'in vec4 position;',
    'void main(){ gl_Position = position; }'
  ].join('\n');

  var fragSrc = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 O;',
    'uniform float time;',
    'uniform vec2 resolution;',
    'uniform vec3 u_color;',
    '#define FC gl_FragCoord.xy',
    '#define R resolution',
    '#define T (time+660.)',
    'float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}',
    'float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}',
    'void main(){',
    '  vec2 uv=(FC-.5*R)/R.y;',
    '  vec3 col=vec3(1);',
    '  uv.x+=.25;',
    '  uv*=vec2(2,1);',
    '  float n=fbm(uv*.28-vec2(T*.01,0));',
    '  n=noise(uv*3.+n*2.);',
    '  col.r-=fbm(uv+vec2(0,T*.015)+n);',
    '  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);',
    '  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);',
    '  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));',
    '  col=mix(vec3(.08),col,min(time*.1,1.));',
    '  col=clamp(col,.08,1.);',
    '  O=vec4(col,1);',
    '}'
  ].join('\n');

  // ── Compile helper ────────────────────────
  function compileShader(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      console.error('Shader error:', gl.getShaderInfoLog(sh));
    return sh;
  }

  var vs  = compileShader(gl.VERTEX_SHADER,   vertSrc);
  var fs  = compileShader(gl.FRAGMENT_SHADER, fragSrc);
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    console.error('Program link error:', gl.getProgramInfoLog(prog));

  // ── Geometry (full-screen quad) ───────────
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ── Uniform locations ─────────────────────
  var uRes   = gl.getUniformLocation(prog, 'resolution');
  var uTime  = gl.getUniformLocation(prog, 'time');
  var uColor = gl.getUniformLocation(prog, 'u_color');

  // Terracotta #C4612A → [0.769, 0.380, 0.165]
  var smokeColor = new Float32Array([0.769, 0.380, 0.165]);

  // ── Resize ────────────────────────────────
  function resize() {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var section = document.getElementById('s-end');
    var w = section.offsetWidth  || window.innerWidth;
    var h = section.offsetHeight || window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Animation — only runs when slide is visible ──
  var rafId = null;
  var startTime = null;
  var running = false;

  function render(now) {
    if (!running) return;
    if (startTime === null) startTime = now;
    var elapsed = (now - startTime) * 1e-3;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed);
    gl.uniform3fv(uColor, smokeColor);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    rafId = requestAnimationFrame(render);
  }

  // Gated by IntersectionObserver (same pattern as other canvases in this file)
  var section = document.getElementById('s-end');
  new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        if (!running) { running = true; rafId = requestAnimationFrame(render); }
      } else {
        running = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });
  }, { threshold: 0.1 }).observe(section);

})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  THREE.JS FAULT ANIMATION — rimosso (sostituito da IIFE sezione1)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
