/* v9.90 (dueño, vídeo de referencia): forma nueva de ABRIR en el Azar.
   - 1 cofre: tiembla, se abre con destello, el premio brilla y los demás cofres enseñan (en gris) lo que podías haber ganado.
   - Varios cofres: cada carta sale grande en el centro y vuela a la cuadrícula con su nombre; botón «Vale».
   Solo efectos visuales: los premios los sortea y guarda juego.js como siempre. */
(function () {
  var css = '' +
    '.az-celda.az-agita{animation:azAgita .38s ease-in-out both!important}' +
    '@keyframes azAgita{0%,100%{transform:none}20%{transform:rotate(-7deg) scale(1.05)}40%{transform:rotate(7deg) scale(1.08)}60%{transform:rotate(-5deg) scale(1.08)}80%{transform:rotate(4deg) scale(1.04)}}' +
    '.az-celda.az-gana{position:relative;z-index:2;border-color:#8fe0ff!important;box-shadow:0 0 0 2px #8fe0ff,0 0 22px 6px rgba(120,210,255,.85)!important;animation:azGana .55s cubic-bezier(.2,1.6,.4,1) both!important}' +
    '.az-celda.az-gana::after{content:"";position:absolute;inset:-30%;pointer-events:none;background:radial-gradient(circle,rgba(255,250,210,.95),rgba(255,220,120,0) 60%);animation:azDestello .7s ease-out both}' +
    '@keyframes azGana{0%{transform:scale(.3) rotateY(90deg);opacity:0}100%{transform:none;opacity:1}}' +
    '@keyframes azDestello{0%{opacity:1;transform:scale(.4)}100%{opacity:0;transform:scale(1.5)}}' +
    '.az-celda.az-fant{background:radial-gradient(circle at 50% 45%,#5a4a36,#2a1e12 70%)!important;border-color:#5a4630!important;box-shadow:none!important;filter:grayscale(.85) brightness(.7);animation:azFant .4s ease-out both!important}' +
    'body.tema-oscuro #panel.az-panel .az-celda.az-fant small,.az-celda.az-fant small{color:#d8c8a8!important}' +
    '@keyframes azFant{0%{transform:scale(.6);opacity:0}100%{transform:none;opacity:1}}' +
    '.azr-capa{position:fixed;inset:0;z-index:99990;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:max(18px,env(safe-area-inset-top)) 12px max(16px,env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% 35%,rgba(70,40,12,.96),rgba(10,6,3,.97) 70%);animation:azrEntra .25s ease-out both}' +
    '@keyframes azrEntra{from{opacity:0}to{opacity:1}}' +
    '.azr-tit{font:800 20px Georgia,serif;color:#ffe7a0;text-shadow:0 2px 4px #000;margin:4px 0 10px;text-align:center}' +
    '.azr-red{flex:1;width:100%;max-width:380px;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-content:start;padding:4px}' +
    '.azr-c{position:relative;aspect-ratio:.82;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px;background:linear-gradient(180deg,#8fd0f0,#3a7ab0);border:2px solid #d4a94a;box-shadow:0 3px 8px rgba(0,0,0,.6);opacity:0}' +
    '.azr-c.rara{background:linear-gradient(180deg,#e8c8ff,#7a3ad0);border-color:#ffe08a;box-shadow:0 0 14px rgba(200,140,255,.9)}' +
    '.azr-c.ya{opacity:1;animation:azrCae .35s cubic-bezier(.2,1.4,.4,1) both}' +
    '@keyframes azrCae{0%{transform:scale(1.6);opacity:.2}100%{transform:none;opacity:1}}' +
    '.azr-c .azr-i{font-size:34px;line-height:1}.azr-c .azr-i img{width:42px;height:42px}' +
    '.azr-c small{font:700 11px/1.15 Georgia,serif;color:#fff;text-shadow:0 1px 2px #000;text-align:center}' +
    '.azr-c b{position:absolute;top:3px;right:5px;font:800 13px system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000}' +
    '.azr-grande{position:fixed;left:50%;top:42%;width:150px;height:180px;margin:-90px 0 0 -75px;z-index:99991;pointer-events:none;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:linear-gradient(180deg,#8fd0f0,#3a7ab0);border:3px solid #ffe08a;box-shadow:0 0 40px 10px rgba(255,220,120,.6);animation:azrSale .3s cubic-bezier(.2,1.6,.4,1) both}' +
    '.azr-grande.rara{background:linear-gradient(180deg,#e8c8ff,#7a3ad0);box-shadow:0 0 50px 14px rgba(200,140,255,.8)}' +
    '.azr-grande .azr-i{font-size:70px;line-height:1}.azr-grande .azr-i img{width:84px;height:84px}' +
    '.azr-grande small{font:800 15px/1.2 Georgia,serif;color:#fff;text-shadow:0 1px 3px #000;text-align:center;padding:0 6px}' +
    '@keyframes azrSale{0%{transform:scale(0) rotate(-15deg);opacity:0}100%{transform:none;opacity:1}}' +
    '.azr-vale{margin-top:10px;min-width:150px;min-height:46px;border-radius:8px;border:2px solid #d6b157;background:linear-gradient(180deg,#2f6fc8,#10264a);color:#fff;font:800 18px Georgia,serif;opacity:.35;transition:opacity .2s}' +
    '.azr-vale.listo{opacity:1}' +
    '.azr-salta{font:12px system-ui,sans-serif;color:#c8b48a;margin-top:6px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* items: [{ ico, nom, n, rara }] · opts: { titulo, vale, salta, alCerrar } (los textos llegan ya traducidos desde juego.js) */
  window.tkAzarRevelar = function (items, opts) {
    opts = opts || {};
    var viejo = document.querySelector('.azr-capa'); if (viejo) viejo.remove();
    var capa = document.createElement('div'); capa.className = 'azr-capa';
    capa.innerHTML = '<div class="azr-tit">' + (opts.titulo || '¡Premios!') + '</div><div class="azr-red"></div>' +
      '<button class="azr-vale">' + (opts.vale || 'Vale') + '</button><div class="azr-salta">' + (opts.salta || 'Toca para verlo todo') + '</div>';
    document.body.appendChild(capa);
    var red = capa.querySelector('.azr-red'), vale = capa.querySelector('.azr-vale'), salta = capa.querySelector('.azr-salta');
    var cartas = items.map(function (it) {
      var c = document.createElement('div'); c.className = 'azr-c' + (it.rara ? ' rara' : '');
      c.innerHTML = '<span class="azr-i">' + it.ico + '</span><small>' + it.nom + '</small>' + (it.n > 1 ? '<b>×' + it.n + '</b>' : '');
      red.appendChild(c); return c;
    });
    var i = 0, tm = null, listo = false, grande = null;
    var paso = items.length > 12 ? 260 : 520; /* muchas cartas: más rápido */
    function quitarGrande() { if (grande) { grande.remove(); grande = null; } }
    function siguiente() {
      quitarGrande();
      if (i >= cartas.length) { acabar(); return; }
      var it = items[i], c = cartas[i];
      grande = document.createElement('div'); grande.className = 'azr-grande' + (it.rara ? ' rara' : '');
      grande.innerHTML = '<span class="azr-i">' + it.ico + '</span><small>' + it.nom + (it.n > 1 ? ' ×' + it.n : '') + '</small>';
      document.body.appendChild(grande);
      try { if (window.navigator.vibrate && it.rara) navigator.vibrate(40); } catch (e) {}
      tm = setTimeout(function () { quitarGrande(); c.classList.add('ya'); if (c.offsetTop + c.offsetHeight > red.scrollTop + red.clientHeight) red.scrollTop = c.offsetTop + c.offsetHeight - red.clientHeight; /* solo baja la cuadrícula, sin mover la pantalla */ i++; tm = setTimeout(siguiente, 90); }, paso);
    }
    function acabar() { clearTimeout(tm); quitarGrande(); cartas.forEach(function (c) { c.classList.add('ya'); }); listo = true; vale.classList.add('listo'); salta.style.visibility = 'hidden'; }
    function cerrar() { clearTimeout(tm); quitarGrande(); capa.remove(); if (opts.alCerrar) try { opts.alCerrar(); } catch (e) {} }
    capa.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!listo) { acabar(); return; }
      if (ev.target === vale) cerrar();
    });
    setTimeout(siguiente, 200);
  };
})();
