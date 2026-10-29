import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { CONTENT_TAG, readStore, saveStore } from "@/lib/content";
import { cleanStore } from "@/lib/content-types";

const unauthorized = () => NextResponse.json({ error: "Non autorisé." }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return NextResponse.json(await readStore());
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const store = cleanStore(body);
  await saveStore(store);
  // Les pages publiques relisent le contenu dès la prochaine visite
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return NextResponse.json(store);
}
