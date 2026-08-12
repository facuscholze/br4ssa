"use client";

import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { motion, useMotionValue } from "motion/react";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SIZE = 26;
const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, select, textarea, label";
// A tight dark rim first keeps the pointer legible over same-hued (ember/gold)
// backgrounds; the warm blurred shadows after it give the glow.
const GLOW =
  "drop-shadow(0 0 1px rgba(10,6,4,0.95)) drop-shadow(0 0 1.5px rgba(10,6,4,0.85)) " +
  "drop-shadow(0 0 4px rgba(255,140,66,0.95)) drop-shadow(0 0 12px rgba(255,122,61,0.7)) drop-shadow(0 0 24px rgba(232,85,29,0.45))";

/** Replaces the OS cursor with a glowing ember-outlined pointer on fine-pointer devices. */
export function CustomCursor() {
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  // Reduced-motion users keep the native cursor: their OS accessibility
  // settings (high-contrast or enlarged cursors) must not be overridden.
  const enabled = finePointer && !reducedMotion;
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);

  // Tracks the raw pointer 1:1, no spring lag -- this stands in for the
  // real cursor, so it must never feel like it's chasing the mouse.
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("custom-cursor-active");
      return;
    }
    document.documentElement.classList.add("custom-cursor-active");

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target as Element | null;
      setActive(!!target?.closest(INTERACTIVE_SELECTOR));
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-100 text-ember-hot"
      style={{
        x,
        y,
        opacity: visible ? 1 : 0,
        filter: GLOW,
      }}
      animate={{ scale: active ? 1.2 : 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <MousePointer2 size={SIZE} fill="currentColor" strokeWidth={1} className="-translate-x-[3px] -translate-y-[2px]" />
    </motion.div>
  );
}
