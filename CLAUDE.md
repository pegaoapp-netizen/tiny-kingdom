# Reglas para Claude (y cualquier otra IA) que trabaje en Brother Kingdom

Varias personas trabajan en este juego a la vez, cada una con su Claude.
Por ejemplo, Chris trabaja en la **Campaña** y Maikel (el dueño) en todo lo demás.
**Lo más importante: puedes subir cosas nuevas, pero no borres ni cambies lo que ya está hecho por otros.**

## 1. Antes de empezar y antes de subir
- Trae lo último: `git fetch origin` y luego `git merge --ff-only origin/main` (o un merge normal si hay cambios tuyos).
- **Nunca** `git push --force`, `git reset --hard`, `git rebase` sobre `main`, ni borrar ramas de otros.
- Si al juntar hay un conflicto en algo que no es tuyo, **quédate con lo de los demás** y pregunta al dueño.

## 2. Toca solo lo tuyo
- Si estás trabajando en la **Campaña**, cambia solo:
  - `juego3d/js/tk-campana.js`
  - `juego3d/js/tk-campana-mapa.js`
  - el puente de la campaña en `juego3d/js/juego.js` (`window.__tkCamp`)
  - y sus estilos propios.
- **No borres, no renombres y no reescribas** funciones, estilos, textos ni archivos que no son de tu tarea, aunque te parezcan viejos o repetidos.
- Funciones nuevas van en archivos nuevos `js/tk-*.js` o como datos en `js/datos.js`. No rehagas `juego.js` entero.
- Antes de borrar o cambiar una línea, busca (grep) en todo `js/` y `css/` dónde más se usa lo que esa línea define.

## 3. Antes de publicar
1. `node juego3d/pruebas/revisar.js` tiene que decir «todo bien». Si encuentra un error, se arregla; nunca se salta el revisor.
2. Sube `VERSION_JUEGO` en `js/datos.js` y pon **una línea nueva** arriba de `NOVEDADES_VER`, con solo lo de esta versión. No borres las líneas viejas.
3. Sube `tinykingdom-vX` en `juego3d/sw.js` y el `?v=` en `index.html` de los archivos que cambiaste.
4. Prueba en tamaño de teléfono (390×844) lo que cambiaste **y lo que está al lado**: entrar y jugar, Ajustes, Marcha, chat y ciudad.
5. Haz commit, sube a `main` y publica.

## 4. Firebase
- La web (hosting) se publica en **pegao-5ac07**, sitio `tinykingdom-pegao`. Desde `juego3d`: `npx -y firebase-tools@13.35.1 deploy --only hosting --project pegao-5ac07`.
- Las reglas de Firestore del juego van **solo** a **tiny-kingdom-pegao**, desde `juego3d/nube`. Nunca publiques reglas del juego en pegao-5ac07.
- No crees proyectos nuevos de Firebase y no borres `tinykingdom-pegao.web.app`. El dominio es `brotherkingdom.com`.

## 5. Reglas del dueño que no se cambian
- El juego se llama **Brother Kingdom**, sin la S.
- Las gemas no se regalan, salvo en el torneo semanal de gemas. Los cofres nunca traen llaves.
- Cada héroe o armadura nueva es al menos un 15 % más fuerte que los anteriores.
- Se copia la forma de jugar de los juegos de castillos, pero nunca su arte, sus nombres ni sus textos.
- Primero la web. Las versiones para las tiendas (Codemagic) se hacen solo cuando el dueño lo pide.
- Al dueño se le habla en español sencillo.
