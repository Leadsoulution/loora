import { useId } from "react";
import type { Category, Metal, Stone } from "@/lib/products";

// Illustrations vectorielles des bijoux. À remplacer par de vraies photos
// produit (next/image) quand elles seront disponibles.

const METALS: Record<Metal, [string, string, string]> = {
  or: ["#F6E3A8", "#C9A04E", "#7E5F25"],
  argent: ["#FAFAF8", "#BCC1C6", "#6F757B"],
  rose: ["#F8D9C9", "#D29882", "#8E5847"],
};

const STONES: Record<Exclude<Stone, "none">, [string, string]> = {
  diamant: ["#FFFFFF", "#CFE3EE"],
  saphir: ["#7C9BE6", "#1C327C"],
  emeraude: ["#6FD1A8", "#0C5239"],
  rubis: ["#F27C8A", "#7E1029"],
  perle: ["#FFFDF7", "#DCD1BE"],
  onyx: ["#5A5A5A", "#0B0B0B"],
  aigue: ["#CDF1F7", "#4FA3B8"],
};

const BACKDROP: Record<Metal, [string, string]> = {
  or: ["#F7F0E4", "#E6D9C2"],
  argent: ["#F3F3F0", "#DCDCD6"],
  rose: ["#F8ECE5", "#E8D3C8"],
};

const DARK_BACKDROP: [string, string] = ["#43362C", "#1E1914"];

type Props = {
  category: Category;
  metal: Metal;
  stone: Stone;
  className?: string;
  backdrop?: boolean;
  /** Grossissement de la pièce (vue détail) */
  zoom?: number;
  tone?: "light" | "dark";
};

export function JewelArt({
  category,
  metal,
  stone,
  className = "",
  backdrop = true,
  zoom = 1,
  tone = "light",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const ids = {
    metal: `m${uid}`,
    stone: `s${uid}`,
    bg: `b${uid}`,
    blur: `f${uid}`,
  };
  const [m1, m2, m3] = METALS[metal];
  const stoneColors = stone === "none" ? null : STONES[stone];

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={ids.metal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={m1} />
          <stop offset="45%" stopColor={m2} />
          <stop offset="70%" stopColor={m1} />
          <stop offset="100%" stopColor={m3} />
        </linearGradient>
        {stoneColors && (
          <radialGradient id={ids.stone} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor={stoneColors[0]} />
            <stop offset="100%" stopColor={stoneColors[1]} />
          </radialGradient>
        )}
        <radialGradient id={ids.bg} cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor={(tone === "dark" ? DARK_BACKDROP : BACKDROP[metal])[0]} />
          <stop offset="100%" stopColor={(tone === "dark" ? DARK_BACKDROP : BACKDROP[metal])[1]} />
        </radialGradient>
        <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {backdrop && <rect width="400" height="500" fill={`url(#${ids.bg})`} />}
      <g transform={zoom !== 1 ? `translate(200 250) scale(${zoom}) translate(-200 -250)` : undefined}>
        <ellipse
          cx="200"
          cy="420"
          rx="120"
          ry="12"
          fill={tone === "dark" ? "#000" : "#2A211B"}
          opacity={tone === "dark" ? 0.4 : 0.12}
          filter={`url(#${ids.blur})`}
        />
        {category === "bagues" && <Ring ids={ids} stone={stone} />}
        {category === "colliers" && <Necklace ids={ids} stone={stone} />}
        {category === "boucles" && <Earrings ids={ids} stone={stone} />}
        {category === "bracelets" && <Bracelet ids={ids} stone={stone} m3={m3} />}
      </g>
    </svg>
  );
}

type PieceProps = { ids: Record<string, string>; stone: Stone };

function Gem({ ids, stone, cx, cy, size }: PieceProps & { cx: number; cy: number; size: number }) {
  if (stone === "none") return null;
  if (stone === "perle") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={size} fill={`url(#${ids.stone})`} />
        <ellipse cx={cx - size * 0.35} cy={cy - size * 0.4} rx={size * 0.28} ry={size * 0.16} fill="#fff" opacity="0.8" />
      </g>
    );
  }
  // Goutte facettée
  const s = size;
  return (
    <g>
      <path
        d={`M ${cx} ${cy - s * 1.2} C ${cx + s * 0.9} ${cy - s * 0.2}, ${cx + s} ${cy + s * 0.8}, ${cx} ${cy + s} C ${cx - s} ${cy + s * 0.8}, ${cx - s * 0.9} ${cy - s * 0.2}, ${cx} ${cy - s * 1.2} Z`}
        fill={`url(#${ids.stone})`}
      />
      <g stroke="#fff" strokeOpacity="0.45" strokeWidth="1" fill="none">
        <path d={`M ${cx} ${cy - s * 1.2} L ${cx - s * 0.35} ${cy + s * 0.2} L ${cx} ${cy + s} L ${cx + s * 0.35} ${cy + s * 0.2} Z`} />
        <path d={`M ${cx - s * 0.78} ${cy + s * 0.1} L ${cx + s * 0.78} ${cy + s * 0.1}`} />
      </g>
      <ellipse cx={cx - s * 0.3} cy={cy - s * 0.35} rx={s * 0.18} ry={s * 0.3} fill="#fff" opacity="0.55" transform={`rotate(25 ${cx} ${cy})`} />
    </g>
  );
}

function Sparkle({ x, y, size = 10, delay = 0 }: { x: number; y: number; size?: number; delay?: number }) {
  const s = size;
  return (
    <path
      className="twinkle"
      style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px` }}
      d={`M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z`}
      fill="#fff"
    />
  );
}

function Ring({ ids, stone }: PieceProps) {
  return (
    <g>
      <ellipse cx="200" cy="300" rx="92" ry="96" fill="none" stroke={`url(#${ids.metal})`} strokeWidth="15" />
      <ellipse cx="200" cy="300" rx="84" ry="88" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      {stone !== "none" && (
        <>
          <path d="M 176 214 Q 200 198 224 214 L 214 200 Q 200 192 186 200 Z" fill={`url(#${ids.metal})`} />
          <Gem ids={ids} stone={stone} cx={200} cy={176} size={30} />
          <Sparkle x={246} y={150} size={11} />
          <Sparkle x={160} y={130} size={7} delay={1.2} />
        </>
      )}
    </g>
  );
}

function Necklace({ ids, stone }: PieceProps) {
  const chain = "M 70 -10 C 92 200, 160 286, 200 296 C 240 286, 308 200, 330 -10";
  return (
    <g>
      <path d={chain} fill="none" stroke={`url(#${ids.metal})`} strokeWidth="2" />
      <path d={chain} fill="none" stroke={`url(#${ids.metal})`} strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 9" />
      <ellipse cx="200" cy="306" rx="6" ry="9" fill="none" stroke={`url(#${ids.metal})`} strokeWidth="3" />
      {stone === "none" ? (
        <g>
          <circle cx="200" cy="350" r="34" fill={`url(#${ids.metal})`} />
          <circle cx="200" cy="350" r="26" fill="none" stroke="#fff" strokeOpacity="0.4" />
        </g>
      ) : (
        <>
          <circle cx="200" cy="318" r="5" fill={`url(#${ids.metal})`} />
          <Gem ids={ids} stone={stone} cx={200} cy={stone === "perle" ? 346 : 352} size={stone === "perle" ? 24 : 26} />
        </>
      )}
      <Sparkle x={236} y={330} size={9} />
      <Sparkle x={150} y={250} size={6} delay={1.5} />
    </g>
  );
}

function Earrings({ ids, stone }: PieceProps) {
  const one = (x: number, dy: number, delay: number) => (
    <g key={x}>
      <path
        d={`M ${x} ${150 + dy} C ${x} ${100 + dy}, ${x + 40} ${100 + dy}, ${x + 38} ${144 + dy}`}
        fill="none"
        stroke={`url(#${ids.metal})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1={x} y1={150 + dy} x2={x} y2={196 + dy} stroke={`url(#${ids.metal})`} strokeWidth="2.5" />
      <circle cx={x} cy={200 + dy} r="5" fill={`url(#${ids.metal})`} />
      {stone === "none" ? (
        <circle cx={x} cy={248 + dy} r="34" fill="none" stroke={`url(#${ids.metal})`} strokeWidth="6" />
      ) : (
        <Gem ids={ids} stone={stone} cx={x} cy={stone === "perle" ? 228 + dy : 238 + dy} size={stone === "perle" ? 22 : 24} />
      )}
      <Sparkle x={x + 28} y={218 + dy} size={8} delay={delay} />
    </g>
  );
  return (
    <g>
      {one(140, 10, 0)}
      {one(258, 50, 1.1)}
    </g>
  );
}

function Bracelet({ ids, stone, m3 }: PieceProps & { m3: string }) {
  const cx = 200;
  const cy = 300;
  const rx = 140;
  const ry = 58;
  const stones =
    stone === "none"
      ? []
      : [40, 60, 80, 90, 100, 120, 140].map((deg) => {
          const t = (deg * Math.PI) / 180;
          return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) };
        });
  return (
    <g>
      <path d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`} fill="none" stroke={m3} strokeOpacity="0.55" strokeWidth="18" />
      <path d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`} fill="none" stroke={`url(#${ids.metal})`} strokeWidth="22" strokeLinecap="round" />
      <path
        d={`M ${cx - rx + 14} ${cy + 10} A ${rx - 10} ${ry - 6} 0 0 0 ${cx + rx - 14} ${cy + 10}`}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      {stones.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6.5" fill={`url(#${ids.stone})`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1" />
      ))}
      <Sparkle x={250} y={340} size={10} />
      <Sparkle x={130} y={268} size={6} delay={1.3} />
    </g>
  );
}
