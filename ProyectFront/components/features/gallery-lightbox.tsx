"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { GalleryImage } from "@/lib/types";

const navButtonClass =
  "flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:bg-black/60 active:scale-90 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none";

export function GalleryLightbox({
  image,
  onClose,
  onPrev,
  onNext,
}: {
  image: GalleryImage | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Arrow keys navigate while the lightbox is open; Escape-to-close and focus
  // trapping are already handled by the underlying Dialog primitive.
  useEffect(() => {
    if (!image) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, onPrev, onNext]);

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton
        className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:top-2 [&>button]:right-2 [&>button]:text-white"
      >
        <DialogTitle className="sr-only">{image?.alt}</DialogTitle>
        {image && (
          // A nested wrapper, not a direct child of DialogContent, so these
          // nav buttons don't inherit the close button's [&>button] styling.
          <div className="relative">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 896px, 100vw"
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />
            <button
              type="button"
              onClick={onPrev}
              aria-label="Imagen anterior"
              className={`absolute top-1/2 left-2 -translate-y-1/2 ${navButtonClass}`}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Imagen siguiente"
              className={`absolute top-1/2 right-2 -translate-y-1/2 ${navButtonClass}`}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
