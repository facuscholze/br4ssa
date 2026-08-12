"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Flame, Menu } from "lucide-react";
import { motion } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Magnetic } from "@/components/motion/magnetic";
import { NAV_LINKS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/use-scroll-progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function Brand({
  onClick,
  onDark,
}: {
  onClick?: () => void;
  onDark: boolean;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <Link
      href="#inicio"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 font-display text-xl transition-colors",
        onDark ? "text-on-media" : "text-foreground"
      )}
    >
      <motion.span
        className="inline-flex"
        initial={reducedMotion ? false : { scale: 0.4, opacity: 0, rotate: -20 }}
        animate={{
          scale: [0.4, 1.3, 1],
          opacity: 1,
          rotate: [-20, 8, 0],
          filter: [
            "drop-shadow(0px 0px 0px rgba(232,85,29,0))",
            "drop-shadow(0px 0px 18px rgba(255,122,61,0.85))",
            "drop-shadow(0px 0px 5px rgba(232,85,29,0.35))",
          ],
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.2, times: [0, 0.5, 1], ease: "easeOut", delay: 0.1 }
        }
      >
        <Flame
          className="size-5 text-ember [animation:flame-flicker_2.4s_ease-in-out_infinite]"
          style={{ transformOrigin: "60% 90%" }}
        />
      </motion.span>
      Bra<span className="text-ember">sa</span>
    </Link>
  );
}

export function Header() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const onDark = !scrolled;
  const headerRef = useRef<HTMLElement>(null);

  // Marquee sticks right below the header, whose height changes with the
  // scrolled state and with text zoom/OS font size — measure it instead of
  // hardcoding a pixel value so the two never drift apart or overlap.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || !("ResizeObserver" in window)) return;
    const setHeight = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${header.offsetHeight}px`
      );
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-6 transition-all duration-300 md:gap-0 md:px-12",
        scrolled &&
          "border-b border-border bg-background/80 py-4 shadow-lg backdrop-blur-md"
      )}
    >
      <Brand onDark={onDark} />

      <nav
        aria-label="Navegación principal"
        className="hidden items-center gap-10 md:flex"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={cn(
              "group relative py-1 text-sm transition-colors",
              onDark
                ? "text-on-media-dim hover:text-on-media"
                : "text-bone-dim hover:text-foreground"
            )}
          >
            {link.label}
            <span className="absolute inset-x-0 -bottom-0.5 h-px w-0 bg-ember transition-all duration-300 group-hover:w-full" />
          </a>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-1 md:gap-3">
        <ThemeToggle onDark={onDark} />
        <Magnetic>
          <Button
            className="rounded-full px-4 text-[13px] md:px-5 md:text-sm"
            nativeButton={false}
            render={<a href="#reservas" />}
          >
            Reservar
          </Button>
        </Magnetic>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menú"
                className={cn(
                  "size-11 md:hidden",
                  onDark && "text-on-media hover:bg-white/10 hover:text-on-media"
                )}
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="top" className="h-svh border-0 bg-background">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <div className="flex h-full flex-col items-center justify-center gap-8">
              {NAV_LINKS.map((link) => (
                <SheetClose
                  key={link.href}
                  render={
                    <a
                      href={link.href}
                      className="font-display text-3xl text-foreground"
                    />
                  }
                >
                  {link.label}
                </SheetClose>
              ))}
              <SheetClose
                render={
                  <a
                    href="#reservas"
                    className={cn(buttonVariants({ size: "lg" }), "mt-4 rounded-full")}
                  />
                }
              >
                Reservar mesa
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
