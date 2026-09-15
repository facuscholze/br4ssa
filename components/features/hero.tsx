"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CursorGlow } from "@/components/motion/cursor-glow";
import { Magnetic } from "@/components/motion/magnetic";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useBrasaReady } from "@/lib/brasa-ready";
import { useWebGL } from "@/lib/webgl";
import { EASE_CSS } from "@/lib/motion";
import { REVIEWS, STATS } from "@/lib/data";

const HeroFlameScene = dynamic(
  () => import("@/components/three/hero-flame-scene"),
  { ssr: false }
);

const WORD_STAGGER = 0.085;
const WORD_DELAY = 0.1;

/* Delays are baked in at module scope so the staggered reveal stays plain
   inline CSS once the loader signals ready. */
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

const rating = STATS.find((stat) => stat.label === "Rating promedio")?.value;

/** Decorative fallback (no WebGL / pre-scene): the flame isotype, glowing. */
function FlameFallback() {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 512 512"
        className="h-[52%] max-h-44 w-auto text-ember drop-shadow-[0_0_44px_rgba(255,122,61,0.5)]"
      >
        <path
          d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1-1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
          fill="currentColor"
          transform="translate(256 256) scale(15.5) translate(-12 -12.3)"
        />
      </svg>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  // The reveal is chained to the loader finishing (not to hydration); the
  // loader always signals — its hard timeout is the safety net.
  const ready = useBrasaReady() || reducedMotion;
  const webgl = useWebGL();
  const [inView, setInView] = useState(true);
  // The CSS halo's opacity is driven per-frame by the 3D scene so it breathes
  // with the fire (hover/click). Wrapped: the keyframe animation keeps the
  // inner .hero-halo pulsing underneath the scene-set opacity.
  const haloRef = useRef<HTMLDivElement>(null);

  // Keep the 3D scene alive only while the hero is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.02 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Exit scrub: text and flame drift apart on the way to "Nuestra historia".
  // ScrollTrigger is driven by Lenis's rAF (see lib/lenis.ts).
  useEffect(() => {
    if (reducedMotion || !ready) return;
    const section = sectionRef.current;
    if (!section) return;
    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const content = section.querySelector(".hero-content");
        const flame = section.querySelector(".hero-flame");
        gsap.to(content, {
          autoAlpha: 0,
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "78% top",
            scrub: 0.6,
          },
        });
        gsap.to(flame, {
          autoAlpha: 0,
          y: 70,
          scale: 0.94,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "92% top",
            scrub: 0.6,
          },
        });
      }, section);
    })().catch(() => {});
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reducedMotion, ready]);

  const gate = (delay: number | string) =>
    ready
      ? { animation: `hero-up 1s ${EASE_CSS} ${delay}s both` }
      : { opacity: 0 };
  const gateWord = (delay: number | string) =>
    ready
      ? { animation: `hero-word 0.8s ${EASE_CSS} ${delay}s both` }
      : { opacity: 0 };

  return (
    // Permanently-dark surface — scoping `dark` keeps ember/gold legible
    // while the rest of the page follows the theme.
    <section
      id="inicio"
      ref={sectionRef}
      className="dark relative flex min-h-svh flex-col overflow-hidden bg-ink"
    >
      <noscript>
        <style>{`
          #inicio .hero-gated{opacity:1 !important}
          .ember-loader{display:none !important}
        `}</style>
      </noscript>

      <CursorGlow />

      <div className="relative z-[2] mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-8 px-6 pb-24 pt-28 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:items-center lg:gap-16 lg:px-12 lg:pb-10 lg:pt-24">
        {/* 3D flame — above the text on mobile, right side on desktop */}
        <div
          className="hero-flame hero-gated relative h-[34svh] min-h-[240px] w-full lg:order-2 lg:h-[64svh] lg:min-h-[440px]"
          style={ready ? undefined : { opacity: 0 }}
        >
          <div ref={haloRef} className="absolute inset-0">
            <div className="hero-halo absolute inset-0" aria-hidden="true" />
          </div>
          {(!ready || !webgl) && <FlameFallback />}
          {ready && webgl && inView && (
            <div className="absolute inset-0">
              <HeroFlameScene reducedMotion={reducedMotion} haloRef={haloRef} />
            </div>
          )}
        </div>

        <div className="hero-content relative max-w-2xl">
          <p
            className="hero-gated mb-5 inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.18em] text-gold uppercase"
            style={gate(0.05)}
          >
            <span className="inline-block h-px w-[22px] bg-gold" />
            Fuego real desde 2010
          </p>

          <h1 className="text-[clamp(40px,9.5vw,62px)] leading-[1.06] text-on-media lg:text-[clamp(48px,5.8vw,88px)]">
            {HEADLINE.map((line) => (
              <span
                key={line.words.map((entry) => entry.word).join(" ")}
                className="block"
              >
                {line.words.map(({ word, delay }) => (
                  <span
                    key={word}
                    className={`hero-gated ${
                      line.accent
                        ? "text-glow mr-[0.25em] inline-block font-normal text-ember-hot italic"
                        : "mr-[0.25em] inline-block"
                    }`}
                    style={gateWord(delay)}
                  >
                    {word}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            className="hero-gated my-6 max-w-[46ch] text-[clamp(16px,1.6vw,19px)] text-on-media-dim"
            style={gate(0.5)}
          >
            Carnes de primera cocidas sobre brasas de quebracho, pastas
            caseras y una carta pensada para compartir. Una experiencia
            gastronómica que empieza en el fuego y termina en la sobremesa.
          </p>

          <div
            className="hero-gated flex flex-wrap items-center gap-4"
            style={gate(0.62)}
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
              className="hero-gated mt-7 inline-flex items-center gap-2.5 rounded-full text-sm text-on-media-dim transition-colors hover:text-on-media focus-visible:ring-3 focus-visible:ring-gold/50 focus-visible:outline-none"
              style={gate(0.74)}
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
        className="hero-gated absolute bottom-7 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-on-media-dim uppercase"
        style={gate(0.9)}
      >
        <span>Descubrí más</span>
        <span className="h-8.5 w-px animate-[cue-pulse_2s_ease-in-out_infinite] bg-gradient-to-b from-ember to-transparent" />
      </div>
    </section>
  );
}
