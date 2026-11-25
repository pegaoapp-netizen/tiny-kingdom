// FRENO DE BRother Kingdom (v9.15, pedido del dueño: «si estoy cambiando el color de las cabañas, que no se joda el ataque»).
//
// Cada parte importante del juego tiene su «huella». Si un cambio toca una parte que NO era la que se estaba arreglando,
// el revisor NO deja publicar y dice qué parte se tocó.
//
// Si de verdad querías cambiar esa parte (y ya la probaste en el juego), acéptalo así:
//     node pruebas/revisar.js --acepto ataque          (o: correo, poder, marchas, edificios, campana, entrar, chat…)
// Eso guarda la huella nueva en pruebas/freno.json. Sin ese paso, nada de esa parte se puede publicar cambiado.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const RAIZ = path.join(__dirname, '..');

// QUÉ SE VIGILA. Funciones de js/juego.js (o archivos enteros) agrupadas por parte del juego.
const PARTES = {
  ataque:    { nombre: 'Ataque y batallas', prueba: 'ataca a alguien y mira que llegue el informe a Correo › Guerras', fn: ['realizarAtaque', 'llegarMarcha', 'decidirAtaque', 'resolverBatalla', 'aplicarPerdidasRondas', 'fraccionHeridos', 'puedeAtacar', 'botinAtaque'] },
  defensa:   { nombre: 'Defensa', prueba: 'que te ataquen y mira el informe «te atacó»', fn: ['heroeDefensor', 'capacidadEnfermeria', 'curarHeridos'] },
  marchas:   { nombre: 'Marchas', prueba: 'abre Marchar, elige tropas y manda una marcha', fn: ['abrirMarcha', 'tamanoMarcha', 'maxMarchas', 'enMarcha', 'libresParaMarcha', 'tiempoMarcha', 'acelerarMarcha', 'abrirDestacar'] },
  correo:    { nombre: 'Correo e informes', prueba: 'abre Correo y mira Informes y Guerras', fn: ['nuevoCorreo', 'avisoResultado', 'correoLista'] },
  poder:     { nombre: 'Poder', prueba: 'mira tu poder arriba y en el perfil', fn: ['desglosePoder', 'calcularPoder', 'cuentaTipo', 'reserva'] },
  edificios: { nombre: 'Edificios y colores', prueba: 'mira la ciudad: edificios y techos de colores', fn: [], archivos: ['js/modelos.js'] },
  campana:   { nombre: 'Campaña', prueba: 'abre la Campaña y juega una etapa', fn: [], archivos: ['js/tk-campana.js', 'js/tk-campana-mapa.js'] },
  entrar:    { nombre: 'Pantalla de entrar', prueba: 'abre el juego sin sesión: Entrar, Crear cuenta y Jugar sin cuenta', fn: ['mostrarPantalla', 'ocultarPantalla', 'pantallaCuenta', 'pantallaInicio'], archivos: ['js/tk-portada.js', 'js/cuentas.js'] },
  chat:      { nombre: 'Chat y perfil', prueba: 'abre el chat, toca un jugador y cierra su tarjeta', fn: ['perfilJugador', 'opcionesChat', 'abrirPanelChat'] },
  reglas:    { nombre: 'Reglas de la nube', prueba: 'publica las reglas solo en tiny-kingdom-pegao y prueba atacar y guardar', fn: [], archivos: ['nube/firestore.rules'] },
};

// saca el código de una función contando llaves (sin contar las de dentro de textos o comentarios)
function cuerpoFuncion(src, nombre) {
  const i = src.indexOf('function ' + nombre + '(');
  if (i < 0) return null;
  let j = src.indexOf('{', i), n = 0, k = j;
  for (; k < src.length; k++) {
    const c = src[k], d = src[k + 1];
    if (c === '/' && d === '/') { k = src.indexOf('\n', k); if (k < 0) break; continue; }
    if (c === '/' && d === '*') { k = src.indexOf('*/', k + 2) + 1; if (k <= 0) break; continue; }
    if (c === '"' || c === "'" || c === '`') { const q = c; k++; while (k < src.length && src[k] !== q) { if (src[k] === '\\') k++; k++; } continue; }
    if (c === '{') n++;
    else if (c === '}') { n--; if (n === 0) break; }
  }
  return src.slice(i, k + 1);
}
const huella = (t) => crypto.createHash('sha1').update(t.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16);

function huellasActuales() {
  const juego = fs.readFileSync(path.join(RAIZ, 'js', 'juego.js'), 'utf8'), out = {};
  for (const p in PARTES) {
    const h = {};
    for (const f of PARTES[p].fn) { const c = cuerpoFuncion(juego, f); h[f] = c ? huella(c) : 'NO EXISTE'; }
    for (const a of PARTES[p].archivos || []) { const ruta = path.join(RAIZ, a); h[a] = fs.existsSync(ruta) ? huella(fs.readFileSync(ruta, 'utf8')) : 'NO EXISTE'; }
    out[p] = h;
  }
  return out;
}

// devuelve los errores del freno (lista vacía = todo bien). acepta = lista de partes que se aceptan cambiadas.
function revisarFreno(acepta) {
  const archivo = path.join(__dirname, 'freno.json'), ahora = huellasActuales(), errores = [];
  let guardado = null; try { guardado = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch (e) {}
  if (!guardado) { fs.writeFileSync(archivo, JSON.stringify(ahora, null, 1) + '\n'); return { errores, nota: 'Freno: primera huella guardada en pruebas/freno.json.' }; }
  const aceptadas = [];
  for (const p in PARTES) {
    const antes = guardado[p] || {}, cambio = Object.keys(ahora[p]).filter((k) => antes[k] !== ahora[p][k]);
    if (!cambio.length) continue;
    if (acepta.indexOf(p) >= 0) { guardado[p] = ahora[p]; aceptadas.push(p); continue; }
    const falta = cambio.filter((k) => ahora[p][k] === 'NO EXISTE');
    errores.push('FRENO: se cambió «' + PARTES[p].nombre + '» (' + cambio.join(', ') + ')' + (falta.length ? ' — ¡y ' + falta.join(', ') + ' ya NO EXISTE!' : '') +
      '. Si no estabas arreglando eso, deshaz ese cambio. Si sí: prueba en el juego (' + PARTES[p].prueba + ') y luego corre: node pruebas/revisar.js --acepto ' + p);
  }
  if (aceptadas.length) fs.writeFileSync(archivo, JSON.stringify(guardado, null, 1) + '\n');
  return { errores, nota: aceptadas.length ? 'Freno: aceptado el cambio de ' + aceptadas.join(', ') + '.' : '' };
}
module.exports = { revisarFreno, PARTES };
