// v7.14: estilos del combate por rondas (informe de batalla), la tienda nueva y la ascensión
(function () {
  var css = [
    '.kb-det { margin-top: 10px; padding: 8px; border-radius: 10px; background: rgba(0,0,0,.28); border: 1px solid rgba(201,138,26,.5); }',
    '.kb-det h4 { margin: 8px 0 4px; color: #ffd98a; font-size: 13px; }',
    '.kb-rondas { margin: 0 0 4px; font-weight: 800; color: #ffe08a; }',
    '.kb-tabla { width: 100%; border-collapse: collapse; font-size: 12px; }',
    '.kb-tabla th { text-align: left; color: #e8c27a; font-weight: 700; padding: 3px 4px; border-bottom: 1px solid rgba(201,138,26,.5); }',
    '.kb-tabla td { padding: 3px 4px; border-bottom: 1px solid rgba(255,255,255,.07); } .kb-tabla td:not(:first-child), .kb-tabla th:not(:first-child) { text-align: right; }',
    '.kb-rojo { color: #ff8a7a; font-weight: 700; }',
    '.kb-buffs { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0 8px; } .kb-buffs span { font-size: 12px; font-weight: 700; padding: 4px 9px; border-radius: 999px; background: linear-gradient(#3e6a2a, #24401a); border: 1px solid #8fd06a; color: #eaffd8; }',
    '.kb-req { list-style: none; margin: 6px 0; padding: 0; font-size: 12.5px; } .kb-req li { padding: 2px 0; } .kb-req li.ok { color: #8fe08a; } .kb-req li.falta { color: #ff9a8a; }',
    '.kb-bandera { background: none !important; border: 0 !important; box-shadow: 0 4px 10px rgba(0,0,0,.5); } .kb-bandera svg { display: block; }',
    '.kb-al-links { display: flex; justify-content: space-around; margin: 2px 0 10px; } .kb-al-links button { background: none; border: 0; color: #5fb2ff; font: 600 15px Georgia, serif; text-decoration: none; cursor: pointer; padding: 4px 10px; }',
    // v7.18: marcha en una sola ventana
    '#marcha .mc1-arriba { display: flex; gap: 8px; align-items: stretch; margin: 8px 0 6px; } #marcha .mc1-heroe { flex: 1 1 auto; display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #e8d6a8; min-width: 0; }',
    '#marcha .mc1-heroe select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #a8782a; background: #1e140a; color: #f6e6c0; font: 700 14px system-ui, sans-serif; }',
    '#marcha .mc1-datos { flex: none; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 6px 10px; border-radius: 8px; background: rgba(0,0,0,.35); border: 1px solid #6a4a22; color: #f3e6c8; font-size: 13px; }',
    '#marcha .mc1-otros { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; } #marcha .mc1-otros .comprar { flex: 1 1 0; min-width: 0; }',
    '#marcha .mc-rojo { min-height: 16px; margin: 4px 0 0; color: #ff8a7a; font-size: 12px; text-align: center; }',
    // informe: tropa por tropa en cada columna
    '.ib-tropas { margin-top: 6px; border-top: 1px solid rgba(201,138,26,.4); padding-top: 4px; } .ib-tr { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; font-size: 11.5px; padding: 1px 0; } .ib-rojo { color: #ff8a7a; }',
    '#marcha .mc1-hbtn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 8px; border-radius: 8px; border: 1px solid #a8782a; background: #1e140a; color: #f6e6c0; text-align: left; min-height: 52px; }',
    '#marcha .mc1-hbtn .mc-foto { width: 40px; height: 40px; flex: 0 0 40px; } #marcha .mc1-hn { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; } #marcha .mc1-hn b { font: 800 14px system-ui, sans-serif; color: #ffe9b0; } #marcha .mc1-hn small { font-size: 11px; color: #d9c493; line-height: 1.25; } #marcha .mc1-flecha { color: #ffb84a; font-size: 16px; }',
    '#marcha .mc-top { font-size: 10px; color: #ffcf4a; font-weight: 800; margin-left: 4px; }',
    '#dock-procesos:has(#dk-retirar:not([style*=none])) .dk-accion { padding: 6px 8px !important; font-size: 12px !important; min-width: 0 !important; flex: 0 0 auto !important; } #dock-procesos:has(#dk-retirar:not([style*=none])) .dk-txt { font-size: 12px !important; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
    '#dock-procesos .dk-rojo { background: linear-gradient(180deg, #d24a3a, #8e2418) !important; color: #fff !important; margin-left: 4px; }',
    '.al-toca { cursor: pointer; } .al-tr.al-toca:active, .fila-miembro.al-toca:active { filter: brightness(1.25); }',
    '.al-perfil .al-pf-cab { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; } .al-perfil .al-pf-cab b { font: 800 16px Georgia, serif; color: #ffe08a; }',
    '.al-perfil .al-pf-desc { margin: 8px 0; padding: 8px 10px; border-radius: 8px; background: rgba(0,0,0,.28); border: 1px solid rgba(200,160,90,.35); font-size: 13px; color: #ecdcb8; }',
    '.al-perfil .al-pf-botones { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; } .al-perfil .al-pf-botones .comprar { flex: 1 1 140px; }',
    '.al-perfil .al-kp, .rk-kp { color: #ff8a4a !important; } .al-pf-lista { max-height: 46vh; overflow-y: auto; }',
    // v7.22: la cabecera de las ventanas ya no se sale por arriba y la ✕ queda centrada en su círculo
    'html body #panel#panel .panel-cab { margin-top: 0 !important; padding-top: calc(8px + env(safe-area-inset-top)) !important; padding-bottom: 8px !important; }',
    'html body #panel#panel .panel-cab #panel-cerrar { display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; line-height: 1 !important; width: 38px !important; height: 38px !important; min-width: 38px !important; border-radius: 50% !important; font-size: 20px !important; text-align: center !important; }',
    'body #aviso-version { display: block !important; position: fixed !important; left: 50% !important; transform: translateX(-50%) !important; top: calc(env(safe-area-inset-top) + 92px) !important; z-index: 70 !important; padding: 6px 12px !important; border-radius: 16px !important; border: 1px solid #c8a764 !important; background: rgba(28,18,8,.92) !important; color: #ffe08a !important; font: 700 12px system-ui, sans-serif !important; box-shadow: 0 2px 8px rgba(0,0,0,.5) !important; white-space: nowrap !important; }',
    // v7.26: ventana de acelerar oscura y con el texto de «Tienes ×…» legible
    'body #acelerar-elegir .ac-caja { background: linear-gradient(#2c1f14, #1d140c) !important; border: 2px solid #a8782a !important; color: #f3e6c8 !important; }',
    'body #acelerar-elegir .ac-cab h3, body #acelerar-elegir .ac-nom, body #acelerar-elegir .ac-gemas, body #acelerar-elegir .ac-gemas b { color: #ffe08a !important; }',
    'body #acelerar-elegir .ac-fila { background: rgba(0,0,0,.32) !important; border: 1px solid rgba(200,160,90,.35) !important; } body #acelerar-elegir .ac-fila.ac-cubre { border-color: #6ad06a !important; }',
    'body #acelerar-elegir .ac-txt b { color: #ffe9b0 !important; } body #acelerar-elegir .ac-txt span { color: #e8d8c3 !important; font-size: 12px !important; } body #acelerar-elegir .ac-txt em { color: #82e0aa !important; font-style: normal; font-weight: 700; }',
    'body #acelerar-elegir .ac-sub, body #acelerar-elegir .ac-res { color: #d9c493 !important; } body #acelerar-elegir .ac-reloj { color: #ff8a5a !important; }',
    '.tr-ir { margin-left: 6px !important; padding: 3px 9px !important; font-size: 12px !important; min-height: 0 !important; vertical-align: middle; }',
    // v7.33: ciudad abierta, cola de obras plegable, selector de equipo oscuro y legible
    'html body #pill-escudo.pill-abierta, html body.tema-oscuro #lateral #pill-escudo.pill-abierta, html body #lateral #pill-escudo.pill-abierta { background: linear-gradient(#b8301f, #6e140c) !important; border: 1px solid #ff8a6a !important; border-color: #ff8a6a !important; color: #fff !important; animation: tkLatido 2.4s ease-in-out infinite; }',
    '@keyframes tkLatido { 0%,100% { box-shadow: 0 0 0 rgba(255,80,60,0); } 50% { box-shadow: 0 0 10px rgba(255,80,60,.8); } }',
    '#colas-obras .co-pliega { display: inline-block; margin: 2px 0 0; padding: 4px 10px; border-radius: 12px; border: 1px solid #c8a764; background: rgba(28,18,8,.9); color: #ffe08a; font: 700 12px system-ui, sans-serif; }',
    '#colas-obras .co-abrir { font-size: 13px; padding: 6px 12px; }',
    'body #eq-elegir .ac-caja { background: linear-gradient(#2c1f14, #1d140c) !important; border: 2px solid #a8782a !important; color: #f3e6c8 !important; }',
    'body #eq-elegir .ac-cab h3 { color: #ffe08a !important; } body #eq-elegir .eq-fila { background: rgba(0,0,0,.32) !important; border: 1px solid rgba(200,160,90,.35) !important; }',
    'body #eq-elegir .ob-txt b { color: #ffe9b0 !important; } body #eq-elegir .ob-txt span, body #eq-elegir .ob-txt small { color: #e8d8c3 !important; font-size: 12px !important; opacity: 1 !important; } body #eq-elegir .nota { color: #d9c493 !important; }',
    // v7.36: más contraste: misión en vino oscuro con letra blanca, texto de la barra de procesos en crema
    'html body #mision#mision, html body.tema-oscuro #mision#mision { background: linear-gradient(#5a1a20, #3a0f14) !important; color: #ffffff !important; border: 1.5px solid #e0b44c !important; text-shadow: 0 1px 2px #000 !important; box-shadow: 0 3px 8px rgba(0,0,0,.6) !important; }',
    'html body #mision#mision *, html body.tema-oscuro #mision#mision, html body.tema-oscuro #mision#mision * { color: #ffffff !important; text-shadow: 0 1px 2px #000 !important; }',
    'html body #dock-procesos .dk-txt { color: #e6d5b8 !important; font-weight: 700 !important; text-shadow: 0 1px 2px #000; }',
    '.chat-m.megafono { background: linear-gradient(90deg, rgba(255,196,58,.28), rgba(255,196,58,.06)) !important; border-left: 3px solid #ffc43a !important; border-radius: 6px; }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-v714'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
