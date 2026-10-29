"use client";

import { useState } from "react";
import { DEFAULT_THEME, THEME_PRESETS, type Theme } from "@/lib/content-types";
import { Button } from "./ui";

type ColorField<K extends string> = { key: K; label: string; hint: string };

const PRODUCT_FIELDS: ColorField<keyof Theme>[] = [
  { key: "accent", label: "Couleur principale", hint: "Boutons, titres en couleur, icônes" },
  { key: "accentDark", label: "Principale foncée", hint: "Dégradé des boutons, prix" },
  { key: "accentSoft", label: "Principale très claire", hint: "Offre sélectionnée, étiquettes" },
  { key: "ink", label: "Texte", hint: "Titres et texte principal" },
  { key: "muted", label: "Texte secondaire", hint: "Descriptions, petits textes" },
  { key: "cream", label: "Fond crème", hint: "Sections « crème », total" },
  { key: "line", label: "Bordures", hint: "Contours des cartes" },
  { key: "badge", label: "Badge promo", hint: "Badge « خصم » sur la photo" },
];

export function ThemeEditor({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-ink/10 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl">Couleurs des pages produit</h3>
            <p className="mt-0.5 text-[12px] text-muted">S&apos;appliquent aux 3 pages et au formulaire de commande.</p>
          </div>
          <Button variant="ghost" onClick={() => onChange(DEFAULT_THEME)}>
            Réinitialiser
          </Button>
        </div>
        <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Thèmes prêts à l&apos;emploi</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onChange(p.theme)}
              className="flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-[13px] transition hover:border-ink"
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ background: `linear-gradient(225deg, ${p.theme.accent}, ${p.theme.accentDark})` }}
              />
              {p.name}
            </button>
          ))}
        </div>
        <ColorGrid fields={PRODUCT_FIELDS} values={theme} onChange={onChange} />
      </section>
    </div>
  );
}

function ColorGrid<K extends string, T extends Record<K, string>>({
  fields,
  values,
  onChange,
}: {
  fields: ColorField<K>[];
  values: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className="flex items-center gap-3">
          <input
            type="color"
            value={values[f.key]}
            onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
            className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-ink/15 bg-white p-1"
            aria-label={f.label}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">{f.label}</p>
            <p className="truncate text-[12px] text-muted">{f.hint}</p>
          </div>
          <HexInput
            key={values[f.key]}
            value={values[f.key]}
            label={f.label}
            onChange={(v) => onChange({ ...values, [f.key]: v })}
          />
        </div>
      ))}
    </div>
  );
}

/** Saisie libre du code couleur ; appliqué dès qu'il est valide (#RRGGBB). */
export function HexInput({ value, label, onChange }: { value: string; label: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      onChange={(e) => {
        const v = e.target.value.trim();
        setDraft(v);
        if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase());
      }}
      onBlur={() => setDraft(value)}
      className="w-24 rounded-lg border border-ink/15 px-2 py-1.5 font-mono text-[12px] uppercase"
      aria-label={`${label} (code)`}
    />
  );
}
