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
    matVentana.emissiveIntensity = k * 2.4;
    matBrillo.opacity = k * (0.9 + Math.sin(t * 13) * 0.07 + Math.sin(t * 7.3) * 0.06);
    matBrilloVentana.opacity = k * (0.85 + Math.sin(t * 2.1) * 0.05);
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
    // granito oscuro de fortaleza (antes arenisca clara)
    piedra: 0x7a7a80, piedraOsc: 0x55555c, madera: 0x8f6038, maderaOsc: 0x5e3d24,
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
  //  ESTILO PIEDRA: muros grises, vigas de madera y techo rojo de tejas
  //  (lo usan cuartel, granja, aserradero, mina, enfermería y academia)
  // =================================================================
  var P = { gris: 0x75777f, osc: 0x55575f, claro: 0x8e9098, viga: 0x6a4428, vigaOsc: 0x4a2e1c };
  function rojoNivel(n) { return n >= 2 ? 0xb8402e : 0xb85a36; }
  function adornoNivel(n) { return n >= 3 ? C.oro : P.vigaOsc; }
  // casa de piedra centrada en (cx, cz), ancho w, fondo d, alto de muro h. El frente mira a +z.
  // cumbreraX: la línea alta del techo va de lado a lado (si no, va de adelante hacia atrás).
  function casaPiedra(g, cx, cz, w, d, h, nivel, cumbreraX) {
    g.add(caja(w + 0.4, 0.22, d + 0.4, P.osc, cx, 0.11, cz));
    g.add(caja(w + 0.5, 0.08, d + 0.5, P.vigaOsc, cx, 0.25, cz));
    g.add(caja(w, h, d, P.gris, cx, 0.25 + h / 2, cz));
    for (var y = 0.7; y < h + 0.1; y += 0.45) { var fr = caja(w + 0.04, 0.05, d + 0.04, P.osc, cx, y, cz); fr.castShadow = false; g.add(fr); }
    esquinas(g, cx, cz, w, d, 0.25, 0.25 + h, P.claro);
    [-1, 1].forEach(function (s) { g.add(caja(0.16, h, 0.12, P.viga, cx + s * (w / 2 - 0.1), 0.25 + h / 2, cz + d / 2 + 0.04)); });
    g.add(caja(w + 0.1, 0.14, 0.12, P.viga, cx, 0.25 + h - 0.06, cz + d / 2 + 0.05));
    var y0 = 0.25 + h, semi = (cumbreraX ? d : w) / 2 + 0.22, largo = (cumbreraX ? w : d) + 0.3, alto = semi * 0.78;
    var techo = malla(geo('techoP' + semi.toFixed(2) + largo.toFixed(2) + (cumbreraX ? 'x' : 'z'), function () {
      var s = new THREE.Shape(); s.moveTo(-semi, 0); s.lineTo(semi, 0); s.lineTo(0, alto); s.lineTo(-semi, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: largo, bevelEnabled: false }); e.translate(0, 0, -largo / 2);
      if (cumbreraX) e.rotateY(Math.PI / 2);
      return e;
    }), mat(rojoNivel(nivel)), cx, y0, cz);
    g.add(techo);
    tejas(g, cx, y0, cz, semi, alto, largo, nivel >= 3 ? C.oro : 0x7a2a1a, cumbreraX ? 'z2' : 'x');
    return { arriba: y0, punta: y0 + alto };
  }

  // =================================================================
  //  EDIFICIOS POR TRAMOS: 1 (nv 1-3), 2 (4-6), 3 (7-9), 4 (10-12)
  //  Cambia los materiales y agrega adornos que se notan desde lejos.
  // =================================================================
  var ROJOS = [0xb8402e, 0xb85a36, 0x9c3b28, 0x7e2f22], TEJAS = [0x7a2a1a, 0x7a3420];
  var COLORES_TRAMO = {
    3: { gris: 0x66666e, osc: 0x48484f, claro: 0x80808a, piedra: 0x6c6c74, piedraOsc: 0x4a4a52, techo: 0x3e5c8c, teja: 0x2b4066, viga: 0x5a3820, vigaOsc: 0x3a2416, metal: 0x6f7c8c },
    4: { gris: 0x56565e, osc: 0x3c3c44, claro: 0x74747e, piedra: 0x5c5c66, piedraOsc: 0x3e3e46, techo: 0x2a4fa8, teja: 0xe0b040, viga: 0xc9952e, vigaOsc: 0x8a6420, metal: 0xe0b040 }
  };
  // color de techo propio de cada edificio: a simple vista se sabe cuál es
  var TECHO_TIPO = { cuartel: 0xb0302a, academia: 0x6a3fb0, enfermeria: 0x3f9a5a, herreria: 0x4a4c56, almacen: 0x8a5a2a, mercado: 0xd08a2a, establo: 0x8a4a22, galeria: 0x2f7a3a, granja: 0xc96a2a, aserradero: 0x7a5a2a, mina: 0x6a6670, cantera: 0x7a7468, torre: 0x2a4fa8, vigia: 0x9a5a2a };
  function tonoC(hex, l) { var c = new THREE.Color(hex); c.offsetHSL(0, 0, l); return c.getHex(); }
  function recolorearTipo(g, tramo, tipo) {
    var tt = TECHO_TIPO[tipo]; if (!tt) return false;
    var mapa = {}, piedras = [P.gris, P.osc, P.claro, C.piedra, C.piedraOsc];
    if (tramo === 1) {
      // humilde: paredes de madera y techo de paja
      var mad = [0xa0703e, 0x86592f, 0xb98a52, 0x9a6a3a, 0x7a5230];
      piedras.forEach(function (c, i) { mapa[c] = mad[i]; });
      ROJOS.forEach(function (c) { mapa[c] = 0xc9a24e; }); TEJAS.forEach(function (c) { mapa[c] = 0x9a7a34; });
    } else if (tramo === 2) {
      ROJOS.forEach(function (c) { mapa[c] = tonoC(tt, -0.05); }); TEJAS.forEach(function (c) { mapa[c] = tonoC(tt, -0.15); });
    } else if (tramo === 3) {
      var k3 = COLORES_TRAMO[3]; mapa[P.gris] = k3.gris; mapa[P.osc] = k3.osc; mapa[P.claro] = k3.claro; mapa[C.piedra] = k3.piedra; mapa[C.piedraOsc] = k3.piedraOsc;
      ROJOS.forEach(function (c) { mapa[c] = tt; }); TEJAS.forEach(function (c) { mapa[c] = tonoC(tt, -0.12); });
      mapa[C.metalOsc] = k3.metal;
    } else {
      var k4 = COLORES_TRAMO[4]; mapa[P.gris] = k4.gris; mapa[P.osc] = k4.osc; mapa[P.claro] = k4.claro; mapa[C.piedra] = k4.piedra; mapa[C.piedraOsc] = k4.piedraOsc;
      ROJOS.forEach(function (c) { mapa[c] = tonoC(tt, 0.04); }); TEJAS.forEach(function (c) { mapa[c] = C.oro; });
      mapa[P.viga] = k4.viga; mapa[P.vigaOsc] = k4.vigaOsc; mapa[C.metalOsc] = k4.metal;
    }
    g.traverse(function (o) {
      if (!o.isMesh || !o.material || !o.material.color || o.material.transparent || o.material.isMeshBasicMaterial) return;
      var nuevo = mapa[o.material.color.getHex()];
      if (nuevo !== undefined) o.material = mat(nuevo, o.material.side === THREE.DoubleSide ? { side: THREE.DoubleSide } : undefined);
    });
    return true;
  }
  // el castillo se oscurece con cada tramo: imponente y temible
  function recolorearCastillo(g, tramo) {
    var PAL = { 1: null, 2: [0xa39d92, 0x86817a, 0x8a1e16], 3: [0x7a766f, 0x5f5b56, 0x7a1a14], 4: [0x5f5b56, 0x46433f, 0x6a1210] }[tramo];
    if (!PAL) return true;
    var vistos = {};
    g.traverse(function (o) {
      if (!o.isMesh || !o.material || !o.material.color || o.material.transparent || o.material.isMeshBasicMaterial) return;
      var c = o.material.color, hsl = {}; c.getHSL(hsl); var hex = c.getHex();
      var nuevo;
      if (hsl.s > 0.35 && (hsl.h < 0.08 || hsl.h > 0.9 || (hsl.h > 0.5 && hsl.h < 0.75))) nuevo = PAL[2];
      else if (hsl.l > 0.55 && hsl.s < 0.5) nuevo = PAL[0];
      else if (hsl.l > 0.35 && hsl.s < 0.4) nuevo = PAL[1];
      if (nuevo !== undefined) o.material = mat(nuevo, o.material.side === THREE.DoubleSide ? { side: THREE.DoubleSide } : undefined);
    });
    return true;
  }
  // ---------- CRECER CON EL NIVEL: cada edificio suma piezas propias en cada tramo ----------
  var MAT_VENTANA = new THREE.MeshBasicMaterial({ color: 0xffd36a });
  function torreAnexa(g, x, z, alto, radio, techo, piedra, oro) {
    g.add(cil(radio, radio * 1.08, alto, 8, piedra, x, alto / 2, z));
    for (var a = 0; a < 6; a++) { var b = a / 6 * Math.PI * 2; g.add(caja(radio * 0.42, 0.22, radio * 0.42, piedra, x + Math.cos(b) * radio * 0.9, alto + 0.11, z + Math.sin(b) * radio * 0.9)); }
    g.add(cono(radio * 1.25, radio * 2.2, 8, techo, x, alto + 0.22 + radio * 1.1, z));
    if (oro) { g.add(cil(0.04, 0.04, 0.5, 5, C.oro, x, alto + 0.22 + radio * 2.2 + 0.2, z)); g.add(esfera(0.09, C.oro, x, alto + 0.22 + radio * 2.2 + 0.48, z, 6, 4)); }
    var v = new THREE.Mesh(geo('ventanaT', function () { return new THREE.BoxGeometry(0.12, 0.22, 0.04); }), MAT_VENTANA); v.position.set(x, alto * 0.65, z + radio * 1.02); v.userData.noFusionar = false; g.add(v);
  }
  function muneco(g, x, z) { g.add(cil(0.04, 0.04, 0.7, 5, C.maderaOsc, x, 0.35, z)); g.add(caja(0.42, 0.06, 0.06, C.maderaOsc, x, 0.55, z)); g.add(cil(0.14, 0.14, 0.32, 6, 0xc9a24e, x, 0.62, z)); g.add(esfera(0.11, 0xc9a24e, x, 0.88, z, 6, 4)); }
  function soldadito(g, x, z, color, lanzaOro) { g.add(cil(0.11, 0.13, 0.36, 6, color, x, 0.18, z)); g.add(esfera(0.1, 0xe8c6a0, x, 0.44, z, 6, 4)); g.add(cono(0.11, 0.12, 6, 0x9aa3ad, x, 0.55, z)); g.add(cil(0.015, 0.015, 0.85, 4, lanzaOro ? C.oro : C.maderaOsc, x + 0.14, 0.42, z)); }
  function crecerEdificio(g, tramo, tipo) {
    if (!TECHO_TIPO[tipo]) return g;
    g.updateMatrixWorld(true);
    var bx = new THREE.Box3().setFromObject(g), cen = bx.getCenter(new THREE.Vector3()), tam = bx.getSize(new THREE.Vector3());
    var w = Math.min(tam.x, 4.6), d = Math.min(tam.z, 4.6), top = bx.max.y, x0 = cen.x - w / 2, x1 = cen.x + w / 2, z0 = cen.z - d / 2, z1 = cen.z + d / 2;
    var tt = TECHO_TIPO[tipo], piedra = tramo >= 4 ? 0xf2ece0 : tramo === 3 ? 0xd8cbb0 : tramo === 2 ? 0x9a948a : 0x8a5a32, oro = tramo >= 4;
    var techoT = tramo === 1 ? 0xc9a24e : tramo >= 4 ? tonoC(tt, 0.04) : tt;
    // tramo 3 y 4: dos torres de esquina con el color del edificio (más altas en el 4)
    var SIN_TORRES = { torre: 1, vigia: 1, mercado: 1, granja: 1, aserradero: 1, mina: 1, cantera: 1 };
    if (tramo >= 3 && !SIN_TORRES[tipo]) {
      var hT = Math.min(top, 2.5) * (tramo >= 4 ? 1.1 : 0.85) + 0.3;
      torreAnexa(g, x0 - 0.15, z0 + 0.1, hT, 0.38, techoT, piedra, oro);
      torreAnexa(g, x1 + 0.15, z0 + 0.1, hT * (tramo >= 4 ? 1.15 : 1), 0.38, techoT, piedra, oro);
    }
    // ventanas encendidas desde el tramo 3
    if (tramo >= 3) for (var vi = -1; vi <= 1; vi += 2) { var vv = new THREE.Mesh(geo('ventanaF', function () { return new THREE.BoxGeometry(0.2, 0.26, 0.03); }), MAT_VENTANA); vv.position.set(cen.x + vi * w * 0.25, Math.min(top * 0.45, 1.4), z1 + 0.03); g.add(vv); }
    if (tipo === 'cuartel') {
      // patio de entrenamiento: crece con el nivel
      var px = x1 + 1.0, pw = 1.3 + tramo * 0.25;
      var patio = caja(pw, 0.04, d * 0.95, 0xb69a6a, px + pw / 2 - 0.4, 0.03, cen.z); patio.castShadow = false; g.add(patio);
      for (var mn = 0; mn < Math.min(3, tramo); mn++) muneco(g, px + 0.1 + mn * 0.45, z0 + 0.6);
      if (tramo >= 2) { g.add(caja(0.9, 0.08, 0.08, C.maderaOsc, px + 0.3, 0.7, z1 - 0.3)); for (var ar = 0; ar < 4; ar++) g.add(cil(0.02, 0.02, 0.9, 4, oro ? C.oro : 0x9aa3ad, px - 0.05 + ar * 0.23, 0.45, z1 - 0.32)); }
      if (tramo >= 2) for (var sx = 0; sx < (tramo >= 4 ? 6 : tramo >= 3 ? 4 : 2); sx++) soldadito(g, px + 0.05 + (sx % 3) * 0.38, cen.z + Math.floor(sx / 3) * 0.42, tramo >= 4 ? 0x2a4fa8 : 0xb0302a, oro);
      if (tramo >= 3) { var tv = px + pw - 0.6; g.add(caja(0.08, 2.2, 0.08, C.maderaOsc, tv, 1.1, z0 + 0.2)); g.add(caja(0.08, 2.2, 0.08, C.maderaOsc, tv + 0.5, 1.1, z0 + 0.2)); g.add(caja(0.7, 0.08, 0.6, C.madera, tv + 0.25, 2.2, z0 + 0.2)); g.add(cono(0.5, 0.5, 4, techoT, tv + 0.25, 2.55, z0 + 0.2)); }
    } else if (tipo === 'academia') {
      // torre de estudio que crece mucho con el nivel
      var ha = 1.4 + tramo * 0.9, ax = x0 + 0.35, az = z0 + 0.35;
      g.add(cil(0.48, 0.52, ha, 10, piedra, ax, ha / 2, az));
      g.add(cono(0.62, 1.1, 10, techoT, ax, ha + 0.55, az));
      for (var fv = 1; fv <= tramo; fv++) { var vw = new THREE.Mesh(geo('ventanaA', function () { return new THREE.BoxGeometry(0.14, 0.24, 0.04); }), MAT_VENTANA); vw.position.set(ax, fv * (ha / (tramo + 1)), az + 0.52); g.add(vw); }
      if (tramo >= 2) { g.add(caja(0.5, 0.5, 0.2, C.maderaOsc, x1 + 0.5, 0.25, z1 - 0.2)); for (var lb = 0; lb < 4; lb++) g.add(caja(0.09, 0.14, 0.12, [0xb0302a, 0x2a4fa8, 0x2f7a3a, 0xd0a020][lb], x1 + 0.32 + lb * 0.12, 0.57, z1 - 0.2)); }
      if (tramo >= 4) { g.add(cil(0.05, 0.08, 0.7, 6, C.oro, cen.x, 0.35, z1 + 0.6)); g.add(esfera(0.3, 0x3f7fd0, cen.x, 0.95, z1 + 0.6, 12, 10)); var anillo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 6, 20), mat(C.oro)); anillo.position.set(cen.x, 0.95, z1 + 0.6); anillo.rotation.x = 1.1; g.add(anillo); }
    } else if (tipo === 'enfermeria') {
      // tiendas de curación, jardín y una cruz grande
      var nt = Math.min(3, tramo);
      for (var tn = 0; tn < nt; tn++) { var tx = x1 + 0.6, tz = z0 + 0.5 + tn * 1.1; g.add(cono(0.5, 0.75, 4, 0xf4f1e8, tx, 0.38, tz).rotateY(Math.PI / 4)); g.add(caja(0.18, 0.04, 0.05, 0xc0281e, tx, 0.62, tz + 0.3)); g.add(caja(0.05, 0.18, 0.05, 0xc0281e, tx, 0.62, tz + 0.3)); }
      var cs = 0.35 + tramo * 0.18, cy = top + 0.25 + cs;
      g.add(caja(cs * 2.2, cs * 0.7, 0.14, 0x2fa04a, cen.x, cy, cen.z)); g.add(caja(cs * 0.7, cs * 2.2, 0.14, 0x2fa04a, cen.x, cy, cen.z));
      if (tramo >= 4) { g.add(caja(cs * 2.4, cs * 0.85, 0.1, 0xffffff, cen.x, cy, cen.z - 0.03)); g.add(caja(cs * 0.85, cs * 2.4, 0.1, 0xffffff, cen.x, cy, cen.z - 0.03)); }
      if (tramo >= 3) { var jx = cen.x, jz = z1 + 0.75; g.add(caja(w * 0.8, 0.05, 0.9, 0x5aa83c, jx, 0.03, jz)); for (var fl = 0; fl < 6; fl++) g.add(esfera(0.08, [0xe49aac, 0xf4efe2, 0xe8c85a][fl % 3], jx - w * 0.35 + fl * w * 0.14, 0.1, jz + (fl % 2 ? 0.25 : -0.25), 5, 4)); }
      if (tramo >= 4) { g.add(cil(0.4, 0.45, 0.25, 12, 0xf2ece0, cen.x, 0.13, z1 + 0.75)); var ag = cil(0.33, 0.33, 0.04, 12, 0x5ab0e0, cen.x, 0.26, z1 + 0.75); g.add(ag); g.add(cil(0.06, 0.06, 0.5, 6, 0xf2ece0, cen.x, 0.45, z1 + 0.75)); }
    } else if (tipo === 'herreria') {
      g.add(caja(0.45, top * 0.7 + tramo * 0.35, 0.45, piedra, x0 + 0.2, (top * 0.7 + tramo * 0.35) / 2, z0 + 0.2));
      var brasa = new THREE.Mesh(geo('brasaH', function () { return new THREE.BoxGeometry(0.3, 0.06, 0.3); }), MAT_FUEGO); brasa.position.set(x0 + 0.2, top * 0.7 + tramo * 0.35 + 0.04, z0 + 0.2); g.add(brasa);
      for (var yu = 0; yu < tramo; yu++) { g.add(caja(0.3, 0.12, 0.16, oro ? C.oro : 0x4a4c56, x1 + 0.5, 0.42, z0 + 0.4 + yu * 0.6)); g.add(caja(0.16, 0.3, 0.14, 0x3a3a3a, x1 + 0.5, 0.18, z0 + 0.4 + yu * 0.6)); }
    } else if (tipo === 'almacen') {
      for (var cj = 0; cj < tramo * 3; cj++) g.add(caja(0.34, 0.34, 0.34, oro && cj % 3 === 0 ? C.oro : C.madera, x1 + 0.35 + (cj % 3) * 0.38, 0.17 + Math.floor(cj / 3) % 2 * 0.36, z0 + 0.3 + Math.floor(cj / 6) * 0.45));
      if (tramo >= 3) { g.add(caja(1.2, 0.9, 1.0, piedra, x0 - 0.7, 0.45, z1 - 0.5)); g.add(cono(0.95, 0.6, 4, techoT, x0 - 0.7, 1.2, z1 - 0.5).rotateY(Math.PI / 4)); }
    } else if (tipo === 'mercado') {
      for (var pu = 0; pu < tramo; pu++) { var mx = x0 + 0.4 + pu * 1.0, mz = z1 + 0.6; [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]].forEach(function (q) { g.add(cil(0.03, 0.03, 0.8, 4, C.madera, mx + q[0], 0.4, mz + q[1])); }); g.add(caja(0.8, 0.05, 0.7, [0xd0302a, 0x2a6ad0, 0xe0b040, 0x2f9a4a][pu % 4], mx, 0.82, mz)); g.add(caja(0.7, 0.3, 0.5, C.madera, mx, 0.15, mz)); }
      if (tramo >= 3) { g.add(cil(0.45, 0.5, 0.3, 12, piedra, cen.x, 0.15, z0 - 0.5)); g.add(cil(0.38, 0.38, 0.04, 12, 0x5ab0e0, cen.x, 0.31, z0 - 0.5)); }
      if (tramo >= 4) { g.add(cil(0.12, 0.15, 0.6, 8, C.oro, cen.x, 0.6, z0 - 0.5)); g.add(esfera(0.18, C.oro, cen.x, 1.0, z0 - 0.5, 8, 6)); }
    } else if (tipo === 'establo') {
      for (var cb = 0; cb < tramo; cb++) { var hx = x1 + 0.6, hz = z0 + 0.4 + cb * 0.8; g.add(caja(0.55, 0.28, 0.2, 0x7a4a2a, hx, 0.42, hz)); g.add(caja(0.18, 0.22, 0.16, 0x7a4a2a, hx + 0.32, 0.6, hz)); [[-0.2, -0.06], [0.2, -0.06], [-0.2, 0.06], [0.2, 0.06]].forEach(function (q) { g.add(caja(0.06, 0.3, 0.06, 0x5a3418, hx + q[0], 0.15, hz + q[1])); }); }
      if (tramo >= 3) { g.add(caja(1.6, 0.8, 0.9, piedra, cen.x, 0.4, z0 - 0.7)); g.add(caja(1.7, 0.08, 1.0, techoT, cen.x, 0.84, z0 - 0.7)); }
    } else if (tipo === 'galeria') {
      for (var di = 0; di < tramo + 1; di++) { var dx = x1 + 0.6, dz = z0 + 0.2 + di * 0.75; g.add(cil(0.25, 0.25, 0.05, 12, 0xf4f1e8, dx, 0.5, dz).rotateZ(Math.PI / 2)); g.add(cil(0.15, 0.15, 0.06, 12, 0xc0281e, dx, 0.5, dz).rotateZ(Math.PI / 2)); g.add(cil(0.03, 0.03, 0.5, 4, C.madera, dx, 0.25, dz)); }
      if (tramo >= 3) torreAnexa(g, x0 - 0.4, z1 - 0.3, 1.8 + tramo * 0.3, 0.32, techoT, piedra, oro);
    } else if (tipo === 'granja') {
      for (var cr = 0; cr < tramo; cr++) { var fx = x0 - 0.2 + cr * 1.2; g.add(caja(1.0, 0.06, 1.2, 0x7a5a32, fx, 0.04, z1 + 0.8)); for (var sr = 0; sr < 4; sr++) g.add(caja(0.12, 0.22, 1.0, cr % 2 ? 0x8fc44a : 0xe0c050, fx - 0.36 + sr * 0.24, 0.16, z1 + 0.8)); }
      if (tramo >= 3) { g.add(cil(0.35, 0.35, 1.4 + tramo * 0.2, 10, piedra, x0 - 0.4, (1.4 + tramo * 0.2) / 2, z0 + 0.3)); g.add(cono(0.4, 0.45, 10, techoT, x0 - 0.4, 1.4 + tramo * 0.2 + 0.22, z0 + 0.3)); }
    } else if (tipo === 'aserradero') {
      for (var tr2 = 0; tr2 < tramo; tr2++) for (var tl = 0; tl < 3; tl++) g.add(cil(0.14, 0.14, 1.2, 7, 0xa9783f, x0 + 0.2 + tr2 * 0.6, 0.14 + tl * 0.0 + (tl === 2 ? 0.24 : 0), z1 + 0.6 + (tl === 1 ? 0.28 : tl === 2 ? 0.14 : 0)).rotateZ(Math.PI / 2).rotateY(Math.PI / 2));
      if (tramo >= 3) { g.add(caja(1.1, 0.9, 0.9, piedra, x1 + 0.7, 0.45, z0 + 0.5)); g.add(cono(0.85, 0.5, 4, techoT, x1 + 0.7, 1.15, z0 + 0.5).rotateY(Math.PI / 4)); }
    } else if (tipo === 'mina' || tipo === 'cantera') {
      var roca = tipo === 'mina' ? 0x8a8478 : 0xb5aea3;
      for (var rb = 0; rb < tramo * 2; rb++) g.add(caja(0.34, 0.3, 0.34, tipo === 'mina' && oro && rb % 2 ? C.oro : roca, x1 + 0.3 + (rb % 2) * 0.4, 0.15 + Math.floor(rb / 4) * 0.3, z1 + 0.3 - Math.floor(rb / 2) % 2 * 0.4));
      if (tramo >= 2) { g.add(caja(0.08, 1.6 + tramo * 0.3, 0.08, C.maderaOsc, x0 - 0.2, (1.6 + tramo * 0.3) / 2, z1)); g.add(caja(1.2, 0.08, 0.08, C.maderaOsc, x0 + 0.35, 1.6 + tramo * 0.3, z1)); }
      if (tramo >= 4) for (var pp = 0; pp < 4; pp++) g.add(esfera(0.13, C.oro, x0 + 0.1 + pp * 0.25, 0.12, z1 + 0.5, 6, 4));
    } else if (tipo === 'torre' || tipo === 'vigia') {
      if (tramo >= 3) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { g.add(caja(0.3, 0.6 + tramo * 0.15, 0.3, piedra, cen.x + q[0] * (w / 2 + 0.2), (0.6 + tramo * 0.15) / 2, cen.z + q[1] * (d / 2 + 0.2))); });
    }
    return g;
  }
  function recolorearTramo(g, tramo, tipo) {
    if (tipo && recolorearTipo(g, tramo, tipo)) return;
    var k = COLORES_TRAMO[tramo];
    if (!k) return;
    var mapa = {};
    mapa[P.gris] = k.gris; mapa[P.osc] = k.osc; mapa[P.claro] = k.claro;
    mapa[C.piedra] = k.piedra; mapa[C.piedraOsc] = k.piedraOsc;
    ROJOS.forEach(function (c) { mapa[c] = k.techo; });
    TEJAS.forEach(function (c) { mapa[c] = k.teja; });
    mapa[P.viga] = k.viga; mapa[C.madera] = k.viga; mapa[P.vigaOsc] = k.vigaOsc;
    mapa[C.metalOsc] = k.metal;
    g.traverse(function (o) {
      if (!o.isMesh || !o.material || !o.material.color || o.material.transparent || o.material.isMeshBasicMaterial) return;
      var nuevo = mapa[o.material.color.getHex()];
      if (nuevo !== undefined) o.material = mat(nuevo, o.material.side === THREE.DoubleSide ? { side: THREE.DoubleSide } : undefined);
    });
  }
  var MAT_FUEGO = new THREE.MeshBasicMaterial({ color: 0xffa23a });
  var MAT_FUEGO2 = new THREE.MeshBasicMaterial({ color: 0xffe07a });
  var MAT_CRISTAL = new THREE.MeshBasicMaterial({ color: 0x7fe8ff });
  function estandarte(g, x, z, tela, borde, alto) {
    g.add(cil(0.05, 0.06, alto, 6, borde === C.oro ? C.oro : C.maderaOsc, x, alto / 2, z));
    g.add(esfera(0.09, borde, x, alto + 0.05, z, 8, 6));
    g.add(caja(0.62, 0.06, 0.06, borde, x, alto - 0.12, z + 0.04));
    var t = caja(0.52, 0.95, 0.03, tela, x, alto - 0.65, z + 0.05); t.castShadow = false; g.add(t);
    g.add(caja(0.54, 0.06, 0.035, borde, x, alto - 1.1, z + 0.05));
    var punta = cono(0.27, 0.22, 3, tela, x, alto - 1.24, z + 0.05); punta.rotation.z = Math.PI; punta.rotation.y = Math.PI / 6; g.add(punta);
  }
  function brasero(g, x, z, piedra, metal) {
    g.add(caja(0.34, 0.55, 0.34, piedra, x, 0.28, z));
    g.add(cil(0.26, 0.16, 0.18, 8, metal, x, 0.64, z));
    var f1 = new THREE.Mesh(geo('fuego1', function () { return new THREE.ConeGeometry(0.17, 0.42, 6); }), MAT_FUEGO); f1.position.set(x, 0.92, z); g.add(f1);
    var f2 = new THREE.Mesh(geo('fuego2', function () { return new THREE.ConeGeometry(0.09, 0.3, 5); }), MAT_FUEGO2); f2.position.set(x, 0.9, z); g.add(f2);
  }
  // ---------- TORRE DEL HOMENAJE: el castillo es el más alto de todos y da miedo ----------
  function torreonCastillo(g, tramo) {
    g.updateMatrixWorld(true);
    var bx = new THREE.Box3().setFromObject(g), cen = bx.getCenter(new THREE.Vector3()), top = bx.max.y;
    var R = 2.2 + tramo * 0.3, H = top + 0.6 + tramo * 1.4, X = cen.x, Z = cen.z - 0.6;
    var PIEDRA = tramo >= 4 ? 0x6a6560 : 0x5a5650, PIEDRA2 = 0x45423e, TECHO = 0x6e1812, METAL = 0x2a2a2e;
    g.add(cil(R, R * 1.12, H, 12, PIEDRA, X, H / 2, Z));
    // bandas de piedra más oscura
    for (var b = 1; b <= 3; b++) g.add(cil(R * 1.05, R * 1.05, 0.25, 12, PIEDRA2, X, H * b / 4, Z));
    // almenas con púas de hierro
    for (var a = 0; a < 12; a++) {
      var t = a / 12 * Math.PI * 2, x = X + Math.cos(t) * R * 1.02, z = Z + Math.sin(t) * R * 1.02;
      g.add(caja(R * 0.42, 0.55, R * 0.42, PIEDRA, x, H + 0.27, z));
      g.add(cono(0.09, 0.55, 4, METAL, x, H + 0.82, z));
    }
    // techo cónico rojo oscuro, muy alto
    g.add(cono(R * 1.05, R * 2.6, 12, TECHO, X, H + 0.55 + R * 1.3, Z));
    var cima = H + 0.55 + R * 2.6;
    if (tramo >= 4) { g.add(cil(0.1, 0.16, 1.2, 8, C.oro, X, cima + 0.5, Z)); g.add(esfera(0.3, C.oro, X, cima + 1.2, Z, 10, 8)); g.add(cono(0.12, 1.0, 6, C.oro, X, cima + 1.9, Z)); }
    else { g.add(cil(0.06, 0.06, 1.0, 6, METAL, X, cima + 0.4, Z)); }
    // ventanas con fuego en espiral
    for (var v = 0; v < 4 + tramo * 2; v++) {
      var tv = v * 1.3, yv = 1.2 + v * (H - 2) / (4 + tramo * 2);
      var w = new THREE.Mesh(geo('ventanaC', function () { return new THREE.BoxGeometry(0.28, 0.5, 0.1); }), MAT_FUEGO);
      w.position.set(X + Math.cos(tv) * R * 1.03, yv, Z + Math.sin(tv) * R * 1.03); w.rotation.y = -tv + Math.PI / 2; g.add(w);
    }
    // estandartes grandes colgando (rojo y negro)
    [0.4, 2.0, 3.6, 5.2].forEach(function (t, i) {
      var x = X + Math.cos(t) * R * 1.08, z = Z + Math.sin(t) * R * 1.08;
      var lona = caja(0.9, 2.4 + tramo * 0.3, 0.05, i % 2 ? 0x1a1a1e : 0x9a1a14, x, H - 1.4 - tramo * 0.15, z); lona.rotation.y = -t + Math.PI / 2; lona.castShadow = false; g.add(lona);
      var franja = caja(0.92, 0.18, 0.06, tramo >= 4 ? C.oro : 0x6a6560, x, H - 0.25, z); franja.rotation.y = -t + Math.PI / 2; g.add(franja);
    });
    // braseros encendidos al pie
    [[-1, 1], [1, 1]].forEach(function (s) { var bxx = X + s[0] * (R + 0.8), bz = Z + R + 0.6; g.add(cil(0.3, 0.22, 0.7, 8, PIEDRA2, bxx, 0.35, bz)); var f = new THREE.Mesh(geo('fuegoC', function () { return new THREE.ConeGeometry(0.25, 0.6, 6); }), MAT_FUEGO); f.position.set(bxx, 0.95, bz); g.add(f); });
    return g;
  }
  function mejorarPorTramo(g, tramo, tipo) {
    recolorearTramo(g, tramo, tipo);
    if (tramo < 2) return g;
    g.updateMatrixWorld(true);
    var caja3 = new THREE.Box3().setFromObject(g), tam = new THREE.Vector3(), cen = new THREE.Vector3();
    caja3.getSize(tam); caja3.getCenter(cen);
    var esCastillo = tipo === 'castillo';
    var w = Math.min(tam.x, esCastillo ? 99 : 4.6), d = Math.min(tam.z, esCastillo ? 99 : 4.6), arriba = caja3.max.y;
    var k = COLORES_TRAMO[tramo] || {};
    var piedra = tramo >= 4 ? 0xe0d3b8 : tramo === 3 ? k.osc : 0x8a8478;
    var borde = tramo >= 4 ? C.oro : tramo === 3 ? 0x6f7c8c : C.maderaOsc;
    var tela = tramo >= 4 ? 0x6a2a9a : tramo === 3 ? 0x2a4f8f : 0xa8322a;
    var fx = w / 2 + 0.3, fz = d / 2 + 0.3;
    // base de piedra (y en el tramo 4, de mármol con borde de oro)
    if (!esCastillo) {
      var losa = caja(w + 0.55, 0.12, d + 0.55, piedra, cen.x, 0.06, cen.z); losa.castShadow = false; g.add(losa);
      if (tramo >= 4) { var aro = caja(w + 0.7, 0.06, d + 0.7, C.oro, cen.x, 0.03, cen.z); aro.castShadow = false; g.add(aro); }
    }
    // estandartes al frente
    var altoE = esCastillo ? 3.4 : 2.3;
    estandarte(g, cen.x - fx, cen.z + fz, tela, borde, altoE);
    estandarte(g, cen.x + fx, cen.z + fz, tela, borde, altoE);
    if (tramo >= 3 && !esCastillo) {
      // braseros con fuego atrás y postes de piedra en las esquinas
      brasero(g, cen.x - fx, cen.z - fz, piedra, k.metal);
      brasero(g, cen.x + fx, cen.z - fz, piedra, k.metal);
      [[-1, 1], [1, 1]].forEach(function (s) {
        g.add(caja(0.22, 0.42, 0.22, piedra, cen.x + s[0] * (fx - 0.55), 0.21, cen.z + s[1] * fz));
        g.add(esfera(0.1, borde, cen.x + s[0] * (fx - 0.55), 0.48, cen.z + s[1] * fz, 6, 4));
      });
    }
    if (tramo >= 4) {
      // aguja dorada en lo alto y cristales que brillan
      var ax = cen.x, az = cen.z;
      g.add(cil(0.08, 0.12, 0.5, 8, C.oro, ax, arriba + 0.2, az));
      g.add(esfera(0.16, C.oro, ax, arriba + 0.5, az, 10, 8));
      g.add(cono(0.08, 0.55, 6, C.oro, ax, arriba + 0.85, az));
      if (!esCastillo) [[-1], [1]].forEach(function (s) {
        var cr = new THREE.Mesh(geo('cristalT', function () { return new THREE.OctahedronGeometry(0.2, 0); }), MAT_CRISTAL);
        cr.position.set(cen.x + s[0] * (fx - 0.55), 0.78, cen.z + fz); cr.scale.y = 1.6; g.add(cr);
      });
      // emblema dorado al frente
      var em = cil(0.26, 0.26, 0.05, 16, C.oro, cen.x, Math.min(arriba * 0.45, 1.5), cen.z + Math.min(tam.z, 4.6) / 2 + 0.06); em.rotation.x = Math.PI / 2; g.add(em);
      var em2 = cil(0.15, 0.15, 0.06, 5, 0x6a2a9a, cen.x, Math.min(arriba * 0.45, 1.5), cen.z + Math.min(tam.z, 4.6) / 2 + 0.08); em2.rotation.x = Math.PI / 2; g.add(em2);
    }
    return g;
  }

  // Parcela de campo (fuera de la muralla): cuadro de tierra con surcos y postes en las esquinas
  function campoParcela() {
    var g = new THREE.Group();
    var base = caja(7.6, 0.1, 7.6, 0x7d9a4a, 0, 0.05, 0); base.castShadow = false; base.receiveShadow = true; g.add(base);
    var borde = caja(7.9, 0.06, 7.9, 0x6a5232, 0, 0.03, 0); borde.castShadow = false; g.add(borde);
    for (var r = -3; r <= 3; r++) { var su = caja(7.0, 0.05, 0.28, 0x8c7048, 0, 0.12, r * 1.0); su.castShadow = false; g.add(su); }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { g.add(cil(0.1, 0.12, 0.7, 5, C.madera, s[0] * 3.75, 0.35, s[1] * 3.75)); });
    // brillo: se enciende cuando el campo sirve para lo que vas a construir
    var br = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 7.8), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0, depthWrite: false }));
    br.rotation.x = -Math.PI / 2; br.position.y = 0.16; br.renderOrder = 2; g.add(br);
    g.userData.brillo = br;
    return g;
  }
  // Mina de oro: la mina de siempre con pepitas doradas
  function minaOro(nivel) {
    var g = mina(nivel);
    [[1.1, 1.65], [1.25, 1.75], [0.95, 1.8], [-1.4, 1.2], [-1.2, 1.35]].forEach(function (p, i) { g.add(esfera(0.13 + (i % 2) * 0.04, C.oro, p[0], 0.62 + (i % 3) * 0.05, p[1], 6, 4)); });
    g.add(caja(0.5, 0.35, 0.5, C.maderaOsc, -1.3, 0.18, 1.3)); g.add(esfera(0.2, C.oro, -1.3, 0.45, 1.3, 8, 6));
    return g;
  }
  // Cantera: la colina con bloques de piedra cortada apilados
  function cantera(nivel) {
    var g = mina(nivel);
    var piedra = 0xc9c3b6;
    [[-1.5, 1.4], [-0.9, 1.6], [-1.2, 2.1]].forEach(function (p) { g.add(caja(0.55, 0.4, 0.55, piedra, p[0], 0.2, p[1])); });
    g.add(caja(0.55, 0.4, 0.55, 0xb3ad9f, -1.2, 0.6, 1.5));
    g.add(cil(0.06, 0.06, 2.2, 6, C.madera, 1.6, 1.1, 1.6)); g.add(caja(1.2, 0.08, 0.08, C.madera, 1.2, 2.15, 1.6));
    return g;
  }
  // Etiqueta con nombre y nivel encima de cada edificio
  var cacheEtiqueta = {};
  function etiquetaEdificio(nombre, nivel) {
    var k = nombre + '|' + nivel;
    if (!cacheEtiqueta[k]) {
      var c = document.createElement('canvas'); c.width = 256; c.height = 64;
      var x = c.getContext('2d');
      x.font = 'bold 26px sans-serif';
      var w = Math.min(250, x.measureText(nombre).width + 64);
      var x0 = (256 - w) / 2;
      x.fillStyle = 'rgba(42, 26, 14, 0.82)';
      x.beginPath(); x.moveTo(x0 + 16, 10); x.lineTo(x0 + w - 16, 10); x.quadraticCurveTo(x0 + w, 10, x0 + w, 26); x.lineTo(x0 + w, 38); x.quadraticCurveTo(x0 + w, 54, x0 + w - 16, 54); x.lineTo(x0 + 16, 54); x.quadraticCurveTo(x0, 54, x0, 38); x.lineTo(x0, 26); x.quadraticCurveTo(x0, 10, x0 + 16, 10); x.fill();
      x.fillStyle = nivel >= 10 ? '#f5c542' : nivel >= 7 ? '#6f8fb5' : nivel >= 4 ? '#c0503a' : '#a07a4a';
      x.beginPath(); x.arc(x0 + 22, 32, 17, 0, Math.PI * 2); x.fill();
      x.lineWidth = 3; x.strokeStyle = '#ffe9b0'; x.stroke();
      x.fillStyle = nivel >= 10 ? '#3a2414' : '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 20px sans-serif';
      x.fillText(String(nivel), x0 + 22, 33);
      x.fillStyle = '#fff6dc'; x.textAlign = 'left'; x.font = 'bold 24px sans-serif';
      x.fillText(nombre, x0 + 46, 33);
      var tx = new THREE.CanvasTexture(c);
      cacheEtiqueta[k] = new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true });
    }
    var s = new THREE.Sprite(cacheEtiqueta[k]);
    s.scale.set(7.2, 1.8, 1);
    s.renderOrder = 12;
    return s;
  }

  // =================================================================
  //  EDIFICIOS NUEVOS: almacén, mercado, herrería, establo y galería de tiro
  // =================================================================
  // Puesto de vigía: torre de madera alta con plataforma, techo y bandera
  function vigia(nivel) {
    nivel = Math.min(3, nivel); var g = new THREE.Group();
    g.add(caja(1.9, 0.2, 1.9, P.osc, 0, 0.1, 0));
    var alto = 3.4;
    [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(function (s) { var p = cil(0.09, 0.12, alto, 6, C.madera, s[0], alto / 2 + 0.2, s[1]); p.rotation.z = -s[0] * 0.04; p.rotation.x = s[1] * 0.04; g.add(p); });
    [0.9, 1.9].forEach(function (y) {
      [[0, -0.6, 1.3, 0.07], [0, 0.6, 1.3, 0.07]].forEach(function (q) { g.add(caja(q[2], 0.07, q[3], P.vigaOsc, q[0], y, q[1])); });
      [[-0.6, 0, 0.07, 1.3], [0.6, 0, 0.07, 1.3]].forEach(function (q) { g.add(caja(q[2], 0.07, q[3], P.vigaOsc, q[0], y, q[1])); });
    });
    g.add(caja(1.7, 0.12, 1.7, C.madera, 0, alto + 0.2, 0));
    for (var i = -1; i <= 1; i += 2) { g.add(caja(1.7, 0.45, 0.06, P.viga, 0, alto + 0.48, i * 0.82)); g.add(caja(0.06, 0.45, 1.7, P.viga, i * 0.82, alto + 0.48, 0)); }
    [[-0.78, -0.78], [0.78, -0.78], [-0.78, 0.78], [0.78, 0.78]].forEach(function (s) { g.add(cil(0.05, 0.05, 1.1, 5, C.madera, s[0], alto + 0.75, s[1])); });
    g.add(cono(1.35, 0.8, 4, rojoNivel(nivel), 0, alto + 1.65, 0));
    g.add(esfera(0.1, adornoNivel(nivel), 0, alto + 2.1, 0, 6, 4));
    var esc = new THREE.Group(); for (var e = 0; e < 8; e++) esc.add(caja(0.42, 0.04, 0.06, C.madera, 0, 0.4 + e * 0.42, 0)); [-0.2, 0.2].forEach(function (x) { esc.add(caja(0.05, alto, 0.06, C.madera, x, alto / 2 + 0.2, 0)); });
    esc.position.set(0, 0, 0.72); esc.rotation.x = -0.08; g.add(esc);
    var b = bandera(0xc0503a, 1.3); b.position.set(0.3, alto + 1.9, 0); g.add(b);
    g.userData.tela = b.userData.tela;
    return g;
  }
  function almacen(nivel) {
    nivel = Math.min(3, nivel); var g = new THREE.Group();
    casaPiedra(g, 0, -0.4, 3.0, 2.0, 1.4, nivel, true);
    g.add(caja(1.0, 1.05, 0.08, C.maderaOsc, 0, 0.78, 0.64));
    g.add(caja(1.12, 0.1, 0.1, adornoNivel(nivel), 0, 1.33, 0.66));
    [-0.25, 0.25].forEach(function (x) { g.add(caja(0.04, 0.95, 0.09, P.vigaOsc, x, 0.75, 0.68)); });
    barril(g, -1.65, 0.95); barril(g, -1.25, 1.3, 0.8); barril(g, -1.75, 1.45, 0.75);
    cajas(g, 1.45, 1.0, 0.3); cajas(g, 1.05, 1.45, -0.2);
    [[0.6, 1.25], [0.85, 1.55], [0.4, 1.6]].forEach(function (p) { var s = esfera(0.24, 0xcfb789, p[0], 0.2, p[1], 7, 5); s.scale.y = 0.8; g.add(s); });
    return g;
  }
  function mercado(nivel) {
    nivel = Math.min(3, nivel); var g = new THREE.Group();
    var suelo = caja(4.2, 0.12, 3.6, P.claro, 0, 0.06, 0); suelo.castShadow = false; g.add(suelo);
    var telas = [0xc0503a, 0x3f6fb5, 0xe0b040];
    [[-1.3, -0.6, 0], [1.3, -0.6, 1], [0, 0.9, 2]].forEach(function (q) {
      var x = q[0], z = q[1], col = telas[q[2]];
      [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]].forEach(function (s) { g.add(cil(0.05, 0.05, 1.3, 5, C.madera, x + s[0], 0.65, z + s[1])); });
      var tol = caja(1.45, 0.06, 1.15, col, x, 1.32, z); tol.rotation.x = -0.18; g.add(tol);
      for (var r = -1; r <= 1; r += 2) { var raya = caja(0.2, 0.065, 1.16, 0xfaf3e0, x + r * 0.35, 1.325, z); raya.rotation.x = -0.18; g.add(raya); }
      g.add(caja(1.2, 0.1, 0.7, C.madera, x, 0.75, z));
      g.add(caja(1.2, 0.7, 0.06, P.vigaOsc, x, 0.4, z + 0.34));
      [0xd84a3a, 0xe0b040, 0x6aa84a, 0xb07a3a].forEach(function (c, i) { g.add(esfera(0.09, c, x - 0.4 + i * 0.27, 0.86, z, 6, 4)); });
    });
    var b = bandera(nivel >= 3 ? C.oro : 0xc0503a, 2.4); b.position.set(1.8, 0, 1.5); g.add(b);
    return g;
  }
  function herreria(nivel) {
    nivel = Math.min(3, nivel); var g = new THREE.Group();
    casaPiedra(g, -0.55, -0.5, 2.2, 1.8, 1.3, nivel, false);
    chimenea(g, -1.2, 2.2, -0.9); g.add(caja(0.42, 0.9, 0.42, 0x8a8478, -1.2, 1.9, -0.9));
    // fragua con fuego y yunque bajo un tejadillo
    g.add(caja(0.9, 0.7, 0.8, 0x8a8478, 1.15, 0.35, 0.2));
    var fuego = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.5), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); fuego.position.set(1.15, 0.72, 0.2); g.add(fuego);
    [[0.65, -0.3], [1.65, -0.3], [0.65, 0.8], [1.65, 0.8]].forEach(function (p) { g.add(cil(0.05, 0.05, 1.6, 5, C.madera, p[0], 0.8, p[1])); });
    var techo = caja(1.3, 0.07, 1.4, rojoNivel(nivel), 1.15, 1.62, 0.25); techo.rotation.z = 0.12; g.add(techo);
    g.add(cil(0.2, 0.24, 0.4, 7, C.maderaOsc, 0.55, 0.2, 1.1));
    g.add(caja(0.42, 0.14, 0.18, C.metalOsc, 0.55, 0.47, 1.1)); g.add(caja(0.16, 0.1, 0.12, C.metalOsc, 0.78, 0.5, 1.1));
    var martillo = caja(0.05, 0.3, 0.05, C.madera, 0.4, 0.62, 1.15); martillo.rotation.z = 0.8; g.add(martillo);
    [[-1.6, 0.9], [-1.3, 1.1]].forEach(function (p, i) { var es = cil(0.28, 0.28, 0.05, 10, i ? 0x8d99a6 : 0xb0b8c2, p[0], 0.55, p[1]); es.rotation.x = Math.PI / 2; g.add(es); });
    return g;
  }
  function establo(nivel) {
    nivel = Math.min(3, nivel); var g = new THREE.Group();
    casaPiedra(g, 0, -0.75, 3.2, 1.7, 1.25, nivel, true);
    [-0.9, 0, 0.9].forEach(function (x) { g.add(caja(0.6, 0.85, 0.06, C.maderaOsc, x, 0.68, 0.12)); g.add(caja(0.6, 0.05, 0.07, adornoNivel(nivel), x, 1.12, 0.13)); });
    // corral con heno y un caballo
    for (var fx = -1.8; fx <= 1.8; fx += 0.6) g.add(caja(0.08, 0.5, 0.08, C.madera, fx, 0.25, 1.85));
    [0.18, 0.38].forEach(function (y) { g.add(caja(3.7, 0.05, 0.05, C.madera, 0, y, 1.85)); });
    [[-1.5, 0.75], [-1.5, 1.2]].forEach(function (p) { var h = cil(0.3, 0.3, 0.45, 10, C.paja, p[0], 0.3, p[1]); h.rotation.z = Math.PI / 2; g.add(h); });
    var cab = new THREE.Group();
    cab.add(caja(0.9, 0.4, 0.32, 0x8a5a33, 0, 0.62, 0));
    var cue = caja(0.2, 0.42, 0.2, 0x8a5a33, 0.45, 0.85, 0); cue.rotation.z = -0.5; cab.add(cue);
    cab.add(caja(0.34, 0.16, 0.18, 0x8a5a33, 0.62, 1.02, 0));
    cab.add(caja(0.08, 0.3, 0.2, 0x3a2414, 0.38, 0.95, 0));
    [[-0.32, -0.1], [-0.32, 0.1], [0.32, -0.1], [0.32, 0.1]].forEach(function (p) { cab.add(caja(0.08, 0.45, 0.08, 0x6a4426, p[0], 0.22, p[1])); });
    cab.add(caja(0.06, 0.32, 0.06, 0x3a2414, -0.48, 0.6, 0));
    cab.position.set(0.6, 0, 1.15); cab.rotation.y = 0.4; g.add(cab);
    return g;
  }
  function galeria(nivel) {
    nivel = Math.min(3, nivel); var g = new THREE.Group();
    casaPiedra(g, -1.25, -1.0, 1.5, 1.2, 1.05, nivel, false);
    function diana(x, z) {
      g.add(cil(0.05, 0.05, 1.1, 5, C.madera, x - 0.25, 0.55, z - 0.1)); g.add(cil(0.05, 0.05, 1.1, 5, C.madera, x + 0.25, 0.55, z - 0.1));
      [[0.48, 0xf2ece0], [0.36, 0xc0503a], [0.24, 0xf2ece0], [0.12, 0xc0503a]].forEach(function (a, i) { var d = cil(a[0], a[0], 0.06 + i * 0.01, 14, a[1], x, 1.05, z + i * 0.012); d.rotation.x = Math.PI / 2; g.add(d); });
      [[0.06, 1.12], [-0.1, 0.98]].forEach(function (p) { var fl = caja(0.025, 0.025, 0.5, 0x6e4a2a, x + p[0], p[1], z + 0.28); g.add(fl); });
    }
    diana(0.4, -0.9); diana(1.5, -0.9);
    for (var fx = -1.9; fx <= 1.9; fx += 0.95) g.add(caja(0.08, 0.45, 0.08, C.madera, fx, 0.22, 1.6));
    g.add(caja(3.9, 0.05, 0.05, C.madera, 0, 0.35, 1.6));
    var mu = new THREE.Group(); mu.add(cil(0.04, 0.04, 1.1, 5, C.madera, 0, 0.55, 0)); mu.add(cil(0.18, 0.22, 0.5, 7, C.paja, 0, 0.85, 0)); mu.add(esfera(0.15, C.paja, 0, 1.22, 0, 7, 5)); mu.add(caja(0.7, 0.06, 0.06, C.madera, 0, 0.95, 0));
    mu.position.set(-0.6, 0, 0.6); g.add(mu);
    [[1.0, 0.6], [1.3, 0.75]].forEach(function (p) { var c = cil(0.12, 0.1, 0.5, 7, C.maderaOsc, p[0], 0.25, p[1]); g.add(c); });
    return g;
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
    // zócalo de roca: la fortaleza se asienta sobre un talud
    g.add(cil(6.6, 7.4, 0.7, 10, C.piedraOsc, 0, 0.35, 0));
    g.add(cil(7.4, 7.7, 0.25, 10, 0x3e3e44, 0, 0.12, 0));
    // murallas altas y gruesas, con contrafuertes y adarve almenado
    var L = 8.4, h = 3.2, t = 1.2;
    var muros = [[0, -L / 2, L, t], [0, L / 2, L, t], [-L / 2, 0, t, L], [L / 2, 0, t, L]];
    muros.forEach(function (m) {
      var horiz = m[2] > m[3];
      g.add(caja(m[2], h, m[3], C.piedra, m[0], 0.7 + h / 2, m[1]));
      // talud inclinado en la base del muro
      g.add(caja(m[2] + (horiz ? 0 : 0.5), 0.8, m[3] + (horiz ? 0.5 : 0), C.piedraOsc, m[0], 1.1, m[1]));
      var largo = Math.max(m[2], m[3]), n = 8;
      for (var i = 0; i < n; i++) {
        var p = -largo / 2 + 0.6 + i * (largo - 1.2) / (n - 1);
        var x = horiz ? m[0] + p : m[0], z = horiz ? m[1] : m[1] + p;
        g.add(caja(horiz ? 0.55 : t + 0.1, 0.6, horiz ? t + 0.1 : 0.55, C.piedra, x, 0.7 + h + 0.3, z));
      }
      // contrafuertes por fuera
      var fuera = horiz ? Math.sign(m[1]) : Math.sign(m[0]);
      [-1.6, 1.6].forEach(function (p) {
        var x = horiz ? m[0] + p : m[0] + fuera * (t / 2 + 0.25), z = horiz ? m[1] + fuera * (t / 2 + 0.25) : m[1] + p;
        g.add(caja(horiz ? 0.6 : 0.5, h * 0.8, horiz ? 0.5 : 0.6, C.piedraOsc, x, 0.7 + h * 0.4, z));
      });
      // antorcha en el adarve, a la mitad de cada muro (menos el de la puerta)
      if (m[0] >= 0 || horiz) antorcha(g, m[0] - (horiz ? 0 : fuera * 0.2), 0.7 + h + 0.55, m[1] - (horiz ? fuera * 0.2 : 0));
    });
    // torres de las esquinas: altas, con matacanes, almenas y saeteras encendidas
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      var x = s[0] * L / 2, z = s[1] * L / 2, ux = s[0] * 0.7071, uz = s[1] * 0.7071;
      g.add(cil(1.35, 1.6, 6.0, 10, C.piedra, x, 0.7 + 3.0, z));
      g.add(cil(1.75, 1.75, 0.9, 10, C.piedraOsc, x, 1.15, z));
      g.add(cil(1.7, 1.4, 0.6, 10, C.piedraOsc, x, 0.7 + 6.3, z));
      for (var am = 0; am < 8; am++) { var aa = am / 8 * Math.PI * 2; g.add(caja(0.42, 0.5, 0.42, C.piedra, x + Math.cos(aa) * 1.5, 0.7 + 6.85, z + Math.sin(aa) * 1.5)); }
      g.add(cono(1.6, 3.0, 10, colTecho, x, 0.7 + 8.3, z));
      [3.0, 5.0].forEach(function (yv) {
        g.add(ventana(0.24, 0.6, 0.24, x + ux * 1.47, yv, z + uz * 1.47));
        brillo(g, x + ux * 1.6, yv, z + uz * 1.6, 1.3, true);
      });
      g.add(ventana(0.24, 0.5, 0.24, x - s[0] * 1.45, 5.6, z));
    });
    // torre del homenaje: dos cuerpos, torrecillas en las esquinas y chapitel altísimo
    var KX = 0.6, KA = 6.2;
    g.add(caja(4.8, KA, 4.8, C.piedra, KX, 0.7 + KA / 2, 0));
    g.add(caja(5.3, 0.45, 5.3, C.piedraOsc, KX, 0.7 + KA + 0.2, 0));
    for (var ka = -2; ka <= 2; ka++) {
      [[ka * 1.05, -2.5], [ka * 1.05, 2.5], [-2.5, ka * 1.05], [2.5, ka * 1.05]].forEach(function (q) { g.add(caja(0.45, 0.5, 0.45, C.piedra, KX + q[0], 0.7 + KA + 0.65, q[1])); });
    }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      g.add(cil(0.5, 0.55, 1.9, 8, C.piedra, KX + s[0] * 2.45, 0.7 + KA + 0.95, s[1] * 2.45));
      g.add(cono(0.65, 1.3, 8, colTecho, KX + s[0] * 2.45, 0.7 + KA + 2.55, s[1] * 2.45));
    });
    g.add(caja(3.2, 2.6, 3.2, C.piedra, KX, 0.7 + KA + 1.7, 0));
    g.add(caja(3.6, 0.35, 3.6, C.piedraOsc, KX, 0.7 + KA + 3.15, 0));
    var techo = cono(2.75, 3.8, 4, colTecho, KX, 0.7 + KA + 5.2, 0);
    techo.rotation.y = Math.PI / 4;
    g.add(techo);
    var cima = 0.7 + KA + 7.1;
    var b = bandera(C.telaRoja, 2.2); b.position.set(KX, cima - 0.9, 0); g.add(b);
    g.userData.banderas = [b.userData.tela];
    b.userData.noFusionar = true;
    // piedras de esquina en la torre del homenaje y franja de piedra en la muralla
    esquinas(g, KX, 0, 4.8, 4.8, 0.7, 0.7 + KA, 0x8b8e98);
    muros.forEach(function (mq) {
      var fr = caja(mq[2] + 0.06, 0.18, mq[3] + 0.06, C.piedraOsc, mq[0], 0.7 + h * 0.62, mq[1]); fr.castShadow = false; g.add(fr);
    });
    // banderitas en dos torres
    [[-1, -1], [1, 1]].forEach(function (s) { var bt = bandera(C.telaMar, 1.4); bt.userData.noFusionar = true; bt.position.set(s[0] * L / 2, 0.7 + 9.6, s[1] * L / 2); bt.scale.setScalar(0.7); g.add(bt); g.userData.banderas.push(bt.userData.tela); });
    // ventanas encendidas en las cuatro caras: dos pisos del cuerpo bajo y el cuerpo alto
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (f) {
      [-1.2, 0, 1.2].forEach(function (u) {
        [4.0, 5.8].forEach(function (yv) {
          var x = KX + f[0] * 2.42 + (f[0] ? 0 : u), z = f[1] * 2.42 + (f[1] ? 0 : u);
          g.add(f[0] ? ventana(0.08, 0.75, 0.42, x, yv, z) : ventana(0.42, 0.75, 0.08, x, yv, z));
          if (u !== 0 || yv > 5) brillo(g, x + f[0] * 0.2, yv, z + f[1] * 0.2, 1.5, true);
        });
      });
      [-0.7, 0.7].forEach(function (u) {
        var x = KX + f[0] * 1.62 + (f[0] ? 0 : u), z = f[1] * 1.62 + (f[1] ? 0 : u), yv = 0.7 + KA + 1.8;
        g.add(f[0] ? ventana(0.08, 0.8, 0.4, x, yv, z) : ventana(0.4, 0.8, 0.08, x, yv, z));
        brillo(g, x + f[0] * 0.2, yv, z + f[1] * 0.2, 1.4, true);
      });
    });
    // braseros encendidos en lo alto de la torre del homenaje
    antorcha(g, KX - 1.6, 0.7 + KA + 0.75, -1.6); antorcha(g, KX + 1.6, 0.7 + KA + 0.75, 1.6);
    // matacán sobre la puerta
    g.add(caja(0.9, 0.6, 3.4, C.piedraOsc, -L / 2 - 0.55, 0.7 + h - 0.1, 0));
    for (var mc = -1; mc <= 1; mc++) g.add(caja(0.5, 0.45, 0.5, C.piedra, -L / 2 - 0.85, 0.7 + h + 0.4, mc * 1.2));
    // remates dorados en los techos (lo único dorado del castillo)
    g.add(esfera(0.24, C.oro, KX, cima + 0.05, 0, 8, 6));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { g.add(esfera(0.15, C.oro, s[0] * L / 2, 0.7 + 9.9, s[1] * L / 2, 6, 4)); });
    // puerta (mira hacia el camino: lado -x)
    g.add(caja(0.3, 2.0, 2.2, C.maderaOsc, -L / 2 - 0.35, 1.7, 0));
    g.add(cil(1.1, 1.1, 0.3, 10, C.maderaOsc, -L / 2 - 0.35, 2.7, 0).rotateZ(Math.PI / 2));
    g.add(caja(0.35, 0.15, 2.4, C.metalOsc, -L / 2 - 0.4, 1.2, 0));
    g.add(caja(0.35, 0.15, 2.4, C.metalOsc, -L / 2 - 0.4, 2.2, 0));
    // arco de piedra sobre la puerta y escalón
    var arco = malla(geo('arcoPuerta', function () { return new THREE.TorusGeometry(1.25, 0.2, 6, 12, Math.PI); }), mat(0x8b8e98), -L / 2 - 0.45, 2.7, 0);
    arco.rotation.y = Math.PI / 2; g.add(arco);
    g.add(caja(0.8, 0.12, 2.8, C.piedraOsc, -L / 2 - 0.7, 0.75, 0));
    // ventanas con marco en la torre del homenaje (segundo piso)
    [-1.2, 0, 1.2].forEach(function (z) { g.add(ventana(0.08, 0.55, 0.4, 0.6 - 2.42, 2.6, z)); g.add(caja(0.1, 0.08, 0.55, 0x8b8e98, 0.6 - 2.44, 2.9, z)); });
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
  // Parcela libre (v5.0): el mismo estilo dentro y fuera de la muralla.
  // Caminito de arena alrededor, marco de pasto, borde de piedra, base de tierra lisa y un + para construir.
  var TAM_PARCELA = 7.0;
  function parcelaLibre(campo) {
    var g = new THREE.Group();
    var camino = caja(10, 0.04, 10, 0xb7ad9a, 0, 0.02, 0); camino.castShadow = false; camino.receiveShadow = true; g.add(camino);
    var pasto = caja(8.5, 0.07, 8.5, 0x7fae4e, 0, 0.045, 0); pasto.castShadow = false; pasto.receiveShadow = true; g.add(pasto);
    var borde = caja(7.6, 0.16, 7.6, 0xa7a196, 0, 0.09, 0); borde.castShadow = false; borde.receiveShadow = true; g.add(borde);
    var bordeOsc = caja(7.62, 0.04, 7.62, 0x7f796f, 0, 0.17, 0); bordeOsc.castShadow = false; g.add(bordeOsc);
    var tierra = caja(TAM_PARCELA, 0.2, TAM_PARCELA, campo ? 0x96724a : 0xc6a878, 0, 0.1, 0); tierra.castShadow = false; tierra.receiveShadow = true; g.add(tierra);
    // en el campo: tierra arada con surcos
    if (campo) for (var sf = -3; sf <= 3; sf++) { var su = caja(TAM_PARCELA - 0.5, 0.04, 0.24, 0x7c5c38, 0, 0.215, sf * (TAM_PARCELA / 7.6)); su.castShadow = false; g.add(su); }
    // piedras de las esquinas
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { var p = caja(0.7, 0.26, 0.7, 0x948e84, s[0] * 3.62, 0.13, s[1] * 3.62); p.castShadow = false; g.add(p); });
    // símbolo de construir: un + dentro de un aro (se esconde cuando hay edificio)
    var mas = new THREE.Group();
    var aro = new THREE.Mesh(geo('masAro', function () { return new THREE.RingGeometry(1.25, 1.55, 36); }), new THREE.MeshBasicMaterial({ color: 0xf2c45a, side: THREE.DoubleSide }));
    aro.rotation.x = -Math.PI / 2; aro.position.y = 0.215; mas.add(aro);
    var fondo = new THREE.Mesh(geo('masFondo', function () { return new THREE.CircleGeometry(1.25, 36); }), new THREE.MeshBasicMaterial({ color: 0x8a6a3e, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    fondo.rotation.x = -Math.PI / 2; fondo.position.y = 0.212; mas.add(fondo);
    var matMas = new THREE.MeshBasicMaterial({ color: 0xfff4cc });
    var h = new THREE.Mesh(geo('masH', function () { return new THREE.BoxGeometry(1.5, 0.06, 0.38); }), matMas); h.position.y = 0.24; mas.add(h);
    var v = new THREE.Mesh(geo('masV', function () { return new THREE.BoxGeometry(0.38, 0.06, 1.5); }), matMas); v.position.y = 0.24; mas.add(v);
    mas.userData.noFusionar = true;
    g.add(mas);
    g.userData.mas = mas;
    var brillo = new THREE.Mesh(
      geo('brilloParcela', function () { return new THREE.PlaneGeometry(7.4, 7.4); }),
      new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide })
    );
    brillo.rotation.x = -Math.PI / 2; brillo.position.y = 0.23; brillo.renderOrder = 2;
    g.add(brillo);
    g.userData.brillo = brillo;
    return fusionar(g);
  }
  function parcelaCerrada() {
    var g = new THREE.Group();
    var camino = caja(10, 0.04, 10, 0xb7ad9a, 0, 0.02, 0); camino.castShadow = false; camino.receiveShadow = true; g.add(camino);
    var pasto = caja(8.5, 0.06, 8.5, 0x86a856, 0, 0.04, 0); pasto.castShadow = false; pasto.receiveShadow = true; g.add(pasto);
    var tierra = caja(7.4, 0.12, 7.4, 0x9c7e56, 0, 0.07, 0); tierra.castShadow = false; tierra.receiveShadow = true; g.add(tierra);
    // surcos de tierra (que se note que es un terreno por abrir)
    for (var i = -3; i <= 3; i++) { var s = caja(7.0, 0.03, 0.22, 0x86683f, 0, 0.14, i * 0.95); s.castShadow = false; g.add(s); }
    return fusionar(g);
  }
  function terreno() {
    var g = new THREE.Group();
    // parcela cuadrada de la cuadrícula: tierra con borde de piedra
    var borde = caja(6.4, 0.08, 6.4, 0x9a948a, 0, 0.04, 0); borde.castShadow = false; g.add(borde);
    var base = caja(5.8, 0.1, 5.8, 0x8c6e4a, 0, 0.06, 0); base.castShadow = false; g.add(base);
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
    // casa de piedra del granjero
    casaPiedra(g, -0.6, -0.6, 2, 1.6, 1.3, nivel, false);
    chimenea(g, -1.1, 2.15, -0.95);
    g.add(caja(0.46, 0.75, 0.06, C.maderaOsc, -0.55, 0.62, 0.24));
    g.add(caja(0.58, 0.09, 0.09, adornoNivel(nivel), -0.55, 1.03, 0.25));
    g.add(ventana(0.3, 0.3, 0.06, -1.2, 1.05, 0.24));
    g.add(caja(0.42, 0.06, 0.12, P.viga, -1.2, 0.86, 0.27));
    brillo(g, -1.2, 1.05, 0.45, 1.2, true);
    barril(g, 0.0, 0.5, 0.8); cajas(g, -1.5, 0.75, 0.2);
    // carretilla de heno
    g.add(caja(0.6, 0.25, 0.45, C.madera, 0.2, 0.35, 1.35));
    g.add(esfera(0.28, C.paja, 0.2, 0.55, 1.35, 7, 5));
    var rueda = cil(0.18, 0.18, 0.05, 8, C.maderaOsc, 0.55, 0.18, 1.35); rueda.rotation.x = Math.PI / 2; g.add(rueda);
    // campo de trigo
    var filas = 2 + nivel;
    for (var i = 0; i < filas; i++) g.add(caja(0.35, 0.45, 1.5, C.paja, 0.6 + (i % 3) * 0.5, 0.3, 0.9));
    for (var j = 0; j < 3; j++) g.add(caja(1.6, 0.45, 0.3, 0xd8b04a, 0.9, 0.3, -0.4 - j * 0.45));
    // molino de piedra con techo rojo
    var molino = new THREE.Group();
    molino.add(cil(0.4, 0.55, 2.4, 8, P.gris, 0, 1.2, 0));
    [0.6, 1.3, 2.0].forEach(function (y, k) { var an = cil(0.53 - k * 0.05, 0.53 - k * 0.05, 0.06, 8, P.osc, 0, y, 0); an.castShadow = false; molino.add(an); });
    molino.add(cil(0.5, 0.5, 0.12, 8, P.viga, 0, 2.42, 0));
    molino.add(cono(0.66, 0.85, 8, rojoNivel(nivel), 0, 2.9, 0));
    molino.add(esfera(0.08, adornoNivel(nivel), 0, 3.37, 0, 6, 4));
    molino.add(caja(0.22, 0.4, 0.06, C.maderaOsc, 0, 0.45, 0.52));
    var aspas = new THREE.Group();
    for (var k = 0; k < 4; k++) {
      var p = new THREE.Group();
      p.add(caja(0.06, 1.35, 0.05, P.viga, 0, 0.68, 0));
      p.add(caja(0.2, 1.05, 0.03, 0xfdf6e3, 0.11, 0.78, 0));
      p.rotation.z = k * Math.PI / 2; aspas.add(p);
    }
    aspas.position.set(0, 2.25, 0.5);
    molino.add(aspas);
    molino.position.set(1.4, 0, -1.3);
    g.add(molino);
    g.userData.aspas = aspas;
    aspas.userData.noFusionar = true;
    // valla
    for (var fv = -1.8; fv <= 1.8; fv += 0.6) g.add(caja(0.08, 0.4, 0.08, C.madera, fv, 0.2, 1.9));
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
    var cp = casaPiedra(g, 0, -0.3, 3.0, 2.2, 1.4, nivel, true);
    // cruz verde en el frente y en el techo (verde: la cruz roja es un símbolo protegido)
    g.add(caja(0.66, 0.2, 0.06, verde, 0.3, 1.35, 0.84));
    g.add(caja(0.2, 0.66, 0.06, verde, 0.3, 1.35, 0.84));
    var cruz = new THREE.Group();
    cruz.add(caja(0.8, 0.26, 0.26, verdeOsc, 0, 0, 0));
    cruz.add(caja(0.26, 0.8, 0.26, verdeOsc, 0, 0, 0));
    cruz.position.set(0, cp.punta + 0.45, -0.3);
    g.add(cruz);
    g.add(caja(0.1, 0.3, 0.1, P.vigaOsc, 0, cp.punta + 0.1, -0.3));
    g.userData.cruz = cruz;
    // puerta y ventana
    g.add(caja(0.6, 0.85, 0.06, C.maderaOsc, -0.85, 0.68, 0.84));
    g.add(caja(0.72, 0.1, 0.09, adornoNivel(nivel), -0.85, 1.14, 0.85));
    g.add(ventana(0.4, 0.36, 0.06, 1.0, 1.15, 0.84));
    brillo(g, 1.0, 1.15, 1.05, 1.2, true);
    chimenea(g, 1.0, cp.arriba + 0.65, -0.9);
    barril(g, 1.8, -1.2, 0.8);
    // camas afuera (más camas con más nivel)
    for (var i = 0; i < 1 + nivel; i++) {
      var x = -1.2 + i * 0.85;
      g.add(caja(0.6, 0.18, 1.0, C.madera, x, 0.2, 1.75));
      g.add(caja(0.56, 0.08, 0.95, blanco, x, 0.33, 1.75));
      g.add(caja(0.5, 0.1, 0.25, 0x9fe0b0, x, 0.4, 1.4));
    }
    // toldo verde
    var toldo = caja(3.2, 0.06, 1.3, verde, 0, 1.3, 1.6);
    toldo.rotation.x = -0.15;
    g.add(toldo);
    [-1.5, 1.5].forEach(function (x) { g.add(cil(0.05, 0.05, 1.25, 5, C.madera, x, 0.62, 2.2)); });
    return g;
  }

  // Aserradero: cabaña de madera, sierra redonda que gira y troncos apilados
  function aserradero(nivel) {
    nivel = Math.min(3, nivel);
    var g = new THREE.Group();
    var cp = casaPiedra(g, -0.4, -0.6, 2.4, 1.7, 1.15, nivel, false);
    // portón abierto con tablones
    g.add(caja(0.85, 0.85, 0.06, 0x2a1d14, -0.4, 0.68, 0.27));
    g.add(caja(1.0, 0.1, 0.1, adornoNivel(nivel), -0.4, 1.14, 0.29));
    var hoja = caja(0.42, 0.85, 0.06, C.maderaOsc, -0.95, 0.68, 0.45); hoja.rotation.y = 0.9; g.add(hoja);
    chimenea(g, -1.15, cp.arriba + 0.6, -1.05);
    cajas(g, 1.6, -0.2, 0.4);
    antorcha(g, 0.95, 1.45, 0.45, true);
    // mesa con sierra
    g.add(caja(1.4, 0.15, 0.7, C.madera, 1.0, 0.75, 0.9));
    [-0.5, 0.5].forEach(function (x) { g.add(caja(0.1, 0.7, 0.6, C.maderaOsc, 1.0 + x, 0.35, 0.9)); });
    var sierra = cil(0.42, 0.42, 0.04, 14, C.metal, 1.0, 0.95, 0.9);
    sierra.rotation.x = Math.PI / 2;
    g.add(sierra);
    g.userData.sierra = sierra;
    sierra.userData.noFusionar = true;
    g.add(cil(0.14, 0.14, 1.2, 6, 0xa9783f, 1.0, 0.92, 0.9).rotateZ(Math.PI / 2));
    // rueda de agua al lado de la casa, con su canal
    var rueda = new THREE.Group(); rueda.position.set(0.95, 0.95, -0.75);
    rueda.add(cil(0.85, 0.85, 0.22, 16, C.maderaOsc, 0, 0, 0).rotateZ(Math.PI / 2));
    for (var pa = 0; pa < 8; pa++) { var aa = pa / 8 * Math.PI * 2; rueda.add(caja(0.3, 0.08, 0.34, C.madera, 0, Math.cos(aa) * 0.9, Math.sin(aa) * 0.9).rotateX(-aa)); }
    rueda.add(cil(0.12, 0.12, 0.5, 6, C.metalOsc, 0, 0, 0).rotateZ(Math.PI / 2));
    rueda.userData.noFusionar = true; g.add(rueda); g.userData.rueda = rueda;
    g.add(caja(0.5, 0.16, 2.2, 0x3f8fb0, 0.95, 0.06, -0.55));
    // pila de troncos (crece con el nivel)
    var n = 3 + nivel * 2;
    for (var i = 0; i < n; i++) {
      var fila = i < 3 ? 0 : i < 5 ? 1 : 2, col = i < 3 ? i : i < 5 ? i - 3 : i - 5;
      g.add(cil(0.2, 0.2, 1.6, 7, 0xa9783f, -1.3 + col * 0.42 + fila * 0.21, 0.2 + fila * 0.36, 1.35).rotateZ(Math.PI / 2).rotateY(Math.PI / 2));
    }
    // tejadito de madera sobre los troncos
    [-1.75, -0.45].forEach(function (x) { g.add(caja(0.1, 1.3, 0.1, P.viga, x, 0.65, 1.95)); });
    var tej = caja(1.6, 0.07, 1.0, rojoNivel(nivel), -1.1, 1.3, 1.5); tej.rotation.x = 0.25; g.add(tej);
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
    var roca = malla(geo('montana', function () { return new THREE.DodecahedronGeometry(1.6, 0); }), mat(0x9a948a), -0.5, 0.6, -0.8);
    roca.scale.set(1.15, 0.95, 0.95);
    g.add(roca);
    // casita de piedra del minero, pegada a la montaña
    casaPiedra(g, 1.2, -0.95, 1.1, 1.1, 0.95, nivel, true);
    g.add(caja(0.36, 0.6, 0.06, C.maderaOsc, 1.2, 0.55, -0.37));
    // entrada con portal de piedra y techito rojo
    g.add(caja(0.95, 1.05, 0.3, 0x2a2320, -0.4, 0.55, 0.6));
    [-1.0, 0.2].forEach(function (x) { g.add(caja(0.28, 1.3, 0.36, P.gris, x, 0.65, 0.72)); g.add(caja(0.34, 0.12, 0.42, P.osc, x, 0.06, 0.72)); });
    g.add(caja(1.6, 0.24, 0.44, P.claro, -0.4, 1.36, 0.72));
    var techito = malla(geo('techoMina', function () {
      var s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 0.42); s.lineTo(-0.5, 0);
      var e = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: false }); e.translate(0, 0, -0.95); e.rotateY(Math.PI / 2); return e;
    }), mat(rojoNivel(nivel)), -0.4, 1.48, 0.72);
    g.add(techito);
    tejas(g, -0.4, 1.48, 0.72, 0.5, 0.42, 1.9, nivel >= 3 ? C.oro : 0x7a2a1a, 'z2');
    // farol
    g.add(malla(geo('farol', function () { return new THREE.SphereGeometry(0.1, 6, 4); }), matLlama, 0.42, 1.05, 0.98, false));
    brillo(g, 0.42, 1.05, 1.05, 2.2);
    cajas(g, 1.55, 0.3, -0.3);
    // rieles
    [-0.65, -0.15].forEach(function (x) { g.add(caja(0.06, 0.05, 1.6, C.metalOsc, x, 0.04, 1.5)); });
    for (var k = 0; k < 4; k++) g.add(caja(0.8, 0.05, 0.12, C.maderaOsc, -0.4, 0.02, 0.9 + k * 0.4));
    // carrito con piedras
    var carro = new THREE.Group();
    carro.add(caja(0.7, 0.35, 0.5, C.maderaOsc, 0, 0.3, 0));
    carro.add(caja(0.74, 0.06, 0.54, C.metalOsc, 0, 0.47, 0));
    for (var p = 0; p < 2 + nivel; p++) carro.add(esfera(0.13, 0xb5aea3, -0.2 + (p % 3) * 0.2, 0.55, -0.1 + Math.floor(p / 3) * 0.2, 5, 4));
    [-0.25, 0.25].forEach(function (x) { [-0.18, 0.18].forEach(function (z) { var r = cil(0.1, 0.1, 0.06, 8, C.negro, x, 0.1, z); r.rotation.x = Math.PI / 2; carro.add(r); }); });
    carro.position.set(-0.4, 0, 1.7);
    g.add(carro);
    g.userData.carro = carro;
    carro.userData.noFusionar = true;
    // piedras sueltas y pico
    for (var q = 0; q < nivel + 1; q++) g.add(esfera(0.22, 0xb5aea3, 1.2 - q * 0.3, 0.15, 0.95 + q * 0.2, 5, 4));
    g.add(caja(0.05, 0.7, 0.05, C.madera, 1.25, 0.35, 0.45).rotateZ(0.5));
    g.add(caja(0.5, 0.06, 0.06, C.metal, 1.1, 0.62, 0.45).rotateZ(0.2));
    if (nivel >= 3) g.add(cono(0.2, 0.35, 4, C.oro, -0.4, 2.05, 0.72));
    roca.material = matPlano(0x9a948a);
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
    var cp = casaPiedra(g, 0.3, -0.2, 2.3, 1.9, 1.5, nivel, true);
    // torre cuadrada de los sabios con techo rojo puntiagudo
    var tx = -1.15, tz = -0.75, alto = 3.0 + nivel * 0.3;
    g.add(caja(1.1, alto, 1.1, P.gris, tx, 0.25 + alto / 2, tz));
    for (var y = 0.9; y < alto; y += 0.6) { var fr = caja(1.14, 0.05, 1.14, P.osc, tx, y, tz); fr.castShadow = false; g.add(fr); }
    g.add(caja(1.3, 0.14, 1.3, P.viga, tx, 0.25 + alto + 0.07, tz));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { g.add(caja(0.26, 0.26, 0.26, P.claro, tx + q[0] * 0.5, 0.25 + alto + 0.27, tz + q[1] * 0.5)); });
    var tc = cono(0.9, 1.3, 4, rojoNivel(nivel), tx, 0.25 + alto + 0.8, tz); tc.rotation.y = Math.PI / 4; g.add(tc);
    g.add(esfera(0.1, adornoNivel(nivel), tx, 0.25 + alto + 1.5, tz, 6, 4));
    g.add(ventana(0.3, 0.45, 0.06, tx, 0.25 + alto * 0.7, tz + 0.56));
    brillo(g, tx, 0.25 + alto * 0.7, tz + 0.8, 1.2, true);
    // telescopio asomado por la torre
    var tel = cil(0.08, 0.13, 1.1, 8, C.oro, tx + 0.65, 0.25 + alto * 0.62, tz + 0.2); tel.rotation.z = -1.0; g.add(tel);
    // ventanas en arco y puerta
    [-0.35, 1.0].forEach(function (x) { g.add(ventana(0.32, 0.5, 0.06, x, 1.2, 0.77)); brillo(g, x, 1.2, 1.0, 1.2, true); });
    g.add(caja(0.55, 0.9, 0.06, C.maderaOsc, 0.35, 0.7, 0.77));
    g.add(caja(0.68, 0.1, 0.09, adornoNivel(nivel), 0.35, 1.18, 0.78));
    antorcha(g, 1.75, 1.4, 1.0, true);
    // estandarte con un libro
    g.add(caja(0.8, 0.5, 0.05, C.telaMar, 0.35, 1.5, 0.8));
    g.add(caja(0.4, 0.26, 0.06, 0xf6f3ea, 0.35, 1.5, 0.82));
    chimenea(g, 1.1, cp.arriba + 0.6, -0.7);
    // pila de libros y pergamino afuera (más con nivel)
    for (var i = 0; i < 2 + nivel; i++) g.add(caja(0.5, 0.12, 0.35, [0xa8322a, 0x4a8a5a, 0x3a5a8a, 0xc9a040][i % 4], 1.25, 0.08 + i * 0.13, 1.3).rotateY(i * 0.3));
    g.add(cil(0.12, 0.12, 0.6, 8, 0xf3ead8, -0.9, 0.12, 1.2).rotateZ(Math.PI / 2));
    return g;
  }

  // Muralla alrededor de TODO el reino: un óvalo con una puerta donde entra el camino.
  // nivel (visual) 1 madera, 2 piedra, 3 piedra con torres de techo azul.
  // forma = { cx, cz, rx, rz, puerta (ángulo), hueco (medio ángulo) }
  function muralla(nivel, forma) {
    var g = new THREE.Group();
    var f = forma;
    var alto = nivel === 0 ? 1.05 : nivel === 1 ? 1.9 : nivel === 2 ? 2.6 : 3.3;
    var color = C.piedra;
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
      var seg = caja(largo, alto, nivel >= 1 ? 1.1 : 0.85, color, (a.x + b.x) / 2, alto / 2, (a.z + b.z) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      g.add(seg);
      if (nivel >= 1) { // talud de piedra oscura abajo: el muro "pisa" el suelo
        var zc = caja(largo, 0.6, 1.45, C.piedraOsc, (a.x + b.x) / 2, 0.3, (a.z + b.z) / 2);
        zc.rotation.y = seg.rotation.y; zc.castShadow = false; g.add(zc);
      }
      if (false) {
        if (i % 2 === 0) { var pu = cono(0.25, 0.5, 4, C.maderaOsc, (a.x + b.x) / 2, alto + 0.22, (a.z + b.z) / 2); pu.castShadow = false; g.add(pu); }
      } else {
        // dos almenas por tramo: silueta de muralla de verdad
        [-0.25, 0.25].forEach(function (u) {
          var al = caja(0.6, 0.5, 0.95, C.piedra, a.x + dx * (0.5 + u), alto + 0.25, a.z + dz * (0.5 + u));
          al.rotation.y = seg.rotation.y; g.add(al);
        });
      }
      if (i % 5 === 0 && !enPuerta(t0 - 0.2) && !enPuerta(t0 + 0.2)) torres.push({ p: a, puerta: false });
    }
    // torres grandes a los dos lados de la puerta
    torres.push({ p: punto(f.puerta - f.hueco - 0.03), puerta: true }, { p: punto(f.puerta + f.hueco + 0.03), puerta: true });
    var _fin = function () { return fusionar(g); };
    torres.forEach(function (tq) {
      var x = tq.p.x, z = tq.p.z, h = alto + (tq.puerta ? 1.8 : 1.1), r = tq.puerta ? 1.1 : 0.8;
      g.add(cil(r, r + 0.12, h, 8, C.piedra, x, h / 2, z));
      if (false) g.add(cono(r + 0.2, 0.9, 8, C.maderaOsc, x, h + 0.45, z));
      else {
        g.add(cil(r + 0.15, r + 0.15, 0.35, 8, C.piedraOsc, x, h + 0.17, z));
        for (var am = 0; am < 6; am++) { var aa = am / 6 * Math.PI * 2; g.add(caja(0.35, 0.4, 0.35, C.piedra, x + Math.cos(aa) * (r + 0.05), h + 0.55, z + Math.sin(aa) * (r + 0.05))); }
        if (tq.puerta) { antorcha(g, x + (f.cx - x) * 0.02, h - 0.4, z + r + 0.15); antorcha(g, x, h - 0.4, z - r - 0.15); }
        else if (nivel >= 1) {
          // saetera encendida mirando hacia fuera y antorcha arriba
          var ox = x - f.cx, oz = z - f.cz, ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
          g.add(ventana(0.2, 0.5, 0.2, x + ox * (r + 0.06), h * 0.6, z + oz * (r + 0.06)));
          brillo(g, x + ox * (r + 0.2), h * 0.6, z + oz * (r + 0.2), 1.1, true);
          antorcha(g, x, h + 0.55, z);
        }
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
  // ---- Forma de las tropas por rango (I = 0 ... IV = 3): cada rango cambia armadura, casco, arma y escudo ----
  var TROPA_RANGO = { espadachin: 1, guardian: 1, caballeria: 1, arquero: 1 };
  function detallesRango(tipo, r, cuerpo, cabeza, arma, izq, radioEscudo) {
    var ORO = C.oro, ACERO = 0xd6dde5, AZUL = 0x2f5fae, AZUL2 = 0x1f3f7a, CUERO = 0x7a4a26, CUERO2 = 0x5a3418, MADERA = C.madera;
    var caballero = tipo !== 'arquero';
    // RANGO I: cuero y madera (lo más sencillo)
    if (r === 0) {
      cuerpo.add(cil(0.29, 0.34, 0.32, 8, CUERO, 0, 0.58, 0));
      cuerpo.add(caja(0.08, 0.3, 0.02, CUERO2, 0, 0.6, 0.31));
      if (caballero && radioEscudo) { var d = cil(radioEscudo * 1.01, radioEscudo * 1.01, 0.02, 10, MADERA, -0.06, -0.15, 0.17); d.rotation.z = Math.PI / 2; d.rotation.y = Math.PI / 2; izq.add(d); izq.add(caja(0.03, radioEscudo * 1.8, 0.02, CUERO2, -0.06, -0.15, 0.19)); }
    }
    // RANGO II: acero, cinturón con hebilla y escudo con borde de metal
    if (r >= 1) {
      cuerpo.add(cil(0.345, 0.345, 0.07, 10, CUERO2, 0, 0.42, 0));
      cuerpo.add(caja(0.1, 0.08, 0.04, ORO, 0, 0.42, 0.34));
      if (caballero && radioEscudo) { var aro = new THREE.Mesh(new THREE.TorusGeometry(radioEscudo, 0.035, 6, 18), mat(ACERO)); aro.position.set(-0.06, -0.15, 0.16); izq.add(aro); }
    }
    // RANGO III: placas, visera, guanteletes y escudo azul con emblema
    if (r >= 2) {
      if (caballero) {
        for (var i = -1; i <= 1; i++) cabeza.add(caja(0.035, 0.18, 0.04, 0x2a2f38, i * 0.08, 0.02, 0.39));
        cabeza.add(caja(0.3, 0.035, 0.04, 0x2a2f38, 0, 0.08, 0.39));
      }
      [-1, 1].forEach(function (s) { cuerpo.add(esfera(0.1, ACERO, s * 0.33, 0.37, 0.02, 8, 6)); });
      for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; cuerpo.add(caja(0.14, 0.18, 0.03, ACERO, Math.cos(a) * 0.33, 0.27, Math.sin(a) * 0.33).rotateY(-a + Math.PI / 2)); }
      if (caballero && radioEscudo) {
        var cara = cil(radioEscudo * 0.86, radioEscudo * 0.86, 0.02, 12, AZUL, -0.06, -0.15, 0.175); cara.rotation.z = Math.PI / 2; cara.rotation.y = Math.PI / 2; izq.add(cara);
        izq.add(caja(0.04, radioEscudo * 1.3, 0.02, ORO, -0.06, -0.15, 0.19)); izq.add(caja(radioEscudo * 1.3, 0.04, 0.02, ORO, -0.06, -0.12, 0.19));
      }
    }
    // RANGO IV: premium dorado y azul, escudo grande, hombreras con púas, corona en el casco, aura
    if (r >= 3) {
      if (caballero) {
        cabeza.add(cil(0.43, 0.43, 0.09, 16, ORO, 0, 0.12, 0));
        for (var j = 0; j < 6; j++) { var b = j / 6 * Math.PI * 2; cabeza.add(cono(0.05, 0.16, 4, ORO, Math.cos(b) * 0.36, 0.22, Math.sin(b) * 0.36)); }
        var pen = cono(0.13, 0.62, 6, AZUL, 0, 0.62, -0.08); pen.rotation.x = -0.35; cabeza.add(pen);
      } else {
        cabeza.add(cil(0.4, 0.4, 0.06, 14, ORO, 0, 0.1, 0));
        var pluma = cono(0.06, 0.5, 5, 0xffffff, 0.2, 0.42, -0.12); pluma.rotation.z = -0.5; cabeza.add(pluma);
      }
      [-1, 1].forEach(function (s) {
        var hb = esfera(0.2, ORO, s * 0.35, 0.8, 0, 10, 8); hb.scale.set(1.15, 0.65, 1.15); cuerpo.add(hb);
        cuerpo.add(cono(0.05, 0.18, 4, ACERO, s * 0.42, 0.92, 0).rotateZ(-s * 0.5));
      });
      cuerpo.add(caja(0.26, 0.26, 0.03, AZUL2, 0, 0.62, 0.32));
      cuerpo.add(caja(0.16, 0.04, 0.035, ORO, 0, 0.68, 0.335)); cuerpo.add(caja(0.04, 0.16, 0.035, ORO, 0, 0.64, 0.335));
      var capa = caja(0.62, 0.78, 0.04, AZUL, 0, 0.52, -0.36); capa.rotation.x = 0.16; cuerpo.add(capa);
      cuerpo.add(caja(0.64, 0.05, 0.05, ORO, 0, 0.16, -0.42).rotateX(0.16));
      if (caballero && radioEscudo) {
        var grande = cil(radioEscudo * 1.35, radioEscudo * 1.35, 0.06, 6, AZUL2, -0.06, -0.15, 0.2); grande.rotation.z = Math.PI / 2; grande.rotation.y = Math.PI / 2; izq.add(grande);
        var borde = new THREE.Mesh(new THREE.TorusGeometry(radioEscudo * 1.33, 0.05, 6, 6), mat(ORO)); borde.position.set(-0.06, -0.15, 0.24); izq.add(borde);
        izq.add(esfera(radioEscudo * 0.32, ORO, -0.06, -0.15, 0.27, 8, 6));
      }
      var anillo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.66, 28), new THREE.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
      anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.04; anillo.userData.noFusionar = true; cuerpo.parent ? cuerpo.parent.add(anillo) : cuerpo.add(anillo);
    }
    // ARMAS por rango
    if (tipo === 'espadachin') {
      if (r >= 1) arma.add(caja(0.07, 0.16, 0.025, ACERO, 0, 0.86, 0));
      if (r >= 2) { arma.add(caja(0.02, 0.6, 0.03, AZUL, 0, 0.6, 0)); arma.add(caja(0.08, 0.16, 0.025, ACERO, 0, 1.0, 0)); }
      if (r >= 3) { arma.add(caja(0.42, 0.07, 0.08, ORO, 0, 0.08, 0)); arma.add(esfera(0.05, 0x4aa3ff, 0, 0.08, 0.05, 6, 5)); arma.add(caja(0.09, 0.2, 0.025, 0xf4f7fb, 0, 1.16, 0)); }
    }
    if (tipo === 'guardian') {
      if (r >= 1) [-1, 1].forEach(function (s) { arma.add(cono(0.04, 0.12, 4, ACERO, s * 0.13, 0.58, 0).rotateZ(-s * Math.PI / 2)); });
      if (r >= 2) { arma.add(cono(0.04, 0.14, 4, ACERO, 0, 0.74, 0)); arma.add(cil(0.04, 0.04, 0.25, 5, C.maderaOsc, 0, -0.08, 0)); }
      if (r >= 3) { arma.add(caja(0.36, 0.24, 0.24, ORO, 0, 0.6, 0)); arma.add(cono(0.05, 0.2, 4, ORO, 0, 0.82, 0)); }
    }
    if (tipo === 'caballeria') {
      if (r >= 1) arma.add(cono(0.12, 0.16, 8, ACERO, 0, 0.35, 0).rotateX(Math.PI));
      if (r >= 2) arma.add(caja(0.3, 0.22, 0.02, AZUL, 0.15, 1.18, 0));
      if (r >= 3) { arma.add(cono(0.1, 0.38, 6, ORO, 0, 1.62, 0)); arma.add(caja(0.34, 0.26, 0.02, ORO, 0.17, 1.05, 0)); }
    }
    if (tipo === 'arquero') {
      var arc = function (rad, col, z) { var a2 = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.035, 4, 12, Math.PI), mat(col)); a2.position.set(0, 0.05, 0.05 + (z || 0)); a2.rotation.set(0, Math.PI / 2, Math.PI / 2); arma.add(a2); };
      if (r >= 1) { [-1, 1].forEach(function (s) { var hc = esfera(0.14, CUERO, s * 0.33, 0.78, 0, 8, 6); hc.scale.set(1.1, 0.55, 1.1); cuerpo.add(hc); }); for (var f = 0; f < 3; f++) cuerpo.add(cil(0.012, 0.012, 0.3, 4, MADERA, -0.18 + f * 0.05, 0.92, -0.3)); }
      if (r >= 2) { arc(0.44, 0x5a3418, 0.01); cuerpo.add(cil(0.25, 0.3, 0.26, 8, ACERO, 0, 0.62, 0.05)); }
      if (r >= 3) { arc(0.5, ORO, 0.02); var cp2 = caja(0.58, 0.72, 0.04, 0x2a6a34, 0, 0.52, -0.35); cp2.rotation.x = 0.16; cuerpo.add(cp2); }
    }
  }
  var FAMILIA_TROPA = { explorador: ['arquero', 0.88, 0x9fd46a], miliciano: ['espadachin', 0.9, 0xc9a06a], jinete: ['caballeria', 0.92, 0x7fd0ff], caballeria_pesada: ['caballeria', 1.1, 0xb0302a] };
  var ASEDIO = { balista: 1, ariete: 1, catapulta: 1, torre_asedio: 1 };
  function unidad(tipo, tam, armadura, look) {
    if (tipo === 'heroe' && look) return heroeModelo(look, tam);
    if (FAMILIA_TROPA[tipo]) {
      var fam = FAMILIA_TROPA[tipo], u0 = unidad(fam[0], tam, tipo === 'caballeria_pesada' ? 3 : 0);
      u0.grupo.scale.multiplyScalar(fam[1]); u0.escala *= fam[1];
      var aroF = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 24), new THREE.MeshBasicMaterial({ color: fam[2], transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false }));
      aroF.rotation.x = -Math.PI / 2; aroF.position.y = 0.035; u0.grupo.add(aroF);
      return u0;
    }
    if (ASEDIO[tipo]) return maquinaAsedio(tipo, tam);
    var tipoFig = tipo; if (tipo === 'aldeana' || tipo === 'anciano' || tipo === 'nino') tipo = 'aldeano';
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
    if (look) { ropa = look.ropa; ropa2 = look.ropa2; if (look.piel) piel = look.piel; escala = 1.3; }
    var esCaballero = tipo === 'espadachin' || tipo === 'guardian' || (tipo === 'heroe' && (!look || look.sombrero === 'casco')) || tipo === 'caballeria';
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
    if (tipo !== 'trasgo' && tipo !== 'bruto' && tipo !== 'ogro' && tipo !== 'aldeano' && (tipo !== 'arquero' || armadura > 0) && (!look || look.sombrero === 'casco'))
      cuerpo.add(cil(0.22, 0.28, 0.3, 8, armadura >= 2 ? colArm : C.metal, 0, 0.62, 0.06).rotateX(0.05));
    // hombreras desde el nivel 1 de armadura; capa desde el nivel 3
    if (armadura >= 1) {
      [-1, 1].forEach(function (s) { var h = esfera(0.16, colArm, s * 0.33, 0.78, 0, 8, 6); h.scale.set(1.1, 0.6, 1.1); cuerpo.add(h); });
      if (armadura >= 2) cuerpo.add(cil(0.34, 0.34, 0.06, 8, colArm, 0, 0.41, 0));
      if (armadura >= 3) { var cp = caja(0.55, 0.7, 0.04, ropa, 0, 0.55, -0.33); cp.rotation.x = 0.15; cuerpo.add(cp); cuerpo.add(cil(0.3, 0.37, 0.2, 8, colArm, 0, 0.36, 0)); }
    }
    // cabeza
    var cabeza = new THREE.Group();
    cabeza.position.y = 1.08;
    cabeza.add(esfera(0.38, piel, 0, 0, 0, 14, 10));
    ojos(cabeza, 0, 0.34, 0.13, (tipo === 'trasgo' || tipo === 'bruto' || tipo === 'ogro') ? 0x8a1010 : C.negro);
    cabeza.add(esfera(0.06, 0xffa090, -0.22, -0.1, 0.28, 5, 4));
    cabeza.add(esfera(0.06, 0xffa090, 0.22, -0.1, 0.28, 5, 4));
    if (tipo !== 'trasgo' && tipo !== 'bruto' && tipo !== 'ogro') {
      var narizT = cono(0.035, 0.08, 6, 0xe8a882, 0, -0.02, 0.36); narizT.rotation.x = Math.PI / 2; cabeza.add(narizT);
      cabeza.add(caja(0.09, 0.016, 0.012, 0xa84848, 0, -0.16, 0.34));
      [-1, 1].forEach(function (s) { var cejaT = caja(0.09, 0.02, 0.02, 0x3a2a20, s * 0.13, 0.12, 0.35); cejaT.rotation.z = -s * 0.1; cabeza.add(cejaT); });
    }
    cuerpo.add(cabeza);
    p.cabeza = cabeza;

    if (look) accesoriosHeroe(cabeza, cuerpo, look);
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
    if (look && look.arma !== 'espada') {
      armaHeroe(arma, cuerpo, look);
    } else if (tipo === 'espadachin' || tipo === 'heroe') {
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
    if (esCaballero || (look && look.escudo)) {
      var r = tipo === 'guardian' || (look && look.escudo) ? 0.42 : 0.28;
      var escudo = cil(r, r, 0.07, 10, look && look.escudo ? look.escudo : tipo === 'heroe' ? C.oro : C.azul, -0.06, -0.15, 0.12);
      escudo.rotation.z = Math.PI / 2;
      escudo.rotation.y = Math.PI / 2;
      izq.add(escudo);
      izq.add(esfera(r * 0.3, tipo === 'heroe' ? C.rojo : C.oro, -0.06, -0.15, 0.17, 6, 4));
      izq.rotation.y = -0.5;
    }
    cuerpo.add(izq);
    p.izq = izq;
    if (TROPA_RANGO[tipo] && !look) { detallesRango(tipo, armadura, cuerpo, cabeza, arma, izq, esCaballero ? (tipo === 'guardian' ? 0.42 : 0.28) : 0); p.respira = true; if (armadura >= 3) escala *= 1.07; }

    // capa del héroe
    if (tipo === 'heroe' && (!look || look.capa)) {
      var capa = caja(0.6, 0.75, 0.04, look ? look.capa : C.rojo, 0, 0.55, -0.34);
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
      if (armadura === 1) caballo.add(caja(0.7, 0.04, 0.64, C.oro, 0, 1.0, -0.05));
      if (armadura >= 2) [-1, 1].forEach(function (s) { caballo.add(caja(0.05, 0.38, 1.0, colArm, s * 0.34, 0.82, -0.05)); });
      if (armadura >= 3) { caballo.add(caja(0.34, 0.32, 0.4, C.oro, 0, 1.42, 0.82)); caballo.add(cono(0.08, 0.4, 5, 0x2f5fae, 0, 1.72, 0.7)); [-1, 1].forEach(function (s) { caballo.add(caja(0.06, 0.06, 1.02, C.oro, s * 0.36, 1.0, -0.05)); }); }
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
    if (FIGURA_TROPA[tipoFig] && !look && !(figListas[FIGURA_TROPA[tipoFig]] && figListas[FIGURA_TROPA[tipoFig]].esperaAnim)) ponerFiguraTropa(tipoFig, g, cuerpo, p, armadura);
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.renderOrder = 1;
    if (tipo === 'caballeria') blob.scale.set(1.3, 2.4, 1);
    g.add(blob);
    escala *= (tam || TAM_UNIDAD);
    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala, baseY: baseY };
  }

  // ---- piezas de los héroes: pelo, barba, sombreros y armas ----
  function accesoriosHeroe(cabeza, cuerpo, k) {
    var pe = k.pelo;
    if (pe !== undefined && k.peinado !== 'calvo') {
      cabeza.add(malla(geo('peloCap', function () { return new THREE.SphereGeometry(0.405, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42); }), mat(pe), 0, 0.03, -0.02));
      if (k.peinado === 'largo') { cabeza.add(caja(0.66, 0.6, 0.18, pe, 0, -0.18, -0.28)); [-1, 1].forEach(function (s) { cabeza.add(caja(0.12, 0.45, 0.2, pe, s * 0.36, -0.15, -0.05)); }); }
      if (k.peinado === 'trenza') { cabeza.add(caja(0.6, 0.3, 0.14, pe, 0, 0.0, -0.3)); for (var i = 0; i < 4; i++) cabeza.add(esfera(0.1 - i * 0.012, pe, 0.3, -0.18 - i * 0.16, -0.22 + i * 0.03, 6, 5)); }
      if (k.peinado === 'mono') cabeza.add(esfera(0.17, pe, 0, 0.36, -0.2, 8, 6));
      if (k.peinado === 'corto') [-1, 1].forEach(function (s) { cabeza.add(caja(0.1, 0.22, 0.24, pe, s * 0.37, -0.02, -0.04)); });
    }
    if (k.barba !== undefined) {
      var b = esfera(0.3, k.barba, 0, -0.24, 0.14, 10, 8); b.scale.set(1.05, 0.95, 0.7); cabeza.add(b);
      cabeza.add(caja(0.34, 0.07, 0.1, k.barba, 0, -0.1, 0.34));
    }
    if (k.sombrero === 'bruja') {
      cabeza.add(cil(0.62, 0.62, 0.04, 14, k.ropa2, 0, 0.26, 0));
      var pico = cono(0.33, 0.8, 10, k.ropa, 0, 0.66, -0.06); pico.rotation.x = -0.25; cabeza.add(pico);
      cabeza.add(cil(0.34, 0.34, 0.07, 12, C.oro, 0, 0.32, 0));
    }
    if (k.sombrero === 'tricornio') {
      var tc = cil(0.6, 0.6, 0.12, 3, 0x1a1614, 0, 0.3, 0); tc.rotation.y = Math.PI / 6; cabeza.add(tc);
      cabeza.add(cil(0.34, 0.38, 0.26, 10, 0x1a1614, 0, 0.44, 0));
      cabeza.add(esfera(0.07, C.blanco, 0, 0.42, 0.36, 6, 4));
      cabeza.add(cil(0.39, 0.39, 0.04, 10, C.oro, 0, 0.36, 0));
    }
    if (k.sombrero === 'gafas') {
      cabeza.add(cil(0.41, 0.41, 0.07, 14, 0x5a3a20, 0, 0.2, 0));
      [-1, 1].forEach(function (s) {
        var ar = cil(0.11, 0.11, 0.08, 10, 0xc9a040, s * 0.14, 0.24, 0.34); ar.rotation.x = Math.PI / 2 - 0.3; cabeza.add(ar);
        var vi = cil(0.08, 0.08, 0.09, 10, 0x7fd0f0, s * 0.14, 0.24, 0.35); vi.rotation.x = Math.PI / 2 - 0.3; cabeza.add(vi);
      });
    }
    if (k.sombrero === 'capucha') {
      cabeza.add(malla(geo('capuchaH', function () { return new THREE.SphereGeometry(0.44, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6); }), mat(k.ropa), 0, 0.01, -0.04));
      cabeza.add(cono(0.16, 0.36, 6, k.ropa, 0, 0.28, -0.28).rotateX(-1.0));
    }
    if (k.sombrero === 'panuelo') {
      cabeza.add(malla(geo('panuelo', function () { return new THREE.SphereGeometry(0.41, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.32); }), mat(0x8a96a6), 0, 0.04, 0));
      cabeza.add(caja(0.08, 0.2, 0.12, 0x8a96a6, 0.1, 0.05, -0.42).rotateZ(0.5));
    }
  }
  function armaHeroe(arma, cuerpo, k) {
    if (k.arma === 'arco') {
      var arco = malla(geo('arco', function () { return new THREE.TorusGeometry(0.34, 0.03, 4, 10, Math.PI); }), mat(C.madera), 0, 0.05, 0.05);
      arco.rotation.set(0, Math.PI / 2, Math.PI / 2); arma.add(arco);
      cuerpo.add(cil(0.08, 0.08, 0.45, 6, C.cuero, -0.12, 0.65, -0.3).rotateZ(0.4));
      return;
    }
    if (k.arma === 'varita' || k.arma === 'baston') {
      var lg = k.arma === 'baston' ? 1.2 : 0.6;
      arma.add(cil(0.03, 0.04, lg, 6, k.arma === 'baston' ? C.madera : 0x2a2030, 0, lg / 2, 0));
      var gema = malla(geo('gemaHeroe' + k.arma, function () { return new THREE.OctahedronGeometry(k.arma === 'baston' ? 0.13 : 0.09, 0); }),
        new THREE.MeshBasicMaterial({ color: k.arma === 'baston' ? 0x7fe39a : 0xc79bff }), 0, lg + 0.06, 0, false);
      arma.add(gema);
      arma.rotation.x = 0.4;
      return;
    }
    if (k.arma === 'sable') {
      var hoja = caja(0.06, 0.8, 0.025, C.metal, 0.04, 0.5, 0); hoja.rotation.z = -0.12; arma.add(hoja);
      arma.add(cil(0.1, 0.1, 0.04, 8, C.oro, 0, 0.1, 0));
      arma.add(caja(0.05, 0.12, 0.05, C.maderaOsc, 0, 0.02, 0));
      arma.rotation.x = 1.3; return;
    }
    if (k.arma === 'martillo') {
      arma.add(cil(0.035, 0.035, 0.7, 6, C.madera, 0, 0.32, 0));
      arma.add(caja(0.34, 0.2, 0.2, 0x8d99a6, 0, 0.68, 0));
      arma.add(caja(0.08, 0.22, 0.22, 0xc9a040, 0.18, 0.68, 0));
      arma.rotation.x = 1.25; return;
    }
    // hachas
    var doble = k.arma === 'hacha2';
    arma.add(cil(0.035, 0.035, 0.8, 6, C.maderaOsc, 0, 0.36, 0));
    arma.add(caja(0.05, 0.3, 0.3, C.metal, 0, 0.68, 0.14));
    if (doble) arma.add(caja(0.05, 0.3, 0.3, C.metal, 0, 0.68, -0.14));
    arma.rotation.x = 1.2;
  }

  // =================================================================
  //  HÉROES CON DETALLE: más altos que las tropas, cara completa y ropa por capas.
  //  Tiene las mismas piezas que las tropas (piernas, brazos, cabeza) para animarse igual.
  // =================================================================
  // Color de la armadura según el nivel del héroe: bronce (1-9), plata (10-24), oro (25+)
  var ARMADURA_HEROE = [0xb87333, 0xd6dde5, 0xf5c542];
  var COLOR_RAREZA = { comun: 0x4aa3ff, raro: 0xb07cff, legendario: 0xffc93a };
  function tierHeroe(nivel) { return (nivel || 1) >= 25 ? 2 : (nivel || 1) >= 10 ? 1 : 0; }
  function heroeModelo(k, tam, nivel, rareza) {
    var g = new THREE.Group(), cuerpo = new THREE.Group(), p = {};
    g.add(cuerpo);
    var tier = tierHeroe(nivel), metalN = ARMADURA_HEROE[tier];
    var piel = k.piel || C.piel, pielOsc = 0xe8a882, borde = metalN, cuero = 0x5a3418, bota = 0x4a2e1a;
    var esCasco = k.sombrero === 'casco';
    // ---- piernas: pantalón y botas ----
    [-1, 1].forEach(function (s) {
      var pv = new THREE.Group(); pv.position.set(s * 0.1, 0.78, 0);
      pv.add(cil(0.088, 0.072, 0.6, 10, k.ropa2, 0, -0.32, 0));
      pv.add(cil(0.092, 0.092, 0.06, 10, 0x6a4228, 0, -0.56, 0));
      pv.add(caja(0.15, 0.2, 0.25, bota, 0, -0.68, 0.03));
      pv.add(caja(0.16, 0.04, 0.27, 0x2a1c12, 0, -0.77, 0.035));
      cuerpo.add(pv); p[s < 0 ? 'piernaI' : 'piernaD'] = pv;
    });
    // ---- túnica, cinturón y torso ----
    cuerpo.add(cil(0.2, 0.28, 0.34, 14, k.ropa, 0, 0.8, 0));
    cuerpo.add(cil(0.285, 0.285, 0.035, 14, borde, 0, 0.64, 0));
    cuerpo.add(cil(0.208, 0.208, 0.075, 14, cuero, 0, 0.98, 0));
    cuerpo.add(caja(0.08, 0.065, 0.025, C.oro, 0, 0.98, 0.21));
    cuerpo.add(caja(0.1, 0.11, 0.07, cuero, -0.16, 0.9, 0.16));
    cuerpo.add(cil(0.24, 0.2, 0.44, 14, k.ropa, 0, 1.22, 0));
    cuerpo.add(cil(0.155, 0.17, 0.035, 14, borde, 0, 1.43, 0));
    // cuello de la túnica en V con borde
    [-1, 1].forEach(function (s) { var v = caja(0.035, 0.22, 0.02, borde, s * 0.05, 1.33, 0.215); v.rotation.z = s * 0.35; cuerpo.add(v); });
    if (esCasco) { // pechera de oro del caballero
      cuerpo.add(cil(0.22, 0.25, 0.3, 14, C.oro, 0, 1.2, 0.02));
      cuerpo.add(cil(0.255, 0.255, 0.04, 14, 0xb8862a, 0, 1.05, 0.02));
    }
    // hombreras de metal (cambian de color con el nivel) y correa cruzada
    [-1, 1].forEach(function (s) {
      var h = esfera(0.14, esCasco ? C.oro : metalN, s * 0.25, 1.38, 0, 14, 8); h.scale.set(1.15, 0.65, 1.1); cuerpo.add(h);
      var rb = esfera(0.145, esCasco ? 0xb8862a : (tier === 2 ? 0xb8862a : 0x6a5a4a), s * 0.25, 1.355, 0, 14, 8); rb.scale.set(1.17, 0.18, 1.12); cuerpo.add(rb);
    });
    if (!esCasco) { var corr = caja(0.06, 0.62, 0.03, cuero, 0, 1.2, 0.2); corr.rotation.z = 0.62; cuerpo.add(corr); cuerpo.add(caja(0.07, 0.07, 0.035, metalN, 0.07, 1.26, 0.215)); }
    cuerpo.add(cil(0.065, 0.075, 0.12, 10, piel, 0, 1.47, 0));
    // capa
    if (k.capa) {
      var capa = caja(0.52, 0.98, 0.03, k.capa, 0, 0.95, -0.25); capa.rotation.x = 0.13; cuerpo.add(capa);
      cuerpo.add(caja(0.5, 0.09, 0.14, k.capa, 0, 1.42, -0.15));
      cuerpo.add(caja(0.54, 0.04, 0.04, borde, 0, 0.47, -0.31));
    }
    // carcaj de flechas a la espalda
    if (k.arma === 'arco') {
      var cj = cil(0.065, 0.06, 0.46, 8, cuero, 0.1, 1.2, -0.25); cj.rotation.z = 0.35; cuerpo.add(cj);
      for (var fl = 0; fl < 3; fl++) cuerpo.add(caja(0.03, 0.12, 0.03, 0xf0eee8, 0.18 + fl * 0.03, 1.47, -0.25 + fl * 0.02));
    }
    // ---- cabeza con cara completa ----
    var cab = new THREE.Group(); cab.position.y = 1.7;
    var craneo = esfera(0.245, piel, 0, 0, 0, 18, 14); craneo.scale.set(0.95, 1.05, 0.98); cab.add(craneo);
    cab.scale.setScalar(1.12);
    var menton = esfera(0.19, piel, 0, -0.08, 0.04, 14, 10); menton.scale.set(1, 0.8, 1); cab.add(menton);
    [-1, 1].forEach(function (s) {
      var oreja = esfera(0.055, piel, s * 0.235, -0.01, 0, 8, 6); oreja.scale.set(0.5, 1, 0.8); cab.add(oreja);
      // ojo: blanco, iris de color, pupila y brillo
      var blanco = esfera(0.048, 0xffffff, s * 0.085, 0.015, 0.2, 12, 8); blanco.scale.set(1, 1.1, 0.55); cab.add(blanco);
      cab.add(esfera(0.031, k.ojos || 0x3a5a7a, s * 0.085, 0.012, 0.222, 10, 8));
      cab.add(esfera(0.016, 0x101010, s * 0.085, 0.012, 0.236, 8, 6));
      cab.add(esfera(0.007, 0xffffff, s * 0.085 + 0.01, 0.025, 0.244, 4, 3));
      var ceja = caja(0.08, 0.018, 0.02, k.pelo !== undefined ? k.pelo : 0x5a3a20, s * 0.088, 0.085, 0.215); ceja.rotation.z = -s * 0.12; cab.add(ceja);
      cab.add(esfera(0.035, 0xf2a094, s * 0.13, -0.06, 0.18, 6, 5));
    });
    var nariz = cono(0.03, 0.075, 8, pielOsc, 0, -0.025, 0.245); nariz.rotation.x = Math.PI / 2; cab.add(nariz);
    var boca = caja(0.075, 0.014, 0.012, 0xa84848, 0, -0.105, 0.208); cab.add(boca);
    [-1, 1].forEach(function (s) { var comi = caja(0.02, 0.012, 0.012, 0xa84848, s * 0.042, -0.098, 0.205); comi.rotation.z = s * 0.5; cab.add(comi); });
    // pelo, barba y sombreros (las mismas piezas de antes, a la medida de esta cabeza)
    var adorno = new THREE.Group(); adorno.scale.setScalar(0.64); adorno.position.y = 0.01; cab.add(adorno);
    accesoriosHeroe(adorno, cuerpo, k);
    if (esCasco) {
      adorno.add(malla(geo('cascoH', function () { return new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); }), mat(C.oro), 0, 0.04, 0));
      adorno.add(cil(0.43, 0.43, 0.08, 16, 0xb8862a, 0, 0.05, 0));
      adorno.add(caja(0.06, 0.3, 0.06, 0xb8862a, 0, -0.02, 0.42));
      for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; adorno.add(cono(0.07, 0.22, 4, C.oro, Math.cos(a) * 0.3, 0.44, Math.sin(a) * 0.3)); }
      [-1, 1].forEach(function (s) { var ala = caja(0.05, 0.32, 0.24, C.blanco, s * 0.44, 0.22, -0.05); ala.rotation.z = -s * 0.4; adorno.add(ala); });
    }
    cuerpo.add(cab); p.cabeza = cab;
    // ---- brazo derecho con arma ----
    var falso = new THREE.Group();
    var br = new THREE.Group(); br.position.set(0.3, 1.36, 0);
    br.add(cil(0.068, 0.056, 0.42, 10, k.ropa, 0, -0.2, 0));
    br.add(cil(0.064, 0.06, 0.13, 10, esCasco ? C.oro : metalN, 0, -0.34, 0));
    br.add(esfera(0.062, piel, 0, -0.45, 0, 10, 8));
    var arma = new THREE.Group(); arma.position.set(0, -0.45, 0.04); arma.scale.setScalar(0.9);
    if (k.arma === 'espada') {
      arma.add(caja(0.075, 1.0, 0.025, C.metal, 0, 0.6, 0));
      arma.add(cono(0.045, 0.1, 4, C.metal, 0, 1.15, 0));
      arma.add(caja(0.3, 0.055, 0.07, C.oro, 0, 0.1, 0));
      arma.add(caja(0.05, 0.14, 0.05, cuero, 0, 0.01, 0));
      arma.add(esfera(0.04, C.oro, 0, -0.07, 0, 6, 5));
      arma.rotation.x = 1.3;
    } else armaHeroe(arma, falso, k);
    br.add(arma); cuerpo.add(br); p.brazo = br;
    // ---- brazo izquierdo (con escudo si tiene) ----
    var iz = new THREE.Group(); iz.position.set(-0.3, 1.36, 0);
    iz.add(cil(0.068, 0.056, 0.42, 10, k.ropa, 0, -0.2, 0));
    iz.add(cil(0.064, 0.06, 0.13, 10, esCasco ? C.oro : metalN, 0, -0.34, 0));
    iz.add(esfera(0.062, piel, 0, -0.45, 0, 10, 8));
    if (esCasco || k.escudo) {
      var colE = k.escudo || C.oro;
      var esc = cil(0.3, 0.3, 0.06, 16, colE, -0.07, -0.34, 0.12); esc.rotation.z = Math.PI / 2; esc.rotation.y = Math.PI / 2; iz.add(esc);
      var aro = cil(0.31, 0.31, 0.04, 16, esCasco ? 0xb8862a : C.metalOsc, -0.07, -0.34, 0.11); aro.rotation.z = Math.PI / 2; aro.rotation.y = Math.PI / 2; iz.add(aro);
      var estrella = malla(geo('estrellaEscudo', function () {
        var sh = new THREE.Shape();
        for (var e = 0; e < 10; e++) { var an = e / 10 * Math.PI * 2 - Math.PI / 2, rr = e % 2 ? 0.07 : 0.16; if (e) sh.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else sh.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
        var ge = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }); ge.rotateY(-Math.PI / 2); return ge;
      }), mat(esCasco ? C.rojo : metalN), -0.11, -0.34, 0.12);
      iz.add(estrella);
      iz.rotation.y = -0.5;
    }
    cuerpo.add(iz); p.izq = iz;
    [cuerpo, cab, br, iz, arma, p.piernaI, p.piernaD].forEach(function (gr) { fusionar(gr, true); });
    contorno(g);
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.renderOrder = 1; blob.scale.setScalar(1.15);
    g.add(blob);
    if (rareza) { // aro de color bajo los pies según la rareza
      var aroR = new THREE.Mesh(geo('aroRareza', function () { return new THREE.RingGeometry(0.5, 0.62, 32); }), new THREE.MeshBasicMaterial({ color: COLOR_RAREZA[rareza], transparent: true, opacity: 0.55, depthWrite: false }));
      aroR.rotation.x = -Math.PI / 2; aroR.position.y = 0.04; aroR.renderOrder = 1; g.add(aroR);
    }
    p.respira = true;
    var escala = 1.3 * (tam || TAM_UNIDAD);
    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala, baseY: 0, alto: 2.2 * escala, cabezaY: 1.7, tier: tier };
  }
  // =====================================================================
  //  HÉROES MEJORADOS (parche de Muse para Maikel): la armadura cambia por etapas
  // =====================================================================
  // Tamaño del héroe (antes 1.3). Si se solapan en formación, bajar a 1.35.
  var HEROE_TAM = 1.45;
  // Etapa de armadura por nivel: la armadura CAMBIA mientras mejora.
  //   0 = nivel 1-4:  tela, cinturón y hombreras chicas
  //   1 = nivel 5-9:  hombreras más grandes
  //   2 = nivel 10-19: pechera de metal + borde en hombreras
  //   3 = nivel 20-29: capa con borde + grebas + cresta más alta
  //   4 = nivel 30+: emblema en el pecho + escudo grande + alas/cresta grandes
  // El COLOR sigue siendo el de siempre: bronce (1-9), plata (10-24), oro (25+).
  function etapaArmadura(nivel) {
    nivel = nivel || 1;
    if (nivel >= 30) return 4;
    if (nivel >= 20) return 3;
    if (nivel >= 10) return 2;
    if (nivel >= 5) return 1;
    return 0;
  }

  function heroeModelo2(k, tam, nivel, rareza) {
    var g = new THREE.Group(), cuerpo = new THREE.Group(), p = {};
    g.add(cuerpo);
    var tier = tierHeroe(nivel), etapa = etapaArmadura(nivel), metalN = ARMADURA_HEROE[tier];
    var piel = k.piel || C.piel, pielOsc = 0xe8a882, borde = metalN, cuero = 0x5a3418, bota = 0x4a2e1a;
    var esCasco = k.sombrero === 'casco';
    // ---- piernas: pantalón, botas y grebas desde la etapa 3 ----
    [-1, 1].forEach(function (s) {
      var pv = new THREE.Group(); pv.position.set(s * 0.1, 0.78, 0);
      pv.add(cil(0.088, 0.072, 0.6, 10, k.ropa2, 0, -0.32, 0));
      pv.add(cil(0.092, 0.092, 0.06, 10, 0x6a4228, 0, -0.56, 0));
      pv.add(caja(0.15, 0.2, 0.25, bota, 0, -0.68, 0.03));
      pv.add(caja(0.16, 0.04, 0.27, 0x2a1c12, 0, -0.77, 0.035));
      if (etapa >= 3) pv.add(cil(0.095, 0.085, 0.3, 10, metalN, 0, -0.42, 0)); // greba
      cuerpo.add(pv); p[s < 0 ? 'piernaI' : 'piernaD'] = pv;
    });
    // ---- túnica, cinturón y torso ----
    cuerpo.add(cil(0.2, 0.28, 0.34, 14, k.ropa, 0, 0.8, 0));
    cuerpo.add(cil(0.285, 0.285, 0.035, 14, borde, 0, 0.64, 0));
    cuerpo.add(cil(0.208, 0.208, 0.075, 14, cuero, 0, 0.98, 0));
    cuerpo.add(caja(0.08, 0.065, 0.025, C.oro, 0, 0.98, 0.21));
    cuerpo.add(caja(0.1, 0.11, 0.07, cuero, -0.16, 0.9, 0.16));
    cuerpo.add(cil(0.24, 0.2, 0.44, 14, k.ropa, 0, 1.22, 0));
    cuerpo.add(cil(0.155, 0.17, 0.035, 14, borde, 0, 1.43, 0));
    // cuello de la túnica en V con borde
    [-1, 1].forEach(function (s) { var v = caja(0.035, 0.22, 0.02, borde, s * 0.05, 1.33, 0.215); v.rotation.z = s * 0.35; cuerpo.add(v); });
    // pechera: oro para el caballero, metal del nivel para el resto (desde etapa 2)
    if (esCasco || etapa >= 2) {
      var colP = esCasco ? C.oro : metalN, rP = 0.22 + etapa * 0.008;
      cuerpo.add(cil(rP, rP + 0.03, 0.3, 14, colP, 0, 1.2, 0.02));
      cuerpo.add(cil(rP + 0.035, rP + 0.035, 0.04, 14, esCasco ? 0xb8862a : metalN, 0, 1.05, 0.02));
    }
    // hombreras: crecen con la etapa; el borde aparece en la etapa 2
    var rH = 0.13 + etapa * 0.014;
    [-1, 1].forEach(function (s) {
      var h = esfera(rH, esCasco ? C.oro : metalN, s * 0.25, 1.38, 0, 14, 8); h.scale.set(1.15, 0.65, 1.1); cuerpo.add(h);
      if (etapa >= 2) { var rb = esfera(rH + 0.005, esCasco ? 0xb8862a : (tier === 2 ? 0xb8862a : 0x6a5a4a), s * 0.25, 1.355, 0, 14, 8); rb.scale.set(1.17, 0.18, 1.12); cuerpo.add(rb); }
    });
    if (!esCasco) { var corr = caja(0.06, 0.62, 0.03, cuero, 0, 1.2, 0.2); corr.rotation.z = 0.62; cuerpo.add(corr); cuerpo.add(caja(0.07, 0.07, 0.035, metalN, 0.07, 1.26, 0.215)); }
    cuerpo.add(cil(0.065, 0.075, 0.12, 10, piel, 0, 1.47, 0));
    // emblema en el pecho desde la etapa 4
    if (etapa >= 4) {
      var emb = cil(0.09, 0.09, 0.03, 12, metalN, 0, 1.25, 0.215); emb.rotation.x = Math.PI / 2; cuerpo.add(emb);
      cuerpo.add(esfera(0.035, C.oro, 0, 1.25, 0.235, 8, 6));
    }
    // capa: más larga con la etapa, borde en la etapa 3, broches en los hombros
    if (k.capa) {
      var hC = 0.95 + etapa * 0.07;
      var capa = caja(0.52, hC, 0.03, k.capa, 0, 1.42 - hC / 2, -0.25); capa.rotation.x = 0.13; cuerpo.add(capa);
      cuerpo.add(caja(0.5, 0.09, 0.14, k.capa, 0, 1.42, -0.15));
      if (etapa >= 3) cuerpo.add(caja(0.54, 0.04, 0.04, borde, 0, 1.42 - hC + 0.02, -0.32));
      [-1, 1].forEach(function (s) { cuerpo.add(esfera(0.04, C.oro, s * 0.18, 1.42, 0.19, 8, 6)); });
    }
    // carcaj de flechas a la espalda
    if (k.arma === 'arco') {
      var cj = cil(0.065, 0.06, 0.46, 8, cuero, 0.1, 1.2, -0.25); cj.rotation.z = 0.35; cuerpo.add(cj);
      for (var fl = 0; fl < 3; fl++) cuerpo.add(caja(0.03, 0.12, 0.03, 0xf0eee8, 0.18 + fl * 0.03, 1.47, -0.25 + fl * 0.02));
    }
    // ---- cabeza con cara completa: cabeza más grande, ojos más grandes y sonrisa ----
    var cab = new THREE.Group(); cab.position.y = 1.7;
    var craneo = esfera(0.245, piel, 0, 0, 0, 18, 14); craneo.scale.set(0.95, 1.05, 0.98); cab.add(craneo);
    cab.scale.setScalar(1.2);
    var menton = esfera(0.19, piel, 0, -0.08, 0.04, 14, 10); menton.scale.set(1, 0.8, 1); cab.add(menton);
    [-1, 1].forEach(function (s) {
      var oreja = esfera(0.055, piel, s * 0.235, -0.01, 0, 8, 6); oreja.scale.set(0.5, 1, 0.8); cab.add(oreja);
      // ojo: blanco, iris de color, pupila y brillo (más grandes que antes)
      var blanco = esfera(0.056, 0xffffff, s * 0.085, 0.015, 0.2, 12, 8); blanco.scale.set(1, 1.1, 0.55); cab.add(blanco);
      cab.add(esfera(0.037, k.ojos || 0x3a5a7a, s * 0.085, 0.012, 0.222, 10, 8));
      cab.add(esfera(0.019, 0x101010, s * 0.085, 0.012, 0.236, 8, 6));
      cab.add(esfera(0.008, 0xffffff, s * 0.085 + 0.01, 0.025, 0.244, 4, 3));
      var ceja = caja(0.09, 0.022, 0.02, k.pelo !== undefined ? k.pelo : 0x5a3a20, s * 0.088, 0.085, 0.215); ceja.rotation.z = -s * 0.12; cab.add(ceja);
      cab.add(esfera(0.035, 0xf2a094, s * 0.13, -0.06, 0.18, 6, 5));
    });
    var nariz = cono(0.03, 0.075, 8, pielOsc, 0, -0.025, 0.245); nariz.rotation.x = Math.PI / 2; cab.add(nariz);
    // sonrisa: arco en vez de raya recta
    var sonrisa = malla(geo('sonrisa2', function () { return new THREE.TorusGeometry(0.05, 0.011, 4, 10, Math.PI); }), mat(0xa84848), 0, -0.095, 0.21);
    sonrisa.rotation.z = Math.PI; cab.add(sonrisa);
    // pelo, barba y sombreros (las mismas piezas de antes, a la medida de esta cabeza)
    var adorno = new THREE.Group(); adorno.scale.setScalar(0.68); adorno.position.y = 0.01; cab.add(adorno);
    accesoriosHeroe(adorno, cuerpo, k);
    if (esCasco) {
      adorno.add(malla(geo('cascoH', function () { return new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); }), mat(C.oro), 0, 0.04, 0));
      adorno.add(cil(0.43, 0.43, 0.08, 16, 0xb8862a, 0, 0.05, 0));
      adorno.add(caja(0.06, 0.3, 0.06, 0xb8862a, 0, -0.02, 0.42));
      var altCresta = 0.22 + etapa * 0.04; // la cresta crece con la armadura
      for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; adorno.add(cono(0.07, altCresta, 4, C.oro, Math.cos(a) * 0.3, 0.44, Math.sin(a) * 0.3)); }
      var larAla = 0.32 + etapa * 0.02; // las alas del casco crecen con la armadura
      [-1, 1].forEach(function (s) { var ala = caja(0.05, larAla, 0.24, C.blanco, s * 0.44, 0.22, -0.05); ala.rotation.z = -s * 0.4; adorno.add(ala); });
    }
    cuerpo.add(cab); p.cabeza = cab;
    // ---- brazo derecho con arma ----
    var falso = new THREE.Group();
    var br = new THREE.Group(); br.position.set(0.3, 1.36, 0);
    br.add(cil(0.068, 0.056, 0.42, 10, k.ropa, 0, -0.2, 0));
    br.add(cil(0.064, 0.06, 0.13, 10, esCasco ? C.oro : metalN, 0, -0.34, 0));
    br.add(esfera(0.062, piel, 0, -0.45, 0, 10, 8));
    var arma = new THREE.Group(); arma.position.set(0, -0.45, 0.04); arma.scale.setScalar(0.9);
    if (k.arma === 'espada') {
      var larEsp = 1.0 + etapa * 0.05; // la espada crece con la armadura
      arma.add(caja(0.075, larEsp, 0.025, C.metal, 0, 0.6 + (larEsp - 1.0) / 2, 0));
      arma.add(cono(0.045, 0.1, 4, C.metal, 0, 1.15 + (larEsp - 1.0), 0));
      arma.add(caja(0.3, 0.055, 0.07, C.oro, 0, 0.1, 0));
      arma.add(caja(0.05, 0.14, 0.05, cuero, 0, 0.01, 0));
      arma.add(esfera(0.04, C.oro, 0, -0.07, 0, 6, 5));
      arma.rotation.x = 1.3;
    } else armaHeroe(arma, falso, k);
    br.add(arma); cuerpo.add(br); p.brazo = br;
    // ---- brazo izquierdo (con escudo si tiene: más grande con la etapa) ----
    var iz = new THREE.Group(); iz.position.set(-0.3, 1.36, 0);
    iz.add(cil(0.068, 0.056, 0.42, 10, k.ropa, 0, -0.2, 0));
    iz.add(cil(0.064, 0.06, 0.13, 10, esCasco ? C.oro : metalN, 0, -0.34, 0));
    iz.add(esfera(0.062, piel, 0, -0.45, 0, 10, 8));
    if (esCasco || k.escudo) {
      var colE = k.escudo || C.oro, rE = 0.3 + etapa * 0.02;
      var esc = cil(rE, rE, 0.06, 16, colE, -0.07, -0.34, 0.12); esc.rotation.z = Math.PI / 2; esc.rotation.y = Math.PI / 2; iz.add(esc);
      var aro = cil(rE + 0.01, rE + 0.01, 0.04, 16, esCasco ? 0xb8862a : C.metalOsc, -0.07, -0.34, 0.11); aro.rotation.z = Math.PI / 2; aro.rotation.y = Math.PI / 2; iz.add(aro);
      var estrella = malla(geo('estrellaEscudo', function () {
        var sh = new THREE.Shape();
        for (var e = 0; e < 10; e++) { var an = e / 10 * Math.PI * 2 - Math.PI / 2, rr = e % 2 ? 0.07 : 0.16; if (e) sh.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else sh.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
        var ge = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }); ge.rotateY(-Math.PI / 2); return ge;
      }), mat(esCasco ? C.rojo : metalN), -0.11, -0.34, 0.12);
      iz.add(estrella);
      iz.rotation.y = -0.5;
    }
    cuerpo.add(iz); p.izq = iz;
    [cuerpo, cab, br, iz, arma, p.piernaI, p.piernaD].forEach(function (gr) { fusionar(gr, true); });
    contorno(g);
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.renderOrder = 1; blob.scale.setScalar(1.15);
    g.add(blob);
    if (rareza) { // aro de color bajo los pies según la rareza
      var aroR = new THREE.Mesh(geo('aroRareza', function () { return new THREE.RingGeometry(0.5, 0.62, 32); }), new THREE.MeshBasicMaterial({ color: COLOR_RAREZA[rareza], transparent: true, opacity: 0.55, depthWrite: false }));
      aroR.rotation.x = -Math.PI / 2; aroR.position.y = 0.04; aroR.renderOrder = 1; g.add(aroR);
    }
    p.respira = true;
    var escala = HEROE_TAM * (tam || TAM_UNIDAD);
    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala, baseY: 0, alto: 2.2 * escala, cabezaY: 1.7, tier: tier, etapa: etapa };
  }

  // Contorno oscuro y fino: una copia un poco más gruesa, por dentro, de cada pieza
  var MAT_CONTORNO = new THREE.MeshBasicMaterial({ color: 0x24170e, side: THREE.BackSide });
  function contorno(raiz) {
    var piezas = [];
    raiz.traverse(function (o) { if (o.isMesh && o.geometry && o.geometry.attributes.normal && !o.userData.esContorno) piezas.push(o); });
    piezas.forEach(function (o) {
      var gc = o.geometry.clone(), P = gc.attributes.position, N = gc.attributes.normal;
      for (var i = 0; i < P.count; i++) P.setXYZ(i, P.getX(i) + N.getX(i) * 0.016, P.getY(i) + N.getY(i) * 0.016, P.getZ(i) + N.getZ(i) * 0.016);
      var m = new THREE.Mesh(gc, MAT_CONTORNO);
      m.position.copy(o.position); m.rotation.copy(o.rotation); m.scale.copy(o.scale);
      m.userData.esContorno = true; m.castShadow = false;
      o.parent.add(m);
    });
  }

  // =================================================================
  //  HÉROES CON MODELO 3D DE ARCHIVO (GLB con huesos y animaciones)
  //  Mientras el archivo carga (o si falla) se usa el héroe hecho con código.
  // =================================================================
  // ---------- FIGURAS DE ARCHIVO (sin huesos): tropas y carretas ----------
  // alto: altura en el juego · gira: para que mire hacia +Z (como las tropas)
  var FIGURAS = {
    caballero: { alto: 2.45, gira: 0 }, guardian: { alto: 1.95, gira: 0 }, arquero: { alto: 1.8, gira: 0 }, espadachin: { alto: 1.85, gira: 0, archivo: 'espadachin_anim' }, aldeano: { alto: 1.75, gira: 0, archivo: 'aldeano_anim' }, aldeana: { alto: 1.62, gira: 0, archivo: 'aldeana_rig', animDe: 'aldeano' }, anciano: { alto: 1.6, gira: 0, archivo: 'anciano_rig', animDe: 'aldeano' }, nino: { alto: 1.1, gira: 0, archivo: 'nino_rig', animDe: 'aldeano' },
    carreta: { alto: 0.62, gira: 0 }, caballo: { alto: 0.72, gira: 0 }, gallina: { alto: 0.45, gira: 0 }
  };
  var FIGURA_TROPA = { caballeria: 'caballero', guardian: 'guardian', arquero: 'arquero', espadachin: 'espadachin', aldeano: 'aldeano', aldeana: 'aldeana', anciano: 'anciano', nino: 'nino' };
  var figListas = {}, figPedidas = false, pendRet = {};
  // figuras con esqueleto pero sin animación: usan la de otra figura (mismos huesos, otros nombres)
  var HUESO_DIF = { Spine: 'Spine02', Spine1: 'Spine01', Spine2: 'Spine', Neck: 'neck' };
  function intentarRetarget() {
    Object.keys(pendRet).forEach(function (id) {
      var src = figListas[FIGURAS[id].animDe], dst = figListas[id]; if (!src || !src.clips || !dst) return;
      var nombres = {}; dst.obj.traverse(function (o) { if (o.isBone) nombres[o.name] = 1; });
      dst.clips = src.clips.map(function (c) {
        var tr = c.tracks.filter(function (t) { return /.quaternion$/.test(t.name); }).map(function (t) {
          var b = t.name.replace(/.quaternion$/, '').replace(/^mixamorig/, ''), d = HUESO_DIF[b] || b; if (!nombres[d]) return null;
          var nt = t.clone(); nt.name = d + '.quaternion'; return nt;
        }).filter(Boolean);
        return new THREE.AnimationClip(c.name, c.duration, tr);
      });
      dst.esperaAnim = false; var cb = pendRet[id]; delete pendRet[id]; if (cb) cb(id);
    });
  }
  // The offline export embeds every .glb as a data URI so index.html can be opened straight from disk (file://)
  function rutaGLB(ruta, v) {
    var emb = window.GLB_EMBEBIDOS && window.GLB_EMBEBIDOS[ruta];
    return emb || ruta + v;
  }
  function cargarFiguras(alListo) {
    if (figPedidas || !THREE.GLTFLoader) return; figPedidas = true;
    var cargador = new THREE.GLTFLoader(), v = typeof VERSION_JUEGO !== 'undefined' ? '?v=' + VERSION_JUEGO : '';
    Object.keys(FIGURAS).forEach(function (id) {
      cargador.load(rutaGLB('modelos/' + (FIGURAS[id].archivo || id) + '.glb', v), function (gl) {
        var esc = gl.scene, anim = gl.animations && gl.animations.length && THREE.SkeletonUtils;
        esc.traverse(function (o) {
          if (!o.isMesh) return;
          var map = o.material && o.material.map;
          if (map) map.encoding = THREE.LinearEncoding;
          o.material = new THREE.MeshLambertMaterial({ map: map || null, color: 0xffffff });
          o.castShadow = true;
          if (o.isSkinnedMesh) o.frustumCulled = false;
        });
        esc.updateMatrixWorld(true);
        var caja3 = new THREE.Box3(), tam = new THREE.Vector3(), cen = new THREE.Vector3(), pv = new THREE.Vector3();
        esc.traverse(function (o) {
          if (!o.isMesh) return;
          var P = o.geometry.attributes.position;
          for (var i = 0; i < P.count; i += 3) { pv.fromBufferAttribute(P, i); if (o.isSkinnedMesh) o.boneTransform(i, pv); pv.applyMatrix4(o.matrixWorld); caja3.expandByPoint(pv); }
        });
        caja3.getSize(tam); caja3.getCenter(cen);
        var k = FIGURAS[id].alto / tam.y, raiz = new THREE.Group();
        esc.position.set(-cen.x, -caja3.min.y, -cen.z); raiz.add(esc);
        raiz.scale.setScalar(k); raiz.rotation.y = FIGURAS[id].gira;
        var hold = new THREE.Group(); hold.add(raiz);
        figListas[id] = { obj: hold, largo: Math.max(tam.x, tam.z) * k, clips: anim ? gl.animations : null };
        if (FIGURAS[id].animDe) { figListas[id].clips = null; figListas[id].esperaAnim = true; pendRet[id] = alListo; } else if (alListo) alListo(id);
        intentarRetarget();
      }, undefined, function () { /* sin archivo: queda la figura hecha con código */ });
    });
  }
  function figura(id) { var f = figListas[id]; return f ? (f.clips ? THREE.SkeletonUtils.clone(f.obj) : f.obj.clone()) : null; }
  // pone la figura de archivo en lugar del cuerpo hecho con código (se queda el aro del rango)
  function ponerFiguraTropa(tipo, g, cuerpo, p, armadura) {
    var f = figura(FIGURA_TROPA[tipo]); if (!f) return false;
    g.traverse(function (o) { if (o.isMesh && !(o.userData && o.userData.noFusionar)) o.visible = false; });
    (p.caballo || cuerpo).add(f);
    if (p.caballo) f.position.y = 0; else f.position.y = 0;
    // aro de color por rango (el IV ya tiene el dorado)
    if (armadura === 1 || armadura === 2) {
      var aro = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.64, 28), new THREE.MeshBasicMaterial({ color: armadura === 1 ? 0xd6dde5 : 0x4a8aff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
      aro.rotation.x = -Math.PI / 2; aro.position.y = 0.04; g.add(aro);
    }
    p.figura = f;
    // figura con animaciones: caminar de verdad
    var cl = figListas[FIGURA_TROPA[tipo]].clips;
    if (cl) {
      p.mixer = new THREE.AnimationMixer(f); p.acc = {};
      cl.forEach(function (c) { p.acc[c.name] = p.mixer.clipAction(c); });
      p.andar = p.acc.Walking || p.acc.Running || null; p.quieto = p.acc.Idle || null; p.golpe = p.acc.Attack || null;
      if (p.andar) p.andar.play();
      if (p.quieto) p.quieto.play();
      p.ultT = null;
    }
    return true;
  }
  function animarFiguraTropa(u, t, caminando, ataque) {
    var p = u.p, dt = p.ultT === null ? 0 : Math.max(0, Math.min(0.1, t - p.ultT)); p.ultT = t;
    if (p.andar) {
      var w = caminando ? 1 : 0;
      p.peso = p.peso === undefined ? w : p.peso + (w - p.peso) * Math.min(1, dt * 8);
      if (p.quieto) { p.andar.setEffectiveWeight(p.peso); p.quieto.setEffectiveWeight(1 - p.peso); }
      else { p.andar.timeScale = p.peso > 0.05 ? 1.2 : 0; if (p.peso <= 0.05) p.andar.time = p.andar.time * 0.85; }
    }
    // golpe hacia delante (hasta que llegue una animación de ataque)
    var k = ataque > 0 ? Math.sin(ataque * Math.PI) : 0;
    p.figura.rotation.x = k * 0.32; p.figura.position.z = k * 0.22;
    p.mixer.update(dt);
  }
  // ---------- MÁQUINAS DE ASEDIO (balista, ariete, catapulta, torre) ----------
  function maquinaAsedio(tipo, tam) {
    var g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
    var M1 = C.madera, M2 = C.maderaOsc, HI = C.metalOsc;
    function ruedas(x, z, r) { [-1, 1].forEach(function (s) { [-1, 1].forEach(function (q) { var w = cil(r, r, 0.12, 10, M2, q * x, r, s * z); w.rotation.x = Math.PI / 2; cuerpo.add(w); }); }); }
    if (tipo === 'balista') {
      cuerpo.add(caja(0.9, 0.12, 1.3, M1, 0, 0.32, 0)); ruedas(0.38, 0.5, 0.22);
      cuerpo.add(caja(0.12, 0.5, 0.12, M2, 0, 0.6, -0.1));
      var arco = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 5, 14, Math.PI), mat(M2)); arco.position.set(0, 0.86, 0.25); arco.rotation.x = -Math.PI / 2; cuerpo.add(arco);
      cuerpo.add(caja(0.08, 0.08, 1.3, M1, 0, 0.86, 0.05)); cuerpo.add(cono(0.06, 0.25, 4, HI, 0, 0.86, 0.82).rotateX(Math.PI / 2));
    } else if (tipo === 'catapulta') {
      cuerpo.add(caja(1.0, 0.14, 1.5, M1, 0, 0.34, 0)); ruedas(0.42, 0.6, 0.25);
      [-1, 1].forEach(function (s) { cuerpo.add(caja(0.1, 0.8, 0.1, M2, s * 0.32, 0.8, 0.1)); });
      cuerpo.add(caja(0.74, 0.1, 0.1, M2, 0, 1.15, 0.1));
      var brazo = caja(0.1, 0.1, 1.5, M1, 0, 0.9, -0.15); brazo.rotation.x = -0.5; cuerpo.add(brazo);
      cuerpo.add(esfera(0.2, 0x8f8a80, 0, 1.25, -0.75, 7, 5));
    } else if (tipo === 'ariete') {
      cuerpo.add(caja(0.8, 0.1, 1.8, M2, 0, 0.3, 0)); ruedas(0.36, 0.7, 0.24);
      var tronco = cil(0.18, 0.2, 2.1, 8, 0x8a5a32, 0, 0.62, 0.15); tronco.rotation.x = Math.PI / 2; cuerpo.add(tronco);
      cuerpo.add(cono(0.21, 0.3, 8, HI, 0, 0.62, 1.32).rotateX(Math.PI / 2));
      [-1, 1].forEach(function (s) { cuerpo.add(caja(0.08, 0.8, 0.08, M2, s * 0.36, 0.7, -0.6)); cuerpo.add(caja(0.08, 0.8, 0.08, M2, s * 0.36, 0.7, 0.6)); });
      var techo = caja(0.95, 0.06, 1.6, 0x6a4424, 0, 1.12, 0); cuerpo.add(techo);
    } else {
      cuerpo.add(caja(1.2, 0.14, 1.2, M2, 0, 0.32, 0)); ruedas(0.5, 0.5, 0.26);
      cuerpo.add(caja(1.0, 2.6, 1.0, M1, 0, 1.7, 0));
      for (var i = 0; i < 4; i++) cuerpo.add(caja(1.04, 0.06, 1.04, M2, 0, 0.6 + i * 0.7, 0));
      cuerpo.add(caja(0.9, 0.08, 0.5, M2, 0, 2.6, 0.72).rotateX(-0.5));
      for (var a = 0; a < 4; a++) cuerpo.add(caja(0.2, 0.25, 0.2, M1, (a % 2 ? 0.4 : -0.4), 3.12, (a < 2 ? 0.4 : -0.4)));
      var bd = bandera(0x2a6ad0, 0.9); bd.userData.noFusionar = true; bd.position.set(0, 3.1, 0); cuerpo.add(bd);
    }
    fusionar(cuerpo, true);
    var p = { piernaI: new THREE.Group(), piernaD: new THREE.Group(), izq: new THREE.Group(), brazo: new THREE.Group(), cabeza: new THREE.Group() };
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.scale.set(1.6, 1.6, 1); g.add(blob);
    var escala = (tam || TAM_UNIDAD) * (tipo === 'torre_asedio' ? 1.0 : 1.05);
    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala, baseY: 0, alto: (tipo === 'torre_asedio' ? 3.4 : 1.4) * escala };
  }
  var GLB_HEROES = {};
  ['sol', 'luna', 'ancla', 'brisa', 'chispa', 'roble', 'trueno', 'pluma'].forEach(function (id) { GLB_HEROES[id] = 'modelos/' + id + '.glb'; });
  var glbPedidos = {};
  var glbListos = {};
  // solo descarga los héroes que se le piden (los que tiene el jugador), una vez cada uno
  function cargarHeroesGLB(ids, alListo) {
    if (!THREE.GLTFLoader || !THREE.SkeletonUtils) return;
    var cargador = new THREE.GLTFLoader();
    var v = typeof VERSION_JUEGO !== 'undefined' ? '?v=' + VERSION_JUEGO : '';
    ids.forEach(function (id) {
      if (!GLB_HEROES[id] || glbPedidos[id]) return;
      glbPedidos[id] = true;
      cargador.load(rutaGLB(GLB_HEROES[id], v), function (gl) {
        var esc = gl.scene;
        esc.traverse(function (o) {
          if (!o.isMesh) return;
          var map = o.material && o.material.map;
          if (map) map.encoding = THREE.LinearEncoding; // igual que las demás texturas del juego
          o.material = new THREE.MeshLambertMaterial({ map: map || null, color: 0xffffff });
          o.frustumCulled = false; // con huesos la caja cambia al moverse: que nunca desaparezca
        });
        // medir el alto real (con los huesos en su lugar) para pararlo en el suelo
        esc.updateMatrixWorld(true);
        var minY = 1e9, maxY = -1e9, v = new THREE.Vector3();
        esc.traverse(function (o) {
          if (!o.isMesh) return;
          var P = o.geometry.attributes.position;
          for (var i = 0; i < P.count; i += 3) {
            v.fromBufferAttribute(P, i);
            if (o.isSkinnedMesh) o.boneTransform(i, v);
            v.applyMatrix4(o.matrixWorld);
            if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
          }
        });
        glbListos[id] = { escena: esc, clips: gl.animations, alto: maxY - minY, minY: minY };
        if (alListo) alListo(id);
      }, undefined, function () { glbPedidos[id] = false; /* sin archivo: queda el héroe hecho con código */ });
    });
  }
  function heroeGLB(h, nivel, tam) {
    var L = glbListos[h.id];
    var g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
    var modelo = THREE.SkeletonUtils.clone(L.escena);
    var k = 2.1 / L.alto;
    modelo.scale.setScalar(k); modelo.position.y = -L.minY * k;
    modelo.rotation.y = Math.PI; // el archivo mira hacia atrás; las tropas del juego miran hacia +Z
    cuerpo.add(modelo);
    var blob = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; blob.renderOrder = 1; blob.scale.setScalar(1.2);
    g.add(blob);
    if (h.rareza) {
      var aroR = new THREE.Mesh(geo('aroRareza', function () { return new THREE.RingGeometry(0.5, 0.62, 32); }), new THREE.MeshBasicMaterial({ color: COLOR_RAREZA[h.rareza], transparent: true, opacity: 0.55, depthWrite: false }));
      aroR.rotation.x = -Math.PI / 2; aroR.position.y = 0.04; aroR.renderOrder = 1; g.add(aroR);
    }
    var p = { glb: true, mixer: new THREE.AnimationMixer(modelo), acciones: {}, actual: null, ultT: null, ultAtaque: 0 };
    L.clips.forEach(function (c) { p.acciones[c.name] = p.mixer.clipAction(c); });
    if (p.acciones.Ataque) { p.acciones.Ataque.setLoop(THREE.LoopOnce); p.acciones.Ataque.clampWhenFinished = true; }
    if (p.acciones.Caminar) p.acciones.Caminar.timeScale = 1.25;
    if (p.acciones.Quieto) { p.acciones.Quieto.play(); p.actual = 'Quieto'; }
    // piezas vacías por si algún código busca brazos o piernas
    ['piernaI', 'piernaD', 'izq', 'brazo', 'cabeza'].forEach(function (n) { p[n] = new THREE.Group(); });
    var escala = HEROE_TAM * (tam || TAM_UNIDAD);
    g.scale.setScalar(escala);
    return { grupo: g, cuerpo: cuerpo, p: p, escala: escala, baseY: 0, alto: 2.2 * escala, cabezaY: 1.57, tier: tierHeroe(nivel), etapa: etapaArmadura(nivel), glb: true };
  }
  function animarGLB(u, t, caminando, ataque) {
    var p = u.p, dt = p.ultT === null ? 0 : Math.max(0, Math.min(0.1, t - p.ultT));
    p.ultT = t;
    var quiere = ataque > 0 ? 'Ataque' : caminando ? 'Caminar' : 'Quieto';
    if (!p.acciones[quiere]) quiere = 'Quieto';
    var reinicio = quiere === 'Ataque' && ataque > p.ultAtaque + 0.3; // empezó otro golpe
    p.ultAtaque = ataque;
    if ((quiere !== p.actual || reinicio) && p.acciones[quiere]) {
      var nueva = p.acciones[quiere], vieja = p.acciones[p.actual];
      nueva.reset();
      // el golpe dura lo mismo que el movimiento del brazo de las demás tropas (1/3 de segundo)
      if (quiere === 'Ataque') nueva.timeScale = nueva.getClip().duration * 3;
      nueva.play();
      if (vieja && vieja !== nueva) nueva.crossFadeFrom(vieja, quiere === 'Ataque' ? 0.05 : 0.2, false);
      p.actual = quiere;
    }
    p.mixer.update(dt);
  }

  // Animación de caminar / atacar
  function animarUnidad(u, t, caminando, ataque) {
    if (u.p && u.p.glb) { animarGLB(u, t, caminando, ataque); return; }
    if (u.p && u.p.mixer) animarFiguraTropa(u, t, caminando, ataque);
    var p = u.p;
    // blend between idle and walk so the figure never snaps between poses
    u._andar = (u._andar || 0) + ((caminando ? 1 : 0) - (u._andar || 0)) * 0.14;
    var v = u._andar < 0.01 ? 0 : u._andar;
    var s = Math.sin(t * 11);
    if (!p.patas) {
      u.cuerpo.rotation.z = Math.sin(t * 5.5) * 0.035 * v;
      u.cuerpo.rotation.x = 0.06 * v;
    }
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
      u.cuerpo.position.y = Math.abs(s) * 0.06 * v + (1 - v) * Math.sin(t * 2.5) * 0.015;
    }
    p.izq.rotation.x = -s * 0.4 * v;
    if (p.respira) {
      var quieto = !caminando && !(ataque > 0);
      u.cuerpo.scale.y = quieto ? 1 + Math.sin(t * 2.2) * 0.018 : 1;
      p.cabeza.rotation.y = quieto ? Math.sin(t * 0.6) * 0.25 : 0;
      if (quieto) p.izq.rotation.x = Math.sin(t * 2.2) * 0.06;
    }
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

  // Nubes suaves: una textura esponjosa pintada en el momento (sin imágenes externas)
  var texNube = (function () {
    var T = 256, c = document.createElement('canvas'); c.width = T; c.height = T;
    var x = c.getContext('2d');
    var bolitas = [[128, 150, 70], [80, 160, 52], [176, 162, 56], [110, 112, 58], [158, 118, 50], [60, 176, 36], [200, 178, 38], [130, 182, 60]];
    bolitas.forEach(function (b) {
      var g = x.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.55, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, T, T);
    });
    // la parte de abajo un poco gris, como las nubes de verdad
    x.globalCompositeOperation = 'source-atop';
    var v = x.createLinearGradient(0, 90, 0, 230);
    v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(150,160,180,0.55)');
    x.fillStyle = v; x.fillRect(0, 0, T, T);
    var tx = new THREE.CanvasTexture(c);
    return tx;
  })();
  var matNube = new THREE.SpriteMaterial({ map: texNube, color: 0xffffff, transparent: true, opacity: 0.88, depthWrite: false });
  function nube() {
    var g = new THREE.Group();
    var n = 4 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) {
      var s = new THREE.Sprite(matNube);
      var k = 7 + Math.random() * 6;
      s.position.set((i - n / 2) * 3.2 + Math.random() * 1.5, Math.random() * 1.6, (Math.random() - 0.5) * 4);
      s.scale.set(k, k * 0.62, 1);
      s.renderOrder = 3;
      g.add(s);
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
    if (tipo === 'caballo') {
      // caballo de archivo: si todavía no llegó, se pone cuando llegue (ponerFiguraAnimal)
      var blobC = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
      blobC.rotation.x = -Math.PI / 2; blobC.position.y = 0.03; blobC.scale.set(1.0, 2.0, 1); g.add(blobC);
      g.scale.setScalar(1.3);
      var an = { grupo: g, cuerpo: cuerpo, patas: patas, tipo: tipo };
      ponerFiguraAnimal(an);
      return an;
    }
    if (tipo === 'gallina' && figListas.gallina) {
      var blobG = new THREE.Mesh(geo('blob', function () { return new THREE.CircleGeometry(0.45, 18); }), MAT_BLOB);
      blobG.rotation.x = -Math.PI / 2; blobG.position.y = 0.03; blobG.scale.setScalar(0.6); g.add(blobG);
      g.scale.setScalar(1.2);
      var ag = { grupo: g, cuerpo: cuerpo, patas: patas, tipo: tipo };
      ponerFiguraAnimal(ag); return ag;
    }
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
  var GIRO_GALLINA = 0;
  // ---------- MOVER UNA FIGURA SIN HUESOS ----------
  // El juego dobla las patas (de la panza para abajo) y baja el cuello, moviendo los puntos de la figura en la tarjeta gráfica.
  function deformarCuadrupedo(f, op) {
    op = op || {};
    f.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(f.matrixWorld).invert(), v = new THREE.Vector3(), mallas = [];
    f.traverse(function (o) { if (o.isMesh) mallas.push(o); });
    if (!mallas.length) return null;
    // medir la figura en su propio espacio: alto, largo, ancho y hacia dónde está la cabeza
    var mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = new THREE.Vector3(-1e9, -1e9, -1e9), pts = [];
    mallas.forEach(function (o) {
      var rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), P = o.geometry.attributes.position;
      o.userData.rel = rel;
      for (var i = 0; i < P.count; i += 4) { v.fromBufferAttribute(P, i).applyMatrix4(rel); mn.min(v); mx.max(v); pts.push(v.x, v.y, v.z); }
    });
    var H = mx.y - mn.y, largoX = mx.x - mn.x, largoZ = mx.z - mn.z;
    var eje = largoX > largoZ ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1), lado = largoX > largoZ ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    var centro = mn.clone().add(mx).multiplyScalar(0.5); centro.y = mn.y;
    // la cabeza está en la punta donde hay más puntos altos
    var suma = 0, n = 0;
    for (var k = 0; k < pts.length; k += 3) if (pts[k + 1] > mn.y + H * 0.8) { suma += (eje.x ? pts[k] - centro.x : pts[k + 2] - centro.z); n++; }
    if (n && suma < 0) eje.negate();
    var L = Math.max(largoX, largoZ) / 2, W = Math.min(largoX, largoZ) / 2;
    var U = {
      uT: { value: 0 }, uAndar: { value: 0 }, uPastar: { value: 0 },
      uEje: { value: eje }, uLado: { value: lado }, uCentro: { value: centro },
      uH: { value: H }, uL: { value: L }, uW: { value: W }, uSuelo: { value: mn.y },
      uPanza: { value: op.panza || 0.46 }, uCuello: { value: op.cuello || 0.3 }, uPaso: { value: op.paso || 0.45 }
    };
    mallas.forEach(function (o) {
      var m = o.material.clone();
      var rel = o.userData.rel, relInv = new THREE.Matrix4().copy(rel).invert();
      m.onBeforeCompile = function (sh) {
        Object.keys(U).forEach(function (k) { sh.uniforms[k] = U[k]; });
        sh.uniforms.uRel = { value: rel }; sh.uniforms.uRelInv = { value: relInv };
        sh.vertexShader = 'uniform float uT, uAndar, uPastar, uH, uL, uW, uSuelo, uPanza, uCuello, uPaso;\nuniform vec3 uEje, uLado, uCentro;\nuniform mat4 uRel, uRelInv;\n' +
          sh.vertexShader.replace('#include <begin_vertex>', [
            '#include <begin_vertex>',
            'vec3 q = (uRel * vec4(transformed, 1.0)).xyz;',
            'float ay = q.y - uSuelo, a = dot(q - uCentro, uEje), s = dot(q - uCentro, uLado);',
            // patas: de la panza para abajo, en diagonal (delantera izquierda con trasera derecha)
            'float tope = uH * uPanza;',
            'if (ay < tope) {',
            '  float fr = a > 0.0 ? 1.0 : -1.0, lr = s > 0.0 ? 1.0 : -1.0;',
            '  float esPata = smoothstep(0.1 * uW, 0.3 * uW, abs(s)) * clamp((tope - ay) / (uH * 0.12), 0.0, 1.0);',
            '  float ang = sin(uT * 8.0) * uPaso * uAndar * fr * lr;',
            '  float dy = tope - ay;',
            '  q += uEje * (sin(ang) * dy * esPata);',
            '  q.y += (1.0 - cos(ang)) * dy * esPata;',
            '}',
            // cuello y cabeza: bajan a pastar
            'float base = uL * uCuello;',
            'if (a > base && ay > uH * 0.5) {',
            '  float g = uPastar * 1.55 * clamp((a - base) / (uL * 0.22), 0.0, 1.0);',
            '  vec2 r = vec2(a - base, ay - uH * 0.56);',
            '  float c = cos(-g), sn = sin(-g);',
            '  vec2 r2 = vec2(r.x * c - r.y * sn, r.x * sn + r.y * c);',
            '  q += uEje * (r2.x - r.x); q.y += r2.y - r.y;',
            '}',
            'transformed = (uRelInv * vec4(q, 1.0)).xyz;'
          ].join('\n'));
      };
      m.customProgramCacheKey = function () { return 'cuadrupedo'; };
      o.material = m;
    });
    return U;
  }
  function ponerFiguraAnimal(a) {
    if (a.fig) return true;
    var f = figura(a.tipo); if (!f) return false;
    if (a.tipo === 'caballo') a.def = deformarCuadrupedo(f, { panza: 0.46, cuello: 0.3, paso: 0.45 });
    if (a.tipo === 'caballo') { f.rotation.y = 0; f.scale.multiplyScalar(1.75); }
    if (a.tipo === 'gallina') { f.rotation.y = GIRO_GALLINA; a.cuerpo.children.slice().forEach(function (c) { a.cuerpo.remove(c); }); a.patas.forEach(function (pt) { pt.visible = false; }); }
    a.cuerpo.add(f); a.fig = f; return true;
  }
  function animarAnimal(a, t, camina) {
    a._andar = (a._andar || 0) + ((camina ? 1 : 0) - (a._andar || 0)) * 0.12;
    var v = a._andar < 0.01 ? 0 : a._andar, s = Math.sin(t * (a.tipo === 'gallina' ? 18 : 10));
    a.patas.forEach(function (pt, i) { pt.rotation.x = s * 0.7 * v * (i % 2 ? 1 : -1) * (i > 1 ? -1 : 1); });
    a.cuerpo.position.y = Math.abs(s) * 0.03 * v;
    // picotear / pastar cuando est�� quieta
    a.cuerpo.rotation.x = camina ? 0 : Math.max(0, Math.sin(t * 1.3)) * (a.tipo === 'gallina' ? 0.35 : 0.12);
    if (a.def) {
      // caballo: patas al caminar, cabeza abajo al pastar (sube de vez en cuando a mirar)
      var U = a.def; U.uT.value = t;
      U.uAndar.value += ((camina ? 1 : 0) - U.uAndar.value) * 0.12;
      var quiere = camina ? 0 : (Math.sin(t * 0.35) > -0.3 ? 1 : 0);
      U.uPastar.value += (quiere - U.uPastar.value) * 0.04;
      a.cuerpo.rotation.x = 0; a.cuerpo.position.y = Math.abs(Math.sin(t * 8)) * 0.02 * U.uAndar.value;
    }
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
    castillo: castillo, terreno: terreno, parcelaLibre: parcelaLibre, parcelaCerrada: parcelaCerrada, TAM_PARCELA: TAM_PARCELA, andamio: andamio,
    granja: granja, cuartel: cuartel, torre: torre, enfermeria: enfermeria, muralla: muralla, aserradero: aserradero, mina: mina, barricada: barricada, academia: academia,
    vigia: vigia, almacen: almacen, mercado: mercado, herreria: herreria, establo: establo, galeria: galeria,
    unidad: unidad, animarUnidad: animarUnidad, mejorarPorTramo: mejorarPorTramo, campoParcela: campoParcela, minaOro: minaOro, cantera: cantera, etiquetaEdificio: etiquetaEdificio,
    barraVida: barraVida, ponerVida: ponerVida, flecha: flecha,
    bosque: bosque, roca: roca, arbustos: arbustos, matasPasto: matasPasto, nube: nube, flor: flor, moneda: moneda,
    animal: animal, animarAnimal: animarAnimal, luzNoche: luzNoche, matNube: matNube, antorcha: antorcha, barril: barril, cajas: cajas,
    ondear: ondear, insigniaNivel: insigniaNivel, fusionar: fusionar,
    heroe: function (h, nivel) { return glbListos[h.id] ? heroeGLB(h, nivel) : heroeModelo2(h.look, undefined, nivel, h.rareza); },
    cargarHeroesGLB: cargarHeroesGLB, cargarFiguras: cargarFiguras, crecerEdificio: crecerEdificio, ponerFiguraAnimal: ponerFiguraAnimal, figura: figura, figuraLista: function (id) { return !!figListas[id]; }, FIGURA_TROPA: FIGURA_TROPA, tieneGLB: function (id) { return !!glbListos[id]; }, tierHeroe: tierHeroe, etapaArmadura: etapaArmadura
  };
})();
