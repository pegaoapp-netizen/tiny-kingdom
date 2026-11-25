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
    { es: 'El Valle de Robleda', en: 'The Oakvale Valley', fondo: 'bosque',
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
    { es: 'El Bosque Umbrío', en: 'The Gloomwood', fondo: 'pantano',
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
    { es: 'Los Montes de Hierro', en: 'The Iron Peaks', fondo: 'nieve',
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
    { es: 'Las Tierras de Ceniza', en: 'The Ashlands', fondo: 'ceniza',
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
    { id: 'prim', es: 'Primera victoria', en: 'First victory', des: ['Gana tu primera misión', 'Win your first mission'], ok: function () { return totalGanadas() >= 1; }, p: { oro: 3000, madera: 2000 } },
    { id: 'c1', es: 'Libertador del valle', en: 'Valley liberator', des: ['Completa el Capítulo 1', 'Complete Chapter 1'], ok: function () { return hecha('normal', 1, 6); }, p: { hierro: 800, pieza: 'raro' } },
    { id: 'c2', es: 'Guardián del bosque', en: 'Forest warden', des: ['Completa el Capítulo 2', 'Complete Chapter 2'], ok: function () { return hecha('normal', 2, 6); }, p: { hierro: 1500, obj: [['libro_gra', 1]] } },
    { id: 'c3', es: 'Señor de las minas', en: 'Lord of the mines', des: ['Completa el Capítulo 3', 'Complete Chapter 3'], ok: function () { return hecha('normal', 3, 6); }, p: { hierro: 3000, pieza: 'legendario' } },
    { id: 'c4', es: 'Matadragones', en: 'Dragonslayer', des: ['Completa el Capítulo 4', 'Complete Chapter 4'], ok: function () { return hecha('normal', 4, 6); }, p: { hierro: 5000, pieza: 'mitico' } },
    { id: 'e30', es: 'Estratega', en: 'Strategist', des: ['Consigue 30 estrellas', 'Earn 30 stars'], ok: function () { return totalEstrellas() >= 30; }, max: 30, prog: function () { return totalEstrellas(); }, p: { oro: 15000, obj: [['acel_1h', 2]] } },
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
  function premioCofre(c, n, dm) { var k = (1 + (c - 1) * 2) * dm; return n === 1 ? { madera: 4000 * k, piedra: 4000 * k, obj: [['acel_15m', 2]] } : n === 2 ? { hierro: 1500 * k, obj: [['libro_gra', 1], ['acel_1h', 1]] } : { oro: 20000 * k, pieza: RAR[Math.min(3, c - 1 + (dm > 1 ? 1 : 0))], obj: [['acel_1h', 2]] }; }

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
  var terreno = null, nieblas = {}, RES = 1, banderas = [], barcos = [];
  function pintarMundo() {
    ocupado = {}; banderas = [];
    var c = document.createElement('canvas'); c.width = Math.round(WW * RES); c.height = Math.round(WH * RES);
    var g = c.getContext('2d'); g.scale(RES, RES);
    var R = rnd0(11), i, k, x, y;
    CAMINO.forEach(function (s) { for (var t = 0; t <= 1; t += 0.05) { var p = enCurva(s, t); marcar(p[0], p[1], 20); } });
    RIO.forEach(function (p) { marcar(p[0], p[1], 22); });
    marcar(LAGO[0], LAGO[1], LAGO[2] + 10); marcar(INICIO[0], INICIO[1], 70);
    CAPS.forEach(function (cap) { cap.pos.forEach(function (p, mi) { marcar(p[0], p[1], mi === 5 ? 62 : 36); }); });

    // 1. suelo de cada región
    var SUELO = { 1: ['#86b450', '#6f9e3c', ['#9cc45e', '#5f8f34', '#a9c86a']], 2: ['#4f7f34', '#3b6828', ['#5f8f3c', '#2f5a22', '#6a9a44']], 3: ['#a3a796', '#7d8576', ['#b9bcae', '#6c7466', '#d9dfe2']], 4: ['#5a3a2c', '#38231b', ['#6b4636', '#2a1912', '#7a3a22']] };
    for (var r = 1; r <= 4; r++) {
      var top = 4 - r, bot = 5 - r; g.save(); g.beginPath();
      for (x = 0; x <= WW; x += 20) g.lineTo(x, bordeY(top, x)); for (x = WW; x >= 0; x -= 20) g.lineTo(x, bordeY(bot, x)); g.closePath();
      var gr = g.createLinearGradient(0, BASES[top], 0, BASES[bot]); gr.addColorStop(0, SUELO[r][1]); gr.addColorStop(1, SUELO[r][0]); g.fillStyle = gr; g.fill(); g.clip();
      for (k = 0; k < 420; k++) { x = R() * WW; y = BASES[top] - 40 + R() * (BASES[bot] - BASES[top] + 80); var rr = 14 + R() * 46, col = SUELO[r][2][Math.floor(R() * 3)]; g.globalAlpha = 0.22 + R() * 0.2; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rr, rr * (0.5 + R() * 0.4), R() * 3, 0, 7); g.fill(); }
      if (r === 3) { var gn = g.createLinearGradient(0, BASES[top], 0, BASES[top] + 260); gn.addColorStop(0, 'rgba(240,246,250,0.85)'); gn.addColorStop(1, 'rgba(240,246,250,0)'); g.globalAlpha = 1; g.fillStyle = gn; g.fillRect(0, BASES[top] - 40, WW, 300); }
      if (r === 4) { g.globalAlpha = 0.7; g.strokeStyle = '#ff6a1a'; g.lineWidth = 1.6; for (k = 0; k < 40; k++) { x = 200 + R() * 780; y = 40 + R() * 620; g.beginPath(); g.moveTo(x, y); for (var s2 = 0; s2 < 4; s2++) { x += R() * 30 - 15; y += R() * 26 - 6; g.lineTo(x, y); } g.stroke(); } }
      g.globalAlpha = 1; g.restore();
    }
    // 2. mar al oeste
    g.save(); g.beginPath(); g.moveTo(0, 0); for (y = 0; y <= WH; y += 20) g.lineTo(costa(y), y); g.lineTo(0, WH); g.closePath();
    var gm = g.createLinearGradient(0, 0, 200, 0); gm.addColorStop(0, '#1d4f7a'); gm.addColorStop(1, '#3d86b0'); g.fillStyle = gm; g.fill(); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.2; for (k = 0; k < 140; k++) { x = R() * 200; y = R() * WH; g.beginPath(); g.arc(x, y, 6 + R() * 6, 3.6, 5.8); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 220, 720); g.restore();
    g.lineWidth = 9; g.strokeStyle = '#e6d39a'; g.beginPath(); for (y = 0; y <= WH; y += 20) g.lineTo(costa(y) + 2, y); g.stroke();
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); for (y = 0; y <= WH; y += 20) g.lineTo(costa(y) - 5, y); g.stroke();
    barcos = [[70, 2050], [95, 1380], [60, 820]];
    // 3. río y lago
    function trazo(ancho, color) { g.lineWidth = ancho; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); RIO.forEach(function (p, j) { var w = p[0]; if (j === RIO.length - 1) w = costa(p[1]); if (j) g.lineTo(w, p[1]); else g.moveTo(w, p[1]); }); g.lineTo(costa(RIO[RIO.length - 1][1]) - 10, RIO[RIO.length - 1][1] + 10); g.stroke(); }
    trazo(30, '#5b7a3a'); trazo(22, '#2b6a9a'); trazo(12, '#4a96c4'); trazo(3, 'rgba(255,255,255,0.35)');
    g.fillStyle = '#5b7a3a'; g.beginPath(); g.ellipse(LAGO[0], LAGO[1], LAGO[2] + 8, LAGO[3] + 8, 0.2, 0, 7); g.fill();
    var gl = g.createRadialGradient(LAGO[0] - 20, LAGO[1] - 10, 5, LAGO[0], LAGO[1], LAGO[2]); gl.addColorStop(0, '#5aa8d4'); gl.addColorStop(1, '#245d88'); g.fillStyle = gl; g.beginPath(); g.ellipse(LAGO[0], LAGO[1], LAGO[2], LAGO[3], 0.2, 0, 7); g.fill();
    // 4. campos de cultivo y aldeas (valle)
    [[300, 2290], [760, 2290], [860, 2200], [250, 2080], [700, 1940]].forEach(function (a) { for (k = 0; k < 6; k++) { x = a[0] + R() * 120 - 60; y = a[1] + R() * 80 - 40; if (!libre(x, y, 24)) continue; marcar(x, y, 24); g.save(); g.translate(x, y); g.rotate(R() * 0.8 - 0.4); g.fillStyle = ['#d8c25a', '#a7c45a', '#c9a24a', '#8fb84a'][Math.floor(R() * 4)]; g.fillRect(-22, -14, 44, 28); g.strokeStyle = 'rgba(80,60,20,0.35)'; g.lineWidth = 1; for (var q = -18; q < 22; q += 5) { g.beginPath(); g.moveTo(q, -14); g.lineTo(q, 14); g.stroke(); } g.strokeStyle = '#7a5a2a'; g.lineWidth = 1.5; g.strokeRect(-22, -14, 44, 28); g.restore(); } });
    var casas = [];
    [[300, 2140, 9], [880, 2280, 6], [230, 1840, 4], [720, 1360, 5], [880, 900, 4]].forEach(function (a) { for (k = 0; k < a[2]; k++) { x = a[0] + R() * 90 - 45; y = a[1] + R() * 60 - 30; if (libre(x, y, 11)) { marcar(x, y, 11); casas.push([x, y, R()]); } } });
    // 5. árboles, pinos, montañas (ordenados de arriba abajo para que se tapen bien)
    var cosas = [];
    function poner(n, x0, y0, x1, y1, tipo, sep) { for (var j = 0; j < n; j++) { var px = x0 + R() * (x1 - x0), py = y0 + R() * (y1 - y0); if (px < costa(py) + 14) continue; if (!libre(px, py, sep)) continue; var cp = capDeY(px, py); if (tipo === 'arbol' && cp === 3) tipo2 = 'pino'; else if ((tipo === 'arbol' || tipo === 'pino') && cp === 4) tipo2 = 'seco'; else tipo2 = tipo; cosas.push([px, py, tipo2, 0.7 + R() * 0.6]); } }
    var tipo2;
    for (k = 0; k < 16; k++) { var cx0 = 200 + R() * 780, cy0 = 1900 + R() * 460; poner(26, cx0 - 60, cy0 - 40, cx0 + 60, cy0 + 40, 'arbol', 9); }
    poner(2600, 160, 1300, WW, 1880, 'arbol', 8);
    poner(500, 160, 1050, WW, 1330, 'pino', 9);
    poner(150, 160, 720, WW, 1300, 'monte', 26);
    poner(60, 160, 820, WW, 1300, 'monte', 18);
    poner(70, 160, 40, WW, 700, 'volcan', 30);
    poner(140, 160, 40, WW, 720, 'seco', 10);
    poner(60, 160, 40, WW, 720, 'roca', 10);
    casas.forEach(function (h) { cosas.push([h[0], h[1], 'casa', 0.9 + h[2] * 0.3]); });
    cosas.push([880, 160, 'volcanG', 1]);
    // castillos y campamentos en las misiones
    cosas.push([INICIO[0], INICIO[1] - 6, 'reino', 1.25]);
    CAPS.forEach(function (cap, ci) { cap.pos.forEach(function (p, mi) { var j = cap.mis[mi]; if (mi === 5) cosas.push([p[0] + 2, p[1] - 30, 'fortaleza', 1, ci]); else if (j[4]) cosas.push([p[0] + 30, p[1] - 18, 'torre', 1, ci]); else cosas.push([p[0] + 30, p[1] - 12, 'campo', 1, ci]); }); });
    cosas.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (o) { dibujarCosa(g, o, R); });
    // 6. puentes donde el camino cruza el río
    CAMINO.forEach(function (s) { for (var t = 0; t <= 1; t += 0.02) { var p = enCurva(s, t); for (var j = 0; j < RIO.length; j++) if (Math.hypot(RIO[j][0] - p[0], RIO[j][1] - p[1]) < 10) { s.puente = p; return; } } });
    // 7. caminos de tierra
    CAMINO.forEach(function (s) { [[13, '#6b4a24'], [9, '#c8a46a'], [2, 'rgba(255,240,200,0.35)']].forEach(function (z) { g.lineWidth = z[0]; g.strokeStyle = z[1]; g.lineCap = 'round'; g.beginPath(); g.moveTo(s.a[0], s.a[1]); g.quadraticCurveTo(s.q[0], s.q[1], s.b[0], s.b[1]); g.stroke(); }); });
    CAMINO.forEach(function (s) { if (!s.puente) return; var p = s.puente; g.save(); g.translate(p[0], p[1]); var t2 = enCurva(s, 0.5), an = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]); g.rotate(an); g.fillStyle = '#0005'; g.fillRect(-20, -8, 40, 18); g.fillStyle = '#8a5a2a'; g.fillRect(-20, -9, 40, 18); g.fillStyle = '#b07a3a'; for (var q = -18; q < 20; q += 6) g.fillRect(q, -9, 4, 18); g.fillStyle = '#5a3a1a'; g.fillRect(-20, -11, 40, 3); g.fillRect(-20, 8, 40, 3); g.restore(); void t2; });
    // 8. fronteras entre regiones (línea discontinua)
    for (i = 1; i <= 3; i++) { g.setLineDash([10, 7]); g.lineWidth = 4; g.strokeStyle = 'rgba(40,20,5,0.55)'; g.beginPath(); for (x = costa(BASES[i]); x <= WW; x += 10) g.lineTo(x, bordeY(i, x)); g.stroke(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,220,140,0.5)'; g.stroke(); g.setLineDash([]); }
    // 9. viñeta suave
    var gv = g.createRadialGradient(WW / 2, WH / 2, WW * 0.4, WW / 2, WH / 2, WH * 0.75); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(30,15,0,0.35)'); g.fillStyle = gv; g.fillRect(0, 0, WW, WH);
    terreno = c;
    // niebla de cada región (en baja resolución: es borrosa)
    for (r = 1; r <= 4; r++) nieblas[r] = pintarNiebla(r);
  }
  function dibujarCosa(g, o, R) {
    var x = o[0], y = o[1], t = o[2], s = o[3], k;
    g.fillStyle = 'rgba(0,0,0,0.22)';
    if (t === 'arbol') { g.beginPath(); g.ellipse(x + 3, y + 2, 9 * s, 4 * s, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.fillRect(x - 1.5 * s, y - 6 * s, 3 * s, 7 * s); var v = R(); g.fillStyle = v < 0.3 ? '#2c5a22' : v < 0.7 ? '#356a2a' : '#3f7a2e'; g.beginPath(); g.arc(x, y - 11 * s, 9 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(160,210,90,0.35)'; g.beginPath(); g.arc(x - 3 * s, y - 14 * s, 5 * s, 0, 7); g.fill(); }
    else if (t === 'pino') { g.beginPath(); g.ellipse(x + 3, y + 2, 8 * s, 3.5 * s, 0, 0, 7); g.fill(); g.fillStyle = '#4a3020'; g.fillRect(x - 1.5 * s, y - 4 * s, 3 * s, 5 * s); for (k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#2b5a44' : '#244e3a'; g.beginPath(); g.moveTo(x, y - (22 - k * 5) * s); g.lineTo(x - (6 + k * 2.5) * s, y - (6 + k * 1) * s + k * 2); g.lineTo(x + (6 + k * 2.5) * s, y - (6 + k * 1) * s + k * 2); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.moveTo(x, y - 22 * s); g.lineTo(x - 3 * s, y - 15 * s); g.lineTo(x + 3 * s, y - 15 * s); g.fill(); }
    else if (t === 'seco') { g.strokeStyle = '#2a1a12'; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 14 * s); g.moveTo(x, y - 8 * s); g.lineTo(x - 6 * s, y - 14 * s); g.moveTo(x, y - 10 * s); g.lineTo(x + 5 * s, y - 17 * s); g.stroke(); }
    else if (t === 'roca') { g.beginPath(); g.ellipse(x + 2, y + 2, 9 * s, 4 * s, 0, 0, 7); g.fill(); g.fillStyle = '#4a3a34'; g.beginPath(); g.ellipse(x, y - 3 * s, 8 * s, 6 * s, 0, 0, 7); g.fill(); g.fillStyle = '#6a5a50'; g.beginPath(); g.ellipse(x - 2 * s, y - 5 * s, 4 * s, 3 * s, 0, 0, 7); g.fill(); }
    else if (t === 'monte' || t === 'volcan') {
      var h = (t === 'volcan' ? 40 : 46) * s, w = (t === 'volcan' ? 34 : 38) * s, nev = y < 1000;
      g.beginPath(); g.ellipse(x + 8, y + 2, w * 1.1, w * 0.3, 0, 0, 7); g.fill();
      g.fillStyle = t === 'volcan' ? '#3a2620' : '#7a7a72'; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x - w * 0.1, y - h); g.lineTo(x + w * 0.1, y - h); g.lineTo(x + w, y); g.fill();
      g.fillStyle = t === 'volcan' ? '#22140f' : '#55564f'; g.beginPath(); g.moveTo(x + w * 0.05, y - h); g.lineTo(x + w * 0.1, y - h); g.lineTo(x + w, y); g.lineTo(x + w * 0.15, y); g.fill();
      if (t === 'monte' && nev) { g.fillStyle = '#f2f6f8'; g.beginPath(); g.moveTo(x - w * 0.1, y - h); g.lineTo(x + w * 0.1, y - h); g.lineTo(x + w * 0.38, y - h * 0.62); g.lineTo(x + w * 0.1, y - h * 0.7); g.lineTo(x - w * 0.05, y - h * 0.58); g.lineTo(x - w * 0.36, y - h * 0.64); g.fill(); }
      if (t === 'volcan') { g.strokeStyle = 'rgba(255,110,30,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - w * 0.05, y - h); g.lineTo(x - w * 0.2, y - h * 0.5); g.lineTo(x - w * 0.12, y - h * 0.2); g.stroke(); }
    }
    else if (t === 'volcanG') { var gh = 150, gw = 120; g.beginPath(); g.ellipse(x + 20, y + 4, gw * 1.2, 26, 0, 0, 7); g.fill(); g.fillStyle = '#3a2620'; g.beginPath(); g.moveTo(x - gw, y); g.lineTo(x - 22, y - gh); g.lineTo(x + 22, y - gh); g.lineTo(x + gw, y); g.fill(); g.fillStyle = '#21130e'; g.beginPath(); g.moveTo(x + 10, y - gh); g.lineTo(x + 22, y - gh); g.lineTo(x + gw, y); g.lineTo(x + 30, y); g.fill(); var gg = g.createRadialGradient(x, y - gh, 2, x, y - gh, 40); gg.addColorStop(0, 'rgba(255,200,60,1)'); gg.addColorStop(0.4, 'rgba(255,90,20,0.8)'); gg.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gg; g.beginPath(); g.arc(x, y - gh, 40, 0, 7); g.fill(); g.strokeStyle = '#ff6a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 6, y - gh); g.quadraticCurveTo(x - 30, y - 80, x - 20, y - 10); g.stroke(); }
    else if (t === 'casa') { g.beginPath(); g.ellipse(x + 3, y + 2, 9 * s, 3 * s, 0, 0, 7); g.fill(); g.fillStyle = '#e8dcc0'; g.fillRect(x - 7 * s, y - 8 * s, 14 * s, 9 * s); g.fillStyle = '#c4b490'; g.fillRect(x + 2 * s, y - 8 * s, 5 * s, 9 * s); g.fillStyle = o[1] > 1800 ? '#b8452a' : '#7a4a2a'; g.beginPath(); g.moveTo(x - 9 * s, y - 8 * s); g.lineTo(x, y - 15 * s); g.lineTo(x + 9 * s, y - 8 * s); g.fill(); g.fillStyle = '#4a2a1a'; g.fillRect(x - 2 * s, y - 4 * s, 3 * s, 5 * s); }
    else if (t === 'campo') { var en = o[4]; g.beginPath(); g.ellipse(x + 2, y + 3, 16, 5, 0, 0, 7); g.fill(); [[-8, 0], [7, 3]].forEach(function (q) { g.fillStyle = en >= 2 ? '#5a4a3a' : '#c9b48a'; g.beginPath(); g.moveTo(x + q[0] - 8, y + q[1]); g.lineTo(x + q[0], y + q[1] - 12); g.lineTo(x + q[0] + 8, y + q[1]); g.fill(); g.fillStyle = en >= 2 ? '#3a2a1a' : '#9a7a4a'; g.beginPath(); g.moveTo(x + q[0], y + q[1] - 12); g.lineTo(x + q[0] + 8, y + q[1]); g.lineTo(x + q[0] + 2, y + q[1]); g.fill(); }); g.fillStyle = '#ff9a2a'; g.beginPath(); g.arc(x - 1, y + 7, 2.5, 0, 7); g.fill(); }
    else if (t === 'torre') { g.beginPath(); g.ellipse(x + 3, y + 3, 12, 5, 0, 0, 7); g.fill(); g.fillStyle = '#5a5450'; g.fillRect(x - 8, y - 26, 16, 27); g.fillStyle = '#3e3a36'; g.fillRect(x + 2, y - 26, 6, 27); for (k = -8; k < 8; k += 5) { g.fillStyle = '#5a5450'; g.fillRect(x + k, y - 30, 3, 4); } g.fillStyle = '#7a1a12'; g.beginPath(); g.moveTo(x - 10, y - 26); g.lineTo(x, y - 40); g.lineTo(x + 10, y - 26); g.fill(); banderas.push([x, y - 40, '#c0281e']); }
    else if (t === 'reino' || t === 'fortaleza') {
      var bien = t === 'reino', sc = s * (bien ? 1 : 1.05), muro = bien ? '#efe8d8' : '#4a4440', muroS = bien ? '#cfc6b0' : '#2e2a27', techo = bien ? '#2f6fc4' : '#8a1e16', techoS = bien ? '#1f4f94' : '#5a120d';
      g.beginPath(); g.ellipse(x + 6, y + 6, 54 * sc, 16 * sc, 0, 0, 7); g.fill();
      function torreC(tx, ty, tr, th) { g.fillStyle = muro; g.fillRect(tx - tr, ty - th, tr * 2, th); g.fillStyle = muroS; g.fillRect(tx + tr * 0.3, ty - th, tr * 0.7, th); g.fillStyle = techo; g.beginPath(); g.moveTo(tx - tr * 1.25, ty - th); g.lineTo(tx, ty - th - tr * 2.3); g.lineTo(tx + tr * 1.25, ty - th); g.fill(); g.fillStyle = techoS; g.beginPath(); g.moveTo(tx, ty - th - tr * 2.3); g.lineTo(tx + tr * 1.25, ty - th); g.lineTo(tx + tr * 0.2, ty - th); g.fill(); banderas.push([tx, ty - th - tr * 2.3, bien ? '#2f6fc4' : '#c0281e']); }
      // muralla trasera
      g.fillStyle = muroS; g.fillRect(x - 40 * sc, y - 34 * sc, 80 * sc, 12 * sc);
      torreC(x - 40 * sc, y - 22 * sc, 7 * sc, 20 * sc); torreC(x + 40 * sc, y - 22 * sc, 7 * sc, 20 * sc);
      // torre del homenaje
      g.fillStyle = muro; g.fillRect(x - 16 * sc, y - 46 * sc, 32 * sc, 34 * sc); g.fillStyle = muroS; g.fillRect(x + 6 * sc, y - 46 * sc, 10 * sc, 34 * sc);
      g.fillStyle = techo; g.beginPath(); g.moveTo(x - 20 * sc, y - 46 * sc); g.lineTo(x, y - 74 * sc); g.lineTo(x + 20 * sc, y - 46 * sc); g.fill(); g.fillStyle = techoS; g.beginPath(); g.moveTo(x, y - 74 * sc); g.lineTo(x + 20 * sc, y - 46 * sc); g.lineTo(x + 3 * sc, y - 46 * sc); g.fill(); banderas.push([x, y - 74 * sc, bien ? '#ffd23a' : '#111']);
      // muralla delantera con almenas y puerta
      g.fillStyle = muro; g.fillRect(x - 44 * sc, y - 14 * sc, 88 * sc, 16 * sc); g.fillStyle = muroS; g.fillRect(x - 44 * sc, y - 2 * sc, 88 * sc, 4 * sc);
      for (k = -44; k < 44; k += 8) { g.fillStyle = muro; g.fillRect(x + k * sc, y - 19 * sc, 5 * sc, 5 * sc); }
      g.fillStyle = bien ? '#5a3a1a' : '#120a08'; g.beginPath(); g.moveTo(x - 7 * sc, y + 2 * sc); g.lineTo(x - 7 * sc, y - 8 * sc); g.arc(x, y - 8 * sc, 7 * sc, Math.PI, 0); g.lineTo(x + 7 * sc, y + 2 * sc); g.fill();
      torreC(x - 46 * sc, y + 2 * sc, 8 * sc, 24 * sc); torreC(x + 46 * sc, y + 2 * sc, 8 * sc, 24 * sc);
      if (!bien) { var gf = g.createRadialGradient(x, y - 30, 4, x, y - 30, 70); gf.addColorStop(0, 'rgba(255,60,20,0.18)'); gf.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gf; g.beginPath(); g.arc(x, y - 30, 70, 0, 7); g.fill(); }
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
  var CSS = '' +
    '#tkm{position:fixed;inset:0;z-index:8990;background:#1a120a;color:#fff;font:600 13px system-ui,sans-serif;touch-action:manipulation;-webkit-user-select:none;user-select:none;overflow:hidden;animation:tkmIn .35s ease}' +
    '@keyframes tkmIn{from{opacity:0}to{opacity:1}}' +
    '#tkm canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}' +
    '#tkm .tkm-marco{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 3px #6b4a1a,inset 0 0 0 5px #f2c45a55,inset 0 0 40px #000c}' +
    '#tkm .tkm-top{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top) + 6px) 8px 6px;background:linear-gradient(#2b1a0af2,#2b1a0acc 70%,#2b1a0a00);display:flex;flex-direction:column;gap:5px}' +
    '#tkm .tkm-f1{display:flex;align-items:center;gap:6px}' +
    '#tkm .tkm-vol{width:38px;height:38px;border-radius:50%;border:2px solid #f2c45a;background:radial-gradient(#5a3a16,#2b1a0a);color:#ffe08a;font:900 18px system-ui;flex:none}' +
    '#tkm .tkm-tit{flex:1;min-width:0;text-align:center;font:900 18px Georgia,serif;color:#ffe08a;text-shadow:0 2px 0 #000;letter-spacing:.5px}' +
    '#tkm .tkm-tit small{display:block;font:700 11px system-ui;color:#f3e6c8;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkm .tkm-est{flex:none;padding:4px 9px;border-radius:12px;background:#000a;border:1px solid #f2c45a;color:#ffd23a;font:800 13px system-ui}' +
    '#tkm .tkm-difs{display:flex;gap:4px;max-width:420px;width:100%;margin:0 auto}' +
    '#tkm .tkm-d{flex:1;height:30px;border-radius:8px;border:2px solid #6b4a1a;background:linear-gradient(#5a3a16,#3a2410);color:#f3e6c8;font:800 12px system-ui}' +
    '#tkm .tkm-d.on{background:linear-gradient(#ffc24a,#c9781a);color:#fff;border-color:#ffe08a;text-shadow:0 1px 0 #0008}' +
    '#tkm .tkm-d.no{opacity:.55}' +
    '#tkm .tkm-rec{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}' +
    '#tkm .tkm-rec span{display:flex;align-items:center;gap:3px;padding:2px 7px 2px 3px;border-radius:10px;background:#0009;font:700 11px system-ui;color:#fff}#tkm .tkm-rec img{width:18px;height:18px}' +
    '#tkm .tkm-lado{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:9px}' +
    '#tkm .tkm-bl{position:relative;width:50px;height:50px;border-radius:14px;border:2px solid #f2c45a;background:radial-gradient(circle at 35% 30%,#7a5220,#2b1a0a);box-shadow:0 3px 8px #000a;color:#ffe08a;font:900 22px system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}' +
    '#tkm .tkm-bl small{font:800 8px system-ui;margin-top:2px;color:#f3e6c8}' +
    '#tkm .tkm-bl i{position:absolute;right:-5px;top:-5px;min-width:18px;height:18px;border-radius:9px;background:#e0301e;color:#fff;font:800 11px/18px system-ui;font-style:normal;padding:0 4px;border:2px solid #fff}' +
    '#tkm .tkm-abajo{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 8px);display:flex;align-items:center;gap:8px;max-width:460px;margin:0 auto;padding:7px 10px;border-radius:14px;background:linear-gradient(#3a2410ee,#1e1207ee);border:2px solid #f2c45a;box-shadow:0 4px 14px #000a}' +
    '#tkm .tkm-pc{flex:1;min-width:0}#tkm .tkm-pc b{display:block;color:#ffe08a;font:800 12px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkm .tkm-bar{height:9px;border-radius:5px;background:#000a;border:1px solid #6b4a1a;margin-top:4px;overflow:hidden}#tkm .tkm-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd23a,#ff9a1a)}' +
    '#tkm .tkm-cof{display:flex;gap:4px}#tkm .tkm-cf{width:40px;height:40px;border-radius:10px;border:2px solid #6b4a1a;background:#0007;font-size:20px;position:relative;color:#fff}#tkm .tkm-cf small{position:absolute;bottom:-1px;left:0;right:0;font:800 9px system-ui;color:#ffd23a}' +
    '#tkm .tkm-cf.listo{border-color:#ffd23a;animation:tkmLate 1s infinite}#tkm .tkm-cf.ya{opacity:.45;filter:grayscale(1)}' +
    '@keyframes tkmLate{0%,100%{transform:scale(1)}50%{transform:scale(1.1);box-shadow:0 0 12px #ffd23a}}' +
    '#tkm .tkm-carga{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(#3a2410,#120a04);font:900 20px Georgia,serif;color:#ffe08a}' +
    '#tkm .tkm-carga i{width:180px;height:8px;border-radius:4px;background:#0008;overflow:hidden;border:1px solid #6b4a1a}#tkm .tkm-carga i::after{content:"";display:block;height:100%;width:40%;background:#ffd23a;animation:tkmCar 1s infinite ease-in-out}@keyframes tkmCar{from{transform:translateX(-100%)}to{transform:translateX(250%)}}' +
    // ventanas
    '#tkm .tkm-fondo{position:absolute;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 12px) 12px calc(env(safe-area-inset-bottom) + 12px);animation:tkmIn .2s ease}' +
    '#tkm .tkm-v{position:relative;width:100%;max-width:400px;max-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;border-radius:16px;border:3px solid #5a3a16;box-shadow:0 0 0 2px #f2c45a,0 10px 30px #000;background:linear-gradient(#f6e7c1,#e2c792);color:#3a2410;padding:14px 14px 12px;animation:tkmPop .25s ease}' +
    '@keyframes tkmPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}' +
    '#tkm .tkm-v h2{margin:0;font:900 20px Georgia,serif;color:#5a2a0a;text-align:center}#tkm .tkm-v h3{margin:10px 0 5px;font:900 13px Georgia,serif;color:#6b3a10;border-bottom:1px solid #b08a52;padding-bottom:2px}' +
    '#tkm .tkm-v p{margin:4px 0;font:600 13px system-ui;line-height:1.35}#tkm .tkm-v .tkm-sub{text-align:center;font:700 11px system-ui;color:#8a5a2a;margin-bottom:6px}' +
    '#tkm .tkm-x{position:sticky;float:right;top:0;margin:-6px -6px 0 0;width:32px;height:32px;border-radius:50%;border:2px solid #5a3a16;background:#3a2410;color:#ffe08a;font:900 15px system-ui;z-index:2}' +
    '#tkm .tkm-jefe{display:flex;gap:10px;align-items:center;margin:6px 0;padding:8px;border-radius:12px;background:#3a2410;color:#f3e6c8}' +
    '#tkm .tkm-jefe .ico{flex:none;width:64px;height:64px;border-radius:50%;border:3px solid #f2c45a;background:radial-gradient(#8a2a1a,#2a0a06);display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 0 14px #ff5a2a88}' +
    '#tkm .tkm-jefe b{color:#ffd0a0;font:900 14px Georgia,serif}#tkm .tkm-jefe small{display:block;font:600 11px system-ui;opacity:.9}' +
    '#tkm .tkm-enes{display:flex;flex-wrap:wrap;gap:5px}#tkm .tkm-enes span{display:flex;align-items:center;gap:4px;padding:3px 8px 3px 4px;border-radius:12px;background:#0000001a;border:1px solid #b08a52;font:700 11px system-ui}#tkm .tkm-enes em{font-style:normal;font-size:18px}' +
    '#tkm .tkm-conds div{display:flex;gap:6px;align-items:center;font:700 12px system-ui;margin:3px 0}#tkm .tkm-conds b{color:#b08a52;font-size:16px}#tkm .tkm-conds .ok b{color:#e0a010;text-shadow:0 0 4px #ffd23a}' +
    '#tkm .tkm-prs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}#tkm .tkm-pr{position:relative;border-radius:10px;background:#3a2410;border:1px solid #f2c45a88;padding:5px 2px 3px;text-align:center;color:#fff;font:700 10px system-ui;min-width:0}' +
    '#tkm .tkm-pr img{width:30px;height:30px;object-fit:contain;display:block;margin:0 auto}#tkm .tkm-pr span{display:block;font-size:24px;line-height:30px}#tkm .tkm-pr b{display:block;color:#ffe08a;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#tkm .tkm-pod{display:flex;gap:6px}#tkm .tkm-pod div{flex:1;border-radius:10px;padding:5px;text-align:center;font:700 11px system-ui;background:#0000001a;border:1px solid #b08a52}#tkm .tkm-pod b{display:block;font:900 15px system-ui}' +
    '#tkm .tkm-bts{display:flex;gap:8px;margin-top:12px}#tkm .tkm-b{flex:1;height:46px;border-radius:12px;border:2px solid #0006;font:900 16px system-ui;color:#fff;text-shadow:0 1px 0 #0008}' +
    '#tkm .tkm-b.rojo{background:linear-gradient(#ff7a5a,#c0281e)}#tkm .tkm-b.azul{background:linear-gradient(#5b9bff,#1f55c9)}#tkm .tkm-b.verde{background:linear-gradient(#6fdc5a,#2f8f22)}#tkm .tkm-b.gris{background:linear-gradient(#8a7a66,#4d3f2e)}' +
    '#tkm .tkm-b[disabled]{filter:grayscale(1);opacity:.6}' +
    '#tkm .tkm-nota{font:600 11px system-ui;color:#6b4a24;text-align:center;margin-top:6px}' +
    '#tkm .tkm-cap{display:flex;gap:10px;align-items:center;padding:8px;margin:6px 0;border-radius:12px;background:#3a2410;color:#f3e6c8;border:2px solid #6b4a1a;width:100%;text-align:left;font:inherit}' +
    '#tkm .tkm-cap.no{filter:grayscale(.8);opacity:.7}#tkm .tkm-cap .n{flex:none;width:44px;height:44px;border-radius:50%;background:radial-gradient(#ffd23a,#c9781a);color:#3a2410;font:900 20px Georgia,serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff8}' +
    '#tkm .tkm-cap b{display:block;color:#ffe08a;font:900 14px Georgia,serif}#tkm .tkm-cap small{font:600 11px system-ui}' +
    '#tkm .tkm-lg{display:flex;align-items:center;gap:8px;padding:7px;margin:5px 0;border-radius:10px;background:#0000001a;border:1px solid #b08a52}#tkm .tkm-lg .i{font-size:24px}#tkm .tkm-lg div{flex:1;min-width:0}#tkm .tkm-lg b{display:block;font:900 13px Georgia,serif}#tkm .tkm-lg small{display:block;font:600 11px system-ui}' +
    '#tkm .tkm-lg button{flex:none;height:34px;padding:0 10px;border-radius:9px;border:2px solid #0005;background:linear-gradient(#6fdc5a,#2f8f22);color:#fff;font:900 12px system-ui}#tkm .tkm-lg button[disabled]{background:#9a8a70}#tkm .tkm-lg.ya{opacity:.6}' +
    '#tkm .tkm-hist{font:italic 600 14px Georgia,serif !important;color:#4a2a0a;text-align:center;padding:4px 6px}' +
    '#tkm .tkm-sello{display:block;margin:6px auto;width:72px;height:72px;border-radius:50%;background:radial-gradient(#c0281e,#6a0e08);border:3px solid #f2c45a;font-size:38px;line-height:66px;text-align:center;box-shadow:0 4px 10px #0006}';

  // ---- cámara ----
  function limitar() {
    cam.z = Math.max(zMin, Math.min(zMax, cam.z));
    var hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    cam.x = hw * 2 >= WW ? WW / 2 : Math.max(hw, Math.min(WW - hw, cam.x));
    cam.y = hh * 2 >= WH ? WH / 2 : Math.max(hh - 60 / cam.z, Math.min(WH - hh + 90 / cam.z, cam.y));
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
    // humo del volcán
    for (var k = 0; k < 6; k++) { var f = (t * 0.18 + k / 6) % 1; cx.fillStyle = 'rgba(60,50,48,' + (0.5 * (1 - f)) + ')'; cx.beginPath(); cx.arc(880 + Math.sin(f * 5 + k) * 18 + f * 40, 10 - f * 90, 14 + f * 34, 0, 7); cx.fill(); }
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
      var lab = aPantalla(cap.pos[2][0] + (ci % 2 ? -150 : 170), cap.pos[2][1] - 40);
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
    if (!chico) x = Math.max(w / 2 + 6, Math.min(W - w / 2 - 66, x)); // que no se corte en el borde (ni lo tapen los botones)
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
  function nodo(x, y, c, i, est, t, esCur) {
    var jefe = i === 6, esp = !!CAPS[c - 1].mis[i - 1][4] && !jefe, r = jefe ? 25 : esp ? 21 : 18;
    if (est === 'libre') { var pu = (Math.sin(t * 4) + 1) / 2; cx.strokeStyle = 'rgba(255,210,58,' + (0.9 - pu * 0.6) + ')'; cx.lineWidth = 4; cx.beginPath(); cx.arc(x, y, r + 5 + pu * 8, 0, 7); cx.stroke(); }
    cx.fillStyle = 'rgba(0,0,0,0.4)'; cx.beginPath(); cx.ellipse(x + 2, y + r * 0.85, r, r * 0.35, 0, 0, 7); cx.fill();
    // escudo
    cx.beginPath(); cx.moveTo(x - r, y - r * 0.8); cx.quadraticCurveTo(x, y - r * 1.15, x + r, y - r * 0.8); cx.lineTo(x + r * 0.9, y + r * 0.15); cx.quadraticCurveTo(x + r * 0.6, y + r * 0.8, x, y + r * 1.05); cx.quadraticCurveTo(x - r * 0.6, y + r * 0.8, x - r * 0.9, y + r * 0.15); cx.closePath();
    var gr = cx.createLinearGradient(x, y - r, x, y + r);
    if (est === 'cerrada') { gr.addColorStop(0, '#8a8a8a'); gr.addColorStop(1, '#4a4a4a'); }
    else if (jefe) { gr.addColorStop(0, '#e0402a'); gr.addColorStop(1, '#6a0e08'); }
    else if (est === 'hecha') { gr.addColorStop(0, '#4f8fe8'); gr.addColorStop(1, '#173f8a'); }
    else { gr.addColorStop(0, esp ? '#b05ae0' : '#ffb03a'); gr.addColorStop(1, esp ? '#4a1a7a' : '#a8520a'); }
    cx.fillStyle = gr; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = est === 'cerrada' ? '#bbb' : '#ffe08a'; cx.stroke();
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = (jefe ? 22 : 16) + 'px system-ui';
    cx.fillText(est === 'cerrada' ? '🔒' : jefe ? '💀' : esp ? '👑' : est === 'hecha' ? '✔️' : '⚔️', x, y - 1);
    // número
    cx.font = '900 11px system-ui'; var lbl = c + '-' + i; cx.lineWidth = 3; cx.strokeStyle = '#000'; cx.strokeText(lbl, x, y + r + 9); cx.fillStyle = '#fff'; cx.fillText(lbl, x, y + r + 9);
    // estrellas
    if (est === 'hecha') { var e = estrellas(st().dif, c, i); cx.font = '12px system-ui'; for (var k = 0; k < 3; k++) { cx.fillStyle = k < e ? '#ffd23a' : '#3a2a18'; cx.lineWidth = 2.5; cx.strokeStyle = '#000'; cx.strokeText('★', x - 13 + k * 13, y - r - 7 + (k === 1 ? -3 : 0)); cx.fillText('★', x - 13 + k * 13, y - r - 7 + (k === 1 ? -3 : 0)); } }
    if (esCur && est === 'libre') { cx.font = '900 10px system-ui'; cx.fillStyle = '#ffe08a'; cx.strokeStyle = '#000'; cx.lineWidth = 3; cx.strokeText(L('¡AQUÍ!', 'HERE!'), x, y + r + 22); cx.fillText(L('¡AQUÍ!', 'HERE!'), x, y + r + 22); }
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
  function htmlRec() { var r = G.recursos(); return ['oro', 'madera', 'piedra', 'hierro'].map(function (k) { return '<span><img src="iconos/ui/r_' + k + '.webp" alt="">' + num(r[k] || 0) + '</span>'; }).join(''); }
  function pintarUI() {
    var ui = raiz.querySelector('.tkm-ui'), d = difActual(), cur = actual(), c = cur ? cur[0] : 4, cap = CAPS[c - 1], hechas = 0; for (var i = 1; i <= 6; i++) if (hecha(d.k, c, i)) hechas++;
    var ec = estCap(d.k, c), cof = st().cofres, lg = logrosListos();
    ui.innerHTML = '<div class="tkm-marco"></div><div class="tkm-top"><div class="tkm-f1"><button class="tkm-vol" data-c="salir" aria-label="' + L('Volver', 'Back') + '">◀</button><div class="tkm-tit">' + L('Campaña', 'Campaign') + '<small>' + L('Capítulo ', 'Chapter ') + c + ' · ' + esc(L(cap.es, cap.en)) + '</small></div><div class="tkm-est">★ ' + totalEstrellas() + '</div></div>' +
      '<div class="tkm-difs">' + DIFS.map(function (x) { var ab = difAbierta(x.k); return '<button class="tkm-d' + (x.k === d.k ? ' on' : '') + (ab ? '' : ' no') + '" data-c="dif" data-k="' + x.k + '">' + (ab ? '' : '🔒 ') + L(x.es, x.en) + '</button>'; }).join('') + '</div>' +
      '<div class="tkm-rec">' + htmlRec() + '</div></div>' +
      '<div class="tkm-lado"><button class="tkm-bl" data-c="caps">📜<small>' + L('Capítulos', 'Chapters') + '</small></button><button class="tkm-bl" data-c="logros">🏆<small>' + L('Logros', 'Feats') + '</small>' + (lg ? '<i>' + lg + '</i>' : '') + '</button><button class="tkm-bl" data-c="etapas">⚔️<small>' + L('Etapas', 'Stages') + '</small></button><button class="tkm-bl" data-c="heroes">🦸<small>' + L('Héroes', 'Heroes') + '</small></button><button class="tkm-bl" data-c="centrar">🎯<small>' + L('Ir', 'Go') + '</small></button></div>' +
      '<div class="tkm-abajo"><div class="tkm-pc"><b>' + L('Cap. ', 'Ch. ') + c + ' · ' + hechas + '/6 ' + L('misiones', 'missions') + ' · ★ ' + ec + '/18</b><div class="tkm-bar"><i style="width:' + Math.round(100 * ec / 18) + '%"></i></div></div><div class="tkm-cof">' +
      [1, 2, 3].map(function (n) { var k = d.k + ':' + c + ':' + n, ya = cof[k], listo = !ya && ec >= n * 6; return '<button class="tkm-cf' + (ya ? ' ya' : listo ? ' listo' : '') + '" data-c="cofre" data-cap="' + c + '" data-n="' + n + '">' + (n === 3 ? '👑' : n === 2 ? '🧰' : '📦') + '<small>★' + n * 6 + '</small></button>'; }).join('') + '</div></div>';
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
    var conds = condEstrellas(M);
    var html = '<h2>' + esc(M.titulo) + '</h2><div class="tkm-sub">' + esc(L(cap.es, cap.en)) + ' · ' + esc(L(difActual().es, difActual().en)) + '</div>' +
      (j ? '<div class="tkm-jefe"><div class="ico">' + j.ico + '</div><div><b>' + esc(L(j.es, j.en)) + '</b><small>' + (i === 6 ? L('Jefe del capítulo', 'Chapter boss') : L('Enemigo especial', 'Special enemy')) + '</small><small>✨ ' + esc(habTxt) + '</small></div></div>' : '') +
      '<p class="tkm-hist">“' + esc(M.historia) + '”</p>' +
      '<h3>🎯 ' + L('Objetivo', 'Objective') + '</h3><p><b>' + esc(M.objTxt) + '</b>' + (M.refuerzos.length ? ' · ⚠️ ' + L('llegarán refuerzos', 'reinforcements will arrive') : '') + '</p>' +
      '<h3>⭐ ' + L('Estrellas', 'Stars') + '</h3><div class="tkm-conds">' + conds.map(function (t2, k) { return '<div class="' + (best > k ? 'ok' : '') + '"><b>★</b>' + esc(t2) + '</div>'; }).join('') + '</div>' +
      '<h3>👹 ' + L('Enemigos', 'Enemies') + '</h3><div class="tkm-enes">' + Object.keys(unicos).map(function (k) { var e = unicos[k]; return '<span><em>' + e.ico + '</em>' + esc(e.nom) + (e.d ? ' 🏹' : '') + (e.sana ? ' ✚' : '') + '</span>'; }).join('') + '</div>' +
      '<div class="tkm-pod" style="margin-top:8px"><div>' + L('Poder de tus héroes', 'Your heroes power') + '<b style="color:' + col + '">' + num(po.mio) + '</b></div><div>' + L('Poder enemigo', 'Enemy power') + '<b>' + num(po.ene) + '</b></div></div>' +
      '<h3>🎁 ' + (primera ? L('Premios de la primera victoria', 'First victory rewards') : L('Premios al repetir', 'Replay rewards')) + '</h3>' + (sinPremio ? '<p>' + L('Ya usaste las ' + REP_DIA + ' repeticiones con premio de hoy. Puedes jugarla igual, pero sin premios.', 'You used today\'s ' + REP_DIA + ' rewarded replays. You can still play it, without rewards.') + '</p>' : htmlPremios(p)) +
      (best < 3 ? '<h3>👑 ' + L('Extra por 3 estrellas (una vez)', '3-star bonus (once)') + '</h3>' + htmlPremios(premioTres(M)) : '') +
      (!primera ? '<p class="tkm-nota">🔁 ' + L('Repeticiones con premio hoy: ', 'Rewarded replays today: ') + rep + ' / ' + REP_DIA + '</p>' : '') +
      '<div class="tkm-bts"><button class="tkm-b gris" data-c="x">' + L('Cerrar', 'Close') + '</button><button class="tkm-b rojo" data-c="atacar" data-cap="' + c + '" data-i="' + i + '">⚔️ ' + L('Atacar', 'Attack') + '</button></div>';
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
  function ventanaHistoria(c) {
    var cap = CAPS[c - 1];
    var f = ventana('<span class="tkm-sello">' + ['🌾', '🌲', '⛰️', '🌋'][c - 1] + '</span><h2>' + L('Capítulo ', 'Chapter ') + c + '</h2><div class="tkm-sub">' + esc(L(cap.es, cap.en)) + '</div><p class="tkm-hist">' + esc(L(cap.hes, cap.hen)) + '</p><div class="tkm-bts"><button class="tkm-b verde" data-c="x">' + L('¡Adelante!', 'Onward!') + '</button></div>');
    void f; st().visto['c' + c] = 1; G.guardar();
  }
  function ventanaPremio(tit, items) {
    ventana('<h2>' + tit + '</h2><div class="tkm-prs" style="margin-top:10px">' + items.map(function (x) { return '<div class="tkm-pr">' + (x.img ? '<img src="' + esc(x.img) + '" alt="">' : '<span>' + x.ico + '</span>') + '<b>' + esc(x.n) + '</b><small style="display:block;font-size:9px;color:#f3e6c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.nom) + '</small></div>'; }).join('') + '</div><div class="tkm-bts"><button class="tkm-b verde" data-c="x">' + L('¡Genial!', 'Great!') + '</button></div>');
  }
  // dar premios (con la pieza al azar si toca)
  function dar(p, ids) { var q = {}; Object.keys(p).forEach(function (k) { q[k] = p[k]; }); if (!q.pieza && q.piezaProb && Math.random() < q.piezaProb) q.pieza = q.piezaR; return G.darMision(q, ids || []); }

  // ---- empezar una misión ----
  function atacar(c, i) {
    var d = st().dif, M = mision(c, i, d), dk = d;
    cerrarVentana();
    M.haySiguiente = i < 6 || c < 4;
    M.alTerminar = function (res) {
      var k = clave(dk, c, i), r = st().m[k] || { e: 0, n: 0 }, primera = !r.n, items = [], nota = '';
      if (!res.gano) return { items: [] };
      var antes = r.e || 0; r.n = (r.n || 0) + 1; r.e = Math.max(antes, res.estrellas); st().m[k] = r;
      var base = premiosBase(M);
      if (primera) { items = dar(base, res.heroes); nota = '🆕 ' + L('¡Primera victoria!', 'First victory!'); }
      else { var rp = st().rep || {}; if (rp.d !== hoy()) rp = { d: hoy(), n: 0 }; st().nRep = (st().nRep || 0) + 1; if (rp.n < REP_DIA) { rp.n++; items = dar(premiosRepetir(base), res.heroes); nota = '🔁 ' + rp.n + ' / ' + REP_DIA; } else nota = L('Sin premio: ya usaste las repeticiones de hoy.', 'No reward: today\'s replays are used.'); st().rep = rp; }
      if (res.estrellas >= 3 && antes < 3) { items = items.concat(dar(premioTres(M), res.heroes)); nota += (nota ? ' · ' : '') + '👑 ' + L('¡Extra por 3 estrellas!', '3-star bonus!'); }
      G.guardar();
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
    else if (c === 'dif') { var k = b.getAttribute('data-k'); if (!difAbierta(k)) { G.consejo('🔒 ' + L('Completa el Capítulo 1 en ' + (k === 'elite' ? 'Normal' : 'Élite') + ' para abrir esta dificultad.', 'Complete Chapter 1 on ' + (k === 'elite' ? 'Normal' : 'Elite') + ' to unlock this difficulty.')); return; } st().dif = k; G.guardar(); claros = {}; abiertosAntes = { d: k, l: [1, 2, 3, 4].filter(function (c2) { return capAbierto(k, c2); }) }; pintarUI(); centrar(); }
    else if (c === 'caps') ventanaCapitulos();
    else if (c === 'logros') ventanaLogros();
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
  window.TKMapa = { abrir: abrir, cerrar: function () { cerrar(); }, info: function () { return { abierto: !!raiz, dif: G && st().dif, estrellas: G ? totalEstrellas() : 0, actual: G ? actual() : null, cam: cam }; }, _mision: mision };
})();
