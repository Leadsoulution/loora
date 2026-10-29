import type { FormField, ProductContent } from "./content-types";
import { getProduct, METALS, type Metal } from "./products";

export type OrderInput = {
  slug: string;
  metal: Metal;
  size?: string;
  /** Identifiant de l'offre choisie (voir ProductContent.offers) */
  offer: string;
  /** Valeurs du formulaire, par id de champ (voir ProductContent.fields) */
  values: Record<string, string>;
};

/** Erreurs par id de champ, plus « size » et « form » */
export type OrderErrors = Partial<Record<string, string>>;

const PHONE_ERROR = "رقم الهاتف غير صحيح. المرجو إدخال رقم مغربي صحيح مثل 06XXXXXXXX.";
const REQUIRED_ERROR: Record<string, string> = {
  name: "المرجو إدخال الاسم الكامل.",
  city: "المرجو إدخال المدينة.",
  address: "المرجو إدخال العنوان.",
};

/** Numéro marocain : 05/06/07 + 8 chiffres, ou +212 / 00212 */
export function isValidPhone(phone: string) {
  const compact = phone.replace(/[\s.-]/g, "");
  return /^(?:\+212|00212|0)[5-7]\d{8}$/.test(compact);
}

/** Longueur maximale d'une réponse */
export const fieldMaxLength = (f: FormField) => (f.kind === "phone" ? 17 : f.kind === "long" ? 1000 : 200);

/**
 * Validation partagée entre le formulaire (client) et l'API (serveur).
 * `content` donne les offres, tailles et champs en vigueur pour le produit.
 */
export function validateOrder(input: OrderInput, content: ProductContent | undefined): OrderErrors {
  const errors: OrderErrors = {};
  if (!getProduct(input.slug) || !content) return { form: "المنتج غير موجود." };
  if (!METALS.includes(input.metal) || !content.offers.some((o) => o.id === input.offer)) {
    errors.form = "العرض غير صالح.";
  } else if (content.sizes.length > 0 && !content.sizes.includes(input.size ?? "")) {
    errors.size = "المرجو اختيار المقاس.";
  }
  for (const f of content.fields) {
    const v = (input.values[f.id] ?? "").trim();
    if (f.kind === "phone") {
      if ((f.required || v) && !isValidPhone(v)) errors[f.id] = PHONE_ERROR;
    } else if (f.required && v.length < 2) {
      errors[f.id] = REQUIRED_ERROR[f.id] ?? "المرجو ملء هذا الحقل.";
    }
  }
  return errors;
}
