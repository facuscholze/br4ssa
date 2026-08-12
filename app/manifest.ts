import type { MetadataRoute } from "next";
import { SITE, withBasePath } from "@/lib/data";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} | ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: "es-AR",
    start_url: withBasePath("/"),
    display: "standalone",
    background_color: "#14100d",
    theme_color: "#14100d",
    icons: [
      { src: withBasePath("/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: withBasePath("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
