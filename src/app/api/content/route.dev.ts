import { NextResponse } from "next/server";
import { readStore } from "@/lib/content";

// En local : contenu public lu par les pages produit (en ligne : public/api/content.php).
export async function GET() {
  return NextResponse.json(await readStore());
}
