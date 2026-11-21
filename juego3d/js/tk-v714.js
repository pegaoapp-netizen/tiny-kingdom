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
    '.chat-m.megafono { background: linear-gradient(90deg, rgba(255,196,58,.28), rgba(255,196,58,.06)) !important; border-left: 3px solid #ffc43a !important; border-radius: 6px; }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-v714'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
