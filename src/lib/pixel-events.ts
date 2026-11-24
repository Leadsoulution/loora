"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- fonctions fbq / ttq fournies par Meta et TikTok */
import type { Pixels } from "./pixels";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    TiktokAnalyticsObject?: string;
    snaptr?: any;
    dataLayer?: unknown[];
    gtag?: any;
  }
}

export type PixelProduct = {
  /** Code article (SKU), sinon identifiant de la page */
  id: string;
  name: string;
  value: number;
  quantity: number;
};

let started = false;
/** Étiquettes de conversion Google Ads (AW-…/xxx) : l'achat leur est envoyé en plus */
let googleConversions: string[] = [];
/** Pixels Snapchat démarrés : ré-initialisés avec le téléphone du client au moment de l'achat */
let snapIds: string[] = [];

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Quand le navigateur est libre : les scripts publicitaires ne ralentissent pas l'affichage */
function whenIdle(run: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 1200);
}

/** File d'attente Meta (identique au code officiel) : les événements attendent le chargement du script */
function metaQueue() {
  if (window.fbq) return;
  const n: any = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  };
  window.fbq = n;
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
}

/** File d'attente TikTok (identique au code officiel) */
function tiktokQueue() {
  if (window.ttq) return;
  window.TiktokAnalyticsObject = "ttq";
  const ttq: any = [];
  window.ttq = ttq;
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = (target: any, method: string) => {
    target[method] = (...args: unknown[]) => target.push([method, ...args]);
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
  ttq.instance = (id: string) => {
    const e = ttq._i[id] || [];
    for (const m of ttq.methods) ttq.setAndDefer(e, m);
    return e;
  };
  ttq.load = (id: string, options?: object) => {
    const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._i[id]._u = url;
    ttq._t = ttq._t || {};
    ttq._t[id] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[id] = options || {};
    whenIdle(() => addScript(`${url}?sdkid=${id}&lib=ttq`));
  };
}

/** Démarre les pixels enregistrés (une seule fois par page) et compte la visite */
export function startPixels(pixels: Pixels | undefined) {
  if (started || !pixels || typeof window === "undefined") return;
  started = true;
  if (pixels.meta.length > 0) {
    metaQueue();
    for (const id of pixels.meta) window.fbq("init", id);
    window.fbq("track", "PageView");
    whenIdle(() => addScript("https://connect.facebook.net/en_US/fbevents.js"));
  }
  if (pixels.tiktok.length > 0) {
    tiktokQueue();
    for (const id of pixels.tiktok) window.ttq.load(id);
    window.ttq.page();
  }
  if (pixels.snap.length > 0) {
    snapQueue();
    // Pas d'e-mail : le formulaire de commande n'en demande pas
    snapIds = pixels.snap;
    for (const id of pixels.snap) window.snaptr("init", id);
    window.snaptr("track", "PAGE_VIEW");
    whenIdle(() => addScript("https://sc-static.net/scevent.min.js"));
  }
  if (pixels.google.length > 0) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- gtag attend l'objet arguments, comme dans le code officiel
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    const tags = [...new Set(pixels.google.map((id) => id.split("/")[0]))];
    for (const tag of tags) window.gtag("config", tag);
    googleConversions = pixels.google.filter((id) => id.includes("/"));
    whenIdle(() => addScript(`https://www.googletagmanager.com/gtag/js?id=${tags[0]}`));
  }
}

/** File d'attente Snapchat (identique au code officiel) */
function snapQueue() {
  if (window.snaptr) return;
  const a: any = function (...args: unknown[]) {
    if (a.handleRequest) a.handleRequest(...args);
    else a.queue.push(args);
  };
  a.queue = [];
  window.snaptr = a;
}

type PixelEvent = "view" | "cart" | "checkout" | "purchase";

/** Nom de l'événement chez chaque plateforme */
const NAMES: Record<PixelEvent, { meta: string; tiktok: string; snap: string; google: string }> = {
  view: { meta: "ViewContent", tiktok: "ViewContent", snap: "VIEW_CONTENT", google: "view_item" },
  cart: { meta: "AddToCart", tiktok: "AddToCart", snap: "ADD_CART", google: "add_to_cart" },
  checkout: { meta: "InitiateCheckout", tiktok: "InitiateCheckout", snap: "START_CHECKOUT", google: "begin_checkout" },
  purchase: { meta: "Purchase", tiktok: "CompletePayment", snap: "PURCHASE", google: "purchase" },
};

/** 0612345678 / +212612345678 / 00212612345678 → 212612345678 (format demandé par Snapchat) */
export function intlPhone(phone: string) {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("0")) p = `212${p.slice(1)}`;
  if (p.length === 9) p = `212${p}`;
  return /^212[5-7]\d{8}$/.test(p) ? p : "";
}

/** Événement envoyé à tous les pixels démarrés (ref = numéro de commande pour un achat) */
function send(event: PixelEvent, p: PixelProduct, ref?: string, phone?: string) {
  const name = NAMES[event];
  const purchase = event === "purchase";
  if (window.fbq) {
    window.fbq("track", name.meta, {
      content_ids: [p.id],
      content_name: p.name,
      content_type: "product",
      num_items: p.quantity,
      value: p.value,
      currency: "MAD",
    });
  }
  if (window.ttq) {
    window.ttq.track(name.tiktok, {
      contents: [{ content_id: p.id, content_name: p.name, quantity: p.quantity }],
      content_type: "product",
      value: p.value,
      currency: "MAD",
    });
  }
  if (window.snaptr) {
    // Achat : le pixel est ré-initialisé avec le téléphone du client (Snapchat le chiffre lui-même),
    // ce qui améliore la correspondance des commandes avec les comptes Snapchat
    const user = phone ? intlPhone(phone) : "";
    if (purchase && user) for (const id of snapIds) window.snaptr("init", id, { user_phone_number: user });
    window.snaptr("track", name.snap, {
      item_ids: [p.id],
      item_category: p.name,
      number_items: p.quantity,
      price: p.value,
      currency: "MAD",
      ...(ref ? { transaction_id: ref, client_dedup_id: ref } : {}),
    });
  }
  if (window.gtag) {
    const items = [{ item_id: p.id, item_name: p.name, quantity: p.quantity, price: Math.round(p.value / p.quantity) }];
    window.gtag("event", name.google, {
      currency: "MAD",
      value: p.value,
      items,
      ...(ref ? { transaction_id: ref } : {}),
    });
    if (purchase) {
      for (const sendTo of googleConversions) {
        window.gtag("event", "conversion", { send_to: sendTo, value: p.value, currency: "MAD", transaction_id: ref });
      }
    }
  }
}

/** Visite d'une page produit */
export const trackViewContent = (p: PixelProduct) => send("view", p);

/** Produit de la page affichée, pour l'ajout au panier et le début de commande */
let pageProduct: PixelProduct | null = null;
const sentOnce = new Set<PixelEvent>();

export function setPixelProduct(p: PixelProduct) {
  if (pageProduct?.id !== p.id) sentOnce.clear();
  pageProduct = p;
}

function once(event: PixelEvent) {
  if (!pageProduct || sentOnce.has(event)) return;
  sentOnce.add(event);
  send(event, pageProduct);
}

/** Clic sur « اطلب الآن » (bouton vers le formulaire, barre collante) : une fois par page */
export const trackAddToCart = () => once("cart");
/** Le client commence à remplir le formulaire : une fois par page */
export const trackStartCheckout = () => once("checkout");

// ---------------------------------------------------------------- Commande → page merci

const ORDER_KEY = "loora-last-order";

/** Garde la commande réussie le temps d'arriver sur la page merci, qui envoie l'achat */
export function rememberOrder(ref: string, p: PixelProduct, phone = "") {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify({ ref, ...p, phone }));
  } catch {}
}

/** Achat envoyé une seule fois par commande (pas de doublon si la page merci est rechargée) */
export function trackPurchase(ref: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ORDER_KEY) ?? "null");
    if (!saved || saved.ref !== ref || sessionStorage.getItem(`${ORDER_KEY}-${ref}`)) return;
    sessionStorage.setItem(`${ORDER_KEY}-${ref}`, "1");
    const { phone, ...product } = saved;
    send("purchase", product, ref, phone);
    // Le téléphone ne reste pas dans le navigateur une fois l'achat envoyé
    sessionStorage.setItem(ORDER_KEY, JSON.stringify({ ...product, ref }));
  } catch {}
}
