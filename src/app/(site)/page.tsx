import { redirect } from "next/navigation";
import { PRODUCTS } from "@/lib/products";

// Pas de page d'accueil : on envoie directement vers le premier produit.
export default function Home() {
  redirect(`/produit/${PRODUCTS[0].slug}`);
}
