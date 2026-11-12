/**
 * Ranch scene components: gradient defs, signposts, label chips and the
 * bloom a walk leaves behind. The static landscape lives in layers.tsx.
 */

import { circleD, pt, r1, textEm } from './geometry';
import type { Composition } from './compositions';
import { POST_H, type PlacedPost } from './signposts';
import { Bloomer, Tufts } from './paint';

/* ------------------------------------------------------------------ */
/* gradients                                                          */
/* ------------------------------------------------------------------ */

const stop = (offset: string, v: string, op?: string) => (
  <stop offset={offset} style={{ stopColor: `var(${v})`, stopOpacity: op ?? 1 }} />
);

export function Defs({ idp }: { idp: string }) {
  const id = (n: string) => `${idp}-${n}`;
  const hill = (n: string, a: string, b: string, at: string) => (
    <linearGradient id={id(n)} x1="0" y1="0" x2="0" y2="1">{stop('0', a)}{stop(at, b)}</linearGradient>
  );
  return (
    <defs>
      <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
        {stop('0', '--r-sky1')}{stop('.38', '--r-sky2')}{stop('.6', '--r-sky3')}{stop('.74', '--r-sky4')}
      </linearGradient>
      <radialGradient id={id('glow')}>{stop('0', '--r-glow')}{stop('1', '--r-glow', '0')}</radialGradient>
      <radialGradient id={id('halo')}>{stop('.25', '--r-halo', '.75')}{stop('1', '--r-halo', '0')}</radialGradient>
      <linearGradient id={id('haze')} x1="0" y1="0" x2="0" y2="1">
        {stop('0', '--r-haze', '0')}{stop('.55', '--r-haze', '.55')}{stop('1', '--r-haze', '0')}
      </linearGradient>
      {hill('hA1', '--r-h-a1', '--r-h-a1b', '.5')}
      {hill('hA2', '--r-h-a2', '--r-h-a2b', '.5')}
      {hill('hB', '--r-h-b', '--r-h-bb', '.6')}
      {hill('hC', '--r-h-c', '--r-h-cb', '.7')}
      {hill('hD', '--r-h-d', '--r-h-db', '1')}
      <radialGradient id={id('spill')}>{stop('0', '--r-window', '.55')}{stop('1', '--r-window', '0')}</radialGradient>
      <linearGradient id={id('beam')} x1="0" y1="0" x2="0" y2="1">{stop('0', '--r-lamp', '.5')}{stop('1', '--r-lamp', '0')}</linearGradient>
      <radialGradient id={id('bulb')}>{stop('0', '--r-lamp', '.85')}{stop('1', '--r-lamp', '0')}</radialGradient>
      <radialGradient id={id('fglow')}>{stop('0', '--r-fglow', '.42')}{stop('1', '--r-fglow', '0')}</radialGradient>
      <radialGradient id={id('ff')}>{stop('0', '--r-firefly', '.9')}{stop('1', '--r-firefly', '0')}</radialGradient>
      <linearGradient id={id('water')} x1="0" y1="0" x2="0" y2="1">{stop('0', '--r-water-hi')}{stop('.7', '--r-water')}</linearGradient>
      <filter id={id('lift')} x="-20%" y="-30%" width="140%" height="170%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.6" floodColor="#000" floodOpacity=".18" />
      </filter>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* signposts and label chips (data-driven, re-rendered with debts)    */
/* ------------------------------------------------------------------ */

const FLOWER_RING: [number, number, number, number][] = [[-24, 1, 4.6, 0], [-15, 6, 5.4, 1], [-4, 8, 4.4, 2], [9, 7, 5.6, 0], [19, 3, 4.6, 1], [27, -1, 3.8, 2], [-30, -3, 3.6, 2], [14, -4, 3.4, 1], [-11, -3, 3.4, 0]];

export function Signpost({ p, comp, snow }: { p: PlacedPost; comp: Composition; snow: boolean }) {
  const H = POST_H, { bx, bw, bh, dir } = p;
  const arrow = dir > 0
    ? `M${r1(bx)},${-H} h${r1(bw - 10)} l10,${bh / 2} l-10,${bh / 2} h${r1(-(bw - 10))} z`
    : `M${r1(bx + 10)},${-H} h${r1(bw - 10)} v${bh} h${r1(-(bw - 10))} l-10,${-bh / 2} z`;
  const kind = p.status === 'upcoming' ? 'plain' : p.status;
  const flowers = new Bloomer();
  const tufts = new Tufts();
  if (p.status === 'paid') {
    FLOWER_RING.forEach(([fx, fy, fr, k]) => flowers.flower(fx, fy, fr, k));
    tufts.add(-19, 4, 1); tufts.add(23, 5, 0.9); tufts.add(2, 9, 0.8);
  }
  const textX = bx + (bw - 10) / 2 + (dir < 0 ? 10 : 0);
  const rosY = -H + bh + 13;
  return (
    <g className={`r-post r-post-${kind}`} transform={`translate(${r1(p.x)} ${r1(p.y)}) scale(${r1(p.s * 100) / 100})`}>
      <ellipse className="r-gshadow" cx="0" cy="1" rx="14" ry="3.5" />
      <rect className="r-p-post" x="-3.5" y={-H + 4} width="7" height={H - 2} rx="2" />
      <path className="r-p-board" d={arrow} />
      <path className="r-p-grain" d={`M${r1(bx + 9)},${-H + 7.5} h${r1(bw * 0.36)} M${r1(bx + bw * 0.5)},${r1(-H + bh - 6)} h${r1(bw * 0.32)}`} />
      <circle className="r-p-nail" cx="0" cy={-H + 5} r="1.6" />
      <circle className="r-p-nail" cx="0" cy={r1(-H + bh - 5)} r="1.6" />
      {snow && <path className="r-snow" d={`M${r1(bx + (dir < 0 ? 9 : 1))},${-H + 1} q${r1(bw * 0.2)},-5 ${r1(bw * 0.45)},-2.4 q${r1(bw * 0.22)},-3 ${r1(bw * 0.42)},0.4 l0,2.2 q${r1(-bw * 0.43)},2 ${r1(-bw * 0.87)},0 Z`} />}
      {p.boardText && (
        <text className="r-p-text" x={r1(textX)} y={r1(-H + bh / 2 + comp.boardFont * 0.34)} textAnchor="middle" style={{ fontSize: `${comp.boardFont}px` }}>
          {p.boardText}
        </text>
      )}
      {p.status === 'paid' && (
        <g>
          <path className="r-ribbon" d={`M-5,${rosY + 4} l-5,15 l5,-3 l3,5 z M4,${rosY + 4} l6,14 l-5.5,-2.5 l-2,5.5 z`} />
          <circle className="r-ribbon" cx="0" cy={rosY} r="9" />
          <circle className="r-ribbon-ring" cx="0" cy={rosY} r="6.6" />
          <path className="r-ribbon-check" d={`M-3.8,${rosY} l2.7,2.7 l5,-5.4`} />
        </g>
      )}
      {p.status === 'paid' && flowers.render('fl')}
      {p.status === 'paid' && tufts.render('tu')}
      {p.tag && (
        <g>
          <path className="r-tag-cord" d={`M${r1(p.tagX)},${-H + bh} V${-H + bh + 8}`} />
          <TagPill cx={p.tagX} y={-H + bh + 7} text={p.tag} font={comp.chipFont * 0.92} />
        </g>
      )}
    </g>
  );
}

function TagPill({ cx, y, text, font }: { cx: number; y: number; text: string; font: number }) {
  const w = textEm(text) * font + 18, h = font * 1.5;
  return (
    <g className="r-tag">
      <rect x={r1(cx - w / 2)} y={r1(y)} width={r1(w)} height={r1(h)} rx={r1(h / 2)} />
      <text className="r-tag-text" x={r1(cx)} y={r1(y + h / 2 + font * 0.36)} textAnchor="middle" style={{ fontSize: `${r1(font)}px` }}>{text}</text>
    </g>
  );
}

export function Chip({ p, comp, idp }: { p: PlacedPost; comp: Composition; idp: string }) {
  const c = p.chip;
  if (!c) return null;
  const f = comp.chipFont;
  const { x0, y0, x1, y1 } = c.box;
  const h = y1 - y0;
  const kind = p.status === 'upcoming' ? 'plain' : p.status;
  const icon = p.status === 'paid' ? f * 0.95 : 0;
  const tx = x0 + f * 0.62 + icon;
  return (
    <g className={`r-chip r-chip-${kind}`}>
      <path className="r-chip-cord" d={`M${pt(c.from)} L${pt(c.anchor)}`} />
      <rect x={r1(x0)} y={r1(y0)} width={r1(x1 - x0)} height={r1(h)} rx={r1(h / 2)} filter={`url(#${idp}-lift)`} />
      {icon > 0 && (
        <g>
          <circle className="r-chip-ok" cx={r1(x0 + f * 0.62 + icon * 0.38)} cy={r1(y0 + h / 2)} r={r1(f * 0.42)} />
          <path className="r-chip-check" d={`M${r1(x0 + f * 0.62 + icon * 0.38 - f * 0.2)},${r1(y0 + h / 2)} l${r1(f * 0.14)},${r1(f * 0.14)} l${r1(f * 0.26)},${r1(-f * 0.28)}`} />
        </g>
      )}
      <text className="r-chip-text" x={r1(tx)} y={r1(y0 + h / 2 + f * 0.36)} style={{ fontSize: `${f}px` }}>{c.text}</text>
    </g>
  );
}

/** The bloom that pops up where the friend set off from. */
export function Bloom({ x, y, s, pop }: { x: number; y: number; s: number; pop: boolean }) {
  let pet = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    pet += circleD(Math.cos(a) * 5.2, -24 + Math.sin(a) * 5.2, 4.6);
  }
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${r1(s * 100) / 100})`}>
      <g className={pop ? 'r-bloom r-bloom-pop' : 'r-bloom'}>
        <path className="r-bl-stem" d="M0,0 C1,-8 -1,-14 0,-21" />
        <path className="r-bl-leaf" d="M0,-7 C5,-12 10,-11 12,-8 C8,-5 4,-5 0,-7 Z M0,-11 C-5,-15 -9,-14 -11,-11 C-7,-8 -3,-9 0,-11 Z" />
        <path className="r-bl-pet" d={pet} />
        <circle className="r-flc" cx="0" cy="-24" r="3.3" />
      </g>
    </g>
  );
}
