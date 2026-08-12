"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type UseCountUpOptions = {
  target: number;
  decimals?: number;
  duration?: number;
};

/**
 * Renders the final figure server-side (so crawlers and no-JS readers see the
 * real number) and animates up to it on the client by writing `textContent`
 * directly — a state write per frame would re-render for every tick.
 */
export function useCountUp({ target, decimals = 0, duration = 1400 }: UseCountUpOptions) {
  const ref = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const format = (value: number) =>
      decimals ? value.toFixed(decimals) : Math.round(value).toString();

    if (reducedMotion) {
      node.textContent = format(target);
      return;
    }

    node.textContent = format(0);

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = format(target * eased);
        if (progress < 1) frame = requestAnimationFrame(step);
        else node.textContent = format(target);
      };
      frame = requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.6 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [decimals, duration, reducedMotion, target]);

  const initial = decimals ? target.toFixed(decimals) : Math.round(target).toString();

  return { ref, initial };
}
