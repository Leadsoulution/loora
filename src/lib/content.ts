import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cacheTag } from "next/cache";
import { cleanStore, type Store } from "./content-types";
import { DATA_DIR, SEED_DIR } from "./data-dir";

// Contenu modifiable (textes, images, sections, couleurs), stocké dans data/content.json.

export const CONTENT_TAG = "content";
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const SEED_UPLOADS_DIR = path.join(SEED_DIR, "uploads");

/** Lecture directe du fichier, sans cache (dashboard). */
export async function readStore(): Promise<Store> {
  // Premier lancement en ligne : rien encore enregistré, on part du contenu de départ
  for (const file of [CONTENT_FILE, path.join(SEED_DIR, "content.json")]) {
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

/** Lecture mise en cache pour les pages publiques ; invalidée à chaque sauvegarde. */
export async function getStore(): Promise<Store> {
  "use cache";
  cacheTag(CONTENT_TAG);
  return readStore();
}

export async function getProductContent(slug: string) {
  const store = await getStore();
  return store.products[slug];
}
