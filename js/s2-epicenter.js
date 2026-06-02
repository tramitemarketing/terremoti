(function () {
  'use strict';

  /* ── Costanti ── */
  const TOTAL_SLIDES = 4;
  const s2Triggered  = new Set();
  let s2CurrentIdx   = 0;
  let s2IsAnimating  = false;

  /* ── Elementi DOM ── */
  const s2Section = document.getElementById('s-section2');
  const s2Track   = document.getElementById('s2-track');
  const s2Dots    = document.querySelectorAll('.s2-dot');
  const s2Prev    = document.getElementById('s2-prev');
  const s2Next    = document.getElementById('s2-next');
  const s2Counter = document.getElementById('s2-counter');

  /* ── Navigazione principale ── */
  function s2GoTo(idx, animate) {
    if (idx < 0 || idx >= TOTAL_SLIDES) return;
    s2IsAnimating = true;
    if (animate === false) {
      s2Track.style.transition = 'none';
      s2Track.style.transform  = `translateX(calc(${idx} * -100vw))`;
      requestAnimationFrame(() => {
        s2Track.style.transition = '';
        s2IsAnimating = false;
      });
    } else {
      s2Track.style.transform = `translateX(calc(${idx} * -100vw))`;
      s2Track.addEventListener('transitionend', () => { s2IsAnimating = false; }, { once: true });
      setTimeout(() => { s2IsAnimating = false; }, 700); /* safety */
    }
    s2CurrentIdx = idx;
    s2Dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (s2Counter) s2Counter.textContent = String(idx + 1).padStart(2, '0') + ' · ' + String(TOTAL_SLIDES).padStart(2, '0');
    if (s2Prev) s2Prev.disabled = idx === 0;
    if (s2Next) s2Next.disabled = idx === TOTAL_SLIDES - 1;
    s2OnSlideEnter(idx);
  }

  /* ── Entry animations (guarded by Set) ── */
  function s2OnSlideEnter(idx) {
    if (s2Triggered.has(idx)) return;
    s2Triggered.add(idx);
    if (idx === 0) { s2InitMap(); s2FetchINGV(); s2AnimateDepthBar(); }
    if (idx === 1) { s2InitHypocenterCanvas(); }
    if (idx === 2) { s2InitDepthSlider(); }
  }

  /* ── Wheel intercept ── */
  s2Section.addEventListener('wheel', function onWheel(e) {
    s2EnsureSlide0Init(); /* garantisce init anche se IntersectionObserver non scatta */
    const goDown = e.deltaY > 0;
    const goUp   = e.deltaY < 0;
    if (goDown && s2CurrentIdx === TOTAL_SLIDES - 1) return; /* rilascia scroll verticale */
    if (goUp   && s2CurrentIdx === 0)                return; /* rilascia scroll verticale */
    e.preventDefault();
    e.stopPropagation();
    if (s2IsAnimating) return;
    s2GoTo(goDown ? s2CurrentIdx + 1 : s2CurrentIdx - 1);
  }, { passive: false });

  /* ── Touch ── */
  let s2TouchX = 0;
  s2Section.addEventListener('touchstart', e => { s2TouchX = e.touches[0].clientX; }, { passive: true });
  s2Section.addEventListener('touchend', e => {
    if (s2IsAnimating) return;
    const dx = e.changedTouches[0].clientX - s2TouchX;
    if (dx < -50) s2GoTo(s2CurrentIdx + 1);
    else if (dx > 50) s2GoTo(s2CurrentIdx - 1);
  });

  /* ── Frecce e dots ── */
  if (s2Prev) s2Prev.addEventListener('click', () => s2GoTo(s2CurrentIdx - 1));
  if (s2Next) s2Next.addEventListener('click', () => s2GoTo(s2CurrentIdx + 1));
  s2Dots.forEach((d, i) => d.addEventListener('click', () => s2GoTo(i)));

  /* ── Keyboard (solo se la sezione è in viewport) ── */
  document.addEventListener('keydown', e => {
    const rect = s2Section.getBoundingClientRect();
    if (Math.abs(rect.top) > 50) return;
    if (e.key === 'ArrowRight' && s2CurrentIdx < TOTAL_SLIDES - 1) { e.preventDefault(); s2GoTo(s2CurrentIdx + 1); }
    else if (e.key === 'ArrowLeft' && s2CurrentIdx > 0) { e.preventDefault(); s2GoTo(s2CurrentIdx - 1); }
  });

  /* ── Inizializza posizione carosello (senza caricare dati) ──
     NON chiamare s2GoTo(0, false) qui: Leaflet non è ancora caricato
     (il <script src="leaflet.js"> viene dopo nel DOM). s2InitMap()
     chiamerebbe L.map() prima che L esista → crash e TDZ sull'intera IIFE.
     La mappa viene inizializzata lazily via IntersectionObserver. ── */
  s2Track.style.transition = 'none';
  s2Track.style.transform  = 'translateX(0)';
  requestAnimationFrame(() => { s2Track.style.transition = ''; });
  s2Dots.forEach((d, i) => d.classList.toggle('active', i === 0));
  if (s2Counter) s2Counter.textContent = '01 · 04';
  if (s2Prev) s2Prev.disabled = true;

  /* Carica dati slide 0 quando sezione entra in vista (Leaflet caricato).
     Threshold 0.1 è sufficiente: con scroll-snap la sezione diventa 100% visibile.
     Belt-and-suspenders: anche il primo evento wheel/touch/key forza l'init. */
  new IntersectionObserver(function(entries, obs) {
    if (entries[0].isIntersecting) {
      obs.disconnect();
      s2OnSlideEnter(0);
    }
  }, { threshold: 0.1 }).observe(s2Section);

  function s2EnsureSlide0Init() { if (!s2Triggered.has(0)) s2OnSlideEnter(0); }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     MAPPA LEAFLET
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  let s2Map     = null;
  let s2Markers = []; /* array parallelo a s2Events */

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     DATI INGV
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  /* Fallback: sciame del 6 aprile 2009, ordinato dal più recente */
  const S2_FALLBACK = [
    { id:'1',  time:'2009-04-06T23:58:12', lat:42.4000, lon:13.4820, depth:11.4, magType:'Ml', mag:2.5,  location:'Montereale (AQ)' },
    { id:'2',  time:'2009-04-06T22:55:30', lat:42.3690, lon:13.3710, depth:7.8,  magType:'Ml', mag:4.0,  location:'Aquila' },
    { id:'3',  time:'2009-04-06T21:47:18', lat:42.3870, lon:13.4600, depth:9.9,  magType:'Ml', mag:2.0,  location:'Aquila' },
    { id:'4',  time:'2009-04-06T20:18:45', lat:42.3940, lon:13.4710, depth:10.8, magType:'Ml', mag:2.7,  location:'Pizzoli (AQ)' },
    { id:'5',  time:'2009-04-06T18:44:30', lat:42.3750, lon:13.4470, depth:9.7,  magType:'Ml', mag:2.3,  location:'Aquila' },
    { id:'6',  time:'2009-04-06T17:20:55', lat:42.4140, lon:13.4900, depth:12.1, magType:'Ml', mag:3.2,  location:'Montereale (AQ)' },
    { id:'7',  time:'2009-04-06T15:54:07', lat:42.3820, lon:13.4580, depth:9.5,  magType:'Ml', mag:2.1,  location:'Barete (AQ)' },
    { id:'8',  time:'2009-04-06T14:33:18', lat:42.3910, lon:13.4650, depth:10.0, magType:'Ml', mag:2.4,  location:'Aquila' },
    { id:'9',  time:'2009-04-06T13:02:44', lat:42.3680, lon:13.3920, depth:8.6,  magType:'Ml', mag:2.6,  location:'Aquila' },
    { id:'10', time:'2009-04-06T12:15:30', lat:42.4030, lon:13.4870, depth:11.8, magType:'Ml', mag:3.0,  location:'Montereale (AQ)' },
    { id:'11', time:'2009-04-06T11:45:02', lat:42.3760, lon:13.4430, depth:10.3, magType:'Ml', mag:2.2,  location:'Aquila' },
    { id:'12', time:'2009-04-06T11:23:50', lat:42.3920, lon:13.4810, depth:9.8,  magType:'Ml', mag:2.8,  location:'Pizzoli (AQ)' },
    { id:'13', time:'2009-04-06T10:48:37', lat:42.3850, lon:13.4730, depth:10.5, magType:'Ml', mag:3.5,  location:'Aquila' },
    { id:'14', time:'2009-04-06T09:26:28', lat:42.3590, lon:13.3680, depth:7.3,  magType:'Ml', mag:5.0,  location:'Aquila' },
    { id:'15', time:'2009-04-06T07:17:11', lat:42.4010, lon:13.4800, depth:11.2, magType:'Ml', mag:3.1,  location:'Aquila' },
    { id:'16', time:'2009-04-06T06:37:00', lat:42.3760, lon:13.4540, depth:10.1, magType:'Ml', mag:3.3,  location:'Aquila' },
    { id:'17', time:'2009-04-06T06:22:40', lat:42.3840, lon:13.4620, depth:8.9,  magType:'Ml', mag:4.2,  location:'Aquila' },
    { id:'18', time:'2009-04-06T05:09:59', lat:42.3700, lon:13.4490, depth:9.7,  magType:'Ml', mag:3.8,  location:'Aquila' },
    { id:'19', time:'2009-04-06T04:47:33', lat:42.3860, lon:13.4630, depth:10.2, magType:'Ml', mag:4.9,  location:'Aquila' },
    { id:'20', time:'2009-04-06T03:32:39', lat:42.3476, lon:13.3800, depth:8.8,  magType:'Mw', mag:6.3,  location:'Aquila' },
  ];

  let s2Events = []; /* array globale degli eventi correnti */

  /* Colore punto per magnitudo */
  function s2MagColor(mag) {
    if (mag < 2.0) return 'rgba(100,180,100,0.7)';
    if (mag < 3.5) return 'rgba(212,137,58,0.8)';
    if (mag < 5.0) return 'rgba(196,97,42,0.9)';
    return 'rgba(139,26,26,1.0)';
  }

  /* Raggio marker per profondità (profondo = piccolo) */
  function s2DepthRadius(depth) {
    /* più profondo → cerchio più grande (scuotimento diffuso su area più larga) */
    if (depth >= 70)  return 18;
    if (depth >= 30)  return 13;
    if (depth >= 10)  return 9;
    return 6;
  }

  /* Formatta ISO in "HH:MM" UTC */
  function s2FormatTime(isoStr) {
    try {
      const d = new Date(isoStr.replace(' ', 'T'));
      return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    } catch (_) { return '--:--'; }
  }

  /* Formatta ISO in "GG/MM/AAAA HH:MM:SS UTC" */
  function s2FormatDateTime(isoStr) {
    try {
      const d = new Date(isoStr.replace(' ', 'T'));
      return d.toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'
      }) + ' UTC';
    } catch (_) { return isoStr; }
  }

  /* Haversine: distanza in km tra due coordinate */
  function s2Haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* Parse testo INGV pipe-separated */
  function s2ParseINGV(text) {
    return text.trim().split('\n').slice(1).map(line => {
      const c = line.split('|');
      if (c.length < 13) return null;
      const ev = {
        id: c[0].trim(), time: c[1].trim(),
        lat: parseFloat(c[2]), lon: parseFloat(c[3]),
        depth: parseFloat(c[4]),
        magType: c[9].trim(), mag: parseFloat(c[10]),
        location: c[12].trim(),
      };
      return (!isNaN(ev.lat) && !isNaN(ev.mag)) ? ev : null;
    }).filter(Boolean);
  }

  /* Renderizza la lista eventi nel pannello sinistro */
  function s2RenderList(events) {
    const list = document.getElementById('s2-event-list');
    list.innerHTML = '';
    if (!events.length) {
      list.innerHTML = '<div class="s2-list-fallback">Nessun dato disponibile.</div>';
      return;
    }
    events.forEach((ev, i) => {
      const row = document.createElement('div');
      row.className = 's2-event-row';
      row.dataset.idx = i;
      row.innerHTML = `
        <span class="s2-event-time">${s2FormatTime(ev.time)}</span>
        <span class="s2-event-dot" style="background:${s2MagColor(ev.mag)}"></span>
        <div class="s2-event-body">
          <div class="s2-event-loc">${ev.location.substring(0, 20)}</div>
          <div class="s2-event-depth">M ${ev.mag.toFixed(1)}</div>
        </div>
        <span class="s2-event-mag">↓ ${ev.depth} km</span>`;
      row.addEventListener('mouseenter', () => s2SelectEvent(i));
      row.addEventListener('mouseleave', s2DeselectEvent);
      list.appendChild(row);
    });
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     Hover sync, info panel, depth bar — Task 5
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  function s2SelectEvent(idx) {
    const ev = s2Events[idx];
    if (!ev) return;

    /* 1. Highlight list row */
    document.querySelectorAll('.s2-event-row').forEach((row, i) => {
      row.classList.toggle('s2-event-row--active', i === idx);
    });

    /* 2. Highlight map marker */
    s2Markers.forEach((m, i) => {
      if (i === idx) {
        m.setStyle({ fillColor: '#F5EDE0', fillOpacity: 1, radius: s2DepthRadius(ev.depth) + 4 });
      } else {
        m.setStyle({ fillColor: '#C4612A', fillOpacity: 0.75, radius: s2DepthRadius(s2Events[i].depth) });
      }
    });

    /* 3. Populate and show info panel */
    const placeholder = document.getElementById('s2-info-placeholder');
    const grid        = document.getElementById('s2-info-grid');
    if (!grid) return;

    const place = ev.location.length > 30
      ? ev.location.substring(0, 30) + '…'
      : ev.location;

    grid.innerHTML = `
      <div class="s2-info-cell">
        <span class="s2-info-key s2-info-key--hypo">IPOCENTRO</span>
        <span class="s2-info-val s2-info-val--hypo">${ev.depth} km</span>
      </div>
      <div class="s2-info-cell">
        <span class="s2-info-key s2-info-key--epi">EPICENTRO</span>
        <span class="s2-info-val s2-info-val--epi">${ev.lat.toFixed(4)}°N · ${ev.lon.toFixed(4)}°E</span>
      </div>
      <div class="s2-info-cell">
        <span class="s2-info-key">DISTANZA DA L'AQUILA</span>
        <span class="s2-info-val">~${Math.round(s2Haversine(ev.lat, ev.lon, 42.3476, 13.3800))} km</span>
      </div>
      <div class="s2-info-cell">
        <span class="s2-info-key">MAGNITUDO</span>
        <span class="s2-info-val">M ${ev.mag.toFixed(1)}</span>
      </div>
      <div class="s2-info-cell">
        <span class="s2-info-key">LUOGO</span>
        <span class="s2-info-val">${place}</span>
      </div>`;

    if (placeholder) placeholder.style.display = 'none';
    grid.style.display = '';
  }

  function s2DeselectEvent() {
    /* 1. Remove active class from all rows */
    document.querySelectorAll('.s2-event-row').forEach(row => {
      row.classList.remove('s2-event-row--active');
    });

    /* 2. Reset all markers to default style */
    s2Markers.forEach((m, i) => {
      m.setStyle({ fillColor: '#C4612A', fillOpacity: 0.75, radius: s2DepthRadius(s2Events[i].depth) });
    });

    /* 3. Hide info grid, show placeholder */
    const placeholder = document.getElementById('s2-info-placeholder');
    const grid        = document.getElementById('s2-info-grid');
    if (grid)        grid.style.display = 'none';
    if (placeholder) placeholder.style.display = '';
  }

  function s2AddMarkersToMap(events) {
    if (!s2Map) return;
    /* Rimuovi vecchi marker eventi */
    s2Markers.forEach(m => m.remove());
    s2Markers = [];

    events.forEach((ev, i) => {
      const circle = L.circleMarker([ev.lat, ev.lon], {
        radius:      s2DepthRadius(ev.depth),
        fillColor:   '#C4612A',
        fillOpacity: 0.75,
        color:       'transparent',
        weight:      0,
      });
      circle.on('mouseover', () => s2SelectEvent(i));
      circle.on('mouseout',  s2DeselectEvent);
      circle.addTo(s2Map);
      s2Markers.push(circle);
    });
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     Funzioni lazy — implementate nei task 3–7
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  function s2FetchINGV() {
    const now   = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fmt   = d => d.toISOString().replace(/\.\d{3}Z$/, '');
    const url   = `https://webservices.ingv.it/fdsnws/event/1/query?format=text&minmag=1.5&starttime=${fmt(start)}&endtime=${fmt(now)}&orderby=time&limit=50`;

    fetch(url)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(text => {
        const events = s2ParseINGV(text);
        s2Events = events.length ? events : S2_FALLBACK;
        s2RenderList(s2Events);
        s2AddMarkersToMap(s2Events); /* Task 4 — stub sicuro */
      })
      .catch(() => {
        s2Events = S2_FALLBACK;
        s2RenderList(s2Events);
        s2AddMarkersToMap(s2Events); /* Task 4 — stub sicuro */
      });
  }
  function s2InitMap() {
    if (s2Map) return;
    s2Map = L.map('s2-map', {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(s2Map);
    s2Map.fitBounds([[35.0, 6.0], [47.5, 19.0]]);
    setTimeout(() => { if (s2Map) s2Map.invalidateSize(); }, 150);

    /* Marker speciale L'Aquila 2009 — stella pulsante (non interattiva) */
    const aqIcon = L.divIcon({
      className: '',
      html: '<div class="s2-aquila-star"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([42.3476, 13.3800], { icon: aqIcon, interactive: false }).addTo(s2Map);
  }
  function s2AnimateDepthBar() {
    const bar = document.getElementById('s2-depth-bar');
    if (!bar) return;
    requestAnimationFrame(() => {
      bar.style.height = ((8.8 / 30) * 100).toFixed(1) + '%'; /* 8.8 km ipocentro L'Aquila / 30 km scala massima */
    });
  }
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     SLIDE 2 — ANIMAZIONE IPOCENTRO → EPICENTRO
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  function s2InitHypocenterCanvas() {
    const canvas  = document.getElementById('s2-hypo-canvas');
    const ctx     = canvas.getContext('2d');
    const btn     = document.getElementById('s2-anim-btn');
    const label   = document.getElementById('s2-hypo-label');
    const phases  = document.querySelectorAll('.s2-phase-item');
    const W = canvas.width, H = canvas.height;

    /* Coordinate ipocentro (70% della profondità del canvas) */
    const hypoCX = W / 2, hypoCY = H * 0.70;
    /* Superficie = y fissa */
    const SURF_Y = 32;

    let animId  = null;
    let phase   = 0;
    let started = false;
    let resetTimeout = null;

    /* Strati geologici */
    const layers = [
      { y0: SURF_Y,     y1: SURF_Y + 84,  color: '#1a2030' }, /* sedimenti 0–5 km */
      { y0: SURF_Y + 84, y1: SURF_Y + 252, color: '#232d3f' }, /* roccia compatta 5–15 km */
      { y0: SURF_Y + 252, y1: H,           color: '#1c2535' }, /* crosta inferiore 15–25 km */
    ];

    /* Attiva label testo sinistra */
    function setPhase(n) {
      phases.forEach((p, i) => p.classList.toggle('active', i === n - 1));
    }

    /* Disegna strati + superficie */
    function drawLayers() {
      ctx.fillStyle = '#050709';
      ctx.fillRect(0, 0, W, H);
      layers.forEach(l => {
        ctx.fillStyle = l.color;
        ctx.fillRect(0, l.y0, W, l.y1 - l.y0);
      });
      /* Linea superficie */
      ctx.strokeStyle = '#F5EDE0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, SURF_Y); ctx.lineTo(W, SURF_Y); ctx.stroke();
      /* Label superficie */
      ctx.fillStyle = 'rgba(245,237,224,0.4)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText('SUPERFICIE', 8, SURF_Y - 6);
      ctx.letterSpacing = '0px';
    }

    /* Disegna punto ipocentro pulsante */
    let hypoPhase = 0;
    function drawHypo(glow) {
      const scale = 1 + 0.4 * Math.abs(Math.sin(hypoPhase));
      const r = 6 * scale;
      ctx.save();
      ctx.translate(hypoCX, hypoCY);
      if (glow) {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3);
        grad.addColorStop(0, 'rgba(196,97,42,0.6)');
        grad.addColorStop(1, 'rgba(196,97,42,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#C4612A';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      /* Label */
      ctx.fillStyle = 'rgba(196,97,42,0.7)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('IPOCENTRO · 8,8 km', hypoCX + 12, hypoCY + 4);
    }

    /* ── Fase 1: stato iniziale + pulsazione ipocentro ── */
    function runPhase1() {
      phase = 1; setPhase(1);
      label.textContent = 'Roccia sotto tensione — ipocentro in formazione';
      let t = 0;
      function tick() {
        drawLayers();
        hypoPhase = t * 0.05;
        drawHypo(true);
        t++;
        if (t < 60) animId = requestAnimationFrame(tick); /* 1s @ 60fps */
        else runPhase2();
      }
      animId = requestAnimationFrame(tick);
    }

    /* ── Fase 2: flash rilascio energia (0.5s) ── */
    function runPhase2() {
      phase = 2; setPhase(2);
      label.textContent = 'Frattura — rilascio istantaneo di energia';
      let t = 0;
      function tick() {
        drawLayers(); drawHypo(false);
        /* Flash bianco sull'ipocentro */
        const opacity = t < 15 ? t / 15 : Math.max(0, 1 - (t - 15) / 15);
        ctx.save();
        ctx.globalAlpha = opacity * 0.85;
        const grad = ctx.createRadialGradient(hypoCX, hypoCY, 0, hypoCX, hypoCY, 30);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(hypoCX, hypoCY, 30, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        t++;
        if (t < 30) animId = requestAnimationFrame(tick);
        else runPhase3();
      }
      animId = requestAnimationFrame(tick);
    }

    /* ── Fase 3: onda che sale verso la superficie (2.5s ≈ 150 frame) ── */
    function runPhase3() {
      phase = 3; setPhase(3);
      label.textContent = 'Onda di volume sale verso la superficie';
      const maxR = hypoCY - SURF_Y; /* distanza ipocentro→superficie */
      let r = 0;
      const trail = []; /* scie */
      function tick() {
        drawLayers(); drawHypo(false);
        /* Scia + onda corrente — clippate alla superficie */
        ctx.save();
        ctx.beginPath(); ctx.rect(0, SURF_Y, W, H - SURF_Y); ctx.clip();
        trail.forEach((tr, i) => {
          const age = trail.length - i;
          const alpha = Math.max(0, 0.35 - age * 0.03);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#C4612A';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(hypoCX, hypoCY, tr, Math.PI, 0);
          ctx.stroke();
          ctx.restore();
        });
        ctx.strokeStyle = '#C4612A';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(hypoCX, hypoCY, r, Math.PI, 0);
        ctx.stroke();
        ctx.restore();

        trail.push(r);
        if (trail.length > 12) trail.shift();
        r += maxR / 150;
        if (r < maxR) animId = requestAnimationFrame(tick);
        else runPhase4(r);
      }
      animId = requestAnimationFrame(tick);
    }

    /* ── Fase 4: freeze epicentro ── */
    function runPhase4(finalR) {
      finalR = Math.min(finalR, hypoCY - SURF_Y); /* non superare la superficie */
      phase = 4; setPhase(4);
      label.textContent = 'Epicentro raggiunto — partenza onde superficiali';

      function drawFrozenFrame() {
        drawLayers(); drawHypo(false);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, SURF_Y, W, H - SURF_Y); ctx.clip();
        ctx.strokeStyle = '#C4612A'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(hypoCX, hypoCY, finalR, Math.PI, 0); ctx.stroke();
        ctx.restore();
      }

      drawFrozenFrame();

      let epicPhase = 0;
      let epicId;
      function pulseEpic() {
        drawFrozenFrame();
        /* Punto epicentro pulsante */
        const ep = 8 + 4 * Math.abs(Math.sin(epicPhase));
        ctx.save();
        const eGrad = ctx.createRadialGradient(hypoCX, SURF_Y, 0, hypoCX, SURF_Y, ep * 2.5);
        eGrad.addColorStop(0, 'rgba(58,126,196,0.5)');
        eGrad.addColorStop(1, 'rgba(58,126,196,0)');
        ctx.fillStyle = eGrad;
        ctx.beginPath(); ctx.arc(hypoCX, SURF_Y, ep * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3A7EC4';
        ctx.beginPath(); ctx.arc(hypoCX, SURF_Y, ep, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        /* Label EPICENTRO — appare subito, leggero fade-in */
        ctx.globalAlpha = Math.min(1, 0.25 + epicPhase / 8);
        ctx.fillStyle = '#3A7EC4';
        ctx.font = 'bold 18px "Cormorant Garamond", serif';
        ctx.fillText('EPICENTRO', hypoCX + 14, SURF_Y - 8);
        ctx.globalAlpha = 1;
        epicPhase += 0.05;
        epicId = requestAnimationFrame(pulseEpic);
        btn._epicId = epicId;
      }
      epicId = requestAnimationFrame(pulseEpic);
      btn.textContent = '↺ Rivedi';
      btn._epicId = epicId;
    }

    /* Reset completo */
    function s2Reset() {
      if (animId) cancelAnimationFrame(animId);
      if (btn._epicId) cancelAnimationFrame(btn._epicId);
      hypoPhase = 0;
      phase = 0;
      drawLayers(); drawHypo(true);
      phases.forEach(p => p.classList.remove('active'));
      label.textContent = 'Clicca "Avvia" per iniziare';
      btn.textContent = '▶ Avvia';
    }

    btn.addEventListener('click', () => {
      if (animId) cancelAnimationFrame(animId);
      if (btn._epicId) cancelAnimationFrame(btn._epicId);
      if (resetTimeout) clearTimeout(resetTimeout);
      s2Reset();
      resetTimeout = setTimeout(runPhase1, 50);
    });

    /* Disegno iniziale */
    drawLayers(); drawHypo(true);

    /* Pulsazione idle ipocentro */
    let idleId;
    function idlePulse() {
      if (phase > 0) return; /* animazione avviata — stop idle */
      drawLayers();
      hypoPhase += 0.04;
      drawHypo(true);
      idleId = requestAnimationFrame(idlePulse);
    }
    idleId = requestAnimationFrame(idlePulse);
    /* Esponi il cancellation per quando l'animazione parte */
    btn.addEventListener('click', () => { cancelAnimationFrame(idleId); }, { once: true });
  }
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     SLIDE 3 — SLIDER PROFONDITÀ + CANVAS DANNO
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

  function s2InitDepthSlider() {
    const slider   = document.getElementById('s2-depth-slider');
    const valLbl   = document.getElementById('s2-depth-val');
    const secEl    = document.getElementById('s2-section-canvas');
    const surEl    = document.getElementById('s2-depth-canvas');
    const sctx     = secEl.getContext('2d');
    const dctx     = surEl.getContext('2d');
    const infoR    = document.getElementById('s2-info-radius');
    const infoMCS  = document.getElementById('s2-info-mcs');
    const infoArea = document.getElementById('s2-info-area');
    const presets  = document.querySelectorAll('.s2-preset-btn');
    const SW = secEl.width, SH = secEl.height;
    const DW = surEl.width, DH = surEl.height;
    const MAX_D  = 300;
    const S_SURF = 36; /* y linea di superficie nel canvas sezione */

    const secLayers = [
      { y0: S_SURF,       y1: S_SURF + 65,  color: '#1a2030' }, /* 0–10 km sedimenti */
      { y0: S_SURF + 65,  y1: S_SURF + 195, color: '#232d3f' }, /* 10–30 km crosta */
      { y0: S_SURF + 195, y1: SH,           color: '#1c2535' }, /* mantello */
    ];

    function lerpColor(d) {
      const t = Math.min(d / MAX_D, 1);
      return `rgb(${Math.round(139+(58-139)*t)},${Math.round(26+(126-26)*t)},${Math.round(26+(196-26)*t)})`;
    }
    function mcsLabel(d) {
      if (d < 10) return 'IX–X MCS';
      if (d < 30) return 'VII–VIII MCS';
      if (d < 70) return 'V–VI MCS';
      return 'III–IV MCS';
    }
    function depthToY(d) { return S_SURF + (d / MAX_D) * (SH - S_SURF - 16); }

    /* ── Sezione verticale (canvas sinistra) ── */
    function drawSection(depth) {
      const RULER_X = SW - 38;
      sctx.fillStyle = '#050709';
      sctx.fillRect(0, 0, SW, SH);

      secLayers.forEach(l => {
        sctx.fillStyle = l.color;
        sctx.fillRect(0, l.y0, RULER_X - 2, l.y1 - l.y0);
      });

      /* Righello km */
      sctx.strokeStyle = 'rgba(245,237,224,0.12)';
      sctx.lineWidth = 1;
      sctx.beginPath(); sctx.moveTo(RULER_X, S_SURF); sctx.lineTo(RULER_X, SH - 8); sctx.stroke();
      sctx.font = '7px "JetBrains Mono", monospace';
      sctx.fillStyle = 'rgba(245,237,224,0.22)';
      sctx.textAlign = 'right';
      [0, 50, 100, 150, 200, 250, 300].forEach(d => {
        const y = depthToY(d);
        if (y > SH - 10) return;
        sctx.beginPath(); sctx.moveTo(RULER_X - 4, y); sctx.lineTo(RULER_X + 3, y); sctx.stroke();
        sctx.fillText(d === 0 ? '0' : String(d), RULER_X - 6, y + 3);
      });
      sctx.textAlign = 'left';
      sctx.fillStyle = 'rgba(245,237,224,0.15)';
      sctx.fillText('km', RULER_X - 14, SH - 2);

      /* Linea superficie */
      sctx.strokeStyle = 'rgba(245,237,224,0.55)';
      sctx.lineWidth = 2;
      sctx.beginPath(); sctx.moveTo(0, S_SURF); sctx.lineTo(RULER_X - 2, S_SURF); sctx.stroke();
      sctx.fillStyle = 'rgba(245,237,224,0.35)';
      sctx.font = '8px "JetBrains Mono", monospace';
      sctx.fillText('Superficie', 6, S_SURF - 5);

      /* Linea tratteggiata + label profondità */
      const hypoX = RULER_X / 2;
      const hypoY = depthToY(depth);
      sctx.setLineDash([4, 4]);
      sctx.strokeStyle = 'rgba(245,237,224,0.1)';
      sctx.lineWidth = 1;
      sctx.beginPath(); sctx.moveTo(hypoX, S_SURF); sctx.lineTo(hypoX, hypoY); sctx.stroke();
      sctx.setLineDash([]);

      const color = lerpColor(depth);
      const midY  = (S_SURF + hypoY) / 2;
      const ds    = depth % 1 === 0 ? String(depth) : depth.toFixed(1);
      sctx.fillStyle = color;
      sctx.font = '8px "JetBrains Mono", monospace';
      sctx.textAlign = 'center';
      sctx.fillText(ds.replace('.', ',') + ' km', hypoX, midY - 4);
      sctx.textAlign = 'left';

      /* Glow + punto ipocentro */
      const grd = sctx.createRadialGradient(hypoX, hypoY, 0, hypoX, hypoY, 22);
      grd.addColorStop(0, 'rgba(196,97,42,0.4)');
      grd.addColorStop(1, 'rgba(196,97,42,0)');
      sctx.fillStyle = grd;
      sctx.beginPath(); sctx.arc(hypoX, hypoY, 22, 0, Math.PI * 2); sctx.fill();
      sctx.fillStyle = '#C4612A';
      sctx.beginPath(); sctx.arc(hypoX, hypoY, 6, 0, Math.PI * 2); sctx.fill();
      sctx.fillStyle = 'rgba(196,97,42,0.8)';
      sctx.font = '8px "JetBrains Mono", monospace';
      sctx.fillText('IPOCENTRO', hypoX + 9, hypoY + 3);
    }

    /* ── Vista dall'alto: formula km unificata + griglia dinamica ── */

    function depthToKm(depth) {
      /* Formula unica — usata sia per il testo che per il cerchio visivo */
      return Math.round(10 + (depth / MAX_D) * 390);
    }

    function drawSurface(depth) {
      const km = depthToKm(depth);

      /* ── Griglia FISSA 150 km — non cambia mai ── */
      const GRID_MAX_KM = 150;
      const STEP_MAJOR  = 50;
      const STEP_MINOR  = 25;

      const cx = DW / 2, cy = DH / 2;
      const pxPerKm = (DW / 2 - 20) / GRID_MAX_KM;

      /* — Sfondo — */
      dctx.fillStyle = '#050709';
      dctx.fillRect(0, 0, DW, DH);

      /* — Linee secondarie ogni 10 km — */
      dctx.strokeStyle = 'rgba(245,237,224,0.05)';
      dctx.lineWidth = 0.5;
      for (let k = STEP_MINOR; k <= GRID_MAX_KM; k += STEP_MINOR) {
        const d = k * pxPerKm;
        dctx.beginPath(); dctx.moveTo(cx - d, 0); dctx.lineTo(cx - d, DH); dctx.stroke();
        dctx.beginPath(); dctx.moveTo(cx + d, 0); dctx.lineTo(cx + d, DH); dctx.stroke();
        dctx.beginPath(); dctx.moveTo(0, cy - d); dctx.lineTo(DW, cy - d); dctx.stroke();
        dctx.beginPath(); dctx.moveTo(0, cy + d); dctx.lineTo(DW, cy + d); dctx.stroke();
      }

      /* — Linee principali ogni 20 km + etichette — */
      dctx.strokeStyle = 'rgba(245,237,224,0.18)';
      dctx.lineWidth = 1;
      dctx.font = '8px "JetBrains Mono", monospace';
      dctx.fillStyle = 'rgba(245,237,224,0.35)';
      dctx.textBaseline = 'top';
      for (let k = STEP_MAJOR; k <= GRID_MAX_KM; k += STEP_MAJOR) {
        const d = k * pxPerKm;
        dctx.beginPath(); dctx.moveTo(cx + d, 0); dctx.lineTo(cx + d, DH); dctx.stroke();
        dctx.beginPath(); dctx.moveTo(cx - d, 0); dctx.lineTo(cx - d, DH); dctx.stroke();
        dctx.beginPath(); dctx.moveTo(0, cy + d); dctx.lineTo(DW, cy + d); dctx.stroke();
        dctx.beginPath(); dctx.moveTo(0, cy - d); dctx.lineTo(DW, cy - d); dctx.stroke();
        dctx.textAlign = 'center';
        dctx.fillText(k + ' km', cx + d, cy + 4);
        dctx.textAlign = 'left';
        dctx.fillText(k + ' km', cx + 4, cy - d + 2);
      }

      /* — Assi centrali — */
      dctx.strokeStyle = 'rgba(245,237,224,0.12)';
      dctx.lineWidth = 1;
      dctx.beginPath(); dctx.moveTo(cx, 0); dctx.lineTo(cx, DH); dctx.stroke();
      dctx.beginPath(); dctx.moveTo(0, cy); dctx.lineTo(DW, cy); dctx.stroke();

      /* — Cerchio — NON clampato: se km > 80 copre tutta la griglia — */
      const rPx   = km * pxPerKm;
      const color = lerpColor(depth);
      const rGrad = Math.max(rPx, 2); /* evita errore gradiente con raggio 0 */

      const fillGrad = dctx.createRadialGradient(cx, cy, 0, cx, cy, rGrad);
      fillGrad.addColorStop(0,    'rgba(139,26,26,0.75)');
      fillGrad.addColorStop(0.35, 'rgba(196,97,42,0.50)');
      fillGrad.addColorStop(0.75, 'rgba(196,97,42,0.20)');
      fillGrad.addColorStop(1,    'rgba(196,97,42,0.05)');
      dctx.fillStyle = fillGrad;
      dctx.beginPath(); dctx.arc(cx, cy, rGrad, 0, Math.PI * 2); dctx.fill();

      /* Bordo solo se il cerchio entra nel canvas */
      if (rPx < DW / 2 + 5) {
        dctx.strokeStyle = color;
        dctx.lineWidth = 2;
        dctx.beginPath(); dctx.arc(cx, cy, rPx, 0, Math.PI * 2); dctx.stroke();
      }

      /* — Crosshair epicentro (sempre visibile sopra il gradiente) — */
      dctx.strokeStyle = 'rgba(245,237,224,0.55)';
      dctx.lineWidth = 1.5;
      dctx.beginPath(); dctx.moveTo(cx - 10, cy); dctx.lineTo(cx + 10, cy); dctx.stroke();
      dctx.beginPath(); dctx.moveTo(cx, cy - 10); dctx.lineTo(cx, cy + 10); dctx.stroke();

      /* — Label "r ≈ X km" SEMPRE FUORI dal cerchio — */
      dctx.font = '8px "JetBrains Mono", monospace';
      dctx.textBaseline = 'top';
      const labelText = 'r ≈ ' + km + ' km';
      if (rPx <= DW / 2 - 30) {
        /* Cerchio entra nel canvas: label fuori dal bordo in alto-destra */
        dctx.fillStyle = color;
        dctx.textAlign = 'left';
        dctx.fillText(labelText, cx + rPx + 8, cy - rPx * 0.4);
      } else {
        /* Cerchio copre tutto: label in alto a destra del canvas */
        dctx.fillStyle = 'rgba(245,237,224,0.70)';
        dctx.textAlign = 'right';
        dctx.fillText(labelText, DW - 8, 8);
      }

      /* — Label EPICENTRO — */
      dctx.fillStyle = 'rgba(58,126,196,0.9)';
      dctx.textAlign = 'left';
      dctx.fillText('EPICENTRO', cx + 12, cy + 4);
    }

    function updateAll(depth) {
      drawSection(depth);
      drawSurface(depth);
      const ds = depth % 1 === 0 ? String(depth) : depth.toFixed(1);
      valLbl.textContent = ds.replace('.', ',') + ' km';
      const km = depthToKm(depth);
      if (infoR)    infoR.textContent    = `~${km} km`;
      if (infoMCS)  infoMCS.textContent  = mcsLabel(depth);
      if (infoArea) infoArea.textContent = `~${Math.round(Math.PI * km * km).toLocaleString('it-IT')} km²`;
      presets.forEach(p => p.classList.toggle('s2-preset-btn--active', Math.abs(parseFloat(p.dataset.depth) - depth) < 0.01));
    }

    /* Throttle via rAF: al massimo un ridisegno per frame (60fps) */
    let s3RafId = null;
    let s3Pending = NaN;
    function s3Schedule(depth) {
      s3Pending = depth;
      if (s3RafId) return;
      s3RafId = requestAnimationFrame(() => { s3RafId = null; updateAll(s3Pending); });
    }
    slider.addEventListener('input', () => s3Schedule(parseFloat(slider.value)));

    let presetRafId = null;
    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        if (presetRafId !== null) cancelAnimationFrame(presetRafId);
        const target = parseFloat(btn.dataset.depth);
        const start  = parseFloat(slider.value);
        const t0 = performance.now();
        function anim(now) {
          const p    = Math.min((now - t0) / 800, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const curr = start + (target - start) * ease;
          slider.value = curr;
          updateAll(curr);
          if (p < 1) { presetRafId = requestAnimationFrame(anim); }
          else { slider.value = target; updateAll(target); presetRafId = null; }
        }
        presetRafId = requestAnimationFrame(anim);
        presets.forEach(p => p.classList.remove('s2-preset-btn--active'));
        btn.classList.add('s2-preset-btn--active');
      });
    });

    slider.value = 8.8;
    updateAll(parseFloat(slider.value));
  }

  /* Esponi init slide 0 al scope globale per onSlideEnter verticale */
  window._s2InitSlide0 = function() { if (!s2Triggered.has(0)) s2OnSlideEnter(0); };

})();