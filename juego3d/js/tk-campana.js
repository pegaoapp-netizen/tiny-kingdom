// AVISO PARA QUIEN SUBA CAMBIOS (personas o IA): lee CLAUDE.md en la raíz del repositorio. Puedes AÑADIR, pero no borres ni cambies lo que hicieron otros; trabaja solo en tu parte (p. ej. la Campaña).
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

  var CSS_TR = '.tkc-trs{display:flex;flex-direction:column;gap:5px;max-height:30vh;overflow-y:auto;margin:4px 0}.tkc-tr{display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:9px;background:#0006;border:1px solid #6b4a1a}.tkc-tr.sel{border-color:#ffd23a;background:rgba(80,60,10,.5)}.tkc-ti{font-size:22px;width:30px;text-align:center}.tkc-td{flex:1;min-width:0;display:flex;flex-direction:column}.tkc-td b{font-size:12px;color:#ffe08a}.tkc-td small{font-size:11px;color:#fff}.tkc-tb{min-width:34px;height:28px;border-radius:7px;border:1px solid #8a6a2a;background:#3a2610;color:#ffe08a;font:800 12px system-ui;cursor:pointer}.tkc-tb.on{background:#c98a1a;color:#fff}.tkc-tn{font-size:11px;opacity:.85;margin:4px 2px}.tkc-perd{color:#ffb0a0;font-weight:800}';
  /* v8.67: el panel de abajo no tapa la ✕ y siempre hay un botón Salir */
  var CSS_SALIR = '.tkc-x{z-index:20}.tkc-abajo{max-height:calc(100vh - 110px);max-height:calc(100dvh - 110px);overflow-y:auto}.tkc-grid{max-height:24vh}.tkc-trs{max-height:22vh}.tkc-b.gris{background:linear-gradient(#6b5a44,#3f3426);color:#fff}';
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
    '#tkc .tkc-h img{width:100%;aspect-ratio:1;object-fit:cover;object-position:center 18%;border-radius:7px;display:block;background:#0004}' +
    '#tkc .tkc-h small{display:block;font-size:10px;color:#f3e6c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkc .tkc-h i{position:absolute;left:4px;top:4px;font-style:normal;font-size:10px;color:#fff;background:#000c;border-radius:6px;padding:0 4px}' +
    '#tkc .tkc-h.sel{border-color:#4fa3ff;box-shadow:0 0 8px #4fa3ff}' +
    '#tkc .tkc-h.sel::after{content:attr(data-n);position:absolute;right:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#2f6be0;font-size:11px;line-height:18px}' +
    '#tkc .tkc-bts{display:flex;gap:8px;margin-top:8px}' +
    '#tkc .tkc-b{flex:1;height:46px;border-radius:12px;border:2px solid #0006;font:800 16px system-ui,sans-serif;color:#fff;text-shadow:0 1px 0 #0008}' +
    '#tkc .tkc-b.azul{background:linear-gradient(#5b9bff,#1f55c9)}#tkc .tkc-b.naranja{background:linear-gradient(#ffc24a,#e07a10)}#tkc .tkc-b.verde{background:linear-gradient(#6fdc5a,#2f8f22)}#tkc .tkc-b.gris{background:linear-gradient(#8a7a66,#4d3f2e)}' +
    '#tkc .tkc-ret{display:flex;gap:6px;align-items:flex-end;justify-content:center;max-width:520px;margin:0 auto}' +
    '#tkc .tkc-r{flex:1;min-width:0;max-width:78px;text-align:center;border-radius:10px;border:2px solid #6b4a1a;background:#3a2410;padding:3px}' +
    '#tkc .tkc-r img{width:100%;aspect-ratio:1;object-fit:cover;object-position:center 18%;border-radius:7px;display:block}' +
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

  /* v9.02: estilo medieval (metal oscuro y oro, como el mapa de Campaña) */
  var CSS_MED = '#tkc .tkc-arriba{background:linear-gradient(#3e3b36f2,#1a1816e6);border-bottom:2px solid #c9a14a;box-shadow:0 2px 0 #4a3010,0 6px 14px #0009;padding-bottom:6px}' +
    '#tkc .tkc-pod{border-radius:6px;font:700 11px Georgia,serif;box-shadow:inset 0 1px 0 #ffffff33,0 2px 4px #0008;text-shadow:0 1px 1px #000}#tkc .tkc-pod b{font:900 16px system-ui}' +
    '#tkc .tkc-az{background:linear-gradient(#2f6ab8,#123660);border:1px solid #9cc4ec}#tkc .tkc-ro{background:linear-gradient(#b8302a,#5a0a08);border:1px solid #ff9a8a}' +
    '#tkc .tkc-et{border-radius:6px;background:linear-gradient(#4a3a26,#1e160c);border:2px solid #e8c060;font:700 11px Georgia,serif;color:#f6ecd6;box-shadow:0 2px 4px #0008}#tkc .tkc-et b{color:#ffd23a;font:900 17px Georgia,serif}' +
    '#tkc .tkc-x{border-radius:5px;border:2px solid #e8c060;background:linear-gradient(#4a3a26,#1e160c);color:#ffd23a}' +
    '#tkc .tkc-abajo{background:linear-gradient(#36302af2,#141210f8);border-top:2px solid #c9a14a;box-shadow:0 -2px 0 #4a3010,0 -6px 14px #0009}' +
    '#tkc .tkc-tit{font:700 13px Georgia,serif;color:#f6ecd6}' +
    '#tkc .tkc-h,#tkc .tkc-r{border-radius:6px;border:2px solid #6a5030;background:radial-gradient(circle at 50% 30%,#4a3420,#1e140a);box-shadow:inset 0 0 6px #000}#tkc .tkc-h.sel{border-color:#ffd23a;box-shadow:0 0 0 1px #000,0 0 10px #ffd23a}#tkc .tkc-h.sel::after{background:linear-gradient(#3f80c0,#123660);border:1px solid #fff8}' +
    '#tkc .tkc-tr{border-radius:6px;background:linear-gradient(#2e241a,#18120c);border-color:#6a5030}#tkc .tkc-tb{border-radius:4px;background:linear-gradient(#4a3a26,#24180c);border-color:#a8803a}#tkc .tkc-tb.on{background:linear-gradient(#e0902a,#9a4a0e);border-color:#ffd070}' +
    '#tkc .tkc-b{border-radius:5px;border:1px solid #000;font:700 16px Georgia,serif;box-shadow:inset 0 1px 0 #ffffff55,0 3px 5px #0007}#tkc .tkc-b.azul{background:linear-gradient(#3f80c0,#1c4a7c 55%,#123660)}#tkc .tkc-b.naranja{background:linear-gradient(#e8902a,#a8500e)}#tkc .tkc-b.verde{background:linear-gradient(#5aa83a,#2a6a1a)}#tkc .tkc-b.gris{background:linear-gradient(#6e6a66,#3c3936)}' +
    '#tkc .tkc-c{border-radius:5px;border:2px solid #c9a14a;background:linear-gradient(#4a3a26,#1e160c);font:900 13px Georgia,serif}#tkc .tkc-c.on{background:linear-gradient(#e8902a,#a8500e);color:#fff}#tkc .tkc-ctl{gap:4px}#tkc .tkc-ctl .tkc-c{height:30px}' +
    '#tkc .tkc-fc{border-radius:6px;border:2px solid #2a1808;box-shadow:0 0 0 2px #c9a14a,0 0 0 5px #3a2410,0 14px 34px #000;background:radial-gradient(ellipse at 50% 30%,#4a3420,#1a120a)}#tkc .tkc-fc h2{font-family:Georgia,serif}' +
    '#tkc .tkc-pr div{border-radius:6px;background:radial-gradient(circle at 50% 35%,#5a3c20,#24160a);border:1px solid #c9a14a;box-shadow:inset 0 0 8px #000}';
  /* v9.00: lo que solo se ve en las misiones del mapa */
  var CSS_MIS = '#tkc .tkc-mi{max-width:38%;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tkc .tkc-mi b{font-size:15px}' +
    '#tkc .tkc-obj{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 62px);max-width:calc(100% - 110px);padding:4px 12px;border-radius:12px;background:#000a;border:1px solid #f2c45a88;color:#ffe08a;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkc .tkc-jefe{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 92px);width:min(300px,70%);text-align:center;font:800 12px system-ui;color:#ffd0c8;text-shadow:0 1px 2px #000}#tkc .tkc-jefe div{height:9px;border-radius:5px;background:#000b;border:1px solid #ff8a7a;overflow:hidden;margin-top:2px}#tkc .tkc-jefe i{display:block;height:100%;background:linear-gradient(90deg,#ff3a2a,#ff9a3a);transition:width .2s}#tkc .tkc-jefe.muerto{opacity:.4}' +
    '#tkc .tkc-aviso{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);font:900 20px Georgia,serif;color:#ffd0c8;-webkit-text-stroke:1px #400;text-shadow:0 3px 0 #0009;opacity:0;pointer-events:none;white-space:nowrap}#tkc .tkc-aviso.on{animation:tkcAv 1.8s ease}@keyframes tkcAv{0%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}15%{opacity:1;transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0}}' +
    '#tkc .tkc-est{display:flex;justify-content:center;gap:6px;margin:4px 0 6px}#tkc .tkc-est span{font-size:40px;color:#3a2a18;-webkit-text-stroke:1px #000}#tkc .tkc-est span.on{color:#ffd23a;text-shadow:0 0 12px #ffb000;animation:tkcEst .5s ease both}@keyframes tkcEst{from{transform:scale(2.6) rotate(-30deg);opacity:0}to{transform:scale(1);opacity:1}}' +
    '#tkc .tkc-nota{color:#9fe08a;font-size:12px;margin:2px 0}';
  // ---------------- estado de la pantalla ----------------
  var raiz, cv, cx, W = 0, H = 0, DPR = 1, fondo = null, modo = 'formacion', etapa = 1, sel = [], heroes = [], lado = { az: [], ro: [] };
  /* v9.35 (dueño): cuántas tropas de cada tipo se pueden llevar: 50 × capítulo (cap. 1 = 50, cap. 2 = 100…); en las etapas de siempre, 50 por cada 10 etapas */
  function topeTropa() { var c = mis && mis.c ? mis.c : Math.max(1, Math.ceil((etapa || 1) / 10)); return 50 * c; }
  var tropasD = [], selT = {}, MAX_TIPOS = 4; /* v8.47: tropas elegidas para la campaña { tipo: cantidad } */
  var mis = null, sacude = 0; /* v9.00: misión del mapa de Campaña (null = etapas de siempre) */
  var efectos = [], vel = 1, auto = false, tPelea = 0, corriendo = false, ultimo = 0, terminado = false, imgs = {};
  function img(src) { if (!src) return null; if (!imgs[src]) { var i = new Image(); i.src = src; imgs[src] = i; } return imgs[src]; }

  // ---------------- el camino (en diagonal, de abajo a la izquierda hacia arriba a la derecha) ----------------
  function zona() { var arriba = 70, abajo = modo === 'pelea' ? 120 : Math.min(H * 0.45, 330); return { y0: arriba, y1: H - abajo }; }
  function punto(t, carril) { // t: 0 = tu lado, 1 = lado enemigo · carril: -1..1 de un borde al otro del camino
    var z = zona(), ax = W * 0.06, ay = z.y1 - 14, bx = W * 0.94, by = z.y0 + 14;
    var dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), px = -dy / l, py = dx / l, ancho = Math.min(W, z.y1 - z.y0) * 0.16;
    return { x: ax + dx * t + px * carril * ancho, y: ay + dy * t + py * carril * ancho };
  }
  /* v9.00: el terreno cambia según la región de la misión */
  var TEMAS = {
    bosque: { g0: '#6fa040', g1: '#4a7a2a', m0: '#8ab84e', m1: '#3a6a22', ca: '#c4a372', bo: '#6b4a24', p0: '#9a7442', p1: '#d8b888', co: '#2c5a22', c2: '#3f7a2c', c3: '#74a844', tr: '#4a3018', ro: 0.14, pi: 0.3, pl: ['#2e5a3a', '#1b3d2a'], rk: ['#6a6860', '#9a978c'], fl: ['#fff6c0', '#ffd23a', '#e8f0ff', '#ff9aa8'] },
    nieve: { g0: '#e8f0f4', g1: '#b4c4d0', m0: '#ffffff', m1: '#9aacba', ca: '#a39d90', bo: '#5f5a52', p0: '#7d786e', p1: '#c8c2b4', co: '#2f5a48', c2: '#3f6a54', c3: '#e9f3f8', tr: '#3a2614', ro: 0.3, pi: 0.95, nv: 1, pl: ['#2e5a4a', '#1b3d32'], rk: ['#6a6e74', '#a8acb2'] },
    pantano: { g0: '#4a6a32', g1: '#26401c', m0: '#6a8a40', m1: '#1a3012', ca: '#7a6440', bo: '#3a2e1c', p0: '#4f4028', p1: '#9a8458', co: '#1f4018', c2: '#2f5a22', c3: '#4f7a30', tr: '#2e2010', ro: 0.1, pi: 0.55, pl: ['#24503a', '#14301f'], rk: ['#4a4a40', '#6e6c60'], fl: ['#c8a0ff', '#fff6c0'] },
    ceniza: { g0: '#5a3a2c', g1: '#24150f', m0: '#7a4a32', m1: '#140a06', ca: '#7a5a44', bo: '#3a2418', p0: '#5a3e2c', p1: '#9a7254', co: '#3a2a22', c2: '#56382a', c3: '#6a4a3a', tr: '#1e120c', ro: 0.45, pi: 0, seco: 1, rk: ['#2e221c', '#4a3a30'], fl: ['#ff6a1a', '#ffb03a'] }
  };
  function dibujarFondo() {
    var T = TEMAS[(mis && mis.fondo) || 'bosque'] || TEMAS.bosque;
    var c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; var g = c.getContext('2d'); g.scale(DPR, DPR);
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, T.g0); gr.addColorStop(1, T.g1); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var semilla = 7; function rnd() { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; }
    for (var i = 0; i < 260; i++) { g.fillStyle = rnd() < 0.5 ? T.m0 : T.m1; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 3 + rnd() * 6, 2 + rnd() * 3, 0, 0, 7); g.fill(); }
    // el camino de tierra
    g.lineCap = 'round';
    var a = punto(0, 0), b = punto(1, 0), z = zona(), ancho = Math.min(W, z.y1 - z.y0) * 0.16;
    g.strokeStyle = T.bo; g.lineWidth = ancho * 2 + 10; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.strokeStyle = T.ca; g.lineWidth = ancho * 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    for (i = 0; i < 90; i++) { var p = punto(rnd(), rnd() * 2 - 1); g.fillStyle = rnd() < 0.5 ? T.p0 : T.p1; g.beginPath(); g.ellipse(p.x, p.y, 2 + rnd() * 4, 1 + rnd() * 2, 0, 0, 7); g.fill(); }
    // v9.02: textura del suelo, hierba y flores
    for (i = 0; i < 900; i++) { var hx = rnd() * W, hy = rnd() * H; g.strokeStyle = rnd() < 0.5 ? T.m0 : T.m1; g.lineWidth = 1; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - 1.5, hy - 4 - rnd() * 3); g.moveTo(hx, hy); g.lineTo(hx + 1.5, hy - 3 - rnd() * 3); g.stroke(); }
    if (T.fl) for (i = 0; i < 70; i++) { var fx = rnd() * W, fy = rnd() * H; g.fillStyle = T.fl[Math.floor(rnd() * T.fl.length)]; g.beginPath(); g.arc(fx, fy, 1.6, 0, 7); g.fill(); }
    // surcos de carros y piedras del camino
    g.strokeStyle = 'rgba(70,45,20,0.35)'; g.lineWidth = 2; [-0.35, 0.35].forEach(function (cr) { var p0 = punto(0, cr), p1 = punto(1, cr); g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); });
    for (i = 0; i < 60; i++) { var sp = punto(rnd(), rnd() * 2 - 1); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(sp.x + 1, sp.y + 1, 3, 1.6, 0, 0, 7); g.fill(); g.fillStyle = rnd() < 0.5 ? '#a8a296' : '#7e786c'; g.beginPath(); g.ellipse(sp.x, sp.y, 2.6, 1.7, 0, 0, 7); g.fill(); }
    // árboles (redondos y pinos, con luz y sombra como en el mapa), rocas y arbustos fuera del camino
    var cosas = [];
    for (i = 0; i < 70; i++) { var t = rnd(), lado2 = rnd() < 0.5 ? -1 : 1, q = punto(t, lado2 * (1.5 + rnd() * 2.8)); if (q.x < -20 || q.x > W + 20 || q.y < 40 || q.y > H + 10) continue; var r0 = rnd(); cosas.push({ x: q.x, y: q.y, k: r0 < T.ro ? 'roca' : r0 < T.ro + 0.12 ? 'mata' : rnd() < T.pi ? 'pino' : 'arbol', s: 0.8 + rnd() * 0.7 }); }
    cosas.sort(function (p1, p2) { return p1.y - p2.y; }).forEach(function (o) {
      var s2 = o.s * 1.25;
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(o.x + 6 * s2, o.y + 2, 13 * s2, 5 * s2, 0.25, 0, 7); g.fill();
      if (o.k === 'roca') { g.fillStyle = T.rk[0]; g.beginPath(); g.moveTo(o.x - 11 * s2, o.y); g.lineTo(o.x - 7 * s2, o.y - 10 * s2); g.lineTo(o.x + 3 * s2, o.y - 13 * s2); g.lineTo(o.x + 11 * s2, o.y - 5 * s2); g.lineTo(o.x + 10 * s2, o.y); g.fill(); g.fillStyle = T.rk[1]; g.beginPath(); g.moveTo(o.x - 7 * s2, o.y - 10 * s2); g.lineTo(o.x + 3 * s2, o.y - 13 * s2); g.lineTo(o.x, o.y - 4 * s2); g.lineTo(o.x - 9 * s2, o.y - 1 * s2); g.fill(); return; }
      if (o.k === 'mata') { g.fillStyle = T.co; g.beginPath(); g.arc(o.x - 4 * s2, o.y - 4 * s2, 6 * s2, 0, 7); g.arc(o.x + 4 * s2, o.y - 4 * s2, 6 * s2, 0, 7); g.fill(); g.fillStyle = T.c2; g.beginPath(); g.arc(o.x - 2 * s2, o.y - 7 * s2, 4 * s2, 0, 7); g.fill(); return; }
      g.fillStyle = T.tr; g.fillRect(o.x - 2 * s2, o.y - 9 * s2, 4 * s2, 10 * s2);
      if (o.k === 'pino') { for (var k3 = 0; k3 < 3; k3++) { var ty = o.y - (34 - k3 * 8) * s2, by = o.y - (12 - k3 * 3) * s2, an = (7 + k3 * 3.5) * s2; g.fillStyle = T.pl[0]; g.beginPath(); g.moveTo(o.x, ty); g.lineTo(o.x - an, by); g.lineTo(o.x, by + 2 * s2); g.fill(); g.fillStyle = T.pl[1]; g.beginPath(); g.moveTo(o.x, ty); g.lineTo(o.x + an, by); g.lineTo(o.x, by + 2 * s2); g.fill(); if (T.nv) { g.fillStyle = 'rgba(245,250,252,0.9)'; g.beginPath(); g.moveTo(o.x, ty); g.lineTo(o.x - an * 0.45, ty + (by - ty) * 0.45); g.lineTo(o.x + an * 0.3, ty + (by - ty) * 0.4); g.fill(); } } return; }
      if (T.seco) { g.strokeStyle = T.tr; g.lineWidth = 2.4 * s2; g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(o.x, o.y - 22 * s2); g.moveTo(o.x, o.y - 12 * s2); g.lineTo(o.x - 9 * s2, o.y - 20 * s2); g.moveTo(o.x, o.y - 16 * s2); g.lineTo(o.x + 8 * s2, o.y - 26 * s2); g.stroke(); return; }
      g.fillStyle = T.co; g.beginPath(); g.arc(o.x + 1.5 * s2, o.y - 15 * s2, 12 * s2, 0, 7); g.fill();
      g.fillStyle = T.c2; g.beginPath(); g.arc(o.x - 2 * s2, o.y - 17 * s2, 9.5 * s2, 0, 7); g.fill(); g.beginPath(); g.arc(o.x + 5 * s2, o.y - 20 * s2, 6 * s2, 0, 7); g.fill();
      g.fillStyle = T.c3; g.beginPath(); g.arc(o.x - 4.5 * s2, o.y - 21 * s2, 4.5 * s2, 0, 7); g.fill();
    });
    // luz del sol y viñeta
    var gs = g.createLinearGradient(0, 0, W, H); gs.addColorStop(0, 'rgba(255,240,190,0.16)'); gs.addColorStop(0.5, 'rgba(255,240,190,0)'); gs.addColorStop(1, 'rgba(0,0,30,0.18)'); g.fillStyle = gs; g.fillRect(0, 0, W, H);
    var gv = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,0.42)'); g.fillStyle = gv; g.fillRect(0, 0, W, H);
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
    return { lado: 'az', h: h, i: i, x: p.x, y: p.y, max: vida, hp: vida, atk: atk, rango: h.distancia ? 0.30 : 0.12, ritmo: h.distancia ? 1.1 : 0.85, cd: 0.3 + i * 0.12, en: 0, buff: 0, escudo: 0, aturdido: 0, vivo: true, im: img(h.foto) };
  }
  function escuadronTropa(t, n, i) {
    var p = punto(0.05, -0.75 + i * 0.5), fz = Math.cbrt(n) * 0.5, vida = t.vida * 3 * fz, atk = t.dano * 2.2 * fz;
    return { lado: 'az', tropa: t.k, nT: n, h: { nombre: t.nombre, foto: '', hab: 'golpe', clase: t.distancia ? 'arquero' : 'infanteria', nivel: 1 }, ico: t.ico, i: 100 + i, x: p.x, y: p.y, max: vida, hp: vida, atk: atk, rango: t.distancia ? 0.30 : 0.12, ritmo: t.distancia ? 1.1 : 0.9, cd: 0.5 + i * 0.1, en: 0, buff: 0, escudo: 0, aturdido: 0, vivo: true, im: null };
  }
  // v8.29: los enemigos suben con la etapa Y con el nivel de tus héroes (crecen igual que un héroe al subir de nivel);
  // lo que te da ventaja es el equipo, las estrellas, la Maestría y los talentos
  var nivelRival = 1;
  function escuadronEnemigo(n, i) {
    var f = Math.pow(1.13, n - 1) * (1 + 0.06 * (nivelRival - 1)) * 1.4, e = ENEMIGOS[i % ENEMIGOS.length], p = punto(0.86 - (i % 2) * 0.05, -0.8 + i * 0.4), jefe = i === 2 && n % 5 === 0;
    var vida = 1500 * f * (jefe ? 1.8 : 1), atk = 52 * f * (jefe ? 1.5 : 1);
    return { lado: 'ro', ico: jefe ? '🐲' : e.ico, i: i, x: p.x, y: p.y, max: vida, hp: vida, atk: atk, rango: e.d ? 0.30 : 0.12, ritmo: e.d ? 1.2 : 0.95, cd: 0.4 + i * 0.1, en: 0, buff: 0, escudo: 0, aturdido: 0, vivo: true, jefe: jefe, d: e.d };
  }
  /* v9.00: enemigos de una misión: e = { ico, nom, v (vida ×), a (ataque ×), d (a distancia), vel, jefe, habs, sana } */
  function escuadronMision(e, i, n, t0) {
    var f = mis.f * (1 + 0.06 * (nivelRival - 1)), carril = e.jefe ? 0 : (n > 1 ? -0.85 + i * 1.7 / (n - 1) : 0), p = punto(t0 || (e.jefe ? 0.9 : 0.86 - (i % 2) * 0.05), carril);
    var vida = 1500 * f * (e.v || 1), atk = 52 * f * (e.a || 1);
    return { lado: 'ro', ico: e.ico, nom: e.nom, i: i, x: p.x, y: p.y, max: vida, hp: vida, atk: atk, rango: e.d ? 0.30 : 0.12, ritmo: e.d ? 1.2 : 0.95, cd: 0.4 + i * 0.1, en: 0, buff: 0, escudo: 0, aturdido: 0, vivo: true, jefe: !!e.jefe, d: !!e.d, vel: e.vel || 1, habs: e.habs || null, nh: 0, sana: e.sana ? 4 : 0, invoca: e.invoca || null };
  }
  function armarLados() {
    var mapa = {}; heroes.forEach(function (h) { mapa[h.id] = h; });
    lado.az = sel.filter(function (id) { return mapa[id]; }).map(function (id, i) { return escuadronHeroe(mapa[id], i); });
    var nh = lado.az.map(function (u) { return u.h.nivel || 1; });
    tropasD.filter(function (t) { return selT[t.k] > 0; }).slice(0, MAX_TIPOS).forEach(function (t, i) { lado.az.push(escuadronTropa(t, Math.min(selT[t.k], t.n, topeTropa()), i)); }); /* v8.47 · v9.35: con el tope del capítulo */ nivelRival = nh.length ? nh.reduce(function (a, b) { return a + b; }, 0) / nh.length : 1;
    if (mis) { lado.ro = mis.enemigos.map(function (e, i, l) { return escuadronMision(e, i, l.length); }); refuerzos = (mis.refuerzos || []).map(function (r) { return { t: r.t, l: r.l, ya: false }; }); return; }
    lado.ro = [0, 1, 2, 3, 4].map(function (i) { return escuadronEnemigo(etapa, i); });
  }
  var refuerzos = [];
  function poderLado(l) { return l.reduce(function (a, u) { return a + poderDe(u); }, 0); }

  // ---------------- dibujo ----------------
  /* v9.35 (dueño): las tropas se ven como un escuadrón de soldaditos formados detrás de los héroes (lanzas, arcos, escudos o caballos) */
  function dibujarFormacion(u) {
    var t = performance.now() / 1000, vivos = u.vivo ? Math.max(1, Math.ceil(9 * u.hp / u.max)) : 0, k = u.tropa || '', arq = u.rango > 0.1, cab = /caball|jinete/.test(k), gua = /guard/.test(k);
    if (!u.vivo) cx.globalAlpha = 0.35;
    for (var n = 0; n < Math.max(vivos, u.vivo ? 1 : 3); n++) {
      var fila = Math.floor(n / 3), col = n % 3, sx = u.x - 14 + col * 14 - fila * 6, sy = u.y - 10 + fila * 11 + (col % 2) * 3, salto = u.anda ? Math.abs(Math.sin(t * 9 + n)) * 2 : 0, gol = u.cd > u.ritmo - 0.15 ? 3 : 0;
      cx.fillStyle = 'rgba(0,0,0,0.3)'; cx.beginPath(); cx.ellipse(sx + 2, sy + 6, cab ? 9 : 6, 2.4, 0, 0, 7); cx.fill();
      if (cab) { cx.fillStyle = '#6b4424'; cx.beginPath(); cx.ellipse(sx, sy + 1 - salto, 8, 4, 0, 0, 7); cx.fill(); cx.fillRect(sx + 5, sy - 5 - salto, 3, 6); cx.fillStyle = '#4a2c14'; cx.fillRect(sx - 6, sy + 3 - salto, 2, 5); cx.fillRect(sx + 4, sy + 3 - salto, 2, 5); sy -= 5; }
      if (arq) { cx.strokeStyle = '#8a5a2a'; cx.lineWidth = 1.4; cx.beginPath(); cx.arc(sx + 5, sy - 6 - salto, 5, -1.2, 1.2); cx.stroke(); cx.strokeStyle = '#ddd'; cx.lineWidth = 0.6; cx.beginPath(); cx.moveTo(sx + 5 + Math.cos(-1.2) * 5, sy - 6 - salto + Math.sin(-1.2) * 5); cx.lineTo(sx + 5 + Math.cos(1.2) * 5 - gol, sy - 6 - salto + Math.sin(1.2) * 5); cx.stroke(); }
      else { cx.strokeStyle = '#6a4a2a'; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(sx - 2, sy + 4 - salto); cx.lineTo(sx + 10 + gol, sy - 12 - salto); cx.stroke(); cx.fillStyle = '#d8d8d8'; cx.beginPath(); cx.moveTo(sx + 10 + gol, sy - 12 - salto); cx.lineTo(sx + 13 + gol, sy - 16 - salto); cx.lineTo(sx + 8 + gol, sy - 13 - salto); cx.fill(); }
      cx.fillStyle = '#1a3f8a'; cx.fillRect(sx - 4, sy - 5 - salto, 8, 9); cx.fillStyle = '#2f6be0'; cx.fillRect(sx - 4, sy - 5 - salto, 5, 9);
      cx.fillStyle = '#f1d2a8'; cx.beginPath(); cx.arc(sx, sy - 8 - salto, 3.2, 0, 7); cx.fill();
      cx.fillStyle = '#9aa0a8'; cx.beginPath(); cx.arc(sx, sy - 9 - salto, 3.6, Math.PI, 0); cx.fill();
      if (gua || !arq) { cx.fillStyle = '#1a3f8a'; cx.beginPath(); cx.ellipse(sx + 4, sy - 1 - salto, gua ? 4.4 : 3.2, gua ? 6 : 4.6, 0, 0, 7); cx.fill(); cx.strokeStyle = '#e8c060'; cx.lineWidth = 1; cx.stroke(); }
    }
    cx.globalAlpha = 1;
    if (u.vivo) { var bw = 34, bx = u.x - bw / 2, by = u.y - 32; cx.fillStyle = '#000b'; cx.fillRect(bx - 1, by - 1, bw + 2, 6); cx.fillStyle = '#4fd06a'; cx.fillRect(bx, by, bw * Math.max(0, u.hp / u.max), 4);
      cx.font = '700 10px system-ui'; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.lineWidth = 3; cx.strokeStyle = '#000'; var et = (u.ico || '') + ' ' + (G ? G.num(Math.round(u.nT * u.hp / u.max)) : Math.round(u.nT * u.hp / u.max)); cx.strokeText(et, bx - 3, by + 2); cx.fillStyle = '#fff'; cx.fillText(et, bx - 3, by + 2); }
  }
  function dibujarEscuadron(u) {
    if (u.tropa && u.lado === 'az') { dibujarFormacion(u); return; } /* v9.35 */
    var az = u.lado === 'az', c = az ? '#2f6be0' : '#d03a2a', vivos = u.vivo ? Math.max(1, Math.ceil(4 * u.hp / u.max)) : 0;
    var dir = az ? 1 : -1, t = performance.now() / 1000;
    // v9.02: soldados dibujados (casco, escudo y lanza) detrás del héroe
    var tun = az ? ['#2f6be0', '#1a3f8a'] : ['#c0281e', '#6a0e08'];
    var claveFig = window.TKSprites ? (az ? (u.h && u.h.id ? 'h:' + u.h.id : null) : TKSprites.claveEnemigo(u.ico, u.jefe)) : null; /* v9.31: también tus héroes */
    var conFig = claveFig && TKSprites.foto(claveFig, 'quieto', 0); /* v9.30: con muñeco 3D no hacen falta los soldaditos */
    for (var k = 0; k < (conFig ? 0 : vivos); k++) {
      var sx = u.x - dir * (15 + (k % 2) * 11), sy = u.y + (k < 2 ? -10 : 10) + (k % 2) * 4, salto = u.anda ? Math.abs(Math.sin(t * 9 + k)) * 2 : 0, gol = u.cd > u.ritmo - 0.15 ? 3 : 0;
      cx.fillStyle = 'rgba(0,0,0,0.3)'; cx.beginPath(); cx.ellipse(sx + 2, sy + 6, 7, 2.6, 0, 0, 7); cx.fill();
      cx.strokeStyle = '#6a4a2a'; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(sx - dir * 2, sy + 4 - salto); cx.lineTo(sx + dir * (10 + gol), sy - 12 - salto); cx.stroke();
      cx.fillStyle = '#d8d8d8'; cx.beginPath(); cx.moveTo(sx + dir * (10 + gol), sy - 12 - salto); cx.lineTo(sx + dir * (13 + gol), sy - 16 - salto); cx.lineTo(sx + dir * (8 + gol), sy - 13 - salto); cx.fill();
      cx.fillStyle = tun[1]; cx.fillRect(sx - 4, sy - 5 - salto, 8, 9); cx.fillStyle = tun[0]; cx.fillRect(sx - 4, sy - 5 - salto, 5, 9);
      cx.fillStyle = '#f1d2a8'; cx.beginPath(); cx.arc(sx, sy - 8 - salto, 3.2, 0, 7); cx.fill();
      cx.fillStyle = '#9aa0a8'; cx.beginPath(); cx.arc(sx, sy - 9 - salto, 3.6, Math.PI, 0); cx.fill(); cx.fillRect(sx - 0.6, sy - 9 - salto, 1.2, 3);
      cx.fillStyle = tun[1]; cx.beginPath(); cx.ellipse(sx + dir * 4, sy - 1 - salto, 3.2, 4.6, 0, 0, 7); cx.fill(); cx.strokeStyle = '#e8c060'; cx.lineWidth = 1; cx.stroke();
    }
    if (!u.vivo) { cx.globalAlpha = 0.35; }
    var r = u.jefe ? (mis ? 24 : 19) : (az && u.h && !u.tropa ? 12 : 16), sal = u.anda ? Math.abs(Math.sin(t * 8)) * 2 : 0;
    /* v9.30 (dueño): los enemigos son los muñecos 3D que hizo él (fotos sacadas de sus modelos, ver tk-campana-sprites.js); mientras cargan, el círculo de antes */
    var estFig = !u.vivo ? 'quieto' : u.anda ? 'anda' : (u.cd > u.ritmo - 0.35 ? 'ataca' : 'quieto'), hFig = claveFig ? r * (u.jefe ? 5.2 : (az ? 4.6 * 16 / r : 4.2)) : 0;
    /* v9.34 (dueño: «parece que van flotando»): el paso va según lo que avanza de verdad (un paso completo ≈ 0,9 de su altura) */
    if (u._px != null && u.vivo) u._camino = (u._camino || 0) + Math.hypot(u.x - u._px, u.y - u._py); u._px = u.x; u._py = u.y;
    var fig = claveFig ? TKSprites.foto(claveFig, estFig, t, estFig === 'anda' ? (u._camino || 0) / Math.max(10, hFig * 0.9) : null) : null, wFig = fig ? hFig * fig.width / fig.height : 0, pie = u.y + r * 0.9;
    cx.fillStyle = '#0005'; cx.beginPath(); cx.ellipse(u.x, fig ? pie : u.y + r * 0.8, fig ? wFig * 0.26 : r, fig ? wFig * 0.08 : r * 0.35, 0, 0, 7); cx.fill();
    /* v9.32: el muñeco no se sale de la zona de batalla (ni por arriba, debajo de la barra, ni por los lados) */
    var zF = fig ? zona() : null, topF = fig ? Math.max(zF.y0 + 2, pie - hFig * TKSprites.pie(claveFig)) : 0, /* v9.36: los pies justo encima de la sombra */ xF = fig ? Math.max(wFig / 2 + 2, Math.min(W - wFig / 2 - 2, u.x)) : u.x;
    if (fig) { cx.drawImage(fig, xF - wFig / 2, topF, wFig, hFig); if (u.escudo > 0) { cx.strokeStyle = '#7fd3ff88'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(u.x, pie - hFig / 2, wFig * 0.45, hFig * 0.55, 0, 0, 7); cx.stroke(); } }
    else {
    cx.save(); cx.beginPath(); cx.arc(u.x, u.y - sal, r, 0, 7); cx.closePath(); cx.fillStyle = az ? '#1b3f8a' : '#7a1a12'; cx.fill(); cx.clip();
    if (u.im && u.im.complete && u.im.naturalWidth) cx.drawImage(u.im, u.x - r, u.y - r - sal, r * 2, r * 2);
    else { cx.font = (r * 1.2) + 'px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff'; cx.fillText(u.ico || (u.h ? u.h.nombre.charAt(0) : '?'), u.x, u.y - sal + 1); }
    cx.restore();
    cx.lineWidth = 4; cx.strokeStyle = '#1a0e04'; cx.beginPath(); cx.arc(u.x, u.y - sal, r + 1.5, 0, 7); cx.stroke(); /* v9.02: marco dorado (héroes) o de hierro rojo (enemigos) */
    var gm = cx.createLinearGradient(u.x - r, u.y - r - sal, u.x + r, u.y + r - sal); gm.addColorStop(0, az ? '#fff2b0' : '#ff9a7a'); gm.addColorStop(0.5, az ? '#c98a1a' : '#8a1a0e'); gm.addColorStop(1, az ? '#7a4a08' : '#3a0604');
    cx.lineWidth = 2.6; cx.strokeStyle = u.escudo > 0 ? '#7fd3ff' : (u.buff > 0 ? '#ffd23a' : gm); cx.beginPath(); cx.arc(u.x, u.y - sal, r, 0, 7); cx.stroke();
    if (u.escudo > 0) { cx.strokeStyle = '#7fd3ff88'; cx.lineWidth = 2; cx.beginPath(); cx.arc(u.x, u.y - sal, r + 6, 0, 7); cx.stroke(); }
    }
    var arriba = fig ? topF + 4 : u.y - r - sal; /* v9.30: la barra, la corona y el mareo van encima del muñeco */
    if (u.jefe && mis && u.vivo) { cx.font = '16px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('👑', u.x, arriba - 20); }
    if (u.aturdido > 0) { cx.font = '12px system-ui'; cx.textAlign = 'center'; cx.fillText('💫', u.x, arriba - 16 + sal); }
    cx.globalAlpha = 1;
    if (u.vivo) { // barra de vida
      var bw = 38, bx = u.x - bw / 2, by = arriba - 10;
      cx.fillStyle = '#000b'; cx.fillRect(bx - 1, by - 1, bw + 2, 6); cx.fillStyle = az ? '#4fd06a' : '#ff5a4a'; cx.fillRect(bx, by, bw * Math.max(0, u.hp / u.max), 4);
      if (az && u.h && !u.tropa && u.im && u.im.complete && u.im.naturalWidth) { var mx2 = bx - 8, my2 = by + 2; cx.save(); cx.beginPath(); cx.arc(mx2, my2, 7, 0, 7); cx.clip(); cx.drawImage(u.im, mx2 - 7, my2 - 9, 14, 14); cx.restore(); cx.strokeStyle = '#e8b84a'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(mx2, my2, 7, 0, 7); cx.stroke(); } /* v9.35: medalla pequeña al lado de la barra */
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
      else if (e.tipo === 'onda') { var ro = 14 + 70 * k, go = cx.createRadialGradient(e.x, e.y, ro * 0.6, e.x, e.y, ro); go.addColorStop(0, 'rgba(255,215,90,0)'); go.addColorStop(0.8, 'rgba(255,215,90,' + (0.55 * (1 - k)) + ')'); go.addColorStop(1, 'rgba(255,240,170,0)'); cx.fillStyle = go; cx.beginPath(); cx.ellipse(e.x, e.y, ro, ro * 0.38, 0, 0, 7); cx.fill(); cx.strokeStyle = 'rgba(255,225,120,' + (0.9 * (1 - k)) + ')'; cx.lineWidth = 2.5; cx.beginPath(); cx.ellipse(e.x, e.y, ro, ro * 0.38, 0, 0, 7); cx.stroke(); }
      else if (e.tipo === 'texto') { cx.font = '800 ' + (e.g ? 16 : 12) + 'px system-ui'; cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = '#000'; cx.fillStyle = e.c; var ty = e.y - 26 * k; cx.globalAlpha = 1 - k * k; cx.strokeText(e.txt, e.x, ty); cx.fillText(e.txt, e.x, ty); cx.globalAlpha = 1; }
    });
  }
  function dibujar(dt) {
    if (!cx) return;
    cx.clearRect(0, 0, W, H); cx.save(); if (sacude > 0) { sacude = Math.max(0, sacude - dt); cx.translate((Math.random() - 0.5) * 10 * sacude, (Math.random() - 0.5) * 10 * sacude); }
    if (fondo) cx.drawImage(fondo, 0, 0, W, H);
    var todos = lado.az.concat(lado.ro).sort(function (a, b) { return a.y - b.y; });
    todos.forEach(dibujarEscuadron);
    dibujarEfectos(dt); cx.restore();
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
    if (a.jefe && a.lado === 'ro') sacude = Math.max(sacude, grande ? 0.28 : 0.12); /* v9.35: la pantalla tiembla un poco al golpear a un jefe */
    efectos.push({ tipo: 'texto', x: a.x + (Math.random() * 10 - 5), y: a.y - 22, txt: '-' + num(d), c: a.lado === 'az' ? '#ff8a7a' : '#ffe08a', g: grande, t: 0, dur: 0.8 });
    if (a.hp <= 0) { a.hp = 0; a.vivo = false; efectos.push({ tipo: 'boom', x: a.x, y: a.y, r: 26, t: 0, dur: 0.5 }); if (G) G.sonar(a.lado === 'az' ? 'error' : 'golpe'); }
  }
  function atacar(u, o) {
    u.en = Math.min(100, u.en + 12);
    var h = u.h || {}, c = h.clase === 'magia' ? '#a678ff' : h.clase === 'arquero' ? '#f3e6c8' : '#ff7a3a';
    if (u.rango > 0.1) {
      var dur = Math.min(0.6, dist(u, o) / 420);
      efectos.push({ tipo: h.clase === 'magia' || (!u.h && u.ico === '🔮') ? 'bola' : 'flecha', x0: u.x, y0: u.y - 6, x1: o.x, y1: o.y - 6, c: c, t: 0, dur: dur });
      if (u.tropa) for (var fl = 1; fl <= 3; fl++) efectos.push({ tipo: 'flecha', x0: u.x - 10 + fl * 6, y0: u.y - 2 + (fl % 2) * 8, x1: o.x - 8 + fl * 5, y1: o.y - 4, c: '#f3e6c8', t: -fl * 0.06, dur: dur }); /* v9.35: el escuadrón de arqueros dispara una lluvia */
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
    if (u.h && !u.tropa) { efectos.push({ tipo: 'onda', x: u.x, y: u.y + 10, t: 0, dur: 0.9 }); efectos.push({ tipo: 'onda', x: u.x, y: u.y + 10, t: -0.18, dur: 0.9 }); } /* v9.35: onda dorada en el suelo */
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
  /* v9.00: habilidades de los jefes de la Campaña (las usan solos al llenar su energía) */
  var HAB_JEFE = {
    furia: { es: 'Furia', en: 'Rage' }, terremoto: { es: 'Terremoto', en: 'Earthquake' }, invocar: { es: 'Llamada a la horda', en: 'Call the horde' },
    escudo: { es: 'Piel de piedra', en: 'Stone skin' }, fuego: { es: 'Aliento de fuego', en: 'Fire breath' }, drenar: { es: 'Drenar vida', en: 'Life drain' }, aullido: { es: 'Aullido aterrador', en: 'Terrifying howl' }
  };
  function lanzarJefe(u) {
    u.en = 0; var hab = u.habs[u.nh++ % u.habs.length], o = objetivo(u), nom = HAB_JEFE[hab] ? L(HAB_JEFE[hab].es, HAB_JEFE[hab].en) : '';
    efectos.push({ tipo: 'texto', x: u.x, y: u.y - 40, txt: '☠️ ' + nom, c: '#ff8a7a', g: true, t: 0, dur: 1.4 }); if (G) G.sonar('cuerno');
    var av = $('tkc-aviso'); if (av) { av.textContent = '☠️ ' + (u.nom || '') + ': ' + nom; av.classList.remove('on'); void av.offsetWidth; av.classList.add('on'); }
    if (hab === 'furia') aliados(u).forEach(function (a) { a.buff = 7; efectos.push({ tipo: 'aro', x: a.x, y: a.y, c: 'rgba(255,80,40,A)', t: 0, dur: 0.7 }); });
    else if (hab === 'escudo') { u.escudo = 7; efectos.push({ tipo: 'aro', x: u.x, y: u.y, c: 'rgba(170,170,190,A)', t: 0, dur: 0.8 }); }
    else if (hab === 'terremoto') { sacude = 0.8; enemigosDe(u).forEach(function (e2) { efectos.push({ tipo: 'aro', x: e2.x, y: e2.y, c: 'rgba(150,100,50,A)', t: 0, dur: 0.6 }); danar(u, e2, u.atk * 1.4, true); }); }
    else if (hab === 'aullido') enemigosDe(u).forEach(function (e2) { e2.aturdido = Math.max(e2.aturdido, 1.6); efectos.push({ tipo: 'aro', x: e2.x, y: e2.y, c: 'rgba(200,160,255,A)', t: 0, dur: 0.6 }); });
    else if (hab === 'invocar') { var n0 = lado.ro.length; for (var k = 0; k < 2; k++) { var m = escuadronMision(u.invoca || { ico: '👺', nom: '', v: 0.5, a: 0.6 }, n0 + k, 3, 0.95); var q = punto(0.92, k ? 0.7 : -0.7); m.x = q.x; m.y = q.y; lado.ro.push(m); efectos.push({ tipo: 'boom', x: m.x, y: m.y, r: 30, t: 0, dur: 0.5 }); } }
    else if (!o) return;
    else if (hab === 'fuego') { efectos.push({ tipo: 'bola', x0: u.x, y0: u.y - 10, x1: o.x, y1: o.y, c: '#ff5a1a', t: 0, dur: 0.45 }); setTimeout(function () { sacude = 0.5; efectos.push({ tipo: 'boom', x: o.x, y: o.y, r: 90, t: 0, dur: 0.7 }); enemigosDe(u).forEach(function (e2) { if (dist(e2, o) < 95) danar(u, e2, u.atk * 2.4, true); }); }, 450 / vel); }
    else if (hab === 'drenar') { efectos.push({ tipo: 'rayo', x0: u.x, y0: u.y - 8, x1: o.x, y1: o.y, t: 0, dur: 0.6 }); var antes = o.hp; danar(u, o, u.atk * 3, true); u.hp = Math.min(u.max, u.hp + Math.max(0, antes - o.hp) * 0.6); efectos.push({ tipo: 'cura', x: u.x, y: u.y, t: 0, dur: 1 }); }
  }
  function ganoMision() {
    var o = mis.obj || 'todos', vivos = lado.ro.some(function (u) { return u.vivo; }), quedan = refuerzos.some(function (r) { return !r.ya; });
    if (o === 'jefe') return !lado.ro.some(function (u) { return u.jefe && u.vivo; });
    if (o === 'sobrevive') return tPelea >= mis.seg || (!vivos && !quedan);
    return !vivos && !quedan;
  }
  function perdioMision() { return !lado.az.some(function (u) { return u.vivo; }) || tPelea > (mis.obj === 'tiempo' || mis.obj === 'sobrevive' ? mis.seg + (mis.obj === 'sobrevive' ? 1 : 0) : 120); }
  function paso(dt) {
    tPelea += dt; var largo = largoCamino();
    lado.az.concat(lado.ro).forEach(function (u) {
      if (!u.vivo) return;
      u.buff = Math.max(0, u.buff - dt); u.escudo = Math.max(0, u.escudo - dt); u.cd -= dt; u.anda = false;
      if (u.aturdido > 0) { u.aturdido -= dt; return; }
      var o = objetivo(u); if (!o) return;
      if (u.sana) { u.sana -= dt; if (u.sana <= 0) { u.sana = 5; var her = aliados(u).sort(function (a, b) { return a.hp / a.max - b.hp / b.max; })[0]; if (her && her.hp < her.max) { her.hp = Math.min(her.max, her.hp + her.max * 0.12); efectos.push({ tipo: 'cura', x: her.x, y: her.y, t: 0, dur: 1 }); } } }
      var d = dist(u, o), alcance = u.rango * largo;
      if (d > alcance) { var v = largo * 0.11 * (u.vel || 1) * dt, k = Math.min(1, v / d); u.x += (o.x - u.x) * k; u.y += (o.y - u.y) * k * 0.6; u.anda = true; }
      else if (u.cd <= 0) { u.cd = u.ritmo; atacar(u, o); }
      if (u.en >= 100 && u.habs) lanzarJefe(u);
      else if (u.en >= 100 && (u.lado === 'ro' || auto)) lanzar(u);
    });
    // que no se encimen
    var vs = lado.az.concat(lado.ro).filter(function (u) { return u.vivo; });
    for (var i = 0; i < vs.length; i++) for (var j = i + 1; j < vs.length; j++) { var a = vs[i], b = vs[j], dd = dist(a, b); if (dd < 46 && dd > 0.01) { var e = (46 - dd) / 2 /* v9.38 (dueño): que no se acerquen tanto */, ux = (a.x - b.x) / dd, uy = (a.y - b.y) / dd; a.x += ux * e; a.y += uy * e; b.x -= ux * e; b.y -= uy * e; } }
    if (mis) refuerzos.forEach(function (r) { if (!r.ya && tPelea >= r.t) { r.ya = true; var n0 = lado.ro.length; r.l.forEach(function (e, k) { var m = escuadronMision(e, n0 + k, r.l.length, 0.97); m.y = punto(0.97, r.l.length > 1 ? -0.85 + k * 1.7 / (r.l.length - 1) : 0).y; lado.ro.push(m); efectos.push({ tipo: 'boom', x: m.x, y: m.y, r: 28, t: 0, dur: 0.5 }); }); var av = $('tkc-aviso'); if (av) { av.textContent = '⚠️ ' + L('¡Llegan refuerzos enemigos!', 'Enemy reinforcements!'); av.classList.remove('on'); void av.offsetWidth; av.classList.add('on'); } if (G) G.sonar('cuerno'); } });
    if (!terminado && mis) { if (ganoMision()) fin(true); else if (perdioMision()) fin(false); }
    else if (!terminado) {
      if (!lado.ro.some(function (u) { return u.vivo; })) fin(true);
      else if (!lado.az.some(function (u) { return u.vivo; }) || tPelea > 120) fin(false);
    }
  }
  var errBucle = 0;
  /* v9.35 (dueño): BAJAS JUSTAS. Ganando: cae el % de vida que perdió cada escuadrón (0 daño = 0 bajas). Perdiendo: caen todas las tropas enviadas (los héroes nunca).
     De las caídas, el 70 % va herido a la Enfermería (hasta llenar las camas) y solo el 30 % muere. */
  function bajasCampana(gano) {
    var caidas = {}, env = 0, tot = 0;
    lado.az.forEach(function (u) { if (!u.tropa) return; env += u.nT; var fr = gano ? Math.min(1, Math.max(0, 1 - Math.max(0, u.hp) / u.max)) : 1, q = Math.min(u.nT, Math.round(u.nT * fr)); if (q > 0) { caidas[u.tropa] = (caidas[u.tropa] || 0) + q; tot += q; } });
    var her = {}, muer = {}; Object.keys(caidas).forEach(function (k) { var h = Math.round(caidas[k] * 0.7); her[k] = h; muer[k] = caidas[k] - h; });
    var nHer = 0, nMuer = 0;
    if (G && G.herir) { try { var rh = G.herir(her); nHer = rh.heridos || 0; Object.keys(rh.sinCama || {}).forEach(function (k) { muer[k] = (muer[k] || 0) + rh.sinCama[k]; }); } catch (e) { Object.keys(her).forEach(function (k) { muer[k] = (muer[k] || 0) + her[k]; }); } }
    else Object.keys(her).forEach(function (k) { muer[k] = (muer[k] || 0) + her[k]; });
    if (G && G.perder) { try { nMuer = G.perder(muer); } catch (e) {} }
    Object.keys(caidas).forEach(function (k) { if (selT[k]) selT[k] = Math.max(0, selT[k] - caidas[k]); });
    if (!env) return '';
    var nf = function (x) { return G ? G.num(x) : x; };
    var pedH = 0; Object.keys(her).forEach(function (k) { pedH += her[k]; });
    return '<p class="tkc-perd">🛡️ ' + L('Sobrevivieron ', 'Survived ') + '<b>' + nf(Math.max(0, env - tot)) + '</b> · 🏥 ' + L('A la Enfermería ', 'To the Infirmary ') + '<b>' + nf(nHer) + '</b> · 💀 ' + L('Murieron ', 'Died ') + '<b>' + nf(nMuer) + '</b>' + (pedH > nHer ? '<br><small>' + L('No había camas libres en la Enfermería para ' + nf(pedH - nHer) + ' heridos: construye o sube Enfermerías.', 'No free Infirmary beds for ' + nf(pedH - nHer) + ' wounded: build or upgrade Infirmaries.') + '</small>' : '') + '</p>';
  }
  function bucle(t) {
    if (!corriendo) return;
    requestAnimationFrame(bucle); /* v9.30 (dueño: «se para»): el siguiente fotograma se pide ANTES, así un fallo al dibujar ya no congela la batalla */
    var dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
    try { if (modo === 'pelea' && !terminado) paso(dt * vel); } catch (e) { if (errBucle++ < 5) console.warn('Campaña · paso:', e); }
    try { dibujar(dt * vel); } catch (e) { if (errBucle++ < 5) console.warn('Campaña · dibujar:', e); }
    try { if (modo === 'pelea') pintarRetratos(); } catch (e) { if (errBucle++ < 5) console.warn('Campaña · retratos:', e); }
  }

  // ---------------- pantallas (HTML encima del dibujo) ----------------
  function arriba() {
    return '<div class="tkc-arriba"><div class="tkc-pod tkc-az">' + L('Tu poder', 'Your power') + '<b id="tkc-pa">' + num(poderLado(lado.az)) + '</b></div>' +
      (mis ? '<div class="tkc-et tkc-mi">' + esc(mis.corto || '') + '<b>' + esc(mis.num || '') + '</b></div>' : '<div class="tkc-et">' + L('Etapa', 'Stage') + '<b>' + etapa + '</b></div>') +
      '<div class="tkc-pod tkc-ro">' + L('Poder enemigo', 'Enemy power') + '<b>' + num(poderLado(lado.ro)) + '</b></div></div>' +
      '<button class="tkc-x" data-c="cerrar">✕</button>' +
      (mis ? '<div class="tkc-obj" id="tkc-obj">🎯 ' + esc(mis.objTxt || '') + '</div><div class="tkc-jefe" id="tkc-jefe"></div><div class="tkc-aviso" id="tkc-aviso"></div>' : '');
  }
  function pintarMision() {
    var ob = $('tkc-obj'); if (ob && (mis.obj === 'tiempo' || mis.obj === 'sobrevive')) ob.innerHTML = '🎯 ' + esc(mis.objTxt || '') + ' · <b>' + Math.max(0, Math.ceil(mis.seg - tPelea)) + 's</b>';
    var j = lado.ro.filter(function (u) { return u.jefe; })[0], jb = $('tkc-jefe'); if (!jb) return;
    if (!j) { jb.style.display = 'none'; return; }
    if (!jb.firstChild) jb.innerHTML = '<span>' + j.ico + ' ' + esc(j.nom || '') + '</span><div><i></i></div>';
    jb.querySelector('i').style.width = Math.round(100 * Math.max(0, j.hp) / j.max) + '%'; jb.classList.toggle('muerto', !j.vivo);
  }
  function htmlTropas() {
    if (!tropasD.length) return '<p class="tkc-tn">' + L('No tienes tropas en casa. Entrénalas para llevarlas a la Campaña.', 'No troops at home. Train some to bring them to the Campaign.') + '</p>';
    var nTipos = Object.keys(selT).filter(function (k) { return selT[k] > 0; }).length;
    return '<div class="tkc-tit"><span>⚔️ ' + L('Tus tropas (elige cuáles y cuántas van)', 'Your troops (choose which and how many)') + '</span><span>' + nTipos + ' / ' + MAX_TIPOS + '</span></div><div class="tkc-trs">' + tropasD.map(function (t) {
      var mx = Math.min(t.n, topeTropa()), v = Math.min(selT[t.k] || 0, mx);
      return '<div class="tkc-tr' + (v ? ' sel' : '') + '"><span class="tkc-ti">' + t.ico + '</span><span class="tkc-td"><b>' + esc(t.nombre) + '</b><small>' + (G ? G.num(v) : v) + ' / ' + (G ? G.num(mx) : mx) + '</small></span>' +
        [[0, '0'], [0.25, '¼'], [0.5, '½'], [1, L('Todas', 'All')]].map(function (q) { return '<button class="tkc-tb' + (v === Math.floor(mx * q[0]) && (q[0] || !v) ? ' on' : '') + '" data-c="tropa" data-k="' + esc(t.k) + '" data-f="' + q[0] + '">' + q[1] + '</button>'; }).join('') + '</div>';
    }).join('') + '</div><p class="tkc-tn">' + L('Las tropas que caen en la batalla se pierden. Si pierdes, cambia tus tropas o manda más y vuelve a intentarlo.', 'Troops that fall in battle are lost. If you lose, change your troops or send more and try again.') + ' ' + L('Máximo ' + topeTropa() + ' de cada tipo en este capítulo; los heridos van a la Enfermería.', 'Up to ' + topeTropa() + ' of each type in this chapter; the wounded go to the Infirmary.') + '</p>';
  }
  function pantallaFormacion() {
    if (G && G.tropas) { tropasD = G.tropas(); Object.keys(selT).forEach(function (k) { if (!tropasD.some(function (t) { return t.k === k; })) delete selT[k]; }); }
    modo = 'formacion'; terminado = false; efectos = []; medir(); armarLados();
    var mapa = {}; heroes.forEach(function (h) { mapa[h.id] = h; });
    var lista = heroes.slice().sort(function (a, b) { return (b.dano * 6 + b.vida / 3) - (a.dano * 6 + a.vida / 3); });
    raiz.querySelector('.tkc-ui').innerHTML = arriba() +
      '<div class="tkc-abajo"><div class="tkc-tit"><span>🦸 ' + L('Elige hasta 5 héroes', 'Choose up to 5 heroes') + '</span><span>' + sel.length + ' / 5</span></div>' +
      (lista.length ? '<div class="tkc-grid">' + lista.map(function (h) { var k = sel.indexOf(h.id); return '<button class="tkc-h' + (k >= 0 ? ' sel' : '') + '" data-c="heroe" data-id="' + esc(h.id) + '" data-n="' + (k + 1) + '">' + (h.foto ? '<img src="' + esc(h.foto) + '" alt="">' : '🦸') + '<i>' + L('Nv ', 'Lv ') + h.nivel + '</i><small>' + esc(h.nombre) + '</small></button>'; }).join('') + '</div>' : '<p>' + L('Todavía no tienes héroes. Recluta uno en Tropas › Héroes.', 'You have no heroes yet. Recruit one in Troops › Heroes.') + '</p>') +
      htmlTropas() +
      '<div class="tkc-bts"><button class="tkc-b gris" data-c="cerrar">' + (mis ? '🗺️ ' + L('Mapa', 'Map') : '✕ ' + L('Salir', 'Exit')) + '</button><button class="tkc-b azul" data-c="rapido">⚡ ' + L('Rápido', 'Quick') + '</button><button class="tkc-b naranja" data-c="luchar">⚔️ ' + L('Luchar', 'Fight') + '</button></div></div>';
  }
  function pantallaPelea() {
    modo = 'pelea'; terminado = false; efectos = []; medir(); armarLados();
    raiz.querySelector('.tkc-ui').innerHTML = arriba() +
      '<div class="tkc-abajo"><div class="tkc-ret"><div class="tkc-ret" id="tkc-rets" style="flex:1">' + lado.az.map(function (u, i) { return '<div class="tkc-r" data-c="hab" data-i="' + i + '">' + (u.h.foto ? '<img src="' + esc(u.h.foto) + '" alt="">' : (u.ico || '🦸')) + '<div class="bv"><i></i></div><div class="be"><i></i></div></div>'; }).join('') + '</div>' +
      '<div class="tkc-ctl"><button class="tkc-c' + (vel === 2 ? ' on' : '') + '" data-c="vel">x2</button><button class="tkc-c' + (vel > 2 ? ' on' : '') + '" data-c="saltar">⏭</button><button class="tkc-c' + (auto ? ' on' : '') + '" data-c="auto">' + L('Auto', 'Auto') + '</button></div></div></div>' +
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
    if (mis) pintarMision();
  }
  function fin(gano) {
    terminado = true;
    setTimeout(function () {
      var ui = raiz.querySelector('.tkc-ui'), n = etapa, items = [];
      if (mis) { finMision(gano, ui); return; }
      if (gano && G) { try { items = G.ganar(n, sel.slice()); } catch (e) { console.error(e); } etapa = G.etapa(); }
      var txtPerd = bajasCampana(gano); /* v9.35 */
      if (G) G.sonar(gano ? 'victoria' : 'derrota');
      var d = document.createElement('div'); d.className = 'tkc-fin';
      d.innerHTML = gano
        ? '<div class="tkc-fc"><h2>🏆 ' + L('¡Victoria!', 'Victory!') + '</h2><p>' + L('Etapa ', 'Stage ') + n + L(' superada', ' cleared') + '</p>' + txtPerd + '<div class="tkc-pr">' + items.map(function (x) { return '<div>' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span>' + x.ico + '</span>') + esc(x.nom) + '<b>' + esc(x.n) + '</b></div>'; }).join('') + '</div><div class="tkc-bts"><button class="tkc-b gris" data-c="cerrar">' + L('Salir', 'Exit') + '</button><button class="tkc-b verde" data-c="siguiente">' + L('Etapa ', 'Stage ') + etapa + ' ▶</button></div></div>'
        : '<div class="tkc-fc mal"><h2>💔 ' + L('¡Derrota!', 'Defeat!') + '</h2><p>' + L('Los enemigos de la etapa ', 'The enemies of stage ') + n + L(' fueron más fuertes. Mejora tus héroes o cambia tu alineación.', ' were stronger. Upgrade your heroes or change your lineup.') + '</p>' + txtPerd + '<p>' + L('Puedes cambiar tus tropas o mandar más y reintentar ya.', 'You can change your troops or send more and retry now.') + '</p><div class="tkc-bts"><button class="tkc-b azul" data-c="mejorar">🦸 ' + L('Mejorar héroes', 'Upgrade heroes') + '</button><button class="tkc-b naranja" data-c="alineacion">🔁 ' + L('Cambiar alineación', 'Change lineup') + '</button></div></div>';
      ui.appendChild(d);
      if (gano && auto && !mis) setTimeout(function () { if (d.parentNode && raiz) { pantallaFormacion(); } }, 6000);
    }, 900);
  }

  /* v9.00: resultado de una misión: estrellas, premios (los da el mapa) y volver */
  function finMision(gano, ui) {
    var heroesCaidos = lado.az.filter(function (u) { return !u.tropa && !u.vivo; }).length, vida = 0, vmax = 0;
    lado.az.forEach(function (u) { vida += Math.max(0, u.hp); vmax += u.max; });
    var e3 = mis.obj === 'sobrevive' ? vida >= vmax * 0.5 : tPelea <= mis.t3;
    var est = gano ? 1 + (heroesCaidos === 0 ? 1 : 0) + (e3 ? 1 : 0) : 0;
    var txtPerd = bajasCampana(gano); /* v9.35 */
    var r = { items: [] }; try { r = mis.alTerminar({ gano: gano, estrellas: est, t: tPelea, heroes: sel.slice() }) || r; } catch (e) { console.error(e); }
    if (G) G.sonar(gano ? 'victoria' : 'derrota');
    var estHtml = '<div class="tkc-est">' + [1, 2, 3].map(function (k) { return '<span class="' + (k <= est ? 'on' : '') + '" style="animation-delay:' + (0.25 * k) + 's">★</span>'; }).join('') + '</div>';
    var premios = r.items && r.items.length ? '<div class="tkc-pr">' + r.items.map(function (x) { return '<div>' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span>' + x.ico + '</span>') + esc(x.nom) + '<b>' + esc(x.n) + '</b></div>'; }).join('') + '</div>' : '';
    var d = document.createElement('div'); d.className = 'tkc-fin';
    d.innerHTML = gano
      ? '<div class="tkc-fc"><h2>🏆 ' + L('¡Victoria!', 'Victory!') + '</h2><p>' + esc(mis.titulo || '') + '</p>' + estHtml + (r.nota ? '<p class="tkc-nota">' + r.nota + '</p>' : '') + txtPerd + premios +
        '<div class="tkc-bts"><button class="tkc-b gris" data-c="mapa">🗺️ ' + L('Mapa', 'Map') + '</button><button class="tkc-b azul" data-c="alineacion">🔁 ' + L('Repetir', 'Replay') + '</button>' + (mis.haySiguiente ? '<button class="tkc-b verde" data-c="sig">' + L('Siguiente', 'Next') + ' ▶</button>' : '') + '</div></div>'
      : '<div class="tkc-fc mal"><h2>💔 ' + L('¡Derrota!', 'Defeat!') + '</h2><p>' + esc(mis.titulo || '') + '</p>' + estHtml + '<p>' + L('Mejora tus héroes, cambia la alineación o lleva más tropas.', 'Upgrade your heroes, change the lineup or bring more troops.') + '</p>' + txtPerd +
        '<div class="tkc-bts"><button class="tkc-b gris" data-c="mapa">🗺️ ' + L('Mapa', 'Map') + '</button><button class="tkc-b azul" data-c="mejorar">🦸 ' + L('Héroes', 'Heroes') + '</button><button class="tkc-b naranja" data-c="alineacion">🔁 ' + L('Reintentar', 'Retry') + '</button></div></div>';
    ui.appendChild(d);
  }
  // ---------------- abrir / cerrar ----------------
  function clic(ev) {
    var b = ev.target.closest('[data-c]'); if (!b) return;
    var c = b.getAttribute('data-c');
    if (c === 'cerrar' || c === 'mapa') { var m0 = mis; cerrar(); if (m0 && m0.alSalir) m0.alSalir(); return; }
    if (c === 'sig') { var m1 = mis; cerrar(); if (m1 && m1.alSiguiente) m1.alSiguiente(); return; }
    if (G) G.sonar('click');
    if (c === 'heroe') { var id = b.getAttribute('data-id'), k = sel.indexOf(id); if (k >= 0) sel.splice(k, 1); else if (sel.length < 5) sel.push(id); else { G && G.consejo(L('Ya tienes 5 héroes: quita uno para cambiarlo.', 'You already have 5 heroes: remove one first.')); return; } G && G.equipo(sel); pantallaFormacion(); }
    else if (c === 'rapido') { sel = heroes.slice().sort(function (a, b2) { return (b2.dano * 6 + b2.vida / 3) - (a.dano * 6 + a.vida / 3); }).slice(0, 5).map(function (h) { return h.id; }); G && G.equipo(sel);
      /* v9.35 (dueño): también las tropas: hasta 4 tipos, primero espadachines, arqueros, caballería y guardianes, cada uno con el máximo del capítulo */
      var PREF = ['espadachin', 'arquero', 'caballeria', 'guardian'], cap = topeTropa(); selT = {};
      tropasD.slice().sort(function (x, y) { var px = PREF.indexOf(x.k), py = PREF.indexOf(y.k); px = px < 0 ? 99 : px; py = py < 0 ? 99 : py; return px - py || (y.vida + y.dano * 6) - (x.vida + x.dano * 6); }).slice(0, MAX_TIPOS).forEach(function (t) { selT[t.k] = Math.min(t.n, cap); });
      pantallaFormacion(); }
    else if (c === 'luchar') { if (!sel.length && !Object.keys(selT).some(function (k) { return selT[k] > 0; })) { G && G.consejo(L('Elige al menos un héroe o una tropa.', 'Choose at least one hero or troop.')); return; } if (mis && mis.alEmpezar && !mis.alEmpezar()) return; tPelea = 0; pantallaPelea(); } /* v9.05: las misiones gastan botellas al empezar */
    else if (c === 'tropa') { var tk = b.getAttribute('data-k'), fr = +b.getAttribute('data-f'), tt = tropasD.filter(function (x) { return x.k === tk; })[0]; if (!tt) return; var ya = Object.keys(selT).filter(function (k) { return selT[k] > 0 && k !== tk; }).length; if (fr > 0 && ya >= MAX_TIPOS) { G && G.consejo(L('Máximo ' + MAX_TIPOS + ' tipos de tropa: quita uno.', 'Max ' + MAX_TIPOS + ' troop types: remove one.')); return; } selT[tk] = Math.floor(Math.min(tt.n, topeTropa()) * fr); pantallaFormacion(); }
    else if (c === 'hab') { var u = lado.az[+b.getAttribute('data-i')]; if (u) lanzar(u); }
    else if (c === 'vel') { vel = vel === 2 ? 1 : 2; b.classList.toggle('on', vel === 2); var bs = raiz.querySelector('[data-c=saltar]'); if (bs) bs.classList.remove('on'); }
    else if (c === 'saltar') { vel = vel > 2 ? 1 : 8; b.classList.toggle('on', vel > 2); var bv = raiz.querySelector('[data-c=vel]'); if (bv) bv.classList.remove('on'); if (vel > 2 && !auto) { auto = true; var ba = raiz.querySelector('[data-c=auto]'); if (ba) ba.classList.add('on'); } } /* v9.02: pasar la batalla rápido (x8, con habilidades automáticas) */
    else if (c === 'auto') { auto = !auto; G && G.auto(auto); b.classList.toggle('on', auto); }
    else if (c === 'siguiente' || c === 'alineacion') pantallaFormacion();
    else if (c === 'mejorar') { cerrar(); G && G.heroesPanel(); }
  }
  function cerrar() { corriendo = false; if (raiz) raiz.remove(); raiz = null; cx = null; window.removeEventListener('resize', alCambiar); if (G) G.abierta(false); }
  function alCambiar() { if (raiz) medir(); }
  function abrir(cfg) {
    G = window.__tkCamp; if (!G) return false;
    mis = cfg && cfg.enemigos ? cfg : null; sacude = 0; refuerzos = [];
    if (!$('tkc-css')) { var st = document.createElement('style'); st.id = 'tkc-css'; st.textContent = CSS + CSS_TR + CSS_SALIR + CSS_MIS + CSS_MED; document.head.appendChild(st); }
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
  window.TKCampana = { abrir: function () { return abrir(null); }, abrirMision: function (cfg) { return abrir(cfg); }, cerrar: cerrar, simular: function (seg) { for (var i = 0; i < seg * 30; i++) { if (modo === 'pelea' && !terminado) paso(1 / 30); efectos.forEach(function (e) { e.t += 1 / 30; }); } dibujar(0); pintarRetratos(); return this.info(); }, info: function () { return { modo: modo, t: Math.round(tPelea * 10) / 10, fin: terminado, az: lado.az.map(function (u) { return Math.round(u.hp) + '@' + Math.round(u.x); }), ro: lado.ro.map(function (u) { return Math.round(u.hp) + '@' + Math.round(u.x); }) }; } };
})();
