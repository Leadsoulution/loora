/* eslint-disable @next/next/no-img-element -- images envoyées depuis le dashboard, servies telles quelles */
import { JewelArt } from "./JewelArt";
import type { Category, Metal, Stone } from "@/lib/products";

type Art = { category: Category; metal: Metal; stone: Stone };

const JEWEL_VARIANTS: Record<string, { zoom: number; tone: "light" | "dark" }> = {
  jewel: { zoom: 1, tone: "light" },
  "jewel:zoom": { zoom: 1.7, tone: "light" },
  "jewel:dark": { zoom: 1, tone: "dark" },
  "jewel:zoom-dark": { zoom: 1.35, tone: "dark" },
  "jewel:macro": { zoom: 2.3, tone: "light" },
};

/**
 * Variante redimensionnée d'une image envoyée : « .m.webp » (800 px) ou « .t.webp » (240 px).
 * Créées à l'envoi depuis le dashboard ; le serveur renvoie l'original si elles manquent.
 */
export function uploadVariant(src: string, variant: "m" | "t") {
  return /^\/uploads\/[\w-]+\.\w+$/.test(src) ? src.replace(/\.\w+$/, `.${variant}.webp`) : null;
}

/** Affiche une photo (URL) ou l'illustration du bijou ("jewel…"). */
export function Media({
  src,
  art,
  className = "",
  alt = "",
  thumb = false,
  priority = false,
}: {
  src: string;
  art: Art;
  className?: string;
  alt?: string;
  /** Petite image (miniature, offre, barre collante) */
  thumb?: boolean;
  /** Image principale visible au chargement : téléchargée en premier */
  priority?: boolean;
}) {
  if (src.startsWith("jewel")) {
    const v = JEWEL_VARIANTS[src] ?? JEWEL_VARIANTS.jewel;
    return <JewelArt {...art} zoom={v.zoom} tone={v.tone} className={className} />;
  }
  const medium = uploadVariant(src, "m");
  return (
    <img
      src={(thumb && uploadVariant(src, "t")) || src}
      srcSet={!thumb && medium ? `${medium} 800w, ${src} 1600w` : undefined}
      sizes={!thumb && medium ? "(max-width: 960px) 100vw, 600px" : undefined}
      alt={alt}
      className={`object-cover ${className}`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      draggable={false}
    />
  );
}
