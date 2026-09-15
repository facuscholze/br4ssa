/**
 * GLSL for the ember 3D layer. Colors are hardcoded as final sRGB values and
 * these materials deliberately skip three's tone-mapping/color-space chunks,
 * so the values picked here are exactly what renders (no washed-out surprise
 * from the renderer's output pipeline).
 */

/* ------------------------------- coal ---------------------------------- */

export const COAL_VERTEX = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const COAL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uSeed;

  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amp * vnoise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    // Faceted normal from screen-space derivatives: the low-poly "carbón"
    // look without recomputing normals on the CPU.
    vec3 flatNormal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    vec3 viewDir = normalize(vViewDir);

    // Slow ember breathing + a touch of fast flicker.
    float pulse = 0.80 + 0.20 * sin(uTime * 1.6 + uSeed);
    pulse += 0.10 * sin(uTime * 7.3 + uSeed * 3.1);
    pulse = clamp(pulse, 0.55, 1.30);

    // Heat patches crawling slowly across the surface (the "fuego" part).
    float heat = fbm(vWorldPos * 1.9 + vec3(0.0, uTime * 0.05, 0.0) + uSeed);
    heat = smoothstep(0.50, 0.86, heat * (0.82 + 0.34 * pulse));

    // Brand ramp, darkest to hottest.
    vec3 charCol  = vec3(0.086, 0.067, 0.055);
    vec3 deepCol  = vec3(0.231, 0.078, 0.047);
    vec3 emberCol = vec3(0.910, 0.333, 0.114);
    vec3 hotCol   = vec3(1.000, 0.478, 0.239);

    vec3 glow = mix(deepCol, emberCol, smoothstep(0.10, 0.55, heat));
    glow = mix(glow, hotCol, smoothstep(0.55, 1.00, heat));

    float key = max(dot(flatNormal, normalize(vec3(0.35, 0.90, 0.45))), 0.0) * 0.14;
    float rim = pow(1.0 - max(dot(flatNormal, viewDir), 0.0), 3.0);

    vec3 col = mix(charCol, glow, smoothstep(0.04, 0.50, heat) * pulse);
    col += key * charCol * 2.0;
    col += rim * emberCol * (0.10 + 0.10 * pulse);

    if (uReveal < 0.004) discard;
    gl_FragColor = vec4(col, uReveal);
  }
`;

/* ------------------------------- sparks -------------------------------- */
/** Short-lived ember sparks: one draw call for the whole pool. The CPU
 *  integrates positions/life each frame; the shader only shades. */

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
    float size = aLife > 0.0 ? aSize * uPointScale / max(0.1, -mv.z) : 0.0;
    gl_PointSize = min(size, 44.0);
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
    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    float core = smoothstep(0.16, 0.0, d);

    vec3 amber = vec3(1.000, 0.720, 0.360);
    vec3 ember = vec3(0.910, 0.333, 0.114);
    vec3 dim   = vec3(0.550, 0.130, 0.050);

    vec3 col = mix(ember, amber, clamp(vTint * 0.55 + core * 0.45, 0.0, 1.0));
    col = mix(dim, col, smoothstep(0.0, 0.55, vLife));

    float alpha = glow * pow(vLife, 0.75);
    gl_FragColor = vec4(col * (0.80 + core * 0.9), alpha);
  }
`;

/* --------------------------- loader particles -------------------------- */
/** Scattered embers that converge on the Brasa flame isotype, then
 *  disperse. All motion is shader-side from per-particle attributes. */

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

  void main() {
    // Per-particle stagger across the assembly window.
    float p = clamp((uAssemble - aDelay * 0.45) / 0.55, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);

    vec3 pos = mix(aStart, aTarget, p);
    pos += aScatter * (uDisperse * uDisperse);

    // Gentle drift while scattered, calmer once the mark is formed.
    float floatAmt = (1.0 - p * 0.6) * (1.0 - uDisperse);
    pos.x += sin(uTime * 0.9 + aDelay * 31.0) * 0.03 * floatAmt;
    pos.y += sin(uTime * 1.3 + aDelay * 17.0) * 0.035 * floatAmt;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vAlpha = (0.75 + 0.25 * p) * (1.0 - uDisperse * uDisperse * 0.9);
    vTint = aTint;
    gl_PointSize = min(aSize * uPointScale / max(0.1, -mv.z) * (0.8 + 0.5 * p), 30.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const LOADER_FRAGMENT = /* glsl */ `
  uniform float uFade;

  varying float vAlpha;
  varying float vTint;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    float core = smoothstep(0.15, 0.0, d);

    vec3 amber = vec3(1.000, 0.700, 0.340);
    vec3 ember = vec3(0.910, 0.333, 0.114);
    vec3 gold  = vec3(0.788, 0.635, 0.294);

    vec3 col = mix(ember, mix(amber, gold, vTint), clamp(vTint * 0.5 + core * 0.45, 0.0, 1.0));
    float alpha = glow * vAlpha * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col * (0.85 + core), alpha);
  }
`;
