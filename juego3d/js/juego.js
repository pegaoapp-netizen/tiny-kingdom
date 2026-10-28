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
      edificios: [],
      tropas: {}, heroe: false, infinito: false, heridos: {}, muralla: 0, barricadas: [], alianza: null, armadura: {}, mochila: {}, diario: { ultimo: '', racha: 0 }, invest: {}, investigando: null, escudoHasta: 0, cdAtaque: {}, castillo: 1, obraCastillo: null,
      heroes: { sol: { nivel: 1, estrellas: 1, frag: 0 } }, equipo: ['sol'], reclutaGratis: '',
      eqItems: [{ i: 'r1', t: 'arma', r: 'comun', n: 1, h: null }, { i: 'r2', t: 'casco', r: 'comun', n: 1, h: null }], eqRegalo: true,
      logros: { recolectas: 0, tropas: 0, campamentos: 0 }, tropasDefienden: true, burbujaHasta: 0,
      carretas: { n: CARRETA.inicio, nivel: 1, cola: [], viajes: [] },
      buzon: [], bestias: {}, alLocal: null,
      idioma: 'es',
      sonido: true, dueno: false, correo: '', oroInfinito: false, gemasInfinitas: false, actualizado: 0
    };
  }
  function guardar(ya) {
    try {
      // lo que se está construyendo se guarda con su nivel de antes y su obra aparte (con el tiempo que lleva)
      estado.edificios = slots.map(function (s) { return s.edificio ? { tipo: s.edificio.tipo, nivel: s.edificio.nivel } : (s.obra && s.obra.nivel > 1 ? { tipo: s.obra.tipo, nivel: s.obra.nivel - 1 } : null); });
      estado.obras = slots.map(function (s) { return s.obra ? { tipo: s.obra.tipo, nivel: s.obra.nivel, t: s.obra.t, total: s.obra.total } : null; });
      estado.guardados = slots.map(function (s) { return Math.floor(s.guardado || 0); });
      estado.mapa2 = true;
      estado.obraMuralla = obraMuralla ? { nivel: obraMuralla.nivel, t: obraMuralla.t, total: obraMuralla.total } : null;
      var t = {};
      var inv = {};
      tropas.forEach(function (u) { if (u.tipo === 'heroe' || u.refuerzo) return; if (u.invocada) inv[u.tipo] = (inv[u.tipo] || 0) + 1; else t[u.tipo] = (t[u.tipo] || 0) + 1; });
      estado.invocadas = inv;
      var cola = [];
      colaEntreno.forEach(function (c, i) { var q = cola[cola.length - 1]; if (q && i > 0 && q[0] === c.tipo) q[1]++; else cola.push([c.tipo, 1, i === 0 ? Math.round(c.t * 10) / 10 : 0]); });
      estado.colaEntreno = cola;
      estado.tropas = t;
      estado.heroe = tropas.some(function (u) { return u.tipo === 'heroe'; });
      estado.barricadas = barricadas.map(function (b) { return b.nivel; });
      estado.actualizado = Date.now();
    } catch (e) {}
    var copia = JSON.parse(JSON.stringify(estado));
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
  // Calidad: 'alta' (sombras, humo, polvo, nitidez) o 'baja' (más rápido)
  var calidad = (function () {
    try { var p = JSON.parse(localStorage.getItem('tinykingdom_pref')) || {}; if (p.calidad) return p.calidad; } catch (e) {}
    return (navigator.hardwareConcurrency || 4) >= 4 ? 'alta' : 'baja';
  })();
  $('juego').appendChild(render.domElement);

  var escena = new THREE.Scene();
  escena.background = new THREE.Color(0xf1e4c8);
  escena.fog = new THREE.Fog(0xf1e4c8, 140, 300);
  // cielo: un domo con degradado (azul arriba, claro en el horizonte)
  (function cielo() {
    var g = new THREE.SphereGeometry(390, 24, 12);
    var mt = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { arriba: { value: new THREE.Color(0x6aa6d8) }, horizonte: { value: new THREE.Color(0xf1e4c8) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP,1.0); }',
      fragmentShader: 'uniform vec3 arriba; uniform vec3 horizonte; varying vec3 vP; void main(){ float h = clamp(normalize(vP - cameraPosition).y * 1.6 + 0.1, 0.0, 1.0); gl_FragColor = vec4(mix(horizonte, arriba, h), 1.0); }'
    });
    var domo = new THREE.Mesh(g, mt);
    domo.renderOrder = -10;
    domo.frustumCulled = false;
    escena.add(domo);
    escena.userData.domo = domo;
    // estrellas: solo se ven de noche
    var pe = [];
    for (var i = 0; i < 420; i++) {
      var a = Math.random() * Math.PI * 2, el = 0.12 + Math.pow(Math.random(), 0.7) * 1.35;
      pe.push(Math.cos(a) * Math.cos(el) * 370, Math.sin(el) * 370, Math.sin(a) * Math.cos(el) * 370);
    }
    var gE = new THREE.BufferGeometry(); gE.setAttribute('position', new THREE.Float32BufferAttribute(pe, 3));
    var estrellas = new THREE.Points(gE, new THREE.PointsMaterial({ color: 0xfff6e0, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    estrellas.renderOrder = -9; estrellas.frustumCulled = false;
    escena.add(estrellas);
    escena.userData.estrellas = estrellas;
  })();

  // en teléfono vertical la cámara abre más el ángulo para que quepa el reino a lo ancho
  function fovPantalla() { return window.innerWidth < window.innerHeight ? 52 : 38; }
  var camara = new THREE.PerspectiveCamera(fovPantalla(), window.innerWidth / window.innerHeight, 0.5, 900);
  // Cámara inicial: se ve el castillo entero con sus alrededores (más lejos en teléfono vertical)
  // de lejos: se ve el reino entero con el castillo en el centro
  // muralla completa y los campos de fuera (en teléfono vertical: la muralla entera y el borde de los campos)
  function radioReino() { return window.innerWidth < window.innerHeight ? 55 : 66; }
  function distEncuadre() {
    var asp = window.innerWidth / window.innerHeight, fv = camara.fov * Math.PI / 180;
    var RADIO_REINO = radioReino();
    var ancho = RADIO_REINO / Math.tan(Math.atan(Math.tan(fv / 2) * asp)) * 1.02;
    // lo de arriba y lo de abajo lo tapan los botones: se deja ese espacio
    var util = Math.max(0.6, 1 - 170 / window.innerHeight);
    var alto = RADIO_REINO * 0.78 / Math.tan(fv / 2) / util;
    return Math.max(70, Math.min(260, Math.max(ancho, alto)));
  }
  function distInicial() { return distEncuadre(); }
  function distMaxima() { return distEncuadre() * 1.3; }
  // ángulo de la cámara: mira la puerta del castillo (que da al lado -x) de frente
  var AZ_CAM = 3.55;
  var CENTRO_REINO = new V3(0, 0, 0);
  var LIMITE_CAM = 74;
  // meta: a dónde va la cámara (se desliza suave hacia ahí); vel: inercia al soltar el dedo
  var camSigue = false; // durante la oleada la cámara sigue al enemigo que va más adelante
  var cam = { objetivo: CENTRO_REINO.clone(), meta: CENTRO_REINO.clone(), vel: new V3(), dist: distInicial(), distMeta: distInicial(), az: AZ_CAM, polar: 1.0 };

  var hemi = new THREE.HemisphereLight(0xe6e2d4, 0x6a5a3a, 0.56);
  escena.add(hemi);
  // Sol de la tarde: dirección fija, luz cálida y sombras suaves
  // viene de atrás a la izquierda de la cámara: las sombras se ven hacia la derecha
  // (girado junto con la cámara para que la luz se vea igual desde el nuevo ángulo)
  var DIR_SOL = new V3(14, 44, -38);
  var sol = new THREE.DirectionalLight(0xffdcae, 1.12);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  var sc = sol.shadow.camera;
  sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 170;
  sol.shadow.bias = -0.0006;
  sol.shadow.normalBias = 0.04;
  escena.add(sol);
  escena.add(sol.target);
  var tamSombra = 45;
  function aplicarCalidad() {
    var alta = calidad === 'alta';
    render.setPixelRatio(alta ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    render.setSize(window.innerWidth, window.innerHeight);
    // las sombras siempre están: en calidad baja con un mapa más chico (rápido en teléfonos)
    render.shadowMap.enabled = true;
    render.shadowMap.type = alta ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    sol.castShadow = true;
    var tam = alta ? 2048 : 1024;
    if (sol.shadow.mapSize.x !== tam) { sol.shadow.mapSize.set(tam, tam); if (sol.shadow.map) { sol.shadow.map.dispose(); sol.shadow.map = null; } }
    escena.traverse(function (o) { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.needsUpdate = true; }); } });
  }

  // ------------------------------------------------------------------
  //  CICLO DE DÍA Y NOCHE (solo visual: no cambia nada del juego)
  // ------------------------------------------------------------------
  var DURACION_DIA = 480;          // segundos reales por día completo (8 min)
  var horaForzada = null;           // para pruebas: window.__juego.hora(0.8)
  function faseDia() { return horaForzada !== null ? horaForzada : ((performance.now() / 1000) / DURACION_DIA + 0.12) % 1; }
  function suave(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  // 0..0.62 día · 0.62..0.72 atardecer · 0.72..0.92 noche · 0.92..1 amanecer
  function nocheDe(p) { if (p < 0.62) return 0; if (p < 0.72) return suave((p - 0.62) / 0.1); if (p < 0.92) return 1; return 1 - suave((p - 0.92) / 0.08); }
  function doradaDe(p) { var a = 1 - Math.abs(p - 0.665) / 0.06, b = 1 - Math.abs(p - 0.95) / 0.05; return suave(Math.max(a, b, 0)); }
  var CIELO = {
    arriba: [new THREE.Color(0x6aa6d8), new THREE.Color(0x0b1633), new THREE.Color(0x5a6aa0)],
    horizonte: [new THREE.Color(0xf1e4c8), new THREE.Color(0x1d2a4e), new THREE.Color(0xf2a466)],
    sol: [new THREE.Color(0xffdcae), new THREE.Color(0x8fa6e0), new THREE.Color(0xff9a5a)],
    hemiCielo: [new THREE.Color(0xe6e2d4), new THREE.Color(0x5a6ea8), new THREE.Color(0xf0c8a0)],
    hemiSuelo: [new THREE.Color(0x6a5a3a), new THREE.Color(0x1c2234), new THREE.Color(0x6a4a3a)],
    nube: [new THREE.Color(0xffffff), new THREE.Color(0x46557a), new THREE.Color(0xffc8a0)]
  };
  // dos luces cálidas que solo se prenden de noche: la puerta del castillo y la plaza
  var lucesNoche = [[-5.2, 2.6, 0, 16], [6, 2.2, 5, 13]].map(function (q) {
    var l = new THREE.PointLight(0xffa34a, 0, q[3], 1.6);
    l.position.set(q[0], q[1], q[2]);
    escena.add(l);
    return l;
  });
  var cTmp = new THREE.Color();
  function mezcla(lista, k, d) { return cTmp.copy(lista[0]).lerp(lista[1], k).lerp(lista[2], d * (1 - k * 0.5)); }
  var nocheActual = 0;
  function actualizarCielo(t) {
    var p = faseDia(), k = nocheDe(p), d = doradaDe(p);
    nocheActual = k;
    var domo = escena.userData.domo.material.uniforms;
    domo.arriba.value.copy(mezcla(CIELO.arriba, k, d));
    domo.horizonte.value.copy(mezcla(CIELO.horizonte, k, d));
    escena.fog.color.copy(domo.horizonte.value);
    escena.background.copy(domo.horizonte.value);
    sol.color.copy(mezcla(CIELO.sol, k, d));
    sol.intensity = 1.12 - k * 0.8 - d * 0.14;
    hemi.color.copy(mezcla(CIELO.hemiCielo, k, d));
    hemi.groundColor.copy(mezcla(CIELO.hemiSuelo, k, d));
    hemi.intensity = 0.56 - k * 0.18;
    M.matNube.color.copy(mezcla(CIELO.nube, k, d));
    escena.userData.estrellas.material.opacity = Math.max(0, k * 1.1 - 0.1);
    M.luzNoche(k, t);
    lucesNoche.forEach(function (l, i) { l.intensity = k * (1.5 + Math.sin(t * 9 + i * 2) * 0.12); });
  }

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
  var ESTANQUE = { x: 25, z: -22, r: 5 };

  function altura(x, z) {
    var r = Math.sqrt(x * x + z * z);
    if (r < 76) return 0;
    var k = Math.min(r - 76, 70);
    // colinas irregulares (no en filas): mezcla de ondas de distinto tamaño
    return k * 0.3 * (0.72 + 0.5 * ruido(x * 0.55 + 7, z * 0.55 - 3)) + ruido(x * 1.9, z * 1.6) * 0.5 * Math.min(1, k / 10);
  }

  // Textura de pasto pintada en el momento (original, sin imágenes externas):
  // matas claras y oscuras, briznas, manchitas de tierra y florecitas.
  function texturaPasto() {
    var T = 512, c = document.createElement('canvas'); c.width = c.height = T;
    var x = c.getContext('2d'), r = (function (a) { return function () { a = (a * 16807) % 2147483647; return a / 2147483647; }; })(4242);
    x.fillStyle = '#7d8f52'; x.fillRect(0, 0, T, T);
    function mancha(px, py, rad, col, alfa) {
      for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
        var gr = x.createRadialGradient(px + ox * T, py + oy * T, 0, px + ox * T, py + oy * T, rad);
        gr.addColorStop(0, col.replace('A', alfa)); gr.addColorStop(1, col.replace('A', 0));
        x.fillStyle = gr; x.fillRect(px + ox * T - rad, py + oy * T - rad, rad * 2, rad * 2);
      }
    }
    var i;
    for (i = 0; i < 70; i++) mancha(r() * T, r() * T, 30 + r() * 70, r() < 0.5 ? 'rgba(96,118,60,A)' : 'rgba(150,158,88,A)', 0.35 + r() * 0.3);
    for (i = 0; i < 18; i++) mancha(r() * T, r() * T, 8 + r() * 16, 'rgba(128,104,68,A)', 0.35 + r() * 0.25);
    // briznas de pasto
    for (i = 0; i < 9000; i++) {
      var bx = r() * T, by = r() * T, l = 3 + r() * 6, a = -Math.PI / 2 + (r() - 0.5) * 0.9;
      var tono = r();
      x.strokeStyle = tono < 0.33 ? 'rgba(70,92,44,.55)' : tono < 0.66 ? 'rgba(122,144,76,.5)' : 'rgba(168,176,104,.45)';
      x.lineWidth = 1 + r() * 0.8;
      x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); x.stroke();
    }
    // tierrita y piedritas
    for (i = 0; i < 260; i++) { x.fillStyle = r() < 0.6 ? 'rgba(120,98,66,.6)' : 'rgba(176,164,140,.6)'; x.fillRect(r() * T, r() * T, 1.5 + r() * 2, 1.5 + r() * 2); }
    // florecitas dispersas (blancas, amarillas, rosadas)
    var colF = ['#f4efe2', '#e8cf5a', '#e7a4b4', '#f4efe2'];
    for (i = 0; i < 70; i++) {
      var fx = r() * T, fy = r() * T; x.fillStyle = colF[i % 4];
      x.beginPath(); x.arc(fx, fy, 1.6 + r() * 1.2, 0, Math.PI * 2); x.fill();
    }
    var tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(86, 86);
    tx.anisotropy = Math.min(8, render.capabilities.getMaxAnisotropy());
    return tx;
  }
  // ruido suave (para manchas grandes de pasto seco / húmedo)
  function ruido(x, z) {
    return Math.sin(x * 0.071 + 1.3) * Math.cos(z * 0.063 - 0.7) * 0.5 + Math.sin(x * 0.17 + z * 0.13) * 0.3 + Math.sin(x * 0.41 - z * 0.37 + 2.1) * 0.2;
  }

  (function crearSuelo() {
    var g = new THREE.PlaneGeometry(760, 760, 190, 190);
    g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, colores = [];
    var seco = new THREE.Color(1.12, 1.06, 0.84), humedo = new THREE.Color(0.82, 0.92, 0.8), tierra = new THREE.Color(1.15, 0.98, 0.78);
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      var y = altura(x, z) + (rnd() - 0.5) * 0.1;
      if (Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) < ESTANQUE.r + 0.5) y -= 0.6;
      pos.setY(i, y);
      var n = ruido(x, z);
      var c = new THREE.Color(1, 1, 1);
      if (n > 0) c.lerp(seco, Math.min(1, n * 1.3)); else c.lerp(humedo, Math.min(1, -n * 1.3));
      var dc = distCamino(x, z);
      if (dc < 4.2) c.lerp(tierra, (1 - dc / 4.2) * 0.55);
      if (Math.hypot(x, z) < 11) c.lerp(tierra, 0.25 * (1 - Math.hypot(x, z) / 11));
      if (Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) < ESTANQUE.r + 3) c.lerp(humedo, 0.5);
      colores.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
    g.computeVertexNormals();
    var suelo = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: texturaPasto(), vertexColors: true }));
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
    var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xb3a891, side: THREE.DoubleSide }));
    m.receiveShadow = true;
    escena.add(m);
    // borde más oscuro, un poco más ancho, debajo del camino
    var vb = [], ib = [];
    for (var j = 0; j <= n; j++) {
      var ub = j / n, pb = curva.getPointAt(ub), tb = curva.getTangentAt(ub), pr = new V3(tb.z, 0, -tb.x).normalize();
      var wb = ancho * (0.92 + 0.12 * Math.sin(j * 0.7)) + 0.45;
      vb.push(pb.x + pr.x * wb, 0.035, pb.z + pr.z * wb, pb.x - pr.x * wb, 0.035, pb.z - pr.z * wb);
      if (j < n) { var a2 = j * 2; ib.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2); }
    }
    var gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.Float32BufferAttribute(vb, 3)); gb.setIndex(ib); gb.computeVertexNormals();
    var mb = new THREE.Mesh(gb, new THREE.MeshLambertMaterial({ color: 0x7f776a, side: THREE.DoubleSide })); mb.receiveShadow = true; escena.add(mb);
    // piedritas a los lados del camino
    var deco = new THREE.Group();
    for (var k = 0; k < 90; k++) {
      var uu = rnd(), pp = curva.getPointAt(uu), tt = curva.getTangentAt(uu);
      var lado = rnd() < 0.5 ? -1 : 1, pe = new V3(tt.z, 0, -tt.x).normalize().multiplyScalar(lado * (1.9 + rnd() * 0.4));
      var r = M.roca(0.25 + rnd() * 0.2, 0xb4a68c);
      r.position.x = pp.x + pe.x; r.position.z = pp.z + pe.z;
      r.castShadow = false;
      deco.add(r);
    }
    escena.add(M.fusionar(deco));
  })();

  // ------------------------------------------------------------------
  //  PARCELAS EN CUADRÍCULA: la ciudad (dentro de la muralla) y los campos (fuera)
  // ------------------------------------------------------------------
  var PARCELAS = (function () {
    function enMuralla(x, z) { var a = (x - MURALLA_FORMA.cx) / MURALLA_FORMA.rx, b = (z - MURALLA_FORMA.cz) / MURALLA_FORMA.rz; return Math.sqrt(a * a + b * b); }
    // distancia real del borde de la parcela (con su marco de pasto) a la muralla: nada la toca
    function aireMuralla(x, z) {
      var m = 1e9, f = MURALLA_FORMA;
      for (var a = 0; a < 6.283; a += 0.01) { var dx = Math.max(0, Math.abs(f.cx + Math.cos(a) * f.rx - x) - 4.25), dz = Math.max(0, Math.abs(f.cz + Math.sin(a) * f.rz - z) - 4.25); m = Math.min(m, Math.hypot(dx, dz)); }
      return m;
    }
    var ciudad = [], campos = [], C1 = 10, C2 = 10;
    for (var i = -7; i <= 7; i++) for (var j = -7; j <= 7; j++) {
      var x = i * C1, z = j * C1;
      if (enMuralla(x, z) < 1 && aireMuralla(x, z) >= 2.5 && Math.hypot(x, z) > 12 && distCamino(x, z) > 7.5 &&
        Math.hypot(x - PUNTO_REUNION[0], z - PUNTO_REUNION[1]) > 7.5 && Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) > ESTANQUE.r + 5.5) ciudad.push([x, z]);
    }
    for (var a = -9; a <= 9; a++) for (var b = -9; b <= 9; b++) {
      var fx = MURALLA_FORMA.cx + a * C2, fz = MURALLA_FORMA.cz + b * C2, m = enMuralla(fx, fz);
      if (m > 1 && m < 1.75 && aireMuralla(fx, fz) >= 2.5 && distCamino(fx, fz) > 9 && Math.abs(fx) < 120 && Math.abs(fz) < 120) campos.push([fx, fz]);
    }
    function porCercania(p, q) { return Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]); }
    ciudad.sort(porCercania); campos.sort(porCercania);
    var total = PARCELAS_INICIO + PARCELAS_POR_NIVEL * (NIVEL_MAX - 1);
    var base = ciudad.slice(0, 16), extra = ciudad.slice(16, total);
    campos = campos.slice(0, 24);
    var todas = base.concat(campos).concat(extra);
    // orden en que se abren las parcelas de la ciudad (de la más cerca del castillo a la más lejos)
    var orden = [];
    base.forEach(function (p, k) { orden.push(k); });
    extra.forEach(function (p, k) { orden.push(16 + campos.length + k); });
    return { todas: todas, nCiudad: 16, nCampos: campos.length, orden: orden, esCampo: function (i) { return i >= 16 && i < 16 + campos.length; } };
  })();

  // ---------- RÍO con cascada que baja de las colinas (rodea el reino por detrás) ----------
  var RIO = (function () {
    var pts = [];
    // nace arriba en la colina, cae en cascada y sigue por el valle hasta perderse entre los cerros
    [[1.02, 112], [0.98, 100], [0.95, 90], [0.9, 82], [0.7, 79], [0.45, 80], [0.2, 81], [-0.05, 80], [-0.3, 79], [-0.55, 81], [-0.8, 86], [-1.0, 96], [-1.15, 112], [-1.25, 130]]
      .forEach(function (q) { pts.push(new V3(Math.cos(q[0]) * q[1], 0, Math.sin(q[0]) * q[1])); });
    var c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    return { curva: c, m: c.getSpacedPoints(300) };
  })();
  function distRio(x, z) { var m = 1e9; for (var i = 0; i < RIO.m.length; i += 2) { var d = (RIO.m[i].x - x) * (RIO.m[i].x - x) + (RIO.m[i].z - z) * (RIO.m[i].z - z); if (d < m) m = d; } return Math.sqrt(m); }
  (function crearRio() {
    var n = 300, verts = [], idx = [], orilla = [], idxO = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, p = RIO.curva.getPointAt(u), t = RIO.curva.getTangentAt(u), perp = new V3(t.z, 0, -t.x).normalize();
      var w = 2.4 + Math.sin(i * 0.21) * 0.5 + (u > 0.25 ? 0.6 : -0.6), y = altura(p.x, p.z) + 0.16;
      verts.push(p.x + perp.x * w, y, p.z + perp.z * w, p.x - perp.x * w, y, p.z - perp.z * w);
      orilla.push(p.x + perp.x * (w + 1.1), y - 0.05, p.z + perp.z * (w + 1.1), p.x - perp.x * (w + 1.1), y - 0.05, p.z - perp.z * (w + 1.1));
      if (i < n) { var a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); idxO.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    function cinta(v, id, col, op) {
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(id); g.computeVertexNormals();
      var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide, transparent: op < 1, opacity: op })); m.receiveShadow = true; escena.add(m); return m;
    }
    cinta(orilla, idxO, 0x8a7a5a, 1);
    cinta(verts, idx, 0x3f8fb0, 0.92);
    // cascada: rocas grandes a los lados donde el agua baja de la colina, y espuma blanca abajo
    var rocas = new THREE.Group();
    for (var k = 0; k < 40; k++) {
      var u2 = 0.02 + Math.random() * 0.2, p2 = RIO.curva.getPointAt(u2), t2 = RIO.curva.getTangentAt(u2), pe = new V3(t2.z, 0, -t2.x).normalize().multiplyScalar((Math.random() < 0.5 ? -1 : 1) * (3.2 + Math.random() * 2.2));
      var ro = M.roca(1.2 + Math.random() * 2.2, Math.random() < 0.5 ? 0x8f8a80 : 0x7a756c); ro.position.set(p2.x + pe.x, altura(p2.x + pe.x, p2.z + pe.z), p2.z + pe.z); rocas.add(ro);
    }
    escena.add(M.fusionar(rocas));
    var pie = RIO.curva.getPointAt(0.24);
    for (var e = 0; e < 14; e++) {
      var es = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.6, 7, 5), new THREE.MeshLambertMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.8 }));
      es.position.set(pie.x + (Math.random() - 0.5) * 4, altura(pie.x, pie.z) + 0.3, pie.z + (Math.random() - 0.5) * 4); es.scale.y = 0.5; escena.add(es);
    }
    // puentecito de madera donde el río pasa más cerca
    var pb = RIO.curva.getPointAt(0.5), tb = RIO.curva.getTangentAt(0.5);
    var puente = new THREE.Group();
    puente.add(M.caja(3.2, 0.25, 7.5, 0x8a5a32, 0, 0.55, 0));
    [-1, 1].forEach(function (s) { puente.add(M.caja(0.18, 0.5, 7.5, 0x6a4424, s * 1.5, 0.9, 0)); });
    puente.position.set(pb.x, altura(pb.x, pb.z), pb.z); puente.rotation.y = Math.atan2(tb.x, tb.z) + Math.PI / 2; escena.add(puente);
  })();
  // ---------- FOSO DE AGUA alrededor de la muralla, con puente de piedra en la puerta ----------
  (function crearFoso() {
    var f = MURALLA_FORMA, n = 160, v = [], id = [], vb = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      v.push(f.cx + c * (f.rx + 1.1), 0.06, f.cz + s * (f.rz + 1.1), f.cx + c * (f.rx + 2.5), 0.06, f.cz + s * (f.rz + 2.5));
      vb.push(f.cx + c * (f.rx + 0.75), 0.045, f.cz + s * (f.rz + 0.75), f.cx + c * (f.rx + 2.85), 0.045, f.cz + s * (f.rz + 2.85));
      if (i < n) { var a = i * 2; id.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    [[vb, 0x7a7466, 1], [v, 0x3f8fb0, 0.92]].forEach(function (q) {
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q[0], 3)); g.setIndex(id.slice()); g.computeVertexNormals();
      var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: q[1], side: THREE.DoubleSide, transparent: q[2] < 1, opacity: q[2] })); m.receiveShadow = true; escena.add(m);
    });
    var fm = formaMuralla(), tp = fm.puerta, cx = Math.cos(tp), cz = Math.sin(tp);
    var px = f.cx + cx * (f.rx + 1.8), pz = f.cz + cz * (f.rz + 1.8);
    var pu = new THREE.Group();
    pu.add(M.caja(4.6, 0.3, 3.8, 0xa7a196, 0, 0.32, 0));
    [-1, 1].forEach(function (s2) { pu.add(M.caja(4.6, 0.45, 0.3, 0x948e84, 0, 0.62, s2 * 1.75)); [-1.9, 1.9].forEach(function (x2) { pu.add(M.caja(0.5, 0.75, 0.5, 0x8a847a, x2, 0.75, s2 * 1.75)); }); });
    pu.position.set(px, 0, pz); pu.rotation.y = -Math.atan2(cz * f.rz, cx * f.rx); escena.add(pu);
  })();
  (function crearNaturaleza() {
    var arboles = [];
    function libre(x, z, extra) {
      if (Math.hypot(x, z) < 15) return false;
      if (distRio(x, z) < 5 + extra) return false;
      var mfx = (x - MURALLA_FORMA.cx) / MURALLA_FORMA.rx, mfz = (z - MURALLA_FORMA.cz) / MURALLA_FORMA.rz;
      if (Math.abs(Math.sqrt(mfx * mfx + mfz * mfz) - 1) < 0.1) return false;
      if (distCamino(x, z) < 3.4 + extra) return false;
      for (var i = 0; i < PARCELAS.todas.length; i++) if (Math.hypot(x - PARCELAS.todas[i][0], z - PARCELAS.todas[i][1]) < 7 + extra) return false;
      if (Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) < ESTANQUE.r + 1.5) return false;
      if (Math.hypot(x - PUNTO_REUNION[0], z - PUNTO_REUNION[1]) < 6) return false;
      return true;
    }
    for (var i = 0; i < 3400 && arboles.length < 680; i++) {
      var x = (rnd() - 0.5) * 270, z = (rnd() - 0.5) * 270;
      var bosqueDensidad = Math.max(0, 1 - Math.hypot(x + 50, z + 30) / 26);
      var borde = Math.hypot(x, z) > 62 ? 0.45 : 0.04;
      if (x < -32 && z < 0) borde = 0.75;
      if (rnd() > Math.max(bosqueDensidad, borde)) continue;
      if (!libre(x, z, 0)) continue;
      var mex = (x - MURALLA_FORMA.cx) / MURALLA_FORMA.rx, mez = (z - MURALLA_FORMA.cz) / MURALLA_FORMA.rz;
      if (mex * mex + mez * mez < 1.15 && rnd() > 0.05) continue;
      // mezcla de especies: pinos en el bosque oscuro, palmeras cerca del pueblo y del estanque
      var cerca = Math.hypot(x, z) < 68 || Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) < 22;
      var enBosque = bosqueDensidad > 0.2 || (x < -32 && z < 0);
      var u = rnd(), tipo;
      if (enBosque) tipo = u < 0.55 ? 0 : u < 0.8 ? 2 : 1;
      else if (cerca) tipo = u < 0.38 ? 3 : u < 0.62 ? 2 : u < 0.85 ? 1 : 0;
      else tipo = u < 0.3 ? 0 : u < 0.55 ? 2 : u < 0.8 ? 1 : 3;
      var TONOS = [[0.31, 0.04, 0.32, 0.24, 0.06], [0.22, 0.06, 0.38, 0.33, 0.08], [0.27, 0.04, 0.34, 0.26, 0.07], [0.23, 0.04, 0.42, 0.33, 0.07]][tipo];
      arboles.push({
        x: x, z: z, s: (tipo === 3 ? 0.85 : 0.75) + rnd() * (tipo === 2 ? 0.6 : 0.75), rot: rnd() * 6, tipo: tipo, lean: rnd(),
        tono: new THREE.Color().setHSL(TONOS[0] + rnd() * TONOS[1], TONOS[2], TONOS[3] + rnd() * TONOS[4]).getHex()
      });
    }
    arboles.forEach(function (a) { a.y = altura(a.x, a.z); });
    escena.add(M.bosque(arboles));
    var arb = [], matas = [];
    for (var ia = 0; ia < 1600 && arb.length < 230; ia++) {
      var bx = (rnd() - 0.5) * 190, bz = (rnd() - 0.5) * 190;
      if (libre(bx, bz, 0.3)) arb.push({ x: bx, z: bz, s: 0.7 + rnd() * 0.6, rot: rnd() * 6 });
    }
    for (var im2 = 0; im2 < 4000 && matas.length < 1100; im2++) {
      var mx = (rnd() - 0.5) * 180, mz = (rnd() - 0.5) * 180;
      if (libre(mx, mz, -1.2) || (Math.hypot(mx, mz) > 6 && distCamino(mx, mz) > 2.3 && Math.hypot(mx, mz) < 15)) matas.push({ x: mx, z: mz, rot: rnd() * 6 });
    }
    escena.add(M.arbustos(arb));
    escena.add(M.matasPasto(matas));

    // rocas grandes y flores (todo en un grupo que se fusiona)
    var deco2 = new THREE.Group();
    for (var r = 0; r < 75; r++) {
      var rx = (rnd() - 0.5) * 180, rz = (rnd() - 0.5) * 180;
      if (!libre(rx, rz, 0.5)) continue;
      var ro = M.roca(0.6 + rnd() * 1.4);
      ro.position.x = rx; ro.position.z = rz; ro.position.y += altura(rx, rz);
      deco2.add(ro);
    }
    var colFlor = [0xf4efe2, 0xe8c85a, 0xe49aac, 0xb89ad8];
    for (var f = 0; f < 240; f++) {
      var fx = (rnd() - 0.5) * 115, fz = (rnd() - 0.5) * 115;
      if (!libre(fx, fz, -1.5) || Math.hypot(fx, fz) < 7) continue;
      var fl = M.flor(colFlor[f % 4]);
      fl.position.set(fx, 0, fz);
      deco2.add(fl);
    }
    escena.add(M.fusionar(deco2));
    // estanque
    var agua = new THREE.Mesh(new THREE.CircleGeometry(ESTANQUE.r + 0.3, 20),
      new THREE.MeshLambertMaterial({ color: 0x3f8fa0, transparent: true, opacity: 0.88 }));
    agua.rotation.x = -Math.PI / 2;
    agua.position.set(ESTANQUE.x, -0.15, ESTANQUE.z);
    escena.add(agua);
    for (var h = 0; h < 4; h++) {
      var hoja = M.cil(0.45, 0.45, 0.04, 8, 0x5a8a48, ESTANQUE.x + (rnd() - 0.5) * 6, -0.1, ESTANQUE.z + (rnd() - 0.5) * 6);
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
  for (var nn = 0; nn < 14; nn++) {
    var nu = M.nube();
    nu.position.set((rnd() - 0.5) * 220, 30 + rnd() * 10, (rnd() - 0.5) * 170);
    nu.userData.v = 0.6 + rnd() * 0.8;
    escena.add(nu);
    nubes.push(nu);
  }

  // ------------------------------------------------------------------
  //  CASTILLO Y TERRENOS
  // ------------------------------------------------------------------
  var castillo = M.castillo(1);
  castillo.userData.castillo = true;
  castillo.scale.setScalar(0.8);
  escena.add(castillo);
  var insigniaCastillo = null, andamiosCastillo = [], barraCastillo = null;
  function ponerCastillo() {
    escena.remove(castillo);
    var trc = tramoNivel(estado.castillo || 1);
    castillo = M.mejorarPorTramo(M.castillo(TRAMO_INTERNO[trc]), trc, 'castillo');
    castillo.userData.castillo = true;
    castillo.scale.setScalar(0.8);
    escena.add(castillo);
    if (insigniaCastillo) escena.remove(insigniaCastillo);
    insigniaCastillo = M.insigniaNivel(estado.castillo || 1);
    insigniaCastillo.position.set(0, 11.2, 0); insigniaCastillo.scale.set(1.8, 1.8, 1);
    escena.add(insigniaCastillo);
  }
  function danoCastillo() { return CASTILLO.dano + ((estado.castillo || 1) - 1) * MEJORA_CASTILLO.dano; }
  function costoCastillo(L) { return { oro: MEJORA_CASTILLO.costo[L - 1], madera: MEJORA_CASTILLO.madera[L - 1], piedra: MEJORA_CASTILLO.piedra[L - 1] }; }
  function tiempoCastillo(L) { return MEJORA_CASTILLO.tiempo[L - 1] * (1 - bono('obras')); }
  function andamiosDelCastillo(mostrar) {
    andamiosCastillo.forEach(function (a) { escena.remove(a); }); andamiosCastillo = [];
    if (barraCastillo) { escena.remove(barraCastillo); barraCastillo = null; }
    if (!mostrar) return;
    [[-3.8, -3.8], [3.8, -3.8], [-3.8, 3.8], [3.8, 3.8]].forEach(function (q) { var a = M.andamio(); a.scale.setScalar(1.25); a.position.set(q[0], 0, q[1]); escena.add(a); andamiosCastillo.push(a); });
    barraCastillo = M.barraVida(false, 4); barraCastillo.position.set(0, 12.6, 0); escena.add(barraCastillo);
  }
  // ---------- TRABAJOS: además de pagar, para subir de nivel hay que haber jugado ----------
  function logro(k) { return (estado.logros && estado.logros[k]) || 0; }
  function sumarLogro(k, n) { estado.logros = estado.logros || {}; estado.logros[k] = (estado.logros[k] || 0) + (n || 1); }
  function trabajosPara(que, L) {
    var tabla = que === 'castillo' ? TRABAJOS_CASTILLO : TRABAJOS_EDIFICIO, lista = [];
    for (var k in tabla) {
      var need = tabla[k][L] || 0; if (!need) continue;
      var have = k === 'oleadas' ? Math.max(0, (estado.oleada || 1) - 1) : logro(k);
      lista.push({ k: k, need: need, have: Math.min(have, need), ok: have >= need });
    }
    return lista;
  }
  // el dueño del juego no tiene límites
  function trabajosPendientes(que, L) { return estado.dueno ? [] : trabajosPara(que, L).filter(function (x) { return !x.ok; }); }
  function htmlTrabajos(que, L) {
    var l = trabajosPara(que, L); if (!l.length) return '';
    return '<div class="trabajos"><b>📋 ' + T('tr_titulo') + '</b>' + l.map(function (x) {
      var ok = x.ok || estado.dueno;
      return '<div class="tr-fila ' + (ok ? 'si' : 'no') + '"><span>' + (ok ? '✅' : '⬜') + ' ' + T('tr_' + x.k, { n: x.need }) + '</span><b>' + x.have + '/' + x.need + '</b></div>';
    }).join('') + '</div>';
  }
  function botonBloqueadoTrabajos(pend) { return '<button class="comprar bloqueado-tr" disabled>' + T('tr_falta', { t: T('tr_' + pend[0].k, { n: pend[0].need }) }) + '</button>'; }
  function avisoTrabajos(pend) { consejoTemporal(T('tr_falta', { t: T('tr_' + pend[0].k, { n: pend[0].need }) })); sonar('error'); }
  function mejorarCastillo() {
    var n = estado.castillo || 1;
    if (estado.obraCastillo || n >= NIVEL_MAX) return;
    var fc = faltaObra('castillo', n + 1); if (fc) { consejoTemporal('🔒 ' + fc); sonar('error'); return; }
    var pendC = trabajosPendientes('castillo', n + 1); if (pendC.length) { avisoTrabajos(pendC); return; }
    if (!pagar(costoCastillo(n + 1))) return;
    estado.obraCastillo = { nivel: n + 1, t: 0, total: tiempoCastillo(n + 1) };
    andamiosDelCastillo(true);
    sonar('martillo');
    cerrarPanel();
    guardar(true);
  }
  function terminarCastillo() {
    var o = estado.obraCastillo; estado.obraCastillo = null;
    var antes = vidaMaxCastillo();
    estado.castillo = o.nivel;
    estado.vidaCastillo = Math.min(vidaMaxCastillo(), estado.vidaCastillo + (vidaMaxCastillo() - antes));
    andamiosDelCastillo(false);
    ponerCastillo();
    actualizarParcelas();
    setTimeout(function () { consejoTemporal(T('parcelas_nuevas', { n: PARCELAS_POR_NIVEL })); }, 2500);
    chispas(new V3(0, 6, 0), 0xffe14a, 30, 5);
    sonar('listo'); sonar('victoria');
    consejoTemporal(T('castillo_listo', { n: o.nivel })); sumarXP(40 * o.nivel);
    actualizarHUD();
    guardar(true); publicarAldea(true);
    if (panelActual && panelActual.tipo === 'castillo') reabrirPanel();
    setTimeout(function () { mostrarNivelNuevo(o.nivel); }, 900);
  }
  function mostrarNivelNuevo(n) {
    var v = $('nivel-nuevo'); if (v) v.remove();
    var lista = [['🧱', L('+' + PARCELAS_POR_NIVEL + ' parcelas en la ciudad', '+' + PARCELAS_POR_NIVEL + ' plots in the city')], ['🏗️', L('Tus edificios pueden subir hasta el nivel ' + n, 'Your buildings can reach level ' + n)], ['🏰', L('La muralla puede subir hasta el nivel ' + n, 'The wall can reach level ' + n)], ['🚩', L('Puedes tener ' + n + ' casillas en el mundo', 'You can hold ' + n + ' world tiles')]];
    if (n === 5) lista.push(['🫧', L('Termina la burbuja de protección', 'The protection bubble ends')]);
    var d = document.createElement('div'); d.id = 'nivel-nuevo';
    d.innerHTML = '<div class="nn-caja"><div class="nn-cinta">' + L('¡Felicidades!', 'Congratulations!') + '</div><h3>🏰 ' + L('Castillo nivel ', 'Castle level ') + n + '</h3><p class="nota"><b>' + L('Desbloqueado', 'Unlocked') + '</b></p>' +
      lista.map(function (q) { return '<div class="nn-fila"><span>' + q[0] + '</span><span>' + q[1] + '</span></div>'; }).join('') + '<button class="comprar naranja boton-oleada-grande" id="nn-ok">OK</button></div>';
    document.body.appendChild(d); sonar('victoria');
    $('nn-ok').addEventListener('click', function () { sonar('click'); d.remove(); });
  }
  // ---------- MISIÓN GUÍA arriba: siempre dice qué hacer ahora ----------
  function hayEdif(t, n) { return edificiosDe(t).length >= (n || 1); }
  var MISIONES = [
    { es: 'Construye una Granja', en: 'Build a Farm', ok: function () { return hayEdif('granja'); }, p: { oro: 200, comida: 300 } },
    { es: 'Construye un Aserradero', en: 'Build a Sawmill', ok: function () { return hayEdif('aserradero'); }, p: { oro: 200, madera: 300 } },
    { es: 'Construye una Cantera', en: 'Build a Quarry', ok: function () { return hayEdif('cantera'); }, p: { oro: 200, piedra: 300 } },
    { es: 'Construye un Cuartel', en: 'Build a Barracks', ok: function () { return hayEdif('cuartel'); }, p: { oro: 300, comida: 300 } },
    { es: 'Entrena 10 tropas', en: 'Train 10 troops', ok: function () { return logro('tropas') >= 10; }, p: { comida: 500, gemas: 5 } },
    { es: 'Gana la oleada 1', en: 'Win wave 1', ok: function () { return (estado.oleada || 1) > 1; }, p: { oro: 400 } },
    { es: 'Construye una Mina de oro', en: 'Build a Gold mine', ok: function () { return hayEdif('mina'); }, p: { oro: 400 } },
    { es: 'Recolecta tus campos 5 veces', en: 'Collect your fields 5 times', ok: function () { return logro('recolectas') >= 5; }, p: { madera: 500, piedra: 500 } },
    { es: 'Sube el Castillo a nivel 2', en: 'Upgrade the Castle to level 2', ok: function () { return (estado.castillo || 1) >= 2; }, p: { oro: 600, gemas: 5 } },
    { es: 'Construye 2 Granjas', en: 'Build 2 Farms', ok: function () { return hayEdif('granja', 2); }, p: { comida: 800 } },
    { es: 'Construye la Academia', en: 'Build the Academy', ok: function () { return hayEdif('academia'); }, p: { oro: 800 } },
    { es: 'Mejora la Muralla a nivel 1', en: 'Upgrade the Wall to level 1', ok: function () { return (estado.muralla || 0) >= 1; }, p: { piedra: 1000 } },
    { es: 'Vence un campamento en el Mundo', en: 'Beat a camp in the World', ok: function () { return logro('campamentos') >= 1; }, p: { oro: 1000, gemas: 10 } },
    { es: 'Sube el Castillo a nivel 3', en: 'Upgrade the Castle to level 3', ok: function () { return (estado.castillo || 1) >= 3; }, p: { oro: 1500, gemas: 10 } },
    { es: 'Únete a una alianza', en: 'Join an alliance', ok: function () { return !!estado.alianza; }, p: { gemas: 15 } }
  ];
  function actualizarMision() {
    var b = $('mision'); if (!b) return;
    var i = estado.mision || 0, m = MISIONES[i];
    if (!m || enMenu || enMundo) { b.classList.add('oculto'); return; }
    var lista = m.ok(), txt = '📜 ' + (estado.idioma === 'en' ? m.en : m.es) + (lista ? ' <b class="mis-listo">' + L('¡Reclamar!', 'Claim!') + '</b>' : '');
    b.classList.remove('oculto'); b.classList.toggle('listo', lista);
    if (b.dataset.h !== txt) { b.innerHTML = txt; b.dataset.h = txt; }
  }
  function tocarMision() {
    var m = MISIONES[estado.mision || 0]; if (!m) return;
    if (!m.ok()) { consejoTemporal('📜 ' + (estado.idioma === 'en' ? m.en : m.es) + ' · ' + L('Premio: ', 'Reward: ') + textoPremioCorreo(m.p)); sonar('click'); return; }
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (m.p[r]) sumarRecurso(r, m.p[r]); });
    if (m.p.gemas) sumarGemas(m.p.gemas);
    estado.mision = (estado.mision || 0) + 1; sumarXP(30);
    sonar('victoria'); consejoTemporal(L('Misión cumplida: ', 'Quest done: ') + textoPremioCorreo(m.p)); actualizarHUD(); guardar(true); actualizarMision();
  }
  // ---------- BARRA DE OBRAS abajo: "Castillo (Nv 2) 19m48s" con Acelerar ----------
  function obraMasCercana() {
    var l = [];
    if (estado.obraCastillo) l.push({ que: 'castillo', nombre: T('castillo'), nivel: estado.obraCastillo.nivel, falta: (estado.obraCastillo.total - estado.obraCastillo.t) / velObras() });
    if (obraMuralla) l.push({ que: 'muralla', nombre: L('Muralla', 'Wall'), nivel: obraMuralla.nivel, falta: (obraMuralla.total - obraMuralla.t) / velObras() });
    slots.forEach(function (s) { if (s.obra) l.push({ que: 'obra:' + s.i, nombre: N(s.obra.tipo), nivel: s.obra.nivel, falta: (s.obra.total - s.obra.t) / velObras() }); });
    l.sort(function (a, b) { return a.falta - b.falta; });
    return l.length ? { o: l[0], mas: l.length - 1 } : null;
  }
  function actualizarBarraObra() {
    var b = $('barra-obra'); if (!b) return;
    var r = enMenu || enMundo || oleadaActiva ? null : obraMasCercana();
    if (!r) { b.classList.add('oculto'); return; }
    b.classList.remove('oculto'); b.dataset.que = r.o.que;
    var t = '🔨 ' + r.o.nombre + ' (' + L('Nv ', 'Lv ') + r.o.nivel + ') ' + fmtTiempo(r.o.falta) + (r.mas ? ' · +' + r.mas : '');
    if ($('bo-txt').textContent !== t) $('bo-txt').textContent = t;
  }
  var castilloPos = new V3(0, 0, 0), RADIO_CASTILLO = 4.6;
  var castilloCd = 0, impuestoCd = 0, comidaCd = 0, hambre = false;
  var murallaModelo = null, obraMuralla = null, murallaBarra = null, murallaAndamios = [], murallaRebote = 1;
  function bono(id) {
    var lv = (estado.invest && estado.invest[id]) || 0;
    for (var r in INVESTIGACION) for (var k = 0; k < INVESTIGACION[r].length; k++) if (INVESTIGACION[r][k].id === id) return lv * INVESTIGACION[r][k].cada;
    return 0;
  }
  function vidaMaxCastillo() { return INICIO.vidaCastillo + ((estado.castillo || 1) - 1) * MEJORA_CASTILLO.vida + (estado.muralla ? Math.round(MURALLA.vida[estado.muralla - 1] * (1 + bono('muros'))) : 0); }
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
  var torresPuerta = [];
  function ponerTorresPuerta(nivel) {
    torresPuerta.forEach(function (tp) { escena.remove(tp.grupo); }); torresPuerta = [];
    if (!nivel) return;
    var f = formaMuralla();
    [-1, 1].forEach(function (s) {
      var t = f.puerta + s * (f.hueco + 0.13);
      var x = f.cx + Math.cos(t) * f.rx * 1.1, z = f.cz + Math.sin(t) * f.rz * 1.1;
      var g = new THREE.Group(); g.position.set(x, 0, z);
      // mira hacia afuera (hacia el bosque)
      g.rotation.y = Math.atan2(Math.cos(t), Math.sin(t));
      var mo = crearModeloBase('torre', Math.max(2, tramoNivel(nivel)));
      mo.scale.setScalar(ESCALA_EDIFICIO * 1.15);
      g.add(mo); g.userData.castillo = true;
      escena.add(g);
      torresPuerta.push({ grupo: g, modelo: mo, pos: new V3(x, 0, z), cd: Math.random() });
    });
  }
  function ponerMuralla(nivel) {
    if (murallaModelo) { escena.remove(murallaModelo); murallaModelo = null; }
    ponerTorresPuerta(nivel);
    murallaModelo = M.muralla(nivel ? nivelVisual(nivel) : 0, formaMuralla());
    murallaModelo.userData.castillo = true;
    escena.add(murallaModelo);
  }
  function construirMuralla() {
    if (obraMuralla || estado.muralla >= NIVEL_MAX) return;
    var nivel = estado.muralla + 1;
    var fmu = faltaObra('muralla', nivel); if (fmu) { consejoTemporal('🔒 ' + fmu); sonar('error'); return; }
    if (!pagar(costoMuralla(nivel - 1))) return;
    iniciarObraMuralla(nivel, 0, MURALLA.tiempo[nivel - 1] * (1 - bono('obras')));
    sonar('martillo');
    cerrarPanel();
    guardar();
  }
  function iniciarObraMuralla(nivel, t, total) {
    obraMuralla = { nivel: nivel, t: t, total: total };
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
    consejoTemporal(T('muralla_lista', { n: o.nivel })); sumarXP(25 * o.nivel);
    actualizarHUD();
    guardar();
  }

  var slots = PARCELAS.todas.map(function (p, i) {
    var g = new THREE.Group(), campo = PARCELAS.esCampo(i);
    g.position.set(p[0], 0, p[1]);
    // los edificios de la ciudad miran hacia el camino; los campos, hacia el castillo
    var haciaCamino = campo ? new V3(0, 0, 0) : puntoMasCercano(p[0], p[1]);
    // girado solo en pasos de 90°: todo queda alineado con la cuadrícula
    g.rotation.y = campo ? Math.round(Math.atan2(-p[0], -p[1]) / (Math.PI / 2)) * (Math.PI / 2) : Math.round(Math.atan2(haciaCamino.x - p[0], haciaCamino.z - p[1]) / (Math.PI / 2)) * (Math.PI / 2);
    var t = M.parcelaLibre(campo);
    g.add(t);
    var tc = campo ? null : M.parcelaCerrada(); if (tc) { tc.visible = false; g.add(tc); }
    g.userData.slot = i;
    escena.add(g);
    return { i: i, campo: campo, orden: campo ? -1 : PARCELAS.orden.indexOf(i), pos: new V3(p[0], 0, p[1]), grupo: g, terreno: t, tierraCerrada: tc, edificio: null, obra: null, modelo: null, rebote: 1, cd: 0, guardado: 0 };
  });
  // ---- PARCELAS QUE ABRE EL CASTILLO ----
  function parcelasAbiertas() { return PARCELAS_INICIO + PARCELAS_POR_NIVEL * ((estado.castillo || 1) - 1); }
  function nivelParaParcela(s) { return Math.max(1, Math.ceil((s.orden + 1 - PARCELAS_INICIO) / PARCELAS_POR_NIVEL) + 1); }
  // una parcela de la ciudad está cerrada si el castillo no la abrió todavía (si ya tiene edificio, se queda)
  function cerrada(s) { return !s.campo && s.orden >= parcelasAbiertas() && !s.edificio && !s.obra; }
  function actualizarParcelas() {
    slots.forEach(function (s) {
      var c = cerrada(s);
      s.terreno.visible = !c;
      if (s.tierraCerrada) s.tierraCerrada.visible = c;
      // solo se marcan con candado las 3 parcelas que abre el siguiente nivel del castillo
      var proxima = c && nivelParaParcela(s) === (estado.castillo || 1) + 1;
      if (proxima && !s.candado) { s.candado = M.etiquetaEdificio('🔒 ' + T('castillo'), nivelParaParcela(s)); s.candado.position.set(0, 1.4, 0); s.candado.scale.multiplyScalar(0.8); s.grupo.add(s.candado); }
      if (!proxima && s.candado) { s.grupo.remove(s.candado); s.candado = null; }
    });
  }
  // ---- DEMOLER ----
  function vaciarParcela(s) {
    if (s.modelo) { s.grupo.remove(s.modelo); s.modelo = null; }
    if (s.andamio) { s.grupo.remove(s.andamio); s.andamio = null; }
    if (s.insignia) { s.grupo.remove(s.insignia); s.insignia = null; }
    if (s.barra) { escena.remove(s.barra); s.barra = null; }
    s.edificio = null; s.obra = null; s.guardado = 0; s.rebote = 1; s.cd = 0;
  }
  function demoler(i) {
    var s = slots[i]; if (!s || (!s.edificio && !s.obra)) return;
    if (oleadaActiva) { consejoTemporal(T('demoler_oleada')); sonar('error'); return; }
    var tipo = s.edificio ? s.edificio.tipo : s.obra.tipo;
    vaciarParcela(s);
    chispas(s.pos.clone().setY(1.2), 0x9a8a70, 30, 5); chispas(s.pos.clone().setY(0.5), 0x6a5a48, 16, 3);
    sonar('golpe'); sonar('martillo');
    consejoTemporal(T('demolido', { n: N(tipo) }));
    actualizarParcelas(); actualizarHUD(); guardar(true);
  }
  // ventana de confirmación del juego (para no borrar nada por accidente)
  function confirmarJuego(titulo, texto, si, alAceptar) {
    var v = $('confirmar-juego'); if (v) v.remove();
    var d = document.createElement('div'); d.id = 'confirmar-juego';
    d.innerHTML = '<div class="cj-caja"><h3>' + titulo + '</h3><p>' + texto + '</p><div class="cj-botones"><button class="comprar" id="cj-no">' + T('cancelar') + '</button><button class="comprar rojo" id="cj-si">' + si + '</button></div></div>';
    document.body.appendChild(d);
    $('cj-no').addEventListener('click', function () { sonar('click'); d.remove(); });
    $('cj-si').addEventListener('click', function () { d.remove(); alAceptar(); });
    d.addEventListener('click', function (ev) { if (ev.target === d) d.remove(); });
  }
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
    var l = miLugar();
    Cuentas.publicarAldea({ nombre: Cuentas.nombrePublico(), nivel: Math.max(1, estado.oleada), poder: Math.round(calcularPoder()), x: l.x, y: l.y, alianza: estado.alianza || null, escudo: estado.escudoHasta || 0, defensa: defensaReino(), espia: datosEspia() })
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
  // botón Mundo: la cámara de la ciudad se aleja y aparece el mapa del mundo
  function irAlMundo() {
    if (enMundo) return;
    cerrarPanel(); cerrarMenuEdif && cerrarMenuEdif();
    cam.distMeta = 170; sonar('magia');
    $('mundo-transicion') || (function () { var d = document.createElement('div'); d.id = 'mundo-transicion'; document.body.appendChild(d); })();
    $('mundo-transicion').classList.add('on');
    setTimeout(function () { abrirMundo(); setTimeout(function () { var t = $('mundo-transicion'); if (t) t.classList.remove('on'); }, 120); }, 520);
  }
  function abrirMundo() {
    $('mundo').classList.remove('oculto');
    enMundo = true;
    $('mundo-info').innerHTML = '<div class="carta"><p class="nota">' + T('mundo_toca') + '</p></div>';
    if (!M3) crearMundo3D();
    var yoC = celdaDe(miLugar().x, miLugar().y); M3.obj.copy(posCelda(yoC.x, yoC.y)); M3.zoom = { de: 74, a: 30, t0: performance.now() };
    $('mundo-coord').textContent = '📍 ' + L('Tu reino', 'Your kingdom') + ' · X ' + yoC.x + ' · Y ' + yoC.y;
    $('mundo-volver').querySelector('span').textContent = L('Mi ciudad', 'My city');
    pintarBuscador();
    if (!M3.corriendo) { M3.corriendo = true; requestAnimationFrame(dibujarMundo3D); }
    $('mundo-leyenda').innerHTML = Object.keys(TIPOS_CASILLA).map(function (k) { return '<span>' + TIPOS_CASILLA[k].icono + ' ' + T('cas_' + k) + '</span>'; }).join('') + '<span>🐗 ' + L('Bestias', 'Beasts') + '</span><span>🛖 ' + L('Aldeas bárbaras', 'Barbarian villages') + '</span><span>🟦 ' + L('Territorio de tu alianza', 'Your alliance territory') + '</span><span>🚩 ' + T('cas_mias', { n: misCasillas().length, m: maxCasillas() }) + '</span>';
    pintarAldeas([]);
    if (!hayCuenta()) { $('mundo-estado').textContent = T('mundo_cuenta'); return; }
    $('mundo-estado').textContent = T('mundo_cargando');
    publicarAldea(true);
    setTimeout(function () {
      Cuentas.casillas().then(function (cs) {
        casillasNube = {};
        var yo = Cuentas.usuario().uid;
        cs.forEach(function (q) { casillasNube[q.id] = q; });
        // si otro jugador me quitó una casilla, ya no es mía
        misCasillas().forEach(function (k) { if (casillasNube[k] && casillasNube[k].dueno !== yo) delete estado.casillas[k]; });
        if (aldeasCache.length) ponerCosasMundo(aldeasCache, yo);
      }).catch(function () {});
      Cuentas.aldeas().then(function (lista) {
        aldeasCache = lista;
        var otros = lista.filter(function (a) { return a.uid !== Cuentas.usuario().uid; }).length;
        $('mundo-estado').textContent = otros ? T('reinos_en_mapa', { n: lista.length }) : T('mundo_solo');
        pintarAldeas(lista);
      }).catch(function () { $('mundo-estado').textContent = T('mundo_error'); });
    }, 400);
  }
  // ------------------------------------------------------------------
  //  MAPA DEL MUNDO EN CUADRÍCULA (3D): casillas de llanura, bosque, colina, lago y montaña
  // ------------------------------------------------------------------
  var TAM_MUNDO = 40, CELDA_M = 2;
  var TIPOS_CASILLA = {
    llanura: { r: 'comida', color: 0xa9b86c, icono: '🌾' },
    bosque: { r: 'madera', color: 0x748f4a, icono: '🌲' },
    colina: { r: 'piedra', color: 0xbfae7c, icono: '⛰️' },
    lago: { r: 'comida', color: 0x4f8fb8, icono: '🌊' },
    montana: { r: 'oro', color: 0x9a948a, icono: '🏔️' }
  };
  function hashM(x, y) { var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
  function ruidoM(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = function (t) { return t * t * (3 - 2 * t); };
    var a = hashM(xi, yi), b = hashM(xi + 1, yi), c = hashM(xi, yi + 1), d = hashM(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  }
  // el mismo mapa para todos los jugadores (sale de una fórmula, no se guarda)
  function casillaMundo(x, y) {
    var n = ruidoM(x / 6, y / 6) * 0.65 + ruidoM(x / 2.5 + 50, y / 2.5 + 50) * 0.35;
    var tipo = n < 0.3 ? 'lago' : n < 0.5 ? 'llanura' : n < 0.66 ? 'bosque' : n < 0.8 ? 'colina' : 'montana';
    var lejos = Math.hypot(x - 20, y - 20) / 28;
    var nivel = Math.max(1, Math.min(5, 1 + Math.floor(hashM(x + 7, y + 13) * 3 + lejos * 2.5)));
    return { id: x + '_' + y, x: x, y: y, tipo: tipo, nivel: nivel };
  }
  function celdaDe(px, py) { return { x: Math.max(0, Math.min(TAM_MUNDO - 1, Math.floor(px * TAM_MUNDO / 100))), y: Math.max(0, Math.min(TAM_MUNDO - 1, Math.floor(py * TAM_MUNDO / 100))) }; }
  var ALT_TIPO = { llanura: 0, bosque: 0.04, colina: 0.22, montana: 0.36, lago: 0 };
  function posCelda(x, y) { var cx = Math.max(0, Math.min(TAM_MUNDO - 1, x)), cy = Math.max(0, Math.min(TAM_MUNDO - 1, y)); return new V3((x - TAM_MUNDO / 2 + 0.5) * CELDA_M, ALT_TIPO[casillaMundo(cx, cy).tipo] || 0, (y - TAM_MUNDO / 2 + 0.5) * CELDA_M); }
  function maxCasillas() { return estado.castillo || 1; }
  function misCasillas() { return Object.keys(estado.casillas || {}); }
  // bonus de producción de las casillas conquistadas (2% por nivel de cada casilla de ese recurso)
  function bonoCasillas(recurso) {
    var b = 0, c = estado.casillas || {};
    for (var k in c) if (TIPOS_CASILLA[c[k].tipo] && TIPOS_CASILLA[c[k].tipo].r === recurso) b += 0.02 * c[k].nivel;
    return b;
  }
  function defensaCasilla(c) { return Math.round(600 * Math.pow(c.nivel, 1.8)); }
  function defensaCampamento(n) { return Math.round(900 * Math.pow(n, 1.5)); }
  var casillasNube = {}, M3 = null, ocupadasMundo = {};
  // batalla genérica: devuelve si ganó, qué parte del ejército cae y qué tan bien le fue
  function resolverBatalla(f, d) {
    var fa = f * (0.85 + Math.random() * 0.3), fd = Math.max(1, d) * (0.85 + Math.random() * 0.3), gano = fa > fd;
    return { gano: gano, bajas: gano ? Math.min(0.5, Math.max(0.05, fd / fa * 0.4)) : Math.min(0.9, Math.max(0.3, fd / fa * 0.5)), margen: gano ? Math.min(1, 0.5 + (fa - fd) / fd) : 0 };
  }
  function bajasEjercito(frac) {
    var vivos = tropas.filter(function (u) { return !u.heroeId && !u.refuerzo; }), nb = Math.round(vivos.length * frac), caidas = 0;
    vivos.sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < nb && i < vivos.length; i++) { vivos[i].vida = 0; morir(vivos[i]); caidas++; }
    return caidas;
  }
  function crearMundo3D() {
    var cont = $('mundo-mapa');
    var r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.setClearColor(0xbfd8e6);
    r.domElement.id = 'mundo-3d';
    cont.appendChild(r.domElement);
    var e = new THREE.Scene();
    e.fog = new THREE.Fog(0xbfd8e6, 60, 130);
    e.add(new THREE.HemisphereLight(0xffffff, 0x6a7a5a, 0.75));
    var sol = new THREE.DirectionalLight(0xffffff, 0.65); sol.position.set(20, 40, 25); e.add(sol);
    var cam = new THREE.PerspectiveCamera(38, 1, 0.5, 300);
    // ---- suelo continuo: los terrenos se mezclan suave, con textura de pasto, colinas y lagos hundidos ----
    var COL_T = { llanura: new THREE.Color(0x8db455), bosque: new THREE.Color(0x5a8638), colina: new THREE.Color(0xb3a066), montana: new THREE.Color(0x8f8a80), lago: new THREE.Color(0xc9b27a) };
    var ALT_T = { llanura: 0, bosque: 0.04, colina: 0.22, montana: 0.36, lago: -0.3 };
    var lado = TAM_MUNDO * CELDA_M, seg = TAM_MUNDO * 4;
    function tipoEn(fx, fy) { var cx = Math.max(0, Math.min(TAM_MUNDO - 1, Math.floor(fx))), cy = Math.max(0, Math.min(TAM_MUNDO - 1, Math.floor(fy))); return casillaMundo(cx, cy).tipo; }
    var gs = new THREE.PlaneGeometry(lado + 6, lado + 6, seg + 12, seg + 12); gs.rotateX(-Math.PI / 2);
    var ps = gs.attributes.position, cols = [], cc = new THREE.Color();
    for (var iv = 0; iv < ps.count; iv++) {
      var wx = ps.getX(iv), wz = ps.getZ(iv), fx = wx / CELDA_M + TAM_MUNDO / 2 - 0.5, fy = wz / CELDA_M + TAM_MUNDO / 2 - 0.5;
      var x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      // mezcla de las 4 casillas vecinas (bilineal, con curva suave)
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      var t00 = tipoEn(x0, y0), t10 = tipoEn(x0 + 1, y0), t01 = tipoEn(x0, y0 + 1), t11 = tipoEn(x0 + 1, y0 + 1);
      var w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      var h = ALT_T[t00] * w00 + ALT_T[t10] * w10 + ALT_T[t01] * w01 + ALT_T[t11] * w11;
      h += (hashM(Math.round(wx * 3), Math.round(wz * 3)) - 0.5) * 0.05 + Math.sin(wx * 0.9) * Math.cos(wz * 0.7) * 0.04;
      var borde = Math.max(Math.abs(wx), Math.abs(wz)) - lado / 2; if (borde > 0) h -= borde * 0.25;
      ps.setY(iv, h);
      cc.setRGB(0, 0, 0);
      [[t00, w00], [t10, w10], [t01, w01], [t11, w11]].forEach(function (q) { cc.r += COL_T[q[0]].r * q[1]; cc.g += COL_T[q[0]].g * q[1]; cc.b += COL_T[q[0]].b * q[1]; });
      var nz = (hashM(Math.floor(wx * 1.3), Math.floor(wz * 1.3)) - 0.5) * 0.08 + Math.sin(wx * 0.35 + wz * 0.2) * 0.04;
      cols.push(Math.min(1, cc.r * (1 + nz)), Math.min(1, cc.g * (1 + nz)), Math.min(1, cc.b * (1 + nz)));
    }
    gs.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); gs.computeVertexNormals();
    var texM = texturaPasto(); texM.repeat.set(26, 26);
    var suelo = new THREE.Mesh(gs, new THREE.MeshLambertMaterial({ map: texM, vertexColors: true }));
    e.add(suelo);
    // agua de los lagos y cuadrícula muy suave (para saber dónde está cada casilla)
    var tmp = new THREE.Object3D(), col = new THREE.Color(), lagos = [], arboles = [], redondos = [], arbustos = [], flores = [], rocas = [], picos = [];
    var lineas = [];
    for (var y = 0; y < TAM_MUNDO; y++) for (var x = 0; x < TAM_MUNDO; x++) {
      var c = casillaMundo(x, y), p = posCelda(x, y), hh = function (s) { return hashM(x * 7.1 + s, y * 3.3 - s); };
      if (c.tipo === 'lago') lagos.push([p.x, p.z]);
      if (c.tipo === 'bosque') { var na = 6 + Math.floor(hh(1) * 3); for (var a = 0; a < na; a++) (hh(a + 9) < 0.6 ? arboles : redondos).push([p.x + (hh(a) - 0.5) * 1.75, p.z + (hh(a + 20) - 0.5) * 1.75, 0.7 + hh(a + 40) * 0.55]); }
      if (c.tipo === 'llanura') { if (hh(2) < 0.22) redondos.push([p.x + (hh(3) - 0.5) * 1.5, p.z + (hh(4) - 0.5) * 1.5, 0.6 + hh(5) * 0.4]); for (var b = 0; b < 2; b++) if (hh(b + 6) < 0.5) arbustos.push([p.x + (hh(b + 7) - 0.5) * 1.7, p.z + (hh(b + 8) - 0.5) * 1.7, 0.5 + hh(b) * 0.5]); for (var fl = 0; fl < 4; fl++) if (hh(fl + 30) < 0.45) flores.push([p.x + (hh(fl + 31) - 0.5) * 1.8, p.z + (hh(fl + 32) - 0.5) * 1.8, Math.floor(hh(fl + 33) * 4)]); }
      if (c.tipo === 'colina') { for (var r2 = 0; r2 < 3; r2++) rocas.push([p.x + (hh(r2 + 50) - 0.5) * 1.5, p.z + (hh(r2 + 51) - 0.5) * 1.5, 0.35 + hh(r2 + 52) * 0.4]); if (hh(60) < 0.6) arboles.push([p.x + (hh(61) - 0.5) * 1.4, p.z + (hh(62) - 0.5) * 1.4, 0.7]); arbustos.push([p.x + (hh(63) - 0.5) * 1.4, p.z + (hh(64) - 0.5) * 1.4, 0.6]); }
      if (c.tipo === 'montana') { var np = 2 + Math.floor(hh(70) * 2); for (var m2 = 0; m2 < np; m2++) picos.push([p.x + (hh(m2 + 71) - 0.5) * 1.0, p.z + (hh(m2 + 72) - 0.5) * 1.0, (m2 === 0 ? 1.0 : 0.6) + c.nivel * 0.05 + hh(m2 + 73) * 0.25]); }
    }
    for (var gl = 0; gl <= TAM_MUNDO; gl++) { var v0 = (gl - TAM_MUNDO / 2) * CELDA_M; lineas.push(v0, 0.06, -lado / 2, v0, 0.06, lado / 2, -lado / 2, 0.06, v0, lado / 2, 0.06, v0); }
    var gLin = new THREE.BufferGeometry(); gLin.setAttribute('position', new THREE.Float32BufferAttribute(lineas, 3));
    e.add(new THREE.LineSegments(gLin, new THREE.LineBasicMaterial({ color: 0x2a3a1a, transparent: true, opacity: 0.13, depthWrite: false })));
    function instancias(geo, color, lista, fn, varia) {
      if (!lista.length) return;
      var im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), lista.length);
      lista.forEach(function (q, i) { tmp.rotation.set(0, 0, 0); fn(q); tmp.updateMatrix(); im.setMatrixAt(i, tmp.matrix); col.setHex(typeof color === 'function' ? color(q) : color); if (varia) col.offsetHSL((hashM(q[0], q[1]) - 0.5) * 0.04, 0, (hashM(q[1], q[0]) - 0.5) * varia); im.setColorAt(i, col); });
      e.add(im);
    }
    // una sola capa de agua debajo de todo: los lagos (más hundidos) quedan con orillas curvas
    var agua = new THREE.Mesh(new THREE.PlaneGeometry(lado + 40, lado + 40), new THREE.MeshLambertMaterial({ color: 0x3f8fc0, transparent: true, opacity: 0.9 }));
    agua.rotation.x = -Math.PI / 2; agua.position.y = -0.11; e.add(agua);
    // pinos (dos conos), árboles redondos, arbustos, flores, rocas y montañas de varios picos con nieve
    instancias(new THREE.ConeGeometry(0.34, 0.75, 7), 0x3f6f30, arboles, function (q) { tmp.position.set(q[0], 0.55 * q[2], q[1]); tmp.scale.setScalar(q[2]); }, 0.08);
    instancias(new THREE.ConeGeometry(0.26, 0.55, 7), 0x4f8138, arboles, function (q) { tmp.position.set(q[0], 0.95 * q[2], q[1]); tmp.scale.setScalar(q[2]); }, 0.08);
    instancias(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5), 0x6a4426, arboles.concat(redondos), function (q) { tmp.position.set(q[0], 0.14 * q[2], q[1]); tmp.scale.setScalar(q[2]); });
    instancias(new THREE.IcosahedronGeometry(0.3, 0), 0x5a9a3c, redondos, function (q) { tmp.position.set(q[0], 0.48 * q[2], q[1]); tmp.scale.set(q[2], q[2] * 0.9, q[2]); tmp.rotation.set(0, hashM(q[0], q[1]) * 6, 0); }, 0.1);
    instancias(new THREE.IcosahedronGeometry(0.16, 0), 0x6aa846, arbustos, function (q) { tmp.position.set(q[0], 0.08 * q[2], q[1]); tmp.scale.set(q[2], q[2] * 0.7, q[2]); }, 0.12);
    var COLF = [0xf4efe2, 0xe8c85a, 0xe49aac, 0xb89ad8];
    instancias(new THREE.SphereGeometry(0.05, 5, 3), function (q) { return COLF[q[2]]; }, flores, function (q) { tmp.position.set(q[0], 0.05, q[1]); tmp.scale.setScalar(1); });
    instancias(new THREE.DodecahedronGeometry(0.3, 0), 0x9a958a, rocas, function (q) { tmp.position.set(q[0], 0.12 + 0.1 * q[2], q[1]); tmp.scale.set(q[2], q[2] * 0.7, q[2]); tmp.rotation.set(0, hashM(q[0], q[1]) * 5, 0); }, 0.1);
    instancias(new THREE.ConeGeometry(0.75, 1.5, 7), 0x7f7a70, picos, function (q) { tmp.position.set(q[0], 0.7 * q[2], q[1]); tmp.scale.set(q[2], q[2], q[2]); tmp.rotation.set(0, hashM(q[0], q[1]) * 3, 0); }, 0.08);
    instancias(new THREE.ConeGeometry(0.3, 0.42, 7), 0xf6f6f2, picos.filter(function (q) { return q[2] > 0.9; }), function (q) { tmp.position.set(q[0], (1.28) * q[2], q[1]); tmp.scale.set(q[2], q[2], q[2]); tmp.rotation.set(0, hashM(q[0], q[1]) * 3, 0); });
    // marco de madera alrededor del mundo
    var marco = new THREE.Mesh(new THREE.BoxGeometry(TAM_MUNDO * CELDA_M + 1.2, 0.5, TAM_MUNDO * CELDA_M + 1.2), new THREE.MeshLambertMaterial({ color: 0x5e3d24 }));
    marco.position.y = -0.45; e.add(marco);
    // marcador de la casilla elegida
    var sel = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.98, 4), new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.95, depthWrite: false }));
    sel.rotation.x = -Math.PI / 2; sel.rotation.z = Math.PI / 4; sel.position.y = 0.05; sel.visible = false; sel.renderOrder = 5; e.add(sel);
    var cosas = new THREE.Group(); e.add(cosas);
    M3 = { r: r, e: e, cam: cam, cosas: cosas, sel: sel, obj: new V3(0, 0, 0), dist: 26, corriendo: false, celdas: {} };
    // mover con el dedo / ratón, acercar con rueda o pellizco, tocar para elegir
    var el = r.domElement, dedos = {}, inicio = null, pell = null;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', function (ev) { try { el.setPointerCapture(ev.pointerId); } catch (x) {} dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY }; var ids = Object.keys(dedos); if (ids.length === 1) inicio = { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, movio: false }; if (ids.length === 2) { var a = dedos[ids[0]], b = dedos[ids[1]]; pell = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: M3.dist }; inicio = null; } });
    el.addEventListener('pointermove', function (ev) {
      if (!dedos[ev.pointerId]) return; dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(dedos);
      if (pell && ids.length === 2) { var a = dedos[ids[0]], b = dedos[ids[1]]; M3.dist = Math.max(12, Math.min(75, pell.dist * pell.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))); return; }
      if (!inicio) return;
      var dx = ev.clientX - inicio.x, dy = ev.clientY - inicio.y; inicio.x = ev.clientX; inicio.y = ev.clientY;
      if (Math.hypot(ev.clientX - inicio.sx, ev.clientY - inicio.sy) > 6) inicio.movio = true;
      var kk = M3.dist / el.clientHeight * 1.3, lim = TAM_MUNDO * CELDA_M / 2;
      M3.obj.x = Math.max(-lim, Math.min(lim, M3.obj.x - dx * kk)); M3.obj.z = Math.max(-lim, Math.min(lim, M3.obj.z - dy * kk * 1.25));
    });
    function soltar(ev) {
      var era = inicio; delete dedos[ev.pointerId];
      if (Object.keys(dedos).length < 2) pell = null;
      if (era && !era.movio && ev.type === 'pointerup') tocarMundo(ev.clientX, ev.clientY);
      if (!Object.keys(dedos).length) inicio = null;
    }
    el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
    el.addEventListener('wheel', function (ev) { ev.preventDefault(); M3.dist = Math.max(12, Math.min(75, M3.dist * (ev.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false });
  }
  var rayoM = new THREE.Raycaster(), planoM = new THREE.Plane(new V3(0, 1, 0), 0);
  function tocarMundo(cx, cy) {
    var rc = M3.r.domElement.getBoundingClientRect();
    var v = new THREE.Vector2((cx - rc.left) / rc.width * 2 - 1, -(cy - rc.top) / rc.height * 2 + 1);
    rayoM.setFromCamera(v, M3.cam);
    var p = new V3(); if (!rayoM.ray.intersectPlane(planoM, p)) return;
    var x = Math.floor(p.x / CELDA_M + TAM_MUNDO / 2), y = Math.floor(p.z / CELDA_M + TAM_MUNDO / 2);
    if (x < 0 || y < 0 || x >= TAM_MUNDO || y >= TAM_MUNDO) return;
    sonar('click');
    elegirCelda(x, y);
  }
  function elegirCelda(x, y) {
    var p = posCelda(x, y);
    M3.sel.position.set(p.x, 0.06, p.z); M3.sel.visible = true;
    var cc0 = casillaMundo(x, y); $('mundo-coord').textContent = '📍 ' + TIPOS_CASILLA[cc0.tipo].icono + ' ' + T('cas_' + cc0.tipo) + ' · X ' + x + ' · Y ' + y;
    var q = ocupadasMundo[x + '_' + y];
    if (q && q.bestia !== undefined) { mostrarBestia(q.bestia); return; }
    M3.sel.material.color.setHex(0xffe14a);
    if (!M3.verde) { M3.verde = new THREE.Mesh(new THREE.PlaneGeometry(CELDA_M * 0.98, CELDA_M * 0.98), new THREE.MeshBasicMaterial({ color: 0x3fd45a, transparent: true, opacity: 0.55, depthWrite: false })); M3.verde.rotation.x = -Math.PI / 2; M3.verde.renderOrder = 3; M3.e.add(M3.verde); }
    M3.verde.visible = false;
    if (q && q.aldea !== undefined) { M3.sel.material.color.setHex(0x3fd45a); M3.verde.position.set(p.x, 0.09, p.z); M3.verde.visible = true; M3.obj.copy(posCelda(x, y)); M3.obj.z += 2.5; $('mundo-info').innerHTML = ''; var b = $('mundo-aldeas').querySelector('[data-aldea="' + q.aldea + '"]'); if (b) b.click(); return; }
    if (q && q.campamento !== undefined) { mostrarCampamento(q.campamento); return; }
    mostrarCasilla(casillaMundo(x, y));
  }
  function dibujarMundo3D() {
    if (!M3 || !enMundo) { if (M3) M3.corriendo = false; return; }
    var cont = $('mundo-mapa'), w = cont.clientWidth, h = cont.clientHeight;
    if (M3.w !== w || M3.h !== h) { M3.r.setSize(w, h); M3.cam.aspect = w / h; M3.cam.updateProjectionMatrix(); M3.w = w; M3.h = h; }
    if (M3.zoom) { var kz = Math.min(1, (performance.now() - M3.zoom.t0) / 750), ez = 1 - Math.pow(1 - kz, 3); M3.dist = M3.zoom.de + (M3.zoom.a - M3.zoom.de) * ez; if (kz >= 1) M3.zoom = null; }
    var d = M3.dist;
    M3.cam.position.set(M3.obj.x, d * 0.85, M3.obj.z + d * 0.62); M3.cam.lookAt(M3.obj);
    M3.sel.material.opacity = 0.6 + Math.sin(performance.now() / 200) * 0.35;
    actualizarEfectosPortal();
    actualizarCarretasMundo();
    actualizarMarchasMundo();
    M3.r.render(M3.e, M3.cam);
    requestAnimationFrame(dibujarMundo3D);
  }
  // castillos, campamentos y banderas de las casillas conquistadas
  function aldeaBarbara(nivel) {
    var g = new THREE.Group(), n = 3 + Math.min(3, Math.floor(nivel / 4));
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2 + 0.4, r = 0.42, x = Math.cos(a) * r, z = Math.sin(a) * r;
      g.add(M.cil(0.2, 0.22, 0.26, 8, 0x8a6038, x, 0.13, z));
      g.add(M.cono(0.3, 0.32, 8, 0xc9a24e, x, 0.42, z));
      g.add(M.caja(0.08, 0.14, 0.02, 0x3a2414, x + Math.cos(a) * 0.2, 0.08, z + Math.sin(a) * 0.2).rotateY(-a + Math.PI / 2));
    }
    for (var s = 0; s < 18; s++) { var b = s / 18 * Math.PI * 2; if (Math.abs(b - 4.4) < 0.3) continue; g.add(M.cono(0.04, 0.36, 4, 0x6a4424, Math.cos(b) * 0.82, 0.18, Math.sin(b) * 0.82)); }
    g.add(M.cil(0.12, 0.14, 0.05, 6, 0x5a5048, 0, 0.03, 0)); g.add(M.cono(0.08, 0.2, 5, 0xff8a2a, 0, 0.12, 0));
    g.add(M.cil(0.02, 0.02, 0.9, 5, 0x4a2c18, 0.15, 0.45, 0.15)); g.add(M.caja(0.24, 0.16, 0.02, 0xb0302a, 0.28, 0.82, 0.15));
    return g;
  }
  function ponerCosasMundo(lista, yo) {
    if (!M3) crearMundo3D();
    while (M3.cosas.children.length) M3.cosas.remove(M3.cosas.children[0]);
    ocupadasMundo = {};
    CAMPAMENTOS.forEach(function (cm, i) {
      var c = celdaDe(cm.x, cm.y), p = posCelda(c.x, c.y), g = new THREE.Group();
      var ab = aldeaBarbara(cm.nivel); ab.scale.setScalar(1.35); g.add(ab);
      var et = M.etiquetaEdificio('🛖 ' + T('leyenda_trasgos'), cm.nivel); et.position.set(0, 1.8, 0); et.scale.multiplyScalar(0.56); g.add(et);
      g.position.copy(p); M3.cosas.add(g);
      ocupadasMundo[c.x + '_' + c.y] = { campamento: i };
    });
    lista.forEach(function (a, i) {
      var c = celdaDe(a.x, a.y), p = posCelda(c.x, c.y), g = new THREE.Group();
      var tam = a.uid === yo ? nivelVisual(estado.castillo || 1) : (a.nivel <= 4 ? 1 : a.nivel <= 8 ? 2 : 3);
      var cs = M.castillo(tam); cs.scale.setScalar(0.12); g.add(cs);
      var esYo = a.uid === yo, aliada = estado.alianza && a.alianza === estado.alianza;
      if (esYo || aliada) { var aro = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 24), new THREE.MeshBasicMaterial({ color: esYo ? 0xffd34a : 0x4aa3ff, depthWrite: false, transparent: true })); aro.rotation.x = -Math.PI / 2; aro.position.y = 0.04; g.add(aro); }
      var prot = (a.escudo || 0) > Date.now();
      var et = M.etiquetaEdificio((esYo ? '👑 ' : aliada ? '🛡️ ' : '') + String(a.nombre).slice(0, 14) + (prot ? ' 🫧' + fmtLargo((a.escudo - Date.now()) / 1000) : ''), a.nivel || 1); et.position.set(0, 2.7, 0); et.scale.multiplyScalar(0.62); g.add(et);
      if (estado.alianza && (aliada || esYo)) { g.add(M.cil(0.05, 0.05, 1.7, 6, 0x5e3d24, -1.05, 0.85, 0.2)); g.add(M.caja(0.62, 0.42, 0.04, 0x2a6ad0, -0.71, 1.45, 0.2)); g.add(M.caja(0.2, 0.2, 0.05, 0xf2c45a, -0.71, 1.45, 0.23)); }
      if (prot) { var cup = new THREE.Mesh(new THREE.SphereGeometry(1.35, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8fd6ff, transparent: true, opacity: 0.3, depthWrite: false })); g.add(cup); }
      g.position.copy(p); M3.cosas.add(g);
      ocupadasMundo[c.x + '_' + c.y] = { aldea: i };
      if (esYo) M3.miCelda = c;
    });
    listaBestias().forEach(function (b, i) {
      if (bestiaMuerta(b)) return;
      var k = b.x + '_' + b.y; if (ocupadasMundo[k] || casillasNube[k] || (estado.casillas || {})[k]) return;
      var g = modeloBestia(b), p = posCelda(b.x, b.y); g.position.copy(p); M3.cosas.add(g);
      ocupadasMundo[k] = { bestia: i };
    });
    // banderas en las casillas conquistadas (mías doradas, de mi hermandad azules, de otros rojas)
    var todas = {};
    for (var k in casillasNube) todas[k] = casillasNube[k];
    misCasillas().forEach(function (k) { todas[k] = { dueno: yo, nombre: '' }; });
    Object.keys(todas).forEach(function (k) {
      var xy = k.split('_'), p = posCelda(+xy[0], +xy[1]), dq = todas[k];
      var color = dq.dueno === yo ? 0xffc93a : (estado.alianza && dq.alianza === estado.alianza ? 0x4aa3ff : 0xd2463a);
      var f = new THREE.Group();
      f.add(M.cil(0.03, 0.03, 0.9, 5, 0x5e3d24, 0.6, 0.45, 0.6));
      f.add(M.caja(0.35, 0.22, 0.02, color, 0.78, 0.78, 0.6));
      var borde = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.94, 4), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8, depthWrite: false }));
      borde.rotation.x = -Math.PI / 2; borde.rotation.z = Math.PI / 4; borde.position.y = 0.03; f.add(borde);
      if (estado.alianza && (dq.alianza === estado.alianza || dq.dueno === yo)) {
        var terr = new THREE.Mesh(new THREE.PlaneGeometry(CELDA_M * 0.94, CELDA_M * 0.94), new THREE.MeshBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.45, depthWrite: false })); terr.rotation.x = -Math.PI / 2; terr.position.y = 0.025; f.add(terr);
        var tc = casillaMundo(+xy[0], +xy[1]).tipo, eb = tc === 'bosque' ? M.aserradero(1) : tc === 'colina' ? M.cantera(1) : tc === 'montana' ? M.minaOro(1) : M.granja(1);
        eb.scale.setScalar(0.17); eb.position.set(-0.25, 0, -0.2); f.add(eb);
      }
      f.position.copy(p); M3.cosas.add(f);
    });
  }
  function mostrarCasilla(c) {
    var t = TIPOS_CASILLA[c.tipo], mia = !!(estado.casillas || {})[c.id], nube = casillasNube[c.id];
    var yo = hayCuenta() ? Cuentas.usuario().uid : '__yo';
    var deOtro = nube && nube.dueno !== yo && !mia;
    var libreTel = celdaLibre(c.x, c.y), ocupante = mia ? T('cas_tuya') : deOtro ? escaparHTML(nube.nombre || '?') : (libreTel ? T('cas_libre_corto') : '—');
    var np = (estado.mochila && estado.mochila.portal_elegir) || 0, pt = TIENDA.filter(function (x) { return x.id === 'portal_elegir'; })[0];
    var html = '<div class="carta casilla-info"><h3>' + t.icono + ' ' + T('cas_' + c.tipo) + ' <span class="me-nivel">' + c.nivel + '</span></h3>' +
      '<div class="casilla-tabla"><span>' + T('cas_terreno') + '</span><b>' + t.icono + ' ' + T('cas_' + c.tipo) + '</b>' +
      '<span>' + T('cas_coord') + '</span><b>X ' + c.x + ' · Y ' + c.y + '</b>' +
      '<span>' + T('cas_ocupada_por') + '</span><b>' + ocupante + '</b>' +
      '<span>' + ICONO_RECURSO[t.r] + '</span><b>+' + Math.round(2 * c.nivel) + '% ' + T('r_' + t.r) + ' · 🛡️ ' + formatoNumero(defensaCasilla(c)) + '</b>' +
      '<span>' + L('Edificio', 'Building') + '</span><b>' + edificioCasilla(c.tipo) + '</b><span>' + L('Capacidad', 'Capacity') + '</span><b>' + formatoNumero(guardadoCasilla(c).max) + ' ' + ICONO_RECURSO[t.r] + '</b><span>' + L('Recolección', 'Gathering') + '</span><b>+' + formatoNumero(guardadoCasilla(c).hora) + ' ' + L('por hora', 'per hour') + '</b></div>' +
      (deOtro && estado.alianza && nube.alianza === estado.alianza ? '<p class="nota">🛡️ ' + L('Es de tu alianza: produce +' + formatoNumero(guardadoCasilla(c).hora) + ' ' + T('r_' + t.r) + ' por hora para ' + escaparHTML(nube.nombre || '?') + '.', 'It belongs to your alliance: it makes +' + formatoNumero(guardadoCasilla(c).hora) + ' ' + T('r_' + t.r) + ' per hour for ' + escaparHTML(nube.nombre || '?') + '.') + '</p>' : '') +
      '<div class="casilla-botones"><button class="comprar morado" id="cas-portal"' + (libreTel ? '' : ' disabled') + '>' + T('cas_reubicar') + (libreTel ? ' · ' + (np ? T('tel_tienes', { n: np }) : '<span class="ico gema"></span>' + pt.gemas) : '') + '</button>' +
      (mia ? '<button class="comprar" id="cas-soltar">' + T('cas_abandonar') + '</button>' : '<button class="comprar rojo" id="cas-conquistar">' + T('cas_ocupar') + '</button>') + '</div>';
    if (mia) { var gd = guardadoCasilla(c), rr = TIPOS_CASILLA[c.tipo].r; html += '<p class="nota">' + ICONO_RECURSO[rr] + ' ' + T('cas_guardado', { a: formatoNumero(gd.n), m: formatoNumero(gd.max), r: T('r_' + rr), h: formatoNumero(gd.hora) }) + '</p><button class="comprar naranja" id="cas-recoger"' + (gd.n >= 1 ? '' : ' disabled') + '>' + T('cas_recolectar') + ' · ' + T('car_estado', { l: carretasLibres(), n: carretas().n }) + '</button>'; }
    if (!mia) html += '<p class="nota">' + (deOtro ? T('cas_de', { n: escaparHTML(nube.nombre || '?') }) : T('cas_libre', { n: misCasillas().length, m: maxCasillas() })) + '</p>';
    $('mundo-info').innerHTML = html + '</div>';
    var bc = $('cas-conquistar'); if (bc) bc.addEventListener('click', function () { this.disabled = true; conquistarCasilla(c, deOtro ? nube : null); });
    var bs = $('cas-soltar'); if (bs) bs.addEventListener('click', function () { soltarCasilla(c); });
    var brc = $('cas-recoger'); if (brc) brc.addEventListener('click', function () { recogerCasilla(c); });
    var bp = $('cas-portal'); if (bp) bp.addEventListener('click', function () {
      var no = puedeTeleportar(); if (no) { consejoTemporal(no); sonar('error'); return; }
      confirmarJuego('✨ ' + T('tel_titulo'), T('tel_txt', { x: c.x, y: c.y }), T('tel_aqui'), function () {
        if (!(estado.mochila.portal_elegir > 0)) { var pt = TIENDA.filter(function (x) { return x.id === 'portal_elegir'; })[0]; if (!pagar(0, pt.gemas)) return; estado.mochila.portal_elegir = (estado.mochila.portal_elegir || 0) + 1; }
        teletransportar(c.x, c.y, 'portal_elegir');
      });
    });
  }
  // lo que tiene guardado una casilla tuya (crece por hora hasta un tope)
  function guardadoCasilla(c) {
    var info = (estado.casillas || {})[c.id] || {}, hora = Math.round(CASILLA_RECOGER.porNivel * (c.nivel || 1) * (1 + 0.06 * tecAl('recoleccion'))), max = hora * CASILLA_RECOGER.horas;
    if (!info.recogido) info.recogido = Date.now() - 3600 * 1000;
    return { n: Math.min(max, Math.floor((Date.now() - info.recogido) / 3600000 * hora)), max: max, hora: hora, info: info };
  }
  function recogerCasilla(c) {
    var gd = guardadoCasilla(c); if (gd.n < 1) { consejoTemporal(T('cas_nada')); sonar('error'); return; }
    var libres = carretasLibres(); if (!libres) { consejoTemporal(T('car_faltan', { n: 1, l: 0 })); sonar('error'); return; }
    var lleva = Math.min(gd.n, libres * capCarreta()), nc = carretasPara(lleva), r = TIPOS_CASILLA[c.tipo].r, rec = {};
    rec[r] = lleva;
    gd.info.recogido = Date.now() - Math.max(0, gd.n - lleva) / gd.hora * 3600000;
    estado.casillas[c.id] = gd.info;
    salirCarretas('recoger', miLugar(), { x: aCoord(c.x), y: aCoord(c.y) }, rec, nc, T('cas_' + c.tipo));
    sonar('click'); guardar(true); mostrarCasilla(c);
  }
  function edificioCasilla(tipo) { return ({ bosque: '🪵 ' + L('Aserradero', 'Sawmill'), colina: '🪨 ' + L('Cantera', 'Quarry'), montana: '🪙 ' + L('Mina', 'Mine'), llanura: '🌾 ' + L('Molino', 'Mill'), lago: '🎣 ' + L('Pesquera', 'Fishery') })[tipo] || '—'; }
  // ---------- BESTIAS del mundo: se atacan por recompensas y vuelven a salir a los 30 minutos ----------
  var TIPOS_BESTIA = {
    jabali: { icono: '🐗', color: 0x6a4a30, colmillo: 0xf3ead8, es: 'Jabalí salvaje', en: 'Wild boar' },
    lobo: { icono: '🐺', color: 0x7f858e, colmillo: 0xf3ead8, es: 'Lobo gris', en: 'Grey wolf' },
    oso: { icono: '🐻', color: 0x5a3a22, colmillo: 0xf3ead8, es: 'Oso pardo', en: 'Brown bear' }
  };
  var bestiasCache = null;
  function listaBestias() {
    if (bestiasCache) return bestiasCache;
    var l = [], usadas = {};
    for (var i = 0; i < 120 && l.length < 42; i++) {
      var x = Math.floor(hashM(i * 3.17 + 1, 7.7) * TAM_MUNDO), y = Math.floor(hashM(11.3, i * 2.71 + 5) * TAM_MUNDO), c = casillaMundo(x, y), k = x + '_' + y;
      if (c.tipo === 'lago' || c.tipo === 'montana' || usadas[k]) continue;
      usadas[k] = 1;
      var lejos = Math.hypot(x - 20, y - 20) / 28, nivel = Math.max(1, Math.min(10, 1 + Math.floor(hashM(x + 3, y + 9) * 4 + lejos * 6)));
      l.push({ id: 'b' + k, x: x, y: y, nivel: nivel, tipo: c.tipo === 'llanura' ? 'jabali' : c.tipo === 'bosque' ? 'lobo' : 'oso' });
    }
    return (bestiasCache = l);
  }
  function bestiaMuerta(b) { return ((estado.bestias || {})[b.id] || 0) > Date.now(); }
  function nombreBestia(b) { var t = TIPOS_BESTIA[b.tipo]; return t.icono + ' ' + (estado.idioma === 'en' ? t.en : t.es); }
  function defensaBestia(n) { return Math.round(450 * Math.pow(n, 1.75)); }
  function premioBestia(n) {
    var p = { oro: 70 * n, comida: 110 * n, madera: 60 * n, piedra: n >= 4 ? 30 * n : 0, puntos: 10 * n };
    var r = Math.random();
    if (n >= 6 && r < 0.35) p.objeto = 'libro_gra'; else if (r < 0.55) p.objeto = 'libro_peq'; else if (r < 0.8) p.objeto = n >= 5 ? 'acel_1h' : 'acel_15m';
    if (Math.random() < 0.25) p.pieza = rarezaAlAzar(n * 2);
    return p;
  }
  function modeloBestia(b) {
    var t = TIPOS_BESTIA[b.tipo], g = new THREE.Group(), s = 0.55 + b.nivel * 0.05, oso = b.tipo === 'oso';
    var cuerpo = M.caja(0.7 * s, (oso ? 0.48 : 0.36) * s, 0.38 * s, t.color, 0, (oso ? 0.42 : 0.36) * s, 0); g.add(cuerpo);
    g.add(M.caja(0.3 * s, 0.28 * s, 0.3 * s, t.color, 0.46 * s, (oso ? 0.55 : 0.46) * s, 0));
    g.add(M.caja(0.16 * s, 0.12 * s, 0.18 * s, b.tipo === 'jabali' ? 0xc98a7a : 0x3a2414, 0.66 * s, (oso ? 0.5 : 0.42) * s, 0));
    if (b.tipo === 'lobo') [-1, 1].forEach(function (z) { g.add(M.cono(0.05 * s, 0.14 * s, 4, t.color, 0.46 * s, 0.66 * s, z * 0.09 * s)); });
    if (b.tipo === 'jabali') [-1, 1].forEach(function (z) { g.add(M.cono(0.025 * s, 0.12 * s, 4, t.colmillo, 0.7 * s, 0.42 * s, z * 0.08 * s).rotateZ(-1.2)); });
    if (oso) [-1, 1].forEach(function (z) { g.add(M.esfera(0.06 * s, t.color, 0.42 * s, 0.72 * s, z * 0.11 * s, 6, 4)); });
    [[-0.22, -0.12], [-0.22, 0.12], [0.22, -0.12], [0.22, 0.12]].forEach(function (q) { g.add(M.caja(0.1 * s, (oso ? 0.32 : 0.26) * s, 0.1 * s, t.color, q[0] * s, 0.13 * s, q[1] * s)); });
    if (b.tipo !== 'oso') g.add(M.caja(0.18 * s, 0.06 * s, 0.06 * s, t.color, -0.42 * s, 0.42 * s, 0).rotateZ(0.5));
    g.rotation.y = hashM(b.x, b.y) * 6.28;
    var et = M.etiquetaEdificio(t.icono + ' ' + L('Nv', 'Lv') + ' ' + b.nivel, b.nivel); et.position.set(0, 1.5, 0); et.scale.multiplyScalar(0.48); var gg = new THREE.Group(); gg.add(g); gg.add(et);
    return gg;
  }
  function mostrarBestia(i) {
    var b = listaBestias()[i]; if (!b) return;
    var d = defensaBestia(b.nivel), f = fuerzaEjercito(), muestra = premioBestia(b.nivel);
    var dif = f > d * 1.3 ? T('at_facil') : f > d * 0.85 ? T('at_parejo') : T('at_dificil');
    var html = '<div class="carta casilla-info"><h3>' + nombreBestia(b) + ' <span class="me-nivel">' + b.nivel + '</span></h3>' +
      '<div class="casilla-tabla"><span>' + L('Nivel', 'Level') + '</span><b>' + b.nivel + '</b><span>' + T('cas_coord') + '</span><b>X ' + b.x + ' · Y ' + b.y + '</b>' +
      '<span>' + L('Poder recomendado', 'Recommended power') + '</span><b>⚔️ ' + formatoNumero(d) + '</b><span>' + L('Tu fuerza', 'Your strength') + '</span><b>' + formatoNumero(f) + ' · ' + dif + '</b>' +
      '<span>' + L('Recompensas', 'Rewards') + '</span><b>' + ['oro', 'comida', 'madera', 'piedra'].filter(function (r) { return muestra[r]; }).map(function (r) { return ICONO_RECURSO[r] + ' ' + formatoNumero(muestra[r]); }).join(' · ') + '</b>' +
      '<span>' + L('Puede dar', 'May give') + '</span><b>📘 · ⏱️ · 🧰 · 🛡️ +' + muestra.puntos + '</b></div>' +
      '<button class="comprar rojo boton-oleada-grande" id="bestia-atacar">⚔️ ' + L('Atacar', 'Attack') + '</button></div>';
    $('mundo-info').innerHTML = html;
    $('bestia-atacar').addEventListener('click', function () { this.disabled = true; atacarBestia(i); });
  }
  function atacarBestia(i) {
    var b = listaBestias()[i];
    if (!tropas.some(function (u) { return !u.heroeId; })) { consejoTemporal(T('at_sin_tropas')); sonar('error'); mostrarBestia(i); return; }
    var f = fuerzaEjercito(), d = defensaBestia(b.nivel), res = resolverBatalla(f, d);
    sonar('cuerno');
    var listo = null, mostrar = null;
    escenaBatalla({ nombre: estado.idioma === 'en' ? TIPOS_BESTIA[b.tipo].en : TIPOS_BESTIA[b.tipo].es, nivel: b.nivel, emoji: TIPOS_BESTIA[b.tipo].icono }, f, d, res.gano, function (cb) { mostrar = cb; if (listo) cb(listo); });
    var caidas = bajasEjercito(res.bajas), premio = null;
    if (res.gano) {
      premio = premioBestia(b.nivel); sumarXP(8 * b.nivel);
      estado.bestias = estado.bestias || {}; estado.bestias[b.id] = Date.now() + 30 * 60 * 1000;
      if (estado.alianza) regaloAlianza('bestia');
      sonar('victoria');
    } else sonar('derrota');
    nuevoCorreo('informes', (res.gano ? L('Bestia capturada: ', 'Beast captured: ') : L('Derrota contra ', 'Defeat against ')) + nombreBestia(b) + ' ' + L('nv', 'lv') + ' ' + b.nivel, L('Expedición', 'Expedition'),
      htmlInforme([[L('Resultado', 'Result'), res.gano ? '🏆 ' + L('Victoria', 'Victory') : '💔 ' + L('Derrota', 'Defeat')], [L('Tu fuerza', 'Your strength'), formatoNumero(f)], [L('Poder de la bestia', 'Beast power'), formatoNumero(d)], [L('Bajas', 'Losses'), caidas], [T('cas_coord'), 'X ' + b.x + ' · Y ' + b.y]]), premio);
    listo = '<h3 class="bp-gran ' + (res.gano ? 'si' : 'no') + '">' + (res.gano ? T('bp_victoria') : T('bp_derrota')) + '</h3><p>' + (res.gano ? L('📬 Las recompensas están en tu Correo (Informes).', '📬 Your rewards are in your Mail (Reports).') : L('La bestia fue demasiado fuerte.', 'The beast was too strong.')) + '</p><p class="nota">' + T('at_bajas', { n: caidas }) + '</p>';
    if (mostrar) mostrar(listo);
    guardar(true); actualizarHUD(); pintarAldeas(aldeasCache); $('mundo-info').innerHTML = '';
  }
  // ---------- BUSCAR objetivos por tipo y nivel ----------
  var busqueda = { tipo: 'bestia', nivel: 0 };
  function pintarBuscador() {
    var tipos = [['bestia', '🐗 ' + L('Bestias', 'Beasts')], ['campamento', '🛖 ' + L('Aldeas bárbaras', 'Barbarian villages')], ['bosque', '🪵 ' + L('Aserraderos', 'Sawmills')], ['colina', '🪨 ' + L('Canteras', 'Quarries')], ['montana', '🪙 ' + L('Minas', 'Mines')], ['llanura', '🌾 ' + L('Molinos', 'Mills')]];
    var niveles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    $('mundo-buscar').innerHTML = '<select id="bus-tipo">' + tipos.map(function (q) { return '<option value="' + q[0] + '"' + (q[0] === busqueda.tipo ? ' selected' : '') + '>' + q[1] + '</option>'; }).join('') + '</select>' +
      '<select id="bus-nivel">' + niveles.map(function (n) { return '<option value="' + n + '"' + (n === busqueda.nivel ? ' selected' : '') + '>' + (n ? L('Nivel ', 'Level ') + n : L('Cualquier nivel', 'Any level')) + '</option>'; }).join('') + '</select>' +
      '<button class="comprar mini naranja" id="bus-ir">🔍 ' + L('Buscar', 'Search') + '</button><span id="bus-info"></span>';
    $('bus-ir').addEventListener('click', function () { busqueda.tipo = $('bus-tipo').value; busqueda.nivel = +$('bus-nivel').value; sonar('click'); buscarObjetivo(); });
  }
  function buscarObjetivo() {
    var yo = celdaDe(miLugar().x, miLugar().y), cands = [], t = busqueda.tipo, n = busqueda.nivel;
    if (t === 'bestia') listaBestias().forEach(function (b) { var ob = ocupadasMundo[b.x + '_' + b.y]; if (ob && ob.bestia !== undefined && !bestiaMuerta(b) && (!n || b.nivel === n)) cands.push({ x: b.x, y: b.y, nivel: b.nivel }); });
    else if (t === 'campamento') CAMPAMENTOS.forEach(function (cm) { var c = celdaDe(cm.x, cm.y); if (!n || cm.nivel === n) cands.push({ x: c.x, y: c.y, nivel: cm.nivel }); });
    else for (var y = 0; y < TAM_MUNDO; y++) for (var x = 0; x < TAM_MUNDO; x++) { var c2 = casillaMundo(x, y); if (c2.tipo === t && (!n || c2.nivel === n) && !ocupadasMundo[x + '_' + y]) cands.push({ x: x, y: y, nivel: c2.nivel }); }
    if (!cands.length) { $('bus-info').textContent = L('No hay ninguno de ese nivel.', 'None at that level.'); sonar('error'); return; }
    cands.sort(function (a, b) { return Math.hypot(a.x - yo.x, a.y - yo.y) - Math.hypot(b.x - yo.x, b.y - yo.y); });
    var e = cands[0];
    var maxPoder = t === 'bestia' ? defensaBestia(n || Math.max.apply(null, cands.map(function (q) { return q.nivel; }))) : t === 'campamento' ? defensaCampamento(n || Math.max.apply(null, cands.map(function (q) { return q.nivel; }))) : defensaCasilla({ nivel: n || 5 });
    $('bus-info').textContent = '⚔️ ' + L('Poder recomendado máx: ', 'Max recommended power: ') + formatoNumero(maxPoder);
    M3.obj.copy(posCelda(e.x, e.y)); M3.zoom = { de: M3.dist, a: 22, t0: performance.now() };
    elegirCelda(e.x, e.y);
  }
  function conquistarCasilla(c, deOtro) {
    if (!tropas.some(function (u) { return !u.heroeId; })) { consejoTemporal(T('at_sin_tropas')); sonar('error'); mostrarCasilla(c); return; }
    if (!deOtro && misCasillas().length >= maxCasillas()) { consejoTemporal(T('cas_maximo', { n: maxCasillas() })); sonar('error'); mostrarCasilla(c); return; }
    var f = fuerzaEjercito(), d = defensaCasilla(c) * (deOtro ? 1.4 : 1), res = resolverBatalla(f, d);
    sonar('cuerno');
    var listo = null, mostrar = null;
    escenaBatalla({ nombre: T('cas_' + c.tipo) + ' ' + c.x + ',' + c.y, nivel: c.nivel, retrato: null }, f, d, res.gano, function (cb) { mostrar = cb; if (listo) cb(listo); });
    var caidas = bajasEjercito(res.bajas);
    function fin(extra) {
      listo = '<h3 class="bp-gran ' + (res.gano ? 'si' : 'no') + '">' + (res.gano ? T('bp_victoria') : T('bp_derrota')) + '</h3><p>' + (res.gano ? T('cas_ganada') : T('cas_perdida')) + '</p>' + (extra || '') + '<p class="nota">' + T('at_bajas', { n: caidas }) + '</p>';
      if (mostrar) mostrar(listo);
      guardar(true); actualizarHUD(); if (enMundo) { pintarAldeas(aldeasCache); mostrarCasilla(c); }
    }
    if (!res.gano) { sonar('derrota'); fin(); return; }
    estado.casillas = estado.casillas || {};
    estado.casillas[c.id] = { tipo: c.tipo, nivel: c.nivel };
    sonar('victoria');
    if (hayCuenta()) Cuentas.tomarCasilla(c.id, { dueno: Cuentas.usuario().uid, nombre: Cuentas.nombrePublico(), alianza: estado.alianza || '', fecha: Date.now() })
      .then(function () { casillasNube[c.id] = { dueno: Cuentas.usuario().uid, nombre: Cuentas.nombrePublico(), alianza: estado.alianza || '' }; fin(); })
      .catch(function () { fin(); });
    else fin();
  }
  function soltarCasilla(c) {
    confirmarJuego('🏳️ ' + T('cas_abandonar'), T('cas_abandonar_txt'), T('cas_abandonar'), function () {
      delete estado.casillas[c.id];
      if (hayCuenta()) Cuentas.soltarCasilla(c.id).catch(function () {});
      delete casillasNube[c.id];
      sonar('click'); guardar(true);
      pintarAldeas(aldeasCache); mostrarCasilla(c);
    });
  }
  function mostrarCampamento(i) {
    var cm = CAMPAMENTOS[i], c = celdaDe(cm.x, cm.y), espera = ((estado.cdCamp || {})[i] || 0) - Date.now();
    var html = '<div class="carta"><h3>🛖 ' + T('campamento') + ' <span class="me-nivel">' + cm.nivel + '</span></h3><p>' + T('campamento_txt') + '</p>' +
      '<div class="stats"><span>📍 ' + c.x + ', ' + c.y + '</span><span>🛡️ ' + formatoNumero(defensaCampamento(cm.nivel)) + '</span><span>' + T('at_botin') + ': ' + textoBotin(botinMaximo(cm.nivel)) + '</span></div>' +
      (espera > 0 ? '<p class="nota aviso-rojo">' + T('camp_espera', { t: fmtTiempo(espera / 1000) }) + '</p>' : '<button class="comprar rojo boton-oleada-grande" id="camp-atacar">⚔️ ' + T('camp_atacar') + '</button>') + '</div>';
    $('mundo-info').innerHTML = html;
    var b = $('camp-atacar'); if (b) b.addEventListener('click', function () { this.disabled = true; atacarCampamento(i); });
  }
  function atacarCampamento(i) {
    var cm = CAMPAMENTOS[i];
    if (!tropas.some(function (u) { return !u.heroeId; })) { consejoTemporal(T('at_sin_tropas')); sonar('error'); mostrarCampamento(i); return; }
    var f = fuerzaEjercito(), d = defensaCampamento(cm.nivel), res = resolverBatalla(f, d);
    var bm = botinMaximo(cm.nivel), botin = {};
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { botin[r] = Math.floor(bm[r] * res.margen); });
    sonar('cuerno');
    var listo = null, mostrar = null;
    escenaBatalla({ nombre: T('leyenda_trasgos'), nivel: cm.nivel, retrato: 'mapa_campamento' }, f, d, res.gano, function (cb) { mostrar = cb; if (listo) cb(listo); });
    var caidas = bajasEjercito(res.bajas);
    nuevoCorreo('informes', L('Campamento de trasgos nv ' + cm.nivel + ': ', 'Goblin camp lv ' + cm.nivel + ': ') + (res.gano ? L('victoria', 'victory') : L('derrota', 'defeat')), L('Expedición', 'Expedition'), htmlInforme([[L('Resultado', 'Result'), res.gano ? '🏆 ' + L('Victoria', 'Victory') : '💔 ' + L('Derrota', 'Defeat')], [L('Tu fuerza', 'Your strength'), formatoNumero(f)], [L('Defensa', 'Defense'), formatoNumero(d)]], res.gano ? botin : null));
    if (res.gano) { sumarXP(8 * cm.nivel); sumarPuntosAlianza(20); sumarLogro('campamentos'); estado.mochila.libro_gra = (estado.mochila.libro_gra || 0) + 1; estado.mochila.acel_15m = (estado.mochila.acel_15m || 0) + 1; ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (botin[r]) sumarRecurso(r, botin[r]); }); sonar('victoria'); setTimeout(function () { darPieza(null, rarezaAlAzar(cm.nivel)); guardar(); }, 1500); } else sonar('derrota');
    estado.cdCamp = estado.cdCamp || {}; estado.cdCamp[i] = Date.now() + 20 * 60 * 1000;
    listo = '<h3 class="bp-gran ' + (res.gano ? 'si' : 'no') + '">' + (res.gano ? T('bp_victoria') : T('bp_derrota')) + '</h3><p>' + (res.gano ? T('at_gano', { b: textoBotin(botin) }) + '<br>📗 +1 ' + N('libro_gra') + ' · ⏱️ +1 ' + N('acel_15m') : T('camp_perdio')) + '</p><p class="nota">' + T('at_bajas', { n: caidas }) + '</p>';
    if (mostrar) mostrar(listo);
    guardar(true); actualizarHUD(); mostrarCampamento(i);
  }
  // ---------- PORTALES: mudar el reino a otro lugar del mapa ----------
  function miLugar() { return estado.lugar || (hayCuenta() ? Cuentas.lugar() : { x: 50, y: 50 }); }
  function aCoord(c) { return Math.round(c * 100 / TAM_MUNDO + 1.25); } // el centro de la casilla, en coordenadas 0..99
  function celdaLibre(x, y) {
    if (x < 1 || y < 1 || x > TAM_MUNDO - 2 || y > TAM_MUNDO - 2) return false;
    var c = casillaMundo(x, y), k = x + '_' + y;
    if (c.tipo === 'lago' || c.tipo === 'montana') return false;
    if (ocupadasMundo[k]) return false;
    if (CAMPAMENTOS.some(function (cm) { var q = celdaDe(cm.x, cm.y); return q.x === x && q.y === y; })) return false;
    if (aldeasCache.some(function (a) { var q = celdaDe(a.x, a.y); return q.x === x && q.y === y; })) return false;
    return true;
  }
  function puedeTeleportar() {
    if (oleadaActiva) return T('tel_oleada');
    if (marchas.some(function (m) { return !m.resuelto && m.llega > Date.now(); })) return T('tel_marcha');
    // antes de que llegue el ataque sí puedes huir; cuando ya empezó la batalla, no
    if (entrantes.some(function (r) { return r.llega <= Date.now() && !r.resuelto; })) return T('tel_batalla');
    var espera = (estado.ultimoPortal || 0) + 24 * 3600 * 1000 - Date.now();
    if (espera > 0 && !estado.dueno) return T('tel_espera24', { t: fmtTiempo(espera / 1000) });
    return '';
  }
  function teletransportar(x, y, tipo) {
    var no = puedeTeleportar();
    if (no) { consejoTemporal(no); sonar('error'); return false; }
    if (!celdaLibre(x, y)) { consejoTemporal(T('tel_ocupada')); sonar('error'); return false; }
    if (!(estado.mochila[tipo] > 0)) { consejoTemporal(T('tel_sin')); sonar('error'); return false; }
    estado.mochila[tipo]--;
    var antes = celdaDe(miLugar().x, miLugar().y);
    estado.lugar = { x: aCoord(x), y: aCoord(y) };
    var yo = hayCuenta() ? Cuentas.usuario().uid : '__yo';
    aldeasCache.forEach(function (a) { if (a.uid === yo) { a.x = estado.lugar.x; a.y = estado.lugar.y; } });
    estado.ultimoPortal = Date.now(); estado.sinAtacarHasta = Date.now() + 3600 * 1000;
    cancelarAtaquesEntrantes();
    guardar(true); publicarAldea(true);
    sonar('magia'); setTimeout(function () { sonar('poder'); }, 300);
    consejoTemporal(T('tel_ok', { x: x, y: y }));
    if (M3) {
      efectoPortal(antes); efectoPortal({ x: x, y: y });
      setTimeout(function () { if (enMundo) { pintarAldeas(aldeasCache); var p = posCelda(x, y); M3.obj.copy(p); M3.sel.position.set(p.x, 0.06, p.z); M3.sel.visible = true; $('mundo-info').innerHTML = '<div class="carta"><h3>' + T('tel_ok', { x: x, y: y }) + '</h3></div>'; } }, 600);
    }
    return true;
  }
  // si te mudas antes de que llegue un ataque, el atacante no encuentra tu ciudad: se cancela y sus tropas regresan
  function cancelarAtaquesEntrantes() {
    var ahora = Date.now();
    entrantes.filter(function (r) { return r.llega > ahora; }).forEach(function (r) {
      if (!hayCuenta() || r.prueba) { setTimeout(function () { consejoTemporal(T('tel_cancelado', { n: r.atacanteNombre })); }, 2600); r.resuelto = true; r.cancelado = true; return; }
      Cuentas.resolverAtaque(r.id, { cancelado: true, resuelto: true, gano: false, bajas: 0, defensa: 0, botin: { oro: 0, comida: 0, madera: 0, piedra: 0 } })
        .then(function () { setTimeout(function () { consejoTemporal(T('tel_cancelado', { n: r.atacanteNombre })); }, 2600); }).catch(function () {});
      r.resuelto = true; r.cancelado = true;
    });
    entrantes = entrantes.filter(function (r) { return !r.cancelado; });
    actualizarAlertas();
  }
  function portalAlAzar() {
    var actual = celdaDe(miLugar().x, miLugar().y);
    for (var i = 0; i < 600; i++) {
      var x = 2 + Math.floor(Math.random() * (TAM_MUNDO - 4)), y = 2 + Math.floor(Math.random() * (TAM_MUNDO - 4));
      if (Math.hypot(x - actual.x, y - actual.y) > 5 && celdaLibre(x, y)) return teletransportar(x, y, 'portal_azar');
    }
    return false;
  }
  // luz del portal: una columna brillante y un aro que crece
  function efectoPortal(c) {
    if (!M3) return;
    var p = posCelda(c.x, c.y), g = new THREE.Group();
    var luz = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 9, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    luz.position.y = 4.5; g.add(luz);
    var aro = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.95, 32), new THREE.MeshBasicMaterial({ color: 0xd8b4ff, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    aro.rotation.x = -Math.PI / 2; aro.position.y = 0.08; g.add(aro);
    g.position.copy(p); M3.e.add(g);
    (M3.efectos = M3.efectos || []).push({ g: g, luz: luz, aro: aro, t0: performance.now() });
  }
  function actualizarEfectosPortal() {
    if (!M3 || !M3.efectos || !M3.efectos.length) return;
    var ahora = performance.now();
    M3.efectos = M3.efectos.filter(function (f) {
      var k = (ahora - f.t0) / 1800;
      if (k >= 1) { M3.e.remove(f.g); return false; }
      f.aro.scale.setScalar(1 + k * 3); f.aro.material.opacity = 0.9 * (1 - k);
      f.luz.material.opacity = 0.75 * (1 - k * k); f.luz.scale.set(1 - k * 0.6, 1, 1 - k * 0.6);
      return true;
    });
  }
  function cerrarMundo() {
    cerrarFicha(); $('mundo').classList.add('oculto'); enMundo = false; }
  // volver a la ciudad desde el mapa: la cámara baja desde lo alto hasta el reino
  function entrarCiudad() {
    cerrarMundo();
    cam.objetivo.copy(CENTRO_REINO); cam.meta.copy(CENTRO_REINO); cam.vel.set(0, 0, 0);
    cam.dist = 150; cam.distMeta = distInicial();
    sonar('cuerno');
    consejoTemporal(T('bienvenido_ciudad'));
  }
  function iconoMapa(clave, emoji) { return retratos[clave] ? '<img src="' + retratos[clave] + '" alt="">' : emoji; }
  var enMundo = false;
  function pintarAldeas(lista) {
    var cont = $('mundo-aldeas'), h = '';
    var yo = hayCuenta() ? Cuentas.usuario().uid : '__yo';
    var lugarYo = miLugar();
    var hayYo = lista.some(function (a) { return a.uid === yo; });
    if (!hayYo) lista = lista.concat([{ uid: yo, nombre: hayCuenta() ? Cuentas.nombrePublico() : T('tu_reino'), nivel: estado.oleada, poder: Math.round(calcularPoder()), x: lugarYo.x, y: lugarYo.y, alianza: estado.alianza || null, escudo: estado.escudoHasta || 0 }]);
    CAMPAMENTOS.forEach(function (c, i) {
      h += '<button class="aldea trasgo" data-campamento="' + i + '" style="left:' + c.x + '%;top:' + c.y + '%"><span class="ic">' + iconoMapa('mapa_campamento', '⛺') + '</span><span class="nom">' + T('leyenda_trasgos') + '</span><span class="niv">' + c.nivel + '</span></button>';
    });
    lista.forEach(function (a, i) {
      var cls = a.uid === yo ? 'yo' : (estado.alianza && a.alianza === estado.alianza ? 'aliada' : '');
      // tu castillo con su nivel real; los demás según su nivel
      var tam = a.uid === yo ? nivelVisual(estado.castillo || 1) : (a.nivel <= 4 ? 1 : a.nivel <= 8 ? 2 : 3);
      var ic = iconoMapa('mapa_castillo' + tam, a.uid === yo ? '👑' : cls === 'aliada' ? '🛡️' : '🏰') + (a.uid === yo ? '<span class="corona">👑</span>' : '');
      h += '<button class="aldea ' + cls + '" data-aldea="' + i + '" style="left:' + a.x + '%;top:' + a.y + '%">' + ((a.escudo || 0) > Date.now() ? '<span class="esc">🛡️</span>' : '') + '<span class="ic">' + ic + '</span><span class="nom">' +
        (a.alianza ? '[' + escaparHTML(a.alianza) + '] ' : '') + escaparHTML(a.nombre) + '</span><span class="niv">' + a.nivel + '</span></button>';
    });
    cont.innerHTML = h;
    ponerCosasMundo(lista, yo);
    if (M3 && M3.miCelda && !M3.centrado) { var pc = posCelda(M3.miCelda.x, M3.miCelda.y); M3.obj.copy(pc); M3.centrado = true; }
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
        if (a.uid === yo) { entrarCiudad(); return; }
        abrirFichaCiudad(a); return;
        $('mundo-info').innerHTML = '<div class="carta"><h3>' + (a.uid === yo ? '👑 ' + T('tu_reino') : '🏰 ' + T('reino_de', { n: escaparHTML(a.nombre) })) + '</h3>' +
          '<div class="stats"><span>⭐ ' + T('nivel') + ' ' + a.nivel + '</span><span>💪 ' + T('poder') + ' ' + formatoNumero(a.poder) + '</span>' +
          '<span>🛡️ ' + (a.alianza ? '[' + escaparHTML(a.alianza) + ']' : T('sin_alianza')) + '</span><span>📍 ' + a.x + ', ' + a.y + '</span>' +
          ((a.escudo || 0) > Date.now() ? '<span>' + T('protegido_falta', { t: fmtTiempo((a.escudo - Date.now()) / 1000) }) + '</span>' : '') +
          (a.defensa ? '<span>🏰 ' + T('defensa_txt') + ' ~' + formatoNumero(Math.round(a.defensa / 100) * 100) + '</span>' : '') + '</div>' +
          (estado.alianza && a.alianza === estado.alianza ? '<button class="comprar boton-oleada-grande" id="btn-reforzar">' + T('ref_reforzar') + '</button>' : '') +
          (a.uid !== yo ? '<button class="comprar rojo boton-oleada-grande" id="btn-atacar">' + T('atacar') + '</button>' : '') + '</div>';
        var ba = $('btn-atacar'); if (ba) ba.addEventListener('click', function () { sonar('click'); abrirAtaque(a); });
        var br = $('btn-reforzar'); if (br) br.addEventListener('click', function () { sonar('click'); cerrarMundo(); abrirEnviarRefuerzo(a.uid, a.nombre); });
      });
    });
  }

  // ------------------------------------------------------------------
  //  ALIANZAS
  // ------------------------------------------------------------------
  function abrirPanelAlianza() {
    vistos().alianza = true;
    if (!panelActual || panelActual.tipo !== 'alianza') alSeccion = '';
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
      if (al) return Promise.all([Cuentas.miembros(tag), Cuentas.pedidos(tag).catch(function () { return []; }), Cuentas.refuerzosRecibidos().catch(function () { return []; }), Cuentas.refuerzosEnviados().catch(function () { return []; })])
        .then(function (r) { if (panelActual && panelActual.tipo === 'alianza') pintarMiAlianza(al, r[0], r[1], r[2], r[3]); });
      return Cuentas.alianzas().then(function (lista) { pintarListaAlianzas(lista); });
    }).catch(function () { if (panelActual && panelActual.tipo === 'alianza') $('panel-cuerpo').innerHTML = '<p class="nota aviso-rojo">' + T('mundo_error') + '</p>'; });
  }
  var alCache = null, alSeccion = '';
  function pintarMiAlianza(al, miembros, pedidos, recibidos, enviados) {
    alCache = { al: al, miembros: miembros, pedidos: pedidos || [], recibidos: recibidos || [], enviados: enviados || [] };
    pintarHubAlianza();
  }
  function htmlMiembrosAlianza(al, miembros) {
    var yoUid = Cuentas.usuario().uid;
    miembros.sort(function (a, b) { return b.poder - a.poder; });
    var h = '<div class="carta"><h3><span class="etiqueta-al">' + escaparHTML(al.tag) + '</span>' + escaparHTML(al.nombre) + '</h3>' +
      '<p>👑 ' + T('al_lider') + ': ' + escaparHTML(al.liderNombre) + '</p>' +
      '<p class="nota"><b>' + T('al_miembros', { n: miembros.length }) + '</b></p>';
    miembros.forEach(function (m) {
      h += '<div class="fila-miembro">' + (m.uid === al.lider ? '👑' : '🛡️') + '<b>' + escaparHTML(m.nombre) + '</b><span class="chip">⭐ ' + m.nivel + '</span><span class="chip">💪 ' + formatoNumero(m.poder) + '</span>' +
        (m.uid !== yoUid ? '<button class="comprar mini" data-accion="ref-enviar" data-uid="' + escaparHTML(m.uid) + '" data-nombre="' + escaparHTML(m.nombre) + '">' + T('ref_reforzar') + '</button>' : '') + '</div>';
    });
    return h + '</div>';
  }
  // ---------- CENTRO DE ALIANZA: puntos, cajas, tienda, tecnología, incentivo ----------
  var IDIOMAS_AL = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' };
  var TEC_AL = {
    recoleccion: { icono: '🌾', es: 'Recolección', en: 'Gathering', des_es: '+6% por nivel en las casillas del mundo', des_en: '+6% per level on world tiles' },
    defensa: { icono: '🛡️', es: 'Defensa unida', en: 'United defense', des_es: '+4% de defensa del reino por nivel', des_en: '+4% kingdom defense per level' },
    carretas: { icono: '🛒', es: 'Caminos', en: 'Roads', des_es: '-6% de tiempo de viaje por nivel', des_en: '-6% travel time per level' }
  };
  var TIENDA_AL = [['acel_15m', 30], ['libro_peq', 40], ['acel_1h', 90], ['libro_gra', 150], ['oro', 60, 2000], ['comida', 60, 3000]];
  var LIMITE_REGALOS_DIA = 20;
  function hoyClave() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function alLoc() {
    var a = estado.alLocal || (estado.alLocal = {});
    if (a.puntos === undefined) a.puntos = 0;
    if (a.caja === undefined) a.caja = 0;
    if (!a.regalos) a.regalos = [];
    if (!a.tec) a.tec = {};
    if (!a.incentivo) a.incentivo = { dia: '', racha: 0 };
    if (a.dia !== hoyClave()) { a.dia = hoyClave(); a.reclamadosHoy = 0; }
    return a;
  }
  function tecAl(k) { return estado.alianza ? ((alLoc().tec || {})[k] || 0) : 0; }
  function premioRegalo(grande) {
    var n = grande ? 3 : 1, r = Math.random(), p = {};
    if (r < 0.3) p.oro = 300 * n; else if (r < 0.55) p.comida = 450 * n; else if (r < 0.75) p.madera = 300 * n; else if (r < 0.88) p.piedra = 200 * n; else p.objeto = grande ? 'acel_1h' : 'acel_15m';
    if (grande && Math.random() < 0.4) p.gemas = 10;
    return p;
  }
  function regaloAlianza(origen, grande) {
    if (!estado.alianza) return;
    var a = alLoc(); a.regalos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), o: origen, g: !!grande, p: premioRegalo(grande), t: Date.now() });
    if (a.regalos.length > 60) a.regalos.splice(0, a.regalos.length - 60);
  }
  function sumarPuntosAlianza(n) {
    if (!estado.alianza || !n) return;
    var a = alLoc(); a.puntos += n; a.caja += n;
    while (a.caja >= 100) { a.caja -= 100; regaloAlianza('caja', true); }
  }
  function reclamarRegalos(id) {
    var a = alLoc(), lista = id ? a.regalos.filter(function (g) { return g.id === id; }) : a.regalos.slice(), n = 0;
    lista.forEach(function (g) {
      if (a.reclamadosHoy >= LIMITE_REGALOS_DIA && !esDueno()) return;
      var p = g.p; ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (p[r]) sumarRecurso(r, p[r]); });
      if (p.gemas) sumarGemas(p.gemas);
      if (p.objeto) estado.mochila[p.objeto] = (estado.mochila[p.objeto] || 0) + 1;
      a.regalos.splice(a.regalos.indexOf(g), 1); a.reclamadosHoy++; n++;
    });
    if (!n) { consejoTemporal(L('Llegaste al límite de regalos de hoy (' + LIMITE_REGALOS_DIA + ').', 'You reached today\'s gift limit (' + LIMITE_REGALOS_DIA + ').')); sonar('error'); return; }
    sonar('moneda'); consejoTemporal(L('Reclamaste ' + n + ' regalo(s).', 'You claimed ' + n + ' gift(s).')); guardar(true); actualizarHUD(); pintarHubAlianza();
  }
  function esDueno() { return !!estado.dueno; }
  function incentivoListo() { return alLoc().incentivo.dia !== hoyClave(); }
  function premioIncentivo(racha) { var d = Math.min(7, racha); return { oro: 400 * d, comida: 600 * d, gemas: d === 7 ? 30 : d >= 4 ? 10 : 0, puntos: 10 * d }; }
  function cobrarIncentivo() {
    var a = alLoc(), inc = a.incentivo; if (!incentivoListo()) return;
    var ayer = new Date(Date.now() - 86400000), ayerK = ayer.getFullYear() + '-' + (ayer.getMonth() + 1) + '-' + ayer.getDate();
    inc.racha = inc.dia === ayerK ? Math.min(7, inc.racha + 1) : 1; inc.dia = hoyClave();
    var p = premioIncentivo(inc.racha);
    sumarRecurso('oro', p.oro); sumarRecurso('comida', p.comida); if (p.gemas) sumarGemas(p.gemas); sumarPuntosAlianza(p.puntos);
    sonar('victoria'); consejoTemporal(L('Incentivo del día ' + inc.racha + ' cobrado.', 'Day ' + inc.racha + ' incentive claimed.')); guardar(true); actualizarHUD(); pintarHubAlianza();
  }
  function costoTecAl(n) { return 100 * (n + 1); }
  function mejorarTecAl(k) {
    var a = alLoc(), n = a.tec[k] || 0; if (n >= 5) return;
    var c = costoTecAl(n); if (a.puntos < c && !esDueno()) { consejoTemporal(L('Te faltan puntos de alianza.', 'Not enough alliance points.')); sonar('error'); return; }
    if (!esDueno()) a.puntos -= c; a.tec[k] = n + 1; sonar('listo'); guardar(true); pintarHubAlianza();
  }
  function comprarTiendaAl(i) {
    var q = TIENDA_AL[i], a = alLoc(); if (!q) return;
    if (a.puntos < q[1] && !esDueno()) { consejoTemporal(L('Te faltan puntos de alianza.', 'Not enough alliance points.')); sonar('error'); return; }
    if (!esDueno()) a.puntos -= q[1];
    if (q[2]) sumarRecurso(q[0], q[2]); else estado.mochila[q[0]] = (estado.mochila[q[0]] || 0) + 1;
    sonar('moneda'); guardar(true); actualizarHUD(); pintarHubAlianza();
  }
  function cambiarAjustesAl(b) {
    var idioma = $('al-idioma').value, des = ($('al-des').value || '').slice(0, 120);
    b.disabled = true;
    Cuentas.ajustesAlianza(alCache.al.tag, { idioma: idioma, descripcion: des }).then(function () { alCache.al.idioma = idioma; alCache.al.descripcion = des; consejoTemporal(L('Ajustes guardados.', 'Settings saved.')); sonar('listo'); pintarHubAlianza(); })
      .catch(function () { b.disabled = false; consejoTemporal(T('ref_error')); sonar('error'); });
  }
  var SECCIONES_AL = [['guerra', '⚔️', 'Guerra', 'War'], ['cajas', '🎁', 'Cajas', 'Boxes'], ['territorio', '🗺️', 'Territorio', 'Territory'], ['batalla', '🏆', 'Batalla de alianza', 'Alliance battle'], ['tienda', '🛍️', 'Tienda', 'Shop'], ['tecnologia', '📜', 'Tecnología', 'Technology'], ['poder', '💪', 'Poder', 'Power'], ['ayuda', '🤝', 'Ayuda', 'Help'], ['miembros', '👥', 'Miembros', 'Members'], ['incentivo', '📅', 'Incentivo', 'Incentive'], ['ajustes', '⚙️', 'Ajustes', 'Settings']];
  function avisoSeccionAl(k) {
    if (k === 'cajas') return alLoc().regalos.length;
    if (k === 'incentivo') return incentivoListo() ? 1 : 0;
    if (k === 'ayuda') { var yoU = Cuentas.usuario().uid; return alCache.pedidos.filter(function (p) { return p.uid !== yoU && (p.recibido || 0) < (p.cantidad || 0); }).length; }
    if (k === 'guerra') return sinLeer('guerras');
    return 0;
  }
  function pintarHubAlianza() {
    if (!alCache || !panelActual || panelActual.tipo !== 'alianza') return;
    var al = alCache.al, mi = alCache.miembros, a = alLoc(), total = mi.reduce(function (s, m) { return s + (m.poder || 0); }, 0);
    var h = '<div class="carta al-cab"><div class="al-escudo">' + escaparHTML(al.tag) + '</div><div class="al-datos"><h3>' + escaparHTML(al.nombre) + '</h3>' +
      '<p>👑 ' + escaparHTML(al.liderNombre) + ' · 💪 ' + formatoNumero(total) + '</p><p>👥 ' + mi.length + '/100 · 🌐 ' + (IDIOMAS_AL[al.idioma] || IDIOMAS_AL.es) + ' · 🛡️ ' + formatoNumero(a.puntos) + ' ' + L('pts', 'pts') + '</p></div></div>';
    if (!alSeccion) {
      h += '<div class="al-rejilla">' + SECCIONES_AL.map(function (s) { var n = avisoSeccionAl(s[0]); return '<button class="al-boton" data-accion="al-sec" data-sec="' + s[0] + '"><span class="al-ic">' + s[1] + '</span><span>' + (estado.idioma === 'en' ? s[3] : s[2]) + '</span>' + (n ? '<i class="al-n">' + (n > 99 ? '99+' : n) + '</i>' : '') + '</button>'; }).join('') + '</div>';
      if (al.descripcion) h += '<p class="nota" style="margin-top:8px">📢 ' + escaparHTML(al.descripcion) + '</p>';
    } else {
      var s = SECCIONES_AL.filter(function (q) { return q[0] === alSeccion; })[0];
      h += '<div class="al-sec-cab"><button class="comprar mini" data-accion="al-sec" data-sec="">◀ ' + L('Volver', 'Back') + '</button><b>' + s[1] + ' ' + (estado.idioma === 'en' ? s[3] : s[2]) + '</b></div>' + htmlSeccionAl(alSeccion);
    }
    $('panel-cuerpo').innerHTML = h;
  }
  function htmlSeccionAl(k) {
    var al = alCache.al, mi = alCache.miembros.slice().sort(function (x, y) { return (y.poder || 0) - (x.poder || 0); }), a = alLoc(), yoU = Cuentas.usuario().uid;
    if (k === 'cajas') {
      var pct = Math.min(100, a.caja);
      var h = '<div class="carta"><h3>🎁 ' + L('Caja de botín', 'Loot box') + '</h3><div class="ped-barra"><div style="width:' + pct + '%"></div><span>' + a.caja + ' / 100</span></div>' +
        '<p class="nota">' + L('Cada 100 puntos de alianza abren una caja grande. Ganas puntos cazando bestias, venciendo campamentos y ayudando.', 'Every 100 alliance points open a big box. Earn points hunting beasts, beating camps and helping.') + '</p>' +
        '<p class="nota"><b>' + L('Reclamados hoy: ', 'Claimed today: ') + a.reclamadosHoy + ' / ' + LIMITE_REGALOS_DIA + '</b></p></div>';
      h += '<div class="carta" style="margin-top:8px"><div class="al-sec-cab"><h3>' + L('Regalos', 'Gifts') + ' (' + a.regalos.length + ')</h3>' + (a.regalos.length ? '<button class="comprar mini naranja" data-accion="al-reclamar-todo">' + L('Reclamar todo', 'Claim all') + '</button>' : '') + '</div>';
      if (!a.regalos.length) h += '<p class="nota">' + L('No hay regalos por ahora.', 'No gifts right now.') + '</p>';
      a.regalos.slice().reverse().forEach(function (g) {
        h += '<div class="fila-miembro"><span>' + (g.g ? '🎁' : '📦') + '</span><b>' + (g.o === 'caja' ? L('Caja de botín', 'Loot box') : g.o === 'bestia' ? L('Caza de bestia', 'Beast hunt') : L('Regalo', 'Gift')) + '</b><span class="chip">' + textoPremioCorreo(g.p) + '</span><button class="comprar mini" data-accion="al-reclamar" data-id="' + g.id + '">' + L('Reclamar', 'Claim') + '</button></div>';
      });
      return h + '</div>';
    }
    if (k === 'tienda') return '<div class="carta"><p class="nota">' + L('Tienes ', 'You have ') + '<b>🛡️ ' + formatoNumero(a.puntos) + '</b> ' + L('puntos de alianza.', 'alliance points.') + '</p>' + TIENDA_AL.map(function (q, i) {
      var nom = q[2] ? ICONO_RECURSO[q[0]] + ' ' + formatoNumero(q[2]) + ' ' + T('r_' + q[0]) : OBJETOS[q[0]].icono + ' ' + N(q[0]);
      return '<div class="fila-miembro"><b>' + nom + '</b><button class="comprar mini naranja" data-accion="al-tienda" data-i="' + i + '">🛡️ ' + q[1] + '</button></div>';
    }).join('') + '</div>';
    if (k === 'tecnologia') return '<div class="carta"><p class="nota">' + L('Puntos: ', 'Points: ') + '<b>🛡️ ' + formatoNumero(a.puntos) + '</b></p>' + Object.keys(TEC_AL).map(function (t) {
      var d = TEC_AL[t], n = a.tec[t] || 0;
      return '<div class="fila-miembro"><span>' + d.icono + '</span><div style="flex:1"><b>' + (estado.idioma === 'en' ? d.en : d.es) + ' ' + n + '/5</b><p class="nota">' + (estado.idioma === 'en' ? d.des_en : d.des_es) + '</p></div>' + (n < 5 ? '<button class="comprar mini naranja" data-accion="al-tec" data-k="' + t + '">🛡️ ' + costoTecAl(n) + '</button>' : '<span class="chip">MAX</span>') + '</div>';
    }).join('') + '</div>';
    if (k === 'incentivo') {
      var inc = a.incentivo, listo = incentivoListo(), sig = listo ? (function () { var ay = new Date(Date.now() - 86400000); return inc.dia === ay.getFullYear() + '-' + (ay.getMonth() + 1) + '-' + ay.getDate() ? Math.min(7, inc.racha + 1) : 1; })() : inc.racha;
      return '<div class="carta"><p class="nota">' + L('Entra cada día para subir la racha (máximo 7 días).', 'Log in every day to raise your streak (max 7 days).') + '</p><div class="al-dias">' + [1, 2, 3, 4, 5, 6, 7].map(function (d) { return '<div class="al-dia' + (d < sig || (!listo && d <= inc.racha) ? ' hecho' : '') + (d === sig && listo ? ' hoy' : '') + '"><b>' + L('Día ', 'Day ') + d + '</b><span>🪙 ' + formatoNumero(premioIncentivo(d).oro) + '</span>' + (premioIncentivo(d).gemas ? '<span>💎 ' + premioIncentivo(d).gemas + '</span>' : '') + '</div>'; }).join('') + '</div>' +
        (listo ? '<button class="comprar naranja boton-oleada-grande" data-accion="al-incentivo">' + L('Cobrar día ', 'Claim day ') + sig + '</button>' : '<p class="nota"><b>' + L('Ya cobraste hoy. Vuelve mañana.', 'Already claimed today. Come back tomorrow.') + '</b></p>') + '</div>';
    }
    if (k === 'guerra') {
      var gs = correoLista().filter(function (m) { return m.cat === 'guerras'; }).slice(0, 15);
      return '<div class="carta"><p class="nota">' + L('Los ataques y defensas de tu reino. Los informes completos están en el Correo.', 'Your kingdom attacks and defenses. Full reports are in the Mail.') + '</p>' + (gs.length ? gs.map(function (m) { return '<div class="fila-miembro"><span>⚔️</span><b>' + escaparHTML(m.titulo) + '</b><span class="chip">' + fechaCorta(m.fecha) + '</span></div>'; }).join('') : '<p class="nota">' + L('Todavía no hay guerras.', 'No wars yet.') + '</p>') + '<button class="comprar" data-accion="mail-ir" data-tab="guerras">📬 ' + L('Abrir informes de guerra', 'Open war reports') + '</button></div>';
    }
    if (k === 'territorio') {
      var ts = Object.keys(casillasNube).filter(function (id) { return casillasNube[id].alianza === al.tag; }), prod = 0;
      var filas = ts.map(function (id) { var xy = id.split('_'), c = casillaMundo(+xy[0], +xy[1]), g = guardadoCasilla(c); prod += g.hora; return '<div class="fila-miembro"><b>' + edificioCasilla(c.tipo) + ' ' + L('nv', 'lv') + ' ' + c.nivel + '</b><span class="chip">X ' + xy[0] + ' · Y ' + xy[1] + '</span><span class="chip">' + escaparHTML(casillasNube[id].nombre || '?') + '</span><span class="chip">+' + formatoNumero(g.hora) + '/h</span></div>'; });
      return '<div class="carta"><p><b>🟦 ' + ts.length + ' ' + L('casillas', 'tiles') + ' · +' + formatoNumero(prod) + ' ' + L('por hora', 'per hour') + '</b></p>' + (filas.join('') || '<p class="nota">' + L('Tu alianza aún no tiene casillas. Conquista una en el Mundo.', 'Your alliance has no tiles yet. Conquer one in the World.') + '</p>') + '<button class="comprar" data-accion="al-mapa">🗺️ ' + T('al_ver_mapa') + '</button></div>';
    }
    if (k === 'batalla' || k === 'poder') {
      var total = mi.reduce(function (s, m) { return s + (m.poder || 0); }, 0);
      var h2 = k === 'poder' ? '<div class="carta casilla-tabla"><span>' + L('Poder total', 'Total power') + '</span><b>💪 ' + formatoNumero(total) + '</b><span>' + L('Promedio', 'Average') + '</span><b>' + formatoNumero(Math.round(total / Math.max(1, mi.length))) + '</b><span>' + L('Miembros', 'Members') + '</span><b>' + mi.length + '/100</b></div>' :
        '<div class="carta"><p class="nota">' + L('Clasificación de la semana por poder. Los 3 primeros llevan medalla.', 'Weekly ranking by power. The top 3 get a medal.') + '</p></div>';
      return h2 + '<div class="carta" style="margin-top:8px">' + mi.map(function (m, i) { return '<div class="fila-miembro' + (m.uid === yoU ? ' yo' : '') + '"><b>' + (['🥇', '🥈', '🥉'][i] || '#' + (i + 1)) + '</b><b>' + escaparHTML(m.nombre) + '</b><span class="chip">💪 ' + formatoNumero(m.poder) + '</span>' + (k === 'poder' ? '<span class="chip">' + Math.round((m.poder || 0) / Math.max(1, total) * 100) + '%</span>' : '') + '</div>'; }).join('') + '</div>';
    }
    if (k === 'ayuda') return htmlRefuerzos(alCache.pedidos, alCache.recibidos, alCache.enviados);
    if (k === 'miembros') return htmlMiembrosAlianza(al, alCache.miembros);
    if (k === 'ajustes') {
      var lider = al.lider === yoU;
      return '<div class="carta"><p><b>🌐 ' + L('Idioma', 'Language') + '</b></p>' + (lider ? '<select id="al-idioma" class="campo">' + Object.keys(IDIOMAS_AL).map(function (q) { return '<option value="' + q + '"' + ((al.idioma || 'es') === q ? ' selected' : '') + '>' + IDIOMAS_AL[q] + '</option>'; }).join('') + '</select>' +
        '<p><b>📢 ' + L('Anuncio', 'Notice') + '</b></p><input id="al-des" class="campo" maxlength="120" value="' + escaparHTML(al.descripcion || '') + '"><button class="comprar naranja" data-accion="al-ajustes" style="margin-top:6px">' + L('Guardar', 'Save') + '</button>' : '<p class="nota">' + (IDIOMAS_AL[al.idioma] || IDIOMAS_AL.es) + ' · ' + L('Solo el líder cambia los ajustes.', 'Only the leader changes settings.') + '</p>') +
        '<div class="stats" style="margin-top:10px"><button class="comprar" data-accion="al-mapa">🗺️ ' + T('al_ver_mapa') + '</button><button class="comprar rojo" data-accion="al-salir" data-lider="' + (lider ? 1 : 0) + '">' + T('al_salir') + '</button></div></div>';
    }
    return '';
  }
  // ---------- REFUERZOS ENTRE ALIADOS ----------
  var TIPOS_REFUERZO = ['espadachin', 'caballeria', 'arquero', 'guardian'];
  var refRecibidos = [], refVistos = null, ultimaRevRef = 0, revisandoRef = false, refProcesando = {};
  function totalTropasDe(t) { return TIPOS_REFUERZO.reduce(function (s, k) { return s + ((t && t[k]) || 0); }, 0); }
  function iconosTropas(t) { return TIPOS_REFUERZO.filter(function (k) { return t && t[k]; }).map(function (k) { return t[k] + ' ' + TROPAS[k].icono; }).join(' · '); }
  function propiasDe(tipo) { return tropas.filter(function (u) { return u.tipo === tipo && !u.invocada && !u.refuerzo; }); }
  function quitarUnidad(u) {
    var i = tropas.indexOf(u); if (i >= 0) tropas.splice(i, 1);
    escena.remove(u.m.grupo); escena.remove(u.barra);
  }
  function volverTropas(t) {
    var n = 0;
    TIPOS_REFUERZO.forEach(function (k) { for (var i = 0; i < ((t && t[k]) || 0); i++) { crearTropa(k, casaTropa()); n++; } });
    return n;
  }
  // nivel del caballero: el número de la corona de tu perfil
  var TROPA_RANGO_ESTRELLAS = { explorador: 1, miliciano: 1, espadachin: 1, guardian: 2, arquero: 1, jinete: 1, caballeria: 2, caballeria_pesada: 3, balista: 3, ariete: 3, catapulta: 4, torre_asedio: 4 };
  // el nivel del jugador sube con la experiencia: construir, mejorar, ganar oleadas, misiones y batallas
  function xpParaNivel(L2) { return 25 * (L2 - 1) * L2; }
  function nivelJugador() { var x = estado.xp || 0, n = 1; while (n < 60 && x >= xpParaNivel(n + 1)) n++; return n; }
  function sumarXP(n) {
    if (!n) return;
    var antes = nivelJugador(); estado.xp = (estado.xp || 0) + Math.round(n);
    var ahora = nivelJugador();
    if (ahora > antes) { sonar('victoria'); consejoTemporal('⭐ ' + L('¡Subiste a nivel ' + ahora + '!', 'You reached level ' + ahora + '!')); }
    actualizarHUD();
  }
  function xpDeProgreso() {
    var x = ((estado.oleada || 1) - 1) * 20;
    for (var c = 2; c <= (estado.castillo || 1); c++) x += 40 * c;
    for (var m = 1; m <= (estado.muralla || 0); m++) x += 25 * m;
    slots.forEach(function (s) { if (s.edificio) for (var k = 1; k <= s.edificio.nivel; k++) x += 10 * k; });
    return x;
  }
  function nivelCaballero() { return nivelJugador(); }
  // ---------- CADENA DE DESBLOQUEO: lo que pide cada obra ----------
  var REQ_CONSTRUIR = { academia: [['cuartel', 1], ['jugador', 2]], establo: [['cuartel', 2], ['jugador', 3]], galeria: [['cuartel', 1]], herreria: [['academia', 1]], vigia: [['muralla', 1]], enfermeria: [['cuartel', 1]], almacen: [['castillo', 2]], mercado: [['castillo', 2]] };
  function filaReq(que, pide) {
    var tiene = que === 'jugador' ? nivelJugador() : que === 'castillo' ? (estado.castillo || 1) : que === 'muralla' ? (estado.muralla || 0) : nivelMayor(que);
    var nom = que === 'jugador' ? '⭐ ' + L('Tu nivel', 'Your level') : que === 'castillo' ? '🏰 ' + T('castillo') : que === 'muralla' ? '🧱 ' + L('Muralla', 'Wall') : (EDIFICIOS[que] ? EDIFICIOS[que].icono + ' ' : '') + N(que);
    return { nombre: nom, pide: L('Nv ', 'Lv ') + pide, tiene: L('Nv ', 'Lv ') + tiene, ok: tiene >= pide || !!estado.dueno, k: que, n: pide };
  }
  function requisitosObra(que, L2) {
    var l = [];
    if (que === 'castillo') { if (L2 >= 2) l.push(filaReq('jugador', L2)); if (L2 >= 3) l.push(filaReq('muralla', L2 - 2)); return l; }
    if (que === 'muralla') { l.push(filaReq('castillo', L2)); l.push(filaReq('cantera', L2 + 1)); l.push(filaReq('jugador', L2 + 2)); return l; }
    if (L2 >= 2) l.push(filaReq('castillo', L2));
    if (que === 'cuartel' && L2 >= 2) l.push(filaReq('jugador', L2));
    if (que === 'academia' && L2 >= 2) l.push(filaReq('jugador', L2 + 1));
    if (L2 === 1) (REQ_CONSTRUIR[que] || []).forEach(function (q) { l.push(filaReq(q[0], q[1])); });
    return l;
  }
  function faltaObra(que, L2) { var f = requisitosObra(que, L2).filter(function (x) { return !x.ok; })[0]; return f ? L('Falta: ', 'Missing: ') + f.nombre.replace(/^\S+ /, '') + ' ' + f.pide : null; }
  function botonFalta(txt) { return '<button class="comprar bloqueado-tr" disabled>🔒 ' + txt + '</button>'; }
  var pedidosCache = [];
  function htmlPedido(p, mio) {
    var tropasP = p.tipo !== 'recursos', falta = Math.max(0, (p.cantidad || 0) - (p.recibido || 0)), pct = Math.min(100, Math.round((p.recibido || 0) / Math.max(1, p.cantidad || 1) * 100));
    var que = tropasP ? T('ped_tropas') + ' ' + T(p.motivo === 'atacar' ? 'ped_motivo_atacar' : 'ped_motivo_defender') : ICONO_RECURSO[p.recurso] + ' ' + T('r_' + p.recurso);
    var don = (p.donantes || []).map(function (s) { var q = String(s).split('|'); return escaparHTML(q[0]) + ' ' + formatoNumero(+q[1] || 0); });
    var h = '<div class="pedido' + (mio ? ' mio' : '') + '"><div class="ped-cab">' + (tropasP ? (p.motivo === 'atacar' ? '⚔️' : '🛡️') : '📦') + ' <b>' + (mio ? T('ped_mio') : T('ped_de', { n: escaparHTML(p.nombre) })) + '</b> · ' + que + '</div>' +
      '<div class="ped-barra"><div style="width:' + pct + '%"></div><span>' + formatoNumero(p.recibido || 0) + ' / ' + formatoNumero(p.cantidad || 0) + (falta ? ' · ' + T('ped_faltan', { n: formatoNumero(falta) }) : '') + '</span></div>' +
      '<p class="nota">' + (don.length ? T('ped_donaron', { l: don.join(', ') }) : T('ped_nadie')) + '</p>';
    if (mio) h += (falta ? '' : '<p class="nota"><b>' + T('ped_completo') + '</b></p>') + '<button class="comprar mini" data-accion="ped-quitar" data-id="' + escaparHTML(p.id) + '">' + T('ped_quitar') + '</button>';
    else if (falta) h += tropasP ? '<button class="comprar mini naranja" data-accion="ped-tropas" data-id="' + escaparHTML(p.id) + '">' + T('ped_mandar_tropas') + '</button>'
      : '<button class="comprar mini naranja" data-accion="ped-donar" data-id="' + escaparHTML(p.id) + '">' + T('ped_donar') + '</button>';
    return h + '</div>';
  }
  function htmlRefuerzos(pedidos, recibidos, enviados) {
    var yoUid = Cuentas.usuario().uid, hoy = Date.now() - 24 * 3600 * 1000;
    pedidosCache = pedidos.filter(function (p) { return p.tipo && p.fecha > hoy; });
    var mios = pedidosCache.filter(function (p) { return p.uid === yoUid; }), otros = pedidosCache.filter(function (p) { return p.uid !== yoUid; });
    var h = '<div class="carta" style="margin-top:10px"><h3>📣 ' + T('ped_titulo') + '</h3><p class="nota">' + T('nivel_caballero', { n: nivelCaballero(), m: limiteRefuerzos(nivelCaballero()) }) + '</p>' +
      '<div class="stats ped-botones"><button class="comprar mini naranja" data-accion="ped-nuevo" data-tipo="tropas" data-motivo="defender">' + T('ped_def') + '</button><button class="comprar mini rojo" data-accion="ped-nuevo" data-tipo="tropas" data-motivo="atacar">' + T('ped_atk') + '</button><button class="comprar mini morado" data-accion="ped-nuevo" data-tipo="recursos">' + T('ped_rec') + '</button></div>';
    mios.forEach(function (p) { h += htmlPedido(p, true); });
    if (!otros.length) h += '<p class="nota">' + T('ped_ninguno') + '</p>';
    otros.forEach(function (p) { h += htmlPedido(p, false); });
    h += '</div><div class="carta" style="margin-top:10px"><h3>' + T('ref_titulo') + '</h3><p class="nota">' + T('ref_txt') + '</p>';
    var rec = recibidos.filter(function (r) { return !r.devuelto && totalTropasDe(r.tropas); });
    h += '<p class="nota" style="margin-top:8px"><b>' + T('ref_en_reino') + '</b></p>';
    if (!rec.length) h += '<p class="nota">' + T('ref_nadie') + '</p>';
    rec.forEach(function (r) {
      h += '<div class="fila-miembro">🛡️<b>' + T('ref_de', { n: totalTropasDe(r.tropas), q: escaparHTML(r.deNombre) }) + '</b><span class="chip">' + iconosTropas(r.tropas) + '</span><button class="comprar mini" data-accion="ref-devolver" data-id="' + escaparHTML(r.id) + '">' + T('ref_devolver') + '</button></div>';
    });
    var env = enviados.filter(function (r) { return !r.devuelto; });
    h += '<p class="nota" style="margin-top:8px"><b>' + T('ref_enviados') + '</b></p>';
    if (!env.length) h += '<p class="nota">' + T('ref_nadie') + '</p>';
    env.forEach(function (r) {
      h += '<div class="fila-miembro">➡️<b>' + T('ref_a', { n: totalTropasDe(r.tropas), q: escaparHTML(r.paraNombre) }) + '</b><span class="chip">' + iconosTropas(r.tropas) + '</span><button class="comprar mini rojo" data-accion="ref-retirar" data-id="' + escaparHTML(r.id) + '">' + T('ref_retirar') + '</button></div>';
    });
    return h + '</div>';
  }
  var refPedido = null;
  function abrirEnviarRefuerzo(uid, nombre, pedido) {
    refPedido = pedido || null;
    if (!hayCuenta() || !estado.alianza) return;
    if (oleadaActiva) { consejoTemporal(T('ref_en_oleada')); sonar('error'); return; }
    var h = '<div class="carta"><h3>' + T('ref_enviar_a', { q: escaparHTML(nombre) }) + '</h3><p class="nota">' + T('ref_txt') + '</p>';
    TIPOS_REFUERZO.forEach(function (k) {
      var n = Math.min(refPedido ? Math.max(0, refPedido.cantidad - (refPedido.recibido || 0)) : 300, propiasDe(k).length);
      h += '<div class="fila-ref"><div class="foto">' + fotoHTML(k, TROPAS[k].icono) + '</div><div style="flex:1;min-width:0"><b>' + N(k) + '</b> <span class="nota">' + T('ref_tienes', { n: propiasDe(k).length }) + '</span>' +
        '<div class="fila-ref-barra"><input type="range" id="ref-' + k + '" min="0" max="' + n + '" value="0"' + (n ? '' : ' disabled') + '><b class="num" id="refn-' + k + '">0</b>' +
        '<button class="comprar mini" data-accion="ref-max" data-tipo="' + k + '"' + (n ? '' : ' disabled') + '>' + T('maximo') + '</button></div></div></div>';
    });
    h += '<p class="nota aviso-rojo" id="ref-error"></p><button class="comprar naranja boton-oleada-grande" data-accion="ref-mandar" data-uid="' + escaparHTML(uid) + '" data-nombre="' + escaparHTML(nombre) + '">' + T('ref_enviar') + '</button></div>';
    abrirPanel(T('ref_titulo'), h, { tipo: 'refuerzo' });
    TIPOS_REFUERZO.forEach(function (k) {
      var rg = $('ref-' + k); if (rg) rg.addEventListener('input', function () { $('refn-' + k).textContent = rg.value; });
    });
  }
  function mandarRefuerzo(b) {
    if (oleadaActiva) { consejoTemporal(T('ref_en_oleada')); sonar('error'); return; }
    var t = {}, total = 0;
    var tope = refPedido ? Math.max(0, refPedido.cantidad - (refPedido.recibido || 0)) : 1e9;
    TIPOS_REFUERZO.forEach(function (k) { var rg = $('ref-' + k); var n = rg ? Math.min(+rg.value || 0, propiasDe(k).length, refPedido ? tope : 300) : 0; n = Math.min(n, tope - total); t[k] = n; total += n; });
    if (!total) { $('ref-error').textContent = T('ref_nada'); sonar('error'); return; }
    var uid = b.getAttribute('data-uid'), nombre = b.getAttribute('data-nombre');
    b.disabled = true;
    Cuentas.enviarRefuerzo({ de: Cuentas.usuario().uid, deNombre: Cuentas.nombrePublico(), para: uid, paraNombre: String(nombre).slice(0, 30), tropas: t, alianza: estado.alianza, fecha: Date.now(), devuelto: false })
      .then(function () {
        // las tropas salen de tu reino (primero las que están guardadas en el cuartel)
        TIPOS_REFUERZO.forEach(function (k) {
          propiasDe(k).sort(function (x, y) { return (y.dentro ? 1 : 0) - (x.dentro ? 1 : 0); }).slice(0, t[k]).forEach(quitarUnidad);
        });
        asignarPuestos();
        guardar(true); publicarAldea(true); actualizarHUD();
        sonar('cuerno'); consejoTemporal(T('ref_enviado', { q: nombre }));
        if (refPedido) { Cuentas.donarPedido(refPedido.id, total, Cuentas.nombrePublico()).catch(function () {}); refPedido = null; }
        cerrarPanel();
      }).catch(function () { b.disabled = false; $('ref-error').textContent = T('ref_error'); sonar('error'); });
  }
  function abrirNuevoPedido(tipo, motivo) {
    if (!hayCuenta() || !estado.alianza) return;
    var tropasP = tipo === 'tropas', max = tropasP ? limiteRefuerzos(nivelCaballero()) : 100000;
    var h = '<div class="carta"><h3>' + (tropasP ? T(motivo === 'atacar' ? 'ped_atk' : 'ped_def') : T('ped_rec')) + '</h3>' +
      (tropasP ? '<p class="nota">' + T('nivel_caballero', { n: nivelCaballero(), m: max }) + '</p>' : '<p class="nota">' + T('ped_llegan') + '</p><div class="mer-fila" id="ped-recursos">' + ['oro', 'comida', 'madera', 'piedra'].map(function (r, i) { return '<button class="mer-r' + (i === 0 ? ' activo' : '') + '" data-r="' + r + '">' + ICONO_RECURSO[r] + '</button>'; }).join('') + '</div>') +
      '<div class="tropa-cantidad"><span>' + T('ped_cantidad') + '</span><input type="range" id="ped-n" min="' + (tropasP ? 5 : 500) + '" max="' + max + '" step="' + (tropasP ? 5 : 500) + '" value="' + Math.round(max / 2) + '"><span class="tropa-num" id="ped-num">' + Math.round(max / 2) + '</span></div>' +
      '<button class="comprar naranja boton-oleada-grande" data-accion="ped-crear" data-tipo="' + tipo + '" data-motivo="' + (motivo || '') + '">' + T('ped_crear') + '</button></div>';
    abrirPanel(T('ped_titulo'), h, { tipo: 'pedido' });
    var rg = $('ped-n'); rg.addEventListener('input', function () { $('ped-num').textContent = formatoNumero(+rg.value); });
    var box = $('ped-recursos'); if (box) box.addEventListener('click', function (ev) { var b = ev.target.closest('[data-r]'); if (!b) return; box.querySelectorAll('.mer-r').forEach(function (x) { x.classList.toggle('activo', x === b); }); });
  }
  function crearPedido(b) {
    var tipo = b.getAttribute('data-tipo'), tropasP = tipo === 'tropas', n = Math.floor(+$('ped-n').value || 0);
    var max = tropasP ? limiteRefuerzos(nivelCaballero()) : 100000; n = Math.max(1, Math.min(max, n));
    var rsel = document.querySelector('#ped-recursos .activo');
    var datos = { nombre: Cuentas.nombrePublico(), alianza: estado.alianza, fecha: Date.now(), tipo: tropasP ? 'tropas' : 'recursos', motivo: tropasP ? (b.getAttribute('data-motivo') || 'defender') : '', recurso: tropasP ? '' : (rsel ? rsel.getAttribute('data-r') : 'oro'), cantidad: n, recibido: 0, donantes: [] };
    b.disabled = true;
    Cuentas.crearPedido(tropasP ? 't' : 'r', datos).then(function () { sonar('cuerno'); consejoTemporal(T('ped_hecho')); abrirPanelAlianza(); })
      .catch(function () { b.disabled = false; consejoTemporal(T('ref_error')); sonar('error'); });
  }
  function abrirDonar(p) {
    var falta = Math.max(0, p.cantidad - (p.recibido || 0)), r = p.recurso;
    var max = Math.max(0, Math.min(falta, Math.floor(cantidad(r)), capCarreta() * carretasLibres(), 100000));
    var h = '<div class="carta"><h3>📦 ' + T('ped_de', { n: escaparHTML(p.nombre) }) + ' · ' + ICONO_RECURSO[r] + ' ' + T('r_' + r) + '</h3><p class="nota">' + T('ped_donar_txt') + '</p><p class="nota">' + T('car_estado', { l: carretasLibres(), n: carretas().n }) + ' · ' + T('car_tienes', { n: carretas().n, l: carretasLibres(), c: formatoNumero(capCarreta()) }) + '</p>' +
      '<div class="tropa-cantidad"><input type="range" id="don-n" min="0" max="' + max + '" step="' + Math.max(1, Math.round(max / 50)) + '" value="' + max + '"' + (max ? '' : ' disabled') + '><span class="tropa-num" id="don-num">' + formatoNumero(max) + '</span></div>' +
      '<button class="comprar naranja boton-oleada-grande" data-accion="ped-mandar" data-id="' + escaparHTML(p.id) + '"' + (max ? '' : ' disabled') + '>🛒 ' + T('ped_donar') + '</button></div>';
    abrirPanel(T('ped_titulo'), h, { tipo: 'pedido' });
    var rg = $('don-n'); rg.addEventListener('input', function () { $('don-num').textContent = formatoNumero(+rg.value); });
  }
  function mandarDonacion(b) {
    var p = pedidosCache.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; if (!p) return;
    var n = Math.floor(+$('don-n').value || 0), r = p.recurso; if (n <= 0) return;
    var nc = carretasPara(n); if (carretasLibres() < nc) { consejoTemporal(T('car_faltan', { n: nc, l: carretasLibres() })); sonar('error'); return; }
    var rec = { oro: 0, comida: 0, madera: 0, piedra: 0 }; rec[r] = n;
    var c = {}; c[r] = n; if (!pagar(c)) return;
    b.disabled = true;
    var destino, seg;
    lugarDeNube(p.uid).then(function (l) { destino = l; seg = segViaje(miLugar(), destino); return Cuentas.enviarRecursos({ de: Cuentas.usuario().uid, deNombre: Cuentas.nombrePublico(), para: p.uid, recursos: rec, alianza: estado.alianza, fecha: Date.now(), llega: Date.now() + seg * 1000, carretas: nc })
      ; })
      .then(function () { return Cuentas.donarPedido(p.id, n, Cuentas.nombrePublico()); })
      .then(function () { salirCarretas('envio', miLugar(), destino, rec, nc, p.nombre); consejoTemporal(T('ped_donado', { n: ICONO_RECURSO[r] + ' ' + formatoNumero(n), q: escaparHTML(p.nombre) })); sonar('moneda'); guardar(true); abrirPanelAlianza(); })
      .catch(function () { sumarRecurso(r, n); b.disabled = false; consejoTemporal(T('ref_error')); sonar('error'); });
  }
  function pedirRefuerzos(b) {
    if (!estado.alianza) return;
    b.disabled = true;
    Cuentas.pedirRefuerzos(estado.alianza).then(function () { sonar('cuerno'); consejoTemporal(T('ref_pedido_hecho')); abrirPanelAlianza(); })
      .catch(function () { b.disabled = false; consejoTemporal(T('ref_error')); sonar('error'); });
  }
  function devolverRefuerzo(id, b) {
    if (oleadaActiva) { consejoTemporal(T('ref_en_oleada')); sonar('error'); return; }
    b.disabled = true;
    Cuentas.actualizarRefuerzo(id, { devuelto: true }).then(function () {
      tropas.filter(function (u) { return u.refuerzo === id; }).forEach(quitarUnidad);
      refRecibidos = refRecibidos.filter(function (r) { return r.id !== id; });
      asignarPuestos(); publicarAldea(true);
      consejoTemporal(T('ref_devueltos')); abrirPanelAlianza();
    }).catch(function () { b.disabled = false; consejoTemporal(T('ref_error')); sonar('error'); });
  }
  function retirarRefuerzo(id, b) {
    if (refProcesando[id]) return;
    refProcesando[id] = true; b.disabled = true;
    Cuentas.leerRefuerzo(id).then(function (r) {
      if (!r) return null;
      return Cuentas.borrarRefuerzo(id).then(function () { return r; });
    }).then(function (r) {
      if (r) { volverTropas(r.tropas); guardar(true); publicarAldea(true); consejoTemporal(T('ref_retirados')); }
      abrirPanelAlianza();
    }).catch(function () { refProcesando[id] = false; b.disabled = false; consejoTemporal(T('ref_error')); sonar('error'); });
  }
  // Pone en tu reino las tropas que te mandaron (y quita las que ya se fueron)
  function sincronizarRecibidos(lista) {
    var ids = {};
    lista.forEach(function (r) { ids[r.id] = r; });
    tropas.filter(function (u) { return u.refuerzo && !ids[u.refuerzo]; }).forEach(quitarUnidad);
    var nuevos = [];
    lista.forEach(function (r) {
      if (refVistos && !refVistos[r.id]) nuevos.push(r.deNombre);
      TIPOS_REFUERZO.forEach(function (k) {
        var mias = tropas.filter(function (u) { return u.refuerzo === r.id && u.tipo === k; }), quiero = (r.tropas && r.tropas[k]) || 0;
        for (var i = mias.length; i < quiero; i++) { var u = crearTropa(k, casaTropa()); u.refuerzo = r.id; u.deNombre = r.deNombre; }
        mias.slice(quiero).forEach(quitarUnidad);
      });
    });
    refVistos = ids;
    refRecibidos = lista;
    asignarPuestos();
    if (nuevos.length) { sonar('cuerno'); consejoTemporal(T('ref_llegaron', { q: nuevos.join(', ') })); publicarAldea(true); nuevoCorreo('alianza', L('Llegaron refuerzos', 'Reinforcements arrived'), nuevos.join(', '), '<p>' + T('ref_llegaron', { q: escaparHTML(nuevos.join(', ')) }) + '</p>'); }
  }
  function revisarRefuerzos(forzar) {
    if (!hayCuenta() || enMenu || revisandoRef || oleadaActiva) return;
    if (!forzar && Date.now() - ultimaRevRef < 30000) return;
    ultimaRevRef = Date.now(); revisandoRef = true;
    recibirEnvios();
    Promise.all([Cuentas.refuerzosRecibidos(), Cuentas.refuerzosEnviados()]).then(function (r) {
      revisandoRef = false;
      if (oleadaActiva || enMenu) return;
      sincronizarRecibidos(r[0].filter(function (x) { return !x.devuelto && totalTropasDe(x.tropas); }));
      // los refuerzos que te devolvieron vuelven a tu reino
      r[1].filter(function (x) { return x.devuelto && !refProcesando[x.id]; }).forEach(function (x) {
        refProcesando[x.id] = true;
        Cuentas.borrarRefuerzo(x.id).then(function () {
          var n = volverTropas(x.tropas);
          if (n) consejoTemporal(T('ref_volvieron', { n: n, q: x.paraNombre }));
          guardar(true); publicarAldea(true);
        }).catch(function () { refProcesando[x.id] = false; });
      });
    }).catch(function () { revisandoRef = false; });
  }
  // Después de una pelea: le avisamos a la nube cuántos refuerzos siguen vivos
  function informarBajasRefuerzos() {
    if (!hayCuenta()) return;
    refRecibidos.forEach(function (r) {
      var vivos = {}, cambio = false;
      TIPOS_REFUERZO.forEach(function (k) {
        vivos[k] = Math.min((r.tropas && r.tropas[k]) || 0, tropas.filter(function (u) { return u.refuerzo === r.id && u.tipo === k; }).length);
        if (vivos[k] !== ((r.tropas && r.tropas[k]) || 0)) cambio = true;
      });
      if (!cambio) return;
      var todos = !totalTropasDe(vivos);
      r.tropas = vivos;
      Cuentas.actualizarRefuerzo(r.id, todos ? { tropas: vivos, devuelto: true } : { tropas: vivos }).catch(function () {});
    });
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
  // los aldeanos caminan por los caminos de piedra (las esquinas entre parcelas) y por el camino grande
  var ESQUINAS = (function () {
    var vistas = {}, l = [];
    slots.forEach(function (s) { if (s.campo) return; [[-5, -5], [5, -5], [-5, 5], [5, 5]].forEach(function (q) { var x = s.pos.x + q[0], z = s.pos.z + q[1], k = x + '_' + z; if (!vistas[k]) { vistas[k] = 1; l.push(new V3(x, 0, z)); } }); });
    return l;
  })();
  function esquinaCerca(p) { var m = null, d = 1e9; ESQUINAS.forEach(function (q) { var e = Math.hypot(q.x - p.x, q.z - p.z); if (e < d) { d = e; m = q; } }); return m; }
  function rutaAldeano(desde) {
    var a = esquinaCerca(desde), b = ESQUINAS[Math.floor(Math.random() * ESQUINAS.length)];
    // a veces van a la plaza del castillo por el camino grande
    if (Math.random() < 0.15) return [a, puntoCamino(largoCamino * (0.82 + Math.random() * 0.12)).p.clone()];
    if (Math.hypot(b.x - a.x, b.z - a.z) > 32) b = ESQUINAS.filter(function (q) { return Math.hypot(q.x - a.x, q.z - a.z) < 30; })[Math.floor(Math.random() * 6)] || b;
    return [a, new V3(b.x, 0, a.z), b];
  }
  for (var al = 0; al < 14; al++) {
    var ma = M.unidad('aldeano'), pa = ESQUINAS.length ? ESQUINAS[Math.floor(Math.random() * ESQUINAS.length)].clone() : puntoPueblo();
    ma.grupo.position.copy(pa);
    escena.add(ma.grupo);
    aldeanos.push({ m: ma, ruta: ESQUINAS.length ? rutaAldeano(pa) : [], meta: pa.clone(), espera: Math.random() * 3, vel: 1.2 + Math.random() * 0.6 });
  }
  function moverAldeanos(dt, t) {
    aldeanos.forEach(function (a, i) {
      var g = a.m.grupo, camina = false;
      if (a.espera > 0) a.espera -= dt;
      else {
        var dx = a.meta.x - g.position.x, dz = a.meta.z - g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.2) {
          if (a.ruta && a.ruta.length) { a.meta = a.ruta.shift(); if (!a.ruta.length) a.espera = 1 + Math.random() * 4; }
          else if (ESQUINAS.length) { a.ruta = rutaAldeano(g.position); a.meta = a.ruta.shift(); }
          else { a.meta = puntoPueblo(); a.espera = 1 + Math.random() * 4; }
        }
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
    moverAnimales(dt, t);
  }
  // Gallinas cerca del pueblo y cabras pastando en los prados (solo decoración)
  var animales = [];
  function puntoAnimal(tipo) {
    for (var k = 0; k < 40; k++) {
      var a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (tipo !== 'gallina') {
        // caballos y cabras pastan fuera de la muralla, entre el foso y los campos
        var f = MURALLA_FORMA, m = 1.1 + Math.random() * 0.55; x = f.cx + Math.cos(a) * f.rx * m; z = f.cz + Math.sin(a) * f.rz * m;
        if (slots.some(function (s) { return s.campo && Math.hypot(s.pos.x - x, s.pos.z - z) < 6.5; }) || distRio(x, z) < 5) continue;
      }
      if (distCamino(x, z) > 3 && Math.hypot(x - ESTANQUE.x, z - ESTANQUE.z) > ESTANQUE.r + 1.5) return new V3(x, 0, z);
    }
    return new V3(8, 0, 8);
  }
  ['gallina', 'gallina', 'gallina', 'gallina', 'gallina', 'cabra', 'cabra', 'cabra', 'cabra', 'caballo', 'caballo', 'caballo', 'caballo'].forEach(function (tipo) {
    var an = M.animal(tipo), p0 = puntoAnimal(tipo);
    an.grupo.position.copy(p0);
    an.grupo.rotation.y = Math.random() * 6;
    escena.add(an.grupo);
    animales.push({ a: an, meta: puntoAnimal(tipo), espera: Math.random() * 5, vel: tipo === 'gallina' ? 1.1 : tipo === 'caballo' ? 0.9 : 0.6 });
  });
  function moverAnimales(dt, t) {
    animales.forEach(function (o, i) {
      var g = o.a.grupo, camina = false;
      if (o.espera > 0) o.espera -= dt;
      else {
        var dx = o.meta.x - g.position.x, dz = o.meta.z - g.position.z, d = Math.hypot(dx, dz);
        if (d < 0.2) {
          // pasos cortos: no cruzan todo el mapa
          var cerca = puntoAnimal(o.a.tipo);
          o.meta = g.position.clone().lerp(cerca, o.a.tipo === 'gallina' ? 0.25 : 0.2);
          o.espera = 1.5 + Math.random() * 5;
        } else {
          var paso = Math.min(d, o.vel * dt);
          g.position.x += dx / d * paso; g.position.z += dz / d * paso;
          var dif = ((Math.atan2(dx, dz) - g.rotation.y) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          g.rotation.y += dif * Math.min(1, dt * 6);
          camina = true;
          if (Math.hypot(g.position.x, g.position.z) < 6) { o.meta = puntoAnimal(o.a.tipo); }
          if (o.a.tipo !== 'gallina') { var fm2 = MURALLA_FORMA, ex = (g.position.x - fm2.cx) / fm2.rx, ez = (g.position.z - fm2.cz) / fm2.rz; if (ex * ex + ez * ez < 1.12) { o.meta = puntoAnimal(o.a.tipo); } }
        }
      }
      M.animarAnimal(o.a, t + i * 1.7, camina);
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
  var audio = null, ultimoSonido = {}, salida = null, ecoEnvio = null, bufRuido = null;
  var musicaOn = leerPref().musica !== false;
  // Prepara el audio: volumen general con compresor (suena lleno sin saturar) y un eco suave de sala de castillo
  function prepararAudio() {
    if (audio) return;
    audio = new (window.AudioContext || window.webkitAudioContext)();
    var comp = audio.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    salida = audio.createGain(); salida.gain.value = 0.9;
    salida.connect(comp); comp.connect(audio.destination);
    // eco: respuesta de una sala grande hecha con ruido que se apaga
    var largo = Math.floor(audio.sampleRate * 2.2), imp = audio.createBuffer(2, largo, audio.sampleRate);
    for (var c = 0; c < 2; c++) { var d = imp.getChannelData(c); for (var i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3.2); }
    var conv = audio.createConvolver(); conv.buffer = imp;
    ecoEnvio = audio.createGain(); ecoEnvio.gain.value = 0.32;
    ecoEnvio.connect(conv); conv.connect(salida);
    bufRuido = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    var r = bufRuido.getChannelData(0); for (var j = 0; j < r.length; j++) r[j] = Math.random() * 2 - 1;
  }
  // Una nota: oscilador con ataque y caída, filtro opcional y algo de eco
  function nota(fr, cuando, dur, o) {
    o = o || {};
    var t0 = audio.currentTime + (cuando || 0);
    var osc = audio.createOscillator(), g = audio.createGain(), ultimo = osc;
    osc.type = o.tipo || 'sine';
    osc.frequency.setValueAtTime(fr, t0);
    if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, t0 + dur);
    if (o.detune) osc.detune.value = o.detune;
    if (o.vibrato) { var lfo = audio.createOscillator(), lg = audio.createGain(); lfo.frequency.value = 5.5; lg.gain.value = fr * 0.012; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.1); }
    if (o.filtro) { var fi = audio.createBiquadFilter(); fi.type = 'lowpass'; fi.frequency.setValueAtTime(o.filtro, t0); if (o.filtroHasta) fi.frequency.exponentialRampToValueAtTime(o.filtroHasta, t0 + dur); fi.Q.value = o.q || 0.8; ultimo.connect(fi); ultimo = fi; }
    var vol = o.vol || 0.1, at = o.ataque || 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    ultimo.connect(g); g.connect(o.destino || salida);
    if (o.eco) { var ge = audio.createGain(); ge.gain.value = o.eco; g.connect(ge); ge.connect(ecoEnvio); }
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  // Ruido filtrado (golpes, silbidos, platillos)
  function sruido(cuando, dur, o) {
    o = o || {};
    var t0 = audio.currentTime + (cuando || 0);
    var s = audio.createBufferSource(); s.buffer = bufRuido; s.loop = true;
    var fi = audio.createBiquadFilter(); fi.type = o.tipo || 'bandpass';
    fi.frequency.setValueAtTime(o.fr || 1000, t0); if (o.hasta) fi.frequency.exponentialRampToValueAtTime(o.hasta, t0 + dur);
    fi.Q.value = o.q || 1;
    var g = audio.createGain(), vol = o.vol || 0.1;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (o.ataque || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fi); fi.connect(g); g.connect(o.destino || salida);
    if (o.eco) { var ge = audio.createGain(); ge.gain.value = o.eco; g.connect(ge); ge.connect(ecoEnvio); }
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
  // Cuerda pulsada (como un laúd)
  function laud(fr, cuando, dur, vol, destino) {
    nota(fr, cuando, dur, { tipo: 'sawtooth', vol: vol, ataque: 0.004, filtro: fr * 6, filtroHasta: fr * 1.2, destino: destino, eco: 0.25 });
    nota(fr * 2, cuando, dur * 0.5, { tipo: 'triangle', vol: vol * 0.35, ataque: 0.003, destino: destino });
  }
  // Metal (espadas, monedas): varias frecuencias que no son armónicas
  function metal(fr, cuando, dur, vol) {
    [1, 2.76, 5.4, 8.93].forEach(function (k, i) { nota(fr * k, cuando, dur / (1 + i * 0.6), { vol: vol / (1 + i), eco: 0.35 }); });
  }
  function bombo(cuando, vol, destino) {
    nota(110, cuando, 0.35, { hasta: 42, vol: vol, ataque: 0.002, destino: destino });
    sruido(cuando, 0.06, { tipo: 'lowpass', fr: 900, vol: vol * 0.5, destino: destino });
  }
  function metales(acorde, cuando, dur, vol) { // fanfarria de trompetas
    acorde.forEach(function (fr) {
      [-7, 7].forEach(function (dt) { nota(fr, cuando, dur, { tipo: 'sawtooth', vol: vol, ataque: 0.04, filtro: 600, filtroHasta: 2600, detune: dt, eco: 0.4, vibrato: true }); });
    });
  }
  function sonar(cual) {
    if (!estado.sonido) return;
    try {
      prepararAudio();
      if (audio.state === 'suspended') audio.resume();
      var ahora = performance.now();
      if (ultimoSonido[cual] && ahora - ultimoSonido[cual] < 70) return;
      ultimoSonido[cual] = ahora;
      arrancarMusica();
      switch (cual) {
        case 'click': sruido(0, 0.04, { fr: 2600, q: 3, vol: 0.12 }); nota(1100, 0, 0.05, { tipo: 'triangle', vol: 0.05 }); break;
        case 'error': nota(196, 0, 0.16, { tipo: 'square', vol: 0.06, filtro: 700 }); nota(147, 0.09, 0.22, { tipo: 'square', vol: 0.06, filtro: 600 }); break;
        case 'moneda': metal(1568, 0, 0.35, 0.07); metal(2093, 0.07, 0.45, 0.06); break;
        case 'gemas': [1760, 2217, 2637, 3520].forEach(function (fr, i) { nota(fr, i * 0.05, 0.5, { vol: 0.05, eco: 0.6 }); }); sruido(0, 0.4, { tipo: 'highpass', fr: 7000, vol: 0.03, eco: 0.5 }); break;
        case 'martillo':
          [0, 0.17].forEach(function (d) { bombo(d, 0.12); sruido(d, 0.08, { fr: 1800, q: 2, vol: 0.12 }); metal(1240, d, 0.25, 0.04); }); break;
        case 'listo': metales([523, 659, 784], 0, 0.28, 0.035); metales([659, 784, 1047], 0.22, 0.55, 0.04); bombo(0, 0.12); break;
        case 'golpe': sruido(0, 0.07, { tipo: 'highpass', fr: 3200, vol: 0.09 }); metal(1900 + Math.random() * 400, 0, 0.18, 0.045); bombo(0, 0.06); break;
        case 'flecha': sruido(0, 0.18, { fr: 3800, hasta: 700, q: 4, vol: 0.07 }); break;
        case 'muerte': sruido(0, 0.3, { tipo: 'lowpass', fr: 1600, hasta: 200, vol: 0.08 }); nota(330, 0, 0.3, { hasta: 90, tipo: 'triangle', vol: 0.05 }); break;
        case 'cuerno':
          [146.8, 220, 293.7].forEach(function (fr, i) { nota(fr, 0, 1.25, { tipo: 'sawtooth', vol: 0.05 - i * 0.01, ataque: 0.12, filtro: 500, filtroHasta: 1400, vibrato: true, eco: 0.6, detune: i * 4 }); });
          bombo(0, 0.1); break;
        case 'victoria':
          metales([523, 659, 784], 0, 0.3, 0.035); metales([587, 740, 880], 0.3, 0.3, 0.035); metales([659, 831, 988, 1319], 0.6, 1.2, 0.04);
          [0, 0.3, 0.6].forEach(function (d) { bombo(d, 0.14); }); sruido(0.6, 1.2, { tipo: 'highpass', fr: 6000, vol: 0.05, eco: 0.6 }); break;
        case 'derrota':
          metales([392, 466], 0, 0.6, 0.03); metales([349, 415], 0.55, 0.6, 0.03); metales([294, 349], 1.1, 1.3, 0.03); bombo(0, 0.1); bombo(1.1, 0.12); break;
        case 'entrenado': metales([440], 0, 0.12, 0.03); metales([659], 0.1, 0.22, 0.03); sruido(0, 0.05, { fr: 1500, vol: 0.06 }); break;
        case 'magia': [784, 988, 1175, 1568, 1976].forEach(function (fr, i) { nota(fr, i * 0.05, 0.6, { vol: 0.045, eco: 0.7, detune: (i % 2 ? 8 : -8) }); }); sruido(0, 0.6, { tipo: 'highpass', fr: 5000, hasta: 9000, vol: 0.03, eco: 0.6 }); break;
        case 'poder':
          sruido(0, 0.35, { fr: 400, hasta: 3000, q: 1.5, vol: 0.08 }); bombo(0.25, 0.16); nota(70, 0.25, 0.6, { hasta: 35, vol: 0.12 });
          metales([392, 587], 0.25, 0.4, 0.03); break;
      }
    } catch (e) { /* sin audio */ }
  }
  // ---------- MÚSICA DE FONDO (medieval, hecha con código) ----------
  // Re dórico: laúd con arpegios, un bordón grave y tambor. En la batalla va más rápida y con redoblante.
  var musica = { on: false, gan: null, sig: 0, paso: 0, timer: null };
  var ACORDES = [[146.8, 174.6, 220], [130.8, 164.8, 196], [146.8, 174.6, 220], [110, 130.8, 164.8], [174.6, 220, 261.6], [130.8, 164.8, 196], [146.8, 174.6, 220], [146.8, 220, 293.7]];
  var ESCALA = [293.7, 329.6, 349.2, 392, 440, 493.9, 523.3, 587.3];
  function arrancarMusica() {
    if (musica.on || !musicaOn || !estado.sonido || !audio || enMenu) return;
    musica.on = true;
    musica.gan = audio.createGain(); musica.gan.gain.value = 0.0001; musica.gan.connect(salida);
    musica.gan.gain.exponentialRampToValueAtTime(0.55, audio.currentTime + 2);
    musica.sig = audio.currentTime + 0.1; musica.paso = 0;
    musica.timer = setInterval(programarMusica, 120);
  }
  function pararMusica() {
    if (!musica.on) return;
    musica.on = false; clearInterval(musica.timer);
    var g = musica.gan; try { g.gain.cancelScheduledValues(audio.currentTime); g.gain.setValueAtTime(g.gain.value, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.6); } catch (e) {}
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 800);
  }
  function programarMusica() {
    if (!musica.on || !audio) return;
    var batalla = oleadaActiva, negra = 60 / (batalla ? 112 : 84), corchea = negra / 2, dest = musica.gan;
    while (musica.sig < audio.currentTime + 0.5) {
      var p = musica.paso, compas = Math.floor(p / 8) % ACORDES.length, tiempoC = p % 8, ac = ACORDES[compas], cu = musica.sig - audio.currentTime;
      if (tiempoC === 0) { // bordón grave del acorde
        nota(ac[0] / 2, cu, negra * 4.1, { tipo: 'triangle', vol: 0.05, ataque: 0.3, filtro: 380, destino: dest });
        nota(ac[0] / 2 * 1.5, cu, negra * 4.1, { tipo: 'sine', vol: 0.025, ataque: 0.4, destino: dest });
      }
      // laúd: arpegio del acorde, y a veces una nota de la melodía
      var fr = (tiempoC % 2 === 0) ? ac[(tiempoC / 2) % 3] * 2 : (Math.random() < 0.45 ? ESCALA[Math.floor(Math.random() * ESCALA.length)] : 0);
      if (fr) laud(fr, cu, corchea * 2.2, tiempoC % 2 === 0 ? 0.035 : 0.025, dest);
      // tambor
      if (tiempoC === 0 || tiempoC === 4) bombo(cu, batalla ? 0.11 : 0.07, dest);
      if (tiempoC === 2 || tiempoC === 6) sruido(cu, 0.09, { tipo: 'lowpass', fr: 700, vol: 0.05, destino: dest });
      if (batalla && tiempoC % 2 === 1) sruido(cu, 0.05, { tipo: 'highpass', fr: 2500, vol: 0.03, destino: dest });
      musica.sig += corchea; musica.paso++;
    }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pararMusica(); else if (audio) arrancarMusica(); });
  // el navegador solo deja sonar después del primer toque
  window.addEventListener('pointerdown', function () { if (estado.sonido && musicaOn && !enMenu) { try { prepararAudio(); if (audio.state === 'suspended') audio.resume(); arrancarMusica(); } catch (e) {} } }, true);

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
  var bocanadas = [];
  var texHumo = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  function bocanada(pos, polvo) {
    if (bocanadas.length > (calidad === 'alta' ? 140 : 50)) return;
    if (calidad !== 'alta' && polvo) return;
    // cada bocanada tiene su material (se desvanece sola); el humo se oscurece de noche
    var tono = polvo ? 0xcbb08a : new THREE.Color(0xd8d4cc).lerp(new THREE.Color(0x4a5068), nocheActual * 0.7).getHex();
    var m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHumo, color: tono, transparent: true, depthWrite: false, opacity: polvo ? 0.5 : 0.6 }));
    m.position.copy(pos);
    m.scale.setScalar(polvo ? 0.5 : 0.6);
    escena.add(m);
    bocanadas.push({ m: m, vida: polvo ? 0.7 : 2.6, max: polvo ? 0.7 : 2.6, polvo: polvo, deriva: new V3((Math.random() - 0.5) * 0.3, polvo ? 0.35 : 0.9, (Math.random() - 0.5) * 0.3) });
  }
  function moverBocanadas(dt) {
    bocanadas = bocanadas.filter(function (b) {
      b.vida -= dt;
      b.m.position.addScaledVector(b.deriva, dt);
      var k = 1 - b.vida / b.max;
      b.m.scale.setScalar(((b.polvo ? 0.45 : 0.55) + k * (b.polvo ? 0.6 : 1.4)) * 1.6);
      b.m.material.opacity = (b.polvo ? 0.5 : 0.6) * (1 - k) * Math.min(1, k * 6 + 0.3);
      if (b.vida <= 0) { escena.remove(b.m); b.m.material.dispose(); return false; }
      return true;
    });
  }
  // anillo brillante bajo la tropa seleccionada
  var anilloSel = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 28), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  anilloSel.rotation.x = -Math.PI / 2; anilloSel.visible = false; escena.add(anilloSel);
  var unidadSel = null;
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
  function crearModelo(tipo, nivel) { return M.fusionar(crearModeloBase(tipo, nivel)); }
  // 'tramo' es 1..4 (ver tramoNivel): el modelo base más los adornos y materiales de ese tramo
  function crearModeloBase(tipo, tramo) {
    var n = TRAMO_INTERNO[tramo] || 1;
    var m = tipo === 'granja' ? M.granja(n) : tipo === 'cuartel' ? M.cuartel(n) : tipo === 'enfermeria' ? M.enfermeria(n) : tipo === 'aserradero' ? M.aserradero(n) : tipo === 'mina' ? M.minaOro(n) : tipo === 'cantera' ? M.cantera(n) : tipo === 'vigia' ? M.vigia(n) : tipo === 'almacen' ? M.almacen(n) : tipo === 'mercado' ? M.mercado(n) : tipo === 'herreria' ? M.herreria(n) : tipo === 'establo' ? M.establo(n) : tipo === 'galeria' ? M.galeria(n) : tipo === 'academia' ? M.academia(n) : M.torre(n);
    return M.mejorarPorTramo(m, tramo, tipo);
  }

  function construir(i, tipo) {
    var s = slots[i];
    if (s.edificio || s.obra) return;
    if (s.campo !== esCampo(tipo)) { consejoTemporal(T(s.campo ? 'solo_ciudad' : 'solo_campo')); sonar('error'); return; }
    if (cerrada(s)) { consejoTemporal(T('parcela_cerrada', { n: nivelParaParcela(s) })); sonar('error'); return; }
    var fo = faltaObra(tipo, 1); if (fo) { consejoTemporal('🔒 ' + fo); sonar('error'); return; }
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
    var fm = faltaObra(s.edificio.tipo, n + 1); if (fm) { consejoTemporal('🔒 ' + fm); sonar('error'); return; }
    var pendE = trabajosPendientes('edificio', n + 1); if (pendE.length) { avisoTrabajos(pendE); return; }
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
      sumarXP(10 * o.nivel);
      guardar();
    }
  }
  // Que el edificio quepa en su parcela con aire alrededor (crece un poco con cada tramo de nivel) y quede centrado
  var MAX_EDIFICIO = [0, 5.4, 5.7, 6.0, 6.3];
  function encajarEnParcela(m, tr) {
    m.position.set(0, 0, 0); m.updateMatrixWorld(true);
    var caja = new THREE.Box3().setFromObject(m), tam = caja.getSize(new V3()), lado = Math.max(tam.x, tam.z), max = MAX_EDIFICIO[tr] || 6;
    if (lado > max) { m.scale.multiplyScalar(max / lado); m.updateMatrixWorld(true); caja.setFromObject(m); }
    var c = caja.getCenter(new V3());
    m.position.x -= c.x; m.position.z -= c.z;
    m.position.y = 0.2;
  }
  function ponerEdificio(s, tipo, nivel) {
    if (s.modelo) s.grupo.remove(s.modelo);
    s.edificio = { tipo: tipo, nivel: nivel };
    var tr = tramoNivel(nivel);
    s.modelo = crearModelo(tipo, tr);
    s.modelo.scale.setScalar(ESCALA_EDIFICIO * ESCALA_TRAMO[tr]);
    encajarEnParcela(s.modelo, tr);
    if (s.insignia) s.grupo.remove(s.insignia);
    s.insignia = M.etiquetaEdificio(N(tipo), nivel);
    s.insignia.position.set(0, (tipo === 'torre' ? 9.5 : 5.2) * ESCALA_TRAMO[tr] + (tr >= 4 ? 0.9 : 0), 0);
    s.grupo.add(s.insignia);
    s.grupo.add(s.modelo);
    s.cd = 0;
  }
  // ---------- ACELERADORES CON TIEMPO ----------
  var ACELERADORES = ['acel_1m', 'acel_5m', 'acel_15m', 'acel_1h', 'acel_8h', 'acel_12h'];
  function totalAceleradores() { return ACELERADORES.concat(['acelerador']).reduce(function (a, k) { return a + ((estado.mochila && estado.mochila[k]) || 0); }, 0); }
  function rapidezAcademia() { var ia = academiaLista(); return ia ? EDIFICIOS.academia.rapidez[ia.edificio.nivel - 1] : 1; }
  // segundos reales que faltan para terminar
  function faltaDe(que) {
    if (que === 'castillo') { var oc = estado.obraCastillo; return oc ? (oc.total - oc.t) / velObras() : 0; }
    if (que === 'entreno') return faltaEntreno() * velReal();
    if (que === 'invest') return faltaInvestigacion() * velReal();
    var s = slots[+String(que).split(':')[1]];
    return s && s.obra ? (s.obra.total - s.obra.t) / velObras() : 0;
  }
  function aplicarAcelerador(que, seg) {
    if (que === 'castillo' && estado.obraCastillo) { var oc = estado.obraCastillo; oc.t = Math.min(oc.total, oc.t + seg); return; }
    if (que === 'invest' && estado.investigando) { var ii = estado.investigando; ii.t = Math.min(ii.total, ii.t + seg * rapidezAcademia()); return; }
    if (que === 'entreno') {
      var r = seg * rapidezEntreno();
      while (r > 0 && colaEntreno.length) {
        var c = colaEntreno[0], f = c.total - c.t;
        if (r >= f) { r -= f; colaEntreno.shift(); crearTropa(c.tipo, puertaCuartel()); } else { c.t += r; r = 0; }
      }
      return;
    }
    var s = slots[+String(que).split(':')[1]];
    if (s && s.obra) s.obra.t = Math.min(s.obra.total, s.obra.t + seg);
  }
  function abrirAcelerar(que) {
    var v = $('acelerar-elegir'); if (v) v.remove();
    var falta = faltaDe(que);
    var d = document.createElement('div'); d.id = 'acelerar-elegir';
    var filas = ACELERADORES.map(function (k) {
      var n = (estado.mochila && estado.mochila[k]) || 0, it = TIENDA.filter(function (x) { return x.id === k; })[0];
      return '<div class="ac-fila"><span class="ac-ico">' + OBJETOS[k].icono + '</span><div class="ac-txt"><b>' + N(k) + '</b><span>×' + n + ' · ' + T('acel_recorta', { t: fmtTiempo(OBJETOS[k].segundos) }) + '</span></div>' +
        (n > 0 ? '<button class="comprar mini naranja" data-ac="' + k + '">' + T('acel_usar') + '</button>' : (it ? '<button class="comprar mini morado" data-ac-comprar="' + k + '"><span class="ico gema"></span>' + it.gemas + '</button>' : '')) + '</div>';
    }).join('');
    var real = (estado.mochila && estado.mochila.acelerador) || 0;
    if (real) filas += '<div class="ac-fila"><span class="ac-ico">⏩</span><div class="ac-txt"><b>' + N('acelerador') + '</b><span>' + T('acel_todo') + ' · ×' + real + '</span></div><button class="comprar mini naranja" data-ac="acelerador">' + T('acel_usar') + '</button></div>';
    d.innerHTML = '<div class="ac-caja"><div class="ac-cab"><h3>⏩ ' + T('acel_titulo') + '</h3><button class="cerrar" id="ac-cerrar">✕</button></div><p class="ac-falta" id="ac-falta">' + (falta > 0 ? '⏱ ' + T('acel_falta', { t: fmtTiempo(falta) }) : T('acel_listo')) + '</p>' + filas + '</div>';
    document.body.appendChild(d);
    $('ac-cerrar').addEventListener('click', function () { sonar('click'); d.remove(); });
    d.addEventListener('click', function (ev) {
      if (ev.target === d) { d.remove(); return; }
      var b = ev.target.closest('[data-ac]'), bc = ev.target.closest('[data-ac-comprar]');
      if (bc) { var it = TIENDA.filter(function (x) { return x.id === bc.getAttribute('data-ac-comprar'); })[0]; if (it && pagar(0, it.gemas)) { estado.mochila[it.id] = (estado.mochila[it.id] || 0) + 1; sonar('moneda'); guardar(true); abrirAcelerar(que); } return; }
      if (!b) return;
      var k = b.getAttribute('data-ac');
      if (!(estado.mochila[k] > 0) || faltaDe(que) <= 0) return;
      if (k === 'acelerador') { usarObjeto('acelerador'); d.remove(); return; }
      var seg = OBJETOS[k].segundos;
      estado.mochila[k]--;
      aplicarAcelerador(que, seg);
      sonar('magia'); consejoTemporal(T('acel_usado', { t: fmtTiempo(seg) }));
      actualizarHUD(); guardar(true);
      if (faltaDe(que) <= 0.5) { d.remove(); sonar('listo'); if (menuAbierto()) pintarMenuEdif(); if (panelActual) reabrirPanel(); return; }
      abrirAcelerar(que);
    });
  }
  // ---------- ALMACÉN, HERRERÍA, ESTABLO, GALERÍA Y MERCADO ----------
  function edificiosDe(tipo) { return slots.filter(function (s) { return s.edificio && s.edificio.tipo === tipo; }); }
  function nivelMayor(tipo) { return edificiosDe(tipo).reduce(function (a, s) { return Math.max(a, s.edificio.nivel); }, 0); }
  // qué edificio entrena cada tropa
  function edificioTropa(tipo) { return (TROPA_REQ[tipo] || {}).ed || 'cuartel'; }
  function faltaTropa(tipo) {
    var r = TROPA_REQ[tipo]; if (!r || estado.dueno) return null;
    if (nivelMayor(r.ed) < r.n) return r.n > 1 ? L('Necesitas ' + N(r.ed) + ' nivel ' + r.n, 'You need ' + N(r.ed) + ' level ' + r.n) : T(r.ed === 'establo' ? 'necesitas_establo' : r.ed === 'galeria' ? 'necesitas_galeria' : 'necesitas_cuartel_t');
    if (r.otro && nivelMayor(r.otro[0]) < r.otro[1]) return L('Necesitas ' + N(r.otro[0]) + ' nivel ' + r.otro[1], 'You need ' + N(r.otro[0]) + ' level ' + r.otro[1]);
    if (r.jugador && nivelJugador() < r.jugador) return L('Necesitas nivel de jugador ' + r.jugador, 'You need player level ' + r.jugador);
    return null;
  }
  function puedeEntrenarTipo(tipo) { return !faltaTropa(tipo); }
  function avisoEdificioTropa(tipo) { return faltaTropa(tipo) || ''; }
  // recursos que el almacén protege de los saqueos
  function proteccionAlmacen() { return edificiosDe('almacen').reduce(function (a, s) { return a + EDIFICIOS.almacen.protege[s.edificio.nivel - 1]; }, 0); }
  // armas: +10% de daño por nivel (hasta 3), se forjan en la Herrería
  var ARMAS = { costo: [250, 600, 1400], piedra: [120, 300, 700], gemas: [25, 50, 100], herreria: [1, 4, 7], dano: 0.1, max: 3 };
  function nivelArmas(tipo) { return (estado.armas && estado.armas[tipo]) || 0; }
  function factorArmas(tipo) { return 1 + ARMAS.dano * nivelArmas(tipo); }
  function forjarArmas(tipo, conGemas) {
    var n = nivelArmas(tipo); if (n >= ARMAS.max) return;
    if (nivelMayor('herreria') < ARMAS.herreria[n]) { consejoTemporal(T('her_necesita', { n: ARMAS.herreria[n] })); sonar('error'); return; }
    if (!(conGemas ? pagar(0, ARMAS.gemas[n]) : pagar({ oro: ARMAS.costo[n], piedra: ARMAS.piedra[n] }))) return;
    estado.armas = estado.armas || {}; estado.armas[tipo] = n + 1;
    sonar('martillo'); sonar('listo');
    consejoTemporal(T('armas_lista', { n: n + 1, t: N(tipo) }));
    actualizarHUD(); guardar(true); abrirPanelHerreria();
  }
  function abrirPanelHerreria() {
    var hn = nivelMayor('herreria');
    var html = (hn ? '' : '<p class="nota aviso-rojo">' + T('her_sin') + '</p>') + '<div class="lista">';
    ['espadachin', 'caballeria', 'arquero', 'guardian'].forEach(function (t) {
      var na = nivelArmadura(t), nw = nivelArmas(t);
      html += '<div class="carta compacta"><div class="cab"><div class="foto">' + fotoHTML(t, TROPAS[t].icono) + '</div><div><h3>' + N(t) + '</h3><p class="nota">🛡️ ' + T('her_armadura') + ' ' + na + '/' + ARMADURA.max + ' · ⚔️ ' + T('her_armas') + ' ' + nw + '/' + ARMAS.max + '</p></div></div><div class="botones">';
      if (nw < ARMAS.max) {
        var req = ARMAS.herreria[nw], ok = hn >= req;
        html += '<p class="nota">' + T('her_armas_sube', { n: nw + 1, d: Math.round(ARMAS.dano * 100 * (nw + 1)) }) + (ok ? '' : ' — <b class="aviso-rojo">' + T('her_necesita', { n: req }) + '</b>') + '</p>';
        if (ok) html += '<div class="hf-fila">' + botonCosto({ oro: ARMAS.costo[nw], piedra: ARMAS.piedra[nw] }, 'armas', 'data-tipo="' + t + '"', '⚔️ ') + botonGemas(ARMAS.gemas[nw], 'armas-gemas', 'data-tipo="' + t + '"', '⚔️') + '</div>';
      } else html += '<p class="nota"><b>⚔️ ' + T('nivel_max') + '</b></p>';
      if (na < ARMADURA.max) html += '<div class="hf-fila" style="margin-top:6px">' + botonCosto(costoArmadura(na), 'armadura', 'data-tipo="' + t + '"', '🛡️ ').replace('class="comprar"', 'class="comprar armadura"') + botonGemas(ARMADURA.gemas[na], 'armadura-gemas', 'data-tipo="' + t + '"', '🛡️') + '</div>';
      html += '</div></div>';
    });
    abrirPanel(T('p_herreria'), html + '</div>', { tipo: 'herreria' });
  }
  // ---- MERCADO ----
  var mer = { da: 'madera', recibe: 'oro', n: 100, envio: { oro: 0, comida: 0, madera: 0, piedra: 0 }, para: '' };
  function tasaMercado() { var n = nivelMayor('mercado'); return n ? EDIFICIOS.mercado.tasa[n - 1] : 0; }
  function abrirPanelMercado() {
    var tasa = tasaMercado(), R = ['oro', 'comida', 'madera', 'piedra'];
    if (mer.da === mer.recibe) mer.recibe = R.filter(function (r) { return r !== mer.da; })[0];
    var max = Math.max(0, Math.floor(cantidad(mer.da)));
    mer.n = Math.max(0, Math.min(mer.n, max));
    function fila(cual) {
      return '<div class="mer-fila">' + R.map(function (r) { return '<button class="mer-r' + (mer[cual] === r ? ' activo' : '') + '" data-accion="mer-elegir" data-cual="' + cual + '" data-r="' + r + '">' + ICONO_RECURSO[r] + '</button>'; }).join('') + '</div>';
    }
    var html = htmlCarretas() + '<div class="carta compacta" style="margin-top:8px"><h3>⚖️ ' + T('mer_cambiar') + '</h3><p class="nota">' + T('tasa_txt', { n: Math.round(tasa * 100) }) + '</p>' +
      '<div class="mer-lado"><b>' + T('mer_das') + '</b>' + fila('da') + '</div><div class="mer-lado"><b>' + T('mer_recibes') + '</b>' + fila('recibe') + '</div>' +
      '<div class="tropa-cantidad"><input type="range" id="mer-n" min="0" max="' + max + '" step="' + Math.max(1, Math.round(max / 100)) + '" value="' + mer.n + '"><span class="tropa-num" id="mer-num">' + mer.n + '</span></div>' +
      '<p class="mer-res" id="mer-res">' + ICONO_RECURSO[mer.da] + ' ' + mer.n + ' → ' + ICONO_RECURSO[mer.recibe] + ' ' + Math.floor(mer.n * tasa) + '</p>' +
      '<button class="comprar naranja" data-accion="mer-cambiar"' + (mer.n > 0 && tasa ? '' : ' disabled') + '>⚖️ ' + T('mer_cambiar') + '</button></div>';
    html += '<div class="carta compacta" style="margin-top:8px"><h3>📦 ' + T('mer_enviar') + '</h3><div id="mer-envio">';
    if (!hayCuenta()) html += '<p class="nota">' + T('mer_sin_cuenta') + '</p>';
    else if (!estado.alianza) html += '<p class="nota">' + T('mer_sin_alianza') + '</p>';
    else html += '<p class="nota">' + T('mundo_cargando') + '</p>';
    html += '</div></div>';
    abrirPanel(T('p_mercado'), html, { tipo: 'mercado' });
    if (hayCuenta() && estado.alianza) Cuentas.miembros(estado.alianza).then(function (lista) {
      var otros = lista.filter(function (a) { return a.uid !== Cuentas.usuario().uid; });
      var box = $('mer-envio'); if (!box) return;
      if (!otros.length) { box.innerHTML = '<p class="nota">' + T('mer_nadie') + '</p>'; return; }
      if (!otros.some(function (a) { return a.uid === mer.para; })) mer.para = otros[0].uid;
      box.innerHTML = '<label class="nota">' + T('mer_a') + ' <select id="mer-para">' + otros.map(function (a) { return '<option value="' + a.uid + '"' + (a.uid === mer.para ? ' selected' : '') + '>' + escaparHTML(a.nombre) + '</option>'; }).join('') + '</select></label>' +
        R.map(function (r) { var mx = Math.min(capCarreta() * Math.max(1, carretasLibres()), 100000, Math.floor(cantidad(r))); return '<div class="tropa-cantidad"><span style="width:26px">' + ICONO_RECURSO[r] + '</span><input type="range" class="mer-env" data-r="' + r + '" min="0" max="' + mx + '" step="' + Math.max(1, Math.round(mx / 50)) + '" value="' + Math.min(mer.envio[r], mx) + '"><span class="tropa-num" id="mer-env-' + r + '">' + Math.min(mer.envio[r], mx) + '</span></div>'; }).join('') +
        '<button class="comprar" data-accion="mer-enviar">' + T('mer_enviar_btn') + '</button>';
      mer.nombres = {}; otros.forEach(function (a) { mer.nombres[a.uid] = a.nombre; });
    }).catch(function () {});
  }
  function cambiarMercado() {
    var tasa = tasaMercado(), n = Math.min(mer.n, Math.floor(cantidad(mer.da))), recibe = Math.floor(n * tasa);
    if (n <= 0 || !recibe) return;
    var c = {}; c[mer.da] = n;
    if (!pagar(c)) return;
    sumarRecurso(mer.recibe, recibe);
    sonar('moneda');
    consejoTemporal(T('mer_cambio_ok', { a: ICONO_RECURSO[mer.da] + ' ' + n, b: ICONO_RECURSO[mer.recibe] + ' ' + recibe }));
    guardar(true); abrirPanelMercado();
  }
  function enviarMercado(boton) {
    var R = ['oro', 'comida', 'madera', 'piedra'], rec = {}, tot = 0;
    R.forEach(function (r) { rec[r] = Math.max(0, Math.min(100000, Math.floor(mer.envio[r] || 0), Math.floor(cantidad(r)))); tot += rec[r]; });
    if (!tot) { consejoTemporal(T('mer_nada')); sonar('error'); return; }
    var para = $('mer-para') ? $('mer-para').value : mer.para;
    var nc = carretasPara(tot);
    if (carretasLibres() < nc) { consejoTemporal(T('car_faltan', { n: nc, l: carretasLibres() })); sonar('error'); return; }
    if (!pagar(rec)) return;
    boton.disabled = true;
    var destino, seg;
    lugarDeNube(para).then(function (l) { destino = l; seg = segViaje(miLugar(), destino); return Cuentas.enviarRecursos({ de: Cuentas.usuario().uid, deNombre: Cuentas.nombrePublico(), para: para, recursos: rec, alianza: estado.alianza, fecha: Date.now(), llega: Date.now() + seg * 1000, carretas: nc }).then(function () {
      salirCarretas('envio', miLugar(), destino, rec, nc, (mer.nombres || {})[para] || '');
      sonar('moneda'); consejoTemporal(T('mer_enviado', { n: escaparHTML((mer.nombres || {})[para] || '') }));
      mer.envio = { oro: 0, comida: 0, madera: 0, piedra: 0 };
      guardar(true); abrirPanelMercado();
    }).catch(function () {
      R.forEach(function (r) { if (rec[r]) sumarRecurso(r, rec[r]); });
      consejoTemporal(T('mer_error')); sonar('error'); boton.disabled = false;
    }); });
  }
  // ---------- CARRETAS: se entrenan en el Mercado, se mejoran y viajan por el mapa ----------
  function carretas() { return estado.carretas || (estado.carretas = { n: CARRETA.inicio, nivel: 1, cola: [], viajes: [] }); }
  function capCarreta() { return Math.round((CARRETA.capacidad[carretas().nivel] || CARRETA.capacidad[1]) * (1 + bono('carga'))); }
  function carretasLibres() { var c = carretas(); return Math.max(0, c.n - c.viajes.reduce(function (s, v) { return s + v.n; }, 0)); }
  function carretasPara(total) { return Math.max(1, Math.ceil(total / capCarreta())); }
  // segundos de viaje entre dos puntos del mapa (coordenadas 0..99)
  function segViaje(de, a) { return Math.round((30 + 6 * Math.hypot((de.x || 0) - (a.x || 0), (de.y || 0) - (a.y || 0))) * (1 - 0.06 * tecAl('carretas'))); }
  function salirCarretas(tipo, de, a, recursos, n, nombre) {
    var seg = segViaje(de, a), ahora = Date.now();
    var v = { id: 'v' + ahora + Math.floor(Math.random() * 1000), tipo: tipo, de: de, a: a, sale: ahora, llega: ahora + seg * 1000, vuelve: ahora + 2 * seg * 1000, recursos: recursos, n: n, nombre: nombre || '' };
    carretas().viajes.push(v);
    consejoTemporal(T('car_salen', { n: n, t: fmtTiempo(seg) }));
    return v;
  }
  function procesarCarretas(silencio) {
    var c = carretas(), ahora = Date.now(), listas = 0;
    while (c.cola.length && c.cola[0] <= ahora) { c.cola.shift(); c.n++; listas++; }
    if (listas && !silencio) { consejoTemporal(T('car_listas', { n: listas })); sonar('listo'); }
    var vuelven = c.viajes.filter(function (v) { return v.vuelve <= ahora; });
    if (vuelven.length) {
      c.viajes = c.viajes.filter(function (v) { return v.vuelve > ahora; });
      vuelven.forEach(function (v) {
        if (v.tipo === 'recoger' && v.recursos) { ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (v.recursos[r]) sumarRecurso(r, v.recursos[r]); }); if (!silencio) { consejoTemporal(T('car_volvieron', { b: textoBotin(v.recursos) })); sonar('moneda'); } }
      });
      guardar();
    }
  }
  function entrenarCarretas(k) {
    if (!edificiosDe('mercado').length) { consejoTemporal(T('car_necesitas_mercado')); sonar('error'); return; }
    var costo = { oro: CARRETA.costo.oro * k, madera: CARRETA.costo.madera * k };
    if (!pagar(costo)) return;
    var c = carretas(), ahora = Date.now(), ult = c.cola.length ? c.cola[c.cola.length - 1] : ahora;
    for (var i = 0; i < k; i++) { ult = Math.max(ult, ahora) + CARRETA.tiempo * 1000 / (estado.dueno ? velReal() : 1); c.cola.push(ult); }
    sonar('martillo'); guardar(true); reabrirPanel();
  }
  function mejorarCarretas() {
    var c = carretas(), sig = c.nivel + 1;
    if (!CARRETA.mejora[sig]) return;
    if (!pagar(CARRETA.mejora[sig])) return;
    c.nivel = sig; sonar('listo');
    consejoTemporal(T('car_mejoradas', { n: sig, c: formatoNumero(capCarreta()) }));
    guardar(true); reabrirPanel();
  }
  function htmlCarretas() {
    var c = carretas(), sig = c.nivel + 1, enCamino = c.viajes.reduce(function (s, v) { return s + v.n; }, 0);
    var h = '<div class="carta car-carta"><h3>' + iconoCarreta() + ' ' + T('car_titulo') + ' <span class="me-nivel">' + c.nivel + '</span></h3><p class="nota">' + T('car_txt') + '</p>' +
      '<p><b>' + T('car_tienes', { n: c.n, l: carretasLibres(), c: formatoNumero(capCarreta()) }) + '</b>' + (enCamino ? ' · ' + T('car_en_camino', { n: enCamino }) : '') + '</p>';
    if (c.cola.length) h += '<p class="nota reloj-panel">⏱ ' + T('car_entrenando', { n: c.cola.length, t: fmtTiempo((c.cola[0] - Date.now()) / 1000) }) + '</p>';
    h += '<div class="car-botones">' + [1, 5, 10].map(function (k) { return botonCosto({ oro: CARRETA.costo.oro * k, madera: CARRETA.costo.madera * k }, 'car-entrenar', 'data-n="' + k + '"', T('car_entrenar', { n: k }) + ' ⏱' + fmtTiempo(CARRETA.tiempo * k) + ' '); }).join('') + '</div>';
    h += CARRETA.mejora[sig] ? botonCosto(CARRETA.mejora[sig], 'car-mejorar', '', '⬆️ ' + T('car_mejorar', { n: sig, c: formatoNumero(CARRETA.capacidad[sig]) }) + ' ') : '<p class="nota"><b>' + T('car_max') + '</b></p>';
    return h + '</div>';
  }
  // carretas viajando en el mapa del mundo (las tuyas y las que te mandan)
  var enviosEnCamino = [];
  function lugarDe(uid) { var a = aldeasCache.filter(function (x) { return x.uid === uid; })[0]; return a ? { x: a.x, y: a.y } : null; }
  // dónde está el reino de otro jugador (si no está en el mapa cargado, se pregunta a la nube)
  function lugarDeNube(uid) { var l = lugarDe(uid); if (l) return Promise.resolve(l); return Cuentas.leerAldea(uid).then(function (a) { return a && typeof a.x === 'number' ? { x: a.x, y: a.y } : miLugar(); }).catch(function () { return miLugar(); }); }
  function modeloCarreta() {
    var g = new THREE.Group();
    var fc = M.figura('carreta'), fh = M.figura('caballo');
    if (fc && fh) { var ad = new THREE.Group(); ad.add(fc); fh.rotation.y = -Math.PI / 2; fh.position.set(-0.85, 0, 0); ad.add(fh); ad.rotation.y = Math.PI; ad.position.x = -0.3; g.add(ad); g.scale.setScalar(0.85); return g; }
    g.add(M.caja ? M.caja(0.7, 0.3, 0.45, 0x9a5e2c, 0, 0.32, 0) : new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.45), new THREE.MeshLambertMaterial({ color: 0x9a5e2c })));
    var saco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8d39a })); saco.position.set(0, 0.55, 0); g.add(saco);
    [[-0.25, 0.26], [0.25, 0.26], [-0.25, -0.26], [0.25, -0.26]].forEach(function (p) { var r = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0x5c3418 })); r.rotation.x = Math.PI / 2; r.position.set(p[0], 0.15, p[1]); g.add(r); });
    var bu = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.2), new THREE.MeshLambertMaterial({ color: 0x7a5232 })); bu.position.set(0.62, 0.3, 0); g.add(bu);
    return g;
  }
  function procesarRegresos() {
    var l = estado.regresos; if (!l || !l.length) return;
    var ahora = Date.now(), quedan = [];
    l.forEach(function (v) {
      if (v.llega > ahora) { quedan.push(v); return; }
      if (v.botin) { ['oro', 'comida', 'madera', 'piedra'].forEach(function (k) { if (v.botin[k]) sumarRecurso(k, v.botin[k]); }); consejoTemporal('🏇 ' + L('Tus tropas volvieron de ' + v.nombre + ' con el botín: ', 'Your troops came back from ' + v.nombre + ' with the loot: ') + textoBotin(v.botin)); sonar('moneda'); }
      else consejoTemporal('🏇 ' + L('Tus tropas volvieron de ' + v.nombre + '.', 'Your troops came back from ' + v.nombre + '.'));
    });
    if (quedan.length !== l.length) { estado.regresos = quedan; guardar(true); actualizarHUD(); }
  }
  // ---------- COLUMNAS DE TROPAS EN EL MAPA: tu ataque (azul), el enemigo que viene (rojo) y la vuelta con el botín ----------
  function modeloColumna(color, tipo) {
    var g = new THREE.Group(), us = [];
    [[0, 0.35], [-0.32, 0], [0.32, 0], [-0.16, -0.38], [0.16, -0.38]].forEach(function (q) { var u = M.unidad(tipo || 'espadachin', 0.3, 0); u.grupo.position.set(q[0], 0, q[1]); g.add(u.grupo); us.push(u); });
    var asta = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5), new THREE.MeshLambertMaterial({ color: 0x5e3d24 })); asta.position.set(0.12, 0.65, 0.62); g.add(asta);
    var tela = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.03), new THREE.MeshLambertMaterial({ color: color })); tela.position.set(0.33, 1.15, 0.62); g.add(tela);
    g.userData.us = us; g.userData.tela = tela;
    return g;
  }
  var marchasVistas = {};
  function actualizarMarchasMundo() {
    if (!M3) return;
    M3.columnas = M3.columnas || {};
    var ahora = Date.now(), vivos = {}, lista = [], yo = miLugar();
    marchas.forEach(function (m) { if (m.resuelto || m.llega <= ahora) return; var d = (estado.destinos || {})[m.id] || lugarDe(m.defensor); if (d) lista.push({ id: 'm' + m.id, de: yo, a: d, sale: m.fecha, llega: m.llega, color: 0x2a6ad0, txt: '⚔️ ' + String(m.defensorNombre || '').slice(0, 12) }); });
    entrantes.forEach(function (r) { if (r.resuelto || r.llega <= ahora || r.cancelado) return; var d = lugarDe(r.atacante) || (r.prueba ? { x: Math.min(98, yo.x + 18), y: Math.max(1, yo.y - 14) } : null); if (d) lista.push({ id: 'e' + r.id, de: d, a: yo, sale: r.fecha || (r.llega - 120000), llega: r.llega, color: 0xd0302a, txt: '🔥 ' + String(r.atacanteNombre || '').slice(0, 12), enemigo: true }); });
    (estado.regresos || []).forEach(function (v) { if (v.llega > ahora) lista.push({ id: 'v' + v.id, de: v.de, a: v.a, sale: v.sale, llega: v.llega, color: 0x2a6ad0, txt: (v.botin ? '💰 ' : '🏇 ') + L('Vuelven', 'Returning'), botin: !!v.botin }); });
    var t = performance.now() / 1000;
    lista.forEach(function (v) {
      var c0 = celdaDe(v.de.x, v.de.y), c1 = celdaDe(v.a.x, v.a.y), p0 = posCelda(c0.x, c0.y), p1 = posCelda(c1.x, c1.y);
      var u = Math.max(0, Math.min(1, (ahora - v.sale) / Math.max(1, v.llega - v.sale)));
      var g = M3.columnas[v.id];
      if (!g) {
        g = new THREE.Group(); var col = modeloColumna(v.color, v.enemigo ? 'miliciano' : 'espadachin'); g.add(col); g.userData.col = col;
        if (v.botin) { var saco = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8c45a })); saco.position.set(0, 0.25, -0.75); col.add(saco); }
        var lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p0.x, 0.14, p0.z), new THREE.Vector3(p1.x, 0.14, p1.z)]);
        var linea = new THREE.Line(lg, new THREE.LineDashedMaterial({ color: v.color, dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.9 })); linea.computeLineDistances(); M3.e.add(linea); g.userData.linea = linea;
        M3.e.add(g); M3.columnas[v.id] = g;
      }
      g.position.set(p0.x + (p1.x - p0.x) * u, 0.06, p0.z + (p1.z - p0.z) * u);
      g.userData.col.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z);
      g.userData.col.userData.us.forEach(function (un, i) { M.animarUnidad(un, t + i * 0.37, true, 0); });
      // etiqueta con lo que falta (se cambia una vez por segundo)
      var txt = v.txt + ' · ' + fmtTiempo((v.llega - ahora) / 1000);
      if (g.userData.txt !== txt && (!g.userData.tEt || ahora - g.userData.tEt > 900)) {
        if (g.userData.et) g.remove(g.userData.et);
        var et = M.etiquetaEdificio(txt, 1); et.position.set(0, 1.9, 0); et.scale.multiplyScalar(0.5); g.add(et);
        g.userData.et = et; g.userData.txt = txt; g.userData.tEt = ahora;
      }
      vivos[v.id] = true;
    });
    for (var k in M3.columnas) if (!vivos[k]) { M3.e.remove(M3.columnas[k].userData.linea); M3.e.remove(M3.columnas[k]); delete M3.columnas[k]; }
  }
  function actualizarCarretasMundo() {
    if (!M3) return;
    M3.carros = M3.carros || {};
    var ahora = Date.now(), vivos = {};
    var lista = carretas().viajes.map(function (v) { return v; });
    enviosEnCamino.forEach(function (e) { var de = lugarDe(e.de); if (de && e.llega > ahora) lista.push({ id: 'e' + e.id, de: de, a: miLugar(), sale: e.fecha, llega: e.llega, vuelve: e.llega, n: e.carretas || 1, recursos: e.recursos, entrante: true }); });
    lista.forEach(function (v) {
      var ida = ahora < v.llega, u = ida ? (ahora - v.sale) / Math.max(1, v.llega - v.sale) : (ahora - v.llega) / Math.max(1, v.vuelve - v.llega);
      if (!ida && v.entrante) return;
      u = Math.max(0, Math.min(1, u));
      var p0 = posCelda(celdaDe(v.de.x, v.de.y).x, celdaDe(v.de.x, v.de.y).y), p1 = posCelda(celdaDe(v.a.x, v.a.y).x, celdaDe(v.a.x, v.a.y).y);
      var desde = ida ? p0 : p1, hasta = ida ? p1 : p0;
      var g = M3.carros[v.id];
      if (!g) { g = new THREE.Group(); g.add(modeloCarreta()); var et = M.etiquetaEdificio(L('Carretas', 'Carts') + ' ×' + v.n, v.n); et.position.set(0, 1.4, 0); et.scale.multiplyScalar(0.42); g.add(et); g.userData.et = et; M3.e.add(g); M3.carros[v.id] = g; }
      g.position.set(desde.x + (hasta.x - desde.x) * u, 0.05, desde.z + (hasta.z - desde.z) * u);
      g.rotation.y = Math.atan2(-(hasta.z - desde.z), hasta.x - desde.x);
      vivos[v.id] = true;
    });
    for (var k in M3.carros) if (!vivos[k]) { M3.e.remove(M3.carros[k]); delete M3.carros[k]; }
  }
  function recibirEnvios() {
    if (!hayCuenta() || !Cuentas.enviosRecibidos) return;
    Cuentas.enviosRecibidos().then(function (lista) {
      var ahora = Date.now();
      enviosEnCamino = lista.filter(function (e) { return (e.llega || 0) > ahora; });
      lista.filter(function (e) { return (e.llega || 0) <= ahora; }).forEach(function (e) {
        Cuentas.borrarEnvio(e.id).then(function () {
          var b = e.recursos || {};
          ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (b[r] > 0) sumarRecurso(r, Math.min(100000, b[r])); });
          sonar('moneda'); consejoTemporal(T('mer_recibiste', { n: escaparHTML(e.deNombre || '?'), b: textoBotin(b) }));
          nuevoCorreo('alianza', L('Llegaron recursos de ' + (e.deNombre || '?'), 'Resources arrived from ' + (e.deNombre || '?')), e.deNombre || '?', htmlInforme([[L('Carretas', 'Carts'), '🛒 ' + (e.carretas || 1)]], b));
          guardar(true);
        }).catch(function () {});
      });
    }).catch(function () {});
  }
  // ---- CAMPOS DE RECURSOS ----
  function ritmoCampo(s) {
    var d = EDIFICIOS[s.edificio.tipo];
    return d.produce[s.edificio.nivel - 1] * (1 + bono({ comida: 'cosecha', madera: 'lenadores', piedra: 'canteros' }[d.recurso] || '') + bonoCasillas(d.recurso)) / d.cada;
  }
  function capacidadCampo(s) { return s.edificio && esCampo(s.edificio.tipo) ? ritmoCampo(s) * HORAS_ALMACEN * 3600 : 0; }
  function recolectarCampo(s) {
    if (!s || !s.edificio) return;
    var n = Math.floor(s.guardado || 0), r = EDIFICIOS[s.edificio.tipo].recurso;
    if (n < 1) return;
    s.guardado -= n;
    sumarLogro('recolectas');
    sumarRecurso(r, n, s.pos.clone().setY(3.5));
    sonar('moneda');
    guardar();
  }
  function contarEdificios(tipo) {
    return slots.filter(function (s) { return (s.edificio && s.edificio.tipo === tipo) || (s.obra && s.obra.tipo === tipo); }).length;
  }
  function cuartelesListos() { return slots.filter(function (s) { return s.edificio && s.edificio.tipo === 'cuartel'; }); }
  function capacidad() {
    var c = cuartelesListos().reduce(function (a, s) { return a + EDIFICIOS.cuartel.capacidad[s.edificio.nivel - 1]; }, 0) + edificiosDe('establo').length + edificiosDe('galeria').length;
    // sin tope: se entrena mientras haya materiales (el límite es la comida, porque las tropas comen)
    return c ? 100000 : 0;
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
  function tropasNormales() { return tropas.filter(function (u) { return u.tipo !== 'heroe' && !u.invocada && !u.refuerzo; }).length; }

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

  // bonus de la investigación de cada tipo de tropa (Ataque, Vida, Defensa, Velocidad)
  function bonoTropa(tipo, stat) { var tc = buscarTec('t_' + tipo + '_' + stat); return tc ? ((estado.invest && estado.invest[tc.id]) || 0) * tc.cada : 0; }
  function velU(u) { return u.d.vel * (1 + bonoTropa(u.tipo, 'velocidad')); }
  function vidaTropa(tipo, na) { return TROPAS[tipo].vida * (1 + ARMADURA.vida * (na || 0) + bono('escudos') + bonoTropa(tipo, 'vida')); }
  function nivelArmadura(tipo) { return (estado.armadura && estado.armadura[tipo]) || 0; }
  function crearTropa(tipo, desde, invocada, heroeId) {
    var hd = heroeId ? HEROE[heroeId] : null;
    var d = hd ? statsHeroe(heroeId) : TROPAS[tipo];
    var na = tipo === 'heroe' ? 0 : nivelArmadura(tipo);
    var m = hd ? M.heroe(hd, (estado.heroes[heroeId] || {}).nivel) : M.unidad(tipo, undefined, na);
    m.grupo.position.copy(desde);
    escena.add(m.grupo);
    var u = {
      tipo: tipo, d: d, vida: hd ? d.vida : vidaTropa(tipo, na), max: hd ? d.vida : vidaTropa(tipo, na), heroeId: heroeId || null, defensa: hd ? (d.defensa || 0) : ARMADURA.defensa * na + bonoTropa(tipo, 'defensa'), armadura: na, pos: m.grupo.position, m: m, aliado: true,
      cd: Math.random() * 0.5, ataque: 0, puesto: reunion.clone(), radio: 0.42 * m.escala, invocada: !!invocada,
      barra: M.barraVida(false, tipo === 'heroe' ? 1.8 : 1.3), altoBarra: m.alto || 1.75 * m.escala
    };
    u.barra.visible = false;
    escena.add(u.barra);
    u.casa = heroeId ? puertaCastillo() : casaTropa();
    u.volviendo = !oleadaActiva;
    tropas.push(u);
    asignarPuestos();
    return u;
  }
  // ---- TROPAS DENTRO DEL CUARTEL ----
  // Fuera de las oleadas las tropas no se ven: están guardadas en su cuartel.
  // Al empezar la oleada salen una por una por la puerta; al terminar vuelven a entrar.
  var turnoCasa = 0;
  function puertaDe(c) { return c.pos.clone().add(new V3(Math.sin(c.grupo.rotation.y), 0, Math.cos(c.grupo.rotation.y)).multiplyScalar(1.9)); }
  function casaTropa() {
    var cs = cuartelesListos();
    if (!cs.length) return reunion.clone();
    return puertaDe(cs[turnoCasa++ % cs.length]);
  }
  function guardarDentro(u) {
    u.dentro = true; u.volviendo = false; u.salida = undefined;
    u.m.grupo.visible = false; u.barra.visible = false;
    u.pos.copy(u.casa);
  }
  function sacarTropas() {
    var k = 0;
    tropas.forEach(function (u) {
      u.volviendo = false;
      if (u.dentro) u.salida = (k++) * Math.max(0.05, Math.min(0.22, 6 / Math.max(1, tropas.length)));
    });
  }
  function tropasFuera() { return tropas.filter(function (u) { return !u.dentro; }); }
  function tropasDentroDe(c) {
    var p = puertaDe(c);
    return tropas.filter(function (u) { return u.dentro && u.casa.distanceTo(p) < 1; }).length;
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
        var ancho = lista.length > 40 ? 10 : lista.length > 15 ? 7 : 5;
        var fila = Math.floor(k / ancho), col = k % ancho;
        var enFila = Math.min(ancho, lista.length - fila * ancho);
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
    if (obj.escudoHasta && obj.escudoHasta > tiempo) n *= 0.5;
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
      if (u.tipo !== 'heroe' && !u.invocada && !u.refuerzo && totalHeridos() < capacidadEnfermeria()) {
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
  // cuántas se pueden entrenar ahora (por espacio y por recursos)
  function maxEntrenar(tipo) {
    var libre = Math.min(500, Math.max(0, capacidad() - tropasOcupadas())), c = costoTropa(tipo), n = libre;
    if (!estado.oroInfinito) RECURSOS.forEach(function (r) { if (c[r]) n = Math.min(n, Math.floor(cantidad(r) / c[r])); });
    return Math.max(0, n);
  }
  function entrenar(tipo, cuantas) {
    if (!puedeEntrenarTipo(tipo)) { consejoTemporal(avisoEdificioTropa(tipo)); sonar('error'); return; }
    if (tropasOcupadas() >= capacidad()) { consejoTemporal(T('sin_espacio')); sonar('error'); return; }
    var n = cuantas === 'max' ? maxEntrenar(tipo) : Math.max(1, cuantas || 1);
    var hechas = 0;
    for (var k = 0; k < n; k++) {
      if (tropasOcupadas() >= capacidad()) break;
      if (!(hechas ? puedePagar(costoTropa(tipo)) : true)) break;
      if (!pagar(costoTropa(tipo))) break;
      colaEntreno.push({ tipo: tipo, t: 0, total: TROPAS[tipo].tiempo });
      hechas++;
    }
    if (!hechas) return;
    sumarLogro('tropas', hechas);
    if (hechas > 1) consejoTemporal(T('entrenando_n', { n: hechas }));
    sonar('click');
    actualizarHUD();
    if (panelActual && panelActual.tipo === 'tropas') { vistaTropa.n = 1; abrirPanelTropas(); } else actualizarPanel();
  }
  function costoArmadura(n) { return { oro: ARMADURA.costo[n], piedra: ARMADURA.piedra[n] }; }
  function mejorarArmadura(tipo, conGemas) {
    var n = nivelArmadura(tipo);
    if (n >= ARMADURA.max) return;
    if (!(conGemas ? pagar(0, ARMADURA.gemas[n]) : pagar(costoArmadura(n)))) return;
    estado.armadura[tipo] = n + 1;
    vistaTropa.rango = null;
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
    sacarTropas();
    camSigue = true;
    cam.meta.copy(puntoCamino(largoCamino * 0.5).p); cam.vel.set(0, 0, 0);
    cam.distMeta = Math.min(cam.distMeta, window.innerWidth < window.innerHeight ? 42 : 32);
    $('btn-oleada').classList.add('oculto');
    avisoGrande(T('aviso_oleada', { n: n }));
    sonar('cuerno');
    cerrarPanel();
    actualizarHUD();
  }
  function oleadaTerminada() {
    oleadaActiva = false;
    informarBajasRefuerzos();
    setTimeout(ponerEquipo, 1500);
    camSigue = false;
    cam.meta.copy(CENTRO_REINO); cam.vel.set(0, 0, 0); cam.distMeta = distInicial();
    var n = oleadaActual; sumarXP(15 + 5 * n);
    var ultima = n === OLEADAS.length && !estado.infinito;
    var g = GEMAS_POR_OLEADA + (ultima ? GEMAS_VICTORIA : 0);
    sumarGemas(g, castilloPos.clone().setY(10));
    sonar('gemas');
    premioHeroesOleada(n);
    nuevoCorreo('informes', L('Informe de batalla: oleada ' + n + ' superada', 'Battle report: wave ' + n + ' won'), L('Defensa del reino', 'Kingdom defense'), htmlInforme([[L('Resultado', 'Result'), '🏆 ' + L('Victoria', 'Victory')], [L('Oleada', 'Wave'), n], [L('Gemas', 'Gems'), '💎 ' + g], [L('Vida del castillo', 'Castle health'), Math.ceil(estado.vidaCastillo) + ' / ' + vidaMaxCastillo()]]));
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
    informarBajasRefuerzos();
    colaSpawn = [];
    sonar('derrota');
    nuevoCorreo('informes', L('Informe de batalla: oleada ' + oleadaActual + ' perdida', 'Battle report: wave ' + oleadaActual + ' lost'), L('Defensa del reino', 'Kingdom defense'), htmlInforme([[L('Resultado', 'Result'), '💔 ' + L('Derrota', 'Defeat')], [L('Oleada', 'Wave'), oleadaActual]]));
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
        s.obra.t += dt * velObras() / velReal();
        M.ponerVida(s.barra, s.obra.t / s.obra.total);
        if (Math.random() < dt * 3) chispas(s.pos.clone().setY(2 + Math.random()), 0xc9a66a, 1, 1.5);
        if (s.obra.t >= s.obra.total) terminarObra(s);
      }
      if (s.rebote < 1 && s.modelo) {
        s.rebote = Math.min(1, s.rebote + dt * 2.2);
        var k = s.rebote, c1 = 1.70158, c3 = c1 + 1;
        var e = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
        s.modelo.scale.setScalar(Math.max(0.05, e) * ESCALA_EDIFICIO * ESCALA_TRAMO[tramoNivel(s.edificio ? s.edificio.nivel : 1)]);
      }
      if (!s.edificio) return;
      var ed = s.edificio, d = EDIFICIOS[ed.tipo];
      // granja: produce monedas
      if (d.recurso) {
        s.guardado = Math.min(capacidadCampo(s), (s.guardado || 0) + ritmoCampo(s) * dt);
        if (s.modelo.userData.aspas) s.modelo.userData.aspas.rotation.z += dt * 1.8;
        if (s.modelo.userData.sierra) s.modelo.userData.sierra.rotation.y += dt * 9;
        if (s.modelo.userData.rueda) s.modelo.userData.rueda.rotation.x -= dt * 1.4;
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
      obraMuralla.t += dt * velObras() / velReal();
      M.ponerVida(murallaBarra, obraMuralla.t / obraMuralla.total);
      if (Math.random() < dt * 6) { var ta = Math.random() * Math.PI * 2, fz = formaMuralla(); chispas(new V3(fz.cx + Math.cos(ta) * fz.rx, 1.5, fz.cz + Math.sin(ta) * fz.rz), 0xc9a66a, 1, 1.5); }
      if (obraMuralla.t >= obraMuralla.total) terminarMuralla();
    }
    if (murallaModelo) {
      if (murallaRebote < 1) { murallaRebote = Math.min(1, murallaRebote + dt * 2); murallaModelo.scale.y = Math.max(0.05, 1 - Math.pow(1 - murallaRebote, 3) + Math.sin(murallaRebote * Math.PI) * 0.15); }
      if (murallaModelo.userData.banderas) murallaModelo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });
    }
    if (murallaBarra) murallaBarra.quaternion.copy(camara.quaternion);
    // ---- mejora del castillo ----
    if (estado.obraCastillo) {
      estado.obraCastillo.t += dt * velObras() / velReal();
      if (barraCastillo) { M.ponerVida(barraCastillo, estado.obraCastillo.t / estado.obraCastillo.total); barraCastillo.quaternion.copy(camara.quaternion); }
      if (Math.random() < dt * 4) chispas(new V3((Math.random() - 0.5) * 8, 3 + Math.random() * 4, (Math.random() - 0.5) * 8), 0xc9a66a, 1, 1.5);
      if (estado.obraCastillo.t >= estado.obraCastillo.total) terminarCastillo();
    }
    // ---- torres de la puerta de la muralla ----
    torresPuerta.forEach(function (tp) {
      tp.cd -= dt;
      var arq = tp.modelo.userData.arquero;
      var ob = masCercano(enemigos, tp.pos, TORRES_PUERTA.alcance);
      if (tp.modelo.userData.banderas) tp.modelo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });
      if (ob) {
        arq.grupo.rotation.y = Math.atan2(ob.pos.x - tp.pos.x, ob.pos.z - tp.pos.z) - tp.grupo.rotation.y;
        if (tp.cd <= 0) {
          tp.cd = TORRES_PUERTA.ritmo; arq.ataque = 1;
          disparar(tp.pos.clone().setY(tp.modelo.userData.alturaDisparo * 1.15), ob, (TORRES_PUERTA.dano + estado.muralla * TORRES_PUERTA.danoNivel) * (1 + bono('flechas')));
        }
      }
      arq.ataque = Math.max(0, (arq.ataque || 0) - dt * 3);
      M.animarUnidad(arq, tiempo, false, arq.ataque);
    });
    // ---- castillo dispara ----
    castilloCd -= dt;
    if (castilloCd <= 0) {
      var oc = masCercano(enemigos, castilloPos, CASTILLO.alcance);
      if (oc) {
        castilloCd = CASTILLO.ritmo;
        var esquinas = [[-3.4, -3.4], [-3.4, 3.4], [3.4, -3.4], [3.4, 3.4]];
        var es = esquinas.reduce(function (a, q) { return Math.hypot(q[0] - oc.pos.x, q[1] - oc.pos.z) < Math.hypot(a[0] - oc.pos.x, a[1] - oc.pos.z) ? q : a; });
        disparar(new V3(es[0], 4.4, es[1]), oc, danoCastillo());
      }
    }

    // ---- entrenamiento ----
    if (colaEntreno.length && (cuartelesListos().length || edificiosDe('establo').length || edificiosDe('galeria').length)) {
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
      if (u.dentro) {
        if (oleadaActiva && u.salida !== undefined) {
          u.salida -= dt;
          if (u.salida <= 0) {
            u.dentro = false; u.salida = undefined;
            u.casa = u.heroeId ? puertaCastillo() : casaTropa(); u.pos.copy(u.casa);
            u.m.grupo.visible = true;
            bocanada(u.pos.clone().setY(0.2), true);
          }
        }
        return;
      }
      if (!oleadaActiva && !enemigos.length && !u.volviendo) u.volviendo = true;
      if (u.heroeId && oleadaActiva && enemigos.length && !u.volviendo) {
        u.cdHab = (u.cdHab === undefined ? 3 : u.cdHab) - dt;
        if (u.cdHab <= 0 && usarHabilidad(u)) u.cdHab = recargaHab(u.heroeId);
      }
      if (u.volviendo) {
        u.barra.visible = false;
        var llego = moverHacia(u, u.casa.x, u.casa.z, velU(u) * 1.3, dt) || Math.hypot(u.pos.x - u.casa.x, u.pos.z - u.casa.z) < 1.2;
        M.animarUnidad(u.m, tiempo + u.radio * 10, !llego, 0);
        if (llego) guardarDentro(u);
        return;
      }
      u.cd -= dt;
      u.ataque = Math.max(0, u.ataque - dt * 3);
      if (d.cura && u.vida < u.max) { u.vida = Math.min(u.max, u.vida + d.cura * dt); M.ponerVida(u.barra, u.vida / u.max); }
      var obj;
      if (d.distancia) {
        obj = masCercano(enemigos, u.pos, d.alcance);
        if (obj) {
          encararHacia(u, obj.pos.x, obj.pos.z, dt);
          if (u.cd <= 0) { u.cd = d.ritmo; u.ataque = 1; disparar(u.pos.clone().setY(1.0), obj, d.dano * (hambre ? COMIDA_TROPA.debilidad : 1) * (1 + bono('espadas') + bonoTropa(u.tipo, 'ataque')) * furia(u) * factorArmas(u.tipo), Math.random() < 0.5); }
        } else {
          // los héroes de distancia avanzan hacia los enemigos que se acercan a su puesto
          var lejos = u.heroeId ? masCercano(enemigos.filter(function (e) { return e.pos.distanceTo(u.puesto) < 17; }), u.pos, 99) : null;
          caminando = lejos ? !moverHacia(u, lejos.pos.x, lejos.pos.z, velU(u), dt) : !moverHacia(u, u.puesto.x, u.puesto.z, velU(u), dt);
        }
      } else {
        var correa = u.tipo === 'heroe' ? 13 : 9.5;
        obj = masCercano(enemigos.filter(function (e) { return e.pos.distanceTo(u.puesto) < correa; }), u.pos, 99);
        if (obj) {
          var dist = u.pos.distanceTo(obj.pos) - obj.radio - u.radio;
          if (dist > d.alcance - 0.3) caminando = !moverHacia(u, obj.pos.x, obj.pos.z, velU(u), dt);
          else {
            encararHacia(u, obj.pos.x, obj.pos.z, dt);
            if (u.cd <= 0) { u.cd = d.ritmo; u.ataque = 1; danar(obj, d.dano * (hambre ? COMIDA_TROPA.debilidad : 1) * (1 + bono('espadas') + bonoTropa(u.tipo, 'ataque')) * furia(u) * factorArmas(u.tipo), u); sonar('golpe'); }
          }
        } else caminando = !moverHacia(u, u.puesto.x, u.puesto.z, velU(u), dt);
        if (!obj && !caminando) encararHacia(u, u.pos.x + dirFrente.x, u.pos.z + dirFrente.z, dt);
      }
      M.animarUnidad(u.m, tiempo + u.radio * 10, caminando, u.ataque);
      if (caminando && Math.random() < dt * 2.5) bocanada(u.pos.clone().setY(0.15), true);
    });

    // ---- enemigos ----
    var afuera = tropasFuera();
    enemigos.slice().forEach(function (e) {
      var d = e.d, caminando = false, bb = null;
      if (e.aturdido > 0) { e.aturdido -= dt; if (Math.random() < dt * 5) chispas(e.pos.clone().setY(e.altoBarra + 0.2), 0xffe14a, 1, 0.8); return; }
      e.cd -= dt;
      e.ataque = Math.max(0, e.ataque - dt * 2.5);
      var victima = masCercano(afuera, e.pos, d.alcance + e.radio + 0.5);
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
      if (caminando && Math.random() < dt * 1.5) bocanada(e.pos.clone().setY(0.15), true);
    });

    // ---- separar unidades para que no se encimen ----
    var todos = tropasFuera().concat(enemigos);
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

    // ---- humo de chimeneas ----
    slots.forEach(function (s) {
      if (!s.edificio || !s.modelo || !s.modelo.userData.chimenea) return;
      s.cdHumo = (s.cdHumo || Math.random()) - dt;
      if (s.cdHumo <= 0) { s.cdHumo = 0.7 + Math.random() * 0.5; bocanada(s.modelo.localToWorld(s.modelo.userData.chimenea.clone())); }
    });
    moverBocanadas(dt);
    // ---- anillo de selección ----
    if (unidadSel && (unidadSel.vida <= 0 || !panelActual || panelActual.tipo !== 'unidad')) unidadSel = null;
    anilloSel.visible = !!unidadSel;
    if (unidadSel) { anilloSel.position.set(unidadSel.pos.x, 0.06, unidadSel.pos.z); anilloSel.scale.setScalar(unidadSel.m.escala * (1 + Math.sin(tiempo * 6) * 0.06)); }
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
    // zoom y desplazamiento se deslizan (sin saltos); al soltar el dedo sigue un poco por inercia
    var kz = 1 - Math.exp(-dt * 7), kp = 1 - Math.exp(-dt * 11);
    cam.dist += (cam.distMeta - cam.dist) * kz;
    if (camSigue && oleadaActiva && enemigos.length && !arrastre) {
      var delante = enemigos.reduce(function (a, e) { return e.dist > a.dist ? e : a; });
      cam.meta.lerp(delante.pos, Math.min(1, dt * 0.9));
    }
    if (!arrastre) {
      cam.meta.addScaledVector(cam.vel, dt);
      cam.vel.multiplyScalar(Math.exp(-dt * 4.5));
    }
    // la cámara no se puede ir lejos del reino
    cam.meta.x = Math.max(CENTRO_REINO.x - LIMITE_CAM, Math.min(CENTRO_REINO.x + LIMITE_CAM, cam.meta.x));
    cam.meta.z = Math.max(CENTRO_REINO.z - LIMITE_CAM, Math.min(CENTRO_REINO.z + LIMITE_CAM, cam.meta.z));
    cam.objetivo.lerp(cam.meta, kp);
    // de cerca la cámara baja (más cinematográfica); de lejos sube para ver el reino entero
    var u = Math.max(0, Math.min(1, (cam.dist - 16) / Math.max(40, distEncuadre() - 16)));
    cam.polar = 1.17 - u * 0.37;
    // la niebla se aleja con la cámara: nunca tapa el reino y el terreno llega hasta el horizonte
    escena.fog.near = cam.dist * 1.15; escena.fog.far = cam.dist * 2.6 + 80;
    var o = cam.objetivo, s = Math.sin(cam.polar);
    camara.position.set(o.x + cam.dist * s * Math.cos(cam.az), o.y + cam.dist * Math.cos(cam.polar), o.z + cam.dist * s * Math.sin(cam.az));
    camara.lookAt(o.x, o.y + (1 - u) * 1.2, o.z);
    // la caja de sombras sigue a la cámara y crece con el zoom
    var ts = Math.max(28, Math.min(88, cam.dist * 0.8));
    if (Math.abs(ts - tamSombra) > 2) { tamSombra = ts; sc.left = -ts; sc.right = ts; sc.top = ts; sc.bottom = -ts; sc.updateProjectionMatrix(); }
    sol.position.set(o.x + DIR_SOL.x, DIR_SOL.y, o.z + DIR_SOL.z);
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
    if (oleadaActiva && ids.length === 1) camSigue = false;
    if (ids.length === 1) { arrastre = { x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, t: performance.now(), movio: false }; cam.vel.set(0, 0, 0); }
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
      cam.distMeta = Math.max(16, Math.min(distMaxima(), pellizco.dist * pellizco.d / Math.max(20, d)));
      camSigue = false;
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
    var antes = cam.meta.clone();
    cam.meta.addScaledVector(derecha, -dx * k).addScaledVector(adelante, dy * k * 1.3);
    // velocidad del arrastre (para la inercia al soltar)
    var ahora = performance.now(), dtm = Math.max(8, ahora - (arrastre.tm || ahora - 16)) / 1000;
    arrastre.tm = ahora;
    cam.vel.copy(cam.meta).sub(antes).divideScalar(dtm).clampLength(0, 60);
  });
  function soltar(ev) {
    var era = punteros[ev.pointerId];
    delete punteros[ev.pointerId];
    if (Object.keys(punteros).length < 2) pellizco = null;
    if (arrastre && era && !arrastre.movio && performance.now() - arrastre.t < 600) tocar(ev.clientX, ev.clientY);
    // si el dedo se quedó quieto antes de soltar, no hay inercia
    if (arrastre && arrastre.tm && performance.now() - arrastre.tm > 90) cam.vel.set(0, 0, 0);
    if (!Object.keys(punteros).length) arrastre = null;
  }
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', function (ev) { delete punteros[ev.pointerId]; arrastre = null; pellizco = null; });
  lienzo.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    cam.distMeta = Math.max(16, Math.min(distMaxima(), cam.distMeta * (ev.deltaY > 0 ? 1.1 : 0.9)));
    camSigue = false;
  }, { passive: false });
  window.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { if (enMundo) cerrarMundo(); else if (modoColocar) salirModoColocar(); else { cerrarMenuEdif(); cerrarPanel(); } }
  });

  var rayo = new THREE.Raycaster(), mouse = new THREE.Vector2();
  function tocar(x, y) {
    if (enMenu) return;
    mouse.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    rayo.setFromCamera(mouse, camara);
    // primero miramos si tocó una tropa o un enemigo (se ven más arriba que el suelo)
    if (!modoColocar) {
      var gente = tropasFuera().concat(enemigos);
      var hitsG = rayo.intersectObjects(gente.map(function (u) { return u.m.grupo; }), true);
      if (hitsG.length) {
        var og = hitsG[0].object;
        while (og && !gente.some(function (u) { return u.m.grupo === og; })) og = og.parent;
        var quien = og && gente.filter(function (u) { return u.m.grupo === og; })[0];
        if (quien) { sonar('click'); abrirPanelUnidad(quien); return; }
      }
    }
    var hits = rayo.intersectObjects(slots.map(function (s) { return s.grupo; }).concat(barricadas.map(function (b) { return b.grupo; })).concat(murallaModelo ? [castillo, murallaModelo] : [castillo]).concat(torresPuerta.map(function (tp) { return tp.grupo; })), true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object;
      while (o && o.userData.slot === undefined && !o.userData.castillo && o.userData.barricada === undefined) o = o.parent;
      if (!o) continue;
      if (o.userData.barricada !== undefined) { tocarBarricada(o.userData.barricada); return; }
      if (o.userData.castillo) { if (modoColocar) continue; sonar('click'); enfocar(castillo.position); abrirMenuEdif('castillo'); return; }
      tocarSlot(o.userData.slot);
      return;
    }
    // tocar el suelo: si estás colocando, te recordamos qué hacer (no se cancela solo)
    if (modoColocar) { consejoTemporal(modoColocar === 'barricada' ? T('colocando_barr') : T('colocando', { n: N(modoColocar) })); sonar('error'); return; }
    cerrarMenuEdif();
    cerrarPanel();
  }
  // ---- nombre del edificio al pasar el mouse por encima (solo con mouse, no en el teléfono) ----
  var etiquetaHover = document.createElement('div');
  etiquetaHover.id = 'etiqueta-hover'; etiquetaHover.className = 'oculto';
  document.body.appendChild(etiquetaHover);
  var hoverUltimo = 0;
  function nombreBajoMouse(x, y) {
    mouse.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    rayo.setFromCamera(mouse, camara);
    var lista = slots.map(function (s) { return s.grupo; }).concat(barricadas.map(function (b) { return b.grupo; })).concat([castillo]).concat(torresPuerta.map(function (tp) { return tp.grupo; }));
    if (murallaModelo) lista.push(murallaModelo);
    var hits = rayo.intersectObjects(lista, true);
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i].object;
      while (o) {
        if (o === murallaModelo) return N('muralla') + ' — ' + T('nivel_corto') + ' ' + estado.muralla;
        if (o === castillo) return '🏰 ' + T('castillo') + ' — ' + T('nivel_corto') + ' ' + (estado.castillo || 1);
        if (o.userData.castillo) return N('torre') + ' — ' + T('castillo');
        if (o.userData.barricada !== undefined) { var bb = barricadas[o.userData.barricada]; return bb && bb.nivel ? N('barricada') + ' — ' + T('nivel_corto') + ' ' + bb.nivel : null; }
        if (o.userData.slot !== undefined) {
          var s = slots[o.userData.slot];
          if (s.edificio) return N(s.edificio.tipo) + ' — ' + T('nivel_corto') + ' ' + s.edificio.nivel;
          if (s.obra) return N(s.obra.tipo) + ' — ' + T('construyendo');
          return null;
        }
        o = o.parent;
      }
    }
    return null;
  }
  lienzo.addEventListener('pointermove', function (ev) {
    if (ev.pointerType !== 'mouse') return;
    var ahora = performance.now();
    if (ev.buttons || enMenu || modoColocar || ahora - hoverUltimo < 60) { if (ev.buttons || enMenu) etiquetaHover.classList.add('oculto'); return; }
    hoverUltimo = ahora;
    var n = nombreBajoMouse(ev.clientX, ev.clientY);
    if (!n) { etiquetaHover.classList.add('oculto'); lienzo.style.cursor = ''; return; }
    etiquetaHover.textContent = n;
    etiquetaHover.style.left = Math.min(window.innerWidth - etiquetaHover.offsetWidth - 8, ev.clientX + 16) + 'px';
    etiquetaHover.style.top = (ev.clientY + 18) + 'px';
    etiquetaHover.classList.remove('oculto');
    lienzo.style.cursor = 'pointer';
  });
  lienzo.addEventListener('pointerleave', function () { etiquetaHover.classList.add('oculto'); lienzo.style.cursor = ''; });
  // ------------------------------------------------------------------
  //  MENÚ RÁPIDO: al tocar un edificio salen botones debajo de él
  // ------------------------------------------------------------------
  var menuEdif = { el: null, slot: null, castillo: false, html: '' };
  (function () {
    var d = document.createElement('div'); d.id = 'menu-edif'; d.className = 'oculto';
    document.body.appendChild(d); menuEdif.el = d;
    d.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-mb]');
      if (!b || b.disabled) return;
      ev.stopPropagation();
      accionMenuEdif(b.getAttribute('data-mb'));
    });
  })();
  function menuAbierto() { return !menuEdif.el.classList.contains('oculto'); }
  var camVuelta = null;
  function actualizarCiudadNombre() {
    var e = $('ciudad-nombre'); if (!e) return;
    var c = celdaDe(miLugar().x, miLugar().y), n = hayCuenta() ? Cuentas.nombrePublico() : L('Mi reino', 'My kingdom');
    var t = '<span class="cn-ico">🏰</span><span class="cn-txt"><b>' + escaparHTML(hayCuenta() ? L('Reino de ', '') + n + (estado.idioma === 'en' ? "'s kingdom" : '') : n) + '</b><small>(' + c.x + ', ' + c.y + ')</small></span>';
    if (e.dataset.h !== t) { e.innerHTML = t; e.dataset.h = t; }
  }
  function enfocar(p) {
    if (oleadaActiva || enMundo || !p) return;
    if (!camVuelta) camVuelta = { meta: cam.meta.clone(), dist: cam.distMeta };
    // el edificio queda arriba del centro: abajo va el menú o el panel
    cam.meta.set(p.x, 0, p.z); cam.vel.set(0, 0, 0);
    cam.distMeta = Math.min(camVuelta.dist, window.innerWidth < window.innerHeight ? 70 : 55);
  }
  function volverCamara() {
    setTimeout(function () {
      if (!camVuelta || panelActual || menuAbierto() || oleadaActiva || enMundo) return;
      cam.meta.copy(camVuelta.meta); cam.distMeta = camVuelta.dist; cam.vel.set(0, 0, 0); camVuelta = null;
    }, 60);
  }
  function cerrarMenuEdif() { menuEdif.el.classList.add('oculto'); menuEdif.slot = null; menuEdif.castillo = false; menuEdif.html = ''; volverCamara(); }
  function abrirMenuEdif(i) {
    cerrarPanel();
    menuEdif.castillo = i === 'castillo'; menuEdif.slot = menuEdif.castillo ? null : i; menuEdif.html = '';
    pintarMenuEdif();
    menuEdif.el.classList.remove('oculto');
    actualizarRelojes();
  }
  // lo que se está haciendo ahora en ese edificio (obra, entrenamiento o investigación)
  function progresoMenu() {
    if (menuEdif.castillo) { var oc = estado.obraCastillo; return oc ? { que: 'castillo', gemas: gemasParaTerminar((oc.total - oc.t) / velObras()) } : null; }
    var s = slots[menuEdif.slot];
    if (!s) return null;
    if (s.obra) return { que: 'obra:' + s.i, gemas: gemasParaTerminar((s.obra.total - s.obra.t) / velObras()) };
    if (s.edificio && s.edificio.tipo === 'cuartel' && colaEntreno.length) return { que: 'entreno', gemas: 0, sinGemas: true };
    if (s.edificio && s.edificio.tipo === 'academia' && estado.investigando) return { que: 'invest', gemas: gemasParaTerminar(faltaInvestigacion() * velReal()) };
    return null;
  }
  function botonMenu2(accion, icono, texto, apagado, extra) {
    return '<button class="mb" data-mb="' + accion + '"' + (apagado ? ' disabled' : '') + '><span class="mb-ico">' + icono + '</span>' + (extra || '') + '<span class="mb-txt">' + texto + '</span></button>';
  }
  function pintarMenuEdif() {
    var s = menuEdif.castillo ? null : slots[menuEdif.slot];
    if (!menuEdif.castillo && (!s || (!s.edificio && !s.obra))) { cerrarMenuEdif(); return; }
    var tipo = s ? (s.edificio ? s.edificio.tipo : s.obra.tipo) : null;
    var nivel = s ? (s.edificio ? s.edificio.nivel : Math.max(1, s.obra.nivel - 1)) : (estado.castillo || 1);
    var nombre = s ? N(tipo) : T('castillo');
    var pr = progresoMenu(), acel = totalAceleradores();
    var rec = s && s.edificio && esCampo(s.edificio.tipo) ? Math.floor(s.guardado || 0) : -1;
    var h = '<div class="me-titulo"><span class="me-nivel">' + nivel + '</span>' + nombre + '</div><div class="me-botones">' +
      (rec >= 0 ? botonMenu2('recolectar', ICONO_RECURSO[EDIFICIOS[s.edificio.tipo].recurso], T('mb_recolectar'), rec < 1, '<span class="mb-gema">+' + corto(rec) + '</span>') : '') +
      botonMenu2('detalles', '📜', T('mb_detalles')) +
      botonMenu2('terminar', '⚡', T('mb_terminar'), !pr || pr.sinGemas, pr && !pr.sinGemas ? '<span class="mb-gema"><span class="ico gema"></span>' + pr.gemas + '</span>' : '') +
      botonMenu2('acelerar', '⏩', T('mb_acelerar'), !pr, '<span class="mb-gema">×' + acel + '</span>');
    if (tipo === 'cuartel' || tipo === 'establo' || tipo === 'galeria') h += botonMenu2('entrenar', '⚔️', T('entrenar'));
    if (tipo === 'mercado') h += botonMenu2('comerciar', '⚖️', T('mb_comerciar'));
    if (tipo === 'vigia') h += botonMenu2('vigilar', '👁️', T('mb_vigilar'));
    if (tipo === 'herreria') h += botonMenu2('forjar', '⚒️', T('mb_forjar'));
    if (tipo === 'academia') h += botonMenu2('investigar', '📚', T('mb_investigar'));
    if (s) h += botonMenu2('demoler', '🧨', T('mb_demoler'), oleadaActiva);
    h += '</div>';
    if (menuEdif.html !== h) { menuEdif.el.innerHTML = h; menuEdif.html = h; }
  }
  function accionMenuEdif(a) {
    var i = menuEdif.slot, esCastillo = menuEdif.castillo;
    sonar('click');
    if (a === 'detalles') { pestCuartel = 'detalles'; cerrarMenuEdif(); if (esCastillo) abrirPanelCastillo(); else abrirPanelEdificio(i); return; }
    if (a === 'recolectar') { recolectarCampo(slots[i]); pintarMenuEdif(); return; }
    if (a === 'demoler') {
      var sd = slots[i], ed = sd.edificio || sd.obra, nv = sd.edificio ? sd.edificio.nivel : Math.max(1, sd.obra.nivel - 1);
      cerrarMenuEdif();
      confirmarJuego('🧨 ' + T('demoler_titulo', { n: N(ed.tipo) }), T('demoler_txt', { v: nv }), T('demoler_si'), function () { demoler(i); });
      return;
    }
    if (a === 'entrenar') {
      var te = slots[i] && slots[i].edificio && slots[i].edificio.tipo;
      if (te === 'establo') { vistaTropa.pest = 'establo'; vistaTropa.tipo = 'caballeria'; } else if (te === 'galeria') { vistaTropa.pest = 'tiro'; vistaTropa.tipo = 'arquero'; } else if (te === 'cuartel' && vistaTropa.pest !== 'cuartel') { vistaTropa.pest = 'cuartel'; vistaTropa.tipo = 'espadachin'; }
      vistaTropa.rango = null; cerrarMenuEdif(); if (te === 'cuartel' || te === 'establo' || te === 'galeria') { pestCuartel = 'entrenar'; panelActual = { tipo: 'edificio', slot: i }; abrirPanelEdificio(i); } else abrirPanelTropas(); return;
    }
    if (a === 'comerciar') { cerrarMenuEdif(); abrirPanelMercado(); return; }
    if (a === 'vigilar') { cerrarMenuEdif(); abrirPanelVigia(); return; }
    if (a === 'forjar') { cerrarMenuEdif(); abrirPanelHerreria(); return; }
    if (a === 'investigar') { cerrarMenuEdif(); abrirPanelInvestigacion(ramaInv); return; }
    var pr = progresoMenu();
    if (!pr) return;
    if (a === 'terminar') { terminarConGemas(pr.que); pintarMenuEdif(); return; }
    if (a === 'acelerar') { abrirAcelerar(pr.que); return; }
  }
  function posicionarMenuEdif() {
    if (!menuAbierto()) return;
    if (enMenu || enMundo || panelActual) { cerrarMenuEdif(); return; }
    var p = menuEdif.castillo ? castillo.position.clone() : (slots[menuEdif.slot] && slots[menuEdif.slot].pos.clone());
    if (!p) { cerrarMenuEdif(); return; }
    vRel.copy(p).project(camara);
    if (vRel.z > 1) { menuEdif.el.style.visibility = 'hidden'; return; }
    menuEdif.el.style.visibility = '';
    var x = (vRel.x + 1) / 2 * window.innerWidth, y = (1 - vRel.y) / 2 * window.innerHeight;
    var w = menuEdif.el.offsetWidth, hh = menuEdif.el.offsetHeight;
    menuEdif.el.style.left = Math.max(6, Math.min(window.innerWidth - w - 6, x - w / 2)) + 'px';
    menuEdif.el.style.top = Math.max(60, Math.min(window.innerHeight - hh - 90, y - hh * 0.35)) + 'px';
    if ((Math.floor(performance.now() / 500) % 2) === 0) pintarMenuEdif();
  }

  function tocarSlot(i) {
    var s = slots[i];
    sonar('click');
    if (cerrada(s)) { cerrarMenuEdif(); consejoTemporal(T('parcela_cerrada', { n: nivelParaParcela(s) })); return; }
    if (modoColocar === 'barricada') { consejoTemporal(T('colocando_barr')); sonar('error'); return; }
    if (modoColocar) {
      if (!s.edificio && !s.obra && s.campo !== esCampo(modoColocar)) { consejoTemporal(T(s.campo ? 'solo_ciudad' : 'solo_campo')); sonar('error'); return; }
      if (!s.edificio && !s.obra) construir(i, modoColocar);
      else { consejoTemporal(T('ocupado')); sonar('error'); }
      return;
    }
    enfocar(s.pos);
    if (s.edificio || s.obra) abrirMenuEdif(i);
    else { cerrarMenuEdif(); abrirPanelConstruir(i); }
  }

  // ------------------------------------------------------------------
  //  MODO COLOCAR
  // ------------------------------------------------------------------
  var modoColocar = null, slotElegido = null;
  function entrarModoColocar(tipo) {
    if (!slots.some(function (s) { return !s.edificio && !s.obra && s.campo === esCampo(tipo) && !cerrada(s); })) { consejoTemporal(T(esCampo(tipo) ? 'sin_campo' : 'sin_terreno')); sonar('error'); return; }
    var falta = faltante(costoEdif(tipo, 0));
    if (falta) { avisarFalta(falta); return; }
    salirModoColocar();
    modoColocar = tipo;
    cerrarPanel();
    $('btn-construir').classList.add('activo');
    // vista previa transparente del edificio en cada terreno libre
    slots.forEach(function (s) {
      if (s.edificio || s.obra || s.campo !== esCampo(tipo) || cerrada(s)) return;
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
      ['espadachin', 'arquero', 'guardian', 'heroe', 'caballeria', 'explorador', 'miliciano', 'jinete', 'caballeria_pesada', 'balista', 'ariete', 'catapulta', 'torre_asedio'].forEach(function (t) {
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
      ['aserradero', 'mina', 'cantera', 'academia', 'almacen', 'mercado', 'herreria', 'establo', 'galeria', 'vigia'].forEach(function (t) { var m = crearModelo(t, 1); m.rotation.y = 0.5; retratos[t] = foto(m, 5.5, 0.9); });
      HEROES.forEach(function (h) { var hu = M.heroe(h, 1); hu.grupo.rotation.y = 0.35; retratos['h_' + h.id] = foto(hu.grupo, 1.55 * hu.escala, (hu.cabezaY - 0.12) * hu.escala); });
      [1, 2, 3].forEach(function (n) { var cm = M.castillo(n); cm.rotation.y = 0.6; retratos['mapa_castillo' + n] = foto(cm, 24, 3.2); });
      retratos.mapa_campamento = (function () {
        var gc = new THREE.Group();
        var tela = new THREE.MeshToonMaterial({ color: 0x8a5a33 }), tela2 = new THREE.MeshToonMaterial({ color: 0x6b8a2a });
        var t1 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.9, 6), tela); t1.position.set(-0.6, 0.95, 0); gc.add(t1);
        var t2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 6), tela2); t2.position.set(1.0, 0.7, -0.4); gc.add(t2);
        var fuego = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 5), new THREE.MeshBasicMaterial({ color: 0xff9a2a })); fuego.position.set(0.4, 0.25, 1.0); gc.add(fuego);
        var tg = M.unidad('trasgo'); tg.grupo.position.set(1.2, 0, 0.9); tg.grupo.rotation.y = 0.4; gc.add(tg.grupo);
        return foto(gc, 7, 0.9);
      })();
      retratos.barricada = (function () { var m = M.barricada(1); m.rotation.y = 0.6; return foto(m, 6, 0.6); })();
      retratos.enfermeria = (function () { var m = M.enfermeria(1); m.rotation.y = 0.5; return foto(m, 5.5, 1.0); })();
      retratos.muralla = (function () { var m = M.muralla(3); return foto(m, 20, 1.5); })();
      r.dispose();
      if (r.forceContextLoss) r.forceContextLoss();
    } catch (err) { /* si falla, se usan emojis */ }
  })();
  function retratoHeroe(id) {
    try {
      var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setSize(128, 128);
      var e = new THREE.Scene();
      e.add(new THREE.HemisphereLight(0xffffff, 0x8a9a7a, 0.6));
      var l = new THREE.DirectionalLight(0xffffff, 0.55); l.position.set(3, 5, 4); e.add(l);
      var c = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      var hu = M.heroe(HEROE[id], 1); hu.grupo.rotation.y = 0.35;
      M.animarUnidad(hu, 0, false, 0);
      e.add(hu.grupo);
      var dist = 1.55 * hu.escala, alto = (hu.cabezaY - 0.12) * hu.escala;
      c.position.set(dist * 0.55, alto + dist * 0.35, dist); c.lookAt(0, alto, 0);
      r.render(e, c);
      retratos['h_' + id] = r.domElement.toDataURL();
      r.dispose(); if (r.forceContextLoss) r.forceContextLoss();
    } catch (err) {}
  }
  function cargarModelosHeroes() { M.cargarHeroesGLB(Object.keys(estado.heroes || {}), alLlegarModelo); M.cargarFiguras(alLlegarFigura); }
  // cuando llega una figura de archivo, las tropas de ese tipo se cambian por la nueva
  function alLlegarFigura(id) {
    Object.keys(M.FIGURA_TROPA).forEach(function (tipo) {
      if (M.FIGURA_TROPA[tipo] !== id) return;
      tropas.forEach(function (u) {
        if (u.tipo !== tipo || u.heroeId) return;
        var viejo = u.m, nuevo = M.unidad(tipo, undefined, nivelArmadura(tipo));
        nuevo.grupo.position.copy(viejo.grupo.position); nuevo.grupo.rotation.copy(viejo.grupo.rotation); nuevo.grupo.visible = viejo.grupo.visible;
        escena.remove(viejo.grupo); escena.add(nuevo.grupo); u.m = nuevo;
      });
    });
    if (id === 'caballo' || id === 'gallina') animales.forEach(function (o) { if (o.a.tipo === id) M.ponerFiguraAnimal(o.a); });
    if (id === 'carreta' || id === 'caballo') fotoCarreta();
    if ((id === 'carreta' || id === 'caballo') && M3 && M3.carros) { Object.keys(M3.carros).forEach(function (k) { M3.e.remove(M3.carros[k]); }); M3.carros = {}; }
  }
  function alLlegarModelo(id) {
    retratoHeroe(id);
    if (!oleadaActiva && estado.heroes && estado.equipo) ponerEquipo();
    if (panelActual && /heroe|tropas|invocar|reclutado/.test(panelActual.tipo)) reabrirPanel();
  }
  function fotoCarreta() {
    var fc = M.figura('carreta'), fh = M.figura('caballo'); if (!fc || !fh) return;
    try {
      var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(128, 128);
      var e = new THREE.Scene(); e.add(new THREE.HemisphereLight(0xffffff, 0x8a9a7a, 0.7)); var l = new THREE.DirectionalLight(0xffffff, 0.6); l.position.set(3, 5, 4); e.add(l);
      var g = new THREE.Group(); g.add(fc); fh.rotation.y = -Math.PI / 2; fh.position.set(-0.85, 0, 0); g.add(fh); g.rotation.y = Math.PI + 0.55; e.add(g);
      g.updateMatrixWorld(true); var bx = new THREE.Box3().setFromObject(g), cen = bx.getCenter(new THREE.Vector3()), tam = bx.getSize(new THREE.Vector3()).length();
      var c = new THREE.PerspectiveCamera(30, 1, 0.1, 100); c.position.set(cen.x + tam * 0.35, cen.y + tam * 0.55, cen.z + tam * 1.55); c.lookAt(cen);
      r.render(e, c); retratos.carreta = r.domElement.toDataURL(); r.dispose();
    } catch (er) { }
  }
  function iconoCarreta() { return retratos.carreta ? '<img class="ico-carreta" src="' + retratos.carreta + '" alt="">' : '🛒'; }
  function fotoHTML(clave, emoji) {
    return retratos[clave] ? '<img src="' + retratos[clave] + '" alt="">' : emoji;
  }

  // ------------------------------------------------------------------
  //  PANELES
  // ------------------------------------------------------------------
  var panelActual = null;
  function abrirPanel(titulo, html, cual) {
    if (menuEdif.el) cerrarMenuEdif();
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
    volverCamara();
  }
  function reabrirPanel() {
    if (!panelActual) return;
    var p = panelActual;
    if (p.tipo === 'construir') abrirPanelConstruir(p.slot);
    else if (p.tipo === 'tropas') abrirPanelTropas();
    else if (p.tipo === 'invocar') abrirPanelInvocar();
    else if (p.tipo === 'edificio') abrirPanelEdificio(p.slot);
    else if (p.tipo === 'construir-detalle' && tipoAConstruir) abrirDetalleConstruir(tipoAConstruir);
    else if (p.tipo === 'castillo') abrirPanelCastillo();
    else if (p.tipo === 'barricada') abrirPanelBarricada(p.i);
    else if (p.tipo === 'alianza') abrirPanelAlianza();
    else if (p.tipo === 'conquista') abrirPanelConquista();
    else if (p.tipo === 'investigacion') abrirPanelInvestigacion(p.rama);
    else if (p.tipo === 'mochila') abrirPanelMochila();
    else if (p.tipo === 'tienda') abrirPanelTienda();
    else if (p.tipo === 'ajustes') abrirPanelAjustes();
    else if (p.tipo === 'heroe') abrirPanelHeroe(p.id);
    else if (p.tipo === 'obtener') abrirPanelObtener(p.id);
    else if (p.tipo === 'mercado') abrirPanelMercado();
    else if (p.tipo === 'vigia') abrirPanelVigia();
    else if (p.tipo === 'herreria') abrirPanelHerreria();
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
  var NOMBRE_R = { oro: ['Oro', 'Gold'], comida: ['Comida', 'Food'], madera: ['Madera', 'Wood'], piedra: ['Piedra', 'Stone'] };
  function tablaRequisitos(costo, filas, seg) {
    var h = '<table class="req"><tr><th>' + L('Tipo', 'Type') + '</th><th>' + L('Pide', 'Required') + '</th><th>' + L('Tienes', 'You own') + '</th></tr>';
    (filas || []).forEach(function (f) { h += '<tr class="' + (f.ok ? 'si' : 'no') + '"><td>' + f.nombre + '</td><td>' + f.pide + '</td><td>' + (f.ok ? '✅ ' : '❌ ') + f.tiene + '</td></tr>'; });
    ['comida', 'madera', 'piedra', 'oro'].forEach(function (r) {
      if (!costo[r]) return;
      var ok = estado.oroInfinito || cantidad(r) >= costo[r];
      h += '<tr class="' + (ok ? 'si' : 'no') + '"><td>' + ICONO_RECURSO[r] + ' ' + NOMBRE_R[r][estado.idioma === 'en' ? 1 : 0] + '</td><td>' + formatoNumero(costo[r]) + '</td><td>' + (ok ? '✅ ' : '❌ ') + formatoNumero(cantidad(r)) + '</td></tr>';
    });
    if (seg !== undefined) h += '<tr class="tiempo"><td>⏱ ' + L('Tiempo de construcción', 'Build time') + '</td><td colspan="2">' + fmtTiempo(seg) + '</td></tr>';
    h += '</table>';
    if (h.indexOf('class="no"') >= 0) h = '<div class="banner-rojo">⚠️ ' + L('No cumples los requisitos para este edificio', 'You do not meet the requirements for this building') + '</div>' + h;
    return h;
  }
  function filasTrabajos(que, L2) { return trabajosPara(que, L2).map(function (x) { var ok = x.ok || estado.dueno; return { nombre: '📋 ' + T('tr_' + x.k, { n: x.need }), pide: x.need, tiene: x.have, ok: ok }; }); }
  // dos botones como en los juegos de reino: Construir (azul) y Construcción instantánea (verde, con gemas)
  function faltanRecursos(costo) { var f = {}, n = 0; ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { var q = Math.max(0, (costo[r] || 0) - (estado.oroInfinito ? Infinity : cantidad(r))); if (q > 0) { f[r] = Math.ceil(q); n += q; } }); return n > 0 ? { f: f, n: n } : null; }
  function gemasRecursos(fr) { return fr ? Math.max(1, Math.ceil(fr.n / 400)) : 0; }
  function botonesObra(costo, seg, accion, accionYa, extra, texto, bloqueado, que) {
    if (bloqueado) return '<div class="obra-botones">' + bloqueado + '</div>';
    var fr = faltanRecursos(costo);
    if (fr && que) {
      var gt = gemasParaTerminar(seg / velObras()) + gemasRecursos(fr);
      return '<div class="obra-botones">' + botonCosto(costo, accion, extra, texto + ' ').replace('class="comprar"', 'class="comprar azul"') +
        '<button class="comprar morado" data-accion="comprar-mejora" data-que="' + que + '" data-gemas="' + gt + '">💎 ' + L('Comprar mejora', 'Buy upgrade') + ' <span class="ico gema"></span>' + gt + '</button></div>';
    }
    var g = gemasParaTerminar(seg / velObras());
    return '<div class="obra-botones">' + botonCosto(costo, accion, extra, texto + ' ').replace('class="comprar"', 'class="comprar azul"') +
      '<button class="comprar verde" data-accion="' + accionYa + '" data-costo=\'' + JSON.stringify(costo) + '\' data-gemas="' + g + '" ' + (extra || '') + '>⚡ ' + L('Instantánea', 'Instant') + ' <span class="ico gema"></span>' + g + '</button></div>';
  }
  function comprarMejora(que) {
    var p = que.split(':'), costo, seg, hacer;
    if (p[0] === 'construir') { costo = costoEdif(p[1], 0); seg = EDIFICIOS[p[1]].tiempo[0] * (1 - bono('obras')); hacer = function () { construirYa(slotElegido, p[1]); }; if (faltaObra(p[1], 1)) return; }
    else if (p[0] === 'mejorar') { var s = slots[+p[1]]; if (!s || !s.edificio) return; costo = costoEdif(s.edificio.tipo, s.edificio.nivel); seg = EDIFICIOS[s.edificio.tipo].tiempo[s.edificio.nivel] * (1 - bono('obras')); hacer = function () { mejorarYa(+p[1]); }; if (faltaObra(s.edificio.tipo, s.edificio.nivel + 1)) return; }
    else if (p[0] === 'castillo') { var nc = estado.castillo || 1; costo = costoCastillo(nc + 1); seg = tiempoCastillo(nc + 1); hacer = castilloYa; if (faltaObra('castillo', nc + 1)) return; }
    else if (p[0] === 'muralla') { var nm = (estado.muralla || 0) + 1; costo = costoMuralla(nm - 1); seg = MURALLA.tiempo[nm - 1] * (1 - bono('obras')); hacer = murallaYa; if (faltaObra('muralla', nm)) return; }
    else return;
    var fr = faltanRecursos(costo), gr = gemasRecursos(fr), gt = gemasParaTerminar(seg / velObras());
    if (!hayGemas(gr + gt)) { consejoTemporal(T('sin_gemas')); sonar('error'); return; }
    if (gr && !pagar(0, gr)) return;
    if (fr) Object.keys(fr.f).forEach(function (r) { sumarRecurso(r, fr.f[r]); });
    hacer();
  }
  function murallaYa() { var nm = (estado.muralla || 0) + 1, g = gemasParaTerminar(MURALLA.tiempo[nm - 1] * (1 - bono('obras')) / velObras()); if (!hayGemas(g)) { consejoTemporal(T('sin_gemas')); sonar('error'); return; } construirMuralla(); if (obraMuralla) terminarConGemas('muralla'); }
  function hayGemas(g) { return estado.gemasInfinitas || estado.dueno || (estado.gemas || 0) >= g; }
  function construirYa(i, tipo) { var g = gemasParaTerminar(EDIFICIOS[tipo].tiempo[0] * (1 - bono('obras')) / velObras()); if (!hayGemas(g)) { consejoTemporal(T('sin_gemas')); sonar('error'); return; } construir(i, tipo); if (slots[i].obra) terminarConGemas('obra:' + i); }
  function mejorarYa(i) { var s = slots[i]; if (!s || !s.edificio) return; var g = gemasParaTerminar(EDIFICIOS[s.edificio.tipo].tiempo[s.edificio.nivel] * (1 - bono('obras')) / velObras()); if (!hayGemas(g)) { consejoTemporal(T('sin_gemas')); sonar('error'); return; } mejorar(i); if (slots[i].obra) terminarConGemas('obra:' + i); }
  function castilloYa() { var n = estado.castillo || 1, g = gemasParaTerminar(tiempoCastillo(n + 1) / velObras()); if (!hayGemas(g)) { consejoTemporal(T('sin_gemas')); sonar('error'); return; } mejorarCastillo(); if (estado.obraCastillo) terminarConGemas('castillo'); }
  // detalle de un edificio antes de construirlo (desde la lista de Construir)
  var tipoAConstruir = null;
  function abrirDetalleConstruir(tipo) {
    tipoAConstruir = tipo;
    var seg = EDIFICIOS[tipo].tiempo[0] * (1 - bono('obras')), costo = costoEdif(tipo, 0);
    var html = '<button class="comprar mini volver-lista" data-accion="volver-construir">◀ ' + L('Volver', 'Back') + '</button>' +
      '<div class="carta"><div class="cab"><div class="foto">' + fotoHTML(tipo, EDIFICIOS[tipo].icono) + '</div><div><h3>' + N(tipo) + ' — ' + T('nivel_de', { n: 1, m: NIVEL_MAX }) + '</h3><p>' + D(tipo) + '</p></div></div>' +
      '<div class="stats">' + statsEdificio(tipo, 1) + '</div>' +
      tablaRequisitos(costo, requisitosObra(tipo, 1), seg) +
      botonesObra(costo, seg, 'construir', 'construir-ya', 'data-tipo="' + tipo + '"', '🔨 ' + T('construir'), faltaObra(tipo, 1) ? botonFalta(faltaObra(tipo, 1)) : '', 'construir:' + tipo) + '</div>';
    abrirPanel(N(tipo), html, { tipo: 'construir-detalle', slot: slotElegido });
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
    if (d.recurso) return '<span>' + ICONO_RECURSO[d.recurso] + ' ' + T('produce_txt', { n: d.produce[i], r: T('r_' + d.recurso), s: d.cada }) + '</span><span>📦 ' + T('guarda_hasta', { n: Math.round(d.produce[i] * HORAS_ALMACEN * 3600 / d.cada) }) + '</span>';
    if (tipo === 'cuartel') return '<span>⚔️ ' + T('sin_tope') + '</span>' + (d.rapidez[i] > 1 ? '<span>' + T('velocidad_ent') + ' x' + d.rapidez[i] + '</span>' : '');
    if (tipo === 'enfermeria') return '<span>🛏️ ' + T('camas') + ': ' + d.capacidad[i] + '</span>';
    if (tipo === 'almacen') return '<span>🔒 ' + T('protege_txt', { n: d.protege[i] }) + '</span>';
    if (tipo === 'vigia') return '<span>🛡️ ' + T('vig_txt', { n: Math.round(d.defensa[i] * 100) }) + '</span><span>👁️ ' + T('vig_ve') + '</span>';
    if (tipo === 'mercado') return '<span>⚖️ ' + T('tasa_txt', { n: Math.round(d.tasa[i] * 100) }) + '</span>';
    if (tipo === 'herreria') return '<span>⚒️ ' + T('herreria_txt', { n: ARMAS.herreria.filter(function (r) { return r <= i + 1; }).length }) + '</span>';
    if (tipo === 'establo' || tipo === 'galeria') return '<span>' + d.icono + ' ' + N(tipo === 'establo' ? 'caballeria' : 'arquero') + '</span>' + (d.rapidez[i] > 1 ? '<span>' + T('velocidad_ent') + ' x' + d.rapidez[i] + '</span>' : '');
    if (tipo === 'academia') return '<span>📜 ' + T('nivel') + ' máx. ' + d.tope[i] + '</span>' + (d.rapidez[i] > 1 ? '<span>⏱ x' + d.rapidez[i] + '</span>' : '');
    return '<span>' + T('dano') + ': ' + d.dano[i] + '</span><span>' + T('alcance') + ': ' + d.alcance[i] + '</span>';
  }
  function htmlMuralla() {
    var n = estado.muralla, sig = n + 1;
    var h = '<div class="carta compacta"><div class="cab"><div class="foto">' + fotoHTML('muralla', MURALLA.icono) + '</div><div><h3>' + N('muralla') + (n ? ' — ' + T('nivel_corto') + ' ' + n + '/' + NIVEL_MAX : '') + '</h3><p>' + D('muralla') + '</p></div></div>';
    if (obraMuralla) return h + '<div class="stats"><span>' + T('construyendo') + ' ⏱ ' + fmtTiempo((obraMuralla.total - obraMuralla.t) / velObras()) + '</span></div>' + botonGemas(gemasParaTerminar((obraMuralla.total - obraMuralla.t) / velObras()), 'terminar-gemas', 'data-que="muralla"', '⏩ ' + T('terminar_ya')) + '</div>';
    if (n >= NIVEL_MAX) return h + '<div class="stats"><span>❤ +' + Math.round(MURALLA.vida[NIVEL_MAX - 1] * (1 + bono('muros'))) + '</span><span>' + T('nivel_max') + '</span></div></div>';
    var segM = MURALLA.tiempo[sig - 1] * (1 - bono('obras'));
    return h + '<div class="stats"><span>❤ ' + T('vida_extra') + ' +' + MURALLA.vida[sig - 1] + '</span></div>' + tablaRequisitos(costoMuralla(sig - 1), requisitosObra('muralla', sig), segM) +
      botonesObra(costoMuralla(sig - 1), segM, 'muralla', 'muralla-ya', '', '⬆️ ' + (n ? T('mejorar') : T('construir')), faltaObra('muralla', sig) ? botonFalta(faltaObra('muralla', sig)) : '', 'muralla') + '</div>';
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
    var sl = slotElegido !== null ? slots[slotElegido] : null;
    ['granja', 'aserradero', 'mina', 'cantera', 'cuartel', 'establo', 'galeria', 'torre', 'enfermeria', 'academia', 'herreria', 'almacen', 'mercado', 'vigia'].filter(function (t) { return !sl || sl.campo === esCampo(t); }).forEach(function (t) {
      var fo = faltaObra(t, 1);
      html += '<button class="fila-construir' + (fo ? ' bloq' : '') + '" data-accion="detalle-construir" data-tipo="' + t + '"><span class="foto">' + fotoHTML(t, EDIFICIOS[t].icono) + (fo ? '<b class="candado">🔒</b>' : '') + '</span><span class="fc-txt"><b>' + N(t) + '</b><small>' + D(t) + '</small>' + (fo ? '<small class="aviso-rojo">' + fo + '</small>' : '') + '<small class="t-obra">⏱ ' + fmtTiempo(EDIFICIOS[t].tiempo[0] * (1 - bono('obras'))) + '</small></span><span class="fc-flecha">›</span></button>';
    });
    if (!sl || !sl.campo) html += htmlBarricada() + htmlMuralla();
    html += '</div>';
    if (!slots.some(function (s) { return !s.edificio && !s.obra && !cerrada(s); })) html += '<p class="nota aviso-rojo">' + T('sin_terreno') + '</p>';
    abrirPanel(T('p_construir'), html, { tipo: 'construir', slot: slotElegido });
  }

  // ------------------------------------------------------------------
  //  PANTALLA DE TROPAS: muñeco 3D grande que gira, rangos, barra de cantidad
  // ------------------------------------------------------------------
  var PESTANAS_TROPA = { cuartel: ['explorador', 'miliciano', 'espadachin', 'guardian', 'balista', 'ariete', 'catapulta', 'torre_asedio'], establo: ['jinete', 'caballeria', 'caballeria_pesada'], tiro: ['arquero'] };
  var ICONO_PESTANA = { cuartel: '🏰', establo: '🐎', tiro: '🏹' };
  var ROMANO = ['I', 'II', 'III', 'IV'];
  var vistaTropa = { pest: 'cuartel', tipo: 'espadachin', rango: null, n: 1 };
  var visor = null;
  // Escuadrón: el líder adelante y 7 soldados en formación detrás (todos del rango elegido)
  function escuadron(tipo, rango) {
    var g = new THREE.Group(), lider = M.unidad(tipo, undefined, rango), miembros = [lider];
    g.add(lider.grupo);
    var sep = tipo === 'caballeria' ? 1.55 : 1.0, puestos = [[-1, -1], [0, -1.1], [1, -1], [-1.5, -2.1], [-0.5, -2.2], [0.5, -2.2], [1.5, -2.1]];
    puestos.forEach(function (q) { var u = M.unidad(tipo, undefined, rango); u.grupo.position.set(q[0] * sep, 0, q[1] * sep); g.add(u.grupo); miembros.push(u); });
    return { grupo: g, cuerpo: lider.cuerpo, p: lider.p, escala: lider.escala, baseY: lider.baseY, miembros: miembros };
  }
  function cuentaRango(tipo, r) { return tropas.filter(function (u) { return u.tipo === tipo && !u.invocada && !u.refuerzo && !u.heroeId && (u.armadura || 0) === r; }).length; }
  function cuentaTipo(tipo) { return tropas.filter(function (u) { return u.tipo === tipo && !u.invocada && !u.refuerzo && !u.heroeId; }).length; }
  function visorTropa(cont, tipo, rango) { visorModelo(cont, 'esc:' + tipo + ':' + rango, function () { return escuadron(tipo, rango); }); }
  // visor 3D que gira: lo usan la pantalla de tropas y la ficha del héroe
  function visorModelo(cont, clave, fabrica) {
    try {
      if (!visor) {
        var r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        var e = new THREE.Scene();
        e.add(new THREE.HemisphereLight(0xffffff, 0x8a7a5a, 0.7));
        var l = new THREE.DirectionalLight(0xffffff, 0.7); l.position.set(3, 6, 5); e.add(l);
        var l2 = new THREE.DirectionalLight(0xffe0b0, 0.35); l2.position.set(-4, 2, -3); e.add(l2);
        var base = new THREE.Group();
        var piedra = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.08, 0.16, 32), new THREE.MeshLambertMaterial({ color: 0xa8957a }));
        piedra.position.y = -0.08; base.add(piedra);
        var borde = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 8, 40), new THREE.MeshLambertMaterial({ color: 0xd9b04a }));
        borde.rotation.x = Math.PI / 2; borde.position.y = 0.005; base.add(borde);
        e.add(base);
        visor = { r: r, e: e, c: new THREE.PerspectiveCamera(28, 1, 0.1, 200), base: base, m: null, clave: '', giro: 0.5, arrastre: null, t: 0, ultimo: 0 };
        var el = r.domElement;
        el.style.touchAction = 'none';
        el.addEventListener('pointerdown', function (ev) { visor.arrastre = ev.clientX; try { el.setPointerCapture(ev.pointerId); } catch (x) {} });
        el.addEventListener('pointermove', function (ev) { if (visor.arrastre === null) return; visor.giro += (ev.clientX - visor.arrastre) * 0.012; visor.arrastre = ev.clientX; });
        el.addEventListener('pointerup', function () { visor.arrastre = null; });
        el.addEventListener('pointercancel', function () { visor.arrastre = null; });
      }
      if (visor.clave !== clave) {
        if (visor.m) visor.e.remove(visor.m.grupo);
        var m = fabrica();
        m.grupo.rotation.y = 0;
        m.grupo.updateMatrixWorld(true);
        var caja = new THREE.Box3().setFromObject(m.grupo), tam = new V3(); caja.getSize(tam);
        var ancho = Math.max(tam.x, tam.z);
        visor.base.scale.set(ancho * 0.72, 1, ancho * 0.72);
        visor.h = tam.y; visor.dist = Math.max(tam.y, ancho * 0.9) * (m.miembros ? 2.5 : 2.35);
        visor.e.add(m.grupo);
        visor.m = m; visor.clave = clave;
      }
      cont.appendChild(visor.r.domElement);
      var w = cont.clientWidth || 320, hh = cont.clientHeight || 260;
      visor.r.setSize(w, hh);
      visor.c.aspect = w / hh; visor.c.updateProjectionMatrix();
      dibujarVisor(0);
      if (!visor.corriendo) { visor.corriendo = true; visor.ultimo = performance.now(); requestAnimationFrame(pasoVisor); }
    } catch (err) { /* sin 3D: queda el fondo */ }
  }
  function dibujarVisor(dt) {
    visor.t += dt;
    if (visor.arrastre === null) visor.giro += dt * (visor.m.miembros ? 0.3 : 0.6);
    visor.m.grupo.rotation.y = visor.giro;
    try {
      if (visor.m.miembros) { var fase = visor.t % 3.2, golpe = fase < 0.55 ? 1 - fase / 0.55 : 0; visor.m.miembros.forEach(function (u, i) { M.animarUnidad(u, visor.t + i * 0.41, false, i === 0 ? golpe : 0); }); }
      else M.animarUnidad(visor.m, visor.t, false, 0);
    } catch (x) {}
    var c = visor.c, d = visor.dist, h = visor.h;
    c.position.set(0, h * 0.5 + d * 0.22, d); c.lookAt(0, h * 0.36, 0);
    visor.r.render(visor.e, c);
  }
  function pasoVisor(ahora) {
    if (!visor) return;
    if (!visor.r.domElement.isConnected || $('panel').classList.contains('oculto')) { visor.corriendo = false; return; }
    var dt = Math.min(0.1, Math.max(0, (ahora - visor.ultimo) / 1000)); visor.ultimo = ahora;
    dibujarVisor(dt);
    requestAnimationFrame(pasoVisor);
  }
  function segTropas(tipo, n) { return n * TROPAS[tipo].tiempo / rapidezEntreno(); }
  function costoTropas(tipo, n, conGemas) {
    var c = costoTropa(tipo), t = { oro: c.oro * n, comida: c.comida * n };
    if (conGemas) t.gemas = gemasParaTerminar(segTropas(tipo, n));
    return t;
  }
  function abrirPanelTropas() {
    vistos().tropasDia = hoyTexto();
    var v = vistaTropa, t = v.tipo, d = TROPAS[t], na = nivelArmadura(t);
    if (v.rango === null || v.rango > ARMADURA.max) v.rango = na;
    var r = v.rango, bloq = r > na, lista = PESTANAS_TROPA[v.pest];
    var arriba = panelActual && panelActual.tipo === 'tropas' ? $('panel').scrollTop : 0;
    var html = subtabsHeroes('tropas');
    if (!puedeEntrenarTipo(t)) html += '<p class="nota aviso-rojo">' + avisoEdificioTropa(t) + '</p>';
    html += '<div class="subtabs pest-tropa">' + Object.keys(PESTANAS_TROPA).map(function (k) {
      return '<button data-accion="tropa-pest" data-pest="' + k + '" class="' + (k === v.pest ? 'activo' : '') + '">' + ICONO_PESTANA[k] + ' ' + T('pest_' + k) + '</button>';
    }).join('') + '</div>';
    // escena con el muñeco
    html += '<div class="tropa-escena"><div class="visor-tropa" id="visor-tropa"></div>' +
      '<div class="tropa-nombre"><h3>' + N(t) + '</h3><span class="rango-chapa r' + r + '">' + T('rango') + ' ' + ROMANO[r] + '</span></div>' +
      '<div class="tropa-cuenta"><span>👥 ' + T('esc_tienes', { n: formatoNumero(cuentaTipo(t)) }) + '</span><span>⏱ ' + T('esc_entrenando', { n: formatoNumero(colaEntreno.filter(function (c) { return c.tipo === t; }).length) }) + '</span></div>' +
      (lista.length > 1 ? '<div class="tropa-elegir">' + lista.map(function (k) {
        return '<button data-accion="tropa-tipo" data-tipo="' + k + '" class="' + (k === t ? 'activo' : '') + '" title="' + N(k) + '">' + fotoHTML(k, TROPAS[k].icono) + '</button>';
      }).join('') + '</div>' : '') +
      '<div class="rangos">' + ROMANO.map(function (rn, i) {
        return '<button data-accion="tropa-rango" data-r="' + i + '" class="r' + i + (i > na ? ' bloq' : '') + (i === r ? ' activo' : '') + '"><b>' + rn + (i > na ? ' 🔒' : '') + '</b><small>×' + formatoNumero(cuentaRango(t, i)) + '</small></button>';
      }).join('') + '</div></div>';
    html += '<p class="nota tropa-desc">' + D(t) + '</p><button class="comprar morado inv-tropa-btn" data-accion="inv-tropa" data-tipo="' + t + '">' + T('investigar_tropa') + ' · ' + N(t) + '</button>';
    html += '<div class="stats"><span>❤ ' + T('vida') + ' ' + Math.round(d.vida * (1 + ARMADURA.vida * r)) + '</span><span>⚔ ' + T('dano') + ' ' + d.dano + '</span><span>🎯 ' + T('alcance') + ' ' + d.alcance + '</span><span>⏱ ' + fmtTiempo(d.tiempo / rapidezEntreno()) + '</span>' +
      (r ? '<span class="nivel-arm">🛡️ ' + T('defensa') + ' ' + Math.round(ARMADURA.defensa * 100 * r) + '%</span>' : '') + '</div>';
    var subir = na < ARMADURA.max ? '<div class="carta compacta subir-rango"><h3>⬆️ ' + T('subir_rango', { r: ROMANO[na + 1] }) + '</h3><p class="nota">' + T('armadura_sube', { n: na + 1, v: Math.round(ARMADURA.vida * 100 * (na + 1)), d: Math.round(ARMADURA.defensa * 100 * (na + 1)) }) + '</p><div class="botones-tropa">' +
      botonCosto(costoArmadura(na), 'armadura', 'data-tipo="' + t + '"', '🛡️ ').replace('class="comprar"', 'class="comprar armadura"') +
      botonGemas(ARMADURA.gemas[na], 'armadura-gemas', 'data-tipo="' + t + '"', '🛡️') + '</div></div>' : '<p class="nota"><b>' + T('armadura_max') + '</b></p>';
    if (bloq) {
      html += '<p class="nota aviso-rojo">' + T(r === na + 1 ? 'rango_bloq' : 'rango_antes', { r: ROMANO[r === na + 1 ? r : na + 1] }) + '</p>' + subir;
    } else {
      var max = maxEntrenar(t);
      v.n = Math.max(1, Math.min(v.n, Math.max(1, max)));
      html += '<div class="tropa-cantidad"><button class="redondo" data-accion="tropa-menos">−</button>' +
        '<input type="range" id="tropa-n" min="1" max="' + Math.max(1, max) + '" value="' + v.n + '"' + (max < 1 ? ' disabled' : '') + '>' +
        '<button class="redondo" data-accion="tropa-mas">+</button><span class="tropa-num" id="tropa-num">' + v.n + '</span>' +
        '<button class="comprar mini naranja" data-accion="tropa-max">' + T('maximo') + '</button></div>' +
        (max < 1 && cuartelesListos().length ? '<p class="nota aviso-rojo">' + T('sin_recursos_tropa') + '</p>' : '') +
        '<div class="tropa-total" id="tropa-total"></div>' +
        '<div class="botones-tropa">' +
        '<button class="comprar" id="btn-tropa-ent" data-accion="entrenar" data-tipo="' + t + '"></button></div>' +
        '<div class="cola" id="cola"></div><div id="cola-gemas" class="cola-gemas"></div>' + subir;
    }
    abrirPanel(T('p_heroes'), html, { tipo: 'tropas' });
    if (!bloq) refrescarCantidad();
    $('panel').scrollTop = arriba;
    visorTropa($('visor-tropa'), t, r);
  }
  function refrescarCantidad() {
    var v = vistaTropa, t = v.tipo, n = v.n;
    var sl = $('tropa-n'); if (!sl) return;
    sl.value = n; $('tropa-num').textContent = n;
    var tot = costoTropas(t, n), ya = costoTropas(t, n, true);
    $('tropa-total').innerHTML = htmlCosto(tot) + '<span class="costo-r">⏱ ' + fmtTiempo(segTropas(t, n) / velReal()) + '</span>';
    var be = $('btn-tropa-ent');
    be.setAttribute('data-n', n); be.setAttribute('data-costo', JSON.stringify(tot));
    be.innerHTML = '⚔️ ' + T('entrenar') + ' ×' + n;
    actualizarPanel();
  }
  function cambiarCantidad(d) {
    var max = Math.max(1, maxEntrenar(vistaTropa.tipo));
    vistaTropa.n = Math.max(1, Math.min(max, vistaTropa.n + d));
    refrescarCantidad();
  }
  // entrenar y terminar al momento pagando gemas
  function entrenarYa(tipo, n) {
    return; // v4.9: entrenar siempre toma tiempo (se acelera con aceleradores)
    if (!puedeEntrenarTipo(tipo)) { consejoTemporal(avisoEdificioTropa(tipo)); sonar('error'); return; }
    n = Math.min(n, maxEntrenar(tipo));
    if (n < 1) { consejoTemporal(T('sin_recursos_tropa')); sonar('error'); return; }
    if (!pagar(costoTropas(tipo, n, true))) return;
    var p = puertaCuartel();
    for (var k = 0; k < n; k++) crearTropa(tipo, p.clone().add(new V3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5)));
    chispas(p.clone().setY(1), 0xd59bff, 20, 3);
    sonar('magia');
    consejoTemporal(T('entrenadas_ya', { n: n, t: N(tipo) }));
    vistaTropa.n = 1;
    actualizarHUD();
    guardar(true);
    reabrirPanel();
  }
  function gemasEntreno() { return gemasParaTerminar(faltaEntreno() * velReal()); }

  function abrirPanelInvocar() {
    var d = TROPAS.heroe;
    var html = subtabsHeroes('invocar') + '<div class="lista">' +
      '<div class="carta compacta"><div class="cab"><div class="foto">✨</div><div><h3>' + T('invocar3') + '</h3><p>' + T('invocar3_txt') + '</p></div></div>' +
      botonGemas(INVOCAR.tres, 'invocar3', '', T('p_invocar')) + '</div>' +
      '</div>';
    abrirPanel(T('p_heroes'), html, { tipo: 'invocar' });
  }

  var pestCuartel = 'detalles';
  var TROPAS_LISTA = TROPAS_ORDEN;
  function htmlPestanasCuartel() {
    return '<div class="subtabs cuartel-tabs">' + [['detalles', L('Detalles', 'Details')], ['entrenar', L('Entrenar tropas', 'Train troops')], ['cola', L('En entrenamiento', 'In training')]].map(function (q) {
      var n = q[0] === 'cola' ? colaEntreno.length : 0;
      return '<button data-accion="cuartel-pest" data-p="' + q[0] + '" class="' + (pestCuartel === q[0] ? 'activo' : '') + '">' + q[1] + (n ? ' <span class="mail-n">' + formatoNumero(n) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function htmlEntrenarLista() {
    return '<div class="tropas-lista">' + TROPAS_LISTA.map(function (t) {
      if (t === 'carreta') { var cr = carretas(); return '<button class="fila-tropa" data-accion="cuartel-carretas"><span class="foto">' + fotoHTML('carreta', '🛒') + '<i class="estrellas">★★</i></span><span class="ft-txt"><b>' + N('carreta') + '</b><small class="ft-tienes">' + L('Tienes: ', 'Owned: ') + cr.n + '</small><small>' + D('carreta') + '</small></span><span class="fc-flecha">›</span></button>'; }
      var na = nivelArmadura(t), ok = puedeEntrenarTipo(t), ent = colaEntreno.filter(function (c) { return c.tipo === t; }).length, est = TROPA_RANGO_ESTRELLAS[t] || 1;
      return '<button class="fila-tropa' + (ok ? '' : ' bloq') + '" data-accion="cuartel-tropa" data-tipo="' + t + '"><span class="foto">' + fotoHTML(t, TROPAS[t].icono) + (ok ? '' : '<b class="candado">🔒</b>') + '<i class="estrellas">' + '★'.repeat(Math.min(5, est + na)) + '</i></span>' +
        '<span class="ft-txt"><b>' + N(t) + ' <small class="rango-chapa r' + na + '">' + T('rango') + ' ' + ROMANO[na] + '</small></b><small class="ft-tienes">' + L('Tienes: ', 'Owned: ') + formatoNumero(cuentaTipo(t)) + (ent ? ' · ⏱ ' + formatoNumero(ent) : '') + '</small><small>' + D(t) + '</small>' + (ok ? '' : '<small class="aviso-rojo">' + avisoEdificioTropa(t) + '</small>') + '</span><span class="fc-flecha">›</span></button>';
    }).join('') + '</div>';
  }
  function htmlColaCuartel() {
    if (!colaEntreno.length) return '<div class="carta"><p class="nota">' + L('No hay tropas entrenando. Ve a Entrenar tropas.', 'No troops in training. Go to Train troops.') + '</p></div>';
    var grupos = {}; colaEntreno.forEach(function (c) { grupos[c.tipo] = (grupos[c.tipo] || 0) + 1; });
    var primero = colaEntreno[0], pct = Math.round(Math.min(1, primero.t / primero.total) * 100);
    return '<div class="carta">' + Object.keys(grupos).map(function (t) {
      return '<div class="fila-miembro"><span class="foto mini">' + fotoHTML(t, TROPAS[t].icono) + '</span><b>' + N(t) + '</b><span class="chip">×' + formatoNumero(grupos[t]) + '</span></div>';
    }).join('') + '<div class="ped-barra"><div style="width:' + pct + '%"></div><span>' + L('Falta: ', 'Left: ') + fmtTiempo(faltaEntreno()) + '</span></div>' +
      '<button class="comprar azul boton-oleada-grande" data-accion="acelerar-entreno">⏩ ' + T('mb_acelerar') + '</button></div>';
  }
  function abrirPanelEdificio(i) {
    var s = slots[i];
    slotElegido = i;
    var tipo = s.edificio ? s.edificio.tipo : s.obra.tipo;
    var nivel = s.edificio ? s.edificio.nivel : s.obra.nivel;
    var esCuartel = (tipo === 'cuartel' || tipo === 'establo' || tipo === 'galeria') && s.edificio;
    if (!panelActual || panelActual.tipo !== 'edificio' || panelActual.slot !== i) { if (!esCuartel || pestCuartel === 'detalles') pestCuartel = esCuartel && panelActual && panelActual.tipo === 'cuartel-abrir' ? 'entrenar' : 'detalles'; }
    if (esCuartel && pestCuartel !== 'detalles') {
      abrirPanel(N(tipo) + ' (' + L('Nv ', 'Lv ') + nivel + ')', htmlPestanasCuartel() + (pestCuartel === 'entrenar' ? htmlEntrenarLista() : htmlColaCuartel()), { tipo: 'edificio', slot: i });
      return;
    }
    var html = '<div class="carta"><div class="cab"><div class="foto">' + fotoHTML(tipo, EDIFICIOS[tipo].icono) + '</div><div><h3>' + N(tipo) + ' — ' + T('nivel_de', { n: nivel, m: NIVEL_MAX }) + '</h3><p>' + D(tipo) + '</p></div></div>';
    if (s.obra) {
      html += '<p class="nota"><b>' + (s.obra.nivel === 1 ? L('Construyendo', 'Building') : L('Mejorando a nivel ', 'Upgrading to level ') + s.obra.nivel) + '</b> <span class="reloj-panel" id="reloj-obra" data-slot="' + i + '">⏱ ' + fmtTiempo((s.obra.total - s.obra.t) / velObras()) + '</span></p><div class="obra-botones"><button class="comprar azul" data-accion="acelerar-que" data-que="obra:' + i + '">⏩ ' + T('mb_acelerar') + '</button>' + botonGemas(gemasParaTerminar((s.obra.total - s.obra.t) / velObras()), 'terminar-gemas', 'data-que="obra:' + i + '"', '⚡ ' + T('terminar_ya')).replace('comprar morado', 'comprar verde') + '</div>';
    } else {
      html += '<div class="stats">' + statsEdificio(tipo, nivel) + '</div>';
      if (tipo === 'enfermeria') html += '<p class="nota">' + T('en_enfermeria', { n: totalHeridos() }) + '</p>';
      if (tipo === 'academia') html += '<button class="comprar naranja boton-oleada-grande" data-accion="investigacion">' + T('inv_abrir') + '</button>';
      if (tipo === 'mercado') html += '<button class="comprar naranja boton-oleada-grande" data-accion="abrir-mercado">⚖️ ' + T('mb_comerciar') + '</button>';
      if (tipo === 'herreria') html += '<button class="comprar naranja boton-oleada-grande" data-accion="abrir-herreria">⚒️ ' + T('mb_forjar') + '</button>';
      if (nivel < NIVEL_MAX) {
        var pendP = trabajosPendientes('edificio', nivel + 1);
        var segE = EDIFICIOS[tipo].tiempo[nivel] * (1 - bono('obras'));
        html += '<div class="sig-nivel"><b>' + L('Siguiente nivel ', 'Next level ') + (nivel + 1) + '</b><div class="stats">' + statsEdificio(tipo, nivel + 1) + '</div></div>' +
          tablaRequisitos(costoEdif(tipo, nivel), requisitosObra(tipo, nivel + 1).concat(filasTrabajos('edificio', nivel + 1)), segE) +
          botonesObra(costoEdif(tipo, nivel), segE, 'mejorar', 'mejorar-ya', 'data-slot="' + i + '"', '⬆️ ' + T('mejorar'), faltaObra(tipo, nivel + 1) ? botonFalta(faltaObra(tipo, nivel + 1)) : pendP.length ? botonBloqueadoTrabajos(pendP) : '', 'mejorar:' + i);
      } else html += '<p class="nota"><b>' + T('nivel_max') + ' ★★★</b></p>';
    }
    if (s.edificio && !oleadaActiva) html += '<button class="comprar rojo demoler-panel" data-accion="demoler-panel" data-slot="' + i + '">🧨 ' + T('mb_demoler') + '</button>';
    html += '</div>';
    abrirPanel(N(tipo) + ' (' + L('Nv ', 'Lv ') + nivel + ')', (esCuartel ? htmlPestanasCuartel() : '') + html, { tipo: 'edificio', slot: i });
  }

  function abrirPanelUnidad(u) {
    unidadSel = u;
    var d = u.d, nombre = u.heroeId ? NH(u.heroeId) : N(u.tipo), aliado = u.aliado;
    var dano = aliado ? d.dano * (hambre ? COMIDA_TROPA.debilidad : 1) * (1 + bono('espadas') + bonoTropa(u.tipo, 'ataque')) : u.dano;
    var clFoto = u.heroeId ? 'h_' + u.heroeId : u.tipo;
    var foto = retratos[clFoto] ? '<img src="' + retratos[clFoto] + '" alt="">' : (aliado ? '🛡️' : '👹');
    var frac = Math.max(0, u.vida / u.max);
    var html = '<div class="carta"><div class="ficha"><div class="foto">' + foto + '</div><div style="flex:1">' +
      '<h3>' + nombre + '</h3><p>' + (u.heroeId ? '🦸 ' + HB(HEROE[u.heroeId].hab).nombre + ': ' + HB(HEROE[u.heroeId].hab).des : (aliado ? T('t_aliada') : T('t_enemigo')) + (NOMBRES[u.tipo].des_es ? ' — ' + D(u.tipo) : '')) + '</p>' +
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
  // ---------- HÉROES ----------
  function NH(id) { return (NOMBRES_HEROES[id] || {})[estado.idioma] || id; }
  function HB(hab) { var h = HABILIDADES[hab]; return { nombre: h.icono + ' ' + h[estado.idioma], des: h['des_' + estado.idioma] }; }
  function hoyTexto() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function reclutaGratisHoy() { return estado.reclutaGratis !== hoyTexto(); }
  function puertaCastillo() { return puntoCamino(largoCamino).p.clone().add(new V3(-0.6, 0, 0.6)); }
  function furia(u) { return u.furia && u.furia > tiempo ? 1.4 : 1; }
  function statsHeroe(id) {
    var h = HEROE[id], e = estado.heroes[id] || { nivel: 1, estrellas: 1 };
    var f = (1 + 0.06 * (e.nivel - 1)) * (1 + 0.2 * (e.estrellas - 1));
    var tal = TALENTOS[h.clase], tl = e.tal || 0, bq = bonosEquipo(id);
    return { vida: Math.round(h.vida * f * (1 + (tal.vida || 0) * tl) + bq.vida), dano: Math.round((h.dano * f * (1 + (tal.dano || 0) * tl) + bq.dano) * (1 + bq.danoP)), alcance: Math.round((h.alcance + (tal.alcance || 0) * tl) * 10) / 10, vel: 3.4 * (1 + bq.vel), ritmo: h.distancia ? 1.1 : 0.8, defensa: bq.def,
      cura: Math.round(6 * f), distancia: !!h.distancia, icono: CLASES_HEROE[h.clase] };
  }
  function topeNivel(id) { return Math.min(HEROE_NIVEL_MAX, (estado.heroes[id].estrellas || 1) * 10); }
  function costoNivelHeroe(id) { var e = estado.heroes[id]; return { oro: Math.round(40 * e.nivel * RAREZAS[HEROE[id].rareza].costoNivel) }; }
  function fragParaEstrella(id) { var e = estado.heroes[id]; return e.estrellas >= 5 ? 0 : HEROE_FRAGMENTOS[e.estrellas - 1]; }
  function heroeMejorable(id) {
    var e = estado.heroes[id]; if (!e) return false;
    return (e.nivel < topeNivel(id) && (puedePagar(costoMejorarHeroe(id)) || librosQueTienes() > 0)) || (e.estrellas < 5 && e.frag >= fragParaEstrella(id));
  }
  // Pone en el reino a los héroes del equipo (guardados en el castillo) y quita los que ya no están
  function ponerEquipo() {
    if (oleadaActiva) return;
    tropas.filter(function (u) { return u.heroeId && estado.equipo.indexOf(u.heroeId) < 0; }).forEach(function (u) { var i = tropas.indexOf(u); if (i >= 0) tropas.splice(i, 1); escena.remove(u.m.grupo); escena.remove(u.barra); });
    tropas.filter(function (u) { return u.tipo === 'heroe' && !u.heroeId; }).forEach(function (u) { var i = tropas.indexOf(u); if (i >= 0) tropas.splice(i, 1); escena.remove(u.m.grupo); escena.remove(u.barra); });
    estado.equipo.forEach(function (id) {
      var u = tropas.filter(function (x) { return x.heroeId === id; })[0];
      if (u && (!!u.m.glb !== M.tieneGLB(id) || u.m.tier !== M.tierHeroe(estado.heroes[id].nivel) || u.m.etapa !== M.etapaArmadura(estado.heroes[id].nivel))) { var iu = tropas.indexOf(u); if (iu >= 0) tropas.splice(iu, 1); escena.remove(u.m.grupo); escena.remove(u.barra); u = null; }
      if (u) { var s = statsHeroe(id), fr = u.vida / u.max; u.d = s; u.max = s.vida; u.vida = Math.max(1, fr) * s.vida; return; }
      u = crearTropa('heroe', puertaCastillo(), false, id);
      guardarDentro(u);
    });
    asignarPuestos();
  }
  function usarHabilidad(u) {
    var h = HEROE[u.heroeId], hab = HABILIDADES[h.hab], dano = u.d.dano * furia(u), V = valoresHab(h.hab, nivelHab(u.heroeId));
    var rango = hab.rango * (h.distancia ? 1.8 : 1); // los de distancia lanzan su poder desde más lejos
    var cerca = enemigos.filter(function (e) { return e.pos.distanceTo(u.pos) < rango; }).sort(function (a, b) { return a.pos.distanceTo(u.pos) - b.pos.distanceTo(u.pos); });
    var amigos = tropasFuera().filter(function (t) { return t.pos.distanceTo(u.pos) < rango; });
    var alto = u.pos.clone().setY(1.6 * u.m.escala);
    switch (h.hab) {
      case 'grito':
        if (!cerca.length) return false;
        amigos.forEach(function (t) { t.furia = tiempo + V.dur; chispas(t.pos.clone().setY(1.2), 0xff7a3a, 3, 2); });
        chispas(alto, 0xff7a3a, 24, 5); break;
      case 'rayo':
        if (!cerca.length) return false;
        cerca.slice(0, V.saltos).forEach(function (e, i) { setTimeout(function () { if (e.vida > 0) { danar(e, dano * V.mult, u); chispas(e.pos.clone().setY(1.2), 0xb48cff, 14, 4); } }, i * 120); });
        chispas(alto, 0xb48cff, 16, 4); break;
      case 'canon':
        if (!cerca.length) return false;
        var fuerte = cerca.slice().sort(function (a, b) { return b.vida - a.vida; })[0];
        enemigos.filter(function (e) { return e !== fuerte && e.pos.distanceTo(fuerte.pos) < 2.5; }).forEach(function (e) { danar(e, dano * V.mult2, u); });
        danar(fuerte, dano * V.mult, u);
        chispas(fuerte.pos.clone().setY(1), 0xffa030, 34, 6); chispas(fuerte.pos.clone().setY(0.5), 0x5a5048, 16, 3); break;
      case 'lluvia':
        if (!cerca.length) return false;
        var centro = cerca[0].pos;
        enemigos.filter(function (e) { return e.pos.distanceTo(centro) < V.radio; }).forEach(function (e, i) { setTimeout(function () { if (e.vida > 0) disparar(u.pos.clone().setY(3.5), e, dano * V.mult, i === 0); }, i * 60); });
        break;
      case 'bomba':
        if (!cerca.length) return false;
        var c2 = cerca[0].pos.clone();
        enemigos.filter(function (e) { return e.pos.distanceTo(c2) < V.radio; }).forEach(function (e) { danar(e, dano * V.mult, u); });
        chispas(c2.clone().setY(0.8), 0xffb020, 36, 6); chispas(c2.clone().setY(0.4), 0x4a4440, 18, 3); break;
      case 'escudo':
        if (!cerca.length) return false;
        amigos.forEach(function (t) { t.escudoHasta = tiempo + V.dur; chispas(t.pos.clone().setY(1), 0x6fb7ff, 4, 2); });
        chispas(alto, 0x6fb7ff, 22, 4); break;
      case 'golpe':
        if (!cerca.length) return false;
        cerca.forEach(function (e) { danar(e, dano * V.mult, u); e.aturdido = V.mareo; });
        chispas(u.pos.clone().setY(0.3), 0xffe14a, 30, 5); break;
      case 'curar':
        var heridos = amigos.filter(function (t) { return t.vida < t.max * 0.95; });
        if (!heridos.length || !cerca.length && !heridos.length) return false;
        heridos.forEach(function (t) { t.vida = Math.min(t.max, t.vida + t.max * V.cura); M.ponerVida(t.barra, t.vida / t.max); chispas(t.pos.clone().setY(1.1), 0x7fe39a, 6, 2); });
        break;
    }
    u.ataque = 1;
    flotar(HB(h.hab).nombre, u.pos.clone().setY(u.altoBarra + 0.9), 'gema');
    sonar('poder');
    return true;
  }
  function tarjetaHeroe(h) {
    var e = estado.heroes[h.id], est = '';
    for (var i = 1; i <= 5; i++) est += i <= (e ? e.estrellas : 0) ? '★' : '☆';
    return '<button class="hcard ' + h.rareza + (e ? '' : ' bloq') + '" data-accion="heroe-ver" data-id="' + h.id + '">' +
      '<span class="clase">' + CLASES_HEROE[h.clase] + '</span>' + (e && heroeMejorable(h.id) ? '<span class="sube">⬆</span>' : '') +
      fotoHTML('h_' + h.id, '🦸') + '<span class="rz-cinta">' + T('rareza_' + h.rareza) + '</span>' + (e && estado.equipo.indexOf(h.id) >= 0 ? '<span class="eq">' + T('en_equipo') + '</span>' : '') +
      '<span class="nom">' + NH(h.id) + '</span><span class="nv">' + (e ? T('nivel_corto') + ' ' + e.nivel : '🔒') + '</span><span class="est">' + est + '</span></button>';
  }
  function abrirPanelHeroes() {
    vistos().tropasDia = hoyTexto();
    var orden = { legendario: 0, raro: 1, comun: 2 };
    var lista = HEROES.slice().sort(function (a, b) { return (estado.heroes[b.id] ? 1 : 0) - (estado.heroes[a.id] ? 1 : 0) || orden[a.rareza] - orden[b.rareza]; });
    var html = subtabsHeroes('heroes') + '<p class="nota">' + T('heroes_txt') + ' <b>' + T('equipo_n', { n: estado.equipo.length }) + '</b></p>' +
      '<div class="heroes-grid">' + lista.map(tarjetaHeroe).join('') + '</div>' +
      '<div class="carta" style="margin-top:10px"><h3>🦸 ' + T('reclutar') + '</h3><p class="nota">' + T('reclutar_txt') + '</p><div class="stats">' +
      (reclutaGratisHoy() ? '<button class="comprar naranja" data-accion="reclutar" data-n="gratis">' + T('reclutar_gratis') + '</button>' : botonGemas(RECLUTAR.uno, 'reclutar', 'data-n="1"', '×1')) +
      botonGemas(RECLUTAR.diez, 'reclutar', 'data-n="10"', '×10') + '</div></div>';
    abrirPanel(T('p_heroes'), html, { tipo: 'heroes' });
  }
  // ---------- EQUIPO DE LOS HÉROES: 6 espacios, cada pieza con rareza y nivel ----------
  var TIPOS_EQ = ['arma', 'casco', 'pechera', 'guantes', 'botas', 'amuleto'];
  var EQ = {
    arma: { icono: '⚔️', dano: 6 }, casco: { icono: '⛑️', vida: 60 }, pechera: { icono: '🛡️', vida: 90, def: 0.02 },
    guantes: { icono: '🧤', danoP: 0.03 }, botas: { icono: '🥾', vida: 40, vel: 0.03 }, amuleto: { icono: '📿', recarga: 0.03 }
  };
  var MULT_RAREZA_EQ = { comun: 1, raro: 1.8, legendario: 3 }, EQ_NIVEL_MAX = 20, EQ_MAX_PIEZAS = 60;
  function piezas() { return estado.eqItems || (estado.eqItems = []); }
  function nombrePieza(p) { return T('eq_' + p.t) + ' ' + T('eq_r_' + p.r); }
  function valorPieza(p, stat) { var b = EQ[p.t][stat] || 0; return b * MULT_RAREZA_EQ[p.r] * (1 + 0.12 * (p.n - 1)); }
  function textoPieza(p) {
    var r = [];
    if (EQ[p.t].dano) r.push('⚔ +' + Math.round(valorPieza(p, 'dano')));
    if (EQ[p.t].danoP) r.push('⚔ +' + Math.round(valorPieza(p, 'danoP') * 100) + '%');
    if (EQ[p.t].vida) r.push('❤ +' + Math.round(valorPieza(p, 'vida')));
    if (EQ[p.t].def) r.push('🛡 +' + Math.round(valorPieza(p, 'def') * 100) + '%');
    if (EQ[p.t].vel) r.push('🏃 +' + Math.round(valorPieza(p, 'vel') * 100) + '%');
    if (EQ[p.t].recarga) r.push('⏱ -' + Math.round(valorPieza(p, 'recarga') * 100) + '%');
    return r.join(' ');
  }
  function puntosPieza(p) { return MULT_RAREZA_EQ[p.r] * (1 + 0.12 * (p.n - 1)); }
  function piezasDe(id) { return piezas().filter(function (p) { return p.h === id; }); }
  function bonosEquipo(id) {
    var b = { dano: 0, danoP: 0, vida: 0, def: 0, vel: 0, recarga: 0 };
    piezasDe(id).forEach(function (p) { for (var k in b) b[k] += valorPieza(p, k); });
    b.def = Math.min(0.5, b.def); b.recarga = Math.min(0.5, b.recarga);
    return b;
  }
  function darPieza(tipo, rareza) {
    if (piezas().length >= EQ_MAX_PIEZAS) { var floja = piezas().filter(function (p) { return !p.h; }).sort(function (a, b) { return puntosPieza(a) - puntosPieza(b); })[0]; if (floja) piezas().splice(piezas().indexOf(floja), 1); else return null; }
    var p = { i: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: tipo || TIPOS_EQ[Math.floor(Math.random() * 6)], r: rareza || 'comun', n: 1, h: null };
    piezas().push(p);
    consejoTemporal(T('eq_nueva', { n: nombrePieza(p) }));
    return p;
  }
  function rarezaAlAzar(nivel) { var r = Math.random(); return r < 0.03 + nivel * 0.006 ? 'legendario' : r < 0.25 + nivel * 0.02 ? 'raro' : 'comun'; }
  function costoMejoraPieza(p) { var m = MULT_RAREZA_EQ[p.r]; return { oro: Math.round(60 * m * Math.pow(p.n, 1.35)), piedra: Math.round(20 * m * p.n) }; }
  function oroAlFundir(p) { return Math.round(40 * MULT_RAREZA_EQ[p.r] * p.n); }
  function equiparPieza(id, i) {
    var p = piezas().filter(function (x) { return x.i === i; })[0]; if (!p) return;
    piezasDe(id).forEach(function (x) { if (x.t === p.t) x.h = null; });
    p.h = id; sonar('martillo');
  }
  function equiparRapido(id) {
    var puso = 0;
    TIPOS_EQ.forEach(function (t) {
      var actual = piezasDe(id).filter(function (p) { return p.t === t; })[0];
      var mejor = piezas().filter(function (p) { return p.t === t && !p.h; }).sort(function (a, b) { return puntosPieza(b) - puntosPieza(a); })[0];
      if (mejor && (!actual || puntosPieza(mejor) > puntosPieza(actual))) { if (actual) actual.h = null; mejor.h = id; puso++; }
    });
    if (!puso) { consejoTemporal(T('eq_nada_que')); sonar('error'); return; }
    sonar('martillo'); consejoTemporal(T('eq_listo'));
    ponerEquipo(); guardar(true); abrirPanelHeroe(id);
  }
  function htmlEquipo(id) {
    var e = estado.heroes[id];
    var h = '<div class="eq-rejilla">' + TIPOS_EQ.map(function (t) {
      var p = piezasDe(id).filter(function (x) { return x.t === t; })[0];
      return '<button class="eq-hueco' + (p ? ' ' + p.r : '') + '" data-accion="eq-hueco" data-id="' + id + '" data-t="' + t + '"' + (e ? '' : ' disabled') + '><span class="eq-ico">' + EQ[t].icono + '</span>' +
        (p ? '<span class="eq-nv">' + p.n + '</span><span class="eq-nom">' + T('eq_' + t) + '</span>' : '<span class="eq-nom vacio">' + T('eq_' + t) + '</span>') + '</button>';
    }).join('') + '</div>';
    var b = bonosEquipo(id), partes = [];
    if (b.dano) partes.push('⚔ +' + Math.round(b.dano)); if (b.danoP) partes.push('⚔ +' + Math.round(b.danoP * 100) + '%'); if (b.vida) partes.push('❤ +' + Math.round(b.vida));
    if (b.def) partes.push('🛡 +' + Math.round(b.def * 100) + '%'); if (b.vel) partes.push('🏃 +' + Math.round(b.vel * 100) + '%'); if (b.recarga) partes.push('⏱ -' + Math.round(b.recarga * 100) + '%');
    h += '<p class="nota">' + T('eq_bonos', { t: partes.join(' · ') || '—' }) + ' · ' + T('eq_tienes', { n: piezas().length }) + '</p>';
    if (e) h += '<div class="hf-fila"><button class="comprar naranja" data-accion="eq-rapido" data-id="' + id + '">' + T('eq_rapido') + '</button><button class="comprar" data-accion="eq-quitar-todo" data-id="' + id + '">' + T('eq_quitar_todo') + '</button></div>';
    return h;
  }
  // ventana para elegir pieza de un espacio
  function abrirHueco(id, t) {
    var v = $('eq-elegir'); if (v) v.remove();
    var actual = piezasDe(id).filter(function (x) { return x.t === t; })[0];
    var lista = piezas().filter(function (p) { return p.t === t && p !== actual; }).sort(function (a, b) { return (a.h ? 1 : 0) - (b.h ? 1 : 0) || puntosPieza(b) - puntosPieza(a); });
    function fila(p, esActual) {
      var c = costoMejoraPieza(p);
      return '<div class="eq-fila ' + p.r + '"><span class="eq-ico">' + EQ[p.t].icono + '</span><div class="ob-txt"><b>' + nombrePieza(p) + ' · ' + T('nivel_corto') + ' ' + p.n + '</b><span>' + textoPieza(p) + (p.h && !esActual ? ' · ' + T('eq_de', { n: NH(p.h) }) : '') + '</span></div><div class="eq-bts">' +
        (esActual ? (p.n < EQ_NIVEL_MAX ? '<button class="comprar mini" data-eq="mejorar" data-i="' + p.i + '" data-costo=\'' + JSON.stringify(c) + '\'>⬆ ' + htmlCosto(c) + '</button>' : '') + '<button class="comprar mini" data-eq="quitar" data-i="' + p.i + '">' + T('eq_quitar') + '</button>'
          : '<button class="comprar mini naranja" data-eq="equipar" data-i="' + p.i + '">' + T('eq_equipar') + '</button>' + (p.h ? '' : '<button class="comprar mini" data-eq="fundir" data-i="' + p.i + '">🔥</button>')) + '</div></div>';
    }
    var d = document.createElement('div'); d.id = 'eq-elegir';
    d.innerHTML = '<div class="ac-caja"><div class="ac-cab"><h3>' + EQ[t].icono + ' ' + T('eq_' + t) + ' · ' + NH(id) + '</h3><button class="cerrar" id="eq-cerrar">✕</button></div>' +
      (actual ? fila(actual, true) : '<p class="nota">' + T('eq_vacio') + '</p>') + '<div class="eq-lista">' + (lista.length ? lista.map(function (p) { return fila(p, false); }).join('') : '<p class="nota">' + T('eq_ninguno') + '</p>') + '</div></div>';
    document.body.appendChild(d);
    $('eq-cerrar').addEventListener('click', function () { d.remove(); abrirPanelHeroe(id); });
    d.addEventListener('click', function (ev) {
      if (ev.target === d) { d.remove(); abrirPanelHeroe(id); return; }
      var b = ev.target.closest('[data-eq]'); if (!b || b.disabled) return;
      var que = b.getAttribute('data-eq'), p = piezas().filter(function (x) { return x.i === b.getAttribute('data-i'); })[0]; if (!p) return;
      if (que === 'equipar') { equiparPieza(id, p.i); ponerEquipo(); guardar(true); d.remove(); abrirPanelHeroe(id); return; }
      if (que === 'quitar') { p.h = null; sonar('click'); ponerEquipo(); guardar(true); d.remove(); abrirPanelHeroe(id); return; }
      if (que === 'mejorar') { if (p.n >= EQ_NIVEL_MAX || !pagar(costoMejoraPieza(p))) return; p.n++; sonar('martillo'); consejoTemporal(T('eq_mejorada', { n: nombrePieza(p), v: p.n }) + ' · ' + T('poder_subio', { n: formatoNumero(calcularPoder()) })); ponerEquipo(); actualizarHUD(); guardar(true); abrirHueco(id, t); return; }
      if (que === 'fundir') {
        var oro = oroAlFundir(p);
        confirmarJuego('🔥 ' + T('eq_fundir'), T('eq_fundir_txt', { n: nombrePieza(p), o: oro }), T('eq_fundir'), function () {
          piezas().splice(piezas().indexOf(p), 1); sumarRecurso('oro', oro); sonar('moneda'); consejoTemporal(T('eq_fundida', { n: nombrePieza(p), o: oro })); guardar(true); abrirHueco(id, t);
        });
      }
    });
  }
  // ---------- HABILIDADES CON NIVEL ----------
  // Poder (activo): nivel 1..5, cada estrella abre un nivel. Talento (pasivo por clase): se abre con 2★, nivel máximo = estrellas - 1.
  var HAB_MAX = 5;
  function nivelHab(id) { var e = estado.heroes[id]; return e ? Math.max(1, e.hab || 1) : 1; }
  function nivelTal(id) { var e = estado.heroes[id]; return e ? (e.tal || 0) : 0; }
  function topeHab(id) { var e = estado.heroes[id]; return e ? Math.min(HAB_MAX, e.estrellas) : 1; }
  function topeTal(id) { var e = estado.heroes[id]; return e ? Math.max(0, Math.min(4, e.estrellas - 1)) : 0; }
  function costoHab(L) { return { oro: 300 * L, perg: 2 * L }; }   // para pasar del nivel L al L+1
  function costoTal(L) { return { oro: 250 * (L + 1), perg: 2 * (L + 1) }; }
  var TALENTOS = {
    infanteria: { icono: '💪', dano: 0.06 },
    arquero: { icono: '🎯', dano: 0.05, alcance: 0.3 },
    magia: { icono: '🔮', recarga: 0.05 },
    guardian: { icono: '🧱', vida: 0.08 }
  };
  function fuerzaHab(L) { return 1 + 0.15 * (L - 1); }
  function recargaHab(id, L) {
    var h = HEROE[id], t = TALENTOS[h.clase], tl = L === undefined ? nivelTal(id) : nivelTal(id);
    var cd = HABILIDADES[h.hab].cd - 0.5 * ((L || nivelHab(id)) - 1);
    if (t.recarga) cd *= 1 - t.recarga * tl;
    cd *= 1 - bonosEquipo(id).recarga;
    return Math.max(3, Math.round(cd * 10) / 10);
  }
  // valores del poder en un nivel (para la batalla y para la vista previa)
  function valoresHab(hab, L) {
    var f = fuerzaHab(L), p = function (x) { return Math.round(x * f) + '%'; };
    switch (hab) {
      case 'grito': return { dur: 5 + (L - 1), filas: [[T('hv_extra'), '+40%'], [T('hv_dur'), (5 + (L - 1)) + ' s']] };
      case 'rayo': return { mult: 2.5 * f, saltos: 4 + Math.floor((L - 1) / 2), filas: [[T('hv_dano'), p(250)], [T('hv_saltos'), 4 + Math.floor((L - 1) / 2)]] };
      case 'canon': return { mult: 6 * f, mult2: 2 * f, filas: [[T('hv_dano'), p(600)], [T('hv_alrededor'), p(200)]] };
      case 'lluvia': return { mult: 2.5 * f, radio: 3.5 + 0.25 * (L - 1), filas: [[T('hv_flecha'), p(250)], [T('hv_radio'), (3.5 + 0.25 * (L - 1)).toFixed(2).replace(/0$/, '')]] };
      case 'bomba': return { mult: 4 * f, radio: 3 + 0.25 * (L - 1), filas: [[T('hv_dano'), p(400)], [T('hv_radio'), (3 + 0.25 * (L - 1)).toFixed(2).replace(/0$/, '')]] };
      case 'escudo': return { dur: 5 + (L - 1), filas: [[T('hv_menos'), '-50%'], [T('hv_dur'), (5 + (L - 1)) + ' s']] };
      case 'golpe': return { mult: 2 * f, mareo: 2 + 0.25 * (L - 1), filas: [[T('hv_dano'), p(200)], [T('hv_mareo'), (2 + 0.25 * (L - 1)) + ' s']] };
      case 'curar': return { cura: 0.25 + 0.05 * (L - 1), filas: [[T('hv_cura'), (25 + 5 * (L - 1)) + '%']] };
    }
    return { filas: [] };
  }
  function filasTalento(clase, L) {
    var t = TALENTOS[clase], r = [];
    if (t.dano) r.push([T('hv_dano_heroe'), '+' + Math.round(t.dano * L * 100) + '%']);
    if (t.alcance) r.push([T('alcance'), '+' + (t.alcance * L).toFixed(1)]);
    if (t.vida) r.push([T('hv_vida_heroe'), '+' + Math.round(t.vida * L * 100) + '%']);
    if (t.recarga) r.push([T('hv_recarga'), '-' + Math.round(t.recarga * L * 100) + '%']);
    return r;
  }
  function tablaPrevia(ahora, luego) {
    return '<div class="hv-tabla">' + ahora.map(function (f, i) {
      var sig = luego && luego[i] ? luego[i][1] : null;
      return '<div class="hv-f"><span>' + f[0] + '</span><b>' + f[1] + '</b>' + (sig !== null && String(sig) !== String(f[1]) ? '<i>→ ' + sig + '</i>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function botonCostoHab(c, accion, id) {
    var ok = (estado.mochila.pergamino || 0) >= c.perg && puedePagar({ oro: c.oro });
    return '<button class="comprar" data-accion="' + accion + '" data-id="' + id + '"' + (ok ? '' : ' disabled') + '>' + T('mejorar') +
      ' <span class="costo-r' + ((estado.mochila.pergamino || 0) >= c.perg ? '' : ' no') + '">📜' + c.perg + '</span>' + htmlCosto({ oro: c.oro }) + '</button>';
  }
  function htmlHabilidades(id) {
    var h = HEROE[id], e = estado.heroes[id], hb = HB(h.hab), L = nivelHab(id), tope = topeHab(id);
    var ahora = valoresHab(h.hab, L).filas.concat([[T('hv_recarga'), recargaHab(id, L) + ' s']]);
    var luego = L < HAB_MAX ? valoresHab(h.hab, L + 1).filas.concat([[T('hv_recarga'), recargaHab(id, L + 1) + ' s']]) : null;
    var html = '<div class="hv-carta"><div class="hv-cab"><span class="hv-ico">' + HABILIDADES[h.hab].icono + '</span><div><b>' + HABILIDADES[h.hab][estado.idioma] + '</b><span class="hv-tipo">' + T('hv_poder') + ' · ' + T('nivel_corto') + ' ' + L + ' / ' + HAB_MAX + '</span></div></div>' +
      '<div class="nota">' + hb.des + '</div>' + tablaPrevia(ahora, luego);
    if (!e) html += '';
    else if (L >= HAB_MAX) html += '<p class="nota"><b>' + T('nivel_max') + '</b></p>';
    else if (L >= tope) html += '<p class="nota aviso-rojo">' + T('hv_necesita', { n: L + 1 }) + '</p>';
    else html += botonCostoHab(costoHab(L), 'hab-subir', id);
    html += '</div>';
    var t = TALENTOS[h.clase], tl = nivelTal(id), tt = topeTal(id);
    html += '<div class="hv-carta' + (tt ? '' : ' cerrado') + '"><div class="hv-cab"><span class="hv-ico">' + t.icono + '</span><div><b>' + T('tal_' + h.clase) + '</b><span class="hv-tipo">' + T('hv_talento') + ' · ' + T('nivel_corto') + ' ' + tl + ' / 4</span></div></div>' +
      '<div class="nota">' + T('tal_' + h.clase + '_txt') + '</div>' + tablaPrevia(filasTalento(h.clase, tl), tl < 4 ? filasTalento(h.clase, tl + 1) : null);
    if (!e) html += '';
    else if (tl >= 4) html += '<p class="nota"><b>' + T('nivel_max') + '</b></p>';
    else if (tl >= tt) html += '<p class="nota aviso-rojo">' + T('hv_necesita', { n: tl + 2 }) + '</p>';
    else html += botonCostoHab(costoTal(tl), 'tal-subir', id);
    html += '</div><p class="nota">📜 ' + T('pergaminos_tienes', { n: estado.mochila.pergamino || 0 }) + '</p>';
    return html;
  }
  function subirHab(id, talento) {
    var e = estado.heroes[id]; if (!e) return;
    var L = talento ? nivelTal(id) : nivelHab(id), tope = talento ? topeTal(id) : topeHab(id);
    if (L >= tope) return;
    var c = talento ? costoTal(L) : costoHab(L);
    if ((estado.mochila.pergamino || 0) < c.perg) { consejoTemporal(T('sin_pergaminos')); sonar('error'); return; }
    if (!pagar({ oro: c.oro })) return;
    estado.mochila.pergamino -= c.perg;
    if (talento) e.tal = L + 1; else e.hab = L + 1;
    sonar('magia');
    consejoTemporal(T('hab_sube', { h: talento ? T('tal_' + HEROE[id].clase) : HABILIDADES[HEROE[id].hab][estado.idioma], n: L + 1 }));
    ponerEquipo(); guardar(true); abrirPanelHeroe(id);
  }
  // ---------- EXPERIENCIA DEL HÉROE ----------
  function expNivel(n) { return Math.round(50 * Math.pow(n, 1.35)); }
  // suma experiencia y sube de nivel solo mientras no llegue al tope de sus estrellas
  function darExp(id, cant) {
    var e = estado.heroes[id]; if (!e) return 0;
    e.exp = (e.exp || 0) + cant;
    var subio = 0, tope = topeNivel(id);
    while (e.nivel < tope && e.exp >= expNivel(e.nivel)) { e.exp -= expNivel(e.nivel); e.nivel++; subio++; }
    if (e.nivel >= tope) e.exp = Math.min(e.exp, expNivel(e.nivel));
    return subio;
  }
  // el botón Mejorar paga con oro lo que falta para el siguiente nivel
  function costoMejorarHeroe(id) {
    var e = estado.heroes[id], falta = 1 - Math.min(1, (e.exp || 0) / expNivel(e.nivel));
    return { oro: Math.max(1, Math.ceil(costoNivelHeroe(id).oro * falta)) };
  }
  function librosQueTienes() { return ['libro_peq', 'libro_gra'].reduce(function (a, k) { return a + ((estado.mochila && estado.mochila[k]) || 0); }, 0); }
  // al ganar una oleada: experiencia para el equipo y fragmentos para uno al azar
  function premioHeroesOleada(n) {
    if (!estado.equipo.length) return;
    var exp = 30 + 12 * n;
    estado.equipo.forEach(function (id) {
      var s = darExp(id, exp);
      if (s) flotar('⬆️ ' + NH(id) + ' ' + T('nivel_corto') + ' ' + estado.heroes[id].nivel, castilloPos.clone().setY(12), 'oro');
    });
    if (Math.random() < 0.35) setTimeout(function () { darPieza(null, rarezaAlAzar(n)); guardar(); }, 2500);
    var suerte = estado.equipo[Math.floor(Math.random() * estado.equipo.length)], fr = Math.min(5, 1 + Math.floor(n / 5));
    estado.heroes[suerte].frag += fr;
    var pg = 1 + Math.floor(n / 10);
    estado.mochila.pergamino = (estado.mochila.pergamino || 0) + pg;
    var lp = 1 + Math.floor(n / 8);
    estado.mochila.libro_peq = (estado.mochila.libro_peq || 0) + lp;
    if (n % 5 === 0) estado.mochila.libro_gra = (estado.mochila.libro_gra || 0) + 1;
    // aceleradores ganados jugando
    estado.mochila.acel_5m = (estado.mochila.acel_5m || 0) + 1;
    if (n % 3 === 0) estado.mochila.acel_15m = (estado.mochila.acel_15m || 0) + 1;
    if (n % 5 === 0) estado.mochila.acel_1h = (estado.mochila.acel_1h || 0) + 1;
    setTimeout(function () { consejoTemporal(T('mat_ganado', { n: lp + (n % 5 === 0 ? 1 : 0) })); }, 4200);
    consejoTemporal(T('heroes_premio', { x: exp, f: fr, n: NH(suerte) }));
  }
  function estrellasHTML(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span class="' + (i <= n ? 'si' : 'no') + '">★</span>'; return s; }
  var pestanaHeroe = 'atrib';
  function abrirPanelHeroe(id) {
    var h = HEROE[id], e = estado.heroes[id], s = statsHeroe(id), hb = HB(h.hab);
    var html = '<button class="volver-mini" data-accion="sub-heroes">' + T('volver') + '</button>' +
      '<div class="hf ' + h.rareza + '"><div class="hf-foto"><div class="hf-visor" id="visor-heroe"></div><span class="rz-cinta">' + T('rareza_' + h.rareza) + '</span></div>' +
      '<div class="hf-datos"><div class="hf-nombre">' + NH(id) + '</div><div class="hf-clase">' + CLASES_HEROE[h.clase] + ' ' + T('clase_' + h.clase) + '</div>' +
      '<div class="hf-est">' + estrellasHTML(e ? e.estrellas : 0) + '</div>';
    if (e) {
      var need = expNivel(e.nivel), ex = Math.min(e.exp || 0, need), tope = topeNivel(id);
      html += '<div class="hf-nv"><b>' + T('nivel_corto') + ' ' + e.nivel + '</b><span>/ ' + tope + '</span></div>' +
        '<div class="hf-barra"><div style="width:' + Math.round(ex / need * 100) + '%"></div><span>' + (e.nivel >= tope ? T('exp_llena') : ex + ' / ' + need + ' EXP') + '</span></div>';
    } else html += '<p class="nota">' + T('bloqueado') + '</p>';
    html += '</div></div>' +
      '<div class="subtabs hf-tabs">' + [['atrib', T('hv_atributos')], ['hab', T('hv_habilidades')], ['equipo', T('hv_equipo')]].map(function (p) { return '<button data-accion="heroe-tab" data-tab="' + p[0] + '" data-id="' + id + '" class="' + (pestanaHeroe === p[0] ? 'activo' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>';
    if (pestanaHeroe === 'equipo') { html += htmlEquipo(id); abrirPanel(NH(id), html, { tipo: 'heroe', id: id }); var nv1 = e ? e.nivel : 1; visorModelo($('visor-heroe'), 'h:' + id + ':' + M.tierHeroe(nv1) + ':' + M.etapaArmadura(nv1) + ':' + M.tieneGLB(id), function () { return M.heroe(h, nv1); }); return; }
    if (pestanaHeroe === 'hab') { html += htmlHabilidades(id); abrirPanel(NH(id), html, { tipo: 'heroe', id: id }); var nv0 = e ? e.nivel : 1; visorModelo($('visor-heroe'), 'h:' + id + ':' + M.tierHeroe(nv0) + ':' + M.etapaArmadura(nv0) + ':' + M.tieneGLB(id), function () { return M.heroe(h, nv0); }); return; }
    html += '<div class="hf-stats"><span>❤ ' + s.vida + '</span><span>⚔ ' + s.dano + '</span><span>🎯 ' + s.alcance + '</span><span>✚ ' + s.cura + '/s</span></div>' +
      '<div class="hf-hab"><b>' + hb.nombre + ' · ' + T('nivel_corto') + ' ' + nivelHab(id) + '</b> <span class="nota">' + T('cada_s', { s: recargaHab(id) }) + '</span><div class="nota">' + hb.des + '</div></div>';
    if (e) {
      var tope2 = topeNivel(id), libros = librosQueTienes();
      html += '<div class="hf-bloque"><div class="hf-tit">⬆️ ' + T('mejorar') + '</div>';
      if (e.nivel < tope2) html += '<div class="hf-mat"><b>' + T('mat_titulo') + '</b>' +
        '<div class="mat-fila"><span>' + T('mat_peq') + '</span><b>×' + ((estado.mochila && estado.mochila.libro_peq) || 0) + '</b></div>' +
        '<div class="mat-fila"><span>' + T('mat_gra') + '</span><b>×' + ((estado.mochila && estado.mochila.libro_gra) || 0) + '</b></div>' +
        (libros ? '' : '<p class="nota aviso-rojo">' + T('mat_falta') + '</p>') + '<p class="nota">' + T('mat_no_tienda') + '</p></div>' +
        '<div class="hf-fila"><button class="comprar morado" data-accion="heroe-libros" data-id="' + id + '"' + (libros ? '' : ' disabled') + '>📘 ' + T('usar_libros') + ' ×' + libros + '</button></div>';
      else if (e.nivel < HEROE_NIVEL_MAX) html += '<p class="nota">' + T('nivel_tope', { n: tope2 }) + '</p>';
      else html += '<p class="nota">' + T('nivel_max') + '</p>';
      html += '</div><div class="hf-bloque"><div class="hf-tit">★ ' + T('estrellas') + '</div>';
      if (e.estrellas < 5) {
        var nf = fragParaEstrella(id);
        html += '<div class="hf-frag">🧩 <div class="hf-barra mini"><div style="width:' + Math.min(100, Math.round(e.frag / nf * 100)) + '%"></div><span>' + e.frag + ' / ' + nf + '</span></div></div>' +
          '<p class="nota">' + T('estrella_da', { a: e.estrellas + 1, n: Math.min(HEROE_NIVEL_MAX, (e.estrellas + 1) * 10) }) + '</p>' +
          '<div class="hf-fila"><button class="comprar naranja" data-accion="heroe-estrella" data-id="' + id + '"' + (e.frag >= nf ? '' : ' disabled') + '>★ ' + T('subir_estrella_c') + '</button>' +
          '<button class="comprar" data-accion="heroe-obtener" data-id="' + id + '">➕ ' + T('obtener_mas') + '</button></div>';
      } else html += '<p class="nota">' + T('estrellas_max') + '</p>';
      var enEq = estado.equipo.indexOf(id) >= 0;
      html += '</div><button class="comprar ' + (enEq ? 'rojo' : '') + '" data-accion="heroe-equipo" data-id="' + id + '">' + (enEq ? T('quitar_equipo') : T('poner_equipo')) + '</button>';
    } else html += '<button class="comprar" data-accion="heroe-obtener" data-id="' + id + '">➕ ' + T('obtener_mas') + '</button>';
    abrirPanel(NH(id), html, { tipo: 'heroe', id: id });
    var nv = e ? e.nivel : 1;
    visorModelo($('visor-heroe'), 'h:' + id + ':' + M.tierHeroe(nv) + ':' + M.etapaArmadura(nv) + ':' + M.tieneGLB(id), function () { return M.heroe(h, nv); });
  }
  function subirNivelHeroe(id) {
    return; // v4.9: los niveles ya no se compran con oro: se usan libros ganados jugando
    var e = estado.heroes[id]; if (!e || e.nivel >= topeNivel(id)) return;
    if (!pagar(costoMejorarHeroe(id))) return;
    e.exp = 0; e.nivel++;
    sonar('listo'); consejoTemporal(T('heroe_sube', { n: NH(id), v: e.nivel }));
    ponerEquipo(); guardar(); abrirPanelHeroe(id);
  }
  // usa libros de experiencia (primero los grandes) hasta llegar al tope de nivel
  function usarLibrosHeroe(id) {
    var e = estado.heroes[id]; if (!e) return;
    var antes = e.nivel, usados = 0;
    ['libro_gra', 'libro_peq'].forEach(function (k) {
      while ((estado.mochila[k] || 0) > 0 && e.nivel < topeNivel(id)) { estado.mochila[k]--; usados++; darExp(id, OBJETOS[k].exp); }
    });
    if (!usados) { consejoTemporal(T('sin_libros')); sonar('error'); return; }
    sonar(e.nivel > antes ? 'listo' : 'magia');
    consejoTemporal(e.nivel > antes ? T('heroe_sube', { n: NH(id), v: e.nivel }) : T('libros_usados', { n: usados }));
    ponerEquipo(); guardar(true); abrirPanelHeroe(id);
  }
  // ---------- OBTENER MÁS FRAGMENTOS ----------
  var CANJE_FRAG = { frag: 10, gemas: 60 }, OFERTA_FRAG = 3;
  function abrirPanelObtener(id) {
    var e = estado.heroes[id], ofertaHoy = estado.ofertaFrag === hoyTexto();
    function fila(icono, tit, des, boton) { return '<div class="ob-fila"><span class="ob-ico">' + icono + '</span><div class="ob-txt"><b>' + tit + '</b><span>' + des + '</span></div>' + boton + '</div>'; }
    var ir = function (a) { return '<button class="comprar mini ir" data-accion="ob-ir" data-a="' + a + '" data-id="' + id + '">' + T('ir') + '</button>'; };
    var html = '<button class="volver-mini" data-accion="heroe-ver" data-id="' + id + '">' + T('volver') + '</button>' +
      '<div class="ob-cab">' + fotoHTML('h_' + id, '🦸') + '<div><b>' + NH(id) + '</b><span class="nota">🧩 ' + (e ? e.frag + ' / ' + (fragParaEstrella(id) || '—') : T('bloqueado')) + '</span></div></div>' +
      fila('🎁', T('ob_oferta'), T('ob_oferta_txt', { n: OFERTA_FRAG }), e ? '<button class="comprar mini naranja" data-accion="ob-oferta" data-id="' + id + '"' + (ofertaHoy ? ' disabled' : '') + '>' + (ofertaHoy ? '✓' : T('reclamar')) + '</button>' : ir('reclutar')) +
      fila('🦸', T('ob_reclutar'), T('ob_reclutar_txt', { n: RECLUTAR.repetido }), ir('reclutar')) +
      fila('⚔️', T('ob_oleadas'), T('ob_oleadas_txt'), ir('oleadas')) +
      fila('📅', T('ob_diario'), T('ob_diario_txt'), ir('diario')) +
      '<p class="nota">' + T('mat_no_tienda') + '</p>';
    abrirPanel(T('obtener_mas'), html, { tipo: 'obtener', id: id });
  }
  function irDesdeObtener(a) {
    if (a === 'reclutar') { abrirPanelHeroes(); setTimeout(function () { $('panel').scrollTop = 99999; }, 30); }
    else if (a === 'oleadas') abrirPanelConquista();
    else if (a === 'diario') abrirPanelMochila();
    else if (a === 'tienda') abrirPanelTienda();
  }
  function ofertaFragmentos(id) {
    var e = estado.heroes[id]; if (!e || estado.ofertaFrag === hoyTexto()) return;
    estado.ofertaFrag = hoyTexto(); e.frag += OFERTA_FRAG;
    sonar('gemas'); consejoTemporal(T('heroe_frag', { f: OFERTA_FRAG, n: NH(id) }));
    guardar(true); abrirPanelObtener(id);
  }
  function canjeFragmentos(id) {
    return; // v4.9: los materiales de héroe no se compran
    var e = estado.heroes[id]; if (!e) return;
    if (!pagar(0, CANJE_FRAG.gemas)) return;
    e.frag += CANJE_FRAG.frag;
    sonar('gemas'); consejoTemporal(T('heroe_frag', { f: CANJE_FRAG.frag, n: NH(id) }));
    guardar(true); abrirPanelObtener(id);
  }
  function subirEstrellaHeroe(id) {
    var e = estado.heroes[id]; if (!e || e.estrellas >= 5) return;
    var nf = fragParaEstrella(id); if (e.frag < nf) return;
    e.frag -= nf; e.estrellas++;
    sonar('victoria'); consejoTemporal(T('heroe_estrella', { n: NH(id), v: e.estrellas }));
    ponerEquipo(); guardar(true); abrirPanelHeroe(id);
  }
  function cambiarEquipo(id) {
    var i = estado.equipo.indexOf(id);
    if (i >= 0) estado.equipo.splice(i, 1);
    else { if (estado.equipo.length >= 3) { consejoTemporal(T('equipo_lleno')); sonar('error'); return; } estado.equipo.push(id); }
    sonar('click'); ponerEquipo(); guardar(); abrirPanelHeroe(id);
  }
  function sacarHeroeAlAzar(mejor) {
    var tot = 0, k;
    for (k in RAREZAS) if (!mejor || k !== 'comun') tot += RAREZAS[k].peso;
    var r = Math.random() * tot, rz = 'comun';
    for (k in RAREZAS) { if (mejor && k === 'comun') continue; r -= RAREZAS[k].peso; if (r <= 0) { rz = k; break; } }
    var de = HEROES.filter(function (h) { return h.rareza === rz; });
    return de[Math.floor(Math.random() * de.length)].id;
  }
  function reclutar(n) {
    if (oleadaActiva) { consejoTemporal(T('ref_en_oleada')); sonar('error'); return; }
    var cuantos = n === '10' ? 10 : 1;
    if (n === 'gratis') { if (!reclutaGratisHoy()) return; estado.reclutaGratis = hoyTexto(); }
    else if (!pagar(0, cuantos === 10 ? RECLUTAR.diez : RECLUTAR.uno)) return;
    var res = [];
    for (var i = 0; i < cuantos; i++) res.push(sacarHeroeAlAzar(cuantos === 10 && i === 9 && !res.some(function (id) { return HEROE[id].rareza !== 'comun'; })));
    var html = '<div class="heroes-grid reclutados">';
    res.forEach(function (id) {
      var nuevo = !estado.heroes[id];
      if (nuevo) { estado.heroes[id] = { nivel: 1, estrellas: 1, frag: 0 }; cargarModelosHeroes(); } else estado.heroes[id].frag += RECLUTAR.repetido;
      html += '<div class="reclutado">' + tarjetaHeroe(HEROE[id]).replace('data-accion="heroe-ver"', 'data-accion="heroe-ver" tabindex="-1"') +
        '<p class="nota">' + (nuevo ? '<b>' + T('heroe_nuevo', { n: NH(id) }) + '</b>' : T('heroe_frag', { f: RECLUTAR.repetido, n: NH(id) })) + '</p></div>';
    });
    html += '</div><button class="comprar naranja boton-oleada-grande" data-accion="sub-heroes">' + T('volver') + '</button>';
    sonar('magia');
    chispas(castilloPos.clone().setY(8), 0xffe14a, 30, 5);
    guardar(true);
    abrirPanel(T('resultado'), html, { tipo: 'reclutado' });
  }

  // ---------- INVESTIGACIÓN ----------
  var ramaInv = 'crecimiento', filtroInv = 'espadachin';
  function academiaLista() { return slots.filter(function (s) { return s.edificio && s.edificio.tipo === 'academia'; }).sort(function (a, b) { return b.edificio.nivel - a.edificio.nivel; })[0]; }
  function buscarTec(id) { for (var r in INVESTIGACION) for (var k = 0; k < INVESTIGACION[r].length; k++) if (INVESTIGACION[r][k].id === id) return INVESTIGACION[r][k]; return null; }
  function textoTec(t, lv) { var v = t.cada * lv; return D('inv_' + t.id).replace('{v}', t.cada >= 1 ? v : Math.round(v * 100)); }
  function abrirPanelInvestigacion(rama) {
    ramaInv = rama || ramaInv;
    var aca = academiaLista();
    var html = '<div class="subtabs">' + ['crecimiento', 'economia', 'batalla', 'tropas'].map(function (r) {
      return '<button data-accion="investigacion" data-rama="' + r + '" class="' + (r === ramaInv ? 'activo' : '') + '">' + ({ crecimiento: '🌱', economia: '💰', batalla: '⚔️', tropas: '🪖' })[r] + ' ' + T('rama_' + r) + '</button>';
    }).join('') + '</div>';
    if (ramaInv === 'tropas') html += '<div class="subtabs inv-filtro">' + ['espadachin', 'arquero', 'guardian', 'caballeria'].map(function (tp) { return '<button data-accion="inv-filtro" data-tipo="' + tp + '" class="' + (tp === filtroInv ? 'activo' : '') + '">' + TROPAS[tp].icono + ' ' + N(tp) + '</button>'; }).join('') + '</div>';
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
    INVESTIGACION[ramaInv].filter(function (t) { return !t.tropa || t.tropa === filtroInv; }).forEach(function (t) {
      var lv = estado.invest[t.id] || 0, sig = lv + 1;
      html += '<div class="carta compacta" title="' + textoTec(t, 1) + '"><div class="cab"><div class="foto">' + t.icono + '</div><div><h3>' + N('inv_' + t.id) + '</h3></div></div>' +
        '<div class="stats"><span>⭐ ' + lv + '/' + t.max + '</span>' +
        (lv ? '<span>' + T('inv_ahora') + ': ' + textoTec(t, lv) + '</span>' : '') +
        (lv < t.max ? '<span>' + T('inv_siguiente') + ': ' + textoTec(t, sig) + '</span>' : '<span>' + T('nivel_max') + '</span>') + '</div>';
      if (lv < t.max) {
        if (aca && sig > tope) html += '<span class="nota aviso-rojo" style="grid-area:boton">' + T('inv_tope', { n: tope }) + '</span>';
        else html += botonCosto(costoInvestigacion(sig), 'investigar', 'data-id="' + t.id + '"' + (!aca || inv ? ' disabled' : ''), T('investigar') + ' ⏱' + fmtTiempo(tiempoInvestigacion(sig)) + ' · ' + T('poder_sube', { n: PODER_INVEST }) + ' ');
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
    if (inv.id === 'escudos' || /^t_.*_vida$/.test(inv.id)) tropas.forEach(function (u) { if (u.tipo === 'heroe') return; var f = u.vida / u.max; u.max = vidaTropa(u.tipo, u.armadura); u.vida = f * u.max; });
    if (/^t_.*_defensa$/.test(inv.id)) tropas.forEach(function (u) { if (u.tipo === 'heroe' || u.heroeId) return; u.defensa = ARMADURA.defensa * (u.armadura || 0) + bonoTropa(u.tipo, 'defensa'); });
    if (inv.id === 'muros') {
      estado.vidaCastillo += vidaMaxCastillo() - antesCastillo;
      barricadas.forEach(function (b) { if (b.nivel) { var f = b.vida / b.max; b.max = Math.round(BARRICADA.vida[b.nivel - 1] * (1 + bono('muros'))); b.vida = f * b.max; } });
    }
    var aca = academiaLista();
    if (aca) chispas(aca.pos.clone().setY(4), 0x9fc8ff, 20, 4);
    sonar('listo');
    consejoTemporal(T('inv_lista', { n: N('inv_' + inv.id), l: inv.nivel }) + ' · ' + T('poder_subio', { n: formatoNumero(calcularPoder()) }));
    actualizarHUD(); pulso('poder');
    guardar(true);
    if (panelActual && panelActual.tipo === 'investigacion') reabrirPanel();
  }
  // ---------- RELOJES ----------
  function fmtTiempo(seg) {
    var s = Math.max(0, Math.ceil(seg)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    if (h) return h + 'h ' + ('0' + m).slice(-2) + 'm';
    return m + ':' + ('0' + ss).slice(-2);
  }
  function velReal() { return Math.max(velocidad, 0.0001); }
  // Las obras van a tiempo real: el x2 del jugador no las acelera (solo el dueño con su x10)
  function velObras() { return estado.dueno ? velReal() : 1; }
  function gemasParaTerminar(seg) { return Math.max(1, Math.ceil(Math.max(0, seg) / 600) * GEMAS_POR_10MIN); }
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
    posicionarMenuEdif();
    actualizarMision(); actualizarBarraObra(); actualizarCiudadNombre();
    for (var k in relojesDiv) relojesDiv[k].dataset.vivo = '';
    if (!enMenu && !enMundo) {
      slots.forEach(function (s) {
        if (s.obra) ponerReloj('obra' + s.i, s.pos.clone().setY(6), '🔨 ' + fmtTiempo((s.obra.total - s.obra.t) / velObras()));
      });
      if (colaEntreno.length) {
        var cu = cuartelesListos()[0];
        if (cu) ponerReloj('entreno', cu.pos.clone().setY(6.4), '⚔️ ' + fmtTiempo(faltaEntreno()) + ' ×' + colaEntreno.length);
      }
      slots.forEach(function (s) {
        if (!s.edificio || !esCampo(s.edificio.tipo)) return;
        var cap = capacidadCampo(s);
        if ((s.guardado || 0) >= Math.max(1, cap * 0.1)) ponerReloj('rec' + s.i, s.pos.clone().setY(4.2 * ESCALA_TRAMO[tramoNivel(s.edificio.nivel)]), ICONO_RECURSO[EDIFICIOS[s.edificio.tipo].recurso] + ' ' + corto(Math.floor(s.guardado)) + (s.guardado >= cap ? ' ✔' : ''));
      });
      if (!oleadaActiva) cuartelesListos().forEach(function (c) {
        var n = tropasDentroDe(c);
        if (n) ponerReloj('tropas' + c.i, c.pos.clone().setY(4.6), '🛡️ ' + n);
      });
      if (estado.investigando) {
        var ac = academiaLista();
        if (ac) ponerReloj('inv', ac.pos.clone().setY(6.6), '📜 ' + fmtTiempo(faltaInvestigacion()));
      }
      if (estado.obraCastillo) ponerReloj('castillo', new V3(0, 13.6, 0), '🏰 ' + fmtTiempo((estado.obraCastillo.total - estado.obraCastillo.t) / velObras()));
      if (obraMuralla) ponerReloj('muralla', new V3(0, 15, 0), '🧱 ' + fmtTiempo((obraMuralla.total - obraMuralla.t) / velObras()));
    }
    for (var k2 in relojesDiv) if (!relojesDiv[k2].dataset.vivo) relojesDiv[k2].classList.add('oculto');
  }
  // ---------- ATAQUES ENTRE JUGADORES ----------
  function valorTropa(u) { return u.max * 0.5 + u.d.dano * 5 * (1 + bono('espadas') + bonoTropa(u.tipo, 'ataque')) * factorArmas(u.tipo) * (1 + (u.defensa || 0)); }
  function fuerzaEjercito() { return Math.round(tropas.reduce(function (a, u) { return a + valorTropa(u); }, 0)); }
  function defensaReino() {
    var d = vidaMaxCastillo() / 8 + danoCastillo() * 8;
    torresPuerta.forEach(function () { d += (TORRES_PUERTA.dano + estado.muralla * TORRES_PUERTA.danoNivel) * 6; });
    slots.forEach(function (s) { if (s.edificio && s.edificio.tipo === 'torre') d += EDIFICIOS.torre.dano[s.edificio.nivel - 1] * (1 + bono('flechas')) * 6; });
    barricadas.forEach(function (b) { if (b.nivel) d += b.max / 10; });
    if (estado.tropasDefienden !== false) d += fuerzaEjercito() * 0.8;
    return Math.round(d * (1 + vigiaBono() + 0.04 * tecAl('defensa')));
  }
  function botinMaximo(nivel) {
    var n = Math.max(1, nivel || 1);
    return { oro: Math.min(5000, 60 + 30 * n), comida: Math.min(5000, 50 + 25 * n), madera: Math.min(5000, 50 + 25 * n), piedra: Math.min(5000, 20 + 12 * n) };
  }
  var REPARTO_BOTIN = { oro: 0.3, comida: 0.3, madera: 0.25, piedra: 0.15 };
  function botinAtaque(nivel, nCarretas) {
    var base = botinMaximo(nivel), b = {}, cap = (nCarretas || 0) * capCarreta();
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { b[r] = Math.min(50000, Math.round(base[r] * 0.4 + cap * REPARTO_BOTIN[r])); });
    return b;
  }
  function textoBotin(b) { return ['oro', 'comida', 'madera', 'piedra'].filter(function (r) { return b[r]; }).map(function (r) { return '+' + b[r] + ' ' + ICONO_RECURSO[r]; }).join(', ') || '—'; }
  // ---------- FICHA DE CIUDAD: nunca atacar a ciegas ----------
  function datosEspia() {
    var t = {}; tropas.forEach(function (u) { if (!u.heroeId && !u.refuerzo) t[u.tipo] = (t[u.tipo] || 0) + 1; });
    return { nivelJ: nivelJugador(), castillo: estado.castillo || 1, muralla: estado.muralla || 0, tropas: t, heroes: (estado.equipo || []).length };
  }
  function diplomacia(a) {
    if (estado.alianza && a.alianza === estado.alianza) return { k: 'aliada', t: L('Aliada', 'Allied'), c: '#2f7a22' };
    if ((estado.enemigos || {})[a.uid]) return { k: 'enemiga', t: L('Enemiga', 'Enemy'), c: '#c0281e' };
    return { k: 'neutral', t: L('Neutral', 'Neutral'), c: '#6b4422' };
  }
  function ligaDe(poder) {
    if (poder < 2000) return L('Sin rango', 'Unranked');
    return poder < 10000 ? '🥉 ' + L('Liga de Bronce', 'Bronze league') : poder < 50000 ? '🥈 ' + L('Liga de Plata', 'Silver league') : poder < 200000 ? '🥇 ' + L('Liga de Oro', 'Gold league') : '💎 ' + L('Liga de Diamante', 'Diamond league');
  }
  function cerrarFicha() { var f = $('ficha-ciudad'); if (f) f.remove(); if (M3 && M3.verde) M3.verde.visible = false; }
  function abrirFichaCiudad(a) {
    cerrarFicha();
    var c = celdaDe(a.x, a.y); if (M3 && M3.verde) { var pv = posCelda(c.x, c.y); M3.verde.position.set(pv.x, 0.09, pv.z); M3.verde.visible = true; }
    var dp = diplomacia(a), nv = (a.espia && a.espia.nivelJ) || a.nivel || 1, mio = Math.round(calcularPoder()), prot = (a.escudo || 0) > Date.now();
    var mucho = (a.poder || 0) > mio * 1.5;
    var d = document.createElement('div'); d.id = 'ficha-ciudad';
    d.innerHTML = '<div class="fc-caja"><button class="fc-x" id="fc-x">✕</button><div class="fc-cab">🏰 ' + L('Reino de ', '') + escaparHTML(a.nombre) + (estado.idioma === 'en' ? "'s kingdom" : '') + ' <small>(' + c.x + ', ' + c.y + ')</small></div>' +
      '<div class="fc-cuerpo"><div class="fc-retrato">' + escaparHTML(String(a.nombre || '?').charAt(0).toUpperCase()) + '<span>👑</span></div><div class="fc-datos">' +
      '<div class="fc-nombre"><b>' + escaparHTML(a.nombre) + '</b> <span class="fc-nivel">' + L('Nv. ', 'Lv. ') + nv + '</span></div>' +
      '<div class="fc-fila"><span>' + L('Poder', 'Power') + '</span><b>💪 ' + formatoNumero(a.poder || 0) + '</b></div>' +
      '<div class="fc-fila"><span>' + L('Alianza', 'Alliance') + '</span><b>' + (a.alianza ? '[' + escaparHTML(a.alianza) + ']' : L('Ninguna', 'None')) + '</b></div>' +
      '<div class="fc-fila"><span>' + L('Diplomacia', 'Diplomacy') + '</span><b style="color:' + dp.c + '">' + dp.t + '</b></div>' +
      '<div class="fc-fila"><span>' + L('Liga', 'League') + '</span><b>' + ligaDe(a.poder || 0) + '</b></div></div></div>' +
      (prot ? '<p class="fc-aviso">🫧 ' + T('protegido_falta', { t: fmtTiempo((a.escudo - Date.now()) / 1000) }) + '</p>' : '') +
      (dp.k === 'aliada' ? '<p class="fc-aviso verde">🛡️ ' + L('Es de tu alianza: no se puede atacar.', 'It is in your alliance: it cannot be attacked.') + '</p>' : mucho ? '<p class="fc-aviso">⚠️ ' + L('¡Cuidado! Su poder es mucho mayor que el tuyo (' + formatoNumero(mio) + ').', 'Careful! Their power is much higher than yours (' + formatoNumero(mio) + ').') + '</p>' : '') +
      '<div class="fc-botones"><button class="comprar azul" id="fc-espiar">🔍 ' + L('Espiar', 'Scout') + '</button>' +
      (dp.k === 'aliada' ? '<button class="comprar verde" id="fc-reforzar">' + T('ref_reforzar') + '</button>' : '<button class="comprar rojo" id="fc-atacar"' + (prot ? ' disabled' : '') + '>⚔️ ' + L('Atacar', 'Attack') + '</button>') + '</div></div>';
    $('mundo').appendChild(d);
    $('fc-x').addEventListener('click', function () { sonar('click'); cerrarFicha(); });
    d.addEventListener('click', function (ev) { if (ev.target === d) cerrarFicha(); });
    $('fc-espiar').addEventListener('click', function () { espiarCiudad(a, this); });
    var at = $('fc-atacar'); if (at) at.addEventListener('click', function () { sonar('click'); abrirEleccionTropas(a); });
    var rf = $('fc-reforzar'); if (rf) rf.addEventListener('click', function () { sonar('click'); cerrarFicha(); cerrarMundo(); abrirEnviarRefuerzo(a.uid, a.nombre); });
  }
  // espiar: manda un explorador (o paga oro), no empieza batalla y el informe llega al Correo
  var COSTO_ESPIAR = 150;
  function espiarCiudad(a, b) {
    if (!hayCuenta()) { consejoTemporal(T('at_cuenta')); sonar('error'); return; }
    if (estado.alianza && a.alianza === estado.alianza) { consejoTemporal(L('No hace falta espiar a tu alianza.', 'No need to scout your alliance.')); return; }
    var exp = cuentaTipo('explorador');
    if (!exp && !pagar({ oro: COSTO_ESPIAR })) return;
    b.disabled = true; sonar('click');
    consejoTemporal('🔍 ' + (exp ? L('Tu explorador salió hacia ', 'Your scout left for ') : L('Pagaste ' + COSTO_ESPIAR + ' de oro a un espía para ir a ', 'You paid ' + COSTO_ESPIAR + ' gold to a spy to go to ')) + escaparHTML(a.nombre));
    setTimeout(function () {
      var e = a.espia || {}, t = e.tropas || {}, total = 0;
      var filasT = Object.keys(t).filter(function (k) { return TROPAS[k]; }).map(function (k) { total += t[k]; return [TROPAS[k].icono + ' ' + N(k), formatoNumero(t[k])]; });
      var f = fuerzaEjercito(), dd = a.defensa || 0, rec = !dd ? L('No se sabe', 'Unknown') : f > dd * 1.3 ? '😀 ' + L('Vale la pena atacar', 'Worth attacking') : f > dd * 0.85 ? '😐 ' + L('Pelea pareja', 'Even fight') : '😬 ' + L('Mejor no atacar todavía', 'Better not attack yet');
      var filas = [[L('Jugador', 'Player'), escaparHTML(a.nombre) + ' · ' + L('Nv ', 'Lv ') + ((e.nivelJ) || a.nivel || 1)], [T('castillo'), L('Nv ', 'Lv ') + (e.castillo || '?')], [L('Muralla', 'Wall'), L('Nv ', 'Lv ') + (e.muralla !== undefined ? e.muralla : '?')],
        [L('Defensa', 'Defense'), '~' + formatoNumero(Math.round(dd / 100) * 100)], [L('Tropas', 'Troops'), total ? formatoNumero(total) : L('Ninguna a la vista', 'None in sight')]].concat(filasT).concat([[L('Botín posible', 'Possible loot'), textoBotin(botinMaximo(a.nivel || 1))], [L('Tu fuerza', 'Your strength'), formatoNumero(f)], [L('Consejo', 'Advice'), rec]]);
      nuevoCorreo('informes', '🔍 ' + L('Espionaje: ', 'Scout report: ') + a.nombre, L('Explorador', 'Scout'), htmlInforme(filas));
      consejoTemporal('📬 ' + L('El informe de espionaje llegó a tu Correo (Informes).', 'The scout report is in your Mail (Reports).'));
      sonar('moneda'); guardar(true); actualizarBuzon && actualizarBuzon();
      if (b && document.body.contains(b)) b.disabled = false;
    }, 2500);
  }
  // atacar: primero eliges qué tropas van, ves tu poder contra el suyo y confirmas
  function abrirEleccionTropas(a) {
    var no = puedeAtacar(a);
    if (no) { consejoTemporal(no); sonar('error'); return; }
    var tipos = {}; tropas.forEach(function (u) { if (!u.heroeId && !u.refuerzo && !u.invocada) { tipos[u.tipo] = tipos[u.tipo] || { n: 0, v: 0 }; tipos[u.tipo].n++; tipos[u.tipo].v += valorTropa(u); } });
    var caja = $('ficha-ciudad').querySelector('.fc-caja');
    var h = '<button class="fc-x" id="fc-x2">✕</button><div class="fc-cab">⚔️ ' + L('Elige tus tropas', 'Choose your troops') + ' <small>→ ' + escaparHTML(a.nombre) + '</small></div><div class="fc-tropas">';
    Object.keys(tipos).forEach(function (k) { h += '<div class="fc-tr"><span>' + TROPAS[k].icono + ' ' + N(k) + '</span><input type="range" min="0" max="' + tipos[k].n + '" value="' + tipos[k].n + '" data-t="' + k + '"><b id="fc-n-' + k + '">' + tipos[k].n + '</b></div>'; });
    if (!Object.keys(tipos).length) h += '<p class="nota">' + T('at_sin_tropas') + '</p>';
    var libresC = carretasLibres();
    h += '<div class="fc-tr fc-car"><span>' + iconoCarreta() + ' ' + L('Carretas', 'Carts') + ' <small>(' + L('libres ', 'free ') + libresC + ')</small></span><input type="range" min="0" max="' + libresC + '" value="' + Math.min(libresC, 2) + '" id="fc-carretas"' + (libresC ? '' : ' disabled') + '><b id="fc-n-car">' + Math.min(libresC, 2) + '</b></div>' +
      '<p class="nota fc-robo" id="fc-robo"></p>';
    h += '</div><div class="fc-vs"><div><small>' + L('Tu poder', 'Your power') + '</small><b id="fc-mio">0</b></div><span>VS</span><div><small>' + L('Su defensa', 'Their defense') + '</small><b>' + formatoNumero(Math.round((a.defensa || 0) / 100) * 100) + '</b></div></div><p class="fc-aviso" id="fc-dif"></p>' + (((estado.burbujaHasta || 0) > Date.now() || (estado.escudoHasta || 0) > Date.now()) ? '<p class="fc-aviso">🫧 ' + L('Si atacas, pierdes tu protección y tu burbuja.', 'If you attack, you lose your protection and your bubble.') + '</p>' : '') +
      '<div class="fc-botones"><button class="comprar" id="fc-volver">◀ ' + L('Volver', 'Back') + '</button><button class="comprar rojo" id="fc-confirmar">⚔️ ' + L('Confirmar ataque', 'Confirm attack') + '</button></div>';
    caja.innerHTML = h;
    function recalcular() {
      var f = 0;
      caja.querySelectorAll('input[data-t]').forEach(function (r) { var k = r.dataset.t, n = +r.value; $('fc-n-' + k).textContent = n; f += tipos[k].v / tipos[k].n * n; });
      f = Math.round(f); $('fc-mio').textContent = formatoNumero(f);
      var dd = a.defensa || 1, p = f / dd;
      $('fc-dif').textContent = f <= 0 ? L('Elige al menos una tropa.', 'Choose at least one troop.') : p > 1.3 ? '😀 ' + T('at_facil') : p > 0.85 ? '😐 ' + T('at_parejo') : '😬 ' + T('at_dificil') + ' · ' + L('podrías perder tus tropas', 'you could lose your troops');
      var nc = $('fc-carretas') ? +$('fc-carretas').value : 0; $('fc-n-car').textContent = nc;
      $('fc-robo').innerHTML = '💰 ' + L('Puedes robar hasta: ', 'You can steal up to: ') + textoBotin(botinAtaque(a.nivel || 1, nc)) + (nc ? '' : '<br><small>' + L('Sin carretas tus soldados cargan muy poco.', 'Without carts your soldiers carry very little.') + '</small>');
      $('fc-confirmar').disabled = f <= 0; return f;
    }
    caja.querySelectorAll('input[type=range]').forEach(function (r) { r.addEventListener('input', recalcular); });
    if (!Object.keys(tipos).length) { var cr0 = $('fc-carretas'); if (cr0) cr0.disabled = true; }
    recalcular();
    $('fc-x2').addEventListener('click', function () { sonar('click'); cerrarFicha(); });
    $('fc-volver').addEventListener('click', function () { sonar('click'); abrirFichaCiudad(a); });
    $('fc-confirmar').addEventListener('click', function () { var f = recalcular(); if (f <= 0) return; this.disabled = true; var nc = $('fc-carretas') ? +$('fc-carretas').value : 0; cerrarFicha(); realizarAtaque(a, f, nc); });
  }
  function puedeAtacar(a) {
    if (!hayCuenta()) return T('at_cuenta');
    if ((a.escudo || 0) > Date.now()) return T('at_protegido', { t: fmtTiempo((a.escudo - Date.now()) / 1000) });
    if (estado.alianza && a.alianza === estado.alianza) return T('at_aliado');
    var cd = (estado.cdAtaque || {})[a.uid] || 0;
    if (cd > Date.now() && !estado.dueno) return T('at_espera', { t: fmtTiempo((cd - Date.now()) / 1000) });
    if (!tropas.length) return T('at_sin_tropas');
    if ((estado.sinAtacarHasta || 0) > Date.now() && !estado.dueno) return T('tel_no_atacar', { t: fmtTiempo((estado.sinAtacarHasta - Date.now()) / 1000) });
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
      '<button class="comprar rojo boton-oleada-grande" id="btn-atacar-ya">' + T('atacar_ya') + '</button>' + (estado.alianza ? '<button class="comprar mini naranja" id="btn-ped-atk" style="margin-top:6px">' + T('ped_atk_btn') + '</button>' : '') + '</div>';
    $('btn-atacar-ya').addEventListener('click', function () { this.disabled = true; realizarAtaque(a); });
    var bpa = $('btn-ped-atk'); if (bpa) bpa.addEventListener('click', function () { cerrarMundo(); abrirNuevoPedido('tropas', 'atacar'); });
  }
  // ---------- ESCENA DE BATALLA CONTRA OTRO REINO ----------
  // El resultado ya está decidido; la escena muestra a los dos ejércitos chocando.
  function escenaBatalla(a, f, d, gano, alTerminar) {
    var viejo = $('batalla-pvp'); if (viejo) viejo.remove();
    var caja = document.createElement('div'); caja.id = 'batalla-pvp';
    var retr = estado.equipo.slice(0, 3).map(function (id) { return retratos['h_' + id] ? '<img src="' + retratos['h_' + id] + '" alt="">' : ''; }).join('');
    var tipos = {}; tropas.forEach(function (u) { if (!u.heroeId) tipos[u.tipo] = (tipos[u.tipo] || 0) + 1; });
    var mios = Object.keys(tipos).map(function (k) { return '<span>' + (TROPAS[k] ? TROPAS[k].icono : '⚔️') + ' ' + tipos[k] + '</span>'; }).join('');
    var tam = a.nivel <= 4 ? 1 : a.nivel <= 8 ? 2 : 3;
    caja.innerHTML = '<div class="bp-caja"><div class="bp-titulo">⚔️ ' + T('at_batalla') + '</div><div class="bp-arena">' +
      '<div class="bp-lado yo"><div class="bp-retratos">' + (retr || '🛡️') + '</div><b>' + escaparHTML(Cuentas.nombrePublico ? Cuentas.nombrePublico() : T('tu_reino')) + '</b>' +
      '<div class="bp-tropas">' + mios + '</div><div class="bp-barra"><div id="bp-b1"></div></div><span class="bp-num" id="bp-n1">' + formatoNumero(Math.round(f)) + '</span></div>' +
      '<div class="bp-vs"><span>VS</span><div class="bp-choque" id="bp-choque">💥</div></div>' +
      '<div class="bp-lado el"><div class="bp-retratos">' + (a.emoji ? '<span class="bp-emoji">' + a.emoji + '</span>' : retratos[a.retrato || ('mapa_castillo' + tam)] ? '<img src="' + retratos[a.retrato || ('mapa_castillo' + tam)] + '" alt="">' : (a.retrato === null ? '🚩' : '🏰')) + '</div><b>' + escaparHTML(a.nombre) + '</b>' +
      '<div class="bp-tropas"><span>⭐ ' + a.nivel + '</span></div><div class="bp-barra rojo"><div id="bp-b2"></div></div><span class="bp-num" id="bp-n2">' + formatoNumero(Math.round(d)) + '</span></div>' +
      '</div><div class="bp-pie"><button class="comprar mini" id="bp-x2">x2</button><button class="comprar mini" id="bp-saltar">' + T('bp_saltar') + '</button></div><div class="bp-res" id="bp-res"></div></div>';
    document.body.appendChild(caja);
    var dur = 4200, t0 = Date.now(), vel = 1, acum = 0, ult = t0, hecho = false;
    // cuánto le queda a cada uno al final
    var fin1 = gano ? Math.max(0.15, 1 - d / Math.max(f, 1) * 0.7) : 0, fin2 = gano ? 0 : Math.max(0.15, 1 - f / Math.max(d, 1) * 0.7);
    function paso() {
      var ahora = Date.now(); acum += (ahora - ult) * vel; ult = ahora;
      var k = Math.min(1, acum / dur), e = 1 - Math.pow(1 - k, 2);
      var v1 = 1 - (1 - fin1) * e, v2 = 1 - (1 - fin2) * e;
      $('bp-b1').style.width = (v1 * 100) + '%'; $('bp-b2').style.width = (v2 * 100) + '%';
      $('bp-n1').textContent = formatoNumero(Math.round(f * v1)); $('bp-n2').textContent = formatoNumero(Math.round(d * v2));
      var ch = $('bp-choque'); ch.style.transform = 'scale(' + (1 + 0.35 * Math.abs(Math.sin(acum / 90))) + ')';
      if (Math.random() < 0.08 * vel) sonar(Math.random() < 0.5 ? 'golpe' : 'flecha');
      if (k >= 1) return terminar();
    }
    var reloj = setInterval(paso, 50);
    function terminar() {
      if (hecho) return; hecho = true; clearInterval(reloj);
      $('bp-b1').style.width = (fin1 * 100) + '%'; $('bp-b2').style.width = (fin2 * 100) + '%';
      $('bp-choque').textContent = gano ? '🏆' : '💔';
      caja.querySelector('.bp-pie').style.display = 'none';
      alTerminar(function (html) {
        $('bp-res').innerHTML = html + '<button class="comprar naranja boton-oleada-grande" id="bp-volver">' + T('bp_volver') + '</button>';
        $('bp-volver').addEventListener('click', function () { sonar('click'); caja.remove(); });
      });
    }
    $('bp-x2').addEventListener('click', function () { vel = vel === 1 ? 2 : 1; this.textContent = vel === 2 ? 'x1' : 'x2'; this.classList.toggle('naranja', vel === 2); });
    $('bp-saltar').addEventListener('click', function () { acum = dur; paso(); });
  }
  // ---------- ATAQUES CON MARCHA ----------
  // Las tropas salen, tardan en llegar y la batalla se decide al llegar.
  function vigiaBono() { var n = nivelMayor('vigia'); return n ? EDIFICIOS.vigia.defensa[n - 1] : 0; }
  function tiempoMarcha(a) {
    var yo = celdaDe(miLugar().x, miLugar().y), el = celdaDe(a.x || 50, a.y || 50);
    return Math.round(60 + Math.hypot(yo.x - el.x, yo.y - el.y) * 2.2) * 1000;
  }
  var marchas = [], entrantes = [], dejarDeEscuchar = null, resolviendo = {};
  function realizarAtaque(a, fuerzaElegida, nCarretas) {
    var no = puedeAtacar(a);
    if (no) { consejoTemporal(no); sonar('error'); return; }
    nCarretas = Math.max(0, Math.min(nCarretas || 0, carretasLibres()));
    var f = Math.round(fuerzaElegida || fuerzaEjercito()), viaje = tiempoMarcha(a), bm = botinAtaque(a.nivel, nCarretas);
    var doc = { atacante: Cuentas.usuario().uid, atacanteNombre: Cuentas.nombrePublico(), defensor: a.uid, defensorNombre: String(a.nombre).slice(0, 30),
      gano: false, botin: { oro: bm.oro, comida: bm.comida, madera: bm.madera, piedra: bm.piedra }, fuerza: f, defensa: Math.round(a.defensa || 1),
      fecha: Date.now(), llega: Date.now() + viaje, visto: false, resuelto: false, cobrado: false, bajas: 0 };
    sonar('cuerno');
    Cuentas.atacar(doc).then(function (ref) {
      doc.id = ref.id; marchas.push(doc);
      estado.destinos = estado.destinos || {}; estado.destinos[ref.id] = { x: a.x, y: a.y };
      if (nCarretas) { var cv = carretas(), ahoraC = Date.now(); cv.viajes.push({ id: 'va' + ref.id, tipo: 'ataque', de: miLugar(), a: { x: a.x, y: a.y }, sale: ahoraC, llega: ahoraC + viaje, vuelve: ahoraC + 2 * viaje, recursos: null, n: nCarretas, nombre: String(a.nombre || '') }); }
      estado.escudoHasta = 0; estado.burbujaHasta = 0; // atacar quita tu protección (y la burbuja)
      estado.cdAtaque = estado.cdAtaque || {}; estado.cdAtaque[a.uid] = Date.now() + 10 * 60 * 1000;
      guardar(true); publicarAldea(true); actualizarEscudo();
      $('mundo-info').innerHTML = '<div class="carta"><h3>' + T('mar_salen', { n: escaparHTML(a.nombre), t: fmtTiempo(viaje / 1000) }) + '</h3></div>';
      actualizarAlertas();
    }).catch(function () { $('mundo-info').innerHTML = '<div class="carta"><p class="aviso-rojo"><b>' + T('mar_error') + '</b></p></div>'; sonar('error'); });
  }
  // decide la batalla (la misma cuenta para el defensor y para el atacante)
  function decidirAtaque(r, defensa) {
    var res = resolverBatalla(r.fuerza, defensa), b = {};
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (k) { b[k] = Math.floor((r.botin[k] || 0) * res.margen); });
    return { gano: res.gano, botin: b, bajas: Math.round(res.bajas * 100) / 100, defensa: Math.round(defensa), resuelto: true };
  }
  // el atacante: al llegar, si nadie la resolvió, la resuelve con la defensa que el defensor tenía publicada; luego cobra
  function llegarMarcha(m) {
    if (resolviendo[m.id]) return; resolviendo[m.id] = true;
    var paso = m.resuelto ? Promise.resolve(m) : Cuentas.leerAldea(m.defensor).then(function (al) {
      var datos = decidirAtaque(m, Math.max(1, (al && al.defensa) || m.defensa || 1));
      return Cuentas.resolverAtaque(m.id, datos).then(function () { for (var k in datos) m[k] = datos[k]; return m; })
        .catch(function () { return Cuentas.leerAtaque(m.id); });
    });
    paso.then(function (r) {
      if (!r || !r.resuelto) { resolviendo[m.id] = false; return; }
      marchas = marchas.filter(function (x) { return x.id !== m.id; });
      if (r.cancelado) { Cuentas.cobrarAtaque(r.id).catch(function () {}); consejoTemporal(T('mar_cancelada', { n: r.defensorNombre })); sonar('magia'); guardar(true); actualizarAlertas(); return; }
      var caidas = bajasEjercito(r.bajas || 0);
      var destM = (estado.destinos || {})[r.id] || lugarDe(r.defensor), viajeV = Math.max(30000, (r.llega || Date.now()) - (r.fecha || Date.now()));
      estado.regresos = estado.regresos || [];
      if (destM) estado.regresos.push({ id: r.id, de: destM, a: miLugar(), sale: Date.now(), llega: Date.now() + viajeV, botin: r.gano ? r.botin : null, nombre: r.defensorNombre });
      else if (r.gano) ['oro', 'comida', 'madera', 'piedra'].forEach(function (k) { if (r.botin[k]) sumarRecurso(k, r.botin[k]); });
      if (estado.destinos) delete estado.destinos[r.id];
      nuevoCorreo('guerras', L('Ataque a ' + r.defensorNombre + ': ', 'Attack on ' + r.defensorNombre + ': ') + (r.gano ? L('victoria', 'victory') : L('derrota', 'defeat')), Cuentas.nombrePublico(), htmlInforme([[L('Resultado', 'Result'), r.gano ? '🏆 ' + L('Victoria', 'Victory') : '💔 ' + L('Derrota', 'Defeat')], [L('Tu fuerza', 'Your strength'), formatoNumero(r.fuerza)], [L('Su defensa', 'Their defense'), formatoNumero(r.defensa || 0)], [L('Bajas', 'Losses'), caidas]], r.gano ? r.botin : null));
      Cuentas.cobrarAtaque(r.id).catch(function () {});
      guardar(true); actualizarHUD(); actualizarAlertas();
      escenaBatalla({ nombre: r.defensorNombre, nivel: 1 }, r.fuerza, r.defensa, r.gano, function (cb) {
        cb('<h3 class="bp-gran ' + (r.gano ? 'si' : 'no') + '">' + (r.gano ? T('bp_victoria') : T('bp_derrota')) + '</h3><p>' + (r.gano ? T('at_gano', { b: textoBotin(r.botin) }) : T('at_perdio')) + '</p>' + (r.gano && destM ? '<p class="nota">🏇 ' + L('El botín llega cuando vuelvan tus tropas: ', 'The loot arrives when your troops return: ') + fmtTiempo(viajeV / 1000) + '</p>' : '') + '<p class="nota">' + T('at_bajas', { n: caidas }) + '</p>');
      });
    }).catch(function () { resolviendo[m.id] = false; });
  }
  // el defensor: al llegar el ataque, lo resuelve con la defensa que tiene en ese momento
  function llegarAtaque(r) {
    if (resolviendo[r.id]) return; resolviendo[r.id] = true;
    var datos = decidirAtaque(r, Math.max(1, defensaReino()));
    Cuentas.resolverAtaque(r.id, datos).then(function () { setTimeout(function () { revisarAtaques(true); }, 800); })
      .catch(function () { setTimeout(function () { resolviendo[r.id] = false; revisarAtaques(true); }, 5000); });
  }
  var vigilandoUid = null, relojesVigia = [];
  function iniciarVigilancia() {
    if (!hayCuenta()) return;
    var uid = Cuentas.usuario().uid;
    if (dejarDeEscuchar && vigilandoUid === uid) return;
    // cambió la cuenta: se deja de escuchar a la anterior
    if (dejarDeEscuchar) { dejarDeEscuchar(); relojesVigia.forEach(clearInterval); relojesVigia = []; entrantes = []; marchas = []; }
    vigilandoUid = uid;
    dejarDeEscuchar = Cuentas.escucharAtaques(function (lista) {
      var antes = entrantes.map(function (x) { return x.id; });
      entrantes = lista;
      if (lista.some(function (x) { return antes.indexOf(x.id) < 0; })) { sonar('cuerno'); setTimeout(function () { sonar('golpe'); }, 350); }
      actualizarAlertas();
    });
    Cuentas.ataquesEnviados().then(function (l) { marchas = l; actualizarAlertas(); }).catch(function () {});
    relojesVigia.push(setInterval(function () { if (hayCuenta()) Cuentas.ataquesEnviados().then(function (l) { marchas = l; }).catch(function () {}); }, 30000));
    relojesVigia.push(setInterval(actualizarAlertas, 1000));
  }
  function actualizarAlertas() {
    var ahora = Date.now();
    entrantes.forEach(function (r) { if (r.llega <= ahora && !r.prueba) llegarAtaque(r); });
    marchas.forEach(function (m) { if (m.resuelto || m.llega <= ahora) llegarMarcha(m); });
    var vivos = entrantes.filter(function (r) { return r.llega > ahora; }).sort(function (a, b) { return a.llega - b.llega; });
    var al = $('alerta-ataque');
    if (vivos.length) {
      if (!al) {
        al = document.createElement('button'); al.id = 'alerta-ataque';
        al.addEventListener('click', function () { sonar('click'); opcionesAtaque(); });
        document.body.appendChild(al);
      }
      var r = vivos[0], vn = nivelMayor('vigia');
      // aviso chiquito arriba a la izquierda: quién ataca y cuánto falta (no tapa la ciudad)
      var h = '<span class="al-nombre">⚔️ ' + escaparHTML(r.atacanteNombre) + (vivos.length > 1 ? ' +' + (vivos.length - 1) : '') + '</span><span class="al-t">⏱ ' + fmtTiempo((r.llega - ahora) / 1000) + '</span>';
      infoAtaque = vn ? T('al_fuerza', { f: formatoNumero(Math.round(r.fuerza / 100) * 100), d: formatoNumero(Math.round(defensaReino())) }) : T('al_sin_vigia');
      if (al.innerHTML !== h) al.innerHTML = h;
    } else if (al) { al.remove(); var oa = $('opciones-ataque'); if (oa) oa.remove(); }
    var mv = marchas.filter(function (m) { return !m.resuelto && m.llega > ahora; }).sort(function (a, b) { return a.llega - b.llega; });
    var mi = $('marcha-info');
    if (mv.length) {
      if (!mi) { mi = document.createElement('div'); mi.id = 'marcha-info'; document.body.appendChild(mi); }
      mi.innerHTML = T('mar_hacia', { n: escaparHTML(mv[0].defensorNombre) }) + ' · <b>' + T('mar_llega', { t: fmtTiempo((mv[0].llega - ahora) / 1000) }) + '</b>' + (mv.length > 1 ? ' · ' + T('al_mas', { n: mv.length - 1 }) : '');
    } else if (mi) mi.remove();
    if (panelActual && panelActual.tipo === 'vigia') pintarVigia();
  }
  // El jugador decide: defender en su ciudad o usar un portal (nunca automático)
  var infoAtaque = '';
  function opcionesAtaque() {
    var v = $('opciones-ataque'); if (v) { v.remove(); return; }
    var d = document.createElement('div'); d.id = 'opciones-ataque';
    d.innerHTML = '<p class="oa-info">' + infoAtaque + '</p><p>' + T('al_decide') + '</p><button class="comprar mini" id="oa-defender">🛡️ ' + T('al_defender') + '</button><button class="comprar mini morado" id="oa-portal">🌀 ' + T('al_portal_corto') + '</button>';
    document.body.appendChild(d);
    $('oa-defender').addEventListener('click', function () { sonar('click'); d.remove(); if (enMundo) entrarCiudad(); cerrarPanel(); cerrarMenuEdif(); cam.meta.copy(CENTRO_REINO); cam.distMeta = distInicial(); });
    $('oa-portal').addEventListener('click', function () { sonar('click'); d.remove(); cerrarPanel(); cerrarMenuEdif(); if (!enMundo) abrirMundo(); setTimeout(function () { consejoTemporal(T('tel_elige_casilla')); }, 400); });
  }
  function abrirPanelVigia() { abrirPanel(T('p_vigia'), '<div id="vigia-lista"></div>', { tipo: 'vigia' }); pintarVigia(); }
  function pintarVigia() {
    var box = $('vigia-lista'); if (!box) return;
    var ahora = Date.now(), vn = nivelMayor('vigia');
    var ent = entrantes.filter(function (r) { return r.llega > ahora; }), sal = marchas.filter(function (m) { return !m.resuelto && m.llega > ahora; });
    var h = '<p class="nota">🛡️ ' + T('at_defensa') + ': <b>' + formatoNumero(Math.round(defensaReino())) + '</b>' + (vn ? ' (' + T('vig_txt', { n: Math.round(vigiaBono() * 100) }) + ')' : '') + '</p>';
    h += '<h3>⚔️ ' + T('vig_entrantes') + '</h3>' + (ent.length ? ent.map(function (r) { return '<div class="ob-fila"><span class="ob-ico">⚔️</span><div class="ob-txt"><b>' + escaparHTML(r.atacanteNombre) + '</b><span>' + T('al_llega', { t: fmtTiempo((r.llega - ahora) / 1000) }) + (vn ? ' · ' + T('at_fuerza') + ' ~' + formatoNumero(Math.round(r.fuerza / 100) * 100) : '') + '</span></div></div>'; }).join('') : '<p class="nota">' + T('vig_nada') + '</p>');
    h += '<h3>🏇 ' + T('vig_salientes') + '</h3>' + (sal.length ? sal.map(function (m) { return '<div class="ob-fila"><span class="ob-ico">🏇</span><div class="ob-txt"><b>' + escaparHTML(m.defensorNombre) + '</b><span>' + T('mar_llega', { t: fmtTiempo((m.llega - ahora) / 1000) }) + '</span></div></div>'; }).join('') : '<p class="nota">' + T('vig_nada') + '</p>');
    if (box.innerHTML !== h) box.innerHTML = h;
  }
  // El defensor revisa si lo atacaron (al entrar y cada minuto)
  var ultimaRevision = 0, revisando = false;
  function revisarAtaques(forzar) {
    if (!hayCuenta() || enMenu || revisando) return;
    if (!forzar && Date.now() - ultimaRevision < 60000) return;
    ultimaRevision = Date.now(); revisando = true;
    iniciarVigilancia();
    iniciarChat();
    Cuentas.ataquesNuevos().then(function (lista) {
      revisando = false;
      lista = lista.filter(function (r) { if (r.cancelado) { Cuentas.marcarVisto(r.id).catch(function () {}); return false; } return r.resuelto !== false; });
      if (!lista.length) return;
      var perdio = false, html = '';
      lista.sort(function (a, b) { return a.fecha - b.fecha; }).forEach(function (r) {
        estado.enemigos = estado.enemigos || {}; if (r.atacante) estado.enemigos[r.atacante] = Date.now();
        html += '<div class="carta" style="margin-bottom:8px"><h3>' + T('rep_te_ataco', { n: escaparHTML(r.atacanteNombre) }) + '</h3>';
        if (r.gano) {
          perdio = true;
          var real = {};
          ['oro', 'comida', 'madera', 'piedra'].forEach(function (k) {
            var q = Math.min(Math.max(0, cantidad(k) - proteccionAlmacen()), r.botin[k] || 0);
            if (!estado.oroInfinito) estado[claveRecurso(k)] = cantidad(k) - q;
            real[k] = q;
          });
          html += '<p class="aviso-rojo">' + T('rep_perdiste', { b: textoBotin(real).replace(/\+/g, '-') }) + '</p>';
        } else html += '<p><b>' + T('rep_resististe') + '</b></p>';
        html += '<p class="nota">' + new Date(r.fecha).toLocaleString() + '</p></div>';
        nuevoCorreo('guerras', L(r.atacanteNombre + ' te atacó: ', r.atacanteNombre + ' attacked you: ') + (r.gano ? L('perdiste', 'you lost') : L('resististe', 'you held')), r.atacanteNombre, htmlInforme([[L('Resultado', 'Result'), r.gano ? '💔 ' + L('Te saquearon', 'You were raided') : '🛡️ ' + L('Resististe', 'You held')], [L('Su fuerza', 'Their strength'), formatoNumero(r.fuerza || 0)], [L('Tu defensa', 'Your defense'), formatoNumero(r.defensa || 0)]]));
        Cuentas.marcarVisto(r.id).catch(function () {});
      });
      // tropas en ON: defienden y algunas mueren (más si se pierde); en OFF no mueren
      if (estado.tropasDefienden !== false) { var muertas = bajasEjercito(perdio ? 0.5 : 0.15); if (muertas) html += '<p class="aviso-rojo">⚔️ ' + T('at_bajas', { n: muertas }) + '</p>'; }
      if (perdio && !protegido()) { estado.escudoHasta = Date.now() + 30 * 60 * 1000; html += '<p class="nota">🛡️ ' + T('rep_escudo') + '</p>'; }
      actualizarHUD(); guardar(true); publicarAldea(true); actualizarEscudo();
      consejoTemporal('📬 ' + L('Tienes un informe nuevo de guerra en el Correo', 'You have a new war report in your Mail'));
      sonar(perdio ? 'derrota' : 'victoria');
    }).catch(function () { revisando = false; });
  }

  // ---------- PROTECCIÓN (escudo) ----------
  // Burbuja / escudo: cubre TODA la ciudad (muralla, edificios y campos), con brillo en el borde
  var cupulaEscudo = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { t: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 p = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); vY = position.y; gl_Position = projectionMatrix * p; }',
      fragmentShader: 'uniform float t; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); float ola = 0.5 + 0.5 * sin(vY * 18.0 - t * 1.6); vec3 c = mix(vec3(0.55,0.85,1.0), vec3(0.95,0.98,1.0), f); gl_FragColor = vec4(c, 0.06 + f * 0.5 + ola * 0.035); }' }));
  (function () { var f = MURALLA_FORMA; cupulaEscudo.position.set(f.cx, 0, f.cz); cupulaEscudo.scale.set(f.rx * 1.42, Math.max(f.rx, f.rz) * 0.55, f.rz * 1.42); })();
  cupulaEscudo.visible = false;
  cupulaEscudo.renderOrder = 5;
  escena.add(cupulaEscudo);
  function burbujaActiva() { return (estado.burbujaHasta || 0) > Date.now(); }
  function fmtLargo(seg) { var d = Math.floor(seg / 86400); return d >= 1 ? d + 'd ' + Math.floor((seg % 86400) / 3600) + 'h' : fmtTiempo(seg); }
  function terminarBurbuja() {
    if (!estado.burbujaHasta) return;
    if ((estado.escudoHasta || 0) <= estado.burbujaHasta + 1000) estado.escudoHasta = 0;
    estado.burbujaHasta = 0;
    consejoTemporal(T('burbuja_perdida')); sonar('error');
    nuevoCorreo('sistema', L('Tu burbuja de protección terminó', 'Your protection bubble ended'), 'Tiny Kingdom', '<p>' + T('burbuja_perdida') + '</p>');
    guardar(true); publicarAldea(true);
  }
  function protegido() { return (estado.escudoHasta || 0) > Date.now(); }
  function actualizarEscudo() {
    if (burbujaActiva() && (estado.castillo || 1) >= BURBUJA.castillo) terminarBurbuja();
    if (estado.burbujaHasta && !burbujaActiva()) estado.burbujaHasta = 0;
    var on = protegido() && !enMenu;
    cupulaEscudo.visible = on;
    $('pill-escudo').classList.toggle('oculto-pill', !on);
    $('pill-escudo').firstChild.textContent = burbujaActiva() ? '🫧' : '🛡️';
    if (on) $('escudo-t').textContent = fmtLargo((estado.escudoHasta - Date.now()) / 1000);
    var bes = document.querySelectorAll('[data-escudo-boton]');
    if (bes.length) {
      if (!protegido()) reabrirPanel();
      else bes.forEach(function (b) { b.textContent = '🛡️ ' + T('escudo_activo_btn', { t: fmtTiempo((estado.escudoHasta - Date.now()) / 1000) }); });
    }
  }
  $('pill-escudo').addEventListener('click', function () { consejoTemporal(burbujaActiva() ? T('burbuja_txt', { t: fmtLargo((estado.burbujaHasta - Date.now()) / 1000), n: BURBUJA.castillo }) : T('escudo_info')); });
  function subtabsHeroes(cual) {
    return '<div class="subtabs"><button data-accion="sub-tropas" class="' + (cual === 'tropas' ? 'activo' : '') + '">⚔️ ' + T('sub_tropas') + '</button>' +
      '<button data-accion="sub-heroes" class="' + (cual === 'heroes' ? 'activo' : '') + '">🦸 ' + T('sub_heroes') + (reclutaGratisHoy() ? ' 🎁' : '') + '</button>' +
      '<button data-accion="sub-invocar" class="' + (cual === 'invocar' ? 'activo' : '') + '">✨ ' + T('sub_invocar') + '</button></div>';
  }
  // ---------- CONQUISTA (oleadas) ----------
  function abrirPanelConquista() {
    vistos().campana = estado.oleada;
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
  // ---------- INVENTARIO: 5 pestañas, cuadrícula, punto rojo solo en lo nuevo ----------
  var pestanaInv = 'recursos';
  var CAT_INV = ['recursos', 'acelerar', 'ingresos', 'equipo', 'otros'];
  var ICONO_CAT_INV = { recursos: '🪙', acelerar: '⏱️', ingresos: '🎁', equipo: '🧰', otros: '📦' };
  function categoriaObjeto(k) { var o = OBJETOS[k] || {}; if (o.da) return 'recursos'; if (o.segundos || o.acelera) return 'acelerar'; if (o.cofre || o.equipo) return 'ingresos'; return 'otros'; }
  function copiaMochila() { var c = {}; for (var k in estado.mochila) if (OBJETOS[k] && estado.mochila[k] > 0) c[k] = estado.mochila[k]; return c; }
  function idsPiezas() { return piezas().map(function (p) { return p.i; }); }
  function vistos() {
    if (!estado.vistos) estado.vistos = { mochila: copiaMochila(), tabs: copiaMochila(), eq: idsPiezas(), eqTab: idsPiezas(), campana: estado.oleada, tropasDia: '', alianza: false, diario: '', diarioTab: '' };
    return estado.vistos;
  }
  // cuántos objetos llegaron desde la foto 'snap' (si gastaste, la foto baja para contar bien lo próximo que llegue)
  function nuevosInvEn(snap, filtro) {
    var n = 0;
    for (var k in snap) if ((estado.mochila[k] || 0) < snap[k]) snap[k] = estado.mochila[k] || 0;
    for (var j in estado.mochila) { if (!OBJETOS[j] || (filtro && !filtro(j))) continue; n += Math.max(0, (estado.mochila[j] || 0) - (snap[j] || 0)); }
    return n;
  }
  function eqNuevas(lista) { return piezas().filter(function (p) { return lista.indexOf(p.i) < 0; }).length; }
  function contarNuevosInv() { var v = vistos(); return nuevosInvEn(v.mochila) + eqNuevas(v.eq) + (diarioDisponible() && v.diario !== hoyTexto() ? 1 : 0); }
  function puntoTab(c) {
    var v = vistos();
    if (c === 'equipo') return eqNuevas(v.eqTab) > 0;
    var n = nuevosInvEn(v.tabs, function (k) { return categoriaObjeto(k) === c; });
    if (c === 'ingresos' && diarioDisponible() && v.diarioTab !== hoyTexto()) n++;
    return n > 0;
  }
  function marcarTab(c) {
    var v = vistos();
    if (c === 'equipo') { v.eqTab = idsPiezas(); return; }
    for (var k in estado.mochila) if (OBJETOS[k] && categoriaObjeto(k) === c) v.tabs[k] = estado.mochila[k] || 0;
    if (c === 'ingresos') v.diarioTab = hoyTexto();
  }
  function celdaObjeto(k) {
    var o = OBJETOS[k], boton = o.escudo && protegido() ? '<button class="comprar mini" disabled>🛡️ ' + fmtTiempo((estado.escudoHasta - Date.now()) / 1000) + '</button>'
      : '<button class="comprar mini" data-accion="usar" data-obj="' + k + '">' + (o.cofre || o.equipo ? T('abrir') : T('usar')) + '</button>';
    return '<div class="inv-celda" title="' + escaparHTML(D(k)) + '"><span class="inv-ico">' + o.icono + '</span><b class="inv-n">×' + corto(estado.mochila[k]) + '</b><span class="inv-nom">' + N(k) + '</span>' + boton + '</div>';
  }
  function abrirPanelMochila(tab) {
    if (tab) pestanaInv = tab;
    var v = vistos();
    // al entrar al inventario todo cuenta como visto (el número de abajo se borra)
    v.mochila = copiaMochila(); v.eq = idsPiezas(); if (diarioDisponible()) v.diario = hoyTexto();
    var puntos = {}; CAT_INV.forEach(function (c) { puntos[c] = c !== pestanaInv && puntoTab(c); });
    marcarTab(pestanaInv);
    var html = '<div class="subtabs inv-tabs">' + CAT_INV.map(function (c) {
      return '<button data-accion="inv-tab" data-tab="' + c + '" class="' + (c === pestanaInv ? 'activo' : '') + '">' + ICONO_CAT_INV[c] + ' ' + T('inv_tab_' + c) + (puntos[c] ? '<span class="punto-rojo"></span>' : '') + '</button>';
    }).join('') + '</div>';
    var objs = Object.keys(OBJETOS).filter(function (k) { return estado.mochila[k] > 0 && categoriaObjeto(k) === pestanaInv; });
    var celdas = '';
    if (pestanaInv === 'recursos') {
      html += '<p class="nota">' + T('inv_recurso_txt') + '</p>';
      [['oro', 'monedas', '🪙'], ['comida', 'comida', '🍞'], ['madera', 'madera', '🪵'], ['piedra', 'piedra', '🪨'], ['gemas', 'gemas', '💎']].forEach(function (r) {
        celdas += '<div class="inv-celda recurso"><span class="inv-ico">' + r[2] + '</span><b class="inv-n">' + corto(estado[r[1]]) + '</b><span class="inv-nom">' + T('r_' + r[0]) + '</span></div>';
      });
    }
    if (pestanaInv === 'ingresos') html += htmlDiario();
    if (pestanaInv === 'equipo') {
      piezas().slice().sort(function (a, b) { return MULT_RAREZA_EQ[b.r] - MULT_RAREZA_EQ[a.r] || b.n - a.n; }).forEach(function (p) {
        celdas += '<div class="inv-celda rz-' + p.r + '" title="' + escaparHTML(textoPieza(p)) + '"><span class="inv-ico">' + EQ[p.t].icono + '</span><b class="inv-n">' + T('nivel_corto') + ' ' + p.n + '</b><span class="inv-nom">' + nombrePieza(p) + '</span><span class="inv-sub">' + (p.h && HEROE[p.h] ? T('inv_equipada', { n: NH(p.h) }) : T('inv_libre')) + '</span>' +
          (p.n < EQ_NIVEL_MAX ? '<span class="inv-sub poder-mas">' + T('poder_sube', { n: Math.round(PODER_PIEZA * MULT_RAREZA_EQ[p.r]) }) + '</span>' + botonCosto(costoMejoraPieza(p), 'inv-mejorar', 'data-i="' + p.i + '"', '⬆️ ').replace('class="comprar"', 'class="comprar mini"') : '<span class="inv-sub">MAX</span>') + '</div>';
      });
    }
    objs.forEach(function (k) { celdas += celdaObjeto(k); });
    html += celdas ? '<div class="inv-grid">' + celdas + '</div>' : (pestanaInv === 'ingresos' ? '' : '<p class="nota">' + T('inv_vacio_tab') + '</p>');
    abrirPanel(T('p_mochila'), html, { tipo: 'mochila' });
    guardar();
  }
  function mejorarPiezaInv(i) {
    var p = piezas().filter(function (x) { return x.i === i; })[0];
    if (!p || p.n >= EQ_NIVEL_MAX || !pagar(costoMejoraPieza(p))) return;
    p.n++; sonar('martillo'); ponerEquipo(); actualizarHUD();
    consejoTemporal(T('poder_subio', { n: formatoNumero(calcularPoder()) })); pulso('poder');
    guardar(true); reabrirPanel();
  }
  function htmlDiario() {
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
    return html;
  }
  function terminarConGemas(que) {
    if (que === 'invest') {
      var ii = estado.investigando;
      if (!ii) return;
      if (!pagar(0, gemasParaTerminar(faltaInvestigacion() * velReal()))) return;
      ii.t = ii.total; sonar('magia'); consejoTemporal(T('terminado_gemas')); actualizarHUD(); guardar(true);
      return;
    }
    if (que === 'entreno') {
      return; // v4.9: el entrenamiento solo se acelera con aceleradores
      if (!colaEntreno.length) return;
      if (!pagar(0, gemasEntreno())) return;
      while (colaEntreno.length) { var ce = colaEntreno.shift(); crearTropa(ce.tipo, puertaCuartel()); }
      sonar('magia'); consejoTemporal(T('terminado_gemas')); actualizarHUD(); guardar(true); reabrirPanel();
      return;
    }
    var o = que === 'castillo' ? estado.obraCastillo : que === 'muralla' ? obraMuralla : (slots[+String(que).split(':')[1]] || {}).obra;
    if (!o) return;
    var g = gemasParaTerminar((o.total - o.t) / velObras());
    if (!pagar(0, g)) return;
    o.t = o.total;
    sonar('magia');
    consejoTemporal(T('terminado_gemas'));
    actualizarHUD();
    cerrarPanel();
    guardar(true);
  }
  function usarObjeto(k) {
    if (!(estado.mochila[k] > 0)) return;
    var o = OBJETOS[k], premio = null;
    if (o.segundos) { consejoTemporal(T('acel_desde_menu')); sonar('error'); return; }
    if (o.portal === 'elegir') { consejoTemporal(T('tel_elegir')); cerrarPanel(); abrirMundo(); return; }
    if (o.portal === 'azar') { if (portalAlAzar()) { cerrarPanel(); abrirMundo(); } return; }
    if (o.exp || o.pergamino) { consejoTemporal(T('libro_en_heroe')); sonar('error'); return; }
    if (o.escudo) {
      if (protegido()) { consejoTemporal(T('escudo_activo', { t: fmtTiempo((estado.escudoHasta - Date.now()) / 1000) })); sonar('error'); return; }
      estado.escudoHasta = Date.now() + o.escudo * 3600 * 1000;
      estado.mochila[k]--;
      sonar('magia');
      consejoTemporal(T('escudo_usado', { t: fmtTiempo((estado.escudoHasta - Date.now()) / 1000) }));
      guardar(true); publicarAldea(true); actualizarEscudo();
      reabrirPanel();
      return;
    }
    if (o.acelera) {
      var algo = slots.some(function (s) { return s.obra; }) || obraMuralla || colaEntreno.length || estado.investigando;
      if (estado.obraCastillo) algo = true;
      if (!algo) { consejoTemporal(T('nada_acelerar')); sonar('error'); return; }
      if (estado.investigando) estado.investigando.t = Math.min(estado.investigando.total, estado.investigando.t + ACELERADOR_SEG);
      if (estado.obraCastillo) estado.obraCastillo.t = Math.min(estado.obraCastillo.total, estado.obraCastillo.t + ACELERADOR_SEG);
      slots.forEach(function (s) { if (s.obra) s.obra.t = Math.min(s.obra.total, s.obra.t + ACELERADOR_SEG); });
      if (obraMuralla) obraMuralla.t = Math.min(obraMuralla.total, obraMuralla.t + ACELERADOR_SEG);
      // el entrenamiento avanza el mismo tiempo (ya no termina todo de golpe)
      aplicarAcelerador('entreno', ACELERADOR_SEG);
      consejoTemporal(T('acelerador_usado'));
    } else if (o.da) { premio = o.da; }
    else if (o.equipo) { estado.mochila[k]--; darPieza(null, Math.random() < 0.2 ? 'legendario' : 'raro'); sonar('magia'); guardar(true); reabrirPanel(); return; }
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
    html += '</div><h3 style="margin:12px 0 4px">' + T('armaduras_tienda') + '</h3><p class="nota">' + T('armaduras_tienda_txt') + '</p><div class="lista">';
    ['espadachin', 'caballeria', 'arquero', 'guardian'].forEach(function (t) {
      var na = nivelArmadura(t);
      html += '<div class="carta compacta"><div class="cab"><div class="foto">' + fotoHTML(t, TROPAS[t].icono) + '</div><div><h3>' + (na < ARMADURA.max ? T('armadura_para', { n: na + 1, t: N(t) }) : N(t)) + '</h3></div></div>' +
        (na < ARMADURA.max ? '<div class="stats"><span>❤ +' + Math.round(ARMADURA.vida * 100 * (na + 1)) + '%</span><span>🛡️ ' + Math.round(ARMADURA.defensa * 100 * (na + 1)) + '%</span></div>' + botonGemas(ARMADURA.gemas[na], 'armadura-gemas', 'data-tipo="' + t + '"', T('comprar'))
          : '<div class="stats"><span class="nivel-arm">' + T('armadura_max') + '</span></div>') + '</div>';
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
    // cada número solo cuenta lo NUEVO desde la última vez que entraste (y se borra al entrar)
    var v = vistos();
    ponerBadge('badge-conquista', !oleadaActiva && !enMenu && estado.oleada > (v.campana || 0) ? '1' : '');
    ponerBadge('badge-heroes', reclutaGratisHoy() && v.tropasDia !== hoyTexto() ? '1' : '');
    var nn = contarNuevosInv();
    ponerBadge('badge-mochila', nn ? (nn > 99 ? '99+' : nn) : '');
    ponerBadge('badge-alianza', hayCuenta() && !estado.alianza && !v.alianza ? '!' : '');
    actualizarBuzon();
    // pestaña activa
    var act = enMundo ? 'btn-mundo' : !panelActual ? '' : ({ conquista: 'btn-conquista', tropas: 'btn-heroes', invocar: 'btn-heroes', heroes: 'btn-heroes', heroe: 'btn-heroes', reclutado: 'btn-heroes', mochila: 'btn-mochila', tienda: 'btn-tienda', alianza: 'btn-alianza' })[panelActual.tipo] || '';
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
    var nc = estado.castillo || 1, oc = estado.obraCastillo, mej = '';
    if (oc) mej = '<p class="nota"><b>' + T('castillo_subiendo', { n: oc.nivel }) + '</b></p><div class="cola"><div class="barra"><div id="castillo-barra" style="width:' + Math.round(oc.t / oc.total * 100) + '%"></div></div></div><p class="reloj-panel" id="reloj-castillo">⏱ ' + fmtTiempo((oc.total - oc.t) / velObras()) + '</p><div class="obra-botones"><button class="comprar azul" data-accion="acelerar-que" data-que="castillo">⏩ ' + T('mb_acelerar') + '</button>' + botonGemas(gemasParaTerminar((oc.total - oc.t) / velObras()), 'terminar-gemas', 'data-que="castillo"', '⚡ ' + T('terminar_ya')).replace('comprar morado', 'comprar verde') + '</div>';
    else if (nc < NIVEL_MAX) mej = '<div class="sig-nivel"><b>' + L('Siguiente nivel ', 'Next level ') + (nc + 1) + '</b><p class="nota">' + T('castillo_sube', { n: nc + 1, v: MEJORA_CASTILLO.vida, d: MEJORA_CASTILLO.dano }) + ' · ' + L('abre ' + PARCELAS_POR_NIVEL + ' parcelas más', 'opens ' + PARCELAS_POR_NIVEL + ' more plots') + '</p></div>' +
      tablaRequisitos(costoCastillo(nc + 1), requisitosObra('castillo', nc + 1).concat(filasTrabajos('castillo', nc + 1)), tiempoCastillo(nc + 1)) +
      botonesObra(costoCastillo(nc + 1), tiempoCastillo(nc + 1), 'mejorar-castillo', 'castillo-ya', '', '⬆️ ' + T('mejorar'), faltaObra('castillo', nc + 1) ? botonFalta(faltaObra('castillo', nc + 1)) : trabajosPendientes('castillo', nc + 1).length ? botonBloqueadoTrabajos(trabajosPendientes('castillo', nc + 1)) : '', 'castillo');
    else mej = '<p class="nota"><b>' + T('nivel_max') + ' ★★★</b></p>';
    var html = '<div class="carta"><div class="cab"><div class="foto">' + fotoHTML('castillo', '🏰') + '</div><div><h3>' + T('castillo_nivel', { n: nc, m: NIVEL_MAX }) + '</h3><p>' + T('castillo_info') + '</p></div></div>' +
      '<p class="nota">🏗️ ' + T('castillo_tope', { n: nc }) + '</p>' + mej +
      '<div class="stats"><span>❤ ' + T('vida') + ' ' + Math.ceil(estado.vidaCastillo) + ' / ' + vidaMaxCastillo() + '</span><span>⚔ ' + T('dano') + ' ' + danoCastillo() + '</span><span>🎯 ' + T('alcance') + ' ' + CASTILLO.alcance + '</span></div></div>' +
      '<p class="nota">🪙 ' + T('impuesto', { n: IMPUESTO.oro, s: IMPUESTO.cada }) + '</p>' +
      '<div class="lista" style="margin-top:10px">' + htmlMuralla() + '</div>' +
      (estado.muralla ? '<p class="nota">🏹 <b>' + T('torres_puerta') + ':</b> ' + T('torres_puerta_txt') + ' (⚔ ' + Math.round((TORRES_PUERTA.dano + estado.muralla * TORRES_PUERTA.danoNivel) * (1 + bono('flechas'))) + ')</p>' : '');
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
  $('pill-gemas').addEventListener('click', function () { if (enMenu) return; var bt = $('btn-tienda'); if (bt) bt.click(); });
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
  // ---------- BUZÓN: las novedades llegan aquí (ya no tapan el reino al entrar) ----------
  function novedadesLeidas() {
    if (estado.novedadesVistas === VERSION_JUEGO) return true;
    try { return localStorage.getItem('tinykingdom_novedades') === VERSION_JUEGO; } catch (e) { return false; }
  }
  // texto en los dos idiomas (para lo nuevo de esta ronda)
  function L(es, en) { return estado.idioma === 'en' ? en : es; }
  // ---------- CORREO: Guerras, Alianza, Sistema, Informes y Marcados ----------
  var CATS_CORREO = ['guerras', 'alianza', 'sistema', 'informes', 'marcados'];
  var ICONO_CORREO = { guerras: '⚔️', alianza: '🛡️', sistema: '📜', informes: '📋', marcados: '⭐' };
  var pestanaCorreo = 'sistema', correoAbierto = null;
  function nombreCat(c) { return ({ guerras: L('Guerras', 'Wars'), alianza: L('Alianza', 'Alliance'), sistema: L('Sistema', 'System'), informes: L('Informes', 'Reports'), marcados: L('Marcados', 'Starred') })[c]; }
  function correoLista() { return Array.isArray(estado.buzon) ? estado.buzon : (estado.buzon = []); }
  function nuevoCorreo(cat, titulo, de, cuerpo, premio, extra) {
    var m = { id: 'm' + Date.now() + Math.floor(Math.random() * 1000), cat: cat, titulo: titulo, de: de || L('Sistema', 'System'), fecha: Date.now(), cuerpo: cuerpo || '', premio: premio || null, leido: false, reclamado: false, marcado: false };
    if (extra) for (var k in extra) m[k] = extra[k];
    var l = correoLista(); l.unshift(m);
    // como mucho 120 mensajes: se borran los más viejos ya leídos y sin premio pendiente
    while (l.length > 120) { var i = l.length - 1; while (i >= 0 && (l[i].marcado || (l[i].premio && !l[i].reclamado))) i--; if (i < 0) break; l.splice(i, 1); }
    actualizarBuzon();
    return m;
  }
  function sinLeer(cat) { return correoLista().filter(function (m) { return !m.leido && (cat === 'marcados' ? m.marcado : m.cat === cat); }).length; }
  function actualizarBuzon() { var b = $('badge-buzon'); if (b) { var n = correoLista().filter(function (m) { return !m.leido; }).length, t = n ? (n > 99 ? '99+' : String(n)) : ''; if (b.textContent !== t) b.textContent = t; } }
  function fechaCorta(ts) { var d = new Date(ts); return d.toLocaleDateString(estado.idioma === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString(estado.idioma === 'en' ? 'en-US' : 'es-ES', { hour: '2-digit', minute: '2-digit' }); }
  function htmlInforme(filas, botin) {
    return '<div class="casilla-tabla">' + filas.map(function (f) { return '<span>' + f[0] + '</span><b>' + f[1] + '</b>'; }).join('') + '</div>' + (botin ? '<p class="nota">' + textoBotin(botin) + '</p>' : '');
  }
  function textoPremioCorreo(p) { var a = []; ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (p[r]) a.push(ICONO_RECURSO[r] + ' ' + formatoNumero(p[r])); }); if (p.gemas) a.push('💎 ' + p.gemas); if (p.objeto) a.push(OBJETOS[p.objeto].icono + ' ' + N(p.objeto)); if (p.pieza) a.push('🧰 ' + L('Pieza de equipo', 'Gear piece')); if (p.puntos) a.push('🛡️ ' + p.puntos + ' ' + L('puntos de alianza', 'alliance points')); return a.join(' · '); }
  function reclamarCorreo(m) {
    if (!m.premio || m.reclamado) return false;
    var p = m.premio; m.reclamado = true;
    ['oro', 'comida', 'madera', 'piedra'].forEach(function (r) { if (p[r]) sumarRecurso(r, p[r]); });
    if (p.gemas) sumarGemas(p.gemas);
    if (p.objeto) estado.mochila[p.objeto] = (estado.mochila[p.objeto] || 0) + 1;
    if (p.pieza) darPieza(null, p.pieza);
    if (p.puntos) sumarPuntosAlianza(p.puntos);
    return true;
  }
  function abrirCorreo(tab) {
    if (tab) { pestanaCorreo = tab; correoAbierto = null; }
    var lista = correoLista().filter(function (m) { return pestanaCorreo === 'marcados' ? m.marcado : m.cat === pestanaCorreo; });
    var h = '<div class="subtabs correo-tabs">' + CATS_CORREO.map(function (c) { var n = sinLeer(c); return '<button data-accion="mail-tab" data-tab="' + c + '" class="' + (c === pestanaCorreo ? 'activo' : '') + '">' + ICONO_CORREO[c] + ' ' + nombreCat(c) + (n ? ' <span class="mail-n">' + n + '</span>' : '') + '</button>'; }).join('') + '</div>';
    if (!lista.length) h += '<p class="nota">' + L('No hay mensajes aquí.', 'No messages here.') + '</p>';
    h += '<div class="mail-lista">' + lista.map(function (m) {
      var abierto = correoAbierto === m.id, pend = m.premio && !m.reclamado;
      return '<div class="mail' + (m.leido ? '' : ' nuevo') + (abierto ? ' abierto' : '') + '"><div class="mail-cab" data-accion="mail-abrir" data-id="' + m.id + '"><span class="mail-ic">' + ICONO_CORREO[m.cat] + '</span><div class="mail-txt"><b>' + escaparHTML(m.titulo) + '</b><span>' + escaparHTML(m.de) + ' · ' + fechaCorta(m.fecha) + '</span></div>' + (pend ? '<span class="mail-regalo">🎁</span>' : '') +
        '<button class="mail-estrella' + (m.marcado ? ' si' : '') + '" data-accion="mail-marcar" data-id="' + m.id + '">' + (m.marcado ? '★' : '☆') + '</button></div>' +
        (abierto ? '<div class="mail-cuerpo">' + m.cuerpo + (m.premio ? '<p class="mail-premio">🎁 ' + textoPremioCorreo(m.premio) + '</p>' + (m.reclamado ? '<p class="nota">✓ ' + L('Reclamado', 'Claimed') + '</p>' : '<button class="comprar naranja mini" data-accion="mail-reclamar" data-id="' + m.id + '">' + L('Reclamar', 'Claim') + '</button>') : '') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    h += '<div class="mail-botones"><button class="comprar mini rojo" data-accion="mail-borrar">🗑️ ' + L('Eliminar leídos', 'Delete read') + '</button><button class="comprar mini naranja" data-accion="mail-todo">📬 ' + L('Leer y reclamar todo', 'Read and claim all') + '</button></div>';
    abrirPanel('📬 ' + L('Correo', 'Mail'), h, { tipo: 'buzon' });
    actualizarBuzon();
  }
  function accionCorreo(a, b) {
    var id = b.getAttribute('data-id'), m = correoLista().filter(function (x) { return x.id === id; })[0];
    if (a === 'mail-tab') { sonar('click'); abrirCorreo(b.getAttribute('data-tab')); return; }
    if (a === 'mail-abrir' && m) { sonar('click'); correoAbierto = correoAbierto === id ? null : id; m.leido = true; if (m.ver) { estado.novedadesVistas = m.ver; try { localStorage.setItem('tinykingdom_novedades', m.ver); } catch (e) {} } guardar(); abrirCorreo(); return; }
    if (a === 'mail-marcar' && m) { m.marcado = !m.marcado; sonar('click'); guardar(); abrirCorreo(); return; }
    if (a === 'mail-reclamar' && m) { if (reclamarCorreo(m)) { sonar('gemas'); consejoTemporal(T('recibiste', { t: textoPremioCorreo(m.premio) })); } guardar(true); abrirCorreo(); return; }
    if (a === 'mail-todo') {
      var n = 0; correoLista().filter(function (x) { return pestanaCorreo === 'marcados' ? x.marcado : x.cat === pestanaCorreo; }).forEach(function (x) { x.leido = true; if (reclamarCorreo(x)) n++; if (x.ver) estado.novedadesVistas = x.ver; });
      sonar(n ? 'gemas' : 'click'); if (n) consejoTemporal(L('🎁 Reclamaste ' + n + ' recompensa(s)', '🎁 You claimed ' + n + ' reward(s)')); guardar(true); abrirCorreo(); return;
    }
    if (a === 'mail-borrar') {
      confirmarJuego('🗑️ ' + L('Eliminar leídos', 'Delete read'), L('Se borran los mensajes leídos de esta pestaña. Los que tienen recompensa sin reclamar y los marcados no se borran.', 'Read messages in this tab will be deleted. Messages with unclaimed rewards and starred ones are kept.'), L('Eliminar', 'Delete'), function () {
        estado.buzon = correoLista().filter(function (x) { var enTab = pestanaCorreo === 'marcados' ? x.marcado : x.cat === pestanaCorreo; return !(enTab && x.leido && !x.marcado && !(x.premio && !x.reclamado)); });
        sonar('click'); guardar(); abrirCorreo();
      });
    }
  }
  function abrirBuzon() {
    var nueva = !novedadesLeidas();
    try { localStorage.setItem('tinykingdom_novedades', VERSION_JUEGO); } catch (e) {}
    estado.novedadesVistas = VERSION_JUEGO;
    abrirPanel(T('buzon_titulo'), '<div class="carta buzon-msg"><h3>' + (nueva ? '🔴 ' : '') + '📜 ' + T('buzon_nov', { v: VERSION_JUEGO }) + '</h3><ul style="margin:0;padding-left:18px;line-height:1.5">' + T('novedades_lista') + '</ul>' +
      '<p class="nota">✓ ' + T('buzon_leido') + '</p></div>', { tipo: 'buzon' });
    actualizarBuzon(); guardar();
  }
  function mostrarNovedades() { actualizarBuzon(); }
  $('btn-buzon').addEventListener('click', function () { if (enMenu) return; sonar('click'); if (panelActual && panelActual.tipo === 'buzon') { cerrarPanel(); return; } var t = CATS_CORREO.filter(function (c) { return c !== 'marcados' && sinLeer(c); })[0]; abrirCorreo(t || pestanaCorreo); });

  function abrirPanelAjustes() {
    var html = '<div class="lista">' +
      '<div class="carta"><h3>' + T('idioma') + '</h3><div class="stats">' +
      '<button class="comprar' + (estado.idioma === 'es' ? '' : ' morado') + '" data-accion="idioma" data-valor="es">Español</button>' +
      '<button class="comprar' + (estado.idioma === 'en' ? '' : ' morado') + '" data-accion="idioma" data-valor="en">English</button></div></div>' +
      '<div class="carta"><h3>' + T('sonido') + '</h3><button class="comprar" data-accion="sonido">' + (estado.sonido ? '🔊 ON' : '🔇 OFF') + '</button></div>' +
      '<div class="carta"><h3>' + T('musica') + '</h3><button class="comprar" data-accion="musica">' + (musicaOn ? '🎵 ON' : '🔇 OFF') + '</button></div>' +
      '<div class="carta"><h3>' + T('velocidad') + '</h3><button class="comprar" data-accion="velocidad">x' + velocidad + '</button></div>' +
      '<div class="carta"><h3>' + T('calidad') + '</h3><div class="stats"><button class="comprar' + (calidad === 'alta' ? '' : ' morado') + '" data-accion="calidad" data-valor="alta">' + T('calidad_alta') + '</button><button class="comprar' + (calidad === 'baja' ? '' : ' morado') + '" data-accion="calidad" data-valor="baja">' + T('calidad_baja') + '</button></div><p class="nota">' + T('calidad_txt') + '</p></div>' +
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
        '<button class="comprar naranja" data-accion="dueno-obras">🔨 ' + (estado.idioma === 'en' ? 'Finish all builds' : 'Terminar todas las obras') + '</button>' +
        '</div><div style="margin-top:8px"><button class="comprar rojo" data-accion="dueno-salir">' + T('salir_dueno') + '</button></div></div>';
    }
    html += '<div style="margin-top:10px"><button class="comprar rojo" data-accion="borrar">' + T('borrar') + '</button></div>' +
      '<p class="nota" style="text-align:center;opacity:.6"><a href="' + URL_PRIVACIDAD + '" target="_blank" rel="noopener">' + T('privacidad') + '</a> · ' + NOMBRE_JUEGO + ' · v' + VERSION_JUEGO + '</p>';
    abrirPanel(T('p_ajustes'), html, { tipo: 'ajustes' });
  }

  // Botones dentro de los paneles
  $('panel-cuerpo').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-accion');
    if (a === 'cerrar-panel') { cerrarPanel(); return; }
    if (a === 'construir') {
      var tipo = b.getAttribute('data-tipo');
      if (slotElegido !== null && !slots[slotElegido].edificio && !slots[slotElegido].obra) construir(slotElegido, tipo);
      else entrarModoColocar(tipo);
    } else if (a === 'mejorar') mejorar(+b.getAttribute('data-slot'));
    else if (a === 'detalle-construir') { sonar('click'); var tq = b.getAttribute('data-tipo'); if (slotElegido !== null) abrirDetalleConstruir(tq); else entrarModoColocar(tq); }
    else if (a === 'volver-construir') { sonar('click'); abrirPanelConstruir(slotElegido); }
    else if (a === 'construir-ya') { if (slotElegido !== null) construirYa(slotElegido, b.getAttribute('data-tipo')); }
    else if (a === 'mejorar-ya') mejorarYa(+b.getAttribute('data-slot'));
    else if (a === 'castillo-ya') castilloYa();
    else if (a === 'muralla-ya') murallaYa();
    else if (a === 'comprar-mejora') comprarMejora(b.getAttribute('data-que'));
    else if (a === 'acelerar-que') { sonar('click'); abrirAcelerar(b.getAttribute('data-que')); }
    else if (a === 'cuartel-pest') { sonar('click'); pestCuartel = b.getAttribute('data-p'); abrirPanelEdificio(slotElegido); }
    else if (a === 'cuartel-carretas') { sonar('click'); if (edificiosDe('mercado').length) abrirPanelMercado(); else consejoTemporal(L('Construye un Mercado para entrenar carretas.', 'Build a Market to train carts.')); }
    else if (a === 'cuartel-tropa' && faltaTropa(b.getAttribute('data-tipo'))) { sonar('error'); consejoTemporal('🔒 ' + faltaTropa(b.getAttribute('data-tipo'))); }
    else if (a === 'cuartel-tropa') { sonar('click'); var tt = b.getAttribute('data-tipo'); vistaTropa.tipo = tt; vistaTropa.pest = edificioTropa(tt) === 'establo' ? 'establo' : edificioTropa(tt) === 'galeria' ? 'tiro' : 'cuartel'; vistaTropa.rango = null; abrirPanelTropas(); }
    else if (a === 'acelerar-entreno') { sonar('click'); abrirAcelerar('entreno'); }
    else if (a === 'demoler-panel') { var di = +b.getAttribute('data-slot'), sd2 = slots[di]; if (!sd2 || !sd2.edificio) return; cerrarPanel(); confirmarJuego('🧨 ' + T('demoler_titulo', { n: N(sd2.edificio.tipo) }), T('demoler_txt', { v: sd2.edificio.nivel }), T('demoler_si'), function () { demoler(di); }); }
    else if (a === 'muralla') construirMuralla();
    else if (a === 'mejorar-castillo') mejorarCastillo();
    else if (a === 'barricada') entrarModoBarricada();
    else if (a === 'al-crear') crearAlianzaDesdePanel(b);
    else if (a === 'al-unirse') unirseAlianza(b.getAttribute('data-tag'), b);
    else if (a === 'al-salir') salirAlianza(b);
    else if (a === 'al-sec') { alSeccion = b.getAttribute('data-sec') || ''; sonar('click'); pintarHubAlianza(); var pc = $('panel-cuerpo'); if (pc) pc.scrollTop = 0; if (alSeccion === 'territorio') Cuentas.casillas().then(function (cs) { cs.forEach(function (q) { casillasNube[q.id] = q; }); if (alSeccion === 'territorio') pintarHubAlianza(); }).catch(function () {}); }
    else if (a === 'al-reclamar') reclamarRegalos(b.getAttribute('data-id'));
    else if (a === 'al-reclamar-todo') reclamarRegalos(null);
    else if (a === 'al-tienda') comprarTiendaAl(+b.getAttribute('data-i'));
    else if (a === 'al-tec') mejorarTecAl(b.getAttribute('data-k'));
    else if (a === 'al-incentivo') cobrarIncentivo();
    else if (a === 'al-ajustes') cambiarAjustesAl(b);
    else if (a === 'mail-ir') { cerrarPanel(); setTimeout(function () { abrirCorreo(b.getAttribute('data-tab')); }, 50); }
    else if (a === 'al-mapa') { cerrarPanel(); abrirMundo(); }
    else if (a === 'ref-enviar') abrirEnviarRefuerzo(b.getAttribute('data-uid'), b.getAttribute('data-nombre'));
    else if (a === 'ref-mandar') mandarRefuerzo(b);
    else if (a === 'ref-max') { var rg = $('ref-' + b.getAttribute('data-tipo')); if (rg) { rg.value = rg.max; rg.dispatchEvent(new Event('input')); } }
    else if (a === 'ref-pedir') pedirRefuerzos(b);
    else if (a === 'ped-nuevo') abrirNuevoPedido(b.getAttribute('data-tipo'), b.getAttribute('data-motivo'));
    else if (a === 'ped-crear') crearPedido(b);
    else if (a === 'ped-quitar') { b.disabled = true; Cuentas.quitarPedidoId(b.getAttribute('data-id')).then(abrirPanelAlianza).catch(function () { b.disabled = false; }); }
    else if (a === 'ped-tropas') { var pt = pedidosCache.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; if (pt) abrirEnviarRefuerzo(pt.uid, pt.nombre, pt); }
    else if (a === 'ped-donar') { var pd = pedidosCache.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; if (pd) abrirDonar(pd); }
    else if (a === 'ped-mandar') mandarDonacion(b);
    else if (a === 'car-entrenar') entrenarCarretas(+b.getAttribute('data-n') || 1);
    else if (a === 'car-mejorar') mejorarCarretas();
    else if (a === 'ref-quitar-pedido') { b.disabled = true; Cuentas.quitarPedido().then(abrirPanelAlianza).catch(function () { b.disabled = false; }); }
    else if (a === 'ref-devolver') devolverRefuerzo(b.getAttribute('data-id'), b);
    else if (a === 'ref-retirar') retirarRefuerzo(b.getAttribute('data-id'), b);
    else if (a === 'mejorar-barricada') { var bi = +b.getAttribute('data-barr'); if (pagar(costoBarricada(1))) { ponerBarricada(bi, 2); sonar('listo'); cerrarPanel(); guardar(); } }
    else if (a === 'entrenar') entrenar(b.getAttribute('data-tipo'), b.getAttribute('data-n') === 'max' ? 'max' : +(b.getAttribute('data-n') || 1));
    else if (a === 'armadura') mejorarArmadura(b.getAttribute('data-tipo'));
    else if (a === 'armas') forjarArmas(b.getAttribute('data-tipo'), false);
    else if (a === 'armas-gemas') forjarArmas(b.getAttribute('data-tipo'), true);
    else if (a === 'abrir-mercado') abrirPanelMercado();
    else if (a === 'chat-canal') { var cc = b.getAttribute('data-c'); sonar('click'); abrirPanelChat(cc === 'global' ? 'global' : (canalAlianza() || 'al')); }
    else if (a === 'chat-enviar') enviarMensaje();
    else if (a === 'chat-quien') opcionesChat(b);
    else if (a === 'acel-entreno') abrirAcelerar('entreno');
    else if (a === 'abrir-herreria') abrirPanelHerreria();
    else if (a === 'mer-elegir') { mer[b.getAttribute('data-cual')] = b.getAttribute('data-r'); sonar('click'); abrirPanelMercado(); }
    else if (a === 'mer-cambiar') cambiarMercado();
    else if (a === 'mer-enviar') enviarMercado(b);
    else if (a === 'armadura-gemas') mejorarArmadura(b.getAttribute('data-tipo'), true);
    else if (a === 'sub-tropas') abrirPanelTropas();
    else if (a === 'tropa-pest') { vistaTropa.pest = b.getAttribute('data-pest'); vistaTropa.tipo = PESTANAS_TROPA[vistaTropa.pest][0]; vistaTropa.rango = null; vistaTropa.n = 1; sonar('click'); abrirPanelTropas(); }
    else if (a === 'tropa-tipo') { vistaTropa.tipo = b.getAttribute('data-tipo'); vistaTropa.rango = null; vistaTropa.n = 1; sonar('click'); abrirPanelTropas(); }
    else if (a === 'tropa-rango') { vistaTropa.rango = +b.getAttribute('data-r'); sonar('click'); abrirPanelTropas(); }
    else if (a === 'tropa-menos') cambiarCantidad(-1);
    else if (a === 'tropa-mas') cambiarCantidad(1);
    else if (a === 'tropa-max') { vistaTropa.n = Math.max(1, maxEntrenar(vistaTropa.tipo)); refrescarCantidad(); }
    else if (a === 'tropa-ya') entrenarYa(vistaTropa.tipo, vistaTropa.n);
    else if (a === 'investigacion') abrirPanelInvestigacion(b.getAttribute('data-rama') || ramaInv);
    else if (a === 'investigar') empezarInvestigacion(b.getAttribute('data-id'));
    else if (a === 'sub-invocar') abrirPanelInvocar();
    else if (a === 'sub-heroes') abrirPanelHeroes();
    else if (a === 'heroe-ver') { if (!panelActual || panelActual.tipo !== 'obtener') pestanaHeroe = 'atrib'; abrirPanelHeroe(b.getAttribute('data-id')); }
    else if (a === 'heroe-nivel') subirNivelHeroe(b.getAttribute('data-id'));
    else if (a === 'heroe-estrella') subirEstrellaHeroe(b.getAttribute('data-id'));
    else if (a === 'heroe-libros') usarLibrosHeroe(b.getAttribute('data-id'));
    else if (a === 'heroe-tab') { pestanaHeroe = b.getAttribute('data-tab'); sonar('click'); abrirPanelHeroe(b.getAttribute('data-id')); }
    else if (a === 'hab-subir') subirHab(b.getAttribute('data-id'), false);
    else if (a === 'eq-hueco') abrirHueco(b.getAttribute('data-id'), b.getAttribute('data-t'));
    else if (a === 'eq-rapido') equiparRapido(b.getAttribute('data-id'));
    else if (a === 'eq-quitar-todo') { var idq = b.getAttribute('data-id'); piezasDe(idq).forEach(function (p) { p.h = null; }); sonar('click'); ponerEquipo(); guardar(true); abrirPanelHeroe(idq); }
    else if (a === 'tal-subir') subirHab(b.getAttribute('data-id'), true);
    else if (a === 'heroe-obtener') abrirPanelObtener(b.getAttribute('data-id'));
    else if (a === 'ob-ir') irDesdeObtener(b.getAttribute('data-a'));
    else if (a === 'ob-oferta') ofertaFragmentos(b.getAttribute('data-id'));
    else if (a === 'ob-canje') canjeFragmentos(b.getAttribute('data-id'));
    else if (a === 'heroe-equipo') cambiarEquipo(b.getAttribute('data-id'));
    else if (a === 'reclutar') reclutar(b.getAttribute('data-n'));
    else if (a === 'empezar-oleada') { cerrarPanel(); empezarOleada(); }
    else if (a === 'diario') reclamarDiario();
    else if (a === 'usar') usarObjeto(b.getAttribute('data-obj'));
    else if (a.indexOf('mail-') === 0) accionCorreo(a, b);
    else if (a === 'inv-tab') { sonar('click'); abrirPanelMochila(b.getAttribute('data-tab')); }
    else if (a === 'inv-mejorar') mejorarPiezaInv(b.getAttribute('data-i'));
    else if (a === 'inv-tropa') { sonar('click'); filtroInv = b.getAttribute('data-tipo'); abrirPanelInvestigacion('tropas'); }
    else if (a === 'inv-filtro') { sonar('click'); filtroInv = b.getAttribute('data-tipo'); abrirPanelInvestigacion('tropas'); }
    else if (a === 'terminar-gemas') terminarConGemas(b.getAttribute('data-que'));
    else if (a === 'comprar') comprarTienda(+b.getAttribute('data-i'));
    else if (a === 'invocar3') invocarTres();
    else if (a === 'heroe') invocarHeroe();
    else if (a === 'idioma') { estado.idioma = b.getAttribute('data-valor'); aplicarIdioma(); guardarPreferencias(); reabrirPanel(); }
    else if (a === 'sonido') { cambiarSonido(); reabrirPanel(); }
    else if (a === 'musica') { musicaOn = !musicaOn; if (musicaOn) { sonar('click'); arrancarMusica(); } else pararMusica(); guardarPreferencias(); reabrirPanel(); }
    else if (a === 'velocidad') { cambiarVelocidad(); reabrirPanel(); }
    else if (a === 'calidad') { calidad = b.getAttribute('data-valor'); aplicarCalidad(); guardarPreferencias(); reabrirPanel(); }
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
    else if (a === 'dueno-obras') { slots.forEach(function (s) { if (s.obra) s.obra.t = s.obra.total; }); if (obraMuralla) obraMuralla.t = obraMuralla.total; if (estado.obraCastillo) estado.obraCastillo.t = estado.obraCastillo.total; cerrarPanel(); }
    else if (a === 'dueno-salir') { salirModoDueno(); reabrirPanel(); }
    else if (a === 'borrar') { if (window.confirm(T('borrar_ok'))) { cerrarPanel(); empezarPartida(null); guardar(true); } }
  });

  $('panel-cuerpo').addEventListener('input', function (ev) {
    if (ev.target.id === 'tropa-n') { vistaTropa.n = +ev.target.value || 1; refrescarCantidad(); }
    if (ev.target.id === 'mer-n') { mer.n = +ev.target.value || 0; $('mer-num').textContent = mer.n; $('mer-res').textContent = ICONO_RECURSO[mer.da] + ' ' + mer.n + ' → ' + ICONO_RECURSO[mer.recibe] + ' ' + Math.floor(mer.n * tasaMercado()); var bm = document.querySelector('[data-accion="mer-cambiar"]'); if (bm) bm.disabled = !(mer.n > 0 && tasaMercado()); }
    if (ev.target.classList && ev.target.classList.contains('mer-env')) { var rr = ev.target.getAttribute('data-r'); mer.envio[rr] = +ev.target.value || 0; $('mer-env-' + rr).textContent = mer.envio[rr]; }
    if (ev.target.id === 'mer-para') mer.para = ev.target.value;
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
      if (a === 'entrenar' || a === 'tropa-ya') ok = ok && puedeEntrenarTipo(b.getAttribute('data-tipo') || 'espadachin') && tropasOcupadas() < capacidad();
      if (a === 'muralla' || a === 'muralla-ya') ok = ok && !obraMuralla && estado.muralla < NIVEL_MAX;
      if (a === 'mejorar-castillo' || a === 'castillo-ya') ok = ok && !estado.obraCastillo;
      if (a === 'investigar') ok = ok && !estado.investigando && !!academiaLista();
      if (a === 'heroe') ok = ok && !tropas.some(function (u) { return u.tipo === 'heroe'; });
      b.disabled = !ok;
    });
    if (estado.investigando && $('inv-barra')) {
      var ia = academiaLista(), ii = estado.investigando;
      $('inv-barra').style.width = Math.round(Math.min(1, ii.t / ii.total) * 100) + '%';
      $('inv-falta').textContent = '⏱ ' + T('faltan_t', { t: fmtTiempo(faltaInvestigacion()) });
    }
    if ($('reloj-obra')) { var so = slots[+$('reloj-obra').dataset.slot]; if (so && so.obra) $('reloj-obra').textContent = '⏱ ' + fmtTiempo((so.obra.total - so.obra.t) / velObras()); else reabrirPanel(); }
    if ($('reloj-castillo') && estado.obraCastillo) { var ob2 = estado.obraCastillo; $('reloj-castillo').textContent = '⏱ ' + fmtTiempo((ob2.total - ob2.t) / velObras()); $('castillo-barra').style.width = Math.round(ob2.t / ob2.total * 100) + '%'; }
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
      var cg = $('cola-gemas');
      if (cg) {
        if (!colaEntreno.length) cg.innerHTML = '';
        else {
          // solo aceleradores (ganados o del Colmado): ya no se termina al momento con gemas
          if (!cg.firstChild) cg.innerHTML = '<button class="comprar naranja" data-accion="acel-entreno">⏱️ ' + T('acel_cola') + '</button>';
        }
      }
    }
  }

  // ------------------------------------------------------------------
  //  HUD Y CONSEJOS
  // ------------------------------------------------------------------
  function actualizarHUD() {
    $('monedas').textContent = estado.oroInfinito ? '∞' : corto(estado.monedas);
    ['comida', 'madera', 'piedra'].forEach(function (r) { $(r).textContent = estado.oroInfinito ? '∞' : corto(estado[r]); });
    $('poder').textContent = formatoNumero(calcularPoder());
    $('nivel-rey').textContent = nivelJugador();
    var nj = nivelJugador(), x0 = xpParaNivel(nj), x1 = xpParaNivel(nj + 1);
    if ($('xp-relleno')) $('xp-relleno').style.width = Math.round(Math.min(1, ((estado.xp || 0) - x0) / Math.max(1, x1 - x0)) * 100) + '%';
    if ($('xp-barra')) $('xp-barra').title = L('Experiencia: ', 'Experience: ') + formatoNumero((estado.xp || 0) - x0) + ' / ' + formatoNumero(x1 - x0);
    if ($('perfil-nombre')) { var pn = (hayCuenta() ? Cuentas.nombrePublico() : L('Rey', 'King')) + ' · ' + L('Nv ', 'Lv ') + nj; if ($('perfil-nombre').textContent !== pn) $('perfil-nombre').textContent = pn; }
    $('avatar').classList.toggle('dueno', !!estado.dueno);
    $('gemas').textContent = estado.gemasInfinitas ? '∞' : corto(estado.gemas);
    $('tropas').textContent = textoTropas();
    actualizarBotonDefensa(); actualizarPillEntreno();
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
    return (tropasNormales() + her) + (inv ? ' +' + inv + '✨' : '') + (her ? ' 💚' + her : '');
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
    p += estado.muralla * 600 + ((estado.castillo || 1) - 1) * 800;
    for (var ik in estado.invest) p += (estado.invest[ik] || 0) * PODER_INVEST;
    piezas().forEach(function (pz) { p += pz.n * PODER_PIEZA * MULT_RAREZA_EQ[pz.r]; });
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
  botonMenu('btn-heroes', ['tropas', 'invocar', 'heroes', 'heroe', 'reclutado'], function () { abrirPanelTropas(); });
  botonMenu('btn-mochila', ['mochila'], function () { abrirPanelMochila(); });
  botonMenu('btn-tienda', ['tienda'], function () { abrirPanelTienda(); });
  $('btn-ajustes').addEventListener('click', function () { sonar('click'); abrirPanelAjustes(); });
  $('btn-mundo').addEventListener('click', function () { if (enMenu) return; sonar('click'); salirModoColocar(); cerrarPanel(); if (enMundo) entrarCiudad(); else irAlMundo(); });
  $('mundo-volver').addEventListener('click', function () { sonar('click'); entrarCiudad(); });
  $('mision').addEventListener('click', function () { if (!enMenu) tocarMision(); });
  $('bo-acelerar').addEventListener('click', function () { var q = $('barra-obra').dataset.que; if (q && !enMenu) { sonar('click'); abrirAcelerar(q); } });
  $('bo-txt').addEventListener('click', function () { var q = $('barra-obra').dataset.que || ''; if (enMenu) return; sonar('click'); if (q === 'castillo') { enfocar(castillo.position); abrirPanelCastillo(); } else if (q.indexOf('obra:') === 0) { var si = +q.split(':')[1]; enfocar(slots[si].pos); abrirPanelEdificio(si); } });
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
    if (!estado.sonido) pararMusica();
    $('btn-sonido').innerHTML = iconoSonido();
    guardarPreferencias();
    sonar('click');
  }
  function guardarPreferencias(sinPartida) {
    try {
      localStorage.setItem(CLAVE_PREF, JSON.stringify({ idioma: estado.idioma, sonido: estado.sonido, musica: musicaOn, invitado: !!modoInvitado, velocidad: velocidad === 2 ? 2 : 1, calidad: calidad }));
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
    actualizarBotonSalir();
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
    $('pantalla-version').textContent = 'v' + VERSION_JUEGO;
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
    // Sin cartel de bienvenida: con la sesión lista se entra directo al reino.
    // Idioma y cerrar sesión están siempre arriba, junto a los recursos.
    var hayPartida = g && (g.oleada > 1 || g.alianza || g.alLocal || (g.edificios || []).some(function (e) { return e; }));
    empezarPartida(hayPartida ? g : null);
    if (nube && Cuentas.usuario()) consejoTemporal(T('hola', { n: Cuentas.nombre() }) + (esCuentaDueno() ? ' 👑' : ''));
    actualizarBotonSalir();
  }
  function actualizarBotonSalir() {
    var b = $('btn-salir'); if (!b) return;
    var nube = window.Cuentas && Cuentas.disponible(), conCuenta = nube && Cuentas.usuario();
    b.textContent = conCuenta ? '⏻' : '👤';
    b.title = conCuenta ? T('cerrar_sesion') : T('entrar_o_crear');
    b.classList.toggle('oculto', !nube);
  }
  $('btn-salir').addEventListener('click', function () {
    if (enMenu) return;
    sonar('click');
    if (window.Cuentas && Cuentas.usuario()) {
      confirmarJuego('⏻ ' + T('cerrar_sesion'), T('salir_txt'), T('cerrar_sesion'), function () { guardar(true); Cuentas.salir(); });
    } else { guardar(); modoInvitado = false; guardarPreferencias(true); pantallaCuenta(); }
  });
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
      { texto: T('seguir_infinito'), accion: function () { estado.infinito = true; guardar(); ocultarPantalla(); $('btn-oleada').classList.remove('oculto'); actualizarHUD(); } }
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
      } }
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
      s.modelo = s.andamio = s.barra = null; s.edificio = s.obra = null; s.rebote = 1; s.guardado = 0;
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
      estado.heroes = g.heroes || { sol: { nivel: 1, estrellas: 1, frag: 0 } };
      estado.equipo = (g.equipo || ['sol']).filter(function (id) { return estado.heroes[id]; }).slice(0, 3);
      estado.reclutaGratis = g.reclutaGratis || '';
      estado.ofertaFrag = g.ofertaFrag || '';
      estado.casillas = g.casillas || {};
      estado.armas = g.armas || {};
      estado.lugar = g.lugar || null;
      estado.bloqueados = g.bloqueados || [];
      estado.eqItems = g.eqItems || [];
      if (!g.eqRegalo) { estado.eqItems.push({ i: 'r1', t: 'arma', r: 'comun', n: 1, h: null }, { i: 'r2', t: 'casco', r: 'comun', n: 1, h: null }); }
      estado.eqRegalo = true;
      estado.cdCamp = g.cdCamp || {};
      estado.cdAtaque = g.cdAtaque || {};
      estado.logros = g.logros || { recolectas: 0, tropas: 0, campamentos: 0 };
      estado.tropasDefienden = g.tropasDefienden !== false;
      estado.vistos = g.vistos || null;
      estado.novedadesVistas = g.novedadesVistas || '';
      estado.ultimoPortal = g.ultimoPortal || 0;
      estado.burbujaHasta = g.burbujaHasta || 0;
      estado.buzon = Array.isArray(g.buzon) ? g.buzon : [];
      estado.mision = g.mision || 0;
      estado.regresos = g.regresos || [];
      estado.destinos = g.destinos || {};
      estado.enemigos = g.enemigos || {};
      estado.xp = g.xp;
      estado.bestias = g.bestias || {};
      estado.alLocal = g.alLocal || null;
      estado.carretas = g.carretas || { n: CARRETA.inicio, nivel: 1, cola: [], viajes: [] };
      estado.carretas.cola = estado.carretas.cola || []; estado.carretas.viajes = estado.carretas.viajes || [];
      estado.sinAtacarHasta = g.sinAtacarHasta || 0;
      // partidas viejas: el castillo empieza al nivel de su edificio más alto
      var maxEd = Math.max(1, g.muralla || 0); (g.edificios || []).forEach(function (e) { if (e && e.nivel > maxEd) maxEd = e.nivel; });
      estado.castillo = g.castillo || maxEd;
      estado.obraCastillo = g.obraCastillo || null;
      estado.investigando = g.investigando || null;
      estado.diario = g.diario || { ultimo: '', racha: 0 };
      ['comida', 'madera', 'piedra'].forEach(function (r) { estado[r] = typeof g[r] === 'number' ? g[r] : INICIO[r]; });
      (g.barricadas || []).forEach(function (n, i) { if (n && barricadas[i]) ponerBarricada(i, n); });
      estado.heridos = g.heridos || {};
      var eds = (g.edificios || []).slice(), obs = (g.obras || []).slice();
      if (!g.mapa2) {
        // partidas de antes del mapa en cuadrícula: la mina vieja daba piedra (ahora es la cantera)
        eds = eds.map(function (e) { return e && e.tipo === 'mina' ? { tipo: 'cantera', nivel: e.nivel } : e; });
        obs = obs.map(function (o) { return o && o.tipo === 'mina' ? { tipo: 'cantera', nivel: o.nivel, t: o.t, total: o.total } : o; });
        // los campos que estaban dentro de la ciudad se mudan a las parcelas de fuera
        var nE = [], nO = [], libreC = PARCELAS.nCiudad;
        for (var mi = 0; mi < Math.max(eds.length, obs.length); mi++) {
          var e0 = eds[mi], o0 = obs[mi], tp = (e0 && e0.tipo) || (o0 && o0.tipo);
          var destino = tp && esCampo(tp) ? libreC++ : (mi < PARCELAS.nCiudad ? mi : -1);
          if (destino >= 0 && destino < slots.length) { nE[destino] = e0 || null; nO[destino] = o0 || null; }
        }
        eds = nE; obs = nO;
      }
      eds.forEach(function (e, i) { if (e && slots[i] && EDIFICIOS[e.tipo]) ponerEdificio(slots[i], e.tipo, e.nivel); });
      // tiempo que pasó con el juego cerrado (máximo 14 días)
      var cerrado = g.actualizado ? Math.max(0, Math.min(14 * 86400, (Date.now() - g.actualizado) / 1000)) : 0;
      (g.guardados || []).forEach(function (n, i) { if (slots[i] && slots[i].edificio && esCampo(slots[i].edificio.tipo) && g.mapa2) slots[i].guardado = Math.min(capacidadCampo(slots[i]), n || 0); });
      // lo que produjeron los campos con el juego cerrado (hasta llenarse)
      slots.forEach(function (s) { if (s.edificio && esCampo(s.edificio.tipo)) s.guardado = Math.min(capacidadCampo(s), (s.guardado || 0) + ritmoCampo(s) * cerrado); });
      obs.forEach(function (o, i) {
        if (!o || !slots[i] || !EDIFICIOS[o.tipo]) return;
        empezarObra(slots[i], o.tipo, o.nivel);
        slots[i].obra.total = o.total; slots[i].obra.t = Math.min(o.total, (o.t || 0) + cerrado);
      });
      if (estado.obraCastillo) estado.obraCastillo.t = Math.min(estado.obraCastillo.total, estado.obraCastillo.t + cerrado);
      if (g.obraMuralla && g.obraMuralla.nivel === estado.muralla + 1) iniciarObraMuralla(g.obraMuralla.nivel, Math.min(g.obraMuralla.total, (g.obraMuralla.t || 0) + cerrado), g.obraMuralla.total);
      var t = g.tropas || {};
      Object.keys(t).forEach(function (tipo) {
        for (var k = 0; k < t[tipo]; k++) crearTropa(tipo, reunion.clone().add(new V3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4)));
      });
      var iv = g.invocadas || {};
      Object.keys(iv).forEach(function (tipo) { for (var k = 0; k < iv[tipo]; k++) crearTropa(tipo, reunion.clone(), true); });
      // la cola de entrenamiento sigue avanzando con el juego cerrado
      colaEntreno = [];
      (g.colaEntreno || []).forEach(function (q) {
        if (!q || !TROPAS[q[0]] || q[0] === 'heroe') return;
        for (var k = 0; k < Math.min(q[1] || 0, 5000); k++) colaEntreno.push({ tipo: q[0], t: k === 0 ? (q[2] || 0) : 0, total: TROPAS[q[0]].tiempo });
      });
      var avance = cuartelesListos().length ? cerrado * rapidezEntreno() : 0;
      while (colaEntreno.length && avance > 0) {
        var ce = colaEntreno[0], falta = ce.total - ce.t;
        if (avance >= falta) { avance -= falta; colaEntreno.shift(); crearTropa(ce.tipo, reunion.clone()); } else { ce.t += avance; avance = 0; }
      }
      tropas.forEach(guardarDentro);
    }
    if (!g) { estado.burbujaHasta = Date.now() + BURBUJA.dias * 86400000; estado.escudoHasta = Math.max(estado.escudoHasta || 0, estado.burbujaHasta); }
    procesarCarretas(true);
    ponerCastillo();
    andamiosDelCastillo(!!estado.obraCastillo);
    ponerEquipo();
    ponerMuralla(estado.muralla);
    if (typeof estado.xp !== 'number') estado.xp = xpDeProgreso();
    estado.vidaCastillo = vidaMaxCastillo();
    curarHeridos();
    tiempoJuego = 0;
    cam.objetivo.copy(CENTRO_REINO); cam.meta.copy(CENTRO_REINO); cam.vel.set(0, 0, 0); cam.distMeta = distInicial();
    ocultarPantalla();
    $('btn-oleada').classList.remove('oculto');
    vistos(); // foto de lo que ya tienes: los números solo cuentan lo que llegue después
    if (!correoLista().some(function (m) { return m.ver === VERSION_JUEGO; })) { var mv = nuevoCorreo('sistema', T('buzon_nov', { v: VERSION_JUEGO }), 'Tiny Kingdom', '<ul style="margin:0;padding-left:18px;line-height:1.5">' + T('novedades_lista') + '</ul>', null, { ver: VERSION_JUEGO }); if (novedadesLeidas()) mv.leido = true; }
    setTimeout(mostrarNovedades, 700);
    cargarModelosHeroes();
    actualizarParcelas();
    actualizarHUD();
    guardar();
    // la aldea pública se actualiza con la partida de ESTA cuenta, ya cargada
    setTimeout(function () { if (!enMenu) publicarAldea(true); }, 800);
    setTimeout(function () { revisarAtaques(true); }, 2500);
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
  // cola de entrenamiento siempre a la vista
  function actualizarPillEntreno() {
    var p = $('pill-entreno'); if (!p) return;
    if (!colaEntreno.length) { p.classList.add('oculto-pill'); return; }
    p.classList.remove('oculto-pill');
    $('entreno-t').textContent = '×' + colaEntreno.length + ' · ' + fmtTiempo(faltaEntreno());
  }
  $('pill-entreno').addEventListener('click', function () { if (enMenu) return; sonar('click'); abrirPanelTropas(); });
  // ON: las tropas defienden cuando te atacan (y pueden morir). OFF: se quedan guardadas.
  function actualizarBotonDefensa() {
    var b = $('btn-defensa'); if (!b) return;
    var on = estado.tropasDefienden !== false;
    b.textContent = on ? T('def_on') : T('def_off');
    b.classList.toggle('apagado', !on);
    b.title = T('def_titulo') + ': ' + (on ? 'ON' : 'OFF');
  }
  $('btn-defensa').addEventListener('click', function () {
    if (enMenu) return;
    estado.tropasDefienden = estado.tropasDefienden === false;
    sonar('click'); actualizarBotonDefensa();
    consejoTemporal(T(estado.tropasDefienden ? 'def_on_txt' : 'def_off_txt'));
    guardar(true); publicarAldea(true);
  });
  // volver a ver el castillo si la cámara se fue lejos
  // ------------------------------------------------------------------
  //  CHAT: global y de la hermandad, en vivo, con bloquear, reportar y filtro de groserías
  // ------------------------------------------------------------------
  var chat = { canal: 'global', msgs: { }, escucha: {}, visto: {}, ultimoEnvio: 0, uid: null };
  try { chat.visto = JSON.parse(localStorage.getItem('tk_chat_visto') || '{}'); } catch (e) {}
  var GROSERIAS = ['puta', 'puto', 'mierda', 'pendejo', 'pendeja', 'cabron', 'cabrón', 'coño', 'verga', 'culero', 'joder', 'gilipollas', 'maricon', 'maricón', 'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'bastard', 'mamaguevo', 'mamahuevo', 'hijueputa', 'hdp', 'malparido', 'carajo', 'idiota', 'estupido', 'estúpido', 'imbecil', 'imbécil'];
  function filtrarTexto(t) {
    var s = String(t || '');
    GROSERIAS.forEach(function (w) { s = s.replace(new RegExp('(^|[^a-záéíóúñü])(' + w + ')(?=$|[^a-záéíóúñü])', 'gi'), function (m, a, b) { return a + b.charAt(0) + new Array(b.length).join('*'); }); });
    return s;
  }
  function canalAlianza() { return estado.alianza ? 'al_' + estado.alianza : null; }
  function bloqueados() { return estado.bloqueados || (estado.bloqueados = []); }
  // escuchar los dos canales mientras haya cuenta (para el numerito de mensajes nuevos)
  function iniciarChat() {
    if (!hayCuenta()) return;
    var uid = Cuentas.usuario().uid;
    if (chat.uid !== uid) { for (var k in chat.escucha) { try { chat.escucha[k](); } catch (e) {} } chat.escucha = {}; chat.msgs = {}; chat.uid = uid; }
    ['global', canalAlianza()].forEach(function (c) {
      if (!c || chat.escucha[c]) return;
      chat.escucha[c] = Cuentas.escucharChat(c, function (lista) {
        if (lista === null) { chat.msgs[c] = []; return; }
        chat.msgs[c] = lista;
        if (panelActual && panelActual.tipo === 'chat' && chat.canal === c) pintarMensajes(true);
        actualizarBadgeChat();
      });
    });
    // si cambió de hermandad, deja el canal viejo
    Object.keys(chat.escucha).forEach(function (c) { if (c !== 'global' && c !== canalAlianza()) { try { chat.escucha[c](); } catch (e) {} delete chat.escucha[c]; delete chat.msgs[c]; } });
  }
  function nuevosEn(c) {
    var l = chat.msgs[c] || [], v = chat.visto[c] || 0, yo = hayCuenta() ? Cuentas.usuario().uid : '';
    return l.filter(function (m) { return m.fecha > v && m.uid !== yo && bloqueados().indexOf(m.uid) < 0; }).length;
  }
  function actualizarBadgeChat() {
    var n = nuevosEn('global') + (canalAlianza() ? nuevosEn(canalAlianza()) : 0);
    ponerBadge('badge-chat', n ? (n > 9 ? '9+' : n) : '');
  }
  function marcarVistoChat(c) {
    var l = chat.msgs[c] || []; if (!l.length) return;
    chat.visto[c] = l[l.length - 1].fecha;
    try { localStorage.setItem('tk_chat_visto', JSON.stringify(chat.visto)); } catch (e) {}
    actualizarBadgeChat();
  }
  function abrirPanelChat(canal) {
    if (canal) chat.canal = canal;
    if (chat.canal !== 'global' && !canalAlianza()) chat.canal = 'global';
    var html = '<div class="subtabs">' + [['global', '🌍 ' + T('chat_global'), nuevosEn('global')], ['al', '🛡️ ' + T('chat_hermandad'), canalAlianza() ? nuevosEn(canalAlianza()) : 0]].map(function (p) {
      var activo = p[0] === 'global' ? chat.canal === 'global' : chat.canal !== 'global';
      return '<button data-accion="chat-canal" data-c="' + p[0] + '" class="' + (activo ? 'activo' : '') + '">' + p[1] + (p[2] && !activo ? ' <span class="chat-n">' + p[2] + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    if (!hayCuenta()) html += '<p class="nota">' + T('chat_cuenta') + '</p>';
    else if (chat.canal === 'al' || (chat.canal !== 'global' && !canalAlianza())) html += '<p class="nota">' + T('chat_sin_alianza') + '</p>';
    else {
      html += '<div class="chat-lista" id="chat-lista"></div>' +
        '<div class="chat-escribir"><input id="chat-texto" maxlength="200" autocomplete="off" placeholder="' + T('chat_escribe') + '"><button class="comprar naranja" data-accion="chat-enviar">➤</button></div>' +
        '<p class="nota chat-normas">' + T('chat_normas') + (bloqueados().length ? ' · ' + T('chat_bloqueados', { n: bloqueados().length }) : '') + '</p>';
    }
    abrirPanel(T('p_chat'), html, { tipo: 'chat' });
    if (hayCuenta()) { iniciarChat(); pintarMensajes(false); }
    var inp = $('chat-texto');
    if (inp) inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); enviarMensaje(); } });
  }
  function pintarMensajes(nuevo) {
    var box = $('chat-lista'); if (!box) return;
    var c = chat.canal, l = (chat.msgs[c] || []).filter(function (m) { return bloqueados().indexOf(m.uid) < 0; }), yo = Cuentas.usuario().uid;
    var abajo = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
    box.innerHTML = l.length ? l.map(function (m) {
      var mio = m.uid === yo, hora = new Date(m.fecha), hh = ('0' + hora.getHours()).slice(-2) + ':' + ('0' + hora.getMinutes()).slice(-2);
      return '<div class="chat-m' + (mio ? ' mio' : '') + '"><button class="chat-quien" data-accion="chat-quien" data-uid="' + m.uid + '" data-id="' + m.id + '" data-n="' + escaparHTML(m.nombre) + '">' + (mio ? T('chat_tu') : escaparHTML(m.nombre)) + '</button><span class="chat-hora">' + hh + '</span><div class="chat-t">' + escaparHTML(filtrarTexto(m.texto)) + '</div></div>';
    }).join('') : '<p class="nota chat-vacio">' + T('chat_vacio') + '</p>';
    if (!nuevo || abajo) box.scrollTop = box.scrollHeight;
    marcarVistoChat(c);
  }
  function enviarMensaje() {
    var inp = $('chat-texto'); if (!inp) return;
    var texto = inp.value.replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!texto) return;
    if (Date.now() - chat.ultimoEnvio < 3000) { consejoTemporal(T('chat_espera')); sonar('error'); return; }
    chat.ultimoEnvio = Date.now();
    inp.value = '';
    Cuentas.enviarChat(chat.canal, { uid: Cuentas.usuario().uid, nombre: Cuentas.nombrePublico(), texto: texto, fecha: Date.now() })
      .then(function () { sonar('click'); }).catch(function () { inp.value = texto; consejoTemporal(T('chat_error')); sonar('error'); });
  }
  // tocar un nombre: bloquear / reportar (o borrar el mensaje propio)
  function opcionesChat(b) {
    var uid = b.getAttribute('data-uid'), id = b.getAttribute('data-id'), nombre = b.getAttribute('data-n'), yo = Cuentas.usuario().uid;
    var v = $('chat-opciones'); if (v) v.remove();
    var d = document.createElement('div'); d.id = 'chat-opciones';
    var msg = (chat.msgs[chat.canal] || []).filter(function (m) { return m.id === id; })[0];
    d.innerHTML = '<div class="cj-caja"><h3>' + (uid === yo ? T('chat_tu') : escaparHTML(nombre)) + '</h3><div class="cj-botones" style="flex-direction:column">' +
      (uid === yo ? '<button class="comprar rojo" data-co="borrar">🗑️ ' + T('chat_borrar') + '</button>' :
        '<button class="comprar" data-co="bloquear">🚫 ' + T('chat_bloquear') + '</button><button class="comprar rojo" data-co="reportar">🚩 ' + T('chat_reportar') + '</button>') +
      '<button class="comprar" data-co="cerrar">' + T('cancelar') + '</button></div></div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (ev) {
      var o = ev.target.closest('[data-co]');
      if (ev.target === d || (o && o.getAttribute('data-co') === 'cerrar')) { d.remove(); return; }
      if (!o) return;
      var que = o.getAttribute('data-co');
      d.remove();
      if (que === 'borrar') { Cuentas.borrarChat(chat.canal, id).catch(function () {}); return; }
      if (que === 'bloquear') { if (bloqueados().indexOf(uid) < 0) bloqueados().push(uid); guardar(true); consejoTemporal(T('chat_bloqueado', { n: escaparHTML(nombre) })); pintarMensajes(false); actualizarBadgeChat(); return; }
      if (que === 'reportar') {
        Cuentas.reportar({ de: yo, contra: uid, contraNombre: String(nombre).slice(0, 30), texto: String(msg ? msg.texto : '').slice(0, 200), canal: chat.canal.slice(0, 10), mensaje: String(id).slice(0, 40), fecha: Date.now() })
          .then(function () { consejoTemporal(T('chat_reportado', { n: escaparHTML(nombre) })); }).catch(function () { consejoTemporal(T('chat_error')); });
      }
    });
  }
  $('btn-chat').addEventListener('click', function () { if (enMenu) return; sonar('click'); if (panelActual && panelActual.tipo === 'chat') cerrarPanel(); else abrirPanelChat(); });
  $('btn-centrar').addEventListener('click', function () { if (enMenu) return; sonar('click'); if (enMundo) cerrarMundo(); cam.meta.copy(CENTRO_REINO); cam.vel.set(0, 0, 0); cam.distMeta = distInicial(); });
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
      cam.az = AZ_CAM + Math.sin(tiempo * 0.15) * 0.25;
      castillo.userData.banderas.forEach(function (b) { M.ondear(b, tiempo); });
    }
    if (!enMenu) cam.az += (AZ_CAM - cam.az) * Math.min(1, dtReal * 3);
    actualizarCamara(dtReal);
    actualizarCielo(performance.now() / 1000);
    // nubes
    nubes.forEach(function (n) { n.position.x += n.userData.v * dtReal; if (n.position.x > 120) n.position.x = -120; });
    // brillo de terrenos libres
    var b = (Math.sin(performance.now() / 250) + 1) / 2;
    slots.forEach(function (s, i) {
      var libre = !s.edificio && !s.obra;
      var on = (modoColocar && libre && modoColocar !== 'barricada' && s.campo === esCampo(modoColocar) && !cerrada(s)) || slotElegido === i;
      s.terreno.userData.brillo.material.opacity = on ? 0.35 + b * 0.5 : 0;
      if (s.terreno.userData.mas) s.terreno.userData.mas.visible = libre && !cerrada(s);
      // estacas y cuerda: solo en modo construcción
      if (s.terreno.userData.marcas) s.terreno.userData.marcas.visible = !!on;
    });
    slots.forEach(function (s) { if (s.fantasma) s.fantasma.position.y = 0.15 + Math.sin(performance.now() / 300) * 0.12; });
    barricadas.forEach(function (bq) { bq.marca.material.opacity = (modoColocar === 'barricada' && !bq.nivel) ? 0.3 + b * 0.4 : 0; if (bq.fantasma) bq.fantasma.position.y = 0.1 + Math.sin(performance.now() / 300) * 0.1; });
    actualizarRelojes();
    if (cupulaEscudo.visible) cupulaEscudo.material.uniforms.t.value = performance.now() / 1000;
    // las barras de vida miran a la cámara
    tropas.concat(enemigos).forEach(function (u) { u.barra.quaternion.copy(camara.quaternion); });
    slots.forEach(function (s) { if (s.barra) s.barra.quaternion.copy(camara.quaternion); });
    // HUD cada 0.2 s
    cuentaHUD += dtReal;
    if (cuentaHUD > 0.2) { cuentaHUD = 0; actualizarPanel(); mostrarConsejo(); actualizarBadges(); actualizarEscudo(); revisarAtaques(); revisarRefuerzos(); $('tropas').textContent = textoTropas(); $('oleada').textContent = textoOleada(); actualizarPillEntreno(); procesarCarretas(); procesarRegresos(); }
    render.render(escena, camara);
  }

  window.addEventListener('resize', function () {
    camara.fov = fovPantalla();
    camara.aspect = window.innerWidth / window.innerHeight;
    if (!enMundo && !oleadaActiva && !camVuelta && Math.abs(cam.distMeta - distEncuadre()) > 4 && !arrastre && !pellizco) cam.distMeta = Math.min(cam.distMeta, distMaxima());
    camara.updateProjectionMatrix();
    render.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener('beforeunload', function () { if (!enMenu) guardar(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && !enMenu) guardar(true); });

  // Para pruebas desde la consola del navegador
  window.__juego = { estado: function () { return estado; }, empezarOleada: empezarOleada, construir: construir, mejorar: mejorar, entrenar: entrenar, capacidad: capacidad, invocarHeroe: invocarHeroe,
    hora: function (f) { horaForzada = (f === undefined || f === null) ? null : f; }, noche: function () { return nocheActual; },
    tropas: function () { return tropas; }, camara: camara, escena: escena, ponerMuralla: function (n) { ponerMuralla(n); }, nueva: function () { empezarPartida(null); }, construirMuralla: construirMuralla, sha256: function (s) { return sha256(s); }, enemigos: function () { return enemigos; }, slots: slots, cam: cam, velocidad: function (v) { velocidad = v; },
    refuerzos: function () { revisarRefuerzos(true); }, tocar: function (i) { tocarSlot(i); }, nivelNuevo: function (n) { mostrarNivelNuevo(n); }, visorImg: function () { if (!visor) return null; dibujarVisor(0); return visor.r.domElement.toDataURL('image/png'); }, simularAtaque: function (seg, nombre) { entrantes.push({ id: 'prueba' + Date.now(), prueba: true, atacanteNombre: nombre || 'Rival', llega: Date.now() + (seg || 120) * 1000, fuerza: 5000, resuelto: false }); actualizarAlertas(); }, abrir: function (q, id) { if (q === 'castillo') abrirPanelCastillo(); else if (q === 'heroe') abrirPanelHeroe(id || 'sol'); else if (q === 'tropas') abrirPanelTropas(); else abrirPanelEdificio(q); }, az: function (v) { if (v !== undefined) { AZ_CAM = v; cam.az = v; } return AZ_CAM; },
    mundo: function () { return { M3: M3, render: function () { var c = M3.corriendo; M3.corriendo = true; dibujarMundo3D(); }, elegir: elegirCelda, casilla: casillaMundo, ocupadas: ocupadasMundo }; },
    paso: function (seg) { for (var i = 0; i < seg * 30; i++) actualizar(1 / 30); actualizarCamara(1); actualizarRelojes(); render.render(escena, camara); } };

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) { try { reg.update(); } catch (e) {} setInterval(function () { try { reg.update(); } catch (e) {} }, 5 * 60 * 1000); }).catch(function () {});
    });
    var yaRecargo = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (yaRecargo) return; if (enMenu) { yaRecargo = true; location.reload(); } else avisarVersionNueva(); });
  }
  // Mira si en internet hay una versión más nueva del juego; si la hay, avisa (o recarga si estás en el menú)
  function revisarVersion() {
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    fetch('js/datos.js?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (txt) {
      var m = /VERSION_JUEGO = '([^']+)'/.exec(txt);
      if (m && m[1] !== VERSION_JUEGO) { if (enMenu) location.reload(); else avisarVersionNueva(m[1]); }
    }).catch(function () {});
  }
  function avisarVersionNueva(v) {
    if ($('aviso-version')) return;
    var d = document.createElement('button'); d.id = 'aviso-version';
    d.textContent = '🔄 ' + T('version_nueva', { v: v || '' });
    d.addEventListener('click', function () { try { guardar(true); } catch (e) {} setTimeout(function () { location.reload(); }, 400); });
    document.body.appendChild(d);
  }
  setTimeout(revisarVersion, 4000);
  setInterval(revisarVersion, 3 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) revisarVersion(); });
  document.title = NOMBRE_JUEGO;
  aplicarIdioma();
  if (window.Cuentas && Cuentas.disponible()) Cuentas.alCambiar(alCambiarCuenta);
  else pantallaInicio();
  cambiarVelocidad(leerPref().velocidad === 2 ? 2 : 1);
  aplicarCalidad();
  window.__juegoListo = true;
  bucle();
})();
