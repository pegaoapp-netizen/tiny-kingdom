# Villagers & Workers Pack v1 arreglado: mismas 9 mallas, animaciones rehechas para que la herramienta vaya bien cogida
# (mango vertical al andar, golpe de verdad al trabajar, al hombro al transportar; cesta y bolsa colgando de la mano).
# Uso: python3 civiles.py  ->  ../../juego3d/modelos/bk_civil_v1/<oficio>.glb
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import rig_datos as R
from rig_datos import Rx, Rz, pierna, rodilla
from ejercito import dir_, objeto, piernas_guardia
from guardia_real import principal

OFICIOS = {'campesino': 'azada', 'aldeana': 'cesta', 'herrero': 'martillo', 'lenador': 'hacha', 'minero': 'pico',
           'comerciante': 'bolsa', 'constructor': 'martillo', 'pescador': 'cana', 'sanador': 'baston'}
GOLPE = ('azada', 'martillo', 'hacha', 'pico')

def base(**k):
    p = {'pelvis@pos': (0, 0, 0), 'root@pos': (0, 0, 0)}; p.update(k); return p
def brazos(p, h):
    dir_(p, 'upper_arm.R', (-0.25, -0.1, -0.96)); dir_(p, 'upper_arm.L', (0.25, -0.05, -0.97))
    if h in ('cesta', 'bolsa'):
        dir_(p, 'forearm.R', (-0.05, -0.4, -0.9)); dir_(p, 'forearm.L', (0.05, -0.25, -0.96)); objeto(p, 'hand.L', (0, 0, 1), (0, -1, 0))  # cuelga de la mano
    else:
        dir_(p, 'forearm.R', (-0.05, -0.97, -0.1)); objeto(p, 'hand.R', (0, -0.1, 1), (0, -1, 0)); dir_(p, 'forearm.L', (0.05, -0.4, -0.9))  # mango de pie
    return p

def clips(u):
    h = OFICIOS[u]
    reposo = [(1, brazos(base(), h)), (25, brazos(base(chest=Rx(-0.03), **{'pelvis@pos': (0, 0, -0.005)}), h)), (49, brazos(base(), h))]
    def andar(claves, run):
        out = []
        for f, p in claves:
            p = dict(p)
            if h in ('cesta', 'bolsa'): objeto(p, 'hand.L', (0, 0, 1), (0, -1, 0))
            else: dir_(p, 'forearm.R', (-0.05, -0.97, -0.1)); objeto(p, 'hand.R', (0, -0.3 if run else -0.12, 0.95), (0, -1, 0))
            out.append((f, p))
        return out
    # ---- trabajar ----
    if h in GOLPE:  # levantar por encima de la cabeza y golpear delante (cortar, picar, clavar, cavar)
        def k(arriba):
            p = base(chest=Rx(-0.1 if arriba else 0.3)); piernas_guardia(p, 0.2, 0.15 if arriba else 0.35, 0.0 if arriba else 0.06)
            if arriba:
                dir_(p, 'upper_arm.R', (-0.2, 0.05, 0.97)); dir_(p, 'forearm.R', (-0.05, 0.55, 0.83)); objeto(p, 'hand.R', (0, 0.7, 0.7), (0, -0.7, 0.7))
                dir_(p, 'upper_arm.L', (0.12, 0.0, 0.99)); dir_(p, 'forearm.L', (-0.35, 0.4, 0.85))
            else:
                dir_(p, 'upper_arm.R', (-0.15, -0.75, -0.65)); dir_(p, 'forearm.R', (-0.05, -0.92, -0.38)); objeto(p, 'hand.R', (0, -0.6, -0.8), (0, -0.8, 0.6))
                dir_(p, 'upper_arm.L', (0.12, -0.75, -0.65)); dir_(p, 'forearm.L', (-0.35, -0.85, -0.38))
            return p
        trabajar = [(1, k(True)), (8, k(False)), (12, k(False)), (24, k(True))]
    elif h == 'cana':  # caña hacia delante, la punta sube y baja (pescando)
        def k(t):
            p = piernas_guardia(base(), 0.15, 0.1); dir_(p, 'upper_arm.R', (-0.2, -0.6, -0.77)); dir_(p, 'forearm.R', (-0.05, -0.88, 0.47))
            objeto(p, 'hand.R', (0, -0.75 - 0.1 * t, 0.65 - 0.15 * t), (0, -0.65, -0.75)); dir_(p, 'upper_arm.L', (0.2, -0.55, -0.8)); dir_(p, 'forearm.L', (-0.3, -0.9, 0.3)); return p
        trabajar = [(1, k(0)), (12, k(1)), (24, k(0))]
    elif h == 'baston':  # sanador: bastón alzado delante y la otra mano extendida (curar)
        def k(t):
            p = base(); dir_(p, 'upper_arm.R', (-0.3, -0.7, 0.3 + 0.3 * t)); dir_(p, 'forearm.R', (-0.05, -0.75, 0.65)); objeto(p, 'hand.R', (0, -0.3 - 0.2 * t, 0.95 - 0.1 * t), (0, -1, 0))
            dir_(p, 'upper_arm.L', (0.25, -0.95, 0.05 + 0.2 * t)); dir_(p, 'forearm.L', (0.05, -1, 0.1 + 0.2 * t)); return p
        trabajar = [(1, k(0)), (12, k(1)), (24, k(0))]
    else:  # cesta / bolsa: se agacha, coge o da algo con la mano derecha y vuelve
        def k(t):
            p = base(chest=Rx(0.35 * t), spine=Rx(0.15 * t)); piernas_guardia(p, 0.1, 0.25 * t, 0.04 * t)
            dir_(p, 'upper_arm.L', (0.25, -0.45, -0.86)); dir_(p, 'forearm.L', (-0.15, -0.97, 0.1)); objeto(p, 'hand.L', (0, 0, 1), (0, -1, 0))
            dir_(p, 'upper_arm.R', (-0.2, -0.55 - 0.2 * t, -0.8 + 0.2 * t)); dir_(p, 'forearm.R', (0.35, -0.9, -0.25 + 0.2 * t)); return p
        trabajar = [(1, k(0)), (12, k(1)), (24, k(0))]
    # ---- transportar: andando con la carga ----
    trans = []
    for f, p in R.caminar():
        p = {k2: v for k2, v in p.items() if not k2.startswith(('upper_arm', 'forearm'))}
        if h in ('cesta', 'bolsa'):  # la carga delante, con las dos manos
            dir_(p, 'upper_arm.L', (0.2, -0.45, -0.87)); dir_(p, 'forearm.L', (-0.25, -0.96, 0.1)); objeto(p, 'hand.L', (0, 0, 1), (0, -1, 0))
            dir_(p, 'upper_arm.R', (-0.2, -0.45, -0.87)); dir_(p, 'forearm.R', (0.25, -0.96, 0.1))
        else:  # la herramienta al hombro
            dir_(p, 'upper_arm.R', (-0.3, -0.35, -0.89)); dir_(p, 'forearm.R', (0.15, -0.35, 0.92)); objeto(p, 'hand.R', (0, 0.85, 0.5), (0, 0.5, -0.85))
            dir_(p, 'upper_arm.L', (0.25, 0.05, -0.97)); dir_(p, 'forearm.L', (0.05, -0.3, -0.95))
        trans.append((f, p))
    def cae(t):
        p = brazos(base(), h); p['root'] = Rx(-1.57 * t); p['root@pos'] = (0, 0, 0.15 * t); p['spine'] = Rx(-0.1 * t); return p
    morir = [(1, cae(0)), (10, cae(0.45)), (24, cae(1))]
    return [("Reposo", reposo), ("Caminar", andar(R.caminar(), False)), ("Correr", andar(R.correr(), True)),
            ("Trabajar", trabajar), ("Transportar", trans), ("Morir", morir)]

if __name__ == '__main__':
    for u in (sys.argv[1:] or OFICIOS):
        principal(os.path.join(AQUI, 'civil_originales', u + '.glb'), os.path.join(AQUI, '..', '..', 'juego3d', 'modelos', 'bk_civil_v1', u + '.glb'), clips(u))
