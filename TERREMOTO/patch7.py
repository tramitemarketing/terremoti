"""
patch7.py — WebGL smoke background su slide #s-end
Porta il Renderer React/TS in vanilla JS e lo inietta come sfondo
dell'ultima slide, con colore terracotta #C4612A.
"""

PATH = 'C:/Users/gioff/Desktop/CLAUDE CODE/TERREMOTO/terremoti-main/index.html'
with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. CSS: rendi #s-end relativo + stili canvas ────────────────────────────
old_css = '        #s-end { background: #050505; }'
new_css = '''        #s-end { background: #050505; position: relative; overflow: hidden; }
        #end-smoke { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; display: block; }
        #s-end .end-wrap { position: relative; z-index: 1; }'''

assert old_css in content, "CSS anchor not found"
content = content.replace(old_css, new_css, 1)
print("CSS updated OK")

# ── 2. HTML: inietta canvas prima di end-wrap ────────────────────────────────
old_html = '''    <section class="slide" id="s-end">
        <div class="end-wrap">'''
new_html = '''    <section class="slide" id="s-end">
        <canvas id="end-smoke"></canvas>
        <div class="end-wrap">'''

assert old_html in content, "HTML anchor not found"
content = content.replace(old_html, new_html, 1)
print("Canvas element injected OK")

# ── 3. JS: inietta renderer WebGL ────────────────────────────────────────────
smoke_js = r"""
// ═══════════════════════════════════════════
//  SMOKE BACKGROUND — #s-end (WebGL2)
// ═══════════════════════════════════════════
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
"""

anchor = '// ═══════════════════════════════════════════\n//  THREE.JS FAULT ANIMATION — rimosso (sostituito da IIFE sezione1)\n// ═══════════════════════════════════════════'
assert anchor in content, "JS anchor not found"
content = content.replace(anchor, smoke_js + '\n' + anchor, 1)
print("Smoke JS injected OK")

# ── Sanity ────────────────────────────────────────────────────────────────────
assert 'end-smoke' in content
assert 'u_color' in content
assert 'fbm' in content
print("Sanity OK")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"File written. Lines: {content.count(chr(10))}")
