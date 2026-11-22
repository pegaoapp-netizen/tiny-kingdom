/* Tiny Kingdom · Cloud Functions de pagos (v7.93)
 * - verificarCompraNativa (callable): el teléfono avisa de una compra de Google Play / App Store.
 *   Se pregunta a RevenueCat (con la clave SECRETA, que solo vive aquí) si esa transacción existe y es de ese jugador.
 * - webhookStripe (HTTP): Stripe avisa de un pago de la web (checkout.session.completed), con firma verificada.
 * En los dos casos se crea compras/{transacción} (una sola vez: el id es la transacción, así no se cobra doble).
 * El juego lee sus compras pendientes, entrega gemas y objetos y marca «cobrada».
 *
 * Secretos (se configuran una vez, nunca en el código):
 *   firebase functions:secrets:set REVENUECAT_SECRET      (clave secreta sk_… de RevenueCat)
 *   firebase functions:secrets:set STRIPE_SECRET          (sk_live_… de Stripe)
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  (whsec_… del webhook)
 */
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const REVENUECAT_SECRET = defineSecret('REVENUECAT_SECRET');
const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// el mismo catálogo que js/sistemas/pagos.js (lo que se entrega lo decide el servidor, nunca el teléfono)
const CATALOGO = {
  tk_gemas_100: { gemas: 100 }, tk_gemas_550: { gemas: 550 }, tk_gemas_1200: { gemas: 1200 },
  tk_gemas_2600: { gemas: 2600 }, tk_gemas_7000: { gemas: 7000 }, tk_gemas_15000: { gemas: 15000 },
  tk_pack_constructor: { gemas: 600, objetos: { acel_1h: 3, madera_500k: 1, piedra_500k: 1 } },
  tk_pack_guerrero: { gemas: 1200, objetos: { reclutas: 3, cofre_plata: 2, escudo_8h: 1 } },
  tk_pack_pirata: { gemas: 2600, objetos: { cofre_oro: 2, libro_gra: 2, acel_8h: 2, portal_elegir: 1 } }
};

async function crearCompra(id, datos) {
  const ref = db.collection('compras').doc(id);
  return db.runTransaction(async (t) => {
    const ya = await t.get(ref);
    if (ya.exists) return false; // ya se registró: no se entrega dos veces
    t.set(ref, Object.assign({ cobrada: false, fecha: Date.now() }, datos));
    return true;
  });
}

exports.verificarCompraNativa = onCall({ secrets: [REVENUECAT_SECRET], region: 'us-central1' }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Necesitas una cuenta');
  const uid = req.auth.uid, { producto, plataforma, transaccion } = req.data || {};
  const prod = CATALOGO[producto];
  if (!prod) throw new HttpsError('invalid-argument', 'Producto desconocido');
  // RevenueCat: compras sin suscripción del jugador (appUserID = uid de Firebase)
  const r = await fetch('https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(uid), { headers: { Authorization: 'Bearer ' + REVENUECAT_SECRET.value() } });
  if (!r.ok) throw new HttpsError('unavailable', 'RevenueCat no respondió');
  const j = await r.json();
  const lista = ((j.subscriber && j.subscriber.non_subscriptions) || {})[producto] || [];
  const tx = lista.find((x) => !transaccion || x.store_transaction_id === transaccion || x.id === transaccion) || null;
  if (!tx) throw new HttpsError('not-found', 'La tienda no confirma esa compra');
  const nueva = await crearCompra('rc_' + (tx.store_transaction_id || tx.id), { uid, producto, plataforma: plataforma || tx.store || '', gemas: prod.gemas, objetos: prod.objetos || {} });
  return { ok: true, nueva };
});

exports.webhookStripe = onRequest({ secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET], region: 'us-central1' }, async (req, res) => {
  const stripe = require('stripe')(STRIPE_SECRET.value());
  let ev;
  try { ev = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET.value()); }
  catch (e) { res.status(400).send('firma no válida'); return; }
  if (ev.type === 'checkout.session.completed') {
    const s = ev.data.object, uid = s.client_reference_id;
    // el producto sale del Payment Link: en Stripe pon en su metadata  producto = tk_gemas_550 (etc.)
    const producto = (s.metadata && s.metadata.producto) || '';
    const prod = CATALOGO[producto];
    if (uid && prod && s.payment_status === 'paid') await crearCompra('st_' + s.id, { uid, producto, plataforma: 'web', gemas: prod.gemas, objetos: prod.objetos || {} });
  }
  res.json({ recibido: true });
});
