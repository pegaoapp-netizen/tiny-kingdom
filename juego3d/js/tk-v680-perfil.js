// v6.80: Info del jugador al tocar la caja del jugador (con Ajustes dentro)
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function ingles() { var b = $('btn-idioma'); return b && /^\s*EN/i.test(b.textContent); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function txt(id) { var e = $(id); return e ? e.textContent.trim() : ''; }
    // Info del jugador: juego.js abre su panel de Poder al tocar la caja del jugador; aquí lo convertimos en el perfil
    var perfil = $('perfil');
    if (perfil) perfil.addEventListener('click', function () {
      setTimeout(function () {
        var panel = $('panel'), cuerpo = $('panel-cuerpo'), tit = $('panel-titulo');
        if (!panel || panel.classList.contains('oculto') || !cuerpo || cuerpo.querySelector('.pf') || !/[—]/.test(tit.textContent)) return;
        var en = ingles(), L = function (a, b) { return en ? b : a; };
        var nom = (txt('perfil-nombre').split(' · ')[0]) || L('Rey', 'King');
        var xb = $('xp-barra'), m = xb && /([\d.,]+)\s*\/\s*([\d.,]+)/.exec(xb.title || ''), rel = $('xp-relleno');
        var salir = $('btn-salir'), conCuenta = salir && salir.textContent.indexOf('⏻') >= 0, hayNube = salir && !salir.classList.contains('oculto');
        var viejo = cuerpo.innerHTML;
        tit.textContent = L('Info del jugador', 'Player info');
        cuerpo.innerHTML = '<div class="pf">' +
          '<div class="pf-arriba"><button class="pf-boton" data-pf="ajustes" title="' + L('Ajustes', 'Settings') + '">⚙️</button></div>' +
          '<div class="pf-cabeza"><div class="pf-avatar">👑</div><div class="pf-nombre"><b>' + esc(nom) + '</b><small>' + (conCuenta ? L('Cuenta en la nube ☁️', 'Cloud account ☁️') : L('Invitado', 'Guest')) + '</small></div></div>' +
          '<div class="carta"><div class="pf-fila"><span>' + L('Nivel', 'Level') + ': <b>' + esc(txt('nivel-rey') || '1') + '</b></span><small>' + (m ? esc(m[1] + ' / ' + m[2]) : '') + '</small></div>' +
            '<div class="pf-barra"><div style="width:' + (rel ? rel.style.width || '0%' : '0%') + '"></div></div>' +
            '<p class="nota">' + L('Construye, entrena y gana oleadas para subir de nivel.', 'Build, train and win waves to level up.') + '</p></div>' +
          '<div class="carta"><div class="pf-fila"><span>' + L('Poder', 'Power') + '</span><b>' + esc(txt('poder')) + '</b></div></div>' +
          viejo +
          '<div class="carta"><div class="pf-fila"><span>' + L('Reino', 'Kingdom') + '</span><b>' + esc(txt('tk-ciudad-n') || L('Mi reino', 'My kingdom')) + ' ' + esc(txt('tk-ciudad-xy')) + '</b></div>' +
            '<div class="pf-fila"><span>' + L('Oleada', 'Wave') + '</span><b>' + esc(txt('oleada')) + '</b></div></div>' +
          '<div class="pf-abajo">' + (!hayNube ? '' : conCuenta
            ? '<button class="comprar rojo" data-accion="cerrar-sesion">⏻ ' + L('Cerrar sesión', 'Log out') + '</button>'
            : '<button class="comprar naranja" data-accion="ir-cuenta">👤 ' + L('Entrar o crear cuenta', 'Log in or sign up') + '</button>') +
            '<button class="comprar azul" data-pf="ajustes">⚙️ ' + L('Ajustes', 'Settings') + '</button></div></div>';
      }, 0);
    });
    var pc = $('panel-cuerpo');
    if (pc) pc.addEventListener('click', function (ev) { var b = ev.target.closest('[data-pf="ajustes"]'); if (b) { var a = $('btn-ajustes'); if (a) a.click(); } });

})();
