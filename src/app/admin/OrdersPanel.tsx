"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import type { Order } from "@/lib/orders";
import { Button } from "./ui";

const STATUS = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s])) as Record<
  OrderStatus,
  (typeof ORDER_STATUSES)[number]
>;

const dh = (n: number) => `${n.toLocaleString("fr-FR")} DH`;
const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Casablanca",
});

/** 06 12 34 56 78 → 212612345678 (format WhatsApp) */
function whatsappNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0")) return `212${d.slice(1)}`;
  return d;
}

function confirmMessage(o: Order) {
  return [
    `السلام عليكم${o.name ? ` ${o.name}` : ""}،`,
    `شكراً على طلبكم من LOORA ✨`,
    `المنتج: ${o.product}${o.qty > 1 ? ` × ${o.qty}` : ""}${o.size ? ` (مقاس ${o.size})` : ""}`,
    `المبلغ عند الاستلام: ${o.total} درهم`,
    (o.address || o.city) && `العنوان: ${[o.address, o.city].filter(Boolean).join("، ")}`,
    `هل تؤكدون الطلب؟`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function OrdersPanel({ onPending }: { onPending: (n: number) => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [openRef, setOpenRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setOrders(await res.json());
      setError("");
    } catch {
      setError("Impossible de charger les commandes.");
    }
  }, []);

  useEffect(() => {
    // Chargement initial puis actualisation automatique toutes les 30 s
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (orders) onPending(orders.filter((o) => o.status === "a_confirmer").length);
  }, [orders, onPending]);

  async function patch(ref: string, changes: { status?: OrderStatus; note?: string }) {
    setOrders((list) => list?.map((o) => (o.ref === ref ? { ...o, ...changes } : o)) ?? null);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, ...changes }),
    });
    if (!res.ok) {
      setError("La modification n'a pas été enregistrée.");
      load();
    }
  }

  async function remove(o: Order) {
    if (!confirm(`Supprimer définitivement la commande ${o.ref} de ${o.name} ?`)) return;
    setOrders((list) => list?.filter((x) => x.ref !== o.ref) ?? null);
    const res = await fetch("/api/admin/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: o.ref }),
    });
    if (!res.ok) load();
  }

  const counts = useMemo(() => {
    const c = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, 0])) as Record<OrderStatus, number>;
    orders?.forEach((o) => c[o.status]++);
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orders ?? []).filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (!q || [o.ref, o.name, o.phone, o.city, o.product].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [orders, filter, search]);

  if (!orders) {
    return <p className="py-16 text-center text-muted">{error || "Chargement des commandes…"}</p>;
  }

  const today = new Date().toDateString();
  const delivered = orders.filter((o) => o.status === "livree");
  const stats = [
    { label: "À confirmer", value: counts.a_confirmer, accent: STATUS.a_confirmer.color },
    { label: "En cours", value: counts.confirmee + counts.expediee, hint: "confirmées + expédiées" },
    { label: "Livrées", value: delivered.length, hint: dh(delivered.reduce((s, o) => s + o.total, 0)) },
    { label: "Aujourd'hui", value: orders.filter((o) => new Date(o.createdAt).toDateString() === today).length },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Commandes</h1>
          <p className="mt-1 text-sm text-muted">
            {orders.length} commande{orders.length > 1 ? "s" : ""} au total · actualisation automatique
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load}>↻ Actualiser</Button>
          <a
            href="/api/admin/orders?format=csv"
            className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-[13px] font-medium hover:border-ink/40"
          >
            ⤓ Exporter (Excel)
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-ink/10 bg-white p-4">
            <p className="text-[12px] uppercase tracking-[0.12em] text-muted">{s.label}</p>
            <p className="mt-1 font-display text-4xl" style={s.accent && s.value > 0 ? { color: s.accent } : undefined}>
              {s.value}
            </p>
            {s.hint && <p className="text-[12px] text-muted">{s.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            Toutes · {orders.length}
          </Chip>
          {ORDER_STATUSES.map((s) => (
            <Chip key={s.value} active={filter === s.value} color={s.color} onClick={() => setFilter(s.value)}>
              {s.label} · {counts[s.value]}
            </Chip>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher : nom, téléphone, ville, réf…"
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[14px] outline-none focus:border-gold lg:w-80"
        />
      </div>

      {error && <p className="mt-4 text-[13px] text-[#a8322a]">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-muted">
            {orders.length === 0 ? "Aucune commande pour le moment." : "Aucune commande ne correspond à ce filtre."}
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {visible.map((o) => (
              <OrderRow
                key={o.ref}
                order={o}
                open={openRef === o.ref}
                onToggle={() => setOpenRef(openRef === o.ref ? null : o.ref)}
                onStatus={(status) => patch(o.ref, { status })}
                onNote={(note) => patch(o.ref, { note })}
                onDelete={() => remove(o)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  color,
  children,
  onClick,
}: {
  active: boolean;
  color?: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ${
        active ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white hover:border-ink/40"
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

function OrderRow({
  order: o,
  open,
  onToggle,
  onStatus,
  onNote,
  onDelete,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  onStatus: (s: OrderStatus) => void;
  onNote: (note: string) => void;
  onDelete: () => void;
}) {
  const status = STATUS[o.status];
  const wa = `https://wa.me/${whatsappNumber(o.phone)}?text=${encodeURIComponent(confirmMessage(o))}`;

  return (
    <li className={open ? "bg-bone/30" : ""}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 lg:grid-cols-[110px_1.3fr_1.2fr_1.4fr_90px_150px_32px]">
        <button type="button" onClick={onToggle} className="text-start text-[12px] text-muted lg:order-none">
          <span className="block">{dateFmt.format(new Date(o.createdAt))}</span>
          <span className="font-mono text-[11px]">{o.ref}</span>
        </button>

        <button type="button" onClick={onToggle} className="col-span-2 min-w-0 text-start lg:col-span-1">
          <span className="block truncate font-medium">{o.name}</span>
          <span className="block truncate text-[13px] text-muted">{o.city}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="font-mono text-[13px] hover:underline" dir="ltr">
            {o.phone}
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            title="Confirmer sur WhatsApp"
            className="rounded-md bg-[#25d366]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#128c4a] hover:bg-[#25d366]/25"
          >
            WhatsApp
          </a>
        </div>

        <button type="button" onClick={onToggle} className="min-w-0 text-start text-[13px]">
          <span className="block truncate">
            {o.qty > 1 && <strong>{o.qty} × </strong>}
            {o.product}
          </span>
          <span className="block truncate text-muted">
            {o.metal}
            {o.size ? ` · taille ${o.size}` : ""}
          </span>
        </button>

        <p className="font-medium tabular-nums">{o.total} DH</p>

        <select
          value={o.status}
          onChange={(e) => onStatus(e.target.value as OrderStatus)}
          className="rounded-lg border px-2 py-1.5 text-[13px] font-medium outline-none"
          style={{ borderColor: `${status.color}55`, color: status.color, background: `${status.color}10` }}
          aria-label="Statut"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Fermer" : "Détails"}
          className="hidden text-muted lg:block"
        >
          {open ? "▴" : "▾"}
        </button>
      </div>

      {open && (
        <div className="grid gap-5 border-t border-ink/10 px-4 py-4 lg:grid-cols-3">
          <div className="text-[14px]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Livraison</p>
            <p className="mt-1 font-medium">{o.name}</p>
            <p dir="auto">{o.address}</p>
            <p>{o.city}</p>
            <p className="mt-1 font-mono text-[13px]" dir="ltr">
              {o.phone}
            </p>
            {o.extra?.map((x, i) => (
              <p key={i} className="mt-1" dir="auto">
                <span className="text-muted">{x.label} :</span> {x.value}
              </p>
            ))}
          </div>
          <div className="text-[14px]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Commande</p>
            <p className="mt-1">
              {o.qty} × {o.product} — {o.metal}
              {o.size ? `, taille ${o.size}` : ""}
            </p>
            <p className="font-medium">{o.total} DH à encaisser à la livraison</p>
            {o.updatedAt && (
              <p className="mt-1 text-[12px] text-muted">Modifiée le {dateFmt.format(new Date(o.updatedAt))}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Note interne</p>
            <textarea
              defaultValue={o.note ?? ""}
              onBlur={(e) => e.target.value !== (o.note ?? "") && onNote(e.target.value)}
              rows={3}
              placeholder="Ex. : rappeler à 18h, client absent…"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[14px] outline-none focus:border-gold"
            />
            <div className="mt-2 flex justify-end">
              <Button variant="danger" onClick={onDelete}>
                Supprimer la commande
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
