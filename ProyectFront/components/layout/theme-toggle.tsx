"use client";

import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "size-9 rounded-full",
        onDark
          ? "text-on-media-dim hover:bg-white/10 hover:text-on-media"
          : "text-bone-dim hover:text-foreground"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted ? (
          isDark ? (
            <motion.span
              key="sun"
              className="inline-flex"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE }}
            >
              <Sun className="size-4" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              className="inline-flex"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: DURATION.fast, ease: EASE }}
            >
              <Moon className="size-4" />
            </motion.span>
          )
        ) : (
          <span className="size-4" />
        )}
      </AnimatePresence>
    </Button>
  );
}
