// Définit le mot de passe du dashboard en ligne (public/api/config.php).
// Usage : npm run password -- "nouveau mot de passe"
// Sans argument, reprend ADMIN_PASSWORD de .env.local (le mot de passe utilisé en local).
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const CONFIG = new URL("../public/api/config.php", import.meta.url);
const ITERATIONS = 100000;

let password = process.argv[2];
if (!password) {
  try {
    password = /^ADMIN_PASSWORD=(.*)$/m.exec(readFileSync(new URL("../.env.local", import.meta.url), "utf8"))?.[1]?.trim();
  } catch {}
}
if (!password || password.length < 8) {
  console.error('Mot de passe manquant ou trop court (8 caractères minimum) : npm run password -- "votre mot de passe"');
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");

const config = readFileSync(CONFIG, "utf8")
  .replace(/const ADMIN_SALT = '[^']*';/, `const ADMIN_SALT = '${salt}';`)
  .replace(/const ADMIN_HASH = '[^']*';/, `const ADMIN_HASH = '${hash}';`)
  .replace(/const ADMIN_ITERATIONS = \d+;/, `const ADMIN_ITERATIONS = ${ITERATIONS};`);
writeFileSync(CONFIG, config);
console.log("Mot de passe du dashboard enregistré dans public/api/config.php. Publiez le site pour l'appliquer.");
