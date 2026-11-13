"use client";

import { Tajawal } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Media } from "@/components/Media";
import { PHONE_FIELD_ID, type FormField, type ProductContent, type Section } from "@/lib/content-types";
import { fieldMaxLength, validateOrder, type OrderErrors, type OrderInput } from "@/lib/order";
import { normalizePhone } from "@/lib/phone";
import { rememberOrder } from "@/lib/pixel-events";
import type { Product } from "@/lib/products";
import "./rose.css";

// Design « Princesse » (violet) : textes, offres, photos et sections viennent du dashboard.
// Seuls ces textes fixes appartiennent au design.
const TOP_BAR = "🚚 توصيل مجاني لجميع مدن المغرب • الدفع عند الاستلام 🇲🇦";
const PHOTO_TAG = "💜 جديد 2026";
const RATING = { stars: "★★★★★", text: "4.9 (164 تقييم)" };
const BOX_TITLE = "📦 اطلبي الآن وادفعي عند الاستلام";
const SUBMIT = "اطلب الآن 💜";
const COD_NOTE = "الدفع كاش عند الاستلام • توصيل مجاني";
const CARD_ICONS = ["✨", "🛡️", "💧", "🎁", "💜", "⭐"];
const PHONE_ERROR = "المرجو إدخال رقم هاتف مغربي صحيح (مثال: 0612345678)";
const PLACEHOLDERS: Record<string, string> = {
  name: "أدخلي اسمك الكامل",
  phone: "06 00 00 00 00",
  city: "مدينتك",
  address: "عنوانك",
};

// Chargée seulement sur les pages qui utilisent ce design
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  preload: false,
});

const dh = (n: number) => `${n} درهم`;

type Art = React.ComponentProps<typeof Media>["art"];

export function RoseView({ product, content }: { product: Product; content: ProductContent }) {
  const art = { category: product.category, metal: product.metal, stone: product.stone };
  const images = content.images.length > 0 ? content.images : ["jewel"];
  const [view, setView] = useState(0);
  const current = Math.min(view, images.length - 1);
  const { offers, sizes } = content;
  const [offerId, setOfferId] = useState(offers[0].id);
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];
  const discount = content.compareAt > content.price ? Math.round((1 - content.price / content.compareAt) * 100) : 0;
  const stickyLabel = offer.qty > 1 ? `${offer.qty} قطع بـ ${dh(offer.price)}` : dh(offer.price);

  const goToOrder = (e?: React.MouseEvent) => {
    e?.preventDefault();
    document.getElementById("rfOrder")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={`rose-page ${tajawal.variable}`} dir="rtl" lang="ar">
      <div className="rf-top">{TOP_BAR}</div>

      {/* ============ الواجهة + الفورم ============ */}
      <section className="rf-hero">
        <div className="rf-wrap rf-hero-grid">
          <div className="rf-gallery">
            <div className="rf-main">
              <span className="rf-tag">{PHOTO_TAG}</span>
              <Media src={images[current]} art={art} alt={`${content.type} ${content.name}`} priority />
            </div>
            {images.length > 1 && (
              <div className="rf-thumbs">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className={`rf-thumb ${current === i ? "active" : ""}`}
                    onClick={() => setView(i)}
                    aria-label={`صورة ${i + 1}`}
                  >
                    <Media src={src} art={art} thumb />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rf-info">
            {content.tagline && <span className="rf-badge">{content.tagline}</span>}
            <h1>
              {content.type} <span>{content.name}</span>
            </h1>
            <div className="rf-stars-row">
              <span className="rf-stars">{RATING.stars}</span>
              <span>{RATING.text}</span>
            </div>
            {content.description && <p className="rf-lead">{content.description}</p>}

            <div className="rf-price-row">
              <span className="rf-price">{dh(offer.price)}</span>
              {discount > 0 && (
                <>
                  <span className="rf-old">{dh(content.compareAt)}</span>
                  <span className="rf-off">وفري {discount}%</span>
                </>
              )}
            </div>

            {content.features.some(Boolean) && (
              <ul className="rf-mini">
                {content.features.filter(Boolean).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            <div className="rf-offers" role="radiogroup">
              {offers.map((o) => {
                const was = o.qty * content.price;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={o.id === offer.id}
                    className={`rf-offer ${o.tag ? "rf-offer--best" : ""} ${o.id === offer.id ? "active" : ""}`}
                    onClick={() => setOfferId(o.id)}
                  >
                    {o.tag && <span className="rf-offer-flag">{o.tag}</span>}
                    <span className="rf-dot" />
                    <span className="rf-offer-txt">
                      {o.label}
                      {o.note && <span className="rf-offer-sub">{o.note}</span>}
                    </span>
                    <span className="rf-offer-pricebox">
                      <span className="rf-offer-price">{dh(o.price)}</span>
                      {o.qty > 1 && was > o.price && <span className="rf-offer-was">{dh(was)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <RoseOrderForm product={product} content={content} offerId={offer.id} sizes={sizes} />
          </div>
        </div>
      </section>

      {groupSections(content.sections).map((block) =>
        Array.isArray(block) ? (
          <StoryBand key={block[0].id} stories={block} art={art} onCta={goToOrder} />
        ) : (
          <RoseSection key={block.id} section={block} art={art} onCta={goToOrder} />
        ),
      )}

      {content.sticky.enabled && (
        <div className="rf-sticky">
          <a href="#rfOrder" onClick={goToOrder}>
            {content.sticky.button} • {stickyLabel} 💜
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Formulaire */

function RoseOrderForm({
  product,
  content,
  offerId,
  sizes,
}: {
  product: Product;
  content: ProductContent;
  offerId: string;
  sizes: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [size, setSize] = useState<string | undefined>();
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<OrderErrors>({});
  const [sending, setSending] = useState(false);

  function update(field: FormField, value: string) {
    const v = field.kind === "phone" ? value.replace(/[^\d٠-٩۰-۹+\s]/g, "") : value;
    setValues((old) => ({ ...old, [field.id]: v }));
    if (errors[field.id] && (field.kind !== "phone" || normalizePhone(v))) {
      setErrors((e) => ({ ...e, [field.id]: undefined }));
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    // Téléphone normalisé (chiffres arabes, espaces…) avant la validation commune
    const phone = values[PHONE_FIELD_ID] ? normalizePhone(values[PHONE_FIELD_ID]) : "";
    const order: OrderInput = {
      slug: product.slug,
      metal: product.metal,
      size,
      offer: offerId,
      values: { ...values, [PHONE_FIELD_ID]: phone ?? values[PHONE_FIELD_ID] ?? "" },
    };
    const found = validateOrder(order, content);
    if (values[PHONE_FIELD_ID] && phone === null) found[PHONE_FIELD_ID] = PHONE_ERROR;
    else if (found[PHONE_FIELD_ID]) found[PHONE_FIELD_ID] = PHONE_ERROR;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...order, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { form: "وقع خطأ، المرجو المحاولة مرة أخرى." });
        setSending(false);
        return;
      }
      const offer = content.offers.find((o) => o.id === offerId) ?? content.offers[0];
      rememberOrder(data.ref, {
        id: content.sku || product.slug,
        name: `${content.type} ${content.name}`,
        value: offer.price,
        quantity: offer.qty,
      });
      router.push(`/merci/?ref=${encodeURIComponent(data.ref)}`);
    } catch {
      setErrors({ form: "وقع خطأ في الاتصال، المرجو المحاولة مرة أخرى." });
      setSending(false);
    }
  }

  return (
    <div className="rf-box" id="rfOrder">
      <div className="rf-box-title">{BOX_TITLE}</div>
      <form className="rf-form" onSubmit={submit} noValidate>
        {sizes.length > 0 && (
          <div className="rf-field">
            <label>{content.sizeTitle}</label>
            <div className="rf-sizes" role="radiogroup">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  name="size"
                  className={`rf-size ${size === s ? "active" : ""}`}
                  onClick={() => {
                    setSize(s);
                    setErrors((e) => ({ ...e, size: undefined }));
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.size && <span className="rf-err">{errors.size}</span>}
          </div>
        )}

        {content.fields.map((f) => {
          const id = `rf-${f.id}`;
          const props = {
            id,
            name: f.id,
            value: values[f.id] ?? "",
            placeholder: PLACEHOLDERS[f.id] ?? f.label,
            maxLength: fieldMaxLength(f),
            className: errors[f.id] ? "rf-invalid" : "",
            "aria-invalid": !!errors[f.id],
          };
          return (
            <div key={f.id} className="rf-field">
              <label htmlFor={id}>{f.label}</label>
              {f.kind === "long" ? (
                <textarea {...props} rows={3} onChange={(e) => update(f, e.target.value)} />
              ) : (
                <input
                  {...props}
                  type={f.kind === "phone" ? "tel" : "text"}
                  inputMode={f.kind === "phone" ? "tel" : f.kind === "number" ? "numeric" : undefined}
                  dir={f.kind === "phone" ? "ltr" : undefined}
                  onChange={(e) => update(f, e.target.value)}
                  onBlur={
                    f.kind === "phone"
                      ? (e) => {
                          const v = e.target.value.trim();
                          if (v) setErrors((old) => ({ ...old, [f.id]: normalizePhone(v) ? undefined : PHONE_ERROR }));
                        }
                      : undefined
                  }
                />
              )}
              {errors[f.id] && <span className="rf-err">{errors[f.id]}</span>}
            </div>
          );
        })}

        {/* Champ piège anti-robot, invisible pour les clients */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="rf-hp"
          aria-hidden
        />

        {errors.form && <span className="rf-err">{errors.form}</span>}
        <button type="submit" className="rf-btn" disabled={sending}>
          {sending ? "جاري تسجيل طلبك..." : SUBMIT}
        </button>
        <p className="rf-cod">{COD_NOTE}</p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ Sections */

const isStory = (s: Section) => s.layout === "text" && !!s.image;

/** Les sections « texte + image » qui se suivent forment un seul bandeau d'histoires */
function groupSections(sections: Section[]) {
  const blocks: (Section | Section[])[] = [];
  for (const s of sections) {
    const last = blocks[blocks.length - 1];
    if (isStory(s) && Array.isArray(last)) last.push(s);
    else blocks.push(isStory(s) ? [s] : s);
  }
  return blocks;
}

function Heading({ section: s }: { section: Section }) {
  return (
    <>
      {(s.title || s.highlight) && (
        <h2>
          {s.title} {s.highlight && <span>{s.highlight}</span>}
        </h2>
      )}
      {s.text && <p className="rf-sub">{s.text}</p>}
    </>
  );
}

/** Histoires : titre, court texte, puis grande photo */
function StoryBand({ stories, art, onCta }: { stories: Section[]; art: Art; onCta: (e?: React.MouseEvent) => void }) {
  return (
    <section className="rf-sec rf-band">
      <div className="rf-wrap">
        {stories.map((s) => (
          <div key={s.id} className="rf-story">
            {(s.title || s.highlight) && <h3>{[s.title, s.highlight].filter(Boolean).join(" ")}</h3>}
            {s.text && <p>{s.text}</p>}
            <div className="rf-pic">
              <Media src={s.image} art={art} alt={s.title} />
            </div>
            {s.button.trim() && (
              <a className="rf-story-btn" href="#rfOrder" onClick={onCta}>
                {s.button}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Autres sections du dashboard dans le design violet :
 * texte seul → encadré final, questions → FAQ, cartes / liste / étapes → cartes.
 */
function RoseSection({ section: s, art, onCta }: { section: Section; art: Art; onCta: (e?: React.MouseEvent) => void }) {
  if (s.layout === "faq") {
    return (
      <section className="rf-sec">
        <div className="rf-wrap">
          <Heading section={s} />
          <div className="rf-faq">
            {s.items.map((item, i) => (
              <div key={i} className="rf-q">
                <b>{item.title}</b>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (s.layout === "text") {
    return (
      <section className="rf-sec rf-sec--final">
        <div className="rf-wrap">
          <div className="rf-final">
            {(s.title || s.highlight) && (
              <h2>
                {s.title} {s.highlight && <span>{s.highlight}</span>}
              </h2>
            )}
            {s.text && <p>{s.text}</p>}
            {s.button.trim() && (
              <a href="#rfOrder" onClick={onCta}>
                {s.button}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rf-sec">
      <div className="rf-wrap">
        <Heading section={s} />
        <div className="rf-cards">
          {s.items.map((item, i) => (
            <div key={i} className="rf-card">
              <div className="rf-ico">{s.layout === "steps" ? i + 1 : CARD_ICONS[i % CARD_ICONS.length]}</div>
              <h4>{item.title}</h4>
              {item.text && <p>{item.text}</p>}
            </div>
          ))}
        </div>
        {s.image && (
          <div className="rf-pic rf-pic--after">
            <Media src={s.image} art={art} />
          </div>
        )}
      </div>
    </section>
  );
}
