// v6.83: portada de juego de verdad (escudo, título dorado, barra de carga), animaciones de ventanas y botones,
// y recursos que brillan y muestran "+N" cuando suben
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var css = [
    // ---------- portada ----------
    '#pantalla .tarjeta { background: radial-gradient(ellipse at 50% 0%, rgba(255, 210, 120, .14), transparent 60%), linear-gradient(180deg, rgba(58, 38, 22, .94), rgba(26, 16, 9, .96)) !important; border: 2px solid #c9a24a !important; outline: 1px solid rgba(255, 220, 140, .35); outline-offset: -7px; border-radius: 18px !important; box-shadow: 0 18px 50px rgba(0, 0, 0, .7), inset 0 0 30px rgba(0, 0, 0, .55) !important; padding-top: 22px !important; animation: tkPortada .7s cubic-bezier(.2, .9, .3, 1.15) both; }',
    '#pantalla-logo { font-size: 0 !important; height: 0; margin: 0 !important; }',
    '.tk-escudo { width: 150px; height: 150px; margin: -14px auto 0; display: block; filter: drop-shadow(0 6px 10px rgba(0, 0, 0, .6)); animation: tkFlota 3.2s ease-in-out infinite; }',
    '#pantalla-titulo { font-family: Georgia, "Times New Roman", serif !important; font-size: 42px !important; font-weight: 900 !important; letter-spacing: 1px !important; margin: 0 0 4px !important; color: #ffd75a !important; -webkit-text-fill-color: #ffd75a !important; background: none !important; text-shadow: 0 1px 0 #fff3b0, 0 3px 0 #8a5a12, 0 4px 0 #5a3608, 0 6px 10px rgba(0, 0, 0, .7), 0 0 22px rgba(255, 200, 80, .45) !important; filter: none !important; }',
    '#pantalla-texto { color: #e8d6a8 !important; font-size: 15px !important; }',
    '#pantalla-form, #pantalla-botones { background: transparent !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }',
    '#pantalla-botones button, #pantalla-form button { background: linear-gradient(180deg, #ffd96a 0%, #e8a630 50%, #b3701a 100%) !important; color: #3a2108 !important; border: 2px solid #ffe9a8 !important; border-radius: 12px !important; box-shadow: 0 4px 0 #6b3e12, 0 8px 16px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .6) !important; font-family: Georgia, serif !important; font-weight: 900 !important; text-shadow: 0 1px 0 rgba(255, 240, 200, .7) !important; transition: transform .08s, box-shadow .08s; }',
    '#pantalla-botones button:active, #pantalla-form button:active { transform: translateY(3px) !important; box-shadow: 0 1px 0 #6b3e12, 0 3px 8px rgba(0, 0, 0, .45) !important; }',
    '#pantalla-form input { background: rgba(10, 6, 3, .65) !important; border: 1px solid #8a6230 !important; color: #f3e6c8 !important; border-radius: 10px !important; }',
    '.tk-carga { display: none; width: 78%; margin: 14px auto 6px; height: 14px; border-radius: 8px; background: rgba(10, 6, 3, .7); border: 1px solid #8a6230; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0, 0, 0, .6); }',
    '.tk-carga.on { display: block; }',
    '.tk-carga i { display: block; height: 100%; width: 40%; border-radius: 8px; background: linear-gradient(90deg, #b3701a, #ffd96a, #b3701a); background-size: 200% 100%; animation: tkCarga 1.3s ease-in-out infinite; }',
    '@keyframes tkCarga { 0% { margin-left: -40%; } 100% { margin-left: 100%; } }',
    '@keyframes tkPortada { from { opacity: 0; transform: translateY(26px) scale(.94); } to { opacity: 1; transform: none; } }',
    '@keyframes tkFlota { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }',
    // ---------- ventanas que entran con suavidad ----------
    '#panel.tk-entra { animation: tkEntra .26s cubic-bezier(.2, .9, .3, 1.1) both; }',
    '#panel.cafe.tk-entra { animation: tkFade .22s ease-out both; }',
    '@keyframes tkEntra { from { opacity: 0; translate: 0 24px; scale: .97; } to { opacity: 1; translate: 0 0; scale: 1; } }',
    '@keyframes tkFade { from { opacity: 0; } to { opacity: 1; } }',
    '#panel-cuerpo > * { animation: tkFade .3s ease-out both; }',
    // ---------- botones que se hunden al tocarlos ----------
    '.comprar, .redondo, .pestana, .cq2-fila, .tk-rec, #tk-arriba button, .subtabs button, .cafe-tabs button, .az-b, .iv-boton, .pf-boton { transition: transform .09s ease-out, filter .09s ease-out; }',
    '.comprar:active, .redondo:active, .pestana:active, .cq2-fila:active, .subtabs button:active, .cafe-tabs button:active, .az-b:active, .pf-boton:active { scale: .94; filter: brightness(1.12); }',
    '#tk-arriba button:active, .tk-rec:active { scale: .96; filter: brightness(1.2); }',
    // ---------- recursos que suben ----------
    '.tk-rec.tk-sube b, #tk-gemas.tk-sube b { animation: tkSube .7s ease-out; }',
    '@keyframes tkSube { 0% { color: #fff; text-shadow: 0 0 0 #ffd96a; scale: 1; } 30% { color: #fff6a8; text-shadow: 0 0 10px #ffd96a, 0 0 18px #ffb000; scale: 1.28; } 100% { scale: 1; } }',
    '.tk-masn { position: fixed; z-index: 95; pointer-events: none; font: 900 14px system-ui, sans-serif; color: #9cff7a; text-shadow: 0 1px 2px #000, 0 0 6px rgba(0, 0, 0, .8); animation: tkMasN 1.1s ease-out forwards; white-space: nowrap; }',
    '@keyframes tkMasN { 0% { opacity: 0; transform: translate(-50%, 4px) scale(.7); } 20% { opacity: 1; transform: translate(-50%, -4px) scale(1.1); } 100% { opacity: 0; transform: translate(-50%, -26px) scale(1); } }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-v683'; st.textContent = css; document.head.appendChild(st);

  // ---------- escudo de la portada (dibujado aquí, sin imágenes de otros juegos) ----------
  var ESCUDO = '<svg class="tk-escudo" viewBox="0 0 160 160" aria-hidden="true"><defs>' +
    '<linearGradient id="tke-oro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c4"/><stop offset=".45" stop-color="#f4c552"/><stop offset=".55" stop-color="#d99a2a"/><stop offset="1" stop-color="#8a5410"/></linearGradient>' +
    '<linearGradient id="tke-azul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa2f0"/><stop offset=".6" stop-color="#2a56b8"/><stop offset="1" stop-color="#132a66"/></linearGradient>' +
    '<radialGradient id="tke-luz" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#ffffff" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="tke-muro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c3cad8"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#aeb6c6"/></linearGradient>' +
    '<linearGradient id="tke-techo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e3f9a"/><stop offset=".5" stop-color="#4f86e0"/><stop offset="1" stop-color="#16307a"/></linearGradient>' +
    '<radialGradient id="tke-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd75a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd75a" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="80" cy="80" r="76" fill="url(#tke-halo)"/>' +
    // escudo
    '<path d="M80 22 L130 36 L127 82 C124 110 104 128 80 138 C56 128 36 110 33 82 L30 36 Z" fill="url(#tke-azul)" stroke="#3a2108" stroke-width="7" stroke-linejoin="round"/>' +
    '<path d="M80 22 L130 36 L127 82 C124 110 104 128 80 138 C56 128 36 110 33 82 L30 36 Z" fill="none" stroke="url(#tke-oro)" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<path d="M80 31 L121 43 L118 82 C116 104 100 119 80 128 C60 119 44 104 42 82 L39 43 Z" fill="url(#tke-luz)" stroke="rgba(255,240,200,.4)" stroke-width="1.2"/>' +
    // castillo
    '<g stroke="#2a3654" stroke-width="1.1" stroke-linejoin="round">' +
    '<rect x="48" y="78" width="64" height="38" fill="url(#tke-muro)"/>' +
    '<path d="M48 78 v-5 h6 v5 h5 v-5 h6 v5 h5 v-5 h6 v5 h6 v-5 h6 v5 h5 v-5 h6 v5 h5 v-5 h2 v5" fill="url(#tke-muro)"/>' +
    '<rect x="42" y="62" width="16" height="54" fill="url(#tke-muro)"/><rect x="102" y="62" width="16" height="54" fill="url(#tke-muro)"/>' +
    '<rect x="68" y="52" width="24" height="64" fill="url(#tke-muro)"/>' +
    '<path d="M40 62 L50 42 L60 62 Z M100 62 L110 42 L120 62 Z" fill="url(#tke-techo)"/>' +
    '<path d="M65 52 L80 28 L95 52 Z" fill="url(#tke-techo)"/></g>' +
    // ventanas y puerta
    '<g fill="#ffcf5a"><rect x="47.5" y="72" width="5" height="8" rx="2.5"/><rect x="107.5" y="72" width="5" height="8" rx="2.5"/><rect x="77.5" y="62" width="5" height="9" rx="2.5"/><rect x="73" y="80" width="4" height="6" rx="2"/><rect x="83" y="80" width="4" height="6" rx="2"/></g>' +
    '<path d="M72 116 v-14 a8 8 0 0 1 16 0 v14 Z" fill="#4a2a12" stroke="#2a1608" stroke-width="1.2"/><path d="M80 94 v22 M72 104 h16" stroke="#7a4a20" stroke-width="1"/>' +
    // banderas
    '<g stroke="#5a3a1a" stroke-width="1.2"><path d="M50 42 v-10 M110 42 v-10 M80 28 v-13"/></g>' +
    '<path d="M50 32 l10 3 l-10 3 Z M110 32 l10 3 l-10 3 Z" fill="#e8413a"/><path d="M80 15 l13 4 l-13 4 Z" fill="#ffd75a" stroke="#8a5410" stroke-width=".8"/>' +
    // corona
    '<path d="M58 22 l7 7 l15 -15 l15 15 l7 -7 l-3 16 h-38 Z" fill="url(#tke-oro)" stroke="#5a3608" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<circle cx="80" cy="12" r="4" fill="#e8413a" stroke="#5a3608" stroke-width="1.2"/><circle cx="58" cy="21" r="3" fill="#4f86e0" stroke="#5a3608" stroke-width="1"/><circle cx="102" cy="21" r="3" fill="#4f86e0" stroke="#5a3608" stroke-width="1"/>' +
    '<path d="M64 33 h32" stroke="#fff6c4" stroke-width="1.2" opacity=".8"/>' +
    // cinta dorada
    '<path d="M22 128 l14 -6 h88 l14 6 l-10 6 l10 6 l-14 -2 h-88 l-14 2 l10 -6 Z" fill="url(#tke-oro)" stroke="#5a3608" stroke-width="2" stroke-linejoin="round"/>' +
    '<text x="80" y="136" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="900" fill="#4a2a08" letter-spacing="2">REINO</text></svg>';
  var tarjeta = document.querySelector('#pantalla .tarjeta'), logo = $('pantalla-logo');
  if (tarjeta && logo && !tarjeta.querySelector('.tk-escudo')) { logo.insertAdjacentHTML('beforebegin', ESCUDO); }
  var carga = document.createElement('div'); carga.className = 'tk-carga'; carga.innerHTML = '<i></i>';
  var txt = $('pantalla-texto'); if (txt) txt.parentNode.insertBefore(carga, txt.nextSibling);
  setInterval(function () {
    var p = $('pantalla'); if (!p || p.classList.contains('oculto')) return;
    var b = $('pantalla-botones'), f = $('pantalla-form'), vacio = (!b || !b.children.length) && (!f || !f.innerHTML.trim());
    carga.classList.toggle('on', !!vacio);
  }, 200);

  // ---------- la ventana entra con suavidad cada vez que se abre ----------
  var panel = $('panel'), estabaOculto = panel ? panel.classList.contains('oculto') : true;
  if (panel) new MutationObserver(function () {
    var oc = panel.classList.contains('oculto');
    if (estabaOculto && !oc) { panel.classList.remove('tk-entra'); void panel.offsetWidth; panel.classList.add('tk-entra'); }
    estabaOculto = oc;
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });

  // ---------- recursos: brillo y "+N" cuando suben ----------
  function valor(t) {
    t = String(t || '').trim().replace(/\s/g, ''); if (!t || t === '∞') return NaN;
    var m = /^([\d.,]+)([kKmMbB]?)$/.exec(t); if (!m) return NaN;
    var n = m[1], suf = m[2].toLowerCase();
    if (suf) n = n.replace(',', '.'); else n = n.replace(/[.,]/g, '');
    var v = parseFloat(n); return suf === 'k' ? v * 1e3 : suf === 'm' ? v * 1e6 : suf === 'b' ? v * 1e9 : v;
  }
  function corto(n) { return n >= 1e6 ? (Math.round(n / 1e5) / 10) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : String(Math.round(n)); }
  var ultimo = {};
  function vigilar(id) {
    var el = $(id); if (!el) return;
    ultimo[id] = valor(el.textContent);
    new MutationObserver(function () {
      var v = valor(el.textContent), a = ultimo[id]; ultimo[id] = v;
      if (!(v > a) || isNaN(a)) return;
      var caja = el.closest('.tk-rec') || el.closest('#tk-gemas') || el.parentNode;
      caja.classList.remove('tk-sube'); void caja.offsetWidth; caja.classList.add('tk-sube');
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var f = document.createElement('div'); f.className = 'tk-masn'; f.textContent = '+' + corto(v - a);
      f.style.left = Math.round(r.left + r.width / 2) + 'px'; f.style.top = Math.round(r.bottom + 2) + 'px';
      document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1200);
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  setTimeout(function () { ['tk-monedas', 'tk-comida', 'tk-madera', 'tk-piedra', 'tk-hierro', 'tk-gemas-n'].forEach(vigilar); }, 1500);
})();
