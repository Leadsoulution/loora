import type { Metadata } from "next";
import { ThankYou } from "@/components/thankyou/ThankYou";

// Page de remerciement : le formulaire de commande y envoie le client après une commande réussie.
export const metadata: Metadata = { title: "شكراً على طلبك", robots: { index: false } };

export default function Page() {
  return <ThankYou />;
}
