// v7.05: GUARDIÁN DE ERRORES
// Si algo del juego falla (por ejemplo después de cambiar un botón o agregar una pieza),
// en el teléfono del DUEÑO sale una cajita roja arriba diciendo qué falló y en qué archivo.
// Los jugadores normales no la ven. Se carga antes que todo lo demás.
(function () {
  var lista = [], caja = null, IGNORAR = /ResizeObserver loop|setPointerCapture|Script error\.?$|Failed to fetch|network|offline|Load failed|without an in-progress transaction|IndexedDB|IDBDatabase/i; /* v9.47: fallo conocido de Safari con la memoria del navegador (Firebase lo repite solo): no es del juego */
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

  // v7.11: PANTALLA BLANCA. Si el juego no termina de arrancar en 35 s (o falla al arrancar), sale un botón
  // que borra lo viejo guardado en el teléfono (service worker y cachés) y vuelve a cargar. Lo ven todos los jugadores.
  function reintentar() {
    var hecho = function () { location.replace(location.pathname + '?r=' + Date.now()); };
    try {
      var p = [];
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
      if (window.caches && caches.keys) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
      Promise.all(p).then(hecho, hecho); setTimeout(hecho, 2500);
    } catch (e) { hecho(); }
  }
  function botonReintentar(motivo) {
    if (window.__juegoListo || document.getElementById('tk-reintentar') || !document.body) return;
    var en = (navigator.language || '').toLowerCase().indexOf('es') !== 0;
    var b = document.createElement('div'); b.id = 'tk-reintentar';
    b.style.cssText = 'position:fixed;z-index:99998;left:50%;bottom:calc(env(safe-area-inset-bottom) + 30px);transform:translateX(-50%);width:min(340px,90vw);background:#2a1a0c;color:#fff3d0;border:2px solid #f2c45a;border-radius:14px;padding:12px;text-align:center;font:15px/1.35 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.6)';
    b.innerHTML = '<div style="margin-bottom:8px">' + (motivo === 'error' ? (en ? 'The game could not start.' : 'El juego no pudo arrancar.') : (en ? 'The game is taking too long to load.' : 'El juego está tardando en cargar.')) + '</div>' +
      '<button style="width:100%;min-height:46px;border:0;border-radius:10px;background:linear-gradient(#ffd25a,#d8901c);color:#2a1a08;font:800 16px system-ui,sans-serif">🔄 ' + (en ? 'Tap to retry' : 'Toca para reintentar') + '</button>';
    b.querySelector('button').addEventListener('click', function () { this.disabled = true; this.textContent = '…'; reintentar(); });
    document.body.appendChild(b);
  }
  setTimeout(function () { botonReintentar('lento'); }, 35000);
  window.addEventListener('error', function () { setTimeout(function () { botonReintentar('error'); }, 3000); });
  window.TK_errores = function () { return lista.slice(); };
})();
