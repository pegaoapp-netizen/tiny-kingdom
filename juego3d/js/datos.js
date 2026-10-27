// =====================================================================
//  DATOS DEL JUEGO: nombre, textos (español / inglés), precios y fuerzas.
//  Para cambiar el nombre del juego, cambia NOMBRE_JUEGO.
// =====================================================================

var VERSION_JUEGO = '3.2';
var NOMBRE_JUEGO = 'Tiny Kingdom';

// ---------------- Modo DUEÑO (solo para pruebas) ----------------
// Pon false antes de subir el juego a la App Store / Google Play.
var MODO_DUENO_ACTIVO = true;
// Huellas (SHA-256) de las cuentas del dueño: su correo y su usuario "maikelramirez55".
// No se guardan escritos en el código.
var HUELLAS_DUENO = [
  '04ffb008e35525eb03d5dea75e79bb0d8217c5aab3a3a8953ed15953563508c4',
  'fd78fd09b2cd76c82a80675a4c758b65306b2309aaff68e598a4e344e7024bad'
];
var GEMAS_DUENO = 99999;
// Dentro de la app de la App Store (Capacitor) se apagan los 5 toques al oro.
// El modo dueño con la cuenta del dueño sigue funcionando (necesita su contraseña).
var ES_APP_TIENDA = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
var TOQUES_DUENO_ACTIVO = MODO_DUENO_ACTIVO && !ES_APP_TIENDA;
var URL_PRIVACIDAD = 'https://tinykingdom-pegao.web.app/privacidad.html';

// ---------------- Firebase (cuentas y partida en la nube) ----------------
// Proyecto "Tiny Kingdom" (tiny-kingdom-pegao). Esta clave es pública por diseño;
// la seguridad la ponen las reglas de nube/firestore.rules.
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyDcsJEfuN-lZkQwRBPZjS-x_aonIXaQKRA",
  authDomain: "tiny-kingdom-pegao.firebaseapp.com",
  projectId: "tiny-kingdom-pegao",
  storageBucket: "tiny-kingdom-pegao.firebasestorage.app",
  messagingSenderId: "242555268635",
  appId: "1:242555268635:web:55b7089dd37219e94652be"
};

var TEXTOS = {
  es: {
    oleada: 'Oleada', castillo: 'Castillo',
    b_tropas: 'TROPAS', b_construir: 'CONSTRUIR', b_invocar: 'INVOCAR',
    intro: 'Construye tu reino, entrena caballeros y defiende el camino del bosque.',
    jugar: '¡Jugar!', continuar: 'Continuar partida', nueva: 'Nueva partida',
    empezar_oleada: '¡Empezar oleada {n}!', oleada_en_curso: 'Oleada {n}',
    aviso_oleada: '¡Oleada {n}!', aviso_jefe: '¡Llega el Ogro Jefe!',
    oleada_superada: '¡Oleada superada!',
    victoria: '¡Victoria!', victoria_txt: 'Defendiste el reino de las 5 oleadas y ganaste {g} gemas en total. ¡Eres un gran rey! Puedes seguir con oleadas infinitas (cada vez más fuertes) o empezar de nuevo.',
    seguir_infinito: 'Seguir jugando (oleadas infinitas)',
    derrota: 'El castillo cayó', derrota_txt: 'Los trasgos llegaron a tus puertas en la oleada {n}. No pierdes nada: tus edificios, tropas, monedas y gemas se quedan. Puedes intentar esa oleada otra vez con el castillo curado.',
    reintentar: 'Intentar otra vez',
    // Consejos
    c_granja: 'Toca CONSTRUIR y pon una Granja: da comida para tus tropas.',
    c_cuartel: 'Ahora construye un Cuartel para entrenar caballeros.',
    c_tropas: 'Toca TROPAS y entrena a tus primeros caballeros.',
    c_oleada: 'Cuando estés listo, toca "Empezar oleada". ¡Defiende el camino!',
    c_torre: 'Consejo: una Torre junto al camino dispara flechas sola.',
    c_elegir: 'Toca un terreno vacío (brilla) para construir.',
    c_mover: 'Arrastra para mover la cámara. Rueda o pellizca para acercar.',
    // Paneles
    p_construir: 'Construir', p_tropas: 'Tropas', p_invocar: 'Invocar', p_ajustes: 'Ajustes',
    construir: 'Construir', mejorar: 'Mejorar', nivel: 'Nivel', nivel_max: 'Nivel máximo',
    entrenar: 'Entrenar', en_cola: 'Entrenando', cola_vacia: 'Nadie en entrenamiento.',
    necesitas_cuartel: 'Necesitas un Cuartel para entrenar tropas.',
    sin_espacio: 'No hay espacio: mejora o construye más Cuarteles.',
    sin_terreno: 'No quedan terrenos libres. Mejora tus edificios.',
    sin_monedas: 'No tienes monedas suficientes.', sin_gemas: 'No tienes gemas suficientes.',
    construyendo: 'Construyendo...', elige_terreno: 'Elige un terreno que brille',
    cancelar: 'Cancelar',
    vida: 'Vida', dano: 'Daño', alcance: 'Alcance', produce: 'Produce', cada: 'cada {s}s',
    capacidad: 'Capacidad', velocidad_ent: 'Entrena más rápido',
    tropas_vivas: 'Tropas: {a}', sin_tope: 'Entrena sin límite',
    invocar3: 'Invocar 3 tropas al azar', invocar3_txt: 'Aparecen al momento, sin esperar.',
    heroe_txt: 'Héroe muy fuerte que se cura solo. Solo uno a la vez.',
    heroe_vivo: 'Tu héroe ya está en el campo.',
    sonido: 'Sonido', musica: 'Música', idioma: 'Idioma', velocidad: 'Velocidad',
    pruebas: 'Herramienta de pruebas (solo el dueño)',
    pruebas_txt: 'Botón para probar. No se puede vender ni dar a otros jugadores.',
    dar_gemas: '+100 gemas de prueba', dar_monedas: '+500 monedas de prueba',
    borrar: 'Borrar partida y empezar de cero', borrar_ok: '¿Seguro? Se perderá todo.',
    guardado: 'Partida guardada', castillo_info: 'El corazón de tu reino. Sus arqueros disparan a los enemigos cercanos.',
    oro_ganado: '+{n} monedas', gemas_ganadas: '+{n} gemas',
    usuario: 'Usuario', contrasena: 'Contraseña', repetir: 'Repite la contraseña',
    entrar_btn: 'Entrar', crear_cuenta: 'Crear cuenta nueva', tengo_cuenta: 'Ya tengo cuenta', invitado: 'Jugar sin cuenta',
    invitado_txt: 'Sin cuenta, la partida solo se guarda en este teléfono.',
    login_txt: 'Entra con tu usuario para guardar tu reino en la nube y jugar en cualquier teléfono.',
    crear_txt: 'Elige un usuario (3 a 20 letras o números) o tu correo, y una contraseña de 6 o más.',
    hola: '¡Hola, {n}!', cerrar_sesion: 'Cerrar sesión', cargando: 'Cargando...', guardado_nube: 'Guardado en la nube ☁️',
    cuenta_de: 'Conectado como', entrar_o_crear: 'Entrar o crear cuenta',
    e_clave: 'Usuario o contraseña incorrectos.', e_existe: 'Ese usuario ya existe. Elige otro o entra.',
    e_debil: 'La contraseña debe tener 6 o más caracteres.', e_usuario: 'Usuario no válido: usa 3 a 20 letras, números, _ o punto.',
    e_red: 'Sin internet. Revisa tu conexión.', e_muchos: 'Demasiados intentos. Espera un poco.',
    e_general: 'No se pudo. Inténtalo otra vez.', e_repetir: 'Las contraseñas no son iguales.',
    e_sin_nube: 'Las cuentas no están disponibles ahora (sin internet).',
    gemas_inf: 'Gemas infinitas',
    r_oro: 'oro', r_comida: 'comida', r_madera: 'madera', r_piedra: 'piedra', r_gemas: 'gemas',
    falta: 'Te falta {r}.', costo: 'Cuesta', produce_txt: 'Produce {n} {r} cada {s} s',
    comen: 'Tus tropas comen {n} de comida por minuto.', sin_comida: '¡Sin comida! Tus tropas pelean más débiles. Construye Granjas.',
    impuesto: 'El castillo cobra {n} de oro cada {s} s.', recursos_inf: 'Recursos infinitos',
    c_aserradero: 'Ahora pon un Aserradero: da madera para construir.', c_mina: 'Consejo: una Mina da piedra para torres y muralla.',
    c_barricada: 'Consejo: pon una Barricada en el camino para frenar a los enemigos.',
    colocando_barr: 'Elige un punto del camino para la Barricada', punto_ocupado: 'Ya hay una Barricada ahí.',
    barr_rota: '🚧 ¡Rompieron una Barricada!', barr_arreglo: 'Las barricadas se arreglan solas al terminar la oleada.',
    madera_nivel: 'de madera', piedra_nivel: 'de piedra',
    t_aliada: 'Tu tropa', t_enemigo: 'Enemigo', t_invocada: 'Invocada con gemas (no ocupa lugar en el cuartel)', t_heroe: 'Héroe: se cura solo poco a poco',
    t_lenta: 'Velocidad', t_ritmo: 'Ataca cada {s} s', t_oro: 'Suelta {n} de oro al caer', t_hambre: 'Con hambre: pega más débil',
    armadura: 'Armadura', mejorar_armadura: 'Mejorar armadura', armadura_sube: 'Nivel {n}: +{v}% vida, +{d}% defensa',
    armadura_max: 'Armadura al máximo ★★★', defensa: 'Defensa', armadura_lista: '🛡️ ¡Armadura de {t} nivel {n}! Se nota en tus tropas.',
    b_conquista: 'FRONTERA', b_heroes: 'GUARDIA', b_mochila: 'BAÚL', b_tienda: 'COLMADO',
    p_conquista: 'La frontera', p_heroes: 'La guardia', p_mochila: 'Baúl', p_tienda: 'Colmado', sub_tropas: 'Tropas', sub_invocar: 'Invocar',
    conquista_txt: 'Defiende el reino de cada oleada. Al ganarla recibes gemas.', oleada_curso: 'Oleada en curso: quedan {n} enemigos.',
    vienen: 'Vienen:', oleadas_ganadas: 'Oleadas ganadas',
    diario_titulo: 'Cofre diario', diario_txt: 'Entra cada día para un cofre mejor. Si faltas un día, la racha vuelve a empezar.',
    diario_dia: 'Día {n}', diario_reclamar: '🎁 Reclamar cofre del día {n}', diario_listo: 'Ya lo reclamaste hoy. Vuelve mañana por el día {n}.',
    diario_racha: '🔥 Racha: {n} días seguidos', mochila_vacia: 'Tu baúl está vacío. Consigue cofres con el cofre diario o en el Colmado.',
    mis_objetos: 'Tus objetos', usar: 'Usar', abrir: 'Abrir', recibiste: '🎁 Recibiste: {t}', tropas_regalo: '{n} tropas',
    tienda_txt: 'Compra con gemas. Lo que compras se guarda en tu Baúl 🧳. Las gemas se ganan en las oleadas y en el cofre diario.',
    tienda_real: 'Compras con dinero real: llegarán con la versión de la App Store.', comprar: 'Comprar', comprado: '{n}: guardado en tu Baúl 🧳',
    acelerador_usado: '⏩ ¡Le quitaste 1 hora a todas las obras!', sub_heroes: 'Héroes', heroes_txt: 'Tus héroes salen del castillo en cada oleada y usan su poder. Lleva hasta 3 en tu equipo.', reclutar: 'Reclutar héroe', reclutar_gratis: '🎁 Gratis hoy', reclutar_txt: 'Recluta para conseguir héroes nuevos. Si sale uno que ya tienes, ganas fragmentos para subirle estrellas.', heroe_nuevo: '🎉 ¡Nuevo héroe: {n}!', heroe_frag: '+{f} fragmentos de {n}', equipo_n: 'Equipo: {n}/3', en_equipo: 'EQUIPO', poner_equipo: '➕ Poner en el equipo', quitar_equipo: '➖ Quitar del equipo', equipo_lleno: 'Tu equipo ya tiene 3 héroes. Quita uno primero.', subir_nivel: 'Subir nivel', subir_estrella: '⭐ Subir estrella', nivel_tope: 'Sube una estrella para pasar del nivel {n}.', fragmentos: 'Fragmentos', poder_heroe: 'Poder', bloqueado: '🔒 Consíguelo reclutando', rareza_comun: 'Común', rareza_raro: 'Raro', rareza_legendario: 'Legendario', clase_infanteria: 'Infantería', clase_arquero: 'Arquero', clase_magia: 'Magia', clase_guardian: 'Guardián', heroe_sube: '⬆️ ¡{n} subió al nivel {v}!', heroe_estrella: '⭐ ¡{n} ahora tiene {v} estrellas!', volver: '⬅ Volver', resultado: 'Resultado', estrellas_max: '★ Estrellas al máximo', cada_s: 'cada {s} s', ref_titulo: '📣 Refuerzos', ref_txt: 'Tus tropas pueden defender el reino de un aliado: pelean en sus oleadas y suman a su defensa. Las puedes retirar cuando quieras.', ref_pedir: '📣 Pedir refuerzos', ref_pedido_hecho: '📣 Pediste refuerzos a tu hermandad.', ref_quitar_pedido: 'Quitar pedido', ref_pedidos: 'Piden ayuda', ref_ninguno: 'Nadie está pidiendo ayuda ahora.', ref_reforzar: '🛡️ Reforzar', ref_en_reino: 'Refuerzos en tu reino', ref_enviados: 'Tus refuerzos enviados', ref_devolver: 'Devolver', ref_retirar: 'Retirar', ref_de: '{n} tropas de {q}', ref_a: '{n} tropas en el reino de {q}', ref_enviar_a: 'Enviar refuerzos a {q}', ref_tienes: 'Tienes {n}', ref_enviar: '🛡️ Enviar refuerzos', ref_enviado: '🛡️ ¡Refuerzos enviados a {q}!', ref_volvieron: '🛡️ Volvieron {n} tropas del reino de {q}', ref_error: 'No se pudo. Revisa tu internet y que los dos estén en la misma hermandad.', ref_en_oleada: 'Espera a que termine la oleada.', ref_nada: 'Elige al menos una tropa.', ref_llegaron: '🛡️ ¡Llegaron refuerzos de {q}!', ref_devueltos: 'Devolviste los refuerzos.', ref_retirados: 'Tus tropas vuelven a casa.', ref_nadie: 'Todavía no hay refuerzos.', toca_tu_castillo: '👑 Toca tu castillo para entrar a tu ciudad', entrar_ciudad: 'Entrar', bienvenido_ciudad: '🏰 ¡Bienvenido a tu ciudad!', armaduras_tienda: '🛡️ Armaduras', armaduras_tienda_txt: 'Ponle armadura a un tipo de tropa: todas las de ese tipo (y las que entrenes) la llevan puesta.', armadura_para: 'Armadura {n} — {t}', entrenando_n: '⚔️ Entrenando {n} tropas', maximo: 'Máx', terminar_ya: 'Terminar ya', terminado_gemas: '💎 ¡Terminado!', escudo_activo: '🛡️ Escudo activo: faltan {t}. Espera a que se acabe para poner otro.', escudo_activo_btn: 'Activo: {t}', nada_acelerar: 'No hay nada construyéndose ni entrenándose.', pest_cuartel: 'Cuartel', pest_establo: 'Establo', pest_tiro: 'Campo de tiro', rango: 'Rango', rango_bloq: '🔒 El rango {r} está bloqueado. Sube la armadura para desbloquearlo.', rango_antes: '🔒 Primero desbloquea el rango {r}.', subir_rango: 'Subir a rango {r}', entrenadas_ya: '⚔️ ¡{n} × {t} listas!', sin_recursos_tropa: 'No te alcanzan los materiales para entrenar esta tropa.', terminar_cola: 'Terminar entrenamiento',
    p_investigar: 'Investigación', investigar: 'Investigar', rama_crecimiento: 'Crecimiento', rama_economia: 'Economía', rama_batalla: 'Batalla',
    inv_txt: 'Cada tecnología mejora algo de verdad en tu reino. Solo se investiga una a la vez.', inv_ahora: 'Ahora', inv_siguiente: 'Siguiente',
    inv_en_curso: 'Investigando: {n} (nivel {l})', inv_falta: 'Faltan {s} s', inv_ocupada: 'La Academia ya está investigando.',
    inv_tope: 'Mejora la Academia para pasar del nivel {n}.', inv_lista: '📜 ¡{n} nivel {l} lista!', inv_necesitas: 'Construye una Academia para investigar.',
    inv_abrir: '📜 Abrir investigación', c_academia: 'Consejo: construye una Academia para investigar mejoras.',
    b_mundo: 'ISLAS', b_alianza: 'HERMANDAD', p_mundo: 'Mapa de las islas', p_alianza: 'Hermandad',
    mundo_cuenta: 'Crea una cuenta para aparecer en el mapa de las islas y unirte a una hermandad.',
    mundo_cargando: 'Cargando el mapa...', mundo_error: 'No se pudo cargar el mapa. Revisa tu internet.',
    mundo_solo: 'Por ahora eres el único reino en el mapa. ¡Invita a tus amigos a jugar!',
    leyenda_tu: 'Tú', leyenda_alianza: 'Tu hermandad', leyenda_otros: 'Otros reinos', leyenda_trasgos: 'Trasgos',
    tu_reino: 'Tu reino', reino_de: 'Reino de {n}', campamento: 'Campamento de trasgos',
    campamento_txt: 'De aquí salen las oleadas que atacan los reinos. ¡Cuidado!', sin_alianza: 'Sin hermandad',
    reinos_en_mapa: '{n} reinos en el mapa',
    al_crear: 'Crear hermandad', al_nombre: 'Nombre de la hermandad (3 a 24)', al_tag: 'Etiqueta (2 a 4 letras)',
    al_crear_btn: 'Crear', al_lista: 'Hermandades para unirte', al_ninguna: 'Todavía no hay hermandades. ¡Crea la primera!',
    al_unirse: 'Unirse', al_salir: 'Salir de la hermandad', al_miembros: 'Miembros ({n})', al_lider: 'Líder',
    al_ver_mapa: 'Ver en el mapa', al_existe: 'Esa etiqueta ya está usada. Elige otra.',
    al_nombre_mal: 'El nombre debe tener de 3 a 24 letras.', al_tag_mal: 'La etiqueta debe tener de 2 a 4 letras o números.',
    al_creada: '🛡️ ¡Hermandad [{t}] creada!', al_unido: '🛡️ Te uniste a [{t}]', al_salido: 'Saliste de la hermandad.',
    al_borrada: 'Esa hermandad ya no existe.', al_salir_ok: '¿Seguro que quieres salir de la hermandad?',
    al_lider_sale: 'Eres el líder: si sales, la hermandad se borra. ¿Seguro?',
    info_oro: 'Oro 🪙: lo cobra el castillo cada pocos segundos y lo sueltan los enemigos al caer.',
    info_comida: 'Comida 🍞: la dan las Granjas. Sirve para entrenar y alimentar a tus tropas.',
    info_madera: 'Madera 🪵: la da el Aserradero. Sirve para construir y mejorar.',
    info_piedra: 'Piedra 🪨: la da la Mina. Sirve para torres, muralla de piedra y mejoras.',
    info_gemas: 'Gemas 💎: se ganan al superar oleadas. Sirven para invocar.',
    camas: 'Camas', a_enfermeria: '💚 A la enfermería', curados: '💚 Se curaron {n} tropas', en_enfermeria: 'En la enfermería: {n} (vuelven al terminar la oleada)',
    atacar: '⚔️ Atacar', atacar_ya: '⚔️ ¡Atacar con todas mis tropas!', at_titulo: 'Atacar a {n}',
    at_fuerza: 'Tu ejército', at_defensa: 'Su defensa (aprox.)', at_botin: 'Botín si ganas (hasta)', at_facil: '😀 Fácil', at_parejo: '😐 Parejo', at_dificil: '😬 Difícil',
    at_nota: 'Atacar quita tu protección. Las tropas que caen pueden ir a tu Enfermería.', at_sin_tropas: 'No tienes tropas para atacar. Entrena en la Guardia.',
    at_dueno: 'En modo dueño no se puede atacar a otros jugadores (sería injusto).', at_protegido: 'Ese reino está protegido. Faltan {t}.',
    at_aliado: 'No puedes atacar a alguien de tu hermandad.', at_espera: 'Ya atacaste ese reino hace poco. Espera {t}.', at_cuenta: 'Necesitas una cuenta para atacar.',
    at_batalla: '⚔️ ¡Batalla en curso!', at_gano: '🏆 ¡Ganaste! Te llevaste: {b}', at_perdio: '💔 Perdiste la batalla. Su defensa resistió.',
    at_bajas: 'Tropas caídas: {n}', at_error: 'No se pudo atacar (sin internet o el reino se protegió).',
    rep_titulo: 'Reporte de ataques', rep_te_ataco: '⚔️ {n} atacó tu reino', rep_perdiste: 'Se llevó: {b}', rep_resististe: '🛡️ ¡Tu defensa resistió!',
    rep_escudo: 'Recibiste una protección de 30 minutos.', rep_ok: 'Entendido', defensa_txt: 'Defensa',
    escudo_usado: '🛡️ ¡Reino protegido! Faltan {t}', protegido_falta: '🛡️ Protegido: faltan {t}', escudo_info: 'Mientras dure la protección, ningún jugador podrá atacar tu reino (para cuando lleguen los ataques entre jugadores). En el mapa se ve un escudo sobre tu aldea.',
    calidad: 'Calidad de gráficos', calidad_alta: 'Alta', calidad_baja: 'Baja (más rápido)', calidad_txt: 'Alta: sombras, humo y polvo. Baja: va más rápido en teléfonos viejos.',
    faltan_t: 'Faltan {t}', proximo_cofre: '⏰ Próximo cofre en {t}', entrenando_t: 'Faltan {t} para terminar el entrenamiento',
    castillo_nivel: 'Castillo — nivel {n} de {m}', mejorar_castillo: '🏰 Mejorar castillo', castillo_bloquea: '🏰 Primero mejora el Castillo al nivel {n}.',
    castillo_subiendo: '🏰 El castillo se está mejorando al nivel {n}', castillo_listo: '🏰 ¡Castillo nivel {n}! Ya puedes subir tus edificios hasta el nivel {n}.',
    castillo_tope: 'Tus edificios pueden llegar hasta el nivel {n}.', castillo_sube: 'Al subir al nivel {n}: +{v} de vida, +{d} de daño y edificios hasta nivel {n}.',
    torres_puerta: 'Torres de la puerta', torres_puerta_txt: 'Dos torres con arqueros protegen la puerta de la muralla. Pegan más fuerte con cada nivel de la muralla.',
    nivel_de: 'Nivel {n} de {m}', sube_a: 'Al subir al nivel {n}:', nivel_corto: 'Nv',
    vida_extra: 'Vida extra del castillo', muralla_nivel: 'Muralla nivel {n}', sin_muralla: 'Todavía no tienes Muralla.',
    c_enfermeria: 'Consejo: una Enfermería salva a las tropas que caen en batalla.', c_muralla: 'Consejo: construye la Muralla para que el castillo aguante más.',
    muralla_lista: '🧱 ¡Muralla nivel {n} lista! El castillo tiene más vida.',
    modo_dueno: '👑 DUEÑO', poder_titulo: '¿Qué es el Poder?',
    poder_txt: 'El Poder es la fuerza total de tu reino. Sube cuando entrenas tropas, construyes o mejoras edificios y ganas oleadas.',
    poder_tropas: 'Tropas', poder_edificios: 'Edificios', poder_oleadas: 'Oleadas ganadas',
    nivel_txt: 'El número rojo de la corona es tu nivel de rey: la oleada en la que vas.',
    ultima: '¡la última!', ocupado: 'Ese terreno ya tiene un edificio.', colocando: 'Elige un terreno que brille para tu {n}',
    premio: 'Premio: +{g} 💎', invocaste: 'Llegaron: {t}',
    pausa: 'PAUSA', pausa_txt: 'Toca ▶ para seguir', enemigos: 'enemigos', tiempo: 'Tiempo', cura: 'Cura',
    borrar_cuenta: 'Borrar mi cuenta', borrar_cuenta_txt: 'Se borrará tu cuenta y tu partida de la nube para siempre. Escribe tu contraseña para confirmar.',
    borrar_cuenta_ok: 'Borrar para siempre', cuenta_borrada: 'Tu cuenta fue borrada.', privacidad: 'Privacidad', novedades: '¡Novedades!', novedades_lista: '<li>👑 <b>Sir Sol tiene un modelo nuevo</b>: caballero dorado con capa roja, penacho, espada y escudo con estrella.</li><li>🦵 Ahora camina de verdad, respira cuando está quieto y da el espadazo en las peleas.</li><li>🧹 Se quitó el botón «Nueva partida» para que nadie borre su reino sin querer.</li>', novedades_ok: '¡A jugar!',
    poder: 'Poder', cuenta: 'Cuenta', correo: 'Tu correo', entrar: 'Entrar',
    correo_no: 'Ese correo no es de una cuenta de dueño.', cuenta_jugador: 'Jugador invitado',
    dueno_activo: '👑 Modo DUEÑO activado', dueno_titulo: 'Menú del dueño (pruebas)',
    dueno_txt: 'Solo para probar. No se puede vender ni dar a otros jugadores.',
    gemas_max: '99.999 gemas', oro_inf: 'Oro infinito', vel10: 'Velocidad x10',
    saltar_oleada: 'Ir a la siguiente oleada', salir_dueno: 'Salir del modo dueño',
    encendido: 'ON', apagado: 'OFF', cuenta_dueno: 'Cuenta principal (dueño)'
  },
  en: {
    oleada: 'Wave', castillo: 'Castle',
    b_tropas: 'TROOPS', b_construir: 'BUILD', b_invocar: 'SUMMON',
    intro: 'Build your kingdom, train knights and defend the forest road.',
    jugar: 'Play!', continuar: 'Continue game', nueva: 'New game',
    empezar_oleada: 'Start wave {n}!', oleada_en_curso: 'Wave {n}',
    aviso_oleada: 'Wave {n}!', aviso_jefe: 'The Ogre Boss is coming!',
    oleada_superada: 'Wave cleared!',
    victoria: 'Victory!', victoria_txt: 'You defended the kingdom from all 5 waves and won {g} gems in total. Long live the king! Keep going with endless waves (stronger each time) or start over.',
    seguir_infinito: 'Keep playing (endless waves)',
    derrota: 'The castle has fallen', derrota_txt: 'The goblins reached your gates on wave {n}. You lose nothing: your buildings, troops, coins and gems stay. You can try that wave again with the castle healed.',
    reintentar: 'Try again',
    c_granja: 'Tap BUILD and place a Farm: it gives food for your troops.',
    c_cuartel: 'Now build Barracks to train knights.',
    c_tropas: 'Tap TROOPS and train your first knights.',
    c_oleada: 'When you are ready, tap "Start wave". Defend the road!',
    c_torre: 'Tip: a Tower next to the road shoots arrows on its own.',
    c_elegir: 'Tap an empty (glowing) plot to build.',
    c_mover: 'Drag to move the camera. Scroll or pinch to zoom.',
    p_construir: 'Build', p_tropas: 'Troops', p_invocar: 'Summon', p_ajustes: 'Settings',
    construir: 'Build', mejorar: 'Upgrade', nivel: 'Level', nivel_max: 'Max level',
    entrenar: 'Train', en_cola: 'Training', cola_vacia: 'Nobody in training.',
    necesitas_cuartel: 'You need Barracks to train troops.',
    sin_espacio: 'No room: upgrade or build more Barracks.',
    sin_terreno: 'No free plots left. Upgrade your buildings.',
    sin_monedas: 'Not enough coins.', sin_gemas: 'Not enough gems.',
    construyendo: 'Building...', elige_terreno: 'Pick a glowing plot',
    cancelar: 'Cancel',
    vida: 'Health', dano: 'Damage', alcance: 'Range', produce: 'Makes', cada: 'every {s}s',
    capacidad: 'Capacity', velocidad_ent: 'Trains faster',
    tropas_vivas: 'Troops: {a}', sin_tope: 'Train without limit',
    invocar3: 'Summon 3 random troops', invocar3_txt: 'They appear right away, no waiting.',
    heroe_txt: 'A very strong hero who heals over time. Only one at a time.',
    heroe_vivo: 'Your hero is already on the field.',
    sonido: 'Sound', musica: 'Music', idioma: 'Language', velocidad: 'Speed',
    pruebas: 'Testing tool (owner only)',
    pruebas_txt: 'Button for testing. It cannot be sold or given to other players.',
    dar_gemas: '+100 test gems', dar_monedas: '+500 test coins',
    borrar: 'Delete save and start over', borrar_ok: 'Are you sure? Everything will be lost.',
    guardado: 'Game saved', castillo_info: 'The heart of your kingdom. Its archers shoot nearby enemies.',
    oro_ganado: '+{n} coins', gemas_ganadas: '+{n} gems',
    usuario: 'Username', contrasena: 'Password', repetir: 'Repeat password',
    entrar_btn: 'Sign in', crear_cuenta: 'Create new account', tengo_cuenta: 'I have an account', invitado: 'Play without account',
    invitado_txt: 'Without an account, progress is only saved on this phone.',
    login_txt: 'Sign in with your username to save your kingdom in the cloud and play on any phone.',
    crear_txt: 'Pick a username (3 to 20 letters or numbers) or your email, and a password of 6 or more.',
    hola: 'Hi, {n}!', cerrar_sesion: 'Sign out', cargando: 'Loading...', guardado_nube: 'Saved to the cloud ☁️',
    cuenta_de: 'Signed in as', entrar_o_crear: 'Sign in or create account',
    e_clave: 'Wrong username or password.', e_existe: 'That username already exists. Pick another or sign in.',
    e_debil: 'Password must have 6 or more characters.', e_usuario: 'Invalid username: use 3 to 20 letters, numbers, _ or dot.',
    e_red: 'No internet. Check your connection.', e_muchos: 'Too many tries. Wait a bit.',
    e_general: 'Something went wrong. Try again.', e_repetir: 'Passwords do not match.',
    e_sin_nube: 'Accounts are not available right now (no internet).',
    gemas_inf: 'Infinite gems',
    r_oro: 'gold', r_comida: 'food', r_madera: 'wood', r_piedra: 'stone', r_gemas: 'gems',
    falta: 'You need more {r}.', costo: 'Costs', produce_txt: 'Makes {n} {r} every {s} s',
    comen: 'Your troops eat {n} food per minute.', sin_comida: 'Out of food! Your troops fight weaker. Build Farms.',
    impuesto: 'The castle collects {n} gold every {s} s.', recursos_inf: 'Infinite resources',
    c_aserradero: 'Now place a Sawmill: it gives wood to build.', c_mina: 'Tip: a Mine gives stone for towers and the wall.',
    c_barricada: 'Tip: place a Barricade on the road to slow enemies down.',
    colocando_barr: 'Pick a spot on the road for the Barricade', punto_ocupado: 'There is already a Barricade there.',
    barr_rota: '🚧 A Barricade was broken!', barr_arreglo: 'Barricades repair themselves when the wave ends.',
    madera_nivel: 'wooden', piedra_nivel: 'stone',
    t_aliada: 'Your troop', t_enemigo: 'Enemy', t_invocada: 'Summoned with gems (does not use a barracks spot)', t_heroe: 'Hero: heals slowly over time',
    t_lenta: 'Speed', t_ritmo: 'Attacks every {s} s', t_oro: 'Drops {n} gold when defeated', t_hambre: 'Hungry: hits weaker',
    armadura: 'Armor', mejorar_armadura: 'Upgrade armor', armadura_sube: 'Level {n}: +{v}% health, +{d}% defense',
    armadura_max: 'Armor at max ★★★', defensa: 'Defense', armadura_lista: '🛡️ {t} armor level {n}! You can see it on your troops.',
    b_conquista: 'FRONTIER', b_heroes: 'GUARD', b_mochila: 'CHEST', b_tienda: 'MARKET',
    p_conquista: 'The frontier', p_heroes: 'The guard', p_mochila: 'Chest', p_tienda: 'Market', sub_tropas: 'Troops', sub_invocar: 'Summon',
    conquista_txt: 'Defend the kingdom from each wave. Win it to earn gems.', oleada_curso: 'Wave in progress: {n} enemies left.',
    vienen: 'Coming:', oleadas_ganadas: 'Waves won',
    diario_titulo: 'Daily chest', diario_txt: 'Come back every day for a better chest. Miss a day and the streak starts over.',
    diario_dia: 'Day {n}', diario_reclamar: '🎁 Claim day {n} chest', diario_listo: 'Already claimed today. Come back tomorrow for day {n}.',
    diario_racha: '🔥 Streak: {n} days in a row', mochila_vacia: 'Your chest is empty. Get chests from the daily chest or the Market.',
    mis_objetos: 'Your items', usar: 'Use', abrir: 'Open', recibiste: '🎁 You got: {t}', tropas_regalo: '{n} troops',
    tienda_txt: 'Buy with gems. What you buy goes to your Chest 🧳. Gems are won in waves and from the daily chest.',
    tienda_real: 'Real-money purchases: coming with the App Store version.', comprar: 'Buy', comprado: '{n}: saved in your Chest 🧳',
    acelerador_usado: '⏩ You took 1 hour off all buildings!', sub_heroes: 'Heroes', heroes_txt: 'Your heroes come out of the castle every wave and use their power. Take up to 3 in your team.', reclutar: 'Recruit hero', reclutar_gratis: '🎁 Free today', reclutar_txt: 'Recruit to get new heroes. If you get one you already have, you earn shards to raise its stars.', heroe_nuevo: '🎉 New hero: {n}!', heroe_frag: '+{f} {n} shards', equipo_n: 'Team: {n}/3', en_equipo: 'TEAM', poner_equipo: '➕ Add to team', quitar_equipo: '➖ Remove from team', equipo_lleno: 'Your team already has 3 heroes. Remove one first.', subir_nivel: 'Level up', subir_estrella: '⭐ Raise star', nivel_tope: 'Raise a star to go above level {n}.', fragmentos: 'Shards', poder_heroe: 'Power', bloqueado: '🔒 Get it by recruiting', rareza_comun: 'Common', rareza_raro: 'Rare', rareza_legendario: 'Legendary', clase_infanteria: 'Infantry', clase_arquero: 'Archer', clase_magia: 'Magic', clase_guardian: 'Guardian', heroe_sube: '⬆️ {n} reached level {v}!', heroe_estrella: '⭐ {n} now has {v} stars!', volver: '⬅ Back', resultado: 'Result', estrellas_max: '★ Max stars', cada_s: 'every {s} s', ref_titulo: '📣 Reinforcements', ref_txt: 'Your troops can defend an ally’s kingdom: they fight in their waves and add to their defense. You can call them back any time.', ref_pedir: '📣 Ask for reinforcements', ref_pedido_hecho: '📣 You asked your guild for reinforcements.', ref_quitar_pedido: 'Remove request', ref_pedidos: 'Asking for help', ref_ninguno: 'Nobody is asking for help right now.', ref_reforzar: '🛡️ Reinforce', ref_en_reino: 'Reinforcements in your kingdom', ref_enviados: 'Your reinforcements sent', ref_devolver: 'Send back', ref_retirar: 'Call back', ref_de: '{n} troops from {q}', ref_a: '{n} troops in {q}’s kingdom', ref_enviar_a: 'Send reinforcements to {q}', ref_tienes: 'You have {n}', ref_enviar: '🛡️ Send reinforcements', ref_enviado: '🛡️ Reinforcements sent to {q}!', ref_volvieron: '🛡️ {n} troops came back from {q}’s kingdom', ref_error: 'Could not do it. Check your internet and that you are both in the same guild.', ref_en_oleada: 'Wait until the wave ends.', ref_nada: 'Choose at least one troop.', ref_llegaron: '🛡️ Reinforcements arrived from {q}!', ref_devueltos: 'You sent the reinforcements back.', ref_retirados: 'Your troops are coming home.', ref_nadie: 'No reinforcements yet.', toca_tu_castillo: '👑 Tap your castle to enter your city', entrar_ciudad: 'Enter', bienvenido_ciudad: '🏰 Welcome to your city!', armaduras_tienda: '🛡️ Armor', armaduras_tienda_txt: 'Give armor to a troop type: every troop of that type (and new ones) wears it.', armadura_para: 'Armor {n} — {t}', entrenando_n: '⚔️ Training {n} troops', maximo: 'Max', terminar_ya: 'Finish now', terminado_gemas: '💎 Done!', escudo_activo: '🛡️ Shield active: {t} left. Wait until it ends to use another one.', escudo_activo_btn: 'Active: {t}', nada_acelerar: 'Nothing is being built or trained.', pest_cuartel: 'Barracks', pest_establo: 'Stable', pest_tiro: 'Archery range', rango: 'Rank', rango_bloq: '🔒 Rank {r} is locked. Upgrade the armor to unlock it.', rango_antes: '🔒 Unlock rank {r} first.', subir_rango: 'Upgrade to rank {r}', entrenadas_ya: '⚔️ {n} × {t} ready!', sin_recursos_tropa: 'You do not have enough materials to train this troop.', terminar_cola: 'Finish training',
    p_investigar: 'Research', investigar: 'Research', rama_crecimiento: 'Growth', rama_economia: 'Economy', rama_batalla: 'Battle',
    inv_txt: 'Each technology really improves something in your kingdom. Only one at a time.', inv_ahora: 'Now', inv_siguiente: 'Next',
    inv_en_curso: 'Researching: {n} (level {l})', inv_falta: '{s} s left', inv_ocupada: 'The Academy is already researching.',
    inv_tope: 'Upgrade the Academy to go past level {n}.', inv_lista: '📜 {n} level {l} done!', inv_necesitas: 'Build an Academy to research.',
    inv_abrir: '📜 Open research', c_academia: 'Tip: build an Academy to research upgrades.',
    b_mundo: 'ISLES', b_alianza: 'CREW', p_mundo: 'Isles map', p_alianza: 'Crew',
    mundo_cuenta: 'Create an account to appear on the isles map and join a crew.',
    mundo_cargando: 'Loading the map...', mundo_error: 'Could not load the map. Check your internet.',
    mundo_solo: 'For now you are the only kingdom on the map. Invite your friends to play!',
    leyenda_tu: 'You', leyenda_alianza: 'Your crew', leyenda_otros: 'Other kingdoms', leyenda_trasgos: 'Goblins',
    tu_reino: 'Your kingdom', reino_de: '{n}\'s kingdom', campamento: 'Goblin camp',
    campamento_txt: 'The waves that attack the kingdoms come from here. Watch out!', sin_alianza: 'No crew',
    reinos_en_mapa: '{n} kingdoms on the map',
    al_crear: 'Create crew', al_nombre: 'Crew name (3 to 24)', al_tag: 'Tag (2 to 4 letters)',
    al_crear_btn: 'Create', al_lista: 'Crews to join', al_ninguna: 'No crews yet. Create the first one!',
    al_unirse: 'Join', al_salir: 'Leave crew', al_miembros: 'Members ({n})', al_lider: 'Leader',
    al_ver_mapa: 'See on map', al_existe: 'That tag is taken. Pick another.',
    al_nombre_mal: 'The name must be 3 to 24 letters.', al_tag_mal: 'The tag must be 2 to 4 letters or numbers.',
    al_creada: '🛡️ Crew [{t}] created!', al_unido: '🛡️ You joined [{t}]', al_salido: 'You left the crew.',
    al_borrada: 'That crew no longer exists.', al_salir_ok: 'Are you sure you want to leave the crew?',
    al_lider_sale: 'You are the leader: if you leave, the crew is deleted. Are you sure?',
    info_oro: 'Gold 🪙: the castle collects it every few seconds and enemies drop it.',
    info_comida: 'Food 🍞: Farms make it. Used to train and feed your troops.',
    info_madera: 'Wood 🪵: the Sawmill makes it. Used to build and upgrade.',
    info_piedra: 'Stone 🪨: the Mine makes it. Used for towers, the stone wall and upgrades.',
    info_gemas: 'Gems 💎: won by clearing waves. Used to summon.',
    camas: 'Beds', a_enfermeria: '💚 To the infirmary', curados: '💚 {n} troops healed', en_enfermeria: 'In the infirmary: {n} (back when the wave ends)',
    atacar: '⚔️ Attack', atacar_ya: '⚔️ Attack with all my troops!', at_titulo: 'Attack {n}',
    at_fuerza: 'Your army', at_defensa: 'Their defense (approx.)', at_botin: 'Loot if you win (up to)', at_facil: '😀 Easy', at_parejo: '😐 Even', at_dificil: '😬 Hard',
    at_nota: 'Attacking removes your protection. Fallen troops can go to your Infirmary.', at_sin_tropas: 'You have no troops to attack. Train in the Guard.',
    at_dueno: 'In owner mode you cannot attack other players (it would be unfair).', at_protegido: 'That kingdom is protected. {t} left.',
    at_aliado: 'You cannot attack someone in your crew.', at_espera: 'You attacked that kingdom recently. Wait {t}.', at_cuenta: 'You need an account to attack.',
    at_batalla: '⚔️ Battle in progress!', at_gano: '🏆 You won! You took: {b}', at_perdio: '💔 You lost the battle. Their defense held.',
    at_bajas: 'Fallen troops: {n}', at_error: 'Could not attack (no internet or the kingdom got protected).',
    rep_titulo: 'Attack report', rep_te_ataco: '⚔️ {n} attacked your kingdom', rep_perdiste: 'They took: {b}', rep_resististe: '🛡️ Your defense held!',
    rep_escudo: 'You got a 30-minute protection.', rep_ok: 'Got it', defensa_txt: 'Defense',
    escudo_usado: '🛡️ Kingdom protected! {t} left', protegido_falta: '🛡️ Protected: {t} left', escudo_info: 'While the protection lasts, no player can attack your kingdom (for when player attacks arrive). On the map your village shows a shield.',
    calidad: 'Graphics quality', calidad_alta: 'High', calidad_baja: 'Low (faster)', calidad_txt: 'High: shadows, smoke and dust. Low: runs faster on older phones.',
    faltan_t: '{t} left', proximo_cofre: '⏰ Next chest in {t}', entrenando_t: '{t} left to finish training',
    castillo_nivel: 'Castle — level {n} of {m}', mejorar_castillo: '🏰 Upgrade castle', castillo_bloquea: '🏰 First upgrade the Castle to level {n}.',
    castillo_subiendo: '🏰 The castle is being upgraded to level {n}', castillo_listo: '🏰 Castle level {n}! Your buildings can now go up to level {n}.',
    castillo_tope: 'Your buildings can go up to level {n}.', castillo_sube: 'At level {n}: +{v} health, +{d} damage and buildings up to level {n}.',
    torres_puerta: 'Gate towers', torres_puerta_txt: 'Two archer towers guard the wall gate. They hit harder with each wall level.',
    nivel_de: 'Level {n} of {m}', sube_a: 'At level {n}:', nivel_corto: 'Lv',
    vida_extra: 'Extra castle health', muralla_nivel: 'Wall level {n}', sin_muralla: 'You do not have a Wall yet.',
    c_enfermeria: 'Tip: an Infirmary saves troops that fall in battle.', c_muralla: 'Tip: build the Wall so the castle lasts longer.',
    muralla_lista: '🧱 Wall level {n} ready! The castle has more health.',
    modo_dueno: '👑 OWNER', poder_titulo: 'What is Power?',
    poder_txt: 'Power is the total strength of your kingdom. It goes up when you train troops, build or upgrade buildings, and win waves.',
    poder_tropas: 'Troops', poder_edificios: 'Buildings', poder_oleadas: 'Waves won',
    nivel_txt: 'The red number on the crown is your king level: the wave you are on.',
    ultima: 'the last one!', ocupado: 'That plot already has a building.', colocando: 'Pick a glowing plot for your {n}',
    premio: 'Reward: +{g} 💎', invocaste: 'Arrived: {t}',
    pausa: 'PAUSED', pausa_txt: 'Tap ▶ to continue', enemigos: 'enemies', tiempo: 'Time', cura: 'Heal',
    borrar_cuenta: 'Delete my account', borrar_cuenta_txt: 'Your account and cloud save will be deleted forever. Type your password to confirm.',
    borrar_cuenta_ok: 'Delete forever', cuenta_borrada: 'Your account was deleted.', privacidad: 'Privacy', novedades: 'What\'s new!', novedades_lista: '<li>👑 <b>Sir Sol has a new model</b>: golden knight with a red cape, plume, sword and star shield.</li><li>🦵 He now really walks, breathes while standing and swings his sword in battle.</li><li>🧹 The «New game» button was removed so nobody erases their kingdom by mistake.</li>', novedades_ok: 'Let\'s play!',
    poder: 'Power', cuenta: 'Account', correo: 'Your email', entrar: 'Sign in',
    correo_no: 'That email is not an owner account.', cuenta_jugador: 'Guest player',
    dueno_activo: '👑 OWNER mode on', dueno_titulo: 'Owner menu (testing)',
    dueno_txt: 'For testing only. It cannot be sold or given to other players.',
    gemas_max: '99,999 gems', oro_inf: 'Infinite gold', vel10: 'Speed x10',
    saltar_oleada: 'Go to next wave', salir_dueno: 'Leave owner mode',
    encendido: 'ON', apagado: 'OFF', cuenta_dueno: 'Main account (owner)'
  }
};

// Nombres de edificios, tropas y enemigos en los dos idiomas
var NOMBRES = {
  granja:     { es: 'Granja',       en: 'Farm',
                des_es: 'Cultiva trigo: da comida para entrenar y alimentar a tus tropas.', des_en: 'Grows wheat: gives food to train and feed your troops.' },
  aserradero: { es: 'Aserradero',   en: 'Sawmill',
                des_es: 'Corta árboles: da madera para construir y mejorar.', des_en: 'Cuts trees: gives wood to build and upgrade.' },
  mina:       { es: 'Mina',         en: 'Mine',
                des_es: 'Saca piedra: para la muralla, las torres y mejoras grandes.', des_en: 'Digs stone: for the wall, towers and big upgrades.' },
  barricada:  { es: 'Barricada',    en: 'Barricade',
                des_es: 'Muro en el camino: los enemigos se paran a romperlo.', des_en: 'A wall on the road: enemies stop to break it.' },
  cuartel:    { es: 'Cuartel',      en: 'Barracks',
                des_es: 'Permite entrenar caballeros.', des_en: 'Lets you train knights.' },
  torre:      { es: 'Torre',        en: 'Tower',
                des_es: 'Dispara flechas a los enemigos.', des_en: 'Shoots arrows at enemies.' },
  enfermeria: { es: 'Enfermería',   en: 'Infirmary',
                des_es: 'Las tropas que caen se curan aquí y vuelven al terminar la oleada.', des_en: 'Fallen troops heal here and come back when the wave ends.' },
  muralla:    { es: 'Muralla',      en: 'Wall',
                des_es: 'Rodea todo el reino y le da más vida al castillo.', des_en: 'Surrounds the whole kingdom and gives the castle more health.' },
  espadachin: { es: 'Espadachín',   en: 'Swordsman',
                des_es: 'Rápido y valiente. Pelea cuerpo a cuerpo.', des_en: 'Fast and brave. Fights up close.' },
  arquero:    { es: 'Arquero',      en: 'Archer',
                des_es: 'Dispara desde lejos. Poca vida.', des_en: 'Shoots from afar. Low health.' },
  cofre_madera: { es: 'Cofre de madera', en: 'Wooden chest', des_es: 'Trae oro, comida y madera.', des_en: 'Gives gold, food and wood.' },
  cofre_plata:  { es: 'Cofre de plata', en: 'Silver chest', des_es: 'Trae oro, madera, piedra y gemas.', des_en: 'Gives gold, wood, stone and gems.' },
  cofre_oro:    { es: 'Cofre de oro', en: 'Golden chest', des_es: 'Un gran premio de todos los recursos y gemas.', des_en: 'A big prize of every resource and gems.' },
  bolsa_oro:    { es: 'Bolsa de oro', en: 'Bag of gold', des_es: '+250 de oro.', des_en: '+250 gold.' },
  saco_comida:  { es: 'Saco de comida', en: 'Sack of food', des_es: '+300 de comida.', des_en: '+300 food.' },
  saco_madera:  { es: 'Montón de madera', en: 'Pile of wood', des_es: '+300 de madera.', des_en: '+300 wood.' },
  saco_piedra:  { es: 'Carreta de piedra', en: 'Cart of stone', des_es: '+200 de piedra.', des_en: '+200 stone.' },
  escudo_2h:    { es: 'Protección 2 horas', en: '2-hour protection', des_es: 'Tu reino queda protegido 2 horas.', des_en: 'Your kingdom is protected for 2 hours.' },
  escudo_8h:    { es: 'Protección 8 horas', en: '8-hour protection', des_es: 'Tu reino queda protegido 8 horas.', des_en: 'Your kingdom is protected for 8 hours.' },
  escudo_12h:   { es: 'Protección 12 horas', en: '12-hour protection', des_es: 'Tu reino queda protegido 12 horas.', des_en: 'Your kingdom is protected for 12 hours.' },
  acelerador:   { es: 'Acelerador', en: 'Speed-up', des_es: 'Quita 1 hora a todas las obras y termina el entrenamiento.', des_en: 'Takes 1 hour off all buildings and finishes training.' },
  academia:   { es: 'Academia', en: 'Academy', des_es: 'Centro de investigación: mejora tus tropas, edificios y economía.', des_en: 'Research center: improves your troops, buildings and economy.' },
  inv_obras:     { es: 'Construcción rápida', en: 'Fast building', des_es: 'Las obras tardan {v}% menos.', des_en: 'Buildings take {v}% less time.' },
  inv_cuarteles: { es: 'Cuarteles grandes', en: 'Big barracks', des_es: '+{v} lugares para tropas.', des_en: '+{v} troop spots.' },
  inv_entreno:   { es: 'Entrenamiento rápido', en: 'Fast training', des_es: 'Entrenas {v}% más rápido.', des_en: 'You train {v}% faster.' },
  inv_cosecha:   { es: 'Cosecha', en: 'Harvest', des_es: 'Las Granjas dan {v}% más comida.', des_en: 'Farms give {v}% more food.' },
  inv_lenadores: { es: 'Leñadores', en: 'Lumberjacks', des_es: 'Los Aserraderos dan {v}% más madera.', des_en: 'Sawmills give {v}% more wood.' },
  inv_canteros:  { es: 'Canteros', en: 'Stonecutters', des_es: 'Las Minas dan {v}% más piedra.', des_en: 'Mines give {v}% more stone.' },
  inv_impuestos: { es: 'Impuestos', en: 'Taxes', des_es: 'El castillo cobra {v}% más oro.', des_en: 'The castle collects {v}% more gold.' },
  inv_espadas:   { es: 'Espadas afiladas', en: 'Sharp swords', des_es: 'Tus tropas pegan {v}% más.', des_en: 'Your troops hit {v}% harder.' },
  inv_escudos:   { es: 'Escudos fuertes', en: 'Strong shields', des_es: 'Tus tropas tienen {v}% más vida.', des_en: 'Your troops have {v}% more health.' },
  inv_flechas:   { es: 'Flechas de hierro', en: 'Iron arrows', des_es: 'Las Torres pegan {v}% más.', des_en: 'Towers hit {v}% harder.' },
  inv_muros:     { es: 'Muros fuertes', en: 'Strong walls', des_es: 'Muralla y barricadas con {v}% más vida.', des_en: 'Wall and barricades get {v}% more health.' },
  caballeria: { es: 'Caballería',   en: 'Cavalry',
                des_es: 'Soldado a caballo: el más rápido, llega primero al enemigo.', des_en: 'Soldier on horseback: the fastest, reaches the enemy first.' },
  guardian:   { es: 'Guardián',     en: 'Guardian',
                des_es: 'Escudo enorme. Aguanta muchos golpes.', des_en: 'Huge shield. Takes lots of hits.' },
  heroe:      { es: 'Héroe Paladín', en: 'Paladin Hero' },
  trasgo:     { es: 'Trasgo',       en: 'Goblin' },
  bruto:      { es: 'Bruto',        en: 'Brute' },
  ogro:       { es: 'Ogro Jefe',    en: 'Ogre Boss' }
};

// ---------------- Recursos iniciales ----------------
var INICIO = { monedas: 200, gemas: 20, comida: 120, madera: 120, piedra: 40, vidaCastillo: 1200 };
// Recursos: oro (monedas), comida, madera, piedra y gemas
var RECURSOS = ['oro', 'comida', 'madera', 'piedra'];
var ICONO_RECURSO = { oro: '🪙', comida: '🍞', madera: '🪵', piedra: '🪨', gemas: '💎' };
// El castillo cobra impuestos: da oro cada cierto tiempo
var IMPUESTO = { oro: 5, cada: 3 };
// Cada tropa come 1 de comida cada tantos segundos. Sin comida pelean más débiles.
var COMIDA_TROPA = { cada: 15, debilidad: 0.7 };

// ---------------- Edificios (valores por nivel 1, 2, 3) ----------------
// costo = oro; madera y piedra = lo que piden además (por nivel 1, 2, 3)
var EDIFICIOS = {
  granja:     { costo: [30, 55, 90],   madera: [30, 60, 100], piedra: [0, 10, 30],   tiempo: [3, 4, 6], produce: [4, 8, 13], recurso: 'comida', cada: 3, icono: '🌾' },
  aserradero: { costo: [30, 55, 90],   madera: [0, 50, 90],   piedra: [0, 15, 35],  tiempo: [3, 4, 6], produce: [3, 6, 10], recurso: 'madera', cada: 4, icono: '🪵' },
  mina:       { costo: [40, 70, 110],  madera: [50, 80, 130], piedra: [0, 0, 0],    tiempo: [4, 5, 7], produce: [2, 4, 7],  recurso: 'piedra', cada: 5, icono: '🪨' },
  cuartel:    { costo: [50, 80, 130],  madera: [50, 100, 160], piedra: [0, 30, 60],  tiempo: [3, 5, 7], capacidad: [6, 10, 15], rapidez: [1, 1.3, 1.6], icono: '⚔️' },
  torre:      { costo: [50, 90, 140],  madera: [40, 80, 120], piedra: [30, 60, 100], tiempo: [4, 5, 7], dano: [14, 22, 34], alcance: [12, 13, 14.5], ritmo: 0.9, icono: '🏹' },
  // Enfermería: camas = cuántas tropas caídas puede salvar por oleada
  // Academia: centro de investigación. Su nivel deja investigar más alto y más rápido.
  academia:   { costo: [70, 120, 200], madera: [80, 140, 220], piedra: [20, 60, 120], tiempo: [4, 6, 8], rapidez: [1, 1.3, 1.6], tope: [2, 4, 6], icono: '📜' },
  enfermeria: { costo: [60, 100, 160], madera: [60, 110, 160], piedra: [0, 40, 80],  tiempo: [4, 5, 7], capacidad: [4, 8, 14], icono: '💚' }
};
// Muralla: una sola, alrededor del castillo. Da vida extra al castillo. Nivel 1 de madera, 2 y 3 de piedra.
var MURALLA = { costo: [80, 140, 220], madera: [100, 0, 0], piedra: [0, 150, 260], tiempo: [5, 7, 9], vida: [400, 900, 1500], icono: '🧱' };
// ---------------- NIVELES HASTA EL 12 ----------------
// Los valores de los niveles 1-3 están escritos arriba; del 4 al 12 se calculan solos.
var NIVEL_MAX = 12;
(function extenderNiveles() {
  function redondear(v) { return v >= 100 ? Math.round(v / 5) * 5 : Math.round(v); }
  function extender(arr, regla) {
    while (arr.length < NIVEL_MAX) {
      var u = arr[arr.length - 1], v;
      if (regla[0] === 'x') v = redondear(u * regla[1]);
      else if (regla[0] === '+') v = Math.round((u + regla[1]) * 100) / 100;
      else v = regla[1];
      if (regla[2] !== undefined) v = Math.min(regla[2], v);
      arr.push(v);
    }
  }
  var reglas = {
    costo: ['x', 1.35], madera: ['x', 1.35], piedra: ['x', 1.35], tiempo: ['+', 2],
    produce: ['x', 1.25], capacidad: ['+', 3], rapidez: ['+', 0.15], dano: ['x', 1.2], alcance: ['+', 0.4, 19], tope: ['=', 6]
  };
  for (var t in EDIFICIOS) for (var c in reglas) if (Array.isArray(EDIFICIOS[t][c])) extender(EDIFICIOS[t][c], reglas[c]);
  extender(MURALLA.costo, ['x', 1.3]); extender(MURALLA.madera, ['=', 0]); extender(MURALLA.piedra, ['x', 1.3]);
  extender(MURALLA.tiempo, ['+', 2]); extender(MURALLA.vida, ['+', 600]);
})();
// Mejorar el castillo (nivel destino 2..12): cuesta más y tarda más cada vez.
// Ningún edificio ni la muralla pueden pasar el nivel del castillo.
var MEJORA_CASTILLO = (function () {
  var m = { costo: [0], madera: [0], piedra: [0], tiempo: [0], vida: 300, dano: 3 };
  function r5(v) { return Math.round(v / 5) * 5; }
  for (var L = 2; L <= NIVEL_MAX; L++) {
    m.costo.push(r5(150 * Math.pow(1.45, L - 2))); m.madera.push(r5(180 * Math.pow(1.45, L - 2)));
    m.piedra.push(r5(60 * Math.pow(1.5, L - 2))); m.tiempo.push(Math.round(30 * Math.pow(1.35, L - 2)));
  }
  return m;
})();
// Torres de la puerta de la muralla (dañan más con el nivel de la muralla)
var TORRES_PUERTA = { dano: 12, danoNivel: 4, alcance: 14, ritmo: 1.0 };
// Cómo se ve cada nivel: 1-4 normal, 5-8 mejorado, 9-12 dorado
function nivelVisual(n) { return n <= 4 ? 1 : n <= 8 ? 2 : 3; }
// La muralla rodea TODO el reino (óvalo con todos los terrenos adentro)
// El reino es más grande: todo se separa del castillo por este número
var ESCALA_REINO = 1.35;
var MURALLA_FORMA = { cx: -4 * ESCALA_REINO, cz: -1 * ESCALA_REINO, rx: 30 * ESCALA_REINO, rz: 29 * ESCALA_REINO };

// Barricada: se pone en los puntos marcados del camino. Los enemigos se paran a romperla.
// Nivel 1 de madera, nivel 2 de piedra. Se arregla sola al terminar cada oleada.
var BARRICADA = { costo: [20, 40], madera: [40, 0], piedra: [0, 60], vida: [350, 900], tiempo: [2, 3], icono: '🚧' };
// Campamentos de trasgos en el mapa del mundo (son del juego, no son jugadores)
var CAMPAMENTOS = [
  { x: 12, y: 18, nivel: 3 }, { x: 80, y: 14, nivel: 6 }, { x: 47, y: 52, nivel: 9 },
  { x: 20, y: 78, nivel: 5 }, { x: 74, y: 70, nivel: 12 }, { x: 55, y: 88, nivel: 7 }
];
// Cofre diario: 7 días de racha (al día 8 vuelve a empezar el ciclo pero la racha sigue contando)
var COFRE_DIARIO = [
  { oro: 150, comida: 100 }, { madera: 150, piedra: 60 }, { gemas: 5, objeto: 'cofre_madera' },
  { oro: 250, comida: 200 }, { tropas: { espadachin: 2 } }, { gemas: 10, piedra: 120 }, { gemas: 20, objeto: 'cofre_oro' }
];
// Objetos de la mochila
var OBJETOS = {
  cofre_madera: { icono: '📦', cofre: { oro: [80, 150], comida: [60, 120], madera: [60, 120] } },
  cofre_plata:  { icono: '🎁', cofre: { oro: [150, 300], madera: [100, 200], piedra: [60, 120], gemas: [2, 5] } },
  cofre_oro:    { icono: '💰', cofre: { oro: [300, 600], comida: [200, 400], madera: [200, 400], piedra: [150, 300], gemas: [8, 15] } },
  bolsa_oro:    { icono: '👝', da: { oro: 250 } },
  saco_comida:  { icono: '🌾', da: { comida: 300 } },
  saco_madera:  { icono: '🪵', da: { madera: 300 } },
  saco_piedra:  { icono: '🪨', da: { piedra: 200 } },
  acelerador:   { icono: '⏩', acelera: true },
  escudo_2h:    { icono: '🛡️', escudo: 2 },
  escudo_8h:    { icono: '🛡️', escudo: 8 },
  escudo_12h:   { icono: '🛡️', escudo: 12 }
};
// Tienda: se paga con gemas (las compras con dinero real llegarán con la App Store)
var TIENDA = [
  { id: 'bolsa_oro', gemas: 5 }, { id: 'saco_comida', gemas: 4 }, { id: 'saco_madera', gemas: 4 }, { id: 'saco_piedra', gemas: 5 },
  { id: 'acelerador', gemas: 3 }, { id: 'cofre_plata', gemas: 15 }, { id: 'cofre_oro', gemas: 40 },
  { id: 'escudo_2h', gemas: 10 }, { id: 'escudo_8h', gemas: 30 }, { id: 'escudo_12h', gemas: 45 }
];
// Investigación: 3 ramas. 'cada' = cuánto mejora cada nivel.
var INVESTIGACION = {
  crecimiento: [
    { id: 'obras', icono: '🔨', max: 6, cada: 0.08 },     // obras más rápidas
    { id: 'cuarteles', icono: '⚔️', max: 5, cada: 2 },    // +2 de capacidad
    { id: 'entreno', icono: '⏱️', max: 6, cada: 0.1 }     // entrenar más rápido
  ],
  economia: [
    { id: 'cosecha', icono: '🌾', max: 6, cada: 0.1 },
    { id: 'lenadores', icono: '🪵', max: 6, cada: 0.1 },
    { id: 'canteros', icono: '🪨', max: 6, cada: 0.1 },
    { id: 'impuestos', icono: '🪙', max: 6, cada: 0.1 }
  ],
  batalla: [
    { id: 'espadas', icono: '🗡️', max: 6, cada: 0.05 },   // tropas pegan más
    { id: 'escudos', icono: '🛡️', max: 6, cada: 0.05 },   // tropas con más vida
    { id: 'flechas', icono: '🏹', max: 6, cada: 0.1 },    // torres pegan más
    { id: 'muros', icono: '🧱', max: 6, cada: 0.1 }       // muralla y barricadas con más vida
  ]
};
// Costo y tiempo del nivel L (1, 2, 3...)
function costoInvestigacion(L) { return { oro: 50 * L + 20 * L * L, madera: 40 * L + 15 * L * L, piedra: L >= 3 ? 25 * L : 0 }; }
function tiempoInvestigacion(L) { return 8 * L; }
var PUNTOS_BARRICADA = [0.40, 0.53, 0.66, 0.79]; // en qué parte del camino (0 = bosque, 1 = castillo)

// El castillo también dispara (para que la primera oleada sea posible)
var CASTILLO = { dano: 12, alcance: 9.5, ritmo: 1.1 };

// ---------------- Tropas ----------------
var TROPAS = {
  espadachin: { costo: 15, comida: 20, tiempo: 3, vida: 150, dano: 18, alcance: 1.3, vel: 3.2, ritmo: 0.9, icono: '🗡️' },
  arquero:    { costo: 20, comida: 20, tiempo: 4, vida: 85,  dano: 12, alcance: 7.5, vel: 3.0, ritmo: 1.1, distancia: true, icono: '🏹' },
  caballeria: { costo: 30, comida: 30, tiempo: 5, vida: 200, dano: 20, alcance: 1.6, vel: 5.2, ritmo: 1.0, icono: '🐎' },
  guardian:   { costo: 30, comida: 35, tiempo: 6, vida: 390, dano: 11, alcance: 1.4, vel: 2.4, ritmo: 1.2, icono: '🛡️' },
  heroe:      { costo: 0,  tiempo: 0, vida: 950, dano: 42, alcance: 1.7, vel: 3.4, ritmo: 0.8, cura: 10, icono: '👑' }
};
var INVOCAR = { tres: 10, heroe: 30 }; // precio en gemas
// Armaduras: cada nivel (hasta 3) da +20% de vida y +10% de defensa (recibe menos daño)
// La armadura se puede mejorar con oro y piedra, o comprar al momento con gemas (precio de cada nivel)
var ARMADURA = { costo: [60, 120, 200], piedra: [20, 50, 90], gemas: [20, 40, 80], vida: 0.2, defensa: 0.1, max: 3 };

// ---------------- Enemigos ----------------
var ENEMIGOS = {
  trasgo: { vida: 60,   dano: 7,  vel: 2.6, alcance: 1.2, ritmo: 1.0, oro: 6 },
  bruto:  { vida: 210,  dano: 15, vel: 1.9, alcance: 1.5, ritmo: 1.3, oro: 15 },
  ogro:   { vida: 1700, dano: 45, vel: 1.4, alcance: 2.2, ritmo: 1.6, oro: 120 }
};

// ---------------- Oleadas ----------------
var OLEADAS = [
  { trasgo: 6 },
  { trasgo: 9, bruto: 1 },
  { trasgo: 10, bruto: 3 },
  { trasgo: 14, bruto: 5 },
  { trasgo: 12, bruto: 6, ogro: 1 }
];
var GEMAS_POR_OLEADA = 5, GEMAS_VICTORIA = 15;

// Oleadas después de la 5 (modo infinito)
function oleadaInfinita(n) {
  var extra = n - 5;
  var o = { trasgo: 12 + extra * 2, bruto: 6 + extra };
  if (n % 3 === 0) o.ogro = 1 + Math.floor(extra / 6);
  return o;
}
function fuerzaOleada(n) { return 1 + Math.max(0, n - 5) * 0.14; }

// ---------------- Mapa ----------------
// El camino del bosque: empieza en el bosque y llega a la puerta del castillo.
var CAMINO = [
  [-52, -30], [-42, -27], [-34, -20], [-28, -11], [-21, -8],
  [-15, -1], [-9, 1], [-4.9, 0]
];
// Terrenos donde se puede construir
var TERRENOS = [
  [-11, -9], [-12, 9], [-22, -19], [7.5, 8], [8, -7.5], [0, 11.5], [-1, -12], [-24, 5],
  // terrenos nuevos para que la ciudad crezca
  [16, 1], [14, 13], [13, -12], [3, 21], [5, -21], [-7, 20]
].map(function (p) { return [p[0] * ESCALA_REINO, p[1] * ESCALA_REINO]; });
// Punto donde esperan las tropas
var PUNTO_REUNION = [-12.5, 2.5];

// Tiempos de construcción (segundos) para llegar a cada nivel. Nada es instantáneo:
// el que quiera rápido usa gemas o el Acelerador.
//   nivel 1 = 1 min · 2 = 2 min · 3 = 5 min · 4 = 15 min · 5 = 30 min · 6 = 1 h
//   7 = 3 h · 8 = 8 h · 9 = 12 h · 10 = 18 h · 11 = 1 día · 12 = 1 día
var TIEMPOS_OBRA = [60, 120, 300, 900, 1800, 3600, 10800, 28800, 43200, 64800, 86400, 86400];
Object.keys(EDIFICIOS).forEach(function (k) { EDIFICIOS[k].tiempo = TIEMPOS_OBRA.slice(); });
MURALLA.tiempo = TIEMPOS_OBRA.slice();
MEJORA_CASTILLO.tiempo = [0].concat(TIEMPOS_OBRA.slice(1));
// Terminar ya con gemas: 1 gema por cada 10 minutos que falten
var GEMAS_POR_10MIN = 1;
// El Acelerador quita este tiempo (segundos) a todas las obras
var ACELERADOR_SEG = 3600;

// Cuarteles más grandes para tener ejércitos grandes: 10, 15, 20 y +4 por nivel (nivel 12 = 56 cada uno)
EDIFICIOS.cuartel.capacidad = [10, 15, 20];
while (EDIFICIOS.cuartel.capacidad.length < NIVEL_MAX) EDIFICIOS.cuartel.capacidad.push(EDIFICIOS.cuartel.capacidad[EDIFICIOS.cuartel.capacidad.length - 1] + 4);

// =====================================================================
//  HÉROES: personajes propios del juego (nombres y aspecto inventados).
//  Salen del castillo en cada oleada (hasta 3 en el equipo) y usan su poder.
// =====================================================================
var RAREZAS = {
  comun:      { peso: 60, costoNivel: 1.0 },
  raro:       { peso: 30, costoNivel: 1.4 },
  legendario: { peso: 10, costoNivel: 2.0 }
};
var CLASES_HEROE = { infanteria: '⚔️', arquero: '🏹', magia: '✨', guardian: '🛡️' };
// look: cómo se ve el muñeco (colores, peinado, sombrero, barba, arma)
var HEROES = [
  { id: 'sol', rareza: 'legendario', clase: 'infanteria', hab: 'grito', vida: 950, dano: 42, alcance: 1.7,
    look: { ropa: 0xe0b040, ropa2: 0xb8862a, sombrero: 'casco', arma: 'espada', capa: 0xd2463a } },
  { id: 'luna', rareza: 'legendario', clase: 'magia', hab: 'rayo', vida: 620, dano: 40, alcance: 7, distancia: true,
    look: { ropa: 0x6a3fb8, ropa2: 0x3f2672, pelo: 0x2a2030, peinado: 'largo', sombrero: 'bruja', arma: 'varita', ojos: 0x8a5ad8, capa: 0x3f2672 } },
  { id: 'ancla', rareza: 'legendario', clase: 'infanteria', hab: 'canon', vida: 1100, dano: 46, alcance: 1.8,
    look: { ropa: 0xb8302a, ropa2: 0x2a2320, pelo: 0xf0eee8, peinado: 'corto', barba: 0xf0eee8, sombrero: 'tricornio', arma: 'sable', capa: 0x7a1a14 } },
  { id: 'brisa', rareza: 'raro', clase: 'arquero', hab: 'lluvia', vida: 560, dano: 30, alcance: 8, distancia: true,
    look: { ropa: 0x2f8a5a, ropa2: 0x1f5a3a, pelo: 0xd2462a, peinado: 'trenza', arma: 'arco', ojos: 0x3a8a4a } },
  { id: 'chispa', rareza: 'raro', clase: 'infanteria', hab: 'bomba', vida: 700, dano: 32, alcance: 1.6,
    look: { ropa: 0x3a6fc0, ropa2: 0x8a5a33, pelo: 0x6a3a1a, peinado: 'mono', sombrero: 'gafas', arma: 'martillo' } },
  { id: 'roble', rareza: 'comun', clase: 'guardian', hab: 'escudo', vida: 1300, dano: 22, alcance: 1.5,
    look: { ropa: 0x7a5434, ropa2: 0x4a3420, pelo: 0xd86a2a, peinado: 'calvo', barba: 0xd86a2a, arma: 'hacha', escudo: 0x8a5a33 } },
  { id: 'trueno', rareza: 'comun', clase: 'infanteria', hab: 'golpe', vida: 900, dano: 30, alcance: 1.6,
    look: { ropa: 0xffd3b0, ropa2: 0x5a4a40, pelo: 0x2a2320, peinado: 'calvo', barba: 0x2a2320, sombrero: 'panuelo', arma: 'hacha2' } },
  { id: 'pluma', rareza: 'comun', clase: 'magia', hab: 'curar', vida: 600, dano: 18, alcance: 6, distancia: true,
    look: { ropa: 0xf2ece0, ropa2: 0xc9b896, pelo: 0xf0c860, peinado: 'largo', sombrero: 'capucha', arma: 'baston', ojos: 0x5a8ad8 } }
];
var HEROE = {}; HEROES.forEach(function (h) { HEROE[h.id] = h; });
var HEROE_NIVEL_MAX = 50;                 // cada estrella deja subir 10 niveles más
var HEROE_FRAGMENTOS = [10, 20, 40, 80];  // fragmentos para pasar a 2, 3, 4 y 5 estrellas
var RECLUTAR = { uno: 30, diez: 270, repetido: 10 }; // gemas, y fragmentos si sale uno que ya tienes
// Poderes: cada cuánto se usan (segundos) y a qué distancia
var HABILIDADES = {
  grito:  { cd: 12, rango: 8,   icono: '📯', es: 'Grito de guerra', en: 'War cry', des_es: 'Las tropas cercanas hacen 40% más daño por 5 segundos.', des_en: 'Nearby troops deal 40% more damage for 5 seconds.' },
  rayo:   { cd: 8,  rango: 12,  icono: '⚡', es: 'Rayo saltarín', en: 'Chain lightning', des_es: 'Un rayo que salta a 4 enemigos.', des_en: 'Lightning that jumps to 4 enemies.' },
  canon:  { cd: 10, rango: 9,   icono: '💥', es: 'Cañonazo', en: 'Cannon blast', des_es: 'Golpe enorme al enemigo más fuerte y a los de al lado.', des_en: 'Huge hit on the strongest enemy and the ones next to it.' },
  lluvia: { cd: 8,  rango: 14,  icono: '🏹', es: 'Lluvia de flechas', en: 'Arrow rain', des_es: 'Muchas flechas caen sobre un grupo de enemigos.', des_en: 'Many arrows fall on a group of enemies.' },
  bomba:  { cd: 9,  rango: 7,   icono: '💣', es: 'Bomba', en: 'Bomb', des_es: 'Explota y daña a todos los enemigos de alrededor.', des_en: 'Explodes and hurts all enemies around.' },
  escudo: { cd: 10, rango: 8,   icono: '🛡️', es: 'Muro de escudos', en: 'Shield wall', des_es: 'Las tropas cercanas reciben la mitad de daño por 5 segundos.', des_en: 'Nearby troops take half damage for 5 seconds.' },
  golpe:  { cd: 9,  rango: 3.5, icono: '🌀', es: 'Golpe de trueno', en: 'Thunder slam', des_es: 'Golpea el suelo y deja a los enemigos mareados 2 segundos.', des_en: 'Slams the ground and stuns enemies for 2 seconds.' },
  curar:  { cd: 8,  rango: 10,  icono: '💚', es: 'Luz sanadora', en: 'Healing light', des_es: 'Cura un 25% de vida a las tropas cercanas.', des_en: 'Heals nearby troops by 25%.' }
};
var NOMBRES_HEROES = {
  sol: { es: 'Sir Sol', en: 'Sir Sol' }, luna: { es: 'Luna', en: 'Luna' }, ancla: { es: 'Capitán Ancla', en: 'Captain Anchor' },
  brisa: { es: 'Brisa', en: 'Breeze' }, chispa: { es: 'Chispa', en: 'Spark' }, roble: { es: 'Roble', en: 'Oak' },
  trueno: { es: 'Trueno', en: 'Thunder' }, pluma: { es: 'Pluma', en: 'Feather' }
};
