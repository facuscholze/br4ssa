"use client";

import { Star } from "lucide-react";
import { useTilt } from "@/hooks/use-tilt";
import type { Review } from "@/lib/types";

export function ReviewCard({ review }: { review: Review }) {
  const { ref, onMouseEnter, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>({
    strength: 6,
    lift: 10,
    scale: 1.015,
    rotate: -0.7,
  });

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="rounded-2xl border border-border bg-card p-8 transition-[border-color,box-shadow] duration-400 [transform-style:preserve-3d] hover:border-gold hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:will-change-transform dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      <div className="mb-4 flex gap-0.5 text-gold">
        <span className="sr-only">{review.rating} de 5 estrellas</span>
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className="size-3.5"
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>
      <p className="mb-6 text-[15px] text-foreground">{review.quote}</p>
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-10.5 items-center justify-center rounded-full bg-gradient-to-br from-ember to-wine font-display text-[15px] font-semibold text-on-media"
        >
          {review.initial}
        </div>
        <div>
          <b className="block text-sm font-semibold text-foreground">{review.name}</b>
          <span className="text-xs text-muted-foreground">{review.role}</span>
        </div>
      </div>
    </div>
  );
}
