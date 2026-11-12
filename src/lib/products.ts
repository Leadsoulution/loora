export type Category = "bagues" | "colliers" | "boucles" | "bracelets";
export type Metal = "or" | "argent" | "rose";
export type Stone =
  | "diamant"
  | "saphir"
  | "emeraude"
  | "rubis"
  | "perle"
  | "onyx"
  | "aigue"
  | "none";

export type Product = {
  slug: string;
  name: string;
  category: Category;
  metal: Metal;
  stone: Stone;
  price: number;
  /** Prix barré (avant remise) */
  compareAt: number;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  bagues: "Bague",
  colliers: "Collier",
  boucles: "Boucles d'oreilles",
  bracelets: "Bracelet",
};

export const METAL_LABEL: Record<Metal, string> = {
  or: "Acier inoxydable doré",
  argent: "Acier inoxydable argenté",
  rose: "Acier inoxydable or rose",
};

/** Les produits du site. Textes, prix et photos se modifient dans le dashboard (/admin). */
export const PRODUCTS: Product[] = [
  { slug: "bague-aube", name: "Aube", category: "bagues", metal: "or", stone: "saphir", price: 420, compareAt: 590 },
  { slug: "collier-lune-dor", name: "Lune d'Or", category: "colliers", metal: "or", stone: "perle", price: 340, compareAt: 450 },
  { slug: "boucles-goutte", name: "Goutte", category: "boucles", metal: "or", stone: "rubis", price: 310, compareAt: 420 },
  { slug: "magic-heart", name: "Magic Heart", category: "colliers", metal: "argent", stone: "none", price: 199, compareAt: 299 },
];

export const RING_SIZES = [48, 50, 52, 54, 56, 58];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export const METALS: Metal[] = ["or", "argent", "rose"];

/** Offres par quantité affichées dans le formulaire de commande */
export const OFFERS = [
  { qty: 1, discount: 0, label: "قطعة واحدة", tag: null },
  { qty: 2, discount: 0.1, label: "قطعتان", tag: "الأكثر طلباً" },
  { qty: 3, discount: 0.2, label: "3 قطع", tag: "أفضل عرض" },
] as const;

export function offerTotal(price: number, qty: number) {
  const offer = OFFERS.find((o) => o.qty === qty) ?? OFFERS[0];
  return Math.round(price * offer.qty * (1 - offer.discount));
}

/** Prix en dirhams pour le dashboard */
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 });

export function formatPrice(value: number) {
  return money.format(value);
}

export function formatDh(value: number) {
  return `${value} درهم`;
}
