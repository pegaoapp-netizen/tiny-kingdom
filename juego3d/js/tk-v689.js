// v6.89: en TODAS las ventanas el título, el botón «Más» y las pestañas de arriba se quedan fijos;
// solo baja la lista de abajo. Las pestañas que van al principio del cuerpo se pasan a una franja fija (#panel-fijo).
(function () {
  var PEST = '.iv-modos, .iv-cats, .subtabs, .tienda-arriba, .tienda-saldo, .cafe-tabs, .dk-tabs, .hi-tabs, .hl-tabs, .tg-tabs, .al-tabs';
  function listo() {
    var panel = document.getElementById('panel'), cuerpo = document.getElementById('panel-cuerpo');
    if (!panel || !cuerpo) return setTimeout(listo, 300);
    var fijo = document.getElementById('panel-fijo');
    if (!fijo) { fijo = document.createElement('div'); fijo.id = 'panel-fijo'; panel.insertBefore(fijo, cuerpo); }
    function excluido() { return panel.classList.contains('co-panel') || panel.classList.contains('rul-panel'); }
    function fijar() {
      fijo.innerHTML = '';
      if (excluido()) { fijo.style.display = 'none'; return; }
      var n;
      while ((n = cuerpo.firstElementChild) && n.matches && n.matches(PEST)) fijo.appendChild(n);
      fijo.style.display = fijo.childElementCount ? '' : 'none';
      // ojo con las pestañas que se deslizan: dejar la elegida a la vista
      var act = fijo.querySelector('.iv-carril .activo'); if (act && act.scrollIntoView) { var cr = act.parentNode; cr.scrollLeft = Math.max(0, act.offsetLeft - cr.offsetLeft - 4); }
    }
    new MutationObserver(function (recs) {
      var nuevo = false;
      recs.forEach(function (r) { if (r.target === cuerpo && r.addedNodes.length && Array.prototype.indexOf.call(r.addedNodes, cuerpo.firstElementChild) >= 0) nuevo = true; });
      if (nuevo) fijar();
      else if (!cuerpo.firstElementChild) { fijo.innerHTML = ''; fijo.style.display = 'none'; }
    }).observe(cuerpo, { childList: true });
    new MutationObserver(function () { if (panel.classList.contains('oculto')) { fijo.innerHTML = ''; fijo.style.display = 'none'; } }).observe(panel, { attributes: true, attributeFilter: ['class'] });
    var st = document.createElement('style');
    st.textContent = [
      'html body #panel#panel:not(.oculto) { display: flex !important; flex-direction: column !important; overflow: hidden !important; }',
      'html body #panel#panel .panel-cab { flex: none !important; position: relative !important; top: auto !important; }',
      'html body #panel#panel #panel-fijo { flex: none; padding: 8px 10px 6px; background: linear-gradient(180deg, rgba(40,26,14,.98), rgba(28,18,9,.98)); border-bottom: 1px solid rgba(201,138,26,.55); box-shadow: 0 3px 6px rgba(0,0,0,.45); z-index: 3; }',
      'html body #panel#panel #panel-fijo > * { position: static !important; margin-top: 0 !important; margin-bottom: 6px !important; animation: none !important; }',
      'html body #panel#panel #panel-fijo > *:last-child { margin-bottom: 0 !important; }',
      'html body #panel#panel:not(.co-panel):not(.rul-panel) #panel-cuerpo { flex: 1 1 auto !important; min-height: 0 !important; overflow-y: auto !important; overflow-x: hidden !important; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; transform: translateZ(0); contain: paint; }',
      // filas: cada una con su espacio, sin montarse
      'html body #panel#panel #panel-cuerpo .iv-fila, html body #panel#panel #panel-cuerpo .fila-tienda, html body #panel#panel #panel-cuerpo .al-fila, html body #panel#panel #panel-cuerpo .cq2-fila { position: relative; flex-shrink: 0; overflow: hidden; contain: layout paint; }',
      'html body #panel#panel #panel-cuerpo > * { animation: none !important; }',
      'html body #panel#panel .fila-tienda .ft-info, html body #panel#panel .iv-dat { min-width: 0; flex: 1 1 auto; }',
      'html body #panel#panel .fila-tienda .ft-info b, html body #panel#panel .fila-tienda .ft-info small { white-space: normal; overflow-wrap: anywhere; }',
      'html body #panel#panel .fila-tienda > button, html body #panel#panel .fila-tienda .comprar { flex: none; }',
      // «Más» y la X cada uno en su sitio
      'html body #panel#panel .panel-cab { display: flex !important; align-items: center !important; gap: 8px !important; }',
      'html body #panel#panel .panel-cab #panel-titulo { flex: 1 1 auto !important; min-width: 0 !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      'html body #panel#panel .panel-cab #panel-gemas, html body #panel#panel .panel-cab .cafe-mas { flex: none !important; position: static !important; margin: 0 !important; transform: none !important; }',
      'html body #panel#panel .panel-cab #panel-cerrar { flex: none !important; position: static !important; margin: 0 !important; transform: none !important; }',
      'html body #panel#panel:has(.cafe-mas) #panel-gemas { display: none !important; }'
    ].join('\n');
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', listo); else listo();
})();
(function () { var st = document.createElement('style'); st.textContent =
  'html body #panel#panel #panel-fijo .tienda-saldo { display: none !important; }\n' +
  'html body #panel#panel #panel-fijo .tienda-tabs { display: flex !important; flex-wrap: nowrap !important; gap: 4px !important; }\n' +
  'html body #panel#panel #panel-fijo .tienda-tabs button { flex: 1 1 0 !important; min-width: 0 !important; padding: 8px 2px !important; font-size: 12px !important; white-space: nowrap; }';
  document.head.appendChild(st); })();
