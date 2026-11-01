"use client";

import { useRef, useState } from "react";
import { Media } from "@/components/Media";
import {
  DEFAULT_FIELDS,
  defaultOffers,
  FIELD_ICONS,
  FIELD_KINDS,
  type FormField,
  JEWEL_IMAGES,
  MAX_FIELDS,
  MAX_OFFERS,
  newField,
  PHONE_FIELD_ID,
  newOffer,
  type Offer,
  newSection,
  PRODUCT_DESIGNS,
  SECTION_LAYOUTS,
  type ProductContent,
  type Section,
  type SectionLayout,
  type StickyBar,
} from "@/lib/content-types";
import { Icon } from "@/components/product/Icon";
import { RING_SIZES, type Product } from "@/lib/products";
import { Button, Field, IconButton, ImagePicker, Input, JEWEL_LABELS, move, TextArea, uploadImage, type Art } from "./ui";

type Tab = "infos" | "offers" | "form" | "gallery" | "sections";

export function ProductEditor({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: ProductContent;
  onChange: (next: ProductContent) => void;
}) {
  const [tab, setTab] = useState<Tab>("infos");
  const art: Art = { category: product.category, metal: product.metal, stone: product.stone };
  const set = <K extends keyof ProductContent>(key: K, v: ProductContent[K]) => onChange({ ...value, [key]: v });

  const tabs: { id: Tab; label: string }[] = [
    { id: "infos", label: "Textes & prix" },
    { id: "offers", label: `Offres & tailles` },
    { id: "form", label: `Formulaire (${value.fields.length})` },
    { id: "gallery", label: `Photos (${value.images.length})` },
    { id: "sections", label: `Sections (${value.sections.length})` },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-ink/10 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
              tab === t.id ? "bg-ink text-ivory" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "infos" && <InfosTab value={value} set={set} />}
      {tab === "offers" && <OffersTab value={value} set={set} art={art} />}
      {tab === "form" && (
        <div className="space-y-5">
          <FieldsTab fields={value.fields} onChange={(fields) => set("fields", fields)} />
          <StickyCard sticky={value.sticky} onChange={(sticky) => set("sticky", sticky)} />
        </div>
      )}
      {tab === "gallery" && <GalleryTab images={value.images} onChange={(images) => set("images", images)} art={art} />}
      {tab === "sections" && (
        <SectionsTab sections={value.sections} onChange={(sections) => set("sections", sections)} art={art} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Textes & prix

function InfosTab({
  value,
  set,
}: {
  value: ProductContent;
  set: <K extends keyof ProductContent>(key: K, v: ProductContent[K]) => void;
}) {
  const design = PRODUCT_DESIGNS.find((d) => d.value === value.design) ?? PRODUCT_DESIGNS[0];
  return (
    <div className="space-y-5">
      <Card title="Design de la page">
        <Segmented value={value.design} options={PRODUCT_DESIGNS} onChange={(d) => set("design", d)} />
        <p className="text-[12px] text-muted">{design.hint}</p>
      </Card>

      <Card title="Produit dans Orderly">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Nom du produit dans Orderly"
            hint="Écrit exactement comme dans Orderly → Produits : c'est ce nom qui relie la commande au produit et à son stock."
          >
            <Input
              value={value.orderlyName}
              placeholder={`Vide = ${[value.type, value.name].filter(Boolean).join(" ")}`}
              onChange={(v) => set("orderlyName", v.replace(/,/g, " "))}
            />
          </Field>
          <Field label="Code article (SKU)" hint="Envoyé dans la note de la commande. Vide = identifiant de la page.">
            <Input value={value.sku} placeholder="Ex. : LOR-ARJ" onChange={(v) => set("sku", v.replace(/[^\w.-]/g, ""))} />
          </Field>
        </div>
        <p className="text-[12px] text-muted">La quantité commandée (1, 2 ou 3 selon l&apos;offre) est envoyée avec chaque commande.</p>
      </Card>

      <Card title="Titre">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type de bijou" hint="Ex. : خاتم، قلادة">
            <Input rtl value={value.type} onChange={(v) => set("type", v)} />
          </Field>
          <Field label="Nom (en couleur)">
            <Input value={value.name} onChange={(v) => set("name", v)} />
          </Field>
        </div>
        <Field label="Accroche (au-dessus du titre)">
          <Input rtl value={value.tagline} onChange={(v) => set("tagline", v)} />
        </Field>
        <Field label="Description">
          <TextArea rtl value={value.description} onChange={(v) => set("description", v)} />
        </Field>
      </Card>

      <Card title="Prix (en dirhams)">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix de vente">
            <Input type="number" min={0} value={value.price} onChange={(v) => set("price", Number(v))} />
          </Field>
          <Field label="Prix barré" hint="Laisser égal au prix pour ne pas afficher de promo">
            <Input type="number" min={0} value={value.compareAt} onChange={(v) => set("compareAt", Number(v))} />
          </Field>
        </div>
        <p className="text-[12px] text-muted">
          Les offres 2 et 3 pièces (−10 % et −20 %) sont calculées automatiquement à partir du prix de vente.
        </p>
      </Card>

      <Card title="Avantages sous la photo" hint="4 maximum. Laissez vide pour masquer.">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Input
              key={i}
              rtl
              placeholder={`Avantage ${i + 1}`}
              value={value.features[i] ?? ""}
              onChange={(v) => {
                const next = [...value.features];
                while (next.length <= i) next.push("");
                next[i] = v;
                set("features", next);
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- Offres & tailles

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Bagues 48 → 58", sizes: RING_SIZES.map(String) },
  { label: "Bagues 50 → 60", sizes: ["50", "52", "54", "56", "58", "60"] },
  { label: "S · M · L", sizes: ["S", "M", "L"] },
];

function OffersTab({
  value,
  set,
  art,
}: {
  value: ProductContent;
  set: <K extends keyof ProductContent>(key: K, v: ProductContent[K]) => void;
  art: Art;
}) {
  const { offers, sizes } = value;
  const [newSize, setNewSize] = useState("");
  const updateOffer = (i: number, patch: Partial<Offer>) =>
    set(
      "offers",
      offers.map((o, j) => (j === i ? { ...o, ...patch } : o)),
    );

  function addSize() {
    const parts = newSize
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s && !sizes.includes(s));
    if (parts.length) set("sizes", [...sizes, ...parts]);
    setNewSize("");
  }

  return (
    <div className="space-y-5">
      <Card
        title={`Offres (${offers.length})`}
        hint="Les choix proposés dans le formulaire de commande. Le client paie le « prix total » à la livraison."
      >
        <div className="space-y-3">
          {offers.map((o, i) => {
            const unit = Math.round(o.price / o.qty);
            const discount = value.price > 0 ? Math.round((1 - unit / value.price) * 100) : 0;
            return (
              <div key={o.id} className="rounded-lg border border-ink/10 bg-bone/30 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] text-ivory">
                    {i + 1}
                  </span>
                  <span className="text-[13px] text-muted">
                    {o.qty} pièce{o.qty > 1 ? "s" : ""} · {unit} DH/pièce
                    {discount > 0 && ` · −${discount} % par rapport au prix de vente`}
                  </span>
                  <span className="ml-auto flex">
                    <IconButton label="Monter" disabled={i === 0} onClick={() => set("offers", move(offers, i, i - 1))}>
                      ↑
                    </IconButton>
                    <IconButton
                      label="Descendre"
                      disabled={i === offers.length - 1}
                      onClick={() => set("offers", move(offers, i, i + 1))}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      label="Supprimer l'offre"
                      disabled={offers.length === 1}
                      onClick={() => {
                        if (confirm(`Supprimer l'offre « ${o.label} » ?`)) set("offers", offers.filter((_, j) => j !== i));
                      }}
                    >
                      <span className="text-[#a8322a]">🗑</span>
                    </IconButton>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Titre" className="col-span-2">
                    <Input rtl value={o.label} onChange={(label) => updateOffer(i, { label })} />
                  </Field>
                  <Field label="Pièces">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={o.qty}
                      onChange={(v) => updateOffer(i, { qty: Math.max(1, Math.min(20, Number(v) || 1)) })}
                    />
                  </Field>
                  <Field label="Prix total (DH)">
                    <Input type="number" min={0} value={o.price} onChange={(v) => updateOffer(i, { price: Number(v) || 0 })} />
                  </Field>
                  <Field label="Petite ligne" hint="Vide = prix par pièce" className="col-span-2">
                    <Input rtl value={o.note} onChange={(note) => updateOffer(i, { note })} />
                  </Field>
                  <Field label="Étiquette" hint="Vide = aucune">
                    <Input rtl placeholder="الأكثر طلباً" value={o.tag} onChange={(tag) => updateOffer(i, { tag })} />
                  </Field>
                  <Field group label="Couleur">
                    <div className="flex gap-1">
                      {(["dark", "gold"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateOffer(i, { tagStyle: style })}
                          className={`flex-1 rounded-lg border py-2.5 text-[12px] ${
                            o.tagStyle === style ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white"
                          }`}
                        >
                          {style === "dark" ? "Foncée" : "Dorée"}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field
                    group
                    label="Image de l'offre"
                    hint="Sans image : la 1re photo de la galerie, répétée selon le nombre de pièces."
                    className="col-span-2 sm:col-span-4"
                  >
                    <ImagePicker value={o.image} onChange={(image) => updateOffer(i, { image })} art={art} />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={offers.length >= MAX_OFFERS}
            onClick={() => {
              const nextQty = Math.max(...offers.map((o) => o.qty)) + 1;
              set("offers", [...offers, newOffer(nextQty, value.price)]);
            }}
          >
            + Ajouter une offre
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Remplacer les offres par 1, 2 et 3 pièces calculées depuis le prix de vente (${value.price} DH) ?`)) {
                set("offers", defaultOffers(value.price));
              }
            }}
          >
            Recalculer depuis le prix de vente
          </Button>
        </div>
        {offers.length >= MAX_OFFERS && <p className="text-[12px] text-muted">{MAX_OFFERS} offres maximum.</p>}
      </Card>

      <Card title={`Tailles (${sizes.length})`} hint="Sans aucune taille, l'étape « taille » n'apparaît pas dans le formulaire.">
        <Field label="Titre de l'étape">
          <Input rtl value={value.sizeTitle} onChange={(v) => set("sizeTitle", v)} />
        </Field>

        <div className="flex flex-wrap gap-2">
          {sizes.length === 0 && <p className="text-sm text-muted">Aucune taille : le client ne choisit pas de taille.</p>}
          {sizes.map((s, i) => (
            <span key={s} className="flex items-center gap-1 rounded-lg border border-ink/15 bg-white py-1 pl-3 pr-1 text-[14px]">
              {s}
              <IconButton label={`Monter ${s}`} disabled={i === 0} onClick={() => set("sizes", move(sizes, i, i - 1))}>
                ←
              </IconButton>
              <IconButton label={`Supprimer ${s}`} onClick={() => set("sizes", sizes.filter((x) => x !== s))}>
                ✕
              </IconButton>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Nouvelle taille (ex. 60, ou plusieurs : 60, 62)"
              value={newSize}
              onChange={setNewSize}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize();
                }
              }}
            />
          </div>
          <Button onClick={addSize} disabled={!newSize.trim()}>
            + Ajouter
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
          <span className="text-[12px] text-muted">Modèles :</span>
          {SIZE_PRESETS.map((p) => (
            <Button key={p.label} onClick={() => set("sizes", p.sizes)}>
              {p.label}
            </Button>
          ))}
          {sizes.length > 0 && (
            <Button
              variant="danger"
              onClick={() => confirm("Supprimer toutes les tailles ?") && set("sizes", [])}
            >
              Tout supprimer
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- Formulaire

function FieldsTab({ fields, onChange }: { fields: FormField[]; onChange: (fields: FormField[]) => void }) {
  const update = (i: number, patch: Partial<FormField>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-5">
      <Card
        title={`Champs du formulaire (${fields.length})`}
        hint="Ce que le client remplit pour commander. Le téléphone est obligatoire : il sert à confirmer la commande."
      >
        <div className="space-y-3">
          {fields.map((f, i) => {
            const isPhone = f.id === PHONE_FIELD_ID;
            return (
              <div key={f.id} className="rounded-lg border border-ink/10 bg-bone/30 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] text-ivory">
                    {i + 1}
                  </span>
                  <span className="truncate text-[13px] text-muted" dir="auto">
                    {f.label}
                  </span>
                  {isPhone && <span className="shrink-0 text-[12px] text-muted">· obligatoire</span>}
                  <span className="ml-auto flex">
                    <IconButton label="Monter" disabled={i === 0} onClick={() => onChange(move(fields, i, i - 1))}>
                      ↑
                    </IconButton>
                    <IconButton
                      label="Descendre"
                      disabled={i === fields.length - 1}
                      onClick={() => onChange(move(fields, i, i + 1))}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      label={isPhone ? "Le téléphone ne peut pas être supprimé" : "Supprimer le champ"}
                      disabled={isPhone}
                      onClick={() => {
                        if (confirm(`Supprimer le champ « ${f.label} » ?`)) onChange(fields.filter((_, j) => j !== i));
                      }}
                    >
                      <span className="text-[#a8322a]">🗑</span>
                    </IconButton>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Texte du champ" className="col-span-2">
                    <Input rtl value={f.label} onChange={(label) => update(i, { label })} />
                  </Field>
                  <Field group label="Type" className="col-span-2">
                    {isPhone ? (
                      <p className="py-2 text-[13px] text-muted">Téléphone (numéro marocain vérifié)</p>
                    ) : (
                      <Segmented value={f.kind} options={FIELD_KINDS} onChange={(kind) => update(i, { kind })} />
                    )}
                  </Field>
                  <Field group label="Icône" className="col-span-2 sm:col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {FIELD_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          aria-label={`Icône ${icon}`}
                          onClick={() => update(i, { icon })}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.7] ${
                            f.icon === icon ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white text-ink"
                          }`}
                        >
                          <Icon name={icon} />
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field group label="Obligatoire" className="col-span-2 sm:col-span-1">
                    <label className="flex h-9 cursor-pointer items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={f.required}
                        disabled={isPhone}
                        onChange={(e) => update(i, { required: e.target.checked })}
                      />
                      {f.required ? "Oui" : "Non"}
                    </label>
                  </Field>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={fields.length >= MAX_FIELDS} onClick={() => onChange([...fields, newField()])}>
            + Ajouter un champ
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Revenir aux 4 champs de départ (nom, téléphone, ville, adresse) ?")) {
                onChange(DEFAULT_FIELDS.map((f) => ({ ...f })));
              }
            }}
          >
            Rétablir les champs de départ
          </Button>
        </div>
        {fields.length >= MAX_FIELDS && <p className="text-[12px] text-muted">{MAX_FIELDS} champs maximum.</p>}
        <p className="text-[12px] text-muted">
          Les réponses aux champs ajoutés apparaissent dans le détail de chaque commande et dans l&apos;export CSV.
        </p>
      </Card>
    </div>
  );
}

function StickyCard({ sticky, onChange }: { sticky: StickyBar; onChange: (sticky: StickyBar) => void }) {
  const set = (patch: Partial<StickyBar>) => onChange({ ...sticky, ...patch });
  return (
    <Card
      title="Barre « commander » en bas de l'écran"
      hint="Apparaît quand le formulaire n'est plus visible à l'écran ; le bouton ramène au formulaire."
    >
      <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium">
        <input type="checkbox" checked={sticky.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Afficher la barre
      </label>
      {sticky.enabled && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Texte du bouton">
            <Input rtl value={sticky.button} maxLength={40} onChange={(button) => set({ button })} />
          </Field>
          <Field group label="Afficher sur">
            <Segmented
              value={sticky.where}
              options={[
                { value: "mobile", label: "Mobile seulement" },
                { value: "all", label: "Mobile + ordinateur" },
              ]}
              onChange={(where) => set({ where })}
            />
          </Field>
          <Field group label="Contenu de la barre" className="col-span-2">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={sticky.showImage} onChange={(e) => set({ showImage: e.target.checked })} />
                Photo du produit
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={sticky.showText} onChange={(e) => set({ showText: e.target.checked })} />
                Nom et prix
              </label>
            </div>
          </Field>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- Photos

function GalleryTab({ images, onChange, art }: { images: string[]; onChange: (images: string[]) => void; art: Art }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      onChange([...images, ...urls]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <Card
        title="Galerie"
        hint="La première image est la photo principale (utilisée aussi dans la boutique et les offres). 5 miniatures sont affichées."
      >
        {images.length === 0 && <p className="text-sm text-muted">Aucune image : l&apos;illustration sera affichée.</p>}
        <div className="grid grid-cols-3 gap-3">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative overflow-hidden rounded-lg border border-ink/10 bg-bone">
              <div className="relative aspect-[4/5]">
                <Media src={src} art={art} className="absolute inset-0 h-full w-full" />
              </div>
              {i === 0 && (
                <span className="absolute right-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] text-ivory">
                  Principale
                </span>
              )}
              <div className="flex items-center justify-between border-t border-ink/10 bg-white px-1">
                <IconButton label="Déplacer avant" disabled={i === 0} onClick={() => onChange(move(images, i, i - 1))}>
                  ←
                </IconButton>
                <IconButton label="Supprimer" onClick={() => onChange(images.filter((_, j) => j !== i))}>
                  ✕
                </IconButton>
                <IconButton
                  label="Déplacer après"
                  disabled={i === images.length - 1}
                  onClick={() => onChange(move(images, i, i + 1))}
                >
                  →
                </IconButton>
              </div>
              {src.startsWith("jewel") && (
                <p className="truncate bg-white px-2 pb-1.5 text-[10px] text-muted">{JEWEL_LABELS[src]}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <Button variant="primary" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Envoi en cours…" : "↑ Ajouter des photos"}
          </Button>
          <select
            value=""
            onChange={(e) => e.target.value && onChange([...images, e.target.value])}
            className="rounded-lg border border-ink/15 bg-white px-2 py-2 text-[13px]"
          >
            <option value="">+ Ajouter une illustration</option>
            {JEWEL_IMAGES.map((j) => (
              <option key={j} value={j}>
                {JEWEL_LABELS[j]}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-[13px] text-[#a8322a]">{error}</p>}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- Sections

const ITEM_LABELS: Record<SectionLayout, { items: string; add: string; title: string; text?: string }> = {
  text: { items: "Éléments", add: "Ajouter un élément", title: "Titre" },
  list: { items: "Points", add: "Ajouter un point", title: "Texte" },
  cards: { items: "Cartes", add: "Ajouter une carte", title: "Titre", text: "Description" },
  steps: { items: "Étapes", add: "Ajouter une étape", title: "Titre", text: "Description" },
  faq: { items: "Questions", add: "Ajouter une question", title: "Question", text: "Réponse" },
};

function SectionsTab({ sections, onChange, art }: { sections: Section[]; onChange: (s: Section[]) => void; art: Art }) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  // Glisser-déposer : section tenue par la poignée ⠿ (souris ou doigt)
  const [dragId, setDragId] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);

  const update = (i: number, s: Section) => onChange(sections.map((x, j) => (j === i ? s : x)));

  function startDrag(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // Sections repliées pendant le déplacement : la liste reste courte et lisible
    setOpenId(null);
    setDragId(id);
  }

  function drag(e: React.PointerEvent) {
    if (!dragId || !list.current) return;
    const from = sections.findIndex((s) => s.id === dragId);
    const cards = list.current.querySelectorAll<HTMLElement>("[data-section-card]");
    // La section prend la place de celle dont le pointeur a dépassé le milieu
    let to = from;
    cards.forEach((card, j) => {
      const { top, height } = card.getBoundingClientRect();
      const middle = top + height / 2;
      if (j < from && e.clientY < middle) to = Math.min(to, j);
      if (j > from && e.clientY > middle) to = Math.max(to, j);
    });
    if (to !== from) onChange(move(sections, from, to));
    // Défilement automatique près des bords de l'écran
    if (e.clientY < 70) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
  }

  function add(layout: SectionLayout) {
    const s = newSection(layout);
    onChange([...sections, s]);
    setOpenId(s.id);
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">
        Ces sections s&apos;affichent sous le formulaire de commande, dans cet ordre. Glissez la poignée ⠿ pour
        changer l&apos;ordre.
      </p>

      <div ref={list} className="space-y-3">
        {sections.map((s, i) => {
          const open = openId === s.id;
          const dragging = dragId === s.id;
          return (
            <div
              key={s.id}
              data-section-card
              className={`rounded-xl border bg-white transition-shadow ${
                dragging
                  ? "relative z-10 border-gold shadow-lg ring-2 ring-gold/30"
                  : open
                    ? "border-ink/30 shadow-sm"
                    : "border-ink/10"
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  aria-label="Glisser pour déplacer la section"
                  title="Glisser pour déplacer"
                  onPointerDown={(e) => startDrag(e, s.id)}
                  onPointerMove={drag}
                  onPointerUp={() => setDragId(null)}
                  onPointerCancel={() => setDragId(null)}
                  className={`flex h-8 w-6 shrink-0 touch-none select-none items-center justify-center rounded text-[18px] leading-none text-muted hover:bg-ink/5 hover:text-ink ${
                    dragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  ⠿
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 py-1 text-start"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bone text-[12px] font-medium">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.12em] text-muted">
                      {SECTION_LAYOUTS.find((l) => l.value === s.layout)?.label}
                      {s.background === "cream" && " · fond crème"}
                    </span>
                    <span dir="rtl" className="block truncate font-[family-name:var(--font-cairo)] text-[15px]">
                      {s.title} {s.highlight}
                    </span>
                  </span>
                </button>
                <IconButton label="Monter" disabled={i === 0} onClick={() => onChange(move(sections, i, i - 1))}>
                  ↑
                </IconButton>
                <IconButton
                  label="Descendre"
                  disabled={i === sections.length - 1}
                  onClick={() => onChange(move(sections, i, i + 1))}
                >
                  ↓
                </IconButton>
                <IconButton
                  label="Dupliquer"
                  onClick={() => {
                    const copy = { ...s, id: Math.random().toString(36).slice(2, 10), items: s.items.map((x) => ({ ...x })) };
                    const next = [...sections];
                    next.splice(i + 1, 0, copy);
                    onChange(next);
                    setOpenId(copy.id);
                  }}
                >
                  ⧉
                </IconButton>
                <IconButton
                  label="Supprimer la section"
                  onClick={() => {
                    if (confirm(`Supprimer la section « ${s.title} ${s.highlight} » ?`)) {
                      onChange(sections.filter((_, j) => j !== i));
                    }
                  }}
                >
                  <span className="text-[#a8322a]">🗑</span>
                </IconButton>
              </div>
              {open && <SectionForm section={s} onChange={(next) => update(i, next)} art={art} />}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="rounded-xl border border-dashed border-ink/30 bg-white p-4">
          <p className="mb-3 text-[13px] font-medium">Quel type de section ?</p>
          <div className="grid grid-cols-2 gap-2">
            {SECTION_LAYOUTS.map((l) => (
              <Button key={l.value} onClick={() => add(l.value)}>
                {l.label}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border border-dashed border-ink/30 py-4 text-[14px] font-medium text-muted transition hover:border-ink hover:text-ink"
        >
          + Ajouter une section
        </button>
      )}
    </div>
  );
}

function SectionForm({ section: s, onChange, art }: { section: Section; onChange: (s: Section) => void; art: Art }) {
  const set = <K extends keyof Section>(key: K, v: Section[K]) => onChange({ ...s, [key]: v });
  const labels = ITEM_LABELS[s.layout];
  const setItem = (i: number, key: "title" | "text", v: string) =>
    set(
      "items",
      s.items.map((x, j) => (j === i ? { ...x, [key]: v } : x)),
    );

  return (
    <div className="space-y-4 border-t border-ink/10 p-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type de section">
          <select
            value={s.layout}
            onChange={(e) => set("layout", e.target.value as SectionLayout)}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-[14px]"
          >
            {SECTION_LAYOUTS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field group label="Fond">
          <div className="flex gap-2">
            {(["white", "cream"] as const).map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => set("background", bg)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] transition ${
                  s.background === bg ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white"
                }`}
              >
                {bg === "white" ? "Blanc" : "Crème"}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Petit titre (étiquette)">
        <Input rtl value={s.eyebrow} onChange={(v) => set("eyebrow", v)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Titre">
          <Input rtl value={s.title} onChange={(v) => set("title", v)} />
        </Field>
        <Field label="Suite du titre (en couleur)">
          <Input rtl value={s.highlight} onChange={(v) => set("highlight", v)} />
        </Field>
      </div>
      <Field label="Texte" hint="Laissez une ligne vide pour créer un nouveau paragraphe.">
        <TextArea rtl rows={3} value={s.text} onChange={(v) => set("text", v)} />
      </Field>

      {s.layout !== "text" && (
        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
            {labels.items} ({s.items.length})
          </p>
          <div className="space-y-2">
            {s.items.map((item, i) => (
              <div key={i} className="flex gap-2 rounded-lg bg-bone/50 p-2">
                <div className="flex-1 space-y-2">
                  <Input
                    rtl
                    placeholder={labels.title}
                    value={item.title}
                    onChange={(v) => setItem(i, "title", v)}
                  />
                  {labels.text &&
                    (s.layout === "faq" ? (
                      <TextArea rtl rows={2} value={item.text} onChange={(v) => setItem(i, "text", v)} />
                    ) : (
                      <Input
                        rtl
                        placeholder={labels.text}
                        value={item.text}
                        onChange={(v) => setItem(i, "text", v)}
                      />
                    ))}
                </div>
                <div className="flex flex-col">
                  <IconButton label="Monter" disabled={i === 0} onClick={() => set("items", move(s.items, i, i - 1))}>
                    ↑
                  </IconButton>
                  <IconButton
                    label="Descendre"
                    disabled={i === s.items.length - 1}
                    onClick={() => set("items", move(s.items, i, i + 1))}
                  >
                    ↓
                  </IconButton>
                  <IconButton label="Supprimer" onClick={() => set("items", s.items.filter((_, j) => j !== i))}>
                    ✕
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-2" onClick={() => set("items", [...s.items, { title: "", text: "" }])}>
            + {labels.add}
          </Button>
        </div>
      )}

      <Field label="Image">
        <ImagePicker value={s.image} onChange={(v) => set("image", v)} art={art} />
      </Field>
      <ButtonSettings section={s} set={set} />
      <SizeSettings section={s} set={set} />
    </div>
  );
}

type SetSection = <K extends keyof Section>(key: K, v: Section[K]) => void;

/** Boutons à choix unique (S / M / L…) */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-ink/15 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-[12px] transition ${
            value === o.value ? "bg-ink text-ivory" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SML = [
  { value: "s", label: "Petit" },
  { value: "m", label: "Normal" },
  { value: "l", label: "Grand" },
] as const;

function ButtonSettings({ section: s, set }: { section: Section; set: SetSection }) {
  const enabled = s.button !== "";
  return (
    <div className="space-y-3 rounded-lg border border-ink/10 bg-bone/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Bouton</p>
        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => set("button", e.target.checked ? "اطلب الآن" : "")}
          />
          Afficher un bouton
        </label>
      </div>
      {enabled && (
        <>
          <Field label="Texte du bouton">
            <Input rtl value={s.button} onChange={(v) => set("button", v || " ")} /* garde le bouton actif pendant la saisie */ />
          </Field>
          <Field group label="Quand on clique">
            <Segmented
              value={s.buttonAction}
              onChange={(v) => {
                set("buttonAction", v);
              }}
              options={[
                { value: "order", label: "Aller au formulaire" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "link", label: "Ouvrir un lien" },
              ]}
            />
          </Field>
          {s.buttonAction === "whatsapp" && (
            <Field label="Numéro WhatsApp" hint="Ex. : 0612345678 ou +212612345678">
              <Input type="tel" value={s.buttonLink} onChange={(v) => set("buttonLink", v)} />
            </Field>
          )}
          {s.buttonAction === "link" && (
            <Field label="Adresse du lien" hint="Doit commencer par https://">
              <Input value={s.buttonLink} placeholder="https://" onChange={(v) => set("buttonLink", v)} />
            </Field>
          )}
          {s.buttonAction !== "order" && !s.buttonLink.trim() && (
            <p className="text-[12px] text-[#8a6418]">Sans numéro ou lien, le bouton mène au formulaire de commande.</p>
          )}
          <Field group label="Taille du bouton">
            <Segmented value={s.buttonSize} onChange={(v) => set("buttonSize", v)} options={[...SML]} />
          </Field>
        </>
      )}
    </div>
  );
}

function SizeSettings({ section: s, set }: { section: Section; set: SetSection }) {
  return (
    <div className="space-y-3 rounded-lg border border-ink/10 bg-bone/30 p-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Tailles</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field group label="Titre">
          <Segmented
            value={s.titleSize}
            onChange={(v) => set("titleSize", v)}
            options={[...SML, { value: "xl", label: "Très grand" }]}
          />
        </Field>
        <Field group label="Texte">
          <Segmented value={s.textSize} onChange={(v) => set("textSize", v)} options={[...SML]} />
        </Field>
        <Field group label="Image">
          <Segmented
            value={s.imageSize}
            onChange={(v) => set("imageSize", v)}
            options={[...SML, { value: "full", label: "Pleine" }]}
          />
        </Field>
        <Field group label="Espacement">
          <Segmented value={s.spacing} onChange={(v) => set("spacing", v)} options={[...SML]} />
        </Field>
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-ink/10 bg-white p-5">
      <div>
        <h3 className="font-display text-xl">{title}</h3>
        {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
