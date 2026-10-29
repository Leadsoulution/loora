"use client";

import { useEffect, useState } from "react";
import { cleanStore, type Store } from "./content-types";

declare global {
  interface Window {
    /** Contenu injecté dans la page par public/api/page.php */
    __LOORA_STORE__?: unknown;
  }
}

/** Contenu du site, côté navigateur : injecté dans la page par le serveur PHP, sinon chargé depuis /api/content. */
export function useStore(): Store | null {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    if (window.__LOORA_STORE__) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- données déjà présentes dans la page
      setStore(cleanStore(window.__LOORA_STORE__));
      return;
    }
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((data) => alive && setStore(cleanStore(data)));
    return () => {
      alive = false;
    };
  }, []);

  return store;
}
