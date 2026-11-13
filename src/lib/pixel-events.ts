"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- fonctions fbq / ttq fournies par Meta et TikTok */
import type { Pixels } from "./pixels";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    TiktokAnalyticsObject?: string;
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
}

/** Événement envoyé à tous les pixels démarrés */
function send(meta: string, tiktok: string, p: PixelProduct) {
  if (window.fbq) {
    window.fbq("track", meta, {
      content_ids: [p.id],
      content_name: p.name,
      content_type: "product",
      num_items: p.quantity,
      value: p.value,
      currency: "MAD",
    });
  }
  if (window.ttq) {
    window.ttq.track(tiktok, {
      contents: [{ content_id: p.id, content_name: p.name, quantity: p.quantity }],
      content_type: "product",
      value: p.value,
      currency: "MAD",
    });
  }
}

/** Visite d'une page produit */
export const trackViewContent = (p: PixelProduct) => send("ViewContent", "ViewContent", p);

// ---------------------------------------------------------------- Commande → page merci

const ORDER_KEY = "loora-last-order";

/** Garde la commande réussie le temps d'arriver sur la page merci, qui envoie l'achat */
export function rememberOrder(ref: string, p: PixelProduct) {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify({ ref, ...p }));
  } catch {}
}

/** Achat envoyé une seule fois par commande (pas de doublon si la page merci est rechargée) */
export function trackPurchase(ref: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ORDER_KEY) ?? "null");
    if (!saved || saved.ref !== ref || sessionStorage.getItem(`${ORDER_KEY}-${ref}`)) return;
    sessionStorage.setItem(`${ORDER_KEY}-${ref}`, "1");
    send("Purchase", "CompletePayment", saved);
  } catch {}
}
