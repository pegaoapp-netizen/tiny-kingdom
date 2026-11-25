# Cavalry Pack v1 arreglado: mismas mallas (caballo + jinete), animaciones rehechas:
# - el caballo anda a 4 tiempos, trota por parejas en diagonal y galopa de verdad (patas, rodillas, lomo, cuello y cola);
# - el jinete se mueve con el caballo, se inclina al galopar y ataca de verdad (espada, o arco en el arquero montado);
# - al morir, el caballo cae de lado sobre el suelo.
# Uso: python3 caballeria.py  ->  ../../juego3d/modelos/bk_cavalry_v1/<modelo>.glb
import os, sys, math, json, struct
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import rig_datos as R
from rig_datos import Rx, Rz
from ejercito import dir_, objeto, escudo_delante
from guardia_real import principal

FPS = 24
JINETE = {'ligera': ('espada', 'escudo'), 'pesada': ('espada', None), 'arquero_montado': (None, 'arco'), 'caballo': None}
# pose de montar del paquete (piernas abiertas sobre el lomo), pasada de glTF a ejes del rig
def de_gl(q): return (q[3], q[0], -q[2], q[1])
PIERNAS = {'thigh.L': de_gl((-0.484, -0.129, 0.222, 0.836)), 'shin.L': de_gl((0.605, 0, 0, 0.796)),
           'thigh.R': de_gl((-0.484, 0.129, -0.222, 0.836)), 'shin.R': de_gl((0.605, 0, 0, 0.796))}

# ---------- caballo (directamente en ejes glTF: Y arriba, +Z hacia delante) ----------
def qx(a): return [math.sin(a / 2), 0, 0, math.cos(a / 2)]
def qz(a): return [0, 0, math.sin(a / 2), math.cos(a / 2)]
def qmul(a, b):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b
    return [w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2, w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2, w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2]
PATAS = ['front_L', 'front_R', 'hind_L', 'hind_R']
# fase de cada pata en el ciclo (0..1)
MARCHAS = {'Caminar': ({'hind_L': 0, 'front_L': 0.25, 'hind_R': 0.5, 'front_R': 0.75}, 0.30, 0.55, 1.2, 0.015, 0.02),
           'Trotar': ({'front_L': 0, 'hind_R': 0, 'front_R': 0.5, 'hind_L': 0.5}, 0.40, 0.85, 0.8, 0.04, 0.03),
           'Galopar': ({'hind_L': 0, 'hind_R': 0.12, 'front_L': 0.42, 'front_R': 0.54}, 0.62, 1.05, 0.65, 0.07, 0.10)}
def caballo_marcha(nombre, ts):
    fases, A, K, T, bote, cabeceo = MARCHAS[nombre]; out = {}
    for b in PATAS + [b + '_shin' for b in PATAS] + ['horse_body', 'horse_neck', 'horse_head', 'horse_tail']: out[b] = []
    out['horse_body@t'] = []
    for t in ts:
        u = t / T
        for b in PATAS:
            f = 2 * math.pi * (u + fases[b])
            ang = A * math.sin(f)                      # + = pata hacia delante
            vuelo = max(0.0, math.cos(f))              # mientras la pata va hacia delante, la rodilla se dobla
            out[b] += qx(-ang); out[b + '_shin'] += qx(K * vuelo * (1.0 if b.startswith('front') else 0.8))
        rep = 2 if nombre == 'Trotar' else 1
        out['horse_body'] += qx(cabeceo * math.sin(2 * math.pi * u * rep) * (1 if nombre == 'Galopar' else 0.4))
        out['horse_body@t'] += [0, 1.22 + bote * math.sin(2 * math.pi * u * rep * (2 if nombre == 'Caminar' else 1)), 0]
        out['horse_neck'] += qx(0.12 * math.sin(2 * math.pi * u * rep + 1.2) - (0.15 if nombre == 'Galopar' else 0))
        out['horse_head'] += qx(0.08 * math.sin(2 * math.pi * u * rep + 2.0))
        out['horse_tail'] += qz(0.15 * math.sin(2 * math.pi * u * 0.5)) if nombre != 'Galopar' else qx(-0.5 + 0.1 * math.sin(2 * math.pi * u))
    return out
def caballo_reposo(ts):
    out = {b: [] for b in ['horse_neck', 'horse_head', 'horse_tail', 'hind_R', 'hind_R_shin']}; out['horse_body@t'] = []
    for t in ts:
        u = t / 2.0
        out['horse_neck'] += qx(0.05 * math.sin(2 * math.pi * u)); out['horse_head'] += qx(0.06 * math.sin(2 * math.pi * u + 0.8))
        out['horse_tail'] += qz(0.25 * math.sin(2 * math.pi * u)); out['hind_R'] += qx(-0.05); out['hind_R_shin'] += qx(0.25)  # descansa una pata
        out['horse_body@t'] += [0, 1.22 + 0.008 * math.sin(2 * math.pi * u), 0]
    return out
def caballo_ataque(ts):  # se levanta un poco de manos mientras el jinete golpea
    out = {b: [] for b in ['horse_body', 'front_L', 'front_R', 'front_L_shin', 'front_R_shin', 'hind_L', 'hind_R', 'horse_neck', 'horse_tail']}; out['horse_body@t'] = []
    D = ts[-1]
    for t in ts:
        k = math.sin(math.pi * min(1, t / D)) ** 2
        out['horse_body'] += qx(-0.28 * k); out['horse_body@t'] += [0, 1.22 + 0.12 * k, -0.15 * k]
        for b in ('front_L', 'front_R'): out[b] += qx(-0.9 * k + (0.15 * k if b == 'front_R' else 0)); out[b + '_shin'] += qx(1.4 * k)
        for b in ('hind_L', 'hind_R'): out[b] += qx(0.28 * k)
        out['horse_neck'] += qx(0.3 * k); out['horse_tail'] += qx(0.3 * k)
    return out
def caballo_muerte(ts):  # tropieza y cae de lado, quedando sobre el suelo
    out = {b: [] for b in ['horse_root', 'horse_neck', 'front_L', 'front_R', 'hind_L', 'hind_R', 'front_L_shin', 'front_R_shin']}; out['horse_root@t'] = []
    D = ts[-1]
    for t in ts:
        k = min(1, t / D); k = k * k * (3 - 2 * k); tro = math.sin(math.pi * min(1, t / (D * 0.4)))
        out['horse_root'] += qmul(qz(-1.32 * k), qx(0.15 * tro)); out['horse_root@t'] += [0.0 * k, 0, 0]
        out['horse_neck'] += qx(0.5 * k)
        for b in ('front_L', 'front_R'): out[b] += qx(-0.3 * k); out[b + '_shin'] += qx(0.6 * k)
        for b in ('hind_L', 'hind_R'): out[b] += qx(0.25 * k)
    return out

def a_canales(d):
    res = []
    for b, v in d.items():
        if b.endswith('@t'): res.append((b[:-2], 'translation', v))
        else: res.append((b, 'rotation', v))
    return res

# ---------- jinete (ejes del rig, como el resto de personajes) ----------
def montado(der, izq, **k):
    p = {'pelvis@pos': (0, 0, 0)}; p.update(PIERNAS); p.update(k)
    dir_(p, 'upper_arm.R', (-0.3, -0.35, -0.89)); dir_(p, 'upper_arm.L', (0.3, -0.35, -0.89))
    if der == 'espada': dir_(p, 'forearm.R', (-0.05, -0.75, 0.0)); objeto(p, 'hand.R', (0, -0.55, 0.83), (-1, 0, 0))   # espada en alto delante
    else: dir_(p, 'forearm.R', (0.2, -0.95, 0.1))                                                                       # mano en las riendas
    if izq == 'escudo': dir_(p, 'forearm.L', (0.05, -0.3, -0.95)); objeto(p, 'hand.L', (0, 0, 1), (0.95, -0.3, 0))
    elif izq == 'arco': dir_(p, 'forearm.L', (0.05, -0.97, -0.1)); objeto(p, 'hand.L', (0, -0.1, 1), (1, 0, 0))
    else: dir_(p, 'forearm.L', (-0.2, -0.95, 0.1))
    return p
def jinete_ciclo(der, izq, nf, inclina):
    return [(1, montado(der, izq, spine=Rx(inclina))), (nf, montado(der, izq, spine=Rx(inclina)))]
def jinete_ataque(der, izq, nf):
    if der == 'espada':
        def k(arriba, golpe, giro):
            p = montado(der, izq, chest=Rz(giro), spine=Rx(0.1 + 0.15 * golpe))
            dir_(p, 'upper_arm.R', arriba); dir_(p, 'forearm.R', (arriba[0] * 0.3, arriba[1] * 0.5 - 0.5 * golpe, arriba[2]))
            objeto(p, 'hand.R', (0, 0.4 - 1.3 * golpe, 0.9 - 1.1 * golpe), (-1, 0, 0))
            if izq == 'escudo': escudo_delante(p)
            return p
        return [(1, k((-0.3, -0.35, -0.89), 0, 0)), (int(nf * 0.4), k((-0.25, 0.2, 0.95), 0, -0.35)),     # alza la espada
                (int(nf * 0.62), k((-0.45, -0.85, -0.2), 1, 0.45)), (nf, k((-0.3, -0.35, -0.89), 0, 0))]  # golpe de lado hacia abajo
    def k(tensa):  # arquero: dispara de lado
        p = montado(der, izq, chest=Rz(0.9 * tensa))
        if tensa: dir_(p, 'upper_arm.L', (0.97, -0.1, 0.15)); dir_(p, 'forearm.L', (1, -0.05, 0.1)); objeto(p, 'hand.L', (0, 0, 1), (-1, 0, 0)); dir_(p, 'upper_arm.R', (0.3, 0.9, 0.2)); dir_(p, 'forearm.R', (0.95, -0.2, 0.1))
        return p
    return [(1, k(0)), (int(nf * 0.35), k(1)), (int(nf * 0.6), k(1)), (nf, k(0))]

def clips(u):
    j = JINETE[u]; der, izq = j if j else (None, None)
    def nf(seg): return int(round(seg * FPS)) + 1
    lista = []
    for nombre, seg, inclina in (('Reposo', 2.0, 0.0), ('Caminar', 1.2, 0.05), ('Trotar', 0.8, 0.1), ('Galopar', 0.65, 0.3), ('Atacar', 1.0, 0.0), ('Morir', 1.4, 0.0)):
        n = nf(seg)
        if nombre == 'Atacar': ri = jinete_ataque(der, izq, n)
        elif nombre == 'Morir': ri = [(1, montado(der, izq)), (n, montado(der, izq, spine=Rx(-0.4), chest=Rx(-0.3)))]
        else: ri = jinete_ciclo(der, izq, n, inclina)
        lista.append((nombre, ri, n))
    return lista

def extra(nombre, ts):
    if nombre in MARCHAS: return a_canales(caballo_marcha(nombre, ts))
    if nombre == 'Reposo': return a_canales(caballo_reposo(ts))
    if nombre == 'Atacar': return a_canales(caballo_ataque(ts))
    return a_canales(caballo_muerte(ts))

if __name__ == '__main__':
    for u in (sys.argv[1:] or JINETE):
        c = clips(u)
        org = os.path.join(AQUI, 'caballeria_originales', u + '.glb'); dst = os.path.join(AQUI, '..', '..', 'juego3d', 'modelos', 'bk_cavalry_v1', u + '.glb')
        principal(org, dst, [(n, ri) for n, ri, _ in c] if JINETE[u] else [(n, [(1, {}), (k, {})]) for n, _, k in c], extra)  # caballo solo: sin jinete
