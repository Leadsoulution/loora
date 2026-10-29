"use client";

import { useEffect, useRef, useState } from "react";
import type { Store } from "@/lib/content-types";
import type { PreviewTarget } from "./apercu/LivePreview";

const DESKTOP_WIDTH = 1280;

/** Aperçu en direct d'une page du site dans une iframe, mis à jour à chaque frappe. */
export function Preview({
  store,
  target,
  choices,
  onTarget,
}: {
  store: Store;
  target: PreviewTarget;
  /** Pages proposées dans le sélecteur (facultatif) */
  choices?: { label: string; target: PreviewTarget }[];
  onTarget?: (t: PreviewTarget) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [size, setSize] = useState({ width: 600, height: 800 });

  // Envoie les données à l'iframe à chaque changement (et quand elle est prête)
  useEffect(() => {
    const send = () =>
      frame.current?.contentWindow?.postMessage({ type: "loora-preview", target, store }, window.location.origin);
    send();
    function onMessage(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === "loora-preview-ready") send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [target, store]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const width = mode === "desktop" ? DESKTOP_WIDTH : 390;
  const scale = Math.min(1, size.width / width);
  // L'iframe remplit la hauteur du cadre et défile à l'intérieur
  const height = size.height / scale;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Aperçu en direct</p>
          {choices && onTarget && (
            <select
              value={choices.findIndex((c) => JSON.stringify(c.target) === JSON.stringify(target))}
              onChange={(e) => onTarget(choices[Number(e.target.value)].target)}
              className="rounded-lg border border-ink/15 bg-white px-2 py-1 text-[12px]"
            >
              {choices.map((c, i) => (
                <option key={i} value={i}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex rounded-lg border border-ink/15 bg-white p-0.5 text-[12px]">
          {(["mobile", "desktop"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 transition ${mode === m ? "bg-ink text-ivory" : "text-muted"}`}
            >
              {m === "mobile" ? "Mobile" : "Ordinateur"}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="flex min-h-0 flex-1 justify-center overflow-hidden rounded-xl border border-ink/10 bg-bone/60">
        <div style={{ width: width * scale, height: height * scale }} className="shrink-0">
          <iframe
            ref={frame}
            src="/admin/apercu"
            title="Aperçu du site"
            style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
}
