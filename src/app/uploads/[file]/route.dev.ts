import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/content";

// En local : sert les images envoyées depuis le dashboard (DATA_DIR/uploads).
// Les images du contenu de départ sont dans public/uploads.

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^[\w-]+\.(jpg|png|webp|gif|avif)$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  for (const dir of [UPLOADS_DIR]) {
    try {
      const data = await readFile(path.join(dir, file));
      return new Response(data, {
        headers: {
          "Content-Type": MIME[match[1]],
          // Noms de fichiers uniques : on peut mettre en cache longtemps
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {}
  }
  return new Response("Not found", { status: 404 });
}
