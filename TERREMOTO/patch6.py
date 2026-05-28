"""
patch6.py — Cazzuola canvas animation nella slide Restauro/Filosofia
Canvas 230×140: muro a mattoni + cazzuola stilizzata che stende la malta
riga per riga, lascia una smaltatura crema nei giunti, poi si resetta.
"""

PATH = 'C:/Users/gioff/Desktop/CLAUDE CODE/TERREMOTO/terremoti-main/index.html'
with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Inietta canvas nell'art-sr dark della slide Filosofia ─────────────────
old_filosofia = '''              <div class="art-sr-stats">
                <div class="art-sr-stat-row"><div class="art-sr-stat-num" style="font-size:1.1rem;min-width:auto;">Soprintendenza BAP</div></div>
                <div class="art-sr-stat-row"><div class="art-sr-stat-num" style="font-size:1.1rem;min-width:auto;">Aggregato strutturale</div></div>
                <div class="art-sr-stat-row"><div class="art-sr-stat-num" style="font-size:1.1rem;min-width:auto;">Univ. Firenze Restauro</div></div>
              </div>
            </div>
          </div>
          <!-- DOM slide 3 - mostrata terza: La scala -->'''

new_filosofia = '''              <div class="art-sr-stats">
                <div class="art-sr-stat-row"><div class="art-sr-stat-num" style="font-size:1.1rem;min-width:auto;">Soprintendenza BAP</div></div>
                <div class="art-sr-stat-row"><div class="art-sr-stat-num" style="font-size:1.1rem;min-width:auto;">Aggregato strutturale</div></div>
                <div class="art-sr-stat-row"><div class="art-sr-stat-num" style="font-size:1.1rem;min-width:auto;">Univ. Firenze Restauro</div></div>
              </div>
              <canvas id="cazzuola-canvas" width="230" height="140"
                style="display:block;width:230px;height:140px;margin:1rem 0 0;"></canvas>
            </div>
          </div>
          <!-- DOM slide 3 - mostrata terza: La scala -->'''

assert old_filosofia in content, "Filosofia panel not found"
content = content.replace(old_filosofia, new_filosofia, 1)
print("Canvas element injected OK")

# ── 2. Inietta JS animation ──────────────────────────────────────────────────
canvas_js = r"""
// ═══════════════════════════════════════════
//  CAZZUOLA — restauro conservativo
// ═══════════════════════════════════════════
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
"""

anchor = '/* resizeWave e resizeSeismo rimossi insieme al vecchio carousel scientifico */'
assert anchor in content, "JS anchor not found"
content = content.replace(anchor, canvas_js + '\n' + anchor, 1)
print("Cazzuola JS injected OK")

# ── Sanity ────────────────────────────────────────────────────────────────────
assert 'cazzuola-canvas' in content
assert 'drawTrowel' in content
print("Sanity OK")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"File written. Lines: {content.count(chr(10))}")
