// v6.80: los consejos de ayuda se desvanecen a los 4 s o al primer toque
(function () {
  var $ = function (id) { return document.getElementById(id); };
    // Consejos de ayuda: se desvanecen a los 4 s o al primer toque (vuelven solo si cambia el texto)
    var cj = $('consejo'), cjTxt = '', cjDesde = 0, cjFuera = false;
    function colocando() { var bc = $('barra-colocar'); return bc && !bc.classList.contains('oculto'); }
    setInterval(function () {
      if (!cj) return;
      var t = cj.textContent;
      if (t !== cjTxt) { cjTxt = t; cjDesde = Date.now(); cjFuera = false; }
      if (t && !cjFuera && !colocando() && Date.now() - cjDesde > 4000) cjFuera = true;
      cj.classList.toggle('tk-fuera', !!t && cjFuera && !colocando());
    }, 250);
    document.addEventListener('pointerdown', function () { if (cjTxt && Date.now() - cjDesde > 400 && !colocando()) cjFuera = true; }, true);
})();
