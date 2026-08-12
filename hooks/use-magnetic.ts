"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { subscribeScrollFrame } from "@/hooks/use-scroll-progress";

type MagneticOptions = {
  /** Fraction of the cursor offset the element travels. */
  strength?: number;
  /** Extra pull distance beyond the element's own box, in px. */
  radius?: number;
};

export function useMagnetic<T extends HTMLElement>({
  strength = 0.35,
  radius = 80,
}: MagneticOptions = {}) {
  const ref = useRef<T | null>(null);
  const rect = useRef<DOMRect | null>(null);
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const enabled = finePointer && !reducedMotion;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 20, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 260, damping: 20, mass: 0.4 });

  // The cached box is viewport-relative, so scrolling and resizing both stale it.
  useEffect(() => {
    const invalidate = () => {
      rect.current = null;
    };
    const unsubscribe = subscribeScrollFrame(invalidate);
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      unsubscribe();
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  const onMouseEnter = () => {
    if (!enabled || !ref.current) return;
    rect.current = ref.current.getBoundingClientRect();
  };

  const onMouseMove = (event: MouseEvent<T>) => {
    if (!enabled || !ref.current) return;
    const box = rect.current ?? ref.current.getBoundingClientRect();
    rect.current = box;
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const reach = Math.max(box.width, box.height) / 2 + radius;
    const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
    rawX.set(dx * strength * falloff);
    rawY.set(dy * strength * falloff);
  };

  const onMouseLeave = () => {
    rect.current = null;
    rawX.set(0);
    rawY.set(0);
  };

  return { ref, x, y, onMouseEnter, onMouseMove, onMouseLeave };
}
