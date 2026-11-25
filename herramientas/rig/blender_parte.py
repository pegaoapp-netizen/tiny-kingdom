
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
