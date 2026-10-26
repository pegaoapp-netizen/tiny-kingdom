// =====================================================================
//  JUEGO PRINCIPAL: escena, cámara, reglas, oleadas, interfaz.
// =====================================================================
(function () {
  'use strict';

  var V3 = THREE.Vector3;
  var $ = function (id) { return document.getElementById(id); };
  var CLAVE_GUARDADO = 'tinykingdom_v1';

  // ------------------------------------------------------------------
  //  ESTADO (lo que se guarda)
  // ------------------------------------------------------------------
  var estado = nuevoEstado();
  function nuevoEstado() {
    return {
      monedas: INICIO.monedas, gemas: INICIO.gemas, comida: INICIO.comida, madera: INICIO.madera, piedra: INICIO.piedra, oleada: 1, vidaCastillo: INICIO.vidaCastillo,
      edificios: TERRENOS.map(function () { return null; }),
      tropas: {}, heroe: false, infinito: false, heridos: {}, muralla: 0, barricadas: [], alianza: null, armadura: {}, mochila: {}, diario: { ultimo: '', racha: 0 }, invest: {}, investigando: null, escudoHasta: 0, cdAtaque: {},
      idioma: 'es',
      sonido: true, dueno: false, correo: '', oroInfinito: false, gemasInfinitas: false, actualizado: 0
    };
  }
  function guardar(ya) {
    try {
      estado.edificios = slots.map(function (s) { return s.edificio ? { tipo: s.edificio.tipo, nivel: s.edificio.nivel } : (s.obra && s.obra.nivel === 1 ? null : null); });
      // si algo se estaba construyendo, lo guardamos ya terminado
      slots.forEach(function (s, i) { if (s.obra) estado.edificios[i] = { tipo: s.obra.tipo, nivel: s.obra.nivel }; });
      var t = {};
      var inv = {};
      tropas.forEach(function (u) { if (u.tipo === 'heroe') return; if (u.invocada) inv[u.tipo] = (inv[u.tipo] || 0) + 1; else t[u.tipo] = (t[u.tipo] || 0) + 1; });
      estado.invocadas = inv;
      colaEntreno.forEach(function (c) { t[c.tipo] = (t[c.tipo] || 0) + 1; });
      estado.tropas = t;
      estado.heroe = tropas.some(function (u) { return u.tipo === 'heroe'; });
      estado.barricadas = barricadas.map(function (b) { return b.nivel; });
      estado.actualizado = Date.now();
    } catch (e) {}
    var copia = JSON.parse(JSON.stringify(estado));
    if (obraMuralla) copia.muralla = obraMuralla.nivel;
    try { localStorage.setItem(claveLocal(), JSON.stringify(copia)); } catch (e) { /* sin almacenamiento: se juega igual */ }
    // copia en la nube si hay cuenta
    try { if (window.Cuentas && Cuentas.usuario()) Cuentas.guardarPartida(copia, ya); } catch (e) {}
  }
  // Cada cuenta tiene su propia copia en este aparato; el invitado usa la clave base.
  function claveLocal() {
    var u = window.Cuentas && Cuentas.usuario();
    return CLAVE_GUARDADO + (u ? '_' + u.uid : '');
  }
  var CLAVE_PREF = 'tinykingdom_pref';
  function leerPref() { try { return JSON.parse(localStorage.getItem(CLAVE_PREF)) || {}; } catch (e) { return {}; } }
  function cargar() {
    try {
      var s = localStorage.getItem(claveLocal());
      if (!s) return null;
      var o = JSON.parse(s);
      return o && typeof o.monedas === 'number' ? o : null;
    } catch (e) { return null; }
  }
  // El idioma y el sonido se recuerdan aunque no haya partida
  (function () { var p = leerPref(); estado.idioma = p.idioma || 'es'; estado.sonido = p.sonido !== false; })();

  function T(k, vars) {
    var s = (TEXTOS[estado.idioma] || TEXTOS.es)[k] || TEXTOS.es[k] || k;
    if (vars) for (var v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  }
  function N(k) { return NOMBRES[k][estado.idioma] || NOMBRES[k].es; }
  function D(k) { return NOMBRES[k]['des_' + estado.idioma] || NOMBRES[k].des_es || ''; }

  // ------------------------------------------------------------------
  //  ESCENA
  // ------------------------------------------------------------------
  var render;
  try { render = new THREE.WebGLRenderer({ antialias: true }); }
  catch (e) {
    // Sin 3D: explicamos cómo arreglarlo
    window.__juegoListo = true;
    document.getElementById('pantalla-texto').innerHTML = '<b style="color:#b3261e">Tu navegador tiene el 3D (WebGL) apagado.</b><br>' +
      'Abre el juego en Chrome o Edge y activa: Configuración → Sistema → “Usar aceleración de gráficos cuando esté disponible”, y reinicia el navegador.<br><br>' +
      '<small>Your browser has 3D (WebGL) turned off. Turn on hardware acceleration and restart the browser.</small>';
    throw e;
  }
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  render.setSize(window.innerWidth, window.innerHeight);
  render.shadowMap.enabled = true;
  render.shadowMap.type = THREE.PCFSoftShadowMap;
  $('juego').appendChild(render.domElement);

  var escena = new THREE.Scene();
  escena.background = new THREE.Color(0x9fd8ff);
  escena.fog = new THREE.Fog(0x9fd8ff, 85, 180);

  var camara = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.5, 400);
  // Cámara inicial: se ve el castillo entero con sus alrededores (más lejos en teléfono vertical)
  function distInicial() { return window.innerWidth < window.innerHeight ? 62 : 46; }
  var CENTRO_REINO = new V3(-5, 0, -2);
  var cam = { objetivo: CENTRO_REINO.clone(), dist: distInicial(), distMeta: distInicial(), az: 0.52, polar: 1.0 };

  var hemi = new THREE.HemisphereLight(0xdff2ff, 0x6a8a4a, 0.55);
  escena.add(hemi);
  var sol = new THREE.DirectionalLight(0xffe2b8, 0.85);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  var sc = sol.shadow.camera;
  sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 160;
  sol.shadow.bias = -0.0008;
  sol.shadow.normalBias = 0.03;
  escena.add(sol);
  escena.add(sol.target);

  // ------------------------------------------------------------------
  //  CAMINO
  // ------------------------------------------------------------------
  var curva = new THREE.CatmullRomCurve3(CAMINO.map(function (p) { return new V3(p[0], 0, p[1]); }), false, 'centripetal');
  var largoCamino = curva.getLength();
  var muestras = curva.getSpacedPoints(400);
  function distCamino(x, z) {
    var m = Infinity;
    for (var i = 0; i < muestras.length; i++) {
      var dx = muestras[i].x - x, dz = muestras[i].z - z, d = dx * dx + dz * dz;
      if (d < m) m = d;
    }
    return Math.sqrt(m);
  }
  function puntoCamino(d) {
    var u = Math.max(0, Math.min(1, d / largoCamino));
    return { p: curva.getPointAt(u), t: curva.getTangentAt(u) };
  }

  // ------------------------------------------------------------------
  //  SUELO, CAMINO, BOSQUE, AGUA, NUBES
  // ------------------------------------------------------------------
  var rnd = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(7);
  var ESTANQUE = { x: 27, z: -25, r: 5 };

  function altura(x, z) {
    var r = Math.sqrt(x * x + z * z);
    if (r < 64) return 0;
    var k = (r - 64);
    return k * 0.32 * (0.7 + 0.5 * Math.sin(x * 0.11) * Math.cos(z * 0.09)) + Math.sin(x * 0.4 + z * 0.3) * 0.3;
  }

  (function crearSuelo() {
    var g = new THREE.PlaneGeometry(320, 320, 110, 110).toNonIndexed();
    g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, colores = [];
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      var y = altura(x, z) + (rnd() - 0.5) * 0.12;
      if (Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) < ESTANQUE.r + 0.5) y -= 0.6;
      pos.setY(i, y);
    }
    for (var t = 0; t < pos.count; t += 3) {
      var cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3;
      var cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
      var c = new THREE.Color().setHSL(0.27 + rnd() * 0.05, 0.45, 0.38 + rnd() * 0.05);
      var dc = distCamino(cx, cz);
      if (dc < 3.4) c.lerp(new THREE.Color(0x9a8a4a), 0.25);
      for (var j = 0; j < 3; j++) colores.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
    g.computeVertexNormals();
    var suelo = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    suelo.receiveShadow = true;
    escena.add(suelo);
  })();

  (function crearCamino() {
    var n = 260, ancho = 1.7, verts = [], idx = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, p = curva.getPointAt(u), t = curva.getTangentAt(u);
      var perp = new V3(t.z, 0, -t.x).normalize();
      var w = ancho * (0.92 + 0.12 * Math.sin(i * 0.7));
      verts.push(p.x + perp.x * w, 0.05, p.z + perp.z * w, p.x - perp.x * w, 0.05, p.z - perp.z * w);
      if (i < n) { var a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xcf8c5e, side: THREE.DoubleSide }));
    m.receiveShadow = true;
    escena.add(m);
    // piedritas a los lados del camino
    for (var k = 0; k < 90; k++) {
      var uu = rnd(), pp = curva.getPointAt(uu), tt = curva.getTangentAt(uu);
      var lado = rnd() < 0.5 ? -1 : 1, pe = new V3(tt.z, 0, -tt.x).normalize().multiplyScalar(lado * (1.9 + rnd() * 0.4));
      var r = M.roca(0.25 + rnd() * 0.2, 0xb59a86);
      r.position.x = pp.x + pe.x; r.position.z = pp.z + pe.z;
      r.castShadow = false;
      escena.add(r);
    }
  })();

  (function crearNaturaleza() {
    var arboles = [];
    function libre(x, z, extra) {
      if (Math.hypot(x, z) < 15) return false;
      var mfx = (x - MURALLA_FORMA.cx) / MURALLA_FORMA.rx, mfz = (z - MURALLA_FORMA.cz) / MURALLA_FORMA.rz;
      if (Math.abs(Math.sqrt(mfx * mfx + mfz * mfz) - 1) < 0.1) return false;
      if (distCamino(x, z) < 3.4 + extra) return false;
      for (var i = 0; i < TERRENOS.length; i++) if (Math.hypot(x - TERRENOS[i][0], z - TERRENOS[i][1]) < 4 + extra) return false;
      if (Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) < ESTANQUE.r + 1.5) return false;
      if (Math.hypot(x - PUNTO_REUNION[0], z - PUNTO_REUNION[1]) < 6) return false;
      return true;
    }
    for (var i = 0; i < 2600 && arboles.length < 620; i++) {
      var x = (rnd() - 0.5) * 230, z = (rnd() - 0.5) * 230;
      var bosqueDensidad = Math.max(0, 1 - Math.hypot(x + 50, z + 30) / 26);
      var borde = Math.hypot(x, z) > 40 ? 0.45 : 0.04;
      if (x < -32 && z < 0) borde = 0.75;
      if (rnd() > Math.max(bosqueDensidad, borde)) continue;
      if (!libre(x, z, 0)) continue;
      var pino = rnd() < 0.62;
      arboles.push({
        x: x, z: z, s: 0.8 + rnd() * 0.7, rot: rnd() * 6, tipo: pino ? 0 : 1,
        tono: new THREE.Color().setHSL(pino ? 0.36 + rnd() * 0.04 : 0.26 + rnd() * 0.06, 0.55, pino ? 0.32 + rnd() * 0.06 : 0.42 + rnd() * 0.08).getHex()
      });
    }
    arboles.forEach(function (a) { a.y = altura(a.x, a.z); });
    escena.add(M.bosque(arboles));

    // rocas grandes y flores
    for (var r = 0; r < 40; r++) {
      var rx = (rnd() - 0.5) * 120, rz = (rnd() - 0.5) * 120;
      if (!libre(rx, rz, 0.5)) continue;
      var ro = M.roca(0.6 + rnd() * 1.4);
      ro.position.x = rx; ro.position.z = rz; ro.position.y += altura(rx, rz);
      escena.add(ro);
    }
    var colFlor = [0xffffff, 0xffe14a, 0xff7aa8, 0xb08aff];
    for (var f = 0; f < 110; f++) {
      var fx = (rnd() - 0.5) * 80, fz = (rnd() - 0.5) * 80;
      if (!libre(fx, fz, -1.5) || Math.hypot(fx, fz) < 7) continue;
      var fl = M.flor(colFlor[f % 4]);
      fl.position.set(fx, 0, fz);
      escena.add(fl);
    }
    // estanque
    var agua = new THREE.Mesh(new THREE.CircleGeometry(ESTANQUE.r + 0.3, 20),
      new THREE.MeshLambertMaterial({ color: 0x4ab8f0, transparent: true, opacity: 0.85 }));
    agua.rotation.x = -Math.PI / 2;
    agua.position.set(ESTANQUE.x, -0.15, ESTANQUE.z);
    escena.add(agua);
    for (var h = 0; h < 4; h++) {
      var hoja = M.cil(0.45, 0.45, 0.04, 8, 0x5bbf4a, ESTANQUE.x + (rnd() - 0.5) * 6, -0.1, ESTANQUE.z + (rnd() - 0.5) * 6);
      hoja.castShadow = false;
      escena.add(hoja);
    }
    for (var a2 = 0; a2 < 12; a2++) {
      var ang = a2 / 12 * Math.PI * 2, rr = M.roca(0.4 + rnd() * 0.3, 0x9a948a);
      rr.position.x = ESTANQUE.x + Math.cos(ang) * (ESTANQUE.r + 0.4);
      rr.position.z = ESTANQUE.z + Math.sin(ang) * (ESTANQUE.r + 0.4);
      escena.add(rr);
    }
  })();

  var nubes = [];
  for (var nn = 0; nn < 9; nn++) {
    var nu = M.nube();
    nu.position.set((rnd() - 0.5) * 160, 24 + rnd() * 8, (rnd() - 0.5) * 120);
    nu.userData.v = 0.6 + rnd() * 0.8;
    escena.add(nu);
    nubes.push(nu);
  }

  // ------------------------------------------------------------------
  //  CASTILLO Y TERRENOS
  // ------------------------------------------------------------------
  var castillo = M.castillo();
  castillo.userData.castillo = true;
  castillo.scale.setScalar(0.8);
  escena.add(castillo);
  var castilloPos = new V3(0, 0, 0), RADIO_CASTILLO = 4.6;
  var castilloCd = 0, impuestoCd = 0, comidaCd = 0, hambre = false;
  var murallaModelo = null, obraMuralla = null, murallaBarra = null, murallaAndamios = [], murallaRebote = 1;
  function bono(id) {
    var lv = (estado.invest && estado.invest[id]) || 0;
    for (var r in INVESTIGACION) for (var k = 0; k < INVESTIGACION[r].length; k++) if (INVESTIGACION[r][k].id === id) return lv * INVESTIGACION[r][k].cada;
    return 0;
  }
  function vidaMaxCastillo() { return INICIO.vidaCastillo + (estado.muralla ? Math.round(MURALLA.vida[estado.muralla - 1] * (1 + bono('muros'))) : 0); }
  function formaMuralla() {
    var f = MURALLA_FORMA;
    if (!f.puerta) {
      // buscamos dónde el camino entra al óvalo: ahí va la puerta
      var tPuerta = Math.PI;
      for (var i = 0; i < muestras.length; i++) {
        var q = muestras[i], ux = (q.x - f.cx) / f.rx, uz = (q.z - f.cz) / f.rz;
        if (ux * ux + uz * uz < 1) { tPuerta = Math.atan2(uz, ux); break; }
      }
      f.puerta = tPuerta; f.hueco = 0.16;
    }
    return f;
  }
  function ponerMuralla(nivel) {
    if (murallaModelo) { escena.remove(murallaModelo); murallaModelo = null; }
    if (!nivel) return;
    murallaModelo = M.muralla(nivelVisual(nivel), formaMuralla());
    murallaModelo.userData.castillo = true;
    escena.add(murallaModelo);
  }
  function construirMuralla() {
    if (obraMuralla || estado.muralla >= NIVEL_MAX) return;
    var nivel = estado.muralla + 1;
    if (!pagar(costoMuralla(nivel - 1))) return;
    obraMuralla = { nivel: nivel, t: 0, total: MURALLA.tiempo[nivel - 1] * (1 - bono('obras')) };
    murallaBarra = M.barraVida(false, 3.2);
    murallaBarra.position.set(0, 10.5, 0);
    escena.add(murallaBarra);
    M.ponerVida(murallaBarra, 0);
    // andamios alrededor mientras se construye
    var fm = formaMuralla();
    [0.6, 1.7, 2.8, 3.9, 5.0, 6.0].forEach(function (a) {
      var an = M.andamio(); an.scale.setScalar(0.8);
      an.position.set(fm.cx + Math.cos(a) * fm.rx, 0, fm.cz + Math.sin(a) * fm.rz);
      escena.add(an); murallaAndamios.push(an);
    });
    sonar('martillo');
    cerrarPanel();
    guardar();
  }
  function terminarMuralla() {
    var o = obraMuralla; obraMuralla = null;
    escena.remove(murallaBarra); murallaBarra = null;
    murallaAndamios.forEach(function (a) { escena.remove(a); }); murallaAndamios = [];
    var antes = vidaMaxCastillo();
    estado.muralla = o.nivel;
    estado.vidaCastillo = Math.min(vidaMaxCastillo(), estado.vidaCastillo + (vidaMaxCastillo() - antes));
    ponerMuralla(o.nivel);
    murallaRebote = 0;
    var fc = formaMuralla(); [0, 1.6, 3.1, 4.7].forEach(function (ta) { chispas(new V3(fc.cx + Math.cos(ta) * fc.rx, 1.5, fc.cz + Math.sin(ta) * fc.rz), 0xd8c49a, 12, 4); });
    sonar('listo');
    consejoTemporal(T('muralla_lista', { n: o.nivel }));
    actualizarHUD();
    guardar();
  }

  var slots = TERRENOS.map(function (p, i) {
    var g = new THREE.Group();
    g.position.set(p[0], 0, p[1]);
    // los edificios miran hacia el camino / el centro
    var haciaCamino = puntoMasCercano(p[0], p[1]);
    g.rotation.y = Math.atan2(haciaCamino.x - p[0], haciaCamino.z - p[1]);
    var t = M.terreno();
    g.add(t);
    g.userData.slot = i;
    escena.add(g);
    return { i: i, pos: new V3(p[0], 0, p[1]), grupo: g, terreno: t, edificio: null, obra: null, modelo: null, rebote: 1, cd: 0 };
  });
  function puntoMasCercano(x, z) {
    var best = null, m = Infinity;
    muestras.forEach(function (q) { var d = Math.hypot(q.x - x, q.z - z); if (d < m) { m = d; best = q; } });
    return best;
  }

  // ------------------------------------------------------------------
  //  BARRICADAS: puntos marcados en el camino
  // ------------------------------------------------------------------
  var barricadas = PUNTOS_BARRICADA.map(function (u, i) {
    var d = u * largoCamino, pc = puntoCamino(d);
    var g = new THREE.Group();
    g.position.copy(pc.p);
    g.rotation.y = Math.atan2(pc.t.x, pc.t.z);
    g.userData.barricada = i;
    // zona invisible para poder tocarla
    var zona = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.6, 1.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    zona.position.y = 0.8;
    g.add(zona);
    // marca en el suelo (brilla al colocar)
    var marca = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.3), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0, depthWrite: false }));
    marca.rotation.x = -Math.PI / 2; marca.position.y = 0.08;
    g.add(marca);
    escena.add(g);
    return { i: i, d: d, pos: pc.p.clone(), grupo: g, marca: marca, nivel: 0, vida: 0, max: 0, modelo: null, barra: null, fantasma: null };
  });
  function barricadaDelante(dist) {
    for (var k = 0; k < barricadas.length; k++) {
      var b = barricadas[k];
      if (b.nivel && b.vida > 0 && b.d - dist > -0.2 && b.d - dist < 1.3) return b;
    }
    return null;
  }
  function ponerBarricada(i, nivel) {
    var b = barricadas[i];
    if (b.modelo) b.grupo.remove(b.modelo);
    b.modelo = M.barricada(nivel);
    b.grupo.add(b.modelo);
    b.nivel = nivel; b.max = Math.round(BARRICADA.vida[nivel - 1] * (1 + bono('muros'))); b.vida = b.max;
    if (!b.barra) { b.barra = M.barraVida(false, 2.2); b.barra.position.set(b.pos.x, 2.4, b.pos.z); escena.add(b.barra); }
    b.barra.visible = false; M.ponerVida(b.barra, 1);
    chispas(b.pos.clone().setY(0.8), 0xd8c49a, 10, 3);
  }
  function quitarBarricada(i) {
    var b = barricadas[i];
    if (b.modelo) b.grupo.remove(b.modelo);
    if (b.barra) escena.remove(b.barra);
    if (b.fantasma) b.grupo.remove(b.fantasma);
    b.modelo = b.barra = b.fantasma = null; b.nivel = 0; b.vida = b.max = 0;
  }
  function romperBarricada(b) {
    if (b.modelo) { b.grupo.remove(b.modelo); b.modelo = null; }
    b.vida = 0; b.barra.visible = false;
    chispas(b.pos.clone().setY(0.8), 0xa9783f, 16, 4);
    flotar(T('barr_rota'), b.pos.clone().setY(2.5), 'dano');
    sonar('muerte');
  }
  function repararBarricadas() {
    barricadas.forEach(function (b, i) { if (b.nivel && (b.vida < b.max || !b.modelo)) ponerBarricada(i, b.nivel); });
  }
  function entrarModoBarricada() {
    var libres = barricadas.filter(function (b) { return !b.nivel; });
    if (!libres.length) { consejoTemporal(T('punto_ocupado')); sonar('error'); return; }
    var falta = faltante(costoBarricada(0));
    if (falta) { avisarFalta(falta); return; }
    salirModoColocar();
    modoColocar = 'barricada';
    cerrarPanel();
    $('btn-construir').classList.add('activo');
    libres.forEach(function (b) {
      var f = M.barricada(1);
      f.traverse(function (o) { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; o.material.depthWrite = false; o.castShadow = false; } });
      b.grupo.add(f); b.fantasma = f;
    });
    $('barra-colocar-txt').textContent = T('colocando_barr');
    $('barra-colocar').classList.remove('oculto');
    document.body.classList.add('colocando');
  }
  function tocarBarricada(i) {
    var b = barricadas[i];
    sonar('click');
    if (modoColocar === 'barricada') {
      if (b.nivel) { consejoTemporal(T('punto_ocupado')); sonar('error'); return; }
      if (!pagar(costoBarricada(0))) return;
      salirModoColocar();
      ponerBarricada(i, 1);
      sonar('listo');
      guardar();
      return;
    }
    if (modoColocar) { consejoTemporal(T('colocando', { n: N(modoColocar) })); sonar('error'); return; }
    if (b.nivel) abrirPanelBarricada(i); else entrarModoBarricada();
  }

  // ------------------------------------------------------------------
  //  MAPA DEL MUNDO
  // ------------------------------------------------------------------
  var ultimaPublicacion = 0, aldeasCache = [];
  function hayCuenta() { return !!(window.Cuentas && Cuentas.disponible() && Cuentas.usuario()); }
  function publicarAldea(forzar) {
    if (!hayCuenta()) return;
    var ahora = Date.now();
    if (!forzar && ahora - ultimaPublicacion < 60000) return;
    ultimaPublicacion = ahora;
    var l = Cuentas.lugar();
    Cuentas.publicarAldea({ nombre: Cuentas.nombrePublico(), nivel: Math.max(1, estado.oleada), poder: Math.round(calcularPoder()), x: l.x, y: l.y, alianza: estado.alianza || null, escudo: estado.escudoHasta || 0, defensa: defensaReino() })
      .catch(function () {
        // si la alianza ya no existe, la quitamos y probamos otra vez
        // solo si la alianza de verdad ya no existe, la quitamos y probamos otra vez
        if (estado.alianza) Cuentas.alianza(estado.alianza).then(function (al) {
          if (al) return;
          estado.alianza = null; guardar();
          Cuentas.publicarAldea({ nombre: Cuentas.nombrePublico(), nivel: Math.max(1, estado.oleada), poder: Math.round(calcularPoder()), x: l.x, y: l.y, alianza: null, escudo: estado.escudoHasta || 0 }).catch(function () {});
        }).catch(function () {});
      });
  }
  var fondoMundoListo = false;
  function dibujarFondoMundo() {
    if (fondoMundoListo) return;
    fondoMundoListo = true;
    var c = $('mundo-fondo'), x = c.getContext('2d'), W = c.width;
    var semilla = 11; function azar() { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; }
    x.fillStyle = '#5aa83c'; x.fillRect(0, 0, W, W);
    for (var i = 0; i < 900; i++) { x.fillStyle = ['#4f9a34', '#64b244', '#58a33a', '#6cbb4a'][i % 4]; var px = azar() * W, py = azar() * W, r = 6 + azar() * 22; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); }
    // río
    x.strokeStyle = '#4ab8f0'; x.lineWidth = 16; x.lineCap = 'round'; x.beginPath(); x.moveTo(-10, W * 0.32);
    for (var k = 0; k <= 10; k++) x.lineTo(k * W / 10, W * 0.32 + Math.sin(k * 0.9) * 40 + k * 18);
    x.stroke(); x.strokeStyle = '#8fd8ff'; x.lineWidth = 4; x.stroke();
    // caminos
    x.strokeStyle = 'rgba(217, 160, 110, .8)'; x.lineWidth = 6; x.setLineDash([10, 8]);
    x.beginPath(); x.moveTo(W * 0.1, W * 0.9); x.quadraticCurveTo(W * 0.5, W * 0.5, W * 0.9, W * 0.1); x.stroke();
    x.beginPath(); x.moveTo(W * 0.05, W * 0.25); x.quadraticCurveTo(W * 0.45, W * 0.6, W * 0.95, W * 0.75); x.stroke();
    x.setLineDash([]);
    // bosques y montañas
    x.font = '22px serif'; x.textAlign = 'center';
    for (var t = 0; t < 120; t++) x.fillText(azar() < 0.8 ? '🌲' : '🌳', azar() * W, azar() * W);
    x.font = '30px serif';
    for (var m = 0; m < 14; m++) x.fillText('⛰️', azar() * W, azar() * W);
    // marco antiguo
    x.strokeStyle = 'rgba(60, 40, 20, .5)'; x.lineWidth = 10; x.strokeRect(0, 0, W, W);
  }
  function abrirMundo() {
    dibujarFondoMundo();
    $('mundo').classList.remove('oculto');
    enMundo = true;
    $('mundo-info').innerHTML = '';
    $('mundo-leyenda').innerHTML = '<span>👑 ' + T('leyenda_tu') + '</span><span>🛡️ ' + T('leyenda_alianza') + '</span><span>🏰 ' + T('leyenda_otros') + '</span><span>⛺ ' + T('leyenda_trasgos') + '</span>';
    pintarAldeas([]);
    if (!hayCuenta()) {
      $('mundo-estado').textContent = T('mundo_cuenta');
      $('mundo-info').innerHTML = '<div class="carta"><button class="comprar naranja" id="mundo-ir-cuenta">' + T('entrar_o_crear') + '</button></div>';
      $('mundo-ir-cuenta').addEventListener('click', function () { cerrarMundo(); guardar(); modoInvitado = false; guardarPreferencias(true); pantallaInicio(); });
      return;
    }
    $('mundo-estado').textContent = T('mundo_cargando');
    publicarAldea(true);
    setTimeout(function () {
      Cuentas.aldeas().then(function (lista) {
        aldeasCache = lista;
        var otros = lista.filter(function (a) { return a.uid !== Cuentas.usuario().uid; }).length;
        $('mundo-estado').textContent = otros ? T('reinos_en_mapa', { n: lista.length }) : T('mundo_solo');
        pintarAldeas(lista);
      }).catch(function () { $('mundo-estado').textContent = T('mundo_error'); });
    }, 400);
  }
  function cerrarMundo() { $('mundo').classList.add('oculto'); enMundo = false; }
  var enMundo = false;
  function pintarAldeas(lista) {
    var cont = $('mundo-aldeas'), h = '';
    var yo = hayCuenta() ? Cuentas.usuario().uid : null;
    var miLugar = yo ? Cuentas.lugar() : null;
    var hayYo = lista.some(function (a) { return a.uid === yo; });
    if (yo && !hayYo) lista = lista.concat([{ uid: yo, nombre: Cuentas.nombrePublico(), nivel: estado.oleada, poder: Math.round(calcularPoder()), x: miLugar.x, y: miLugar.y, alianza: estado.alianza || null, escudo: estado.escudoHasta || 0 }]);
    CAMPAMENTOS.forEach(function (c, i) {
      h += '<button class="aldea trasgo" data-campamento="' + i + '" style="left:' + c.x + '%;top:' + c.y + '%"><span class="ic">⛺</span><span class="nom">' + T('leyenda_trasgos') + '</span><span class="niv">' + c.nivel + '</span></button>';
    });
    lista.forEach(function (a, i) {
      var cls = a.uid === yo ? 'yo' : (estado.alianza && a.alianza === estado.alianza ? 'aliada' : '');
      var ic = a.uid === yo ? '👑' : cls === 'aliada' ? '🛡️' : '🏰';
      h += '<button class="aldea ' + cls + '" data-aldea="' + i + '" style="left:' + a.x + '%;top:' + a.y + '%">' + ((a.escudo || 0) > Date.now() ? '<span class="esc">🛡️</span>' : '') + '<span class="ic">' + ic + '</span><span class="nom">' +
        (a.alianza ? '[' + escaparHTML(a.alianza) + '] ' : '') + escaparHTML(a.nombre) + '</span><span class="niv">' + a.nivel + '</span></button>';
    });
    cont.innerHTML = h;
    cont.querySelectorAll('.aldea').forEach(function (el) {
      el.addEventListener('click', function () {
        sonar('click');
        cont.querySelectorAll('.aldea').forEach(function (o) { o.classList.remove('sel'); });
        el.classList.add('sel');
        if (el.dataset.campamento !== undefined) {
          var c = CAMPAMENTOS[+el.dataset.campamento];
          $('mundo-info').innerHTML = '<div class="carta"><h3>⛺ ' + T('campamento') + ' — ' + T('nivel') + ' ' + c.nivel + '</h3><p>' + T('campamento_txt') + '</p></div>';
          return;
        }
        var a = lista[+el.dataset.aldea];
        $('mundo-info').innerHTML = '<div class="carta"><h3>' + (a.uid === yo ? '👑 ' + T('tu_reino') : '🏰 ' + T('reino_de', { n: escaparHTML(a.nombre) })) + '</h3>' +
          '<div class="stats"><span>⭐ ' + T('nivel') + ' ' + a.nivel + '</span><span>💪 ' + T('poder') + ' ' + formatoNumero(a.poder) + '</span>' +
          '<span>🛡️ ' + (a.alianza ? '[' + escaparHTML(a.alianza) + ']' : T('sin_alianza')) + '</span><span>📍 ' + a.x + ', ' + a.y + '</span>' +
          ((a.escudo || 0) > Date.now() ? '<span>' + T('protegido_falta', { t: fmtTiempo((a.escudo - Date.now()) / 1000) }) + '</span>' : '') +
          (a.defensa ? '<span>🏰 ' + T('defensa_txt') + ' ~' + formatoNumero(Math.round(a.defensa / 100) * 100) + '</span>' : '') + '</div>' +
          (a.uid !== yo ? '<button class="comprar rojo boton-oleada-grande" id="btn-atacar">' + T('atacar') + '</button>' : '') + '</div>';
        var ba = $('btn-atacar'); if (ba) ba.addEventListener('click', function () { sonar('click'); abrirAtaque(a); });
      });
    });
  }

  // ------------------------------------------------------------------
  //  ALIANZAS
  // ------------------------------------------------------------------
  function abrirPanelAlianza() {
    if (!hayCuenta()) {
      abrirPanel(T('p_alianza'), '<div class="carta"><p>' + T('mundo_cuenta') + '</p><button class="comprar naranja" data-accion="ir-cuenta">' + T('entrar_o_crear') + '</button></div>', { tipo: 'alianza' });
      return;
    }
    abrirPanel(T('p_alianza'), '<p class="nota">' + T('cargando') + '</p>', { tipo: 'alianza' });
    var pedido = Date.now(); abrirPanelAlianza.pedido = pedido;
    var tag = estado.alianza;
    (tag ? Cuentas.alianza(tag) : Promise.resolve(null)).then(function (al) {
      if (abrirPanelAlianza.pedido !== pedido || !panelActual || panelActual.tipo !== 'alianza') return;
      if (tag && !al) { estado.alianza = null; guardar(); publicarAldea(true); consejoTemporal(T('al_borrada')); }
      if (al) return Cuentas.miembros(tag).then(function (m) { pintarMiAlianza(al, m); });
      return Cuentas.alianzas().then(function (lista) { pintarListaAlianzas(lista); });
    }).catch(function () { if (panelActual && panelActual.tipo === 'alianza') $('panel-cuerpo').innerHTML = '<p class="nota aviso-rojo">' + T('mundo_error') + '</p>'; });
  }
  function pintarMiAlianza(al, miembros) {
    miembros.sort(function (a, b) { return b.poder - a.poder; });
    var h = '<div class="carta"><h3><span class="etiqueta-al">' + escaparHTML(al.tag) + '</span>' + escaparHTML(al.nombre) + '</h3>' +
      '<p>👑 ' + T('al_lider') + ': ' + escaparHTML(al.liderNombre) + '</p>' +
      '<p class="nota"><b>' + T('al_miembros', { n: miembros.length }) + '</b></p>';
    miembros.forEach(function (m) {
      h += '<div class="fila-miembro">' + (m.uid === al.lider ? '👑' : '🛡️') + '<b>' + escaparHTML(m.nombre) + '</b><span class="chip">⭐ ' + m.nivel + '</span><span class="chip">💪 ' + formatoNumero(m.poder) + '</span></div>';
    });
    h += '<div class="stats" style="margin-top:10px"><button class="comprar" data-accion="al-mapa">🗺️ ' + T('al_ver_mapa') + '</button>' +
      '<button class="comprar rojo" data-accion="al-salir" data-lider="' + (al.lider === Cuentas.usuario().uid ? 1 : 0) + '">' + T('al_salir') + '</button></div></div>';
    $('panel-cuerpo').innerHTML = h;
  }
  function pintarListaAlianzas(lista) {
    var h = '<div class="carta"><h3>🛡️ ' + T('al_crear') + '</h3>' +
      '<input class="campo" id="al-nombre" maxlength="24" placeholder="' + T('al_nombre') + '" style="margin-top:6px">' +
      '<input class="campo" id="al-tag" maxlength="4" placeholder="' + T('al_tag') + '" style="margin-top:6px;text-transform:uppercase">' +
      '<p class="nota aviso-rojo" id="al-error"></p><button class="comprar naranja" data-accion="al-crear">' + T('al_crear_btn') + '</button></div>' +
      '<div class="carta" style="margin-top:10px"><h3>' + T('al_lista') + '</h3>';
    if (!lista.length) h += '<p>' + T('al_ninguna') + '</p>';
    lista.forEach(function (al) {
      h += '<div class="fila-miembro"><span class="etiqueta-al">' + escaparHTML(al.tag) + '</span><b>' + escaparHTML(al.nombre) + '</b><span class="chip">👑 ' + escaparHTML(al.liderNombre) + '</span>' +
        '<button class="comprar" data-accion="al-unirse" data-tag="' + escaparHTML(al.tag) + '">' + T('al_unirse') + '</button></div>';
    });
    $('panel-cuerpo').innerHTML = h + '</div>';
  }
  function crearAlianzaDesdePanel(b) {
    var nombre = $('al-nombre').value.trim(), tag = $('al-tag').value.trim().toUpperCase();
    var err = function (k) { $('al-error').textContent = T(k); sonar('error'); };
    if (nombre.length < 3 || nombre.length > 24) return err('al_nombre_mal');
    if (!/^[A-Z0-9]{2,4}$/.test(tag)) return err('al_tag_mal');
    b.disabled = true;
    Cuentas.crearAlianza(nombre, tag).then(function () {
      estado.alianza = tag; guardar(true);
      publicarAldea(true);
      consejoTemporal(T('al_creada', { t: tag })); sonar('listo');
      setTimeout(abrirPanelAlianza, 600);
    }).catch(function () { b.disabled = false; err('al_existe'); });
  }
  function unirseAlianza(tag, b) {
    b.disabled = true;
    Cuentas.alianza(tag).then(function (al) {
      if (!al) { consejoTemporal(T('al_borrada')); abrirPanelAlianza(); return; }
      estado.alianza = tag; guardar(true);
      publicarAldea(true);
      consejoTemporal(T('al_unido', { t: tag })); sonar('listo');
      setTimeout(abrirPanelAlianza, 600);
    }).catch(function () { b.disabled = false; sonar('error'); });
  }
  function salirAlianza(b) {
    var lider = b.getAttribute('data-lider') === '1';
    if (!window.confirm(T(lider ? 'al_lider_sale' : 'al_salir_ok'))) return;
    var tag = estado.alianza;
    estado.alianza = null; guardar(true);
    publicarAldea(true);
    (lider ? Cuentas.borrarAlianza(tag).catch(function () {}) : Promise.resolve()).then(function () {
      consejoTemporal(T('al_salido'));
      setTimeout(abrirPanelAlianza, 400);
    });
  }

  // ------------------------------------------------------------------
  //  ALDEANOS: caminan por el pueblo para que el reino tenga vida
  // ------------------------------------------------------------------
  var aldeanos = [];
  function puntoPueblo() {
    for (var k = 0; k < 30; k++) {
      var a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 9;
      var x = Math.cos(a) * r + 1, z = Math.sin(a) * r;
      if (distCamino(x, z) > 2.6) return new V3(x, 0, z);
    }
    return new V3(6, 0, 6);
  }
  for (var al = 0; al < 6; al++) {
    var ma = M.unidad('aldeano'), pa = puntoPueblo();
    ma.grupo.position.copy(pa);
    escena.add(ma.grupo);
    aldeanos.push({ m: ma, meta: puntoPueblo(), espera: Math.random() * 3, vel: 1.2 + Math.random() * 0.6 });
  }
  function moverAldeanos(dt, t) {
    aldeanos.forEach(function (a, i) {
      var g = a.m.grupo, camina = false;
      if (a.espera > 0) a.espera -= dt;
      else {
        var dx = a.meta.x - g.position.x, dz = a.meta.z - g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.2) { a.meta = puntoPueblo(); a.espera = 1 + Math.random() * 4; }
        else {
          var paso = Math.min(d, a.vel * dt);
          g.position.x += dx / d * paso; g.position.z += dz / d * paso;
          g.rotation.y = Math.atan2(dx, dz);
          camina = true;
          var rc = Math.hypot(g.position.x, g.position.z);
          if (rc < 5.2) { g.position.x *= 5.2 / rc; g.position.z *= 5.2 / rc; }
        }
      }
      M.animarUnidad(a.m, t + i * 3, camina, 0);
    });
  }

  // ------------------------------------------------------------------
  //  LISTAS DE COSAS VIVAS
  // ------------------------------------------------------------------
  var tropas = [], enemigos = [], flechas = [], muriendo = [], particulas = [];
  var colaEntreno = [];
  var oleadaActiva = false, colaSpawn = [], spawnCd = 0, oleadaActual = 0;
  var tiempo = 0, velocidad = 1, enMenu = true;

  // ------------------------------------------------------------------
  //  SONIDO (sintetizado, original)
  // ------------------------------------------------------------------
  var audio = null, ultimoSonido = {};
  function tono(f1, f2, dur, tipo, vol, retraso) {
    var t0 = audio.currentTime + (retraso || 0);
    var o = audio.createOscillator(), g = audio.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f1, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(audio.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sonar(cual) {
    if (!estado.sonido) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var ahora = performance.now();
      if (ultimoSonido[cual] && ahora - ultimoSonido[cual] < 70) return;
      ultimoSonido[cual] = ahora;
      switch (cual) {
        case 'click': tono(600, 900, 0.06, 'square', 0.05); break;
        case 'moneda': tono(988, 0, 0.07, 'triangle', 0.08); tono(1319, 0, 0.12, 'triangle', 0.08, 0.06); break;
        case 'martillo': tono(220, 120, 0.07, 'square', 0.06); tono(220, 120, 0.07, 'square', 0.06, 0.15); break;
        case 'listo': [523, 659, 784, 1047].forEach(function (f, i) { tono(f, 0, 0.14, 'triangle', 0.09, i * 0.08); }); break;
        case 'golpe': tono(190, 70, 0.09, 'sawtooth', 0.07); break;
        case 'flecha': tono(1400, 500, 0.09, 'triangle', 0.035); break;
        case 'muerte': tono(320, 60, 0.25, 'square', 0.05); break;
        case 'cuerno': tono(196, 0, 0.7, 'sawtooth', 0.07); tono(294, 0, 0.7, 'sawtooth', 0.05, 0.05); break;
        case 'victoria': [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tono(f, 0, 0.2, 'triangle', 0.1, i * 0.13); }); break;
        case 'derrota': [392, 330, 262, 196].forEach(function (f, i) { tono(f, 0, 0.3, 'triangle', 0.1, i * 0.22); }); break;
        case 'error': tono(220, 150, 0.15, 'square', 0.06); break;
        case 'entrenado': tono(660, 0, 0.08, 'triangle', 0.08); tono(990, 0, 0.12, 'triangle', 0.08, 0.07); break;
        case 'magia': [784, 988, 1175, 1568].forEach(function (f, i) { tono(f, f * 1.5, 0.18, 'sine', 0.07, i * 0.06); }); break;
        case 'gemas': tono(1568, 0, 0.1, 'sine', 0.08); tono(2093, 0, 0.18, 'sine', 0.08, 0.08); break;
      }
    } catch (e) { /* sin audio */ }
  }

  // ------------------------------------------------------------------
  //  TEXTOS FLOTANTES Y PARTÍCULAS
  // ------------------------------------------------------------------
  var vtmp = new V3();
  function flotar(texto, pos3, clase) {
    vtmp.copy(pos3).project(camara);
    if (vtmp.z > 1) return;
    var d = document.createElement('div');
    d.className = 'flota ' + (clase || '');
    d.textContent = texto;
    d.style.left = ((vtmp.x + 1) / 2 * window.innerWidth) + 'px';
    d.style.top = ((1 - vtmp.y) / 2 * window.innerHeight) + 'px';
    $('flotantes').appendChild(d);
    setTimeout(function () { d.remove(); }, 1150);
  }
  var geoParticula = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  function chispas(pos, color, n, fuerza) {
    for (var i = 0; i < n; i++) {
      var m = new THREE.Mesh(geoParticula, M.mat(color));
      m.position.copy(pos);
      var v = new V3((Math.random() - 0.5) * 2, Math.random() * 1.5 + 0.5, (Math.random() - 0.5) * 2).multiplyScalar(fuerza || 3);
      escena.add(m);
      particulas.push({ m: m, v: v, vida: 0.6 + Math.random() * 0.4 });
    }
  }

  // ------------------------------------------------------------------
  //  RECURSOS
  // ------------------------------------------------------------------
  function sumarMonedas(n, pos) {
    estado.monedas += n;
    if (pos) flotar('+' + n, pos, 'oro');
    pulso('pill-monedas');
    actualizarHUD();
  }
  function sumarGemas(n, pos) {
    estado.gemas += n;
    if (pos) flotar('+' + n + ' 💎', pos, 'gema');
    pulso('pill-gemas');
    actualizarHUD();
  }
  function pulso(id) { var e = $(id); e.classList.remove('pulso'); void e.offsetWidth; e.classList.add('pulso'); }
  // Un costo puede ser un número (oro) o un objeto { oro, comida, madera, piedra, gemas }
  function aCosto(m, g) { return (m && typeof m === 'object') ? m : { oro: m || 0, gemas: g || 0 }; }
  function claveRecurso(r) { return r === 'oro' ? 'monedas' : r; }
  function cantidad(r) { return estado[claveRecurso(r)] || 0; }
  function faltante(m, g) {
    var c = aCosto(m, g);
    for (var i = 0; i < RECURSOS.length; i++) { var r = RECURSOS[i]; if (c[r] && !estado.oroInfinito && cantidad(r) < c[r]) return r; }
    if (c.gemas && !estado.gemasInfinitas && estado.gemas < c.gemas) return 'gemas';
    return null;
  }
  function puedePagar(m, g) { return !faltante(m, g); }
  function avisarFalta(r) {
    consejoTemporal(T('falta', { r: T('r_' + r) }));
    sonar('error');
    var p = $('pill-' + (r === 'oro' ? 'monedas' : r));
    if (p) { p.classList.remove('falta'); void p.offsetWidth; p.classList.add('falta'); }
  }
  function pagar(m, g) {
    var c = aCosto(m, g), r = faltante(c);
    if (r) { avisarFalta(r); return false; }
    if (!estado.oroInfinito) RECURSOS.forEach(function (k) { if (c[k]) estado[claveRecurso(k)] -= c[k]; });
    if (!estado.gemasInfinitas && c.gemas) estado.gemas -= c.gemas;
    actualizarHUD();
    return true;
  }
  function sumarRecurso(r, n, pos) {
    estado[claveRecurso(r)] = cantidad(r) + n;
    if (pos) flotar('+' + n + ' ' + ICONO_RECURSO[r], pos, r === 'oro' ? 'oro' : '');
    pulso('pill-' + (r === 'oro' ? 'monedas' : r));
    actualizarHUD();
  }
  function costoEdif(tipo, i) { var d = EDIFICIOS[tipo]; return { oro: d.costo[i], madera: d.madera ? d.madera[i] : 0, piedra: d.piedra ? d.piedra[i] : 0 }; }
  function costoMuralla(i) { return { oro: MURALLA.costo[i], madera: MURALLA.madera[i], piedra: MURALLA.piedra[i] }; }
  function costoBarricada(i) { return { oro: BARRICADA.costo[i], madera: BARRICADA.madera[i], piedra: BARRICADA.piedra[i] }; }
  function costoTropa(tipo) { var d = TROPAS[tipo]; return { oro: d.costo, comida: d.comida || 0 }; }
  function pagarViejo(monedas, gemas) {
    if (monedas && !estado.oroInfinito && estado.monedas < monedas) { consejoTemporal(T('sin_monedas')); sonar('error'); return false; }
    if (gemas && !estado.gemasInfinitas && estado.gemas < gemas) { consejoTemporal(T('sin_gemas')); sonar('error'); return false; }
    if (!estado.oroInfinito) estado.monedas -= monedas || 0;
    if (!estado.gemasInfinitas) estado.gemas -= gemas || 0;
    actualizarHUD();
    return true;
  }

  // ------------------------------------------------------------------
  //  EDIFICIOS
  // ------------------------------------------------------------------
  var ESCALA_EDIFICIO = 1.3;
  function crearModelo(tipo, nivel) { return tipo === 'granja' ? M.granja(nivel) : tipo === 'cuartel' ? M.cuartel(nivel) : tipo === 'enfermeria' ? M.enfermeria(nivel) : tipo === 'aserradero' ? M.aserradero(nivel) : tipo === 'mina' ? M.mina(nivel) : tipo === 'academia' ? M.academia(nivel) : M.torre(nivel); }

  function construir(i, tipo) {
    var s = slots[i];
    if (s.edificio || s.obra) return;
    var d = EDIFICIOS[tipo];
    if (!pagar(costoEdif(tipo, 0))) return;
    empezarObra(s, tipo, 1);
    sonar('martillo');
    salirModoColocar();
    cerrarPanel();
    guardar();
  }
  function mejorar(i) {
    var s = slots[i];
    if (!s.edificio || s.obra) return;
    var d = EDIFICIOS[s.edificio.tipo], n = s.edificio.nivel;
    if (n >= NIVEL_MAX) return;
    if (!pagar(costoEdif(s.edificio.tipo, n))) return;
    empezarObra(s, s.edificio.tipo, n + 1);
    sonar('martillo');
    cerrarPanel();
    guardar();
  }
  function empezarObra(s, tipo, nivel) {
    var d = EDIFICIOS[tipo];
    s.obra = { tipo: tipo, nivel: nivel, t: 0, total: d.tiempo[nivel - 1] * (1 - bono('obras')) };
    if (s.modelo) { s.grupo.remove(s.modelo); s.modelo = null; }
    if (s.insignia) { s.grupo.remove(s.insignia); s.insignia = null; }
    s.edificio = null;
    s.andamio = M.andamio();
    s.grupo.add(s.andamio);
    s.barra = M.barraVida(false, 2.6);
    s.barra.position.copy(s.pos).y = 5;
    escena.add(s.barra);
    M.ponerVida(s.barra, 0);
  }
  function terminarObra(s, silencioso) {
    var o = s.obra;
    if (s.andamio) { s.grupo.remove(s.andamio); s.andamio = null; }
    if (s.barra) { escena.remove(s.barra); s.barra = null; }
    ponerEdificio(s, o.tipo, o.nivel);
    s.obra = null;
    if (!silencioso) {
      s.rebote = 0;
      chispas(s.pos.clone().setY(1), 0xd8c49a, 18, 4);
      sonar('listo');
      flotar(N(o.tipo) + ' ★' + o.nivel, s.pos.clone().setY(5), 'oro');
      guardar();
    }
  }
  function ponerEdificio(s, tipo, nivel) {
    if (s.modelo) s.grupo.remove(s.modelo);
    s.edificio = { tipo: tipo, nivel: nivel };
    s.modelo = crearModelo(tipo, nivelVisual(nivel));
    s.modelo.scale.setScalar(ESCALA_EDIFICIO);
    if (s.insignia) s.grupo.remove(s.insignia);
    s.insignia = M.insigniaNivel(nivel);
    s.insignia.position.set(0, tipo === 'torre' ? 9.5 : 5.2, 0);
    s.grupo.add(s.insignia);
    s.grupo.add(s.modelo);
    s.cd = 0;
  }
  function contarEdificios(tipo) {
    return slots.filter(function (s) { return (s.edificio && s.edificio.tipo === tipo) || (s.obra && s.obra.tipo === tipo); }).length;
  }
  function cuartelesListos() { return slots.filter(function (s) { return s.edificio && s.edificio.tipo === 'cuartel'; }); }
  function capacidad() {
    var c = cuartelesListos().reduce(function (a, s) { return a + EDIFICIOS.cuartel.capacidad[s.edificio.nivel - 1]; }, 0);
    return c ? c + bono('cuarteles') : 0;
  }
  function rapidezEntreno() {
    return cuartelesListos().reduce(function (a, s) { return Math.max(a, EDIFICIOS.cuartel.rapidez[s.edificio.nivel - 1]); }, 1) * (1 + bono('entreno'));
  }
  function capacidadEnfermeria() {
    return slots.reduce(function (a, s) { return a + (s.edificio && s.edificio.tipo === 'enfermeria' ? EDIFICIOS.enfermeria.capacidad[s.edificio.nivel - 1] : 0); }, 0);
  }
  function totalHeridos() { var n = 0; for (var k in estado.heridos) n += estado.heridos[k]; return n; }
  function curarHeridos() {
    var n = totalHeridos();
    if (!n) return;
    var enf = slots.filter(function (s) { return s.edificio && s.edificio.tipo === 'enfermeria'; })[0];
    var base = enf ? enf.pos.clone().add(new V3(Math.sin(enf.grupo.rotation.y), 0, Math.cos(enf.grupo.rotation.y)).multiplyScalar(2.2)) : puertaCuartel();
    Object.keys(estado.heridos).forEach(function (tipo) {
      for (var k = 0; k < estado.heridos[tipo]; k++) {
        var u = crearTropa(tipo, base.clone().add(new V3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)));
        chispas(u.pos.clone().setY(1), 0x7fe39a, 6, 2);
      }
    });
    estado.heridos = {};
    consejoTemporal(T('curados', { n: n }));
    actualizarHUD();
  }
  function tropasOcupadas() { return tropasNormales() + totalHeridos() + colaEntreno.length; }
  function tropasNormales() { return tropas.filter(function (u) { return u.tipo !== 'heroe' && !u.invocada; }).length; }

  // ------------------------------------------------------------------
  //  UNIDADES
  // ------------------------------------------------------------------
  var dirFrente = new V3(), dirLado = new V3();
  (function () {
    var a = puntoCamino(largoCamino - 6).p, b = puntoCamino(largoCamino - 12).p;
    dirFrente.subVectors(b, a).setY(0).normalize();
    dirLado.set(dirFrente.z, 0, -dirFrente.x);
  })();
  var reunion = new V3(PUNTO_REUNION[0], 0, PUNTO_REUNION[1]);

  function vidaTropa(tipo, na) { return TROPAS[tipo].vida * (1 + ARMADURA.vida * (na || 0) + bono('escudos')); }
  function nivelArmadura(tipo) { return (estado.armadura && estado.armadura[tipo]) || 0; }
  function crearTropa(tipo, desde, invocada) {
    var d = TROPAS[tipo];
    var na = tipo === 'heroe' ? 0 : nivelArmadura(tipo);
    var m = M.unidad(tipo, undefined, na);
    m.grupo.position.copy(desde);
    escena.add(m.grupo);
    var u = {
      tipo: tipo, d: d, vida: vidaTropa(tipo, na), max: vidaTropa(tipo, na), defensa: ARMADURA.defensa * na, armadura: na, pos: m.grupo.position, m: m, aliado: true,
      cd: Math.random() * 0.5, ataque: 0, puesto: reunion.clone(), radio: 0.42 * m.escala, invocada: !!invocada,
      barra: M.barraVida(false, tipo === 'heroe' ? 1.8 : 1.3), altoBarra: 1.75 * m.escala
    };
    u.barra.visible = false;
    escena.add(u.barra);
    tropas.push(u);
    asignarPuestos();
    return u;
  }
  function crearEnemigo(tipo, n) {
    var d = ENEMIGOS[tipo], f = fuerzaOleada(n);
    var m = M.unidad(tipo);
    var u = {
      tipo: tipo, d: d, vida: d.vida * f, max: d.vida * f, dano: d.dano * f, pos: m.grupo.position, m: m, aliado: false,
      cd: 0, ataque: 0, dist: 0, lat: (Math.random() - 0.5) * 1.6, radio: 0.42 * m.escala,
      barra: M.barraVida(true, tipo === 'ogro' ? 3.0 : 1.3), altoBarra: 1.75 * m.escala
    };
    var pc = puntoCamino(0);
    u.pos.copy(pc.p);
    escena.add(m.grupo);
    u.barra.visible = tipo === 'ogro';
    escena.add(u.barra);
    enemigos.push(u);
  }

  function asignarPuestos() {
    var cuerpo = tropas.filter(function (u) { return !u.d.distancia; });
    var orden = { heroe: 0, guardian: 1, caballeria: 2, espadachin: 3 };
    cuerpo.sort(function (a, b) { return orden[a.tipo] - orden[b.tipo]; });
    var lejos = tropas.filter(function (u) { return u.d.distancia; });
    function poner(lista, base, paso, sep) {
      lista.forEach(function (u, k) {
        var fila = Math.floor(k / 5), col = k % 5;
        var enFila = Math.min(5, lista.length - fila * 5);
        u.puesto = reunion.clone()
          .addScaledVector(dirFrente, base - fila * paso)
          .addScaledVector(dirLado, (col - (enFila - 1) / 2) * sep);
      });
    }
    poner(cuerpo, 2.2, 1.8, 1.8);
    poner(lejos, -3.0, 1.8, 1.9);
  }

  function encararHacia(u, x, z, dt) {
    var a = Math.atan2(x - u.pos.x, z - u.pos.z);
    var r = u.m.grupo.rotation.y, dif = ((a - r + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    u.m.grupo.rotation.y = r + dif * Math.min(1, dt * 10);
  }
  function moverHacia(u, x, z, vel, dt) {
    var dx = x - u.pos.x, dz = z - u.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return true;
    var paso = Math.min(d, vel * dt);
    u.pos.x += dx / d * paso; u.pos.z += dz / d * paso;
    encararHacia(u, x, z, dt);
    return false;
  }

  function danar(obj, n, desde) {
    if (obj.vida <= 0) return;
    if (obj.defensa) n *= (1 - obj.defensa);
    obj.vida -= n;
    obj.barra.visible = true;
    M.ponerVida(obj.barra, obj.vida / obj.max);
    chispas(obj.pos.clone().setY(0.9 * obj.m.escala), obj.aliado ? 0xffffff : 0xffe07a, 3, 2.2);
    if (!obj.aliado && n >= 1) flotar('-' + Math.round(n), obj.pos.clone().setY(obj.altoBarra + 0.3), 'dano');
    if (obj.vida <= 0) morir(obj);
  }
  function morir(u) {
    var lista = u.aliado ? tropas : enemigos;
    var i = lista.indexOf(u);
    if (i >= 0) lista.splice(i, 1);
    escena.remove(u.barra);
    muriendo.push({ u: u, t: 0 });
    sonar('muerte');
    chispas(u.pos.clone().setY(0.6), u.aliado ? 0x8fb8ff : 0x8fcf4a, 10, 3);
    if (!u.aliado) {
      sumarMonedas(u.d.oro, u.pos.clone().setY(u.altoBarra + 0.8));
      sonar('moneda');
    } else {
      // con Enfermería, la tropa no se pierde: va a curarse
      if (u.tipo !== 'heroe' && !u.invocada && totalHeridos() < capacidadEnfermeria()) {
        estado.heridos[u.tipo] = (estado.heridos[u.tipo] || 0) + 1;
        flotar(T('a_enfermeria'), u.pos.clone().setY(u.altoBarra + 0.6), 'gema');
      }
      asignarPuestos();
    }
  }

  function disparar(desde, objetivo, dano, conSonido) {
    var f = M.flecha();
    f.position.copy(desde);
    escena.add(f);
    var dist = desde.distanceTo(objetivo.pos);
    flechas.push({ m: f, desde: desde.clone(), obj: objetivo, t: 0, dur: Math.max(0.25, dist / 22), dano: dano, arco: Math.min(3, dist * 0.18) });
    if (conSonido !== false) sonar('flecha');
  }

  function masCercano(lista, pos, maxDist) {
    var best = null, m = maxDist;
    for (var i = 0; i < lista.length; i++) {
      var d = lista[i].pos.distanceTo(pos) - lista[i].radio;
      if (d < m) { m = d; best = lista[i]; }
    }
    return best;
  }

  // ------------------------------------------------------------------
  //  ENTRENAR / INVOCAR
  // ------------------------------------------------------------------
  function puertaCuartel() {
    var c = cuartelesListos()[0];
    if (!c) return new V3(-6.5, 0, 0);
    return c.pos.clone().add(new V3(Math.sin(c.grupo.rotation.y), 0, Math.cos(c.grupo.rotation.y)).multiplyScalar(1.8));
  }
  function entrenar(tipo) {
    if (!cuartelesListos().length) { consejoTemporal(T('necesitas_cuartel')); sonar('error'); return; }
    if (tropasOcupadas() >= capacidad()) { consejoTemporal(T('sin_espacio')); sonar('error'); return; }
    if (!pagar(costoTropa(tipo))) return;
    colaEntreno.push({ tipo: tipo, t: 0, total: TROPAS[tipo].tiempo });
    sonar('click');
    actualizarHUD();
    actualizarPanel();
  }
  function costoArmadura(n) { return { oro: ARMADURA.costo[n], piedra: ARMADURA.piedra[n] }; }
  function mejorarArmadura(tipo) {
    var n = nivelArmadura(tipo);
    if (n >= ARMADURA.max) return;
    if (!pagar(costoArmadura(n))) return;
    estado.armadura[tipo] = n + 1;
    // las tropas que ya tienes también se ponen la armadura nueva
    tropas.forEach(function (u) {
      if (u.tipo !== tipo) return;
      var viejo = u.m.grupo, nuevo = M.unidad(tipo, undefined, n + 1);
      nuevo.grupo.position.copy(viejo.position);
      nuevo.grupo.rotation.copy(viejo.rotation);
      escena.remove(viejo); escena.add(nuevo.grupo);
      var frac = u.vida / u.max;
      u.m = nuevo; u.pos = nuevo.grupo.position;
      u.armadura = n + 1; u.defensa = ARMADURA.defensa * (n + 1);
      u.max = vidaTropa(tipo, n + 1); u.vida = frac * u.max;
      chispas(u.pos.clone().setY(1.2), COLOR_ARM_EFECTO[n + 1], 8, 2.5);
    });
    sonar('listo');
    consejoTemporal(T('armadura_lista', { t: N(tipo), n: n + 1 }));
    actualizarHUD();
    guardar();
    reabrirPanel();
  }
  var COLOR_ARM_EFECTO = [0xffffff, 0xd6dde5, 0x6f8fb5, 0xf5c542];
  function invocarTres() {
    if (!pagar(0, INVOCAR.tres)) return;
    var tipos = ['espadachin', 'arquero', 'guardian', 'caballeria'], salieron = [];
    for (var i = 0; i < 3; i++) {
      var tipo = tipos[Math.floor(Math.random() * tipos.length)];
      var p = reunion.clone().add(new V3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
      crearTropa(tipo, p, true);
      chispas(p.clone().setY(0.8), 0xd59bff, 14, 3);
      salieron.push(N(tipo));
    }
    sonar('magia');
    cerrarPanel();
    consejoTemporal(T('invocaste', { t: salieron.join(', ') }));
    actualizarHUD();
    guardar();
  }
  function invocarHeroe() {
    if (tropas.some(function (u) { return u.tipo === 'heroe'; })) { consejoTemporal(T('heroe_vivo')); sonar('error'); return; }
    if (!pagar(0, INVOCAR.heroe)) return;
    var p = reunion.clone();
    crearTropa('heroe', p);
    chispas(p.clone().setY(1), 0xffe14a, 30, 4);
    sonar('magia');
    cerrarPanel();
    actualizarHUD();
    guardar();
  }

  // ------------------------------------------------------------------
  //  OLEADAS
  // ------------------------------------------------------------------
  function empezarOleada() {
    if (oleadaActiva) return;
    var n = estado.oleada;
    var o = composicion(n);
    var lista = [];
    var tr = o.trasgo || 0, br = o.bruto || 0;
    var total = tr + br;
    for (var i = 0; i < total; i++) {
      // reparte los brutos entre los trasgos
      var tocaBruto = br > 0 && (i + 1) * br / total >= (lista.filter(function (x) { return x === 'bruto'; }).length + 1);
      lista.push(tocaBruto ? 'bruto' : 'trasgo');
    }
    for (var k = 0; k < (o.ogro || 0); k++) lista.push('ogro');
    colaSpawn = lista;
    spawnCd = 1.5;
    oleadaActual = n;
    oleadaActiva = true;
    $('btn-oleada').classList.add('oculto');
    avisoGrande(T('aviso_oleada', { n: n }));
    sonar('cuerno');
    cerrarPanel();
    actualizarHUD();
  }
  function oleadaTerminada() {
    oleadaActiva = false;
    var n = oleadaActual;
    var ultima = n === OLEADAS.length && !estado.infinito;
    var g = GEMAS_POR_OLEADA + (ultima ? GEMAS_VICTORIA : 0);
    sumarGemas(g, castilloPos.clone().setY(10));
    sonar('gemas');
    estado.oleada = n + 1;
    estado.vidaCastillo = vidaMaxCastillo();
    setTimeout(function () { guardar(true); }, 50);
    // las tropas heridas se curan
    tropas.forEach(function (u) { u.vida = u.max; u.barra.visible = false; M.ponerVida(u.barra, 1); });
    curarHeridos();
    repararBarricadas();
    guardar();
    publicarAldea(true);
    if (ultima) {
      setTimeout(function () { sonar('victoria'); pantallaVictoria(); }, 900);
    } else {
      avisoGrande(T('oleada_superada'));
      $('btn-oleada').classList.remove('oculto');
    }
    actualizarHUD();
  }
  function castilloCaido() {
    oleadaActiva = false;
    colaSpawn = [];
    sonar('derrota');
    pantallaDerrota();
  }
  function limpiarEnemigos() {
    enemigos.slice().forEach(function (e) { escena.remove(e.m.grupo); escena.remove(e.barra); });
    enemigos = [];
    flechas.forEach(function (f) { escena.remove(f.m); });
    flechas = [];
  }

  var avisoTimer = null;
  function avisoGrande(txt) {
    var a = $('aviso-oleada');
    a.textContent = txt;
    a.classList.add('ver');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { a.classList.remove('ver'); }, 1800);
  }

  // ------------------------------------------------------------------
  //  ACTUALIZAR (cada cuadro)
  // ------------------------------------------------------------------
  function actualizar(dt) {
    tiempo += dt;

    // ---- obras ----
    slots.forEach(function (s) {
      if (s.obra) {
        s.obra.t += dt;
        M.ponerVida(s.barra, s.obra.t / s.obra.total);
        if (Math.random() < dt * 3) chispas(s.pos.clone().setY(2 + Math.random()), 0xc9a66a, 1, 1.5);
        if (s.obra.t >= s.obra.total) terminarObra(s);
      }
      if (s.rebote < 1 && s.modelo) {
        s.rebote = Math.min(1, s.rebote + dt * 2.2);
        var k = s.rebote, c1 = 1.70158, c3 = c1 + 1;
        var e = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
        s.modelo.scale.setScalar(Math.max(0.05, e) * ESCALA_EDIFICIO);
      }
      if (!s.edificio) return;
      var ed = s.edificio, d = EDIFICIOS[ed.tipo];
      // granja: produce monedas
      if (d.recurso) {
        s.cd += dt;
        if (s.cd >= d.cada) { s.cd -= d.cada; sumarRecurso(d.recurso, Math.round(d.produce[ed.nivel - 1] * (1 + bono({ comida: 'cosecha', madera: 'lenadores', piedra: 'canteros' }[d.recurso]))), s.pos.clone().setY(3.2)); }
        if (s.modelo.userData.aspas) s.modelo.userData.aspas.rotation.z += dt * 1.8;
        if (s.modelo.userData.sierra) s.modelo.userData.sierra.rotation.y += dt * 9;
        if (s.modelo.userData.carro) s.modelo.userData.carro.position.z = 1.7 + Math.sin(tiempo * 1.2 + s.i) * 0.35;
      }
      // torre: dispara flechas
      if (ed.tipo === 'torre') {
        s.cd -= dt;
        var arq = s.modelo.userData.arquero;
        var obj = masCercano(enemigos, s.pos, d.alcance[ed.nivel - 1]);
        if (obj) {
          var ang = Math.atan2(obj.pos.x - s.pos.x, obj.pos.z - s.pos.z) - s.grupo.rotation.y;
          arq.grupo.rotation.y = ang;
          if (s.cd <= 0) {
            s.cd = d.ritmo;
            var o = s.pos.clone(); o.y = s.modelo.userData.alturaDisparo * ESCALA_EDIFICIO;
            disparar(o, obj, d.dano[ed.nivel - 1] * (1 + bono('flechas')));
            arq.ataque = 1;
          }
        }
        arq.ataque = Math.max(0, (arq.ataque || 0) - dt * 3);
        M.animarUnidad(arq, tiempo, false, arq.ataque);
      }
      if (s.modelo.userData.banderas) s.modelo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });
    });
    castillo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });

    // ---- impuestos del castillo ----
    impuestoCd += dt;
    if (impuestoCd >= IMPUESTO.cada) { impuestoCd -= IMPUESTO.cada; sumarRecurso('oro', Math.round(IMPUESTO.oro * (1 + bono('impuestos'))), castilloPos.clone().setY(9)); }
    // ---- las tropas comen ----
    comidaCd += dt;
    if (comidaCd >= COMIDA_TROPA.cada) {
      comidaCd -= COMIDA_TROPA.cada;
      var bocas = tropas.length;
      if (bocas && !estado.oroInfinito) estado.comida = Math.max(0, estado.comida - bocas);
      hambre = bocas > 0 && estado.comida <= 0 && !estado.oroInfinito;
      $('aviso-hambre').textContent = T('sin_comida');
      $('aviso-hambre').classList.toggle('oculto', !hambre);
      actualizarHUD();
    }
    // ---- barricadas: barra de vida mirando a la cámara ----
    barricadas.forEach(function (b) { if (b.barra) b.barra.quaternion.copy(camara.quaternion); });
    // ---- investigación en curso ----
    if (estado.investigando) {
      var aca = academiaLista();
      if (aca) estado.investigando.t += dt * EDIFICIOS.academia.rapidez[aca.edificio.nivel - 1];
      if (estado.investigando.t >= estado.investigando.total) terminarInvestigacion();
    }
    // ---- muralla en construcción ----
    if (obraMuralla) {
      obraMuralla.t += dt;
      M.ponerVida(murallaBarra, obraMuralla.t / obraMuralla.total);
      if (Math.random() < dt * 6) { var ta = Math.random() * Math.PI * 2, fz = formaMuralla(); chispas(new V3(fz.cx + Math.cos(ta) * fz.rx, 1.5, fz.cz + Math.sin(ta) * fz.rz), 0xc9a66a, 1, 1.5); }
      if (obraMuralla.t >= obraMuralla.total) terminarMuralla();
    }
    if (murallaModelo) {
      if (murallaRebote < 1) { murallaRebote = Math.min(1, murallaRebote + dt * 2); murallaModelo.scale.y = Math.max(0.05, 1 - Math.pow(1 - murallaRebote, 3) + Math.sin(murallaRebote * Math.PI) * 0.15); }
      if (murallaModelo.userData.banderas) murallaModelo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });
    }
    if (murallaBarra) murallaBarra.quaternion.copy(camara.quaternion);
    // ---- castillo dispara ----
    castilloCd -= dt;
    if (castilloCd <= 0) {
      var oc = masCercano(enemigos, castilloPos, CASTILLO.alcance);
      if (oc) {
        castilloCd = CASTILLO.ritmo;
        var esquinas = [[-3.4, -3.4], [-3.4, 3.4], [3.4, -3.4], [3.4, 3.4]];
        var es = esquinas.reduce(function (a, q) { return Math.hypot(q[0] - oc.pos.x, q[1] - oc.pos.z) < Math.hypot(a[0] - oc.pos.x, a[1] - oc.pos.z) ? q : a; });
        disparar(new V3(es[0], 4.4, es[1]), oc, CASTILLO.dano);
      }
    }

    // ---- entrenamiento ----
    if (colaEntreno.length && cuartelesListos().length) {
      var c = colaEntreno[0];
      c.t += dt * rapidezEntreno();
      if (c.t >= c.total) {
        colaEntreno.shift();
        var u = crearTropa(c.tipo, puertaCuartel());
        chispas(u.pos.clone().setY(1), 0x9fd0ff, 8, 2);
        sonar('entrenado');
        actualizarHUD();
        guardar();
      }
    }

    // ---- aparecer enemigos ----
    if (oleadaActiva && colaSpawn.length) {
      spawnCd -= dt;
      if (spawnCd <= 0) {
        var tipo = colaSpawn.shift();
        crearEnemigo(tipo, oleadaActual);
        if (tipo === 'ogro') { avisoGrande(T('aviso_jefe')); sonar('cuerno'); }
        spawnCd = oleadaActual > 3 ? 0.8 : 1.1;
      }
    }

    // ---- tropas ----
    tropas.slice().forEach(function (u) {
      var d = u.d, caminando = false;
      u.cd -= dt;
      u.ataque = Math.max(0, u.ataque - dt * 3);
      if (d.cura && u.vida < u.max) { u.vida = Math.min(u.max, u.vida + d.cura * dt); M.ponerVida(u.barra, u.vida / u.max); }
      var obj;
      if (d.distancia) {
        obj = masCercano(enemigos, u.pos, d.alcance);
        if (obj) {
          encararHacia(u, obj.pos.x, obj.pos.z, dt);
          if (u.cd <= 0) { u.cd = d.ritmo; u.ataque = 1; disparar(u.pos.clone().setY(1.0), obj, d.dano * (hambre ? COMIDA_TROPA.debilidad : 1) * (1 + bono('espadas')), Math.random() < 0.5); }
        } else caminando = !moverHacia(u, u.puesto.x, u.puesto.z, d.vel, dt);
      } else {
        var correa = u.tipo === 'heroe' ? 13 : 9.5;
        obj = masCercano(enemigos.filter(function (e) { return e.pos.distanceTo(u.puesto) < correa; }), u.pos, 99);
        if (obj) {
          var dist = u.pos.distanceTo(obj.pos) - obj.radio - u.radio;
          if (dist > d.alcance - 0.3) caminando = !moverHacia(u, obj.pos.x, obj.pos.z, d.vel, dt);
          else {
            encararHacia(u, obj.pos.x, obj.pos.z, dt);
            if (u.cd <= 0) { u.cd = d.ritmo; u.ataque = 1; danar(obj, d.dano * (hambre ? COMIDA_TROPA.debilidad : 1) * (1 + bono('espadas')), u); sonar('golpe'); }
          }
        } else caminando = !moverHacia(u, u.puesto.x, u.puesto.z, d.vel, dt);
        if (!obj && !caminando) encararHacia(u, u.pos.x + dirFrente.x, u.pos.z + dirFrente.z, dt);
      }
      M.animarUnidad(u.m, tiempo + u.radio * 10, caminando, u.ataque);
    });

    // ---- enemigos ----
    enemigos.slice().forEach(function (e) {
      var d = e.d, caminando = false, bb = null;
      e.cd -= dt;
      e.ataque = Math.max(0, e.ataque - dt * 2.5);
      var victima = masCercano(tropas, e.pos, d.alcance + e.radio + 0.5);
      if (victima) {
        encararHacia(e, victima.pos.x, victima.pos.z, dt);
        if (e.cd <= 0) { e.cd = d.ritmo; e.ataque = 1; danar(victima, e.dano, e); sonar('golpe'); }
      } else if (e.dist >= largoCamino - 0.1) {
        // en la puerta: atacar el castillo
        encararHacia(e, 0, 0, dt);
        if (e.cd <= 0) {
          e.cd = d.ritmo; e.ataque = 1;
          estado.vidaCastillo -= e.dano;
          chispas(e.pos.clone().setY(1.2).lerp(castilloPos, 0.2), 0xc9c2b5, 4, 2);
          sonar('golpe');
          actualizarHUD();
          if (estado.vidaCastillo <= 0) { estado.vidaCastillo = 0; castilloCaido(); }
        }
      } else if ((bb = barricadaDelante(e.dist))) {
        // una barricada le cierra el paso: la golpea hasta romperla
        encararHacia(e, bb.pos.x, bb.pos.z, dt);
        if (e.cd <= 0) {
          e.cd = d.ritmo; e.ataque = 1;
          bb.vida -= e.dano;
          bb.barra.visible = true;
          M.ponerVida(bb.barra, bb.vida / bb.max);
          chispas(bb.pos.clone().setY(0.8), bb.nivel > 1 ? 0xc9c2b5 : 0xc9a66a, 3, 2);
          sonar('golpe');
          if (bb.vida <= 0) romperBarricada(bb);
        }
      } else {
        var pc = puntoCamino(e.dist);
        var lado = new V3(pc.t.z, 0, -pc.t.x).normalize();
        var meta = pc.p.clone().addScaledVector(lado, e.lat);
        if (e.pos.distanceTo(meta) > 0.6) caminando = !moverHacia(e, meta.x, meta.z, d.vel, dt);
        else {
          e.dist = Math.min(largoCamino, e.dist + d.vel * dt);
          var pn = puntoCamino(e.dist), ln = new V3(pn.t.z, 0, -pn.t.x).normalize();
          var m2 = pn.p.clone().addScaledVector(ln, e.lat);
          caminando = !moverHacia(e, m2.x, m2.z, d.vel * 1.5, dt);
          caminando = true;
        }
      }
      M.animarUnidad(e.m, tiempo + e.lat * 7, caminando, e.ataque);
    });

    // ---- separar unidades para que no se encimen ----
    var todos = tropas.concat(enemigos);
    for (var a = 0; a < todos.length; a++) {
      var A = todos[a];
      for (var b = a + 1; b < todos.length; b++) {
        var B = todos[b];
        var dx = B.pos.x - A.pos.x, dz = B.pos.z - A.pos.z, dd = Math.hypot(dx, dz), min = A.radio + B.radio;
        if (dd < min && dd > 0.0001) {
          var emp = (min - dd) * 0.5;
          A.pos.x -= dx / dd * emp; A.pos.z -= dz / dd * emp;
          B.pos.x += dx / dd * emp; B.pos.z += dz / dd * emp;
        }
      }
      var rc = Math.hypot(A.pos.x, A.pos.z);
      if (rc < RADIO_CASTILLO + A.radio) { var f2 = (RADIO_CASTILLO + A.radio) / rc; A.pos.x *= f2; A.pos.z *= f2; }
      A.barra.position.set(A.pos.x, A.altoBarra, A.pos.z);
    }

    // ---- flechas ----
    flechas = flechas.filter(function (f) {
      f.t += dt / f.dur;
      var meta = f.obj.pos.clone().setY(0.9 * f.obj.m.escala);
      var k = Math.min(1, f.t);
      var p = f.desde.clone().lerp(meta, k);
      p.y += Math.sin(k * Math.PI) * f.arco;
      f.m.lookAt(p);
      f.m.position.copy(p);
      if (f.t >= 1) {
        escena.remove(f.m);
        if (f.obj.vida > 0) danar(f.obj, f.dano);
        return false;
      }
      return true;
    });

    // ---- muertes (animación de caída) ----
    muriendo = muriendo.filter(function (x) {
      x.t += dt;
      var g = x.u.m.grupo;
      g.rotation.x = -Math.min(1, x.t * 3) * Math.PI / 2;
      if (x.t > 0.6) g.position.y = -(x.t - 0.6) * 2;
      if (x.t > 1.2) { escena.remove(g); return false; }
      return true;
    });

    // ---- partículas ----
    particulas = particulas.filter(function (p) {
      p.vida -= dt;
      p.v.y -= 12 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += dt * 5; p.m.rotation.y += dt * 4;
      if (p.m.position.y < 0.05) { p.m.position.y = 0.05; p.v.multiplyScalar(0.5); }
      p.m.scale.setScalar(Math.max(0.01, p.vida * 1.2));
      if (p.vida <= 0) { escena.remove(p.m); return false; }
      return true;
    });

    // ---- ¿terminó la oleada? ----
    if (oleadaActiva && !colaSpawn.length && !enemigos.length) oleadaTerminada();
  }

  // ------------------------------------------------------------------
  //  CÁMARA
  // ------------------------------------------------------------------
  function actualizarCamara(dt) {
    cam.dist += (cam.distMeta - cam.dist) * Math.min(1, dt * 8);
    cam.objetivo.x = Math.max(-55, Math.min(25, cam.objetivo.x));
    cam.objetivo.z = Math.max(-38, Math.min(25, cam.objetivo.z));
    var o = cam.objetivo, s = Math.sin(cam.polar);
    camara.position.set(o.x + cam.dist * s * Math.cos(cam.az), o.y + cam.dist * Math.cos(cam.polar), o.z + cam.dist * s * Math.sin(cam.az));
    camara.lookAt(o);
    sol.position.set(o.x + 30, 55, o.z + 18);
    sol.target.position.copy(o);
  }

  // ------------------------------------------------------------------
  //  TOQUES Y RATÓN
  // ------------------------------------------------------------------
  var punteros = {}, arrastre = null, pellizco = null;
  var lienzo = render.domElement;
  lienzo.addEventListener('pointerdown', function (ev) {
    lienzo.setPointerCapture(ev.pointerId);
    punteros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var ids = Object.keys(punteros);
    if (ids.length === 1) arrastre = { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, t: performance.now(), movio: false };
    if (ids.length === 2) {
      var a = punteros[ids[0]], b = punteros[ids[1]];
      pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.distMeta };
      arrastre = null;
    }
  });
  lienzo.addEventListener('pointermove', function (ev) {
    if (!punteros[ev.pointerId]) return;
    punteros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var ids = Object.keys(punteros);
    if (pellizco && ids.length === 2) {
      var a = punteros[ids[0]], b = punteros[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      cam.distMeta = Math.max(16, Math.min(70, pellizco.dist * pellizco.d / Math.max(20, d)));
      return;
    }
    if (!arrastre) return;
    var dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y;
    if (Math.hypot(ev.clientX - arrastre.sx, ev.clientY - arrastre.sy) > 7) arrastre.movio = true;
    arrastre.x = ev.clientX; arrastre.y = ev.clientY;
    // mover el punto que mira la cámara
    var k = cam.dist / window.innerHeight * 1.1;
    var adelante = new V3(-Math.cos(cam.az), 0, -Math.sin(cam.az));
    var derecha = new V3(-adelante.z, 0, adelante.x);
    cam.objetivo.addScaledVector(derecha, -dx * k).addScaledVector(adelante, dy * k * 1.3);
  });
  function soltar(ev) {
    var era = punteros[ev.pointerId];
    delete punteros[ev.pointerId];
    if (Object.keys(punteros).length < 2) pellizco = null;
    if (arrastre && era && !arrastre.movio && performance.now() - arrastre.t < 600) tocar(ev.clientX, ev.clientY);
    if (!Object.keys(punteros).length) arrastre = null;
  }
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', function (ev) { delete punteros[ev.pointerId]; arrastre = null; pellizco = null; });
  lienzo.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    cam.distMeta = Math.max(16, Math.min(70, cam.distMeta * (ev.deltaY > 0 ? 1.1 : 0.9)));
  }, { passive: false });
  window.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { if (enMundo) cerrarMundo(); else if (modoColocar) salirModoColocar(); else cerrarPanel(); }
  });

  var rayo = new THREE.Raycaster(), mouse = new THREE.Vector2();
  function tocar(x, y) {
    if (enMenu) return;
    mouse.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    rayo.setFromCamera(mouse, camara);
    // primero miramos si tocó una tropa o un enemigo (se ven más arriba que el suelo)
    if (!modoColocar) {
      var gente = tropas.concat(enemigos);
      var hitsG = rayo.intersectObjects(gente.map(function (u) { return u.m.grupo; }), true);
      if (hitsG.length) {
        var og = hitsG[0].object;
        while (og && !gente.some(function (u) { return u.m.grupo === og; })) og = og.parent;
        var quien = og && gente.filter(function (u) { return u.m.grupo === og; })[0];
        if (quien) { sonar('click'); abrirPanelUnidad(quien); return; }
      }
    }
    var hits = rayo.intersectObjects(slots.map(function (s) { return s.grupo; }).concat(barricadas.map(function (b) { return b.grupo; })).concat(murallaModelo ? [castillo, murallaModelo] : [castillo]), true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object;
      while (o && o.userData.slot === undefined && !o.userData.castillo && o.userData.barricada === undefined) o = o.parent;
      if (!o) continue;
      if (o.userData.barricada !== undefined) { tocarBarricada(o.userData.barricada); return; }
      if (o.userData.castillo) { if (modoColocar) continue; sonar('click'); abrirPanelCastillo(); return; }
      tocarSlot(o.userData.slot);
      return;
    }
    // tocar el suelo: si estás colocando, te recordamos qué hacer (no se cancela solo)
    if (modoColocar) { consejoTemporal(modoColocar === 'barricada' ? T('colocando_barr') : T('colocando', { n: N(modoColocar) })); sonar('error'); return; }
    cerrarPanel();
  }
  function tocarSlot(i) {
    var s = slots[i];
    sonar('click');
    if (modoColocar === 'barricada') { consejoTemporal(T('colocando_barr')); sonar('error'); return; }
    if (modoColocar) {
      if (!s.edificio && !s.obra) construir(i, modoColocar);
      else { consejoTemporal(T('ocupado')); sonar('error'); }
      return;
    }
    if (s.edificio || s.obra) abrirPanelEdificio(i);
    else abrirPanelConstruir(i);
  }

  // ------------------------------------------------------------------
  //  MODO COLOCAR
  // ------------------------------------------------------------------
  var modoColocar = null, slotElegido = null;
  function entrarModoColocar(tipo) {
    if (!slots.some(function (s) { return !s.edificio && !s.obra; })) { consejoTemporal(T('sin_terreno')); sonar('error'); return; }
    var falta = faltante(costoEdif(tipo, 0));
    if (falta) { avisarFalta(falta); return; }
    salirModoColocar();
    modoColocar = tipo;
    cerrarPanel();
    $('btn-construir').classList.add('activo');
    // vista previa transparente del edificio en cada terreno libre
    slots.forEach(function (s) {
      if (s.edificio || s.obra) return;
      var f = crearModelo(tipo, 1);
      f.traverse(function (o) {
        if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; o.material.depthWrite = false; o.castShadow = false; }
      });
      f.scale.setScalar(ESCALA_EDIFICIO);
      s.grupo.add(f);
      s.fantasma = f;
    });
    $('barra-colocar-txt').textContent = T('colocando', { n: N(tipo) });
    $('barra-colocar').classList.remove('oculto');
    document.body.classList.add('colocando');
  }
  function salirModoColocar() {
    modoColocar = null;
    barricadas.forEach(function (b) { if (b.fantasma) { b.grupo.remove(b.fantasma); b.fantasma = null; } });
    $('btn-construir').classList.remove('activo');
    slots.forEach(function (s) { if (s.fantasma) { s.grupo.remove(s.fantasma); s.fantasma = null; } });
    $('barra-colocar').classList.add('oculto');
    document.body.classList.remove('colocando');
  }
  $('btn-cancelar-colocar').addEventListener('click', function () { sonar('click'); salirModoColocar(); });

  // ------------------------------------------------------------------
  //  RETRATOS 3D PARA LOS PANELES
  // ------------------------------------------------------------------
  var retratos = {};
  (function crearRetratos() {
    try {
      var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setSize(128, 128);
      var e = new THREE.Scene();
      e.add(new THREE.HemisphereLight(0xffffff, 0x8a9a7a, 0.6));
      var l = new THREE.DirectionalLight(0xffffff, 0.55); l.position.set(3, 5, 4); e.add(l);
      var c = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      function foto(obj, dist, alto) {
        e.add(obj);
        c.position.set(dist * 0.55, alto + dist * 0.35, dist);
        c.lookAt(0, alto, 0);
        r.render(e, c);
        var url = r.domElement.toDataURL();
        e.remove(obj);
        return url;
      }
      ['espadachin', 'arquero', 'guardian', 'heroe', 'caballeria'].forEach(function (t) {
        var u = M.unidad(t); u.grupo.rotation.y = 0.3;
        var s = u.escala;
        retratos[t] = foto(u.grupo, 2.9 * s, 0.8 * s);
      });
      ['granja', 'cuartel', 'torre'].forEach(function (t) {
        var m = crearModelo(t, 1); m.rotation.y = 0.5;
        retratos[t] = foto(m, t === 'torre' ? 10 : 5.5, t === 'torre' ? 2.8 : 0.9);
      });
      retratos.castillo = foto(M.castillo(), 22, 3);
      ['trasgo', 'bruto', 'ogro'].forEach(function (t) { var u = M.unidad(t); u.grupo.rotation.y = 0.3; retratos[t] = foto(u.grupo, 2.9 * u.escala, 0.8 * u.escala); });
      ['aserradero', 'mina', 'academia'].forEach(function (t) { var m = crearModelo(t, 1); m.rotation.y = 0.5; retratos[t] = foto(m, 5.5, 0.9); });
      retratos.barricada = (function () { var m = M.barricada(1); m.rotation.y = 0.6; return foto(m, 6, 0.6); })();
      retratos.enfermeria = (function () { var m = M.enfermeria(1); m.rotation.y = 0.5; return foto(m, 5.5, 1.0); })();
      retratos.muralla = (function () { var m = M.muralla(3); return foto(m, 20, 1.5); })();
      r.dispose();
      if (r.forceContextLoss) r.forceContextLoss();
    } catch (err) { /* si falla, se usan emojis */ }
  })();
  function fotoHTML(clave, emoji) {
    return retratos[clave] ? '<img src="' + retratos[clave] + '" alt="">' : emoji;
  }

  // ------------------------------------------------------------------
  //  PANELES
  // ------------------------------------------------------------------
  var panelActual = null;
  function abrirPanel(titulo, html, cual) {
    $('panel-titulo').textContent = titulo;
    $('panel-cuerpo').innerHTML = html;
    $('panel').classList.remove('oculto');
    $('panel').scrollTop = 0;
    document.body.classList.add('panel-abierto');
    panelActual = cual;
    actualizarPanel();
  }
  function cerrarPanel() {
    $('panel').classList.add('oculto');
    document.body.classList.remove('panel-abierto');
    panelActual = null;
    slotElegido = null;
  }
  function reabrirPanel() {
    if (!panelActual) return;
    var p = panelActual;
    if (p.tipo === 'construir') abrirPanelConstruir(p.slot);
    else if (p.tipo === 'tropas') abrirPanelTropas();
    else if (p.tipo === 'invocar') abrirPanelInvocar();
    else if (p.tipo === 'edificio') abrirPanelEdificio(p.slot);
    else if (p.tipo === 'castillo') abrirPanelCastillo();
    else if (p.tipo === 'barricada') abrirPanelBarricada(p.i);
    else if (p.tipo === 'alianza') abrirPanelAlianza();
    else if (p.tipo === 'conquista') abrirPanelConquista();
    else if (p.tipo === 'investigacion') abrirPanelInvestigacion(p.rama);
    else if (p.tipo === 'mochila') abrirPanelMochila();
    else if (p.tipo === 'tienda') abrirPanelTienda();
    else if (p.tipo === 'ajustes') abrirPanelAjustes();
  }

  function htmlCosto(c) {
    var h = '';
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) {
      if (!c[r]) return;
      var ok = estado.oroInfinito || cantidad(r) >= c[r];
      h += '<span class="costo-r' + (ok ? '' : ' no') + '">' + (r === 'oro' ? '<span class="ico moneda"></span>' : '<span class="emo">' + ICONO_RECURSO[r] + '</span>') + c[r] + '</span>';
    });
    return h;
  }
  function botonCosto(c, accion, extra, texto) {
    return '<button class="comprar" data-accion="' + accion + '" data-costo=\'' + JSON.stringify(c) + '\' ' + (extra || '') + '>' + (texto || '') + htmlCosto(c) + '</button>';
  }
  function botonMonedas(costo, accion, extra, texto) {
    return '<button class="comprar" data-accion="' + accion + '" data-costo="' + costo + '" ' + (extra || '') + '>' +
      (texto ? texto + ' ' : '') + '<span class="ico moneda"></span>' + costo + '</button>';
  }
  function botonGemas(costo, accion, extra, texto) {
    return '<button class="comprar morado" data-accion="' + accion + '" data-gemas="' + costo + '" ' + (extra || '') + '>' +
      (texto ? texto + ' ' : '') + '<span class="ico gema"></span>' + costo + '</button>';
  }
  function statsEdificio(tipo, nivel) {
    var d = EDIFICIOS[tipo], i = nivel - 1;
    if (d.recurso) return '<span>' + ICONO_RECURSO[d.recurso] + ' ' + T('produce_txt', { n: d.produce[i], r: T('r_' + d.recurso), s: d.cada }) + '</span>';
    if (tipo === 'cuartel') return '<span>' + T('capacidad') + ': ' + d.capacidad[i] + '</span>' + (d.rapidez[i] > 1 ? '<span>' + T('velocidad_ent') + ' x' + d.rapidez[i] + '</span>' : '');
    if (tipo === 'enfermeria') return '<span>🛏️ ' + T('camas') + ': ' + d.capacidad[i] + '</span>';
    if (tipo === 'academia') return '<span>📜 ' + T('nivel') + ' máx. ' + d.tope[i] + '</span>' + (d.rapidez[i] > 1 ? '<span>⏱ x' + d.rapidez[i] + '</span>' : '');
    return '<span>' + T('dano') + ': ' + d.dano[i] + '</span><span>' + T('alcance') + ': ' + d.alcance[i] + '</span>';
  }
  function htmlMuralla() {
    var n = estado.muralla, sig = n + 1;
    var h = '<div class="carta compacta"><div class="cab"><div class="foto">' + fotoHTML('muralla', MURALLA.icono) + '</div><div><h3>' + N('muralla') + (n ? ' — ' + T('nivel_corto') + ' ' + n + '/' + NIVEL_MAX : '') + '</h3><p>' + D('muralla') + '</p></div></div>';
    if (obraMuralla) return h + '<div class="stats"><span>' + T('construyendo') + '</span></div></div>';
    if (n >= NIVEL_MAX) return h + '<div class="stats"><span>❤ +' + Math.round(MURALLA.vida[NIVEL_MAX - 1] * (1 + bono('muros'))) + '</span><span>' + T('nivel_max') + '</span></div></div>';
    return h + '<div class="stats"><span>❤ ' + T('vida_extra') + ' +' + MURALLA.vida[sig - 1] + '</span></div>' +
      botonCosto(costoMuralla(sig - 1), 'muralla', '', n ? T('mejorar') : T('construir')) + '</div>';
  }

  function htmlBarricada() {
    var libres = barricadas.filter(function (b) { return !b.nivel; }).length;
    return '<div class="carta compacta"><div class="cab"><div class="foto">' + fotoHTML('barricada', BARRICADA.icono) + '</div><div><h3>' + N('barricada') + '</h3><p>' + D('barricada') + '</p></div></div>' +
      '<div class="stats"><span>❤ ' + T('vida') + ' ' + BARRICADA.vida[0] + '</span><span>' + libres + '/' + barricadas.length + '</span></div>' +
      (libres ? botonCosto(costoBarricada(0), 'barricada', '', T('construir')) : '') + '</div>';
  }
  function abrirPanelBarricada(i) {
    var b = barricadas[i];
    var html = '<div class="carta"><div class="cab"><div class="foto">' + fotoHTML('barricada', BARRICADA.icono) + '</div><div><h3>' + N('barricada') + ' ' + T(b.nivel > 1 ? 'piedra_nivel' : 'madera_nivel') + '</h3><p>' + D('barricada') + '</p></div></div>' +
      '<div class="stats"><span>❤ ' + T('vida') + ' ' + Math.max(0, Math.ceil(b.vida)) + ' / ' + b.max + '</span></div><p class="nota">' + T('barr_arreglo') + '</p>';
    if (b.nivel < 2) html += '<p class="nota">' + T('nivel') + ' 2 (' + T('piedra_nivel') + '): ❤ ' + BARRICADA.vida[1] + '</p>' + botonCosto(costoBarricada(1), 'mejorar-barricada', 'data-barr="' + i + '"', T('mejorar'));
    else html += '<p class="nota"><b>' + T('nivel_max') + '</b></p>';
    abrirPanel(N('barricada'), html + '</div>', { tipo: 'barricada', i: i });
  }
  function abrirPanelConstruir(slot) {
    slotElegido = slot === undefined ? null : slot;
    var html = '<div class="lista">';
    ['granja', 'aserradero', 'mina', 'cuartel', 'torre', 'enfermeria', 'academia'].forEach(function (t) {
      html += '<div class="carta compacta" title="' + D(t) + '"><div class="cab"><div class="foto">' + fotoHTML(t, EDIFICIOS[t].icono) + '</div><div><h3>' + N(t) + '</h3><p>' + D(t) + '</p></div></div>' +
        '<div class="stats">' + statsEdificio(t, 1) + '</div>' +
        botonCosto(costoEdif(t, 0), 'construir', 'data-tipo="' + t + '"', T('construir')) + '</div>';
    });
    html += htmlBarricada() + htmlMuralla() + '</div>';
    if (!slots.some(function (s) { return !s.edificio && !s.obra; })) html += '<p class="nota aviso-rojo">' + T('sin_terreno') + '</p>';
    abrirPanel(T('p_construir'), html, { tipo: 'construir', slot: slotElegido });
  }

  function abrirPanelTropas() {
    var html = subtabsHeroes('tropas');
    if (!cuartelesListos().length) html += '<p class="nota aviso-rojo">' + T('necesitas_cuartel') + '</p>';
    html += '<div class="lista">';
    ['espadachin', 'caballeria', 'arquero', 'guardian'].forEach(function (t) {
      var d = TROPAS[t], na = nivelArmadura(t);
      html += '<div class="carta compacta" title="' + D(t) + '"><div class="cab"><div class="foto">' + fotoHTML(t, d.icono) + '</div><div><h3>' + N(t) + '</h3><p>' + D(t) + '</p></div></div>' +
        '<div class="stats"><span>❤ ' + T('vida') + ' ' + Math.round(d.vida * (1 + ARMADURA.vida * na)) + '</span><span>⚔ ' + T('dano') + ' ' + d.dano + '</span><span>🎯 ' + T('alcance') + ' ' + d.alcance + '</span><span>⏱ ' + d.tiempo + 's</span>' +
        (na ? '<span class="nivel-arm">🛡️ ' + T('defensa') + ' ' + Math.round(ARMADURA.defensa * 100 * na) + '%</span>' : '') + '</div>' +
        '<div class="botones">' + botonCosto(costoTropa(t), 'entrenar', 'data-tipo="' + t + '"', T('entrenar')) +
        (na < ARMADURA.max ? botonCosto(costoArmadura(na), 'armadura', 'data-tipo="' + t + '" title="' + T('armadura_sube', { n: na + 1, v: Math.round(ARMADURA.vida * 100 * (na + 1)), d: Math.round(ARMADURA.defensa * 100 * (na + 1)) }) + '"', '🛡️ ' + T('armadura') + ' ' + (na + 1) + ' ').replace('class="comprar"', 'class="comprar armadura"')
          : '<span class="nivel-arm">' + T('armadura_max') + '</span>') + '</div></div>';
    });
    html += '</div><div class="cola" id="cola"></div>';
    abrirPanel(T('p_heroes'), html, { tipo: 'tropas' });
  }

  function abrirPanelInvocar() {
    var d = TROPAS.heroe;
    var html = subtabsHeroes('invocar') + '<div class="lista">' +
      '<div class="carta compacta"><div class="cab"><div class="foto">✨</div><div><h3>' + T('invocar3') + '</h3><p>' + T('invocar3_txt') + '</p></div></div>' +
      botonGemas(INVOCAR.tres, 'invocar3', '', T('p_invocar')) + '</div>' +
      '<div class="carta compacta"><div class="cab"><div class="foto">' + fotoHTML('heroe', '👑') + '</div><div><h3>' + N('heroe') + '</h3><p>' + T('heroe_txt') + '</p></div></div>' +
      '<div class="stats"><span>❤ ' + T('vida') + ' ' + d.vida + '</span><span>⚔ ' + T('dano') + ' ' + d.dano + '</span><span>✚ ' + T('cura') + ' ' + d.cura + '/s</span></div>' +
      botonGemas(INVOCAR.heroe, 'heroe', '', T('p_invocar')) + '</div></div>';
    abrirPanel(T('p_heroes'), html, { tipo: 'invocar' });
  }

  function abrirPanelEdificio(i) {
    var s = slots[i];
    slotElegido = i;
    var tipo = s.edificio ? s.edificio.tipo : s.obra.tipo;
    var nivel = s.edificio ? s.edificio.nivel : s.obra.nivel;
    var html = '<div class="carta"><div class="cab"><div class="foto">' + fotoHTML(tipo, EDIFICIOS[tipo].icono) + '</div><div><h3>' + N(tipo) + ' — ' + T('nivel_de', { n: nivel, m: NIVEL_MAX }) + '</h3><p>' + D(tipo) + '</p></div></div>';
    if (s.obra) {
      html += '<p class="nota">' + T('construyendo') + ' <span class="reloj-panel" id="reloj-obra" data-slot="' + i + '">⏱ ' + fmtTiempo((s.obra.total - s.obra.t) / velReal()) + '</span></p>';
    } else {
      html += '<div class="stats">' + statsEdificio(tipo, nivel) + '</div>';
      if (tipo === 'enfermeria') html += '<p class="nota">' + T('en_enfermeria', { n: totalHeridos() }) + '</p>';
      if (tipo === 'academia') html += '<button class="comprar naranja boton-oleada-grande" data-accion="investigacion">' + T('inv_abrir') + '</button>';
      if (nivel < NIVEL_MAX) {
        html += '<p class="nota"><b>' + T('sube_a', { n: nivel + 1 }) + '</b></p><div class="stats">' + statsEdificio(tipo, nivel + 1) + '<span>⏱ ' + Math.round(EDIFICIOS[tipo].tiempo[nivel] * (1 - bono('obras'))) + 's</span></div>' +
          botonCosto(costoEdif(tipo, nivel), 'mejorar', 'data-slot="' + i + '"', T('mejorar'));
      } else html += '<p class="nota"><b>' + T('nivel_max') + ' ★★★</b></p>';
    }
    html += '</div>';
    abrirPanel(N(tipo), html, { tipo: 'edificio', slot: i });
  }

  function abrirPanelUnidad(u) {
    var d = u.d, nombre = N(u.tipo), aliado = u.aliado;
    var dano = aliado ? d.dano * (hambre ? COMIDA_TROPA.debilidad : 1) * (1 + bono('espadas')) : u.dano;
    var foto = retratos[u.tipo] ? '<img src="' + retratos[u.tipo] + '" alt="">' : (aliado ? '🛡️' : '👹');
    var frac = Math.max(0, u.vida / u.max);
    var html = '<div class="carta"><div class="ficha"><div class="foto">' + foto + '</div><div style="flex:1">' +
      '<h3>' + nombre + '</h3><p>' + (aliado ? T('t_aliada') : T('t_enemigo')) + (NOMBRES[u.tipo].des_es ? ' — ' + D(u.tipo) : '') + '</p>' +
      '<div class="vida-grande' + (aliado ? '' : ' enemigo') + '"><div style="width:' + (frac * 100) + '%"></div></div>' +
      '<div class="stats"><span>❤ ' + T('vida') + ' ' + Math.ceil(u.vida) + ' / ' + Math.ceil(u.max) + '</span>' +
      '<span>⚔ ' + T('dano') + ' ' + Math.round(dano) + '</span><span>🎯 ' + T('alcance') + ' ' + d.alcance + '</span>' +
      '<span>⏱ ' + T('t_ritmo', { s: d.ritmo }) + '</span><span>👟 ' + T('t_lenta') + ' ' + d.vel + '</span>' +
      (!aliado && d.oro ? '<span>🪙 ' + T('t_oro', { n: d.oro }) + '</span>' : '') + '</div>' +
      (u.armadura ? '<p class="nota nivel-arm">🛡️ ' + T('armadura') + ' ' + u.armadura + ' — ' + T('defensa') + ' ' + Math.round(u.defensa * 100) + '%</p>' : '') +
      (u.invocada ? '<p class="nota">✨ ' + T('t_invocada') + '</p>' : '') +
      (u.tipo === 'heroe' ? '<p class="nota">👑 ' + T('t_heroe') + '</p>' : '') +
      (aliado && hambre ? '<p class="nota aviso-rojo">🍞 ' + T('t_hambre') + '</p>' : '') +
      '</div></div></div>';
    abrirPanel(nombre, html, { tipo: 'unidad' });
  }
  // ---------- INVESTIGACIÓN ----------
  var ramaInv = 'crecimiento';
  function academiaLista() { return slots.filter(function (s) { return s.edificio && s.edificio.tipo === 'academia'; }).sort(function (a, b) { return b.edificio.nivel - a.edificio.nivel; })[0]; }
  function buscarTec(id) { for (var r in INVESTIGACION) for (var k = 0; k < INVESTIGACION[r].length; k++) if (INVESTIGACION[r][k].id === id) return INVESTIGACION[r][k]; return null; }
  function textoTec(t, lv) { var v = t.cada * lv; return D('inv_' + t.id).replace('{v}', t.cada >= 1 ? v : Math.round(v * 100)); }
  function abrirPanelInvestigacion(rama) {
    ramaInv = rama || ramaInv;
    var aca = academiaLista();
    var html = '<div class="subtabs">' + ['crecimiento', 'economia', 'batalla'].map(function (r) {
      return '<button data-accion="investigacion" data-rama="' + r + '" class="' + (r === ramaInv ? 'activo' : '') + '">' + ({ crecimiento: '🌱', economia: '💰', batalla: '⚔️' })[r] + ' ' + T('rama_' + r) + '</button>';
    }).join('') + '</div>';
    if (!aca) html += '<p class="nota aviso-rojo">' + T('inv_necesitas') + '</p>';
    else html += '<p class="nota">' + T('inv_txt') + '</p>';
    var inv = estado.investigando;
    if (inv) {
      var tc = buscarTec(inv.id), frac = Math.min(1, inv.t / inv.total);
      html += '<div class="carta"><b>' + tc.icono + ' ' + T('inv_en_curso', { n: N('inv_' + inv.id), l: inv.nivel }) + '</b>' +
        '<div class="cola"><div class="barra"><div id="inv-barra" style="width:' + Math.round(frac * 100) + '%"></div></div></div>' +
        '<p class="nota reloj-panel" id="inv-falta">⏱ ' + T('faltan_t', { t: fmtTiempo(faltaInvestigacion()) }) + '</p></div>';
    }
    html += '<div class="lista">';
    var tope = aca ? EDIFICIOS.academia.tope[aca.edificio.nivel - 1] : 0;
    INVESTIGACION[ramaInv].forEach(function (t) {
      var lv = estado.invest[t.id] || 0, sig = lv + 1;
      html += '<div class="carta compacta" title="' + textoTec(t, 1) + '"><div class="cab"><div class="foto">' + t.icono + '</div><div><h3>' + N('inv_' + t.id) + '</h3></div></div>' +
        '<div class="stats"><span>⭐ ' + lv + '/' + t.max + '</span>' +
        (lv ? '<span>' + T('inv_ahora') + ': ' + textoTec(t, lv) + '</span>' : '') +
        (lv < t.max ? '<span>' + T('inv_siguiente') + ': ' + textoTec(t, sig) + '</span>' : '<span>' + T('nivel_max') + '</span>') + '</div>';
      if (lv < t.max) {
        if (aca && sig > tope) html += '<span class="nota aviso-rojo" style="grid-area:boton">' + T('inv_tope', { n: tope }) + '</span>';
        else html += botonCosto(costoInvestigacion(sig), 'investigar', 'data-id="' + t.id + '"' + (!aca || inv ? ' disabled' : ''), T('investigar') + ' ⏱' + tiempoInvestigacion(sig) + 's ');
      }
      html += '</div>';
    });
    abrirPanel(T('p_investigar'), html + '</div>', { tipo: 'investigacion', rama: ramaInv });
  }
  function empezarInvestigacion(id) {
    if (estado.investigando) { consejoTemporal(T('inv_ocupada')); sonar('error'); return; }
    if (!academiaLista()) { consejoTemporal(T('inv_necesitas')); sonar('error'); return; }
    var sig = (estado.invest[id] || 0) + 1;
    if (!pagar(costoInvestigacion(sig))) return;
    estado.investigando = { id: id, nivel: sig, t: 0, total: tiempoInvestigacion(sig) };
    sonar('martillo');
    guardar(true);
    reabrirPanel();
  }
  function terminarInvestigacion() {
    var inv = estado.investigando; estado.investigando = null;
    var antesCastillo = vidaMaxCastillo();
    estado.invest[inv.id] = inv.nivel;
    // aplicar lo que mejoró a lo que ya existe
    if (inv.id === 'escudos') tropas.forEach(function (u) { if (u.tipo === 'heroe') return; var f = u.vida / u.max; u.max = vidaTropa(u.tipo, u.armadura); u.vida = f * u.max; });
    if (inv.id === 'muros') {
      estado.vidaCastillo += vidaMaxCastillo() - antesCastillo;
      barricadas.forEach(function (b) { if (b.nivel) { var f = b.vida / b.max; b.max = Math.round(BARRICADA.vida[b.nivel - 1] * (1 + bono('muros'))); b.vida = f * b.max; } });
    }
    var aca = academiaLista();
    if (aca) chispas(aca.pos.clone().setY(4), 0x9fc8ff, 20, 4);
    sonar('listo');
    consejoTemporal(T('inv_lista', { n: N('inv_' + inv.id), l: inv.nivel }));
    actualizarHUD();
    guardar(true);
    if (panelActual && panelActual.tipo === 'investigacion') reabrirPanel();
  }
  // ---------- RELOJES ----------
  function fmtTiempo(seg) {
    var s = Math.max(0, Math.ceil(seg)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + ss).slice(-2);
  }
  function velReal() { return Math.max(velocidad, 0.0001); }
  function faltaEntreno() {
    var r = rapidezEntreno() * velReal(), t = 0;
    colaEntreno.forEach(function (c) { t += (c.total - c.t) / r; });
    return t;
  }
  function faltaInvestigacion() {
    var ii = estado.investigando, ia = academiaLista();
    if (!ii) return 0;
    return (ii.total - ii.t) / ((ia ? EDIFICIOS.academia.rapidez[ia.edificio.nivel - 1] : 1) * velReal());
  }
  function segHastaManana() { var a = new Date(), m = new Date(a); m.setHours(24, 0, 0, 0); return (m - a) / 1000; }
  var relojesDiv = {}, vRel = new V3();
  function ponerReloj(id, pos, texto) {
    var d = relojesDiv[id];
    if (!d) { d = document.createElement('div'); d.className = 'reloj'; $('relojes').appendChild(d); relojesDiv[id] = d; }
    vRel.copy(pos).project(camara);
    if (vRel.z > 1) { d.classList.add('oculto'); return; }
    d.classList.remove('oculto');
    d.style.left = ((vRel.x + 1) / 2 * window.innerWidth) + 'px';
    d.style.top = ((1 - vRel.y) / 2 * window.innerHeight) + 'px';
    if (d.textContent !== texto) d.textContent = texto;
    d.dataset.vivo = '1';
  }
  function actualizarRelojes() {
    for (var k in relojesDiv) relojesDiv[k].dataset.vivo = '';
    if (!enMenu && !enMundo) {
      slots.forEach(function (s) {
        if (s.obra) ponerReloj('obra' + s.i, s.pos.clone().setY(6), '🔨 ' + fmtTiempo((s.obra.total - s.obra.t) / velReal()));
      });
      if (colaEntreno.length) {
        var cu = cuartelesListos()[0];
        if (cu) ponerReloj('entreno', cu.pos.clone().setY(6.4), '⚔️ ' + fmtTiempo(faltaEntreno()) + ' ×' + colaEntreno.length);
      }
      if (estado.investigando) {
        var ac = academiaLista();
        if (ac) ponerReloj('inv', ac.pos.clone().setY(6.6), '📜 ' + fmtTiempo(faltaInvestigacion()));
      }
      if (obraMuralla) ponerReloj('muralla', new V3(0, 12.5, 0), '🧱 ' + fmtTiempo((obraMuralla.total - obraMuralla.t) / velReal()));
    }
    for (var k2 in relojesDiv) if (!relojesDiv[k2].dataset.vivo) relojesDiv[k2].classList.add('oculto');
  }
  // ---------- ATAQUES ENTRE JUGADORES ----------
  function valorTropa(u) { return u.max * 0.5 + u.d.dano * 5 * (1 + bono('espadas')) * (1 + (u.defensa || 0)); }
  function fuerzaEjercito() { return Math.round(tropas.reduce(function (a, u) { return a + valorTropa(u); }, 0)); }
  function defensaReino() {
    var d = vidaMaxCastillo() / 8 + CASTILLO.dano * 8;
    slots.forEach(function (s) { if (s.edificio && s.edificio.tipo === 'torre') d += EDIFICIOS.torre.dano[s.edificio.nivel - 1] * (1 + bono('flechas')) * 6; });
    barricadas.forEach(function (b) { if (b.nivel) d += b.max / 10; });
    d += fuerzaEjercito() * 0.8;
    return Math.round(d);
  }
  function botinMaximo(nivel) {
    var n = Math.max(1, nivel || 1);
    return { oro: Math.min(5000, 60 + 30 * n), comida: Math.min(5000, 50 + 25 * n), madera: Math.min(5000, 50 + 25 * n), piedra: Math.min(5000, 20 + 12 * n) };
  }
  function textoBotin(b) { return ['oro', 'comida', 'madera', 'piedra'].filter(function (r) { return b[r]; }).map(function (r) { return '+' + b[r] + ' ' + ICONO_RECURSO[r]; }).join(', ') || '—'; }
  function puedeAtacar(a) {
    if (!hayCuenta()) return T('at_cuenta');
    if (estado.dueno) return T('at_dueno');
    if ((a.escudo || 0) > Date.now()) return T('at_protegido', { t: fmtTiempo((a.escudo - Date.now()) / 1000) });
    if (estado.alianza && a.alianza === estado.alianza) return T('at_aliado');
    var cd = (estado.cdAtaque || {})[a.uid] || 0;
    if (cd > Date.now()) return T('at_espera', { t: fmtTiempo((cd - Date.now()) / 1000) });
    if (!tropas.length) return T('at_sin_tropas');
    return '';
  }
  function abrirAtaque(a) {
    var no = puedeAtacar(a);
    if (no) { $('mundo-info').innerHTML = '<div class="carta"><p class="aviso-rojo"><b>' + no + '</b></p></div>'; sonar('error'); return; }
    var f = fuerzaEjercito(), d = a.defensa || 0, prop = d ? f / d : 3;
    var dif = prop > 1.3 ? T('at_facil') : prop > 0.85 ? T('at_parejo') : T('at_dificil');
    $('mundo-info').innerHTML = '<div class="carta"><h3>⚔️ ' + T('at_titulo', { n: escaparHTML(a.nombre) }) + '</h3>' +
      '<div class="stats"><span>🛡️ ' + T('at_fuerza') + ': ' + formatoNumero(f) + '</span><span>🏰 ' + T('at_defensa') + ': ' + formatoNumero(Math.round(d / 100) * 100) + '</span><span><b>' + dif + '</b></span></div>' +
      '<p class="nota">' + T('at_botin') + ': ' + textoBotin(botinMaximo(a.nivel)) + '</p><p class="nota">' + T('at_nota') + '</p>' +
      '<button class="comprar rojo boton-oleada-grande" id="btn-atacar-ya">' + T('atacar_ya') + '</button></div>';
    $('btn-atacar-ya').addEventListener('click', function () { this.disabled = true; realizarAtaque(a); });
  }
  function realizarAtaque(a) {
    var no = puedeAtacar(a);
    if (no) { abrirAtaque(a); return; }
    var f = fuerzaEjercito(), d = Math.max(1, a.defensa || 1);
    var fa = f * (0.85 + Math.random() * 0.3), fd = d * (0.85 + Math.random() * 0.3);
    var gano = fa > fd;
    var bajasFrac = gano ? Math.min(0.6, Math.max(0.1, fd / fa * 0.5)) : Math.min(1, Math.max(0.4, fd / fa * 0.6));
    var bm = botinMaximo(a.nivel), margen = gano ? Math.min(1, 0.5 + (fa - fd) / fd) : 0;
    var botin = { oro: Math.floor(bm.oro * margen), comida: Math.floor(bm.comida * margen), madera: Math.floor(bm.madera * margen), piedra: Math.floor(bm.piedra * margen) };
    $('mundo-info').innerHTML = '<div class="carta"><h3>' + T('at_batalla') + '</h3><p style="font-size:34px;text-align:center;margin:6px 0">⚔️ 🛡️ ⚔️</p></div>';
    sonar('cuerno');
    var reporte = { atacante: Cuentas.usuario().uid, atacanteNombre: Cuentas.nombrePublico(), defensor: a.uid, defensorNombre: String(a.nombre).slice(0, 30),
      gano: gano, botin: botin, fuerza: Math.round(f), defensa: Math.round(d), fecha: Date.now(), visto: false };
    Cuentas.atacar(reporte).then(function () {
      // bajas: algunas tropas caen (las normales pueden ir a la Enfermería)
      var vivos = tropas.slice(), nb = Math.round(vivos.length * bajasFrac), caidas = 0;
      vivos.sort(function () { return Math.random() - 0.5; });
      for (var i = 0; i < nb && i < vivos.length; i++) { vivos[i].vida = 0; morir(vivos[i]); caidas++; }
      if (gano) { ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (botin[r]) sumarRecurso(r, botin[r]); }); sonar('victoria'); }
      else sonar('derrota');
      estado.escudoHasta = 0; // atacar quita tu protección
      estado.cdAtaque = estado.cdAtaque || {}; estado.cdAtaque[a.uid] = Date.now() + 10 * 60 * 1000;
      guardar(true); publicarAldea(true); actualizarEscudo();
      setTimeout(function () {
        $('mundo-info').innerHTML = '<div class="carta"><h3>' + (gano ? T('at_gano', { b: textoBotin(botin) }) : T('at_perdio')) + '</h3><p class="nota">' + T('at_bajas', { n: caidas }) + '</p></div>';
      }, 1600);
    }).catch(function () { $('mundo-info').innerHTML = '<div class="carta"><p class="aviso-rojo"><b>' + T('at_error') + '</b></p></div>'; sonar('error'); });
  }
  // El defensor revisa si lo atacaron (al entrar y cada minuto)
  var ultimaRevision = 0, revisando = false;
  function revisarAtaques(forzar) {
    if (!hayCuenta() || enMenu || revisando) return;
    if (!forzar && Date.now() - ultimaRevision < 60000) return;
    ultimaRevision = Date.now(); revisando = true;
    Cuentas.ataquesNuevos().then(function (lista) {
      revisando = false;
      if (!lista.length) return;
      var perdio = false, html = '';
      lista.sort(function (a, b) { return a.fecha - b.fecha; }).forEach(function (r) {
        html += '<div class="carta" style="margin-bottom:8px"><h3>' + T('rep_te_ataco', { n: escaparHTML(r.atacanteNombre) }) + '</h3>';
        if (r.gano) {
          perdio = true;
          var real = {};
          ['oro', 'comida', 'madera', 'piedra'].forEach(function (k) {
            var q = Math.min(cantidad(k), r.botin[k] || 0);
            if (!estado.oroInfinito) estado[claveRecurso(k)] = cantidad(k) - q;
            real[k] = q;
          });
          html += '<p class="aviso-rojo">' + T('rep_perdiste', { b: textoBotin(real).replace(/\+/g, '-') }) + '</p>';
        } else html += '<p><b>' + T('rep_resististe') + '</b></p>';
        html += '<p class="nota">' + new Date(r.fecha).toLocaleString() + '</p></div>';
        Cuentas.marcarVisto(r.id).catch(function () {});
      });
      if (perdio && !protegido()) { estado.escudoHasta = Date.now() + 30 * 60 * 1000; html += '<p class="nota">🛡️ ' + T('rep_escudo') + '</p>'; }
      actualizarHUD(); guardar(true); publicarAldea(true); actualizarEscudo();
      abrirPanel(T('rep_titulo'), html, { tipo: 'reporte' });
      sonar(perdio ? 'derrota' : 'victoria');
    }).catch(function () { revisando = false; });
  }

  // ---------- PROTECCIÓN (escudo) ----------
  var cupulaEscudo = new THREE.Mesh(new THREE.SphereGeometry(9.5, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x6fb7ff, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  cupulaEscudo.visible = false;
  escena.add(cupulaEscudo);
  function protegido() { return (estado.escudoHasta || 0) > Date.now(); }
  function actualizarEscudo() {
    var on = protegido() && !enMenu;
    cupulaEscudo.visible = on;
    $('pill-escudo').classList.toggle('oculto-pill', !on);
    if (on) $('escudo-t').textContent = fmtTiempo((estado.escudoHasta - Date.now()) / 1000);
  }
  $('pill-escudo').addEventListener('click', function () { consejoTemporal(T('escudo_info')); });
  function subtabsHeroes(cual) {
    return '<div class="subtabs"><button data-accion="sub-tropas" class="' + (cual === 'tropas' ? 'activo' : '') + '">⚔️ ' + T('sub_tropas') + '</button>' +
      '<button data-accion="sub-invocar" class="' + (cual === 'invocar' ? 'activo' : '') + '">✨ ' + T('sub_invocar') + '</button></div>';
  }
  // ---------- CONQUISTA (oleadas) ----------
  function abrirPanelConquista() {
    var n = oleadaActiva ? oleadaActual : estado.oleada, total = OLEADAS.length;
    var puntos = '<div class="oleada-puntos">';
    for (var i = 1; i <= total; i++) puntos += '<span class="' + (i < n || (i === n && false) ? 'hecha' : i === n ? 'ahora' : '') + '">' + (i < n ? '✓' : i) + '</span>';
    puntos += '</div>';
    var o = composicion(n), vienen = '';
    ['trasgo', 'bruto', 'ogro'].forEach(function (k) {
      if (o[k]) vienen += '<span>' + (retratos[k] ? '<img src="' + retratos[k] + '" alt="" style="width:28px;height:28px;vertical-align:middle">' : '👹') + ' ' + N(k) + ' ×' + o[k] + '</span>';
    });
    var premio = GEMAS_POR_OLEADA + (n === total && !estado.infinito ? GEMAS_VICTORIA : 0);
    var html = '<div class="carta"><h3>⚔️ ' + T('oleada') + ' ' + (estado.infinito || n > total ? n : n + ' / ' + total) + '</h3><p>' + T('conquista_txt') + '</p>' +
      (n <= total ? puntos : '') +
      '<p class="nota"><b>' + T('vienen') + '</b></p><div class="stats">' + vienen + '<span>' + T('premio', { g: premio }) + '</span></div>' +
      '<div class="stats" style="margin-top:6px"><span>❤ ' + T('castillo') + ' ' + Math.ceil(estado.vidaCastillo) + ' / ' + vidaMaxCastillo() + '</span><span>🛡️ ' + textoTropas() + '</span></div>';
    if (oleadaActiva) html += '<p class="nota aviso-rojo"><b>' + T('oleada_curso', { n: enemigos.length + colaSpawn.length }) + '</b></p>';
    else html += '<button class="comprar rojo boton-oleada-grande" data-accion="empezar-oleada">⚔️ ' + T('empezar_oleada', { n: estado.oleada }) + '</button>';
    abrirPanel(T('p_conquista'), html + '</div>', { tipo: 'conquista' });
  }
  // ---------- COFRE DIARIO ----------
  function fechaLocal(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function hoy() { return fechaLocal(new Date()); }
  function ayer() { var d = new Date(); d.setDate(d.getDate() - 1); return fechaLocal(d); }
  function diarioDisponible() { return estado.diario && estado.diario.ultimo !== hoy(); }
  function rachaDeHoy() { var di = estado.diario || {}; return di.ultimo === ayer() ? (di.racha || 0) + 1 : (di.ultimo === hoy() ? di.racha : 1); }
  function textoPremio(p) {
    var partes = [];
    ['oro', 'comida', 'madera', 'piedra', 'gemas'].forEach(function (r) { if (p[r]) partes.push('+' + p[r] + ' ' + ICONO_RECURSO[r]); });
    if (p.objeto) partes.push(OBJETOS[p.objeto].icono + ' ' + N(p.objeto));
    if (p.tropas) { var n = 0; for (var k in p.tropas) n += p.tropas[k]; partes.push('🛡️ ' + T('tropas_regalo', { n: n })); }
    return partes.join(', ');
  }
  function darPremio(p) {
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (p[r]) sumarRecurso(r, p[r]); });
    if (p.gemas) sumarGemas(p.gemas);
    if (p.objeto) estado.mochila[p.objeto] = (estado.mochila[p.objeto] || 0) + 1;
    if (p.tropas) Object.keys(p.tropas).forEach(function (t) { for (var k = 0; k < p.tropas[t]; k++) crearTropa(t, reunion.clone().add(new V3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3)), true); });
    actualizarHUD();
  }
  function reclamarDiario() {
    if (!diarioDisponible()) return;
    var racha = rachaDeHoy(), p = COFRE_DIARIO[(racha - 1) % COFRE_DIARIO.length];
    estado.diario = { ultimo: hoy(), racha: racha };
    darPremio(p);
    sonar('gemas'); sonar('listo');
    chispas(castilloPos.clone().setY(6), 0xffe14a, 30, 5);
    consejoTemporal(T('recibiste', { t: textoPremio(p) }));
    guardar(true);
    reabrirPanel();
  }
  // ---------- MOCHILA ----------
  function abrirPanelMochila() {
    var racha = rachaDeHoy(), disp = diarioDisponible();
    var cal = '<div class="diario">';
    for (var i = 1; i <= 7; i++) {
      var p = COFRE_DIARIO[i - 1], ic = p.objeto ? OBJETOS[p.objeto].icono : p.tropas ? '🛡️' : p.gemas ? '💎' : p.oro ? '🪙' : '🪵';
      var enCiclo = ((racha - 1) % 7) + 1;
      var cls = disp ? (i < enCiclo ? 'hecho' : i === enCiclo ? 'hoy' : '') : (i <= enCiclo ? 'hecho' : '');
      cal += '<div class="dia ' + cls + '"><span class="ic">' + ic + '</span>' + T('diario_dia', { n: i }) + '</div>';
    }
    cal += '</div>';
    var html = '<div class="carta"><h3>🎁 ' + T('diario_titulo') + '</h3><p>' + T('diario_txt') + '</p>' + cal +
      '<p class="nota"><b>' + T('diario_racha', { n: disp ? racha - 1 : racha }) + '</b></p>' +
      (disp ? '<p class="nota">' + textoPremio(COFRE_DIARIO[(racha - 1) % 7]) + '</p><button class="comprar naranja boton-oleada-grande" data-accion="diario">' + T('diario_reclamar', { n: racha }) + '</button>'
            : '<p class="nota">' + T('diario_listo', { n: racha + 1 }) + '</p><p class="reloj-panel" id="reloj-diario">' + T('proximo_cofre', { t: fmtTiempo(segHastaManana()) }) + '</p>') + '</div>';
    var objs = Object.keys(OBJETOS).filter(function (k) { return estado.mochila[k] > 0; });
    html += '<div class="carta" style="margin-top:10px"><h3>🎒 ' + T('mis_objetos') + '</h3>';
    if (!objs.length) html += '<p>' + T('mochila_vacia') + '</p>';
    else {
      html += '<div class="lista">';
      objs.forEach(function (k) {
        html += '<div class="carta compacta" title="' + D(k) + '"><div class="cab"><div class="foto">' + OBJETOS[k].icono + '</div><div><h3>' + N(k) + ' ×' + estado.mochila[k] + '</h3></div></div>' +
          '<div class="stats"><span>' + D(k) + '</span></div><button class="comprar" data-accion="usar" data-obj="' + k + '">' + (OBJETOS[k].cofre ? T('abrir') : T('usar')) + '</button></div>';
      });
      html += '</div>';
    }
    abrirPanel(T('p_mochila'), html + '</div>', { tipo: 'mochila' });
  }
  function usarObjeto(k) {
    if (!(estado.mochila[k] > 0)) return;
    var o = OBJETOS[k], premio = null;
    if (o.escudo) {
      estado.escudoHasta = Math.max(Date.now(), estado.escudoHasta || 0) + o.escudo * 3600 * 1000;
      estado.mochila[k]--;
      sonar('magia');
      consejoTemporal(T('escudo_usado', { t: fmtTiempo((estado.escudoHasta - Date.now()) / 1000) }));
      guardar(true); publicarAldea(true); actualizarEscudo();
      reabrirPanel();
      return;
    }
    if (o.acelera) {
      var algo = slots.some(function (s) { return s.obra; }) || obraMuralla || colaEntreno.length || estado.investigando;
      if (estado.investigando) estado.investigando.t = estado.investigando.total;
      if (!algo) { consejoTemporal(T('nada_acelerar')); sonar('error'); return; }
      slots.forEach(function (s) { if (s.obra) s.obra.t = s.obra.total; });
      if (obraMuralla) obraMuralla.t = obraMuralla.total;
      colaEntreno.forEach(function (c) { c.t = c.total; });
      // el entrenamiento sale de a uno por cuadro: lo sacamos todo ya
      while (colaEntreno.length) { var c = colaEntreno.shift(); crearTropa(c.tipo, puertaCuartel()); }
      consejoTemporal(T('acelerador_usado'));
    } else if (o.da) { premio = o.da; }
    else if (o.cofre) {
      premio = {};
      Object.keys(o.cofre).forEach(function (r) { var a = o.cofre[r]; premio[r] = a[0] + Math.floor(Math.random() * (a[1] - a[0] + 1)); });
      chispas(castilloPos.clone().setY(6), 0xffe14a, 24, 5);
    }
    estado.mochila[k]--;
    if (premio) { darPremio(premio); consejoTemporal(T('recibiste', { t: textoPremio(premio) })); }
    sonar('gemas');
    guardar(true);
    reabrirPanel();
  }
  // ---------- TIENDA ----------
  function abrirPanelTienda() {
    var html = '<p class="nota">' + T('tienda_txt') + '</p><div class="lista">';
    TIENDA.forEach(function (it, i) {
      html += '<div class="carta compacta" title="' + D(it.id) + '"><div class="cab"><div class="foto">' + OBJETOS[it.id].icono + '</div><div><h3>' + N(it.id) + '</h3></div></div>' +
        '<div class="stats"><span>' + D(it.id) + '</span></div>' + botonGemas(it.gemas, 'comprar', 'data-i="' + i + '"', T('comprar')) + '</div>';
    });
    html += '</div><p class="nota" style="opacity:.75">💳 ' + T('tienda_real') + '</p>';
    abrirPanel(T('p_tienda'), html, { tipo: 'tienda' });
  }
  function comprarTienda(i) {
    var it = TIENDA[i];
    if (!it || !pagar(0, it.gemas)) return;
    estado.mochila[it.id] = (estado.mochila[it.id] || 0) + 1;
    sonar('moneda');
    consejoTemporal(T('comprado', { n: N(it.id) }));
    guardar(true);
    reabrirPanel();
  }
  // ---------- AVISOS (numeritos) del menú ----------
  function ponerBadge(id, txt) { var e = $(id); if (e && e.textContent !== String(txt)) e.textContent = txt; }
  function actualizarBadges() {
    ponerBadge('badge-conquista', !oleadaActiva && !enMenu ? '!' : '');
    var puedeEntrenar = cuartelesListos().length && tropasOcupadas() < capacidad() && !colaEntreno.length && puedePagar(costoTropa('espadachin'));
    ponerBadge('badge-heroes', puedeEntrenar ? '+' : '');
    var objetos = 0; for (var k in estado.mochila) objetos += estado.mochila[k] || 0;
    ponerBadge('badge-mochila', (diarioDisponible() ? 1 : 0) + objetos || '');
    ponerBadge('badge-alianza', hayCuenta() && !estado.alianza ? '!' : '');
    // pestaña activa
    var act = enMundo ? 'btn-mundo' : !panelActual ? '' : ({ conquista: 'btn-conquista', tropas: 'btn-heroes', invocar: 'btn-heroes', mochila: 'btn-mochila', tienda: 'btn-tienda', alianza: 'btn-alianza' })[panelActual.tipo] || '';
    document.querySelectorAll('#abajo .pestana').forEach(function (p) { p.classList.toggle('activo', p.id === act); });
  }
  function abrirPanelPoder() {
    var pt = 0, pe = 0;
    tropas.forEach(function (u) { pt += Math.round(u.d.vida * 2 + u.d.dano * 25); });
    slots.forEach(function (s) { if (s.edificio) pe += s.edificio.nivel * 450; });
    pe += estado.muralla * 600;
    var html = '<div class="carta"><p>' + T('poder_txt') + '</p><div class="stats">' +
      '<span>🛡️ ' + T('poder_tropas') + ': ' + formatoNumero(pt) + '</span>' +
      '<span>🏠 ' + T('poder_edificios') + ': ' + formatoNumero(pe) + '</span>' +
      '<span>⚔️ ' + T('poder_oleadas') + ': ' + formatoNumero((estado.oleada - 1) * 1000) + '</span>' +
      '</div><p class="nota">' + T('nivel_txt') + '</p></div>';
    abrirPanel(T('poder_titulo') + ' — ' + formatoNumero(calcularPoder()), html, { tipo: 'poder' });
  }
  $('perfil').addEventListener('click', function () { if (enMenu) return; sonar('click'); if (panelActual && panelActual.tipo === 'poder') cerrarPanel(); else abrirPanelPoder(); });
  function abrirPanelCastillo() {
    var html = '<div class="carta"><div class="cab"><div class="foto">' + fotoHTML('castillo', '🏰') + '</div><div><h3>' + T('castillo') + '</h3><p>' + T('castillo_info') + '</p></div></div>' +
      '<div class="stats"><span>❤ ' + T('vida') + ' ' + Math.ceil(estado.vidaCastillo) + ' / ' + vidaMaxCastillo() + '</span><span>⚔ ' + T('dano') + ' ' + CASTILLO.dano + '</span><span>🎯 ' + T('alcance') + ' ' + CASTILLO.alcance + '</span></div></div>' +
      '<p class="nota">🪙 ' + T('impuesto', { n: IMPUESTO.oro, s: IMPUESTO.cada }) + '</p>' +
      '<div class="lista" style="margin-top:10px">' + htmlMuralla() + '</div>';
    abrirPanel(T('castillo'), html, { tipo: 'castillo' });
  }

  function escaparHTML(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------------- MODO DUEÑO (solo pruebas) ----------------
  function activarModoDueno(correo) {
    if (!MODO_DUENO_ACTIVO) return;
    estado.dueno = true;
    if (correo) estado.correo = correo;
    estado.oroInfinito = true;
    estado.gemasInfinitas = true;
    cambiarVelocidad(10);
    actualizarHUD();
    consejoTemporal(T('dueno_activo'));
    sonar('magia');
    guardarPreferencias();
  }
  function salirModoDueno() {
    estado.dueno = false; estado.oroInfinito = false; estado.gemasInfinitas = false; estado.correo = '';
    cambiarVelocidad(1);
    actualizarHUD();
    guardarPreferencias();
  }
  function esCuentaDueno() { return !!(window.Cuentas && Cuentas.usuario() && HUELLAS_DUENO.indexOf(sha256(Cuentas.correo().toLowerCase())) >= 0); }
  ['monedas', 'comida', 'madera', 'piedra', 'gemas'].forEach(function (id) {
    $('pill-' + id).addEventListener('click', function () { if (enMenu) return; consejoTemporal(T('info_' + (id === 'monedas' ? 'oro' : id))); });
  });
  // 5 toques seguidos en el oro
  var toquesOro = [];
  $('pill-monedas').addEventListener('click', function () {
    if (!TOQUES_DUENO_ACTIVO || enMenu) return;
    var ahora = performance.now();
    toquesOro = toquesOro.filter(function (t) { return ahora - t < 2500; });
    toquesOro.push(ahora);
    if (toquesOro.length >= 5) { toquesOro = []; if (!estado.dueno) activarModoDueno(); else consejoTemporal(T('dueno_activo')); }
  });

  // SHA-256: compara el correo sin tenerlo escrito en el código
  function sha256(texto) {
    var K = [], H = [], primos = 0, n = 2;
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
    while (primos < 64) {
      var esPrimo = true;
      for (var d = 2; d * d <= n; d++) if (n % d === 0) { esPrimo = false; break; }
      if (esPrimo) { if (primos < 8) H[primos] = frac(Math.pow(n, 1 / 2)); K[primos] = frac(Math.pow(n, 1 / 3)); primos++; }
      n++;
    }
    var bytes = unescape(encodeURIComponent(texto)), largoBits = bytes.length * 8, w = [];
    bytes += String.fromCharCode(0x80);
    while (bytes.length % 64 !== 56) bytes += String.fromCharCode(0);
    for (var i = 0; i < bytes.length; i++) w[i >> 2] |= bytes.charCodeAt(i) << ((3 - i % 4) * 8);
    w.push((largoBits / 4294967296) | 0, largoBits | 0);
    function rot(x, b) { return (x >>> b) | (x << (32 - b)); }
    for (var j = 0; j < w.length; j += 16) {
      var W = w.slice(j, j + 16), a = H.slice(0);
      for (var t = 0; t < 64; t++) {
        if (t >= 16) {
          var s0 = rot(W[t - 15], 7) ^ rot(W[t - 15], 18) ^ (W[t - 15] >>> 3);
          var s1 = rot(W[t - 2], 17) ^ rot(W[t - 2], 19) ^ (W[t - 2] >>> 10);
          W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
        }
        var t1 = (a[7] + (rot(a[4], 6) ^ rot(a[4], 11) ^ rot(a[4], 25)) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + K[t] + W[t]) | 0;
        var t2 = ((rot(a[0], 2) ^ rot(a[0], 13) ^ rot(a[0], 22)) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]))) | 0;
        a = [(t1 + t2) | 0].concat(a.slice(0, 7));
        a[4] = (a[4] + t1) | 0;
      }
      for (var k = 0; k < 8; k++) H[k] = (H[k] + a[k]) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function abrirPanelAjustes() {
    var html = '<div class="lista">' +
      '<div class="carta"><h3>' + T('idioma') + '</h3><div class="stats">' +
      '<button class="comprar' + (estado.idioma === 'es' ? '' : ' morado') + '" data-accion="idioma" data-valor="es">Español</button>' +
      '<button class="comprar' + (estado.idioma === 'en' ? '' : ' morado') + '" data-accion="idioma" data-valor="en">English</button></div></div>' +
      '<div class="carta"><h3>' + T('sonido') + '</h3><button class="comprar" data-accion="sonido">' + (estado.sonido ? '🔊 ON' : '🔇 OFF') + '</button></div>' +
      '<div class="carta"><h3>' + T('velocidad') + '</h3><button class="comprar" data-accion="velocidad">x' + velocidad + '</button></div>' +
      '</div>';
    // Cuenta
    html += '<div class="carta" style="margin-top:10px"><h3>' + T('cuenta') + '</h3>';
    if (window.Cuentas && Cuentas.usuario()) {
      html += '<p>' + (esCuentaDueno() ? '<b>👑 ' + T('cuenta_dueno') + '</b>' : T('cuenta_de')) + '<br><b>' + escaparHTML(Cuentas.nombre()) + '</b> ☁️</p>' +
        '<div class="stats"><button class="comprar rojo" data-accion="cerrar-sesion">' + T('cerrar_sesion') + '</button>' +
        '<button class="comprar morado" data-accion="ver-borrar-cuenta">' + T('borrar_cuenta') + '</button></div>' +
        '<div id="caja-borrar" style="display:none;margin-top:8px"><p class="aviso-rojo">' + T('borrar_cuenta_txt') + '</p>' +
        '<input class="campo" id="clave-borrar" type="password" autocomplete="current-password" placeholder="' + T('contrasena') + '">' +
        '<p class="nota aviso-rojo" id="error-borrar"></p><button class="comprar rojo" data-accion="borrar-cuenta">' + T('borrar_cuenta_ok') + '</button></div>';
    } else {
      html += '<p>' + T('cuenta_jugador') + ' — ' + T('invitado_txt') + '</p><button class="comprar" data-accion="ir-cuenta">' + T('entrar_o_crear') + '</button>';
    }
    html += '</div>';
    if (estado.dueno) {
      html += '<div class="carta" style="margin-top:10px;border-color:#e09a10;background:#fff6dc"><h3>👑 ' + T('dueno_titulo') + '</h3><p>' + T('dueno_txt') + '</p>' +
        '<div class="stats">' +
        '<button class="comprar morado" data-accion="dueno-gemas">💎 ' + T('gemas_max') + '</button>' +
        '<button class="comprar oro" data-accion="dueno-oro">' + T('recursos_inf') + ': ' + (estado.oroInfinito ? T('encendido') : T('apagado')) + '</button>' +
        '<button class="comprar morado" data-accion="dueno-gemas-inf">' + T('gemas_inf') + ': ' + (estado.gemasInfinitas ? T('encendido') : T('apagado')) + '</button>' +
        '<button class="comprar naranja" data-accion="dueno-vel">⏩ ' + T('vel10') + (velocidad === 10 ? ' ✓' : '') + '</button>' +
        '<button class="comprar" data-accion="dueno-oleada">⚔️ ' + T('saltar_oleada') + '</button>' +
        '</div><div style="margin-top:8px"><button class="comprar rojo" data-accion="dueno-salir">' + T('salir_dueno') + '</button></div></div>';
    }
    html += '<div style="margin-top:10px"><button class="comprar rojo" data-accion="borrar">' + T('borrar') + '</button></div>' +
      '<p class="nota" style="text-align:center;opacity:.6"><a href="' + URL_PRIVACIDAD + '" target="_blank" rel="noopener">' + T('privacidad') + '</a> · ' + NOMBRE_JUEGO + ' · v1.8</p>';
    abrirPanel(T('p_ajustes'), html, { tipo: 'ajustes' });
  }

  // Botones dentro de los paneles
  $('panel-cuerpo').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-accion');
    if (a === 'construir') {
      var tipo = b.getAttribute('data-tipo');
      if (slotElegido !== null && !slots[slotElegido].edificio && !slots[slotElegido].obra) construir(slotElegido, tipo);
      else entrarModoColocar(tipo);
    } else if (a === 'mejorar') mejorar(+b.getAttribute('data-slot'));
    else if (a === 'muralla') construirMuralla();
    else if (a === 'barricada') entrarModoBarricada();
    else if (a === 'al-crear') crearAlianzaDesdePanel(b);
    else if (a === 'al-unirse') unirseAlianza(b.getAttribute('data-tag'), b);
    else if (a === 'al-salir') salirAlianza(b);
    else if (a === 'al-mapa') { cerrarPanel(); abrirMundo(); }
    else if (a === 'mejorar-barricada') { var bi = +b.getAttribute('data-barr'); if (pagar(costoBarricada(1))) { ponerBarricada(bi, 2); sonar('listo'); cerrarPanel(); guardar(); } }
    else if (a === 'entrenar') entrenar(b.getAttribute('data-tipo'));
    else if (a === 'armadura') mejorarArmadura(b.getAttribute('data-tipo'));
    else if (a === 'sub-tropas') abrirPanelTropas();
    else if (a === 'investigacion') abrirPanelInvestigacion(b.getAttribute('data-rama') || ramaInv);
    else if (a === 'investigar') empezarInvestigacion(b.getAttribute('data-id'));
    else if (a === 'sub-invocar') abrirPanelInvocar();
    else if (a === 'empezar-oleada') { cerrarPanel(); empezarOleada(); }
    else if (a === 'diario') reclamarDiario();
    else if (a === 'usar') usarObjeto(b.getAttribute('data-obj'));
    else if (a === 'comprar') comprarTienda(+b.getAttribute('data-i'));
    else if (a === 'invocar3') invocarTres();
    else if (a === 'heroe') invocarHeroe();
    else if (a === 'idioma') { estado.idioma = b.getAttribute('data-valor'); aplicarIdioma(); guardarPreferencias(); reabrirPanel(); }
    else if (a === 'sonido') { cambiarSonido(); reabrirPanel(); }
    else if (a === 'velocidad') { cambiarVelocidad(); reabrirPanel(); }
    else if (a === 'cerrar-sesion') { guardar(true); cerrarPanel(); Cuentas.salir(); }
    else if (a === 'ver-borrar-cuenta') { $('caja-borrar').style.display = 'block'; $('clave-borrar').focus(); }
    else if (a === 'borrar-cuenta') {
      var clave = $('clave-borrar').value;
      if (!clave) return;
      b.disabled = true;
      Cuentas.borrarCuenta(clave).then(function () {
        cerrarPanel(); consejoTemporal(T('cuenta_borrada'));
      }).catch(function (err) { b.disabled = false; $('error-borrar').textContent = T(Cuentas.claveError(err)); sonar('error'); });
    }
    else if (a === 'ir-cuenta') { guardar(); modoInvitado = false; guardarPreferencias(); pantallaInicio(); }
    else if (a === 'dueno-gemas-inf') { estado.gemasInfinitas = !estado.gemasInfinitas; guardarPreferencias(); actualizarHUD(); sonar('gemas'); reabrirPanel(); }
    else if (a === 'dueno-gemas') { estado.gemas = GEMAS_DUENO; actualizarHUD(); sonar('gemas'); guardar(); }
    else if (a === 'dueno-oro') { estado.oroInfinito = !estado.oroInfinito; guardarPreferencias(); actualizarHUD(); sonar('moneda'); reabrirPanel(); }
    else if (a === 'dueno-vel') { cambiarVelocidad(velocidad === 10 ? 1 : 10); sonar('click'); reabrirPanel(); }
    else if (a === 'dueno-oleada') { cerrarPanel(); if (!oleadaActiva) empezarOleada(); }
    else if (a === 'dueno-salir') { salirModoDueno(); reabrirPanel(); }
    else if (a === 'borrar') { if (window.confirm(T('borrar_ok'))) { cerrarPanel(); empezarPartida(null); guardar(true); } }
  });

  // Actualiza solo lo que cambia (botones activos, barra de entrenamiento)
  function actualizarPanel() {
    if (!panelActual) return;
    var botones = $('panel-cuerpo').querySelectorAll('[data-costo],[data-gemas]');
    botones.forEach(function (b) {
      var c = b.getAttribute('data-costo'), g = +b.getAttribute('data-gemas') || 0;
      try { c = c ? JSON.parse(c) : 0; } catch (e) { c = +c || 0; }
      var ok = puedePagar(c, g);
      var a = b.getAttribute('data-accion');
      if (a === 'entrenar') ok = ok && cuartelesListos().length > 0 && tropasOcupadas() < capacidad();
      if (a === 'muralla') ok = ok && !obraMuralla && estado.muralla < NIVEL_MAX;
      if (a === 'investigar') ok = ok && !estado.investigando && !!academiaLista();
      if (a === 'heroe') ok = ok && !tropas.some(function (u) { return u.tipo === 'heroe'; });
      b.disabled = !ok;
    });
    if (estado.investigando && $('inv-barra')) {
      var ia = academiaLista(), ii = estado.investigando;
      $('inv-barra').style.width = Math.round(Math.min(1, ii.t / ii.total) * 100) + '%';
      $('inv-falta').textContent = '⏱ ' + T('faltan_t', { t: fmtTiempo(faltaInvestigacion()) });
    }
    if ($('reloj-obra')) { var so = slots[+$('reloj-obra').dataset.slot]; if (so && so.obra) $('reloj-obra').textContent = '⏱ ' + fmtTiempo((so.obra.total - so.obra.t) / velReal()); else reabrirPanel(); }
    if ($('reloj-diario')) $('reloj-diario').textContent = T('proximo_cofre', { t: fmtTiempo(segHastaManana()) });
    var cola = $('cola');
    if (cola) {
      var h = '<div>' + T('tropas_vivas', { a: tropasNormales(), b: capacidad() }) + '</div>' + '<div>🍞 ' + T('comen', { n: Math.round(tropas.length * 60 / COMIDA_TROPA.cada) }) + '</div>' + (totalHeridos() ? '<div>' + T('en_enfermeria', { n: totalHeridos() }) + '</div>' : '');
      if (colaEntreno.length) {
        var c0 = colaEntreno[0];
        var cuenta = {};
        colaEntreno.forEach(function (c) { cuenta[c.tipo] = (cuenta[c.tipo] || 0) + 1; });
        h += '<div>' + T('en_cola') + ': ' + Object.keys(cuenta).map(function (k) { return N(k) + ' ×' + cuenta[k]; }).join(', ') + '</div>' +
          '<div class="barra"><div style="width:' + Math.min(100, c0.t / c0.total * 100) + '%"></div></div>' +
          '<div class="reloj-panel">⏱ ' + T('entrenando_t', { t: fmtTiempo(faltaEntreno()) }) + '</div>';
      } else h += '<div style="opacity:.7">' + T('cola_vacia') + '</div>';
      cola.innerHTML = h;
    }
  }

  // ------------------------------------------------------------------
  //  HUD Y CONSEJOS
  // ------------------------------------------------------------------
  function actualizarHUD() {
    $('monedas').textContent = estado.oroInfinito ? '∞' : corto(estado.monedas);
    ['comida', 'madera', 'piedra'].forEach(function (r) { $(r).textContent = estado.oroInfinito ? '∞' : corto(estado[r]); });
    $('poder').textContent = formatoNumero(calcularPoder());
    $('nivel-rey').textContent = Math.max(1, estado.oleada);
    $('avatar').classList.toggle('dueno', !!estado.dueno);
    $('gemas').textContent = estado.gemasInfinitas ? '∞' : corto(estado.gemas);
    $('tropas').textContent = textoTropas();
    $('oleada').textContent = textoOleada();
    $('vida-castillo-fill').style.width = (estado.vidaCastillo / vidaMaxCastillo() * 100) + '%';
    $('vida-castillo').querySelector('.etq').textContent = T('castillo') + '  ❤ ' + Math.ceil(estado.vidaCastillo) + ' / ' + vidaMaxCastillo();
    $('btn-oleada-txt').textContent = T('empezar_oleada', { n: estado.oleada });
    $('btn-oleada-sub').textContent = textoComposicion(estado.oleada);
    document.querySelector('.poder span').textContent = estado.dueno ? T('modo_dueno') : T('poder');
  }
  function textoTropas() {
    var inv = tropas.filter(function (u) { return u.invocada || u.tipo === 'heroe'; }).length;
    var her = totalHeridos();
    return (tropasNormales() + her) + '/' + capacidad() + (inv ? ' +' + inv + '✨' : '') + (her ? ' 💚' + her : '');
  }
  function textoOleada() {
    var n = oleadaActiva ? oleadaActual : estado.oleada;
    var t = estado.infinito || n > OLEADAS.length ? '' + n : n + '/' + OLEADAS.length;
    if (oleadaActiva) t += ' · ⚔' + (enemigos.length + colaSpawn.length);
    return t;
  }
  function composicion(n) { return n <= OLEADAS.length ? OLEADAS[n - 1] : oleadaInfinita(n); }
  function textoComposicion(n) {
    var o = composicion(n), partes = [];
    ['trasgo', 'bruto', 'ogro'].forEach(function (k) { if (o[k]) partes.push(N(k) + ' ×' + o[k]); });
    var premio = GEMAS_POR_OLEADA + (n === OLEADAS.length && !estado.infinito ? GEMAS_VICTORIA : 0);
    return partes.join(' · ') + ' · ' + T('premio', { g: premio }) + (n === OLEADAS.length && !estado.infinito ? ' — ' + T('ultima') : '');
  }
  function calcularPoder() {
    var p = 0;
    tropas.forEach(function (u) { p += Math.round(u.d.vida * 2 + u.d.dano * 25); });
    slots.forEach(function (s) { if (s.edificio) p += s.edificio.nivel * 450; });
    p += estado.muralla * 600;
    for (var ik in estado.invest) p += (estado.invest[ik] || 0) * 250;
    barricadas.forEach(function (b) { p += b.nivel * 300; });
    return p + (estado.oleada - 1) * 1000;
  }
  function corto(n) { n = Math.floor(n || 0); return n < 10000 ? '' + n : n < 1000000 ? (Math.floor(n / 100) / 10) + 'k' : (Math.floor(n / 100000) / 10) + 'M'; }
  function formatoNumero(n) { return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, estado.idioma === 'en' ? ',' : '.'); }
  var consejoFijo = '', consejoHasta = 0;
  function consejoTemporal(txt) { consejoFijo = txt; consejoHasta = performance.now() + 2600; mostrarConsejo(); }
  function mostrarConsejo() {
    var txt = '';
    if (performance.now() < consejoHasta) txt = consejoFijo;
    else if (enMenu) txt = '';
    else if (modoColocar) txt = modoColocar === 'barricada' ? T('colocando_barr') : T('c_elegir');
    else if (tiempoJuego < 5) txt = T('c_mover');
    else if (!oleadaActiva && estado.oleada <= 2) {
      if (!contarEdificios('granja')) txt = T('c_granja');
      else if (!contarEdificios('aserradero')) txt = T('c_aserradero');
      else if (!contarEdificios('cuartel')) txt = T('c_cuartel');
      else if (!tropas.length && !colaEntreno.length) txt = T('c_tropas');
      else if (estado.oleada === 1) txt = T('c_oleada');
      else if (!contarEdificios('torre')) txt = T('c_torre');
    }
    else if (!oleadaActiva && estado.oleada >= 2 && !contarEdificios('mina')) txt = T('c_mina');
    else if (!oleadaActiva && estado.oleada >= 3 && !barricadas.some(function (b) { return b.nivel; })) txt = T('c_barricada');
    else if (!oleadaActiva && estado.oleada >= 3 && !contarEdificios('enfermeria')) txt = T('c_enfermeria');
    else if (!oleadaActiva && estado.oleada >= 4 && !contarEdificios('academia')) txt = T('c_academia');
    else if (!oleadaActiva && estado.oleada >= 4 && !estado.muralla && !obraMuralla) txt = T('c_muralla');
    var c = $('consejo');
    if (c.textContent !== txt) c.textContent = txt;
  }

  // ------------------------------------------------------------------
  //  BOTONES PRINCIPALES
  // ------------------------------------------------------------------
  $('btn-construir').addEventListener('click', function () {
    sonar('click');
    if (modoColocar) { salirModoColocar(); return; }
    if (panelActual && panelActual.tipo === 'construir') cerrarPanel(); else abrirPanelConstruir();
  });
  function botonMenu(id, tipos, abrir) {
    $(id).addEventListener('click', function () {
      if (enMenu) return;
      sonar('click'); salirModoColocar(); if (enMundo) cerrarMundo();
      if (panelActual && tipos.indexOf(panelActual.tipo) >= 0) cerrarPanel(); else abrir();
    });
  }
  botonMenu('btn-conquista', ['conquista'], function () { abrirPanelConquista(); });
  botonMenu('btn-heroes', ['tropas', 'invocar'], function () { abrirPanelTropas(); });
  botonMenu('btn-mochila', ['mochila'], function () { abrirPanelMochila(); });
  botonMenu('btn-tienda', ['tienda'], function () { abrirPanelTienda(); });
  $('btn-ajustes').addEventListener('click', function () { sonar('click'); abrirPanelAjustes(); });
  $('btn-mundo').addEventListener('click', function () { if (enMenu) return; sonar('click'); salirModoColocar(); cerrarPanel(); if (enMundo) cerrarMundo(); else abrirMundo(); });
  $('btn-alianza').addEventListener('click', function () {
    if (enMenu) return;
    sonar('click'); salirModoColocar(); if (enMundo) cerrarMundo();
    if (panelActual && panelActual.tipo === 'alianza') cerrarPanel(); else abrirPanelAlianza();
  });
  $('mundo-cerrar').addEventListener('click', function () { sonar('click'); cerrarMundo(); });
  $('panel-cerrar').addEventListener('click', function () { sonar('click'); cerrarPanel(); });
  $('btn-oleada').addEventListener('click', function () { empezarOleada(); });
  $('btn-velocidad').addEventListener('click', function () { cambiarVelocidad(); sonar('click'); });
  $('btn-sonido').addEventListener('click', function () { cambiarSonido(); });
  $('btn-idioma').addEventListener('click', function () {
    estado.idioma = estado.idioma === 'es' ? 'en' : 'es';
    aplicarIdioma(); guardarPreferencias(); reabrirPanel(); sonar('click');
  });
  function cambiarVelocidad(v) {
    var opciones = estado.dueno ? [1, 2, 10] : [1, 2];
    velocidad = v || opciones[(opciones.indexOf(velocidad) + 1) % opciones.length];
    $('btn-velocidad').textContent = 'x' + velocidad;
    $('btn-velocidad').classList.toggle('x10', velocidad === 10);
    if (!v) guardarPreferencias();
  }
  function cambiarSonido() {
    estado.sonido = !estado.sonido;
    $('btn-sonido').innerHTML = iconoSonido();
    guardarPreferencias();
    sonar('click');
  }
  function guardarPreferencias(sinPartida) {
    try {
      localStorage.setItem(CLAVE_PREF, JSON.stringify({ idioma: estado.idioma, sonido: estado.sonido, invitado: !!modoInvitado, velocidad: velocidad === 2 ? 2 : 1 }));
    } catch (e) {}
    if (!enMenu && !sinPartida) guardar();
  }

  function aplicarIdioma() {
    document.documentElement.lang = estado.idioma;
    document.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = T(e.getAttribute('data-t')); });
    $('btn-idioma').textContent = estado.idioma.toUpperCase();
    $('btn-sonido').innerHTML = iconoSonido();
    $('btn-velocidad').title = T('velocidad');
    $('btn-sonido').title = T('sonido');
    $('btn-ajustes').title = T('p_ajustes');
    if (enMenu && pantallaModo === 'inicio') pantallaInicio();
    actualizarHUD();
  }

  // ------------------------------------------------------------------
  //  PANTALLAS: INICIO, VICTORIA, DERROTA
  // ------------------------------------------------------------------
  function iconoSonido() {
    return '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4a2a00" d="M3 9h4l5-4v14l-5-4H3z"/>' +
      (estado.sonido ? '<path d="M15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12" stroke="#4a2a00" stroke-width="2" fill="none" stroke-linecap="round"/>'
        : '<path d="M15 9l6 6M21 9l-6 6" stroke="#b3261e" stroke-width="2.4" stroke-linecap="round"/>') + '</svg>';
  }
  var pantallaModo = 'inicio';
  function mostrarPantalla(logo, titulo, texto, botones, formulario) {
    enMenu = true;
    $('pantalla-logo').textContent = logo;
    $('pantalla-titulo').textContent = titulo;
    $('pantalla-texto').textContent = texto;
    $('pantalla-form').innerHTML = formulario || '';
    var cont = $('pantalla-botones');
    cont.innerHTML = '';
    botones.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'comprar' + (b.clase ? ' ' + b.clase : '');
      el.textContent = b.texto;
      el.addEventListener('click', function () { sonar('click'); b.accion(); });
      cont.appendChild(el);
    });
    $('pantalla').classList.remove('oculto');
    cerrarPanel();
  }
  function ocultarPantalla() { $('pantalla').classList.add('oculto'); enMenu = false; cambiarPausa(false); }

  var habiaUsuario = false, duenoPorCuenta = false, modoInvitado = !!leerPref().invitado, modoCrear = false, partidaNube = null, cargandoNube = false, errorCuenta = '';
  function botonIdioma() {
    return { texto: estado.idioma === 'es' ? 'English' : 'Español', clase: 'morado', accion: function () {
      estado.idioma = estado.idioma === 'es' ? 'en' : 'es'; guardarPreferencias(); aplicarIdioma();
    } };
  }
  function pantallaInicio() {
    pantallaModo = 'inicio';
    var nube = window.Cuentas && Cuentas.disponible();
    // 1) Esperando a saber si hay sesión
    if (nube && (!Cuentas.listo() || cargandoNube)) { mostrarPantalla('🏰', NOMBRE_JUEGO, T('cargando'), []); return; }
    // 2) Sin sesión y sin elegir invitado: formulario de cuenta
    if (nube && !Cuentas.usuario() && !modoInvitado) { pantallaCuenta(); return; }
    var g = cargar();
    if (window.Cuentas && Cuentas.usuario() && partidaNube && (!g || (partidaNube.actualizado || 0) > (g.actualizado || 0))) g = partidaNube;
    var botones = [];
    var hayPartida = g && (g.oleada > 1 || (g.edificios || []).some(function (e) { return e; }));
    if (hayPartida) {
      botones.push({ texto: T('continuar') + ' (' + T('oleada') + ' ' + g.oleada + ')', accion: function () { empezarPartida(g); } });
      botones.push({ texto: T('nueva'), clase: 'morado', accion: function () { empezarPartida(null); } });
    } else botones.push({ texto: T('jugar'), accion: function () { empezarPartida(null); } });
    var texto = T('intro');
    if (nube && Cuentas.usuario()) {
      texto = T('hola', { n: Cuentas.nombre() }) + (esCuentaDueno() ? ' 👑' : '') + ' ☁️';
      botones.push({ texto: T('cerrar_sesion'), clase: 'rojo', accion: function () { Cuentas.salir(); } });
    } else if (nube) {
      texto = T('invitado_txt');
      botones.push({ texto: T('entrar_o_crear'), clase: 'naranja', accion: function () { modoInvitado = false; guardarPreferencias(); pantallaInicio(); } });
    }
    botones.push(botonIdioma());
    mostrarPantalla('🏰', NOMBRE_JUEGO, texto, botones);
  }
  function pantallaCuenta() {
    var f = '<input class="campo" id="campo-usuario" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="' + T('usuario') + '">' +
      '<input class="campo" id="campo-clave" type="password" autocomplete="' + (modoCrear ? 'new-password' : 'current-password') + '" placeholder="' + T('contrasena') + '">' +
      (modoCrear ? '<input class="campo" id="campo-clave2" type="password" autocomplete="new-password" placeholder="' + T('repetir') + '">' : '') +
      '<p class="nota aviso-rojo" id="error-cuenta">' + escaparHTML(errorCuenta) + '</p>';
    var botones = modoCrear ? [
      { texto: T('crear_cuenta'), clase: 'naranja', accion: function () { enviarCuenta(true); } },
      { texto: T('tengo_cuenta'), clase: 'morado', accion: function () { modoCrear = false; errorCuenta = ''; pantallaCuenta(); } }
    ] : [
      { texto: T('entrar_btn'), accion: function () { enviarCuenta(false); } },
      { texto: T('crear_cuenta'), clase: 'naranja', accion: function () { modoCrear = true; errorCuenta = ''; pantallaCuenta(); } }
    ];
    botones.push({ texto: T('invitado'), clase: 'morado', accion: function () { modoInvitado = true; errorCuenta = ''; guardarPreferencias(); pantallaInicio(); } });
    botones.push(botonIdioma());
    mostrarPantalla('🏰', NOMBRE_JUEGO, modoCrear ? T('crear_txt') : T('login_txt'), botones, f);
    var cl = $(modoCrear ? 'campo-clave2' : 'campo-clave');
    if (cl) cl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') enviarCuenta(modoCrear); });
  }
  var enviando = false;
  function enviarCuenta(crear) {
    if (enviando) return;
    var u = $('campo-usuario').value.trim(), c = $('campo-clave').value;
    var mostrarError = function (k) { errorCuenta = T(k); var e = $('error-cuenta'); if (e) e.textContent = errorCuenta; sonar('error'); };
    if (!Cuentas.usuarioValido(u)) return mostrarError('e_usuario');
    if (c.length < 6) return mostrarError('e_debil');
    if (crear && c !== $('campo-clave2').value) return mostrarError('e_repetir');
    enviando = true;
    var e = $('error-cuenta'); if (e) e.textContent = T('cargando');
    (crear ? Cuentas.crear(u, c) : Cuentas.entrar(u, c)).then(function () {
      enviando = false; errorCuenta = ''; modoCrear = false;
      // onAuthStateChanged se encarga del resto
    }).catch(function (err) { enviando = false; mostrarError(Cuentas.claveError(err)); });
  }
  // Cuando alguien entra o sale de su cuenta
  function alCambiarCuenta(u) {
    partidaNube = null;
    if (!u) {
      if (duenoPorCuenta) { duenoPorCuenta = false; salirModoDueno(); }
      // si alguien cerró sesión de verdad, vuelve al formulario de cuenta
      if (habiaUsuario) { modoInvitado = false; guardarPreferencias(true); }
      habiaUsuario = false;
      pantallaInicio();
      return;
    }
    habiaUsuario = true;
    if (esCuentaDueno()) { duenoPorCuenta = true; activarModoDueno(Cuentas.correo()); }
    cargandoNube = true;
    if (enMenu) pantallaInicio();
    var invitado = null;
    try { invitado = JSON.parse(localStorage.getItem(CLAVE_GUARDADO)); } catch (e) {}
    Cuentas.cargarPartida().then(function (p) {
      partidaNube = p ? p.estado : null;
      if (partidaNube) partidaNube.actualizado = p.actualizado;
      // Primera vez con cuenta: se lleva la partida de invitado de este teléfono
      if (!partidaNube && !cargar() && invitado && typeof invitado.monedas === 'number') {
        partidaNube = invitado; partidaNube.actualizado = Date.now();
        Cuentas.guardarPartida(invitado, true);
      }
    }).catch(function () { /* sin internet: se usa la copia local */ }).then(function () {
      cargandoNube = false;
      if (enMenu) pantallaInicio();
    });
  }
  function pantallaVictoria() {
    pantallaModo = 'victoria';
    mostrarPantalla('🏆', T('victoria'), T('victoria_txt', { g: GEMAS_POR_OLEADA * OLEADAS.length + GEMAS_VICTORIA }), [
      { texto: T('seguir_infinito'), accion: function () { estado.infinito = true; guardar(); ocultarPantalla(); $('btn-oleada').classList.remove('oculto'); actualizarHUD(); } },
      { texto: T('nueva'), clase: 'morado', accion: function () { empezarPartida(null); } }
    ]);
  }
  function pantallaDerrota() {
    pantallaModo = 'derrota';
    mostrarPantalla('💔', T('derrota'), T('derrota_txt', { n: oleadaActual }), [
      { texto: T('reintentar'), accion: function () {
        limpiarEnemigos();
        estado.vidaCastillo = vidaMaxCastillo();
        curarHeridos();
        repararBarricadas();
        guardar();
        ocultarPantalla();
        $('btn-oleada').classList.remove('oculto');
        actualizarHUD();
      } },
      { texto: T('nueva'), clase: 'morado', accion: function () { empezarPartida(null); } }
    ]);
  }

  var tiempoJuego = 0;
  function empezarPartida(g) {
    // limpiar todo
    limpiarEnemigos();
    tropas.slice().forEach(function (u) { escena.remove(u.m.grupo); escena.remove(u.barra); });
    tropas = []; colaEntreno = []; oleadaActiva = false; colaSpawn = [];
    barricadas.forEach(function (b, i) { quitarBarricada(i); });
    hambre = false; $('aviso-hambre').classList.add('oculto');
    if (obraMuralla) { escena.remove(murallaBarra); murallaAndamios.forEach(function (a) { escena.remove(a); }); murallaAndamios = []; murallaBarra = null; obraMuralla = null; }
    slots.forEach(function (s) {
      if (s.modelo) s.grupo.remove(s.modelo);
      if (s.andamio) s.grupo.remove(s.andamio);
      if (s.insignia) { s.grupo.remove(s.insignia); s.insignia = null; }
      if (s.barra) escena.remove(s.barra);
      s.modelo = s.andamio = s.barra = null; s.edificio = s.obra = null; s.rebote = 1;
    });
    var idioma = estado.idioma, sonido = estado.sonido, dueno = estado.dueno, oroInf = estado.oroInfinito, gemInf = estado.gemasInfinitas, correo = estado.correo;
    estado = nuevoEstado();
    estado.idioma = idioma; estado.sonido = sonido; estado.dueno = dueno; estado.oroInfinito = oroInf; estado.gemasInfinitas = gemInf; estado.correo = correo;
    if (g) {
      estado.monedas = g.monedas; estado.gemas = g.gemas; estado.oleada = g.oleada || 1;
      estado.infinito = !!g.infinito;
      estado.muralla = g.muralla || 0;
      estado.alianza = g.alianza || null;
      estado.armadura = g.armadura || {};
      estado.mochila = g.mochila || {};
      estado.invest = g.invest || {};
      estado.escudoHasta = g.escudoHasta || 0;
      estado.cdAtaque = g.cdAtaque || {};
      estado.investigando = g.investigando || null;
      estado.diario = g.diario || { ultimo: '', racha: 0 };
      ['comida', 'madera', 'piedra'].forEach(function (r) { estado[r] = typeof g[r] === 'number' ? g[r] : INICIO[r]; });
      (g.barricadas || []).forEach(function (n, i) { if (n && barricadas[i]) ponerBarricada(i, n); });
      estado.heridos = g.heridos || {};
      (g.edificios || []).forEach(function (e, i) { if (e && slots[i]) ponerEdificio(slots[i], e.tipo, e.nivel); });
      var t = g.tropas || {};
      Object.keys(t).forEach(function (tipo) {
        for (var k = 0; k < t[tipo]; k++) crearTropa(tipo, reunion.clone().add(new V3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)));
      });
      var iv = g.invocadas || {};
      Object.keys(iv).forEach(function (tipo) { for (var k = 0; k < iv[tipo]; k++) crearTropa(tipo, reunion.clone(), true); });
      if (g.heroe) crearTropa('heroe', reunion.clone());
      tropas.forEach(function (u) { u.pos.copy(u.puesto); });
    }
    ponerMuralla(estado.muralla);
    estado.vidaCastillo = vidaMaxCastillo();
    curarHeridos();
    tiempoJuego = 0;
    cam.objetivo.copy(CENTRO_REINO); cam.distMeta = distInicial();
    ocultarPantalla();
    $('btn-oleada').classList.remove('oculto');
    actualizarHUD();
    guardar();
    // la aldea pública se actualiza con la partida de ESTA cuenta, ya cargada
    setTimeout(function () { if (!enMenu) publicarAldea(true); }, 800);
    setTimeout(function () { revisarAtaques(true); }, 2500);
    setTimeout(function () { if (!enMenu && diarioDisponible() && !panelActual) abrirPanelMochila(); }, 1200);
  }

  // ------------------------------------------------------------------
  //  BUCLE PRINCIPAL
  // ------------------------------------------------------------------
  var reloj = new THREE.Clock(), cuentaHUD = 0, pausado = false;
  function cambiarPausa(v) {
    pausado = v === undefined ? !pausado : v;
    $('aviso-pausa').classList.toggle('oculto', !pausado);
    $('btn-pausa').textContent = pausado ? '▶' : '⏸';
    $('btn-pausa').classList.toggle('pausado', pausado);
  }
  $('btn-pausa').addEventListener('click', function () { if (enMenu) return; sonar('click'); cambiarPausa(); });
  window.addEventListener('keydown', function (ev) { if ((ev.key === 'p' || ev.key === 'P') && !enMenu && !/INPUT/.test((document.activeElement || {}).tagName)) cambiarPausa(); });
  function bucle() {
    requestAnimationFrame(bucle);
    var dtReal = Math.min(reloj.getDelta(), 0.05);
    if (!enMenu && !pausado) {
      var dt = dtReal * velocidad;
      actualizar(dt);
      moverAldeanos(dt, tiempo);
      tiempoJuego += dtReal;
    } else {
      // en el menú la cámara gira despacio
      tiempo += dtReal;
      cam.az = 0.52 + Math.sin(tiempo * 0.15) * 0.25;
      castillo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });
    }
    if (!enMenu) cam.az += (0.52 - cam.az) * Math.min(1, dtReal * 3);
    actualizarCamara(dtReal);
    // nubes
    nubes.forEach(function (n) { n.position.x += n.userData.v * dtReal; if (n.position.x > 90) n.position.x = -90; });
    // brillo de terrenos libres
    var b = (Math.sin(performance.now() / 250) + 1) / 2;
    slots.forEach(function (s, i) {
      var libre = !s.edificio && !s.obra;
      var on = (modoColocar && libre) || slotElegido === i;
      s.terreno.userData.brillo.material.opacity = on ? 0.35 + b * 0.5 : (libre && !enMenu ? 0.12 : 0);
    });
    slots.forEach(function (s) { if (s.fantasma) s.fantasma.position.y = 0.15 + Math.sin(performance.now() / 300) * 0.12; });
    barricadas.forEach(function (bq) { bq.marca.material.opacity = (modoColocar === 'barricada' && !bq.nivel) ? 0.3 + b * 0.4 : 0; if (bq.fantasma) bq.fantasma.position.y = 0.1 + Math.sin(performance.now() / 300) * 0.1; });
    actualizarRelojes();
    if (cupulaEscudo.visible) cupulaEscudo.material.opacity = 0.14 + Math.sin(performance.now() / 600) * 0.05;
    // las barras de vida miran a la cámara
    tropas.concat(enemigos).forEach(function (u) { u.barra.quaternion.copy(camara.quaternion); });
    slots.forEach(function (s) { if (s.barra) s.barra.quaternion.copy(camara.quaternion); });
    // HUD cada 0.2 s
    cuentaHUD += dtReal;
    if (cuentaHUD > 0.2) { cuentaHUD = 0; actualizarPanel(); mostrarConsejo(); actualizarBadges(); actualizarEscudo(); revisarAtaques(); $('tropas').textContent = textoTropas(); $('oleada').textContent = textoOleada(); }
    render.render(escena, camara);
  }

  window.addEventListener('resize', function () {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    render.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener('beforeunload', function () { if (!enMenu) guardar(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && !enMenu) guardar(true); });

  // Para pruebas desde la consola del navegador
  window.__juego = { estado: function () { return estado; }, empezarOleada: empezarOleada, construir: construir, mejorar: mejorar, entrenar: entrenar, capacidad: capacidad, invocarHeroe: invocarHeroe,
    tropas: function () { return tropas; }, camara: camara, escena: escena, ponerMuralla: function (n) { ponerMuralla(n); }, nueva: function () { empezarPartida(null); }, construirMuralla: construirMuralla, sha256: function (s) { return sha256(s); }, enemigos: function () { return enemigos; }, slots: slots, cam: cam, velocidad: function (v) { velocidad = v; },
    paso: function (seg) { for (var i = 0; i < seg * 30; i++) actualizar(1 / 30); actualizarCamara(1); actualizarRelojes(); render.render(escena, camara); } };

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  document.title = NOMBRE_JUEGO;
  aplicarIdioma();
  if (window.Cuentas && Cuentas.disponible()) Cuentas.alCambiar(alCambiarCuenta);
  else pantallaInicio();
  cambiarVelocidad(leerPref().velocidad === 2 ? 2 : 1);
  window.__juegoListo = true;
  bucle();
})();
