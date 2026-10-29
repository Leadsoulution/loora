import { NextResponse } from "next/server";
import { checkPassword, endSession, isPasswordConfigured, startSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { error: "Définissez ADMIN_PASSWORD (8 caractères minimum) dans .env.local ou dans les variables d’environnement de l’hébergeur." },
      { status: 503 },
    );
  }
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) {
    // Petit délai pour freiner les essais en série
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await startSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
