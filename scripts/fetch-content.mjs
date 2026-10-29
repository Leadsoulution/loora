// Avant la compilation : récupère le contenu en ligne (textes, prix, images enregistrés dans le dashboard)
// pour générer les pages HTML avec. Hors ligne : contenu de départ (public/api/seed.json).
// public/api/page.php compare ce fichier au contenu en ligne pour savoir si la page générée est à jour.
import { copyFileSync, writeFileSync } from "node:fs";

const SITE = process.env.SITE_URL ?? "https://loora.ma";
const OUT = new URL("../public/api/built.json", import.meta.url);

try {
  const res = await fetch(`${SITE}/api/content`, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  if (!res.ok || typeof JSON.parse(text)?.products !== "object") throw new Error(`réponse ${res.status}`);
  writeFileSync(OUT, text);
  console.log(`Contenu en ligne récupéré depuis ${SITE}`);
} catch (err) {
  copyFileSync(new URL("../public/api/seed.json", import.meta.url), OUT);
  console.warn(`Contenu en ligne indisponible (${err.message}) : contenu de départ utilisé.`);
}
