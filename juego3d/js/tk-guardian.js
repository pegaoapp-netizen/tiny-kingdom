// v7.05: GUARDIÁN DE ERRORES
// Si algo del juego falla (por ejemplo después de cambiar un botón o agregar una pieza),
// en el teléfono del DUEÑO sale una cajita roja arriba diciendo qué falló y en qué archivo.
// Los jugadores normales no la ven. Se carga antes que todo lo demás.
(function () {
  var lista = [], caja = null, IGNORAR = /ResizeObserver loop|setPointerCapture|Script error\.?$|Failed to fetch|network|offline|Load failed/i;
  function esDueno() { try { return localStorage.getItem('tk_dueno') === '1'; } catch (e) { return false; } }
  function pintar() {
    if (!esDueno() || !document.body || !lista.length) return;
    if (!caja) {
      caja = document.createElement('div'); caja.id = 'tk-guardian';
      caja.style.cssText = 'position:fixed;z-index:99999;left:8px;right:8px;top:calc(env(safe-area-inset-top) + 6px);background:#7a1410;color:#fff;border:2px solid #ffb4a8;border-radius:10px;padding:8px 34px 8px 10px;font:12px/1.35 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.5);max-height:30vh;overflow:auto';
      caja.addEventListener('click', function (ev) { if (ev.target.getAttribute('data-x')) { caja.remove(); caja = null; lista = []; } });
      document.body.appendChild(caja);
    }
    caja.innerHTML = '<button data-x="1" style="position:absolute;top:4px;right:6px;background:none;border:0;color:#fff;font-size:18px">✕</button><b>⚠️ Algo falló en el juego (solo lo ve el dueño). Mándale una foto a Claude:</b>' +
      lista.slice(-4).map(function (e) { return '<div style="margin-top:4px;opacity:.95">• ' + e + '</div>'; }).join('');
  }
  function anotar(msg, archivo, linea) {
    msg = String(msg || 'Error'); if (IGNORAR.test(msg)) return;
    var t = msg.slice(0, 160) + (archivo ? ' — ' + String(archivo).split('/').pop().split('?')[0] + (linea ? ':' + linea : '') : '');
    if (lista.indexOf(t) >= 0) return;
    lista.push(t); pintar();
  }
  window.addEventListener('error', function (e) { anotar(e.message, e.filename, e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; anotar(r && r.message ? r.message : r, r && r.stack ? (r.stack.match(/\/([\w.-]+\.js)/) || [])[1] : '', ''); });
  document.addEventListener('DOMContentLoaded', pintar);
  window.TK_errores = function () { return lista.slice(); };
})();
