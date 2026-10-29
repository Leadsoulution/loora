"use client";

import { useRef, useState } from "react";
import { Media } from "@/components/Media";
import { JEWEL_IMAGES } from "@/lib/content-types";
import type { Category, Metal, Stone } from "@/lib/products";

export type Art = { category: Category; metal: Metal; stone: Stone };

export const JEWEL_LABELS: Record<string, string> = {
  jewel: "Illustration",
  "jewel:zoom": "Illustration (zoom)",
  "jewel:dark": "Illustration (fond sombre)",
  "jewel:zoom-dark": "Illustration (zoom, sombre)",
  "jewel:macro": "Illustration (gros plan)",
};

/** Redimensionne une image dans le navigateur (WebP), ou null si le navigateur ne sait pas encoder en WebP */
async function toWebp(bitmap: ImageBitmap, max: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  return blob?.type === "image/webp" ? blob : null;
}

/**
 * Envoie une image : compressée en WebP (1600 px max) avec ses variantes 800 px et 240 px,
 * pour des pages rapides sur téléphone. GIF et navigateurs sans WebP : envoyée telle quelle.
 */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  let main: Blob = file;
  if (file.type !== "image/gif") {
    try {
      const bitmap = await createImageBitmap(file);
      const [full, medium, thumb] = [
        await toWebp(bitmap, 1600, 0.82),
        await toWebp(bitmap, 800, 0.78),
        await toWebp(bitmap, 240, 0.7),
      ];
      bitmap.close();
      if (full && medium && thumb) {
        // On garde l'original s'il est déjà plus léger et dans un format accepté
        if (full.size < file.size || !/^image\/(jpeg|png|webp|avif)$/.test(file.type)) main = full;
        body.append("medium", medium, "medium.webp");
        body.append("thumb", thumb, "thumb.webp");
      }
    } catch {}
  }
  body.append("file", main, main === file ? file.name : "image.webp");
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi de l'image.");
  return data.url;
}

export function Field({
  label,
  hint,
  children,
  className = "",
  group = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  /** true pour un groupe de boutons : pas de <label>, sinon un clic sur le titre active le premier bouton */
  group?: boolean;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={`block ${className}`}>
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted/80">{hint}</span>}
    </Tag>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-[15px] text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20";

export function Input({
  value,
  onChange,
  rtl,
  type = "text",
  ...rest
}: {
  value: string | number;
  onChange: (value: string) => void;
  rtl?: boolean;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir={rtl ? "rtl" : undefined}
      className={`${inputClass} ${rtl ? "font-[family-name:var(--font-cairo)]" : ""}`}
      {...rest}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rtl,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  rtl?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      dir={rtl ? "rtl" : undefined}
      className={`${inputClass} resize-y leading-relaxed ${rtl ? "font-[family-name:var(--font-cairo)]" : ""}`}
    />
  );
}

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: { variant?: "primary" | "secondary" | "danger" | "ghost" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-ink text-ivory hover:bg-gold disabled:opacity-50",
    secondary: "border border-ink/15 bg-white text-ink hover:border-ink/40",
    danger: "border border-[#c93b3b]/30 bg-white text-[#a8322a] hover:bg-[#fff1f0]",
    ghost: "text-muted hover:bg-ink/5 hover:text-ink",
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition ${styles} ${className}`}
      {...props}
    />
  );
}

/** Choix d'une image : envoi d'une photo, illustration, ou aucune. */
export function ImagePicker({
  value,
  onChange,
  art,
  allowEmpty = true,
}: {
  value: string;
  onChange: (value: string) => void;
  art: Art;
  allowEmpty?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex gap-4">
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-bone">
        {value ? (
          <Media src={value} art={art} className="absolute inset-0 h-full w-full" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted">Aucune</span>
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <Button onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Envoi…" : "↑ Envoyer une photo"}
        </Button>
        <select
          value={value.startsWith("jewel") ? value : ""}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[13px]"
        >
          <option value="">Utiliser une illustration…</option>
          {JEWEL_IMAGES.map((j) => (
            <option key={j} value={j}>
              {JEWEL_LABELS[j]}
            </option>
          ))}
        </select>
        {allowEmpty && value && (
          <Button variant="ghost" onClick={() => onChange("")}>
            Retirer l&apos;image
          </Button>
        )}
        {error && <p className="text-[12px] text-[#a8322a]">{error}</p>}
      </div>
    </div>
  );
}

export function IconButton({
  label,
  children,
  ...props
}: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
