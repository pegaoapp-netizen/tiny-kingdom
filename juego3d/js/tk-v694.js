// v6.94: TODAS las tarjetas suben desde abajo y se abren completas hasta arriba (como Kingdoms of Camelot):
// título, «Más» y pestañas fijos arriba; la lista baja; el chat con su caja de escribir abajo.
// Única excepción: la tarjeta de la Paloma (Potenciador), que sale en el centro como un pergamino (clase .tk-centro).
(function () {
  var H = 'html body #panel#panel#panel';
  var css = [
    // la hoja ocupa toda la pantalla, de abajo hasta arriba
    H + '.desde-abajo:not(.oculto):not(.tk-centro) { position: fixed !important; top: 0 !important; bottom: 0 !important; left: 0 !important; right: 0 !important;' +
      ' width: 100vw !important; max-width: 100vw !important; height: auto !important; max-height: none !important; min-height: 0 !important; margin: 0 !important;' +
      ' border-radius: 0 !important; z-index: 70 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important;' +
      ' padding-top: env(safe-area-inset-top) !important; padding-bottom: env(safe-area-inset-bottom) !important; animation: tkHojaSube .32s cubic-bezier(.2, .85, .25, 1) both !important; }',
    '@keyframes tkHojaSube { from { clip-path: inset(100% 0 0 0); opacity: .6; } to { clip-path: inset(0 0 0 0); opacity: 1; } }',
    H + '.desde-abajo:not(.tk-centro) .panel-cab { flex: none !important; position: relative !important; top: auto !important; border-radius: 0 !important; }',
    H + '.desde-abajo:not(.tk-centro) #panel-cuerpo { flex: 1 1 auto !important; min-height: 0 !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }',
    // con una tarjeta abierta no se ve la barra del chat ni los botones del mapa por encima
    'body.panel-abierto #chat-barra, body.panel-abierto #barra-chat, body.panel-abierto #flecha-mision { display: none !important; }',
    // CHAT: pestañas arriba, mensajes en medio, caja de escribir abajo; los textos no se cortan
    H + '.perg #panel-cuerpo { display: flex !important; flex-direction: column !important; overflow: hidden !important; }',
    H + '.perg #panel-cuerpo > .nota { flex: none; white-space: normal !important; overflow: visible !important; text-overflow: clip !important; line-height: 1.35 !important; padding: 8px 4px !important; }',
    H + '.perg #panel-cuerpo .chat-lista { flex: 1 1 auto !important; min-height: 0 !important; max-height: none !important; height: auto !important; overflow-y: auto !important; }',
    H + '.perg #panel-cuerpo .chat-m, ' + H + '.perg #panel-cuerpo .chat-m * { white-space: normal !important; overflow-wrap: anywhere; }',
    H + '.perg #panel-cuerpo .chat-escribir { flex: none !important; position: relative !important; display: flex !important; gap: 6px; margin-top: 6px; }',
    H + '.perg #panel-cuerpo .chat-escribir input { flex: 1 1 auto; min-width: 0; font-size: 16px !important; padding: 10px 12px !important; }',
    H + '.perg #panel-cuerpo .pv-lista { flex: 1 1 auto; min-height: 0; overflow-y: auto; }',
    H + '.perg #panel-cuerpo .chat-normas { flex: none; font-size: 11px !important; }',
    // el menú ☰ también sube desde abajo (como una barra de abajo)
    'html body #menu-grande:not(.oculto) { animation: tkHojaSube .3s cubic-bezier(.2, .85, .25, 1) both !important; }',
    // MUNDO: X e Y grandes y legibles, se escriben directo; la lupa «Ir» al lado
    'body #mundo #mundo-xy { height: 46px !important; gap: 6px !important; padding: 0 8px !important; justify-content: center !important; z-index: 8 !important; }',
    '#mundo-xy #mundo-xy-t { display: flex; align-items: center; gap: 5px; }',
    '#mundo-xy .mxy-et { font-weight: 800; font-size: 15px; color: #ffe08a; text-shadow: 0 1px 0 #000; }',
    '#mundo-xy .mxy-in { width: 58px; height: 34px; box-sizing: border-box; border-radius: 7px; border: 2px solid #e0b060; background: #fff8e6; color: #2a1606; font: 800 18px/1 system-ui, sans-serif; text-align: center; padding: 0 4px; -webkit-user-select: text; user-select: text; touch-action: manipulation; }',
    '#mundo-xy .mxy-in:focus { outline: none; border-color: #ffd23a; box-shadow: 0 0 0 3px rgba(255,210,58,.45); }',
    '#mundo-xy .mxy-lupa { width: auto !important; height: 34px !important; padding: 0 12px !important; border-radius: 8px !important; border: 2px solid #8a5a12 !important; font: 800 15px/1 system-ui, sans-serif !important; color: #3a2000 !important; display: inline-flex !important; align-items: center; gap: 4px; cursor: pointer; }',
    '#mundo-xy .mxy-lupa:active { filter: brightness(1.15); scale: .94; }',
    // fondo siempre opaco: no se transparenta el mapa detrás de la tarjeta
    H + '.desde-abajo:not(.tk-centro) { background-color: #1b130b !important; }',
    // Tropas: lista de filas
    H + ' .tk-tropas-lista { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }',
    H + ' .tk-volver-lista { margin: 6px 0 4px !important; }',
    // tropas de suministro (Mercado): una fila por tipo con foto, Tienes, carga, velocidad, tiempo y dónde se entrenan
    '.sum-fila { border: 1px solid rgba(201,138,26,.55); border-radius: 10px; padding: 8px; margin: 8px 0; background: linear-gradient(180deg, rgba(60,40,20,.85), rgba(30,20,10,.85)); }',
    '.sum-fila.bloq { opacity: .75; } .sum-cab { display: flex; gap: 10px; align-items: center; }',
    '.sum-foto { flex: none; width: 64px; height: 64px; border-radius: 9px; overflow: hidden; display: grid; place-items: center; font-size: 34px; background: radial-gradient(circle at 50% 35%, #fff3cf 0%, #d9a54a 60%, #6b3e12 100%); border: 2px solid #c98a1a; }',
    '.sum-foto img { width: 100%; height: 100%; object-fit: cover; }',
    '.sum-dat { display: flex; flex-direction: column; gap: 2px; min-width: 0; } .sum-dat b { font-size: 15px; color: #ffe08a; } .sum-dat small { color: #f0c060; font-weight: 700; } .sum-frase { font-size: 12px; opacity: .9; }',
    '.sum-stats { display: flex; flex-wrap: wrap; gap: 4px; margin: 7px 0 4px; } .sum-stats span { font-size: 11.5px; padding: 3px 7px; border-radius: 999px; background: rgba(0,0,0,.35); border: 1px solid rgba(201,138,26,.45); }',
    '.sum-fila .car-botones { display: flex; gap: 5px; flex-wrap: wrap; } .sum-fila .car-botones .comprar { flex: 1 1 0; min-width: 0; font-size: 12px !important; padding: 7px 4px !important; }',
    '#perfil-jugador .pj-extra { margin-top: 10px; } #perfil-jugador .pj-extra button.pj-oro { background: linear-gradient(180deg, #ffd56a, #d89a1a) !important; color: #3a2000 !important; border-color: #7a4a0a !important; }',
    // Hospital
    '.hosp-camas { display: flex; flex-direction: column; gap: 5px; margin: 4px 0 8px; } .hosp-barra { height: 12px; border-radius: 999px; background: rgba(0,0,0,.45); border: 1px solid #c98a1a; overflow: hidden; }',
    '.hosp-barra i { display: block; height: 100%; background: linear-gradient(90deg, #5fd06a, #e8c23a 70%, #e0523a); }',
    '.hosp-fila { cursor: default !important; } .hosp-fila .cq2-dat { flex: 1; gap: 6px; } .hosp-fila .comprar { align-self: flex-start; font-size: 12px !important; padding: 6px 10px !important; }',
    '.hosp-todos { width: 100%; margin-top: 10px !important; font-size: 15px !important; }',
    // la Paloma (Potenciador): pergamino en el centro
    H + '.tk-centro:not(.oculto) { position: fixed !important; top: 50% !important; left: 50% !important; bottom: auto !important; right: auto !important; width: min(92vw, 420px) !important; max-width: 92vw !important;' +
      ' height: auto !important; max-height: 78vh !important; transform: translate(-50%, -50%) !important; border-radius: 16px !important; z-index: 70 !important;' +
      ' background: linear-gradient(#f4e2b4, #e2c88a) !important; border: 3px solid #8a5a22 !important; box-shadow: 0 10px 40px rgba(0,0,0,.65) !important; animation: tkFade .22s ease-out both !important; }',
    H + '.tk-centro .panel-cab, ' + H + '.tk-centro #panel-cuerpo, ' + H + '.tk-centro #panel-cuerpo * { color: #3a2410 !important; }',
    H + '.tk-centro #panel-cuerpo { overflow-y: auto !important; }',
    '@keyframes tkFade { from { opacity: 0; } to { opacity: 1; } }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-v694'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
