"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWebGL } from "@/lib/webgl";
import { notifyBrasaReady } from "@/lib/brasa-ready";
import { startLenis, stopLenis } from "@/lib/lenis";
import type { LoaderState } from "@/components/three/loader-scene";

const LoaderScene = dynamic(
  () => import("@/components/three/loader-scene"),
  { ssr: false }
);

/** Hard cap: even if the 3D chunk or the timeline misbehave, the loader
 *  never holds the page hostage. */
const HARD_TIMEOUT = 3800;

/** Static opening frame (also the chunk-loading placeholder and the
 *  no-WebGL fallback): the flame isotype + wordmark on #14100d. */
function FlameMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path
        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1-1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
        fill="var(--ember)"
        transform="translate(256 256) scale(15.5) translate(-12 -12.3)"
      />
    </svg>
  );
}

/**
 * Initial loader: ember particles scattered in black converge into the Brasa
 * flame isotype, the mark dissolves into the slowly rotating incandescent
 * coal, then the whole overlay fades into the hero (~2.3s).
 *
 * Skipped entirely under prefers-reduced-motion; falls back to the static
 * mark when WebGL is unavailable or the 3D chunk never arrives.
 */
export function EmberLoader() {
  const reducedMotion = useReducedMotion();
  const webgl = useWebGL();
  const [sceneReady, setSceneReady] = useState(false);
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<LoaderState>({
    assemble: 0,
    disperse: 0,
    fade: 1,
    flameReveal: 0,
  });
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  const complete = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setDone(true);
    notifyBrasaReady();
  }, []);

  // Reduced motion: skip the loader entirely (signal before paint, no
  // state, no flash of the mark).
  useLayoutEffect(() => {
    if (reducedMotion) notifyBrasaReady();
  }, [reducedMotion]);

  // Lock scrolling + hard timeout while the loader is live.
  useEffect(() => {
    if (reducedMotion || done) return;
    stopLenis();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(complete, HARD_TIMEOUT);
    return () => {
      document.body.style.overflow = previous;
      startLenis();
      window.clearTimeout(timeout);
    };
  }, [reducedMotion, done, complete]);

  // Timeline: waits for the 3D layer, then drives the phases.
  useEffect(() => {
    if (reducedMotion || done || finishedRef.current) return;

    if (!webgl) {
      // Still detecting or no WebGL: hold the static mark, then fade it.
      let fadeTimer: number | undefined;
      const timer = window.setTimeout(() => {
        if (finishedRef.current) return;
        overlayRef.current?.classList.add("is-done");
        fadeTimer = window.setTimeout(complete, 480);
      }, 1400);
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(fadeTimer);
      };
    }

    if (startedRef.current || !sceneReady) return;
    startedRef.current = true;

    let timeline: { kill: () => void } | null = null;
    (async () => {
      const { default: gsap } = await import("gsap");
      const s = stateRef.current;
      const overlay = overlayRef.current;
      const tl = gsap.timeline({ onComplete: complete });
      timeline = tl;
      tl.to(s, { assemble: 1, duration: 0.95, ease: "power2.inOut" }, 0.05)
        .to(s, { flameReveal: 1, duration: 0.7, ease: "power3.out" }, 0.8)
        .to(s, { disperse: 1, duration: 0.5, ease: "power2.in" }, 0.8)
        .to(s, { fade: 0, duration: 0.4, ease: "power1.in" }, 1.05)
        .to(overlay, { opacity: 0, duration: 0.5, ease: "power3.in" }, 1.78);
    })().catch(() => {
      // GSAP failed to load: CSS fade of the static mark instead.
      overlayRef.current?.classList.add("is-done");
      window.setTimeout(complete, 500);
    });

    return () => {
      timeline?.kill();
    };
  }, [reducedMotion, done, webgl, sceneReady, complete]);

  // The static mark ships in the SSR HTML (first paint shows the flame on
  // charcoal); only the 3D layer waits for the client.
  if (done || reducedMotion) return null;

  return (
    <div ref={overlayRef} className="ember-loader" aria-hidden="true">
      <div className="ember-loader__mark">
        <FlameMark className="ember-loader__flame" />
        <span className="ember-loader__word">
          Bra<span className="text-ember">sa</span>
        </span>
        <span className="ember-loader__tag">Fuego real desde 2010</span>
      </div>
      {webgl && (
        <LoaderScene
          stateRef={stateRef}
          onCreated={() => {
            setSceneReady(true);
            const mark =
              overlayRef.current?.querySelector<HTMLElement>(
                ".ember-loader__mark"
              );
            if (mark) mark.style.opacity = "0";
          }}
        />
      )}
    </div>
  );
}
