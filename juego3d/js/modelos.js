// =====================================================================
//  MODELOS 3D: todo se arma con figuras simples (estilo low-poly cartoon).
//  No usa imágenes ni modelos de otros juegos: todo es original.
// =====================================================================

var M = (function () {
  // ---------- Material "toon" (sombras en escalones, look de caricatura) ----------
  var grad = (function () {
    var d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
    var t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  })();
  var cacheMat = {};
  function mat(color, extra) {
    var k = color + (extra ? JSON.stringify(extra) : '');
    if (!cacheMat[k]) {
      var o = { color: color, gradientMap: grad };
      if (extra) for (var e in extra) o[e] = extra[e];
      cacheMat[k] = new THREE.MeshToonMaterial(o);
    }
    return cacheMat[k];
  }
  var cacheGeo = {};
  function geo(clave, crear) { return cacheGeo[clave] || (cacheGeo[clave] = crear()); }

  function malla(g, m, x, y, z, sombra) {
    var me = new THREE.Mesh(g, m);
    me.position.set(x || 0, y || 0, z || 0);
    me.castShadow = sombra !== false;
    me.receiveShadow = true;
    return me;
  }
  function caja(w, h, d, color, x, y, z) {
    return malla(geo('b' + w + h + d, function () { return new THREE.BoxGeometry(w, h, d); }), mat(color), x, y, z);
  }
  function cil(rt, rb, h, seg, color, x, y, z) {
    return malla(geo('c' + rt + rb + h + seg, function () { return new THREE.CylinderGeometry(rt, rb, h, seg); }), mat(color), x, y, z);
  }
  function cono(r, h, seg, color, x, y, z) {
    return malla(geo('k' + r + h + seg, function () { return new THREE.ConeGeometry(r, h, seg); }), mat(color), x, y, z);
  }
  function esfera(r, color, x, y, z, ws, hs) {
    ws = ws || 10; hs = hs || 8;
    return malla(geo('s' + r + ws + hs, function () { return new THREE.SphereGeometry(r, ws, hs); }), mat(color), x, y, z);
  }

  var C = {
    piedra: 0xa9a8c8, piedraOsc: 0x75729a, madera: 0x9b6a3c, maderaOsc: 0x6e4524,
    techoAzul: 0x3346c0, techoRojo: 0xd8432f, oro: 0xf5c542, paja: 0xe9c46a,
    piel: 0xffd3b0, metal: 0xd6dde5, metalOsc: 0x8d99a6, negro: 0x2a2320, blanco: 0xffffff,
    azul: 0x3d7bf0, azulOsc: 0x234a9a, verde: 0x5bbf4a, rojo: 0xe24a3b,
    trasgo: 0x8fcf4a, trasgoOsc: 0x5f9a2a, cuero: 0x8a5a33, bruto: 0x6f8f5a, ogro: 0x9b7bc0
  };

  // =================================================================
  //  BANDERA
  // =================================================================
  function bandera(color, alto) {
    var g = new THREE.Group();
    g.add(cil(0.05, 0.05, alto, 6, C.maderaOsc, 0, alto / 2, 0));
    var tela = malla(geo('flag', function () {
      var p = new THREE.PlaneGeometry(1.1, 0.7, 6, 1);
      p.translate(0.55, 0, 0);
      return p;
    }), mat(color, { side: THREE.DoubleSide }), 0, alto - 0.4, 0);
    tela.userData.ondea = true;
    g.add(tela);
    g.userData.tela = tela;
    return g;
  }
  // Hace ondear la tela (se llama cada cuadro)
  function ondear(tela, t) {
    var pos = tela.geometry.attributes.position;
    if (!tela.userData.base) { tela.geometry = tela.geometry.clone(); pos = tela.geometry.attributes.position; tela.userData.base = pos.array.slice(); }
    var b = tela.userData.base;
    for (var i = 0; i < pos.count; i++) {
      var x = b[i * 3];
      pos.array[i * 3 + 2] = Math.sin(x * 4 - t * 6 + tela.id) * 0.12 * x;
    }
    pos.needsUpdate = true;
  }

  // =================================================================
  //  CASTILLO
  // =================================================================
  function castillo() {
    var g = new THREE.Group();
    g.add(cil(6.4, 6.9, 0.7, 8, C.piedraOsc, 0, 0.35, 0));
    // murallas
    var L = 8.4, h = 2.4, t = 0.9;
    var muros = [[0, -L / 2, L, t], [0, L / 2, L, t], [-L / 2, 0, t, L], [L / 2, 0, t, L]];
    muros.forEach(function (m) {
      g.add(caja(m[2], h, m[3], C.piedra, m[0], 0.7 + h / 2, m[1]));
      // almenas
      var largo = Math.max(m[2], m[3]), n = 6;
      for (var i = 0; i < n; i++) {
        var p = -largo / 2 + 0.6 + i * (largo - 1.2) / (n - 1);
        var x = m[2] > m[3] ? m[0] + p : m[0], z = m[2] > m[3] ? m[1] : m[1] + p;
        g.add(caja(0.55, 0.5, 0.55, C.piedra, x, 0.7 + h + 0.25, z));
      }
    });
    // torres de las esquinas
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      var x = s[0] * L / 2, z = s[1] * L / 2;
      g.add(cil(1.15, 1.3, 4.2, 8, C.piedra, x, 0.7 + 2.1, z));
      g.add(cil(1.4, 1.2, 0.5, 8, C.piedraOsc, x, 0.7 + 4.3, z));
      g.add(cono(1.55, 2.2, 8, C.techoAzul, x, 0.7 + 5.6, z));
      g.add(caja(0.25, 0.5, 0.08, C.negro, x - s[0] * 0.1, 3.6, z + s[1] * 1.17));
    });
    // torre central (torre del homenaje)
    g.add(caja(4.4, 5, 4.4, C.piedra, 0.6, 0.7 + 2.5, 0));
    g.add(caja(4.8, 0.4, 4.8, C.piedraOsc, 0.6, 0.7 + 5.1, 0));
    var techo = cono(3.6, 3.4, 4, C.techoAzul, 0.6, 0.7 + 7, 0);
    techo.rotation.y = Math.PI / 4;
    g.add(techo);
    var b = bandera(C.techoRojo, 2.2); b.position.set(0.6, 8.4, 0); g.add(b);
    g.userData.banderas = [b.userData.tela];
    // ventanas
    for (var i = -1; i <= 1; i += 2) {
      g.add(caja(0.08, 0.8, 0.5, C.negro, 0.6 - 2.21, 4.2, i * 1.1));
      g.add(caja(0.5, 0.8, 0.08, C.negro, 0.6 + i * 1.1, 4.2, 2.21));
    }
    // puerta (mira hacia el camino: lado -x)
    g.add(caja(0.3, 2.0, 2.2, C.maderaOsc, -L / 2 - 0.35, 1.7, 0));
    g.add(cil(1.1, 1.1, 0.3, 10, C.maderaOsc, -L / 2 - 0.35, 2.7, 0).rotateZ(Math.PI / 2));
    g.add(caja(0.35, 0.15, 2.4, C.metalOsc, -L / 2 - 0.4, 1.2, 0));
    g.add(caja(0.35, 0.15, 2.4, C.metalOsc, -L / 2 - 0.4, 2.2, 0));
    // estandartes al lado de la puerta
    [-1.7, 1.7].forEach(function (z) {
      g.add(caja(0.1, 1.6, 0.9, C.techoAzul, -L / 2 - 0.5, 2.1, z));
      g.add(esfera(0.18, C.oro, -L / 2 - 0.58, 2.3, z, 6, 4));
    });
    return g;
  }

  // =================================================================
  //  TERRENO PARA CONSTRUIR
  // =================================================================
  function terreno() {
    var g = new THREE.Group();
    var base = caja(4.4, 0.16, 4.4, 0xb08a55, 0, 0.08, 0);
    base.castShadow = false;
    g.add(base);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      g.add(cil(0.1, 0.12, 0.6, 5, C.madera, s[0] * 2, 0.3, s[1] * 2));
    });
    var brillo = new THREE.Mesh(
      geo('brillo', function () { return new THREE.RingGeometry(2.4, 2.9, 32); }),
      new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    brillo.rotation.x = -Math.PI / 2;
    brillo.position.y = 0.2;
    g.add(brillo);
    g.userData.brillo = brillo;
    return g;
  }

  // Andamio que aparece mientras se construye
  function andamio() {
    var g = new THREE.Group();
    var m = mat(C.madera);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      g.add(malla(geo('and', function () { return new THREE.BoxGeometry(0.15, 3, 0.15); }), m, s[0] * 1.6, 1.5, s[1] * 1.6));
    });
    for (var y = 1; y < 3; y += 1) {
      g.add(caja(3.4, 0.12, 0.15, C.madera, 0, y, 1.6));
      g.add(caja(3.4, 0.12, 0.15, C.madera, 0, y, -1.6));
      g.add(caja(0.15, 0.12, 3.4, C.madera, 1.6, y, 0));
      g.add(caja(0.15, 0.12, 3.4, C.madera, -1.6, y, 0));
    }
    g.add(caja(0.8, 0.5, 0.6, C.piedraOsc, -0.6, 0.25, 0.5));
    g.add(caja(0.5, 0.4, 0.5, C.madera, 0.6, 0.2, -0.4));
    return g;
  }

  // =================================================================
  //  EDIFICIOS
  // =================================================================
  function granja(nivel) {
    var g = new THREE.Group();
    // casita
    g.add(caja(2, 1.4, 1.6, 0xf3e3c3, -0.6, 0.85, -0.6));
    var techo = malla(geo('techoGranja', function () {
      var s = new THREE.Shape(); s.moveTo(-1.25, 0); s.lineTo(1.25, 0); s.lineTo(0, 1); s.lineTo(-1.25, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: false }); e.translate(0, 0, -0.95); return e;
    }), mat(nivel >= 3 ? C.oro : C.techoRojo), -0.6, 1.55, -0.6);
    g.add(techo);
    g.add(caja(0.45, 0.7, 0.06, C.maderaOsc, -0.6, 0.5, 0.21));
    g.add(caja(0.35, 0.35, 0.06, 0x7fc8ff, -1.2, 1.0, 0.21));
    // campo de trigo
    var filas = 2 + nivel;
    for (var i = 0; i < filas; i++) {
      g.add(caja(0.35, 0.45, 1.5, C.paja, 0.6 + (i % 3) * 0.5, 0.3, 0.9 - Math.floor(i / 3) * 0 ));
    }
    for (var j = 0; j < 3; j++) g.add(caja(1.6, 0.45, 0.3, 0xd8b04a, 0.9, 0.3, -0.4 - j * 0.45));
    // molino
    var molino = new THREE.Group();
    molino.add(cil(0.35, 0.5, 2.4, 6, 0xf0e6d0, 0, 1.2, 0));
    molino.add(cono(0.55, 0.7, 6, C.techoRojo, 0, 2.75, 0));
    var aspas = new THREE.Group();
    for (var k = 0; k < 4; k++) {
      var a = caja(0.18, 1.3, 0.05, 0xfdf6e3, 0, 0.65, 0);
      var p = new THREE.Group(); p.add(a); p.rotation.z = k * Math.PI / 2; aspas.add(p);
    }
    aspas.position.set(0, 2.3, 0.45);
    molino.add(aspas);
    molino.position.set(1.4, 0, -1.3);
    g.add(molino);
    g.userData.aspas = aspas;
    // valla
    for (var f = -1.8; f <= 1.8; f += 0.6) g.add(caja(0.08, 0.4, 0.08, C.madera, f, 0.2, 1.9));
    g.add(caja(3.7, 0.06, 0.06, C.madera, 0, 0.3, 1.9));
    return g;
  }

  function cuartel(nivel) {
    var g = new THREE.Group();
    g.add(caja(3.4, 0.3, 2.4, C.piedraOsc, 0, 0.25, -0.4));
    g.add(caja(3.2, 1.6, 2.2, 0xe8d8b8, 0, 1.2, -0.4));
    // vigas
    [-1.55, 0, 1.55].forEach(function (x) { g.add(caja(0.15, 1.6, 0.06, C.maderaOsc, x, 1.2, 0.72)); });
    g.add(caja(3.25, 0.15, 0.06, C.maderaOsc, 0, 1.95, 0.72));
    var techo = malla(geo('techoCuartel', function () {
      var s = new THREE.Shape(); s.moveTo(-1.4, 0); s.lineTo(1.4, 0); s.lineTo(0, 1.1); s.lineTo(-1.4, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 3.6, bevelEnabled: false }); e.translate(0, 0, -1.8); e.rotateY(Math.PI / 2); return e;
    }), mat(nivel >= 3 ? C.oro : C.techoAzul), 0, 2.0, -0.4);
    g.add(techo);
    g.add(caja(0.8, 1.1, 0.08, C.maderaOsc, 0, 0.85, 0.74));
    g.add(esfera(0.3, C.oro, 0, 1.75, 0.76, 8, 6));
    // banderas
    var b1 = bandera(C.techoAzul, 3.2 + nivel * 0.3); b1.position.set(-1.7, 0, 0.9); g.add(b1);
    g.userData.banderas = [b1.userData.tela];
    if (nivel >= 2) { var b2 = bandera(C.techoRojo, 3.4 + nivel * 0.3); b2.position.set(1.7, 0, 0.9); g.add(b2); g.userData.banderas.push(b2.userData.tela); }
    // muñeco de práctica
    var m = new THREE.Group();
    m.add(cil(0.07, 0.07, 1.2, 5, C.madera, 0, 0.6, 0));
    m.add(cil(0.25, 0.25, 0.6, 7, C.paja, 0, 1.1, 0));
    m.add(esfera(0.22, C.paja, 0, 1.6, 0, 7, 5));
    m.add(caja(0.9, 0.1, 0.1, C.madera, 0, 1.2, 0));
    m.position.set(1.2, 0, 1.5);
    g.add(m);
    // armero
    g.add(caja(0.9, 0.08, 0.2, C.madera, -1.0, 0.9, 1.5));
    for (var i = 0; i < 3; i++) g.add(caja(0.06, 1.0, 0.06, C.metal, -1.3 + i * 0.3, 0.6, 1.5));
    return g;
  }

  function torre(nivel) {
    var g = new THREE.Group();
    var alto = 3.6 + nivel * 0.8;
    g.add(cil(1.3, 1.5, 0.5, 8, C.piedraOsc, 0, 0.25, 0));
    g.add(cil(0.95, 1.2, alto, 8, C.piedra, 0, 0.5 + alto / 2, 0));
    g.add(cil(1.35, 1.1, 0.5, 8, C.piedraOsc, 0, 0.5 + alto + 0.25, 0));
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      g.add(caja(0.4, 0.45, 0.4, C.piedra, Math.cos(a) * 1.2, 0.5 + alto + 0.7, Math.sin(a) * 1.2));
    }
    // techo sobre postes
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      g.add(cil(0.06, 0.06, 1.4, 5, C.madera, s[0] * 0.8, 0.5 + alto + 1.2, s[1] * 0.8));
    });
    g.add(cono(1.6, 1.4, 8, nivel >= 3 ? C.oro : C.techoRojo, 0, 0.5 + alto + 2.4, 0));
    g.add(caja(0.25, 0.6, 0.1, C.negro, 0, 0.5 + alto * 0.6, 1.08));
    g.add(caja(0.1, 0.6, 0.25, C.negro, -1.08, 0.5 + alto * 0.4, 0));
    // arquero en la torre
    var arq = unidad('arquero');
    arq.grupo.scale.setScalar(0.8);
    arq.grupo.position.y = 0.5 + alto + 0.5;
    g.add(arq.grupo);
    g.userData.arquero = arq;
    g.userData.alturaDisparo = 0.5 + alto + 1.4;
    return g;
  }

  // =================================================================
  //  UNIDADES CHIBI (caballeros y enemigos)
  // =================================================================
  function ojos(g, y, z, sep, color) {
    [-1, 1].forEach(function (s) {
      g.add(esfera(0.065, color || C.negro, s * sep, y, z, 6, 5));
      g.add(esfera(0.022, C.blanco, s * sep + 0.02, y + 0.03, z + 0.05, 4, 3));
    });
  }

  function unidad(tipo) {
    var g = new THREE.Group();     // grupo principal (posición en el mundo)
    var cuerpo = new THREE.Group(); // todo lo que se balancea al caminar
    g.add(cuerpo);
    var p = {};
    var piel = C.piel, ropa = C.azul, ropa2 = C.azulOsc, escala = 1;
    if (tipo === 'arquero') { ropa = 0x3f9a4a; ropa2 = 0x2a6a34; }
    if (tipo === 'guardian') { ropa = 0x8796a8; ropa2 = 0x4f5f72; escala = 1.15; }
    if (tipo === 'heroe') { ropa = C.oro; ropa2 = 0xb8862a; escala = 1.35; }
    if (tipo === 'trasgo') { piel = C.trasgo; ropa = C.cuero; ropa2 = 0x5a3a20; escala = 0.9; }
    if (tipo === 'bruto') { piel = C.bruto; ropa = 0x6a4a3a; ropa2 = 0x3a2a20; escala = 1.3; }
    if (tipo === 'ogro') { piel = C.ogro; ropa = 0x6a3a2a; ropa2 = 0x3a1a10; escala = 2.5; }

    // piernas
    [-1, 1].forEach(function (s) {
      var pivote = new THREE.Group();
      pivote.position.set(s * 0.13, 0.32, 0);
      pivote.add(caja(0.17, 0.32, 0.19, ropa2, 0, -0.16, 0));
      pivote.add(caja(0.19, 0.08, 0.24, C.maderaOsc, 0, -0.28, 0.03));
      cuerpo.add(pivote);
      p[s < 0 ? 'piernaI' : 'piernaD'] = pivote;
    });
    // tronco
    cuerpo.add(cil(0.27, 0.33, 0.46, 8, ropa, 0, 0.54, 0));
    cuerpo.add(cil(0.335, 0.335, 0.08, 8, C.maderaOsc, 0, 0.4, 0));
    if (tipo !== 'trasgo' && tipo !== 'bruto' && tipo !== 'ogro' && tipo !== 'arquero')
      cuerpo.add(cil(0.22, 0.28, 0.3, 8, C.metal, 0, 0.62, 0.06).rotateX(0.05));
    // cabeza
    var cabeza = new THREE.Group();
    cabeza.position.y = 1.08;
    cabeza.add(esfera(0.38, piel, 0, 0, 0, 14, 10));
    ojos(cabeza, 0, 0.34, 0.13, (tipo === 'trasgo' || tipo === 'bruto' || tipo === 'ogro') ? 0x8a1010 : C.negro);
    cabeza.add(esfera(0.06, 0xffa090, -0.22, -0.1, 0.28, 5, 4));
    cabeza.add(esfera(0.06, 0xffa090, 0.22, -0.1, 0.28, 5, 4));
    cuerpo.add(cabeza);
    p.cabeza = cabeza;

    // ---- casco / pelo según el tipo ----
    if (tipo === 'espadachin' || tipo === 'guardian' || tipo === 'heroe') {
      var casco = malla(geo('casco', function () { return new THREE.SphereGeometry(0.41, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); }),
        mat(tipo === 'heroe' ? C.oro : C.metal), 0, 0.02, 0);
      cabeza.add(casco);
      cabeza.add(cil(0.42, 0.42, 0.07, 14, tipo === 'heroe' ? 0xb8862a : C.metalOsc, 0, 0.03, 0));
      if (tipo === 'guardian') cabeza.add(caja(0.06, 0.3, 0.06, C.metalOsc, 0, -0.05, 0.4));
      if (tipo === 'heroe') {
        for (var i = 0; i < 5; i++) {
          var a = i / 5 * Math.PI * 2;
          cabeza.add(cono(0.07, 0.2, 4, C.oro, Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3));
        }
        [-1, 1].forEach(function (s) { var ala = caja(0.05, 0.3, 0.22, C.blanco, s * 0.42, 0.2, -0.05); ala.rotation.z = -s * 0.4; cabeza.add(ala); });
      } else {
        var penacho = cono(0.1, 0.4, 5, tipo === 'guardian' ? C.azul : C.rojo, 0, 0.5, -0.05);
        cabeza.add(penacho);
      }
    }
    if (tipo === 'arquero') {
      cabeza.add(malla(geo('capucha', function () { return new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55); }), mat(0x3f9a4a), 0, 0, -0.03));
      cabeza.add(cono(0.16, 0.4, 5, 0x3f9a4a, 0, 0.3, -0.25).rotateX(-1.1));
    }
    if (tipo === 'trasgo' || tipo === 'bruto' || tipo === 'ogro') {
      [-1, 1].forEach(function (s) {
        var oreja = cono(0.1, 0.42, 4, piel, s * 0.42, 0.06, 0);
        oreja.rotation.z = -s * 1.25;
        cabeza.add(oreja);
      });
      cabeza.add(esfera(0.09, C.trasgoOsc, 0, -0.06, 0.37, 5, 4));
      // dientes
      cabeza.add(cono(0.035, 0.09, 3, C.blanco, -0.08, -0.2, 0.32).rotateX(Math.PI));
      cabeza.add(cono(0.035, 0.09, 3, C.blanco, 0.08, -0.2, 0.32).rotateX(Math.PI));
      if (tipo === 'bruto') {
        cabeza.add(malla(geo('cascoB', function () { return new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.2); }), mat(0x5a4a40), 0, 0.05, 0));
        [-1, 1].forEach(function (s) { var cu = cono(0.08, 0.4, 5, 0xf3ead8, s * 0.32, 0.38, 0); cu.rotation.z = -s * 0.6; cabeza.add(cu); });
      }
      if (tipo === 'ogro') {
        for (var j = 0; j < 4; j++) cabeza.add(cono(0.06, 0.22, 4, C.oro, -0.2 + j * 0.13, 0.38, 0.05));
      }
    }

    // ---- brazo derecho con arma ----
    var brazo = new THREE.Group();
    brazo.position.set(0.33, 0.68, 0);
    brazo.add(caja(0.13, 0.32, 0.13, ropa, 0, -0.12, 0));
    brazo.add(esfera(0.08, piel, 0, -0.3, 0, 6, 5));
    var arma = new THREE.Group();
    arma.position.set(0, -0.3, 0.05);
    if (tipo === 'espadachin' || tipo === 'heroe') {
      var largo = tipo === 'heroe' ? 0.95 : 0.7;
      arma.add(caja(0.07, largo, 0.025, C.metal, 0, largo / 2 + 0.08, 0));
      arma.add(caja(0.26, 0.05, 0.06, C.oro, 0, 0.08, 0));
      arma.add(caja(0.05, 0.12, 0.05, C.maderaOsc, 0, 0.01, 0));
      arma.rotation.x = 1.3;
    } else if (tipo === 'guardian') {
      arma.add(cil(0.035, 0.035, 0.6, 5, C.maderaOsc, 0, 0.25, 0));
      arma.add(caja(0.2, 0.2, 0.2, C.metalOsc, 0, 0.58, 0));
      arma.rotation.x = 1.3;
    } else if (tipo === 'arquero') {
      var arco = malla(geo('arco', function () { return new THREE.TorusGeometry(0.34, 0.03, 4, 10, Math.PI); }), mat(C.madera), 0, 0.05, 0.05);
      arco.rotation.set(0, Math.PI / 2, Math.PI / 2);
      arma.add(arco);
      cuerpo.add(cil(0.08, 0.08, 0.45, 6, C.cuero, -0.12, 0.65, -0.3).rotateZ(0.4));
    } else if (tipo === 'trasgo' || tipo === 'ogro') {
      arma.add(cil(0.05, 0.11, 0.7, 6, C.madera, 0, 0.35, 0));
      arma.add(esfera(0.13, C.maderaOsc, 0, 0.7, 0, 6, 4));
      arma.rotation.x = 1.2;
    } else if (tipo === 'bruto') {
      arma.add(cil(0.035, 0.035, 0.8, 5, C.maderaOsc, 0, 0.35, 0));
      arma.add(caja(0.05, 0.3, 0.3, C.metal, 0, 0.65, 0.12));
      arma.rotation.x = 1.2;
    }
    brazo.add(arma);
    cuerpo.add(brazo);
    p.brazo = brazo;

    // ---- brazo izquierdo / escudo ----
    var izq = new THREE.Group();
    izq.position.set(-0.33, 0.68, 0);
    izq.add(caja(0.13, 0.32, 0.13, ropa, 0, -0.12, 0));
    izq.add(esfera(0.08, piel, 0, -0.3, 0, 6, 5));
    if (tipo === 'espadachin' || tipo === 'guardian' || tipo === 'heroe') {
      var r = tipo === 'guardian' ? 0.42 : 0.28;
      var escudo = cil(r, r, 0.07, 10, tipo === 'heroe' ? C.oro : C.azul, -0.06, -0.15, 0.12);
      escudo.rotation.z = Math.PI / 2;
      escudo.rotation.y = Math.PI / 2;
      izq.add(escudo);
      izq.add(esfera(r * 0.3, tipo === 'heroe' ? C.rojo : C.oro, -0.06, -0.15, 0.17, 6, 4));
      izq.rotation.y = -0.5;
    }
    cuerpo.add(izq);
    p.izq = izq;

    // capa del héroe
    if (tipo === 'heroe') {
      var capa = caja(0.6, 0.75, 0.04, C.rojo, 0, 0.55, -0.34);
      capa.rotation.x = 0.15;
      cuerpo.add(capa);
    }

    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala };
  }

  // Animación de caminar / atacar
  function animarUnidad(u, t, caminando, ataque) {
    var p = u.p, v = caminando ? 1 : 0;
    var s = Math.sin(t * 11);
    p.piernaI.rotation.x = s * 0.7 * v;
    p.piernaD.rotation.x = -s * 0.7 * v;
    u.cuerpo.position.y = Math.abs(s) * 0.07 * v + (caminando ? 0 : Math.sin(t * 2.5) * 0.015);
    p.izq.rotation.x = -s * 0.4 * v;
    if (ataque > 0) {
      // ataque: el brazo sube y baja
      var k = ataque;
      p.brazo.rotation.x = -2.2 * Math.sin(k * Math.PI);
    } else {
      p.brazo.rotation.x = s * 0.4 * v;
    }
  }

  // =================================================================
  //  BARRA DE VIDA (siempre mira a la cámara)
  // =================================================================
  var geoBarra = new THREE.PlaneGeometry(1, 0.13);
  var matFondo = new THREE.MeshBasicMaterial({ color: 0x2a0d0d, depthTest: false, transparent: true });
  var matVerde = new THREE.MeshBasicMaterial({ color: 0x4fe04a, depthTest: false, transparent: true });
  var matRoja = new THREE.MeshBasicMaterial({ color: 0xff4a3a, depthTest: false, transparent: true });
  function barraVida(enemigo, ancho) {
    var g = new THREE.Group();
    var f = new THREE.Mesh(geoBarra, matFondo);
    f.scale.set(ancho + 0.08, 1.6, 1);
    f.renderOrder = 10;
    var b = new THREE.Mesh(geoBarra, enemigo ? matRoja : matVerde);
    b.scale.x = ancho;
    b.renderOrder = 11;
    b.position.z = 0.001;
    g.add(f); g.add(b);
    g.userData = { barra: b, ancho: ancho };
    return g;
  }
  function ponerVida(barra, frac) {
    var a = barra.userData.ancho;
    frac = Math.max(0, Math.min(1, frac));
    barra.userData.barra.scale.x = a * frac || 0.0001;
    barra.userData.barra.position.x = -a * (1 - frac) / 2;
  }

  // =================================================================
  //  FLECHA
  // =================================================================
  function flecha() {
    var g = new THREE.Group();
    var palo = cil(0.025, 0.025, 0.8, 4, C.madera, 0, 0, 0);
    palo.rotation.x = Math.PI / 2; palo.castShadow = false;
    var punta = cono(0.06, 0.16, 4, C.metalOsc, 0, 0, 0.45);
    punta.rotation.x = Math.PI / 2; punta.castShadow = false;
    var pluma = caja(0.12, 0.02, 0.15, C.blanco, 0, 0, -0.38); pluma.castShadow = false;
    g.add(palo); g.add(punta); g.add(pluma);
    return g;
  }

  // =================================================================
  //  NATURALEZA: árboles (en grupo para que sea rápido), rocas, nubes
  // =================================================================
  function bosque(posiciones) {
    // posiciones: [{x, z, s, tipo}]  tipo 0 = pino, 1 = árbol redondo
    var pinos = posiciones.filter(function (p) { return p.tipo === 0; });
    var redondos = posiciones.filter(function (p) { return p.tipo === 1; });
    var g = new THREE.Group();
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    function inst(geoI, color, lista, y, escalaY) {
      var im = new THREE.InstancedMesh(geoI, mat(color), lista.length);
      lista.forEach(function (p, i) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot || 0);
        v.set(p.x, (p.y || 0) + y * p.s, p.z); sc.set(p.s, p.s * (escalaY || 1), p.s);
        m4.compose(v, q, sc);
        im.setMatrixAt(i, m4);
        if (p.color !== undefined && im.setColorAt) im.setColorAt(i, new THREE.Color(p.color));
      });
      im.castShadow = true; im.receiveShadow = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      g.add(im);
      return im;
    }
    var tronco = new THREE.CylinderGeometry(0.18, 0.26, 1.2, 5);
    inst(tronco, C.maderaOsc, pinos, 0.6);
    inst(tronco, C.maderaOsc, redondos, 0.6);
    var cono1 = new THREE.ConeGeometry(1.25, 1.7, 7), cono2 = new THREE.ConeGeometry(0.95, 1.4, 7), cono3 = new THREE.ConeGeometry(0.6, 1.1, 7);
    pinos.forEach(function (p) { p.color = p.tono; });
    inst(cono1, 0xffffff, pinos, 1.7);
    inst(cono2, 0xffffff, pinos, 2.5);
    inst(cono3, 0xffffff, pinos, 3.2);
    var copa = new THREE.IcosahedronGeometry(1.15, 0);
    redondos.forEach(function (p) { p.color = p.tono; });
    inst(copa, 0xffffff, redondos, 2.0);
    return g;
  }

  function roca(s, color) {
    var r = malla(geo('roca', function () { return new THREE.DodecahedronGeometry(0.6, 0); }), mat(color || 0xa8a29a), 0, 0, 0);
    r.scale.set(s, s * 0.7, s);
    r.rotation.set(Math.random(), Math.random() * 6, Math.random());
    r.position.y = s * 0.2;
    return r;
  }

  function nube() {
    var g = new THREE.Group();
    var m = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    var gi = geo('nube', function () { return new THREE.IcosahedronGeometry(1, 0); });
    var n = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      var b = new THREE.Mesh(gi, m);
      b.position.set(i * 1.5 - n * 0.7, Math.random() * 0.6, Math.random() * 1.2);
      b.scale.setScalar(1.2 + Math.random() * 1.1);
      g.add(b);
    }
    return g;
  }

  function flor(color) {
    var g = new THREE.Group();
    var t = cil(0.02, 0.02, 0.3, 3, 0x3a8a2a, 0, 0.15, 0); t.castShadow = false;
    var c = esfera(0.08, color, 0, 0.32, 0, 5, 4); c.castShadow = false;
    g.add(t); g.add(c);
    return g;
  }

  // Moneda 3D pequeña (para efectos)
  function moneda() {
    var m = cil(0.25, 0.25, 0.06, 10, C.oro, 0, 0, 0);
    m.rotation.x = Math.PI / 2;
    var g = new THREE.Group(); g.add(m);
    return g;
  }

  return {
    mat: mat, caja: caja, cil: cil, cono: cono, esfera: esfera, colores: C,
    castillo: castillo, terreno: terreno, andamio: andamio,
    granja: granja, cuartel: cuartel, torre: torre,
    unidad: unidad, animarUnidad: animarUnidad,
    barraVida: barraVida, ponerVida: ponerVida, flecha: flecha,
    bosque: bosque, roca: roca, nube: nube, flor: flor, moneda: moneda,
    ondear: ondear
  };
})();
