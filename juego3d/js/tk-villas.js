/* v10.00 · ENTRAR EN LAS CIUDADES como en el vídeo del dueño (Claude)
   - «Mis villas»: arriba, los 5 medallones de villa en fila (la tuya en dorado). Tocar otra villa = entrar en ella.
     Debajo, la ficha de la villa en la que estás: atributos y mejoras (poder, castillo, edificios, muralla) y sus tropas.
     Todo lo que ya había (enviar recursos, destacar tropas, fundar, guía) sigue debajo, sin cambios.
   - Al cambiar de villa (desde Mis villas o desde el mapa con «Ir a esta villa»): pantalla de carga con el escudo de
     Brother Kingdom, el nombre de la villa y «Cargando…». Se va sola cuando la villa nueva ya se ve.
   Solo interfaz: no toca reglas, guardado ni progreso. El cambio de villa sigue siendo el de siempre (cambiarVilla de juego.js). */
(function () {
  'use strict';
  var TEMA = { 1: { nombre: 'Bahía de los Corsarios', en: 'Corsair Bay', ico: '🏴‍☠️' } };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // escudo propio (SVG): corona, dos espadas y las iniciales BK
  function escudo(tam, tema) {
    var c1 = tema === 1 ? '#1a2a3a' : '#6a1414', c2 = tema === 1 ? '#2f5a7a' : '#a8261e';
    return '<svg class="tkv-escudo" width="' + tam + '" height="' + Math.round(tam * 1.2) + '" viewBox="0 0 100 120"><defs><linearGradient id="tkvO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".45" stop-color="#e0b04a"/><stop offset="1" stop-color="#8a5a14"/></linearGradient><linearGradient id="tkvF' + (tema || 0) + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c2 + '"/><stop offset="1" stop-color="' + c1 + '"/></linearGradient></defs>' +
      '<path d="M50 14 L88 26 L86 64 Q82 96 50 114 Q18 96 14 64 L12 26 Z" fill="url(#tkvO)"/><path d="M50 21 L81 31 L79 63 Q76 89 50 105 Q24 89 21 63 L19 31 Z" fill="url(#tkvF' + (tema || 0) + ')"/>' +
      '<path d="M30 46 L70 86 M70 46 L30 86" stroke="url(#tkvO)" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="46" r="4" fill="url(#tkvO)"/><circle cx="70" cy="46" r="4" fill="url(#tkvO)"/>' +
      '<path d="M32 12 L38 2 L44 10 L50 0 L56 10 L62 2 L68 12 Z" fill="url(#tkvO)"/>' +
      '<text x="50" y="74" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="22" fill="#fff4cc" stroke="#3a2208" stroke-width="1">' + (tema === 1 ? '☠' : 'BK') + '</text></svg>';
  }
  function cabecera(o) {
    var L = o.L, act = 0, h = '<div class="carta tkv-cab"><div class="tkv-fila">';
    for (var k = 0; k < 5; k++) {
      var e = o.lista[k];
      if (e) { if (e.activa) act = k;
        h += '<button class="tkv-med' + (e.activa ? ' activa' : '') + '"' + (e.activa ? ' disabled' : ' data-accion="villa-ir" data-i="' + k + '"') + ' aria-label="' + esc(e.nombre) + '"><span class="tkv-num">' + (k + 1) + '</span><span class="tkv-ico">' + (TEMA[k] ? TEMA[k].ico : k === 0 ? '👑' : '🏰') + '</span><span class="tkv-nom">' + esc(e.nombre) + '</span></button>'; }
      else if (k < o.max) h += '<button class="tkv-med libre" data-accion="villa-mundo" aria-label="' + L('Espacio libre', 'Free slot') + '"><span class="tkv-num">' + (k + 1) + '</span><span class="tkv-ico">＋</span><span class="tkv-nom">' + L('Fundar', 'Found') + '</span></button>';
      else h += '<div class="tkv-med cerrada"><span class="tkv-num">' + (k + 1) + '</span><span class="tkv-ico">🔒</span><span class="tkv-nom">🏰 ' + (5 * k) + '</span></div>';
    }
    h += '</div>';
    var v = o.lista[act], tema = TEMA[act];
    h += '<div class="tkv-ficha">' + escudo(54, act === 1 ? 1 : 0) + '<div><b>' + esc(v.nombre) + '</b><small>' + (tema ? tema.ico + ' ' + L(tema.nombre, tema.en) + ' · ' : act === 0 ? '👑 ' + L('Villa Principal', 'Main Village') + ' · ' : '') + 'X ' + v.x + ' · Y ' + v.y + '</small><small class="tkv-pista">' + L('Toca otra villa de arriba para entrar en ella.', 'Tap another village above to enter it.') + '</small></div></div>';
    h += '<div class="tkv-tit">' + L('Atributos y mejoras', 'Attributes and upgrades') + '</div><div class="tkv-tabla">' +
      fila('⚡ ' + L('Poder', 'Power'), o.formato(o.poder)) + fila('🏰 ' + L('Castillo', 'Castle'), L('Nv ', 'Lv ') + v.castillo) + fila('🏠 ' + L('Edificios', 'Buildings'), v.edificios) + fila('🧱 ' + L('Muralla', 'Wall'), L('Nv ', 'Lv ') + v.muralla) + '</div>';
    var tr = v.tropas || {}, tipos = Object.keys(tr).filter(function (t) { return tr[t] > 0; }).sort(function (a, b) { return tr[b] - tr[a]; });
    h += '<div class="tkv-tit">' + L('Tropas', 'Troops') + '</div><div class="tkv-tabla">' + (tipos.length ? tipos.map(function (t) { return fila(esc(o.nombreTropa(t)), o.formato(tr[t])); }).join('') : '<div class="tkv-vacio">' + L('Sin tropas en esta villa.', 'No troops in this village.') + '</div>') + '</div></div>';
    return h;
    function fila(a, b) { return '<div class="tkv-f"><span>' + a + '</span><b>' + b + '</b></div>'; }
  }
  // ---------- pantalla de carga ----------
  var capa = null, seguro = null, t0 = 0;
  function cargando(nombre, k, hacer) {
    quitar(true);
    capa = document.createElement('div'); capa.id = 'tkv-carga'; capa.className = k === 1 ? 'tema-corsarios' : '';
    var L = window.__tkExtras && __tkExtras.L ? __tkExtras.L : function (a) { return a; };
    capa.innerHTML = '<div class="tkv-c-caja">' + escudo(96, k === 1 ? 1 : 0) + '<b>' + esc(nombre) + '</b>' + (TEMA[k] ? '<small>' + TEMA[k].ico + ' ' + L(TEMA[k].nombre, TEMA[k].en) + '</small>' : '') + '<div class="tkv-c-barra"><i></i></div><span>' + L('Cargando…', 'Loading…') + '</span></div>';
    document.body.appendChild(capa); t0 = performance.now();
    void capa.offsetWidth; capa.classList.add('visible'); // aparece ya (con su fundido)
    // se rehace la escena solo cuando la pantalla de carga ya está pintada y tapando (dos fotogramas + el fundido)
    requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(function () { try { hacer(); } catch (e) { console.warn('TKVillas', e); quitar(); } }, 140); /* v10.08: antes 380 ms */ }); });
    seguro = setTimeout(quitar, 9000); // por si algo falla, nunca se queda tapado
  }
  function llegado() {
    if (!capa) return;
    // dos fotogramas con la villa nueva ya dibujada (la isla pirata se construye en el primero) y un mínimo de 1 s en pantalla
    var falta = Math.max(0, 450 - (performance.now() - t0)); // v10.08: mínimo 0,45 s (antes 1 s)
    requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(quitar, falta + 60); }); });
  }
  function quitar(ya) {
    clearTimeout(seguro); var c = capa; capa = null; if (!c) return;
    if (ya) { c.remove(); return; }
    c.classList.remove('visible'); c.classList.add('saliendo'); setTimeout(function () { c.remove(); }, 260);
  }
  window.TKVillas = { cabecera: cabecera, cargando: cargando, llegado: llegado, escudo: escudo };
})();
