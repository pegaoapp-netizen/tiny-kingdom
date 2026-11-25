/* Brother Kingdom · MENÚ Y PIE DE PÁGINA de la página web (bienvenida, términos, soporte, preguntas, acerca de, privacidad y 404).
 * Se pone justo después de <body>: <script src="web/sitio.js"></script>
 *
 * ▸ PARA EL DUEÑO: cuando tengas el correo de soporte, las redes o los enlaces de las tiendas, ponlos AQUÍ ABAJO.
 *   Lo que se deja vacío ('') no sale en la página (así nunca hay un botón que no lleva a ningún sitio).
 */
var BK_CONTACTO = {
  correo: '',                       /* correo de soporte, p. ej. 'soporte@brotherkingdom.com' */
  tiendas: { appStore: '', googlePlay: '' },
  redes: { facebook: '', instagram: '', tiktok: '', youtube: '', x: '', discord: '', whatsapp: '' }
};
(function () {
  var html = document.documentElement, b = document.body;
  var idi = (navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  try { var g = localStorage.getItem('bk_idioma'); if (g === 'es' || g === 'en') idi = g; } catch (e) {}
  html.lang = idi;
  var aqui = (location.pathname.split('/').pop() || 'bienvenida.html').toLowerCase();
  function T(es, en) { return '<span data-es>' + es + '</span><span data-en>' + en + '</span>'; }
  function enl(h, es, en, clase) { h = '/' + h.replace(/^\//, ''); var act = h.indexOf('#') < 0 && h.slice(1) === aqui ? ' activo' : ''; return '<a class="' + (clase || '') + act + '" href="' + h + '">' + T(es, en) + '</a>'; }
  var ini = 'bienvenida.html'; /* siempre a la bienvenida: «/» es el juego */

  var cab = document.createElement('header'); cab.className = 'bk-cab'; cab.id = 'bk-cab';
  cab.innerHTML =
    '<a class="bk-marca" href="/bienvenida.html"><img src="/iconos/icono-192.png" alt="">Brother Kingdom</a>' +
    '<nav class="bk-menu" id="bk-menu" aria-label="Menú">' +
      enl(ini + '#como', 'Cómo se juega', 'How to play') + enl(ini + '#novedades-sec', 'Novedades', 'News') +
      enl('faq.html', 'Preguntas', 'FAQ') + enl('soporte.html', 'Soporte', 'Support') + enl('acerca.html', 'Acerca de', 'About') +
      '<a class="bk-jugar jugar" href="/?jugar=1">⚔️ ' + T('Jugar gratis', 'Play free') + '</a>' +
    '</nav>' +
    '<button class="bk-idioma" id="idioma" type="button" aria-label="Idioma / Language">' + (idi === 'es' ? 'EN' : 'ES') + '</button>' +
    '<button class="bk-hamb" id="bk-hamb" type="button" aria-label="Menú" aria-expanded="false"><span></span><span></span><span></span></button>';
  b.insertBefore(cab, b.firstChild);

  function pintarPie() {
    var r = BK_CONTACTO.redes, t = BK_CONTACTO.tiendas, ICO = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', discord: 'Discord', whatsapp: 'WhatsApp' };
    var redes = Object.keys(ICO).filter(function (k) { return r[k]; }).map(function (k) { return '<a class="bk-red" href="' + r[k] + '" target="_blank" rel="noopener">' + ICO[k] + '</a>'; }).join('');
    var tiendas = (t.appStore ? '<a class="bk-tienda" href="' + t.appStore + '" target="_blank" rel="noopener">App Store</a>' : '') + (t.googlePlay ? '<a class="bk-tienda" href="' + t.googlePlay + '" target="_blank" rel="noopener">▶ Google Play</a>' : '');
    var pie = document.createElement('footer'); pie.className = 'bk-pie';
    pie.innerHTML = (tiendas ? '<div class="bk-tiendas">' + tiendas + '</div>' : '') + (redes ? '<div class="bk-redes">' + redes + '</div>' : '') +
      '<nav class="bk-pie-enl">' + enl('bienvenida.html', 'Inicio', 'Home') + enl('faq.html', 'Preguntas frecuentes', 'FAQ') + enl('soporte.html', 'Soporte', 'Support') +
      enl('terminos.html', 'Términos', 'Terms') + enl('privacidad.html', 'Privacidad', 'Privacy') + enl('acerca.html', 'Acerca de', 'About') + '</nav>' +
      '<p>© 2026 WalkCheck Holdings LLC · Brother Kingdom</p>';
    b.appendChild(pie);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintarPie); else pintarPie();

  var bi = document.getElementById('idioma');
  function poner(i) { idi = i; html.lang = i; bi.textContent = i === 'es' ? 'EN' : 'ES'; try { localStorage.setItem('bk_idioma', i); } catch (e) {} try { document.dispatchEvent(new CustomEvent('bk-idioma', { detail: i })); } catch (e) {} }
  bi.addEventListener('click', function () { poner(idi === 'es' ? 'en' : 'es'); });
  var hb = document.getElementById('bk-hamb'), mn = document.getElementById('bk-menu');
  hb.addEventListener('click', function () { var ab = !cab.classList.contains('abierto'); cab.classList.toggle('abierto', ab); hb.setAttribute('aria-expanded', ab ? 'true' : 'false'); });
  mn.addEventListener('click', function (ev) { if (ev.target.closest('a')) { cab.classList.remove('abierto'); hb.setAttribute('aria-expanded', 'false'); } });
  /* al tocar Jugar, la próxima vez brotherkingdom.com abre el juego directo */
  document.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('a.jugar'); if (a) { try { localStorage.setItem('bk_jugar', '1'); } catch (e) {} } });
  window.addEventListener('scroll', function () { cab.classList.toggle('con-fondo', window.scrollY > 40); }, { passive: true });
  window.BKSitio = { idioma: function () { return idi; }, contacto: BK_CONTACTO };
})();
