import pathlib, sys, math
import rig_datos as R
here=pathlib.Path(__file__).resolve().parent
out=here.parent.parent/'juego3d/modelos/bk_army_v1'; out.mkdir(parents=True,exist_ok=True)
source=(here/'crear_rig_glb.py').read_text()
base="\ndef tri(b, pts, c):\n    u=[pts[1][i]-pts[0][i] for i in range(3)]; v=[pts[2][i]-pts[0][i] for i in range(3)]\n    n=R.norm((u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])); base=len(pos)//3\n    for p in pts:\n        pos.extend(v_gl(p)); nor.extend(v_gl(n)); col.extend([x**2.2 for x in c]+[1]); jnt.extend([idx[b],0,0,0]); pes.extend([1,0,0,0])\n    ind.extend([base,base+1,base+2])\ndef rings(b, rows, c, axis=2, sides=12):\n    # rows: center, two radii; ascending along axis\n    axes=[i for i in range(3) if i!=axis]; loops=[]\n    for center,a,d in rows:\n        loop=[]\n        for k in range(sides):\n            t=2*math.pi*k/sides; p=list(center); p[axes[0]]+=a*math.cos(t); p[axes[1]]+=d*math.sin(t); loop.append(p)\n        loops.append(loop)\n    def face(points):\n        if axis==1: points=points[::-1]\n        tri(b,points,c)\n    for lo,hi in zip(loops,loops[1:]):\n        for k in range(sides):\n            j=(k+1)%sides; face([lo[k],lo[j],hi[j]]); face([lo[k],hi[j],hi[k]])\n    for k in range(1,sides-1):\n        face([loops[0][0],loops[0][k+1],loops[0][k]]); face([loops[-1][0],loops[-1][k],loops[-1][k+1]])\nsteel=(.38,.44,.52); dark=(.17,.22,.30); gold=(.85,.62,.23); blue=(.12,.28,.58); leather=(.24,.14,.09)\ndef z(b,x,y,rows,c): rings(b,[((x,y,h),a,d) for h,a,d in rows],c)\ndef arm(b,rows,c): rings(b,[((x,0,1.38),a,d) for x,a,d in sorted(rows)],c,0)\nz('pelvis',0,0,[(.79,.20,.13),(.96,.17,.12),(1.01,.16,.12)],blue)\nz('pelvis',0,0,[(.94,.18,.135),(.99,.18,.135)],gold)\nz('spine',0,0,[(.98,.16,.12),(1.13,.18,.13)],dark)\nz('spine.001',0,0,[(1.12,.18,.13),(1.28,.22,.15)],steel)\nz('chest',0,0,[(1.26,.22,.15),(1.39,.24,.13),(1.46,.13,.10)],steel)\nz('neck',0,0,[(1.42,.08,.08),(1.55,.08,.08)],dark)\nz('head',0,0,[(1.51,.105,.105),(1.59,.13,.13),(1.72,.13,.13),(1.82,.08,.08),(1.87,.015,.015)],steel)\nz('head',0,-.115,[(1.59,.105,.02),(1.64,.105,.025)],dark)\nz('head',0,-.14,[(1.54,.025,.02),(1.72,.025,.02)],gold)\nfor L,sg in [('L',1),('R',-1)]:\n    arm('upper_arm.'+L,[(sg*.18,.12,.12),(sg*.28,.14,.14),(sg*.38,.095,.09),(sg*.49,.07,.07)],steel)\n    arm('forearm.'+L,[(sg*.47,.075,.075),(sg*.55,.09,.085),(sg*.73,.055,.055)],dark)\n    arm('hand.'+L,[(sg*.72,.06,.05),(sg*.86,.055,.045),(sg*.91,.035,.035)],leather)\n    z('thigh.'+L,sg*.11,0,[(.49,.075,.08),(.70,.09,.10),(.91,.10,.11)],dark)\n    z('shin.'+L,sg*.12,0,[(.09,.055,.06),(.35,.075,.08),(.53,.085,.09)],steel)\n    z('foot.'+L,sg*.12,-.075,[(.025,.075,.17),(.09,.075,.16),(.15,.055,.08)],leather)\n"
sword="z('hand.R',-.82,0,[(1.23,.035,.035),(1.46,.025,.025)],leather)\nz('hand.R',-.82,0,[(1.45,.13,.035),(1.49,.13,.035)],gold)\nz('hand.R',-.82,0,[(1.49,.055,.018),(1.98,.045,.013),(2.09,.001,.001)],steel)\n"
shield="rings('hand.L',[((.82,-.15,1.38),.24,.30),((.82,-.12,1.38),.25,.31),((.82,-.08,1.38),.25,.31)],gold,1,8)\nrings('hand.L',[((.82,-.18,1.38),.21,.27),((.82,-.15,1.38),.23,.29)],blue,1,8)\nrings('hand.L',[((.82,-.22,1.38),.055,.055),((.82,-.18,1.38),.075,.075)],gold,1,12)\n"

extra = {
'espadachin': sword+shield,
'lancero': shield+"""z('hand.R',-.82,0,[(.35,.024,.024),(2.45,.024,.024)],leather)
z('hand.R',-.82,0,[(2.42,.035,.025),(2.55,.075,.025),(2.80,.001,.001)],steel)
""",
'caballero': sword.replace('1.98','2.30').replace('2.09','2.48')+"""
for L,sg in [('L',1),('R',-1)]:
    arm('upper_arm.'+L,[(sg*.17,.14,.15),(sg*.26,.20,.19),(sg*.39,.13,.13)],gold)
    z('shin.'+L,sg*.12,-.06,[(.32,.065,.035),(.49,.10,.05),(.56,.065,.035)],gold)
""",
'arquero': """
# bow limbs and string, attached to left hand
for i in range(12):
    a=-1.25+2.5*i/12; b=-1.25+2.5*(i+1)/12
    p=(.82,-.32+.23*math.cos(a),1.37+.65*math.sin(a)); q=(.82,-.32+.23*math.cos(b),1.37+.65*math.sin(b))
    beam('hand.L',p,q,.026,leather)
beam('hand.L',(.82,-.32+.23*math.cos(1.25),1.37-.65*math.sin(1.25)),(.82,-.32+.23*math.cos(1.25),1.37+.65*math.sin(1.25)),.006,gold)
z('chest',.12,.18,[(.99,.07,.07),(1.58,.085,.08)],leather)
for x in [.08,.12,.16]: z('chest',x,.18,[(1.38,.009,.009),(1.73,.009,.009)],gold)
""",
'mago': """
z('pelvis',0,0,[(.64,.24,.16),(.96,.18,.13)],blue)
z('head',0,0,[(1.55,.15,.14),(1.78,.15,.14),(1.95,.03,.03)],blue)
z('hand.R',-.82,0,[(.25,.028,.028),(2.05,.028,.028)],leather)
z('hand.R',-.82,0,[(2.00,.07,.07),(2.10,.11,.11),(2.27,.07,.07),(2.35,.001,.001)],(.30,.85,1.0))
"""}
beam_code="""
def beam(b,p,q,r,c):
    d=R.norm(tuple(y-x for x,y in zip(p,q))); ref=(1,0,0) if abs(d[0])<.8 else (0,1,0)
    u=R.norm((d[1]*ref[2]-d[2]*ref[1],d[2]*ref[0]-d[0]*ref[2],d[0]*ref[1]-d[1]*ref[0])); v=(d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0])
    loops=[[tuple(o[j]+r*(u[j]*math.cos(k*math.pi/4)+v[j]*math.sin(k*math.pi/4)) for j in range(3)) for k in range(8)] for o in (p,q)]
    for k in range(8):
        j=(k+1)%8; tri(b,[loops[0][k],loops[0][j],loops[1][j]],c); tri(b,[loops[0][k],loops[1][j],loops[1][k]],c)
"""
original=R.ANIMACIONES[:]
def pose(**kw):
    p={n:(1,0,0,0) for n,*_ in R.HUESOS}; p.update({'upper_arm.L':R.brazo('L',.15),'upper_arm.R':R.brazo('R',.15),'forearm.L':R.codo('L',.45),'forearm.R':R.codo('R',.45),'pelvis@pos':(0,0,0),'root@pos':(0,0,0)}); p.update(kw); return p
idle=pose(); guard=pose(**{'upper_arm.L':R.brazo('L',.65,1.0),'forearm.L':R.codo('L',1.1),'thigh.L':R.pierna(.15)})
for unit in extra:
    geom=base
    if unit in ('arquero','mago'):
        geom=geom.replace('steel=(.38,.44,.52)','steel=(.24,.18,.12)' if unit=='arquero' else 'steel=(.16,.30,.55)')
    if unit=='arquero':
        attack=[(1,guard),(12,pose(**{'upper_arm.L':R.de_a((1,0,0),(0,-1,0)),'upper_arm.R':R.brazo('R',.7,.7),'forearm.R':R.codo('R',1.5)})),(18,guard)]
    elif unit=='lancero':
        attack=[(1,guard),(7,pose(**{'upper_arm.R':R.brazo('R',-.45),'forearm.R':R.codo('R',.8)})),(12,pose(**{'upper_arm.R':R.brazo('R',1.3),'forearm.R':R.codo('R',.15),'chest':R.Rx(.18)})),(20,guard)]
    elif unit=='mago':
        attack=[(1,idle),(12,pose(**{'upper_arm.R':R.brazo('R',1.5,.5),'upper_arm.L':R.brazo('L',1.0,.8)})),(25,idle)]
    else: attack=original[2][1]
    clips=[original[0],original[1],('Atacar',attack),('Reposo',[(1,idle),(25,pose(**{'chest':R.Rx(.025)})),(49,idle)]),('Defender',[(1,guard),(25,guard)]),('RecibirDano',[(1,idle),(5,pose(**{'chest':R.Rx(-.25)})),(14,idle)]),('Morir',[(1,idle),(24,pose(**{'root':R.Rx(-1.57),'root@pos':(0,0,.15)}))]),('Victoria',[(1,idle),(15,pose(**{'upper_arm.R':R.brazo('R',2.4,.5)})),(36,idle)])]
    R.ANIMACIONES=[(n,[(f,{**idle,**p}) for f,p in keys]) for n,keys in clips]
    s=source[:source.index('for hueso, esq, c in R.cajas():')]+geom+beam_code+extra[unit]+source[source.index('nv = len(pos)'):source.index('# además deja listo')]
    s=s.replace('rig_humano.glb','bk_army_v1/'+unit+'.glb').replace('BK_Maniqui','BK_'+unit).replace('"Maniqui"','"'+unit+'"')
    # original exporter uses its own directory to resolve output
    exec(compile(s,str(here/'crear_rig_glb.py'),'exec'),{'__file__':str(here/'crear_rig_glb.py')})
