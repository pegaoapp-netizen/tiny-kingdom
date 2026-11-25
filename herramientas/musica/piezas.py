# Composiciones originales de Brother Kingdom (música de guerra). Re menor.
import sys
from motor import *

ACORDE = {'Dm': (38, 41, 45), 'Bb': (34, 38, 41), 'F': (41, 45, 48), 'C': (36, 40, 43), 'Gm': (43, 46, 50), 'A': (33, 37, 40)}
TIMP = {'Dm': 38, 'Bb': 46, 'F': 41, 'C': 36, 'Gm': 43, 'A': 45}  # nota del timbal de cada acorde

def tonos(ac, desde):  # notas del acorde a partir de una nota mínima
    r = []; k = 0
    while len(r) < 6:
        for n in ACORDE[ac]:
            m = n + 12 * k
            if m >= desde: r.append(m)
        k += 1
    return sorted(r)

def timbal(P, o, t, ac, vel=1.0, suave=False):
    P.golpe(o['timp_suave' if suave else 'timp'], t, semis=TIMP[ac] - 41, vel=vel)

# ===================== PREPARACIÓN MILITAR: épica moderada =====================
def preparacion(o):
    bpm = 92; b = 60 / bpm; prog = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'] * 2
    P = Pieza(len(prog) * 4 * b)
    mel = [(62, 0, 1.5), (65, 1.5, .5), (69, 2, 2), (70, 4, 1.5), (69, 5.5, .5), (67, 6, 1), (65, 7, 1), (69, 8, 1.5), (72, 9.5, .5), (72, 10, 2),
           (67, 12, 1), (64, 13, 1), (67, 14, 2), (74, 16, 2), (72, 18, 1), (70, 19, 1), (69, 20, 3), (65, 23, 1), (67, 24, 1.5), (70, 25.5, .5), (69, 26, 1), (67, 27, 1), (69, 28, 4)]
    for i, ac in enumerate(prog):
        t0 = i * 4 * b; seg = i >= 8
        r = ACORDE[ac][0]
        # cuerdas graves en corcheas (spiccato), con acento en el 1 y el 3
        pat = [0, 0, 7, 0, 12, 0, 7, 0]
        for k, d in enumerate(pat):
            n = r + 12 + d if r + 12 + d <= 62 else r + d
            P.nota(o['vc_spic'], n, t0 + k * b / 2, b / 2 * 0.9, vel=0.8 if k in (0, 4) else 0.45, vol=0.9)
            if seg: P.nota(o['vla_spic'], ACORDE[ac][1] + 12 if k % 2 else ACORDE[ac][2] + 12, t0 + k * b / 2, b / 2 * 0.9, vel=0.4, vol=0.6)
        P.nota(o['cb'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.6, vol=0.8)
        # metales graves sostenidos
        for n in tonos(ac, 50)[:3]: P.nota(o['tbn'], n, t0, 4 * b * 0.98, vel=0.35 if not seg else 0.55, vol=0.55)
        if seg: P.nota(o['tuba'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.5, vol=0.6)
        # timbales: 1 y 3 (y una nota de paso)
        timbal(P, o, t0, ac, 0.9); timbal(P, o, t0 + 2 * b, ac, 0.6, suave=True)
        if i % 2 == 1: timbal(P, o, t0 + 3.5 * b, ac, 0.5, suave=True)
        # arpa como un laúd medieval en la primera vuelta; violines en la segunda
        if not seg:
            for k, n in enumerate(tonos(ac, 62)[:4] + tonos(ac, 62)[1:3][::-1] + [tonos(ac, 62)[0], tonos(ac, 62)[2]]):
                P.nota(o['arpa'], n, t0 + k * b / 2, b, vel=0.5, vol=0.7, eco=0.45)
        else:
            for n in tonos(ac, 69)[:2]: P.nota(o['vln'], n, t0, 4 * b, vel=0.5, vol=0.55, eco=0.45)
            P.golpe(o['bombo'], t0, vel=0.7)
            for k in range(8):  # caja de marcha suave
                if k in (2, 6): P.golpe(o['caja'], t0 + k * b / 2, vel=0.55)
                elif k == 7: P.golpe(o['caja_suave'], t0 + k * b / 2 + b / 4, vel=0.5)
    # melodía: trompas la primera vuelta; trompetas con trompas una tercera abajo la segunda
    for (n, t, d) in mel:
        P.nota(o['trompa'], n, t * b, d * b * 0.98, vel=0.6, vol=0.9, eco=0.4)
        P.nota(o['tpt'], n + 12 - 12, (t + 32) * b, d * b * 0.98, vel=0.6, vol=0.75, eco=0.4)
        P.nota(o['trompa'], n - (3 if n % 12 in (2, 5, 9) else 4), (t + 32) * b, d * b * 0.98, vel=0.55, vol=0.6, eco=0.4)
    # final: redoble de timbal que lleva al principio del bucle
    P.golpe(o['timp_redoble'], (64 - 2) * b, semis=TIMP['A'] - 41, vel=0.6, dur=2 * b)
    return P.mezclar(nivel=-17)

# ===================== INICIO DE BATALLA: intensa =====================
def batalla(o):
    bpm = 144; b = 60 / bpm
    prog = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A', 'Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'A', 'A']
    P = Pieza(len(prog) * 4 * b)
    trompaB = [(62, 0, 1.5), (65, 1.5, .5), (67, 2, 2), (70, 4, 2), (69, 6, 1), (67, 7, 1), (69, 8, 3), (65, 11, 1), (62, 12, 4),
               (65, 16, 1.5), (67, 17.5, .5), (70, 18, 2), (72, 20, 1.5), (70, 21.5, .5), (67, 22, 2), (69, 24, 2), (73, 26, 2), (76, 28, 4)]
    trompaC = [(69, 0, 4), (70, 4, 2), (69, 6, 1), (67, 7, 1), (69, 8, 2), (72, 10, 2), (67, 12, 4), (70, 16, 2), (74, 18, 2), (74, 20, 2), (72, 22, 1), (70, 23, 1), (69, 24, 2), (73, 26, 2), (76, 28, 2), (69, 30, 2)]
    for i, ac in enumerate(prog):
        t0 = i * 4 * b; sec = 0 if i < 8 else 1 if i < 16 else 2
        r = ACORDE[ac][0]; tv = tonos(ac, 62)
        # violines: semicorcheas rápidas (spiccato)
        fig = [tv[2], tv[0], tv[1], tv[0]]
        for k in range(16):
            P.nota(o['vln_spic'], fig[k % 4] + (12 if sec == 2 and k % 4 == 0 else 0), t0 + k * b / 4, b / 4 * 0.9, vel=0.7 if k % 4 == 0 else 0.45, vol=0.55)
        # violas en corcheas, chelos y contrabajo empujando
        for k in range(8):
            P.nota(o['vla_spic'], tonos(ac, 55)[k % 2], t0 + k * b / 2, b / 2 * 0.85, vel=0.5, vol=0.5)
            P.nota(o['vc_spic'], r + 12, t0 + k * b / 2, b / 2 * 0.85, vel=0.85 if k in (0, 3, 6) else 0.5, vol=0.9)
        P.nota(o['cb'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.7, vol=0.7)
        # golpes de metales graves: 1, 2y, 4
        for tt in (0, 1.5, 3):
            for n in tonos(ac, 46)[:2]: P.nota(o['tbn_st'], n, t0 + tt * b, b * 0.5, vel=0.85, vol=0.7)
            P.nota(o['tuba_st'], r if r >= 33 else r + 12, t0 + tt * b, b * 0.5, vel=0.85, vol=0.7)
        # percusión de guerra
        for tt, v in ((0, 1.0), (1.5, 0.6), (2, 0.85), (3.5, 0.6)): P.golpe(o['bombo'], t0 + tt * b, vel=v)
        timbal(P, o, t0, ac, 1.0); timbal(P, o, t0 + 2 * b, ac, 0.8); timbal(P, o, t0 + 3.5 * b, ac, 0.6, suave=True)
        for tt in (1, 3): P.golpe(o['caja'], t0 + tt * b, vel=0.8)
        for tt in (0.5, 1.75, 2.5, 3.25, 3.75): P.golpe(o['caja_suave'], t0 + tt * b, vel=0.45)
        if i % 4 == 3: P.golpe(o['caja_redoble'], t0 + 2 * b, vel=0.6, dur=2 * b)
        # parte C: fanfarria de trompetas y violines en trémolo arriba
        if sec == 2:
            tt5 = tonos(ac, 62)
            for tt, k in ((0, 0), (0.75, 1), (1, 2), (2, 1), (2.75, 2), (3, 3)):
                P.nota(o['tpt_st'], tt5[k], t0 + tt * b, b * 0.45, vel=0.8, vol=0.6)
            for n in tonos(ac, 74)[:2]: P.nota(o['vln_trem'], n, t0, 4 * b, vel=0.6, vol=0.45, eco=0.45)
    for (n, t, d) in trompaB:
        P.nota(o['trompa'], n, (t + 32) * b, d * b * 0.98, vel=0.85, vol=1.0, eco=0.4)
        P.nota(o['trompa'], n - 12, (t + 32) * b, d * b * 0.98, vel=0.7, vol=0.6, eco=0.4)
    for (n, t, d) in trompaC:
        P.nota(o['trompa'], n, (t + 64) * b, d * b * 0.98, vel=0.9, vol=1.0, eco=0.4)
        P.nota(o['tpt'], n, (t + 64) * b, d * b * 0.98, vel=0.6, vol=0.55, eco=0.4)
    return P.mezclar(nivel=-15)

ACORDE.update({'D': (38, 42, 45), 'G': (43, 47, 50), 'Eb': (39, 43, 46), 'Bbm': (34, 37, 41)})
TIMP.update({'D': 38, 'G': 43, 'Eb': 39, 'Bbm': 46})

# ===================== MARCHA MILITAR: tensión y anticipación =====================
def marcha(o):
    bpm = 108; b = 60 / bpm
    prog = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A', 'Dm', 'Eb', 'Dm', 'A']
    P = Pieza(len(prog) * 4 * b)
    for i, ac in enumerate(prog):
        t0 = i * 4 * b; seg = i >= 8; r = ACORDE[ac][0]
        # caja de marcha: el ritmo de los pasos (ta, ta-ta-ta)
        for tt, v in ((0, .7), (1, .45), (1.5, .4), (1.75, .4), (2, .7), (3, .45), (3.5, .55)): P.golpe(o['caja' if v > .6 else 'caja_suave'], t0 + tt * b, vel=v)
        P.golpe(o['bombo_suave'], t0, vel=0.8); P.golpe(o['bombo_suave'], t0 + 2 * b, vel=0.6)
        if i % 4 == 3: P.golpe(o['caja_redoble'], t0 + 3 * b, vel=0.45, dur=b)
        # chelos en pizzicato-corto que avanzan como pasos; contrabajo sostenido
        for k in range(4): P.nota(o['vc_spic'], r + 12 + (7 if k == 2 else 0), t0 + k * b, b * 0.5, vel=0.6 if k == 0 else 0.4, vol=0.8)
        P.nota(o['cb'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.5, vol=0.7)
        # violines en trémolo suave arriba: la tensión
        for n in tonos(ac, 69 if not seg else 74)[:1]: P.nota(o['vln_trem'], n, t0, 4 * b, vel=0.35 if not seg else 0.5, vol=0.45, eco=0.5)
        timbal(P, o, t0, ac, 0.6, suave=True)
        if seg:
            for n in tonos(ac, 50)[:3]: P.nota(o['tbn'], n, t0, 4 * b * 0.97, vel=0.4, vol=0.5)
    # gaita: bordón (nota grave fija) y una melodía de llamada, como un ejército que se acerca a lo lejos
    P.poner(gaita(50, len(prog) * 4 * b, 0.35, vib=False), 0, vol=0.55, pan=0.5, eco=0.55)  # bordón continuo (enlaza con el bucle)
    llamada = [(62, 0, 1), (64, 1, .5), (65, 1.5, .5), (69, 2, 2), (67, 4, 1), (65, 5, 1), (64, 6, 2), (62, 8, 1), (65, 9, 1), (69, 10, 1), (74, 11, 1), (72, 12, 2), (69, 14, 2)]
    for vuelta in (0, 32):
        for n, t, d in llamada: P.poner(gaita(n, d * b * 0.95, 0.55), (t + vuelta) * b, vol=0.6, pan=0.45, eco=0.55)
    # trompas responden en la segunda mitad
    for n, t, d in [(62, 48, 2), (65, 50, 2), (69, 52, 3), (67, 55, 1), (69, 56, 4), (64, 60, 4)]:
        P.nota(o['trompa'], n, t * b, d * b * 0.97, vel=0.55, vol=0.8, eco=0.45)
    return P.mezclar(nivel=-18)

# ===================== ASEDIO: oscura y poderosa =====================
def asedio(o):
    bpm = 76; b = 60 / bpm
    prog = ['Dm', 'Eb', 'Dm', 'Eb', 'Bbm', 'Dm', 'Gm', 'A', 'Dm', 'Eb', 'Dm', 'Bb', 'Gm', 'Eb', 'A', 'A']
    P = Pieza(len(prog) * 4 * b)
    for i, ac in enumerate(prog):
        t0 = i * 4 * b; seg = i >= 8; r = ACORDE[ac][0]
        # metales graves muy pesados: tuba y trombones en notas largas
        P.nota(o['tuba'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.75, vol=0.8)
        for n in tonos(ac, 45)[:3]: P.nota(o['tbn'], n, t0, 4 * b * 0.98, vel=0.7, vol=0.65)
        P.nota(o['cb'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.7, vol=0.7)
        # chelos en trémolo grave: el muro que tiembla
        P.nota(o['vc'], r + 12, t0, 4 * b, vel=0.7, vol=0.6)
        # golpes como de ariete: bombo y timbal en 1 y 2y, grande en el 3
        for tt, v in ((0, 1.0), (1.5, 0.7), (2, 1.0)): P.golpe(o['bombo'], t0 + tt * b, vel=v); timbal(P, o, t0 + tt * b, ac, v * 0.9)
        if i % 2 == 1: P.golpe(o['timp_redoble'], t0 + 3 * b, semis=TIMP[ac] - 41, vel=0.5, dur=b)
        if seg:
            for k in range(8): P.nota(o['vla_spic'], tonos(ac, 57)[k % 3], t0 + k * b / 2, b / 2 * 0.85, vel=0.55, vol=0.55)
            for n in tonos(ac, 74)[:2]: P.nota(o['vln_trem'], n, t0, 4 * b, vel=0.55, vol=0.4, eco=0.5)
    # melodía oscura de trompas, la segunda vez con trompetas
    mel = [(62, 0, 3), (63, 3, 1), (62, 4, 4), (65, 8, 2), (63, 10, 2), (62, 12, 4), (61, 16, 2), (62, 18, 2), (65, 20, 2), (69, 22, 2), (70, 24, 3), (69, 27, 1), (69, 28, 4)]
    for n, t, d in mel:
        P.nota(o['trompa'], n, t * b, d * b * 0.98, vel=0.75, vol=0.9, eco=0.4)
        P.nota(o['trompa'], n, (t + 32) * b, d * b * 0.98, vel=0.85, vol=0.9, eco=0.4)
        P.nota(o['tpt'], n, (t + 32) * b, d * b * 0.98, vel=0.55, vol=0.5, eco=0.4)
    return P.mezclar(nivel=-16)

# ===================== SITUACIÓN CRÍTICA: dramática =====================
def critica(o):
    bpm = 152; b = 60 / bpm
    prog = ['Dm', 'Bb', 'Dm', 'Bb', 'Gm', 'Eb', 'A', 'A', 'Dm', 'Bb', 'Dm', 'Eb', 'Gm', 'Bbm', 'A', 'A']
    P = Pieza(len(prog) * 4 * b)
    for i, ac in enumerate(prog):
        t0 = i * 4 * b; r = ACORDE[ac][0]; tv = tonos(ac, 64)
        # violines en trémolo agudo y semicorcheas que suben: la urgencia
        for n in tonos(ac, 76)[:2]: P.nota(o['vln_trem'], n, t0, 4 * b, vel=0.75, vol=0.45, eco=0.4)
        for k in range(16): P.nota(o['vln_spic'], tv[(k % 4)] + (12 if k >= 8 else 0), t0 + k * b / 4, b / 4 * 0.9, vel=0.6, vol=0.45)
        for k in range(8): P.nota(o['vc_spic'], r + 12, t0 + k * b / 2, b / 2 * 0.85, vel=0.85, vol=0.9)
        P.nota(o['cb'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.8, vol=0.7)
        # metales gritando en acordes largos
        for n in tonos(ac, 50)[:3]: P.nota(o['tbn'], n, t0, 4 * b * 0.97, vel=0.8, vol=0.6)
        P.nota(o['tuba'], r if r >= 33 else r + 12, t0, 4 * b, vel=0.8, vol=0.7)
        # percusión sin descanso
        for tt in (0, 0.75, 1.5, 2, 2.75, 3.5): P.golpe(o['bombo'], t0 + tt * b, vel=0.9 if tt in (0, 2) else 0.6)
        for tt in (1, 3): P.golpe(o['caja'], t0 + tt * b, vel=0.85)
        for k in range(8): P.golpe(o['caja_suave'], t0 + k * b / 2 + b / 4, vel=0.35)
        timbal(P, o, t0, ac, 1.0); timbal(P, o, t0 + 2 * b, ac, 0.9)
        if i % 2 == 1: P.golpe(o['timp_redoble'], t0 + 2 * b, semis=TIMP[ac] - 41, vel=0.7, dur=2 * b)
    mel = [(74, 0, 4), (72, 4, 2), (70, 6, 2), (69, 8, 6), (67, 14, 2), (67, 16, 2), (70, 18, 2), (69, 20, 2), (63, 22, 2), (61, 24, 4), (64, 28, 4)]
    for vuelta in (0, 32):
        for n, t, d in mel:
            P.nota(o['trompa'], n - 12, (t + vuelta) * b, d * b * 0.98, vel=0.9, vol=0.9, eco=0.35)
            if vuelta: P.nota(o['tpt'], n, (t + vuelta) * b, d * b * 0.98, vel=0.7, vol=0.55, eco=0.35)
    return P.mezclar(nivel=-14.5)

# ===================== VICTORIA: triunfal (suena una vez) =====================
def victoria(o):
    b = 60 / 100; P = Pieza(9.5, cola=0.1)
    P.golpe(o['timp_redoble'], 0, semis=TIMP['A'] - 41, vel=0.8, dur=1.2 * b)
    acs = [('D', 1.25), ('G', 3.25), ('A', 5.25), ('D', 7.25)]
    for ac, bt in acs:
        t = bt * b; dur = 2 * b if ac != 'D' or bt < 7 else 5 * b; r = ACORDE[ac][0]
        for n in tonos(ac, 50)[:3]: P.nota(o['tbn'], n, t, dur, vel=0.8, vol=0.6)
        P.nota(o['tuba'], r if r >= 33 else r + 12, t, dur, vel=0.8, vol=0.7)
        for n in tonos(ac, 66)[:2]: P.nota(o['vln'], n + 12, t, dur, vel=0.7, vol=0.5, eco=0.45)
        P.nota(o['cb'], r if r >= 33 else r + 12, t, dur, vel=0.7, vol=0.6)
        P.golpe(o['bombo'], t, vel=1.0); timbal(P, o, t, ac, 1.0)
    fan = [(62, 1.25, .5), (66, 1.75, .5), (69, 2.25, 1), (74, 3.25, 1.5), (71, 4.75, .5), (73, 5.25, 1.5), (76, 6.75, .5), (78, 7.25, 4.5)]
    for n, t, d in fan:
        P.nota(o['tpt'], n, t * b, d * b, vel=0.85, vol=0.8, eco=0.45)
        P.nota(o['trompa'], n - 12, t * b, d * b, vel=0.75, vol=0.7, eco=0.45)
    P.golpe(o['timp_redoble'], 7.25 * b, semis=TIMP['D'] - 41, vel=0.7, dur=3.5 * b)
    return P.mezclar(bucle=False, nivel=-15)

# ===================== DERROTA: final dramático (suena una vez) =====================
def derrota(o):
    b = 60 / 66; P = Pieza(13.5, cola=0.1)
    acs = [('Dm', 0, 2), ('Bbm', 2, 2), ('Gm', 4, 2), ('A', 6, 2), ('Dm', 8, 5)]
    for ac, bt, d in acs:
        t = bt * b; r = ACORDE[ac][0]
        for n in tonos(ac, 50)[:3]: P.nota(o['tbn'], n, t, d * b, vel=0.55, vol=0.55)
        P.nota(o['vc'], r + 12, t, d * b, vel=0.6, vol=0.6, eco=0.5)
        P.nota(o['cb'], r if r >= 33 else r + 12, t, d * b, vel=0.6, vol=0.6)
        P.golpe(o['timp'], t, semis=TIMP[ac] - 41, vel=0.7)
    lam = [(69, 0, 1.5), (68, 1.5, .5), (68, 2, 1.5), (65, 3.5, .5), (67, 4, 1), (65, 5, 1), (64, 6, 1), (61, 7, 1), (62, 8, 5)]
    for n, t, d in lam:
        P.nota(o['trompa'], n, t * b, d * b, vel=0.6, vol=0.85, eco=0.55)
        P.nota(o['vln'], n + 12, t * b, d * b, vel=0.45, vol=0.4, eco=0.6)
    P.golpe(o['bombo_suave'], 8 * b, vel=0.8)
    return P.mezclar(bucle=False, nivel=-17)

if __name__ == '__main__':
    o = orquesta()
    os.makedirs('salida', exist_ok=True); os.chdir('salida')
    for nom in sys.argv[1:]:
        out = globals()[nom](o); print(nom, round(len(out) / SR, 2), 's ->', exportar(out, 'guerra_' + nom))
