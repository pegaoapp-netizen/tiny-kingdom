// =====================================================================
//  CUENTAS: usuario + contraseña con Firebase, y partida guardada en la nube.
//  Cada jugador solo puede leer y escribir su propia partida (ver nube/firestore.rules).
// =====================================================================
var Cuentas = (function () {
  'use strict';
  var DOMINIO = 'jugador.tinykingdom.app'; // para convertir "usuario" en correo interno
  var listo = false, usuario = null, avisar = function () {};
  var db = null, auth = null, disponible = false;
  var pendiente = null, timer = null;

  try {
    // Abierto con doble clic (file://): Firebase no funciona ahí, se juega como invitado
    if (location.protocol === 'file:' || typeof firebase === 'undefined') throw new Error('sin nube');
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    // algunas redes y el navegador de WhatsApp cortan la conexión normal: se detecta y se usa otra que sí pasa
    try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
    // Solo para pruebas en la computadora: usa el emulador local de Firebase
    if (/^(localhost|127.0.0.1)$/.test(location.hostname) && /emulador/.test(location.search)) {
      auth.useEmulator('http://127.0.0.1:9099');
      // el navegador de pruebas corta el canal abierto: en el emulador se pide de a poco
      try { db.settings({ experimentalForceLongPolling: true, experimentalAutoDetectLongPolling: false, merge: true }); } catch (e) {}
      db.useEmulator('127.0.0.1', 8080);
    }
    // el juego es solo con internet: no se guarda copia de la base de datos en el teléfono
    disponible = true;
  } catch (e) { disponible = false; }

  // v6.54: el Mundo mide MAPA_TAM × MAPA_TAM casillas y cada reino guarda su casilla exacta.
  // Los reinos guardados con el mapa viejo (coordenadas 0 a 99, sin el campo "mapa") se pasan a su lugar en el mapa nuevo.
  var MAPA_TAM = 300;
  // v7.40: la partida en la nube no puede pasar de ~1 MB. El correo (informes de batalla con su detalle) es lo que más pesa:
  // si la partida es muy grande, a la nube va con el correo recortado (en el teléfono se queda completo).
  var nubeLeida = false, errorGuardar = '', TOPE_PARTIDA = 700000;
  function partidaCorta(e) {
    var t = JSON.stringify(e);
    if (t.length < TOPE_PARTIDA || !Array.isArray(e.buzon)) return t;
    var c = {}; for (var k in e) c[k] = e[k];
    var importantes = function (m) { return m && (m.marcado || (m.premio && !m.reclamado)); };
    c.buzon = e.buzon.filter(function (m, i) { return i < 40 || importantes(m); }).map(function (m, i) {
      if (i < 15) return m; var x = {}; for (var j in m) x[j] = m[j]; x.cuerpo = String(m.cuerpo || '').slice(0, 300); return x;
    });
    t = JSON.stringify(c);
    if (t.length >= TOPE_PARTIDA) { c.buzon = c.buzon.filter(importantes).map(function (m) { var x = {}; for (var j in m) x[j] = m[j]; x.cuerpo = ''; return x; }); t = JSON.stringify(c); }
    return t;
  }
  function normAldea(x) {
    if (x && x.mapa !== MAPA_TAM && typeof x.x === 'number') { x.x = Math.min(MAPA_TAM - 1, Math.floor((x.x + 0.5) * MAPA_TAM / 100)); x.y = Math.min(MAPA_TAM - 1, Math.floor((x.y + 0.5) * MAPA_TAM / 100)); }
    return x;
  }
  function correoDe(texto) {
    var t = String(texto || '').trim().toLowerCase();
    return t.indexOf('@') >= 0 ? t : t + '@' + DOMINIO;
  }
  function nombreDe(u) {
    if (!u) return '';
    if (u.displayName) return u.displayName;
    var c = u.email || '';
    return c.slice(-DOMINIO.length - 1) === '@' + DOMINIO ? c.slice(0, -DOMINIO.length - 1) : c;
  }
  function usuarioValido(texto) {
    var t = String(texto || '').trim();
    if (t.indexOf('@') >= 0) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
    return /^[a-zA-Z0-9_.]{3,20}$/.test(t);
  }
  // Traduce errores de Firebase a una clave de TEXTOS
  function claveError(e) {
    var c = (e && e.code) || '';
    if (c === 'auth/invalid-credential' || c === 'auth/wrong-password' || c === 'auth/user-not-found' || c === 'auth/invalid-login-credentials') return 'e_clave';
    if (c === 'auth/email-already-in-use') return 'e_existe';
    if (c === 'auth/weak-password') return 'e_debil';
    if (c === 'auth/invalid-email') return 'e_usuario';
    if (c === 'auth/network-request-failed') return 'e_red';
    if (c === 'auth/too-many-requests') return 'e_muchos';
    return 'e_general';
  }

  if (disponible) {
    auth.onAuthStateChanged(function (u) {
      usuario = u;
      listo = true;
      avisar(u);
    });
    // si la cuenta no contesta en 9 segundos, se sigue igual (sale la pantalla de entrar); si contesta después, entra sola
    setTimeout(function () { if (!listo) { listo = true; avisar(null); } }, 9000);
  } else listo = true;

  return {
    disponible: function () { return disponible; },
    listo: function () { return listo; },
    alCambiar: function (fn) { avisar = fn; if (listo) fn(usuario); },
    usuario: function () { return usuario; },
    nombre: function () { return nombreDe(usuario); },
    correo: function () { return usuario ? (usuario.email || '') : ''; },
    usuarioValido: usuarioValido,
    claveError: claveError,

    entrar: function (texto, clave) {
      return auth.signInWithEmailAndPassword(correoDe(texto), clave);
    },
    crear: function (texto, clave) {
      return auth.createUserWithEmailAndPassword(correoDe(texto), clave).then(function (r) {
        var nombre = String(texto).trim();
        if (nombre.indexOf('@') < 0) return r.user.updateProfile({ displayName: nombre }).then(function () { return r; });
        return r;
      });
    },
    // Apple exige poder borrar la cuenta desde la app
    borrarCuenta: function (clave) {
      var u = usuario;
      if (!u) return Promise.reject(new Error('sin usuario'));
      var cred = firebase.auth.EmailAuthProvider.credential(u.email, clave);
      pendiente = null; clearTimeout(timer);
      return u.reauthenticateWithCredential(cred)
        .then(function () { return db.collection('aldeas').doc(u.uid).delete().catch(function () {}); })
        .then(function () { return db.collection('jugadores').doc(u.uid).delete(); })
        .then(function () { try { localStorage.removeItem('tinykingdom_v1_' + u.uid); } catch (e) {} return u.delete(); });
    },
    salir: function () { return this.guardarYa().catch(function () {}).then(function () { return auth.signOut(); }); },

    // Partida en la nube
    cargarPartida: function () {
      if (!usuario) return Promise.resolve(null);
      nubeLeida = false;
      // v7.40: { source: 'server' }: nunca se toma una copia vacía del caché como si fuera la de la nube
      return db.collection('jugadores').doc(usuario.uid).get({ source: 'server' }).then(function (d) {
        if (!d.exists) { nubeLeida = true; return null; }
        var x = d.data();
        try { var r = { estado: JSON.parse(x.partida), actualizado: x.actualizado || 0 }; nubeLeida = true; return r; }
        catch (e) { throw new Error('partida rota'); } // no se pisa: mejor no guardar que borrar el reino
      });
    },
    // Guarda con un poco de espera para no escribir a cada rato
    guardarPartida: function (estado, ya) {
      if (!usuario) return;
      pendiente = estado;
      clearTimeout(timer);
      if (ya) this.guardarYa();
      else timer = setTimeout(this.guardarYa.bind(this), 8000);
    },
    guardarYa: function () {
      clearTimeout(timer);
      if (!usuario || !pendiente) return Promise.resolve();
      // v7.40 ARREGLO: si no se pudo leer tu reino de la nube, no se escribe encima (antes un reino nuevo podía borrar el de verdad)
      if (!nubeLeida) return Promise.resolve();
      var e = pendiente; pendiente = null;
      var texto = partidaCorta(e);
      return db.collection('jugadores').doc(usuario.uid).set({
        usuario: nombreDe(usuario).slice(0, 60),
        partida: texto,
        actualizado: Math.floor(e.actualizado || Date.now()),
        version: 1
      }).then(function () { errorGuardar = ''; }).catch(function (err) { errorGuardar = (err && err.code) || 'error'; try { console.warn('No se pudo guardar en la nube', err); } catch (x) {} });
    },
    // v7.92: compras verificadas por el servidor que aún no se entregaron
    comprasPendientes: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('compras').where('uid', '==', usuario.uid).where('cobrada', '==', false).limit(20).get()
        .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    marcarCompra: function (id) { return db.collection('compras').doc(id).update({ cobrada: true, cobradaEn: Date.now() }); },
    // v7.85: COPIA DE SEGURIDAD aparte (respaldos/{uid}): solo se escribe si el reino no es mucho menor que el último respaldo
    leerRespaldo: function () {
      if (!usuario) return Promise.resolve(null);
      return db.collection('respaldos').doc(usuario.uid).get({ source: 'server' }).then(function (d) {
        if (!d.exists) return null; var x = d.data();
        try { return { estado: JSON.parse(x.partida), progreso: x.progreso || 0, actualizado: x.actualizado || 0 }; } catch (e) { return null; }
      });
    },
    guardarRespaldo: function (estado, progreso) {
      if (!usuario || !nubeLeida) return Promise.resolve();
      return db.collection('respaldos').doc(usuario.uid).set({ partida: partidaCorta(estado), progreso: Math.floor(progreso || 0), actualizado: Date.now() }).catch(function () {});
    },
    nubeLeida: function () { return nubeLeida; },
    errorGuardar: function () { return errorGuardar; },

    // ---------------- MAPA DEL MUNDO Y ALIANZAS ----------------
    // Nombre que ven los demás: nunca el correo completo
    // v7.14: cambio de nombre (objeto de la tienda)
    cambiarNombre: function (n) { if (!usuario) return Promise.reject(new Error('sin cuenta')); return usuario.updateProfile({ displayName: String(n).slice(0, 30) }); },
    nombrePublico: function () {
      var n = nombreDe(usuario) || '';
      return (n.indexOf('@') >= 0 ? n.split('@')[0] : n).slice(0, 30) || '?';
    },
    // Lugar fijo de la aldea en el mapa (sale del id de la cuenta)
    lugar: function () {
      var s = usuario ? usuario.uid : 'x', h = 0;
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return { x: 20 + (h % (MAPA_TAM - 40)), y: 20 + (Math.floor(h / (MAPA_TAM - 40)) % (MAPA_TAM - 40)) };
    },
    publicarAldea: function (d) {
      if (!usuario) return Promise.resolve();
      // v6.94: todo se limpia para que la nube lo acepte (números enteros y dentro de los límites de las reglas)
      function ent(v, mn, mx) { v = Math.floor(+v); if (!isFinite(v)) v = mn; return Math.max(mn, Math.min(mx, v)); }
      var nom = String(d.nombre || '?').slice(0, 30) || '?';
      var doc = { nombre: nom, nivel: ent(d.nivel, 1, 100000), poder: ent(d.poder, 0, 1000000000000000), x: ent(d.x, 0, MAPA_TAM - 1), y: ent(d.y, 0, MAPA_TAM - 1), mapa: MAPA_TAM,
        alianza: d.alianza || null, actualizado: Date.now(), escudo: ent(d.escudo, 0, 9e15) };
      // v7.08: puntos de Liquidación (total para siempre, y los de la temporada con su número)
      if (d.kp !== undefined) { doc.kp = ent(d.kp, 0, 1e15); doc.kpt = ent(d.kpt, 0, 1e15); doc.kps = ent(d.kps, 0, 1e9); }
      if (!d.minimo) {
        doc.defensa = ent(d.defensa, 0, 100000000);
        var e = d.espia || {}, es = {};
        ['nivelJ', 'castillo', 'muralla', 'heroes'].forEach(function (k) { if (e[k] !== undefined) es[k] = ent(e[k], 0, 1e9); });
        if (e.tropas && typeof e.tropas === 'object') { es.tropas = {}; Object.keys(e.tropas).slice(0, 40).forEach(function (k) { es.tropas[k] = ent(e.tropas[k], 0, 1e9); }); }
        doc.espia = es;
      }
      return db.collection('aldeas').doc(usuario.uid).set(doc);
    },
    // v6.94: reinos alrededor de unas coordenadas (aunque no estén entre los 150 más fuertes)
    aldeasCerca: function (x, y, r) {
      r = r || 4;
      return db.collection('aldeas').where('x', '>=', x - r).where('x', '<=', x + r).limit(300).get().then(function (q) {
        return q.docs.map(function (d) { var a = d.data(); if (a.mapa !== MAPA_TAM) return null; var z = normAldea(a); z.uid = d.id; return z; })
          .filter(function (a) { return a && Math.abs(a.y - y) <= r; });
      });
    },
    aldeas: function () {
      // v6.94: los 150 más fuertes + los 150 que jugaron hace poco (así salen también los reinos nuevos)
      function lista(q) { return q.docs.map(function (d) { var x = normAldea(d.data()); x.uid = d.id; return x; }); }
      return Promise.all([
        db.collection('aldeas').orderBy('poder', 'desc').limit(150).get().then(lista),
        db.collection('aldeas').orderBy('actualizado', 'desc').limit(150).get().then(lista).catch(function () { return []; })
      ]).then(function (r) { var vistos = {}, out = []; r[0].concat(r[1]).forEach(function (a) { if (!vistos[a.uid]) { vistos[a.uid] = 1; out.push(a); } }); return out; });
    },
    // v6.34: buscar alianza por nombre o etiqueta (sin importar mayúsculas ni tildes)
    buscarAlianzas: function (texto) {
      function limpio(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
      var q = limpio(texto), tag = String(texto || '').trim().toUpperCase();
      var porTag = /^[A-Z0-9]{2,4}$/.test(tag) ? db.collection('alianzas').doc(tag).get().then(function (d) { return d.exists ? [d.data()] : []; }).catch(function () { return []; }) : Promise.resolve([]);
      var todas = db.collection('alianzas').orderBy('creada', 'desc').limit(400).get().then(function (r) { return r.docs.map(function (d) { return d.data(); }); });
      return Promise.all([porTag, todas]).then(function (r) {
        var vistos = {}, out = [];
        r[0].concat(r[1].filter(function (a) { return limpio(a.nombre).indexOf(q) >= 0 || limpio(a.tag).indexOf(q) >= 0; })).forEach(function (a) { if (a && !vistos[a.tag]) { vistos[a.tag] = 1; out.push(a); } });
        return out;
      });
    },
    // v6.34: ranking de todos los jugadores por poder
    rankingLiquidacion: function () {
      return db.collection('aldeas').orderBy('kp', 'desc').limit(100).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; }); });
    },
    ranking: function () {
      return db.collection('aldeas').orderBy('poder', 'desc').limit(100).get().then(function (q) {
        return q.docs.map(function (d) { var x = normAldea(d.data()); x.uid = d.id; return x; });
      });
    },
    // v6.34: torneo semanal
    puntosTorneo: function (semana, datos) {
      if (!usuario) return Promise.resolve();
      return db.collection('torneos').doc(String(semana)).collection('puntos').doc(usuario.uid).set(datos);
    },
    topTorneo: function (semana, n) {
      return db.collection('torneos').doc(String(semana)).collection('puntos').orderBy('puntos', 'desc').limit(n || 50).get().then(function (q) {
        return q.docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; });
      });
    },
    // v7.76: torneo de temporada (14 días)
    puntosTemporada: function (id, datos) {
      if (!usuario) return Promise.resolve();
      return db.collection('temporadas').doc(String(id)).collection('puntos').doc(usuario.uid).set(datos);
    },
    topTemporada: function (id, n) {
      return db.collection('temporadas').doc(String(id)).collection('puntos').orderBy('puntos', 'desc').limit(n || 50).get().then(function (q) {
        return q.docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; });
      });
    },
    alianza: function (tag) {
      return db.collection('alianzas').doc(tag).get().then(function (d) { return d.exists ? d.data() : null; });
    },
    // v7.99: DONAR a la alianza: sube la experiencia (nivel) y el Mérito de Alianza que gasta el Canciller en bonificaciones
    donarAlianza: function (tag, xp, ma) { var FV = firebase.firestore.FieldValue; return db.collection('alianzas').doc(tag).update({ xp: FV.increment(Math.floor(xp)), ma: FV.increment(Math.floor(ma)) }); },
    mejorarBonifAlianza: function (tag, k, nivel, costo) { var FV = firebase.firestore.FieldValue, u = { ma: FV.increment(-Math.floor(costo)) }; u['bonif.' + k] = nivel; return db.collection('alianzas').doc(tag).update(u); },
    alianzas: function () {
      return db.collection('alianzas').orderBy('creada', 'desc').limit(50).get().then(function (q) {
        return q.docs.map(function (d) { return d.data(); });
      });
    },
    miembros: function (tag) {
      return db.collection('aldeas').where('alianza', '==', tag).limit(60).get().then(function (q) {
        return q.docs.map(function (d) { var x = normAldea(d.data()); x.uid = d.id; return x; });
      });
    },
    crearAlianza: function (nombre, tag) {
      if (!usuario) return Promise.reject(new Error('sin usuario'));
      return db.collection('alianzas').doc(tag).set({
        nombre: nombre, tag: tag, lider: usuario.uid, liderNombre: this.nombrePublico(), creada: Date.now()
      });
    },
    borrarAlianza: function (tag) { return db.collection('alianzas').doc(tag).delete(); },
    ajustesAlianza: function (tag, datos) { return db.collection('alianzas').doc(tag).update(datos); },
    atacar: function (r) { return db.collection('ataques').add(r); },
    ataquesNuevos: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('ataques').where('defensor', '==', usuario.uid).where('visto', '==', false).limit(20).get()
        .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    marcarVisto: function (id) { return db.collection('ataques').doc(id).update({ visto: true }); },
    // ataques con marcha: el defensor los escucha en vivo; el atacante revisa los suyos
    escucharAtaques: function (fn) {
      if (!usuario) return function () {};
      return db.collection('ataques').where('defensor', '==', usuario.uid).where('resuelto', '==', false).limit(20)
        .onSnapshot(function (q) { fn(q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; })); }, function () {});
    },
    ataquesEnviados: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('ataques').where('atacante', '==', usuario.uid).where('cobrado', '==', false).limit(20).get()
        .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    // v7.39: GUERRA DE LA ALIANZA (solo el Canciller): ataques de los últimos 7 días contra los miembros y hechos por ellos
    guerraAlianza: function (tag) {
      if (!usuario || !tag) return Promise.resolve({ recibidos: [], hechos: [] });
      var dias = [], ahora = Date.now();
      for (var i = 0; i < 7; i++) dias.push(new Date(ahora - i * 86400000).toISOString().slice(0, 10));
      function leer(campo) {
        return db.collection('ataques').where(campo, '==', tag).where('dia', 'in', dias).limit(100).get()
          .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
      }
      return Promise.all([leer('alD'), leer('alA')]).then(function (r) { return { recibidos: r[0], hechos: r[1] }; });
    },
    leerAtaque: function (id) { return db.collection('ataques').doc(id).get().then(function (d) { var x = d.data(); x.id = d.id; return x; }); },
    resolverAtaque: function (id, datos) { return db.collection('ataques').doc(id).update(datos); },
    acelerarMarcha: function (id, llega) { return db.collection('ataques').doc(id).update({ llega: llega }); },
    cobrarAtaque: function (id) { return db.collection('ataques').doc(id).update({ cobrado: true }); },
    leerAldea: function (uid) { return db.collection('aldeas').doc(uid).get().then(function (d) { return d.exists ? normAldea(d.data()) : null; }); },
    // ---------------- REFUERZOS ENTRE ALIADOS ----------------
    enviarRefuerzo: function (r) { return db.collection('refuerzos').add(r); },
    refuerzosRecibidos: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('refuerzos').where('para', '==', usuario.uid).limit(30).get()
        .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    refuerzosEnviados: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('refuerzos').where('de', '==', usuario.uid).limit(30).get()
        .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    leerRefuerzo: function (id) {
      return db.collection('refuerzos').doc(id).get().then(function (d) { if (!d.exists) return null; var x = d.data(); x.id = d.id; return x; });
    },
    actualizarRefuerzo: function (id, datos) { return db.collection('refuerzos').doc(id).update(datos); },
    borrarRefuerzo: function (id) { return db.collection('refuerzos').doc(id).delete(); },
    pedirRefuerzos: function (tag) {
      if (!usuario) return Promise.reject(new Error('sin usuario'));
      return db.collection('pedidos').doc(usuario.uid).set({ nombre: this.nombrePublico(), alianza: tag, fecha: Date.now() });
    },
    quitarPedido: function () { return usuario ? db.collection('pedidos').doc(usuario.uid).delete() : Promise.resolve(); },
    pedidos: function (tag) {
      return db.collection('pedidos').where('alianza', '==', tag).limit(60).get()
        .then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; x.uid = x.uid || d.id; return x; }); });
    },
    // pedidos nuevos (v5.4): uno de tropas (_t) y uno de recursos (_r) por jugador
    crearPedido: function (sufijo, datos) { if (!usuario) return Promise.reject(new Error('sin usuario')); datos.uid = usuario.uid; return db.collection('pedidos').doc(usuario.uid + '_' + sufijo).set(datos); },
    quitarPedidoId: function (id) { return db.collection('pedidos').doc(id).delete(); },
    donarPedido: function (id, n, nombre, porRecurso) { var FV = firebase.firestore.FieldValue, u = { recibido: FV.increment(n), donantes: FV.arrayUnion(String(nombre).slice(0, 20) + '|' + n + '|' + Date.now()) }; Object.keys(porRecurso || {}).forEach(function (r) { if (porRecurso[r] > 0) u['recibidos.' + r] = FV.increment(Math.floor(porRecurso[r])); }); return db.collection('pedidos').doc(id).update(u); }, // v7.98: recibidos por recurso
    // casillas del mapa conquistadas (id 'x_y')
    casillas: function () {
      return db.collection('casillas').limit(500).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; if (x.mapa !== MAPA_TAM) { var p = d.id.split('_'); x.id = Math.min(MAPA_TAM - 1, Math.floor((+p[0] + 0.5) * MAPA_TAM / 80)) + '_' + Math.min(MAPA_TAM - 1, Math.floor((+p[1] + 0.5) * MAPA_TAM / 80)); } return x; }); });
    },
    tomarCasilla: function (id, datos) { var dd = {}; for (var k in datos) dd[k] = datos[k]; dd.mapa = MAPA_TAM; return db.collection('casillas').doc(id).set(dd); },
    soltarCasilla: function (id) { return db.collection('casillas').doc(id).delete(); },
    // envíos de recursos dentro de la hermandad
    enviarRecursos: function (e) { return db.collection('envios').add(e); },
    enviosRecibidos: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('envios').where('para', '==', usuario.uid).limit(20).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    borrarEnvio: function (id) { return db.collection('envios').doc(id).delete(); },
    // chat: canal 'global' o 'al_TAG' (cada canal guarda sus mensajes)
    escucharChat: function (canal, fn) {
      if (!usuario) return function () {};
      return db.collection('canales').doc(canal).collection('mensajes').orderBy('fecha', 'desc').limit(60)
        .onSnapshot({ includeMetadataChanges: true }, function (q) { if (q.metadata.fromCache) return; /* solo lo que confirma el servidor (no la caché de otra cuenta) */ fn(q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }).reverse()); }, function () { fn(null); });
    },
    // v6.57: chat privado: canal pv_<uidA>_<uidB> y una lista de conversaciones por jugador (privados/{uid}/conv/{otro})
    canalPrivado: function (otro) { return 'pv_' + [usuario.uid, otro].sort().join('_'); },
    escucharPrivados: function (fn) {
      if (!usuario) return function () {};
      return db.collection('privados').doc(usuario.uid).collection('conv').orderBy('fecha', 'desc').limit(20)
        .onSnapshot(function (q) { fn(q.docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; })); }, function () { fn([]); });
    },
    avisarPrivado: function (otro, otroNombre, miNombre, texto) {
      var f = Date.now(), t = String(texto).slice(0, 200);
      return Promise.all([
        db.collection('privados').doc(otro).collection('conv').doc(usuario.uid).set({ nombre: String(miNombre).slice(0, 30), texto: t, fecha: f, nuevo: true }),
        db.collection('privados').doc(usuario.uid).collection('conv').doc(otro).set({ nombre: String(otroNombre).slice(0, 30), texto: t, fecha: f, nuevo: false })
      ]);
    },
    privadoVisto: function (otro) { return db.collection('privados').doc(usuario.uid).collection('conv').doc(otro).update({ nuevo: false }); },
    vaciarPrivados: function () { return db.collection('privados').doc(usuario.uid).collection('conv').get().then(function (q) { return Promise.all(q.docs.map(function (d) { return d.ref.delete(); })); }); },
    enviarChat: function (canal, m) { return db.collection('canales').doc(canal).collection('mensajes').add(m); },
    borrarChat: function (canal, id) { return db.collection('canales').doc(canal).collection('mensajes').doc(id).delete(); },
    // v6.84: regalos del dueño (solo la cuenta del dueño puede crearlos; ver nube/firestore.rules)
    enviarRegalo: function (g) { return db.collection('regalos').add(g); },
    // v7.07: SOPORTE: el jugador escribe, el dueño lee y responde (nadie ve el correo del dueño)
    enviarSoporte: function (d) { return db.collection('soporte').add(d); },
    misSoportes: function () { if (!usuario) return Promise.resolve([]); return db.collection('soporte').where('de', '==', usuario.uid).limit(30).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); }); },
    todosSoportes: function () { return db.collection('soporte').orderBy('fecha', 'desc').limit(60).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); }); },
    responderSoporte: function (id, txt) { return db.collection('soporte').doc(id).update({ respuesta: String(txt).slice(0, 600), respondido: Date.now() }); },
    borrarSoporte: function (id) { return db.collection('soporte').doc(id).delete(); },
    regalosRecibidos: function () {
      if (!usuario) return Promise.resolve([]);
      return db.collection('regalos').where('para', '==', usuario.uid).limit(20).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    borrarRegalo: function (id) { return db.collection('regalos').doc(id).delete(); },
    buscarJugador: function (nombre) {
      // v6.94: nombre exacto o que empiece así
      var t = String(nombre).trim(); function lista(q) { return q.docs.map(function (d) { var x = normAldea(d.data()); x.uid = d.id; return x; }); }
      return Promise.all([
        db.collection('aldeas').where('nombre', '==', t).limit(5).get().then(lista),
        db.collection('aldeas').where('nombre', '>=', t).where('nombre', '<', t + '\uf8ff').limit(10).get().then(lista).catch(function () { return []; })
      ]).then(function (r) { return r[0].concat(r[1]); });
    },
    reportar: function (r) { return db.collection('reportes').add(r); },
    borrarAldea: function () { return usuario ? db.collection('aldeas').doc(usuario.uid).delete() : Promise.resolve(); }
  };
})();
