/* v9.28 · LUCIÉRNAGAS de noche en jardines, árboles y río (idea y sitios de ChatGPT; capa y movimiento de Claude).
   Capa aparte: no toca el cielo, la luz, la niebla ni el ciclo de noche. Los sitios los da juego.js (__tkExtras.lugaresLuciernagas).
   Una sola llamada de dibujo. Calidad Alta: se mueven despacio. Calidad Baja o «movimiento reducido»: quietas, sin coste por fotograma.
   Se esconden con lluvia o nieve. Para probar sin ellas: ?sinLuciernagas=1 o TKLuciernagas.poner(false). */
(function () {
  var pt = null, base = null, t = 0, intentos = 0;
  var permitido = !/[?&]sinLuciernagas=1(?:&|$)/.test(location.search), quieto = false;
  try { quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function crear(x) {
    var lista = x.lugaresLuciernagas ? x.lugaresLuciernagas() : null;
    if (!lista || !lista.length || !window.NOCHE || !x.escena) return false;
    pt = NOCHE.puntosLuz(lista, 0xd6ff8a, 3.2, 0); // la misma luz suave que las antorchas (PointsMaterial: crece con el pixelRatio y se achica con la distancia)
    pt.visible = false; pt.raycast = function () {}; pt.name = 'luciernagas';
    base = new Float32Array(pt.geometry.attributes.position.array);
    x.escena.add(pt);
    return true;
  }
  function cadaFotograma(dt) {
    var x = window.__tkExtras, j = window.__juego; if (!x) return;
    if (!pt) { if (intentos > 600 || !crear(x)) { intentos++; return; } }
    var k = j && j.noche ? j.noche() : 0, clima = window.TKClima && window.TKClima.estado();
    var ver = permitido && k > 0.05 && !(clima && clima.actual && clima.actual !== 'nada');
    pt.visible = ver; if (!ver) return;
    pt.material.opacity = Math.min(0.9, k * 0.9) * (0.85 + 0.15 * Math.sin(t * 1.3));
    if (quieto || x.calidad() !== 'alta' || !x.activo()) return;
    t = (t + Math.max(0, Math.min(0.05, dt || 0))) % 10000;
    var a = pt.geometry.attributes.position, v = a.array;
    for (var i = 0; i < v.length; i += 3) {
      var f = i * 0.37;
      v[i] = base[i] + Math.sin(t * 0.5 + f) * 0.45;
      v[i + 1] = base[i + 1] + Math.sin(t * 0.9 + f * 1.7) * 0.25;
      v[i + 2] = base[i + 2] + Math.cos(t * 0.43 + f) * 0.45;
    }
    a.needsUpdate = true;
  }
  window.TKLuciernagas = {
    cadaFotograma: cadaFotograma,
    poner: function (v) { permitido = !!v; if (!permitido && pt) pt.visible = false; },
    estado: function () { return { cantidad: base ? base.length / 3 : 0, visible: !!(pt && pt.visible), permitido: permitido, tam: pt ? pt.material.size : 0 }; }
  };
})();
