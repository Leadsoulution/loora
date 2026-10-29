"use client";

import { useEffect, useState } from "react";
import { Media } from "@/components/Media";
import { buttonHref, type ProductContent, type Section, type Theme } from "@/lib/content-types";
import { formatDh, type Product } from "@/lib/products";
import { CodForm } from "./CodForm";
import { Icon, StarIcon, type IconName } from "./Icon";
import "./product-ar.css";

const FEATURE_ICONS: IconName[] = ["gem", "drop", "hand", "gift"];
const CARD_ICONS: IconName[] = ["gem", "sparkle", "box", "heart", "shield", "gift"];

/** Couleurs du dashboard → variables CSS de la fiche produit */
export function themeVars(t: Theme) {
  return {
    "--pa-accent": t.accent,
    "--pa-accent-dark": t.accentDark,
    "--pa-accent-soft": t.accentSoft,
    "--pa-ink": t.ink,
    "--pa-muted": t.muted,
    "--pa-cream": t.cream,
    "--pa-line": t.line,
    "--pa-red": t.badge,
    "--pa-gradient": `linear-gradient(225deg, ${t.accent} 0%, ${t.accentDark} 100%)`,
  } as React.CSSProperties;
}

export function ProductView({
  product,
  content,
  theme,
}: {
  product: Product;
  content: ProductContent;
  theme: Theme;
}) {
  const [view, setView] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  // Les autres photos de la galerie se chargent une fois la page prête (la première passe avant tout)
  const [galleryReady, setGalleryReady] = useState(false);

  const art = { category: product.category, metal: product.metal, stone: product.stone };
  const images = content.images.length > 0 ? content.images : ["jewel"];
  const current = Math.min(view, images.length - 1);
  const discount = content.compareAt > content.price ? Math.round((1 - content.price / content.compareAt) * 100) : 0;
  const style = themeVars(theme);
  const { sticky } = content;

  // Barre collante : visible quand le formulaire n'est pas à l'écran
  useEffect(() => {
    const form = document.getElementById("order");
    if (!form) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting));
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ready = () => setGalleryReady(true);
    if (document.readyState === "complete") {
      const t = setTimeout(ready);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", ready);
    return () => window.removeEventListener("load", ready);
  }, []);

  const goToOrder = () => document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const step = (dir: 1 | -1) => setView((current + dir + images.length) % images.length);

  return (
    <>
      <div className="pa" dir="rtl" lang="ar" style={style}>
        {/* ================= GALERIE ================= */}
        <section className="pa-gallery">
          <div className="pa-photo">
            {images.map(
              (src, i) =>
                (i === current || galleryReady) && (
                  <Media
                    key={`${src}-${i}`}
                    src={src}
                    art={art}
                    alt={content.name}
                    priority={i === 0}
                    className={current === i ? "" : "opacity-0"}
                  />
                ),
            )}
            {discount > 0 && <span className="pa-badge">خصم {discount}%</span>}
          </div>

          {images.length > 1 && (
            <div className="pa-thumbs">
              <button type="button" className="pa-arrow" onClick={() => step(-1)} aria-label="السابق">
                <Icon name="arrowRight" />
              </button>
              <div className="pa-thumbs-list">
                {images.slice(0, 5).map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    className={`pa-thumb ${current === i ? "active" : ""}`}
                    onClick={() => setView(i)}
                    aria-label={`صورة ${i + 1}`}
                  >
                    <Media src={src} art={art} thumb />
                  </button>
                ))}
              </div>
              <button type="button" className="pa-arrow" onClick={() => step(1)} aria-label="التالي">
                <Icon name="arrowLeft" />
              </button>
            </div>
          )}

          {content.features.some(Boolean) && (
            <div className="pa-features">
              {content.features.map(
                (label, i) =>
                  label && (
                    <div key={i} className="pa-feature">
                      <i>
                        <Icon name={FEATURE_ICONS[i % FEATURE_ICONS.length]} />
                      </i>
                      <span>{label}</span>
                    </div>
                  ),
              )}
            </div>
          )}
        </section>

        {/* ================= INFOS + COMMANDE ================= */}
        <section>
          {content.tagline && (
            <div className="pa-tag">
              <StarIcon />
              {content.tagline}
            </div>
          )}
          <h1 className="pa-title">
            {content.type} <em>{content.name}</em>
          </h1>
          <div className="pa-price">
            <b>{formatDh(content.price)}</b>
            {discount > 0 && (
              <>
                <s>{formatDh(content.compareAt)}</s>
                <span>وفّر {formatDh(content.compareAt - content.price)}</span>
              </>
            )}
          </div>
          {content.description && <p className="pa-desc">{content.description}</p>}

          <CodForm product={product} content={content} packImage={images[0]} />
        </section>
      </div>

      {/* ================= DESCRIPTION ================= */}
      <div className="pad" dir="rtl" lang="ar" style={style}>
        {content.sections.map((section) => (
          <SectionBlock key={section.id} section={section} art={art} onCta={goToOrder} />
        ))}

        {/* Barre collante (réglable dans le dashboard) */}
        {sticky.enabled && (
          <div
            className={`pad-sticky ${showSticky ? "show" : ""} ${sticky.where === "all" ? "everywhere" : ""} ${
              sticky.showText ? "" : "solo"
            }`}
          >
            {sticky.showImage && (
              <div className="pad-sticky-img">
                <Media src={images[0]} art={art} thumb />
              </div>
            )}
            {sticky.showText && (
              <div className="pad-sticky-txt">
                <b>
                  {content.type} {content.name}
                </b>
                <span>{formatDh(content.price)}</span>
              </div>
            )}
            <button type="button" className="pad-sticky-btn" onClick={goToOrder}>
              {sticky.button}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function SectionBlock({
  section: s,
  art,
  onCta,
}: {
  section: Section;
  art: React.ComponentProps<typeof Media>["art"];
  onCta: () => void;
}) {
  const paragraphs = s.text.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <section
      className={`pad-sec ${s.background === "cream" ? "cream" : ""} sz-title-${s.titleSize} sz-text-${s.textSize} sz-image-${s.imageSize} sz-space-${s.spacing}`}
    >
      <div className="pad-in">
        {s.eyebrow && (
          <span className="pad-eyebrow">
            <StarIcon />
            {s.eyebrow}
          </span>
        )}
        {(s.title || s.highlight) && (
          <h2 className="pad-h2">
            {s.title} {s.highlight && <em>{s.highlight}</em>}
          </h2>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="pad-lead whitespace-pre-line">
            {p}
          </p>
        ))}

        {s.layout === "list" && s.items.length > 0 && (
          <ul className="pad-list">
            {s.items.map((item, i) => (
              <li key={i}>
                <i>
                  <Icon name="check" />
                </i>
                {item.title}
              </li>
            ))}
          </ul>
        )}

        {s.layout === "cards" && s.items.length > 0 && (
          <div className="pad-cards">
            {s.items.map((item, i) => (
              <div key={i}>
                <i>
                  <Icon name={CARD_ICONS[i % CARD_ICONS.length]} />
                </i>
                <b>{item.title}</b>
                {item.text && <span>{item.text}</span>}
              </div>
            ))}
          </div>
        )}

        {s.layout === "steps" && s.items.length > 0 && (
          <div className="pad-steps">
            {s.items.map((item, i) => (
              <div key={i}>
                <em>{i + 1}</em>
                <b>{item.title}</b>
                {item.text && <span>{item.text}</span>}
              </div>
            ))}
          </div>
        )}

        {s.layout === "faq" && s.items.length > 0 && (
          <div className="pad-faq">
            {s.items.map((item, i) => (
              <details key={i}>
                <summary>
                  {item.title}
                  <span>+</span>
                </summary>
                <p>{item.text}</p>
              </details>
            ))}
          </div>
        )}

        {s.image && (
          <div className="pad-img">
            <Media src={s.image} art={art} />
          </div>
        )}

        {s.button.trim() && <SectionButton section={s} onCta={onCta} />}
      </div>
    </section>
  );
}

function SectionButton({ section: s, onCta }: { section: Section; onCta: () => void }) {
  const href = buttonHref(s);
  const className = `pad-cta sz-btn-${s.buttonSize} ${s.buttonAction === "whatsapp" && href ? "whatsapp" : ""}`;
  const content = (
    <>
      {s.button} <Icon name={s.buttonAction === "whatsapp" && href ? "phone" : "arrowLeft"} />
    </>
  );
  // Sans lien valide, le bouton mène au formulaire de commande
  if (!href) {
    return (
      <button type="button" className={className} onClick={onCta}>
        {content}
      </button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}
