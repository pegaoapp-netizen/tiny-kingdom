# Brother Kingdom · RIG HUMANO para Blender 3.6 / 4.x / 5.x (generado por crear_rig_glb.py: no editar a mano)
# Blender > Scripting > Abrir este archivo > Run Script. Crea el esqueleto, un maniquí unido, las animaciones
# Caminar, Correr y Atacar en pistas NLA, y exporta rig_humano.glb junto al .blend (o en la carpeta temporal).
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

# ===================== PARTE DE BLENDER (3.6, 4.x y 5.x) =====================
import bpy, os, tempfile
from mathutils import Vector, Quaternion

def _modo_objeto():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
_modo_objeto()
# limpia solo lo que creó este script antes (no toca el resto de tu escena)
for o in list(bpy.data.objects):
    if o.name.startswith("BK_"): bpy.data.objects.remove(o, do_unlink=True)
for coleccion in (bpy.data.armatures, bpy.data.meshes, bpy.data.materials, bpy.data.actions):
    for d in list(coleccion):
        if d.name.startswith("BK_"): coleccion.remove(d)
col = bpy.data.collections.get("BK_RIG") or bpy.data.collections.new("BK_RIG")
if col.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(col)

# ---- esqueleto ----
arm_d = bpy.data.armatures.new(NOMBRE); arm = bpy.data.objects.new(NOMBRE, arm_d); col.objects.link(arm)
arm.show_in_front = True; arm_d.display_type = 'OCTAHEDRAL'
for o in bpy.context.view_layer.objects: o.select_set(False)
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_d.edit_bones; hechos = {}
for n, a, b, p in HUESOS:
    h = eb.new(n); h.head = Vector(a); h.tail = Vector(b); h.roll = 0.0; hechos[n] = h
for n, a, b, p in HUESOS:
    if p:
        hechos[n].parent = hechos[p]
        hechos[n].use_connect = (hechos[n].head - hechos[p].tail).length < 1e-4
bpy.ops.object.mode_set(mode='OBJECT')
arm["proyecto"] = "Brother Kingdom"; arm["rig_version"] = "1.0"; arm["pose_reposo"] = "T"; arm["alto_m"] = ALTO

# ---- maniquí (una caja por hueso, unida a su hueso) ----
verts, caras, grupos, colores = [], [], [], []
for hueso, esq, c in cajas():
    b0 = len(verts); verts += esq
    for f in CARAS:
        caras.append(tuple(b0 + i for i in f)); colores.append(c)
    grupos.append((hueso, list(range(b0, b0 + 8))))
me = bpy.data.meshes.new("BK_Maniqui"); me.from_pydata(verts, [], caras); me.update()
me.validate(); me.normals_make_consistent() if hasattr(me, "normals_make_consistent") else None
ma = bpy.data.objects.new("BK_Maniqui", me); col.objects.link(ma)
# las caras quedan hacia fuera
bpy.context.view_layer.objects.active = ma; ma.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
# color por cara (atributo de color + material que lo usa)
if hasattr(me, "color_attributes"):
    ca = me.color_attributes.new("Color", 'FLOAT_COLOR', 'CORNER')
    for poli in me.polygons:
        c = colores[poli.index]
        for li in poli.loop_indices: ca.data[li].color = (c[0], c[1], c[2], 1.0)
mat = bpy.data.materials.new("BK_Maniqui"); mat.use_nodes = True
nodos = mat.node_tree.nodes; bsdf = nodos.get("Principled BSDF")
try:
    nc = nodos.new("ShaderNodeVertexColor"); nc.layer_name = "Color"
    mat.node_tree.links.new(nc.outputs["Color"], bsdf.inputs["Base Color"])
except Exception: pass
if bsdf: bsdf.inputs["Roughness"].default_value = 0.85
me.materials.append(mat)
for hueso, ids in grupos:
    g = ma.vertex_groups.new(name=hueso); g.add(ids, 1.0, 'REPLACE')
mod = ma.modifiers.new("Armature", 'ARMATURE'); mod.object = arm
ma.parent = arm

# ---- animaciones ----
# Los giros vienen en ejes del armazón; Blender los quiere en los ejes de cada hueso: L = R⁻¹ · q · R
bpy.context.view_layer.objects.active = arm
for o in bpy.context.view_layer.objects: o.select_set(o == arm)
arm.animation_data_create()
acciones = []
for nombre, claves in ANIMACIONES:
    act = bpy.data.actions.new("BK_" + nombre); act.use_fake_user = True  # que no se borre al guardar
    arm.animation_data.action = act
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    previo = {}
    for frame, pose in claves:
        for b, val in pose.items():
            if b.endswith("@pos"):
                pb = arm.pose.bones[b[:-4]]; R = pb.bone.matrix_local.to_quaternion()
                pb.location = R.inverted() @ Vector(val)
                pb.keyframe_insert(data_path="location", frame=frame, group=pb.name)
            else:
                pb = arm.pose.bones[b]; R = pb.bone.matrix_local.to_quaternion()
                L = R.inverted() @ Quaternion(val) @ R
                if b in previo and previo[b].dot(L) < 0: L.negate()  # sin vueltas raras entre claves
                previo[b] = L.copy(); pb.rotation_quaternion = L
                pb.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=pb.name)
    acciones.append(act)
# cada animación en su pista NLA (así el exportador las saca por separado)
arm.animation_data.action = None
for act in acciones:
    pista = arm.animation_data.nla_tracks.new(); pista.name = act.name
    tira = pista.strips.new(act.name, int(act.frame_range[0]), act)
    try:
        if hasattr(tira, "action_slot") and hasattr(act, "slots") and len(act.slots): tira.action_slot = act.slots[0]  # Blender 4.4+
    except Exception: pass
    pista.mute = act is not acciones[0]  # en el visor se ve la primera (Caminar); quita el silencio a otra para verla
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
bpy.context.scene.render.fps = FPS; bpy.context.scene.frame_start = 1; bpy.context.scene.frame_end = 25; bpy.context.scene.frame_set(1)

# ---- exportar a GLB (lo que carga el juego: Three.js) ----
carpeta = bpy.path.abspath("//") if bpy.data.filepath else tempfile.gettempdir()
salida = os.path.join(carpeta, "rig_humano.glb")
for o in bpy.context.view_layer.objects: o.select_set(o in (arm, ma))
opciones = dict(filepath=salida, export_format='GLB', use_selection=True, export_animations=True, export_skins=True,
                export_animation_mode='ACTIONS', export_yup=True, export_apply=False)
for quitar in ([], ['export_animation_mode'], ['export_animation_mode', 'export_apply']):
    try:
        bpy.ops.export_scene.gltf(**{k: v for k, v in opciones.items() if k not in quitar}); print("GLB exportado:", salida); break
    except TypeError: continue
    except Exception as e: print("No se pudo exportar el GLB:", e); break
print("Brother Kingdom: rig", NOMBRE, "·", len(HUESOS), "huesos · animaciones:", [a.name for a in acciones])
