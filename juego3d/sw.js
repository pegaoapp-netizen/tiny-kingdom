// Guarda los archivos del juego en el teléfono para que funcione sin internet.
// Cambia VERSION cada vez que publiques una versión nueva del juego.
var VERSION = 'tinykingdom-v3.8';
var ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/estilo.css',
  'js/three.min.js', 'js/GLTFLoader.js', 'js/SkeletonUtils.js', 'js/datos.js', 'js/cuentas.js',
  'js/firebase-app-compat.js', 'js/firebase-auth-compat.js', 'js/firebase-firestore-compat.js', 'js/modelos.js', 'js/juego.js',
  'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/apple-touch-icon.png', 'privacidad.html'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Primero intenta internet (para recibir cambios); si no hay, usa lo guardado.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, new URL(e.request.url).origin === location.origin ? { cache: 'no-cache' } : undefined).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
