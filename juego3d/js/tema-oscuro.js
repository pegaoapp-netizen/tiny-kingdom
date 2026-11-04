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

  // ---------- cosas que cambian: textos, poder, nivel y la posición del panel ----------
  function refrescar() {
    var t = ingles() ? EN : ES;
    var ets = document.querySelectorAll('.esc-et');
    for (var i = 0; i < ets.length; i++) ets[i].textContent = t[ets[i].dataset.k];
    var pd = $('poder'), pe = $('poder-esc'); if (pd && pe && pe.textContent !== pd.textContent) pe.textContent = pd.textContent;
    var nr = $('nivel-rey'), pn = $('pr-nivel'); if (nr && pn && pn.textContent !== nr.textContent) pn.textContent = nr.textContent;
    var arr = $('arriba'); if (arr) { var y = arr.getBoundingClientRect().bottom + 6; panel.style.top = Math.round(y) + 'px'; }
    // el panel se esconde cuando lo tapa una pantalla (mundo, menú)
    var ar = $('arriba'); panel.style.display = ar && getComputedStyle(ar).display === 'none' ? 'none' : '';
  }
  refrescar();
  setInterval(refrescar, 400);
  window.addEventListener('resize', refrescar);
})();
