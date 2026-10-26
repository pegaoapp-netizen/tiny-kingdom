// Copia el juego (carpeta juego3d) a www, que es lo que va dentro de la app.
const fs = require('fs'), path = require('path');
const origen = path.join(__dirname, '..', '..', 'juego3d');
const destino = path.join(__dirname, '..', 'www');
const fuera = new Set(['nube', 'firebase.json', '.firebaserc', 'LEEME.txt', 'sw.js', 'manifest.webmanifest']);
fs.rmSync(destino, { recursive: true, force: true });
(function copiar(de, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const n of fs.readdirSync(de)) {
    if (fuera.has(n) || n.startsWith('.')) continue;
    const d = path.join(de, n), h = path.join(a, n);
    if (fs.statSync(d).isDirectory()) copiar(d, h); else fs.copyFileSync(d, h);
  }
})(origen, destino);
console.log('Juego copiado a www');
