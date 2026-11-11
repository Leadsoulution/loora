"use client";

import { useEffect, useState } from "react";
import { DEFAULT_INTEGRATIONS, type Integrations } from "@/lib/integrations";
import { Button, Field, Input } from "./ui";

const API = "/api/admin/integrations";

/** « 29/10/2026 18:42 — message » à partir d'une date ISO suivie d'un message éventuel */
function formatStatus(value: string) {
  const [iso, ...rest] = value.split(" — ");
  const date = new Date(iso);
  const when = Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Casablanca" });
  return [when, ...rest].join(" — ");
}

/** Relie les commandes du site à d'autres applications : Orderly (formulaire web), dops/WooCommerce, webhook. */
export function IntegrationsPanel() {
  const [saved, setSaved] = useState<Integrations | null>(null);
  const [orderlyUrl, setOrderlyUrl] = useState("");
  const [dopsEnabled, setDopsEnabled] = useState(false);
  const [dopsWebhook, setDopsWebhook] = useState("");
  const [webhook, setWebhook] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  function apply(settings: Integrations) {
    setSaved(settings);
    setOrderlyUrl(settings.orderly.url);
    setDopsEnabled(settings.dops.enabled);
    setDopsWebhook(settings.dops.webhook);
    setWebhook(settings.webhook);
  }

  useEffect(() => {
    fetch(API, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : DEFAULT_INTEGRATIONS))
      .catch(() => DEFAULT_INTEGRATIONS)
      .then(apply);
  }, []);

  async function call(label: string, init: RequestInit) {
    setBusy(label);
    setNotice(null);
    try {
      const res = await fetch(API, { ...init, headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "L'opération a échoué. Réessayez.");
      return data;
    } catch (e) {
      setNotice({ ok: false, text: (e as Error).message });
      return null;
    } finally {
      setBusy("");
    }
  }

  async function save() {
    const data = await call("save", { method: "PUT", body: JSON.stringify({ orderlyUrl, dopsEnabled, dopsWebhook, webhook }) });
    if (data) {
      apply(data);
      setNotice({ ok: true, text: "Connexions enregistrées ✓" });
    }
  }

  async function regenerate() {
    if (!confirm("Créer de nouvelles clés ? Les anciennes ne marcheront plus : il faudra coller les nouvelles dans dops.")) {
      return;
    }
    const data = await call("regenerate", { method: "POST", body: JSON.stringify({ action: "regenerate" }) });
    if (data) {
      apply(data);
      setNotice({ ok: true, text: "Nouvelles clés créées. Collez-les dans dops." });
    }
  }

  async function testOrderly() {
    if (!confirm("Envoyer une commande de test « Test LOORA » à Orderly ? Elle y sera créée : pensez à la supprimer ensuite.")) {
      return;
    }
    const data = await call("test-orderly", { method: "POST", body: JSON.stringify({ action: "test-orderly" }) });
    if (data) {
      apply(data.settings);
      setNotice({ ok: data.ok, text: data.message });
    }
  }

  async function test() {
    const data = await call("test", { method: "POST", body: JSON.stringify({ action: "test" }) });
    if (data) {
      apply(data.settings);
      setNotice({ ok: data.ok, text: data.message });
    }
  }

  if (!saved) return <p className="p-16 text-center text-muted">Chargement…</p>;

  const dirty =
    orderlyUrl !== saved.orderly.url ||
    dopsEnabled !== saved.dops.enabled || dopsWebhook !== saved.dops.webhook || webhook !== saved.webhook;
  const site = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl">Connexions</h1>
      <p className="mt-1 text-sm text-muted">Envoyez automatiquement les commandes du site vers vos autres applications.</p>

      {/* ------------------------------------------------ Orderly : formulaire web */}
      <section className="mt-6 space-y-5 rounded-xl border border-ink/10 bg-white p-5">
        <div>
          <h2 className="font-display text-2xl">Orderly — formulaire web</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Chaque commande du site part toute seule dans Orderly, envoyée par le serveur LOORA : nom, téléphone, ville,
            adresse, produit, quantité et montant. La note reste vide pour votre service de confirmation.
          </p>
        </div>
        <Field
          label="Adresse avec la clé incluse"
          hint="Dans Orderly → Connecter un site web, copiez « Adresse avec la clé incluse » et collez-la ici. Vide = désactivé."
        >
          <Input
            value={orderlyUrl}
            onChange={(v) => setOrderlyUrl(v.trim())}
            placeholder="https://orderly.host/api/forms/order?key=…"
            type="url"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={testOrderly} disabled={!!busy || dirty || !saved.orderly.url}>
            {busy === "test-orderly" ? "Envoi…" : "Envoyer une commande de test"}
          </Button>
          {dirty && <span className="text-[12px] text-muted">Enregistrez avant de tester.</span>}
        </div>
        <Status success={saved.orderly.lastSuccess} error={saved.orderly.lastError} />
        {saved.orderly.url && saved.dops.enabled && (
          <p className="rounded-lg bg-[#fff6e5] px-3 py-2 text-[12px] text-[#8a5a00]">
            La méthode WooCommerce ci-dessous est aussi activée : désactivez-la pour ne pas recevoir chaque commande en
            double dans Orderly.
          </p>
        )}
      </section>

      {/* ------------------------------------------------ dops : ancienne méthode WooCommerce */}
      <details className="mt-6 rounded-xl border border-ink/10 bg-white p-5" open={saved.dops.enabled}>
        <summary className="cursor-pointer text-[13px] font-medium text-muted">
          Autre méthode : Orderly via WooCommerce {saved.dops.enabled ? "(activée)" : "(désactivée)"}
        </summary>
        <section className="mt-4 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">dops (Orderly) — WooCommerce</h2>
              <p className="mt-0.5 text-[13px] text-muted">
                dops voit LOORA comme une boutique WooCommerce : chaque commande y arrive toute seule, avec le nom, le
                téléphone, la ville, l&apos;adresse, le produit et le montant.
              </p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] font-medium">
              <input
                type="checkbox"
                checked={dopsEnabled}
                onChange={(e) => setDopsEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#1e1914]"
              />
              Activée
            </label>
          </div>

          {saved.dops.key ? (
            <div className="space-y-3 rounded-lg border border-ink/10 bg-bone/30 p-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
                1. Dans dops → Intégrations → WooCommerce, collez :
              </p>
              <CopyRow label="Adresse de la boutique" value={site} />
              <CopyRow label="Clé client" value={saved.dops.key} />
              <CopyRow label="Clé secrète" value={saved.dops.secret} />
              <Button variant="ghost" onClick={regenerate} disabled={!!busy}>
                ↻ Créer de nouvelles clés
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-ink/20 p-4 text-[13px] text-muted">
              Cochez « Activée » puis enregistrez : la clé client et la clé secrète à coller dans dops apparaîtront ici.
            </p>
          )}

          <Field
            label="2. Adresse du webhook de dops"
            hint="Pour que chaque commande arrive dans dops tout de suite. L'adresse de votre dops suivie de /api/woocommerce/webhook"
          >
            <Input
              value={dopsWebhook}
              onChange={setDopsWebhook}
              placeholder="https://votre-dops.com/api/woocommerce/webhook"
              type="url"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={test} disabled={!!busy || dirty || !saved.dops.enabled || !saved.dops.webhook}>
              {busy === "test" ? "Envoi…" : "3. Tester la connexion"}
            </Button>
            {dirty && <span className="text-[12px] text-muted">Enregistrez avant de tester.</span>}
          </div>

          <Status success={saved.dops.lastSuccess} error={saved.dops.lastError} />
        </section>
      </details>

      {/* ------------------------------------------------ Webhook générique */}
      <section className="mt-6 space-y-4 rounded-xl border border-ink/10 bg-white p-5">
        <div>
          <h2 className="font-display text-2xl">Autre application (webhook)</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Google Sheets (Apps Script), Make, Zapier, n8n… reçoit chaque nouvelle commande en JSON, en POST.
          </p>
        </div>
        <Field label="Adresse du webhook" hint="Vide = désactivé">
          <Input value={webhook} onChange={setWebhook} placeholder="https://…" type="url" />
        </Field>
      </section>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={!!busy || !dirty}>
          {busy === "save" ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {notice && (
          <p className={`text-[13px] ${notice.ok ? "text-[#2f855a]" : "text-[#a8322a]"}`} role="status">
            {notice.text}
          </p>
        )}
      </div>
    </div>
  );
}

/** Dernier envoi réussi / dernière erreur */
function Status({ success, error }: { success: string; error: string }) {
  if (!success && !error) return null;
  return (
    <div className="space-y-1 text-[12px]">
      {success && <p className="text-[#2f855a]">✓ Dernier envoi réussi : {formatStatus(success)}</p>}
      {error && <p className="text-[#a8322a]">✕ Dernière erreur : {formatStatus(error)}</p>}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1 text-[12px] text-muted">{label}</p>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-ink/15 bg-white px-3 py-2 font-mono text-[13px]">
          {value}
        </code>
        <Button
          onClick={() =>
            navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
        >
          {copied ? "Copié ✓" : "Copier"}
        </Button>
      </div>
    </div>
  );
}
