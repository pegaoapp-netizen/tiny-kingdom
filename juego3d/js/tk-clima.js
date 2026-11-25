/* v9.19 · CLIMA de la ciudad (lluvia y nieve), opcional y apagado de entrada.
   Se pinta en una capa transparente encima de la imagen 3D (debajo de botones y paneles):
   no toca el cielo, la noche, la luz, la niebla ni nada de la escena del juego.
   - Lluvia: rayas finas en 3 profundidades (las de cerca más largas, rápidas y claras), con viento y salpicaduras abajo.
   - Nieve: copos suaves de varios tamaños que bajan despacio y se mecen.
   Se elige en Ajustes > Clima (Apagado / Lluvia / Nieve / Cambia solo) y se guarda en el teléfono.
   En calidad Baja hay menos gotas y menos nitidez (más rápido en móviles). Lo mueve el bucle del juego (TKExtras). */
(function () {
  var X = function () { return window.__tkExtras; };
  var modo = 'apagado', actual = 'nada', lienzo = null, g = null, W = 0, H = 0, dpr = 1, gotas = [], salp = [], t = 0, fuerza = 0, viento = 0.18;
  try { modo = (JSON.parse(localStorage.getItem('tinykingdom_pref')) || {}).clima || 'apagado'; } catch (e) {}
  // copo ya dibujado una vez (pintarlo así es mucho más rápido que hacer un degradado por copo)
  var COPO = (function () { var c = document.createElement('canvas'); c.width = c.height = 32; var k = c.getContext('2d'), r = k.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = r; k.fillRect(0, 0, 32, 32); return c; })();
  var calHecha = '';
  var CANT = { lluvia: { alta: 460, baja: 190 }, nieve: { alta: 340, baja: 150 } };

  function capa() {
    if (lienzo) return true;
    var cont = document.getElementById('juego'); if (!cont) return false;
    lienzo = document.createElement('canvas'); lienzo.id = 'tk-clima';
    lienzo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none';
    cont.appendChild(lienzo); g = lienzo.getContext('2d'); medir(); window.addEventListener('resize', medir); return true;
  }
  function medir() {
    if (!lienzo) return; var x = X(); dpr = Math.min(window.devicePixelRatio || 1, x && x.calidad() === 'alta' ? 2 : 1);
    W = innerWidth; H = innerHeight; lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function nueva(tipo, arriba) {
    var z = Math.random(); // 0 = lejos, 1 = cerca
    if (tipo === 'lluvia') return { x: Math.random() * (W + 200) - 100, y: arriba ? -Math.random() * H * 0.3 : Math.random() * H, z: z, v: 900 + 900 * z, l: 14 + 30 * z, a: 0.3 + 0.45 * z };
    return { x: Math.random() * W, y: arriba ? -10 : Math.random() * H, z: z, v: 22 + 45 * z, r: 1.6 + 3.6 * z * z, a: 0.6 + 0.4 * z, f: Math.random() * 6.28 };
  }
  function preparar(tipo) {
    var x = X(); gotas = []; salp = []; actual = tipo; medir();
    if (tipo === 'nada') return;
    var n = CANT[tipo][x && x.calidad() === 'alta' ? 'alta' : 'baja'];
    for (var i = 0; i < n; i++) gotas.push(nueva(tipo, false));
  }
  function deseado() {
    if (modo === 'lluvia' || modo === 'nieve') return modo;
    if (modo !== 'auto') return 'nada';
    // «Cambia solo»: ciclos de 4 minutos: despejado, lluvia, despejado, nieve, despejado, lluvia
    var c = Math.floor(Date.now() / 240000) % 6; return c === 1 || c === 5 ? 'lluvia' : c === 3 ? 'nieve' : 'nada';
  }
  function cadaFotograma(dt) {
    var x = X(); if (!x || !capa()) return;
    var quiero = x.activo() ? deseado() : 'nada';
    // entra y sale poco a poco (nunca aparece de golpe)
    if (quiero !== actual) { fuerza -= dt * 0.9; if (fuerza <= 0 || actual === 'nada') { fuerza = 0; preparar(quiero); } }
    else fuerza = Math.min(1, fuerza + dt * 0.6);
    if (actual === 'nada' || fuerza <= 0) { if (lienzo.style.display !== 'none') { g.clearRect(0, 0, W, H); lienzo.style.display = 'none'; } return; }
    if (x.calidad() !== calHecha) { calHecha = x.calidad(); preparar(actual); }
    lienzo.style.display = ''; t += dt; g.clearRect(0, 0, W, H);
    if (actual === 'lluvia') pintarLluvia(dt); else pintarNieve(dt);
  }
  function pintarLluvia(dt) {
    viento = 0.16 + Math.sin(t * 0.3) * 0.05;
    // 3 pasadas por profundidad: una sola línea larga por pasada (rápido)
    for (var capaZ = 0; capaZ < 3; capaZ++) {
      g.beginPath(); var aMedia = 0, n = 0;
      for (var i = 0; i < gotas.length; i++) {
        var d = gotas[i]; if (Math.floor(d.z * 3) !== capaZ) continue;
        d.y += d.v * dt; d.x += d.v * viento * dt;
        if (d.y > H + 20) {
          if (d.z > 0.55 && salp.length < 60) salp.push({ x: d.x, y: H * (0.55 + 0.45 * Math.random()), t: 0, r: 2 + 4 * d.z });
          var nd = nueva('lluvia', true); d.x = nd.x; d.y = nd.y; d.z = nd.z; d.v = nd.v; d.l = nd.l; d.a = nd.a;
        }
        g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * viento, d.y - d.l); aMedia += d.a; n++;
      }
      if (!n) continue;
      g.strokeStyle = 'rgba(205,222,240,' + (aMedia / n * fuerza).toFixed(3) + ')'; g.lineWidth = 0.8 + capaZ * 0.6; g.lineCap = 'round'; g.stroke();
    }
    // salpicaduras: anillitos que se abren y se apagan
    g.lineWidth = 1;
    for (var s = salp.length - 1; s >= 0; s--) {
      var p = salp[s]; p.t += dt; if (p.t > 0.35) { salp.splice(s, 1); continue; }
      var k = p.t / 0.35; g.strokeStyle = 'rgba(215,230,245,' + (0.45 * (1 - k) * fuerza).toFixed(3) + ')';
      g.beginPath(); g.ellipse(p.x, p.y, p.r * (0.4 + k), p.r * 0.35 * (0.4 + k), 0, 0, 6.283); g.stroke();
    }
    // un velo muy suave de lluvia (no oscurece la luz del juego, solo da sensación de aire húmedo)
    g.fillStyle = 'rgba(150,170,195,' + (0.06 * fuerza).toFixed(3) + ')'; g.fillRect(0, 0, W, H);
  }
  function pintarNieve(dt) {
    for (var i = 0; i < gotas.length; i++) {
      var d = gotas[i]; d.f += dt * (0.8 + d.z);
      d.y += d.v * dt; d.x += (Math.sin(d.f) * 18 + 10) * dt * (0.5 + d.z);
      if (d.y > H + 10 || d.x > W + 10) { var nd = nueva('nieve', true); nd.x = Math.random() * W; gotas[i] = nd; continue; }
      g.globalAlpha = d.a * fuerza; g.drawImage(COPO, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
    }
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(235,242,250,' + (0.05 * fuerza).toFixed(3) + ')'; g.fillRect(0, 0, W, H);
  }
  window.TKClima = {
    modo: function () { return modo; },
    poner: function (m) { if (['apagado', 'lluvia', 'nieve', 'auto'].indexOf(m) < 0) return; modo = m; var x = X(); if (x) x.guardarPref('clima', m); },
    estado: function () { return { modo: modo, actual: actual, gotas: gotas.length, fuerza: +fuerza.toFixed(2) }; },
    _llenar: function () { fuerza = 1; }, // solo para fotos de prueba
    cadaFotograma: cadaFotograma
  };
})();
