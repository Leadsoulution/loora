import { PRODUCTS } from "@/lib/products";

// Pas de page d'accueil : on envoie directement vers le premier produit
// (en ligne, le .htaccess redirige déjà avant d'arriver ici).
export default function Home() {
  return <meta httpEquiv="refresh" content={`0;url=/produit/${PRODUCTS[0].slug}/`} />;
}
