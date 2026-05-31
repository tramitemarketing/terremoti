import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/main.js', encoding='utf-8') as f:
    src = f.read()

start = src.find('  let mapInstance = null;')
end   = src.find('BRANCH ANIMATION', start) - 6

NEW_BLOCK = """  /* ── INGV Canvas Map — Slide 1 ── */
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
        const events = text.trim().split('\\n').slice(1).map(l => {
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

"""

new_src = src[:start] + NEW_BLOCK + src[end:]
with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(new_src)
print(f'OK — js/main.js: {len(new_src.splitlines())} righe')
