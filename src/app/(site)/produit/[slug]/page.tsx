import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product/ProductPage";
import { getPageStore } from "@/lib/content";
import { getProduct, PRODUCTS } from "@/lib/products";

// Page HTML complète générée pour chaque produit avec le contenu en ligne au moment de la compilation.
// Si le contenu a changé depuis, public/api/page.php sert la version /s/<slug>/ à la place.
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const content = (await getPageStore()).products[slug];
  return content ? { title: `${content.type} ${content.name}`, description: content.description } : {};
}

export default async function Page({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  const { logo, theme, products } = await getPageStore();
  return <ProductPage slug={slug} initial={{ logo, theme, content: products[slug] }} />;
}
