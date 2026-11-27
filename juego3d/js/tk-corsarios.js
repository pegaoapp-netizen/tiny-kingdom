/* v9.93 · BAHÍA DE LOS CORSARIOS: la 2.ª ciudad (la primera villa que fundas en el mapa) se ve como una isla pirata. (Claude)
   La ciudad principal no se toca: esta capa solo se activa con la villa n.º 2 y al volver a la principal todo queda como estaba.
   Solo visual: no toca reglas, edificios, niveles, tropas ni guardado. Los edificios siguen siendo los mismos (mismas parcelas, mismos niveles
   y el mismo toque para abrirlos); solo se dibujan con su versión pirata, que crece y se adorna con el nivel.
   Qué hay: isla tropical con playa, acantilados y cascadas; océano turquesa animado; puerto con muelles de madera, galeones de velas negras
   amarrados y navegando; fortaleza pirata en una montaña con forma de calavera (crece con el nivel del castillo); puentes colgantes,
   cañones, cuevas del tesoro, palmeras con viento, gaviotas y piratas por los caminos; de noche faroles dorados, antorchas, ventanas,
   ojos de la calavera encendidos y reflejos en el mar (con js/tk-dia-noche.js).
   Todo se dibuja con pocas llamadas: la geometría fija va fundida con colores por vértice. Prueba: ?corsarios=1 o TKCorsarios.forzar(true). */
(function () {
  'use strict';
  if (!window.THREE) return;
  var T3 = THREE, X = function () { return window.__tkExtras; }, C = function () { var x = X(); return x && x.ciudad; };
  var FORZAR = /[?&]corsarios=1(?:&|$)/.test(location.search) ? true : null;
  var activa = false, ESC = null, raiz = null, ocultos = [], foto = null, tiempo = 0;
  var U = { t: { value: 0 }, noche: { value: 0 }, viento: { value: 1 } };
  var NOOP = function () {};

  // ======================================================================
  //  HERRAMIENTAS: constructor de geometría con color por vértice (todo se funde en una malla)
  // ======================================================================
  var o3 = new T3.Object3D(), mN = new T3.Matrix3(), vA = new T3.Vector3(), vB = new T3.Vector3(), cA = new T3.Color();
  function azar(sem) { var s = sem || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function Cons() { this.p = []; this.n = []; this.c = []; }
  Cons.prototype.add = function (geo, m4, color, var1) {
    var g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, Nn = g.attributes.normal;
    mN.getNormalMatrix(m4); cA.set(color);
    var jit = var1 === undefined ? 0.06 : var1;
    for (var i = 0; i < P.count; i++) {
      if (i % 3 === 0) { var j = 1 + (Math.random() - 0.5) * jit; var r = cA.r * j, gg = cA.g * j, b = cA.b * j; }
      vA.fromBufferAttribute(P, i).applyMatrix4(m4); this.p.push(vA.x, vA.y, vA.z);
      vB.fromBufferAttribute(Nn, i).applyMatrix3(mN).normalize(); this.n.push(vB.x, vB.y, vB.z);
      this.c.push(r, gg, b);
    }
    if (g !== geo) g.dispose();
    return this;
  };
  function mat4(x, y, z, rx, ry, rz, sx, sy, sz) { o3.position.set(x || 0, y || 0, z || 0); o3.rotation.set(rx || 0, ry || 0, rz || 0); o3.scale.set(sx || 1, sy === undefined ? (sx || 1) : sy, sz === undefined ? (sx || 1) : sz); o3.updateMatrix(); return o3.matrix.clone(); }
  var GEO = {};
  function gBox() { return GEO.box || (GEO.box = new T3.BoxGeometry(1, 1, 1)); }
  function gCil(seg) { var k = 'c' + seg; return GEO[k] || (GEO[k] = new T3.CylinderGeometry(0.5, 0.5, 1, seg || 8)); }
  function gCono(seg) { var k = 'k' + seg; return GEO[k] || (GEO[k] = new T3.ConeGeometry(0.5, 1, seg || 8)); }
  function gEsf(seg) { var k = 's' + seg; return GEO[k] || (GEO[k] = new T3.SphereGeometry(0.5, seg || 10, Math.max(4, ((seg || 10) * 0.7) | 0))); }
  // atajos (posición en el centro de la pieza, giro en Y)
  Cons.prototype.caja = function (w, h, d, col, x, y, z, ry, rx, rz) { return this.add(gBox(), mat4(x, y, z, rx, ry, rz, w, h, d), col); };
  Cons.prototype.cil = function (r, h, col, x, y, z, seg, rx, rz, ry, r2) { var m = mat4(x, y, z, rx, ry, rz, r * 2, h, (r2 || r) * 2); return this.add(gCil(seg), m, col); };
  Cons.prototype.cono = function (r, h, col, x, y, z, seg, ry, rx) { return this.add(gCono(seg), mat4(x, y, z, rx, ry, 0, r * 2, h, r * 2), col); };
  Cons.prototype.esf = function (r, col, x, y, z, sx, sy, sz, seg) { return this.add(gEsf(seg), mat4(x, y, z, 0, 0, 0, r * 2 * (sx || 1), r * 2 * (sy || 1), r * 2 * (sz || 1)), col); };
  // tablón entre dos puntos (cuerdas, vigas, barandas)
  Cons.prototype.viga = function (a, b, grueso, col, seg) {
    var d = new T3.Vector3().subVectors(b, a), l = d.length(); if (l < 1e-4) return this;
    var q = new T3.Quaternion().setFromUnitVectors(new T3.Vector3(0, 1, 0), d.clone().normalize());
    var m = new T3.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new T3.Vector3(grueso, l, grueso));
    return this.add(seg ? gCil(seg) : gBox(), m, col, 0.03);
  };
  Cons.prototype.malla = function (mat) {
    var g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    var me = new T3.Mesh(g, mat || MAT.solido); me.castShadow = true; me.receiveShadow = true; me.raycast = NOOP; return me;
  };
  var MAT = {};
  function materiales() {
    if (MAT.solido) return;
    MAT.solido = new T3.MeshLambertMaterial({ vertexColors: true });
    MAT.rocaPBR = parcharPBR(new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.4 }), false);
    MAT.palma = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide });
    MAT.palma.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.uniforms.uV = U.viento; sh.vertexShader = 'uniform float uT; uniform float uV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec4 kI = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n#else\n vec4 kI = vec4(0.0);\n#endif\n float kA = max(0.0, position.y - 1.0) * 0.045 * uV; transformed.x += sin(uT * 1.3 + kI.x * 0.3 + kI.z * 0.2) * kA; transformed.z += cos(uT * 1.1 + kI.z * 0.25) * kA * 0.7;'); };
    MAT.palma.customProgramCacheKey = function () { return 'tkcPalma'; };
    MAT.tela = function (tex, rigida) {
      var m = new T3.MeshLambertMaterial({ map: tex, side: T3.DoubleSide, alphaTest: 0.5 }); m.userData.tkpSinVentanas = true;
      m.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.uniforms.uV = U.viento; sh.vertexShader = 'uniform float uT; uniform float uV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float kC = ' + (rigida ? '0.35' : '1.0') + ' * uv.x; transformed.z += sin(uT * 3.1 + uv.x * 7.0 + uv.y * 2.0) * 0.16 * kC * uV; transformed.y += sin(uT * 2.3 + uv.x * 5.0) * 0.04 * kC * uV;'); };
      m.customProgramCacheKey = function () { return 'tkcTela' + (rigida ? 'R' : ''); }; return m;
    };
    MAT.vela = new T3.MeshLambertMaterial({ color: 0x1c1a1e, side: T3.DoubleSide }); MAT.vela.userData.tkpSinVentanas = true;
    MAT.vela.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float kB = 1.0 - pow(abs(uv.x * 2.0 - 1.0), 2.0); float kH = 1.0 - pow(abs(uv.y * 2.0 - 1.0), 2.0); transformed.z += kB * kH * (0.55 + 0.08 * sin(uT * 1.7 + position.y));'); };
    MAT.vela.customProgramCacheKey = function () { return 'tkcVela'; };
    MAT.ojos = new T3.MeshBasicMaterial({ color: 0x1a0c06 }); MAT.ojos.userData.tkpSinVentanas = true;
    MAT.farol = new T3.MeshBasicMaterial({ color: 0x3a2a14 }); MAT.farol.userData.tkpSinVentanas = true;
    MAT.cascada = new T3.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: U.t, uN: U.noche },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; uniform float uN; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }' +
        ' void main(){ vec2 q = vec2(vUv.x * 6.0, vUv.y * 3.0 + uT * 2.6); float s = n(q * vec2(3.0, 1.2)) * 0.6 + n(q * vec2(7.0, 2.5)) * 0.4; float borde = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x); float a = borde * (0.55 + 0.45 * s) * (0.75 + 0.25 * smoothstep(0.0, 0.2, vUv.y)); vec3 c = mix(vec3(0.55, 0.85, 0.95), vec3(1.0), smoothstep(0.45, 0.85, s)); c *= mix(1.0, 0.35, uN); gl_FragColor = vec4(c * 1.15, a * 0.88); }' });
  }
  // texturas pintadas (bandera con calavera, letreros)
  function texBandera(fondo, hueso) {
    var cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; var x = cv.getContext('2d');
    x.fillStyle = fondo; x.fillRect(0, 0, 128, 96); x.fillStyle = 'rgba(255,255,255,.06)'; for (var i = 0; i < 12; i++) x.fillRect(0, i * 8, 128, 1);
    x.fillStyle = hueso; x.save(); x.translate(64, 40);
    x.beginPath(); x.ellipse(0, -4, 17, 18, 0, 0, 6.283); x.fill(); x.fillRect(-10, 8, 20, 10);
    x.fillStyle = fondo; x.beginPath(); x.ellipse(-7, -4, 5, 6, 0, 0, 6.283); x.ellipse(7, -4, 5, 6, 0, 0, 6.283); x.fill();
    x.beginPath(); x.moveTo(0, 3); x.lineTo(-3, 8); x.lineTo(3, 8); x.fill(); for (var t = -8; t <= 8; t += 4) x.fillRect(t - 0.6, 12, 1.2, 6);
    x.fillStyle = hueso; x.lineCap = 'round'; x.strokeStyle = hueso; x.lineWidth = 6;
    x.beginPath(); x.moveTo(-30, 18); x.lineTo(30, 44); x.moveTo(30, 18); x.lineTo(-30, 44); x.stroke();
    [[-30, 18], [30, 44], [30, 18], [-30, 44]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 5, 0, 6.283); x.fill(); });
    x.restore();
    var tx = new T3.CanvasTexture(cv); tx.anisotropy = 2; return tx;
  }
  var TEX = {};
  function telaBandera(tipo) { var k = tipo || 'negra'; if (!TEX[k]) TEX[k] = MAT.tela(texBandera(k === 'roja' ? '#7a1010' : '#141216', '#efe6d2')); return TEX[k]; }
  // bandera: un plano con muchas divisiones (ondea en el dibujo)
  function bandera(grupo, x, y, z, ancho, alto, ry, tipo) {
    var g = new T3.PlaneGeometry(ancho, alto, 8, 3); g.translate(ancho / 2, 0, 0);
    var m = new T3.Mesh(g, telaBandera(tipo)); m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.raycast = NOOP; grupo.add(m); return m;
  }

  // ======================================================================
  //  ISLA v2 (según la imagen del dueño): meseta de la villa, terraza al pie de la montaña, bahía semicircular con playa,
  //  promontorios rocosos y acantilados verticales. Tres niveles: playa (-4,5), villa (0) y terraza (+5). Mar a -6.
  // ======================================================================
  var ISLA = null;
  function ruido2(x, y) { var s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }
  function vruido(x, y) { var i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j; f = f * f * (3 - 2 * f); g = g * g * (3 - 2 * g); var a = ruido2(i, j), b = ruido2(i + 1, j), c = ruido2(i, j + 1), d = ruido2(i + 1, j + 1); return a + (b - a) * f + (c - a) * g + (a - b - c + d) * f * g; }
  function fbm(x, y) { return vruido(x, y) * 0.55 + vruido(x * 2.1 + 3, y * 2.1 - 1) * 0.3 + vruido(x * 4.3 - 7, y * 4.3 + 5) * 0.15; }
  function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  function h3(x, y, z) { var s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
  function vr3(x, y, z) { var i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), f = x - i, g = y - j, h = z - k; f = f * f * (3 - 2 * f); g = g * g * (3 - 2 * g); h = h * h * (3 - 2 * h);
    function L(a, b, t) { return a + (b - a) * t; }
    return L(L(L(h3(i, j, k), h3(i + 1, j, k), f), L(h3(i, j + 1, k), h3(i + 1, j + 1, k), f), g), L(L(h3(i, j, k + 1), h3(i + 1, j, k + 1), f), L(h3(i, j + 1, k + 1), h3(i + 1, j + 1, k + 1), f), g), h); }
  function fbm3(x, y, z) { return vr3(x, y, z) * 0.55 + vr3(x * 2.03 + 5, y * 2.03, z * 2.03 - 3) * 0.3 + vr3(x * 4.1, y * 4.1 + 7, z * 4.1) * 0.15; }
  function prepararIsla(c) {
    var R = c.R;
    ISLA = { R: R, agua: -6, playa: -4.5, terraza: 5,
      plat: { a0: c.campos.a - c.campos.ha - 8, a1: 46.5, hb: 48.5 },   // meseta de la villa y los campos
      terr: { a0: -60, a1: -42.5, hb: 56 },                              // terraza alta al pie de la montaña
      bahia: { a: 82, b: 0, r: 30 },                                     // bahía semicircular delante
      cabo: { a0: 46, a1: 102, hb: 58 },                                 // promontorios a los dos lados de la bahía
      monte: { a: -62 },                                                 // la montaña empieza detrás de la terraza
      frente: 46.5, atras: c.campos.a - c.campos.ha - 8, hb: 58 };
  }
  function sdCaja(a, b, ca, cb, ha, hb, r) { var qa = Math.abs(a - ca) - ha + r, qb = Math.abs(b - cb) - hb + r; return Math.hypot(Math.max(qa, 0), Math.max(qb, 0)) + Math.min(Math.max(qa, qb), 0) - r; }
  function tierra(a, b) { // distancia con signo al borde de la isla (negativo = tierra)
    var P = ISLA.plat, K = ISLA.cabo, B = ISLA.bahia, ru = (fbm(a * 0.06, b * 0.06) - 0.5) * 5 + (vruido(a * 0.3, b * 0.3) - 0.5) * 1.2;
    var dP = sdCaja(a, b, (P.a0 + P.a1) / 2, 0, (P.a1 - P.a0) / 2, P.hb, 6);
    var dT = sdCaja(a, b, (ISLA.terr.a0 - 46) / 2, 0, (-46 - ISLA.terr.a0 + 30) / 2, ISLA.terr.hb, 6);
    var dK = Math.max(sdCaja(a, b, (K.a0 + K.a1) / 2, 0, (K.a1 - K.a0) / 2, K.hb, 10), B.r - Math.hypot(a - B.a, b - B.b));
    return Math.min(dP, dT, dK) + ru * (Math.abs(a) < 44 && Math.abs(b) < 44 ? 0 : 1);
  }
  function enBahia(a, b) { return Math.hypot(a - ISLA.bahia.a, b - ISLA.bahia.b) - ISLA.bahia.r; } // negativo = agua de la bahía
  function alturaTope(a, b) { // altura de la tierra firme (sin contar el corte de los acantilados)
    var R = ISLA.R, h = 0;
    // terraza alta (+5) detrás de la villa, con su escalón vertical
    if (a < -40) h = ISLA.terraza * smooth(-40.5, -42.8, a) * (a > ISLA.terr.a0 - 4 ? 1 : 1);
    if (a < ISLA.terr.a0) { var cr = ISLA.plat.a0; h = ISLA.terraza * (1 - smooth(ISLA.terr.a0, ISLA.terr.a0 - 6, a)); } // detrás bajan los campos (los tapa la montaña en la vista de la villa)
    // delante: la playa de la bahía (-4,5) y los promontorios rocosos más altos
    if (a > 45.5) {
      var hp = ISLA.playa * smooth(45.5, 48.5, a);
      var dB = enBahia(a, b), cabo = smooth(4, 12, dB) * smooth(16, 26, Math.abs(b));
      var roca = 1.5 + fbm(a * 0.09, b * 0.09) * 6 + Math.pow(vruido(a * 0.22, b * 0.22), 3) * 4;
      h = hp * (1 - cabo) + roca * cabo;
    }
    // huecos en la ladera para las escaleras (rampa justo debajo de los escalones)
    var rampa = function (a0, a1, y0, y1, b0, ancho) { if (Math.abs(b - b0) < ancho / 2 + 0.6 && (a - a0) * (a - a1) <= 0) { var t = (a - a0) / (a1 - a0); h = Math.min(h, y0 + (y1 - y0) * t - 0.15); } };
    rampa(-46.6, -40.2, ISLA.terraza, 0, 0, 9.6); rampa(-43.8, -39.8, ISLA.terraza, 0, 34, 4.8); rampa(-43.8, -39.8, ISLA.terraza, 0, -34, 4.8); rampa(45.0, 49.8, 0, ISLA.playa, 0, 9.4);
    // colinas de los laterales (fuera de las parcelas)
    if (Math.abs(b) > 43 && a < 45 && a > -40) h += smooth(43, 47, Math.abs(b)) * (1 + fbm(a * 0.08, b * 0.05) * 3);
    return h;
  }
  function altura(a, b) {
    var d = tierra(a, b), top = alturaTope(a, b);
    var dB = enBahia(a, b);
    if (a > 47 && dB < 0 && Math.abs(b) < 34) return Math.max(ISLA.agua - 7, ISLA.playa + dB * 0.42); // dentro de la bahía: la arena baja suave hasta el agua
    if (d < -2.5) return top;
    var cae = smooth(-2.5, 1.8, d), fondo = ISLA.agua - 1.5 - Math.max(0, d) * 0.45;
    var grietas = (vruido(a * 0.7, b * 0.7) - 0.5) * 1.2 * (1 - Math.abs(cae - 0.5) * 2);
    return Math.max(ISLA.agua - 10, top * (1 - Math.pow(cae, 0.6)) + fondo * Math.pow(cae, 0.6) + grietas);
  }
  // caminos de piedra: siguen las calles entre parcelas + avenida central + plaza
  var SEGS = [];
  function prepararCaminos(c) {
    SEGS = []; var es = c.esquinas() || [];
    es.forEach(function (p, i) { es.forEach(function (q, j) { if (j <= i) return; var l1 = c.aLocal(p.x, p.z), l2 = c.aLocal(q.x, q.z); var da = Math.abs(l1.a - l2.a), db = Math.abs(l1.b - l2.b); if ((da < 0.8 && db < 15 && db > 1) || (db < 0.8 && da < 15 && da > 1)) SEGS.push([l1.a, l1.b, l2.a, l2.b, 1.5]); }); });
    SEGS.push([46, 0, 13, 0, 2.6]); SEGS.push([-13, 0, -40, 0, 2.6]); SEGS.push([0, 13, 0, 44, 2.0]); SEGS.push([0, -13, 0, -44, 2.0]);
    SEGS.push([-44, -50, -44, 50, 2.0]); // paseo de la terraza
  }
  function distCamino(a, b) { var m = 1e9, w = 1.5; for (var i = 0; i < SEGS.length; i++) { var s = SEGS[i], ax = s[2] - s[0], ay = s[3] - s[1], l = ax * ax + ay * ay, t = l ? Math.max(0, Math.min(1, ((a - s[0]) * ax + (b - s[1]) * ay) / l)) : 0, dx = a - s[0] - ax * t, dy = b - s[1] - ay * t, d = Math.sqrt(dx * dx + dy * dy) - s[4]; if (d < m) m = d; } return m; }

  // ======================================================================
  //  MATERIALES PBR con detalle en el shader: roca con estratos, grietas y musgo; arena; hierba; empedrado (sin texturas planas)
  // ======================================================================
  var GLSL_N3 = [
    'float tkH3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float tkN3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(tkH3(i), tkH3(i + vec3(1,0,0)), f.x), mix(tkH3(i + vec3(0,1,0)), tkH3(i + vec3(1,1,0)), f.x), f.y), mix(mix(tkH3(i + vec3(0,0,1)), tkH3(i + vec3(1,0,1)), f.x), mix(tkH3(i + vec3(0,1,1)), tkH3(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float tkF3(vec3 p){ return tkN3(p) * 0.5 + tkN3(p * 2.1 + 3.1) * 0.3 + tkN3(p * 4.7 - 1.3) * 0.2; }',
    'vec2 tkVor(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; float id = 0.0; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = vec2(tkH3(vec3(i + g, 1.0)), tkH3(vec3(i + g, 2.0))) * 0.8 + 0.1; float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; id = tkH3(vec3(i + g, 3.0)); } else if (d < d2) d2 = d; } return vec2(d2 - d1, id); }'
  ].join('\n');
  // tipo de superficie: rojo = roca/hierba según pendiente, color del vértice = base; atributo «piso»: 0 suelo, 1 camino empedrado, 2 arena
  var U_DET = { value: 1 }, U_FILL = { dir: { value: new T3.Vector3(0, 1, 0) }, col: { value: new T3.Color(0.5, 0.42, 0.32) } };
  function parcharPBR(m, terreno) {
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uTkcDet = U_DET; sh.uniforms.uTkFillDir = U_FILL.dir; sh.uniforms.uTkFillCol = U_FILL.col;
      sh.vertexShader = 'varying vec3 vTkW; varying vec3 vTkN;' + (terreno ? ' attribute float piso; varying float vTkPiso;' : '') + '\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vec4 tkP = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n tkP = instanceMatrix * tkP;\n#endif\n vTkW = (modelMatrix * tkP).xyz; vTkN = normalize(mat3(modelMatrix) * objectNormal);' + (terreno ? ' vTkPiso = piso;' : ''));
      sh.fragmentShader = 'uniform float uTkcDet; uniform vec3 uTkFillDir; uniform vec3 uTkFillCol; varying vec3 vTkW; varying vec3 vTkN;' + (terreno ? ' varying float vTkPiso;' : '') + '\n' + GLSL_N3 + '\n' + sh.fragmentShader
        .replace('#include <color_fragment>', [
          '#include <color_fragment>',
          ' vec3 tkn = normalize(vTkN); float tkPend = 1.0 - clamp(tkn.y, 0.0, 1.0);',
          ' float tkE = tkF3(vec3(vTkW.x * 0.35, vTkW.y * 1.6, vTkW.z * 0.35));',                   // estratos de la roca
          ' float tkG = tkF3(vTkW * 1.3);',
          ' float tkGr = 1.0 - (1.0 - smoothstep(0.0, 0.028, abs(tkF3(vTkW * vec3(0.32, 0.5, 0.32)) - 0.5))) * smoothstep(0.35, 0.6, tkN3(vTkW * 0.21 + 4.0)) * (0.4 + 0.6 * tkPend);', // grietas finas e irregulares
          ' vec3 tkRoca = mix(vec3(0.42, 0.38, 0.33), vec3(0.66, 0.60, 0.52), tkE) * (0.85 + 0.3 * tkG);',
          ' tkRoca = mix(tkRoca, tkRoca * 0.45, (1.0 - tkGr) * 0.7);',
          ' float tkMusgo = smoothstep(0.55, 0.85, tkn.y) * smoothstep(0.45, 0.65, tkF3(vTkW * 0.45 + 7.0));',
          ' vec3 tkMus = mix(vec3(0.22, 0.38, 0.14), vec3(0.36, 0.52, 0.2), tkG);',
          ' float tkEsRoca = smoothstep(0.35, 0.6, tkPend);',
          terreno ? ' vec3 tkSuelo = diffuseColor.rgb * (0.86 + 0.28 * tkF3(vTkW * 2.2)); float tkMat = vTkPiso;' : ' vec3 tkSuelo = diffuseColor.rgb; float tkMat = 0.0;',
          // empedrado envejecido (celdas irregulares con juntas oscuras y piedras de varios tonos)
          ' vec2 tkV = tkVor(vTkW.xz * 1.25); vec3 tkPied = mix(vec3(0.52, 0.48, 0.42), vec3(0.72, 0.67, 0.58), tkV.y) * (0.85 + 0.25 * tkG); tkPied = mix(vec3(0.2, 0.19, 0.17), tkPied, smoothstep(0.03, 0.12, tkV.x)); tkPied = mix(tkPied, tkMus * 0.8, smoothstep(0.7, 0.95, tkF3(vTkW * 0.8)) * 0.35);',
          ' vec3 tkArena = mix(vec3(0.86, 0.76, 0.56), vec3(0.94, 0.86, 0.68), tkG) * (0.92 + 0.12 * tkN3(vTkW * 9.0));',
          ' vec3 tkFin = tkSuelo; if (tkMat > 0.5 && tkMat < 1.5) tkFin = mix(tkSuelo, tkPied, smoothstep(0.5, 0.9, tkMat)); if (tkMat > 1.5) tkFin = tkArena;',
          terreno ? ' tkFin = mix(tkFin, mix(tkRoca, tkMus, tkMusgo * 0.6), tkEsRoca);' : ' tkFin = tkSuelo * (0.7 + 0.5 * tkE) * (0.82 + 0.3 * tkG) * mix(0.35, 1.0, tkGr); tkFin = mix(tkFin, tkMus, tkMusgo * 0.4);',
          ' diffuseColor.rgb = mix(diffuseColor.rgb, tkFin, uTkcDet);'
        ].join('\n'))
        .replace('#include <normal_fragment_maps>', [
          '#include <normal_fragment_maps>',
          // relieve (mapa normal calculado): la roca y el empedrado tienen bultos de verdad con la luz
          ' { float e = 0.12; vec3 pw = vTkW; float b0 = tkF3(pw * 1.8); float bx = tkF3((pw + vec3(e, 0.0, 0.0)) * 1.8), bz = tkF3((pw + vec3(0.0, 0.0, e)) * 1.8), by = tkF3((pw + vec3(0.0, e, 0.0)) * 1.8);',
          '   vec3 g = vec3(bx - b0, by - b0, bz - b0) / e; float kb = (0.25 + 0.55 * smoothstep(0.3, 0.6, 1.0 - clamp(normalize(vTkN).y, 0.0, 1.0))) * uTkcDet;',
          '   normal = normalize(normal - (viewMatrix * vec4(g * kb, 0.0)).xyz * 0.35); }'
        ].join('\n'))
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse += diffuseColor.rgb * uTkFillCol * (0.35 + 0.65 * max(dot(normalize(vTkN), uTkFillDir), 0.0));'); // luz de relleno (rebote del mar y del cielo de delante)
    };
    m.customProgramCacheKey = function () { return 'tkcPBR' + (terreno ? 'T' : 'R'); }; m.needsUpdate = true; m.userData.tkpSinVentanas = true;
    return m;
  }
  function crearTerreno(c) {
    var NA = 230, NB = 160, ext = { a0: ISLA.atras - 30, a1: 128, b0: -96, b1: 96 };
    var g = new T3.PlaneGeometry(1, 1, NA, NB), P = g.attributes.position, col = new Float32Array(P.count * 3), piso = new Float32Array(P.count);
    var cH = new T3.Color(0x3f7a28), cH2 = new T3.Color(0x2a5a1c), cH3 = new T3.Color(0x6a9a34), cT = new T3.Color();
    for (var i = 0; i < P.count; i++) {
      var u = P.getX(i) + 0.5, v = P.getY(i) + 0.5, a = ext.a0 + (ext.a1 - ext.a0) * u, b = ext.b0 + (ext.b1 - ext.b0) * v;
      var h = altura(a, b), w = c.aMundo(a, b); P.setXYZ(i, w[0], h, w[1]);
      cT.copy(cH).lerp(cH2, smooth(0.35, 0.7, fbm(a * 0.09, b * 0.09))).lerp(cH3, smooth(0.6, 0.85, fbm(a * 0.2 + 7, b * 0.2)) * 0.6);
      var p = 0, dB = enBahia(a, b);
      if (h < ISLA.playa + 0.6 && h > ISLA.agua - 3) p = 2;                // arena de la playa y la orilla
      if (h > -1 && h < 6.5) { var dc = distCamino(a, b); if (dc < 0.6) p = Math.max(p, dc < 0 ? 1 : 1 - smooth(0, 0.6, dc) * 0.6); }
      if (Math.hypot(a, b) < 12.5) p = 1;                                   // plaza
      col[i * 3] = cT.r; col[i * 3 + 1] = cT.g; col[i * 3 + 2] = cT.b; piso[i] = p;
    }
    var idx = g.index.array; for (var k = 0; k < idx.length; k += 3) { var t = idx[k]; idx[k] = idx[k + 1]; idx[k + 1] = t; }
    g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.setAttribute('piso', new T3.BufferAttribute(piso, 1)); g.computeVertexNormals(); g.computeBoundingSphere();
    var m = new T3.Mesh(g, parcharPBR(new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.4 }), true)); m.receiveShadow = true; m.castShadow = true; m.raycast = NOOP;
    return m;
  }
  function yEn(c, x, z) { var l = c.aLocal(x, z); return altura(l.a, l.b); }

  // ======================================================================
  //  ESCULTOR DE VOLUMEN («surface nets»): convierte una función de distancia en una malla suave y detallada.
  //  Con esto se esculpen la calavera, la montaña, el arco y los islotes (nada de figuras geométricas básicas).
  // ======================================================================
  function esculpir(sdf, min, max, paso, colorear) {
    var nx = Math.ceil((max.x - min.x) / paso) + 1, ny = Math.ceil((max.y - min.y) / paso) + 1, nz = Math.ceil((max.z - min.z) / paso) + 1;
    var V = new Float32Array(nx * ny * nz), id = function (x, y, z) { return x + nx * (y + ny * z); };
    for (var z = 0; z < nz; z++) for (var y = 0; y < ny; y++) for (var x = 0; x < nx; x++) V[id(x, y, z)] = sdf(min.x + x * paso, min.y + y * paso, min.z + z * paso);
    var vid = new Int32Array(nx * ny * nz).fill(-1), pos = [], idx = [];
    var esq = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], aris = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (z = 0; z < nz - 1; z++) for (y = 0; y < ny - 1; y++) for (x = 0; x < nx - 1; x++) {
      var vals = [], mask = 0; for (var e = 0; e < 8; e++) { var q = esq[e], vv = V[id(x + q[0], y + q[1], z + q[2])]; vals.push(vv); if (vv < 0) mask |= 1 << e; }
      if (mask === 0 || mask === 255) continue;
      var sx = 0, sy = 0, sz = 0, n = 0;
      for (var k = 0; k < 12; k++) { var A = aris[k][0], B = aris[k][1]; if ((vals[A] < 0) === (vals[B] < 0)) continue; var t = vals[A] / (vals[A] - vals[B]), qa = esq[A], qb = esq[B]; sx += qa[0] + (qb[0] - qa[0]) * t; sy += qa[1] + (qb[1] - qa[1]) * t; sz += qa[2] + (qb[2] - qa[2]) * t; n++; }
      vid[id(x, y, z)] = pos.length / 3; pos.push(min.x + (x + sx / n) * paso, min.y + (y + sy / n) * paso, min.z + (z + sz / n) * paso);
    }
    // caras: por cada arista de la rejilla que cruza la superficie, un cuadrado con los 4 vértices de alrededor
    for (z = 1; z < nz - 1; z++) for (y = 1; y < ny - 1; y++) for (x = 1; x < nx - 1; x++) {
      var v0 = V[id(x, y, z)] < 0;
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (d, eje) {
        var x1 = x + d[0], y1 = y + d[1], z1 = z + d[2]; if (x1 >= nx || y1 >= ny || z1 >= nz) return;
        if (v0 === (V[id(x1, y1, z1)] < 0)) return;
        var c;
        if (eje === 0) c = [id(x, y - 1, z - 1), id(x, y, z - 1), id(x, y, z), id(x, y - 1, z)];
        else if (eje === 1) c = [id(x - 1, y, z - 1), id(x - 1, y, z), id(x, y, z), id(x, y, z - 1)];
        else c = [id(x - 1, y - 1, z), id(x, y - 1, z), id(x, y, z), id(x - 1, y, z)];
        var a0 = vid[c[0]], a1 = vid[c[1]], a2 = vid[c[2]], a3 = vid[c[3]]; if (a0 < 0 || a1 < 0 || a2 < 0 || a3 < 0) return;
        if (v0) idx.push(a0, a1, a2, a0, a2, a3); else idx.push(a0, a2, a1, a0, a3, a2);
      });
    }
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    // normales a partir de la función (más suaves que las de los triángulos) y color por vértice (con oclusión del propio volumen)
    var nor = new Float32Array(pos.length), col = new Float32Array(pos.length), h = paso * 0.5, cc = new T3.Color();
    for (var i = 0; i < pos.length; i += 3) {
      var px = pos[i], py = pos[i + 1], pz = pos[i + 2];
      var gx = sdf(px + h, py, pz) - sdf(px - h, py, pz), gy = sdf(px, py + h, pz) - sdf(px, py - h, pz), gz = sdf(px, py, pz + h) - sdf(px, py, pz - h), l = Math.hypot(gx, gy, gz) || 1;
      gx /= l; gy /= l; gz /= l; nor[i] = gx; nor[i + 1] = gy; nor[i + 2] = gz;
      var oc = Math.max(0, Math.min(1, sdf(px + gx * 1.6, py + gy * 1.6, pz + gz * 1.6) / 1.6)) * 0.5 + Math.max(0, Math.min(1, sdf(px + gx * 3.4, py + gy * 3.4, pz + gz * 3.4) / 3.4)) * 0.5; oc = Math.pow(oc, 1.6);
      colorear(cc, px, py, pz, gx, gy, gz, oc); col[i] = cc.r; col[i + 1] = cc.g; col[i + 2] = cc.b;
    }
    g.setAttribute('normal', new T3.BufferAttribute(nor, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.computeBoundingSphere();
    return g;
  }
  var cRoca1 = new T3.Color(0x8a8070), cRoca2 = new T3.Color(0xb8ab94), cRocaOsc = new T3.Color(0x3a332c), cMusgo = new T3.Color(0x4f7a30);
  function colorRoca(cc, x, y, z, nx, ny, nz, oc) {
    cc.copy(cRoca1).lerp(cRoca2, fbm3(x * 0.12, y * 0.35, z * 0.12));
    if (ny > 0.55 && fbm3(x * 0.2 + 9, y * 0.2, z * 0.2) > 0.5) cc.lerp(cMusgo, 0.7);
    cc.lerp(cRocaOsc, (1 - oc) * 0.75);
  }
  function rocaMalla(geo) { var m = new T3.Mesh(geo, MAT.rocaPBR); m.castShadow = true; m.receiveShadow = true; m.raycast = NOOP; return m; }
  // operaciones de distancia
  function sdElip(x, y, z, cx, cy, cz, rx, ry, rz) { var px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz, k0 = Math.sqrt(px * px + py * py + pz * pz), k1 = Math.sqrt(px * px / (rx * rx) + py * py / (ry * ry) + pz * pz / (rz * rz)); return k1 > 1e-6 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz); }
  function sdCaja3(x, y, z, cx, cy, cz, hx, hy, hz, r) { var qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r; }
  function uS(a, b, k) { var h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k)); return b + (a - b) * h - k * h * (1 - h); }   // unión suave
  function rS(a, b, k) { var h = Math.max(0, Math.min(1, 0.5 - 0.5 * (a + b) / k)); return a + (-b - a) * h + k * h * (1 - h); } // resta suave: a menos b

  // ======================================================================
  //  OCÉANO v2: transparente en la orilla, turquesa → azul profundo, ondas que mueven la luz, espuma que sigue la costa real,
  //  reflejo del cielo y de los faroles. Sin puntitos blancos.
  // ======================================================================
  function crearOceano(c) {
    var N = 160, ext = 220, data = new Uint8Array(N * N * 4), ac = (ISLA.atras + 128) / 2;
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var a = ac + (i / (N - 1) - 0.5) * 2 * ext, b = (j / (N - 1) - 0.5) * 2 * ext, h = altura(a, b), k = (j * N + i) * 4; var vv = Math.max(0, Math.min(255, Math.round((h + 18) / 24 * 255))); data[k] = vv; data[k + 1] = vv; data[k + 2] = vv; data[k + 3] = 255; }
    var tex = new T3.DataTexture(data, N, N, T3.RGBAFormat); tex.magFilter = T3.LinearFilter; tex.minFilter = T3.LinearFilter; tex.needsUpdate = true;
    var m = new T3.MeshPhongMaterial({ color: 0x1a8fbf, specular: 0xeaf6ff, shininess: 120, transparent: true });
    m.userData.tkpSinVentanas = true;
    var uni = { uTkcT: U.t, uTkcAlt: { value: tex }, uTkcU: { value: new T3.Vector2(c.ejeU.x, c.ejeU.z) }, uTkcV: { value: new T3.Vector2(c.ejeV.x, c.ejeV.z) }, uTkcAc: { value: ac }, uTkcExt: { value: ext }, uTkcN: U.noche, uTkcAgua: { value: ISLA.agua } };
    m.onBeforeCompile = function (sh) {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = 'varying vec3 vTkcW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vTkcW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uTkcT; uniform sampler2D uTkcAlt; uniform vec2 uTkcU; uniform vec2 uTkcV; uniform float uTkcAc; uniform float uTkcExt; uniform float uTkcN; uniform float uTkcAgua; varying vec3 vTkcW;\n' +
        'vec2 kOla(vec2 p, vec2 d, float f, float v, float t){ float x = dot(p, d) * f + t * v; return vec2(sin(x), cos(x)); }\n' +
        'float kH(vec2 kUv){ return texture2D(uTkcAlt, kUv).r * 24.0 - 18.0; }\n' +
        sh.fragmentShader.replace('#include <color_fragment>', [
          '#include <color_fragment>',
          ' vec2 kL = vec2(dot(vTkcW.xz, uTkcU), dot(vTkcW.xz, uTkcV));',
          ' vec2 kUv = vec2((kL.x - uTkcAc) / (2.0 * uTkcExt) + 0.5, kL.y / (2.0 * uTkcExt) + 0.5);',
          ' float kP = clamp(uTkcAgua - kH(kUv), 0.0, 14.0);',
          // ondas que suman (dan la normal y el brillo)
          ' vec2 p = vTkcW.xz; vec2 w1 = kOla(p, normalize(vec2(1.0, 0.3)), 0.35, 1.3, uTkcT), w2 = kOla(p, normalize(vec2(-0.4, 1.0)), 0.6, 1.7, uTkcT), w3 = kOla(p, normalize(vec2(0.7, -0.7)), 1.3, 2.4, uTkcT), w4 = kOla(p, normalize(vec2(-0.9, -0.2)), 2.6, 3.1, uTkcT);',
          ' vec3 kNo = normalize(vec3(-(w1.y * 0.35 * 0.10 + w2.y * 0.6 * 0.07 + w3.y * 1.3 * 0.035 + w4.y * 2.6 * 0.015), 1.0, -(w1.y * 0.1 * 0.3 + w2.y * 0.6 * 0.07 + w3.y * 1.3 * 0.03 - w4.y * 2.6 * 0.012)));',
          ' vec3 kTurq = vec3(0.22, 0.86, 0.80), kMedio = vec3(0.04, 0.55, 0.72), kHondo = vec3(0.01, 0.16, 0.38);',
          ' vec3 kAg = mix(kTurq, kMedio, smoothstep(0.4, 3.5, kP)); kAg = mix(kAg, kHondo, smoothstep(3.5, 12.0, kP));',
          // espuma: una línea que sigue la costa y se aleja/acerca con las olas (sin puntos sueltos)
          ' float kBan = 0.35 + 0.25 * sin(uTkcT * 1.2 + kL.x * 0.08 + kL.y * 0.11);',
          ' float kEsp = (1.0 - smoothstep(0.0, kBan, kP)) * (0.6 + 0.4 * sin(kP * 24.0 - uTkcT * 3.0));',
          ' kEsp += (1.0 - smoothstep(kBan + 0.25, kBan + 0.7, kP)) * smoothstep(kBan, kBan + 0.25, kP) * 0.45;',
          ' diffuseColor.rgb = mix(kAg, vec3(0.96, 0.99, 1.0), clamp(kEsp, 0.0, 0.9)) * mix(1.0, 0.4, uTkcN);',
          ' diffuseColor.a = mix(0.55, 0.97, smoothstep(0.0, 4.0, kP)) + kEsp * 0.4;'].join('\n'))
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal = normalize((viewMatrix * vec4(kNo, 0.0)).xyz);')
        .replace('#include <output_fragment>', [
          ' vec3 kV = normalize(cameraPosition - vTkcW);',
          ' float kF = 0.04 + 0.96 * pow(1.0 - max(dot(kV, kNo), 0.0), 5.0); vec3 kR = reflect(-kV, kNo);',
          ' vec3 kCielo = mix(mix(vec3(0.78, 0.9, 0.98), vec3(0.42, 0.66, 0.9), clamp(kR.y, 0.0, 1.0)), vec3(0.06, 0.1, 0.24), uTkcN);',
          ' outgoingLight = mix(outgoingLight, kCielo, clamp(kF * 1.4, 0.0, 0.55));',
          '#if NUM_POINT_LIGHTS > 0',
          ' vec3 kPv = -vViewPosition; vec3 kRl = vec3(0.0);',
          ' #pragma unroll_loop_start',
          ' for (int i = 0; i < NUM_POINT_LIGHTS; i ++) { { float kk = 1.0 - clamp(length(pointLights[ i ].position - kPv) / (max(pointLights[ i ].distance, 1.0) * 1.3), 0.0, 1.0); kRl += pointLights[ i ].color * kk * kk; } }',
          ' #pragma unroll_loop_end',
          ' outgoingLight += kRl * (0.35 + 0.65 * (0.5 + 0.5 * w3.x)) * 0.55;',
          '#endif',
          '#include <output_fragment>'].join('\n'));
    };
    m.customProgramCacheKey = function () { return 'tkcOceano2'; };
    var g = new T3.PlaneGeometry(1400, 1400, 1, 1); g.rotateX(-Math.PI / 2);
    var me = new T3.Mesh(g, m); me.position.set(0, ISLA.agua, 0); me.receiveShadow = true; me.raycast = NOOP; me.renderOrder = 2;
    return me;
  }
  // ======================================================================
  //  MODELOS: palmera, muelle, cañón, barril, farol, galeón
  // ======================================================================
  var COL = { madera: 0x7a5232, maderaOsc: 0x4a3020, maderaCl: 0xa8784a, cuerda: 0xc8b088, hueso: 0xe8dcc0, roca: 0x77695a, hierro: 0x3e3e44, oro: 0xe0b040, paja: 0xc8a25a, tejaR: 0xb5533a, blanco: 0xf2ece0, ventana: 0x1a120c };
  var PAREDES = [0x3fb7b0, 0xe8775a, 0xf2c84b, 0x7fc8e8, 0xe89ac0, 0x8fd18a, 0xf0e2c0, 0x5a8fd8];
  var CONTRA = [0x2a6fae, 0x1f8a6a, 0xc0392b, 0xf2f2f2, 0x7a3fa0, 0xe8a020];
  function barril(k, x, y, z, s) { s = s || 1; k.cil(0.32 * s, 0.8 * s, COL.maderaCl, x, y + 0.4 * s, z, 10); k.cil(0.335 * s, 0.06 * s, COL.hierro, x, y + 0.15 * s, z, 10); k.cil(0.335 * s, 0.06 * s, COL.hierro, x, y + 0.65 * s, z, 10); }
  function caja(k, x, y, z, s, ry) { s = s || 1; k.caja(0.7 * s, 0.7 * s, 0.7 * s, 0x9a7048, x, y + 0.35 * s, z, ry); k.caja(0.74 * s, 0.08 * s, 0.74 * s, COL.maderaOsc, x, y + 0.66 * s, z, ry); }
  function canon(k, x, y, z, ry, s) {
    s = s || 1; var cy = Math.cos(ry), sy = Math.sin(ry);
    k.caja(1.0 * s, 0.35 * s, 0.7 * s, COL.madera, x, y + 0.3 * s, z, ry);
    [-1, 1].forEach(function (l) { k.cil(0.2 * s, 0.1 * s, COL.maderaOsc, x - sy * l * 0.38 * s + cy * 0.25 * s, y + 0.2 * s, z - cy * l * 0.38 * s - sy * 0.25 * s, 10, Math.PI / 2, 0, ry + Math.PI / 2); });
    k.cil(0.2 * s, 1.5 * s, 0x2a2a30, x + cy * 0.45 * s, y + 0.62 * s, z - sy * 0.45 * s, 10, 0, Math.PI / 2 - 0.08, ry, 0.2 * s);
  }
  var LUCES = []; // faroles y antorchas de la isla (para js/tk-dia-noche.js)
  function farol(k, x, y, z, alto, aLuces) { k.cil(0.08, alto, COL.maderaOsc, x, y + alto / 2, z, 6); k.caja(0.5, 0.08, 0.08, COL.maderaOsc, x + 0.22, y + alto - 0.05, z); k.caja(0.26, 0.34, 0.26, 0x3a3020, x + 0.42, y + alto - 0.3, z); if (aLuces) aLuces.push([x + 0.42, y + alto - 0.3, z]); }
  // muelle de madera: tablones con huecos, pilotes al agua y barandas de cuerda (en coordenadas locales a, b)
  function muelle(k, a0, b0, a1, b1, ancho, luces) {
    var p0 = new T3.Vector3(a0, 0, b0), p1 = new T3.Vector3(a1, 0, b1), dir = p1.clone().sub(p0), L = dir.length(); dir.normalize();
    var ry = Math.atan2(-dir.z, dir.x), lado = new T3.Vector3(-dir.z, 0, dir.x), yD = 0.55;
    for (var t = 0; t < L; t += 0.42) { var p = p0.clone().addScaledVector(dir, t); k.caja(0.36, 0.1, ancho, t % 2.52 < 0.42 ? COL.maderaOsc : COL.madera, p.x, yD, p.z, ry); }
    for (var s = 0; s <= L; s += 2.6) { [-1, 1].forEach(function (l) { var q = p0.clone().addScaledVector(dir, s).addScaledVector(lado, l * (ancho / 2 - 0.1)); k.cil(0.13, 2.6, COL.maderaOsc, q.x, -0.9, q.z, 7); k.cil(0.1, 0.9, COL.maderaOsc, q.x, yD + 0.45, q.z, 6); }); }
    [-1, 1].forEach(function (l) { for (var s2 = 0; s2 + 2.6 <= L; s2 += 2.6) { var a = p0.clone().addScaledVector(dir, s2).addScaledVector(lado, l * (ancho / 2 - 0.1)), b = p0.clone().addScaledVector(dir, s2 + 2.6).addScaledVector(lado, l * (ancho / 2 - 0.1)); a.y = b.y = yD + 0.85; var m = a.clone().add(b).multiplyScalar(0.5); m.y -= 0.18; k.viga(a, m, 0.05, COL.cuerda, 4); k.viga(m, b, 0.05, COL.cuerda, 4); } });
    for (var f = 4; f < L; f += 9) { var q2 = p0.clone().addScaledVector(dir, f).addScaledVector(lado, ancho / 2 - 0.1); LUCES.push({ x: q2.x, y: yD + 2.2, z: q2.z, local: true }); farol(k, q2.x, yD, q2.z, 2.1); }
    for (var b2 = 3; b2 < L; b2 += 5.5) { var q3 = p0.clone().addScaledVector(dir, b2).addScaledVector(lado, -(ancho / 2 - 0.6)); if (b2 % 11 < 5.5) barril(k, q3.x, yD + 0.05, q3.z); else caja(k, q3.x, yD + 0.05, q3.z, 1, ry); }
  }
  // casco de galeón (con proa, popa alta y franja dorada), en coordenadas del barco: largo en X, ancho en Z
  function geoCasco(L, W, D) {
    var S = 22, K = 10, pos = [], col = [], idx = [];
    function top(t) { return 0.2 * t * t + (t < -0.55 ? (-t - 0.55) * 3.2 : 0) + (t > 0.7 ? (t - 0.7) * 1.2 : 0); }
    function ancho(t) { return t > 0 ? W / 2 * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.55) : W / 2 * Math.pow(Math.max(0.02, 1 - Math.pow(-t, 4) * 0.55), 0.6); }
    for (var i = 0; i <= S; i++) {
      var t = -1 + 2 * i / S, x = t * L / 2, w = ancho(t), ty = top(t);
      for (var j = 0; j <= K; j++) {
        var th = Math.PI * j / K, z = w * Math.cos(th), y = ty - D * Math.pow(Math.sin(th), 0.75) * (1 - 0.35 * Math.max(0, t) * Math.max(0, t));
        pos.push(x, y, z);
        var franja = ty - y < 0.32 ? 0 : ty - y < 0.55 ? 1 : 2; var c = new T3.Color(franja === 0 ? 0x3a2416 : franja === 1 ? COL.oro : (y < ty - D * 0.7 ? 0x2a1a10 : 0x5a3a22)); col.push(c.r, c.g, c.b);
      }
    }
    for (var i2 = 0; i2 < S; i2++) for (var j2 = 0; j2 < K; j2++) { var a = i2 * (K + 1) + j2, b = a + K + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    // espejo de popa
    var c0 = pos.length / 3; pos.push(-L / 2, top(-1) - D * 0.3, 0); col.push(0.23, 0.14, 0.09); for (var j3 = 0; j3 < K; j3++) idx.push(c0, j3, j3 + 1);
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    return { g: g, top: top };
  }
  Cons.prototype.addColor = function (geo, m4) { var g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, Nn = g.attributes.normal, Cc = g.attributes.color; mN.getNormalMatrix(m4); for (var i = 0; i < P.count; i++) { vA.fromBufferAttribute(P, i).applyMatrix4(m4); this.p.push(vA.x, vA.y, vA.z); vB.fromBufferAttribute(Nn, i).applyMatrix3(mN).normalize(); this.n.push(vB.x, vB.y, vB.z); this.c.push(Cc.getX(i), Cc.getY(i), Cc.getZ(i)); } return this; };
  function galeon(escala) {
    var g = new T3.Group(), k = new Cons(), L = 18, W = 5.2, D = 3.2, cas = geoCasco(L, W, D);
    k.addColor(cas.g, new T3.Matrix4());
    k.caja(L * 0.92, 0.12, W * 0.86, 0x9a7a52, 0, cas.top(0) - 0.05, 0);                       // cubierta
    k.caja(4.2, 2.4, W * 0.9, 0x5a3a22, -L / 2 + 2.4, cas.top(-0.75) - 0.4, 0);                 // castillo de popa
    k.caja(4.4, 0.18, W * 0.95, COL.oro, -L / 2 + 2.4, cas.top(-0.75) + 0.8, 0);
    for (var v = -1; v <= 1; v += 2) for (var w = 0; w < 3; w++) k.caja(0.05, 0.5, 0.6, COL.ventana, -L / 2 + 0.25, cas.top(-0.95) - 0.6, v * 0.6 + w * 0, 0);
    for (var p = -5; p <= 5; p++) [-1, 1].forEach(function (l) { k.caja(0.5, 0.42, 0.06, 0x14100c, p * 1.25, cas.top(p * 1.25 / (L / 2)) - 0.95, l * (W / 2 - 0.12) * Math.pow(Math.max(0.05, 1 - Math.pow(Math.abs(p * 1.25 / (L / 2)), 2.4)), 0.55)); });
    var b0 = new T3.Vector3(L / 2 - 0.3, cas.top(1) - 0.1, 0); k.viga(b0, new T3.Vector3(L / 2 + 4.5, cas.top(1) + 2.2, 0), 0.2, COL.maderaOsc, 6); // bauprés
    var mastiles = [[-3.2, 13], [1.6, 15.5], [5.8, 11.5]];
    mastiles.forEach(function (m) { var y0 = cas.top(m[0] / (L / 2)); k.cil(0.22, m[1], COL.maderaOsc, m[0], y0 + m[1] / 2, 0, 8); [0.42, 0.75].forEach(function (f) { k.cil(0.1, W * 1.25, COL.maderaOsc, m[0], y0 + m[1] * f, 0, 6, Math.PI / 2); }); k.cil(0.55, 0.5, COL.madera, m[0], y0 + m[1] * 0.88, 0, 8);
      [-1, 1].forEach(function (l) { k.viga(new T3.Vector3(m[0], y0 + m[1] * 0.85, 0), new T3.Vector3(m[0] - 1.5, y0 + 0.2, l * W / 2), 0.04, COL.cuerda, 3); k.viga(new T3.Vector3(m[0], y0 + m[1] * 0.85, 0), new T3.Vector3(m[0] + 1.5, y0 + 0.2, l * W / 2), 0.04, COL.cuerda, 3); }); });
    k.viga(new T3.Vector3(mastiles[2][0], cas.top(0.6) + 11, 0), new T3.Vector3(L / 2 + 4.5, cas.top(1) + 2.2, 0), 0.04, COL.cuerda, 3);
    canon(k, L / 2 - 3, cas.top(0.6), 1.2, 0, 0.8); canon(k, L / 2 - 3, cas.top(0.6), -1.2, 0, 0.8);
    var me = k.malla(); g.add(me);
    // velas negras (se hinchan con el viento en el dibujo)
    mastiles.forEach(function (m) { var y0 = cas.top(m[0] / (L / 2)); [[0.42, 0.75, 1.0], [0.75, 0.96, 0.75]].forEach(function (q) { var alto = m[1] * (q[1] - q[0]) * 0.92, an = W * 1.15 * q[2]; var pg = new T3.PlaneGeometry(an, alto, 6, 6); var s = new T3.Mesh(pg, MAT.vela); s.position.set(m[0] + 0.25, y0 + m[1] * (q[0] + q[1]) / 2, 0); s.rotation.y = Math.PI / 2; s.castShadow = true; s.raycast = NOOP; g.add(s); }); });
    bandera(g, mastiles[1][0], cas.top(0) + mastiles[1][1] + 0.6, 0, 2.6, 1.7, 0);
    // farol de popa (se enciende de noche)
    var far = new T3.Mesh(gEsf(8), MAT.farol); far.scale.setScalar(0.55); far.position.set(-L / 2 - 0.2, cas.top(-1) + 0.4, 0); far.raycast = NOOP; g.add(far); g.userData.farol = far;
    g.scale.setScalar(escala || 1); return g;
  }

  function soldar(g) { // une los vértices repetidos (sombreado suave en vez de facetas)
    var P = g.attributes.position, mapa = {}, pos = [], idx = [];
    for (var i = 0; i < P.count; i++) { var k = Math.round(P.getX(i) * 1e4) + '_' + Math.round(P.getY(i) * 1e4) + '_' + Math.round(P.getZ(i) * 1e4); if (mapa[k] === undefined) { mapa[k] = pos.length / 3; pos.push(P.getX(i), P.getY(i), P.getZ(i)); } idx.push(mapa[k]); }
    var n = new T3.BufferGeometry(); n.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); n.setIndex(idx); g.dispose(); return n;
  }
  // ======================================================================
  //  MONTAÑA DE LA CALAVERA (al fondo, como en la imagen): calavera anatómica esculpida en la misma roca de la cordillera.
  //  Boca = entrada monumental con escalinata; cuencas y entrada con luz naranja; estandartes a los lados.
  //  Coordenadas de la calavera: x hacia la villa (+a), y arriba, z de lado (b). Origen: suelo de la boca (terraza, +5).
  // ======================================================================
  function sdCalavera(x, y, z) {
    var d = sdElip(x, y, z, -2.5, 14.8, 0, 10.6, 10.4, 11.6);                       // cráneo
    var base = Math.abs(d); if (base > 9 && d > 0) return d - 2;                       // lejos: no hace falta más detalle
    d = uS(d, sdCaja3(x, y, z, 3.4, 8.6, 0, 5.3, 4.9, 7.7, 2.6), 3.0);                 // cara (maxilar)
    d = uS(d, sdElip(x, y, z, 5.4, 9.3, 7.7, 3.1, 2.2, 2.7), 1.6);                     // pómulos
    d = uS(d, sdElip(x, y, z, 5.4, 9.3, -7.7, 3.1, 2.2, 2.7), 1.6);
    d = uS(d, sdElip(x, y, z, 6.7, 14.7, 0, 3.0, 1.9, 9.8), 1.8);                      // arco de las cejas
    d = uS(d, sdElip(x, y, z, -1.0, 8.5, 10.6, 3.2, 3.6, 1.6), 1.2);                   // sienes
    d = uS(d, sdElip(x, y, z, -1.0, 8.5, -10.6, 3.2, 3.6, 1.6), 1.2);
    d = rS(d, sdElip(x, y, z, 9.0, 12.1, 4.4, 3.7, 3.3, 3.1), 1.0);                    // cuencas de los ojos
    d = rS(d, sdElip(x, y, z, 9.0, 12.1, -4.4, 3.7, 3.3, 3.1), 1.0);
    var az = Math.abs(z), nariz = Math.max(az * 1.25 - (10.3 - y) * 0.42 - 0.15, y - 10.4, 6.9 - y, 6.8 - x);
    d = rS(d, nariz, 0.5);                                                              // nariz (triángulo hueco)
    d = uS(d, sdCaja3(x, y, z, 3.2, 1.7, 0, 5.0, 2.0, 7.3, 1.6), 1.4);                 // mandíbula
    d = rS(d, sdCaja3(x, y, z, 5.6, 3.15, 0, 6.6, 2.45, 5.0, 0.7), 0.5);               // la boca: entrada monumental
    d = rS(d, sdCaja3(x, y, z, -5.0, 3.3, 0, 7.0, 2.8, 4.0, 1.2), 0.8);                // túnel hacia dentro
    if (x > 5 && y < 7 && az < 6.6) for (var i = -4; i <= 4; i++) {                    // dientes de arriba y de abajo
      var tx = 8.0 - 0.07 * i * i, tz = i * 1.12;
      d = Math.min(d, sdCaja3(x, y, z, tx, 4.55, tz * 1.08, 0.75, 1.25, 0.48, 0.28), sdCaja3(x, y, z, tx - 0.3, 1.35, tz * 1.08, 0.68, 0.8, 0.45, 0.25));
    }
    return d;
  }
  function sdMonte(x, y, z) { // calavera + roca que la rodea (se funden), con grietas y estratos
    var s = sdCalavera(x, y, z);
    var m = sdElip(x, y, z, -16, 6, 0, 15, 25, 27);
    var d = uS(s, m, 4.5);
    if (Math.abs(d) < 3.5) d += (fbm3(x * 0.2, y * 0.33, z * 0.2) - 0.5) * 1.5 + (Math.abs(vr3(x * 0.45, y * 0.9, z * 0.45) - 0.5) - 0.25) * 0.8 * (s > 1.5 ? 1 : 0.35);
    return Math.max(d, -(y + 0.6));
  }
  var cHueso = new T3.Color(0xcdb894), cHueso2 = new T3.Color(0x9a8566);
  function colorMonte(cc, x, y, z, nx, ny, nz, oc) {
    var s = sdCalavera(x, y, z);
    if (s < 1.2) { cc.copy(cHueso).lerp(cHueso2, smooth(0.3, 0.75, fbm3(x * 0.22, y * 0.3, z * 0.22))); cc.multiplyScalar(0.82 + 0.3 * smooth(2, 22, y)); if (ny > 0.6 && fbm3(x * 0.3 + 4, y * 0.3, z * 0.3) > 0.62) cc.lerp(cMusgo, 0.55); cc.lerp(new T3.Color(0x1e1610), (1 - oc) * 0.92); }
    else colorRoca(cc, x, y, z, nx, ny, nz, oc);
  }
  // cordillera detrás (mapa de alturas): picos rocosos con barrancos para las cascadas
  function crearCordillera(c) {
    var NA = 70, NB = 150, a0 = -112, a1 = -55, b0 = -82, b1 = 82;
    var g = new T3.PlaneGeometry(1, 1, NA, NB), P = g.attributes.position, col = new Float32Array(P.count * 3), cc = new T3.Color();
    for (var i = 0; i < P.count; i++) {
      var u = P.getX(i) + 0.5, v = P.getY(i) + 0.5, a = a0 + (a1 - a0) * u, b = b0 + (b1 - b0) * v;
      var cae = smooth(-56, -66, a), pico = 12 + 26 * Math.pow(fbm(a * 0.045 + 3, b * 0.05), 1.4) + 8 * Math.abs(vruido(a * 0.12, b * 0.12) - 0.5);
      var barr = 1 - 0.55 * Math.exp(-Math.pow((Math.abs(b) - 24) / 4, 2)) * smooth(-58, -70, a);      // barrancos a los dos lados de la calavera
      var h = cae * pico * barr * (1 - 0.6 * Math.exp(-b * b / 320) * smooth(-75, -60, a)) + ISLA.terraza - 0.4;
      if (Math.abs(b) > 66) h *= 1 - smooth(66, 80, Math.abs(b));
      var hueco = Math.exp(-Math.pow(b / 15.5, 4)) * smooth(-90, -80, a); h = h * (1 - hueco) + (ISLA.terraza - 2) * hueco; // la calavera queda delante, sin roca encima de la cara
      var w = c.aMundo(a, b); P.setXYZ(i, w[0], h, w[1]);
      var n = fbm(a * 0.2, b * 0.2); cc.copy(cRoca1).lerp(cRoca2, n); col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
    }
    var idx = g.index.array; for (var k = 0; k < idx.length; k += 3) { var t = idx[k]; idx[k] = idx[k + 1]; idx[k + 1] = t; }
    g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.computeVertexNormals();
    var m = new T3.Mesh(g, MAT.rocaPBR); m.castShadow = true; m.receiveShadow = true; m.raycast = NOOP; return m;
  }
  // estandarte vertical con calavera (cuelga de una barra)
  function texEstandarte(fondo) {
    var cv = document.createElement('canvas'); cv.width = 64; cv.height = 160; var x = cv.getContext('2d');
    x.fillStyle = fondo; x.fillRect(0, 0, 64, 160); x.fillStyle = '#d8b04a'; x.fillRect(0, 0, 64, 6); x.fillRect(0, 0, 4, 160); x.fillRect(60, 0, 4, 160);
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, 160); x.lineTo(32, 134); x.lineTo(64, 160); x.fill(); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#efe6d2'; x.beginPath(); x.ellipse(32, 58, 13, 14, 0, 0, 6.283); x.fill(); x.fillRect(24, 66, 16, 9);
    x.fillStyle = fondo; x.beginPath(); x.ellipse(27, 58, 4, 5, 0, 0, 6.283); x.ellipse(37, 58, 4, 5, 0, 0, 6.283); x.fill();
    x.strokeStyle = '#efe6d2'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(12, 84); x.lineTo(52, 104); x.moveTo(52, 84); x.lineTo(12, 104); x.stroke();
    var t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function estandarte(grupo, x, y, z, alto, ry, rojo) {
    var k = rojo ? 'estR' : 'estN'; if (!TEX[k]) { TEX[k] = MAT.tela(texEstandarte(rojo ? '#7a1414' : '#17141a'), true); }
    var an = alto * 0.42, g = new T3.PlaneGeometry(an, alto, 3, 8); g.translate(0, -alto / 2, 0); g.rotateY(Math.PI / 2);
    var me = new T3.Mesh(g, TEX[k]); me.position.set(x, y, z); me.rotation.y = ry || 0; me.castShadow = true; me.raycast = NOOP; grupo.add(me);
    return me;
  }
  function monte(nv) {
    var g = new T3.Group(), t0 = performance.now();
    var geo = esculpir(sdMonte, { x: -34, y: -1, z: -27 }, { x: 13.5, y: 31, z: 27 }, N_PASO(), colorMonte);
    var sk = rocaMalla(geo); g.add(sk);
    // luz naranja dentro de las cuencas y de la boca (siempre encendida, más fuerte de noche)
    var brasa = new T3.SphereGeometry(1, 12, 8);
    [[5.0, 11.8, 4.4, 2.0], [5.0, 11.8, -4.4, 2.0], [1.0, 3.0, 0, 3.0]].forEach(function (q, i) { var o = new T3.Mesh(brasa, MAT.ojos); o.position.set(q[0], q[1], q[2]); o.scale.set(q[3] * 0.7, q[3] * (i < 2 ? 0.95 : 0.75), q[3] * (i < 2 ? 0.95 : 1.5)); o.raycast = NOOP; g.add(o); });
    // escalinata de piedra desde la boca hasta la villa (la terraza está a +5, la villa a 0)
    var k = new Cons();
    for (var s = 0; s < 6; s++) k.caja(1.0, 0.5, 9.6 - s * 0.2, 0x9a907e, 9.5 + s * 1.0, 0.25 - 0.0, 0);     // rellano delante de la boca
    for (var e = 0; e < 11; e++) { var ex = 15.5 + e * 0.55, ey = -0.45 - e * 0.45; k.caja(0.62, 0.5, 9.0, e % 2 ? 0x8d8473 : 0x9a907e, ex, ey, 0); }  // bajada a la villa
    [-1, 1].forEach(function (l) { for (var p2 = 0; p2 < 7; p2++) k.caja(0.9, 1.1, 0.7, 0x7a7262, 15.5 + p2 * 0.95, 0.3 - p2 * 0.8, l * 5.0); });
    var me = k.malla(MAT.rocaPBR); g.add(me);
    // estandartes piratas a los dos lados de la boca (más y con oro según el nivel del castillo)
    var cuantos = nv >= 9 ? 3 : nv >= 4 ? 2 : 1;
    for (var b = 0; b < cuantos; b++) [-1, 1].forEach(function (l) { estandarte(g, 9.6 - b * 1.4, 9.0 - b * 0.3, l * (7.4 + b * 2.4), 6.5 - b * 0.6, 0, b % 2 === 0); });
    if (nv >= 12) for (var cg = 0; cg < 7; cg++) { var kc = new Cons(); kc.cono(0.9, 3.0, COL.oro, -2 + cg * 0.1, 25.3 + Math.sin(cg) * 0.2, (cg - 3) * 2.2, 6); g.add(kc.malla(MAT.solido)); }
    // antorchas: boca, rellano y escalinata
    LUCES.push({ x: 9.2, y: 6.6, z: 5.4, local: true }); LUCES.push({ x: 9.2, y: 6.6, z: -5.4, local: true }); LUCES.push({ x: 15.2, y: 1.6, z: 5.3, local: true }); LUCES.push({ x: 15.2, y: 1.6, z: -5.3, local: true }); LUCES.push({ x: 21.6, y: -2.6, z: 5.3, local: true }); LUCES.push({ x: 21.6, y: -2.6, z: -5.3, local: true });
    var kt = new Cons(); [[9.2, 5.4], [9.2, -5.4], [15.2, 5.3], [15.2, -5.3], [21.6, 5.3], [21.6, -5.3]].forEach(function (q, i) { var y0 = i < 2 ? 0.2 : i < 4 ? 0.0 : -4.6; kt.cil(0.09, 1.6 + (i < 2 ? 4.6 : 0), COL.maderaOsc, q[0], y0 + (1.6 + (i < 2 ? 4.6 : 0)) / 2, q[1], 5); kt.cil(0.17, 0.2, COL.hierro, q[0], y0 + 1.6 + (i < 2 ? 4.6 : 0), q[1], 6); }); g.add(kt.malla(MAT.solido));
    g.userData.ms = Math.round(performance.now() - t0);
    return g;
  }
  function N_PASO() { var n = (window.TKPremium && TKPremium.nivel && TKPremium.nivel()) || 'alta'; return n === 'ultra' ? 0.4 : n === 'alta' ? 0.48 : n === 'media' ? 0.6 : 0.75; }
  // rocas esculpidas pequeñas: arco natural e islote de la atalaya
  function sdArco(x, y, z) { var q = Math.hypot(x, y) - 8.5, d = Math.hypot(q, z) - 2.6 - (fbm3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 1.8; return Math.max(d, -(y + 9)); }
  function sdIslote(x, y, z) { var d = sdElip(x, y, z, 0, -3, 0, 7.5, 7.5, 7.0) + (fbm3(x * 0.25, y * 0.4, z * 0.25) - 0.5) * 3 + Math.max(0, y - 1.2) * 1.5; return Math.max(d, -(y + 9)); }
  // ======================================================================
  //  VEGETACIÓN TROPICAL (instanciada): palmeras con tronco curvo anillado y hojas con foliolos, helechos,
  //  plantas de hoja grande, hibiscos en flor y rocas pequeñas. Se reparten en grupos naturales sin tocar parcelas ni caminos.
  // ======================================================================
  function lienzo(w, h, pintar) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; pintar(cv.getContext('2d'), w, h); var t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t; }
  function texFronda() { return lienzo(128, 512, function (x, w, h) {
    for (var i = 0; i < 46; i++) { var t = i / 46, y = 20 + t * (h - 40), largo = (w / 2 - 6) * Math.pow(Math.sin(Math.PI * (0.08 + t * 0.9)), 0.7);
      [-1, 1].forEach(function (s) { var gr = x.createLinearGradient(w / 2, y, w / 2 + s * largo, y + 34); gr.addColorStop(0, '#2f6a22'); gr.addColorStop(0.6, ['#4f9a34', '#5aa83a', '#47902e'][i % 3]); gr.addColorStop(1, '#7ab84a');
        x.fillStyle = gr; x.beginPath(); x.moveTo(w / 2, y); x.quadraticCurveTo(w / 2 + s * largo * 0.5, y + 4, w / 2 + s * largo, y + 30); x.quadraticCurveTo(w / 2 + s * largo * 0.5, y + 14, w / 2, y + 9); x.fill(); }); }
    x.strokeStyle = '#8a7a3a'; x.lineWidth = 4; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h - 6); x.stroke(); }); }
  function texHelecho() { return lienzo(96, 256, function (x, w, h) {
    for (var i = 0; i < 30; i++) { var t = i / 30, y = 10 + t * (h - 20), l = (w / 2 - 4) * Math.sin(Math.PI * (0.1 + t * 0.85));
      [-1, 1].forEach(function (s) { for (var j = 0; j < 5; j++) { x.fillStyle = ['#3f8a2a', '#4d9c34', '#367a24'][(i + j) % 3]; x.beginPath(); x.ellipse(w / 2 + s * l * (j + 0.5) / 5, y + j * 1.8, l / 9, 3.2, s * 0.5, 0, 6.283); x.fill(); } }); }
    x.strokeStyle = '#4a6a24'; x.lineWidth = 2; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke(); }); }
  function texHojaGrande(flor) { return lienzo(128, 256, function (x, w, h) {
    var gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2c6a22'); gr.addColorStop(0.5, '#5aa83c'); gr.addColorStop(1, '#2c6a22');
    x.fillStyle = gr; x.beginPath(); x.moveTo(w / 2, h - 4); x.bezierCurveTo(-10, h * 0.6, 10, 20, w / 2, 6); x.bezierCurveTo(w - 10, 20, w + 10, h * 0.6, w / 2, h - 4); x.fill();
    x.strokeStyle = 'rgba(200,230,150,.55)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(w / 2, 6); x.lineTo(w / 2, h - 4); x.stroke(); x.lineWidth = 1;
    for (var i = 1; i < 9; i++) { var y = 20 + i * (h - 40) / 9; x.beginPath(); x.moveTo(w / 2, y); x.quadraticCurveTo(w / 2 + 25, y - 10, w / 2 + 46, y - 26); x.moveTo(w / 2, y); x.quadraticCurveTo(w / 2 - 25, y - 10, w / 2 - 46, y - 26); x.stroke(); }
    if (flor) for (var f = 0; f < 6; f++) { var fx = 26 + (f * 37) % 76, fy = 30 + (f * 53) % 150, c = flor[f % flor.length]; for (var p = 0; p < 5; p++) { x.fillStyle = c; x.beginPath(); x.ellipse(fx + Math.cos(p * 1.256) * 7, fy + Math.sin(p * 1.256) * 7, 7, 4.5, p * 1.256, 0, 6.283); x.fill(); } x.fillStyle = '#ffd34a'; x.beginPath(); x.arc(fx, fy, 2.5, 0, 6.283); x.fill(); }
  }); }
  function matHoja(tex) {
    var m = new T3.MeshStandardMaterial({ map: tex, alphaTest: 0.42, side: T3.DoubleSide, roughness: 0.7, metalness: 0 }); m.userData.tkpSinVentanas = true;
    m.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.uniforms.uV = U.viento; sh.vertexShader = 'uniform float uT; uniform float uV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec4 kI = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n#else\n vec4 kI = vec4(0.0);\n#endif\n float kA = (0.04 + uv.y * uv.y * 0.12) * uV * clamp(position.y * 0.35, 0.2, 1.6); transformed.x += sin(uT * 1.7 + kI.x * 0.31 + kI.z * 0.23 + position.y) * kA; transformed.z += cos(uT * 1.3 + kI.z * 0.27) * kA * 0.7; transformed.y += sin(uT * 2.1 + kI.x) * kA * 0.3;'); };
    m.customProgramCacheKey = function () { return 'tkcHoja'; }; return m;
  }
  // tira curva (una hoja/fronda): arranca en o, sale en la dirección ang, sube y cae; ancho según el largo
  function tira(pos, uv, idx, o, ang, largo, ancho, sube, cae, seg, giro) {
    var base = pos.length / 3, dx = Math.cos(ang), dz = Math.sin(ang), px = -dz, pz = dx;
    for (var i = 0; i <= seg; i++) {
      var t = i / seg, r = largo * t, y = o.y + sube * Math.sin(t * Math.PI * 0.6) - cae * t * t, w = ancho * (0.18 + Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.55)) * 0.5, tw = (giro || 0) * t;
      for (var s = -1; s <= 1; s += 2) { pos.push(o.x + dx * r + px * w * s * Math.cos(tw), y + w * s * Math.sin(tw), o.z + dz * r + pz * w * s * Math.cos(tw)); uv.push(s < 0 ? 0 : 1, 1 - t); }
      if (i) { var q = base + i * 2; idx.push(q - 2, q - 1, q, q - 1, q + 1, q); }
    }
  }
  function geoTiras(fn) { var pos = [], uv = [], idx = []; fn(pos, uv, idx); var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  function geoTronco(alto, inclina) {
    var pos = [], col = [], idx = [], A = 14, S = 9, cc = new T3.Color(), top = null;
    for (var i = 0; i <= A; i++) {
      var t = i / A, cx = Math.sin(t * 1.25) * inclina, cy = t * alto, r = 0.32 * (1 - t * 0.38) * (1 + 0.08 * Math.abs(Math.sin(t * A * Math.PI)));
      for (var j = 0; j <= S; j++) { var a = j / S * Math.PI * 2; pos.push(cx + Math.cos(a) * r, cy, Math.sin(a) * r); cc.set(i % 2 ? 0x8a6e4e : 0x6e563c).multiplyScalar(0.9 + 0.2 * Math.sin(a * 3 + i)); col.push(cc.r, cc.g, cc.b); }
      if (i) for (var k = 0; k < S; k++) { var a0 = (i - 1) * (S + 1) + k, b0 = a0 + S + 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
      top = new T3.Vector3(cx, cy, 0);
    }
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); g.userData.top = top; return g;
  }
  var VEG = null;
  function prepararVegetacion() {
    if (VEG) return VEG;
    var tronco = geoTronco(6.2, 1.3), top = tronco.userData.top, r = azar(91);
    var fronda = geoTiras(function (pos, uv, idx) { for (var f = 0; f < 13; f++) { var ang = f / 13 * Math.PI * 2 + r() * 0.25, rise = f % 3 === 0 ? 1.0 : 0.55; tira(pos, uv, idx, top, ang, 3.4 + r() * 0.6, 1.25, rise, 2.3 + r() * 0.6, 9, (r() - 0.5) * 0.6); } });
    var helecho = geoTiras(function (pos, uv, idx) { for (var f = 0; f < 9; f++) tira(pos, uv, idx, new T3.Vector3(0, 0.05, 0), f / 9 * Math.PI * 2 + r() * 0.3, 1.5 + r() * 0.4, 0.55, 0.65, 0.75, 6, 0.3); });
    var hojas = geoTiras(function (pos, uv, idx) { for (var f = 0; f < 6; f++) tira(pos, uv, idx, new T3.Vector3(0, 0.1, 0), f / 6 * Math.PI * 2 + r() * 0.5, 1.6 + r() * 0.5, 0.95, 1.3, 0.8, 6, (r() - 0.5) * 0.8); });
    var flores = geoTiras(function (pos, uv, idx) { for (var f = 0; f < 8; f++) tira(pos, uv, idx, new T3.Vector3(0, 0.15, 0), f / 8 * Math.PI * 2 + r() * 0.4, 1.1 + r() * 0.3, 0.9, 0.9, 0.5, 5, 0.4); });
    var roca = soldar(new T3.IcosahedronGeometry(1, 2)), pr = roca.attributes.position; for (var i = 0; i < pr.count; i++) { var x = pr.getX(i), y = pr.getY(i), z = pr.getZ(i), n = 0.75 + fbm3(x * 1.6 + 3, y * 1.6, z * 1.6) * 0.5; pr.setXYZ(i, x * n, Math.max(-0.2, y) * n * 0.62, z * n); } roca.computeVertexNormals();
    var cr = new Float32Array(pr.count * 3), cc = new T3.Color(); for (i = 0; i < pr.count; i++) { cc.copy(cRoca1).lerp(cRoca2, Math.random()); if (pr.getY(i) > 0.35 && Math.random() > 0.4) cc.lerp(cMusgo, 0.6); cr[i * 3] = cc.r; cr[i * 3 + 1] = cc.g; cr[i * 3 + 2] = cc.b; } roca.setAttribute('color', new T3.BufferAttribute(cr, 3));
    var mt = new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }); mt.userData.tkpSinVentanas = true;
    mt.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.uniforms.uV = U.viento; sh.vertexShader = 'uniform float uT; uniform float uV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec4 kI = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n#else\n vec4 kI = vec4(0.0);\n#endif\n float kA = position.y * position.y * 0.004 * uV; transformed.x += sin(uT * 1.7 + kI.x * 0.31 + kI.z * 0.23) * kA; transformed.z += cos(uT * 1.3 + kI.z * 0.27) * kA * 0.7;'); };
    mt.customProgramCacheKey = function () { return 'tkcTronco'; };
    VEG = { tronco: tronco, fronda: fronda, helecho: helecho, hojas: hojas, flores: flores, roca: roca,
      mTronco: mt, mFronda: matHoja(texFronda()), mHelecho: matHoja(texHelecho()), mHojas: matHoja(texHojaGrande(null)), mFlores: matHoja(texHojaGrande(['#e8344a', '#ff6a8a', '#ffb02a', '#d8285e'])) };
    return VEG;
  }
  // reparte grupos naturales: cada grupo mezcla palmeras, helechos, hojas, flores y rocas
  function repartirVegetacion(c, raizL, cantidad) {
    var V = prepararVegetacion(), r = azar(5150), L = { palma: [], helecho: [], hojas: [], flores: [], roca: [] }, o = new T3.Object3D();
    function libre(a, b) {
      var h = altura(a, b); if (h < ISLA.playa + 0.2 || h > 9.5) return null;
      var pend = Math.abs(altura(a + 1, b) - h) + Math.abs(altura(a, b + 1) - h); if (pend > 1.2) return null;
      if (Math.hypot(a, b) < 15) return null;                                             // plaza
      if (distCamino(a, b) < 0.9) return null;
      if (a > -40 && a < 46 && Math.abs(b) < 47) { var w = c.aMundo(a, b); if (!c.libre(w[0], w[1])) return null; }
      var cr = c.campos; if (Math.abs(a - cr.a) < cr.ha + 2 && Math.abs(b - cr.b) < cr.hb + 2) return null;
      if (Math.abs(b) < 6.5 && a > 40 && a < 52) return null;                              // escalera de la playa
      if (Math.abs(b) < 7 && a < -36 && a > -64) return null;                              // escalinata de la calavera
      if (Math.abs(Math.abs(b) - 34) < 3.5 && a < -36 && a > -46) return null;             // escaleras laterales
      return h;
    }
    var grupos = Math.round(110 * cantidad);
    for (var g = 0, t = 0; g < grupos && t < grupos * 12; t++) {
      var ca = ISLA.terr.a0 + r() * (120 - ISLA.terr.a0), cb = (r() - 0.5) * 2 * (ISLA.hb + 2); if (libre(ca, cb) === null) continue; g++;
      var n = 4 + Math.floor(r() * 7), radio = 2.5 + r() * 3;
      for (var i = 0; i < n; i++) {
        var a = ca + (r() - 0.5) * 2 * radio, b = cb + (r() - 0.5) * 2 * radio, h = libre(a, b); if (h === null) continue;
        var q = r(), tipo = q < 0.22 ? 'palma' : q < 0.48 ? 'helecho' : q < 0.68 ? 'hojas' : q < 0.84 ? 'flores' : 'roca';
        if (tipo === 'palma' && L.palma.some(function (p) { return Math.hypot(p[0] - a, p[2] - b) < 3.2; })) tipo = 'helecho';
        L[tipo].push([a, h, b, r()]);
      }
    }
    var res = [];
    function inst(geo, mat, lista, esc, sombra) {
      if (!lista.length) return null; var im = new T3.InstancedMesh(geo, mat, lista.length); im.castShadow = sombra; im.receiveShadow = true; im.raycast = NOOP;
      lista.forEach(function (p, i) { var s = esc[0] + p[3] * (esc[1] - esc[0]); o.position.set(p[0], p[1] - 0.05, p[2]); o.rotation.set(0, p[3] * 40, 0); o.scale.set(s, s * (0.9 + p[3] * 0.2), s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      raizL.add(im); res.push(im); return im;
    }
    inst(V.tronco, V.mTronco, L.palma, [0.8, 1.3], true); inst(V.fronda, V.mFronda, L.palma, [0.8, 1.3], true);
    inst(V.helecho, V.mHelecho, L.helecho, [0.8, 1.5], false); inst(V.hojas, V.mHojas, L.hojas, [0.8, 1.4], true);
    inst(V.flores, V.mFlores, L.flores, [0.7, 1.2], false); inst(V.roca, MAT.rocaPBR, L.roca, [0.35, 1.0], true);
    return { mallas: res, cuenta: { palmas: L.palma.length, helechos: L.helecho.length, hojas: L.hojas.length, flores: L.flores.length, rocas: L.roca.length } };
  }
  // ======================================================================
  //  EDIFICIOS PIRATAS: arquitectura caribeña de madera (cambian con el tipo y crecen con el nivel)
  // ======================================================================
  // casa base: pilotes, paredes de tablas pintadas, contraventanas abiertas, puerta, balcón, tejado de teja, paja o chapa
  function casa(k, o) {
    var w = o.w, d = o.d, pisos = o.pisos || 1, hP = o.hp || 1.55, y0 = o.zancos ? 0.9 : 0.15, col = o.color, cv = o.contra, r = o.r;
    if (o.zancos) { for (var i = -1; i <= 1; i += 2) for (var j = -1; j <= 1; j += 2) k.cil(0.12, y0 + 0.1, COL.maderaOsc, i * (w / 2 - 0.1), y0 / 2, j * (d / 2 - 0.1), 6); k.caja(w + 0.6, 0.14, d + 0.6, COL.madera, 0, y0, 0); }
    else k.caja(w + 0.3, 0.3, d + 0.3, 0x9a8a70, 0, 0.15, 0);
    for (var p = 0; p < pisos; p++) {
      var yb = y0 + p * hP, c = p && o.color2 ? o.color2 : col, ww = w - p * 0.2, dd = d - p * 0.2;
      k.caja(ww, hP, dd, c, 0, yb + hP / 2, 0);
      for (var t = 0.2; t < hP; t += 0.26) { k.caja(ww + 0.02, 0.025, 0.02, new T3.Color(c).multiplyScalar(0.82).getHex(), 0, yb + t, dd / 2 + 0.005); k.caja(0.02, 0.025, dd + 0.02, new T3.Color(c).multiplyScalar(0.82).getHex(), ww / 2 + 0.005, yb + t, 0); } // tablas
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { k.caja(0.14, hP, 0.14, COL.blanco, q[0] * ww / 2, yb + hP / 2, q[1] * dd / 2); });
      k.caja(ww + 0.12, 0.1, dd + 0.12, COL.blanco, 0, yb + hP, 0);
      var nv = Math.max(1, Math.floor(ww / 1.3));
      for (var v = 0; v < nv; v++) {
        var vx = -ww / 2 + ww * (v + 0.5) / nv; if (p === 0 && Math.abs(vx) < 0.5 && nv % 2) continue;
        ventana(k, vx, yb + hP * 0.55, dd / 2 + 0.02, 0, cv);
      }
      for (var v2 = 0; v2 < Math.max(1, Math.floor(dd / 1.4)); v2++) ventana(k, ww / 2 + 0.02, yb + hP * 0.55, -dd / 2 + dd * (v2 + 0.5) / Math.max(1, Math.floor(dd / 1.4)), Math.PI / 2, cv);
      if (p === 0) { k.caja(0.75, 1.15, 0.06, 0x2a1a10, 0, yb + 0.6, dd / 2 + 0.03); k.caja(0.9, 0.1, 0.08, COL.blanco, 0, yb + 1.22, dd / 2 + 0.04); }
      if (p >= 1 && o.balcon) { k.caja(ww + 0.3, 0.1, 0.9, COL.madera, 0, yb + 0.05, dd / 2 + 0.45); for (var b = -ww / 2; b <= ww / 2 + 0.01; b += 0.35) k.caja(0.05, 0.55, 0.05, COL.blanco, b, yb + 0.33, dd / 2 + 0.85); k.caja(ww + 0.3, 0.06, 0.06, COL.blanco, 0, yb + 0.62, dd / 2 + 0.88); }
    }
    var yt = y0 + pisos * hP, wt = w - (pisos - 1) * 0.2 + 0.7, dt = d - (pisos - 1) * 0.2 + 0.7, techo = o.techo || 'teja';
    var colT = techo === 'paja' ? COL.paja : techo === 'chapa' ? 0x8a9aa0 : COL.tejaR, alt = o.altoT || Math.min(w, d) * 0.45;
    if (techo === 'paja') { k.add(new T3.ConeGeometry(1, 1, 4), mat4(0, yt + alt / 2, 0, 0, Math.PI / 4, 0, wt * 0.75, alt * 1.2, dt * 0.75), colT); k.add(new T3.ConeGeometry(1, 1, 4), mat4(0, yt + 0.15, 0, 0, Math.PI / 4, 0, wt * 0.8, 0.3, dt * 0.8), 0xb08a48); }
    else {
      var ang = Math.atan2(alt, dt / 2), lado = Math.hypot(alt, dt / 2);
      [-1, 1].forEach(function (s) { k.caja(wt, 0.12, lado + 0.1, colT, 0, yt + alt / 2, s * dt / 4, 0, s * ang); for (var tl = 0.1; tl < lado; tl += 0.32) k.caja(wt + 0.02, 0.05, 0.05, new T3.Color(colT).multiplyScalar(0.75).getHex(), 0, yt + alt * (1 - tl / lado) + 0.07, s * (dt / 2) * (tl / lado), 0, s * ang); });
      k.add(new T3.CylinderGeometry(0, 1, 1, 3), mat4(wt / 2 - 0.35, yt + alt / 2, 0, 0, Math.PI / 2, 0, dt / 2, alt, 0.05), col); k.add(new T3.CylinderGeometry(0, 1, 1, 3), mat4(-wt / 2 + 0.35, yt + alt / 2, 0, 0, Math.PI / 2, 0, dt / 2, alt, 0.05), col);
      k.caja(wt + 0.1, 0.12, 0.14, COL.maderaOsc, 0, yt + alt, 0);
    }
    return yt + alt;
  }
  function ventana(k, x, y, z, ry, cv) {
    var c = Math.cos(ry), s = Math.sin(ry);
    k.caja(0.5, 0.62, 0.04, COL.ventana, x, y, z, ry); k.caja(0.6, 0.06, 0.08, COL.blanco, x + s * 0.02, y - 0.36, z + c * 0.02, ry);
    [-1, 1].forEach(function (l) { k.caja(0.26, 0.64, 0.04, cv, x + c * l * 0.4 + s * 0.1, y, z - s * l * 0.4 + c * 0.1, ry + l * 0.5); });
  }
  function letrero(k, x, y, z, col) { k.caja(0.06, 0.06, 0.9, COL.maderaOsc, x, y + 0.45, z + 0.45); k.caja(0.06, 0.55, 0.8, col || 0x9a5a2a, x, y, z + 0.75); }
  var TIPOS = {
    cuartel: function (k, g, t, r) { var al = casa(k, { w: 4.4, d: 3.4, pisos: t >= 3 ? 2 : 1, color: 0x8a5a3a, color2: 0x6a4428, contra: 0x2a2a2a, techo: 'teja', r: r }); for (var p = 0; p < 26; p++) { var a = p / 26 * Math.PI * 2; if (Math.sin(a) > 0.55) continue; k.cil(0.16, 1.6 + (p % 2) * 0.25, COL.maderaOsc, Math.cos(a) * 3.6, 0.8, Math.sin(a) * 3.0, 5); k.cono(0.17, 0.35, COL.maderaOsc, Math.cos(a) * 3.6, 1.75 + (p % 2) * 0.25, Math.sin(a) * 3.0, 5); } canon(k, -2.2, 0, 2.6, -Math.PI / 2, 0.9); canon(k, 2.2, 0, 2.6, -Math.PI / 2, 0.9); k.cil(0.07, al + 1.6, COL.maderaOsc, 1.9, (al + 1.6) / 2, -1.2, 5); bandera(g, 1.9, al + 1.4, -1.2, 1.4, 0.95, 0); },
    torre: function (k, g, t) { var h = 6 + t; k.cil(1.6, h, 0x9a8a70, 0, h / 2, 0, 12); for (var y = 1; y < h; y += 1.1) k.cil(1.62, 0.06, 0x7a6a58, 0, y, 0, 12); k.cil(2.0, 0.4, COL.madera, 0, h + 0.2, 0, 12); for (var m = 0; m < 10; m++) { var a = m / 10 * Math.PI * 2; k.caja(0.5, 0.7, 0.5, 0x9a8a70, Math.cos(a) * 1.8, h + 0.75, Math.sin(a) * 1.8); } canon(k, 0, h + 0.4, 0, -Math.PI / 2, 0.9); k.caja(0.6, 0.9, 0.06, COL.ventana, 0, h * 0.55, 1.6); k.cil(0.06, 2.4, COL.maderaOsc, 1.2, h + 1.6, -0.8, 5); bandera(g, 1.2, h + 2.5, -0.8, 1.3, 0.85, 0); },
    academia: function (k, g, t, r) { var al = casa(k, { w: 3.8, d: 3.2, pisos: t >= 2 ? 2 : 1, color: 0x7fc8e8, color2: 0xf0e2c0, contra: 0x2a6fae, balcon: true, techo: 'teja' }); k.cil(0.5, 1.6, 0xb08a5a, 1.2, al + 0.3, -0.6, 10); k.cil(0.12, 1.4, 0x8a6a30, 1.2, al + 1.1, -0.6, 8, 0, 0.9); k.esf(0.55, 0x3a8ad8, -1.0, al - 0.1, 0.4, 1, 1, 1, 12); k.cil(0.04, 1.2, COL.oro, -1.0, al - 0.1, 0.4, 6, 0, 0.4); },
    enfermeria: function (k, g, t) { casa(k, { w: 3.6, d: 3.0, pisos: 1, color: 0xf0e2c0, contra: 0x1f8a6a, techo: 'paja', zancos: true }); for (var i = 0; i < 3; i++) { k.cil(0.04, 1.4, COL.maderaOsc, -2.3, 0.7, -1 + i, 4); k.caja(0.05, 0.4, 0.5, 0x5aa040, -2.3, 1.2, -0.75 + i); } k.viga(new T3.Vector3(2.1, 1.6, -1.2), new T3.Vector3(2.1, 1.0, 1.2), 0.25, 0xd8c8a0, 6); },
    almacen: function (k, g, t) { casa(k, { w: 4.8, d: 3.6, pisos: t >= 3 ? 2 : 1, color: 0xa87448, color2: 0x8a5a3a, contra: 0x4a3020, techo: 'chapa', hp: 1.9 }); for (var i = 0; i < 4 + t; i++) barril(k, -2.4 + (i % 4) * 0.7, Math.floor(i / 4) * 0.8, 2.3, 0.9); caja(k, 2.2, 0, 2.2, 1, 0.3); caja(k, 2.3, 0.7, 2.1, 0.8, 0.1); k.cil(0.08, 3.6, COL.maderaOsc, 2.6, 1.8, -1.9, 5); k.viga(new T3.Vector3(2.6, 3.5, -1.9), new T3.Vector3(2.6, 3.3, 0.4), 0.1, COL.maderaOsc); k.viga(new T3.Vector3(2.6, 3.3, 0.4), new T3.Vector3(2.6, 1.6, 0.4), 0.03, COL.cuerda, 3); caja(k, 2.6, 1.3, 0.4, 0.5); },
    mercado: function (k, g, t) { var cols = [0xe8434f, 0xf2c94c, 0x3fb7b0, 0xe89ac0]; for (var i = 0; i < 2 + Math.min(2, t); i++) { var x = -2.4 + i * 1.6; k.caja(1.4, 0.9, 1.0, COL.madera, x, 0.45, 0.5); [-0.6, 0.6].forEach(function (s) { k.cil(0.05, 2.1, COL.maderaOsc, x + s, 1.05, 1.0, 5); k.cil(0.05, 2.4, COL.maderaOsc, x + s, 1.2, -0.1, 5); }); k.caja(1.6, 0.06, 1.5, cols[i % 4], x, 2.25, 0.45, 0, 0.18); for (var f = 0; f < 5; f++) k.esf(0.13, [0xf2a020, 0xd83a2a, 0x9ad040, 0xf2e040][f % 4], x - 0.5 + f * 0.25, 0.98, 0.5 + (f % 2) * 0.2, 1, 1, 1, 6); } barril(k, 2.6, 0, -0.6); caja(k, 2.6, 0, 0.8); },
    herreria: function (k, g, t) { var al = casa(k, { w: 3.6, d: 3.0, pisos: 1, color: 0x6a5a50, contra: 0x3a3a3a, techo: 'chapa' }); k.caja(0.9, al + 1.5, 0.9, 0x5a4a40, -1.2, (al + 1.5) / 2, -0.8); k.caja(0.9, 0.6, 0.5, COL.hierro, 1.8, 0.5, 1.9); k.caja(0.3, 0.5, 0.3, COL.maderaOsc, 1.8, 0.25, 1.9); var an = new T3.Vector3(2.4, 1.6, 0); k.cil(0.09, 1.6, COL.hierro, 2.2, 1.2, -1.6, 6); k.cil(0.06, 1.2, COL.hierro, 2.2, 0.5, -1.6, 6, 0, Math.PI / 2); LUCES.push({ x: 1.8, y: 1.1, z: 1.9, rel: true }); },
    establo: function (k, g, t) { for (var i = -1; i <= 1; i += 2) for (var j = -1; j <= 1; j += 2) k.cil(0.12, 2.2, COL.maderaOsc, i * 2.0, 1.1, j * 1.5, 6); k.add(new T3.ConeGeometry(1, 1, 4), mat4(0, 2.8, 0, 0, Math.PI / 4, 0, 3.4, 1.5, 2.6), COL.paja); for (var f = -2.6; f <= 2.6; f += 0.65) { k.cil(0.07, 0.9, COL.madera, f, 0.45, 2.4, 5); } k.caja(5.4, 0.08, 0.08, COL.madera, 0, 0.75, 2.4); k.caja(1.2, 0.35, 0.6, COL.madera, 0, 0.2, -0.8); k.caja(0.06, 0.8, 0.06, COL.maderaOsc, 1.4, 1.7, 0); k.esf(0.18, 0x2fb04a, 1.4, 2.2, 0, 1, 1.2, 1, 8); k.esf(0.08, 0xe8c030, 1.4, 2.25, 0.16, 1, 1, 1, 6); },
    galeria: function (k, g, t) { for (var i = 0; i < 3; i++) { var x = -1.8 + i * 1.8; k.cil(0.55, 0.08, 0xf2ece0, x, 1.2, -1.2, 16, Math.PI / 2); k.cil(0.38, 0.09, 0xd83a2a, x, 1.2, -1.15, 16, Math.PI / 2); k.cil(0.16, 0.1, 0xf2ece0, x, 1.2, -1.1, 12, Math.PI / 2); k.cil(0.06, 1.2, COL.maderaOsc, x, 0.6, -1.25, 5); } for (var b = 0; b < 4; b++) barril(k, -2 + b * 1.3, 0, 1.6, 0.8); k.caja(5, 0.6, 0.4, 0xc8b088, 0, 0.3, 2.6); },
    vigia: function (k, g, t) { var h = 7 + t * 1.2; for (var i = 0; i < 4; i++) { var a = i / 4 * Math.PI * 2 + Math.PI / 4, b = new T3.Vector3(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6), c = new T3.Vector3(Math.cos(a) * 0.7, h, Math.sin(a) * 0.7); k.viga(b, c, 0.18, COL.maderaOsc, 6); } k.cil(1.3, 1.4, 0xf2ece0, 0, h + 0.7, 0, 10); k.cil(1.32, 0.3, 0xd83a2a, 0, h + 0.9, 0, 10); k.caja(0.9, 0.7, 0.9, 0x2a2014, 0, h + 1.8, 0); k.cono(1.0, 1.0, COL.tejaR, 0, h + 2.7, 0, 8); LUCES.push({ x: 0, y: h + 1.8, z: 0, rel: true, faro: true }); },
    cabana: function (k, g, t) { casa(k, { w: 2.8, d: 2.4, pisos: 1, color: PAREDES[(t * 3) % 8], contra: CONTRA[t % 6], techo: 'paja', zancos: true }); k.viga(new T3.Vector3(1.4, 0.9, 1.6), new T3.Vector3(2.3, 0, 2.4), 0.3, COL.madera); },
    embajada: function (k, g, t) { var al = casa(k, { w: 4.6, d: 3.4, pisos: t >= 2 ? 3 : 2, color: 0xf2c84b, color2: 0xf0e2c0, contra: 0x2a6fae, balcon: true, techo: 'teja', hp: 1.5 }); [-1.6, 1.6].forEach(function (x) { k.cil(0.12, 1.3, COL.blanco, x, 0.8, 2.15, 8); }); k.caja(4.8, 0.12, 0.8, COL.blanco, 0, 1.5, 2.1); k.cil(0.06, 2.6, COL.maderaOsc, 0, al + 1.3, 0, 5); bandera(g, 0, al + 2.3, 0, 1.6, 1.05, 0, 'roja'); },
    relevo: function (k, g, t) { var al = casa(k, { w: 4.4, d: 3.4, pisos: t >= 2 ? 2 : 1, color: 0x3fb7b0, color2: 0xe8775a, contra: 0xf2f2f2, balcon: true, techo: 'teja' }); letrero(k, 2.3, 1.9, 1.0, 0x9a3a2a); for (var i = 0; i < 3; i++) barril(k, -2.0 + i * 0.75, 0, 2.3, 0.85); k.caja(1.2, 0.08, 0.7, COL.madera, 1.3, 0.75, 2.6); [[0.9, 2.6], [1.7, 2.6]].forEach(function (q) { k.cil(0.2, 0.5, COL.maderaCl, q[0], 0.25, q[1] + 0.6, 8); }); LUCES.push({ x: 2.3, y: 1.6, z: 1.9, rel: true }); },
    salon: function (k, g, t) { var al = casa(k, { w: 5.2, d: 3.8, pisos: 2, color: 0x5a3a22, color2: 0x7a5232, contra: 0xc9a227, balcon: true, techo: 'teja', hp: 1.7 }); k.esf(0.55, COL.hueso, 0, al - 0.6, 1.95, 1, 1, 0.6, 10); [-1, 1].forEach(function (s) { k.viga(new T3.Vector3(s * 0.9, al - 1.3, 1.95), new T3.Vector3(-s * 0.9, al - 0.1, 1.95), 0.12, COL.hueso, 5); }); [-2.2, 2.2].forEach(function (x) { k.cil(0.06, 3, COL.maderaOsc, x, al + 1.2, 1.2, 5); bandera(g, x, al + 2.4, 1.2, 1.3, 0.9, 0); }); }
  };
  function edificioPirata(tipo, nivel) {
    var t = nivel <= 5 ? 1 : nivel <= 10 ? 2 : nivel <= 15 ? 3 : 4, g = new T3.Group(), k = new Cons(), r = azar(tipo.length * 31 + t);
    var antes = LUCES.length; (TIPOS[tipo] || function (k2) { casa(k2, { w: 3.6, d: 3.0, pisos: t >= 3 ? 2 : 1, color: PAREDES[tipo.length % 8], contra: CONTRA[tipo.length % 6], techo: 'teja', balcon: t >= 3 }); })(k, g, t, r);
    var luces = LUCES.splice(antes, LUCES.length - antes);
    // con el nivel: farolillos en la puerta (tramo 2+), plataforma de piedra con borde (3+) y adornos de oro con banderín rojo (4)
    if (t >= 2) { farol(k, -1.8, 0, 2.1, 1.8); luces.push({ x: -1.38, y: 1.5, z: 2.1, rel: true }); }
    if (t >= 3) { k.caja(6.2, 0.18, 5.4, 0x9a8a70, 0, 0.09, 0); k.caja(6.4, 0.1, 5.6, 0x7a6a58, 0, 0.03, 0); }
    if (t >= 4) { [-2.9, 2.9].forEach(function (x) { k.cil(0.2, 1.0, COL.oro, x, 0.6, 2.6, 8); k.esf(0.22, COL.oro, x, 1.25, 2.6, 1, 1, 1, 8); }); k.cil(0.05, 2.0, COL.oro, -2.9, 2.2, -2.4, 5); bandera(g, -2.9, 2.9, -2.4, 1.0, 0.7, 0, 'roja'); }
    var me = k.malla(); g.add(me); g.userData.luces = luces; return g;
  }

  // ======================================================================
  //  LA ISLA ENTERA v2 (composición de la imagen): meseta con plaza de la rosa de los vientos, terraza y montaña de la calavera al fondo,
  //  tres cascadas, bahía con playa, islote con atalaya, islotes con puentes colgantes, arco de roca, escaleras y bordes de parcela.
  // ======================================================================
  var ISL = null;
  function grupoLocal(c) { var g = new T3.Group(), u = new T3.Vector3(c.ejeU.x, 0, c.ejeU.z), v = new T3.Vector3(c.ejeV.x, 0, c.ejeV.z); g.matrixAutoUpdate = false; g.matrix.makeBasis(u, new T3.Vector3(0, 1, 0), v); g.updateMatrixWorld(true); return g; }
  function puente(k, p1, p2, ancho) {
    var d = p2.clone().sub(p1), L = d.length(), n = Math.max(6, Math.round(L / 0.45)), lado = new T3.Vector3(-d.z, 0, d.x).normalize(), cae = L * 0.1, prev = null;
    for (var i = 0; i <= n; i++) {
      var t = i / n, p = p1.clone().lerp(p2, t); p.y -= Math.sin(Math.PI * t) * cae;
      if (i < n) k.caja(0.32, 0.07, ancho, i % 3 ? COL.madera : COL.maderaCl, p.x, p.y, p.z, Math.atan2(-d.z, d.x));
      if (prev) [-1, 1].forEach(function (l) { var a1 = prev.clone().addScaledVector(lado, l * ancho / 2), b1 = p.clone().addScaledVector(lado, l * ancho / 2); a1.y += 0.9; b1.y += 0.9; k.viga(a1, b1, 0.05, COL.cuerda, 4); if (i % 2 === 0) { var ab = b1.clone(); ab.y -= 0.9; k.viga(ab, b1, 0.035, COL.cuerda, 3); } });
      prev = p;
    }
    [p1, p2].forEach(function (q) { [-1, 1].forEach(function (l) { var b2 = q.clone().addScaledVector(lado, l * (ancho / 2 + 0.1)); k.cil(0.12, 1.6, COL.maderaOsc, b2.x, q.y + 0.4, b2.z, 6); }); });
  }
  // cascada entre dos puntos (lámina curva con el agua bajando + charca y espuma abajo)
  function cascada(raizL, top, bot, ancho, espuma) {
    var P = [], UVs = [], I = [], S = 10, lado = new T3.Vector3(bot.z - top.z, 0, -(bot.x - top.x)).normalize();
    if (lado.lengthSq() < 0.1) lado.set(0, 0, 1);
    var perp = new T3.Vector3(-(bot.z - top.z), 0, bot.x - top.x).normalize();
    for (var i = 0; i <= S; i++) { var t = i / S, y = top.y + (bot.y - top.y) * t, f = Math.pow(t, 0.5), x = top.x + (bot.x - top.x) * f, z = top.z + (bot.z - top.z) * f, w = ancho * (0.75 + t * 0.5);
      P.push(x + perp.x * w, y, z + perp.z * w, x - perp.x * w, y, z - perp.z * w); UVs.push(0, 1 - t, 1, 1 - t); if (i) { var q = (i - 1) * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(UVs, 2)); g.setIndex(I); g.computeVertexNormals();
    var m = new T3.Mesh(g, MAT.cascada); m.raycast = NOOP; m.renderOrder = 5; raizL.add(m);
    for (var j = 0; j < 46; j++) espuma.push([bot.x + (Math.random() - 0.5) * ancho * 2.4, bot.y + 0.1, bot.z + (Math.random() - 0.5) * ancho * 2.4, 0]);
    return m;
  }
  function texRosa() { return lienzo(1024, 1024, function (x, w) {
    var c = w / 2, gr = x.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, '#cdbb98'); gr.addColorStop(0.85, '#b8a27a'); gr.addColorStop(1, '#8a7656'); x.fillStyle = gr; x.beginPath(); x.arc(c, c, c, 0, 6.283); x.fill();
    for (var i = 0; i < 2600; i++) { x.fillStyle = 'rgba(' + (Math.random() > 0.5 ? '60,48,34' : '240,228,200') + ',' + (Math.random() * 0.12).toFixed(3) + ')'; x.fillRect(Math.random() * w, Math.random() * w, 2 + Math.random() * 6, 2 + Math.random() * 6); }
    [[0.97, 10, '#5a4a36'], [0.86, 5, '#e8d6a8'], [0.62, 4, '#5a4a36']].forEach(function (q) { x.strokeStyle = q[2]; x.lineWidth = q[1]; x.beginPath(); x.arc(c, c, c * q[0], 0, 6.283); x.stroke(); });
    for (var t = 0; t < 32; t++) { var a = t / 32 * 6.283; x.strokeStyle = '#5a4a36'; x.lineWidth = t % 4 ? 3 : 7; x.beginPath(); x.moveTo(c + Math.cos(a) * c * 0.86, c + Math.sin(a) * c * 0.86); x.lineTo(c + Math.cos(a) * c * (t % 4 ? 0.92 : 0.97), c + Math.sin(a) * c * (t % 4 ? 0.92 : 0.97)); x.stroke(); }
    function punta(a, l, an, c1, c2) { var px = Math.cos(a), py = Math.sin(a), qx = -py, qy = px; x.fillStyle = c1; x.beginPath(); x.moveTo(c, c); x.lineTo(c + px * l, c + py * l); x.lineTo(c + qx * an, c + qy * an); x.fill(); x.fillStyle = c2; x.beginPath(); x.moveTo(c, c); x.lineTo(c + px * l, c + py * l); x.lineTo(c - qx * an, c - qy * an); x.fill(); }
    for (var s = 0; s < 8; s++) punta(s / 8 * 6.283 + 6.283 / 16, c * 0.5, c * 0.08, '#7a5a34', '#a8824a');
    for (var s2 = 0; s2 < 4; s2++) punta(s2 / 4 * 6.283, c * 0.82, c * 0.13, s2 === 3 ? '#8a2218' : '#3a2a1a', s2 === 3 ? '#c43a28' : '#e0c890');
    x.fillStyle = '#d8b04a'; x.beginPath(); x.arc(c, c, c * 0.07, 0, 6.283); x.fill(); x.strokeStyle = '#5a4a36'; x.lineWidth = 4; x.stroke();
  }); }
  function construirIsla(c, esc) {
    materiales(); prepararIsla(c); prepararCaminos(c); LUCES.length = 0;
    var raizW = new T3.Group(), raizL = grupoLocal(c), fondo = new T3.Group(); raizW.name = 'tk-corsarios'; raizW.add(raizL); raizL.add(fondo);
    raizW.add(crearTerreno(c)); raizW.add(crearOceano(c));
    var cord = crearCordillera(c); raizW.add(cord);
    var k = new Cons(), kp = new Cons(), espuma = [];
    // ---------- plaza central: rosa de los vientos en el suelo, bordillo de piedra, estandartes y antorchas ----------
    var rosa = new T3.Mesh(new T3.CircleGeometry(12, 64), new T3.MeshStandardMaterial({ map: texRosa(), roughness: 0.85 })); rosa.rotation.x = -Math.PI / 2; rosa.position.y = 0.05; rosa.receiveShadow = true; rosa.raycast = NOOP; rosa.material.userData.tkpSinVentanas = true; raizL.add(rosa);
    for (var i = 0; i < 56; i++) { var an = i / 56 * Math.PI * 2; kp.caja(1.3, 0.32, 0.55, i % 2 ? 0x8d8473 : 0x9a907e, Math.cos(an) * 12.4, 0.16, Math.sin(an) * 12.4, -an + Math.PI / 2); }
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { var a = q[0] * 10.2, b = q[1] * 10.2; k.cil(0.1, 4.2, COL.maderaOsc, a, 2.1, b, 6); k.caja(0.06, 0.06, 1.3, COL.maderaOsc, a, 4.1, b); estandarte(raizL, a, 4.05, b, 2.6, Math.PI / 4 * (q[0] * q[1]), (q[0] + q[1]) === 0); k.cil(0.08, 1.6, COL.maderaOsc, a + q[0] * 1.6, 0.8, b, 5); LUCES.push({ x: a + q[0] * 1.6, y: 1.75, z: b, local: true }); });
    // ---------- bordes de piedra alrededor de cada parcela (instanciados) ----------
    var piedras = [];
    c.slots.forEach(function (s) { if (s.campo || !s.terreno) return; var l = c.aLocal(s.pos.x, s.pos.z), m = 3.6; for (var e = -m; e <= m + 0.01; e += 1.2) { piedras.push([l.a + e, l.b - m], [l.a + e, l.b + m]); if (Math.abs(e) < m - 0.1) piedras.push([l.a - m, l.b + e], [l.a + m, l.b + e]); } });
    var V = prepararVegetacion(), imB = new T3.InstancedMesh(V.roca, MAT.rocaPBR, piedras.length), ob = new T3.Object3D(), rb = azar(3);
    piedras.forEach(function (p, i) { ob.position.set(p[0], 0.02, p[1]); ob.rotation.set(0, rb() * 6.28, 0); ob.scale.set(0.42 + rb() * 0.12, 0.32, 0.38 + rb() * 0.1); ob.updateMatrix(); imB.setMatrixAt(i, ob.matrix); });
    imB.receiveShadow = true; imB.castShadow = true; imB.raycast = NOOP; raizL.add(imB);
    // ---------- escaleras de piedra entre niveles ----------
    function escalera(a0, y0, a1, y1, b, ancho) { var n = Math.max(3, Math.round(Math.abs(y1 - y0) / 0.42)); for (var s = 0; s < n; s++) { var t = (s + 0.5) / n, y = y0 + (y1 - y0) * t; kp.caja(Math.abs(a1 - a0) / n + 0.08, Math.abs(y - Math.min(y0, y1)) + 0.45, ancho, s % 2 ? 0x8d8473 : 0x9a907e, a0 + (a1 - a0) * t, (y + Math.min(y0, y1)) / 2 - 0.2, b); } [-1, 1].forEach(function (l) { for (var s2 = 0; s2 <= n; s2 += 2) { var t2 = s2 / n; kp.caja(0.7, 0.9, 0.6, 0x7a7262, a0 + (a1 - a0) * t2, y0 + (y1 - y0) * t2 + 0.25, b + l * (ancho / 2 + 0.3)); } }); }
    escalera(45.2, 0, 49.6, ISLA.playa, 0, 9);                            // villa → playa de la bahía
    escalera(-40.0, 0, -43.6, ISLA.terraza, 34, 4.5); escalera(-40.0, 0, -43.6, ISLA.terraza, -34, 4.5); // villa → terraza
    [[45.6, 5], [45.6, -5], [-40.4, 36.8], [-40.4, 31.2], [-40.4, -36.8], [-40.4, -31.2]].forEach(function (q) { k.cil(0.08, 1.6, COL.maderaOsc, q[0], 0.8, q[1], 5); LUCES.push({ x: q[0], y: 1.75, z: q[1], local: true }); });
    // ---------- montaña de la calavera (al fondo) y cascadas ----------
    var mon = null; // se pone en revisarFortaleza (depende del nivel del castillo)
    var ridgeH = function (a, b) { var cae = smooth(-56, -66, a), pico = 12 + 26 * Math.pow(fbm(a * 0.045 + 3, b * 0.05), 1.4) + 8 * Math.abs(vruido(a * 0.12, b * 0.12) - 0.5), barr = 1 - 0.55 * Math.exp(-Math.pow((Math.abs(b) - 24) / 4, 2)) * smooth(-58, -70, a); return cae * pico * barr * (1 - 0.6 * Math.exp(-b * b / 320) * smooth(-75, -60, a)) + ISLA.terraza - 0.4; };
    function bocaCascada(b, alto) { for (var a = -57; a > -95; a -= 0.5) if (ridgeH(a, b) > alto) return new T3.Vector3(a + 1.0, ridgeH(a, b) - 0.5, b); return new T3.Vector3(-70, alto, b); }
    var charcas = [];
    [[-24, 21, 2.4], [24.5, 14, 1.9]].forEach(function (q) { var t = bocaCascada(q[0], q[1]), bot = new T3.Vector3(-54.5, ISLA.terraza + 0.12, q[0]); cascada(fondo, t, bot, q[2], espuma); charcas.push(bot); });
    cascada(raizL, new T3.Vector3(6, 0.2, -47.8), new T3.Vector3(6, ISLA.agua + 0.1, -54), 2.0, espuma);      // la tercera: del borde de la villa al mar
    var mPoza = new T3.MeshStandardMaterial({ color: 0x3fb9c8, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.88 }); mPoza.userData.tkpSinVentanas = true;
    charcas.forEach(function (p) { var po = new T3.Mesh(new T3.CircleGeometry(4.2, 28), mPoza); po.rotation.x = -Math.PI / 2; po.position.set(p.x - 0.6, ISLA.terraza + 0.08, p.z); po.raycast = NOOP; fondo.add(po); for (var r = 0; r < 14; r++) { var a = r / 14 * Math.PI * 2; ISL_ROCAS.push([p.x - 0.6 + Math.cos(a) * 4.4, ISLA.terraza, p.z + Math.sin(a) * 4.4, 0.5 + Math.random() * 0.5]); } });
    // ---------- bahía: islote con atalaya, muelle corto en la playa ----------
    var isl = rocaMalla(esculpir(sdIslote, { x: -10, y: -9, z: -10 }, { x: 10, y: 6, z: 10 }, 0.5, colorRoca)); isl.position.set(90, ISLA.agua + 2.2, 13); raizL.add(isl);
    var topI = ISLA.agua + 2.2 + 3.6;
    function atalaya(a, y, b, giro) { for (var p = 0; p < 4; p++) { var an2 = p / 4 * Math.PI * 2 + Math.PI / 4; k.viga(new T3.Vector3(a + Math.cos(an2) * 1.5, y, b + Math.sin(an2) * 1.5), new T3.Vector3(a + Math.cos(an2) * 1.0, y + 5, b + Math.sin(an2) * 1.0), 0.18, COL.maderaOsc, 6); } k.caja(2.8, 0.18, 2.8, COL.madera, a, y + 5, b); for (var rr = 0; rr < 4; rr++) { var an3 = rr / 4 * Math.PI * 2; k.caja(2.8, 0.7, 0.08, COL.maderaCl, a + Math.cos(an3) * 1.36, y + 5.4, b + Math.sin(an3) * 1.36, an3 + Math.PI / 2); } k.add(new T3.ConeGeometry(1, 1, 4), mat4(a, y + 6.6, b, 0, Math.PI / 4, 0, 2.6, 1.8, 2.6), COL.paja); k.cil(0.05, 2, COL.maderaOsc, a, y + 7.6, b, 5); bandera(raizL, a, y + 8.3, b, 1.5, 1.0, giro || 0); LUCES.push({ x: a, y: y + 5.6, z: b + 1.0, local: true }); }
    atalaya(90, topI, 13, 0);
    var nL = LUCES.length, mu = new Cons(); muelle(mu, 56, -12, 72, -12, 2.8); var mm = mu.malla(); mm.position.y = ISLA.agua + 1.25; raizL.add(mm);
    for (var lq = nL; lq < LUCES.length; lq++) LUCES[lq].y += ISLA.agua + 1.25;
    // ---------- izquierda: islotes con puentes colgantes y atalaya; derecha: arco de roca ----------
    var st1 = rocaMalla(esculpir(function (x, y, z) { return Math.max(sdElip(x, y, z, 0, 0, 0, 3.8, 9, 3.8) + (fbm3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 2.4, -(y + 9)); }, { x: -6, y: -9, z: -6 }, { x: 6, y: 10, z: 6 }, 0.45, colorRoca));
    st1.position.set(-4, ISLA.agua - 1.5, -61); raizL.add(st1);
    var st2 = rocaMalla(esculpir(function (x, y, z) { return Math.max(sdElip(x, y, z, 0, 0, 0, 4.5, 11.5, 4.5) + (fbm3(x * 0.3 + 4, y * 0.3, z * 0.3) - 0.5) * 2.6, -(y + 11)); }, { x: -7, y: -11, z: -7 }, { x: 7, y: 12.5, z: 7 }, 0.45, colorRoca));
    st2.position.set(15, ISLA.agua - 0.5, -66); raizL.add(st2);
    var t1 = ISLA.agua - 1.5 + 8.2, t2 = ISLA.agua - 0.5 + 10.6;
    puente(k, new T3.Vector3(-4, 0.4, -47.5), new T3.Vector3(-4, t1 + 0.1, -58.8), 1.4); puente(k, new T3.Vector3(-3, t1 + 0.1, -62.5), new T3.Vector3(13, t2 + 0.1, -64.5), 1.4);
    atalaya(15, t2, -66, 0.6);
    var arco = rocaMalla(esculpir(sdArco, { x: -12.5, y: -9, z: -5.5 }, { x: 12.5, y: 12, z: 5.5 }, 0.5, colorRoca)); arco.position.set(30, ISLA.agua, 65); raizL.add(arco);
    // ---------- estandartes en la avenida y antorchas en los cruces ----------
    [18, 30, -20, -30].forEach(function (a) { [-1, 1].forEach(function (l) { k.cil(0.08, 3.4, COL.maderaOsc, a, 1.7, l * 3.2, 5); k.caja(0.06, 0.06, 1.1, COL.maderaOsc, a, 3.3, l * 3.2); estandarte(raizL, a, 3.25, l * 3.2, 2.0, 0, (a + l) % 2 === 0); }); });
    (c.esquinas() || []).forEach(function (q, i) { if (i % 3) return; var l = c.aLocal(q.x, q.z); if (Math.hypot(l.a, l.b) < 16) return; k.cil(0.08, 1.7, COL.maderaOsc, l.a + 1.0, 0.85, l.b + 1.0, 5); k.cil(0.16, 0.2, COL.hierro, l.a + 1.0, 1.75, l.b + 1.0, 6); LUCES.push({ x: l.a + 1.0, y: 1.95, z: l.b + 1.0, local: true }); });
    raizL.add(k.malla(MAT.solido)); raizL.add(kp.malla(MAT.rocaPBR));
    // ---------- vegetación y rocas ----------
    var cant = { baja: 0.45, media: 0.7, alta: 1.0, ultra: 1.3 }[(window.TKPremium && TKPremium.nivel && TKPremium.nivel()) || 'alta'] || 1;
    var veg = repartirVegetacion(c, raizL, cant);
    if (ISL_ROCAS.length) { var imR = new T3.InstancedMesh(V.roca, MAT.rocaPBR, ISL_ROCAS.length), orr = new T3.Object3D(); ISL_ROCAS.forEach(function (p, i) { orr.position.set(p[0], p[1], p[2]); orr.rotation.set(0, i * 2.3, 0); orr.scale.setScalar(p[3]); orr.updateMatrix(); imR.setMatrixAt(i, orr.matrix); }); imR.castShadow = true; imR.raycast = NOOP; fondo.add(imR); }
    // rocas grandes a lo largo de los acantilados de la costa (dan el borde rocoso de la imagen)
    var costa = [], rc = azar(808);
    for (var t = 0; t < 4000 && costa.length < 220 * cant; t++) { var a = ISLA.terr.a0 + rc() * (115 - ISLA.terr.a0), b = (rc() - 0.5) * 2 * (ISLA.hb + 10), d = tierra(a, b); if (d < -1.5 || d > 3.5) continue; if (a > 47 && enBahia(a, b) < 2 && Math.abs(b) < 30) continue; var h = altura(a, b); costa.push([a, Math.max(ISLA.agua - 1, h - 1.2), b, 1.4 + rc() * 2.8]); }
    var imC = new T3.InstancedMesh(V.roca, MAT.rocaPBR, costa.length), oc = new T3.Object3D(); costa.forEach(function (p, i) { oc.position.set(p[0], p[1], p[2]); oc.rotation.set(rc() * 0.5, rc() * 6.28, rc() * 0.5); oc.scale.set(p[3], p[3] * (0.9 + rc() * 0.9), p[3]); oc.updateMatrix(); imC.setMatrixAt(i, oc.matrix); }); imC.castShadow = true; imC.receiveShadow = true; imC.raycast = NOOP; raizL.add(imC);
    // ---------- galeones: uno fondeado en la bahía y dos navegando fuera ----------
    var amarrados = [[78, -18, 0.25]].map(function (q) { var s = galeon(0.8); s.position.set(q[0], ISLA.agua + 1.25, q[1]); s.rotation.y = q[2]; raizL.add(s); return s; });
    var navegan = [0, 1].map(function (i) { var s = galeon(0.75); raizL.add(s); return { g: s, th: i * Math.PI, v: 0.04 + i * 0.012 }; });
    // ---------- espuma y bruma al pie de las cascadas (una sola llamada de dibujo) ----------
    var nE = espuma.length, pe = new Float32Array(nE * 3), fe = new Float32Array(nE), te = new Float32Array(nE), ti = new Float32Array(nE);
    espuma.forEach(function (p, j) { pe[j * 3] = p[0]; pe[j * 3 + 1] = p[1]; pe[j * 3 + 2] = p[2]; fe[j] = Math.random() * 10; te[j] = 0.9 + Math.random() * 1.3; ti[j] = 0; });
    var ge = new T3.BufferGeometry(); ge.setAttribute('position', new T3.BufferAttribute(pe, 3)); ge.setAttribute('fase', new T3.BufferAttribute(fe, 1)); ge.setAttribute('tam', new T3.BufferAttribute(te, 1)); ge.setAttribute('tipo', new T3.BufferAttribute(ti, 1));
    var me = new T3.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: U.t, uEsc: { value: 400 }, uN: U.noche },
      vertexShader: 'attribute float fase; attribute float tam; uniform float uT; uniform float uEsc; varying float vA; void main(){ vec3 p = position; float c = fract(uT * 0.35 + fase * 0.1); p.y += c * 2.6; p.x += sin(fase + uT) * 0.5; vA = (1.0 - c) * 0.55; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(tam * (1.0 + c * 1.6) * uEsc / -mv.z, 0.0, 90.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uN; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float a = exp(-dot(q, q) * 8.0) * vA; if (a < 0.02) discard; gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * mix(1.0, 0.35, uN), a); }' });
    var esp = new T3.Points(ge, me); esp.frustumCulled = false; esp.renderOrder = 6; raizL.add(esp);
    ISL = { raizW: raizW, raizL: raizL, fondo: fondo, cordillera: cord, navegan: navegan, amarrados: amarrados, espuma: esp, lucesFijas: LUCES.slice(), fort: null, nvFort: 0, veg: veg.cuenta };
    LUCES.length = 0;
    return ISL;
  }
  var ISL_ROCAS = [];
  // ======================================================================
  //  ENCENDER / APAGAR: solo en la 2.ª villa. La ciudad medieval se esconde (no se borra) y vuelve intacta.
  // ======================================================================
  // registro de lo que hay en la escena: lo que lleva un rato quieto y no es del juego es decoración de la ciudad medieval
  function tomarFoto(esc) { foto = new Map(); var t = -1e9; esc.children.forEach(function (o) { foto.set(o, { p: o.position.clone(), t: t, movio: false }); }); }
  function registrar(esc) { var ahora = performance.now(); esc.children.forEach(function (o) { var r = foto.get(o); if (!r) foto.set(o, { p: o.position.clone(), t: ahora, movio: false }); else if (!r.movio && o.position.distanceToSquared(r.p) > 0.01) r.movio = true; }); }
  function esMedieval(o, c, esc) {
    if (o === ISL.raizW || o.isLight || o.isCamera || o === esc.userData.domo || o === esc.userData.estrellas) return false;
    if (o.name === 'luciernagas') return true;
    if (o === c.castillo() || o === c.muralla() || (c.torres() || []).some(function (t) { return t.grupo === o; })) return true;
    var r = foto && foto.get(o); if (!r || r.movio) return false;           // aldeanos, tropas, humo y efectos se mueven: se quedan
    if (performance.now() - r.t < 2500) return false;                         // recién nacido: se espera a ver si se mueve
    if (o.isSprite || o.isPoints || o.userData.tkpNo || o.userData.barricada) return false;
    if (o.material && o.material.isShaderMaterial) return false;              // cielo, cúpula de protección
    if (o.userData.v !== undefined && o.userData.r !== undefined) return false;   // nubes
    if (c.slots.some(function (s) { return s.grupo === o || s.terreno === o; })) return false;
    return true;
  }
  function ocultar(c, esc) {
    registrar(esc);
    esc.children.forEach(function (o) { if (o.visible && esMedieval(o, c, esc)) { o.visible = false; ocultos.push(o); } });
    // lo que se escondió por error (un aldeano que estaba quieto) vuelve en cuanto se mueve
    for (var i = ocultos.length - 1; i >= 0; i--) { var o = ocultos[i]; if (!esMedieval(o, c, esc) && o.parent === esc) { o.visible = true; ocultos.splice(i, 1); } }
  }
  function activar(c, esc) {
    if (!ISL) construirIsla(c, esc);
    esc.add(ISL.raizW); activa = true; document.body.classList.add('tkc-corsarios');
    ocultar(c, esc); version++;
    var x = X(); if (x && FORZAR === null) x.consejo('🏴‍☠️ ' + x.L('Bahía de los Corsarios', 'Corsair Bay'));
  }
  function desactivar(c, esc) {
    activa = false; document.body.classList.remove('tkc-corsarios');
    if (ISL) esc.remove(ISL.raizW);
    ocultos.forEach(function (o) { o.visible = true; }); ocultos = [];
    c.slots.forEach(function (s) { quitarPirata(s); if (s.campo && s.grupo) s.grupo.visible = true; });
    quitarProxy(c);
    piratas.forEach(function (p) { esc.remove(p.g); }); piratas = [];
    version++;
  }
  // ---------- cada parcela con edificio: su versión pirata (mismo sitio, mismo toque; la medieval queda escondida) ----------
  var yawCara = null, version = 0, lucesEdif = [];
  function quitarPirata(s) { if (s.tkc) { s.grupo.remove(s.tkc); s.tkc.traverse(function (m) { if (m.isMesh && m.geometry && m.geometry !== GEO.box) m.geometry.dispose(); }); s.tkc = null; } if (s.modelo) s.modelo.visible = true; if (s.adornos) s.adornos.visible = true; s.tkcClave = null; }
  var bbM = new T3.Box3(), bbP = new T3.Box3(), vT = new T3.Vector3(), vT2 = new T3.Vector3();
  function sincronizarParcelas(c) {
    var cambio = false;
    c.slots.forEach(function (s) {
      var quiere = s.edificio && !s.campo && s.modelo, D = window.TKCorsariosDemo, dm = D && D.activo() && D.esDemo(s) ? ':demo' + D.version() : ''; // v10.01: zona de demostración (js/tk-corsarios-demo.js)
      var clave = quiere ? s.edificio.tipo + ':' + s.edificio.nivel + ':' + s.modelo.uuid + dm : null;
      if (clave === s.tkcClave) { if (s.tkc && s.modelo && s.modelo.visible) s.modelo.visible = false; if (s.tkc && s.adornos && s.adornos.visible) s.adornos.visible = false; return; }
      quitarPirata(s); cambio = true; if (!quiere) return;
      s.modelo.visible = true; s.modelo.updateMatrixWorld(true); bbM.setFromObject(s.modelo); if (bbM.isEmpty()) return;
      var p = dm ? D.edificio(s, c, yawCara) : null;
      if (p) { // edificio de la demo: ya viene a la medida de la parcela y orientado a su calle
        s.grupo.updateMatrixWorld(true); p.position.copy(s.grupo.worldToLocal(new T3.Vector3(s.pos.x, 0, s.pos.z)));
        var gq0 = new T3.Quaternion(); s.grupo.getWorldQuaternion(gq0); var ws0 = new T3.Vector3(); s.grupo.getWorldScale(ws0); p.scale.setScalar(1 / (ws0.x || 1));
        p.rotation.y = p.userData.yaw - new T3.Euler().setFromQuaternion(gq0, 'YXZ').y;
        s.modelo.visible = false; if (s.adornos) s.adornos.visible = false; s.grupo.add(p); s.tkc = p; s.tkcClave = clave;
        p.updateMatrixWorld(true); p.userData.lucesMundo = (p.userData.luces || []).map(function (q) { var w = p.localToWorld(new T3.Vector3(q.x, q.y, q.z)); return { x: w.x, y: w.y, z: w.z, faro: q.faro }; });
        return;
      }
      p = edificioPirata(s.edificio.tipo, s.edificio.nivel); p.updateMatrixWorld(true); bbP.setFromObject(p);
      var tM = bbM.getSize(vT), tP = bbP.getSize(vT2), e = Math.max(0.55, Math.min(2.2, Math.max(tM.x, tM.z) / Math.max(tP.x, tP.z) * 0.98));
      p.scale.setScalar(e);
      var cen = bbM.getCenter(new T3.Vector3()); cen.y = bbM.min.y;
      s.grupo.updateMatrixWorld(true); var loc = s.grupo.worldToLocal(cen.clone()); p.position.copy(loc);
      var gq = new T3.Quaternion(); s.grupo.getWorldQuaternion(gq); var gyaw = new T3.Euler().setFromQuaternion(gq, 'YXZ').y; p.rotation.y = yawCara - gyaw;
      s.modelo.visible = false; if (s.adornos) s.adornos.visible = false; s.grupo.add(p); s.tkc = p; s.tkcClave = clave;
      p.updateMatrixWorld(true); p.userData.lucesMundo = (p.userData.luces || []).map(function (q) { var w = p.localToWorld(new T3.Vector3(q.x, q.y, q.z)); return { x: w.x, y: w.y, z: w.z, faro: q.faro }; });
    });
    if (cambio) { lucesEdif = []; c.slots.forEach(function (s) { if (s.tkc) lucesEdif = lucesEdif.concat(s.tkc.userData.lucesMundo || []); }); version++; }
  }
  function TIPOS_OK(t) { return t !== 'granja' && t !== 'aserradero' && t !== 'mina' && t !== 'cantera'; }
  // ---------- fortaleza: se rehace si sube el castillo ----------
  function revisarFortaleza(c) {
    var nv = (window.__juego && __juego.estado && __juego.estado().castillo) || 1;
    if (!ISL.fort || ISL.nvFort !== nv) {
      if (ISL.fort) ISL.fondo.remove(ISL.fort);
      LUCES.length = 0; ISL.fort = monte(nv); ISL.nvFort = nv; ISL.lucesFort = LUCES.slice(); LUCES.length = 0;
      ISL.fort.position.set(-62, ISLA.terraza, 0); ISL.fondo.add(ISL.fort); version++;
    }
    proxyCastillo(c);
  }
  // tocar la calavera abre el castillo (el castillo de verdad sigue en su sitio, invisible; su centro ya no se toca: ahí está la plaza)
  var PROXY = null;
  function proxyCastillo(c) {
    var ca = c.castillo(); if (!ca || !ISL.fort) return;
    if (PROXY && PROXY.parent === ca) return;
    ca.traverse(function (m) { if (m.isMesh && m !== PROXY && !m.userData.tkcRay) { m.userData.tkcRay = m.raycast; m.raycast = NOOP; } });
    ISL.fort.updateMatrixWorld(true); ca.updateMatrixWorld(true);
    var centro = ISL.fort.localToWorld(new T3.Vector3(0, 12, 0)), esc = new T3.Vector3(); ca.getWorldScale(esc);
    PROXY = new T3.Mesh(new T3.BoxGeometry(24 / esc.x, 26 / esc.y, 26 / esc.z), new T3.MeshBasicMaterial()); PROXY.visible = false; PROXY.userData.tkcProxy = true;
    PROXY.position.copy(ca.worldToLocal(centro)); ca.add(PROXY);
  }
  function quitarProxy(c) {
    var ca = c.castillo(); if (PROXY && PROXY.parent) PROXY.parent.remove(PROXY); PROXY = null;
    if (ca) ca.traverse(function (m) { if (m.isMesh && m.userData.tkcRay) { m.raycast = m.userData.tkcRay; delete m.userData.tkcRay; } });
  }
  // ---------- piratas por los caminos (con su tricornio) ----------
  var piratas = [];
  function crearPiratas(c, esc) {
    if (piratas.length || !window.M || !M.unidad) return; var es = c.esquinas(); if (!es || es.length < 4) return;
    var tipos = ['espadachin', 'aldeano', 'espadachin', 'aldeana', 'arquero', 'aldeano', 'espadachin', 'anciano'];
    tipos.forEach(function (t, i) {
      var u = M.unidad(t); if (!u || !u.grupo) return; var g = u.grupo; g.updateMatrixWorld(true); var bb = new T3.Box3().setFromObject(g), alto = bb.isEmpty() ? 1.6 : bb.max.y - bb.min.y;
      var k = new Cons(); k.cil(0.34, 0.06, 0x16141a, 0, 0, 0, 10); k.add(new T3.CylinderGeometry(0.0, 0.5, 1, 3), mat4(0, 0.13, 0, 0, i, 0, 0.62, 0.26, 0.62), 0x16141a); if (i % 3 === 0) k.caja(0.5, 0.05, 0.04, COL.oro, 0, 0.05, 0.3);
      var hat = k.malla(); hat.castShadow = false; hat.position.y = alto * 0.97 / (g.scale.y || 1); g.add(hat);
      var p0 = es[(i * 7) % es.length].clone(); g.position.copy(p0); esc.add(g);
      piratas.push({ u: u, g: g, meta: p0.clone(), espera: Math.random() * 3, vel: 1.1 + Math.random() * 0.4 });
    });
  }
  function moverPiratas(dt, c) {
    var es = c.esquinas(); if (!es) return;
    piratas.forEach(function (q) {
      var g = q.g, d = q.meta.clone().sub(g.position); d.y = 0; var l = d.length(), camina = false;
      if (q.espera > 0) q.espera -= dt;
      else if (l < 0.2) { var cerca = es.filter(function (p) { var dd = Math.hypot(p.x - g.position.x, p.z - g.position.z); return dd > 3 && dd < 15 && (Math.abs(p.x - g.position.x) < 0.6 || Math.abs(p.z - g.position.z) < 0.6); }); if (cerca.length) q.meta = cerca[Math.floor(Math.random() * cerca.length)].clone(); if (Math.random() < 0.35) q.espera = 1 + Math.random() * 4; }
      else { d.multiplyScalar(Math.min(1, q.vel * dt / l)); g.position.add(d); camina = true; var ang = Math.atan2(d.x, d.z); g.rotation.y += Math.atan2(Math.sin(ang - g.rotation.y), Math.cos(ang - g.rotation.y)) * Math.min(1, dt * 8); }
      try { M.animarUnidad(q.u, tiempo * 1.1 + q.vel * 5, camina); } catch (e) {}
    });
  }
  // ---------- gaviotas sobre el puerto ----------
  var gaviotas = null;
  function crearGaviotas() {
    var n = 18, g = new T3.BufferGeometry(), v = new Float32Array([0, 0, 0.16, -0.6, 0.06, -0.04, 0, 0, -0.14, 0, 0, 0.16, 0.6, 0.06, -0.04, 0, 0, -0.14]);
    g.setAttribute('position', new T3.BufferAttribute(v, 3)); g.computeVertexNormals();
    var m = new T3.MeshLambertMaterial({ color: 0xf4f4f0, side: T3.DoubleSide }); m.userData.tkpSinVentanas = true;
    m.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float fa = float(gl_InstanceID) * 2.3; float al = sin(uT * 7.0 + fa); transformed.y += abs(position.x) * (al > 0.6 ? al : 0.15 * al) * 0.8;'); };
    m.customProgramCacheKey = function () { return 'tkcGaviota'; };
    var im = new T3.InstancedMesh(g, m, n); im.frustumCulled = false; im.raycast = NOOP;
    var l = []; for (var i = 0; i < n; i++) l.push({ a: Math.random() * 6.28, r: 10 + Math.random() * 30, y: 7 + Math.random() * 9, v: (0.18 + Math.random() * 0.15) * (i % 2 ? 1 : -1), c: [ISLA.bahia.a - 6 + Math.random() * 20, (Math.random() - 0.5) * 50] });
    gaviotas = { m: im, l: l }; ISL.raizL.add(im);
  }
  function moverGaviotas(dt) {
    if (!gaviotas) return;
    gaviotas.l.forEach(function (b, i) { b.a += b.v * dt; o3.position.set(b.c[0] + Math.cos(b.a) * b.r, b.y + Math.sin(tiempo * 0.7 + i) * 1.5, b.c[1] + Math.sin(b.a) * b.r); o3.rotation.set(0, -b.a + (b.v > 0 ? Math.PI : 0), Math.sin(tiempo * 0.9 + i) * 0.3); o3.scale.setScalar(0.8); o3.updateMatrix(); gaviotas.m.setMatrixAt(i, o3.matrix); });
    gaviotas.m.instanceMatrix.needsUpdate = true;
  }
  // ---------- barcos navegando y meciéndose ----------
  function moverBarcos(dt) {
    ISL.navegan.forEach(function (n, i) {
      n.th += n.v * dt; var ca = 128, ra = 10, rb = 72, x = ca + Math.cos(n.th) * ra, z = Math.sin(n.th) * rb, dx = -Math.sin(n.th) * ra, dz = Math.cos(n.th) * rb;
      n.g.position.set(x, ISLA.agua + 1.2 + Math.sin(tiempo * 0.9 + i) * 0.12, z); n.g.rotation.set(Math.sin(tiempo * 0.7 + i) * 0.035, -Math.atan2(dz, dx), Math.sin(tiempo * 0.55 + i * 2) * 0.05);
    });
    ISL.amarrados.forEach(function (s, i) { s.rotation.x = Math.sin(tiempo * 0.6 + i * 1.7) * 0.02; s.position.y = ISLA.agua + 1.25 + Math.sin(tiempo * 0.8 + i) * 0.06; });
  }
  // ---------- luces de la isla para js/tk-dia-noche.js (en coordenadas del mundo) ----------
  function antorchas() {
    if (!ISL) return []; ISL.raizL.updateMatrixWorld(true);
    var l = [], conv = function (q, obj) { var w = new T3.Vector3(q.x, q.y, q.z); (obj || ISL.raizL).localToWorld(w); l.push({ x: w.x, y: w.y, z: w.z, tipo: 'isla', base: 0, puerta: !!q.faro }); };
    ISL.lucesFijas.forEach(function (q) { conv(q); }); (ISL.lucesFort || []).forEach(function (q) { conv(q, ISL.fort); });
    lucesEdif.forEach(function (q) { l.push({ x: q.x, y: q.y, z: q.z, tipo: 'isla', base: 0, puerta: true }); });
    return l;
  }
  var cOjo = new T3.Color(), cOjoDia = new T3.Color(0.95, 0.34, 0.07), cOjoNoche = new T3.Color(1.9, 0.62, 0.12), cFarolNoche = new T3.Color(1.5, 0.95, 0.4), cFarolDia = new T3.Color(0x3a2a14);
  // ======================================================================
  //  BUCLE
  // ======================================================================
  var revisaT = 0, revisaUlt = 0;
  function cadaFotograma(dt) {
    var x = X(), c = C(); if (!x || !c || !x.escena) return; var esc = x.escena; ESC = esc;
    if (!foto) tomarFoto(esc);
    dt = Math.max(0, Math.min(0.05, dt || 0)); tiempo += dt; U.t.value = tiempo;
    var quiere = FORZAR !== null ? FORZAR : (!c.enMenu() && c.villa() === 1);
    if (quiere && !activa) { if (yawCara === null) { var cp = x.camara.position, ob = c.cam.objetivo; yawCara = Math.atan2(cp.x - ob.x, cp.z - ob.z); } activar(c, esc); }
    else if (!quiere && activa) desactivar(c, esc);
    if (!activa) return;
    for (var oi = 0; oi < ocultos.length; oi++) ocultos[oi].visible = false; // el juego vuelve a encender algunos grupos en cada fotograma (detalles de cerca)
    if (esc.fog) { esc.fog.near += 160; esc.fog.far += 260; } // aire limpio de isla: la niebla solo funde el mar lejano con el horizonte
    U_FILL.dir.value.set(c.ejeU.x * 0.75, 0.55, c.ejeU.z * 0.75).normalize(); U_FILL.col.value.setRGB(0.42, 0.36, 0.28).multiplyScalar(1 - 0.7 * c.noche());
    var k = c.noche(); U.noche.value = k; U.viento.value = 1 + Math.sin(tiempo * 0.21) * 0.25;
    if (MAT.ojos) { MAT.ojos.color.copy(cOjoDia).lerp(cOjoNoche, Math.min(1, k * 1.2)); MAT.farol.color.copy(cFarolDia).lerp(cFarolNoche, Math.min(1, k * 1.2)); }
    var enCampos = c.vista() === 'campos'; if (ISL.fondo) ISL.fondo.visible = !enCampos; if (ISL.cordillera) ISL.cordillera.visible = !enCampos;
    c.slots.forEach(function (s) { if (s.campo && s.grupo) s.grupo.visible = enCampos; });
    sincronizarParcelas(c);
    var ahoraR = performance.now(); revisaT -= (ahoraR - (revisaUlt || ahoraR)) / 1000; revisaUlt = ahoraR;
    if (revisaT <= 0) { revisaT = 0.6; ocultar(c, esc); revisarFortaleza(c); crearPiratas(c, esc); if (!gaviotas) crearGaviotas(); }
    if (ISL.espuma) ISL.espuma.material.uniforms.uEsc.value = x.render.domElement.height * x.camara.projectionMatrix.elements[5] * 0.5;
    if (x.activo()) { moverBarcos(dt); moverGaviotas(dt); moverPiratas(dt, c); }
  }
  (function enganchar() {
    if (!window.TKExtras) window.TKExtras = { cadaFotograma: function () {} };
    var antes = TKExtras.cadaFotograma;
    // va ANTES que el resto de añadidos del mismo fotograma: así la luz y las antorchas ya saben si están en la isla
    TKExtras.cadaFotograma = function (dt) { try { cadaFotograma(dt); } catch (e) { if (!enganchar.av) { enganchar.av = 1; console.warn('TKCorsarios', e); } } antes(dt); };
  })();
  window.TKCorsarios = {
    activa: function () { return activa; }, version: function () { return version; }, antorchas: antorchas,
    // v10.01: piezas internas que reutiliza la zona de demostración (js/tk-corsarios-demo.js), solo lectura
    _int: { veg: function () { materiales(); return prepararVegetacion(); }, U: U, distCamino: distCamino, segs: function () { return SEGS; }, raizL: function () { return ISL && ISL.raizL; }, fort: function () { return ISL && ISL.fort; }, nvFort: function () { return ISL ? ISL.nvFort : 0; }, bandera: function (g, x, y, z, an, al, ry, tipo) { materiales(); return bandera(g, x, y, z, an, al, ry, tipo); } },
    forzar: function (v) { FORZAR = v === undefined ? true : v === null ? null : !!v; },
    estado: function () { var c = C(); return { veg: ISL && ISL.veg, monteMs: ISL && ISL.fort && ISL.fort.userData.ms, activa: activa, villa: c ? c.villa() : null, ocultos: ocultos.length, edificios: c ? c.slots.filter(function (s) { return s.tkc; }).length : 0, luces: activa ? antorchas().length : 0, piratas: piratas.length, barcos: ISL ? ISL.navegan.length + ISL.amarrados.length : 0, fortaleza: ISL ? ISL.nvFort : 0 }; }
  };
})();
