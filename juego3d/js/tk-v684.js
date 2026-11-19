// v6.84: la misión va ABAJO (encima del chat, como pidió el dueño), panel de regalos del dueño
(function () {
  var css = [
    'html body #mision#mision { top: auto !important; height: auto !important; left: 8px !important; max-width: min(64vw, 360px) !important; }',
    'body:has(#mision:not(.oculto)) #consejo { top: calc(env(safe-area-inset-top) + 98px) !important; }',
    '#panel .rg-carta h4 { margin: 10px 0 4px; font-size: 13px; color: #ffd98a; }',
    '#panel .rg-busca { display: flex; gap: 6px; } #panel .rg-busca .campo { flex: 1; min-width: 0; } #panel .rg-busca .comprar { flex: 0 0 52px; }',
    '#panel .rg-lista { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; max-height: 210px; overflow: auto; }',
    '#panel .rg-jug { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 10px; border: 1px solid #6a4a22; background: linear-gradient(#3a2a18, #24180e); color: #f3e3c0; font: inherit; text-align: left; }',
    '#panel .rg-jug small { opacity: .75; white-space: nowrap; } #panel .rg-jug.sel { border-color: #ffd23a; box-shadow: 0 0 0 2px #ffd23a55; background: linear-gradient(#5a4220, #3a2a12); }',
    '#panel .rg-rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; }',
    '#panel .rg-celda { display: flex; flex-direction: column; gap: 3px; font-size: 12px; } #panel .rg-celda span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
    '#panel .rg-celda .campo { width: 100%; box-sizing: border-box; padding: 7px 8px; }',
    '#panel #rg-nota { width: 100%; box-sizing: border-box; margin-top: 10px; } #panel .rg-enviar { width: 100%; margin-top: 10px; font-size: 16px; padding: 12px; }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-v684'; st.textContent = css; document.head.appendChild(st);
})();
