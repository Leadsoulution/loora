import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { UPLOADS_DIR } from "@/lib/content";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Format accepté : JPG, PNG, WEBP, GIF ou AVIF." }, { status: 415 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Image trop lourde (8 Mo maximum)." }, { status: 413 });

  const base = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const name = `${base}.${ext}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()));

  // Variantes préparées par le dashboard : 800 px (« .m.webp ») et 240 px (« .t.webp »)
  for (const [field, suffix] of [["medium", "m"], ["thumb", "t"]]) {
    const variant = form?.get(field);
    if (variant instanceof File && variant.type === "image/webp" && variant.size <= MAX_SIZE) {
      await writeFile(path.join(UPLOADS_DIR, `${base}.${suffix}.webp`), Buffer.from(await variant.arrayBuffer()));
    }
  }

  return NextResponse.json({ url: `/uploads/${name}` });
}
