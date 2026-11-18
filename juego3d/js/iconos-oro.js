// ICONOS CON MARCO DORADO (v6.63): dibujos propios de Tiny Kingdom, detallados, para el menú y la barra de abajo.
// Cada icono es un cuadro con marco de oro, fondo oscuro y el dibujo con luces y sombras.
(function () {
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="io-oro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".35" stop-color="#f2c45a"/><stop offset=".7" stop-color="#b8801e"/><stop offset="1" stop-color="#6a4410"/></linearGradient>' +
    '<linearGradient id="io-oro2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#d9a13a"/><stop offset="1" stop-color="#7a4e12"/></linearGradient>' +
    '<radialGradient id="io-fondo" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#5a3a1e"/><stop offset=".7" stop-color="#2a1a0c"/><stop offset="1" stop-color="#140c05"/></radialGradient>' +
    '<linearGradient id="io-acero" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7886"/><stop offset=".45" stop-color="#f4f7fb"/><stop offset="1" stop-color="#5d6875"/></linearGradient>' +
    '<linearGradient id="io-acero2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6ebf2"/><stop offset=".5" stop-color="#9aa6b4"/><stop offset="1" stop-color="#4a5260"/></linearGradient>' +
    '<linearGradient id="io-madera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8995a"/><stop offset=".55" stop-color="#9a5e2c"/><stop offset="1" stop-color="#5c3418"/></linearGradient>' +
    '<linearGradient id="io-rojo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a6a"/><stop offset=".5" stop-color="#c8392a"/><stop offset="1" stop-color="#6a140e"/></linearGradient>' +
    '<linearGradient id="io-azul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccfff"/><stop offset=".5" stop-color="#2f6fc8"/><stop offset="1" stop-color="#10305e"/></linearGradient>' +
    '<linearGradient id="io-verde" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8f08a"/><stop offset=".5" stop-color="#4caf3a"/><stop offset="1" stop-color="#1f5e17"/></linearGradient>' +
    '<radialGradient id="io-mar" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c8f4ff"/><stop offset=".5" stop-color="#3fa9e0"/><stop offset="1" stop-color="#103e70"/></radialGradient>' +
    '<linearGradient id="io-arena" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8b0"/><stop offset=".6" stop-color="#e0b064"/><stop offset="1" stop-color="#9a6a2a"/></linearGradient>' +
    '<linearGradient id="io-perg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8a464"/><stop offset=".5" stop-color="#fff2cc"/><stop offset="1" stop-color="#c8a464"/></linearGradient>' +
    '<linearGradient id="io-morado" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b8ff"/><stop offset=".5" stop-color="#8a3fe0"/><stop offset="1" stop-color="#3a1070"/></linearGradient>' +
    '<radialGradient id="io-brillo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '</defs></svg>';
  var B = 'stroke="#1a0e05" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
  function marco(dib) {
    return '<svg class="io" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect x="2" y="2" width="60" height="60" rx="11" fill="url(#io-oro)" stroke="#3a2408" stroke-width="1.5"/>' +
      '<rect x="6" y="6" width="52" height="52" rx="8" fill="url(#io-fondo)" stroke="#6a4410" stroke-width="1"/>' +
      '<path d="M8 14 Q8 8 14 8 H50 Q56 8 56 14" fill="none" stroke="#fff3c0" stroke-opacity=".35" stroke-width="1.2"/>' +
      '<g>' + dib + '</g>' +
      '<circle cx="9" cy="9" r="2" fill="#fff6d0"/><circle cx="55" cy="9" r="2" fill="#fff6d0"/><circle cx="9" cy="55" r="2" fill="#a8701a"/><circle cx="55" cy="55" r="2" fill="#a8701a"/>' +
      '</svg>';
  }
  var D = {
    // cofre de madera con bandas de oro (Inventario)
    inventario: '<path d="M12 30 Q32 12 52 30 V34 H12 Z" fill="url(#io-rojo)" ' + B + '/><rect x="12" y="34" width="40" height="18" rx="2" fill="url(#io-madera)" ' + B + '/>' +
      '<rect x="18" y="20" width="5" height="32" fill="url(#io-oro)" stroke="#5a3a08"/><rect x="41" y="20" width="5" height="32" fill="url(#io-oro)" stroke="#5a3a08"/><rect x="12" y="32" width="40" height="4" fill="url(#io-oro)" stroke="#5a3a08"/>' +
      '<rect x="28" y="33" width="8" height="10" rx="2" fill="url(#io-oro)" stroke="#5a3a08"/><circle cx="32" cy="38" r="1.6" fill="#2a1408"/><path d="M15 24 Q24 17 32 16" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" fill="none"/>',
    // pergamino enrollado con sello (Misiones)
    misiones: '<rect x="18" y="14" width="28" height="36" fill="url(#io-perg)" ' + B + '/><rect x="14" y="10" width="36" height="7" rx="3.5" fill="url(#io-madera)" ' + B + '/><rect x="14" y="47" width="36" height="7" rx="3.5" fill="url(#io-madera)" ' + B + '/>' +
      '<path d="M23 23 H41 M23 28 H41 M23 33 H36" stroke="#6a4a20" stroke-width="2"/><circle cx="38" cy="40" r="5" fill="url(#io-rojo)" ' + B + '/><path d="M36 40 L38 42 L41 38" stroke="#ffd" stroke-width="1.4" fill="none"/>',
    // escudo con palmera (Alianza)
    alianza: '<path d="M32 9 L50 15 V30 C50 42 42 50 32 55 C22 50 14 42 14 30 V15 Z" fill="url(#io-azul)" ' + B + '/><path d="M32 13 L46 18 V30 C46 40 40 46 32 50 Z" fill="#fff" opacity=".12"/>' +
      '<path d="M32 46 C32 38 31 32 30 27" stroke="#6a4420" stroke-width="3" fill="none"/><path d="M30 27 C25 22 20 24 18 27 M30 27 C27 20 31 17 35 18 M30 27 C35 22 41 23 43 27 M30 27 C33 26 38 30 38 33" stroke="url(#io-verde)" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M32 9 L50 15 V30 C50 42 42 50 32 55 C22 50 14 42 14 30 V15 Z" fill="none" stroke="url(#io-oro)" stroke-width="2.4"/>',
    // carta con lacre (Correo)
    correo: '<rect x="11" y="18" width="42" height="30" rx="3" fill="url(#io-perg)" ' + B + '/><path d="M11 20 L32 36 L53 20" fill="none" ' + B + '/><path d="M11 46 L26 33 M53 46 L38 33" stroke="#8a6a3a" stroke-width="1.4"/>' +
      '<circle cx="32" cy="36" r="6.5" fill="url(#io-rojo)" ' + B + '/><path d="M29 36 H35 M32 33 V39" stroke="#ffd8c0" stroke-width="1.6"/>',
    // dados de la suerte (Azar)
    azar: '<rect x="12" y="22" width="22" height="22" rx="4" transform="rotate(-12 23 33)" fill="#fffaf0" ' + B + '/><circle cx="18" cy="29" r="2.2" fill="#c8392a"/><circle cx="23" cy="33" r="2.2" fill="#c8392a"/><circle cx="28" cy="37" r="2.2" fill="#c8392a"/>' +
      '<rect x="30" y="16" width="22" height="22" rx="4" transform="rotate(14 41 27)" fill="url(#io-arena)" ' + B + '/><circle cx="36" cy="22" r="2.2" fill="#1a0e05"/><circle cx="45" cy="25" r="2.2" fill="#1a0e05"/><circle cx="35" cy="30" r="2.2" fill="#1a0e05"/><circle cx="44" cy="33" r="2.2" fill="#1a0e05"/>' +
      '<circle cx="48" cy="46" r="5" fill="url(#io-brillo)"/>',
    // espadas cruzadas (Campaña)
    campana: '<path d="M14 14 L42 42 L46 38 L18 10 Z" fill="url(#io-acero)" ' + B + '/><path d="M50 14 L22 42 L18 38 L46 10 Z" fill="url(#io-acero)" ' + B + '/>' +
      '<rect x="37" y="40" width="12" height="4" rx="2" transform="rotate(45 43 42)" fill="url(#io-oro)" ' + B + '/><rect x="15" y="40" width="12" height="4" rx="2" transform="rotate(-45 21 42)" fill="url(#io-oro)" ' + B + '/>' +
      '<path d="M44 46 L50 52" stroke="url(#io-madera)" stroke-width="5" stroke-linecap="round"/><path d="M20 46 L14 52" stroke="url(#io-madera)" stroke-width="5" stroke-linecap="round"/><circle cx="51" cy="53" r="3" fill="url(#io-oro)" stroke="#5a3a08"/><circle cx="13" cy="53" r="3" fill="url(#io-oro)" stroke="#5a3a08"/>',
    // vasija antigua (Reliquia)
    reliquia: '<path d="M25 14 H39 V18 C39 20 46 24 46 34 C46 45 40 52 32 52 C24 52 18 45 18 34 C18 24 25 20 25 18 Z" fill="url(#io-arena)" ' + B + '/><path d="M18 34 H46 M20 40 H44" stroke="#8a3a1a" stroke-width="2.2"/>' +
      '<path d="M22 24 C16 24 15 32 19 33 M42 24 C48 24 49 32 45 33" fill="none" ' + B + '/><path d="M27 22 Q24 32 28 44" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/><rect x="24" y="11" width="16" height="4" rx="2" fill="url(#io-oro)" ' + B + '/>',
    // espada y escudo redondo (Entrenar)
    entrenar: '<circle cx="26" cy="36" r="14" fill="url(#io-madera)" ' + B + '/><circle cx="26" cy="36" r="9" fill="none" stroke="url(#io-oro)" stroke-width="2.5"/><circle cx="26" cy="36" r="3.5" fill="url(#io-oro)" stroke="#5a3a08"/>' +
      '<path d="M50 10 L36 40 L40 42 L54 12 Z" fill="url(#io-acero)" ' + B + '/><rect x="33" y="40" width="11" height="4" rx="2" transform="rotate(25 38 42)" fill="url(#io-oro)" ' + B + '/><path d="M36 46 L33 53" stroke="url(#io-madera)" stroke-width="4.5" stroke-linecap="round"/>',
    // libros y frasco (Investigación)
    investigar: '<rect x="12" y="40" width="34" height="9" rx="2" fill="url(#io-rojo)" ' + B + '/><rect x="15" y="31" width="30" height="9" rx="2" fill="url(#io-azul)" ' + B + '/><rect x="13" y="22" width="28" height="9" rx="2" fill="url(#io-verde)" ' + B + '/>' +
      '<path d="M14 44 H45 M17 35 H43 M15 26 H39" stroke="url(#io-oro)" stroke-width="1.6"/><path d="M47 22 V30 L53 44 Q54 48 50 48 H44 Q40 48 41 44 L45 30 V22 Z" fill="url(#io-morado)" fill-opacity=".9" ' + B + '/><rect x="45" y="18" width="4" height="5" fill="url(#io-madera)" ' + B + '/>',
    // copa de oro (Clasificación)
    ranking: '<path d="M20 12 H44 V22 C44 32 38 37 32 37 C26 37 20 32 20 22 Z" fill="url(#io-oro)" ' + B + '/><path d="M20 16 C12 16 12 27 21 28 M44 16 C52 16 52 27 43 28" fill="none" stroke="url(#io-oro2)" stroke-width="3"/>' +
      '<rect x="29" y="37" width="6" height="7" fill="url(#io-oro2)" ' + B + '/><rect x="21" y="44" width="22" height="7" rx="2" fill="url(#io-madera)" ' + B + '/><path d="M26 15 Q24 24 29 31" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/><path d="M32 18 l2 4 4 .5 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.5 z" fill="#fff6c0"/>',
    // engranajes (Ajustes)
    ajustes: '<g transform="translate(26 34)"><path d="M-3 -16 H3 L4 -11 L8 -9 L12 -12 L16 -8 L13 -4 L15 0 L20 1 V7 L15 8 L13 12 L16 16 L12 20 L8 17 L4 19 L3 24 H-3 L-4 19 L-8 17 L-12 20 L-16 16 L-13 12 L-15 8 L-20 7 V1 L-15 0 L-13 -4 L-16 -8 L-12 -12 L-8 -9 L-4 -11 Z" transform="translate(0 -4) scale(.9)" fill="url(#io-acero2)" ' + B + '/><circle r="6" cy="-1" fill="url(#io-fondo)" ' + B + '/></g>' +
      '<g transform="translate(45 20) scale(.55)"><path d="M-3 -16 H3 L4 -11 L8 -9 L12 -12 L16 -8 L13 -4 L15 0 L20 1 V7 L15 8 L13 12 L16 16 L12 20 L8 17 L4 19 L3 24 H-3 L-4 19 L-8 17 L-12 20 L-16 16 L-13 12 L-15 8 L-20 7 V1 L-15 0 L-13 -4 L-16 -8 L-12 -12 L-8 -9 L-4 -11 Z" transform="translate(0 -4)" fill="url(#io-oro)" ' + B + '/><circle r="6" cy="0" fill="url(#io-fondo)"/></g>',
    // caracola (Publicar)
    publicar: '<path d="M12 40 C12 26 26 16 40 16 C48 16 53 22 53 28 C53 34 48 37 43 37 L30 46 C24 50 12 50 12 40 Z" fill="url(#io-arena)" ' + B + '/><path d="M40 20 C46 20 49 24 49 28 C49 31 46 33 43 33 C40 33 38 31 38 28 C38 26 40 25 42 26" fill="none" stroke="#8a4a1a" stroke-width="2"/>' +
      '<path d="M18 40 C20 33 26 28 33 26" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/><path d="M10 44 L6 50 M14 48 L12 55 M8 38 L3 40" stroke="#f2c45a" stroke-width="2" stroke-linecap="round"/>',
    // peto de armadura (Equipo)
    equipo: '<path d="M20 12 L26 15 H38 L44 12 L52 20 L47 26 V48 C47 51 44 53 41 53 H23 C20 53 17 51 17 48 V26 L12 20 Z" fill="url(#io-acero2)" ' + B + '/><path d="M26 15 C26 22 38 22 38 15" fill="none" ' + B + '/>' +
      '<path d="M32 22 V52" stroke="#4a5260" stroke-width="1.5"/><path d="M22 34 C27 38 37 38 42 34 M22 42 C27 46 37 46 42 42" fill="none" stroke="url(#io-oro)" stroke-width="2.4"/><circle cx="32" cy="29" r="3.5" fill="url(#io-rojo)" ' + B + '/>',
    // casco con penacho (Tropas)
    tropas: '<path d="M32 12 C22 12 16 20 16 30 V44 H24 V36 H40 V44 H48 V30 C48 20 42 12 32 12 Z" fill="url(#io-acero2)" ' + B + '/><path d="M22 30 H42 V34 H22 Z" fill="#1a0e05"/><path d="M32 13 V44" stroke="url(#io-oro)" stroke-width="3"/>' +
      '<path d="M32 12 C34 4 44 4 48 10 C42 9 38 12 36 16" fill="url(#io-rojo)" ' + B + '/><path d="M20 22 Q24 16 30 15" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>',
    // martillo y tabla (Edificios)
    edificios: '<rect x="12" y="42" width="40" height="8" rx="2" fill="url(#io-madera)" ' + B + '/><path d="M16 46 H48" stroke="#5c3418"/>' +
      '<path d="M22 40 L42 18" stroke="url(#io-madera)" stroke-width="6" stroke-linecap="round"/><path d="M34 10 L50 24 L45 30 L29 16 Z" fill="url(#io-acero2)" ' + B + '/><path d="M36 12 L48 23" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>',
    // puesto de mercado con toldo (Tienda)
    tienda: '<path d="M10 24 L16 12 H48 L54 24 Z" fill="#fff" ' + B + '/><path d="M16 12 L13 24 M24 12 L23 24 M32 12 V24 M40 12 L41 24 M48 12 L51 24" stroke="#c8392a" stroke-width="5"/><path d="M10 24 Q14 29 18 24 Q22 29 26 24 Q30 29 34 24 Q38 29 42 24 Q46 29 50 24 Q52 27 54 24" fill="url(#io-rojo)" ' + B + '/>' +
      '<rect x="14" y="30" width="36" height="20" fill="url(#io-madera)" ' + B + '/><circle cx="24" cy="38" r="4" fill="url(#io-oro)" ' + B + '/><circle cx="33" cy="38" r="4" fill="url(#io-verde)" ' + B + '/><circle cx="42" cy="38" r="4" fill="url(#io-rojo)" ' + B + '/>',
    // globo con anillo (Mundo)
    mundo: '<circle cx="32" cy="32" r="19" fill="url(#io-mar)" ' + B + '/><path d="M20 22 C26 20 28 26 25 30 C22 34 26 38 22 42 M36 16 C40 20 46 20 48 26 C44 28 40 26 38 32 C36 36 42 40 40 46" fill="url(#io-verde)" stroke="#1f5e17" stroke-width="1.4"/>' +
      '<ellipse cx="32" cy="32" rx="26" ry="8" transform="rotate(-20 32 32)" fill="none" stroke="url(#io-oro)" stroke-width="3"/><circle cx="25" cy="24" r="5" fill="url(#io-brillo)"/>',
    // castillo con palmera (Ciudad)
    ciudad: '<rect x="14" y="26" width="10" height="24" fill="url(#io-arena)" ' + B + '/><rect x="40" y="26" width="10" height="24" fill="url(#io-arena)" ' + B + '/><rect x="22" y="32" width="20" height="18" fill="url(#io-arena)" ' + B + '/>' +
      '<path d="M12 27 L19 15 L26 27 Z M38 27 L45 15 L52 27 Z" fill="url(#io-rojo)" ' + B + '/><path d="M27 32 L32 22 L37 32 Z" fill="url(#io-rojo)" ' + B + '/><path d="M29 50 V43 Q32 39 35 43 V50 Z" fill="#2a1408"/>' +
      '<path d="M45 15 V9 L50 11 L45 13" fill="url(#io-azul)" stroke="#10305e"/><path d="M8 50 Q10 38 12 34" stroke="#6a4420" stroke-width="2.5" fill="none"/><path d="M12 34 C8 31 5 33 4 35 M12 34 C11 30 14 28 17 29 M12 34 C15 32 18 34 18 36" stroke="url(#io-verde)" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
  };
  var ICONOS = {}; Object.keys(D).forEach(function (k) { ICONOS[k] = marco(D[k]); });
  window.ICONOS_ORO = ICONOS;
  function ponerDefs() { if (document.getElementById('io-defs')) return; var d = document.createElement('div'); d.id = 'io-defs'; d.innerHTML = DEFS; document.body.appendChild(d.firstChild); document.body.lastChild.id = 'io-defs'; }
  if (document.body) ponerDefs(); else document.addEventListener('DOMContentLoaded', ponerDefs);
})();
