// Hand-authored SVG art for the farm stand home page: flowers, berries, props, chalk marks.
// Everything here is decorative (aria-hidden) except where a caller labels it.
// The stand's painted materials and its flowers read the page's --fs-* theme variables; things
// with their own natural color (leaves, apples, strawberries, honey, a galvanized bucket) keep it.
import type { CSSProperties } from 'react';
import type { StandPalette } from './palettes';

type Tone = 'pink' | 'blush' | 'coral' | 'lilac' | 'berry';
const themed = (tone: 'pink' | 'blush' | 'berry') => ({
  outer: `var(--fs-bl-${tone}-outer)`,
  mid: `var(--fs-bl-${tone}-mid)`,
  inner: `var(--fs-bl-${tone}-inner)`,
  deep: `var(--fs-bl-${tone}-deep)`,
});
const TONES: Record<Tone, { outer: string; mid: string; inner: string; deep: string }> = {
  pink: themed('pink'),
  blush: themed('blush'),
  coral: { outer: '#FFCDB9', mid: '#FFAE92', inner: '#F48B6C', deep: '#C55F47' },
  lilac: { outer: '#EEDCFF', mid: '#DCC0F7', inner: '#C39CEC', deep: '#8F64C2' },
  berry: themed('berry'),
};

const GOLD = 'var(--fs-gold)';
const GOLD_LINE = 'var(--fs-gold-line)';
const MILK = 'var(--fs-milk)';
const STRAW = 'var(--fs-straw)';
const PINK_DEEP = 'var(--fs-bl-pink-deep)';
const WOOD_DEEP = 'var(--fs-wood-deep)';
const BASKET = 'var(--fs-basket)';

/** A peony drawn as an SVG group centered on (x, y) with radius r. */
export function PeonyG({ x, y, r, tone = 'pink', turn = 0 }: { x: number; y: number; r: number; tone?: Tone; turn?: number }) {
  const c = TONES[tone];
  const k = r / 40;
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${k})`}>
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
        <ellipse key={a} cx="0" cy="-21" rx="16" ry="22" transform={`rotate(${a})`} fill={c.outer} stroke={c.deep} strokeOpacity=".28" strokeWidth="1.3" />
      ))}
      {[18, 78, 138, 198, 258, 318].map((a) => (
        <ellipse key={a} cx="0" cy="-12" rx="12.5" ry="16" transform={`rotate(${a})`} fill={c.mid} stroke={c.deep} strokeOpacity=".22" strokeWidth="1.1" />
      ))}
      <circle r="11.5" fill={c.inner} />
      <path d="M-8 -1 Q0 -10 8 -1 M-5 5 Q0 0 5 5" stroke={c.deep} strokeOpacity=".5" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="-13" cy="-27" rx="7" ry="3.2" fill="#FFFFFF" opacity=".5" transform="rotate(-32 -13 -27)" />
    </g>
  );
}

export function DaisyG({ x, y, r, turn = 0 }: { x: number; y: number; r: number; turn?: number }) {
  const k = r / 30;
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${k})`}>
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <ellipse key={a} cx="0" cy="-17" rx="6" ry="14" transform={`rotate(${a})`} fill="#FFFFFF" stroke="#E7C9D4" strokeWidth="1.2" />
      ))}
      <circle r="9" fill="#F6C75B" stroke="#C98A1E" strokeWidth="1.4" />
      <circle cx="-3" cy="-3" r="2.4" fill="#FFE6A3" />
    </g>
  );
}

export function LeafG({ x, y, s = 1, turn = 0, fill = '#6FB36F' }: { x: number; y: number; s?: number; turn?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${s})`}>
      <path d="M0 0 C 8 -14, 30 -18, 40 -6 C 28 4, 10 6, 0 0 Z" fill={fill} stroke="#3F7F4A" strokeOpacity=".45" strokeWidth="1.2" />
      <path d="M3 -1 C 14 -6, 26 -8, 36 -6" stroke="#3F7F4A" strokeOpacity=".45" strokeWidth="1.2" fill="none" />
    </g>
  );
}

export function StrawberryG({ x, y, s = 1, turn = 0 }: { x: number; y: number; s?: number; turn?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${s})`}>
      <path d="M0 26 C -16 16, -20 -2, -12 -9 C -6 -14, -2 -11, 0 -9 C 2 -11, 6 -14, 12 -9 C 20 -2, 16 16, 0 26 Z" fill="#EF4566" stroke="#B82344" strokeWidth="1.4" />
      <path d="M-8 -4 C -10 2, -9 8, -6 12" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {[[-6, 2], [4, 0], [-2, 9], [7, 8], [0, 16], [-8, 11], [9, -3]].map(([sx, sy], i) => (
        <ellipse key={i} cx={sx} cy={sy} rx="1.1" ry="1.7" fill="#FFE07A" />
      ))}
      <path d="M0 -10 L -9 -15 L -3 -11 L -6 -19 L 0 -12 L 6 -19 L 3 -11 L 9 -15 Z" fill="#5FA36A" stroke="#3F7F4A" strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
}

export function Sparkle({ size = 18, color = GOLD, className, style }: { size?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L13.7 8.3 Q14 10 15.7 10.3 L24 12 L15.7 13.7 Q14 14 13.7 15.7 L12 24 L10.3 15.7 Q10 14 8.3 13.7 L0 12 L8.3 10.3 Q10 10 10.3 8.3 Z" fill={color} stroke={GOLD_LINE} strokeWidth=".8" strokeLinejoin="round" />
    </svg>
  );
}

/** A corner spray of peonies, daisies and leaves for the signs. */
export function FlowerSpray({ className, style, variant = 'a' }: { className?: string; style?: CSSProperties; variant?: 'a' | 'b' }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 140" aria-hidden="true">
      {variant === 'a' ? (
        <>
          <LeafG x={92} y={92} s={1.3} turn={-20} />
          <LeafG x={60} y={70} s={1.1} turn={-160} fill="#7DBF77" />
          <LeafG x={128} y={70} s={1} turn={10} fill="#7DBF77" />
          <PeonyG x={70} y={78} r={42} tone="pink" turn={8} />
          <PeonyG x={128} y={56} r={30} tone="blush" turn={-14} />
          <DaisyG x={30} y={44} r={20} turn={10} />
          <PeonyG x={160} y={96} r={22} tone="coral" turn={20} />
          <StrawberryG x={110} y={110} s={0.9} turn={-18} />
        </>
      ) : (
        <>
          <LeafG x={100} y={60} s={1.3} turn={200} />
          <LeafG x={140} y={88} s={1.1} turn={-30} fill="#7DBF77" />
          <PeonyG x={128} y={70} r={40} tone="berry" turn={-6} />
          <PeonyG x={72} y={84} r={30} tone="blush" turn={12} />
          <DaisyG x={176} y={44} r={18} turn={-8} />
          <PeonyG x={40} y={60} r={20} tone="lilac" turn={30} />
        </>
      )}
    </svg>
  );
}

/** Galvanized bucket of peonies (the friend stands behind it). */
export function FlowerBucket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 110" aria-hidden="true">
      <LeafG x={60} y={44} s={1.1} turn={-140} />
      <LeafG x={62} y={46} s={1.1} turn={-30} fill="#7DBF77" />
      <PeonyG x={38} y={36} r={22} tone="pink" />
      <PeonyG x={80} y={32} r={20} tone="blush" turn={20} />
      <DaisyG x={60} y={22} r={13} />
      <PeonyG x={62} y={46} r={17} tone="coral" turn={-10} />
      <path d="M20 54 L100 54 L92 106 Q91 108 88 108 L32 108 Q29 108 28 106 Z" fill="#B9D0DE" stroke="#7E9BB0" strokeWidth="2" />
      <ellipse cx="60" cy="54" rx="40" ry="6" fill="#D6E5EE" stroke="#7E9BB0" strokeWidth="2" />
      <path d="M26 72 L94 72 M28 88 L92 88" stroke="#7E9BB0" strokeWidth="2" opacity=".6" />
      <path d="M36 62 L34 100" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

/** Green berry box heaped with strawberries. */
export function BerryPint({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 90" aria-hidden="true">
      <StrawberryG x={34} y={34} s={0.95} turn={-20} />
      <StrawberryG x={60} y={26} s={1.05} turn={6} />
      <StrawberryG x={86} y={34} s={0.95} turn={24} />
      <StrawberryG x={48} y={44} s={0.9} turn={-6} />
      <StrawberryG x={74} y={44} s={0.9} turn={12} />
      <path d="M14 50 L106 50 L98 88 L22 88 Z" fill="#7CC28A" stroke="#3F7F4A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 62 L102 62 M20 75 L100 75" stroke="#3F7F4A" strokeWidth="2" opacity=".5" />
      <path d="M40 50 L42 88 M60 50 L60 88 M80 50 L78 88" stroke="#3F7F4A" strokeWidth="2" opacity=".35" />
    </svg>
  );
}

/** An antique register in the stand's ink and gold. */
export function Register({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 110" aria-hidden="true">
      <path d="M40 8 Q40 2 46 2 L104 2 Q110 2 110 8 L112 30 L38 30 Z" fill={GOLD} stroke={GOLD_LINE} strokeWidth="2" />
      <path d="M58 9 Q75 3 92 9 L92 22 Q75 27 58 22 Z" fill={MILK} stroke={GOLD_LINE} strokeWidth="1.6" />
      <circle cx="75" cy="15" r="4" fill={STRAW} />
      <path d="M22 30 L128 30 L138 80 L12 80 Z" fill="var(--fs-register)" stroke="var(--fs-berry-deep)" strokeWidth="2" strokeLinejoin="round" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle key={`${row}-${col}`} cx={38 + col * 18.5 + row * 2} cy={44 + row * 12} r="4.6" fill={MILK} stroke={GOLD} strokeWidth="1.4" />
        )),
      )}
      <rect x="8" y="80" width="134" height="26" rx="5" fill="var(--fs-register-base)" stroke="var(--fs-shade-deep)" strokeWidth="2" />
      <rect x="62" y="88" width="26" height="8" rx="4" fill={GOLD} stroke={GOLD_LINE} strokeWidth="1.4" />
      <path d="M128 34 L146 22" stroke={GOLD_LINE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="147" cy="20" r="5.5" fill={GOLD} stroke={GOLD_LINE} strokeWidth="1.6" />
    </svg>
  );
}

/** Honey jar with a gingham lid cover. */
export function HoneyJar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <pattern id="fs-gingham" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={MILK} />
          <rect width="4" height="8" fill="var(--fs-counter)" opacity=".8" />
          <rect width="8" height="4" fill="var(--fs-counter)" opacity=".8" />
        </pattern>
      </defs>
      <path d="M24 36 Q20 36 20 44 L20 88 Q20 96 30 96 L70 96 Q80 96 80 88 L80 44 Q80 36 76 36 Z" fill="#F6B941" stroke="#C98A1E" strokeWidth="2" />
      <path d="M28 46 L28 86" stroke="#FFE6A3" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <path d="M14 30 Q50 14 86 30 L82 40 Q50 32 18 40 Z" fill="url(#fs-gingham)" stroke="var(--fs-gingham)" strokeWidth="1.6" />
      <path d="M18 40 Q50 32 82 40" stroke={PINK_DEEP} strokeWidth="3" fill="none" />
      <path d="M50 37 q-10 -8 -14 2 q10 4 14 -2 q10 -8 14 2 q-10 4 -14 -2" fill={STRAW} stroke={PINK_DEEP} strokeWidth="1.2" />
      <ellipse cx="50" cy="66" rx="16" ry="12" fill={MILK} stroke="#C98A1E" strokeWidth="1.4" />
      <path d="M50 72 C 42 66, 42 60, 46 59 C 48 58.5, 49.5 60, 50 61 C 50.5 60, 52 58.5, 54 59 C 58 60, 58 66, 50 72 Z" fill={STRAW} />
    </svg>
  );
}

/** Wooden crate of red apples. */
export function AppleCrate({ className }: { className?: string }) {
  const apple = (x: number, y: number, t = 0) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${t})`}>
      <path d="M0 -10 C -10 -16, -18 -6, -16 4 C -14 14, -6 16, 0 13 C 6 16, 14 14, 16 4 C 18 -6, 10 -16, 0 -10 Z" fill="#E8495A" stroke="#A92637" strokeWidth="1.4" />
      <path d="M-8 -6 Q -11 0 -9 5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity=".5" fill="none" />
      <path d="M0 -10 Q 1 -16 4 -19" stroke="#7A4A26" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M2 -15 Q 9 -20 13 -14 Q 6 -11 2 -15 Z" fill="#6FB36F" />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 120 90" aria-hidden="true">
      {apple(32, 38, -10)}
      {apple(60, 32, 4)}
      {apple(88, 38, 14)}
      {apple(46, 46)}
      {apple(74, 46, -6)}
      <rect x="12" y="50" width="96" height="38" rx="4" fill={BASKET} stroke={WOOD_DEEP} strokeWidth="2" />
      <path d="M12 63 L108 63 M12 76 L108 76" stroke={WOOD_DEEP} strokeWidth="2" opacity=".55" />
      <rect x="44" y="56" width="32" height="14" rx="3" fill={MILK} stroke={WOOD_DEEP} strokeWidth="1.4" />
      <path d="M60 66 C 54 62, 54 58, 57 57.5 C 58.6 57.2, 59.6 58.2, 60 59 C 60.4 58.2, 61.4 57.2, 63 57.5 C 66 58, 66 62, 60 66 Z" fill="#E8495A" />
    </svg>
  );
}

/** Paper bouquet in the stand's blush. */
export function Bouquet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 110 110" aria-hidden="true">
      <LeafG x={54} y={46} s={1} turn={-150} />
      <LeafG x={56} y={46} s={1} turn={-25} fill="#7DBF77" />
      <PeonyG x={36} y={34} r={18} tone="berry" turn={10} />
      <PeonyG x={72} y={30} r={19} tone="pink" turn={-12} />
      <DaisyG x={54} y={20} r={12} />
      <PeonyG x={55} y={46} r={14} tone="lilac" />
      <path d="M20 50 L90 50 L60 106 Q55 110 50 106 Z" fill="var(--fs-bl-blush-mid)" stroke="var(--fs-bl-blush-deep)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 50 L50 106 M90 50 L60 106" stroke="var(--fs-bl-blush-deep)" strokeWidth="1.4" opacity=".5" />
      <path d="M36 76 Q55 70 74 76 L70 84 Q55 79 40 84 Z" fill={GOLD} stroke={GOLD_LINE} strokeWidth="1.4" />
    </svg>
  );
}

/** Mint watering can. */
export function WateringCan({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 130 100" aria-hidden="true">
      <path d="M36 92 L40 40 Q41 34 47 34 L83 34 Q89 34 90 40 L94 92 Q94 96 90 96 L40 96 Q36 96 36 92 Z" fill="#A8DCC6" stroke="#4F9A7F" strokeWidth="2" />
      <path d="M90 50 L118 26 L124 32 L94 64" fill="#A8DCC6" stroke="#4F9A7F" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="121" cy="28" rx="5" ry="8" transform="rotate(42 121 28)" fill="#7CC2A8" stroke="#4F9A7F" strokeWidth="1.6" />
      <path d="M50 34 Q65 6 80 34" stroke="#4F9A7F" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M48 46 L46 86" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity=".5" />
      <g transform="translate(66 66)">
        <path d="M0 8 C -12 0, -12 -10, -5 -11 C -2 -11.5, -0.6 -9.5, 0 -8 C 0.6 -9.5, 2 -11.5, 5 -11 C 12 -10, 12 0, 0 8 Z" fill={STRAW} stroke={PINK_DEEP} strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/** Prize ribbon rosette for the date sign. */
export function Rosette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 110" aria-hidden="true">
      <path d="M28 52 L16 104 L28 96 L36 108 L42 56 Z" fill={STRAW} stroke={PINK_DEEP} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M52 52 L64 104 L52 96 L44 108 L38 56 Z" fill={GOLD} stroke={GOLD_LINE} strokeWidth="1.6" strokeLinejoin="round" />
      {Array.from({ length: 16 }, (_, i) => i * 22.5).map((a) => (
        <ellipse key={a} cx="40" cy="22" rx="7" ry="15" transform={`rotate(${a} 40 40)`} fill={a % 45 === 0 ? STRAW : 'var(--fs-bl-pink-outer)'} stroke={PINK_DEEP} strokeWidth="1" />
      ))}
      <circle cx="40" cy="40" r="15" fill={GOLD} stroke={GOLD_LINE} strokeWidth="1.6" />
      <circle cx="40" cy="40" r="10" fill={MILK} stroke={GOLD_LINE} strokeWidth="1.2" />
      <path d="M40 46 C 33 41, 33 35.5, 36.5 35 C 38.2 34.7, 39.4 35.8, 40 37 C 40.6 35.8, 41.8 34.7, 43.5 35 C 47 35.5, 47 41, 40 46 Z" fill={STRAW} />
    </svg>
  );
}

/** A loose hand-drawn chalk loop that circles the chosen strategy. */
export function ChalkLoop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 56" preserveAspectRatio="none" aria-hidden="true">
      <path d="M22 34 C 16 10, 124 0, 148 16 C 164 28, 132 52, 78 53 C 30 54, 4 46, 8 30 C 11 18, 28 7, 50 3" fill="none" stroke="var(--fs-chalk-hi)" strokeWidth="3.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Curved chalk arrow pointing down to the next payoff. */
export function ChalkArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 60" aria-hidden="true">
      <path d="M14 6 C 2 18, 4 38, 22 50" fill="none" stroke="var(--fs-chalk)" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 0" />
      <path d="M12 46 L23 51 L21 39" fill="none" stroke="var(--fs-chalk)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A wavy chalk rule across the board. */
export function ChalkLine({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 10" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 6 C 120 2, 260 8, 380 4 S 560 6, 596 4" stroke="var(--fs-chalk)" strokeOpacity=".55" strokeWidth="2" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ChalkX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function ChalkPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4 L10 16 M4 10 L16 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** A strip of meadow with little flowers, to stand the counter on. */
export function Meadow({ className }: { className?: string }) {
  const flowers = [40, 130, 230, 330, 450, 560, 660, 770, 880, 990, 1090, 1200, 1310, 1400];
  return (
    <svg className={className} viewBox="0 0 1440 70" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 22 Q 180 4 360 18 T 720 16 T 1080 20 T 1440 14 L1440 70 L0 70 Z" fill="var(--fs-meadow)" />
      <path d="M0 40 Q 240 26 480 38 T 960 36 T 1440 34 L1440 70 L0 70 Z" fill="var(--fs-meadow-deep)" />
      {flowers.map((x, i) => (
        i % 3 === 0 ? <DaisyG key={x} x={x} y={36 + (i % 2) * 10} r={9} turn={i * 17} /> :
        <PeonyG key={x} x={x} y={34 + (i % 2) * 12} r={9} tone={(['pink', 'blush', 'coral', 'lilac'] as const)[i % 4]} turn={i * 23} />
      ))}
    </svg>
  );
}

/** A hanging basket of peonies with trailing vines, hung from the awning. */
export function HangingBasket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 190" aria-hidden="true">
      <path d="M60 0 L22 92 M60 0 L98 92 M60 0 L60 90" stroke={WOOD_DEEP} strokeWidth="2" fill="none" />
      <path d="M30 120 C 24 140, 30 160, 22 182" stroke="#5FA36A" strokeWidth="2.4" fill="none" />
      <path d="M90 120 C 98 142, 90 158, 98 178" stroke="#5FA36A" strokeWidth="2.4" fill="none" />
      <LeafG x={24} y={148} s={0.5} turn={120} />
      <LeafG x={96} y={150} s={0.5} turn={40} fill="#7DBF77" />
      <PeonyG x={22} y={178} r={9} tone="blush" />
      <PeonyG x={98} y={176} r={8} tone="pink" />
      <LeafG x={60} y={92} s={1} turn={-160} />
      <LeafG x={62} y={94} s={1} turn={-20} fill="#7DBF77" />
      <PeonyG x={38} y={92} r={20} tone="pink" turn={10} />
      <PeonyG x={82} y={90} r={19} tone="berry" turn={-10} />
      <DaisyG x={60} y={82} r={12} />
      <PeonyG x={60} y={102} r={14} tone="lilac" />
      <path d="M16 100 L104 100 Q100 132 60 134 Q20 132 16 100 Z" fill={BASKET} stroke={WOOD_DEEP} strokeWidth="2" />
      <path d="M20 110 L100 110 M26 121 L94 121" stroke={WOOD_DEEP} strokeWidth="1.6" opacity=".55" />
      <path d="M36 102 L38 132 M60 102 L60 134 M84 102 L82 132" stroke={WOOD_DEEP} strokeWidth="1.4" opacity=".4" />
    </svg>
  );
}

/** A climbing-rose cluster for the stand's posts. */
export function RoseCluster({ className, style, flip = false }: { className?: string; style?: CSSProperties; flip?: boolean }) {
  return (
    <svg className={className} style={{ ...style, transform: flip ? 'scaleX(-1)' : undefined }} viewBox="0 0 90 90" aria-hidden="true">
      <LeafG x={44} y={50} s={0.9} turn={-150} />
      <LeafG x={46} y={52} s={0.9} turn={-10} fill="#7DBF77" />
      <PeonyG x={34} y={44} r={22} tone="pink" turn={14} />
      <PeonyG x={62} y={58} r={15} tone="blush" turn={-20} />
      <DaisyG x={60} y={26} r={10} />
    </svg>
  );
}

/**
 * A little paint tin in one theme's own colors, for the paint rack. It takes
 * hex values (not the page variables) because every tin shows a different theme.
 */
export function PaintPot({ p }: { p: StandPalette }) {
  return (
    <svg viewBox="0 0 40 44" aria-hidden="true">
      <path d="M8 13 Q20 -1 32 13" fill="none" stroke={p.woodDeep} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 14 L6 37 Q6 42 11 42 L29 42 Q34 42 34 37 L34 14 Z" fill={p.straw} stroke={p.berry} strokeWidth="1.6" />
      <rect x="6" y="24" width="28" height="8" fill={p.milk} stroke={p.berry} strokeWidth="1.2" />
      <ellipse cx="20" cy="14" rx="14" ry="4.6" fill={p.candy} stroke={p.berry} strokeWidth="1.6" />
      <path d="M12 15 Q12 22 14 22 Q16 22 16 17" fill={p.candy} stroke={p.berry} strokeWidth="1.2" />
      <ellipse cx="15" cy="12.8" rx="4" ry="1.3" fill="#FFFFFF" opacity=".55" />
      <path d="M17 28 C 14 25.6, 14 23.8, 15.6 23.6 C 16.4 23.5, 16.9 24.1, 17 24.5 C 17.1 24.1, 17.6 23.5, 18.4 23.6 C 20 23.8, 20 25.6, 17 28 Z" transform="translate(3 0.5)" fill={p.candy} />
    </svg>
  );
}
