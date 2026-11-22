/* Tiny Kingdom · pruebas automáticas del sistema de esqueleto.
   Las usa esqueleto.html (botón «Pruebas») y también Node:  node pruebas/esqueleto.js
   TKEsqueleto.pruebas(crear, opciones) → [{ nombre, ok, detalle }]
   crear() debe devolver un TKEsqueleto.Personaje nuevo (el de prueba o uno con modelo). */
(function (G) {
  'use strict';
  var E = G.TKEsqueleto, T = G.THREE; if (!E || !T) return;
  var V3 = T.Vector3, DT = 1 / 60, envolver = E.util.envolver;

  // mide cuánto se desliza en el suelo el punto de apoyo de cada pie
  function Medidor(p) {
    this.p = p; this.max = 0; this.ik = 0; this.nan = false; this.saltoRot = 0; this.saltoPos = 0; this.pasos = 0; this.vuelo = 0;
    this.prev = [null, null]; this.qPrev = null; this.pPrev = null; var self = this;
    this.z = [p.zocalo('pie.L'), p.zocalo('pie.R')];
    p.on('paso', function () { self.pasos++; });
  }
  Medidor.prototype.tomar = function () {
    var p = this.p, a = p.anim, self = this; p.grupo.updateMatrixWorld(true);
    if (!a.pies[0].apoyo && !a.pies[1].apoyo) this.vuelo++;
    a.pies.forEach(function (pie, i) {
      var tipo = pie.p > 1e-4 ? 1 : pie.p < -1e-4 ? -1 : 0, loc = tipo > 0 ? a.bola : tipo < 0 ? a.talon : new V3();
      var w = self.z[i].localToWorld(loc.clone()), pr = self.prev[i];
      if (pie.apoyo && a.wD === 0 && pr && pr.apoyo && pr.tipo === tipo && pr.lock.equals(pie.lock)) { var d = Math.hypot(w.x - pr.w.x, w.z - pr.w.z); if (d > self.max) self.max = d; }
      self.prev[i] = { apoyo: pie.apoyo, tipo: tipo, lock: pie.lock.clone(), w: w };
      if (a.wD === 0 && pie.apoyo) { var tob = self.z[i].localToWorld(new V3()); var e = tob.distanceTo(pie.tobillo); if (e > self.ik) self.ik = e; }
    });
    // saltos bruscos entre fotogramas (las transiciones deben ser suaves)
    var q = {}, pose = a.pose; E.LISTA.forEach(function (n) { var x = pose.q[n]; if (!isFinite(x.x + x.y + x.z + x.w)) self.nan = true; q[n] = x.clone(); });
    if (this.qPrev) E.LISTA.forEach(function (n) { var ang = q[n].angleTo(self.qPrev[n]); if (ang > self.saltoRot) self.saltoRot = ang; });
    var pp = pose.pelvisPos.clone().add(p.pos); if (this.pPrev) { var dp = pp.distanceTo(this.pPrev); if (dp > this.saltoPos) this.saltoPos = dp; }
    this.qPrev = q; this.pPrev = pp;
  };
  function sim(p, seg, entrada, med) { var n = Math.round(seg / DT); for (var i = 0; i < n; i++) { if (entrada) entrada(i * DT, p); p.actualizar(DT); if (med) med.tomar(); } }
  function cm(x) { return (x * 100).toFixed(2) + ' cm'; }

  function pruebas(crear, op) {
    op = op || {}; var R = [], escala;
    function prueba(nombre, fn) { try { var r = fn(); R.push({ nombre: nombre, ok: !!r[0], detalle: r[1] }); } catch (e) { R.push({ nombre: nombre, ok: false, detalle: 'Error: ' + (e && e.message) }); } }
    var LIM_DESL = op.limiteDeslizamiento || 0.004; // máximo que se puede mover un pie apoyado entre dos fotogramas

    prueba('Esqueleto completo (22 huesos con articulaciones)', function () {
      var p = crear(); escala = p.medidas.escala;
      if (p.tipo === 'prueba') {
        var malla = p.malla, ok = malla.isSkinnedMesh && malla.skeleton.bones.length === 22;
        E.LISTA.forEach(function (n) { var b = p.huesos[n]; if (!b || (E.PADRE[n] && b.parent !== p.huesos[E.PADRE[n]])) ok = false; });
        return [ok, malla.skeleton.bones.length + ' huesos, malla con piel (SkinnedMesh) unida al esqueleto'];
      }
      var faltan = E.LISTA.filter(function (n) { return n !== 'raiz' && !p.ret.map[n]; });
      return [faltan.length <= 4, 'huesos del modelo usados: ' + p.ret.items.length + (faltan.length ? ' · sin equivalente: ' + faltan.join(', ') : '')];
    });
    prueba('Caminar recto sin deslizar los pies', function () {
      var p = crear(), m = new Medidor(p); sim(p, 1, null, null); var z0 = p.pos.z;
      sim(p, 5, function (t, p) { p.mover(0, 1, 1, false); }, m);
      var d = p.pos.z - z0, es = p.estado();
      return [m.max < LIM_DESL && m.ik < 0.003 && es === 'caminar' && m.pasos >= 8 && !m.nan, 'estado ' + es + ', recorrió ' + d.toFixed(2) + ' m, ' + m.pasos + ' pasos, deslizamiento máx ' + cm(m.max) + ', error IK ' + cm(m.ik)];
    });
    prueba('Correr (con fase de vuelo) sin deslizar', function () {
      var p = crear(), m = new Medidor(p);
      sim(p, 5, function (t, p) { p.mover(1, 0, 1, true); }, m);
      var es = p.estado();
      return [m.max < LIM_DESL && es === 'correr' && m.vuelo > 20 && !m.nan, 'estado ' + es + ', velocidad ' + p.v.toFixed(2) + ' m/s, fotogramas en el aire ' + m.vuelo + ', deslizamiento máx ' + cm(m.max)];
    });
    prueba('Caminar en círculo (girando todo el rato)', function () {
      var p = crear(), m = new Medidor(p);
      sim(p, 6, function (t, p) { var a = t * 0.9; p.mover(Math.sin(a), Math.cos(a), 1, false); }, m);
      return [m.max < LIM_DESL * 1.5 && !m.nan, 'deslizamiento máx ' + cm(m.max) + ', error IK ' + cm(m.ik)];
    });
    prueba('Movimiento en 360° (8 direcciones): mira hacia donde camina', function () {
      var p = crear(), peor = 0, lado = 0;
      for (var k = 0; k < 8; k++) {
        var ang = k * Math.PI / 4 + 0.3, x = Math.sin(ang), z = Math.cos(ang);
        var x0 = p.pos.x, z0 = p.pos.z; sim(p, 1.6, function (t, p) { p.mover(x, z, 1, false); });
        peor = Math.max(peor, Math.abs(envolver(p.yaw - ang)));
        var px = p.pos.x, pz = p.pos.z; sim(p, 0.25, function (t, p) { p.mover(x, z, 1, false); });
        var mx = p.pos.x - px, mz = p.pos.z - pz, l = Math.hypot(mx, mz); lado = Math.max(lado, Math.abs(envolver(Math.atan2(mx, mz) - ang)));
      }
      return [peor < 0.05 && lado < 0.05, 'error de orientación máx ' + (peor * 57.3).toFixed(1) + '°, desvío del avance ' + (lado * 57.3).toFixed(1) + '°'];
    });
    prueba('Girar 180° en el sitio (dando pasos)', function () {
      var p = crear(), m = new Medidor(p); sim(p, 0.5); var x0 = p.pos.x, z0 = p.pos.z, t = 0, obj = envolver(p.yaw + Math.PI - 0.01);
      p.mirarHacia(obj);
      for (var i = 0; i < 180 && Math.abs(envolver(p.yaw - obj)) > 0.02; i++) { p.actualizar(DT); m.tomar(); t += DT; }
      sim(p, 0.8, null, m);
      var drift = Math.hypot(p.pos.x - x0, p.pos.z - z0);
      return [Math.abs(envolver(p.yaw - obj)) < 0.02 && t < 1.7 && drift < 1e-6 && m.pasos >= 2 && m.max < LIM_DESL, 'tardó ' + t.toFixed(2) + ' s, ' + m.pasos + ' pasos, se movió ' + cm(drift) + ', deslizamiento máx ' + cm(m.max)];
    });
    prueba('Parar desde correr: queda quieto y con los pies juntos', function () {
      var p = crear(), m = new Medidor(p); sim(p, 2.5, function (t, p) { p.mover(0, 1, 1, true); }, m);
      p.parar(); var t = 0; while (t < 2 && p.estado() !== 'quieto') { p.actualizar(DT); m.tomar(); t += DT; } sim(p, 0.3, null, m);
      var a = p.anim, err = 0; a.pies.forEach(function (pie) { var n = new V3(); a._neutral(n, pie, p.pos, p.yaw); err = Math.max(err, Math.hypot(n.x - pie.lock.x, n.z - pie.lock.z)); });
      return [p.v === 0 && p.estado() === 'quieto' && err < 0.08 * escala && m.max < LIM_DESL, 'se paró en ' + t.toFixed(2) + ' s, pies a ' + cm(err) + ' de su sitio, deslizamiento máx ' + cm(m.max)];
    });
    prueba('Ataque: golpea una vez y vuelve a quieto', function () {
      var p = crear(), imp = [], t = 0; p.on('impacto', function () { imp.push(t); }); sim(p, 0.5);
      var ok1 = p.atacar(), ok2 = p.atacar(), es = [];
      for (var i = 0; i < 70; i++) { p.actualizar(DT); t += DT; if (es[es.length - 1] !== p.estado()) es.push(p.estado()); }
      return [ok1 && !ok2 && imp.length === 1 && imp[0] > 0.3 && imp[0] < 0.4 && p.estado() === 'quieto', 'impactos ' + imp.length + ' (a los ' + (imp[0] || 0).toFixed(2) + ' s) · estados: ' + es.join(' → ')];
    });
    prueba('Atacar caminando (frena y sigue andando)', function () {
      var p = crear(), m = new Medidor(p); sim(p, 2, function (t, p) { p.mover(0, 1, 1, false); }); var v0 = p.v; p.atacar(); var vmin = 9;
      sim(p, 0.6, function (t, p) { p.mover(0, 1, 1, false); vmin = Math.min(vmin, p.v); }, m); sim(p, 1, function (t, p) { p.mover(0, 1, 1, false); }, m);
      return [vmin < v0 * 0.7 && p.estado() === 'caminar' && m.max < LIM_DESL, 'velocidad ' + v0.toFixed(2) + ' → ' + vmin.toFixed(2) + ' → ' + p.v.toFixed(2) + ' m/s, deslizamiento máx ' + cm(m.max)];
    });
    prueba('Recibir daño', function () {
      var p = crear(); sim(p, 0.3); p.recibirGolpe(1); sim(p, 0.1); var e1 = p.estado(); sim(p, 0.6);
      return [e1 === 'golpe' && p.estado() === 'quieto', 'estados: ' + e1 + ' → ' + p.estado()];
    });
    prueba('Muerte: cae al suelo, no se mueve, y revive', function () {
      var p = crear(), muertes = 0, revividos = 0; p.on('muerte', function () { muertes++; }); p.on('revivido', function () { revividos++; });
      sim(p, 0.3); var x0 = p.pos.x, z0 = p.pos.z; p.morir();
      sim(p, 2.4, function (t, p) { p.mover(1, 0, 1, true); p.atacar(); });
      p.grupo.updateMatrixWorld(true);
      var cad = p.zocalo('pelvis').getWorldPosition(new V3()).y, cab = p.zocalo('cabeza').getWorldPosition(new V3()).y, quieto = Math.hypot(p.pos.x - x0, p.pos.z - z0);
      var bajo = Math.min(cad, cab), ok = cad < 0.3 * p.medidas.alto && cab < 0.3 * p.medidas.alto && bajo > -0.02 && quieto < 1e-6 && muertes === 1 && p.estado() === 'muerte';
      p.parar(); p.revivir(); sim(p, 1.2); p.grupo.updateMatrixWorld(true);
      var cad2 = p.zocalo('pelvis').getWorldPosition(new V3()).y;
      ok = ok && revividos === 1 && Math.abs(cad2 - p.medidas.pelvis) < 0.05 * p.medidas.alto && p.estado() === 'quieto';
      sim(p, 1, function (t, p) { p.mover(0, 1, 1, false); }); ok = ok && p.estado() === 'caminar';
      return [ok, 'cadera a ' + cad.toFixed(2) + ' m y cabeza a ' + cab.toFixed(2) + ' m del suelo al caer, se movió ' + cm(quieto) + ' muerto, al revivir cadera a ' + cad2.toFixed(2) + ' m, luego ' + p.estado()];
    });
    prueba('Transiciones suaves (sin saltos entre animaciones)', function () {
      var p = crear(), m = new Medidor(p), guion = [
        [1, 0, 0, 0], [1.5, 0, 1, 0], [1.5, 1, 1, 1], [0.6, -1, 0.3, 1], [1, 0, 0, 0], [0.8, 'atacar'], [0.4, 0, 1, 0], [0.6, 'atacar'], [0.6, 'golpe'], [0.8, 0, 0, 0], [2.2, 'morir'], [1.3, 'revivir'], [1.2, -1, -1, 1], [0.7, 0, 0, 0]];
      guion.forEach(function (g) {
        if (typeof g[1] === 'string') { if (g[1] === 'atacar') p.atacar(); else if (g[1] === 'golpe') p.recibirGolpe(-1); else if (g[1] === 'morir') p.morir(); else p.revivir(); sim(p, g[0], null, m); }
        else sim(p, g[0], function () { p.mover(g[1], g[2], (g[1] || g[2]) ? 1 : 0, !!g[3]); }, m);
      });
      return [m.saltoRot < 0.45 && m.saltoPos < 0.06 * escala + 0.075 && !m.nan, 'mayor giro de un hueso entre fotogramas ' + (m.saltoRot * 57.3).toFixed(1) + '°, mayor salto de cadera ' + cm(m.saltoPos) + ' (incluye el avance al correr), sin valores inválidos'];
    });
    prueba('Equipo: arma en la mano sigue a la mano', function () {
      var p = crear(), arma = new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.8)); arma.position.z = 0.4;
      var ok = p.equipar('manoD', arma) && !p.equipar('nada', arma), dist = [];
      sim(p, 0.2); p.atacar();
      for (var i = 0; i < 30; i++) { p.actualizar(DT); p.grupo.updateMatrixWorld(true); dist.push(arma.getWorldPosition(new V3()).distanceTo(p.zocalo('mano.R').getWorldPosition(new V3()))); }
      var var1 = Math.max.apply(null, dist) - Math.min.apply(null, dist);
      var h = arma.parent; ok = ok && var1 < 1e-4 && p.quitar('manoD') && !p.quitar('manoD') && !h.parent;
      return [ok, 'distancia arma-mano constante (variación ' + cm(var1) + '), equipar y quitar funcionan'];
    });
    prueba('Rendimiento: 100 personajes', function () {
      var lista = [], n = 100, t0, ms; for (var i = 0; i < n; i++) { var p = crear(); p.pos.set((i % 10) * 2, 0, Math.floor(i / 10) * 2); lista.push(p); }
      var esc = new T.Scene(); lista.forEach(function (p) { esc.add(p.grupo); });
      var now = (G.performance && G.performance.now) ? function () { return G.performance.now(); } : Date.now;
      for (var w = 0; w < 30; w++) lista.forEach(function (p, i) { p.mover(Math.sin(i), Math.cos(i), 1, i % 3 === 0); p.actualizar(DT); });
      t0 = now(); for (var f = 0; f < 120; f++) { lista.forEach(function (p, i) { p.mover(Math.sin(i + f * 0.02), Math.cos(i + f * 0.02), 1, i % 3 === 0); p.actualizar(DT); }); esc.updateMatrixWorld(true); }
      ms = (now() - t0) / 120;
      return [ms < (op.limiteMs || 8), ms.toFixed(2) + ' ms por fotograma para 100 personajes (' + (ms * 10).toFixed(1) + ' µs cada uno)'];
    });
    return R;
  }
  E.pruebas = pruebas; E.Medidor = Medidor;
})(typeof window !== 'undefined' ? window : globalThis);
