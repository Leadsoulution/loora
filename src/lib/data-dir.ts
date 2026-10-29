import path from "node:path";

// Données modifiables (contenu, images envoyées, commandes).
// En production, DATA_DIR pointe vers un dossier hors du projet pour survivre aux redéploiements.
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");

// Contenu de départ livré avec le code (versionné dans Git), utilisé tant que DATA_DIR est vide.
export const SEED_DIR = path.join(process.cwd(), "seed");
