import trimesh as t, numpy as np, json
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'juego3d/modelos/bk_buildings_v1'; OUT.mkdir(parents=True,exist_ok=True)
C={'stone':'9297a0','dark':'525b68','wood':'69462e','cream':'d6bd90','blue':'234b83','gold':'c69b48','green':'617844','soil':'79583b','iron':'434950','red':'9c4a39','crystal':'68d7ed'}
def add(m,p,c):
 m.apply_translation(p); m.visual=t.visual.TextureVisuals(material=t.visual.material.PBRMaterial(name=c,baseColorFactor=tuple(bytes.fromhex(C[c]))+(255,),roughnessFactor=.85)); s.add_geometry(m)
def box(p,d,c): add(t.creation.box(d),p,c)
def cyl(p,r,h,c,n=12): add(t.creation.cylinder(r,h,sections=n),p,c)
def roof(x,y,z,w,d,h,c='blue'):
 v=[[-w/2,-d/2,0],[w/2,-d/2,0],[0,-d/2,h],[-w/2,d/2,0],[w/2,d/2,0],[0,d/2,h]]; f=[[0,1,2],[3,5,4],[0,3,4],[0,4,1],[1,4,5],[1,5,2],[2,5,3],[2,3,0]]; add(t.Trimesh(v,f,process=True),(x,y,z),c)
def base(w,d): box((0,0,.12),(w,d,.24),'dark')
def tower(x,y,r=1,h=4,cap=True):
 cyl((x,y,h/2+.24),r,h,'stone'); cyl((x,y,h+.25),r*1.12,.25,'dark')
 if cap: add(t.creation.cone(r*1.2,1.6,sections=12),(x,y,h+.37),'blue'); cyl((x,y,h+2),.09,.3,'gold')
 else:
  for a in np.arange(8)*np.pi/4: box((x+r*.88*np.cos(a),y+r*.88*np.sin(a),h+.55),(.36,.36,.55),'stone')
 for z in [1.4,2.8]: box((x,y-r-.01,z),(.19,.08,.65),'dark')
def house(x,y,w,d,h,rc='blue'):
 box((x,y,.24+h/2),(w,d,h),'cream'); roof(x,y,.24+h,w+.4,d+.4,h*.55,rc)
 for xx in [-w/2+.12,w/2-.12]: box((x+xx,y-d/2-.03,.24+h/2),(.17,.12,h),'wood')
 box((x,y-d/2-.04,.24+h*.48),(w,.12,.16),'wood'); box((x,y-d/2-.08,.24+.65),(.7,.15,1.3),'wood')
 for xx in [-w*.3,w*.3]: box((x+xx,y-d/2-.08,.24+h*.72),(.43,.13,.5),'dark')
def wall(x,y,w):
 box((x,y,1.45),(w,.75,2.4),'stone'); box((x,y,2.72),(w,.95,.22),'dark')
 for xx in np.arange(-w/2+.25,w/2,.7): box((x+xx,y,3),(.4,.75,.48),'stone')
ids=['castillo','muralla','torre','cuartel','herreria','mercado','vivienda','granja','torre_magica','establo','templo','aserradero']; report={}
for k in ids:
 s=t.Scene()
 if k=='castillo':
  base(8,7); house(0,.7,3.6,3.3,4); wall(0,2.7,6); wall(-2,-2.7,2); wall(2,-2.7,2)
  for x in [-3,3]:
   for y in [-2.5,2.5]: tower(x,y,.85,4.4)
  box((0,-2.7,2.7),(2,.8,.55),'stone'); box((0,-2.7,1.25),(1.7,.22,2),'wood')
 elif k=='muralla': base(5,1.5); wall(0,0,5)
 elif k=='torre': base(3,3); tower(0,0,1,4,False)
 elif k=='cuartel': base(6,4); house(0,0,5,3,2.6); box((0,-1.8,2.4),(1.2,.12,.65),'blue'); box((0,-1.88,2.4),(.15,.05,.55),'gold')
 elif k=='herreria': base(5,4); house(-.6,.3,2.7,2.8,2.3,'dark'); box((.1,.8,3.5),(.7,.7,2),'stone'); box((1.4,-.5,.75),(1.1,.65,.8),'stone'); box((1.4,-.5,1.2),(1.4,.5,.25),'iron')
 elif k=='mercado':
  base(6,4)
  for x in [-1.5,1.5]:
   for a in [-.8,.8]:
    for b in [-.7,.7]: box((x+a,b,1.1),(.13,.13,1.8),'wood')
   roof(x,0,2,2,1.8,.55,'blue' if x<0 else 'red'); box((x,0,.85),(1.6,1.2,.2),'wood')
   for a in [-.5,0,.5]: box((x+a,0,1.08),(.35,.4,.25),'gold')
 elif k=='vivienda': base(3.8,3.8); house(0,0,3,3,2.4)
 elif k=='granja':
  base(7,5); house(-2,0,2.2,3,2,'red'); box((1.5,0,.28),(3.5,4,.12),'soil')
  for x in np.arange(.1,3.1,.45):
   for y in np.arange(-1.7,1.8,.45): cyl((x,y,.56),.07,.48,'gold',5)
 elif k=='torre_magica':
  base(3.5,3.5); tower(0,0,1.1,4.5); m=t.creation.icosphere(subdivisions=0,radius=.55); m.apply_scale([.7,.7,1.5]); add(m,(0,0,7.1),'crystal')
 elif k=='establo':
  base(6,4); house(0,.2,5,3,2.4,'red');
  for x in [-1.5,0,1.5]: box((x,-1.37,.95),(1.05,.13,1.4),'dark'); box((x,-1.48,.65),(1.05,.14,.75),'wood')
 elif k=='templo': base(5,6); house(0,.3,3.7,4,3); tower(0,1.6,.75,4.6); box((0,-1.85,2.6),(.17,.12,1),'gold'); box((0,-1.85,2.8),(.65,.12,.17),'gold')
 elif k=='aserradero':
  base(6,4); house(-1,.4,2.8,2.6,2.1,'red');
  for i in range(3):
   for j in range(2):
    m=t.creation.cylinder(.19,2.4,sections=10); m.apply_transform(t.transformations.rotation_matrix(np.pi/2,[1,0,0])); add(m,(1+i*.43,0,.45+j*.38),'wood')
 # Blender-style Z up to glTF Y up
 s.apply_transform(t.transformations.rotation_matrix(-np.pi/2,[1,0,0])); p=OUT/(k+'.glb'); p.write_bytes(s.export(file_type='glb')); loaded=t.load(p,force='scene'); assert len(loaded.geometry)>0; report[k]={'geometrias':len(loaded.geometry),'triangulos':sum(len(m.faces) for m in loaded.geometry.values()),'bytes':p.stat().st_size}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
