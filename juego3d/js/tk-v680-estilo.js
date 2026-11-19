// v6.80: estilos nuevos (barra de arriba sin ES/👤, contraste, perfil)
(function () {
    var css = [
      '#tk-arriba .tk-fila1 { grid-template-columns: 1.1fr 1.2fr 0.8fr !important; }',
      '#tk-jugador:active { filter: brightness(1.25); }',
      'html, body { height: 100dvh; }',
      'body.tema-oscuro #lateral .pill { background: rgba(20, 15, 10, .85) !important; border: 1px solid #c9a24a !important; box-shadow: 0 1px 4px rgba(0,0,0,.5) !important; }',
      'body.tema-oscuro #lateral .pill, body.tema-oscuro #lateral .pill * { color: #fff4d0 !important; text-shadow: 0 1px 2px #000 !important; }',
      'body.tema-oscuro #lateral .pill b, body.tema-oscuro #lateral .pill b#escudo-t, body.tema-oscuro #lateral .pill b#tropas, body.tema-oscuro #lateral .pill b#oleada, body.tema-oscuro #lateral .pill b#entreno-t { color: #fff4d0 !important; -webkit-text-fill-color: #fff4d0 !important; text-shadow: 0 1px 2px #000 !important; }',
      '#consejo { transition: opacity .6s ease; }',
      '#consejo.tk-fuera { opacity: 0 !important; pointer-events: none !important; }',
      'body.tema-oscuro #abajo .pestana, body.tema-oscuro #abajo .pestana * { color: #fff !important; text-shadow: 0 1px 2px #000, 0 0 3px #000 !important; }',
      'body.tema-oscuro #chat-barra { background: rgba(0, 0, 0, .65) !important; backdrop-filter: blur(3px); }',
      '.pf-arriba { display: flex; justify-content: flex-end; margin-bottom: -34px; position: relative; z-index: 1; }',
      '.pf-boton { width: 38px; height: 38px; border-radius: 9px; font-size: 20px; cursor: pointer; background: linear-gradient(#5a3a1a, #2e1c0c); border: 1px solid #c9a24a; }',
      '.pf-cabeza { display: flex; align-items: center; gap: 10px; margin: 4px 0 10px; }',
      '.pf-avatar { width: 56px; height: 56px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 32px; background: linear-gradient(#3a2a14, #1c140a); border: 2px solid #c9a24a; flex: none; }',
      '.pf-nombre { display: flex; flex-direction: column; min-width: 0; }',
      '.pf-nombre b { font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.pf-nombre small { opacity: .75; font-size: 12px; }',
      '.pf-fila { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 3px 0; }',
      '.pf-fila b { text-align: right; }',
      '.pf-barra { height: 14px; border-radius: 7px; background: #1a1208; border: 1px solid #c9a24a; overflow: hidden; margin: 4px 0; }',
      '.pf-barra div { height: 100%; background: linear-gradient(#ffb43a, #e07a10); }',
      '.pf-abajo { display: flex; gap: 8px; margin-top: 10px; }',
      '.pf-abajo .comprar { flex: 1; }'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'tk-v680'; st.textContent = css; document.head.appendChild(st);
    // sin botones ES / 👤 arriba: siguen existiendo (escondidos) porque juego.js los usa; el idioma está en Ajustes
    var tb = document.querySelector('#tk-arriba .tk-botones'); if (tb) tb.style.display = 'none';

})();
