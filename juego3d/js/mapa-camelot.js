// Mapa del mundo infinito estilo Kingdoms of Camelot: suelo pintado, casillas en rombo y
// bosques, montañas, lagos y castillos dibujados a mano. El terreno se genera alrededor de la
// cámara a medida que te mueves, así que nunca se acaba.
(function () {
  var BASE = 'camelot/';
  var ASPECTO = { bosque: 384 / 257, montana: 384 / 226, colina: 384 / 202, lago: 384 / 218, castillo: 384 / 262, 'castillo-yo': 384 / 306, campamento: 384 / 219, jabali: 320 / 198, lobo: 320 / 215, oso: 320 / 204, libre: 320 / 175 };
  var ANCHO = { bosque: 3.0, montana: 3.3, colina: 2.9, lago: 3.0, castillo: 2.9, 'castillo-yo': 3.4, campamento: 2.7, jabali: 1.9, lobo: 1.9, oso: 2.1, libre: 2.4 };
  var DIR_CAM = new THREE.Vector3(0.44, 0.85, 0.44);
  var cargador = new THREE.TextureLoader();
  var mats = {};
  var giro = (function () { var o = new THREE.Object3D(); o.lookAt(DIR_CAM); return o.quaternion.clone(); })();
  var ARRIBA = new THREE.Vector3(0, 1, 0).applyQuaternion(giro);
  // el centro del rombo dibujado queda al 38% desde abajo de cada imagen: ese punto va sobre la casilla
  function alzar(n) { return ANCHO[n] / ASPECTO[n] * 0.12; }

  function material(n) {
    if (!mats[n]) {
      var t = cargador.load(BASE + n + '.png'); t.anisotropy = 4;
      mats[n] = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.1 });
    }
    return mats[n];
  }
  function geometria(n) { var w = ANCHO[n]; return new THREE.PlaneGeometry(w, w / ASPECTO[n]); }

  function sprite(n, escala) {
    var m = new THREE.Mesh(geometria(n), material(n));
    m.quaternion.copy(giro); m.scale.setScalar(escala || 1);
    m.position.copy(ARRIBA).multiplyScalar(alzar(n) * (escala || 1));
    m.renderOrder = 1;
    return m;
  }

  function crear(escena, op) {
    var R = 24, CAP = (2 * R + 1) * (2 * R + 1), CELDA = op.celda, MITAD = op.tam / 2;
    var grupo = new THREE.Group(); escena.add(grupo);

    var tPasto = cargador.load(BASE + 'pasto.jpg'); tPasto.wrapS = tPasto.wrapT = THREE.RepeatWrapping; tPasto.anisotropy = 8;
    var LADO_SUELO = 240, TILE = 8; tPasto.repeat.set(LADO_SUELO / TILE, LADO_SUELO / TILE);
    var suelo = new THREE.Mesh(new THREE.PlaneGeometry(LADO_SUELO, LADO_SUELO), new THREE.MeshBasicMaterial({ map: tPasto, depthWrite: false }));
    suelo.rotation.x = -Math.PI / 2; suelo.renderOrder = -2; grupo.add(suelo);

    var lin = [];
    for (var i = -R; i <= R + 1; i++) { lin.push(i * CELDA, 0.02, -R * CELDA, i * CELDA, 0.02, (R + 1) * CELDA, -R * CELDA, 0.02, i * CELDA, (R + 1) * CELDA, 0.02, i * CELDA); }
    var gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(lin, 3));
    var rejilla = new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: 0xf0f4d8, transparent: true, opacity: 0.32, depthWrite: false }));
    rejilla.renderOrder = -1; grupo.add(rejilla);

    var capas = {};
    ['lago', 'colina', 'bosque', 'montana', 'castillo'].forEach(function (n) {
      var im = new THREE.InstancedMesh(geometria(n), material(n), CAP);
      im.count = 0; im.frustumCulled = false; im.renderOrder = 1; grupo.add(im); capas[n] = im;
    });

    var tmp = new THREE.Object3D(), centro = null, memo = {};
    // v6.45: cada casilla se calcula una sola vez (antes se recalculaban 2.400 en cada paso y el arrastre daba tirones)
    function dibujoDe(x, y) {
      var k = x + '_' + y, d = memo[k]; if (d !== undefined) return d;
      var c = op.casilla(x, y), n = null, s = 0.92 + op.hash(x * 3.1, y * 1.7) * 0.16;
      if (c.tipo === 'bosque') n = 'bosque';
      else if (c.tipo === 'montana') { n = 'montana'; s += c.nivel * 0.03; }
      else if (c.tipo === 'colina') n = 'colina';
      else if (c.tipo === 'lago') n = 'lago';
      else if ((x < 0 || y < 0 || x >= op.tam || y >= op.tam) && op.hash(x * 1.37 + 11, y * 2.11 - 4) < 0.06) { n = 'castillo'; s = 0.62 + c.nivel * 0.04; }
      if (!n) { memo[k] = null; return null; }
      tmp.position.set((x - MITAD + 0.5) * CELDA, 0, (y - MITAD + 0.5) * CELDA).addScaledVector(ARRIBA, alzar(n) * s); tmp.quaternion.copy(giro); tmp.scale.setScalar(s); tmp.updateMatrix();
      d = memo[k] = { n: n, m: tmp.matrix.clone() }; return d;
    }
    function rellenar(cx, cy) {
      centro = { x: cx, y: cy };
      for (var k in capas) capas[k].count = 0;
      for (var y = cy - R; y <= cy + R; y++) for (var x = cx - R; x <= cx + R; x++) {
        var d = dibujoDe(x, y); if (!d || op.ocupada(x, y)) continue;
        var im = capas[d.n]; im.setMatrixAt(im.count++, d.m);
      }
      for (var k2 in capas) capas[k2].instanceMatrix.needsUpdate = true;
      var bx = (cx - MITAD) * CELDA, bz = (cy - MITAD) * CELDA;
      rejilla.position.set(bx, 0, bz);
    }

    return {
      actualizar: function (obj) {
        suelo.position.set(Math.round(obj.x / TILE) * TILE, 0, Math.round(obj.z / TILE) * TILE);
        var cx = Math.floor(obj.x / CELDA + MITAD), cy = Math.floor(obj.z / CELDA + MITAD);
        if (!centro || Math.abs(cx - centro.x) > 6 || Math.abs(cy - centro.y) > 6) rellenar(cx, cy);
      },
      refrescar: function () { if (centro) rellenar(centro.x, centro.y); }
    };
  }

  window.CAMELOT = { crear: crear, sprite: sprite, dirCamara: DIR_CAM };
})();
