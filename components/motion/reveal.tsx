"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { DURATION, EASE, STAGGER } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      // amount: 0 + a 200px bottom margin means the trigger zone starts well
      // before the element is actually on screen. A fast scroll (a normal
      // trackpad flick, not just automation) can cross a 15%-visible
      // threshold within a single frame without the observer ever reporting
      // an intersection — with `once: true`, that's a permanently invisible
      // section. The early, generous zone here gives the observer room to
      // catch it before the element would otherwise be skipped past.
      viewport={{ once: true, amount: 0, margin: "0px 0px 200px 0px" }}
      transition={{ duration: DURATION.slower, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER.loose, delayChildren: 0.05 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE } },
};

export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      // amount: 0 + a 200px bottom margin means the trigger zone starts well
      // before the element is actually on screen. A fast scroll (a normal
      // trackpad flick, not just automation) can cross a 15%-visible
      // threshold within a single frame without the observer ever reporting
      // an intersection — with `once: true`, that's a permanently invisible
      // section. The early, generous zone here gives the observer room to
      // catch it before the element would otherwise be skipped past.
      viewport={{ once: true, amount: 0, margin: "0px 0px 200px 0px" }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
