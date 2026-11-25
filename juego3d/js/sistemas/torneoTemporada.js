/* Tiny Kingdom · Torneo de Temporada (14 días, 4 fases, umbral mínimo para el Set).
   Módulo aparte: solo reglas y cálculos. juego.js lo usa para sumar puntos, pintar la ventana y guardar en la nube. */
(function () {
  var DIA = 86400000;
  var CONFIG = {
    nombre: { es: 'Copa del Dragón Imperial', en: 'Imperial Dragon Cup' },
    duracionDias: 14,
    umbralMinimoPuntos: 2000000,
    umbralMinimoLiquidacion: 500000,
    fases: [
      { fase: 1, diaInicio: 1, diaFin: 3, accion: 'poder', icono: '🏰', es: 'Desarrollo del Reino', en: 'Kingdom Growth', como_es: '+10 pts por cada 100 de Poder que subas (obras, investigación, tropas).', como_en: '+10 pts per 100 Power you gain (buildings, research, troops).' },
      { fase: 2, diaInicio: 4, diaFin: 6, accion: 'entrenar', icono: '⚔️', es: 'Llamado a las Armas', en: 'Call to Arms', como_es: 'Tropas entrenadas × (nivel de la tropa² × 5).', como_en: 'Troops trained × (troop level² × 5).' },
      { fase: 3, diaInicio: 7, diaFin: 10, accion: 'campana', icono: '🛖', es: 'Caza de Bárbaros', en: 'Barbarian Hunt', como_es: 'Nivel × 2,500 pts por cada victoria (oleadas, aldeas bárbaras, villas y bestias).', como_en: 'Level × 2,500 pts per win (waves, barbarian camps, villages and beasts).' },
      { fase: 4, diaInicio: 11, diaFin: 14, accion: 'liquidacion', icono: '💀', es: 'Guerra de Liquidación', en: 'Kill War', como_es: 'Liquidación en el Mapa Mundial × 10 (la fase que más puntos da).', como_en: 'World Map kills × 10 (the phase that gives the most points).' }
    ],
    // cofres personales (cada uno se cobra una vez por temporada)
    hitos: [
      { puntos: 100000, premio: [['acel_1h', 5], ['botella', 20]] }, // v9.05: también botellas de campaña
      { puntos: 300000, premio: [['ficha_x5', 1], ['carretas_x10', 1]] },
      { puntos: 600000, premio: [['estrella_mar', 15], ['amatista_100', 1]] },
      { puntos: 1000000, premio: [['pergamino', 10], ['botella', 40]] },
      { puntos: 1500000, premio: [['ficha_x5', 2], ['acel_8h', 1], ['amatista_100', 2]] },
      { puntos: 2500000, premio: [['cofre_equipo', 1], ['amatista_500', 1]] } // v7.97: Amatista rúnica
    ],
    // premios del ranking (las piezas del Set solo si cumple el mínimo). Sin gemas: en Tiny Kingdom las gemas solo se compran
    ranking: [
      { hasta: 1, piezas: 6, oro: 1000000, extra: 'titulo', amatista: 2000 },
      { hasta: 3, piezas: 4, oro: 500000, fichas: 10, amatista: 1000 },
      { hasta: 10, piezas: 2, oro: 250000, amatista: 500 },
      { hasta: 25, piezas: 1, cofres: 2, amatista: 200 }
    ],
    // consuelo para los del top 25 que no llegan al mínimo
    consuelo: { oro: 100000, objetos: [['acel_1h', 5], ['botella', 15]] }
  };
  // nivel de cada tropa para la fórmula nivel²
  var NIVEL_TROPA = { miliciano: 1, explorador: 1, espadachin: 2, arquero: 2, jinete: 2, guardian: 3, caballeria: 3, caballeria_pesada: 4, balista: 4, ariete: 4, catapulta: 5, torre_asedio: 5 };

  // la temporada 0 empezó el lunes 5 de enero de 1970 (UTC); cada una dura 14 días y empieza un lunes
  function idTemporada(ahora) { return Math.floor(((ahora || Date.now()) / DIA + 3) / CONFIG.duracionDias); }
  function inicio(id) { return (id * CONFIG.duracionDias - 3) * DIA; }
  function fin(id) { return inicio(id + 1); }
  function dia(ahora) { ahora = ahora || Date.now(); return Math.floor((ahora - inicio(idTemporada(ahora))) / DIA) + 1; }
  function faseActual(ahora) { var d = dia(ahora); for (var i = 0; i < CONFIG.fases.length; i++) if (d >= CONFIG.fases[i].diaInicio && d <= CONFIG.fases[i].diaFin) return CONFIG.fases[i]; return CONFIG.fases[CONFIG.fases.length - 1]; }
  function finFase(ahora) { ahora = ahora || Date.now(); var f = faseActual(ahora); return inicio(idTemporada(ahora)) + f.diaFin * DIA; }

  // puntos por una acción: solo cuenta si es la acción de la fase de hoy
  function puntos(accion, valor, nivelTropa, ahora) {
    var f = faseActual(ahora); if (f.accion !== accion || !(valor > 0)) return 0;
    if (accion === 'poder') return Math.floor(valor / 100) * 10;
    if (accion === 'entrenar') return Math.round(valor * Math.pow(nivelTropa || 1, 2) * 5);
    if (accion === 'campana') return Math.round(valor * 2500);
    if (accion === 'liquidacion') return Math.round(valor * 10);
    return 0;
  }
  function cumpleMinimo(p, liq) { return (p || 0) >= CONFIG.umbralMinimoPuntos && (liq || 0) >= CONFIG.umbralMinimoLiquidacion; }
  function premioRanking(pos) { for (var i = 0; i < CONFIG.ranking.length; i++) if (pos <= CONFIG.ranking[i].hasta) return CONFIG.ranking[i]; return null; }

  window.TorneoTemporada = { CONFIG: CONFIG, NIVEL_TROPA: NIVEL_TROPA, idTemporada: idTemporada, inicio: inicio, fin: fin, dia: dia, faseActual: faseActual, finFase: finFase, puntos: puntos, cumpleMinimo: cumpleMinimo, premioRanking: premioRanking };
})();
