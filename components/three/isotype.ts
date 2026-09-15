/**
 * Samples 2D points from the Brasa flame isotype — the exact path used in
 * public/icon.svg — so the loader particles can converge into the mark.
 * Client-only (canvas sampling); falls back to a simple ember blob when
 * Path2D/2D-canvas is unavailable.
 */

const FLAME_PATH =
  "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1-1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4";

const SAMPLE_SIZE = 512;

let cached: Float32Array | null = null;

/** Draws the isotype onto a 2D canvas mask and returns the pixel data. */
function sampleFlameMask(): { data: Uint8ClampedArray; size: number } | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const path = new Path2D(FLAME_PATH);
    ctx.save();
    ctx.translate(256, 256);
    ctx.scale(15.5, 15.5);
    ctx.translate(-12, -12.3);
    ctx.fillStyle = "#fff";
    ctx.fill(path);
    ctx.restore();
    return { data: ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data, size: SAMPLE_SIZE };
  } catch {
    return null;
  }
}

function fallbackBrasa(count: number): Float32Array {
  // Soft upward-skewed blob, roughly the flame's footprint in 512-space.
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 0.65) * 150;
    out[i * 2] = 256 + Math.cos(angle) * radius * 0.72;
    out[i * 2 + 1] = 200 + Math.sin(angle) * radius * 0.95 - radius * 0.22;
  }
  return out;
}

/** Returns `count` 2D sample points (x,y pairs in 512px isotype space). */
export function getBrasaTargets(count = 1100): Float32Array {
  if (cached) return cached;

  let pixels: Float32Array | null = null;
  const mask = sampleFlameMask();
  if (mask) {
    const { data, size } = mask;
    const step = 4;
    const candidates: number[] = [];
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        if (data[(y * size + x) * 4 + 3] > 120) candidates.push(x, y);
      }
    }
    if (candidates.length / 2 >= count) {
      pixels = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * (candidates.length / 2)) * 2;
        pixels[i * 2] = candidates[idx] + (Math.random() - 0.5) * step;
        pixels[i * 2 + 1] = candidates[idx + 1] + (Math.random() - 0.5) * step;
      }
    }
  }

  cached = pixels ?? fallbackBrasa(count);
  return cached;
}

/* ------------------------------------------------------------------ *
 * Flame profile: row-wise center line + half-width of the isotype, in
 * world space. The 3D flame is a lathe of this profile, so its front
 * silhouette IS the logo's silhouette (including the left notch).
 * ------------------------------------------------------------------ */

export type FlameProfile = {
  rows: number;
  /** center x offset per row (v=0 bottom → rows-1 top), relative to bbox center */
  center: Float32Array;
  /** half width per row */
  halfWidth: Float32Array;
  /** world-space flame height */
  height: number;
};

let profileCache: FlameProfile | null = null;

export function getFlameProfile(rows = 56, height = 2.3): FlameProfile {
  if (profileCache) return profileCache;

  let center: Float32Array | null = null;
  let halfWidth: Float32Array | null = null;

  const mask = sampleFlameMask();
  if (mask) {
    const { data, size } = mask;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (data[(y * size + x) * 4 + 3] > 120) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (Number.isFinite(minX) && maxX - minX > 8 && maxY - minY > 8) {
      const k = height / (maxY - minY);
      const cx = (minX + maxX) / 2;
      center = new Float32Array(rows);
      halfWidth = new Float32Array(rows);
      for (let i = 0; i < rows; i++) {
        // v=0 is the bottom row (maxY side of the canvas)
        const y0 = Math.max(
          minY,
          Math.floor(maxY - (i / (rows - 1)) * (maxY - minY))
        );
        const y1 = Math.min(
          maxY,
          Math.floor(maxY - ((i - 1) / (rows - 1)) * (maxY - minY))
        );
        let left = Infinity;
        let right = -Infinity;
        for (let y = y0; y <= y1; y++) {
          for (let x = minX; x <= maxX; x++) {
            if (data[(y * size + x) * 4 + 3] > 120) {
              if (x < left) left = x;
              if (x > right) right = x;
            }
          }
        }
        if (Number.isFinite(left)) {
          center[i] = ((left + right) / 2 - cx) * k;
          halfWidth[i] = ((right - left) / 2) * k;
        }
      }
      // 3-tap smoothing so the lathe outline is silky, not jaggly
      const smooth = (arr: Float32Array) => {
        for (let i = 1; i < rows - 1; i++) {
          arr[i] = (arr[i - 1] + arr[i] * 2 + arr[i + 1]) / 4;
        }
      };
      smooth(center);
      smooth(halfWidth);
    }
  }

  if (!center || !halfWidth) {
    // Procedural fallback: generic but on-brand flame silhouette
    center = new Float32Array(rows);
    halfWidth = new Float32Array(rows);
    for (let i = 0; i < rows; i++) {
      const v = i / (rows - 1);
      halfWidth[i] =
        1.02 * Math.pow(1 - v, 0.82) +
        0.18 * Math.exp(-Math.pow((v - 0.14) / 0.17, 2));
      center[i] = 0.05 * v;
    }
  }

  profileCache = { rows, center, halfWidth, height };
  return profileCache;
}

/**
 * Maps 2D isotype samples to 3D world targets, centered on the origin with
 * the flame ~`height` world units tall. `out` must hold count*3 floats.
 */
export function targetsToWorld(
  pixels: Float32Array,
  out: Float32Array,
  height = 2.05
) {
  const count = pixels.length / 2;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = pixels[i * 2];
    const y = pixels[i * 2 + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const k = height / Math.max(1, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (let i = 0; i < count; i++) {
    out[i * 3] = (pixels[i * 2] - cx) * k;
    out[i * 3 + 1] = (cy - pixels[i * 2 + 1]) * k;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
  }
}
