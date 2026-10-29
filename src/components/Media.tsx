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

/** Affiche une photo (URL) ou l'illustration du bijou ("jewel…"). */
export function Media({
  src,
  art,
  className = "",
  alt = "",
}: {
  src: string;
  art: Art;
  className?: string;
  alt?: string;
}) {
  if (src.startsWith("jewel")) {
    const v = JEWEL_VARIANTS[src] ?? JEWEL_VARIANTS.jewel;
    return <JewelArt {...art} zoom={v.zoom} tone={v.tone} className={className} />;
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} loading="lazy" draggable={false} />;
}
