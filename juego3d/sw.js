// Tiny Kingdom se juega solo con internet: no se guarda nada para jugar sin conexión.
// Cambia VERSION cada vez que publiques una versión nueva del juego.
var VERSION = 'tinykingdom-v6.19';

self.addEventListener('install', function () { self.skipWaiting(); });

// borra lo que versiones viejas guardaron en el teléfono para jugar sin internet
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (claves) { return Promise.all(claves.map(function (k) { return caches.delete(k); })); }));
  self.clients.claim();
});

// todo se pide a internet; si no hay conexión, el juego muestra el aviso de Sin conexión
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, new URL(e.request.url).origin === location.origin ? { cache: 'no-cache' } : undefined));
});
