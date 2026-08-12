"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE } from "@/lib/motion";
import { MEDIA } from "@/lib/data";

export function AboutPortrait() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-38, 38]);

  return (
    <div ref={ref} className="relative isolate">
      <div className="relative z-10 h-90 overflow-hidden rounded-3xl md:h-130">
        {/* Oversized so the parallax travel never exposes an edge. */}
        <motion.div className="absolute inset-[-8%]" style={{ y }}>
          <Image
            src={MEDIA.about}
            alt="Parrillero atendiendo el fuego en Brasa"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        className="absolute -right-4.5 -bottom-4.5 -z-10 h-[55%] w-[55%] rounded-3xl border border-gold"
        style={{ transformOrigin: "bottom right" }}
        initial={reducedMotion ? false : { opacity: 0, scaleX: 0, scaleY: 0 }}
        whileInView={{ opacity: 1, scaleX: 1, scaleY: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          opacity: { duration: 0.25, delay: 0.25 },
          scaleX: { duration: 0.6, delay: 0.25, ease: EASE },
          scaleY: { duration: 0.6, delay: 0.75, ease: EASE },
        }}
      />
    </div>
  );
}
