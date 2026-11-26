/* v9.92 · DÍA Y NOCHE AVANZADO de Brother Kingdom (Claude)
   Ciclo de 1 hora igual para todos los jugadores (hora del servidor, sacada de la cabecera Date del propio sitio):
     amanecer 5 min · día 25 min · atardecer 5 min · noche 25 min.
   Solo visual: no toca reglas, guardado ni edificios. Se apoya en lo que ya existe (cielo, sol, ventanas de juego.js/modelos.js
   y el post-proceso de js/tk-premium.js) y añade:
   - el sol (y de noche la luna) recorren el cielo: las sombras giran y se alargan de verdad; luz dorada al amanecer y atardecer, luna azulada de noche;
   - antorchas con llama animada en murallas, puertas, foso y calles (una sola llamada de dibujo para todas las llamas);
   - un grupo pequeño de luces de verdad (PointLight) que se reparten entre las antorchas, el castillo, la fuente y los edificios
     importantes más cerca de la cámara: iluminan edificios, suelo y se reflejan en el agua del foso y los canales;
   - ventanas que se encienden en los edificios 3D de archivo (las zonas oscuras de su textura en las paredes brillan de noche);
   - motas de luz en el aire de noche y niebla suave al amanecer.
   La interfaz (HTML) no se oscurece nunca. Ajustes › Gráficos › Día y noche: automático, día permanente o noche permanente. */
(function () {
  'use strict';
  if (!window.THREE) return;
  var T3 = THREE, X = function () { return window.__tkExtras; }, C = function () { var x = X(); return x && x.ciudad; };
  var HORA = 60, AMANECER = 5, DIA = 25, ATARDECER = 5; // minutos
  var desfase = 0; // ms: hora del servidor - hora del teléfono
  // ---------- hora del servidor (cabecera Date del hosting; se repite cada 10 min) ----------
  function sincronizar() {
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    var t0 = Date.now();
    fetch('manifest.webmanifest?hora=' + t0, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      var d = r.headers.get('date'); if (!d) return; var srv = Date.parse(d); if (!isFinite(srv)) return;
      var t1 = Date.now(); desfase = srv + 500 - (t0 + t1) / 2; // la cabecera va en segundos enteros: +0,5 s de media
    }).catch(function () {});
  }
  sincronizar(); setInterval(sincronizar, 10 * 60 * 1000);
  function minutoCiclo() { return (((Date.now() + desfase) / 60000) % HORA + HORA) % HORA; }
  // minuto del ciclo → fase del juego (0..0,62 día · 0,62..0,72 atardecer · 0,72..0,92 noche · 0,92..1 amanecer)
  function faseDeMinuto(t) {
    if (t < AMANECER) return 0.92 + 0.08 * t / AMANECER;
    if (t < AMANECER + DIA) return 0.62 * (t - AMANECER) / DIA;
    if (t < AMANECER + DIA + ATARDECER) return 0.62 + 0.1 * (t - AMANECER - DIA) / ATARDECER;
    return 0.72 + 0.2 * (t - AMANECER - DIA - ATARDECER) / (HORA - AMANECER - DIA - ATARDECER);
  }
  function minutoDeFase(p) {
    if (p >= 0.92) return (p - 0.92) / 0.08 * AMANECER;
    if (p < 0.62) return AMANECER + p / 0.62 * DIA;
    if (p < 0.72) return AMANECER + DIA + (p - 0.62) / 0.1 * ATARDECER;
    return AMANECER + DIA + ATARDECER + (p - 0.72) / 0.2 * (HORA - AMANECER - DIA - ATARDECER);
  }
  function nombreFase(p) { return p >= 0.92 ? 'amanecer' : p < 0.62 ? 'dia' : p < 0.72 ? 'atardecer' : 'noche'; }

  // ---------- sol y luna: recorren el cielo sin saltos ----------
  var AZ_MEDIODIA = Math.atan2(-38, 14), LARGO = 60;
  var cMoon = new T3.Color(0x7d98ff), cOro = new T3.Color(0xff9442), cSueloOro = new T3.Color(0x7a4a2a), cCieloLuna = new T3.Color(0x3a4c8a);
  function moverSol(c, p) {
    var t = minutoDeFase(p), luz = AMANECER + DIA + ATARDECER, el;
    if (t < luz) el = 13 + 49 * Math.sin(Math.PI * t / luz); else el = 13 + 37 * Math.sin(Math.PI * (t - luz) / (HORA - luz));
    var az = AZ_MEDIODIA + (t - luz / 2) / HORA * Math.PI * 2, e = el * Math.PI / 180;
    c.dirSol.set(Math.cos(az) * Math.cos(e) * LARGO, Math.sin(e) * LARGO, Math.sin(az) * Math.cos(e) * LARGO);
  }
  function retocarLuz(c, k, d) {
    var sol = c.sol, hemi = c.hemi;
    sol.intensity *= 1 - 0.42 * k; hemi.intensity *= 1 - 0.4 * k;   // noche de verdad: la luna alumbra poco; las luces propias mandan
    sol.color.lerp(cMoon, 0.45 * k * (1 - d)); hemi.color.lerp(cCieloLuna, 0.35 * k * (1 - d * 0.7));
    sol.color.lerp(cOro, 0.55 * d); hemi.color.lerp(cOro, 0.18 * d); hemi.groundColor.lerp(cSueloOro, 0.35 * d); sol.intensity *= 1 + 0.35 * d;
  }

  // ---------- antorchas: soportes instanciados + llamas (Points) ----------
  var ANT = { lista: [], postes: null, soportes: null, llamas: null, halo: null, hecho: '' };
  var U = { t: { value: 0 }, k: { value: 0 }, esc: { value: 400 } };
  function matLlama(halo) {
    return new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, uniforms: { uT: U.t, uK: U.k, uEsc: U.esc },
      vertexShader: 'attribute float fase; attribute float tam; uniform float uT; uniform float uK; uniform float uEsc; varying float vF; void main(){ vF = 0.82 + 0.12 * sin(uT * 13.0 + fase * 7.0) + 0.06 * sin(uT * 29.0 + fase * 3.0); vec3 p = position; p.y += 0.05 * sin(uT * 9.0 + fase); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(tam * uEsc * vF / -mv.z, 0.0, 120.0) * step(0.01, uK); gl_Position = projectionMatrix * mv; }',
      fragmentShader: halo ? 'uniform float uK; varying float vF; void main(){ vec2 q = gl_PointCoord - 0.5; float d = dot(q, q) * 4.0; float a = exp(-d * 3.0) * 0.32 * uK * vF; gl_FragColor = vec4(vec3(1.0, 0.55, 0.2) * a, 1.0); }'
        : 'uniform float uK; varying float vF; void main(){ vec2 q = gl_PointCoord - vec2(0.5, 0.62); q.x *= 1.0 + q.y * 1.4; float r = length(q * vec2(2.4, 1.5)); float a = smoothstep(0.62, 0.1, r) * uK; if (a < 0.02) discard; vec3 c = mix(vec3(1.0, 0.36, 0.06), vec3(1.0, 0.92, 0.6), smoothstep(0.45, 0.05, r)); gl_FragColor = vec4(c * a * 2.4 * vF, 1.0); }' });
  }
  function hacerAntorchas(c, esc) {
    var muro = window.TKPremium && TKPremium._muro && TKPremium._muro(), es = c.esquinas();
    var clave = (muro ? muro.p.length : 0) + ':' + (es ? es.length : 0) + ':' + (muro && muro.obj ? muro.obj.uuid : '');
    if (clave === ANT.hecho || !es || !es.length) return; ANT.hecho = clave;
    [ANT.postes, ANT.soportes, ANT.llamas, ANT.halo].forEach(function (o) { if (o) { esc.remove(o); o.geometry.dispose(); } });
    var lista = [];
    // murallas: cada ~18° y a los dos lados de cada puerta (donde el paseo se corta)
    if (muro) muro.p.forEach(function (p, i) {
      if (!p) return; var a = muro.p[(i + 359) % 360], b = muro.p[(i + 1) % 360];
      var puerta = !a || !b;
      if (puerta || i % 18 === 0) lista.push({ x: p.x, y: p.y + 0.85, z: p.z, tipo: 'muro', puerta: puerta, base: p.y });
    });
    // calles: farolas en cruces alternos, un poco hacia el borde
    es.forEach(function (q, i) { if (i % 2) return; lista.push({ x: q.x + 1.0, y: 2.35, z: q.z + 1.0, tipo: 'calle', base: 0 }); });
    // foso del castillo: antorchas alrededor (se reflejan en el agua)
    for (var j = 0; j < 10; j++) { var ang = j / 10 * Math.PI * 2, r = c.COLINA.foso1 + 1.2, w = c.aMundo(Math.cos(ang) * r, Math.sin(ang) * r); if (Math.abs(Math.sin(ang)) < 0.15 && Math.cos(ang) > 0) continue; lista.push({ x: w[0], y: 1.75, z: w[1], tipo: 'calle', base: 0, foso: true }); }
    ANT.lista = lista;
    // soportes
    var nP = lista.filter(function (q) { return q.tipo === 'calle'; }), nM = lista.filter(function (q) { return q.tipo === 'muro'; }), o = new T3.Object3D();
    var mPoste = new T3.MeshLambertMaterial({ color: 0x3a2e24 });
    var gP = new T3.CylinderGeometry(0.07, 0.1, 2.2, 6); gP.translate(0, 1.1, 0);
    var gC = new T3.CylinderGeometry(0.2, 0.12, 0.22, 6); gC.translate(0, 2.25, 0);
    ANT.postes = new T3.InstancedMesh(fundir([gP, gC]), mPoste, Math.max(1, nP.length)); ANT.postes.castShadow = true;
    nP.forEach(function (q, i) { o.position.set(q.x, q.foso ? -0.6 : 0, q.z); o.updateMatrix(); ANT.postes.setMatrixAt(i, o.matrix); });
    var gS = new T3.CylinderGeometry(0.06, 0.06, 0.7, 5); gS.translate(0, 0.35, 0); var gS2 = new T3.CylinderGeometry(0.16, 0.09, 0.16, 6); gS2.translate(0, 0.75, 0);
    ANT.soportes = new T3.InstancedMesh(fundir([gS, gS2]), mPoste, Math.max(1, nM.length));
    nM.forEach(function (q, i) { o.position.set(q.x, q.base, q.z); o.updateMatrix(); ANT.soportes.setMatrixAt(i, o.matrix); });
    // llamas y halo
    var pos = new Float32Array(lista.length * 3), fase = new Float32Array(lista.length), tam = new Float32Array(lista.length), tamH = new Float32Array(lista.length);
    lista.forEach(function (q, i) { pos[i * 3] = q.x; pos[i * 3 + 1] = q.y + (q.foso ? -0.6 : 0); pos[i * 3 + 2] = q.z; q.y = pos[i * 3 + 1]; fase[i] = Math.random() * 10; tam[i] = 0.85; tamH[i] = 4.2; });
    function puntos(t, halo) { var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('fase', new T3.BufferAttribute(fase, 1)); g.setAttribute('tam', new T3.BufferAttribute(t, 1)); var p = new T3.Points(g, matLlama(halo)); p.frustumCulled = false; p.renderOrder = 7; p.userData.tkpNo = true; return p; }
    ANT.llamas = puntos(tam, false); ANT.halo = puntos(tamH, true);
    [ANT.postes, ANT.soportes, ANT.llamas, ANT.halo].forEach(function (m) { m.userData.tkpNo = m.userData.tkpNo || false; esc.add(m); });
  }
  function fundir(gs) {
    var pos = [], nor = [], idx = [], base = 0;
    gs.forEach(function (g) { var n = g.toNonIndexed(); var p = n.attributes.position.array, q = n.attributes.normal.array; for (var i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(q[i]); } });
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); return g;
  }

  // ---------- luces de verdad: un grupo fijo que se reparte entre lo que está cerca de la cámara ----------
  var CANT_LUCES = { baja: 0, media: 3, alta: 5, ultra: 8 };
  var LUZ = { lista: [], nivel: null, reparto: 0 };
  var cAnt = new T3.Color(0xff9a42), cCast = new T3.Color(0xffc27a), cFuente = new T3.Color(0x9fd8ff), cEdif = new T3.Color(0xffb468);
  function nivelActual() { return (window.TKPremium && TKPremium.nivel && TKPremium.nivel()) || 'alta'; }
  function prepararLuces(esc) {
    var nv = nivelActual(); if (LUZ.nivel === nv) return; LUZ.nivel = nv;
    LUZ.lista.forEach(function (l) { esc.remove(l.luz); }); LUZ.lista = [];
    for (var i = 0; i < (CANT_LUCES[nv] || 0); i++) { var l = new T3.PointLight(0xff9a42, 0, 14, 1.7); l.castShadow = false; esc.add(l); LUZ.lista.push({ luz: l, meta: null, act: 0 }); }
  }
  function candidatos(c) {
    var l = [], o = c.cam.objetivo;
    ANT.lista.forEach(function (q) { l.push({ x: q.x, y: q.y + 0.2, z: q.z, col: cAnt, int: q.foso ? 1.5 : 1.15, dist: q.foso ? 13 : 11, parp: 1, pri: q.foso ? 6 : q.puerta ? 4 : 0 }); });
    var ca = c.castillo();
    if (ca && ca.parent) {
      var b = new T3.Box3().setFromObject(ca); if (isFinite(b.min.x)) {
        var cen = b.getCenter(new T3.Vector3()), R = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2, fp = c.aMundo(1, 0), f = new T3.Vector3(fp[0], 0, fp[1]).normalize(), lado = new T3.Vector3(-f.z, 0, f.x);
        [-0.55, 0.55].forEach(function (s) { var p = cen.clone().addScaledVector(f, R * 1.05).addScaledVector(lado, s * R); l.push({ x: p.x, y: b.min.y + 1.2, z: p.z, col: cCast, int: 1.1, dist: R * 1.5, parp: 0.2, pri: 30 }); });
        l.push({ x: cen.x, y: b.min.y + (b.max.y - b.min.y) * 0.75, z: cen.z, col: cCast, int: 0.9, dist: R * 1.3, parp: 0.1, pri: 20 });
      }
    }
    var fu = window.TKPremium && TKPremium.estado && window.__tkFuentePos; if (fu) l.push({ x: fu.x, y: fu.y + 1.6, z: fu.z, col: cFuente, int: 1.2, dist: 11, parp: 0, pri: 25 });
    // edificios importantes: los de nivel más alto (y el castillo ya va aparte)
    c.slots.filter(function (s) { return s.edificio && !s.campo; }).sort(function (a, b) { return (b.edificio.nivel || 0) - (a.edificio.nivel || 0); }).slice(0, 4)
      .forEach(function (s) { l.push({ x: s.pos.x + 2.6, y: 1.6, z: s.pos.z + 2.6, col: cEdif, int: 1.3, dist: 10, parp: 0.05, pri: 12 }); });
    l.forEach(function (q) { q.puntos = q.pri - Math.hypot(q.x - o.x, q.z - o.z); });
    return l.sort(function (a, b) { return b.puntos - a.puntos; });
  }
  function moverLuces(dt, c, k) {
    if (!LUZ.lista.length) return;
    LUZ.reparto -= dt;
    if (LUZ.reparto <= 0 && k > 0.01) {
      LUZ.reparto = 0.6; var cand = candidatos(c).slice(0, LUZ.lista.length + 2), libres = [];
      // se queda la luz que ya estaba en un sitio que sigue entre los mejores (sin parpadeos al mover la cámara)
      LUZ.lista.forEach(function (L) { var sigue = L.meta && cand.some(function (q) { return Math.abs(q.x - L.meta.x) < 0.01 && Math.abs(q.z - L.meta.z) < 0.01 && (q.usada = true); }); if (!sigue) libres.push(L); });
      cand.forEach(function (q) { if (q.usada || !libres.length) return; var L = libres.shift(); L.siguiente = q; });
    }
    LUZ.lista.forEach(function (L, i) {
      if (L.siguiente) { L.act -= dt * 4; if (L.act <= 0) { L.act = 0; L.meta = L.siguiente; L.siguiente = null; L.luz.position.set(L.meta.x, L.meta.y, L.meta.z); L.luz.color.copy(L.meta.col); L.luz.distance = L.meta.dist; } }
      else if (L.meta) L.act = Math.min(1, L.act + dt * 2);
      var parp = L.meta ? 1 - L.meta.parp * (0.12 + 0.12 * Math.sin(U.t.value * 11 + i * 3) + 0.06 * Math.sin(U.t.value * 23 + i)) : 0;
      L.luz.intensity = L.meta ? L.meta.int * k * L.act * parp : 0;
    });
  }

  // ---------- ventanas de los edificios 3D de archivo: lo oscuro de la textura en las paredes brilla de noche ----------
  var UV = { noche: { value: 0 }, t: U.t };
  var vistos = new WeakSet();
  function parcharVentanas(m) {
    var antes = m.onBeforeCompile, k0 = m.customProgramCacheKey ? String(m.customProgramCacheKey()) : '';
    m.onBeforeCompile = function (sh, r) {
      if (antes && antes !== T3.Material.prototype.onBeforeCompile) antes.call(this, sh, r);
      sh.uniforms.uTkpNoche = UV.noche; sh.uniforms.uTkpT = UV.t;
      sh.vertexShader = 'varying float vTkpNy; varying vec3 vTkpWp;\n' + sh.vertexShader.replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n vTkpNy = normalize(mat3(modelMatrix) * objectNormal).y; vTkpWp = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uTkpNoche; uniform float uTkpT; varying float vTkpNy; varying vec3 vTkpWp;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', [
        '#include <emissivemap_fragment>',
        ' float tkpLu = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));',
        ' float tkpPared = 1.0 - smoothstep(0.3, 0.6, abs(vTkpNy));',
        ' float tkpVen = smoothstep(0.15, 0.045, tkpLu) * tkpPared * step(0.25, vTkpWp.y);',
        ' float tkpCal = 0.88 + 0.12 * sin(uTkpT * 2.3 + vTkpWp.x * 1.7 + vTkpWp.z * 1.3);',
        ' totalEmissiveRadiance += vec3(1.0, 0.6, 0.26) * tkpVen * uTkpNoche * 1.9 * tkpCal;'].join('\n'));
    };
    m.customProgramCacheKey = function () { return k0 + '|tkpVen2'; }; m.needsUpdate = true;
  }
  function revisarVentanas(c) {
    var raices = c.slots.map(function (s) { return s.grupo; }); var ca = c.castillo(); if (ca) raices.push(ca);
    raices.forEach(function (g) {
      if (!g) return;
      g.traverse(function (o) {
        if (!o.isMesh || !o.material) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
          if (vistos.has(m)) return; // se marca solo al parchar: la textura de un modelo de archivo puede llegar más tarde
          if ((m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial) && (!m.transparent || m.map) && !/agua/i.test(String(m.customProgramCacheKey && m.customProgramCacheKey()))) { vistos.add(m); parcharVentanas(m); }
        });
      });
    });
  }

  // ---------- motas de luz de noche (polvo y polen que flotan) ----------
  var MOTAS = null;
  function hacerMotas(esc) {
    var n = 160, pos = new Float32Array(n * 3), fase = new Float32Array(n), tam = new Float32Array(n);
    for (var i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 80; pos[i * 3 + 1] = 0.5 + Math.random() * 7; pos[i * 3 + 2] = (Math.random() - 0.5) * 80; fase[i] = Math.random() * 30; tam[i] = 0.18 + Math.random() * 0.2; }
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('fase', new T3.BufferAttribute(fase, 1)); g.setAttribute('tam', new T3.BufferAttribute(tam, 1));
    var m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, uniforms: { uT: U.t, uK: U.k, uEsc: U.esc, uC: { value: new T3.Vector3() } },
      vertexShader: 'attribute float fase; attribute float tam; uniform float uT; uniform float uK; uniform float uEsc; uniform vec3 uC; varying float vA; void main(){ vec3 p = position; p.x += sin(uT * 0.21 + fase) * 2.5; p.z += cos(uT * 0.17 + fase * 1.3) * 2.5; p.y += sin(uT * 0.4 + fase * 2.0) * 0.8; p.xz = uC.xz + mod(p.xz - uC.xz + 40.0, 80.0) - 40.0; vA = (0.5 + 0.5 * sin(uT * 1.7 + fase * 5.0)) * uK; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = clamp(tam * uEsc / -mv.z, 0.0, 40.0) * step(0.01, uK); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float a = exp(-dot(q, q) * 16.0) * vA; if (a < 0.02) discard; gl_FragColor = vec4(vec3(1.0, 0.85, 0.55) * a * 1.6, 1.0); }' });
    MOTAS = new T3.Points(g, m); MOTAS.frustumCulled = false; MOTAS.userData.tkpNo = true; esc.add(MOTAS);
  }

  // ---------- bucle ----------
  var revisa = 0, listo = false, ultimo = null, FALLOS = {};
  function cadaFotograma(dt) {
    var x = X(), c = C(); if (!x || !c || !x.escena) return; var esc = x.escena;
    dt = Math.max(0, Math.min(0.05, dt || 0)); U.t.value = (U.t.value + dt) % 10000;
    var p = c.fase(), k = c.noche(), d = c.dorada();
    moverSol(c, p);
    retocarLuz(c, k, d);
    // niebla suave del amanecer (también sin post-proceso)
    var aurora = p >= 0.92 ? Math.sin(Math.PI * (p - 0.92) / 0.08) : 0;
    if (esc.fog && aurora > 0.001) { var dR = x.camara.position.distanceTo(c.cam.objetivo); esc.fog.near = dR + (esc.fog.near - dR) * (1 - 0.7 * aurora) - 20 * aurora; esc.fog.far = dR + (esc.fog.far - dR) * (1 - 0.55 * aurora); } // la niebla empieza cerca de la ciudad, nunca la tapa
    // las antorchas se encienden un poco antes de que sea de noche y se apagan con el sol ya arriba
    var kL = Math.max(k, p >= 0.6 && p < 0.72 ? Math.min(1, (p - 0.6) / 0.05) : 0, p >= 0.92 ? 1 - Math.min(1, (p - 0.92) / 0.07) : 0);
    U.k.value = kL; UV.noche.value = Math.max(k, kL * 0.8);
    if (!x.activo()) return;
    var ahoraR = performance.now(); revisa -= (ahoraR - (ultimo || ahoraR)) / 1000; ultimo = ahoraR; // tiempo real (en un teléfono lento dt va recortado)
    if (revisa <= 0) {
      revisa = 3; listo = true;
      [function () { hacerAntorchas(c, esc); }, function () { prepararLuces(esc); }, function () { revisarVentanas(c); }, function () { if (!MOTAS) hacerMotas(esc); }]
        .forEach(function (f, i) { try { f(); } catch (e) { FALLOS[i] = String(e && e.message || e); } }); // un fallo en una parte no para las demás
      if (!window.__tkFuentePos) esc.traverse(function (o) { if (!window.__tkFuentePos && o.isMesh && o.geometry && o.geometry.type === 'CircleGeometry' && o.geometry.parameters && Math.abs(o.geometry.parameters.radius - 1.05) < 0.01) window.__tkFuentePos = o.getWorldPosition(new T3.Vector3()); });
    }
    if (!listo) return;
    U.esc.value = x.render.domElement.height * x.camara.projectionMatrix.elements[5] * 0.5;
    if (MOTAS) MOTAS.material.uniforms.uC.value.copy(c.cam.objetivo);
    moverLuces(dt, c, kL);
  }
  (function enganchar() {
    if (!window.TKExtras) window.TKExtras = { cadaFotograma: function () {} };
    var antes = TKExtras.cadaFotograma;
    TKExtras.cadaFotograma = function (dt) { antes(dt); try { cadaFotograma(dt); } catch (e) { if (!enganchar.av) { enganchar.av = 1; console.warn('TKDiaNoche', e); } } };
  })();
  window.TKDiaNoche = {
    fase: function () { return faseDeMinuto(minutoCiclo()); },
    minuto: minutoCiclo, faseDeMinuto: faseDeMinuto,
    _revisar: function () { var c = C(), esc = X().escena; hacerAntorchas(c, esc); prepararLuces(esc); revisarVentanas(c); return [LUZ.nivel, LUZ.lista.length, listo, revisa]; },
    estado: function () { var c = C(), p = c ? c.fase() : 0; return { fase: +p.toFixed(3), parte: nombreFase(p), minutoServidor: +minutoCiclo().toFixed(2), desfaseMs: Math.round(desfase), antorchas: ANT.lista.length, luces: LUZ.lista.length, lucesEncendidas: LUZ.lista.filter(function (l) { return l.luz.intensity > 0.05; }).length, motas: !!MOTAS, fallos: FALLOS, sol: c ? c.dirSol.toArray().map(function (v) { return +v.toFixed(1); }) : null }; }
  };
})();
