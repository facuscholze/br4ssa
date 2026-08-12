"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMagnetic } from "@/hooks/use-magnetic";
import { cn } from "@/lib/utils";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
};

export function Magnetic({ children, className, strength, radius }: MagneticProps) {
  const { ref, x, y, onMouseEnter, onMouseMove, onMouseLeave } =
    useMagnetic<HTMLDivElement>({ strength, radius });

  return (
    // The -m-3/p-3 pair widens the pointer target without changing layout.
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn("-m-3 inline-flex p-3", className)}
    >
      {children}
    </motion.div>
  );
}
