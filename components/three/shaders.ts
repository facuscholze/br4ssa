/**
 * GLSL for the ember 3D layer. Colors are hardcoded as final sRGB values and
 * these materials deliberately skip three's tone-mapping/color-space chunks,
 * so the values picked here are exactly what renders (no washed-out surprise
 * from the renderer's output pipeline).
 */

/* ------------------------------- flame --------------------------------- */
/**
 * The Brasa flame. Geometry is a lathe of the isotype's actual silhouette
 * (see isotype.ts); the vertex shader makes it burn: time-animated fbm
 * licking, height flicker, tip dance — all scaled by uHeat, the single
 * "how fired up is this flame" scalar (rest ≈ 0, hover → 1, click spike →
 * ~1.7). Fragment: real-fire color layers (yellow-white base → orange →
 * deep ember red tips).
 */

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
  varying float vLick;

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
    float v = clamp((position.y - uBaseY) / uHeight, 0.0, 1.0);

    float lickSpeed = 1.0 + uHeat * 1.6;
    float lick  = fbm(vec3(v * 2.8, uTime * lickSpeed, uSeed));
    float lick2 = fbm(vec3(uSeed * 1.7, v * 3.6 + 7.3, uTime * lickSpeed * 0.75));
    float lick3 = fbm(vec3(position.z * 1.8, uTime * lickSpeed * 0.9, uSeed * 2.3));

    // The whole flame flickers in height, taller and wilder when hot.
    float hFlick = 1.0 + (fbm(vec3(uTime * (0.8 + uHeat * 0.9), uSeed * 3.1, v)) - 0.5)
      * (0.24 + 0.22 * uHeat);
    float flameH = uHeight * (1.0 + uHeat * 0.22) * hFlick;
    float y = uBaseY + v * flameH;

    // Cross-section around the isotype's center line (the lathe ring).
    float cOff = (texture2D(uCenter, vec2(v, 0.5)).r - 0.5) * 2.0;
    vec2 h = position.xz;
    float r = length(h);
    vec2 dir = r > 0.0001 ? h / r : vec2(1.0, 0.0);

    // The width licks more near the tip.
    float wScale = 1.0 + (lick - 0.5) * (0.55 + 0.75 * uHeat) * smoothstep(0.12, 0.95, v);
    vec2 ring = dir * r * wScale;
    ring.y *= 0.62; // thinner through the depth

    vec3 pos = vec3(ring.x + cOff, y, ring.y);

    // Organic displacement — the base stays planted, the top licks.
    float amp = (0.05 + 0.09 * uHeat) * smoothstep(0.03, 0.9, v);
    pos.x += (lick2 - 0.5) * 2.0 * amp;
    pos.z += (lick3 - 0.5) * 2.0 * amp * 0.8;
    pos.y += (fbm(vec3(uSeed * 4.2, v * 2.2, uTime * lickSpeed)) - 0.5) * amp * 1.2 * v;

    // The tip dances side to side (classic flame lick), faster when hot.
    float tip = smoothstep(0.68, 1.0, v);
    pos.x += (fbm(vec3(uTime * (1.3 + uHeat * 1.3), uSeed, 4.7)) - 0.5)
      * (0.3 + 0.35 * uHeat) * tip;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    vViewDir = cameraPosition - world.xyz;
    vV = v;
    vLick = lick;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const FLAME_FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uHeat;

  varying float vV;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying float vLick;

  void main() {
    float v = vV;

    // Real fire: hottest (yellow-white) at the base, red at the tips.
    // Noise makes the layers tongue-like instead of banded.
    float g = clamp(v * 1.25 - (vLick - 0.5) * 0.55 + (0.10 - uHeat * 0.12), 0.0, 1.0);

    vec3 cCore   = vec3(1.000, 0.955, 0.800); // yellow-white
    vec3 cAmber  = vec3(1.000, 0.710, 0.300);
    vec3 cOrange = vec3(0.975, 0.430, 0.100); // ember
    vec3 cRed    = vec3(0.520, 0.090, 0.030); // deep ember red

    vec3 col = cCore;
    col = mix(col, cAmber,  smoothstep(0.10, 0.40, g));
    col = mix(col, cOrange, smoothstep(0.40, 0.70, g));
    col = mix(col, cRed,    smoothstep(0.70, 0.97, g));

    // Fired up: brighter overall, and the bright core climbs higher.
    col *= 1.0 + uHeat * 0.38;

    // Volume: tongues facing the camera burn brighter (flat normal from
    // screen-space derivatives; backside of the shell reads darker).
    vec3 flatNormal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    vec3 viewDir = normalize(vViewDir);
    float facing = pow(max(dot(flatNormal, viewDir), 0.0), 0.55);
    col *= 0.70 + 0.50 * facing;

    // The tip thins out (soft top edge).
    float a = 1.0 - smoothstep(0.80, 1.0, v) * 0.42;
    if (uReveal < 0.004) discard;
    gl_FragColor = vec4(col, a * uReveal);
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
