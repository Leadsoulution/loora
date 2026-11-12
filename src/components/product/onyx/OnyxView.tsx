"use client";

import { IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import { useState } from "react";
import { Media } from "@/components/Media";
import type { ProductContent, Section } from "@/lib/content-types";
import { fieldMaxLength } from "@/lib/order";
import type { Product } from "@/lib/products";
import { useOrderForm } from "../useOrderForm";
import "./onyx.css";

// Design « Onyx » (noir et argent, style magazine homme).
// Textes, offres, photos et sections viennent du dashboard ; seuls ces textes fixes appartiennent au design.
const WORDMARK = "LOORA MEN";
const TOP_NOTE = "توصيل مجاني لكل المدن · الدفع عند الاستلام";
const FORM_TITLE = "اطلب دابا، وخلّص فاش توصلك";
const SUBMIT = "تأكيد الطلب";
const TRUST = ["الدفع عند الاستلام", "توصيل مجاني", "علبة هدية"];
const PLACEHOLDERS: Record<string, string> = {
  name: "الاسم الكامل",
  phone: "06 00 00 00 00",
  city: "المدينة",
  address: "العنوان",
};

const kufi = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["600", "800"], variable: "--font-onyx-display", preload: false });
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-onyx-body", preload: false });

const dh = (n: number) => `${n} درهم`;
const two = (n: number) => String(n).padStart(2, "0");

type Art = React.ComponentProps<typeof Media>["art"];
type Go = (e?: React.MouseEvent) => void;

export function OnyxView({ product, content }: { product: Product; content: ProductContent }) {
  const art = { category: product.category, metal: product.metal, stone: product.stone };
  const images = content.images.length > 0 ? content.images : ["jewel"];
  const [view, setView] = useState(0);
  const current = Math.min(view, images.length - 1);
  const { offers } = content;
  const [offerId, setOfferId] = useState(offers[0].id);
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];
  const discount = content.compareAt > content.price ? Math.round((1 - content.price / content.compareAt) * 100) : 0;
  const features = content.features.filter(Boolean);

  const goToOrder: Go = (e) => {
    e?.preventDefault();
    document.getElementById("oxOrder")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={`onyx-page ${kufi.variable} ${plex.variable}`} dir="rtl" lang="ar">
      <div className="ox-top">
        <b>{WORDMARK}</b>
        <span>{TOP_NOTE}</span>
      </div>

      {/* ============ Galerie + achat ============ */}
      <section className="ox-hero">
        <div className="ox-wrap ox-hero-grid">
          <div className="ox-gallery">
            <div className="ox-main">
              <Media src={images[current]} art={art} alt={`${content.type} ${content.name}`} priority />
              <span className="ox-count">
                {two(current + 1)} / {two(images.length)}
              </span>
              {discount > 0 && <span className="ox-sale">−{discount}%</span>}
            </div>
            {images.length > 1 && (
              <div className="ox-thumbs" style={{ "--n": Math.min(images.length, 6) } as React.CSSProperties}>
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className={current === i ? "on" : ""}
                    onClick={() => setView(i)}
                    aria-label={`صورة ${i + 1}`}
                  >
                    <Media src={src} art={art} thumb />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ox-buy">
            <span className="ox-latin">{content.type}</span>
            <h1>{content.name}</h1>
            {content.tagline && <p className="ox-tagline">{content.tagline}</p>}
            {content.description && <p className="ox-lead">{content.description}</p>}

            <div className="ox-price">
              <b>{dh(content.price)}</b>
              {discount > 0 && (
                <>
                  <s>{dh(content.compareAt)}</s>
                  <em>وفّر {content.compareAt - content.price} درهم</em>
                </>
              )}
            </div>

            {features.length > 0 && (
              <ol className="ox-specs">
                {features.map((f, i) => (
                  <li key={i}>
                    <span>{two(i + 1)}</span>
                    {f}
                  </li>
                ))}
              </ol>
            )}

            <div className="ox-offers" role="radiogroup">
              {offers.map((o) => {
                const was = o.qty * content.price;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={o.id === offer.id}
                    className={`ox-offer ${o.id === offer.id ? "on" : ""}`}
                    onClick={() => setOfferId(o.id)}
                  >
                    <span className="ox-radio" />
                    <span className="ox-offer-qty">×{o.qty}</span>
                    <span className="ox-offer-txt">
                      <b>{o.label}</b>
                      {o.tag && <i>{o.tag}</i>}
                      {o.note && <small>{o.note}</small>}
                    </span>
                    <span className="ox-offer-price">
                      <b>{dh(o.price)}</b>
                      {o.qty > 1 && was > o.price && <s>{dh(was)}</s>}
                    </span>
                  </button>
                );
              })}
            </div>

            <OnyxOrderForm product={product} content={content} offerId={offer.id} total={offer.price} />
          </div>
        </div>
      </section>

      {groupSections(content.sections).map((block, i) =>
        Array.isArray(block) ? (
          <Lookbook key={block[0].id} stories={block} art={art} onCta={goToOrder} />
        ) : (
          <OnyxSection key={block.id} section={block} art={art} onCta={goToOrder} dark={i % 2 === 1} />
        ),
      )}

      {content.sticky.enabled && (
        <div className={`ox-sticky ${content.sticky.where === "all" ? "ox-sticky--all" : ""}`}>
          {content.sticky.showImage && (
            <span className="ox-sticky-pic">
              <Media src={images[0]} art={art} thumb />
            </span>
          )}
          {content.sticky.showText && (
            <span className="ox-sticky-txt">
              <b>{content.name}</b>
              {dh(offer.price)}
            </span>
          )}
          <a href="#oxOrder" onClick={goToOrder}>
            {content.sticky.button}
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Formulaire */

function OnyxOrderForm({
  product,
  content,
  offerId,
  total,
}: {
  product: Product;
  content: ProductContent;
  offerId: string;
  total: number;
}) {
  const form = useOrderForm(product, content, offerId);
  const { errors } = form;

  return (
    <div className="ox-form-box" id="oxOrder">
      <div className="ox-form-head">
        <h2>{FORM_TITLE}</h2>
        <p>
          المجموع : <b>{dh(total)}</b>
        </p>
      </div>
      <form className="ox-form" onSubmit={form.submit} noValidate>
        {content.sizes.length > 0 && (
          <div className="ox-field">
            <label>{content.sizeTitle}</label>
            <div className="ox-sizes" role="radiogroup">
              {content.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={form.size === s}
                  name="size"
                  className={form.size === s ? "on" : ""}
                  onClick={() => form.setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.size && <span className="ox-err">{errors.size}</span>}
          </div>
        )}

        {content.fields.map((f) => {
          const id = `ox-${f.id}`;
          const props = {
            id,
            name: f.id,
            value: form.values[f.id] ?? "",
            placeholder: PLACEHOLDERS[f.id] ?? f.label,
            maxLength: fieldMaxLength(f),
            className: errors[f.id] ? "ox-invalid" : "",
            "aria-invalid": !!errors[f.id],
          };
          return (
            <div key={f.id} className="ox-field">
              <label htmlFor={id}>{f.label}</label>
              {f.kind === "long" ? (
                <textarea {...props} rows={3} onChange={(e) => form.update(f, e.target.value)} />
              ) : (
                <input
                  {...props}
                  type={f.kind === "phone" ? "tel" : "text"}
                  inputMode={f.kind === "phone" ? "tel" : f.kind === "number" ? "numeric" : undefined}
                  dir={f.kind === "phone" ? "ltr" : undefined}
                  onChange={(e) => form.update(f, e.target.value)}
                  onBlur={(e) => form.checkPhone(f, e.target.value)}
                />
              )}
              {errors[f.id] && <span className="ox-err">{errors[f.id]}</span>}
            </div>
          );
        })}

        {/* Champ piège anti-robot, invisible pour les clients */}
        <input
          type="text"
          name="website"
          value={form.honeypot}
          onChange={(e) => form.setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="ox-hp"
          aria-hidden
        />

        {errors.form && <span className="ox-err">{errors.form}</span>}
        <button type="submit" className="ox-submit" disabled={form.sending}>
          <span>{form.sending ? "جاري تسجيل الطلب..." : `${SUBMIT} · ${dh(total)}`}</span>
        </button>
        <ul className="ox-trust">
          {TRUST.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ Sections */

const isStory = (s: Section) => s.layout === "text" && !!s.image;

/** Les sections « texte + image » qui se suivent forment un lookbook qui défile */
function groupSections(sections: Section[]) {
  const blocks: (Section | Section[])[] = [];
  for (const s of sections) {
    const last = blocks[blocks.length - 1];
    if (isStory(s) && Array.isArray(last)) last.push(s);
    else blocks.push(isStory(s) ? [s] : s);
  }
  return blocks;
}

function Title({ section: s, as: Tag = "h2" }: { section: Section; as?: "h2" | "h3" }) {
  if (!s.title && !s.highlight) return null;
  return (
    <Tag>
      {s.title} {s.highlight && <em>{s.highlight}</em>}
    </Tag>
  );
}

function Lookbook({ stories, art, onCta }: { stories: Section[]; art: Art; onCta: Go }) {
  return (
    <section className="ox-sec ox-look">
      <div className="ox-wrap">
        <div className="ox-look-head">
          <span className="ox-latin">LOOKBOOK</span>
          <span className="ox-look-hint">اسحب ←</span>
        </div>
      </div>
      <div className={`ox-look-track ${stories.length === 1 ? "ox-look-track--one" : ""}`}>
        {stories.map((s, i) => (
          <article key={s.id} className="ox-look-card">
            <div className="ox-look-pic">
              <Media src={s.image} art={art} alt={[s.title, s.highlight].filter(Boolean).join(" ")} />
              <span>N°{two(i + 1)}</span>
            </div>
            {s.eyebrow && <span className="ox-eyebrow">{s.eyebrow}</span>}
            <Title section={s} as="h3" />
            {s.text.split(/\n\s*\n/).map((p, k) => p.trim() && <p key={k}>{p}</p>)}
            {s.button.trim() && (
              <a className="ox-link" href="#oxOrder" onClick={onCta}>
                {s.button}
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Autres sections du dashboard : questions → accordéon, texte seul → bloc final,
 * étapes → frise, cartes / liste → fiche technique numérotée.
 */
function OnyxSection({ section: s, art, onCta, dark }: { section: Section; art: Art; onCta: Go; dark: boolean }) {
  const head = (
    <div className="ox-head">
      {s.eyebrow && <span className="ox-eyebrow">{s.eyebrow}</span>}
      <Title section={s} />
      {s.layout !== "text" && s.text && <p>{s.text}</p>}
    </div>
  );

  if (s.layout === "faq") {
    return (
      <section className="ox-sec">
        <div className="ox-wrap ox-narrow">
          {head}
          <div className="ox-faq">
            {s.items.map((item, i) => (
              <details key={i}>
                <summary>
                  <span>{two(i + 1)}</span>
                  {item.title}
                </summary>
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
      <section className="ox-sec ox-final">
        <div className="ox-wrap">
          <span className="ox-latin">{WORDMARK}</span>
          {head}
          {s.text && <p className="ox-final-text">{s.text}</p>}
          {s.button.trim() && (
            <a className="ox-cta" href="#oxOrder" onClick={onCta}>
              {s.button}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (s.layout === "steps") {
    return (
      <section className={`ox-sec ${dark ? "ox-sec--alt" : ""}`}>
        <div className="ox-wrap">
          {head}
          <ol className="ox-steps">
            {s.items.map((item, i) => (
              <li key={i}>
                <span>{two(i + 1)}</span>
                <b>{item.title}</b>
                {item.text && <p>{item.text}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section className={`ox-sec ${dark ? "ox-sec--alt" : ""}`}>
      <div className={`ox-wrap ${s.image ? "ox-split" : ""}`}>
        <div>
          {head}
          <dl className="ox-sheet">
            {s.items.map((item, i) => (
              <div key={i}>
                <dt>
                  <span>{two(i + 1)}</span>
                  {item.title}
                </dt>
                {item.text && <dd>{item.text}</dd>}
              </div>
            ))}
          </dl>
          {s.button.trim() && (
            <a className="ox-link" href="#oxOrder" onClick={onCta}>
              {s.button}
            </a>
          )}
        </div>
        {s.image && (
          <div className="ox-side-pic">
            <Media src={s.image} art={art} />
          </div>
        )}
      </div>
    </section>
  );
}
