// AVISO PARA QUIEN SUBA CAMBIOS (personas o IA): lee CLAUDE.md en la raíz del repositorio. Puedes AÑADIR, pero no borres ni cambies lo que hicieron otros; trabaja solo en tu parte (p. ej. la Campaña).
// =====================================================================
//  DATOS DEL JUEGO: nombre, textos (español / inglés), precios y fuerzas.
//  Para cambiar el nombre del juego, cambia NOMBRE_JUEGO.
// =====================================================================

var VERSION_JUEGO = '9.70';
/* v8.70: NOTAS DE CADA VERSIÓN. Cada versión nueva manda UN correo solo con su nota (las más nuevas arriba).
   Al publicar una versión, agrega aquí su línea: [versión, fecha, texto en español, texto en inglés]. */
var NOVEDADES_VER = [["9.70","2026-11-26","Arreglado: al volver del Mundo a la villa, la marcha ya no se queda congelada en la barra.","Fixed: when returning from the World to the village, the march no longer freezes in the bar."],["9.69","2026-11-26","Calendario de premios con la fecha: cada día del mes tiene su premio y, si faltas un día, ese premio se pierde.","Rewards calendar by date: each day of the month has its reward, and if you miss a day that reward is lost."],["9.68","2026-11-26","Arreglado: a los socios fundadores les sale Compensación en el menú en cuanto lo abren.","Fixed: founding partners see Compensation in the menu as soon as they open it."],["9.67","2026-11-26","Herrería › Mejoras de tropas: cada tropa muestra su nivel de armadura y armas y sus botones para mejorar.","Blacksmith › Troop upgrades: each troop shows its armor and weapon level and its upgrade buttons."],["9.66","2026-11-25","Compensación: el cuadro de Socios fundadores sale arriba del todo.","Compensation: the Founding partners box is now at the top."],["9.65","2026-11-25","Arreglado: la protección contra espías del equipo del juego se revisa al momento de espiar.","Fixed: the game team spy protection is checked at the moment of spying."],["9.64","2026-11-25","Las cuentas del equipo del juego no se pueden espiar.","Game team accounts cannot be spied on."],["9.63","2026-11-25","Nuevo cargo: 👑 Socio fundador. Sale junto a su nombre en el chat y en su perfil.","New title: 👑 Founding partner. It shows next to their name in chat and profile."],["9.62","2026-11-25","Menú ▲ más ordenado: 4 botones por fila, más juntos, nada cortado y el número de avisos encima de su botón.","Tidier ▲ menu: 4 buttons per row, closer together, nothing cut off and the notice number on top of its button."],["9.61","2026-11-25","Los edificios que solo tienen Detalles (Establo, Galería de tiro, Granja…) abren su ventana directa, sin pestaña.","Buildings with only Details (Stable, Archery range, Farm…) open their window directly, without a tab."],["9.60","2026-11-25","Establo y Galería de tiro: solo Detalles; sirven para desbloquear en el Cuartel las unidades a caballo y de tiro más avanzadas.","Stable and Archery range: Details only; they unlock the advanced mounted and ranged units in the Barracks."],["9.59","2026-11-25","Las tropas ahora están en el Cuartel (para entrenar) y en el Punto de reunión (para marchar y destacar). El botón de abajo pasa a ser Héroes, y en el menú ▲ hay accesos al Cuartel y al Punto de reunión.","Troops now live in the Barracks (to train) and the Rally point (to march and station). The bottom button is now Heroes, and the ▲ menu has shortcuts to the Barracks and Rally point."],["9.58","2026-11-25","Cuartel: Unidades básicas (1 y 2 estrellas) y Unidades avanzadas (3 y 4 estrellas), ordenadas por estrellas y con las carretas en su categoría.","Barracks: Basic units (1-2 stars) and Advanced units (3-4 stars), sorted by stars and with wagons in their category."],["9.57","2026-11-25","Menús ordenados: el menú ▲ ya no repite lo de abajo, Inventario y Tienda › Mis objetos son lo mismo, y Equipo abre la Herrería con todas tus piezas.","Tidier menus: the ▲ menu no longer repeats the bottom bar, Inventory and Shop › My items are the same, and Gear opens the Blacksmith with all your pieces."],["9.56","2026-11-25","Herrería › Equipo: cada pieza tiene su botón grande «Mejorar a Nv X» con lo que cuesta y su % de éxito.","Blacksmith › Gear: each piece has a big «Upgrade to Lv X» button with its cost and success chance."],["9.55","2026-11-25","Tropas: una sola lista con todas tus tropas (sin pestañas repetidas). Herrería: nueva pestaña Equipo con todas tus armas y armaduras por tipo, con su forja.","Troops: a single list with all your troops (no repeated tabs). Blacksmith: new Gear tab with all your weapons and armor by type, with forging."],["9.54","2026-11-25","Tienda › Acelerar en orden: primero los aceleradores de menor a mayor y luego los Arcanos.","Shop › Speed up in order: speed-ups from cheapest to most expensive, then the Arcane ones."],["9.53","2026-11-25","Tus fichas de Azar y de Ruleta ahora salen en el inventario (Varios), con un botón para usarlas.","Your Lucky and Wheel tokens now show in your inventory (Misc.), with a button to use them."],["9.52","2026-11-25","Arreglado: después de abrir la Ruleta, la Tienda y otras ventanas ya no cambian de forma.","Fixed: after opening the Wheel, the Shop and other windows no longer change their layout."],["9.51","2026-11-25","Azar y Ruleta: se ven las fichas que compraste y bajan al usarlas.","Lucky and Wheel: the tokens you bought are shown and go down when you use them."],["9.50","2026-11-25","Azar: ahora se ven bien grandes las fichas que tienes y puedes comprar 1 o 10 fichas con gemas ahí mismo.","Lucky: your tokens are now shown in big and you can buy 1 or 10 tokens with gems right there."],["9.49","2026-11-25","Azar: nuevos botones Abrir 1 (1 ficha) y Abrir 10 (10 fichas) con la ventana de premios. Tienda: los cofres van de menor a mayor precio y los cofres de fichas están en Varios. Los cofres que ganas se guardan en Cofres.","Lucky: new Open 1 (1 token) and Open 10 (10 tokens) buttons with a prize window. Shop: chests sorted from cheapest to most expensive and token chests moved to Misc. Chests you win are kept under Chests."],["9.48","2026-11-25","Cofres de fichas: al comprarlos ahora ves qué traen, cuántas fichas tienes y la ventana con las fichas que recibiste.","Token chests: when you buy them you now see what is inside, how many tokens you have and a window with the tokens you got."],["9.47","2026-11-25","Tienda de gemas ajustada: los paquetes dan menos gemas para que el juego sea justo para todos.","Gem shop adjusted: packs give fewer gems so the game stays fair for everyone."],["9.46","2026-11-25","Nueva Forja: las piezas de armadura suben hasta Nv 15 con probabilidad de éxito (Polvo de Forja, Carmot y Piedra de Templado); si falla, ganas Bendición de Herrero. Nuevo botón para fundir piezas Nv 1 repetidas.","New Forge: armor pieces go up to Lv 15 with a success chance (Forge Dust, Carmot and Tempering Stone); failures grant Blacksmith Blessing. New button to smelt duplicate Lv 1 pieces."],
  ["9.45","2026-11-25","Maestría de héroes: el botón gasta las Estrellas de Mar y Caracolas, se bloquea si falta nivel o materiales (también al dueño), y cada rango suma +35 de ataque y +350 de salud.","Hero Mastery: spends Starfish and Conches, locks when level or materials are missing, and each rank adds +35 attack and +350 health."],
  ["9.44","2026-11-25","Campaña: siempre se puede ganar. Cada vez que pierdes una etapa, sus enemigos salen un 15 % más débiles (hasta la mitad), y los jefes son un 20 % más flojos.","Campaign: always winnable. Each loss on a stage makes its enemies 15% weaker (down to half), and bosses are 20% softer."],
  ["9.43","2026-11-25","Campaña: tus héroes van delante y las tropas detrás como refuerzo, y nadie se sale de la imagen.","Campaign: your heroes lead, troops stay behind as reinforcements, and nobody leaves the screen."],
  ["9.42","2026-11-25","El juego gasta menos memoria y va más ligero: la ciudad no se dibuja detrás del Mundo, se libera memoria al salir del Mundo y de la Campaña, nunca corren dos motores a la vez y los teléfonos dibujan a 1,5×. Nuevo en Ajustes: «Limpiar caché y recargar».","The game uses less memory: the city is not drawn behind the World, memory is freed when leaving the World and the Campaign, no duplicated loops, and phones render at 1.5x. New in Settings: Clear cache and reload."],
  ["9.41","2026-11-25","Campaña: todos avanzan en línea recta por el camino, mirando al enemigo, en filas estrechas que nunca pisan los bordes; los letreros de habilidades son más pequeños, rápidos y no se enciman.","Campaign: units advance straight along the road facing the enemy in narrow rows that never leave it; ability labels are smaller, quicker and never overlap."],
  ["9.40","2026-11-25","El castillo queda centrado en su plataforma, con la puerta frente al puente, y la villa se abre con el castillo ya puesto (sin plataforma vacía).","The castle is centered on its platform facing the bridge, and the village opens with the castle already in place."],
  ["9.39","2026-11-25","Campaña: camino más ancho con 3 carriles; cada grupo va por su carril, los que sobran se ponen detrás y nadie pisa el césped.","Campaign: wider road with 3 lanes; each group keeps its lane, extras line up behind, and nobody steps on the grass."],
  ["9.38","2026-11-25","Campaña: los muñecos pelean con más espacio, sin amontonarse.","Campaign: figures fight with more space, without piling up."],
  ["9.37","2026-11-25","Campaña: los muñecos caminan rectos, tus héroes de espaldas hacia el frente y los enemigos de frente hacia ellos.","Campaign: figures walk straight: your heroes from behind, enemies facing them."],
  ["9.36","2026-11-25","Campaña: los dos grupos se miran (tus héroes de espaldas, caminando hacia los enemigos) y todos pisan el suelo, sin flotar.","Campaign: both sides face each other (your heroes walk toward the enemy) and everyone stands on the ground."],
  ["9.35","2026-11-25","Campaña: «Rápido» elige tus 5 mejores héroes y las tropas; escuadrones de soldaditos detrás de los héroes con lluvia de flechas; ondas doradas en las habilidades y temblor al golpear jefes. Bajas justas: solo cae lo que te hicieron de daño (todo si pierdes), y el 70 % va herido a la Enfermería. Máximo de tropas: 50 por tipo y capítulo.","Campaign: Quick picks your 5 best heroes and troops; soldier squads with arrow volleys; golden waves and boss hit shake. Fair losses: only the damage taken (all if you lose), 70% go wounded to the Infirmary. Troop limit: 50 per type and chapter."],
  ["9.34","2026-11-25","Campaña: los muñecos caminan pisando bien (el paso va al ritmo de lo que avanzan) y más suave.","Campaign: figures walk with proper footing and smoother steps."],
  ["9.33","2026-11-25","Campaña: los héroes y los enemigos se ven de frente, con la cara a la vista.","Campaign: heroes and enemies are shown facing forward."],
  ["9.32","2026-11-25","Campaña: tus héroes pelean de frente, el lobo y los demás se ven enteros, y ningún muñeco se sale de la pantalla.","Campaign: your heroes fight facing forward, the wolf and others are shown whole, and no figure goes off screen."],
  ["9.31","2026-11-25","Campaña: tus héroes también salen como muñecos 3D (Sir Sol, Luna, Capitán Ancla, Brisa, Chispa, Roble, Trueno y Pluma) y atacan con su movimiento. Arreglado un error al entrar mientras cargaba el castillo.","Campaign: your heroes are 3D figures too and attack with their own move. Fixed an error while the castle was loading."],
  ["9.30","2026-11-25","Campaña: los enemigos son ahora muñecos 3D que caminan, y la batalla ya no se queda parada si algo falla al dibujar. Al entrar ya no se ve el castillo viejo antes del nuevo.","Campaign: enemies are now walking 3D figures, and the battle no longer freezes if drawing fails. The old castle no longer flashes before the new one when you enter."],
  ["9.29","2026-11-25","Las marchas vuelven a esconderse solas a los 5 segundos, y también al tocar el mapa.","Marches hide by themselves again after 5 seconds, and when you tap the map."],
  ["9.28","2026-11-26","Barra de abajo más clara en el móvil: cada nombre cabe en su botón. Luciérnagas en las noches despejadas de tu ciudad. La calidad automática acierta mejor al volver al juego.","Clearer bottom bar on phones: every label fits its button. Fireflies on clear nights in your city. Automatic quality is more accurate when you return to the game."],["9.19","2026-11-25","Nuevo en Ajustes: Clima, con lluvia o nieve en tu ciudad (viene apagado). Si el juego va lento en tu móvil, la calidad baja sola; si la eliges tú, se respeta. Caballería con marchas reales en la biblioteca de prueba.","New in Settings: Weather, with rain or snow in your city (off by default). If the game runs slowly on your phone, quality lowers by itself; if you choose it yourself, it is kept. Cavalry with real gaits in the test library."],["9.18","2026-11-25","Biblioteca 3D de prueba: 54 modelos nuevos (ejército, héroes, aldeanos, caballería, edificios y naturaleza) con sus animaciones, para usarlos más adelante en el juego. Todavía no cambian nada de lo que ves al jugar.","3D test library: 54 new models (army, heroes, villagers, cavalry, buildings and nature) with animations, to be used in the game later. Nothing you see while playing changes yet."],["9.17","2026-11-25","Preparado el esqueleto humano para los futuros personajes de la Campaña, con animaciones de caminar, correr y atacar (todavía no se ve en el juego).","Human skeleton ready for future Campaign characters, with walk, run and attack animations (not in the game yet)."],["9.16","2026-11-25","Calendario de premios: toca cualquier día para ver qué premio es, para qué sirve y cuántos días te faltan para conseguirlo.","Log-in calendar: tap any day to see its reward, what it does and how many days are left to get it."],["9.15","2026-11-25","Ataques: los informes llegan siempre (el resultado se guarda bien en la nube) y las marchas muy lejanas tardan como mucho 14:40.","Attacks: reports always arrive (the result is saved correctly in the cloud) and very far marches take at most 14:40."],
  ["9.14","2026-11-25","Nueva banda sonora de guerra con orquesta: Preparación en el Mapa Mundial y la Campaña, Marcha cuando tus tropas van en camino, Batalla, Asedio en las oleadas, Situación crítica con poca vida, y melodías de Victoria y Derrota. Cambia de una a otra con fundidos suaves. Nuevo control de volumen de efectos en Ajustes.","New orchestral war soundtrack: Preparation on the World Map and Campaign, March while your troops travel, Battle, Siege during waves, Critical when health is low, plus Victory and Defeat themes, with smooth crossfades. New sound-effects volume control in Settings."],["9.13","2026-11-25","Cada edificio de la ciudad tiene ahora su propio color de tejado y de piedra: Academia azul, Almacén marrón, Cabaña terracota, Embajada púrpura, Enfermería verde, Establo granate, Galería de Tiro pizarra y Mercado dorado.","Each city building now has its own roof and stone colour: blue Academy, brown Warehouse, terracotta Cottage, purple Embassy, green Infirmary, crimson Stable, slate Shooting Gallery and golden Market."],["9.12","2026-11-25","Nuevo calendario de premios del mes («Conectarse», a la izquierda de la ciudad): cada día que entras se ilumina un premio más. El día 15 trae 80 botellas de campaña.","New monthly log-in calendar («Log-in», left side of the city): each day you play lights up one more reward. Day 15 gives 80 campaign flasks."],["9.11","2026-11-25","Tienda: elige cuántos objetos compras con gemas (con total y gemas que te quedan). Inventario: usa varios de golpe también la energía de héroe, el megáfono, la cosecha y las tropas. Calles de adoquines más realistas. Con dos dedos puedes mover el mapa mientras acercas o giras. El panel de abajo empieza recogido y los botones laterales ocupan menos.","Shop: choose how many items to buy with gems. Inventory: use several at once for more items. More realistic cobblestone streets. Two-finger pan while zooming or rotating. Bottom panel starts collapsed and side buttons take less space."],
  ["9.10","2026-11-25","Perfil del jugador desde el chat: ahora tiene ✕ arriba, y al tocar fuera se cierra solo la tarjeta y sigues en el chat.","Player profile from the chat now has a ✕, and tapping outside closes only the card so you stay in the chat."],
  ["8.99","2026-11-25","Marcha: ahora ves cuántas tropas tienes y cuántas mandas. El cofre diario se cierra con la ✕. «Jugar sin cuenta» entra con un toque. Ajustes más limpio y el botón Actualizar ya no tapa nada.","March shows the troops you have and the ones you send. The daily chest closes with ✕. Play without account works with one tap. Cleaner Settings."],
  ["8.98","2026-11-25","Pantalla de entrar nueva: la portada de Brother Kingdom de fondo, el escudo del sol y botones más claros. También puedes ver la contraseña con el ojo.","New sign-in screen with the Brother Kingdom cover, the sun shield and clearer buttons. You can also show your password with the eye."],
  ["8.97","2026-11-25","Cada edificio tiene ya su color de techo para encontrarlo rápido: Cuartel rojo, Enfermería verde, Almacén carmelita, Establo amarillo, Galería morada, Herrería gris, Academia azul, Embajada turquesa, Mercado rosado, Cabaña naranja y Relevo blanco.","Every building now has its own roof color so you can find it fast."],
  ["8.96","2026-11-25","La página web del juego ahora tiene fotos, cómo se juega y las novedades.","The game's website now has screenshots, how to play and the latest news."],
  ["8.95","2026-11-25","El castillo ya no se sale de su plaza: queda lo más grande posible dentro del foso.","The castle no longer spills out of its plaza: it stays as big as fits inside the moat."],
  ["8.94","2026-11-24","Brother Kingdom estrena su página web en brotherkingdom.com.","Brother Kingdom has its own website at brotherkingdom.com."],
  ["8.93","2026-11-24","La portada nueva sale también en la segunda pantalla de carga.","The new cover also shows on the second loading screen."],
  ["8.92","2026-11-24","Portada nueva con el nombre Brother Kingdom.","New cover with the Brother Kingdom name."],
  ["8.91","2026-11-24","El nombre del juego queda Brother Kingdom.","The game's name is now Brother Kingdom."],
  ["8.90","2026-11-24","El juego ahora se llama Brother Kingdom. Tu reino, tus tropas y todo lo tuyo siguen igual.","The game is now called Brother Kingdom. Your kingdom, troops and everything you own stay the same."],
  ["8.89","2026-11-24","El castillo es más grande y llena su plaza.","The castle is bigger and fills its square."],
  ["8.88","2026-11-24","Torre del homenaje › Promociones: el número son las que ya puedes aceptar, cada pestaña dice las suyas y se ven todas las pestañas.","Keep › Promotions: the number is what you can accept now, each tab shows its own and all tabs are visible."],
  ["8.87","2026-11-24","Cuarteles, Cabañas y Enfermerías: todas las que quieras. Los demás edificios, uno por villa.","Barracks, Huts and Infirmaries: as many as you want. Other buildings: one per village."],
  ["8.86","2026-11-24","Techos: todos azules, menos el Cuartel (rojo), la Enfermería (verde) y el Almacén (carmelita).","Roofs: all blue except Barracks (red), Infirmary (green) and Storehouse (brown)."],
  ["8.85","2026-11-24","Se pueden construir hasta 5 Enfermerías por villa para tener más camas.","You can build up to 5 Infirmaries per village for more beds."],
  ["8.84","2026-11-24","Cada edificio tiene su propio color de techo para reconocerlo de un vistazo.","Each building has its own roof color so you can spot it at a glance."],
  ["8.83","2026-11-24","Enfermería: muchas más camas; los heridos se quedan hasta que tú los cures y al curarlos sube tu poder (cuenta en el Torneo de Poder).","Infirmary: many more beds; wounded stay until you heal them, and healing raises your power (counts in the Power Tournament)."],
  ["8.82","2026-11-24","Fortaleza › Explorar da premios que se notan (recursos según tu castillo, aceleradores, libros, cofres) y los enseña en una ventana.","Fortress › Explore gives real rewards (resources by castle level, speed-ups, books, chests) and shows them."],
  ["8.81","2026-11-24","En el Mundo también sale la barra de marchas con Acelerar cuando van caravanas entre villas.","On the World map the march bar with Speed up also shows while caravans travel."],
  ["8.80","2026-11-24","Las caravanas entre villas se pueden acelerar, de ida y de vuelta.","Caravans between villages can be sped up, going and returning."],
  ["8.79","2026-11-24","Alianzas: la lista se ordena por el poder total de los miembros y ya no cuenta a los expulsados.","Alliances: the list is sorted by members total power and no longer counts removed players."],
  ["8.78","2026-11-24","Acelerar marcha muestra todos los aceleradores, desde el de 1 minuto, para usar o comprar.","Speed up march shows all speed-ups, from 1 minute, to use or buy."],
  ["8.77","2026-11-24","Mis tropas también muestra tus carretas (Ligeras, de Suministro y Reales).","My troops also shows your carts (Light, Supply and Royal)."],
  ["8.76","2026-11-24","El que expulsan de una alianza ya no sale como miembro ni como aliado.","A player removed from an alliance no longer shows as member or ally."],
  ["8.75","2026-11-24","Castillo › Detalles más ordenado en el teléfono.","Castle › Details tidier on phones."],
  ["8.74","2026-11-24","Castillo › Defensa: la lista de defensores cuenta todas tus tropas de casa, igual que la batalla.","Castle › Defense: the defenders list counts all your troops at home, same as the battle."],
  ["8.73","2026-11-24","Tienda más llena: paquetes de tropas, libros de héroe, amatista, cofres de equipo y de madera.","Fuller Shop: troop packs, hero books, amethyst, gear and wooden chests."],
  ["8.72","2026-11-24","Inventario: carretas, VIP, fichas, amatista y potenciadores se pueden usar de uno en uno o todos.","Inventory: wagons, VIP, tokens, amethyst and boosts can be used one at a time or all."],
  ["8.71","2026-11-24","Inventario › Recursos: aviso de que eso ya es tuyo (no hay que cobrarlo) y nombres con mayúscula.","Inventory › Resources: note that it is already yours (nothing to collect) and capitalized names."],
  ["8.70","2026-11-24","Cada actualización manda su propio correo, solo con lo nuevo de esa versión.","Each update sends its own mail with only what is new in that version."],
  ["8.69","2026-11-24","Ventana «Recibiste»: las fotos caben en su casilla y el botón Recoger siempre se ve.","«You got» window: pictures fit their box and the Collect button is always visible."],
  ["8.68","2026-11-24","Las carretas van en la lista de tropas de la Marcha, al final, como una tropa más.","Carts are in the March troop list, at the end, like any troop."],
  ["8.67","2026-11-24","Campaña: botón Salir y la ✕ ya no queda tapada.","Campaign: Exit button and the ✕ is no longer hidden."],
  ["8.66","2026-11-24","El botín lo cargan las carretas: solo te llevas lo que quepa en las que mandes.","Carts carry the loot: you only take what fits in the carts you send."],
  ["8.65","2026-11-24","Botín todo o nada: si dejas al rival sin tropas te llevas todo; si no, nada. Enviar Recursos con 10M, 20M y 30M en la barra.","All-or-nothing loot: wipe the rival and take everything; otherwise nothing. Send Resources with 10M, 20M, 30M on the bar."],
  ["8.64","2026-11-24","Enviar Recursos: la cantidad se puede escribir a mano.","Send Resources: type the amount by hand."],
  ["8.63","2026-11-24","El héroe manda en la batalla: un héroe fuerte contra una villa sin caballero la deja en cero.","The hero rules the battle: a strong hero against a village without a knight wipes it out."],
  ["8.62","2026-11-24","El ataque lleva tu héroe y sus bonos; el defensor lo ve en el informe.","Attacks carry your hero and its bonuses; the defender sees it in the report."],
  ["8.61","2026-11-24","En los informes tu lado dice (Tú).","Your side says (You) in reports."],
  ["8.60","2026-11-24","Defensa en OFF: tus tropas no pelean y el atacante mata la mitad.","Defense OFF: your troops do not fight and the attacker kills half."],
  ["8.59","2026-11-24","Combate nuevo: infantería > caballería > tiradores > infantería, el más fuerte barre y sin héroe Defensor no hay bono.","New combat: infantry > cavalry > ranged > infantry, the stronger side sweeps and no Defender hero means no bonus."],
  ["8.55","2026-11-24","Hasta 10 marchas a la vez; las marchas salen en filas debajo de Marchar.","Up to 10 marches at once; marches show as rows under March."]];

var NOMBRE_JUEGO = 'Brother Kingdom';

// ---------------- Modo DUEÑO (solo para pruebas) ----------------
// Pon false antes de subir el juego a la App Store / Google Play.
var MODO_DUENO_ACTIVO = true;
// Huellas (SHA-256) de las cuentas del dueño: su correo y su usuario "maikelramirez55" y "MaikelR".
// No se guardan escritos en el código.
var HUELLAS_DUENO = [
  '04ffb008e35525eb03d5dea75e79bb0d8217c5aab3a3a8953ed15953563508c4',
  'fd78fd09b2cd76c82a80675a4c758b65306b2309aaff68e598a4e344e7024bad',
  'bc81ce5c754b6d193233a82763f34d3c63953a8f9f05d9060e46d2a9111790e2'  // v6.84: usuario "MaikelR"
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
    sin_espacio: 'No hay espacio: mejora o construye más Cuarteles.', pob_llena: '👥 Tu población está llena: construye o mejora Cabañas para entrenar más tropas.', pob_obreros: '👥 Te faltan obreros: cada obra necesita {n} de población libre. Construye o mejora Cabañas.',
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
    tr_titulo: 'Trabajos para subir de nivel', tr_oleadas: 'Gana {n} oleadas', tr_recolectas: 'Recoge {n} veces en tus campos', tr_tropas: 'Entrena {n} tropas', tr_campamentos: 'Vence {n} aldea bárbara 🛖 o villa en el Mundo', tr_falta: '🔒 Falta un trabajo: {t}', tr_bloqueado: '🔒 Completa los trabajos para mejorar', mat_titulo: 'Materiales para subir de nivel', mat_peq: '📘 Libro pequeño (+300 EXP): se gana en las oleadas y en el cofre diario', mat_gra: '📗 Libro grande (+1500 EXP): se gana venciendo campamentos de trasgos y en el cofre diario', mat_perg: '📜 Pergamino (habilidades): se gana en las oleadas', mat_falta: 'Te faltan libros: juega oleadas y vence campamentos para conseguirlos.', mat_no_tienda: 'Estos materiales no se venden en el Colmado: se ganan jugando.', mat_ganado: '📘 +{n} libro(s) de experiencia para tus héroes', def_on: '⚔️ ON', def_off: '⚔️ OFF', def_titulo: 'Tropas defienden', def_on_txt: 'Tus tropas defienden el reino cuando te atacan. ¡Cuidado: pueden morir y tendrás que entrenar otras!', def_off_txt: 'Tus tropas se quedan guardadas y no defienden: no mueren, pero tu reino se defiende solo con el castillo, la muralla y las torres.', acel_recorta: 'recorta {t}', entreno_cola_pill: 'Entrenando', rama_tropas: 'Tropas', inv_de_tropa: 'Investigación de {n}', investigar_tropa: '🔬 Investigar', poder_sube: '+{n} Poder', poder_subio: '💪 ¡Tu Poder subió a {n}!', buzon: 'Buzón', buzon_titulo: '📬 Buzón', buzon_vacio: 'No tienes mensajes nuevos.', buzon_nov: '¡Novedades de la versión {v}!', buzon_leido: 'Leído', buzon_otras: 'Versiones anteriores', inv_tab_recursos: 'Recursos', inv_tab_acelerar: 'Acelerar', inv_tab_ingresos: 'Ingresos', inv_tab_equipo: 'Equipo', inv_tab_otros: 'Otros', inv_vacio_tab: 'No tienes nada aquí todavía.', inv_equipada: 'Equipada en {n}', inv_libre: 'Sin equipar', inv_mejorar_pieza: 'Mejorar', inv_recurso_txt: 'Lo que tienes guardado ahora mismo.', al_portal: '🌀 Usar portal', tel_cancelado: '🌀 Te mudaste a tiempo: el ataque de {n} se canceló y sus tropas regresan.', tel_espera24: 'Ya usaste un portal: espera {t} para usar otro.', tel_batalla: 'La batalla ya empezó: ya no puedes usar el portal.', tel_no_atacar: 'Acabas de mudarte: no puedes atacar durante {t}.', cas_terreno: 'Terreno', cas_coord: 'Coordenadas', cas_ocupada_por: 'Ocupada por', cas_libre_corto: 'Libre', cas_reubicar: '🌀 Reubicar', cas_ocupar: '🚩 Ocupar', cas_tu_reino: 'Tu reino', cas_campamento: 'Aldea bárbara', tel_elige_casilla: '🌀 Toca una casilla libre del mapa y pulsa Reubicar.', mar_cancelada: '🌀 {n} se mudó con un portal antes de que llegaras. Tus tropas regresan sin pelear.', burbuja_txt: '🫧 Burbuja de protección: nadie te puede atacar durante {t}. Se pierde al subir el Castillo a nivel {n} o si atacas a alguien.', burbuja_perdida: '🫧 Tu burbuja de protección terminó. Ya te pueden atacar.', car_titulo: 'Carretas', car_txt: 'Llevan tus recursos por el mapa del mundo. Se entrenan como las tropas y se mejoran para cargar más.', car_tienes: 'Tienes {n} · libres {l} · carga {c} cada una', car_entrenar: 'Entrenar ×{n}', car_entrenando: 'Entrenando {n} · la próxima en {t}', car_mejorar: 'Mejorar a nivel {n} (carga {c})', car_max: 'Carretas al nivel máximo', car_faltan: 'Necesitas {n} carretas libres (tienes {l}). Entrena más en el Mercado.', car_necesitas_mercado: 'Construye un Mercado para entrenar carretas.', car_en_camino: '🛒 {n} en camino', car_volvieron: '🛒 Volvieron tus carretas con {b}', car_salen: '🛒 Salen {n} carretas · llegan en {t}', car_listas: '🛒 ¡{n} carreta(s) lista(s)!', car_mejoradas: '🛒 Carretas nivel {n}: ahora cargan {c} cada una', car_nivel: 'Nivel {n}', car_estado: '🛒 Carretas libres: {l}/{n}', cas_guardado: 'Guardado: {a} / {m} {r} · +{h} por hora', cas_recolectar: '🛒 Recolectar', cas_nada: 'Todavía no hay nada para recolectar aquí.', nivel_caballero: 'Tu nivel de caballero es {n}: puedes pedir hasta {m} tropas.', ped_titulo: 'Pedidos de la alianza', ped_def: '🛡️ Refuerzos para defender', ped_atk: '⚔️ Refuerzos para atacar', ped_rec: '📦 Pedir recursos', ped_cantidad: 'Cantidad', ped_crear: '📣 Pedir', ped_mio: 'Tu pedido', ped_de: 'Pedido de {n}', ped_faltan: 'faltan {n}', ped_donaron: 'Donaron: {l}', ped_nadie: 'Nadie ha donado todavía.', ped_completo: '✅ ¡Pedido completo!', ped_quitar: 'Quitar', ped_mandar_tropas: 'Mandar tropas', ped_donar: 'Donar', ped_donar_txt: 'Dona de tus propios recursos: van en carretas y tardan en llegar.', ped_hecho: '📣 ¡Pedido enviado a tu alianza!', ped_donado: '🎁 Donaste {n} a {q}', ped_motivo_defender: 'para defender', ped_motivo_atacar: 'para atacar', ped_ninguno: 'No hay pedidos ahora.', ped_atk_btn: '📣 Pedir refuerzos para este ataque', ped_tropas: 'tropas', ped_ya_tienes: 'Ya tienes un pedido de este tipo: quítalo para hacer otro.', ped_llegan: 'Los recursos llegan en carretas a medida que tus compañeros donan.', esc_tienes: 'Tienes {n}', esc_entrenando: 'Entrenando {n}', hola: '¡Hola, {n}!', salir_txt: 'Tu partida queda guardada en la nube. ¿Seguro que quieres salir?', cerrar_sesion: 'Cerrar sesión', cargando: 'Cargando...', guardado_nube: 'Guardado en la nube ☁️',
    cuenta_de: 'Conectado como', entrar_o_crear: 'Entrar o crear cuenta',
    e_clave: 'Usuario o contraseña incorrectos.', e_existe: 'Ese usuario ya existe. Elige otro o entra.',
    e_debil: 'La contraseña debe tener 6 o más caracteres.', e_usuario: 'Usuario no válido: usa 3 a 20 letras, números, _ o punto.',
    e_red: 'Sin internet. Revisa tu conexión.', e_muchos: 'Demasiados intentos. Espera un poco.',
    e_general: 'No se pudo. Inténtalo otra vez.', e_repetir: 'Las contraseñas no son iguales.',
    e_sin_nube: 'Las cuentas no están disponibles ahora (sin internet).',
    gemas_inf: 'Gemas infinitas',
    r_oro: 'oro', r_comida: 'comida', r_madera: 'madera', r_piedra: 'piedra', r_hierro: 'hierro', r_gemas: 'gemas', r_amatista: 'Amatista rúnica',
    falta: 'Te falta {r}.', costo: 'Cuesta', produce_txt: 'Produce {n} {r} cada {s} s',
    comen: 'Tus tropas comen {n} de comida por minuto.', sin_comida: '🍞 Comida en 0: tus tropas pelean igual al 100%. Construye Granjas o manda comida desde otra villa.',
    impuesto: 'El castillo cobra {n} de oro cada {s} s.', recursos_inf: 'Recursos infinitos',
    c_aserradero: 'Ahora pon un Aserradero: da madera para construir.', c_mina: 'Consejo: una Mina da piedra para torres y muralla.',
    c_barricada: 'Consejo: pon una Barricada en el camino para frenar a los enemigos.',
    colocando_barr: 'Elige un punto del camino para la Barricada', punto_ocupado: 'Ya hay una Barricada ahí.',
    barr_rota: '🚧 ¡Rompieron una Barricada!', barr_arreglo: 'Las barricadas se arreglan solas al terminar la oleada.',
    madera_nivel: 'de madera', piedra_nivel: 'de piedra',
    t_aliada: 'Tu tropa', t_enemigo: 'Enemigo', t_invocada: 'Invocada con gemas (no ocupa lugar en el cuartel)', t_heroe: 'Héroe: se cura solo poco a poco',
    t_lenta: 'Velocidad', t_ritmo: 'Ataca cada {s} s', t_oro: 'Suelta {n} de oro al caer', t_hambre: 'Con hambre: pega más débil',
    armadura: 'Armadura', mejorar_armadura: 'Mejorar armadura', armadura_sube: 'Nivel {n}: +{v}% vida, +{d}% defensa',
    armadura_max: 'Armadura de Dragón al máximo ★★★★', defensa: 'Defensa', armadura_lista: '🛡️ ¡Armadura de {t} nivel {n}! Se nota en tus tropas.',
    b_conquista: 'Campaña', b_heroes: 'Héroes', b_mochila: 'Inventario', b_tienda: 'Tienda',
    p_conquista: 'Campaña', p_heroes: 'Tropas', p_mochila: 'Inventario', p_tienda: 'Tienda', sub_tropas: 'Tropas', sub_invocar: 'Invocar',
    conquista_txt: 'Defiende el reino de cada oleada. Al ganarla recibes experiencia, libros, pergaminos y aceleradores.', oleada_curso: 'Oleada en curso: quedan {n} enemigos.',
    vienen: 'Vienen:', oleadas_ganadas: 'Oleadas ganadas',
    diario_titulo: 'Cofre diario', diario_txt: 'Entra cada día para un cofre mejor. Si faltas un día, la racha vuelve a empezar.',
    diario_dia: 'Día {n}', diario_reclamar: '🎁 Reclamar cofre del día {n}', diario_listo: 'Ya lo reclamaste hoy. Vuelve mañana por el día {n}.',
    diario_racha: '🔥 Racha: {n} días seguidos', mochila_vacia: 'Tu baúl está vacío. Consigue cofres con el cofre diario o en el Colmado.',
    mis_objetos: 'Tus objetos', usar: 'Usar', abrir: 'Abrir', recibiste: '🎁 Recibiste: {t}', tropas_regalo: '{n} tropas',
    tienda_txt: 'Compra con gemas. Lo que compras se guarda en tu Baúl 🧳. Las gemas se ganan en las oleadas y en el cofre diario.',
    tienda_real: 'Compras con dinero real: llegarán con la versión de la App Store.', comprar: 'Comprar', comprado: '{n}: guardado en tu Baúl 🧳',
    acelerador_usado: '⏩ ¡Le quitaste 1 hora a todas las obras!', sub_heroes: 'Héroes', heroes_txt: 'Tus héroes salen del castillo en cada oleada y usan su poder. Lleva hasta 3 en tu equipo.', reclutar: 'Reclutar héroe', reclutar_gratis: '🎁 Gratis hoy', reclutar_txt: 'Cada tirada da de 1 a 5 medallas de un héroe. Al completar sus medallas, el héroe se une a ti; si ya lo tienes, le sirven para subir estrellas.', heroe_nuevo: '🎉 ¡Nuevo héroe: {n}!', heroe_frag: '+{f} fragmentos de {n}', equipo_n: 'Equipo: {n}/3', en_equipo: 'EQUIPO', poner_equipo: '➕ Poner en el equipo', quitar_equipo: '➖ Quitar del equipo', equipo_lleno: 'Tu equipo ya tiene 3 héroes. Quita uno primero.', subir_nivel: 'Subir nivel', subir_estrella: '⭐ Subir estrella', nivel_tope: 'Sube una estrella para pasar del nivel {n}.', fragmentos: 'Fragmentos', poder_heroe: 'Poder', bloqueado: '🔒 Consíguelo reclutando', rareza_comun: 'Común', rareza_raro: 'Raro', rareza_legendario: 'Legendario', rareza_mitico: 'Mítico', clase_infanteria: 'Infantería', clase_arquero: 'Arquero', clase_magia: 'Magia', clase_guardian: 'Guardián', heroe_sube: '⬆️ ¡{n} subió al nivel {v}!', heroe_estrella: '⭐ ¡{n} ahora tiene {v} estrellas!', volver: '⬅ Volver', resultado: 'Resultado', estrellas_max: '★ Estrellas al máximo', cada_s: 'cada {s} s', ref_titulo: '📣 Refuerzos', ref_txt: 'Tus tropas pueden defender el reino de un aliado: pelean en sus oleadas y suman a su defensa. Las puedes retirar cuando quieras.', ref_pedir: '📣 Pedir refuerzos', ref_pedido_hecho: '📣 Pediste refuerzos a tu hermandad.', ref_quitar_pedido: 'Quitar pedido', ref_pedidos: 'Piden ayuda', ref_ninguno: 'Nadie está pidiendo ayuda ahora.', ref_reforzar: '🛡️ Reforzar', ref_en_reino: 'Refuerzos en tu reino', ref_enviados: 'Tus refuerzos enviados', ref_devolver: 'Devolver', ref_retirar: 'Retirar', ref_de: '{n} tropas de {q}', ref_a: '{n} tropas en el reino de {q}', ref_enviar_a: 'Enviar refuerzos a {q}', ref_tienes: 'Tienes {n}', ref_enviar: '🛡️ Enviar refuerzos', ref_enviado: '🛡️ ¡Refuerzos enviados a {q}!', ref_volvieron: '🛡️ Volvieron {n} tropas del reino de {q}', ref_error: 'No se pudo. Revisa tu internet y que los dos estén en la misma hermandad.', ref_en_oleada: 'Espera a que termine la oleada.', ref_nada: 'Elige al menos una tropa.', ref_llegaron: '🛡️ ¡Llegaron refuerzos de {q}!', ref_devueltos: 'Devolviste los refuerzos.', ref_retirados: 'Tus tropas vuelven a casa.', ref_nadie: 'Todavía no hay refuerzos.', toca_tu_castillo: '👑 Toca tu castillo para entrar a tu ciudad', entrar_ciudad: 'Entrar', bienvenido_ciudad: '🏰 ¡Bienvenido a tu ciudad!', armaduras_tienda: '🛡️ Armaduras', armaduras_tienda_txt: 'Ponle armadura a un tipo de tropa: todas las de ese tipo (y las que entrenes) la llevan puesta.', armadura_para: 'Armadura {n} — {t}', entrenando_n: '⚔️ Entrenando {n} tropas', maximo: 'Máx', terminar_ya: 'Terminar ya', terminado_gemas: '💎 ¡Terminado!', escudo_activo: '🛡️ Escudo activo: faltan {t}. Espera a que se acabe para poner otro.', escudo_activo_btn: 'Activo: {t}', nada_acelerar: 'No hay nada construyéndose ni entrenándose.', exp_llena: 'Sube una estrella para seguir', hv_equipo: 'Equipo', eq_arma: 'Arma', eq_casco: 'Casco', eq_pechera: 'Pechera', eq_guantes: 'Guantes', eq_botas: 'Botas', eq_amuleto: 'Amuleto', eq_r_comun: 'de hierro', eq_r_raro: 'de plata', eq_r_legendario: 'solar', eq_r_mitico: 'mítica', eq_rapido: '⚡ Equipar rápido', eq_quitar_todo: 'Desequipar todo', eq_vacio: 'Vacío', eq_equipar: 'Equipar', eq_quitar: 'Quitar', eq_fundir: 'Fundir', eq_de: 'lo lleva {n}', eq_ninguno: 'No tienes piezas de este tipo. Gánalas en oleadas y campamentos, o abre un Cofre de equipo.', eq_nueva: '🧰 ¡Pieza nueva: {n}!', eq_fundida: '🔥 Fundiste {n}: +{o} 🪙', eq_mejorada: '⬆️ {n} subió al nivel {v}', eq_bonos: 'Del equipo: {t}', eq_dano: 'Daño', eq_vida: 'Vida', eq_def: 'Defensa', eq_vel: 'Velocidad', eq_recarga: 'Recarga', eq_nada_que: 'No hay piezas libres para equipar.', eq_listo: '⚡ Equipo puesto', eq_fundir_txt: '¿Fundir {n}? Da {o} de oro y la pieza desaparece.', eq_tienes: 'Piezas: {n}', p_chat: 'Chat', chat_global: 'Global', chat_hermandad: 'Hermandad', chat_escribe: 'Escribe un mensaje…', chat_enviar: 'Enviar', chat_cuenta: 'Crea una cuenta para chatear con otros jugadores.', chat_sin_alianza: 'Únete a una hermandad para hablar con ella.', chat_vacio: 'Todavía no hay mensajes. ¡Saluda!', chat_espera: 'Espera un momento antes de escribir otra vez.', chat_error: 'No se pudo enviar. Revisa tu internet.', chat_bloquear: 'Bloquear', chat_desbloquear: 'Desbloquear', chat_reportar: 'Reportar', chat_borrar: 'Borrar', chat_bloqueado: '🚫 Ya no verás los mensajes de {n}.', chat_reportado: '🚩 Gracias. Revisaremos el mensaje de {n}.', chat_bloqueados: 'Bloqueados: {n}', chat_normas: 'Sé amable. Los insultos se tapan y puedes reportar o bloquear a cualquiera tocando su nombre.', chat_tu: 'Tú', tel_aqui: 'Mover mi reino aquí', tel_tienes: 'Portales: {n}', tel_ok: '🌀 ¡Tu reino se mudó a {x}, {y}!', tel_oleada: 'No puedes mudarte durante una oleada.', tel_marcha: 'Espera a que vuelvan tus tropas que van marchando.', tel_atacado: 'No puedes huir: hay un ataque en camino.', tel_ocupada: 'Esa casilla no sirve: elige tierra libre (sin lagos, montañas, reinos ni campamentos).', tel_elegir: 'Abre el mapa del mundo y toca una casilla libre para mudarte.', tel_sin: 'No tienes portales: cómpralos en el Colmado.', tel_titulo: '¿Mudar tu reino?', tel_txt: 'Tu reino se mueve a {x}, {y}. Tus casillas conquistadas siguen siendo tuyas.', vig_txt: 'Defensa +{n}%', vig_ve: 'Ves la fuerza del atacante', al_decide: '¿Qué quieres hacer?', al_defender: 'Defender', al_portal_corto: 'Usar portal', al_te_ataca: '⚔️ ¡{n} te ataca!', al_llega: 'Llega en {t}', al_mas: '+{n} más', al_fuerza: 'Fuerza ~{f} · tu defensa {d}', al_sin_vigia: 'Construye un Puesto de vigía para ver su fuerza', al_tocar: 'Toca para defender tu ciudad', mar_hacia: '🏇 Tus tropas van hacia {n}', mar_llega: 'Llegan en {t}', mar_salen: '🏇 ¡Tus tropas salieron! Llegan a {n} en {t}.', mar_error: 'No se pudo enviar el ataque. Revisa tu internet.', mb_vigilar: 'Vigilar', p_vigia: 'Puesto de vigía', vig_entrantes: 'Ataques que vienen', vig_salientes: 'Tus marchas', vig_nada: 'Todo tranquilo por ahora.', acel_titulo: 'Acelerar', acel_falta: 'Falta: {t}', acel_usar: 'Usar', acel_usado: '⏩ Quitaste {t}', acel_todo: 'Acelerador real: 1 hora a todas las obras y termina el entrenamiento', acel_desde_menu: 'Úsalo desde el menú de un edificio (botón Acelerar) o en la cola de entrenamiento.', acel_listo: '✅ ¡Listo!', acel_cola: 'Acelerar entrenamiento', protege_txt: 'Protege {n} de cada recurso', tasa_txt: 'Cambio: 100 → {n}', herreria_txt: 'Armas hasta nivel {n}', necesitas_establo: 'Necesitas un Establo para entrenar caballería.', necesitas_galeria: 'Necesitas una Galería de tiro para entrenar arqueros.', necesitas_cuartel_t: 'Necesitas un Cuartel para entrenar esta tropa.', mb_comerciar: 'Comerciar', mb_forjar: 'Forjar', p_mercado: 'Mercado', p_herreria: 'Herrería', mer_cambiar: 'Cambiar recursos', mer_das: 'Das', mer_recibes: 'Recibes', mer_cambio_ok: '⚖️ Cambiaste {a} por {b}', mer_enviar: 'Enviar a tu hermandad', mer_a: 'Para', mer_enviar_btn: '📦 Enviar', mer_enviado: '📦 Enviaste recursos a {n}', mer_sin_alianza: 'Únete a una hermandad para enviar recursos.', mer_sin_cuenta: 'Crea una cuenta para enviar recursos.', mer_nadie: 'No hay nadie más en tu hermandad.', mer_recibiste: '📦 {n} te envió {b}', mer_error: 'No se pudo enviar. Revisa tu internet.', mer_nada: 'Elige qué enviar.', her_armas: 'Armas', her_armadura: 'Armadura', her_armas_sube: 'Armas {n}: +{d}% de daño', her_necesita: 'Herrería nivel {n}', her_sin: 'Construye una Herrería para forjar armas.', armas_lista: '⚒️ ¡Armas {n} para {t}!', mundo_toca: '🔍 Busca y espía a tus enemigos antes de atacar. Toca una casilla del mapa para ver qué hay. Arrastra para moverte y pellizca para acercar.', cas_llanura: 'Llanura', cas_bosque: 'Bosque', cas_colina: 'Colina', cas_lago: 'Lago', cas_montana: 'Montaña', cas_guardianes: 'Guardianes', cas_tuya: '🚩 Esta casilla es tuya: da su bonus a tus campos.', cas_abandonar: 'Abandonar', cas_abandonar_txt: 'La casilla queda libre y pierdes su bonus.', cas_de: '🚩 Es de {n}.', cas_quitar: 'Atacar y quitársela', cas_libre: 'Conquístala para ganar su bonus. Tienes {n} de {m} casillas (sube el Castillo para tener más).', cas_conquistar: 'Conquistar', cas_maximo: 'Ya tienes {n} casillas. Sube el Castillo para conquistar más.', cas_ganada: '🚩 ¡Casilla conquistada! Su bonus ya ayuda a tus campos.', cas_perdida: 'Los guardianes resistieron.', cas_mias: 'Tus casillas: {n}/{m}', camp_atacar: 'Atacar el campamento', camp_espera: 'Los trasgos se están reagrupando: vuelve en {t}.', camp_perdio: 'Los trasgos resistieron.', mb_demoler: 'Demoler', demoler_titulo: '¿Demoler {n}?', demoler_txt: 'Se borra el edificio (nivel {v}) y la parcela queda libre. No se devuelven materiales.', demoler_si: 'Sí, demoler', cancelar: 'Cancelar', demolido: '🧨 {n} demolido. La parcela quedó libre.', demoler_oleada: 'No se puede demoler durante una oleada.', parcela_cerrada: '🔒 Sube el Castillo al nivel {n} para abrir esta parcela.', parcelas_nuevas: '🔓 ¡{n} parcelas nuevas en tu ciudad!', mb_recolectar: 'Recolectar', recolectado: '+{n} {r}', guarda_hasta: 'Guarda hasta {n}', solo_campo: 'Ese edificio va en los campos de fuera de la muralla.', solo_ciudad: 'Ese edificio va dentro de la ciudad.', campo_libre: 'Campo libre', parcela_libre: 'Parcela libre', sin_campo: 'No hay campos libres.', recolectar_todo: 'Recolectar todo', bp_saltar: 'Saltar', bp_volver: 'Volver al mapa', bp_victoria: '¡Victoria!', bp_derrota: 'Derrota', version_nueva: 'Hay una versión nueva {v}: toca para actualizar', hv_atributos: 'Atributos', hv_habilidades: 'Habilidades', hv_poder: 'Poder', hv_talento: 'Talento', hv_extra: 'Daño extra', hv_dur: 'Duración', hv_dano: 'Daño', hv_saltos: 'Saltos', hv_alrededor: 'Alrededor', hv_flecha: 'Por flecha', hv_radio: 'Radio', hv_menos: 'Daño recibido', hv_mareo: 'Mareo', hv_cura: 'Cura', hv_recarga: 'Recarga', hv_dano_heroe: 'Daño del héroe', hv_vida_heroe: 'Vida del héroe', hv_necesita: 'Sube a {n}★ para desbloquear el siguiente nivel.', pergaminos_tienes: 'Pergaminos: {n} (se ganan en las oleadas y en el Colmado)', sin_pergaminos: 'Te faltan pergaminos de habilidad: gánalos en las oleadas o en el Colmado.', hab_sube: '✨ {h} subió al nivel {n}', tal_infanteria: 'Brazo fuerte', tal_infanteria_txt: 'El héroe pega más fuerte.', tal_arquero: 'Ojo certero', tal_arquero_txt: 'Más daño y más alcance.', tal_magia: 'Mente veloz', tal_magia_txt: 'Su poder se recarga más rápido.', tal_guardian: 'Piel de roca', tal_guardian_txt: 'El héroe aguanta mucho más.', usar_libros: 'Libros', sin_libros: 'No tienes libros de experiencia. Cómpralos en el Colmado.', libros_usados: 'Usaste {n} libros de experiencia.', libro_en_heroe: 'Úsalo desde el panel del héroe: Guardia → Héroes.', estrellas: 'Estrellas', estrella_da: 'Con {a}★: +20% vida y daño, y nivel máximo {n}.', subir_estrella_c: 'Subir', obtener_mas: 'Obtener más', ir: 'Ir', reclamar: 'Reclamar', heroes_premio: '🦸 Tu equipo ganó {x} EXP y {n} {f} fragmentos', ob_oferta: 'Oferta del día', ob_oferta_txt: '{n} fragmentos gratis, una vez al día', ob_canje: 'Canje', ob_canje_txt: '{n} fragmentos de este héroe', ob_reclutar: 'Reclutar', ob_reclutar_txt: 'Si sale repetido: {n} fragmentos', ob_oleadas: 'Oleadas', ob_oleadas_txt: 'Al ganar, tu equipo gana EXP y fragmentos', ob_diario: 'Cofre diario', ob_diario_txt: 'Premios cada día en el Baúl', ob_tienda: 'Tienda', ob_tienda_txt: 'Libros de experiencia', mb_detalles: 'Detalles', mb_terminar: 'Terminar', mb_acelerar: 'Acelerar', mb_investigar: 'Investigar', mb_sin_acelerador: 'No tienes aceleradores: consíguelos en el Colmado o en los cofres.', pest_cuartel: 'Cuartel', pest_establo: 'Establo', pest_tiro: 'Campo de tiro', rango: 'Rango', rango_bloq: '🔒 El rango {r} está bloqueado. Sube la armadura para desbloquearlo.', rango_antes: '🔒 Primero desbloquea el rango {r}.', subir_rango: 'Subir a rango {r}', entrenadas_ya: '⚔️ ¡{n} × {t} listas!', sin_recursos_tropa: 'No te alcanzan los materiales para entrenar esta tropa.', terminar_cola: 'Terminar entrenamiento',
    p_investigar: 'Investigación', investigar: 'Investigar', rama_crecimiento: 'Crecimiento', rama_economia: 'Economía', rama_batalla: 'Batalla',
    inv_txt: 'Cada tecnología mejora algo de verdad en tu reino. Solo se investiga una a la vez.', inv_ahora: 'Ahora', inv_siguiente: 'Siguiente',
    inv_en_curso: 'Investigando: {n} (nivel {l})', inv_falta: 'Faltan {s} s', inv_ocupada: 'La Academia ya está investigando.',
    inv_tope: 'Mejora la Academia para pasar del nivel {n}.', inv_lista: '📜 ¡{n} nivel {l} lista!', inv_necesitas: 'Construye una Academia para investigar.',
    inv_abrir: '📜 Abrir investigación', c_academia: 'Consejo: construye una Academia para investigar mejoras.',
    b_mundo: 'Mundo', b_alianza: 'Alianza', p_mundo: 'Mapa del mundo', p_alianza: 'Alianza',
    mundo_cuenta: 'Crea una cuenta para aparecer en el mapa de las islas y unirte a una hermandad.',
    mundo_cargando: 'Cargando el mapa...', mundo_error: 'No se pudo cargar el mapa. Revisa tu internet.',
    mundo_solo: 'Por ahora eres el único reino en el mapa. ¡Invita a tus amigos a jugar!',
    leyenda_tu: 'Tú', leyenda_alianza: 'Tu hermandad', leyenda_otros: 'Otros reinos', leyenda_trasgos: 'Bárbaros',
    tu_reino: 'Tu reino', reino_de: 'Reino de {n}', campamento: 'Aldea bárbara',
    campamento_txt: 'Aquí viven guerreros bárbaros con el botín que robaron. Véncelos y quédate con él.', sin_alianza: 'Sin hermandad',
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
    camas: 'Camas', a_enfermeria: '💚 A la enfermería', curados: '💚 Se curaron {n} tropas', en_enfermeria: 'En la enfermería: {n} (cúralas cuando quieras)',
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
    borrar_cuenta_ok: 'Borrar para siempre', cuenta_borrada: 'Tu cuenta fue borrada.', privacidad: 'Privacidad', novedades: '¡Novedades!', novedades_lista: '<li>🎥 Cambiar entre Ciudad, Campos y Mundo ya no salta: la cámara se desliza y se aleja suave, con el mismo ángulo, y el Mundo se abre desde tu reino.</li><li>🗺️ Todas las tarjetas del mundo son iguales (terreno, bestias, aldeas bárbaras): nombre y nivel, coordenadas, datos y Espiar / Ataque; solo cambia la información.</li><li>🔄 El juego se actualiza solo: ya no sale el aviso de «toca para actualizar».</li><li>💎 Las gemas ya no se regalan jugando: misiones, cofres, oleadas, campamentos, torneo, alianza y promociones ahora dan oro, recursos y objetos.</li><li>🔤 Los nombres de los botones de abajo ahora se leen claros.</li><li>👆 Las ventanas (Tienda, Inventario, edificios, menú…) se cierran solas cuando tocas o deslizas el dedo sobre el mapa.</li><li>🗺️ El mapa del mundo ocupa toda la pantalla: sin el letrero «Mapa del mundo» ni la X. Para volver a tu ciudad usa el botón de abajo a la izquierda.</li><li>🗺️ <b>Mundo limpio</b>: sin nombres sobre las casillas, sin la fila Ver/Marchar/Tropas/Procesos y sin carteles; las coordenadas van en una franja fina arriba; al deslizar el mapa la tarjeta se quita sola; sin botón Reubicar; tu reino abre su tarjeta con «Entrar a mi ciudad».</li><li>🏯 <b>Fortaleza</b> (en Tropas): manda a tus héroes a Explorar 4 veces al día y vuelven con experiencia, fragmentos y recursos.</li><li>🌳 <b>Árbol de talentos</b> en la Academia: pestañas Militar y Civil, cada talento con su nivel y unido con líneas; tócalo para aprenderlo.</li><li>🧾 <b>Ficha del héroe</b>: retrato con su nivel, ataque, vida, poder y barra; botones Retirar, Elevar y Equipo; pestañas Habilidad, Destino y Leyenda.</li><li>⭐ <b>Elevar héroe</b>: ventana con lo que gana y sus requisitos (fragmentos y nivel), en rojo lo que te falta.</li><li>🦸 <b>Lista de héroes nueva</b>: pestañas Lista y Árbol de habilidades, y todos los héroes en parrilla con su retrato, corona, nivel y nombre (también los que todavía no tienes).</li><li>🏰 <b>Castillo con 5 pestañas</b>: Detalles, <b>Vista general</b> (impuestos con barra: más oro, obras un poco más lentas), <b>Conquistas</b> (tus territorios), <b>Defensa</b> (tropas defienden ON/OFF) y <b>Personalizar</b> (color de tus banderas).</li><li>⚔️ <b>Cuartel nuevo</b>: pestañas Detalles, Entrenar tropas y Entrenando; Unidades básicas y avanzadas; cada tropa en su fila con su dibujo, estrellas, «Tienes» y flecha dorada.</li><li>🏛️ <b>Detalles de los edificios</b> como un gran juego de castillos: ventana grande, título con estrella, «Has alcanzado el máximo nivel» y dos botones rojos: <b>Demoler</b> (quita el edificio) y <b>Derribar</b> (le baja un nivel).</li><li>🏅 <b>Barras nuevas</b>: arriba oscura con dorado; abajo más bajita, con botones café y letras crema que se leen al instante.</li><li>🖼️ <b>Iconos nuevos con marco de oro</b> en el menú y en la barra de abajo, dibujados para Brother Kingdom.</li><li>💎 <b>Tienda nueva</b> con 3 pestañas: <b>Paquetes</b> (ofertas de la semana con su tiempo), <b>Gemas</b> y <b>Objetos</b>. Todo en español.</li><li>🏇 <b>Marcha en 5 pasos</b>: 1) objetivo y tipo (Atacar, Explorar o Reforzar), 2) Favoritos para guardar lugares, 3) tropas con la barra, 4) el botín que puedes traer y 5) Marchar.</li><li>🚩 <b>Punto de reunión</b> (antes Punto de relevo) con 3 pestañas: Detalles, <b>Mis tropas</b> (cuántas tienes en casa y su poder) y <b>Mis Marchas</b> (a dónde van, cuánto falta y botón Ver).</li><li>🛡️ <b>Alianza nueva</b> en 4 pestañas: <b>Info</b> (nombre, líder, liga, poder, idioma, miembros, nivel y botones), <b>Miembros</b> (con Líder y Hazañas, poder y última conexión), <b>Alianzas</b> (buscador y lista) y <b>Muro</b> (aviso del líder y mensajes).</li><li>🗺️ <b>Tarjeta de terreno</b> en el mundo: toca una casilla y verás su nombre, nivel, coordenadas, dueño, poder, alianza y diplomacia, con Espiar y Ataque. El mapa ya no muestra letreros de «Libre».</li><li>🎒 <b>Inventario nuevo</b>: Tienda y Mis objetos, con categorías que se deslizan y una fila por objeto con «Tienes» y el botón Usa.</li><li>🦜 <b>Azar con la Capitana Coral</b>: 9 cofres, Sacar 1 y Sacar 9, y Azar Premium con premios raros. Cada día te regalan 2 fichas de la suerte.</li><li>🎁 <b>Centro de Promociones</b>: cada una con su tiempo, su premio y su punto rojo.</li><li>💬 <b>Chat nuevo</b>: pestañas Global, Alianza y <b>Privado</b>, con tu lista de conversaciones (hasta 20) y el botón Vaciar.</li><li>👤 <b>Perfil del jugador</b>: toca un nombre en el chat para ver su nivel, poder y alianza, y Susurrar, Enviar mensaje, Ignorar, Denunciar o Invitar.</li><li>🚩 En el mundo: <b>bandera roja</b> en los reinos hostiles, azul en los de tu alianza, y tu ciudad <b>brilla en amarillo</b>.</li><li>💎 Botón verde de gemas arriba en cada ventana.</li><li>⏳ <b>Cuadrito de obras</b> arriba a la izquierda: lo que se construye, entrena o investiga, con barra, tiempo y botón verde <b>Acelerar</b>.</li><li>🪵 <b>Parcelas libres con cerca de madera</b>, para ver rápido dónde construir.</li><li>🚩 <b>Banderas</b> ondeando en las torres del castillo.</li><li>🏠 Los edificios se ven <b>asentados en el suelo</b>, con tierra y sombra suave debajo, y salen <b>humo</b> de más techos.</li><li>📱 <b>Pantalla más limpia</b>: a la derecha quedan Misiones, Chat y Correo; el botón ☰ abre Defensa, Ranking, Castillo, Pausa, Sonido y Ajustes.</li><li>💡 El letrero de ayuda es crema y <b>se quita al primer toque</b>.</li><li>⚔️ <b>Toca el recuadro de tropas</b> para abrir el Cuartel y entrenar.</li><li>🔤 Poder corto arriba (16,3M) y <b>letras de abajo más fáciles de leer</b>.</li><li>🎨 <b>Barras color pergamino</b>: arriba, abajo, el chat y los botones de la derecha ahora son crema claro con letras oscuras. El botón Ciudad / Mundo está dentro de la barra de abajo.</li><li>📜 <b>Tarjeta nueva en el mapa del mundo</b>: al tocar un reino sale una tarjeta crema encima del castillo, con su nombre, coordenadas, poder, alianza, diplomacia y liga, y los botones Espiar y Atacar.</li><li>🗺️ <b>Mundo mucho más grande</b>: ahora mide 300 × 300 casillas, con cajitas X y Y para buscar un lugar.</li><li>🛡️ <b>Caballeros</b>: Salón de Caballeros, el equipo muestra cuánto suben el ataque y la salud, y una guía. Las piezas se ganan jugando.</li><li>🫧 <b>Protección de máximo 7 días</b>.</li><li>🔍 <b>Zoom</b> de la ciudad y del mundo ajustado.</li><li>💬 <b>Chat del mundo siempre visible abajo</b>: los últimos mensajes con su hora, en la ciudad, los campos y el mundo. Tócalo para abrir el chat y escribir.</li><li>🌾 <b>Granja nueva</b> desde el nivel 15.</li><li>🏗️ <b>11 edificios crecen al nivel 15</b>: Almacén, Embajada, Academia, Mercado, Herrería, Establo, Enfermería, Galería de tiro, Punto de relevo, Cabaña y Vigía cambian a una versión más grande y detallada.</li><li>🪨 <b>Tu ciudad en lo alto</b>: la ciudad y sus campos están arriba de una meseta, con un acantilado de roca alrededor y una pradera abajo.</li><li>🏛️ <b>Edificios con tamaño por importancia</b>: el castillo manda, los edificios medianos llenan su parcela y la cabaña y los campos son chiquitos. Cada edificio crece un poco en cada nivel.</li><li>🎨 <b>Diseño nuevo</b>: barras finas de lado a lado, sin el cuadro del Castillo arriba (ahora el Castillo es un botón abajo a la izquierda), gema de verdad y menú café oscuro elegante.</li><li>🏰 <b>Castillo nuevo</b>, más detallado: piedra arenisca, torres con techos de teja roja, torre central alta y palmeras. Ahora con la puerta de frente y más liviano para el teléfono.</li><li>🏰 <b>Vista nueva de la ciudad</b>: cámara isométrica fija, en diagonal y sin perspectiva, como un juego 2D. Al entrar se ve la ciudad entera.</li><li>📊 <b>Barra de arriba nueva</b>: tu jugador, tu ciudad con coordenadas y las gemas en verde con el botón Más. Debajo, tus recursos.</li><li>🔩 <b>Hierro</b>: las minas ahora también dan hierro.</li><li>📋 <b>Menú nuevo</b> con 13 botones: Inventario, Misiones, Alianza, Correo, Azar, Campaña, Reliquia, Entrenar, Investigación, Clasificación, Ajustes, Publicar y Equipo.</li><li>⏱️ <b>Tiempos arreglados</b>: el panel de Tropas y el de Acelerar ahora muestran el mismo tiempo, y cada acelerador quita exactamente lo que dice.</li><li>🌾 <b>Vista Campos nueva</b>: la cámara mira desde afuera hacia tu ciudad, con los campos adelante y la muralla y el castillo detrás.</li><li>🗺️ <b>Mapa del Mundo mejorado</b>: aldeas más chicas, el mapa se arrastra más suave y sigue deslizando al soltar el dedo. Los jugadores nuevos aparecen cerca de otros reinos.</li><li>🐾 Quitamos las gallinas, cabras y caballos sueltos de la ciudad, que se deslizaban sin mover las patas. Volverán con animación de verdad.</li><li>🏰 <b>El castillo crece contigo</b>: empieza pequeño en el nivel 1 y se hace más grande en cada nivel hasta el 30.</li><li>🚶 <b>Las tropas ahora caminan por el suelo</b> cuando atacan en el mapa, y se quedan peleando al llegar antes de volver.</li><li>🛍️ <b>Tienda nueva</b>: pestaña Mis objetos, información de cada objeto (toca la i) y los cofres muestran lo que traen antes de abrirlos.</li><li>💎 <b>Tienda de gemas</b> con paquetes (todavía no se cobra nada).</li><li>📜 <b>Informe de batalla completo</b> en el correo: tropas que pelearon, sobrevivieron, murieron y heridos, de los dos lados. Botones Marcar todo leído y Enviar.</li><li>⚔️ <b>Ventana de Marcha nueva</b>: elige tu héroe (Cambiar), tus tropas con la cantidad exacta (Editar), mira el tiempo de marcha y guarda tu formación para la próxima vez. Puedes cancelar la marcha antes de que llegue.</li><li>🗺️ En el mapa el destino de tu marcha se marca con un aro.</li><li>🛠️ Arreglado: al volver a entrar o usar un acelerador con muchas tropas en cola, el juego ya no se traba.</li><li>🦸 <b>4 héroes Míticos</b>: León Dorado, Fénix, Titán y Águila, mucho más fuertes. Se ganan en el torneo semanal (y muy rara vez al reclutar).</li><li>🛡️ <b>Armadura mítica de cada héroe</b>: 6 piezas que solo usa su héroe; con 3 piezas +15% de daño y con 6 piezas +30% de daño y +10% de defensa. Se gana en el torneo.</li><li>⚔️ <b>El Cuartel cambia al subir de nivel</b>: versión nueva en el nivel 10 y fortaleza en el nivel 20.</li><li>🏹 <b>Torre nueva</b> con su arquero arriba, y un <b>pozo</b> y un <b>molino</b> junto al castillo.</li><li>🛠️ Arreglado: entrenar con Máx ya no traba el juego (hasta 10.000 por orden). La población ahora cuenta solo los obreros de las obras.</li><li>🎨 <b>Cada edificio con su color</b> de techo y pendones, para reconocerlo de un vistazo.</li><li>⚔️ <b>Entrena la tropa que quieras, la cantidad que quieras</b>, mientras tengas recursos. En la ciudad caminan hasta 250; el resto espera en el cuartel y cuenta para tu poder. Entrenar ahora tarda más.</li><li>🏗️ <b>Edificios y muralla hasta el nivel 30</b>, sin pasar el nivel del castillo.</li><li>🏘️ <b>14 edificios nuevos en 3D</b>: Granja, Aserradero, Mina, Cantera, Academia, Mercado, Herrería, Establo, Enfermería, Galería de tiro, Almacén, Vigía, Embajada y Punto de relevo, todos en el estilo del castillo y sin adornos que los tapen.</li><li>🪟 <b>Ventana nueva al tocar un edificio</b>: Detalles, Sig. nivel, Mejorar y Construir ya, tiempo con gemas, tabla Tipo · Necesitas · Tienes y Demoler. Se abre directo al tocar.</li><li>🏷️ El letrero de nivel solo sale en el edificio que tocas.</li><li>⚔️ <b>Cuartel nuevo en 3D</b>: cuartel de piedra arenisca con torrecitas, techo de teja roja, pendones y armero, en el estilo del castillo. Los edificios en 3D ya no llevan la plataforma de piedra y ocupan bien su parcela.</li><li>🛖 <b>Cabaña nueva en 3D</b>: casita de piedra arenisca con techo de teja roja y pendón, en el mismo estilo del castillo.</li><li>🏰 <b>Castillo nuevo en 3D</b>: piedra arenisca, torres redondas con almenas, techos de teja roja, banderas y puerta en arco. Sale desde el nivel 5 del castillo y crece en cada etapa.</li><li>🏆 <b>Ranking de todos los jugadores</b> (botón 🏆): ordenados por poder, con tu puesto.</li><li>🏆 <b>Torneo semanal</b>: gana puntos con oleadas, ataques, campamentos, obras, campos, aceleradores y tropas. El lunes los mejores reciben gemas y oro (el 1.º: 500 💎).</li><li>🎁 <b>El cofre diario se abre solo</b> al entrar y los premios se suman al tocar Recoger.</li><li>💎 <b>Nada se gasta sin preguntar</b>: antes de gastar gemas sale cuánto cuesta y cuántas te quedan.</li><li>🔍 <b>Buscar alianza</b> por nombre o etiqueta.</li><li>🛖 <b>Cabaña nueva</b>: aloja a tu población. Cada tropa ocupa 1 de población y cada obra necesita 5 obreros libres. Mira tu población en el panel del rey (👥). Los que ya jugaban reciben población de regalo.</li><li>🪵 <b>Ventana café de los edificios</b>: pestañas, foto grande, descripción, siguiente nivel, Mejorando... con reloj, botones Cancelar (azul) y Mejorar (verde), y la tabla Tipo · Pide · Tienes en pergamino.</li><li>👑 <b>Castillo hasta el nivel 30</b> con 5 etapas: fuerte de madera (1-4), piedra con 3 torres (5-9), 5 torres con banderas azules (10-14), grande con 8 torres y estandartes (15-29) y el ULTRA del nivel 30 con cúpula de oro, magia azul, dragones de piedra, foso y 14 torres.</li><li>⏳ Cada nivel del castillo tarda más (el 30 tarda unos 19 días) y pide subir tu nivel, la muralla y los demás edificios: del 18 al 30, todos al 17.</li><li>🏰 <b>Ciudad nueva</b>: muralla redonda con 4 puertas y caminos de piedra en cruz que salen del castillo. Más parcelas (hasta 52).</li><li>🌾 <b>Campos nuevos</b>: detrás de la ciudad, cruzando el río por un puente de piedra, hay un recinto amurallado con las parcelas en filas, caminitos de piedra, dos molinos y graneros.</li><li>⚔️ <b>Ventana de Tropas nueva</b>: madera oscura y oro, escenario de piedra con luz dorada y rangos I-V como medallas de metal.</li><li>🪵 <b>Interfaz nueva</b>: madera oscura, hierro y oro. Arriba tus recursos en escudos, a la izquierda el panel del rey con poder y vida del castillo, y abajo 7 botones redondos. Todo centrado.</li><li>🐉 <b>Armadura nueva: Dragón</b> (rango V): roja oscura con cuernos, capa roja, joya de fuego y aro de llamas. +80% vida y +40% defensa.</li><li>👑 <b>Dueño: todo al máximo</b>: edificios, castillo y muralla nivel 17, investigación, armaduras, armas, héroes y muchas tropas.</li><li>⬆️ <b>Mejorar primero</b>: al tocar un edificio o el castillo, el primer botón es Mejorar (con el nivel actual → siguiente). Abre el panel con lo que cuesta, lo que tarda, lo que gana y lo que falta. Demoler va al final, separado y en rojo.</li><li>🔟 <b>Niveles hasta el 17</b>: edificios, castillo y muralla suben hasta el nivel 17, y del 13 al 17 suman adornos nuevos.</li><li>🏰 <b>Castillo nuevo</b>: piedra cálida y techos de teja que combinan con la ciudad; crece y se adorna en cada nivel.</li><li>🔤 Los nombres del menú de abajo se leen siempre, también en computadora.</li><li>🏇 <b>Las tropas se ven marchando</b> también al atacar aldeas bárbaras, bestias y casillas: salen de tu reino, caminan por el mapa con la cámara siguiéndolas, pelean al llegar y vuelven a casa.</li><li>🏰 <b>Ícono nuevo</b>: el castillo iluminado de noche.</li><li>☀️ <b>Brother Kingdom de día</b>: colores vivos en la Villa y en el Mundo (la noche sigue disponible).</li><li>🗺️ <b>Mapa del Mundo pintado</b>: bosques, montañas, lagos, castillos, aldeas bárbaras y bestias dibujados, y el mapa sigue más allá del borde.</li><li>🎌 <b>Los edificios se adornan en cada nivel</b>: losa de piedra, estandartes, faroles, macetas, pilares con oro, aro de luz y una corona en el nivel 12.</li><li>🎥 Cámara de la Villa más baja y cercana, para ver fachadas y techos.</li><li>⏳ <b>Ya no se queda en Cargando</b>: si la cuenta o tu reino tardan en llegar, el juego sigue o te avisa con un botón para reintentar. La conexión funciona mejor en redes difíciles y en el navegador de WhatsApp.</li><li>🔷 <b>Mundo en rombo</b>: la cuadrícula se ve en diagonal y arriba hay una barra con las coordenadas (X, Y) del centro, que cambian mientras arrastras.</li><li>📜 <b>Ventana de pergamino</b> al tocar una casilla o una aldea bárbara, con dos botones grandes: Espiar (el informe llega al Correo) y Atacar.</li><li>🔍 <b>Lupa flotante</b>: toca la barra de coordenadas, escribe X e Y con el teclado de números y confirma con ✓, sin salir del mapa.</li><li>🏰 <b>Villa y Campos más de cerca</b>, con acantilados y una cascada al fondo, y caminos de tierra entre los campos y hasta la mina.</li><li>📋 <b>Cuartel en lista</b>: foto a la izquierda, nombre, cuántas tienes, una frase y la flecha para entrar.</li><li>🌐 <b>Brother Kingdom se juega con internet</b>: el juego carga más rápido (unos 27 MB menos al entrar) y, si se cae la conexión, sale un aviso hasta que vuelva.</li><li>🔄 <b>Tres vistas</b>: el botón redondo de abajo a la izquierda cambia entre Ciudad, Campos y Mundo sin recargar.</li><li>⛏️ <b>Entrada de la mina</b> en los Campos: una loma de rocas con túnel, rieles y vagoneta.</li><li>▲ <b>Menú desplegado</b>: la flecha abre una rejilla de iconos grandes en la mitad de abajo, con sus avisos rojos.</li><li>👁️ <b>Barra de acciones</b> en el Mundo al tocar algo: Ver, Marchar, Tropas y Procesos.</li><li>🛤️ <b>Mundo con vida</b>: caminos entre reinos y aldeas, carretas que van y vienen, humo de las fogatas, y minas y canteras con su propia silueta.</li><li>📋 Las tarjetas del Cuartel muestran cuántas tienes, una frase corta y una flecha para entrar.</li><li>🌍 <b>Mundo 4 veces más grande</b>: 80×80 casillas, con más bestias y 76 aldeas bárbaras de nivel 1 a 12 (más fuertes lejos del centro).</li><li>🏳️ <b>Lugares libres</b>: parcelas vacías cerca de tu reino y por todo el mapa para jugadores nuevos. Tócalas para ver dónde están o mudarte con un portal.</li><li>🔍 <b>Lupa</b>: busca cualquier coordenada X/Y y mira los reinos cercanos con su nivel y poder para ir directo a espiarlos o atacarlos.</li><li>🛖 <b>Aldeas bárbaras</b>: en el mapa se ve su nivel y el poder recomendado. Al ganar sale la ventana con cada recurso, las gemas y los objetos que ganaste.</li><li>⚔️ <b>Se quitó el botón de oleada</b> de la ciudad: los recursos se ganan afuera, en el Mundo.</li><li>📐 <b>La barra de arriba se acomoda sola</b>: perfil, reino, castillo, misión y botones de la derecha se ven completos, sin taparse, en teléfono y escritorio.</li><li>🛡️ <b>Cuartel nuevo</b>: diseño oscuro con tarjetas de tropa grandes, ficha con barras de ataque, vida, velocidad y carga, y botón dorado para entrenar.</li><li>⏩ <b>Panel Acelerar nuevo</b>: cuenta atrás grande, tus gemas, botón Finalizar ahora con su precio y la lista de aceleradores de menor a mayor, cada uno con Usar (si lo tienes) y Compra y usa. Si el acelerador cubre lo que falta, el edificio termina al momento.</li><li>✖ <b>Cancelar obra</b>: en el menú y en el panel del edificio. Recuperas la mitad de los materiales.</li><li>📜 <b>Misiones</b>: botón 📜 a la derecha con pestañas Misiones y Misión diaria, una misión recomendada arriba y tres grupos: Mejora tu ciudad, Haz más poderoso tu ejército y Haz crecer tus riquezas. Al tocar Aceptar ves cada recompensa con su cantidad.</li><li>🌿 <b>Suelo más real</b> en la ciudad y en el Mundo: pasto con textura, manchas secas y de tierra, bosques en grupos con sombras de verdad y lagos con agua brillante y orilla clara.</li><li>💎 <b>Gemas verdes</b>: la gema ahora es un diamante verde en la barra de arriba, en la tienda y en todos los precios.</li><li>🎁 <b>Ventana de recompensas</b>: al abrir un cofre, un paquete o un regalo ves cada premio con su dibujo, nombre y cantidad, y lo recoges con un botón.</li><li>⏩ <b>Usa los aceleradores desde Mis objetos</b>: eliges qué acelerar (obras, investigación, entrenamiento), ves el tiempo antes y después, y si no hay nada en curso te avisa sin gastarlo.</li><li>👨‍👩‍👦 <b>El pueblo tiene familias</b>: aventureros, mujeres con delantal, niños que corretean y ancianos de barba blanca caminan por los caminos de piedra.</li><li>🚶 <b>Habitantes nuevos</b>: los aldeanos del pueblo son aventureros con mochila que caminan de verdad por los caminos de piedra.</li><li>🛍️ <b>Tienda nueva con 5 pestañas</b>: Varios, Acelerar, Combate, Recursos y Cofres. Cada objeto muestra cuántos tienes, para qué sirve y su precio.</li><li>⏩ <b>Más aceleradores</b>: de 1 minuto a 24 horas para todo, y Arcanos solo para investigar (de 1 minuto a 3 días).</li><li>🎁 <b>Cofres y ofertas</b>: Cofre del Tesoro y packs de 7 y de 15 con precio rebajado, Cofres de mejora I a IV con piezas de equipo, y Cofre de aceleradores. También 500.000 de cada recurso, Reclutas del rey y Lingote real.</li><li>🏗️ <b>Los edificios se ven crecer</b>: del nivel 1 al 3 son humildes, de madera y techo de paja; del 4 al 6 tienen base de piedra; del 7 al 9 son de piedra clara con torres y ventanas encendidas; del 10 al 12 son de piedra blanca con oro, mucho más grandes.</li><li>🎨 <b>Cada edificio tiene su forma y su color</b>: el Cuartel es rojo con patio de entrenamiento, soldados y torre de vigilancia; la Academia es morada con una torre de estudio que crece y un globo en el nivel 12; la Enfermería es verde, con tiendas, jardín, fuente y una cruz grande. Los campos suman cultivos, troncos, piedras y carros con el nivel.</li><li>📋 <b>Ficha de cada tropa en el Cuartel</b>: al tocar una tropa se abre su ficha ahí mismo, con Ataque y Vida en estrellas, Velocidad, Carga, Mantenimiento, Poder, contra qué es débil y fuerte, y dos pestañas: Entrenar y Relevar. Si no la puedes entrenar, sale «No cumples los requisitos» con lo que pide y lo que tienes.</li><li>🖼️ Las fotos de las tropas muestran las figuras nuevas.</li><li>🌍 <b>Mapa del Mundo más real</b>: terreno continuo con pasto, praderas, bosques densos de pinos y árboles redondos, arbustos, flores, colinas con rocas, montañas con nieve y lagos con orillas naturales. El cielo reemplaza el fondo oscuro.</li><li>🛖 <b>Aldeas bárbaras</b>: chozas con techo de paja, empalizada, fogata y estandarte. Hay 16 repartidas por el mapa, de nivel 1 a 12.</li><li>📦 <b>Investigación Carga</b> (Academia → Economía): +10% de capacidad de las carretas por nivel. Junto con mejorar las carretas en el Mercado, cada ataque roba más.</li><li>🛒 Las carretas muestran la carreta de madera con su caballo en el Mercado, el Cuartel y al elegir tropas.</li><li>🛒 <b>Carretas para robar</b>: al atacar a otro jugador eliges cuántas carretas van con tu ejército. Sin carretas tus soldados cargan muy poco; cada carreta suma su capacidad al botín. Salen con las tropas, se ven en el mapa y vuelven con lo robado.</li><li>🏇 <b>Tropas marchando en el Mundo</b>: tu ataque se ve como una columna de soldados con estandarte azul yendo a la ciudad, con su camino punteado y el tiempo que falta. Los ataques que te llegan se ven en rojo viniendo hacia tu reino.</li><li>💰 <b>Vuelta con el botín</b>: si ganas, tus tropas regresan cargando el botín y los recursos entran cuando llegan a casa.</li><li>🏰 <b>Ficha de ciudad en el Mundo</b>: al tocar el reino de otro jugador, su casilla se marca en verde y sale una ventanita con su nombre, coordenadas, nivel, poder, alianza, diplomacia (Aliada, Neutral o Enemiga) y liga.</li><li>🔍 <b>Espiar</b>: manda un explorador (o paga 150 de oro a un espía) y el informe llega al Correo: castillo, muralla, tropas, botín posible y si vale la pena atacar.</li><li>⚔️ <b>Atacar</b>: eliges qué tropas van, ves tu poder contra su defensa y confirmas. Avisa si su poder es mucho mayor y si vas a perder tu protección o tu burbuja. A tu alianza no se le puede atacar: sale Reforzar.</li><li>⭐ <b>Nivel del jugador</b>: ganas experiencia construyendo, mejorando, ganando oleadas, misiones, bestias y campamentos. Arriba ves tu nivel y su barra; al lado, tu reino con sus coordenadas, y las gemas en verde abren la Tienda.</li><li>🔗 <b>Cadena de desbloqueo</b>: el Castillo pide tu nivel y la Muralla; la Muralla pide la Cantera y tu nivel; el Establo pide Cuartel nivel 2; la Herrería pide la Academia, y más. Lo que falta sale en rojo con ❌.</li><li>💎 <b>Comprar mejora</b>: si te faltan recursos, puedes completarlos con gemas y terminar al momento.</li><li>⚔️ <b>8 tropas nuevas</b>: Explorador, Miliciano, Jinete ligero, Caballería pesada, Balista, Ariete, Catapulta y Torre de asedio. En el Cuartel salen todas en lista, con candado y lo que falta para abrir cada una.</li><li>🎥 <b>Cámara nueva</b>: al entrar ves el castillo, la muralla completa y los campos de fuera en una sola pantalla, en ángulo. Al tocar un edificio la cámara lo centra y al cerrar vuelve a donde estabas.</li><li>🏰 <b>La muralla se ve siempre</b>, de piedra, con torres, foso de agua y puente de piedra en la puerta. Al mejorarla crece.</li><li>🧱 <b>Ciudad llena</b>: todas las parcelas se ven en filas con caminos de piedra; las que aún no se abren son cuadros de tierra arada.</li><li>🌊 Un <b>río</b> baja en cascada de las colinas entre rocas y rodea el reino. Las colinas son más naturales y el terreno llega hasta el horizonte.</li><li>🚶 Los aldeanos caminan por los caminos de piedra. Los caballos y las cabras pastan fuera de la muralla. El aserradero tiene rueda de agua.</li><li>📋 <b>Panel de construir nuevo</b>: tabla con lo que pide y lo que tienes (✅ / ❌), tiempo de construcción y dos botones: Construir y Instantánea (con gemas). Mientras está en obra: Acelerar y Terminar ya.</li><li>⚔️ <b>Cuartel con 3 pestañas</b>: Detalles, Entrenar tropas (lista con cuántas tienes) y En entrenamiento.</li><li>📜 <b>Misión guía</b> arriba a la izquierda: siempre dice qué hacer y da premio al reclamarla. Abajo, la obra en curso con su tiempo y botón para acelerar. Al subir el castillo sale lo que se desbloquea.</li><li>🐎 <b>Los caballos caminan de verdad</b>: mueven las patas al andar y bajan la cabeza a pastar. En la carreta van enganchados a las varas.</li><li>🐔 <b>Gallinas nuevas</b>: gallinas blancas con plumas de verdad picotean por el pueblo.</li><li>🚶 <b>El Espadachín camina de verdad</b>: mueve piernas y brazos al andar y da un golpe hacia delante al atacar.</li><li>🐎 <b>Caballos en el reino</b>: ahora pasean y pastan caballos por los campos, junto a las gallinas y las cabras.</li><li>🗡️ <b>Tropas nuevas en 3D</b>: el Espadachín, el Arquero encapuchado, el Guardián con escudo grande y la Caballería con su caballo acorazado tienen figuras nuevas con mucho más detalle. El aro del suelo muestra el rango (plateado II, azul III, dorado IV).</li><li>🛒 <b>Carretas nuevas</b>: en el mapa del mundo las carretas son de madera con un caballo tirando.</li><li>🌍 <b>Mundo fuera de la ciudad</b>: el botón Mundo aleja la cámara y sales al mapa a pantalla completa. Arriba ves las coordenadas y abajo el botón 🏰 Mi ciudad para volver.</li><li>🐗 <b>Bestias</b>: jabalíes, lobos y osos de nivel 1 a 10 por el mapa. Tócalas para ver su nivel, el poder recomendado y las recompensas, y pulsa Atacar. Vuelven a salir a los 30 minutos.</li><li>🔍 <b>Buscar</b>: elige bestias, campamentos o casillas y un nivel; te lleva a la más cercana y te dice el poder recomendado máximo.</li><li>🌾 Las casillas del mundo muestran su edificio, capacidad y recolección por hora, con el botón Recolectar.</li><li>🟦 <b>Territorio de alianza</b>: las casillas de tu alianza se ven en azul con su molino, aserradero, mina o cantera, y los reinos aliados llevan estandarte.</li><li>🛡️ <b>Alianza completa</b>: Guerra, Cajas, Territorio, Batalla de alianza, Tienda, Tecnología, Poder, Ayuda, Miembros, Incentivo y Ajustes. Ganas puntos de alianza cazando bestias, venciendo campamentos y con el incentivo diario.</li><li>🎁 <b>Cajas de alianza</b>: cada 100 puntos sale una caja; reclama los regalos uno a uno o todos (hasta 20 por día).</li><li>📬 <b>Correo con pestañas</b>: Guerras, Alianza, Sistema, Informes y Marcados, cada una con sus mensajes sin leer. Los informes de batalla y de bestias traen las recompensas para reclamar. Botones Eliminar leídos y Leer y reclamar todo.</li><li>🪖 <b>Escuadrones en Tropas</b>: ahora ves a tus soldados en formación (no uno solo), con cuántos tienes y cuántos se están entrenando.</li><li>⭐ <b>Las tropas cambian de forma con el rango</b>: I de cuero y madera, II con acero y escudo con borde, III con placas, visera y escudo azul, y IV premium dorado y azul con escudo y arma grandes y capa. La fila de rangos muestra cuántos tienes de cada uno.</li><li>🫧 <b>Burbuja de protección</b> para los que empiezan: 7 días sin que te ataquen (o hasta el Castillo nivel 5). Cubre toda tu ciudad y se ve en el mapa con los días que quedan.</li><li>🛒 <b>Carretas</b>: se entrenan en el Mercado y se mejoran para cargar más. Llevan los recursos al mandarlos a tu alianza y al recolectar tus casillas del mundo, y se ven viajando en el mapa.</li><li>📣 <b>Pedidos de alianza</b>: pide refuerzos para defender o para atacar (cuantos más según tu nivel de caballero) y pide recursos; tus compañeros donan y se ve quién donó y cuánto falta.</li><li>🎨 <b>Iconos nuevos en el menú de abajo</b>: cada botón tiene su dibujo propio con relieve y marco dorado (Campaña, Tropas, Inventario, Edificios, Tienda, Alianza y Mundo).</li><li>⚔️ <b>Aviso de ataque chiquito</b> arriba a la izquierda: quién te ataca y cuánto falta, sin tapar la ciudad. Tócalo y eliges tú: Defender o Usar portal.</li><li>📬 <b>Buzón</b>: las novedades ya no tapan el reino al entrar. Llegan al buzón (botón 📬 a la derecha) con un punto rojo si no las leíste.</li><li>🔢 Los números de los botones de abajo solo cuentan lo <b>nuevo</b> y se borran al entrar.</li><li>🏷️ <b>Nombres nuevos del menú</b>: Campaña, Tropas, Inventario, Edificios, Tienda, Alianza y Mundo.</li><li>🔬 <b>Investigar por tropa</b>: en Tropas, botón Investigar para Ataque, Vida, Defensa y Velocidad de cada tipo. Es la misma investigación de la Academia y muestra cuánto sube tu Poder.</li><li>🎒 <b>Inventario con pestañas</b>: Recursos, Acelerar, Ingresos, Equipo y Otros, con punto rojo en lo nuevo. Las piezas de equipo se mejoran desde ahí y suben el Poder.</li><li>🌀 <b>Portales contra ataques</b>: el aviso de ataque trae el botón Usar portal. Si te mudas antes de que llegue el ataque, se cancela. Un portal cada 24 horas y 1 hora sin atacar después de mudarte.</li><li>🪟 Los paneles son más pequeños y centrados: se ve el reino alrededor.</li><li>🧱 <b>Ciudad ordenada</b>: cada edificio va en su propia parcela, centrado y con aire alrededor, con caminitos entre parcela y parcela. Ya no se tocan ni tocan la muralla.</li><li>➕ <b>Parcelas nuevas</b>: todas iguales, con borde de piedra, marco de pasto y un + para construir. Tócala y se abre Construir. Los campos de fuera tienen el mismo estilo.</li><li>🏰 La muralla es más grande para que quepan todas las parcelas.</li><li>🏰 <b>Entras directo a tu reino</b>: ya no sale el cartel de bienvenida. Los botones de idioma (ES/EN) y cerrar sesión (⏻) están arriba, junto a tus recursos.</li><li>🎥 <b>Cámara nueva</b>: más lejos y con el castillo de frente, para ver todo el reino.</li><li>⏱️ <b>Construir y mejorar toma tiempo</b>: minutos al principio y horas en los niveles altos. Cada nivel cuesta más que el anterior.</li><li>📋 <b>Trabajos</b>: para subir el castillo y los edificios hay que ganar oleadas, recolectar, entrenar tropas y vencer campamentos. El botón dice qué falta.</li><li>⚔️ <b>Entrenar toma tiempo de verdad</b> (minutos para pocas tropas, horas para muchas). Se acelera con aceleradores; la cola se ve arriba a la derecha.</li><li>📘 Los libros y pergaminos de los héroes ya no se venden: se ganan en oleadas, campamentos y el cofre diario.</li><li>🛡️ <b>Botón ⚔️ ON/OFF</b>: decide si tus tropas defienden cuando te atacan (si defienden, pueden morir).</li><li>🧰 <b>Equipo de héroes</b>: 6 espacios (arma, casco, pechera, guantes, botas y amuleto). Cada pieza tiene rareza y nivel, se mejora y da daño, vida, defensa, velocidad o recarga. Botones Equipar rápido y Desequipar todo.</li><li>🎁 Las piezas salen en oleadas, campamentos y en el Cofre de equipo del Colmado. ¡Te regalamos 2 para empezar!</li><li>💬 <b>Chat</b>: botón 💬 a la derecha con pestañas Global y Hermandad, en vivo. Toca el nombre de alguien para bloquearlo o reportarlo; los insultos se tapan solos.</li><li>🌀 <b>Portales de teletransportación</b>: muda tu reino a otro lugar del mapa del mundo. Portal al azar (lugar libre al azar) o Portal elegido (toca una casilla libre en el mapa y elige Mover mi reino aquí). Con columna de luz y aro mágico.</li><li>🚨 <b>Aviso de ataque</b>: si alguien te ataca, sale una alerta roja con sonido, quién es y cuánto falta para que llegue. Tócala para ir a tu ciudad y preparar la defensa.</li><li>🏇 Los ataques ahora tardan en llegar (1 a 3 minutos) y se deciden al llegar, con la defensa que tengas en ese momento.</li><li>👁️ <b>Puesto de vigía</b> nuevo: ves la fuerza de quien te ataca y tu reino defiende más.</li><li>🏗️ <b>5 edificios nuevos</b>: Almacén (protege recursos de los saqueos), Mercado (cambia recursos y envíalos a tu hermandad), Herrería (forja armas: más daño), Establo (caballería) y Galería de tiro (arqueros).</li><li>⏱️ <b>Aceleradores</b> de 1 min, 5 min, 15 min, 1 hora, 8 y 12 horas para obras, entrenamientos e investigación. Toca Acelerar en el edificio.</li><li>🌍 <b>Mapa del mundo nuevo en 3D y en cuadrícula</b>: llanuras, bosques, colinas, lagos y montañas. Arrastra para moverte y pellizca para acercar.</li><li>🚩 <b>Conquista casillas</b>: gana a sus guardianes y su bonus ayuda a tus campos (bosque → madera, colina → piedra, lago y llanura → comida, montaña → oro). Puedes tener tantas como el nivel de tu Castillo.</li><li>⛺ Ahora puedes atacar los campamentos de trasgos para ganar botín.</li><li>🧨 <b>Demoler</b>: toca un edificio y elige Demoler (te pregunta antes). La parcela queda libre para construir otra cosa.</li><li>🔓 <b>Parcelas por nivel del Castillo</b>: con el Castillo nivel 1 tienes 4 parcelas y cada nivel abre 3 más (hasta 37). Las próximas se ven con un candado.</li><li>🗺️ <b>Reino en cuadrícula</b>: la ciudad tiene parcelas ordenadas y cada edificio muestra su nombre y nivel.</li><li>🌾 <b>Campos fuera de la muralla</b>: Granja, Aserradero, Mina de oro y Cantera (nueva). Guardan lo que producen, incluso con el juego cerrado: tócalos y pulsa Recolectar.</li><li>🔁 Tus granjas, aserraderos y minas se mudaron solos a los campos con su nivel (la mina vieja ahora es Cantera).</li><li>⚔️ <b>Ataca a otros jugadores</b> desde el mapa de Islas, aunque sean más poderosos. Ahora hay una escena de batalla con los dos ejércitos, x2 y Saltar.</li><li>🔄 El juego avisa cuando hay una versión nueva y se actualiza solo.</li><li>✨ <b>Habilidades con nivel</b>: en la ficha del héroe, pestaña Habilidades. El Poder sube hasta nivel 5 (cada estrella abre un nivel) y se ve qué mejora: más daño, más duración y menos recarga.</li><li>💪 <b>Talento</b> nuevo para cada clase: se abre con 2★.</li><li>📜 Pergaminos de habilidad: se ganan en las oleadas y en el Colmado.</li><li>🏹 Los héroes de distancia lanzan su poder desde más lejos y avanzan hacia los enemigos.</li>', novedades_ok: '¡A jugar!',
    poder: 'Poder', cuenta: 'Cuenta', correo: 'Tu correo', entrar: 'Entrar',
    correo_no: 'Ese correo no es de una cuenta de dueño.', cuenta_jugador: 'Jugador invitado',
    dueno_activo: '👑 Modo DUEÑO activado', dueno_titulo: 'Menú del dueño (pruebas)',
    dueno_txt: 'Solo para probar. No se puede vender ni dar a otros jugadores.',
    gemas_max: '99.999 gemas', oro_inf: 'Oro infinito', vel10: 'Velocidad x10',
    saltar_oleada: 'Ir a la siguiente oleada', salir_dueno: 'Salir del modo dueño', todo_max: '🚀 Todo al máximo (tropas, niveles, héroes)', todo_max_ok: '👑 ¡Todo al máximo! {n} tropas con Armadura de Dragón.', todo_max_oleada: 'Espera a que termine la oleada.',
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
    sin_espacio: 'No room: upgrade or build more Barracks.', pob_llena: '👥 Your population is full: build or upgrade Cottages to train more troops.', pob_obreros: '👥 Not enough workers: every build needs {n} free population. Build or upgrade Cottages.',
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
    tr_titulo: 'Tasks to level up', tr_oleadas: 'Win {n} waves', tr_recolectas: 'Collect from your fields {n} times', tr_tropas: 'Train {n} troops', tr_campamentos: 'Beat {n} barbarian village 🛖 or villa on the World map', tr_falta: '🔒 A task is missing: {t}', tr_bloqueado: '🔒 Finish the tasks to upgrade', mat_titulo: 'Materials to level up', mat_peq: '📘 Small book (+300 EXP): earned in waves and the daily chest', mat_gra: '📗 Big book (+1500 EXP): earned by beating goblin camps and in the daily chest', mat_perg: '📜 Scroll (skills): earned in waves', mat_falta: 'You need books: play waves and beat camps to get them.', mat_no_tienda: 'These materials are not sold at the Market: you earn them by playing.', mat_ganado: '📘 +{n} experience book(s) for your heroes', def_on: '⚔️ ON', def_off: '⚔️ OFF', def_titulo: 'Troops defend', def_on_txt: 'Your troops defend the kingdom when you are attacked. Careful: they can die and you will have to train new ones!', def_off_txt: 'Your troops stay inside and do not defend: they will not die, but your kingdom defends only with the castle, the wall and the towers.', acel_recorta: 'cuts {t}', entreno_cola_pill: 'Training', rama_tropas: 'Troops', inv_de_tropa: '{n} research', investigar_tropa: '🔬 Research', poder_sube: '+{n} Power', poder_subio: '💪 Your Power went up to {n}!', buzon: 'Mailbox', buzon_titulo: '📬 Mailbox', buzon_vacio: 'You have no new messages.', buzon_nov: 'What\'s new in version {v}!', buzon_leido: 'Read', buzon_otras: 'Older versions', inv_tab_recursos: 'Resources', inv_tab_acelerar: 'Speed-ups', inv_tab_ingresos: 'Income', inv_tab_equipo: 'Gear', inv_tab_otros: 'Other', inv_vacio_tab: 'Nothing here yet.', inv_equipada: 'Equipped on {n}', inv_libre: 'Not equipped', inv_mejorar_pieza: 'Upgrade', inv_recurso_txt: 'What you have stored right now.', al_portal: '🌀 Use portal', tel_cancelado: '🌀 You moved in time: the attack from {n} was canceled and their troops go back.', tel_espera24: 'You already used a portal: wait {t} to use another.', tel_batalla: 'The battle already started: you can no longer use the portal.', tel_no_atacar: 'You just moved: you cannot attack for {t}.', cas_terreno: 'Terrain', cas_coord: 'Coordinates', cas_ocupada_por: 'Occupied by', cas_libre_corto: 'Free', cas_reubicar: '🌀 Relocate', cas_ocupar: '🚩 Occupy', cas_tu_reino: 'Your kingdom', cas_campamento: 'Barbarian village', tel_elige_casilla: '🌀 Tap a free tile on the map and press Relocate.', mar_cancelada: '🌀 {n} moved with a portal before you arrived. Your troops go back without fighting.', burbuja_txt: '🫧 Protection bubble: nobody can attack you for {t}. You lose it when your Castle reaches level {n} or if you attack someone.', burbuja_perdida: '🫧 Your protection bubble ended. You can be attacked now.', car_titulo: 'Carts', car_txt: 'They carry your resources across the world map. Train them like troops and upgrade them to carry more.', car_tienes: 'You have {n} · free {l} · {c} load each', car_entrenar: 'Train ×{n}', car_entrenando: 'Training {n} · next in {t}', car_mejorar: 'Upgrade to level {n} ({c} load)', car_max: 'Carts at max level', car_faltan: 'You need {n} free carts (you have {l}). Train more at the Market.', car_necesitas_mercado: 'Build a Market to train carts.', car_en_camino: '🛒 {n} on the way', car_volvieron: '🛒 Your carts came back with {b}', car_salen: '🛒 {n} carts leave · arrive in {t}', car_listas: '🛒 {n} cart(s) ready!', car_mejoradas: '🛒 Carts level {n}: now carry {c} each', car_nivel: 'Level {n}', car_estado: '🛒 Free carts: {l}/{n}', cas_guardado: 'Stored: {a} / {m} {r} · +{h} per hour', cas_recolectar: '🛒 Collect', cas_nada: 'Nothing to collect here yet.', nivel_caballero: 'Your knight level is {n}: you can ask for up to {m} troops.', ped_titulo: 'Alliance requests', ped_def: '🛡️ Troops to defend', ped_atk: '⚔️ Troops to attack', ped_rec: '📦 Ask for resources', ped_cantidad: 'Amount', ped_crear: '📣 Ask', ped_mio: 'Your request', ped_de: '{n}\'s request', ped_faltan: '{n} to go', ped_donaron: 'Donated: {l}', ped_nadie: 'Nobody has donated yet.', ped_completo: '✅ Request complete!', ped_quitar: 'Remove', ped_mandar_tropas: 'Send troops', ped_donar: 'Donate', ped_donar_txt: 'Donate from your own resources: they travel in carts and take time to arrive.', ped_hecho: '📣 Request sent to your alliance!', ped_donado: '🎁 You donated {n} to {q}', ped_motivo_defender: 'to defend', ped_motivo_atacar: 'to attack', ped_ninguno: 'No requests right now.', ped_atk_btn: '📣 Ask for troops for this attack', ped_tropas: 'troops', ped_ya_tienes: 'You already have a request of this type: remove it to make another.', ped_llegan: 'Resources arrive in carts as your allies donate.', esc_tienes: 'You have {n}', esc_entrenando: 'Training {n}', hola: 'Hi, {n}!', salir_txt: 'Your game stays saved in the cloud. Are you sure you want to sign out?', cerrar_sesion: 'Sign out', cargando: 'Loading...', guardado_nube: 'Saved to the cloud ☁️',
    cuenta_de: 'Signed in as', entrar_o_crear: 'Sign in or create account',
    e_clave: 'Wrong username or password.', e_existe: 'That username already exists. Pick another or sign in.',
    e_debil: 'Password must have 6 or more characters.', e_usuario: 'Invalid username: use 3 to 20 letters, numbers, _ or dot.',
    e_red: 'No internet. Check your connection.', e_muchos: 'Too many tries. Wait a bit.',
    e_general: 'Something went wrong. Try again.', e_repetir: 'Passwords do not match.',
    e_sin_nube: 'Accounts are not available right now (no internet).',
    gemas_inf: 'Infinite gems',
    r_oro: 'gold', r_comida: 'food', r_madera: 'wood', r_piedra: 'stone', r_hierro: 'iron', r_gemas: 'gems', r_amatista: 'Runic amethyst',
    falta: 'You need more {r}.', costo: 'Costs', produce_txt: 'Makes {n} {r} every {s} s',
    comen: 'Your troops eat {n} food per minute.', sin_comida: '🍞 Food at 0: your troops still fight at 100%. Build Farms or send food from another village.',
    impuesto: 'The castle collects {n} gold every {s} s.', recursos_inf: 'Infinite resources',
    c_aserradero: 'Now place a Sawmill: it gives wood to build.', c_mina: 'Tip: a Mine gives stone for towers and the wall.',
    c_barricada: 'Tip: place a Barricade on the road to slow enemies down.',
    colocando_barr: 'Pick a spot on the road for the Barricade', punto_ocupado: 'There is already a Barricade there.',
    barr_rota: '🚧 A Barricade was broken!', barr_arreglo: 'Barricades repair themselves when the wave ends.',
    madera_nivel: 'wooden', piedra_nivel: 'stone',
    t_aliada: 'Your troop', t_enemigo: 'Enemy', t_invocada: 'Summoned with gems (does not use a barracks spot)', t_heroe: 'Hero: heals slowly over time',
    t_lenta: 'Speed', t_ritmo: 'Attacks every {s} s', t_oro: 'Drops {n} gold when defeated', t_hambre: 'Hungry: hits weaker',
    armadura: 'Armor', mejorar_armadura: 'Upgrade armor', armadura_sube: 'Level {n}: +{v}% health, +{d}% defense',
    armadura_max: 'Dragon armor at max ★★★★', defensa: 'Defense', armadura_lista: '🛡️ {t} armor level {n}! You can see it on your troops.',
    b_conquista: 'Campaign', b_heroes: 'Heroes', b_mochila: 'Inventory', b_tienda: 'Shop',
    p_conquista: 'Campaign', p_heroes: 'Troops', p_mochila: 'Inventory', p_tienda: 'Shop', sub_tropas: 'Troops', sub_invocar: 'Summon',
    conquista_txt: 'Defend the kingdom from each wave. Win it to earn experience, books, scrolls and speed-ups.', oleada_curso: 'Wave in progress: {n} enemies left.',
    vienen: 'Coming:', oleadas_ganadas: 'Waves won',
    diario_titulo: 'Daily chest', diario_txt: 'Come back every day for a better chest. Miss a day and the streak starts over.',
    diario_dia: 'Day {n}', diario_reclamar: '🎁 Claim day {n} chest', diario_listo: 'Already claimed today. Come back tomorrow for day {n}.',
    diario_racha: '🔥 Streak: {n} days in a row', mochila_vacia: 'Your chest is empty. Get chests from the daily chest or the Market.',
    mis_objetos: 'Your items', usar: 'Use', abrir: 'Open', recibiste: '🎁 You got: {t}', tropas_regalo: '{n} troops',
    tienda_txt: 'Buy with gems. What you buy goes to your Chest 🧳. Gems are won in waves and from the daily chest.',
    tienda_real: 'Real-money purchases: coming with the App Store version.', comprar: 'Buy', comprado: '{n}: saved in your Chest 🧳',
    acelerador_usado: '⏩ You took 1 hour off all buildings!', sub_heroes: 'Heroes', heroes_txt: 'Your heroes come out of the castle every wave and use their power. Take up to 3 in your team.', reclutar: 'Recruit hero', reclutar_gratis: '🎁 Free today', reclutar_txt: 'Each pull gives 1 to 5 medals of a hero. Complete its medals and the hero joins you; if you already have it, they raise its stars.', heroe_nuevo: '🎉 New hero: {n}!', heroe_frag: '+{f} {n} shards', equipo_n: 'Team: {n}/3', en_equipo: 'TEAM', poner_equipo: '➕ Add to team', quitar_equipo: '➖ Remove from team', equipo_lleno: 'Your team already has 3 heroes. Remove one first.', subir_nivel: 'Level up', subir_estrella: '⭐ Raise star', nivel_tope: 'Raise a star to go above level {n}.', fragmentos: 'Shards', poder_heroe: 'Power', bloqueado: '🔒 Get it by recruiting', rareza_comun: 'Common', rareza_raro: 'Rare', rareza_legendario: 'Legendary', rareza_mitico: 'Mythic', clase_infanteria: 'Infantry', clase_arquero: 'Archer', clase_magia: 'Magic', clase_guardian: 'Guardian', heroe_sube: '⬆️ {n} reached level {v}!', heroe_estrella: '⭐ {n} now has {v} stars!', volver: '⬅ Back', resultado: 'Result', estrellas_max: '★ Max stars', cada_s: 'every {s} s', ref_titulo: '📣 Reinforcements', ref_txt: 'Your troops can defend an ally’s kingdom: they fight in their waves and add to their defense. You can call them back any time.', ref_pedir: '📣 Ask for reinforcements', ref_pedido_hecho: '📣 You asked your guild for reinforcements.', ref_quitar_pedido: 'Remove request', ref_pedidos: 'Asking for help', ref_ninguno: 'Nobody is asking for help right now.', ref_reforzar: '🛡️ Reinforce', ref_en_reino: 'Reinforcements in your kingdom', ref_enviados: 'Your reinforcements sent', ref_devolver: 'Send back', ref_retirar: 'Call back', ref_de: '{n} troops from {q}', ref_a: '{n} troops in {q}’s kingdom', ref_enviar_a: 'Send reinforcements to {q}', ref_tienes: 'You have {n}', ref_enviar: '🛡️ Send reinforcements', ref_enviado: '🛡️ Reinforcements sent to {q}!', ref_volvieron: '🛡️ {n} troops came back from {q}’s kingdom', ref_error: 'Could not do it. Check your internet and that you are both in the same guild.', ref_en_oleada: 'Wait until the wave ends.', ref_nada: 'Choose at least one troop.', ref_llegaron: '🛡️ Reinforcements arrived from {q}!', ref_devueltos: 'You sent the reinforcements back.', ref_retirados: 'Your troops are coming home.', ref_nadie: 'No reinforcements yet.', toca_tu_castillo: '👑 Tap your castle to enter your city', entrar_ciudad: 'Enter', bienvenido_ciudad: '🏰 Welcome to your city!', armaduras_tienda: '🛡️ Armor', armaduras_tienda_txt: 'Give armor to a troop type: every troop of that type (and new ones) wears it.', armadura_para: 'Armor {n} — {t}', entrenando_n: '⚔️ Training {n} troops', maximo: 'Max', terminar_ya: 'Finish now', terminado_gemas: '💎 Done!', escudo_activo: '🛡️ Shield active: {t} left. Wait until it ends to use another one.', escudo_activo_btn: 'Active: {t}', nada_acelerar: 'Nothing is being built or trained.', exp_llena: 'Raise a star to continue', hv_equipo: 'Gear', eq_arma: 'Weapon', eq_casco: 'Helmet', eq_pechera: 'Chestplate', eq_guantes: 'Gloves', eq_botas: 'Boots', eq_amuleto: 'Amulet', eq_r_comun: 'of iron', eq_r_raro: 'of silver', eq_r_legendario: 'of the sun', eq_r_mitico: 'mythic', eq_rapido: '⚡ Quick equip', eq_quitar_todo: 'Unequip all', eq_vacio: 'Empty', eq_equipar: 'Equip', eq_quitar: 'Remove', eq_fundir: 'Melt', eq_de: 'worn by {n}', eq_ninguno: 'You have no pieces of this kind. Win them in waves and camps, or open a Gear chest.', eq_nueva: '🧰 New piece: {n}!', eq_fundida: '🔥 You melted {n}: +{o} 🪙', eq_mejorada: '⬆️ {n} reached level {v}', eq_bonos: 'From gear: {t}', eq_dano: 'Damage', eq_vida: 'Health', eq_def: 'Defense', eq_vel: 'Speed', eq_recarga: 'Cooldown', eq_nada_que: 'No free pieces to equip.', eq_listo: '⚡ Gear equipped', eq_fundir_txt: 'Melt {n}? Gives {o} gold and the piece disappears.', eq_tienes: 'Pieces: {n}', p_chat: 'Chat', chat_global: 'Global', chat_hermandad: 'Guild', chat_escribe: 'Write a message…', chat_enviar: 'Send', chat_cuenta: 'Create an account to chat with other players.', chat_sin_alianza: 'Join a guild to talk with it.', chat_vacio: 'No messages yet. Say hi!', chat_espera: 'Wait a moment before writing again.', chat_error: 'Could not send. Check your internet.', chat_bloquear: 'Block', chat_desbloquear: 'Unblock', chat_reportar: 'Report', chat_borrar: 'Delete', chat_bloqueado: '🚫 You will no longer see messages from {n}.', chat_reportado: '🚩 Thanks. We will review the message from {n}.', chat_bloqueados: 'Blocked: {n}', chat_normas: 'Be kind. Insults are hidden and you can report or block anyone by tapping their name.', chat_tu: 'You', tel_aqui: 'Move my kingdom here', tel_tienes: 'Portals: {n}', tel_ok: '🌀 Your kingdom moved to {x}, {y}!', tel_oleada: 'You cannot move during a wave.', tel_marcha: 'Wait for your marching troops to come back.', tel_atacado: 'You cannot flee: an attack is on its way.', tel_ocupada: 'That tile does not work: pick free land (no lakes, mountains, kingdoms or camps).', tel_elegir: 'Open the world map and tap a free tile to move.', tel_sin: 'You have no portals: buy them at the Market.', tel_titulo: 'Move your kingdom?', tel_txt: 'Your kingdom moves to {x}, {y}. Your conquered tiles stay yours.', vig_txt: 'Defense +{n}%', vig_ve: 'You see the attacker strength', al_decide: 'What do you want to do?', al_defender: 'Defend', al_portal_corto: 'Use portal', al_te_ataca: '⚔️ {n} is attacking you!', al_llega: 'Arrives in {t}', al_mas: '+{n} more', al_fuerza: 'Strength ~{f} · your defense {d}', al_sin_vigia: 'Build a Watch post to see their strength', al_tocar: 'Tap to defend your city', mar_hacia: '🏇 Your troops are heading to {n}', mar_llega: 'Arrive in {t}', mar_salen: '🏇 Your troops left! They reach {n} in {t}.', mar_error: 'Could not send the attack. Check your internet.', mb_vigilar: 'Watch', p_vigia: 'Watch post', vig_entrantes: 'Incoming attacks', vig_salientes: 'Your marches', vig_nada: 'All quiet for now.', acel_titulo: 'Speed up', acel_falta: 'Left: {t}', acel_usar: 'Use', acel_usado: '⏩ You took off {t}', acel_todo: 'Royal speed-up: 1 hour off all buildings and finishes training', acel_desde_menu: 'Use it from a building menu (Speed up button) or in the training queue.', acel_listo: '✅ Done!', acel_cola: 'Speed up training', protege_txt: 'Protects {n} of each resource', tasa_txt: 'Trade: 100 → {n}', herreria_txt: 'Weapons up to level {n}', necesitas_establo: 'You need a Stable to train cavalry.', necesitas_galeria: 'You need an Archery range to train archers.', necesitas_cuartel_t: 'You need Barracks to train this troop.', mb_comerciar: 'Trade', mb_forjar: 'Forge', p_mercado: 'Market square', p_herreria: 'Forge', mer_cambiar: 'Trade resources', mer_das: 'You give', mer_recibes: 'You get', mer_cambio_ok: '⚖️ You traded {a} for {b}', mer_enviar: 'Send to your guild', mer_a: 'To', mer_enviar_btn: '📦 Send', mer_enviado: '📦 You sent resources to {n}', mer_sin_alianza: 'Join a guild to send resources.', mer_sin_cuenta: 'Create an account to send resources.', mer_nadie: 'Nobody else is in your guild.', mer_recibiste: '📦 {n} sent you {b}', mer_error: 'Could not send. Check your internet.', mer_nada: 'Choose what to send.', her_armas: 'Weapons', her_armadura: 'Armor', her_armas_sube: 'Weapons {n}: +{d}% damage', her_necesita: 'Forge level {n}', her_sin: 'Build a Forge to make weapons.', armas_lista: '⚒️ Weapons {n} for {t}!', mundo_toca: '🔍 Find and scout your enemies before attacking. Tap a tile on the map to see what is there. Drag to move and pinch to zoom.', cas_llanura: 'Plains', cas_bosque: 'Forest', cas_colina: 'Hill', cas_lago: 'Lake', cas_montana: 'Mountain', cas_guardianes: 'Guardians', cas_tuya: '🚩 This tile is yours: it gives its bonus to your fields.', cas_abandonar: 'Abandon', cas_abandonar_txt: 'The tile becomes free and you lose its bonus.', cas_de: '🚩 Owned by {n}.', cas_quitar: 'Attack and take it', cas_libre: 'Conquer it to get its bonus. You have {n} of {m} tiles (upgrade the Castle for more).', cas_conquistar: 'Conquer', cas_maximo: 'You already have {n} tiles. Upgrade the Castle to conquer more.', cas_ganada: '🚩 Tile conquered! Its bonus now helps your fields.', cas_perdida: 'The guardians held.', cas_mias: 'Your tiles: {n}/{m}', camp_atacar: 'Attack the camp', camp_espera: 'The goblins are regrouping: come back in {t}.', camp_perdio: 'The goblins held.', mb_demoler: 'Demolish', demoler_titulo: 'Demolish {n}?', demoler_txt: 'The building (level {v}) is removed and the plot becomes free. Materials are not returned.', demoler_si: 'Yes, demolish', cancelar: 'Cancel', demolido: '🧨 {n} demolished. The plot is free.', demoler_oleada: 'You cannot demolish during a wave.', parcela_cerrada: '🔒 Upgrade the Castle to level {n} to open this plot.', parcelas_nuevas: '🔓 {n} new plots in your city!', mb_recolectar: 'Collect', recolectado: '+{n} {r}', guarda_hasta: 'Stores up to {n}', solo_campo: 'That building goes in the fields outside the wall.', solo_ciudad: 'That building goes inside the city.', campo_libre: 'Free field', parcela_libre: 'Free plot', sin_campo: 'No free fields.', recolectar_todo: 'Collect all', bp_saltar: 'Skip', bp_volver: 'Back to map', bp_victoria: 'Victory!', bp_derrota: 'Defeat', version_nueva: 'New version {v} available: tap to update', hv_atributos: 'Attributes', hv_habilidades: 'Skills', hv_poder: 'Power', hv_talento: 'Talent', hv_extra: 'Extra damage', hv_dur: 'Duration', hv_dano: 'Damage', hv_saltos: 'Jumps', hv_alrededor: 'Splash', hv_flecha: 'Per arrow', hv_radio: 'Radius', hv_menos: 'Damage taken', hv_mareo: 'Stun', hv_cura: 'Heal', hv_recarga: 'Cooldown', hv_dano_heroe: 'Hero damage', hv_vida_heroe: 'Hero health', hv_necesita: 'Reach {n}★ to unlock the next level.', pergaminos_tienes: 'Scrolls: {n} (earned in waves and at the Market)', sin_pergaminos: 'You need more skill scrolls: earn them in waves or at the Market.', hab_sube: '✨ {h} reached level {n}', tal_infanteria: 'Strong arm', tal_infanteria_txt: 'The hero hits harder.', tal_arquero: 'Sharp eye', tal_arquero_txt: 'More damage and more range.', tal_magia: 'Quick mind', tal_magia_txt: 'Their power recharges faster.', tal_guardian: 'Rock skin', tal_guardian_txt: 'The hero lasts much longer.', usar_libros: 'Books', sin_libros: 'You have no experience books. Buy them at the Market.', libros_usados: 'You used {n} experience books.', libro_en_heroe: 'Use it from the hero panel: Guard → Heroes.', estrellas: 'Stars', estrella_da: 'At {a}★: +20% health and damage, and max level {n}.', subir_estrella_c: 'Raise', obtener_mas: 'Get more', ir: 'Go', reclamar: 'Claim', heroes_premio: '🦸 Your team earned {x} XP and {n} got {f} shards', ob_oferta: 'Daily offer', ob_oferta_txt: '{n} free shards, once a day', ob_canje: 'Exchange', ob_canje_txt: '{n} shards of this hero', ob_reclutar: 'Recruit', ob_reclutar_txt: 'Duplicates give {n} shards', ob_oleadas: 'Waves', ob_oleadas_txt: 'Winning gives your team XP and shards', ob_diario: 'Daily chest', ob_diario_txt: 'Rewards every day in the Chest', ob_tienda: 'Shop', ob_tienda_txt: 'Experience books', mb_detalles: 'Details', mb_terminar: 'Finish', mb_acelerar: 'Speed up', mb_investigar: 'Research', mb_sin_acelerador: 'You have no speed-ups: get them at the Market or in chests.', pest_cuartel: 'Barracks', pest_establo: 'Stable', pest_tiro: 'Archery range', rango: 'Rank', rango_bloq: '🔒 Rank {r} is locked. Upgrade the armor to unlock it.', rango_antes: '🔒 Unlock rank {r} first.', subir_rango: 'Upgrade to rank {r}', entrenadas_ya: '⚔️ {n} × {t} ready!', sin_recursos_tropa: 'You do not have enough materials to train this troop.', terminar_cola: 'Finish training',
    p_investigar: 'Research', investigar: 'Research', rama_crecimiento: 'Growth', rama_economia: 'Economy', rama_batalla: 'Battle',
    inv_txt: 'Each technology really improves something in your kingdom. Only one at a time.', inv_ahora: 'Now', inv_siguiente: 'Next',
    inv_en_curso: 'Researching: {n} (level {l})', inv_falta: '{s} s left', inv_ocupada: 'The Academy is already researching.',
    inv_tope: 'Upgrade the Academy to go past level {n}.', inv_lista: '📜 {n} level {l} done!', inv_necesitas: 'Build an Academy to research.',
    inv_abrir: '📜 Open research', c_academia: 'Tip: build an Academy to research upgrades.',
    b_mundo: 'World', b_alianza: 'Alliance', p_mundo: 'World map', p_alianza: 'Alliance',
    mundo_cuenta: 'Create an account to appear on the isles map and join a crew.',
    mundo_cargando: 'Loading the map...', mundo_error: 'Could not load the map. Check your internet.',
    mundo_solo: 'For now you are the only kingdom on the map. Invite your friends to play!',
    leyenda_tu: 'You', leyenda_alianza: 'Your crew', leyenda_otros: 'Other kingdoms', leyenda_trasgos: 'Barbarians',
    tu_reino: 'Your kingdom', reino_de: '{n}\'s kingdom', campamento: 'Barbarian village',
    campamento_txt: 'Barbarian warriors live here with the loot they stole. Beat them and keep it.', sin_alianza: 'No crew',
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
    borrar_cuenta_ok: 'Delete forever', cuenta_borrada: 'Your account was deleted.', privacidad: 'Privacy', novedades: 'What\'s new!', novedades_lista: '<li>🎥 Switching City, Fields and World no longer jumps: the camera glides and zooms out smoothly, and the World opens from your kingdom.</li><li>🗺️ Every world card looks the same (land, beasts, barbarian villages): only the information changes.</li><li>🔄 The game updates itself: no more «tap to update» banner.</li><li>💎 Gems are no longer given as rewards: quests, chests, waves, camps, tournament, alliance and promotions now give gold, resources and items.</li><li>🔤 Bottom button names are now easy to read.</li><li>👆 Windows (Shop, Inventory, buildings, menu…) close by themselves when you tap or swipe on the map.</li><li>🗺️ The world map uses the whole screen: no «World map» label or X. Use the bottom-left button to go back to your city.</li><li>🗺️ <b>Clean world map</b>: no names over tiles, no View/March/Troops/Activity row, coordinates in a thin strip on top, cards close when you drag, no Relocate button, and your kingdom opens its own card.</li><li>🏯 <b>Fortress</b> (in Troops): send heroes to Explore 4 times a day for experience, fragments and resources.</li><li>🌳 <b>Talent tree</b> in the Academy: Military and Civil tabs, each talent with its level, joined by lines.</li><li>🧾 <b>Hero card</b>: portrait with level, attack, health, power and bar; Withdraw, Raise and Gear buttons; Skill, Destiny and Legend tabs.</li><li>⭐ <b>Raise hero</b>: window with what it gains and its requirements, missing ones in red.</li><li>🦸 <b>New hero list</b>: List and Skill tree tabs, and every hero in a grid with portrait, crown, level and name (even the ones you do not have yet).</li><li>🏰 <b>Castle with 5 tabs</b>: Details, <b>Overview</b> (tax slider), <b>Conquests</b>, <b>Defense</b> (troops defend ON/OFF) and <b>Customize</b> (flag color).</li><li>⚔️ <b>New Barracks</b>: Details, Train troops and Training tabs; Basic and Advanced units; each troop in its row with picture, stars, «Owned» and a gold arrow.</li><li>🏛️ <b>Building details</b> redesigned: big window, title with a star, «You have reached the max level» and two red buttons: <b>Demolish</b> and <b>Downgrade</b> (one level down).</li><li>🏅 <b>New bars</b>: dark with gold on top; a lower bottom bar with brown buttons and easy-to-read cream text.</li><li>🖼️ <b>New gold-framed icons</b> in the menu and the bottom bar, drawn for Brother Kingdom.</li><li>💎 <b>New Shop</b> with 3 tabs: <b>Bundles</b> (weekly offers with a timer), <b>Gems</b> and <b>Items</b>.</li><li>🏇 <b>5-step march</b>: 1) target and type (Attack, Scout or Reinforce), 2) Favorites, 3) troops with the slider, 4) the loot you can bring back and 5) March.</li><li>🚩 <b>Rally point</b> (formerly Relay point) with 3 tabs: Details, <b>My troops</b> and <b>My marches</b> (where they go, time left and a View button).</li><li>🛡️ <b>New Alliance screen</b> with 4 tabs: <b>Info</b>, <b>Members</b> (with Leader and Feats, power and last seen), <b>Alliances</b> (search and list) and <b>Wall</b> (leader notice and messages).</li><li>🗺️ <b>Land card</b> on the world map: tap a tile to see its name, level, coordinates, owner, power, alliance and diplomacy, with Scout and Attack. No more «Free» labels on the map.</li><li>🎒 <b>New Inventory</b>: Shop and My items, sliding categories and one row per item with «Owned» and a Use button.</li><li>🦜 <b>Lucky draw with Captain Coral</b>: 9 chests, Draw 1 and Draw 9, and Premium with rare prizes. 2 free lucky tokens every day.</li><li>🎁 <b>Promotions center</b>: each with its timer, prize and red dot.</li><li>💬 <b>New chat</b>: Global, Alliance and <b>Private</b> tabs, with your conversation list (up to 20) and a Clear button.</li><li>👤 <b>Player profile</b>: tap a name in the chat to see level, power and alliance, and Whisper, Send message, Ignore, Report or Invite.</li><li>🚩 On the world map: <b>red flag</b> on hostile kingdoms, blue on your alliance, and your city <b>glows yellow</b>.</li><li>💎 Green gems button at the top of every window.</li><li>⏳ <b>Work queue box</b> at the top left: what is building, training or researching, with a bar, time left and a green <b>Speed up</b> button.</li><li>🪵 <b>Empty plots with a wooden fence</b>, so you see where to build.</li><li>🚩 <b>Flags</b> waving on the castle towers.</li><li>🏠 Buildings now look <b>set into the ground</b> with earth and a soft shadow, and more roofs give off <b>smoke</b>.</li><li>📱 <b>Cleaner screen</b>: Quests, Chat and Mail stay on the right; the ☰ button opens Defense, Ranking, Castle, Pause, Sound and Settings.</li><li>💡 The help sign is cream and <b>hides at your first touch</b>.</li><li>⚔️ <b>Tap the troops box</b> to open the Barracks and train.</li><li>🔤 Short power on top (16.3M) and <b>easier to read bottom labels</b>.</li><li>🎨 <b>Parchment bars</b>: the top and bottom bars, the chat and the right buttons are now light cream with dark text. The City / World button is inside the bottom bar.</li><li>📜 <b>New world map card</b>: tap a kingdom to see a cream card above its castle with name, coordinates, power, alliance, diplomacy and league, plus Scout and Attack.</li><li>🗺️ <b>Much bigger world</b>: now 300 × 300 tiles, with X and Y boxes to find a place.</li><li>🛡️ <b>Knights</b>: Knights Hall, gear shows how much attack and health go up, and a guide. Pieces are earned by playing.</li><li>🫧 <b>Protection up to 7 days</b>.</li><li>🔍 City and world <b>zoom</b> adjusted.</li><li>💬 <b>World chat always visible at the bottom</b>: the latest messages with their time, in the city, fields and world. Tap it to open the chat and write.</li><li>🌾 <b>New Farm</b> from level 15.</li><li>🏗️ <b>11 buildings upgrade at level 15</b>: Storehouse, Embassy, Academy, Market, Blacksmith, Stable, Infirmary, Archery Range, Rally Point, Hut and Watchtower change to a bigger, more detailed version.</li><li>🪨 <b>Your city up high</b>: the city and its fields sit on a plateau, with a rock cliff around it and a meadow below.</li><li>🏛️ <b>Buildings sized by importance</b>: the castle rules, medium buildings fill their plot and the hut and fields are small. Every building grows a little each level.</li><li>🎨 <b>New design</b>: thin full-width bars, no Castle box at the top (the Castle is now a button at the bottom left), a real gem and an elegant dark menu.</li><li>🏰 <b>New castle</b>, more detailed: sandstone, towers with red tile roofs, a tall central keep and palm trees. Now facing you and lighter for phones.</li><li>🏰 <b>New city view</b>: fixed isometric camera, diagonal and without perspective, like a 2D game. You see the whole city when you enter.</li><li>📊 <b>New top bar</b>: your player, your city with coordinates and gems in green with the More button. Below, your resources.</li><li>🔩 <b>Iron</b>: mines now also give iron.</li><li>📋 <b>New menu</b> with 13 buttons.</li><li>⏱️ <b>Times fixed</b>: the Troops panel and the Speed-up panel now show the same time, and each speed-up removes exactly what it says.</li><li>🌾 <b>New Fields view</b>: the camera looks from outside toward your city, with the fields in front and the walls and castle behind.</li><li>🗺️ <b>Better World map</b>: smaller villages, smoother dragging that keeps gliding when you let go. New players now appear near other kingdoms.</li><li>🐾 Removed the loose chickens, goats and horses from the city, which slid around without moving their legs. They will return with real animation.</li><li>🏰 <b>Your castle grows with you</b>: it starts small at level 1 and gets bigger every level up to 30.</li><li>🚶 <b>Troops now walk on the ground</b> when attacking on the map, and stay fighting on arrival before returning.</li><li>🛍️ <b>New Shop</b>: My items tab, info for every item (tap the i), and chests show what they contain before opening.</li><li>💎 <b>Gem store</b> with packs (nothing is charged yet).</li><li>📜 <b>Full battle report</b> in mail: troops that fought, survived, died and were wounded, on both sides. Mark all read and Send buttons.</li><li>⚔️ <b>New March window</b>: choose your hero (Change), your troops with the exact amount (Edit), see the march time and save your formation for next time. You can cancel the march before it arrives.</li><li>🗺️ On the map, your march destination is marked with a ring.</li><li>🛠️ Fixed: logging back in or using a speed-up with many queued troops no longer freezes the game.</li><li>🦸 <b>4 Mythic heroes</b>: Golden Lion, Phoenix, Titan and Eagle, much stronger. Win them in the weekly tournament (and very rarely when recruiting).</li><li>🛡️ <b>Each hero has a mythic armor</b>: 6 pieces only for that hero; 3 pieces +15% damage, 6 pieces +30% damage and +10% defense. Win it in the tournament.</li><li>⚔️ <b>The Barracks changes as it levels up</b>: new look at level 10 and a fortress at level 20.</li><li>🏹 <b>New tower</b> with its archer on top, plus a <b>well</b> and a <b>windmill</b> by the castle.</li><li>🛠️ Fixed: training with Max no longer freezes the game (up to 10,000 per order). Population now only counts build workers.</li><li>🎨 <b>Every building has its own color</b> on its roof and banners.</li><li>⚔️ <b>Train any troop, any amount</b>, as long as you have resources. Up to 250 walk in the city; the rest wait in the barracks and count for your power. Training now takes longer.</li><li>🏗️ <b>Buildings and wall up to level 30</b>, never above the castle level.</li><li>🏘️ <b>14 new 3D buildings</b>: Farm, Sawmill, Mine, Quarry, Academy, Market, Forge, Stable, Infirmary, Archery range, Storehouse, Watchtower, Embassy and Relay point, all in the castle style and without clutter.</li><li>🪟 <b>New building window</b> when you tap a building: Details, Next level, Upgrade and Build now, time with gems, Type · Required · You have table and Demolish.</li><li>🏷️ The level tag only shows on the building you tap.</li><li>⚔️ <b>New 3D Barracks</b>: sandstone barracks with turrets, red tile roof, banners and a weapon rack, in the castle style. 3D buildings no longer sit on the stone platform and fill their plot.</li><li>🛖 <b>New 3D Cottage</b>: sandstone house with a red tile roof and a banner, in the same style as the castle.</li><li>🏰 <b>New 3D castle</b>: sandstone, round towers with battlements, red tile roofs, banners and an arched gate. It shows from castle level 5 and grows at each stage.</li><li>🏆 <b>Ranking of every player</b> (🏆 button): sorted by power, with your place.</li><li>🏆 <b>Weekly tournament</b>: earn points with waves, attacks, camps, buildings, fields, speed-ups and troops. On Monday the best get gems and gold (1st: 500 💎).</li><li>🎁 <b>The daily chest opens by itself</b> when you log in, and prizes are added when you tap Collect.</li><li>💎 <b>Nothing is spent without asking</b>: before spending gems you see the cost and what you will have left.</li><li>🔍 <b>Find an alliance</b> by name or tag.</li><li>🛖 <b>New Cottage</b>: houses your population. Each troop takes 1 population and every build needs 5 free workers. See your population in the king panel (👥). Existing players get a population gift.</li><li>🪵 <b>Brown building window</b>: tabs, big picture, description, next level, Upgrading... with a timer, Cancel (blue) and Upgrade (green) buttons, and the Type · Required · Owned table on parchment.</li><li>👑 <b>Castle up to level 30</b> in 5 stages: wooden fort (1-4), stone with 3 towers (5-9), 5 towers with blue flags (10-14), large with 8 towers and banners (15-29) and the ULTRA at level 30 with a golden dome, blue magic, stone dragons, moat and 14 towers.</li><li>⏳ Each castle level takes longer (level 30 takes about 19 days) and needs your level, the wall and the other buildings: from 18 to 30, all at 17.</li><li>🏰 <b>New city</b>: round wall with 4 gates and stone roads in a cross from the castle. More plots (up to 52).</li><li>🌾 <b>New fields</b>: behind the city, across the river on a stone bridge, a walled farm with plots in rows, stone paths, two windmills and barns.</li><li>⚔️ <b>New Troops window</b>: dark wood and gold, a stone stage with golden light and ranks I-V as metal medals.</li><li>🪵 <b>New interface</b>: dark wood, iron and gold. Resources in shields at the top, the king panel on the left with power and castle health, and 7 round buttons at the bottom. All centered.</li><li>🐉 <b>New armor: Dragon</b> (rank V): dark red with horns, red cape, fire gem and a ring of flames. +80% health and +40% defense.</li><li>👑 <b>Owner: everything maxed</b>: buildings, castle and wall level 17, research, armor, weapons, heroes and lots of troops.</li><li>⬆️ <b>Upgrade first</b>: tapping a building or the castle, the first button is Upgrade (current → next level). It opens the panel with cost, time, gains and what is missing. Demolish goes last, apart and in red.</li><li>🔟 <b>Levels up to 17</b>: buildings, castle and wall go up to level 17, and levels 13 to 17 add new decorations.</li><li>🏰 <b>New castle</b>: warm stone and tiled roofs that match the city; it grows and gets decorated every level.</li><li>🔤 Bottom menu names are always readable, on computers too.</li><li>🏇 <b>Troops are seen marching</b> when attacking barbarian villages, beasts and tiles too: they leave your kingdom, walk across the map with the camera following, fight on arrival and walk back home.</li><li>🏰 <b>New icon</b>: the castle lit up at night.</li><li>☀️ <b>Brother Kingdom by day</b>: bright colors in the City and the World (night is still available).</li><li>🗺️ <b>Painted World map</b>: drawn forests, mountains, lakes, castles, barbarian villages and beasts, and the map goes on past the edge.</li><li>🎌 <b>Buildings get decorated every level</b>: stone base, banners, lanterns, flower pots, golden pillars, a ring of light and a crown at level 12.</li><li>🎥 Lower, closer City camera to see fronts and roofs.</li><li>⏳ <b>No more endless Loading</b>: if your account or kingdom is slow to arrive, the game moves on or shows a button to try again. The connection works better on tricky networks and inside WhatsApp.</li><li>🔷 <b>Diamond World map</b>: the grid is seen diagonally and a top bar shows the (X, Y) coordinates of the center, changing as you drag.</li><li>📜 <b>Parchment window</b> when you tap a tile or barbarian village, with two big buttons: Spy (report goes to your Mail) and Attack.</li><li>🔍 <b>Floating magnifier</b>: tap the coordinate bar, type X and Y on the number pad and confirm with ✓, without leaving the map.</li><li>🏰 <b>Closer City and Fields</b>, with cliffs and a waterfall in the back, and dirt paths between the fields and to the mine.</li><li>📋 <b>Barracks as a list</b>: picture on the left, name, how many you own, a short line and the arrow to open it.</li><li>🌐 <b>Brother Kingdom is played online</b>: the game loads faster (about 27 MB less when you join) and, if the connection drops, a notice shows until it comes back.</li><li>🔄 <b>Three views</b>: the round button at bottom left switches between City, Fields and World without reloading.</li><li>⛏️ <b>Mine entrance</b> in the Fields: a rocky hill with a tunnel, rails and a mine cart.</li><li>▲ <b>Expanded menu</b>: the arrow opens a grid of big icons over the bottom half, with their red badges.</li><li>👁️ <b>Action bar</b> in the World when you tap something: View, March, Troops and Activity.</li><li>🛤️ <b>A living World</b>: roads between kingdoms and villages, carts coming and going, campfire smoke, and mines and quarries with their own shape.</li><li>📋 Barracks cards show how many you own, a short line and an arrow to open them.</li><li>🌍 <b>World 4 times bigger</b>: 80×80 tiles, with more beasts and 76 barbarian villages from level 1 to 12 (stronger far from the center).</li><li>🏳️ <b>Free spots</b>: empty plots near your kingdom and across the map for new players. Tap one to see it or move there with a portal.</li><li>🔍 <b>Magnifier</b>: search any X/Y coordinate and see nearby kingdoms with their level and power to go spy or attack them.</li><li>🛖 <b>Barbarian villages</b>: the map shows their level and recommended power. When you win, a window shows every resource, gem and item you got.</li><li>⚔️ <b>The wave button is gone</b> from the city: resources are won outside, in the World.</li><li>📐 <b>The top bar arranges itself</b>: profile, kingdom, castle, quest and right buttons are fully visible on phone and desktop.</li><li>🛡️ <b>New Barracks</b>: dark design with big troop cards, a sheet with attack, health, speed and load bars, and a gold Train button.</li><li>⏩ <b>New Speed-up panel</b>: big countdown, your gems, a Finish now button with its price and the speed-ups from shortest to longest, each with Use (if you own it) and Buy & use. If it covers the time left, the building finishes at once.</li><li>✖ <b>Cancel build</b>: in the menu and the building panel. You get half the materials back.</li><li>📜 <b>Quests</b>: 📜 button on the right with Quests and Daily quest tabs, a recommended quest on top and three groups: Improve your city, Make your army stronger and Grow your riches. Tap Accept to see each reward and amount.</li><li>🌿 <b>More realistic ground</b> in the city and the World: textured grass, dry and dirt patches, clustered forests with real shadows and lakes with shiny water and light shores.</li><li>💎 <b>Green gems</b>: the gem is now a green diamond in the top bar, the shop and every price.</li><li>🎁 <b>Rewards window</b>: opening a chest, pack or gift shows each reward with its picture, name and amount, and a button to collect it.</li><li>⏩ <b>Use speed-ups from My items</b>: choose what to speed up (buildings, research, training), see the time before and after, and if nothing is in progress it tells you without spending it.</li><li>👨‍👩‍👦 <b>The village has families</b>: adventurers, women in aprons, children running around and white-bearded elders walk along the stone paths.</li><li>🚶 <b>New villagers</b>: the villagers are backpack adventurers who really walk along the stone paths.</li><li>🛍️ <b>New Shop with 5 tabs</b>: Misc., Speed up, Combat, Resources and Chests. Every item shows how many you own, what it does and its price.</li><li>⏩ <b>More speed-ups</b>: from 1 minute to 24 hours for everything, and Arcane ones for research only (1 minute to 3 days).</li><li>🎁 <b>Chests and offers</b>: Treasure chest and packs of 7 and 15 at a lower price, Upgrade chests I to IV with gear pieces, and a Speed-up chest. Also 500,000 of each resource, King’s recruits and a Royal ingot.</li><li>🏗️ <b>Buildings visibly grow</b>: levels 1-3 are humble, wooden with straw roofs; 4-6 get a stone base; 7-9 are light stone with towers and lit windows; 10-12 are white stone with gold, much bigger.</li><li>🎨 <b>Each building has its own shape and color</b>: the Barracks is red with a training yard, soldiers and a watchtower; the Academy is purple with a study tower that grows and a globe at level 12; the Infirmary is green, with tents, a garden, a fountain and a big cross. Fields add crops, logs, stones and carts as they level up.</li><li>📋 <b>Card for each troop in the Barracks</b>: tapping a troop opens its card right there, with Attack and Health in stars, Speed, Load, Upkeep, Power, what it is weak and strong against, and two tabs: Train and Dismiss. If you cannot train it, it shows «You do not meet the requirements» with what it needs and what you own.</li><li>🖼️ Troop pictures show the new figures.</li><li>🌍 <b>A more realistic World map</b>: continuous land with grass, meadows, dense forests of pines and round trees, bushes, flowers, rocky hills, snowy mountains and lakes with natural shores. A sky replaces the dark background.</li><li>🛖 <b>Barbarian villages</b>: straw-roof huts, a palisade, a campfire and a banner. There are 16 across the map, level 1 to 12.</li><li>📦 <b>Cargo research</b> (Academy → Economy): +10% cart capacity per level. Together with upgrading carts at the Market, every attack steals more.</li><li>🛒 Carts now show the wooden cart with its horse at the Market, the Barracks and when choosing troops.</li><li>🛒 <b>Carts to steal</b>: when attacking another player you choose how many carts go with your army. Without carts your soldiers carry very little; each cart adds its capacity to the loot. They leave with the troops, show on the map and come back with what you stole.</li><li>🏇 <b>Troops marching on the World map</b>: your attack shows as a column of soldiers with a blue banner heading to the city, with a dotted path and the time left. Incoming attacks show in red coming toward your kingdom.</li><li>💰 <b>Return with the loot</b>: if you win, your troops come back carrying the loot and the resources arrive when they get home.</li><li>🏰 <b>City card on the World map</b>: tapping another player’s kingdom marks its tile in green and opens a card with name, coordinates, level, power, alliance, diplomacy (Allied, Neutral or Enemy) and league.</li><li>🔍 <b>Scout</b>: send a scout (or pay 150 gold to a spy) and the report arrives in your Mail: castle, wall, troops, possible loot and whether it is worth attacking.</li><li>⚔️ <b>Attack</b>: choose which troops go, see your power against their defense and confirm. It warns if their power is much higher and if you will lose your protection or bubble. Your alliance cannot be attacked: you get Reinforce instead.</li><li>⭐ <b>Player level</b>: earn experience by building, upgrading, winning waves, quests, beasts and camps. At the top you see your level and its bar; next to it, your kingdom with its coordinates, and the green gems open the Shop.</li><li>🔗 <b>Unlock chain</b>: the Castle needs your level and the Wall; the Wall needs the Quarry and your level; the Stable needs Barracks level 2; the Forge needs the Academy, and more. What is missing shows in red with ❌.</li><li>💎 <b>Buy upgrade</b>: if you lack resources you can fill them with gems and finish at once.</li><li>⚔️ <b>8 new troops</b>: Scout, Militia, Light rider, Heavy cavalry, Ballista, Battering ram, Catapult and Siege tower. The Barracks lists them all, with a lock and what each one needs.</li><li>🎥 <b>New camera</b>: you see the castle, the full wall and the outer fields on one screen, at an angle. Tapping a building centers it and closing returns the camera.</li><li>🏰 <b>The wall is always visible</b>: stone, towers, a moat and a stone bridge at the gate. Upgrading makes it bigger.</li><li>🧱 <b>Full city</b>: all plots show in rows with stone paths; locked ones are plowed dirt.</li><li>🌊 A <b>river</b> falls from the hills among rocks and circles the kingdom. Hills look natural and the land reaches the horizon.</li><li>🚶 Villagers walk on the stone paths. Horses and goats graze outside the wall. The sawmill has a water wheel.</li><li>📋 <b>New build panel</b>: a table of what it needs and what you own (✅ / ❌), build time and two buttons: Build and Instant (gems). While building: Speed up and Finish now.</li><li>⚔️ <b>Barracks with 3 tabs</b>: Details, Train troops (list with how many you own) and In training.</li><li>📜 <b>Guide quest</b> at the top left: always tells you what to do and gives a reward. At the bottom, the current build with its time and a speed-up button. Upgrading the castle shows what unlocks.</li><li>🐎 <b>Horses really walk</b>: they move their legs as they walk and lower their heads to graze. On carts they are hitched to the shafts.</li><li>🐔 <b>New hens</b>: white hens with real feathers peck around the village.</li><li>🚶 <b>The Swordsman really walks</b>: legs and arms move as he walks and he lunges forward to attack.</li><li>🐎 <b>Horses in your kingdom</b>: horses now roam and graze in the fields, next to the chickens and goats.</li><li>🗡️ <b>New 3D troops</b>: the Swordsman, the hooded Archer, the Guardian with a big shield and the Cavalry on an armored horse have new, much more detailed figures. The ground ring shows the rank (silver II, blue III, gold IV).</li><li>🛒 <b>New carts</b>: on the world map carts are wooden with a horse pulling them.</li><li>🌍 <b>World outside the city</b>: the World button pulls the camera back and you go out to the full-screen map. Coordinates show at the top and the 🏰 My city button takes you back.</li><li>🐗 <b>Beasts</b>: boars, wolves and bears from level 1 to 10 around the map. Tap one to see its level, recommended power and rewards, then press Attack. They come back after 30 minutes.</li><li>🔍 <b>Search</b>: pick beasts, camps or tiles and a level; it takes you to the nearest one and shows the max recommended power.</li><li>🌾 World tiles show their building, capacity and gathering per hour, with a Collect button.</li><li>🟦 <b>Alliance territory</b>: your alliance tiles show in blue with their mill, sawmill, mine or quarry, and allied kingdoms fly a banner.</li><li>🛡️ <b>Full alliance</b>: War, Boxes, Territory, Alliance battle, Shop, Technology, Power, Help, Members, Incentive and Settings. Earn alliance points hunting beasts, beating camps and with the daily incentive.</li><li>🎁 <b>Alliance boxes</b>: every 100 points opens a box; claim gifts one by one or all at once (up to 20 a day).</li><li>📬 <b>Mail with tabs</b>: Wars, Alliance, System, Reports and Starred, each with its unread count. Battle and beast reports carry rewards to claim. Delete read and Read and claim all buttons.</li><li>🪖 <b>Squads in Troops</b>: you now see your soldiers in formation (not just one), with how many you have and how many are training.</li><li>⭐ <b>Troops change shape with rank</b>: I in leather and wood, II with steel and a rimmed shield, III with plates, visor and a blue shield, and IV premium gold and blue with a big shield, big weapon and cape. The rank row shows how many you have of each.</li><li>🫧 <b>Protection bubble</b> for new players: 7 days without attacks (or until Castle level 5). It covers your whole city and shows on the map with the days left.</li><li>🛒 <b>Carts</b>: train them at the Market and upgrade them to carry more. They carry resources when you send them to your alliance and when you collect your world tiles, and you can see them travel on the map.</li><li>📣 <b>Alliance requests</b>: ask for troops to defend or to attack (more with a higher knight level) and ask for resources; allies donate and you see who donated and how much is left.</li><li>🎨 <b>New bottom menu icons</b>: every button has its own drawing with relief and a gold frame (Campaign, Troops, Inventory, Buildings, Shop, Alliance and World).</li><li>⚔️ <b>Small attack alert</b> at the top left: who is attacking and how long until they arrive, without covering your city. Tap it and you choose: Defend or Use portal.</li><li>📬 <b>Mailbox</b>: news no longer cover your kingdom when you enter. They arrive in the mailbox (📬 button on the right) with a red dot if unread.</li><li>🔢 The numbers on the bottom buttons only count what is <b>new</b> and clear when you open them.</li><li>🏷️ <b>New menu names</b>: Campaign, Troops, Inventory, Buildings, Shop, Alliance and World.</li><li>🔬 <b>Research per troop</b>: in Troops, a Research button for Attack, Health, Defense and Speed of each type. It is the same Academy research and shows how much your Power goes up.</li><li>🎒 <b>Inventory with tabs</b>: Resources, Speed-ups, Income, Gear and Other, with a red dot on new things. Gear pieces can be upgraded there and raise your Power.</li><li>🌀 <b>Portals against attacks</b>: the attack alert has a Use portal button. If you move before the attack arrives, it is canceled. One portal every 24 hours and 1 hour without attacking after moving.</li><li>🪟 Panels are smaller and centered: you can see your kingdom around them.</li><li>🧱 <b>Tidy city</b>: every building sits on its own plot, centered with space around it, with little paths between plots. They no longer touch each other or the wall.</li><li>➕ <b>New plots</b>: all alike, with a stone border, a grass frame and a + to build. Tap one to open Build. The fields outside use the same style.</li><li>🏰 The wall is bigger so all the plots fit.</li><li>🏰 <b>You go straight into your kingdom</b>: no more welcome card. The language (ES/EN) and sign-out (⏻) buttons are at the top, next to your resources.</li><li>🎥 <b>New camera</b>: farther away with the castle facing you, so you see the whole kingdom.</li><li>⏱️ <b>Building and upgrading take time</b>: minutes at first and hours at high levels. Each level costs more than the last.</li><li>📋 <b>Tasks</b>: to level up the castle and buildings you must win waves, collect, train troops and beat camps. The button tells you what is missing.</li><li>⚔️ <b>Training takes real time</b> (minutes for a few troops, hours for many). Use speed-ups; the queue shows at the top right.</li><li>📘 Hero books and scrolls are no longer sold: earn them in waves, camps and the daily chest.</li><li>🛡️ <b>⚔️ ON/OFF button</b>: choose whether your troops defend when you are attacked (if they defend, they can die).</li><li>🧰 <b>Hero gear</b>: 6 slots (weapon, helmet, chestplate, gloves, boots and amulet). Each piece has rarity and level, can be upgraded and gives damage, health, defense, speed or cooldown. Quick equip and Unequip all buttons.</li><li>🎁 Pieces drop from waves, camps and the Gear chest at the Market. You get 2 free to start!</li><li>💬 <b>Chat</b>: 💬 button on the right with Global and Guild tabs, live. Tap someone’s name to block or report them; insults are hidden automatically.</li><li>🌀 <b>Teleport portals</b>: move your kingdom to another spot on the world map. Random portal (random free spot) or Chosen portal (tap a free tile on the map and pick Move my kingdom here). With a light beam and magic ring.</li><li>🚨 <b>Attack alert</b>: if someone attacks you, a red alert with sound shows who it is and how long until they arrive. Tap it to go to your city and get ready.</li><li>🏇 Attacks now take time to arrive (1 to 3 minutes) and are decided on arrival, with the defense you have at that moment.</li><li>👁️ New <b>Watch post</b>: see the strength of attackers and your kingdom defends better.</li><li>🏗️ <b>5 new buildings</b>: Warehouse (protects resources from raids), Market square (trade resources and send them to your guild), Forge (weapons: more damage), Stable (cavalry) and Archery range (archers).</li><li>⏱️ <b>Speed-ups</b> of 1 min, 5 min, 15 min, 1 hour, 8 and 12 hours for buildings, training and research. Tap Speed up on the building.</li><li>🌍 <b>New 3D grid world map</b>: plains, forests, hills, lakes and mountains. Drag to move and pinch to zoom.</li><li>🚩 <b>Conquer tiles</b>: beat their guardians and their bonus helps your fields (forest → wood, hill → stone, lake and plains → food, mountain → gold). You can hold as many as your Castle level.</li><li>⛺ You can now attack goblin camps for loot.</li><li>🧨 <b>Demolish</b>: tap a building and choose Demolish (it asks first). The plot becomes free to build something else.</li><li>🔓 <b>Plots by Castle level</b>: Castle level 1 gives 4 plots and each level opens 3 more (up to 37). The next ones show a lock.</li><li>🗺️ <b>Grid kingdom</b>: the city has tidy plots and every building shows its name and level.</li><li>🌾 <b>Fields outside the wall</b>: Farm, Sawmill, Gold mine and Quarry (new). They store what they make, even while the game is closed: tap them and press Collect.</li><li>🔁 Your farms, sawmills and mines moved to the fields with their level (the old mine is now a Quarry).</li><li>⚔️ <b>Attack other players</b> from the Islands map, even stronger ones. There is now a battle scene with both armies, x2 and Skip.</li><li>🔄 The game tells you when there is a new version and updates itself.</li><li>✨ <b>Skills with levels</b>: in the hero sheet, Skills tab. The Power goes up to level 5 (each star unlocks a level) and you see what improves: more damage, longer duration and shorter cooldown.</li><li>💪 New <b>Talent</b> for each class: unlocks at 2★.</li><li>📜 Skill scrolls: earned in waves and at the Market.</li><li>🏹 Ranged heroes cast their power from farther away and move toward enemies.</li>', novedades_ok: 'Let\'s play!',
    poder: 'Power', cuenta: 'Account', correo: 'Your email', entrar: 'Sign in',
    correo_no: 'That email is not an owner account.', cuenta_jugador: 'Guest player',
    dueno_activo: '👑 OWNER mode on', dueno_titulo: 'Owner menu (testing)',
    dueno_txt: 'For testing only. It cannot be sold or given to other players.',
    gemas_max: '99,999 gems', oro_inf: 'Infinite gold', vel10: 'Speed x10',
    saltar_oleada: 'Go to next wave', salir_dueno: 'Leave owner mode', todo_max: '🚀 Everything maxed (troops, levels, heroes)', todo_max_ok: '👑 Everything maxed! {n} troops in Dragon armor.', todo_max_oleada: 'Wait until the wave ends.',
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
  vigia:      { es: 'Torre de vigilancia', en: 'Watchtower',
                des_es: 'Vigila el horizonte: muestra la fuerza de quien te ataca y da defensa extra al reino.', des_en: 'Watches the horizon: shows the strength of attackers and gives the kingdom extra defense.' },
  embajada:   { es: 'Embajada',     en: 'Embassy',
                des_es: 'Te permite crear una alianza o unirte a una, y alberga los refuerzos que te mandan tus aliados: esas tropas pelean en tu defensa si te atacan. Solo puede haber una.', des_en: 'Lets you create or join an alliance and houses the reinforcements your allies send you: those troops fight in your defense if you are attacked. There can be only one.' },
  relevo:     { es: 'Punto de reunión', en: 'Rally point',
                des_es: 'Aquí se reúnen tus tropas antes de marchar y aquí ves tus marchas. Solo puede haber uno.', des_en: 'Your troops gather here before marching, and here you see your marches. There can be only one.' },
  cabana:     { es: 'Cabaña',       en: 'Cottage',
                des_es: 'La cabaña aloja a tu población. Cuanto mayor es su nivel, más obreros viven en tu reino. Cada obra usa obreros: sin obreros libres no puedes construir.', des_en: 'The cottage houses your people. The higher its level, the more workers live in your kingdom. Each build uses workers. Without free population you cannot build.' },
  almacen:    { es: 'Almacén',      en: 'Warehouse',
                des_es: 'Guarda recursos bajo llave: si te saquean, esa parte no se la llevan.', des_en: 'Keeps resources locked: if you are raided, that part cannot be taken.' },
  mercado:    { es: 'Mercado',      en: 'Market square',
                des_es: 'Cambia un recurso por otro y envía recursos a tu hermandad.', des_en: 'Trade one resource for another and send resources to your guild.' },
  herreria:   { es: 'Herrería',     en: 'Forge',
                des_es: 'Forja armas más fuertes y mejores armaduras para tus tropas.', des_en: 'Forges stronger weapons and better armor for your troops.' },
  establo:    { es: 'Establo',      en: 'Stable',
                des_es: 'Con el Establo puedes entrenar en el Cuartel las unidades a caballo: Jinete ligero (Nv 1), Caballería (Nv 4) y Caballería pesada (Nv 8). Mejóralo para desbloquear las más avanzadas y entrenarlas más rápido.', des_en: 'With the Stable you can train mounted units in the Barracks: Light rider (Lv 1), Cavalry (Lv 4) and Heavy cavalry (Lv 8). Upgrade it to unlock the advanced ones and train them faster.' } /* v9.60 (dueño): el Establo es para poder entrenar las unidades avanzadas */,
  galeria:    { es: 'Galería de tiro', en: 'Archery range',
                des_es: 'Con la Galería de tiro puedes entrenar en el Cuartel las unidades de tiro: Arquero (Nv 1), Ballestero (Nv 4), Arquero largo (Nv 6) y Tirador élite (Nv 8). Mejórala para desbloquear las más avanzadas y entrenarlas más rápido.', des_en: 'With the Archery range you can train ranged units in the Barracks: Archer (Lv 1), Crossbowman (Lv 4), Longbowman (Lv 6) and Elite marksman (Lv 8). Upgrade it to unlock the advanced ones and train them faster.' },
  cantera:    { es: 'Cantera',      en: 'Quarry',
                des_es: 'Corta piedra: para la muralla, las torres y mejoras grandes.', des_en: 'Cuts stone: for the wall, towers and big upgrades.' },
  barricada:  { es: 'Barricada',    en: 'Barricade',
                des_es: 'Muro en el camino: los enemigos se paran a romperlo.', des_en: 'A wall on the road: enemies stop to break it.' },
  cuartel:    { es: 'Cuartel',      en: 'Barracks',
                des_es: 'Permite entrenar caballeros.', des_en: 'Lets you train knights.' },
  torre:      { es: 'Torre del homenaje', en: 'Keep',
                des_es: 'Custodia los blasones que ganas al vencer campamentos y aldeas bárbaras. Con los blasones consigues objetos especiales en Artefactos y Promociones. También dispara flechas a los enemigos.', des_en: 'Guards the crests you win by beating camps and barbarian villages. Trade crests for special items in Artifacts and Promotions. It also shoots arrows at enemies.' },
  enfermeria: { es: 'Enfermería',   en: 'Infirmary',
                des_es: 'Las tropas heridas se quedan aquí hasta que tú las cures. Al curarlas sube tu poder.', des_en: 'Fallen troops heal here and come back when the wave ends.' },
  muralla:    { es: 'Muralla',      en: 'Wall',
                des_es: 'Rodea todo el reino y le da más vida al castillo.', des_en: 'Surrounds the whole kingdom and gives the castle more health.' },
  explorador: { es: 'Explorador', en: 'Scout', des_es: 'Conoce los caminos: rápido y ligero, pelea mientras otros cargan el botín.', des_en: 'Knows the roads: fast and light, fights while others carry the loot.' },
  miliciano: { es: 'Miliciano', en: 'Militia', des_es: 'Aldeano armado con hacha y escudo de madera. Barato y rápido de entrenar.', des_en: 'Villager with an axe and a wooden shield. Cheap and quick to train.' },
  jinete: { es: 'Jinete ligero', en: 'Light rider', des_es: 'El más veloz del ejército. Muy bueno contra las máquinas de asedio.', des_en: 'The fastest in the army. Very good against siege machines.' },
  caballeria_pesada: { es: 'Caballería pesada', en: 'Heavy cavalry', des_es: 'Jinetes con armadura completa que cargan en formación.', des_en: 'Fully armored riders who charge in formation.' },
  balista: { es: 'Balista', en: 'Ballista', des_es: 'Lanza virotes enormes desde lejos. Muy fuerte contra la infantería.', des_en: 'Shoots huge bolts from afar. Very strong against infantry.' },
  ariete: { es: 'Ariete', en: 'Battering ram', des_es: 'Un tronco gigante con techo y ruedas. Aguanta muchísimo.', des_en: 'A giant log with a roof and wheels. Very tough.' },
  catapulta: { es: 'Catapulta', en: 'Catapult', des_es: 'Lanza rocas enormes muy lejos. Lenta pero devastadora.', des_en: 'Throws huge rocks very far. Slow but devastating.' },
  torre_asedio: { es: 'Torre de asedio', en: 'Siege tower', des_es: 'Torre con ruedas para asaltar ciudades de otros jugadores. Es el primer blanco del enemigo.', des_en: 'Wheeled tower to storm other players’ cities. The enemy targets it first.' },
  carreta: { es: 'Carretas', en: 'Carts', des_es: 'Llevan los recursos a tu alianza y desde tus casillas. Se entrenan en el Mercado.', des_en: 'Carry resources to your alliance and from your tiles. Trained at the Market.' },
  espadachin: { es: 'Espadachín',   en: 'Swordsman',
                des_es: 'Rápido y valiente. Pelea cuerpo a cuerpo.', des_en: 'Fast and brave. Fights up close.' },
  ballestero: { es: 'Ballestero', en: 'Crossbowman', des_es: 'Su ballesta atraviesa armaduras. Más vida y daño que el arquero, pero más lento.', des_en: 'His crossbow pierces armor. More health and damage than the archer, but slower.' },
  arquero_largo: { es: 'Arquero Largo', en: 'Longbowman', des_es: 'Arco largo de tejo: dispara desde más lejos que nadie.', des_en: 'Yew longbow: shoots from farther than anyone.' },
  tirador_elite: { es: 'Tirador Élite', en: 'Elite Marksman', des_es: 'Lo mejor del Campo de Tiro: mucho daño a gran distancia.', des_en: 'The best of the Archery Range: heavy damage at long range.' },
  arquero:    { es: 'Arquero',      en: 'Archer',
                des_es: 'Dispara desde lejos. Poca vida.', des_en: 'Shoots from afar. Low health.' },
  cofre_madera: { es: 'Cofre de madera', en: 'Wooden chest', des_es: 'Trae oro, comida y madera.', des_en: 'Gives gold, food and wood.' },
  cofre_plata:  { es: 'Cofre de plata', en: 'Silver chest', des_es: 'Trae oro, madera y piedra.', des_en: 'Gives gold, wood and stone.' },
  cofre_oro:    { es: 'Cofre de oro', en: 'Golden chest', des_es: 'Un gran premio de todos los recursos.', des_en: 'A big prize of every resource.' },
  bolsa_oro:    { es: 'Bolsa de oro', en: 'Bag of gold', des_es: '+250 de oro.', des_en: '+250 gold.' },
  saco_comida:  { es: 'Saco de comida', en: 'Sack of food', des_es: '+300 de comida.', des_en: '+300 food.' },
  saco_madera:  { es: 'Montón de madera', en: 'Pile of wood', des_es: '+300 de madera.', des_en: '+300 wood.' },
  saco_piedra:  { es: 'Carreta de piedra', en: 'Cart of stone', des_es: '+200 de piedra.', des_en: '+200 stone.' },
  escudo_2h:    { es: 'Protección 2 horas', en: '2-hour protection', des_es: 'Tu reino queda protegido 2 horas.', des_en: 'Your kingdom is protected for 2 hours.' },
  escudo_8h:    { es: 'Protección 8 horas', en: '8-hour protection', des_es: 'Tu reino queda protegido 8 horas.', des_en: 'Your kingdom is protected for 8 hours.' },
  escudo_12h:   { es: 'Protección 12 horas', en: '12-hour protection', des_es: 'Tu reino queda protegido 12 horas.', des_en: 'Your kingdom is protected for 12 hours.' },
  pergamino:    { es: 'Pergamino de habilidad', en: 'Skill scroll', des_es: 'Sirve para subir el nivel de las habilidades de los héroes.', des_en: 'Used to level up hero skills.' },
  acel_2h5: { es: 'Acelerador 2,5 horas', en: 'Speed-up 2.5 hours', des_es: 'Quita 2,5 horas a una obra, entrenamiento o investigación.', des_en: 'Takes 2.5 hours off a building, training or research.' },
  acel_15h: { es: 'Acelerador 15 horas', en: 'Speed-up 15 hours', des_es: 'Quita 15 horas a una obra, entrenamiento o investigación.', des_en: 'Takes 15 hours off a building, training or research.' },
  acel_24h: { es: 'Acelerador 24 horas', en: 'Speed-up 24 hours', des_es: 'Quita 24 horas a una obra, entrenamiento o investigación.', des_en: 'Takes 24 hours off a building, training or research.' },
  inv_1m: { es: 'Arcano 1 minuto', en: 'Arcane 1 minute', des_es: 'Quita 1 minuto solo a una investigación.', des_en: 'Takes 1 minute off a research only.' },
  inv_15m: { es: 'Arcano 15 minutos', en: 'Arcane 15 minutes', des_es: 'Quita 15 minutos solo a una investigación.', des_en: 'Takes 15 minutes off a research only.' },
  inv_1h: { es: 'Arcano 1 hora', en: 'Arcane 1 hour', des_es: 'Quita 1 hora solo a una investigación.', des_en: 'Takes 1 hour off a research only.' },
  inv_2h5: { es: 'Arcano 2,5 horas', en: 'Arcane 2.5 hours', des_es: 'Quita 2,5 horas solo a una investigación.', des_en: 'Takes 2.5 hours off a research only.' },
  inv_8h: { es: 'Arcano 8 horas', en: 'Arcane 8 hours', des_es: 'Quita 8 horas solo a una investigación.', des_en: 'Takes 8 hours off a research only.' },
  inv_15h: { es: 'Arcano 15 horas', en: 'Arcane 15 hours', des_es: 'Quita 15 horas solo a una investigación.', des_en: 'Takes 15 hours off a research only.' },
  inv_24h: { es: 'Arcano 24 horas', en: 'Arcane 24 hours', des_es: 'Quita 24 horas solo a una investigación.', des_en: 'Takes 24 hours off a research only.' },
  inv_3d: { es: 'Arcano 3 días', en: 'Arcane 3 days', des_es: 'Quita 3 días solo a una investigación.', des_en: 'Takes 3 days off a research only.' },
  /* v8.73: paquetes de tropas para la Tienda (van directo a tus tropas de casa) */
  tropas_mil: { es: 'Leva de milicianos', en: 'Militia levy', des_es: '1.000 milicianos listos al momento.', des_en: '1,000 militia ready at once.' },
  tropas_esp: { es: 'Compañía de espadachines', en: 'Swordsman company', des_es: '500 espadachines listos al momento.', des_en: '500 swordsmen ready at once.' },
  tropas_arq: { es: 'Compañía de arqueros', en: 'Archer company', des_es: '500 arqueros listos al momento.', des_en: '500 archers ready at once.' },
  tropas_gua: { es: 'Muro de guardianes', en: 'Guardian wall', des_es: '300 guardianes listos al momento.', des_en: '300 guardians ready at once.' },
  tropas_cab: { es: 'Escuadrón de caballería', en: 'Cavalry squadron', des_es: '200 caballeros a caballo listos al momento.', des_en: '200 cavalry ready at once.' },
  tropas_bal: { es: 'Batería de balistas', en: 'Ballista battery', des_es: '50 balistas listas al momento.', des_en: '50 ballistas ready at once.' },
  tropas_ari: { es: 'Arietes de asalto', en: 'Assault rams', des_es: '50 arietes listos al momento.', des_en: '50 rams ready at once.' },
  tropas_cat: { es: 'Batería de catapultas', en: 'Catapult battery', des_es: '50 catapultas listas al momento.', des_en: '50 catapults ready at once.' },
  reclutas: { es: 'Reclutas del rey', en: 'King’s recruits', des_es: '10 espadachines listos al momento, sin entrenar.', des_en: '10 swordsmen ready at once, no training.' },
  cristal_mistico: { es: 'Cristal místico', en: 'Mystic crystal', des_es: 'Para la Ascensión de ★1 a ★4. Se gana en campamentos, bestias y aldeas bárbaras de nivel 5 o más.', des_en: 'For Ascension ★1 to ★4. Won at camps, beasts and barbarian villages level 5+.' },
  cristal_encantado: { es: 'Cristal encantado', en: 'Enchanted crystal', des_es: 'Para la Ascensión de ★5 a ★10. Se gana en campamentos, bestias y aldeas de nivel 9 o más.', des_en: 'For Ascension ★5 to ★10. Won at level 9+ camps, beasts and villages.' },
  amatista_100: { es: 'Amatista rúnica ×100', en: 'Runic amethyst ×100', des_es: '100 Amatistas rúnicas para las investigaciones de nivel 11 o más. Solo se ganan en eventos y combates.', des_en: '100 Runic amethysts for level 11+ research. Only won in events and battles.' },
  amatista_500: { es: 'Amatista rúnica ×500', en: 'Runic amethyst ×500', des_es: '500 Amatistas rúnicas para las investigaciones de nivel 11 o más. Solo se ganan en eventos y combates.', des_en: '500 Runic amethysts for level 11+ research. Only won in events and battles.' },
  cristal_arcano: { es: 'Cristal arcano', en: 'Arcane crystal', des_es: 'Para la Ascensión de ★11 a ★15. Se gana en campamentos, bestias y aldeas de nivel 13 o más.', des_en: 'For Ascension ★11 to ★15. Won at level 13+ camps, beasts and villages.' },
  tambor_batalla: { es: 'Tambor de batalla', en: 'Battle drum', des_es: '+20 % de vida a tus tropas cuando atacan, durante 1 hora. Aguantan más golpes.', des_en: '+20% HP to your troops when attacking, for 1 hour.' },
  cuerno_guerra: { es: 'Cuerno de guerra', en: 'War horn', des_es: '+20 % de ataque a tus tropas durante 1 hora. Para atacar un campamento fuerte.', des_en: '+20% troop attack for 1 hour.' },
  coraza_acero: { es: 'Coraza de acero', en: 'Steel armor', des_es: '+20 % de defensa (vida de tus tropas al defender) durante 1 hora. Úsala si te avisan de un ataque.', des_en: '+20% defense for 1 hour.' },
  marcha_rapida: { es: 'Marcha rápida', en: 'Swift march', des_es: 'Tus marchas van un 50 % más rápido durante 1 hora.', des_en: 'Your marches go 50% faster for 1 hour.' },
  retirada_marcha: { es: 'Retirada de marcha', en: 'March recall', des_es: 'Cancela tu marcha en camino y tus tropas vuelven al momento.', des_en: 'Cancels your march on the way; troops return at once.' },
  ampliar_marcha: { es: 'Ampliación de marcha', en: 'March expansion', des_es: '+25 % de tropas en cada marcha durante 1 hora.', des_en: '+25% troops per march for 1 hour.' },
  bono_comida: { es: 'Bono de comida', en: 'Food boost', des_es: '+25 % de producción de comida durante 24 horas.', des_en: '+25% food production for 24 hours.' },
  bono_madera: { es: 'Bono de madera', en: 'Wood boost', des_es: '+25 % de producción de madera durante 24 horas.', des_en: '+25% wood production for 24 hours.' },
  bono_piedra: { es: 'Bono de piedra', en: 'Stone boost', des_es: '+25 % de producción de piedra durante 24 horas.', des_en: '+25% stone production for 24 hours.' },
  bono_oro: { es: 'Bono de oro', en: 'Gold boost', des_es: '+25 % de producción de oro de las minas durante 24 horas.', des_en: '+25% mine gold for 24 hours.' },
  constructor_exp: { es: 'Constructor experto', en: 'Expert builder', des_es: 'Las obras van un 25 % más rápido durante 24 horas.', des_en: 'Builds go 25% faster for 24 hours.' },
  cosecha_ya: { es: 'Cosecha instantánea', en: 'Instant harvest', des_es: 'Te da al momento lo que tus campos producen en 6 horas.', des_en: 'Gives you 6 hours of field production at once.' },
  comida_2m: { es: '2.000.000 de comida', en: '2,000,000 food', des_es: 'Un granero entero.', des_en: 'A whole granary.' },
  madera_2m: { es: '2.000.000 de madera', en: '2,000,000 wood', des_es: 'Un bosque cortado.', des_en: 'A whole cut forest.' },
  piedra_2m: { es: '2.000.000 de piedra', en: '2,000,000 stone', des_es: 'Una cantera entera.', des_en: 'A whole quarry.' },
  oro_1m: { es: '1.000.000 de oro', en: '1,000,000 gold', des_es: 'Un cofre real de monedas.', des_en: 'A royal coin chest.' },
  mixto_1m: { es: 'Paquete de construcción', en: 'Building pack', des_es: '1.000.000 de oro, comida, madera y piedra.', des_en: '1,000,000 gold, food, wood and stone.' },
  ficha_x1: { es: 'Ficha de la suerte', en: 'Luck token', des_es: '1 ficha para la Ruleta del Azar.', des_en: '1 token for the Luck wheel.' },
  // v8.19: fichas de la Ruleta y cofres de fichas (Tienda)
  ficha_azar10: { es: '10 fichas de Azar', en: '10 Lucky tokens', des_es: '10 fichas para el Azar. Se guardan, no se pierden.', des_en: '10 tokens for Lucky. They never expire.' },
  ficha_rul5: { es: '5 fichas de Ruleta', en: '5 Wheel tokens', des_es: '5 tiradas de la Ruleta (1 ficha por tirada). Se guardan para la próxima Ruleta.', des_en: '5 Wheel spins (1 token per spin). Kept for the next Wheel.' },
  cofre_fichas1: { es: 'Cofre de fichas pequeño', en: 'Small token chest', des_es: '5 fichas de Azar y 2 fichas de Ruleta.', des_en: '5 Lucky tokens and 2 Wheel tokens.' },
  cofre_fichas2: { es: 'Cofre de fichas mediano', en: 'Medium token chest', des_es: '15 fichas de Azar y 6 fichas de Ruleta.', des_en: '15 Lucky tokens and 6 Wheel tokens.' },
  cofre_fichas3: { es: 'Cofre de fichas grande', en: 'Large token chest', des_es: '40 fichas de Azar y 15 fichas de Ruleta.', des_en: '40 Lucky tokens and 15 Wheel tokens.' },
  ficha_x5: { es: '5 fichas de la suerte', en: '5 luck tokens', des_es: '5 fichas para la Ruleta del Azar.', des_en: '5 tokens for the Luck wheel.' },
  carreta_sum: { es: 'Carreta Pesada', en: 'Heavy Wagon', des_es: '+1 Carreta de Suministro: lleva recursos entre tus villas y carga botín.', des_en: '+1 Supply Wagon: carries resources between your villages and hauls loot.' },
  carretas_x10: { es: '10 Carretas de Suministro', en: '10 Supply Wagons', des_es: '+10 Carretas de Suministro para caravanas grandes.', des_en: '+10 Supply Wagons for big caravans.' },
  cofre_dragon: { es: 'Cofre del Dragón Imperial', en: 'Imperial Dragon Chest', des_es: 'Premio del Torneo de Temporada: elige 1 pieza del Set Dragón Imperial (Temporada 1).', des_en: 'Season Tournament prize: pick 1 piece of the Imperial Dragon Set (Season 1).' },
  vip_100: { es: '+100 Puntos VIP', en: '+100 VIP points', des_es: 'Suma 100 puntos a tu VIP para subir de nivel más rápido.', des_en: 'Adds 100 points to your VIP to level up faster.' },
  energia_heroe: { es: 'Energía de héroe', en: 'Hero energy', des_es: '+50 de experiencia para tu héroe principal.', des_en: '+50 XP for your main hero.' },
  llave_bronce: { es: 'Llave de bronce', en: 'Bronze key', des_es: 'Abre un Cofre de plata al momento.', des_en: 'Opens a Silver chest at once.' },
  llave_plata: { es: 'Llave de plata', en: 'Silver key', des_es: 'Abre un Cofre de oro al momento.', des_en: 'Opens a Gold chest at once.' },
  reinicio_tal: { es: 'Reinicio de talentos', en: 'Talent reset', des_es: 'Devuelve los puntos de habilidades y talentos de tu héroe principal para repartirlos otra vez.', des_en: 'Refunds your main hero skill and talent points.' },
  cambio_nombre: { es: 'Cambio de nombre', en: 'Name change', des_es: 'Cambia el nombre de tu reino (el que ven los demás).', des_en: 'Changes your kingdom name.' },
  megafono: { es: 'Megáfono (x5)', en: 'Megaphone (x5)', des_es: 'Tus 5 próximos mensajes del chat Global salen destacados con 📣.', des_en: 'Your next 5 Global chat messages stand out with 📣.' },
  oro_500k: { es: '500.000 de oro', en: '500,000 gold', des_es: 'Un cofre lleno de monedas.', des_en: 'A chest full of coins.' },
  comida_500k: { es: '500.000 de comida', en: '500,000 food', des_es: 'Carros llenos de trigo y pan.', des_en: 'Carts full of wheat and bread.' },
  madera_500k: { es: '500.000 de madera', en: '500,000 wood', des_es: 'Pilas enormes de troncos.', des_en: 'Huge piles of logs.' },
  piedra_500k: { es: '500.000 de piedra', en: '500,000 stone', des_es: 'Bloques de piedra para obras grandes.', des_en: 'Stone blocks for big works.' },
  caracola_real: { es: 'Caracola Real', en: 'Royal Conch', des_es: 'Hace falta para subir el Castillo al nivel 10.', des_en: 'Needed to upgrade the Castle to level 10.' },
  perla_rey: { es: 'Perla del Rey', en: 'King\'s Pearl', des_es: 'Hace falta para subir el Castillo al nivel 11.', des_en: 'Needed to upgrade the Castle to level 11.' },
  corona_coral: { es: 'Corona de Coral', en: 'Coral Crown', des_es: 'Hace falta para subir el Castillo al nivel 12.', des_en: 'Needed to upgrade the Castle to level 12.' },
  /* v9.46: materiales de la FORJA de armaduras */
  polvo_forja: { es: 'Polvo de Forja', en: 'Forge Dust', des_es: 'Sirve para subir piezas de armadura del nivel 1 al 5. Se consigue fundiendo piezas repetidas.', des_en: 'Used to upgrade armor pieces from level 1 to 5. Get it by smelting duplicate pieces.' },
  carmot: { es: 'Carmot', en: 'Carmot', des_es: 'Metal raro para subir piezas de armadura del nivel 6 al 15. Sale en la Campaña y al fundir piezas buenas.', des_en: 'Rare metal to upgrade armor pieces from level 6 to 15. Found in the Campaign and by smelting good pieces.' },
  piedra_templado: { es: 'Piedra de Templado', en: 'Tempering Stone', des_es: 'Hace falta para subir piezas de armadura del nivel 11 al 15. Se gana en los Torneos y en la Campaña.', des_en: 'Needed to upgrade armor pieces from level 11 to 15. Won in Tournaments and the Campaign.' },
  caracola: { es: 'Caracola', en: 'Conch', des_es: 'Hace falta para subir un edificio o la muralla a los niveles 10 y 11.', des_en: 'Needed to upgrade a building or the wall to levels 10 and 11.' },
  flor_coral: { es: 'Flor de Coral', en: 'Coral Flower', des_es: 'Hace falta para subir un edificio o la muralla al nivel 12.', des_en: 'Needed to upgrade a building or the wall to level 12.' },
  elevacion_sol: { es: 'Elevación del Sol', en: 'Sun Elevation', des_es: 'La ELEVACIÓN: sube el Castillo del 12 al 13★ y abre los niveles con estrella.', des_en: 'The ELEVATION: takes the Castle from 12 to 13★ and opens the star levels.' },
  estrella_rey: { es: 'Estrella del Rey', en: 'King\'s Star', des_es: 'Hace falta para subir el Castillo a los niveles 14★, 15★ y 16★.', des_en: 'Needed to upgrade the Castle to levels 14★, 15★ and 16★.' },
  estrella_mar: { es: 'Estrella de Mar', en: 'Starfish', des_es: 'Hace falta para subir un edificio o la muralla a los niveles con estrella (13★ al 16★).', des_en: 'Needed to upgrade a building or the wall to star levels (13★ to 16★).' },
  lingote: { es: 'Lingote real', en: 'Royal ingot', des_es: 'Un lingote que vale 1.000.000 de oro.', des_en: 'An ingot worth 1,000,000 gold.' },
  botella: { es: 'Botella de campaña', en: 'Campaign flask', des_es: 'Energía para jugar la Campaña: cada misión gasta botellas. Se ganan cada día y cada mes al entrar, en torneos, logros y cofres, o se compran con gemas.', des_en: 'Energy to play the Campaign: each mission spends flasks. Earned every day and month by logging in, in tournaments, feats and chests, or bought with gems.' }, // v9.05
  cofre_tesoro: { es: 'Cofre del Tesoro', en: 'Treasure chest', des_es: 'Muchos recursos al abrirlo.', des_en: 'Lots of resources when opened.' },
  cofre_galeon: { es: 'Cofre del Galeón', en: 'Galleon Chest', des_es: 'Se gana con 5 llaves en la Ruleta. Trae Estrella de Mar, Caracolas, Cofres de oro, un Acelerador de 8 horas, un Cofre del Tesoro y una pieza de armadura de héroe.', des_en: 'Won with 5 keys on the Wheel. Holds a Sea Star, Conches, Golden chests, an 8-hour Speed-up, a Treasure chest and a hero armor piece.' }, // v8.02
  pack_tesoro7: { es: '7 Cofres del Tesoro', en: '7 Treasure chests', des_es: 'Paquete de 7 cofres del tesoro.', des_en: 'Pack of 7 treasure chests.' },
  pack_tesoro15: { es: '15 Cofres del Tesoro', en: '15 Treasure chests', des_es: 'Paquete de 15 cofres del tesoro.', des_en: 'Pack of 15 treasure chests.' },
  cofre_acel: { es: 'Cofre de aceleradores', en: 'Speed-up chest', des_es: '10 de 15 min, 5 de 1 hora, 2 de 8 horas y 1 de 24 horas.', des_en: '10× 15 min, 5× 1 hour, 2× 8 hours and 1× 24 hours.' },
  cofre_mejora1: { es: 'Cofre de mejora I', en: 'Upgrade chest I', des_es: '2 piezas de equipo comunes para tus héroes.', des_en: '2 common gear pieces for your heroes.' },
  cofre_mejora2: { es: 'Cofre de mejora II', en: 'Upgrade chest II', des_es: '1 pieza rara y 1 común.', des_en: '1 rare and 1 common piece.' },
  cofre_mejora3: { es: 'Cofre de mejora III', en: 'Upgrade chest III', des_es: '3 piezas raras y 100 Amatistas rúnicas.', des_en: '3 rare pieces and 100 Runic amethysts.' },
  cofre_mejora4: { es: 'Cofre de mejora IV', en: 'Upgrade chest IV', des_es: '1 pieza legendaria, 2 raras y 500 Amatistas rúnicas.', des_en: '1 legendary, 2 rare pieces and 500 Runic amethysts.' },
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
  inv_ballesteria: { es: 'Ballestería', en: 'Crossbowry', des_es: 'Desbloquea el Ballestero (nivel 2, con Galería de Tiro Nv 4).', des_en: 'Unlocks the Crossbowman (level 2, with Range Lv 4).' },
  inv_arco_compuesto: { es: 'Arco compuesto', en: 'Composite bow', des_es: 'Desbloquea el Arquero largo (Nv 2) y el Tirador élite (Nv 4).', des_en: 'Unlocks the Longbowman (Lv 2) and the Elite marksman (Lv 4).' },
  inv_equitacion: { es: 'Equitación', en: 'Horsemanship', des_es: 'Desbloquea el Jinete ligero (nivel 1, con Establo Nv 1).', des_en: 'Unlocks the Light rider (level 1, with Stable Lv 1).' },
  inv_monturas: { es: 'Monturas de guerra', en: 'War mounts', des_es: 'Desbloquea la Caballería (nivel 2, con Establo Nv 4).', des_en: 'Unlocks the Cavalry (level 2, with Stable Lv 4).' },
  inv_armadura_placas: { es: 'Armadura de placas', en: 'Plate armor', des_es: 'Desbloquea la Caballería pesada (nivel 4, con Establo Nv 8).', des_en: 'Unlocks the Heavy cavalry (level 4, with Stable Lv 8).' },
  inv_ingenieria: { es: 'Ingeniería', en: 'Engineering', des_es: 'Desbloquea las máquinas de asedio: Balista (Nv 1), Ariete (Nv 2), Catapulta (Nv 3) y Torre de asedio (Nv 4), con la Herrería.', des_en: 'Unlocks siege engines: Ballista (Lv 1), Ram (Lv 2), Catapult (Lv 3) and Siege tower (Lv 4), with the Forge.' },
  inv_logistica: { es: 'Logística Imperial', en: 'Imperial logistics', des_es: 'Desbloquea la Caravana Real (nivel 5, con Mercado Nv 9).', des_en: 'Unlocks the Royal Caravan (level 5, with Market Lv 9).' },
  inv_carretas_ref: { es: 'Carretas reforzadas', en: 'Reinforced wagons', des_es: 'Tus carretas de suministro cargan {v}% más al mandar recursos. El nivel 2 desbloquea la Carreta Pesada.', des_en: 'Your supply wagons carry {v}% more when sending resources.' },
  inv_carga: { es: 'Carga', en: 'Cargo', des_es: 'Tus carretas cargan {v}% más: llevas y robas más recursos.', des_en: 'Your carts carry {v}% more: you move and steal more resources.' },
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
var ICONO_RECURSO = { oro: '🪙', comida: '🍞', madera: '🪵', piedra: '🪨', hierro: '🔩', gemas: '💎' };
// Campos de recursos: van en las parcelas de fuera de la muralla y guardan lo que producen hasta que los recolectas
var TIPOS_CAMPO = ['granja', 'aserradero', 'mina', 'cantera'];
var HORAS_ALMACEN = 2;
// Parcelas de la ciudad: con el Castillo nivel 1 hay 4; cada nivel del Castillo abre 3 más (37 en el nivel 12)
var PARCELAS_INICIO = 6, PARCELAS_POR_NIVEL = 3; // v6.87: la ciudad (30 parcelas) se abre entera al nivel 9
// v6.87: parcelas de los campos que abre cada nivel del castillo (como en los grandes juegos de reinos)
var CAMPOS_POR_NIVEL = [0, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 41, 42, 43, 44, 45, 46];
// v6.87: objetos especiales para los niveles 10, 11 y 12
var ESPECIAL_CASTILLO = { 10: 'caracola_real', 11: 'perla_rey', 12: 'corona_coral', 13: 'elevacion_sol', 14: 'estrella_rey', 15: 'estrella_rey', 16: 'estrella_rey' };
// v7.14: cristales de ASCENSIÓN que pide cada nivel con estrella (★ = nivel − 12). El castillo pide el doble.
function cristalesAscension(L, castillo) {
  var st = L - 12; if (st < 1) return null;
  var c = st <= 4 ? { k: 'cristal_mistico', n: 2 * st } : st <= 10 ? { k: 'cristal_encantado', n: 2 * (st - 4) } : { k: 'cristal_arcano', n: 2 * (st - 10) };
  if (castillo) c.n *= 2;
  return c;
}
var ESPECIAL_EDIFICIO = { 10: 'caracola', 11: 'caracola', 12: 'flor_coral', 13: 'estrella_mar', 14: 'estrella_mar', 15: 'estrella_mar', 16: 'estrella_mar' }; // un campo lleno guarda 2 horas de producción
function esCampo(tipo) { return TIPOS_CAMPO.indexOf(tipo) >= 0; }
// El castillo cobra impuestos: da oro cada cierto tiempo
var IMPUESTO = { oro: 3, cada: 4 };
// Cada tropa come 1 de comida cada tantos segundos. Sin comida pelean más débiles.
var COMIDA_TROPA = { cada: 15, debilidad: 1 }; // v7.83: como en KoC, sin comida las tropas pelean al 100%

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
  vigia:      { costo: [50, 90, 140], madera: [70, 120, 180], piedra: [10, 30, 60], tiempo: [3, 5, 7], defensa: [0.03, 0.06, 0.09], icono: '👁️' },
  // v6.33: Cabaña: aloja a la población (cada nivel suma habitantes). Sin población libre no se entrena ni se construye.
  cabana:     { costo: [40, 70, 110], madera: [60, 100, 150], piedra: [10, 30, 60], tiempo: [3, 4, 6], poblacion: [100, 150, 200], icono: '🛖' },
  embajada:   { costo: [80, 130, 200], madera: [90, 140, 220], piedra: [40, 80, 140], tiempo: [4, 6, 8], icono: '🏳️' },
  relevo:     { costo: [50, 90, 140], madera: [70, 120, 180], piedra: [10, 40, 80], tiempo: [3, 5, 7], icono: '🚩' }
};
// Población: la base que da el castillo, y cuántos obreros pide cada obra
var POB_BASE = 300, OBREROS_OBRA = 5;
// Muralla: una sola, alrededor del castillo. Da vida extra al castillo. Nivel 1 de madera, 2 y 3 de piedra.
var MURALLA = { costo: [80, 140, 220], madera: [100, 0, 0], piedra: [0, 150, 260], tiempo: [5, 7, 9], vida: [400, 900, 1500], icono: '🧱' };
// ---------------- NIVELES HASTA EL 17 ----------------
// Los valores de los niveles 1-3 están escritos arriba; del 4 al 17 se calculan solos.
// v6.39: los edificios y la muralla suben hasta el nivel del castillo (30). NIVEL_VIEJO marca dónde empiezan los niveles nuevos.
var NIVEL_MAX = 27, NIVEL_VIEJO = 12; // v7.14: ASCENSIÓN como Kingdoms of Camelot: después del 12 vienen ★1 a ★15 (niveles 13 al 27)
// // v6.87: hasta el 12 normal; después de la ELEVACIÓN se sube del 13 al 16 (niveles con estrella)
var NIVEL_ESTRELLA = 12;
// Burbuja de protección para los que empiezan: 7 días o hasta el Castillo nivel 5 (lo primero que llegue)
var BURBUJA = { dias: 7, castillo: 5 };
// Carretas: se entrenan en el Mercado como las tropas; cada nivel carga más (nivel 1..4)
// v6.94: TROPAS DE SUMINISTRO. La carga se mide en «carretas»: la carretilla carga 0,4 de una carreta y el convoy 3.
// vel = cuánto tarda el viaje (1 = normal; menos es más rápido). Todas se entrenan en el Mercado (el convoy pide Mercado nivel 5).
var SUMINISTRO = {
  carretilla: { img: 't_carretilla', icono: '🛒', carga: 0.4, vel: 0.75, costo: { oro: 15, madera: 30 }, tiempo: 25, mercado: 1,
    es: 'Carreta Ligera', en: 'Light Wagon', des_es: 'Pequeña y rápida. Entre tus villas carga 5.000 por unidad y llega antes.', des_en: 'Small and fast: a villager pushes it. Carries little but arrives sooner.' },
  carreta: { img: 't_carreta', icono: '🐴', carga: 1, vel: 1, costo: { oro: 40, madera: 80 }, tiempo: 60, mercado: 1,
    es: 'Carreta de Suministro', en: 'Supply Wagon', des_es: 'La carreta de suministro de siempre: carga 10.000 recursos por unidad a tus aliados (+10% por nivel del Mercado y por Carretas reforzadas).', des_en: 'The standard wagon: carries 10,000 resources per unit to allies (+10% per Market level and Reinforced Wagons).' },
  convoy: { img: 't_convoy', icono: '🚚', carga: 5, vel: 1.35, costo: { oro: 200, madera: 350, piedra: 120 }, tiempo: 240, mercado: 5,
    es: 'Caravana Real', en: 'Royal Caravan', des_es: 'Caravana Real o Pesada: carga 50.000 recursos por unidad a tus aliados (5 carretas), pero va más despacio.', des_en: 'Several escorted wagons: carries a lot but travels slower.' }
};
var SUMINISTRO_ORDEN = ['carretilla', 'carreta', 'convoy'];
var CARRETA = { costo: { oro: 40, madera: 80 }, tiempo: 60, inicio: 2, capacidad: [0, 10000, 12500, 15000, 20000], // v7.99: 10.000 por carreta (más con el Mercado y Carretas reforzadas)
  mejora: [null, null, { oro: 600, madera: 900, piedra: 250 }, { oro: 1800, madera: 2800, piedra: 900 }, { oro: 5000, madera: 7000, piedra: 2800 }] };
// Lo que produce por hora cada casilla conquistada del mundo (por nivel de la casilla) y cuántas horas guarda
var CASILLA_RECOGER = { porNivel: 150, horas: 8 };
// Refuerzos que se pueden pedir según el nivel del caballero
function limiteRefuerzos(nivel) { return 20 + 10 * Math.max(1, nivel); }
// ---------------- BALANCE (v4.9) ----------------
// Cada nivel cuesta 1,6 veces el anterior y tarda más: minutos al principio, horas al final.
// Con los recursos del inicio solo alcanza para 1 o 2 edificios básicos; lo demás se gana jugando.
var CRECE_COSTO = 1.6;
var TIEMPO_NIVEL = [60, 180, 420, 900, 1800, 3600, 5400, 9000, 14400, 21600, 32400, 43200, 57600, 72000, 86400, 108000, 129600]; // segundos: 1 min ... 36 h
// del 18 al 30 cada nivel tarda un 17% más
// v6.81: del nivel 18 al 30 cada nivel tarda un 10% más (antes 17%): el nivel 30 baja de unos 7-14 días a 3-7 días
while (TIEMPO_NIVEL.length < 30) TIEMPO_NIVEL.push(Math.round(TIEMPO_NIVEL[TIEMPO_NIVEL.length - 1] * 1.10 / 600) * 600);
var BASE_EDIFICIO = {
  //            oro, madera, piedra, tiempo (x TIEMPO_NIVEL)
  granja:     [60, 40, 0, 0.6],   aserradero: [60, 20, 0, 0.6],   mina:      [90, 70, 0, 0.7],   cantera:  [90, 80, 0, 0.7],
  cuartel:    [130, 120, 20, 0.8], torre:     [150, 100, 60, 0.9], vigia:     [140, 160, 40, 0.9], almacen:  [160, 190, 50, 0.9],
  enfermeria: [170, 160, 50, 1.0], establo:   [190, 220, 60, 1.0], galeria:   [190, 220, 60, 1.0], herreria: [210, 170, 120, 1.1],
  academia:   [220, 230, 90, 1.2], mercado:   [240, 250, 90, 1.1], cabana:    [80, 120, 20, 0.6],
  embajada:   [200, 180, 80, 1.0], relevo:    [120, 140, 30, 0.8]
};
(function balanceEdificios() {
  function r5(v) { return v >= 100 ? Math.round(v / 5) * 5 : Math.round(v); }
  for (var tipo in BASE_EDIFICIO) {
    var b = BASE_EDIFICIO[tipo], d = EDIFICIOS[tipo]; if (!d) continue;
    d.costo = []; d.madera = []; d.piedra = []; d.tiempo = [];
    for (var L = 1; L <= NIVEL_MAX; L++) {
      var k = L <= NIVEL_VIEJO ? Math.pow(CRECE_COSTO, L - 1) : Math.pow(CRECE_COSTO, NIVEL_VIEJO - 1) * Math.pow(1.28, L - NIVEL_VIEJO);
      d.costo.push(r5(b[0] * k)); d.madera.push(r5(b[1] * k));
      // los que no piden piedra al principio la piden desde el nivel 2
      d.piedra.push(r5((b[2] || (L > 1 ? b[0] * 0.25 : 0)) * k));
      d.tiempo.push(Math.round(TIEMPO_NIVEL[L - 1] * b[3]));
    }
  }
  MURALLA.costo = []; MURALLA.madera = []; MURALLA.piedra = []; MURALLA.tiempo = [];
  for (var M = 1; M <= NIVEL_MAX; M++) {
    var km = M <= NIVEL_VIEJO ? Math.pow(CRECE_COSTO, M - 1) : Math.pow(CRECE_COSTO, NIVEL_VIEJO - 1) * Math.pow(1.28, M - NIVEL_VIEJO);
    MURALLA.costo.push(r5(200 * km)); MURALLA.madera.push(M === 1 ? 250 : 0); MURALLA.piedra.push(M === 1 ? 0 : r5(220 * km));
    MURALLA.tiempo.push(Math.round(TIEMPO_NIVEL[M - 1] * 1.2));
  }
})();
// Trabajos: además de pagar, para subir de nivel hay que haber hecho cosas en el juego.
// El índice es el nivel al que se quiere subir.
var TRABAJOS_CASTILLO = {
  oleadas:     [0, 0, 2, 4, 6, 8, 11, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60],
  recolectas:  [0, 0, 3, 8, 15, 25, 40, 60, 85, 115, 150, 190, 240, 300, 360, 420, 480, 540],
  tropas:      [0, 0, 5, 15, 30, 50, 80, 120, 170, 230, 300, 380, 470, 570, 670, 780, 900, 1030],
  campamentos: [0, 0, 0, 0, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 21, 24, 27, 30]
};
var TRABAJOS_EDIFICIO = { oleadas: [0, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 26, 30, 34, 38, 42, 46] };
while (TRABAJOS_EDIFICIO.oleadas.length <= 30) TRABAJOS_EDIFICIO.oleadas.push(TRABAJOS_EDIFICIO.oleadas[TRABAJOS_EDIFICIO.oleadas.length - 1] + 4);
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
    produce: ['x', 1.25], capacidad: ['+', 3], poblacion: ['+', 50], rapidez: ['+', 0.15], dano: ['x', 1.2], alcance: ['+', 0.4, 19], tope: ['+', 1, 15], protege: ['x', 1.35], tasa: ['+', 0.025, 0.8], defensa: ['+', 0.03, 0.36]
  };
  for (var t in EDIFICIOS) for (var c in reglas) if (Array.isArray(EDIFICIOS[t][c])) extender(EDIFICIOS[t][c], reglas[c]);
  extender(MURALLA.costo, ['x', 1.3]); extender(MURALLA.madera, ['=', 0]); extender(MURALLA.piedra, ['x', 1.3]);
  extender(MURALLA.tiempo, ['+', 2]); extender(MURALLA.vida, ['+', 600]);
})();
// Mejorar el castillo (nivel destino 2..12): cuesta más y tarda más cada vez.
// Ningún edificio ni la muralla pueden pasar el nivel del castillo.
// v6.32: el castillo sube hasta el nivel 30; v6.39: los demás edificios y la muralla también (sin pasar al castillo)
var CASTILLO_MAX = 27; // v7.14: hasta ★15
var MEJORA_CASTILLO = (function () {
  var m = { costo: [0], madera: [0], piedra: [0], tiempo: [0], vida: 300, dano: 3 };
  function r5(v) { return Math.round(v / 5) * 5; }
  // el castillo es lo más caro y lento: de 5 minutos (nivel 2) a 24 horas (nivel 12)
  var TC = [0, 300, 900, 1800, 3600, 7200, 10800, 18000, 28800, 43200, 64800, 86400, 108000, 129600, 151200, 172800, 216000];
  // del 18 al 30 cada nivel tarda un 17% más (el 30 tarda unos 13 días) y cuesta un 28% más
  TC = TC.slice(0, 9).concat([86400, 172800, 259200, 345600, 432000, 518400, 604800]);
  for (var tq = 17; tq <= 27; tq++) TC.push(604800 + (tq - 16) * 43200); // v7.14: ★5 = 7,5 días … ★15 = 12,5 días // v6.87: 10 = 1 día ... 12 = 3 días; 13★ = 4 días ... 16★ = 7 días
  for (var L = 2; L <= CASTILLO_MAX; L++) {
    if (L <= 9) { m.costo.push(r5(300 * Math.pow(1.62, L - 2))); m.madera.push(r5(360 * Math.pow(1.62, L - 2))); m.piedra.push(r5(120 * Math.pow(1.65, L - 2))); }
    else if (L <= NIVEL_VIEJO) { var k0 = m.costo.length - 1; m.costo.push(r5(m.costo[k0] * 2)); m.madera.push(r5(m.madera[k0] * 2)); m.piedra.push(r5(m.piedra[k0] * 2)); }
    else { var k = m.costo.length - 1; m.costo.push(r5(m.costo[k] * 1.28)); m.madera.push(r5(m.madera[k] * 1.28)); m.piedra.push(r5(m.piedra[k] * 1.28)); }
    m.tiempo.push(TC[L - 1]);
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
var ESCALA_TRAMO = [1, 0.84, 1, 1.14, 1.3]; // cada tramo el edificio es más grande (nivel 1 humilde, nivel 12 impresionante)
// La muralla rodea TODO el reino (óvalo con todos los terrenos adentro)
// El reino es más grande: todo se separa del castillo por este número
var ESCALA_REINO = 1.35;
// (v5.0: la muralla es un 20% más grande para que las parcelas tengan caminitos entre ellas)
// v6.31: muralla redonda centrada en el castillo, con 4 puertas y caminos de piedra en cruz
var MURALLA_FORMA = { cx: 0, cz: 0, rx: 50, rz: 50 }; // v7.44: ciudad por barrios (antes 40) // v7.16: ciudad compacta (antes 46)
// v7.16: lo que pasa de la plaza (16) hacia afuera se acerca al castillo (×0,75): parcelas y calles más juntas
var COMPACTA = 0.75; function compactar(v) { var a = Math.abs(v); return a <= 16 ? v : (v < 0 ? -1 : 1) * (16 + (a - 16) * COMPACTA); }
// // v6.86: muralla más pegada a los edificios (antes 56: mucho pasto vacío)
// v6.83: la muralla es CUADRADA (con las esquinas apenas redondeadas), como las ciudades de los grandes juegos de castillos.
// Cada ángulo t cae en el mismo rayo que antes; solo cambia la distancia: formaX/formaZ dan el punto del borde (radio 1).
var FORMA_N = 8;
function formaK(t) { var c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t)); return Math.pow(Math.pow(c, FORMA_N) + Math.pow(s, FORMA_N), -1 / FORMA_N); }
function formaX(t) { return Math.cos(t) * formaK(t); }
function formaZ(t) { return Math.sin(t) * formaK(t); }
// "distancia al cuadrado" a la muralla: 1 justo en el muro, menos de 1 dentro (sirve donde antes se usaba ux*ux + uz*uz)
function formaD2(ux, uz) { return Math.pow(Math.pow(Math.abs(ux), FORMA_N) + Math.pow(Math.abs(uz), FORMA_N), 2 / FORMA_N); }

// Barricada: se pone en los puntos marcados del camino. Los enemigos se paran a romperla.
// Nivel 1 de madera, nivel 2 de piedra. Se arregla sola al terminar cada oleada.
var BARRICADA = { costo: [40, 120], madera: [80, 0], piedra: [0, 150], vida: [350, 900], tiempo: [60, 300], icono: '🚧' };
// Campamentos de trasgos en el mapa del mundo (son del juego, no son jugadores)
var CAMPAMENTOS = [
  { x: 12, y: 18, nivel: 3 }, { x: 80, y: 14, nivel: 6 }, { x: 47, y: 52, nivel: 9 },
  { x: 20, y: 78, nivel: 5 }, { x: 74, y: 70, nivel: 12 }, { x: 55, y: 88, nivel: 7 },
  // v6.6: más aldeas bárbaras repartidas por el mapa
  { x: 33, y: 9, nivel: 1 }, { x: 64, y: 27, nivel: 2 }, { x: 8, y: 45, nivel: 2 }, { x: 38, y: 34, nivel: 4 }, { x: 88, y: 40, nivel: 8 },
  { x: 30, y: 62, nivel: 6 }, { x: 66, y: 50, nivel: 10 }, { x: 92, y: 88, nivel: 11 }, { x: 10, y: 92, nivel: 9 }, { x: 47, y: 72, nivel: 3 }
];
// Cofre diario: 7 días de racha (al día 8 vuelve a empezar el ciclo pero la racha sigue contando)
var COFRE_DIARIO = [
  { oro: 150, comida: 100 }, { madera: 150, piedra: 60, objeto: 'libro_peq' }, { gemas: 5, objeto: 'cofre_madera' },
  { oro: 250, comida: 200 }, { tropas: { espadachin: 2 } }, { gemas: 10, piedra: 120, objeto: 'libro_gra' }, { gemas: 20, objeto: 'cofre_oro' }
];
// Objetos de la mochila
// v9.14: PISTAS DE LA MÚSICA DE GUERRA (js/tk-musica-guerra.js). Para añadir una melodía nueva: sube el archivo .m4a a musica/
// y ponlo aquí. archivo vacío = se usa la música hecha con código (respaldo). inicioBucle = segundo donde empieza a repetirse.
// Situaciones: preparacion, marcha, batalla, asedio, critica (en bucle) · victoria, derrota (suenan una vez)
var PISTAS_GUERRA = {
  preparacion: { archivo: 'musica/guerra_preparacion.m4a', vol: 1, inicioBucle: 0 },
  marcha:      { archivo: 'musica/guerra_marcha.m4a', vol: 1, inicioBucle: 0 },
  batalla:     { archivo: 'musica/guerra_batalla.m4a', vol: 1, inicioBucle: 0 },
  asedio:      { archivo: 'musica/guerra_asedio.m4a', vol: 1, inicioBucle: 0 },
  critica:     { archivo: 'musica/guerra_critica.m4a', vol: 1, inicioBucle: 0 },
  victoria:    { archivo: 'musica/guerra_victoria.m4a', vol: 1, unaVez: true },
  derrota:     { archivo: 'musica/guerra_derrota.m4a', vol: 1, unaVez: true }
};
var OBJETOS = {
  cofre_madera: { icono: '📦', cofre: { oro: [80, 150], comida: [60, 120], madera: [60, 120] } },
  cofre_plata:  { icono: '🎁', cofre: { oro: [150, 300], madera: [100, 200], piedra: [60, 120] } },
  cofre_oro:    { icono: '💰', cofre: { oro: [300, 600], comida: [200, 400], madera: [200, 400], piedra: [150, 300] } },
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
  libro_gra:    { icono: '📗', exp: 1500 },
  // v6.9: más aceleradores, aceleradores solo para investigar, recursos grandes, cofres y paquetes
  acel_2h5:     { icono: '⌛', segundos: 9000 },
  acel_15h:     { icono: '⌛', segundos: 54000 },
  acel_24h:     { icono: '⌛', segundos: 86400 },
  inv_1m:       { icono: '🔮', segundos: 60, soloInv: true },
  inv_15m:      { icono: '🔮', segundos: 900, soloInv: true },
  inv_1h:       { icono: '🔮', segundos: 3600, soloInv: true },
  inv_2h5:      { icono: '🔮', segundos: 9000, soloInv: true },
  inv_8h:       { icono: '🔮', segundos: 28800, soloInv: true },
  inv_15h:      { icono: '🔮', segundos: 54000, soloInv: true },
  inv_24h:      { icono: '🔮', segundos: 86400, soloInv: true },
  inv_3d:       { icono: '🔮', segundos: 259200, soloInv: true },
  reclutas:     { icono: '📯', tropas: { espadachin: 10 } },
  tropas_mil: { icono: '🪓', inv: 'tropas', tropas: { miliciano: 1000 } }, tropas_esp: { icono: '⚔️', inv: 'tropas', tropas: { espadachin: 500 } }, tropas_arq: { icono: '🏹', inv: 'tropas', tropas: { arquero: 500 } },
  tropas_gua: { icono: '🛡️', inv: 'tropas', tropas: { guardian: 300 } }, tropas_cab: { icono: '🐎', inv: 'tropas', tropas: { caballeria: 200 } }, tropas_bal: { icono: '🎯', inv: 'tropas', tropas: { balista: 50 } },
  tropas_ari: { icono: '🪵', inv: 'tropas', tropas: { ariete: 50 } }, tropas_cat: { icono: '☄️', inv: 'tropas', tropas: { catapulta: 50 } }, // v8.73
  // v7.14: tienda nueva (Combate, Potenciador, Recursos, Reliquia, Intercambia). inv = pestaña del Inventario.
  cristal_mistico:   { icono: '🔷', inv: 'reliquia', especial: true },
  cristal_encantado: { icono: '💠', inv: 'reliquia', especial: true },
  cristal_arcano:    { icono: '🔮', inv: 'reliquia', especial: true },
  cuerno_guerra:   { icono: '📯', inv: 'combate', efecto: 'atk', horas: 1 },
  tambor_batalla:  { icono: '🥁', inv: 'combate', efecto: 'vida', horas: 1 }, // v8.18
  coraza_acero:    { icono: '🛡️', inv: 'combate', efecto: 'def', horas: 1 },
  marcha_rapida:   { icono: '🏃', inv: 'combate', efecto: 'velMarcha', horas: 1 },
  retirada_marcha: { icono: '🏳️', inv: 'combate', efecto: 'retirada' },
  ampliar_marcha:  { icono: '🚩', inv: 'combate', efecto: 'capMarcha', horas: 1 },
  bono_comida:     { icono: '🌾', inv: 'potenciador', efecto: 'prod_comida', horas: 24 },
  bono_madera:     { icono: '🪵', inv: 'potenciador', efecto: 'prod_madera', horas: 24 },
  bono_piedra:     { icono: '🪨', inv: 'potenciador', efecto: 'prod_piedra', horas: 24 },
  bono_oro:        { icono: '🪙', inv: 'potenciador', efecto: 'prod_oro', horas: 24 },
  constructor_exp: { icono: '👷', inv: 'potenciador', efecto: 'obras', horas: 24 },
  cosecha_ya:      { icono: '🧺', inv: 'potenciador', efecto: 'cosecha', horas: 6 },
  comida_2m:       { icono: '🌾', inv: 'recursos', da: { comida: 2000000 } },
  madera_2m:       { icono: '🪵', inv: 'recursos', da: { madera: 2000000 } },
  piedra_2m:       { icono: '🪨', inv: 'recursos', da: { piedra: 2000000 } },
  oro_1m:          { icono: '💰', inv: 'recursos', da: { oro: 1000000 } },
  mixto_1m:        { icono: '🏗️', inv: 'recursos', da: { oro: 1000000, comida: 1000000, madera: 1000000, piedra: 1000000 } },
  ficha_x1:        { icono: '🪙', inv: 'reliquia', efecto: 'fichas', n: 1 },
  amatista_100:    { icono: '🔮', inv: 'recursos', efecto: 'amatista', n: 100 }, // v7.97
  amatista_500:    { icono: '🔮', inv: 'recursos', efecto: 'amatista', n: 500 },
  ficha_x5:        { icono: '🪙', inv: 'reliquia', efecto: 'fichas', n: 5 },
  ficha_azar10:    { icono: '🪙', inv: 'reliquia', fichasPack: { azar: 10 } }, // v8.19
  ficha_rul5:      { icono: '🎡', inv: 'reliquia', fichasPack: { ruleta: 5 } },
  cofre_fichas1:   { icono: '🧰', inv: 'reliquia', fichasPack: { azar: 5, ruleta: 2 } },
  cofre_fichas2:   { icono: '🧰', inv: 'reliquia', fichasPack: { azar: 15, ruleta: 6 } },
  cofre_fichas3:   { icono: '🧰', inv: 'reliquia', fichasPack: { azar: 40, ruleta: 15 } },
  energia_heroe:   { icono: '⚡', inv: 'reliquia', efecto: 'expHeroe', n: 50 },
  carreta_sum:     { icono: '🐴', inv: 'tropas', efecto: 'carreta', n: 1 }, // v7.86
  carretas_x10:    { icono: '🐴', inv: 'tropas', efecto: 'carreta', n: 10 },
  cofre_dragon:    { icono: '🐉', inv: 'reliquia', efecto: 'elegirDragon' }, // v7.84
  vip_100:         { icono: '👑', inv: 'reliquia', efecto: 'vip', n: 100 }, // v7.79
  llave_bronce:    { icono: '🗝️', inv: 'reliquia', efecto: 'abrirCofre', cofre: 'cofre_plata' },
  llave_plata:     { icono: '🔑', inv: 'reliquia', efecto: 'abrirCofre', cofre: 'cofre_oro' },
  reinicio_tal:    { icono: '🔄', inv: 'intercambia', efecto: 'talentos' },
  cambio_nombre:   { icono: '✒️', inv: 'intercambia', efecto: 'nombre' },
  megafono:        { icono: '📣', inv: 'intercambia', efecto: 'megafono', n: 5 },
  oro_500k:     { icono: '💰', da: { oro: 500000 } },
  comida_500k:  { icono: '🌾', da: { comida: 500000 } },
  madera_500k:  { icono: '🪵', da: { madera: 500000 } },
  piedra_500k:  { icono: '🪨', da: { piedra: 500000 } },
  lingote:      { icono: '🥇', da: { oro: 1000000 } },
  botella:      { icono: '🧪' }, // v9.05: energía de la Campaña (se gasta en el mapa de Campaña)
  caracola_real: { icono: '🐚', especial: true }, perla_rey: { icono: '🫧', especial: true }, corona_coral: { icono: '👑', especial: true },
  polvo_forja:  { icono: '✨', especial: true }, carmot: { icono: '💠', especial: true }, piedra_templado: { icono: '🔷', especial: true }, // v9.46: forja
  caracola:     { icono: '🐚', especial: true }, flor_coral: { icono: '🌺', especial: true },
  elevacion_sol: { icono: '☀️', especial: true }, estrella_rey: { icono: '🌟', especial: true }, estrella_mar: { icono: '⭐', especial: true },
  cofre_galeon: { icono: '🎁', galeon: true }, // v8.02: se abre en el Inventario (contenido en GALEON, juego.js)
  cofre_tesoro: { icono: '🎁', cofre: { oro: [20000, 50000], comida: [20000, 50000], madera: [20000, 50000], piedra: [10000, 30000] } },
  pack_tesoro7: { icono: '🎁', paquete: { cofre_tesoro: 7 } },
  pack_tesoro15: { icono: '🎁', paquete: { cofre_tesoro: 15 } },
  cofre_acel:   { icono: '⏩', paquete: { acel_15m: 10, acel_1h: 5, acel_8h: 2, acel_24h: 1 } },
  cofre_mejora1: { icono: '🧰', mejora: ['comun', 'comun'] },
  cofre_mejora2: { icono: '🧰', mejora: ['raro', 'comun'] },
  cofre_mejora3: { icono: '🧰', mejora: ['raro', 'raro', 'raro'], extra: { amatista_100: 1 } }, // v7.97: trae Amatista rúnica
  cofre_mejora4: { icono: '🧰', mejora: ['legendario', 'raro', 'raro'], extra: { amatista_500: 1 } }
};
// Tienda: se paga con gemas (las compras con dinero real llegarán con la App Store)
var TIENDA = [
  // Recursos
  { id: 'bolsa_oro', gemas: 5, cat: 'recursos' }, { id: 'saco_comida', gemas: 4, cat: 'recursos' }, { id: 'saco_madera', gemas: 4, cat: 'recursos' }, { id: 'saco_piedra', gemas: 5, cat: 'recursos' },
  { id: 'oro_500k', gemas: 25, cat: 'recursos' }, { id: 'comida_500k', gemas: 5, cat: 'recursos' }, { id: 'madera_500k', gemas: 5, cat: 'recursos' }, { id: 'piedra_500k', gemas: 5, cat: 'recursos' }, // v7.14: de 10 a 5
  // Acelerar (todo) y solo investigación
  { id: 'acel_1m', gemas: 1, cat: 'acelerar' }, { id: 'acel_5m', gemas: 2, cat: 'acelerar' }, { id: 'acel_15m', gemas: 5, cat: 'acelerar' }, { id: 'acel_1h', gemas: 10, cat: 'acelerar' }, { id: 'acel_2h5', gemas: 15, cat: 'acelerar' },
  { id: 'acel_8h', gemas: 30, cat: 'acelerar' }, { id: 'acel_12h', gemas: 35, cat: 'acelerar' }, { id: 'acel_15h', gemas: 40, cat: 'acelerar' }, { id: 'acel_24h', gemas: 60, cat: 'acelerar' },
  { id: 'inv_1m', gemas: 1, cat: 'acelerar' }, { id: 'inv_15m', gemas: 14, cat: 'acelerar' }, { id: 'inv_1h', gemas: 26, cat: 'acelerar' }, { id: 'inv_2h5', gemas: 50, cat: 'acelerar' },
  { id: 'inv_8h', gemas: 130, cat: 'acelerar' }, { id: 'inv_15h', gemas: 200, cat: 'acelerar' }, { id: 'inv_24h', gemas: 300, cat: 'acelerar' }, { id: 'inv_3d', gemas: 680, cat: 'acelerar' },
  // Combate
  { id: 'portal_azar', gemas: 10, cat: 'combate' }, { id: 'portal_elegir', gemas: 30, cat: 'combate' }, { id: 'reclutas', gemas: 25, cat: 'combate' },
  // Cofres (con ofertas)
  { id: 'cofre_tesoro', gemas: 29, antes: 89, cat: 'cofres' }, { id: 'pack_tesoro7', gemas: 190, antes: 599, cat: 'cofres' }, { id: 'pack_tesoro15', gemas: 385, antes: 1199, cat: 'cofres' },
  { id: 'ficha_azar10', gemas: 20, cat: 'varios' }, { id: 'ficha_rul5', gemas: 70, cat: 'varios' }, { id: 'cofre_fichas1', gemas: 39, cat: 'varios' }, { id: 'cofre_fichas2', gemas: 99, cat: 'varios' }, { id: 'cofre_fichas3', gemas: 229, cat: 'varios' } /* v9.49: los cofres de fichas en Varios */, // v8.19
  { id: 'cofre_mejora4', gemas: 399, cat: 'cofres' }, { id: 'cofre_mejora3', gemas: 99, cat: 'cofres' }, { id: 'cofre_mejora2', gemas: 49, cat: 'cofres' }, { id: 'cofre_mejora1', gemas: 19, cat: 'cofres' },
  { id: 'cofre_acel', gemas: 240, cat: 'cofres' },
  // Varios
  { id: 'lingote', gemas: 100, cat: 'varios' },
  { id: 'caracola', gemas: 45, cat: 'varios' }, { id: 'flor_coral', gemas: 55, cat: 'varios' }, { id: 'caracola_real', gemas: 150, cat: 'varios' }, { id: 'perla_rey', gemas: 200, cat: 'varios' }, { id: 'corona_coral', gemas: 220, cat: 'varios' },
  { id: 'estrella_mar', gemas: 70, cat: 'varios' }, { id: 'elevacion_sol', gemas: 300, cat: 'varios' }, { id: 'estrella_rey', gemas: 250, cat: 'varios' },
  { id: 'acelerador', gemas: 20, cat: 'acelerar' }, /* v6.54: el cofre de equipo ya no se vende: el equipo se gana jugando */ { id: 'cofre_plata', gemas: 15, cat: 'cofres' }, { id: 'cofre_oro', cat: 'cofres', gemas: 40 },
  { id: 'escudo_2h', gemas: 10, cat: 'combate' }, { id: 'escudo_8h', gemas: 30, cat: 'combate' }, { id: 'escudo_12h', gemas: 45, cat: 'combate' },
  // v7.14: pestañas que estaban vacías
  { id: 'cuerno_guerra', gemas: 15, cat: 'combate' }, { id: 'tambor_batalla', gemas: 15, cat: 'combate' }, { id: 'coraza_acero', gemas: 15, cat: 'combate' }, { id: 'marcha_rapida', gemas: 10, cat: 'combate' }, { id: 'retirada_marcha', gemas: 20, cat: 'combate' }, { id: 'ampliar_marcha', gemas: 35, cat: 'combate' },
  { id: 'bono_comida', gemas: 10, cat: 'varios' }, { id: 'bono_madera', gemas: 10, cat: 'varios' }, { id: 'bono_piedra', gemas: 10, cat: 'varios' }, { id: 'bono_oro', gemas: 10, cat: 'varios' }, { id: 'constructor_exp', gemas: 25, cat: 'varios' }, { id: 'vip_100', gemas: 20, cat: 'varios' }, { id: 'carreta_sum', gemas: 5, cat: 'varios' }, { id: 'carretas_x10', gemas: 40, cat: 'varios' }, { id: 'cosecha_ya', gemas: 15, cat: 'varios' },
  { id: 'comida_2m', gemas: 25, cat: 'recursos' }, { id: 'madera_2m', gemas: 25, cat: 'recursos' }, { id: 'piedra_2m', gemas: 25, cat: 'recursos' }, { id: 'oro_1m', gemas: 30, cat: 'recursos' }, { id: 'mixto_1m', gemas: 45, cat: 'recursos' },
  { id: 'ficha_x1', gemas: 15, cat: 'varios' }, { id: 'ficha_x5', gemas: 65, cat: 'varios' }, { id: 'energia_heroe', gemas: 10, cat: 'varios' }, { id: 'llave_bronce', gemas: 20, cat: 'varios' }, { id: 'llave_plata', gemas: 20, cat: 'varios' },
  { id: 'cristal_mistico', gemas: 20, cat: 'varios' }, { id: 'cristal_encantado', gemas: 40, cat: 'varios' }, { id: 'cristal_arcano', gemas: 80, cat: 'varios' },
  // v8.73 (dueño): la Tienda más llena. NUNCA héroes ni las armaduras buenas que se lanzan (juegos de héroe, Dragón, Galeón).
  { id: 'tropas_mil', gemas: 30, cat: 'combate' }, { id: 'tropas_esp', gemas: 40, cat: 'combate' }, { id: 'tropas_arq', gemas: 40, cat: 'combate' }, { id: 'tropas_gua', gemas: 50, cat: 'combate' },
  { id: 'tropas_cab', gemas: 55, cat: 'combate' }, { id: 'tropas_bal', gemas: 55, cat: 'combate' }, { id: 'tropas_ari', gemas: 45, cat: 'combate' }, { id: 'tropas_cat', gemas: 65, cat: 'combate' },
  { id: 'libro_peq', gemas: 8, cat: 'varios' }, { id: 'libro_gra', gemas: 35, cat: 'varios' }, { id: 'pergamino', gemas: 15, cat: 'varios' },
  { id: 'amatista_100', gemas: 15, cat: 'recursos' }, { id: 'amatista_500', gemas: 60, cat: 'recursos' },
  { id: 'cofre_madera', gemas: 2, cat: 'cofres' }, { id: 'cofre_equipo', gemas: 25, cat: 'cofres' },
  { id: 'reinicio_tal', gemas: 30, cat: 'varios' }, { id: 'cambio_nombre', gemas: 50, cat: 'varios' }, { id: 'megafono', gemas: 10, cat: 'varios' }
];
// Investigación: 3 ramas. 'cada' = cuánto mejora cada nivel.
// v6.86: ICONOS CON DIBUJO: cada objeto que tenga su imagen en iconos/ui/ la usa en vez del emoji.
// Para añadir uno nuevo: guarda la imagen como iconos/ui/<archivo>.webp y ponlo en esta lista (objeto: archivo).
var ICONOS_IMG = {
  perla_rey: 'o_perla_rey', corona_coral: 'o_corona_coral', flor_coral: 'o_flor_coral', elevacion_sol: 'o_elevacion_sol', estrella_rey: 'o_estrella_rey', // v6.89
  caracola: 'o_caracola', caracola_real: 'o_caracola',
  portal_elegir: 'o_portal_elegir', reclutas: 'o_reclutas',
  libro_peq: 'o_libro', libro_gra: 'o_tomo', pergamino: 'o_pergamino', portal_azar: 'o_portal_azar',
  lingote: 'o_lingote',
  acelerador: 'o_acel', acel_1m: 'o_acel', acel_5m: 'o_acel', acel_15m: 'o_acel', acel_1h: 'o_acel', acel_2h5: 'o_acel', acel_8h: 'o_acel', acel_12h: 'o_acel', acel_15h: 'o_acel', acel_24h: 'o_acel',
  inv_1m: 'o_arcano', inv_15m: 'o_arcano', inv_1h: 'o_arcano', inv_2h5: 'o_arcano', inv_8h: 'o_arcano', inv_15h: 'o_arcano', inv_24h: 'o_arcano', inv_3d: 'o_arcano',
  escudo_2h: 'o_escudo_2h', escudo_8h: 'o_escudo_8h', escudo_12h: 'o_escudo_12h', estrella_mar: 'o_estrella_mar',
  bolsa_oro: 'o_bolsa_oro', oro_500k: 'o_bolsa_oro', saco_comida: 'o_comida', comida_500k: 'o_comida',
  saco_madera: 'o_madera', madera_500k: 'o_madera', saco_piedra: 'o_piedra', piedra_500k: 'o_piedra',
  cofre_madera: 'o_cofre_madera', cofre_plata: 'o_cofre_plata', cofre_oro: 'o_cofre_oro',
  cofre_acel: 'o_cofre_acel',
  cofre_equipo: 'o_cofre_equipo',
  cofre_galeon: 'o_galeon', cofre_tesoro: 'o_cofre_tesoro', pack_tesoro7: 'o_cofre_tesoro', pack_tesoro15: 'o_cofre_tesoro',
  cofre_mejora1: 'o_cofre_mejora', cofre_mejora2: 'o_cofre_mejora', cofre_mejora3: 'o_cofre_mejora', cofre_mejora4: 'o_cofre_mejora'
};
// retratos dibujados de las tropas (si no hay, se usa la foto del modelo 3D)
var RETRATOS_IMG = {
  h_sol: 'h_sol', h_luna: 'h_luna', h_ancla: 'h_ancla', h_brisa: 'h_brisa', h_chispa: 'h_chispa', h_roble: 'h_roble', // v6.89: retratos pintados de los héroes
  h_trueno: 'h_trueno', h_pluma: 'h_pluma', h_leon: 'h_leon', h_fenix: 'h_fenix', h_titan: 'h_titan', h_aguila: 'h_aguila',
  espadachin: 't_espadachin', arquero: 't_arquero', ballestero: 't_ballestero', arquero_largo: 't_arquero_largo', tirador_elite: 't_tirador_elite', caballeria: 't_caballeria', guardian: 't_guardian', explorador: 't_explorador', miliciano: 't_miliciano',
  carreta: 't_carreta', jinete: 't_jinete', caballeria_pesada: 't_caballeria_pesada', balista: 't_balista', ariete: 't_ariete', catapulta: 't_catapulta', torre_asedio: 't_torre_asedio',
  granja: 'e_granja', aserradero: 'e_aserradero', mina: 'e_mina', cantera: 'e_cantera',
  cuartel: 'e_cuartel', torre: 'e_torre', academia: 'e_academia', enfermeria: 'e_enfermeria',
  almacen: 'e_almacen', mercado: 'e_mercado', herreria: 'e_herreria', establo: 'e_establo',
  galeria: 'e_galeria', vigia: 'e_vigia', cabana: 'e_cabana', embajada: 'e_embajada',
  relevo: 'e_relevo', muralla: 'e_muralla'
};
// la ficha de la suerte del Azar
var ICONO_FICHA = '<img class="ico-obj" src="iconos/ui/o_ficha.webp" alt="🪙" draggable="false">';
Object.keys(ICONOS_IMG).forEach(function (k) {
  if (!OBJETOS[k]) return;
  OBJETOS[k].emoji = OBJETOS[k].icono;
  OBJETOS[k].icono = '<img class="ico-obj" src="iconos/ui/' + ICONOS_IMG[k] + '.webp" alt="' + OBJETOS[k].emoji + '" draggable="false">';
});

var INVESTIGACION = {
  crecimiento: [
    { id: 'obras', icono: '🔨', max: 6, cada: 0.08 },     // obras más rápidas
    { id: 'cuarteles', icono: '⚔️', max: 15, cada: 2 },    // +2 de capacidad
    { id: 'entreno', icono: '⏱️', max: 15, cada: 0.1 }     // entrenar más rápido
  ],
  economia: [
    { id: 'cosecha', icono: '🌾', max: 15, cada: 0.1 },
    { id: 'lenadores', icono: '🪵', max: 15, cada: 0.1 },
    { id: 'canteros', icono: '🪨', max: 15, cada: 0.1 },
    { id: 'impuestos', icono: '🪙', max: 15, cada: 0.1 },
    { id: 'carga', icono: '📦', max: 15, cada: 0.1 },      // las carretas cargan más (y roban más)
    { id: 'carretas_ref', icono: '🛒', max: 15, cada: 0.1 } // v7.99: Carretas reforzadas: +10% de carga de suministro por nivel
  ],
  batalla: [
    { id: 'espadas', icono: '🗡️', max: 15, cada: 0.05 },   // tropas pegan más
    { id: 'escudos', icono: '🛡️', max: 15, cada: 0.05 },   // tropas con más vida
    { id: 'flechas', icono: '🏹', max: 15, cada: 0.1 },    // torres pegan más
    { id: 'muros', icono: '🧱', max: 15, cada: 0.1 },      // muralla y barricadas con más vida
    // v8.00: investigaciones que desbloquean tropas
    { id: 'ballesteria', icono: '🎯', max: 5, cada: 0 }, { id: 'arco_compuesto', icono: '🏹', max: 5, cada: 0 },
    { id: 'equitacion', icono: '🐎', max: 5, cada: 0 }, { id: 'monturas', icono: '🏇', max: 5, cada: 0 }, { id: 'armadura_placas', icono: '🛡️', max: 5, cada: 0 },
    { id: 'ingenieria', icono: '⚙️', max: 5, cada: 0 }, { id: 'logistica', icono: '🗺️', max: 5, cada: 0 }
  ]
};
// Rama "Tropas": Ataque, Vida, Defensa y Velocidad para cada tipo de tropa (v5.1)
var STATS_TROPA = [['ataque', '⚔️', 0.05], ['vida', '❤️', 0.05], ['defensa', '🛡️', 0.03], ['velocidad', '👟', 0.03]];
var NOMBRE_STAT = { ataque: ['Ataque', 'Attack', 'de ataque', 'attack'], vida: ['Vida', 'Health', 'de vida', 'health'], defensa: ['Defensa', 'Defense', 'de defensa (reciben menos daño)', 'defense (take less damage)'], velocidad: ['Velocidad', 'Speed', 'de velocidad', 'speed'] };
INVESTIGACION.tropas = [];
['espadachin', 'arquero', 'guardian', 'caballeria'].forEach(function (tp) {
  STATS_TROPA.forEach(function (s) {
    var id = 't_' + tp + '_' + s[0];
    INVESTIGACION.tropas.push({ id: id, icono: s[1], max: 15, cada: s[2], tropa: tp, stat: s[0] });
    NOMBRES['inv_' + id] = {
      es: NOMBRE_STAT[s[0]][0], en: NOMBRE_STAT[s[0]][1],
      des_es: '+{v}% ' + NOMBRE_STAT[s[0]][2] + ' para ' + NOMBRES[tp].es, des_en: '+{v}% ' + NOMBRE_STAT[s[0]][3] + ' for ' + NOMBRES[tp].en
    };
  });
});
// Costo y tiempo del nivel L (1, 2, 3...): investigar toma tiempo de verdad
function costoInvestigacion(L) {
  if (L <= 6) return { oro: 120 * L + 60 * L * L, madera: 100 * L + 45 * L * L, piedra: L >= 2 ? 40 * L * L : 0 };
  // v7.97: niveles 7 a 15: piden los 5 recursos y cada nivel cuesta el doble que el anterior
  var m = Math.pow(2, L - 6);
  return { oro: (120 * L + 60 * L * L) * m, comida: 150 * L * L * m, madera: (100 * L + 45 * L * L) * m, piedra: 40 * L * L * m, hierro: 60 * L * L * m };
}
// v7.97: AMATISTA RÚNICA: recurso raro que piden las investigaciones desde el nivel 11 (no la dan las minas: solo eventos y combate)
var AMATISTA_INV = { 11: 100, 12: 250, 13: 500, 14: 1500, 15: 5000 };
function amatistaInvestigacion(L) { return AMATISTA_INV[L] || 0; }
var TIEMPO_INV = [0, 120, 420, 1200, 3600, 10800, 28800, 43200, 57600, 72000, 86400, 115200, 144000, 172800, 216000, 259200]; // v7.97: hasta el nivel 15
function tiempoInvestigacion(L) { return TIEMPO_INV[Math.min(L, TIEMPO_INV.length - 1)]; }
// Poder que da cada nivel investigado y cada nivel de una pieza de equipo
var PODER_INVEST = 250, PODER_PIEZA = 60;
var PUNTOS_BARRICADA = [0.40, 0.53, 0.66, 0.79]; // en qué parte del camino (0 = bosque, 1 = castillo)

// El castillo también dispara (para que la primera oleada sea posible)
var CASTILLO = { dano: 12, alcance: 9.5, ritmo: 1.1 };

// ---------------- Tropas ----------------
var TROPAS = {
  espadachin: { costo: 25, comida: 30, tiempo: 120, vida: 150, dano: 18, alcance: 1.3, vel: 3.2, ritmo: 0.9, icono: '🗡️' },
  arquero:    { costo: 35, comida: 30, tiempo: 160, vida: 85,  dano: 12, alcance: 7.5, vel: 3.0, ritmo: 1.1, distancia: true, icono: '🏹' },
  caballeria: { costo: 60, comida: 50, tiempo: 240, vida: 200, dano: 20, alcance: 1.6, vel: 5.2, ritmo: 1.0, icono: '🐎' },
  guardian:   { costo: 55, comida: 60, tiempo: 300, vida: 390, dano: 11, alcance: 1.4, vel: 2.4, ritmo: 1.2, icono: '🛡️' },
  heroe:      { costo: 0,  tiempo: 0, vida: 950, dano: 42, alcance: 1.7, vel: 3.4, ritmo: 0.8, cura: 10, icono: '👑' },
  // v6.1: tropas nuevas (se abren subiendo el Cuartel, el Establo y la Herrería)
  explorador: { costo: 15, comida: 15, tiempo: 80, vida: 70, dano: 8, alcance: 1.2, vel: 5.0, ritmo: 0.8, icono: '🧭' },
  miliciano:  { costo: 12, comida: 20, tiempo: 60, vida: 110, dano: 10, alcance: 1.2, vel: 3.0, ritmo: 1.0, icono: '🪓' },
  jinete:     { costo: 45, comida: 40, tiempo: 180, vida: 150, dano: 16, alcance: 1.5, vel: 6.0, ritmo: 0.9, icono: '🏇' },
  caballeria_pesada: { costo: 110, comida: 80, tiempo: 440, vida: 380, dano: 30, alcance: 1.7, vel: 4.2, ritmo: 1.1, icono: '🐴' },
  // v7.87: más tropas del Campo de Tiro
  ballestero: { costo: 50, comida: 40, tiempo: 220, vida: 110, dano: 17, alcance: 7, vel: 2.8, ritmo: 1.3, distancia: true, icono: '🏹' },
  arquero_largo: { costo: 75, comida: 50, tiempo: 300, vida: 100, dano: 20, alcance: 9.5, vel: 2.9, ritmo: 1.2, distancia: true, icono: '🏹' },
  tirador_elite: { costo: 140, comida: 80, tiempo: 520, vida: 160, dano: 34, alcance: 10, vel: 3.1, ritmo: 1.1, distancia: true, icono: '🎯' },
  balista:    { costo: 120, comida: 40, tiempo: 480, vida: 180, dano: 55, alcance: 10, vel: 1.6, ritmo: 2.6, distancia: true, icono: '🎯' },
  ariete:     { costo: 150, comida: 30, tiempo: 600, vida: 600, dano: 40, alcance: 1.6, vel: 1.4, ritmo: 2.2, icono: '🪵' },
  catapulta:  { costo: 220, comida: 50, tiempo: 800, vida: 260, dano: 90, alcance: 12, vel: 1.2, ritmo: 3.4, distancia: true, icono: '☄️' },
  torre_asedio: { costo: 400, comida: 100, tiempo: 1440, vida: 1400, dano: 25, alcance: 1.8, vel: 1.0, ritmo: 1.6, icono: '🗼' }
};
// Qué hace falta para entrenar cada tropa: edificio y su nivel, y a veces otro edificio o el nivel del jugador
// v6.81: entrenar es un 35% más rápido (un espadachín pasa de 2:00 a 1:18)
Object.keys(TROPAS).forEach(function (k) { if (TROPAS[k].tiempo) TROPAS[k].tiempo = Math.max(10, Math.round(TROPAS[k].tiempo * 0.65)); });
// v7.14: COMBATE POR RONDAS como Kingdoms of Camelot (2012). vida, ataque, rango (alcance en el campo) y velocidad (lo que avanza
// por ronda). Los dos ejércitos empiezan a 1.500 de distancia; cada grupo avanza si no tiene a nadie a tiro y dispara si lo tiene.
var COMBATE_KOC = {
  explorador:        { vida: 50,   ataque: 5,    rango: 50,   velocidad: 1000 },
  jinete:            { vida: 300,  ataque: 150,  rango: 200,  velocidad: 850 },
  miliciano:         { vida: 100,  ataque: 25,   rango: 100,  velocidad: 250 },
  arquero:           { vida: 200,  ataque: 180,  rango: 1200, velocidad: 250, distancia: true },
  caballeria:        { vida: 500,  ataque: 250,  rango: 200,  velocidad: 750 },
  espadachin:        { vida: 350,  ataque: 100,  rango: 150,  velocidad: 275 },
  guardian:          { vida: 700,  ataque: 80,   rango: 150,  velocidad: 225 },
  balista:           { vida: 400,  ataque: 350,  rango: 1300, velocidad: 150, distancia: true },
  ballestero:        { vida: 280,  ataque: 260,  rango: 1100, velocidad: 230, distancia: true },
  arquero_largo:     { vida: 240,  ataque: 300,  rango: 1450, velocidad: 240, distancia: true },
  tirador_elite:     { vida: 450,  ataque: 520,  rango: 1500, velocidad: 260, distancia: true },
  caballeria_pesada: { vida: 1200, ataque: 600,  rango: 200,  velocidad: 600 },
  ariete:            { vida: 2000, ataque: 150,  rango: 100,  velocidad: 120 },
  catapulta:         { vida: 1500, ataque: 1200, rango: 1500, velocidad: 100, distancia: true },
  torre_asedio:      { vida: 3000, ataque: 300,  rango: 1400, velocidad: 90, distancia: true },
  carreta:           { vida: 250,  ataque: 0,    rango: 50,   velocidad: 300 }
};
// % que da cada pieza de equipo según su rareza (ataque y vida), y cuánto le quita al rival (ataque y vida enemigos)
var EQ_KOC = { comun: { pct: 20, foe: 0 }, raro: { pct: 60, foe: 0 }, legendario: { pct: 120, foe: 3 }, mitico: { pct: 300, foe: 6 } };
var TROPA_REQ = { // v8.00: árbol de desbloqueo (edificio + investigación de la Academia), como en los juegos de castillos
  explorador: { ed: 'cuartel', n: 1 }, miliciano: { ed: 'cuartel', n: 1 },
  espadachin: { ed: 'cuartel', n: 3, inv: ['espadas', 1] }, guardian: { ed: 'cuartel', n: 6, inv: ['escudos', 2] },
  arquero: { ed: 'galeria', n: 1 }, ballestero: { ed: 'galeria', n: 4, inv: ['ballesteria', 2] }, arquero_largo: { ed: 'galeria', n: 6, inv: ['arco_compuesto', 2] }, tirador_elite: { ed: 'galeria', n: 8, inv: ['arco_compuesto', 4] },
  jinete: { ed: 'establo', n: 1, inv: ['equitacion', 1] }, caballeria: { ed: 'establo', n: 4, inv: ['monturas', 2] }, caballeria_pesada: { ed: 'establo', n: 8, inv: ['armadura_placas', 4] },
  balista: { ed: 'cuartel', n: 1, otro: ['herreria', 3], inv: ['ingenieria', 1] }, ariete: { ed: 'cuartel', n: 1, otro: ['herreria', 5], inv: ['ingenieria', 2] },
  catapulta: { ed: 'cuartel', n: 1, otro: ['herreria', 7], inv: ['ingenieria', 3] }, torre_asedio: { ed: 'cuartel', n: 1, otro: ['herreria', 10], inv: ['ingenieria', 4] }
};
// v8.00: tropas de suministro: Mercado + investigación
var SUMINISTRO_REQ = { carretilla: { mercado: 2 }, carreta: { mercado: 5, inv: ['carretas_ref', 2] }, convoy: { mercado: 9, inv: ['logistica', 5] } };
// v8.00: funciones que se abren con el nivel del jugador o del castillo
var DESBLOQUEO = { azarPremium: { jugador: 10 }, temporada: { castillo: 5 }, equipoHeroe: { jugador: 8 } };
// Orden de la lista del cuartel (de la tropa ligera a las máquinas de asedio)
var TROPAS_ORDEN = ['explorador', 'jinete', 'miliciano', 'arquero', 'ballestero', 'arquero_largo', 'tirador_elite', 'carreta', 'caballeria', 'espadachin', 'guardian', 'balista', 'caballeria_pesada', 'ariete', 'catapulta', 'torre_asedio'];
var INVOCAR = { tres: 10, heroe: 30 }; // precio en gemas
// Armaduras: cada nivel (hasta 3) da +20% de vida y +10% de defensa (recibe menos daño)
// La armadura se puede mejorar con oro y piedra, o comprar al momento con gemas (precio de cada nivel)
var ARMADURA = { costo: [200, 500, 1200, 3000], piedra: [80, 220, 500, 1200], gemas: [20, 40, 80, 160], vida: 0.2, defensa: 0.1, max: 4 };

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
var GEMAS_POR_OLEADA = 0, GEMAS_VICTORIA = 0; // v6.74: las gemas ya no se regalan

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
var GEMAS_POR_10MIN = 1; var GEMAS_HORA = 20; // v8.02: Instantánea cuesta 20 gemas por hora
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
  legendario: { peso: 10, costoNivel: 2.0 },
  mitico:     { peso: 2,  costoNivel: 2.6 }   // v6.41: los más fuertes; salen poco al reclutar y se ganan en el torneo
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
    look: { ropa: 0xf2ece0, ropa2: 0xc9b896, pelo: 0xf0c860, peinado: 'largo', sombrero: 'capucha', arma: 'baston', ojos: 0x5a8ad8 } },
  // v6.41: héroes míticos (mucho más fuertes)
  { id: 'leon', rareza: 'mitico', clase: 'infanteria', hab: 'grito', vida: 2000, dano: 82, alcance: 1.8,
    look: { ropa: 0xe0b040, ropa2: 0x8a5a10, pelo: 0xd88a2a, peinado: 'corto', barba: 0xd88a2a, sombrero: 'casco', arma: 'espada', capa: 0x8a1a14 } },
  { id: 'fenix', rareza: 'mitico', clase: 'magia', hab: 'bomba', vida: 1250, dano: 78, alcance: 8, distancia: true,
    look: { ropa: 0xd8401e, ropa2: 0x7a1a0c, pelo: 0xffb030, peinado: 'largo', arma: 'varita', ojos: 0xffb030, capa: 0xffa020 } },
  { id: 'titan', rareza: 'mitico', clase: 'guardian', hab: 'escudo', vida: 2900, dano: 48, alcance: 1.6,
    look: { ropa: 0x6a7480, ropa2: 0x2a2f38, pelo: 0x9a9a9a, peinado: 'corto', barba: 0x9a9a9a, sombrero: 'casco', arma: 'hacha', escudo: 0xe0b040, capa: 0x2a2f38 } },
  { id: 'aguila', rareza: 'mitico', clase: 'arquero', hab: 'lluvia', vida: 1150, dano: 66, alcance: 10, distancia: true,
    look: { ropa: 0x1f3a6a, ropa2: 0xe0b040, pelo: 0xf0eee8, peinado: 'trenza', arma: 'arco', ojos: 0x3a8ad8, capa: 0xe0b040 } }
];
// v6.41: cada héroe tiene su armadura mítica de 6 piezas (solo la usa ese héroe). Se gana en el torneo semanal.
var ARMADURA_HEROE = {
  sol: { es: 'del Alba', en: 'of Dawn' }, luna: { es: 'Estelar', en: 'Starlit' }, ancla: { es: 'del Mar Hondo', en: 'of the Deep Sea' },
  brisa: { es: 'del Viento', en: 'of the Wind' }, chispa: { es: 'de Chispas', en: 'of Sparks' }, roble: { es: 'de Corteza', en: 'of Bark' },
  trueno: { es: 'del Trueno', en: 'of Thunder' }, pluma: { es: 'Celeste', en: 'Celestial' },
  leon: { es: 'del Rey León', en: 'of the Lion King' }, fenix: { es: 'de Brasas', en: 'of Embers' }, titan: { es: 'de la Montaña', en: 'of the Mountain' }, aguila: { es: 'de las Alturas', en: 'of the Heights' }
};
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
  trueno: { es: 'Trueno', en: 'Thunder' }, pluma: { es: 'Pluma', en: 'Feather' },
  leon: { es: 'León Dorado', en: 'Golden Lion' }, fenix: { es: 'Fénix', en: 'Phoenix' }, titan: { es: 'Titán', en: 'Titan' }, aguila: { es: 'Águila', en: 'Eagle' }
};
// v6.74: el dueño pidió que las gemas no se regalen jugando: se quitan de los premios del cofre diario
COFRE_DIARIO.forEach(function (p) { delete p.gemas; });
