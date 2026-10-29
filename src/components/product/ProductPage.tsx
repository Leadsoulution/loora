"use client";

import { useEffect } from "react";
import { LogoHeader } from "@/components/LogoHeader";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/use-store";
import { ProductView } from "./ProductView";

/** Fiche produit complète (en-tête + fiche), affichée avec le contenu enregistré dans le dashboard. */
export function ProductPage({ slug }: { slug: string }) {
  const store = useStore();
  const product = getProduct(slug);
  const content = store?.products[slug];

  useEffect(() => {
    if (content) document.title = `${content.type} ${content.name} · LOORA`;
  }, [content]);

  if (!store || !product || !content) return <div className="min-h-screen flex-1 bg-white" />;

  return (
    <>
      <LogoHeader logo={store.logo} />
      <main className="flex-1 bg-white">
        <ProductView product={product} content={content} theme={store.theme} />
      </main>
    </>
  );
}
