#!/usr/bin/env python3
"""Prueba del conversor sin descargar nada: toma la animación «Walking» del espadachín de Tripo
(esqueleto de Mixamo), la escribe como un .dae al estilo de Mixamo (matrices por fotograma,
centímetros, nombres mixamorig_*), la convierte con dae_a_glb.py y compara giros y posiciones.
Uso: python3 herramientas/mixamo/prueba_conversor.py [ruta/espadachin_anim.glb]"""
import json, os, struct, sys, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dae_a_glb as C

AQUI = os.path.dirname(os.path.abspath(__file__))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
GUARDAR = sys.argv[sys.argv.index('--guardar') + 1] if '--guardar' in sys.argv else None
if GUARDAR in ARGS: ARGS.remove(GUARDAR)
GLB = ARGS[0] if ARGS else os.path.join(AQUI, '..', '..', 'juego3d', 'modelos', 'espadachin_anim.glb')


def leer_glb(ruta):
    d = open(ruta, 'rb').read(); l = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + l]); b = d[20 + l + 8:]
    def acc(i):
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
        n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        return np.frombuffer(b, dtype=np.float32, count=a['count'] * n, offset=o).reshape(a['count'], n).astype(np.float64)
    return j, acc


def q_a_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def trs_mat(t, q, s=(1, 1, 1)):
    m = np.eye(4); m[:3, :3] = q_a_mat(q) * np.array(s); m[:3, 3] = t; return m


def muestrear(tt, vv, t, es_q):
    i = np.clip(np.searchsorted(tt, t) - 1, 0, len(tt) - 2); f = (t - tt[i]) / max(tt[i + 1] - tt[i], 1e-9); f = min(max(f, 0), 1)
    a, b = vv[i], vv[i + 1]
    if es_q and np.dot(a, b) < 0: b = -b
    r = a * (1 - f) + b * f
    return r / np.linalg.norm(r) if es_q else r


j, acc = leer_glb(GLB)
anim = next(a for a in j['animations'] if 'Walk' in a['name'])
juntas = j['skins'][0]['joints']; nn = j['nodes']
pistas = {}
for ch in anim['channels']:
    s = anim['samplers'][ch['sampler']]; pistas[(ch['target']['node'], ch['target']['path'])] = (acc(s['input'])[:, 0], acc(s['output']))
tiempos = np.arange(0, max(v[0][-1] for v in pistas.values()) + 1e-6, 1 / 30)
CM = 100.0  # Mixamo escribe en centímetros


def local(ni, t):
    n = nn[ni]
    tr = np.array(n.get('translation', [0, 0, 0]), float); q = np.array(n.get('rotation', [0, 0, 0, 1]), float)
    if (ni, 'translation') in pistas: tr = muestrear(*pistas[(ni, 'translation')], t, False)
    if (ni, 'rotation') in pistas: q = muestrear(*pistas[(ni, 'rotation')], t, True)
    return tr, q


def did(ni): return nn[ni]['name'].replace(':', '_')
hijos = {ni: [c for c in nn[ni].get('children', []) if c in juntas] for ni in juntas}
raices = [ni for ni in juntas if not any(ni in v for v in hijos.values())]
def fmt(m): return ' '.join('%.6f' % x for x in m.reshape(-1))
def nodo_xml(ni):
    tr, q = np.array(nn[ni].get('translation', [0, 0, 0])), np.array(nn[ni].get('rotation', [0, 0, 0, 1]))
    return '<node id="%s" name="%s" sid="%s" type="JOINT"><matrix sid="transform">%s</matrix>%s</node>' % (
        did(ni), did(ni), did(ni), fmt(trs_mat(tr * CM, q)), ''.join(nodo_xml(c) for c in hijos[ni]))
anims = []
for ni in juntas:
    mats = np.array([trs_mat(local(ni, t)[0] * CM, local(ni, t)[1]) for t in tiempos])
    i = did(ni)
    anims.append(('<animation id="{i}-anim"><source id="{i}-in"><float_array id="{i}-in-a" count="{n}">{t}</float_array></source>'
                  '<source id="{i}-out"><float_array id="{i}-out-a" count="{n16}">{m}</float_array></source>'
                  '<sampler id="{i}-s"><input semantic="INPUT" source="#{i}-in"/><input semantic="OUTPUT" source="#{i}-out"/></sampler>'
                  '<channel source="#{i}-s" target="{i}/transform"/></animation>').format(
        i=i, n=len(tiempos), n16=len(tiempos) * 16, t=' '.join('%.6f' % x for x in tiempos), m=fmt(mats)))
dae = ('<?xml version="1.0"?><COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">'
       '<asset><unit name="centimeter" meter="0.01"/><up_axis>Y_UP</up_axis></asset>'
       '<library_animations>%s</library_animations><library_visual_scenes><visual_scene id="Scene">'
       '<node id="Armature" name="Armature">%s</node></visual_scene></library_visual_scenes></COLLADA>') % (''.join(anims), ''.join(nodo_xml(r) for r in raices))
tmp = tempfile.mkdtemp(); ruta_dae = os.path.join(tmp, 'Walking.dae'); open(ruta_dae, 'w').write(dae)

nodos, padres, reposo, nombres, datos, metros = C.convertir(C.leer_dae(ruta_dae))
salida = os.path.join(tmp, 'caminar.glb'); C.escribir_glb(salida, 'caminar', nodos, padres, reposo, nombres, datos, metros)
j2, acc2 = leer_glb(salida)
por_nombre = {n['name']: i for i, n in enumerate(j2['nodes'])}
peor_q, peor_t, n = 0.0, 0.0, 0
for ch in j2['animations'][0]['channels']:
    s = j2['animations'][0]['samplers'][ch['sampler']]; t2, v2 = acc2(s['input'])[:, 0], acc2(s['output'])
    ni_orig = next(i for i in juntas if nn[i]['name'] == j2['nodes'][ch['target']['node']]['name'])
    for k in range(0, len(t2), 5):
        tr, q = local(ni_orig, t2[k])
        if ch['target']['path'] == 'rotation':
            peor_q = max(peor_q, 1 - abs(float(np.dot(q, v2[k])))); n += 1
        else:
            peor_t = max(peor_t, float(np.abs(tr - v2[k]).max()))
nombres_ok = all(':' in n['name'] for n in j2['nodes'] if n['name'].startswith('mixamorig'))  # los huesos extra de Tripo (Bone_0xx) se quedan como están
print('huesos animados: %d · muestras comparadas: %d' % (len(datos), n))
print('error máx. de giro (1-|dot|): %.2e · error máx. de posición: %.4f m · nombres mixamorig:*: %s' % (peor_q, peor_t, nombres_ok))
assert peor_q < 1e-5 and peor_t < 1e-3 and nombres_ok, 'el conversor no reproduce la animación'
print('OK: el conversor reproduce fielmente la animación de Mixamo')
if GUARDAR:  # solo para probar la página: guarda el resultado como si fuera una descarga de Mixamo
    import shutil; os.makedirs(GUARDAR, exist_ok=True); shutil.copy(salida, os.path.join(GUARDAR, 'atacar.glb'))
    json.dump([{'nombre': 'atacar', 'archivo': 'atacar.glb', 'segundos': 1.0, 'huesos': len(datos), 'prueba': True}], open(os.path.join(GUARDAR, 'lista.json'), 'w'))
    print('Guardado paquete de prueba en', GUARDAR)
