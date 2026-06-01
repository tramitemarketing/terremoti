/* ─── JS SLIDE 1 (Parte A) ─── */
function s5_initSlide1() {
    /* Inizializza la mappa Leaflet e tutti i layer per la slide 1:
       - Tile CartoDB Dark Matter
       - GeoJSON zone sismiche DPC (approssimazioni didattiche)
       - Marcatori INGV sismicità ultimi 12 mesi
       - Marcatore L'Aquila con animazione pulse
       - Pannello controlli con toggle e filtro magnitudine
    */

    // --- Riferimenti DOM ---
    const mapEl        = document.getElementById('s5-map');
    const toggleZones  = document.getElementById('s5-toggle-zones');
    const toggleQuakes = document.getElementById('s5-toggle-quakes');
    const countEl      = document.getElementById('s5-quake-count');
    const statusEl     = document.getElementById('s5-api-status');

    if (!mapEl || typeof L === 'undefined') return;

    // --- Inizializzazione mappa Leaflet ---
    const map = L.map('s5-map', {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true
    });

    // Bounds: estensione approssimativa del territorio italiano
    map.fitBounds([[35.0, 6.0], [47.5, 19.0]]);

    // Sfondo scuro locale (nessun tile CDN)
    var REG_FILL = {1:'rgba(139,26,26,0.35)',2:'rgba(196,97,42,0.28)',3:'rgba(212,137,58,0.18)',4:'rgba(88,160,88,0.12)'};
    var REG_ZONES = {'calabria':1,'campania':1,'basilicata':1,'sicilia':1,'abruzzo':1,'molise':2,'friuli venezia giulia':2,'marche':2,'umbria':2,'lazio':2,'liguria':3,'toscana':3,'emilia-romagna':3,'veneto':3,'piemonte':3,'lombardia':3,'trentino-alto adige/sudtirol':3,'puglia':3,"valle d'aosta":4,'sardegna':4};
    fetch('italy-regions.json').then(function(r){return r.json();}).then(function(gj){
        L.geoJSON(gj,{style:function(f){var z=REG_ZONES[(f.properties.name||'').toLowerCase()]||3;return{fillColor:REG_FILL[z],fillOpacity:1,color:'rgba(245,237,224,0.08)',weight:0.5};}}).addTo(map);
    }).catch(function(){});

    // Salva istanza sulla S5 per uso esterno
    S5.mapInstance = map;

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       ZONE SISMICHE DPC — Approssimazioni didattiche
       Poligoni semplificati, non confini municipali reali
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    /* Zone sismiche DPC — province reali (openpolis/geojson-italy)
       prov_acr → zona DPC, coerente con dati s5_initSlide3 */
    var PROV_ZONE = {
        AQ:1, CH:2, PE:2, TE:2,
        PZ:1, MT:2,
        CZ:1, CS:2, KR:2, RC:1, VV:1,
        AV:1, BN:1, CE:2, NA:2, SA:2,
        BO:3, FE:3, FC:3, MO:3, PR:3, PC:3, RA:3, RE:3, RN:3,
        GO:2, PN:2, TS:2, UD:2,
        FR:2, LT:3, RI:2, RM:3, VT:3,
        GE:3, IM:3, SP:3, SV:3,
        BG:3, BS:3, CO:4, CR:3, LC:3, LO:3, MN:3, MI:4, MB:4, PV:3, SO:3, VA:4,
        AN:2, AP:2, FM:2, MC:2, PU:2,
        CB:1, IS:1,
        AL:3, AT:3, BI:3, CN:3, NO:4, TO:4, VB:3, VC:4,
        BA:3, BT:3, BR:3, FG:2, LE:3, TA:3,
        CA:4, NU:4, OR:4, SS:4, SU:4,
        AG:2, CL:2, CT:1, EN:2, ME:1, PA:2, RG:2, SR:1, TP:2,
        AR:3, FI:3, GR:3, LI:3, LU:3, MS:2, PI:3, PT:3, PO:3, SI:3,
        BZ:4, TN:3,
        PG:2, TR:2,
        AO:3,
        BL:2, PD:3, RO:3, TV:3, VE:4, VR:3, VI:3
    };
    var PROV_NAME_ZONE = {
        "L'Aquila":1,"Chieti":2,"Pescara":2,"Teramo":2,
        "Potenza":1,"Matera":2,
        "Catanzaro":1,"Cosenza":2,"Crotone":2,"Reggio di Calabria":1,"Reggio Calabria":1,"Vibo Valentia":1,
        "Avellino":1,"Benevento":1,"Caserta":2,"Napoli":2,"Salerno":2,
        "Bologna":3,"Ferrara":3,"Forlì-Cesena":3,"Modena":3,"Parma":3,"Piacenza":3,"Ravenna":3,"Reggio nell'Emilia":3,"Reggio Emilia":3,"Rimini":3,
        "Gorizia":2,"Pordenone":2,"Trieste":2,"Udine":2,
        "Frosinone":2,"Latina":3,"Rieti":2,"Roma":3,"Viterbo":3,
        "Genova":3,"Imperia":3,"La Spezia":3,"Savona":3,
        "Bergamo":3,"Brescia":3,"Como":4,"Cremona":3,"Lecco":3,"Lodi":3,"Mantova":3,"Milano":4,"Monza e della Brianza":4,"Pavia":3,"Sondrio":3,"Varese":4,
        "Ancona":2,"Ascoli Piceno":2,"Fermo":2,"Macerata":2,"Pesaro e Urbino":2,
        "Campobasso":1,"Isernia":1,
        "Alessandria":3,"Asti":3,"Biella":3,"Cuneo":3,"Novara":4,"Torino":4,"Verbano-Cusio-Ossola":3,"Vercelli":4,
        "Bari":3,"Barletta-Andria-Trani":3,"Brindisi":3,"Foggia":2,"Lecce":3,"Taranto":3,
        "Cagliari":4,"Nuoro":4,"Oristano":4,"Sassari":4,"Sud Sardegna":4,
        "Agrigento":2,"Caltanissetta":2,"Catania":1,"Enna":2,"Messina":1,"Palermo":2,"Ragusa":2,"Siracusa":1,"Trapani":2,
        "Arezzo":3,"Firenze":3,"Grosseto":3,"Livorno":3,"Lucca":3,"Massa-Carrara":2,"Pisa":3,"Pistoia":3,"Prato":3,"Siena":3,
        "Bolzano":4,"Trento":3,
        "Perugia":2,"Terni":2,
        "Aosta":3,
        "Belluno":2,"Padova":3,"Rovigo":3,"Treviso":3,"Venezia":4,"Verona":3,"Vicenza":3
    };
    var ZONE_FILL   = { 1:'rgba(139,26,26,0.50)',  2:'rgba(196,97,42,0.40)',  3:'rgba(212,137,58,0.28)', 4:'rgba(58,126,196,0.20)' };
    var ZONE_STROKE = { 1:'#8B1A1A', 2:'#C4612A', 3:'#D4893A', 4:'#3A7EC4' };

    var REG_ZONE = {
        "Calabria":1,"Basilicata":1,"Campania":1,"Molise":1,"Abruzzo":1,"Sicilia":1,
        "Marche":2,"Umbria":2,"Friuli-Venezia Giulia":2,"Lazio":2,"Puglia":2,
        "Liguria":3,"Emilia-Romagna":3,"Veneto":3,"Toscana":3,"Piemonte":3,
        "Valle d'Aosta":3,"Trentino-Alto Adige":3,"Lombardia":3,"Sardegna":4
    };
    function getZoneFromFeat(feat) {
        var acr = (feat.properties.prov_acr || '').toUpperCase();
        var pnm =  feat.properties.prov_name || '';
        var rnm =  feat.properties.reg_name  || feat.properties.name || '';
        return PROV_ZONE[acr] || PROV_NAME_ZONE[pnm] || REG_ZONE[rnm] || 3;
    }
    function renderZonesGJ(gj) {
        if (!(gj.features && gj.features.length)) throw new Error('empty');
        S5.zonesLayer = L.geoJSON(gj, {
            style: function(feat) {
                var z = getZoneFromFeat(feat);
                return { fillColor: ZONE_FILL[z], color: ZONE_STROKE[z], weight: 0.6, opacity: 0.85, fillOpacity: 1 };
            },
            onEachFeature: function(feat, layer) {
                var nome = feat.properties.prov_name || feat.properties.reg_name || feat.properties.name || '';
                layer.bindTooltip(nome + ' · Zona ' + getZoneFromFeat(feat) + ' DPC', { sticky: true, offset: [12, 0] });
            }
        });
        if (!toggleZones || toggleZones.checked) S5.zonesLayer.addTo(map);
        if (statusEl) statusEl.style.display = 'none';
    }
    if (statusEl) { statusEl.textContent = 'Carico zone…'; statusEl.style.display = 'block'; }
    (function tryFetch(urls, i) {
        if (i >= urls.length) {
            if (statusEl) { statusEl.textContent = 'Zone DPC non disponibili'; statusEl.style.display = 'block'; }
            return;
        }
        var ctrl = new AbortController();
        var tm = setTimeout(function(){ ctrl.abort(); }, 12000);
        fetch(urls[i], { signal: ctrl.signal })
            .then(function(r){ clearTimeout(tm); if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function(gj){ renderZonesGJ(gj); })
            .catch(function(){ clearTimeout(tm); tryFetch(urls, i + 1); });
    })([
        'https://cdn.jsdelivr.net/gh/openpolis/geojson-italy/geojson/limits_P_provinces.geojson',
        'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_P_provinces.geojson',
        'https://raw.githubusercontent.com/openpolis/geojson-italy/main/geojson/limits_P_provinces.geojson',
        'https://cdn.jsdelivr.net/gh/openpolis/geojson-italy/geojson/limits_R_regions.geojson',
        'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_R_regions.geojson'
    ], 0);

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       MARCATORE L'AQUILA — pulsante
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    const aquilaIcon = L.divIcon({
        className: 's5-aquila-marker',
        html: `
            <div class="s5-aquila-core"></div>
            <div class="s5-aquila-ring s5-aquila-pulse"></div>
            <span class="s5-aquila-label">L'Aquila · Zona 1</span>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10]
    });

    L.marker([42.354, 13.395], { icon: aquilaIcon, zIndexOffset: 1000 })
        .bindPopup(
            '<strong style="color:#F5EDE0">L\'Aquila</strong><br>' +
            '<span style="color:rgba(245,237,224,0.6)">6 aprile 2009 · Mw 6.3</span><br>' +
            '<span style="color:#8B1A1A">Zona 1 · PGA > 0.25g</span>'
        )
        .addTo(map);

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       INGV FETCH — sismicità ultimi 12 mesi, M≥2.5
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    // Calcola data di inizio: oggi - 365 giorni
    function getStartDate() {
        const d = new Date();
        d.setDate(d.getDate() - 365);
        return d.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    // Stile marker per magnitudine
    function quakeStyle(mag) {
        if (mag >= 5.0) {
            return { radius: 16, color: '#8B1A1A', fillColor: '#8B1A1A', fillOpacity: 1.0, weight: 1 };
        } else if (mag >= 4.0) {
            return { radius: 11, color: '#C4612A', fillColor: '#C4612A', fillOpacity: 0.8, weight: 0.5 };
        } else if (mag >= 3.0) {
            return { radius: 7,  color: '#D4893A', fillColor: '#D4893A', fillOpacity: 0.7, weight: 0 };
        } else {
            return { radius: 4,  color: '#F5EDE0', fillColor: '#F5EDE0', fillOpacity: 0.5, weight: 0 };
        }
    }

    // Fetch e rendering sismicità INGV
    function fetchINGV() {
        const startDate = getStartDate();
        const url = `https://webservices.ingv.it/fdsnws/event/1/query?format=text&minmag=2.5&starttime=${startDate}&orderby=time&limit=800`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        fetch(url, { signal: controller.signal })
            .then(function(r) {
                clearTimeout(timeout);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(text) {
                const events = parseINGVText(text);
                S5.quakesData = events;
                renderQuakes(events);
                if (countEl) countEl.textContent = events.length;
            })
            .catch(function() {
                clearTimeout(timeout);
                // Fallback: mostra messaggio di errore
                if (statusEl) {
                    statusEl.textContent = 'Dati sismicità non disponibili';
                    statusEl.style.display = 'block';
                }
                if (countEl) countEl.textContent = '—';
                S5.quakesData = [];
            });
    }

    // Parser formato testo INGV pipe-delimited
    // Colonne: EventID|Time|Latitude|Longitude|Depth|Author|Catalog|Contributor|ContributorID|MagType|Magnitude|MagAuthor|EventLocationName|EventType
    function parseINGVText(text) {
        const lines = text.split('\n');
        const events = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            // Salta righe vuote e header (iniziano con #)
            if (!line || line.charAt(0) === '#') continue;
            var parts = line.split('|');
            if (parts.length < 13) continue;
            var lat  = parseFloat(parts[2]);
            var lon  = parseFloat(parts[3]);
            var mag  = parseFloat(parts[10]);
            var time = parts[1] ? parts[1].trim() : '';
            var loc  = parts[12] ? parts[12].trim() : 'Italia';
            if (isNaN(lat) || isNaN(lon) || isNaN(mag)) continue;
            events.push({ lat: lat, lon: lon, mag: mag, time: time, loc: loc });
        }
        return events;
    }

    // Rendering marker sismicità sulla mappa
    function renderQuakes(events) {
        // Rimuovi layer precedente se esiste
        if (S5.quakesLayer) {
            map.removeLayer(S5.quakesLayer);
        }

        // Leggi filtro magnitudine corrente
        var magMin = 0;
        var radios = document.querySelectorAll('input[name="s5-magfilter"]');
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                var val = radios[i].value;
                if (val === '3') magMin = 3.0;
                else if (val === '4') magMin = 4.0;
                else magMin = 0;
                break;
            }
        }

        // Filtra eventi per magnitudine
        var filtered = events.filter(function(e) { return e.mag >= magMin; });

        // Crea layer
        S5.quakesLayer = L.layerGroup();

        for (var j = 0; j < filtered.length; j++) {
            var ev = filtered[j];
            var st = quakeStyle(ev.mag);

            // Formatta data leggibile
            var dateStr = ev.time ? ev.time.slice(0, 10) : '—';

            var marker = L.circleMarker([ev.lat, ev.lon], {
                radius:      st.radius,
                color:       st.color,
                fillColor:   st.fillColor,
                fillOpacity: st.fillOpacity,
                weight:      st.weight
            });

            marker.bindPopup(
                'M ' + ev.mag.toFixed(1) +
                ' &middot; ' + ev.loc +
                ' &middot; ' + dateStr,
                { maxWidth: 260 }
            );

            S5.quakesLayer.addLayer(marker);
        }

        // Aggiungi alla mappa solo se il toggle è attivo
        if (toggleQuakes && toggleQuakes.checked) {
            S5.quakesLayer.addTo(map);
        }

        // Aggiorna contatore con il totale filtrato
        if (countEl) countEl.textContent = filtered.length;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CONTROLLI — toggle e filtro magnitudine
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    // Toggle zone sismiche
    if (toggleZones) {
        toggleZones.addEventListener('change', function() {
            if (toggleZones.checked) {
                if (S5.zonesLayer && !map.hasLayer(S5.zonesLayer)) {
                    S5.zonesLayer.addTo(map);
                }
            } else {
                if (S5.zonesLayer && map.hasLayer(S5.zonesLayer)) {
                    map.removeLayer(S5.zonesLayer);
                }
            }
        });
    }

    // Toggle sismicità recente
    if (toggleQuakes) {
        toggleQuakes.addEventListener('change', function() {
            if (toggleQuakes.checked) {
                if (S5.quakesLayer && !map.hasLayer(S5.quakesLayer)) {
                    S5.quakesLayer.addTo(map);
                }
            } else {
                if (S5.quakesLayer && map.hasLayer(S5.quakesLayer)) {
                    map.removeLayer(S5.quakesLayer);
                }
            }
        });
    }

    // Filtro magnitudine: ri-renderizza al cambio
    var radios = document.querySelectorAll('input[name="s5-magfilter"]');
    for (var r = 0; r < radios.length; r++) {
        radios[r].addEventListener('change', function() {
            if (S5.quakesData && S5.quakesData.length) {
                renderQuakes(S5.quakesData);
            }
        });
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       AVVIO FETCH — richiamato una sola volta all'init
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    fetchINGV();
}

/* ─── JS SLIDE 2-3 (Parte B) ─── */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SLIDE 2 — La formula del rischio
   Animazione ingranaggi interattiva
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function s5_initSlide2() {

  const canvas = document.getElementById('s5-gear-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* Stato ingranaggi — variabili mutabili per le transizioni */
  let gearP = { x: 150, y: 190, r: 80,  teeth: 10, angle: 0, color: '#8B1A1A', label: 'PERICOLOSITÀ',   fixed: true  };
  let gearV = { x: 300, y: 130, r: 70,  teeth: 9,  angle: 0, color: '#C4612A', label: 'VULNERABILITÀ',  fixed: false };
  let gearE = { x: 310, y: 280, r: 65,  teeth: 8,  angle: 0, color: '#3A7EC4', label: 'VALORE ESPOSTO', fixed: false };

  /* Target dei raggi per le transizioni smooth */
  let gearVTarget = 70;
  let gearETarget = 65;

  /* Velocità base: ~2 rpm a 60fps → circa 0.007 rad/frame */
  const BASE_SPEED = (2 * Math.PI * 2) / (60 * 60);

  /* Disegna un singolo ingranaggio */
  function drawGear(g) {
    const { x, y, r, teeth, angle, color } = g;
    const toothH   = 12;
    const toothW   = 8;
    const twoPi    = Math.PI * 2;
    const step     = twoPi / teeth;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    /* Corpo dell'ingranaggio */
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, twoPi);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    /* Denti: rettangoli sporgenti */
    ctx.fillStyle = color;
    for (let i = 0; i < teeth; i++) {
      const a = step * i;
      ctx.save();
      ctx.rotate(a);
      /* rettangolo centrato a r, altezza toothH, larghezza toothW */
      ctx.fillRect(-toothW / 2, -(r + toothH), toothW, toothH);
      ctx.restore();
    }

    /* Foro centrale */
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, twoPi);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();

    ctx.restore();

    /* Etichetta sotto il centro (ruotata non insieme all'ingranaggio) */
    ctx.save();
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const lines = g.label.split(' ');
    lines.forEach((line, li) => {
      ctx.fillText(line, x, y + r + toothH + 6 + li * 12);
    });
    ctx.restore();
  }

  /* Interpola colore da verde (#2d8f4e) → arancio (#D4893A) → sangue (#8B1A1A) */
  function riskColor(t) {
    /* t in [0,1] */
    if (t <= 0.5) {
      const s = t * 2;
      return interpolateHex('#2d8f4e', '#D4893A', s);
    } else {
      const s = (t - 0.5) * 2;
      return interpolateHex('#D4893A', '#8B1A1A', s);
    }
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  function interpolateHex(a, b, t) {
    const [r1, g1, b1] = hexToRgb(a);
    const [r2, g2, b2] = hexToRgb(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bl = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bl})`;
  }

  /* Disegna l'indicatore di rischio al centro del triangolo */
  function drawRiskIndicator() {
    /* Centro approssimativo del triangolo formato dai tre ingranaggi */
    const cx = 260;
    const cy = 210;

    /* Calcolo rischio: prodotto dei fattori normalizzati */
    const risk = Math.pow((gearV.r / 70) * (gearE.r / 65), 0.5);
    /* risk in [0,1] — 1 = livello massimo L'Aquila */

    const baseR  = 20;
    const maxAdd = 20;
    const radius = baseR + risk * maxAdd;

    const col = riskColor(risk);

    /* Cerchio riempito */
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    /* Bordo sottile */
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Testo: "RISCHIO" + livello */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '500 7px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('RISCHIO', cx, cy - 7);

    const levelStr = risk >= 0.9 ? 'CRITICO' :
                     risk >= 0.6 ? 'ALTO'    :
                     risk >= 0.3 ? 'MEDIO'   : 'BASSO';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(levelStr, cx, cy + 6);
  }

  /* Loop di animazione principale */
  function animLoop() {
    if (S5 && S5.currentSlide !== 1) {
      /* Slide non visibile — sospendi */
      S5.gearAnimId = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Lerp raggi verso i target */
    gearV.r += (gearVTarget - gearV.r) * 0.04;
    gearE.r += (gearETarget - gearE.r) * 0.04;

    /* Aggiornamento angoli di rotazione */
    gearP.angle += BASE_SPEED;
    gearV.angle -= BASE_SPEED * (gearV.r / 70);
    gearE.angle -= BASE_SPEED * (gearE.r / 65);

    /* Disegno */
    drawGear(gearP);
    drawGear(gearV);
    drawGear(gearE);
    drawRiskIndicator();

    S5.gearAnimId = requestAnimationFrame(animLoop);
  }

  /* Avvia l'animazione se non già in corso */
  if (!S5.gearAnimId) {
    S5.gearAnimId = requestAnimationFrame(animLoop);
  }

  /* ── Pulsanti ── */
  const label = document.getElementById('s5-gear-label');

  const btnVuln = document.getElementById('s5-btn-vuln');
  if (btnVuln) {
    btnVuln.addEventListener('click', function() {
      gearVTarget = 30;
      if (label) label.textContent = 'Edifici antisismici: rischio ridotto del 60%';
      /* Riavvia loop se era fermo */
      if (!S5.gearAnimId) {
        S5.gearAnimId = requestAnimationFrame(animLoop);
      }
    });
  }

  const btnExpo = document.getElementById('s5-btn-expo');
  if (btnExpo) {
    btnExpo.addEventListener('click', function() {
      gearETarget = 25;
      if (label) label.textContent = 'Popolazione ridistribuita: rischio ridotto del 55%';
      if (!S5.gearAnimId) {
        S5.gearAnimId = requestAnimationFrame(animLoop);
      }
    });
  }

  const btnReset = document.getElementById('s5-btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', function() {
      gearVTarget = 70;
      gearETarget = 65;
      if (label) label.textContent = "L'Aquila 2009: tutti i fattori al massimo → rischio critico";
      if (!S5.gearAnimId) {
        S5.gearAnimId = requestAnimationFrame(animLoop);
      }
    });
  }
}


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SLIDE 3 — Il rischio città per città
   Database 110 capoluoghi + selezione interattiva
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function s5_initSlide3() {

  /* ── Database completo dei 110 capoluoghi di provincia ── */
  const S5_CITIES = [
    /* Abruzzo */
    {nome:"L'Aquila",        regione:"Abruzzo",                zona_sismica:1, pga:0.275, pop:70000,   perc_pre1981:68, perc_muratura:45, pil_provincia:8.2,   siti_unesco:1},
    {nome:"Chieti",          regione:"Abruzzo",                zona_sismica:2, pga:0.15,  pop:51000,   perc_pre1981:60, perc_muratura:32, pil_provincia:5.1,   siti_unesco:0},
    {nome:"Pescara",         regione:"Abruzzo",                zona_sismica:2, pga:0.15,  pop:119000,  perc_pre1981:55, perc_muratura:28, pil_provincia:8.5,   siti_unesco:0},
    {nome:"Teramo",          regione:"Abruzzo",                zona_sismica:2, pga:0.20,  pop:55000,   perc_pre1981:62, perc_muratura:35, pil_provincia:5.5,   siti_unesco:0},
    /* Basilicata */
    {nome:"Potenza",         regione:"Basilicata",             zona_sismica:1, pga:0.25,  pop:67000,   perc_pre1981:58, perc_muratura:40, pil_provincia:6.7,   siti_unesco:0},
    {nome:"Matera",          regione:"Basilicata",             zona_sismica:2, pga:0.15,  pop:60000,   perc_pre1981:55, perc_muratura:32, pil_provincia:6.0,   siti_unesco:1},
    /* Calabria */
    {nome:"Catanzaro",       regione:"Calabria",               zona_sismica:1, pga:0.25,  pop:88000,   perc_pre1981:52, perc_muratura:40, pil_provincia:7.5,   siti_unesco:0},
    {nome:"Cosenza",         regione:"Calabria",               zona_sismica:2, pga:0.20,  pop:67000,   perc_pre1981:56, perc_muratura:32, pil_provincia:6.7,   siti_unesco:0},
    {nome:"Crotone",         regione:"Calabria",               zona_sismica:2, pga:0.15,  pop:62000,   perc_pre1981:54, perc_muratura:32, pil_provincia:4.5,   siti_unesco:0},
    {nome:"Reggio Calabria", regione:"Calabria",               zona_sismica:1, pga:0.30,  pop:180000,  perc_pre1981:58, perc_muratura:40, pil_provincia:12.0,  siti_unesco:0},
    {nome:"Vibo Valentia",   regione:"Calabria",               zona_sismica:1, pga:0.25,  pop:34000,   perc_pre1981:60, perc_muratura:40, pil_provincia:3.0,   siti_unesco:0},
    /* Campania */
    {nome:"Avellino",        regione:"Campania",               zona_sismica:1, pga:0.25,  pop:56000,   perc_pre1981:55, perc_muratura:40, pil_provincia:5.6,   siti_unesco:0},
    {nome:"Benevento",       regione:"Campania",               zona_sismica:1, pga:0.25,  pop:60000,   perc_pre1981:53, perc_muratura:40, pil_provincia:5.8,   siti_unesco:0},
    {nome:"Caserta",         regione:"Campania",               zona_sismica:2, pga:0.15,  pop:76000,   perc_pre1981:50, perc_muratura:30, pil_provincia:7.0,   siti_unesco:1},
    {nome:"Napoli",          regione:"Campania",               zona_sismica:2, pga:0.168, pop:967000,  perc_pre1981:62, perc_muratura:35, pil_provincia:50.0,  siti_unesco:1},
    {nome:"Salerno",         regione:"Campania",               zona_sismica:2, pga:0.175, pop:135000,  perc_pre1981:58, perc_muratura:32, pil_provincia:12.0,  siti_unesco:0},
    /* Emilia-Romagna */
    {nome:"Bologna",         regione:"Emilia-Romagna",         zona_sismica:3, pga:0.075, pop:400000,  perc_pre1981:48, perc_muratura:28, pil_provincia:35.0,  siti_unesco:0},
    {nome:"Ferrara",         regione:"Emilia-Romagna",         zona_sismica:3, pga:0.10,  pop:132000,  perc_pre1981:52, perc_muratura:28, pil_provincia:10.0,  siti_unesco:1},
    {nome:"Forlì-Cesena",    regione:"Emilia-Romagna",         zona_sismica:3, pga:0.10,  pop:98000,   perc_pre1981:50, perc_muratura:28, pil_provincia:8.5,   siti_unesco:0},
    {nome:"Modena",          regione:"Emilia-Romagna",         zona_sismica:3, pga:0.15,  pop:185000,  perc_pre1981:50, perc_muratura:28, pil_provincia:20.0,  siti_unesco:0},
    {nome:"Parma",           regione:"Emilia-Romagna",         zona_sismica:3, pga:0.075, pop:197000,  perc_pre1981:45, perc_muratura:25, pil_provincia:18.0,  siti_unesco:0},
    {nome:"Piacenza",        regione:"Emilia-Romagna",         zona_sismica:3, pga:0.075, pop:104000,  perc_pre1981:48, perc_muratura:28, pil_provincia:9.0,   siti_unesco:0},
    {nome:"Ravenna",         regione:"Emilia-Romagna",         zona_sismica:3, pga:0.075, pop:159000,  perc_pre1981:46, perc_muratura:25, pil_provincia:13.0,  siti_unesco:1},
    {nome:"Reggio Emilia",   regione:"Emilia-Romagna",         zona_sismica:3, pga:0.10,  pop:171000,  perc_pre1981:48, perc_muratura:28, pil_provincia:16.0,  siti_unesco:0},
    {nome:"Rimini",          regione:"Emilia-Romagna",         zona_sismica:3, pga:0.125, pop:149000,  perc_pre1981:48, perc_muratura:28, pil_provincia:10.0,  siti_unesco:0},
    /* Friuli-Venezia Giulia */
    {nome:"Gorizia",         regione:"Friuli-Venezia Giulia",  zona_sismica:2, pga:0.175, pop:34000,   perc_pre1981:55, perc_muratura:30, pil_provincia:3.5,   siti_unesco:0},
    {nome:"Pordenone",       regione:"Friuli-Venezia Giulia",  zona_sismica:2, pga:0.15,  pop:52000,   perc_pre1981:48, perc_muratura:28, pil_provincia:6.0,   siti_unesco:0},
    {nome:"Trieste",         regione:"Friuli-Venezia Giulia",  zona_sismica:2, pga:0.125, pop:201000,  perc_pre1981:60, perc_muratura:32, pil_provincia:12.0,  siti_unesco:0},
    {nome:"Udine",           regione:"Friuli-Venezia Giulia",  zona_sismica:2, pga:0.20,  pop:99000,   perc_pre1981:52, perc_muratura:30, pil_provincia:10.0,  siti_unesco:0},
    /* Lazio */
    {nome:"Frosinone",       regione:"Lazio",                  zona_sismica:2, pga:0.15,  pop:46000,   perc_pre1981:55, perc_muratura:32, pil_provincia:5.0,   siti_unesco:0},
    {nome:"Latina",          regione:"Lazio",                  zona_sismica:3, pga:0.075, pop:125000,  perc_pre1981:48, perc_muratura:25, pil_provincia:9.0,   siti_unesco:0},
    {nome:"Rieti",           regione:"Lazio",                  zona_sismica:2, pga:0.175, pop:47000,   perc_pre1981:58, perc_muratura:32, pil_provincia:4.5,   siti_unesco:0},
    {nome:"Roma",            regione:"Lazio",                  zona_sismica:3, pga:0.075, pop:2800000, perc_pre1981:55, perc_muratura:30, pil_provincia:100.0, siti_unesco:3},
    {nome:"Viterbo",         regione:"Lazio",                  zona_sismica:3, pga:0.10,  pop:67000,   perc_pre1981:52, perc_muratura:28, pil_provincia:5.0,   siti_unesco:0},
    /* Liguria */
    {nome:"Genova",          regione:"Liguria",                zona_sismica:3, pga:0.075, pop:583000,  perc_pre1981:58, perc_muratura:32, pil_provincia:28.0,  siti_unesco:1},
    {nome:"Imperia",         regione:"Liguria",                zona_sismica:3, pga:0.10,  pop:42000,   perc_pre1981:60, perc_muratura:30, pil_provincia:3.5,   siti_unesco:0},
    {nome:"La Spezia",       regione:"Liguria",                zona_sismica:3, pga:0.10,  pop:93000,   perc_pre1981:55, perc_muratura:30, pil_provincia:6.5,   siti_unesco:1},
    {nome:"Savona",          regione:"Liguria",                zona_sismica:3, pga:0.075, pop:60000,   perc_pre1981:56, perc_muratura:28, pil_provincia:5.0,   siti_unesco:0},
    /* Lombardia */
    {nome:"Bergamo",         regione:"Lombardia",              zona_sismica:3, pga:0.05,  pop:120000,  perc_pre1981:50, perc_muratura:25, pil_provincia:22.0,  siti_unesco:0},
    {nome:"Brescia",         regione:"Lombardia",              zona_sismica:3, pga:0.075, pop:197000,  perc_pre1981:48, perc_muratura:25, pil_provincia:30.0,  siti_unesco:0},
    {nome:"Como",            regione:"Lombardia",              zona_sismica:4, pga:0.025, pop:84000,   perc_pre1981:52, perc_muratura:22, pil_provincia:12.0,  siti_unesco:0},
    {nome:"Cremona",         regione:"Lombardia",              zona_sismica:3, pga:0.075, pop:72000,   perc_pre1981:48, perc_muratura:25, pil_provincia:8.0,   siti_unesco:0},
    {nome:"Lecco",           regione:"Lombardia",              zona_sismica:3, pga:0.05,  pop:48000,   perc_pre1981:50, perc_muratura:22, pil_provincia:6.0,   siti_unesco:0},
    {nome:"Lodi",            regione:"Lombardia",              zona_sismica:3, pga:0.075, pop:45000,   perc_pre1981:46, perc_muratura:22, pil_provincia:5.5,   siti_unesco:0},
    {nome:"Mantova",         regione:"Lombardia",              zona_sismica:3, pga:0.10,  pop:49000,   perc_pre1981:50, perc_muratura:25, pil_provincia:7.0,   siti_unesco:1},
    {nome:"Milano",          regione:"Lombardia",              zona_sismica:4, pga:0.025, pop:1400000, perc_pre1981:52, perc_muratura:20, pil_provincia:175.0, siti_unesco:0},
    {nome:"Monza",           regione:"Lombardia",              zona_sismica:4, pga:0.025, pop:123000,  perc_pre1981:50, perc_muratura:20, pil_provincia:15.0,  siti_unesco:0},
    {nome:"Pavia",           regione:"Lombardia",              zona_sismica:3, pga:0.075, pop:73000,   perc_pre1981:52, perc_muratura:25, pil_provincia:9.0,   siti_unesco:0},
    {nome:"Sondrio",         regione:"Lombardia",              zona_sismica:3, pga:0.075, pop:22000,   perc_pre1981:55, perc_muratura:25, pil_provincia:3.0,   siti_unesco:0},
    {nome:"Varese",          regione:"Lombardia",              zona_sismica:4, pga:0.025, pop:81000,   perc_pre1981:50, perc_muratura:20, pil_provincia:12.0,  siti_unesco:0},
    /* Marche */
    {nome:"Ancona",          regione:"Marche",                 zona_sismica:2, pga:0.175, pop:100000,  perc_pre1981:55, perc_muratura:30, pil_provincia:9.0,   siti_unesco:0},
    {nome:"Ascoli Piceno",   regione:"Marche",                 zona_sismica:2, pga:0.20,  pop:49000,   perc_pre1981:58, perc_muratura:35, pil_provincia:5.0,   siti_unesco:0},
    {nome:"Fermo",           regione:"Marche",                 zona_sismica:2, pga:0.175, pop:37000,   perc_pre1981:56, perc_muratura:32, pil_provincia:3.5,   siti_unesco:0},
    {nome:"Macerata",        regione:"Marche",                 zona_sismica:2, pga:0.20,  pop:42000,   perc_pre1981:58, perc_muratura:35, pil_provincia:4.5,   siti_unesco:0},
    {nome:"Pesaro-Urbino",   regione:"Marche",                 zona_sismica:2, pga:0.15,  pop:94000,   perc_pre1981:54, perc_muratura:30, pil_provincia:8.5,   siti_unesco:1},
    /* Molise */
    {nome:"Campobasso",      regione:"Molise",                 zona_sismica:1, pga:0.225, pop:49000,   perc_pre1981:58, perc_muratura:40, pil_provincia:4.5,   siti_unesco:0},
    {nome:"Isernia",         regione:"Molise",                 zona_sismica:1, pga:0.25,  pop:22000,   perc_pre1981:60, perc_muratura:40, pil_provincia:2.0,   siti_unesco:0},
    /* Piemonte */
    {nome:"Alessandria",     regione:"Piemonte",               zona_sismica:3, pga:0.075, pop:92000,   perc_pre1981:55, perc_muratura:28, pil_provincia:8.0,   siti_unesco:0},
    {nome:"Asti",            regione:"Piemonte",               zona_sismica:3, pga:0.075, pop:76000,   perc_pre1981:54, perc_muratura:28, pil_provincia:6.5,   siti_unesco:1},
    {nome:"Biella",          regione:"Piemonte",               zona_sismica:3, pga:0.05,  pop:44000,   perc_pre1981:52, perc_muratura:25, pil_provincia:5.0,   siti_unesco:0},
    {nome:"Cuneo",           regione:"Piemonte",               zona_sismica:3, pga:0.075, pop:56000,   perc_pre1981:50, perc_muratura:25, pil_provincia:8.0,   siti_unesco:0},
    {nome:"Novara",          regione:"Piemonte",               zona_sismica:4, pga:0.025, pop:104000,  perc_pre1981:50, perc_muratura:20, pil_provincia:10.0,  siti_unesco:0},
    {nome:"Torino",          regione:"Piemonte",               zona_sismica:4, pga:0.025, pop:870000,  perc_pre1981:55, perc_muratura:22, pil_provincia:70.0,  siti_unesco:1},
    {nome:"Verbano-C-O",     regione:"Piemonte",               zona_sismica:3, pga:0.05,  pop:31000,   perc_pre1981:52, perc_muratura:25, pil_provincia:3.5,   siti_unesco:0},
    {nome:"Vercelli",        regione:"Piemonte",               zona_sismica:4, pga:0.025, pop:46000,   perc_pre1981:52, perc_muratura:20, pil_provincia:5.0,   siti_unesco:0},
    /* Puglia */
    {nome:"Bari",            regione:"Puglia",                 zona_sismica:3, pga:0.05,  pop:320000,  perc_pre1981:52, perc_muratura:25, pil_provincia:20.0,  siti_unesco:0},
    {nome:"BAT",             regione:"Puglia",                 zona_sismica:3, pga:0.075, pop:95000,   perc_pre1981:54, perc_muratura:28, pil_provincia:7.0,   siti_unesco:0},
    {nome:"Brindisi",        regione:"Puglia",                 zona_sismica:3, pga:0.05,  pop:88000,   perc_pre1981:50, perc_muratura:22, pil_provincia:7.0,   siti_unesco:0},
    {nome:"Foggia",          regione:"Puglia",                 zona_sismica:2, pga:0.15,  pop:152000,  perc_pre1981:56, perc_muratura:30, pil_provincia:10.0,  siti_unesco:1},
    {nome:"Lecce",           regione:"Puglia",                 zona_sismica:3, pga:0.05,  pop:96000,   perc_pre1981:52, perc_muratura:25, pil_provincia:7.5,   siti_unesco:0},
    {nome:"Taranto",         regione:"Puglia",                 zona_sismica:3, pga:0.05,  pop:200000,  perc_pre1981:54, perc_muratura:25, pil_provincia:12.0,  siti_unesco:0},
    /* Sardegna */
    {nome:"Cagliari",        regione:"Sardegna",               zona_sismica:4, pga:0.025, pop:150000,  perc_pre1981:50, perc_muratura:20, pil_provincia:12.0,  siti_unesco:0},
    {nome:"Nuoro",           regione:"Sardegna",               zona_sismica:4, pga:0.025, pop:37000,   perc_pre1981:52, perc_muratura:20, pil_provincia:3.5,   siti_unesco:0},
    {nome:"Oristano",        regione:"Sardegna",               zona_sismica:4, pga:0.025, pop:31000,   perc_pre1981:50, perc_muratura:20, pil_provincia:3.0,   siti_unesco:0},
    {nome:"Sassari",         regione:"Sardegna",               zona_sismica:4, pga:0.025, pop:127000,  perc_pre1981:52, perc_muratura:20, pil_provincia:9.0,   siti_unesco:0},
    {nome:"Sud Sardegna",    regione:"Sardegna",               zona_sismica:4, pga:0.025, pop:100000,  perc_pre1981:50, perc_muratura:20, pil_provincia:7.0,   siti_unesco:0},
    /* Sicilia */
    {nome:"Agrigento",       regione:"Sicilia",                zona_sismica:2, pga:0.175, pop:59000,   perc_pre1981:56, perc_muratura:32, pil_provincia:5.5,   siti_unesco:1},
    {nome:"Caltanissetta",   regione:"Sicilia",                zona_sismica:2, pga:0.15,  pop:63000,   perc_pre1981:54, perc_muratura:30, pil_provincia:5.0,   siti_unesco:0},
    {nome:"Catania",         regione:"Sicilia",                zona_sismica:1, pga:0.275, pop:311000,  perc_pre1981:58, perc_muratura:40, pil_provincia:18.0,  siti_unesco:1},
    {nome:"Enna",            regione:"Sicilia",                zona_sismica:2, pga:0.15,  pop:28000,   perc_pre1981:55, perc_muratura:30, pil_provincia:2.8,   siti_unesco:0},
    {nome:"Messina",         regione:"Sicilia",                zona_sismica:1, pga:0.30,  pop:232000,  perc_pre1981:60, perc_muratura:42, pil_provincia:14.0,  siti_unesco:0},
    {nome:"Palermo",         regione:"Sicilia",                zona_sismica:2, pga:0.175, pop:650000,  perc_pre1981:58, perc_muratura:35, pil_provincia:30.0,  siti_unesco:1},
    {nome:"Ragusa",          regione:"Sicilia",                zona_sismica:2, pga:0.175, pop:73000,   perc_pre1981:54, perc_muratura:30, pil_provincia:6.0,   siti_unesco:1},
    {nome:"Siracusa",        regione:"Sicilia",                zona_sismica:1, pga:0.25,  pop:122000,  perc_pre1981:56, perc_muratura:38, pil_provincia:10.0,  siti_unesco:1},
    {nome:"Trapani",         regione:"Sicilia",                zona_sismica:2, pga:0.15,  pop:69000,   perc_pre1981:54, perc_muratura:30, pil_provincia:6.0,   siti_unesco:1},
    /* Toscana */
    {nome:"Arezzo",          regione:"Toscana",                zona_sismica:3, pga:0.10,  pop:100000,  perc_pre1981:52, perc_muratura:28, pil_provincia:8.5,   siti_unesco:0},
    {nome:"Firenze",         regione:"Toscana",                zona_sismica:3, pga:0.075, pop:380000,  perc_pre1981:55, perc_muratura:30, pil_provincia:35.0,  siti_unesco:1},
    {nome:"Grosseto",        regione:"Toscana",                zona_sismica:3, pga:0.075, pop:82000,   perc_pre1981:52, perc_muratura:28, pil_provincia:6.5,   siti_unesco:0},
    {nome:"Livorno",         regione:"Toscana",                zona_sismica:3, pga:0.05,  pop:158000,  perc_pre1981:52, perc_muratura:25, pil_provincia:10.0,  siti_unesco:0},
    {nome:"Lucca",           regione:"Toscana",                zona_sismica:3, pga:0.10,  pop:89000,   perc_pre1981:54, perc_muratura:28, pil_provincia:8.0,   siti_unesco:0},
    {nome:"Massa-Carrara",   regione:"Toscana",                zona_sismica:2, pga:0.15,  pop:69000,   perc_pre1981:56, perc_muratura:32, pil_provincia:5.5,   siti_unesco:0},
    {nome:"Pisa",            regione:"Toscana",                zona_sismica:3, pga:0.075, pop:91000,   perc_pre1981:52, perc_muratura:28, pil_provincia:9.0,   siti_unesco:1},
    {nome:"Pistoia",         regione:"Toscana",                zona_sismica:3, pga:0.10,  pop:93000,   perc_pre1981:52, perc_muratura:28, pil_provincia:8.5,   siti_unesco:0},
    {nome:"Prato",           regione:"Toscana",                zona_sismica:3, pga:0.075, pop:192000,  perc_pre1981:50, perc_muratura:25, pil_provincia:12.0,  siti_unesco:0},
    {nome:"Siena",           regione:"Toscana",                zona_sismica:3, pga:0.10,  pop:54000,   perc_pre1981:54, perc_muratura:28, pil_provincia:7.0,   siti_unesco:1},
    /* Trentino-A.A. */
    {nome:"Bolzano",         regione:"Trentino-A.A.",          zona_sismica:4, pga:0.05,  pop:107000,  perc_pre1981:48, perc_muratura:20, pil_provincia:15.0,  siti_unesco:0},
    {nome:"Trento",          regione:"Trentino-A.A.",          zona_sismica:3, pga:0.10,  pop:118000,  perc_pre1981:48, perc_muratura:22, pil_provincia:18.0,  siti_unesco:0},
    /* Umbria */
    {nome:"Perugia",         regione:"Umbria",                 zona_sismica:2, pga:0.20,  pop:166000,  perc_pre1981:58, perc_muratura:35, pil_provincia:14.0,  siti_unesco:0},
    {nome:"Terni",           regione:"Umbria",                 zona_sismica:2, pga:0.20,  pop:111000,  perc_pre1981:56, perc_muratura:32, pil_provincia:9.0,   siti_unesco:0},
    /* Valle d'Aosta */
    {nome:"Aosta",           regione:"Valle d'Aosta",          zona_sismica:3, pga:0.075, pop:35000,   perc_pre1981:50, perc_muratura:25, pil_provincia:4.0,   siti_unesco:0},
    /* Veneto */
    {nome:"Belluno",         regione:"Veneto",                 zona_sismica:2, pga:0.15,  pop:36000,   perc_pre1981:50, perc_muratura:28, pil_provincia:4.0,   siti_unesco:1},
    {nome:"Padova",          regione:"Veneto",                 zona_sismica:3, pga:0.075, pop:210000,  perc_pre1981:50, perc_muratura:25, pil_provincia:18.0,  siti_unesco:1},
    {nome:"Rovigo",          regione:"Veneto",                 zona_sismica:3, pga:0.075, pop:51000,   perc_pre1981:50, perc_muratura:22, pil_provincia:5.0,   siti_unesco:0},
    {nome:"Treviso",         regione:"Veneto",                 zona_sismica:3, pga:0.075, pop:84000,   perc_pre1981:48, perc_muratura:22, pil_provincia:9.0,   siti_unesco:0},
    {nome:"Venezia",         regione:"Veneto",                 zona_sismica:4, pga:0.025, pop:255000,  perc_pre1981:62, perc_muratura:30, pil_provincia:20.0,  siti_unesco:1},
    {nome:"Verona",          regione:"Veneto",                 zona_sismica:3, pga:0.10,  pop:259000,  perc_pre1981:50, perc_muratura:25, pil_provincia:22.0,  siti_unesco:1},
    {nome:"Vicenza",         regione:"Veneto",                 zona_sismica:3, pga:0.075, pop:112000,  perc_pre1981:50, perc_muratura:22, pil_provincia:12.0,  siti_unesco:1},
  ];

  /* ── Calcolo indici per una città ── */
  function calcIndici(c) {
    /* Vulnerabilità (0-1 → scala 1-10) */
    const vuln_raw = (c.perc_pre1981 / 100 * 0.5) + (c.perc_muratura / 100 * 0.5);
    const vuln = Math.round(vuln_raw * 10 * 10) / 10;

    /* Valore esposto (0-1 → scala 1-10) */
    const expo_raw = (c.pop / 3000000 * 0.5)
                   + (Math.min(c.pil_provincia, 50) / 50 * 0.3)
                   + (Math.min(c.siti_unesco, 5) / 5 * 0.2);
    const expo = Math.max(1, Math.min(10, expo_raw * 15));

    /* Pericolosità: zona 1→10, zona 2→7.5, zona 3→5, zona 4→2.5 */
    const peri = (5 - c.zona_sismica) * 2.5;

    /* Rischio totale: media geometrica normalizzata */
    const r = Math.pow(peri * Math.max(1, vuln) * Math.max(1, expo), 1 / 3);
    const rischio = Math.max(1, Math.min(10, r));

    return {
      pericolosita:  peri,
      vulnerabilita: Math.max(1, vuln),
      valore_esposto: Math.max(1, expo),
      rischio_totale: rischio
    };
  }

  /* ── Testo livello rischio ── */
  function riskLevelText(r) {
    if (r >= 9) return 'Molto alto';
    if (r >= 7) return 'Alto';
    if (r >= 5) return 'Medio';
    if (r >= 3) return 'Medio-basso';
    return 'Basso';
  }

  /* ── Interpolazione colore per rischio ── */
  function s5_hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  function s5_lerpHex(a, b, t) {
    const [r1, g1, b1] = s5_hexToRgb(a);
    const [r2, g2, b2] = s5_hexToRgb(b);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  }

  function riskArcColor(r10) {
    /* r10 in [1,10] → [0,1] */
    const t = (r10 - 1) / 9;
    if (t <= 0.5) return s5_lerpHex('#2d8f4e', '#D4893A', t * 2);
    return s5_lerpHex('#D4893A', '#8B1A1A', (t - 0.5) * 2);
  }

  /* ── Disegna cerchio di rischio su canvas ── */
  function drawRiskCircle(canvasEl, r10) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width;
    const h = canvasEl.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0, 0, w, h);

    /* Arco grigio di sfondo (cerchio completo) */
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 8;
    ctx.stroke();

    /* Arco colorato proporzionale al rischio */
    const fraction = r10 / 10;
    const startAngle = -Math.PI / 2;
    const endAngle   = startAngle + fraction * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = riskArcColor(r10);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* Numero centrale */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 2rem "Cormorant Garamond", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(r10.toFixed(1), cx, cy);
  }

  /* ── Render dati città in un pannello ── */
  function s5_renderCity(cityData, side) {
    if (!cityData) return;
    const idx = calcIndici(cityData);

    /* Barre */
    const periBar   = document.getElementById('s5-peri-' + side);
    const vulnBar   = document.getElementById('s5-vuln-' + side);
    const expoBar   = document.getElementById('s5-expo-' + side);
    const periLbl   = document.getElementById('s5-peri-label-' + side);
    const vulnLbl   = document.getElementById('s5-vuln-label-' + side);
    const expoLbl   = document.getElementById('s5-expo-label-' + side);
    const riskLbl   = document.getElementById('s5-risk-label-' + side);
    const riskCircle = document.getElementById('s5-risk-circle-' + side);

    /* Larghezze in percentuale (scala 1-10 → 10-100%) */
    if (periBar)  periBar.style.width  = (idx.pericolosita   / 10 * 100) + '%';
    if (vulnBar)  vulnBar.style.width  = (idx.vulnerabilita  / 10 * 100) + '%';
    if (expoBar)  expoBar.style.width  = (idx.valore_esposto / 10 * 100) + '%';

    /* Etichette numeriche */
    if (periLbl)  periLbl.textContent  = idx.pericolosita.toFixed(1)   + ' / 10';
    if (vulnLbl)  vulnLbl.textContent  = idx.vulnerabilita.toFixed(1)  + ' / 10';
    if (expoLbl)  expoLbl.textContent  = idx.valore_esposto.toFixed(1) + ' / 10';

    /* Etichetta rischio */
    if (riskLbl) riskLbl.textContent = riskLevelText(idx.rischio_totale);

    /* Cerchio rischio */
    drawRiskCircle(riskCircle, idx.rischio_totale);

    return idx;
  }

  /* ── Aggiorna pannello di confronto ── */
  function s5_updateCompare() {
    const selCityA  = document.getElementById('s5-city-a');
    const selCityB  = document.getElementById('s5-city-b');
    if (!selCityA || !selCityB) return;

    const cityA = S5_CITIES.find(c => c.nome === selCityA.value);
    const cityB = S5_CITIES.find(c => c.nome === selCityB.value);
    if (!cityA || !cityB) return;

    const idxA = calcIndici(cityA);
    const idxB = calcIndici(cityB);

    const compareText  = document.getElementById('s5-compare-text');
    const compareArrow = document.getElementById('s5-compare-arrow');
    const compareDesc  = document.getElementById('s5-compare-desc');

    const diff = idxA.rischio_totale - idxB.rischio_totale;
    const pct  = idxB.rischio_totale > 0
      ? Math.abs(diff / idxB.rischio_totale * 100).toFixed(0)
      : '—';

    if (Math.abs(diff) < 0.15) {
      if (compareText)  compareText.textContent  = 'Rischio simile nelle due città';
      if (compareArrow) compareArrow.textContent = '↔';
    } else if (diff > 0) {
      if (compareText)  compareText.textContent  = `CITTÀ A ha il ${pct}% di rischio in più rispetto a CITTÀ B`;
      if (compareArrow) compareArrow.textContent = '↑';
    } else {
      if (compareText)  compareText.textContent  = `CITTÀ B ha il ${pct}% di rischio in più rispetto a CITTÀ A`;
      if (compareArrow) compareArrow.textContent = '↓';
    }

    /* Descrizione zone sismiche */
    const zonaDesc = (z) => {
      const nomi = ['', 'Zona 1 — Massima pericolosità', 'Zona 2 — Media-alta', 'Zona 3 — Media-bassa', 'Zona 4 — Bassa pericolosità'];
      return nomi[z] || '';
    };
    if (compareDesc) {
      compareDesc.textContent = `${cityA.nome}: ${zonaDesc(cityA.zona_sismica)}\n${cityB.nome}: ${zonaDesc(cityB.zona_sismica)}`;
      compareDesc.style.whiteSpace = 'pre-line';
    }
  }

  /* ── Popola select regioni ── */
  function buildRegionSelect(selectEl, defaultRegion) {
    const regions = [...new Set(S5_CITIES.map(c => c.regione))].sort();
    selectEl.innerHTML = '';
    regions.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      if (r === defaultRegion) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  /* ── Popola select città filtrata per regione ── */
  function buildCitySelect(selectEl, region, defaultCity) {
    const cities = S5_CITIES.filter(c => c.regione === region);
    selectEl.innerHTML = '';
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nome;
      opt.textContent = c.nome;
      if (c.nome === defaultCity) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  /* ── Ottieni dati città selezionata ── */
  function getSelectedCity(side) {
    const sel = document.getElementById('s5-city-' + side);
    if (!sel) return null;
    return S5_CITIES.find(c => c.nome === sel.value) || null;
  }

  /* ── Setup panel: regione + città ── */
  function setupPanel(side, defaultRegion, defaultCity) {
    const selRegion = document.getElementById('s5-region-' + side);
    const selCity   = document.getElementById('s5-city-'   + side);
    if (!selRegion || !selCity) return;

    buildRegionSelect(selRegion, defaultRegion);
    buildCitySelect(selCity, defaultRegion, defaultCity);

    /* Cambio regione → aggiorna città */
    selRegion.addEventListener('change', function() {
      buildCitySelect(selCity, selRegion.value, null);
      /* Seleziona prima città della regione */
      const firstCity = S5_CITIES.find(c => c.regione === selRegion.value);
      if (firstCity) {
        s5_renderCity(firstCity, side);
        s5_updateCompare();
      }
    });

    /* Cambio città → aggiorna indicatori */
    selCity.addEventListener('change', function() {
      const city = getSelectedCity(side);
      if (city) {
        s5_renderCity(city, side);
        s5_updateCompare();
      }
    });

    /* Render iniziale */
    s5_renderCity(S5_CITIES.find(c => c.nome === defaultCity) || S5_CITIES[0], side);
  }

  /* ── Inizializzazione ── */
  setupPanel('a', 'Abruzzo',   "L'Aquila");
  setupPanel('b', 'Lombardia', 'Milano');
  s5_updateCompare();
}

/* ─── JS SLIDE 4-6 + IIFE CAROSELLO (Parte C) ─── */
/* Dichiarato globalmente così le funzioni di init nelle parti A, B, C
   possono accedervi e il carosello IIFE può scrivere il proprio stato su di esso */
var S5 = {};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   s5_initSlide4 — "E se avessimo costruito meglio?"
   Wiring del range slider qualità edifici con aggiornamento
   metriche animate e visualizzazione SVG edifici.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function s5_initSlide4() {

    /* Dati per ogni posizione slider (1–5):
       [vittime%, edifici%, costo%, mcs_label] */
    var S4_DATA = {
        1: { vittime: 100, edifici: 100, costo: 100, mcs: 'IX–X',    label: 'Medievale non consolidato' },
        2: { vittime:  55, edifici:  70, costo:  72, mcs: 'VIII–IX', label: 'Muratura semplice anni \'50' },
        3: { vittime:  35, edifici:  45, costo:  48, mcs: 'VII–VIII', label: 'Cemento armato anni \'80' },
        4: { vittime:  15, edifici:  20, costo:  22, mcs: 'VI–VII',  label: 'Costruzione moderna standard' },
        5: { vittime:   3, edifici:   6, costo:   9, mcs: 'VI',      label: 'Antisismico certificato' }
    };

    /* Colore metrica in base alla percentuale (100→blood, 3→verde) */
    function _coloreMetrica(pct) {
        if (pct >= 80) return '#8B1A1A';       /* --blood */
        if (pct >= 55) return '#C4612A';       /* --terracotta */
        if (pct >= 30) return '#D4893A';       /* --ochre */
        if (pct >= 10) return '#888820';       /* giallo-verde */
        return '#4CAF50';                      /* verde */
    }

    /* Colore MCS */
    function _coloreMCS(mcs) {
        if (mcs === 'IX–X')    return '#8B1A1A';
        if (mcs === 'VIII–IX') return '#C4612A';
        if (mcs === 'VII–VIII') return '#D4893A';
        if (mcs === 'VI–VII')  return '#888820';
        return '#4CAF50';
    }

    /* Aggiorna la visualizzazione per la posizione slider pos (1–5) */
    function s5_updateSlide4(pos) {
        var d = S4_DATA[pos];
        if (!d) return;

        /* Label grande corrente */
        var labelEl = document.getElementById('s5-slider-label');
        if (labelEl) labelEl.textContent = d.label;

        /* Labels slider: evidenzia quella attiva */
        var labelSpans = document.querySelectorAll('.s5-slider-labels span');
        labelSpans.forEach(function(sp, i) {
            sp.classList.toggle('s5-label-active', i === (pos - 1));
        });

        /* Aggiorna ogni metrica con animazione counter breve */
        _aggiornaMetrica('s5-val-vittime', 's5-bar-vittime', d.vittime, d.vittime + '%', _coloreMetrica(d.vittime));
        _aggiornaMetrica('s5-val-edifici', 's5-bar-edifici', d.edifici, d.edifici + '%', _coloreMetrica(d.edifici));
        _aggiornaMetrica('s5-val-costo',   's5-bar-costo',   d.costo,   d.costo   + '%', _coloreMetrica(d.costo));

        /* MCS: valore romano speciale */
        var mcsValEl = document.getElementById('s5-val-mcs');
        var mcsBarEl = document.getElementById('s5-bar-mcs');
        var mcsColor = _coloreMCS(d.mcs);
        if (mcsValEl) {
            mcsValEl.textContent = d.mcs;
            mcsValEl.style.color = mcsColor;
        }
        /* Altezza barra MCS: da 90% (pos1) a 30% (pos5) */
        var mcsBarH = [90, 72, 52, 38, 25][pos - 1];
        if (mcsBarEl) {
            mcsBarEl.style.height = mcsBarH + '%';
            mcsBarEl.style.background = mcsColor;
        }

        /* Stato edifici SVG: mostra solo quello corrispondente */
        var states = document.querySelectorAll('.s5-building-state');
        states.forEach(function(el) {
            el.classList.toggle('active', el.getAttribute('data-state') === String(pos));
        });
    }

    /* Aggiorna un singolo blocco metrica con breve animazione */
    function _aggiornaMetrica(valId, barId, pct, displayText, color) {
        var valEl = document.getElementById(valId);
        var barEl = document.getElementById(barId);
        if (valEl) {
            valEl.textContent = displayText;
            valEl.style.color = color;
        }
        if (barEl) {
            barEl.style.height = pct + '%';
            barEl.style.background = color;
        }
    }

    /* Wiring slider */
    var slider = document.getElementById('s5-building-slider');
    if (slider) {
        slider.addEventListener('input', function() {
            s5_updateSlide4(parseInt(this.value));
        });
        /* Stato iniziale */
        s5_updateSlide4(parseInt(slider.value) || 1);
    }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   s5_initSlide5 — Mappa pericolosità INGV annotata
   Nessuna logica interattiva complessa: la slide è
   prevalentemente statica con immagine + SVG overlay.
   Si occupa solo di eventuali correzioni al fallback.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function s5_initSlide5() {
    if (typeof L === 'undefined') return;
    var mapEl = document.getElementById('s5-zone-map');
    if (!mapEl || mapEl._leaflet_id) return;

    var ZONE_FILL = {1:'rgba(139,26,26,0.72)',2:'rgba(196,97,42,0.60)',3:'rgba(212,137,58,0.38)',4:'rgba(88,160,88,0.26)'};
    var ZONE_LABEL = {1:'Zona 1 — Massima pericolosità',2:'Zona 2 — Alta',3:'Zona 3 — Media',4:'Zona 4 — Bassa'};
    var PZ = {
        AQ:1,CH:2,PE:2,TE:2,PZ:1,MT:2,CZ:1,CS:2,KR:2,RC:1,VV:1,
        AV:1,BN:1,CE:2,NA:2,SA:2,BO:3,FE:3,FC:3,MO:3,PR:3,PC:3,RA:3,RE:3,RN:3,
        GO:2,PN:2,TS:2,UD:2,FR:2,LT:3,RI:2,RM:3,VT:3,GE:3,IM:3,SP:3,SV:3,
        BG:3,BS:3,CO:4,CR:3,LC:3,LO:3,MN:3,MI:4,MB:4,PV:3,SO:3,VA:4,
        AN:2,AP:2,FM:2,MC:2,PU:2,CB:1,IS:1,AL:3,AT:3,BI:3,CN:3,NO:4,TO:4,VB:3,VC:4,
        BA:3,BT:3,BR:3,FG:2,LE:3,TA:3,CA:4,NU:4,OR:4,SS:4,SU:4,
        AG:2,CL:2,CT:1,EN:2,ME:1,PA:2,RG:2,SR:1,TP:2,
        AR:3,FI:3,GR:3,LI:3,LU:3,MS:2,PI:3,PT:3,PO:3,SI:3,BZ:4,TN:3,
        PG:2,TR:2,AO:3,BL:2,PD:3,RO:3,TV:3,VE:4,VR:3,VI:3
    };

    var map = L.map('s5-zone-map', {
        scrollWheelZoom: true, zoomControl: true, attributionControl: false, preferCanvas: true
    });
    map.fitBounds([[35.0, 6.0], [47.5, 19.0]]);
    map.zoomControl.setPosition('bottomright');

    var zonesLayer = null;
    var statusEl = document.getElementById('s5-api-status');

    fetch('assets/provinces.geojson')
        .then(function(r) { return r.json(); })
        .then(function(gj) {
            zonesLayer = L.geoJSON(gj, {
                style: function(f) {
                    var z = PZ[f.properties.prov_acr] || 3;
                    return { fillColor: ZONE_FILL[z], fillOpacity: 1, color: 'rgba(245,237,224,0.07)', weight: 0.6 };
                },
                onEachFeature: function(f, layer) {
                    var acr  = f.properties.prov_acr  || '';
                    var name = f.properties.prov_name || '';
                    var z = PZ[acr] || 3;
                    layer.bindTooltip(
                        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:0.7rem;letter-spacing:0.1em">' +
                        '<strong>' + name + '</strong> (' + acr + ')<br>' +
                        '<span style="color:' + ZONE_FILL[z].replace(/[\d.]+\)$/, '1)') + '">' + ZONE_LABEL[z] + '</span></span>',
                        { sticky: true, offset: [10, 0] }
                    );
                    layer.on('mouseover', function() { this.setStyle({ weight: 1.5, color: 'rgba(245,237,224,0.35)' }); });
                    layer.on('mouseout',  function() { zonesLayer && zonesLayer.resetStyle(this); });
                }
            }).addTo(map);
        })
        .catch(function() {
            if (statusEl) { statusEl.textContent = 'Province non disponibili'; statusEl.style.display = 'block'; }
        });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Nota: s5_initSlide6 non necessaria — slide 6 è statica.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   IIFE CAROSELLO S5
   Replica il pattern del carosello S4 con adattamenti S5.
   Deve essere l'ULTIMO blocco del file: le funzioni
   s5_initSlide1–5 (definite nelle parti A, B e in questo
   blocco) sono disponibili nello scope globale.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
(function() {
    'use strict';

    /* S5 è già dichiarato globalmente sopra */
    S5.currentSlide = 0;

    var TOTAL = 6;
    var s5Idx  = 0;
    var s5Anim = false;

    /* Riferimenti DOM */
    var s5section = document.getElementById('s-section5');
    var s5track   = document.getElementById('s5-track');
    var s5prev    = document.getElementById('s5-prev');
    var s5next    = document.getElementById('s5-next');
    var s5dots    = document.querySelectorAll('.s5-dot');
    var s5counter = document.getElementById('s5-counter');

    /* Inietta il contenuto dei template HTML nelle slide placeholder.
       Questa fase avviene una sola volta, prima che il carosello venga
       usato. I template sono definiti nel documento (in questa parte C). */
    function s5_injectTemplates() {
        /* Slide 4 */
        var tpl4  = document.getElementById('s5-s4-template');
        var slot4 = document.getElementById('s5-s4');
        if (tpl4 && slot4 && !slot4.hasChildNodes()) {
            slot4.appendChild(tpl4.content.cloneNode(true));
        }
        /* Slide 5 */
        var tpl5  = document.getElementById('s5-s5-template');
        var slot5 = document.getElementById('s5-s5');
        if (tpl5 && slot5 && !slot5.hasChildNodes()) {
            slot5.appendChild(tpl5.content.cloneNode(true));
        }
        /* Slide 6 */
        var tpl6  = document.getElementById('s5-s6-template');
        var slot6 = document.getElementById('s5-s6');
        if (tpl6 && slot6 && !slot6.hasChildNodes()) {
            slot6.appendChild(tpl6.content.cloneNode(true));
        }
    }

    /* Naviga alla slide idx con o senza animazione */
    function s5goTo(idx, animate) {
        if (idx < 0 || idx >= TOTAL) return;
        s5Anim = true;

        if (animate === false) {
            /* Navigazione istantanea (usata all'avvio) */
            s5track.style.transition = 'none';
            s5track.style.transform  = 'translateX(calc(' + idx + ' * -100vw))';
            requestAnimationFrame(function() {
                s5track.style.transition = '';
                s5Anim = false;
            });
        } else {
            s5track.style.transform = 'translateX(calc(' + idx + ' * -100vw))';
            setTimeout(function() { s5Anim = false; }, 600);
        }

        s5Idx = idx;
        S5.currentSlide = idx;  /* aggiorna stato globale */
        s5updateUI();
        s5onEnter(idx);
    }

    /* Aggiorna dots, counter, frecce */
    function s5updateUI() {
        s5dots.forEach(function(d, j) {
            d.classList.toggle('active', j === s5Idx);
        });
        if (s5counter) {
            /* Formatto "01 / 06" con padding */
            var cur  = String(s5Idx + 1).padStart(2, '0');
            var tot  = String(TOTAL).padStart(2, '0');
            s5counter.textContent = cur + ' / ' + tot;
        }
        if (s5prev) s5prev.disabled = (s5Idx === 0);
        if (s5next) s5next.disabled = (s5Idx === TOTAL - 1);
    }

    /* ── Intercetta wheel per navigazione orizzontale ── */
    s5section.addEventListener('wheel', function(e) {
        var goingDown = e.deltaY > 0;
        var goingUp   = e.deltaY < 0;
        /* Se siamo all'ultima slide, lascia passare lo scroll verso il basso
           per consentire la navigazione verticale alla sezione successiva */
        if (goingDown && s5Idx === TOTAL - 1) return;
        /* Idem per la prima slide: lascia passare scroll verso l'alto */
        if (goingUp   && s5Idx === 0)         return;
        e.preventDefault();
        e.stopPropagation();
        if (s5Anim) return;
        if (goingDown) s5goTo(s5Idx + 1);
        else           s5goTo(s5Idx - 1);
    }, { passive: false });

    /* ── Touch swipe orizzontale ── */
    var s5touchX = 0;
    s5section.addEventListener('touchstart', function(e) {
        s5touchX = e.touches[0].clientX;
    }, { passive: true });
    s5section.addEventListener('touchend', function(e) {
        if (s5Anim) return;
        var dx = e.changedTouches[0].clientX - s5touchX;
        if (dx < -50)      s5goTo(s5Idx + 1);
        else if (dx > 50)  s5goTo(s5Idx - 1);
    });

    /* ── Frecce cliccabili ── */
    if (s5prev) s5prev.addEventListener('click', function() { s5goTo(s5Idx - 1); });
    if (s5next) s5next.addEventListener('click', function() { s5goTo(s5Idx + 1); });

    /* ── Dots cliccabili ── */
    s5dots.forEach(function(d, i) {
        d.addEventListener('click', function() { s5goTo(i); });
    });

    /* ── Tastiera: â†→ navigano la sezione se è in vista ── */
    document.addEventListener('keydown', function(e) {
        if (!s5section) return;
        var rect = s5section.getBoundingClientRect();
        /* Considera la sezione "in vista" se il suo top è vicino allo zero */
        if (Math.abs(rect.top) > 50) return;
        if (e.key === 'ArrowRight' && s5Idx < TOTAL - 1) {
            e.preventDefault();
            s5goTo(s5Idx + 1);
        } else if (e.key === 'ArrowLeft' && s5Idx > 0) {
            e.preventDefault();
            s5goTo(s5Idx - 1);
        }
    });

    /* ── Lazy init: ogni slide viene inizializzata la prima volta che è visitata ── */
    var s5triggered = new Set();

    function s5onEnter(idx) {
        if (s5triggered.has(idx)) return;
        s5triggered.add(idx);

        /* Dispatch alle funzioni di init definite nelle parti A, B e C */
        if (idx === 0 && typeof s5_initSlide1 === 'function') s5_initSlide1();
        if (idx === 1 && typeof s5_initSlide2 === 'function') s5_initSlide2();
        if (idx === 2 && typeof s5_initSlide3 === 'function') s5_initSlide3();
        if (idx === 3 && typeof s5_initSlide4 === 'function') s5_initSlide4();
        if (idx === 4 && typeof s5_initSlide5 === 'function') s5_initSlide5();
        /* Slide 6 è statica, nessun init necessario */
    }

    /* ── Bootstrap: inietta i template e naviga alla slide 0 ── */
    s5_injectTemplates();
    s5goTo(0, false);

})();