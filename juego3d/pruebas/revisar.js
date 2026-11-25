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
// 10. Que ninguna función que se llama falte (v8.99).
// 11. Que ninguna ventana quede encima sin poder esconderse (v8.99).
// 12. FRENO (v9.15): si cambia una parte importante (ataque, marchas, correo, poder, campaña…) que no se estaba arreglando, no se publica.
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
  // v8.09: ningún cofre ni paquete puede traer llaves (las llaves solo salen en la Ruleta)
  if (JSON.stringify([o.cofre || {}, o.paquete || {}, o.da || {}]).indexOf('llave') >= 0) err('El objeto "' + k + '" trae llaves dentro, y los cofres no pueden traer llaves (regla del dueño).');
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


// 10) v8.99 (dueño: «no se puede arreglar una cosa y joder otra»): ninguna función que se llama puede faltar.
//     Así se rompieron los techos de colores en la v8.86 (se borró hsl2rgb y el juego fallaba sin avisar).
try {
  const JS = fs.readdirSync(path.join(RAIZ, 'js')).filter((f) => f.endsWith('.js') && !AJENOS.test(f)).map((f) => 'js/' + f)
    .concat(fs.existsSync(path.join(RAIZ, 'js', 'sistemas')) ? fs.readdirSync(path.join(RAIZ, 'js', 'sistemas')).filter((f) => f.endsWith('.js')).map((f) => 'js/sistemas/' + f) : []);
  const fuentes = JS.map((f) => [f, fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\'"])\/\/[^\n]*/g, '$1').replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''")]);
  const def = new Set();
  for (const [, s] of fuentes) {
    let m; const r1 = /function\s+([A-Za-z_$][\w$]*)\s*\(/g; while ((m = r1.exec(s))) def.add(m[1]);
    const r2 = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g; while ((m = r2.exec(s))) def.add(m[1]);
    const r3 = /[,(]\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/g; while ((m = r3.exec(s))) def.add(m[1]); /* var a = 1, b = function… */
    const r3b = /(?:var|let|const)\s+[^;]*?,\s*([A-Za-z_$][\w$]*)\s*[,;]/g; while ((m = r3b.exec(s))) def.add(m[1]);
    const r3c = /,\s*([A-Za-z_$][\w$]*)\s*(?=;)/g; while ((m = r3c.exec(s))) def.add(m[1]);
    const r4 = /function\s*[\w$]*\s*\(([^)]*)\)/g; while ((m = r4.exec(s))) m[1].split(',').forEach((x) => def.add(x.replace(/=.*/, '').trim()));
    const r5 = /\(([\w$\s,]*)\)\s*=>/g; while ((m = r5.exec(s))) m[1].split(',').forEach((x) => def.add(x.trim()));
    const r6 = /([A-Za-z_$][\w$]*)\s*=>/g; while ((m = r6.exec(s))) def.add(m[1]);
    const r7 = /(?:window|self|globalThis)\.([A-Za-z_$][\w$]*)\s*=/g; while ((m = r7.exec(s))) def.add(m[1]);
    const r8 = /catch\s*\(\s*([\w$]+)/g; while ((m = r8.exec(s))) def.add(m[1]);
  }
  const GLOBALES = new Set(('if for while switch return typeof catch function new delete void in of do else with await yield super this import ' +
    'setTimeout setInterval clearTimeout clearInterval requestAnimationFrame cancelAnimationFrame parseInt parseFloat isNaN isFinite ' +
    'encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape fetch alert confirm prompt atob btoa getComputedStyle ' +
    'structuredClone queueMicrotask matchMedia open close print importScripts require define').split(' '));
  for (const [f, s] of fuentes) {
    const faltan = new Set(); let m; const rc = /(^|[^.\w$\/|^)\\])([a-z_$][\w$]*)\s*\(/g; /* lo que va dentro de un /patrón/ no cuenta */
    while ((m = rc.exec(s))) { const n = m[2]; if (!def.has(n) && !GLOBALES.has(n)) faltan.add(n); }
    for (const n of faltan) err(f + ' llama a «' + n + '()» pero esa función no existe en ningún archivo (se borró o tiene otro nombre).');
  }
} catch (e) { avi('No se pudo revisar las funciones: ' + e.message); }

// 11) v8.99: una ventana escondida tiene que quedar escondida. Si un estilo le pone «display ... !important» a la ventana misma,
//     tiene que haber otra regla que la esconda con .oculto (así se quedó encima la pantalla de entrar en la v8.98).
try {
  const css = fs.readdirSync(path.join(RAIZ, 'css')).filter((f) => f.endsWith('.css')).map((f) => fs.readFileSync(path.join(RAIZ, 'css', f), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ');
  const jsJ = fs.readFileSync(path.join(RAIZ, 'js', 'juego.js'), 'utf8');
  const ids = new Set(); let m; const ro = /\$\('([\w-]+)'\)\.classList\.(?:add|toggle)\('oculto'/g; while ((m = ro.exec(jsJ))) ids.add(m[1]);
  const reglas = []; const rr = /([^{}]+)\{([^}]*)\}/g; while ((m = rr.exec(css))) reglas.push([m[1], m[2]]);
  for (const id of ids) {
    const esElla = new RegExp('#' + id + '(?:[.:][\\w-]+(?:\\([^)]*\\))?)*\\s*$');
    let fuerza = false, esconde = false;
    for (const [sel, cuerpo] of reglas) {
      const sels = sel.split(',').map((x) => x.trim());
      if (/display\s*:\s*none\s*!important|visibility\s*:\s*hidden/i.test(cuerpo) && sels.some((x) => new RegExp('#' + id + '\\.oculto').test(x))) esconde = true;
      if (/display\s*:\s*(?!none)[\w-]+\s*!important/i.test(cuerpo) && sels.some((x) => esElla.test(x) && !/\.oculto/.test(x) && !/:not\(/.test(x))) fuerza = true;
    }
    if (fuerza && !esconde) err('#' + id + ' tiene un estilo con «display ... !important» y nada lo esconde con .oculto: esa ventana no se podría cerrar.');
  }
} catch (e) { avi('No se pudo revisar las ventanas escondidas: ' + e.message); }

// 12) v9.15 FRENO (dueño): un cambio en una parte no puede joder otra. Ver pruebas/freno.js.
try {
  const acepta = []; process.argv.forEach((x, i) => { if (x === '--acepto' && process.argv[i + 1]) acepta.push(...process.argv[i + 1].split(',')); });
  const fr = require('./freno.js').revisarFreno(acepta);
  fr.errores.forEach(err); if (fr.nota) console.log('  ' + fr.nota);
} catch (e) { avi('No se pudo revisar el freno: ' + e.message); }

// resultado
for (const a of avisos) console.log('  aviso: ' + a);
if (errores.length) {
  console.error('\n✗ REVISOR: ' + errores.length + ' error(es). No se publica hasta arreglarlos:\n');
  for (const e of errores) console.error('  - ' + e);
  console.error('');
  process.exit(1);
}
console.log('✓ Revisor: todo bien (' + avisos.length + ' aviso(s)).');
