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
  //  ISLA: forma, alturas, colores (playa, selva, caminos, roca) y acantilados
  // ======================================================================
  var ISLA = null; // { ac, ha, hb, R, alt(a,b), ... }
  function ruido2(x, y) { var s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }
  function vruido(x, y) { var i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j; f = f * f * (3 - 2 * f); g = g * g * (3 - 2 * g); var a = ruido2(i, j), b = ruido2(i + 1, j), c = ruido2(i, j + 1), d = ruido2(i + 1, j + 1); return a + (b - a) * f + (c - a) * g + (a - b - c + d) * f * g; }
  function fbm(x, y) { return vruido(x, y) * 0.55 + vruido(x * 2.1 + 3, y * 2.1 - 1) * 0.3 + vruido(x * 4.3 - 7, y * 4.3 + 5) * 0.15; }
  function prepararIsla(c) {
    var R = c.R, cr = c.campos, atras = cr.a - cr.ha - 26, frente = R + 10;
    ISLA = { R: R, ac: (frente + atras) / 2, ha: (frente - atras) / 2, hb: R + 17, frente: frente, atras: atras, campos: cr, agua: -0.35 };
    // lugar de la fortaleza: el centro de la colina del castillo (siempre el origen de las coordenadas locales)
    ISLA.fort = { a: 0, b: 0 };
  }
  function elipse(a, b) { var u = (a - ISLA.ac) / ISLA.ha, v = b / ISLA.hb; return Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4), 0.25) + (fbm(a * 0.05, b * 0.05) - 0.5) * 0.08; }
  function zonaAcantilado(a, b) {
    // laterales del fondo (al lado de los campos) y el fondo de la isla
    var lado = smooth(ISLA.R + 5, ISLA.R + 12, Math.abs(b)) * smooth(ISLA.R * 0.5, ISLA.R * 0.2, a); // acantilados a los lados de la villa (se ven desde la ciudad)
    var fondo = smooth(ISLA.atras + 30, ISLA.atras + 12, a);
    return Math.max(lado, fondo);
  }
  function smooth(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  function altura(a, b) {
    var e = elipse(a, b), z = zonaAcantilado(a, b);
    var base = e < 0.9 ? 0 : e < 1.0 ? -1.4 * smooth(0.9, 1.0, e) : -1.4 - (e - 1) * 30;
    if (e < 0.92) { // colinas suaves fuera de la villa y de los campos
      var enVilla = Math.abs(a) < ISLA.R + 3 && Math.abs(b) < ISLA.R + 3, cr = ISLA.campos, enCampos = Math.abs(a - cr.a) < cr.ha + 3 && Math.abs(b - cr.b) < cr.hb + 3;
      if (!enVilla && !enCampos) base += fbm(a * 0.06, b * 0.06) * 3.2 * smooth(0.0, 6.0, Math.min(Math.abs(Math.abs(a) - ISLA.R - 3), Math.abs(Math.abs(b) - ISLA.R - 3)) + (Math.abs(a) > ISLA.R + 3 || Math.abs(b) > ISLA.R + 3 ? 6 : 0));
    }
    if (z > 0) { var pico = 16 + fbm(a * 0.04 + 9, b * 0.04) * 16 + vruido(a * 0.25, b * 0.25) * 2.5; var cae = 1 - smooth(0.95, 1.04, e); base = base * (1 - z) + (pico * cae + base * (1 - cae)) * z; }
    return base;
  }
  // caminos de arena: siguen las calles entre parcelas (las mismas por donde andan los aldeanos)
  var SEGS = [];
  function prepararCaminos(c) {
    SEGS = []; var es = c.esquinas() || [];
    es.forEach(function (p, i) { es.forEach(function (q, j) { if (j <= i) return; var dx = Math.abs(p.x - q.x), dz = Math.abs(p.z - q.z); var l1 = c.aLocal(p.x, p.z), l2 = c.aLocal(q.x, q.z); var da = Math.abs(l1.a - l2.a), db = Math.abs(l1.b - l2.b); if ((da < 0.8 && db < 14 && db > 1) || (db < 0.8 && da < 14 && da > 1)) SEGS.push([l1.a, l1.b, l2.a, l2.b]); }); });
    // camino grande: de la playa a la fortaleza
    SEGS.push([ISLA.frente - 4, 0, 20, 0]);
  }
  function distCamino(a, b) { var m = 1e9; for (var i = 0; i < SEGS.length; i++) { var s = SEGS[i], ax = s[2] - s[0], ay = s[3] - s[1], l = ax * ax + ay * ay, t = l ? Math.max(0, Math.min(1, ((a - s[0]) * ax + (b - s[1]) * ay) / l)) : 0, dx = a - s[0] - ax * t, dy = b - s[1] - ay * t, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
  var cArena = new T3.Color(0xe8d4a0), cArenaH = new T3.Color(0xc9a86a), cSelva = new T3.Color(0x4f9a3a), cSelva2 = new T3.Color(0x2f7a32), cRoca = new T3.Color(0x7a6a5a), cRoca2 = new T3.Color(0x5a4c40), cCamino = new T3.Color(0xd8b878), cTmp = new T3.Color();
  function crearTerreno(c) {
    var N = 150, ext = { a0: ISLA.atras - 40, a1: ISLA.frente + 45, b0: -ISLA.hb - 40, b1: ISLA.hb + 40 };
    var g = new T3.PlaneGeometry(1, 1, N, N), P = g.attributes.position, col = new Float32Array(P.count * 3);
    for (var i = 0; i < P.count; i++) {
      var u = P.getX(i) + 0.5, v = P.getY(i) + 0.5, a = ext.a0 + (ext.a1 - ext.a0) * u, b = ext.b0 + (ext.b1 - ext.b0) * v;
      var h = altura(a, b), w = c.aMundo(a, b); P.setXYZ(i, w[0], h, w[1]);
      var e = elipse(a, b), z = zonaAcantilado(a, b), n = fbm(a * 0.15, b * 0.15);
      if (e > 0.9 && z < 0.5) cTmp.copy(cArena).lerp(cArenaH, smooth(0.95, 1.02, e));
      else { cTmp.copy(cSelva).lerp(cSelva2, n); cTmp.lerp(cArena, (1 - smooth(0.8, 0.9, e)) * 0); }
      if (z > 0.2 || h > 6) cTmp.lerp(n > 0.5 ? cRoca : cRoca2, Math.min(1, Math.max(z * 1.3, smooth(5, 10, h))) * (h > 12 && n > 0.62 ? 0.55 : 1));
      if (e < 0.92 && h < 1.5) { var dc = distCamino(a, b); if (dc < 1.9) cTmp.lerp(cCamino, smooth(1.9, 0.9, dc)); }
      var j = 0.94 + vruido(a * 0.9, b * 0.9) * 0.12; col[i * 3] = cTmp.r * j; col[i * 3 + 1] = cTmp.g * j; col[i * 3 + 2] = cTmp.b * j;
    }
    // la cuadrícula se generó en el plano XY: los triángulos quedan mirando hacia abajo; se dan la vuelta
    var idx = g.index.array; for (var k = 0; k < idx.length; k += 3) { var t = idx[k]; idx[k] = idx[k + 1]; idx[k + 1] = t; }
    g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
    var m = new T3.Mesh(g, new T3.MeshLambertMaterial({ vertexColors: true })); m.receiveShadow = true; m.raycast = NOOP; m.userData.tkcTerreno = true;
    return m;
  }
  // altura de la isla en una posición del mundo (para poner cosas encima)
  function yEn(c, x, z) { var l = c.aLocal(x, z); return altura(l.a, l.b); }

  // ======================================================================
  //  OCÉANO turquesa: ondas, espuma en la orilla, destellos de sol/luna y reflejo de faroles
  // ======================================================================
  function crearOceano(c) {
    var N = 128, ext = 320, data = new Uint8Array(N * N * 4);
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var a = ISLA.ac + (i / (N - 1) - 0.5) * 2 * ext, b = (j / (N - 1) - 0.5) * 2 * ext, h = altura(a, b), k = (j * N + i) * 4; var vv = Math.max(0, Math.min(255, Math.round((h + 12) / 16 * 255))); data[k] = vv; data[k + 1] = vv; data[k + 2] = vv; data[k + 3] = 255; }
    var tex = new T3.DataTexture(data, N, N, T3.RGBAFormat); tex.magFilter = T3.LinearFilter; tex.minFilter = T3.LinearFilter; tex.needsUpdate = true;
    var m = new T3.MeshPhongMaterial({ color: 0x1a8fbf, specular: 0xd8f4ff, shininess: 90 });
    m.userData.tkpSinVentanas = true;
    var uni = { uTkcT: U.t, uTkcAlt: { value: tex }, uTkcU: { value: new T3.Vector2(c.ejeU.x, c.ejeU.z) }, uTkcV: { value: new T3.Vector2(c.ejeV.x, c.ejeV.z) }, uTkcAc: { value: ISLA.ac }, uTkcExt: { value: ext }, uTkcN: U.noche };
    m.onBeforeCompile = function (sh) {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = 'varying vec3 vTkcW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vTkcW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uTkcT; uniform sampler2D uTkcAlt; uniform vec2 uTkcU; uniform vec2 uTkcV; uniform float uTkcAc; uniform float uTkcExt; uniform float uTkcN; varying vec3 vTkcW;\n' +
        'float kO(vec2 p){ return sin(p.x) * sin(p.y * 1.3 + p.x * 0.4); }\n' +
        sh.fragmentShader.replace('#include <color_fragment>', [
          '#include <color_fragment>',
          ' vec2 kL = vec2(dot(vTkcW.xz, uTkcU), dot(vTkcW.xz, uTkcV));',
          ' vec2 kUv = vec2((kL.x - uTkcAc) / (2.0 * uTkcExt) + 0.5, kL.y / (2.0 * uTkcExt) + 0.5);',
          ' float kH = texture2D(uTkcAlt, kUv).r * 16.0 - 12.0; float kP = clamp(-0.35 - kH, 0.0, 12.0);',
          ' vec2 kw = vTkcW.xz;',
          ' float o1 = kO(kw * 0.22 + vec2(uTkcT * 0.5, uTkcT * 0.3)), o2 = kO(kw * 0.6 - vec2(uTkcT * 0.4, -uTkcT * 0.6) + 2.0), o3 = kO(kw * 1.7 + vec2(-uTkcT * 1.0, uTkcT * 0.8) + 5.0);',
          ' float ola = o1 * 0.5 + o2 * 0.33 + o3 * 0.17;',
          ' vec3 kTurq = vec3(0.25, 0.86, 0.82), kMedio = vec3(0.06, 0.55, 0.72), kHondo = vec3(0.02, 0.22, 0.45);',
          ' vec3 kAg = mix(kTurq, kMedio, smoothstep(0.2, 2.5, kP)); kAg = mix(kAg, kHondo, smoothstep(2.5, 10.0, kP));',
          ' kAg *= 0.88 + 0.2 * smoothstep(-0.6, 0.8, ola);',
          ' float kEsp = smoothstep(0.55, 0.0, kP) * (0.55 + 0.45 * sin(uTkcT * 1.6 + kP * 18.0 + o2 * 2.0)); kEsp += smoothstep(0.86, 0.98, o2 * 0.6 + o3 * 0.6) * 0.25;',
          ' diffuseColor.rgb = mix(kAg, vec3(0.95, 0.98, 1.0), clamp(kEsp, 0.0, 0.85)) * mix(1.0, 0.42, uTkcN);'].join('\n'))
        .replace('#include <output_fragment>', [
          ' vec3 kV = normalize(cameraPosition - vTkcW); vec3 kN = normalize(vec3(o1 * 0.18 + o3 * 0.08, 1.0, o2 * 0.16 - o3 * 0.06));',
          ' float kF = 0.08 + 0.92 * pow(1.0 - max(dot(kV, kN), 0.0), 4.0);',
          ' outgoingLight = mix(outgoingLight, mix(vec3(0.75, 0.88, 0.95), vec3(0.08, 0.12, 0.28), uTkcN), clamp(kF * 1.3, 0.0, 0.5));',
          '#if NUM_POINT_LIGHTS > 0',
          ' vec3 kPv = -vViewPosition; vec3 kRl = vec3(0.0);',
          ' #pragma unroll_loop_start',
          ' for (int i = 0; i < NUM_POINT_LIGHTS; i ++) { { float kk = 1.0 - clamp(length(pointLights[ i ].position - kPv) / (max(pointLights[ i ].distance, 1.0) * 1.2), 0.0, 1.0); kRl += pointLights[ i ].color * kk * kk; } }',
          ' #pragma unroll_loop_end',
          ' outgoingLight += kRl * (0.3 + 0.7 * smoothstep(-0.1, 0.9, o2 * 0.6 + o3 * 0.7)) * 0.6;',
          '#endif',
          '#include <output_fragment>'].join('\n'));
    };
    m.customProgramCacheKey = function () { return 'tkcOceano1'; };
    var g = new T3.PlaneGeometry(1400, 1400, 1, 1); g.rotateX(-Math.PI / 2);
    var me = new T3.Mesh(g, m); me.position.set(0, ISLA.agua, 0); me.receiveShadow = true; me.raycast = NOOP; me.renderOrder = -1;
    return me;
  }

  // ======================================================================
  //  MODELOS: palmera, muelle, cañón, barril, farol, galeón
  // ======================================================================
  var COL = { madera: 0x7a5232, maderaOsc: 0x4a3020, maderaCl: 0xa8784a, cuerda: 0xc8b088, hueso: 0xe8dcc0, roca: 0x77695a, hierro: 0x3e3e44, oro: 0xe0b040, paja: 0xc8a25a, tejaR: 0xb5533a, blanco: 0xf2ece0, ventana: 0x1a120c };
  var PAREDES = [0x3fb7b0, 0xe8775a, 0xf2c84b, 0x7fc8e8, 0xe89ac0, 0x8fd18a, 0xf0e2c0, 0x5a8fd8];
  var CONTRA = [0x2a6fae, 0x1f8a6a, 0xc0392b, 0xf2f2f2, 0x7a3fa0, 0xe8a020];
  function geoPalma() {
    var k = new Cons(), r = azar(77), prev = new T3.Vector3(0, 0, 0), lean = 0.9;
    for (var i = 0; i < 7; i++) { var y = (i + 1) * 0.85, nx = Math.sin(i / 6 * 1.2) * lean, p = new T3.Vector3(nx, y, 0); k.viga(prev, p, 0.42 - i * 0.03, i % 2 ? 0x8a6a48 : 0x7a5c3e, 7); prev = p; }
    var top = prev.clone();
    for (var f = 0; f < 9; f++) {
      var ang = f / 9 * Math.PI * 2 + r() * 0.3, largo = 3.0 + r() * 0.8, p0 = top.clone();
      for (var s = 0; s < 5; s++) { var u = (s + 1) / 5, p1 = new T3.Vector3(top.x + Math.cos(ang) * largo * u, top.y + 0.55 * u - 1.9 * u * u, Math.sin(ang) * largo * u); var dir = p1.clone().sub(p0), l = dir.length(); var m = new T3.Matrix4().lookAt(p0, p1, new T3.Vector3(0, 1, 0)); m.setPosition(p0.clone().add(p1).multiplyScalar(0.5)); m.scale(new T3.Vector3(1.0 * (1 - u * 0.6), 0.05, l)); k.add(gBox(), m, s % 2 ? 0x3f8f34 : 0x4fa83e, 0.12); p0 = p1; }
    }
    for (var c = 0; c < 3; c++) k.esf(0.22, 0x5a3a1e, top.x + Math.cos(c * 2.1) * 0.3, top.y - 0.25, Math.sin(c * 2.1) * 0.3, 1, 1, 1, 7);
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(k.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(k.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(k.c, 3)); return g;
  }
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

  // ======================================================================
  //  FORTALEZA: montaña con forma de calavera (crece con el nivel del castillo)
  // ======================================================================
  function soldar(g) { // une los vértices repetidos (sombreado suave en vez de facetas)
    var P = g.attributes.position, mapa = {}, pos = [], idx = [];
    for (var i = 0; i < P.count; i++) { var k = Math.round(P.getX(i) * 1e4) + '_' + Math.round(P.getY(i) * 1e4) + '_' + Math.round(P.getZ(i) * 1e4); if (mapa[k] === undefined) { mapa[k] = pos.length / 3; pos.push(P.getX(i), P.getY(i), P.getZ(i)); } idx.push(mapa[k]); }
    var n = new T3.BufferGeometry(); n.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); n.setIndex(idx); g.dispose(); return n;
  }
  function fortaleza(nv) {
    var g = new T3.Group(), k = new Cons(), r = azar(31), esc = 1 + Math.min(0.35, (nv - 1) * 0.02), H = 21 * esc, R = 17.5 * esc;
    // montaña de roca (icosaedro deformado), con matas verdes arriba
    var mg = soldar(new T3.IcosahedronGeometry(1, 5)), P = mg.attributes.position, cs = new Float32Array(P.count * 3), cc = new T3.Color();
    for (var i = 0; i < P.count; i++) {
      var x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = fbm(x * 2.2 + 5, z * 2.2 + y * 1.3);
      var rr = 1 + (n - 0.5) * 0.35, yy = Math.max(-0.05, y);
      var h = yy < 0 ? 0 : Math.min(1, yy * 1.15) * H * (0.85 + n * 0.3); if (yy > 0.78) h = H * (0.93 + (n - 0.5) * 0.06); // meseta arriba
      var ex = yy < 0 ? 1.08 : 1 - Math.pow(Math.max(0, yy), 2.2) * 0.45;
      P.setXYZ(i, x * R * rr * ex, h, z * R * rr * ex);
      var vet = vruido(x * 9 + 3, y * 14) ; cc.set(0x8a7a66).lerp(new T3.Color(0x5a4a3e), n).lerp(new T3.Color(0xa8957a), Math.max(0, vet - 0.6) * 1.6);
      cc.lerp(new T3.Color(n > 0.6 ? 0x3f8a34 : 0x5aa040), yy > 0.74 ? 0.8 : (vruido(x * 5, z * 5) > 0.62 && yy > 0.15 ? 0.65 : 0));
      cs[i * 3] = cc.r; cs[i * 3 + 1] = cc.g; cs[i * 3 + 2] = cc.b;
    }
    mg.setAttribute('color', new T3.BufferAttribute(cs, 3)); mg.computeVertexNormals();
    k.addColor(mg, new T3.Matrix4());
    // calavera tallada en la cara que mira al puerto (+X local)
    var fx = R * 0.72, cy = H * 0.5;
    k.esf(1, COL.hueso, fx, cy, 0, 5.2 * esc, 5.6 * esc, 6.4 * esc, 18);           // cráneo
    k.esf(1, COL.hueso, fx + 0.8 * esc, cy - 4.2 * esc, 0, 4.0 * esc, 2.4 * esc, 4.6 * esc, 14); // mandíbula
    for (var d = -4; d <= 4; d++) k.caja(0.9 * esc, 1.5 * esc, 0.8 * esc, 0xf4ecd8, fx + 4.0 * esc - Math.abs(d) * 0.18 * esc, cy - 3.0 * esc, d * 1.0 * esc); // dientes
    k.caja(1.2 * esc, 2.6 * esc, 5.2 * esc, 0x120c08, fx + 3.8 * esc, cy - 5.6 * esc, 0);                     // boca = puerta de la cueva
    for (var b = -2; b <= 2; b++) k.caja(0.14, 2.4 * esc, 0.14, COL.hierro, fx + 4.5 * esc, cy - 5.6 * esc, b * 0.95 * esc); // reja
    var nariz = new T3.ConeGeometry(1, 1, 3); k.add(nariz, mat4(fx + 4.9 * esc, cy - 0.9 * esc, 0, 0, 0, Math.PI, 1.0 * esc, 1.8 * esc, 1.0 * esc), 0x1a120c);
    // escaleras talladas desde la boca hasta la explanada
    for (var s = 0; s < 8; s++) k.caja(1.3, 0.45, 5.0 * esc, 0x8a7a68, fx + 5.0 * esc + s * 1.1, Math.max(0.2, cy - 6.9 * esc - s * 0.55), 0);
    // empalizada y torres en la meseta
    var top = H * 0.93, rT = R * 0.5, torres = Math.min(6, 2 + Math.floor(nv / 4)), dorado = nv >= 12;
    for (var p = 0; p < 40; p++) { var a = p / 40 * Math.PI * 2, px = Math.cos(a) * rT, pz = Math.sin(a) * rT; k.cil(0.32, 2.4 + r() * 0.5, p % 2 ? COL.madera : COL.maderaOsc, px, top + 1.1, pz, 6); k.cono(0.34, 0.6, COL.maderaOsc, px, top + 2.6, pz, 6); }
    for (var t = 0; t < torres; t++) {
      var at = t / torres * Math.PI * 2 + 0.4, tx = Math.cos(at) * rT, tz = Math.sin(at) * rT;
      k.cil(1.3, 6.5, 0x8a7a68, tx, top + 3.2, tz, 10); k.cil(1.55, 0.6, COL.madera, tx, top + 6.6, tz, 10);
      for (var m = 0; m < 8; m++) { var am = m / 8 * Math.PI * 2; k.caja(0.45, 0.6, 0.45, COL.madera, tx + Math.cos(am) * 1.4, top + 7.2, tz + Math.sin(am) * 1.4); }
      k.cono(1.9, 2.6, dorado ? COL.oro : COL.paja, tx, top + 8.6, tz, 10);
      canon(k, tx + Math.cos(at) * 1.6, top + 6.9, tz + Math.sin(at) * 1.6, -at, 0.8);
      bandera(g, tx, top + 10.4, tz, 1.8, 1.2, -at, t % 3 === 2 ? 'roja' : 'negra');
      k.cil(0.06, 2.0, COL.maderaOsc, tx, top + 10.0, tz, 5);
      LUCES.push({ x: tx + Math.cos(at) * 1.7, y: top + 7.4, z: tz + Math.sin(at) * 1.7, local: true });
    }
    // casa del capitán en el centro y el gran mástil con la bandera de la calavera
    k.caja(6, 3.2, 5, 0x5a3a22, 0, top + 1.6, 0); k.caja(6.6, 0.3, 5.6, COL.maderaOsc, 0, top + 3.3, 0);
    k.add(new T3.ConeGeometry(1, 1, 4), mat4(0, top + 4.6, 0, 0, Math.PI / 4, 0, 5.4, 2.6, 4.6), dorado ? COL.oro : COL.tejaR);
    for (var w = -1; w <= 1; w++) k.caja(0.06, 0.9, 0.8, COL.ventana, 3.02, top + 1.8, w * 1.4);
    k.cil(0.22, 12, COL.maderaOsc, -1.5, top + 9, 0, 8); bandera(g, -1.5, top + 13.8, 0, 4.2, 2.8, 0, 'negra');
    if (nv >= 9) for (var c2 = 0; c2 < 5; c2++) k.cono(0.5 * esc, 1.6 * esc, COL.oro, fx - 1.5 * esc, cy + 5.2 * esc, (c2 - 2) * 1.5 * esc, 5); // corona de oro
    // cañones en la explanada delante de la calavera
    [-6, -3, 3, 6].forEach(function (zz) { canon(k, fx + 9 * esc, 0.05, zz * esc, 0, 1.1); });
    // antorchas en la boca y en las escaleras
    [-3.2, 3.2].forEach(function (zz) { LUCES.push({ x: fx + 5.6 * esc, y: cy - 4.4 * esc, z: zz * esc, local: true }); LUCES.push({ x: fx + 12 * esc, y: 1.9, z: zz * 1.2 * esc, local: true }); k.cil(0.1, 1.8, COL.maderaOsc, fx + 12 * esc, 0.9, zz * 1.2 * esc, 5); });
    g.add(k.malla());
    // ojos de la calavera: se encienden de noche (material propio)
    var ojoG = new T3.SphereGeometry(1, 14, 10);
    [-2.2, 2.2].forEach(function (zz) { var o = new T3.Mesh(ojoG, MAT.ojos); o.position.set(fx + 3.6 * esc, cy + 0.6 * esc, zz * esc); o.scale.set(1.4 * esc, 1.6 * esc, 1.35 * esc); o.raycast = NOOP; g.add(o); });
    g.userData.cumbre = top; return g;
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
  //  LA ISLA ENTERA: terreno, mar, puerto, barcos, cascadas, cuevas, puentes, astillero, palmeras
  // ======================================================================
  var ISL = null; // objetos construidos (se guardan para no rehacerlos al volver)
  function grupoLocal(c) { var g = new T3.Group(), u = new T3.Vector3(c.ejeU.x, 0, c.ejeU.z), v = new T3.Vector3(c.ejeV.x, 0, c.ejeV.z); g.matrixAutoUpdate = false; g.matrix.makeBasis(u, new T3.Vector3(0, 1, 0), v); g.updateMatrixWorld(true); return g; }
  function pilar(k, a, b, alto, r0, sem) { var r = azar(sem), y = -2; for (var i = 0; y < alto; i++) { var rr = r0 * (1 - y / (alto + 4) * 0.45) * (0.85 + r() * 0.3), hh = 1.4 + r() * 0.8; k.cil(rr, hh, r() > 0.5 ? COL.roca : 0x6a5c4e, a + (r() - 0.5) * 0.6, y + hh / 2, b + (r() - 0.5) * 0.6, 9); y += hh * 0.85; } k.esf(r0 * 0.75, 0x4f8a3a, a, alto + 0.2, b, 1, 0.35, 1, 10); return alto; }
  function puente(k, p1, p2, ancho) {
    var d = p2.clone().sub(p1), L = d.length(), n = Math.max(6, Math.round(L / 0.45)), lado = new T3.Vector3(-d.z, 0, d.x).normalize(), cae = L * 0.12, prev = null;
    for (var i = 0; i <= n; i++) {
      var t = i / n, p = p1.clone().lerp(p2, t); p.y -= Math.sin(Math.PI * t) * cae;
      if (i < n) { var ry = Math.atan2(-d.z, d.x); k.caja(0.3, 0.07, ancho, i % 3 ? COL.madera : COL.maderaCl, p.x, p.y, p.z, ry); }
      if (prev) [-1, 1].forEach(function (l) { var a1 = prev.clone().addScaledVector(lado, l * ancho / 2), b1 = p.clone().addScaledVector(lado, l * ancho / 2); a1.y += 0.9; b1.y += 0.9; k.viga(a1, b1, 0.05, COL.cuerda, 4); if (i % 2 === 0) { var ab = b1.clone(); ab.y -= 0.9; k.viga(ab, b1, 0.035, COL.cuerda, 3); } });
      prev = p;
    }
    [p1, p2].forEach(function (q) { [-1, 1].forEach(function (l) { var b2 = q.clone().addScaledVector(lado, l * (ancho / 2 + 0.1)); k.cil(0.12, 1.6, COL.maderaOsc, b2.x, q.y + 0.4, b2.z, 6); }); });
  }
  function cascada(raizL, a, lado) {
    var bE = ISLA.R + 9; for (var b = ISLA.R + 9; b < ISLA.hb + 30; b += 0.5) { if (altura(a, lado * b) < 0) { bE = b; break; } }
    var top = altura(a, lado * (bE - 6)); if (top < 6) return null;
    var g = new T3.BufferGeometry(), y0 = top - 0.6, z0 = lado * (bE - 6.5), z1 = lado * (bE + 1.5), w = 2.6;
    var pos = [a - w, y0, z0, a + w, y0, z0, a - w * 1.25, ISLA.agua + 0.1, z1, a + w * 1.25, ISLA.agua + 0.1, z1], uv = [0, 1, 1, 1, 0, 0, 1, 0];
    // curva: varios tramos para que la caída se doble como el agua de verdad
    var P = [], UVs = [], I = [], S = 8;
    for (var i = 0; i <= S; i++) { var t = i / S, y = y0 + (ISLA.agua + 0.1 - y0) * t, z = z0 + (z1 - z0) * Math.pow(t, 0.55), ww = w * (1 + t * 0.3); P.push(a - ww, y, z, a + ww, y, z); UVs.push(0, 1 - t, 1, 1 - t); if (i) { var q = (i - 1) * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
    g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(UVs, 2)); g.setIndex(I); g.computeVertexNormals();
    var m = new T3.Mesh(g, MAT.cascada); m.raycast = NOOP; m.renderOrder = 5; raizL.add(m);
    return { a: a, b: z1, y: ISLA.agua, top: y0, z0: z0 };
  }
  function construirIsla(c, esc) {
    materiales(); prepararIsla(c); prepararCaminos(c); LUCES.length = 0;
    var raizW = new T3.Group(), raizL = grupoLocal(c); raizW.name = 'tk-corsarios'; raizW.add(raizL);
    raizW.add(crearTerreno(c)); raizW.add(crearOceano(c));
    var k = new Cons(), F = ISLA.frente, R = ISLA.R;
    // puerto: dos muelles largos y uno transversal, cañones mirando al mar en la orilla
    muelle(k, F - 6, -20, F + 22, -20, 3.2); muelle(k, F - 6, 25, F + 20, 25, 3.2); muelle(k, F + 22, -24, F + 22, 4, 2.8);
    for (var bc = -44; bc <= 44; bc += 11) if (Math.abs(bc) > 6 && Math.abs(bc + 20) > 4 && Math.abs(bc - 25) > 4) { canon(k, F - 3, 0.05, bc, 0, 1.2); }
    for (var fc = 0; fc < 5; fc++) [-3.2, 3.2].forEach(function (bb) { var aa = F - 4 - fc * 8; if (aa < 22) return; farol(k, aa, 0, bb, 2.4); LUCES.push({ x: aa + 0.42, y: 2.1, z: bb, local: true }); });
    // astillero en la playa: un casco a medio hacer sobre la grada, con andamios
    var cas = geoCasco(14, 4.4, 2.8); k.addColor(cas.g, mat4(F - 4, 2.3, 44, 0, 0, 0.06)); for (var an = -6; an <= 6; an += 2) [-1, 1].forEach(function (l) { k.cil(0.1, 4.2, COL.madera, F - 4 + an, 2.1, 44 + l * 2.8, 5); }); k.caja(14, 0.12, 0.6, COL.madera, F - 4, 3.6, 41.2); k.caja(14, 0.12, 0.6, COL.madera, F - 4, 3.6, 46.8); for (var cj = 0; cj < 4; cj++) caja(k, F - 12 + cj * 1.2, 0, 49, 0.9, cj * 0.4);
    for (var cr = 0; cr < 9; cr++) k.caja(0.3, 0.2, 5.2, COL.maderaOsc, F - 10 + cr * 1.6, 0.1, 44);
    // islotes de roca con puentes colgantes y atalayas
    [[1, -1], [1, 1]].forEach(function (q, i) {
      var s = q[1], a1 = F - 2, b1 = s * (ISLA.hb - 4), a2 = F + 12, b2 = s * (ISLA.hb + 2), h1 = pilar(k, a1, b1, 7, 3.2, 11 + i), h2 = pilar(k, a2, b2, 10, 2.8, 17 + i);
      puente(k, new T3.Vector3(a1, h1 + 0.5, b1), new T3.Vector3(a2, h2 + 0.5, b2), 1.4);
      k.cil(1.2, 2.4, COL.madera, a2, h2 + 1.6, b2, 8); k.cono(1.6, 1.6, COL.paja, a2, h2 + 3.6, b2, 8); bandera(raizL, a2, h2 + 5.0, b2, 1.4, 0.9, 0); k.cil(0.06, 1.8, COL.maderaOsc, a2, h2 + 4.4, b2, 5);
      LUCES.push({ x: a2 + 1.3, y: h2 + 2.0, z: b2, local: true }); LUCES.push({ x: a1, y: h1 + 1.6, z: b1, local: true }); farol(k, a1 - 0.4, h1 + 0.4, b1, 1.4);
    });
    // cuevas del tesoro en los acantilados de los lados (cofres y montones de oro que brillan)
    var tesoros = [];
    [-1, 1].forEach(function (s, i) {
      var a = -6 - i * 6, b = s * (ISLA.R + 8.0), y = Math.max(0, altura(a, s * (ISLA.R + 3.5)));
      k.esf(1, 0x100a06, a, y + 1.6, b, 3.2, 2.6, 1.6, 12); k.esf(1, COL.roca, a, y + 4.4, b - s * 0.4, 4.4, 1.2, 2.4, 10);
      for (var t = 0; t < 3; t++) { var ca = a - 1.5 + t * 1.5, cb = b - s * 2.2; k.caja(1.0, 0.6, 0.7, 0x6a3a1a, ca, y + 0.3, cb); k.caja(1.04, 0.3, 0.74, 0x7a4a22, ca, y + 0.75, cb); k.caja(1.06, 0.08, 0.76, COL.oro, ca, y + 0.92, cb); k.esf(0.5, COL.oro, ca + 0.6, y + 0.05, cb - s * 0.6, 1.2, 0.5, 1, 8); tesoros.push(new T3.Vector3(ca + 0.6, y + 0.3, cb - s * 0.6)); }
      [-2.6, 2.6].forEach(function (d) { k.cil(0.08, 1.8, COL.maderaOsc, a + d, y + 0.9, b - s * 2.6, 5); LUCES.push({ x: a + d, y: y + 1.9, z: b - s * 2.6, local: true }); });
    });
    // caminos de tablas por la playa hasta los muelles
    for (var tb = F - 10; tb < F - 3; tb += 0.45) { k.caja(0.36, 0.08, 2.6, COL.madera, tb, 0.08, -20); k.caja(0.36, 0.08, 2.6, COL.madera, tb, 0.08, 25); }
    raizL.add(k.malla());
    // cascadas
    var cascadas = []; [-1, 1].forEach(function (s) { [4, -30].forEach(function (a) { var w = cascada(raizL, a, s); if (w) cascadas.push(w); }); });
    // palmeras: una malla instanciada (en la playa, las colinas y los huecos libres de la villa)
    var gp = geoPalma(), rp = azar(4242), lug = [];
    for (var t2 = 0; t2 < 2600 && lug.length < 140; t2++) {
      var a3 = ISLA.atras + rp() * (ISLA.frente - ISLA.atras), b3 = (rp() - 0.5) * 2 * ISLA.hb, e3 = elipse(a3, b3), h3 = altura(a3, b3);
      if (e3 > 0.97 || h3 < -0.2 || h3 > 9 || zonaAcantilado(a3, b3) > 0.6) continue;
      var w3 = c.aMundo(a3, b3), enV = Math.abs(a3) < R + 2 && Math.abs(b3) < R + 2, cr2 = c.campos, enC = Math.abs(a3 - cr2.a) < cr2.ha + 2 && Math.abs(b3 - cr2.b) < cr2.hb + 2;
      if (enC) continue; if (enV && !c.libre(w3[0], w3[1])) continue; if (Math.hypot(a3, b3) < 30) continue;
      if (Math.abs(b3 + 20) < 3 || Math.abs(b3 - 25) < 3 || (Math.abs(b3) < 5 && a3 > 18)) continue; // muelles y camino grande
      lug.push([a3, h3, b3]);
    }
    var ip = new T3.InstancedMesh(gp, MAT.palma, lug.length); ip.castShadow = true; ip.receiveShadow = true; ip.raycast = NOOP;
    lug.forEach(function (q, i) { o3.position.set(q[0], q[1] - 0.1, q[2]); o3.rotation.set(0, rp() * 6.28, 0); o3.scale.setScalar(0.85 + rp() * 0.5); o3.updateMatrix(); ip.setMatrixAt(i, o3.matrix); });
    raizL.add(ip);
    // galeones amarrados y navegando
    var amarrados = [[F + 11, -14.6, 0], [F + 10, 30.6, 0]].map(function (q) { var s = galeon(0.85); s.position.set(q[0], ISLA.agua + 1.25, q[1]); s.rotation.y = q[2]; raizL.add(s); return s; });
    var navegan = [0, 1].map(function (i) { var s = galeon(0.8); raizL.add(s); return { g: s, th: i * Math.PI, v: 0.045 + i * 0.01 }; });
    // espuma y bruma al pie de las cascadas + destellos del tesoro (una sola llamada de dibujo)
    var nE = cascadas.length * 40 + tesoros.length * 6, pe = new Float32Array(nE * 3), fe = new Float32Array(nE), te = new Float32Array(nE), ti = new Float32Array(nE), q2 = 0;
    cascadas.forEach(function (w) { for (var j = 0; j < 40; j++) { pe[q2 * 3] = w.a + (Math.random() - 0.5) * 7; pe[q2 * 3 + 1] = w.y; pe[q2 * 3 + 2] = w.b + (Math.random() - 0.5) * 3; fe[q2] = Math.random() * 10; te[q2] = 0.9 + Math.random() * 1.2; ti[q2] = 0; q2++; } });
    tesoros.forEach(function (p) { for (var j = 0; j < 6; j++) { pe[q2 * 3] = p.x + (Math.random() - 0.5) * 1.2; pe[q2 * 3 + 1] = p.y + Math.random() * 0.4; pe[q2 * 3 + 2] = p.z + (Math.random() - 0.5) * 1.2; fe[q2] = Math.random() * 10; te[q2] = 0.25; ti[q2] = 1; q2++; } });
    var ge = new T3.BufferGeometry(); ge.setAttribute('position', new T3.BufferAttribute(pe, 3)); ge.setAttribute('fase', new T3.BufferAttribute(fe, 1)); ge.setAttribute('tam', new T3.BufferAttribute(te, 1)); ge.setAttribute('tipo', new T3.BufferAttribute(ti, 1));
    var me = new T3.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: U.t, uEsc: { value: 400 } },
      vertexShader: 'attribute float fase; attribute float tam; attribute float tipo; uniform float uT; uniform float uEsc; varying float vA; varying float vTi; void main(){ vec3 p = position; float c = fract(uT * 0.35 + fase * 0.1); if (tipo < 0.5) { p.y += c * 2.4; p.x += sin(fase + uT) * 0.4; vA = (1.0 - c) * 0.6; } else { vA = pow(max(0.0, sin(uT * 2.0 + fase * 3.0)), 12.0); } vTi = tipo; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(tam * (tipo < 0.5 ? 1.0 + c * 1.5 : 1.0) * uEsc / -mv.z, 0.0, 90.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; varying float vTi; void main(){ vec2 q = gl_PointCoord - 0.5; float d = dot(q, q) * 4.0; if (vTi > 0.5) { float s = max(0.0, 1.0 - abs(q.x) * 14.0) + max(0.0, 1.0 - abs(q.y) * 14.0); float a = (exp(-d * 6.0) + s * 0.6) * vA; if (a < 0.02) discard; gl_FragColor = vec4(vec3(1.0, 0.85, 0.4) * a * 2.5, a); } else { float a = exp(-d * 2.0) * vA; if (a < 0.02) discard; gl_FragColor = vec4(vec3(0.95, 0.98, 1.0), a); } }' });
    var espuma = new T3.Points(ge, me); espuma.frustumCulled = false; espuma.renderOrder = 6; raizL.add(espuma);
    ISL = { raizW: raizW, raizL: raizL, navegan: navegan, amarrados: amarrados, espuma: espuma, lucesFijas: LUCES.slice(), fort: null, nvFort: 0 };
    return ISL;
  }

  // ======================================================================
  //  ENCENDER / APAGAR: solo en la 2.ª villa. La ciudad medieval se esconde (no se borra) y vuelve intacta.
  // ======================================================================
  function tomarFoto(esc) { foto = new Map(); esc.children.forEach(function (o) { foto.set(o, o.position.clone()); }); }
  function esMedieval(o, c, esc) {
    if (o === ISL.raizW || o.isLight || o.isCamera || o === esc.userData.domo || o === esc.userData.estrellas) return false;
    if (o.name === 'luciernagas') return true;
    if (o === c.castillo() || o === c.muralla() || (c.torres() || []).some(function (t) { return t.grupo === o; })) return true;
    if (!foto || !foto.has(o)) return false;                    // lo que nace durante el juego (tropas, humo, efectos) se queda
    if (o.isSprite || o.userData.tkpNo || o.userData.barricada) return false;
    if (o.userData.v !== undefined && o.userData.r !== undefined) return false;   // nubes
    if (c.slots.some(function (s) { return s.grupo === o || s.terreno === o; })) return false;
    if (o.position.distanceToSquared(foto.get(o)) > 0.01) return false;          // se movió: es un aldeano o un animal
    return true;
  }
  function ocultar(c, esc) {
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
    c.slots.forEach(function (s) { quitarPirata(s); });
    piratas.forEach(function (p) { esc.remove(p.g); }); piratas = [];
    version++;
  }
  // ---------- cada parcela con edificio: su versión pirata (mismo sitio, mismo toque; la medieval queda escondida) ----------
  var yawCara = null, version = 0, lucesEdif = [];
  function quitarPirata(s) { if (s.tkc) { s.grupo.remove(s.tkc); s.tkc.traverse(function (m) { if (m.isMesh && m.geometry && m.geometry !== GEO.box) m.geometry.dispose(); }); s.tkc = null; } if (s.modelo) s.modelo.visible = true; s.tkcClave = null; }
  var bbM = new T3.Box3(), bbP = new T3.Box3(), vT = new T3.Vector3(), vT2 = new T3.Vector3();
  function sincronizarParcelas(c) {
    var cambio = false;
    c.slots.forEach(function (s) {
      var quiere = s.edificio && !s.campo && s.modelo && TIPOS_OK(s.edificio.tipo);
      var clave = quiere ? s.edificio.tipo + ':' + s.edificio.nivel + ':' + s.modelo.uuid : null;
      if (clave === s.tkcClave) { if (s.tkc && s.modelo && s.modelo.visible) s.modelo.visible = false; return; }
      quitarPirata(s); cambio = true; if (!quiere) return;
      s.modelo.visible = true; s.modelo.updateMatrixWorld(true); bbM.setFromObject(s.modelo); if (bbM.isEmpty()) return;
      var p = edificioPirata(s.edificio.tipo, s.edificio.nivel); p.updateMatrixWorld(true); bbP.setFromObject(p);
      var tM = bbM.getSize(vT), tP = bbP.getSize(vT2), e = Math.max(0.55, Math.min(2.2, Math.max(tM.x, tM.z) / Math.max(tP.x, tP.z) * 0.98));
      p.scale.setScalar(e);
      var cen = bbM.getCenter(new T3.Vector3()); cen.y = bbM.min.y;
      s.grupo.updateMatrixWorld(true); var loc = s.grupo.worldToLocal(cen.clone()); p.position.copy(loc);
      var gq = new T3.Quaternion(); s.grupo.getWorldQuaternion(gq); var gyaw = new T3.Euler().setFromQuaternion(gq, 'YXZ').y; p.rotation.y = yawCara - gyaw;
      s.modelo.visible = false; s.grupo.add(p); s.tkc = p; s.tkcClave = clave;
      p.updateMatrixWorld(true); p.userData.lucesMundo = (p.userData.luces || []).map(function (q) { var w = p.localToWorld(new T3.Vector3(q.x, q.y, q.z)); return { x: w.x, y: w.y, z: w.z, faro: q.faro }; });
    });
    if (cambio) { lucesEdif = []; c.slots.forEach(function (s) { if (s.tkc) lucesEdif = lucesEdif.concat(s.tkc.userData.lucesMundo || []); }); version++; }
  }
  function TIPOS_OK(t) { return t !== 'granja' && t !== 'aserradero' && t !== 'mina' && t !== 'cantera'; }
  // ---------- fortaleza: se rehace si sube el castillo ----------
  function revisarFortaleza(c) {
    var nv = (window.__juego && __juego.estado && __juego.estado().castillo) || 1;
    if (ISL.fort && ISL.nvFort === nv) return;
    if (ISL.fort) { ISL.raizL.remove(ISL.fort); }
    LUCES.length = 0; ISL.fort = fortaleza(nv); ISL.nvFort = nv; ISL.lucesFort = LUCES.slice(); LUCES.length = 0;
    var ca = c.castillo(), atras = 0; if (ca) { var b = new T3.Box3().setFromObject(ca); if (!b.isEmpty()) { var cc = b.getCenter(new T3.Vector3()), l = c.aLocal(cc.x, cc.z); ISL.fort.position.set(l.a, 0, l.b); } }
    ISL.raizL.add(ISL.fort); version++;
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
    var l = []; for (var i = 0; i < n; i++) l.push({ a: Math.random() * 6.28, r: 10 + Math.random() * 30, y: 7 + Math.random() * 9, v: (0.18 + Math.random() * 0.15) * (i % 2 ? 1 : -1), c: [ISLA.frente + 8 + Math.random() * 25, (Math.random() - 0.5) * 50] });
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
      n.th += n.v * dt; var ca = ISLA.frente + 40, ra = 14, rb = 75, x = ca + Math.cos(n.th) * ra, z = Math.sin(n.th) * rb, dx = -Math.sin(n.th) * ra, dz = Math.cos(n.th) * rb;
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
  var cOjo = new T3.Color(), cOjoDia = new T3.Color(0x1a0c06), cOjoNoche = new T3.Color(1.6, 0.55, 0.12), cFarolNoche = new T3.Color(1.5, 0.95, 0.4), cFarolDia = new T3.Color(0x3a2a14);
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
    var k = c.noche(); U.noche.value = k; U.viento.value = 1 + Math.sin(tiempo * 0.21) * 0.25;
    if (MAT.ojos) { MAT.ojos.color.copy(cOjoDia).lerp(cOjoNoche, Math.min(1, k * 1.2)); MAT.farol.color.copy(cFarolDia).lerp(cFarolNoche, Math.min(1, k * 1.2)); }
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
    forzar: function (v) { FORZAR = v === undefined ? true : v === null ? null : !!v; },
    estado: function () { var c = C(); return { activa: activa, villa: c ? c.villa() : null, ocultos: ocultos.length, edificios: c ? c.slots.filter(function (s) { return s.tkc; }).length : 0, luces: activa ? antorchas().length : 0, piratas: piratas.length, barcos: ISL ? ISL.navegan.length + ISL.amarrados.length : 0, fortaleza: ISL ? ISL.nvFort : 0 }; }
  };
})();
