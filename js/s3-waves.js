      /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         SEZIONE 3 — LE ONDE SISMICHE
         IIFE isolato, namespace S3
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
      const S3 = (function() {
        'use strict';

        const TOTAL = 10;
        let currentIdx = 0;
        let isAnimating = false;
        const triggered = new Set();

        const section  = document.getElementById('s-section3');
        const track    = document.getElementById('s3-track');
        const prevBtn  = document.getElementById('s3-prev');
        const nextBtn  = document.getElementById('s3-next');
        const counter  = document.getElementById('s3-counter');
        const dots     = document.querySelectorAll('#s3-dots-row .s3-dot');

        /* ── Navigazione ── */
        function goTo(idx, animate) {
          if (idx < 0 || idx >= TOTAL) return;
          isAnimating = true;
          if (animate === false) {
            track.style.transition = 'none';
            track.style.transform = `translateX(calc(${idx} * -100vw))`;
            requestAnimationFrame(() => { track.style.transition = ''; isAnimating = false; });
          } else {
            track.style.transform = `translateX(calc(${idx} * -100vw))`;
            track.addEventListener('transitionend', () => { isAnimating = false; }, { once: true });
            setTimeout(() => { isAnimating = false; }, 700);
          }
          currentIdx = idx;
          dots.forEach((d, i) => d.classList.toggle('active', i === idx));
          if (counter) counter.textContent = String(idx + 1).padStart(2,'0') + ' · ' + String(TOTAL).padStart(2,'0');
          if (prevBtn) prevBtn.disabled = idx === 0;
          if (nextBtn) nextBtn.disabled = idx === TOTAL - 1;
          onEnter(idx);
        }

        function onEnter(idx) {
          if (triggered.has(idx)) return;
          triggered.add(idx);
          if (idx === 0) initSlide1();
          if (idx === 2) initSlide3();
          if (idx === 3) initSlide4();
          if (idx === 4) initSlide5();
          if (idx === 5) initSlide6();
          if (idx === 6) initSlide7();
          if (idx === 7) initSlide8();
          if (idx === 8) initSlide9();
        }

        /* ── Wheel ── */
        section.addEventListener('wheel', function(e) {
          const goingDown = e.deltaY > 0;
          const goingUp   = e.deltaY < 0;
          if (goingDown && currentIdx === TOTAL - 1) return;
          if (goingUp   && currentIdx === 0)         return;
          e.preventDefault(); e.stopPropagation();
          if (isAnimating) return;
          goingDown ? goTo(currentIdx + 1) : goTo(currentIdx - 1);
        }, { passive: false });

        /* ── Touch ── */
        let touchX = 0;
        section.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
        section.addEventListener('touchend', e => {
          if (isAnimating) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (dx < -50) goTo(currentIdx + 1);
          else if (dx > 50) goTo(currentIdx - 1);
        });

        /* ── Frecce + Dots ── */
        if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIdx + 1));
        dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

        /* ── Tastiera ── */
        document.addEventListener('keydown', e => {
          const rect = section.getBoundingClientRect();
          if (Math.abs(rect.top) > 50) return;
          if (e.key === 'ArrowRight' && currentIdx < TOTAL - 1) { e.preventDefault(); goTo(currentIdx + 1); }
          else if (e.key === 'ArrowLeft' && currentIdx > 0)      { e.preventDefault(); goTo(currentIdx - 1); }
        });

        /* â•â•â•â•â•â• UTILITY CANVAS â•â•â•â•â•â• */
        function resizeCv(cv) {
          const p = cv.parentElement;
          cv.width  = p.clientWidth  || p.offsetWidth;
          cv.height = p.clientHeight || p.offsetHeight;
        }

        function makeGrid(cols, rows, W, H) {
          const pts = [];
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              pts.push({ bx: (c + 0.5) / cols * W, by: (r + 0.5) / rows * H });
          return pts;
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           SLIDE 1 — Propagazione L'Aquila
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        function initSlide1() {
          const canL = document.getElementById('s3-c1-top');
          const canR = document.getElementById('s3-c1-sec');
          if (!canL || !canR) return;
          const ctxL = canL.getContext('2d');
          const ctxR = canR.getContext('2d');

          function resize() { resizeCv(canL); resizeCv(canR); }
          resize();
          window.addEventListener('resize', resize);

          const SC = 0.85;
          const cities = [
            { n: 'ROMA',    dx: -88*SC, dy:  62*SC, blink: 0 },
            { n: 'PESCARA', dx:  82*SC, dy:  20*SC, blink: 0 },
            { n: 'TERAMO',  dx: -12*SC, dy: -46*SC, blink: 0 },
          ];

          let waves  = [];
          let wavesR = [];
          let frame  = 0;
          let paused = false;

          const SPAWN = 110;
          const MAX_R = 420;

          function spawnPair() {
            waves.push(
              { r:0, sp:1.8,  col:'#C4612A', lw:1.5, type:'P'    },
              { r:0, sp:1.08, col:'#3A7EC4', lw:2.5, type:'S'    },
              { r:0, sp:0.84, col:'#D4893A', lw:1.5, type:'surf' }
            );
            wavesR.push(
              { r:0, sp:1.8,  col:'#C4612A', lw:1.5, type:'P', surfaced:false, surfOff:0 },
              { r:0, sp:1.08, col:'#3A7EC4', lw:2.5, type:'S' }
            );
          }

          function drawLeft() {
            const W = canL.width, H = canL.height;
            ctxL.clearRect(0, 0, W, H);
            ctxL.fillStyle = '#06060f';
            ctxL.fillRect(0, 0, W, H);

            const ex = W * 0.5, ey = H * 0.45;

            ctxL.save();
            ctxL.beginPath();
            ctxL.ellipse(ex, ey, W*0.42, H*0.38, 0, 0, Math.PI*2);
            ctxL.fillStyle = 'rgba(26,26,46,0.5)';
            ctxL.fill();
            ctxL.restore();

            waves.forEach(w => {
              if (w.r <= 0) return;
              const alpha = Math.max(0, 1 - w.r / MAX_R);
              ctxL.beginPath();
              ctxL.arc(ex, ey, w.r, 0, Math.PI*2);
              ctxL.strokeStyle = w.col + Math.round(alpha*220).toString(16).padStart(2,'0');
              ctxL.lineWidth = w.lw;
              ctxL.stroke();
            });

            const head = { P: null, S: null, surf: null };
            waves.forEach(w => {
              if (w.type in head && (!head[w.type] || w.r > head[w.type].r)) head[w.type] = w;
            });
            ctxL.font = '400 8px "JetBrains Mono", monospace';
            [
              { t:'P',    ang:-Math.PI*0.35, label:'P · 6 km/s'       },
              { t:'S',    ang:-Math.PI*0.27, label:'S · 3,6 km/s'      },
              { t:'surf', ang:-Math.PI*0.18, label:'Superficiali'       },
            ].forEach(({ t, ang, label }) => {
              const w = head[t];
              if (!w || w.r <= 10) return;
              const lx = ex + Math.cos(ang)*w.r + 5, ly = ey + Math.sin(ang)*w.r;
              const alpha = Math.max(0, 1 - w.r/MAX_R);
              ctxL.fillStyle = w.col + Math.round(alpha*190).toString(16).padStart(2,'0');
              ctxL.fillText(label, lx, ly);
            });

            cities.forEach(c => {
              const cx = ex + c.dx, cy = ey + c.dy;
              const bk = c.blink > 0 ? 0.5 + Math.sin(c.blink * 0.4) * 0.5 : 0;
              ctxL.beginPath();
              ctxL.arc(cx, cy, 4, 0, Math.PI*2);
              ctxL.fillStyle = c.blink > 0
                ? `rgba(245,237,224,${0.3 + bk*0.7})`
                : 'rgba(245,237,224,0.3)';
              ctxL.fill();
              ctxL.fillStyle = 'rgba(245,237,224,0.45)';
              ctxL.font = '400 8px "JetBrains Mono", monospace';
              ctxL.fillText(c.n, cx+6, cy+3);
              if (c.blink > 0) c.blink--;
            });

            const pulse = Math.sin(frame * 0.07) * 0.4 + 0.7;
            ctxL.beginPath();
            ctxL.arc(ex, ey, 7 + pulse*3, 0, Math.PI*2);
            ctxL.fillStyle = 'rgba(139,26,26,0.25)';
            ctxL.fill();
            ctxL.beginPath();
            ctxL.arc(ex, ey, 5, 0, Math.PI*2);
            ctxL.fillStyle = '#8B1A1A';
            ctxL.fill();
            ctxL.fillStyle = 'rgba(245,237,224,0.6)';
            ctxL.font = '500 8px "JetBrains Mono", monospace';
            ctxL.fillText("L'AQUILA", ex+8, ey-8);
          }

          function drawRight() {
            const W = canR.width, H = canR.height;
            ctxR.clearRect(0, 0, W, H);

            const KPX = (H - 60) / 15;
            const SY  = 30;
            const IY  = SY + 8.8 * KPX;
            const HX  = W / 2;

            ctxR.fillStyle = '#0e0e16'; ctxR.fillRect(0, 0, W, SY);
            ctxR.fillStyle = '#1a2030'; ctxR.fillRect(0, SY, W, 3*KPX);
            ctxR.fillStyle = '#232d3f'; ctxR.fillRect(0, SY+3*KPX, W, 5*KPX);
            ctxR.fillStyle = '#1c2535'; ctxR.fillRect(0, SY+8*KPX, W, H);

            ctxR.font = '300 8px "JetBrains Mono", monospace';
            ctxR.fillStyle = 'rgba(245,237,224,0.2)';
            ctxR.fillText('0–3 km · sedimenti', 8, SY + 1.5*KPX);
            ctxR.fillText('3–8 km · calcari', 8, SY + 5*KPX);
            ctxR.fillText('8–15 km · cristallino', 8, SY + 10*KPX);

            ctxR.beginPath();
            ctxR.moveTo(0, SY); ctxR.lineTo(W, SY);
            ctxR.strokeStyle = 'rgba(245,237,224,0.6)';
            ctxR.lineWidth = 2; ctxR.stroke();

            ctxR.save();
            ctxR.beginPath();
            ctxR.rect(0, SY, W, H - SY);
            ctxR.clip();
            wavesR.forEach(w => {
              if (w.r <= 0) return;
              const alpha = Math.max(0, 1 - w.r / (IY - SY + 80));
              ctxR.beginPath();
              ctxR.arc(HX, IY, w.r, 0, Math.PI*2);
              ctxR.strokeStyle = w.col + Math.round(alpha*200).toString(16).padStart(2,'0');
              ctxR.lineWidth = w.lw;
              ctxR.stroke();
              if (w.type === 'P' && !w.surfaced && w.r >= IY - SY) {
                w.surfaced = true;
              }
            });
            ctxR.restore();

            /* Onde superficiali — una generazione per ogni onda P che tocca la superficie */
            wavesR.forEach(w => {
              if (!w.surfaced || w.type !== 'P') return;
              w.surfOff++;
              const sof = w.surfOff;
              const surfAl = Math.max(0, 1 - sof / W);
              if (surfAl <= 0) return;
              const STEPS = 80;
              for (let dir = -1; dir <= 1; dir += 2) {
                ctxR.beginPath();
                for (let xi = 0; xi <= STEPS; xi++) {
                  const px = HX + dir * (sof + xi * 2.5);
                  const py = SY + Math.sin(xi * 0.45 - sof * 0.07) * 9 * surfAl;
                  xi === 0 ? ctxR.moveTo(px, py) : ctxR.lineTo(px, py);
                }
                ctxR.strokeStyle = `rgba(212,137,58,${surfAl * 0.8})`;
                ctxR.lineWidth = 2; ctxR.stroke();
              }
              if (sof < 90) {
                ctxR.fillStyle = `rgba(212,137,58,${surfAl})`;
                ctxR.font = '400 8px "JetBrains Mono", monospace';
                ctxR.textAlign = 'center';
                ctxR.fillText('â† Love · Rayleigh →', HX, SY - 8);
                ctxR.textAlign = 'left';
              }
            });

            const pulse = Math.sin(frame * 0.07) * 0.3 + 0.7;
            ctxR.beginPath();
            ctxR.arc(HX, IY, 6 + pulse*2, 0, Math.PI*2);
            ctxR.fillStyle = 'rgba(196,97,42,0.25)'; ctxR.fill();
            ctxR.beginPath();
            ctxR.arc(HX, IY, 5, 0, Math.PI*2);
            ctxR.fillStyle = '#C4612A'; ctxR.fill();
            ctxR.fillStyle = 'rgba(245,237,224,0.5)';
            ctxR.font = '400 8px "JetBrains Mono", monospace';
            ctxR.fillText('IPOCENTRO · 8,8 km', HX + 8, IY + 4);
          }

          let running = true;
          function loop() {
            if (!running) return;
            requestAnimationFrame(loop);
            if (paused) return;
            frame++;
            if (frame % SPAWN === 0) spawnPair();
            waves.forEach(w => { w.r += w.sp; });
            wavesR.forEach(w => { w.r += w.sp; });
            cities.forEach(c => {
              const dist = Math.sqrt(c.dx*c.dx + c.dy*c.dy);
              waves.forEach(w => {
                if (w.type === 'P' && Math.abs(w.r - dist) < w.sp * 3 && c.blink === 0) c.blink = 40;
              });
            });
            waves  = waves.filter(w => w.r < MAX_R + 50);
            wavesR = wavesR.filter(w => w.r < 600);
            drawLeft();
            drawRight();
          }

          spawnPair();
          loop();

          const pauseBtn = document.getElementById('s3-s1-pause');
          if (pauseBtn) pauseBtn.addEventListener('click', () => {
            paused = !paused;
            pauseBtn.textContent = paused ? '▶ RIPRODUCI' : '|| PAUSA';
          });

          const obs = new IntersectionObserver(es => {
            running = es[0].isIntersecting;
            if (running) loop();
          }, { threshold: 0.1 });
          obs.observe(document.getElementById('s3-s1'));
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           SLIDE 3 — 4 corsie onde parallele
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        function initSlide3() {
          const ids   = ['s3-lc-p', 's3-lc-s', 's3-lc-love', 's3-lc-ray'];
          const cvs   = ids.map(id => document.getElementById(id));
          const ctxs  = cvs.map(cv => cv ? cv.getContext('2d') : null);

          function resizeAll() {
            cvs.forEach(cv => {
              if (!cv) return;
              const r = cv.getBoundingClientRect();
              const w = Math.round(r.width)  || cv.offsetWidth;
              const h = Math.round(r.height) || cv.offsetHeight;
              if (w > 0 && cv.width  !== w) cv.width  = w;
              if (h > 0 && cv.height !== h) cv.height = h;
            });
          }
          window.addEventListener('resize', resizeAll);

          let t = 0, playing = true, rafId = null;

          const COLS = 12, ROWS = 2;
          const R_DOT = 3;

          function drawLane(ctx, cv, drawFn) {
            if (!ctx || !cv) return;
            const W = cv.width, H = cv.height;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#06060f';
            ctx.fillRect(0, 0, W, H);
            drawFn(ctx, W, H);
          }

          function drawP(ctx, W, H) {
            const k = (2 * Math.PI) / W * 3;
            const om = 0.06, A = H*0.22;
            const pts = makeGrid(COLS, ROWS, W, H);
            pts.forEach(p => {
              const dx = A * Math.sin(k * p.bx - om * t);
              ctx.beginPath();
              ctx.arc(p.bx + dx, p.by, R_DOT, 0, Math.PI*2);
              ctx.fillStyle = '#C4612A';
              ctx.fill();
            });
          }

          function drawS(ctx, W, H) {
            const k = (2 * Math.PI) / W * 3;
            const om = 0.036, A = H*0.22;
            const pts = makeGrid(COLS, ROWS, W, H);
            pts.forEach(p => {
              const dy = A * Math.sin(k * p.bx - om * t);
              ctx.beginPath();
              ctx.arc(p.bx, p.by + dy, R_DOT, 0, Math.PI*2);
              ctx.fillStyle = '#3A7EC4';
              ctx.fill();
            });
          }

          function drawLove(ctx, W, H) {
            const k = (2 * Math.PI) / W * 3;
            const om = 0.032, A = H*0.22;
            const pts = makeGrid(COLS, ROWS, W, H);
            pts.forEach(p => {
              const depth = p.by / H;
              const dx = A * Math.sin(k * p.bx - om * t) * (0.4 + depth * 0.6);
              const dy = -dx * 0.12 * (1 - depth);
              const alpha = 0.5 + depth * 0.5;
              ctx.beginPath();
              ctx.arc(p.bx + dx, p.by + dy, R_DOT, 0, Math.PI*2);
              ctx.fillStyle = `rgba(212,137,58,${alpha})`;
              ctx.fill();
            });
          }

          function drawRayleigh(ctx, W, H) {
            const k = (2 * Math.PI) / W * 3;
            const om = 0.029, Ax = W*0.018, Ay = H*0.22;
            const pts = makeGrid(COLS, ROWS, W, H);
            pts.forEach(p => {
              const ph = k * p.bx - om * t;
              const dx = Ax * Math.sin(ph);
              const dy = Ay * Math.cos(ph);
              ctx.beginPath();
              ctx.arc(p.bx + dx, p.by + dy, R_DOT, 0, Math.PI*2);
              ctx.fillStyle = '#A87EC4';
              ctx.fill();
            });
          }

          function tick() {
            if (!playing) return;
            rafId = requestAnimationFrame(tick);
            t++;
            if (cvs[0]) drawLane(ctxs[0], cvs[0], drawP);
            if (cvs[1]) drawLane(ctxs[1], cvs[1], drawS);
            if (cvs[2]) drawLane(ctxs[2], cvs[2], drawLove);
            if (cvs[3]) drawLane(ctxs[3], cvs[3], drawRayleigh);
          }

          /* Aspetta 2 frame perché il layout CSS abbia calcolato le dimensioni */
          requestAnimationFrame(() => { resizeAll(); requestAnimationFrame(tick); });

          const playBtn = document.getElementById('s3-s3-playbtn');
          if (playBtn) playBtn.addEventListener('click', () => {
            playing = !playing;
            playBtn.textContent = playing ? '|| PAUSA' : '▶ RIPRODUCI';
            if (playing) tick();
          });

          const obs = new IntersectionObserver(es => {
            const vis = es[0].isIntersecting;
            if (!vis && rafId) { cancelAnimationFrame(rafId); rafId = null; }
            if (vis && !rafId) tick();
          }, { threshold: 0.1 });
          obs.observe(document.getElementById('s3-s3'));
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           SLIDES 4-7 — canvas circolari + particelle
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        function startWaveSlide(slideId, topId, botId, color, waveType) {
          const cv1 = document.getElementById(topId);
          const cv2 = document.getElementById(botId);
          if (!cv1 || !cv2) return;
          const ctx1 = cv1.getContext('2d');
          const ctx2 = cv2.getContext('2d');

          function resize() { resizeCv(cv1); resizeCv(cv2); }
          resize();
          window.addEventListener('resize', resize);

          let t = 0, running = true;
          const COLS = 16, ROWS = 6;
          /* Periodo proporzionale alla velocità reale: P=6, S=3.6, Love=3.2, Ray=2.9 km/s */
          const PERIOD = waveType === 'P' ? 120 : waveType === 'S' ? 200 : waveType === 'Love' ? 225 : 250;

          function drawCircular() {
            const W = cv1.width, H = cv1.height;
            ctx1.clearRect(0, 0, W, H);
            ctx1.fillStyle = '#06060f';
            ctx1.fillRect(0, 0, W, H);
            const cx = W/2, cy = H/2;
            for (let i = 0; i < 5; i++) {
              const ph = (t + i * PERIOD/5) % PERIOD;
              const r  = (ph / PERIOD) * Math.max(W, H) * 0.75;
              const al = 1 - ph / PERIOD;
              ctx1.beginPath();
              ctx1.arc(cx, cy, r, 0, Math.PI*2);
              ctx1.strokeStyle = color + Math.round(al * 200).toString(16).padStart(2,'0');
              ctx1.lineWidth = waveType === 'P' ? 1.5 : 2.5;
              ctx1.stroke();
            }
            ctx1.beginPath();
            ctx1.arc(cx, cy, 6, 0, Math.PI*2);
            ctx1.fillStyle = color; ctx1.fill();
          }

          function drawParticles() {
            const W = cv2.width, H = cv2.height;
            ctx2.clearRect(0, 0, W, H);
            ctx2.fillStyle = '#06060f';
            ctx2.fillRect(0, 0, W, H);
            const k = (2*Math.PI) / W * 3;
            const om = waveType === 'P' ? 0.06 : 0.036;
            const A  = waveType === 'Love' ? H*0.12 : H*0.1;
            const pts = makeGrid(COLS, ROWS, W, H);

            if (waveType === 'P') {
              for (let xi = 0; xi < W; xi += 4) {
                const comp = Math.cos(k*xi - om*t);
                if (comp > 0.5) {
                  ctx2.fillStyle = `rgba(196,97,42,${(comp-0.5)*0.3})`;
                  ctx2.fillRect(xi, 0, 4, H);
                }
              }
              pts.forEach(p => {
                const dx = A * Math.sin(k*p.bx - om*t);
                ctx2.beginPath();
                ctx2.arc(p.bx + dx, p.by, 2.5, 0, Math.PI*2);
                ctx2.fillStyle = color; ctx2.fill();
              });
            } else if (waveType === 'S') {
              pts.forEach(p => {
                const dy = A * Math.sin(k*p.bx - om*t);
                ctx2.beginPath();
                ctx2.arc(p.bx, p.by + dy, 2.5, 0, Math.PI*2);
                ctx2.fillStyle = color; ctx2.fill();
              });
            } else if (waveType === 'Love') {
              pts.forEach(p => {
                const depth = p.by / H;
                const dx = A * Math.sin(k*p.bx - 0.032*t) * (0.3 + depth*0.7);
                ctx2.beginPath();
                ctx2.arc(p.bx + dx, p.by, 2.5, 0, Math.PI*2);
                ctx2.fillStyle = color; ctx2.fill();
              });
            } else {
              const Ax = W*0.015, Ay = H*0.1;
              pts.forEach(p => {
                const ph = k*p.bx - 0.029*t;
                ctx2.beginPath();
                ctx2.arc(p.bx + Ax*Math.sin(ph), p.by + Ay*Math.cos(ph), 2.5, 0, Math.PI*2);
                ctx2.fillStyle = color; ctx2.fill();
              });
            }
          }

          function loop() {
            if (!running) return;
            requestAnimationFrame(loop);
            t++;
            drawCircular();
            drawParticles();
          }
          loop();

          const obs = new IntersectionObserver(es => {
            running = es[0].isIntersecting;
            if (running) loop();
          }, { threshold: 0.1 });
          obs.observe(document.getElementById(slideId));
        }

        function initSlide4() { startWaveSlide('s3-s4','s3-c4-top','s3-c4-bot','#C4612A','P'); }
        function initSlide5() { startWaveSlide('s3-s5','s3-c5-top','s3-c5-bot','#3A7EC4','S'); }
        function initSlide6() { startWaveSlide('s3-s6','s3-c6-top','s3-c6-bot','#D4893A','Love'); }
        function initSlide7() { startWaveSlide('s3-s7','s3-c7-top','s3-c7-bot','#A87EC4','Rayleigh'); }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           SLIDE 8 — Calcolatore interattivo
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        function initSlide8() {
          const cv  = document.getElementById('s3-calc-canvas');
          if (!cv) return;
          const ctx = cv.getContext('2d');
          resizeCv(cv);
          window.addEventListener('resize', () => resizeCv(cv));

          const S8 = {
            vp: 5.0, vs: 2.8,
            ipocentro: null,
            waves: [],
            faldaOn: false,
            running: false,
          };

          document.querySelectorAll('.s3-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('.s3-preset-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              S8.vp = parseFloat(btn.dataset.vp);
              S8.vs = parseFloat(btn.dataset.vs);
              updateVelDisplay();
            });
          });

          function updateVelDisplay() {
            const disp = document.getElementById('s3-vel-disp');
            if (!disp) return;
            const love = (S8.vs * 0.98).toFixed(1);
            const ray  = (S8.vs * 0.92).toFixed(1);
            disp.innerHTML = `Vp: ${S8.vp.toFixed(1)} km/s · Vs: ${S8.vs.toFixed(1)} km/s<br>Love: ~${love} km/s · Rayleigh: ~${ray} km/s`;
          }
          updateVelDisplay();

          const toggle = document.getElementById('s3-falda-toggle');
          const toggleLbl = document.getElementById('s3-falda-label');
          if (toggle) toggle.addEventListener('click', () => {
            S8.faldaOn = !S8.faldaOn;
            toggle.classList.toggle('on', S8.faldaOn);
            toggle.setAttribute('aria-checked', S8.faldaOn);
            toggleLbl.textContent = S8.faldaOn ? 'Falda acquifera attiva' : 'Terreno omogeneo';
            drawStatic();
          });

          cv.addEventListener('click', e => {
            const rect = cv.getBoundingClientRect();
            const sx = cv.width / rect.width, sy = cv.height / rect.height;
            S8.ipocentro = { x: (e.clientX - rect.left)*sx, y: (e.clientY - rect.top)*sy };
            S8.waves = [];
            activateLaunchBtns(true);
            drawAll();
          });

          function activateLaunchBtns(on) {
            ['s3-launch-p','s3-launch-s','s3-launch-both'].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.disabled = !on;
            });
          }

          function launchWaves(type) {
            if (!S8.ipocentro) return;
            const speedP = S8.vp * 0.25;
            const speedS = S8.vs * 0.25;
            if (type === 'P' || type === 'both')
              S8.waves.push({ r:0, type:'P', sp:speedP, surfaced:false, surfOff:0 });
            if (type === 'S' || type === 'both')
              S8.waves.push({ r:0, type:'S', sp:speedS, faldaHit:false });
            if (!S8.running) { S8.running = true; animLoop(); }
          }

          ['s3-launch-p','s3-launch-s','s3-launch-both'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', () => {
              const map = { 's3-launch-p':'P','s3-launch-s':'S','s3-launch-both':'both' };
              launchWaves(map[id]);
            });
          });

          const resetBtn = document.getElementById('s3-calc-reset');
          if (resetBtn) resetBtn.addEventListener('click', () => {
            S8.waves = [];
            S8.running = false;
            drawAll();
          });

          function getSurfY() { return cv.height * 0.08; }
          function getFaldaY() { return cv.height * 0.35; }
          function getFaldaH() { return cv.height * 0.18; }

          function drawStatic() {
            const W = cv.width, H = cv.height;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#181828'; ctx.fillRect(0, 0, W, H);
            const sy = getSurfY();
            ctx.fillStyle = '#1a2030'; ctx.fillRect(0, sy, W, H-sy);
            if (S8.faldaOn) {
              const fy = getFaldaY(), fh = getFaldaH();
              ctx.fillStyle = '#1a3a5c'; ctx.fillRect(0, fy, W, fh);
              ctx.save();
              ctx.strokeStyle = 'rgba(58,126,196,0.3)';
              ctx.lineWidth = 1;
              for (let x = 0; x < W; x += 16) {
                ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x+8, fy+fh);
                ctx.stroke();
              }
              ctx.restore();
              ctx.fillStyle = 'rgba(58,126,196,0.5)';
              ctx.font = '400 9px "JetBrains Mono",monospace';
              ctx.fillText('FALDA ACQUIFERA', 10, fy + fh/2 + 4);
            }
            ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy);
            ctx.strokeStyle = 'rgba(245,237,224,0.5)'; ctx.lineWidth = 2; ctx.stroke();
            if (!S8.ipocentro) {
              ctx.fillStyle = 'rgba(245,237,224,0.18)';
              ctx.font = '300 15px "Cormorant Garamond",serif';
              ctx.textAlign = 'center';
              ctx.fillText('Clicca qui per posizionare l\'ipocentro', W/2, H * 0.55);
              ctx.font = '300 11px "JetBrains Mono",monospace';
              ctx.fillStyle = 'rgba(245,237,224,0.08)';
              ctx.fillText('poi scegli il tipo di onda e lancia', W/2, H * 0.55 + 22);
              ctx.textAlign = 'left';
            }
          }

          let sFaldaMsg = 0;

          function drawAll() {
            drawStatic();
            if (!S8.ipocentro) return;
            const W = cv.width, H = cv.height;
            const { x: hx, y: hy } = S8.ipocentro;
            const sy = getSurfY();
            const fy = getFaldaY(), fh = getFaldaH();

            S8.waves.forEach(w => {
              const al = Math.max(0, 1 - w.r / (W * 0.95));
              if (al <= 0) return;

              if (w.type === 'P') {
                /* Onda P — clippata alla superficie */
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, sy, W, H - sy);
                ctx.clip();
                ctx.beginPath();
                ctx.arc(hx, hy, w.r, 0, Math.PI*2);
                ctx.strokeStyle = `rgba(196,97,42,${al * 0.85})`;
                ctx.lineWidth = 1.5; ctx.stroke();
                ctx.restore();

                /* Attiva onde superficiali alla prima intersezione */
                if (!w.surfaced && w.r >= Math.abs(hy - sy)) {
                  w.surfaced = true;
                  w.surfOff = 0;
                }

              } else {
                /* Onda S — clippata al bordo inferiore della falda: non risbuca sopra */
                ctx.save();
                if (S8.faldaOn) {
                  /* Mostra solo la zona SOTTO la base della falda */
                  const stopY = fy + fh;
                  ctx.beginPath();
                  ctx.rect(0, stopY, W, H - stopY);
                  ctx.clip();
                  if (!w.faldaHit && w.r >= Math.abs(hy - stopY)) {
                    w.faldaHit = true;
                    sFaldaMsg = 220;
                  }
                }
                ctx.beginPath();
                ctx.arc(hx, hy, w.r, 0, Math.PI*2);
                ctx.strokeStyle = `rgba(58,126,196,${al * 0.85})`;
                ctx.lineWidth = 2.5; ctx.stroke();
                ctx.restore();
              }

              /* Onde superficiali da ogni onda P che tocca superficie */
              if (w.surfaced && w.type === 'P') {
                w.surfOff = (w.surfOff || 0) + 1;
                const sof = w.surfOff;
                const surfAl = Math.max(0, 1 - sof / (W * 0.75));
                if (surfAl > 0) {
                  const STEPS = 80;
                  for (let dir = -1; dir <= 1; dir += 2) {
                    ctx.beginPath();
                    for (let xi = 0; xi <= STEPS; xi++) {
                      const px = hx + dir * (sof + xi * 2.5);
                      const py = sy + Math.sin(xi * 0.45 - sof * 0.07) * 9 * surfAl;
                      xi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                    }
                    ctx.strokeStyle = `rgba(212,137,58,${surfAl * 0.8})`;
                    ctx.lineWidth = 2; ctx.stroke();
                  }
                  if (sof < 90) {
                    ctx.fillStyle = `rgba(212,137,58,${surfAl * 0.9})`;
                    ctx.font = '400 8px "JetBrains Mono",monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('â† Love · Rayleigh →', hx, sy - 6);
                    ctx.textAlign = 'left';
                  }
                }
              }
            });

            /* Messaggio blocco onda S */
            if (sFaldaMsg > 0) {
              sFaldaMsg--;
              const a = Math.min(1, sFaldaMsg / 50);
              ctx.fillStyle = `rgba(58,126,196,${a})`;
              ctx.font = '500 10px "JetBrains Mono",monospace';
              ctx.textAlign = 'center';
              ctx.fillText("Onda S bloccata — i fluidi non trasmettono onde di taglio", W/2, fy + fh + 20);
              ctx.textAlign = 'left';
            }

            /* Ipocentro */
            ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(196,97,42,0.3)'; ctx.fill();
            ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI*2);
            ctx.fillStyle = '#C4612A'; ctx.fill();
            ctx.fillStyle = 'rgba(245,237,224,0.5)';
            ctx.font = '400 8px "JetBrains Mono",monospace';
            ctx.fillText('IPOCENTRO', hx + 8, hy - 6);
          }

          function animLoop() {
            if (!S8.running) return;
            requestAnimationFrame(animLoop);
            S8.waves.forEach(w => { w.r += w.sp; });
            drawAll();
            if (S8.waves.every(w => w.r > cv.width * 1.5)) {
              S8.running = false;
            }
          }

          drawStatic();

          const obs = new IntersectionObserver(es => {
            if (!es[0].isIntersecting) S8.running = false;
          }, { threshold: 0.1 });
          obs.observe(document.getElementById('s3-s8'));
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           SLIDE 9 — Nucleo liquido della Terra
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        function initSlide9() {
          const cv  = document.getElementById('s3-core-canvas');
          if (!cv) return;
          const ctx = cv.getContext('2d');
          resizeCv(cv);

          const W = cv.width, H = cv.height;
          const CX = W/2, CY = H/2;
          const MAX_R = Math.min(W, H) * 0.47;

          const layers = [
            { rFrac:0.95, color:'#2d3a4a', label:'Crosta · solida',        state:'solido'  },
            { rFrac:0.68, color:'#3d4a5a', label:'Mantello · solido',       state:'solido'  },
            { rFrac:0.38, color:'#1a3a5c', label:'Nucleo est. · LIQUIDO',   state:'LIQUIDO' },
            { rFrac:0.14, color:'#4a3020', label:'Nucleo int. · solido',    state:'solido'  },
          ];

          function drawCore() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);
            layers.forEach(l => {
              const r = l.rFrac * MAX_R;
              ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI*2);
              ctx.fillStyle = l.color; ctx.fill();
              if (l.state === 'LIQUIDO') {
                ctx.save();
                ctx.clip();
                ctx.strokeStyle = 'rgba(58,126,196,0.2)'; ctx.lineWidth = 1;
                for (let xi = CX - r; xi < CX + r; xi += 14) {
                  ctx.beginPath(); ctx.moveTo(xi, CY-r); ctx.lineTo(xi+r*0.5, CY+r);
                  ctx.stroke();
                }
                ctx.restore();
              }
              ctx.fillStyle = 'rgba(245,237,224,0.35)';
              ctx.font = '300 8px "JetBrains Mono",monospace';
              ctx.textAlign = 'center';
              ctx.fillText(l.label, CX, CY - r + 12);
            });
            ctx.textAlign = 'left';
          }

          drawCore();

          let anim = null;
          const statusEl = document.getElementById('s3-core-status');

          function animRay(type) {
            if (anim) { cancelAnimationFrame(anim); anim = null; }
            drawCore();
            const color = type === 'P' ? '#C4612A' : '#3A7EC4';
            const mantleR = layers[2].rFrac * MAX_R; // nucleo esterno liquido (blu)
            let prog = 0;
            const STEPS = 180;

            function step() {
              prog += 1/STEPS;
              if (prog > 1) prog = 1;
              drawCore();

              const startX = CX - MAX_R;
              const endX   = CX + MAX_R;
              const currX  = startX + (endX - startX) * prog;

              if (type === 'P') {
                ctx.beginPath();
                ctx.moveTo(startX, CY);
                ctx.lineTo(Math.min(currX, endX), CY);
                ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

                if (prog >= 1) {
                  if (statusEl) {
                    statusEl.textContent = "✓ L'onda P attraversa tutto";
                    statusEl.style.color = '#C4612A';
                  }
                  return;
                }
              } else {
                const stopX = CX - mantleR;
                const drawTo = Math.min(currX, stopX);
                ctx.beginPath();
                ctx.moveTo(startX, CY);
                ctx.lineTo(drawTo, CY);
                ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

                if (currX >= stopX) {
                  const flashAlpha = Math.sin(prog * Math.PI * 8) * 0.5 + 0.5;
                  ctx.beginPath();
                  ctx.arc(stopX, CY, 10, 0, Math.PI*2);
                  ctx.fillStyle = `rgba(139,26,26,${flashAlpha * 0.8})`; ctx.fill();

                  if (statusEl) {
                    statusEl.textContent = "✗ L'onda S si ferma — nucleo esterno liquido";
                    statusEl.style.color = '#8B1A1A';
                  }

                  /* Zona d'ombra — cono con apice nel punto di blocco */
                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(CX, CY, MAX_R * 0.95, 0, Math.PI * 2);
                  ctx.clip();
                  const CONE = Math.PI * 0.32;
                  ctx.beginPath();
                  ctx.moveTo(stopX, CY);
                  ctx.arc(stopX, CY, MAX_R * 3, -CONE, CONE);
                  ctx.closePath();
                  ctx.fillStyle = 'rgba(0,0,0,0.55)';
                  ctx.fill();
                  ctx.restore();
                  ctx.fillStyle = 'rgba(245,237,224,0.25)';
                  ctx.font = '300 8px "JetBrains Mono",monospace';
                  ctx.textAlign = 'center';
                  ctx.fillText('Zona d\'ombra', CX + MAX_R * 0.72, CY);
                  ctx.textAlign = 'left';

                  if (prog >= 1) return;
                }
              }
              anim = requestAnimationFrame(step);
            }
            step();
          }

          const btnP = document.getElementById('s3-core-p');
          const btnS = document.getElementById('s3-core-s');
          if (btnP) btnP.addEventListener('click', () => animRay('P'));
          if (btnS) btnS.addEventListener('click', () => animRay('S'));

          const obs = new IntersectionObserver(es => {
            if (!es[0].isIntersecting && anim) { cancelAnimationFrame(anim); anim = null; }
          }, { threshold: 0.1 });
          obs.observe(document.getElementById('s3-s9'));
        }

        /* Avvio carosello */
        goTo(0, false);

        return { goTo };
      })();