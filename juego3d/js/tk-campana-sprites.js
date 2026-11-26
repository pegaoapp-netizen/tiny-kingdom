/* Brother Kingdom · MUÑECOS 3D DE LA CAMPAÑA (v9.30–9.31, pedido del dueño: «cambiar esos muñecos feos», también los de su lado).
 * La batalla de la Campaña se dibuja en 2D (Canvas). Este archivo carga los modelos 3D (los enemigos que hizo el dueño en modelos/campana/
 * y los héroes de modelos/<héroe>.glb), los pone a moverse UNA vez en un lienzo aparte y guarda fotos de cada movimiento.
 * Luego la batalla solo pega esas fotos: va rápido en el teléfono. Solo se baja lo que sale en la batalla (~1,4 MB cada uno);
 * mientras carga se sigue viendo el círculo de antes.
 * Uso desde tk-campana.js: TKSprites.foto(clave, estado, t) → lienzo, o null si todavía no está.
 *   clave: el dibujito del enemigo (con «j» delante si es jefe) o «h:» + id del héroe.   estado: 'anda' | 'ataca' | 'quieto'.
 */
(function () {
  'use strict';
  // enemigos: por su dibujito (los jefes llevan «j» delante)
  var ENEMIGO = {
    '🗡️': '01_bandido', '🏹': '02_arquero_bandido', '🐺': '03_lobo', '👺': '04_trasgo', '🔮': '05_chaman_trasgo', '👹': '06_ogro',
    '🪨': '07_trol_de_piedra', '🧌': '07_trol_de_piedra', '💀': '08_esqueleto', '🧙': '09_nigromante', /* '🦇': gárgola, falta el modelo */
    'j🪓': '11_capitan_rojo', 'j🦹': '12_garra_negra', 'j🐺': '13_colmillo', 'j🧙‍♀️': '14_zarza', 'j⚒️': '15_brusco', 'j🧌': '16_gorlak',
    'j🛡️': '17_caballero_negro', 'j🐲': '18_ignaroth', 'j👹': '06_ogro', 'j👺': '04_trasgo', 'j🔮': '05_chaman_trasgo', 'j🏹': '02_arquero_bandido'
  };
  // héroes que ya tienen modelo 3D (los demás siguen con su retrato en círculo)
  var HEROE = { sol: 1, luna: 1, ancla: 1, brisa: 1, chispa: 1, roble: 1, trueno: 1, pluma: 1 };
  var N_FOTOS = 12, AN = 150, AL = 190;
  var cache = {}, cola = [], trabajando = false, rend = null;

  function ruta(clave) {
    if (clave.indexOf('h:') === 0) { var id = clave.slice(2); return HEROE[id] ? { url: 'modelos/' + id + '.glb?v=' + (window.VERSION_JUEGO || 1), giro: -0.8 } /* v9.41: mirando por donde avanzan (arriba a la derecha, siguiendo el camino) */ : null; }
    var n = ENEMIGO[clave]; return n ? { url: 'modelos/campana/' + n + '.glb?v=1', giro: -0.8 } /* v9.41: mirando hacia tus héroes (abajo a la izquierda, siguiendo el camino) */ : null;
  }
  function renderer() {
    if (rend !== null) return rend;
    try { rend = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); rend.setPixelRatio(1); rend.setSize(AN, AL, false); rend.setClearColor(0x000000, 0); }
    catch (e) { rend = false; }
    return rend;
  }
  function clipDe(gl, re) { return (gl.animations || []).filter(function (a) { return re.test(a.name); })[0] || null; }

  function hacerFotos(gl, giroY) {
    var R = renderer(); if (!R) return null;
    var esc = new THREE.Scene(), m = gl.scene;
    esc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 1.6));
    var dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(-2, 4, 3); esc.add(dl);
    m.traverse(function (o) {
      if (o.isMesh && o.material) {
        var mp = o.material.map || null, col = o.material.color ? o.material.color.getHex() : 0x999999;
        o.material = new THREE.MeshLambertMaterial({ map: mp, color: mp ? 0xffffff : col, emissive: mp ? 0x8a8a8a : 0x222222, emissiveMap: mp, skinning: !!o.isSkinnedMesh });
        o.frustumCulled = false;
      }
    });
    var giro = new THREE.Group(); giro.add(m); esc.add(giro); giro.rotation.y = giroY;
    var anda = clipDe(gl, /walk|caminar/i) || clipDe(gl, /run|correr/i) || (gl.animations || [])[0] || null;
    var ataca = clipDe(gl, /attack|ataque|atacar/i), quieto = clipDe(gl, /idle|quieto/i);
    var mix = anda ? new THREE.AnimationMixer(m) : null;
    function poner(clip, t) { if (!mix || !clip) return; mix.stopAllAction(); var ac = mix.clipAction(clip); ac.reset(); ac.play(); mix.setTime(t); }
    // v9.32: se mide el cuerpo ENTERO (ya girado) en todos los movimientos, para que nada quede cortado (el lobo es largo, no alto)
    var bx = new THREE.Box3(), pv = new THREE.Vector3(), hayHueso = false;
    function medir() { esc.updateMatrixWorld(true); var algo = false; m.traverse(function (o) { if (o.isBone) { algo = true; bx.expandByPoint(o.getWorldPosition(pv)); } }); return algo; }
    [anda, ataca, quieto].forEach(function (cl) { if (!cl) return; for (var i = 0; i < 6; i++) { poner(cl, cl.duration * i / 6); if (medir()) hayHueso = true; } });
    if (!mix && medir()) hayHueso = true;
    if (!hayHueso || bx.isEmpty()) { esc.updateMatrixWorld(true); bx.setFromObject(m); }
    var yPies = bx.min.y; /* v9.36: dónde pisan, para poner los pies justo sobre la sombra (si no, parece que flotan) */
    if (hayHueso && !bx.isEmpty()) { var tb = new THREE.Vector3(); bx.getSize(tb); bx.expandByScalar(Math.max(tb.x, tb.y, tb.z) * 0.14); } /* los huesos no llegan a la punta del hocico ni de la cabeza */
    else yPies = bx.min.y;
    poner(quieto || anda, 0);
    var tam = new THREE.Vector3(), cen = new THREE.Vector3(); bx.getSize(tam); bx.getCenter(cen);
    var FOV = 30, tv = Math.tan(FOV / 2 * Math.PI / 180), th = tv * AN / AL;
    var cam = new THREE.PerspectiveCamera(FOV, AN / AL, 0.001, 10000);
    var dist = Math.max(tam.y / 2 / tv, tam.x / 2 / th) * 1.08 + tam.z / 2;
    cam.position.set(cen.x, cen.y + tam.y * 0.12, cen.z + dist); cam.lookAt(cen.x, cen.y, cen.z); cam.updateMatrixWorld(true);
    var pP = new THREE.Vector3(cen.x, yPies, cen.z).project(cam), pieFrac = Math.max(0.5, Math.min(1, (1 - pP.y) / 2));
    function foto() { R.render(esc, cam); var c = document.createElement('canvas'); c.width = AN; c.height = AL; c.getContext('2d').drawImage(R.domElement, 0, 0); return c; }
    function serie(clip, n) { var l = []; if (!clip) return l; for (var i = 0; i < n; i++) { poner(clip, clip.duration * i / n); l.push(foto()); } return l; }
    var res = { anda: mix ? serie(anda, N_FOTOS) : [foto()] };
    res.ataca = ataca ? serie(ataca, N_FOTOS) : res.anda;
    res.quieto = quieto ? serie(quieto, 1) : [res.anda[0]];
    res.pie = pieFrac;
    m.traverse(function (o) { if (o.isMesh) { try { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } catch (e) {} } });
    return res;
  }

  function siguiente() {
    if (trabajando || !cola.length) return;
    if (!window.THREE || !THREE.GLTFLoader) { cola = []; return; }
    trabajando = true;
    var clave = cola.shift(), e = cache[clave], r = ruta(clave);
    new THREE.GLTFLoader().load(r.url, function (gl) {
      try { e.fotos = hacerFotos(gl, r.giro); if (!e.fotos) e.falla = true; } catch (err) { e.falla = true; try { console.warn('Campaña · muñeco ' + clave + ':', err); } catch (x) {} }
      trabajando = false; setTimeout(siguiente, 30);
    }, undefined, function () { e.falla = true; trabajando = false; setTimeout(siguiente, 30); });
  }
  function pedir(clave) {
    var e = cache[clave];
    if (!e) { e = cache[clave] = { fotos: null, falla: false }; if (ruta(clave)) { cola.push(clave); siguiente(); } else e.falla = true; }
    return e;
  }

  window.TKSprites = {
    claveEnemigo: function (ico, jefe) { return jefe && ENEMIGO['j' + ico] ? 'j' + ico : ico; },
    /* fase (0..1): en qué punto del paso va; si se da, manda ella (así los pies van al ritmo de lo que avanza y no «flota») */
    foto: function (clave, estado, t, fase) {
      if (!clave) return null;
      var e = pedir(clave); if (!e.fotos) return null;
      var l = e.fotos[estado] || e.fotos.anda; if (!l || !l.length) return null;
      if (l.length < 2) return l[0];
      var k = fase != null ? Math.floor((((fase % 1) + 1) % 1) * l.length) : Math.floor(((t || 0) * (estado === 'ataca' ? 14 : 10)) % l.length);
      return l[Math.min(l.length - 1, k)];
    },
    /* v9.36: a qué altura de la foto (0 arriba, 1 abajo) están los pies */
    pie: function (clave) { var e = cache[clave]; return e && e.fotos && e.fotos.pie ? e.fotos.pie : 0.95; },
    /* v9.42: al cerrar la Campaña se suelta el motor 3D aparte y las fotos (se rehacen la próxima vez) */
    liberar: function () { cola = []; cache = {}; if (rend) { try { rend.dispose(); rend.forceContextLoss(); } catch (e) {} } rend = null; },
    info: function () { var o = {}; for (var k in cache) o[k] = cache[k].fotos ? 'listo' : (cache[k].falla ? 'falla' : 'cargando'); return o; }
  };
})();
