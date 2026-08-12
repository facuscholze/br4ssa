"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SIZE = 560;

/** Soft ember blob that trails the cursor inside its (positioned) parent element. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawOpacity = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 90, damping: 22, mass: 0.7 });
  const y = useSpring(rawY, { stiffness: 90, damping: 22, mass: 0.7 });
  const opacity = useSpring(rawOpacity, { stiffness: 60, damping: 22 });

  useEffect(() => {
    if (reducedMotion) return;
    const parent = ref.current?.parentElement;
    if (!parent) return;

    let rect: DOMRect | null = null;
    const invalidate = () => {
      rect = null;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      rect ??= parent.getBoundingClientRect();
      rawX.set(event.clientX - rect.left);
      rawY.set(event.clientY - rect.top);
      rawOpacity.set(1);
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      rect = parent.getBoundingClientRect();
    };
    const onLeave = () => {
      invalidate();
      rawOpacity.set(0);
    };

    parent.addEventListener("pointerenter", onEnter);
    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", invalidate, { passive: true });
    window.addEventListener("scroll", invalidate, { passive: true });
    return () => {
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", invalidate);
    };
  }, [reducedMotion, rawX, rawY, rawOpacity]);

  if (reducedMotion) return null;

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute z-[1] rounded-full blur-[90px]"
      style={{
        x,
        y,
        opacity,
        width: SIZE,
        height: SIZE,
        left: -SIZE / 2,
        top: -SIZE / 2,
        background:
          "radial-gradient(circle, rgba(255,122,61,0.30), rgba(201,162,75,0.14) 45%, transparent 70%)",
      }}
    />
  );
}
