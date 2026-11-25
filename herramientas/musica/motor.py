# Motor de orquesta con muestras reales (VSCO 2 CE, CC0) para la música de guerra de Brother Kingdom.
import glob, re, numpy as np, subprocess, os, warnings
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, sosfilt
warnings.filterwarnings('ignore')
SR = 44100
VS = '/home/claude/vsco/'
NN = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def nombre_midi(n):
    m = re.match(r'([A-G])(#|b)?(-?\d)', n)
    s = NN[m.group(1)] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)
    return 12 * (int(m.group(3)) + 1) + s

def cargar(f):
    sr, x = wavfile.read(f); dt = x.dtype; x = x.astype(np.float32)
    x /= 32768. if dt == np.int16 else 2147483648. if dt == np.int32 else 1.
    if x.ndim == 1: x = np.stack([x, x], 1)
    a = np.abs(x).max(1); thr = a.max() * 0.02; i0 = int(np.argmax(a > thr)); i0 = max(0, i0 - int(0.004 * SR))
    return x[i0:]

class Inst:
    """dir: carpeta; off: corrección de octava de los nombres; vel: capas ordenadas de suave a fuerte"""
    def __init__(self, dir_, off=12, vol=1.0, pan=0.0, rel=0.25):
        self.files = {}
        for f in glob.glob(VS + dir_ + '/*.wav'):
            b = f.split('/')[-1]; m = re.findall(r'_([A-G]#?b?-?\d)_', b)
            if not m: continue
            v = re.findall(r'_v(\d+)', b); v = int(v[0]) if v else 1
            self.files.setdefault(nombre_midi(m[0]) + off, {}).setdefault(v, []).append(f)
        self.cache = {}; self.vol = vol; self.pan = pan; self.rel = rel; self.rr = 0
    def muestra(self, midi, vel):
        base = min(self.files, key=lambda k: (abs(k - midi), k < midi))
        capas = sorted(self.files[base]); v = capas[min(len(capas) - 1, int(vel * len(capas)))]
        fs = sorted(self.files[base][v]); self.rr += 1; f = fs[self.rr % len(fs)]
        if f not in self.cache: self.cache[f] = cargar(f)
        return self.cache[f], base
    def render(self, midi, vel, dur):
        x, base = self.muestra(midi, vel)
        r = 2 ** ((midi - base) / 12.)
        n = int((dur + self.rel) * SR)
        idx = np.arange(n) * r
        idx = idx[idx < len(x) - 1]
        if not len(idx): return np.zeros((1, 2), np.float32)
        y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)
        nd = int(dur * SR)
        if len(y) > nd:  # final suave
            k = len(y) - nd; y[nd:] *= np.linspace(1, 0, k)[:, None] ** 2
        return y.astype(np.float32)

class Golpe:
    """percusión: lista de archivos (round robin), se puede afinar"""
    def __init__(self, patron, vol=1.0, pan=0.0):
        self.fs = sorted(glob.glob(VS + patron)); self.cache = {}; self.vol = vol; self.pan = pan; self.rr = 0
    def render(self, semis=0, vel=1, dur=None):
        f = self.fs[self.rr % len(self.fs)]; self.rr += 1
        if f not in self.cache: self.cache[f] = cargar(f)
        x = self.cache[f]
        if semis:
            r = 2 ** (semis / 12.); idx = np.arange(int(len(x) / r)) * r
            x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)
        if dur: x = x[:int(dur * SR)].copy(); k = min(len(x), int(0.08 * SR)); x[-k:] *= np.linspace(1, 0, k)[:, None]
        return x * vel

class Pieza:
    def __init__(self, segundos, cola=4.0):
        self.L = int(segundos * SR); self.cola = int(cola * SR)
        self.seco = np.zeros((self.L + self.cola, 2), np.float32); self.humedo = np.zeros_like(self.seco)
    def poner(self, y, t, vol=1.0, pan=0.0, eco=0.3):
        i = int(t * SR); y = y[:max(0, len(self.seco) - i)]
        if not len(y): return
        a = (pan + 1) * np.pi / 4; g = np.array([np.cos(a), np.sin(a)]) * np.sqrt(2) * vol
        self.seco[i:i + len(y)] += y * g * (1 - eco * 0.5); self.humedo[i:i + len(y)] += y * g * eco
    def nota(self, inst, midi, t, dur, vel=0.7, vol=1.0, eco=None):
        self.poner(inst.render(midi, vel, dur), t, inst.vol * vol, inst.pan, 0.3 if eco is None else eco)
    def golpe(self, g, t, semis=0, vel=1.0, dur=None, eco=0.25):
        self.poner(g.render(semis, vel, dur), t, g.vol, g.pan, eco)
    def mezclar(self, bucle=True, nivel=-16.0):
        # sala grande: ruido que se apaga, más grave con el tiempo
        n = int(2.8 * SR); t = np.arange(n) / SR; rng = np.random.default_rng(7)
        ir = rng.standard_normal((n, 2)) * np.exp(-t / 0.75)[:, None]
        ir = sosfilt(butter(2, 5200, 'lp', fs=SR, output='sos'), ir, axis=0)
        ir[:int(0.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
        wet = np.stack([fftconvolve(self.humedo[:, c], ir[:, c])[:len(self.humedo)] for c in (0, 1)], 1)
        out = self.seco + wet * 0.9
        out = sosfilt(butter(1, 30, 'hp', fs=SR, output='sos'), out, axis=0)
        if bucle:  # la cola del final se suma al principio: el bucle queda perfecto
            out[:self.cola] += out[self.L:self.L + self.cola]; out = out[:self.L]
        else:  # suena una vez: termina apagándose
            k = int(1.2 * SR); out[-k:] *= np.linspace(1, 0, k)[:, None] ** 2
        rms = np.sqrt((out ** 2).mean()); out *= 10 ** (nivel / 20) / max(rms, 1e-9)
        out = np.tanh(out * 1.1) / np.tanh(1.1)  # limitador suave
        pk = np.abs(out).max();
        if pk > 0.97: out *= 0.97 / pk
        return out.astype(np.float32)

def exportar(out, nombre, kbps=128):
    w = '/tmp/' + nombre + '.wav'; wavfile.write(w, SR, (out * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', w, '-c:a', 'aac', '-b:a', '%dk' % kbps, '-movflags', '+faststart', nombre + '.m4a'], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', w, '-b:a', '160k', nombre + '_escuchar.mp3'], check=True)
    return nombre + '.m4a'

# ---------- la orquesta ----------
def orquesta():
    o = {}
    o['vln'] = Inst('Strings/Violin Section/susVib', vol=0.55, pan=-0.45, rel=0.5)
    o['vln_spic'] = Inst('Strings/Violin Section/Spic', vol=0.6, pan=-0.45, rel=0.12)
    o['vln_trem'] = Inst('Strings/Violin Section/Trem', vol=0.45, pan=-0.45, rel=0.4)
    o['vla_spic'] = Inst('Strings/Viola Section/spic', vol=0.6, pan=-0.1, rel=0.12)
    o['vla'] = Inst('Strings/Viola Section/susvib', vol=0.5, pan=-0.1, rel=0.5)
    o['vc'] = Inst('Strings/Cello Section/susvib', vol=0.6, pan=0.35, rel=0.5)
    o['vc_spic'] = Inst('Strings/Cello Section/spic', vol=0.75, pan=0.35, rel=0.12)
    o['cb'] = Inst('Strings/Solo Contrabass/SusNV', vol=0.6, pan=0.4, rel=0.4)
    o['arpa'] = Inst('Strings/Harp', off=0, vol=0.55, pan=-0.25, rel=1.2)
    o['trompa'] = Inst('Brass/F Horn/sus', vol=0.6, pan=-0.2, rel=0.5)
    o['trompa_st'] = Inst('Brass/F Horn/stac', vol=0.6, pan=-0.2, rel=0.15)
    o['tpt'] = Inst('Brass/Trumpet/sus', vol=0.5, pan=0.15, rel=0.4)
    o['tpt_st'] = Inst('Brass/Trumpet/stac', vol=0.55, pan=0.15, rel=0.12)
    o['tbn'] = Inst('Brass/Tenor Trombone/sus', vol=0.55, pan=0.25, rel=0.4)
    o['tbn_st'] = Inst('Brass/Tenor Trombone/stac', vol=0.6, pan=0.25, rel=0.12)
    o['tuba'] = Inst('Brass/Tuba/sus', vol=0.6, pan=0.3, rel=0.4)
    o['tuba_st'] = Inst('Brass/Tuba/stac', vol=0.65, pan=0.3, rel=0.12)
    o['timp'] = Golpe('Percussion/Timpani/Timpani1_Hit_v[34]_*.wav', vol=1.1, pan=0.1)
    o['timp_suave'] = Golpe('Percussion/Timpani/Timpani1_Hit_v1_*.wav', vol=1.0, pan=0.1)
    o['timp_redoble'] = Golpe('Percussion/Timpani/Rolls/Timpani1_Roll_v5_*.wav', vol=0.9, pan=0.1)
    o['bombo'] = Golpe('Percussion/BDrumNewhit_v[67]_*.wav', vol=1.2, pan=0.0)
    o['bombo_suave'] = Golpe('Percussion/BDrumNewhit_v[34]_*.wav', vol=1.0, pan=0.0)
    o['caja'] = Golpe('Percussion/Snare2-HitSN_v[79]_*.wav', vol=0.55, pan=0.15)
    o['caja_suave'] = Golpe('Percussion/Snare2-HitSN_v[13]_*.wav', vol=0.5, pan=0.15)
    o['caja_redoble'] = Golpe('Percussion/Snare2-rollSN_v5_*.wav', vol=0.5, pan=0.15)
    return o

# ---------- gaita medieval (no hay muestras: se hace sumando armónicos con un timbre nasal de lengüeta) ----------
def gaita(midi, dur, vel=0.6, vib=True):
    n = int((dur + 0.15) * SR); t = np.arange(n) / SR; f = 440 * 2 ** ((midi - 69) / 12.)
    fm = f * (1 + (0.004 * np.sin(2 * np.pi * 5.2 * t) if vib else 0))
    ph = 2 * np.pi * np.cumsum(fm) / SR; y = np.zeros(n)
    for h in range(1, 24):
        if f * h > 9000: break
        fh = f * h; form = 1 + 2.2 * np.exp(-((fh - 1300) / 500) ** 2) + 1.2 * np.exp(-((fh - 2900) / 700) ** 2)
        y += np.sin(h * ph) * form / h ** 0.85 * (1.0 if h % 2 else 0.6)
    env = np.minimum(1, t / 0.04) * np.minimum(1, np.maximum(0, (dur + 0.15 - t) / 0.15))
    y = y * env * vel * 0.12
    return np.stack([y, y], 1).astype(np.float32)
