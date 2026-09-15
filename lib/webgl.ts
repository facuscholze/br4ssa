"use client";

/** Client-only WebGL capability check (cached). The 3D hero falls back to a
 *  static flame + halo when this returns false, and the loader skips its
 *  particle phase. */

import { useSyncExternalStore } from "react";

let cached: boolean | null = null;

const noopSubscribe = () => () => {};

/** Reactive WebGL check (server snapshot: false, so the SSR/first paint
 *  shows the static fallback; the real value lands on the first client
 *  render — no effect, no setState). */
export function useWebGL() {
  return useSyncExternalStore(noopSubscribe, hasWebGL, () => false);
}

export function hasWebGL() {
  if (cached !== null) return cached;
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    cached = !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    cached = false;
  }
  return cached;
}
