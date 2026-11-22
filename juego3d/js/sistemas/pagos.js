/* Tiny Kingdom · PAGOS (v7.92)
 * Un solo punto para cobrar en las 3 plataformas:
 *   - android → Google Play Billing  (RevenueCat: @revenuecat/purchases-capacitor)
 *   - ios     → App Store In-App Purchase (RevenueCat)
 *   - web     → Stripe Checkout (Payment Links), solo en el navegador
 * Apple y Google obligan a cobrar los bienes digitales dentro de la app con su propia pasarela:
 * por eso Stripe NUNCA se usa dentro de la app nativa.
 *
 * El juego llama a Pagos.comprarProducto('tk_gemas_550'). Nada se entrega en el teléfono:
 * la Cloud Function «verificarCompraNativa» (o el webhook de Stripe) comprueba el pago de verdad y
 * crea un documento en compras/{id}; el juego lo lee, lo entrega una sola vez y lo marca como cobrado.
 *
 * Mientras CONFIG.activo sea false no se cobra nada (la tienda muestra «todavía no»).
 */
(function () {
  var CONFIG = {
    activo: false,                 // ponlo en true cuando las tiendas y RevenueCat estén configurados
    revenuecat: { ios: '', android: '' },   // claves PÚBLICAS de RevenueCat (appl_… y goog_…)
    funcion: 'verificarCompraNativa',        // Cloud Function (callable) que valida el recibo
    region: 'us-central1',
    // web: un Payment Link de Stripe por producto (https://buy.stripe.com/…); el juego le añade ?client_reference_id=<uid>
    stripe: {}
  };
  // mismos IDs en Google Play Console, App Store Connect, RevenueCat y Stripe
  var CATALOGO = {
    tk_gemas_100:        { usd: '0.99',  gemas: 100 },
    tk_gemas_550:        { usd: '4.99',  gemas: 550 },
    tk_gemas_1200:       { usd: '9.99',  gemas: 1200 },
    tk_gemas_2600:       { usd: '19.99', gemas: 2600 },
    tk_gemas_7000:       { usd: '49.99', gemas: 7000 },
    tk_gemas_15000:      { usd: '99.99', gemas: 15000 },
    tk_pack_constructor: { usd: '2.99',  gemas: 600,  objetos: { acel_1h: 3, madera_500k: 1, piedra_500k: 1 } },
    tk_pack_guerrero:    { usd: '9.99',  gemas: 1200, objetos: { reclutas: 3, cofre_plata: 2, escudo_8h: 1 } },
    tk_pack_pirata:      { usd: '19.99', gemas: 2600, objetos: { cofre_oro: 2, libro_gra: 2, acel_8h: 2, portal_elegir: 1 } }
  };
  function cap() { return window.Capacitor; }
  function detectarPlataformaPago() {
    var c = cap();
    if (c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()) {
      var p = typeof c.getPlatform === 'function' ? c.getPlatform() : '';
      return p === 'android' ? 'android' : p === 'ios' ? 'ios' : 'web';
    }
    return 'web';
  }
  function plugin() { var c = cap(); return c && c.Plugins && c.Plugins.Purchases; }
  var listo = null;
  function iniciar(uid) {
    var pl = detectarPlataformaPago();
    if (pl === 'web') return Promise.resolve(pl);
    var P = plugin(), clave = CONFIG.revenuecat[pl];
    if (!P || !clave) return Promise.reject(new Error('Falta el plugin de RevenueCat o su clave (' + pl + ')'));
    if (!listo) listo = P.configure({ apiKey: clave, appUserID: uid || null }).then(function () { return pl; });
    return listo;
  }
  function activo() {
    if (!CONFIG.activo) return false;
    var pl = detectarPlataformaPago();
    return pl === 'web' ? Object.keys(CONFIG.stripe).length > 0 : !!(plugin() && CONFIG.revenuecat[pl]);
  }
  // precio que se muestra: en la app, el de la tienda (en la moneda del jugador); en la web, el del catálogo
  function precios() {
    var pl = detectarPlataformaPago(), P = plugin();
    if (pl === 'web' || !P || !CONFIG.activo) return Promise.resolve({});
    return iniciar().then(function () { return P.getProducts({ productIdentifiers: Object.keys(CATALOGO), type: 'INAPP' }); })
      .then(function (r) { var o = {}; ((r && r.products) || []).forEach(function (x) { o[x.identifier] = x.priceString; }); return o; })
      .catch(function () { return {}; });
  }
  // devuelve una promesa: { ok: true, plataforma } cuando la tienda cobró (la entrega llega por compras/{id})
  function comprarProducto(id, uid) {
    var prod = CATALOGO[id]; if (!prod) return Promise.reject(new Error('Producto desconocido: ' + id));
    if (!CONFIG.activo) return Promise.reject(new Error('inactivo'));
    var pl = detectarPlataformaPago();
    if (pl === 'web') {
      var url = CONFIG.stripe[id]; if (!url) return Promise.reject(new Error('Sin enlace de Stripe para ' + id));
      location.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(uid || '');
      return Promise.resolve({ ok: true, plataforma: pl, redirige: true });
    }
    var P = plugin();
    return iniciar(uid).then(function () { return P.getProducts({ productIdentifiers: [id], type: 'INAPP' }); })
      .then(function (r) { var sp = r && r.products && r.products[0]; if (!sp) throw new Error('La tienda no tiene ' + id); return P.purchaseStoreProduct({ product: sp }); })
      .then(function (res) {
        var tx = (res && res.transaction) || {};
        // el servidor valida con RevenueCat y crea compras/{id}; el teléfono no entrega nada por su cuenta
        return llamarFuncion({ producto: id, plataforma: pl, transaccion: tx.transactionIdentifier || tx.transactionId || '' }).then(function () { return { ok: true, plataforma: pl }; });
      });
  }
  // llamada a una Cloud Function «callable» sin el SDK de Functions (protocolo HTTPS: { data } + token del jugador)
  function llamarFuncion(datos) {
    var u = window.firebase && firebase.auth && firebase.auth().currentUser;
    if (!u) return Promise.reject(new Error('Sin sesión'));
    var proyecto = (window.FIREBASE_CONFIG && FIREBASE_CONFIG.projectId) || (firebase.app().options || {}).projectId;
    return u.getIdToken().then(function (tok) {
      return fetch('https://' + CONFIG.region + '-' + proyecto + '.cloudfunctions.net/' + CONFIG.funcion, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ data: datos }) });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok || j.error) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status)); return j.result; }); });
  }
  window.Pagos = { CONFIG: CONFIG, CATALOGO: CATALOGO, detectarPlataformaPago: detectarPlataformaPago, activo: activo, iniciar: iniciar, precios: precios, comprarProducto: comprarProducto };
})();
