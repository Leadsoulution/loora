import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteOrder, listOrders, ORDER_STATUSES, updateOrder } from "@/lib/orders";

const unauthorized = () => NextResponse.json({ error: "Non autorisé." }, { status: 401 });

export async function GET(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const orders = await listOrders();

  if (new URL(request.url).searchParams.get("format") !== "csv") {
    return NextResponse.json(orders);
  }

  // Export CSV (séparateur « ; » et BOM UTF-8 pour Excel)
  const label = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s.label]));
  const columns: [string, (o: (typeof orders)[number]) => unknown][] = [
    ["Référence", (o) => o.ref],
    ["Date", (o) => new Date(o.createdAt).toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })],
    ["Statut", (o) => label[o.status]],
    ["Nom", (o) => o.name],
    ["Téléphone", (o) => o.phone],
    ["Ville", (o) => o.city],
    ["Adresse", (o) => o.address],
    ["Produit", (o) => o.product],
    ["Métal", (o) => o.metal],
    ["Taille", (o) => o.size ?? ""],
    ["Quantité", (o) => o.qty],
    ["Total (DH)", (o) => o.total],
    ["Autres champs", (o) => o.extra?.map((x) => `${x.label}: ${x.value}`).join(" | ") ?? ""],
    ["Note", (o) => o.note ?? ""],
  ];
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    columns.map(([h]) => cell(h)).join(";"),
    ...orders.map((o) => columns.map(([, get]) => cell(get(o))).join(";")),
  ].join("\r\n");

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-loora.csv"`,
    },
  });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const order = await updateOrder(String(body.ref ?? ""), { status: body.status, note: body.note });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const ok = await deleteOrder(String(body.ref ?? ""));
  if (!ok) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
