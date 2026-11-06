// TEMA OSCURO v6.29: arma la barra de arriba con escudos, el panel del rey a la izquierda
// y la barra de abajo con botones redondos. Solo mueve y decora lo que ya existe:
// los números los sigue escribiendo juego.js en los mismos elementos de siempre.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var RUTA = 'iconos/ui/';
  document.body.classList.add('tema-oscuro');

  var ES = { poder: 'Poder', comida: 'Comida', madera: 'Madera', piedra: 'Piedra', oro: 'Oro', gemas: 'Gemas' };
  var EN = { poder: 'Power', comida: 'Food', madera: 'Wood', piedra: 'Stone', oro: 'Gold', gemas: 'Gems' };
  function ingles() { var b = $('btn-idioma'); return b && /^\s*EN/i.test(b.textContent); }

  // ---------- barra de arriba: cada recurso es un escudo ----------
  var rec = $('recursos');
  rec.classList.add('to-madera');
  var poder = document.createElement('div');
  poder.className = 'pill r'; poder.id = 'pill-poder'; poder.title = 'Poder';
  poder.innerHTML = '<b id="poder-esc">0</b>';
  rec.insertBefore(poder, rec.firstChild);
  poder.addEventListener('click', function () { var p = $('perfil'); if (p) p.click(); });
  var ESCUDOS = { 'pill-poder': 'poder', 'pill-comida': 'comida', 'pill-madera': 'madera', 'pill-piedra': 'piedra', 'pill-monedas': 'oro', 'pill-gemas': 'gemas' };
  Object.keys(ESCUDOS).forEach(function (id) {
    var p = $(id); if (!p) return;
    var k = ESCUDOS[id], b = p.querySelector('b');
    var img = document.createElement('img'); img.className = 'esc-img'; img.src = RUTA + 'r_' + k + '.webp'; img.alt = '';
    var et = document.createElement('small'); et.className = 'esc-et'; et.dataset.k = k;
    p.insertBefore(img, p.firstChild);
    p.insertBefore(et, b);
  });

  // ---------- panel del rey a la izquierda ----------
  var panel = document.createElement('div');
  panel.id = 'panel-rey'; panel.className = 'to-madera';
  panel.innerHTML = '<div class="pr-banner" title="Perfil"><span>👑</span><b id="pr-nivel">1</b></div>';
  document.body.appendChild(panel);
  panel.appendChild($('perfil'));
  var pob = document.createElement('div'); pob.className = 'pr-pob'; pob.title = 'Población'; pob.innerHTML = '👥 <span id="pob-txt">—</span>'; panel.appendChild(pob);
  panel.appendChild($('vida-castillo'));
  panel.appendChild($('ciudad-nombre'));
  var bot = document.createElement('div'); bot.className = 'pr-botones';
  bot.appendChild($('btn-idioma')); bot.appendChild($('btn-salir'));
  panel.appendChild(bot);
  panel.querySelector('.pr-banner').addEventListener('click', function () { var p = $('perfil'); if (p) p.click(); });

  // ---------- barra de abajo: 7 botones redondos ----------
  var abajo = $('abajo');
  abajo.classList.add('to-madera');
  var BOTONES = { 'btn-conquista': 'campana', 'btn-heroes': 'tropas', 'btn-mochila': 'inventario', 'btn-construir': 'edificios', 'btn-tienda': 'tienda', 'btn-alianza': 'alianza', 'btn-mundo': 'mundo' };
  Object.keys(BOTONES).forEach(function (id) {
    var b = $(id); if (!b) return;
    var img = document.createElement('img'); img.className = 'bot-img'; img.src = RUTA + 'b_' + BOTONES[id] + '.webp'; img.alt = '';
    b.insertBefore(img, b.firstChild);
  });

  // ---------- v6.48: barra de arriba nueva (jugador | ciudad | gemas) y debajo la fila de recursos ----------
  document.body.classList.add('tk-barra-nueva');
  // v6.50: una gema de verdad (tallada, con brillo), dibujada aquí mismo
  var GEMA_SVG = '<svg class="tk-gema" viewBox="0 0 32 28" aria-hidden="true"><defs>' +
    '<linearGradient id="tkg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b3ff"/><stop offset="1" stop-color="#7a2fd0"/></linearGradient>' +
    '<linearGradient id="tkg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a45cf0"/><stop offset="1" stop-color="#4a128f"/></linearGradient></defs>' +
    '<polygon points="8,2 24,2 31,10 16,27 1,10" fill="url(#tkg2)" stroke="#2a0a52" stroke-width="1"/>' +
    '<polygon points="8,2 24,2 20,10 12,10" fill="#efdcff"/><polygon points="1,10 12,10 16,27" fill="#8a3fe0"/><polygon points="31,10 20,10 16,27" fill="#5a1aa8"/>' +
    '<polygon points="12,10 20,10 16,27" fill="url(#tkg1)"/><polygon points="8,2 12,10 1,10" fill="#c48bff"/><polygon points="24,2 31,10 20,10" fill="#9c55ee"/>' +
    '<path d="M10 4 L14 4 L12 8 Z" fill="#fff" opacity=".85"/></svg>';
  var tk = document.createElement('div'); tk.id = 'tk-arriba';
  tk.innerHTML =
    '<div class="tk-fila1">' +
      '<button id="tk-jugador"><span class="tk-nv">Nv <b id="tk-nv">1</b></span><span class="tk-dat"><b id="tk-nombre"></b><small><span id="tk-poder-et">Poder</span>: <span id="tk-poder">0</span></small></span></button>' +
      '<button id="tk-ciudad"><img src="' + RUTA + 'b_edificios.webp" alt=""><span class="tk-dat"><b id="tk-ciudad-n"></b><small id="tk-ciudad-xy"></small></span></button>' +
      '<button id="tk-gemas"><span class="tk-dat"><b id="tk-gemas-n">0</b><small id="tk-mas">Más</small></span>' + GEMA_SVG + '</button>' +
    '</div>' +
    '<div class="tk-fila2">' + [['monedas', 'oro'], ['comida', 'comida'], ['madera', 'madera'], ['piedra', 'piedra'], ['hierro', '']].map(function (q) {
      return '<span class="tk-rec" data-de="' + q[0] + '">' + (q[1] ? '<img src="' + RUTA + 'r_' + q[1] + '.webp" alt="">' : '<i class="tk-hierro"></i>') + '<b id="tk-' + q[0] + '">0</b></span>';
    }).join('') + '</div>';
  document.body.appendChild(tk);
  $('tk-jugador').addEventListener('click', function () { var p = $('perfil'); if (p) p.click(); });
  $('tk-ciudad').addEventListener('click', function () { var c = $('btn-centrar'); if (c) c.click(); });
  $('tk-gemas').addEventListener('click', function () { if (window.TK_gemas) window.TK_gemas(); });
  tk.querySelectorAll('.tk-rec').forEach(function (r) { r.addEventListener('click', function () { var p = $('pill-' + r.dataset.de); if (p) p.click(); }); });
  // v6.50: sin el cuadro del Castillo arriba: idioma y salir van arriba a la derecha,
  // la vida del castillo sale solo cuando está herido, y el Castillo es un botón abajo a la izquierda
  var tkBot = document.createElement('div'); tkBot.className = 'tk-botones';
  tkBot.appendChild($('btn-idioma')); tkBot.appendChild($('btn-salir'));
  tk.querySelector('.tk-fila1').appendChild(tkBot);
  var vidaC = $('vida-castillo'); document.body.appendChild(vidaC); vidaC.classList.add('tk-vida');
  var bCas = document.createElement('button'); bCas.id = 'tk-castillo'; bCas.className = 'pestana';
  bCas.innerHTML = '<span class="tk-cas-ico">🏰</span><span class="txt" id="tk-cas-txt">Castillo</span>';
  abajo.insertBefore(bCas, abajo.firstChild);
  bCas.addEventListener('click', function () { if (window.TK_castillo) window.TK_castillo(); });
  function copiar(de, a) { var x = $(de), y = $(a); if (x && y && y.textContent !== x.textContent) y.textContent = x.textContent; }

  // ---------- cosas que cambian: textos, poder, nivel y la posición del panel ----------
  function refrescar() {
    var t = ingles() ? EN : ES;
    copiar('nivel-rey', 'tk-nv'); copiar('poder', 'tk-poder'); copiar('gemas', 'tk-gemas-n');
    var pnm = $('perfil-nombre'), nom = pnm ? pnm.textContent.split(' · ')[0] : ''; if ($('tk-nombre').textContent !== nom) $('tk-nombre').textContent = nom;
    ['monedas', 'comida', 'madera', 'piedra', 'hierro'].forEach(function (k) { copiar(k, 'tk-' + k); });
    var cn = $('ciudad-nombre'); if (cn) { var cb = cn.querySelector('b'), cs = cn.querySelector('small'); var cnom = cb ? cb.textContent.replace(/^Reino de /, '').replace(/'s kingdom$/, '') : ''; if (cb && $('tk-ciudad-n').textContent !== cnom) $('tk-ciudad-n').textContent = cnom; if (cs && $('tk-ciudad-xy').textContent !== cs.textContent) $('tk-ciudad-xy').textContent = cs.textContent; }
    $('tk-mas').textContent = ingles() ? 'More' : 'Más'; $('tk-poder-et').textContent = t.poder; $('tk-cas-txt').textContent = ingles() ? 'Castle' : 'Castillo';
    var vf = $('vida-castillo-fill'), herido = vf && parseFloat(vf.style.width || '100') < 99.5; vidaC.classList.toggle('tk-ver', !!herido);
    var arr0 = $('arriba'); tk.style.display = arr0 && getComputedStyle(arr0).display === 'none' ? 'none' : '';
    var ets = document.querySelectorAll('.esc-et');
    for (var i = 0; i < ets.length; i++) ets[i].textContent = t[ets[i].dataset.k];
    var pd = $('poder'), pe = $('poder-esc'); if (pd && pe && pe.textContent !== pd.textContent) pe.textContent = pd.textContent;
    var nr = $('nivel-rey'), pn = $('pr-nivel'); if (nr && pn && pn.textContent !== nr.textContent) pn.textContent = nr.textContent;
    var arr = tk.style.display === 'none' ? $('arriba') : tk; if (arr) { var y = arr.getBoundingClientRect().bottom + 6; panel.style.top = Math.round(y) + 'px'; }
    // el panel se esconde cuando lo tapa una pantalla (mundo, menú)
    var ar = $('arriba'); panel.style.display = ar && getComputedStyle(ar).display === 'none' ? 'none' : '';
  }
  refrescar();
  setInterval(refrescar, 400);
  window.addEventListener('resize', refrescar);
})();
