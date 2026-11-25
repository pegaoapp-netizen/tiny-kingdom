# Army Pack v1 arreglado: mismas 5 unidades (mallas del paquete), con las 8 animaciones rehechas para que
# cada arma vaya bien cogida: escudo de pie, espada adelante, lanza y bastón verticales, arco de pie.
# Uso: python3 ejercito.py  ->  ../../juego3d/modelos/bk_army_v1/<unidad>.glb
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import rig_datos as R
from rig_datos import qmul, qinv, qrot, norm, de_a, Rx, Rz, pierna, rodilla
from guardia_real import orientar, principal

PADRE = {h[0]: h[3] for h in R.HUESOS}; REPOSO_DIR = {h[0]: norm(tuple(b - a for a, b in zip(h[1], h[2]))) for h in R.HUESOS}
def mundo(p, b):
    cad = []
    while b: cad.insert(0, b); b = PADRE[b]
    q = (1, 0, 0, 0)
    for x in cad: q = qmul(q, p.get(x, (1, 0, 0, 0)))
    return q
def dir_(p, b, d):  # el hueso b apunta en la dirección d del mundo
    p[b] = de_a(REPOSO_DIR[b], qrot(qinv(mundo(p, PADRE[b])), d)); return p
def objeto(p, mano, A, F):  # el objeto de la mano: su eje (hoja, asta, arco, escudo) hacia A y su cara hacia F
    p[mano] = qmul(qinv(mundo(p, PADRE[mano])), orientar((0, 0, 1), (0, -1, 0), A, F)); return p

UNIDADES = {'espadachin': ('espada', 'escudo'), 'lancero': ('lanza', 'escudo'), 'caballero': ('espada', None), 'arquero': (None, 'arco'), 'mago': ('baston', None)}
HEROES = {'rey': ('espada', None), 'reina': ('espada', None), 'paladin': ('espada', 'escudo'), 'nigromante': ('baston', None), 'ogro': ('espada', None)}  # el garrote del ogro se coge como una espada
UNIDADES.update(HEROES)
LARGO = ('lanza', 'baston')

def brazos_reposo(p, der, izq, delante=0.0):
    dir_(p, 'upper_arm.R', (-0.25, -0.1 - delante, -0.96)); dir_(p, 'upper_arm.L', (0.25, -0.05, -0.97))
    if der == 'espada': dir_(p, 'forearm.R', (-0.05, -0.6, -0.8)); objeto(p, 'hand.R', (0, -0.8, 0.6), (-1, 0, 0))
    elif der in LARGO: dir_(p, 'forearm.R', (-0.05, -0.97, -0.1)); objeto(p, 'hand.R', (0, -0.12 - delante, 0.99), (0, -1, 0))
    else: dir_(p, 'forearm.R', (-0.05, -0.4, -0.9))
    if izq == 'escudo': dir_(p, 'forearm.L', (0.05, -0.3, -0.95)); objeto(p, 'hand.L', (0, 0, 1), (0.95, -0.3, 0))
    elif izq == 'arco': dir_(p, 'forearm.L', (0.05, -0.97, -0.1)); objeto(p, 'hand.L', (0, -0.08, 1), (1, 0, 0))
    else: dir_(p, 'forearm.L', (0.05, -0.4, -0.9))
    return p
def escudo_delante(p, empuje=0.0):
    dir_(p, 'upper_arm.L', (0.45, -0.55 - 0.2 * empuje, -0.7 + 0.15 * empuje)); dir_(p, 'forearm.L', (-0.92, -0.32, 0.05))
    return objeto(p, 'hand.L', (0, 0, 1), (0, -1, 0))
def piernas_guardia(p, adel=0.25, rod=0.2, baja=0.0):
    p.update({'thigh.L': pierna(adel), 'shin.L': rodilla(rod), 'thigh.R': pierna(-0.2), 'shin.R': rodilla(0.15), 'pelvis@pos': (0, 0, -baja)}); return p

def clips(u):
    der, izq = UNIDADES[u]
    def base(**k):
        p = {'pelvis@pos': (0, 0, 0), 'root@pos': (0, 0, 0)}; p.update(k); return p
    def reposo(resp):
        return brazos_reposo(base(chest=Rx(-0.03 * resp), **{'pelvis@pos': (0, 0, -0.005 * resp)}), der, izq)
    def andar(claves, run):
        out = []
        for f, p in claves:
            p = dict(p)
            if der in LARGO: dir_(p, 'forearm.R', (-0.05, -0.97, -0.1)); objeto(p, 'hand.R', (0, -0.3 if run else -0.15, 0.95), (0, -1, 0))
            elif der == 'espada': objeto(p, 'hand.R', (0, -0.8, 0.6) if not run else (0, -0.6, 0.8), (-1, 0, 0))
            if izq == 'escudo': objeto(p, 'hand.L', (0, 0, 1), (1, -0.1, 0))
            elif izq == 'arco': dir_(p, 'forearm.L', (0.05, -0.97, -0.1)); objeto(p, 'hand.L', (0, -0.15, 1), (1, 0, 0))
            out.append((f, p))
        return out
    # ---- ataque ----
    if der == 'espada':
        HOJA = {1: (0, -0.75, 0.65), 6: (0, 0.55, 0.8), 11: (0, -0.95, -0.2), 17: (0, -0.75, 0.65)}
        ataque = []
        for f, p in R.atacar():
            p = dict(p)
            if izq == 'escudo': escudo_delante(p)
            objeto(p, 'hand.R', HOJA[f], (-1, 0, 0)); ataque.append((f, p))
    elif der == 'lanza':
        def k(brazo, ante, punta, giro, adel, rod, baja):
            p = piernas_guardia(base(chest=Rz(giro)), adel, rod, baja); escudo_delante(p)
            dir_(p, 'upper_arm.R', brazo); dir_(p, 'forearm.R', ante); return objeto(p, 'hand.R', punta, (0, 0, 1))
        ataque = [(1, k((-0.35, 0.25, -0.9), (-0.05, -0.97, -0.2), (0.05, -1, 0.1), 0, 0.25, 0.2, 0)),
                  (7, k((-0.4, 0.6, -0.7), (-0.1, -0.95, -0.1), (0.05, -1, 0.08), -0.2, 0.25, 0.2, 0)),       # echa la lanza atrás
                  (12, k((-0.15, -0.8, -0.58), (-0.02, -1, -0.05), (0.0, -1, 0.0), 0.35, 0.45, 0.4, 0.05)),  # estocada adelante
                  (20, k((-0.35, 0.25, -0.9), (-0.05, -0.97, -0.2), (0.05, -1, 0.1), 0, 0.25, 0.2, 0))]
    elif izq == 'arco':
        def k(tensa, suelta):
            p = piernas_guardia(base(chest=Rz(0.5 * tensa)), 0.2, 0.15)
            if tensa == 0: return brazos_reposo(p, der, izq)
            dir_(p, 'upper_arm.L', (0.2, -0.97, 0.12)); dir_(p, 'forearm.L', (0.05, -1, 0.1)); objeto(p, 'hand.L', (0, -0.05, 1), (0, 1, 0))  # brazo del arco estirado
            if suelta: dir_(p, 'upper_arm.R', (-0.8, 0.55, 0.1)); dir_(p, 'forearm.R', (-0.4, 0.9, -0.1))   # la mano sale hacia atrás al soltar
            else: dir_(p, 'upper_arm.R', (-0.75, 0.6, 0.1)); dir_(p, 'forearm.R', (0.7, -0.7, 0.1))       # tensa la cuerda junto a la cara
            return p
        ataque = [(1, k(0, 0)), (7, k(1, 0)), (12, k(1, 0)), (14, k(1, 1)), (22, k(0, 0))]
    else:  # mago: lanza el hechizo con el bastón por delante
        def k(fase):
            p = base()
            if fase == 0: return brazos_reposo(p, der, izq)
            dir_(p, 'upper_arm.R', (-0.3, -0.7, 0.4 + 0.2 * fase)); dir_(p, 'forearm.R', (-0.05, -0.75, 0.65)); objeto(p, 'hand.R', (0, -0.35 - 0.3 * fase, 0.93 - 0.3 * fase), (0, -1, 0))
            dir_(p, 'upper_arm.L', (0.25, -0.95, 0.1 * fase)); dir_(p, 'forearm.L', (0.05, -1, 0.1 * fase)); return piernas_guardia(p, 0.25, 0.2, 0.02 * fase)
        ataque = [(1, k(0)), (9, k(0.6)), (14, k(1)), (25, k(0))]
    # ---- defender ----
    def defensa(e):
        p = piernas_guardia(base(spine=Rx(0.08 + 0.05 * e)), 0.3, 0.35, 0.05 + 0.02 * e)
        brazos_reposo(p, der, izq)
        if izq == 'escudo': escudo_delante(p, e)
        if der == 'espada' and izq == 'escudo':
            dir_(p, 'upper_arm.R', (-0.55, 0.2, -0.8)); dir_(p, 'forearm.R', (-0.2, -0.75, 0.6)); objeto(p, 'hand.R', (0.1, -0.5, 0.85), (-1, 0, 0))
        elif der == 'espada':  # sin escudo: la espada de través para parar el golpe
            dir_(p, 'upper_arm.R', (-0.3, -0.6, -0.75)); dir_(p, 'forearm.R', (0.35, -0.75, 0.55)); objeto(p, 'hand.R', (0.85, -0.2, 0.5 + 0.1 * e), (0, -1, 0))
            dir_(p, 'upper_arm.L', (0.3, -0.6, -0.75)); dir_(p, 'forearm.L', (-0.4, -0.75, 0.5))
        elif der == 'lanza':
            dir_(p, 'upper_arm.R', (-0.35, 0.25, -0.9)); dir_(p, 'forearm.R', (-0.05, -0.97, -0.2)); objeto(p, 'hand.R', (0.05, -1, 0.15), (0, 0, 1))
        elif der == 'baston':  # bastón cruzado delante con las dos manos
            dir_(p, 'upper_arm.R', (-0.35, -0.6, -0.7)); dir_(p, 'forearm.R', (0.55, -0.8, 0.2)); objeto(p, 'hand.R', (1, 0, 0.25 + 0.1 * e), (0, -1, 0))
            dir_(p, 'upper_arm.L', (0.35, -0.6, -0.7)); dir_(p, 'forearm.L', (-0.55, -0.8, 0.2))
        if izq == 'arco':  # el arco de través delante para cubrirse
            dir_(p, 'upper_arm.L', (0.35, -0.75, -0.5)); dir_(p, 'forearm.L', (-0.4, -0.85, 0.35)); objeto(p, 'hand.L', (0.6, -0.2, 0.78), (0, 1, 0))
        return p
    defender = [(1, defensa(0)), (12, defensa(1)), (24, defensa(0))]
    # ---- recibir golpe, morir, victoria ----
    golpe = [(1, reposo(0)), (5, brazos_reposo(base(chest=Rx(-0.25), spine=Rx(-0.1), **{'pelvis@pos': (0, 0.04, -0.02)}), der, izq)), (14, reposo(0))]
    def cae(t):
        p = brazos_reposo(base(), der, izq); p['root'] = Rx(-1.57 * t); p['root@pos'] = (0, 0, 0.15 * t); p['spine'] = Rx(-0.1 * t); return p
    morir = [(1, cae(0)), (10, cae(0.45)), (24, cae(1))]
    def gana(t):
        p = brazos_reposo(base(), der, izq)
        if t == 0: return p
        dir_(p, 'upper_arm.R', (-0.25, -0.05, 0.97)); dir_(p, 'forearm.R', (-0.1, 0, 1))
        if der: objeto(p, 'hand.R', (0, -0.15, 1), (0, -1, 0))
        if izq == 'arco': dir_(p, 'upper_arm.L', (0.25, -0.05, 0.97)); dir_(p, 'forearm.L', (0.1, 0, 1)); objeto(p, 'hand.L', (0, -0.3, 0.95), (1, 0, 0))
        return p
    victoria = [(1, gana(0)), (12, gana(1)), (24, gana(1)), (36, gana(0))]
    return [("Reposo", [(1, reposo(0)), (25, reposo(1)), (49, reposo(0))]), ("Caminar", andar(R.caminar(), False)), ("Correr", andar(R.correr(), True)),
            ("Atacar", ataque), ("Defender", defender), ("RecibirDano", golpe), ("Morir", morir), ("Victoria", victoria)]

PAQUETES = {'ejercito_originales': ('bk_army_v1', ['espadachin', 'lancero', 'caballero', 'arquero', 'mago']), 'heroes_originales': ('bk_heroes_v1', list(HEROES))}
if __name__ == '__main__':
    for org, (dest, lista) in PAQUETES.items():
        for u in lista:
            if sys.argv[1:] and u not in sys.argv[1:]: continue
            principal(os.path.join(AQUI, org, u + '.glb'), os.path.join(AQUI, '..', '..', 'juego3d', 'modelos', dest, u + '.glb'), clips(u))
