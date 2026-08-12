"use client";

import Image from "next/image";
import { useTilt } from "@/hooks/use-tilt";
import type { FeaturedDish } from "@/lib/types";

export function DishCard({ dish }: { dish: FeaturedDish }) {
  const { ref, onMouseEnter, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>({
    strength: 10,
    lift: 10,
    scale: 1.02,
  });

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="dark group relative flex h-90 items-end overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-400 [transform-style:preserve-3d] hover:shadow-[0_24px_50px_rgba(0,0,0,0.5)] hover:will-change-transform md:h-110"
    >
      {/* Oversized so the parallax shift never exposes an edge. */}
      <div
        className="absolute inset-[-7%] transition-transform duration-300 ease-out group-hover:will-change-transform"
        style={{
          transform:
            "translate3d(calc(var(--tilt-px, 0) * -22px), calc(var(--tilt-py, 0) * -22px), 0)",
        }}
      >
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-108"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(20,16,13,0.95)]" />
      <div className="relative z-[2] p-7 transition-transform duration-300 ease-out group-hover:translate-y-[-4px]">
        <span className="font-mono text-[11px] tracking-[0.12em] text-gold uppercase">
          {dish.tag}
        </span>
        <h3 className="mt-2 mb-1.5 text-2xl text-on-media">{dish.name}</h3>
        <p className="text-sm text-on-media-dim">{dish.description}</p>
      </div>
    </div>
  );
}
