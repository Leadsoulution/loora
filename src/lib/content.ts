import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cleanStore, type Store } from "./content-types";
import { BUILT_CONTENT, DATA_DIR, SEED_CONTENT } from "./data-dir";

// Contenu modifiable (textes, images, sections, couleurs), stocké dans DATA_DIR/content.json.
// Utilisé uniquement en local par les routes *.dev.ts ; en ligne, voir public/api.

const CONTENT_FILE = path.join(DATA_DIR, "content.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

async function readFirst(files: string[]): Promise<Store> {
  for (const file of files) {
    try {
      return cleanStore(JSON.parse(await readFile(file, "utf8")));
    } catch {}
  }
  return cleanStore({});
}

/** Contenu enregistré en local ; rien encore enregistré : on part du contenu de départ */
export function readStore() {
  return readFirst([CONTENT_FILE, SEED_CONTENT]);
}

/** Contenu des pages HTML générées : en local le contenu courant, à la compilation le contenu en ligne */
export function getPageStore() {
  return process.env.NODE_ENV === "development" ? readStore() : readFirst([BUILT_CONTENT, SEED_CONTENT]);
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
