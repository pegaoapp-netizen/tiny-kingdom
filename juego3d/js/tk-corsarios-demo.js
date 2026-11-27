/* v10.02 · BAHÍA DE LOS CORSARIOS · REMODELACIÓN GRÁFICA de toda la 2.ª villa (Claude). Empezó como zona de demostración (v10.01).
   Ahora se aplica a TODAS las parcelas de la ciudad de la 2.ª villa y está ENCENDIDA. Se apaga con ?demo=0 o TKCorsariosDemo.activar(false).
   Calidad baja del teléfono: menos vegetación y tejados sin tejas sueltas.
   Prueba de calidad antes de rehacer toda la 2.ª villa: tres parcelas (por defecto 1, 10 y 8), su calle y la vegetación de alrededor.
   - Edificios nuevos con geometría de verdad: zócalo de sillares, paredes de cal con desconchones, entramado de madera,
     ventanas hundidas con cristal, contraventanas y jardineras, puertas en arco, balcones, tejados de teja curva una a una,
     aleros con canecillos, chimeneas con humo, toldos, faroles y atrezo de puerto. Giran 45° para que se vean dos fachadas.
   - Suelo de césped pintado, bordillos en la calle, farolas, macizos de flores, arbustos, palmeras y matas de hierba.
   - Luz más cálida y con más contraste solo mientras se ve la demo.
   Solo visual: mismos edificios, niveles, toques y sistemas. APAGADA por defecto: se enciende con ?demo=1 (o ?demo=1,10,8 para
   elegir parcelas) o desde la consola con TKCorsariosDemo.activar(true). No se publica hasta que el dueño lo apruebe. */
(function () {
  'use strict';
  if (!window.THREE) return;
  var T3 = THREE, NOOP = function () {};
  var qd = /[?&]demo=([0-9,]+|1)(?:&|$)/.exec(location.search);
  var ON = !/[?&]demo=0(?:&|$)/.test(location.search), PARC = qd && qd[1].indexOf(',') > 0 ? qd[1].split(',').map(Number) : null, VER = 1; // null = todas las parcelas de la ciudad
  var CANT = { baja: 0.4, media: 0.7, alta: 1, ultra: 1.2 }[(window.TKPremium && TKPremium.nivel && TKPremium.nivel()) || 'alta'] || 1;
  function lista(c) { return PARC || c.slots.map(function (s, i) { return s.campo ? -1 : i; }).filter(function (i) { return i >= 0; }); }
  function I() { return window.TKCorsarios && TKCorsarios._int; }
  function C() { var x = window.__tkExtras; return x && x.ciudad; }
  function sm(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  function azar(sem) { var s = sem || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ======================================================================
  //  KIT DE CONSTRUCCIÓN: todo se funde en una sola malla por edificio, con color y «material» por pieza
  //  mt: 0 cal · 1 madera · 2 sillería · 3 teja · 4 cristal (brilla de noche) · 5 hierro · 6 hojas · 7 oro · 8 tela/liso
  // ======================================================================
  var o3 = new T3.Object3D(), mN = new T3.Matrix3(), vA = new T3.Vector3(), vB = new T3.Vector3(), cA = new T3.Color();
  function M(x, y, z, rx, ry, rz, sx, sy, sz) {
    o3.position.set(x || 0, y || 0, z || 0); o3.rotation.set(rx || 0, ry || 0, rz || 0, 'YXZ');
    var a = sx === undefined ? 1 : sx; o3.scale.set(a, sy === undefined ? a : sy, sz === undefined ? a : sz); o3.updateMatrix(); return o3.matrix.clone();
  }
  var G = {};
  function nI(g) { var n = g.index ? g.toNonIndexed() : g; if (!n.attributes.normal) n.computeVertexNormals(); return n; }
  function gBox() { return G.box || (G.box = nI(new T3.BoxGeometry(1, 1, 1))); }
  function gCil(s) { return G['c' + s] || (G['c' + s] = nI(new T3.CylinderGeometry(0.5, 0.5, 1, s))); }
  function gCono(s) { return G['k' + s] || (G['k' + s] = nI(new T3.ConeGeometry(0.5, 1, s))); }
  function gEsf(s) { return G['e' + s] || (G['e' + s] = nI(new T3.SphereGeometry(0.5, s, Math.max(3, (s * 0.6) | 0)))); }
  function gIco(d) { return G['i' + d] || (G['i' + d] = nI(new T3.IcosahedronGeometry(0.5, d))); }
  function gToro() { return G.toro || (G.toro = nI(new T3.TorusGeometry(0.5, 0.12, 5, 14))); }
  function gArco(s) { return G['a' + s] || (G['a' + s] = nI(new T3.CylinderGeometry(0.5, 0.5, 1, s, 1, false, -Math.PI / 2, Math.PI))); } // medio cilindro: arco de puerta
  function gBarril() { if (G.barril) return G.barril; var p = []; for (var i = 0; i <= 8; i++) { var t = i / 8; p.push(new T3.Vector2(0.42 + 0.08 * Math.sin(t * Math.PI), t - 0.5)); } p.unshift(new T3.Vector2(0, -0.5)); p.push(new T3.Vector2(0, 0.5)); return (G.barril = nI(new T3.LatheGeometry(p, 10))); }
  // teja curva: medio tubo algo más estrecho arriba (así se solapan como las de verdad)
  function gTeja() {
    if (G.teja) return G.teja; var S = 3, P = [], N = [];
    for (var i = 0; i < S; i++) { var f0 = i / S * Math.PI, f1 = (i + 1) / S * Math.PI;
      var q = function (f, z) { var r = z < 0 ? 0.42 : 0.5; return [Math.cos(f) * r, Math.sin(f) * r * 1.0, z]; }, n = function (f) { return [Math.cos(f), Math.sin(f), 0]; };
      var a = q(f0, -0.5), b = q(f0, 0.5), c = q(f1, 0.5), d = q(f1, -0.5);
      P.push.apply(P, a.concat(b, c, a, c, d)); var n0 = n(f0), n1 = n(f1); N.push.apply(N, n0.concat(n0, n1, n0, n1, n1)); }
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3));
    // el sentido de los triángulos tiene que mirar hacia fuera
    var pa = g.attributes.position; for (var t = 0; t < pa.count; t += 3) { vA.fromBufferAttribute(pa, t + 1).sub(vB.fromBufferAttribute(pa, t)); var w = new T3.Vector3().fromBufferAttribute(pa, t + 2).sub(vB); var cr = vA.clone().cross(w), nn = new T3.Vector3().fromBufferAttribute(g.attributes.normal, t); if (cr.dot(nn) < 0) { var x = [pa.getX(t + 1), pa.getY(t + 1), pa.getZ(t + 1)]; pa.setXYZ(t + 1, pa.getX(t + 2), pa.getY(t + 2), pa.getZ(t + 2)); pa.setXYZ(t + 2, x[0], x[1], x[2]); var nx = [g.attributes.normal.getX(t + 1), g.attributes.normal.getY(t + 1), g.attributes.normal.getZ(t + 1)]; g.attributes.normal.setXYZ(t + 1, g.attributes.normal.getX(t + 2), g.attributes.normal.getY(t + 2), g.attributes.normal.getZ(t + 2)); g.attributes.normal.setXYZ(t + 2, nx[0], nx[1], nx[2]); } }
    return (G.teja = g);
  }
  function Kit(sem) { this.p = []; this.n = []; this.c = []; this.m = []; this.B = new T3.Matrix4(); this.pila = []; this.r = azar(sem || 7); }
  Kit.prototype.en = function (m4, fn) { this.pila.push(this.B.clone()); this.B.multiply(m4); fn(); this.B = this.pila.pop(); return this; };
  Kit.prototype.add = function (geo, m4, col, mt, jit) {
    var mm = new T3.Matrix4().multiplyMatrices(this.B, m4), P = geo.attributes.position, Nn = geo.attributes.normal;
    mN.getNormalMatrix(mm); cA.set(col); var j = 1 + (this.r() - 0.5) * (jit === undefined ? 0.1 : jit), r = Math.min(1, cA.r * j), g = Math.min(1, cA.g * j), b = Math.min(1, cA.b * j), m = mt || 0;
    for (var i = 0; i < P.count; i++) { vA.fromBufferAttribute(P, i).applyMatrix4(mm); this.p.push(vA.x, vA.y, vA.z); vB.fromBufferAttribute(Nn, i).applyMatrix3(mN).normalize(); this.n.push(vB.x, vB.y, vB.z); this.c.push(r, g, b); this.m.push(m); }
    return this;
  };
  Kit.prototype.caja = function (w, h, d, col, mt, x, y, z, ry, rx, rz, jit) { return this.add(gBox(), M(x, y, z, rx, ry, rz, w, h, d), col, mt, jit); };
  Kit.prototype.cil = function (r, h, col, mt, x, y, z, seg, rx, ry, rz) { return this.add(gCil(seg || 8), M(x, y, z, rx, ry, rz, r * 2, h, r * 2), col, mt); };
  Kit.prototype.esf = function (r, col, mt, x, y, z, sx, sy, sz, seg) { return this.add(gEsf(seg || 8), M(x, y, z, 0, 0, 0, r * 2 * (sx || 1), r * 2 * (sy || 1), r * 2 * (sz || 1)), col, mt); };
  // pieza orientada entre dos puntos (vigas, cuerdas, limatesas)
  Kit.prototype.entre = function (geo, a, b, gx, gy, col, mt, giro) {
    var z = new T3.Vector3().subVectors(b, a), l = z.length(); if (l < 1e-4) return this; z.divideScalar(l);
    var up = Math.abs(z.y) > 0.95 ? new T3.Vector3(1, 0, 0) : new T3.Vector3(0, 1, 0), x = new T3.Vector3().crossVectors(up, z).normalize(), y = new T3.Vector3().crossVectors(z, x);
    if (giro) { x.applyAxisAngle(z, giro); y.applyAxisAngle(z, giro); }
    var m = new T3.Matrix4().makeBasis(x, y, z).scale(new T3.Vector3(gx, gy, l)).setPosition(a.clone().add(b).multiplyScalar(0.5));
    return this.add(geo, m, col, mt, 0.06);
  };
  Kit.prototype.viga = function (a, b, g, col, mt) { return this.entre(gBox(), a, b, g, g, col, mt === undefined ? 1 : mt); };
  Kit.prototype.cuerda = function (a, b, g, col) { return this.entre(G.cu || (G.cu = nI(new T3.CylinderGeometry(0.5, 0.5, 1, 5).rotateX(Math.PI / 2))), a, b, g, g, col, 8); };
  // cuadrilátero (o triángulo si p2 = p3) en el marco actual
  Kit.prototype.quad = function (p0, p1, p2, p3, col, mt) {
    var g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute([].concat(p0, p1, p2, p0, p2, p3), 3)); g.computeVertexNormals();
    this.add(g, new T3.Matrix4(), col, mt, 0.04); g.dispose(); return this;
  };
  Kit.prototype.malla = function (mat) {
    var g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new T3.Float32BufferAttribute(this.c, 3)); g.setAttribute('mt', new T3.Float32BufferAttribute(this.m, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    var me = new T3.Mesh(g, mat || matD()); me.castShadow = true; me.receiveShadow = true; me.raycast = NOOP; return me;
  };

  // ======================================================================
  //  MATERIAL DE LOS EDIFICIOS: detalle pintado en el shader según el «material» de cada pieza
  //  (sillares con juntas, cal manchada y desconchada, vetas de madera, tejas con musgo, cristal que se enciende de noche)
  // ======================================================================
  var UD = { noche: { value: 0 }, t: { value: 0 } }, MATD = null;
  var GL = [
    'float dH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float dN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(dH(i), dH(i + vec3(1,0,0)), f.x), mix(dH(i + vec3(0,1,0)), dH(i + vec3(1,1,0)), f.x), f.y), mix(mix(dH(i + vec3(0,0,1)), dH(i + vec3(1,0,1)), f.x), mix(dH(i + vec3(0,1,1)), dH(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float dF(vec3 p){ return dN(p) * 0.5 + dN(p * 2.07 + 3.1) * 0.3 + dN(p * 4.3 - 1.3) * 0.2; }',
    // sillería: hiladas de 34 cm, piezas de largo variable, juntas hundidas y canto gastado
    'vec3 dSillar(vec2 p, vec3 base, out float junta){ float alto = 0.34; float fila = floor(p.y / alto); float largo = 0.5 + 0.32 * dH(vec3(fila, 1.7, 2.3)); float x = p.x / largo + dH(vec3(fila, 4.1, 0.0)) * 3.0; float id = floor(x);',
    '  vec2 f = vec2(fract(x) * largo, fract(p.y / alto) * alto); junta = min(min(f.x, largo - f.x), min(f.y, alto - f.y)); float h = dH(vec3(id, fila, 7.0));',
    '  vec3 c = base * (0.76 + 0.42 * h) * vec3(1.0 + 0.06 * (dH(vec3(id, fila, 9.0)) - 0.5), 1.0, 1.0 - 0.08 * (h - 0.5)); c *= 0.86 + 0.24 * dF(vec3(p * 5.0, h * 9.0));',
    '  return mix(c * 0.42, c, smoothstep(0.01, 0.045, junta)); }'
  ].join('\n');
  function matD() {
    if (MATD) return MATD;
    var m = new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.5 }); m.userData.tkpSinVentanas = true;
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uDN = UD.noche; sh.uniforms.uDT = UD.t;
      sh.vertexShader = 'attribute float mt; varying float vMt; varying vec3 vDW; varying vec3 vDN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vec4 dP = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n dP = instanceMatrix * dP;\n#endif\n vDW = (modelMatrix * dP).xyz; vDN = normalize(mat3(modelMatrix) * objectNormal); vMt = mt;');
      sh.fragmentShader = 'uniform float uDN; uniform float uDT; varying float vMt; varying vec3 vDW; varying vec3 vDN;\n' + GL + '\n' + sh.fragmentShader
        .replace('#include <color_fragment>', [
          '#include <color_fragment>',
          ' vec3 dn = normalize(vDN); vec3 w = vDW; float mt = floor(vMt + 0.5);',
          ' vec2 fp = abs(dn.y) > 0.7 ? w.xz : (abs(dn.x) > abs(dn.z) ? vec2(w.z, w.y) : vec2(w.x, w.y));', // coordenadas sobre la cara
          ' vec3 c = diffuseColor.rgb; float g = dF(w * 2.3); float jn = 1.0; float brillo = 0.0;',
          ' if (mt < 0.5) {',                                                                                    // cal
          '   c *= 0.9 + 0.16 * g; c *= 1.0 - 0.1 * smoothstep(0.55, 0.9, dN(vec3(fp.x * 2.5, fp.y * 0.35, 3.0)));',   // manchas y churretes de lluvia
          '   float roto = smoothstep(0.74, 0.78, dF(w * 1.5 + 5.0)) * step(abs(dn.y), 0.5) * (1.0 - smoothstep(1.2, 2.2, w.y) * 0.5);',                     // desconchones: asoma la piedra
          '   vec3 pie = dSillar(fp, vec3(0.70, 0.62, 0.50), jn); c = mix(c, pie, roto * 0.9); c = mix(c * 0.82, c, smoothstep(0.0, 0.03, abs(dF(w * 1.5 + 5.0) - 0.74)) * 0.7 + 0.3);',
          ' } else if (mt < 1.5) {',                                                                             // madera
          '   float veta = dN(vec3(fp.x * 1.2, fp.y * 16.0, w.z * 1.2 + w.x)); c *= 0.78 + 0.34 * veta; c *= 0.9 + 0.15 * g;',
          ' } else if (mt < 2.5) {',                                                                             // sillería
          '   c = dSillar(fp + vec2(0.0, 0.07), c, jn); c = mix(c, c * vec3(0.75, 0.9, 0.62), smoothstep(0.62, 0.82, dF(w * 0.7 + 2.0)) * 0.5);',
          ' } else if (mt < 3.5) {',                                                                             // teja
          '   c *= 0.84 + 0.3 * g; c = mix(c, vec3(0.38, 0.42, 0.22), smoothstep(0.68, 0.9, dF(w * 0.9 + 11.0)) * 0.55);',
          ' } else if (mt < 4.5) {',                                                                             // cristal
          '   float cielo = smoothstep(-0.2, 0.6, fract(fp.y * 1.2) - 0.3 * dN(vec3(fp * 3.0, 1.0))); c = mix(vec3(0.12, 0.16, 0.2), vec3(0.5, 0.64, 0.74), cielo * (1.0 - uDN));',
          '   brillo = 0.12 + 1.5 * uDN * (0.75 + 0.25 * sin(uDT * 2.0 + w.x * 3.0));',
          ' } else if (mt < 5.5) { c *= 0.85 + 0.25 * g; }',
          '   else if (mt > 8.5) { c = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.85, 0.3), dN(vec3(w * 4.0 + uDT * 2.0))); brillo = 1.6; }', // fuego de la fragua y braseros                                                     // hierro
          '   else if (mt < 6.5) { c *= 0.75 + 0.4 * dF(w * 3.5); c = mix(c, c * vec3(1.15, 1.2, 0.8), smoothstep(0.3, 1.2, dn.y)); }', // hojas
          '   else if (mt < 7.5) { c *= 0.9 + 0.35 * pow(max(dot(dn, normalize(vec3(0.3, 1.0, 0.4))), 0.0), 6.0); }', // oro
          ' if (mt < 3.5 || (mt > 7.5 && mt < 8.5)) c *= mix(0.62, 1.0, smoothstep(0.0, 1.1, w.y));',                         // suciedad y sombra junto al suelo
          ' diffuseColor.rgb = c;'
        ].join('\n'))
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(1.0, 0.62, 0.26) * brillo;');
    };
    m.customProgramCacheKey = function () { return 'tkDemo1'; };
    return (MATD = m);
  }

  // ======================================================================
  //  PIEZAS DE ARQUITECTURA
  // ======================================================================
  var K = { cal1: 0xf4e2bc, turq: 0x38b4a6, coral: 0xe8704c, ocre: 0xeca83e, rosa: 0xe8a0a2, cielo: 0x7ec0d6,
    sillar: 0xbca684, sillarO: 0x958265, madO: 0x5a3a22, mad: 0x8a5a34, madC: 0xb27c4a, blanco: 0xf4ecd8, teja: 0xb8552f, tejaO: 0x8e3c22,
    hierro: 0x2e2c2a, oro: 0xe3b23c, cristal: 0x445566, verdeH: 0x3f7a2a, contra: [0x2f7f86, 0xa83a2a, 0x2f5f9a, 0x4f8a3a, 0x6a3f86] };
  var CARAS = function (W, D) { return [M(0, 0, D / 2, 0, 0, 0), M(W / 2, 0, 0, 0, Math.PI / 2, 0), M(0, 0, -D / 2, 0, Math.PI, 0), M(-W / 2, 0, 0, 0, -Math.PI / 2, 0)]; };
  // zócalo de sillares con remate
  function zocalo(k, W, D, h, col) { k.caja(W, h, D, col || K.sillar, 2, 0, h / 2, 0); k.caja(W + 0.12, 0.1, D + 0.12, K.sillarO, 2, 0, h + 0.05, 0); }
  // esquinas de piedra (cadenas) en la pared
  function cadenas(k, W, D, y0, h) {
    for (var y = y0, i = 0; y < y0 + h - 0.1; y += 0.36, i++) [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) {
      var l = i % 2 ? 0.55 : 0.32; k.caja(i % 2 ? l : 0.26, 0.32, i % 2 ? 0.26 : l, K.sillar, 2, q[0] * (W / 2 - (i % 2 ? l / 2 - 0.13 : 0)), y + 0.17, q[1] * (D / 2 - (i % 2 ? 0 : l / 2 - 0.13)));
    });
  }
  function cornisa(k, W, D, y) { k.caja(W + 0.22, 0.12, D + 0.22, K.blanco, 8, 0, y + 0.06, 0); k.caja(W + 0.34, 0.1, D + 0.34, K.blanco, 8, 0, y + 0.17, 0); }
  // ventana hundida: hueco oscuro, cristal con cuarterones, marco, alféizar, dintel, contraventanas abiertas y jardinera
  function ventana(k, x, y, o) {
    var w = o.w || 0.72, h = o.h || 1.0, cv = o.contra, r = k.r;
    k.caja(w + 0.06, h + 0.06, 0.1, 0x24180f, 8, x, y, -0.06);
    k.caja(w - 0.04, h - 0.04, 0.02, K.cristal, 4, x, y, 0.0);
    k.caja(0.05, h, 0.05, o.marco || K.blanco, 1, x, y, 0.03); k.caja(w, 0.05, 0.05, o.marco || K.blanco, 1, x, y + h * 0.12, 0.03);
    [[-1, 0], [1, 0]].forEach(function (s) { k.caja(0.07, h + 0.12, 0.08, o.marco || K.blanco, 1, x + s[0] * (w / 2 + 0.02), y, 0.03); });
    k.caja(w + 0.14, 0.07, 0.08, o.marco || K.blanco, 1, x, y + h / 2 + 0.03, 0.03);
    if (o.arco) k.add(gArco(10), M(x, y + h / 2, 0.0, Math.PI / 2, 0, 0, w + 0.1, 0.1, w / 2 + 0.1), o.marco || K.blanco, 1);
    else k.caja(w + 0.3, 0.14, 0.14, o.dintel || K.sillar, 2, x, y + h / 2 + 0.13, 0.05);
    k.caja(w + 0.26, 0.08, 0.2, K.sillar, 2, x, y - h / 2 - 0.05, 0.08);
    if (cv !== null && cv !== undefined) [-1, 1].forEach(function (s) {
      var ab = 1.2 + r() * 0.5; k.en(M(x + s * (w / 2 + 0.04), y, 0.04, 0, s * ab, 0), function () {
        k.caja(0.04, h + 0.04, 0.02, cv, 1, s * w * 0.25, 0, 0.0 + 0.0, 0, 0, 0, 0.04);
        k.caja(w / 2, h + 0.04, 0.04, cv, 1, s * w * 0.25, 0, 0.02);
        for (var l = -h / 2 + 0.1; l < h / 2 - 0.05; l += 0.11) k.caja(w / 2 - 0.08, 0.025, 0.02, new T3.Color(cv).multiplyScalar(0.7).getHex(), 1, s * w * 0.25, l, 0.045, 0, 0.5, 0, 0.02);
      });
    });
    if (o.flores) { var fy = y - h / 2 - 0.05; k.caja(w + 0.1, 0.22, 0.24, K.madO, 1, x, fy + 0.13, 0.2); for (var f = 0; f < 7; f++) { var fx = x - w / 2 + 0.05 + f * (w / 6.3); k.esf(0.11, K.verdeH, 6, fx, fy + 0.3, 0.2 + (f % 2) * 0.06, 1, 0.8, 1, 6); if (f % 2 === 0 || r() > 0.5) k.esf(0.06, o.flores[f % o.flores.length], 8, fx + 0.03, fy + 0.38, 0.27, 1, 1, 1, 5); } }
  }
  // puerta en arco con dovelas, tablas, herrajes y escalón
  function puerta(k, x, o) {
    var w = o.w || 1.1, h = o.h || 1.9, y0 = o.y0 || 0, ancha = w / 2;
    k.caja(w + 0.1, h - ancha, 0.14, 0x20140c, 8, x, y0 + (h - ancha) / 2, -0.03);
    k.add(gArco(12), M(x, y0 + h - ancha, -0.03, Math.PI / 2, 0, 0, w + 0.1, 0.14, ancha + 0.05), 0x20140c, 8);
    for (var t = 0; t < 6; t++) k.caja(w / 6 - 0.02, h - ancha - 0.05, 0.06, o.madera || K.mad, 1, x - w / 2 + (t + 0.5) * w / 6, y0 + (h - ancha) / 2, 0.02);
    k.add(gArco(12), M(x, y0 + h - ancha, 0.0, Math.PI / 2, 0, 0, w - 0.04, 0.06, ancha - 0.02), o.madera || K.mad, 1);
    [0.35, 0.75].forEach(function (f) { k.caja(w - 0.1, 0.06, 0.03, K.hierro, 5, x, y0 + (h - ancha) * f, 0.06); });
    k.esf(0.05, K.oro, 7, x + w * 0.3, y0 + h * 0.45, 0.07, 1, 1, 1, 6);
    for (var d = 0; d <= 8; d++) { var a = Math.PI * d / 8, rr = ancha + 0.16; k.caja(0.2, 0.3, 0.16, d === 4 ? K.sillarO : K.sillar, 2, x + Math.cos(a) * rr, y0 + h - ancha + Math.sin(a) * rr, 0.04, 0, 0, a - Math.PI / 2); }
    [-1, 1].forEach(function (s) { for (var y = y0 + 0.17; y < y0 + h - ancha; y += 0.34) k.caja(0.24, 0.3, 0.16, K.sillar, 2, x + s * (ancha + 0.16), y, 0.04); });
    if (!o.sinEscalon) { k.caja(w + 0.7, 0.14, 0.5, K.sillarO, 2, x, y0 - 0.07, 0.25); k.caja(w + 1.0, 0.14, 0.8, K.sillar, 2, x, y0 - 0.21, 0.4); }
  }
  function farol(k, x, y, z, luces, colgado) {
    if (colgado) { k.caja(0.05, 0.05, 0.4, K.hierro, 5, x, y + 0.35, z + 0.2); k.cil(0.012, 0.18, K.hierro, 5, x, y + 0.25, z + 0.38, 4); z += 0.38; }
    k.cil(0.13, 0.05, K.hierro, 5, x, y + 0.14, z, 6); k.cil(0.11, 0.24, K.cristal, 4, x, y, z, 6); k.cil(0.13, 0.04, K.hierro, 5, x, y - 0.13, z, 6);
    k.add(gCono(6), M(x, y + 0.24, z, 0, 0, 0, 0.3, 0.16, 0.3), K.hierro, 5); if (luces) luces.push({ x: x, y: y, z: z });
  }
  // balcón volado con canecillos, barandilla torneada y macetas
  function balcon(k, x, y, w, fondo, col) {
    k.caja(w, 0.1, fondo, K.mad, 1, x, y, fondo / 2);
    for (var b = -w / 2 + 0.25; b <= w / 2 - 0.2; b += 0.6) { k.viga(new T3.Vector3(x + b, y - 0.45, 0.02), new T3.Vector3(x + b, y - 0.04, fondo - 0.1), 0.08, K.madO); }
    for (var p = -w / 2 + 0.06; p <= w / 2; p += 0.16) { k.cil(0.025, 0.56, col || K.blanco, 1, x + p, y + 0.33, fondo - 0.06, 5); }
    [-1, 1].forEach(function (s) { for (var q = 0.1; q < fondo - 0.1; q += 0.16) k.cil(0.025, 0.56, col || K.blanco, 1, x + s * (w / 2 - 0.03), y + 0.33, q, 5); });
    k.caja(w + 0.06, 0.06, 0.1, col || K.blanco, 1, x, y + 0.63, fondo - 0.06); [-1, 1].forEach(function (s) { k.caja(0.1, 0.06, fondo, col || K.blanco, 1, x + s * (w / 2 - 0.03), y + 0.63, fondo / 2); });
    [[-w / 2 + 0.35, 0xd8304a], [w / 2 - 0.4, 0xf2a2c0]].forEach(function (q) { k.cil(0.13, 0.2, 0xb0603a, 8, x + q[0], y + 0.15, fondo * 0.45, 7); for (var f = 0; f < 4; f++) k.esf(0.11, K.verdeH, 6, x + q[0] + (f - 1.5) * 0.07, y + 0.33, fondo * 0.45 + (f % 2) * 0.06, 1, 1, 1, 5); k.esf(0.06, q[1], 8, x + q[0], y + 0.42, fondo * 0.5, 1, 1, 1, 5); });
  }
  // FALDÓN de tejado con tejas una a una. Marco: origen en el alero, -z hacia la cumbrera, inclinado «ang».
  function faldon(k, o) {
    var ang = Math.atan2(o.rise, o.run), L = Math.hypot(o.run, o.rise), r = k.r, du = 0.4, ds = 0.52;
    k.en(M(o.x, o.y, o.z, ang, o.ry, 0), function () {
      var hw = function (s) { return o.hwA + (o.hwC - o.hwA) * Math.min(1, s / L); };
      k.quad([-o.hwA, 0, 0], [o.hwA, 0, 0], [o.hwC, 0, -L], [-o.hwC, 0, -L], CANT < 0.5 ? (o.col || K.teja) : K.tejaO, 3);                      // tablero bajo las tejas (se ve entre canales)
      k.quad([o.hwA, -0.12, 0], [-o.hwA, -0.12, 0], [-o.hwC, -0.12, -L], [o.hwC, -0.12, -L], 0x4a2c18, 1);      // cara de abajo (sombra del alero)
      k.caja(2 * o.hwA + 0.04, 0.16, 0.08, K.madO, 1, 0, -0.06, 0.02);                                         // tabla de alero
      for (var u = -o.hwA + 0.25; u < o.hwA - 0.1; u += 0.55) k.caja(0.09, 0.1, 0.42, K.madO, 1, u, -0.16, -0.12); // canecillos
      if (o.paja) { for (var sp = 0; sp < L - 0.05; sp += 0.34) { var wp = hw(sp + 0.17); k.caja(wp * 2 + 0.1, 0.16, 0.42, new T3.Color(o.col || 0xc8a25a).multiplyScalar(0.82 + r() * 0.3).getHex(), 8, 0, 0.06, -sp - 0.2, 0, -0.12, 0, 0.12); } return; } // haces de paja
      if (CANT < 0.5) return;                                                                  // calidad baja: tablero con color de teja, sin tejas sueltas
      for (var s = 0, fila = 0; s < L - 0.05; s += ds, fila++) {
        var w = hw(s + ds / 2), n = Math.floor((w * 2) / du);
        for (var i = 0; i < n; i++) {
          var u2 = -w + du * (i + 0.5) + (w * 2 - n * du) / 2, tono = r() < 0.08 ? 0.78 : r() < 0.1 ? 1.14 : 1;
          k.add(gTeja(), M(u2, 0.02, -s - ds * 0.5, -0.07, 0, 0, du * 0.92, 0.24, ds * 1.22), new T3.Color(o.col || K.teja).multiplyScalar(tono).getHex(), 3, 0.2);
        }
      }
    });
  }
  function cumbrera(k, a, b, col) {
    var d = new T3.Vector3().subVectors(b, a), l = d.length(), n = Math.max(1, Math.round(l / 0.42));
    for (var i = 0; i < n; i++) { var p = a.clone().lerp(b, i / n), q = a.clone().lerp(b, (i + 1.04) / n); k.entre(G.cu || (G.cu = nI(new T3.CylinderGeometry(0.5, 0.5, 1, 5).rotateX(Math.PI / 2))), p, q, 0.34, 0.24, col || K.tejaO, 3); }
  }
  // tejado a cuatro aguas (W a lo largo de x). Devuelve la altura de la cumbrera
  function tejado4(k, W, D, yTop, o) {
    o = o || {}; var oh = o.vuelo || 0.55, tg = Math.tan(o.pend || 0.6), R = D / 2 + oh, rise = R * tg, yE = yTop - oh * tg, rh = Math.max(0, (W - D) / 2), col = o.col;
    var pj = o.paja; faldon(k, { x: 0, y: yE, z: D / 2 + oh, ry: 0, run: R, rise: rise, hwA: W / 2 + oh, hwC: rh, col: col, paja: pj });
    faldon(k, { x: 0, y: yE, z: -(D / 2 + oh), ry: Math.PI, run: R, rise: rise, hwA: W / 2 + oh, hwC: rh, col: col, paja: pj });
    faldon(k, { x: W / 2 + oh, y: yE, z: 0, ry: Math.PI / 2, run: R, rise: rise, hwA: D / 2 + oh, hwC: 0, col: col, paja: pj });
    faldon(k, { x: -(W / 2 + oh), y: yE, z: 0, ry: -Math.PI / 2, run: R, rise: rise, hwA: D / 2 + oh, hwC: 0, col: col, paja: pj });
    var yc = yE + rise + 0.06;
    var cc = col ? new T3.Color(col).multiplyScalar(0.78).getHex() : null; if (rh > 0.05) cumbrera(k, new T3.Vector3(-rh, yc, 0), new T3.Vector3(rh, yc, 0), cc);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { cumbrera(k, new T3.Vector3(q[0] * (W / 2 + oh), yE + 0.06, q[1] * (D / 2 + oh)), new T3.Vector3(q[0] * rh, yc, 0), cc); });
    return yc;
  }
  // tejado a dos aguas con la cumbrera a lo largo de z (el hastial mira al frente)
  function tejado2(k, W, D, yTop, o) {
    o = o || {}; var oh = o.vuelo || 0.5, tg = Math.tan(o.pend || 0.62), R = W / 2 + oh, rise = R * tg, yE = yTop - oh * tg, hl = D / 2 + 0.35;
    faldon(k, { x: W / 2 + oh, y: yE, z: 0, ry: Math.PI / 2, run: R, rise: rise, hwA: hl, hwC: hl, col: o.col, paja: o.paja });
    faldon(k, { x: -(W / 2 + oh), y: yE, z: 0, ry: -Math.PI / 2, run: R, rise: rise, hwA: hl, hwC: hl, col: o.col, paja: o.paja });
    var yc = yE + rise; cumbrera(k, new T3.Vector3(0, yc + 0.06, -hl), new T3.Vector3(0, yc + 0.06, hl), o.col ? new T3.Color(o.col).multiplyScalar(0.78).getHex() : null);
    [-1, 1].forEach(function (s) {    // hastiales y tablas de borde
      k.quad([-W / 2, yTop, s * D / 2], [W / 2, yTop, s * D / 2], [0, yTop + (W / 2) * tg, s * D / 2], [0, yTop + (W / 2) * tg, s * D / 2], o.hastial || K.madC, o.hastial ? 0 : 1);
      if (s < 0) return; [-1, 1].forEach(function (l) { k.viga(new T3.Vector3(l * (W / 2 + oh), yE - 0.05, hl + 0.02), new T3.Vector3(0, yc + 0.02, hl + 0.02), 0.16, K.madO); });
    });
    return yc + 0.06;
  }
  function chimenea(k, x, z, y0, alto, humo) { k.caja(0.62, alto, 0.62, K.sillar, 2, x, y0 + alto / 2, z); k.caja(0.78, 0.12, 0.78, K.sillarO, 2, x, y0 + alto + 0.06, z); k.caja(0.4, 0.14, 0.4, 0x2a2420, 5, x, y0 + alto + 0.18, z); if (humo) humo.push({ x: x, y: y0 + alto + 0.3, z: z }); }
  function barril(k, x, y, z, s, col) { s = s || 1; k.add(gBarril(), M(x, y + 0.45 * s, z, 0, k.r() * 6, 0, 0.9 * s, 0.9 * s, 0.9 * s), col || K.madC, 1, 0.16); [0.12, 0.78].forEach(function (f) { k.add(gCil(10), M(x, y + 0.9 * s * f, z, 0, 0, 0, 0.84 * s, 0.05 * s, 0.84 * s), K.hierro, 5); }); }
  function cajon(k, x, y, z, s, ry) { s = s || 1; k.en(M(x, y, z, 0, ry || 0, 0), function () { k.caja(0.7 * s, 0.6 * s, 0.7 * s, 0xa87a4a, 1, 0, 0.3 * s, 0, 0, 0, 0, 0.18); [-1, 1].forEach(function (a) { k.caja(0.74 * s, 0.07 * s, 0.07 * s, K.madO, 1, 0, 0.3 * s + a * 0.26 * s, 0.35 * s); k.caja(0.07 * s, 0.6 * s, 0.07 * s, K.madO, 1, a * 0.34 * s, 0.3 * s, 0.35 * s); k.caja(0.07 * s, 0.6 * s, 0.07 * s, K.madO, 1, 0.35 * s, 0.3 * s, a * 0.34 * s); }); }); }
  function saco(k, x, y, z, ry) { k.esf(0.3, 0xcbb488, 8, x, y + 0.22, z, 1, 0.75, 0.8, 8); k.esf(0.1, 0xb8a070, 8, x, y + 0.46, z, 1, 1.2, 1, 5); }
  function canon(k, x, y, z, ry, s) { s = s || 1; k.en(M(x, y, z, 0, ry, 0, s), function () { k.caja(0.9, 0.3, 0.7, K.madO, 1, 0, 0.3, 0); [-1, 1].forEach(function (l) { [-0.3, 0.3].forEach(function (zz) { k.add(gCil(10), M(l * 0.4, 0.2, zz, 0, 0, Math.PI / 2, 0.36, 0.08, 0.36), K.mad, 1); }); }); k.add(gCil(10), M(0, 0.55, 0.25, Math.PI / 2 - 0.12, 0, 0, 0.36, 1.5, 0.36), K.hierro, 5); k.add(gCil(10), M(0, 0.62, 0.95, Math.PI / 2 - 0.12, 0, 0, 0.44, 0.14, 0.44), K.hierro, 5); k.esf(0.2, K.hierro, 5, 0, 0.5, -0.5, 1, 1, 1, 8); }); }
  function balas(k, x, y, z) { var n = 0; for (var c = 0; c < 3; c++) for (var i = 0; i < 3 - c; i++) for (var j = 0; j < 3 - c; j++) { k.esf(0.13, 0x24221f, 5, x + (i - (2 - c) / 2) * 0.26, y + 0.13 + c * 0.21, z + (j - (2 - c) / 2) * 0.26, 1, 1, 1, 7); n++; } }
  function letrero(k, x, y, z, tex, grupo, ancho) { k.caja(0.06, 0.06, 0.7, K.hierro, 5, x, y + 0.42, z + 0.35); var m = new T3.Mesh(new T3.PlaneGeometry(ancho || 0.9, (ancho || 0.9) * 0.62), new T3.MeshStandardMaterial({ map: tex, roughness: 0.8, side: T3.DoubleSide })); m.material.userData.tkpSinVentanas = true; m.position.set(x, y, z + 0.66); m.rotation.y = Math.PI / 2; m.castShadow = true; m.raycast = NOOP; grupo.add(m); }

  // texturas pintadas
  function lienzo(w, h, f) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); var t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t; }
  var TX = {};
  function texLetrero(dibujo) { return TX['l' + dibujo] || (TX['l' + dibujo] = lienzo(256, 160, function (x, w, h) {
    x.fillStyle = '#6a4224'; x.fillRect(0, 0, w, h); for (var i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#7a4e2c' : '#5e3a20'; x.fillRect(0, i * 32, w, 30); } x.strokeStyle = '#d8b060'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = '#f0d890'; x.strokeStyle = '#2a1608'; x.lineWidth = 4; x.textAlign = 'center'; x.font = 'bold 84px Georgia,serif'; x.strokeText(dibujo, w / 2, h / 2 + 30); x.fillText(dibujo, w / 2, h / 2 + 30); })); }
  function texToldo(a, b) { var k = 't' + a + b; return TX[k] || (TX[k] = lienzo(256, 128, function (x, w, h) { for (var i = 0; i < 8; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 32, 0, 32, h - 20); x.beginPath(); x.arc(i * 32 + 16, h - 20, 16, 0, Math.PI); x.fill(); } x.fillStyle = 'rgba(0,0,0,.12)'; for (var j = 0; j < 30; j++) x.fillRect(Math.random() * w, Math.random() * (h - 30), 2, 20); })); }
  function toldo(grupo, x, y, z, ancho, fondo, caida, ry, a, b) {
    var g = new T3.PlaneGeometry(ancho, fondo, 1, 4), P = g.attributes.position;
    for (var i = 0; i < P.count; i++) { var v = P.getY(i) / fondo + 0.5; P.setXYZ(i, P.getX(i), -caida * (1 - v) + Math.sin(v * Math.PI) * 0.06, (1 - v) * fondo); } g.computeVertexNormals();
    var m = new T3.Mesh(g, new T3.MeshStandardMaterial({ map: texToldo(a, b), side: T3.DoubleSide, alphaTest: 0.5, roughness: 0.9 })); m.material.userData.tkpSinVentanas = true;
    m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; m.receiveShadow = true; m.raycast = NOOP; grupo.add(m); return m;
  }

  // ======================================================================
  //  LOS TRES EDIFICIOS DE LA DEMO (cambian con el nivel: tramo 1 ≤5, 2 ≤10, 3 ≤15, 4 más)
  //  La parcela mide 7,2 × 7,2: todo cabe en ~7,4 (lo que sobra son escalones y atrezo).
  // ======================================================================
  // A · CUARTEL CORSARIO: planta baja de sillería con portón, piso de entramado volado, torreón de vigía con cañón
  function cuartel(k, g, t, L, humo) {
    var W = 5.4, D = 4.2, z0 = -0.3, pb = 2.3, pa = t >= 2 ? 1.9 : 0;
    k.en(M(-0.6, 0, z0), function () {
      zocalo(k, W + 0.3, D + 0.3, 0.45);
      k.caja(W, pb, D, K.sillar, 2, 0, 0.45 + pb / 2, 0);
      CARAS(W, D).forEach(function (m, i) { k.en(m, function () { var ww = i % 2 ? D : W;
        if (i === 0) { puerta(k, -0.9, { w: 1.5, h: 2.05, y0: 0.45, madera: 0x6a3a1e }); ventana(k, 1.4, 1.65, { w: 0.62, h: 0.8, contra: null, arco: true, marco: K.madO }); farol(k, 0.25, 2.1, 0.05, L, true); }
        else if (i === 1) { ventana(k, -0.9, 1.65, { w: 0.62, h: 0.8, contra: null, arco: true, marco: K.madO }); ventana(k, 0.9, 1.65, { w: 0.62, h: 0.8, contra: null, arco: true, marco: K.madO }); }
        else { ventana(k, 0, 1.65, { w: 0.6, h: 0.8, contra: null, arco: true, marco: K.madO }); } }); });
      var yb = 0.45 + pb;
      k.caja(W + 0.3, 0.16, D + 0.3, K.madO, 1, 0, yb + 0.08, 0);                                          // viga de forjado volada
      for (var c = -W / 2; c <= W / 2 + 0.01; c += W / 6) k.caja(0.12, 0.16, 0.5, K.madO, 1, c, yb - 0.04, D / 2 + 0.1);
      var top = yb + 0.16;
      if (pa) {
        var Wa = W + 0.3, Da = D + 0.3; k.caja(Wa, pa, Da, ID.pared || K.ocre, 0, 0, top + pa / 2, 0);
        CARAS(Wa, Da).forEach(function (m, i) { k.en(m, function () { var ww = i % 2 ? Da : Wa;      // entramado de madera de la fachada
          k.caja(ww + 0.04, 0.14, 0.06, K.madO, 1, 0, top + 0.07, 0.02); k.caja(ww + 0.04, 0.14, 0.06, K.madO, 1, 0, top + pa - 0.07, 0.02);
          var nb = Math.round(ww / 1.15); for (var b = 0; b <= nb; b++) { var bx = -ww / 2 + b * ww / nb; k.caja(0.13, pa, 0.06, K.madO, 1, bx, top + pa / 2, 0.02); if (b < nb && (b % 2 === 0) && i !== 0) { k.viga(new T3.Vector3(bx + 0.06, top + 0.1, 0.03), new T3.Vector3(bx + ww / nb - 0.06, top + pa - 0.1, 0.03), 0.09, K.madO); } }
          if (i < 2) for (var v = 0; v < nb; v++) if (v % 2 === (i === 0 ? 0 : 1) || i === 0) ventana(k, -ww / 2 + (v + 0.5) * ww / nb, top + pa * 0.52, { w: 0.55, h: 0.78, contra: ID.contra || K.contra[1], flores: [0xe8344a, 0xff8ab0, 0xfff2c0] });
          else ventana(k, 0, top + pa * 0.52, { w: 0.55, h: 0.78, contra: K.contra[1] }); }); });
        top += pa;
      }
      var yc = tejado4(k, W + 0.3, D + 0.3, top, { pend: 0.62, vuelo: 0.5, col: ID.techo, paja: ID.paja }); k.info = { yc: yc };
      chimenea(k, 1.3, -0.6, yc - 1.2, 1.7, humo);
      if (t >= 4) { k.cil(0.04, 0.9, K.oro, 7, -0.9, yc + 0.45, 0, 5); k.esf(0.09, K.oro, 7, -0.9, yc + 0.9, 0, 1, 1, 1, 6); }
    });
    // torreón de vigía (tramo 3+)
    if ((t >= 3 && !ID.sinTorre) || ID.torre) { var tx = 2.55, tz = 1.7, ht = ID.torre ? 6.6 + t * 0.4 : 6.2; k.add(gCil(14), M(tx, ht / 2, tz, 0, 0, 0, 2.3, ht, 2.3), K.sillar, 2);
      k.add(gCil(14), M(tx, ht + 0.12, tz, 0, 0, 0, 2.7, 0.24, 2.7), K.sillarO, 2);
      for (var a = 0; a < 10; a++) { var an = a / 10 * Math.PI * 2; k.caja(0.42, 0.5, 0.3, K.sillar, 2, tx + Math.cos(an) * 1.22, ht + 0.49, tz + Math.sin(an) * 1.22, -an + Math.PI / 2); }
      k.en(M(tx, 0, tz), function () { k.en(M(0, 0, 1.12), function () { puerta(k, 0, { w: 0.8, h: 1.6, y0: 0.0, sinEscalon: true }); ventana(k, 0, 3.6, { w: 0.4, h: 0.7, contra: null, arco: true, marco: K.madO }); }); k.en(M(1.12, 0, 0, 0, Math.PI / 2, 0), function () { ventana(k, 0, 2.6, { w: 0.36, h: 0.65, contra: null, arco: true, marco: K.madO }); ventana(k, 0, 4.7, { w: 0.36, h: 0.65, contra: null, arco: true, marco: K.madO }); }); });
      if (ID.conoTorre) { k.add(gCono(14), M(tx, ht + 1.7, tz, 0, 0, 0, 3.0, 2.9, 3.0), ID.techo, 3); k.cil(0.05, 1.0, K.oro, 7, tx, ht + 3.5, tz, 5); k.esf(0.12, K.oro, 7, tx, ht + 4.05, tz, 1, 1, 1, 6); }
      else canon(k, tx, ht + 0.24, tz, 0.5, 0.75);
      farol(k, tx - 0.8, ht + 0.6, tz + 0.6, L);
      if (t >= 4) { k.cil(0.05, 2.6, K.madO, 1, tx - 0.4, ht + 1.5, tz - 0.6, 5); I() && I().bandera(g, tx - 0.4, ht + 2.5, tz - 0.6, 1.4, 0.95, 0); }
    }
    // atrezo: cañón en la puerta, pirámide de balas, armero, barriles
    if (ID.sinAtrezo) return;
    canon(k, -2.9, 0, 2.5, 0.3, 0.8); balas(k, -1.9, 0, 3.05); barril(k, 1.0, 0, 2.6); barril(k, 1.55, 0, 2.9, 0.85); cajon(k, 1.2, 0.0, 3.3, 0.8, 0.3);
    k.caja(1.2, 0.08, 0.12, K.madO, 1, -3.3, 0.9, -0.2, Math.PI / 2); for (var e = 0; e < 4; e++) k.caja(0.05, 1.0, 0.05, 0xb8b8c0, 5, -3.32, 0.75, -0.6 + e * 0.27, 0, 0, 0.15);
  }
  // B · LONJA DEL PUERTO (almacén): madera sobre sillería, portalón abierto, polea con fardo, hastial al frente y puesto con toldo
  function lonja(k, g, t, L, humo) {
    var W = 4.6, D = 5.4, x0 = -0.5, z0 = -0.5, h1 = 2.6, h2 = t >= 2 ? 1.6 : 0;
    k.en(M(x0, 0, z0), function () {
      zocalo(k, W + 0.3, D + 0.3, 0.55);
      k.caja(W, h1 + h2, D, ID.pared || K.madC, ID.pared ? 0 : 1, 0, 0.55 + (h1 + h2) / 2, 0);
      CARAS(W, D).forEach(function (m, i) { k.en(m, function () { var ww = i % 2 ? D : W;
        for (var b = -ww / 2 + 0.2; b < ww / 2; b += 0.4) k.caja(0.08, h1 + h2, 0.05, K.mad, 1, b, 0.55 + (h1 + h2) / 2, 0.02);   // tablas y tapajuntas
        k.caja(ww + 0.06, 0.16, 0.08, K.madO, 1, 0, 0.55 + h1, 0.03); [-1, 1].forEach(function (s) { k.caja(0.18, h1 + h2, 0.1, K.madO, 1, s * ww / 2, 0.55 + (h1 + h2) / 2, 0.03); });
        if (i === 0) { // portalón abierto con el interior oscuro y mercancía
          k.caja(1.9, 2.1, 0.1, 0x180f08, 8, 0, 0.55 + 1.05, 0.0); k.caja(2.1, 0.16, 0.14, K.madO, 1, 0, 0.55 + 2.12, 0.05);
          [-1, 1].forEach(function (s) { k.en(M(s * 0.95, 0.55, 0.06, 0, s * 1.9, 0), function () { for (var p = 0; p < 4; p++) k.caja(0.23, 2.05, 0.06, K.mad, 1, s * (0.12 + p * 0.235), 1.03, 0); k.viga(new T3.Vector3(s * 0.05, 0.2, 0.05), new T3.Vector3(s * 0.9, 1.85, 0.05), 0.09, K.madO); k.caja(0.95, 0.09, 0.07, K.madO, 1, s * 0.47, 0.25, 0.05); k.caja(0.95, 0.09, 0.07, K.madO, 1, s * 0.47, 1.8, 0.05); }); });
          cajon(k, -0.4, 0.55, -0.4, 0.8, 0.2); barril(k, 0.45, 0.55, -0.5, 0.8);
          if (h2) { ventana(k, 0, 0.55 + h1 + h2 * 0.5, { w: 0.9, h: 0.9, contra: null, marco: K.madO }); }
        } else if (i === 1) { ventana(k, -1.2, 1.9, { w: 0.6, h: 0.8, contra: ID.contra || K.contra[0], marco: K.madO }); ventana(k, 1.2, 1.9, { w: 0.6, h: 0.8, contra: ID.contra || K.contra[0], marco: K.madO }); if (h2) ventana(k, 0, 0.55 + h1 + h2 * 0.5, { w: 0.55, h: 0.7, contra: K.contra[0], marco: K.madO }); }
        else ventana(k, 0, 1.9, { w: 0.6, h: 0.8, contra: K.contra[0], marco: K.madO }); }); });
      var top = 0.55 + h1 + h2, yc = tejado2(k, W, D, top, { pend: 0.68, vuelo: 0.5, hastial: ID.pared || K.madC, col: ID.techo, paja: ID.paja }); k.info = { yc: yc };
      // óculo en el hastial y viga de la polea con su fardo colgando
      k.add(gToro(), M(0, top + 0.75, D / 2 + 0.05, 0, 0, 0, 0.85, 0.85, 1.4), K.madO, 1); k.add(gCil(12), M(0, top + 0.75, D / 2 + 0.02, Math.PI / 2, 0, 0, 0.7, 0.04, 0.7), K.cristal, 4);
      k.caja(0.2, 0.2, 1.7, K.madO, 1, 0, top + 0.1, D / 2 + 0.75); k.cil(0.13, 0.08, K.hierro, 5, 0, top - 0.02, D / 2 + 1.45, 10, 0, 0, Math.PI / 2);
      k.cuerda(new T3.Vector3(0, top - 0.05, D / 2 + 1.5), new T3.Vector3(0, top - 1.1, D / 2 + 1.5), 0.04, 0xc8b088); cajon(k, 0, top - 1.65, D / 2 + 1.5, 0.75, 0.4);
      if (t >= 3 || ID.fragua) chimenea(k, -1.2, -1.5, yc - 1.4, ID.fragua ? 2.6 : 1.6, humo);
      if (t >= 4) { k.cil(0.04, 1.0, K.oro, 7, 0, yc + 0.5, -D / 2 + 0.6, 5); k.add(gCono(4), M(0.18, yc + 0.95, -D / 2 + 0.6, 0, 0, -Math.PI / 2, 0.16, 0.42, 0.04), K.oro, 7); }
    });
    if (ID.sinPuesto) { barril(k, -2.9, 0, 2.7); cajon(k, -3.0, 0, 1.9, 0.9, 0.1); return; }
    // puesto de frutas con toldo al costado de la calle
    var px = 2.45, pz = 0.6; k.caja(1.2, 0.85, 2.6, K.mad, 1, px, 0.42, pz); k.caja(1.32, 0.08, 2.72, K.madO, 1, px, 0.88, pz);
    [[-0.55, -1.25], [0.55, -1.25], [-0.55, 1.25], [0.55, 1.25]].forEach(function (q) { k.cil(0.05, 2.1, K.madO, 1, px + q[0], 1.05, pz + q[1], 5); });
    var fr = [[0xf2cc30, 0.11], [0x6a4a2a, 0.13], [0xe8542a, 0.1], [0x8ac83a, 0.1]];
    for (var f = 0; f < 4; f++) for (var q = 0; q < 6; q++) k.esf(fr[f][1], fr[f][0], 8, px - 0.35 + (q % 3) * 0.35, 1.0 + (q > 2 ? 0.08 : 0), pz - 1.0 + f * 0.65 + (q > 2 ? 0.18 : 0), 1, f === 0 ? 0.6 : 1, f === 0 ? 2.2 : 1, 6);
    toldo(g, px + 0.65, 2.15, pz, 2.9, 1.6, 0.35, Math.PI / 2, ID.toldo ? ID.toldo[0] : '#d8342a', ID.toldo ? ID.toldo[1] : '#f4ead2');
    barril(k, -2.9, 0, 2.7); barril(k, -2.35, 0, 2.95, 0.85); barril(k, -2.65, 0.82, 2.8, 0.75); saco(k, 1.2, 0, 2.9); saco(k, 1.6, 0, 2.7); saco(k, 1.4, 0.3, 2.82); cajon(k, -3.0, 0, 1.9, 0.9, 0.1);
    farol(k, -0.5 + 1.25, 2.3, z0 + D / 2 + 0.06, L, true);
    k.add(gToro(), M(1.9, 0.06, 2.5, Math.PI / 2, 0, 0, 0.6, 0.6, 1.6), 0xc8b088, 8);   // rollo de cuerda
  }
  // C · CASA DEL GOBERNADOR (embajada, salón y el resto): soportales de piedra, dos pisos de cal turquesa con balcón corrido, cuatro aguas con buhardilla
  function gobernador(k, g, t, L, humo, col) {
    var W = 5.6, D = 4.4, x0 = -0.4, z0 = -0.6, pb = 2.4, ps = t >= 2 ? 2.0 : 0, p3 = t >= 3 ? 1.8 : 0;
    k.en(M(x0, 0, z0), function () {
      zocalo(k, W + 0.3, D + 0.3, 0.4);
      k.caja(W, pb, D, ID.base || K.cal1, 0, 0, 0.4 + pb / 2, 0); cadenas(k, W, D, 0.4, pb);
      CARAS(W, D).forEach(function (m, i) { k.en(m, function () {
        if (i === 0) { puerta(k, 0, { w: 1.25, h: 2.1, y0: 0.4, madera: 0x2f5f6a }); [-1, 1].forEach(function (s) { ventana(k, s * 1.75, 1.6, { w: 0.7, h: 1.15, contra: null, arco: true, marco: K.blanco }); farol(k, s * 0.95, 1.9, 0.05, L, true); }); }
        else if (i === 1) { ventana(k, -1.0, 1.6, { w: 0.7, h: 1.15, contra: null, arco: true }); ventana(k, 1.0, 1.6, { w: 0.7, h: 1.15, contra: null, arco: true }); }
        else ventana(k, 0, 1.6, { w: 0.7, h: 1.15, contra: null, arco: true }); }); });
      var top = 0.4 + pb; cornisa(k, W, D, top - 0.2);
      [[ps, ID.pared || col || K.turq], [p3, ID.pared2 || K.coral]].forEach(function (pl, n) { var h = pl[0]; if (!h) return;
        k.caja(W, h, D, pl[1], 0, 0, top + h / 2, 0); cadenas(k, W, D, top, h);
        CARAS(W, D).forEach(function (m, i) { k.en(m, function () { var ww = i % 2 ? D : W, nv = i % 2 ? 2 : 3;
          for (var v = 0; v < nv; v++) ventana(k, -ww / 2 + (v + 0.5) * ww / nv, top + h * 0.5, { w: 0.62, h: 1.05, contra: ID.contra || K.contra[n === 0 ? 2 : 0], flores: [0xe8344a, 0xff9ac0, 0xffd24a] });
          if (n === 0 && i === 0) balcon(k, 0, top + 0.06, W - 0.6, 0.85); if (n === 0 && i === 1) balcon(k, 0, top + 0.06, D - 0.8, 0.7);
        }); });
        top += h; if (n === 0 && p3) cornisa(k, W, D, top - 0.18); else k.caja(W + 0.16, 0.14, D + 0.16, K.blanco, 8, 0, top - 0.3, 0);   // bajo el alero, sin asomar entre las tejas
      });
      var yc = tejado4(k, W + 0.1, D + 0.1, top, { pend: 0.66, vuelo: 0.6, col: ID.techo || 0xb24a2a }); k.info = { yc: yc };
      // buhardilla en el faldón delantero
      var yb = top + 0.35, zb = D / 2 - 0.55; k.caja(1.0, 0.9, 1.1, K.blanco, 0, 0.9, yb + 0.45, zb); k.en(M(0.9, 0, zb + 0.55), function () { ventana(k, 0, yb + 0.48, { w: 0.5, h: 0.6, contra: null }); });
      faldon(k, { x: 0.9 + 0.72, y: yb + 0.85, z: zb, ry: Math.PI / 2, run: 0.72, rise: 0.5, hwA: 0.72, hwC: 0.72 }); faldon(k, { x: 0.9 - 0.72, y: yb + 0.85, z: zb, ry: -Math.PI / 2, run: 0.72, rise: 0.5, hwA: 0.72, hwC: 0.72 });
      chimenea(k, -1.5, -0.8, yc - 1.4, 1.9, humo); chimenea(k, 1.7, -0.9, yc - 1.6, 1.8, humo);
      if (t >= 4) { k.cil(0.05, 1.2, K.oro, 7, -0.4, yc + 0.6, 0, 5); k.esf(0.12, K.oro, 7, -0.4, yc + 1.2, 0, 1, 1, 1, 8); k.cil(0.04, 2.4, K.madO, 1, 2.3, yc - 0.3, 0.9, 5); I() && I().bandera(g, x0 + 2.3, yc + 0.6, z0 + 0.9, 1.3, 0.85, 0, 'roja'); }
    });
    // macetas con palmitos y bancos a los lados de la entrada
    [-1, 1].forEach(function (s) { var x = x0 + s * 1.3, z = z0 + D / 2 + 1.25; k.cil(0.32, 0.5, 0xb8663e, 8, x, 0.25, z, 10); k.cil(0.36, 0.08, 0xc87a4a, 8, x, 0.52, z, 10); for (var h = 0; h < 7; h++) { var a = h / 7 * Math.PI * 2; k.viga(new T3.Vector3(x, 0.55, z), new T3.Vector3(x + Math.cos(a) * 0.55, 1.25 + (h % 2) * 0.2, z + Math.sin(a) * 0.55), 0.13, 0x3f8a2a, 6); } });
    k.caja(1.2, 0.08, 0.4, K.mad, 1, x0 + 2.7, 0.45, z0 + D / 2 + 0.9); [-0.5, 0.5].forEach(function (d) { k.caja(0.08, 0.45, 0.35, K.hierro, 5, x0 + 2.7 + d, 0.22, z0 + D / 2 + 0.9); });
  }
  // D · CABAÑA: casita de una planta sobre pilotes con tejado de paja (crece un poco con el nivel)
  function cabana(k, g, t, L, humo) {
    var e = 0.8 + t * 0.06, W = 4.0 * e, D = 3.4 * e, h = 2.0;
    for (var i = -1; i <= 1; i += 2) for (var j = -1; j <= 1; j += 2) k.cil(0.14, 0.7, K.madO, 1, i * (W / 2 - 0.15), 0.35, j * (D / 2 - 0.15), 6);
    k.caja(W + 0.5, 0.14, D + 0.5, K.mad, 1, 0, 0.7, 0); k.caja(W, h, D, ID.pared, 0, 0, 0.77 + h / 2, 0);
    CARAS(W, D).forEach(function (m, i) { k.en(m, function () {
      if (i === 0) { puerta(k, -0.5, { w: 0.9, h: 1.65, y0: 0.77, sinEscalon: true, madera: K.madO }); ventana(k, 0.9, 1.75, { w: 0.6, h: 0.75, contra: ID.contra, flores: [0xe8344a, 0xffd24a] }); for (var st = 0; st < 3; st++) k.caja(1.0, 0.1, 0.3, K.mad, 1, -0.5, 0.15 + st * 0.22, 0.95 - st * 0.28); }
      else if (i === 1) ventana(k, 0, 1.75, { w: 0.6, h: 0.75, contra: ID.contra, flores: [0xff9ac0, 0xffffff] }); }); });
    var yc = tejado4(k, W, D, 0.77 + h, { pend: 0.75, vuelo: 0.45, col: 0xc8a25a, paja: true }); k.info = { yc: yc };
    if (t >= 2) chimenea(k, W / 2 - 0.6, -D / 2 + 0.6, yc - 1.3, 1.4, humo);
    farol(k, 0.4, 2.3, D / 2 + 0.06, L, true); barril(k, -W / 2 - 0.4, 0, D / 2 + 0.2, 0.8); k.add(gToro(), M(W / 2 + 0.3, 0.06, D / 2 + 0.6, Math.PI / 2, 0, 0, 0.6, 0.6, 1.6), 0xc8b088, 8);
  }
  // ---------- lo propio de cada tipo (para distinguirlos de un vistazo) ----------
  function dianas(k) { [-2.6, -1.2, 0.2].forEach(function (x) { k.en(M(x, 0, 3.0, 0, 0.2, 0), function () { k.viga(new T3.Vector3(-0.35, 0, -0.25), new T3.Vector3(0, 1.4, 0), 0.07, K.madO); k.viga(new T3.Vector3(0.35, 0, -0.25), new T3.Vector3(0, 1.4, 0), 0.07, K.madO);
    [[0.48, 0xf4ecd8], [0.38, 0xd8342a], [0.27, 0xf4ecd8], [0.16, 0xd8342a], [0.07, 0xf2c030]].forEach(function (q, n) { k.add(gCil(14), M(0, 1.05, 0.02 + n * 0.012, Math.PI / 2, 0, 0, q[0] * 2, 0.08, q[0] * 2), q[1], 8); }); }); });
    k.caja(1.0, 0.6, 0.6, 0xd8b860, 8, 1.6, 0.3, 3.0); for (var f = 0; f < 5; f++) k.cil(0.02, 0.8, K.madC, 1, 1.4 + f * 0.1, 0.9, 3.0, 4, 0.2 * (f - 2)); }
  function carpas(k, t) { [[-2.4, 2.4, 0xc8342a], [-0.6, 2.9, 0xf4ecd8]].forEach(function (q) { k.add(gCono(8), M(q[0], 0.9, q[1], 0, 0.4, 0, 1.8, 1.8, 1.8), q[2], 8); k.cil(0.03, 2.1, K.madO, 1, q[0], 1.05, q[1], 4); k.caja(0.4, 0.8, 0.05, 0x2a1a10, 8, q[0], 0.4, q[1] + 0.72, 0.4); });
    k.caja(1.4, 0.06, 0.1, K.madO, 1, 1.5, 1.0, 3.2); for (var l = 0; l < 4; l++) { k.caja(0.04, 1.3, 0.04, 0xb8b8c0, 5, 1.0 + l * 0.32, 0.95, 3.25, 0, 0, 0.12); k.esf(0.06, 0xb8b8c0, 5, 1.0 + l * 0.32, 1.65, 3.25, 1, 1, 1, 5); } }
  function fragua(k, L) { k.caja(1.2, 0.8, 1.0, K.sillarO, 2, 2.3, 0.4, 1.4); k.caja(0.9, 0.16, 0.7, 0x1a0f08, 9, 2.3, 0.86, 1.4); for (var c = 0; c < 6; c++) k.esf(0.1, 0xff7a20, 9, 2.0 + (c % 3) * 0.28, 0.92, 1.25 + ((c / 3) | 0) * 0.3, 1, 0.6, 1, 5); L.push({ x: 2.3, y: 1.1, z: 1.4 });
    k.caja(0.3, 0.6, 0.3, K.madO, 1, 2.4, 0.3, 2.9); k.caja(0.75, 0.22, 0.32, 0x3a3a40, 5, 2.4, 0.72, 2.9); k.add(gCono(6), M(2.86, 0.74, 2.9, 0, 0, -Math.PI / 2, 0.24, 0.35, 0.24), 0x3a3a40, 5); k.caja(0.06, 0.06, 0.5, K.madC, 1, 2.3, 0.88, 2.6, 0.5); k.caja(0.18, 0.12, 0.12, 0x3a3a40, 5, 2.3, 0.88, 2.38); }
  function cuadra(k) { for (var x = -3.0; x <= 0.6; x += 0.9) { k.cil(0.06, 1.0, K.madC, 1, x, 0.5, 3.1, 5); } [0.45, 0.85].forEach(function (y) { k.caja(3.7, 0.08, 0.06, K.madC, 1, -1.2, y, 3.1); });
    [[-2.4, 2.3], [-1.6, 2.4], [-2.0, 2.4, 0.6]].forEach(function (q) { k.add(gCil(10), M(q[0], 0.3 + (q[2] || 0), q[1], Math.PI / 2, 0.3, 0, 0.6, 0.8, 0.6), 0xd8b860, 8); });
    k.en(M(1.6, 0, 2.5, 0, 0.9, 0), function () { k.caja(1.2, 0.5, 0.45, 0x6a3a1e, 8, 0, 0.95, 0); k.caja(0.32, 0.6, 0.3, 0x6a3a1e, 8, 0.65, 1.3, 0, 0, 0, -0.5); k.caja(0.22, 0.4, 0.26, 0x5a3018, 8, 0.92, 1.55, 0, 0, 0, -1.1); [[-0.45, -0.14], [-0.45, 0.14], [0.45, -0.14], [0.45, 0.14]].forEach(function (p) { k.caja(0.1, 0.72, 0.1, 0x4a2a14, 8, p[0], 0.36, p[1]); }); k.caja(0.08, 0.5, 0.08, 0x2a1a10, 8, -0.66, 0.9, 0, 0, 0, 0.6); }); }
  function observatorio(k) { var y = (k.info && k.info.yc) || 7; k.add(gEsf(14), M(-0.4, y - 0.3, -0.6, 0, 0, 0, 1.9, 1.5, 1.9), 0x3a7ab0, 3); k.cil(0.97, 0.2, K.oro, 7, -0.4, y - 0.35, -0.6, 14); k.add(gCil(8), M(0.1, y + 0.4, -0.3, 0.5, 0, -0.6, 0.18, 1.3, 0.18), K.oro, 7); }
  function botica(k) { [[-2.6, 2.7], [-1.4, 2.9]].forEach(function (q) { k.caja(1.0, 0.35, 0.6, K.mad, 1, q[0], 0.18, q[1]); for (var h = 0; h < 6; h++) k.esf(0.12, [0x5aa83a, 0x8ac850, 0xb8d870][h % 3], 6, q[0] - 0.35 + (h % 3) * 0.35, 0.45, q[1] - 0.12 + ((h / 3) | 0) * 0.24, 1, 1.3, 1, 5); });
    k.en(M(1.9, 0, 2.6), function () { k.cil(0.05, 2.2, K.madO, 1, 0, 1.1, 0, 5); k.caja(0.7, 0.22, 0.08, 0x2f9a4a, 8, 0, 2.0, 0.05); k.caja(0.22, 0.7, 0.08, 0x2f9a4a, 8, 0, 2.0, 0.05); }); }
  function banderas(k, g) { var y = 0; [-1.6, 1.6].forEach(function (x, i) { k.cil(0.05, 3.4, K.blanco, 1, x - 0.4, 1.7, 2.3, 6); k.esf(0.08, K.oro, 7, x - 0.4, 3.45, 2.3, 1, 1, 1, 6); I() && I().bandera(g, x - 0.4, 3.1, 2.3, 1.1, 0.75, 0, i ? 'roja' : 'negra'); }); }
  function escudos(k) { var y = (k.info && k.info.yc) || 7; [-1.2, 0.4].forEach(function (x, i) { k.en(M(x - 0.4, 3.1, 1.66), function () { k.add(gCil(12), M(0, 0, 0, Math.PI / 2, 0, 0, 0.7, 0.08, 0.8), i ? 0x2a5a9a : 0xa82a22, 8); k.cil(0.12, 0.1, K.oro, 7, 0, 0, 0.06, 8, Math.PI / 2); }); });
    k.en(M(-0.4, y + 0.1, -0.6), function () { k.cil(0.35, 0.18, K.oro, 7, 0, 0, 0, 12); for (var p = 0; p < 6; p++) { var a = p / 6 * Math.PI * 2; k.add(gCono(4), M(Math.cos(a) * 0.3, 0.28, Math.sin(a) * 0.3, 0, 0, 0, 0.16, 0.36, 0.16), K.oro, 7); } }); }
  function puestos(k, g) { [[-2.6, 2.9, '#2f7fd8', '#f4ead2'], [-1.0, 3.1, '#f2c030', '#c8342a']].forEach(function (q) { k.caja(1.1, 0.8, 0.7, K.mad, 1, q[0], 0.4, q[1]); for (var f = 0; f < 6; f++) k.esf(0.1, [0xd83a2a, 0xf2a020, 0x8ac83a][f % 3], 8, q[0] - 0.35 + (f % 3) * 0.35, 0.88, q[1] - 0.12 + ((f / 3) | 0) * 0.22, 1, 1, 1, 5); [-0.5, 0.5].forEach(function (d) { k.cil(0.04, 1.8, K.madO, 1, q[0] + d, 0.9, q[1] - 0.3, 4); }); toldo(g, q[0], 1.8, q[1] - 0.3, 1.3, 0.9, 0.25, 0, q[2], q[3]); }); }
  function mastil(k, L) { var x = -2.9, z = 2.7, h = 6.5; k.cil(0.12, h, K.madO, 1, x, h / 2, z, 6); k.cil(0.5, 0.35, K.mad, 1, x, h - 0.6, z, 10); for (var r = 0; r < 4; r++) { var a = r * Math.PI / 2; k.viga(new T3.Vector3(x + Math.cos(a) * 1.0, 0, z + Math.sin(a) * 1.0), new T3.Vector3(x, h * 0.7, z), 0.05, 0xc8b088); }
    k.cil(0.3, 0.3, K.hierro, 5, x, h + 0.15, z, 8); k.esf(0.22, 0xff8a20, 9, x, h + 0.38, z, 1, 1.2, 1, 6); L.push({ x: x, y: h + 0.4, z: z, faro: true }); }
  // tipo → modelo, colores y lo suyo. ban = color del estandarte; ico = su dibujo
  var IDENT = {
    cuartel:    { m: cuartel, pared: 0xd89a3a, techo: 0xb8552f, contra: 0xa83a2a, ban: '#a82a22', ico: 'espadas' },
    torre:      { m: cuartel, pared: 0xa09a8e, techo: 0x4a4a54, contra: 0x2f4f7a, torre: true, conoTorre: true, sinAtrezo: true, ban: '#2a3a6a', ico: 'escudo' },
    vigia:      { m: cuartel, pared: 0x8a6a4a, techo: 0x5a3a22, contra: 0x2f6a3a, sinTorre: true, sinAtrezo: true, extra: function (k, g, t, L) { mastil(k, L); }, ban: '#2a6a3a', ico: 'ojo' },
    galeria:    { m: cuartel, pared: 0x8aa850, techo: 0x8e3c22, contra: 0x5a3a1a, sinTorre: true, sinAtrezo: true, extra: dianas, ban: '#c89a20', ico: 'diana' },
    relevo:     { m: gobernador, base: 0xf2ece0, pared: 0xf4f0e6, pared2: 0xc8342a, techo: 0x9a2a20, contra: 0xc8342a, extra: carpas, ban: '#c8342a', ico: 'bandera' },
    almacen:    { m: lonja, techo: 0x6e6e74, contra: 0x4a3020, ban: '#6a4a2a', ico: 'barril' },
    mercado:    { m: lonja, pared: 0xf0c040, techo: 0xd8682a, contra: 0x2f7fd8, toldo: ['#2f7fd8', '#f4ead2'], extra: function (k, g) { puestos(k, g); }, ban: '#e0a020', ico: 'moneda' },
    herreria:   { m: lonja, pared: 0x5e544a, techo: 0x3a3634, contra: 0x2a2a2a, fragua: true, sinPuesto: true, extra: function (k, g, t, L) { fragua(k, L); }, ban: '#3a3a3a', ico: 'martillo' },
    establo:    { m: lonja, pared: 0xa83a2a, techo: 0xc8a25a, paja: true, contra: 0xf4ecd8, sinPuesto: true, extra: cuadra, ban: '#8a3a1a', ico: 'herradura' },
    academia:   { m: gobernador, base: 0xeae4d8, pared: 0x8ac6dc, pared2: 0x5a8ad0, techo: 0x2f6f8a, contra: 0x2a4f9a, extra: observatorio, ban: '#2a5a9a', ico: 'libro' },
    enfermeria: { m: gobernador, base: 0xf6f2ea, pared: 0xfaf6ee, pared2: 0xbfe0c8, techo: 0x4f8a4a, contra: 0x2f8a4a, extra: botica, ban: '#2f8a4a', ico: 'cruz' },
    embajada:   { m: gobernador, pared: 0x38b4a6, pared2: 0xe8704c, techo: 0xb24a2a, contra: 0x2a5f8a, extra: banderas, ban: '#1f7f86', ico: 'pergamino' },
    salon:      { m: gobernador, base: 0xd8b8a0, pared: 0xb85a6a, pared2: 0x8a3a5a, techo: 0x5a2a4a, contra: 0x6a2a5a, extra: escudos, ban: '#6a2a6a', ico: 'corona' },
    cabana:     { m: cabana, techo: 0xc8a25a, paja: true, ban: '#8a6a3a', ico: 'casa' }
  };
  var PASTEL = [0xe8a0a2, 0x7ec0d6, 0xf2c84b, 0x8fd18a, 0xe8775a, 0x3fb7b0];
  var ID = {};
  // estandarte del tipo junto a la entrada (se ve desde lejos)
  function texEstandarte(col, ico) { var key = 'e' + col + ico; return TX[key] || (TX[key] = lienzo(128, 192, function (x, w, h) {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, h); x.lineTo(w / 2, h - 34); x.lineTo(0, h); x.closePath(); x.fill();
    x.strokeStyle = '#e8c060'; x.lineWidth = 7; x.stroke(); x.fillStyle = '#fff4d8'; x.strokeStyle = '#fff4d8'; x.lineCap = 'round'; x.lineJoin = 'round'; x.save(); x.translate(w / 2, 74);
    var L = function (pts, ancho) { x.lineWidth = ancho; x.beginPath(); x.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); };
    var C = function (r, relleno) { x.beginPath(); x.arc(0, 0, r, 0, 6.283); relleno ? x.fill() : x.stroke(); };
    ({ espadas: function () { L([-30, -30, 30, 30], 8); L([30, -30, -30, 30], 8); L([-22, 10, -10, 22], 6); L([22, 10, 10, 22], 6); },
       escudo: function () { x.beginPath(); x.moveTo(0, -34); x.lineTo(30, -24); x.lineTo(26, 10); x.quadraticCurveTo(18, 30, 0, 38); x.quadraticCurveTo(-18, 30, -26, 10); x.lineTo(-30, -24); x.closePath(); x.fill(); },
       ojo: function () { x.lineWidth = 7; x.beginPath(); x.ellipse(0, 0, 34, 20, 0, 0, 6.283); x.stroke(); C(11, true); },
       diana: function () { x.lineWidth = 7; C(32); C(19); C(7, true); },
       bandera: function () { L([-22, 38, -22, -36], 7); x.beginPath(); x.moveTo(-20, -34); x.lineTo(30, -22); x.lineTo(-20, -6); x.closePath(); x.fill(); },
       barril: function () { x.beginPath(); x.ellipse(0, 0, 24, 34, 0, 0, 6.283); x.fill(); x.strokeStyle = col; L([-23, -14, 23, -14], 5); L([-23, 14, 23, 14], 5); },
       moneda: function () { C(32, true); x.strokeStyle = col; x.lineWidth = 5; C(22); x.fillStyle = col; x.font = 'bold 34px Georgia'; x.textAlign = 'center'; x.fillText('$', 0, 12); },
       martillo: function () { L([-22, 30, 14, -6], 9); x.save(); x.rotate(-0.78); x.fillRect(-4, -46, 34, 22); x.restore(); },
       herradura: function () { x.lineWidth = 11; x.beginPath(); x.arc(0, 0, 26, 0.35, Math.PI * 2 - 0.35 + Math.PI, true); x.stroke(); },
       libro: function () { x.fillRect(-32, -22, 29, 44); x.fillRect(3, -22, 29, 44); },
       cruz: function () { x.fillRect(-10, -32, 20, 64); x.fillRect(-32, -10, 64, 20); },
       pergamino: function () { x.fillRect(-22, -30, 44, 60); x.beginPath(); x.arc(-22, -30, 8, 0, 6.283); x.arc(22, 30, 8, 0, 6.283); x.fill(); x.strokeStyle = col; L([-12, -14, 12, -14], 4); L([-12, 0, 12, 0], 4); L([-12, 14, 6, 14], 4); },
       corona: function () { x.beginPath(); x.moveTo(-32, 22); x.lineTo(-32, -16); x.lineTo(-16, 4); x.lineTo(0, -28); x.lineTo(16, 4); x.lineTo(32, -16); x.lineTo(32, 22); x.closePath(); x.fill(); },
       casa: function () { x.beginPath(); x.moveTo(-30, 0); x.lineTo(0, -30); x.lineTo(30, 0); x.lineTo(22, 0); x.lineTo(22, 30); x.lineTo(-22, 30); x.lineTo(-22, 0); x.closePath(); x.fill(); x.fillStyle = col; x.fillRect(-7, 10, 14, 20); }
    }[ico] || function () {})(); x.restore(); })); }
  function estandarteTipo(k, g) {
    if (!ID.ban) return; var x = -3.35, z = 3.35, h = 4.6;
    k.cil(0.06, h, K.madO, 1, x, h / 2, z, 6); k.caja(1.45, 0.08, 0.08, K.madO, 1, x + 0.7, h - 0.1, z); k.esf(0.09, K.oro, 7, x, h + 0.05, z, 1, 1, 1, 6);
    var m = new T3.Mesh(new T3.PlaneGeometry(1.35, 2.0), new T3.MeshStandardMaterial({ map: texEstandarte(ID.ban, ID.ico), side: T3.DoubleSide, roughness: 0.85 })); m.material.userData.tkpSinVentanas = true;
    m.position.set(x + 0.72, h - 1.15, z); m.castShadow = true; m.raycast = NOOP; g.add(m);
  }
  // ======================================================================
  //  CASTILLO DE LA 2.ª VILLA: delante de la calavera crece una fortaleza que mejora con cada pocos niveles
  //  Nv 1-3 empalizada y caseta · 4+ muralla de piedra con portón · 7+ torres con tejado · 10+ cañones y faroles en el adarve
  //  13+ torres altas con bandera y segunda muralla · 16+ braseros encendidos y remates de oro · 20+ torre del homenaje · 25+ calaveras de oro
  //  Coordenadas de la fortaleza (las de js/tk-corsarios.js): x hacia la villa, y arriba (0 = terraza), z de lado. La escalera baja en x 9,5…21.
  // ======================================================================
  function torreta(k, x, z, r, h, techo, nv, L) {
    k.add(gCil(12), M(x, h / 2, z, 0, 0, 0, r * 2, h, r * 2), piedraNv(nv), 2); k.add(gCil(12), M(x, h + 0.1, z, 0, 0, 0, r * 2 + 0.4, 0.2, r * 2 + 0.4), K.sillarO, 2);
    if (techo) { k.add(gCono(12), M(x, h + 0.2 + r * 0.9, z, 0, 0, 0, r * 2 + 0.6, r * 1.8, r * 2 + 0.6), techo, 3); if (nv >= 16) { k.cil(0.05, 1.1, K.oro, 7, x, h + r * 1.8 + 0.7, z, 5); k.esf(nv >= 25 ? 0.32 : 0.14, K.oro, 7, x, h + r * 1.8 + 1.3, z, 1, 1, 1, 8); } if (nv >= 25) k.add(gCil(12), M(x, h + 0.32, z, 0, 0, 0, r * 2 + 0.7, 0.16, r * 2 + 0.7), K.oro, 7); }
    else for (var a = 0; a < 8; a++) { var an = a / 8 * Math.PI * 2; k.caja(0.45, 0.5, 0.3, K.sillar, 2, x + Math.cos(an) * r, h + 0.45, z + Math.sin(an) * r, -an + Math.PI / 2); }
    k.en(M(x + r, 0, z, 0, Math.PI / 2, 0), function () { ventana(k, 0, h * 0.6, { w: 0.4, h: 0.7, contra: null, arco: true, marco: K.madO }); });
  }
  function piedraNv(nv) { return nv >= 20 ? 0xe2d2ae : nv >= 10 ? 0xd2bf98 : K.sillar; }
  function muralla(k, x, z0, z1, h, nv, L, g) {
    var l = Math.abs(z1 - z0), zc = (z0 + z1) / 2, pc = piedraNv(nv); k.caja(1.4, h, l, pc, 2, x, h / 2, zc);
    for (var z = Math.min(z0, z1) + 0.3; z < Math.max(z0, z1) - 0.2; z += 0.9) k.caja(0.5, 0.55, 0.5, pc, 2, x + 0.5, h + 0.27, z);   // almenas
    if (nv >= 25) k.caja(0.12, 0.14, l, K.oro, 7, x + 0.72, h - 0.1, zc);
    if (nv >= 20 && g) for (var bz = Math.min(z0, z1) + 2.4; bz < Math.max(z0, z1) - 1.5; bz += 4.5) { var bm = new T3.Mesh(new T3.PlaneGeometry(1.2, 1.9), new T3.MeshStandardMaterial({ map: texEstandarte('#8a1a1a', 'corona'), side: T3.DoubleSide, roughness: 0.85 })); bm.material.userData.tkpSinVentanas = true; bm.position.set(x + 0.73, h - 1.1, bz); bm.rotation.y = Math.PI / 2; bm.raycast = NOOP; g.add(bm); }
    if (nv >= 10) { for (var c = Math.min(z0, z1) + 1.6; c < Math.max(z0, z1) - 1; c += 4.5) canon(k, x + 0.1, h, c, Math.PI / 2, 0.75); for (var f = Math.min(z0, z1) + 3.8; f < Math.max(z0, z1); f += 4.5) farol(k, x + 0.75, h - 0.5, f, L, true); }
  }
  function fortaleza(nv) {
    var g = new T3.Group(), k = new Kit(900 + nv), L = [], X = 13.2;
    if (nv < 4) { // empalizada de troncos con portón y caseta de guardia
      [[-15, -4.8], [4.8, 15]].forEach(function (q) { for (var z = q[0]; z <= q[1]; z += 0.42) { var h = 2.0 + k.r() * 0.4; k.cil(0.2, h, K.mad, 1, X, h / 2, z, 6); k.add(gCono(6), M(X, h + 0.2, z, 0, 0, 0, 0.42, 0.4, 0.42), K.mad, 1); } });
      [-1, 1].forEach(function (l) { k.cil(0.26, 3.2, K.madO, 1, X, 1.6, l * 4.9, 6); }); k.caja(0.4, 0.3, 10.2, K.madO, 1, X, 3.0, 0);
      k.en(M(X - 3, 0, 9), function () { k.caja(2.4, 1.8, 2.0, K.madC, 1, 0, 0.9, 0); tejado4(k, 2.4, 2.0, 1.8, { pend: 0.7, vuelo: 0.3, col: 0xc8a25a, paja: true }); });
      I() && I().bandera(g, X, 4.2, 0, 1.6, 1.0, 0);
    } else {
      var h = nv >= 13 ? 4.6 : 3.4;
      muralla(k, X, -17, -4.9, h, nv, L, g); muralla(k, X, 4.9, 17, h, nv, L, g);
      // portón con arco, rastrillo y escudo
      var pc = piedraNv(nv); k.caja(1.8, h + 1.4, 1.6, pc, 2, X, (h + 1.4) / 2, -5.6); k.caja(1.8, h + 1.4, 1.6, pc, 2, X, (h + 1.4) / 2, 5.6);
      k.caja(1.8, 1.4, 12.8, pc, 2, X, h + 0.7, 0); for (var z = -6.2; z < 6.4; z += 0.9) k.caja(0.5, 0.55, 0.5, pc, 2, X + 0.6, h + 1.65, z);
      if (nv >= 25) { k.caja(0.12, 0.16, 12.8, K.oro, 7, X + 0.92, h + 1.3, 0); k.add(gCil(16), M(X + 1.0, h + 0.8, 0, 0, 0, Math.PI / 2, 1.9, 0.1, 1.9), K.oro, 7); }
      for (var r = -4.6; r <= 4.6; r += 0.5) k.caja(0.08, 1.0, 0.08, K.hierro, 5, X + 0.75, h - 0.1, r);
      k.add(gCil(14), M(X + 0.95, h + 0.8, 0, 0, 0, Math.PI / 2, 1.5, 0.12, 1.5), 0x141216, 8); k.esf(0.3, K.blanco, 8, X + 1.02, h + 0.9, 0, 0.4, 1, 1, 8);
      var techo = nv >= 20 ? 0xc0552c : nv >= 7 ? 0x3a3236 : null, ht = nv >= 13 ? 8.5 : nv >= 7 ? 6.0 : h + 1.6;
      [-6.6, 6.6].forEach(function (z) { torreta(k, X, z, 1.35, ht, techo, nv, L); });
      [-17.5, 17.5].forEach(function (z) { torreta(k, X, z, 1.2, ht - 1.0, techo, nv, L); });
      if (nv >= 13) { // segunda muralla más baja delante y torres con bandera
        muralla(k, X + 4.6, -12, -4.6, 2.2, Math.min(nv, 19), L); muralla(k, X + 4.6, 4.6, 12, 2.2, Math.min(nv, 19), L);
        (nv >= 20 ? [-17.5, -6.6, 6.6, 17.5] : [-6.6, 6.6]).forEach(function (z, i) { var hh = Math.abs(z) > 10 ? ht - 1.0 : ht; k.cil(0.05, 2.6, K.madO, 1, X, hh + 3.4, z, 5); I() && I().bandera(g, X, hh + 4.4, z, nv >= 20 ? 1.9 : 1.5, nv >= 20 ? 1.25 : 1.0, 0, i % 2 ? 'roja' : 'negra'); });
      }
      if (nv >= 16) [-3.4, 3.4].forEach(function (z) { k.cil(0.45, 1.0, K.hierro, 5, X + 1.6, 0.5, z, 8); k.cil(0.55, 0.2, K.hierro, 5, X + 1.6, 1.05, z, 8); for (var b = 0; b < 5; b++) k.esf(0.22, 0xff8a20, 9, X + 1.6 + (b % 2 - 0.5) * 0.3, 1.3 + b * 0.06, z + (b - 2) * 0.12, 1, 1.4, 1, 6); L.push({ x: X + 1.6, y: 1.5, z: z, faro: true }); });
      if (nv >= 20) { k.en(M(X - 5.5, 0, -11), function () { k.caja(4.0, 9.0, 4.0, K.sillar, 2, 0, 4.5, 0); CARAS(4, 4).forEach(function (m, i) { if (i > 1) return; k.en(m, function () { ventana(k, 0, 3.0, { w: 0.6, h: 1.0, contra: 0x3a3236, arco: true }); ventana(k, 0, 6.0, { w: 0.6, h: 1.0, contra: 0x3a3236, arco: true }); }); }); var yc = tejado4(k, 4.0, 4.0, 9.0, { pend: 0.9, vuelo: 0.4, col: 0x3a3236 }); k.cil(0.05, 2.4, K.madO, 1, 0, yc + 1.1, 0, 5); I() && I().bandera(g, X - 5.5, yc + 2.0 - 0, -11, 1.8, 1.2, 0); }); }
      if (nv >= 25) [-6.6, 6.6, -17.5, 17.5].forEach(function (z) { k.esf(0.5, K.oro, 7, X + 1.3, h + 0.2, z, 1, 1.1, 0.9, 10); k.esf(0.12, 0x1a0c06, 8, X + 1.75, h + 0.3, z - 0.18, 1, 1, 1, 5); k.esf(0.12, 0x1a0c06, 8, X + 1.75, h + 0.3, z + 0.18, 1, 1, 1, 5); });
    }
    g.add(k.malla()); g.userData.luces = L; g.userData.nv = nv; return g;
  }
  var FORT = null;
  function revisarCastillo() {
    var it = I(), f = it.fort && it.fort(); if (!f) return;
    var nv = (window.__juego && __juego.estado && __juego.estado().castillo) || 1;
    if (FORT && FORT.parent === f && FORT.userData.nv === nv) return;
    if (FORT && FORT.parent) FORT.parent.remove(FORT);
    FORT = fortaleza(nv); f.add(FORT);
  }
  // ======================================================================
  //  API para js/tk-corsarios.js
  // ======================================================================
  function esDemo(s) { var c = C(); return !!c && !s.campo && lista(c).indexOf(c.slots.indexOf(s)) >= 0; }
  function edificio(s, c, yawCara) {
    if (yawCara === null || yawCara === undefined) return null;
    var tipo = s.edificio.tipo, n = s.edificio.nivel, t = n <= 5 ? 1 : n <= 10 ? 2 : n <= 15 ? 3 : 4, idx = c.slots.indexOf(s);
    var g = new T3.Group(), gi = new T3.Group(), k = new Kit(idx * 131 + n), L = [], humo = [], E = 1.12; gi.scale.setScalar(E); g.add(gi);
    ID = IDENT[tipo] || { m: gobernador, ban: '#7a5a3a', ico: 'casa' }; if (tipo === 'cabana') ID = Object.assign({}, ID, { pared: PASTEL[idx % PASTEL.length], contra: K.contra[idx % K.contra.length] });
    k.info = null; ID.m(k, gi, t, L, humo); if (ID.extra) ID.extra(k, gi, t, L, humo); estandarteTipo(k, gi); ID = {};
    gi.add(k.malla()); var esc = function (q) { return { x: q.x * E, y: q.y * E, z: q.z * E }; };
    g.userData.luces = L.map(esc); g.userData.humo = humo.map(esc); g.userData.tkd = true;
    g.userData.yaw = orientar(s, c, yawCara);
    return g;
  }
  // el frente mira a su calle y siempre hacia la cámara (giro de 45°: se ven dos fachadas, como en la referencia)
  function orientar(s, c, yawCara) {
    var it = I(), mejor = null, md = 1e9;
    [Math.PI / 4, -Math.PI / 4].forEach(function (d) {
      var y = yawCara + d, fx = Math.sin(y), fz = Math.cos(y), p = c.aLocal(s.pos.x + fx * 5.2, s.pos.z + fz * 5.2), dd = it ? it.distCamino(p.a, p.b) : 0;
      if (dd < md - 0.3) { md = dd; mejor = y; }
    });
    return mejor;
  }

  // ======================================================================
  //  SUELO, CALLE Y VEGETACIÓN DE LA ZONA DE DEMOSTRACIÓN
  // ======================================================================
  function texCesped() { return TX.ces || (TX.ces = (function () { var t = lienzo(512, 512, function (x, w, h) {
    x.fillStyle = '#4a8a2c'; x.fillRect(0, 0, w, h); var r = azar(77);
    function envuelto(fn) { [-w, 0, w].forEach(function (dx) { [-h, 0, h].forEach(function (dy) { fn(dx, dy); }); }); }
    for (var i = 0; i < 140; i++) { var cx = r() * w, cy = r() * h, rr = 20 + r() * 70, col = ['rgba(52,104,30,', 'rgba(104,156,52,', 'rgba(130,170,60,', 'rgba(40,90,28,'][i % 4], a = 0.18 + r() * 0.25;
      envuelto(function (dx, dy) { var gr = x.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, rr); gr.addColorStop(0, col + a + ')'); gr.addColorStop(1, col + '0)'); x.fillStyle = gr; x.fillRect(cx + dx - rr, cy + dy - rr, rr * 2, rr * 2); }); }
    for (var b = 0; b < 9000; b++) { var bx = r() * w, by = r() * h, l = 3 + r() * 6, an = -Math.PI / 2 + (r() - 0.5) * 0.9, c = ['#3e7a24', '#5a9a34', '#6eae3e', '#86be4a', '#2f6a1e', '#9ac85a'][(r() * 6) | 0];
      x.strokeStyle = c; x.globalAlpha = 0.55 + r() * 0.45; x.lineWidth = 1 + r() * 1.2; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(an) * l, by + Math.sin(an) * l); x.stroke(); }
    x.globalAlpha = 1; for (var f = 0; f < 90; f++) { x.fillStyle = ['#fff6d8', '#ffe04a', '#f8a8c8'][f % 3]; x.beginPath(); x.arc(r() * w, r() * h, 1.3 + r() * 1.2, 0, 6.283); x.fill(); }
  }); t.wrapS = t.wrapT = T3.RepeatWrapping; return t; })()); }
  function texEmpedrado() { return TX.emp || (TX.emp = (function () { var t = lienzo(512, 512, function (x, w, h) {
    x.fillStyle = '#3a332b'; x.fillRect(0, 0, w, h); var r = azar(919), filas = 11, ah = h / filas;
    for (var f = 0; f < filas; f++) { var xx = (f % 2) * 14 - 20; while (xx < w + 20) { var an = 30 + r() * 30, cx = xx + an / 2, cy = f * ah + ah / 2 + (r() - 0.5) * 4, rx = an / 2 - 2, ry = ah / 2 - 2.5;
      var base = [[150, 138, 118], [170, 156, 132], [132, 122, 106], [182, 166, 140], [158, 140, 112], [124, 116, 104]][(r() * 6) | 0], k = 0.9 + r() * 0.2;
      [-w, 0, w].forEach(function (dx) { [-h, 0, h].forEach(function (dy) { if (cx + dx < -40 || cx + dx > w + 40 || cy + dy < -40 || cy + dy > h + 40) return;
        var gr = x.createRadialGradient(cx + dx - rx * 0.35, cy + dy - ry * 0.45, 1, cx + dx, cy + dy, Math.max(rx, ry) * 1.1);
        gr.addColorStop(0, 'rgb(' + base.map(function (v) { return Math.min(255, v * k + 38) | 0; }).join(',') + ')'); gr.addColorStop(0.7, 'rgb(' + base.map(function (v) { return v * k | 0; }).join(',') + ')'); gr.addColorStop(1, 'rgb(' + base.map(function (v) { return v * k * 0.62 | 0; }).join(',') + ')');
        x.fillStyle = gr; x.beginPath(); x.ellipse(cx + dx, cy + dy, rx, ry, (r() - 0.5) * 0.2, 0, 6.283); x.fill(); }); });
      xx += an; } }
    for (var m = 0; m < 70; m++) { var mx = r() * w, my = r() * h, gm = x.createRadialGradient(mx, my, 0, mx, my, 10 + r() * 16); gm.addColorStop(0, 'rgba(80,110,40,.35)'); gm.addColorStop(1, 'rgba(80,110,40,0)'); x.fillStyle = gm; x.fillRect(mx - 30, my - 30, 60, 60); }
  }); t.wrapS = t.wrapT = T3.RepeatWrapping; return t; })()); }
  function texSombra() { return TX.som || (TX.som = lienzo(128, 128, function (x, w) { var d = x.createImageData(w, w); for (var i = 0; i < w; i++) for (var j = 0; j < w; j++) { var u = Math.abs(i / w - 0.5) * 2, v = Math.abs(j / w - 0.5) * 2, q = Math.pow(Math.pow(u, 6) + Math.pow(v, 6), 1 / 6), a = 1 - Math.max(0, Math.min(1, (q - 0.62) / 0.36)); a = a * a * (3 - 2 * a); var k = (j * w + i) * 4; d.data[k] = d.data[k + 1] = d.data[k + 2] = 255; d.data[k + 3] = a * 255; } x.putImageData(d, 0, 0); })); }
  function texBorde() { return TX.bor || (TX.bor = lienzo(128, 128, function (x, w, h) { var gr = x.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.5); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); })); }
  function texMata() { return TX.mata || (TX.mata = lienzo(64, 128, function (x, w, h) { var r = azar(5); for (var i = 0; i < 26; i++) { var bx = w / 2 + (r() - 0.5) * 34, al = 50 + r() * 70, cu = (r() - 0.5) * 30; x.strokeStyle = ['#5a9a34', '#6eae3e', '#86be4a', '#a2d060'][i % 4]; x.lineWidth = 2 + r() * 2; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + cu * 0.3, h - al * 0.6, bx + cu, h - al); x.stroke(); } })); }
  function texHumo() { return TX.humo || (TX.humo = lienzo(64, 64, function (x, w) { var gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(235,230,222,.85)'); gr.addColorStop(0.6, 'rgba(220,214,206,.35)'); gr.addColorStop(1, 'rgba(220,214,206,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); })); }
  // arbusto tropical: varias bolas de hojas con flores de hibisco
  function geoArbusto(sem, flor) { var k = new Kit(sem), r = k.r;
    for (var i = 0; i < 7; i++) { var a = r() * 6.28, d = 0.15 + r() * 0.45, s = 0.38 + r() * 0.3, y = 0.25 + s * 0.4 + (1 - d) * 0.45 * r(); k.add(gIco(1), M(Math.cos(a) * d, y, Math.sin(a) * d, r() * 3, r() * 3, r() * 3, s * 1.7, s * 1.35, s * 1.7), y > 0.7 ? [0x4a8a2e, 0x5a9a34][i % 2] : [0x24561a, 0x2f6a22, 0x386f24][i % 3], 6, 0.25); }
    if (flor) for (var f = 0; f < 16; f++) { var b = r() * 6.28, h = 0.45 + r() * 0.6, rr = 0.55 + (h - 0.45) * -0.2; k.esf(0.075, flor[f % flor.length], 8, Math.cos(b) * rr, h, Math.sin(b) * rr, 1, 0.6, 1, 5); }
    var m = k.malla(); return m.geometry; }
  var DEC = null;
  function construirDecoracion(c, raizL) {
    var it = I(), V = it.veg(), g = new T3.Group(); g.name = 'tk-demo'; g.matrixAutoUpdate = false; g.matrix.copy(raizL.matrix); g.updateMatrixWorld(true);
    var LP = lista(c), k = new Kit(4242), r = k.r, P = LP.map(function (i) { var s = c.slots[i]; return s ? c.aLocal(s.pos.x, s.pos.z) : null; }).filter(Boolean);
    if (!P.length) return null;
    var a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; P.forEach(function (p) { a0 = Math.min(a0, p.a); a1 = Math.max(a1, p.a); b0 = Math.min(b0, p.b); b1 = Math.max(b1, p.b); }); a0 = Math.max(-39, a0 - 11); a1 = Math.min(45, a1 + 11); b0 = Math.max(-46, b0 - 11); b1 = Math.min(46, b1 + 11); // dentro de la meseta de la villa
    var dentro = function (a, b) { return a > a0 && a < a1 && b > b0 && b < b1; }, enParcela = function (a, b, m) { return P.some(function (p) { return Math.abs(a - p.a) < 3.6 + m && Math.abs(b - p.b) < 3.6 + m; }); };
    var cualquierParcela = function (a, b, m) { return c.slots.some(function (s) { if (s.campo) return false; var l = c.aLocal(s.pos.x, s.pos.z); return Math.abs(a - l.a) < 3.6 + m && Math.abs(b - l.b) < 3.6 + m; }); };
    // césped pintado en todo el verde de la zona (una malla con transparencia por vértice: deja ver calles y plaza)
    var mC = new T3.MeshStandardMaterial({ map: texCesped(), vertexColors: true, transparent: true, roughness: 0.95, depthWrite: false }); mC.userData.tkpSinVentanas = true;
    var NA = Math.ceil((a1 - a0) / 0.7), NB = Math.ceil((b1 - b0) / 0.7), gp = new T3.PlaneGeometry(a1 - a0, b1 - b0, NA, NB), PP = gp.attributes.position, UV = gp.attributes.uv, CC = new Float32Array(PP.count * 4);
    for (var i = 0; i < PP.count; i++) { var pa = (a0 + a1) / 2 + PP.getX(i), pb = (b0 + b1) / 2 - PP.getY(i); PP.setXYZ(i, pa, 0.035, pb); UV.setXY(i, pa / 5.5, pb / 5.5);
      var al = sm(0.05, 0.45, it.distCamino(pa, pb)) * sm(13.2, 14.2, Math.hypot(pa, pb)) * sm(0, 3, Math.min(pa - a0, a1 - pa, pb - b0, b1 - pb));
      if (cualquierParcela(pa, pb, -0.2) && !enParcela(pa, pb, 0.4)) al *= 0.0;   // otras parcelas: se quedan como están
      var tono = 0.86 + 0.22 * Math.sin(pa * 0.31 + Math.cos(pb * 0.23) * 2.0); CC[i * 4] = tono; CC[i * 4 + 1] = tono; CC[i * 4 + 2] = tono * 0.95; CC[i * 4 + 3] = al; }
    gp.setAttribute('color', new T3.BufferAttribute(CC, 4)); gp.computeVertexNormals(); gp.computeBoundingSphere();
    var mces = new T3.Mesh(gp, mC); mces.receiveShadow = true; mces.raycast = NOOP; mces.renderOrder = -4; g.add(mces);
    // sombra de contacto (oclusión) bajo cada edificio: lo asienta en el suelo
    var mS = new T3.MeshBasicMaterial({ map: texSombra(), transparent: true, depthWrite: false, color: 0x000000, opacity: 0.55 }); mS.userData.tkpSinVentanas = true;
    var sombras = {}; P.forEach(function (p, i) { var sm2 = new T3.Mesh(new T3.PlaneGeometry(9.2, 9.2), mS); sm2.rotation.x = -Math.PI / 2; sm2.position.set(p.a, 0.06, p.b); sm2.raycast = NOOP; sm2.renderOrder = -2; sm2.visible = false; g.add(sm2); sombras[LP[i]] = sm2; });
    P.forEach(function (p) { var m = 3.72; [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (d) { for (var e = -m; e < m - 0.05; e += 0.56) { var a = p.a + (d[0] ? d[0] * m : e + 0.28), b = p.b + (d[1] ? d[1] * m : e + 0.28);
      k.caja(0.54, 0.16, 0.26, [0xc2b69c, 0xb4a88e, 0xccc0a4][(e * 9 | 0) % 3 < 0 ? 0 : (e * 9 | 0) % 3], 2, a, 0.07, b, d[0] ? 0 : Math.PI / 2); } }); });
    // empedrado pintado (cantos redondeados cálidos con juntas oscuras) encima de las calles de la zona
    var mE = new T3.MeshStandardMaterial({ map: texEmpedrado(), vertexColors: true, transparent: true, roughness: 0.9, depthWrite: false }); mE.userData.tkpSinVentanas = true;
    var ge = gp.clone(), CE = new Float32Array(PP.count * 4), PE = ge.attributes.position;
    for (var ie = 0; ie < PE.count; ie++) { var ea = PE.getX(ie), eb = PE.getZ(ie), dce = it.distCamino(ea, eb), ra = Math.hypot(ea, eb);
      var ae = (1 - sm(-0.15, 0.12, dce)) * sm(12.6, 13.2, ra) * sm(0, 3, Math.min(ea - a0, a1 - ea, eb - b0, b1 - eb)), bord = sm(-0.9, 0.05, dce);
      PE.setY(ie, 0.045); var tn = 1 - bord * 0.35; CE[ie * 4] = tn; CE[ie * 4 + 1] = tn * 0.97; CE[ie * 4 + 2] = tn * 0.92; CE[ie * 4 + 3] = ae; }
    var UE = ge.attributes.uv; for (var iu = 0; iu < UE.count; iu++) UE.setXY(iu, PE.getX(iu) / 5.2, PE.getZ(iu) / 5.2); ge.setAttribute('color', new T3.BufferAttribute(CE, 4)); var memp = new T3.Mesh(ge, mE); memp.receiveShadow = true; memp.raycast = NOOP; memp.renderOrder = -3; g.add(memp);
    // bordillos a los dos lados de las calles de la zona
    var cam = it.segs();
    cam.forEach(function (sg) { var da = sg[2] - sg[0], db = sg[3] - sg[1], l = Math.hypot(da, db); if (l < 0.5) return; var ua = da / l, ub = db / l, na = -ub, nb = ua, ang = Math.atan2(ua, ub);
      for (var s = 0; s <= l; s += 0.62) [-1, 1].forEach(function (lado) { var a = sg[0] + ua * s + na * lado * (sg[4] + 0.12), b = sg[1] + ub * s + nb * lado * (sg[4] + 0.12);
        if (!dentro(a, b) || Math.hypot(a, b) < 13.2 || it.distCamino(a, b) < -0.05 - 0.0 && it.distCamino(a - na * lado * 0.4, b - nb * lado * 0.4) < -0.3 && false) return;
        if (it.distCamino(a + na * lado * 0.35, b + nb * lado * 0.35) < 0) return;                   // ahí cruza otra calle
        k.caja(0.58, 0.14, 0.24, [0xb8ae98, 0xc4b8a0, 0xa89e88][(s * 7 | 0) % 3], 2, a, 0.06, b, ang + Math.PI / 2); }); });
    // farolas de hierro a lo largo de las calles, macizos de flores y bancos
    var luces = [];
    cam.forEach(function (sg) { var da = sg[2] - sg[0], db = sg[3] - sg[1], l = Math.hypot(da, db); if (l < 3) return; var ua = da / l, ub = db / l, na = -ub, nb = ua;
      for (var s = 2; s < l; s += 7) [-1, 1].forEach(function (lado, j) { if ((Math.round(s / 7) + j) % 2) return; var a = sg[0] + ua * s + na * lado * (sg[4] + 0.6), b = sg[1] + ub * s + nb * lado * (sg[4] + 0.6);
        if (!dentro(a, b) || Math.hypot(a, b) < 14 || cualquierParcela(a, b, 0.2) || it.distCamino(a, b) < 0.2) return;
        k.cil(0.16, 0.3, K.hierro, 5, a, 0.15, b, 8); k.cil(0.055, 3.0, K.hierro, 5, a, 1.6, b, 6); k.add(gToro(), M(a, 2.6, b, Math.PI / 2, 0, 0, 0.32, 0.32, 0.5), K.hierro, 5); farol(k, a, 3.3, b, luces); k.esf(0.06, K.oro, 7, a, 3.62, b, 1, 1, 1, 5); }); });
    // vegetación en grupos naturales: una palmera o dos, arbustos con flores alrededor y matas de hierba
    var palmas = [], arbustos = [[], [], []], matas = [], o = new T3.Object3D();
    var verde = function (a, b, m) { return it.distCamino(a, b) > m && Math.hypot(a, b) > 14 && !enParcela(a, b, -0.6) && !(cualquierParcela(a, b, 0.2) && !enParcela(a, b, 0.6)) && dentro(a, b); };
    var NC = Math.round(Math.max(14, (a1 - a0) * (b1 - b0) / 120) * CANT), centros = []; for (var n = 0; n < NC * 100 && centros.length < NC; n++) { var ca = a0 + 2 + r() * (a1 - a0 - 4), cb = b0 + 2 + r() * (b1 - b0 - 4); if (!verde(ca, cb, 0.9) || centros.some(function (q) { return Math.hypot(q[0] - ca, q[1] - cb) < 4.0; })) continue; centros.push([ca, cb]); }
    centros.forEach(function (q, j) {
      if (j % 3 === 0 && palmas.length < 4 + NC / 4 && verde(q[0], q[1], 1.3) && !enParcela(q[0], q[1], 2.2)) palmas.push([q[0], q[1], 0.55 + r() * 0.2, r()]);
      for (var m = 0; m < 3; m++) { var a = q[0] + (r() - 0.5) * 2.6, b = q[1] + (r() - 0.5) * 2.6; if (verde(a, b, 0.6)) arbustos[(j + m) % 3].push([a, b, 0.9 + r() * 0.6, r()]); }
      for (var t2 = 0; t2 < 10; t2++) { var a2 = q[0] + (r() - 0.5) * 4, b2 = q[1] + (r() - 0.5) * 4; if (verde(a2, b2, 0.3) && t2 < 5) matas.push([a2, b2, 0.45 + r() * 0.35, r()]); }
    });
    for (var n2 = 0; n2 < 260 * CANT * Math.max(1, NC / 14); n2++) { var a3 = a0 + r() * (a1 - a0), b3 = b0 + r() * (b1 - b0); if (verde(a3, b3, 0.4)) matas.push([a3, b3, 0.4 + r() * 0.35, r()]); }
    // arbustos pegados al zócalo de cada edificio (esquinas que dan a la calle)
    P.forEach(function (p) { [[1, 0], [-1, 0]].forEach(function (d, j) { var a = p.a + d[0] * 3.75 + d[1] * (r() - 0.5) * 4, b = p.b + d[1] * 3.75 + d[0] * (r() - 0.5) * 4; if (it.distCamino(a, b) > 0.6) arbustos[j % 3].push([a, b, 0.7 + r() * 0.35, r()]); }); });
    function inst(geo, mat, lista, sombra, alto) { if (!lista.length) return; var im = new T3.InstancedMesh(geo, mat, lista.length); lista.forEach(function (p, i) { o.position.set(p[0], 0.02, p[1]); o.rotation.set(0, p[3] * 40, 0); o.scale.set(p[2], p[2] * (alto || 1), p[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); im.castShadow = !!sombra; im.receiveShadow = true; im.raycast = NOOP; g.add(im); }
    inst(V.tronco, V.mTronco, palmas, true); inst(V.fronda, V.mFronda, palmas, true);
    var flores = [[0xd8283e, 0xff5a7a], [0xffa21a, 0xfff0a0], [0xe86aa8, 0xffffff]];
    arbustos.forEach(function (l, i) { inst(geoArbusto(31 + i, flores[i]), matD(), l, CANT >= 1); });
    var mm = new T3.MeshStandardMaterial({ map: texMata(), alphaTest: 0.4, side: T3.DoubleSide, roughness: 0.9 }); mm.userData.tkpSinVentanas = true;
    var gm = new T3.PlaneGeometry(0.9, 0.7); gm.translate(0, 0.35, 0); var gm2 = gm.clone().rotateY(Math.PI / 2), gm3 = gm.clone().rotateY(Math.PI / 4), mg = mezclar([gm, gm2, gm3]);
    // matas: solo unas pocas y claras, pegadas a los arbustos
    inst(mg, mm, matas.filter(function (q, i) { return i % 4 === 0; }), false);
    // macizo de flores con borde de piedra delante de cada edificio, en la esquina que da a la calle
    P.forEach(function (p, i) { var s = c.slots[LP[i]], hecho = 0; if (!s || CANT < 0.7) return; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) {
      var a = p.a + q[0] * 4.6, b = p.b + q[1] * 4.6; if (hecho || it.distCamino(a, b) < 1.2 || cualquierParcela(a, b, 0.1)) return; hecho = 1;
      for (var e = 0; e < 14; e++) { var an = e / 14 * Math.PI * 2; k.caja(0.34, 0.16, 0.2, 0xa89a82, 2, a + Math.cos(an) * 0.95, 0.08, b + Math.sin(an) * 0.65, -an + Math.PI / 2); }
      k.add(gCil(14), M(a, 0.04, b, 0, 0, 0, 1.8, 0.12, 1.2), 0x4a3424, 8);
      for (var f = 0; f < 16; f++) { var fa = r() * 6.28, fd = Math.sqrt(r()); k.esf(0.11, K.verdeH, 6, a + Math.cos(fa) * fd * 0.75, 0.18, b + Math.sin(fa) * fd * 0.5, 1, 0.7, 1, 5); k.esf(0.065, [0xe8344a, 0xfff2c0, 0xffb02a, 0xc858d8][f % 4], 8, a + Math.cos(fa) * fd * 0.75, 0.28, b + Math.sin(fa) * fd * 0.5, 1, 1, 1, 5); }
    }); });
    g.add(k.malla());
    // humo de las chimeneas
    var mh = new T3.SpriteMaterial({ map: texHumo(), transparent: true, depthWrite: false, opacity: 0.6 }); mh.userData.tkpSinVentanas = true;
    var hu = []; for (var h = 0; h < 90; h++) { var sp = new T3.Sprite(mh.clone()); sp.visible = false; sp.raycast = NOOP; sp.renderOrder = -1; hu.push(sp); }
    var rz = new T3.Group(); rz.name = 'tk-demo-humo'; hu.forEach(function (s) { rz.add(s); });
    // los cantos redondos que el juego pone en el borde de estas parcelas se esconden (se guardan para devolverlos)
    var quitados = [], mt4 = new T3.Matrix4(), pz = new T3.Vector3(), cero = new T3.Matrix4().makeScale(0, 0, 0);
    raizL.children.forEach(function (im) { if (!im.isInstancedMesh) return; var tocado = false;
      for (var q = 0; q < im.count; q++) { im.getMatrixAt(q, mt4); pz.setFromMatrixPosition(mt4); if (pz.y > 0.2 || pz.y < -0.2) continue;
        if (P.some(function (p) { var da = Math.abs(pz.x - p.a), db = Math.abs(pz.z - p.b); return da < 4.0 && db < 4.0 && Math.max(da, db) > 3.2; })) { quitados.push([im, q, mt4.clone()]); im.setMatrixAt(q, cero); tocado = true; } }
      if (tocado) im.instanceMatrix.needsUpdate = true; });
    return { g: g, humo: rz, quitados: quitados, sombras: sombras, puffs: hu, luces: luces, cuenta: { centros: centros.length, palmas: palmas.length, arbustos: arbustos[0].length + arbustos[1].length + arbustos[2].length, matas: matas.length, region: [a0, a1, b0, b1].map(Math.round), parcelas: P.map(function (p) { return [Math.round(p.a), Math.round(p.b)]; }) } };
  }
  function mezclar(gs) { var p = [], n = [], u = []; gs.forEach(function (g) { var q = g.index ? g.toNonIndexed() : g; p.push.apply(p, q.attributes.position.array); n.push.apply(n, q.attributes.normal.array); u.push.apply(u, q.attributes.uv.array); }); var r = new T3.BufferGeometry(); r.setAttribute('position', new T3.Float32BufferAttribute(p, 3)); r.setAttribute('normal', new T3.Float32BufferAttribute(n, 3)); r.setAttribute('uv', new T3.Float32BufferAttribute(u, 2)); return r; }

  // ======================================================================
  //  CADA FOTOGRAMA: monta/desmonta la decoración, esconde el césped plano de las parcelas, humo y luz de la demo
  // ======================================================================
  var tiempo = 0, luzGuardada = null, ocultosT = [], CSOL = new T3.Color(0xffc890);
  function luz(c, x, encender) {
    var cv = c.camv;
    if (encender) { if (!luzGuardada) luzGuardada = { exp: x.render.toneMappingExposure, grados: cv ? cv.gradosMeta : null };
      if (cv && cv.gradosMeta > 35) cv.gradosMeta = 35;                                         // cámara algo más baja: se ven más las fachadas
      x.render.toneMappingExposure = luzGuardada.exp * 0.74;                                    // menos lavado: colores más ricos
      // sol más cálido y sombras con más contraste (solo si el juego ha vuelto a poner su luz en este fotograma: nunca se acumula)
      if (c.hemi && c.hemi.intensity !== luzGuardada.h) { c.hemi.intensity *= 0.62; luzGuardada.h = c.hemi.intensity; }
      if (c.sol && c.sol.intensity !== luzGuardada.s) { c.sol.intensity *= 1.22; c.sol.color.lerp(CSOL, 0.25); luzGuardada.s = c.sol.intensity; } }
    else if (luzGuardada) { x.render.toneMappingExposure = luzGuardada.exp; if (cv && luzGuardada.grados !== null && cv.gradosMeta === 35) cv.gradosMeta = luzGuardada.grados; luzGuardada = null; }
  }
  function devolver() { if (!DEC || !DEC.quitados) return; var ims = []; DEC.quitados.forEach(function (q) { q[0].setMatrixAt(q[1], q[2]); if (ims.indexOf(q[0]) < 0) ims.push(q[0]); }); ims.forEach(function (im) { im.instanceMatrix.needsUpdate = true; }); }
  function esconderCantos() { if (!DEC || !DEC.quitados) return; var cero = new T3.Matrix4().makeScale(0, 0, 0), ims = []; DEC.quitados.forEach(function (q) { q[0].setMatrixAt(q[1], cero); if (ims.indexOf(q[0]) < 0) ims.push(q[0]); }); ims.forEach(function (im) { im.instanceMatrix.needsUpdate = true; }); }
  function paso(dt) {
    var x = window.__tkExtras, c = C(), it = I(); if (!x || !c || !it) return;
    var quiere = ON && TKCorsarios.activa(), raizL = it.raizL();
    if (!quiere || !raizL) { if (DEC && DEC.g.parent) { DEC.g.parent.remove(DEC.g); DEC.humo.parent && DEC.humo.parent.remove(DEC.humo); devolver(); } ocultosT.forEach(function (o) { o.visible = true; }); ocultosT = []; luz(c, x, false); if (FORT && FORT.parent) FORT.parent.remove(FORT); FORT = null; return; }
    revisarCastillo();
    if (!DEC) DEC = construirDecoracion(c, raizL); if (!DEC) return;
    if (!DEC.g.parent) { x.escena.add(DEC.g); x.escena.add(DEC.humo); esconderCantos(); }
    var enCampos = c.vista() === 'campos'; DEC.g.visible = DEC.humo.visible = !enCampos;
    var LS = lista(c); LS.forEach(function (i) { var s = c.slots[i], hay = !!(s && s.tkc && s.tkc.userData.tkd); if (DEC.sombras[i]) DEC.sombras[i].visible = hay; if (s && s.terreno && s.terreno.visible && hay) { s.terreno.visible = false; ocultosT.push(s.terreno); } });
    for (var oi = ocultosT.length - 1; oi >= 0; oi--) { var sl = c.slots.filter(function (q) { return q.terreno === ocultosT[oi]; })[0]; if (!sl || !(sl.tkc && sl.tkc.userData.tkd)) { ocultosT[oi].visible = true; ocultosT.splice(oi, 1); } } // parcela vaciada: vuelve su césped
    tiempo += Math.min(0.05, dt || 0); UD.t.value = tiempo; UD.noche.value = c.noche();
    // humo: cada chimenea suelta bocanadas que suben, crecen y se deshacen
    var fuentes = []; LS.forEach(function (i) { var s = c.slots[i]; if (s && s.tkc && s.tkc.userData.humo) s.tkc.userData.humo.forEach(function (h) { fuentes.push(s.tkc.localToWorld(new T3.Vector3(h.x, h.y, h.z))); }); });
    DEC.puffs.forEach(function (sp, j) { var f = fuentes[j % Math.max(1, fuentes.length)]; if (!f || j >= fuentes.length * 6) { sp.visible = false; return; }
      var ciclo = (tiempo * 0.22 + (j / Math.max(1, fuentes.length) | 0) / 6) % 1; sp.visible = true;
      sp.position.set(f.x + Math.sin(tiempo * 0.7 + j) * 0.3 + ciclo * 1.6, f.y + ciclo * 3.2, f.z + ciclo * 0.8); sp.scale.setScalar(0.6 + ciclo * 2.2); sp.material.opacity = 0.75 * Math.sin(ciclo * Math.PI) * (1 - 0.5 * c.noche()); });
    luz(c, x, true);
  }
  (function enganchar() {
    if (!window.TKExtras) window.TKExtras = { cadaFotograma: function () {} };
    var antes = TKExtras.cadaFotograma;
    // va DESPUÉS del resto (la luz del día ya está puesta) para poder retocarla solo mientras se ve la demo
    TKExtras.cadaFotograma = function (dt) { antes(dt); try { paso(dt); } catch (e) { if (!enganchar.av) { enganchar.av = 1; console.warn('TKCorsariosDemo', e); } } };
  })();
  window.TKCorsariosDemo = {
    // v10.09: se puede preparar antes (sin ponerla en la escena) para que entrar en la isla sea rápido
    preparar: function () { var c = C(), it = I(); if (DEC || !ON || !c || !it || !it.raizL()) return null; DEC = construirDecoracion(c, it.raizL()); return DEC; },
    activo: function () { return ON; }, esDemo: esDemo, edificio: edificio, version: function () { return VER; },
    activar: function (v) { ON = v === undefined ? true : !!v; VER++; },
    parcelas: function (l) { if (l !== undefined) { PARC = l ? l.slice() : null; VER++; if (DEC) { DEC.g.parent && DEC.g.parent.remove(DEC.g); DEC.humo.parent && DEC.humo.parent.remove(DEC.humo); devolver(); DEC = null; } } var c = C(); return c ? lista(c) : []; },
    estado: function () { var c = C(); return { activo: ON, parcelas: c ? lista(c).length : 0, edificios: c ? lista(c).filter(function (i) { var s = c.slots[i]; return s && s.tkc && s.tkc.userData.tkd; }).length : 0, decoracion: !!(DEC && DEC.g.parent), cuenta: DEC && DEC.cuenta, tris: DEC ? (function () { var n = 0; DEC.g.traverse(function (o) { if (o.isMesh && o.geometry) n += (o.geometry.attributes.position.count / 3) * (o.isInstancedMesh ? o.count : 1); }); return Math.round(n); })() : 0 }; }
  };
})();
