import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cleanStore, type Store } from "./content-types";
import { DATA_DIR, SEED_CONTENT } from "./data-dir";

// Contenu modifiable (textes, images, sections, couleurs), stocké dans DATA_DIR/content.json.
// Utilisé uniquement en local par les routes *.dev.ts ; en ligne, voir public/api.

const CONTENT_FILE = path.join(DATA_DIR, "content.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export async function readStore(): Promise<Store> {
  // Rien encore enregistré : on part du contenu de départ
  for (const file of [CONTENT_FILE, SEED_CONTENT]) {
    try {
      return cleanStore(JSON.parse(await readFile(file, "utf8")));
    } catch {}
  }
  return cleanStore({});
}

export async function saveStore(store: Store) {
  await mkdir(path.dirname(CONTENT_FILE), { recursive: true });
  // Écriture atomique : on écrit dans un fichier temporaire puis on renomme
  const tmp = `${CONTENT_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await rename(tmp, CONTENT_FILE);
}

export async function getProductContent(slug: string) {
  return (await readStore()).products[slug];
}
