// Prépare les images de public/uploads pour un chargement rapide :
//  - PNG/JPG → WebP (1600 px maximum), en gardant le même nom de base
//  - variantes « .m.webp » (800 px, photo principale sur mobile) et « .t.webp » (240 px, miniatures)
// Usage : npm run images   (les dashboards en ligne créent ces variantes eux-mêmes à l'envoi)
import { readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "uploads");
const VARIANTS = { m: 800, t: 240 };
const files = readdirSync(DIR);
const exists = (name) => files.includes(name);

for (const file of files) {
  const match = /^([\w-]+)\.(jpg|jpeg|png|webp|avif)$/.exec(file);
  if (!match) continue;
  const [, base, ext] = match;
  const source = path.join(DIR, file);

  if (ext !== "webp" && !exists(`${base}.webp`)) {
    await sharp(source)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(DIR, `${base}.webp`));
    console.log(`${file} → ${base}.webp`);
  }
  for (const [suffix, size] of Object.entries(VARIANTS)) {
    const name = `${base}.${suffix}.webp`;
    if (exists(name)) continue;
    await sharp(source)
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: suffix === "t" ? 70 : 78 })
      .toFile(path.join(DIR, name));
    console.log(`${file} → ${name}`);
  }
}
