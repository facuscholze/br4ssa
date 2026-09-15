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

/** Hard timeout cap so loader never blocks the page */
const HARD_TIMEOUT = 1800;

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
 * Snappy & Smooth Initial Loader.
 *
 * Fast 0.9s sequence: particles converge -> flame ignites -> smooth fade to hero.
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

  useLayoutEffect(() => {
    if (reducedMotion) notifyBrasaReady();
  }, [reducedMotion]);

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

  // Fast & smooth timeline
  useEffect(() => {
    if (reducedMotion || done || finishedRef.current) return;

    if (!webgl) {
      const timer = window.setTimeout(() => {
        if (finishedRef.current) return;
        overlayRef.current?.classList.add("is-done");
        window.setTimeout(complete, 350);
      }, 700);
      return () => window.clearTimeout(timer);
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
      tl.to(s, { assemble: 1, duration: 0.55, ease: "power2.out" }, 0.02)
        .to(s, { flameReveal: 1, duration: 0.45, ease: "power2.out" }, 0.4)
        .to(s, { disperse: 1, duration: 0.35, ease: "power1.in" }, 0.5)
        .to(s, { fade: 0, duration: 0.25, ease: "power1.in" }, 0.65)
        .to(overlay, { opacity: 0, duration: 0.35, ease: "power2.inOut" }, 0.85);
    })().catch(() => {
      overlayRef.current?.classList.add("is-done");
      window.setTimeout(complete, 350);
    });

    return () => {
      timeline?.kill();
    };
  }, [reducedMotion, done, webgl, sceneReady, complete]);

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
