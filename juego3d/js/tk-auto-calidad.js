/* v9.27: medición continua de ciudad, sin contar pausas ni pestañas ocultas. */
(function () {
  var X = function () { return window.__tkExtras; };
  var arranque = null, anterior = null, ventana = null, fotos = 0, lentas = 0;
  var iniciado = false, espera = 20;
  var muestras = [], ultima = null, cambios = 0;
  function reiniciar() { arranque = anterior = ventana = null; fotos = lentas = 0; }
  function medir() {
    var x = X(); if (!x || !x.activo()) { reiniciar(); return; }
    var ahora = performance.now() / 1000;
    if (anterior !== null && ahora - anterior > 2) reiniciar();
    anterior = ahora;
    if (arranque === null) { arranque = ahora; espera = iniciado ? 5 : 20; }
    if (ahora - arranque < espera) return;
    iniciado = true;
    if (ventana === null) { ventana = ahora; fotos = 0; return; }
    fotos++;
    if (ahora - ventana < 5) return;
    var fps = fotos / (ahora - ventana), info = x.render && x.render.info;
    ventana = ahora; fotos = 0;
    var manual = !!x.pref().calidadElegida;
    lentas = !manual && x.calidad() === 'alta' && fps < 24 ? lentas + 1 : 0;
    ultima = { fps: Math.round(fps), lentas: lentas, calidad: x.calidad(), manual: manual,
      llamadas: info ? info.render.calls : null, triangulos: info ? info.render.triangles : null,
      texturas: info ? info.memory.textures : null, geometrias: info ? info.memory.geometries : null };
    muestras.push(ultima); if (muestras.length > 60) muestras.shift();
    window.__tkAutoCalidad = Object.assign({}, ultima);
    if (lentas >= 2) {
      x.ponerCalidad('baja'); cambios++; lentas = 0;
      x.consejo('⚙️ ' + x.L('El juego iba lento: he puesto la calidad en Baja. Puedes cambiarla en Ajustes.', 'The game was slow: quality set to Low. You can change it in Settings.'));
    }
  }
  document.addEventListener('visibilitychange', reiniciar);
  window.TKRendimiento = { informe: function () { return { ultima: ultima && Object.assign({}, ultima), cambios: cambios, muestras: muestras.map(function (m) { return Object.assign({}, m); }) }; } };
  window.TKExtras = { cadaFotograma: function (dt) { medir(); if (window.TKClima) window.TKClima.cadaFotograma(dt); if (window.TKLuciernagas) window.TKLuciernagas.cadaFotograma(dt); } }; // v9.28: luciérnagas
})();
