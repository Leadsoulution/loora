"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Media } from "@/components/Media";
import { PHONE_FIELD_ID, type FormField, type ProductContent } from "@/lib/content-types";
import { fieldMaxLength, validateOrder, type OrderErrors, type OrderInput } from "@/lib/order";
import { formatDh, type Product } from "@/lib/products";
import { Icon } from "./Icon";

/** Remplissage automatique du navigateur pour les champs de base */
const AUTOCOMPLETE: Record<string, string> = {
  name: "name",
  phone: "tel",
  city: "address-level2",
  address: "street-address",
};

/** Nombre maximum de vignettes affichées dans une offre */
const MAX_PACK_IMAGES = 3;

export function CodForm({
  product,
  content,
  packImage,
}: {
  product: Product;
  content: ProductContent;
  packImage: string;
}) {
  const metal = product.metal;
  const art = { category: product.category, metal, stone: product.stone };
  const { offers, sizes } = content;
  const needsSize = sizes.length > 0;
  const compareAt = Math.max(content.compareAt, content.price);
  const [offerId, setOfferId] = useState(offers[0].id);
  const [size, setSize] = useState<string | undefined>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<OrderErrors>({});
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const [done, setDone] = useState<{ ref: string; total: number } | null>(null);

  // L'offre choisie peut disparaître si elle est supprimée dans le dashboard (aperçu)
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];
  const total = offer.price;

  function update(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const order: OrderInput = { slug: product.slug, metal, size, offer: offer.id, values };
    const found = validateOrder(order, content);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
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
        setErrors(data.errors ?? { form: "حدث خطأ، المرجو المحاولة مرة أخرى." });
        return;
      }
      setDone({ ref: data.ref, total: data.total });
      // Page de remerciement (le message ci-dessous reste affiché pendant le chargement)
      router.push(`/merci/?ref=${encodeURIComponent(data.ref)}`);
    } catch {
      setErrors({ form: "تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form id="order" className="pa-order" onSubmit={submit} noValidate>
      <div className="pa-order-body">
        {done ? (
          <div className="pa-success" role="status">
            <div className="pa-ok">
              <Icon name="check" />
            </div>
            <h3>شكراً على طلبك!</h3>
            <p>
              رقم الطلب: <b dir="ltr">{done.ref}</b>
              <br />
              المبلغ عند الاستلام: <b>{formatDh(done.total)}</b>
              <br />
              سنتصل بك قريباً على الرقم <b dir="ltr">{values[PHONE_FIELD_ID]}</b> لتأكيد طلبك.
            </p>
          </div>
        ) : (
          <>
            <div className="pa-step">
              <i>1</i>اختر العرض المناسب لك
            </div>
            <div className="pa-packs" role="radiogroup" aria-label="اختر العرض">
              {offers.map((o) => {
                const packTotal = o.price;
                const compare = compareAt * o.qty;
                const note = o.note || (o.qty > 1 ? `${formatDh(Math.round(packTotal / o.qty))} للقطعة` : "");
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={offer.id === o.id}
                    className={`pa-pack ${offer.id === o.id ? "active" : ""}`}
                    onClick={() => setOfferId(o.id)}
                  >
                    {o.tag && <span className={`pa-pill ${o.tagStyle === "gold" ? "gold" : ""}`}>{o.tag}</span>}
                    <span className="pa-radio" />
                    <span className={`pa-pack-img ${o.image ? "custom" : ""}`}>
                      {o.image ? (
                        <Media src={o.image} art={art} thumb />
                      ) : (
                        Array.from({ length: Math.min(o.qty, MAX_PACK_IMAGES) }, (_, i) => (
                          <Media key={i} src={packImage} art={art} thumb />
                        ))
                      )}
                    </span>
                    <span className="pa-pack-txt">
                      <b>{o.label}</b>
                      {note && <small>{note}</small>}
                      {compare > packTotal && <span className="pa-save">وفّر {formatDh(compare - packTotal)}</span>}
                    </span>
                    <span className="pa-pack-price">
                      <b>{formatDh(packTotal)}</b>
                      {compare > packTotal && <s>{formatDh(compare)}</s>}
                    </span>
                  </button>
                );
              })}
            </div>

            {needsSize && (
              <>
                <div className="pa-step second">
                  <i>2</i>
                  {content.sizeTitle || "اختر المقاس"}
                </div>
                <div className={`pa-sizes ${errors.size ? "err" : ""}`} role="radiogroup" aria-label="المقاس">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      name="size"
                      role="radio"
                      aria-checked={size === s}
                      className={`pa-size ${size === s ? "active" : ""}`}
                      onClick={() => {
                        setSize(s);
                        setErrors((e) => ({ ...e, size: undefined }));
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.size && <em className="pa-err">{errors.size}</em>}
              </>
            )}

            <div className="pa-step second">
              <i>{needsSize ? 3 : 2}</i>معلوماتك
            </div>
            <input
              type="text"
              name="website"
              className="pa-hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
            {content.fields.map((f) => (
              <OrderField
                key={f.id}
                field={f}
                value={values[f.id] ?? ""}
                error={errors[f.id]}
                onChange={(v) => update(f.id, v)}
              />
            ))}

            <div className="pa-total">
              <span>
                المجموع · <b>{offer.label}</b>
                <small>التوصيل المجاني مشمول</small>
              </span>
              <strong>{formatDh(total)}</strong>
            </div>

            <button type="submit" className="pa-buy" disabled={sending}>
              <span>{sending ? "جاري الإرسال…" : "اطلب الآن"}</span>
              <Icon name="arrowLeft" />
            </button>
            {errors.form && (
              <div className="pa-formerr" role="alert">
                {errors.form}
              </div>
            )}

            <div className="pa-trust">
              <span>
                <Icon name="cash" />
                الدفع عند الاستلام
              </span>
              <span>
                <Icon name="truck" />
                توصيل مجاني
              </span>
              <span>
                <Icon name="shield" />
                ضمان استرجاع المال
              </span>
            </div>
          </>
        )}
      </div>
    </form>
  );
}

function OrderField({
  field: f,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const props = {
    name: f.id,
    placeholder: f.required ? f.label : `${f.label} (اختياري)`,
    autoComplete: AUTOCOMPLETE[f.id] ?? "off",
    maxLength: fieldMaxLength(f),
    value,
    "aria-invalid": !!error,
    "aria-label": f.label,
  };
  return (
    <label className={`pa-field ${error ? "err" : ""}`}>
      <span className={`pa-input ${f.kind === "long" ? "long" : ""}`}>
        <Icon name={f.icon} />
        {f.kind === "long" ? (
          <textarea rows={3} {...props} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input
            type={f.kind === "phone" ? "tel" : "text"}
            inputMode={f.kind === "phone" ? "tel" : f.kind === "number" ? "numeric" : undefined}
            {...props}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </span>
      {error && <em className="pa-err">{error}</em>}
    </label>
  );
}
