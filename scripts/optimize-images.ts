import fs from "node:fs";
import path from "node:path";
import sharp, { type ResizeOptions } from "sharp";

const ASSETS_DIR = path.join(process.cwd(), "public", "assets");

interface OptimizeOptions {
  quality: number;
  resize?: ResizeOptions;
}

function outputName(src: string, ext: "webp" | "avif"): string {
  return src.replace(/\.(png|jpe?g)$/i, `.${ext}`);
}

async function toWebp(name: string, opts: OptimizeOptions): Promise<void> {
  const src = path.join(ASSETS_DIR, name);
  const out = outputName(src, "webp");
  let pipeline = sharp(src);
  if (opts.resize) pipeline = pipeline.resize(opts.resize);
  await pipeline.webp({ quality: opts.quality }).toFile(out);
  const before = fs.statSync(src).size;
  const after = fs.statSync(out).size;
  console.log(
    `${name} -> ${path.basename(out)}: ${formatSize(before)} -> ${formatSize(after)}`
  );
}

async function toAvif(name: string, opts: OptimizeOptions): Promise<void> {
  const src = path.join(ASSETS_DIR, name);
  const out = outputName(src, "avif");
  let pipeline = sharp(src);
  if (opts.resize) pipeline = pipeline.resize(opts.resize);
  await pipeline.avif({ quality: opts.quality }).toFile(out);
  const after = fs.statSync(out).size;
  console.log(`${name} -> ${path.basename(out)}: ${formatSize(after)}`);
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} КБ`;
}

async function main() {
  await toWebp("hero-cleaning.png", { quality: 82 });
  await toAvif("hero-cleaning.png", { quality: 60 });

  const galleryJpgs = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => /^photo_.*\.jpg$/i.test(f));
  for (const file of galleryJpgs) {
    await toWebp(file, {
      quality: 78,
      resize: { width: 768, withoutEnlargement: true },
    });
  }

  await toWebp("logo.png", {
    quality: 85,
    resize: { height: 88 },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
