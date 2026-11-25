import pathlib, math, rig_datos as R
here=pathlib.Path(__file__).resolve().parent
out=here.parent.parent/'juego3d/modelos/bk_civil_v1'; out.mkdir(parents=True,exist_ok=True)
source=(here/'crear_rig_glb.py').read_text()
base="\ndef tri(b, pts, c):\n    u=[pts[1][i]-pts[0][i] for i in range(3)]; v=[pts[2][i]-pts[0][i] for i in range(3)]\n    n=R.norm((u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])); base=len(pos)//3\n    for p in pts:\n        pos.extend(v_gl(p)); nor.extend(v_gl(n)); col.extend([x**2.2 for x in c]+[1]); jnt.extend([idx[b],0,0,0]); pes.extend([1,0,0,0])\n    ind.extend([base,base+1,base+2])\ndef rings(b, rows, c, axis=2, sides=12):\n    # rows: center, two radii; ascending along axis\n    axes=[i for i in range(3) if i!=axis]; loops=[]\n    for center,a,d in rows:\n        loop=[]\n        for k in range(sides):\n            t=2*math.pi*k/sides; p=list(center); p[axes[0]]+=a*math.cos(t); p[axes[1]]+=d*math.sin(t); loop.append(p)\n        loops.append(loop)\n    def face(points):\n        if axis==1: points=points[::-1]\n        tri(b,points,c)\n    for lo,hi in zip(loops,loops[1:]):\n        for k in range(sides):\n            j=(k+1)%sides; face([lo[k],lo[j],hi[j]]); face([lo[k],hi[j],hi[k]])\n    for k in range(1,sides-1):\n        face([loops[0][0],loops[0][k+1],loops[0][k]]); face([loops[-1][0],loops[-1][k],loops[-1][k+1]])\nsteel=(.38,.44,.52); dark=(.17,.22,.30); gold=(.85,.62,.23); blue=(.12,.28,.58); leather=(.24,.14,.09)\ndef z(b,x,y,rows,c): rings(b,[((x,y,h),a,d) for h,a,d in rows],c)\ndef arm(b,rows,c): rings(b,[((x,0,1.38),a,d) for x,a,d in sorted(rows)],c,0)\nz('pelvis',0,0,[(.76,.22,.15),(.96,.17,.12),(1.01,.16,.12)],cloth)\nz('pelvis',0,0,[(.94,.18,.135),(.99,.18,.135)],leather)\nz('spine',0,0,[(.98,.16,.12),(1.13,.18,.13)],cloth)\nz('spine.001',0,0,[(1.12,.18,.13),(1.28,.20,.14)],cloth)\nz('chest',0,0,[(1.26,.20,.14),(1.39,.22,.13),(1.46,.10,.09)],cloth)\nz('neck',0,0,[(1.42,.065,.065),(1.55,.065,.065)],skin)\nz('head',0,0,[(1.51,.07,.08),(1.56,.10,.10),(1.69,.11,.11),(1.76,.08,.08),(1.78,.02,.02)],skin)\nz('head',0,.025,[(1.65,.112,.105),(1.75,.115,.11),(1.80,.06,.06)],hair)\nfor x in [-.045,.045]: z('head',x,-.102,[(1.64,.014,.008),(1.655,.014,.008)],dark)\nz('head',0,-.105,[(1.60,.018,.025),(1.65,.012,.016)],skin)\nfor L,sg in [('L',1),('R',-1)]:\n    arm('upper_arm.'+L,[(sg*.18,.10,.10),(sg*.30,.095,.09),(sg*.49,.065,.065)],cloth)\n    arm('forearm.'+L,[(sg*.47,.065,.065),(sg*.55,.07,.07),(sg*.73,.045,.045)],skin)\n    arm('hand.'+L,[(sg*.72,.05,.045),(sg*.86,.05,.04),(sg*.90,.025,.025)],skin)\n    z('thigh.'+L,sg*.11,0,[(.49,.075,.08),(.70,.09,.10),(.91,.10,.11)],pants)\n    z('shin.'+L,sg*.12,0,[(.09,.055,.06),(.35,.075,.08),(.53,.08,.085)],pants)\n    z('foot.'+L,sg*.12,-.075,[(.025,.075,.17),(.09,.075,.16),(.15,.055,.08)],leather)\n"
beam_code='\ndef beam(b,p,q,r,c):\n    d=R.norm(tuple(y-x for x,y in zip(p,q))); ref=(1,0,0) if abs(d[0])<.8 else (0,1,0)\n    u=R.norm((d[1]*ref[2]-d[2]*ref[1],d[2]*ref[0]-d[0]*ref[2],d[0]*ref[1]-d[1]*ref[0])); v=(d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0])\n    loops=[[tuple(o[j]+r*(u[j]*math.cos(k*math.pi/4)+v[j]*math.sin(k*math.pi/4)) for j in range(3)) for k in range(8)] for o in (p,q)]\n    for k in range(8):\n        j=(k+1)%8; tri(b,[loops[0][k],loops[0][j],loops[1][j]],c); tri(b,[loops[0][k],loops[1][j],loops[1][k]],c)\n'
units={'campesino': ((0.42, 0.52, 0.24), 'azada'), 'aldeana': ((0.58, 0.3, 0.36), 'cesta'), 'herrero': ((0.32, 0.32, 0.34), 'martillo'), 'lenador': ((0.45, 0.24, 0.16), 'hacha'), 'minero': ((0.48, 0.43, 0.3), 'pico'), 'comerciante': ((0.48, 0.24, 0.5), 'bolsa'), 'constructor': ((0.65, 0.48, 0.24), 'martillo'), 'pescador': ((0.23, 0.43, 0.52), 'cana'), 'sanador': ((0.72, 0.69, 0.53), 'baston')}
original=R.ANIMACIONES[:]
def pose(**kw):
    p={n:(1,0,0,0) for n,*_ in R.HUESOS}; p.update({'upper_arm.L':R.brazo('L',.15),'upper_arm.R':R.brazo('R',.15),'forearm.L':R.codo('L',.45),'forearm.R':R.codo('R',.45),'pelvis@pos':(0,0,0),'root@pos':(0,0,0)}); p.update(kw); return p
idle=pose(); guard=pose(**{'upper_arm.L':R.brazo('L',.65,1.0),'forearm.L':R.codo('L',1.1),'thigh.L':R.pierna(.15)})

for unit,(color,tool) in units.items():
    equipment=""
    if tool in ('azada','martillo','hacha','pico','cana','baston'):
        top=2.25 if tool in ('cana','baston','azada','pico') else 1.78
        equipment+=f"z('hand.R',-.82,0,[(.65,.022,.022),({top},.022,.022)],leather)\n"
        if tool in ('azada','martillo','hacha','pico'):
            equipment+=f"beam('hand.R',(-.82,-.15,{top}),(-.82,.14,{top}),.055,steel)\n"
            if tool=='hacha': equipment+=f"z('hand.R',-.82,-.13,[({top-.13},.025,.10),({top+.09},.025,.08)],steel)\n"
        if tool=='cana': equipment+="beam('hand.R',(-.82,0,2.25),(-.82,-.45,1.2),.004,gold)\n"
        if tool=='baston': equipment+="z('hand.R',-.82,0,[(2.2,.05,.05),(2.32,.08,.08),(2.42,.01,.01)],(.3,.8,.7))\n"
    else:
        equipment+="z('hand.L',.82,0,[(1.05,.10,.10),(1.25,.15,.14),(1.38,.09,.09)],leather)\n"
    if unit in ('aldeana','sanador'): equipment+="z('pelvis',0,0,[(.53,.25,.18),(.95,.18,.13)],cloth)\n"
    if unit=='herrero': equipment+="z('pelvis',0,-.12,[(.58,.16,.035),(.98,.17,.035)],leather)\n"
    work=pose(**{'upper_arm.R':R.brazo('R',1.1,.3),'forearm.R':R.codo('R',.9),'chest':R.Rx(.12)})
    down=pose(**{'upper_arm.R':R.brazo('R',.55),'forearm.R':R.codo('R',.3),'chest':R.Rx(.25)})
    if tool in ('cesta','bolsa'): work=pose(**{'upper_arm.L':R.brazo('L',.6),'forearm.L':R.codo('L',1.2)}); down=work
    clips=[original[0],original[1],('Reposo',[(1,idle),(25,pose(**{'chest':R.Rx(.025)})),(49,idle)]),('Trabajar',[(1,down),(12,work),(24,down)]),('Transportar',[(1,work),(25,work)]),('Morir',[(1,idle),(24,pose(**{'root':R.Rx(-1.57),'root@pos':(0,0,.15)}))])]
    R.ANIMACIONES=[(n,[(f,{**idle,**p}) for f,p in keys]) for n,keys in clips]
    colors=f'cloth={color!r}; skin=(.72,.49,.34); hair=(.22,.13,.08); pants=(.29,.24,.19)\n'
    script=source[:source.index('for hueso, esq, c in R.cajas():')]+colors+base+beam_code+equipment+source[source.index('nv = len(pos)'):source.index('# además deja listo')]
    script=script.replace('rig_humano.glb','bk_civil_v1/'+unit+'.glb').replace('BK_Maniqui','BK_'+unit).replace('"Maniqui"','"'+unit+'"')
    exec(compile(script,str(here/'crear_rig_glb.py'),'exec'),{'__file__':str(here/'crear_rig_glb.py')})
