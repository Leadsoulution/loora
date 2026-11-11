// Modèle du contenu modifiable depuis le dashboard (/admin).
// Ce fichier ne dépend pas du système de fichiers : utilisable côté client et serveur.

import { OFFERS, offerTotal, PRODUCTS, RING_SIZES, type Product } from "./products";
import { CATEGORY_AR, FAQ_AR, METAL_AR, PRODUCT_AR, STONE_AR } from "./products-ar";

export type Theme = {
  accent: string;
  accentDark: string;
  accentSoft: string;
  ink: string;
  muted: string;
  cream: string;
  line: string;
  badge: string;
};

export type SectionLayout = "text" | "list" | "cards" | "steps" | "faq";
export type SectionItem = { title: string; text: string };

export type Section = {
  id: string;
  layout: SectionLayout;
  background: "white" | "cream";
  eyebrow: string;
  title: string;
  /** Partie du titre affichée en couleur */
  highlight: string;
  /** Paragraphes séparés par une ligne vide */
  text: string;
  /** URL d'image, "jewel…" pour l'illustration, ou vide */
  image: string;
  items: SectionItem[];
  /** Texte du bouton (vide = pas de bouton) */
  button: string;
} & SectionStyle;

export type Size = "s" | "m" | "l";
export type ButtonAction = "order" | "link" | "whatsapp";

/** Tailles et bouton d'une section (réglables dans le dashboard) */
export type SectionStyle = {
  titleSize: Size | "xl";
  textSize: Size;
  imageSize: Size | "full";
  spacing: Size;
  buttonAction: ButtonAction;
  /** Lien (https://…) ou numéro WhatsApp selon l'action */
  buttonLink: string;
  buttonSize: Size;
};

export const SECTION_STYLE_DEFAULTS: SectionStyle = {
  titleSize: "m",
  textSize: "m",
  imageSize: "m",
  spacing: "m",
  buttonAction: "order",
  buttonLink: "",
  buttonSize: "m",
};

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

function cleanButtonLink(action: ButtonAction, v: unknown) {
  const s = typeof v === "string" ? v.trim().slice(0, 300) : "";
  if (action === "whatsapp") return s.replace(/[^\d+]/g, "").slice(0, 20);
  if (action === "link") return /^(https:\/\/|tel:|mailto:)/.test(s) ? s : "";
  return "";
}

/** Lien du bouton prêt à l'emploi (null = aller au formulaire de commande) */
export function buttonHref(s: Pick<SectionStyle, "buttonAction" | "buttonLink">): string | null {
  if (s.buttonAction === "link" && s.buttonLink) return s.buttonLink;
  if (s.buttonAction === "whatsapp" && s.buttonLink) {
    const d = s.buttonLink.replace(/\D/g, "");
    const intl = d.startsWith("00") ? d.slice(2) : d.startsWith("0") ? `212${d.slice(1)}` : d;
    return `https://wa.me/${intl}`;
  }
  return null;
}

export type Offer = {
  id: string;
  /** Nombre de pièces */
  qty: number;
  label: string;
  /** Petite ligne sous le titre (vide = prix par pièce calculé automatiquement) */
  note: string;
  /** Prix total de l'offre, payé à la livraison */
  price: number;
  /** Étiquette au-dessus de l'offre (vide = aucune) */
  tag: string;
  tagStyle: "dark" | "gold";
  /** Image de l'offre (vide = photo principale répétée selon le nombre de pièces) */
  image: string;
};

export type FieldKind = "text" | "phone" | "long" | "number";

/** Icônes proposées pour les champs du formulaire (voir components/product/Icon) */
export const FIELD_ICONS = ["user", "phone", "city", "pin", "box", "gift", "heart", "sparkle", "cash"] as const;
export type FieldIcon = (typeof FIELD_ICONS)[number];

/** Champ du formulaire de commande. Les ids name, phone, city, address alimentent les colonnes de la commande. */
export type FormField = {
  id: string;
  /** Texte affiché dans le champ */
  label: string;
  kind: FieldKind;
  required: boolean;
  icon: FieldIcon;
};

export const FIELD_KINDS: { value: FieldKind; label: string }[] = [
  { value: "text", label: "Texte" },
  { value: "phone", label: "Téléphone" },
  { value: "long", label: "Texte long" },
  { value: "number", label: "Nombre" },
];

/** Le téléphone est indispensable pour confirmer une commande COD : ce champ ne peut pas être supprimé. */
export const PHONE_FIELD_ID = "phone";
export const MAX_FIELDS = 10;

export const DEFAULT_FIELDS: FormField[] = [
  { id: "name", label: "الاسم الكامل", kind: "text", required: true, icon: "user" },
  { id: PHONE_FIELD_ID, label: "رقم الهاتف (06XXXXXXXX)", kind: "phone", required: true, icon: "phone" },
  { id: "city", label: "المدينة", kind: "text", required: true, icon: "city" },
  { id: "address", label: "العنوان (الحي، الشارع، رقم المنزل)", kind: "text", required: true, icon: "pin" },
];

export function newField(): FormField {
  return { id: `f${Math.random().toString(36).slice(2, 9)}`, label: "حقل جديد", kind: "text", required: false, icon: "sparkle" };
}

/** Barre « commander » collée en bas de l'écran */
export type StickyBar = {
  enabled: boolean;
  /** "mobile" = téléphones seulement, "all" = aussi sur ordinateur */
  where: "mobile" | "all";
  button: string;
  showImage: boolean;
  /** Nom du produit et prix */
  showText: boolean;
};

export const DEFAULT_STICKY: StickyBar = {
  enabled: true,
  where: "mobile",
  button: "اطلب الآن",
  showImage: true,
  showText: true,
};

export type ProductContent = {
  type: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAt: number;
  /** Galerie : URL d'images ou illustrations "jewel…" */
  images: string[];
  features: string[];
  offers: Offer[];
  /** Tailles proposées (vide = pas de choix de taille) */
  sizes: string[];
  sizeTitle: string;
  /** Champs du formulaire de commande, dans l'ordre d'affichage */
  fields: FormField[];
  sticky: StickyBar;
  sections: Section[];
  /** Design de la page (voir PRODUCT_DESIGNS) */
  design: ProductDesign;
  /** Code article envoyé à Orderly / WooCommerce (vide = identifiant de la page) */
  sku: string;
  /** Nom exact du produit dans le catalogue Orderly : c'est par ce nom qu'Orderly reconnaît le produit */
  orderlyName: string;
};

export type ProductDesign = "classic" | "rose";

export const PRODUCT_DESIGNS: { value: ProductDesign; label: string; hint: string }[] = [
  { value: "classic", label: "Classique", hint: "Fiche LOORA aux couleurs du thème" },
  { value: "rose", label: "Violet « Princesse »", hint: "Page violette : galerie, offres, histoires en photos, FAQ" },
];

export const MAX_OFFERS = 6;

export function newOffer(qty: number, unitPrice: number): Offer {
  return {
    id: Math.random().toString(36).slice(2, 10),
    qty,
    label: qty === 1 ? "قطعة واحدة" : qty === 2 ? "قطعتان" : `${qty} قطع`,
    note: "",
    price: unitPrice * qty,
    tag: "",
    tagStyle: "gold",
    image: "",
  };
}

/** Offres par défaut : 1, 2 (−10 %) et 3 pièces (−20 %) */
export function defaultOffers(unitPrice: number): Offer[] {
  return OFFERS.map((o, i) => ({
    id: `o${o.qty}`,
    qty: o.qty,
    label: o.label,
    note: o.qty === 1 ? "مع علبة هدية مجانية" : "",
    price: offerTotal(unitPrice, o.qty),
    tag: o.tag ?? "",
    tagStyle: i === OFFERS.length - 1 ? "gold" : "dark",
    image: "",
  }));
}

/** En-tête : un arrière-plan (couleur ou image) et le logo (image, sinon texte) centré par-dessus */
export type Logo = {
  /** Texte affiché quand il n'y a pas d'image de logo (vide = pas de logo) */
  text: string;
  textColor: string;
  image: string;
  /** Hauteur du logo en pixels (ordinateur) */
  height: number;
  bgType: "color" | "image";
  bgColor: string;
  bgImage: string;
  /** Hauteur de l'en-tête en pixels (ordinateur) */
  headerHeight: number;
};

export const DEFAULT_LOGO: Logo = {
  text: "LOORA",
  textColor: "#2a211b",
  image: "",
  height: 40,
  bgType: "color",
  bgColor: "#ffffff",
  bgImage: "",
  headerHeight: 70,
};
export const LOGO_HEIGHT = { min: 20, max: 240 };
export const HEADER_HEIGHT = { min: 50, max: 420 };

export type Store = {
  logo: Logo;
  theme: Theme;
  products: Record<string, ProductContent>;
};

export const DEFAULT_THEME: Theme = {
  accent: "#b08a3a",
  accentDark: "#7a5a1c",
  accentSoft: "#faf3e2",
  ink: "#2a211b",
  muted: "#6f6253",
  cream: "#f7f4ea",
  line: "#ece3d0",
  badge: "#c93b3b",
};

/** Couleurs du logo LOORA : bordeaux profond et or rosé */
export const LOGO_THEME: Theme = {
  accent: "#b8844c",
  accentDark: "#5a0f1c",
  accentSoft: "#fbf3ea",
  ink: "#2a0f12",
  muted: "#74585a",
  cream: "#faf4ee",
  line: "#efe0d6",
  badge: "#8c1c2c",
};

export const THEME_PRESETS: { name: string; theme: Theme }[] = [
  { name: "Bordeaux & or", theme: LOGO_THEME },
  { name: "Or", theme: DEFAULT_THEME },
  {
    name: "Émeraude",
    theme: { ...DEFAULT_THEME, accent: "#2c6b3c", accentDark: "#173d22", accentSoft: "#eef5ea", ink: "#14261a", muted: "#56635a", line: "#e4e3d6" },
  },
  {
    name: "Rose",
    theme: { ...DEFAULT_THEME, accent: "#c27a7a", accentDark: "#8e4a4f", accentSoft: "#fbefee", ink: "#3a2326", muted: "#7a6264", cream: "#fbf5f3", line: "#f0dfdc" },
  },
  {
    name: "Noir",
    theme: { ...DEFAULT_THEME, accent: "#3a3a3a", accentDark: "#111111", accentSoft: "#f1f1ef", ink: "#111111", muted: "#5f5f5f", cream: "#f6f6f4", line: "#e3e3e0" },
  },
];

/** Illustrations vectorielles disponibles (utilisées tant qu'aucune photo n'est ajoutée) */
export const JEWEL_IMAGES = ["jewel", "jewel:zoom", "jewel:dark", "jewel:zoom-dark", "jewel:macro"] as const;

export const SECTION_LAYOUTS: { value: SectionLayout; label: string }[] = [
  { value: "text", label: "Texte + image" },
  { value: "list", label: "Liste à puces" },
  { value: "cards", label: "Cartes" },
  { value: "steps", label: "Étapes numérotées" },
  { value: "faq", label: "Questions / réponses" },
];

export function newSection(layout: SectionLayout = "text"): Section {
  return {
    id: Math.random().toString(36).slice(2, 10),
    layout,
    background: "white",
    eyebrow: "عنوان صغير",
    title: "عنوان القسم",
    highlight: "بالألوان",
    text: layout === "text" ? "اكتبي هنا وصف القسم." : "",
    image: "",
    items:
      layout === "text"
        ? []
        : [
            { title: "العنصر الأول", text: layout === "list" ? "" : "وصف قصير" },
            { title: "العنصر الثاني", text: layout === "list" ? "" : "وصف قصير" },
          ],
    button: "",
    ...SECTION_STYLE_DEFAULTS,
  };
}

export function defaultProductContent(product: Product): ProductContent {
  const ar = PRODUCT_AR[product.slug];
  const type = CATEGORY_AR[product.category];
  const fromPrice = Math.round(offerTotal(product.price, 3) / 3);
  const section = (s: Omit<Section, "id" | keyof SectionStyle>, id: string): Section => ({
    id,
    ...SECTION_STYLE_DEFAULTS,
    ...s,
  });

  return {
    type,
    name: product.name,
    tagline: ar.tagline,
    description: ar.description,
    price: product.price,
    compareAt: product.compareAt,
    images: [...JEWEL_IMAGES],
    features: ["مجوهرات أصلية", "مقاومة للصدأ", "صنع يدوي بإتقان", "علبة هدية مجانية"],
    offers: defaultOffers(product.price),
    sizes: product.category === "bagues" ? RING_SIZES.map(String) : [],
    sizeTitle: "اختر المقاس",
    design: "classic",
    sku: "",
    orderlyName: "",
    fields: DEFAULT_FIELDS.map((f) => ({ ...f })),
    sticky: { ...DEFAULT_STICKY },
    sections: [
      section(
        {
          layout: "text",
          background: "white",
          eyebrow: "هدية مثالية",
          title: "هدية تُعبّر عن",
          highlight: "كل مشاعركِ",
          text: `${ar.description}\n\nسواء كانت لكِ أو لشخص عزيز عليكِ، تصل كل قطعة في علبة هدية أنيقة، جاهزة لتُقدَّم في أجمل المناسبات.`,
          image: "jewel:dark",
          items: [],
          button: "اطلبي الآن واستفيدي من العرض",
        },
        "gift",
      ),
      section(
        {
          layout: "list",
          background: "cream",
          eyebrow: "لماذا LOORA؟",
          title: "مجوهرات",
          highlight: "تدوم معكِ",
          text: "",
          image: "",
          items: [
            "فولاذ مقاوم للصدأ عالي الجودة",
            "لا يصدأ ولا يسوَدّ مع الاستعمال اليومي",
            "صنع يدوي بعناية وإتقان",
            "تصاميم أنيقة تناسب كل الإطلالات",
            "ضمان سنتين واسترجاع خلال 30 يوماً",
          ].map((title) => ({ title, text: "" })),
          button: "",
        },
        "why",
      ),
      section(
        {
          layout: "cards",
          background: "white",
          eyebrow: "المواصفات",
          title: "تفاصيل",
          highlight: "القطعة",
          text: "",
          image: "jewel:zoom",
          items: [
            { title: "المعدن", text: METAL_AR[product.metal] },
            { title: "الحجر", text: STONE_AR[product.stone] },
            { title: "التغليف", text: "علبة هدية فاخرة مجانية" },
          ],
          button: "",
        },
        "specs",
      ),
      section(
        {
          layout: "steps",
          background: "cream",
          eyebrow: "طريقة العناية",
          title: "حافظي على",
          highlight: "بريقها",
          text: "",
          image: "",
          items: [
            { title: "تجنّبي العطور", text: "ضعي العطر والكريمات قبل ارتداء القطعة." },
            { title: "نظّفيها بلطف", text: "امسحيها بقطعة قماش ناعمة بعد كل استعمال." },
            { title: "احفظيها في علبتها", text: "لتحافظ على بريقها لسنوات طويلة." },
          ],
          button: "",
        },
        "care",
      ),
      section(
        {
          layout: "faq",
          background: "white",
          eyebrow: "أسئلة شائعة",
          title: "كل ما تريدين",
          highlight: "معرفته",
          text: "",
          image: "",
          items: FAQ_AR.map((f) => ({ title: f.q, text: f.a })),
          button: "",
        },
        "faq",
      ),
      section(
        {
          layout: "text",
          background: "cream",
          eyebrow: "اطلبي الآن",
          title: type,
          highlight: product.name,
          text: `ابتداءً من ${fromPrice} درهم للقطعة · الدفع عند الاستلام · توصيل مجاني`,
          image: "",
          items: [],
          button: "اطلب الآن",
        },
        "final",
      ),
    ],
  };
}

// ---------- Nettoyage des données reçues du dashboard ----------

const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
};
const color = (v: unknown, fallback: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
/** URL d'image acceptée : envoi du dashboard, https, illustration "jewel…" ou vide */
const image = (v: unknown) => {
  const s = str(v, 300);
  return s === "" || s.startsWith("jewel") || /^\/uploads\/[\w.-]+$/.test(s) || /^https:\/\//.test(s) ? s : "";
};
const LAYOUTS = new Set(SECTION_LAYOUTS.map((l) => l.value));

function cleanSection(raw: Record<string, unknown>): Section {
  const items = Array.isArray(raw.items) ? raw.items.slice(0, 30) : [];
  const buttonAction = pick<ButtonAction>(raw.buttonAction, ["order", "link", "whatsapp"], "order");
  return {
    id: str(raw.id, 40) || Math.random().toString(36).slice(2, 10),
    layout: LAYOUTS.has(raw.layout as SectionLayout) ? (raw.layout as SectionLayout) : "text",
    background: raw.background === "cream" ? "cream" : "white",
    eyebrow: str(raw.eyebrow, 200),
    title: str(raw.title, 300),
    highlight: str(raw.highlight, 300),
    text: str(raw.text),
    image: image(raw.image),
    items: items.map((i: Record<string, unknown>) => ({ title: str(i?.title, 500), text: str(i?.text, 2000) })),
    button: str(raw.button, 100),
    titleSize: pick(raw.titleSize, ["s", "m", "l", "xl"], "m"),
    textSize: pick(raw.textSize, ["s", "m", "l"], "m"),
    imageSize: pick(raw.imageSize, ["s", "m", "l", "full"], "m"),
    spacing: pick(raw.spacing, ["s", "m", "l"], "m"),
    buttonAction,
    buttonLink: cleanButtonLink(buttonAction, raw.buttonLink),
    buttonSize: pick(raw.buttonSize, ["s", "m", "l"], "m"),
  };
}

function cleanOffers(raw: unknown, fallback: Offer[]): Offer[] {
  if (!Array.isArray(raw)) return fallback;
  const seen = new Set<string>();
  const offers = raw.slice(0, MAX_OFFERS).flatMap((o: Record<string, unknown>) => {
    const qty = Math.min(20, Math.max(1, Math.round(Number(o?.qty) || 1)));
    let id = str(o?.id, 40) || Math.random().toString(36).slice(2, 10);
    if (seen.has(id)) id = `${id}-${seen.size}`;
    seen.add(id);
    return [
      {
        id,
        qty,
        label: str(o?.label, 80) || `${qty}`,
        note: str(o?.note, 120),
        price: num(o?.price, 0),
        tag: str(o?.tag, 40),
        tagStyle: o?.tagStyle === "dark" ? ("dark" as const) : ("gold" as const),
        image: image(o?.image),
      },
    ];
  });
  // Il faut au moins une offre pour pouvoir commander
  return offers.length > 0 ? offers : fallback.slice(0, 1);
}

// Ids réservés : ils servent déjà de clés dans la commande ou les erreurs du formulaire
const RESERVED_IDS = new Set(["form", "size", "website", "offer", "slug", "metal", "values", "__proto__", "constructor", "prototype"]);

function cleanSticky(raw: unknown): StickyBar {
  const s = (raw ?? {}) as Record<string, unknown>;
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  return {
    enabled: bool(s.enabled, DEFAULT_STICKY.enabled),
    where: pick(s.where, ["mobile", "all"], DEFAULT_STICKY.where),
    button: str(s.button, 40).trim() || DEFAULT_STICKY.button,
    showImage: bool(s.showImage, DEFAULT_STICKY.showImage),
    showText: bool(s.showText, DEFAULT_STICKY.showText),
  };
}

function cleanFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return DEFAULT_FIELDS.map((f) => ({ ...f }));
  const seen = new Set<string>();
  const fields = raw.slice(0, MAX_FIELDS).map((f: Record<string, unknown>): FormField => {
    let id = str(f?.id, 40);
    if (!/^[a-z][\w-]*$/i.test(id) || RESERVED_IDS.has(id) || seen.has(id)) id = newField().id;
    seen.add(id);
    const isPhone = id === PHONE_FIELD_ID;
    return {
      id,
      label: str(f?.label, 120).trim() || "حقل",
      kind: isPhone ? "phone" : pick<FieldKind>(f?.kind, ["text", "phone", "long", "number"], "text"),
      required: isPhone || f?.required === true,
      icon: pick<FieldIcon>(f?.icon, FIELD_ICONS, "sparkle"),
    };
  });
  // Toujours un numéro de téléphone pour pouvoir confirmer la commande
  if (!fields.some((f) => f.id === PHONE_FIELD_ID)) fields.splice(Math.min(1, fields.length), 0, { ...DEFAULT_FIELDS[1] });
  return fields;
}

const clamp = (v: number, r: { min: number; max: number }) => Math.min(r.max, Math.max(r.min, v));
const upload = (v: unknown) => (image(v).startsWith("jewel") ? "" : image(v));

function cleanLogo(l: Record<string, unknown>): Logo {
  // Ancien format « bannière » : l'image devient l'arrière-plan, sans logo par-dessus
  if (l.banner === true && l.bgType === undefined) {
    return { ...DEFAULT_LOGO, text: "", bgType: "image", bgImage: upload(l.image), headerHeight: 270 };
  }
  return {
    text: typeof l.text === "string" ? str(l.text, 40) : DEFAULT_LOGO.text,
    textColor: color(l.textColor, DEFAULT_LOGO.textColor),
    image: upload(l.image),
    height: clamp(num(l.height, DEFAULT_LOGO.height), LOGO_HEIGHT),
    bgType: l.bgType === "image" ? "image" : "color",
    bgColor: color(l.bgColor, DEFAULT_LOGO.bgColor),
    bgImage: upload(l.bgImage),
    headerHeight: clamp(num(l.headerHeight, DEFAULT_LOGO.headerHeight), HEADER_HEIGHT),
  };
}

export function cleanStore(raw: unknown): Store {
  const input = (raw ?? {}) as {
    logo?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    products?: Record<string, Record<string, unknown>>;
  };
  const t = input.theme ?? {};
  const theme = Object.fromEntries(
    Object.entries(DEFAULT_THEME).map(([k, v]) => [k, color(t[k], v)]),
  ) as Theme;

  const products: Record<string, ProductContent> = {};
  for (const product of PRODUCTS) {
    const p = input.products?.[product.slug];
    const base = defaultProductContent(product);
    if (!p) {
      products[product.slug] = base;
      continue;
    }
    products[product.slug] = {
      type: str(p.type, 100) || base.type,
      name: str(p.name, 100) || base.name,
      tagline: str(p.tagline, 200),
      description: str(p.description),
      price: num(p.price, base.price),
      compareAt: num(p.compareAt, base.compareAt),
      images: Array.isArray(p.images) ? p.images.slice(0, 12).map(image).filter(Boolean) : base.images,
      features: Array.isArray(p.features) ? p.features.slice(0, 4).map((f) => str(f, 60)) : base.features,
      // Sans offres enregistrées : 1, 2 et 3 pièces calculées depuis le prix choisi dans le dashboard
      offers: cleanOffers(p.offers, defaultOffers(num(p.price, base.price))),
      sizes: Array.isArray(p.sizes)
        ? [...new Set(p.sizes.map((s) => str(s, 20).trim()).filter(Boolean))].slice(0, 30)
        : base.sizes,
      sizeTitle: typeof p.sizeTitle === "string" ? str(p.sizeTitle, 100) : base.sizeTitle,
      fields: cleanFields(p.fields),
      sticky: cleanSticky(p.sticky),
      sections: Array.isArray(p.sections) ? p.sections.slice(0, 20).map(cleanSection) : base.sections,
      design: p.design === "rose" ? "rose" : "classic",
      sku: str(p.sku, 40).replace(/[^\w.-]/g, ""),
      // Une virgule couperait le produit en deux lignes dans Orderly
      orderlyName: str(p.orderlyName, 120).replace(/[\s,]+/g, " ").trim(),
    };
  }
  const logo = cleanLogo(input.logo ?? {});
  return { logo, theme, products };
}
