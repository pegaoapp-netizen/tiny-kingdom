/* Tiny Kingdom · CAMPAÑA EN BATALLA (v8.27)
 * Formación de hasta 5 héroes (cada uno con su escuadrón) y batalla automática en un camino del bosque,
 * dibujada con Canvas 2D ligero (no carga otro motor 3D; la ciudad 3D se pausa mientras tanto).
 * Arte, nombres y textos propios de Tiny Kingdom: solo se copia la estructura del modo de referencia.
 * Se comunica con el juego por window.__tkCamp (lo crea juego.js).
 */
(function () {
  'use strict';
  var G = null; // puente con juego.js
  function L(es, en) { return G ? G.L(es, en) : es; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { n = Math.round(n); return n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : n.toLocaleString('es'); }

  var CSS = '' +
    '#tkc{position:fixed;inset:0;z-index:9000;background:#1c2a14;color:#fff;font:600 13px system-ui,sans-serif;touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
    '#tkc canvas{position:absolute;inset:0;width:100%;height:100%;display:block}' +
    '#tkc .tkc-arriba{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:calc(env(safe-area-inset-top) + 8px) 10px 8px;background:linear-gradient(#000a,#0000)}' +
    '#tkc .tkc-pod{flex:1;min-width:0;padding:5px 8px;border-radius:10px;font-size:12px;line-height:1.2}' +
    '#tkc .tkc-pod b{display:block;font-size:15px}' +
    '#tkc .tkc-az{background:linear-gradient(90deg,#1f5bd6cc,#1f5bd633);border:1px solid #6aa0ff}' +
    '#tkc .tkc-ro{background:linear-gradient(270deg,#c9302acc,#c9302a33);border:1px solid #ff8a7a;text-align:right}' +
    '#tkc .tkc-et{flex:none;text-align:center;padding:4px 10px;border-radius:12px;background:#2b1a0acc;border:2px solid #f2c45a;color:#ffe08a;font-size:12px}' +
    '#tkc .tkc-et b{display:block;font-size:18px}' +
    '#tkc .tkc-x{position:absolute;right:8px;top:calc(env(safe-area-inset-top) + 62px);width:36px;height:36px;border-radius:50%;border:2px solid #f2c45a;background:#2b1a0aee;color:#ffe08a;font-size:18px}' +
    '#tkc .tkc-abajo{position:absolute;left:0;right:0;bottom:0;padding:8px 8px calc(env(safe-area-inset-bottom) + 8px);background:linear-gradient(#2b1a0ae6,#160d05f5);border-top:2px solid #f2c45a}' +
    '#tkc .tkc-tit{color:#ffe08a;font-size:13px;margin:0 2px 6px;display:flex;justify-content:space-between}' +
    '#tkc .tkc-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-height:34vh;overflow-y:auto;max-width:460px;margin:0 auto}' +
    '#tkc .tkc-tit,#tkc .tkc-bts{max-width:460px;margin-left:auto;margin-right:auto}' +
    '#tkc .tkc-h{position:relative;border-radius:10px;border:2px solid #6b4a1a;background:#3a2410;padding:3px 2px 4px;text-align:center;min-width:0}' +
    '#tkc .tkc-h img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:7px;display:block;background:#0004}' +
    '#tkc .tkc-h small{display:block;font-size:10px;color:#f3e6c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkc .tkc-h i{position:absolute;left:4px;top:4px;font-style:normal;font-size:10px;color:#fff;background:#000c;border-radius:6px;padding:0 4px}' +
    '#tkc .tkc-h.sel{border-color:#4fa3ff;box-shadow:0 0 8px #4fa3ff}' +
    '#tkc .tkc-h.sel::after{content:attr(data-n);position:absolute;right:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#2f6be0;font-size:11px;line-height:18px}' +
    '#tkc .tkc-bts{display:flex;gap:8px;margin-top:8px}' +
    '#tkc .tkc-b{flex:1;height:46px;border-radius:12px;border:2px solid #0006;font:800 16px system-ui,sans-serif;color:#fff;text-shadow:0 1px 0 #0008}' +
    '#tkc .tkc-b.azul{background:linear-gradient(#5b9bff,#1f55c9)}#tkc .tkc-b.naranja{background:linear-gradient(#ffc24a,#e07a10)}#tkc .tkc-b.verde{background:linear-gradient(#6fdc5a,#2f8f22)}#tkc .tkc-b.gris{background:linear-gradient(#8a7a66,#4d3f2e)}' +
    '#tkc .tkc-ret{display:flex;gap:6px;align-items:flex-end;justify-content:center;max-width:520px;margin:0 auto}' +
    '#tkc .tkc-r{flex:1;min-width:0;max-width:78px;text-align:center;border-radius:10px;border:2px solid #6b4a1a;background:#3a2410;padding:3px}' +
    '#tkc .tkc-r img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:7px;display:block}' +
    '#tkc .tkc-r .bv,#tkc .tkc-r .be{height:6px;border-radius:3px;background:#0008;margin-top:3px;overflow:hidden}' +
    '#tkc .tkc-r .bv i{display:block;height:100%;background:#4fd06a}#tkc .tkc-r .be i{display:block;height:100%;background:#ffd23a}' +
    '#tkc .tkc-r.listo{border-color:#ffd23a;box-shadow:0 0 12px #ffd23a;animation:tkcBrilla .7s infinite alternate}' +
    '#tkc .tkc-r.muerto img{filter:grayscale(1) brightness(.6)}' +
    '@keyframes tkcBrilla{from{transform:translateY(0)}to{transform:translateY(-3px)}}' +
    '#tkc .tkc-ctl{display:flex;flex-direction:column;gap:6px;flex:none;width:52px}' +
    '#tkc .tkc-c{height:34px;border-radius:9px;border:2px solid #f2c45a;background:#2b1a0a;color:#ffe08a;font:800 13px system-ui,sans-serif}' +
    '#tkc .tkc-c.on{background:linear-gradient(#ffc24a,#e07a10);color:#fff}' +
    '#tkc .tkc-vs{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(0);font:900 86px Georgia,serif;color:#ffe08a;-webkit-text-stroke:3px #6b2a00;text-shadow:0 6px 0 #0008;animation:tkcVs 1.2s ease forwards;pointer-events:none}' +
    '@keyframes tkcVs{0%{transform:translate(-50%,-50%) scale(3);opacity:0}25%{transform:translate(-50%,-50%) scale(1);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-50%) scale(1.1);opacity:0}}' +
    '#tkc .tkc-fin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:16px}' +
    '#tkc .tkc-fc{width:100%;max-width:380px;border-radius:16px;border:3px solid #f2c45a;background:linear-gradient(#3a2410,#1e1207);padding:14px;text-align:center}' +
    '#tkc .tkc-fc h2{margin:0 0 4px;font:900 34px Georgia,serif;color:#ffe08a;-webkit-text-stroke:1px #6b2a00}' +
    '#tkc .tkc-fc.mal h2{color:#ff8a7a}' +
    '#tkc .tkc-pr{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}' +
    '#tkc .tkc-pr div{border-radius:10px;background:#0006;border:1px solid #f2c45a66;padding:6px 3px;font-size:11px}' +
    '#tkc .tkc-pr span{display:block;font-size:24px;line-height:1.2}#tkc .tkc-pr img{width:30px;height:30px;border-radius:6px;object-fit:cover}' +
    '#tkc .tkc-pr b{display:block;color:#ffe08a}';

  // ---------------- estado de la pantalla ----------------
  var raiz, cv, cx, W = 0, H = 0, DPR = 1, fondo = null, modo = 'formacion', etapa = 1, sel = [], heroes = [], lado = { az: [], ro: [] };
  var efectos = [], vel = 1, auto = false, tPelea = 0, corriendo = false, ultimo = 0, terminado = false, imgs = {};
  function img(src) { if (!src) return null; if (!imgs[src]) { var i = new Image(); i.src = src; imgs[src] = i; } return imgs[src]; }

  // ---------------- el camino (en diagonal, de abajo a la izquierda hacia arriba a la derecha) ----------------
  function zona() { var arriba = 70, abajo = modo === 'pelea' ? 120 : Math.min(H * 0.45, 330); return { y0: arriba, y1: H - abajo }; }
  function punto(t, carril) { // t: 0 = tu lado, 1 = lado enemigo · carril: -1..1 de un borde al otro del camino
    var z = zona(), ax = W * 0.06, ay = z.y1 - 14, bx = W * 0.94, by = z.y0 + 14;
    var dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), px = -dy / l, py = dx / l, ancho = Math.min(W, z.y1 - z.y0) * 0.16;
    return { x: ax + dx * t + px * carril * ancho, y: ay + dy * t + py * carril * ancho };
  }
  function dibujarFondo() {
    var c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; var g = c.getContext('2d'); g.scale(DPR, DPR);
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#5f9a3a'); gr.addColorStop(1, '#3f7a28'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var semilla = 7; function rnd() { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; }
    for (var i = 0; i < 260; i++) { g.fillStyle = rnd() < 0.5 ? '#6aa84455' : '#2f5f1c44'; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 3 + rnd() * 6, 2 + rnd() * 3, 0, 0, 7); g.fill(); }
    // el camino de tierra
    g.lineCap = 'round';
    var a = punto(0, 0), b = punto(1, 0), z = zona(), ancho = Math.min(W, z.y1 - z.y0) * 0.16;
    g.strokeStyle = '#6b4a24'; g.lineWidth = ancho * 2 + 10; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.strokeStyle = '#b08a52'; g.lineWidth = ancho * 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    for (i = 0; i < 90; i++) { var p = punto(rnd(), rnd() * 2 - 1); g.fillStyle = rnd() < 0.5 ? '#9a7442' : '#c7a26a'; g.beginPath(); g.ellipse(p.x, p.y, 2 + rnd() * 4, 1 + rnd() * 2, 0, 0, 7); g.fill(); }
    // árboles y rocas fuera del camino
    var cosas = [];
    for (i = 0; i < 46; i++) { var t = rnd(), lado2 = rnd() < 0.5 ? -1 : 1, q = punto(t, lado2 * (1.6 + rnd() * 2.6)); if (q.x < -20 || q.x > W + 20 || q.y < 40 || q.y > H) continue; cosas.push({ x: q.x, y: q.y, roca: rnd() < 0.25, s: 0.7 + rnd() * 0.6 }); }
    cosas.sort(function (p1, p2) { return p1.y - p2.y; }).forEach(function (o) {
      g.fillStyle = '#0003'; g.beginPath(); g.ellipse(o.x, o.y + 4, 16 * o.s, 6 * o.s, 0, 0, 7); g.fill();
      if (o.roca) { g.fillStyle = '#8b8f94'; g.beginPath(); g.ellipse(o.x, o.y - 4 * o.s, 13 * o.s, 9 * o.s, 0, 0, 7); g.fill(); g.fillStyle = '#b9bcc0'; g.beginPath(); g.ellipse(o.x - 3 * o.s, o.y - 7 * o.s, 6 * o.s, 4 * o.s, 0, 0, 7); g.fill(); return; }
      g.fillStyle = '#5b3a1a'; g.fillRect(o.x - 2.5 * o.s, o.y - 14 * o.s, 5 * o.s, 14 * o.s);
      g.fillStyle = '#2d6b2a'; g.beginPath(); g.arc(o.x, o.y - 22 * o.s, 14 * o.s, 0, 7); g.fill();
      g.fillStyle = '#3f8a35'; g.beginPath(); g.arc(o.x - 4 * o.s, o.y - 26 * o.s, 9 * o.s, 0, 7); g.fill();
    });
    fondo = c;
  }
  function medir() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = raiz.clientWidth; H = raiz.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR; cx = cv.getContext('2d'); cx.setTransform(DPR, 0, 0, DPR, 0, 0); dibujarFondo();
  }

  // ---------------- escuadrones ----------------
  var ENEMIGOS = [{ ico: '👹', d: false }, { ico: '👺', d: false }, { ico: '🏹', d: true }, { ico: '🧌', d: false }, { ico: '🔮', d: true }];
  function poderDe(u) { return u.atk * 6 + u.max / 3; }
  function escuadronHeroe(h, i) {
    var p = punto(0.14 + (i % 2) * 0.05, -0.8 + i * 0.4);
    var vida = h.vida * 3, atk = h.dano * 2.2;
    return { lado: 'az', h: h, i: i, x: p.x, y: p.y, max: vida, hp: vida, atk: atk, rango: h.distancia ? 0.30 : 0.07, ritmo: h.distancia ? 1.1 : 0.85, cd: 0.3 + i * 0.12, en: 0, buff: 0, escudo: 0, aturdido: 0, vivo: true, im: img(h.foto) };
  }
  // v8.29: los enemigos suben con la etapa Y con el nivel de tus héroes (crecen igual que un héroe al subir de nivel);
  // lo que te da ventaja es el equipo, las estrellas, la Maestría y los talentos
  var nivelRival = 1;
  function escuadronEnemigo(n, i) {
    var f = Math.pow(1.13, n - 1) * (1 + 0.06 * (nivelRival - 1)) * 1.4, e = ENEMIGOS[i % ENEMIGOS.length], p = punto(0.86 - (i % 2) * 0.05, -0.8 + i * 0.4), jefe = i === 2 && n % 5 === 0;
    var vida = 1500 * f * (jefe ? 1.8 : 1), atk = 52 * f * (jefe ? 1.5 : 1);
    return { lado: 'ro', ico: jefe ? '🐲' : e.ico, i: i, x: p.x, y: p.y, max: vida, hp: vida, atk: atk, rango: e.d ? 0.30 : 0.07, ritmo: e.d ? 1.2 : 0.95, cd: 0.4 + i * 0.1, en: 0, buff: 0, escudo: 0, aturdido: 0, vivo: true, jefe: jefe, d: e.d };
  }
  function armarLados() {
    var mapa = {}; heroes.forEach(function (h) { mapa[h.id] = h; });
    lado.az = sel.filter(function (id) { return mapa[id]; }).map(function (id, i) { return escuadronHeroe(mapa[id], i); });
    var nh = lado.az.map(function (u) { return u.h.nivel || 1; }); nivelRival = nh.length ? nh.reduce(function (a, b) { return a + b; }, 0) / nh.length : 1;
    lado.ro = [0, 1, 2, 3, 4].map(function (i) { return escuadronEnemigo(etapa, i); });
  }
  function poderLado(l) { return l.reduce(function (a, u) { return a + poderDe(u); }, 0); }

  // ---------------- dibujo ----------------
  function dibujarEscuadron(u) {
    var az = u.lado === 'az', c = az ? '#2f6be0' : '#d03a2a', vivos = u.vivo ? Math.max(1, Math.ceil(4 * u.hp / u.max)) : 0;
    var dir = az ? 1 : -1, t = performance.now() / 1000;
    // soldados detrás del héroe
    for (var k = 0; k < vivos; k++) {
      var sx = u.x - dir * (14 + (k % 2) * 10), sy = u.y + (k < 2 ? -9 : 9) + (k % 2) * 4, salto = u.anda ? Math.abs(Math.sin(t * 9 + k)) * 2 : 0;
      cx.fillStyle = '#0004'; cx.beginPath(); cx.ellipse(sx, sy + 6, 6, 2.5, 0, 0, 7); cx.fill();
      cx.fillStyle = c; cx.beginPath(); cx.arc(sx, sy - salto, 5.5, 0, 7); cx.fill();
      cx.fillStyle = '#f1d2a8'; cx.beginPath(); cx.arc(sx, sy - 6 - salto, 3.2, 0, 7); cx.fill();
      cx.strokeStyle = '#ddd'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(sx + dir * 4, sy - salto); cx.lineTo(sx + dir * 9, sy - 7 - salto); cx.stroke();
    }
    if (!u.vivo) { cx.globalAlpha = 0.35; }
    var r = u.jefe ? 19 : 16, sal = u.anda ? Math.abs(Math.sin(t * 8)) * 2 : 0;
    cx.fillStyle = '#0005'; cx.beginPath(); cx.ellipse(u.x, u.y + r * 0.8, r, r * 0.35, 0, 0, 7); cx.fill();
    cx.save(); cx.beginPath(); cx.arc(u.x, u.y - sal, r, 0, 7); cx.closePath(); cx.fillStyle = az ? '#1b3f8a' : '#7a1a12'; cx.fill(); cx.clip();
    if (u.im && u.im.complete && u.im.naturalWidth) cx.drawImage(u.im, u.x - r, u.y - r - sal, r * 2, r * 2);
    else { cx.font = (r * 1.2) + 'px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff'; cx.fillText(u.ico || (u.h ? u.h.nombre.charAt(0) : '?'), u.x, u.y - sal + 1); }
    cx.restore();
    cx.lineWidth = 3; cx.strokeStyle = u.escudo > 0 ? '#7fd3ff' : (u.buff > 0 ? '#ffd23a' : c); cx.beginPath(); cx.arc(u.x, u.y - sal, r, 0, 7); cx.stroke();
    if (u.escudo > 0) { cx.strokeStyle = '#7fd3ff88'; cx.lineWidth = 2; cx.beginPath(); cx.arc(u.x, u.y - sal, r + 6, 0, 7); cx.stroke(); }
    if (u.aturdido > 0) { cx.font = '12px system-ui'; cx.textAlign = 'center'; cx.fillText('💫', u.x, u.y - r - 16); }
    cx.globalAlpha = 1;
    if (u.vivo) { // barra de vida
      var bw = 38, bx = u.x - bw / 2, by = u.y - r - 10 - sal;
      cx.fillStyle = '#000b'; cx.fillRect(bx - 1, by - 1, bw + 2, 6); cx.fillStyle = az ? '#4fd06a' : '#ff5a4a'; cx.fillRect(bx, by, bw * Math.max(0, u.hp / u.max), 4);
    }
  }
  function dibujarEfectos(dt) {
    efectos = efectos.filter(function (e) { e.t += dt; return e.t < e.dur; });
    efectos.forEach(function (e) {
      if (e.t < 0) return;
      var k = e.t / e.dur;
      if (e.tipo === 'flecha') { var x = e.x0 + (e.x1 - e.x0) * k, y = e.y0 + (e.y1 - e.y0) * k - Math.sin(k * Math.PI) * 18, a = Math.atan2(e.y1 - e.y0, e.x1 - e.x0); cx.save(); cx.translate(x, y); cx.rotate(a); cx.strokeStyle = e.c || '#f3e6c8'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(4, 0); cx.stroke(); cx.fillStyle = e.c || '#ddd'; cx.beginPath(); cx.moveTo(6, 0); cx.lineTo(1, -3); cx.lineTo(1, 3); cx.fill(); cx.restore(); }
      else if (e.tipo === 'bola') { var bx = e.x0 + (e.x1 - e.x0) * k, by = e.y0 + (e.y1 - e.y0) * k; var gr = cx.createRadialGradient(bx, by, 1, bx, by, 9); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, e.c); gr.addColorStop(1, e.c + '00'); cx.fillStyle = gr; cx.beginPath(); cx.arc(bx, by, 9, 0, 7); cx.fill(); }
      else if (e.tipo === 'corte') { cx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; cx.lineWidth = 3; cx.beginPath(); cx.arc(e.x, e.y, 14, e.a - 0.9 + k * 0.6, e.a + 0.9 + k * 0.6); cx.stroke(); }
      else if (e.tipo === 'rayo') { cx.strokeStyle = 'rgba(160,120,255,' + (1 - k) + ')'; cx.lineWidth = 8 * (1 - k) + 2; cx.beginPath(); cx.moveTo(e.x0, e.y0); cx.lineTo(e.x1, e.y1); cx.stroke(); cx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(e.x0, e.y0); cx.lineTo(e.x1, e.y1); cx.stroke(); }
      else if (e.tipo === 'boom') { cx.fillStyle = 'rgba(255,' + Math.round(180 - 120 * k) + ',40,' + (0.8 * (1 - k)) + ')'; cx.beginPath(); cx.arc(e.x, e.y, e.r * (0.3 + k), 0, 7); cx.fill(); }
      else if (e.tipo === 'cura') { cx.fillStyle = 'rgba(90,230,120,' + (1 - k) + ')'; for (var j = 0; j < 5; j++) { cx.fillRect(e.x - 10 + j * 5, e.y - 10 - k * 26 - (j % 2) * 6, 3, 8); cx.fillRect(e.x - 12 + j * 5, e.y - 7 - k * 26 - (j % 2) * 6, 7, 2); } }
      else if (e.tipo === 'aro') { cx.strokeStyle = e.c.replace('A', String(1 - k)); cx.lineWidth = 4; cx.beginPath(); cx.arc(e.x, e.y, 10 + 40 * k, 0, 7); cx.stroke(); }
      else if (e.tipo === 'texto') { cx.font = '800 ' + (e.g ? 16 : 12) + 'px system-ui'; cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = '#000'; cx.fillStyle = e.c; var ty = e.y - 26 * k; cx.globalAlpha = 1 - k * k; cx.strokeText(e.txt, e.x, ty); cx.fillText(e.txt, e.x, ty); cx.globalAlpha = 1; }
    });
  }
  function dibujar(dt) {
    if (!cx) return;
    cx.clearRect(0, 0, W, H); if (fondo) cx.drawImage(fondo, 0, 0, W, H);
    var todos = lado.az.concat(lado.ro).sort(function (a, b) { return a.y - b.y; });
    todos.forEach(dibujarEscuadron);
    dibujarEfectos(dt);
  }

  // ---------------- la pelea ----------------
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function largoCamino() { var a = punto(0, 0), b = punto(1, 0); return Math.hypot(b.x - a.x, b.y - a.y); }
  function objetivo(u) { var otros = (u.lado === 'az' ? lado.ro : lado.az).filter(function (o) { return o.vivo; }), m = null, dm = 1e9; otros.forEach(function (o) { var d = dist(u, o); if (d < dm) { dm = d; m = o; } }); return m; }
  function aliados(u) { return (u.lado === 'az' ? lado.az : lado.ro).filter(function (o) { return o.vivo; }); }
  function enemigosDe(u) { return (u.lado === 'az' ? lado.ro : lado.az).filter(function (o) { return o.vivo; }); }
  function danar(de, a, cant, grande) {
    if (!a.vivo) return;
    var d = cant * (de && de.buff > 0 ? 1.4 : 1) * (a.escudo > 0 ? 0.5 : 1) * (0.9 + Math.random() * 0.2);
    a.hp -= d; a.en = Math.min(100, a.en + 6);
    efectos.push({ tipo: 'texto', x: a.x + (Math.random() * 10 - 5), y: a.y - 22, txt: '-' + num(d), c: a.lado === 'az' ? '#ff8a7a' : '#ffe08a', g: grande, t: 0, dur: 0.8 });
    if (a.hp <= 0) { a.hp = 0; a.vivo = false; efectos.push({ tipo: 'boom', x: a.x, y: a.y, r: 26, t: 0, dur: 0.5 }); if (G) G.sonar(a.lado === 'az' ? 'error' : 'golpe'); }
  }
  function atacar(u, o) {
    u.en = Math.min(100, u.en + 12);
    var h = u.h || {}, c = h.clase === 'magia' ? '#a678ff' : h.clase === 'arquero' ? '#f3e6c8' : '#ff7a3a';
    if (u.rango > 0.1) {
      var dur = Math.min(0.6, dist(u, o) / 420);
      efectos.push({ tipo: h.clase === 'magia' || (!u.h && u.ico === '🔮') ? 'bola' : 'flecha', x0: u.x, y0: u.y - 6, x1: o.x, y1: o.y - 6, c: c, t: 0, dur: dur });
      setTimeout(function () { danar(u, o, u.atk); }, dur * 1000 / vel);
    } else { efectos.push({ tipo: 'corte', x: o.x, y: o.y, a: Math.atan2(o.y - u.y, o.x - u.x), t: 0, dur: 0.25 }); danar(u, o, u.atk); }
  }
  // habilidades de los héroes (una por héroe, según HEROES.hab)
  var HAB = {
    grito: { es: 'Grito de guerra', en: 'War cry' }, rayo: { es: 'Rayo arcano', en: 'Arcane bolt' }, canon: { es: 'Cañonazo', en: 'Cannon blast' },
    lluvia: { es: 'Lluvia de flechas', en: 'Arrow rain' }, bomba: { es: 'Bomba de fuego', en: 'Fire bomb' }, escudo: { es: 'Muro de escudos', en: 'Shield wall' },
    golpe: { es: 'Golpe aturdidor', en: 'Stunning blow' }, curar: { es: 'Luz sanadora', en: 'Healing light' }
  };
  function lanzar(u) {
    if (!u.vivo || u.en < 100) return;
    u.en = 0; var o = objetivo(u), hab = u.h ? u.h.hab : 'golpe', nom = HAB[hab] ? L(HAB[hab].es, HAB[hab].en) : '';
    efectos.push({ tipo: 'texto', x: u.x, y: u.y - 30, txt: '✨ ' + nom, c: '#ffe08a', g: true, t: 0, dur: 1.2 });
    if (G) G.sonar('magia');
    if (hab === 'grito') aliados(u).forEach(function (a) { a.buff = 6; efectos.push({ tipo: 'aro', x: a.x, y: a.y, c: 'rgba(255,210,58,A)', t: 0, dur: 0.6 }); });
    else if (hab === 'escudo') aliados(u).forEach(function (a) { a.escudo = 6; efectos.push({ tipo: 'aro', x: a.x, y: a.y, c: 'rgba(127,211,255,A)', t: 0, dur: 0.6 }); });
    else if (hab === 'curar') aliados(u).forEach(function (a) { a.hp = Math.min(a.max, a.hp + a.max * 0.3); efectos.push({ tipo: 'cura', x: a.x, y: a.y, t: 0, dur: 1 }); });
    else if (hab === 'lluvia') enemigosDe(u).forEach(function (e2) { for (var j = 0; j < 3; j++) efectos.push({ tipo: 'flecha', x0: e2.x - 30 + j * 12, y0: e2.y - 120, x1: e2.x - 6 + j * 6, y1: e2.y, t: -j * 0.08, dur: 0.45 }); setTimeout(function () { danar(u, e2, u.atk * 1.6, true); }, 450 / vel); });
    else if (!o) return;
    else if (hab === 'rayo') { efectos.push({ tipo: 'rayo', x0: u.x, y0: u.y - 8, x1: o.x, y1: o.y, t: 0, dur: 0.5 }); danar(u, o, u.atk * 5, true); }
    else if (hab === 'canon' || hab === 'bomba') { efectos.push({ tipo: 'bola', x0: u.x, y0: u.y - 8, x1: o.x, y1: o.y, c: '#ff7a3a', t: 0, dur: 0.4 }); setTimeout(function () { efectos.push({ tipo: 'boom', x: o.x, y: o.y, r: 60, t: 0, dur: 0.6 }); enemigosDe(u).forEach(function (e2) { if (dist(e2, o) < 70) danar(u, e2, u.atk * 3, true); }); }, 400 / vel); }
    else { efectos.push({ tipo: 'corte', x: o.x, y: o.y, a: 0, t: 0, dur: 0.4 }); danar(u, o, u.atk * 4, true); o.aturdido = 2; }
  }
  function paso(dt) {
    tPelea += dt; var largo = largoCamino();
    lado.az.concat(lado.ro).forEach(function (u) {
      if (!u.vivo) return;
      u.buff = Math.max(0, u.buff - dt); u.escudo = Math.max(0, u.escudo - dt); u.cd -= dt; u.anda = false;
      if (u.aturdido > 0) { u.aturdido -= dt; return; }
      var o = objetivo(u); if (!o) return;
      var d = dist(u, o), alcance = u.rango * largo;
      if (d > alcance) { var v = largo * 0.11 * dt, k = Math.min(1, v / d); u.x += (o.x - u.x) * k; u.y += (o.y - u.y) * k * 0.6; u.anda = true; }
      else if (u.cd <= 0) { u.cd = u.ritmo; atacar(u, o); }
      if (u.en >= 100 && (u.lado === 'ro' || auto)) lanzar(u);
    });
    // que no se encimen
    var vs = lado.az.concat(lado.ro).filter(function (u) { return u.vivo; });
    for (var i = 0; i < vs.length; i++) for (var j = i + 1; j < vs.length; j++) { var a = vs[i], b = vs[j], dd = dist(a, b); if (dd < 30 && dd > 0.01) { var e = (30 - dd) / 2, ux = (a.x - b.x) / dd, uy = (a.y - b.y) / dd; a.x += ux * e; a.y += uy * e; b.x -= ux * e; b.y -= uy * e; } }
    if (!terminado) {
      if (!lado.ro.some(function (u) { return u.vivo; })) fin(true);
      else if (!lado.az.some(function (u) { return u.vivo; }) || tPelea > 120) fin(false);
    }
  }
  function bucle(t) {
    if (!corriendo) return;
    var dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
    if (modo === 'pelea' && !terminado) paso(dt * vel);
    dibujar(dt * vel);
    if (modo === 'pelea') pintarRetratos();
    requestAnimationFrame(bucle);
  }

  // ---------------- pantallas (HTML encima del dibujo) ----------------
  function arriba() {
    return '<div class="tkc-arriba"><div class="tkc-pod tkc-az">' + L('Tu poder', 'Your power') + '<b id="tkc-pa">' + num(poderLado(lado.az)) + '</b></div>' +
      '<div class="tkc-et">' + L('Etapa', 'Stage') + '<b>' + etapa + '</b></div>' +
      '<div class="tkc-pod tkc-ro">' + L('Poder enemigo', 'Enemy power') + '<b>' + num(poderLado(lado.ro)) + '</b></div></div>' +
      '<button class="tkc-x" data-c="cerrar">✕</button>';
  }
  function pantallaFormacion() {
    modo = 'formacion'; terminado = false; efectos = []; medir(); armarLados();
    var mapa = {}; heroes.forEach(function (h) { mapa[h.id] = h; });
    var lista = heroes.slice().sort(function (a, b) { return (b.dano * 6 + b.vida / 3) - (a.dano * 6 + a.vida / 3); });
    raiz.querySelector('.tkc-ui').innerHTML = arriba() +
      '<div class="tkc-abajo"><div class="tkc-tit"><span>🦸 ' + L('Elige hasta 5 héroes', 'Choose up to 5 heroes') + '</span><span>' + sel.length + ' / 5</span></div>' +
      (lista.length ? '<div class="tkc-grid">' + lista.map(function (h) { var k = sel.indexOf(h.id); return '<button class="tkc-h' + (k >= 0 ? ' sel' : '') + '" data-c="heroe" data-id="' + esc(h.id) + '" data-n="' + (k + 1) + '">' + (h.foto ? '<img src="' + esc(h.foto) + '" alt="">' : '🦸') + '<i>' + L('Nv ', 'Lv ') + h.nivel + '</i><small>' + esc(h.nombre) + '</small></button>'; }).join('') + '</div>' : '<p>' + L('Todavía no tienes héroes. Recluta uno en Tropas › Héroes.', 'You have no heroes yet. Recruit one in Troops › Heroes.') + '</p>') +
      '<div class="tkc-bts"><button class="tkc-b azul" data-c="rapido">⚡ ' + L('Despliegue rápido', 'Quick deploy') + '</button><button class="tkc-b naranja" data-c="luchar">⚔️ ' + L('Luchar', 'Fight') + '</button></div></div>';
  }
  function pantallaPelea() {
    modo = 'pelea'; terminado = false; efectos = []; medir(); armarLados();
    raiz.querySelector('.tkc-ui').innerHTML = arriba() +
      '<div class="tkc-abajo"><div class="tkc-ret"><div class="tkc-ret" id="tkc-rets" style="flex:1">' + lado.az.map(function (u, i) { return '<div class="tkc-r" data-c="hab" data-i="' + i + '">' + (u.h.foto ? '<img src="' + esc(u.h.foto) + '" alt="">' : '🦸') + '<div class="bv"><i></i></div><div class="be"><i></i></div></div>'; }).join('') + '</div>' +
      '<div class="tkc-ctl"><button class="tkc-c' + (vel > 1 ? ' on' : '') + '" data-c="vel">x2</button><button class="tkc-c' + (auto ? ' on' : '') + '" data-c="auto">' + L('Auto', 'Auto') + '</button></div></div></div>' +
      '<div class="tkc-vs">VS</div>';
    pintarRetratos();
  }
  function pintarRetratos() {
    var c = $('tkc-rets'); if (!c) return;
    lado.az.forEach(function (u, i) {
      var r = c.children[i]; if (!r) return;
      r.querySelector('.bv i').style.width = Math.round(100 * u.hp / u.max) + '%';
      r.querySelector('.be i').style.width = Math.round(u.en) + '%';
      r.classList.toggle('listo', u.vivo && u.en >= 100); r.classList.toggle('muerto', !u.vivo);
    });
    var pa = $('tkc-pa'); if (pa) pa.textContent = num(poderLado(lado.az.filter(function (u) { return u.vivo; })));
  }
  function fin(gano) {
    terminado = true;
    setTimeout(function () {
      var ui = raiz.querySelector('.tkc-ui'), n = etapa, items = [];
      if (gano && G) { try { items = G.ganar(n, sel.slice()); } catch (e) { console.error(e); } etapa = G.etapa(); }
      if (G) G.sonar(gano ? 'victoria' : 'derrota');
      var d = document.createElement('div'); d.className = 'tkc-fin';
      d.innerHTML = gano
        ? '<div class="tkc-fc"><h2>🏆 ' + L('¡Victoria!', 'Victory!') + '</h2><p>' + L('Etapa ', 'Stage ') + n + L(' superada', ' cleared') + '</p><div class="tkc-pr">' + items.map(function (x) { return '<div>' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span>' + x.ico + '</span>') + esc(x.nom) + '<b>' + esc(x.n) + '</b></div>'; }).join('') + '</div><div class="tkc-bts"><button class="tkc-b gris" data-c="cerrar">' + L('Salir', 'Exit') + '</button><button class="tkc-b verde" data-c="siguiente">' + L('Etapa ', 'Stage ') + etapa + ' ▶</button></div></div>'
        : '<div class="tkc-fc mal"><h2>💔 ' + L('¡Derrota!', 'Defeat!') + '</h2><p>' + L('Los enemigos de la etapa ', 'The enemies of stage ') + n + L(' fueron más fuertes. Mejora tus héroes o cambia tu alineación.', ' were stronger. Upgrade your heroes or change your lineup.') + '</p><div class="tkc-bts"><button class="tkc-b azul" data-c="mejorar">🦸 ' + L('Mejorar héroes', 'Upgrade heroes') + '</button><button class="tkc-b naranja" data-c="alineacion">🔁 ' + L('Cambiar alineación', 'Change lineup') + '</button></div></div>';
      ui.appendChild(d);
      if (gano && auto) setTimeout(function () { if (d.parentNode && raiz) { pantallaFormacion(); } }, 6000);
    }, 900);
  }

  // ---------------- abrir / cerrar ----------------
  function clic(ev) {
    var b = ev.target.closest('[data-c]'); if (!b) return;
    var c = b.getAttribute('data-c');
    if (c === 'cerrar') { cerrar(); return; }
    if (G) G.sonar('click');
    if (c === 'heroe') { var id = b.getAttribute('data-id'), k = sel.indexOf(id); if (k >= 0) sel.splice(k, 1); else if (sel.length < 5) sel.push(id); else { G && G.consejo(L('Ya tienes 5 héroes: quita uno para cambiarlo.', 'You already have 5 heroes: remove one first.')); return; } G && G.equipo(sel); pantallaFormacion(); }
    else if (c === 'rapido') { sel = heroes.slice().sort(function (a, b2) { return (b2.dano * 6 + b2.vida / 3) - (a.dano * 6 + a.vida / 3); }).slice(0, 5).map(function (h) { return h.id; }); G && G.equipo(sel); pantallaFormacion(); }
    else if (c === 'luchar') { if (!sel.length) { G && G.consejo(L('Elige al menos un héroe.', 'Choose at least one hero.')); return; } tPelea = 0; pantallaPelea(); }
    else if (c === 'hab') { var u = lado.az[+b.getAttribute('data-i')]; if (u) lanzar(u); }
    else if (c === 'vel') { vel = vel > 1 ? 1 : 2; b.classList.toggle('on', vel > 1); }
    else if (c === 'auto') { auto = !auto; G && G.auto(auto); b.classList.toggle('on', auto); }
    else if (c === 'siguiente' || c === 'alineacion') pantallaFormacion();
    else if (c === 'mejorar') { cerrar(); G && G.heroesPanel(); }
  }
  function cerrar() { corriendo = false; if (raiz) raiz.remove(); raiz = null; cx = null; window.removeEventListener('resize', alCambiar); if (G) G.abierta(false); }
  function alCambiar() { if (raiz) medir(); }
  function abrir() {
    G = window.__tkCamp; if (!G) return false;
    if (!$('tkc-css')) { var st = document.createElement('style'); st.id = 'tkc-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (raiz) cerrar();
    heroes = G.heroes(); etapa = G.etapa(); auto = G.auto(); vel = 1;
    sel = G.equipo().filter(function (id) { return heroes.some(function (h) { return h.id === id; }); });
    if (!sel.length) sel = heroes.slice().sort(function (a, b) { return (b.dano * 6 + b.vida / 3) - (a.dano * 6 + a.vida / 3); }).slice(0, 5).map(function (h) { return h.id; });
    heroes.forEach(function (h) { img(h.foto); });
    raiz = document.createElement('div'); raiz.id = 'tkc'; raiz.innerHTML = '<canvas></canvas><div class="tkc-ui"></div>'; document.body.appendChild(raiz);
    cv = raiz.querySelector('canvas'); raiz.addEventListener('click', clic); window.addEventListener('resize', alCambiar);
    G.abierta(true); pantallaFormacion();
    corriendo = true; ultimo = performance.now(); requestAnimationFrame(bucle);
    return true;
  }
  window.TKCampana = { abrir: abrir, cerrar: cerrar, simular: function (seg) { for (var i = 0; i < seg * 30; i++) { if (modo === 'pelea' && !terminado) paso(1 / 30); efectos.forEach(function (e) { e.t += 1 / 30; }); } dibujar(0); pintarRetratos(); return this.info(); }, info: function () { return { modo: modo, t: Math.round(tPelea * 10) / 10, fin: terminado, az: lado.az.map(function (u) { return Math.round(u.hp) + '@' + Math.round(u.x); }), ro: lado.ro.map(function (u) { return Math.round(u.hp) + '@' + Math.round(u.x); }) }; } };
})();
