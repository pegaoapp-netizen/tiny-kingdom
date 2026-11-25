/* Tiny Kingdom · MAPA DE CAMPAÑA (v9.00)
 * Mundo medieval dibujado en Canvas 2D (se pinta UNA vez en un lienzo aparte; cada fotograma solo copia el trozo visible),
 * con regiones por capítulo, caminos, misiones, niebla de guerra, jefes, estrellas, dificultades y logros.
 * La batalla es la de js/tk-campana.js (TKCampana.abrirMision). Premios y guardado: window.__tkCamp (juego.js).
 * Nombres, historia y dibujos propios de Tiny Kingdom.
 */
(function () {
  'use strict';
  var G = null;
  function L(es, en) { return G ? G.L(es, en) : es; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return G ? G.num(Math.round(n)) : String(Math.round(n)); }

  // ======================= DATOS DE LA CAMPAÑA =======================
  var ENE = {
    b: { ico: '🗡️', es: 'Bandido', en: 'Bandit', v: 1, a: 1 },
    a: { ico: '🏹', es: 'Arquero bandido', en: 'Bandit archer', v: 0.7, a: 1.1, d: 1 },
    l: { ico: '🐺', es: 'Lobo', en: 'Wolf', v: 0.65, a: 0.9, vel: 1.7 },
    t: { ico: '👺', es: 'Trasgo', en: 'Goblin', v: 0.8, a: 0.95, vel: 1.25 },
    c: { ico: '🔮', es: 'Chamán trasgo', en: 'Goblin shaman', v: 0.6, a: 0.8, d: 1, sana: 1 },
    o: { ico: '👹', es: 'Ogro', en: 'Ogre', v: 1.9, a: 1.15, vel: 0.8 },
    r: { ico: '🪨', es: 'Trol de piedra', en: 'Stone troll', v: 2.5, a: 1.25, vel: 0.7 },
    e: { ico: '💀', es: 'Esqueleto', en: 'Skeleton', v: 0.85, a: 1 },
    n: { ico: '🧙', es: 'Nigromante', en: 'Necromancer', v: 0.8, a: 1.25, d: 1, sana: 1 },
    g: { ico: '🦇', es: 'Gárgola', en: 'Gargoyle', v: 1.1, a: 1.05, vel: 1.5 }
  };
  // jefes y enemigos especiales (habilidades en tk-campana.js: furia, terremoto, invocar, escudo, fuego, drenar, aullido)
  var JEFES = {
    rojo: { ico: '🪓', es: 'Capitán Rojo', en: 'Captain Red', v: 2.6, a: 1.5, habs: ['furia'] },
    garra: { ico: '🦹', es: 'Garra Negra, señor de los bandidos', en: 'Blackclaw, bandit lord', v: 4, a: 1.8, habs: ['furia', 'invocar'], invoca: 'b' },
    alfa: { ico: '🐺', es: 'Colmillo, el lobo alfa', en: 'Fang, the alpha wolf', v: 2.8, a: 1.6, vel: 1.5, habs: ['aullido'] },
    zarza: { ico: '🧙‍♀️', es: 'Zarza, la bruja del bosque', en: 'Bramble, the forest witch', v: 4.6, a: 2, d: 1, habs: ['drenar', 'invocar', 'aullido'], invoca: 't' },
    brusco: { ico: '⚒️', es: 'Brusco, capataz ogro', en: 'Brusk, ogre foreman', v: 3.4, a: 1.7, habs: ['escudo', 'furia'] },
    gorlak: { ico: '🧌', es: 'Gorlak el Rompemuros', en: 'Gorlak the Wallbreaker', v: 5.8, a: 2.2, vel: 0.8, habs: ['terremoto', 'escudo', 'furia'], invoca: 'o' },
    negro: { ico: '🛡️', es: 'El Caballero Negro', en: 'The Black Knight', v: 4, a: 2, habs: ['drenar', 'escudo'] },
    ignaroth: { ico: '🐲', es: 'Ignaroth, el dragón de ceniza', en: 'Ignaroth, the ash dragon', v: 7, a: 2.5, d: 1, habs: ['fuego', 'aullido', 'fuego', 'furia'], invoca: 'g' }
  };
  // [nombre es, nombre en, objetivo, enemigos, jefe, historia es, historia en, segundos, refuerzos]
  var CAPS = [
    { es: 'El Valle de Robleda', en: 'The Oakvale Valley', fondo: 'bosque', lab: [800, 2265],
      hes: 'Los bandidos de Garra Negra saquean las granjas del valle. Reúne a tus héroes, expulsa a los forajidos y devuelve la paz a Robleda.',
      hen: 'Blackclaw\'s bandits are raiding the valley farms. Gather your heroes, drive out the outlaws and bring peace back to Oakvale.',
      pos: [[400, 2210], [660, 2150], [830, 2045], [610, 1995], [370, 1975], [560, 1930]],
      mis: [
        ['Granjas en llamas', 'Burning farms', 'todos', 'bbb', null, 'Unos bandidos queman los graneros de la aldea.', 'Bandits are burning the village barns.'],
        ['El camino del molino', 'The mill road', 'todos', 'bbaa', null, 'Cortan el paso a los carros de grano.', 'They block the grain carts.'],
        ['El Capitán Rojo', 'Captain Red', 'jefe', 'bab', 'rojo', 'El lugarteniente de Garra Negra vigila el vado.', 'Blackclaw\'s lieutenant guards the ford.'],
        ['Lobos del páramo', 'Moor wolves', 'tiempo', 'lllll', null, 'Una manada hambrienta acecha los rebaños. ¡Rápido!', 'A hungry pack stalks the flocks. Hurry!', 60],
        ['El puente viejo', 'The old bridge', 'sobrevive', 'bba', null, 'Aguanta en el puente hasta que lleguen los aldeanos.', 'Hold the bridge until the villagers arrive.', 40, [[14, 'bb'], [28, 'ab']]],
        ['La guarida de Garra Negra', 'Blackclaw\'s lair', 'jefe', 'bbaa', 'garra', 'El señor de los bandidos te espera en su fortín.', 'The bandit lord awaits you in his fort.']
      ] },
    { es: 'El Bosque Umbrío', en: 'The Gloomwood', fondo: 'pantano', lab: [700, 1515],
      hes: 'En lo profundo del bosque, la bruja Zarza ha despertado a los trasgos. Sus hechizos secan los árboles y envenenan los ríos.',
      hen: 'Deep in the woods, the witch Bramble has woken the goblins. Her spells wither the trees and poison the rivers.',
      pos: [[760, 1790], [880, 1680], [650, 1630], [420, 1690], [310, 1560], [530, 1430]],
      mis: [
        ['La senda de los trasgos', 'Goblin trail', 'todos', 'tttc', null, 'Los trasgos han tomado el sendero del bosque.', 'Goblins have taken the forest trail.'],
        ['Emboscada en la niebla', 'Ambush in the mist', 'sobrevive', 'ttl', null, '¡Una emboscada! Resiste hasta que se levante la niebla.', 'An ambush! Hold out until the mist lifts.', 40, [[12, 'ttt'], [25, 'tc']]],
        ['Colmillo, el lobo alfa', 'Fang, the alpha wolf', 'jefe', 'lll', 'alfa', 'El lobo alfa de la bruja guarda el claro.', 'The witch\'s alpha wolf guards the clearing.'],
        ['El lago envenenado', 'The poisoned lake', 'todos', 'ttcct', null, 'Los chamanes envenenan el agua. Detenlos.', 'Shamans are poisoning the water. Stop them.'],
        ['El círculo de chamanes', 'The shaman circle', 'tiempo', 'ccctt', null, 'Interrumpe el ritual antes de que termine.', 'Break the ritual before it ends.', 55],
        ['El árbol de la bruja', 'The witch\'s tree', 'jefe', 'tcct', 'zarza', 'Zarza se esconde en el árbol más viejo del bosque.', 'Bramble hides in the oldest tree of the forest.']
      ] },
    { es: 'Los Montes de Hierro', en: 'The Iron Peaks', fondo: 'nieve', lab: [540, 1190],
      hes: 'Gorlak el Rompemuros y sus troles han tomado las minas de hierro. Sin ese metal, el reino no podrá forjar armas.',
      hen: 'Gorlak the Wallbreaker and his trolls have seized the iron mines. Without that metal, the kingdom cannot forge weapons.',
      pos: [[720, 1250], [865, 1130], [625, 1060], [400, 1120], [305, 965], [560, 820]],
      mis: [
        ['El paso helado', 'The frozen pass', 'todos', 'ottt', null, 'Un ogro y sus trasgos bloquean el paso.', 'An ogre and his goblins block the pass.'],
        ['La mina abandonada', 'The abandoned mine', 'todos', 'rtto', null, 'Algo enorme se mueve en la oscuridad de la mina.', 'Something huge moves in the darkness of the mine.'],
        ['El capataz de la forja', 'The forge foreman', 'jefe', 'oo', 'brusco', 'Brusco obliga a los mineros a trabajar para Gorlak.', 'Brusk forces the miners to work for Gorlak.'],
        ['Avalancha', 'Avalanche', 'sobrevive', 'ott', null, 'La nieve cae y los enemigos no paran de llegar. ¡Resiste!', 'Snow falls and enemies keep coming. Hold on!', 45, [[12, 'oo'], [26, 'rt']]],
        ['El puente de cadenas', 'The chain bridge', 'tiempo', 'orot', null, 'Cruza antes de que corten las cadenas.', 'Cross before they cut the chains.', 70],
        ['El trono de Gorlak', 'Gorlak\'s throne', 'jefe', 'ooro', 'gorlak', 'El Rompemuros te espera en la gran sala de la montaña.', 'The Wallbreaker awaits you in the mountain hall.']
      ] },
    { es: 'Las Tierras de Ceniza', en: 'The Ashlands', fondo: 'ceniza', lab: [560, 610],
      hes: 'Más allá de las montañas, el dragón Ignaroth ha despertado y un nigromante levanta a los muertos para servirle. Es la última batalla por el reino.',
      hen: 'Beyond the mountains, the dragon Ignaroth has woken and a necromancer raises the dead to serve it. It is the last battle for the kingdom.',
      pos: [[760, 640], [865, 520], [640, 450], [400, 520], [320, 375], [560, 195]],
      mis: [
        ['Campos de hueso', 'Bone fields', 'todos', 'eeeee', null, 'Los muertos se levantan de la ceniza.', 'The dead rise from the ash.'],
        ['La torre del nigromante', 'The necromancer\'s tower', 'todos', 'neeen', null, 'Derriba la torre donde nacen los esqueletos.', 'Bring down the tower where skeletons are born.'],
        ['El Caballero Negro', 'The Black Knight', 'jefe', 'ee', 'negro', 'Un caballero sin rostro guarda el camino del dragón.', 'A faceless knight guards the dragon\'s road.'],
        ['Gárgolas en el humo', 'Gargoyles in the smoke', 'tiempo', 'ggggg', null, 'Las gárgolas bajan del volcán. Acaba rápido.', 'Gargoyles swoop from the volcano. Finish fast.', 60],
        ['Las puertas de ceniza', 'The ash gates', 'sobrevive', 'eng', null, 'Mantén las puertas abiertas para tu ejército.', 'Keep the gates open for your army.', 50, [[12, 'ggg'], [25, 'een'], [38, 'ro']]],
        ['Ignaroth, el dragón de ceniza', 'Ignaroth, the ash dragon', 'jefe', 'nggn', 'ignaroth', 'El dragón despierta en su volcán. Por el reino.', 'The dragon wakes in its volcano. For the kingdom.']
      ] }
  ];
  var DIFS = [
    { k: 'normal', es: 'Normal', en: 'Normal', m: 1, p: 1, tinte: null },
    { k: 'elite', es: 'Élite', en: 'Elite', m: 2.1, p: 2.2, tinte: 'rgba(70,40,130,0.28)' },
    { k: 'pesadilla', es: 'Pesadilla', en: 'Nightmare', m: 4, p: 4, tinte: 'rgba(120,10,10,0.34)' }
  ];
  var LOGROS = [
    { id: 'prim', es: 'Primera victoria', en: 'First victory', des: ['Gana tu primera misión', 'Win your first mission'], ok: function () { return totalGanadas() >= 1; }, p: { oro: 3000, madera: 2000, obj: [['botella', 10]] } },
    { id: 'c1', es: 'Libertador del valle', en: 'Valley liberator', des: ['Completa el Capítulo 1', 'Complete Chapter 1'], ok: function () { return hecha('normal', 1, 6); }, p: { hierro: 800, pieza: 'raro', obj: [['botella', 20]] } },
    { id: 'c2', es: 'Guardián del bosque', en: 'Forest warden', des: ['Completa el Capítulo 2', 'Complete Chapter 2'], ok: function () { return hecha('normal', 2, 6); }, p: { hierro: 1500, obj: [['libro_gra', 1], ['botella', 25]] } },
    { id: 'c3', es: 'Señor de las minas', en: 'Lord of the mines', des: ['Completa el Capítulo 3', 'Complete Chapter 3'], ok: function () { return hecha('normal', 3, 6); }, p: { hierro: 3000, pieza: 'legendario', obj: [['botella', 30]] } },
    { id: 'c4', es: 'Matadragones', en: 'Dragonslayer', des: ['Completa el Capítulo 4', 'Complete Chapter 4'], ok: function () { return hecha('normal', 4, 6); }, p: { hierro: 5000, pieza: 'mitico', obj: [['botella', 40]] } },
    { id: 'e30', es: 'Estratega', en: 'Strategist', des: ['Consigue 30 estrellas', 'Earn 30 stars'], ok: function () { return totalEstrellas() >= 30; }, max: 30, prog: function () { return totalEstrellas(); }, p: { oro: 15000, obj: [['acel_1h', 2], ['botella', 20]] } },
    { id: 'perf', es: 'Victoria perfecta', en: 'Perfect victory', des: ['Gana a un jefe de capítulo con 3 ★', 'Beat a chapter boss with 3 ★'], ok: function () { return DIFS.some(function (d) { return [1, 2, 3, 4].some(function (c) { return estrellas(d.k, c, 6) >= 3; }); }); }, p: { pieza: 'legendario' } },
    { id: 'rep', es: 'Veterano', en: 'Veteran', des: ['Repite 10 misiones', 'Replay 10 missions'], ok: function () { return (st().nRep || 0) >= 10; }, max: 10, prog: function () { return st().nRep || 0; }, p: { madera: 8000, piedra: 8000, obj: [['acel_15m', 3]] } },
    { id: 'eli', es: 'Élite', en: 'Elite', des: ['Completa un capítulo en Élite', 'Complete a chapter on Elite'], ok: function () { return [1, 2, 3, 4].some(function (c) { return hecha('elite', c, 6); }); }, p: { hierro: 6000, pieza: 'legendario' } },
    { id: 'pes', es: 'Leyenda del reino', en: 'Kingdom legend', des: ['Completa un capítulo en Pesadilla', 'Complete a chapter on Nightmare'], ok: function () { return [1, 2, 3, 4].some(function (c) { return hecha('pesadilla', c, 6); }); }, p: { hierro: 12000, pieza: 'mitico' } }
  ];
  var HABN = { furia: ['Furia', 'Rage'], terremoto: ['Terremoto', 'Earthquake'], invocar: ['Llamada a la horda', 'Call the horde'], escudo: ['Piel de piedra', 'Stone skin'], fuego: ['Aliento de fuego', 'Fire breath'], drenar: ['Drenar vida', 'Life drain'], aullido: ['Aullido aterrador', 'Terrifying howl'] };
  var REP_DIA = 15; // repeticiones con premio por día

  // ======================= PROGRESO (se guarda en el estado del juego) =======================
  function st() { return G.datos(); }
  function clave(d, c, i) { return d + ':' + c + '-' + i; }
  function reg(d, c, i) { return st().m[clave(d, c, i)]; }
  function hecha(d, c, i) { var r = reg(d, c, i); return !!(r && r.n > 0); }
  function estrellas(d, c, i) { var r = reg(d, c, i); return r ? r.e || 0 : 0; }
  function difAnterior(d) { return d === 'pesadilla' ? 'elite' : d === 'elite' ? 'normal' : null; }
  function difAbierta(d) { var a = difAnterior(d); return !a || hecha(a, 1, 6); }
  function capAbierto(d, c) { var a = difAnterior(d); return difAbierta(d) && (c === 1 || hecha(d, c - 1, 6)) && (!a || hecha(a, c, 6)); }
  function disponible(d, c, i) { return capAbierto(d, c) && (i === 1 || hecha(d, c, i - 1)); }
  function totalEstrellas() { var t = 0, m = st().m; Object.keys(m).forEach(function (k) { t += m[k].e || 0; }); return t; }
  function totalGanadas() { var t = 0, m = st().m; Object.keys(m).forEach(function (k) { if (m[k].n) t++; }); return t; }
  function estCap(d, c) { var t = 0; for (var i = 1; i <= 6; i++) t += estrellas(d, c, i); return t; }
  function hoy() { var f = new Date(); return f.getFullYear() + '-' + (f.getMonth() + 1) + '-' + f.getDate(); }
  function repHoy() { var r = st().rep || {}; return r.d === hoy() ? r.n || 0 : 0; }
  function difActual() { return DIFS.filter(function (d) { return d.k === st().dif; })[0] || DIFS[0]; }
  // v9.03: CLASIFICACIÓN. Avance = misiones completadas (todas las dificultades) × 1000 + estrellas;
  // semana = puntos por cada victoria o barrido de esta semana (jefe ×3; Élite ×2, Pesadilla ×3)
  function puntosAvance() { return totalGanadas() * 1000 + Math.min(999, totalEstrellas()); }
  function semanaDatos() { var w = st().sem; if (!w || w.s !== G.semana()) { if (w && w.p > 0 && !w.cobrada) { st().semAnt = w; if (G.revisarSemana) setTimeout(G.revisarSemana, 500); } w = st().sem = { s: G.semana(), p: 0 }; } return w; } // la semana pasada se guarda hasta cobrar su premio
  function sumarSemana(M, veces) { semanaDatos().p += (M.esJefe ? 3 : 1) * (M.dif === 'pesadilla' ? 3 : M.dif === 'elite' ? 2 : 1) * (veces || 1); }
  function publicar() { if (!G || !G.cuenta || !G.cuenta()) return; if (totalGanadas()) G.rankPublicar('avance', puntosAvance()); var w = semanaDatos(); if (w.p > 0) G.rankPublicar('semana', w.p); }
  function logrosListos() { var l = st().logros; return LOGROS.filter(function (g) { return !l[g.id] && g.ok(); }).length; }

  // la misión ya preparada para la batalla
  function mision(c, i, dk) {
    var cap = CAPS[c - 1], m = cap.mis[i - 1], d = DIFS.filter(function (x) { return x.k === dk; })[0], gIdx = (c - 1) * 6 + (i - 1);
    var lista = m[3].split('').map(function (k) { var e = ENE[k]; return { ico: e.ico, nom: L(e.es, e.en), v: e.v, a: e.a, d: e.d, vel: e.vel, sana: e.sana }; });
    var jefe = m[4] ? JEFES[m[4]] : null;
    if (jefe) { var inv = jefe.invoca ? ENE[jefe.invoca] : null; lista.splice(Math.floor(lista.length / 2), 0, { ico: jefe.ico, nom: L(jefe.es, jefe.en), v: jefe.v, a: jefe.a, d: jefe.d, vel: jefe.vel, jefe: true, habs: jefe.habs, invoca: inv ? { ico: inv.ico, nom: L(inv.es, inv.en), v: inv.v * 0.6, a: inv.a * 0.7, d: inv.d, vel: inv.vel } : null }); }
    var refu = (m[8] || []).map(function (r) { return { t: r[0], l: r[1].split('').map(function (k) { var e = ENE[k]; return { ico: e.ico, nom: L(e.es, e.en), v: e.v * 0.8, a: e.a, d: e.d, vel: e.vel, sana: e.sana }; }) }; });
    var n = 1 + gIdx * 1.6, f = Math.pow(1.13, n - 1) * 1.4 * d.m;
    var obj = m[2], seg = m[7] || 0, t3 = obj === 'tiempo' ? Math.round(seg * 0.6) : 30 + 6 * lista.length;
    var objTxt = obj === 'jefe' ? L('Derrota a ', 'Defeat ') + (jefe ? L(jefe.es, jefe.en).split(',')[0] : '') : obj === 'tiempo' ? L('Vence en menos de ' + seg + ' s', 'Win in under ' + seg + ' s') : obj === 'sobrevive' ? L('Resiste ' + seg + ' s', 'Survive ' + seg + ' s') : L('Derrota a todos los enemigos', 'Defeat all enemies');
    return { c: c, i: i, dif: dk, gIdx: gIdx, titulo: c + '-' + i + ' · ' + L(m[0], m[1]), corto: L(cap.es, cap.en), num: c + '-' + i, historia: L(m[5], m[6]), fondo: cap.fondo, obj: obj, seg: seg, t3: t3, objTxt: objTxt, enemigos: lista, refuerzos: refu, f: f, jefe: jefe, dm: d.p, esJefe: i === 6, especial: !!jefe && i !== 6 };
  }
  // v9.05: BOTELLAS. Normal 1, especial 2, jefe 3; Élite ×2, Pesadilla ×3. Si pierdes, se devuelven todas menos 1
  function coste(M) { return (M.esJefe ? 3 : M.especial ? 2 : 1) * (M.dif === 'pesadilla' ? 3 : M.dif === 'elite' ? 2 : 1); }
  function botellas() { return G.botellas ? G.botellas() : 0; }
  var PACKS = [[10, 50], [30, 120], [100, 350]]; // [botellas, gemas]
  function condEstrellas(M) {
    return [L('Gana la batalla', 'Win the battle'), L('Ningún héroe cae', 'No hero falls'), M.obj === 'sobrevive' ? L('Termina con más del 50 % de vida', 'Finish above 50 % health') : L('Gana en menos de ' + M.t3 + ' s', 'Win in under ' + M.t3 + ' s')];
  }
  var RAR = ['comun', 'raro', 'legendario', 'mitico'];
  function premiosBase(M) {
    var g = M.gIdx, k = (1 + g * 0.35) * M.dm, tier = Math.min(3, Math.floor((M.c - 1) / 2) + 1 + (M.dif === 'elite' ? 1 : M.dif === 'pesadilla' ? 2 : 0));
    return {
      oro: 900 * k, madera: 700 * k, piedra: 550 * k, hierro: M.c >= 2 || M.dif !== 'normal' ? 220 * k : 0,
      expH: Math.round((40 + 15 * g) * M.dm), expR: Math.round((20 + 6 * g) * M.dm), frag: 2 + Math.floor(g / 4) + (M.esJefe ? 3 : 0),
      obj: [[M.esJefe ? (M.dif === 'normal' ? 'acel_1h' : 'acel_1h') : M.i % 3 === 0 ? 'acel_15m' : 'acel_5m', M.esJefe ? 1 + (M.dif === 'pesadilla' ? 1 : 0) : 1]].concat(M.esJefe ? [['libro_gra', 1]] : M.i % 2 ? [['libro_peq', 1]] : []),
      pieza: M.esJefe ? RAR[tier] : M.especial ? RAR[Math.max(0, tier - 1)] : null, piezaProb: M.esJefe || M.especial ? 1 : 0.25, piezaR: RAR[Math.max(0, tier - 1)]
    };
  }
  function premiosRepetir(p) { return { oro: p.oro * 0.35, madera: p.madera * 0.35, piedra: p.piedra * 0.35, hierro: p.hierro * 0.35, expH: Math.round(p.expH * 0.5), expR: Math.round(p.expR * 0.4), frag: 1, obj: [['acel_5m', 1]], pieza: null, piezaProb: 0.08, piezaR: p.piezaR }; }
  function premioTres(M) { var k = (1 + M.gIdx * 0.3) * M.dm; return { hierro: 300 * k, obj: [['acel_15m', 1], ['libro_peq', 1]], pieza: Math.random() < 0.5 ? RAR[Math.min(3, Math.floor((M.c - 1) / 2) + (M.dif === 'normal' ? 0 : 1))] : null }; }
  function premioCofre(c, n, dm) { var k = (1 + (c - 1) * 2) * dm; return n === 1 ? { madera: 4000 * k, piedra: 4000 * k, obj: [['acel_15m', 2], ['botella', 5]] } : n === 2 ? { hierro: 1500 * k, obj: [['libro_gra', 1], ['acel_1h', 1], ['botella', 10]] } : { oro: 20000 * k, pieza: RAR[Math.min(3, c - 1 + (dm > 1 ? 1 : 0))], obj: [['acel_1h', 2], ['botella', 20]] }; }

  // ======================= EL MUNDO =======================
  var WW = 1000, WH = 2400;
  var BASES = [0, 700, 1300, 1850, 2400];
  function bordeY(i, x) { var b = BASES[i]; if (i === 0 || i === 4) return b; return b + 34 * Math.sin(x / 120 + i * 1.7) + 16 * Math.sin(x / 41 + i); }
  function capDeY(x, y) { for (var i = 1; i <= 4; i++) if (y < bordeY(i, x)) return 5 - i; return 1; } // capítulo 4 arriba, 1 abajo
  function costa(y) { return 150 + 40 * Math.sin(y / 210) + 22 * Math.sin(y / 67 + 1); }
  var INICIO = [520, 2310];
  var RIO = (function () { var p = [], y; for (y = 760; y <= 1760; y += 20) p.push([760 - (y - 760) * 0.36 + 70 * Math.sin(y / 140), y]); for (y = 1780; y <= 2140; y += 20) p.push([p[p.length - 1][0] - 22 + 10 * Math.sin(y / 60), y]); return p; })();
  var LAGO = [560, 1570, 70, 44];
  function rnd0(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  // caminos: inicio → misiones en orden (curvas suaves)
  var CAMINO = []; // [{ a:[x,y], b:[x,y], q:[x,y], c, i }]
  (function () {
    var prev = INICIO, k = 0;
    CAPS.forEach(function (cap, ci) { cap.pos.forEach(function (p, mi) { var mx = (prev[0] + p[0]) / 2, my = (prev[1] + p[1]) / 2, dx = p[0] - prev[0], dy = p[1] - prev[1], l = Math.hypot(dx, dy) || 1, o = (k++ % 2 ? 1 : -1) * Math.min(45, l * 0.2); CAMINO.push({ a: prev, b: p, q: [mx - dy / l * o, my + dx / l * o], c: ci + 1, i: mi + 1 }); prev = p; }); });
  })();
  function enCurva(s, t) { var u = 1 - t; return [u * u * s.a[0] + 2 * u * t * s.q[0] + t * t * s.b[0], u * u * s.a[1] + 2 * u * t * s.q[1] + t * t * s.b[1]]; }

  // ---- lo que no debe taparse con árboles ----
  var ocupado = {};
  function marcar(x, y, r) { for (var gx = Math.floor((x - r) / 40); gx <= Math.floor((x + r) / 40); gx++) for (var gy = Math.floor((y - r) / 40); gy <= Math.floor((y + r) / 40); gy++) (ocupado[gx + ',' + gy] = ocupado[gx + ',' + gy] || []).push([x, y, r]); }
  function libre(x, y, r) { var l = ocupado[Math.floor(x / 40) + ',' + Math.floor(y / 40)]; if (!l) return true; for (var k = 0; k < l.length; k++) if (Math.hypot(l[k][0] - x, l[k][1] - y) < l[k][2] + r) return false; return true; }

  // ======================= PINTAR EL MAPA (una vez) =======================
  // v9.01: relieve de verdad. Se calcula un mapa de alturas con ruido (colinas, montañas rocosas, volcán),
  // se colorea por región, altura y pendiente, y se ilumina desde el noroeste (como un mapa pintado).
  // Encima van el agua, los caminos, miles de árboles con sombra, aldeas y castillos.
  var PERM = (function () { var p = [], R = rnd0(97), i, j, t; for (i = 0; i < 256; i++) p[i] = i; for (i = 255; i > 0; i--) { j = Math.floor(R() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; } return p.concat(p); })();
  function hsh(ix, iy) { return PERM[(PERM[ix & 255] + iy) & 255] / 255; }
  function ruido(x, y) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hsh(ix, iy), b = hsh(ix + 1, iy), c = hsh(ix, iy + 1), d = hsh(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o) { var s = 0, a = 0.5, n = 0; for (var i = 0; i < o; i++) { s += a * ruido(x, y); n += a; a *= 0.5; x = x * 2.03 + 17.3; y = y * 2.03 + 31.7; } return s / n; }
  function cresta(x, y, o) { var s = 0, a = 0.5, n = 0; for (var i = 0; i < o; i++) { var r = 1 - Math.abs(ruido(x, y) * 2 - 1); s += a * r * r; n += a; a *= 0.5; x = x * 2.1 + 5.1; y = y * 2.1 + 9.3; } return s / n; }
  function suave(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  // distancia (aprox.) a una lista de puntos, en una rejilla de 8 unidades
  function campoDist(pts) {
    var C = 8, w = Math.ceil(WW / C) + 1, h = Math.ceil(WH / C) + 1, d = new Float32Array(w * h), i, x, y, v;
    for (i = 0; i < d.length; i++) d[i] = 1e6;
    pts.forEach(function (p) { var gx = Math.round(p[0] / C), gy = Math.round(p[1] / C); if (gx >= 0 && gy >= 0 && gx < w && gy < h) d[gy * w + gx] = 0; });
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = y * w + x; v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0) { v = Math.min(v, d[i - w] + 1); if (x > 0) v = Math.min(v, d[i - w - 1] + 1.414); if (x < w - 1) v = Math.min(v, d[i - w + 1] + 1.414); } d[i] = v; }
    for (y = h - 1; y >= 0; y--) for (x = w - 1; x >= 0; x--) { i = y * w + x; v = d[i]; if (x < w - 1) v = Math.min(v, d[i + 1] + 1); if (y < h - 1) { v = Math.min(v, d[i + w] + 1); if (x < w - 1) v = Math.min(v, d[i + w + 1] + 1.414); if (x > 0) v = Math.min(v, d[i + w - 1] + 1.414); } d[i] = v; }
    return function (px, py) { var gx = Math.max(0, Math.min(w - 1, Math.round(px / C))), gy = Math.max(0, Math.min(h - 1, Math.round(py / C))); return d[gy * w + gx] * C; };
  }
  function rioPuntos() { var l = [], k, j; for (k = 0; k < RIO.length - 1; k++) for (j = 0; j < 4; j++) l.push([RIO[k][0] + (RIO[k + 1][0] - RIO[k][0]) * j / 4, RIO[k][1] + (RIO[k + 1][1] - RIO[k][1]) * j / 4]); var u = RIO[RIO.length - 1]; for (k = u[0]; k > costa(u[1]) - 20; k -= 5) l.push([k, u[1] + (u[0] - k) * 0.15]); return l; }
  var VOLCAN = [880, 150];
  function mezcla(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  var CO = { pasto1: hex('#6f9a3c'), pasto2: hex('#a7b552'), bosque1: hex('#2f5524'), bosque2: hex('#4c7330'), monteV: hex('#5a7438'), roca1: hex('#7c7a70'), roca2: hex('#a39f92'), nieve: hex('#eef3f6'), ceniza1: hex('#3a2820'), ceniza2: hex('#6e4c3a'), lava: hex('#ff6a1a'), arena: hex('#d8c28a'), mar1: hex('#1a4a6e'), mar2: hex('#3fa7ae'), tierra: hex('#8a7044') };

  var terreno = null, nieblas = {}, RES = 1, banderas = [], barcos = [], brillos = [], molinos = [], humos = [];
  function pintarMundo() {
    ocupado = {}; banderas = []; brillos = [];
    var R = rnd0(11), i, k, x, y;
    CAMINO.forEach(function (s) { for (var t = 0; t <= 1; t += 0.05) { var p = enCurva(s, t); marcar(p[0], p[1], 20); } });
    RIO.forEach(function (p) { marcar(p[0], p[1], 22); });
    marcar(LAGO[0], LAGO[1], LAGO[2] + 12); marcar(INICIO[0], INICIO[1], 72);
    CAPS.forEach(function (cap) { cap.pos.forEach(function (p, mi) { marcar(p[0], p[1], mi === 5 ? 64 : 38); }); });
    var ptsCam = []; CAMINO.forEach(function (s) { for (var t = 0; t <= 1; t += 0.02) ptsCam.push(enCurva(s, t)); });
    var dCam = campoDist(ptsCam), dRio = campoDist(rioPuntos());

    // ---------- 1. relieve (en baja resolución, luego se estira suave) ----------
    var S = 0.42, GW = Math.round(WW * S), GH = Math.round(WH * S), N = GW * GH;
    var HA = new Float32Array(N), BW = new Float32Array(N * 4), NZ = new Float32Array(N);
    for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) {
      var wx = x / S, wy = y / S, j = y * GW + x;
      var b1 = bordeY(1, wx), b2 = bordeY(2, wx), b3 = bordeY(3, wx);
      var s1 = suave(b1 - 70, b1 + 70, wy), s2 = suave(b2 - 70, b2 + 70, wy), s3 = suave(b3 - 60, b3 + 60, wy);
      var w4 = 1 - s1, w3 = s1 * (1 - s2), w2 = s2 * (1 - s3), w1 = s3;
      var n = fbm(wx / 170, wy / 170, 5), h = w1 * (0.30 + 0.2 * n) + w2 * (0.33 + 0.24 * n);
      if (w3 > 0.01) { var cr = cresta(wx / 190 + 3, wy / 190, 4), norte = 1 - suave(BASES[1], BASES[2], wy) * 0.55; h += w3 * (0.36 + 0.78 * cr * (0.45 + 0.7 * n) * norte); }
      if (w4 > 0.01) { var c4 = cresta(wx / 150, wy / 150 + 7, 4), dv = Math.hypot(wx - VOLCAN[0], wy - VOLCAN[1]); h += w4 * (0.34 + 0.34 * c4 * n + 0.62 * Math.exp(-dv * dv / (2 * 130 * 130)) - 0.25 * Math.exp(-dv * dv / (2 * 22 * 22))); }
      var dc = dCam(wx, wy), kc = Math.exp(-dc * dc / (2 * 34 * 34)); h = h * (1 - kc * 0.65) + kc * 0.65 * Math.min(h, 0.40 + 0.08 * n); // pasos por donde va el camino
      var dr = dRio(wx, wy); h -= 0.13 * Math.exp(-dr * dr / (2 * 34 * 34));
      var dl = Math.hypot((wx - LAGO[0]) / (LAGO[2] + 40), (wy - LAGO[1]) / (LAGO[3] + 40)); if (dl < 1.4) h -= 0.1 * (1.4 - dl);
      var ct = costa(wy) + 14 * (fbm(wy / 40, 3.3, 2) - 0.5); h *= 0.55 + 0.45 * suave(ct - 10, ct + 90, wx);
      HA[j] = h; BW[j * 4] = w1; BW[j * 4 + 1] = w2; BW[j * 4 + 2] = w3; BW[j * 4 + 3] = w4; NZ[j] = ct;
    }
    function alt(px, py) { var gx = Math.max(0, Math.min(GW - 1, Math.round(px * S))), gy = Math.max(0, Math.min(GH - 1, Math.round(py * S))); return HA[gy * GW + gx]; }
    function bio(px, py, k2) { var gx = Math.max(0, Math.min(GW - 1, Math.round(px * S))), gy = Math.max(0, Math.min(GH - 1, Math.round(py * S))); return BW[(gy * GW + gx) * 4 + k2]; }
    function pendiente(px, py) { return Math.abs(alt(px + 4, py) - alt(px - 4, py)) + Math.abs(alt(px, py + 4) - alt(px, py - 4)); }
    var rel = document.createElement('canvas'); rel.width = GW; rel.height = GH;
    var rg = rel.getContext('2d'), img = rg.createImageData(GW, GH), D = img.data, L0 = -0.55, L1 = -0.65, L2 = 0.52, Ln = Math.hypot(L0, L1, L2);
    L0 /= Ln; L1 /= Ln; L2 /= Ln;
    for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) {
      var q = y * GW + x, wx2 = x / S, wy2 = y / S, col, luz = 1, hh = HA[q];
      if (wx2 < NZ[q]) { // mar
        var prof = Math.min(1, (NZ[q] - wx2) / 130), fn = fbm(wx2 / 30, wy2 / 30, 2);
        col = mezcla(CO.mar2, CO.mar1, Math.min(1, prof * 1.3 + fn * 0.15));
        if (wy2 < 720) col = mezcla(col, [20, 30, 40], 0.35);
      } else {
        var e1 = BW[q * 4], e2 = BW[q * 4 + 1], e3 = BW[q * 4 + 2], e4 = BW[q * 4 + 3], n2 = fbm(wx2 / 38, wy2 / 38, 3);
        var hx = HA[q + (x < GW - 1 ? 1 : 0)] - HA[q - (x > 0 ? 1 : 0)], hy = HA[q + (y < GH - 1 ? GW : 0)] - HA[q - (y > 0 ? GW : 0)];
        var Z = 9, nx = -hx * Z, ny = -hy * Z, nl = Math.hypot(nx, ny, 1), pend = Math.hypot(hx, hy) * 14;
        luz = Math.max(0, (nx * L0 + ny * L1 + L2) / nl);
        var c1 = mezcla(CO.pasto1, CO.pasto2, n2), c2 = mezcla(CO.bosque1, CO.bosque2, n2);
        var c3 = hh < 0.5 ? mezcla(CO.monteV, CO.roca1, suave(0.38, 0.5, hh)) : mezcla(CO.roca1, CO.roca2, n2);
        c3 = mezcla(c3, CO.roca1, Math.min(1, pend * 0.6)); if (hh > 0.72) c3 = mezcla(c3, CO.nieve, suave(0.72, 0.84, hh + (n2 - 0.5) * 0.08) * (1 - Math.min(0.7, pend * 0.4)));
        var c5 = mezcla(CO.ceniza1, CO.ceniza2, n2), lv = fbm(wx2 / 55, wy2 / 55, 3);
        col = [c1[0] * e1 + c2[0] * e2 + c3[0] * e3 + c5[0] * e4, c1[1] * e1 + c2[1] * e2 + c3[1] * e3 + c5[1] * e4, c1[2] * e1 + c2[2] * e2 + c3[2] * e3 + c5[2] * e4];
        var dcos = wx2 - NZ[q]; if (dcos < 22) col = mezcla(CO.arena, col, suave(6, 22, dcos));
        var drr = dRio(wx2, wy2); if (drr < 46) col = mezcla(col, [col[0] * 0.75, col[1] * 0.85, col[2] * 0.7], 1 - drr / 46);
        if (e4 > 0.5 && Math.abs(lv - 0.5) < 0.007 && hh < 0.56 && n2 > 0.48) { col = mezcla(col, CO.lava, (e4 - 0.5) * 2); luz = 1.05; }
      }
      var f = wx2 < NZ[q] ? 1 : 0.5 + 0.78 * luz, sombra = 1 - f;
      D[q * 4] = Math.min(255, col[0] * f - sombra * 8); D[q * 4 + 1] = Math.min(255, col[1] * f - sombra * 4); D[q * 4 + 2] = Math.min(255, col[2] * f + sombra * 14); D[q * 4 + 3] = 255;
    }
    rg.putImageData(img, 0, 0);
    var c = document.createElement('canvas'); c.width = Math.round(WW * RES); c.height = Math.round(WH * RES);
    var g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(rel, 0, 0, c.width, c.height); g.scale(RES, RES);
    rel = null; img = null;
    // grano fino para que no se vea liso
    for (k = 0; k < 9000; k++) { x = R() * WW; y = R() * WH; if (x < costa(y)) continue; g.fillStyle = R() < 0.5 ? 'rgba(255,255,230,0.07)' : 'rgba(0,20,0,0.09)'; g.fillRect(x, y, 1.5 + R() * 2.5, 1 + R() * 1.5); }

    // ---------- 2. agua: espuma de la costa, olas, río y lago ----------
    for (i = 0; i < 2; i++) { g.lineWidth = i ? 1.2 : 3; g.strokeStyle = i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'; g.beginPath(); for (y = 0; y <= WH; y += 12) g.lineTo(costa(y) + 14 * (fbm(y / 40, 3.3, 2) - 0.5) - 3 - i * 6, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1.1; for (k = 0; k < 170; k++) { y = R() * WH; x = R() * (costa(y) - 20); g.beginPath(); g.arc(x, y, 5 + R() * 7, 3.5, 5.9); g.stroke(); }
    barcos = [[70, 2050], [95, 1380], [60, 820]];
    var RP = rioPuntos();
    function trazo(ancho, color) { g.lineWidth = ancho; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); RP.forEach(function (p, j2) { if (j2) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); }
    trazo(30, 'rgba(40,60,25,0.35)'); trazo(22, '#2a6f86'); trazo(15, '#3a96ad'); trazo(7, '#5cc0cc'); trazo(2, 'rgba(255,255,255,0.45)');
    for (k = 0; k < RP.length; k += 9) brillos.push([RP[k][0], RP[k][1]]);
    g.fillStyle = 'rgba(40,60,25,0.4)'; g.beginPath(); g.ellipse(LAGO[0], LAGO[1], LAGO[2] + 10, LAGO[3] + 9, 0.2, 0, 7); g.fill();
    var gl = g.createRadialGradient(LAGO[0] - 20, LAGO[1] - 10, 5, LAGO[0], LAGO[1], LAGO[2]); gl.addColorStop(0, '#6ccad2'); gl.addColorStop(0.6, '#3a96ad'); gl.addColorStop(1, '#22607e'); g.fillStyle = gl; g.beginPath(); g.ellipse(LAGO[0], LAGO[1], LAGO[2], LAGO[3], 0.2, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(LAGO[0], LAGO[1], LAGO[2] - 4, LAGO[3] - 4, 0.2, 3.6, 5.2); g.stroke();

    // ---------- 3. campos y aldeas del valle ----------
    [[300, 2290], [760, 2290], [860, 2200], [250, 2080], [700, 1940]].forEach(function (a) { for (k = 0; k < 7; k++) { x = a[0] + R() * 130 - 65; y = a[1] + R() * 80 - 40; if (!libre(x, y, 24) || x < costa(y) + 30) continue; marcar(x, y, 24); g.save(); g.translate(x, y); g.rotate(R() * 0.8 - 0.4); var cf = ['#cdb55a', '#9fb855', '#c29a48', '#86ad48', '#d9c878'][Math.floor(R() * 5)]; g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-21, -12, 46, 28); g.fillStyle = cf; g.fillRect(-23, -14, 46, 28); g.strokeStyle = 'rgba(70,50,15,0.28)'; g.lineWidth = 1; for (var q2 = -20; q2 < 23; q2 += 4) { g.beginPath(); g.moveTo(q2, -14); g.lineTo(q2, 14); g.stroke(); } g.strokeStyle = 'rgba(90,60,25,0.7)'; g.lineWidth = 1.5; g.strokeRect(-23, -14, 46, 28); g.restore(); } });
    var cosas = [];
    [[300, 2140, 10], [880, 2280, 7], [235, 1840, 5], [720, 1360, 5], [880, 900, 4]].forEach(function (a) { for (k = 0; k < a[2]; k++) { x = a[0] + R() * 90 - 45; y = a[1] + R() * 60 - 30; if (libre(x, y, 11)) { marcar(x, y, 11); cosas.push([x, y, 'casa', 0.9 + R() * 0.3, 0]); } } });

    // ---------- 4. caminos ----------
    CAMINO.forEach(function (s) { for (var t = 0; t <= 1; t += 0.02) { var p = enCurva(s, t); if (dRio(p[0], p[1]) < 9 && !s.puente) s.puente = p; } });
    CAMINO.forEach(function (s) { [[15, 'rgba(50,32,12,0.45)'], [10, '#a8875a'], [6, '#c4a372']].forEach(function (z) { g.lineWidth = z[0]; g.strokeStyle = z[1]; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.a[0], s.a[1]); g.quadraticCurveTo(s.q[0], s.q[1], s.b[0], s.b[1]); g.stroke(); }); for (var t = 0; t < 1; t += 0.03) { var p = enCurva(s, t + R() * 0.03); g.fillStyle = R() < 0.5 ? 'rgba(90,65,35,0.5)' : 'rgba(230,210,170,0.5)'; g.fillRect(p[0] + R() * 8 - 4, p[1] + R() * 8 - 4, 1.6, 1.6); } });
    CAMINO.forEach(function (s) { if (!s.puente) return; var p = s.puente, an = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]); g.save(); g.translate(p[0], p[1]); g.rotate(an); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-21, -7, 44, 18); g.fillStyle = '#9a9488'; g.fillRect(-22, -9, 44, 18); g.fillStyle = '#b8b2a4'; for (var q3 = -20; q3 < 21; q3 += 6) g.fillRect(q3, -8, 5, 16); g.fillStyle = '#6a655c'; g.fillRect(-22, -12, 44, 4); g.fillRect(-22, 8, 44, 4); g.restore(); });

    // ---------- 5. árboles, rocas y edificios (ordenados de arriba abajo) ----------
    for (k = 0; k < 16000; k++) {
      x = 120 + R() * (WW - 120); y = R() * WH; if (x < costa(y) + 18) continue;
      var e1b = bio(x, y, 0), e2b = bio(x, y, 1), e3b = bio(x, y, 2), e4b = bio(x, y, 3), hb = alt(x, y), pb = pendiente(x, y);
      if (dCam(x, y) < 17 || dRio(x, y) < 15 || !libre(x, y, 6)) continue;
      var arb = fbm(x / 120 + 40, y / 120, 3), dens = e1b * (arb > 0.56 ? 0.9 : 0.02) + e2b * (arb > 0.3 ? 0.95 : 0.35) + e3b * (hb < 0.66 && pb < 0.09 ? 0.75 : 0.02) + e4b * 0.05;
      if (R() > dens) continue;
      var tipo = e4b > 0.5 ? 'seco' : (e3b > 0.4 || (e2b > 0.5 && R() < 0.45) || (e1b > 0.5 && R() < 0.2)) ? 'pino' : 'arbol';
      cosas.push([x, y, tipo, 0.75 + R() * 0.55, hb]);
    }
    for (k = 0; k < 900; k++) { x = 160 + R() * 840; y = 40 + R() * 1260; if (x < costa(y) + 20 || dCam(x, y) < 18 || !libre(x, y, 8)) continue; var pr = pendiente(x, y); if (pr > 0.08 && R() < 0.5) cosas.push([x, y, 'roca', 0.7 + R() * 0.8, alt(x, y)]); }
    molinos = []; humos = [];
    [[230, 2230], [880, 2120], [300, 1990]].forEach(function (q) { if (libre(q[0], q[1], 16)) { marcar(q[0], q[1], 16); cosas.push([q[0], q[1], 'molino', 1, 0]); } });
    [[880, 1010], [330, 1190], [760, 900]].forEach(function (q) { if (libre(q[0], q[1], 18)) { marcar(q[0], q[1], 18); cosas.push([q[0], q[1], 'mina', 1, 0]); } });
    [[300, 600], [700, 300], [460, 260], [860, 400]].forEach(function (q) { if (libre(q[0], q[1], 18)) { marcar(q[0], q[1], 18); cosas.push([q[0], q[1], 'ruina', 1, 0]); } });
    [[470, 2100], [760, 1880], [560, 1330], [330, 820]].forEach(function (q) { if (libre(q[0], q[1], 14)) { marcar(q[0], q[1], 14); cosas.push([q[0], q[1], 'atalaya', 1, 0]); } });
    cosas.push([INICIO[0], INICIO[1] - 6, 'reino', 1.25, 0]);
    CAPS.forEach(function (cap, ci) { cap.pos.forEach(function (p, mi) { var jj = cap.mis[mi]; if (mi === 5) cosas.push([p[0] + 2, p[1] - 32, 'fortaleza', 1, ci]); else if (jj[4]) cosas.push([p[0] + 32, p[1] - 16, 'torre', 1, ci]); else cosas.push([p[0] + 30, p[1] - 10, 'campo', 1, ci]); }); });
    cosas.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (o) { dibujarCosa(g, o, R); });
    // brillo de lava del volcán
    var gv2 = g.createRadialGradient(VOLCAN[0], VOLCAN[1], 3, VOLCAN[0], VOLCAN[1], 60); gv2.addColorStop(0, 'rgba(255,220,90,0.95)'); gv2.addColorStop(0.35, 'rgba(255,90,20,0.7)'); gv2.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = gv2; g.beginPath(); g.arc(VOLCAN[0], VOLCAN[1], 60, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,110,30,0.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(VOLCAN[0] - 4, VOLCAN[1] + 8); g.bezierCurveTo(VOLCAN[0] - 30, VOLCAN[1] + 60, VOLCAN[0] - 10, VOLCAN[1] + 110, VOLCAN[0] - 40, VOLCAN[1] + 170); g.stroke();
    // ---------- 6. viñeta ----------
    var gv = g.createRadialGradient(WW / 2, WH / 2, WW * 0.45, WW / 2, WH / 2, WH * 0.8); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(20,10,0,0.3)'); g.fillStyle = gv; g.fillRect(0, 0, WW, WH);
    terreno = c; HA = BW = NZ = null;
    for (var r = 1; r <= 4; r++) nieblas[r] = pintarNiebla(r);
  }
  var PAL_ARB = [['#244a1c', '#356a26', '#5f9a3a'], ['#2a5220', '#3f7a2c', '#74a844'], ['#30501c', '#4a7026', '#86a840'], ['#3a5a1a', '#5a7a26', '#a0b048']];
  function dibujarCosa(g, o, R) {
    var x = o[0], y = o[1], t = o[2], s = o[3], k;
    g.fillStyle = 'rgba(0,0,0,0.28)';
    if (t === 'arbol') {
      var pal = PAL_ARB[Math.floor(R() * PAL_ARB.length)];
      g.beginPath(); g.ellipse(x + 5 * s, y + 1, 9 * s, 3.6 * s, 0.25, 0, 7); g.fill();
      g.fillStyle = '#4a3018'; g.fillRect(x - 1.3 * s, y - 6 * s, 2.6 * s, 7 * s);
      g.fillStyle = pal[0]; g.beginPath(); g.arc(x + 1 * s, y - 10 * s, 8.5 * s, 0, 7); g.fill();
      g.fillStyle = pal[1]; g.beginPath(); g.arc(x - 1.5 * s, y - 11.5 * s, 6.8 * s, 0, 7); g.fill(); g.beginPath(); g.arc(x + 3 * s, y - 13 * s, 4.5 * s, 0, 7); g.fill();
      g.fillStyle = pal[2]; g.beginPath(); g.arc(x - 3 * s, y - 14 * s, 3.4 * s, 0, 7); g.fill();
    }
    else if (t === 'pino') {
      var nev = o[4] > 0.62;
      g.beginPath(); g.ellipse(x + 6 * s, y + 1, 8 * s, 3 * s, 0.3, 0, 7); g.fill();
      g.fillStyle = '#3a2614'; g.fillRect(x - 1.2 * s, y - 4 * s, 2.4 * s, 5 * s);
      for (k = 0; k < 3; k++) {
        var ty = y - (24 - k * 6) * s, by = y - (9 - k * 3) * s, an = (5 + k * 2.6) * s;
        g.fillStyle = '#2e5a3a'; g.beginPath(); g.moveTo(x, ty); g.lineTo(x - an, by); g.lineTo(x, by + 1.5 * s); g.fill();
        g.fillStyle = '#1b3d2a'; g.beginPath(); g.moveTo(x, ty); g.lineTo(x + an, by); g.lineTo(x, by + 1.5 * s); g.fill();
        if (nev) { g.fillStyle = 'rgba(245,250,252,0.9)'; g.beginPath(); g.moveTo(x, ty); g.lineTo(x - an * 0.45, ty + (by - ty) * 0.45); g.lineTo(x + an * 0.3, ty + (by - ty) * 0.4); g.fill(); }
      }
      g.fillStyle = 'rgba(140,200,120,0.35)'; g.beginPath(); g.moveTo(x - 0.5 * s, y - 24 * s); g.lineTo(x - 3 * s, y - 17 * s); g.lineTo(x - 0.5 * s, y - 17 * s); g.fill();
    }
    else if (t === 'seco') { g.beginPath(); g.ellipse(x + 4 * s, y + 1, 6 * s, 2 * s, 0.3, 0, 7); g.fill(); g.strokeStyle = '#1e120c'; g.lineWidth = 1.7 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 15 * s); g.moveTo(x, y - 8 * s); g.lineTo(x - 6 * s, y - 14 * s); g.moveTo(x, y - 11 * s); g.lineTo(x + 5 * s, y - 18 * s); g.moveTo(x - 3 * s, y - 11 * s); g.lineTo(x - 7 * s, y - 12 * s); g.stroke(); }
    else if (t === 'roca') { var oscura = o[4] > 0 && y < 720; g.beginPath(); g.ellipse(x + 4 * s, y + 2, 9 * s, 3.5 * s, 0, 0, 7); g.fill(); g.fillStyle = oscura ? '#2e221c' : '#6a6860'; g.beginPath(); g.moveTo(x - 8 * s, y); g.lineTo(x - 5 * s, y - 8 * s); g.lineTo(x + 2 * s, y - 11 * s); g.lineTo(x + 8 * s, y - 4 * s); g.lineTo(x + 7 * s, y); g.fill(); g.fillStyle = oscura ? '#4a3a30' : '#9a978c'; g.beginPath(); g.moveTo(x - 5 * s, y - 8 * s); g.lineTo(x + 2 * s, y - 11 * s); g.lineTo(x, y - 3 * s); g.lineTo(x - 7 * s, y - 1 * s); g.fill(); }
    else if (t === 'casa') {
      g.beginPath(); g.ellipse(x + 5 * s, y + 2, 10 * s, 3.5 * s, 0.2, 0, 7); g.fill();
      g.fillStyle = '#efe6d0'; g.fillRect(x - 7 * s, y - 8 * s, 10 * s, 9 * s); g.fillStyle = '#c9bc9c'; g.fillRect(x + 3 * s, y - 8 * s, 5 * s, 9 * s);
      g.fillStyle = '#5a3a20'; g.fillRect(x - 6 * s, y - 8 * s, 1.2 * s, 9 * s); g.fillRect(x + 1.5 * s, y - 8 * s, 1.2 * s, 9 * s);
      var tj = y > 1800 ? ['#c4552e', '#8a3418'] : ['#7a5030', '#4a3018'];
      g.fillStyle = tj[0]; g.beginPath(); g.moveTo(x - 9 * s, y - 7 * s); g.lineTo(x - 1 * s, y - 15 * s); g.lineTo(x + 3 * s, y - 8 * s); g.fill();
      g.fillStyle = tj[1]; g.beginPath(); g.moveTo(x - 1 * s, y - 15 * s); g.lineTo(x + 9 * s, y - 8 * s); g.lineTo(x + 3 * s, y - 8 * s); g.fill();
      g.fillStyle = '#3a2210'; g.fillRect(x - 3 * s, y - 4 * s, 2.5 * s, 5 * s); g.fillStyle = '#ffd27a'; g.fillRect(x + 4.5 * s, y - 5 * s, 2 * s, 2 * s);
    }
    else if (t === 'molino') {
      g.beginPath(); g.ellipse(x + 7, y + 2, 13, 4, 0.2, 0, 7); g.fill();
      var gmo = g.createLinearGradient(x - 8, 0, x + 8, 0); gmo.addColorStop(0, '#f4ecd8'); gmo.addColorStop(1, '#b8a88a'); g.fillStyle = gmo; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x - 5, y - 26); g.lineTo(x + 5, y - 26); g.lineTo(x + 8, y); g.fill();
      g.fillStyle = '#8a3418'; g.beginPath(); g.moveTo(x - 7, y - 26); g.lineTo(x, y - 36); g.lineTo(x + 7, y - 26); g.fill(); g.fillStyle = '#3a2210'; g.fillRect(x - 2, y - 7, 4, 7); g.fillRect(x - 1.5, y - 18, 3, 3);
      molinos.push([x, y - 26]);
    }
    else if (t === 'mina') {
      g.beginPath(); g.ellipse(x + 6, y + 3, 18, 5, 0.1, 0, 7); g.fill();
      g.fillStyle = '#5a554e'; g.beginPath(); g.moveTo(x - 18, y + 2); g.quadraticCurveTo(x, y - 30, x + 18, y + 2); g.fill(); g.fillStyle = '#7a756c'; g.beginPath(); g.moveTo(x - 18, y + 2); g.quadraticCurveTo(x - 6, y - 26, x + 2, y - 14); g.lineTo(x - 6, y + 2); g.fill();
      g.fillStyle = '#120a06'; g.beginPath(); g.moveTo(x - 7, y + 2); g.lineTo(x - 7, y - 8); g.arc(x, y - 8, 7, Math.PI, 0); g.lineTo(x + 7, y + 2); g.fill();
      var gmi = g.createRadialGradient(x, y - 4, 1, x, y - 4, 9); gmi.addColorStop(0, 'rgba(255,170,60,0.85)'); gmi.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gmi; g.beginPath(); g.arc(x, y - 4, 9, 0, 7); g.fill();
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 8, y + 2); g.lineTo(x - 8, y - 9); g.lineTo(x + 8, y - 9); g.lineTo(x + 8, y + 2); g.stroke();
      g.strokeStyle = '#3a3632'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 2, y + 2); g.lineTo(x - 6, y + 16); g.moveTo(x + 2, y + 2); g.lineTo(x + 6, y + 16); g.stroke();
      g.fillStyle = '#4a3420'; g.fillRect(x - 4, y + 9, 8, 5); g.fillStyle = '#8a8a8a'; g.fillRect(x - 3, y + 8, 6, 2);
    }
    else if (t === 'ruina') {
      g.beginPath(); g.ellipse(x + 6, y + 3, 18, 5, 0.1, 0, 7); g.fill();
      [[-12, 18], [-3, 26], [7, 14], [15, 22]].forEach(function (q) { var gr3 = g.createLinearGradient(x + q[0] - 3, 0, x + q[0] + 3, 0); gr3.addColorStop(0, '#5a4a40'); gr3.addColorStop(1, '#2a201a'); g.fillStyle = gr3; g.fillRect(x + q[0] - 3, y - q[1], 6, q[1]); g.fillStyle = '#6a5a50'; g.fillRect(x + q[0] - 3.5, y - q[1] - 2, 7, 2.5); });
      g.fillStyle = '#3a2e26'; g.fillRect(x - 13, y - 21, 22, 3); g.fillStyle = 'rgba(255,90,20,0.35)'; g.beginPath(); g.arc(x, y - 4, 6, 0, 7); g.fill();
    }
    else if (t === 'atalaya') {
      g.beginPath(); g.ellipse(x + 5, y + 2, 10, 3.5, 0.2, 0, 7); g.fill();
      g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 4, y - 22); g.moveTo(x + 6, y); g.lineTo(x + 4, y - 22); g.moveTo(x - 6, y - 4); g.lineTo(x + 5, y - 16); g.moveTo(x + 6, y - 4); g.lineTo(x - 5, y - 16); g.stroke();
      g.fillStyle = '#7a5030'; g.fillRect(x - 7, y - 27, 14, 6); g.fillStyle = '#4a3018'; g.beginPath(); g.moveTo(x - 9, y - 27); g.lineTo(x, y - 36); g.lineTo(x + 9, y - 27); g.fill();
      banderas.push([x + 1, y - 36, '#2f6fc4']);
    }
    else if (t === 'campo') { var en = o[4]; humos.push([x - 1, y + 4]); g.beginPath(); g.ellipse(x + 4, y + 3, 18, 5, 0, 0, 7); g.fill(); [[-8, 0], [7, 3]].forEach(function (q) { var cl = en >= 3 ? ['#5a4436', '#3a2a20'] : en === 2 ? ['#6a6a4a', '#46462e'] : ['#d8c49a', '#a8925e']; g.fillStyle = cl[0]; g.beginPath(); g.moveTo(x + q[0] - 9, y + q[1]); g.lineTo(x + q[0], y + q[1] - 13); g.lineTo(x + q[0] + 1, y + q[1]); g.fill(); g.fillStyle = cl[1]; g.beginPath(); g.moveTo(x + q[0], y + q[1] - 13); g.lineTo(x + q[0] + 9, y + q[1]); g.lineTo(x + q[0] + 1, y + q[1]); g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + q[0], y + q[1] - 13); g.lineTo(x + q[0], y + q[1] - 17); g.stroke(); }); g.fillStyle = 'rgba(255,170,60,0.9)'; g.beginPath(); g.arc(x - 1, y + 8, 2.6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,230,120,0.9)'; g.beginPath(); g.arc(x - 1, y + 7.5, 1.2, 0, 7); g.fill(); banderas.push([x + 7, y - 14, en >= 2 ? '#7a1a12' : '#c0281e']); }
    else if (t === 'torre') {
      g.beginPath(); g.ellipse(x + 6, y + 3, 14, 5, 0.2, 0, 7); g.fill();
      var gt = g.createLinearGradient(x - 9, 0, x + 9, 0); gt.addColorStop(0, '#8a857c'); gt.addColorStop(0.5, '#6a655e'); gt.addColorStop(1, '#3e3a35'); g.fillStyle = gt; g.fillRect(x - 9, y - 30, 18, 31);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.8; for (k = -24; k < 0; k += 5) { g.beginPath(); g.moveTo(x - 9, y + k); g.lineTo(x + 9, y + k); g.stroke(); }
      for (k = -9; k < 9; k += 5) { g.fillStyle = '#6a655e'; g.fillRect(x + k, y - 35, 3.5, 5); }
      g.fillStyle = '#1a120a'; g.fillRect(x - 2, y - 22, 3, 6); g.fillStyle = '#ffb04a'; g.fillRect(x - 1.5, y - 21, 2, 2);
      g.fillStyle = '#8a1e16'; g.beginPath(); g.moveTo(x - 11, y - 30); g.lineTo(x, y - 46); g.lineTo(x + 2, y - 30); g.fill(); g.fillStyle = '#5a120d'; g.beginPath(); g.moveTo(x, y - 46); g.lineTo(x + 11, y - 30); g.lineTo(x + 2, y - 30); g.fill();
      banderas.push([x, y - 46, '#c0281e']);
    }
    else if (t === 'reino' || t === 'fortaleza') {
      var bien = t === 'reino', sc = s * (bien ? 1 : 1.05), M0 = bien ? ['#fbf6ea', '#e2d8c2', '#b8ac92'] : ['#6a625c', '#4a4440', '#2a2624'], T0 = bien ? ['#3a7ed4', '#2a62b0', '#1a4280'] : ['#a82a1e', '#7a1a12', '#4a0e08'];
      g.beginPath(); g.ellipse(x + 10, y + 6, 60 * sc, 17 * sc, 0.1, 0, 7); g.fill();
      var torreC = function (tx, ty, tr, th) {
        var gg = g.createLinearGradient(tx - tr, 0, tx + tr, 0); gg.addColorStop(0, M0[0]); gg.addColorStop(0.55, M0[1]); gg.addColorStop(1, M0[2]); g.fillStyle = gg; g.fillRect(tx - tr, ty - th, tr * 2, th);
        g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 0.7; for (var yy = ty - th + 5; yy < ty; yy += 5) { g.beginPath(); g.moveTo(tx - tr, yy); g.lineTo(tx + tr, yy); g.stroke(); }
        g.fillStyle = '#1a120a'; g.fillRect(tx - tr * 0.18, ty - th * 0.65, tr * 0.36, th * 0.22);
        g.fillStyle = T0[0]; g.beginPath(); g.moveTo(tx - tr * 1.3, ty - th); g.lineTo(tx, ty - th - tr * 2.5); g.lineTo(tx + tr * 0.15, ty - th); g.fill();
        g.fillStyle = T0[2]; g.beginPath(); g.moveTo(tx, ty - th - tr * 2.5); g.lineTo(tx + tr * 1.3, ty - th); g.lineTo(tx + tr * 0.15, ty - th); g.fill();
        g.strokeStyle = T0[1]; g.lineWidth = 0.6; for (var kk = 1; kk < 4; kk++) { var yk = ty - th - tr * 2.5 * (1 - kk / 4); g.beginPath(); g.moveTo(tx - tr * 1.3 * kk / 4, yk); g.lineTo(tx + tr * 1.3 * kk / 4, yk); g.stroke(); }
        banderas.push([tx, ty - th - tr * 2.5, bien ? '#2f6fc4' : '#c0281e']);
      };
      g.fillStyle = M0[2]; g.fillRect(x - 40 * sc, y - 36 * sc, 80 * sc, 13 * sc);
      torreC(x - 40 * sc, y - 22 * sc, 7 * sc, 22 * sc); torreC(x + 40 * sc, y - 22 * sc, 7 * sc, 22 * sc);
      var gk = g.createLinearGradient(x - 17 * sc, 0, x + 17 * sc, 0); gk.addColorStop(0, M0[0]); gk.addColorStop(0.6, M0[1]); gk.addColorStop(1, M0[2]); g.fillStyle = gk; g.fillRect(x - 17 * sc, y - 50 * sc, 34 * sc, 38 * sc);
      for (k = -12; k <= 8; k += 10) { g.fillStyle = '#1a120a'; g.beginPath(); g.moveTo(x + k * sc, y - 30 * sc); g.lineTo(x + k * sc, y - 36 * sc); g.arc(x + (k + 2) * sc, y - 36 * sc, 2 * sc, Math.PI, 0); g.lineTo(x + (k + 4) * sc, y - 30 * sc); g.fill(); if (bien) { g.fillStyle = '#ffd27a'; g.fillRect(x + (k + 1) * sc, y - 34 * sc, 2 * sc, 3 * sc); } }
      g.fillStyle = T0[0]; g.beginPath(); g.moveTo(x - 21 * sc, y - 50 * sc); g.lineTo(x, y - 80 * sc); g.lineTo(x + 3 * sc, y - 50 * sc); g.fill(); g.fillStyle = T0[2]; g.beginPath(); g.moveTo(x, y - 80 * sc); g.lineTo(x + 21 * sc, y - 50 * sc); g.lineTo(x + 3 * sc, y - 50 * sc); g.fill();
      banderas.push([x, y - 80 * sc, bien ? '#ffd23a' : '#111']);
      var gm2 = g.createLinearGradient(0, y - 15 * sc, 0, y + 2 * sc); gm2.addColorStop(0, M0[0]); gm2.addColorStop(1, M0[2]); g.fillStyle = gm2; g.fillRect(x - 44 * sc, y - 15 * sc, 88 * sc, 17 * sc);
      g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 0.7; for (k = -10; k < 2; k += 4) { g.beginPath(); g.moveTo(x - 44 * sc, y + k * sc); g.lineTo(x + 44 * sc, y + k * sc); g.stroke(); }
      for (k = -44; k < 44; k += 8) { g.fillStyle = M0[0]; g.fillRect(x + k * sc, y - 20 * sc, 5 * sc, 5 * sc); g.fillStyle = M0[2]; g.fillRect(x + (k + 3.5) * sc, y - 20 * sc, 1.5 * sc, 5 * sc); }
      g.fillStyle = bien ? '#5a3a1a' : '#120a08'; g.beginPath(); g.moveTo(x - 7 * sc, y + 2 * sc); g.lineTo(x - 7 * sc, y - 8 * sc); g.arc(x, y - 8 * sc, 7 * sc, Math.PI, 0); g.lineTo(x + 7 * sc, y + 2 * sc); g.fill();
      if (bien) { g.strokeStyle = '#3a2410'; g.lineWidth = 0.8; for (k = -5; k <= 5; k += 2.5) { g.beginPath(); g.moveTo(x + k * sc, y + 2 * sc); g.lineTo(x + k * sc, y - 12 * sc); g.stroke(); } }
      torreC(x - 47 * sc, y + 3 * sc, 8.5 * sc, 26 * sc); torreC(x + 47 * sc, y + 3 * sc, 8.5 * sc, 26 * sc);
      if (!bien) { var gf = g.createRadialGradient(x, y - 30, 4, x, y - 30, 80); gf.addColorStop(0, 'rgba(255,60,20,0.2)'); gf.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gf; g.beginPath(); g.arc(x, y - 30, 80, 0, 7); g.fill(); brillos.push([x, y - 10, 1]); }
    }
  }

  function pintarNiebla(r) {
    var sc = 0.25, top = 4 - r, bot = 5 - r, y0 = BASES[top] - 120, y1 = BASES[bot] + 120, c = document.createElement('canvas');
    c.width = Math.round(WW * sc); c.height = Math.round((y1 - y0) * sc); var g = c.getContext('2d'); g.scale(sc, sc); g.translate(0, -y0);
    var R = rnd0(30 + r), x, k;
    function nube(px, py, pr, al) { var gr = g.createRadialGradient(px, py, 0, px, py, pr), v = 205 + Math.floor(R() * 45); gr.addColorStop(0, 'rgba(' + v + ',' + (v + 3) + ',' + (v + 8) + ',' + al + ')'); gr.addColorStop(1, 'rgba(' + v + ',' + v + ',' + v + ',0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill(); }
    g.beginPath(); for (x = 0; x <= WW; x += 20) g.lineTo(x, top ? bordeY(top, x) + 25 : y0); for (x = WW; x >= 0; x -= 20) g.lineTo(x, bot < 4 ? bordeY(bot, x) - 25 : y1); g.closePath();
    g.fillStyle = 'rgba(214,222,230,0.92)'; g.fill();
    // bordes suaves: nubes sobre la frontera
    for (x = -30; x <= WW + 30; x += 34) { if (top) nube(x, bordeY(top, x) + 10, 55 + R() * 25, 0.85); if (bot < 4) nube(x, bordeY(bot, x) - 20, 50 + R() * 20, 0.85); }
    // nubes de dentro (relieve)
    for (k = 0; k < 170; k++) { var px = R() * WW, py = BASES[top] + 60 + R() * (BASES[bot] - BASES[top] - 120); nube(px, py, 40 + R() * 70, 0.5 + R() * 0.4); }
    g.globalCompositeOperation = 'source-atop'; for (k = 0; k < 60; k++) { var qx = R() * WW, qy = BASES[top] + R() * (BASES[bot] - BASES[top]), gs = g.createRadialGradient(qx, qy, 0, qx, qy, 80); gs.addColorStop(0, 'rgba(120,130,150,0.25)'); gs.addColorStop(1, 'rgba(120,130,150,0)'); g.fillStyle = gs; g.fillRect(qx - 80, qy - 80, 160, 160); }
    g.globalCompositeOperation = 'source-over';
    return { c: c, y0: y0, y1: y1 };
  }

  // ======================= PANTALLA =======================
  var raiz, cv, cx, W = 0, H = 0, DPR = 1, cam = { x: 500, y: 2100, z: 1 }, zMin = 0.4, zMax = 2.4, vuelo = null, corriendo = false, ultimo = 0, t0 = 0, sucio = true;
  var claros = {}, abiertosAntes = null, modal = false;
  // v9.01: interfaz medieval (metal oscuro con oro, estandartes, pergamino con grano, botones redondos con los iconos pintados del juego)
  var GRANO = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.75%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .36 0 0 0 0 .22 0 0 0 0 .07 0 0 0 .2 0%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")';
  var ORO = 'linear-gradient(180deg,#fff2b0,#e8b84a 45%,#a8701a 55%,#f0c860)';
  var CSS = '' +
    '#tkm{position:fixed;inset:0;z-index:8990;background:#1a120a;color:#fff;font:600 13px system-ui,sans-serif;touch-action:manipulation;-webkit-user-select:none;user-select:none;overflow:hidden;animation:tkmIn .35s ease}' +
    '@keyframes tkmIn{from{opacity:0}to{opacity:1}}' +
    '#tkm canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}' +
    '#tkm .tkm-marco{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 50px rgba(0,0,0,.65)}' +
    // barra de arriba
    '#tkm .tkm-top{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top) + 5px) 8px 0;background:linear-gradient(#3e3b36,#24221f 60%,#161513);border-bottom:2px solid #c9a14a;box-shadow:0 2px 0 #4a3010,0 6px 14px rgba(0,0,0,.6)}' +
    '#tkm .tkm-f1{display:flex;align-items:center;gap:8px;height:42px}' +
    '#tkm .tkm-vol{width:38px;height:38px;border-radius:6px;border:2px solid #e8c060;background:linear-gradient(#5a4a30,#2a2014);box-shadow:inset 0 0 0 1px #000,0 2px 4px #000a;color:#ffd23a;font:900 20px Georgia,serif;flex:none;text-shadow:0 1px 0 #000}' +
    '#tkm .tkm-tit{flex:1;min-width:0;text-align:center;font:700 17px Georgia,serif;color:#f6ecd6;text-shadow:0 2px 2px #000;letter-spacing:.5px}' +
    '#tkm .tkm-tit small{display:block;font:italic 600 11px Georgia,serif;color:#e8c060;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkm .tkm-est{flex:none;display:flex;align-items:center;gap:4px;height:30px;padding:0 10px 0 6px;border-radius:6px;border:2px solid #9ad06a;background:linear-gradient(#5aa83a,#2a6a1a);box-shadow:inset 0 1px 0 #c8f0a0,0 2px 4px #000a;color:#fff;font:800 13px system-ui;text-shadow:0 1px 1px #000}#tkm .tkm-est b{color:#ffe36a;font-size:16px}' +
    '#tkm .tkm-difs{display:flex;gap:4px;max-width:440px;width:100%;margin:5px auto 0}' +
    '#tkm .tkm-d{flex:1;height:30px;border-radius:6px 6px 0 0;border:1px solid #000;border-bottom:none;background:linear-gradient(#4a4440,#2a2624);color:#bfb4a0;font:700 12px Georgia,serif;box-shadow:inset 0 1px 0 #6a625a}' +
    '#tkm .tkm-d.on{background:linear-gradient(#e0782a,#9a3c0e);color:#fff;text-shadow:0 1px 1px #000;box-shadow:inset 0 1px 0 #ffb070,inset 0 0 0 1px #ffb07055}' +
    '#tkm .tkm-d.on.elite{background:linear-gradient(#b82a2a,#5a0a0a)}#tkm .tkm-d.on.pesadilla{background:linear-gradient(#5a2a8a,#20083a)}' +
    '#tkm .tkm-d.no{opacity:.6}' +
    '#tkm .tkm-rec{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 88px);display:flex;gap:4px;justify-content:center;flex-wrap:wrap;pointer-events:none}' +
    '#tkm .tkm-rec span{display:flex;align-items:center;gap:3px;padding:2px 7px 2px 2px;border-radius:12px;background:linear-gradient(#2a2016e8,#120c06e8);border:1px solid #c9a14a88;font:800 11px system-ui;color:#fff;text-shadow:0 1px 1px #000}#tkm .tkm-rec img{width:20px;height:20px}' +
    // botones redondos de los lados
    '#tkm .tkm-lado{position:absolute;top:calc(env(safe-area-inset-top) + 124px);display:flex;flex-direction:column;gap:12px}#tkm .tkm-izq{left:8px}#tkm .tkm-der{right:8px}' +
    '#tkm .tkm-bl{position:relative;width:58px;height:58px;padding:0;border-radius:50%;border:none;background:radial-gradient(circle at 50% 38%,#8a2418,#3a0a06 70%,#1a0402);box-shadow:0 0 0 2px #1a0e04,0 0 0 4px #d8a640,0 0 0 5px #4a2a08,0 5px 10px rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center}' +
    '#tkm .tkm-bl img{width:46px;height:46px;object-fit:contain;filter:drop-shadow(0 2px 2px #000)}' +
    '#tkm .tkm-bl small{position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);white-space:nowrap;font:700 10px Georgia,serif;color:#f6ecd6;text-shadow:0 1px 2px #000,0 0 4px #000}' +
    '#tkm .tkm-bl i{position:absolute;right:-3px;top:-3px;min-width:20px;height:20px;border-radius:10px;background:radial-gradient(#ff5a3a,#b81a08);color:#fff;font:800 11px/18px system-ui;font-style:normal;padding:0 4px;border:2px solid #ffe08a}' +
    '#tkm .tkm-bl.ir{font-size:26px}' +
    // abajo: progreso del capítulo y cofres
    '#tkm .tkm-abajo{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 8px);display:flex;align-items:center;gap:8px;max-width:460px;margin:0 auto;padding:8px 10px;border-radius:10px;background:linear-gradient(#36302aee,#1a1714f2);border:2px solid #c9a14a;box-shadow:0 0 0 1px #000,inset 0 1px 0 #6a5a40,0 4px 14px #000a}' +
    '#tkm .tkm-pc{flex:1;min-width:0}#tkm .tkm-pc b{display:block;color:#f6ecd6;font:700 12px Georgia,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 1px #000}' +
    '#tkm .tkm-bar{height:10px;border-radius:5px;background:#0a0806;border:1px solid #6a5030;margin-top:5px;overflow:hidden;box-shadow:inset 0 1px 2px #000}#tkm .tkm-bar i{display:block;height:100%;background:linear-gradient(#ffe36a,#e8a020 60%,#b87010);box-shadow:inset 0 1px 0 #fff8}' +
    '#tkm .tkm-cof{display:flex;gap:2px}#tkm .tkm-cf{width:46px;height:46px;padding:0;border:none;background:none;position:relative}#tkm .tkm-cf img{width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 2px 2px #000)}#tkm .tkm-cf small{position:absolute;bottom:-3px;left:0;right:0;font:800 10px system-ui;color:#ffe36a;text-shadow:0 1px 1px #000,0 0 3px #000}' +
    '#tkm .tkm-cf.listo img{animation:tkmLate 1s infinite}#tkm .tkm-cf.ya img{filter:grayscale(1) brightness(.6)}#tkm .tkm-cf.no img{filter:brightness(.55) drop-shadow(0 2px 2px #000)}' +
    '@keyframes tkmLate{0%,100%{transform:scale(1) rotate(0)}25%{transform:scale(1.12) rotate(-6deg)}75%{transform:scale(1.12) rotate(6deg)}}' +
    '#tkm .tkm-carga{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:radial-gradient(#3a2a18,#0e0904);font:700 20px Georgia,serif;color:#f6ecd6;text-shadow:0 2px 2px #000}' +
    '#tkm .tkm-carga i{width:200px;height:10px;border-radius:5px;background:#0008;overflow:hidden;border:1px solid #c9a14a}#tkm .tkm-carga i::after{content:"";display:block;height:100%;width:40%;background:' + ORO + ';animation:tkmCar 1s infinite ease-in-out}@keyframes tkmCar{from{transform:translateX(-100%)}to{transform:translateX(250%)}}' +
    // ventanas de pergamino
    '#tkm .tkm-fondo{position:absolute;inset:0;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 12px) 10px calc(env(safe-area-inset-bottom) + 12px);animation:tkmIn .2s ease}' +
    '#tkm .tkm-v{position:relative;width:100%;max-width:400px;max-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;border-radius:6px;border:2px solid #2a1808;' +
      'box-shadow:0 0 0 2px #c9a14a,0 0 0 5px #3a2410,0 0 0 6px #8a6a2a,0 14px 34px #000;' +
      'background:' + GRANO + ',radial-gradient(ellipse at 50% 40%,#f7ebcb 0%,#ead6a6 60%,#c9a46a 100%);color:#3a2410;padding:16px 14px 12px;animation:tkmPop .25s ease}' +
    '@keyframes tkmPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}' +
    '#tkm .tkm-v h2{margin:0 30px;font:700 20px Georgia,serif;color:#3a1a04;text-align:center;text-shadow:0 1px 0 #fff8}' +
    '#tkm .tkm-v h3{display:flex;align-items:center;gap:6px;margin:12px 0 6px;font:700 13px Georgia,serif;color:#5a2a08}#tkm .tkm-v h3::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#8a5a2a,#8a5a2a00)}' +
    '#tkm .tkm-v p{margin:4px 0;font:600 13px system-ui;line-height:1.35}#tkm .tkm-v .tkm-sub{text-align:center;font:italic 700 12px Georgia,serif;color:#7a4a1a;margin:2px 0 6px}#tkm .tkm-v .tkm-sub::before,#tkm .tkm-v .tkm-sub::after{content:" ❦ ";color:#a8702a}' +
    '#tkm .tkm-x{position:absolute;right:8px;top:8px;width:32px;height:32px;border-radius:4px;border:2px solid #e8c060;background:linear-gradient(#4a3a26,#1e160c);color:#ffd23a;font:900 16px system-ui;z-index:2;box-shadow:0 2px 4px #0008}' +
    '#tkm .tkm-jefe{display:flex;gap:10px;align-items:center;margin:8px 0;padding:8px;border-radius:6px;background:linear-gradient(#4a2414,#2a1208);color:#f3e6c8;border:1px solid #c9a14a;box-shadow:inset 0 0 12px #000}' +
    '#tkm .tkm-jefe .ico{flex:none;width:68px;height:68px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#c83a1a,#4a0a04);display:flex;align-items:center;justify-content:center;font-size:38px;box-shadow:0 0 0 2px #1a0402,0 0 0 4px #d8a640,0 0 16px #ff5a2a99}' +
    '#tkm .tkm-jefe b{color:#ffd0a0;font:700 15px Georgia,serif}#tkm .tkm-jefe small{display:block;font:600 11px system-ui;opacity:.92;margin-top:2px}' +
    '#tkm .tkm-enes{display:flex;flex-wrap:wrap;gap:5px}#tkm .tkm-enes span{display:flex;align-items:center;gap:5px;padding:3px 9px 3px 3px;border-radius:16px;background:linear-gradient(#3a2414,#22140a);color:#f3e6c8;border:1px solid #c9a14a;font:700 11px system-ui}#tkm .tkm-enes em{font-style:normal;font-size:16px;width:24px;height:24px;border-radius:50%;background:#7a1a12;display:flex;align-items:center;justify-content:center}' +
    '#tkm .tkm-conds div{display:flex;gap:6px;align-items:center;font:700 12px system-ui;margin:3px 0}#tkm .tkm-conds b{color:#8a7a60;font-size:17px;text-shadow:0 1px 0 #fff6}#tkm .tkm-conds .ok b{color:#e8a010;text-shadow:0 0 4px #ffd23a,0 1px 0 #7a4a00}' +
    '#tkm .tkm-prs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#tkm .tkm-pr{position:relative;border-radius:6px;background:radial-gradient(circle at 50% 35%,#5a3c20,#24160a);border:1px solid #c9a14a;box-shadow:inset 0 0 8px #000,0 1px 2px #0006;padding:5px 2px 3px;text-align:center;color:#fff;font:700 10px system-ui;min-width:0}' +
    '#tkm .tkm-pr img{width:32px;height:32px;object-fit:contain;display:block;margin:0 auto;filter:drop-shadow(0 2px 2px #000)}#tkm .tkm-pr span{display:block;font-size:24px;line-height:32px}#tkm .tkm-pr b{display:block;color:#ffe08a;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 1px #000}' +
    '#tkm .tkm-pod{display:flex;gap:6px}#tkm .tkm-pod div{flex:1;border-radius:6px;padding:5px;text-align:center;font:700 11px Georgia,serif;background:rgba(90,50,10,.12);border:1px solid #a8803a}#tkm .tkm-pod b{display:block;font:900 16px system-ui}' +
    '#tkm .tkm-bts{display:flex;gap:10px;margin-top:14px}#tkm .tkm-b{flex:1;height:46px;border-radius:5px;border:1px solid #000;font:700 16px Georgia,serif;color:#fff;text-shadow:0 1px 2px #000;box-shadow:inset 0 1px 0 #ffffff55,inset 0 0 0 1px #ffffff22,0 3px 5px #0007}' +
    '#tkm .tkm-b.azul,#tkm .tkm-b.rojo{background:linear-gradient(#3f80c0,#1c4a7c 55%,#123660)}#tkm .tkm-b.verde{background:linear-gradient(#5aa83a,#2a6a1a)}#tkm .tkm-b.gris{background:linear-gradient(#6e6a66,#3c3936)}' +
    '#tkm .tkm-b[disabled]{filter:grayscale(1);opacity:.6}' +
    '#tkm .tkm-nota{font:italic 600 12px Georgia,serif;color:#6b4a24;text-align:center;margin-top:6px}' +
    '#tkm .tkm-cap{display:flex;gap:10px;align-items:center;padding:8px;margin:7px 0;border-radius:6px;background:linear-gradient(#4a2e16,#26160a);color:#f3e6c8;border:1px solid #c9a14a;box-shadow:inset 0 0 10px #000;width:100%;text-align:left;font:inherit}' +
    '#tkm .tkm-cap.no{filter:grayscale(.85);opacity:.75}#tkm .tkm-cap .n{flex:none;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff2b0,#d8a030 60%,#7a4a08);color:#3a2410;font:700 20px Georgia,serif;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #2a1808}' +
    '#tkm .tkm-cap b{display:block;color:#ffe08a;font:700 15px Georgia,serif}#tkm .tkm-cap small{font:600 11px system-ui}' +
    '#tkm .tkm-lg{display:flex;align-items:center;gap:8px;padding:7px;margin:5px 0;border-radius:6px;background:rgba(90,50,10,.1);border:1px solid #a8803a}#tkm .tkm-lg .i{font-size:24px}#tkm .tkm-lg div{flex:1;min-width:0}#tkm .tkm-lg b{display:block;font:700 13px Georgia,serif}#tkm .tkm-lg small{display:block;font:600 11px system-ui}' +
    '#tkm .tkm-lg button{flex:none;height:34px;padding:0 10px;border-radius:5px;border:1px solid #000;background:linear-gradient(#3f80c0,#123660);color:#fff;font:700 12px Georgia,serif;box-shadow:inset 0 1px 0 #fff5}#tkm .tkm-lg button[disabled]{background:#9a8a70;box-shadow:none}#tkm .tkm-lg.ya{opacity:.6}' +
    '#tkm .tkm-rkt{display:flex;gap:4px;margin:8px 0 4px}#tkm .tkm-rkt button{flex:1;height:34px;border-radius:5px 5px 0 0;border:1px solid #5a3a16;background:linear-gradient(#8a6a40,#5a4024);color:#f3e6c8;font:700 13px Georgia,serif}#tkm .tkm-rkt button.on{background:linear-gradient(#e0782a,#9a3c0e);color:#fff;text-shadow:0 1px 1px #000}' +
    '#tkm .tkm-rkyo{margin:6px 0;padding:8px;border-radius:6px;background:linear-gradient(#2f6ab8,#123660);color:#fff;font:700 13px Georgia,serif;text-align:center;border:1px solid #9cc4ec;text-shadow:0 1px 1px #000}#tkm .tkm-rkyo b{color:#ffe36a}' +
    '#tkm .tkm-rkf{display:flex;align-items:center;gap:8px;padding:7px 8px;margin:4px 0;border-radius:6px;background:linear-gradient(#3a2414,#22140a);color:#f3e6c8;border:1px solid #6a5030}#tkm .tkm-rkf .p{flex:none;width:34px;text-align:center;font:900 15px Georgia,serif;color:#e8c060}#tkm .tkm-rkf.top .p{font-size:22px}' +
    '#tkm .tkm-rkf .n{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:700 13px Georgia,serif}#tkm .tkm-rkf .n i{font-style:normal;font:800 10px system-ui;color:#3a2410;background:#e8c060;border-radius:4px;padding:1px 4px;margin-right:5px}#tkm .tkm-rkf b{flex:none;color:#ffe08a;font:800 12px system-ui}' +
    '#tkm .tkm-rkf.top{border-color:#c9a14a;background:linear-gradient(#5a3a18,#2a180a)}#tkm .tkm-rkf.yo{border-color:#9cc4ec;box-shadow:0 0 0 1px #2f6ab8,0 0 10px #2f6ab866}' +
    '#tkm .tkm-rkp div{display:flex;align-items:center;flex-wrap:wrap;gap:3px;padding:5px 7px;margin:3px 0;border-radius:6px;background:rgba(90,50,10,.12);border:1px solid #a8803a;font:700 11px system-ui}#tkm .tkm-rkp span{font-size:20px;margin-right:2px}#tkm .tkm-rkp img{width:16px;height:16px}' +
    '#tkm .tkm-rec .tkm-bot{pointer-events:auto;display:flex;align-items:center;gap:4px;height:26px;padding:0 4px 0 8px;border-radius:13px;border:1px solid #ffd070;background:linear-gradient(#6a4a10,#2a1a04);color:#fff;font:800 12px system-ui;text-shadow:0 1px 1px #000;box-shadow:0 0 8px #ffb03a66}#tkm .tkm-bot b{color:#ffe36a}#tkm .tkm-bot i{font-style:normal;width:18px;height:18px;border-radius:50%;background:linear-gradient(#6fdc5a,#2f8f22);font:900 14px/18px system-ui;text-align:center}' +
    '#tkm .tkm-cst{margin:8px 0 2px;padding:7px 9px;border-radius:6px;background:linear-gradient(#5a3a10,#2a1a04);color:#fff;font:700 13px Georgia,serif;border:1px solid #ffd070;text-shadow:0 1px 1px #000}#tkm .tkm-cst b{color:#ffe36a}#tkm .tkm-cst small{display:block;font:600 11px system-ui;opacity:.85;margin-top:2px}#tkm .tkm-cst.falta{background:linear-gradient(#7a1a12,#3a0604);border-color:#ff9a8a}' +
    '#tkm .tkm-fuentes div{padding:5px 8px;margin:3px 0;border-radius:6px;background:rgba(90,50,10,.12);border:1px solid #a8803a;font:700 12px system-ui}#tkm .tkm-fuentes b{color:#2f8f22}' +
    '#tkm .tkm-packs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}#tkm .tkm-pack{padding:8px 4px;border-radius:6px;border:1px solid #c9a14a;background:radial-gradient(circle at 50% 30%,#5a3c20,#24160a);color:#fff;box-shadow:inset 0 0 8px #000,0 2px 4px #0006}#tkm .tkm-pack span{display:block;font-size:30px}#tkm .tkm-pack b{display:block;font:900 16px system-ui;color:#ffe08a}' +
    '#tkm .tkm-pack i{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:5px;padding:3px;border-radius:4px;background:linear-gradient(#3f80c0,#123660);font:800 12px system-ui;font-style:normal}#tkm .tkm-pack img{width:16px;height:16px}' +
    '#tkm .tkm-hist{font:italic 600 14px Georgia,serif !important;color:#4a2a0a;text-align:center;padding:4px 6px}' +
    '#tkm .tkm-sello{display:block;margin:6px auto;width:76px;height:76px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#e0402a,#6a0e08);font-size:38px;line-height:76px;text-align:center;box-shadow:0 0 0 3px #3a0a04,0 0 0 5px #d8a640,0 4px 10px #0008}';

  // ---- cámara ----
  function limitar() {
    cam.z = Math.max(zMin, Math.min(zMax, cam.z));
    var hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    cam.x = hw * 2 >= WW ? WW / 2 : Math.max(hw, Math.min(WW - hw, cam.x));
    cam.y = hh * 2 >= WH ? WH / 2 : Math.max(hh - 100 / cam.z, Math.min(WH - hh + 60 / cam.z, cam.y));
  }
  function aPantalla(x, y) { return [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2]; }
  function aMundo(sx, sy) { return [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y]; }
  function volarA(x, y, z) { vuelo = { x0: cam.x, y0: cam.y, z0: cam.z, x1: x, y1: y, z1: z || cam.z, t: 0 }; }
  function medir() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = raiz.clientWidth; H = raiz.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cx = cv.getContext('2d');
    zMin = Math.max(W / WW, H / WH); zMax = Math.max(zMin * 3, W / WW * 4); limitar(); sucio = true;
  }

  // ---- dibujo de cada fotograma ----
  function nodoEstado(c, i) { var d = st().dif; return hecha(d, c, i) ? 'hecha' : disponible(d, c, i) ? 'libre' : 'cerrada'; }
  function actual() { var d = st().dif; for (var c = 1; c <= 4; c++) for (var i = 1; i <= 6; i++) if (!hecha(d, c, i)) return disponible(d, c, i) ? [c, i] : null; return [4, 6]; }
  function dibujar(ahora) {
    if (!cx || !terreno) return;
    var t = (ahora - t0) / 1000, d = difActual(), z = cam.z;
    cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.fillStyle = '#1d4f7a'; cx.fillRect(0, 0, W, H);
    // terreno: solo el trozo visible
    var v0 = aMundo(0, 0), v1 = aMundo(W, H), sx = Math.max(0, v0[0]), sy = Math.max(0, v0[1]), ex = Math.min(WW, v1[0]), ey = Math.min(WH, v1[1]);
    if (ex > sx && ey > sy) { var p0 = aPantalla(sx, sy), sw = Math.min(terreno.width - sx * RES, (ex - sx) * RES), sh = Math.min(terreno.height - sy * RES, (ey - sy) * RES); if (sw > 1 && sh > 1) cx.drawImage(terreno, sx * RES, sy * RES, sw, sh, p0[0], p0[1], sw / RES * z, sh / RES * z); }
    cx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (W / 2 - cam.x * z), DPR * (H / 2 - cam.y * z)); // ahora se dibuja en coordenadas del mundo
    // barcos que se mecen y banderas que ondean
    barcos.forEach(function (b, k) { var bx = b[0] + Math.sin(t * 0.2 + k) * 14, by = b[1] + Math.sin(t * 1.3 + k) * 2; cx.fillStyle = '#5a3a1a'; cx.beginPath(); cx.moveTo(bx - 14, by); cx.lineTo(bx + 14, by); cx.lineTo(bx + 9, by + 7); cx.lineTo(bx - 9, by + 7); cx.fill(); cx.fillStyle = '#f3ead2'; cx.beginPath(); cx.moveTo(bx, by - 22); cx.lineTo(bx + 11, by - 3); cx.lineTo(bx, by - 3); cx.fill(); cx.strokeStyle = '#3a2410'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx, by - 24); cx.stroke(); });
    banderas.forEach(function (b, k) { var on = Math.sin(t * 5 + k) * 2; cx.strokeStyle = '#2a1a0a'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(b[0], b[1]); cx.lineTo(b[0], b[1] - 12); cx.stroke(); cx.fillStyle = b[2]; cx.beginPath(); cx.moveTo(b[0], b[1] - 12); cx.quadraticCurveTo(b[0] + 5, b[1] - 13 + on, b[0] + 10, b[1] - 10 + on); cx.lineTo(b[0], b[1] - 7); cx.fill(); });
    brillos.forEach(function (b2, k2) { var f2 = (Math.sin(t * 2.2 + k2 * 1.7) + 1) / 2; if (b2[2]) { cx.fillStyle = 'rgba(255,' + Math.round(120 + 80 * f2) + ',40,' + (0.5 * f2) + ')'; cx.beginPath(); cx.arc(b2[0] + Math.sin(t + k2) * 8, b2[1] - f2 * 20, 2.2, 0, 7); cx.fill(); } else if (f2 > 0.75) { cx.fillStyle = 'rgba(255,255,255,' + ((f2 - 0.75) * 3) + ')'; cx.fillRect(b2[0] - 2, b2[1] - 0.6, 4, 1.2); cx.fillRect(b2[0] - 0.6, b2[1] - 2, 1.2, 4); } });
    // aspas de los molinos
    molinos.forEach(function (m, k2) { var an0 = t * 1.2 + k2; cx.strokeStyle = '#4a3018'; cx.lineWidth = 1.4; cx.fillStyle = 'rgba(240,230,205,0.95)'; for (var a2 = 0; a2 < 4; a2++) { var an2 = an0 + a2 * Math.PI / 2, ex2 = m[0] + Math.cos(an2) * 15, ey2 = m[1] + Math.sin(an2) * 15; cx.beginPath(); cx.moveTo(m[0], m[1]); cx.lineTo(ex2, ey2); cx.stroke(); cx.save(); cx.translate(m[0], m[1]); cx.rotate(an2); cx.fillRect(5, 0, 10, 3.5); cx.restore(); } cx.fillStyle = '#3a2210'; cx.beginPath(); cx.arc(m[0], m[1], 2, 0, 7); cx.fill(); });
    // humo de los campamentos
    humos.forEach(function (h2, k2) { for (var j2 = 0; j2 < 3; j2++) { var f3 = (t * 0.35 + j2 / 3 + k2 * 0.17) % 1; cx.fillStyle = 'rgba(200,200,200,' + (0.4 * (1 - f3)) + ')'; cx.beginPath(); cx.arc(h2[0] + Math.sin(f3 * 4 + k2) * 4 + f3 * 8, h2[1] - f3 * 34, 2.5 + f3 * 6, 0, 7); cx.fill(); } });
    // bandadas de pájaros con su sombra
    for (var bd = 0; bd < 3; bd++) { var bxp = ((t * (18 + bd * 4) + bd * 330) % (WW + 300)) - 150, byp = 2200 - bd * 820 + Math.sin(t * 0.3 + bd) * 40; for (var pj = 0; pj < 5; pj++) { var ox = bxp - Math.abs(pj - 2) * 10, oy = byp + (pj - 2) * 8, al2 = Math.sin(t * 9 + pj) * 3; cx.strokeStyle = 'rgba(0,0,0,0.18)'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(ox + 26, oy + 40); cx.lineTo(ox + 30, oy + 42); cx.lineTo(ox + 34, oy + 40); cx.stroke(); cx.strokeStyle = '#2a2018'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(ox - 5, oy - al2); cx.quadraticCurveTo(ox - 2, oy - 2, ox, oy); cx.quadraticCurveTo(ox + 2, oy - 2, ox + 5, oy - al2); cx.stroke(); } }
    // humo del volcán
    for (var k = 0; k < 6; k++) { var f = (t * 0.18 + k / 6) % 1; cx.fillStyle = 'rgba(60,50,48,' + (0.5 * (1 - f)) + ')'; cx.beginPath(); cx.arc(VOLCAN[0] + Math.sin(f * 5 + k) * 18 + f * 40, VOLCAN[1] - 10 - f * 110, 12 + f * 34, 0, 7); cx.fill(); }
    // caminos ya recorridos (dorados)
    CAMINO.forEach(function (s) { if (!hecha(d.k, s.c, s.i)) return; cx.setLineDash([7, 6]); cx.lineDashOffset = -t * 12; cx.lineWidth = 3.2; cx.strokeStyle = '#ffd23a'; cx.beginPath(); cx.moveTo(s.a[0], s.a[1]); cx.quadraticCurveTo(s.q[0], s.q[1], s.b[0], s.b[1]); cx.stroke(); cx.setLineDash([]); });
    // sombras de nubes que pasan
    for (k = 0; k < 3; k++) { var nx = ((t * 6 + k * 420) % (WW + 600)) - 300, ny = 300 + k * 760 + Math.sin(t * 0.1 + k) * 60, gr = cx.createRadialGradient(nx, ny, 10, nx, ny, 220); gr.addColorStop(0, 'rgba(0,0,20,0.12)'); gr.addColorStop(1, 'rgba(0,0,20,0)'); cx.fillStyle = gr; cx.fillRect(nx - 220, ny - 220, 440, 440); }
    // tinte de la dificultad
    if (d.tinte) { cx.fillStyle = d.tinte; cx.fillRect(sx, sy, ex - sx, ey - sy); }
    // niebla de guerra en regiones cerradas
    for (var c = 1; c <= 4; c++) {
      var ab = capAbierto(d.k, c), a = ab ? (claros[c] != null ? claros[c] : 0) : 1; if (a <= 0.01) continue;
      var n = nieblas[c], dx = Math.sin(t * 0.15 + c) * 10;
      cx.globalAlpha = a; cx.drawImage(n.c, -20 + dx, n.y0, WW + 40, n.y1 - n.y0); cx.drawImage(n.c, -40 - dx, n.y0 + 10, WW + 80, n.y1 - n.y0 - 20); cx.globalAlpha = 1;
    }
    // misiones
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var cur = actual();
    CAPS.forEach(function (cap, ci) {
      var c2 = ci + 1, ab = capAbierto(d.k, c2);
      // cartel de la región
      var lab = aPantalla(cap.lab[0], cap.lab[1]);
      if (lab[1] > -40 && lab[1] < H + 40) cartel(lab[0], lab[1], L('Capítulo ', 'Chapter ') + c2, ab ? L(cap.es, cap.en) : '🔒 ' + L('Completa el capítulo ' + (c2 - 1), 'Complete chapter ' + (c2 - 1)), !ab);
      if (!ab && (claros[c2] == null || claros[c2] > 0.5)) return;
      cap.pos.forEach(function (p, mi) {
        var q = aPantalla(p[0], p[1]); if (q[0] < -40 || q[0] > W + 40 || q[1] < -60 || q[1] > H + 60) return;
        nodo(q[0], q[1], c2, mi + 1, nodoEstado(c2, mi + 1), t, cur && cur[0] === c2 && cur[1] === mi + 1);
      });
    });
    // tu reino
    var ri = aPantalla(INICIO[0], INICIO[1] + 26); cartel(ri[0], ri[1] + 18, '', L('Tu reino', 'Your kingdom'), false, true);
    // héroe en la misión actual
    if (cur) { var p = CAPS[cur[0] - 1].pos[cur[1] - 1], hp = aPantalla(p[0], p[1]), bob = Math.sin(t * 3) * 3; heroeMarca(hp[0], hp[1] - 44 + bob); }
  }
  function cartel(x, y, a, b, gris, chico) {
    cx.font = '900 ' + (chico ? 11 : 13) + 'px Georgia,serif'; var w = Math.max(cx.measureText(b).width, a ? cx.measureText(a).width : 0) + 26, h = a ? 36 : 22;
    if (!chico) x = Math.max(w / 2 + 74, Math.min(W - w / 2 - 74, x)); // que no se corte en el borde (ni lo tapen los botones)
    cx.fillStyle = gris ? 'rgba(40,40,46,0.85)' : 'rgba(58,36,16,0.9)'; cx.strokeStyle = gris ? '#9aa' : '#f2c45a'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(x - w / 2, y - h / 2); cx.lineTo(x + w / 2, y - h / 2); cx.lineTo(x + w / 2 - 7, y); cx.lineTo(x + w / 2, y + h / 2); cx.lineTo(x - w / 2, y + h / 2); cx.lineTo(x - w / 2 + 7, y); cx.closePath(); cx.fill(); cx.stroke();
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    if (a) { cx.font = '800 10px system-ui'; cx.fillStyle = gris ? '#ccd' : '#f3e6c8'; cx.fillText(a, x, y - 8); cx.font = '900 13px Georgia,serif'; cx.fillStyle = gris ? '#eef' : '#ffe08a'; cx.fillText(b, x, y + 7); }
    else { cx.fillStyle = '#ffe08a'; cx.fillText(b, x, y + 1); }
  }
  var fotoHeroe = null;
  function heroeMarca(x, y) {
    cx.fillStyle = 'rgba(0,0,0,0.35)'; cx.beginPath(); cx.ellipse(x, y + 44, 10, 4, 0, 0, 7); cx.fill();
    cx.fillStyle = '#2f6be0'; cx.beginPath(); cx.moveTo(x - 9, y + 10); cx.lineTo(x, y + 26); cx.lineTo(x + 9, y + 10); cx.fill();
    cx.save(); cx.beginPath(); cx.arc(x, y, 17, 0, 7); cx.fillStyle = '#1b3f8a'; cx.fill(); cx.clip();
    if (fotoHeroe && fotoHeroe.complete && fotoHeroe.naturalWidth) cx.drawImage(fotoHeroe, x - 17, y - 17, 34, 34); else { cx.font = '20px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🛡️', x, y + 1); }
    cx.restore(); cx.lineWidth = 3; cx.strokeStyle = '#ffd23a'; cx.beginPath(); cx.arc(x, y, 17, 0, 7); cx.stroke();
  }
  function estrella(x, y, r, llena) {
    cx.beginPath(); for (var k = 0; k < 10; k++) { var an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; cx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } cx.closePath();
    cx.fillStyle = llena ? '#ffd23a' : '#3a2e22'; cx.fill(); cx.lineWidth = 1.4; cx.strokeStyle = llena ? '#8a5200' : '#1a120a'; cx.stroke();
    if (llena) { cx.fillStyle = 'rgba(255,255,220,0.8)'; cx.beginPath(); cx.arc(x - r * 0.2, y - r * 0.25, r * 0.22, 0, 7); cx.fill(); }
  }
  // insignia de misión: escudo con emblema, 3 estrellas encima y el nivel debajo (como en los juegos de estrategia)
  function nodo(x, y, c, i, est, t, esCur) {
    var jefe = i === 6, esp = !!CAPS[c - 1].mis[i - 1][4] && !jefe, r = jefe ? 19 : esp ? 16 : 14, nivel = (c - 1) * 6 + i;
    if (est === 'libre') { var pu = (Math.sin(t * 4) + 1) / 2, gl = cx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6); gl.addColorStop(0, 'rgba(255,220,90,' + (0.55 + pu * 0.3) + ')'); gl.addColorStop(1, 'rgba(255,200,60,0)'); cx.fillStyle = gl; cx.beginPath(); cx.arc(x, y, r * 2.6, 0, 7); cx.fill(); cx.strokeStyle = 'rgba(255,230,140,' + (0.9 - pu * 0.7) + ')'; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(x, y, r + 6 + pu * 10, 0, 7); cx.stroke(); }
    cx.fillStyle = 'rgba(0,0,0,0.45)'; cx.beginPath(); cx.ellipse(x + 3, y + r * 1.05, r * 0.9, r * 0.3, 0, 0, 7); cx.fill();
    function forma(k) { cx.beginPath(); cx.moveTo(x - r * k, y - r * 0.85 * k); cx.lineTo(x - r * 0.35 * k, y - r * 1.02 * k); cx.lineTo(x, y - r * 0.9 * k); cx.lineTo(x + r * 0.35 * k, y - r * 1.02 * k); cx.lineTo(x + r * k, y - r * 0.85 * k); cx.lineTo(x + r * 0.95 * k, y + r * 0.1 * k); cx.quadraticCurveTo(x + r * 0.7 * k, y + r * 0.75 * k, x, y + r * 1.08 * k); cx.quadraticCurveTo(x - r * 0.7 * k, y + r * 0.75 * k, x - r * 0.95 * k, y + r * 0.1 * k); cx.closePath(); }
    var cols = est === 'cerrada' ? ['#9a9a9a', '#5a5a5a', '#3a3a3a'] : jefe ? ['#ff6a4a', '#b8200e', '#5a0a04'] : esp ? ['#c890ff', '#7a3ac0', '#3a1260'] : ['#ffd070', '#f08a1a', '#8a3a04'];
    forma(1.18); cx.fillStyle = est === 'cerrada' ? '#4a4a4a' : '#3a2008'; cx.fill();
    forma(1.08); var gr2 = cx.createLinearGradient(x - r, y - r, x + r, y + r); gr2.addColorStop(0, est === 'cerrada' ? '#d0d0d0' : '#fff0b0'); gr2.addColorStop(0.5, est === 'cerrada' ? '#8a8a8a' : '#d8a030'); gr2.addColorStop(1, est === 'cerrada' ? '#5a5a5a' : '#7a4a08'); cx.fillStyle = gr2; cx.fill();
    forma(0.86); var gr = cx.createLinearGradient(x, y - r, x, y + r); gr.addColorStop(0, cols[0]); gr.addColorStop(0.55, cols[1]); gr.addColorStop(1, cols[2]); cx.fillStyle = gr; cx.fill();
    cx.save(); forma(0.86); cx.clip(); cx.fillStyle = 'rgba(255,255,255,0.22)'; cx.beginPath(); cx.ellipse(x - r * 0.3, y - r * 0.55, r * 0.7, r * 0.35, -0.4, 0, 7); cx.fill(); cx.restore();
    // emblema
    cx.strokeStyle = est === 'cerrada' ? '#ddd' : '#fff6d8'; cx.fillStyle = cx.strokeStyle; cx.lineWidth = 2; cx.lineCap = 'round';
    if (est === 'cerrada') { cx.lineWidth = 1.8; cx.beginPath(); cx.arc(x, y - r * 0.2, r * 0.25, Math.PI, 0); cx.stroke(); cx.fillRect(x - r * 0.38, y - r * 0.2, r * 0.76, r * 0.55); }
    else if (jefe) { cx.beginPath(); cx.arc(x, y - r * 0.15, r * 0.38, 0, 7); cx.fill(); cx.fillRect(x - r * 0.22, y + r * 0.1, r * 0.44, r * 0.3); cx.fillStyle = cols[2]; cx.beginPath(); cx.arc(x - r * 0.15, y - r * 0.15, r * 0.1, 0, 7); cx.arc(x + r * 0.15, y - r * 0.15, r * 0.1, 0, 7); cx.fill(); }
    else if (esp) { cx.beginPath(); cx.moveTo(x - r * 0.45, y + r * 0.25); cx.lineTo(x - r * 0.45, y - r * 0.3); cx.lineTo(x - r * 0.2, y - r * 0.05); cx.lineTo(x, y - r * 0.42); cx.lineTo(x + r * 0.2, y - r * 0.05); cx.lineTo(x + r * 0.45, y - r * 0.3); cx.lineTo(x + r * 0.45, y + r * 0.25); cx.closePath(); cx.fill(); }
    else { cx.beginPath(); cx.moveTo(x - r * 0.42, y - r * 0.45); cx.lineTo(x + r * 0.42, y + r * 0.4); cx.moveTo(x + r * 0.42, y - r * 0.45); cx.lineTo(x - r * 0.42, y + r * 0.4); cx.stroke(); cx.lineWidth = 2.6; cx.beginPath(); cx.moveTo(x - r * 0.15, y + r * 0.12); cx.lineTo(x - r * 0.35, y + r * 0.32); cx.moveTo(x + r * 0.15, y + r * 0.12); cx.lineTo(x + r * 0.35, y + r * 0.32); cx.stroke(); }
    cx.lineCap = 'butt';
    // estrellas
    if (est !== 'cerrada') { var e = estrellas(st().dif, c, i); estrella(x - r * 0.85, y - r * 1.25, 6.5, e >= 1); estrella(x, y - r * 1.55, 7.5, e >= 2); estrella(x + r * 0.85, y - r * 1.25, 6.5, e >= 3); }
    // cinta con el nivel
    var lbl = jefe ? L('Jefe', 'Boss') + ' · ' + L('Nv ', 'Lv ') + nivel : L('Nivel ', 'Level ') + nivel; cx.font = '800 11px Georgia,serif'; var tw = cx.measureText(lbl).width + 16, ly = y + r * 1.25 + 9;
    var gcin = cx.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0); gcin.addColorStop(0, 'rgba(20,12,4,0)'); gcin.addColorStop(0.18, 'rgba(20,12,4,0.82)'); gcin.addColorStop(0.82, 'rgba(20,12,4,0.82)'); gcin.addColorStop(1, 'rgba(20,12,4,0)'); cx.fillStyle = gcin; cx.fillRect(x - tw / 2, ly - 8, tw, 16);
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = est === 'cerrada' ? '#bbb' : jefe ? '#ffb09a' : '#fff4d6'; cx.fillText(lbl, x, ly + 0.5);
  }
  function bucle(ahora) {
    if (!corriendo) return;
    requestAnimationFrame(bucle);
    if (document.hidden || ahora - ultimo < 33) return; // ~30 fotogramas por segundo (ahorra batería)
    var dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (vuelo) { vuelo.t = Math.min(1, vuelo.t + dt / 0.8); var e = 1 - Math.pow(1 - vuelo.t, 3); cam.x = vuelo.x0 + (vuelo.x1 - vuelo.x0) * e; cam.y = vuelo.y0 + (vuelo.y1 - vuelo.y0) * e; cam.z = vuelo.z0 + (vuelo.z1 - vuelo.z0) * e; limitar(); if (vuelo.t >= 1) vuelo = null; }
    if (inercia && !toques.length) { cam.x -= inercia[0] / cam.z; cam.y -= inercia[1] / cam.z; inercia[0] *= 0.9; inercia[1] *= 0.9; limitar(); if (Math.abs(inercia[0]) + Math.abs(inercia[1]) < 0.3) inercia = null; }
    Object.keys(claros).forEach(function (k) { if (claros[k] > 0) claros[k] = Math.max(0, claros[k] - dt / 2.2); });
    if (modal && !sucio && ahora % 4 > 1) return; // con una ventana abierta, se dibuja menos
    dibujar(ahora); sucio = false;
  }

  // ---- toques: arrastrar, pellizcar, tocar ----
  var toques = [], ini = null, pinza = null, inercia = null, ultMov = null;
  function pd(ev) { if (modal || ev.target !== cv) return; cv.setPointerCapture && cv.setPointerCapture(ev.pointerId); toques.push({ id: ev.pointerId, x: ev.clientX, y: ev.clientY }); vuelo = null; inercia = null; if (toques.length === 1) ini = { x: ev.clientX, y: ev.clientY, t: performance.now(), mov: 0 }; else pinza = { d: dd(), z: cam.z }; }
  function dd() { return Math.hypot(toques[0].x - toques[1].x, toques[0].y - toques[1].y) || 1; }
  function pm(ev) {
    var tq = toques.filter(function (q) { return q.id === ev.pointerId; })[0]; if (!tq) return;
    var dx = ev.clientX - tq.x, dy = ev.clientY - tq.y; tq.x = ev.clientX; tq.y = ev.clientY;
    if (toques.length === 1) { cam.x -= dx / cam.z; cam.y -= dy / cam.z; if (ini) ini.mov += Math.abs(dx) + Math.abs(dy); ultMov = [dx, dy]; }
    else if (toques.length === 2 && pinza) { var mx = (toques[0].x + toques[1].x) / 2, my = (toques[0].y + toques[1].y) / 2, antes = aMundo(mx, my); cam.z = pinza.z * dd() / pinza.d; limitar(); var desp = aMundo(mx, my); cam.x += antes[0] - desp[0]; cam.y += antes[1] - desp[1]; if (ini) ini.mov = 99; }
    limitar(); sucio = true;
  }
  function pu(ev) {
    var era = toques.length; toques = toques.filter(function (q) { return q.id !== ev.pointerId; });
    if (era === 1 && ini) { if (ini.mov < 10 && performance.now() - ini.t < 450) tocar(ev.clientX, ev.clientY); else if (ultMov) inercia = [ultMov[0] * 1.2, ultMov[1] * 1.2]; }
    if (toques.length < 2) pinza = null; if (!toques.length) { ini = null; ultMov = null; }
  }
  function rueda(ev) { if (modal) return; ev.preventDefault(); var antes = aMundo(ev.clientX, ev.clientY); cam.z *= ev.deltaY < 0 ? 1.12 : 0.89; limitar(); var desp = aMundo(ev.clientX, ev.clientY); cam.x += antes[0] - desp[0]; cam.y += antes[1] - desp[1]; limitar(); }
  function tocar(sx, sy) {
    var r = raiz.getBoundingClientRect(); sx -= r.left; sy -= r.top; var d = st().dif, mejor = null, dm = 34;
    CAPS.forEach(function (cap, ci) { if (!capAbierto(d, ci + 1)) return; cap.pos.forEach(function (p, mi) { var q = aPantalla(p[0], p[1]), dist = Math.hypot(q[0] - sx, q[1] - sy); if (dist < dm) { dm = dist; mejor = [ci + 1, mi + 1]; } }); });
    if (mejor) { if (G) G.sonar('click'); ventanaMision(mejor[0], mejor[1]); return; }
    var w = aMundo(sx, sy), c = capDeY(w[0], w[1]);
    if (!capAbierto(d, c)) { if (G) { G.sonar('error'); G.consejo('🌫️ ' + L('Esa región está cubierta por la niebla. Completa el capítulo ' + (c - 1) + ' para descubrirla.', 'That region is covered in fog. Complete chapter ' + (c - 1) + ' to discover it.')); } }
  }

  // ---- interfaz HTML ----
  function corto(n) { n = Math.round(n || 0); return n >= 1e9 ? (n / 1e9).toFixed(1).replace('.0', '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : num(n); }
  function htmlRec() { var r = G.recursos(); return ['oro', 'madera', 'piedra', 'hierro'].map(function (k) { return '<span><img src="iconos/ui/r_' + k + '.webp" alt="">' + corto(r[k]) + '</span>'; }).join(''); }
  function pintarUI() {
    var ui = raiz.querySelector('.tkm-ui'), d = difActual(), cur = actual(), c = cur ? cur[0] : 4, cap = CAPS[c - 1], hechas = 0; for (var i = 1; i <= 6; i++) if (hecha(d.k, c, i)) hechas++;
    var ec = estCap(d.k, c), cof = st().cofres, lg = logrosListos();
    function bl(cmd, im, txt, extra) { return '<button class="tkm-bl" data-c="' + cmd + '">' + (im.charAt(0) === '#' ? im.slice(1) : '<img src="iconos/ui/' + im + '.webp" alt="">') + '<small>' + txt + '</small>' + (extra || '') + '</button>'; }
    ui.innerHTML = '<div class="tkm-marco"></div><div class="tkm-top"><div class="tkm-f1"><button class="tkm-vol" data-c="salir" aria-label="' + L('Volver', 'Back') + '">‹</button><div class="tkm-tit">' + esc(L(cap.es, cap.en)) + '<small>' + L('Campaña · Capítulo ', 'Campaign · Chapter ') + c + '</small></div><div class="tkm-est"><b>★</b>' + totalEstrellas() + '</div></div>' +
      '<div class="tkm-difs">' + DIFS.map(function (x) { var ab = difAbierta(x.k); return '<button class="tkm-d ' + x.k + (x.k === d.k ? ' on' : '') + (ab ? '' : ' no') + '" data-c="dif" data-k="' + x.k + '">' + (ab ? '' : '🔒 ') + L('Modo ', '') + L(x.es, x.en).toLowerCase() + '</button>'; }).join('') + '</div></div>' +
      '<div class="tkm-rec"><button class="tkm-bot" data-c="botellas">🧪 <b>' + botellas() + '</b><i>+</i></button>' + htmlRec() + '</div>' +
      '<div class="tkm-lado tkm-izq">' + bl('caps', 'm_misiones', L('Capítulos', 'Chapters')) + bl('logros', 'o_estrella_rey', L('Logros', 'Feats'), lg ? '<i>' + lg + '</i>' : '') + bl('heroes', 'b_tropas', L('Héroes', 'Heroes')) + '</div>' +
      '<div class="tkm-lado tkm-der">' + bl('clasif', 'm_ranking', L('Clasificación', 'Ranking')) + bl('etapas', 'b_campana', L('Etapas', 'Stages')) + bl('centrar', '#🧭', L('Misión', 'Mission')) + '</div>' +
      '<div class="tkm-abajo"><div class="tkm-pc"><b>' + L('Capítulo ', 'Chapter ') + c + ' · ' + hechas + '/6 · ★ ' + ec + '/18</b><div class="tkm-bar"><i style="width:' + Math.round(100 * ec / 18) + '%"></i></div></div><div class="tkm-cof">' +
      [1, 2, 3].map(function (n) { var k = d.k + ':' + c + ':' + n, ya = cof[k], listo = !ya && ec >= n * 6; return '<button class="tkm-cf' + (ya ? ' ya' : listo ? ' listo' : ' no') + '" data-c="cofre" data-cap="' + c + '" data-n="' + n + '"><img src="iconos/ui/' + ['o_cofre_madera', 'o_cofre_oro', 'o_cofre_tesoro'][n - 1] + '.webp" alt=""><small>★' + n * 6 + '</small></button>'; }).join('') + '</div></div>';
  }
  function ventana(html) { cerrarVentana(); modal = true; var f = document.createElement('div'); f.className = 'tkm-fondo'; f.innerHTML = '<div class="tkm-v"><button class="tkm-x" data-c="x">✕</button>' + html + '</div>'; raiz.appendChild(f); return f; }
  function cerrarVentana() { var f = raiz && raiz.querySelector('.tkm-fondo'); if (f) f.remove(); modal = false; sucio = true; }
  function htmlPremios(p, extra) {
    var l = [];
    ['oro', 'madera', 'piedra', 'hierro'].forEach(function (k) { if (p[k] >= 1) l.push('<div class="tkm-pr"><img src="iconos/ui/r_' + k + '.webp" alt=""><b>' + num(p[k]) + '</b></div>'); });
    if (p.expH) l.push('<div class="tkm-pr"><span>🦸</span><b>+' + num(p.expH) + ' EXP</b></div>');
    if (p.frag) l.push('<div class="tkm-pr"><span>🧩</span><b>×' + p.frag + '</b></div>');
    (p.obj || []).forEach(function (o) { var im = G.imgObjeto(o[0]); l.push('<div class="tkm-pr">' + (im ? '<img src="' + esc(im) + '" alt="">' : '<span>🎁</span>') + '<b>' + esc(G.nombreObjeto(o[0])) + ' ×' + o[1] + '</b></div>'); });
    if (p.pieza) l.push('<div class="tkm-pr"><span>🛡️</span><b>' + esc(G.nombreRareza(p.pieza)) + '</b></div>');
    else if (p.piezaProb) l.push('<div class="tkm-pr"><span>🛡️</span><b>' + Math.round(p.piezaProb * 100) + '%</b></div>');
    if (p.expR) l.push('<div class="tkm-pr"><span>⭐</span><b>+' + num(p.expR) + '</b></div>');
    return '<div class="tkm-prs">' + l.join('') + (extra || '') + '</div>';
  }
  function poderEquipo(M) {
    var hs = G.heroes(), eq = G.equipo(), mapa = {}; hs.forEach(function (h) { mapa[h.id] = h; });
    var l = eq.filter(function (id) { return mapa[id]; }).map(function (id) { return mapa[id]; }); if (!l.length) l = hs.slice().sort(function (a, b) { return (b.dano * 6 + b.vida / 3) - (a.dano * 6 + a.vida / 3); }).slice(0, 5);
    var mio = l.reduce(function (a, h) { return a + h.dano * 2.2 * 6 + h.vida * 3 / 3; }, 0), nv = l.length ? l.reduce(function (a, h) { return a + (h.nivel || 1); }, 0) / l.length : 1;
    var f = M.f * (1 + 0.06 * (nv - 1)), ene = M.enemigos.concat(M.refuerzos.reduce(function (a, r) { return a.concat(r.l); }, [])).reduce(function (a, e) { return a + 52 * f * (e.a || 1) * 6 + 1500 * f * (e.v || 1) / 3; }, 0);
    return { mio: mio, ene: ene, foto: l[0] ? l[0].foto : '' };
  }
  function ventanaMision(c, i) {
    var d = st().dif, M = mision(c, i, d), est = nodoEstado(c, i), cap = CAPS[c - 1], best = estrellas(d, c, i);
    if (est === 'cerrada') { if (G) G.consejo('🔒 ' + L('Primero completa la misión ' + c + '-' + (i - 1) + '.', 'First complete mission ' + c + '-' + (i - 1) + '.')); return; }
    var primera = !hecha(d, c, i), p = primera ? premiosBase(M) : premiosRepetir(premiosBase(M)), rep = repHoy(), sinPremio = !primera && rep >= REP_DIA;
    var po = poderEquipo(M), col = po.mio >= po.ene * 1.1 ? '#2f8f22' : po.mio >= po.ene * 0.8 ? '#c9781a' : '#c0281e';
    var unicos = {}; M.enemigos.concat(M.refuerzos.reduce(function (a, r) { return a.concat(r.l); }, [])).forEach(function (e) { if (!e.jefe) unicos[e.ico + e.nom] = e; });
    var j = M.jefe, habTxt = j ? j.habs.filter(function (h, k, a) { return a.indexOf(h) === k; }).map(function (h) { return HABN[h] ? L(HABN[h][0], HABN[h][1]) : h; }).join(' · ') : '';
    var conds = condEstrellas(M), cst = coste(M), tengo = botellas(), nBar = Math.max(1, Math.min(5, REP_DIA - rep, Math.floor(tengo / cst)));
    var html = '<h2>' + esc(M.titulo) + '</h2><div class="tkm-sub">' + esc(L(cap.es, cap.en)) + ' · ' + esc(L(difActual().es, difActual().en)) + '</div>' +
      (j ? '<div class="tkm-jefe"><div class="ico">' + j.ico + '</div><div><b>' + esc(L(j.es, j.en)) + '</b><small>' + (i === 6 ? L('Jefe del capítulo', 'Chapter boss') : L('Enemigo especial', 'Special enemy')) + '</small><small>✨ ' + esc(habTxt) + '</small></div></div>' : '') +
      '<p class="tkm-hist">“' + esc(M.historia) + '”</p>' +
      '<h3>🎯 ' + L('Objetivo', 'Objective') + '</h3><p><b>' + esc(M.objTxt) + '</b>' + (M.refuerzos.length ? ' · ⚠️ ' + L('llegarán refuerzos', 'reinforcements will arrive') : '') + '</p>' +
      '<div class="tkm-cst' + (tengo < cst ? ' falta' : '') + '">🧪 ' + L('Coste: ', 'Cost: ') + '<b>' + cst + '</b> ' + L('botella' + (cst > 1 ? 's' : ''), 'flask' + (cst > 1 ? 's' : '')) + ' · ' + L('tienes ', 'you have ') + '<b>' + tengo + '</b><small>' + L('Si pierdes, se te devuelven todas menos 1.', 'If you lose, all but 1 are returned.') + '</small></div>' +
      '<h3>⭐ ' + L('Estrellas', 'Stars') + '</h3><div class="tkm-conds">' + conds.map(function (t2, k) { return '<div class="' + (best > k ? 'ok' : '') + '"><b>★</b>' + esc(t2) + '</div>'; }).join('') + '</div>' +
      '<h3>👹 ' + L('Enemigos', 'Enemies') + '</h3><div class="tkm-enes">' + Object.keys(unicos).map(function (k) { var e = unicos[k]; return '<span><em>' + e.ico + '</em>' + esc(e.nom) + (e.d ? ' 🏹' : '') + (e.sana ? ' ✚' : '') + '</span>'; }).join('') + '</div>' +
      '<div class="tkm-pod" style="margin-top:8px"><div>' + L('Poder de tus héroes', 'Your heroes power') + '<b style="color:' + col + '">' + num(po.mio) + '</b></div><div>' + L('Poder enemigo', 'Enemy power') + '<b>' + num(po.ene) + '</b></div></div>' +
      '<h3>🎲 ' + (primera ? L('Botín posible (primera victoria)', 'Possible loot (first victory)') : L('Botín posible al repetir', 'Possible replay loot')) + '</h3><p class="tkm-nota" style="margin:0 0 5px">' + L('Los premios son al azar: pueden salir más, menos o ninguno.', 'Loot is random: you may get more, less or nothing.') + '</p>' + (sinPremio ? '<p>' + L('Ya usaste las ' + REP_DIA + ' repeticiones con premio de hoy. Puedes jugarla igual, pero sin premios.', 'You used today\'s ' + REP_DIA + ' rewarded replays. You can still play it, without rewards.') + '</p>' : htmlPremios(p)) +
      (best < 3 ? '<h3>👑 ' + L('Extra posible por 3 estrellas (una vez)', 'Possible 3-star bonus (once)') + '</h3>' + htmlPremios(premioTres(M)) : '') +
      (!primera ? '<p class="tkm-nota">🔁 ' + L('Repeticiones con premio hoy: ', 'Rewarded replays today: ') + rep + ' / ' + REP_DIA + '</p>' : '') +
      (!primera && best >= 3 ? '<h3>⚡ ' + L('Barrido (3 ★)', 'Sweep (3 ★)') + '</h3><p class="tkm-nota" style="margin:0 0 4px">' + L('Ya la dominas: pásala automáticamente y recibe los premios al instante, sin batalla y sin perder tropas.', 'You mastered it: pass it automatically and get the rewards instantly, with no battle and no troop losses.') + '</p><div class="tkm-bts" style="margin-top:4px"><button class="tkm-b verde" data-c="barrido" data-cap="' + c + '" data-i="' + i + '" data-n="1"' + (sinPremio ? ' disabled' : '') + '>⚡ ×1 · 🧪' + cst + '</button><button class="tkm-b verde" data-c="barrido" data-cap="' + c + '" data-i="' + i + '" data-n="' + nBar + '"' + (sinPremio ? ' disabled' : '') + '>⚡ ×' + nBar + ' · 🧪' + nBar * cst + '</button></div>' : (!primera ? '<p class="tkm-nota">⚡ ' + L('Consigue 3 ★ para poder pasarla automáticamente (Barrido).', 'Get 3 ★ to pass it automatically (Sweep).') + '</p>' : '')) +
      '<div class="tkm-bts"><button class="tkm-b gris" data-c="x">' + L('Cerrar', 'Close') + '</button>' + (tengo >= cst ? '<button class="tkm-b rojo" data-c="atacar" data-cap="' + c + '" data-i="' + i + '">⚔️ ' + L('Atacar', 'Attack') + ' · 🧪' + cst + '</button>' : '<button class="tkm-b verde" data-c="botellas">🧪 ' + L('Conseguir botellas', 'Get flasks') + '</button>') + '</div>';
    ventana(html);
  }
  function ventanaCapitulos() {
    var d = st().dif;
    ventana('<h2>📜 ' + L('Capítulos', 'Chapters') + '</h2><div class="tkm-sub">' + esc(L(difActual().es, difActual().en)) + '</div>' + CAPS.map(function (cap, ci) {
      var c = ci + 1, ab = capAbierto(d, c), n = 0; for (var i = 1; i <= 6; i++) if (hecha(d, c, i)) n++;
      return '<button class="tkm-cap' + (ab ? '' : ' no') + '" data-c="vercap" data-cap="' + c + '"><span class="n">' + (ab ? c : '🔒') + '</span><span><b>' + esc(L(cap.es, cap.en)) + '</b><small>' + (ab ? n + '/6 · ★ ' + estCap(d, c) + '/18' + (n === 6 ? ' · ✔️' : '') : L('Completa el capítulo ' + (c - 1), 'Complete chapter ' + (c - 1))) + '</small></span></button>';
    }).join(''));
  }
  function ventanaLogros() {
    var l = st().logros;
    ventana('<h2>🏆 ' + L('Logros de campaña', 'Campaign feats') + '</h2>' + LOGROS.map(function (g) {
      var ya = l[g.id], ok = g.ok(), pr = g.max ? ' (' + Math.min(g.max, g.prog()) + '/' + g.max + ')' : '';
      return '<div class="tkm-lg' + (ya ? ' ya' : '') + '"><span class="i">' + (ya ? '✅' : ok ? '🏆' : '🎖️') + '</span><div><b>' + esc(L(g.es, g.en)) + '</b><small>' + esc(L(g.des[0], g.des[1])) + pr + '</small></div><button data-c="logro" data-id="' + g.id + '"' + (ya || !ok ? ' disabled' : '') + '>' + (ya ? L('Hecho', 'Done') : L('Reclamar', 'Claim')) + '</button></div>';
    }).join(''));
  }
  function tiempoHasta(ms) { var s2 = Math.max(0, (ms - Date.now()) / 1000), d = Math.floor(s2 / 86400), h = Math.floor(s2 % 86400 / 3600), m = Math.floor(s2 % 3600 / 60); return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; }
  function ventanaBotellas() {
    var rg = G.regalosBotellas ? G.regalosBotellas() : { dia: 10, mes: 50 }, gm = G.gemas ? G.gemas() : 0;
    ventana('<span class="tkm-sello" style="background:radial-gradient(circle at 40% 35%,#ffe36a,#c9781a 60%,#6a3a04)">🧪</span><h2>' + L('Botellas de campaña', 'Campaign flasks') + '</h2><div class="tkm-sub">' + L('Tienes ', 'You have ') + botellas() + '</div>' +
      '<p class="tkm-nota">' + L('Cada misión gasta botellas: normal 1, enemigo especial 2, jefe 3 (Élite ×2, Pesadilla ×3). El Barrido gasta lo mismo por cada pasada.', 'Each mission spends flasks: normal 1, special enemy 2, boss 3 (Elite ×2, Nightmare ×3). Sweeps cost the same per run.') + '</p>' +
      '<h3>🎁 ' + L('Gratis', 'Free') + '</h3><div class="tkm-fuentes"><div>📅 ' + L('Cada día al entrar: ', 'Every day you log in: ') + '<b>+' + rg.dia + '</b></div><div>🗓️ ' + L('Cada mes al entrar: ', 'Every month you log in: ') + '<b>+' + rg.mes + '</b></div><div>🏆 ' + L('Torneo semanal, Entrenamiento, Subir poder y Temporada', 'Weekly, Training, Power and Season tournaments') + '</div><div>🗺️ ' + L('Podio de la Campaña semanal, logros y cofres de estrellas', 'Weekly Campaign podium, feats and star chests') + '</div></div>' +
      '<h3>💎 ' + L('Comprar con gemas', 'Buy with gems') + ' · ' + L('tienes ', 'you have ') + (gm === Infinity ? '∞' : num(gm)) + '</h3><div class="tkm-packs">' + PACKS.map(function (q) { return '<button class="tkm-pack" data-c="comprar" data-n="' + q[0] + '" data-g="' + q[1] + '"><span>🧪</span><b>×' + q[0] + '</b><i><img src="iconos/ui/r_gemas.webp" alt="">' + q[1] + '</i></button>'; }).join('') + '</div>');
  }
  var rkTab = 'avance';
  function ventanaClasificacion(tab) {
    rkTab = tab = tab || rkTab;
    var w = semanaDatos(), tabs = '<div class="tkm-rkt"><button class="' + (tab === 'avance' ? 'on' : '') + '" data-c="rk" data-t="avance">🏰 ' + L('Avance', 'Progress') + '</button><button class="' + (tab === 'semana' ? 'on' : '') + '" data-c="rk" data-t="semana">⚔️ ' + L('Esta semana', 'This week') + '</button></div>';
    var mio = tab === 'avance' ? '<b>' + totalGanadas() + '</b> ' + L('misiones', 'missions') + ' · ★ <b>' + totalEstrellas() + '</b>' : '<b>' + num(w.p) + '</b> ' + L('puntos', 'points');
    var ayuda = tab === 'avance' ? L('Gana quien completa más misiones en todas las dificultades. Si empatan, el que tiene más estrellas.', 'Whoever completes the most missions on every difficulty wins. Ties go to the most stars.') : L('Cada victoria o barrido de esta semana da 1 punto (jefe 3). En Élite valen el doble y en Pesadilla el triple. Se reinicia el lunes.', 'Each win or sweep this week gives 1 point (boss 3). Elite doubles them and Nightmare triples them. Resets on Monday.');
    var prs = tab === 'semana' && G.premiosSemana ? '<h3>🎁 ' + L('Premios del lunes', 'Monday prizes') + (G.finSemana ? ' · ' + L('faltan ', 'in ') + tiempoHasta(G.finSemana()) : '') + '</h3><div class="tkm-rkp">' + G.premiosSemana().map(function (q) { return '<div><span>' + ['🥇', '🥈', '🥉'][q.pos - 1] + '</span><img src="iconos/ui/r_oro.webp" alt="">' + num(q.oro) + ' <img src="iconos/ui/r_hierro.webp" alt="">' + num(q.hierro) + ' · 🛡️ ' + esc(G.nombreRareza(q.pieza)) + ' · ' + q.obj.map(function (o) { return esc(G.nombreObjeto(o[0])) + ' ×' + o[1]; }).join(' · ') + '</div>'; }).join('') + '</div>' : '';
    var f = ventana('<h2>🏆 ' + L('Clasificación', 'Leaderboard') + '</h2><div class="tkm-sub">' + L('Campaña', 'Campaign') + '</div>' + tabs + '<p class="tkm-nota">' + esc(ayuda) + '</p>' + prs + '<div class="tkm-rkyo">' + L('Tú: ', 'You: ') + mio + '</div><div class="tkm-rkl">' + (G.cuenta() ? '<p class="tkm-nota">' + L('Cargando…', 'Loading…') + '</p>' : '<p>' + L('Crea una cuenta o entra en la tuya para aparecer en la clasificación.', 'Create an account or sign in to appear on the leaderboard.') + '</p><div class="tkm-bts"><button class="tkm-b azul" data-c="cuenta">' + L('Entrar o crear cuenta', 'Sign in or create account') + '</button></div>') + '</div>');
    if (!G.cuenta()) return;
    publicar();
    G.rankTop(tab).then(function (l) {
      var caja = f.querySelector('.tkm-rkl'); if (!caja || !f.parentNode || rkTab !== tab) return;
      l = (l || []).filter(function (a) { return (a.puntos || 0) > 0; }); var yo = G.yo(), pos = l.map(function (a) { return a.uid; }).indexOf(yo);
      var yoEl = f.querySelector('.tkm-rkyo'); if (yoEl) yoEl.innerHTML = L('Tu puesto: ', 'Your place: ') + '<b>' + (pos >= 0 ? '#' + (pos + 1) : L('sin puesto aún', 'no place yet')) + '</b> · ' + mio;
      caja.innerHTML = l.length ? l.map(function (a, k) {
        var val = tab === 'avance' ? '🗺️ ' + Math.floor(a.puntos / 1000) + ' · ★ ' + (a.puntos % 1000) : '⚔️ ' + num(a.puntos);
        return '<div class="tkm-rkf' + (a.uid === yo ? ' yo' : '') + (k < 3 ? ' top' : '') + '"><span class="p">' + (['🥇', '🥈', '🥉'][k] || '#' + (k + 1)) + '</span><span class="n">' + (a.alianza ? '<i>' + esc(a.alianza) + '</i>' : '') + esc(a.nombre || '?') + (a.uid === yo ? ' · ' + L('Tú', 'You') : '') + '</span><b>' + val + '</b></div>';
      }).join('') : '<p class="tkm-nota">' + L('Todavía nadie está en esta clasificación. ¡Sé el primero!', 'Nobody is on this leaderboard yet. Be the first!') + '</p>';
    }).catch(function () { var caja = f.querySelector('.tkm-rkl'); if (caja) caja.innerHTML = '<p class="tkm-nota">' + L('No se pudo cargar. Revisa tu conexión.', 'Could not load. Check your connection.') + '</p>'; });
  }
  function ventanaHistoria(c) {
    var cap = CAPS[c - 1];
    var f = ventana('<span class="tkm-sello">' + ['🌾', '🌲', '⛰️', '🌋'][c - 1] + '</span><h2>' + L('Capítulo ', 'Chapter ') + c + '</h2><div class="tkm-sub">' + esc(L(cap.es, cap.en)) + '</div><p class="tkm-hist">' + esc(L(cap.hes, cap.hen)) + '</p><div class="tkm-bts"><button class="tkm-b verde" data-c="x">' + L('¡Adelante!', 'Onward!') + '</button></div>');
    void f; st().visto['c' + c] = 1; G.guardar();
  }
  function ventanaPremio(tit, items) {
    ventana('<h2>' + tit + '</h2>' + (items.length ? '' : '<p class="tkm-nota">💨 ' + L('Esta vez no salió nada. ¡Prueba otra vez!', 'Nothing this time. Try again!') + '</p>') + '<div class="tkm-prs" style="margin-top:10px">' + items.map(function (x) { return '<div class="tkm-pr">' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span>' + x.ico + '</span>') + '<b>' + esc(x.n) + '</b><small style="display:block;font-size:9px;color:#f3e6c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.nom) + '</small></div>'; }).join('') + '</div><div class="tkm-bts"><button class="tkm-b verde" data-c="x">' + L('¡Genial!', 'Great!') + '</button></div>');
  }
  // v9.06: PREMIOS AL AZAR (petición del dueño): cada victoria tira los dados. 12 % sin botín; si no, cada premio
  // sale por su cuenta: nada (25 %), poco (30–70 %, 35 %), normal (80–120 %, 30 %) o botín grande (150–200 %, 10 %)
  var SIN_BOTIN = 0.12;
  function tirada() { var r = Math.random(); return r < 0.25 ? 0 : r < 0.6 ? 0.3 + Math.random() * 0.4 : r < 0.9 ? 0.8 + Math.random() * 0.4 : 1.5 + Math.random() * 0.5; }
  function azar(p) {
    if (Math.random() < SIN_BOTIN) return { q: {}, suerte: 'nada' };
    var q = {}, suma = 0, n = 0;
    ['oro', 'madera', 'piedra', 'hierro', 'expH', 'expR', 'frag'].forEach(function (k) { if (!p[k]) return; var m = tirada(); suma += m; n++; var v = Math.round(p[k] * m); if (v > 0) q[k] = v; });
    q.obj = (p.obj || []).map(function (o) { var m = tirada(); suma += m; n++; return [o[0], Math.round(o[1] * m)]; }).filter(function (o) { return o[1] > 0; });
    if (p.pieza) { if (Math.random() < 0.6) q.pieza = p.pieza; } else if (p.piezaProb) { q.piezaProb = p.piezaProb * (0.5 + Math.random()); q.piezaR = p.piezaR; }
    var med = n ? suma / n : 0;
    return { q: q, suerte: med >= 1.25 ? 'grande' : med < 0.55 ? 'poca' : 'normal' };
  }
  function notaSuerte(s2) { return s2 === 'nada' ? '💨 ' + L('Esta vez no hubo botín.', 'No loot this time.') : s2 === 'poca' ? '😕 ' + L('Poco botín esta vez.', 'Little loot this time.') : s2 === 'grande' ? '🍀 ' + L('¡Botín grande!', 'Big loot!') : '🎲 ' + L('Botín normal.', 'Normal loot.'); }
  function darAzar(p, ids, cuenta) { var a = azar(p); if (cuenta) cuenta[a.suerte] = (cuenta[a.suerte] || 0) + 1; return { items: a.suerte === 'nada' ? [] : dar(a.q, ids), suerte: a.suerte }; }
  // dar premios (con la pieza al azar si toca)
  function dar(p, ids) { var q = {}; Object.keys(p).forEach(function (k) { q[k] = p[k]; }); if (!q.pieza && q.piezaProb && Math.random() < q.piezaProb) q.pieza = q.piezaR; return G.darMision(q, ids || []); }

  // ---- barrido: pasar una misión de 3 ★ automáticamente ----
  function barrido(c, i, n) {
    var d = st().dif, M = mision(c, i, d), base = premiosBase(M), rp = st().rep || {}, todo = [], hechas2 = 0;
    if (estrellas(d, c, i) < 3) return;
    if (rp.d !== hoy()) rp = { d: hoy(), n: 0 };
    var cst = coste(M), suertes = {};
    if (botellas() < cst) { ventanaBotellas(); return; }
    for (var k = 0; k < n && rp.n < REP_DIA; k++) { if (!G.gastarBotellas(cst)) break; rp.n++; hechas2++; st().nRep = (st().nRep || 0) + 1; var r = st().m[clave(d, c, i)]; r.n = (r.n || 0) + 1; todo = todo.concat(darAzar(premiosRepetir(base), G.equipo(), suertes).items); }
    st().rep = rp; if (hechas2) sumarSemana(M, hechas2); G.guardar(); if (hechas2) publicar();
    if (!hechas2) { G.consejo(L('Ya usaste las repeticiones con premio de hoy.', 'Today\'s rewarded replays are used.')); return; }
    var junto = {}, orden = []; todo.forEach(function (x) { var m = /^([+×]?)([\d.,]+)/.exec(x.n || ''), v = m ? +m[2].replace(/[.,]/g, '') : 0; if (!junto[x.nom]) { junto[x.nom] = { img: x.img, ico: x.ico, nom: x.nom, pre: m ? m[1] : '', v: 0, txt: x.n }; orden.push(x.nom); } junto[x.nom].v += v; });
    G.sonar('moneda'); pintarUI();
    var resu = [['grande', '🍀'], ['normal', '🎲'], ['poca', '😕'], ['nada', '💨']].filter(function (q) { return suertes[q[0]]; }).map(function (q) { return q[1] + ' ×' + suertes[q[0]]; }).join('  ');
    ventanaPremio('⚡ ' + L('Barrido ×', 'Sweep ×') + hechas2 + ' · ' + esc(M.titulo) + '<div class="tkm-sub" style="margin-top:4px">' + resu + '</div>', orden.map(function (k2) { var j = junto[k2]; return { img: j.img, ico: j.ico, nom: j.nom, n: j.v ? j.pre + num(j.v) : j.txt }; }));
  }
  // ---- empezar una misión ----
  function atacar(c, i) {
    var d = st().dif, M = mision(c, i, d), dk = d;
    cerrarVentana();
    M.haySiguiente = i < 6 || c < 4;
    var cst = coste(M); if (botellas() < cst) { ventanaBotellas(); return; }
    M.alEmpezar = function () { if (!G.gastarBotellas(cst)) { G.consejo('🧪 ' + L('No te quedan botellas de campaña. Consíguelas en el mapa (botón 🧪 +).', 'You have no Campaign flasks left. Get them on the map (🧪 + button).')); return false; } return true; };
    M.alTerminar = function (res) {
      var k = clave(dk, c, i), r = st().m[k] || { e: 0, n: 0 }, primera = !r.n, items = [], nota = '';
      if (!res.gano) { if (cst > 1) G.darBotellas(cst - 1); return { items: [] }; }
      var antes = r.e || 0; r.n = (r.n || 0) + 1; r.e = Math.max(antes, res.estrellas); st().m[k] = r;
      var base = premiosBase(M);
      var tir = null;
      if (primera) { tir = darAzar(base, res.heroes); items = tir.items; nota = '🆕 ' + L('¡Primera victoria!', 'First victory!'); }
      else { var rp = st().rep || {}; if (rp.d !== hoy()) rp = { d: hoy(), n: 0 }; st().nRep = (st().nRep || 0) + 1; if (rp.n < REP_DIA) { rp.n++; tir = darAzar(premiosRepetir(base), res.heroes); items = tir.items; nota = '🔁 ' + rp.n + ' / ' + REP_DIA; } else nota = L('Sin premio: ya usaste las repeticiones de hoy.', 'No reward: today\'s replays are used.'); st().rep = rp; }
      sumarSemana(M, 1);
      if (tir) nota = notaSuerte(tir.suerte) + ' · ' + nota;
      if (res.estrellas >= 3 && antes < 3) { items = items.concat(darAzar(premioTres(M), res.heroes).items); nota += (nota ? ' · ' : '') + '👑 ' + L('¡Extra por 3 estrellas!', '3-star bonus!'); }
      G.guardar(); publicar();
      return { items: items, nota: nota };
    };
    M.alSalir = function () { abrir(); };
    M.alSiguiente = function () { abrir(); var nx = i < 6 ? [c, i + 1] : [c + 1, 1]; if (disponible(dk, nx[0], nx[1])) { var p = CAPS[nx[0] - 1].pos[nx[1] - 1]; cam.x = p[0]; cam.y = p[1]; limitar(); ventanaMision(nx[0], nx[1]); } };
    cerrar(true);
    if (!window.TKCampana || !TKCampana.abrirMision(M)) abrir();
  }

  function clic(ev) {
    var b = ev.target.closest('[data-c]'); if (!b) { if (ev.target.classList && ev.target.classList.contains('tkm-fondo')) cerrarVentana(); return; }
    var c = b.getAttribute('data-c'); if (G) G.sonar('click');
    if (c === 'x') cerrarVentana();
    else if (c === 'salir') cerrar();
    else if (c === 'atacar') atacar(+b.getAttribute('data-cap'), +b.getAttribute('data-i'));
    else if (c === 'barrido') { if (b.disabled) return; cerrarVentana(); barrido(+b.getAttribute('data-cap'), +b.getAttribute('data-i'), +b.getAttribute('data-n')); }
    else if (c === 'dif') { var k = b.getAttribute('data-k'); if (!difAbierta(k)) { G.consejo('🔒 ' + L('Completa el Capítulo 1 en ' + (k === 'elite' ? 'Normal' : 'Élite') + ' para abrir esta dificultad.', 'Complete Chapter 1 on ' + (k === 'elite' ? 'Normal' : 'Elite') + ' to unlock this difficulty.')); return; } st().dif = k; G.guardar(); claros = {}; abiertosAntes = { d: k, l: [1, 2, 3, 4].filter(function (c2) { return capAbierto(k, c2); }) }; pintarUI(); centrar(); }
    else if (c === 'caps') ventanaCapitulos();
    else if (c === 'logros') ventanaLogros();
    else if (c === 'clasif') ventanaClasificacion();
    else if (c === 'botellas') ventanaBotellas();
    else if (c === 'comprar') { var nb = +b.getAttribute('data-n'), gb = +b.getAttribute('data-g'); if (G.comprarBotellas(nb, gb)) { G.consejo('🧪 +' + nb + ' ' + L('botellas de campaña', 'Campaign flasks')); pintarUI(); ventanaBotellas(); } }
    else if (c === 'rk') ventanaClasificacion(b.getAttribute('data-t'));
    else if (c === 'cuenta') G.irCuenta();
    else if (c === 'vercap') { var cc = +b.getAttribute('data-cap'); cerrarVentana(); var p = CAPS[cc - 1].pos[2]; volarA(p[0], p[1] - 40, Math.max(cam.z, zMin * 1.6)); }
    else if (c === 'etapas') { cerrar(); if (window.TKCampana) TKCampana.abrir(); }
    else if (c === 'heroes') { cerrar(); G.heroesPanel(); }
    else if (c === 'centrar') centrar(true);
    else if (c === 'logro') { var id = b.getAttribute('data-id'), g = LOGROS.filter(function (x) { return x.id === id; })[0]; if (!g || st().logros[id] || !g.ok()) return; st().logros[id] = Date.now(); var it = dar(g.p, G.equipo()); G.guardar(); G.sonar('moneda'); pintarUI(); ventanaPremio('🏆 ' + esc(L(g.es, g.en)), it); }
    else if (c === 'cofre') { var cp = +b.getAttribute('data-cap'), n = +b.getAttribute('data-n'), d = difActual(), kc = d.k + ':' + cp + ':' + n; if (st().cofres[kc]) return; if (estCap(d.k, cp) < n * 6) { G.consejo('⭐ ' + L('Consigue ' + n * 6 + ' estrellas en este capítulo para abrir el cofre.', 'Earn ' + n * 6 + ' stars in this chapter to open the chest.')); return; } st().cofres[kc] = Date.now(); var it2 = dar(premioCofre(cp, n, d.p), G.equipo()); G.guardar(); G.sonar('moneda'); pintarUI(); ventanaPremio('🧰 ' + L('Cofre de estrellas', 'Star chest'), it2); }
  }
  function centrar(volar) { var cur = actual() || [4, 6], p = CAPS[cur[0] - 1].pos[cur[1] - 1]; if (volar) volarA(p[0], p[1] - 60, Math.max(cam.z, zMin * 1.5)); else { cam.x = p[0]; cam.y = p[1] - 60; cam.z = Math.max(zMin * 1.6, Math.min(zMax, W / WW * 2)); limitar(); } }

  function abrir() {
    G = window.__tkCamp; if (!G || !G.datos) return false;
    if (!$('tkm-css')) { var s = document.createElement('style'); s.id = 'tkm-css'; s.textContent = CSS; document.head.appendChild(s); }
    if (raiz) cerrar(true);
    G.cerrarPanel(); G.abierta(true);
    raiz = document.createElement('div'); raiz.id = 'tkm'; raiz.innerHTML = '<canvas></canvas><div class="tkm-ui"></div>'; document.body.appendChild(raiz);
    cv = raiz.querySelector('canvas'); medir();
    var eq = G.equipo(), hs = G.heroes(), h0 = hs.filter(function (h) { return h.id === eq[0]; })[0] || hs[0]; fotoHeroe = null; if (h0 && h0.foto) { fotoHeroe = new Image(); fotoHeroe.src = h0.foto; }
    if (!difAbierta(st().dif)) st().dif = 'normal';
    raiz.addEventListener('click', clic); cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu); cv.addEventListener('wheel', rueda, { passive: false }); window.addEventListener('resize', alCambiar);
    var seguir = function () {
      if (!raiz) return;
      // ¿se abrió una región nueva? la niebla se disipa y la cámara vuela allí
      var d = st().dif, ab = [1, 2, 3, 4].filter(function (c) { return capAbierto(d, c); }), nueva = abiertosAntes && abiertosAntes.d === d ? ab.filter(function (c) { return abiertosAntes.l.indexOf(c) < 0; })[0] : null;
      abiertosAntes = { d: d, l: ab };
      pintarUI(); centrar();
      if (nueva) { claros[nueva] = 1; var p = CAPS[nueva - 1].pos[0]; cam.y = p[1] + 300; limitar(); volarA(p[0], p[1] - 60); G.sonar('cuerno'); setTimeout(function () { if (raiz) ventanaHistoria(nueva); }, 1400); }
      else { var cur = actual(); if (cur && !st().visto['c' + cur[0]] && d === 'normal') ventanaHistoria(cur[0]); }
      corriendo = true; t0 = ultimo = performance.now(); sucio = true; requestAnimationFrame(bucle);
    };
    if (!terreno) { raiz.insertAdjacentHTML('beforeend', '<div class="tkm-carga">🗺️ ' + L('Preparando el mapa…', 'Preparing the map…') + '<i></i></div>'); setTimeout(function () { RES = Math.max(1, Math.min(1.6, W * DPR * 1.8 / WW)); try { pintarMundo(); } catch (e) { console.error(e); } var cg = raiz && raiz.querySelector('.tkm-carga'); if (cg) cg.remove(); seguir(); }, 40); }
    else seguir();
    return true;
  }
  function alCambiar() { if (raiz) medir(); }
  // cerrar(true) = se va a la batalla (el dibujo del mapa se guarda); cerrar() = vuelve a la ciudad (se libera la memoria)
  function cerrar(aBatalla) {
    corriendo = false; modal = false;
    window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); window.removeEventListener('resize', alCambiar);
    if (raiz) raiz.remove(); raiz = null; cx = null; toques = []; inercia = null; vuelo = null;
    if (!aBatalla) { terreno = null; nieblas = {}; claros = {}; if (G) G.abierta(false); }
  }
  window.TKMapa = { publicar: function () { G = G || window.__tkCamp; if (G && G.datos) publicar(); }, abrir: abrir, cerrar: function () { cerrar(); }, info: function () { return { abierto: !!raiz, dif: G && st().dif, estrellas: G ? totalEstrellas() : 0, actual: G ? actual() : null, cam: cam }; }, _mision: mision };
})();
