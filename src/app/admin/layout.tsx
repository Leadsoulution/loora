import { Bodoni_Moda, Jost } from "next/font/google";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className={`${bodoni.variable} ${jost.variable} admin-fonts flex min-h-full flex-1 flex-col`}>{children}</div>;
}
