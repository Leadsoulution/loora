import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

// Police des fiches produit en arabe (police variable : un seul fichier pour toutes les graisses).
// Les polices du dashboard sont chargées dans app/admin/layout.tsx.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LOORA — Bijoux fins faits main",
    template: "%s · LOORA",
  },
  description:
    "LOORA, maison de bijoux fins : bagues, colliers, boucles d'oreilles et bracelets en or 18 carats et argent massif, façonnés à la main.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${cairo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
