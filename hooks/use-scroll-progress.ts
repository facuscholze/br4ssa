"use client";

import { useSyncExternalStore } from "react";

const SCROLLED_AT = 40;

type FrameListener = (progress: number, y: number) => void;

const scrolledListeners = new Set<() => void>();
const frameListeners = new Set<FrameListener>();

let scrolled = false;
let scrollable = 0;
let rafId = 0;
let attached = false;
let observer: ResizeObserver | null = null;

/** Document height changes as images decode and sections mount, so it is cached
 *  and re-measured on resize instead of read on every scroll event. */
function measure() {
  scrollable = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0
  );
}

function read() {
  rafId = 0;
  const y = window.scrollY;
  const progress = scrollable > 0 ? Math.min(y / scrollable, 1) : 0;

  frameListeners.forEach((listener) => listener(progress, y));

  const next = y > SCROLLED_AT;
  if (next !== scrolled) {
    scrolled = next;
    scrolledListeners.forEach((listener) => listener());
  }
}

function schedule() {
  if (rafId) return;
  rafId = requestAnimationFrame(read);
}

function remeasure() {
  measure();
  schedule();
}

function attach() {
  if (attached) return;
  attached = true;
  measure();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure, { passive: true });
  if ("ResizeObserver" in window) {
    observer = new ResizeObserver(remeasure);
    observer.observe(document.documentElement);
  }
  read();
}

function detach() {
  if (attached === false) return;
  if (scrolledListeners.size > 0 || frameListeners.size > 0) return;
  attached = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", remeasure);
  observer?.disconnect();
  observer = null;
}

function subscribeScrolled(callback: () => void) {
  scrolledListeners.add(callback);
  attach();
  return () => {
    scrolledListeners.delete(callback);
    detach();
  };
}

/**
 * rAF-throttled scroll readout for imperative DOM writes — progress is `0..1`
 * and `y` is `window.scrollY`. Never triggers a React render.
 */
export function subscribeScrollFrame(listener: FrameListener) {
  frameListeners.add(listener);
  attach();
  return () => {
    frameListeners.delete(listener);
    detach();
  };
}

/** Re-renders only when the page crosses the "scrolled past the hero lip" line. */
export function useScrolled() {
  return useSyncExternalStore(
    subscribeScrolled,
    () => scrolled,
    () => false
  );
}
