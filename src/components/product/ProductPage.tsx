"use client";

import { useEffect } from "react";
import { LogoHeader } from "@/components/LogoHeader";
import type { Logo, ProductContent, Theme } from "@/lib/content-types";
import { getProduct, type Product } from "@/lib/products";
import { useStore } from "@/lib/use-store";
import { ProductView } from "./ProductView";
import { MoodView } from "./mood/MoodView";
import { RoseView } from "./rose/RoseView";

export type ProductPageData = { logo: Logo; theme: Theme; content: ProductContent };

/**
 * Fiche produit complète (en-tête + fiche).
 * `initial` : contenu écrit dans la page HTML à la compilation (affichage immédiat) ;
 * sans lui, le contenu enregistré est lu dans le navigateur.
 */
export function ProductPage({ slug, initial }: { slug: string; initial?: ProductPageData }) {
  const store = useStore(!initial);
  const product = getProduct(slug);
  const data = initial ?? (store && { logo: store.logo, theme: store.theme, content: store.products[slug] });

  const title = data?.content && `${data.content.type} ${data.content.name} · LOORA`;
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

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
  if (content.design === "mood") return <MoodView product={product} content={content} />;
  return content.design === "rose" ? (
    <RoseView product={product} content={content} />
  ) : (
    <ProductView product={product} content={content} theme={theme} />
  );
}
