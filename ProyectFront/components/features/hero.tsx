"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmberParticles } from "@/components/features/ember-particles";
import { CursorGlow } from "@/components/motion/cursor-glow";
import { Magnetic } from "@/components/motion/magnetic";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { subscribeScrollFrame } from "@/hooks/use-scroll-progress";
import { EASE_CSS } from "@/lib/motion";
import { MEDIA, REVIEWS, STATS } from "@/lib/data";

const WORD_STAGGER = 0.09;
const WORD_DELAY = 0.15;

/* Delays are baked in at module scope so the staggered reveal ships as plain
   inline CSS in the server HTML — the LCP headline never waits on hydration. */
const HEADLINE = [
  { words: ["El", "fuego", "cuenta"], accent: false },
  { words: ["la", "historia."], accent: true },
].map((line, lineIndex, lines) => {
  const offset = lines
    .slice(0, lineIndex)
    .reduce((total, previous) => total + previous.words.length, 0);
  return {
    ...line,
    words: line.words.map((word, index) => ({
      word,
      delay: (WORD_DELAY + (offset + index) * WORD_STAGGER).toFixed(2),
    })),
  };
});

const SCRIM =
  "linear-gradient(180deg, rgba(20,16,13,.35) 0%, rgba(20,16,13,.55) 55%, var(--ink) 96%)";

const rating = STATS.find((stat) => stat.label === "Rating promedio")?.value;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);
  // The clip is 3.7MB. Mounting it only once the page is idle keeps it from
  // competing with the LCP poster for bandwidth.
  const [videoMounted, setVideoMounted] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const idle = window.requestIdleCallback;
    if (idle) {
      const handle = idle(() => setVideoMounted(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(() => setVideoMounted(true), 1200);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const hero = heroRef.current;
    const media = mediaRef.current;
    if (!hero || !media) return;

    let heroHeight = hero.offsetHeight;
    const onResize = () => {
      heroHeight = hero.offsetHeight;
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Compositor-only transform — no layout read or reflow per frame.
    const unsubscribe = subscribeScrollFrame((_, y) => {
      if (y > heroHeight) return;
      media.style.transform = `translate3d(0, ${(y * 0.18).toFixed(2)}px, 0)`;
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", onResize);
    };
  }, [reducedMotion]);

  return (
    // Permanently-dark surface — scoping `dark` keeps ember/gold legible against
    // the photography even while the rest of the page is in light theme.
    <section
      id="inicio"
      ref={heroRef}
      className="dark relative flex min-h-svh items-end overflow-hidden bg-ink pt-40 pb-24 md:pb-28"
    >
      {/* Overscanned top and bottom so the parallax travel never exposes an edge. */}
      <div
        ref={mediaRef}
        aria-hidden="true"
        className="absolute inset-x-0 -top-[20%] -bottom-[20%] will-change-transform"
      >
        <Image
          src={MEDIA.heroBackground}
          alt=""
          fill
          sizes="100vw"
          preload
          className="object-cover object-[center_30%]"
        />
        {/* No `poster` — that would refetch the unoptimized source JPEG. The
            next/image layer underneath is the poster, and stays visible until
            the clip has enough data to fade in over it. */}
        {videoMounted && !reducedMotion && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            className={`absolute inset-0 size-full object-cover object-[center_30%] transition-opacity duration-1000 ease-out ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={MEDIA.heroVideo} type="video/mp4" />
          </video>
        )}
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: SCRIM }}
      />

      <CursorGlow />
      <EmberParticles />

      <div className="relative z-[2] mx-auto max-w-6xl px-6 md:px-12">
        <div className="max-w-2xl">
          <p
            className="mb-5 inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.18em] text-gold uppercase"
            style={{ animation: `hero-up 1s ${EASE_CSS} .1s both` }}
          >
            <span className="inline-block h-px w-[22px] bg-gold" />
            Fuego real desde 2010
          </p>

          <h1 className="text-[clamp(42px,7vw,84px)] leading-[1.1] text-on-media">
            {HEADLINE.map((line) => (
              <span
                key={line.words.map((entry) => entry.word).join(" ")}
                className="block"
              >
                {line.words.map(({ word, delay }) => (
                  <span
                    key={word}
                    className={
                      line.accent
                        ? "text-glow mr-[0.25em] inline-block font-normal text-ember-hot italic"
                        : "mr-[0.25em] inline-block"
                    }
                    style={{
                      animation: `hero-word .8s ${EASE_CSS} ${delay}s both`,
                    }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            className="my-6 max-w-[46ch] text-[clamp(16px,1.6vw,19px)] text-on-media-dim"
            style={{ animation: `hero-up 1s ${EASE_CSS} .55s both` }}
          >
            Carnes de primera cocidas sobre brasas de quebracho, pastas
            caseras y una carta pensada para compartir. Una experiencia
            gastronómica que empieza en el fuego y termina en la sobremesa.
          </p>

          <div
            className="flex flex-wrap items-center gap-4"
            style={{ animation: `hero-up 1s ${EASE_CSS} .7s both` }}
          >
            <Magnetic>
              <Button
                size="lg"
                className="glow-ember rounded-full px-8 text-base"
                nativeButton={false}
                render={<a href="#reservas" />}
              >
                Reservar mesa
              </Button>
            </Magnetic>
            <a
              href="#menu"
              className="rounded-sm text-base text-on-media-dim underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:text-gold focus-visible:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gold/50"
            >
              Ver el menú
            </a>
          </div>

          {rating !== undefined && (
            <a
              href="#opiniones"
              className="mt-7 inline-flex items-center gap-2.5 rounded-full text-sm text-on-media-dim transition-colors hover:text-on-media focus-visible:ring-3 focus-visible:ring-gold/50 focus-visible:outline-none"
              style={{ animation: `hero-up 1s ${EASE_CSS} .85s both` }}
            >
              <span className="flex gap-0.5 text-gold" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="font-mono font-medium text-on-media">
                {rating.toFixed(1)}
              </span>
              <span>
                de 5 · {REVIEWS.length} opiniones de clientes
              </span>
            </a>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-on-media-dim uppercase"
      >
        <span>Descubrí más</span>
        <span className="h-8.5 w-px animate-[cue-pulse_2s_ease-in-out_infinite] bg-gradient-to-b from-ember to-transparent" />
      </div>
    </section>
  );
}
