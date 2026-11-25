const assert=require('assert'),vm=require('vm'),fs=require('fs');
const code=fs.readFileSync(__dirname+'/../js/tk-auto-calidad.js','utf8');
function caso(manual,fps){let t=0,calidad='alta',activo=true,avisos=0,clima=0, eventos={};
const window={__tkExtras:{activo:()=>activo,calidad:()=>calidad,pref:()=>({calidadElegida:manual}),ponerCalidad:q=>calidad=q,consejo:()=>avisos++,L:s=>s},TKClima:{cadaFotograma:()=>clima++}};
vm.runInNewContext(code,{window,performance:{now:()=>t*1000},document:{addEventListener:(n,f)=>eventos[n]=f}});
function avanzar(s,f){for(let i=0;i<s*f;i++){t+=1/f;window.TKExtras.cadaFotograma(1/f);}}
avanzar(19,60);assert.equal(window.TKRendimiento.informe().muestras.length,0);avanzar(7,60);assert(window.TKRendimiento.informe().muestras.length>0);
activo=false;avanzar(3,60);activo=true;avanzar(14,fps);assert.equal(calidad,'alta');avanzar(2,fps);assert.equal(calidad,!manual&&fps<24?'baja':'alta');assert.equal(avisos,!manual&&fps<24?1:0);assert(clima>0);eventos.visibilitychange();}
caso(false,15);caso(true,15);caso(false,60);console.log('OK: arranque 20 s, retorno 5 s, calidad manual y clima');
