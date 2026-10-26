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
    }
  };
})();
