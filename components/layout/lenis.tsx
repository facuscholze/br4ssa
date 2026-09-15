"use client";

import { useEffect, type ReactNode } from "react";
import { disposeLenis, initLenis } from "@/lib/lenis";

/** Site-wide smooth scroll. Skips itself under prefers-reduced-motion (see
 *  lib/lenis.ts) — in that case native scrolling is untouched. */
export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initLenis();
    return () => disposeLenis();
  }, []);

  return <>{children}</>;
}
