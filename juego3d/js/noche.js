// =====================================================================
//  NOCHE: cielo estrellado con luna, montañas con nieve, luces y niebla.
//  Solo visual: no toca reglas, datos ni guardado del juego.
// =====================================================================
window.NOCHE = (function () {
  'use strict';

  // ---------- cielo: degradado + estrellas + vía láctea + luna con halo ----------
  var GLSL_RUIDO = [
    'float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float rv(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * rv(p); p *= 2.03; a *= 0.5; } return v; }'
  ].join('\n');

  function materialCielo(arriba, horizonte) {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        arriba: { value: new THREE.Color(arriba || 0x050a1a) },
        horizonte: { value: new THREE.Color(horizonte || 0x16223f) },
        noche: { value: 1 },
        tiempo: { value: 0 },
        lunaDir: { value: new THREE.Vector3(0.6, 0.35, 0.7).normalize() }
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP,1.0); }',
      fragmentShader: [
        'uniform vec3 arriba; uniform vec3 horizonte; uniform float noche; uniform float tiempo; uniform vec3 lunaDir; varying vec3 vP;',
        GLSL_RUIDO,
        'void main(){',
        '  vec3 d = normalize(vP - cameraPosition);',
        '  float h = clamp(d.y * 1.6 + 0.1, 0.0, 1.0);',
        '  vec3 col = mix(horizonte, arriba, h);',
        '  vec2 uv = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));',
        // vía láctea: banda inclinada con polvo oscuro
        '  vec3 eje = normalize(vec3(0.35, 0.55, -0.76));',
        '  float banda = exp(-pow(dot(d, eje) * 3.2, 2.0));',
        '  float polvo = fbm(uv * 6.0 + 3.0), nube = fbm(uv * 3.0 - 7.0);',
        '  vec3 via = mix(vec3(0.18, 0.2, 0.42), vec3(0.42, 0.34, 0.55), nube) * banda * smoothstep(0.25, 0.85, nube) * (1.0 - smoothstep(0.45, 0.75, polvo) * 0.7);',
        // estrellas en tres tamaños; parpadean un poco
        '  float est = 0.0;',
        '  for (int c = 0; c < 3; c++) {',
        '    float esc = 90.0 + float(c) * 110.0;',
        '    vec2 g = uv * esc, id = floor(g), f = fract(g) - 0.5;',
        '    float r = h21(id + float(c) * 17.0);',
        '    float umbral = 0.985 - banda * 0.03 - float(c) * 0.004;',
        '    if (r > umbral) {',
        '      vec2 o = vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5;',
        '      float s = smoothstep(0.22 - float(c) * 0.05, 0.0, length(f - o * 0.5));',
        '      est += s * (0.55 + 0.45 * sin(tiempo * (1.5 + r * 4.0) + r * 60.0)) * (1.2 - float(c) * 0.3);',
        '    }',
        '  }',
        '  est *= smoothstep(-0.02, 0.2, d.y);',
        '  vec3 colEst = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.92, 0.78), h21(floor(uv * 90.0)));',
        // luna grande, con mares y halo azulado
        '  float m = dot(d, lunaDir);',
        '  float disco = smoothstep(0.99955, 0.99972, m);',
        '  vec3 t1 = normalize(cross(lunaDir, vec3(0.0, 1.0, 0.0))), t2 = cross(t1, lunaDir);',
        '  vec2 lu = vec2(dot(d, t1), dot(d, t2)) * 60.0;',
        '  float mares = fbm(lu * 1.6 + 2.0);',
        '  vec3 colLuna = mix(vec3(1.0, 0.98, 0.92), vec3(0.62, 0.66, 0.74), smoothstep(0.45, 0.75, mares));',
        '  colLuna *= 0.85 + 0.15 * smoothstep(-1.0, 0.4, dot(lu, vec2(-0.6, 0.5)) / 1.4);',
        '  float halo = pow(max(m, 0.0), 900.0) * 0.55 + pow(max(m, 0.0), 60.0) * 0.18 + pow(max(m, 0.0), 8.0) * 0.06;',
        '  vec3 noct = via * 0.9 + colEst * est * (1.0 - disco) + vec3(0.55, 0.68, 1.0) * halo;',
        '  col += noct * noche;',
        '  col = mix(col, colLuna, disco * noche);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
  }

  // ---------- montaña: varios picos, roca oscura, nieve con luz de luna ----------
  var geoPicoCache = {};
  function ruido3(x, y, z) { var s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); }
  function geoPico(variante) {
    variante = variante || 0;
    if (geoPicoCache[variante]) return geoPicoCache[variante];
    var g = new THREE.ConeGeometry(0.85, 1.75, 11, 7, false);
    var p = g.attributes.position, cols = [], c = new THREE.Color();
    var roca = new THREE.Color(0x232a36), rocaAlta = new THREE.Color(0x3b4456), nieve = new THREE.Color(0xdfe8ff), sombraNieve = new THREE.Color(0x8394c0);
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = (y + 0.875) / 1.75;
      if (k < 0.995) {
        var ang = Math.atan2(z, x);
        // crestas y quebradas: el radio sube y baja alrededor del pico
        var cresta = 1 + Math.sin(ang * 3 + variante * 1.7) * 0.16 + Math.sin(ang * 7 + variante) * 0.08 + (ruido3(x * 5, y * 5, z * 5 + variante) - 0.5) * 0.28;
        p.setX(i, x * cresta); p.setZ(i, z * cresta);
        p.setY(i, y + (ruido3(x * 9 + variante, z * 9, y) - 0.5) * 0.12 * (1 - k));
      } else {
        p.setX(i, x + (variante - 1) * 0.04);
      }
      var lado = (x * -0.6 + z * 0.8) / 0.85;
      var limiteNieve = 0.6 + Math.sin(Math.atan2(z, x) * 5 + variante) * 0.07 + (ruido3(x * 7, z * 7, variante) - 0.5) * 0.1;
      if (k > limiteNieve) { c.copy(sombraNieve).lerp(nieve, Math.max(0, Math.min(1, 0.45 + lado * 0.55))); }
      else { c.copy(roca).lerp(rocaAlta, k * 0.9 + Math.max(0, lado) * 0.25); }
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    geoPicoCache[variante] = g;
    return g;
  }

  // ---------- texturas de brillo y bruma ----------
  function texRadial(stops) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var x = cv.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }
  var texFuego = texRadial([[0, 'rgba(255,236,190,1)'], [0.18, 'rgba(255,178,80,.75)'], [0.5, 'rgba(255,120,30,.18)'], [1, 'rgba(255,90,20,0)']]);
  var texLuz = texRadial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  var texBruma = (function () {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var x = cv.getContext('2d');
    for (var i = 0; i < 14; i++) {
      var cx = 30 + Math.random() * 68, cy = 40 + Math.random() * 48, r = 18 + Math.random() * 26;
      var gr = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(cv);
  })();

  function matFuego(opacidad) { return new THREE.SpriteMaterial({ map: texFuego, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: opacidad === undefined ? 0.9 : opacidad, fog: false }); }
  function brillo(tam, opacidad) { var s = new THREE.Sprite(matFuego(opacidad)); s.scale.set(tam, tam, 1); return s; }

  // nube de puntos que brillan (luces de aldeas, fogatas, luciérnagas)
  function puntosLuz(lista, color, tam, opacidad) {
    var pos = [];
    lista.forEach(function (q) { pos.push(q[0], q[1], q[2]); });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({ map: color === 'fuego' ? texFuego : texLuz, color: color === 'fuego' ? 0xffffff : color, size: tam, sizeAttenuation: true, transparent: true, opacity: opacidad, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    var pt = new THREE.Points(g, m); pt.renderOrder = 4;
    return pt;
  }

  // bancos de niebla bajos que se mueven despacio
  function bruma(escena, lado, cuantas, alto) {
    var grupo = new THREE.Group(), mt = new THREE.SpriteMaterial({ map: texBruma, color: 0x8fa2d6, transparent: true, opacity: 0.55, depthWrite: false, fog: true });
    for (var i = 0; i < cuantas; i++) {
      var s = new THREE.Sprite(mt), t = 7 + Math.random() * 9;
      s.scale.set(t * 1.8, t, 1);
      s.position.set((Math.random() - 0.5) * lado, alto + Math.random() * 0.8, (Math.random() - 0.5) * lado);
      s.userData.v = 0.15 + Math.random() * 0.25;
      grupo.add(s);
    }
    grupo.userData.lado = lado;
    escena.add(grupo);
    return grupo;
  }
  function moverBruma(grupo, dt) {
    if (!grupo) return;
    var l = grupo.userData.lado / 2;
    grupo.children.forEach(function (s) { s.position.x += s.userData.v * dt; if (s.position.x > l) s.position.x = -l; });
  }

  return {
    materialCielo: materialCielo, geoPico: geoPico, brillo: brillo, matFuego: matFuego,
    puntosLuz: puntosLuz, bruma: bruma, moverBruma: moverBruma
  };
})();
