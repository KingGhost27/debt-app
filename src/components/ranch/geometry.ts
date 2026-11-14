/**
 * Ranch scene geometry: pure math, no React.
 *
 * Bezier chains for hills and the trail, a seeded RNG so the scatter
 * (flowers, stars, pebbles) is identical on every render, and the trail
 * sampler that maps a progress percentage to a point on the path.
 */

export type P = [number, number];
export type Cubic = [P, P, P, P];
export type Layer = 'A' | 'B' | 'C' | 'D' | 'top';

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const pt = (p: P) => `${r1(p[0])},${r1(p[1])}`;

/** mulberry32: small, fast, deterministic. */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bz(c: Cubic, t: number): P {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [
    a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0],
    a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1],
  ];
}

function dbz(c: Cubic, t: number): P {
  const u = 1 - t;
  return [
    3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]),
    3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]),
  ];
}

/** Build a chain of cubics from a start point and [c1, c2, end] triples. */
export function chain(start: P, rest: [P, P, P][]): Cubic[] {
  const out: Cubic[] = [];
  let p = start;
  for (const [a, b, e] of rest) {
    out.push([p, a, b, e]);
    p = e;
  }
  return out;
}

export const chainD = (ch: Cubic[]) =>
  'M' + pt(ch[0][0]) + ch.map((c) => ` C${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`).join('');

/** A hill: the crest chain closed down to the bottom of the viewBox. */
export function hillD(ch: Cubic[], bottom: number) {
  const a = ch[0][0], z = ch[ch.length - 1][3];
  return `${chainD(ch)} L${r1(z[0])},${bottom} L${r1(a[0])},${bottom} Z`;
}

/** y of a hill crest at x (piecewise-linear over dense samples). */
export function crestFn(ch: Cubic[]) {
  const pts: P[] = [];
  for (const c of ch) for (let i = 0; i <= 80; i++) pts.push(bz(c, i / 80));
  pts.sort((a, b) => a[0] - b[0]);
  return (x: number) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][0] >= x) {
        const a = pts[i - 1], b = pts[i];
        const k = (x - a[0]) / (b[0] - a[0] || 1);
        return a[1] + (b[1] - a[1]) * k;
      }
    }
    return pts[pts.length - 1][1];
  };
}

/** Points spaced `step` apart along a chain. */
export function along(ch: Cubic[], step: number): P[] {
  const raw: P[] = [];
  for (const c of ch) for (let i = 0; i <= 120; i++) raw.push(bz(c, i / 120));
  const out: P[] = [raw[0]];
  let acc = 0;
  for (let i = 1; i < raw.length; i++) {
    acc += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
    if (acc >= step) {
      acc = 0;
      out.push(raw[i]);
    }
  }
  return out;
}

/* ---------------- circle / ellipse as path data (for merged layers) ---------------- */

export const circleD = (cx: number, cy: number, r: number) =>
  `M${r1(cx - r)},${r1(cy)}a${r1(r)},${r1(r)} 0 1,0 ${r1(2 * r)},0a${r1(r)},${r1(r)} 0 1,0 ${r1(-2 * r)},0Z`;

export const ellipseD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${r1(cx - rx)},${r1(cy)}a${r1(rx)},${r1(ry)} 0 1,0 ${r1(2 * rx)},0a${r1(rx)},${r1(ry)} 0 1,0 ${r1(-2 * rx)},0Z`;

/* ---------------- the trail ---------------- */

export interface TrailSeg { c: Cubic; w0: number; w1: number; layer: Layer }

/** One sample on the trail: position, unit tangent, width, arc length. */
export interface Smp { x: number; y: number; tx: number; ty: number; w: number; s: number; seg: number }

export interface Trail {
  all: Smp[];
  per: Smp[][];
  total: number;
  /** Trail point at a progress percentage (0..100), using the composition's anchors. */
  at: (pct: number) => Smp;
  /** Is (x, y) within `m` units of the trail's edge? */
  near: (x: number, y: number, m: number) => boolean;
}

const SEG_STEPS = 60;

/**
 * anchors: [pct, segment index, t], in rising pct. They may run either way
 * along the segments; the ranch walks them from the far end home to the barn.
 */
export function makeTrail(segs: TrailSeg[], anchors: [number, number, number][]): Trail {
  const per: Smp[][] = [];
  let s = 0;
  let prev: P | null = null;
  segs.forEach((g, gi) => {
    const arr: Smp[] = [];
    for (let i = 0; i <= SEG_STEPS; i++) {
      const t = i / SEG_STEPS;
      const p = bz(g.c, t), d = dbz(g.c, t), L = Math.hypot(d[0], d[1]) || 1;
      if (prev && i > 0) s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      const k = t * t * (3 - 2 * t);
      arr.push({ x: p[0], y: p[1], tx: d[0] / L, ty: d[1] / L, w: g.w0 + (g.w1 - g.w0) * k, s, seg: gi });
      prev = p;
    }
    per.push(arr);
  });
  const all: Smp[] = [];
  per.forEach((a, i) => a.forEach((q, j) => {
    if (i > 0 && j === 0) return;
    all.push(q);
  }));

  const sAtSegT = (seg: number, t: number) => {
    const a = per[seg];
    const i = Math.min(a.length - 2, Math.floor(t * SEG_STEPS));
    const k = t * SEG_STEPS - i;
    return a[i].s + (a[i + 1].s - a[i].s) * k;
  };
  const anchorS = anchors.map(([pct, seg, t]) => [pct, sAtSegT(seg, t)] as [number, number]);
  const pctToS = (pct: number) => {
    for (let i = 1; i < anchorS.length; i++) {
      if (anchorS[i][0] >= pct) {
        const a = anchorS[i - 1], b = anchorS[i];
        return a[1] + ((b[1] - a[1]) * (pct - a[0])) / (b[0] - a[0]);
      }
    }
    return anchorS[anchorS.length - 1][1];
  };
  const atS = (sv: number): Smp => {
    if (sv <= all[0].s) return all[0];
    for (let i = 1; i < all.length; i++) {
      if (all[i].s >= sv) {
        const a = all[i - 1], b = all[i], k = (sv - a.s) / (b.s - a.s || 1);
        const tx = a.tx + (b.tx - a.tx) * k, ty = a.ty + (b.ty - a.ty) * k, L = Math.hypot(tx, ty) || 1;
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, tx: tx / L, ty: ty / L, w: a.w + (b.w - a.w) * k, s: sv, seg: a.seg };
      }
    }
    return all[all.length - 1];
  };
  return {
    all,
    per,
    total: s,
    at: (pct) => atS(pctToS(Math.max(0, Math.min(100, pct)))),
    near: (x, y, m) => all.some((q) => Math.hypot(q.x - x, q.y - y) < q.w / 2 + m),
  };
}

/** Normal pointing to the trail's far side (toward smaller y). */
export function farNormal(q: Smp): P {
  const nx = -q.ty, ny = q.tx;
  return ny < 0 ? [nx, ny] : [-nx, -ny];
}

/** The three stacked ribbons (edge, base, highlight) for each trail layer, plus pebbles. */
export function trailShapes(trail: Trail, segs: TrailSeg[], seed: number) {
  const groups: { layer: Layer; pts: Smp[] }[] = [];
  segs.forEach((g, i) => {
    const last = groups[groups.length - 1];
    if (last && last.layer === g.layer) last.pts.push(...trail.per[i].slice(1));
    else groups.push({ layer: g.layer, pts: [...trail.per[i]] });
  });
  const R = rng(seed);
  const out: Partial<Record<Layer, { edge: string; base: string; hi: string; pebbles: string }>> = {};
  for (const gr of groups) {
    const poly = (kw: number, shift: number) => {
      const L: string[] = [], Rr: string[] = [];
      for (const q of gr.pts) {
        const nx = -q.ty, ny = q.tx;
        const [fx, fy] = farNormal(q);
        const cx = q.x + fx * q.w * shift, cy = q.y + fy * q.w * shift;
        L.push(pt([cx + (nx * q.w * kw) / 2, cy + (ny * q.w * kw) / 2]));
        Rr.push(pt([cx - (nx * q.w * kw) / 2, cy - (ny * q.w * kw) / 2]));
      }
      return 'M' + L.join(' L') + ' L' + Rr.reverse().join(' L') + ' Z';
    };
    let peb = '';
    for (const q of gr.pts) {
      if (q.w < 22 || R() > 0.16) continue;
      const nx = -q.ty, ny = q.tx;
      const off = (R() - 0.5) * q.w * 0.7;
      peb += ellipseD(q.x + nx * off, q.y + ny * off, 1 + R() * q.w * 0.05, 0.8 + R() * q.w * 0.028);
    }
    const prevG = out[gr.layer];
    const next = { edge: poly(1, 0), base: poly(0.84, 0.07), hi: poly(0.34, 0.16), pebbles: peb };
    out[gr.layer] = prevG
      ? { edge: prevG.edge + next.edge, base: prevG.base + next.base, hi: prevG.hi + next.hi, pebbles: prevG.pebbles + next.pebbles }
      : next;
  }
  return out;
}

/* ---------------- text width (layout estimate, no DOM) ---------------- */

/**
 * Approximate advance width of a label in em, tuned for Fredoka 600 /
 * Quicksand 700. Generous on purpose: boards and chips are sized from it.
 */
/** The goal sign hung over the barn door. */
export const GOAL_SIGN = 'Debt-free';

/**
 * The goal sign's rectangle in barn-local units for a barn drawn at scale
 * `s`. Its lettering (font size `sf`) stays at least ~11.5px however small
 * the barn is drawn.
 */
export function goalSignRect(s: number) {
  const sf = Math.max(15, 11.5 / s);
  const sw = textEm(GOAL_SIGN) * sf + sf * 1.5;
  const sh = sf * 1.5;
  return { sf, sw, sh, sx: 80 - sw / 2, sy: -85 };
}

export function textEm(s: string) {
  let w = 0;
  for (const ch of s) {
    if (/[ilj.,'’|!:;]/.test(ch)) w += 0.27;
    else if (ch === ' ') w += 0.26;
    else if (/[frt]/.test(ch)) w += 0.38;
    else if (/[mw]/.test(ch)) w += 0.82;
    else if (/[MW]/.test(ch)) w += 0.9;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else if (/[0-9$]/.test(ch)) w += 0.58;
    else if (ch === '·') w += 0.3;
    else w += 0.55;
  }
  return w;
}

/** Shorten a label to fit `max` characters with an ellipsis. */
export function clip(s: string, max: number) {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + '…';
}

export interface Box { x0: number; y0: number; x1: number; y1: number }
export const overlaps = (a: Box, b: Box, pad = 0) =>
  a.x0 < b.x1 + pad && a.x1 + pad > b.x0 && a.y0 < b.y1 + pad && a.y1 + pad > b.y0;
