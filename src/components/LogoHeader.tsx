/* eslint-disable @next/next/no-img-element -- logo envoyé depuis le dashboard, servi tel quel */
import type { Logo } from "@/lib/content-types";

/** En-tête sans lien : arrière-plan (couleur ou image) et logo centré par-dessus. Plus petit sur téléphone. */
export function LogoHeader({ logo }: { logo: Logo }) {
  const bgImage = logo.bgType === "image" && logo.bgImage;
  const style = {
    "--hh": `${logo.headerHeight}px`,
    "--hh-m": `${Math.round(Math.max(logo.headerHeight * 0.55, Math.min(logo.headerHeight, 56)))}px`,
    "--lh": `${logo.height}px`,
    "--lh-m": `${Math.round(Math.max(logo.height * 0.65, Math.min(logo.height, 28)))}px`,
    backgroundColor: logo.bgColor,
    backgroundImage: bgImage ? `url("${logo.bgImage.replace(/"/g, "%22")}")` : undefined,
  } as React.CSSProperties;

  return (
    <header
      style={style}
      className={`flex min-h-[var(--hh-m)] items-center justify-center bg-cover bg-center px-4 py-3 sm:min-h-[var(--hh)] ${
        bgImage ? "" : "border-b border-black/10"
      }`}
    >
      {logo.image ? (
        <img
          src={logo.image}
          alt={logo.text || "Logo"}
          className="h-[var(--lh-m)] w-auto max-w-[80vw] select-none object-contain sm:h-[var(--lh)]"
          draggable={false}
        />
      ) : (
        logo.text && (
          <span
            style={{ color: logo.textColor }}
            className="select-none pl-[0.45em] font-display text-2xl tracking-[0.45em] sm:text-3xl"
          >
            {logo.text}
          </span>
        )
      )}
    </header>
  );
}
