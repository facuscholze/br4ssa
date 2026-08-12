import type { NextConfig } from "next";

// GitHub Pages serves this repo from /JyF, not from the domain root.
// Same var read by lib/data.ts (withBasePath) — keep both in sync.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    // GitHub Pages has no server, so Next's image optimization API is unavailable.
    unoptimized: true,
  },
};

export default nextConfig;
