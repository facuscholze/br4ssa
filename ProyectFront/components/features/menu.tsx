"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/motion/reveal";
import { SectionHead } from "@/components/ui/section-head";
import { DURATION, EASE, EASE_CSS, STAGGER } from "@/lib/motion";
import { MENU_TABS } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/types";

const panelContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: STAGGER.tight } },
};

const panelItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

const HEADING_ID = "menu-heading";

export function Menu() {
  const [active, setActive] = useState<MenuCategory>(MENU_TABS[0].id);
  const triggers = useRef(new Map<MenuCategory, HTMLElement>());
  const underlineRef = useRef<HTMLSpanElement>(null);

  /* A 1px bar translated + scaled to the active tab. Motion's `layoutId` would
     run the full layout-projection engine to move two pixels of underline. */
  const positionUnderline = useCallback(() => {
    const bar = underlineRef.current;
    const trigger = triggers.current.get(active);
    if (!bar || !trigger) return;
    bar.style.transform = `translateX(${trigger.offsetLeft}px) scaleX(${trigger.offsetWidth})`;
    // Widths are unknowable server-side, so the bar fades in once placed
    // instead of sliding across from a wrong initial position.
    bar.dataset.placed = "true";
  }, [active]);

  useEffect(() => {
    positionUnderline();
    window.addEventListener("resize", positionUnderline, { passive: true });
    document.fonts?.ready.then(positionUnderline);
    return () => window.removeEventListener("resize", positionUnderline);
  }, [positionUnderline]);

  return (
    <section
      id="menu"
      aria-labelledby={HEADING_ID}
      className="bg-background py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <Reveal>
          <SectionHead
            titleId={HEADING_ID}
            eyebrow="La carta"
            title="Nuestro menú"
            description="Todo lo que servimos, sin vueltas: producto, precio y lo que te vas a encontrar en el plato."
          />
        </Reveal>

        <Tabs
          value={active}
          onValueChange={(value) => setActive(value as MenuCategory)}
        >
          <TabsList
            variant="line"
            className="relative mb-12 h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MENU_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                ref={(node: HTMLElement | null) => {
                  if (node) triggers.current.set(tab.id, node);
                  else triggers.current.delete(tab.id);
                }}
                className={cn(
                  "relative h-auto shrink-0 rounded-none border-0 bg-transparent px-5 py-3 text-[15px] font-semibold text-muted-foreground shadow-none",
                  "data-active:bg-transparent data-active:text-ember dark:data-active:text-ember-hot",
                  "after:hidden"
                )}
              >
                <span aria-hidden="true" className="mr-1.5">
                  {tab.icon}
                </span>
                {tab.label}
              </TabsTrigger>
            ))}
            <span
              ref={underlineRef}
              aria-hidden="true"
              className="absolute bottom-[-1px] left-0 h-0.5 w-px origin-left rounded-full bg-ember opacity-0 shadow-[0_0_10px_color-mix(in_oklch,var(--ember)_70%,transparent)] transition-opacity duration-200 data-placed:opacity-100 motion-safe:data-placed:transition-[transform,opacity] motion-safe:data-placed:duration-300"
              style={{ transitionTimingFunction: EASE_CSS }}
            />
          </TabsList>

          {MENU_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {/* Base UI unmounts inactive panels, so the active one always
                  mounts fresh and replays its enter animation. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab.id}
                  className="grid gap-5 md:grid-cols-2"
                  variants={panelContainer}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {tab.items.map((item) => (
                    <motion.div
                      key={item.name}
                      variants={panelItem}
                      whileHover={{ y: -5 }}
                      className="flex items-center justify-between gap-5 rounded-2xl border border-border bg-card p-6.5 transition-[border-color,box-shadow] duration-300 hover:border-ember hover:shadow-[0_14px_30px_rgba(0,0,0,0.12)] md:p-7 dark:hover:shadow-[0_14px_30px_rgba(0,0,0,0.4)]"
                    >
                      <div>
                        <h3 className="mb-1.5 text-lg font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <p className="max-w-[36ch] text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <span className="font-mono text-[17px] whitespace-nowrap text-gold">
                        {item.price}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">
            ¿Ya sabés lo que vas a pedir? Te guardamos la mesa.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 text-base"
            nativeButton={false}
            render={<a href="#reservas" />}
          >
            Reservar mesa
          </Button>
        </div>
      </div>
    </section>
  );
}
