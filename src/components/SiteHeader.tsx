"use client";

import { useStore } from "@/lib/use-store";
import { LogoHeader } from "./LogoHeader";

/** En-tête du site avec le logo enregistré dans le dashboard. */
export function SiteHeader() {
  const store = useStore();
  return store ? <LogoHeader logo={store.logo} /> : <div className="h-14" />;
}
