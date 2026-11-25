import json,struct,math,zipfile,sys
from pathlib import Path

def enhance(raw):
 n=struct.unpack_from('<I',raw,12)[0]; d=json.loads(raw[20:20+n]); b=bytearray(raw[28+n:]); names={x.get('name'):i for i,x in enumerate(d['nodes'])}
 if not all(k in names for k in ('pelvis','thigh.L','shin.R','upper_arm.L')): return None
 def acc(rows):
  while len(b)%4:b.append(0)
  offset=len(b); flat=[v for r in rows for v in r]; b.extend(struct.pack('<%sf'%len(flat),*flat)); d['bufferViews'].append(dict(buffer=0,byteOffset=offset,byteLength=len(b)-offset)); a=dict(bufferView=len(d['bufferViews'])-1,componentType=5126,count=len(rows),type={1:'SCALAR',3:'VEC3',4:'VEC4'}[len(rows[0])]);
  if len(rows[0])==1:a.update(min=[min(flat)],max=[max(flat)])
  d['accessors'].append(a);return len(d['accessors'])-1
 def quat(x,y,z):
  a,c,e=[math.cos(v/2) for v in (x,y,z)]; h,i,j=[math.sin(v/2) for v in (x,y,z)];return (h*c*e-a*i*j,a*i*e+h*c*j,a*c*j-h*i*e,a*c*e+h*i*j)
 for mode,dur in [('Reposo',2),('Caminar',1),('Correr',.65)]:
  count=round(dur*30)+1; times=[(dur*k/(count-1),) for k in range(count)]; t=acc(times); tracks={}
  for k in range(count):
   p=2*math.pi*k/(count-1); run=mode=='Correr'; moving=mode!='Reposo'; amp=(.65 if run else .36) if moving else 0; pose={}
   for side,s in [('L',1),('R',-1)]:
    q=p+(0 if s==1 else math.pi); swing=math.sin(q); knee=max(0,-swing)*(.95 if run else .55) if moving else .06
    pose['thigh.'+side]=quat(amp*swing-.05,0,0);pose['shin.'+side]=quat(knee,0,0);pose['foot.'+side]=quat(-amp*swing-knee*.65,0,0);pose['upper_arm.'+side]=quat(-amp*swing*.55,0,-s*1.30);pose['forearm.'+side]=quat(0,-s*(.65 if run else .25),0)
   pose['chest']=quat(.13 if run else .025,.08*math.sin(p) if moving else 0,.025*math.cos(p));pose['head']=quat(-.07 if run else 0,0,0)
   for key,val in pose.items():tracks.setdefault((key,'rotation'),[]).append(val)
   base=d['nodes'][names['pelvis']]['translation'];tracks.setdefault(('pelvis','translation'),[]).append((base[0]+(.018*math.sin(p) if moving else 0),base[1]+(.035 if run else .018)*(1-math.cos(2*p)) if moving else base[1]+.006*math.sin(p),base[2]))
  a={'name':'BK_'+mode+'_v2','channels':[],'samplers':[]}
  for (key,path),rows in tracks.items():
   if key not in names:continue
   a['channels'].append(dict(sampler=len(a['samplers']),target=dict(node=names[key],path=path)));a['samplers'].append(dict(input=t,output=acc(rows),interpolation='LINEAR'))
  d['animations'].append(a)
 d['buffers'][0]['byteLength']=len(b); j=json.dumps(d,separators=(',',':')).encode();j+=b' '*(-len(j)%4);b+=b'\0'*(-len(b)%4);return struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b
if __name__=='__main__':
 src,out=sys.argv[1:3]; count=0
 with zipfile.ZipFile(src) as z,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as w:
  for p in z.namelist():
   if not p.endswith('.glb'):continue
   raw=enhance(z.read(p))
   if raw:
    assert struct.unpack_from('<I',raw,8)[0]==len(raw); w.writestr(p.replace('/modelos/','/modelos/bk_anim_v2/'),raw);count+=1
  w.write(__file__,'generar.py');w.writestr('LEEME_CLAUDE.txt',f'{count} modelos humanoides alternativos. Conservan clips originales y añaden BK_Reposo_v2, BK_Caminar_v2, BK_Correr_v2. Probar con AnimationMixer y crossFadeTo; clips en sitio, velocidad de desplazamiento controlada por juego. No reemplazar originales automáticamente. Respetar AGENTS.md y CLAUDE.md; ejecutar node juego3d/pruebas/revisar.js antes de publicar. Sin pruebas visuales, sin IK, sin cambios en ataques o caballería.');print(count)
