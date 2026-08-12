"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ITEMS = [
  "Fuego real",
  "Cortes premium",
  "Reservá hoy",
  "Producto de estación",
  "Brasas de quebracho",
  "Pastas caseras",
];

function Track() {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-6 font-mono text-[11px] tracking-[0.22em] text-foreground/70 uppercase sm:text-xs">
            {item}
          </span>
          <span className="text-ember">&middot;</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  // Deliberately ignores prefers-reduced-motion: a simple linear horizontal
  // scroll, low vestibular risk, kept always-on per product decision. Hover
  // already pauses it for mouse users; this button gives touch/keyboard
  // users the same control (WCAG 2.2.2 Pause, Stop, Hide).
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      // `top` tracks --header-h, which the header updates via ResizeObserver
      // while its own height eases over 300ms (see header.tsx). Without this
      // transition, `top` snaps in discrete steps instead of easing in step
      // with the header, leaving a momentary gap right as it shrinks/grows.
      // Animates on mount, not whileInView: this bar sits directly below the
      // hero and becomes sticky within the first ~100px of scroll, so a
      // viewport-intersection trigger is unreliable (sticky elements report
      // intersection inconsistently, and a fast scroll can leave it stuck at
      // its `initial` — invisible — state instead of ever firing). Mounting
      // hidden and fading in immediately means it's already settled long
      // before the user scrolls far enough to see it.
      className="sticky top-[var(--header-h,73px)] z-40 border-y border-gold/30 bg-background/95 py-3.5 backdrop-blur-md transition-[top] duration-300"
      initial={reducedMotion ? false : { opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: DURATION.slow, ease: EASE }}
    >
      <p className="sr-only">
        Fuego real, cortes premium, reservá hoy, producto de estación, brasas de
        quebracho y pastas caseras.
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
        <div
          className={cn(
            "marquee-track flex w-max animate-[marquee_38s_linear_infinite] hover:[animation-play-state:paused]"
          )}
          style={paused ? { animationPlayState: "paused" } : undefined}
        >
          <Track />
          <Track />
          <Track />
          <Track />
          <Track />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? "Reanudar animación del ticker" : "Pausar animación del ticker"}
        aria-pressed={paused}
        className="absolute top-1/2 right-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground/60 transition-[color,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:text-ember active:scale-90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {paused ? (
          <Play className="size-4" fill="currentColor" strokeWidth={0} />
        ) : (
          <Pause className="size-4" fill="currentColor" strokeWidth={0} />
        )}
      </button>
    </motion.div>
  );
}
