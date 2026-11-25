# Guardia Real v2: mismo personaje (malla, piel y huesos del GLB que llegó), con las animaciones rehechas:
# Reposo y Defender nuevas, y el escudo siempre de pie (antes se tumbaba como una bandeja al doblar el codo).
# Uso: python3 guardia_real.py  ->  ../../juego3d/modelos/guardia_real_bk_v2.glb
import json, struct, os, sys, math
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import rig_datos as R
from rig_datos import qmul, qinv, qrot, norm, de_a, Rx, Ry, Rz, brazo, codo, pierna, rodilla

def q_de_matriz(m):  # m = filas 3x3
    t = m[0][0] + m[1][1] + m[2][2]
    if t > 0: s = math.sqrt(t + 1) * 2; return R.qnorm((0.25 * s, (m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s))
    if m[0][0] > m[1][1] and m[0][0] > m[2][2]: s = math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; return R.qnorm(((m[2][1] - m[1][2]) / s, 0.25 * s, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s))
    if m[1][1] > m[2][2]: s = math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; return R.qnorm(((m[0][2] - m[2][0]) / s, (m[0][1] + m[1][0]) / s, 0.25 * s, (m[1][2] + m[2][1]) / s))
    s = math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; return R.qnorm(((m[1][0] - m[0][1]) / s, (m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, 0.25 * s))
def cruz(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def marco(d, u):
    d = norm(d); u = norm(tuple(u[i] - d[i] * sum(x * y for x, y in zip(u, d)) for i in range(3))); return d, u, cruz(d, u)
def orientar(d0, u0, d, u):
    """giro que lleva la dirección d0 a d y el «arriba» u0 a u (así se controla hacia dónde mira el escudo o la espada)"""
    A = marco(d0, u0); B = marco(d, u)
    m = [[sum(B[k][i] * A[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    return q_de_matriz(m)
CADENA = {"upper_arm.L": ["root", "pelvis", "spine", "spine.001", "chest", "clavicle.L"], "upper_arm.R": ["root", "pelvis", "spine", "spine.001", "chest", "clavicle.R"]}
def mundo_padre(pose, h):  # giro acumulado de los padres de un antebrazo
    q = (1, 0, 0, 0)
    for b in CADENA[h] + [h]: q = qmul(q, pose.get(b, (1, 0, 0, 0)))
    return q
# En reposo (pose T) el escudo va en el antebrazo izquierdo: antebrazo hacia +X, escudo de pie (+Z) mirando al frente (-Y).
# La espada va en la mano derecha: antebrazo hacia -X, hoja hacia arriba (+Z).
def escudo(pose, d, frente):
    """pone el antebrazo izquierdo en la dirección d con la cara del escudo mirando a «frente»"""
    u = cruz(norm(frente), norm(d))  # arriba del escudo, de forma que d × arriba = frente
    pose["forearm.L"] = qmul(qinv(mundo_padre(pose, "upper_arm.L")), orientar((1, 0, 0), (0, 0, 1), d, u)); return pose
def espada(pose, d, hoja):
    pose["forearm.R"] = qmul(qinv(mundo_padre(pose, "upper_arm.R")), orientar((-1, 0, 0), (0, 0, 1), d, hoja)); return pose
def brazo_a(lado, d):
    return de_a((1, 0, 0) if lado == "L" else (-1, 0, 0), d)

def reposo():  # de pie, firme: escudo al costado, espada abajo y algo adelante; respira
    def k(resp):
        p = {"upper_arm.L": brazo("L", 0.05, 1.3), "upper_arm.R": brazo("R", 0.2, 1.3), "chest": Rx(-0.03 * resp),
             "thigh.L": pierna(0.02), "thigh.R": pierna(-0.02), "shin.L": rodilla(0.03), "shin.R": rodilla(0.03), "pelvis@pos": (0, 0, -0.005 * resp)}
        escudo(p, (0.05, -0.15, -1), (1, -0.25, 0))             # antebrazo colgando, escudo pegado al costado mirando afuera
        espada(p, (-0.05, -0.45, -0.9), (0, -0.85, 0.5)); return p  # hoja hacia delante y un poco arriba
    return [(1, k(0)), (25, k(1)), (49, k(0))]
def caminar():
    out = []
    for f, p in R.caminar():
        p = dict(p)
        escudo(p, (0.08, -0.25, -1), (1, -0.2, 0))
        espada(p, (-0.05, -0.4, -0.9), (0, -0.85, 0.5)); out.append((f, p))
    return out
def correr():
    out = []
    for f, p in R.correr():
        p = dict(p)
        escudo(p, (0.15, -0.85, -0.5), (1, 0, 0.1))      # escudo de pie al costado, mirando afuera
        espada(p, (-0.15, -0.85, -0.5), (-0.1, -0.6, 0.8)); out.append((f, p))
    return out
def guardia_escudo(p, empuje=0.0):  # escudo delante del pecho, de pie, mirando al frente
    p["upper_arm.L"] = brazo_a("L", (0.45, -0.55 - 0.2 * empuje, -0.7 + 0.15 * empuje))
    return escudo(p, (-0.92, -0.32, 0.05), (0, -1, 0))
def atacar():  # mismo golpe del rig; la hoja apunta adelante en guardia, atrás al cargar y adelante al golpear
    HOJA = {1: ((-0.1, -0.85, -0.5), (0, -0.75, 0.65)), 6: ((0.0, 0.5, -0.85), (0, 0.55, 0.8)), 11: ((-0.1, -0.9, -0.42), (0, -0.95, -0.2)), 17: ((-0.1, -0.85, -0.5), (0, -0.75, 0.65))}
    out = []
    for f, p in R.atacar():
        p = dict(p); guardia_escudo(p, 0.0); espada(p, *HOJA[f]); out.append((f, p))
    return out
def defender():  # cubierto tras el escudo; a mitad empuja el escudo adelante (bloqueo) y vuelve
    def k(empuje, agacha):
        p = {"chest": Rz(-0.15), "spine": Rx(0.08 + 0.05 * empuje), "thigh.L": pierna(0.3), "shin.L": rodilla(0.35), "thigh.R": pierna(-0.25), "shin.R": rodilla(0.3),
             "upper_arm.R": brazo_a("R", (-0.55, 0.2, -0.8)), "pelvis@pos": (0, 0, -0.05 - 0.02 * agacha)}
        guardia_escudo(p, empuje); espada(p, (-0.2, -0.75, 0.6), (0.1, -0.5, 0.85)); return p  # espada lista sobre el hombro
    return [(1, k(0, 0)), (12, k(1, 1)), (20, k(0.2, 0.5)), (29, k(0, 0))]
ANIMS = [("Reposo", reposo()), ("Caminar", caminar()), ("Correr", correr()), ("Atacar", atacar()), ("Defender", defender())]

# ---------- reescribir el GLB: misma malla, piel y huesos; animaciones nuevas ----------
def leer(ruta):
    d = open(ruta, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; j = json.loads(d[20:20 + jl]); bo = 20 + jl
    bl = struct.unpack('<I', d[bo:bo + 4])[0]; return j, d[bo + 8:bo + 8 + bl]
def escribir(ruta, j, b):
    js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode()
    while len(js) % 4: js += b' '
    b = bytes(b) + b'\0' * ((4 - len(b) % 4) % 4)
    with open(ruta, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(b))); f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(b), 0x004E4942)); f.write(b)
def principal(entrada, salida, anims=None, extra=None):
    """extra(nombre, tiempos) -> [(nodo, 'rotation'|'translation', valores glTF planos)] para huesos que no son del rig humano (p. ej. el caballo)"""
    anims_def = anims or ANIMS
    j, B = leer(entrada)
    usados = {sk['inverseBindMatrices'] for sk in j.get('skins', []) if sk.get('inverseBindMatrices') is not None}
    for m in j['meshes']:
        for pr in m['primitives']: usados |= set(pr['attributes'].values()); usados.add(pr['indices'])
    nuevos_acc, vistas, binario, mapa = [], [], bytearray(), {}
    def vista(datos, objetivo=None):
        while len(binario) % 4: binario.append(0)
        v = {"buffer": 0, "byteOffset": len(binario), "byteLength": len(datos)}
        if objetivo: v["target"] = objetivo
        binario.extend(datos); vistas.append(v); return len(vistas) - 1
    for i in sorted(usados):  # copia tal cual lo que no es animación
        a = dict(j['accessors'][i]); v = j['bufferViews'][a['bufferView']]
        ini = v.get('byteOffset', 0); a['bufferView'] = vista(B[ini:ini + v['byteLength']], v.get('target')); mapa[i] = len(nuevos_acc); nuevos_acc.append(a)
    for m in j['meshes']:
        for pr in m['primitives']:
            pr['attributes'] = {k: mapa[x] for k, x in pr['attributes'].items()}; pr['indices'] = mapa[pr['indices']]
    for sk in j.get('skins', []):
        if sk.get('inverseBindMatrices') is not None: sk['inverseBindMatrices'] = mapa[sk['inverseBindMatrices']]
    nodo = {n.get('name'): i for i, n in enumerate(j['nodes'])}
    def acc(vals, fmt, n, tipo, mm=None):
        a = {"bufferView": vista(struct.pack('<' + fmt * len(vals), *vals)), "componentType": 5126, "count": n, "type": tipo}
        if mm: a["min"], a["max"] = mm
        nuevos_acc.append(a); return len(nuevos_acc) - 1
    v_gl = lambda v: (v[0], v[2], -v[1]); q_gl = lambda q: (q[1], q[3], -q[2], q[0])
    cab = {h[0]: h[1] for h in R.HUESOS}; pad = {h[0]: h[3] for h in R.HUESOS}
    anims = []
    for nombre, claves in anims_def:
        mu = R.muestrear(claves); ts = [t for t, _ in mu]; at = acc(ts, 'f', len(ts), "SCALAR", ([min(ts)], [max(ts)]))
        can, sam = [], []
        for b in sorted(mu[0][1]):
            if b.endswith("@pos"):
                h = b[:-4]; base = tuple(x - y for x, y in zip(cab[h], cab[pad[h]] if pad[h] else (0, 0, 0))); vals = []
                for _, p in mu: vals += v_gl(tuple(x + y for x, y in zip(base, p[b])))
                sam.append({"input": at, "output": acc(vals, 'f', len(mu), "VEC3"), "interpolation": "LINEAR"}); ruta = "translation"
            else:
                h = b; vals = []; prev = None
                for _, p in mu:
                    q = q_gl(p[b])
                    if prev and sum(x * y for x, y in zip(q, prev)) < 0: q = tuple(-x for x in q)
                    prev = q; vals += q
                sam.append({"input": at, "output": acc(vals, 'f', len(mu), "VEC4"), "interpolation": "LINEAR"}); ruta = "rotation"
            can.append({"sampler": len(sam) - 1, "target": {"node": nodo[h], "path": ruta}})
        for nd, ruta, vals in (extra(nombre, ts) if extra else []):
            sam.append({"input": at, "output": acc(vals, 'f', len(ts), "VEC4" if ruta == "rotation" else "VEC3"), "interpolation": "LINEAR"})
            can.append({"sampler": len(sam) - 1, "target": {"node": nodo[nd], "path": ruta}})
        anims.append({"name": nombre, "channels": can, "samplers": sam})
    j['accessors'] = nuevos_acc; j['bufferViews'] = vistas; j['animations'] = anims; j['buffers'] = [{"byteLength": len(binario)}]
    j.setdefault('extras', {})['animaciones'] = "Reposo, Caminar, Correr, Atacar, Defender (guardia_real.py)"
    escribir(salida, j, binario)
    print('GLB:', os.path.normpath(salida), os.path.getsize(salida), 'bytes ·', [a['name'] for a in anims])
if __name__ == '__main__':
    principal(os.path.join(AQUI, 'guardia', 'guardia_real_bk_v2_original.glb'), os.path.join(AQUI, '..', '..', 'juego3d', 'modelos', 'guardia_real_bk_v2.glb'))
