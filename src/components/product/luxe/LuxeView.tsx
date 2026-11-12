"use client";

import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import { useRef, useState } from "react";
import { Media } from "@/components/Media";
import type { ProductContent, Section } from "@/lib/content-types";
import { fieldMaxLength } from "@/lib/order";
import type { Product } from "@/lib/products";
import { useOrderForm } from "../useOrderForm";
import "./luxe.css";

// Design « Luxe clair » (ivoire, noir et or, style boutique de luxe).
// Textes, offres, photos et sections viennent du dashboard ; seuls ces textes fixes appartiennent au design.
const TOP_ITEMS = ["توصيل مجاني", "الدفع عند الاستلام", "علبة هدية"];
const FORM_TITLE = "أكمل طلبك";
const FORM_NOTE = "بلا دفع مسبق · كنتاصلو بيك باش نأكدو";
const SUBMIT = "تأكيد الطلب";
const PLACEHOLDERS: Record<string, string> = {
  name: "الاسم الكامل",
  phone: "06 00 00 00 00",
  city: "المدينة",
  address: "العنوان",
};
const ICONS = ["◆", "✧", "◇", "❖", "✦", "◈"];

const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-luxe-display", preload: false });
const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-luxe-body", preload: false });

const dh = (n: number) => `${n} درهم`;

type Art = React.ComponentProps<typeof Media>["art"];
type Go = (e?: React.MouseEvent) => void;

export function LuxeView({ product, content }: { product: Product; content: ProductContent }) {
  const art = { category: product.category, metal: product.metal, stone: product.stone };
  const images = content.images.length > 0 ? content.images : ["jewel"];
  const { offers } = content;
  const [offerId, setOfferId] = useState(offers[0].id);
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];
  const discount = content.compareAt > content.price ? Math.round((1 - content.price / content.compareAt) * 100) : 0;

  const goToOrder: Go = (e) => {
    e?.preventDefault();
    document.getElementById("lxOrder")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={`luxe-page ${amiri.variable} ${plex.variable}`} dir="rtl" lang="ar">
      <div className="lx-top">
        {TOP_ITEMS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      <section className="lx-hero">
        <div className="lx-wrap lx-hero-grid">
          <Gallery images={images} art={art} alt={content.name} discount={discount} />

          <div className="lx-buy">
            <span className="lx-brand">{content.type}</span>
            <h1>{content.name}</h1>
            {content.tagline && <p className="lx-tagline">{content.tagline}</p>}
            <div className="lx-rule" aria-hidden>
              <i />
            </div>

            <div className="lx-price">
              <b>{dh(content.price)}</b>
              {discount > 0 && (
                <>
                  <s>{dh(content.compareAt)}</s>
                  <em>−{discount}%</em>
                </>
              )}
            </div>
            {content.description && <p className="lx-lead">{content.description}</p>}

            {content.features.some(Boolean) && (
              <ul className="lx-feats">
                {content.features.filter(Boolean).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            <p className="lx-label">اختر العرض</p>
            <div className="lx-offers" role="radiogroup">
              {offers.map((o) => {
                const was = o.qty * content.price;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={o.id === offer.id}
                    className={`lx-offer ${o.id === offer.id ? "on" : ""}`}
                    onClick={() => setOfferId(o.id)}
                  >
                    {o.tag && <span className="lx-offer-tag">{o.tag}</span>}
                    <span className="lx-check" />
                    <span className="lx-offer-txt">
                      <b>{o.label}</b>
                      {o.note && <small>{o.note}</small>}
                    </span>
                    <span className="lx-offer-price">
                      <b>{dh(o.price)}</b>
                      {o.qty > 1 && was > o.price && <s>{dh(was)}</s>}
                    </span>
                  </button>
                );
              })}
            </div>

            <LuxeOrderForm product={product} content={content} offerId={offer.id} total={offer.price} />
          </div>
        </div>
      </section>

      {groupSections(content.sections).map((block) =>
        Array.isArray(block) ? (
          <Stories key={block[0].id} stories={block} art={art} onCta={goToOrder} />
        ) : (
          <LuxeSection key={block.id} section={block} art={art} onCta={goToOrder} />
        ),
      )}

      {content.sticky.enabled && (
        <div className={`lx-sticky ${content.sticky.where === "all" ? "lx-sticky--all" : ""}`}>
          {content.sticky.showText && (
            <span className="lx-sticky-txt">
              <b>{content.name}</b>
              {dh(offer.price)}
            </span>
          )}
          <a href="#lxOrder" onClick={goToOrder}>
            {content.sticky.button}
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Galerie à glisser */

function Gallery({ images, art, alt, discount }: { images: string[]; art: Art; alt: string; discount: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  };

  return (
    <div className="lx-gallery">
      <div className="lx-slides-box">
        <div
          ref={track}
          className="lx-slides"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="lx-slide">
              <Media src={src} art={art} alt={i === 0 ? alt : ""} priority={i === 0} />
            </div>
          ))}
        </div>
        {discount > 0 && <span className="lx-sale">−{discount}%</span>}
        {images.length > 1 && (
          <div className="lx-dots">
            {images.map((_, i) => (
              <button key={i} type="button" className={i === index ? "on" : ""} onClick={() => go(i)} aria-label={`صورة ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="lx-thumbs">
          {images.map((src, i) => (
            <button key={`${src}-${i}`} type="button" className={i === index ? "on" : ""} onClick={() => go(i)} aria-label={`صورة ${i + 1}`}>
              <Media src={src} art={art} thumb />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Formulaire */

function LuxeOrderForm({
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
    <div className="lx-form-box" id="lxOrder">
      <h2 className="lx-form-title">{FORM_TITLE}</h2>
      <p className="lx-form-note">{FORM_NOTE}</p>
      <form className="lx-form" onSubmit={form.submit} noValidate>
        {content.sizes.length > 0 && (
          <div className="lx-field">
            <label>{content.sizeTitle}</label>
            <div className="lx-sizes" role="radiogroup">
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
            {errors.size && <span className="lx-err">{errors.size}</span>}
          </div>
        )}

        {content.fields.map((f) => {
          const id = `lx-${f.id}`;
          const props = {
            id,
            name: f.id,
            value: form.values[f.id] ?? "",
            placeholder: PLACEHOLDERS[f.id] ?? f.label,
            maxLength: fieldMaxLength(f),
            className: errors[f.id] ? "lx-invalid" : "",
            "aria-invalid": !!errors[f.id],
          };
          return (
            <div key={f.id} className="lx-field">
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
              {errors[f.id] && <span className="lx-err">{errors[f.id]}</span>}
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
          className="lx-hp"
          aria-hidden
        />

        {errors.form && <span className="lx-err">{errors.form}</span>}
        <button type="submit" className="lx-submit" disabled={form.sending}>
          {form.sending ? "جاري تسجيل الطلب..." : `${SUBMIT} — ${dh(total)}`}
        </button>
        <div className="lx-assure">
          {TOP_ITEMS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ Sections */

const isStory = (s: Section) => s.layout === "text" && !!s.image;

function groupSections(sections: Section[]) {
  const blocks: (Section | Section[])[] = [];
  for (const s of sections) {
    const last = blocks[blocks.length - 1];
    if (isStory(s) && Array.isArray(last)) last.push(s);
    else blocks.push(isStory(s) ? [s] : s);
  }
  return blocks;
}

function Head({ section: s, center = true }: { section: Section; center?: boolean }) {
  return (
    <div className={`lx-head ${center ? "lx-head--center" : ""}`}>
      {s.eyebrow && <span className="lx-eyebrow">{s.eyebrow}</span>}
      {(s.title || s.highlight) && (
        <h2>
          {s.title} {s.highlight && <em>{s.highlight}</em>}
        </h2>
      )}
    </div>
  );
}

/** Histoires : grande photo, puis texte centré, en alternance */
function Stories({ stories, art, onCta }: { stories: Section[]; art: Art; onCta: Go }) {
  return (
    <section className="lx-sec lx-stories">
      <div className="lx-wrap">
        {stories.map((s, i) => (
          <article key={s.id} className={`lx-story ${i % 2 ? "lx-story--flip" : ""}`}>
            <div className="lx-story-pic">
              <Media src={s.image} art={art} alt={[s.title, s.highlight].filter(Boolean).join(" ")} />
            </div>
            <div className="lx-story-txt">
              <Head section={s} center={false} />
              {s.text.split(/\n\s*\n/).map((p, k) => p.trim() && <p key={k}>{p}</p>)}
              {s.button.trim() && (
                <a className="lx-outline" href="#lxOrder" onClick={onCta}>
                  {s.button}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LuxeSection({ section: s, art, onCta }: { section: Section; art: Art; onCta: Go }) {
  if (s.layout === "faq") {
    return (
      <section className="lx-sec lx-sec--soft">
        <div className="lx-wrap lx-narrow">
          <Head section={s} />
          {s.text && <p className="lx-sub">{s.text}</p>}
          <div className="lx-faq">
            {s.items.map((item, i) => (
              <details key={i}>
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
      <section className="lx-sec lx-final">
        <div className="lx-wrap lx-narrow">
          <div className="lx-final-box">
            <Head section={s} />
            {s.text && <p>{s.text}</p>}
            {s.button.trim() && (
              <a className="lx-cta" href="#lxOrder" onClick={onCta}>
                {s.button}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  const steps = s.layout === "steps";
  return (
    <section className={`lx-sec ${steps ? "lx-sec--soft" : ""}`}>
      <div className="lx-wrap">
        <Head section={s} />
        {s.text && <p className="lx-sub">{s.text}</p>}
        <div className={`lx-cards ${steps ? "lx-cards--steps" : ""} ${s.items.length === 4 ? "lx-cards--4" : ""}`}>
          {s.items.map((item, i) => (
            <div key={i} className="lx-card">
              <span className="lx-card-ico">{steps ? i + 1 : ICONS[i % ICONS.length]}</span>
              <h3>{item.title}</h3>
              {item.text && <p>{item.text}</p>}
            </div>
          ))}
        </div>
        {s.image && (
          <div className="lx-wide-pic">
            <Media src={s.image} art={art} />
          </div>
        )}
        {s.button.trim() && (
          <div className="lx-center">
            <a className="lx-cta" href="#lxOrder" onClick={onCta}>
              {s.button}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
