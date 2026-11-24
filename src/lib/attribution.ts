"use client";

// Source d'une commande : d'où vient le client (publicité Facebook, TikTok, Snapchat, Google…).
// Repérée à l'arrivée sur une page produit, gardée 30 jours dans le navigateur, envoyée avec la commande.
// Les valeurs (facebook, tiktok…) sont celles qu'Orderly reconnaît dans sa colonne « Plateforme ».

export type Attribution = {
  /** facebook, instagram, tiktok, snapchat, google, youtube, whatsapp, direct, ou le site d'origine */
  source: string;
  medium: string;
  campaign: string;
  content: string;
};

const KEY = "loora-source";
const DAYS_30 = 30 * 24 * 3600 * 1000;

/** Écritures rencontrées dans les liens publicitaires et les sites d'origine */
const ALIASES: [RegExp, string][] = [
  [/^(fb|facebook|meta|.*facebook\.com)$/, "facebook"],
  [/^(ig|insta|instagram|.*instagram\.com)$/, "instagram"],
  [/^(tt|tiktok|.*tiktok\.com)$/, "tiktok"],
  [/^(sc|snap|snapchat|.*snapchat\.com)$/, "snapchat"],
  [/^(g|google|gads|adwords|.*google\.[a-z.]+)$/, "google"],
  [/^(yt|youtube|.*youtube\.com|youtu\.be)$/, "youtube"],
  [/^(wa|whatsapp|.*whatsapp\.com|wa\.me)$/, "whatsapp"],
];

const clip = (v: string | null | undefined) => (v ?? "").trim().slice(0, 100);

export function normalizeSource(raw: string) {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  return ALIASES.find(([re]) => re.test(v))?.[1] ?? v.replace(/^www\./, "").slice(0, 40);
}

/** Source de la visite en cours, d'après le lien et le site d'origine */
function fromVisit(): Attribution {
  const q = new URLSearchParams(window.location.search);
  const get = (...names: string[]) => names.map((n) => q.get(n)).find(Boolean) ?? "";
  const referrerHost = (() => {
    try {
      const host = new URL(document.referrer).hostname;
      return host && host !== window.location.hostname ? host : "";
    } catch {
      return "";
    }
  })();

  let source = normalizeSource(get("utm_source"));
  let medium = clip(get("utm_medium"));
  // Pas de paramètre utm : l'identifiant de clic ajouté par chaque régie publicitaire
  if (!source) {
    if (get("fbclid")) source = normalizeSource(referrerHost) === "instagram" ? "instagram" : "facebook";
    else if (get("ttclid")) source = "tiktok";
    else if (get("ScCid", "sccid", "sc_cid")) source = "snapchat";
    else if (get("gclid", "gbraid", "wbraid")) source = "google";
    if (source && !medium) medium = "paid";
  }
  if (!source && referrerHost) {
    source = normalizeSource(referrerHost);
    medium = medium || "referral";
  }
  return {
    source: source || "direct",
    medium,
    campaign: clip(get("utm_campaign")),
    content: clip(get("utm_content")),
  };
}

/**
 * À l'arrivée sur une page : une visite directe n'efface pas une publicité vue avant
 * (le client revient souvent taper l'adresse pour commander).
 */
export function captureAttribution() {
  try {
    const visit = fromVisit();
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const fresh = saved && Date.now() - saved.at < DAYS_30;
    if (visit.source === "direct" && fresh) return;
    localStorage.setItem(KEY, JSON.stringify({ ...visit, at: Date.now() }));
  } catch {}
}

/** Source à joindre à la commande */
export function getAttribution(): Attribution {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && Date.now() - saved.at < DAYS_30 && typeof saved.source === "string") {
      return { source: saved.source, medium: saved.medium ?? "", campaign: saved.campaign ?? "", content: saved.content ?? "" };
    }
  } catch {}
  try {
    return fromVisit();
  } catch {
    return { source: "direct", medium: "", campaign: "", content: "" };
  }
}

/** Nom et couleur affichés dans le dashboard */
export const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E4405F" },
  tiktok: { label: "TikTok", color: "#010101" },
  snapchat: { label: "Snapchat", color: "#C9A800" },
  google: { label: "Google", color: "#4285F4" },
  youtube: { label: "YouTube", color: "#FF0000" },
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  direct: { label: "Direct", color: "#6B7280" },
};
