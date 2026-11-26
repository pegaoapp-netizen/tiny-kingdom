// v9.71: TRADUCTOR DEL CHAT (botón «Traducir» en cada mensaje de otro jugador).
// Traduce en el propio teléfono, gratis y sin servidores:
//  - App Android/iPhone: ML Kit de Google (plugin @capacitor-mlkit/translation) si está instalado en la app.
//  - Web: el traductor que trae Chrome (Translator API) si el navegador lo tiene.
// Si no hay ninguno, el botón no sale. No toca juego.js: mira la lista del chat y añade el botón.
(function () {
  'use strict';
  var IDIOMAS = ['es', 'en', 'pt', 'fr', 'it', 'de'];
  var destino = String((navigator.languages && navigator.languages[0]) || navigator.language || 'es').slice(0, 2).toLowerCase();
  if (IDIOMAS.indexOf(destino) < 0) destino = 'en';
  var ES = destino === 'es';
  var TXT = { traducir: ES ? 'Traducir' : 'Translate', original: ES ? 'Ver original' : 'Show original', traduciendo: ES ? 'Traduciendo…' : 'Translating…', bajando: ES ? 'Bajando idioma (solo la 1.ª vez)…' : 'Downloading language (first time only)…', error: ES ? 'No se pudo traducir' : 'Could not translate' };

  // ---- Motores ----
  function pluginMLKit() {
    var C = window.Capacitor; if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
    if (C.isPluginAvailable && !C.isPluginAvailable('Translation')) return null;
    return (C.Plugins && C.Plugins.Translation) || (C.registerPlugin ? C.registerPlugin('Translation') : null);
  }
  var bajados = {};
  var motorNativo = {
    traducir: function (texto, de, a, aviso) {
      var p = pluginMLKit();
      var bajar = function (l) { if (bajados[l]) return Promise.resolve(); aviso(TXT.bajando); return Promise.resolve(p.downloadModel({ language: l })).then(function () { bajados[l] = 1; }); };
      return bajar(de).then(function () { return bajar(a); }).then(function () { aviso(TXT.traduciendo); return p.translate({ text: texto, sourceLanguage: de, targetLanguage: a }); }).then(function (r) { return r && r.text; });
    }
  };
  var traductoresWeb = {};
  var motorWeb = {
    traducir: function (texto, de, a, aviso) {
      var k = de + '>' + a;
      if (!traductoresWeb[k]) traductoresWeb[k] = window.Translator.availability({ sourceLanguage: de, targetLanguage: a }).then(function (d) {
        if (d === 'unavailable') throw new Error('no');
        if (d !== 'available') aviso(TXT.bajando);
        return window.Translator.create({ sourceLanguage: de, targetLanguage: a });
      });
      return traductoresWeb[k].then(function (t) { aviso(TXT.traduciendo); return t.translate(texto); }, function (e) { delete traductoresWeb[k]; throw e; });
    }
  };
  /* v9.83: si el teléfono no trae traductor (Safari en iPhone), se usa el Gemini gratis del juego (Firebase AI Logic) */
  var motorIA = { traducir: function (texto, de, a, aviso) { aviso(TXT.traduciendo); return window.TKSoporteIA.traducir(texto, a); } };
  function motor() { if (pluginMLKit()) return motorNativo; if (window.Translator && window.Translator.create) return motorWeb; if (window.TKSoporteIA && window.TKSoporteIA.traducir) return motorIA; return null; }

  // ---- En qué idioma está el mensaje (palabras muy comunes de cada idioma) ----
  var COMUNES = {
    es: 'el la los las de que y en un una es por para con no se lo mi tu yo como pero hola si muy esta estoy eres tengo hay donde quien gracias bien ya vamos ataque alianza',
    en: 'the a an and is are you i to of in it for on with this that my your me we have do not what how hello hi thanks yes no can will be just help attack',
    pt: 'o a os as de que e em um uma é não para com se eu você meu minha muito obrigado oi olá tem está vamos isso aqui mas como ajuda',
    fr: 'le la les de des et est un une je tu il nous vous pas que qui pour avec sur mon ton bonjour salut merci oui non très bien',
    it: 'il lo la gli le di che e è un una io tu non per con mi ti sono ciao grazie si molto bene come anche questo',
    de: 'der die das und ist ich du nicht ein eine zu mit auf für es wir ihr hallo danke ja nein gut wie was sehr auch'
  };
  var SETS = {}; Object.keys(COMUNES).forEach(function (l) { SETS[l] = {}; COMUNES[l].split(' ').forEach(function (w) { SETS[l][w] = 1; }); });
  function idiomaDe(texto) {
    var t = String(texto).toLowerCase(), pal = t.match(/[a-záéíóúàèìòùâêôãõçñüöäß']+/g) || [];
    if (pal.length < 2 && !(pal[0] && pal[0].length > 3)) return null;
    var pts = {}; IDIOMAS.forEach(function (l) { pts[l] = 0; });
    pal.forEach(function (w) { IDIOMAS.forEach(function (l) { if (SETS[l][w]) pts[l]++; }); });
    if (/[ñ¿¡]/.test(t)) pts.es += 2; if (/[ãõç]/.test(t)) pts.pt += 2; if (/[ß]|[äöü]/.test(t)) pts.de += 2;
    var mejor = null, max = 0; IDIOMAS.forEach(function (l) { if (pts[l] > max) { max = pts[l]; mejor = l; } });
    return mejor || (destino === 'es' ? 'en' : 'es'); // sin pistas: suponemos el otro idioma principal del juego
  }

  // ---- Traducciones guardadas en el teléfono (no se gasta dos veces) ----
  var CLAVE = 'tk_traducciones', guardadas = {};
  try { guardadas = JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (e) {}
  function guardar(k, v) { guardadas[k] = v; var ks = Object.keys(guardadas); if (ks.length > 300) ks.slice(0, ks.length - 300).forEach(function (x) { delete guardadas[x]; }); try { localStorage.setItem(CLAVE, JSON.stringify(guardadas)); } catch (e) {} }
  var mostrando = {}; // mensajes que el jugador tiene traducidos ahora mismo

  // ---- Botón en cada mensaje ----
  function preparar(lista) {
    var M = motor(); if (!M) return;
    lista.querySelectorAll('.chat-m:not(.mio)').forEach(function (m) {
      if (m.querySelector('.tr-b')) return;
      var t = m.querySelector('.chat-t'), q = m.querySelector('.chat-quien'); if (!t || !q) return;
      var id = q.getAttribute('data-id') || '', original = t.textContent, de = idiomaDe(original);
      if (!de || de === destino) return;
      var k = id + '|' + destino, b = document.createElement('button');
      b.className = 'tr-b'; b.type = 'button'; b.textContent = '🌐 ' + TXT.traducir;
      function ver(trad) { t.textContent = trad; t.classList.add('tr-hecho'); b.textContent = TXT.original; mostrando[k] = 1; }
      function quitar() { t.textContent = original; t.classList.remove('tr-hecho'); b.textContent = '🌐 ' + TXT.traducir; delete mostrando[k]; }
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (mostrando[k]) { quitar(); return; }
        if (guardadas[k]) { ver(guardadas[k]); return; }
        b.disabled = true; b.textContent = TXT.traduciendo;
        M.traducir(original, de, destino, function (s) { b.textContent = s; }).then(function (r) {
          b.disabled = false; if (!r) throw new Error('vacio'); guardar(k, r); ver(r);
        }).catch(function () { b.disabled = false; b.textContent = '⚠️ ' + TXT.error; setTimeout(function () { if (!mostrando[k]) b.textContent = '🌐 ' + TXT.traducir; }, 2500); });
      });
      m.appendChild(b);
      if (mostrando[k] && guardadas[k]) ver(guardadas[k]); // el chat se repinta al llegar mensajes: se queda traducido
    });
  }

  // El chat se vuelve a dibujar cada vez que llega un mensaje: miramos su lista
  var listaVista = null, obsLista = null, pendiente = false;
  function revisar() {
    pendiente = false;
    var l = document.getElementById('chat-lista'); if (!l) return;
    if (l !== listaVista) { listaVista = l; if (obsLista) obsLista.disconnect(); obsLista = new MutationObserver(function () { preparar(l); }); obsLista.observe(l, { childList: true }); }
    preparar(l);
  }
  function arrancar() {
    var st = document.createElement('style');
    st.textContent = '.tr-b{display:inline-block;margin-top:3px;padding:2px 8px;border:0;border-radius:10px;background:rgba(58,36,20,.12);color:#5a3a1c;font-size:11px;font-weight:600;cursor:pointer}.tr-b:disabled{opacity:.7}.chat-t.tr-hecho{font-style:italic}';
    document.head.appendChild(st);
    new MutationObserver(function () { if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); } }).observe(document.body, { childList: true, subtree: true });
    revisar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
