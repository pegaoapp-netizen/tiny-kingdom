// =====================================================================
//  DATOS DEL JUEGO: nombre, textos (español / inglés), precios y fuerzas.
//  Para cambiar el nombre del juego, cambia NOMBRE_JUEGO.
// =====================================================================

var VERSION_JUEGO = '5.2';
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
    b_tropas: 'TROPAS', b_construir: 'Edificios', b_invocar: 'INVOCAR',
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
    tr_titulo: 'Trabajos para subir de nivel', tr_oleadas: 'Gana {n} oleadas', tr_recolectas: 'Recoge {n} veces en tus campos', tr_tropas: 'Entrena {n} tropas', tr_campamentos: 'Vence {n} campamentos de trasgos (Islas)', tr_falta: '🔒 Falta un trabajo: {t}', tr_bloqueado: '🔒 Completa los trabajos para mejorar', mat_titulo: 'Materiales para subir de nivel', mat_peq: '📘 Libro pequeño (+300 EXP): se gana en las oleadas y en el cofre diario', mat_gra: '📗 Libro grande (+1500 EXP): se gana venciendo campamentos de trasgos y en el cofre diario', mat_perg: '📜 Pergamino (habilidades): se gana en las oleadas', mat_falta: 'Te faltan libros: juega oleadas y vence campamentos para conseguirlos.', mat_no_tienda: 'Estos materiales no se venden en el Colmado: se ganan jugando.', mat_ganado: '📘 +{n} libro(s) de experiencia para tus héroes', def_on: '⚔️ ON', def_off: '⚔️ OFF', def_titulo: 'Tropas defienden', def_on_txt: 'Tus tropas defienden el reino cuando te atacan. ¡Cuidado: pueden morir y tendrás que entrenar otras!', def_off_txt: 'Tus tropas se quedan guardadas y no defienden: no mueren, pero tu reino se defiende solo con el castillo, la muralla y las torres.', acel_recorta: 'recorta {t}', entreno_cola_pill: 'Entrenando', rama_tropas: 'Tropas', inv_de_tropa: 'Investigación de {n}', investigar_tropa: '🔬 Investigar', poder_sube: '+{n} Poder', poder_subio: '💪 ¡Tu Poder subió a {n}!', buzon: 'Buzón', buzon_titulo: '📬 Buzón', buzon_vacio: 'No tienes mensajes nuevos.', buzon_nov: '¡Novedades de la versión {v}!', buzon_leido: 'Leído', buzon_otras: 'Versiones anteriores', inv_tab_recursos: 'Recursos', inv_tab_acelerar: 'Acelerar', inv_tab_ingresos: 'Ingresos', inv_tab_equipo: 'Equipo', inv_tab_otros: 'Otros', inv_vacio_tab: 'No tienes nada aquí todavía.', inv_equipada: 'Equipada en {n}', inv_libre: 'Sin equipar', inv_mejorar_pieza: 'Mejorar', inv_recurso_txt: 'Lo que tienes guardado ahora mismo.', al_portal: '🌀 Usar portal', tel_cancelado: '🌀 Te mudaste a tiempo: el ataque de {n} se canceló y sus tropas regresan.', tel_espera24: 'Ya usaste un portal: espera {t} para usar otro.', tel_batalla: 'La batalla ya empezó: ya no puedes usar el portal.', tel_no_atacar: 'Acabas de mudarte: no puedes atacar durante {t}.', cas_terreno: 'Terreno', cas_coord: 'Coordenadas', cas_ocupada_por: 'Ocupada por', cas_libre_corto: 'Libre', cas_reubicar: '🌀 Reubicar', cas_ocupar: '🚩 Ocupar', cas_tu_reino: 'Tu reino', cas_campamento: 'Campamento de trasgos', tel_elige_casilla: '🌀 Toca una casilla libre del mapa y pulsa Reubicar.', mar_cancelada: '🌀 {n} se mudó con un portal antes de que llegaras. Tus tropas regresan sin pelear.', hola: '¡Hola, {n}!', salir_txt: 'Tu partida queda guardada en la nube. ¿Seguro que quieres salir?', cerrar_sesion: 'Cerrar sesión', cargando: 'Cargando...', guardado_nube: 'Guardado en la nube ☁️',
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
    b_conquista: 'Campaña', b_heroes: 'Tropas', b_mochila: 'Inventario', b_tienda: 'Tienda',
    p_conquista: 'Campaña', p_heroes: 'Tropas', p_mochila: 'Inventario', p_tienda: 'Tienda', sub_tropas: 'Tropas', sub_invocar: 'Invocar',
    conquista_txt: 'Defiende el reino de cada oleada. Al ganarla recibes gemas.', oleada_curso: 'Oleada en curso: quedan {n} enemigos.',
    vienen: 'Vienen:', oleadas_ganadas: 'Oleadas ganadas',
    diario_titulo: 'Cofre diario', diario_txt: 'Entra cada día para un cofre mejor. Si faltas un día, la racha vuelve a empezar.',
    diario_dia: 'Día {n}', diario_reclamar: '🎁 Reclamar cofre del día {n}', diario_listo: 'Ya lo reclamaste hoy. Vuelve mañana por el día {n}.',
    diario_racha: '🔥 Racha: {n} días seguidos', mochila_vacia: 'Tu baúl está vacío. Consigue cofres con el cofre diario o en el Colmado.',
    mis_objetos: 'Tus objetos', usar: 'Usar', abrir: 'Abrir', recibiste: '🎁 Recibiste: {t}', tropas_regalo: '{n} tropas',
    tienda_txt: 'Compra con gemas. Lo que compras se guarda en tu Baúl 🧳. Las gemas se ganan en las oleadas y en el cofre diario.',
    tienda_real: 'Compras con dinero real: llegarán con la versión de la App Store.', comprar: 'Comprar', comprado: '{n}: guardado en tu Baúl 🧳',
    acelerador_usado: '⏩ ¡Le quitaste 1 hora a todas las obras!', sub_heroes: 'Héroes', heroes_txt: 'Tus héroes salen del castillo en cada oleada y usan su poder. Lleva hasta 3 en tu equipo.', reclutar: 'Reclutar héroe', reclutar_gratis: '🎁 Gratis hoy', reclutar_txt: 'Recluta para conseguir héroes nuevos. Si sale uno que ya tienes, ganas fragmentos para subirle estrellas.', heroe_nuevo: '🎉 ¡Nuevo héroe: {n}!', heroe_frag: '+{f} fragmentos de {n}', equipo_n: 'Equipo: {n}/3', en_equipo: 'EQUIPO', poner_equipo: '➕ Poner en el equipo', quitar_equipo: '➖ Quitar del equipo', equipo_lleno: 'Tu equipo ya tiene 3 héroes. Quita uno primero.', subir_nivel: 'Subir nivel', subir_estrella: '⭐ Subir estrella', nivel_tope: 'Sube una estrella para pasar del nivel {n}.', fragmentos: 'Fragmentos', poder_heroe: 'Poder', bloqueado: '🔒 Consíguelo reclutando', rareza_comun: 'Común', rareza_raro: 'Raro', rareza_legendario: 'Legendario', clase_infanteria: 'Infantería', clase_arquero: 'Arquero', clase_magia: 'Magia', clase_guardian: 'Guardián', heroe_sube: '⬆️ ¡{n} subió al nivel {v}!', heroe_estrella: '⭐ ¡{n} ahora tiene {v} estrellas!', volver: '⬅ Volver', resultado: 'Resultado', estrellas_max: '★ Estrellas al máximo', cada_s: 'cada {s} s', ref_titulo: '📣 Refuerzos', ref_txt: 'Tus tropas pueden defender el reino de un aliado: pelean en sus oleadas y suman a su defensa. Las puedes retirar cuando quieras.', ref_pedir: '📣 Pedir refuerzos', ref_pedido_hecho: '📣 Pediste refuerzos a tu hermandad.', ref_quitar_pedido: 'Quitar pedido', ref_pedidos: 'Piden ayuda', ref_ninguno: 'Nadie está pidiendo ayuda ahora.', ref_reforzar: '🛡️ Reforzar', ref_en_reino: 'Refuerzos en tu reino', ref_enviados: 'Tus refuerzos enviados', ref_devolver: 'Devolver', ref_retirar: 'Retirar', ref_de: '{n} tropas de {q}', ref_a: '{n} tropas en el reino de {q}', ref_enviar_a: 'Enviar refuerzos a {q}', ref_tienes: 'Tienes {n}', ref_enviar: '🛡️ Enviar refuerzos', ref_enviado: '🛡️ ¡Refuerzos enviados a {q}!', ref_volvieron: '🛡️ Volvieron {n} tropas del reino de {q}', ref_error: 'No se pudo. Revisa tu internet y que los dos estén en la misma hermandad.', ref_en_oleada: 'Espera a que termine la oleada.', ref_nada: 'Elige al menos una tropa.', ref_llegaron: '🛡️ ¡Llegaron refuerzos de {q}!', ref_devueltos: 'Devolviste los refuerzos.', ref_retirados: 'Tus tropas vuelven a casa.', ref_nadie: 'Todavía no hay refuerzos.', toca_tu_castillo: '👑 Toca tu castillo para entrar a tu ciudad', entrar_ciudad: 'Entrar', bienvenido_ciudad: '🏰 ¡Bienvenido a tu ciudad!', armaduras_tienda: '🛡️ Armaduras', armaduras_tienda_txt: 'Ponle armadura a un tipo de tropa: todas las de ese tipo (y las que entrenes) la llevan puesta.', armadura_para: 'Armadura {n} — {t}', entrenando_n: '⚔️ Entrenando {n} tropas', maximo: 'Máx', terminar_ya: 'Terminar ya', terminado_gemas: '💎 ¡Terminado!', escudo_activo: '🛡️ Escudo activo: faltan {t}. Espera a que se acabe para poner otro.', escudo_activo_btn: 'Activo: {t}', nada_acelerar: 'No hay nada construyéndose ni entrenándose.', exp_llena: 'Sube una estrella para seguir', hv_equipo: 'Equipo', eq_arma: 'Arma', eq_casco: 'Casco', eq_pechera: 'Pechera', eq_guantes: 'Guantes', eq_botas: 'Botas', eq_amuleto: 'Amuleto', eq_r_comun: 'de hierro', eq_r_raro: 'de plata', eq_r_legendario: 'solar', eq_rapido: '⚡ Equipar rápido', eq_quitar_todo: 'Desequipar todo', eq_vacio: 'Vacío', eq_equipar: 'Equipar', eq_quitar: 'Quitar', eq_fundir: 'Fundir', eq_de: 'lo lleva {n}', eq_ninguno: 'No tienes piezas de este tipo. Gánalas en oleadas y campamentos, o abre un Cofre de equipo.', eq_nueva: '🧰 ¡Pieza nueva: {n}!', eq_fundida: '🔥 Fundiste {n}: +{o} 🪙', eq_mejorada: '⬆️ {n} subió al nivel {v}', eq_bonos: 'Del equipo: {t}', eq_dano: 'Daño', eq_vida: 'Vida', eq_def: 'Defensa', eq_vel: 'Velocidad', eq_recarga: 'Recarga', eq_nada_que: 'No hay piezas libres para equipar.', eq_listo: '⚡ Equipo puesto', eq_fundir_txt: '¿Fundir {n}? Da {o} de oro y la pieza desaparece.', eq_tienes: 'Piezas: {n}', p_chat: 'Chat', chat_global: 'Global', chat_hermandad: 'Hermandad', chat_escribe: 'Escribe un mensaje…', chat_enviar: 'Enviar', chat_cuenta: 'Crea una cuenta para chatear con otros jugadores.', chat_sin_alianza: 'Únete a una hermandad para hablar con ella.', chat_vacio: 'Todavía no hay mensajes. ¡Saluda!', chat_espera: 'Espera un momento antes de escribir otra vez.', chat_error: 'No se pudo enviar. Revisa tu internet.', chat_bloquear: 'Bloquear', chat_desbloquear: 'Desbloquear', chat_reportar: 'Reportar', chat_borrar: 'Borrar', chat_bloqueado: '🚫 Ya no verás los mensajes de {n}.', chat_reportado: '🚩 Gracias. Revisaremos el mensaje de {n}.', chat_bloqueados: 'Bloqueados: {n}', chat_normas: 'Sé amable. Los insultos se tapan y puedes reportar o bloquear a cualquiera tocando su nombre.', chat_tu: 'Tú', tel_aqui: 'Mover mi reino aquí', tel_tienes: 'Portales: {n}', tel_ok: '🌀 ¡Tu reino se mudó a {x}, {y}!', tel_oleada: 'No puedes mudarte durante una oleada.', tel_marcha: 'Espera a que vuelvan tus tropas que van marchando.', tel_atacado: 'No puedes huir: hay un ataque en camino.', tel_ocupada: 'Esa casilla no sirve: elige tierra libre (sin lagos, montañas, reinos ni campamentos).', tel_elegir: 'Abre el mapa del mundo y toca una casilla libre para mudarte.', tel_sin: 'No tienes portales: cómpralos en el Colmado.', tel_titulo: '¿Mudar tu reino?', tel_txt: 'Tu reino se mueve a {x}, {y}. Tus casillas conquistadas siguen siendo tuyas.', vig_txt: 'Defensa +{n}%', vig_ve: 'Ves la fuerza del atacante', al_decide: '¿Qué quieres hacer?', al_defender: 'Defender', al_portal_corto: 'Usar portal', al_te_ataca: '⚔️ ¡{n} te ataca!', al_llega: 'Llega en {t}', al_mas: '+{n} más', al_fuerza: 'Fuerza ~{f} · tu defensa {d}', al_sin_vigia: 'Construye un Puesto de vigía para ver su fuerza', al_tocar: 'Toca para defender tu ciudad', mar_hacia: '🏇 Tus tropas van hacia {n}', mar_llega: 'Llegan en {t}', mar_salen: '🏇 ¡Tus tropas salieron! Llegan a {n} en {t}.', mar_error: 'No se pudo enviar el ataque. Revisa tu internet.', mb_vigilar: 'Vigilar', p_vigia: 'Puesto de vigía', vig_entrantes: 'Ataques que vienen', vig_salientes: 'Tus marchas', vig_nada: 'Todo tranquilo por ahora.', acel_titulo: 'Acelerar', acel_falta: 'Falta: {t}', acel_usar: 'Usar', acel_usado: '⏩ Quitaste {t}', acel_todo: 'Acelerador real: 1 hora a todas las obras y termina el entrenamiento', acel_desde_menu: 'Úsalo desde el menú de un edificio (botón Acelerar) o en la cola de entrenamiento.', acel_listo: '✅ ¡Listo!', acel_cola: 'Acelerar entrenamiento', protege_txt: 'Protege {n} de cada recurso', tasa_txt: 'Cambio: 100 → {n}', herreria_txt: 'Armas hasta nivel {n}', necesitas_establo: 'Necesitas un Establo para entrenar caballería.', necesitas_galeria: 'Necesitas una Galería de tiro para entrenar arqueros.', necesitas_cuartel_t: 'Necesitas un Cuartel para entrenar esta tropa.', mb_comerciar: 'Comerciar', mb_forjar: 'Forjar', p_mercado: 'Mercado', p_herreria: 'Herrería', mer_cambiar: 'Cambiar recursos', mer_das: 'Das', mer_recibes: 'Recibes', mer_cambio_ok: '⚖️ Cambiaste {a} por {b}', mer_enviar: 'Enviar a tu hermandad', mer_a: 'Para', mer_enviar_btn: '📦 Enviar', mer_enviado: '📦 Enviaste recursos a {n}', mer_sin_alianza: 'Únete a una hermandad para enviar recursos.', mer_sin_cuenta: 'Crea una cuenta para enviar recursos.', mer_nadie: 'No hay nadie más en tu hermandad.', mer_recibiste: '📦 {n} te envió {b}', mer_error: 'No se pudo enviar. Revisa tu internet.', mer_nada: 'Elige qué enviar.', her_armas: 'Armas', her_armadura: 'Armadura', her_armas_sube: 'Armas {n}: +{d}% de daño', her_necesita: 'Herrería nivel {n}', her_sin: 'Construye una Herrería para forjar armas.', armas_lista: '⚒️ ¡Armas {n} para {t}!', mundo_toca: 'Toca una casilla del mapa para ver qué hay. Arrastra para moverte y pellizca para acercar.', cas_llanura: 'Llanura', cas_bosque: 'Bosque', cas_colina: 'Colina', cas_lago: 'Lago', cas_montana: 'Montaña', cas_guardianes: 'Guardianes', cas_tuya: '🚩 Esta casilla es tuya: da su bonus a tus campos.', cas_abandonar: 'Abandonar', cas_abandonar_txt: 'La casilla queda libre y pierdes su bonus.', cas_de: '🚩 Es de {n}.', cas_quitar: 'Atacar y quitársela', cas_libre: 'Conquístala para ganar su bonus. Tienes {n} de {m} casillas (sube el Castillo para tener más).', cas_conquistar: 'Conquistar', cas_maximo: 'Ya tienes {n} casillas. Sube el Castillo para conquistar más.', cas_ganada: '🚩 ¡Casilla conquistada! Su bonus ya ayuda a tus campos.', cas_perdida: 'Los guardianes resistieron.', cas_mias: 'Tus casillas: {n}/{m}', camp_atacar: 'Atacar el campamento', camp_espera: 'Los trasgos se están reagrupando: vuelve en {t}.', camp_perdio: 'Los trasgos resistieron.', mb_demoler: 'Demoler', demoler_titulo: '¿Demoler {n}?', demoler_txt: 'Se borra el edificio (nivel {v}) y la parcela queda libre. No se devuelven materiales.', demoler_si: 'Sí, demoler', cancelar: 'Cancelar', demolido: '🧨 {n} demolido. La parcela quedó libre.', demoler_oleada: 'No se puede demoler durante una oleada.', parcela_cerrada: '🔒 Sube el Castillo al nivel {n} para abrir esta parcela.', parcelas_nuevas: '🔓 ¡{n} parcelas nuevas en tu ciudad!', mb_recolectar: 'Recolectar', recolectado: '+{n} {r}', guarda_hasta: 'Guarda hasta {n}', solo_campo: 'Ese edificio va en los campos de fuera de la muralla.', solo_ciudad: 'Ese edificio va dentro de la ciudad.', campo_libre: 'Campo libre', parcela_libre: 'Parcela libre', sin_campo: 'No hay campos libres.', recolectar_todo: 'Recolectar todo', bp_saltar: 'Saltar', bp_volver: 'Volver al mapa', bp_victoria: '¡Victoria!', bp_derrota: 'Derrota', version_nueva: 'Hay una versión nueva {v}: toca para actualizar', hv_atributos: 'Atributos', hv_habilidades: 'Habilidades', hv_poder: 'Poder', hv_talento: 'Talento', hv_extra: 'Daño extra', hv_dur: 'Duración', hv_dano: 'Daño', hv_saltos: 'Saltos', hv_alrededor: 'Alrededor', hv_flecha: 'Por flecha', hv_radio: 'Radio', hv_menos: 'Daño recibido', hv_mareo: 'Mareo', hv_cura: 'Cura', hv_recarga: 'Recarga', hv_dano_heroe: 'Daño del héroe', hv_vida_heroe: 'Vida del héroe', hv_necesita: 'Sube a {n}★ para desbloquear el siguiente nivel.', pergaminos_tienes: 'Pergaminos: {n} (se ganan en las oleadas y en el Colmado)', sin_pergaminos: 'Te faltan pergaminos de habilidad: gánalos en las oleadas o en el Colmado.', hab_sube: '✨ {h} subió al nivel {n}', tal_infanteria: 'Brazo fuerte', tal_infanteria_txt: 'El héroe pega más fuerte.', tal_arquero: 'Ojo certero', tal_arquero_txt: 'Más daño y más alcance.', tal_magia: 'Mente veloz', tal_magia_txt: 'Su poder se recarga más rápido.', tal_guardian: 'Piel de roca', tal_guardian_txt: 'El héroe aguanta mucho más.', usar_libros: 'Libros', sin_libros: 'No tienes libros de experiencia. Cómpralos en el Colmado.', libros_usados: 'Usaste {n} libros de experiencia.', libro_en_heroe: 'Úsalo desde el panel del héroe: Guardia → Héroes.', estrellas: 'Estrellas', estrella_da: 'Con {a}★: +20% vida y daño, y nivel máximo {n}.', subir_estrella_c: 'Subir', obtener_mas: 'Obtener más', ir: 'Ir', reclamar: 'Reclamar', heroes_premio: '🦸 Tu equipo ganó {x} EXP y {n} {f} fragmentos', ob_oferta: 'Oferta del día', ob_oferta_txt: '{n} fragmentos gratis, una vez al día', ob_canje: 'Canje', ob_canje_txt: '{n} fragmentos de este héroe', ob_reclutar: 'Reclutar', ob_reclutar_txt: 'Si sale repetido: {n} fragmentos', ob_oleadas: 'Oleadas', ob_oleadas_txt: 'Al ganar, tu equipo gana EXP y fragmentos', ob_diario: 'Cofre diario', ob_diario_txt: 'Premios cada día en el Baúl', ob_tienda: 'Tienda', ob_tienda_txt: 'Libros de experiencia', mb_detalles: 'Detalles', mb_terminar: 'Terminar', mb_acelerar: 'Acelerar', mb_investigar: 'Investigar', mb_sin_acelerador: 'No tienes aceleradores: consíguelos en el Colmado o en los cofres.', pest_cuartel: 'Cuartel', pest_establo: 'Establo', pest_tiro: 'Campo de tiro', rango: 'Rango', rango_bloq: '🔒 El rango {r} está bloqueado. Sube la armadura para desbloquearlo.', rango_antes: '🔒 Primero desbloquea el rango {r}.', subir_rango: 'Subir a rango {r}', entrenadas_ya: '⚔️ ¡{n} × {t} listas!', sin_recursos_tropa: 'No te alcanzan los materiales para entrenar esta tropa.', terminar_cola: 'Terminar entrenamiento',
    p_investigar: 'Investigación', investigar: 'Investigar', rama_crecimiento: 'Crecimiento', rama_economia: 'Economía', rama_batalla: 'Batalla',
    inv_txt: 'Cada tecnología mejora algo de verdad en tu reino. Solo se investiga una a la vez.', inv_ahora: 'Ahora', inv_siguiente: 'Siguiente',
    inv_en_curso: 'Investigando: {n} (nivel {l})', inv_falta: 'Faltan {s} s', inv_ocupada: 'La Academia ya está investigando.',
    inv_tope: 'Mejora la Academia para pasar del nivel {n}.', inv_lista: '📜 ¡{n} nivel {l} lista!', inv_necesitas: 'Construye una Academia para investigar.',
    inv_abrir: '📜 Abrir investigación', c_academia: 'Consejo: construye una Academia para investigar mejoras.',
    b_mundo: 'Mundo', b_alianza: 'Alianza', p_mundo: 'Mapa del mundo', p_alianza: 'Alianza',
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
    borrar_cuenta_ok: 'Borrar para siempre', cuenta_borrada: 'Tu cuenta fue borrada.', privacidad: 'Privacidad', novedades: '¡Novedades!', novedades_lista: '<li>⚔️ <b>Aviso de ataque chiquito</b> arriba a la izquierda: quién te ataca y cuánto falta, sin tapar la ciudad. Tócalo y eliges tú: Defender o Usar portal.</li><li>📬 <b>Buzón</b>: las novedades ya no tapan el reino al entrar. Llegan al buzón (botón 📬 a la derecha) con un punto rojo si no las leíste.</li><li>🔢 Los números de los botones de abajo solo cuentan lo <b>nuevo</b> y se borran al entrar.</li><li>🏷️ <b>Nombres nuevos del menú</b>: Campaña, Tropas, Inventario, Edificios, Tienda, Alianza y Mundo.</li><li>🔬 <b>Investigar por tropa</b>: en Tropas, botón Investigar para Ataque, Vida, Defensa y Velocidad de cada tipo. Es la misma investigación de la Academia y muestra cuánto sube tu Poder.</li><li>🎒 <b>Inventario con pestañas</b>: Recursos, Acelerar, Ingresos, Equipo y Otros, con punto rojo en lo nuevo. Las piezas de equipo se mejoran desde ahí y suben el Poder.</li><li>🌀 <b>Portales contra ataques</b>: el aviso de ataque trae el botón Usar portal. Si te mudas antes de que llegue el ataque, se cancela. Un portal cada 24 horas y 1 hora sin atacar después de mudarte.</li><li>🪟 Los paneles son más pequeños y centrados: se ve el reino alrededor.</li><li>🧱 <b>Ciudad ordenada</b>: cada edificio va en su propia parcela, centrado y con aire alrededor, con caminitos entre parcela y parcela. Ya no se tocan ni tocan la muralla.</li><li>➕ <b>Parcelas nuevas</b>: todas iguales, con borde de piedra, marco de pasto y un + para construir. Tócala y se abre Construir. Los campos de fuera tienen el mismo estilo.</li><li>🏰 La muralla es más grande para que quepan todas las parcelas.</li><li>🏰 <b>Entras directo a tu reino</b>: ya no sale el cartel de bienvenida. Los botones de idioma (ES/EN) y cerrar sesión (⏻) están arriba, junto a tus recursos.</li><li>🎥 <b>Cámara nueva</b>: más lejos y con el castillo de frente, para ver todo el reino.</li><li>⏱️ <b>Construir y mejorar toma tiempo</b>: minutos al principio y horas en los niveles altos. Cada nivel cuesta más que el anterior.</li><li>📋 <b>Trabajos</b>: para subir el castillo y los edificios hay que ganar oleadas, recolectar, entrenar tropas y vencer campamentos. El botón dice qué falta.</li><li>⚔️ <b>Entrenar toma tiempo de verdad</b> (minutos para pocas tropas, horas para muchas). Se acelera con aceleradores; la cola se ve arriba a la derecha.</li><li>📘 Los libros y pergaminos de los héroes ya no se venden: se ganan en oleadas, campamentos y el cofre diario.</li><li>🛡️ <b>Botón ⚔️ ON/OFF</b>: decide si tus tropas defienden cuando te atacan (si defienden, pueden morir).</li><li>🧰 <b>Equipo de héroes</b>: 6 espacios (arma, casco, pechera, guantes, botas y amuleto). Cada pieza tiene rareza y nivel, se mejora y da daño, vida, defensa, velocidad o recarga. Botones Equipar rápido y Desequipar todo.</li><li>🎁 Las piezas salen en oleadas, campamentos y en el Cofre de equipo del Colmado. ¡Te regalamos 2 para empezar!</li><li>💬 <b>Chat</b>: botón 💬 a la derecha con pestañas Global y Hermandad, en vivo. Toca el nombre de alguien para bloquearlo o reportarlo; los insultos se tapan solos.</li><li>🌀 <b>Portales de teletransportación</b>: muda tu reino a otro lugar del mapa del mundo. Portal al azar (lugar libre al azar) o Portal elegido (toca una casilla libre en el mapa y elige Mover mi reino aquí). Con columna de luz y aro mágico.</li><li>🚨 <b>Aviso de ataque</b>: si alguien te ataca, sale una alerta roja con sonido, quién es y cuánto falta para que llegue. Tócala para ir a tu ciudad y preparar la defensa.</li><li>🏇 Los ataques ahora tardan en llegar (1 a 3 minutos) y se deciden al llegar, con la defensa que tengas en ese momento.</li><li>👁️ <b>Puesto de vigía</b> nuevo: ves la fuerza de quien te ataca y tu reino defiende más.</li><li>🏗️ <b>5 edificios nuevos</b>: Almacén (protege recursos de los saqueos), Mercado (cambia recursos y envíalos a tu hermandad), Herrería (forja armas: más daño), Establo (caballería) y Galería de tiro (arqueros).</li><li>⏱️ <b>Aceleradores</b> de 1 min, 5 min, 15 min, 1 hora, 8 y 12 horas para obras, entrenamientos e investigación. Toca Acelerar en el edificio.</li><li>🌍 <b>Mapa del mundo nuevo en 3D y en cuadrícula</b>: llanuras, bosques, colinas, lagos y montañas. Arrastra para moverte y pellizca para acercar.</li><li>🚩 <b>Conquista casillas</b>: gana a sus guardianes y su bonus ayuda a tus campos (bosque → madera, colina → piedra, lago y llanura → comida, montaña → oro). Puedes tener tantas como el nivel de tu Castillo.</li><li>⛺ Ahora puedes atacar los campamentos de trasgos para ganar botín.</li><li>🧨 <b>Demoler</b>: toca un edificio y elige Demoler (te pregunta antes). La parcela queda libre para construir otra cosa.</li><li>🔓 <b>Parcelas por nivel del Castillo</b>: con el Castillo nivel 1 tienes 4 parcelas y cada nivel abre 3 más (hasta 37). Las próximas se ven con un candado.</li><li>🗺️ <b>Reino en cuadrícula</b>: la ciudad tiene parcelas ordenadas y cada edificio muestra su nombre y nivel.</li><li>🌾 <b>Campos fuera de la muralla</b>: Granja, Aserradero, Mina de oro y Cantera (nueva). Guardan lo que producen, incluso con el juego cerrado: tócalos y pulsa Recolectar.</li><li>🔁 Tus granjas, aserraderos y minas se mudaron solos a los campos con su nivel (la mina vieja ahora es Cantera).</li><li>⚔️ <b>Ataca a otros jugadores</b> desde el mapa de Islas, aunque sean más poderosos. Ahora hay una escena de batalla con los dos ejércitos, x2 y Saltar.</li><li>🔄 El juego avisa cuando hay una versión nueva y se actualiza solo.</li><li>✨ <b>Habilidades con nivel</b>: en la ficha del héroe, pestaña Habilidades. El Poder sube hasta nivel 5 (cada estrella abre un nivel) y se ve qué mejora: más daño, más duración y menos recarga.</li><li>💪 <b>Talento</b> nuevo para cada clase: se abre con 2★.</li><li>📜 Pergaminos de habilidad: se ganan en las oleadas y en el Colmado.</li><li>🏹 Los héroes de distancia lanzan su poder desde más lejos y avanzan hacia los enemigos.</li>', novedades_ok: '¡A jugar!',
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
    b_tropas: 'TROOPS', b_construir: 'Buildings', b_invocar: 'SUMMON',
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
    tr_titulo: 'Tasks to level up', tr_oleadas: 'Win {n} waves', tr_recolectas: 'Collect from your fields {n} times', tr_tropas: 'Train {n} troops', tr_campamentos: 'Beat {n} goblin camps (Islands)', tr_falta: '🔒 A task is missing: {t}', tr_bloqueado: '🔒 Finish the tasks to upgrade', mat_titulo: 'Materials to level up', mat_peq: '📘 Small book (+300 EXP): earned in waves and the daily chest', mat_gra: '📗 Big book (+1500 EXP): earned by beating goblin camps and in the daily chest', mat_perg: '📜 Scroll (skills): earned in waves', mat_falta: 'You need books: play waves and beat camps to get them.', mat_no_tienda: 'These materials are not sold at the Market: you earn them by playing.', mat_ganado: '📘 +{n} experience book(s) for your heroes', def_on: '⚔️ ON', def_off: '⚔️ OFF', def_titulo: 'Troops defend', def_on_txt: 'Your troops defend the kingdom when you are attacked. Careful: they can die and you will have to train new ones!', def_off_txt: 'Your troops stay inside and do not defend: they will not die, but your kingdom defends only with the castle, the wall and the towers.', acel_recorta: 'cuts {t}', entreno_cola_pill: 'Training', rama_tropas: 'Troops', inv_de_tropa: '{n} research', investigar_tropa: '🔬 Research', poder_sube: '+{n} Power', poder_subio: '💪 Your Power went up to {n}!', buzon: 'Mailbox', buzon_titulo: '📬 Mailbox', buzon_vacio: 'You have no new messages.', buzon_nov: 'What\'s new in version {v}!', buzon_leido: 'Read', buzon_otras: 'Older versions', inv_tab_recursos: 'Resources', inv_tab_acelerar: 'Speed-ups', inv_tab_ingresos: 'Income', inv_tab_equipo: 'Gear', inv_tab_otros: 'Other', inv_vacio_tab: 'Nothing here yet.', inv_equipada: 'Equipped on {n}', inv_libre: 'Not equipped', inv_mejorar_pieza: 'Upgrade', inv_recurso_txt: 'What you have stored right now.', al_portal: '🌀 Use portal', tel_cancelado: '🌀 You moved in time: the attack from {n} was canceled and their troops go back.', tel_espera24: 'You already used a portal: wait {t} to use another.', tel_batalla: 'The battle already started: you can no longer use the portal.', tel_no_atacar: 'You just moved: you cannot attack for {t}.', cas_terreno: 'Terrain', cas_coord: 'Coordinates', cas_ocupada_por: 'Occupied by', cas_libre_corto: 'Free', cas_reubicar: '🌀 Relocate', cas_ocupar: '🚩 Occupy', cas_tu_reino: 'Your kingdom', cas_campamento: 'Goblin camp', tel_elige_casilla: '🌀 Tap a free tile on the map and press Relocate.', mar_cancelada: '🌀 {n} moved with a portal before you arrived. Your troops go back without fighting.', hola: 'Hi, {n}!', salir_txt: 'Your game stays saved in the cloud. Are you sure you want to sign out?', cerrar_sesion: 'Sign out', cargando: 'Loading...', guardado_nube: 'Saved to the cloud ☁️',
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
    b_conquista: 'Campaign', b_heroes: 'Troops', b_mochila: 'Inventory', b_tienda: 'Shop',
    p_conquista: 'Campaign', p_heroes: 'Troops', p_mochila: 'Inventory', p_tienda: 'Shop', sub_tropas: 'Troops', sub_invocar: 'Summon',
    conquista_txt: 'Defend the kingdom from each wave. Win it to earn gems.', oleada_curso: 'Wave in progress: {n} enemies left.',
    vienen: 'Coming:', oleadas_ganadas: 'Waves won',
    diario_titulo: 'Daily chest', diario_txt: 'Come back every day for a better chest. Miss a day and the streak starts over.',
    diario_dia: 'Day {n}', diario_reclamar: '🎁 Claim day {n} chest', diario_listo: 'Already claimed today. Come back tomorrow for day {n}.',
    diario_racha: '🔥 Streak: {n} days in a row', mochila_vacia: 'Your chest is empty. Get chests from the daily chest or the Market.',
    mis_objetos: 'Your items', usar: 'Use', abrir: 'Open', recibiste: '🎁 You got: {t}', tropas_regalo: '{n} troops',
    tienda_txt: 'Buy with gems. What you buy goes to your Chest 🧳. Gems are won in waves and from the daily chest.',
    tienda_real: 'Real-money purchases: coming with the App Store version.', comprar: 'Buy', comprado: '{n}: saved in your Chest 🧳',
    acelerador_usado: '⏩ You took 1 hour off all buildings!', sub_heroes: 'Heroes', heroes_txt: 'Your heroes come out of the castle every wave and use their power. Take up to 3 in your team.', reclutar: 'Recruit hero', reclutar_gratis: '🎁 Free today', reclutar_txt: 'Recruit to get new heroes. If you get one you already have, you earn shards to raise its stars.', heroe_nuevo: '🎉 New hero: {n}!', heroe_frag: '+{f} {n} shards', equipo_n: 'Team: {n}/3', en_equipo: 'TEAM', poner_equipo: '➕ Add to team', quitar_equipo: '➖ Remove from team', equipo_lleno: 'Your team already has 3 heroes. Remove one first.', subir_nivel: 'Level up', subir_estrella: '⭐ Raise star', nivel_tope: 'Raise a star to go above level {n}.', fragmentos: 'Shards', poder_heroe: 'Power', bloqueado: '🔒 Get it by recruiting', rareza_comun: 'Common', rareza_raro: 'Rare', rareza_legendario: 'Legendary', clase_infanteria: 'Infantry', clase_arquero: 'Archer', clase_magia: 'Magic', clase_guardian: 'Guardian', heroe_sube: '⬆️ {n} reached level {v}!', heroe_estrella: '⭐ {n} now has {v} stars!', volver: '⬅ Back', resultado: 'Result', estrellas_max: '★ Max stars', cada_s: 'every {s} s', ref_titulo: '📣 Reinforcements', ref_txt: 'Your troops can defend an ally’s kingdom: they fight in their waves and add to their defense. You can call them back any time.', ref_pedir: '📣 Ask for reinforcements', ref_pedido_hecho: '📣 You asked your guild for reinforcements.', ref_quitar_pedido: 'Remove request', ref_pedidos: 'Asking for help', ref_ninguno: 'Nobody is asking for help right now.', ref_reforzar: '🛡️ Reinforce', ref_en_reino: 'Reinforcements in your kingdom', ref_enviados: 'Your reinforcements sent', ref_devolver: 'Send back', ref_retirar: 'Call back', ref_de: '{n} troops from {q}', ref_a: '{n} troops in {q}’s kingdom', ref_enviar_a: 'Send reinforcements to {q}', ref_tienes: 'You have {n}', ref_enviar: '🛡️ Send reinforcements', ref_enviado: '🛡️ Reinforcements sent to {q}!', ref_volvieron: '🛡️ {n} troops came back from {q}’s kingdom', ref_error: 'Could not do it. Check your internet and that you are both in the same guild.', ref_en_oleada: 'Wait until the wave ends.', ref_nada: 'Choose at least one troop.', ref_llegaron: '🛡️ Reinforcements arrived from {q}!', ref_devueltos: 'You sent the reinforcements back.', ref_retirados: 'Your troops are coming home.', ref_nadie: 'No reinforcements yet.', toca_tu_castillo: '👑 Tap your castle to enter your city', entrar_ciudad: 'Enter', bienvenido_ciudad: '🏰 Welcome to your city!', armaduras_tienda: '🛡️ Armor', armaduras_tienda_txt: 'Give armor to a troop type: every troop of that type (and new ones) wears it.', armadura_para: 'Armor {n} — {t}', entrenando_n: '⚔️ Training {n} troops', maximo: 'Max', terminar_ya: 'Finish now', terminado_gemas: '💎 Done!', escudo_activo: '🛡️ Shield active: {t} left. Wait until it ends to use another one.', escudo_activo_btn: 'Active: {t}', nada_acelerar: 'Nothing is being built or trained.', exp_llena: 'Raise a star to continue', hv_equipo: 'Gear', eq_arma: 'Weapon', eq_casco: 'Helmet', eq_pechera: 'Chestplate', eq_guantes: 'Gloves', eq_botas: 'Boots', eq_amuleto: 'Amulet', eq_r_comun: 'of iron', eq_r_raro: 'of silver', eq_r_legendario: 'of the sun', eq_rapido: '⚡ Quick equip', eq_quitar_todo: 'Unequip all', eq_vacio: 'Empty', eq_equipar: 'Equip', eq_quitar: 'Remove', eq_fundir: 'Melt', eq_de: 'worn by {n}', eq_ninguno: 'You have no pieces of this kind. Win them in waves and camps, or open a Gear chest.', eq_nueva: '🧰 New piece: {n}!', eq_fundida: '🔥 You melted {n}: +{o} 🪙', eq_mejorada: '⬆️ {n} reached level {v}', eq_bonos: 'From gear: {t}', eq_dano: 'Damage', eq_vida: 'Health', eq_def: 'Defense', eq_vel: 'Speed', eq_recarga: 'Cooldown', eq_nada_que: 'No free pieces to equip.', eq_listo: '⚡ Gear equipped', eq_fundir_txt: 'Melt {n}? Gives {o} gold and the piece disappears.', eq_tienes: 'Pieces: {n}', p_chat: 'Chat', chat_global: 'Global', chat_hermandad: 'Guild', chat_escribe: 'Write a message…', chat_enviar: 'Send', chat_cuenta: 'Create an account to chat with other players.', chat_sin_alianza: 'Join a guild to talk with it.', chat_vacio: 'No messages yet. Say hi!', chat_espera: 'Wait a moment before writing again.', chat_error: 'Could not send. Check your internet.', chat_bloquear: 'Block', chat_desbloquear: 'Unblock', chat_reportar: 'Report', chat_borrar: 'Delete', chat_bloqueado: '🚫 You will no longer see messages from {n}.', chat_reportado: '🚩 Thanks. We will review the message from {n}.', chat_bloqueados: 'Blocked: {n}', chat_normas: 'Be kind. Insults are hidden and you can report or block anyone by tapping their name.', chat_tu: 'You', tel_aqui: 'Move my kingdom here', tel_tienes: 'Portals: {n}', tel_ok: '🌀 Your kingdom moved to {x}, {y}!', tel_oleada: 'You cannot move during a wave.', tel_marcha: 'Wait for your marching troops to come back.', tel_atacado: 'You cannot flee: an attack is on its way.', tel_ocupada: 'That tile does not work: pick free land (no lakes, mountains, kingdoms or camps).', tel_elegir: 'Open the world map and tap a free tile to move.', tel_sin: 'You have no portals: buy them at the Market.', tel_titulo: 'Move your kingdom?', tel_txt: 'Your kingdom moves to {x}, {y}. Your conquered tiles stay yours.', vig_txt: 'Defense +{n}%', vig_ve: 'You see the attacker strength', al_decide: 'What do you want to do?', al_defender: 'Defend', al_portal_corto: 'Use portal', al_te_ataca: '⚔️ {n} is attacking you!', al_llega: 'Arrives in {t}', al_mas: '+{n} more', al_fuerza: 'Strength ~{f} · your defense {d}', al_sin_vigia: 'Build a Watch post to see their strength', al_tocar: 'Tap to defend your city', mar_hacia: '🏇 Your troops are heading to {n}', mar_llega: 'Arrive in {t}', mar_salen: '🏇 Your troops left! They reach {n} in {t}.', mar_error: 'Could not send the attack. Check your internet.', mb_vigilar: 'Watch', p_vigia: 'Watch post', vig_entrantes: 'Incoming attacks', vig_salientes: 'Your marches', vig_nada: 'All quiet for now.', acel_titulo: 'Speed up', acel_falta: 'Left: {t}', acel_usar: 'Use', acel_usado: '⏩ You took off {t}', acel_todo: 'Royal speed-up: 1 hour off all buildings and finishes training', acel_desde_menu: 'Use it from a building menu (Speed up button) or in the training queue.', acel_listo: '✅ Done!', acel_cola: 'Speed up training', protege_txt: 'Protects {n} of each resource', tasa_txt: 'Trade: 100 → {n}', herreria_txt: 'Weapons up to level {n}', necesitas_establo: 'You need a Stable to train cavalry.', necesitas_galeria: 'You need an Archery range to train archers.', necesitas_cuartel_t: 'You need Barracks to train this troop.', mb_comerciar: 'Trade', mb_forjar: 'Forge', p_mercado: 'Market square', p_herreria: 'Forge', mer_cambiar: 'Trade resources', mer_das: 'You give', mer_recibes: 'You get', mer_cambio_ok: '⚖️ You traded {a} for {b}', mer_enviar: 'Send to your guild', mer_a: 'To', mer_enviar_btn: '📦 Send', mer_enviado: '📦 You sent resources to {n}', mer_sin_alianza: 'Join a guild to send resources.', mer_sin_cuenta: 'Create an account to send resources.', mer_nadie: 'Nobody else is in your guild.', mer_recibiste: '📦 {n} sent you {b}', mer_error: 'Could not send. Check your internet.', mer_nada: 'Choose what to send.', her_armas: 'Weapons', her_armadura: 'Armor', her_armas_sube: 'Weapons {n}: +{d}% damage', her_necesita: 'Forge level {n}', her_sin: 'Build a Forge to make weapons.', armas_lista: '⚒️ Weapons {n} for {t}!', mundo_toca: 'Tap a tile on the map to see what is there. Drag to move and pinch to zoom.', cas_llanura: 'Plains', cas_bosque: 'Forest', cas_colina: 'Hill', cas_lago: 'Lake', cas_montana: 'Mountain', cas_guardianes: 'Guardians', cas_tuya: '🚩 This tile is yours: it gives its bonus to your fields.', cas_abandonar: 'Abandon', cas_abandonar_txt: 'The tile becomes free and you lose its bonus.', cas_de: '🚩 Owned by {n}.', cas_quitar: 'Attack and take it', cas_libre: 'Conquer it to get its bonus. You have {n} of {m} tiles (upgrade the Castle for more).', cas_conquistar: 'Conquer', cas_maximo: 'You already have {n} tiles. Upgrade the Castle to conquer more.', cas_ganada: '🚩 Tile conquered! Its bonus now helps your fields.', cas_perdida: 'The guardians held.', cas_mias: 'Your tiles: {n}/{m}', camp_atacar: 'Attack the camp', camp_espera: 'The goblins are regrouping: come back in {t}.', camp_perdio: 'The goblins held.', mb_demoler: 'Demolish', demoler_titulo: 'Demolish {n}?', demoler_txt: 'The building (level {v}) is removed and the plot becomes free. Materials are not returned.', demoler_si: 'Yes, demolish', cancelar: 'Cancel', demolido: '🧨 {n} demolished. The plot is free.', demoler_oleada: 'You cannot demolish during a wave.', parcela_cerrada: '🔒 Upgrade the Castle to level {n} to open this plot.', parcelas_nuevas: '🔓 {n} new plots in your city!', mb_recolectar: 'Collect', recolectado: '+{n} {r}', guarda_hasta: 'Stores up to {n}', solo_campo: 'That building goes in the fields outside the wall.', solo_ciudad: 'That building goes inside the city.', campo_libre: 'Free field', parcela_libre: 'Free plot', sin_campo: 'No free fields.', recolectar_todo: 'Collect all', bp_saltar: 'Skip', bp_volver: 'Back to map', bp_victoria: 'Victory!', bp_derrota: 'Defeat', version_nueva: 'New version {v} available: tap to update', hv_atributos: 'Attributes', hv_habilidades: 'Skills', hv_poder: 'Power', hv_talento: 'Talent', hv_extra: 'Extra damage', hv_dur: 'Duration', hv_dano: 'Damage', hv_saltos: 'Jumps', hv_alrededor: 'Splash', hv_flecha: 'Per arrow', hv_radio: 'Radius', hv_menos: 'Damage taken', hv_mareo: 'Stun', hv_cura: 'Heal', hv_recarga: 'Cooldown', hv_dano_heroe: 'Hero damage', hv_vida_heroe: 'Hero health', hv_necesita: 'Reach {n}★ to unlock the next level.', pergaminos_tienes: 'Scrolls: {n} (earned in waves and at the Market)', sin_pergaminos: 'You need more skill scrolls: earn them in waves or at the Market.', hab_sube: '✨ {h} reached level {n}', tal_infanteria: 'Strong arm', tal_infanteria_txt: 'The hero hits harder.', tal_arquero: 'Sharp eye', tal_arquero_txt: 'More damage and more range.', tal_magia: 'Quick mind', tal_magia_txt: 'Their power recharges faster.', tal_guardian: 'Rock skin', tal_guardian_txt: 'The hero lasts much longer.', usar_libros: 'Books', sin_libros: 'You have no experience books. Buy them at the Market.', libros_usados: 'You used {n} experience books.', libro_en_heroe: 'Use it from the hero panel: Guard → Heroes.', estrellas: 'Stars', estrella_da: 'At {a}★: +20% health and damage, and max level {n}.', subir_estrella_c: 'Raise', obtener_mas: 'Get more', ir: 'Go', reclamar: 'Claim', heroes_premio: '🦸 Your team earned {x} XP and {n} got {f} shards', ob_oferta: 'Daily offer', ob_oferta_txt: '{n} free shards, once a day', ob_canje: 'Exchange', ob_canje_txt: '{n} shards of this hero', ob_reclutar: 'Recruit', ob_reclutar_txt: 'Duplicates give {n} shards', ob_oleadas: 'Waves', ob_oleadas_txt: 'Winning gives your team XP and shards', ob_diario: 'Daily chest', ob_diario_txt: 'Rewards every day in the Chest', ob_tienda: 'Shop', ob_tienda_txt: 'Experience books', mb_detalles: 'Details', mb_terminar: 'Finish', mb_acelerar: 'Speed up', mb_investigar: 'Research', mb_sin_acelerador: 'You have no speed-ups: get them at the Market or in chests.', pest_cuartel: 'Barracks', pest_establo: 'Stable', pest_tiro: 'Archery range', rango: 'Rank', rango_bloq: '🔒 Rank {r} is locked. Upgrade the armor to unlock it.', rango_antes: '🔒 Unlock rank {r} first.', subir_rango: 'Upgrade to rank {r}', entrenadas_ya: '⚔️ {n} × {t} ready!', sin_recursos_tropa: 'You do not have enough materials to train this troop.', terminar_cola: 'Finish training',
    p_investigar: 'Research', investigar: 'Research', rama_crecimiento: 'Growth', rama_economia: 'Economy', rama_batalla: 'Battle',
    inv_txt: 'Each technology really improves something in your kingdom. Only one at a time.', inv_ahora: 'Now', inv_siguiente: 'Next',
    inv_en_curso: 'Researching: {n} (level {l})', inv_falta: '{s} s left', inv_ocupada: 'The Academy is already researching.',
    inv_tope: 'Upgrade the Academy to go past level {n}.', inv_lista: '📜 {n} level {l} done!', inv_necesitas: 'Build an Academy to research.',
    inv_abrir: '📜 Open research', c_academia: 'Tip: build an Academy to research upgrades.',
    b_mundo: 'World', b_alianza: 'Alliance', p_mundo: 'World map', p_alianza: 'Alliance',
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
    borrar_cuenta_ok: 'Delete forever', cuenta_borrada: 'Your account was deleted.', privacidad: 'Privacy', novedades: 'What\'s new!', novedades_lista: '<li>⚔️ <b>Small attack alert</b> at the top left: who is attacking and how long until they arrive, without covering your city. Tap it and you choose: Defend or Use portal.</li><li>📬 <b>Mailbox</b>: news no longer cover your kingdom when you enter. They arrive in the mailbox (📬 button on the right) with a red dot if unread.</li><li>🔢 The numbers on the bottom buttons only count what is <b>new</b> and clear when you open them.</li><li>🏷️ <b>New menu names</b>: Campaign, Troops, Inventory, Buildings, Shop, Alliance and World.</li><li>🔬 <b>Research per troop</b>: in Troops, a Research button for Attack, Health, Defense and Speed of each type. It is the same Academy research and shows how much your Power goes up.</li><li>🎒 <b>Inventory with tabs</b>: Resources, Speed-ups, Income, Gear and Other, with a red dot on new things. Gear pieces can be upgraded there and raise your Power.</li><li>🌀 <b>Portals against attacks</b>: the attack alert has a Use portal button. If you move before the attack arrives, it is canceled. One portal every 24 hours and 1 hour without attacking after moving.</li><li>🪟 Panels are smaller and centered: you can see your kingdom around them.</li><li>🧱 <b>Tidy city</b>: every building sits on its own plot, centered with space around it, with little paths between plots. They no longer touch each other or the wall.</li><li>➕ <b>New plots</b>: all alike, with a stone border, a grass frame and a + to build. Tap one to open Build. The fields outside use the same style.</li><li>🏰 The wall is bigger so all the plots fit.</li><li>🏰 <b>You go straight into your kingdom</b>: no more welcome card. The language (ES/EN) and sign-out (⏻) buttons are at the top, next to your resources.</li><li>🎥 <b>New camera</b>: farther away with the castle facing you, so you see the whole kingdom.</li><li>⏱️ <b>Building and upgrading take time</b>: minutes at first and hours at high levels. Each level costs more than the last.</li><li>📋 <b>Tasks</b>: to level up the castle and buildings you must win waves, collect, train troops and beat camps. The button tells you what is missing.</li><li>⚔️ <b>Training takes real time</b> (minutes for a few troops, hours for many). Use speed-ups; the queue shows at the top right.</li><li>📘 Hero books and scrolls are no longer sold: earn them in waves, camps and the daily chest.</li><li>🛡️ <b>⚔️ ON/OFF button</b>: choose whether your troops defend when you are attacked (if they defend, they can die).</li><li>🧰 <b>Hero gear</b>: 6 slots (weapon, helmet, chestplate, gloves, boots and amulet). Each piece has rarity and level, can be upgraded and gives damage, health, defense, speed or cooldown. Quick equip and Unequip all buttons.</li><li>🎁 Pieces drop from waves, camps and the Gear chest at the Market. You get 2 free to start!</li><li>💬 <b>Chat</b>: 💬 button on the right with Global and Guild tabs, live. Tap someone’s name to block or report them; insults are hidden automatically.</li><li>🌀 <b>Teleport portals</b>: move your kingdom to another spot on the world map. Random portal (random free spot) or Chosen portal (tap a free tile on the map and pick Move my kingdom here). With a light beam and magic ring.</li><li>🚨 <b>Attack alert</b>: if someone attacks you, a red alert with sound shows who it is and how long until they arrive. Tap it to go to your city and get ready.</li><li>🏇 Attacks now take time to arrive (1 to 3 minutes) and are decided on arrival, with the defense you have at that moment.</li><li>👁️ New <b>Watch post</b>: see the strength of attackers and your kingdom defends better.</li><li>🏗️ <b>5 new buildings</b>: Warehouse (protects resources from raids), Market square (trade resources and send them to your guild), Forge (weapons: more damage), Stable (cavalry) and Archery range (archers).</li><li>⏱️ <b>Speed-ups</b> of 1 min, 5 min, 15 min, 1 hour, 8 and 12 hours for buildings, training and research. Tap Speed up on the building.</li><li>🌍 <b>New 3D grid world map</b>: plains, forests, hills, lakes and mountains. Drag to move and pinch to zoom.</li><li>🚩 <b>Conquer tiles</b>: beat their guardians and their bonus helps your fields (forest → wood, hill → stone, lake and plains → food, mountain → gold). You can hold as many as your Castle level.</li><li>⛺ You can now attack goblin camps for loot.</li><li>🧨 <b>Demolish</b>: tap a building and choose Demolish (it asks first). The plot becomes free to build something else.</li><li>🔓 <b>Plots by Castle level</b>: Castle level 1 gives 4 plots and each level opens 3 more (up to 37). The next ones show a lock.</li><li>🗺️ <b>Grid kingdom</b>: the city has tidy plots and every building shows its name and level.</li><li>🌾 <b>Fields outside the wall</b>: Farm, Sawmill, Gold mine and Quarry (new). They store what they make, even while the game is closed: tap them and press Collect.</li><li>🔁 Your farms, sawmills and mines moved to the fields with their level (the old mine is now a Quarry).</li><li>⚔️ <b>Attack other players</b> from the Islands map, even stronger ones. There is now a battle scene with both armies, x2 and Skip.</li><li>🔄 The game tells you when there is a new version and updates itself.</li><li>✨ <b>Skills with levels</b>: in the hero sheet, Skills tab. The Power goes up to level 5 (each star unlocks a level) and you see what improves: more damage, longer duration and shorter cooldown.</li><li>💪 New <b>Talent</b> for each class: unlocks at 2★.</li><li>📜 Skill scrolls: earned in waves and at the Market.</li><li>🏹 Ranged heroes cast their power from farther away and move toward enemies.</li>', novedades_ok: 'Let\'s play!',
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
  mina:       { es: 'Mina de oro',  en: 'Gold mine',
                des_es: 'Saca oro del fondo de la colina.', des_en: 'Digs gold out of the hill.' },
  vigia:      { es: 'Puesto de vigía', en: 'Watch post',
                des_es: 'Vigila el horizonte: muestra la fuerza de quien te ataca y da defensa extra al reino.', des_en: 'Watches the horizon: shows the strength of attackers and gives the kingdom extra defense.' },
  almacen:    { es: 'Almacén',      en: 'Warehouse',
                des_es: 'Guarda recursos bajo llave: si te saquean, esa parte no se la llevan.', des_en: 'Keeps resources locked: if you are raided, that part cannot be taken.' },
  mercado:    { es: 'Mercado',      en: 'Market square',
                des_es: 'Cambia un recurso por otro y envía recursos a tu hermandad.', des_en: 'Trade one resource for another and send resources to your guild.' },
  herreria:   { es: 'Herrería',     en: 'Forge',
                des_es: 'Forja armas más fuertes y mejores armaduras para tus tropas.', des_en: 'Forges stronger weapons and better armor for your troops.' },
  establo:    { es: 'Establo',      en: 'Stable',
                des_es: 'Aquí se entrena la caballería.', des_en: 'Cavalry is trained here.' },
  galeria:    { es: 'Galería de tiro', en: 'Archery range',
                des_es: 'Aquí se entrenan los arqueros.', des_en: 'Archers are trained here.' },
  cantera:    { es: 'Cantera',      en: 'Quarry',
                des_es: 'Corta piedra: para la muralla, las torres y mejoras grandes.', des_en: 'Cuts stone: for the wall, towers and big upgrades.' },
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
  pergamino:    { es: 'Pergamino de habilidad', en: 'Skill scroll', des_es: 'Sirve para subir el nivel de las habilidades de los héroes.', des_en: 'Used to level up hero skills.' },
  libro_peq:    { es: 'Libro de experiencia', en: 'Experience book', des_es: 'Da 300 de experiencia a un héroe. Úsalo en el panel del héroe.', des_en: 'Gives a hero 300 experience. Use it in the hero panel.' },
  libro_gra:    { es: 'Tomo de experiencia', en: 'Experience tome', des_es: 'Da 1500 de experiencia a un héroe. Úsalo en el panel del héroe.', des_en: 'Gives a hero 1500 experience. Use it in the hero panel.' },
  cofre_equipo: { es: 'Cofre de equipo', en: 'Gear chest', des_es: 'Trae una pieza de equipo rara o legendaria para tus héroes.', des_en: 'Holds a rare or legendary gear piece for your heroes.' },
  portal_azar:  { es: 'Portal al azar', en: 'Random portal', des_es: 'Mueve tu reino a un lugar libre al azar del mapa del mundo.', des_en: 'Moves your kingdom to a random free spot on the world map.' },
  portal_elegir: { es: 'Portal elegido', en: 'Chosen portal', des_es: 'Mueve tu reino a la casilla libre que elijas en el mapa del mundo.', des_en: 'Moves your kingdom to the free tile you choose on the world map.' },
  acel_1m:      { es: 'Acelerador 1 min',  en: 'Speed-up 1 min',  des_es: 'Quita 1 minuto a una obra, entrenamiento o investigación.', des_en: 'Takes 1 minute off a building, training or research.' },
  acel_5m:      { es: 'Acelerador 5 min',  en: 'Speed-up 5 min',  des_es: 'Quita 5 minutos a una obra, entrenamiento o investigación.', des_en: 'Takes 5 minutes off a building, training or research.' },
  acel_15m:     { es: 'Acelerador 15 min', en: 'Speed-up 15 min', des_es: 'Quita 15 minutos a una obra, entrenamiento o investigación.', des_en: 'Takes 15 minutes off a building, training or research.' },
  acel_1h:      { es: 'Acelerador 1 hora', en: 'Speed-up 1 hour', des_es: 'Quita 1 hora a una obra, entrenamiento o investigación.', des_en: 'Takes 1 hour off a building, training or research.' },
  acel_8h:      { es: 'Acelerador 8 horas', en: 'Speed-up 8 hours', des_es: 'Quita 8 horas a una obra, entrenamiento o investigación.', des_en: 'Takes 8 hours off a building, training or research.' },
  acel_12h:     { es: 'Acelerador 12 horas', en: 'Speed-up 12 hours', des_es: 'Quita 12 horas a una obra, entrenamiento o investigación.', des_en: 'Takes 12 hours off a building, training or research.' },
  acelerador:   { es: 'Acelerador', en: 'Speed-up', des_es: 'Quita 1 hora a todas las obras y termina el entrenamiento.', des_en: 'Takes 1 hour off all buildings and finishes training.' },
  academia:   { es: 'Academia', en: 'Academy', des_es: 'Centro de investigación: mejora tus tropas, edificios y economía.', des_en: 'Research center: improves your troops, buildings and economy.' },
  inv_obras:     { es: 'Construcción rápida', en: 'Fast building', des_es: 'Las obras tardan {v}% menos.', des_en: 'Buildings take {v}% less time.' },
  inv_cuarteles: { es: 'Cuarteles grandes', en: 'Big barracks', des_es: '+{v} lugares para tropas.', des_en: '+{v} troop spots.' },
  inv_entreno:   { es: 'Entrenamiento rápido', en: 'Fast training', des_es: 'Entrenas {v}% más rápido.', des_en: 'You train {v}% faster.' },
  inv_cosecha:   { es: 'Cosecha', en: 'Harvest', des_es: 'Las Granjas dan {v}% más comida.', des_en: 'Farms give {v}% more food.' },
  inv_lenadores: { es: 'Leñadores', en: 'Lumberjacks', des_es: 'Los Aserraderos dan {v}% más madera.', des_en: 'Sawmills give {v}% more wood.' },
  inv_canteros:  { es: 'Canteros', en: 'Stonecutters', des_es: 'Las Canteras dan {v}% más piedra.', des_en: 'Quarries give {v}% more stone.' },
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
// Campos de recursos: van en las parcelas de fuera de la muralla y guardan lo que producen hasta que los recolectas
var TIPOS_CAMPO = ['granja', 'aserradero', 'mina', 'cantera'];
var HORAS_ALMACEN = 2;
// Parcelas de la ciudad: con el Castillo nivel 1 hay 4; cada nivel del Castillo abre 3 más (37 en el nivel 12)
var PARCELAS_INICIO = 4, PARCELAS_POR_NIVEL = 3; // un campo lleno guarda 2 horas de producción
function esCampo(tipo) { return TIPOS_CAMPO.indexOf(tipo) >= 0; }
// El castillo cobra impuestos: da oro cada cierto tiempo
var IMPUESTO = { oro: 3, cada: 4 };
// Cada tropa come 1 de comida cada tantos segundos. Sin comida pelean más débiles.
var COMIDA_TROPA = { cada: 15, debilidad: 0.7 };

// ---------------- Edificios (valores por nivel 1, 2, 3) ----------------
// costo = oro; madera y piedra = lo que piden además (por nivel 1, 2, 3)
var EDIFICIOS = {
  granja:     { costo: [30, 55, 90],   madera: [30, 60, 100], piedra: [0, 10, 30],   tiempo: [3, 4, 6], produce: [4, 8, 13], recurso: 'comida', cada: 3, icono: '🌾' },
  aserradero: { costo: [30, 55, 90],   madera: [0, 50, 90],   piedra: [0, 15, 35],  tiempo: [3, 4, 6], produce: [3, 6, 10], recurso: 'madera', cada: 4, icono: '🪵' },
  mina:       { costo: [40, 70, 110],  madera: [50, 80, 130], piedra: [0, 10, 30],  tiempo: [4, 5, 7], produce: [3, 6, 10], recurso: 'oro', cada: 5, icono: '🪙' },
  cantera:    { costo: [40, 70, 110],  madera: [50, 80, 130], piedra: [0, 0, 0],    tiempo: [4, 5, 7], produce: [2, 4, 7],  recurso: 'piedra', cada: 5, icono: '🪨' },
  cuartel:    { costo: [50, 80, 130],  madera: [50, 100, 160], piedra: [0, 30, 60],  tiempo: [3, 5, 7], capacidad: [6, 10, 15], rapidez: [1, 1.3, 1.6], icono: '⚔️' },
  torre:      { costo: [50, 90, 140],  madera: [40, 80, 120], piedra: [30, 60, 100], tiempo: [4, 5, 7], dano: [14, 22, 34], alcance: [12, 13, 14.5], ritmo: 0.9, icono: '🏹' },
  // Enfermería: camas = cuántas tropas caídas puede salvar por oleada
  // Academia: centro de investigación. Su nivel deja investigar más alto y más rápido.
  academia:   { costo: [70, 120, 200], madera: [80, 140, 220], piedra: [20, 60, 120], tiempo: [4, 6, 8], rapidez: [1, 1.3, 1.6], tope: [2, 4, 6], icono: '📜' },
  enfermeria: { costo: [60, 100, 160], madera: [60, 110, 160], piedra: [0, 40, 80],  tiempo: [4, 5, 7], capacidad: [4, 8, 14], icono: '💚' },
  // Almacén: protege recursos de los saqueos. Mercado: cambia recursos (tasa = lo que recibes por cada 1 que das).
  almacen:    { costo: [60, 100, 160], madera: [80, 130, 200], piedra: [20, 50, 90], tiempo: [3, 5, 7], protege: [500, 800, 1200], icono: '🏚️' },
  mercado:    { costo: [80, 130, 200], madera: [90, 140, 220], piedra: [30, 60, 110], tiempo: [4, 6, 8], tasa: [0.5, 0.53, 0.56], icono: '⚖️' },
  herreria:   { costo: [70, 120, 190], madera: [60, 110, 170], piedra: [50, 90, 150], tiempo: [4, 6, 8], icono: '⚒️' },
  establo:    { costo: [60, 100, 160], madera: [90, 140, 210], piedra: [10, 40, 80], tiempo: [3, 5, 7], rapidez: [1, 1.3, 1.6], icono: '🐎' },
  galeria:    { costo: [60, 100, 160], madera: [90, 140, 210], piedra: [10, 40, 80], tiempo: [3, 5, 7], rapidez: [1, 1.3, 1.6], icono: '🎯' },
  // Puesto de vigía: avisa de los ataques, muestra la fuerza del enemigo y da defensa extra
  vigia:      { costo: [50, 90, 140], madera: [70, 120, 180], piedra: [10, 30, 60], tiempo: [3, 5, 7], defensa: [0.03, 0.06, 0.09], icono: '👁️' }
};
// Muralla: una sola, alrededor del castillo. Da vida extra al castillo. Nivel 1 de madera, 2 y 3 de piedra.
var MURALLA = { costo: [80, 140, 220], madera: [100, 0, 0], piedra: [0, 150, 260], tiempo: [5, 7, 9], vida: [400, 900, 1500], icono: '🧱' };
// ---------------- NIVELES HASTA EL 12 ----------------
// Los valores de los niveles 1-3 están escritos arriba; del 4 al 12 se calculan solos.
var NIVEL_MAX = 12;
// ---------------- BALANCE (v4.9) ----------------
// Cada nivel cuesta 1,6 veces el anterior y tarda más: minutos al principio, horas al final.
// Con los recursos del inicio solo alcanza para 1 o 2 edificios básicos; lo demás se gana jugando.
var CRECE_COSTO = 1.6;
var TIEMPO_NIVEL = [60, 180, 420, 900, 1800, 3600, 5400, 9000, 14400, 21600, 32400, 43200]; // segundos: 1 min ... 12 h
var BASE_EDIFICIO = {
  //            oro, madera, piedra, tiempo (x TIEMPO_NIVEL)
  granja:     [60, 40, 0, 0.6],   aserradero: [60, 20, 0, 0.6],   mina:      [90, 70, 0, 0.7],   cantera:  [90, 80, 0, 0.7],
  cuartel:    [130, 120, 20, 0.8], torre:     [150, 100, 60, 0.9], vigia:     [140, 160, 40, 0.9], almacen:  [160, 190, 50, 0.9],
  enfermeria: [170, 160, 50, 1.0], establo:   [190, 220, 60, 1.0], galeria:   [190, 220, 60, 1.0], herreria: [210, 170, 120, 1.1],
  academia:   [220, 230, 90, 1.2], mercado:   [240, 250, 90, 1.1]
};
(function balanceEdificios() {
  function r5(v) { return v >= 100 ? Math.round(v / 5) * 5 : Math.round(v); }
  for (var tipo in BASE_EDIFICIO) {
    var b = BASE_EDIFICIO[tipo], d = EDIFICIOS[tipo]; if (!d) continue;
    d.costo = []; d.madera = []; d.piedra = []; d.tiempo = [];
    for (var L = 1; L <= NIVEL_MAX; L++) {
      var k = Math.pow(CRECE_COSTO, L - 1);
      d.costo.push(r5(b[0] * k)); d.madera.push(r5(b[1] * k));
      // los que no piden piedra al principio la piden desde el nivel 2
      d.piedra.push(r5((b[2] || (L > 1 ? b[0] * 0.25 : 0)) * k));
      d.tiempo.push(Math.round(TIEMPO_NIVEL[L - 1] * b[3]));
    }
  }
  MURALLA.costo = []; MURALLA.madera = []; MURALLA.piedra = []; MURALLA.tiempo = [];
  for (var M = 1; M <= NIVEL_MAX; M++) {
    var km = Math.pow(CRECE_COSTO, M - 1);
    MURALLA.costo.push(r5(200 * km)); MURALLA.madera.push(M === 1 ? 250 : 0); MURALLA.piedra.push(M === 1 ? 0 : r5(220 * km));
    MURALLA.tiempo.push(Math.round(TIEMPO_NIVEL[M - 1] * 1.2));
  }
})();
// Trabajos: además de pagar, para subir de nivel hay que haber hecho cosas en el juego.
// El índice es el nivel al que se quiere subir.
var TRABAJOS_CASTILLO = {
  oleadas:     [0, 0, 2, 4, 6, 8, 11, 14, 18, 22, 26, 30, 35],
  recolectas:  [0, 0, 3, 8, 15, 25, 40, 60, 85, 115, 150, 190, 240],
  tropas:      [0, 0, 5, 15, 30, 50, 80, 120, 170, 230, 300, 380, 470],
  campamentos: [0, 0, 0, 0, 0, 1, 2, 3, 5, 7, 9, 12, 15]
};
var TRABAJOS_EDIFICIO = { oleadas: [0, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 26] };
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
    produce: ['x', 1.25], capacidad: ['+', 3], rapidez: ['+', 0.15], dano: ['x', 1.2], alcance: ['+', 0.4, 19], tope: ['=', 6], protege: ['x', 1.35], tasa: ['+', 0.025, 0.8], defensa: ['+', 0.03, 0.36]
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
  // el castillo es lo más caro y lento: de 5 minutos (nivel 2) a 24 horas (nivel 12)
  var TC = [0, 300, 900, 1800, 3600, 7200, 10800, 18000, 28800, 43200, 64800, 86400];
  for (var L = 2; L <= NIVEL_MAX; L++) {
    m.costo.push(r5(300 * Math.pow(1.62, L - 2))); m.madera.push(r5(360 * Math.pow(1.62, L - 2)));
    m.piedra.push(r5(120 * Math.pow(1.65, L - 2))); m.tiempo.push(TC[L - 1]);
  }
  return m;
})();
// Torres de la puerta de la muralla (dañan más con el nivel de la muralla)
var TORRES_PUERTA = { dano: 12, danoNivel: 4, alcance: 14, ritmo: 1.0 };
// Cómo se ve cada nivel: 1-4 normal, 5-8 mejorado, 9-12 dorado
function nivelVisual(n) { return n <= 4 ? 1 : n <= 8 ? 2 : 3; }
// Tramos para el aspecto de los edificios: 1 (nv 1-3), 2 (4-6), 3 (7-9), 4 (10-12)
function tramoNivel(n) { return n <= 3 ? 1 : n <= 6 ? 2 : n <= 9 ? 3 : 4; }
var TRAMO_INTERNO = [1, 1, 2, 2, 3]; // qué versión del modelo base usa cada tramo
var ESCALA_TRAMO = [1, 1, 1.08, 1.15, 1.24]; // cada tramo el edificio es más grande
// La muralla rodea TODO el reino (óvalo con todos los terrenos adentro)
// El reino es más grande: todo se separa del castillo por este número
var ESCALA_REINO = 1.35;
// (v5.0: la muralla es un 20% más grande para que las parcelas tengan caminitos entre ellas)
var MURALLA_FORMA = { cx: -4 * ESCALA_REINO, cz: -1 * ESCALA_REINO, rx: 30 * ESCALA_REINO * 1.2, rz: 29 * ESCALA_REINO * 1.2 };

// Barricada: se pone en los puntos marcados del camino. Los enemigos se paran a romperla.
// Nivel 1 de madera, nivel 2 de piedra. Se arregla sola al terminar cada oleada.
var BARRICADA = { costo: [40, 120], madera: [80, 0], piedra: [0, 150], vida: [350, 900], tiempo: [60, 300], icono: '🚧' };
// Campamentos de trasgos en el mapa del mundo (son del juego, no son jugadores)
var CAMPAMENTOS = [
  { x: 12, y: 18, nivel: 3 }, { x: 80, y: 14, nivel: 6 }, { x: 47, y: 52, nivel: 9 },
  { x: 20, y: 78, nivel: 5 }, { x: 74, y: 70, nivel: 12 }, { x: 55, y: 88, nivel: 7 }
];
// Cofre diario: 7 días de racha (al día 8 vuelve a empezar el ciclo pero la racha sigue contando)
var COFRE_DIARIO = [
  { oro: 150, comida: 100 }, { madera: 150, piedra: 60, objeto: 'libro_peq' }, { gemas: 5, objeto: 'cofre_madera' },
  { oro: 250, comida: 200 }, { tropas: { espadachin: 2 } }, { gemas: 10, piedra: 120, objeto: 'libro_gra' }, { gemas: 20, objeto: 'cofre_oro' }
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
  // aceleradores con tiempo: se usan en una obra, un entrenamiento o una investigación concreta
  portal_azar:  { icono: '🌀', portal: 'azar' },
  cofre_equipo: { icono: '🧰', equipo: true },
  portal_elegir: { icono: '✨', portal: 'elegir' },
  acel_1m:      { icono: '⏱️', segundos: 60 },
  acel_5m:      { icono: '⏱️', segundos: 300 },
  acel_15m:     { icono: '⏱️', segundos: 900 },
  acel_1h:      { icono: '⌛', segundos: 3600 },
  acel_8h:      { icono: '⌛', segundos: 28800 },
  acel_12h:     { icono: '⌛', segundos: 43200 },
  escudo_2h:    { icono: '🛡️', escudo: 2 },
  escudo_8h:    { icono: '🛡️', escudo: 8 },
  escudo_12h:   { icono: '🛡️', escudo: 12 },
  libro_peq:    { icono: '📘', exp: 300 },
  pergamino:    { icono: '📜', exp: 0, pergamino: true },
  libro_gra:    { icono: '📗', exp: 1500 }
};
// Tienda: se paga con gemas (las compras con dinero real llegarán con la App Store)
var TIENDA = [
  { id: 'bolsa_oro', gemas: 5 }, { id: 'saco_comida', gemas: 4 }, { id: 'saco_madera', gemas: 4 }, { id: 'saco_piedra', gemas: 5 },
  { id: 'acel_1m', gemas: 1 }, { id: 'acel_5m', gemas: 1 }, { id: 'acel_15m', gemas: 2 }, { id: 'acel_1h', gemas: 5 }, { id: 'acel_8h', gemas: 36 }, { id: 'acel_12h', gemas: 50 },
  { id: 'acelerador', gemas: 3 }, { id: 'cofre_equipo', gemas: 30 }, { id: 'portal_azar', gemas: 20 }, { id: 'portal_elegir', gemas: 60 }, { id: 'cofre_plata', gemas: 15 }, { id: 'cofre_oro', gemas: 40 },
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
// Rama "Tropas": Ataque, Vida, Defensa y Velocidad para cada tipo de tropa (v5.1)
var STATS_TROPA = [['ataque', '⚔️', 0.05], ['vida', '❤️', 0.05], ['defensa', '🛡️', 0.03], ['velocidad', '👟', 0.03]];
var NOMBRE_STAT = { ataque: ['Ataque', 'Attack', 'de ataque', 'attack'], vida: ['Vida', 'Health', 'de vida', 'health'], defensa: ['Defensa', 'Defense', 'de defensa (reciben menos daño)', 'defense (take less damage)'], velocidad: ['Velocidad', 'Speed', 'de velocidad', 'speed'] };
INVESTIGACION.tropas = [];
['espadachin', 'arquero', 'guardian', 'caballeria'].forEach(function (tp) {
  STATS_TROPA.forEach(function (s) {
    var id = 't_' + tp + '_' + s[0];
    INVESTIGACION.tropas.push({ id: id, icono: s[1], max: 6, cada: s[2], tropa: tp, stat: s[0] });
    NOMBRES['inv_' + id] = {
      es: NOMBRE_STAT[s[0]][0], en: NOMBRE_STAT[s[0]][1],
      des_es: '+{v}% ' + NOMBRE_STAT[s[0]][2] + ' para ' + NOMBRES[tp].es, des_en: '+{v}% ' + NOMBRE_STAT[s[0]][3] + ' for ' + NOMBRES[tp].en
    };
  });
});
// Costo y tiempo del nivel L (1, 2, 3...): investigar toma tiempo de verdad
function costoInvestigacion(L) { return { oro: 120 * L + 60 * L * L, madera: 100 * L + 45 * L * L, piedra: L >= 2 ? 40 * L * L : 0 }; }
var TIEMPO_INV = [0, 120, 420, 1200, 3600, 10800, 28800];
function tiempoInvestigacion(L) { return TIEMPO_INV[Math.min(L, TIEMPO_INV.length - 1)]; }
// Poder que da cada nivel investigado y cada nivel de una pieza de equipo
var PODER_INVEST = 250, PODER_PIEZA = 60;
var PUNTOS_BARRICADA = [0.40, 0.53, 0.66, 0.79]; // en qué parte del camino (0 = bosque, 1 = castillo)

// El castillo también dispara (para que la primera oleada sea posible)
var CASTILLO = { dano: 12, alcance: 9.5, ritmo: 1.1 };

// ---------------- Tropas ----------------
var TROPAS = {
  espadachin: { costo: 25, comida: 30, tiempo: 30, vida: 150, dano: 18, alcance: 1.3, vel: 3.2, ritmo: 0.9, icono: '🗡️' },
  arquero:    { costo: 35, comida: 30, tiempo: 40, vida: 85,  dano: 12, alcance: 7.5, vel: 3.0, ritmo: 1.1, distancia: true, icono: '🏹' },
  caballeria: { costo: 60, comida: 50, tiempo: 60, vida: 200, dano: 20, alcance: 1.6, vel: 5.2, ritmo: 1.0, icono: '🐎' },
  guardian:   { costo: 55, comida: 60, tiempo: 75, vida: 390, dano: 11, alcance: 1.4, vel: 2.4, ritmo: 1.2, icono: '🛡️' },
  heroe:      { costo: 0,  tiempo: 0, vida: 950, dano: 42, alcance: 1.7, vel: 3.4, ritmo: 0.8, cura: 10, icono: '👑' }
};
var INVOCAR = { tres: 10, heroe: 30 }; // precio en gemas
// Armaduras: cada nivel (hasta 3) da +20% de vida y +10% de defensa (recibe menos daño)
// La armadura se puede mejorar con oro y piedra, o comprar al momento con gemas (precio de cada nivel)
var ARMADURA = { costo: [200, 500, 1200], piedra: [80, 220, 500], gemas: [20, 40, 80], vida: 0.2, defensa: 0.1, max: 3 };

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
// (v4.9: los tiempos ahora salen de TIEMPO_NIVEL y BASE_EDIFICIO, arriba; el castillo va de 5 min a 24 h)
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
