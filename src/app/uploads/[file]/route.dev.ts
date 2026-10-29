import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/content";

// En local : sert les images envoyées depuis le dashboard (DATA_DIR/uploads).
// Les images du contenu de départ sont dans public/uploads.
// Variante « .m.webp » / « .t.webp » absente : renvoie l'image d'origine (comme public/api/file.php).

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};
const DIRS = [UPLOADS_DIR, path.join(process.cwd(), "public", "uploads")];
const ORIGINAL = /^[\w-]+\.(jpg|png|webp|gif|avif)$/;

async function find(name: string, base: string, variant: boolean) {
  for (const dir of DIRS) {
    try {
      return { data: await readFile(path.join(dir, name)), name };
    } catch {}
  }
  if (!variant) return null;
  for (const dir of DIRS) {
    const original = (await readdir(dir).catch(() => [])).find((f) => f.startsWith(`${base}.`) && ORIGINAL.test(f));
    if (original) return { data: await readFile(path.join(dir, original)), name: original };
  }
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^([\w-]+)(\.[mt])?\.(jpg|png|webp|gif|avif)$/.exec(file);
  const found = match && (await find(file, match[1], !!match[2]));
  if (!found) return new Response("Not found", { status: 404 });

  return new Response(found.data, {
    headers: {
      "Content-Type": MIME[found.name.split(".").pop()!],
      // Noms de fichiers uniques : on peut mettre en cache longtemps
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
