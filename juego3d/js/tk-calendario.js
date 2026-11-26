/* v9.12 · CALENDARIO DE PREMIOS DEL MES («Conectarse»).
   v9.69: va con la FECHA: cada día del mes tiene su premio; si ese día entras, lo puedes cobrar; si faltas, se pierde.
   (Antes: cada día distinto que entrabas en el mes se iluminaba una casilla más.) Tocas las iluminadas y te llevas el premio.
   Al cambiar de mes empieza de cero. Día 15: el gran premio de BOTELLAS de campaña.
   Usa el puente window.__tkCal de juego.js. Nunca da gemas (regla del dueño). */
(function () {
  // 31 premios: [objeto, cantidad]. Los meses cortos solo muestran sus días.
  var PREMIOS = [
    ['acel_15m', 3], ['cofre_tesoro', 1], ['libro_peq', 3], ['escudo_2h', 1], ['madera_500k', 1],
    ['energia_heroe', 2], ['acel_1h', 2], ['ficha_x1', 1], ['piedra_500k', 1], ['cofre_plata', 2],
    ['libro_gra', 1], ['cuerno_guerra', 1], ['comida_500k', 1], ['inv_1h', 2], ['botella', 80],
    ['oro_500k', 1], ['tropas_esp', 1], ['amatista_100', 1], ['acel_8h', 1], ['cofre_oro', 2],
    ['pergamino', 2], ['bono_oro', 1], ['cofre_mejora1', 1], ['libro_gra', 2], ['ficha_x5', 1],
    ['tropas_gua', 1], ['mixto_1m', 1], ['cofre_mejora2', 1], ['acel_24h', 1], ['cofre_equipo', 1],
    ['amatista_500', 1]
  ];
  var DIA_GRANDE = 15; // las botellas de campaña
  var BOTELLA_SVG = '<svg viewBox="0 0 64 64" class="cal-bot" aria-hidden="true"><defs><linearGradient id="calLiq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a5a"/><stop offset="1" stop-color="#a3101a"/></linearGradient></defs>' +
    '<g transform="rotate(-14 22 38)"><rect x="17" y="8" width="10" height="9" rx="2" fill="#8a5a2b"/><path d="M15 17h14v6c6 3 9 8 9 14 0 9-7 16-16 16S6 46 6 37c0-6 3-11 9-14z" fill="#dff3ff" fill-opacity=".55" stroke="#fff" stroke-width="2"/><path d="M8 38c0 8 6 13 14 13s14-5 14-13c-5 2-9-2-14-1s-9 3-14 1z" fill="url(#calLiq)"/><ellipse cx="14" cy="32" rx="2.5" ry="5" fill="#fff" fill-opacity=".7"/></g>' +
    '<g transform="rotate(12 44 40)"><rect x="39" y="12" width="9" height="8" rx="2" fill="#8a5a2b"/><path d="M37 20h13v5c5 3 8 7 8 13 0 8-6 14-14 14s-14-6-14-14c0-6 3-10 7-13z" fill="#dff3ff" fill-opacity=".55" stroke="#fff" stroke-width="2"/><path d="M32 39c0 7 5 11 12 11s12-4 12-11c-4 2-8-2-12-1s-8 3-12 1z" fill="url(#calLiq)"/><ellipse cx="37" cy="33" rx="2" ry="4.5" fill="#fff" fill-opacity=".7"/></g></svg>';
  var CAL_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="8" width="38" height="34" rx="4" fill="#fff8e6" stroke="#7a4a00" stroke-width="2.5"/><rect x="5" y="8" width="38" height="9" rx="4" fill="#c62f22"/>' +
    '<path d="M14 4v8M34 4v8" stroke="#5b3016" stroke-width="3" stroke-linecap="round"/><g fill="#e0c48a"><rect x="10" y="21" width="6" height="5" rx="1"/><rect x="21" y="21" width="6" height="5" rx="1"/><rect x="32" y="21" width="6" height="5" rx="1"/><rect x="10" y="30" width="6" height="5" rx="1"/><rect x="21" y="30" width="6" height="5" rx="1"/></g>' +
    '<circle cx="35" cy="33" r="7" fill="#ffd34d" stroke="#b8860b" stroke-width="1.5"/><path d="M35 28l1.6 3.3 3.6.4-2.7 2.4.8 3.5-3.3-1.8-3.3 1.8.8-3.5-2.7-2.4 3.6-.4z" fill="#fff6c8"/></svg>';

  function C() { return window.__tkCal; }
  function L(es, en) { return C() ? C().L(es, en) : es; }
  function fecha(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function mesDe(d) { return fecha(d).slice(0, 7); }
  function diasDelMes(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
  function premio(i) { return PREMIOS[i - 1] || PREMIOS[PREMIOS.length - 1]; }
  function icono(p) { return p[0] === 'botella' ? BOTELLA_SVG : C().icono(p[0]); }

  // v9.69 (dueño): EL CALENDARIO VA CON LA FECHA. Hoy es el día del mes que marca el reloj; el día que no entras, su premio se pierde.
  // d.ent = { día: 1 } los días del mes en que entraste. Solo esos se pueden cobrar.
  function diaHoy() { return new Date().getDate(); }
  function contarHoy() {
    var c = C(); if (!c || !c.listo()) return null;
    var d = c.datos(), ahora = new Date(), mes = mesDe(ahora), hoy = fecha(ahora), cambio = false;
    if (d.mes !== mes) { d.mes = mes; d.dias = 0; d.ult = ''; d.cob = {}; d.ent = {}; d.visto = ''; cambio = true; }
    if (!d.ent) { d.ent = {}; if (d.ult && d.ult.slice(0, 7) === mes) d.ent[+d.ult.slice(8, 10)] = 1; cambio = true; } /* cuentas de antes: cuenta el último día que entró */
    d.cob = d.cob || {};
    if (!d.ent[diaHoy()]) { d.ent[diaHoy()] = 1; cambio = true; }
    if (d.ult !== hoy) { d.ult = hoy; cambio = true; }
    var n = Object.keys(d.ent).length; if (d.dias !== n) { d.dias = n; cambio = true; }
    if (cambio) c.guardar();
    return d;
  }
  function estadoDia(d, i) { return d.cob[i] ? 'cogido' : d.ent[i] ? 'listo' : i < diaHoy() ? 'perdido' : 'futuro'; }
  function pendientes(d) { var n = 0; for (var i = 1; i <= diaHoy(); i++) if (estadoDia(d, i) === 'listo') n++; return n; }

  // ---------- BOTÓN «CONECTARSE» (a la izquierda de la ciudad) ----------
  function boton() {
    var b = document.getElementById('btn-calendario');
    if (!b) {
      b = document.createElement('button'); b.id = 'btn-calendario'; b.type = 'button';
      b.innerHTML = '<span class="cal-cinta"></span><span class="cal-ico">' + CAL_SVG + '</span><span class="badge" id="badge-calendario"></span>';
      b.addEventListener('click', function () { if (C()) { C().sonar('click'); abrir(); } });
      document.body.appendChild(b);
    }
    return b;
  }
  function refrescarBoton() {
    var c = C(), b = boton(), d = contarHoy();
    b.style.display = d ? '' : 'none'; if (!d) return;
    b.querySelector('.cal-cinta').textContent = L('Premios', 'Rewards');
    var n = pendientes(d), bd = document.getElementById('badge-calendario');
    bd.textContent = n ? n : ''; bd.style.display = n ? '' : 'none';
    b.classList.toggle('cal-hay', n > 0);
    // como en los juegos de castillos: se abre solo una vez al día si hay algo que recoger
    if (n && d.visto !== d.ult && !c.ocupado() && !document.getElementById('cal-ventana') && !esMundo()) { d.visto = d.ult; c.guardar(); abrir(); }
  }
  function esMundo() { var m = document.getElementById('mundo'); return !!(m && !m.classList.contains('oculto')); }

  // ---------- VENTANA DEL CALENDARIO ----------
  function abrir() {
    var c = C(), d = contarHoy(); if (!d) return;
    var v = document.getElementById('cal-ventana'); if (v) v.remove();
    var ahora = new Date(), total = diasDelMes(ahora), nombreMes = ahora.toLocaleDateString(L('es-ES', 'en-US'), { month: 'long' });
    var celdas = '';
    for (var i = 1; i <= total; i++) {
      var p = premio(i), est = estadoDia(d, i);
      celdas += '<button type="button" class="cal-dia ' + est + (i === DIA_GRANDE ? ' grande' : '') + '" data-dia="' + i + '"' + (est === 'listo' ? '' : ' tabindex="-1"') + ' title="' + c.nombre(p[0]) + '">' +
        '<span class="cal-n">' + i + '</span><span class="cal-img">' + icono(p) + '</span><b>×' + c.num(p[1]) + '</b>' +
        (est === 'cogido' ? '<span class="cal-ok">✓</span>' : est === 'perdido' ? '<span class="cal-ok cal-no">✕</span>' : '') + (i === diaHoy() ? '<span class="cal-hoy">' + L('HOY', 'TODAY') + '</span>' : '') + '</button>';
    }
    var fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1) - ahora, dd = Math.floor(fin / 86400000), hh = Math.floor(fin % 86400000 / 3600000), n = pendientes(d);
    var bot = premio(DIA_GRANDE);
    v = document.createElement('div'); v.id = 'cal-ventana';
    v.innerHTML = '<div class="cal-caja" role="dialog" aria-label="' + L('Premios por conectarte', 'Log-in rewards') + '">' +
      '<button class="cal-x" type="button" aria-label="' + L('Cerrar', 'Close') + '">✕</button>' +
      '<h2>' + L('Premios de ', 'Log-in Rewards · ') + nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1) + '</h2><div class="cal-raya"></div>' +
      '<p class="cal-txt">' + L('Hoy es el día <b>' + diaHoy() + '</b>. Entra cada día para cobrar su premio: <b>si faltas un día, ese premio se pierde</b>. Este mes has entrado <b>' + d.dias + '</b> día(s).', 'Today is day <b>' + diaHoy() + '</b>. Log in every day to collect its reward: <b>miss a day and that reward is lost</b>. You logged in <b>' + d.dias + '</b> day(s) this month.') + '</p>' +
      '<p class="cal-txt cal-bot-txt">🧪 ' + L('Día ' + DIA_GRANDE + ': <b>' + bot[1] + ' botellas de campaña</b> para jugar la Campaña.', 'Day ' + DIA_GRANDE + ': <b>' + bot[1] + ' campaign flasks</b> to play the Campaign.') + '</p>' +
      '<div class="cal-rejilla">' + celdas + '</div>' +
      '<div class="cal-info" id="cal-info"></div>' + /* v9.16: qué es el premio que tocas */
      '<div class="cal-pie"><small>' + L('Nuevo calendario en ', 'New calendar in ') + dd + 'd ' + hh + 'h</small>' +
      (n > 1 ? '<button type="button" class="comprar verde cal-todo">' + L('Recoger todo (' + n + ')', 'Collect all (' + n + ')') + '</button>' : '') + '</div></div>';
    document.body.appendChild(v);
    function cerrar() { v.remove(); refrescarBoton(); }
    v.querySelector('.cal-x').addEventListener('click', function () { c.sonar('click'); cerrar(); });
    v.addEventListener('click', function (ev) { if (ev.target === v) cerrar(); });
    Array.prototype.forEach.call(v.querySelectorAll('.cal-dia'), function (el) {
      el.addEventListener('click', function () {
        var i = +el.getAttribute('data-dia');
        if (el.classList.contains('listo') && el.classList.contains('elegido')) { recoger([i]); return; } // segundo toque: lo recoges
        c.sonar('click'); info(i);
      });
    });
    // ficha del premio: dibujo grande, nombre, cantidad, para qué sirve y cuándo se cobra
    function info(i) {
      var p = premio(i), nm = window.NOMBRES && NOMBRES[p[0]], q = nm && nm.des_es ? [nm.des_es, nm.des_en || nm.des_es] : null, est = estadoDia(d, i), falta = i - diaHoy();
      Array.prototype.forEach.call(v.querySelectorAll('.cal-dia'), function (e) { e.classList.toggle('elegido', +e.getAttribute('data-dia') === i); });
      v.querySelector('#cal-info').innerHTML = '<div class="ci-img">' + icono(p) + '</div><div class="ci-txt"><b>' + L('Día ', 'Day ') + i + ' · ' + c.nombre(p[0]) + ' ×' + c.num(p[1]) + '</b>' +
        (q ? '<span>' + L(q[0], q[1]) + '</span>' : '') +
        '<em class="ci-' + est + '">' + (est === 'cogido' ? '✓ ' + L('Ya lo recogiste.', 'Already collected.') : est === 'listo' ? '🎁 ' + L('¡Ya es tuyo! Toca otra vez la casilla o el botón para recogerlo.', 'It is yours! Tap the square again or the button to collect.') : est === 'perdido' ? '✕ ' + L('Ese día no entraste: este premio se perdió.', 'You did not log in that day: this reward is lost.') : falta > 0 ? '🔒 ' + L('Se cobra el día ' + i + ' (faltan ' + falta + (falta === 1 ? ' día' : ' días') + ').', 'Collect it on day ' + i + ' (' + falta + (falta === 1 ? ' day' : ' days') + ' left).') : '🔒 ' + L('Se desbloquea cuando entres ' + falta + ' día' + (falta > 1 ? 's' : '') + ' más este mes.', 'Unlocks after ' + falta + ' more log-in day' + (falta > 1 ? 's' : '') + ' this month.')) + '</em>' +
        (est === 'listo' ? '<button type="button" class="comprar verde ci-recoger">' + L('Recoger', 'Collect') + '</button>' : '') + '</div>';
      var br = v.querySelector('.ci-recoger'); if (br) br.addEventListener('click', function () { recoger([i]); });
    }
    var primero = 0; for (var j = 1; j <= total && !primero; j++) if (estadoDia(d, j) === 'listo') primero = j; // al abrir: el premio que toca ahora
    info(primero || diaHoy());
    var bt = v.querySelector('.cal-todo');
    if (bt) bt.addEventListener('click', function () { var l = []; for (var i = 1; i <= diaHoy(); i++) if (estadoDia(d, i) === 'listo') l.push(i); recoger(l); });
  }
  // se marca primero como cogido (nunca se cobra dos veces) y luego se da
  function recoger(lista) {
    var c = C(), d = contarHoy(); if (!d) return;
    var items = [], dias = [];
    lista.forEach(function (i) {
      if (d.cob[i] || !d.ent[i] || i > diaHoy()) return; /* v9.69: solo los días que entraste */
      var p = premio(i); if (!c.existe(p[0])) return;
      d.cob[i] = 1; c.dar(p[0], p[1]); dias.push(i);
      items.push({ ico: icono(p), n: p[1], nom: c.nombre(p[0]) });
    });
    if (!items.length) return;
    c.guardar();
    var v = document.getElementById('cal-ventana'); if (v) v.remove();
    c.recompensas(dias.length === 1 ? L('Premio del día ', 'Day reward ') + dias[0] : L('Premios del mes', 'Monthly rewards'), items, function () { abrir(); });
    refrescarBoton();
  }

  // estilos (pergamino como la ventana del juego de referencia, pero con nuestro dibujo)
  var css = [
    '#btn-calendario { position: fixed; z-index: 29; left: calc(8px + env(safe-area-inset-left)); top: calc(env(safe-area-inset-top) + 136px); width: 58px; height: 62px; padding: 0; border: 0; background: none; cursor: pointer; font-family: inherit; -webkit-tap-highlight-color: transparent; }',
    '#btn-calendario .cal-ico { position: absolute; left: 5px; top: 13px; width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(#fff3d0, #e9c97a); border: 2px solid #7a4a00; box-shadow: 0 3px 0 rgba(0,0,0,.35); display: grid; place-items: center; }',
    '#btn-calendario .cal-ico svg { width: 40px; height: 40px; }',
    '#btn-calendario .cal-cinta { position: absolute; left: 0; right: 0; top: 0; z-index: 2; font-size: 10.5px; font-weight: 900; color: #fff; background: linear-gradient(#d8402e, #9a1d12); border: 1.5px solid #ffd98a; border-radius: 6px; padding: 1px 2px; text-shadow: 0 1px 0 #000; white-space: nowrap; overflow: hidden; }',
    '#btn-calendario .badge { position: absolute; right: -4px; top: 8px; z-index: 3; min-width: 18px; height: 18px; border-radius: 9px; background: #e3261b; color: #fff; font-size: 11px; font-weight: 900; line-height: 18px; text-align: center; border: 1.5px solid #fff; }',
    '#btn-calendario.cal-hay .cal-ico { animation: calLate 1.4s ease-in-out infinite; }',
    '@keyframes calLate { 0%,100% { transform: scale(1); box-shadow: 0 3px 0 rgba(0,0,0,.35); } 50% { transform: scale(1.06); box-shadow: 0 3px 0 rgba(0,0,0,.35), 0 0 14px 3px rgba(255,214,80,.9); } }',
    'body.panel-abierto #btn-calendario, body.colocando #btn-calendario, body.mg-abierto #btn-calendario { display: none !important; }',
    '#cal-ventana { position: fixed; inset: 0; z-index: 68; display: grid; place-items: center; background: rgba(0,0,0,.55); padding: calc(10px + env(safe-area-inset-top)) 8px calc(10px + env(safe-area-inset-bottom)); }',
    '#cal-ventana .cal-caja { position: relative; width: min(440px, 96vw); max-height: 100%; overflow-y: auto; padding: 16px 12px 12px; border-radius: 10px; color: #3a2414;',
    '  background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.35), transparent 60%), linear-gradient(#f1e2bd, #dcc38d); border: 4px solid #6e5a3c; box-shadow: inset 0 0 0 2px #b79a63, inset 0 0 30px rgba(120,80,30,.35), 0 10px 30px rgba(0,0,0,.6); animation: calEntra .25s ease-out; }',
    '@keyframes calEntra { from { transform: scale(.9); opacity: 0; } to { transform: none; opacity: 1; } }',
    '#cal-ventana h2 { margin: 2px 34px 6px; text-align: center; font: 800 17px Georgia, serif; color: #4a3218; }',
    '#cal-ventana .cal-raya { height: 4px; margin: 0 10px 8px; background: linear-gradient(90deg, transparent, #7a6a50 10%, #7a6a50 90%, transparent); border-radius: 2px; }',
    '#cal-ventana .cal-x { position: absolute; right: 6px; top: 6px; width: 34px; height: 34px; border-radius: 6px; border: 2px solid #2a2a2a; background: linear-gradient(#5a5a5a, #2c2c2c); color: #ffd34d; font-size: 20px; font-weight: 900; cursor: pointer; }',
    '#cal-ventana .cal-txt { margin: 0 6px 6px; font-size: 13.5px; line-height: 1.35; color: #5a4022; }',
    '#cal-ventana .cal-bot-txt { padding: 4px 8px; border-radius: 8px; background: rgba(163,16,26,.12); border: 1px dashed #a3101a; }',
    '#cal-ventana .cal-rejilla { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; padding: 7px; border: 4px solid #b8925a; border-radius: 4px; background: rgba(120,80,30,.15); }',
    '#cal-ventana .cal-dia { position: relative; aspect-ratio: 1 / 1.05; padding: 0; border-radius: 6px; border: 3px solid #a89070; background: linear-gradient(#5b7fb0, #2e4f80); cursor: pointer; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: inherit; box-shadow: inset 0 0 0 2px rgba(255,255,255,.25); }',
    '#cal-ventana .cal-dia .cal-img { width: 70%; height: 58%; display: grid; place-items: center; font-size: 26px; line-height: 1; }',
    '#cal-ventana .cal-dia .cal-img img, #cal-ventana .cal-dia .cal-img svg { width: 100%; height: 100%; object-fit: contain; }',
    '#cal-ventana .cal-dia b { font-size: 11px; color: #fff; text-shadow: 0 1px 2px #000; }',
    '#cal-ventana .cal-n { position: absolute; left: 3px; top: 1px; font-size: 10px; font-weight: 900; color: #ffe9b0; text-shadow: 0 1px 1px #000; }',
    '#cal-ventana .cal-dia.listo { border-color: #7dff3a; box-shadow: 0 0 0 2px #3a9a10, 0 0 12px 2px rgba(125,255,58,.75); animation: calBrilla 1.2s ease-in-out infinite; }',
    '@keyframes calBrilla { 50% { box-shadow: 0 0 0 2px #3a9a10, 0 0 18px 5px rgba(125,255,58,.95); } }',
    '#cal-ventana .cal-dia.cogido { filter: saturate(.35) brightness(.8); }',
    '#cal-ventana .cal-dia.cogido .cal-ok { position: absolute; inset: 0; display: grid; place-items: center; font-size: 30px; font-weight: 900; color: #7dff3a; text-shadow: 0 2px 3px #000; background: rgba(0,0,0,.25); }',
    '#cal-ventana .cal-dia.futuro { background: linear-gradient(#f8e3b0, #e7c27a); border-color: #b8925a; }',
    '#cal-ventana .cal-dia.perdido { background: linear-gradient(#6a5a4a, #3a3028); border-color: #5a4a3a; filter: grayscale(.8) brightness(.75); }',
    '#cal-ventana .cal-dia .cal-ok.cal-no { color: #ff6a5a; }',
    '#cal-ventana .cal-dia .cal-hoy { position: absolute; left: 0; right: 0; bottom: 0; font-size: 9px; font-weight: 900; color: #fff; background: #c62f22; letter-spacing: .5px; }',
    '#cal-ventana .ci-perdido { color: #a3101a; }',
    '#cal-ventana .cal-dia.futuro b { color: #5b3016; text-shadow: none; }',
    '#cal-ventana .cal-dia.grande { background: radial-gradient(circle at 50% 40%, #ffe9a0, #d8402e 75%); border-color: #ffd34d; }',
    '#cal-ventana .cal-dia.grande::after { content: "★"; position: absolute; right: 3px; top: 0; color: #fff6c8; font-size: 12px; text-shadow: 0 0 4px #b8860b; }',
    '#cal-ventana .cal-dia.grande.listo { border-color: #7dff3a; }',
    '#cal-ventana .cal-dia.elegido { outline: 3px solid #ffd34d; outline-offset: 1px; z-index: 1; }',
    '#cal-ventana .cal-info { display: flex; gap: 10px; align-items: center; margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.45); border: 2px solid #b8925a; min-height: 74px; }',
    '#cal-ventana .ci-img { flex: 0 0 58px; height: 58px; border-radius: 8px; background: linear-gradient(#5b7fb0, #2e4f80); border: 2px solid #a89070; display: grid; place-items: center; font-size: 30px; }',
    '#cal-ventana .ci-img img, #cal-ventana .ci-img svg { width: 84%; height: 84%; object-fit: contain; }',
    '#cal-ventana .ci-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; font-size: 13px; line-height: 1.3; color: #4a3218; }',
    '#cal-ventana .ci-txt b { font-size: 14px; color: #3a2414; } #cal-ventana .ci-txt em { font-style: normal; font-weight: 700; font-size: 12.5px; }',
    '#cal-ventana .ci-cogido { color: #3f7a22; } #cal-ventana .ci-listo { color: #2f7a10; } #cal-ventana .ci-futuro { color: #8a4a12; }',
    '#cal-ventana .ci-recoger { align-self: flex-start; margin-top: 4px; padding: 6px 16px; }',
    '#cal-ventana .cal-pie { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding: 0 4px; }',
    '#cal-ventana .cal-pie small { color: #6a4a22; font-weight: 700; white-space: nowrap; }',
    '#cal-ventana .cal-todo { flex: 0 0 auto; padding: 8px 14px; }',
    '#recompensas .rc-ico .cal-bot { width: 40px; height: 40px; }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-calendario-css'; st.textContent = css; document.head.appendChild(st);

  setTimeout(refrescarBoton, 15000); // deja pasar antes el cofre diario y el regalo de bienvenida
  setInterval(refrescarBoton, 5000);
  window.TKCalendario = { abrir: abrir, PREMIOS: PREMIOS, DIA_GRANDE: DIA_GRANDE };
})();
