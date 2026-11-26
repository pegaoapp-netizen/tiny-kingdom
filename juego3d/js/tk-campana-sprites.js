/* Brother Kingdom · MUÑECOS 3D DE LA CAMPAÑA (v9.30, pedido del dueño: «cambiar esos muñecos feos por los que creé»).
 * La batalla de la Campaña se dibuja en 2D (Canvas). Este archivo carga los modelos 3D del dueño (modelos/campana/*.glb),
 * los pone a caminar UNA vez en un lienzo aparte y guarda 8 fotos de cada uno. Luego la batalla solo pega esas fotos: va rápido en el teléfono.
 * Solo se baja el modelo de los enemigos que salen en la batalla (cada uno ~1,4 MB), y mientras carga se sigue viendo el círculo de antes.
 * Uso desde tk-campana.js: TKSprites.foto(ico, jefe, anda, t) → lienzo con la foto, o null si todavía no está.
 */
(function () {
  'use strict';
  // qué modelo va con cada enemigo (por su dibujito); los jefes se distinguen con el «j»
  var MODELO = {
    '🗡️': '01_bandido', '🏹': '02_arquero_bandido', '🐺': '03_lobo', '👺': '04_trasgo', '🔮': '05_chaman_trasgo', '👹': '06_ogro',
    '🪨': '07_trol_de_piedra', '🧌': '07_trol_de_piedra', '💀': '08_esqueleto', '🧙': '09_nigromante', /* '🦇': gárgola, falta el modelo */
    'j🪓': '11_capitan_rojo', 'j🦹': '12_garra_negra', 'j🐺': '13_colmillo', 'j🧙‍♀️': '14_zarza', 'j⚒️': '15_brusco', 'j🧌': '16_gorlak',
    'j🛡️': '17_caballero_negro', 'j🐲': '18_ignaroth', 'j👹': '06_ogro', 'j👺': '04_trasgo', 'j🔮': '05_chaman_trasgo', 'j🏹': '02_arquero_bandido'
  };
  var VERSION = 1, N_FOTOS = 8, AN = 150, AL = 190;
  var cache = {}, cola = [], trabajando = false, rend = null;

  function clave(ico, jefe) { return jefe && MODELO['j' + ico] ? 'j' + ico : ico; }
  function nombreModelo(ico, jefe) { return MODELO[clave(ico, jefe)] || null; }

  function renderer() {
    if (rend) return rend;
    try { rend = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); rend.setPixelRatio(1); rend.setSize(AN, AL, false); rend.setClearColor(0x000000, 0); }
    catch (e) { rend = false; }
    return rend;
  }

  function hacerFotos(nombre, gl) {
    var R = renderer(); if (!R) return null;
    var esc = new THREE.Scene(), m = gl.scene;
    esc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 1.6));
    var dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(-2, 4, 3); esc.add(dl);
    m.traverse(function (o) {
      if (o.isMesh && o.material) {
        var mp = o.material.map || null;
        o.material = new THREE.MeshLambertMaterial({ map: mp, color: mp ? 0xffffff : 0x999999, emissive: mp ? 0x8a8a8a : 0x000000, emissiveMap: mp, skinning: !!o.isSkinnedMesh });
        o.frustumCulled = false;
      }
    });
    var giro = new THREE.Group(); giro.add(m); esc.add(giro);
    giro.rotation.y = -0.65; /* mira hacia abajo a la izquierda, hacia tus héroes */
    var mix = null, clip = null;
    if (gl.animations && gl.animations.length) { mix = new THREE.AnimationMixer(m); clip = gl.animations.filter(function (a) { return /walk/i.test(a.name); })[0] || gl.animations[0]; mix.clipAction(clip).play(); mix.update(0); }
    // los de Mixamo miden diminutos antes de posar: se mide con los huesos ya colocados
    esc.updateMatrixWorld(true);
    var bx = new THREE.Box3(), pv = new THREE.Vector3(), hayHueso = false;
    m.traverse(function (o) { if (o.isBone) { hayHueso = true; bx.expandByPoint(o.getWorldPosition(pv)); } });
    if (!hayHueso || bx.isEmpty()) bx.setFromObject(m);
    var tam = new THREE.Vector3(); bx.getSize(tam);
    var alto = Math.max(tam.y, 0.001) * (hayHueso ? 1.12 : 1), ancho = Math.max(tam.x, tam.z, 0.001);
    var cam = new THREE.PerspectiveCamera(30, AN / AL, 0.01, 1000), dist = Math.max(alto / (2 * Math.tan(15 * Math.PI / 180)), ancho * 1.6) * 1.08;
    var cy = bx.min.y + alto * 0.5;
    cam.position.set(0, cy + alto * 0.18, dist); cam.lookAt(0, cy, 0);
    var fotos = [], dur = clip ? clip.duration : 1;
    for (var i = 0; i < (mix ? N_FOTOS : 1); i++) {
      if (mix) { mix.setTime(dur * i / N_FOTOS); }
      R.render(esc, cam);
      var c = document.createElement('canvas'); c.width = AN; c.height = AL; c.getContext('2d').drawImage(R.domElement, 0, 0); fotos.push(c);
    }
    // se suelta la memoria del modelo (las fotos ya están guardadas)
    m.traverse(function (o) { if (o.isMesh) { try { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } catch (e) {} } });
    return fotos;
  }

  function siguiente() {
    if (trabajando || !cola.length) return;
    if (!window.THREE || !THREE.GLTFLoader) { cola = []; return; }
    trabajando = true;
    var nombre = cola.shift(), e = cache[nombre];
    new THREE.GLTFLoader().load('modelos/campana/' + nombre + '.glb?v=' + VERSION, function (gl) {
      try { e.fotos = hacerFotos(nombre, gl); } catch (err) { e.falla = true; try { console.warn('Campaña · muñeco ' + nombre + ':', err); } catch (x) {} }
      trabajando = false; setTimeout(siguiente, 30);
    }, undefined, function () { e.falla = true; trabajando = false; setTimeout(siguiente, 30); });
  }

  function pedir(nombre) {
    var e = cache[nombre];
    if (!e) { e = cache[nombre] = { fotos: null, falla: false }; cola.push(nombre); siguiente(); }
    return e;
  }

  window.TKSprites = {
    /* la foto que toca: camina si «anda», si no se queda en la primera */
    foto: function (ico, jefe, anda, t) {
      var n = nombreModelo(ico, jefe); if (!n) return null;
      var e = pedir(n); if (!e.fotos || !e.fotos.length) return null;
      var k = anda && e.fotos.length > 1 ? Math.floor(((t || 0) * 9) % e.fotos.length) : 0;
      return e.fotos[k];
    },
    /* para bajar antes los de una misión: TKSprites.precargar([{ ico, jefe }]) */
    precargar: function (lista) { (lista || []).forEach(function (x) { var n = nombreModelo(x.ico, x.jefe); if (n) pedir(n); }); },
    info: function () { var o = {}; for (var k in cache) o[k] = cache[k].fotos ? cache[k].fotos.length : (cache[k].falla ? 'falla' : 'cargando'); return o; }
  };
})();
