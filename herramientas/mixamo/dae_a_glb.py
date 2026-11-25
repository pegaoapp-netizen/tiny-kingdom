#!/usr/bin/env python3
"""
Brother Kingdom · Conversor de animaciones de Mixamo (Collada .dae) a .glb solo con animación.

Por qué: Mixamo (gratis, uso comercial permitido dentro del juego) da animaciones con captura de
movimiento real. El espadachín, el aldeano, el trasgo y el ogro de Tripo ya tienen el esqueleto
de Mixamo, así que esas animaciones les sirven sin cambiar los modelos.
No hace falta Blender: solo Python 3 con numpy.

Cómo descargar de Mixamo (una animación cada vez):
  - Personaje: el que salga por defecto (Y Bot) o el espadachín si se ha subido.
  - Format: «Collada (.dae)» · Skin: «Without Skin» · Frames per second: 30 · Keyframe Reduction: none
  - Marcar «In Place» en las que andan (para que no se desplace el personaje).
  - Mixamo baja un .zip: se puede pasar el .zip o el .dae.

Uso:
  python3 herramientas/mixamo/dae_a_glb.py Atacar.zip --nombre atacar --salida juego3d/modelos/anim_mixamo
  (crea atacar.glb y actualiza lista.json de esa carpeta)
Opciones: --sin-traslacion  (quita el movimiento de la cadera; por defecto se guarda)
          --recortar 0.2:1.4 (segundos de inicio y fin)
"""
import argparse, io, json, os, re, struct, sys, zipfile
import xml.etree.ElementTree as ET
import numpy as np

NS = {'c': 'http://www.collada.org/2005/11/COLLADASchema'}


def nombre_hueso(n):
    """mixamorig_LeftHand / mixamorig1:LeftHand → mixamorig:LeftHand (como en los .glb de Tripo)."""
    m = re.match(r'^(?:.*?:)?mixamorig\d*[_:]?(.+)$', n)
    return 'mixamorig:' + m.group(1) if m else n


def mat_a_trs(m):
    """Matriz 4x4 (filas, como Collada) → traslación, cuaternión (x, y, z, w), escala."""
    t = m[:3, 3].copy()
    r = m[:3, :3].copy()
    s = np.linalg.norm(r, axis=0)
    s[s == 0] = 1
    r = r / s
    if np.linalg.det(r) < 0:
        s[0] = -s[0]; r[:, 0] = -r[:, 0]
    tr = np.trace(r)
    if tr > 0:
        k = np.sqrt(tr + 1.0) * 2
        q = [(r[2, 1] - r[1, 2]) / k, (r[0, 2] - r[2, 0]) / k, (r[1, 0] - r[0, 1]) / k, 0.25 * k]
    elif r[0, 0] > r[1, 1] and r[0, 0] > r[2, 2]:
        k = np.sqrt(1.0 + r[0, 0] - r[1, 1] - r[2, 2]) * 2
        q = [0.25 * k, (r[0, 1] + r[1, 0]) / k, (r[0, 2] + r[2, 0]) / k, (r[2, 1] - r[1, 2]) / k]
    elif r[1, 1] > r[2, 2]:
        k = np.sqrt(1.0 + r[1, 1] - r[0, 0] - r[2, 2]) * 2
        q = [(r[0, 1] + r[1, 0]) / k, 0.25 * k, (r[1, 2] + r[2, 1]) / k, (r[0, 2] - r[2, 0]) / k]
    else:
        k = np.sqrt(1.0 + r[2, 2] - r[0, 0] - r[1, 1]) * 2
        q = [(r[0, 2] + r[2, 0]) / k, (r[1, 2] + r[2, 1]) / k, 0.25 * k, (r[1, 0] - r[0, 1]) / k]
    q = np.array(q); q /= np.linalg.norm(q)
    return t, q, s


def leer_dae(ruta):
    if ruta.lower().endswith('.zip'):
        z = zipfile.ZipFile(ruta)
        dae = [n for n in z.namelist() if n.lower().endswith('.dae')]
        if not dae: sys.exit('El .zip no trae ningún .dae')
        return ET.parse(io.BytesIO(z.read(dae[0]))).getroot()
    return ET.parse(ruta).getroot()


def floats(fuente):
    return np.array(fuente.find('c:float_array', NS).text.split(), dtype=np.float64)


def convertir(raiz, sin_traslacion=False, recorte=None):
    unidad = raiz.find('c:asset/c:unit', NS)
    metros = float(unidad.get('meter')) if unidad is not None else 1.0
    escena = raiz.find('.//c:library_visual_scenes/c:visual_scene', NS)
    # 1) Esqueleto: nodos JOINT con su matriz de reposo y su padre
    nodos, padres, reposo = [], {}, {}
    def recorrer(n, padre):
        es_hueso = n.get('type') == 'JOINT'
        nid = n.get('id') or n.get('name')
        if es_hueso:
            mt = n.find('c:matrix', NS)
            m = np.array(mt.text.split(), dtype=np.float64).reshape(4, 4) if mt is not None else np.eye(4)
            nodos.append(nid); padres[nid] = padre; reposo[nid] = m
        for h in n.findall('c:node', NS):
            recorrer(h, nid if es_hueso else padre)
    for n in escena.findall('c:node', NS):
        recorrer(n, None)
    if not nodos: sys.exit('No hay esqueleto en el .dae (¿es de Mixamo?)')
    nombres = {nid: nombre_hueso(next((n.get('name') for n in escena.iter('{%s}node' % NS['c']) if (n.get('id') or n.get('name')) == nid), nid)) for nid in nodos}
    # 2) Animación: matrices por fotograma de cada hueso
    fuentes = {s.get('id'): s for s in raiz.iter('{%s}source' % NS['c'])}
    muestreadores = {s.get('id'): s for s in raiz.iter('{%s}sampler' % NS['c'])}
    pistas = {}
    for ch in raiz.iter('{%s}channel' % NS['c']):
        destino = ch.get('target', '')
        nid = destino.split('/')[0]
        if nid not in reposo or not destino.endswith('transform'): continue
        smp = muestreadores[ch.get('source').lstrip('#')]
        ent = {i.get('semantic'): fuentes[i.get('source').lstrip('#')] for i in smp.findall('c:input', NS)}
        tiempos = floats(ent['INPUT'])
        mats = floats(ent['OUTPUT']).reshape(-1, 4, 4)
        pistas[nid] = (tiempos, mats)
    if not pistas: sys.exit('El .dae no trae animación')
    raiz_hueso = next(n for n in nodos if padres[n] is None)
    datos = []
    for nid in nodos:
        if nid not in pistas: continue
        t, mats = pistas[nid]
        if recorte:
            sel = (t >= recorte[0] - 1e-6) & (t <= recorte[1] + 1e-6)
            t, mats = t[sel] - recorte[0], mats[sel]
        trs = [mat_a_trs(m) for m in mats]
        q = np.array([x[1] for x in trs])
        for i in range(1, len(q)):           # sin saltos de signo entre fotogramas
            if np.dot(q[i - 1], q[i]) < 0: q[i] = -q[i]
        pos = np.array([x[0] for x in trs]) * metros
        datos.append((nid, t, q, pos if (nid == raiz_hueso and not sin_traslacion) else None))
    return nodos, padres, reposo, nombres, datos, metros


def escribir_glb(salida, nombre_clip, nodos, padres, reposo, nombres, datos, metros):
    binario = bytearray(); vistas, accesos = [], []
    def anadir(arr, tipo, minmax=False):
        a = np.ascontiguousarray(arr, dtype=np.float32)
        while len(binario) % 4: binario.append(0)
        vistas.append({'buffer': 0, 'byteOffset': len(binario), 'byteLength': a.nbytes})
        binario.extend(a.tobytes())
        acc = {'bufferView': len(vistas) - 1, 'componentType': 5126, 'count': int(a.shape[0]), 'type': tipo}
        if minmax: acc['min'] = [float(a.min())]; acc['max'] = [float(a.max())]
        accesos.append(acc); return len(accesos) - 1
    indice = {nid: i for i, nid in enumerate(nodos)}
    gl_nodos = []
    for nid in nodos:
        t, q, s = mat_a_trs(reposo[nid])
        nd = {'name': nombres[nid], 'translation': (t * metros).tolist(), 'rotation': q.tolist()}
        if not np.allclose(s, 1, atol=1e-4): nd['scale'] = s.tolist()
        hijos = [indice[h] for h in nodos if padres[h] == nid]
        if hijos: nd['children'] = hijos
        gl_nodos.append(nd)
    canales, muestras = [], []
    for nid, t, q, pos in datos:
        ti = anadir(t.reshape(-1, 1), 'SCALAR', True)
        muestras.append({'input': ti, 'output': anadir(q, 'VEC4'), 'interpolation': 'LINEAR'})
        canales.append({'sampler': len(muestras) - 1, 'target': {'node': indice[nid], 'path': 'rotation'}})
        if pos is not None:
            muestras.append({'input': ti, 'output': anadir(pos, 'VEC3'), 'interpolation': 'LINEAR'})
            canales.append({'sampler': len(muestras) - 1, 'target': {'node': indice[nid], 'path': 'translation'}})
    raices = [indice[n] for n in nodos if padres[n] is None]
    gltf = {'asset': {'version': '2.0', 'generator': 'Brother Kingdom dae_a_glb.py'},
            'scene': 0, 'scenes': [{'nodes': raices}], 'nodes': gl_nodos,
            'animations': [{'name': nombre_clip, 'channels': canales, 'samplers': muestras}],
            'buffers': [{'byteLength': len(binario)}], 'bufferViews': vistas, 'accessors': accesos}
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    while len(binario) % 4: binario.append(0)
    total = 12 + 8 + len(js) + 8 + len(binario)
    with open(salida, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(binario), 0x004E4942)); f.write(binario)
    return total


def main():
    ap = argparse.ArgumentParser(description='Mixamo .dae/.zip → .glb solo con animación')
    ap.add_argument('entrada'); ap.add_argument('--nombre', required=True)
    ap.add_argument('--salida', default='juego3d/modelos/anim_mixamo')
    ap.add_argument('--sin-traslacion', action='store_true')
    ap.add_argument('--recortar', default='')
    a = ap.parse_args()
    rec = tuple(float(x) for x in a.recortar.split(':')) if a.recortar else None
    nodos, padres, reposo, nombres, datos, metros = convertir(leer_dae(a.entrada), a.sin_traslacion, rec)
    os.makedirs(a.salida, exist_ok=True)
    destino = os.path.join(a.salida, a.nombre + '.glb')
    tam = escribir_glb(destino, a.nombre, nodos, padres, reposo, nombres, datos, metros)
    lista_ruta = os.path.join(a.salida, 'lista.json')
    lista = json.load(open(lista_ruta)) if os.path.exists(lista_ruta) else []
    dur = float(max(d[1][-1] for d in datos))
    lista = [x for x in lista if x['nombre'] != a.nombre] + [{'nombre': a.nombre, 'archivo': a.nombre + '.glb', 'segundos': round(dur, 2), 'huesos': len(datos)}]
    json.dump(sorted(lista, key=lambda x: x['nombre']), open(lista_ruta, 'w'), ensure_ascii=False, indent=1)
    print('OK %s · %d huesos animados · %.2f s · %d KB' % (destino, len(datos), dur, tam // 1024))


if __name__ == '__main__':
    main()
