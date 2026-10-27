// Revisión antes de mandar a Codemagic (cada build de Mac cuesta dinero).
// Uso:  cd app  &&  npm run revisar
// Revisa en tu computadora todo lo que se puede revisar sin una Mac.
const fs = require('fs'), path = require('path'), cp = require('child_process');

const raiz = path.join(__dirname, '..', '..');
const app = path.join(raiz, 'app');
const juego = path.join(raiz, 'juego3d');
let fallos = 0, avisos = 0;
const ok = m => console.log('  ✅ ' + m);
const mal = m => { fallos++; console.log('  ❌ ' + m); };
const ojo = m => { avisos++; console.log('  ⚠️  ' + m); };
const leer = f => fs.readFileSync(f, 'utf8');
const correr = (cmd, dir) => cp.execSync(cmd, { cwd: dir || raiz, stdio: 'pipe', encoding: 'utf8' });

console.log('\n1) Archivo de Codemagic');
const yaml = leer(path.join(raiz, 'codemagic.yaml'));
if (/\t/.test(yaml)) mal('codemagic.yaml tiene tabulaciones (YAML solo acepta espacios)'); else ok('sin tabulaciones');
const appleId = (yaml.match(/APP_STORE_APPLE_ID:\s*(\d+)/) || [])[1];
if (!appleId || /^0+$/.test(appleId)) mal('Falta el Apple ID de la app (APP_STORE_APPLE_ID)'); else ok('Apple ID de la app: ' + appleId);
const bundleYaml = (yaml.match(/bundle_identifier:\s*(\S+)/) || [])[1];
if (/triggering:/.test(yaml)) ojo('codemagic.yaml tiene "triggering": compilará solo en cada push y gastará minutos');
else ok('solo compila cuando tú lo lanzas (no hay compilación automática)');
const minutos = +(yaml.match(/max_build_duration:\s*(\d+)/) || [])[1];
if (!minutos || minutos > 45) ojo('max_build_duration es ' + (minutos || 'sin poner') + ' min; mejor 45 o menos');
else ok('tope de tiempo por build: ' + minutos + ' min');

console.log('\n2) Identidad de la app (debe ser la misma en todos lados)');
const cap = JSON.parse(leer(path.join(app, 'capacitor.config.json')));
const pbx = leer(path.join(app, 'ios/App/App.xcodeproj/project.pbxproj'));
const bundlesXcode = [...new Set([...pbx.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map(m => m[1]))];
if (bundleYaml === cap.appId && bundlesXcode.length === 1 && bundlesXcode[0] === cap.appId) ok('bundle id: ' + cap.appId);
else mal('bundle id distinto: yaml=' + bundleYaml + ' capacitor=' + cap.appId + ' xcode=' + bundlesXcode.join(','));
const esquema = path.join(app, 'ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme');
if (fs.existsSync(esquema)) ok('esquema "App" compartido para Xcode'); else mal('falta el esquema compartido App.xcscheme');
const plist = leer(path.join(app, 'ios/App/App/Info.plist'));
if (/ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(plist)) ok('Info.plist: sin cifrado especial (no pide papeles a Apple)');
else ojo('Info.plist no dice ITSAppUsesNonExemptEncryption = false');

console.log('\n3) El juego');
let malos = 0;
const revisarJs = dir => {
  for (const n of fs.readdirSync(dir)) {
    const f = path.join(dir, n);
    if (fs.statSync(f).isDirectory()) { if (!/^(nube|node_modules|\.)/.test(n)) revisarJs(f); continue; }
    if (!n.endsWith('.js')) continue;
    try { correr('node --check "' + f + '"'); } catch (e) { malos++; mal('error de código en ' + path.relative(raiz, f) + '\n' + (e.stderr || '').split('\n').slice(0, 5).join('\n')); }
  }
};
revisarJs(juego);
if (!malos) ok('todos los .js del juego se leen sin errores');
const html = leer(path.join(juego, 'index.html'));
const faltan = [...html.matchAll(/(?:src|href)="([^"#:?]+)"/g)].map(m => m[1]).filter(r => !fs.existsSync(path.join(juego, r)));
if (faltan.length) mal('index.html pide archivos que no existen: ' + faltan.join(', ')); else ok('index.html encuentra todos sus archivos');
const vJuego = (leer(path.join(juego, 'js/datos.js')).match(/VERSION_JUEGO\s*=\s*'([^']+)'/) || [])[1];
const vSw = (leer(path.join(juego, 'sw.js')).match(/tinykingdom-v([\d.]+)/) || [])[1];
if (vJuego && vJuego === vSw) ok('versión ' + vJuego + ' (juego y sw.js iguales)'); else ojo('versión distinta: datos.js=' + vJuego + ' sw.js=' + vSw);

console.log('\n4) Preparar la app como lo hará Codemagic');
try { correr('npm ci --no-audit --no-fund', app); ok('npm ci (dependencias exactas del package-lock)'); }
catch (e) { mal('npm ci falló: el package-lock.json no cuadra con package.json\n' + (e.stderr || '').slice(0, 400)); }
try { correr('node scripts/copiar-web.js', app); ok('juego copiado a www'); } catch (e) { mal('copiar-web falló'); }
try { correr('npx cap copy ios', app); ok('Capacitor copió el juego dentro del proyecto de iPhone'); }
catch (e) { mal('npx cap copy ios falló\n' + ((e.stdout || '') + (e.stderr || '')).slice(0, 600)); }

console.log('\n5) GitHub (Codemagic compila lo que está en GitHub, no lo de tu computadora)');
try {
  correr('git fetch -q origin');
  const cambios = correr('git status --porcelain').trim();
  const local = correr('git rev-parse HEAD').trim(), remoto = correr('git rev-parse origin/main').trim();
  if (cambios) ojo('hay cambios sin guardar en git: Codemagic no los verá');
  if (local !== remoto) mal('tu último commit no está subido a GitHub (falta git push)');
  else ok('GitHub tiene tu último commit ' + local.slice(0, 7));
} catch (e) { ojo('no pude revisar GitHub: ' + (e.message || '').slice(0, 120)); }

console.log('\n' + (fallos ? '❌ ' + fallos + ' problema(s): arréglalos antes de lanzar Codemagic.' :
  '✅ Todo listo para Codemagic' + (avisos ? ' (' + avisos + ' aviso(s), léelos).' : '.')));
console.log('   Lo único que no se puede probar aquí: la firma y la compilación en Mac.\n');
process.exit(fallos ? 1 : 0);
