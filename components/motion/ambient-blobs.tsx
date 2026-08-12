"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* The radial falloff already reads as a soft glow, so no blur filter is applied —
   a blurred 34rem layer is one of the most expensive things a GPU can composite. */
const EMBER_BLOB =
  "radial-gradient(circle, color-mix(in oklch, var(--ember) 16%, transparent), transparent 68%)";
const GOLD_BLOB =
  "radial-gradient(circle, color-mix(in oklch, var(--gold) 14%, transparent), transparent 68%)";

export function AmbientBlobs() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { amount: 0 });
  const idle = reducedMotion || !inView;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        className="absolute -top-40 -left-32 size-[34rem] rounded-full"
        style={{ background: EMBER_BLOB }}
        animate={
          idle
            ? undefined
            : { x: [0, 70, -30, 0], y: [0, 50, 90, 0], scale: [1, 1.1, 0.95, 1] }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 -bottom-40 size-[30rem] rounded-full"
        style={{ background: GOLD_BLOB }}
        animate={
          idle
            ? undefined
            : { x: [0, -60, 25, 0], y: [0, -45, -80, 0], scale: [1, 0.94, 1.08, 1] }
        }
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
