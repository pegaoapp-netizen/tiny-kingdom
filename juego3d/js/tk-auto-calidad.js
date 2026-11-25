/* v9.19 · CALIDAD AUTOMÁTICA: si el juego va lento en Calidad Alta, pasa solo a Baja y lo avisa.
   Usa el mismo botón de Calidad de Ajustes (no crea otro sistema). Si eliges la calidad tú en Ajustes, ya no la cambia nunca.
   También junta en TKExtras lo que se hace cada fotograma (clima y esta medición). */
(function () {
  var X = function () { return window.__tkExtras; };
  var arranque = 0, ventana = 0, fotos = 0, lentas = 0, hecho = false;
  var MIN_FPS = 24, MEDIR = 5, ESPERA = 20; // fps mínimos, segundos de cada medida, segundos de espera al entrar (cargas)
  function medir(dt) {
    var x = X(); if (!x || hecho) return;
    if (!x.activo()) { ventana = 0; return; }
    if (x.calidad() !== 'alta' || x.pref().calidadElegida) { hecho = true; return; } // ya va en Baja, o la eligió el jugador
    var ahora = performance.now() / 1000; // tiempo real (dt viene recortado a 0,05 s y no sirve para medir)
    if (!arranque) arranque = ahora; if (ahora - arranque < ESPERA) return;
    if (!ventana) { ventana = ahora; fotos = 0; return; }
    fotos++; if (ahora - ventana < MEDIR) return;
    var fps = fotos / (ahora - ventana); ventana = 0;
    lentas = fps < MIN_FPS ? lentas + 1 : 0;
    if (lentas >= 2) { // dos medidas seguidas lentas (10 s): baja la calidad
      hecho = true; x.ponerCalidad('baja');
      x.consejo('⚙️ ' + x.L('El juego iba lento: he puesto la calidad en Baja. Puedes cambiarla en Ajustes.', 'The game was slow: quality set to Low. You can change it in Settings.'));
    }
    window.__tkAutoCalidad = { fps: Math.round(fps), lentas: lentas };
  }
  window.TKExtras = {
    cadaFotograma: function (dt) { medir(dt); if (window.TKClima) window.TKClima.cadaFotograma(dt); }
  };
})();
