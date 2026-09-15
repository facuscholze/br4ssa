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
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      const path = new Path2D(FLAME_PATH);
      ctx.save();
      ctx.translate(256, 256);
      ctx.scale(15.5, 15.5);
      ctx.translate(-12, -12.3);
      ctx.fillStyle = "#fff";
      ctx.fill(path);
      ctx.restore();

      const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
      const step = 4;
      const candidates: number[] = [];
      for (let y = 0; y < SAMPLE_SIZE; y += step) {
        for (let x = 0; x < SAMPLE_SIZE; x += step) {
          if (data[(y * SAMPLE_SIZE + x) * 4 + 3] > 120) candidates.push(x, y);
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
  } catch {
    pixels = null;
  }

  cached = pixels ?? fallbackBrasa(count);
  return cached;
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
