// REVISOR DE TINY KINGDOM
// Se corre solo antes de cada `firebase deploy` (ver firebase.json → predeploy).
// También a mano:  node pruebas/revisar.js
// Si encuentra un ERROR, la publicación se detiene y dice qué arreglar.
// Los AVISOS no detienen nada: solo muestran cosas para mirar.
//
// Qué revisa:
//  1. Que ningún archivo de js/ tenga errores de escritura (una coma o llave de más rompe todo el juego).
//  2. Que cada objeto, tropa, edificio y suministro tenga su nombre en NOMBRES (si falta, el juego se cae al mostrarlo).
//  3. Que cada dibujo que se nombra (objetos, retratos, piezas de los juegos de héroe) exista en iconos/ui/.
//  4. Que cada pieza de juego de héroe pertenezca a un héroe que existe.
//  5. Que cada tropa tenga costo, comida, tiempo, vida y daño.
//  6. Que los textos en español e inglés tengan las mismas claves.
//  7. Que los archivos que carga index.html existan.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '..');
const errores = [], avisos = [];
const err = (m) => errores.push(m), avi = (m) => avisos.push(m);
const existe = (p) => fs.existsSync(path.join(RAIZ, p));

// 1) errores de escritura en los archivos del juego
const AJENOS = /^(three\.min|GLTFLoader|SkeletonUtils|firebase-.*)\.js$/;
for (const f of fs.readdirSync(path.join(RAIZ, 'js'))) {
  if (!f.endsWith('.js') || AJENOS.test(f)) continue;
  try { new vm.Script(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), { filename: 'js/' + f }); }
  catch (e) { err('js/' + f + ' tiene un error de escritura: ' + e.message); }
}

// cargar datos.js para mirar sus tablas
const ctx = { window: {}, document: { createElement: () => ({ getContext: () => ({}) }) }, navigator: { language: 'es' }, localStorage: { getItem: () => null, setItem() {} }, console, Math, Date, JSON };
ctx.window = ctx;
let D = {};
try {
  const src = fs.readFileSync(path.join(RAIZ, 'js', 'datos.js'), 'utf8');
  vm.createContext(ctx);
  vm.runInContext(src + '\n;this.__d = { NOMBRES: typeof NOMBRES !== "undefined" ? NOMBRES : null, OBJETOS: typeof OBJETOS !== "undefined" ? OBJETOS : null, TROPAS: typeof TROPAS !== "undefined" ? TROPAS : null, EDIFICIOS: typeof EDIFICIOS !== "undefined" ? EDIFICIOS : null, SUMINISTRO: typeof SUMINISTRO !== "undefined" ? SUMINISTRO : null, TEXTOS: typeof TEXTOS !== "undefined" ? TEXTOS : null, ICONOS_IMG: typeof ICONOS_IMG !== "undefined" ? ICONOS_IMG : null, RETRATOS_IMG: typeof RETRATOS_IMG !== "undefined" ? RETRATOS_IMG : null, ARMADURA_HEROE: typeof ARMADURA_HEROE !== "undefined" ? ARMADURA_HEROE : null, HEROES: typeof HEROES !== "undefined" ? HEROES : null };', ctx, { filename: 'js/datos.js' });
  D = ctx.__d;
} catch (e) { err('No se pudo leer js/datos.js: ' + e.message); }

// 2) nombres
if (D.NOMBRES) {
  const falta = (grupo, tabla, saltar) => { if (!tabla) return; for (const k of Object.keys(tabla)) { if (saltar && saltar.includes(k)) continue; if (!D.NOMBRES[k]) err(grupo + ' "' + k + '" no tiene nombre en NOMBRES (datos.js). Agrega: ' + k + ": { es: '...', en: '...' }"); else if (!D.NOMBRES[k].es) err(grupo + ' "' + k + '" no tiene nombre en español en NOMBRES.'); else if (!D.NOMBRES[k].en) avi(grupo + ' "' + k + '" no tiene nombre en inglés en NOMBRES.'); } };
  falta('El objeto', D.OBJETOS);
  falta('La tropa', D.TROPAS, ['heroe']);
  falta('El edificio', D.EDIFICIOS);
}
// los suministros llevan su nombre adentro (es / en) y su dibujo en img
if (D.SUMINISTRO) for (const [k, v] of Object.entries(D.SUMINISTRO)) {
  if (!v.es) err('El suministro "' + k + '" no tiene nombre en español (es) en SUMINISTRO.');
  if (!v.en) avi('El suministro "' + k + '" no tiene nombre en inglés (en) en SUMINISTRO.');
  if (v.img && !(existe('iconos/ui/' + v.img + '.webp') || existe('iconos/ui/' + v.img + '.png'))) err('El suministro "' + k + '" usa el dibujo iconos/ui/' + v.img + '.webp, pero no existe.');
}

// 3) dibujos
const dibujo = (n) => existe('iconos/ui/' + n + '.webp') || existe('iconos/ui/' + n + '.png');
for (const [tabla, nom] of [[D.ICONOS_IMG, 'ICONOS_IMG'], [D.RETRATOS_IMG, 'RETRATOS_IMG']]) {
  if (!tabla) continue;
  for (const [k, v] of Object.entries(tabla)) if (!dibujo(v)) err(nom + ' dice que "' + k + '" usa el dibujo iconos/ui/' + v + '.webp, pero ese archivo no existe.');
}
// piezas de los juegos de héroe (EQ_SET_IMG vive dentro de juego.js)
try {
  const jg = fs.readFileSync(path.join(RAIZ, 'js', 'juego.js'), 'utf8');
  const m = jg.match(/var EQ_SET_IMG = (\{[^\n]*\});/);
  if (m) {
    const sets = vm.runInNewContext('(' + m[1] + ')');
    for (const [s, piezas] of Object.entries(sets)) {
      if (D.ARMADURA_HEROE && !D.ARMADURA_HEROE[s]) err('EQ_SET_IMG tiene el juego "' + s + '" pero no está en ARMADURA_HEROE (datos.js).');
      if (D.HEROES && !D.HEROES.some((h) => h.id === s)) err('EQ_SET_IMG tiene el juego "' + s + '" pero no hay ningún héroe con id "' + s + '".');
      for (const t of Object.keys(piezas)) if (!dibujo('q_' + t + '_' + s)) err('Falta el dibujo de la pieza "' + t + '" del juego "' + s + '": iconos/ui/q_' + t + '_' + s + '.webp');
    }
  } else avi('No encontré EQ_SET_IMG en juego.js (las piezas de los juegos no se revisaron).');
} catch (e) { err('No se pudo revisar las piezas: ' + e.message); }

// 5) tropas completas
if (D.TROPAS) for (const [k, t] of Object.entries(D.TROPAS)) {
  if (k === 'heroe') continue;
  for (const c of ['costo', 'comida', 'tiempo', 'vida', 'dano']) if (typeof t[c] !== 'number' || !isFinite(t[c])) err('La tropa "' + k + '" no tiene "' + c + '" (un número) en TROPAS.');
  if (t.tiempo <= 0) err('La tropa "' + k + '" tiene tiempo 0 o menos.');
}

// 6) textos en los dos idiomas
if (D.TEXTOS && D.TEXTOS.es && D.TEXTOS.en) {
  const es = Object.keys(D.TEXTOS.es), en = new Set(Object.keys(D.TEXTOS.en));
  const sinEn = es.filter((k) => !en.has(k));
  if (sinEn.length) avi(sinEn.length + ' textos no tienen traducción al inglés: ' + sinEn.slice(0, 12).join(', ') + (sinEn.length > 12 ? '…' : ''));
}

// 8) regla del dueño: las gemas NO se regalan (ningún cofre, saco, paquete ni el Galeón da gemas)
if (D.OBJETOS) for (const [k, o] of Object.entries(D.OBJETOS)) {
  if ((o.cofre && o.cofre.gemas) || (o.da && o.da.gemas) || (o.paquete && o.paquete.gemas)) err('El objeto "' + k + '" regala gemas, y las gemas no se regalan (regla del dueño).');
}
try {
  const jg = fs.readFileSync(path.join(RAIZ, 'js', 'juego.js'), 'utf8');
  const g = jg.match(/var GALEON = (\{[^}]*\})/);
  if (g && /gemas/.test(g[1])) err('El Cofre del Galeón (GALEON en juego.js) regala gemas, y las gemas no se regalan.');
  if (/GALEON_GEMAS\s*\*/.test(jg)) err('El Cofre del Galeón suma GALEON_GEMAS: las gemas no se regalan.');
} catch (e) {}

// 9) la portada: el dibujo que dice PORTADA.foto en js/tk-portada.js tiene que existir
try {
  const pt = fs.readFileSync(path.join(RAIZ, 'js', 'tk-portada.js'), 'utf8');
  const m = pt.match(/foto:\s*'([^']+)'/);
  if (!m) err('No encontré "foto:" en PORTADA (js/tk-portada.js).');
  else if (!existe(m[1])) err('La portada usa "' + m[1] + '" pero ese archivo no existe. Ponlo en esa carpeta o corrige el nombre en js/tk-portada.js.');
  else if (fs.statSync(path.join(RAIZ, m[1])).size > 1500 * 1024) avi('La foto de la portada pesa más de 1,5 MB: guárdala en JPG calidad 80 para que cargue rápido en el teléfono.');
} catch (e) { if (e.code !== 'ENOENT') err('No se pudo revisar la portada: ' + e.message); }

// 7) lo que carga la página
try {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const re = /(?:src|href)="([^"#:?]+)(?:\?[^"]*)?"/g; let m;
  while ((m = re.exec(html))) { const p = m[1]; if (/^(https?|data|mailto)/.test(p) || p.startsWith('//') || !/\.(js|css|png|webp|json|ico|svg)$/.test(p)) continue; if (!existe(p)) err('index.html carga "' + p + '" pero ese archivo no existe.'); }
} catch (e) { err('No se pudo leer index.html: ' + e.message); }

// resultado
for (const a of avisos) console.log('  aviso: ' + a);
if (errores.length) {
  console.error('\n✗ REVISOR: ' + errores.length + ' error(es). No se publica hasta arreglarlos:\n');
  for (const e of errores) console.error('  - ' + e);
  console.error('');
  process.exit(1);
}
console.log('✓ Revisor: todo bien (' + avisos.length + ' aviso(s)).');
