// Pixels publicitaires (Meta, TikTok, Snapchat, Google) : identifiants enregistrés depuis le dashboard.
// Seuls les identifiants sont gardés, jamais le code collé : le site écrit lui-même le code des pixels.

export type Pixels = {
  /** Identifiants Meta Pixel (chiffres) */
  meta: string[];
  /** Identifiants TikTok Pixel (lettres et chiffres) */
  tiktok: string[];
  /** Identifiants Snap Pixel (format 4677f870-e000-4597-a073-abeea4dc3f23) */
  snap: string[];
  /** Google : G-… (Analytics), AW-… (Ads), ou AW-…/étiquette pour compter les achats comme conversion Ads */
  google: string[];
};

export type PixelKind = keyof Pixels;

export const DEFAULT_PIXELS: Pixels = { meta: [], tiktok: [], snap: [], google: [] };
export const MAX_PIXELS = 5;

const VALID: Record<PixelKind, RegExp> = {
  meta: /^\d{6,20}$/,
  tiktok: /^[A-Z0-9]{10,30}$/,
  snap: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  google: /^(G|GT|AW|DC)-[A-Z0-9]{4,20}(\/[\w-]{3,40})?$/,
};

/** Écriture normale d'un identifiant (majuscules ou minuscules selon la plateforme) */
function normalize(kind: PixelKind, id: string) {
  const v = id.trim();
  if (kind === "tiktok") return v.toUpperCase();
  if (kind === "snap") return v.toLowerCase();
  if (kind === "google") {
    const [base, label] = v.split("/");
    return label ? `${base.toUpperCase()}/${label}` : base.toUpperCase();
  }
  return v;
}

export const isPixelId = (kind: PixelKind, id: string) => VALID[kind].test(normalize(kind, id));

export function cleanPixels(raw: unknown): Pixels {
  const p = (raw ?? {}) as Record<string, unknown>;
  const clean = (kind: PixelKind) => {
    const list = Array.isArray(p[kind]) ? (p[kind] as unknown[]).filter((s): s is string => typeof s === "string") : [];
    const ids = list.map((s) => normalize(kind, s)).filter((s) => VALID[kind].test(s));
    return [...new Set(ids)].slice(0, MAX_PIXELS);
  };
  return { meta: clean("meta"), tiktok: clean("tiktok"), snap: clean("snap"), google: clean("google") };
}

/** Motifs reconnus dans le code officiel de chaque plateforme */
const IN_CODE: Record<PixelKind, RegExp[]> = {
  meta: [/fbq\(\s*['"]init['"]\s*,\s*['"](\d{6,20})['"]/g, /[?&]id=(\d{6,20})/g],
  tiktok: [/ttq\.load\(\s*['"]([A-Za-z0-9]{10,30})['"]/g],
  snap: [/snaptr\(\s*['"]init['"]\s*,\s*['"]([0-9a-fA-F-]{36})['"]/g],
  google: [
    /gtag\(\s*['"]config['"]\s*,\s*['"]((?:G|GT|AW|DC)-[A-Za-z0-9]{4,20})['"]/g,
    /send_to['"]?\s*:\s*['"]((?:AW|DC)-[A-Za-z0-9]{4,20}\/[\w-]{3,40})['"]/g,
    /[?&]id=((?:G|GT|AW|DC)-[A-Za-z0-9]{4,20})/g,
  ],
};

/** Identifiants trouvés dans un code collé, ou tapés directement (séparés par des espaces ou des virgules) */
export function findPixelIds(kind: PixelKind, text: string): string[] {
  const fromCode = IN_CODE[kind].flatMap((re) => [...text.matchAll(re)].map((m) => normalize(kind, m[1])));
  let found = fromCode.filter((id) => VALID[kind].test(id));
  // Google : une étiquette de conversion (AW-…/xxx) remplace l'identifiant AW-… seul
  if (kind === "google") found = found.filter((id) => !found.some((o) => o.startsWith(`${id}/`)));
  if (found.length === 0) {
    found = text
      .split(/[\s,;]+/)
      .map((s) => normalize(kind, s))
      .filter((s) => VALID[kind].test(s));
  }
  return [...new Set(found)];
}

export const findMetaIds = (text: string) => findPixelIds("meta", text);
export const findTiktokIds = (text: string) => findPixelIds("tiktok", text);
