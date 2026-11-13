// Pixels publicitaires (Meta / Facebook et TikTok) : identifiants enregistrés depuis le dashboard.
// Seuls les identifiants sont gardés, jamais le code collé : le site écrit lui-même le code des pixels.

export type Pixels = {
  /** Identifiants Meta Pixel (chiffres) */
  meta: string[];
  /** Identifiants TikTok Pixel (lettres et chiffres) */
  tiktok: string[];
};

export const DEFAULT_PIXELS: Pixels = { meta: [], tiktok: [] };
export const MAX_PIXELS = 5;

const META_ID = /^\d{6,20}$/;
const TIKTOK_ID = /^[A-Z0-9]{10,30}$/;

const unique = (ids: string[], valid: RegExp) => [...new Set(ids.map((s) => s.trim()).filter((s) => valid.test(s)))].slice(0, MAX_PIXELS);

export function cleanPixels(raw: unknown): Pixels {
  const p = (raw ?? {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);
  return {
    meta: unique(list(p.meta), META_ID),
    tiktok: unique(list(p.tiktok).map((s) => s.toUpperCase()), TIKTOK_ID),
  };
}

/** Identifiants Meta trouvés dans un code collé (fbq('init', '…') ou ?id=…) ou tapés directement */
export function findMetaIds(text: string): string[] {
  const found = [
    ...[...text.matchAll(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{6,20})['"]/g)].map((m) => m[1]),
    ...[...text.matchAll(/[?&]id=(\d{6,20})/g)].map((m) => m[1]),
  ];
  if (found.length === 0) found.push(...text.split(/[\s,;]+/).filter((s) => META_ID.test(s)));
  return [...new Set(found)];
}

/** Identifiants TikTok trouvés dans un code collé (ttq.load('…')) ou tapés directement */
export function findTiktokIds(text: string): string[] {
  const found = [...text.matchAll(/ttq\.load\(\s*['"]([A-Za-z0-9]{10,30})['"]/g)].map((m) => m[1].toUpperCase());
  if (found.length === 0) found.push(...text.split(/[\s,;]+/).map((s) => s.toUpperCase()).filter((s) => TIKTOK_ID.test(s)));
  return [...new Set(found)];
}
