"use client";

import { useRef, useState } from "react";
import { LogoHeader } from "@/components/LogoHeader";
import { DEFAULT_LOGO, HEADER_HEIGHT, LOGO_HEIGHT, type Logo } from "@/lib/content-types";
import { HexInput } from "./ThemeEditor";
import { Button, Field, Input, uploadImage } from "./ui";

export function LogoEditor({ logo, onChange }: { logo: Logo; onChange: (logo: Logo) => void }) {
  const set = (patch: Partial<Logo>) => onChange({ ...logo, ...patch });

  return (
    <section className="space-y-5 rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl">En-tête</h3>
          <p className="mt-0.5 text-[12px] text-muted">Un arrière-plan (couleur ou image) et votre logo au centre.</p>
        </div>
        <Button variant="ghost" onClick={() => confirm("Revenir à l'en-tête de départ ?") && onChange(DEFAULT_LOGO)}>
          Réinitialiser
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10">
        <LogoHeader logo={logo} />
      </div>

      {/* ------------------------------------------------ Arrière-plan */}
      <div className="space-y-3 rounded-lg border border-ink/10 bg-bone/30 p-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Arrière-plan</p>
        <Toggle
          value={logo.bgType}
          options={[
            { value: "color", label: "Couleur" },
            { value: "image", label: "Image" },
          ]}
          onChange={(bgType) => set({ bgType })}
        />
        {logo.bgType === "color" ? (
          <ColorPick label="Couleur de fond" value={logo.bgColor} onChange={(bgColor) => set({ bgColor })} />
        ) : (
          <>
            <UploadButton
              label={logo.bgImage ? "↑ Changer l'image de fond" : "↑ Envoyer une image de fond"}
              onUploaded={(bgImage) => set({ bgImage })}
            />
            <p className="text-[12px] text-muted">
              Format conseillé : environ 2000 × 420 px. L&apos;image remplit l&apos;en-tête ; les bords peuvent être rognés
              sur téléphone. La couleur ci-dessous s&apos;affiche pendant le chargement.
            </p>
            <ColorPick label="Couleur de secours" value={logo.bgColor} onChange={(bgColor) => set({ bgColor })} />
          </>
        )}
        <Field label={`Hauteur de l'en-tête : ${logo.headerHeight} px`} hint="Sur téléphone, l'en-tête est réduit automatiquement.">
          <Range
            min={HEADER_HEIGHT.min}
            max={HEADER_HEIGHT.max}
            value={logo.headerHeight}
            onChange={(headerHeight) => set({ headerHeight })}
          />
        </Field>
      </div>

      {/* ------------------------------------------------ Logo */}
      <div className="space-y-3 rounded-lg border border-ink/10 bg-bone/30 p-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Logo (par-dessus le fond)</p>
        <div className="flex flex-wrap items-center gap-2">
          <UploadButton
            label={logo.image ? "↑ Changer le logo" : "↑ Envoyer un logo (PNG transparent)"}
            onUploaded={(image) => set({ image })}
          />
          {logo.image && (
            <Button variant="ghost" onClick={() => set({ image: "" })}>
              Retirer le logo image
            </Button>
          )}
        </div>
        {logo.image ? (
          <Field label={`Taille du logo : ${logo.height} px`}>
            <Range min={LOGO_HEIGHT.min} max={LOGO_HEIGHT.max} value={logo.height} onChange={(height) => set({ height })} />
          </Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Logo en texte" hint="Vide = aucun logo (utile si l'image de fond contient déjà le logo)">
              <Input value={logo.text} maxLength={40} onChange={(text) => set({ text })} />
            </Field>
            <ColorPick label="Couleur du texte" value={logo.textColor} onChange={(textColor) => set({ textColor })} />
          </div>
        )}
      </div>
    </section>
  );
}

function UploadButton({ label, onUploaded }: { label: string; onUploaded: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onUploaded(await uploadImage(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <Button variant="primary" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? "Envoi…" : label}
      </Button>
      {error && <p className="mt-1 text-[12px] text-[#a8322a]">{error}</p>}
    </div>
  );
}

function ColorPick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field group label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-ink/15 bg-white p-0.5"
          aria-label={label}
        />
        <HexInput key={value} value={value} label={label} onChange={onChange} />
      </div>
    </Field>
  );
}

function Range({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#b08a3a]"
    />
  );
}

function Toggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-ink/15 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-[12px] transition ${
            value === o.value ? "bg-ink text-ivory" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
