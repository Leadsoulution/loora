"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PHONE_FIELD_ID, type FormField, type ProductContent } from "@/lib/content-types";
import { validateOrder, type OrderErrors, type OrderInput } from "@/lib/order";
import { normalizePhone } from "@/lib/phone";
import type { Product } from "@/lib/products";

export const PHONE_ERROR = "المرجو إدخال رقم هاتف مغربي صحيح (مثال: 0612345678)";

/**
 * Logique du formulaire de commande, sans mise en page : chaque design l'habille à sa façon.
 * Téléphone normalisé (chiffres arabes, espaces…), validation commune, envoi puis page merci.
 */
export function useOrderForm(product: Product, content: ProductContent, offerId: string) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [size, setSizeState] = useState<string | undefined>();
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

  /** Contrôle du téléphone dès que la cliente quitte le champ */
  function checkPhone(field: FormField, value: string) {
    const v = value.trim();
    if (field.kind === "phone" && v) {
      setErrors((old) => ({ ...old, [field.id]: normalizePhone(v) ? undefined : PHONE_ERROR }));
    }
  }

  function setSize(s: string) {
    setSizeState(s);
    setErrors((e) => ({ ...e, size: undefined }));
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
    if ((values[PHONE_FIELD_ID] && phone === null) || found[PHONE_FIELD_ID]) found[PHONE_FIELD_ID] = PHONE_ERROR;
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
      router.push(`/merci/?ref=${encodeURIComponent(data.ref)}`);
    } catch {
      setErrors({ form: "وقع خطأ في الاتصال، المرجو المحاولة مرة أخرى." });
      setSending(false);
    }
  }

  return { values, size, setSize, honeypot, setHoneypot, errors, sending, update, checkPhone, submit };
}
