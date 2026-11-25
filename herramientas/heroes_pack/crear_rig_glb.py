# Crea el GLB del rig humano SIN Blender (Python puro): esqueleto, maniquí con piel y las 3 animaciones.
# Uso:  python3 crear_rig_glb.py  ->  ../../juego3d/modelos/rig_humano.glb
import json, struct, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rig_datos as R

def v_gl(v): return (v[0], v[2], -v[1])              # Blender (Z arriba, frente -Y) -> glTF (Y arriba, frente +Z)
def q_gl(q): return (q[1], q[3], -q[2], q[0])        # (w,x,y,z) Blender -> [x,y,z,w] glTF

bin_ = bytearray(); vistas = []; accesores = []
def poner(datos, fmt, n, tipo, comp, objetivo=None, minmax=None):
    while len(bin_) % 4: bin_.append(0)
    ini = len(bin_); bin_.extend(struct.pack('<' + fmt * (len(datos) if isinstance(datos, list) else 1), *datos) if isinstance(datos, list) else datos)
    v = {"buffer": 0, "byteOffset": ini, "byteLength": len(bin_) - ini}
    if objetivo: v["target"] = objetivo
    vistas.append(v)
    a = {"bufferView": len(vistas) - 1, "componentType": comp, "count": n, "type": tipo}
    if minmax: a["min"], a["max"] = minmax
    accesores.append(a); return len(accesores) - 1

nombres = [h[0] for h in R.HUESOS]; idx = {n: i for i, n in enumerate(nombres)}
cabeza = {h[0]: h[1] for h in R.HUESOS}; padre = {h[0]: h[3] for h in R.HUESOS}
# nodos: 0 = personaje, 1 = maniquí (malla), 2.. = huesos (en reposo sin giro: los ejes son los del mundo)
nodos = [{"name": R.NOMBRE, "children": [1, 2 + idx["root"]]}, {"name": "BK_Maniqui", "mesh": 0, "skin": 0}]
for n, a, b, p in R.HUESOS:
    base = cabeza[p] if p else (0, 0, 0)
    nd = {"name": n, "translation": list(v_gl(tuple(x - y for x, y in zip(a, base))))}
    hijos = [2 + idx[h[0]] for h in R.HUESOS if h[3] == n]
    if hijos: nd["children"] = hijos
    nodos.append(nd)
# matrices de unión inversas: solo deshacen la posición (los huesos no tienen giro en reposo)
ibm = []
for n in nombres:
    t = v_gl(cabeza[n]); ibm += [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -t[0], -t[1], -t[2], 1]
a_ibm = poner(ibm, 'f', len(nombres), "MAT4", 5126)
# malla del maniquí
pos, nor, col, jnt, pes, ind = [], [], [], [], [], []
for hueso, esq, c in R.cajas():
    e = [v_gl(p) for p in esq]; cen = tuple(sum(p[i] for p in e) / 8 for i in range(3))
    for cara in R.CARAS:
        p0, p1, p2, p3 = (e[i] for i in cara)
        u = [p1[i] - p0[i] for i in range(3)]; w = [p2[i] - p0[i] for i in range(3)]
        nrm = R.norm((u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]))
        fc = [sum(p[i] for p in (p0, p1, p2, p3)) / 4 - cen[i] for i in range(3)]
        orden = [p0, p1, p2, p3]
        if sum(nrm[i] * fc[i] for i in range(3)) < 0: nrm = tuple(-x for x in nrm); orden = [p0, p3, p2, p1]
        b0 = len(pos) // 3
        luz = 0.88 + 0.12 * nrm[1]  # un poco de sombra pintada para que se lea el volumen
        for p in orden: pos += p; nor += nrm; col += [(c[0] * luz) ** 2.2, (c[1] * luz) ** 2.2, (c[2] * luz) ** 2.2, 1]; jnt += [idx[hueso], 0, 0, 0]; pes += [1, 0, 0, 0]  # glTF guarda el color en lineal
        ind += [b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3]
nv = len(pos) // 3
mn = [min(pos[i::3]) for i in range(3)]; mx = [max(pos[i::3]) for i in range(3)]
a_pos = poner(pos, 'f', nv, "VEC3", 5126, 34962, (mn, mx)); a_nor = poner(nor, 'f', nv, "VEC3", 5126, 34962)
a_col = poner(col, 'f', nv, "VEC4", 5126, 34962); a_jnt = poner(jnt, 'H', nv, "VEC4", 5123, 34962); a_pes = poner(pes, 'f', nv, "VEC4", 5126, 34962)
a_ind = poner(ind, 'H', len(ind), "SCALAR", 5123, 34963)
# animaciones (muestreadas a 24 fps)
anims = []
for nombre, claves in R.ANIMACIONES:
    mu = R.muestrear(claves); tiempos = [t for t, _ in mu]
    a_t = poner(tiempos, 'f', len(tiempos), "SCALAR", 5126, None, ([min(tiempos)], [max(tiempos)]))
    canales, muestras = [], []
    for b in sorted(mu[0][1]):
        if b.endswith("@pos"):
            h = b[:-4]; base = tuple(x - y for x, y in zip(cabeza[h], cabeza[padre[h]] if padre[h] else (0, 0, 0)))
            datos = []
            for _, p in mu: datos += v_gl(tuple(x + y for x, y in zip(base, p[b])))
            muestras.append({"input": a_t, "output": poner(datos, 'f', len(mu), "VEC3", 5126), "interpolation": "LINEAR"}); ruta = "translation"
        else:
            h = b; datos = []
            for _, p in mu: datos += q_gl(p[b])
            muestras.append({"input": a_t, "output": poner(datos, 'f', len(mu), "VEC4", 5126), "interpolation": "LINEAR"}); ruta = "rotation"
        canales.append({"sampler": len(muestras) - 1, "target": {"node": 2 + idx[h], "path": ruta}})
    anims.append({"name": nombre, "channels": canales, "samplers": muestras})

gltf = {"asset": {"version": "2.0", "generator": "Brother Kingdom · crear_rig_glb.py"},
        "scene": 0, "scenes": [{"name": "Rig", "nodes": [0]}], "nodes": nodos,
        "meshes": [{"name": "BK_Maniqui", "primitives": [{"attributes": {"POSITION": a_pos, "NORMAL": a_nor, "COLOR_0": a_col, "JOINTS_0": a_jnt, "WEIGHTS_0": a_pes}, "indices": a_ind, "material": 0}]}],
        "materials": [{"name": "Maniqui", "pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0, "roughnessFactor": 0.85}}],
        "skins": [{"name": R.NOMBRE, "inverseBindMatrices": a_ibm, "joints": [2 + i for i in range(len(nombres))], "skeleton": 2 + idx["root"]}],
        "animations": anims, "accessors": accesores, "bufferViews": vistas, "buffers": [{"byteLength": len(bin_)}],
        "extras": {"proyecto": "Brother Kingdom", "rig": "humano 1.0", "huesos": len(nombres), "alto_m": R.ALTO, "pose_reposo": "T"}}
js = json.dumps(gltf, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(bin_) % 4: bin_.append(0)
salida = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'juego3d', 'modelos', 'rig_humano.glb')
with open(salida, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)
print('GLB:', os.path.normpath(salida), len(nombres), 'huesos,', nv, 'vértices,', [a["name"] for a in anims], os.path.getsize(salida), 'bytes')

# además deja listo el script de Blender (un solo archivo para pegar en Blender > Scripting)
aqui = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(aqui, 'rig_humano_blender.py'), 'w', encoding='utf8') as f:
    f.write('# Brother Kingdom · RIG HUMANO para Blender 3.6 / 4.x / 5.x (generado por crear_rig_glb.py: no editar a mano)\n'
            '# Blender > Scripting > Abrir este archivo > Run Script. Crea el esqueleto, un maniquí unido, las animaciones\n'
            '# Caminar, Correr y Atacar en pistas NLA, y exporta rig_humano.glb junto al .blend (o en la carpeta temporal).\n')
    f.write(open(os.path.join(aqui, 'rig_datos.py'), encoding='utf8').read())
    f.write(open(os.path.join(aqui, 'blender_parte.py'), encoding='utf8').read())
print('Script de Blender:', os.path.join(aqui, 'rig_humano_blender.py'))
