"use client";

import { Almarai, El_Messiri } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Media } from "@/components/Media";
import { PHONE_FIELD_ID, type FormField, type ProductContent, type Section } from "@/lib/content-types";
import { fieldMaxLength, validateOrder, type OrderErrors, type OrderInput } from "@/lib/order";
import { normalizePhone } from "@/lib/phone";
import { rememberOrder } from "@/lib/pixel-events";
import type { Product } from "@/lib/products";
import "./mood.css";

// Design « Humeur » (nuit, reflets changeants) pour les bijoux qui changent de couleur.
// Textes, offres, photos et sections viennent du dashboard ; seuls ces textes fixes appartiennent au design.
const MARQUEE = ["توصيل مجاني لكل المدن", "الدفع عند الاستلام", "علبة هدية مع كل طلب", "يتغيّر لونه مع حرارتكِ"];
const RATING = "4.9 · أكثر من 300 زبونة راضية";
const FORM_TITLE = "اطلبي الآن، وادفعي عند الاستلام";
const SUBMIT = "تأكيد الطلب";
const TRUST = [
  { ico: "💵", text: "الدفع عند الاستلام" },
  { ico: "🚚", text: "توصيل مجاني" },
  { ico: "🔁", text: "استبدال سهل" },
];
const CARD_ICONS = ["✦", "❖", "♡", "✧", "☾", "◈"];
const PHONE_ERROR = "المرجو إدخال رقم هاتف مغربي صحيح (مثال: 0612345678)";
const PLACEHOLDERS: Record<string, string> = {
  name: "الاسم والنسب",
  phone: "06 00 00 00 00",
  city: "المدينة",
  address: "الحي، الشارع، رقم المنزل",
};

/** Sélecteur de température : la pastille du cœur et sa couleur pour chaque palier */
const MOODS = [
  { t: 10, color: "#d98a1c", name: "عسلي", text: "في الجو البارد يغمق القلب ويأخذ لون العسل الدافئ." },
  { t: 18, color: "#7c4dff", name: "بنفسجي", text: "مع النسمات المنعشة يتحوّل إلى بنفسجي حالم." },
  { t: 24, color: "#1fae5b", name: "أخضر", text: "في حرارة معتدلة يصبح أخضر هادئاً كالزمرد." },
  { t: 30, color: "#ff3d8b", name: "وردي", text: "حين تدفئه بشرتكِ يزهر بلون وردي مشرق." },
  { t: 34, color: "#2f6bff", name: "أزرق", text: "في الدفء الكامل يلمع بأزرق عميق كالياقوت." },
];

const display = El_Messiri({ subsets: ["arabic"], weight: ["500", "700"], variable: "--font-mood-display", preload: false });
const body = Almarai({ subsets: ["arabic"], weight: ["400", "700", "800"], variable: "--font-mood-body", preload: false });

const dh = (n: number) => `${n} درهم`;

type Art = React.ComponentProps<typeof Media>["art"];
type Go = (e?: React.MouseEvent) => void;

export function MoodView({ product, content }: { product: Product; content: ProductContent }) {
  const art = { category: product.category, metal: product.metal, stone: product.stone };
  const images = content.images.length > 0 ? content.images : ["jewel"];
  const [view, setView] = useState(0);
  const current = Math.min(view, images.length - 1);
  const { offers, sizes } = content;
  const [offerId, setOfferId] = useState(offers[0].id);
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];
  const discount = content.compareAt > content.price ? Math.round((1 - content.price / content.compareAt) * 100) : 0;
  const cheapest = Math.min(...offers.map((o) => Math.round(o.price / o.qty)));

  const goToOrder: Go = (e) => {
    e?.preventDefault();
    document.getElementById("mdOrder")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={`mood-page ${display.variable} ${body.variable}`} dir="rtl" lang="ar">
      <div className="md-marquee" aria-hidden>
        <div className="md-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {MARQUEE.map((m) => (
                <span key={m}>
                  {m} <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ Galerie + achat ============ */}
      <section className="md-hero">
        <div className="md-aurora" aria-hidden />
        <div className="md-wrap md-hero-grid">
          <div className="md-gallery">
            <div className="md-frame">
              <div className="md-main">
                <Media src={images[current]} art={art} alt={`${content.type} ${content.name}`} priority />
                {discount > 0 && <span className="md-sale">−{discount}%</span>}
              </div>
            </div>
            {images.length > 1 && (
              <div className="md-thumbs">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className={`md-thumb ${current === i ? "on" : ""}`}
                    onClick={() => setView(i)}
                    aria-label={`صورة ${i + 1}`}
                  >
                    <Media src={src} art={art} thumb />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md-buy">
            {content.tagline && <span className="md-eyebrow">{content.tagline}</span>}
            <h1>
              <small>{content.type}</small>
              <span className="md-shift">{content.name}</span>
            </h1>
            <div className="md-rating">
              <span className="md-stars">★★★★★</span> {RATING}
            </div>
            {content.description && <p className="md-lead">{content.description}</p>}

            <div className="md-price">
              <b>{dh(content.price)}</b>
              {discount > 0 && <s>{dh(content.compareAt)}</s>}
            </div>

            {content.features.some(Boolean) && (
              <ul className="md-chips">
                {content.features.filter(Boolean).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            <div className={`md-offers ${offers.length === 3 ? "md-offers--3" : ""}`} role="radiogroup">
              {offers.map((o) => {
                const was = o.qty * content.price;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={o.id === offer.id}
                    className={`md-offer ${o.id === offer.id ? "on" : ""}`}
                    onClick={() => setOfferId(o.id)}
                  >
                    {o.tag && <span className="md-offer-tag">{o.tag}</span>}
                    <span className="md-offer-qty">×{o.qty}</span>
                    <span className="md-offer-label">{o.label}</span>
                    <span className="md-offer-price">{dh(o.price)}</span>
                    {o.qty > 1 && was > o.price ? (
                      <span className="md-offer-save">وفّري {was - o.price} درهم</span>
                    ) : (
                      o.note && <span className="md-offer-save">{o.note}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <MoodOrderForm product={product} content={content} offerId={offer.id} total={offer.price} sizes={sizes} />
          </div>
        </div>
      </section>

      <MoodDial />

      {groupSections(content.sections).map((block, i) =>
        Array.isArray(block) ? (
          <Stories key={block[0].id} stories={block} art={art} onCta={goToOrder} />
        ) : (
          <MoodSection key={block.id} section={block} art={art} onCta={goToOrder} from={cheapest} index={i} />
        ),
      )}

      {content.sticky.enabled && (
        <div className={`md-sticky ${content.sticky.where === "all" ? "md-sticky--all" : ""}`}>
          {content.sticky.showImage && (
            <span className="md-sticky-pic">
              <Media src={images[0]} art={art} thumb />
            </span>
          )}
          {content.sticky.showText && (
            <span className="md-sticky-txt">
              <b>{content.name}</b>
              {dh(offer.price)}
            </span>
          )}
          <a href="#mdOrder" onClick={goToOrder}>
            {content.sticky.button}
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Sélecteur de température */

function MoodDial() {
  const [index, setIndex] = useState(MOODS.length - 1);
  const [touched, setTouched] = useState(false);
  const mood = MOODS[index];

  // Tant que la cliente n'a rien touché, le cœur change seul de couleur
  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % MOODS.length), 2600);
    return () => window.clearInterval(timer);
  }, [touched]);

  const pick = (i: number) => {
    setTouched(true);
    setIndex(i);
  };

  return (
    <section className="md-dial" style={{ "--glow": mood.color } as React.CSSProperties}>
      <div className="md-wrap md-dial-grid">
        <div className="md-dial-text">
          <span className="md-kicker">جرّبي بنفسكِ</span>
          <h2>
            حرّكي الحرارة… <span className="md-shift">وشوفي القلب يتبدّل</span>
          </h2>
          <p className="md-dial-mood" aria-live="polite">
            <b style={{ color: mood.color }}>
              {mood.t}° · {mood.name}
            </b>
            {mood.text}
          </p>
          <div className="md-scale" role="radiogroup" aria-label="درجة الحرارة">
            {MOODS.map((m, i) => (
              <button
                key={m.t}
                type="button"
                role="radio"
                aria-checked={i === index}
                className={i === index ? "on" : ""}
                style={{ "--c": m.color } as React.CSSProperties}
                onClick={() => pick(i)}
              >
                <i />
                {m.t}°
              </button>
            ))}
          </div>
          <div className="md-scale-bar" aria-hidden>
            <span style={{ insetInlineStart: `${(index / (MOODS.length - 1)) * 100}%` }} />
          </div>
          <div className="md-scale-ends" aria-hidden>
            <span>❄ بارد</span>
            <span>دافئ ☀</span>
          </div>
        </div>

        <div className="md-dial-orb">
          {MOODS.map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- petites pastilles fixes du design
            <img
              key={m.t}
              src={`/mood/h${m.t}.webp`}
              alt={i === index ? `القلب باللون ${m.name}` : ""}
              className={i === index ? "on" : ""}
              loading="lazy"
              decoding="async"
              width={360}
              height={360}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Formulaire */

function MoodOrderForm({
  product,
  content,
  offerId,
  total,
  sizes,
}: {
  product: Product;
  content: ProductContent;
  offerId: string;
  total: number;
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
    <div className="md-form-card" id="mdOrder">
      <div className="md-form-head">
        <span>{FORM_TITLE}</span>
        <b>{dh(total)}</b>
      </div>
      <form className="md-form" onSubmit={submit} noValidate>
        {sizes.length > 0 && (
          <div className="md-field">
            <label>{content.sizeTitle}</label>
            <div className="md-sizes" role="radiogroup">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  name="size"
                  className={size === s ? "on" : ""}
                  onClick={() => {
                    setSize(s);
                    setErrors((e) => ({ ...e, size: undefined }));
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.size && <span className="md-err">{errors.size}</span>}
          </div>
        )}

        {content.fields.map((f) => {
          const id = `md-${f.id}`;
          const props = {
            id,
            name: f.id,
            value: values[f.id] ?? "",
            placeholder: PLACEHOLDERS[f.id] ?? f.label,
            maxLength: fieldMaxLength(f),
            className: errors[f.id] ? "md-invalid" : "",
            "aria-invalid": !!errors[f.id],
          };
          return (
            <div key={f.id} className="md-field">
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
              {errors[f.id] && <span className="md-err">{errors[f.id]}</span>}
            </div>
          );
        })}

        {/* Champ piège anti-robot, invisible pour les clientes */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="md-hp"
          aria-hidden
        />

        {errors.form && <span className="md-err">{errors.form}</span>}
        <button type="submit" className="md-submit" disabled={sending}>
          {sending ? "جاري تسجيل طلبكِ..." : `${SUBMIT} · ${dh(total)}`}
        </button>
        <ul className="md-trust">
          {TRUST.map((t) => (
            <li key={t.text}>
              <span>{t.ico}</span>
              {t.text}
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ Sections */

const isStory = (s: Section) => s.layout === "text" && !!s.image;

/** Les sections « texte + image » qui se suivent forment une suite d'histoires en zigzag */
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
    <div className="md-head">
      {s.eyebrow && <span className="md-kicker">{s.eyebrow}</span>}
      {(s.title || s.highlight) && (
        <h2>
          {s.title} {s.highlight && <span className="md-shift">{s.highlight}</span>}
        </h2>
      )}
      {s.text && <p>{s.text}</p>}
    </div>
  );
}

function Stories({ stories, art, onCta }: { stories: Section[]; art: Art; onCta: Go }) {
  return (
    <section className="md-sec md-stories">
      <div className="md-wrap">
        {stories.map((s, i) => (
          <article key={s.id} className={`md-story ${i % 2 ? "md-story--flip" : ""}`}>
            <div className="md-story-pic">
              <Media src={s.image} art={art} alt={[s.title, s.highlight].filter(Boolean).join(" ")} />
            </div>
            <div className="md-story-txt">
              <span className="md-num">{String(i + 1).padStart(2, "0")}</span>
              {s.eyebrow && <span className="md-kicker">{s.eyebrow}</span>}
              {(s.title || s.highlight) && (
                <h3>
                  {s.title} {s.highlight && <span className="md-shift">{s.highlight}</span>}
                </h3>
              )}
              {s.text.split(/\n\s*\n/).map((p, k) => p.trim() && <p key={k}>{p}</p>)}
              {s.button.trim() && (
                <a className="md-ghost" href="#mdOrder" onClick={onCta}>
                  {s.button} ←
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Autres sections du dashboard : questions → accordéon, texte seul → bloc final,
 * cartes / liste / étapes → grille de cartes en verre.
 */
function MoodSection({
  section: s,
  art,
  onCta,
  from,
  index,
}: {
  section: Section;
  art: Art;
  onCta: Go;
  from: number;
  index: number;
}) {
  if (s.layout === "faq") {
    return (
      <section className="md-sec">
        <div className="md-wrap md-narrow">
          <Heading section={s} />
          <div className="md-faq">
            {s.items.map((item, i) => (
              <details key={i} open={i === 0}>
                <summary>{item.title}</summary>
                <p>{item.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (s.layout === "text") {
    return (
      <section className="md-sec md-final">
        <div className="md-wrap">
          <div className="md-final-box">
            {s.eyebrow && <span className="md-kicker">{s.eyebrow}</span>}
            {(s.title || s.highlight) && (
              <h2>
                {s.title} {s.highlight && <span className="md-shift">{s.highlight}</span>}
              </h2>
            )}
            {s.text ? <p>{s.text}</p> : <p>ابتداءً من {from} درهم للقطعة</p>}
            {s.button.trim() && (
              <a className="md-cta" href="#mdOrder" onClick={onCta}>
                {s.button}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`md-sec ${index % 2 ? "md-sec--tint" : ""}`}>
      <div className="md-wrap">
        <Heading section={s} />
        <div className={`md-cards ${s.layout === "steps" ? "md-cards--steps" : s.items.length === 4 ? "md-cards--4" : ""}`}>
          {s.items.map((item, i) => (
            <div key={i} className="md-card">
              <span className="md-card-ico">{s.layout === "steps" ? i + 1 : CARD_ICONS[i % CARD_ICONS.length]}</span>
              <h4>{item.title}</h4>
              {item.text && <p>{item.text}</p>}
            </div>
          ))}
        </div>
        {s.image && (
          <div className="md-wide-pic">
            <Media src={s.image} art={art} />
          </div>
        )}
        {s.button.trim() && (
          <div className="md-center">
            <a className="md-cta" href="#mdOrder" onClick={onCta}>
              {s.button}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
