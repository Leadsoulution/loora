"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Media } from "@/components/Media";
import { cleanStore, type Store } from "@/lib/content-types";
import { CATEGORY_LABEL, formatPrice, PRODUCTS } from "@/lib/products";
import type { PreviewTarget } from "./apercu/LivePreview";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { OrdersPanel } from "./OrdersPanel";
import { PixelsPanel } from "./PixelsPanel";
import { Preview } from "./Preview";
import { ProductEditor } from "./ProductEditor";
import { LogoEditor } from "./LogoEditor";
import { ThemeEditor } from "./ThemeEditor";
import { Button } from "./ui";

type View =
  | { page: "orders" }
  | { page: "products" }
  | { page: "edit"; slug: string }
  | { page: "theme" }
  | { page: "integrations" }
  | { page: "pixels" };

const THEME_PREVIEWS: { label: string; target: PreviewTarget }[] = PRODUCTS.map((p) => ({
  label: p.name,
  target: { page: "product", slug: p.slug },
}));

export function AdminApp() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [saved, setSaved] = useState<Store | null>(null);
  const [draft, setDraft] = useState<Store | null>(null);
  const [view, setView] = useState<View>({ page: "orders" });
  const [themePreview, setThemePreview] = useState<PreviewTarget>(THEME_PREVIEWS[0].target);
  const [pending, setPending] = useState(0);
  const onPending = useCallback((n: number) => setPending(n), []);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);

  async function load() {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) return setAuth("out");
    const store = cleanStore(await res.json());
    setSaved(store);
    setDraft(store);
    setAuth("in");
    // Nombre de commandes à confirmer (pastille du menu)
    const orders = await fetch("/api/admin/orders", { cache: "no-store" }).then((r) => (r.ok ? r.json() : []));
    setPending(orders.filter((o: { status: string }) => o.status === "a_confirmer").length);
  }

  useEffect(() => {
    // Chargement initial du contenu (ou affichage de la connexion)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  // Prévenir avant de quitter avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Nettoyé ici : le serveur PHP enregistre tel quel
        body: JSON.stringify(cleanStore(draft)),
      });
      if (res.status === 401) return setAuth("out");
      if (!res.ok) throw new Error();
      const store = cleanStore(await res.json());
      setSaved(store);
      setDraft(store);
      setNotice({ type: "ok", text: "Modifications enregistrées et publiées ✓" });
    } catch {
      setNotice({ type: "error", text: "L'enregistrement a échoué. Réessayez." });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (dirty && !confirm("Des modifications ne sont pas enregistrées. Se déconnecter quand même ?")) return;
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuth("out");
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0 });
  }

  if (auth === "checking") return <p className="p-16 text-center text-muted">Chargement…</p>;
  if (auth === "out") return <Login onSuccess={load} />;
  if (!draft) return null;

  const editing = view.page === "edit" ? PRODUCTS.find((p) => p.slug === view.slug) : null;
  const previewTarget: PreviewTarget = view.page === "edit" ? { page: "product", slug: view.slug } : themePreview;

  return (
    <div className="min-h-screen bg-[#f3efe8]">
      {/* Barre du haut */}
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <span className="font-display text-lg tracking-[0.35em]">LOORA</span>
          <span className="hidden text-[12px] uppercase tracking-[0.15em] text-muted sm:inline">Dashboard</span>
          <nav className="flex gap-1 text-[13px]">
            <NavButton active={view.page === "orders"} onClick={() => navigate({ page: "orders" })}>
              Commandes
              {pending > 0 && (
                <span className="ml-1.5 rounded-full bg-[#c93b3b] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {pending}
                </span>
              )}
            </NavButton>
            <NavButton
              active={view.page === "products" || view.page === "edit"}
              onClick={() => navigate({ page: "products" })}
            >
              Pages produit
            </NavButton>
            <NavButton active={view.page === "theme"} onClick={() => navigate({ page: "theme" })}>
              Logo & couleurs
            </NavButton>
            <NavButton active={view.page === "pixels"} onClick={() => navigate({ page: "pixels" })}>
              Pixels
            </NavButton>
            <NavButton active={view.page === "integrations"} onClick={() => navigate({ page: "integrations" })}>
              Connexions
            </NavButton>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden text-[13px] text-muted hover:text-ink sm:inline">
              Voir le site ↗
            </Link>
            <Button variant="ghost" onClick={logout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 pb-32 pt-6 sm:px-6">
        {view.page === "orders" && saved && <OrdersPanel onPending={onPending} store={saved} />}
        {view.page === "integrations" && <IntegrationsPanel />}
        {view.page === "pixels" && <PixelsPanel pixels={draft.pixels} onChange={(pixels) => setDraft({ ...draft, pixels })} />}
        {view.page === "products" && <ProductList store={draft} onEdit={(slug) => navigate({ page: "edit", slug })} />}

        {(view.page === "theme" || editing) && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
            <div>
              {editing && view.page === "edit" ? (
                <>
                  <div className="mb-5 flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate({ page: "products" })}>
                      ← Produits
                    </Button>
                    <h1 className="font-display text-3xl">{draft.products[view.slug].name}</h1>
                    <Link
                      href={`/produit/${view.slug}/`}
                      target="_blank"
                      className="ml-auto text-[13px] text-muted hover:text-ink"
                    >
                      Page publiée ↗
                    </Link>
                  </div>
                  <ProductEditor
                    product={editing}
                    value={draft.products[view.slug]}
                    onChange={(content) =>
                      setDraft({ ...draft, products: { ...draft.products, [view.slug]: content } })
                    }
                  />
                </>
              ) : (
                <>
                  <h1 className="mb-5 font-display text-3xl">Logo & couleurs</h1>
                  <div className="space-y-5">
                    <LogoEditor logo={draft.logo} onChange={(logo) => setDraft({ ...draft, logo })} />
                    <ThemeEditor theme={draft.theme} onChange={(theme) => setDraft({ ...draft, theme })} />
                  </div>
                </>
              )}
            </div>
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
              <div className="h-[80vh] lg:h-full">
                <Preview
                  store={draft}
                  target={previewTarget}
                  choices={view.page === "theme" ? THEME_PREVIEWS : undefined}
                  onTarget={setThemePreview}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barre d'enregistrement */}
      {(dirty || notice) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
            {notice ? (
              <p className={`text-[14px] ${notice.type === "ok" ? "text-[#3F6B4A]" : "text-[#a8322a]"}`}>{notice.text}</p>
            ) : (
              <p className="text-[14px]">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold" />
                Modifications non enregistrées
              </p>
            )}
            {dirty && (
              <div className="ml-auto flex gap-2">
                <Button
                  onClick={() => {
                    if (confirm("Annuler toutes les modifications non enregistrées ?")) setDraft(saved);
                  }}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button variant="primary" onClick={save} disabled={saving} className="px-6">
                  {saving ? "Enregistrement…" : "Enregistrer et publier"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, ...props }: { active: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg px-3 py-1.5 transition ${active ? "bg-ink text-ivory" : "text-muted hover:text-ink"}`}
      {...props}
    />
  );
}

function ProductList({ store, onEdit }: { store: Store; onEdit: (slug: string) => void }) {
  return (
    <>
      <h1 className="font-display text-4xl">Pages produit</h1>
      <p className="mt-1 text-sm text-muted">Choisissez une fiche produit à modifier : textes, prix, photos et sections.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => {
          const c = store.products[p.slug];
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onEdit(p.slug)}
              className="group overflow-hidden rounded-xl border border-ink/10 bg-white text-start transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-bone">
                <Media src={c.images[0] ?? "jewel"} art={p} className="absolute inset-0 h-full w-full" />
              </div>
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
                  {CATEGORY_LABEL[p.category]}
                </p>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="text-sm tabular-nums">{formatPrice(c.price)}</p>
                </div>
                <p className="mt-2 text-[12px] text-muted">
                  {c.images.length} image{c.images.length > 1 ? "s" : ""} · {c.sections.length} sections
                </p>
                <p className="mt-3 text-[13px] font-medium text-gold group-hover:underline">Modifier →</p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) return onSuccess();
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Connexion impossible.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3efe8] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <p className="text-center font-display text-3xl tracking-[0.35em]">LOORA</p>
        <p className="mt-1 text-center text-[12px] uppercase tracking-[0.2em] text-muted">Dashboard</p>
        <label className="mt-8 block">
          <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Mot de passe</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2.5 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </label>
        {error && <p className="mt-3 text-[13px] text-[#a8322a]">{error}</p>}
        <button type="submit" disabled={busy || !password} className="btn-primary mt-6 w-full disabled:opacity-50">
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
