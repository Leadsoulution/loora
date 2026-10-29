import type { Metadata } from "next";
import { LivePreview } from "./LivePreview";

export const metadata: Metadata = { title: "Aperçu", robots: { index: false } };

export default function PreviewPage() {
  return <LivePreview />;
}
