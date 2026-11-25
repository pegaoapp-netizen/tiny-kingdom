#!/usr/bin/env python3
"""
Brother Kingdom · Pruebas visuales con Playwright (Claude, v9.27-prueba)

Abre el juego en un navegador real, entra con «Jugar sin cuenta» y, para cada
pantalla (móvil, iPhone, móvil pequeño, móvil grande y ordenador):
  - hace capturas de la ciudad de día, de noche y en una oleada;
  - mide la barra inferior (alto y etiquetas que se salen o se cortan);
  - recoge errores de JavaScript y el diagnóstico de rendimiento
    (llamadas de dibujo, triángulos, texturas);
  - con --comparar, compara cada captura con otra carpeta (versión anterior)
    y marca las que cambian más de lo normal.
Pruebas de funcionamiento (--pruebas calidad): calidad automática real.

No toca el juego ni la nube: solo lee y usa los puentes de prueba
(window.__juego, window.__tkExtras). La carpeta pruebas/ no se publica.

Uso:
  pip install playwright pillow && python -m playwright install chromium
  python3 juego3d/pruebas/visual.py --salida /tmp/vis_nueva
  python3 juego3d/pruebas/visual.py --carpeta otra/juego3d --salida /tmp/vis_vieja
  python3 juego3d/pruebas/visual.py --salida /tmp/vis_nueva --comparar /tmp/vis_vieja
  python3 juego3d/pruebas/visual.py --pantallas '' --pruebas calidad,espadachin
Opciones: --pantallas movil,iphone  --escenas dia,noche,oleada  --chrome /ruta/chrome
Sale con código 1 si hay errores de JavaScript o alguna prueba falla.
"""
import argparse, asyncio, functools, http.server, json, os, socketserver, sys, threading, time

PANTALLAS = {
    'movil':     dict(w=390, h=844, dpr=2, movil=True,  ua='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'),
    'iphone':    dict(w=390, h=844, dpr=2, movil=True,  ua='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'),
    'pequeno':   dict(w=360, h=740, dpr=2, movil=True,  ua='Mozilla/5.0 (Linux; Android 11; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'),
    'grande':    dict(w=430, h=932, dpr=2, movil=True,  ua='Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'),
    'ordenador': dict(w=1280, h=800, dpr=1, movil=False, ua=None),
}
ESCENAS = ['dia', 'noche', 'oleada']

# Deja la pantalla limpia: regalo de bienvenida y paneles cerrados (solo en esta prueba)
JS_LIMPIAR = """() => {
  try { var e = __juego.estado(); e.regaloBienvenidaReclamado = true; } catch (x) {}
  ['cofre-bienvenida'].forEach(function (id) { var d = document.getElementById(id); if (d) d.remove(); });
  if (!document.getElementById('bk-prueba-limpia')) {  // ventanas que se abren solas al entrar (calendario, cofre diario, nivel nuevo)
    var st = document.createElement('style'); st.id = 'bk-prueba-limpia';
    st.textContent = '#panel,#velo,#recompensas,#cofre-bienvenida,#nivel-nuevo,#aviso-resultado,#cal-ventana,#consejo{display:none!important}';
    document.head.appendChild(st);
  }
}"""
JS_BARRA = """() => {
  var a = document.getElementById('abajo'); if (!a) return null;
  var r = a.getBoundingClientRect(), cortadas = [], partidas = [];
  a.querySelectorAll(':scope > button').forEach(function (b) {
    var t = b.querySelector('.txt, small'); if (!t || !b.offsetParent) return;
    var txt = (t.innerText || '').trim();
    if (t.scrollWidth > t.clientWidth + 1) cortadas.push(txt);
    var lh = parseFloat(getComputedStyle(t).lineHeight) || 12;
    if (t.getBoundingClientRect().height > lh * 1.5 && txt.indexOf(' ') < 0) partidas.push(txt);
  });
  var bs = [].slice.call(a.querySelectorAll(':scope > button')).filter(function (b) { return b.offsetParent; });
  var solapes = 0;
  for (var i = 1; i < bs.length; i++) if (bs[i].getBoundingClientRect().left < bs[i - 1].getBoundingClientRect().right - 1) solapes++;
  return { alto: Math.round(r.height), arriba: Math.round(r.top), botones: bs.length, cortadas: cortadas, palabrasPartidas: partidas, solapes: solapes };
}"""
JS_RENDER = """() => { var x = window.__tkExtras; if (!x || !x.render) return null; var i = x.render.info;
  return { llamadas: i.render.calls, triangulos: i.render.triangles, texturas: i.memory.textures, geometrias: i.memory.geometries,
           pixelRatio: x.render.getPixelRatio(), calidad: x.calidad() }; }"""


def servidor(carpeta):
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Silencioso, directory=carpeta)
    socketserver.TCPServer.allow_reuse_address = True
    s = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, 'http://127.0.0.1:%d/index.html' % s.server_address[1]


async def entrar(navegador, url, p, errores, etiqueta, pref=None):
    ctx = await navegador.new_context(viewport={'width': p['w'], 'height': p['h']}, device_scale_factor=p['dpr'],
                                      is_mobile=p['movil'], has_touch=p['movil'], user_agent=p['ua'])
    if pref is not None:
        await ctx.add_init_script('try{localStorage.setItem("tinykingdom_pref",%s)}catch(e){}' % json.dumps(json.dumps(pref)))
    # misma semilla en cada prueba: aldeanos, nubes y enemigos salen igual y las capturas se pueden comparar
    await ctx.add_init_script('(function(){var s=20261125;Math.random=function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();')
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errores.append('%s · %s' % (etiqueta, e)))
    pg.on('console', lambda m: errores.append('%s · consola: %s' % (etiqueta, m.text))
          if m.type == 'error' and 'Failed to load resource' not in m.text else None)  # sin nube en local
    await pg.goto(url)
    await pg.wait_for_function('() => !!window.__juego', timeout=60000)
    await pg.wait_for_timeout(2500)
    await pg.get_by_text('Jugar sin cuenta').first.click()
    await pg.wait_for_timeout(8000)  # las ventanas de bienvenida salen con retraso
    await pg.evaluate(JS_LIMPIAR)
    await pg.wait_for_timeout(800)
    return ctx, pg


async def capturar(navegador, url, salida, pantallas, escenas):
    errores, datos = [], {}
    for nombre in pantallas:
        p = PANTALLAS[nombre]
        ctx, pg = await entrar(navegador, url, p, errores, nombre)
        d = datos[nombre] = {'barra': await pg.evaluate(JS_BARRA), 'escenas': {}}
        for esc in escenas:
            if esc == 'dia':
                await pg.evaluate('() => __juego.hora(0.3)')
            elif esc == 'noche':
                await pg.evaluate('() => __juego.hora(0.85)')
            elif esc == 'oleada':
                await pg.evaluate('() => { __juego.hora(0.3); __juego.empezarOleada(); }')
                await pg.wait_for_timeout(1500)
                await pg.evaluate('() => { for (var i = 0; i < 8; i++) __juego.paso(0.5); }')  # avanza la batalla sin esperar
            await pg.evaluate(JS_LIMPIAR)
            await pg.evaluate('() => __juego.velocidad(0)')  # quieto para fotografiar
            await pg.wait_for_timeout(2500)
            ruta = os.path.join(salida, '%s_%s.png' % (nombre, esc))
            await pg.screenshot(path=ruta, timeout=90000)
            d['escenas'][esc] = {'captura': os.path.basename(ruta), 'render': await pg.evaluate(JS_RENDER)}
            await pg.evaluate('() => __juego.velocidad(1)')
        await ctx.close()
    return datos, errores


async def prueba_calidad(navegador, url):
    """Calidad automática en un navegador real. Sin tarjeta gráfica el navegador va a ~1-5 fps,
    así que hace de «móvil lento»: tiene que bajar a Baja; con la calidad elegida a mano, no."""
    errores, res = [], {}
    p = PANTALLAS['movil']
    # 1) Automática: Alta sin elegir → debe bajar tras ~20 s + 2 ventanas de 5 s
    ctx, pg = await entrar(navegador, url, p, errores, 'calidad', pref={'calidad': 'alta', 'calidadElegida': 0})
    t0 = time.time(); bajo = None
    while time.time() - t0 < 75:
        await pg.wait_for_timeout(2000)
        if await pg.evaluate('() => __tkExtras.calidad()') == 'baja':
            bajo = round(time.time() - t0); break
    res['baja_al_arrancar_s'] = bajo
    # 2) Vuelta de la Campaña: se vuelve a Alta, se simula la Campaña abierta 8 s y se vuelve
    await pg.evaluate('() => __tkExtras.ponerCalidad("alta")')
    await pg.evaluate('() => { window.__tkCampanaAbierta = true; }')
    await pg.wait_for_timeout(8000)
    await pg.evaluate('() => { window.__tkCampanaAbierta = false; }')
    t1 = time.time(); bajo2 = None
    while time.time() - t1 < 45:
        await pg.wait_for_timeout(1000)
        if await pg.evaluate('() => __tkExtras.calidad()') == 'baja':
            bajo2 = round(time.time() - t1); break
    res['baja_tras_volver_s'] = bajo2
    res['informe'] = await pg.evaluate('() => window.TKRendimiento ? TKRendimiento.informe().ultima : null')
    await ctx.close()
    # 3) Manual: Alta elegida a mano → nunca debe cambiar
    ctx, pg = await entrar(navegador, url, p, errores, 'calidad-manual', pref={'calidad': 'alta', 'calidadElegida': 1})
    await pg.wait_for_timeout(40000)
    res['manual_sigue'] = await pg.evaluate('() => __tkExtras.calidad()')
    await ctx.close()
    fallos = []
    if bajo is None: fallos.append('no bajó la calidad al arrancar en un navegador lento')
    elif bajo < 20: fallos.append('bajó antes de la espera inicial de 20 s (%d s)' % bajo)
    if bajo2 is None: fallos.append('no bajó la calidad tras volver de la Campaña')
    elif bajo2 < 5: fallos.append('bajó antes de la espera de 5 s al volver (%d s)' % bajo2)
    if res['manual_sigue'] != 'alta': fallos.append('cambió la calidad elegida a mano')
    return res, errores, fallos


async def prueba_espadachin(navegador, url, salida):
    """Página pruebas/espadachin.html: modelo de Tripo + animaciones (propias y de anim_mixamo/)."""
    errores, res, fallos = [], {}, []
    p = PANTALLAS['movil']
    ctx = await navegador.new_context(viewport={'width': p['w'], 'height': p['h']}, device_scale_factor=p['dpr'], is_mobile=True, has_touch=True, user_agent=p['ua'])
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errores.append('espadachin · %s' % e))
    await pg.goto(url.replace('index.html', 'pruebas/espadachin.html'))
    await pg.wait_for_function('() => window.__prueba && __prueba.estado().huesos > 0', timeout=60000)
    await pg.wait_for_timeout(4000)
    res = await pg.evaluate('() => __prueba.estado()')
    from PIL import Image, ImageChops
    for est in res['clips']:
        await pg.evaluate('(e) => { __prueba.poner(e); __prueba.pausar(true); __prueba.irA(0.1); }', est)
        await pg.wait_for_timeout(600); a = os.path.join(salida, 'espadachin_%s_a.png' % est); await pg.screenshot(path=a)
        await pg.evaluate('() => __prueba.irA(0.45)'); await pg.wait_for_timeout(600)
        b = os.path.join(salida, 'espadachin_%s.png' % est); await pg.screenshot(path=b)
        d = ImageChops.difference(Image.open(a).convert('L'), Image.open(b).convert('L')).point(lambda v: 255 if v > 30 else 0)
        mov = round(100.0 * d.histogram()[255] / (d.width * d.height), 2); os.remove(a)
        res['movimiento_' + est] = mov
        if mov < 0.05: fallos.append('espadachín: «%s» no se mueve' % est)
    await ctx.close()
    return res, errores, fallos


def comparar(salida, base, datos):
    from PIL import Image, ImageChops
    out = {}
    for f in sorted(os.listdir(salida)):
        a, b = os.path.join(salida, f), os.path.join(base, f)
        if not f.endswith('.png') or f.startswith('dif_') or not os.path.exists(b): continue
        ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        if ia.size != ib.size: out[f] = {'tamano_distinto': [ia.size, ib.size]}; continue
        d = ImageChops.difference(ia, ib).convert('L').point(lambda v: 255 if v > 30 else 0)
        pct = 100.0 * sum(d.histogram()[255:]) / (ia.width * ia.height)
        d.save(os.path.join(salida, 'dif_' + f))
        out[f] = {'cambio_pct': round(pct, 2)}
    try:
        vieja = json.load(open(os.path.join(base, 'informe.json')))['pantallas']
        for n, d in datos.items():
            if n in vieja and d.get('barra') and vieja[n].get('barra'):
                out['barra_' + n] = {'alto_antes': vieja[n]['barra']['alto'], 'alto_ahora': d['barra']['alto']}
    except Exception: pass
    return out


def html(salida, inf):
    filas = []
    for n, d in inf.get('pantallas', {}).items():
        b = d.get('barra') or {}
        filas.append('<h2>%s</h2><p>Barra: %s px · cortadas %s · partidas %s · solapes %s</p><div class="f">' % (
            n, b.get('alto'), b.get('cortadas'), b.get('palabrasPartidas'), b.get('solapes')))
        for e, v in d['escenas'].items():
            c = inf.get('comparacion', {}).get(v['captura'], {})
            r = v.get('render') or {}
            filas.append('<figure><img src="%s"><figcaption>%s · %s llamadas · %s triángulos%s</figcaption></figure>' % (
                v['captura'], e, r.get('llamadas'), r.get('triangulos'),
                (' · cambio %s%%' % c['cambio_pct']) if 'cambio_pct' in c else ''))
        filas.append('</div>')
    cuerpo = ''.join(filas)
    errs = ''.join('<li>%s</li>' % e for e in inf.get('errores', [])) or '<li>Ninguno</li>'
    open(os.path.join(salida, 'informe.html'), 'w').write(
        '<!doctype html><meta charset="utf-8"><title>Pruebas visuales</title><style>body{font:14px system-ui;background:#1b1410;color:#eee;margin:16px}'
        '.f{display:flex;gap:10px;flex-wrap:wrap}figure{margin:0;width:240px}img{width:100%%;border:1px solid #6b5030}</style>'
        '<h1>Brother Kingdom · pruebas visuales</h1><p>%s</p><h2>Errores</h2><ul>%s</ul>%s<pre>%s</pre>' % (
            inf['fecha'], errs, cuerpo, json.dumps({k: inf[k] for k in inf if k in ('calidad', 'fallos', 'cambios', 'comparacion', 'espadachin')}, ensure_ascii=False, indent=1)))


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--carpeta', default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument('--salida', default='/tmp/bk_visual')
    ap.add_argument('--pantallas', default='movil,iphone,pequeno,grande,ordenador')
    ap.add_argument('--escenas', default=','.join(ESCENAS))
    ap.add_argument('--pruebas', default='', help='calidad,espadachin')
    ap.add_argument('--comparar', default='')
    ap.add_argument('--chrome', default=os.environ.get('BK_CHROME', ''))
    a = ap.parse_args()
    from playwright.async_api import async_playwright
    os.makedirs(a.salida, exist_ok=True)
    srv, url = servidor(a.carpeta)
    inf = {'fecha': time.strftime('%Y-%m-%d %H:%M'), 'carpeta': a.carpeta, 'errores': [], 'fallos': []}
    async with async_playwright() as pw:
        opc = {'args': ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']}
        if a.chrome: opc['executable_path'] = a.chrome
        nav = await pw.chromium.launch(**opc)
        if a.pantallas:
            datos, errs = await capturar(nav, url, a.salida, [p for p in a.pantallas.split(',') if p], [e for e in a.escenas.split(',') if e])
            inf['pantallas'] = datos; inf['errores'] += errs
            for n, d in datos.items():
                b = d.get('barra') or {}
                if b.get('palabrasPartidas'): inf['fallos'].append('%s: palabras partidas en la barra %s' % (n, b['palabrasPartidas']))
                if b.get('solapes'): inf['fallos'].append('%s: %d botones de la barra se solapan' % (n, b['solapes']))
        if 'calidad' in a.pruebas:
            res, errs, fallos = await prueba_calidad(nav, url)
            inf['calidad'] = res; inf['errores'] += errs; inf['fallos'] += fallos
        if 'espadachin' in a.pruebas:
            res, errs, fallos = await prueba_espadachin(nav, url, a.salida)
            inf['espadachin'] = res; inf['errores'] += errs; inf['fallos'] += fallos
        await nav.close()
    srv.shutdown()
    if a.comparar:
        inf['comparacion'] = comparar(a.salida, a.comparar, inf.get('pantallas', {}))
        # ruido medido entre dos pasadas de la misma versión: 0,1-0,3 %. Más del 1 % es un cambio real que hay que mirar
        inf['cambios'] = ['%s: %s %% distinto' % (k, v['cambio_pct']) for k, v in inf['comparacion'].items() if v.get('cambio_pct', 0) > 1] + \
            ['barra %s: %s → %s px' % (k[6:], v['alto_antes'], v['alto_ahora']) for k, v in inf['comparacion'].items() if k.startswith('barra_') and v['alto_antes'] != v['alto_ahora']]
    json.dump(inf, open(os.path.join(a.salida, 'informe.json'), 'w'), ensure_ascii=False, indent=1)
    html(a.salida, inf)
    print(json.dumps({k: inf[k] for k in inf if k in ('errores', 'fallos', 'cambios', 'calidad', 'espadachin')}, ensure_ascii=False, indent=1))
    print('Informe: ' + os.path.join(a.salida, 'informe.html'))
    sys.exit(1 if inf['errores'] or inf['fallos'] else 0)

if __name__ == '__main__':
    asyncio.run(main())
