"use client";

import { useEffect } from "react";
import { LogoHeader } from "@/components/LogoHeader";
import type { Logo, ProductContent, Theme } from "@/lib/content-types";
import { captureAttribution } from "@/lib/attribution";
import { setPixelProduct, startPixels, trackStartCheckout, trackViewContent } from "@/lib/pixel-events";
import type { Pixels } from "@/lib/pixels";
import { getProduct, type Product } from "@/lib/products";
import { useStore } from "@/lib/use-store";
import { ProductView } from "./ProductView";
import { MoodView } from "./mood/MoodView";
import { LuxeView } from "./luxe/LuxeView";
import { OnyxView } from "./onyx/OnyxView";
import { RoseView } from "./rose/RoseView";

export type ProductPageData = { logo: Logo; theme: Theme; content: ProductContent; pixels: Pixels };

/**
 * Fiche produit complète (en-tête + fiche).
 * `initial` : contenu écrit dans la page HTML à la compilation (affichage immédiat) ;
 * sans lui, le contenu enregistré est lu dans le navigateur.
 */
export function ProductPage({ slug, initial }: { slug: string; initial?: ProductPageData }) {
  const store = useStore(!initial);
  const product = getProduct(slug);
  const data = initial ?? (store && { logo: store.logo, theme: store.theme, content: store.products[slug], pixels: store.pixels });

  const title = data?.content && `${data.content.type} ${data.content.name} · LOORA`;
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  // D'où vient le client (publicité, site, direct) : envoyé avec sa commande
  useEffect(() => captureAttribution(), []);

  // Pixels publicitaires : visite de la page puis consultation du produit
  const content = data?.content;
  const pixels = data?.pixels;
  useEffect(() => {
    if (!content || !pixels) return;
    startPixels(pixels);
    const item = { id: content.sku || slug, name: `${content.type} ${content.name}`, value: content.price, quantity: 1 };
    setPixelProduct(item);
    trackViewContent(item);
    // Début de commande : le client clique dans une case du formulaire (une fois par page)
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("form") && el.matches("input:not([name=website]), textarea")) trackStartCheckout();
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [content, pixels, slug]);

  if (!data?.content || !product) return <div className="min-h-screen flex-1 bg-white" />;

  return (
    <>
      <LogoHeader logo={data.logo} />
      <main className="flex-1 bg-white">
        <ProductBody product={product} content={data.content} theme={data.theme} />
      </main>
    </>
  );
}

/** Corps de la fiche selon le design choisi dans le dashboard */
export function ProductBody({ product, content, theme }: { product: Product; content: ProductContent; theme: Theme }) {
  if (content.design === "luxe") return <LuxeView product={product} content={content} />;
  if (content.design === "onyx") return <OnyxView product={product} content={content} />;
  if (content.design === "mood") return <MoodView product={product} content={content} />;
  return content.design === "rose" ? (
    <RoseView product={product} content={content} />
  ) : (
    <ProductView product={product} content={content} theme={theme} />
  );
}
