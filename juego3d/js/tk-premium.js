/* v9.91 · GRÁFICOS PREMIUM de Brother Kingdom (Claude)
   Capa visual aparte: NO toca reglas, economía, combate, guardado ni progreso. Solo lee lo que da juego.js (__tkExtras.ciudad).
   - Motor: post-proceso propio sobre Three.js r149 (oclusión ambiental SSAO, resplandor HDR, luz volumétrica con las sombras reales del sol,
     sombras de nubes que se mueven, neblina baja, gradación de color, viñeta y suavizado FXAA), reflejos del cielo (PMREM) en los modelos 3D,
     agua con reflejo Fresnel y destellos de sol, detalle de material en piedra y césped, viento en hojas.
   - Ciudad viva: soldados patrullando la muralla, comerciantes con caballo y carro, bandadas de pájaros, fuente con chorros de agua,
     hierba, flores y rocas que se mecen con el viento, ciclo de día y noche real, tormentas con relámpagos cuando llueve.
   - Castillo: estandartes con escudo de armas, estandarte real en lo alto y braseros con fuego, según el nivel del castillo.
   - Cámara: acercamiento mayor, enfoque de cine al elegir un edificio y modo cine (sin interfaz, giro lento y franjas de cine).
   - Efectos: columna de luz, onda y chispas al subir de nivel; polvo y chispas al terminar una obra; fuegos artificiales al subir el castillo;
     rayos dorados y confeti en las recompensas.
   - Calidad: Baja (sin post-proceso), Media, Alta y Ultra. Baja la calidad sola si el teléfono va lento (salvo que la elijas tú).
   Para probar sin esta capa: ?sinPremium=1. Estado: TKPremium.estado(). */
(function () {
  'use strict';
  if (/[?&]sinPremium=1(?:&|$)/.test(location.search) || !window.THREE) return;
  var T3 = THREE, X = function () { return window.__tkExtras; }, C = function () { var x = X(); return x && x.ciudad; };
  var CLAVE = 'tk_premium';
  var NIVELES = {
    baja: { post: false, ao: 0, bloom: 0, vol: 0, nubes: 0, deco: 0, aves: 0, patrulla: 2, carros: 1, part: 250, zoom: 0.4, env: 0.25 },
    media: { post: true, ao: 0, bloom: 1, vol: 0, nubes: 1, deco: 0.45, aves: 8, patrulla: 4, carros: 2, part: 600, zoom: 0.3, env: 0.4 },
    alta: { post: true, ao: 8, bloom: 2, vol: 8, nubes: 1, deco: 0.8, aves: 14, patrulla: 8, carros: 3, part: 1100, zoom: 0.26, env: 0.5 },
    ultra: { post: true, ao: 14, bloom: 2, vol: 16, nubes: 1, deco: 1.25, aves: 22, patrulla: 12, carros: 4, part: 1800, zoom: 0.22, env: 0.6 }
  };
  var ORDEN = ['baja', 'media', 'alta', 'ultra'];
  var pref = (function () { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } })();
  function guardarPref() { try { localStorage.setItem(CLAVE, JSON.stringify(pref)); } catch (e) {} }
  var ES_MOVIL = /iP(hone|ad|od)|Android/.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var nivel = NIVELES[pref.nivel] ? pref.nivel : null;
  var listo = false, falloPost = false, tiempo = 0, quieto = false;
  try { quieto = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function N() { return NIVELES[nivel || 'alta']; }
  function L(es, en) { var x = X(); return x && x.L ? x.L(es, en) : es; }

  // ======================================================================
  //  1. POST-PROCESO
  // ======================================================================
  var VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var PP = null; // { rt..., mats..., quad }
  function crearRT(w, h, tipo, conDepth) {
    var rt = new T3.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { minFilter: T3.LinearFilter, magFilter: T3.LinearFilter, type: tipo || T3.UnsignedByteType, depthBuffer: !!conDepth, stencilBuffer: false });
    if (conDepth) { rt.depthTexture = new T3.DepthTexture(w, h); rt.depthTexture.type = T3.UnsignedIntType; }
    rt.texture.generateMipmaps = false; return rt;
  }
  function mat(frag, uni, defs) { return new T3.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: uni, defines: defs || {}, depthTest: false, depthWrite: false, extensions: { derivatives: true } }); }
  var GL_POS = [
    'uniform mat4 uInvProj; uniform mat4 uInvView;',
    'vec3 posVista(vec2 uv, float d){ vec4 c = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); vec4 v = uInvProj * c; return v.xyz / v.w; }',
    'vec3 posMundo(vec2 uv, float d){ return (uInvView * vec4(posVista(uv, d), 1.0)).xyz; }'
  ].join('\n');
  var GL_RUIDO = [
    'float hs(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm3(vec2 p){ return vn(p) * 0.55 + vn(p * 2.07 + 3.1) * 0.3 + vn(p * 4.3 - 1.7) * 0.15; }'
  ].join('\n');
  // --- SSAO (oclusión ambiental en pantalla, media resolución) ---
  var FRAG_AO = [
    'uniform sampler2D tDepth; uniform mat4 uProj; uniform float uRadio; uniform float uFuerza; varying vec2 vUv;', GL_POS,
    'float hs(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'void main(){',
    '  float d = texture2D(tDepth, vUv).x; if (d >= 0.99999) { gl_FragColor = vec4(1.0); return; }',
    '  vec3 P = posVista(vUv, d); vec3 Nn = normalize(cross(dFdx(P), dFdy(P)));',
    '  vec3 r0 = normalize(vec3(hs(gl_FragCoord.xy) * 2.0 - 1.0, hs(gl_FragCoord.yx + 7.0) * 2.0 - 1.0, 0.3));',
    '  vec3 Tt = normalize(r0 - Nn * dot(r0, Nn)); vec3 Bb = cross(Nn, Tt);',
    '  float occ = 0.0;',
    '  for (int i = 0; i < NS; i++) {',
    '    float fi = (float(i) + 0.5) / float(NS); float a = fi * 37.7; float z = 0.25 + 0.75 * fract(fi * 7.31);',
    '    vec3 h = normalize(Tt * cos(a) * sqrt(1.0 - z * z) + Bb * sin(a) * sqrt(1.0 - z * z) + Nn * z);',
    '    float esc = mix(0.15, 1.0, fi * fi); vec3 S = P + h * uRadio * esc;',
    '    vec4 c = uProj * vec4(S, 1.0); vec2 suv = c.xy / c.w * 0.5 + 0.5;',
    '    float sd = texture2D(tDepth, suv).x; float sz = posVista(suv, sd).z;',
    '    float rango = smoothstep(0.0, 1.0, uRadio / max(0.001, abs(P.z - sz)));',
    '    occ += (sz >= S.z + 0.04 ? 1.0 : 0.0) * rango;',
    '  }',
    '  gl_FragColor = vec4(vec3(clamp(1.0 - occ / float(NS) * uFuerza, 0.0, 1.0)), 1.0);',
    '}'].join('\n');
  // --- brillo: extrae lo que brilla (HDR) ---
  var FRAG_BRILLO = [
    'uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uTexel; uniform float uUmbral; varying vec2 vUv;',
    'void main(){',
    '  vec3 c = vec3(0.0);',
    '  c += texture2D(tColor, vUv + uTexel * vec2(-1.0, -1.0)).rgb; c += texture2D(tColor, vUv + uTexel * vec2(1.0, -1.0)).rgb;',
    '  c += texture2D(tColor, vUv + uTexel * vec2(-1.0, 1.0)).rgb; c += texture2D(tColor, vUv + uTexel * vec2(1.0, 1.0)).rgb; c *= 0.25;',
    '  float cielo = step(0.99999, texture2D(tDepth, vUv).x);',
    '  float l = dot(c, vec3(0.299, 0.587, 0.114)); float k = smoothstep(uUmbral, uUmbral + 0.45, l) * (1.0 - cielo * 0.85);',
    '  gl_FragColor = vec4(c * k, 1.0);',
    '}'].join('\n');
  var FRAG_DESENF = [
    'uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;',
    'void main(){',
    '  vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;',
    '  c += texture2D(tSrc, vUv + uDir * 1.3846).rgb * 0.3162162; c += texture2D(tSrc, vUv - uDir * 1.3846).rgb * 0.3162162;',
    '  c += texture2D(tSrc, vUv + uDir * 3.2307).rgb * 0.0702702; c += texture2D(tSrc, vUv - uDir * 3.2307).rgb * 0.0702702;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'].join('\n');
  // --- luz volumétrica: recorre el rayo de la cámara por el aire bajo y mira el mapa de sombras real del sol ---
  var FRAG_VOL = [
    '#include <packing>',
    'uniform sampler2D tDepth; uniform sampler2D tSombra; uniform mat4 uSombraMat; uniform vec3 uCam; uniform float uAlto; uniform float uT; varying vec2 vUv;', GL_POS,
    'float hs(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'void main(){',
    '  float d = min(texture2D(tDepth, vUv).x, 0.99995); vec3 P = posMundo(vUv, d);',
    '  vec3 dir = P - uCam; float largo = length(dir); dir /= largo;',
    '  float t0 = 0.0, t1 = largo;',
    '  if (abs(dir.y) > 1e-4) { float ta = (uAlto - uCam.y) / dir.y, tb = (0.0 - uCam.y) / dir.y; t0 = max(0.0, min(ta, tb)); t1 = min(largo, max(ta, tb)); }',
    '  if (t1 <= t0) { gl_FragColor = vec4(0.0); return; }',
    '  float paso = (t1 - t0) / float(NV), luz = 0.0, j = hs(gl_FragCoord.xy + fract(uT) * 31.0);',
    '  for (int i = 0; i < NV; i++) {',
    '    vec3 q = uCam + dir * (t0 + paso * (float(i) + j));',
    '    vec4 s = uSombraMat * vec4(q, 1.0); s.xyz /= s.w; float lit = 1.0;',
    '    if (s.x > 0.0 && s.x < 1.0 && s.y > 0.0 && s.y < 1.0 && s.z < 1.0) lit = step(s.z - 0.002, unpackRGBAToDepth(texture2D(tSombra, s.xy)));',
    '    luz += lit * (1.0 - q.y / uAlto);',
    '  }',
    '  gl_FragColor = vec4(vec3(luz / float(NV) * (t1 - t0) / (uAlto * 1.4)), 1.0);',
    '}'].join('\n');
  // --- composición final: AO + nubes + volumétrica + resplandor + tono ACES + color de cine + FXAA ---
  var FRAG_FINAL = [
    'uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tAO; uniform sampler2D tB1; uniform sampler2D tB2; uniform sampler2D tVol;',
    'uniform vec2 uTexel; uniform vec2 uTexelAO; uniform float uExpo; uniform float uAO; uniform float uB1; uniform float uB2; uniform float uVol; uniform vec3 uVolCol;',
    'uniform float uNubes; uniform float uT; uniform float uNiebla; uniform vec3 uNieblaCol; uniform float uSat; uniform float uContraste; uniform float uVin; uniform float uCine; uniform float uFlash;',
    'uniform vec3 uSombraTinte; uniform vec3 uLuzTinte; varying vec2 vUv;', GL_POS, GL_RUIDO,
    'vec3 RRT(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }',
    'vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));',
    '  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));',
    '  c *= uExpo / 0.6; c = I * c; c = RRT(c); c = O * c; return clamp(c, 0.0, 1.0); }',
    'float lu(vec3 c){ return dot(min(c, vec3(1.0)), vec3(0.299, 0.587, 0.114)); }',
    'vec3 fxaa(vec2 uv){',
    '  vec3 cM = texture2D(tColor, uv).rgb;',
    '  vec3 cNW = texture2D(tColor, uv + uTexel * vec2(-1.0, -1.0)).rgb, cNE = texture2D(tColor, uv + uTexel * vec2(1.0, -1.0)).rgb;',
    '  vec3 cSW = texture2D(tColor, uv + uTexel * vec2(-1.0, 1.0)).rgb, cSE = texture2D(tColor, uv + uTexel * vec2(1.0, 1.0)).rgb;',
    '  float lM = lu(cM), lNW = lu(cNW), lNE = lu(cNE), lSW = lu(cSW), lSE = lu(cSE);',
    '  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));',
    '  if (lMax - lMin < max(0.0833, lMax * 0.166)) return cM;',
    '  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));',
    '  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125); float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);',
    '  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * uTexel;',
    '  vec3 a = 0.5 * (texture2D(tColor, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tColor, uv + dir * (2.0 / 3.0 - 0.5)).rgb);',
    '  vec3 b = a * 0.5 + 0.25 * (texture2D(tColor, uv + dir * -0.5).rgb + texture2D(tColor, uv + dir * 0.5).rgb);',
    '  float lB = lu(b); return (lB < lMin || lB > lMax) ? a : b; }',
    'void main(){',
    '  float d = texture2D(tDepth, vUv).x; bool cielo = d >= 0.99999;',
    '  vec3 c = fxaa(vUv);',
    '  if (!cielo) {',
    '    #ifdef CON_AO',
    '    float ao = texture2D(tAO, vUv).r * 0.4 + (texture2D(tAO, vUv + uTexelAO * vec2(1.0, 1.0)).r + texture2D(tAO, vUv + uTexelAO * vec2(-1.0, 1.0)).r + texture2D(tAO, vUv + uTexelAO * vec2(1.0, -1.0)).r + texture2D(tAO, vUv + uTexelAO * vec2(-1.0, -1.0)).r) * 0.15;',
    '    c *= mix(1.0, ao, uAO);',
    '    #endif',
    '    vec3 W = posMundo(vUv, d);',
    '    if (uNubes > 0.001) { float n = fbm3(W.xz * 0.016 + vec2(uT * 0.011, uT * 0.006)); c *= 1.0 - smoothstep(0.5, 0.72, n) * uNubes; }',
    '    if (uNiebla > 0.001) { float hN = exp(-max(W.y, 0.0) * 0.55) * (0.7 + 0.3 * vn(W.xz * 0.05 + uT * 0.02)); c = mix(c, uNieblaCol, clamp(hN * uNiebla, 0.0, 0.6)); }',
    '  }',
    '  #ifdef CON_VOL',
    '  c += uVolCol * texture2D(tVol, vUv).r * uVol;',
    '  #endif',
    '  #ifdef CON_BLOOM',
    '  c += texture2D(tB1, vUv).rgb * uB1 + texture2D(tB2, vUv).rgb * uB2;',
    '  #endif',
    '  if (!cielo) c = aces(c); else c = clamp(c, 0.0, 1.0);',
    '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '  c = mix(vec3(l), c, uSat);',
    '  c = clamp((c - 0.5) * uContraste + 0.5, 0.0, 1.0);',
    '  c *= mix(uSombraTinte, uLuzTinte, smoothstep(0.15, 0.85, l));',
    '  vec2 q = vUv - 0.5; float vin = 1.0 - dot(q, q) * uVin * 1.6; c *= clamp(vin, 0.0, 1.0);',
    '  if (uCine > 0.001) { float bar = step(abs(q.y), 0.5 - 0.06 * uCine); c *= bar; }',
    '  c += vec3(uFlash);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'].join('\n');

  var VOL_CAP = { volCol: new T3.Color(1, 0.85, 0.6) };
  var FX_POST = { flash: 0, cine: 0, cineMeta: 0, tormenta: 0 };
  function crearPost(r) {
    var tipoHDR = T3.UnsignedByteType;
    try { if (r.capabilities.isWebGL2 && (r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float'))) tipoHDR = T3.HalfFloatType; } catch (e) {}
    var cam = new T3.OrthographicCamera(-1, 1, 1, -1, 0, 1), esc = new T3.Scene(), quad = new T3.Mesh(new T3.PlaneGeometry(2, 2), null);
    quad.frustumCulled = false; esc.add(quad);
    PP = { r: r, cam: cam, esc: esc, quad: quad, tipo: tipoHDR, w: 0, h: 0, clave: '' };
    PP.uPos = { uInvProj: { value: new T3.Matrix4() }, uInvView: { value: new T3.Matrix4() } };
  }
  function prepararPost(w, h) {
    var n = N(), clave = w + 'x' + h + ':' + nivel;
    if (PP.clave === clave) return;
    ['rt', 'rtAO', 'rtB1', 'rtB2', 'rtC1', 'rtC2', 'rtV'].forEach(function (k) { if (PP[k]) { PP[k].dispose(); if (PP[k].depthTexture) PP[k].depthTexture.dispose(); PP[k] = null; } });
    PP.clave = clave; PP.w = w; PP.h = h;
    PP.rt = crearRT(w, h, PP.tipo, true);
    var u = PP.uPos;
    if (n.ao) { PP.rtAO = crearRT(w >> 1, h >> 1); PP.mAO = mat(FRAG_AO, Object.assign({ tDepth: { value: PP.rt.depthTexture }, uProj: { value: new T3.Matrix4() }, uRadio: { value: 1.3 }, uFuerza: { value: 1.25 } }, u), { NS: n.ao }); }
    if (n.bloom) {
      PP.rtB1 = crearRT(w >> 2, h >> 2, PP.tipo); PP.rtB2 = crearRT(w >> 2, h >> 2, PP.tipo);
      PP.mBr = mat(FRAG_BRILLO, { tColor: { value: PP.rt.texture }, tDepth: { value: PP.rt.depthTexture }, uTexel: { value: new T3.Vector2(1 / w, 1 / h) }, uUmbral: { value: 0.8 } });
      PP.mBlur = mat(FRAG_DESENF, { tSrc: { value: null }, uDir: { value: new T3.Vector2() } });
      PP.mCopia = mat(FRAG_DESENF, { tSrc: { value: null }, uDir: { value: new T3.Vector2() } });
      if (n.bloom > 1) { PP.rtC1 = crearRT(w >> 3, h >> 3, PP.tipo); PP.rtC2 = crearRT(w >> 3, h >> 3, PP.tipo); }
    }
    if (n.vol) { PP.rtV = crearRT(w >> 2, h >> 2); PP.mVol = mat(FRAG_VOL, Object.assign({ tDepth: { value: PP.rt.depthTexture }, tSombra: { value: null }, uSombraMat: { value: new T3.Matrix4() }, uCam: { value: new T3.Vector3() }, uAlto: { value: 16 }, uT: { value: 0 } }, u), { NV: n.vol }); }
    var defs = {}; if (n.ao) defs.CON_AO = 1; if (n.bloom) defs.CON_BLOOM = 1; if (n.vol) defs.CON_VOL = 1;
    var neg = PP.rt.texture;
    PP.mFin = mat(FRAG_FINAL, Object.assign({
      tColor: { value: PP.rt.texture }, tDepth: { value: PP.rt.depthTexture }, tAO: { value: PP.rtAO ? PP.rtAO.texture : neg }, tB1: { value: PP.rtB1 ? PP.rtB1.texture : neg }, tB2: { value: PP.rtC1 ? PP.rtC1.texture : (PP.rtB1 ? PP.rtB1.texture : neg) }, tVol: { value: PP.rtV ? PP.rtV.texture : neg },
      uTexel: { value: new T3.Vector2(1 / w, 1 / h) }, uTexelAO: { value: new T3.Vector2(2 / w, 2 / h) }, uExpo: { value: 1.25 }, uAO: { value: 0.75 }, uB1: { value: 0.35 }, uB2: { value: n.bloom > 1 ? 0.3 : 0 }, uVol: { value: 0.3 }, uVolCol: { value: new T3.Color() },
      uNubes: { value: 0 }, uT: { value: 0 }, uNiebla: { value: 0 }, uNieblaCol: { value: new T3.Color(0.8, 0.85, 0.9) }, uSat: { value: 1.08 }, uContraste: { value: 1.06 }, uVin: { value: 0.32 }, uCine: { value: 0 }, uFlash: { value: 0 },
      uSombraTinte: { value: new T3.Color(0.96, 0.98, 1.04) }, uLuzTinte: { value: new T3.Color(1.03, 1.0, 0.96) }
    }, u), defs);
  }
  function pasada(m, destino) { PP.quad.material = m; PP.r.setRenderTarget(destino); PP.r.render(PP.esc, PP.cam); }
  var vTam = null, TONO = { modo: null };
  function devolverTono() { var x = X(); if (x && x.render && TONO.modo !== null) { x.render.toneMapping = TONO.modo; TONO.modo = null; } }
  function dibujar(escena, camara) {
    if (!listo || falloPost || !N().post) return false;
    var r = X() && X().render; if (!r) return false;
    try {
      if (!PP) crearPost(r);
      vTam = vTam || new T3.Vector2(); r.getDrawingBufferSize(vTam);
      prepararPost(vTam.x | 0, vTam.y | 0);
      var n = N(), c = C(), u = PP.uPos;
      camara.updateMatrixWorld(); u.uInvProj.value.copy(camara.projectionMatrixInverse); u.uInvView.value.copy(camara.matrixWorld);
      // r149 aplica el tono ACES en cada material: con post-proceso se apaga ahí y se aplica una sola vez al final (si no, sale dos veces y la imagen se ve lavada)
      if (r.toneMapping !== T3.NoToneMapping) { TONO.modo = r.toneMapping; r.toneMapping = T3.NoToneMapping; }
      r.setRenderTarget(PP.rt); r.render(escena, camara);
      if (n.ao) { PP.mAO.uniforms.uProj.value.copy(camara.projectionMatrix); pasada(PP.mAO, PP.rtAO); }
      if (n.bloom) {
        pasada(PP.mBr, PP.rtB1);
        var b = PP.mBlur.uniforms;
        b.tSrc.value = PP.rtB1.texture; b.uDir.value.set(1 / PP.rtB1.width, 0); pasada(PP.mBlur, PP.rtB2);
        b.tSrc.value = PP.rtB2.texture; b.uDir.value.set(0, 1 / PP.rtB1.height); pasada(PP.mBlur, PP.rtB1);
        if (PP.rtC1) {
          var cp = PP.mCopia.uniforms; cp.tSrc.value = PP.rtB1.texture; cp.uDir.value.set(1 / PP.rtB1.width, 1 / PP.rtB1.height); pasada(PP.mCopia, PP.rtC1);
          b.tSrc.value = PP.rtC1.texture; b.uDir.value.set(1.5 / PP.rtC1.width, 0); pasada(PP.mBlur, PP.rtC2);
          b.tSrc.value = PP.rtC2.texture; b.uDir.value.set(0, 1.5 / PP.rtC1.height); pasada(PP.mBlur, PP.rtC1);
        }
      }
      var sol = c && c.sol, k = c ? c.noche() : 0, dor = c ? c.dorada() : 0;
      if (n.vol && sol && sol.shadow && sol.shadow.map) {
        var v = PP.mVol.uniforms; v.tSombra.value = sol.shadow.map.texture; v.uSombraMat.value.copy(sol.shadow.matrix); v.uCam.value.copy(camara.position); v.uT.value = tiempo;
        pasada(PP.mVol, PP.rtV);
      }
      var f = PP.mFin.uniforms;
      f.uExpo.value = r.toneMappingExposure; f.uT.value = tiempo;
      f.uAO.value = 0.78 - k * 0.25;
      PP.mBr && (PP.mBr.uniforms.uUmbral.value = 1.35 - k * 0.65 - dor * 0.2);
      f.uB1.value = 0.12 + k * 0.42 + dor * 0.12; f.uB2.value = n.bloom > 1 ? 0.1 + k * 0.4 + dor * 0.15 : 0;
      if (sol) f.uVolCol.value.copy(sol.color).multiplyScalar(sol.intensity);
      f.uVol.value = (0.04 + dor * 0.12 + k * 0.04) * (1 - FX_POST.tormenta * 0.6);
      f.uNubes.value = n.nubes ? 0.2 * (1 - k) * (1 - FX_POST.tormenta * 0.5) : 0;
      var fase = c ? c.fase() : 0.3, aurora = Math.max(0, 1 - Math.abs(fase - 0.96) / 0.06), mananaN = Math.max(aurora, k * 0.55);
      f.uNiebla.value = 0.18 * mananaN + 0.22 * FX_POST.tormenta;
      if (escena.fog) f.uNieblaCol.value.copy(escena.fog.color);
      f.uSat.value = 1.1 - k * 0.12 - FX_POST.tormenta * 0.25; f.uContraste.value = 1.07 + dor * 0.04;
      f.uSombraTinte.value.setRGB(0.95 - dor * 0.04, 0.98, 1.05 + k * 0.08); f.uLuzTinte.value.setRGB(1.03 + dor * 0.05, 1.0, 0.96 - dor * 0.05);
      f.uVin.value = 0.3 + FX_POST.cine * 0.25; f.uCine.value = FX_POST.cine; f.uFlash.value = FX_POST.flash;
      if (window.TKPremium && TKPremium._dbg) for (var kd in TKPremium._dbg) if (f[kd]) { if (f[kd].value && f[kd].value.setRGB) f[kd].value.setScalar(TKPremium._dbg[kd]); else f[kd].value = TKPremium._dbg[kd]; }
      pasada(PP.mFin, null);
      return true;
    } catch (e) {
      falloPost = true; console.warn('TKPremium: post-proceso apagado', e); try { r.setRenderTarget(null); devolverTono(); } catch (x) {} return false;
    }
  }

  // ======================================================================
  //  2. MATERIALES: reflejos del cielo, detalle de piedra y césped, viento en hojas, agua con reflejo
  // ======================================================================
  var U = { t: { value: 0 }, viento: { value: 1 }, cieloArr: { value: new T3.Color(0.42, 0.65, 0.85) }, cieloHor: { value: new T3.Color(0.94, 0.89, 0.78) }, solDir: { value: new T3.Vector3(0.25, 0.75, -0.6).normalize() }, solCol: { value: new T3.Color(1, 0.86, 0.68) }, detalle: { value: 1 } };
  var vistos = new WeakSet(), basesEnv = new WeakMap();
  function parcharDetalle(m) {
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uTkpDet = U.detalle;
      sh.vertexShader = 'varying vec3 vTkpW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vec4 tkpP = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n tkpP = instanceMatrix * tkpP;\n#endif\n vTkpW = (modelMatrix * tkpP).xyz;');
      sh.fragmentShader = 'uniform float uTkpDet; varying vec3 vTkpW;\nfloat tkpH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat tkpN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(tkpH(i), tkpH(i + vec3(1,0,0)), f.x), mix(tkpH(i + vec3(0,1,0)), tkpH(i + vec3(1,1,0)), f.x), f.y), mix(mix(tkpH(i + vec3(0,0,1)), tkpH(i + vec3(1,0,1)), f.x), mix(tkpH(i + vec3(0,1,1)), tkpH(i + vec3(1,1,1)), f.x), f.y), f.z); }\n' +
        sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float tkpG = tkpN(vTkpW * 0.9) * 0.55 + tkpN(vTkpW * 3.1 + 7.0) * 0.3 + tkpN(vTkpW * 9.0) * 0.15;\n diffuseColor.rgb *= mix(1.0, 0.9 + tkpG * 0.2, uTkpDet);');
    };
    m.customProgramCacheKey = function () { return 'tkpDet1'; }; m.needsUpdate = true;
  }
  function parcharHoja(m) {
    var antes = m.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) {
      antes.call(this, sh, r);
      sh.uniforms.uTkpT = U.t; sh.uniforms.uTkpV = U.viento;
      sh.vertexShader = 'uniform float uTkpT; uniform float uTkpV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 tkpWP = modelMatrix * vec4(position, 1.0); float tkpA = clamp(position.y * 0.35, 0.0, 1.6) * uTkpV;\n transformed.x += sin(uTkpT * 1.7 + tkpWP.x * 0.31 + tkpWP.z * 0.17) * 0.07 * tkpA + sin(uTkpT * 4.3 + tkpWP.z) * 0.015 * tkpA;\n transformed.z += cos(uTkpT * 1.3 + tkpWP.z * 0.27) * 0.05 * tkpA;');
    };
    m.customProgramCacheKey = function () { return 'hojaReal1tkpV'; }; m.needsUpdate = true;
  }
  function parcharAgua(m) {
    var antes = m.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) {
      antes.call(this, sh, r);
      sh.uniforms.uTkpArr = U.cieloArr; sh.uniforms.uTkpHor = U.cieloHor; sh.uniforms.uTkpSolD = U.solDir; sh.uniforms.uTkpSolC = U.solCol;
      sh.fragmentShader = 'uniform vec3 uTkpArr; uniform vec3 uTkpHor; uniform vec3 uTkpSolD; uniform vec3 uTkpSolC;\n' + sh.fragmentShader.replace('#include <output_fragment>', [
        ' vec3 tkpV = normalize(cameraPosition - vAguaW);',
        ' vec3 tkpNn = normalize(vec3((o1 * 0.22 + o3 * 0.1), 1.0, (o2 * 0.2 - o3 * 0.08)));',
        ' float tkpF = 0.12 + 0.88 * pow(1.0 - max(dot(tkpV, tkpNn), 0.0), 4.0);',
        ' vec3 tkpR = reflect(-tkpV, tkpNn); vec3 tkpCielo = mix(uTkpHor, uTkpArr, clamp(tkpR.y * 1.3, 0.0, 1.0));',
        ' outgoingLight = mix(outgoingLight, tkpCielo * 1.05, clamp(tkpF * 1.6, 0.0, 0.62));',
        ' outgoingLight += uTkpSolC * pow(max(dot(tkpR, uTkpSolD), 0.0), 220.0) * 3.5;',
        // v9.92: reflejo de las antorchas y luces cercanas sobre el agua (rielan con las ondas)
        '#if NUM_POINT_LIGHTS > 0',
        ' vec3 tkpPv = -vViewPosition; vec3 tkpRl = vec3(0.0);',
        ' #pragma unroll_loop_start',
        ' for (int i = 0; i < NUM_POINT_LIGHTS; i ++) {',
        '  { float tkpK = 1.0 - clamp(length(pointLights[ i ].position - tkpPv) / (max(pointLights[ i ].distance, 1.0) * 0.9), 0.0, 1.0); tkpRl += pointLights[ i ].color * tkpK * tkpK; }',
        ' }',
        ' #pragma unroll_loop_end',
        ' outgoingLight += tkpRl * (0.35 + 0.65 * smoothstep(-0.2, 0.9, o2 * 0.6 + o3 * 0.7)) * 0.55;',
        '#endif',
        '#include <output_fragment>'].join('\n'));
    };
    m.customProgramCacheKey = function () { return 'aguaTkp2'; }; m.needsUpdate = true;
  }
  function revisarMateriales(escena) {
    var n = N(), env = escena.environment;
    escena.traverse(function (o) {
      if (!o.material || o.userData.tkpNo) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
        if (m.isMeshStandardMaterial) { if (!basesEnv.has(m)) basesEnv.set(m, m.envMapIntensity == null ? 1 : m.envMapIntensity); m.envMapIntensity = basesEnv.get(m) * n.env; }
        if (vistos.has(m)) return; vistos.add(m);
        var src = m.onBeforeCompile ? String(m.onBeforeCompile) : '';
        if (/uAguaT/.test(src)) { parcharAgua(m); return; }
        if (m.customProgramCacheKey && /hojaReal/.test(String(m.customProgramCacheKey()))) { parcharHoja(m); return; }
        if (m.isMeshLambertMaterial && !m.transparent && !m.map && m.onBeforeCompile === T3.Material.prototype.onBeforeCompile) parcharDetalle(m);
      });
    });
  }
  // reflejo del cielo para los modelos 3D (PMREM de un cielo que sigue la hora)
  var ENV = { gen: null, rt: null, esc: null, mat: null, ult: -1 };
  function actualizarEntorno(escena, r) {
    try {
      if (!ENV.gen) {
        ENV.gen = new T3.PMREMGenerator(r); ENV.esc = new T3.Scene();
        ENV.mat = new T3.ShaderMaterial({ side: T3.BackSide, depthWrite: false, uniforms: { a: { value: new T3.Color() }, h: { value: new T3.Color() }, s: { value: new T3.Color() }, sd: { value: new T3.Vector3() } },
          vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'uniform vec3 a; uniform vec3 h; uniform vec3 s; uniform vec3 sd; varying vec3 vD; void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(h, a, pow(y, 0.6)) : mix(h, vec3(0.32, 0.36, 0.22), clamp(-y * 3.0, 0.0, 1.0)); c += s * pow(max(dot(vD, sd), 0.0), 64.0) * 4.0 + s * pow(max(dot(vD, sd), 0.0), 6.0) * 0.4; gl_FragColor = vec4(c, 1.0); }' });
        ENV.esc.add(new T3.Mesh(new T3.SphereGeometry(10, 32, 16), ENV.mat));
      }
      var u = ENV.mat.uniforms, clave = Math.round((C() ? C().fase() : 0.3) * 60);
      if (clave === ENV.ult) return; ENV.ult = clave;
      u.a.value.copy(U.cieloArr.value); u.h.value.copy(U.cieloHor.value); u.s.value.copy(U.solCol.value); u.sd.value.copy(U.solDir.value);
      var nuevo = ENV.gen.fromScene(ENV.esc, 0.02);
      escena.environment = nuevo.texture; if (ENV.rt) ENV.rt.dispose(); ENV.rt = nuevo;
    } catch (e) { console.warn('TKPremium: entorno', e); ENV.ult = 1e9; }
  }

  // ======================================================================
  //  3. PARTÍCULAS Y EFECTOS (luz aditiva y piezas sólidas: chispas, polvo, confeti, agua, fuegos)
  // ======================================================================
  function crearPool(max, aditivo) {
    var g = new T3.BufferGeometry(), pos = new Float32Array(max * 3), col = new Float32Array(max * 3), tam = new Float32Array(max), alfa = new Float32Array(max);
    g.setAttribute('position', new T3.BufferAttribute(pos, 3).setUsage(T3.DynamicDrawUsage)); g.setAttribute('color', new T3.BufferAttribute(col, 3).setUsage(T3.DynamicDrawUsage));
    g.setAttribute('tam', new T3.BufferAttribute(tam, 1).setUsage(T3.DynamicDrawUsage)); g.setAttribute('alfa', new T3.BufferAttribute(alfa, 1).setUsage(T3.DynamicDrawUsage));
    var m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: aditivo ? T3.AdditiveBlending : T3.NormalBlending, vertexColors: true, uniforms: { uEsc: { value: 400 } },
      vertexShader: 'attribute float tam; attribute float alfa; varying vec3 vC; varying float vA; uniform float uEsc; void main(){ vC = color; vA = alfa; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(tam * uEsc / -mv.z, 0.0, 96.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: aditivo ? 'varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float d = dot(q, q) * 4.0; float k = exp(-d * 3.5); if (k < 0.02) discard; gl_FragColor = vec4(vC * k * vA * 2.2, 1.0); }'
        : 'varying vec3 vC; varying float vA; void main(){ vec2 q = abs(gl_PointCoord - 0.5); if (max(q.x, q.y * 1.6) > 0.5) discard; gl_FragColor = vec4(vC, vA); }' });
    var p = new T3.Points(g, m); p.frustumCulled = false; p.renderOrder = 8; p.userData.tkpNo = true;
    return { p: p, g: g, max: max, n: 0, vel: new Float32Array(max * 3), vida: new Float32Array(max), dur: new Float32Array(max), grav: new Float32Array(max), roce: new Float32Array(max), tam0: new Float32Array(max), pos: pos, col: col, tam: tam, alfa: alfa };
  }
  var PL = null, PS = null; // luz (aditivo) y sólido
  function emitir(pool, x, y, z, vx, vy, vz, colr, tam, dur, grav, roce) {
    if (!pool) return; var lim = Math.min(pool.max, N().part); if (pool.n >= lim) return;
    var i = pool.n++, i3 = i * 3;
    pool.pos[i3] = x; pool.pos[i3 + 1] = y; pool.pos[i3 + 2] = z; pool.vel[i3] = vx; pool.vel[i3 + 1] = vy; pool.vel[i3 + 2] = vz;
    pool.col[i3] = colr.r; pool.col[i3 + 1] = colr.g; pool.col[i3 + 2] = colr.b; pool.tam[i] = pool.tam0[i] = tam; pool.vida[i] = 0; pool.dur[i] = dur; pool.grav[i] = grav; pool.roce[i] = roce || 0; pool.alfa[i] = 1;
  }
  function moverPool(pool, dt) {
    if (!pool) return;
    for (var i = 0; i < pool.n; i++) {
      pool.vida[i] += dt;
      if (pool.vida[i] >= pool.dur[i]) { var j = --pool.n; if (i !== j) copiar(pool, j, i); i--; continue; }
      var i3 = i * 3, k = Math.exp(-pool.roce[i] * dt);
      pool.vel[i3] *= k; pool.vel[i3 + 2] *= k; pool.vel[i3 + 1] = pool.vel[i3 + 1] * k - pool.grav[i] * dt;
      pool.pos[i3] += pool.vel[i3] * dt; pool.pos[i3 + 1] += pool.vel[i3 + 1] * dt; pool.pos[i3 + 2] += pool.vel[i3 + 2] * dt;
      var u = pool.vida[i] / pool.dur[i]; pool.alfa[i] = u < 0.1 ? u / 0.1 : 1 - Math.pow((u - 0.1) / 0.9, 2);
    }
    pool.g.setDrawRange(0, pool.n);
    ['position', 'color', 'tam', 'alfa'].forEach(function (a) { pool.g.attributes[a].needsUpdate = true; });
  }
  function copiar(p, de, a) {
    var d3 = de * 3, a3 = a * 3;
    for (var k = 0; k < 3; k++) { p.pos[a3 + k] = p.pos[d3 + k]; p.vel[a3 + k] = p.vel[d3 + k]; p.col[a3 + k] = p.col[d3 + k]; }
    p.tam[a] = p.tam[de]; p.tam0[a] = p.tam0[de]; p.vida[a] = p.vida[de]; p.dur[a] = p.dur[de]; p.grav[a] = p.grav[de]; p.roce[a] = p.roce[de]; p.alfa[a] = p.alfa[de];
  }
  // columna de luz, onda en el suelo y destellos (mallas temporales)
  var temporales = [];
  var FRAG_COLUMNA = 'uniform vec3 uC; uniform float uA; uniform float uT; varying vec2 vUv; void main(){ float v = vUv.y; float bordes = pow(sin(vUv.x * 3.14159), 0.0); float k = pow(1.0 - v, 1.6) * (0.65 + 0.35 * sin(v * 18.0 - uT * 9.0 + vUv.x * 25.0)); gl_FragColor = vec4(uC * k * uA, 1.0); }';
  function columnaLuz(pos, color, alto, radio, dur) {
    var m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, uniforms: { uC: { value: new T3.Color(color) }, uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: FRAG_COLUMNA });
    var g = new T3.CylinderGeometry(radio * 0.7, radio, alto, 24, 1, true); g.translate(0, alto / 2, 0);
    var me = new T3.Mesh(g, m); me.position.copy(pos); me.userData.tkpNo = true; me.renderOrder = 9;
    temporales.push({ o: me, t: 0, dur: dur, tipo: 'columna' }); return me;
  }
  function onda(pos, color, radio, dur) {
    var m = new T3.ShaderMaterial({ transparent: true, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide, uniforms: { uC: { value: new T3.Color(color) }, uA: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uC; uniform float uA; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; float k = smoothstep(0.7, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r)); gl_FragColor = vec4(uC * k * uA * 1.6, 1.0); }' });
    var me = new T3.Mesh(new T3.PlaneGeometry(2, 2), m); me.rotation.x = -Math.PI / 2; me.position.copy(pos); me.position.y += 0.25; me.userData.tkpNo = true; me.renderOrder = 9;
    temporales.push({ o: me, t: 0, dur: dur, tipo: 'onda', radio: radio }); return me;
  }
  function moverTemporales(dt, escena) {
    for (var i = temporales.length - 1; i >= 0; i--) {
      var q = temporales[i]; q.t += dt; var u = q.t / q.dur;
      if (!q.o.parent) escena.add(q.o);
      if (u >= 1) { escena.remove(q.o); q.o.geometry.dispose(); q.o.material.dispose(); temporales.splice(i, 1); continue; }
      var un = q.o.material.uniforms;
      if (q.tipo === 'columna') { un.uA.value = Math.sin(Math.min(1, u * 1.25) * Math.PI) * 2.8; un.uT.value += dt; q.o.scale.set(1 + u * 0.4, 0.5 + Math.min(1, u * 3) * 0.6, 1 + u * 0.4); }
      else { var r = q.radio * (0.15 + Math.pow(u, 0.6)); q.o.scale.set(r, r, r); un.uA.value = 1 - u; }
    }
  }
  var COL = {}; function col(h) { return COL[h] || (COL[h] = new T3.Color(h)); }
  function chispasOro(p, n, fuerza, alto) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = (0.4 + Math.random()) * fuerza; emitir(PL, p.x, p.y + Math.random() * (alto || 1), p.z, Math.cos(a) * v, 2 + Math.random() * fuerza * 1.3, Math.sin(a) * v, col(Math.random() < 0.7 ? 0xffcf5a : 0xfff2c0), 1.1 + Math.random() * 0.9, 0.9 + Math.random() * 0.9, 4.5, 1.2); }
  }
  function espiral(p, n, alto, colr) {
    for (var i = 0; i < n; i++) { var a = i * 0.55, r = 2.2; emitir(PL, p.x + Math.cos(a) * r, p.y + 0.3, p.z + Math.sin(a) * r, -Math.sin(a) * 2.5, 3 + (i % 5) * 0.9, Math.cos(a) * 2.5, col(colr), 1.3, 1.2 + (i % 7) * 0.12, -0.5, 1.6); }
  }
  function polvo(p, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 2 + Math.random() * 3.5; emitir(PS, p.x + Math.cos(a), p.y + 0.3, p.z + Math.sin(a), Math.cos(a) * v, 0.6 + Math.random() * 1.6, Math.sin(a) * v, col([0xc8b08a, 0xb39a74, 0xd9c9a8][i % 3]), 0.5 + Math.random() * 0.5, 0.8 + Math.random() * 0.7, 1.2, 2.6); }
  }
  function confeti3D(p, n) {
    var cs = [0xe8434f, 0xf2c94c, 0x4fb4e8, 0x6fd36b, 0xffffff, 0xb07cff];
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 1 + Math.random() * 4; emitir(PS, p.x, p.y, p.z, Math.cos(a) * v, 4 + Math.random() * 5, Math.sin(a) * v, col(cs[i % cs.length]), 0.35 + Math.random() * 0.25, 2.2 + Math.random() * 1.2, 3.2, 1.8); }
  }
  var fuegos = [];
  function fuegoArtificial(p, colr, retraso) { fuegos.push({ x: p.x + (Math.random() - 0.5) * 14, z: p.z + (Math.random() - 0.5) * 14, y: p.y, meta: p.y + 16 + Math.random() * 10, c: colr, espera: retraso || 0, sube: false }); }
  function moverFuegos(dt) {
    for (var i = fuegos.length - 1; i >= 0; i--) {
      var f = fuegos[i]; f.espera -= dt; if (f.espera > 0) continue;
      f.sube = true; f.y += dt * 26; emitir(PL, f.x, f.y, f.z, (Math.random() - 0.5) * 0.4, -1, (Math.random() - 0.5) * 0.4, col(0xffd9a0), 0.45, 0.5, 2, 1);
      if (f.y >= f.meta) {
        var n = 70; for (var k = 0; k < n; k++) { var th = Math.acos(2 * Math.random() - 1), ph = Math.random() * 6.283, v = 9 + Math.random() * 3; emitir(PL, f.x, f.y, f.z, Math.sin(th) * Math.cos(ph) * v, Math.cos(th) * v, Math.sin(th) * Math.sin(ph) * v, col(k % 4 ? f.c : 0xffffff), 0.8, 1.4 + Math.random() * 0.6, 4, 2.2); }
        FX_POST.flash = Math.max(FX_POST.flash, 0.05); fuegos.splice(i, 1);
      }
    }
  }

  // ======================================================================
  //  4. CIUDAD VIVA: patrullas en la muralla, comerciantes con carro, pájaros, fuente, vegetación con viento
  // ======================================================================
  function rayo3() { var r = new T3.Raycaster(); r.camera = X().camara; var orig = r.intersectObject; r.intersectObject = function (o, rec) { var res = []; o.traverse(function (m) { if (m.isMesh && !m.isInstancedMesh && m.visible) try { m.raycast(r, res); } catch (e) {} }); return res.sort(function (a, b) { return a.distance - b.distance; }); }; return r; }
  var vida = { patrullas: [], carros: [], aves: null, fuente: null, deco: null, ruta: null, muro: null, hechoDeco: '' };
  function rutaMuralla(c) {
    var mu = c.muralla(); if (!mu) return null;
    if (vida.muro && vida.muro.obj === mu) return vida.muro;
    mu.updateMatrixWorld(true);
    var f = c.forma, puntos = [], ray = rayo3(), abajo = new T3.Vector3(0, -1, 0), o = new T3.Vector3();
    for (var i = 0; i < 360; i++) {
      var a = i / 360 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a), lo = 0.3, hi = 2;
      for (var k = 0; k < 22; k++) { var mid = (lo + hi) / 2; if (c.formaD2(dx * mid, dz * mid) < 1) lo = mid; else hi = mid; }
      var x = f.cx + dx * lo * f.rx * 0.993, z = f.cz + dz * lo * f.rz * 0.993;
      o.set(x, 40, z); ray.set(o, abajo); ray.far = 60;
      var hit = ray.intersectObject(mu, true)[0];
      puntos.push(hit && hit.point.y > 0.8 ? new T3.Vector3(x, hit.point.y, z) : null);
    }
    // alto de paseo: el valor más común (las almenas quedan por encima)
    var alturas = puntos.filter(Boolean).map(function (p) { return p.y; }).sort(function (a, b) { return a - b; });
    var med = alturas.length ? alturas[Math.floor(alturas.length * 0.35)] : 0;
    puntos.forEach(function (p) { if (p && Math.abs(p.y - med) < 1.2) p.y = med; else if (p && p.y > med + 1.2) p.y = med; });
    vida.muro = { obj: mu, p: puntos }; vida.patrullas.forEach(function (s) { s.grupo.parent && s.grupo.parent.remove(s.grupo); }); vida.patrullas = [];
    return vida.muro;
  }
  function crearPatrullas(c, escena) {
    var ruta = rutaMuralla(c); if (!ruta || !window.M) return;
    var quiero = N().patrulla;
    while (vida.patrullas.length > quiero) { var s0 = vida.patrullas.pop(); escena.remove(s0.grupo); }
    var intentos = 0;
    while (vida.patrullas.length < quiero && intentos++ < 40) {
      var i0 = Math.floor(Math.random() * 360); if (!ruta.p[i0]) continue;
      var u = M.unidad(Math.random() < 0.5 ? 'arquero' : 'espadachin'); if (!u || !u.grupo) return;
      u.grupo.position.copy(ruta.p[i0]); u.grupo.userData.tkpNo = false; escena.add(u.grupo);
      vida.patrullas.push({ u: u, grupo: u.grupo, i: i0, f: 0, dir: Math.random() < 0.5 ? 1 : -1, vel: 0.9 + Math.random() * 0.3, espera: Math.random() * 3, mira: 0 });
    }
  }
  function moverPatrullas(dt, c) {
    var ruta = vida.muro; if (!ruta) return;
    vida.patrullas.forEach(function (s) {
      var g = s.grupo, caminando = false;
      if (s.espera > 0) { s.espera -= dt; g.rotation.y += (s.mira - g.rotation.y) * Math.min(1, dt * 3); }
      else {
        var sig = (s.i + s.dir + 360) % 360, p1 = ruta.p[sig];
        if (!p1 || Math.random() < dt * 0.04) { s.dir = -s.dir; s.espera = 1.5 + Math.random() * 3; var dirF = new T3.Vector3(g.position.x - c.forma.cx, 0, g.position.z - c.forma.cz); s.mira = Math.atan2(dirF.x, dirF.z); }
        else {
          var d = p1.clone().sub(g.position), l = d.length();
          if (l < 0.05) s.i = sig; else { d.multiplyScalar(Math.min(1, s.vel * dt / l)); g.position.add(d); var ang = Math.atan2(d.x, d.z); g.rotation.y += Math.atan2(Math.sin(ang - g.rotation.y), Math.cos(ang - g.rotation.y)) * Math.min(1, dt * 8); caminando = true; }
          if (l < 0.3) s.i = sig;
        }
      }
      try { M.animarUnidad(s.u, tiempo + s.vel * 7, caminando); } catch (e) {}
    });
  }
  // comerciantes: caballo que tira de un carro, y el comerciante al lado, por las calles de piedra
  function crearCarros(c, escena) {
    var es = c.esquinas(); if (!es || es.length < 4 || !window.M || !M.animal) return;
    var quiero = N().carros;
    while (vida.carros.length > quiero) { var q0 = vida.carros.pop(); escena.remove(q0.g); }
    while (vida.carros.length < quiero) {
      var g = new T3.Group(), cab = M.animal('caballo'); g.add(cab.grupo); cab.grupo.position.set(0, 0, 0.9);
      var carro = new T3.Group(); carro.position.set(0, 0, -0.7); g.add(carro);
      var hombre = M.unidad(['aldeano', 'anciano', 'aldeana'][vida.carros.length % 3]); hombre.grupo.position.set(0.85, 0, 0.6); g.add(hombre.grupo);
      var p0 = es[Math.floor(Math.random() * es.length)].clone(); g.position.copy(p0); escena.add(g);
      vida.carros.push({ g: g, cab: cab, carro: carro, hombre: hombre, meta: p0.clone(), espera: 2 + Math.random() * 4, vel: 0.85 + Math.random() * 0.25, conCarro: false });
    }
  }
  function moverCarros(dt, c) {
    var es = c.esquinas(); if (!es || !es.length) return;
    vida.carros.forEach(function (q) {
      if (!q.conCarro && M.figura) { var fc = M.figura('carreta'); if (fc) { fc.rotation.y = Math.PI / 2; fc.scale.multiplyScalar(1.5); q.carro.add(fc); q.conCarro = true; } }
      if (!q.cab.fig && M.ponerFiguraAnimal) try { M.ponerFiguraAnimal(q.cab); } catch (e) {}
      var g = q.g, d = q.meta.clone().sub(g.position); d.y = 0; var l = d.length(), camina = false;
      if (q.espera > 0) q.espera -= dt;
      else if (l < 0.2) {
        // siguiente esquina: una cercana y en línea recta (como los aldeanos: calles en cruz)
        var cerca = es.filter(function (p) { var dd = Math.hypot(p.x - g.position.x, p.z - g.position.z); return dd > 4 && dd < 16 && (Math.abs(p.x - g.position.x) < 0.6 || Math.abs(p.z - g.position.z) < 0.6); });
        if (!cerca.length) cerca = es.filter(function (p) { var dd = Math.hypot(p.x - g.position.x, p.z - g.position.z); return dd > 4 && dd < 18; });
        if (cerca.length) q.meta = cerca[Math.floor(Math.random() * cerca.length)].clone(); if (Math.random() < 0.3) q.espera = 2 + Math.random() * 5;
      } else {
        d.multiplyScalar(Math.min(1, q.vel * dt / l)); g.position.add(d); camina = true;
        var ang = Math.atan2(d.x, d.z); g.rotation.y += Math.atan2(Math.sin(ang - g.rotation.y), Math.cos(ang - g.rotation.y)) * Math.min(1, dt * 2.5);
      }
      try { M.animarAnimal(q.cab, tiempo, camina); M.animarUnidad(q.hombre, tiempo * 1.1, camina); } catch (e) {}
      q.carro.rotation.x = camina ? Math.sin(tiempo * 9) * 0.012 : 0;
    });
  }
  // pájaros: una sola malla instanciada, aleteo en el dibujo
  function crearAves(escena) {
    var n = N().aves; if (vida.aves) { escena.remove(vida.aves.m); vida.aves = null; } if (!n) return;
    var g = new T3.BufferGeometry(), v = new Float32Array([0, 0, 0.18, -0.55, 0.04, -0.05, 0, 0, -0.2, 0, 0, 0.18, 0.55, 0.04, -0.05, 0, 0, -0.2]);
    g.setAttribute('position', new T3.BufferAttribute(v, 3)); g.computeVertexNormals();
    var m = new T3.MeshBasicMaterial({ color: 0x3a342e, side: T3.DoubleSide, fog: true });
    m.onBeforeCompile = function (sh) { sh.uniforms.uT = U.t; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float fa = float(gl_InstanceID) * 1.7; transformed.y += abs(position.x) * sin(uT * 11.0 + fa) * 0.9;'); };
    m.customProgramCacheKey = function () { return 'tkpAve'; };
    var im = new T3.InstancedMesh(g, m, n); im.frustumCulled = false; im.userData.tkpNo = true; im.castShadow = false;
    var lista = []; for (var i = 0; i < n; i++) lista.push({ c: i % 3, a: Math.random() * 6.28, r: 14 + Math.random() * 30, y: 16 + Math.random() * 12, v: 0.12 + Math.random() * 0.08, f: Math.random() * 6.28, esc: 0.9 + Math.random() * 0.6 });
    vida.aves = { m: im, l: lista, o: new T3.Object3D() }; escena.add(im);
  }
  function moverAves(dt, c) {
    var A = vida.aves; if (!A) return; var cen = c.centro;
    A.l.forEach(function (b, i) {
      b.a += b.v * dt * (b.c === 1 ? -1 : 1); var cx = cen.x + Math.cos(tiempo * 0.03 + b.c * 2) * 25, cz = cen.z + Math.sin(tiempo * 0.025 + b.c * 2) * 25;
      var x = cx + Math.cos(b.a) * b.r, z = cz + Math.sin(b.a) * b.r, y = b.y + Math.sin(tiempo * 0.5 + b.f) * 2;
      var o = A.o; o.position.set(x, y, z); o.rotation.set(0, -b.a + (b.c === 1 ? 0 : Math.PI), Math.sin(tiempo + b.f) * 0.2); o.scale.setScalar(b.esc * 0.75); o.updateMatrix(); A.m.setMatrixAt(i, o.matrix);
    });
    A.m.instanceMatrix.needsUpdate = true;
    A.m.visible = c.noche() < 0.7;
  }
  // fuente: busca el plato de arriba de la fuente de la plaza y lanza agua
  function buscarFuente(escena) {
    var f = null, w = new T3.Vector3();
    escena.traverse(function (o) { if (!f && o.isMesh && o.geometry && o.geometry.type === 'CircleGeometry' && o.geometry.parameters && Math.abs(o.geometry.parameters.radius - 1.05) < 0.01) { o.getWorldPosition(w); f = w.clone(); } });
    return f;
  }
  var cAgua = new T3.Color(0.75, 0.9, 1.0), cAgua2 = new T3.Color(0.92, 0.97, 1.0);
  function moverFuente(dt) {
    var f = vida.fuente; if (!f) return;
    f.acc = (f.acc || 0) + dt * (N().post ? 95 : 45);
    while (f.acc > 1) { f.acc--; var a = Math.random() * 6.283, v = 1.0 + Math.random() * 0.35; emitir(PL, f.p.x, f.p.y + 1.25, f.p.z, Math.cos(a) * v, 2.6 + Math.random() * 0.8, Math.sin(a) * v, Math.random() < 0.5 ? cAgua : cAgua2, 0.26 + Math.random() * 0.16, 0.9, 6.5, 0.2); if (Math.random() < 0.35) { var a2 = Math.random() * 6.283; emitir(PL, f.p.x + Math.cos(a2) * 1.0, f.p.y + 0.05, f.p.z + Math.sin(a2) * 1.0, Math.cos(a2) * 1.6, 0.6, Math.sin(a2) * 1.6, cAgua, 0.22, 0.6, 5, 0.2); } }
  }
  // vegetación: hierba, flores y rocas instanciadas en los huecos de la villa (no tocan calles, parcelas ni el castillo)
  function texturaHierba(flores) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d');
    for (var i = 0; i < 16; i++) { var bx = 8 + Math.random() * 48, h = 30 + Math.random() * 30, gr = x.createLinearGradient(0, 64, 0, 64 - h); gr.addColorStop(0, '#5f8f38'); gr.addColorStop(1, ['#a6d466', '#bde07a', '#94c856'][i % 3]); x.strokeStyle = gr; x.lineWidth = 2 + Math.random() * 2; x.beginPath(); x.moveTo(bx, 64); x.quadraticCurveTo(bx + (Math.random() - 0.5) * 10, 64 - h * 0.5, bx + (Math.random() - 0.5) * 16, 64 - h); x.stroke(); }
    if (flores) { var cs = ['#f04a5a', '#ffd34a', '#ffffff', '#c58aff', '#ff8a3a', '#7ec8ff']; for (var j = 0; j < 7; j++) { var fx = 10 + Math.random() * 44, fy = 10 + Math.random() * 26; x.fillStyle = cs[(j + (flores | 0)) % cs.length]; for (var p = 0; p < 5; p++) { x.beginPath(); x.arc(fx + Math.cos(p * 1.256) * 2.6, fy + Math.sin(p * 1.256) * 2.6, 2.3, 0, 6.283); x.fill(); } x.fillStyle = '#f6c03a'; x.beginPath(); x.arc(fx, fy, 1.6, 0, 6.283); x.fill(); } }
    var t = new T3.CanvasTexture(cv); t.anisotropy = 2; return t;
  }
  function cruzada() {
    var a = new T3.PlaneGeometry(1, 1), b = new T3.PlaneGeometry(1, 1); a.translate(0, 0.5, 0); b.translate(0, 0.5, 0); b.rotateY(Math.PI / 2);
    var g = new T3.BufferGeometry(), pa = a.attributes.position.array, pb = b.attributes.position.array, ua = a.attributes.uv.array, ub = b.attributes.uv.array, na = a.attributes.normal.array;
    var pos = new Float32Array(pa.length * 2), uv = new Float32Array(ua.length * 2), nor = new Float32Array(pa.length * 2);
    pos.set(pa); pos.set(pb, pa.length); uv.set(ua); uv.set(ub, ua.length); for (var i = 0; i < nor.length; i += 3) { nor[i + 1] = 1; }
    var ia = a.index.array, idx = new Uint16Array(ia.length * 2); for (var k = 0; k < ia.length; k++) { idx[k] = ia[k]; idx[k + ia.length] = ia[k] + 4; }
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('uv', new T3.BufferAttribute(uv, 2)); g.setAttribute('normal', new T3.BufferAttribute(nor, 3)); g.setIndex(new T3.BufferAttribute(idx, 1));
    return g;
  }
  function matVegetal(tex) {
    var m = new T3.MeshLambertMaterial({ map: tex, alphaTest: 0.45, side: T3.DoubleSide });
    m.onBeforeCompile = function (sh) { sh.uniforms.uTkpT = U.t; sh.uniforms.uTkpV = U.viento; sh.vertexShader = 'uniform float uTkpT; uniform float uTkpV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 tkpI = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float tkpK = uv.y * uv.y * uTkpV;\n transformed.x += sin(uTkpT * 2.1 + tkpI.x * 0.4 + tkpI.z * 0.3) * 0.12 * tkpK; transformed.z += cos(uTkpT * 1.7 + tkpI.z * 0.5) * 0.08 * tkpK;'); };
    m.customProgramCacheKey = function () { return 'tkpVeg'; }; return m;
  }
  function crearDeco(c, escena) {
    var k = N().deco, clave = String(k); if (vida.hechoDeco === clave) return; vida.hechoDeco = clave;
    if (vida.deco) { vida.deco.forEach(function (m) { escena.remove(m); m.geometry.dispose(); }); vida.deco = null; }
    if (!k) return;
    var azar = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(9173);
    var lug = [], R = c.R, nH = Math.round(1100 * k), nR = Math.round(70 * k);
    for (var t = 0; t < nH * 8 && lug.length < nH + nR; t++) { var w = c.aMundo((azar() - 0.5) * 2 * R, (azar() - 0.5) * 2 * R); if (c.libre(w[0], w[1])) lug.push(w); }
    var mats = [matVegetal(texturaHierba(0)), matVegetal(texturaHierba(1)), matVegetal(texturaHierba(4))], geo = cruzada(), o = new T3.Object3D(), res = [];
    var grupos = [[], [], []]; lug.slice(0, nH).forEach(function (p, i) { grupos[i % 7 === 0 ? 1 : i % 11 === 0 ? 2 : 0].push(p); });
    grupos.forEach(function (gp, gi) {
      if (!gp.length) return; var im = new T3.InstancedMesh(geo, mats[gi], gp.length); im.receiveShadow = true; im.userData.tkpNo = true;
      gp.forEach(function (p, i) { var s = gi ? 1.0 + azar() * 0.5 : 0.9 + azar() * 0.8; o.position.set(p[0] + (azar() - 0.5), c.alturaCiudad(p[0], p[1]), p[1] + (azar() - 0.5)); o.rotation.set(0, azar() * 6.28, 0); o.scale.set(s * (1.2 + azar() * 0.6), s, s * (1.2 + azar() * 0.6)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      escena.add(im); res.push(im);
    });
    var rocas = lug.slice(nH); if (rocas.length) {
      var gR = new T3.DodecahedronGeometry(0.42, 0), pr = gR.attributes.position; for (var j = 0; j < pr.count; j++) pr.setY(j, pr.getY(j) * 0.55 + 0.1);
      gR.computeVertexNormals();
      var imR = new T3.InstancedMesh(gR, new T3.MeshLambertMaterial({ color: 0xffffff }), rocas.length); imR.castShadow = true; imR.receiveShadow = true;
      rocas.forEach(function (p, i) { var s = 0.5 + azar() * 1.1; o.position.set(p[0], c.alturaCiudad(p[0], p[1]), p[1]); o.rotation.set(azar() * 0.4, azar() * 6.28, azar() * 0.4); o.scale.set(s * (1 + azar() * 0.5), s, s); o.updateMatrix(); imR.setMatrixAt(i, o.matrix); imR.setColorAt(i, new T3.Color().setHSL(0.09 + azar() * 0.04, 0.08 + azar() * 0.1, 0.42 + azar() * 0.18)); });
      escena.add(imR); res.push(imR);
    }
    vida.deco = res;
  }

  // ======================================================================
  //  5. CASTILLO MAJESTUOSO: estandartes con escudo, estandarte real y braseros (según su nivel)
  // ======================================================================
  var CAST = { obj: null, g: null, llamas: [] };
  function texEscudo(fondo, figura, borde) {
    var cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; var x = cv.getContext('2d');
    var gr = x.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, fondo[0]); gr.addColorStop(0.5, fondo[1]); gr.addColorStop(1, fondo[0]); x.fillStyle = gr; x.fillRect(0, 0, 128, 256);
    x.fillStyle = borde; x.fillRect(0, 0, 128, 10); x.fillRect(0, 0, 8, 256); x.fillRect(120, 0, 8, 256);
    // punta de cola de golondrina
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, 256); x.lineTo(64, 214); x.lineTo(128, 256); x.fill(); x.globalCompositeOperation = 'source-over';
    x.strokeStyle = borde; x.lineWidth = 6; x.beginPath(); x.moveTo(2, 252); x.lineTo(64, 210); x.lineTo(126, 252); x.stroke();
    // escudo
    x.save(); x.translate(64, 104); x.fillStyle = borde; x.beginPath(); x.moveTo(-36, -44); x.lineTo(36, -44); x.lineTo(36, 4); x.quadraticCurveTo(34, 40, 0, 56); x.quadraticCurveTo(-34, 40, -36, 4); x.closePath(); x.fill();
    x.fillStyle = figura; x.beginPath(); x.moveTo(-30, -38); x.lineTo(30, -38); x.lineTo(30, 3); x.quadraticCurveTo(28, 34, 0, 48); x.quadraticCurveTo(-28, 34, -30, 3); x.closePath(); x.fill();
    x.fillStyle = borde; x.beginPath(); x.moveTo(-30, 6); x.lineTo(0, -18); x.lineTo(30, 6); x.lineTo(30, 18); x.lineTo(0, -6); x.lineTo(-30, 18); x.fill(); // cheurón
    // corona
    x.fillStyle = borde; x.beginPath(); x.moveTo(-24, -54); x.lineTo(-24, -66); x.lineTo(-14, -58); x.lineTo(0, -72); x.lineTo(14, -58); x.lineTo(24, -66); x.lineTo(24, -54); x.closePath(); x.fill();
    x.restore();
    for (var i = 0; i < 3; i++) { x.fillStyle = borde; x.beginPath(); x.arc(32 + i * 32, 190, 5, 0, 6.283); x.fill(); }
    var t = new T3.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function matTela(tex) {
    var m = new T3.MeshLambertMaterial({ map: tex, side: T3.DoubleSide, transparent: false, alphaTest: 0.5 });
    m.onBeforeCompile = function (sh) { sh.uniforms.uTkpT = U.t; sh.uniforms.uTkpV = U.viento; sh.vertexShader = 'uniform float uTkpT; uniform float uTkpV;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float tkpC = 1.0 - uv.y; transformed.z += sin(uTkpT * 2.4 + uv.y * 6.0 + position.x * 2.0) * 0.12 * tkpC * uTkpV; transformed.x += sin(uTkpT * 1.9 + uv.y * 4.0) * 0.04 * tkpC * uTkpV;'); };
    m.customProgramCacheKey = function () { return 'tkpTela'; }; return m;
  }
  var MAT_EST = null;
  function decorarCastillo(c, escena) {
    var ca = c.castillo(); if (!ca || ca.userData.esperandoModelo || !ca.parent) return;
    ca.updateMatrixWorld(true);
    var caja = new T3.Box3().setFromObject(ca); if (!isFinite(caja.min.x)) return;
    var huella = caja.getSize(new T3.Vector3()).toArray().map(function (v) { return v.toFixed(1); }).join(',');
    if (ca === CAST.obj && huella === CAST.huella) return;
    if (CAST.g) { escena.remove(CAST.g); CAST.g = null; } CAST.obj = ca; CAST.huella = huella; CAST.llamas = [];
    var cen = caja.getCenter(new T3.Vector3()), tam = caja.getSize(new T3.Vector3()), alto = tam.y, R = Math.max(tam.x, tam.z);
    var fp = c.aMundo(1, 0), frente = new T3.Vector3(fp[0], 0, fp[1]).normalize(), lado = new T3.Vector3(-frente.z, 0, frente.x);
    var nv = (X() && window.__juego && __juego.estado && __juego.estado().castillo) || 1;
    var g = new T3.Group(); g.userData.tkpNo = false; CAST.g = g;
    MAT_EST = MAT_EST || { rojo: matTela(texEscudo(['#7a0f12', '#b3221f'], '#c9a227', '#f3d27a')), azul: matTela(texEscudo(['#0f2a6a', '#2350b0'], '#f2f2f2', '#f3d27a')), real: matTela(texEscudo(['#3a0a5a', '#6a2a9a'], '#f3d27a', '#ffe9a8')) };
    var ray = rayo3(), cuantos = nv >= 9 ? 4 : nv >= 4 ? 3 : 2, desp = [-0.28, 0.28, -0.1, 0.1];
    var aEst = Math.max(2.6, alto * 0.36), anEst = aEst * 0.42;
    for (var i = 0; i < cuantos; i++) {
      var h = caja.min.y + alto * (0.5 - (i > 1 ? 0.08 : 0)), o = cen.clone().addScaledVector(lado, desp[i] * R).addScaledVector(frente, R); o.y = h;
      ray.set(o, frente.clone().negate()); ray.far = R * 1.5;
      var hit = ray.intersectObject(ca, true)[0]; if (!hit) continue;
      var est = new T3.Mesh(new T3.PlaneGeometry(anEst, aEst, 4, 8), i < 2 ? (nv >= 9 ? MAT_EST.real : MAT_EST.rojo) : MAT_EST.azul);
      est.geometry.translate(0, -aEst / 2, 0); est.position.copy(hit.point).addScaledVector(frente, 0.14); est.lookAt(est.position.clone().add(frente)); est.castShadow = true;
      var barra = new T3.Mesh(new T3.CylinderGeometry(0.05, 0.05, anEst * 1.25, 6), new T3.MeshLambertMaterial({ color: 0xc9a227 })); barra.rotation.z = Math.PI / 2; barra.position.set(0, 0.02, 0); est.add(barra);
      g.add(est);
    }
    // estandarte real en lo más alto (castillo nivel 3+)
    if (nv >= 3) {
      var arriba = cen.clone(); arriba.y = caja.max.y + 5; ray.set(arriba, new T3.Vector3(0, -1, 0)); ray.far = alto + 10;
      var top = ray.intersectObject(ca, true)[0];
      if (top) {
        var mast = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.09, aEst * 1.1, 6), new T3.MeshLambertMaterial({ color: 0x5a4632 })); mast.position.copy(top.point); mast.position.y += aEst * 0.55; g.add(mast);
        var bola = new T3.Mesh(new T3.SphereGeometry(0.14, 10, 8), new T3.MeshLambertMaterial({ color: 0xf3d27a, emissive: 0x6a4a10 })); bola.position.copy(mast.position); bola.position.y += aEst * 0.56; g.add(bola);
        var ban = new T3.Mesh(new T3.PlaneGeometry(aEst * 0.75, anEst * 1.1, 8, 4), MAT_EST.real); ban.geometry.rotateZ(-Math.PI / 2); ban.geometry.translate(aEst * 0.375, 0, 0);
        ban.position.copy(mast.position); ban.position.y += aEst * 0.33; ban.rotation.y = Math.atan2(lado.x, lado.z) - Math.PI / 2; ban.castShadow = true; g.add(ban);
      }
    }
    // braseros a los lados de la puerta
    var puerta = cen.clone().addScaledVector(frente, R * 0.62); puerta.y = caja.min.y;
    [-1, 1].forEach(function (s) {
      var p = puerta.clone().addScaledVector(lado, s * R * 0.2); p.y = caja.min.y;
      var base = new T3.Mesh(new T3.CylinderGeometry(0.35, 0.22, 1.2, 8), new T3.MeshLambertMaterial({ color: 0x6a645a })); base.position.copy(p); base.position.y += 0.6; base.castShadow = true; g.add(base);
      var cuenco = new T3.Mesh(new T3.CylinderGeometry(0.55, 0.32, 0.35, 10), new T3.MeshLambertMaterial({ color: nv >= 9 ? 0xc9a227 : 0x4a4038 })); cuenco.position.copy(p); cuenco.position.y += 1.35; g.add(cuenco);
      CAST.llamas.push(new T3.Vector3(p.x, p.y + 1.55, p.z));
    });
    escena.add(g);
  }
  var cFuego = [new T3.Color(1.0, 0.55, 0.15), new T3.Color(1.0, 0.8, 0.35), new T3.Color(1.0, 0.35, 0.08)];
  function moverLlamas(dt) {
    CAST.llamas.forEach(function (p) {
      if (Math.random() < dt * 40) emitir(PL, p.x + (Math.random() - 0.5) * 0.4, p.y, p.z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, 1.4 + Math.random(), (Math.random() - 0.5) * 0.3, cFuego[(Math.random() * 3) | 0], 0.9 + Math.random() * 0.5, 0.5 + Math.random() * 0.3, -0.6, 0.6);
    });
  }

  // ======================================================================
  //  6. CIELO, LUZ Y CLIMA: colores para reflejos, tormentas con relámpagos y día/noche real
  // ======================================================================
  var rayo = { t: 0, prox: 6 };
  function actualizarLuz(dt, escena, c) {
    var domo = escena.userData.domo && escena.userData.domo.material.uniforms;
    if (domo && domo.arriba) { U.cieloArr.value.copy(domo.arriba.value); U.cieloHor.value.copy(domo.horizonte.value); }
    if (c.sol) { U.solCol.value.copy(c.sol.color).multiplyScalar(c.sol.intensity); U.solDir.value.copy(c.dirSol).normalize(); }
    var clima = window.TKClima && TKClima.estado(), llueve = clima && clima.actual === 'lluvia' ? clima.fuerza : 0;
    FX_POST.tormenta += (llueve - FX_POST.tormenta) * Math.min(1, dt * 0.8);
    U.viento.value = 1 + FX_POST.tormenta * 1.6 + Math.sin(tiempo * 0.23) * 0.25;
    if (FX_POST.tormenta > 0.02 && c.sol) {
      c.sol.intensity *= 1 - 0.45 * FX_POST.tormenta; c.hemi.intensity *= 1 - 0.18 * FX_POST.tormenta;
      if (N().post) { rayo.prox -= dt; if (rayo.prox <= 0) { rayo.t = 0.35; rayo.prox = 7 + Math.random() * 14; } }
    }
    if (rayo.t > 0) { rayo.t -= dt; var fl = rayo.t > 0.25 ? 0.22 : rayo.t > 0.18 ? 0.02 : rayo.t > 0.1 ? 0.16 : 0; FX_POST.flash = Math.max(FX_POST.flash, fl * FX_POST.tormenta); c.hemi.intensity += fl * 3 * FX_POST.tormenta; }
    FX_POST.flash = Math.max(0, FX_POST.flash - dt * 0.6);
    FX_POST.cine += (FX_POST.cineMeta - FX_POST.cine) * Math.min(1, dt * 2.5);
  }
  function aplicarCiclo() {
    var c = C(); if (!c) return;
    if (/[?&](noche|dia)\b/.test(location.search)) return; // las pruebas mandan
    var ciclo = pref.ciclo || 'real';
    c.ponerHora(ciclo === 'dia' ? 0.32 : ciclo === 'noche' ? 0.82 : null); // v9.92: también noche permanente
  }

  // ======================================================================
  //  7. CÁMARA DE CINE y MODO CINE
  // ======================================================================
  var cine = { on: false, antes: null, capa: null };
  function enfoque(p) {
    var c = C(); if (!c || !p || nivel === 'baja') return;
    c.cam.suaveHasta = performance.now() + 1100; // deslizamiento lento y suave (como un travelling)
    c.cam.distMeta *= 0.86;
  }
  function entrarCine() {
    var c = C(); if (!c || cine.on || c.enMenu() || c.enMundo()) return;
    cine.on = true; cine.antes = { dist: c.cam.distMeta, grados: c.camv.gradosMeta, meta: c.cam.meta.clone() };
    c.cam.distMeta = c.zoomBase() * 0.62; c.camv.gradosMeta = Math.max(c.camv.GMIN, 30); c.cam.suaveHasta = performance.now() + 2500;
    document.body.classList.add('tkp-cine'); FX_POST.cineMeta = 1;
    var d = document.createElement('div'); d.id = 'tkp-cine-capa'; d.innerHTML = '<span>' + L('Modo cine · toca para salir', 'Cinematic mode · tap to exit') + '</span>';
    d.addEventListener('click', salirCine); document.body.appendChild(d); cine.capa = d;
    setTimeout(function () { d.classList.add('tkp-tenue'); }, 2600);
  }
  function salirCine() {
    var c = C(); if (!cine.on) return; cine.on = false; document.body.classList.remove('tkp-cine'); FX_POST.cineMeta = 0;
    if (cine.capa) { cine.capa.remove(); cine.capa = null; }
    if (c && cine.antes) { c.cam.distMeta = cine.antes.dist; c.camv.gradosMeta = cine.antes.grados; c.cam.meta.copy(cine.antes.meta); c.cam.suaveHasta = performance.now() + 1200; }
  }
  function moverCine(dt, c) {
    if (!cine.on) return;
    if (c.enMenu() || c.enMundo() || c.oleada()) { salirCine(); return; }
    c.camv.giroMeta += dt * 0.07; // giro lento alrededor de la ciudad
    var o = c.centro, t = tiempo * 0.05; c.cam.meta.set(o.x + Math.cos(t) * 6, 0, o.z + Math.sin(t) * 6);
    c.cam.distMeta = c.zoomBase() * (0.6 + Math.sin(tiempo * 0.09) * 0.12);
  }
  function botonCine() {
    if (document.getElementById('tkp-btn-cine')) return;
    var b = document.createElement('button'); b.id = 'tkp-btn-cine'; b.setAttribute('aria-label', L('Modo cine', 'Cinematic mode')); b.title = L('Modo cine', 'Cinematic mode');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 6h11a2 2 0 0 1 2 2v1.5l3.4-2.2A1 1 0 0 1 22 8.1v7.8a1 1 0 0 1-1.6.8L17 14.5V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg>';
    b.addEventListener('click', function (ev) { ev.stopPropagation(); entrarCine(); });
    document.body.appendChild(b); colocarBotonCine();
  }
  function colocarBotonCine() {
    var b = document.getElementById('tkp-btn-cine'), br = document.getElementById('brujula-cam'), c = C(); if (!b) return;
    var ver = !!(br && c && !c.enMenu() && !c.enMundo() && br.offsetParent !== null);
    b.style.display = ver ? '' : 'none'; if (!ver) return;
    var r = br.getBoundingClientRect(); b.style.left = Math.round(r.left + r.width / 2 - 18) + 'px'; b.style.top = Math.round(r.bottom + 10) + 'px';
  }

  // ======================================================================
  //  8. CELEBRACIONES (capa 2D encima de la interfaz: rayos dorados y confeti)
  // ======================================================================
  var lienzo = null, g2 = null, conf = [];
  function capa2D() {
    if (lienzo) return true; lienzo = document.createElement('canvas'); lienzo.id = 'tkp-celebra'; document.body.appendChild(lienzo); g2 = lienzo.getContext('2d');
    var med = function () { var d = Math.min(2, window.devicePixelRatio || 1); lienzo.width = innerWidth * d; lienzo.height = innerHeight * d; g2.setTransform(d, 0, 0, d, 0, 0); }; med(); window.addEventListener('resize', med); return true;
  }
  function confeti2D(n, x0, y0) {
    capa2D(); var cs = ['#f2c94c', '#e8434f', '#4fb4e8', '#6fd36b', '#ffffff', '#b07cff', '#ffb347'];
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 380 + Math.random() * 520; conf.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, c: cs[i % cs.length], t: 0, d: 2.2 + Math.random() * 1.2 }); }
  }
  function moverConfeti(dt) {
    if (!lienzo || (!conf.length && !lienzo.dataset.sucio)) return;
    g2.clearRect(0, 0, innerWidth, innerHeight); lienzo.dataset.sucio = conf.length ? '1' : '';
    for (var i = conf.length - 1; i >= 0; i--) {
      var p = conf[i]; p.t += dt; if (p.t > p.d || p.y > innerHeight + 30) { conf.splice(i, 1); continue; }
      p.vx *= Math.exp(-dt * 1.6); p.vy = p.vy * Math.exp(-dt * 1.6) + 620 * dt; p.x += p.vx * dt + Math.sin(p.t * 6 + i) * 30 * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      g2.save(); g2.globalAlpha = Math.min(1, (p.d - p.t) * 2); g2.translate(p.x, p.y); g2.rotate(p.r); g2.scale(1, Math.cos(p.t * 9 + i)); g2.fillStyle = p.c; g2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g2.restore();
    }
  }
  function rayosEn(cont, grande) {
    if (!cont || cont.querySelector('.tkp-rayos')) return;
    var r = document.createElement('div'); r.className = 'tkp-rayos' + (grande ? ' grande' : ''); cont.insertBefore(r, cont.firstChild);
  }

  // ======================================================================
  //  9. EVENTOS DEL JUEGO
  // ======================================================================
  function evento(tipo, d) {
    if (!listo) return; var esc = X() && X().escena; if (!esc) return; d = d || {};
    var p = d.pos ? d.pos.clone() : null; if (p && C()) p.y = C().alturaCiudad(p.x, p.z);
    if (tipo === 'obra' && p) { polvo(p, 46); chispasOro(p, 26, 3, 1.5); onda(p, 0xffe2a0, 7, 1.1); }
    else if (tipo === 'mejora' && p) {
      var gr = Math.min(1.6, 0.8 + (d.nivel || 1) / 20), colr = d.nivel >= 20 ? 0xc07cff : d.nivel >= 10 ? 0x7ec8ff : 0xffcf5a;
      columnaLuz(p, colr, 16 * gr, 2.6, 2.2); onda(p, colr, 9 * gr, 1.3); setTimeout(function () { onda(p, 0xffffff, 6 * gr, 0.9); }, 250);
      chispasOro(p, Math.round(60 * gr), 4.5, 2); espiral(p, Math.round(36 * gr), 6, colr); polvo(p, 24);
      FX_POST.flash = Math.max(FX_POST.flash, 0.06);
    }
    else if (tipo === 'nivelCastillo') {
      var cc = C() && C().castillo(), cp = cc ? new T3.Box3().setFromObject(cc).getCenter(new T3.Vector3()) : new T3.Vector3();
      var top = cc ? new T3.Box3().setFromObject(cc).max.y : 8; columnaLuz(new T3.Vector3(cp.x, 3, cp.z), 0xffd37a, 34, 9, 3); onda(new T3.Vector3(cp.x, 3, cp.z), 0xffd37a, 26, 1.8);
      [0xffcf5a, 0xe8434f, 0x7ec8ff, 0x6fd36b, 0xc07cff, 0xffcf5a, 0xffffff].forEach(function (k, i) { fuegoArtificial(new T3.Vector3(cp.x, top, cp.z), k, 0.3 + i * 0.45); });
      confeti2D(160, innerWidth / 2, innerHeight * 0.45);
      setTimeout(function () { rayosEn(document.getElementById('nivel-nuevo'), true); }, 0);
    }
    else if (tipo === 'recompensa') {
      var grande = (d.n || 0) >= 3; rayosEn(d.caja, grande);
      if (nivel !== 'baja') confeti2D(grande ? 130 : 70, innerWidth / 2, innerHeight * 0.5);
    }
  }

  // ======================================================================
  //  10. NIVELES DE CALIDAD Y AJUSTES
  // ======================================================================
  function aplicarNivel(n, manual) {
    if (!NIVELES[n]) return; nivel = n; pref.nivel = n; if (manual) pref.manual = 1; guardarPref();
    var x = X(); if (!x) return;
    var motor = n === 'baja' ? 'baja' : 'alta';
    if (x.calidad() !== motor) x.ponerCalidad(motor);
    if (manual) x.guardarPref('calidadElegida', 1);
    var r = x.render, c = C();
    if (r && motor === 'alta') { r.setPixelRatio(Math.min(window.devicePixelRatio || 1, n === 'media' ? 1.25 : (window.__topePx || 1.5))); r.setSize(innerWidth, innerHeight); }
    if (c && c.sol && motor === 'alta') { var ms = n === 'media' ? 1024 : n === 'ultra' && !ES_MOVIL ? 4096 : 2048; if (c.sol.shadow.mapSize.x !== ms) { c.sol.shadow.mapSize.set(ms, ms); if (c.sol.shadow.map) { c.sol.shadow.map.dispose(); c.sol.shadow.map = null; } } }
    if (!NIVELES[n].post) devolverTono();
    U.detalle.value = n === 'baja' ? 0 : 1;
    document.body.classList.toggle('tkp-baja', n === 'baja');
    if (PP) PP.clave = '';
    var esc = x.escena; if (esc && c) { crearAves(esc); vida.hechoDeco = '?'; crearDeco(c, esc); crearPatrullas(c, esc); crearCarros(c, esc); }
    if (esc && n === 'baja') esc.environment = null; else ENV.ult = -1;
  }
  function htmlAjustes() {
    var nom = { baja: L('Baja', 'Low'), media: L('Media', 'Medium'), alta: L('Alta', 'High'), ultra: 'Ultra' };
    var txt = { baja: L('Lo más rápido: sin efectos de luz.', 'Fastest: no lighting effects.'), media: L('Resplandor, sombras de nubes y color de cine.', 'Glow, cloud shadows and cinematic color.'), alta: L('Oclusión ambiental, luz volumétrica, más vida y vegetación.', 'Ambient occlusion, volumetric light, more life and plants.'), ultra: L('Todo al máximo (para teléfonos potentes).', 'Everything maxed (for powerful phones).') };
    var ciclo = pref.ciclo || 'real';
    return '<div class="carta tkp-ajustes"><h3>🎨 ' + L('Gráficos', 'Graphics') + '</h3><div class="stats tkp-niveles">' +
      ORDEN.map(function (k) { return '<button class="comprar' + (nivel === k ? ' tkp-sel' : ' morado') + '" data-accion="grafico" data-valor="' + k + '">' + nom[k] + '</button>'; }).join('') +
      '</div><p class="nota">' + txt[nivel || 'alta'] + (pref.manual ? '' : ' ' + L('(Se ajusta sola si el juego va lento.)', '(Adjusts itself if the game is slow.)')) + '</p>' +
      '<h3 style="margin-top:10px">🌗 ' + L('Día y noche', 'Day and night') + '</h3><div class="stats"><button class="comprar' + (ciclo === 'real' ? ' tkp-sel' : ' morado') + '" data-accion="ciclo" data-valor="real">' + L('Ciclo automático', 'Automatic cycle') + '</button><button class="comprar' + (ciclo === 'dia' ? ' tkp-sel' : ' morado') + '" data-accion="ciclo" data-valor="dia">' + L('Día permanente', 'Always day') + '</button><button class="comprar' + (ciclo === 'noche' ? ' tkp-sel' : ' morado') + '" data-accion="ciclo" data-valor="noche">' + L('Noche permanente', 'Always night') + '</button></div><p class="nota">' + L('Ciclo automático: 1 hora (amanecer 5 min, día 25, atardecer 5, noche 25), igual para todos los jugadores.', 'Automatic cycle: 1 hour (dawn 5 min, day 25, dusk 5, night 25), the same for every player.') + '</p>' +
      '<div class="stats" style="margin-top:8px"><button class="comprar naranja" data-accion="cine" data-valor="1">🎬 ' + L('Modo cine', 'Cinematic mode') + '</button></div></div>';
  }
  function accionAjustes(a, v) {
    if (a === 'grafico') aplicarNivel(v, true);
    else if (a === 'ciclo') { pref.ciclo = v === 'dia' || v === 'noche' ? v : 'real'; guardarPref(); aplicarCiclo(); }
    else if (a === 'cine') setTimeout(entrarCine, 350);
  }
  // calidad automática: baja un escalón si va lento (solo si no la elegiste tú)
  var med = { t0: 0, fotos: 0, lentas: 0, espera: 15 };
  function medirFps(dt) {
    var x = X(); if (!x || !x.activo() || pref.manual) { med.t0 = 0; return; }
    if (x.calidad() === 'baja' && nivel !== 'baja') { aplicarNivel('baja', false); return; } // la calidad automática del juego ya bajó
    med.espera -= dt; if (med.espera > 0) return;
    if (!med.t0) { med.t0 = performance.now(); med.fotos = 0; return; }
    med.fotos++; var s = (performance.now() - med.t0) / 1000; if (s < 4) return;
    var fps = med.fotos / s; med.t0 = 0;
    med.lentas = fps < 27 ? med.lentas + 1 : 0;
    if (med.lentas >= 2 && nivel !== 'baja') { var i = ORDEN.indexOf(nivel); aplicarNivel(ORDEN[Math.max(0, i - 1)], false); med.lentas = 0; med.espera = 6; x.consejo('⚙️ ' + L('Gráficos ajustados a ', 'Graphics set to ') + nivel.toUpperCase() + L(' para que el juego vaya fluido.', ' so the game runs smoothly.')); }
  }

  // ======================================================================
  //  11. ARRANQUE Y BUCLE
  // ======================================================================
  var revisaT = 0, ultEsc = null, revisaUlt = 0;
  function iniciar() {
    var x = X(), c = C(); if (!x || !c || !x.escena || !x.render) return false;
    if (!nivel) nivel = x.calidad() === 'baja' ? 'baja' : (ES_MOVIL ? 'alta' : 'ultra');
    PL = crearPool(2000, true); PS = crearPool(1400, false); x.escena.add(PL.p); x.escena.add(PS.p);
    listo = true; aplicarNivel(nivel, !!pref.manual); aplicarCiclo(); botonCine();
    document.body.classList.add('tkp-ui');
    return true;
  }
  function cadaFotograma(dt) {
    if (!listo && !iniciar()) return;
    var x = X(), c = C(), esc = x.escena; dt = Math.max(0, Math.min(0.05, dt || 0));
    tiempo += dt; U.t.value = tiempo;
    actualizarLuz(dt, esc, c);
    if (!x.activo() && !cine.on) { moverConfeti(dt); return; }
    medirFps(dt);
    var ahoraR = performance.now(); revisaT -= (ahoraR - (revisaUlt || ahoraR)) / 1000; revisaUlt = ahoraR; // tiempo real
    if (revisaT <= 0) {
      revisaT = 2; revisarMateriales(esc); colocarBotonCine();
      if (!vida.fuente) { var fp = buscarFuente(esc); if (fp) vida.fuente = { p: fp }; }
      crearDeco(c, esc); crearPatrullas(c, esc); crearCarros(c, esc); if (!vida.aves && N().aves) crearAves(esc); decorarCastillo(c, esc);
    }
    if (nivel !== 'baja') actualizarEntorno(esc, x.render);
    if (PL) PL.p.material.uniforms.uEsc.value = PS.p.material.uniforms.uEsc.value = x.render.domElement.height * x.camara.projectionMatrix.elements[5] * 0.5;
    moverPatrullas(dt, c); moverCarros(dt, c); moverAves(dt, c); moverFuente(dt); moverLlamas(dt); moverFuegos(dt);
    moverPool(PL, dt); moverPool(PS, dt); moverTemporales(dt, esc); moverCine(dt, c); moverConfeti(dt);
  }
  // se engancha al bucle de añadidos que ya existe (TKExtras, de js/tk-auto-calidad.js)
  (function enganchar() {
    if (!window.TKExtras) { window.TKExtras = { cadaFotograma: function () {} }; }
    var antes = TKExtras.cadaFotograma;
    TKExtras.cadaFotograma = function (dt) { antes(dt); try { cadaFotograma(dt); } catch (e) { if (!enganchar.av) { enganchar.av = 1; console.warn('TKPremium', e); } } };
  })();

  window.TKPremium = {
    _muro: function () { return vida.muro; }, _nivelN: function () { return N(); },
    dibujar: dibujar, evento: evento, enfoque: enfoque, htmlAjustes: htmlAjustes, accionAjustes: accionAjustes,
    zoomMinK: function () { return N().zoom; }, nivel: function () { return nivel; }, ponerNivel: function (n) { aplicarNivel(n, true); },
    cine: function (on) { if (on === false) salirCine(); else entrarCine(); },
    estado: function () { return { nivel: nivel, listo: listo, post: !!(N().post && !falloPost), falloPost: falloPost, hdr: PP ? PP.tipo === T3.HalfFloatType : null, patrullas: vida.patrullas.length, carros: vida.carros.length, aves: vida.aves ? vida.aves.l.length : 0, fuente: !!vida.fuente, deco: vida.deco ? vida.deco.reduce(function (a, m) { return a + m.count; }, 0) : 0, castillo: !!CAST.g, particulas: (PL ? PL.n : 0) + (PS ? PS.n : 0), entorno: !!(X() && X().escena && X().escena.environment), ciclo: pref.ciclo || 'real', cine: cine.on }; }
  };
})();
