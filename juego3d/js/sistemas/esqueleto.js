/* =====================================================================
   TINY KINGDOM · SISTEMA DE ESQUELETO HUMANOIDE Y ANIMACIÓN (v1)
   ---------------------------------------------------------------------
   Archivo independiente: NO lo usa todavía el juego (index.html no lo carga).
   Se prueba en esqueleto.html. Necesita THREE (r149) ya cargado.

   QUÉ HAY AQUÍ
   · Un esqueleto humanoide real (THREE.Bone) de 22 huesos:
       raiz → pelvis → columna → pecho → cuello → cabeza
       pecho → clavicula.L/R → brazo (hombro) → antebrazo (codo) → mano (muñeca)
       pelvis → muslo.L/R (cadera) → pierna (rodilla) → pie (tobillo) → dedos
   · Un animador procedimental que calcula la pose cada fotograma:
       quieto (respira, mira, cambia el peso), caminar, correr, girar en el sitio,
       ataque, recibir golpe, muerte y revivir, con mezclas suaves entre todos.
   · Pies sin deslizar: cada pie apoyado queda CLAVADO en el suelo (posición del mundo)
     y las piernas se resuelven con IK de dos huesos (cadera-rodilla-tobillo).
     El paso avanza por distancia recorrida, no por tiempo, y el talón y la punta ruedan.
   · Reutilización: el mismo animador mueve cualquier modelo con huesos tipo Mixamo
     (los de Tripo: trasgo, ogro, aldeanos…) o los de los héroes (cadera, columna, pecho…),
     midiendo sus proporciones y corrigiendo su pose de reposo (T o A).
   · Zócalos de equipo (manos, cabeza, pecho, espalda) para armas, escudos, cascos y armaduras,
     y vestir() para ropa con huesos hecha sobre el mismo esqueleto.

   USO RÁPIDO
     var p = new TKEsqueleto.Personaje({ alto: 1.8 });            // personaje de prueba
     var p = new TKEsqueleto.Personaje({ modelo: gltf.scene });     // un modelo con huesos
     escena.add(p.grupo);
     cada fotograma:  p.mover(dirX, dirZ, intensidad0a1, correr); p.actualizar(dt);
     acciones:        p.atacar(); p.recibirGolpe(lado); p.morir(); p.revivir(); p.girar(rad);
     equipo:          p.equipar('manoD', espada); p.quitar('manoD');
     eventos:         p.on('impacto'|'paso'|'muerte'|'revivido'|'estado', fn)
   ===================================================================== */
(function (G) {
  'use strict';
  var T = G.THREE;
  if (!T) { if (G.console) console.warn('TKEsqueleto: falta THREE'); return; }
  var PI = Math.PI, V3 = T.Vector3, Q = T.Quaternion;

  // ---------- utilidades ----------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function suave(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function ease(u) { return 0.5 - 0.5 * Math.cos(PI * clamp(u, 0, 1)); }
  function envolver(a) { a = (a + PI) % (2 * PI); if (a < 0) a += 2 * PI; return a - PI; }
  function lerpAng(a, b, t) { return a + envolver(b - a) * t; }
  function frac(x) { return x - Math.floor(x); }
  var _e = new T.Euler(), _m4 = new T.Matrix4(), _vx = new V3(), _vy = new V3(), _vz = new V3();
  function qE(out, x, y, z) { _e.set(x, y, z, 'ZXY'); return out.setFromEuler(_e); }
  // gira (x,z) por yaw alrededor de Y (igual que rotation.y de three)
  function rotY(out, x, y, z, yaw) { var c = Math.cos(yaw), s = Math.sin(yaw); return out.set(x * c + z * s, y, -x * s + z * c); }

  // ---------- definición del esqueleto ----------
  var LISTA = ['raiz', 'pelvis', 'columna', 'pecho', 'cuello', 'cabeza',
    'clavicula.L', 'brazo.L', 'antebrazo.L', 'mano.L',
    'clavicula.R', 'brazo.R', 'antebrazo.R', 'mano.R',
    'muslo.L', 'pierna.L', 'pie.L', 'dedos.L',
    'muslo.R', 'pierna.R', 'pie.R', 'dedos.R'];
  var PADRE = { pelvis: 'raiz', columna: 'pelvis', pecho: 'columna', cuello: 'pecho', cabeza: 'cuello' };
  ['L', 'R'].forEach(function (s) {
    PADRE['clavicula.' + s] = 'pecho'; PADRE['brazo.' + s] = 'clavicula.' + s; PADRE['antebrazo.' + s] = 'brazo.' + s; PADRE['mano.' + s] = 'antebrazo.' + s;
    PADRE['muslo.' + s] = 'pelvis'; PADRE['pierna.' + s] = 'muslo.' + s; PADRE['pie.' + s] = 'pierna.' + s; PADRE['dedos.' + s] = 'pie.' + s;
  });
  // cada articulación vive en el origen del hueso que nombra
  var ARTICULACIONES = { cadera: 'muslo', rodilla: 'pierna', tobillo: 'pie', hombro: 'brazo', codo: 'antebrazo', muneca: 'mano', cuello: 'cuello', cabeza: 'cabeza' };

  // proporciones para un humano de 1,80 (todo se escala con el alto)
  function medidasBase(alto) {
    var k = (alto || 1.8) / 1.8, m = {
      pelvis: 0.95, columna: 0.10, pecho: 0.20, cuello: 0.23, cabeza: 0.10, coronilla: 0.22,
      clavX: 0.03, clavY: 0.18, hombro: 0.15, brazo: 0.29, antebrazo: 0.26, mano: 0.18,
      caderaX: 0.095, caderaY: -0.05, muslo: 0.42, pierna: 0.41, dedosY: -0.05, dedosZ: 0.13, talon: 0.06
    };
    for (var n in m) m[n] *= k;
    m.alto = 1.8 * k; completar(m); return m;
  }
  function completar(m) { m.tobillo = m.pelvis + m.caderaY - m.muslo - m.pierna; m.escala = (m.muslo + m.pierna) / 0.83; return m; }
  // posición de cada hueso respecto a su padre (en reposo todos los giros son cero: brazos colgando, piernas rectas)
  function desplazamientos(m) {
    var o = { raiz: new V3(), pelvis: new V3(0, m.pelvis, 0), columna: new V3(0, m.columna, 0), pecho: new V3(0, m.pecho, 0), cuello: new V3(0, m.cuello, 0), cabeza: new V3(0, m.cabeza, 0) };
    [['L', 1], ['R', -1]].forEach(function (p) {
      var s = p[1], l = p[0];
      o['clavicula.' + l] = new V3(s * m.clavX, m.clavY, 0); o['brazo.' + l] = new V3(s * m.hombro, 0, 0);
      o['antebrazo.' + l] = new V3(0, -m.brazo, 0); o['mano.' + l] = new V3(0, -m.antebrazo, 0);
      var ld = m.lados && m.lados[l]; // medidas reales de cada lado (modelos que no son simétricos)
      o['muslo.' + l] = ld ? ld.cadera.clone() : new V3(s * m.caderaX, m.caderaY, 0); o['pierna.' + l] = new V3(0, -(ld ? ld.muslo : m.muslo), 0);
      o['pie.' + l] = new V3(0, -(ld ? ld.pierna : m.pierna), 0); o['dedos.' + l] = new V3(0, m.dedosY, m.dedosZ);
    });
    return o;
  }
  // posiciones absolutas en reposo
  function posicionesReposo(o) { var r = {}; LISTA.forEach(function (n) { r[n] = o[n].clone(); if (PADRE[n]) r[n].add(r[PADRE[n]]); }); return r; }

  function crearHuesos(m) {
    var o = desplazamientos(m), huesos = {}, lista = [];
    LISTA.forEach(function (n) { var b = new T.Bone(); b.name = n; b.position.copy(o[n]); huesos[n] = b; lista.push(b); if (PADRE[n]) huesos[PADRE[n]].add(b); });
    return { huesos: huesos, lista: lista, raiz: huesos.raiz };
  }

  // =====================================================================
  //  ANIMADOR: calcula la pose (giros locales de cada hueso) cada fotograma
  // =====================================================================
  var _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _q1 = new Q(), _q2 = new Q(), _q3 = new Q(), _qp = new Q();
  var SUAVE_IK = 0.975, ATAQUE_DUR = 0.75, GOLPE_DUR = 0.5, MUERTE_DUR = 1.7, REVIVIR_DUR = 0.9;

  function Animador(m) {
    this.m = m; this.off = desplazamientos(m); this.esc = m.escala;
    this.t = 0; this.fase = 0; this.g = 0; this.wLoco = 0; this.locoAntes = false; this.iniciado = false;
    this.pose = { raizPos: new V3(), raizQ: new Q(), pelvisPos: new V3(), q: {} };
    var self = this; LISTA.forEach(function (n) { self.pose.q[n] = new Q(); });
    this.A = {}; LISTA.forEach(function (n) { self.A[n] = new V3(); });
    this.D = {}; LISTA.forEach(function (n) { self.D[n] = new V3(); });
    this.pies = [this._nuevoPie(1, 0), this._nuevoPie(-1, 0.5)];
    this.ataque = -1; this.golpe = -1; this.ataqueFuera = -1; this.golpeFuera = -1; this.golpeLado = 0; this.muerte = -1; this.revive = -1; this.muerto = false;
    this.impactoDado = false; this.avisos = [];
    // puntos de giro del pie (respecto al tobillo): bola de los dedos y talón
    this.bola = new V3(0, m.dedosY, m.dedosZ); this.talon = new V3(0, -m.tobillo * 0.85, -m.talon);
  }
  Animador.prototype._nuevoPie = function (s, off) {
    return { s: s, off: off, apoyo: true, lock: new V3(), yaw: 0, p: 0, pLand: 0, tobillo: new V3(), yawAct: 0, rel: new V3(), relYaw: 0, fPrev: null, puede: true,
      vu: { modo: '', from: new V3(), pFrom: 0, yawFrom: 0, prog: 0, u0: 0, dur: 0.27, lift: 0, to: new V3(), yawTo: 0, pTo: 0 } };
  };
  Animador.prototype._neutral = function (out, pie, pos, yaw) { var c = this.off[pie.s > 0 ? 'muslo.L' : 'muslo.R']; return rotY(out, c.x * 0.92, this.m.tobillo, c.z, yaw).add(pos); };
  Animador.prototype.pisarNeutral = function (pos, yaw) {
    var self = this; this.pies.forEach(function (pie) { self._neutral(pie.lock, pie, pos, yaw); pie.yaw = pie.yawAct = yaw; pie.p = 0; pie.apoyo = true; pie.tobillo.copy(pie.lock); });
  };
  // tobillo cuando el pie gira «p» alrededor de la bola (p>0, talón arriba) o del talón (p<0, punta arriba)
  Animador.prototype._tobilloGirado = function (out, lock, yaw, p) {
    if (Math.abs(p) < 1e-5) return out.copy(lock);
    var pv = p > 0 ? this.bola : this.talon, c = Math.cos(p), s = Math.sin(p);
    var y = -pv.y, z = -pv.z, y2 = y * c - z * s, z2 = y * s + z * c;   // Rx(p) * (-pivote)
    rotY(_d, 0, pv.y + y2, pv.z + z2, yaw);
    return out.copy(lock).add(_d);
  };
  Animador.prototype._despegar = function (pie, modo, lift) {
    var vu = pie.vu; pie.apoyo = false; vu.modo = modo; vu.from.copy(pie.tobillo); vu.pFrom = pie.p; vu.yawFrom = pie.yawAct; vu.prog = 0; vu.u0 = 0; vu.dur = 0.27; vu.lift = lift; vu.nuevo = true; vu.dYaw = 0; vu.yLift = pie.yUlt === undefined ? 1e9 : pie.yUlt;
  };
  Animador.prototype._aterrizar = function (pie, loco, f) {
    var vu = pie.vu; pie.apoyo = true; pie.lock.copy(vu.to); pie.yaw = pie.yawAct = vu.yawTo; pie.p = pie.pLand = vu.pTo;
    this._tobilloGirado(pie.tobillo, pie.lock, pie.yaw, pie.p);
    pie.puede = !(loco && f >= this.st); // si aterriza en plena zona de vuelo, espera a la siguiente zancada
    this.avisos.push(['paso', pie.s > 0 ? 'L' : 'R']);
  };

  // e = { pos, yaw, v (rapidez), yawRate, yawObj }
  Animador.prototype.actualizar = function (dt, e) {
    var m = this.m, o = this.off, esc = this.esc, self = this;
    this.t += dt; this.avisos.length = 0;
    var pos = e.pos, yaw = e.yaw, v = this.muerto ? 0 : e.v, yawRate = e.yawRate || 0;
    if (!this.iniciado) { this.pisarNeutral(pos, yaw); this.iniciado = true; }
    var gObj = suave(1.9, 3.6, v / esc);
    this.g += (gObj - this.g) * Math.min(1, dt * 5); var g = this.g;
    var loco = v > 0.08 * esc && !this.muerto;
    this.wLoco += ((loco ? 1 : 0) - this.wLoco) * Math.min(1, dt * 6); var wl = this.wLoco;
    // zancada (distancia de un ciclo), parte del ciclo con el pie apoyado y qué parte del apoyo queda por delante de la cadera
    var vn = v / esc, S = esc * lerp(0.55 + 0.62 * vn, 1.0 + 0.36 * vn, g), st = lerp(0.6, 0.3, g), adel = 0.355; this.S = S; this.st = st;

    // ---------- 1) PIES ----------
    if (loco && !this.locoAntes) {
      // empieza a andar: levanta primero el pie que va en el aire o el que queda más atrás
      var pl = this.pies[0], pr = this.pies[1], primero;
      if (!pl.apoyo) primero = pl; else if (!pr.apoyo) primero = pr; else {
        rotY(_a, pl.lock.x - pos.x, 0, pl.lock.z - pos.z, -yaw); rotY(_b, pr.lock.x - pos.x, 0, pr.lock.z - pos.z, -yaw);
        primero = _a.z <= _b.z ? pl : pr;
      }
      this.fase = (primero.apoyo ? st - 0.02 : st + 0.01) - primero.off;
      this.pies.forEach(function (p) { p.fPrev = null; p.puede = true; });
      if (!primero.apoyo) primero.puede = false;
    }
    if (loco) this.fase += v * dt / S;
    var velX = Math.sin(yaw) * v, velZ = Math.cos(yaw) * v;
    for (var i = 0; i < 2; i++) {
      var pie = this.pies[i], vu = pie.vu, f = loco ? frac(this.fase + pie.off) : 0;
      if (loco && f < st) pie.puede = true;
      if (pie.apoyo) {
        if (loco && f >= st && pie.puede) { this._despegar(pie, 'fase', lerp(0.09, 0.2, g) * esc); vu.u0 = clamp((f - st) / (1 - st), 0, 0.6); }
        else {
          if (loco) { // rueda del pie durante el apoyo: talón → plano → punta
            var sg = f / st, hl = lerp(0.6, 0.42, g), pEnd = lerp(0.5, 0.75, g);
            var pObj = sg < 0.12 ? pie.pLand * (1 - sg / 0.12) : (sg > hl && f < st ? pEnd * Math.pow((sg - hl) / (1 - hl), 2) : (sg >= 1 ? pie.p : 0));
            pie.p += clamp(pObj - pie.p, -9 * dt, 9 * dt); // el talón nunca salta de golpe
          } else pie.p *= Math.exp(-dt * 9);
          this._tobilloGirado(pie.tobillo, pie.lock, pie.yaw, pie.p); pie.yawAct = pie.yaw;
        }
      }
      if (!pie.apoyo) {
        var prog, tRem, aterriza = false;
        if (vu.modo === 'fase' && !loco) { // se paró en mitad del paso: termina el paso hacia la postura de reposo
          var prev = vu.prog; vu.nuevo = true; vu.dYaw = 0; vu.from.copy(pie.tobillo); vu.pFrom = pie.p; vu.yawFrom = pie.yawAct; vu.modo = 'tiempo'; vu.prog = 0; vu.dur = Math.max(0.12, 0.3 * (1 - prev)); vu.lift *= 0.5 * (1 - prev);
        }
        if (vu.modo === 'fase') {
          if (f < st) aterriza = true; else { var u = (f - st) / (1 - st); prog = (u - vu.u0) / (1 - vu.u0); tRem = (1 - f) * S / Math.max(v, 0.01); }
        } else { vu.prog += dt / vu.dur; prog = vu.prog; tRem = Math.max(0, 1 - prog) * vu.dur; if (prog >= 1) aterriza = true; }
        if (aterriza) this._aterrizar(pie, loco, f);
        else {
          vu.prog = prog; vu.tRem = loco ? tRem : 0;
          var yp;
          if (loco) {
            yp = yaw + clamp(yawRate * tRem, -0.7, 0.7);
            var cz = o[pie.s > 0 ? 'muslo.L' : 'muslo.R']; rotY(_c, cz.x * 0.92, m.tobillo, cz.z + st * S * adel, yp).add(pos); _c.x += velX * tRem; _c.z += velZ * tRem; vu.pTo = -0.15 * (1 - g);
          } else { this._neutral(_c, pie, pos, yaw); yp = yaw; vu.pTo = 0; }
          // el punto de aterrizaje se corrige poco a poco (sin tirones si cambia la dirección)
          var kt = vu.nuevo ? 1 : Math.min(1, dt * 14 + prog * prog); vu.nuevo = false;
          vu.to.lerp(_c, kt); vu.dYaw += envolver(yp - (vu.yawFrom + vu.dYaw)) * kt; vu.yawTo = vu.yawFrom + vu.dYaw; // giro del pie sin saltos de vuelta
          this._tobilloGirado(_a, vu.to, vu.yawTo, vu.pTo);
          var k = ease(prog);
          pie.tobillo.copy(vu.from).lerp(_a, k); pie.tobillo.y += vu.lift * (1 - Math.cos(2 * PI * clamp(prog, 0, 1))) * 0.5; // sube y baja sin golpes
          pie.p = lerp(vu.pFrom, vu.pTo, k) - (loco ? 0.3 : 0.12) * Math.sin(PI * clamp(prog, 0, 1));
          pie.yawAct = vu.yawFrom + vu.dYaw * k;
        }
      }
      pie.fPrev = f;
    }
    // pasos de ajuste estando quieto (también es lo que hace al girar en el sitio)
    if (!loco && !this.muerto && this.pies[0].apoyo && this.pies[1].apoyo) {
      var peor = null, err = 1;
      this.pies.forEach(function (p) {
        self._neutral(_a, p, pos, yaw);
        var er = Math.hypot(p.lock.x - _a.x, p.lock.z - _a.z) / (0.07 * esc) + Math.abs(envolver(p.yaw - yaw)) / 0.4;
        if (er > err) { err = er; peor = p; }
      });
      if (peor) this._despegar(peor, 'tiempo', 0.06 * esc);
    }
    this.locoAntes = loco;
    // pies en el espacio del personaje
    this.pies.forEach(function (p) { rotY(p.rel, p.tobillo.x - pos.x, p.tobillo.y - pos.y, p.tobillo.z - pos.z, -yaw); p.relYaw = envolver(p.yawAct - yaw); });

    // ---------- 2) ÁNGULOS DEL CUERPO ----------
    var A = this.A; LISTA.forEach(function (n) { A[n].set(0, 0, 0); });
    var t = this.t, PL = this.pies[0], PR = this.pies[1];
    var med = Math.max(0.05, st * S * 0.5), nzL = clamp(PL.rel.z / med, -1.2, 1.2), nzR = clamp(PR.rel.z / med, -1.2, 1.2);
    var giro = clamp(envolver((e.yawObj === undefined ? yaw : e.yawObj) - yaw), -0.9, 0.9);
    var lean = lerp(0.04, 0.17, g) * wl, respira = Math.sin(t * 2 * PI / 3.6), inclinaGiro = clamp(-yawRate * v * 0.045 / esc, -0.22, 0.22);
    var twist = clamp(-0.25 * (PL.rel.z - PR.rel.z) / esc, -0.18, 0.18) * wl;
    A.pelvis.set(0.05 * g * wl, twist, 0);
    A.columna.set(lean * 0.6 + 0.01 * respira, -twist * 0.5 + giro * 0.1, inclinaGiro * 0.6);
    A.pecho.set(lean * 0.4 + 0.02 * respira, -twist * 1.1 + giro * 0.2, inclinaGiro * 0.4);
    var mira = (1 - wl) * 0.16 * Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1);
    A.cuello.set(-lean * 0.3, giro * 0.2 + mira * 0.4, 0);
    A.cabeza.set(-lean * 0.5 - 0.01 * respira, giro * 0.25 + mira * 0.6, -inclinaGiro * 0.5);
    var amp = lerp(0.32, 0.85, g) * wl;
    [[PL, 'L', 1, nzR], [PR, 'R', -1, nzL]].forEach(function (x) {
      var l = x[1], s = x[2], nz = x[3], idle = 1 - wl;
      var px = -amp * nz - 0.25 * g * wl + idle * 0.03 * Math.sin(t * 1.1 + s);
      A['brazo.' + l].set(px, 0, s * (0.09 + 0.08 * g * wl));
      A['antebrazo.' + l].set(-lerp(0.18, 1.45, g) * wl - 0.14 * idle - 0.3 * Math.max(0, -px) * wl, 0, 0);
      A['mano.' + l].set(-0.1, 0, 0);
      A['clavicula.' + l].set(0, 0, s * 0.04 * respira * idle);
    });
    var pelvis = this.pose.pelvisPos, sway = wl * 0.022 * esc * (1 - g) * Math.cos(2 * PI * (this.fase - st * 0.5)) + (1 - wl) * 0.012 * esc * Math.sin(t * 0.9);
    var bob = lerp(0.012, 0.03, g) * esc * Math.cos(4 * PI * (this.fase - st * 0.5)) * lerp(1, -1, g) * wl;
    pelvis.set(sway - inclinaGiro * 0.08 * esc, o.pelvis.y - 0.012 * esc - lerp(0, 0.045, g) * esc * wl + bob - 0.004 * esc * respira, 0);

    // ---------- 3) ACCIONES (se suman encima) ----------
    if (this.ataque >= 0) {
      var wA = 1; if (this.ataqueFuera >= 0) { this.ataqueFuera -= dt; wA = Math.max(0, this.ataqueFuera / 0.15); } else this.ataque += dt;
      var a = this.ataque / ATAQUE_DUR;
      if (a >= 1 || (this.ataqueFuera >= 0 && wA <= 0)) { this.ataque = -1; this.ataqueFuera = -1; } else {
        var wi = (a < 0.36 ? ease(a / 0.36) : a < 0.56 ? 1 - ease((a - 0.36) / 0.2) : 0) * wA;
        var sk = (a < 0.36 ? 0 : a < 0.56 ? ease((a - 0.36) / 0.2) : 1 - ease((a - 0.56) / 0.44)) * wA;
        if (!this.impactoDado && a >= 0.46 && this.ataqueFuera < 0) { this.impactoDado = true; this.avisos.push(['impacto']); }
        A['brazo.R'].x += -2.5 * wi - 0.7 * sk; A['brazo.R'].z += -0.55 * wi + 0.35 * sk; A['brazo.R'].y += -0.3 * sk;
        A['antebrazo.R'].x += -1.3 * wi - 0.15 * sk; A['mano.R'].x += -0.3 * wi + 0.4 * sk; A['clavicula.R'].z += -0.25 * wi;
        A.pecho.y += -0.45 * wi + 0.5 * sk; A.columna.y += -0.2 * wi + 0.25 * sk; A.columna.x += -0.08 * wi + 0.22 * sk;
        A['brazo.L'].x += -0.6 * wi + 0.3 * sk; A['brazo.L'].z += 0.3 * wi + 0.25 * sk; A['antebrazo.L'].x += -1.2 * wi - 0.6 * sk;
        A.cabeza.y += 0.25 * wi - 0.3 * sk; A.cabeza.x += -0.1 * sk;
        var quieto = 1 - wl; pelvis.z += 0.10 * esc * sk * quieto; pelvis.y -= (0.06 * sk + 0.03 * wi) * esc * quieto; A.pelvis.y += (0.15 * sk - 0.1 * wi) * quieto;
      }
    }
    if (this.golpe >= 0) {
      var wH = 1; if (this.golpeFuera >= 0) { this.golpeFuera -= dt; wH = Math.max(0, this.golpeFuera / 0.15); } else this.golpe += dt;
      var h = this.golpe / GOLPE_DUR;
      if (h >= 1 || (this.golpeFuera >= 0 && wH <= 0)) { this.golpe = -1; this.golpeFuera = -1; } else {
        var en = (h < 0.12 ? ease(h / 0.12) : 1 - ease((h - 0.12) / 0.88)) * wH, ld = this.golpeLado;
        A.columna.x += -0.3 * en; A.pecho.x += -0.25 * en; A.cabeza.x += -0.45 * en; A.cuello.x += -0.1 * en; A.columna.z += 0.2 * ld * en; A.cabeza.z += 0.15 * ld * en;
        ['L', 'R'].forEach(function (l, j) { var s = j ? -1 : 1; A['brazo.' + l].x += 0.35 * en; A['brazo.' + l].z += s * 0.5 * en; A['antebrazo.' + l].x += -0.6 * en; });
        pelvis.z -= 0.08 * esc * en; pelvis.y -= 0.04 * esc * en; pelvis.x -= 0.03 * esc * ld * en;
      }
    }

    // ---------- 4) PELVIS: la altura se limita para que los pies lleguen siempre ----------
    qE(_qp, A.pelvis.x, A.pelvis.y, A.pelvis.z);
    var LmaxL = -(o['pierna.L'].y + o['pie.L'].y) * SUAVE_IK, LmaxR = -(o['pierna.R'].y + o['pie.R'].y) * SUAVE_IK;
    var yPel = pelvis.y, yDuro = 1e9;
    this.pies.forEach(function (p) {
      _b.copy(o[p.s > 0 ? 'muslo.L' : 'muslo.R']).applyQuaternion(_qp);
      var r = p.rel, vu = p.vu, ymax, w = 1, Lmax = p.s > 0 ? LmaxL : LmaxR;
      if (!p.apoyo && vu.prog > 0.5) { self._tobilloGirado(_c, vu.to, vu.yawTo, vu.pTo); var tr = vu.tRem || 0; r = rotY(_d, _c.x - pos.x - velX * tr, _c.y - pos.y, _c.z - pos.z - velZ * tr, -yaw); } // respecto a donde estará el cuerpo al aterrizar
      var dx = pelvis.x + _b.x - r.x, dz = pelvis.z + _b.z - r.z;
      ymax = r.y - _b.y + Math.sqrt(Math.max(Lmax * Lmax - dx * dx - dz * dz, 0));
      if (p.apoyo) { p.yUlt = ymax; if (ymax < yDuro) yDuro = ymax; }
      // el pie apoyado manda del todo; el que va por el aire: al despegar, lo que pedía en su último apoyo; al llegar, su punto de aterrizaje
      else if (vu.prog <= 0.5) { ymax = vu.modo === 'fase' ? vu.yLift : 1e9; w = 1 - suave(0.04, 0.25, vu.prog); }
      else w = suave(0.6, 0.95, vu.prog);
      if (ymax < yPel) pelvis.y = Math.min(pelvis.y, lerp(yPel, ymax, w));
    });
    // lo que piden los pies en el aire se sigue con suavidad; lo que piden los apoyados, siempre exacto
    if (this.pelY === undefined || dt === 0) this.pelY = pelvis.y; else this.pelY += (pelvis.y - this.pelY) * Math.min(1, dt * 16);
    pelvis.y = this.pelY = Math.min(this.pelY, yDuro);

    // ---------- 5) MUERTE ----------
    var wD = 0, D = this.D;
    if (this.muerte >= 0) {
      this.muerte += dt; var td = this.muerte;
      if (this.revive >= 0) { this.revive += dt; wD = 1 - ease(this.revive / REVIVIR_DUR); td = 99; if (this.revive >= REVIVIR_DUR) { this.muerte = -1; this.revive = -1; this.muerto = false; wD = 0; this.pisarNeutral(pos, yaw); this.avisos.push(['revivido']); } }
      else wD = ease(td / 0.35);
      if (this.muerte >= 0) {
        if (!this.caidoDado && td >= 1.35 && this.revive < 0) { this.caidoDado = true; this.avisos.push(['muerte']); }
        var b2 = ease((td - 0.12) / 0.5), fl = clamp((td - 0.55) / 0.65, 0, 1), fe = fl * fl, rb = fl >= 1 ? 0.04 * Math.exp(-(td - 1.2) * 6) * Math.sin((td - 1.2) * 18) : 0;
        LISTA.forEach(function (n) { D[n].set(0, 0, 0); });
        D.columna.set(lerp(lerp(-0.3, 0.35, b2), -0.05, fe), 0, 0); D.pecho.set(lerp(lerp(-0.2, 0.3, b2), -0.1, fe), 0, 0);
        D.cuello.set(lerp(0.1, -0.2, fe), 0, 0); D.cabeza.set(lerp(lerp(-0.5, 0.4, b2), -0.25, fe), 0.35 * fe, 0.3 * fe);
        [['L', 1], ['R', -1]].forEach(function (x) {
          var l = x[0], s = x[1];
          D['brazo.' + l].set(lerp(lerp(0.3, -0.3, b2), -0.45, fe), 0, s * lerp(lerp(0.4, 0.2, b2), 1.2, fe));
          D['antebrazo.' + l].set(lerp(-0.5, -0.25, fe), 0, 0);
          D['muslo.' + l].set(lerp(lerp(0, -0.9, b2), -0.2, fe), 0, s * 0.12 * fe);
          D['pierna.' + l].set(lerp(lerp(0, 1.5, b2), 0.35, fe), 0, 0);
          D['pie.' + l].set(lerp(lerp(0, -0.4, b2), 0.5, fe), 0, 0);
        });
        this.muertePelvisY = lerp(o.pelvis.y, o.pelvis.y * 0.62, b2);
        this.muerteRaiz = -1.5 * fe - rb; this.muerteAlto = 0.13 * esc * fe;
      }
    }
    this.wD = wD;

    // ---------- 6) POSE FINAL ----------
    var q = this.pose.q;
    LISTA.forEach(function (n) {
      if (/^(muslo|pierna|pie|dedos)/.test(n) || n === 'raiz') return;
      var a1 = A[n], d1 = D[n];
      if (wD > 0) qE(q[n], lerp(a1.x, d1.x, wD), lerp(a1.y, d1.y, wD), lerp(a1.z, d1.z, wD)); else qE(q[n], a1.x, a1.y, a1.z);
    });
    q.pelvis.copy(_qp); if (wD > 0) { qE(_q1, 0, 0, 0); q.pelvis.slerp(_q1, wD); }
    // piernas por IK (con la pelvis antes de la muerte) y luego mezcla con la caída
    this.pies.forEach(function (p) { self._ikPierna(p, pelvis, _qp); });
    if (wD > 0) {
      ['muslo', 'pierna', 'pie', 'dedos'].forEach(function (b) { ['L', 'R'].forEach(function (l) { var n = b + '.' + l; qE(_q1, D[n].x, D[n].y, D[n].z); q[n].slerp(_q1, wD); }); });
      pelvis.y = lerp(pelvis.y, this.muertePelvisY, wD); pelvis.x *= 1 - wD; pelvis.z *= 1 - wD;
      qE(this.pose.raizQ, this.muerteRaiz * wD, 0, 0); this.pose.raizPos.set(0, this.muerteAlto * wD, 0);
    } else { this.pose.raizQ.set(0, 0, 0, 1); this.pose.raizPos.set(0, 0, 0); }
    return this.pose;
  };

  // IK de dos huesos: cadera → rodilla → tobillo, con la rodilla hacia donde mira el pie
  var _H = new V3(), _T = new V3(), _dir = new V3(), _pole = new V3(), _n = new V3(), _td = new V3(), _sd = new V3(), _kn = new V3(), _qt = new Q(), _qs = new Q(), _qf = new Q(), _qinv = new Q();
  function baseQ(out, abajo, adelante) { // eje -Y del hueso = «abajo», +Z ≈ «adelante»
    _vy.copy(abajo).negate().normalize();
    _vz.copy(adelante).addScaledVector(_vy, -adelante.dot(_vy)); if (_vz.lengthSq() < 1e-8) _vz.set(0, 0, 1); _vz.normalize();
    _vx.crossVectors(_vy, _vz); _m4.makeBasis(_vx, _vy, _vz); return out.setFromRotationMatrix(_m4);
  }
  Animador.prototype._ikPierna = function (p, pelvis, qp) {
    var m = this.m, l = p.s > 0 ? 'L' : 'R', q = this.pose.q, a = this.off['pierna.' + l].y * -1, b = this.off['pie.' + l].y * -1;
    _H.copy(this.off['muslo.' + l]).applyQuaternion(qp).add(pelvis);
    _T.copy(p.rel); _dir.subVectors(_T, _H); var L = a + b, ds = L * SUAVE_IK, d = Math.max(_dir.length(), Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(0.6))); _dir.normalize(); // la rodilla nunca se dobla más de ~145° (espinillas cortas como la del trasgo)
    if (d > ds) d = ds + (L * 0.999 - ds) * (1 - Math.exp(-(d - ds) / (L * 0.999 - ds))); // IK suave: la rodilla no da tirones al estirarse
    var yr = clamp(p.relYaw, -1.0, 1.0); _pole.set(Math.sin(yr) + p.s * 0.08, 0, Math.cos(yr)); // la rodilla nunca apunta hacia atrás
    _n.copy(_pole).addScaledVector(_dir, -_pole.dot(_dir)); if (_n.lengthSq() < 1e-8) _n.set(0, 0, 1); _n.normalize();
    var ca = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), al = Math.acos(ca);
    _td.copy(_dir).multiplyScalar(Math.cos(al)).addScaledVector(_n, Math.sin(al));
    _kn.copy(_H).addScaledVector(_td, a); _sd.copy(_H).addScaledVector(_dir, d).sub(_kn).normalize();
    baseQ(_qt, _td, _n);
    // la rodilla es una bisagra: la espinilla solo gira sobre el eje X del muslo (no puede voltearse)
    var flex = PI - Math.acos(clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1)); qE(_q3, flex, 0, 0); _qs.copy(_qt).multiply(_q3);
    q['muslo.' + l].copy(_qinv.copy(qp).invert()).multiply(_qt);
    q['pierna.' + l].copy(_qinv.copy(_qt).invert()).multiply(_qs);
    // el pie gira con el orden: yaw del personaje y luego el cabeceo
    _e.set(p.p, p.relYaw, 0, 'YXZ'); _qf.setFromEuler(_e);
    q['pie.' + l].copy(_qinv.copy(_qs).invert()).multiply(_qf);
    qE(q['dedos.' + l], -Math.max(p.p, 0), 0, 0);
  };
    // cortar una acción la apaga en 0,15 s (nunca de golpe)
  Animador.prototype._cortar = function (cual) { if (this[cual] >= 0 && this[cual + 'Fuera'] < 0) this[cual + 'Fuera'] = 0.15; };
  Animador.prototype.atacar = function () { if (this.muerto || this.ataque >= 0) return false; this.ataque = 0; this.ataqueFuera = -1; this.impactoDado = false; return true; };
  Animador.prototype.recibirGolpe = function (lado) { if (this.muerto) return false; this.golpe = 0; this.golpeFuera = -1; this.golpeLado = clamp(lado || 0, -1, 1); this._cortar('ataque'); return true; };
  Animador.prototype.morir = function () { if (this.muerto) return false; this.muerto = true; this.muerte = 0; this.revive = -1; this._cortar('ataque'); this._cortar('golpe'); this.caidoDado = false; return true; };
  Animador.prototype.revivir = function () { if (!this.muerto || this.revive >= 0) return false; if (this.muerte < MUERTE_DUR) this.muerte = MUERTE_DUR; this.revive = 0; return true; };

  // =====================================================================
  //  RETARGET: mueve los huesos de otro modelo (Mixamo/Tripo o héroes) con la misma pose
  // =====================================================================
  function normalizar(n) { return String(n || '').toLowerCase().replace(/^mixamorig[:_]?/, '').replace(/[\s_\-.:]/g, ''); } // GLTFLoader quita puntos y dos puntos
  var ALIAS = {
    pelvis: ['hips', 'cadera', 'pelvis', 'hip', 'root.x'], cuello: ['neck', 'cuello', 'neck01'], cabeza: ['head', 'cabeza'],
    'clavicula.L': ['leftshoulder', 'hombro.l', 'clavicle.l', 'lclavicle', 'clavicula.l', 'shoulder.l'],
    'brazo.L': ['leftarm', 'brazo.l', 'upperarm.l', 'leftupperarm', 'lupperarm'],
    'antebrazo.L': ['leftforearm', 'antebrazo.l', 'forearm.l', 'lowerarm.l', 'leftlowerarm'],
    'mano.L': ['lefthand', 'mano.l', 'hand.l', 'lhand'],
    'muslo.L': ['leftupleg', 'muslo.l', 'thigh.l', 'leftthigh', 'upperleg.l', 'leftupperleg'],
    'pierna.L': ['leftleg', 'pierna.l', 'shin.l', 'calf.l', 'leftshin', 'lowerleg.l', 'leftlowerleg'],
    'pie.L': ['leftfoot', 'pie.l', 'foot.l'], 'dedos.L': ['lefttoebase', 'dedos.l', 'toe.l', 'lefttoe', 'toes.l']
  };
  Object.keys(ALIAS).forEach(function (k) { if (/\.L$/.test(k)) ALIAS[k.replace('.L', '.R')] = ALIAS[k].map(function (a) { return /^left/.test(a) ? a.replace(/^left/, 'right') : /\.l$/.test(a) ? a.replace(/\.l$/, '.r') : a.replace(/^l/, 'r'); }); });
  Object.keys(ALIAS).forEach(function (k) { ALIAS[k] = ALIAS[k].map(normalizar); });
  var DIRS = { 'clavicula.L': 'brazo.L', 'brazo.L': 'antebrazo.L', 'antebrazo.L': 'mano.L', 'muslo.L': 'pierna.L', 'pierna.L': 'pie.L', 'pie.L': 'dedos.L' };
  Object.keys(DIRS).forEach(function (k) { DIRS[k.replace('.L', '.R')] = DIRS[k].replace('.L', '.R'); });

  function buscarHuesos(modelo) {
    var porNombre = {}, encontrados = {};
    modelo.traverse(function (o) { if (o.isBone) porNombre[normalizar(o.name)] = o; });
    Object.keys(ALIAS).forEach(function (c) { for (var i = 0; i < ALIAS[c].length; i++) if (porNombre[ALIAS[c][i]]) { encontrados[c] = porNombre[ALIAS[c][i]]; break; } });
    // columna y pecho por la cadena real entre la cadera y el cuello (los nombres cambian mucho entre programas)
    if (encontrados.pelvis && encontrados.cuello) {
      var cad = [], b = encontrados.cuello.parent;
      while (b && b !== encontrados.pelvis) { if (b.isBone) cad.unshift(b); b = b.parent; }
      if (b === encontrados.pelvis && cad.length) { encontrados.columna = cad[0]; if (cad.length > 1) encontrados.pecho = cad[cad.length - 1]; }
    }
    return encontrados;
  }
  function relEspacio(obj, invE, outPos, outQ, outS) { _m4.multiplyMatrices(invE, obj.matrixWorld); _m4.decompose(outPos, outQ, outS); }

  function Retarget(modelo, espacio) {
    this.ok = false; var map = buscarHuesos(modelo);
    var falta = ['pelvis', 'muslo.L', 'pierna.L', 'pie.L', 'muslo.R', 'pierna.R', 'pie.R'].filter(function (n) { return !map[n]; });
    if (falta.length) { this.error = 'Faltan huesos: ' + falta.join(', '); return; }
    this.modelo = modelo; this.espacio = espacio; this.map = map;
    this._medir(); this._orientar(); this._medir();
    this.medidas = this._medidas(); this.off = desplazamientos(this.medidas); this._preparar(); this.ok = true;
  }
  Retarget.prototype._medir = function () {
    var self = this; this.espacio.updateMatrixWorld(true);
    this.invE = new T.Matrix4().copy(this.espacio.matrixWorld).invert();
    this.rp = {}; this.rq = {}; this.rs = {};
    Object.keys(this.map).forEach(function (c) { var p = new V3(), q = new Q(), s = new V3(); relEspacio(self.map[c], self.invE, p, q, s); self.rp[c] = p; self.rq[c] = q; self.rs[c] = s; });
  };
  // si el modelo mira hacia -Z (como los héroes), se gira media vuelta
  Retarget.prototype._orientar = function () {
    var rp = this.rp, delante = rp['dedos.L'] ? rp['dedos.L'].z - rp['pie.L'].z : 0;
    if (!rp['dedos.L'] && rp['muslo.L']) delante = rp['muslo.L'].x > 0 ? 1 : -1; // sin dedos: la pierna izquierda debe estar en +X
    this.girado = delante < 0; if (this.girado) this.modelo.rotation.y += PI;
  };
  Retarget.prototype._medidas = function () {
    var rp = this.rp, b = medidasBase(1.8), m = {}, L = function (a, c) { return rp[a] && rp[c] ? rp[a].distanceTo(rp[c]) : null; };
    var muslo = ((L('muslo.L', 'pierna.L') || 0) + (L('muslo.R', 'pierna.R') || 0)) / 2, pierna = ((L('pierna.L', 'pie.L') || 0) + (L('pierna.R', 'pie.R') || 0)) / 2;
    var tob = (rp['pie.L'].y + rp['pie.R'].y) / 2, cad = (rp['muslo.L'].y + rp['muslo.R'].y) / 2 - rp.pelvis.y;
    var k = (muslo + pierna) / (b.muslo + b.pierna), alto = this.alto || (rp.cabeza ? rp.cabeza.y + b.coronilla * k : 1.8 * k);
    m.muslo = muslo; m.pierna = pierna; m.caderaY = cad; m.caderaX = Math.max(0.02 * k, (Math.abs(rp['muslo.L'].x - rp.pelvis.x) + Math.abs(rp['muslo.R'].x - rp.pelvis.x)) / 2);
    m.pelvis = tob + muslo + pierna - cad;
    m.lados = {}; ['L', 'R'].forEach(function (l) { var c = rp['muslo.' + l].clone().sub(rp.pelvis), a = L('muslo.' + l, 'pierna.' + l), b2 = L('pierna.' + l, 'pie.' + l);
      // la pierna queda recta y vertical: la cadera se ajusta para que el tobillo quede a la altura medida
      c.y = tob + a + b2 - m.pelvis; m.lados[l] = { cadera: c, muslo: a, pierna: b2 }; });
    // espalda y cabeza
    var col = rp.columna || null, pe = rp.pecho || col, cu = rp.cuello || null;
    m.columna = col ? col.y - rp.pelvis.y : b.columna * k; m.pecho = pe && col && pe !== col ? pe.y - col.y : b.pecho * k;
    m.cuello = cu && pe ? cu.y - pe.y : b.cuello * k; m.cabeza = rp.cabeza && cu ? rp.cabeza.y - cu.y : b.cabeza * k; m.coronilla = Math.max(0.05 * k, alto - (rp.cabeza ? rp.cabeza.y : m.pelvis + m.columna + m.pecho + m.cuello + m.cabeza));
    // brazos
    var cl = rp['clavicula.L'], br = rp['brazo.L'];
    m.clavX = cl && pe ? Math.abs(cl.x - pe.x) : b.clavX * k; m.clavY = cl && pe ? cl.y - pe.y : (br && pe ? br.y - pe.y : b.clavY * k);
    m.hombro = cl && br ? cl.distanceTo(br) : (br && pe ? Math.abs(br.x - pe.x) : b.hombro * k);
    m.brazo = L('brazo.L', 'antebrazo.L') || b.brazo * k; m.antebrazo = L('antebrazo.L', 'mano.L') || b.antebrazo * k; m.mano = m.antebrazo * 0.65;
    // pie: vector tobillo → dedos ya con la pierna recta
    if (rp['dedos.L']) { var vt = rp['dedos.L'].clone().sub(rp['pie.L']); m.dedosY = Math.min(-0.005, vt.y); m.dedosZ = Math.max(0.03 * k, Math.hypot(vt.z, vt.x)); }
    else { m.dedosY = b.dedosY * k; m.dedosZ = b.dedosZ * k; }
    m.talon = b.talon * k; m.alto = alto;
    for (var n in m) if (n !== 'lados' && !isFinite(m[n])) m[n] = b[n] * k;
    return completar(m);
  };
  Retarget.prototype._preparar = function () {
    var self = this, map = this.map, rp = this.rp, rq = this.rq, off = this.off;
    // C: corrección de la pose de reposo del modelo (T o A) a la del esqueleto (brazos colgando, piernas rectas)
    var C = { raiz: new Q() };
    LISTA.forEach(function (c) {
      if (c === 'raiz') return; var pc = C[PADRE[c]], d = DIRS[c];
      if (d && map[c] && map[d]) {
        var dt = rp[d].clone().sub(rp[c]).normalize().applyQuaternion(pc), dc = off[d].clone().normalize();
        C[c] = new Q().setFromUnitVectors(dt, dc).multiply(pc);
      } else C[c] = pc.clone();
    });
    this.C = C;
    // para cada hueso del modelo: su giro de reposo corregido y el de su padre
    this.items = [];
    LISTA.forEach(function (c) {
      var b = map[c]; if (!b) return;
      var anc = null, p = b.parent, qint = new Q(), cadena = [];
      while (p && p !== self.espacio) { var cn = null; for (var k in map) if (map[k] === p) cn = k; if (cn) { anc = cn; break; } cadena.unshift(p); p = p.parent; }
      cadena.forEach(function (n) { qint.multiply(n.quaternion); });
      var padreRep = new Q(), ps = new V3(), pp = new V3();
      if (b.parent) relEspacio(b.parent, self.invE, pp, padreRep, ps);
      var CW = C[c].clone().multiply(rq[c]);
      self.items.push({ c: c, b: b, anc: anc, qint: qint, padreRep: padreRep, CW: CW, w: new Q(), posRep: b.position.clone(), quatRep: b.quaternion.clone(),
        inv3: c === 'pelvis' ? new T.Matrix3().setFromMatrix4(new T.Matrix4().compose(pp, padreRep, ps)).invert() : null });
    });
    this.pelvisRep = rp.pelvis.clone();
    this.W = {}; LISTA.forEach(function (n) { self.W[n] = new Q(); });
  };
  var _w = new Q(), _pw = new Q();
  Retarget.prototype.aplicar = function (pose) {
    var W = this.W, q = pose.q, self = this, porC = {};
    W.raiz.set(0, 0, 0, 1);
    for (var i = 1; i < LISTA.length; i++) { var n = LISTA[i]; W[n].copy(W[PADRE[n]]).multiply(q[n]); }
    this.items.forEach(function (it) {
      _w.copy(W[it.c]).multiply(it.CW);                       // giro deseado del hueso (en el espacio del personaje)
      if (it.anc) _pw.copy(porC[it.anc].w).multiply(it.qint); else _pw.copy(it.padreRep);
      it.b.quaternion.copy(_pw.invert()).multiply(_w);
      it.w.copy(_w); porC[it.c] = it;
      if (it.inv3) { _a.copy(pose.pelvisPos).sub(self.pelvisRep).applyMatrix3(it.inv3); it.b.position.copy(it.posRep).add(_a); }
    });
  };
  Retarget.prototype.restaurar = function () { this.items.forEach(function (it) { it.b.position.copy(it.posRep); it.b.quaternion.copy(it.quatRep); }); };
  // grupo pegado al hueso con la orientación del esqueleto estándar (para armas y armaduras)
  Retarget.prototype.zocalo = function (c) {
    var b = this.map[c]; if (!b) return null; var it = null; this.items.forEach(function (x) { if (x.c === c) it = x; });
    var z = new T.Group(); z.name = 'zocalo:' + c; b.add(z);
    z.quaternion.copy(it.CW).invert(); var s = this.rs[c]; z.scale.set(1 / s.x, 1 / s.y, 1 / s.z);
    return z;
  };

  // =====================================================================
  //  PERSONAJE DE PRUEBA: malla con piel (SkinnedMesh) sobre el esqueleto
  // =====================================================================
  var COLORES = { piel: 0xe2b48c, camisa: 0x2f5fa8, pantalon: 0x4a3a2a, botas: 0x3a2618, cinturon: 0x2a1c10, pelo: 0x5a3820, ojos: 0x151515 };
  var cacheGeo = {};
  function geoPrueba(m, col) {
    var clave = m.alto.toFixed(3) + JSON.stringify(col); if (cacheGeo[clave]) return cacheGeo[clave];
    var o = desplazamientos(m), P = posicionesReposo(o), idx = {}; LISTA.forEach(function (n, i) { idx[n] = i; });
    var pos = [], nor = [], colr = [], si = [], sw = [], c = new T.Color(), up = new V3(0, 1, 0), q = new Q();
    function meter(geo, hueso, color, mezcla, a, bb) {
      var g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals();
      var Pp = g.attributes.position, Nn = g.attributes.normal, padre = PADRE[hueso], v = new V3(), seg = bb ? bb.clone().sub(a) : null, L2 = seg ? seg.lengthSq() : 1;
      c.setHex(color);
      for (var i = 0; i < Pp.count; i++) {
        v.fromBufferAttribute(Pp, i); pos.push(v.x, v.y, v.z); nor.push(Nn.getX(i), Nn.getY(i), Nn.getZ(i)); colr.push(c.r, c.g, c.b);
        var w = 0; if (mezcla && seg) { var t = v.clone().sub(a).dot(seg) / L2; w = t < 0.22 ? 0.5 * (1 - Math.max(0, t) / 0.22) : 0; }
        si.push(idx[hueso], idx[padre] || 0, 0, 0); sw.push(1 - w, w, 0, 0);
      }
    }
    function capsula(r, a, b, hueso, color, mezcla, seg) {
      var L = a.distanceTo(b), g = new T.CapsuleGeometry(r, Math.max(0.001, L), 3, seg || 8);
      q.setFromUnitVectors(up, b.clone().sub(a).normalize()); g.applyQuaternion(q); var mid = a.clone().add(b).multiplyScalar(0.5); g.translate(mid.x, mid.y, mid.z);
      meter(g, hueso, color, mezcla, a, b);
    }
    function caja(w, h, d, x, y, z, hueso, color, rx) { var g = new T.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); g.translate(x, y, z); meter(g, hueso, color, false); }
    function esfera(r, x, y, z, hueso, color, sx, sy, sz) { var g = new T.SphereGeometry(r, 12, 9); g.scale(sx || 1, sy || 1, sz || 1); g.translate(x, y, z); meter(g, hueso, color, false); }
    var k = m.escala;
    // tronco
    esfera(0.165 * k, 0, P.pelvis.y - 0.01 * k, 0, 'pelvis', col.pantalon, 1, 0.75, 0.8);
    caja(0.31 * k, 0.05 * k, 0.21 * k, 0, P.pelvis.y + 0.07 * k, 0, 'pelvis', col.cinturon);
    capsula(0.135 * k, P.columna.clone().setY(P.columna.y - 0.02 * k), P.pecho, 'columna', col.camisa, true, 10);
    esfera(0.19 * k, 0, P.pecho.y + 0.11 * k, 0.01 * k, 'pecho', col.camisa, 1, 0.85, 0.66);
    capsula(0.05 * k, P.cuello, P.cabeza, 'cuello', col.piel, true);
    esfera(0.112 * k, 0, P.cabeza.y + 0.1 * k, 0.01 * k, 'cabeza', col.piel, 0.92, 1.05, 1);
    esfera(0.118 * k, 0, P.cabeza.y + 0.14 * k, -0.012 * k, 'cabeza', col.pelo, 0.95, 0.75, 1);
    caja(0.022 * k, 0.03 * k, 0.02 * k, 0.04 * k, P.cabeza.y + 0.11 * k, 0.103 * k, 'cabeza', col.ojos);
    caja(0.022 * k, 0.03 * k, 0.02 * k, -0.04 * k, P.cabeza.y + 0.11 * k, 0.103 * k, 'cabeza', col.ojos);
    caja(0.03 * k, 0.04 * k, 0.04 * k, 0, P.cabeza.y + 0.075 * k, 0.115 * k, 'cabeza', col.piel);
    ['L', 'R'].forEach(function (l) {
      capsula(0.055 * k, P['clavicula.' + l], P['brazo.' + l], 'clavicula.' + l, col.camisa, false);
      capsula(0.052 * k, P['brazo.' + l], P['antebrazo.' + l], 'brazo.' + l, col.camisa, true);
      capsula(0.044 * k, P['antebrazo.' + l], P['mano.' + l], 'antebrazo.' + l, col.piel, true);
      var mn = P['mano.' + l]; caja(0.05 * k, m.mano * 0.75, 0.085 * k, mn.x, mn.y - m.mano * 0.4, mn.z, 'mano.' + l, col.piel);
      capsula(0.078 * k, P['muslo.' + l], P['pierna.' + l], 'muslo.' + l, col.pantalon, true, 10);
      capsula(0.058 * k, P['pierna.' + l], P['pie.' + l].clone().setY(P['pie.' + l].y + 0.04 * k), 'pierna.' + l, col.botas, true, 10);
      var pi = P['pie.' + l], de = P['dedos.' + l];
      caja(0.095 * k, m.tobillo * 0.95, (m.dedosZ + m.talon) * 0.98, pi.x, m.tobillo * 0.5, (m.dedosZ - m.talon) / 2, 'pie.' + l, col.botas);
      caja(0.09 * k, m.tobillo * 0.55, 0.07 * k, de.x, m.tobillo * 0.27, de.z + 0.03 * k, 'dedos.' + l, col.botas);
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(colr, 3));
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    geo.computeBoundingSphere(); cacheGeo[clave] = geo; return geo;
  }
  var matPrueba = null;
  function crearRigPrueba(m, colores) {
    var col = {}, k; for (k in COLORES) col[k] = COLORES[k]; if (colores) for (k in colores) col[k] = colores[k];
    var hu = crearHuesos(m), geo = geoPrueba(m, col);
    if (!matPrueba) matPrueba = new T.MeshLambertMaterial({ vertexColors: true });
    var malla = new T.SkinnedMesh(geo, matPrueba); malla.name = 'cuerpoPrueba'; malla.castShadow = true; malla.frustumCulled = false;
    malla.add(hu.raiz); malla.updateMatrixWorld(true); malla.bind(new T.Skeleton(hu.lista));
    return { malla: malla, huesos: hu.huesos, lista: hu.lista };
  }

  // =====================================================================
  //  PERSONAJE: movimiento 360°, orientación, acciones, equipo y eventos
  // =====================================================================
  var ZOCALOS = { manoD: 'mano.R', manoI: 'mano.L', cabeza: 'cabeza', pecho: 'pecho', espalda: 'pecho', cintura: 'pelvis' };
  function Personaje(op) {
    op = op || {};
    this.grupo = new T.Group(); this.grupo.name = op.nombre || 'personaje';
    this.pivote = new T.Group(); this.grupo.add(this.pivote);
    this.espacio = new T.Group(); this.pivote.add(this.espacio);
    this.pos = this.grupo.position; this.yaw = op.yaw || 0; this.yawObj = this.yaw; this.yawRate = 0; this.v = 0;
    this.entrada = { x: 0, z: 0, k: 0, correr: false }; this.eventos = {}; this.zocalos = {}; this.equipo = {}; this._estado = '';
    this.velCaminar = op.velCaminar || 1.6; this.velCorrer = op.velCorrer || 4.4;
    if (op.modelo) this._conModelo(op.modelo, op.alto || 1.8); else this._dePrueba(op);
    this.anim = new Animador(this.medidas);
    this.velCaminar *= this.medidas.escala; this.velCorrer *= this.medidas.escala;
    this.grupo.rotation.y = this.yaw;
    var blob = new T.Mesh(new T.CircleGeometry(0.32 * this.medidas.escala, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    blob.rotation.x = -PI / 2; blob.position.y = 0.01; blob.renderOrder = 1; this.grupo.add(blob); this.sombra = blob;
    this.actualizar(0);
  }
  Personaje.prototype._dePrueba = function (op) {
    this.medidas = op.medidas ? completar(op.medidas) : medidasBase(op.alto || 1.8); var r = crearRigPrueba(this.medidas, op.colores); // op.medidas: proporciones propias
    this.malla = r.malla; this.huesos = r.huesos; this.espacio.add(r.malla); this.tipo = 'prueba';
  };
  Personaje.prototype._conModelo = function (escena, alto) {
    // escala el modelo a su alto y lo apoya en el suelo (midiendo la malla con los huesos puestos)
    var base = new T.Group(); base.add(escena); this.espacio.add(base); this.modelo = escena; this.tipo = 'modelo';
    escena.traverse(function (o) { if (o.isSkinnedMesh) o.frustumCulled = false; if (o.isMesh) o.castShadow = true; });
    var caja = new T.Box3(), v = new V3();
    function medir() { caja.makeEmpty(); base.updateMatrixWorld(true); escena.traverse(function (o) { if (!o.isMesh) return; var P = o.geometry.attributes.position; for (var i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i); if (o.isSkinnedMesh) o.boneTransform(i, v); v.applyMatrix4(o.matrixWorld); caja.expandByPoint(v); } }); }
    medir(); var tam = caja.getSize(new V3()), cen = caja.getCenter(new V3());
    var k = alto / Math.max(tam.y, 1e-6); base.scale.setScalar(k); base.position.set(-cen.x * k, -caja.min.y * k, -cen.z * k);
    this.ret = new Retarget(escena, this.espacio);
    if (!this.ret.ok) throw new Error('TKEsqueleto: el modelo no tiene un esqueleto humanoide (' + this.ret.error + ')');
    if (this.ret.girado) { medir(); cen = caja.getCenter(new V3()); base.position.x -= cen.x; base.position.z -= cen.z; this.ret._medir(); this.ret.medidas = this.ret._medidas(); this.ret.off = desplazamientos(this.ret.medidas); this.ret._preparar(); }
    this.medidas = this.ret.medidas;
  };
  Personaje.prototype.on = function (ev, fn) { (this.eventos[ev] = this.eventos[ev] || []).push(fn); return this; };
  Personaje.prototype._emitir = function (ev, dato) { var l = this.eventos[ev]; if (l) for (var i = 0; i < l.length; i++) l[i].call(this, dato, this); };
  // dirección en el mundo (x,z), intensidad 0..1 (menos de 0,2 = solo girar en el sitio), correr sí/no
  Personaje.prototype.mover = function (x, z, k, correr) { var e = this.entrada; e.x = x || 0; e.z = z || 0; e.k = clamp(k === undefined ? Math.hypot(e.x, e.z) : k, 0, 1); e.correr = !!correr; return this; };
  Personaje.prototype.parar = function () { return this.mover(0, 0, 0, false); };
  Personaje.prototype.mirarHacia = function (yaw) { this.yawObj = yaw; this.entrada.k = 0; return this; };
  Personaje.prototype.girar = function (d) { this.yawObj = envolver(this.yawObj + d); this.entrada.k = 0; return this; };
  Personaje.prototype.atacar = function () { return this.anim.atacar(); };
  Personaje.prototype.recibirGolpe = function (lado) { return this.anim.recibirGolpe(lado); };
  Personaje.prototype.morir = function () { return this.anim.morir(); };
  Personaje.prototype.revivir = function () { return this.anim.revivir(); };
  Personaje.prototype.estaMuerto = function () { return this.anim.muerto; };
  Personaje.prototype.estado = function () {
    var a = this.anim; if (a.muerto) return a.revive >= 0 ? 'revivir' : 'muerte'; if (a.golpe >= 0) return 'golpe'; if (a.ataque >= 0) return 'ataque';
    if (this.v > 0.08 * this.medidas.escala) return a.g > 0.5 ? 'correr' : 'caminar';
    if (Math.abs(this.yawRate) > 0.35 || !a.pies[0].apoyo || !a.pies[1].apoyo) return 'girar';
    return 'quieto';
  };
  Personaje.prototype.actualizar = function (dt) {
    dt = clamp(dt || 0, 0, 0.1); var a = this.anim, e = this.entrada, esc = this.medidas.escala;
    var vt = 0;
    if (!a.muerto && e.k > 0.02 && (e.x || e.z)) { this.yawObj = Math.atan2(e.x, e.z); if (e.k >= 0.2) vt = (e.correr ? this.velCorrer : this.velCaminar) * clamp((e.k - 0.2) / 0.8 * 1.25, 0.25, 1); }
    if (a.ataque >= 0) vt *= 0.4; if (a.golpe >= 0) vt *= 0.3;
    var diff = envolver(this.yawObj - this.yaw);
    if (vt > 0 && Math.abs(diff) > 0.5) vt *= Math.max(0.15, Math.cos(diff)); // giro cerrado: frena y gira (no camina de lado)
    var maxR = a.muerto ? 0 : this.v > 0.1 * esc ? lerp(6.5, 4.2, a.g) : 4.0, rObj = clamp(diff * 7, -maxR, maxR);
    this.yawRate += (rObj - this.yawRate) * Math.min(1, dt * 14);
    if (Math.abs(diff) < 0.002 && Math.abs(this.yawRate) < 0.02) this.yawRate = 0;
    this.yaw = envolver(this.yaw + this.yawRate * dt);
    var acc = (vt > this.v ? 5 : 8) * esc * dt; this.v += clamp(vt - this.v, -acc, acc); if (this.v < 1e-4) this.v = 0;
    this.pos.x += Math.sin(this.yaw) * this.v * dt; this.pos.z += Math.cos(this.yaw) * this.v * dt;
    this.grupo.rotation.y = this.yaw;
    var pose = a.actualizar(dt, { pos: this.pos, yaw: this.yaw, v: this.v, yawRate: this.yawRate, yawObj: this.yawObj });
    this._aplicar(pose);
    for (var i = 0; i < a.avisos.length; i++) this._emitir(a.avisos[i][0], a.avisos[i][1]);
    var es = this.estado(); if (es !== this._estado) { this._estado = es; this._emitir('estado', es); }
    return this;
  };
  Personaje.prototype._aplicar = function (pose) {
    this.pivote.position.copy(pose.raizPos); this.pivote.quaternion.copy(pose.raizQ);
    if (this.ret) { this.ret.aplicar(pose); return; }
    var h = this.huesos; for (var i = 1; i < LISTA.length; i++) h[LISTA[i]].quaternion.copy(pose.q[LISTA[i]]);
    h.pelvis.position.copy(pose.pelvisPos);
  };
  // grupo pegado a un hueso, orientado como el esqueleto estándar (eje -Y a lo largo del hueso, +Z hacia delante)
  Personaje.prototype.zocalo = function (hueso) {
    if (this.zocalos[hueso]) return this.zocalos[hueso];
    var z; if (this.ret) z = this.ret.zocalo(hueso); else { z = new T.Group(); z.name = 'zocalo:' + hueso; this.huesos[hueso].add(z); }
    this.zocalos[hueso] = z; return z;
  };
  // ranuras: manoD, manoI, cabeza, pecho, espalda, cintura. El objeto se hace con el agarre en (0,0,0).
  Personaje.prototype.equipar = function (ranura, obj) {
    var hueso = ZOCALOS[ranura]; if (!hueso || !obj) return false; this.quitar(ranura);
    var z = this.zocalo(hueso); if (!z) return false; var m = this.medidas, h = new T.Group(); h.name = 'ranura:' + ranura;
    if (ranura === 'manoD' || ranura === 'manoI') h.position.set(0, -m.mano * 0.45, 0.012 * m.escala);
    else if (ranura === 'cabeza') h.position.set(0, m.coronilla * 0.45 + 0.02 * m.escala, 0.01 * m.escala);
    else if (ranura === 'pecho') h.position.set(0, m.pecho * 0.45, 0);
    else if (ranura === 'espalda') h.position.set(0, m.pecho * 0.45, -0.14 * m.escala);
    h.scale.setScalar(m.escala); h.add(obj); z.add(h); this.equipo[ranura] = h; return true;
  };
  Personaje.prototype.quitar = function (ranura) { var h = this.equipo[ranura]; if (!h) return false; h.parent.remove(h); delete this.equipo[ranura]; return true; };
  // ropa con huesos hecha sobre el MISMO esqueleto (mismos nombres y pose de reposo): se mueve con el personaje
  Personaje.prototype.vestir = function (prenda) {
    var self = this, puestas = 0, nombres = {}; if (!this.huesos) { if (G.console) console.warn('vestir(): solo para esqueletos estándar'); return 0; }
    LISTA.forEach(function (n) { nombres[normalizar(n)] = self.huesos[n]; });
    var mallas = []; prenda.traverse(function (o) { if (o.isSkinnedMesh) mallas.push(o); });
    mallas.forEach(function (o) {
      var hs = o.skeleton.bones.map(function (b) { return nombres[normalizar(b.name)] || null; }); if (hs.some(function (b) { return !b; })) return;
      o.bind(new T.Skeleton(hs, o.skeleton.boneInverses), o.bindMatrix); o.frustumCulled = false; self.malla.add(o); puestas++;
    });
    return puestas;
  };
  // la dirección de un joystick (x derecha, y arriba) convertida a dirección del mundo según el giro de la cámara
  function dirDesdeCamara(jx, jy, camara) {
    var f = new V3(); camara.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-8) f.set(0, 0, -1); f.normalize();
    var r = new V3(-f.z, 0, f.x); return { x: r.x * jx + f.x * jy, z: r.z * jx + f.z * jy, k: Math.min(1, Math.hypot(jx, jy)) };
  }

  G.TKEsqueleto = {
    version: '1.0', LISTA: LISTA, PADRE: PADRE, ARTICULACIONES: ARTICULACIONES, ZOCALOS: ZOCALOS,
    medidasBase: medidasBase, desplazamientos: desplazamientos, crearHuesos: crearHuesos, crearRigPrueba: crearRigPrueba,
    buscarHuesos: buscarHuesos, Animador: Animador, Retarget: Retarget, Personaje: Personaje, dirDesdeCamara: dirDesdeCamara,
    util: { envolver: envolver, clamp: clamp, lerp: lerp }
  };
})(typeof window !== 'undefined' ? window : globalThis);
