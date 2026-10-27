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
    // Solo para pruebas en la computadora: usa el emulador local de Firebase
    if (/^(localhost|127.0.0.1)$/.test(location.hostname) && /emulador/.test(location.search)) {
      auth.useEmulator('http://127.0.0.1:9099');
      db.useEmulator('127.0.0.1', 8080);
    }
    db.enablePersistence({ synchronizeTabs: true }).catch(function () {});
    disponible = true;
  } catch (e) { disponible = false; }

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
      return db.collection('jugadores').doc(usuario.uid).get().then(function (d) {
        if (!d.exists) return null;
        var x = d.data();
        try { return { estado: JSON.parse(x.partida), actualizado: x.actualizado || 0 }; } catch (e) { return null; }
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
      var e = pendiente; pendiente = null;
      return db.collection('jugadores').doc(usuario.uid).set({
        usuario: nombreDe(usuario).slice(0, 60),
        partida: JSON.stringify(e),
        actualizado: Math.floor(e.actualizado || Date.now()),
        version: 1
      }).catch(function () { /* sin internet: Firestore lo reintenta solo */ });
    },

    // ---------------- MAPA DEL MUNDO Y ALIANZAS ----------------
    // Nombre que ven los demás: nunca el correo completo
    nombrePublico: function () {
      var n = nombreDe(usuario) || '';
      return (n.indexOf('@') >= 0 ? n.split('@')[0] : n).slice(0, 30) || '?';
    },
    // Lugar fijo de la aldea en el mapa (sale del id de la cuenta)
    lugar: function () {
      var s = usuario ? usuario.uid : 'x', h = 0;
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return { x: 8 + (h % 84), y: 8 + (Math.floor(h / 84) % 84) };
    },
    publicarAldea: function (d) {
      if (!usuario) return Promise.resolve();
      return db.collection('aldeas').doc(usuario.uid).set({
        nombre: d.nombre, nivel: d.nivel, poder: d.poder, x: d.x, y: d.y,
        alianza: d.alianza || null, actualizado: Date.now(), escudo: Math.floor(d.escudo || 0), defensa: Math.floor(d.defensa || 0)
      });
    },
    aldeas: function () {
      return db.collection('aldeas').orderBy('poder', 'desc').limit(150).get().then(function (q) {
        return q.docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; });
      });
    },
    alianza: function (tag) {
      return db.collection('alianzas').doc(tag).get().then(function (d) { return d.exists ? d.data() : null; });
    },
    alianzas: function () {
      return db.collection('alianzas').orderBy('creada', 'desc').limit(50).get().then(function (q) {
        return q.docs.map(function (d) { return d.data(); });
      });
    },
    miembros: function (tag) {
      return db.collection('aldeas').where('alianza', '==', tag).limit(60).get().then(function (q) {
        return q.docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; });
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
    leerAtaque: function (id) { return db.collection('ataques').doc(id).get().then(function (d) { var x = d.data(); x.id = d.id; return x; }); },
    resolverAtaque: function (id, datos) { return db.collection('ataques').doc(id).update(datos); },
    cobrarAtaque: function (id) { return db.collection('ataques').doc(id).update({ cobrado: true }); },
    leerAldea: function (uid) { return db.collection('aldeas').doc(uid).get().then(function (d) { return d.exists ? d.data() : null; }); },
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
    donarPedido: function (id, n, nombre) { var FV = firebase.firestore.FieldValue; return db.collection('pedidos').doc(id).update({ recibido: FV.increment(n), donantes: FV.arrayUnion(String(nombre).slice(0, 20) + '|' + n + '|' + Date.now()) }); },
    // casillas del mapa conquistadas (id 'x_y')
    casillas: function () {
      return db.collection('casillas').limit(500).get().then(function (q) { return q.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; }); });
    },
    tomarCasilla: function (id, datos) { return db.collection('casillas').doc(id).set(datos); },
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
    enviarChat: function (canal, m) { return db.collection('canales').doc(canal).collection('mensajes').add(m); },
    borrarChat: function (canal, id) { return db.collection('canales').doc(canal).collection('mensajes').doc(id).delete(); },
    reportar: function (r) { return db.collection('reportes').add(r); },
    borrarAldea: function () { return usuario ? db.collection('aldeas').doc(usuario.uid).delete() : Promise.resolve(); }
  };
})();
