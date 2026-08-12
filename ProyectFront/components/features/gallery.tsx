"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Plus } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { SectionHead } from "@/components/ui/section-head";
import { useTilt } from "@/hooks/use-tilt";
import { GALLERY_IMAGES } from "@/lib/data";
import type { GalleryImage } from "@/lib/types";

// The lightbox is never needed on first paint — keep Dialog out of the initial chunk.
const GalleryLightbox = dynamic(() =>
  import("@/components/features/gallery-lightbox").then((m) => m.GalleryLightbox)
);

const HEADING_ID = "galeria-heading";

function GalleryTile({
  image,
  onSelect,
}: {
  image: GalleryImage;
  onSelect: () => void;
}) {
  const { ref, onMouseEnter, onMouseMove, onMouseLeave } =
    useTilt<HTMLButtonElement>({ strength: 5, lift: 5, scale: 1.01 });

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      aria-label={`Ampliar: ${image.alt}`}
      className="group relative mb-5 block w-full cursor-pointer overflow-hidden rounded-2xl break-inside-avoid transition-[transform,box-shadow] duration-400 [transform-style:preserve-3d] hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] hover:will-change-transform focus-visible:ring-3 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-106">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          // Base scale gives the parallax shift room inside the clipped tile.
          style={{
            transform:
              "scale(1.06) translate3d(calc(var(--tilt-px, 0) * -14px), calc(var(--tilt-py, 0) * -14px), 0)",
          }}
          className="h-auto w-full transition-transform duration-300 ease-out"
        />
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-black/0 text-2xl text-white opacity-0 transition-all duration-300 group-hover:bg-black/35 group-hover:opacity-100 group-focus-visible:bg-black/35 group-focus-visible:opacity-100"
      >
        <Plus className="size-7 transition-transform duration-300 group-hover:rotate-90" />
      </span>
    </button>
  );
}

export function Gallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const selected = selectedIndex !== null ? GALLERY_IMAGES[selectedIndex] : null;

  return (
    <section
      id="galeria"
      aria-labelledby={HEADING_ID}
      className="bg-muted/40 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <SectionHead
          center
          titleId={HEADING_ID}
          eyebrow="Un vistazo"
          title="Galería"
          description="El fuego, la mesa y todo lo que pasa entre medio."
        />

        <RevealGroup className="columns-1 gap-5 sm:columns-2 md:columns-3">
          {GALLERY_IMAGES.map((image, index) => (
            <RevealItem key={image.id} className="break-inside-avoid">
              <GalleryTile
                image={image}
                onSelect={() => {
                  setEverOpened(true);
                  setSelectedIndex(index);
                }}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {everOpened && (
        <GalleryLightbox
          image={selected}
          onClose={() => setSelectedIndex(null)}
          onPrev={() =>
            setSelectedIndex((index) =>
              index === null
                ? null
                : (index - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length
            )
          }
          onNext={() =>
            setSelectedIndex((index) =>
              index === null ? null : (index + 1) % GALLERY_IMAGES.length
            )
          }
        />
      )}
    </section>
  );
}
