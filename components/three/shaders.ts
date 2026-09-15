/**
 * Hyperrealistic Natural Wood Flame & Ember Shaders.
 *
 * Implements:
 * - 3D Divergence-free Curl Noise for natural fluid flame licking and convection.
 * - Simplex 3D noise for organic laminar-to-turbulent flame transition.
 * - Authentic Quebracho wood fire Blackbody palette: warm ivory core, honey amber body, fiery orange, deep ruby tips.
 * - Perfectly feathered alpha envelope (zero clipping, zero square box artifacts).
 * - Soft Gaussian ember sparks with radiative cooling.
 */

/* =========================================================================
   COMMON GLSL UTILITIES (Simplex Noise, 3D Curl Noise)
   ========================================================================= */

const GLSL_COMMON = /* glsl */ `
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // 3D Divergence-free Curl Noise for organic fluid eddies
  vec3 curlNoise(vec3 p) {
    const float e = 0.08;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    vec3 p1 = p;
    vec3 p2 = p + vec3(14.3, 31.6, 59.9);
    vec3 p3 = p + vec3(73.7, 49.4, 18.1);

    float n1_y = (snoise(p1 + dy) - snoise(p1 - dy));
    float n1_z = (snoise(p1 + dz) - snoise(p1 - dz));

    float n2_x = (snoise(p2 + dx) - snoise(p2 - dx));
    float n2_z = (snoise(p2 + dz) - snoise(p2 - dz));

    float n3_x = (snoise(p3 + dx) - snoise(p3 - dx));
    float n3_y = (snoise(p3 + dy) - snoise(p3 - dy));

    return vec3(n3_y - n2_z, n1_z - n3_x, n2_x - n1_y) / (2.0 * e);
  }

  // 4-octave smooth FBM
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(50.0);
    for (int i = 0; i < 4; ++i) {
      v += a * (0.5 + 0.5 * snoise(p));
      p = p * 2.04 + shift;
      a *= 0.5;
    }
    return v;
  }

  // Authentic Natural Wood-Fire Color Palette
  vec3 getNaturalFlameColor(float t) {
    // Natural wood flame spectrum:
    vec3 cEmberAsh   = vec3(0.35, 0.06, 0.02);  // Deep ruby ember base/edges
    vec3 cRubyRed    = vec3(0.78, 0.14, 0.03);  // Rich red
    vec3 cFieryOrange= vec3(0.96, 0.38, 0.06);  // Saturated warm orange
    vec3 cGoldenAmber= vec3(1.00, 0.68, 0.16);  // Luminous honey amber
    vec3 cWarmIvory  = vec3(1.00, 0.94, 0.76);  // Soft incandescent core

    vec3 col = cEmberAsh;
    col = mix(col, cRubyRed,     smoothstep(0.05, 0.28, t));
    col = mix(col, cFieryOrange, smoothstep(0.28, 0.55, t));
    col = mix(col, cGoldenAmber, smoothstep(0.55, 0.82, t));
    col = mix(col, cWarmIvory,   smoothstep(0.82, 1.00, t));
    return col;
  }
`;

/* =========================================================================
   1. MAIN VOLUMETRIC FLAME SHADER
   ========================================================================= */

export const FLAME_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;
  uniform float uSeed;
  uniform float uBaseY;
  uniform float uHeight;
  uniform sampler2D uCenter;

  varying float vV;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec3 vNormalVec;
  varying float vNoise;
  varying float vFacing;

  ${GLSL_COMMON}

  void main() {
    float v = clamp((position.y - uBaseY) / uHeight, 0.0, 1.0);

    // Natural buoyant flow speed
    float flowSpeed = 0.95 + uHeat * 0.75;
    float t = uTime * flowSpeed + uSeed * 2.3;

    // Gentle height pulsation (breathing fire)
    float heightPulse = 1.0 + sin(t * 1.6 + v * 3.0) * (0.04 + 0.06 * uHeat);
    float flameH = uHeight * (1.0 + uHeat * 0.14) * heightPulse;
    float y = uBaseY + v * flameH;

    // Cross section & center line
    float cOff = (texture2D(uCenter, vec2(v, 0.5)).r - 0.5) * 2.0;
    vec2 h = position.xz;
    float r = length(h);
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    // Smooth fluid curl displacement
    vec3 curlCoord = vec3(position.x * 1.2 + cOff, (y - uBaseY) * 1.4 - t * 1.1, position.z * 1.2);
    vec3 curl = curlNoise(curlCoord);

    // Amplitude: rooted at base (v=0), swaying gracefully up to the tip
    float amp = smoothstep(0.05, 0.95, v) * (0.06 + 0.10 * uHeat);
    float tipAmp = smoothstep(0.55, 1.0, v) * (0.12 + 0.18 * uHeat);

    // Natural width expansion & lick variation
    float n = fbm(vec3(position.x * 2.0, y * 1.8 - t * 1.3, position.z * 2.0));
    float wScale = 1.0 + (n - 0.5) * (0.45 + 0.55 * uHeat) * smoothstep(0.1, 0.9, v);
    vec2 ring = dir * r * wScale;
    ring.y *= 0.72; // Subtle depth oval

    // Displaced position
    vec3 pos = vec3(ring.x + cOff, y, ring.y);
    pos += curl * amp;
    pos.x += curl.x * tipAmp;
    pos.z += curl.z * tipAmp * 0.7;

    // Gentle natural flame lick sway
    pos.x += sin(t * 1.8 + v * 4.0) * (0.03 + 0.05 * uHeat) * smoothstep(0.6, 1.0, v);

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vViewDir = normalize(cameraPosition - world.xyz);
    vNormalVec = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vV = v;
    vNoise = n;
    vFacing = pow(max(dot(vNormalVec, vViewDir), 0.0), 0.5);

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FLAME_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uHeat;
  uniform float uTime;
  uniform float uSeed;

  varying float vV;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec3 vNormalVec;
  varying float vNoise;
  varying float vFacing;

  ${GLSL_COMMON}

  void main() {
    float v = vV;
    float flowSpeed = 0.95 + uHeat * 0.75;
    float t = uTime * flowSpeed + uSeed * 2.3;

    // 3D procedural internal flame turbulence
    vec3 microCoord = vec3(vWorldPos.x * 3.6, vWorldPos.y * 3.2 - t * 1.4, vWorldPos.z * 3.6);
    float microNoise = fbm(microCoord);

    // Temperature field (1.0 = warm ivory core, 0.0 = deep ruby ember edge)
    float centerDist = clamp(length(vWorldPos.xz) * 1.3, 0.0, 1.0);
    float temp = (1.0 - v * 0.72) * 0.65
               + (1.0 - centerDist) * 0.45
               + (microNoise - 0.5) * 0.35
               + (uHeat * 0.22);
    temp = clamp(temp, 0.0, 1.0);

    // Natural wood fire color
    vec3 col = getNaturalFlameColor(temp);

    // Volumetric translucency & gentle glow
    float gasDepth = 0.75 + 0.35 * vFacing;
    col *= gasDepth * (1.0 + uHeat * 0.35);

    // Soft, perfectly feathered envelope (GUARANTEES zero square/hard edge clipping)
    // 1. Bottom feathering (smoothly emerges from darkness)
    float baseFade = smoothstep(0.0, 0.12, v);
    // 2. Top feathering (smoothly dissolves into air)
    float topFade = 1.0 - smoothstep(0.78, 0.98, v);
    // 3. Flame lick tongue erosion at the tip
    float tongueErosion = smoothstep(0.2, 0.8, microNoise + (1.0 - v) * 0.4);

    float alpha = baseFade * topFade * tongueErosion * (0.85 + 0.15 * vFacing) * uReveal;

    // Discard only below a negligible threshold with smooth blend
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* =========================================================================
   2. SOFT INNER INCANDESCENT CORE SHADER
   ========================================================================= */

export const FLAME_CORE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;
  uniform float uSeed;
  uniform float uBaseY;
  uniform float uHeight;
  uniform sampler2D uCenter;

  varying float vV;
  varying vec3 vWorldPos;
  varying float vFacing;

  ${GLSL_COMMON}

  void main() {
    float v = clamp((position.y - uBaseY) / uHeight, 0.0, 1.0);
    float flowSpeed = 1.1 + uHeat * 0.8;
    float t = uTime * flowSpeed + uSeed;

    float flameH = uHeight * 0.82 * (1.0 + uHeat * 0.12);
    float y = uBaseY + v * flameH;

    float cOff = (texture2D(uCenter, vec2(v, 0.5)).r - 0.5) * 1.8;
    vec2 h = position.xz;
    float r = length(h) * 0.55; // Concentrated soft core
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    vec3 curl = curlNoise(vec3(position.x * 1.4, y * 1.6 - t * 1.2, position.z * 1.4));
    float amp = smoothstep(0.08, 0.92, v) * (0.04 + 0.06 * uHeat);

    vec3 pos = vec3(dir.x * r + cOff, y, dir.y * r * 0.7);
    pos += curl * amp;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vec3 vViewDir = normalize(cameraPosition - world.xyz);
    vFacing = pow(max(dot(normalize((modelMatrix * vec4(normal, 0.0)).xyz), vViewDir), 0.0), 0.6);
    vV = v;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FLAME_CORE_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uHeat;

  varying float vV;
  varying float vFacing;

  void main() {
    float v = vV;

    // Warm luminous honey-gold core
    vec3 cWarmCore = vec3(1.00, 0.88, 0.48);
    vec3 cIvory    = vec3(1.00, 0.96, 0.82);

    float coreTemp = (1.0 - v * 0.85) * (0.6 + 0.4 * vFacing);
    vec3 col = mix(cWarmCore, cIvory, smoothstep(0.4, 0.95, coreTemp));
    col *= (1.1 + uHeat * 0.35);

    // Soft feathered fade
    float alpha = smoothstep(0.0, 0.15, v) * (1.0 - smoothstep(0.65, 0.95, v)) * 0.55 * uReveal;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* =========================================================================
   3. ELEGANT EMBER SPARKS WITH GAUSSIAN CIRCULAR FALLOFF
   ========================================================================= */

export const SPARK_VERTEX = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  attribute float aTint;

  uniform float uPointScale;

  varying float vLife;
  varying float vTint;

  void main() {
    vLife = aLife;
    vTint = aTint;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float baseSize = aSize * uPointScale / max(0.1, -mv.z);
    float size = aLife > 0.0 ? baseSize * (0.65 + 0.35 * smoothstep(0.0, 0.3, aLife)) : 0.0;

    gl_PointSize = clamp(size, 1.0, 32.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const SPARK_FRAGMENT = /* glsl */ `
  varying float vLife;
  varying float vTint;

  void main() {
    if (vLife <= 0.0) discard;

    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // Smooth Gaussian circular falloff (ensures zero square artifacts)
    if (d > 0.5) discard;
    float circle = smoothstep(0.5, 0.0, d);
    circle = circle * circle;
    float core = smoothstep(0.15, 0.0, d);

    // Warm embers cooling: honey gold -> warm orange -> ruby cinder
    vec3 cGold   = vec3(1.00, 0.84, 0.38);
    vec3 cOrange = vec3(0.96, 0.48, 0.10);
    vec3 cRuby   = vec3(0.68, 0.12, 0.03);

    vec3 col = mix(cRuby, cOrange, smoothstep(0.0, 0.45, vLife));
    col = mix(col, cGold, smoothstep(0.45, 0.90, vLife));
    col = mix(col, vec3(1.0, 0.98, 0.90), core * 0.6);

    float alpha = circle * pow(vLife, 0.7);
    gl_FragColor = vec4(col * (1.0 + core * 0.5), alpha);
  }
`;

/* =========================================================================
   4. LOADER SCENE EMBER PARTICLES (Smooth & Fast)
   ========================================================================= */

export const LOADER_VERTEX = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute vec3 aScatter;
  attribute float aDelay;
  attribute float aSize;
  attribute float aTint;

  uniform float uAssemble;
  uniform float uDisperse;
  uniform float uTime;
  uniform float uPointScale;

  varying float vAlpha;
  varying float vProgress;

  void main() {
    float p = clamp((uAssemble - aDelay * 0.35) / 0.65, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vProgress = p;

    vec3 pos = mix(aStart, aTarget, p);
    pos += aScatter * (uDisperse * uDisperse * 1.2);

    float floatAmt = (1.0 - p * 0.6) * (1.0 - uDisperse);
    pos.x += sin(uTime * 1.2 + aDelay * 20.0) * 0.02 * floatAmt;
    pos.y += cos(uTime * 1.4 + aDelay * 15.0) * 0.025 * floatAmt;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vAlpha = (0.75 + 0.25 * p) * (1.0 - uDisperse * uDisperse * 0.95);

    gl_PointSize = clamp(aSize * uPointScale / max(0.1, -mv.z) * (0.8 + 0.5 * p), 1.0, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const LOADER_FRAGMENT = /* glsl */ `
  uniform float uFade;

  varying float vAlpha;
  varying float vProgress;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    float core = smoothstep(0.15, 0.0, d);

    vec3 cGold  = vec3(1.00, 0.78, 0.28);
    vec3 cEmber = vec3(0.92, 0.38, 0.08);

    vec3 col = mix(cEmber, cGold, vProgress * 0.7 + core * 0.3);
    float alpha = glow * vAlpha * uFade;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col * (1.0 + core * 0.4), alpha);
  }
`;
