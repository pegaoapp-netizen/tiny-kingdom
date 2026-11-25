// v7.12: PORTADA AL ABRIR EL JUEGO
// Sale apenas se abre la página (antes de que cargue el 3D): un héroe pintado de Brother Kingdom en grande,
// el título en una cinta dorada y una barra de carga dorada. Cuando el juego está listo se desvanece.
// v7.13: usa la portada del dibujante; si no carga, la dibujada con uno de nuestros héroes (iconos/ui/h_*.webp).
//
// ===== CÓMO CAMBIAR LA PORTADA CUANDO SALE UN HÉROE NUEVO FUERTE =====
//  1. Pon el dibujo vertical (por ejemplo 1152 × 2048) en iconos/ui/ con un nombre nuevo, por ejemplo portada_tritón.jpg
//     (que pese poco: guardarlo en JPG calidad 80 deja unos 500 KB).
//  2. Cambia SOLO las líneas de PORTADA de aquí abajo: foto = ese archivo; nuevo = el nombre del héroe (o '' para no poner letrero).
//  3. Sube el número de la versión (?v=) de tk-portada.js en index.html. El revisor no deja publicar si la foto no existe.
var PORTADA = {
  foto: 'iconos/ui/portada.jpg',   // el dibujo de la portada
  nuevo: '',                       // nombre del héroe nuevo: sale «¡Nuevo héroe: …!» encima; '' = sin letrero
  version: 713                     // súbelo cuando cambies la foto, para que los teléfonos no muestren la vieja
};
(function () {
  if (document.getElementById('tk-portada')) return;
  var HEROES = [['luna', 'Luna'], ['sol', 'Sir Sol'], ['ancla', 'Capitán Ancla'], ['trueno', 'Trueno'], ['fenix', 'Fénix']];
  var n = 0; try { n = (+localStorage.getItem('tk_portada_n') || 0) + 1; localStorage.setItem('tk_portada_n', String(n)); } catch (e) {}
  var h = HEROES[n % HEROES.length];
  var en = (navigator.language || '').toLowerCase().indexOf('es') !== 0;
  try { var idi = JSON.parse(localStorage.getItem('tinykingdom_pref') || '{}').idioma; if (idi) en = idi === 'en'; } catch (e) {}

  var css = [
    '#tk-portada { position: fixed; inset: 0; z-index: 99990; overflow: hidden; background: #1a0f08; transition: opacity .55s ease; display: flex; flex-direction: column; align-items: center; }',
    '#tk-portada.fuera { opacity: 0; pointer-events: none; }',
    // fondo: salón del trono con cortinas y luz de velas (todo dibujado con CSS)
    '#tk-portada .pt-sala { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 45% at 50% 42%, rgba(255,196,110,.42), transparent 70%), radial-gradient(ellipse 120% 70% at 50% 100%, rgba(255,140,40,.22), transparent 60%), linear-gradient(180deg, #2b3a6a 0%, #3b2a3e 38%, #2a1810 70%, #120a05 100%); }',
    '#tk-portada .pt-trono { position: absolute; left: 50%; top: 20%; width: min(78vw, 440px); height: 62%; transform: translateX(-50%); border-radius: 46% 46% 6px 6px / 30% 30% 6px 6px; background: radial-gradient(ellipse at 50% 20%, rgba(255,210,140,.18), transparent 60%), repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 2px, transparent 2px 22px), linear-gradient(180deg, #4a4658, #2c2836 60%, #1c1820); border: 3px solid rgba(160,150,180,.35); box-shadow: 0 0 60px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.55); }',
    '#tk-portada .pt-gradas { position: absolute; left: 0; right: 0; bottom: 0; height: 26%; background: repeating-linear-gradient(180deg, #2a2420 0 26px, #1c1814 26px 30px); opacity: .9; }',
    '#tk-portada .pt-dosel { position: absolute; left: 0; right: 0; top: 0; height: 9%; background: repeating-linear-gradient(90deg, #8a1416 0 18px, #b0242a 18px 30px); border-bottom: 4px solid #d9a84a; border-radius: 0 0 50% 50% / 0 0 100% 100%; box-shadow: 0 6px 16px rgba(0,0,0,.6); z-index: 1; }',
    '#tk-portada .pt-cortina { position: absolute; top: 0; bottom: 0; width: 20%; background: repeating-linear-gradient(90deg, #6a0d10 0 14px, #9e1a1c 14px 26px, #7a1214 26px 40px); box-shadow: inset -18px 0 30px rgba(0,0,0,.55); }',
    '#tk-portada .pt-cortina.izq { left: 0; border-bottom-right-radius: 60% 18%; }',
    '#tk-portada .pt-cortina.der { right: 0; transform: scaleX(-1); border-bottom-right-radius: 60% 18%; }',
    '#tk-portada .pt-velas { position: absolute; left: 0; right: 0; bottom: 18%; height: 30%; background: radial-gradient(circle at 12% 70%, rgba(255,200,90,.55) 0 3px, transparent 10px), radial-gradient(circle at 18% 78%, rgba(255,200,90,.5) 0 3px, transparent 9px), radial-gradient(circle at 84% 72%, rgba(255,200,90,.55) 0 3px, transparent 10px), radial-gradient(circle at 90% 80%, rgba(255,200,90,.5) 0 3px, transparent 9px), radial-gradient(circle at 8% 86%, rgba(255,200,90,.45) 0 2px, transparent 8px), radial-gradient(circle at 93% 88%, rgba(255,200,90,.45) 0 2px, transparent 8px); animation: ptVelas 2.4s ease-in-out infinite alternate; }',
    '@keyframes ptVelas { from { opacity: .75; } to { opacity: 1; } }',
    // título
    '#tk-portada .pt-titulo { position: relative; z-index: 3; margin-top: calc(env(safe-area-inset-top) + 34px); text-align: center; animation: ptBaja .8s cubic-bezier(.2,.9,.3,1.1) both; }',
    '#tk-portada .pt-cinta { display: inline-block; padding: 10px 24px 12px; border-radius: 40px; max-width: 92vw; box-sizing: border-box; background: linear-gradient(180deg, #7a3a1a, #4a1e0c); border: 3px solid #e8b84a; box-shadow: 0 6px 18px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,230,160,.35); }',
    '#tk-portada .pt-nombre { white-space: nowrap; font: 900 clamp(28px, 9.4vw, 52px)/1 Georgia, "Times New Roman", serif; letter-spacing: 1px; color: #ffe08a; background: linear-gradient(180deg, #fff6c4, #ffd25a 45%, #c8841c); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 0 #4a1e0c) drop-shadow(0 3px 4px rgba(0,0,0,.6)); }',
    '#tk-portada .pt-sub { display: inline-block; margin-top: -6px; padding: 5px 22px; background: linear-gradient(180deg, #f6e3b0, #d9b46a); color: #3a2108; border: 2px solid #8a5a1a; font: 900 clamp(14px, 4.4vw, 19px)/1.1 Georgia, serif; letter-spacing: 2px; text-transform: uppercase; clip-path: polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%); box-shadow: 0 3px 8px rgba(0,0,0,.5); }',
    // héroe
    '#tk-portada .pt-heroe { position: relative; z-index: 2; flex: 1; width: 100%; overflow: visible; margin-bottom: -14px; display: flex; align-items: flex-end; justify-content: center; min-height: 0; }',
    '#tk-portada .pt-heroe img { width: min(118vw, 640px); max-width: none; max-height: 100%; object-fit: contain; object-position: bottom; filter: drop-shadow(0 0 28px rgba(255,200,110,.45)) drop-shadow(0 12px 18px rgba(0,0,0,.6)); animation: ptSube 1s cubic-bezier(.2,.9,.3,1) both, ptRespira 5s ease-in-out 1s infinite; transform-origin: 50% 100%; image-rendering: auto; }',
    '#tk-portada .pt-heroe .pt-nombre-h { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); padding: 4px 16px; border-radius: 14px; background: rgba(20,10,4,.72); border: 1px solid #c9a24a; color: #ffe9a8; font: 700 14px Georgia, serif; white-space: nowrap; }',
    '@keyframes ptSube { from { opacity: 0; transform: translateY(40px) scale(.96); } to { opacity: 1; transform: none; } }',
    '@keyframes ptRespira { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }',
    '@keyframes ptBaja { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: none; } }',
    // barra de carga
    '#tk-portada .pt-pie { position: relative; z-index: 3; width: 100%; padding: 14px 0 calc(env(safe-area-inset-bottom) + 22px); background: linear-gradient(180deg, transparent, rgba(10,5,2,.85) 40%); text-align: center; }',
    '#tk-portada .pt-barra { width: min(84vw, 460px); height: 22px; margin: 0 auto; padding: 3px; border-radius: 12px; background: linear-gradient(180deg, #3a2410, #1a0e06); border: 2px solid #c9a24a; box-shadow: 0 0 0 2px #3a2108, 0 4px 12px rgba(0,0,0,.6); box-sizing: border-box; }',
    '#tk-portada .pt-barra i { display: block; height: 100%; width: 3%; border-radius: 8px; background: linear-gradient(180deg, #ffe08a, #f08a2a 60%, #b8501a); box-shadow: 0 0 10px rgba(255,170,60,.7); transition: width .35s ease; }',
    '#tk-portada .pt-foto { position: absolute; inset: 0; background: #1a0f08 no-repeat top center / contain; animation: ptFoto .9s ease-out both; -webkit-mask-image: linear-gradient(180deg, #000 0, #000 calc(177.7vw - 110px), transparent calc(177.7vw - 4px)); mask-image: linear-gradient(180deg, #000 0, #000 calc(177.7vw - 110px), transparent calc(177.7vw - 4px)); }',
    '#tk-portada.con-foto { background: linear-gradient(180deg, #2a1a10, #120a05); }',
    '#tk-portada .pt-espacio { flex: 1; }',
    '#tk-portada .pt-nuevo { position: relative; z-index: 4; display: table; margin: 0 auto 14px; padding: 6px 24px 8px; text-align: center; border-radius: 14px; background: linear-gradient(180deg, #b8231e, #6a0d0a); border: 3px solid #ffd25a; box-shadow: 0 0 22px rgba(255,200,80,.7), 0 6px 14px rgba(0,0,0,.6); animation: ptNuevo 1.6s ease-in-out infinite; }',
    '#tk-portada .pt-nuevo span { display: block; color: #ffe9a8; font: 800 13px system-ui, sans-serif; letter-spacing: 2px; text-transform: uppercase; }',
    '#tk-portada .pt-nuevo b { display: block; color: #fff; font: 900 24px Georgia, serif; text-shadow: 0 2px 0 #4a0a08, 0 0 10px rgba(255,210,90,.8); }',
    '@keyframes ptNuevo { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }',
    '#tk-portada.con-foto .pt-pie { padding-top: 70px; background: linear-gradient(180deg, transparent 0%, rgba(18,10,5,.75) 45%, #120a05 75%); }',
    '@keyframes ptFoto { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: none; } }',
    '#tk-portada .pt-pie { position: relative; }',
    /* v8.90: el dibujo trae el nombre viejo pintado arriba; lo tapa un cielo y encima va el nombre nuevo */
    '#tk-portada .pt-cielo { position: absolute; left: 0; right: 0; top: 0; z-index: 1; height: calc(min(49.8vw, 28vh) + 40px); background: linear-gradient(180deg, #3b4560 0%, #6f6270 40%, #c98d5c 78%, #e2a45e 100%); -webkit-mask-image: linear-gradient(180deg, #000 0, #000 calc(100% - 46px), transparent 100%); mask-image: linear-gradient(180deg, #000 0, #000 calc(100% - 46px), transparent 100%); animation: ptFoto .9s ease-out both; }',
    '#tk-portada.con-foto .pt-titulo { position: absolute; left: 0; right: 0; top: 0; z-index: 2; margin-top: 0; height: min(49.8vw, 28vh); display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: env(safe-area-inset-top); box-sizing: border-box; }',
    '#tk-portada.con-foto .pt-nombre { font-size: clamp(22px, 7.2vw, 46px); letter-spacing: 0; } #tk-portada.con-foto .pt-cinta { padding: 9px 18px 11px; } #tk-portada .pt-nombre { background: none; -webkit-text-fill-color: #ffd86a; color: #ffd86a; filter: none; text-shadow: 0 2px 0 #4a1e0c, 0 3px 5px rgba(0,0,0,.6); }',
    '#tk-portada .pt-txt { margin-top: 8px; color: #f3dfae; font: 600 13px system-ui, sans-serif; text-shadow: 0 1px 2px #000; }'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'tk-portada-css'; st.textContent = css; (document.head || document.documentElement).appendChild(st);

  var d = document.createElement('div'); d.id = 'tk-portada';
  // v7.13: la portada del dibujante (título, castillo junto al mar y Sir Sol) a pantalla completa; si no carga, sale la portada dibujada de antes
  var FOTO = PORTADA.foto + '?v=' + PORTADA.version;
  // v7.15: copia diminuta de la portada dentro del código: se ve desde el primer instante (borrosa) mientras carga la grande
  var MINI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCABVADADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDFjtjK2FVmPfAzim+STEsgB2MSFbBAY+xrTj8uG7jlKjOyRSM88of8/lUEzxbWeNpPK+zgQLyMLuXg46nO7Oep59KwdZqVjb2aauOZY5IIB9ngiZxMXIU5+XJXHze2DTvsUQkCCfnkncuBgFdx69lbP4GiSO0LS+XCWaNpQkbOxDYZcd/QtnH+NSGO0iMyoCIju+cnJTEgGP8Avnk/X0rD2rWzNOTuiCJGAGAFZh37VaFmqqcuruTxtNMluIlLF0BkHVcnn94ACe/Kk+3GRT7DyprraGEWA4wc/Nh8Z+uMU3UvsVGNtyzPpC3bJLG5VuhQZHGOvWsy6soo2EeXKFsFQAcHAxjjgmugs7jyTwAGx1NX4vKfYFf53HIz1+lZubWjK5epzZ05Jdoey8rsMKAG9iPwqy9kq7THpu9+CWZQxz37VclvYW1O1tvLDq6l84yDk4XH5GtWJQ0zooUqgGSDyCeen0ok2tRKxy9jaw3U5jaFI/nIGYwADjngj2q/b6PHaXDTl1OBgBU2gdq6AozDKbTkcEmqj2UjOxJADHJweKz9oykkyMJA5/1Sjn9P8aytS1K3sdWW3kjZYPIYll67j0I/LH41kNePC4Zj+6P3nDDg1iXN3LdYkkkMjICASOgrulh4w63OSOIc/Iv6bdMqSb3z5SYUnkqpJzj354rc03UItOtr6WSZ5JGTMeW7hcD8uPyrmbG5lgikEUZcygA7P4RnPbvV9SsemtE6O29yTIQflzjk/lWVR6+RpC1j0LTJlk0+OSNVwyZHYZ78UTeYSCMLjvurk4L3CCQSOQkaKI05zxycfhVpi8g+bLD3FEcOqiumTKt7OWqOMnG90EzpGpOdo4A9f/11GbUKiMr7x3A4z7AUinzIsSsVk3elWYt626rF8y5wxUZyPQj69DWrbMkkNkeCNEk5j28bU4OfSrKzTzbJo59yp8pj5IX2x3qCZrfZHukUspOFAzjP+elal7KksUbxkmbYP4Qu1eDjj0P86ydro3UfdbZHFJG6ma3DQOrcKDtHTn9eaj1DUisKIyuCCSCDgN71TkMjyhmLAjkrjuKinZnLl1xuI3E9celUoWM+a4kDgRqtwJNmSVI6A/jU9mY5JAZPk35KbcDA6Z+vvWY5kMQaR8p2Hc1Ys2VY2eQbdkeBz3/z9abjpoa2UTQv9PtWnjSyLSKRgyE8k+uPTtV2bQp30xJ0J3RoRs4xtIwMY/GsCyupo5fODZbdnB6fSuhh1qQxSnaAGO7PTFZT5o6IuLvqV9Qnju7eKRECtEFSR89eMZI/DmsR5CzlUG/1O3aKnSRzG8sDLvE+/bj6/pSy3CPE22whQv1YMR+Vax93Qh0+dXRnZLzqT2YACtG5iVdGjccM0jZPrjGP5miiql0DqZ0LYlVTyMYrQUYibnrRRSmERmjvs1AREBlkUgj8Kgc5RlOeOV56UUU/tAvhaP/Z';
  var PIE = '<div class="pt-pie"><div class="pt-barra"><i id="pt-avance"></i></div><div class="pt-txt" id="pt-txt">' + (en ? 'Loading the kingdom…' : 'Cargando el reino…') + '</div><div id="pt-version" style="position:absolute;right:12px;bottom:calc(env(safe-area-inset-bottom) + 6px);font:600 11px system-ui,sans-serif;color:#f3dfae;opacity:.7"></div></div>';
  function armarDibujada() {
    d.innerHTML = '<div class="pt-sala"></div><div class="pt-trono"></div><div class="pt-gradas"></div><div class="pt-dosel"></div><div class="pt-cortina izq"></div><div class="pt-cortina der"></div><div class="pt-velas"></div>' +
    '<div class="pt-titulo"><div class="pt-cinta"><div class="pt-nombre">Brother Kingdom</div></div><br><div class="pt-sub">' + (en ? 'Kingdoms of the Caribbean' : 'Reinos del Caribe') + '</div></div>' +
    '<div class="pt-heroe"><img id="pt-img" alt="" src="iconos/ui/h_' + h[0] + '.webp"><span class="pt-nombre-h">' + h[1] + '</span></div>' +
    '<div class="pt-pie"><div class="pt-barra"><i id="pt-avance"></i></div><div class="pt-txt" id="pt-txt">' + (en ? 'Loading the kingdom…' : 'Cargando el reino…') + '</div></div>';
  }
  d.className = 'con-foto';
  var LETRERO = PORTADA.nuevo ? '<div class="pt-nuevo"><span>' + (en ? 'New hero' : '¡Nuevo héroe!') + '</span><b>' + String(PORTADA.nuevo).replace(/</g, '&lt;') + '</b></div>' : '';
  d.innerHTML = '<div class="pt-foto" style="background-image:url(' + FOTO + '), url(' + MINI + ')"></div><div class="pt-cielo"></div><div class="pt-titulo"><div class="pt-cinta"><div class="pt-nombre">Brother Kingdom</div></div><br><div class="pt-sub">' + (en ? 'Kingdoms of the Caribbean' : 'Reinos del Caribe') + '</div></div><div class="pt-espacio"></div>' + PIE.replace('<div class="pt-pie">', '<div class="pt-pie">' + LETRERO);
  var prueba = new Image(); prueba.onerror = function () { var av = document.getElementById('pt-avance'), w = av ? av.style.width : ''; d.className = ''; armarDibujada(); var av2 = document.getElementById('pt-avance'); if (av2) av2.style.width = w; }; prueba.src = FOTO;
  (document.body || document.documentElement).appendChild(d);

  // barra: avanza sola hasta 90 % y se completa cuando el juego está listo (se ve al menos 2,5 s)
  var t0 = Date.now(), MIN = 2500, av = 3, fin = false;
  var FRASES = en ? ['Loading the kingdom…', 'Raising the walls…', 'Calling the heroes…', 'Opening the gates…'] : ['Cargando el reino…', 'Levantando las murallas…', 'Llamando a los héroes…', 'Abriendo las puertas…'];
  var reloj = setInterval(function () {
    var listo = !!window.__juegoListo, pasado = Date.now() - t0;
    av = listo ? Math.min(100, av + 18) : Math.min(90, av + (90 - av) * 0.06);
    var b = document.getElementById('pt-avance'); if (b) b.style.width = av.toFixed(1) + '%';
    var tx = document.getElementById('pt-txt'); if (tx && !listo) tx.textContent = FRASES[Math.min(FRASES.length - 1, Math.floor(pasado / 2200))];
    // v7.15: la portada se queda hasta que el juego entra a la ciudad (o hasta que la pantalla de inicio pide algo: crear cuenta, entrar…),
    // así no sale la segunda pantalla «Cargando…» del escudo detrás
    var pa = document.getElementById('pantalla'), pb = document.getElementById('pantalla-botones'), pf = document.getElementById('pantalla-form');
    var pide = pa && !pa.classList.contains('oculto') && ((pb && pb.children.length) || (pf && pf.children.length));
    var dentro = !pa || pa.classList.contains('oculto');
    listo = listo && (dentro || pide);
    var vv = document.getElementById('pt-version'); if (vv && typeof VERSION_JUEGO !== 'undefined' && !vv.textContent) vv.textContent = 'v' + VERSION_JUEGO;
    if (listo && av < 90) av = 90;
    if (listo && av >= 100 && pasado >= MIN && !fin) { fin = true; clearInterval(reloj); d.classList.add('fuera'); setTimeout(function () { d.remove(); }, 700); }
    // si algo falla y nunca termina, a los 40 s se quita para dejar ver el botón de reintentar
    if (pasado > 40000 && !fin) { fin = true; clearInterval(reloj); d.classList.add('fuera'); setTimeout(function () { d.remove(); }, 700); }
  }, 120);
})();
