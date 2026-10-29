import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Authentification du dashboard : un mot de passe (ADMIN_PASSWORD dans .env.local)
// et un cookie httpOnly signé.

export const ADMIN_COOKIE = "loora_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function password() {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= 8 ? p : null;
}

function token(pass: string) {
  return createHmac("sha256", pass).update("loora-admin-session-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function isPasswordConfigured() {
  return password() !== null;
}

export function checkPassword(input: string) {
  const pass = password();
  return pass !== null && safeEqual(input, pass);
}

export async function startSession() {
  const pass = password();
  if (!pass) return;
  (await cookies()).set(ADMIN_COOKIE, token(pass), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const pass = password();
  if (!pass) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!value && safeEqual(value, token(pass));
}
