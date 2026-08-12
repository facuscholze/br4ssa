"use client";

import { useEffect, useRef } from "react";
import { subscribeScrollFrame } from "@/hooks/use-scroll-progress";

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribeScrollFrame((progress) => {
        const node = ref.current;
        if (node) node.style.transform = `scaleX(${progress})`;
      }),
    []
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[100] h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-ember to-gold shadow-[0_0_12px_color-mix(in_oklch,var(--ember)_60%,transparent)]"
    />
  );
}
