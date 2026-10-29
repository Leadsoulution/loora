import { NextResponse } from "next/server";
import { getProductContent } from "@/lib/content";
import { fieldMaxLength, validateOrder, type OrderInput } from "@/lib/order";
import { addOrder, type Order } from "@/lib/orders";
import { METAL_LABEL } from "@/lib/products";

/** Champs qui ont leur propre colonne dans la commande */
const BASE_FIELDS = new Set(["name", "phone", "city", "address"]);

export async function POST(request: Request) {
  let body: Omit<OrderInput, "values"> & { values?: unknown; website?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errors: { form: "طلب غير صالح." } }, { status: 400 });
  }

  // Champ piège anti-robot : rempli = robot, on fait semblant d'accepter
  if (body.website) {
    return NextResponse.json({ ref: "LO-OK", total: 0 });
  }

  const slug = String(body.slug ?? "");
  const content = await getProductContent(slug);
  // On ne garde que les champs configurés dans le dashboard
  const raw = (body.values && typeof body.values === "object" ? body.values : {}) as Record<string, unknown>;
  const values: Record<string, string> = {};
  for (const f of content?.fields ?? []) {
    values[f.id] = typeof raw[f.id] === "string" ? (raw[f.id] as string).trim().slice(0, fieldMaxLength(f)) : "";
  }

  const input: OrderInput = {
    slug,
    metal: body.metal,
    size: body.size ? String(body.size).slice(0, 20) : undefined,
    offer: String(body.offer ?? ""),
    values,
  };

  const errors = validateOrder(input, content);
  if (Object.keys(errors).length > 0 || !content) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Quantité et prix viennent de l'offre enregistrée dans le dashboard, jamais du client
  const offer = content.offers.find((o) => o.id === input.offer)!;
  const ref = `LO-${Date.now().toString(36).toUpperCase()}`;
  const extra = content.fields
    .filter((f) => !BASE_FIELDS.has(f.id) && values[f.id])
    .map((f) => ({ label: f.label, value: values[f.id] }));
  const order: Order = {
    ref,
    createdAt: new Date().toISOString(),
    status: "a_confirmer",
    payment: "paiement à la livraison",
    product: content.name,
    slug,
    size: input.size,
    name: values.name ?? "",
    phone: values.phone,
    city: values.city ?? "",
    address: values.address ?? "",
    ...(extra.length > 0 && { extra }),
    offer: offer.label,
    qty: offer.qty,
    metal: METAL_LABEL[input.metal],
    total: offer.price,
  };

  // 1. Sauvegarde locale (visible dans le dashboard, onglet Commandes)
  await addOrder(order);

  // 2. Envoi optionnel vers un webhook (Google Sheets via Apps Script, Zapier, Make…)
  const webhook = process.env.ORDER_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
    } catch (err) {
      console.error("Webhook commande en échec :", err);
    }
  }

  return NextResponse.json({ ref, total: order.total });
}
