import type Lenis from "lenis";

/**
 * Lenis smooth-scroll singleton. `lenis` and `gsap` are dynamic imports so
 * neither lands in the initial client bundle; they resolve from one shared
 * chunk (the loader and the hero import the same modules).
 *
 * Lenis keeps native window scrolling, so everything that reads
 * `window.scrollY` today (useScrolled, subscribeScrollFrame, the marquee
 * sticky, ScrollProgress) keeps working unchanged.
 */

let lenis: Lenis | null = null;
let initPromise: Promise<Lenis | null> | null = null;
let tickerFn: ((time: number) => void) | null = null;
let anchorAttached = false;

function headerOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--header-h"
  );
  const value = parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? -value : -73;
}

function onAnchorClick(event: MouseEvent) {
  if (!lenis) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = (event.target as Element | null)?.closest?.('a[href^="#"]');
  if (!(target instanceof HTMLAnchorElement)) return;
  const hash = target.getAttribute("href");
  if (!hash || hash.length < 2) return;
  let section: Element | null = null;
  try {
    section = document.querySelector(hash);
  } catch {
    return;
  }
  if (!(section instanceof HTMLElement)) return;
  event.preventDefault();
  if (history.pushState) history.pushState(null, "", hash);
  lenis.scrollTo(section, { offset: headerOffset(), duration: 1.1 });
}

/** Initializes Lenis once. No-op under prefers-reduced-motion or on failure. */
export function initLenis(): Promise<Lenis | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (lenis) return Promise.resolve(lenis);
  if (initPromise) return initPromise;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve(null);
  }

  initPromise = (async () => {
    try {
      const [lenisModule, gsapModule, stModule] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      const { default: Lenis } = lenisModule;
      const { default: gsap } = gsapModule;
      const { ScrollTrigger } = stModule;
      if (lenis) return lenis;

      gsap.registerPlugin(ScrollTrigger);

      const instance = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      lenis = instance;

      // Drive the GSAP ticker from Lenis's rAF so ScrollTrigger scrub stays
      // in sync with the smoothed scroll position.
      if (tickerFn) gsap.ticker.remove(tickerFn);
      tickerFn = (time: number) => {
        if (lenis === instance) instance.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
      instance.on("scroll", ScrollTrigger.update);

      if (!anchorAttached) {
        anchorAttached = true;
        document.addEventListener("click", onAnchorClick, true);
      }
    } catch (error) {
      console.warn("Lenis could not be initialized", error);
    }
    return lenis;
  })();

  return initPromise;
}

export function stopLenis() {
  lenis?.stop();
}

export function startLenis() {
  lenis?.start();
}

export function disposeLenis() {
  if (tickerFn) {
    const fn = tickerFn;
    tickerFn = null;
    import("gsap")
      .then(({ default: gsap }) => gsap.ticker.remove(fn))
      .catch(() => {});
  }
  if (anchorAttached) {
    anchorAttached = false;
    document.removeEventListener("click", onAnchorClick, true);
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
  initPromise = null;
}
