/* v10.06 · MAPA: «Mis ciudades» y Favoritos por tipo (Claude, según el vídeo del dueño)
   - 📍 arriba en el mapa abre «Mis ciudades»: Ciudad 1, Ciudad 2… con sus coordenadas.
     «Ver» lleva el mapa a esa ciudad y «Entrar» entra en ella sin pasar por el castillo.
   - 🔖 abre Favoritos con pestañas: Todos · ⭐ Amistad · ⚔️ Guerra · 🔖 Guardados. Botón «Editar» para cambiar el tipo o borrar.
     Arriba se guarda el sitio que miras (o el que escribas con X e Y) con un nombre y su tipo.
   - En la ficha de la ciudad de otro jugador sale 🔖: la guardas como Amistad, Guerra o solo Guardar.
   Usa la misma lista de siempre (estado.favoritos, la misma que la Marcha); a cada lugar solo se le añade su tipo (t).
   Solo interfaz: no toca combate, marchas, recursos ni reglas. */
(function () {
  'use strict';
  var MAX = 50; // v10.07: el mismo tope que la Marcha (antes 20)
  var TIPOS = [
    { k: 'amigo', ico: '⭐', es: 'Amistad', en: 'Friend' },
    { k: 'guerra', ico: '⚔️', es: 'Guerra', en: 'War' },
    { k: 'guardado', ico: '🔖', es: 'Guardados', en: 'Saved' }
  ];
  function J() { return window.__tkFav; }
  function L(es, en) { var j = J(); return j ? j.L(es, en) : es; }
  function esc(s) { var j = J(); return j ? j.esc(String(s == null ? '' : s)) : String(s); }
  function tipo(k) { for (var i = 0; i < TIPOS.length; i++) if (TIPOS[i].k === k) return TIPOS[i]; return TIPOS[2]; }
  function lista() { var e = J().estado(); if (!Array.isArray(e.favoritos)) e.favoritos = []; return e.favoritos; }
  function cerrar() { var d = document.getElementById('tkf'); if (d) d.remove(); }

  function ventana(titulo, cuerpo) {
    cerrar();
    var d = document.createElement('div'); d.id = 'tkf';
    d.innerHTML = '<div class="tkf-caja"><div class="tkf-cab"><b>' + titulo + '</b><button class="tkf-x" data-f="cerrar" aria-label="' + L('Cerrar', 'Close') + '">✕</button></div><div class="tkf-cuerpo">' + cuerpo + '</div></div>';
    d.addEventListener('click', function (ev) { if (ev.target === d) { J().sonar('click'); cerrar(); } });
    (document.getElementById('mundo') || document.body).appendChild(d);
    return d;
  }

  // ---------------- MIS CIUDADES ----------------
  function ciudades() {
    var vs = J().villas();
    var h = vs.map(function (v) {
      var sub = v.propio ? esc(v.nombre) + ' · ' : '';
      return '<div class="tkf-fila' + (v.activa ? ' activa' : '') + '"><span class="tkf-ico">' + (v.i === 0 ? '👑' : '🏰') + '</span>' +
        '<span class="tkf-dat"><b>' + L('Ciudad ', 'City ') + (v.i + 1) + (v.activa ? ' <em>' + L('(estás aquí)', '(you are here)') + '</em>' : '') + '</b>' +
        '<small>' + sub + (v.x !== undefined ? 'X ' + v.x + ' · Y ' + v.y : '') + ' · ' + L('Castillo nv ', 'Castle lv ') + v.castillo + '</small></span>' +
        (v.x !== undefined ? '<button class="tkf-b azul" data-f="ver" data-i="' + v.i + '">' + L('Ver', 'View') + '</button>' : '') +
        '<button class="tkf-b verde" data-f="entrar" data-i="' + v.i + '">' + L('Entrar', 'Enter') + '</button></div>';
    }).join('');
    var d = ventana('📍 ' + L('Mis ciudades', 'My cities'), h + '<p class="tkf-nota">' + L('«Ver» te lleva a la ciudad en el mapa; «Entrar» entra en ella.', '«View» takes you to the city on the map; «Enter» goes inside.') + '</p>');
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-f]'); if (!b) return; var f = b.dataset.f, i = +b.dataset.i;
      J().sonar('click');
      if (f === 'cerrar') { cerrar(); return; }
      var v = J().villas()[i]; if (!v) return;
      if (f === 'ver') { cerrar(); J().ir(v.x, v.y); }
      else if (f === 'entrar') { cerrar(); J().entrar(i); }
    });
  }

  // ---------------- FAVORITOS ----------------
  var pest = 'todos', editar = false;
  function favoritos() {
    var aqui = J().aqui() || { x: 0, y: 0 };
    var d = ventana('🔖 ' + L('Favoritos', 'Favorites'), '');
    var nuevoTipo = 'guardado';
    function pintar() {
      var fav = lista(), cuantos = {}; fav.forEach(function (f) { var k = tipo(f.t).k; cuantos[k] = (cuantos[k] || 0) + 1; });
      var h = '<div class="tkf-pest">' + [{ k: 'todos', ico: '', es: 'Todos', en: 'All' }].concat(TIPOS).map(function (t) {
        var n = t.k === 'todos' ? fav.length : (cuantos[t.k] || 0);
        return '<button class="' + (pest === t.k ? 'activa' : '') + '" data-f="pest" data-k="' + t.k + '">' + t.ico + ' ' + L(t.es, t.en) + ' <small>' + n + '</small></button>';
      }).join('') + '</div>';
      // guardar un sitio nuevo
      h += '<div class="tkf-nuevo"><input id="tkf-nom" maxlength="20" placeholder="' + L('Nombre (jugador o lugar)', 'Name (player or place)') + '">' +
        '<span class="tkf-xy">X <input id="tkf-x" inputmode="numeric" maxlength="3" value="' + aqui.x + '"> Y <input id="tkf-y" inputmode="numeric" maxlength="3" value="' + aqui.y + '"></span>' +
        '<div class="tkf-tipos">' + TIPOS.map(function (t) { return '<button class="' + (nuevoTipo === t.k ? 'activa' : '') + '" data-f="tipo-nuevo" data-k="' + t.k + '">' + t.ico + ' ' + L(t.k === 'guardado' ? 'Guardar' : t.es, t.k === 'guardado' ? 'Save' : t.en) + '</button>'; }).join('') + '</div>' +
        '<button class="tkf-b naranja ancho" data-f="anadir">➕ ' + L('Añadir a favoritos', 'Add to favorites') + ' <small>(' + fav.length + '/' + MAX + ')</small></button></div>';
      // la lista
      var vis = fav.map(function (f, i) { return { f: f, i: i }; }).filter(function (o) { return pest === 'todos' || tipo(o.f.t).k === pest; });
      h += '<div class="tkf-barra"><span>' + (vis.length ? '' : L('No hay favoritos en esta categoría.', 'No favorites in this category.')) + '</span>' + (fav.length ? '<button class="tkf-b azul" data-f="editar">' + (editar ? L('Listo', 'Done') : L('Editar', 'Edit')) + '</button>' : '') + '</div>';
      h += vis.map(function (o) {
        var t = tipo(o.f.t);
        return '<div class="tkf-fila tipo-' + t.k + '"><span class="tkf-ico">' + t.ico + '</span>' +
          '<button class="tkf-dat tkf-ir" data-f="ir" data-i="' + o.i + '"><b>' + esc(o.f.n) + '</b><small>X ' + o.f.x + ' · Y ' + o.f.y + ' · ' + L(t.k === 'guardado' ? 'Guardado' : t.es, t.k === 'guardado' ? 'Saved' : t.en) + '</small></button>' +
          (editar ? TIPOS.map(function (tt) { return '<button class="tkf-mini' + (tt.k === t.k ? ' activa' : '') + '" data-f="cambiar" data-i="' + o.i + '" data-k="' + tt.k + '" aria-label="' + L(tt.es, tt.en) + '">' + tt.ico + '</button>'; }).join('') +
            '<button class="tkf-mini rojo" data-f="borrar" data-i="' + o.i + '" aria-label="' + L('Borrar', 'Delete') + '">🗑️</button>' : '') + '</div>';
      }).join('');
      d.querySelector('.tkf-cuerpo').innerHTML = h;
    }
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-f]'); if (!b) return; var f = b.dataset.f, fav = lista();
      if (f === 'cerrar') { J().sonar('click'); cerrar(); return; }
      if (f === 'pest') { pest = b.dataset.k; J().sonar('click'); pintar(); return; }
      if (f === 'editar') { editar = !editar; J().sonar('click'); pintar(); return; }
      if (f === 'tipo-nuevo') { nuevoTipo = b.dataset.k; J().sonar('click'); var n0 = document.getElementById('tkf-nom').value, x0 = document.getElementById('tkf-x').value, y0 = document.getElementById('tkf-y').value; pintar(); document.getElementById('tkf-nom').value = n0; document.getElementById('tkf-x').value = x0; document.getElementById('tkf-y').value = y0; return; }
      if (f === 'anadir') {
        var x = Math.round(+document.getElementById('tkf-x').value), y = Math.round(+document.getElementById('tkf-y').value);
        if (!(x >= 0) || !(y >= 0) || x > 999 || y > 999) { J().consejo(L('Escribe bien X e Y.', 'Type valid X and Y.')); J().sonar('error'); return; }
        var nom = (document.getElementById('tkf-nom').value || '').trim() || ('X ' + x + ' · Y ' + y);
        if (guardarLugar(nom, x, y, nuevoTipo)) { pest = nuevoTipo; pintar(); }
        return;
      }
      if (f === 'ir') { var q = fav[+b.dataset.i]; if (!q) return; J().sonar('click'); cerrar(); J().ir(q.x, q.y); return; }
      if (f === 'cambiar') { var c = fav[+b.dataset.i]; if (!c) return; c.t = b.dataset.k; J().sonar('click'); J().guardar(); pintar(); return; }
      if (f === 'borrar') { fav.splice(+b.dataset.i, 1); J().sonar('click'); J().guardar(); if (!fav.length) editar = false; pintar(); return; }
    });
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.id === 'tkf-nom') { ev.preventDefault(); var b = d.querySelector('[data-f="anadir"]'); if (b) b.click(); } });
    pintar();
  }

  // guarda (o actualiza si ya estaba en esas coordenadas)
  function guardarLugar(nom, x, y, t) {
    var fav = lista(), ya = null;
    fav.forEach(function (f) { if (f.x === x && f.y === y) ya = f; });
    if (ya) { ya.n = String(nom).slice(0, 20); ya.t = t; }
    else {
      if (fav.length >= MAX) { J().consejo(L('Ya tienes ' + MAX + ' favoritos: borra uno primero (Editar).', 'You have ' + MAX + ' favorites: delete one first (Edit).')); J().sonar('error'); return false; }
      fav.push({ n: String(nom).slice(0, 20), x: x, y: y, t: t });
    }
    J().sonar('moneda'); J().guardar();
    J().consejo('🔖 ' + (ya ? L('Favorito actualizado.', 'Favorite updated.') : L('Ubicación añadida a Favoritos.', 'Location added to Favorites.')));
    return true;
  }

  // ---------------- 🔖 EN LA FICHA DE OTRO JUGADOR ----------------
  function ponerBotonFicha(fc) {
    if (!fc || fc.querySelector('.tkf-fc') || fc.querySelector('#fc-entrar')) return; // tu propia ciudad no
    var cab = fc.querySelector('.fc-cab'), sm = cab && cab.querySelector('small'); if (!sm) return;
    var m = /(\d+)\s*,\s*(\d+)/.exec(sm.textContent || ''); if (!m) return;
    var x = +m[1], y = +m[2], nom = ((cab.firstChild && cab.firstChild.textContent) || '').trim();
    var caja = fc.querySelector('.fc-caja'); if (!caja) return;
    var b = document.createElement('button'); b.className = 'tkf-fc'; b.type = 'button'; b.title = L('Guardar en Favoritos', 'Save to Favorites'); b.textContent = '🔖';
    caja.appendChild(b);
    b.addEventListener('click', function (ev) {
      ev.stopPropagation(); J().sonar('click');
      var ya = caja.querySelector('.tkf-elegir'); if (ya) { ya.remove(); return; }
      var previo = null; lista().forEach(function (f) { if (f.x === x && f.y === y) previo = f; });
      var p = document.createElement('div'); p.className = 'tkf-elegir';
      p.innerHTML = '<b>' + esc(nom) + ' <small>(' + x + ', ' + y + ')</small></b><span>' + L('Guardar como:', 'Save as:') + '</span><div class="tkf-tipos">' +
        TIPOS.map(function (t) { return '<button class="' + (previo && tipo(previo.t).k === t.k ? 'activa' : '') + '" data-k="' + t.k + '">' + t.ico + ' ' + L(t.k === 'guardado' ? 'Solo guardar' : t.es, t.k === 'guardado' ? 'Just save' : t.en) + '</button>'; }).join('') + '</div>';
      caja.appendChild(p);
      p.addEventListener('click', function (e2) {
        e2.stopPropagation(); var bt = e2.target.closest('[data-k]'); if (!bt) return;
        if (guardarLugar(nom || ('X ' + x + ' · Y ' + y), x, y, bt.dataset.k)) p.remove();
      });
    });
  }
  function vigilar() {
    var mundo = document.getElementById('mundo'); if (!mundo) { setTimeout(vigilar, 500); return; }
    new MutationObserver(function () { var fc = document.getElementById('ficha-ciudad'); if (fc) ponerBotonFicha(fc); }).observe(mundo, { childList: true });
  }

  // ---------------- ESTILO ----------------
  var css = '#tkf{position:fixed;inset:0;z-index:9850;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;justify-content:center;padding:calc(env(safe-area-inset-top) + 64px) 8px 12px}' +
    '#tkf .tkf-caja{width:100%;max-width:460px;max-height:calc(100vh - 90px);display:flex;flex-direction:column;background:linear-gradient(180deg,#f6e7c4,#e8cf9a);border:3px solid #8a5a1e;border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.6);color:#3a2410;font:600 14px system-ui,sans-serif;overflow:hidden}' +
    '#tkf .tkf-cab{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:linear-gradient(180deg,#7a4a16,#4a2a0c);color:#ffe7a8;font-size:17px;border-bottom:2px solid #c9a24a}' +
    '#tkf .tkf-x{width:32px;height:32px;border-radius:50%;border:2px solid #e8c069;background:#8a2a18;color:#fff;font-weight:900;cursor:pointer}' +
    '#tkf .tkf-cuerpo{padding:10px;overflow-y:auto;-webkit-overflow-scrolling:touch}' +
    '#tkf .tkf-fila{display:flex;align-items:center;gap:6px;padding:8px;margin-bottom:6px;border-radius:10px;background:rgba(255,250,235,.75);border:1px solid #c9a46a}' +
    '#tkf .tkf-fila.activa{border:2px solid #d9a520;background:#fff6d6}' +
    '#tkf .tkf-fila.tipo-amigo{border-left:5px solid #2f9a3a}#tkf .tkf-fila.tipo-guerra{border-left:5px solid #b3261e}#tkf .tkf-fila.tipo-guardado{border-left:5px solid #b8801e}' +
    '#tkf .tkf-ico{font-size:20px;width:26px;text-align:center}' +
    '#tkf .tkf-dat{flex:1;min-width:0;display:flex;flex-direction:column;text-align:left;background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer}' +
    '#tkf .tkf-dat b{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#tkf .tkf-dat em{font-style:normal;color:#9a6a10;font-size:12px}#tkf .tkf-dat small{color:#7a5a30;font-size:12px}' +
    '#tkf .tkf-b{padding:7px 12px;border-radius:8px;border:2px solid rgba(0,0,0,.25);color:#fff;font:800 13px system-ui;cursor:pointer;white-space:nowrap}' +
    '#tkf .tkf-b.azul{background:linear-gradient(180deg,#3d7ad6,#1f4f9a)}#tkf .tkf-b.verde{background:linear-gradient(180deg,#4fb544,#2a7a22)}#tkf .tkf-b.naranja{background:linear-gradient(180deg,#f0a030,#b86a10)}#tkf .tkf-b.ancho{width:100%;margin-top:6px}' +
    '#tkf .tkf-nota{font-size:12px;color:#6a4a20;text-align:center;margin:4px 0 0}' +
    '#tkf .tkf-pest{display:flex;gap:4px;margin-bottom:8px}#tkf .tkf-pest button{flex:1 1 auto}' +
    '#tkf .tkf-pest button{padding:7px 2px;border-radius:8px;border:1px solid #a8803e;background:#ead3a0;color:#5a3a14;font:800 11.5px system-ui;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkf .tkf-pest button.activa{background:linear-gradient(180deg,#ffd86a,#d9a020);color:#3a2208;border-color:#7a4a10}#tkf .tkf-pest small{opacity:.75}' +
    '#tkf .tkf-nuevo{padding:8px;border-radius:10px;background:rgba(122,74,22,.12);border:1px dashed #a8803e;margin-bottom:8px}' +
    '#tkf .tkf-nuevo input{padding:7px 8px;border-radius:7px;border:1px solid #b08a50!important;background:#fffaf0!important;color:#2a1a08!important;-webkit-text-fill-color:#2a1a08;font:700 15px system-ui}#tkf .tkf-nuevo input::placeholder{color:#a08a68!important;-webkit-text-fill-color:#a08a68}' +
    '#tkf #tkf-nom{width:100%;box-sizing:border-box}#tkf .tkf-xy{display:flex;align-items:center;gap:5px;margin:6px 0;font-weight:900}#tkf .tkf-xy input{width:64px;text-align:center}' +
    '.tkf-tipos{display:flex;gap:4px}.tkf-tipos button{flex:1;padding:7px 2px;border-radius:8px;border:1px solid #a8803e;background:#f5e4bc;color:#5a3a14;font:800 12px system-ui;cursor:pointer}' +
    '.tkf-tipos button.activa{background:linear-gradient(180deg,#ffd86a,#d9a020);color:#3a2208;border-color:#7a4a10}' +
    '#tkf .tkf-barra{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;min-height:32px;color:#6a4a20;font-size:13px}' +
    '#tkf .tkf-mini{width:32px;height:32px;border-radius:8px;border:1px solid #a8803e;background:#f5e4bc;font-size:15px;cursor:pointer;padding:0}#tkf .tkf-mini.activa{background:#ffd86a}#tkf .tkf-mini.rojo{background:#f3c0b0;border-color:#a33}' +
    '#ficha-ciudad .fc-caja{position:relative}' +
    '#ficha-ciudad .tkf-fc{position:absolute;top:6px;right:44px;width:32px;height:32px;border-radius:8px;border:2px solid #c9a24a;background:linear-gradient(180deg,#ffe27a,#b8801e);font-size:16px;cursor:pointer;z-index:2}' +
    '#ficha-ciudad .tkf-elegir{margin-top:8px;padding:8px;border-radius:10px;background:#fff4d6;border:2px solid #c9a24a;color:#3a2410;display:flex;flex-direction:column;gap:6px;font:700 13px system-ui}' +
    '#ficha-ciudad .tkf-elegir small{color:#8a6a30}';
  function ponerCss() { if (document.getElementById('tkf-css')) return; var st = document.createElement('style'); st.id = 'tkf-css'; st.textContent = css; document.head.appendChild(st); }

  ponerCss(); vigilar();
  window.TKFav = { ciudades: ciudades, favoritos: favoritos, guardarLugar: guardarLugar, cerrar: cerrar };
})();
