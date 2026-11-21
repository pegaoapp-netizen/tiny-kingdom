// v6.81: estilos de cargos, logros, perfil con pestañas, evento de fin de semana y flecha de la misión
(function () {
  var css = [
    '.pf-tabs { margin: 8px 0 10px; }',
    '.pf-n { display: inline-block; min-width: 16px; padding: 0 4px; margin-left: 4px; border-radius: 8px; background: #d2232a; color: #fff; font-style: normal; font-size: 11px; line-height: 16px; }',
    '.pf-avatar { position: relative; }',
    '.pf-vip { position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); padding: 0 5px; border-radius: 6px; background: linear-gradient(#3a5fd0, #1e2f80); border: 1px solid #c9a24a; color: #ffe9a0; font-style: normal; font-size: 10px; font-weight: 900; white-space: nowrap; }',
    '.cg-lista, .lg-lista { display: flex; flex-direction: column; gap: 8px; }',
    '#panel .carta.cg-fila, #panel .carta.lg-fila { display: flex !important; flex-direction: row !important; gap: 10px; align-items: center !important; text-align: left !important; }',
    '#panel .cg-dat, #panel .lg-dat { align-items: stretch !important; text-align: left !important; }',
    '.cg-ico, .lg-ico { flex: none; width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; background: linear-gradient(#3a2a14, #1c140a); border: 1px solid #c9a24a; }',
    '.cg-dat, .lg-dat { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }',
    '.cg-dat small, .lg-dat small { opacity: .85; }',
    '.cg-pct { color: #7be07b; }',
    '.cg-sel { width: 100%; margin: 0 !important; }',
    '.lg-med { display: flex; gap: 6px; align-items: center; }',
    '.lg-m { font-size: 20px; filter: grayscale(1); opacity: .35; }',
    '.lg-m.si { filter: none; opacity: 1; }',
    '.fd-evento { border: 1px solid #c9a24a !important; background: linear-gradient(90deg, rgba(201,162,74,.18), rgba(0,0,0,0)) !important; }',
    '.fd-esc { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin-top: 6px; }',
    '.fd-esc .pr-barra { flex: 1 1 100%; }',
    '.fd-esc small { flex: 1; }',
    '#flecha-mision { position: fixed; z-index: 60; transform: translateX(-50%); pointer-events: none; font-size: 26px; color: #ffd23a; text-shadow: 0 0 6px #000, 0 2px 0 #7a4a00; animation: tkFlecha .8s ease-in-out infinite alternate; }',
    'body.tema-oscuro #panel.tropas-oscuro .tropa-elegir { max-height: 200px; overflow-y: auto; scrollbar-width: none; padding-right: 2px; }',
    'body.tema-oscuro #panel.tropas-oscuro .tropa-elegir::-webkit-scrollbar { display: none; }',
    'body.tema-oscuro #panel.tropas-oscuro .tropa-elegir button { background: radial-gradient(circle at 50% 35%, #fff3cf 0%, #d9a54a 55%, #6b3e12 100%) !important; padding: 1px !important; }',
    'body.tema-oscuro #panel.tropas-oscuro .tropa-elegir img { border-radius: 9px; filter: saturate(1.35) contrast(1.12) drop-shadow(0 2px 2px rgba(0,0,0,.45)); }',
    'body.tema-oscuro #panel.tropas-oscuro .rangos { bottom: 30px !important; }',
    '#panel .foto img, .fila-ref .foto img { filter: saturate(1.2) contrast(1.06); }',
    '#panel .foto { background: radial-gradient(circle at 50% 35%, #fff3cf 0%, #d9a54a 60%, #6b3e12 100%) !important; }',
    '#mundo-mapa::after { background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 70%, rgba(7, 11, 22, .28) 90%, rgba(7, 11, 22, .55) 100%) !important; }',
    'body.en-mundo #juego canvas, #mundo canvas { filter: brightness(1.15) saturate(1.12); }',
    '#juego canvas { filter: saturate(1.12) contrast(1.04); }',
    '#panel .panel-cab .cerrar, #panel-cerrar, #ac-cerrar, #eq-cerrar, #eq-guia-x, [data-el="x"], #fc-x, #fc-x2, #lupa-cerrar, [data-mc="cerrar"], #oi-x, [data-pj="cerrar"] { display: none !important; }',
    '#panel .panel-cab #panel-gemas { margin-left: auto !important; margin-right: 0 !important; }',
    'body.tema-oscuro #panel.cafe { position: fixed !important; top: 0 !important; bottom: 0 !important; left: 0 !important; right: 0 !important; width: auto !important; max-width: none !important; max-height: none !important; min-height: 0 !important; height: 100dvh !important; margin: 0 !important; border-radius: 0 !important; transform: none !important; z-index: 90 !important; padding-top: max(8px, env(safe-area-inset-top)) !important; padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important; box-sizing: border-box !important; overflow-y: auto !important; }',
    'body.tema-oscuro #panel.cafe .ve-icono { cursor: pointer; }',
    'body.tema-oscuro #panel.cafe .ve-icono:active { transform: scale(.92); }',
    'body.tema-oscuro #panel.cafe .subtabs, body.tema-oscuro #panel.cafe .cs-tabs { display: flex !important; flex-wrap: nowrap !important; gap: 4px !important; overflow: visible !important; }',
    'body.tema-oscuro #panel.cafe .subtabs button, body.tema-oscuro #panel.cafe .cs-tabs button { flex: 1 1 0 !important; min-width: 0 !important; padding: 8px 2px !important; font-size: 12.5px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
    'body.tema-oscuro #panel.cafe table.req { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; background: rgba(18, 11, 6, .72) !important; border: 1px solid #7a5428 !important; border-radius: 8px !important; overflow: hidden; font-size: 13.5px !important; }',
    'body.tema-oscuro #panel.cafe table.req th { background: linear-gradient(#3a2614, #24170c) !important; color: #e8d6a8 !important; font-weight: 700 !important; padding: 7px 8px !important; border-bottom: 1px solid #7a5428 !important; text-align: center !important; }',
    'body.tema-oscuro #panel.cafe table.req th:first-child, body.tema-oscuro #panel.cafe table.req td:first-child { text-align: left !important; }',
    'body.tema-oscuro #panel.cafe table.req td { background: transparent !important; color: #f3e6c8 !important; font-weight: 600 !important; padding: 6px 8px !important; border-bottom: 1px solid rgba(122, 84, 40, .35) !important; text-align: center !important; }',
    'body.tema-oscuro #panel.cafe table.req tr.no td:first-child, body.tema-oscuro #panel.cafe table.req tr.no td:nth-child(2) { color: #ff6b5b !important; }',
    'body.tema-oscuro #panel.cafe table.req tr.tiempo td { color: #ffd77a !important; border-bottom: 0 !important; }',
    'body.tema-oscuro #panel.cafe .banner-rojo { background: linear-gradient(#e0413a, #a8221c) !important; border: 1px solid #ff8a7a !important; border-radius: 6px !important; color: #fff !important; font-size: 13px !important; padding: 12px 10px !important; text-align: center !important; box-shadow: inset 0 0 12px rgba(0,0,0,.3) !important; }',
    'body.tema-oscuro #panel.cafe .sig-nivel { background: rgba(18, 11, 6, .55) !important; border: 1px solid #7a5428 !important; border-radius: 8px !important; }',
    'body.tema-oscuro #panel .cq2-foto { background: radial-gradient(circle at 50% 35%, #fff3cf 0%, #d9a54a 60%, #6b3e12 100%) !important; }',
    'body.tema-oscuro #panel .cq2-foto img { filter: saturate(1.3) contrast(1.1) drop-shadow(0 2px 2px rgba(0,0,0,.45)); }',
    'body.tema-oscuro #panel.cafe .ve-foto, body.tema-oscuro #panel.cafe .ve-det .foto { width: 96px !important; height: 96px !important; border-radius: 10px !important; overflow: hidden; }',
    '@keyframes tkFlecha { from { margin-top: -6px; } to { margin-top: 4px; } }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-v681'; st.textContent = css; document.head.appendChild(st);

  // sin cruces: cada ventana se cierra tocando fuera de ella (en el mapa, en las barras o en cualquier otro lugar)
  var CRUCES = ['#panel-cerrar', '#ac-cerrar', '#eq-cerrar', '#eq-guia-x', '[data-el="x"]', '#fc-x', '#fc-x2', '#lupa-cerrar', '[data-mc="cerrar"]', '#oi-x', '[data-pj="cerrar"]'];
  function tarjetaDe(b) {
    if (b.id === 'panel-cerrar') return document.getElementById('panel');
    var e = b.parentElement;
    while (e && e !== document.body) { var cs = getComputedStyle(e); if ((cs.position === 'fixed' || cs.position === 'absolute') && e.offsetWidth < innerWidth * 0.98) return e; e = e.parentElement; }
    return null;
  }
  function abierta(c) { if (!c || c.classList.contains('oculto')) return false; var r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(c).visibility !== 'hidden'; }
  document.addEventListener('pointerdown', function (ev) {
    var t = ev.target;
    if (t.closest && t.closest('#recompensas, #confirmar-juego, #rul-premios, #uso-masa, #usar-acel, #nivel-nuevo, .rc-caja, #eq-elegir, #eq-info, #eq-guia, #elevar-heroe')) return; // v7.34: elegir pieza o elevar ya no cierra la ficha del héroe // v6.88: las ventanitas encima no cierran la de abajo
    CRUCES.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (b) {
        var c = tarjetaDe(b);
        if (b.id === 'panel-cerrar' && t.closest && t.closest('#abajo, #tk-arriba, #lateral, #cajon-lateral, #menu-grande, #btn-menu-mas')) return; // esos botones ya cambian o cierran la ventana
        if (abierta(c) && !c.contains(t)) setTimeout(function () { if (abierta(c)) b.click(); }, 0);
      });
    });
  }, true);

  // como en los grandes juegos de castillos: el icono de arriba a la izquierda de la ventana vuelve a la ciudad
  document.addEventListener('click', function (ev) { var ic = ev.target.closest && ev.target.closest('#panel .ve-icono'); if (ic) { var x = document.getElementById('panel-cerrar'); if (x) x.click(); } });
})();
