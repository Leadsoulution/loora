import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product/ProductPage";
import { getProduct, PRODUCTS } from "@/lib/products";

// Page HTML générée pour chaque produit ; le contenu (textes, prix, images) est chargé dans le navigateur.
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return product ? { title: product.name } : {};
}

export default async function Page({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  return <ProductPage slug={slug} />;
}
