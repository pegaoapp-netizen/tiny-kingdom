from pathlib import Path
import numpy as np, trimesh as t, json
OUT=Path(__file__).resolve().parents[2]/'juego3d/modelos/bk_world_v1'; OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(42)
colors={'grass':'668447','leaf':'315c38','light':'78934a','wood':'765038','stone':'777c83','dark':'414952','water':'438ba5','sand':'b9a47c','gold':'d4a443','iron':'9babb5','flower':'dca6bf'}
def mesh(m,c,p=(0,0,0),scale=(1,1,1)):
 m.apply_scale(scale); m.apply_translation(p); m.visual.face_colors=tuple(bytes.fromhex(colors.get(c,c)))+(255,); parts.append(m)
def box(p,s,c): mesh(t.creation.box(),c,p,s)
def rock(p,s,c='stone'): mesh(t.creation.icosphere(subdivisions=1),c,p,s)
def cone(p,r,h,c):
 m=t.creation.cone(r,h,sections=9); m.apply_transform(t.transformations.rotation_matrix(-np.pi/2,[1,0,0])); mesh(m,c,p)
def trunk(x,z,h,r=.16):
 m=t.creation.cylinder(r,h,sections=9); m.apply_transform(t.transformations.rotation_matrix(-np.pi/2,[1,0,0])); mesh(m,'wood',(x,h/2,z))
def pine(x,z,h):
 trunk(x,z,h,.12*h); 
 for y,r in [(0.28,.36),(.49,.29),(.68,.21)]: cone((x,h*y,z),h*r,h*.42,'leaf' if y<.6 else 'light')
def oak(x,z,h):
 trunk(x,z,h*.78,.12*h)
 for dx,dz,dy in [(0,0,0),(.22,0,-.13),(-.2,.1,-.12),(0,-.22,-.12)]: rock((x+dx*h,h*(.8+dy),z+dz*h),(h*.29,h*.28,h*.29),'leaf' if dx else 'light')
def terrain():
 n=25; v=[]; f=[]
 for z in np.linspace(-6,6,n):
  for x in np.linspace(-6,6,n): v.append([x,.65*np.sin(x*.5)*np.cos(z*.4)+.7,z])
 for j in range(n-1):
  for i in range(n-1):
   a=j*n+i; f.extend([[a,a+n,a+1],[a+1,a+n,a+n+1]])
 mesh(t.Trimesh(v,f,process=False),'grass')
def build(k):
 if k=='terreno': terrain()
 elif k=='roble': oak(0,0,3.8)
 elif k=='pino': pine(0,0,4.4)
 elif k=='bosque':
  for x,z in [(-2,-2),(2,-2),(0,0),(-2,2),(2,2)]: (pine if x else oak)(x,z,float(rng.uniform(3,4.5)))
 elif k=='montana':
  for x,z,h in [(-2,0,3),(0,0,6),(2,1,4)]:
   cone((x,0,z),h*.65,h,'stone'); cone((x,h*.72,z),h*.18,h*.28,'d8e3e7')
 elif k=='rocas':
  for x,z,s in [(-.8,0,.8),(.5,.2,1),(.1,-.7,.5)]: rock((x,s*.5,z),(s,s*.7,s*.8))
 elif k in ['oro','hierro']:
  for x,z in [(-.7,0),(.6,.2),(0,-.5)]:
   rock((x,.5,z),(.8,.65,.7),'dark'); rock((x,.94,z),(.34,.25,.38),'gold' if k=='oro' else 'iron')
 elif k=='rio':
  box((0,.02,0),(3,.04,12),'water');
  for x in [-1.8,1.8]: box((x,.12,0),(.6,.24,12),'sand')
 elif k=='lago':
  m=t.creation.cylinder(3,.08,sections=32); m.apply_transform(t.transformations.rotation_matrix(-np.pi/2,[1,0,0])); mesh(m,'water',(0,.04,0),(1,1,.72))
 elif k=='camino': box((0,.035,0),(2,.07,6),'sand')
 elif k=='puente':
  for z in np.linspace(-2.5,2.5,15): box((0,.55,z),(2.2,.18,.34),'wood')
  for x in [-1.05,1.05]:
   box((x,1.15,0),(.12,.15,5.4),'wood')
   for z in [-2.5,0,2.5]: box((x,.65,z),(.2,1.3,.2),'wood')
 elif k=='ruinas':
  for x in [-1.5,1.5]:
   for j in range(4):
    for z in [-1,0,1]:
     if j<2 or rng.random()>.45: box((x,.22+j*.44,z),(.55,.42,.95),'stone')
 elif k=='cueva':
  for a in np.linspace(0,np.pi,9): rock((2*np.cos(a),max(.4,2*np.sin(a)),0),(.85,.85,1.1),'stone')
  box((0,1,-.85),(2.6,2,.25),'dark')
 elif k=='arbustos':
  for x,z in [(-.5,0),(.5,0),(0,.5)]: rock((x,.45,z),(.65,.55,.65),'leaf')
 elif k=='flores':
  for i in range(14):
   x,z=rng.uniform(-.8,.8,2); trunk(x,z,.24,.025); rock((x,.27,z),(.11,.07,.11),'flower' if i%2 else 'gold')
 elif k=='setas':
  for x,z,h in [(-.3,0,.4),(.3,.1,.3),(0,-.4,.22)]:
   trunk(x,z,h,.07); rock((x,h,z),(.22,.12,.22),'a94a38')
keys='terreno roble pino bosque montana rocas oro hierro rio lago camino puente ruinas cueva arbustos flores setas'.split(); manifest=[]
for k in keys:
 parts=[]; build(k); m=t.util.concatenate(parts); path=OUT/(k+'.glb'); path.write_bytes(m.export(file_type='glb')); check=t.load(path,force='scene'); assert len(check.geometry)>0; manifest.append({'id':k,'file':path.name,'triangles':len(m.faces),'bounds':m.bounds.tolist()})
(OUT/'manifest.json').write_text(json.dumps({'axis':'Y-up','units':'meters','assets':manifest},indent=2))
