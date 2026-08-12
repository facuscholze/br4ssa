"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { subscribeScrollFrame } from "@/hooks/use-scroll-progress";

type TiltOptions = {
  /** Max rotation on each axis, in degrees. */
  strength?: number;
  /** Upward lift on hover, in px. */
  lift?: number;
  /** Uniform scale applied while hovered. */
  scale?: number;
  /** In-plane rotation while hovered, in degrees. */
  rotate?: number;
};

/**
 * Also publishes the normalised cursor offset as `--tilt-px` / `--tilt-py`
 * (-0.5 to 0.5) so descendants can parallax against the same pointer.
 */
export function useTilt<T extends HTMLElement>({
  strength = 10,
  lift = 8,
  scale = 1,
  rotate = 0,
}: TiltOptions = {}) {
  const ref = useRef<T | null>(null);
  const rect = useRef<DOMRect | null>(null);
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const enabled = finePointer && !reducedMotion;

  // The cached box is viewport-relative, so scrolling and resizing both stale it.
  useEffect(() => {
    const invalidate = () => {
      rect.current = null;
    };
    const unsubscribe = subscribeScrollFrame(invalidate);
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      unsubscribe();
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  const onMouseEnter = () => {
    if (!enabled || !ref.current) return;
    rect.current = ref.current.getBoundingClientRect();
  };

  const onMouseMove = (event: MouseEvent<T>) => {
    if (!enabled || !ref.current) return;
    const box = rect.current ?? ref.current.getBoundingClientRect();
    rect.current = box;
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    const rotY = px * strength;
    const rotX = -py * strength;
    ref.current.style.transform = `translateY(-${lift}px) perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotate(${rotate}deg) scale(${scale})`;
    ref.current.style.setProperty("--tilt-px", `${px}`);
    ref.current.style.setProperty("--tilt-py", `${py}`);
  };

  const onMouseLeave = () => {
    rect.current = null;
    if (!ref.current) return;
    ref.current.style.transform = "";
    ref.current.style.setProperty("--tilt-px", "0");
    ref.current.style.setProperty("--tilt-py", "0");
  };

  return { ref, onMouseEnter, onMouseMove, onMouseLeave, enabled };
}
