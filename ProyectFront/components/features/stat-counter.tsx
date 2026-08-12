"use client";

import { useCountUp } from "@/hooks/use-count-up";
import type { Stat } from "@/lib/types";

export function StatCounter({ label, value, decimals }: Stat) {
  const { ref, initial } = useCountUp({ target: value, decimals });

  return (
    <div>
      <b
        ref={ref as React.RefObject<HTMLElement>}
        className="block font-display text-[38px] text-ember"
      >
        {initial}
      </b>
      <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}
