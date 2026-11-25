import pathlib, numpy as np, math, json, struct
from scipy.spatial.transform import Rotation
out=pathlib.Path(__file__).resolve().parent.parent.parent/"juego3d/modelos/bk_heroes_v1"
out.mkdir(parents=True,exist_ok=True)
def write(p,g,b):
 j=json.dumps(g,separators=(',',':')).encode(); j+=b' '*(-len(j)%4); b+=b'\0'*(-len(b)%4); p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b)
def make(kind):
 g={'asset':{'version':'2.0','generator':'BK Cavalry'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':kind,'children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[],'animations':[]}; b=bytearray(); nodes=g['nodes']; bones={}; world={}; pos=[]; nor=[]; colors=[]; joints=[]; weights=[]; inds=[]
 def acc(a,typ,ct,target=None,bounds=False):
  a=np.asarray(a,dtype={5126:'<f4',5123:'<u2'}[ct]); b.extend(b'\0'*(-len(b)%4)); v={'buffer':0,'byteOffset':len(b),'byteLength':a.nbytes}; b.extend(a.tobytes());
  if target:v['target']=target
  g['bufferViews'].append(v); x={'bufferView':len(g['bufferViews'])-1,'componentType':ct,'count':len(a),'type':typ};
  if bounds:x.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
  g['accessors'].append(x); return len(g['accessors'])-1
 def bone(n,p,parent=None):
  p=np.array(p); world[n]=p; i=len(nodes); bones[n]=i; nodes.append({'name':n,'translation':(p-world[parent] if parent else p).tolist()}); nodes[bones[parent] if parent else 0].setdefault('children',[]).append(i)
 bone('root',(0,0,0)); bone('body',(0,1.1,0),'root'); bone('neck',(0,1.3,.65),'body'); bone('head',(0,1.85,1.15),'neck'); bone('jaw',(0,1.76,1.35),'head'); bone('tail',(0,1.1,-.7),'body'); bone('tail_tip',(0,.85,-1.5),'tail')
 for side,sg in [('L',1),('R',-1)]:
  bone('wing.'+side,(sg*.35,1.35,0),'body'); bone('wing_tip.'+side,(sg*1.35,1.8,-.1),'wing.'+side)
  for leg,z in [('front',.55),('hind',-.55)]:
   n=leg+'.'+side; bone(n,(sg*.38,1.05,z),'body'); bone(n+'_foot',(sg*.5,.3,z),n)
 def ell(n,c,r,col,rot=0):
  # faceted ellipsoid with nondegenerate poles
  c=np.array(c); r=np.array(r); R=Rotation.from_euler('x',rot).as_matrix(); rings=[]; sides=12
  for j in range(1,8):
   t=math.pi*j/8; rings.append([c+R@(r*np.array([math.sin(t)*math.cos(k*2*math.pi/sides),math.cos(t),math.sin(t)*math.sin(k*2*math.pi/sides)])) for k in range(sides)])
  top=c+R@(r*np.array([0,1,0])); bot=c-R@(r*np.array([0,1,0])); tris=[]
  for k in range(sides):
   l=(k+1)%sides; tris.extend([(top,rings[0][k],rings[0][l]),(bot,rings[-1][l],rings[-1][k])]);
   for a,d in zip(rings,rings[1:]):tris.extend([(a[k],d[k],d[l]),(a[k],d[l],a[l])])
  for t in tris:
   a,d,e=t; v=np.cross(d-a,e-a); v/=np.linalg.norm(v)
   if np.dot(v,(a+d+e)/3-c)<0:d,e=e,d;v=-v
   for p in (a,d,e):inds.append(len(pos));pos.append(p);nor.append(v);colors.append([q**2.2 for q in col]+[1]);joints.append([list(bones).index(n),0,0,0]);weights.append([1,0,0,0])
 red=(.58,.12,.08); dark=(.25,.055,.04); gold=(.85,.58,.23)
 ell('body',(0,1.1,0),(.48,.49,.95),red);ell('neck',(0,1.57,.88),(.26,.55,.30),red,.55);ell('head',(0,1.86,1.35),(.30,.28,.43),red);ell('jaw',(0,1.71,1.52),(.25,.10,.33),dark);ell('tail',(0,.95,-1.15),(.22,.22,.62),red);ell('tail_tip',(0,.78,-1.83),(.10,.12,.48),dark)
 for side,sg in [('L',1),('R',-1)]:
  ell('head',(sg*.25,1.94,1.49),(.055,.06,.065),gold);ell('head',(sg*.19,2.09,1.17),(.075,.24,.08),gold,-.3)
  for leg,z in [('front',.55),('hind',-.55)]:
   n=leg+'.'+side;ell(n,(sg*.46,.72,z),(.19,.40,.22),red);ell(n+'_foot',(sg*.50,.18,z+.12),(.16,.16,.27),dark)
  for n,pts in [('wing.'+side,[(sg*.35,1.35,0),(sg*1.35,1.8,-.1),(sg*.45,1.25,-.95)]),('wing_tip.'+side,[(sg*1.35,1.8,-.1),(sg*2.5,1.45,-.65),(sg*.45,1.25,-.95)])]:
   for tri in [pts,pts[::-1]]:
    a,d,e=map(np.array,tri); v=np.cross(d-a,e-a);v/=np.linalg.norm(v)
    for pt in (a,d,e):inds.append(len(pos));pos.append(pt);nor.append(v);colors.append([.30,.035,.025,1]);joints.append([list(bones).index(n),0,0,0]);weights.append([1,0,0,0])
  ell('wing.'+side,(sg*.85,1.57,-.05),(.58,.075,.075),red);ell('wing_tip.'+side,(sg*1.85,1.64,-.35),(.62,.06,.08),red)
 ib=[]
 for p in world.values():m=np.eye(4);m[:3,3]=-p;ib.append(m.T.flatten())
 g['skins']=[{'joints':list(bones.values()),'skeleton':1,'inverseBindMatrices':acc(ib,'MAT4',5126)}]; attrs={k:acc(a,t,ct,34962,k=='POSITION') for k,a,t,ct in [('POSITION',pos,'VEC3',5126),('NORMAL',nor,'VEC3',5126),('COLOR_0',colors,'VEC4',5126),('JOINTS_0',joints,'VEC4',5123),('WEIGHTS_0',weights,'VEC4',5126)]};g['materials']=[{'name':'Dragon','pbrMetallicRoughness':{'metallicFactor':0,'roughnessFactor':.85}}];g['meshes']=[{'primitives':[{'attributes':attrs,'indices':acc(inds,'SCALAR',5123,34963),'material':0}]}];nodes[0]['children'].append(len(nodes));nodes.append({'mesh':0,'skin':0})
 for name,dur in [('Reposo',2),('Caminar',1.2),('Volar',1),('Atacar',1),('Morir',1.5)]:
  times=np.linspace(0,dur,25);ti=acc(times,'SCALAR',5126,bounds=True);channels=[];samplers=[]
  for n,i in bones.items():
   vals=[]
   for t in times:
    u=t/dur; phase=2*math.pi*u;x=y=z=0
    if n.startswith('wing'):z=(1 if n.endswith('.L') else -1)*(.65 if name=='Volar' else .08)*math.sin(phase)
    if n.startswith(('front','hind')) and name=='Caminar':x=.3*math.sin(phase+(math.pi if n.endswith('.R') else 0))
    if n.startswith('tail'):y=.2*math.sin(phase)
    if n=='jaw' and name=='Atacar':x=.5*math.sin(math.pi*u)
    if n=='root' and name=='Morir':z=1.5*u
    vals.append(Rotation.from_euler('xyz',[x,y,z]).as_quat())
   samplers.append({'input':ti,'output':acc(vals,'VEC4',5126),'interpolation':'LINEAR'});channels.append({'sampler':len(samplers)-1,'target':{'node':i,'path':'rotation'}})
  g['animations'].append({'name':name,'channels':channels,'samplers':samplers})
 g['buffers']=[{'byteLength':len(b)}];write(out/'dragon.glb',g,b)
make('dragon')
