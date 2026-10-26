// =====================================================================
//  DATOS DEL JUEGO: nombre, textos (español / inglés), precios y fuerzas.
//  Para cambiar el nombre del juego, cambia NOMBRE_JUEGO.
// =====================================================================

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
    c_granja: 'Toca CONSTRUIR y pon una Granja: te da monedas.',
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
    tropas_vivas: 'Tropas en el campo: {a}/{b}',
    invocar3: 'Invocar 3 tropas al azar', invocar3_txt: 'Aparecen al momento, sin esperar.',
    heroe_txt: 'Héroe muy fuerte que se cura solo. Solo uno a la vez.',
    heroe_vivo: 'Tu héroe ya está en el campo.',
    sonido: 'Sonido', idioma: 'Idioma', velocidad: 'Velocidad',
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
    camas: 'Camas', a_enfermeria: '💚 A la enfermería', curados: '💚 Se curaron {n} tropas', en_enfermeria: 'En la enfermería: {n} (vuelven al terminar la oleada)',
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
    borrar_cuenta_ok: 'Borrar para siempre', cuenta_borrada: 'Tu cuenta fue borrada.', privacidad: 'Privacidad',
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
    c_granja: 'Tap BUILD and place a Farm: it gives you coins.',
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
    tropas_vivas: 'Troops on the field: {a}/{b}',
    invocar3: 'Summon 3 random troops', invocar3_txt: 'They appear right away, no waiting.',
    heroe_txt: 'A very strong hero who heals over time. Only one at a time.',
    heroe_vivo: 'Your hero is already on the field.',
    sonido: 'Sound', idioma: 'Language', velocidad: 'Speed',
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
    camas: 'Beds', a_enfermeria: '💚 To the infirmary', curados: '💚 {n} troops healed', en_enfermeria: 'In the infirmary: {n} (back when the wave ends)',
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
    borrar_cuenta_ok: 'Delete forever', cuenta_borrada: 'Your account was deleted.', privacidad: 'Privacy',
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
                des_es: 'Cultiva trigo y te da monedas.', des_en: 'Grows wheat and gives you coins.' },
  cuartel:    { es: 'Cuartel',      en: 'Barracks',
                des_es: 'Permite entrenar caballeros.', des_en: 'Lets you train knights.' },
  torre:      { es: 'Torre',        en: 'Tower',
                des_es: 'Dispara flechas a los enemigos.', des_en: 'Shoots arrows at enemies.' },
  enfermeria: { es: 'Enfermería',   en: 'Infirmary',
                des_es: 'Las tropas que caen se curan aquí y vuelven al terminar la oleada.', des_en: 'Fallen troops heal here and come back when the wave ends.' },
  muralla:    { es: 'Muralla',      en: 'Wall',
                des_es: 'Rodea el castillo y le da más vida.', des_en: 'Surrounds the castle and gives it more health.' },
  espadachin: { es: 'Espadachín',   en: 'Swordsman',
                des_es: 'Rápido y valiente. Pelea cuerpo a cuerpo.', des_en: 'Fast and brave. Fights up close.' },
  arquero:    { es: 'Arquero',      en: 'Archer',
                des_es: 'Dispara desde lejos. Poca vida.', des_en: 'Shoots from afar. Low health.' },
  guardian:   { es: 'Guardián',     en: 'Guardian',
                des_es: 'Escudo enorme. Aguanta muchos golpes.', des_en: 'Huge shield. Takes lots of hits.' },
  heroe:      { es: 'Héroe Paladín', en: 'Paladin Hero' },
  trasgo:     { es: 'Trasgo',       en: 'Goblin' },
  bruto:      { es: 'Bruto',        en: 'Brute' },
  ogro:       { es: 'Ogro Jefe',    en: 'Ogre Boss' }
};

// ---------------- Recursos iniciales ----------------
var INICIO = { monedas: 200, gemas: 20, vidaCastillo: 1200 };

// ---------------- Edificios (valores por nivel 1, 2, 3) ----------------
var EDIFICIOS = {
  granja:  { costo: [50, 90, 160],  tiempo: [3, 4, 6], produce: [3, 6, 10], cada: 3, icono: '🌾' },
  cuartel: { costo: [70, 120, 200], tiempo: [3, 5, 7], capacidad: [6, 10, 15], rapidez: [1, 1.3, 1.6], icono: '⚔️' },
  torre:   { costo: [80, 140, 220], tiempo: [4, 5, 7], dano: [14, 22, 34], alcance: [10, 11, 12.5], ritmo: 0.9, icono: '🏹' },
  // Enfermería: camas = cuántas tropas caídas puede salvar por oleada
  enfermeria: { costo: [90, 150, 240], tiempo: [4, 5, 7], capacidad: [4, 8, 14], icono: '💚' }
};
// Muralla: una sola, alrededor del castillo. Da vida extra al castillo.
var MURALLA = { costo: [120, 220, 360], tiempo: [5, 7, 9], vida: [400, 900, 1500], icono: '🧱' };

// El castillo también dispara (para que la primera oleada sea posible)
var CASTILLO = { dano: 12, alcance: 9.5, ritmo: 1.1 };

// ---------------- Tropas ----------------
var TROPAS = {
  espadachin: { costo: 25, tiempo: 3, vida: 150, dano: 18, alcance: 1.3, vel: 3.2, ritmo: 0.9, icono: '🗡️' },
  arquero:    { costo: 35, tiempo: 4, vida: 85,  dano: 12, alcance: 7.5, vel: 3.0, ritmo: 1.1, distancia: true, icono: '🏹' },
  guardian:   { costo: 55, tiempo: 6, vida: 390, dano: 11, alcance: 1.4, vel: 2.4, ritmo: 1.2, icono: '🛡️' },
  heroe:      { costo: 0,  tiempo: 0, vida: 950, dano: 42, alcance: 1.7, vel: 3.4, ritmo: 0.8, cura: 10, icono: '👑' }
};
var INVOCAR = { tres: 10, heroe: 30 }; // precio en gemas

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
];
// Punto donde esperan las tropas
var PUNTO_REUNION = [-12.5, 2.5];
