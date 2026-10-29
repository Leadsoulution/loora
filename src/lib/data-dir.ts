import path from "node:path";

// Données modifiables en local (`npm run dev`) : contenu, images envoyées, commandes.
// En ligne, c'est l'API PHP (public/api) qui les gère.
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");

// Contenu de départ livré avec le site, utilisé tant que rien n'a été enregistré.
export const SEED_CONTENT = path.join(process.cwd(), "public", "api", "seed.json");

// Contenu en ligne récupéré juste avant la compilation (scripts/fetch-content.mjs) : les pages HTML sont générées avec.
export const BUILT_CONTENT = path.join(process.cwd(), "public", "api", "built.json");
