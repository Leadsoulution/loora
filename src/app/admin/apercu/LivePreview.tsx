"use client";

import { useEffect, useState } from "react";
import { LogoHeader } from "@/components/LogoHeader";
import { ProductBody } from "@/components/product/ProductPage";
import type { Store } from "@/lib/content-types";
import { getProduct } from "@/lib/products";

export type PreviewTarget = { page: "product"; slug: string };
export type PreviewMessage = { type: "loora-preview"; target: PreviewTarget; store: Store };

/** Affiche une fiche produit avec les données non enregistrées envoyées par le dashboard. */
export function LivePreview() {
  const [data, setData] = useState<PreviewMessage | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.data?.type !== "loora-preview") return;
      setData(e.data as PreviewMessage);
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "loora-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const product = data && getProduct(data.target.slug);
  if (!data || !product) return <p className="p-10 text-center text-muted">Chargement de l&apos;aperçu…</p>;

  return (
    <>
      <LogoHeader logo={data.store.logo} />
      <ProductBody
        key={product.slug}
        product={product}
        content={data.store.products[product.slug]}
        theme={data.store.theme}
      />
    </>
  );
}
