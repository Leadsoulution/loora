"use client";

import { useState } from "react";
import { findPixelIds, MAX_PIXELS, type PixelKind, type Pixels } from "@/lib/pixels";
import { Button, TextArea } from "./ui";

const KINDS: { kind: PixelKind; title: string; hint: string }[] = [
  {
    kind: "meta",
    title: "Meta Pixel (Facebook / Instagram)",
    hint: "Collez le code complet donné par Meta, ou seulement le numéro du pixel (ex. 1372971527357128).",
  },
  {
    kind: "tiktok",
    title: "TikTok Pixel",
    hint: "Collez le code complet donné par TikTok, ou seulement l'identifiant (ex. C4ABCD1234EFGH5678).",
  },
  {
    kind: "snap",
    title: "Snap Pixel (Snapchat)",
    hint: "Collez le code complet donné par Snapchat, ou seulement l'identifiant (ex. 4677f870-e000-4597-a073-abeea4dc3f23).",
  },
  {
    kind: "google",
    title: "Google (Analytics / Google Ads)",
    hint: "Collez le code Google (gtag), ou seulement l'identifiant : G-XXXXXXX (Analytics), AW-XXXXXXX (Ads). Pour compter les commandes comme conversions Google Ads, ajoutez l'identifiant avec son étiquette : AW-XXXXXXX/AbCdEf.",
  },
];

/** Pixels publicitaires : seuls les identifiants sont enregistrés, le site écrit lui-même le code */
export function PixelsPanel({ pixels, onChange }: { pixels: Pixels; onChange: (pixels: Pixels) => void }) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl">Pixels</h1>
      <p className="mt-1 text-sm text-muted">
        Les pixels sont ajoutés à toutes les pages produit et à la page merci. Cliquez ensuite sur « Enregistrer et publier ».
      </p>

      <div className="mt-6 space-y-5">
        {KINDS.map((k) => (
          <PixelCard
            key={k.kind}
            {...k}
            find={(text) => findPixelIds(k.kind, text)}
            ids={pixels[k.kind]}
            onChange={(ids) => onChange({ ...pixels, [k.kind]: ids })}
          />
        ))}

        <section className="rounded-xl border border-ink/10 bg-white p-5 text-[13px] text-muted">
          <h3 className="font-display text-xl text-ink">Événements envoyés</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b className="text-ink">PageView</b> : chaque visite d&apos;une page produit ou de la page merci.
            </li>
            <li>
              <b className="text-ink">ViewContent</b> (Snapchat : VIEW_CONTENT, Google : view_item) : consultation d&apos;un
              produit (code article, nom et prix).
            </li>
            <li>
              <b className="text-ink">Purchase</b> (TikTok : CompletePayment, Snapchat : PURCHASE, Google : purchase et
              conversion Ads) : commande envoyée, avec le montant de l&apos;offre choisie en MAD, le nombre de pièces et le
              numéro de commande. Envoyé une seule fois par commande.
            </li>
          </ul>
          <p className="mt-2">Les pixels se chargent juste après l&apos;affichage de la page : ils ne la ralentissent pas.</p>
        </section>
      </div>
    </div>
  );
}

function PixelCard({
  title,
  hint,
  find,
  ids,
  onChange,
}: {
  title: string;
  hint: string;
  find: (text: string) => string[];
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const full = ids.length >= MAX_PIXELS;

  function add() {
    const found = find(text).filter((id) => !ids.includes(id));
    if (found.length === 0) {
      setError(find(text).length > 0 ? "Ce pixel est déjà ajouté." : "Aucun identifiant de pixel trouvé dans ce texte.");
      return;
    }
    onChange([...ids, ...found].slice(0, MAX_PIXELS));
    setText("");
    setError("");
  }

  return (
    <section className="space-y-4 rounded-xl border border-ink/10 bg-white p-5">
      <div>
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-0.5 text-[12px] text-muted">{hint}</p>
      </div>

      {ids.length > 0 ? (
        <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10">
          {ids.map((id) => (
            <li key={id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="h-2 w-2 rounded-full bg-[#3F6B4A]" />
              <code className="text-[14px]">{id}</code>
              <span className="text-[12px] text-muted">actif</span>
              <Button variant="danger" className="ml-auto" onClick={() => onChange(ids.filter((x) => x !== id))}>
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted">Aucun pixel pour le moment.</p>
      )}

      {!full && (
        <div className="space-y-2">
          <TextArea value={text} onChange={setText} rows={4} />
          {error && <p className="text-[13px] text-[#a8322a]">{error}</p>}
          <Button variant="primary" onClick={add} disabled={!text.trim()}>
            Ajouter le pixel
          </Button>
        </div>
      )}
      {full && <p className="text-[13px] text-muted">Maximum {MAX_PIXELS} pixels.</p>}
    </section>
  );
}
