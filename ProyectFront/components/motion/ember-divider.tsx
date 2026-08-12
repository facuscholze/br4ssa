"use client";

import { motion } from "motion/react";
import { DURATION, EASE } from "@/lib/motion";

/** Scroll-triggered draw-in for the .ember-rule seam between sections — the
 *  line's own breathing (ember-breathe keyframe) keeps running untouched on
 *  the inner div; this wrapper only ever animates transform (scaleX), so the
 *  two never fight over the same CSS property. */
export function EmberDivider() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-6xl px-6 md:px-12">
      <motion.div
        className="origin-center"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: DURATION.slow, ease: EASE }}
      >
        <div className="ember-rule" />
      </motion.div>
    </div>
  );
}
