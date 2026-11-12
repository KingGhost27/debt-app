/* eslint-disable react-refresh/only-export-components -- this module exports SVG layer render helpers, not components; fast refresh does not apply */
/**
 * Ranch scene artwork: the static layers of the illustration, built once
 * per (composition, scene) and memoized by the caller.
 *
 * Geometry follows the approved Direction D sample. Fills come from the
 * scene's --r-* custom properties (see ranch.css), so one set of shapes
 * serves every theme.
 */

import type { ReactNode } from 'react';
import {
  along, chainD, circleD, ellipseD, hillD, pt, r1, rng, trailShapes,
  type Cubic, type Layer, type P,
} from './geometry';
import type { Oval } from './compositions';
import type { RanchFeatures, RanchSceneDef } from '../../lib/ranchScenes';
import type { FlagGeom, SceneModel } from './model';
import { Bloomer, Tufts } from './paint';

type Url = (name: string) => string;
type Crest = (x: number) => number;

/* ------------------------------------------------------------------ */
/* structures                                                         */
/* ------------------------------------------------------------------ */

function Barn({ x, y, s, u, f }: { x: number; y: number; s: number; u: Url; f: RanchFeatures }) {
  const gableY = (gx: number) => (gx <= 80 ? -130 - (gx / 80) * 66 : -130 - ((160 - gx) / 80) * 66);
  let boards = '';
  for (let bx = 14; bx < 160; bx += 13) boards += `M${bx},-8 V${r1(gableY(bx) + 3)} `;
  let side = '';
  for (let sx = 177; sx < 262; sx += 15) {
    const k = (sx - 160) / 102;
    side += `M${sx},${r1(-8 - k * 4)} V${r1(-128 + k * 8)} `;
  }
  const seams = [0.18, 0.36, 0.54, 0.72, 0.88]
    .map((k) => `M${pt([80 + 114 * k, -204 + 14 * k])} L${pt([170 + 106 * k, -124 + 7 * k])}`).join(' ');
  const sideWin = (x0: number) => {
    const k0 = (x0 - 160) / 102, k1 = (x0 + 22 - 160) / 102;
    const top0 = -101 + k0 * 6.2, top1 = -101 + k1 * 6.2, bot0 = -71 + k0 * 4.5, bot1 = -71 + k1 * 4.5;
    const fr = `M${x0 - 3},${r1(top0 - 3)} L${x0 + 25},${r1(top1 - 3)} L${x0 + 25},${r1(bot1 + 3)} L${x0 - 3},${r1(bot0 + 3)} Z`;
    const gl = `M${x0},${r1(top0)} L${x0 + 22},${r1(top1)} L${x0 + 22},${r1(bot1)} L${x0},${r1(bot0)} Z`;
    const mx = x0 + 11, mt = (top0 + top1) / 2, mb = (bot0 + bot1) / 2;
    const box = `M${x0 - 4},${r1(bot0 + 4)} L${x0 + 26},${r1(bot1 + 4)} L${x0 + 25},${r1(bot1 + 11)} L${x0 - 3},${r1(bot0 + 11)} Z`;
    const bl = new Bloomer();
    if (!f.snow) [0, 6, 12, 18, 24].forEach((dx, i) => bl.flower(x0 - 1 + dx, bot0 + 3 + ((bot1 - bot0) * dx) / 22, 1.9, [1, 0, 2][i % 3]));
    return (
      <g key={x0}>
        <path className="r-b-box" d={box} />
        {bl.render('f')}
        {f.snow && <path className="r-snow" d={`M${x0 - 4},${r1(bot0 + 4.5)} q2,-3.2 6,-2.4 q4,-2 8,0.3 q5,-2.2 9,0.4 q4,-2.4 7,0.6 L${x0 + 26},${r1(bot1 + 5)} Z`} />}
        <path className="r-b-trim" d={fr} />
        <path className="r-b-win" d={gl} />
        <path className="r-b-mull" d={`M${mx},${r1(mt)} V${r1(mb)} M${x0},${r1((top0 + bot0) / 2)} L${x0 + 22},${r1((top1 + bot1) / 2)}`} />
      </g>
    );
  };
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
      <ellipse className="r-gshadow" cx="140" cy="2" rx="170" ry="9" />
      {f.glow && <ellipse fill={u('spill')} cx="80" cy="10" rx="90" ry="16" />}
      <path className="r-b-side" d="M160,0 V-130 L262,-122 V-5 Z" />
      <path className="r-b-line" d={side} />
      <path className="r-b-stone" d="M160,0 V-9 L262,-13 V-5 Z" />
      {sideWin(178)}
      {sideWin(222)}
      <path className="r-b-roof" d="M80,-205 L196,-191 L278,-116 L170,-124 Z" />
      <path className="r-b-seam" d={seams} />
      {f.snow && (
        <>
          <path className="r-snow" d="M78,-208 L197,-194 L236,-158 q-6,6 -12,1 q-7,7 -14,1 q-6,6 -13,0 q-7,7 -14,1 q-7,6 -13,0 q-7,7 -13,0 q-6,6 -12,0 q-5,5 -11,-1 Z" />
          <path className="r-snow-sh" d="M122,-166 q6,5 12,-1 q7,6 13,0 q7,7 13,0 q7,6 14,-1 q6,6 13,0 q7,6 14,-1 q6,5 12,-1 l2,2 q-6,6 -12,1 q-7,7 -14,1 q-6,6 -13,0 q-7,7 -14,1 q-7,6 -13,0 q-7,7 -13,0 q-6,6 -12,0 Z" />
        </>
      )}
      <path className="r-b-eave" d="M160,-130 L262,-122 L262,-115 L160,-122 Z" />
      <path className="r-b-front" d="M0,0 V-130 L80,-196 L160,-130 V0 Z" />
      <path className="r-b-line" d={boards} />
      <rect className="r-b-stone" x="0" y="-9" width="160" height="9" />
      <rect className="r-b-trim" x="0" y="-131" width="160" height="6" />
      <rect className="r-b-trim" x="0" y="-130" width="7" height="121" />
      <rect className="r-b-trim" x="153" y="-130" width="7" height="121" />
      <path className="r-b-barge" d="M-9,-123 L80,-205 L169,-123" />
      {f.snow && <path className="r-snow-line" d="M-11,-128 L80,-211 L171,-128" />}
      <rect className="r-b-trim" x="57" y="-179" width="46" height="45" rx="2" />
      <rect className="r-b-win" x="62" y="-174" width="36" height="35" />
      <path className="r-b-hay" d="M62,-139 V-143 q3,-8 6,-1 q3,-9 7,-1 q3,-8 6,0 q4,-9 7,-1 q3,-7 5,0 q2,-6 3,-1 V-139 Z" />
      <path className="r-b-mull" d="M80,-174 V-147" />
      <rect className="r-b-trim" x="73" y="-193" width="14" height="8" rx="1.5" />
      <rect className="r-b-dark" x="28" y="-94" width="104" height="6" rx="3" />
      <rect className="r-b-door" x="35" y="-88" width="45" height="88" />
      <rect className="r-b-door" x="80" y="-88" width="45" height="88" />
      {f.glow && <rect className="r-b-gap" x="78.5" y="-86" width="3" height="86" />}
      <path className="r-b-x" d="M37.5,-85.5 h40 v83 h-40 z M82.5,-85.5 h40 v83 h-40 z M37.5,-85.5 L77.5,-2.5 M77.5,-85.5 L37.5,-2.5 M82.5,-85.5 L122.5,-2.5 M122.5,-85.5 L82.5,-2.5" />
      <path className="r-b-lamp-arm" d="M80,-112 V-120 M80,-120 q0,-4 -4,-4 h-6" />
      {f.glow && (
        <>
          <path fill={u('beam')} d="M72,-106 L50,-60 L110,-60 L88,-106 Z" />
          <circle fill={u('bulb')} cx="80" cy="-107" r="16" />
        </>
      )}
      <path className="r-b-dark" d="M71,-112 h18 l-4,-7 h-10 z" />
      <circle className="r-b-bulb" cx="80" cy="-110.5" r="3" />
      <path className="r-b-side" d="M146,-197 L156,-196 V-224 L146,-226 Z" />
      <rect className="r-b-front" x="124" y="-226" width="22" height="30" />
      <path className="r-b-mull" d="M128,-220 h14 M128,-215 h14 M128,-210 h14 M128,-205 h14" />
      <rect className="r-b-trim" x="122" y="-228" width="26" height="4" rx="1" />
      <path className="r-b-roof" d="M119,-226 L135,-243 L151,-226 Z" />
      <path className="r-b-roof2" d="M135,-243 L159,-224 L151,-226 Z" />
      {f.snow && <path className="r-snow" d="M117,-226 L135,-245 L160,-224 q-4,3 -8,0 q-4,4 -8,0 q-5,4 -9,0 q-4,4 -9,0 q-4,3 -9,0 Z" />}
      <path className="r-b-vane" d="M135,-243 V-268 M121,-262 H149 M149,-262 l-6,-3.5 v7 z M121,-262 l-3,-3 M121,-262 l-3,3 M125,-262 l-3,-3 M125,-262 l-3,3" />
      <circle className="r-b-vane-ball" cx="135" cy="-247" r="2.6" />
    </g>
  );
}

function Silo({ x, y, s, snow }: { x: number; y: number; s: number; snow: boolean }) {
  const band = (yy: number) => `M248,${yy} Q276,${yy + (yy < -95 ? -3 : 3)} 304,${yy}`;
  let rungs = '';
  for (let yy = -16; yy > -168; yy -= 11) rungs += `M262,${yy} h7 `;
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
      <path className="r-s-body" d="M248,-3 V-176 H304 V-3 Q276,2 248,-3 Z" />
      <path className="r-s-hi" d="M254,-176 h9 V-1 h-9 Z" />
      <path className="r-s-shade" d="M289,-176 H304 V-3 Q297,-1.6 289,-1.4 Z" />
      <path className="r-s-band" d={[-40, -80, -120, -160].map(band).join(' ')} />
      <path className="r-s-ladder" d={`M262,-6 V-170 M269,-6 V-170 ${rungs}`} />
      <path className="r-s-dome" d="M245,-175 C245,-209 307,-209 307,-175 Z" />
      <path className="r-s-domehi" d="M252,-180 C254,-196 266,-201 276,-202 C268,-197 262,-190 260,-180 Z" />
      {snow && <path className="r-snow" d="M246,-184 C250,-210 302,-210 306,-184 q-5,5 -10,1 q-6,5 -12,0 q-6,5 -12,0 q-6,5 -12,1 q-5,4 -10,-2 Z" />}
      <rect className="r-s-cap" x="270" y="-208" width="12" height="6" rx="2" />
    </g>
  );
}

/* trees ------------------------------------------------------------- */

type TreeKind = RanchFeatures['trees'];

function RoundTree({ x, y, s, variant, blossom, k }: { x: number; y: number; s: number; variant: 1 | 2 | 3; blossom: boolean; k: number }) {
  const c = (cx: number, cy: number, r: number) => circleD(x + cx * s, y + cy * s, r * s);
  const dark = c(-22, -50, 20) + c(20, -50, 21) + c(0, -44, 20) + c(-14, -76, 24) + c(14, -78, 24) + c(0, -96, 20);
  const mid = c(-23, -56, 16) + c(-15, -80, 20) + c(8, -84, 20) + c(-2, -99, 15) + c(14, -62, 15);
  const light = c(-16, -88, 10) + c(-27, -62, 7) + c(2, -102, 7);
  let dots = '';
  if (blossom) {
    const R = rng(k * 97 + 13);
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2, d = R() * 34;
      dots += circleD(x + Math.cos(a) * d * s, y + (-72 + Math.sin(a) * d * 0.9) * s, (1.6 + R() * 1.6) * s);
    }
  }
  const v = variant === 1 ? '' : String(variant);
  return (
    <g>
      <ellipse className="r-gshadow" cx={r1(x + 6 * s)} cy={r1(y + 1)} rx={r1(30 * s)} ry={r1(5 * s)} />
      <path className="r-trunk" d={`M${r1(x - 4.5 * s)},${r1(y)} L${r1(x - 3 * s)},${r1(y - 46 * s)} L${r1(x + 3 * s)},${r1(y - 46 * s)} L${r1(x + 4.5 * s)},${r1(y)} Z`} />
      <path className={`r-tree-d${v}`} d={dark} />
      <path className={`r-tree${v}`} d={mid} />
      <path className={`r-tree-l${v}`} d={light} />
      {dots && <path className="r-blossom" d={dots} />}
    </g>
  );
}

function Pine({ x, y, s, snow }: { x: number; y: number; s: number; snow: boolean }) {
  const T = (dx: number, dy: number) => `${r1(x + dx * s)},${r1(y + dy * s)}`;
  const tier = (top: number, base: number, half: number) =>
    `M${T(0, top)} L${T(half, base)} Q${T(half * 0.5, base + 5)} ${T(0, base + 2)} Q${T(-half * 0.5, base + 5)} ${T(-half, base)} Z`;
  const cap = (top: number, base: number, half: number) => {
    const k = 0.42, yb = top + (base - top) * k, hw = half * k;
    return `M${T(0, top - 1.5)} L${T(hw + 1, yb)} q${r1(-2.5 * s)},${r1(3 * s)} ${r1(-5 * s)},${r1(0.5 * s)} q${r1(-3 * s)},${r1(3.5 * s)} ${r1(-6 * s)},0 q${r1(-3 * s)},${r1(3 * s)} ${r1(-(hw * 2 + 2 - 11) * s)},${r1(-0.5 * s)} Z`;
  };
  const tiers: [number, number, number][] = [[-112, -64, 26], [-90, -38, 33], [-66, -10, 40]];
  return (
    <g>
      <ellipse className="r-gshadow" cx={r1(x + 6 * s)} cy={r1(y + 1)} rx={r1(32 * s)} ry={r1(5 * s)} />
      <path className="r-trunk" d={`M${T(-4, 0)} L${T(-3.5, -14)} L${T(3.5, -14)} L${T(4, 0)} Z`} />
      {tiers.map(([t, b, h], i) => (
        <g key={i}>
          <path className="r-tree-d" d={tier(t, b, h)} />
          <path className="r-tree" d={`M${T(0, t + 2)} L${T(-h * 0.92, b - 1)} Q${T(-h * 0.45, b + 2)} ${T(0, b)} Z`} />
          {snow && <path className="r-snow" d={cap(t, b, h)} />}
          {snow && <path className="r-snow" d={`M${T(-h * 0.98, b - 1)} q${r1(h * 0.3 * s)},${r1(3.5 * s)} ${r1(h * 0.62 * s)},${r1(1.5 * s)} q${r1(h * 0.35 * s)},${r1(3 * s)} ${r1(h * 0.7 * s)},${r1(0.5 * s)} q${r1(h * 0.4 * s)},${r1(3 * s)} ${r1(h * 0.66 * s)},${r1(-1.5 * s)} l${r1(-1 * s)},${r1(-2.4 * s)} q${r1(-h * 0.33 * s)},${r1(2.2 * s)} ${r1(-h * 0.66 * s)},${r1(0.4 * s)} q${r1(-h * 0.35 * s)},${r1(2.4 * s)} ${r1(-h * 0.7 * s)},${r1(-0.2 * s)} q${r1(-h * 0.3 * s)},${r1(2.4 * s)} ${r1(-h * 0.6 * s)},${r1(-0.6 * s)} Z`} />}
        </g>
      ))}
    </g>
  );
}

function Poplar({ x, y, s, kind }: { x: number; y: number; s: number; kind: TreeKind }) {
  if (kind === 'pine') return <Pine x={x} y={y} s={s * 0.55} snow />;
  if (kind === 'blossom') return <RoundTree x={x} y={y} s={s * 0.55} variant={1} blossom k={Math.round(x)} />;
  return (
    <g>
      <path className="r-trunk" d={`M${r1(x - 1.5 * s)},${r1(y)} h${r1(3 * s)} v${r1(-8 * s)} h${r1(-3 * s)} z`} />
      <ellipse className={kind === 'maple' ? 'r-tree-d3' : 'r-tree-d'} cx={r1(x)} cy={r1(y - 30 * s)} rx={r1(10 * s)} ry={r1(28 * s)} />
      <path className={kind === 'maple' ? 'r-tree-l3' : 'r-tree-l'} d={`M${r1(x - 1)},${r1(y - 56 * s)} C${r1(x - 9 * s)},${r1(y - 44 * s)} ${r1(x - 9 * s)},${r1(y - 18 * s)} ${r1(x - 2 * s)},${r1(y - 6 * s)} C${r1(x - 5 * s)},${r1(y - 24 * s)} ${r1(x - 5 * s)},${r1(y - 42 * s)} ${r1(x - 1)},${r1(y - 56 * s)} Z`} />
    </g>
  );
}

function Tree({ t, kind, i, snow }: { t: { x: number; y: number; s: number; kind?: 'poplar' }; kind: TreeKind; i: number; snow: boolean }) {
  if (t.kind === 'poplar') return <Poplar x={t.x} y={t.y} s={t.s} kind={kind} />;
  if (kind === 'pine') return <Pine x={t.x} y={t.y} s={t.s * 1.05} snow={snow} />;
  const variant = (kind === 'maple' ? ([1, 2, 3] as const)[i % 3] : 1);
  return <RoundTree x={t.x} y={t.y} s={t.s} variant={variant} blossom={kind === 'blossom'} k={i} />;
}

/* sky --------------------------------------------------------------- */

const CLOUD = 'M14,0 C-4,0 -7,-21 11,-26 C9,-44 33,-55 52,-45 C60,-65 97,-71 113,-50 C125,-63 157,-59 161,-37 C181,-43 201,-27 193,-10 C207,-8 205,0 191,0 Z';

function Celestial({ kind, at, u }: { kind: RanchFeatures['celestial']; at: [number, number, number]; u: Url }) {
  const [x, y, r] = at;
  const rays = (n: number, k0: number, k1: number, off = 0) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + off;
      d += `M${r1(x + Math.cos(a) * r * k0)},${r1(y + Math.sin(a) * r * k0)} L${r1(x + Math.cos(a) * r * k1)},${r1(y + Math.sin(a) * r * k1)} `;
    }
    return d;
  };
  switch (kind) {
    case 'moon':
    case 'winterMoon':
      return (
        <g>
          <circle fill={u('halo')} cx={x} cy={y} r={r * (kind === 'moon' ? 3 : 3.4)} />
          <circle className="r-orb" cx={x} cy={y} r={r} />
          <path className="r-orb-sh" d={circleD(x - r * 0.3, y - r * 0.25, r * 0.18) + circleD(x + r * 0.32, y + r * 0.05, r * 0.12) + circleD(x - r * 0.05, y + r * 0.4, r * 0.09)} />
        </g>
      );
    case 'crescent':
      return (
        <g>
          <circle fill={u('halo')} cx={x} cy={y} r={r * 3.4} />
          <path className="r-orb" d={`M${r1(x + r * 0.2)},${r1(y - r)} A${r},${r} 0 1 0 ${r1(x + r * 0.98)},${r1(y + r * 0.22)} A${r1(r * 0.82)},${r1(r * 0.82)} 0 1 1 ${r1(x + r * 0.2)},${r1(y - r)} Z`} />
        </g>
      );
    case 'sunrise':
      return (
        <g>
          <circle fill={u('halo')} cx={x} cy={y} r={r * 4.2} />
          <path className="r-rays r-rays-soft" d={rays(18, 1.4, 2.5, 0.09)} />
          <circle className="r-orb" cx={x} cy={y} r={r} />
          <circle className="r-orb-hi" cx={r1(x - r * 0.3)} cy={r1(y - r * 0.32)} r={r1(r * 0.38)} />
        </g>
      );
    case 'sunset':
      return (
        <g>
          <circle fill={u('halo')} cx={x} cy={y} r={r * 4.6} />
          <circle fill={u('halo')} cx={x} cy={y} r={r * 2.1} />
          <circle className="r-orb" cx={x} cy={y} r={r} />
          <circle className="r-orb-core" cx={x} cy={y} r={r1(r * 0.72)} />
          <path className="r-orb-band" d={`M${r1(x - r * 1.5)},${r1(y - r * 0.18)} h${r1(r * 1.2)} M${r1(x + r * 0.1)},${r1(y - r * 0.18)} h${r1(r * 1.25)} M${r1(x - r * 1.15)},${r1(y + r * 0.2)} h${r1(r * 2.1)}`} strokeWidth={r1(r * 0.12)} strokeLinecap="round" />
        </g>
      );
    case 'softSun':
      return (
        <g>
          <circle fill={u('halo')} cx={x} cy={y} r={r * 3.4} />
          <circle className="r-orb" cx={x} cy={y} r={r} />
          <circle className="r-orb-hi" cx={r1(x - r * 0.28)} cy={r1(y - r * 0.3)} r={r1(r * 0.42)} />
        </g>
      );
    default:
      return (
        <g>
          <circle fill={u('halo')} cx={x} cy={y} r={r * 3.2} />
          <path className="r-rays" d={rays(12, 1.45, 1.85, 0.13)} />
          <circle className="r-orb" cx={x} cy={y} r={r} />
          <circle className="r-orb-hi" cx={r1(x - r * 0.28)} cy={r1(y - r * 0.3)} r={r1(r * 0.42)} />
        </g>
      );
  }
}

/* fields ------------------------------------------------------------ */

function fieldRows(m: SceneModel, f: RanchFeatures, near: (x: number, y: number) => boolean): ReactNode {
  const { comp, crest } = m;
  const { vp, bottoms, yBottom, maxX } = comp.rows;
  let d = '', mm = '', h1 = '', h2 = '', stem = '';
  const kind = f.field;
  for (const bxp of bottoms) {
    const steps = 22;
    for (let i = 0; i < steps; i++) {
      const k = Math.pow(i / steps, 0.55);
      const x = bxp + (vp[0] - bxp) * k, y = yBottom + (vp[1] - yBottom) * k;
      if (y < crest.D(x) + 5) break;
      if (x > maxX || near(x, y)) continue;
      const s = comp.depth(y);
      if (kind === 'wheat') {
        const rw = 12 * s, rh = 6.5 * s;
        d += ellipseD(x, y, rw, rh);
        mm += ellipseD(x - rw * 0.1, y - rh * 0.4, rw * 0.8, rh * 0.55);
        if (s > 0.42) {
          for (const [dx, dy, a] of [[-0.55, -1.05, -0.32], [0, -1.35, 0], [0.55, -1.05, 0.32]] as const) {
            const cx = x + dx * rw, cy = y + dy * rh * 1.35;
            stem += `M${r1(cx)},${r1(cy + 3.2 * s)} L${r1(cx - a * 4 * s)},${r1(cy - 2.4 * s)} `;
            h1 += ellipseD(cx - a * 4.6 * s, cy - 3.6 * s, 1.5 * s, 3.4 * s);
          }
        }
      } else if (kind === 'tulips') {
        const rw = 11 * s, rh = 6 * s;
        d += ellipseD(x, y, rw, rh);
        mm += ellipseD(x - rw * 0.1, y - rh * 0.4, rw * 0.75, rh * 0.5);
        if (s > 0.4) {
          const cup = (cx: number, cy: number, r: number) =>
            `M${r1(cx - r)},${r1(cy - r * 0.3)} Q${r1(cx - r)},${r1(cy + r)} ${r1(cx)},${r1(cy + r)} Q${r1(cx + r)},${r1(cy + r)} ${r1(cx + r)},${r1(cy - r * 0.3)} L${r1(cx + r * 0.5)},${r1(cy - r * 0.75)} L${r1(cx)},${r1(cy - r * 0.15)} L${r1(cx - r * 0.5)},${r1(cy - r * 0.75)} Z`;
          h1 += cup(x - rw * 0.42, y - rh * 1.05, 2.6 * s) + cup(x + rw * 0.4, y - rh * 1.1, 2.6 * s);
          h2 += cup(x, y - rh * 1.45, 2.8 * s);
        }
      } else {
        const rw = 12.5 * s, rh = (kind === 'strawberry' ? 8.6 : 8) * s;
        d += ellipseD(x, y, rw, rh);
        mm += ellipseD(x - rw * 0.1, y - rh * 0.35, rw * 0.78, rh * 0.6);
        if (s > 0.5) {
          if (kind === 'strawberry') {
            h1 += circleD(x - rw * 0.38, y - rh * 0.25, 2 * s) + circleD(x + rw * 0.3, y - rh * 0.5, 1.9 * s) + circleD(x + rw * 0.02, y + rh * 0.15, 1.7 * s);
            h2 += circleD(x - rw * 0.05, y - rh * 0.9, 1.4 * s);
          } else {
            h1 += circleD(x - rw * 0.35, y - rh * 0.6, 1.7 * s) + circleD(x + rw * 0.05, y - rh * 0.95, 1.3 * s);
            h2 += circleD(x + rw * 0.25, y - rh * 0.75, 1.5 * s);
          }
        }
      }
    }
  }
  return (
    <g key="rows">
      <path className="r-row-d" d={d} />
      <path className="r-row-m" d={mm} />
      {stem && <path className="r-row-stem" d={stem} />}
      <path className="r-row-h" d={h1} />
      {h2 && <path className="r-row-h2" d={h2} />}
    </g>
  );
}

function midRows(m: SceneModel, near: (x: number, y: number, k: number) => boolean): ReactNode {
  const { comp, crest } = m;
  const out: ReactNode[] = [];
  let n = 0;
  for (const off of comp.midRows.offs) {
    let seg: P[] = [];
    const flush = () => {
      if (seg.length > 2) {
        const sw = r1(Math.max(1.6, 4.6 * comp.depth(seg[0][1])));
        out.push(<path key={`r${n++}`} className="r-mrow" strokeWidth={sw} d={'M' + seg.map(pt).join(' L')} />);
        out.push(<path key={`r${n++}`} className="r-mrow-h" strokeWidth={r1(sw * 0.42)} d={'M' + seg.map(([x, y]) => pt([x, y - sw * 0.28])).join(' L')} />);
      }
      seg = [];
    };
    for (let x = comp.midRows.x0; x <= comp.midRows.x1; x += 6) {
      const y = crest.C(x) + off;
      if (y > crest.D(x) - 5 || near(x, y, 7)) { flush(); continue; }
      seg.push([x, y]);
    }
    flush();
  }
  return <g key="mid">{out}</g>;
}

function Pond({ o, lilies, u, seed }: { o: Oval; lilies: boolean; u: Url; seed: number }) {
  const R = rng(seed);
  const { cx, cy, rx, ry } = o;
  // organic outline: an ellipse with gentle lobes
  let d = '';
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + 0.06 * Math.sin(a * 3 + 0.7) + 0.035 * Math.sin(a * 5 + 1.9);
    d += `${i ? 'L' : 'M'}${pt([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob])} `;
  }
  const ripple = (k: number, w: number) =>
    `M${r1(cx - rx * w + rx * k)},${r1(cy - ry * 0.1 + ry * k * 0.4)} q${r1(rx * w * 0.5)},${r1(-ry * 0.25)} ${r1(rx * w)},0`;
  let pads = '', padsD = '', blooms = '';
  if (lilies) {
    const spots: [number, number, number][] = [[-0.55, 0.05, 1], [-0.18, 0.32, 0.85], [0.3, -0.12, 1.1], [0.62, 0.28, 0.75], [0.05, -0.4, 0.7]];
    for (const [kx, ky, ks] of spots) {
      const px = cx + kx * rx, py = cy + ky * ry, pr = Math.max(4, ry * 0.42) * ks;
      const a0 = R() * Math.PI * 2;
      // a lily pad is a disc with a notch
      pads += `M${r1(px)},${r1(py)} L${r1(px + Math.cos(a0) * pr)},${r1(py + Math.sin(a0) * pr * 0.45)} A${r1(pr)},${r1(pr * 0.45)} 0 1 1 ${r1(px + Math.cos(a0 + 0.5) * pr)},${r1(py + Math.sin(a0 + 0.5) * pr * 0.45)} Z `;
      padsD += `M${r1(px - pr * 0.5)},${r1(py + pr * 0.12)} q${r1(pr * 0.5)},${r1(pr * 0.12)} ${r1(pr)},0 `;
    }
    blooms = circleD(cx + 0.3 * rx + 2, cy - 0.12 * ry - ry * 0.18, Math.max(2.2, ry * 0.16)) + circleD(cx - 0.55 * rx + 1, cy + 0.05 * ry - ry * 0.16, Math.max(1.9, ry * 0.13));
  }
  // reeds with cattails at both ends, a few stones on the near bank
  let reeds = '', tails = '', stones = '';
  const k = Math.max(0.35, ry / 24);
  for (const [ex, side] of [[cx - rx * 0.92, -1], [cx + rx * 0.9, 1]] as const) {
    for (let i = 0; i < 4; i++) {
      const bx = ex + side * i * 4.2 * k - side * 3 * k, by = cy + ry * (0.1 + 0.12 * i);
      const hgt = (18 + R() * 12) * k, lean = side * (2 + R() * 4) * k;
      reeds += `M${r1(bx)},${r1(by)} q${r1(lean * 0.3)},${r1(-hgt * 0.5)} ${r1(lean)},${r1(-hgt)} `;
      if (i % 2 === 0) tails += ellipseD(bx + lean * 0.92, by - hgt * 0.92, 1.8 * k, 4.6 * k);
    }
  }
  for (const [kx, ks] of [[-0.35, 1], [-0.2, 0.7], [0.42, 0.85]] as const) {
    stones += ellipseD(cx + kx * rx, cy + ry * 0.98, 6 * k * ks, 3.2 * k * ks);
  }
  return (
    <g>
      <path className="r-pond-bank" d={d} transform={`translate(0 ${r1(ry * 0.14)})`} />
      <path fill={u('water')} d={d} />
      <path className="r-pond-ripple" d={ripple(0.15, 0.32) + ' ' + ripple(0.55, 0.22) + ' ' + ripple(-0.05, 0.18)} />
      {pads && <path className="r-lily" d={pads} />}
      {padsD && <path className="r-lily-d" d={padsD} />}
      {blooms && <path className="r-fl2" d={blooms} />}
      <path className="r-reed" strokeWidth={r1(Math.max(1, 1.5 * k))} d={reeds} />
      <path className="r-cattail" d={tails} />
      <path className="r-b-stone" d={stones} />
    </g>
  );
}

function Snowman({ x, y, s }: { x: number; y: number; s: number }) {
  const T = (dx: number, dy: number) => [x + dx * s, y + dy * s] as const;
  const c = (dx: number, dy: number, r: number) => { const [a, b] = T(dx, dy); return circleD(a, b, r * s); };
  const [hx, hy] = T(0, -50);
  return (
    <g>
      <ellipse className="r-gshadow" cx={r1(x + 4 * s)} cy={r1(y + 1)} rx={r1(22 * s)} ry={r1(4 * s)} />
      <path className="r-snow-sh" d={c(1.5, -14, 17) + c(1.2, -36, 12.5) + c(1, -52, 9.5)} />
      <path className="r-snow" d={c(0, -15, 16) + c(0, -37, 12) + c(0, -53, 9)} />
      <path className="r-sm-arm" d={`M${pt([x - 10 * s, y - 38 * s])} l${r1(-12 * s)},${r1(-8 * s)} m${r1(4 * s)},${r1(2.6 * s)} l${r1(-3 * s)},${r1(-5 * s)} M${pt([x + 10 * s, y - 38 * s])} l${r1(12 * s)},${r1(-9 * s)}`} />
      <path className="r-sm-scarf" d={`M${pt([x - 9 * s, y - 45 * s])} q${r1(9 * s)},${r1(4 * s)} ${r1(18 * s)},0 l${r1(0.5 * s)},${r1(3.6 * s)} q${r1(-9.5 * s)},${r1(4 * s)} ${r1(-19 * s)},0 Z M${pt([x + 3 * s, y - 43 * s])} l${r1(5 * s)},${r1(12 * s)} l${r1(4 * s)},${r1(-1.5 * s)} l${r1(-3 * s)},${r1(-11 * s)} Z`} />
      <path className="r-sm-coal" d={circleD(hx - 3.2 * s, hy - 2.5 * s, 1.2 * s) + circleD(hx + 3.2 * s, hy - 2.5 * s, 1.2 * s) + c(0, -34, 1.3) + c(0, -28, 1.3)} />
      <path className="r-sm-nose" d={`M${pt([hx, hy])} l${r1(7 * s)},${r1(1.6 * s)} l${r1(-7 * s)},${r1(1.4 * s)} Z`} />
    </g>
  );
}

function Pumpkins({ m, near, seed }: { m: SceneModel; near: (x: number, y: number) => boolean; seed: number }) {
  const { comp, crest } = m;
  const R = rng(seed);
  const fb = comp.fieldBox;
  const pts: [number, number, number][] = [];
  const want = comp.id === 'wide' ? 15 : 5;
  for (let g = 0; g < 400 && pts.length < want; g++) {
    const x = fb.x0 + R() * (fb.x1 - fb.x0), y = fb.y0 + R() * (fb.y1 - fb.y0);
    if (y < crest.D(x) + 10 || near(x, y)) continue;
    const s = comp.depth(y) * (0.8 + R() * 0.45);
    if (pts.some(([px, py, ps]) => Math.hypot(px - x, (py - y) * 1.8) < 14 * (s + ps))) continue;
    pts.push([x, y, s]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  return (
    <g>
      {pts.map(([x, y, s], i) => (
        <g key={i}>
          <ellipse className="r-gshadow" cx={r1(x + 2 * s)} cy={r1(y + 1)} rx={r1(13 * s)} ry={r1(2.6 * s)} />
          <path className="r-vine" strokeWidth={r1(Math.max(1, 1.6 * s))} d={`M${pt([x - 16 * s, y + 1])} q${r1(6 * s)},${r1(-6 * s)} ${r1(12 * s)},${r1(-3 * s)} M${pt([x + 8 * s, y - 2 * s])} q${r1(8 * s)},${r1(-5 * s)} ${r1(13 * s)},${r1(1 * s)}`} />
          <path className="r-pumpkin-d" d={ellipseD(x - 5.5 * s, y - 7 * s, 6.5 * s, 7 * s) + ellipseD(x + 5.5 * s, y - 7 * s, 6.5 * s, 7 * s)} />
          <path className="r-pumpkin" d={ellipseD(x, y - 7.4 * s, 7 * s, 7.6 * s)} />
          <path className="r-pumpkin-rib" strokeWidth={r1(Math.max(0.8, 1.2 * s))} d={`M${pt([x - 2.5 * s, y - 13.5 * s])} q${r1(-2 * s)},${r1(6 * s)} 0,${r1(12.5 * s)} M${pt([x + 2.5 * s, y - 13.5 * s])} q${r1(2 * s)},${r1(6 * s)} 0,${r1(12.5 * s)}`} />
          <path className="r-vine" strokeWidth={r1(Math.max(1.2, 2.2 * s))} d={`M${pt([x, y - 14 * s])} q${r1(0.5 * s)},${r1(-3 * s)} ${r1(2.5 * s)},${r1(-4.2 * s)}`} />
        </g>
      ))}
    </g>
  );
}

function Hay({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
      <ellipse className="r-gshadow" cx="4" cy="1" rx="26" ry="4" />
      <path className="r-hay-b" d="M-14,0 V-26 C-14,-34 22,-34 22,-26 V0 Z" />
      <ellipse className="r-hay-f" cx="-14" cy="-13" rx="9" ry="13" />
      <path className="r-hay-l" d="M-14,-13 m-5,0 a5,7 0 1 0 5,-7 M-14,-13 m-2,0 a2,3 0 1 0 2,-3" />
    </g>
  );
}

export function Fence({ ch, step, h0, depth, snow }: { ch: Cubic[]; step: number; h0: number; depth: (y: number) => number; snow: boolean }) {
  const pts = along(ch, step);
  let posts = '', caps = '';
  const top: string[] = [], mid: string[] = [];
  for (const p of pts) {
    const s = depth(p[1]), h = h0 * s, w = Math.max(2, 5 * s);
    posts += `M${r1(p[0] - w / 2)},${r1(p[1] + 2)} V${r1(p[1] - h + w / 3)} q0,${r1(-w / 3)} ${r1(w / 3)},${r1(-w / 3)} h${r1(w / 3)} q${r1(w / 3)},0 ${r1(w / 3)},${r1(w / 3)} V${r1(p[1] + 2)} Z`;
    if (snow) caps += ellipseD(p[0], p[1] - h, w * 0.75, Math.max(1, w * 0.36));
    top.push(pt([p[0], p[1] - h * 0.8]));
    mid.push(pt([p[0], p[1] - h * 0.42]));
  }
  const rw = r1(Math.max(1.4, 3.6 * depth(pts[0][1])));
  return (
    <g>
      <path className="r-f-rail" strokeWidth={rw} d={`M${top.join(' L')} M${mid.join(' L')}`} />
      <path className="r-f-post" d={posts} />
      {caps && <path className="r-snow" d={caps} />}
    </g>
  );
}

/* the flag at the end of the trail --------------------------------- */

function Flag({ fg, idp, text }: { fg: FlagGeom; idp: string; text: string }) {
  const { x, y, s, len: L, font } = fg;
  const d = -1;
  const top = y - 78 * s;
  const bx0 = x + d * 3 * s, bx1 = x + d * L;
  const bh = Math.max(24 * s, font * 1.55);
  const by = top + 6 * s;
  const mid = (bx0 + bx1) / 2;
  const wave = `M${r1(bx0)},${r1(by)} C${r1(mid - d * L * 0.15)},${r1(by - 7 * s)} ${r1(mid + d * L * 0.15)},${r1(by + 9 * s)} ${r1(bx1)},${r1(by + 2 * s)}`;
  const tail = `L${r1(bx1 + 9 * s)},${r1(by + 2 * s + bh / 2)} L${r1(bx1)},${r1(by + 2 * s + bh)}`;
  const bottom = `C${r1(mid + d * L * 0.15)},${r1(by + bh + 9 * s)} ${r1(mid - d * L * 0.15)},${r1(by + bh - 7 * s)} ${r1(bx0)},${r1(by + bh)} Z`;
  const banner = `${wave} ${tail} ${bottom}`;
  const tp = `M${r1(bx1 + 6 * s)},${r1(by + bh / 2 + 2 * s + font * 0.36)} C${r1(mid + d * L * 0.15)},${r1(by + bh / 2 + 7 * s + font * 0.36)} ${r1(mid - d * L * 0.15)},${r1(by + bh / 2 - 9 * s + font * 0.36)} ${r1(bx0)},${r1(by + bh / 2 - 3 * s + font * 0.36)}`;
  return (
    <g>
      <ellipse className="r-gshadow" cx={r1(x)} cy={r1(y + 1)} rx={r1(10 * s)} ry={r1(2.5 * s)} />
      <path className="r-banner-sh" transform={`translate(${r1(1.5 * s)} ${r1(2.5 * s)})`} d={banner} />
      <path className="r-banner" d={banner} />
      <path id={`${idp}-bp`} d={tp} fill="none" />
      <text className="r-banner-text" style={{ fontSize: `${r1(font)}px` }}>
        <textPath href={`#${idp}-bp`} startOffset="50%" textAnchor="middle">{text}</textPath>
      </text>
      <rect className="r-pole" x={r1(x - 1.6 * s)} y={r1(top)} width={r1(3.2 * s)} height={r1(y - top + 1)} rx={r1(1.6 * s)} />
      <circle className="r-finial" cx={r1(x)} cy={r1(top - 2 * s)} r={r1(3.4 * s)} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* the static layers                                                  */
/* ------------------------------------------------------------------ */

export interface ArtLayers {
  sky: ReactNode;
  hillsA: ReactNode;
  hillB: ReactNode;
  hillC: ReactNode;
  hillD: ReactNode;
  front: ReactNode;
  fx: ReactNode;
  edge: ReactNode;
  flag: ReactNode;
  trailOf: (layer: Layer) => ReactNode;
}

export function buildArt(m: SceneModel, def: RanchSceneDef, idp: string, goalLabel: string): ArtLayers {
  const { comp, trail, crest } = m;
  const f = def.features;
  const u: Url = (n) => `url(#${idp}-${n})`;
  const R = rng(comp.seed);
  const { W, H } = comp;

  const pond = f.pond === 'left' ? comp.pondLeft : f.pond === 'right' ? comp.pondRight : null;
  const inPond = (x: number, y: number) =>
    !!pond && ((x - pond.cx) / (pond.rx + 10)) ** 2 + ((y - pond.cy) / (pond.ry + 7)) ** 2 < 1;
  const inAvoid = (x: number, y: number) => comp.avoid.some(([a, b, c, d]) => x > a && x < c && y > b && y < d);
  const blocked = (x: number, y: number, mgn = 6) => trail.near(x, y, mgn) || inAvoid(x, y) || inPond(x, y);

  /* sky */
  const [cx0, cy0, cx1, cy1] = [comp.copyBox.x0, comp.copyBox.y0, comp.copyBox.x1, comp.copyBox.y1];
  let starDots = '', starDim = '', star4 = '';
  const starN = Math.round(comp.starCount * f.stars);
  const starTop = crest.A1(W * 0.5) - 30;
  const starMaxY = f.celestial === 'winterMoon' ? starTop * 0.62 : starTop;
  for (let n = 0, g = 0; n < starN && g < 4000; g++) {
    const x = R() * W, y = R() * starMaxY;
    if (x > cx0 && x < cx1 && y > cy0 && y < cy1) continue;
    if (y > crest.A1(x) - 18) continue;
    if (R() < 0.12) {
      star4 += `M${r1(x)},${r1(y - 4.5)} Q${r1(x + 0.8)},${r1(y - 0.8)} ${r1(x + 4.5)},${r1(y)} Q${r1(x + 0.8)},${r1(y + 0.8)} ${r1(x)},${r1(y + 4.5)} Q${r1(x - 0.8)},${r1(y + 0.8)} ${r1(x - 4.5)},${r1(y)} Q${r1(x - 0.8)},${r1(y - 0.8)} ${r1(x)},${r1(y - 4.5)} Z`;
    } else {
      const d = circleD(x, y, 0.6 + R() * 1.1);
      if (R() < 0.5) starDots += d; else starDim += d;
    }
    n++;
  }
  const cloudSet = f.clouds === 'fluffy' ? comp.fluffyClouds : comp.clouds;
  const sky = (
    <g key="sky">
      <rect fill={u('sky')} x="-2" y="-2" width={W + 4} height={H + 4} />
      <ellipse fill={u('glow')} style={{ opacity: 'var(--r-glow-o)' }} cx={r1(comp.celestial.moon[0])} cy={r1(crest.A1(comp.celestial.moon[0]) + 10)} rx={r1(W * 0.55)} ry={r1(H * 0.36)} />
      {starN > 0 && (
        <g className="r-stars">
          <path d={starDots} />
          <path d={starDim} opacity=".55" />
          <path d={star4} />
        </g>
      )}
      <Celestial kind={f.celestial} at={comp.celestial[f.celestial]} u={u} />
      {cloudSet.map(([x, y, s], i) => (
        <g key={i} className={`r-cloud r-c${(i % 3) + 1}`}>
          <g transform={`translate(${r1(x)} ${r1(y)}) scale(${s})`}>
            <path className="r-cl-sh" d={CLOUD} />
            <path className="r-cl" transform="translate(5 -6) scale(.95)" d={CLOUD} />
          </g>
        </g>
      ))}
      {f.birds && (
        <path className="r-birds" d={comp.birds.map(([x, y, s]) => `M${r1(x - 7 * s)},${r1(y - 2 * s)} q${r1(3.5 * s)},${r1(-4 * s)} ${r1(7 * s)},${r1(2 * s)} q${r1(3.5 * s)},${r1(-6 * s)} ${r1(7 * s)},${r1(-2 * s)}`).join(' ')} strokeWidth="1.6" />
      )}
    </g>
  );

  const shapes = trailShapes(trail, comp.trail, comp.seed + 7);
  const trailOf = (layer: Layer): ReactNode => {
    const sh = shapes[layer];
    if (!sh) return null;
    return (
      <g key={`trail-${layer}`}>
        <path className="r-tr-edge" d={sh.edge} />
        <path className="r-tr-base" d={sh.base} />
        <path className="r-tr-hi" d={sh.hi} />
        {sh.pebbles && <path className="r-tr-peb" d={sh.pebbles} />}
      </g>
    );
  };
  const treesOf = (layer: string) =>
    comp.trees.map((t, i) => (t.layer === layer ? <Tree key={`t${i}`} t={t} kind={f.trees} i={i} snow={f.snow} /> : null));
  const rim = (ch: Cubic[]) => <path className="r-rim" d={chainD(ch)} />;

  const hillsA = (
    <g key="hA">
      <path fill={u('hA1')} d={hillD(comp.hills.A1, H)} />
      {rim(comp.hills.A1)}
      {treesOf('A')}
      <rect fill={u('haze')} x="0" y={r1(crest.A1(W / 2) - 30)} width={W} height="70" />
      <path fill={u('hA2')} d={hillD(comp.hills.A2, H)} />
      {rim(comp.hills.A2)}
    </g>
  );

  const hillB = (
    <g key="hB">
      <path fill={u('hB')} d={hillD(comp.hills.B, H)} />
      {rim(comp.hills.B)}
      {treesOf('B')}
      {comp.fenceB && <Fence ch={comp.fenceB} step={12} h0={20} depth={comp.depth} snow={f.snow} />}
    </g>
  );

  /* ground decoration in a band between two crests */
  const deco = (count: number, top: Crest, bot: (x: number) => number, x0: number, x1: number, rmax: number) => {
    const b = new Bloomer();
    let k = 0, g = 0;
    const n = f.groundDeco === 'sparkles' ? Math.round(count * 0.55) : count;
    while (k < n && g++ < count * 40) {
      const x = x0 + R() * (x1 - x0);
      const yt = top(x) + 6, yb = Math.min(H - 4, bot(x));
      if (yb <= yt) continue;
      const y = yt + R() * (yb - yt);
      if (blocked(x, y)) continue;
      const s = comp.depth(y);
      const r = Math.max(1.2, rmax * s * (0.7 + R() * 0.5));
      const kk = Math.floor(R() * 3);
      if (f.groundDeco === 'leaves') {
        if (R() < 0.12) b.flc += circleD(x, y, r * 0.55);
        else b.leaf(x, y, r * 0.95, kk, R() * Math.PI * 2);
      } else if (f.groundDeco === 'sparkles') {
        if (R() < 0.18 && s > 0.45) {
          b.fl2 += circleD(x - r * 0.3, y, r * 0.34) + circleD(x + r * 0.3, y + r * 0.1, r * 0.34);
          b.flc += circleD(x + r * 0.02, y - r * 0.42, r * 0.3);
        } else b.sparkle(x, y, r * 0.75);
      } else b.flower(x, y, r, kk);
      k++;
    }
    return b;
  };

  const hayPos = f.snowman ? null : comp.hay;
  const hillC = (
    <g key="hC">
      <path fill={u('hC')} d={hillD(comp.hills.C, H)} />
      {rim(comp.hills.C)}
      {treesOf('C')}
      {midRows(m, (x, y, k) => trail.near(x, y, k) || inAvoid(x, y))}
      {deco(comp.flowerCount[2], crest.B, crest.C, 0, W, 2.4).render('fC')}
      {deco(comp.flowerCount[1], crest.C, crest.D, 0, W, 4.4).render('fD')}
      {comp.fenceC && <Fence ch={comp.fenceC} step={22} h0={30} depth={comp.depth} snow={f.snow} />}
      {treesOf('behindBarn')}
      <Silo x={comp.silo[0]} y={comp.silo[1]} s={comp.silo[2]} snow={f.snow} />
      <Barn x={comp.barn[0]} y={comp.barn[1]} s={comp.barn[2]} u={u} f={f} />
      {hayPos && <Hay x={hayPos[0]} y={hayPos[1]} s={hayPos[2]} />}
      {f.extraHay && comp.extraHay.map(([x, y, s], i) => <Hay key={`eh${i}`} x={x} y={y} s={s} />)}
      {f.snowman && comp.id === 'wide' && <Snowman x={comp.snowman[0]} y={comp.snowman[1]} s={comp.snowman[2]} />}
    </g>
  );

  /* near hill: field, pond, ground decoration, tufts */
  const fieldNear = (x: number, y: number) => trail.near(x, y, 8) || inAvoid(x, y) || inPond(x, y);
  let field: ReactNode = null;
  if (f.field === 'lavender' || f.field === 'strawberry' || f.field === 'tulips' || f.field === 'wheat') field = fieldRows(m, f, fieldNear);
  else if (f.field === 'pumpkins') field = <Pumpkins key="pk" m={m} near={fieldNear} seed={comp.seed + 31} />;
  else if (f.field === 'drifts') {
    const pines = comp.id === 'wide'
      ? [[214, 560, 0.34], [262, 572, 0.28], [40, 548, 0.3], [150, 590, 0.42]]
      : [[146, 408, 0.17]];
    field = (
      <g key="drift">
        {pines.map(([x, y, s], i) => (blocked(x, y, 4) ? null : <Pine key={i} x={x} y={y} s={s} snow />))}
      </g>
    );
  }
  const frontStart = f.field === 'meadow' || f.field === 'drifts' || f.field === 'pumpkins' ? 0 : comp.rows.maxX * 0.7;
  const tufts = new Tufts();
  for (let k = 0, g = 0; k < 26 && g++ < 900;) {
    const x = R() * W, y = crest.D(x) + 8 + R() * (H - crest.D(x) - 16);
    if (blocked(x, y, 8)) continue;
    tufts.add(x, y, comp.depth(y) * 1.1);
    k++;
  }
  const hillD_ = (
    <g key="hD">
      <path fill={u('hD')} d={hillD(comp.hills.D, H)} />
      {rim(comp.hills.D)}
      {field}
      {pond && <Pond o={pond} lilies={f.lilies} u={u} seed={comp.seed + 3} />}
      {deco(comp.flowerCount[0], crest.D, () => H - 6, frontStart, W, 6.2).render('fF')}
      {f.groundDeco !== 'sparkles' && tufts.render('tu')}
      {f.snowman && comp.id === 'phone' && <Snowman x={comp.snowman[0]} y={comp.snowman[1]} s={comp.snowman[2]} />}
    </g>
  );

  const front = (
    <g key="front">
      {treesOf('D')}
      {trailOf('D')}
      {trailOf('top')}
    </g>
  );

  /* effects over everything but the ground edge */
  let fall: ReactNode = null;
  if (f.falling) {
    const n = comp.falling[f.falling === 'snow' ? 'snow' : f.falling === 'petals' ? 'petals' : 'leaves'];
    const FR = rng(comp.seed + 99);
    const layers: { d: string; cls: string; speed: string }[] = [
      { d: '', cls: 'r-fall1', speed: 'r-fall-slow' },
      { d: '', cls: 'r-fall2', speed: 'r-fall-mid' },
      { d: '', cls: 'r-fall3', speed: 'r-fall-fast' },
    ];
    const piece = (x: number, y: number, r: number) => {
      if (f.falling === 'snow') return circleD(x, y, r);
      const a = FR() * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const T = (dx: number, dy: number) => pt([x + dx * c - dy * s, y + dx * s + dy * c]);
      if (f.falling === 'petals') return `M${T(0, -r)} Q${T(r * 0.9, -r * 0.2)} ${T(0, r)} Q${T(-r * 0.9, -r * 0.2)} ${T(0, -r)}Z`;
      // maple leaf, simplified: five points
      return `M${T(0, -r)} L${T(r * 0.3, -r * 0.35)} L${T(r, -r * 0.45)} L${T(r * 0.5, 0)} L${T(r * 0.75, r * 0.6)} L${T(0, r * 0.3)} L${T(-r * 0.75, r * 0.6)} L${T(-r * 0.5, 0)} L${T(-r, -r * 0.45)} L${T(-r * 0.3, -r * 0.35)} Z`;
    };
    for (let i = 0; i < n; i++) {
      const L = i % 3;
      const x = FR() * W, y = FR() * H;
      const base = f.falling === 'snow' ? 1.2 + L * 0.9 : f.falling === 'petals' ? 3.4 + L * 1.2 : 6.5 + L * 2;
      layers[L].d += piece(x, y, base * (comp.id === 'phone' ? 0.85 : 1) * (0.8 + FR() * 0.4));
    }
    fall = (
      <g className={`r-fall r-fall-${f.falling}`}>
        {layers.map((l, i) => (
          <g key={i} className={`r-fall-lane ${l.speed}`}>
            <path className={l.cls} d={l.d} />
            <path className={l.cls} d={l.d} transform={`translate(0 ${-H})`} />
          </g>
        ))}
      </g>
    );
  }
  const fx = (
    <g key="fx">
      {f.fireflies && comp.fireflies.map(([x, y], i) => (
        <g key={i} className="r-fly" style={{ animationDelay: `${(i * 0.7) % 3.1}s` }}>
          <circle fill={u('ff')} cx={x} cy={y} r="10" />
          <circle className="r-ff-c" cx={x} cy={y} r="2.1" />
        </g>
      ))}
      {fall}
    </g>
  );
  const edge = <path key="edge" className="r-gedge" d={hillD(comp.edge, H + 4)} />;
  const flag = <Flag fg={m.flag} idp={idp} text={goalLabel} />;

  return { sky, hillsA, hillB, hillC, hillD: hillD_, front, fx, edge, flag, trailOf };
}
