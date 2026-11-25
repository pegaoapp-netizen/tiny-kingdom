/* v9.14 · SISTEMA DE MÚSICA DE GUERRA de Brother Kingdom.
   - Mira la situación de la partida (solo lee, por el puente window.__tkMus de juego.js) y elige la pista de PISTAS_GUERRA (datos.js).
   - Cada pista es un bucle perfecto (el eco del final ya viene sumado al principio): suena con Web Audio en bucle exacto, sin cortes.
   - Entre pistas hay un fundido suave. Nunca suenan dos pistas de guerra a la vez (solo se cruzan durante el fundido).
   - Ahorro en Android/iPhone: solo se descarga la pista que hace falta, en memoria hay como mucho la que suena y la que entra
     (las otras se sueltan), se para todo al salir de la app y se revisa una vez por segundo.
   - Mientras una pista se descarga, o si falla, suena la música hecha con código de juego.js (respaldo): nunca hay un silencio raro.
   - Para añadir una melodía: archivo en musica/ y una línea en PISTAS_GUERRA. */
(function () {
  var M = function () { return window.__tkMus; };
  var PISTAS = window.PISTAS_GUERRA || {};
  var FUNDIDO = 2.5;
  var ctx = null, bus = null, actual = null, voz = null, final = null, falla = {}, cargando = {}, buffers = {};

  // ---------- en qué situación está la partida ----------
  function vidaPelea() { // media de vida de tus héroes en la batalla de Campaña (lee las barras de la pantalla)
    var b = document.querySelectorAll('#tkc-rets .tkc-r .bv i'); if (!b.length) return 1;
    var t = 0; for (var i = 0; i < b.length; i++) t += (parseFloat(b[i].style.width) || 0) / 100;
    return t / b.length;
  }
  function situacion() {
    var m = M(); if (!m) return null;
    var pelea = document.getElementById('tkc-rets') && !document.querySelector('#tkc .tkc-fin');
    if (pelea) return vidaPelea() < 0.3 ? 'critica' : 'batalla';
    if (m.oleada()) return m.vidaCastillo() < 0.3 ? 'critica' : 'asedio';
    if (m.campana()) return 'preparacion';
    if (m.enMundo()) return m.marchas() > 0 ? 'marcha' : 'preparacion';
    return null; // ciudad: la música de siempre
  }
  function tieneArchivo(k) { var p = PISTAS[k]; return !!(p && p.archivo && !falla[k]); }

  // ---------- carga (solo la que hace falta) ----------
  function preparar() {
    var m = M(); if (!m || !m.contexto() || !m.salida()) return false;
    if (ctx === m.contexto() && bus) return true;
    ctx = m.contexto(); bus = ctx.createGain(); bus.gain.value = m.volumen(); bus.connect(m.salida());
    return true;
  }
  function cargar(k, listo) {
    if (buffers[k]) { listo(buffers[k]); return; }
    if (cargando[k]) { cargando[k].push(listo); return; }
    cargando[k] = [listo];
    var p = PISTAS[k], url = p.archivo + (p.archivo.indexOf('?') < 0 ? '?v=' + (window.VERSION_JUEGO || '') : '');
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (ab) {
      // Safari viejo solo acepta la forma con funciones
      return new Promise(function (ok, no) { var pr = ctx.decodeAudioData(ab, ok, no); if (pr && pr.then) pr.then(ok, no); });
    }).then(function (buf) {
      var esp = cargando[k] || []; delete cargando[k]; buffers[k] = buf; limpiar();
      esp.forEach(function (f) { f(buf); });
    }).catch(function () { falla[k] = true; delete cargando[k]; }); // queda la música de código y no se vuelve a pedir en esta partida
  }
  function limpiar() { // en memoria solo lo que suena o va a sonar
    Object.keys(buffers).forEach(function (k) { if (k !== actual && !(voz && voz.k === k) && !(final && final.k === k) && !cargando[k]) delete buffers[k]; });
  }
  // ---------- tocar ----------
  function arrancar(k, buf, seg, retraso) {
    var p = PISTAS[k], g = ctx.createGain(), s = ctx.createBufferSource(), t = ctx.currentTime + (retraso || 0);
    s.buffer = buf; s.loop = !p.unaVez;
    if (s.loop) { s.loopStart = Math.min(p.inicioBucle || 0, buf.duration - 0.5); s.loopEnd = buf.duration; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p.vol || 1, t + seg);
    s.connect(g); g.connect(bus); s.start(t);
    return { k: k, s: s, g: g };
  }
  function apagar(v, seg) {
    if (!v || !v.s) return; var t = ctx.currentTime;
    try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(Math.max(0.0001, v.g.gain.value), t); v.g.gain.exponentialRampToValueAtTime(0.0001, t + seg); v.s.stop(t + seg + 0.05); } catch (e) {}
    setTimeout(function () { try { v.s.disconnect(); v.g.disconnect(); } catch (e) {} limpiar(); }, seg * 1000 + 200);
  }
  function cambiar(k) {
    actual = k;
    if (voz && voz.k === k) return;
    if (voz) { apagar(voz, FUNDIDO); voz = null; }
    if (!k || !tieneArchivo(k)) { limpiar(); return; }
    cargar(k, function (buf) { if (actual !== k || final || voz || !M() || !M().puede()) return; voz = arrancar(k, buf, FUNDIDO); });
  }
  function silencioTotal() {
    if (voz) { apagar(voz, 0.4); voz = null; } if (final) { apagar(final, 0.4); final = null; }
    actual = null; buffers = {};
  }
  function revisar() {
    var m = M();
    if (!m || !m.puede() || document.hidden || (ctx && ctx.state !== 'running')) { if (voz || final) silencioTotal(); else if (document.hidden) buffers = {}; return; }
    if (!preparar()) return;
    var vol = m.volumen(); if (Math.abs(bus.gain.value - vol) > 0.01) bus.gain.setTargetAtTime(vol, ctx.currentTime, 0.2);
    if (final) return; // suena la de victoria o derrota
    var s = situacion();
    if (s !== actual || (s && tieneArchivo(s) && !voz && !cargando[s])) cambiar(s);
  }
  // victoria / derrota: la música de la situación se apaga, suena la melodía una vez y luego vuelve sola
  function tocarFinal(gano) {
    var k = gano ? 'victoria' : 'derrota', m = M();
    if (!m || !m.puede() || !tieneArchivo(k) || !preparar()) return false;
    if (voz) { apagar(voz, 0.8); voz = null; }
    actual = null; var marca = final = { k: k, pendiente: true };
    cargar(k, function (buf) {
      if (final !== marca) return;
      var f = final = arrancar(k, buf, 0.2, 1.5); // tras el toque corto de victoria/derrota que ya suena en juego.js
      f.s.onended = function () { if (final === f) { try { f.s.disconnect(); f.g.disconnect(); } catch (e) {} final = null; limpiar(); revisar(); } };
    });
    setTimeout(function () { if (final === marca) { final = null; revisar(); } }, 4000); // si tarda mucho en llegar, se deja
    return true;
  }

  // ---------- con quién habla juego.js ----------
  window.TKMusica = {
    // qué música de código debe sonar: 'archivo' = calla porque suena una pista; 'tension' o 'combate' = respaldo; 'ciudad' = la de siempre
    faseRespaldo: function () {
      if (final || voz) return 'archivo';
      var s = actual !== null ? actual : situacion();
      if (!s) return 'ciudad';
      return (s === 'preparacion' || s === 'marcha') ? 'tension' : 'combate'; // aún cargando, sin archivo o falló
    },
    final: tocarFinal,
    situacion: situacion,
    pistas: PISTAS,
    estado: function () { return { situacion: actual, pista: voz && voz.k, final: final && final.k, cargando: Object.keys(cargando), memoria: Object.keys(buffers), fallos: Object.keys(falla) }; }
  };
  document.addEventListener('visibilitychange', revisar);
  setInterval(revisar, 1000);
})();
