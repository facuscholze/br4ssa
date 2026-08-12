"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Makes every JS-driven Motion animation honour `prefers-reduced-motion`,
 *  not just the ones that read the media query themselves. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
