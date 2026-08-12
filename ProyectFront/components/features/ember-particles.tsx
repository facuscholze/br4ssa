"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Particle = {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  color: string;
  life: number;
  maxLife: number;
};

const COLORS = ["#E8551D", "#FF7A3D", "#C9A24B"];
const COUNT = 34;

export function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let visible = true;
    let onScreen = true;

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: height + 10,
      r: 1 + Math.random() * 2.2,
      speed: 0.4 + Math.random() * 1.1,
      drift: (Math.random() - 0.5) * 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0,
      maxLife: 200 + Math.random() * 200,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Draw in CSS pixels; the backing store stays retina-sharp.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: COUNT }, () => {
        const particle = spawn();
        particle.y = Math.random() * height;
        return particle;
      });
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.y -= particle.speed;
        particle.x += particle.drift;
        particle.life++;
        const fade = 1 - particle.life / particle.maxLife;
        ctx.globalAlpha = Math.max(fade, 0) * 0.85;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      particles = particles.filter((p) => p.life < p.maxLife && p.y > -10);
      while (particles.length < COUNT) particles.push(spawn());
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      const shouldRun = visible && onScreen;
      if (shouldRun && !frame) frame = requestAnimationFrame(tick);
      if (!shouldRun && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    sync();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] size-full"
    />
  );
}
