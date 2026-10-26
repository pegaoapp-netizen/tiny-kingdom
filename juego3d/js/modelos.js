// =====================================================================
//  MODELOS 3D: todo se arma con figuras simples (estilo low-poly cartoon).
//  No usa imágenes ni modelos de otros juegos: todo es original.
// =====================================================================

var M = (function () {
  // ---------- Material: luz suave (Lambert), con caras planas donde ayuda ----------
  var cacheMat = {};
  function mat(color, extra) {
    var k = color + (extra ? JSON.stringify(extra) : '');
    if (!cacheMat[k]) {
      var o = { color: color };
      if (extra) for (var e in extra) o[e] = extra[e];
      cacheMat[k] = new THREE.MeshLambertMaterial(o);
    }
    return cacheMat[k];
  }
  // caras planas (follaje, rocas): se lee mejor la forma
  function matPlano(color) { return mat(color, { flatShading: true }); }

  // ---------- Luces de noche: ventanas, antorchas y faroles ----------
  // Un solo material compartido: al caer la noche se encienden todas a la vez.
  var matVentana = new THREE.MeshLambertMaterial({ color: 0x3a2a1e, emissive: 0xffb45a, emissiveIntensity: 0 });
  var matLlama = new THREE.MeshBasicMaterial({ color: 0xffa83a });
  var texBrillo = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(0.25, 'rgba(255,170,70,.55)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  var matBrillo = new THREE.SpriteMaterial({ map: texBrillo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  var matBrilloVentana = new THREE.SpriteMaterial({ map: texBrillo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  // k: 0 = día, 1 = noche cerrada
  function luzNoche(k, t) {
    matVentana.emissiveIntensity = k * 1.25;
    matBrillo.opacity = k * (0.82 + Math.sin(t * 13) * 0.07 + Math.sin(t * 7.3) * 0.06);
    matBrilloVentana.opacity = k * 0.5;
    matLlama.color.setHSL(0.08 + Math.sin(t * 11) * 0.012, 1, 0.55 + k * 0.08);
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
  // Ventana que se ilumina de noche
  function ventana(w, h, d, x, y, z) {
    var v = malla(geo('b' + w + h + d, function () { return new THREE.BoxGeometry(w, h, d); }), matVentana, x, y, z, false);
    return v;
  }
  // Brillo cálido (sprite) que solo se ve de noche
  function brillo(g, x, y, z, tam, deVentana) {
    var s = new THREE.Sprite(deVentana ? matBrilloVentana : matBrillo);
    s.position.set(x, y, z); s.scale.set(tam, tam, 1);
    s.renderOrder = 2;
    g.add(s);
    return s;
  }
  // Antorcha de pared o de poste: palo, cuenco de hierro, llama y halo de luz
  function antorcha(g, x, y, z, poste) {
    if (poste) g.add(cil(0.06, 0.08, y, 5, C.maderaOsc, x, y / 2, z));
    else g.add(caja(0.08, 0.5, 0.08, C.maderaOsc, x, y - 0.2, z));
    g.add(cil(0.14, 0.08, 0.14, 6, C.metalOsc, x, y + 0.08, z));
    var ll = malla(geo('llama', function () { return new THREE.ConeGeometry(0.11, 0.32, 5); }), matLlama, x, y + 0.3, z, false);
    g.add(ll);
    brillo(g, x, y + 0.35, z, 2.6);
  }
  // Barril y cajas: dan escala y vida a cada edificio
  function barril(g, x, z, s) {
    s = s || 1;
    g.add(cil(0.26 * s, 0.24 * s, 0.6 * s, 9, 0x8a5a32, x, 0.3 * s, z));
    g.add(cil(0.275 * s, 0.275 * s, 0.05 * s, 9, C.metalOsc, x, 0.15 * s, z));
    g.add(cil(0.275 * s, 0.275 * s, 0.05 * s, 9, C.metalOsc, x, 0.45 * s, z));
  }
  function cajas(g, x, z, rot) {
    var a = caja(0.5, 0.45, 0.5, 0xb08458, x, 0.225, z); a.rotation.y = rot || 0; g.add(a);
    var b = caja(0.38, 0.34, 0.38, 0x9a7048, x + 0.12, 0.62, z - 0.05); b.rotation.y = (rot || 0) + 0.5; g.add(b);
    var t = caja(0.52, 0.06, 0.06, 0x6e4a2a, x, 0.3, z + 0.255); t.rotation.y = rot || 0; t.castShadow = false; g.add(t);
  }

  var C = {
    piedra: 0xd8cbb0, piedraOsc: 0xa4937a, madera: 0x8f6038, maderaOsc: 0x5e3d24,
    // techoAzul era azul eléctrico: ahora es teja terracota (el nombre se deja para no romper nada)
    techoAzul: 0xb85a36, techoRojo: 0x9c3b28, oro: 0xe0b040, paja: 0xd9b66a,
    techoNoble: 0x7e2f22, tejaOsc: 0x7a3420, telaRoja: 0xa8322a, telaMar: 0x2e7a76, cobre: 0x5f9a88,
    piel: 0xffd3b0, metal: 0xd6dde5, metalOsc: 0x8d99a6, negro: 0x2a2320, blanco: 0xffffff,
    azul: 0x3d6fc0, azulOsc: 0x234a8a, verde: 0x5a9a48, rojo: 0xd2463a,
    trasgo: 0x8fcf4a, trasgoOsc: 0x5f9a2a, cuero: 0x8a5a33, bruto: 0x6f8f5a, ogro: 0x9b7bc0
  };

  // =================================================================
  //  FUSIONAR: junta las piezas quietas que comparten material en una sola
  //  (se ve igual, pero el teléfono dibuja muchas menos cosas por cuadro)
  // =================================================================
  function fusionar(grupo, soloHijos) {
    grupo.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(grupo.matrixWorld).invert();
    var porMat = {}, quitar = [];
    (soloHijos ? function (fn) { grupo.children.slice().forEach(fn); } : function (fn) { grupo.traverse(fn); })(function (o) {
      if (!o.isMesh || o.isInstancedMesh || o.userData.ondea || o.userData.noFusionar || !o.geometry.attributes.position) return;
      var p = o; var mov = false;
      while (p && p !== grupo) { if (p.userData.noFusionar) mov = true; p = p.parent; }
      if (mov || o.material.transparent) return;
      var k = o.material.uuid;
      (porMat[k] = porMat[k] || { mat: o.material, lista: [], sombra: false }).lista.push(o);
      if (o.castShadow) porMat[k].sombra = true;
      quitar.push(o);
    });
    Object.keys(porMat).forEach(function (k) {
      var e = porMat[k];
      if (e.lista.length < 2) { quitar.splice(quitar.indexOf(e.lista[0]), 1); return; }
      var pos = [], nor = [];
      var m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3(), v = new THREE.Vector3();
      e.lista.forEach(function (o) {
        var g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
        if (!g.attributes.normal) g.computeVertexNormals();
        m4.multiplyMatrices(inv, o.matrixWorld);
        m3.getNormalMatrix(m4);
        var P = g.attributes.position, N = g.attributes.normal;
        for (var i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
          v.fromBufferAttribute(N, i).applyMatrix3(m3).normalize(); nor.push(v.x, v.y, v.z);
        }
      });
      var bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      bg.computeBoundingSphere();
      var mm = new THREE.Mesh(bg, e.mat);
      mm.castShadow = e.sombra; mm.receiveShadow = true;
      grupo.add(mm);
    });
    quitar.forEach(function (o) { if (o.parent) o.parent.remove(o); });
    return grupo;
  }

  // =================================================================
  //  DETALLES: tejas, piedras de esquina, chimeneas
  // =================================================================
  // Líneas de tejas sobre un techo de dos aguas. eje 'z' = la cumbrera va a lo largo de z.
  function tejas(g, cx, cy, cz, semi, alto, largo, color, eje) {
    var ang = Math.atan2(alto, semi);
    var lado = Math.hypot(semi, alto);
    for (var k = 1; k <= 3; k++) {
      var tt = k / 4;
      [-1, 1].forEach(function (s) {
        var off = semi * (1 - tt) * s, y = cy + alto * tt + 0.03;
        var porX = eje === 'z2';
        var b = (eje === 'x') ? caja(0.07, 0.06, largo + 0.04, 0x000000, 0, 0, 0) : caja(largo + 0.04, 0.06, 0.07, 0x000000, 0, 0, 0);
        b.material = mat(color);
        if (eje === 'x') { b.position.set(cx + off, y, cz); b.rotation.z = -s * ang; }
        else { b.position.set(cx, y, cz + off); b.rotation.x = s * ang; }
        b.castShadow = false;
        g.add(b);
      });
    }
    // cumbrera
    var c = eje === 'x' ? caja(0.16, 0.12, largo + 0.1, color, cx, cy + alto + 0.02, cz) : caja(largo + 0.1, 0.12, 0.16, color, cx, cy + alto + 0.02, cz);
    c.castShadow = false;
    g.add(c);
  }
  // Piedras en las esquinas de un muro (cx, cz centro; w, d tamaño; y0..y1 alto)
  function esquinas(g, cx, cz, w, d, y0, y1, color) {
    var n = Math.max(2, Math.round((y1 - y0) / 0.32));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      for (var i = 0; i < n; i++) {
        var largo = i % 2 ? 0.26 : 0.38;
        var b = caja(largo, (y1 - y0) / n * 0.9, largo, color, cx + s[0] * (w / 2), y0 + (i + 0.5) * (y1 - y0) / n, cz + s[1] * (d / 2));
        b.castShadow = false;
        g.add(b);
      }
    });
  }
  function chimenea(g, x, y, z) {
    g.add(caja(0.3, 0.6, 0.3, 0x9a8f80, x, y, z));
    g.add(caja(0.38, 0.1, 0.38, 0x6e6458, x, y + 0.32, z));
    g.userData.chimenea = new THREE.Vector3(x, y + 0.45, z);
  }

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
  var cacheInsignia = {};
  function insigniaNivel(n) {
    if (!cacheInsignia[n]) {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var x = c.getContext('2d');
      x.fillStyle = n >= 9 ? '#f5c542' : n >= 5 ? '#6f8fb5' : '#3a2414';
      x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2); x.fill();
      x.lineWidth = 5; x.strokeStyle = '#ffe9b0'; x.stroke();
      x.fillStyle = n >= 9 ? '#3a2414' : '#ffffff'; x.font = 'bold 32px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(n), 32, 34);
      var tx = new THREE.CanvasTexture(c);
      cacheInsignia[n] = new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true });
    }
    var s = new THREE.Sprite(cacheInsignia[n]);
    s.scale.set(1.3, 1.3, 1);
    s.renderOrder = 12;
    return s;
  }
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
  function castillo(nivelVis) {
    nivelVis = nivelVis || 1;
    var colTecho = nivelVis >= 3 ? C.techoNoble : nivelVis === 2 ? C.techoRojo : C.techoAzul;
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
      g.add(cono(1.55, 2.2, 8, colTecho, x, 0.7 + 5.6, z));
      g.add(caja(0.25, 0.5, 0.08, C.negro, x - s[0] * 0.1, 3.6, z + s[1] * 1.17));
    });
    // torre central (torre del homenaje)
    g.add(caja(4.4, 5, 4.4, C.piedra, 0.6, 0.7 + 2.5, 0));
    g.add(caja(4.8, 0.4, 4.8, C.piedraOsc, 0.6, 0.7 + 5.1, 0));
    var techo = cono(3.6, 3.4, 4, colTecho, 0.6, 0.7 + 7, 0);
    techo.rotation.y = Math.PI / 4;
    g.add(techo);
    var b = bandera(C.telaRoja, 2.2); b.position.set(0.6, 8.4, 0); g.add(b);
    g.userData.banderas = [b.userData.tela];
    b.userData.noFusionar = true;
    // piedras de esquina en la torre del homenaje y franja de piedra en la muralla
    esquinas(g, 0.6, 0, 4.4, 4.4, 0.7, 5.6, 0xe8e2d8);
    [[0, -L / 2, L, t], [0, L / 2, L, t], [-L / 2, 0, t, L], [L / 2, 0, t, L]].forEach(function (mq) {
      var fr = caja(mq[2] + 0.06, 0.16, mq[3] + 0.06, C.piedraOsc, mq[0], 0.7 + h * 0.55, mq[1]); fr.castShadow = false; g.add(fr);
    });
    // banderitas en dos torres
    [[-1, -1], [1, 1]].forEach(function (s) { var bt = bandera(C.telaMar, 1.4); bt.userData.noFusionar = true; bt.position.set(s[0] * L / 2, 7.5, s[1] * L / 2); bt.scale.setScalar(0.7); g.add(bt); g.userData.banderas.push(bt.userData.tela); });
    // ventanas (se encienden de noche)
    for (var i = -1; i <= 1; i += 2) {
      g.add(ventana(0.08, 0.8, 0.5, 0.6 - 2.21, 4.2, i * 1.1));
      g.add(ventana(0.5, 0.8, 0.08, 0.6 + i * 1.1, 4.2, 2.21));
      brillo(g, 0.6 - 2.4, 4.2, i * 1.1, 1.6, true);
      brillo(g, 0.6 + i * 1.1, 4.2, 2.4, 1.6, true);
    }
    // remates dorados en los techos (lo único dorado del castillo)
    g.add(esfera(0.22, C.oro, 0.6, 0.7 + 8.75, 0, 8, 6));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { g.add(esfera(0.14, C.oro, s[0] * L / 2, 0.7 + 6.75, s[1] * L / 2, 6, 4)); });
    // puerta (mira hacia el camino: lado -x)
    g.add(caja(0.3, 2.0, 2.2, C.maderaOsc, -L / 2 - 0.35, 1.7, 0));
    g.add(cil(1.1, 1.1, 0.3, 10, C.maderaOsc, -L / 2 - 0.35, 2.7, 0).rotateZ(Math.PI / 2));
    g.add(caja(0.35, 0.15, 2.4, C.metalOsc, -L / 2 - 0.4, 1.2, 0));
    g.add(caja(0.35, 0.15, 2.4, C.metalOsc, -L / 2 - 0.4, 2.2, 0));
    // arco de piedra sobre la puerta y escalón
    var arco = malla(geo('arcoPuerta', function () { return new THREE.TorusGeometry(1.25, 0.2, 6, 12, Math.PI); }), mat(0xe8e2d8), -L / 2 - 0.45, 2.7, 0);
    arco.rotation.y = Math.PI / 2; g.add(arco);
    g.add(caja(0.8, 0.12, 2.8, C.piedraOsc, -L / 2 - 0.7, 0.75, 0));
    // ventanas con marco en la torre del homenaje (segundo piso)
    [-1.1, 0, 1.1].forEach(function (z) { g.add(ventana(0.08, 0.55, 0.4, 0.6 - 2.21, 2.6, z)); g.add(caja(0.1, 0.08, 0.55, 0xf2ece0, 0.6 - 2.23, 2.9, z)); });
    // estandartes al lado de la puerta
    [-1.7, 1.7].forEach(function (z) {
      g.add(caja(0.1, 1.6, 0.9, C.telaRoja, -L / 2 - 0.5, 2.1, z));
      g.add(esfera(0.18, C.oro, -L / 2 - 0.58, 2.3, z, 6, 4));
    });
    // antorchas a los lados de la puerta, barriles y cajas junto a la entrada
    antorcha(g, -L / 2 - 0.55, 2.9, -2.55);
    antorcha(g, -L / 2 - 0.55, 2.9, 2.55);
    barril(g, -L / 2 - 1.2, -3.2); barril(g, -L / 2 - 1.75, -3.45, 0.85);
    cajas(g, -L / 2 - 1.3, 3.3, 0.3);
    // escaleras de piedra hacia el adarve
    for (var es = 0; es < 4; es++) g.add(caja(0.7, 0.18, 0.5, C.piedraOsc, L / 2 - 1.0, 0.8 + es * 0.42, 2.6 - es * 0.45));
    return fusionar(g);
  }

  // =================================================================
  //  TERRENO PARA CONSTRUIR
  // =================================================================
  function terreno() {
    var g = new THREE.Group();
    // parcela de tierra removida, con bordes suaves (no una baldosa)
    var base = malla(geo('parcela', function () { return new THREE.CylinderGeometry(2.45, 2.65, 0.1, 10); }), mat(0x8c6e4a), 0, 0.05, 0, false);
    base.rotation.y = Math.PI / 10;
    g.add(base);
    for (var sr = -1; sr <= 1; sr++) { var su = caja(3.4, 0.07, 0.35, 0x7a5d3c, 0, 0.12, sr * 1.1); su.castShadow = false; g.add(su); }
    // estacas y cuerda: solo se ven al elegir dónde construir
    var marcas = new THREE.Group();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      marcas.add(cil(0.08, 0.1, 0.6, 5, C.madera, s[0] * 2, 0.3, s[1] * 2));
    });
    [[0, -2, 4, 0.03], [0, 2, 4, 0.03], [-2, 0, 0.03, 4], [2, 0, 0.03, 4]].forEach(function (q) { var cu = caja(q[2], 0.03, q[3], 0xe8d8a8, q[0], 0.5, q[1]); cu.castShadow = false; marcas.add(cu); });
    marcas.visible = false;
    marcas.userData.noFusionar = true;
    g.add(marcas);
    g.userData.marcas = marcas;
    var brillo = new THREE.Mesh(
      geo('brillo', function () { return new THREE.RingGeometry(2.4, 2.9, 32); }),
      new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    brillo.rotation.x = -Math.PI / 2;
    brillo.position.y = 0.2;
    g.add(brillo);
    g.userData.brillo = brillo;
    return fusionar(g);
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
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    // casita
    g.add(caja(2, 1.4, 1.6, 0xeadcc0, -0.6, 0.85, -0.6));
    var techo = malla(geo('techoGranja', function () {
      var s = new THREE.Shape(); s.moveTo(-1.25, 0); s.lineTo(1.25, 0); s.lineTo(0, 1); s.lineTo(-1.25, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: false }); e.translate(0, 0, -0.95); return e;
    }), mat(nivel >= 3 ? C.techoNoble : C.techoAzul), -0.6, 1.55, -0.6);
    g.add(techo);
    tejas(g, -0.6, 1.55, -0.6, 1.25, 1, 1.9, nivel >= 3 ? C.oro : C.tejaOsc, 'x');
    esquinas(g, -0.6, -0.6, 2, 1.6, 0.15, 1.55, 0xc9b896);
    chimenea(g, -1.1, 2.15, -0.9);
    g.add(caja(0.45, 0.7, 0.06, C.maderaOsc, -0.6, 0.5, 0.21));
    g.add(ventana(0.35, 0.35, 0.06, -1.2, 1.0, 0.21));
    g.add(caja(0.45, 0.06, 0.12, C.maderaOsc, -1.2, 0.8, 0.24));
    brillo(g, -1.2, 1.0, 0.45, 1.2, true);
    barril(g, 0.0, 0.5, 0.8); cajas(g, -1.5, 0.6, 0.2);
    // carretilla de heno
    g.add(caja(0.6, 0.25, 0.45, C.madera, 0.2, 0.35, 1.35));
    g.add(esfera(0.28, C.paja, 0.2, 0.55, 1.35, 7, 5));
    var rueda = cil(0.18, 0.18, 0.05, 8, C.maderaOsc, 0.55, 0.18, 1.35); rueda.rotation.x = Math.PI / 2; g.add(rueda);
    // campo de trigo
    var filas = 2 + nivel;
    for (var i = 0; i < filas; i++) {
      g.add(caja(0.35, 0.45, 1.5, C.paja, 0.6 + (i % 3) * 0.5, 0.3, 0.9 - Math.floor(i / 3) * 0 ));
    }
    for (var j = 0; j < 3; j++) g.add(caja(1.6, 0.45, 0.3, 0xd8b04a, 0.9, 0.3, -0.4 - j * 0.45));
    // molino
    var molino = new THREE.Group();
    molino.add(cil(0.35, 0.5, 2.4, 6, 0xf0e6d0, 0, 1.2, 0));
    molino.add(cono(0.55, 0.7, 6, C.techoAzul, 0, 2.75, 0));
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
    aspas.userData.noFusionar = true;
    // valla
    for (var f = -1.8; f <= 1.8; f += 0.6) g.add(caja(0.08, 0.4, 0.08, C.madera, f, 0.2, 1.9));
    g.add(caja(3.7, 0.06, 0.06, C.madera, 0, 0.3, 1.9));
    return g;
  }

  // Cuartel: fortaleza de piedra con portón grande (por ahí salen las tropas),
  // dos torrecitas con techo rojo y banderas. Nivel 9+: adornos de oro.
  function cuartel(nivel) {
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    var oro = nivel >= 3, adorno = oro ? C.oro : C.metalOsc;
    var gris = 0xa3a6ad, grisOsc = 0x7c8089, grisClaro = 0xbfc2c8, viga = 0x8a5a32, vigaOsc = 0x5e3d24, rojo = nivel >= 2 ? 0xb8402e : 0xb85a36;
    // base de piedra con borde de madera
    g.add(caja(3.8, 0.25, 3.0, grisOsc, 0, 0.12, -0.35));
    g.add(caja(3.9, 0.1, 3.1, vigaOsc, 0, 0.28, -0.35));
    // salón de piedra
    g.add(caja(3.0, 1.8, 2.2, gris, 0, 1.2, -0.45));
    for (var y = 0.6; y < 2.0; y += 0.45) { var fr = caja(3.04, 0.05, 2.24, grisOsc, 0, y, -0.45); fr.castShadow = false; g.add(fr); }
    // vigas de madera en el frente
    [-1.45, 1.45].forEach(function (x) { g.add(caja(0.18, 1.8, 0.14, viga, x, 1.2, 0.68)); });
    g.add(caja(3.1, 0.16, 0.14, viga, 0, 2.08, 0.68));
    // techo a dos aguas con tejas
    var techo = malla(geo('techoCuartel2', function () {
      var s = new THREE.Shape(); s.moveTo(-1.35, 0); s.lineTo(1.35, 0); s.lineTo(0, 1.05); s.lineTo(-1.35, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 3.4, bevelEnabled: false }); e.translate(0, 0, -1.7); e.rotateY(Math.PI / 2); return e;
    }), mat(rojo), 0, 2.1, -0.45);
    g.add(techo);
    tejas(g, 0, 2.1, -0.45, 1.35, 1.05, 3.4, oro ? C.oro : 0x7a2a1a, 'z2');
    g.add(caja(3.5, 0.1, 0.1, oro ? C.oro : vigaOsc, 0, 3.15, -0.45));
    chimenea(g, 0.9, 2.8, -1.0);
    // PORTÓN grande de dos hojas con arco de piedra
    g.add(caja(1.5, 1.45, 0.2, grisClaro, 0, 0.98, 0.72));
    g.add(caja(1.1, 1.15, 0.1, 0x2a1d14, 0, 0.88, 0.8));
    [-0.28, 0.28].forEach(function (x, i) {
      var hoja = caja(0.54, 1.1, 0.08, C.maderaOsc, x + (i ? 0.12 : -0.12), 0.86, 0.95);
      hoja.rotation.y = i ? -0.5 : 0.5; g.add(hoja);
      [0.55, 1.15].forEach(function (yy) { var tira = caja(0.56, 0.07, 0.1, adorno, x + (i ? 0.12 : -0.12), yy, 0.96); tira.rotation.y = hoja.rotation.y; g.add(tira); });
    });
    g.add(caja(1.6, 0.18, 0.26, oro ? C.oro : grisOsc, 0, 1.72, 0.74));
    // escudo sobre el portón
    g.add(cil(0.26, 0.26, 0.08, 6, oro ? C.oro : C.telaRoja, 0, 1.95, 0.84).rotateX(Math.PI / 2));
    // ventanas
    [-0.95, 0.95].forEach(function (x) { g.add(ventana(0.3, 0.42, 0.06, x, 1.5, 0.66)); brillo(g, x, 1.5, 0.9, 1.1, true); });
    antorcha(g, -0.95, 1.05, 0.82); antorcha(g, 0.95, 1.05, 0.82);
    // dos torrecitas en las esquinas del frente
    var altoT = 2.7 + nivel * 0.35;
    g.userData.banderas = [];
    [-1.55, 1.55].forEach(function (x) {
      g.add(caja(0.95, altoT, 0.95, gris, x, altoT / 2 + 0.25, 0.55));
      g.add(caja(1.05, 0.08, 1.05, grisOsc, x, altoT * 0.5, 0.55));
      g.add(caja(1.15, 0.16, 1.15, viga, x, altoT + 0.25, 0.55));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { g.add(caja(0.26, 0.26, 0.26, grisClaro, x + q[0] * 0.43, altoT + 0.46, 0.55 + q[1] * 0.43)); });
      var tc = cono(0.78, 0.85, 4, rojo, x, altoT + 1.0, 0.55); tc.rotation.y = Math.PI / 4; g.add(tc);
      g.add(esfera(0.09, oro ? C.oro : vigaOsc, x, altoT + 1.47, 0.55, 6, 4));
      g.add(ventana(0.08, 0.36, 0.06, x, altoT * 0.72, 1.04));
      var b = bandera(x < 0 ? C.telaRoja : C.azul, 1.4); b.userData.noFusionar = true; b.position.set(x, altoT + 1.4, 0.55); b.scale.set(0.7, 0.8, 0.7); g.add(b);
      g.userData.banderas.push(b.userData.tela);
    });
    // patio: muñeco de práctica, armero y barriles
    var m = new THREE.Group();
    m.add(cil(0.07, 0.07, 1.2, 5, C.madera, 0, 0.6, 0));
    m.add(cil(0.25, 0.25, 0.6, 7, C.paja, 0, 1.1, 0));
    m.add(esfera(0.22, C.paja, 0, 1.6, 0, 7, 5));
    m.add(caja(0.9, 0.1, 0.1, C.madera, 0, 1.2, 0));
    m.position.set(1.45, 0, 1.75);
    g.add(m);
    g.add(caja(0.9, 0.08, 0.2, C.madera, -1.35, 0.9, 1.6));
    for (var i = 0; i < 3; i++) g.add(caja(0.06, 1.0, 0.06, C.metal, -1.65 + i * 0.3, 0.6, 1.6));
    barril(g, -1.75, -1.5); barril(g, -1.2, -1.7, 0.85);
    return g;
  }

  // Torre fortaleza (niveles 5 en adelante): base cuadrada de piedra con vigas,
  // almenas, cuerpo con puertas y techo rojo tipo pagoda. Nivel 9+: adornos de oro.
  function torreFortaleza(nivel) {
    var g = new THREE.Group(), t = new THREE.Group();
    var S = nivel <= 1 ? 1.0 : 1.15; t.scale.setScalar(S); g.add(t);
    var oro = nivel >= 3, adorno = oro ? C.oro : C.maderaOsc;
    var gris = 0xa3a6ad, grisOsc = 0x7c8089, grisClaro = 0xbfc2c8, viga = 0x8a5a32, vigaOsc = 0x5e3d24;
    var R2 = Math.SQRT2;
    // bloque cuadrado que se angosta hacia arriba (cilindro de 4 lados girado)
    function bloque(abajo, arriba, alto, y, color) {
      var b = cil(arriba * R2, abajo * R2, alto, 4, color, 0, y + alto / 2, 0);
      b.rotation.y = Math.PI / 4; t.add(b); return b;
    }
    function almenas(medio, y, tam, paso, color) {
      for (var s = 0; s < 4; s++) {
        for (var p = -medio; p <= medio + 0.001; p += paso) {
          var x = s < 2 ? p : (s === 2 ? -medio : medio), z = s < 2 ? (s === 0 ? -medio : medio) : p;
          if (s >= 2 && Math.abs(p) > medio - 0.01) continue; // esquinas ya puestas
          t.add(caja(tam, tam * 0.9, tam, (Math.round((x + z) * 7) % 2) ? color : grisClaro, x, y + tam * 0.45, z));
        }
      }
    }
    // pieza que va de un punto a otro (vigas en diagonal, aristas del techo)
    function barra(a, b, grueso, color) {
      var d = new THREE.Vector3().subVectors(b, a), largo = d.length();
      var m = malla(geo('barra' + largo.toFixed(2) + grueso, function () { return new THREE.BoxGeometry(grueso, grueso, largo); }), mat(color));
      m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); t.add(m); return m;
    }
    var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };

    // 1. BASE: piedra con marco de madera
    var B = 1.3, hB = 1.35;
    bloque(B + 0.05, B, hB, 0, grisOsc);
    t.add(caja(2 * B + 0.3, 0.12, 2 * B + 0.3, vigaOsc, 0, 0.06, 0));
    for (var s = 0; s < 4; s++) {
      var ang = s * Math.PI / 2, cx = Math.sin(ang), cz = Math.cos(ang), px = Math.cos(ang), pz = -Math.sin(ang);
      var e = B + 0.1;
      // postes en esquinas y al medio
      [-1, 0, 1].forEach(function (k) {
        t.add(caja(0.22, hB, 0.22, viga, cx * e + px * k * B, hB / 2, cz * e + pz * k * B));
      });
      // vigas de arriba y abajo
      var vg = caja(s % 2 ? 0.16 : 2 * B + 0.3, 0.16, s % 2 ? 2 * B + 0.3 : 0.16, viga, cx * e, hB - 0.1, cz * e); t.add(vg);
      t.add(caja(s % 2 ? 0.16 : 2 * B + 0.3, 0.14, s % 2 ? 2 * B + 0.3 : 0.14, vigaOsc, cx * e, 0.3, cz * e));
      // cruces de madera
      [-1, 1].forEach(function (k) {
        barra(V(cx * e + px * k * 0.12, 0.3, cz * e + pz * k * 0.12), V(cx * e + px * k * (B - 0.12), hB - 0.15, cz * e + pz * k * (B - 0.12)), 0.11, viga);
      });
      // remaches de hierro en las esquinas
      t.add(caja(0.26, 0.1, 0.26, C.metalOsc, cx * e + px * B, 0.22, cz * e + pz * B));
    }
    // piso del primer balcón y almenas
    t.add(caja(2 * B + 0.4, 0.14, 2 * B + 0.4, grisClaro, 0, hB + 0.07, 0));
    almenas(B + 0.05, hB + 0.14, 0.34, 0.52, gris);

    // 2. CUERPO DEL MEDIO (se angosta) con puertas
    var y1 = hB + 0.14, hM = 1.6, M1 = 0.95, M2 = 0.78;
    bloque(M1, M2, hM, y1, gris);
    // franjas de piedra para que se note el ladrillo
    for (var yy = 0.4; yy < hM; yy += 0.4) {
      var w = M1 - (M1 - M2) * yy / hM + 0.02;
      var fr = bloque(w, w, 0.05, y1 + yy, grisOsc); fr.castShadow = false;
    }
    [0, Math.PI / 2].forEach(function (a, i) {
      var dx = Math.sin(a), dz = Math.cos(a), r = M1 - 0.05;
      var pu = caja(i ? 0.08 : 0.5, 0.75, i ? 0.5 : 0.08, C.maderaOsc, dx * r, y1 + 0.38, dz * r); t.add(pu);
      t.add(caja(i ? 0.1 : 0.62, 0.1, i ? 0.62 : 0.1, adorno, dx * (r + 0.01), y1 + 0.8, dz * (r + 0.01)));
      t.add(caja(i ? 0.1 : 0.08, 0.75, i ? 0.08 : 0.1, adorno, dx * (r + 0.01) + (i ? 0 : -0.29), y1 + 0.38, dz * (r + 0.01) + (i ? -0.29 : 0)));
      t.add(caja(i ? 0.1 : 0.08, 0.75, i ? 0.08 : 0.1, adorno, dx * (r + 0.01) + (i ? 0 : 0.29), y1 + 0.38, dz * (r + 0.01) + (i ? 0.29 : 0)));
      t.add(ventana(i ? 0.06 : 0.16, 0.32, i ? 0.16 : 0.06, dx * (M2 + 0.07) + (i ? 0 : 0.42), y1 + 1.2, dz * (M2 + 0.07) + (i ? 0.42 : 0)));
    });
    // placa al frente
    t.add(caja(0.55, 0.22, 0.06, adorno, 0, y1 + 1.15, M2 + 0.1));
    if (oro) t.add(caja(0.4, 0.08, 0.04, 0x9a7420, 0, y1 + 1.15, M2 + 0.14));

    // 3. SEGUNDO BALCÓN con almenas y placas en las esquinas
    var y2 = y1 + hM, B2 = 1.05;
    t.add(caja(2 * B2 + 0.2, 0.16, 2 * B2 + 0.2, viga, 0, y2 + 0.02, 0));
    t.add(caja(2 * B2, 0.1, 2 * B2, grisClaro, 0, y2 + 0.15, 0));
    almenas(B2, y2 + 0.2, 0.3, 0.42, gris);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) {
      t.add(caja(0.26, 0.26, 0.26, adorno, q[0] * (B2 + 0.12), y2 + 0.05, q[1] * (B2 + 0.12)));
      if (oro) t.add(caja(0.26, 0.26, 0.26, adorno, q[0] * (B + 0.22), hB - 0.02, q[1] * (B + 0.22)));
    });
    if (oro) { // musgo
      [[0.9, 0.4], [-0.6, 1.0], [1.0, -0.8]].forEach(function (m) { t.add(caja(0.22, 0.05, 0.18, 0x6f9a3c, m[0], hB + 0.16, m[1])); });
    }

    // 4. CUARTO DE ARRIBA con ventanas de madera
    var y3 = y2 + 0.2, hA = 1.05, A = 0.62;
    bloque(A, A, hA, y3, gris);
    for (var k = 0; k < 4; k++) {
      var a2 = k * Math.PI / 2, ddx = Math.sin(a2), ddz = Math.cos(a2), lado = k % 2;
      t.add(ventana(lado ? 0.06 : 0.36, 0.48, lado ? 0.36 : 0.06, ddx * (A + 0.02), y3 + 0.5, ddz * (A + 0.02)));
      t.add(caja(lado ? 0.07 : 0.44, 0.06, lado ? 0.44 : 0.07, viga, ddx * (A + 0.04), y3 + 0.5, ddz * (A + 0.04)));
      t.add(caja(lado ? 0.07 : 0.06, 0.56, lado ? 0.06 : 0.07, viga, ddx * (A + 0.04), y3 + 0.5, ddz * (A + 0.04)));
    }
    t.add(caja(2 * A + 0.12, 0.1, 2 * A + 0.12, adorno, 0, y3 + hA - 0.02, 0));

    // 5. TECHO DE PAGODA: rojo con tejas, aristas y puntas curvas
    var y4 = y3 + hA, R = 1.05, hT = 0.95;
    var techo = cono(R * R2, hT, 4, nivel <= 1 ? 0xb85a36 : 0xb8402e, 0, y4 + hT / 2, 0); techo.rotation.y = Math.PI / 4; t.add(techo);
    // filas de tejas (escalones un poco más oscuros)
    for (var f = 0; f < 3; f++) {
      var rf = R * (1 - (f + 0.5) / 3.4) + 0.04;
      var fila = cil(rf * R2 * 0.92, rf * R2, 0.07, 4, 0x93301f, 0, y4 + hT * (f + 0.5) / 3.4, 0); fila.rotation.y = Math.PI / 4; fila.castShadow = false; t.add(fila);
    }
    // borde del alero
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (q) {
      t.add(caja(q[0] ? 0.08 : 2 * R + 0.08, 0.1, q[0] ? 2 * R + 0.08 : 0.08, adorno, q[0] * R, y4 + 0.02, q[1] * R));
    });
    var punta = V(0, y4 + hT, 0);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) {
      var esq = V(q[0] * R, y4 + 0.03, q[1] * R);
      barra(esq, punta, 0.08, adorno);
      // punta del alero que se curva hacia arriba
      var curva = barra(esq, V(q[0] * (R + 0.32), y4 + 0.36, q[1] * (R + 0.32)), 0.1, adorno);
      if (oro) t.add(esfera(0.07, adorno, q[0] * (R + 0.32), y4 + 0.4, q[1] * (R + 0.32), 6, 4));
    });
    // remate de arriba: marquito cuadrado y bolita
    t.add(caja(0.42, 0.12, 0.42, adorno, 0, y4 + hT - 0.08, 0));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { t.add(caja(0.08, 0.2, 0.08, adorno, q[0] * 0.2, y4 + hT + 0.04, q[1] * 0.2)); });
    t.add(esfera(0.1, adorno, 0, y4 + hT + 0.1, 0, 6, 4));
    // bandera azul
    var bd = bandera(C.azul, 1.5); bd.userData.noFusionar = true; bd.position.set(0, y4 + hT, 0); bd.scale.set(0.65, 0.8, 0.65); t.add(bd);
    g.userData.banderas = [bd.userData.tela];

    // antorchas a los lados de la entrada
    antorcha(t, -0.55, 1.1, B + 0.25); antorcha(t, 0.55, 1.1, B + 0.25);

    // arquero en el segundo balcón, mirando al frente
    var arq = unidad('arquero', 1);
    arq.grupo.scale.setScalar(0.75);
    arq.grupo.position.set(0, y2 + 0.2, M2 + 0.45);
    arq.grupo.userData.noFusionar = true;
    t.add(arq.grupo);
    g.userData.arquero = arq;
    g.userData.alturaDisparo = (y2 + 1.0) * S;
    return g;
  }

  function torre(nivel) {
    nivel = Math.min(3, nivel);
    if (nivel >= 1) return torreFortaleza(nivel);
    var g = new THREE.Group();
    var alto = 3.6 + nivel * 0.8;
    g.add(cil(1.3, 1.5, 0.5, 8, C.piedraOsc, 0, 0.25, 0));
    g.add(cil(0.95, 1.2, alto, 8, C.piedra, 0, 0.5 + alto / 2, 0));
    for (var an = 1; an < alto; an += 1.3) { var ani = cil(1.2 - an / alto * 0.25 + 0.04, 1.2 - an / alto * 0.25 + 0.04, 0.14, 8, C.piedraOsc, 0, 0.5 + an, 0); ani.castShadow = false; g.add(ani); }
    g.add(cil(1.35, 1.1, 0.5, 8, C.piedraOsc, 0, 0.5 + alto + 0.25, 0));
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      g.add(caja(0.4, 0.45, 0.4, C.piedra, Math.cos(a) * 1.2, 0.5 + alto + 0.7, Math.sin(a) * 1.2));
    }
    // techo sobre postes
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      g.add(cil(0.06, 0.06, 1.4, 5, C.madera, s[0] * 0.8, 0.5 + alto + 1.2, s[1] * 0.8));
    });
    g.add(cono(1.6, 1.4, 8, nivel >= 3 ? C.techoNoble : C.techoAzul, 0, 0.5 + alto + 2.4, 0));
    if (nivel >= 3) g.add(esfera(0.16, C.oro, 0, 0.5 + alto + 3.15, 0, 6, 4));
    g.add(ventana(0.25, 0.6, 0.1, 0, 0.5 + alto * 0.6, 1.08));
    g.add(ventana(0.1, 0.6, 0.25, -1.08, 0.5 + alto * 0.4, 0));
    // puerta de madera con arco y antorcha
    g.add(caja(0.6, 0.95, 0.1, C.maderaOsc, 0, 0.95, 1.18));
    g.add(caja(0.75, 0.12, 0.14, C.piedraOsc, 0, 1.48, 1.2));
    antorcha(g, 0.6, 1.6, 1.25);
    // arquero en la torre
    var arq = unidad('arquero', 1);
    arq.grupo.scale.setScalar(0.8);
    arq.grupo.position.y = 0.5 + alto + 0.5;
    g.add(arq.grupo);
    g.userData.arquero = arq;
    arq.grupo.userData.noFusionar = true;
    g.userData.alturaDisparo = 0.5 + alto + 1.4;
    return g;
  }

  // Enfermería: casa blanca con techo verde y cruz verde (no roja: la cruz roja es un símbolo protegido)
  function enfermeria(nivel) {
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    var verde = 0x4a9a62, verdeOsc = 0x2f7246, blanco = 0xf2ece0;
    g.add(caja(3.2, 0.25, 2.4, C.piedraOsc, 0, 0.12, -0.3));
    g.add(caja(3.0, 1.5, 2.2, blanco, 0, 1.0, -0.3));
    var techo = malla(geo('techoEnf', function () {
      var s = new THREE.Shape(); s.moveTo(-1.35, 0); s.lineTo(1.35, 0); s.lineTo(0, 0.95); s.lineTo(-1.35, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 3.3, bevelEnabled: false }); e.translate(0, 0, -1.65); e.rotateY(Math.PI / 2); return e;
    }), mat(nivel >= 3 ? C.techoNoble : C.techoAzul), 0, 1.75, -0.3);
    g.add(techo);
    tejas(g, 0, 1.75, -0.3, 1.35, 0.95, 3.3, nivel >= 3 ? C.oro : C.tejaOsc, 'z2');
    esquinas(g, 0, -0.3, 3.0, 2.2, 0.25, 1.75, 0xd8d0c0);
    // cruz verde en el frente y en el techo
    g.add(caja(0.7, 0.22, 0.06, verde, 0, 1.25, 0.82));
    g.add(caja(0.22, 0.7, 0.06, verde, 0, 1.25, 0.82));
    var cruz = new THREE.Group();
    cruz.add(caja(0.9, 0.28, 0.28, verdeOsc, 0, 0, 0));
    cruz.add(caja(0.28, 0.9, 0.28, verdeOsc, 0, 0, 0));
    cruz.position.set(0, 3.15, -0.3);
    g.add(cruz);
    g.userData.cruz = cruz;
    // puerta y ventanas
    g.add(caja(0.6, 0.85, 0.06, C.maderaOsc, -0.9, 0.67, 0.82));
    g.add(ventana(0.45, 0.4, 0.06, 0.95, 1.05, 0.82));
    brillo(g, 0.95, 1.05, 1.05, 1.2, true);
    barril(g, 1.75, -1.0, 0.8);
    // camas afuera (más camas con más nivel)
    for (var i = 0; i < 1 + nivel; i++) {
      var x = -1.2 + i * 0.85;
      g.add(caja(0.6, 0.18, 1.0, C.madera, x, 0.2, 1.65));
      g.add(caja(0.56, 0.08, 0.95, blanco, x, 0.33, 1.65));
      g.add(caja(0.5, 0.1, 0.25, 0x9fe0b0, x, 0.4, 1.3));
    }
    // toldo
    var toldo = caja(3.2, 0.06, 1.3, verde, 0, 1.25, 1.55);
    toldo.rotation.x = -0.15;
    g.add(toldo);
    [-1.5, 1.5].forEach(function (x) { g.add(cil(0.05, 0.05, 1.2, 5, C.madera, x, 0.6, 2.15)); });
    return g;
  }

  // Aserradero: cabaña de madera, sierra redonda que gira y troncos apilados
  function aserradero(nivel) {
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    g.add(caja(2.6, 0.2, 2.0, C.piedraOsc, -0.4, 0.1, -0.6));
    // paredes de troncos
    for (var y = 0; y < 4; y++) {
      g.add(cil(0.16, 0.16, 2.5, 6, y % 2 ? C.madera : 0xa9783f, -0.4, 0.35 + y * 0.3, 0.3).rotateZ(Math.PI / 2));
      g.add(cil(0.16, 0.16, 2.5, 6, y % 2 ? C.madera : 0xa9783f, -0.4, 0.35 + y * 0.3, -1.5).rotateZ(Math.PI / 2));
    }
    g.add(caja(2.4, 1.2, 1.7, 0x9b6a3c, -0.4, 0.8, -0.6));
    var techo = malla(geo('techoAserr', function () {
      var s = new THREE.Shape(); s.moveTo(-1.45, 0); s.lineTo(1.45, 0); s.lineTo(0, 0.9); s.lineTo(-1.45, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: false }); e.translate(0, 0, -1.1); return e;
    }), mat(nivel >= 3 ? C.techoNoble : 0x7a5434), -0.4, 1.45, -0.6);
    g.add(techo);
    tejas(g, -0.4, 1.45, -0.6, 1.45, 0.9, 2.2, nivel >= 3 ? C.oro : 0x55381f, 'x');
    cajas(g, 1.6, -0.2, 0.4);
    antorcha(g, 0.95, 1.45, 0.45, true);
    chimenea(g, -1.1, 2.0, -1.0);
    // mesa con sierra
    g.add(caja(1.4, 0.15, 0.7, C.madera, 1.0, 0.75, 0.9));
    [-0.5, 0.5].forEach(function (x) { g.add(caja(0.1, 0.7, 0.6, C.maderaOsc, 1.0 + x, 0.35, 0.9)); });
    var sierra = cil(0.42, 0.42, 0.04, 14, C.metal, 1.0, 0.95, 0.9);
    sierra.rotation.x = Math.PI / 2;
    g.add(sierra);
    g.userData.sierra = sierra;
    sierra.userData.noFusionar = true;
    g.add(cil(0.14, 0.14, 1.2, 6, 0xa9783f, 1.0, 0.92, 0.9).rotateZ(Math.PI / 2));
    // pila de troncos (crece con el nivel)
    var n = 3 + nivel * 2;
    for (var i = 0; i < n; i++) {
      var fila = i < 3 ? 0 : i < 5 ? 1 : 2, col = i < 3 ? i : i < 5 ? i - 3 : i - 5;
      g.add(cil(0.2, 0.2, 1.6, 7, 0xa9783f, -1.3 + col * 0.42 + fila * 0.21, 0.2 + fila * 0.36, 1.3).rotateZ(Math.PI / 2).rotateY(Math.PI / 2));
    }
    // hacha clavada
    g.add(cil(0.25, 0.3, 0.35, 8, C.madera, 1.5, 0.17, -1.3));
    g.add(caja(0.05, 0.6, 0.05, C.maderaOsc, 1.5, 0.6, -1.3));
    g.add(caja(0.25, 0.16, 0.04, C.metal, 1.6, 0.85, -1.3));
    return g;
  }

  // Mina: montaña de roca con entrada oscura, vigas, rieles y un carrito con piedras
  function mina(nivel) {
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    var roca = malla(geo('montana', function () { return new THREE.DodecahedronGeometry(1.6, 0); }), mat(0x9a948a), -0.3, 0.6, -0.7);
    roca.scale.set(1.25, 0.9, 1.0);
    g.add(roca);
    var roca2 = malla(geo('montana2', function () { return new THREE.DodecahedronGeometry(0.9, 0); }), mat(0x8a847a), 1.0, 0.4, -1.1);
    g.add(roca2);
    // entrada
    g.add(caja(0.95, 1.05, 0.3, 0x2a2320, -0.3, 0.55, 0.65));
    g.add(caja(0.14, 1.2, 0.18, C.madera, -0.85, 0.6, 0.78));
    g.add(caja(0.14, 1.2, 0.18, C.madera, 0.25, 0.6, 0.78));
    g.add(caja(1.3, 0.16, 0.2, C.madera, -0.3, 1.22, 0.78));
    // farol
    g.add(malla(geo('farol', function () { return new THREE.SphereGeometry(0.1, 6, 4); }), matLlama, 0.35, 1.05, 0.95, false));
    brillo(g, 0.35, 1.05, 1.0, 2.2);
    cajas(g, 1.4, -0.2, -0.3);
    // rieles
    [-0.55, -0.05].forEach(function (x) { g.add(caja(0.06, 0.05, 1.6, C.metalOsc, x, 0.04, 1.5)); });
    for (var k = 0; k < 4; k++) g.add(caja(0.8, 0.05, 0.12, C.maderaOsc, -0.3, 0.02, 0.9 + k * 0.4));
    // carrito con piedras
    var carro = new THREE.Group();
    carro.add(caja(0.7, 0.35, 0.5, C.maderaOsc, 0, 0.3, 0));
    for (var p = 0; p < 2 + nivel; p++) carro.add(esfera(0.13, 0xb5aea3, -0.2 + (p % 3) * 0.2, 0.52, -0.1 + Math.floor(p / 3) * 0.2, 5, 4));
    [-0.25, 0.25].forEach(function (x) { [-0.18, 0.18].forEach(function (z) { var r = cil(0.1, 0.1, 0.06, 8, C.negro, x, 0.1, z); r.rotation.x = Math.PI / 2; carro.add(r); }); });
    carro.position.set(-0.3, 0, 1.7);
    g.add(carro);
    g.userData.carro = carro;
    carro.userData.noFusionar = true;
    // piedras sueltas y pico
    for (var q = 0; q < nivel + 1; q++) g.add(esfera(0.22, 0xb5aea3, 1.2 - q * 0.3, 0.15, 0.9 + q * 0.2, 5, 4));
    g.add(caja(0.05, 0.7, 0.05, C.madera, 1.2, 0.35, 0.3).rotateZ(0.5));
    g.add(caja(0.5, 0.06, 0.06, C.metal, 1.05, 0.62, 0.3).rotateZ(0.2));
    if (nivel >= 3) g.add(cono(0.2, 0.35, 4, C.oro, -0.3, 1.5, 0.78));
    roca.material = matPlano(0x9a948a); roca2.material = matPlano(0x8a847a);
    return g;
  }

  // Barricada: atraviesa el camino. Nivel 1 de madera con picos, nivel 2 de piedra.
  function barricada(nivel) {
    var g = new THREE.Group();
    if (nivel <= 1) {
      for (var i = 0; i < 7; i++) {
        var x = -1.8 + i * 0.6;
        var palo = cil(0.12, 0.14, 1.3, 6, i % 2 ? C.madera : 0xa9783f, x, 0.6, 0);
        palo.rotation.x = (i % 2 ? 0.35 : -0.35);
        g.add(palo);
        g.add(cono(0.13, 0.3, 5, C.maderaOsc, x, 1.3, (i % 2 ? 0.22 : -0.22)));
      }
      g.add(cil(0.1, 0.1, 4.2, 6, C.maderaOsc, 0, 0.6, 0).rotateZ(Math.PI / 2));
    } else {
      g.add(caja(4.2, 1.1, 0.8, C.piedra, 0, 0.55, 0));
      for (var j = 0; j < 6; j++) g.add(caja(0.5, 0.35, 0.85, C.piedraOsc, -1.75 + j * 0.7, 1.25, 0));
      g.add(cil(0.45, 0.5, 1.6, 7, C.piedra, -2.2, 0.8, 0));
      g.add(cil(0.45, 0.5, 1.6, 7, C.piedra, 2.2, 0.8, 0));
    }
    return g;
  }

  // Academia: torre de piedra con cúpula azul, telescopio y libros
  function academia(nivel) {
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    g.add(caja(3.0, 0.25, 2.4, C.piedraOsc, 0, 0.12, -0.3));
    g.add(caja(2.6, 1.7, 2.0, 0xe9e0cc, 0, 1.1, -0.3));
    g.add(cil(0.95, 1.05, 1.0, 10, C.piedra, 0, 2.45, -0.3));
    var cupula = malla(geo('cupula', function () { return new THREE.SphereGeometry(1.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); }), mat(nivel >= 3 ? C.oro : C.cobre), 0, 2.95, -0.3);
    g.add(cupula);
    // telescopio
    var tel = cil(0.1, 0.16, 1.2, 8, C.oro, 0.5, 3.6, -0.3); tel.rotation.z = -0.9; g.add(tel);
    // ventanas en arco y puerta
    [-0.8, 0.8].forEach(function (x) { g.add(ventana(0.4, 0.6, 0.06, x, 1.3, 0.72)); brillo(g, x, 1.3, 0.95, 1.3, true); });
    antorcha(g, -1.45, 1.4, 0.9, true);
    g.add(caja(0.6, 0.95, 0.06, C.maderaOsc, 0, 0.72, 0.72));
    // estandarte con un libro
    g.add(caja(0.9, 0.6, 0.05, C.telaMar, 0, 1.85, 0.74));
    g.add(caja(0.45, 0.3, 0.06, 0xf6f3ea, 0, 1.85, 0.76));
    // pila de libros y pergamino afuera (más con nivel)
    for (var i = 0; i < 2 + nivel; i++) g.add(caja(0.5, 0.12, 0.35, [0xa8322a, 0x4a8a5a, 0x3a5a8a, 0xc9a040][i % 4], 1.2, 0.08 + i * 0.13, 1.1).rotateY(i * 0.3));
    g.add(cil(0.12, 0.12, 0.6, 8, 0xf3ead8, -1.2, 0.12, 1.1).rotateZ(Math.PI / 2));
    return g;
  }

  // Muralla alrededor de TODO el reino: un óvalo con una puerta donde entra el camino.
  // nivel (visual) 1 madera, 2 piedra, 3 piedra con torres de techo azul.
  // forma = { cx, cz, rx, rz, puerta (ángulo), hueco (medio ángulo) }
  function muralla(nivel, forma) {
    var g = new THREE.Group();
    var f = forma;
    var alto = nivel === 1 ? 1.6 : nivel === 2 ? 2.2 : 2.8;
    var color = nivel === 1 ? C.madera : C.piedra;
    var per = 2 * Math.PI * Math.sqrt((f.rx * f.rx + f.rz * f.rz) / 2);
    var N = Math.round(per / 2.6);
    function punto(t) { return { x: f.cx + Math.cos(t) * f.rx, z: f.cz + Math.sin(t) * f.rz }; }
    function enPuerta(t) { var d = Math.abs(((t - f.puerta) + Math.PI * 3) % (Math.PI * 2) - Math.PI); return d < f.hueco; }
    var torres = [];
    for (var i = 0; i < N; i++) {
      var t0 = i / N * Math.PI * 2, t1 = (i + 1) / N * Math.PI * 2, tm = (t0 + t1) / 2;
      if (enPuerta(tm)) continue;
      var a = punto(t0), b = punto(t1);
      var dx = b.x - a.x, dz = b.z - a.z, largo = Math.hypot(dx, dz) * 1.08;
      var seg = caja(largo, alto, nivel === 1 ? 0.5 : 0.85, color, (a.x + b.x) / 2, alto / 2, (a.z + b.z) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      g.add(seg);
      if (nivel > 1) { // franja de piedra oscura abajo: el muro "pisa" el suelo
        var zc = caja(largo, 0.35, 1.0, C.piedraOsc, (a.x + b.x) / 2, 0.17, (a.z + b.z) / 2);
        zc.rotation.y = seg.rotation.y; zc.castShadow = false; g.add(zc);
      }
      if (nivel === 1) {
        if (i % 2 === 0) { var pu = cono(0.25, 0.5, 4, C.maderaOsc, (a.x + b.x) / 2, alto + 0.22, (a.z + b.z) / 2); pu.castShadow = false; g.add(pu); }
      } else {
        // dos almenas por tramo: silueta de muralla de verdad
        [-0.25, 0.25].forEach(function (u) {
          var al = caja(0.6, 0.5, 0.95, C.piedra, a.x + dx * (0.5 + u), alto + 0.25, a.z + dz * (0.5 + u));
          al.rotation.y = seg.rotation.y; g.add(al);
        });
      }
      if (i % 7 === 0 && !enPuerta(t0 - 0.2) && !enPuerta(t0 + 0.2)) torres.push({ p: a, puerta: false });
    }
    // torres grandes a los dos lados de la puerta
    torres.push({ p: punto(f.puerta - f.hueco - 0.03), puerta: true }, { p: punto(f.puerta + f.hueco + 0.03), puerta: true });
    var _fin = function () { return fusionar(g); };
    torres.forEach(function (tq) {
      var x = tq.p.x, z = tq.p.z, h = alto + (tq.puerta ? 1.8 : 1.1), r = tq.puerta ? 1.1 : 0.8;
      g.add(cil(r, r + 0.12, h, 8, nivel === 1 ? C.maderaOsc : C.piedra, x, h / 2, z));
      if (nivel === 1) g.add(cono(r + 0.2, 0.9, 8, C.maderaOsc, x, h + 0.45, z));
      else {
        g.add(cil(r + 0.15, r + 0.15, 0.35, 8, C.piedraOsc, x, h + 0.17, z));
        for (var am = 0; am < 6; am++) { var aa = am / 6 * Math.PI * 2; g.add(caja(0.35, 0.4, 0.35, C.piedra, x + Math.cos(aa) * (r + 0.05), h + 0.55, z + Math.sin(aa) * (r + 0.05))); }
        if (tq.puerta) { antorcha(g, x + (f.cx - x) * 0.02, h - 0.4, z + r + 0.15); antorcha(g, x, h - 0.4, z - r - 0.15); }
        if (nivel >= 3) {
          g.add(cono(r + 0.3, 1.4, 8, C.techoAzul, x, h + 1.05, z));
          if (tq.puerta) { var bd = bandera(C.telaRoja, 1.8); bd.userData.noFusionar = true; bd.position.set(x, h + 1.6, z); g.add(bd); (g.userData.banderas = g.userData.banderas || []).push(bd.userData.tela); }
        }
      }
    });
    return _fin();
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

  // Tamaño general de la gente en el reino (más grande = se distinguen mejor)
  var TAM_UNIDAD = 1.6;
  var MAT_BLOB = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
  // Colores de la armadura por nivel: 1 metal, 2 acero azul, 3 oro
  var COLOR_ARMADURA = [0, 0xd6dde5, 0x6f8fb5, 0xf5c542];
  function unidad(tipo, tam, armadura) {
    armadura = armadura || 0;
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
    if (tipo === 'aldeano') { ropa = 0xb5835a; ropa2 = 0x6a4a30; escala = 0.85; }
    if (tipo === 'caballeria') { ropa = 0x7a4fc0; ropa2 = 0x3f2a72; escala = 0.95; }
    var esCaballero = tipo === 'espadachin' || tipo === 'guardian' || tipo === 'heroe' || tipo === 'caballeria';
    var colArm = COLOR_ARMADURA[armadura] || C.metal;

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
    if (tipo !== 'trasgo' && tipo !== 'bruto' && tipo !== 'ogro' && tipo !== 'aldeano' && (tipo !== 'arquero' || armadura > 0))
      cuerpo.add(cil(0.22, 0.28, 0.3, 8, armadura >= 2 ? colArm : C.metal, 0, 0.62, 0.06).rotateX(0.05));
    // hombreras desde el nivel 1 de armadura; capa desde el nivel 3
    if (armadura >= 1) {
      [-1, 1].forEach(function (s) { var h = esfera(0.16, colArm, s * 0.33, 0.78, 0, 8, 6); h.scale.set(1.1, 0.6, 1.1); cuerpo.add(h); });
      if (armadura >= 2) cuerpo.add(cil(0.34, 0.34, 0.06, 8, colArm, 0, 0.41, 0));
      if (armadura >= 3) { var cp = caja(0.55, 0.7, 0.04, ropa, 0, 0.55, -0.33); cp.rotation.x = 0.15; cuerpo.add(cp); }
    }
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
    if (esCaballero) {
      var casco = malla(geo('casco', function () { return new THREE.SphereGeometry(0.41, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); }),
        mat(tipo === 'heroe' ? C.oro : (armadura >= 2 ? colArm : C.metal)), 0, 0.02, 0);
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
        var penacho = cono(0.1, 0.4, 5, tipo === 'guardian' ? C.azul : tipo === 'caballeria' ? 0xffd35a : C.rojo, 0, 0.5, -0.05);
        cabeza.add(penacho);
      }
    }
    if (tipo === 'aldeano') {
      cabeza.add(cil(0.62, 0.62, 0.05, 10, C.paja, 0, 0.22, 0));
      cabeza.add(cono(0.34, 0.32, 10, C.paja, 0, 0.4, 0));
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
    } else if (tipo === 'caballeria') {
      arma.add(cil(0.035, 0.045, 1.6, 6, C.madera, 0, 0.6, 0));
      arma.add(cono(0.08, 0.3, 6, C.metal, 0, 1.5, 0));
      arma.add(caja(0.25, 0.18, 0.02, 0xffd35a, 0.12, 1.25, 0));
      arma.rotation.x = 1.45;
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
    if (esCaballero) {
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

    var baseY = 0;
    if (tipo === 'caballeria') {
      var caballo = new THREE.Group();
      var pelo = 0x8a5a33, crin = 0x3a2414;
      caballo.add(caja(0.62, 0.55, 1.25, pelo, 0, 0.75, 0));
      var cuello = caja(0.32, 0.6, 0.35, pelo, 0, 1.1, 0.55); cuello.rotation.x = -0.5; caballo.add(cuello);
      caballo.add(caja(0.3, 0.3, 0.55, pelo, 0, 1.38, 0.8));
      caballo.add(caja(0.26, 0.2, 0.2, 0x6a4024, 0, 1.3, 1.08));
      [-1, 1].forEach(function (s) { caballo.add(cono(0.06, 0.16, 4, pelo, s * 0.1, 1.6, 0.68)); caballo.add(esfera(0.04, C.negro, s * 0.16, 1.42, 0.92, 5, 4)); });
      var melena = caja(0.08, 0.5, 0.42, crin, 0, 1.3, 0.48); melena.rotation.x = -0.5; caballo.add(melena);
      var cola = caja(0.1, 0.55, 0.1, crin, 0, 0.75, -0.7); cola.rotation.x = 0.5; caballo.add(cola);
      // manta con el color del equipo y armadura del caballo desde el nivel 2
      caballo.add(caja(0.66, 0.08, 0.6, ropa, 0, 1.05, -0.05));
      if (armadura >= 2) caballo.add(caja(0.66, 0.3, 0.32, colArm, 0, 1.25, 0.7));
      // silla, estribos y riendas
      caballo.add(caja(0.5, 0.12, 0.5, 0x5a3418, 0, 1.1, 0.0));
      caballo.add(caja(0.42, 0.14, 0.1, 0x5a3418, 0, 1.17, -0.24));
      [-1, 1].forEach(function (s) { caballo.add(caja(0.03, 0.35, 0.03, 0x3a2414, s * 0.33, 0.9, 0.05)); caballo.add(caja(0.12, 0.04, 0.08, C.metalOsc, s * 0.33, 0.72, 0.05)); });
      [-1, 1].forEach(function (s) { var rn = caja(0.025, 0.025, 0.85, 0x3a2414, s * 0.14, 1.32, 0.62); rn.rotation.x = 0.35; caballo.add(rn); });
      p.patas = [];
      [[-0.2, 0.45], [0.2, 0.45], [-0.2, -0.45], [0.2, -0.45]].forEach(function (q, k) {
        var pata = new THREE.Group();
        pata.position.set(q[0], 0.55, q[1]);
        pata.add(caja(0.14, 0.55, 0.14, pelo, 0, -0.27, 0));
        pata.add(caja(0.16, 0.1, 0.18, 0x2a2320, 0, -0.52, 0.02));
        caballo.add(pata);
        p.patas.push(pata);
      });
      g.add(caballo);
      p.caballo = caballo;
      // el jinete va sentado sobre el caballo, con las piernas abiertas
      baseY = 0.72;
      cuerpo.position.y = baseY;
      p.piernaI.rotation.z = 0.7; p.piernaD.rotation.z = -0.7;
    }
    [cuerpo, p.cabeza, p.brazo, p.izq, arma, p.piernaI, p.piernaD].forEach(function (gr) { if (gr) fusionar(gr, true); });
    if (p.caballo) { fusionar(p.caballo, true); p.patas.forEach(function (pt) { fusionar(pt, true); }); }
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.renderOrder = 1;
    if (tipo === 'caballeria') blob.scale.set(1.3, 2.4, 1);
    g.add(blob);
    escala *= (tam || TAM_UNIDAD);
    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala, baseY: baseY };
  }

  // Animación de caminar / atacar
  function animarUnidad(u, t, caminando, ataque) {
    var p = u.p, v = caminando ? 1 : 0;
    var s = Math.sin(t * 11);
    if (p.patas) {
      var g2 = Math.sin(t * 14);
      p.patas[0].rotation.x = g2 * 0.8 * v; p.patas[3].rotation.x = g2 * 0.8 * v;
      p.patas[1].rotation.x = -g2 * 0.8 * v; p.patas[2].rotation.x = -g2 * 0.8 * v;
      p.caballo.position.y = Math.abs(g2) * 0.08 * v;
      p.caballo.rotation.x = g2 * 0.05 * v;
      u.cuerpo.position.y = (u.baseY || 0) + Math.abs(g2) * 0.1 * v + (caminando ? 0 : Math.sin(t * 2.5) * 0.015);
    } else {
      p.piernaI.rotation.x = s * 0.7 * v;
      p.piernaD.rotation.x = -s * 0.7 * v;
      u.cuerpo.position.y = Math.abs(s) * 0.07 * v + (caminando ? 0 : Math.sin(t * 2.5) * 0.015);
    }
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
    // posiciones: [{x, z, s, tipo, tono}]
    // tipo 0 = pino, 1 = árbol redondo, 2 = frondoso (copa ancha), 3 = palmera
    var g = new THREE.Group();
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0);
    function porTipo(t) { return posiciones.filter(function (p) { return p.tipo === t; }); }
    // lista de {x,y,z,s,sy,rot,color} -> una sola malla instanciada
    function inst(geoI, material, lista, sombra) {
      if (!lista.length) return null;
      var im = new THREE.InstancedMesh(geoI, material, lista.length);
      lista.forEach(function (p, i) {
        if (p.m) im.setMatrixAt(i, p.m);
        else {
          q.setFromAxisAngle(eje, p.rot || 0);
          v.set(p.x, p.y || 0, p.z); sc.set(p.sx || p.s, p.sy || p.s, p.sz || p.s);
          m4.compose(v, q, sc);
          im.setMatrixAt(i, m4);
        }
        if (p.color !== undefined) im.setColorAt(i, new THREE.Color(p.color));
      });
      im.castShadow = sombra !== false; im.receiveShadow = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      g.add(im);
      return im;
    }
    function variar(hex, dh, ds, dl) { return new THREE.Color(hex).offsetHSL(dh, ds, dl).getHex(); }
    var hoja = matPlano(0xffffff), corteza = matPlano(0xffffff);

    // ---- pinos: tres pisos de conos, algo torcidos ----
    var pinos = porTipo(0), troncoP = [], c1 = [], c2 = [], c3 = [];
    pinos.forEach(function (p) {
      var y = p.y || 0;
      troncoP.push({ x: p.x, y: y + 0.6 * p.s, z: p.z, s: p.s, rot: p.rot, color: 0x5a3a22 });
      c1.push({ x: p.x, y: y + 1.7 * p.s, z: p.z, s: p.s, rot: p.rot, color: p.tono });
      c2.push({ x: p.x + 0.05, y: y + 2.5 * p.s, z: p.z, s: p.s, rot: p.rot + 0.4, color: variar(p.tono, 0, 0, 0.03) });
      c3.push({ x: p.x, y: y + 3.2 * p.s, z: p.z + 0.04, s: p.s, rot: p.rot + 0.9, color: variar(p.tono, 0.01, 0, 0.06) });
    });
    var tronco = new THREE.CylinderGeometry(0.16, 0.26, 1.2, 5);
    inst(tronco, corteza, troncoP);
    inst(new THREE.ConeGeometry(1.25, 1.7, 7), hoja, c1);
    inst(new THREE.ConeGeometry(0.95, 1.4, 7), hoja, c2);
    inst(new THREE.ConeGeometry(0.6, 1.1, 7), hoja, c3);

    // ---- redondos: copa de tres bolas ----
    var red = porTipo(1), troncoR = [], b1 = [], b2 = [];
    red.forEach(function (p) {
      var y = p.y || 0;
      troncoR.push({ x: p.x, y: y + 0.6 * p.s, z: p.z, s: p.s, rot: p.rot, color: 0x6a4428 });
      b1.push({ x: p.x, y: y + 2.0 * p.s, z: p.z, s: p.s, sy: p.s * 0.9, rot: p.rot, color: p.tono });
      b2.push({ x: p.x + 0.55 * p.s, y: y + 2.75 * p.s, z: p.z + 0.35 * p.s, s: p.s, rot: p.rot + 1, color: variar(p.tono, 0.01, 0, 0.05) });
      b2.push({ x: p.x - 0.5 * p.s, y: y + 2.35 * p.s, z: p.z - 0.3 * p.s, s: p.s * 0.9, rot: p.rot + 2, color: variar(p.tono, -0.01, 0, -0.04) });
    });
    inst(tronco, corteza, troncoR);
    inst(new THREE.IcosahedronGeometry(1.15, 0), hoja, b1);
    inst(new THREE.IcosahedronGeometry(0.75, 0), hoja, b2);

    // ---- frondosos: tronco grueso con ramas y copa ancha de cinco masas ----
    var fro = porTipo(2), troncoF = [], ramas = [], masas = [];
    fro.forEach(function (p) {
      var y = p.y || 0, s = p.s * 1.15;
      troncoF.push({ x: p.x, y: y + 0.9 * s, z: p.z, s: s, rot: p.rot, color: 0x5e4030 });
      for (var r = 0; r < 3; r++) {
        var a = p.rot + r * 2.1;
        var e = new THREE.Euler(Math.sin(a) * 0.7, 0, Math.cos(a) * 0.7);
        ramas.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(p.x + Math.cos(a) * 0.3 * s, y + 1.9 * s, p.z - Math.sin(a) * 0.3 * s), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(s, s, s)), color: 0x5e4030 });
      }
      var pos = [[0, 2.9, 0, 1.25], [0.95, 2.55, 0.3, 0.9], [-0.9, 2.6, -0.2, 0.95], [0.2, 2.5, -0.95, 0.85], [-0.2, 2.45, 0.95, 0.85], [0.1, 3.5, 0.1, 0.8]];
      pos.forEach(function (o, k) {
        masas.push({ x: p.x + o[0] * s, y: y + o[1] * s, z: p.z + o[2] * s, s: o[3] * s, sy: o[3] * s * 0.78, rot: p.rot + k, color: variar(p.tono, (k % 3 - 1) * 0.01, 0, k === 5 ? 0.06 : (k % 2 ? -0.03 : 0.02)) });
      });
    });
    inst(new THREE.CylinderGeometry(0.22, 0.38, 1.8, 6), corteza, troncoF);
    var geoRama = new THREE.CylinderGeometry(0.07, 0.12, 1.1, 5); geoRama.translate(0, 0.45, 0);
    inst(geoRama, corteza, ramas, false);
    inst(new THREE.DodecahedronGeometry(1, 0), hoja, masas);

    // ---- palmeras: tronco curvo en segmentos, hojas caídas y cocos ----
    var pal = porTipo(3), segs = [], hojas = [], cocos = [];
    var geoSeg = new THREE.CylinderGeometry(0.15, 0.19, 0.62, 6); geoSeg.translate(0, 0.31, 0);
    var geoHoja = (function () {
      // hoja de palma: una lámina larga en forma de V que sale hacia +x
      var gH = new THREE.BufferGeometry();
      var L = 2.3, A = 0.42, pts = [], n = 6;
      for (var i = 0; i < n; i++) {
        var u0 = i / n, u1 = (i + 1) / n;
        var w0 = A * Math.sin(Math.PI * Math.min(1, u0 * 1.15)), w1 = A * Math.sin(Math.PI * Math.min(1, u1 * 1.15));
        var y0 = -u0 * u0 * 0.9, y1 = -u1 * u1 * 0.9;
        var x0 = u0 * L, x1 = u1 * L;
        // dos mitades inclinadas (V) para que se vea de todos lados
        pts.push(x0, y0, 0, x1, y1, 0, x0, y0 + w0 * 0.25, w0);
        pts.push(x1, y1, 0, x1, y1 + w1 * 0.25, w1, x0, y0 + w0 * 0.25, w0);
        pts.push(x0, y0, 0, x0, y0 + w0 * 0.25, -w0, x1, y1, 0);
        pts.push(x1, y1, 0, x0, y0 + w0 * 0.25, -w0, x1, y1 + w1 * 0.25, -w1);
      }
      gH.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      gH.computeVertexNormals();
      return gH;
    })();
    pal.forEach(function (p) {
      var y = p.y || 0, s = p.s, inclina = 0.12 + (p.lean || 0.5) * 0.18, dir = p.rot;
      var px = p.x, py = y, pz = p.z, ang = 0;
      for (var k = 0; k < 7; k++) {
        ang = inclina * (k / 6) * 1.6;
        var qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, dir, ang, 'YXZ'));
        segs.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(px, py, pz), qq, new THREE.Vector3(s * (1 - k * 0.04), s, s * (1 - k * 0.04))), color: k % 2 ? 0x9a8260 : 0x8a7252 });
        var up = new THREE.Vector3(0, 0.6 * s, 0).applyQuaternion(qq);
        px += up.x; py += up.y; pz += up.z;
      }
      for (var h = 0; h < 8; h++) {
        var qh = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, h / 8 * Math.PI * 2 + dir + (h % 2) * 0.2, -0.25 + (h % 2) * 0.3, 'YXZ'));
        hojas.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(px, py + 0.05, pz), qh, new THREE.Vector3(s * (0.9 + (h % 3) * 0.08), s, s)), color: variar(p.tono, (h % 3 - 1) * 0.012, 0, (h % 2 ? -0.04 : 0.02)) });
      }
      for (var c = 0; c < 3; c++) cocos.push({ x: px + Math.cos(c * 2.1) * 0.18 * s, y: py - 0.15 * s, z: pz + Math.sin(c * 2.1) * 0.18 * s, s: s, color: 0x5a3e22 });
    });
    inst(geoSeg, corteza, segs);
    var mh = mat(0xffffff, { side: THREE.DoubleSide, flatShading: true });
    inst(geoHoja, mh, hojas);
    inst(new THREE.SphereGeometry(0.13, 6, 4), corteza, cocos, false);
    return g;
  }

  function arbustos(lista) {
    var g = new THREE.Group(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    var ge = new THREE.IcosahedronGeometry(0.55, 0);
    var im = new THREE.InstancedMesh(ge, matPlano(0xffffff), lista.length * 3);
    var k = 0;
    lista.forEach(function (p) {
      for (var j = 0; j < 3; j++) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot + j);
        v.set(p.x + (j - 1) * 0.45 * p.s, 0.35 * p.s, p.z + (j % 2) * 0.3 * p.s);
        sc.set(p.s * (1 - j * 0.15), p.s * 0.8, p.s);
        m4.compose(v, q, sc); im.setMatrixAt(k, m4);
        im.setColorAt(k, new THREE.Color().setHSL(0.24 + j * 0.025 + (p.rot % 1) * 0.02, 0.36, 0.27 + j * 0.035));
        k++;
      }
    });
    im.castShadow = true; im.receiveShadow = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    g.add(im);
    return g;
  }
  function matasPasto(lista) {
    var g = new THREE.Group(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    var ge = new THREE.ConeGeometry(0.07, 0.55, 3);
    var im = new THREE.InstancedMesh(ge, mat(0xffffff), lista.length * 4);
    var k = 0;
    lista.forEach(function (p) {
      for (var j = 0; j < 4; j++) {
        q.setFromEuler(new THREE.Euler((j - 1.5) * 0.25, p.rot + j, (j % 2 ? 0.2 : -0.2)));
        v.set(p.x + (j - 1.5) * 0.08, 0.2, p.z + (j % 2) * 0.08);
        sc.set(1, 0.8 + j * 0.15, 1);
        m4.compose(v, q, sc); im.setMatrixAt(k, m4);
        im.setColorAt(k, new THREE.Color().setHSL(0.18 + (j % 2) * 0.04 + (p.rot % 1) * 0.03, 0.38, 0.34 + j * 0.035));
        k++;
      }
    });
    im.castShadow = false; im.receiveShadow = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    g.add(im);
    return g;
  }
  function roca(s, color) {
    var r = malla(geo('roca', function () { return new THREE.DodecahedronGeometry(0.6, 0); }), matPlano(color || 0xaea48f), 0, 0, 0);
    r.scale.set(s, s * 0.7, s);
    r.rotation.set(Math.random(), Math.random() * 6, Math.random());
    r.position.y = s * 0.2;
    return r;
  }

  var matNube = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: 0.92 });
  function nube() {
    var g = new THREE.Group();
    var m = matNube;
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

  // =================================================================
  //  ANIMALES SUELTOS: gallinas y cabras (dan vida al reino, sin gameplay)
  // =================================================================
  function animal(tipo) {
    var g = new THREE.Group(), cuerpo = new THREE.Group(), patas = [];
    g.add(cuerpo);
    if (tipo === 'gallina') {
      var col = Math.random() < 0.5 ? 0xf2ece0 : 0xa8683a;
      var tor = esfera(0.22, col, 0, 0.32, 0, 8, 6); tor.scale.set(1, 0.9, 1.25); cuerpo.add(tor);
      cuerpo.add(esfera(0.13, col, 0, 0.55, 0.2, 7, 5));
      cuerpo.add(cono(0.04, 0.1, 4, 0xe0a030, 0, 0.54, 0.35).rotateX(Math.PI / 2));
      cuerpo.add(caja(0.04, 0.09, 0.1, 0xc0302a, 0, 0.68, 0.2));
      var cola = cono(0.1, 0.22, 4, col, 0, 0.45, -0.25); cola.rotation.x = -0.9; cuerpo.add(cola);
      [-1, 1].forEach(function (s) { var pt = new THREE.Group(); pt.position.set(s * 0.08, 0.16, 0); pt.add(caja(0.03, 0.16, 0.03, 0xe0a030, 0, -0.08, 0)); g.add(pt); patas.push(pt); });
    } else {
      var pel = Math.random() < 0.5 ? 0xeee6d6 : 0x8a6a4a;
      cuerpo.add(caja(0.42, 0.36, 0.78, pel, 0, 0.62, 0));
      var cabeza = new THREE.Group(); cabeza.position.set(0, 0.86, 0.42);
      cabeza.add(caja(0.24, 0.26, 0.34, pel, 0, 0, 0.08));
      cabeza.add(caja(0.18, 0.14, 0.12, 0x5a4a3a, 0, -0.06, 0.28));
      [-1, 1].forEach(function (s) { var cu = cono(0.04, 0.24, 4, 0xd8ccb0, s * 0.08, 0.2, -0.02); cu.rotation.x = -0.6; cabeza.add(cu); var o = caja(0.12, 0.05, 0.06, pel, s * 0.16, 0.06, 0); cabeza.add(o); cabeza.add(esfera(0.025, C.negro, s * 0.1, 0.04, 0.22, 4, 3)); });
      cuerpo.add(cabeza);
      var cola2 = caja(0.06, 0.14, 0.06, pel, 0, 0.78, -0.4); cola2.rotation.x = 0.6; cuerpo.add(cola2);
      [[-0.14, 0.28], [0.14, 0.28], [-0.14, -0.28], [0.14, -0.28]].forEach(function (q) { var pt = new THREE.Group(); pt.position.set(q[0], 0.45, q[1]); pt.add(caja(0.08, 0.45, 0.08, pel, 0, -0.22, 0)); pt.add(caja(0.09, 0.06, 0.1, 0x3a2a20, 0, -0.43, 0.01)); g.add(pt); patas.push(pt); });
    }
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.scale.setScalar(tipo === 'gallina' ? 0.6 : 1.1);
    g.add(blob);
    fusionar(cuerpo, true);
    g.scale.setScalar(tipo === 'gallina' ? 1.2 : 1.3);
    return { grupo: g, cuerpo: cuerpo, patas: patas, tipo: tipo };
  }
  function animarAnimal(a, t, camina) {
    var v = camina ? 1 : 0, s = Math.sin(t * (a.tipo === 'gallina' ? 18 : 10));
    a.patas.forEach(function (pt, i) { pt.rotation.x = s * 0.7 * v * (i % 2 ? 1 : -1) * (i > 1 ? -1 : 1); });
    a.cuerpo.position.y = Math.abs(s) * 0.03 * v;
    // picotear / pastar cuando está quieta
    a.cuerpo.rotation.x = camina ? 0 : Math.max(0, Math.sin(t * 1.3)) * (a.tipo === 'gallina' ? 0.35 : 0.12);
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
    granja: granja, cuartel: cuartel, torre: torre, enfermeria: enfermeria, muralla: muralla, aserradero: aserradero, mina: mina, barricada: barricada, academia: academia,
    unidad: unidad, animarUnidad: animarUnidad,
    barraVida: barraVida, ponerVida: ponerVida, flecha: flecha,
    bosque: bosque, roca: roca, arbustos: arbustos, matasPasto: matasPasto, nube: nube, flor: flor, moneda: moneda,
    animal: animal, animarAnimal: animarAnimal, luzNoche: luzNoche, matNube: matNube, antorcha: antorcha, barril: barril, cajas: cajas,
    ondear: ondear, insigniaNivel: insigniaNivel, fusionar: fusionar
  };
})();
