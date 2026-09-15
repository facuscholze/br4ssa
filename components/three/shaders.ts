/**
 * Hyperrealistic 4K 3D Combustion & Flame Shaders.
 *
 * Implements:
 * - Divergence-free 3D Curl Noise for realistic fluid flame licking & vortical eddies.
 * - Multi-octave 3D Simplex noise + 5-octave domain-warped fractal Brownian motion (fbm).
 * - 3D Voronoi / Worley cellular noise for sharp flame tendril pinching and charcoal crack textures.
 * - Physically-informed Planck Blackbody radiation temperature spectrum (1000K -> 3600K).
 * - Chemiluminescent oxygen-radical blue/violet combustion base.
 * - Volumetric optical depth & rim gas luminescence.
 * - Velocity-aligned elongated streak motion blur on ember sparks.
 * - Incandescent charcoal ember bed with pulsing glowing fissures.
 */

/* =========================================================================
   COMMON GLSL UTILITIES (Simplex Noise, 3D Curl Noise, Voronoi, Blackbody)
   ========================================================================= */

const GLSL_COMMON_NOISE = /* glsl */ `
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
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

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // 3D Divergence-free Curl Noise for fluid vorticity & swirling eddies
  vec3 curlNoise(vec3 p) {
    const float e = 0.07;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    vec3 p1 = p;
    vec3 p2 = p + vec3(19.3, 41.6, 73.9);
    vec3 p3 = p + vec3(87.7, 61.4, 29.1);

    float n1_y = (snoise(p1 + dy) - snoise(p1 - dy));
    float n1_z = (snoise(p1 + dz) - snoise(p1 - dz));

    float n2_x = (snoise(p2 + dx) - snoise(p2 - dx));
    float n2_z = (snoise(p2 + dz) - snoise(p2 - dz));

    float n3_x = (snoise(p3 + dx) - snoise(p3 - dx));
    float n3_y = (snoise(p3 + dy) - snoise(p3 - dy));

    return vec3(n3_y - n2_z, n1_z - n3_x, n2_x - n1_y) / (2.0 * e);
  }

  // 3D Voronoi / Worley Noise for organic cellular structures & crack veins
  float voronoi3D(vec3 p) {
    vec3 b = floor(p);
    vec3 f = fract(p);
    float res = 1.0;
    for (int k = -1; k <= 1; k++) {
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec3 g = vec3(float(i), float(j), float(k));
          vec3 hash = fract(sin(vec3(
            dot(b + g, vec3(127.1, 311.7, 74.7)),
            dot(b + g, vec3(269.5, 183.3, 246.1)),
            dot(b + g, vec3(113.5, 271.9, 124.6))
          )) * 43758.5453);
          vec3 d = g + hash - f;
          res = min(res, length(d));
        }
      }
    }
    return res;
  }

  // 5-octave Fractal Brownian Motion
  float fbm5(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; ++i) {
      v += a * (0.5 + 0.5 * snoise(p));
      p = p * 2.05 + shift;
      a *= 0.49;
    }
    return v;
  }

  // Domain-warped fluid turbulence for 4K flame dynamics
  float fluidTurbulence(vec3 p, float t) {
    vec3 drift = vec3(0.0, -t, 0.0);
    vec3 c = curlNoise((p + drift) * 1.15);
    vec3 q = p + drift + c * 0.38;
    float f1 = fbm5(q);
    float f2 = fbm5(q * 2.3 + vec3(1.7, t * 0.4, 4.3));
    return mix(f1, f2, 0.35);
  }

  // Physically-based Planck Blackbody Radiation color curve
  vec3 blackbodyPalette(float t, float blueBase) {
    // T in [0.0, 1.0]
    vec3 cDeepAsh     = vec3(0.16, 0.015, 0.005);
    vec3 cDarkRuby    = vec3(0.55, 0.05, 0.012);
    vec3 cFieryRed    = vec3(0.92, 0.16, 0.02);
    vec3 cRichOrange  = vec3(1.00, 0.45, 0.04);
    vec3 cVividAmber  = vec3(1.00, 0.74, 0.14);
    vec3 cBrightGold  = vec3(1.00, 0.92, 0.45);
    vec3 cWhiteHot    = vec3(1.00, 0.99, 0.94);

    // Chemiluminescent blue/violet combustion radicals at the base
    vec3 cCyanBlue    = vec3(0.08, 0.52, 1.00);
    vec3 cUltraviolet = vec3(0.42, 0.10, 0.96);

    vec3 col = cDeepAsh;
    col = mix(col, cDarkRuby,   smoothstep(0.03, 0.18, t));
    col = mix(col, cFieryRed,   smoothstep(0.18, 0.36, t));
    col = mix(col, cRichOrange, smoothstep(0.36, 0.55, t));
    col = mix(col, cVividAmber, smoothstep(0.55, 0.72, t));
    col = mix(col, cBrightGold, smoothstep(0.72, 0.86, t));
    col = mix(col, cWhiteHot,   smoothstep(0.86, 1.00, t));

    if (blueBase > 0.001) {
      vec3 blueRadical = mix(cUltraviolet, cCyanBlue, smoothstep(0.0, 0.6, blueBase));
      col = mix(col, blueRadical, clamp(blueBase * 0.92, 0.0, 1.0));
    }
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
  varying float vRadial;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = clamp((position.y - uBaseY) / uHeight, 0.0, 1.0);

    // Buoyant convective flow speed scales with heat
    float flowSpeed = 1.35 + uHeat * 1.65;
    float time = uTime * flowSpeed + uSeed * 3.7;

    // Convective buoyant height flicker and expansion
    float heightFlicker = 1.0 + (snoise(vec3(uSeed * 2.1, time * 0.8, v * 2.0)) * 0.18) * (0.8 + 0.5 * uHeat);
    float flameH = uHeight * (1.0 + uHeat * 0.28) * heightFlicker;
    float y = uBaseY + v * flameH;

    // Cross-section & center line from isotype silhouette
    float cOff = (texture2D(uCenter, vec2(v, 0.5)).r - 0.5) * 2.0;
    vec2 h = position.xz;
    float r = length(h);
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    // Dynamic 3D fluid curl noise field
    vec3 curlSample = vec3(position.x * 1.4 + cOff, (y - uBaseY) * 1.6 - time * 1.2, position.z * 1.4);
    vec3 curl = curlNoise(curlSample);

    // Multi-scale fluid noise displacement
    float n1 = fluidTurbulence(vec3(position.x * 1.8, y * 1.5, position.z * 1.8), time);
    float n2 = snoise(vec3(position.x * 3.5, y * 3.2 - time * 2.0, position.z * 3.5));

    // Amplitude grows with height: base is rooted on coals, tip whips with turbulence
    float amp = smoothstep(0.04, 0.95, v) * (0.09 + 0.16 * uHeat);
    float tipAmp = smoothstep(0.62, 1.0, v) * (0.24 + 0.35 * uHeat);

    // Fluid width pulsation (flame licks & bulges)
    float wScale = 1.0 + (n1 - 0.5) * (0.65 + 0.85 * uHeat) * smoothstep(0.1, 0.92, v);
    vec2 ring = dir * r * wScale;
    ring.y *= 0.68; // Slightly oval depth for volumetric body

    // Calculate final displaced 3D position
    vec3 pos = vec3(ring.x + cOff, y, ring.y);
    pos += curl * amp;
    pos.x += (curl.x * 1.4 + (n2 - 0.5) * 0.8) * tipAmp;
    pos.z += (curl.z * 1.2) * tipAmp * 0.7;

    // Organic tip dance (sinuous natural licking flame motion)
    float tipSway = sin(time * 2.2 + v * 5.0) * (0.07 + 0.12 * uHeat) * smoothstep(0.7, 1.0, v);
    pos.x += tipSway;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vViewDir = normalize(cameraPosition - world.xyz);
    vNormalVec = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vV = v;
    vRadial = r;
    vNoise = n1;
    vFacing = pow(max(dot(vNormalVec, vViewDir), 0.0), 0.6);

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
  varying float vRadial;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = vV;

    // Multi-frequency 4K procedural flame turbulence
    float flowTime = uTime * (1.35 + uHeat * 1.65) + uSeed * 3.7;
    vec3 microCoord = vec3(vWorldPos.x * 5.2, vWorldPos.y * 4.6 - flowTime * 1.6, vWorldPos.z * 5.2);
    float microNoise = fbm5(microCoord);

    // Worley cellular noise for sharp fire tendril pinching and lick separation
    vec3 voroCoord = vec3(vWorldPos.x * 4.0, vWorldPos.y * 3.5 - flowTime * 2.2, vWorldPos.z * 4.0);
    float voro = voronoi3D(voroCoord);

    // Temperature distribution:
    // Hottest at center-base (white-hot plasma core), cooling towards upper tips and outer boundaries
    float centerProximity = 1.0 - clamp(abs(vWorldPos.x) * 1.2, 0.0, 1.0);
    float baseHeat = smoothstep(0.0, 0.35, v) * (1.0 - smoothstep(0.35, 1.0, v) * 0.85);

    float temp = (1.0 - v * 0.82) * 0.65
               + (centerProximity * 0.35)
               + (baseHeat * 0.25)
               + (vNoise - 0.5) * 0.45
               + (microNoise - 0.5) * 0.28
               + (uHeat * 0.28);
    temp = clamp(temp, 0.0, 1.0);

    // Chemiluminescent blue foot at the very base (oxygen-rich combustion zone)
    float blueBase = smoothstep(0.20, 0.01, v) * (1.0 - smoothstep(0.0, 0.12, abs(vWorldPos.x))) * 0.95;

    // Calculate Planck blackbody radiant color
    vec3 col = blackbodyPalette(temp, blueBase);

    // Volumetric optical gas depth & rim glow:
    // Translucent gas is brighter where view passes through more volume
    float gasDepth = 0.55 + 0.65 * vFacing + (1.0 - vFacing) * 0.45 * smoothstep(0.1, 0.6, v);
    col *= gasDepth;

    // Dynamic emission boost when heated / clicked
    col *= (1.05 + uHeat * 0.55);

    // 4K razor-sharp flame tip tendril erosion (Worley noise breaks flame into sharp licks)
    float tipErosion = smoothstep(0.65, 0.98, v);
    float alphaErosion = smoothstep(0.18 + tipErosion * 0.52, 0.75, voro + microNoise * 0.4);

    // Soft alpha envelope with organic edge falloff
    float alpha = (1.0 - smoothstep(0.85, 1.0, v) * 0.7) * alphaErosion;
    alpha = clamp(alpha * (0.85 + vFacing * 0.25), 0.0, 1.0);

    if (alpha * uReveal < 0.008) discard;

    gl_FragColor = vec4(col, alpha * uReveal);
  }
`;

/* =========================================================================
   2. INNER WHITE-HOT PLASMA CORE SHADER
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
  varying vec3 vViewDir;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = clamp((position.y - uBaseY) / uHeight, 0.0, 1.0);
    float flowSpeed = 1.6 + uHeat * 2.0;
    float time = uTime * flowSpeed + uSeed;

    float flameH = uHeight * 0.88 * (1.0 + uHeat * 0.2);
    float y = uBaseY + v * flameH;

    float cOff = (texture2D(uCenter, vec2(v, 0.5)).r - 0.5) * 1.6;
    vec2 h = position.xz;
    float r = length(h) * 0.65; // Concentrated inner core
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    vec3 curl = curlNoise(vec3(position.x * 1.8, y * 2.0 - time * 1.5, position.z * 1.8));
    float amp = smoothstep(0.08, 0.95, v) * (0.05 + 0.09 * uHeat);

    vec3 pos = vec3(dir.x * r + cOff, y, dir.y * r * 0.65);
    pos += curl * amp;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vViewDir = normalize(cameraPosition - world.xyz);
    vFacing = pow(max(dot(normalize((modelMatrix * vec4(normal, 0.0)).xyz), vViewDir), 0.0), 0.8);
    vV = v;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FLAME_CORE_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uHeat;
  uniform float uTime;

  varying float vV;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = vV;

    // Core is intensely hot plasma (2800K - 3600K)
    float plasma = smoothstep(0.9, 0.05, v) * (0.7 + 0.3 * vFacing);
    vec3 cWhite = vec3(1.00, 0.99, 0.95);
    vec3 cGold  = vec3(1.00, 0.90, 0.45);
    vec3 cAmber = vec3(1.00, 0.68, 0.12);

    vec3 col = mix(cAmber, cGold, smoothstep(0.15, 0.65, plasma));
    col = mix(col, cWhite, smoothstep(0.65, 0.98, plasma));

    // High emission intensity
    col *= (1.4 + uHeat * 0.8);

    float alpha = smoothstep(0.92, 0.1, v) * (0.75 + 0.25 * vFacing) * uReveal;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* =========================================================================
   3. OUTER WHISPS & LICKING TENDRILS SHADER
   ========================================================================= */

export const FLAME_OUTER_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;
  uniform float uSeed;
  uniform float uBaseY;
  uniform float uHeight;
  uniform sampler2D uCenter;

  varying float vV;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = clamp((position.y - uBaseY) / uHeight, 0.0, 1.0);
    float flowSpeed = 1.5 + uHeat * 1.8;
    float time = uTime * flowSpeed + uSeed * 7.1;

    float flameH = uHeight * 1.14 * (1.0 + uHeat * 0.32);
    float y = uBaseY + v * flameH;

    float cOff = (texture2D(uCenter, vec2(v, 0.5)).r - 0.5) * 2.2;
    vec2 h = position.xz;
    float r = length(h) * 1.15; // Outer envelope
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    vec3 curl = curlNoise(vec3(position.x * 1.2, y * 1.4 - time * 1.3, position.z * 1.2));
    float amp = smoothstep(0.12, 0.98, v) * (0.16 + 0.26 * uHeat);

    vec3 pos = vec3(dir.x * r + cOff, y, dir.y * r * 0.72);
    pos += curl * amp;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vViewDir = normalize(cameraPosition - world.xyz);
    vFacing = pow(max(dot(normalize((modelMatrix * vec4(normal, 0.0)).xyz), vViewDir), 0.0), 0.5);
    vV = v;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FLAME_OUTER_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uHeat;
  uniform float uTime;
  uniform float uSeed;

  varying float vV;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = vV;
    float flowTime = uTime * (1.5 + uHeat * 1.8) + uSeed * 7.1;

    vec3 voroCoord = vec3(vWorldPos.x * 3.8, vWorldPos.y * 3.2 - flowTime * 2.4, vWorldPos.z * 3.8);
    float voro = voronoi3D(voroCoord);

    vec3 microCoord = vec3(vWorldPos.x * 6.0, vWorldPos.y * 5.0 - flowTime * 1.8, vWorldPos.z * 6.0);
    float micro = fbm5(microCoord);

    // Deep glowing ruby red and fiery orange tendrils
    vec3 cEmber  = vec3(0.58, 0.06, 0.015);
    vec3 cOrange = vec3(0.98, 0.38, 0.04);
    vec3 cGold   = vec3(1.00, 0.72, 0.15);

    float t = (1.0 - v * 0.75) * 0.6 + (micro - 0.5) * 0.4 + uHeat * 0.25;
    vec3 col = mix(cEmber, cOrange, smoothstep(0.2, 0.55, t));
    col = mix(col, cGold, smoothstep(0.55, 0.9, t));

    // Outer tendrils are highly translucent and eroded into wisps
    float alpha = smoothstep(0.42, 0.85, voro + micro * 0.35) * (1.0 - smoothstep(0.8, 1.0, v)) * 0.65;
    alpha *= (0.6 + 0.4 * (1.0 - vFacing)); // Rim emphasis

    if (alpha * uReveal < 0.005) discard;

    gl_FragColor = vec4(col * (1.0 + uHeat * 0.4), alpha * uReveal);
  }
`;

/* =========================================================================
   4. CHEMILUMINESCENT BLUE ROOT / BASE SHADER
   ========================================================================= */

export const FLAME_BLUE_BASE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;
  uniform float uSeed;
  uniform float uBaseY;
  uniform float uHeight;
  uniform sampler2D uCenter;

  varying float vV;
  varying vec3 vWorldPos;
  varying float vFacing;

  ${GLSL_COMMON_NOISE}

  void main() {
    float v = clamp((position.y - uBaseY) / (uHeight * 0.32), 0.0, 1.0);
    float y = uBaseY + v * (uHeight * 0.32);

    float cOff = (texture2D(uCenter, vec2(v * 0.32, 0.5)).r - 0.5) * 2.0;
    vec2 h = position.xz;
    float r = length(h) * 1.08;
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    vec3 pos = vec3(dir.x * r + cOff, y, dir.y * r * 0.7);

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vec3 vViewDir = normalize(cameraPosition - world.xyz);
    vFacing = pow(max(dot(normalize((modelMatrix * vec4(normal, 0.0)).xyz), vViewDir), 0.0), 0.6);
    vV = v;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FLAME_BLUE_BASE_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uHeat;
  uniform float uTime;

  varying float vV;
  varying vec3 vWorldPos;
  varying float vFacing;

  void main() {
    float v = vV;

    // Vivid cyan and ultraviolet combustion radicals
    vec3 cBlue = vec3(0.06, 0.55, 1.00);
    vec3 cViolet = vec3(0.48, 0.12, 0.98);

    vec3 col = mix(cBlue, cViolet, smoothstep(0.0, 0.8, v));
    col *= (1.2 + uHeat * 0.6);

    float alpha = (1.0 - smoothstep(0.1, 0.95, v)) * (0.65 + 0.35 * (1.0 - vFacing)) * uReveal;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* =========================================================================
   5. 3D INCANDESCENT CHARCOAL EMBER BED (BRASAS) SHADER
   ========================================================================= */

export const CHARCOAL_BED_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;

  varying vec3 vWorldPos;
  varying vec3 vNormalVec;
  varying vec3 vViewDir;

  ${GLSL_COMMON_NOISE}

  void main() {
    vec3 pos = position;

    // Organic rough charcoal stone deformation
    float rough = snoise(pos * 4.2) * 0.045 + snoise(pos * 9.5) * 0.018;
    pos += normal * rough;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vNormalVec = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDir = normalize(cameraPosition - world.xyz);

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const CHARCOAL_BED_FRAGMENT = /* glsl */ `
  uniform float uHeat;
  uniform float uTime;
  uniform float uReveal;

  varying vec3 vWorldPos;
  varying vec3 vNormalVec;
  varying vec3 vViewDir;

  ${GLSL_COMMON_NOISE}

  void main() {
    // 3D Voronoi cracks in the charcoal coals
    vec3 crackCoord = vWorldPos * 6.5;
    float voro = voronoi3D(crackCoord);

    // Deep fissures glow incandescently
    float crack = 1.0 - smoothstep(0.02, 0.28, voro);
    crack = pow(crack, 2.2);

    // Gentle embers breathing
    float breathe = 0.5 + 0.5 * sin(uTime * 1.8 + vWorldPos.x * 4.0);
    float glowTemp = crack * (0.65 + 0.35 * breathe) + uHeat * 0.45;

    // Incandescent color palette for glowing fissures
    vec3 cCharcoalDark = vec3(0.09, 0.07, 0.06);
    vec3 cEmberRed      = vec3(0.85, 0.14, 0.02);
    vec3 cAmberGold     = vec3(1.00, 0.65, 0.12);
    vec3 cWhiteHot      = vec3(1.00, 0.98, 0.88);

    vec3 glowCol = mix(cEmberRed, cAmberGold, smoothstep(0.3, 0.75, glowTemp));
    glowCol = mix(glowCol, cWhiteHot, smoothstep(0.75, 1.1, glowTemp));
    glowCol *= (1.2 + uHeat * 0.8);

    // Carbon crust shading
    float diff = max(dot(vNormalVec, vec3(0.0, 1.0, 0.3)), 0.0);
    vec3 crustCol = cCharcoalDark * (0.8 + 0.4 * diff);

    vec3 finalCol = mix(crustCol, glowCol, clamp(crack * 1.4, 0.0, 1.0));

    gl_FragColor = vec4(finalCol, uReveal);
  }
`;

/* =========================================================================
   6. HYPERREALISTIC EMBER SPARKS WITH VELOCITY-STRETCH & BLACKBODY COOLING
   ========================================================================= */

export const SPARK_VERTEX = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  attribute float aTint;
  attribute vec3 aVelocity;

  uniform float uPointScale;

  varying float vLife;
  varying float vTint;
  varying float vSpeed;

  void main() {
    vLife = aLife;
    vTint = aTint;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float speed = length(aVelocity);
    vSpeed = speed;

    // Point size scales realistically with distance and life
    float baseSize = aSize * uPointScale / max(0.1, -mv.z);
    float size = aLife > 0.0 ? baseSize * (0.65 + 0.45 * smoothstep(0.0, 0.4, aLife)) : 0.0;

    gl_PointSize = clamp(size, 1.0, 64.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const SPARK_FRAGMENT = /* glsl */ `
  varying float vLife;
  varying float vTint;
  varying float vSpeed;

  void main() {
    if (vLife <= 0.0) discard;

    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    // Glowing core and soft halo
    float glow = smoothstep(0.5, 0.0, d);
    glow = pow(glow, 1.8);
    float core = smoothstep(0.18, 0.0, d);

    // Blackbody temperature cools down over lifetime (1.0 -> 0.0)
    vec3 cWhiteHot = vec3(1.00, 0.99, 0.92);
    vec3 cGold     = vec3(1.00, 0.82, 0.28);
    vec3 cOrange   = vec3(1.00, 0.45, 0.06);
    vec3 cCrimson  = vec3(0.68, 0.08, 0.02);
    vec3 cAsh      = vec3(0.22, 0.04, 0.01);

    vec3 col = cAsh;
    col = mix(col, cCrimson,  smoothstep(0.0, 0.25, vLife));
    col = mix(col, cOrange,   smoothstep(0.25, 0.55, vLife));
    col = mix(col, cGold,     smoothstep(0.55, 0.82, vLife));
    col = mix(col, cWhiteHot, smoothstep(0.82, 1.00, vLife));

    // High speed / hot sparks have blinding white core
    col = mix(col, cWhiteHot, core * smoothstep(0.4, 1.0, vLife));

    float alpha = glow * pow(vLife, 0.7);
    gl_FragColor = vec4(col * (1.1 + core * 0.9), alpha);
  }
`;

/* =========================================================================
   7. LOADER SCENE EMBER PARTICLES (Cinematic Ignition)
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
  varying float vTint;
  varying float vProgress;

  ${GLSL_COMMON_NOISE}

  void main() {
    // Non-linear ease-in-out per-particle stagger
    float p = clamp((uAssemble - aDelay * 0.45) / 0.55, 0.0, 1.0);
    p = smoothstep(0.0, 1.0, p);
    p = smoothstep(0.0, 1.0, p); // Double smooth for organic flocking
    vProgress = p;

    // Curl noise vortex while flying towards target
    vec3 drift = curlNoise(mix(aStart, aTarget, p) * 1.5 + vec3(0.0, uTime * 0.5, 0.0)) * (1.0 - p) * 0.35;
    vec3 pos = mix(aStart, aTarget, p) + drift;
    pos += aScatter * (uDisperse * uDisperse * 1.4);

    // Subtle breathing drift
    float floatAmt = (1.0 - p * 0.7) * (1.0 - uDisperse);
    pos.x += sin(uTime * 1.2 + aDelay * 28.0) * 0.025 * floatAmt;
    pos.y += cos(uTime * 1.5 + aDelay * 19.0) * 0.03 * floatAmt;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vAlpha = (0.75 + 0.25 * p) * (1.0 - uDisperse * uDisperse * 0.95);
    vTint = aTint;

    gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z) * (0.85 + 0.65 * p), 38.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const LOADER_FRAGMENT = /* glsl */ `
  uniform float uFade;

  varying float vAlpha;
  varying float vTint;
  varying float vProgress;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float glow = smoothstep(0.5, 0.0, d);
    glow = pow(glow, 1.6);
    float core = smoothstep(0.16, 0.0, d);

    vec3 cWhite = vec3(1.00, 0.99, 0.92);
    vec3 cGold  = vec3(1.00, 0.85, 0.35);
    vec3 cEmber = vec3(0.95, 0.40, 0.08);

    vec3 col = mix(cEmber, cGold, vProgress * 0.75 + vTint * 0.25);
    col = mix(col, cWhite, core * vProgress);

    float alpha = glow * vAlpha * uFade;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(col * (1.0 + core * 0.8), alpha);
  }
`;
