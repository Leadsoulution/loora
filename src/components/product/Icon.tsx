// Icônes au trait (24×24). La couleur et l'épaisseur viennent du CSS.

const PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrowLeft: "M15 5l-7 7 7 7",
  arrowRight: "M9 5l7 7-7 7",
  cart: "M3 4h2l2.4 11.2a1.5 1.5 0 001.5 1.2h8.6a1.5 1.5 0 001.5-1.1L21 8H6.2M9.5 20.5h.01M17.5 20.5h.01",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
  phone:
    "M6.6 3.5h2.6l1.4 4-2 1.4a12 12 0 006.5 6.5l1.4-2 4 1.4v2.6a2 2 0 01-2.2 2A16.5 16.5 0 014.6 5.7a2 2 0 012-2.2z",
  city: "M4 20.5V9l5-3v14.5M9 20.5V4l6 3v13.5M15 20.5V10l5 2.5v8M2.5 20.5h19",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 1114 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  cash: "M3 7h18v10H3zM12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM6.5 10v.01M17.5 14v.01",
  truck: "M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.5v2.5h-7M6.5 18.5a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zM17 18.5a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z",
  shield: "M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6zM8.8 12l2.2 2.2 4.2-4.4",
  gem: "M6.5 4h11L21 9l-9 11L3 9zM3 9h18M9.5 4L8 9l4 11 4-11-1.5-5",
  gift: "M3.5 9h17v4h-17zM5 13v7.5h14V13M12 9v11.5M12 9S10.8 4 8 4.3C5.8 4.5 6 8.5 12 9zM12 9s1.2-5 4-4.7c2.2.2 2 4.2-4 4.7z",
  hand: "M8 13V5.5a1.5 1.5 0 013 0V11m0-1.5V4a1.5 1.5 0 013 0v6m0-4.5a1.5 1.5 0 013 0V13c0 4.5-2.7 7.5-6.5 7.5-2.5 0-4-1-5.5-3L4.6 14a1.6 1.6 0 012.5-2L8 13",
  sparkle: "M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  drop: "M12 3.5s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
  box: "M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5L12 12l8.5-4.5M12 12v9",
  heart: "M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0112 7.2a4.3 4.3 0 017.5 2.6C19.5 15.5 12 20 12 20z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Étoile pleine pour les étiquettes (fill via CSS) */
export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.7l-6.1 3.4 1.4-6.8-5.1-4.7 6.9-.8z" />
    </svg>
  );
}
