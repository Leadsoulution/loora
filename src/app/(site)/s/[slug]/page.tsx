import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product/ProductPage";
import { getProduct, PRODUCTS } from "@/lib/products";

// Version « sans contenu » d'une fiche produit : public/api/page.php la sert avec le contenu enregistré
// injecté dans la page quand celui-ci a changé depuis la dernière compilation.
export const dynamicParams = false;
export const metadata: Metadata = { robots: { index: false } };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function Page({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  return <ProductPage slug={slug} />;
}
