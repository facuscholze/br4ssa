"use client";

/** Signals that the ember loader has finished so the hero can start its
 *  entrance reveal. Module-level flag + listeners, so the loader and the
 *  hero don't need a shared React parent. */

import { useSyncExternalStore } from "react";

let ready = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/** Reactive version of the ready signal (server snapshot: false, so SSR
 *  renders the pre-loader state — same pattern as useScrolled). */
export function useBrasaReady() {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false
  );
}

export function isBrasaReady() {
  return ready;
}

export function notifyBrasaReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Subscribes to the ready signal. If it already fired, the callback runs
 *  immediately (idempotent). */
export function onBrasaReady(callback: () => void) {
  if (ready) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
