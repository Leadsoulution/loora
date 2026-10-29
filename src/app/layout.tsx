import type { Metadata } from "next";
import { Bodoni_Moda, Cairo, Jost } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

// Police des fiches produit en arabe
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
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
    <html lang="fr" className={`${bodoni.variable} ${jost.variable} ${cairo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
