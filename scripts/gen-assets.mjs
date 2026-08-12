// One-off asset generator for PWA icons and the OG/social share image.
// Not part of the build — run manually with `node scripts/gen-assets.mjs`
// whenever the source SVGs or the OG source photo change.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pub = (name) =>
  fileURLToPath(new URL(`../public/${name}`, import.meta.url));

async function icons() {
  const anySvg = readFileSync(pub("icon.svg"));
  const maskableSvg = readFileSync(pub("icon-maskable.svg"));

  await sharp(anySvg).resize(192, 192).png().toFile(pub("icon-192.png"));
  await sharp(anySvg).resize(512, 512).png().toFile(pub("icon-512.png"));
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(pub("icon-maskable-512.png"));

  // iOS ignores manifest icons and wants an opaque, non-rounded 180x180 —
  // it applies its own corner mask.
  await sharp(anySvg)
    .resize(180, 180)
    .flatten({ background: "#14100d" })
    .png()
    .toFile(pub("apple-touch-icon.png"));

  console.log("icons: done");
}

async function ogImage() {
  await sharp(pub("images/hero-grill-flames.jpg"))
    .resize(1200, 630, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 82 })
    .toFile(pub("images/og-cover.jpg"));
  console.log("og image: done");
}

await icons();
await ogImage();
