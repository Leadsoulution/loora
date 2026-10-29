"use client";

import { useEffect } from "react";
import { LogoHeader } from "@/components/LogoHeader";
import type { Logo, ProductContent, Theme } from "@/lib/content-types";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/use-store";
import { ProductView } from "./ProductView";

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
        <ProductView product={product} content={data.content} theme={data.theme} />
      </main>
    </>
  );
}
