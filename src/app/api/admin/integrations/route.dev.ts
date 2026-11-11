import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { DATA_DIR } from "@/lib/data-dir";
import { DEFAULT_INTEGRATIONS, type Integrations } from "@/lib/integrations";

// En local : réglages des connexions (en ligne : public/api/admin/integrations.php).
// L'export au format WooCommerce lu par dops n'existe qu'en ligne (public/api/wc.php).

const FILE = path.join(DATA_DIR, "settings.json");
const unauthorized = () => NextResponse.json({ error: "Non autorisé." }, { status: 401 });
const validUrl = (url: string) => url === "" || /^https?:\/\/\S+$/i.test(url);

async function load(): Promise<Integrations> {
  try {
    const saved = JSON.parse(await readFile(FILE, "utf8"));
    return {
      orderly: { ...DEFAULT_INTEGRATIONS.orderly, ...saved.orderly },
      dops: { ...DEFAULT_INTEGRATIONS.dops, ...saved.dops },
      webhook: String(saved.webhook ?? ""),
    };
  } catch {
    return structuredClone(DEFAULT_INTEGRATIONS);
  }
}

async function save(settings: Integrations) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}

function newKeys(settings: Integrations) {
  settings.dops.key = `ck_${randomBytes(20).toString("hex")}`;
  settings.dops.secret = `cs_${randomBytes(20).toString("hex")}`;
  return settings;
}

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return NextResponse.json(await load());
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const orderlyUrl = String(body.orderlyUrl ?? "").trim();
  const dopsWebhook = String(body.dopsWebhook ?? "").trim();
  const webhook = String(body.webhook ?? "").trim();
  const hookSecret = String(body.orderlyHookSecret ?? "").trim();
  if (!/^[\w-]*$/.test(hookSecret)) {
    return NextResponse.json(
      { error: "Le secret du webhook ne doit contenir que des lettres, des chiffres, _ ou -." },
      { status: 400 },
    );
  }
  if (!validUrl(orderlyUrl) || !validUrl(dopsWebhook) || !validUrl(webhook)) {
    return NextResponse.json({ error: "L'adresse doit commencer par https://" }, { status: 400 });
  }
  const settings = await load();
  settings.orderly.url = orderlyUrl;
  settings.orderly.hookSecret = hookSecret;
  settings.dops.enabled = !!body.dopsEnabled;
  settings.dops.webhook = dopsWebhook;
  settings.webhook = webhook;
  if (settings.dops.enabled && !settings.dops.key) newKeys(settings);
  return NextResponse.json(await save(settings));
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const { action } = await request.json().catch(() => ({}));
  const settings = await load();
  if (action === "regenerate") return NextResponse.json(await save(newKeys(settings)));
  if (action === "test-orderly") return testOrderly(settings);
  if (action !== "test") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

  if (!settings.dops.enabled || !settings.dops.webhook) {
    return NextResponse.json({
      ok: false,
      message: "Connexion dops désactivée ou adresse du webhook manquante.",
      settings,
    });
  }
  let ok = false;
  let message: string;
  try {
    const res = await fetch(settings.dops.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
      signal: AbortSignal.timeout(10000),
    });
    const reply = await res.json().catch(() => null);
    ok = res.ok && !reply?.error;
    message = reply?.error ? `dops : ${reply.error}` : res.ok ? "dops a bien reçu la notification." : `dops a répondu avec l'erreur ${res.status}.`;
  } catch {
    message = "dops injoignable.";
  }
  settings.dops[ok ? "lastSuccess" : "lastError"] = new Date().toISOString() + (ok ? "" : ` — ${message}`);
  return NextResponse.json({ ok, message, settings: await save(settings) });
}

/** Commande d'essai envoyée à Orderly (même contenu que public/api/admin/integrations.php) */
async function testOrderly(settings: Integrations) {
  if (!settings.orderly.url) {
    return NextResponse.json({ ok: false, message: "Adresse d'Orderly manquante.", settings });
  }
  let ok = false;
  let message: string;
  try {
    const res = await fetch(settings.orderly.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: `LO-TEST-${Date.now().toString(36).toUpperCase()}`,
        name: "Test LOORA",
        phone: "0612345678",
        city: "Casablanca",
        address: "Commande de test",
        product: "Test de connexion LOORA",
        quantity: 1,
        total: 0,
        note: "Commande de test envoyée depuis le dashboard LOORA : à supprimer.",
      }),
      signal: AbortSignal.timeout(10000),
    });
    const reply = await res.json().catch(() => null);
    ok = res.ok && !!reply?.ok;
    message = ok
      ? `Orderly a enregistré la commande${reply.reference ? ` (${reply.reference})` : ""}.`
      : reply?.error
        ? `Orderly : ${reply.error}`
        : `Orderly a répondu avec l'erreur ${res.status}.`;
  } catch {
    message = "Orderly injoignable.";
  }
  settings.orderly[ok ? "lastSuccess" : "lastError"] = `${new Date().toISOString()} — ${message}`;
  return NextResponse.json({ ok, message, settings: await save(settings) });
}
