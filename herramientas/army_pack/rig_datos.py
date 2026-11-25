# ==== DATOS DEL RIG HUMANO (Python puro, sin Blender ni numpy) ====
# Sale de tu script «imperios_avalon_humanoid_rig1.py», con las correcciones explicadas en LEEME.txt.
# Ejes de Blender: X = izquierda(+)/derecha(-) del personaje, Y = profundidad (el frente es -Y), Z = altura. Metros.
# Lo usan crear_rig_glb.py (crea el GLB sin Blender) y rig_humano_blender.py (lo mismo dentro de Blender).
import math
NOMBRE = "BK_Humano_Rig"
ALTO = 1.80
FPS = 24

HUESOS = []  # (nombre, cabeza, cola, padre)
def _h(n, a, b, p=None): HUESOS.append((n, a, b, p))
_h("root", (0, 0, 0.02), (0, 0, 0.12))
_h("pelvis", (0, 0, 0.88), (0, 0, 1.00), "root")
_h("spine", (0, 0, 0.98), (0, 0, 1.12), "pelvis")
_h("spine.001", (0, 0, 1.12), (0, 0, 1.27), "spine")
_h("chest", (0, 0, 1.27), (0, 0, 1.42), "spine.001")
_h("neck", (0, 0, 1.42), (0, 0, 1.54), "chest")
_h("head", (0, 0, 1.54), (0, 0, 1.76), "neck")
for L, s in (("L", 1), ("R", -1)):
    _h("clavicle." + L, (0, 0, 1.39), (s * 0.19, 0, 1.40), "chest")
    _h("upper_arm." + L, (s * 0.19, 0, 1.40), (s * 0.48, 0, 1.38), "clavicle." + L)
    _h("forearm." + L, (s * 0.48, 0, 1.38), (s * 0.73, 0, 1.37), "upper_arm." + L)
    _h("hand." + L, (s * 0.73, 0, 1.37), (s * 0.84, -0.01, 1.37), "forearm." + L)
    # CORREGIDO: en pose T con la palma hacia abajo los dedos se abren de delante a atrás (eje Y), no hacia arriba (Z)
    _h("thumb_01." + L, (s * 0.77, -0.02, 1.365), (s * 0.80, -0.045, 1.355), "hand." + L)
    _h("thumb_02." + L, (s * 0.80, -0.045, 1.355), (s * 0.83, -0.06, 1.35), "thumb_01." + L)
    for f, dy in (("index", -0.027), ("middle", -0.009), ("ring", 0.009), ("pinky", 0.027)):
        _h(f + "_01." + L, (s * 0.84, dy, 1.37), (s * 0.885, dy, 1.37), "hand." + L)
        _h(f + "_02." + L, (s * 0.885, dy, 1.37), (s * 0.925, dy, 1.37), f + "_01." + L)
for L, s in (("L", 1), ("R", -1)):
    _h("thigh." + L, (s * 0.10, 0, 0.91), (s * 0.12, 0, 0.51), "pelvis")
    _h("shin." + L, (s * 0.12, 0, 0.51), (s * 0.12, 0, 0.10), "thigh." + L)
    _h("foot." + L, (s * 0.12, 0, 0.10), (s * 0.12, -0.16, 0.055), "shin." + L)
    _h("toe." + L, (s * 0.12, -0.16, 0.055), (s * 0.12, -0.25, 0.05), "foot." + L)

# ---------- cuaterniones (w, x, y, z) en ejes de Blender ----------
def q_eje(ax, a):
    s = math.sin(a / 2); return (math.cos(a / 2), ax[0] * s, ax[1] * s, ax[2] * s)
def Rx(a): return q_eje((1, 0, 0), a)
def Ry(a): return q_eje((0, 1, 0), a)
def Rz(a): return q_eje((0, 0, 1), a)
def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return (w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2, w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2)
def qinv(q): return (q[0], -q[1], -q[2], -q[3])
def qrot(q, v): r = qmul(qmul(q, (0, v[0], v[1], v[2])), qinv(q)); return (r[1], r[2], r[3])
def norm(v): l = math.sqrt(sum(c * c for c in v)) or 1; return tuple(c / l for c in v)
def de_a(a, b):  # el giro más corto que lleva la dirección a hasta la b
    a = norm(a); b = norm(b); d = sum(x * y for x, y in zip(a, b))
    if d < -0.9999: return (0, 0, 0, 1) if abs(a[2]) < 0.9 else (0, 1, 0, 0)
    c = (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
    q = (1 + d, c[0], c[1], c[2]); l = math.sqrt(sum(x * x for x in q)); return tuple(x / l for x in q)
def qnorm(q): l = math.sqrt(sum(x * x for x in q)); return tuple(x / l for x in q)
def slerp(a, b, t):
    d = sum(x * y for x, y in zip(a, b))
    if d < 0: b = tuple(-x for x in b); d = -d
    if d > 0.9995: return qnorm(tuple(x + (y - x) * t for x, y in zip(a, b)))
    th = math.acos(d); s = math.sin(th)
    return tuple((math.sin((1 - t) * th) * x + math.sin(t * th) * y) / s for x, y in zip(a, b))

# ---------- poses: giros respecto a la pose T, en ejes del armazón (no dependen del «roll» de cada hueso) ----------
# Piernas: hacia delante = Rx(-a). Rodilla: Rx(+a). Tronco hacia delante: Rx(+a). Giro del tronco: Rz.
BRAZOS_ABAJO = 1.25  # CORREGIDO: en tu script se caminaba con los brazos en cruz (pose T); aquí bajan junto al cuerpo
def brazo(lado, adelante=0.0, bajar=BRAZOS_ABAJO):
    return qmul(Rx(-adelante), Ry(bajar if lado == "L" else -bajar))
def codo(lado, a): return Rz(-a if lado == "L" else a)  # dobla el antebrazo hacia delante
def pierna(a): return Rx(-a)
def rodilla(a): return Rx(a)

def caminar():
    def k(adel_L, adel_R, rod_L, rod_R, altura, giro):
        return {"thigh.L": pierna(adel_L), "thigh.R": pierna(adel_R), "shin.L": rodilla(rod_L), "shin.R": rodilla(rod_R),
                "upper_arm.L": brazo("L", -adel_L * 0.7), "upper_arm.R": brazo("R", -adel_R * 0.7),
                "forearm.L": codo("L", 0.25), "forearm.R": codo("R", 0.25),
                "spine": Rz(giro), "pelvis@pos": (0, 0, altura)}
    return [(1, k(0.32, -0.32, 0.05, 0.15, -0.015, 0.05)), (7, k(0.0, 0.0, 0.05, 0.6, 0.015, 0.0)),
            (13, k(-0.32, 0.32, 0.15, 0.05, -0.015, -0.05)), (19, k(0.0, 0.0, 0.6, 0.05, 0.015, 0.0)),
            (25, k(0.32, -0.32, 0.05, 0.15, -0.015, 0.05))]

def correr():
    def k(adel_L, adel_R, rod_L, rod_R, altura):
        return {"thigh.L": pierna(adel_L), "thigh.R": pierna(adel_R), "shin.L": rodilla(rod_L), "shin.R": rodilla(rod_R),
                "upper_arm.L": brazo("L", -adel_L * 0.8, 1.35), "upper_arm.R": brazo("R", -adel_R * 0.8, 1.35),
                "forearm.L": codo("L", 1.3), "forearm.R": codo("R", 1.3), "spine": Rx(0.15), "pelvis@pos": (0, 0, altura)}
    return [(1, k(0.65, -0.45, 0.25, 0.9, -0.03)), (4, k(0.1, 0.1, 0.2, 1.2, 0.03)),
            (7, k(-0.45, 0.65, 0.9, 0.25, -0.03)), (10, k(0.1, 0.1, 1.2, 0.2, 0.03)), (13, k(0.65, -0.45, 0.25, 0.9, -0.03))]

def atacar():
    def brazo_dir(arriba, ante):  # dirección del brazo derecho y del antebrazo (en el armazón)
        q = de_a((-1, 0, 0), arriba)
        local_ante = qrot(qinv(q), ante)  # el antebrazo gira dentro del espacio del brazo
        return q, de_a((-1, 0, 0), local_ante)
    def k(arriba, ante, giro, adel_L, rod_L, altura):
        q, qa = brazo_dir(arriba, ante)
        return {"upper_arm.R": q, "forearm.R": qa, "chest": Rz(giro),
                "upper_arm.L": brazo("L", 0.5, 1.1), "forearm.L": codo("L", 1.2),
                "thigh.L": pierna(adel_L), "shin.L": rodilla(rod_L), "thigh.R": pierna(-0.2), "shin.R": rodilla(0.15),
                "pelvis@pos": (0, 0, altura)}
    lista = (-0.35, -0.35, -0.87), (-0.1, -0.85, -0.5)
    return [(1, k(lista[0], lista[1], 0.0, 0.25, 0.2, 0.0)),
            (6, k((-0.3, 0.3, 0.9), (0.0, 0.5, -0.85), -0.35, 0.25, 0.2, 0.0)),    # carga el golpe por encima del hombro
            (11, k((-0.2, -0.95, -0.2), (-0.1, -0.9, -0.42), 0.4, 0.35, 0.35, -0.04)),  # golpe hacia delante
            (17, k(lista[0], lista[1], 0.0, 0.25, 0.2, 0.0))]

ANIMACIONES = [("Caminar", caminar()), ("Correr", correr()), ("Atacar", atacar())]

def suave(t): return t * t * (3 - 2 * t)  # entra y sale despacio (como las curvas Bézier de Blender)
def muestrear(claves):
    """Pose fotograma a fotograma: [(segundos, {hueso: cuaternión o (x,y,z) para '@pos'})]"""
    huesos = sorted({b for _, d in claves for b in d}); out = []
    f0, f1 = claves[0][0], claves[-1][0]
    for f in range(f0, f1 + 1):
        i = max(j for j in range(len(claves)) if claves[j][0] <= f); i = min(i, len(claves) - 2)
        (fa, da), (fb, db) = claves[i], claves[i + 1]; t = suave((f - fa) / float(fb - fa))
        pose = {}
        for b in huesos:
            a = da.get(b); c = db.get(b)
            if a is None or c is None: pose[b] = a if c is None else c; continue
            pose[b] = tuple(x + (y - x) * t for x, y in zip(a, c)) if b.endswith("@pos") else slerp(a, c, t)
        out.append(((f - f0) / float(FPS), pose))
    return out

# ---------- maniquí: una caja por hueso (piel rígida: cada caja sigue a su hueso) ----------
PIEL, TUNICA, CALZAS, BOTAS, CINTO = (0.86, 0.66, 0.52), (0.52, 0.13, 0.11), (0.33, 0.24, 0.17), (0.17, 0.12, 0.09), (0.42, 0.30, 0.12)
PIEZAS = {  # hueso: (ancho X, fondo Y, color)  — el largo es el del hueso
    "pelvis": (0.30, 0.19, CINTO), "spine": (0.30, 0.18, TUNICA), "spine.001": (0.32, 0.19, TUNICA), "chest": (0.38, 0.21, TUNICA),
    "neck": (0.09, 0.09, PIEL), "head": (0.19, 0.21, PIEL)}
for L in ("L", "R"):
    PIEZAS.update({"clavicle." + L: (0.11, 0.13, TUNICA), "upper_arm." + L: (0.095, 0.095, TUNICA), "forearm." + L: (0.075, 0.075, PIEL),
                   "hand." + L: (0.085, 0.03, PIEL), "thigh." + L: (0.135, 0.135, CALZAS), "shin." + L: (0.10, 0.10, CALZAS),
                   "foot." + L: (0.095, 0.075, BOTAS), "toe." + L: (0.09, 0.05, BOTAS)})
    for f in ("thumb", "index", "middle", "ring", "pinky"):
        PIEZAS[f + "_01." + L] = (0.018, 0.016, PIEL); PIEZAS[f + "_02." + L] = (0.016, 0.014, PIEL)

def cajas():
    """[(hueso, [8 esquinas], color)] en ejes de Blender"""
    out = []
    for n, a, b, p in HUESOS:
        if n not in PIEZAS: continue
        w, d, col = PIEZAS[n]
        eje = tuple(y - x for x, y in zip(a, b)); u = norm(eje)
        ref = (0, 0, 1) if abs(u[2]) < 0.8 else (0, -1, 0)
        s1 = norm((u[1] * ref[2] - u[2] * ref[1], u[2] * ref[0] - u[0] * ref[2], u[0] * ref[1] - u[1] * ref[0]))
        s2 = (u[1] * s1[2] - u[2] * s1[1], u[2] * s1[0] - u[0] * s1[2], u[0] * s1[1] - u[1] * s1[0])
        if abs(u[2]) >= 0.8: s1, s2 = (1, 0, 0), (0, 1, 0)  # huesos verticales: ancho en X, fondo en Y
        else: s1, s2 = s1, s2
        hw, hd = w / 2, d / 2; ext = 0.01 if n not in ("head",) else 0.0
        ini = tuple(x - c * ext for x, c in zip(a, u)); fin = tuple(x + c * ext for x, c in zip(b, u))
        esq = []
        for base in (ini, fin):
            for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                esq.append(tuple(base[i] + s1[i] * hw * sx + s2[i] * hd * sy for i in range(3)))
        out.append((n, esq, col))
    return out
CARAS = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
