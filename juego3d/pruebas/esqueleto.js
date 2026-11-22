// Pruebas del sistema de esqueleto en Node (sin navegador):  node pruebas/esqueleto.js
// Usa el personaje de prueba. Las pruebas con los modelos de Tripo se hacen en esqueleto.html (botón «Pruebas»).
'use strict';
const path = require('path');
global.THREE = require(path.join(__dirname, '..', 'js', 'three.min.js'));
require(path.join(__dirname, '..', 'js', 'sistemas', 'esqueleto.js'));
require(path.join(__dirname, '..', 'js', 'sistemas', 'esqueleto-pruebas.js'));
const E = globalThis.TKEsqueleto;
let fallos = 0;
for (const alto of [1.8, 1.2, 2.4]) {
  console.log('\n== Personaje de prueba, alto ' + alto + ' m ==');
  for (const r of E.pruebas(() => new E.Personaje({ alto }))) { if (!r.ok) fallos++; console.log((r.ok ? '  OK   ' : '  FALLA ') + r.nombre + ' — ' + r.detalle); }
}
console.log(fallos ? '\n' + fallos + ' pruebas fallaron' : '\nTodas las pruebas pasaron');
process.exit(fallos ? 1 : 0);
