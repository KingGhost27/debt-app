/**
 * Signpost layout for the ranch trail.
 *
 * Each debt is a wooden post beside the trail at the point it gets paid
 * off. Near posts carry their name on the board itself. Posts too far
 * down the trail to letter legibly get a label chip at a fixed reading
 * size, placed where it collides with nothing (copy, bubble, friend,
 * flag, barn, other labels). A label that cannot be placed cleanly is
 * dropped rather than shrunk: readable or absent, never tiny.
 */

import { clip, farNormal, overlaps, textEm, type Box, type Layer, type Trail } from './geometry';
import type { Composition } from './compositions';

export type DebtStatus = 'paid' | 'focus' | 'upcoming';

export interface RanchDebt {
  id: string;
  name: string;
  /** Where the debt clears along the trail: 0 = barn, 1 = the debt-free flag. */
  position: number;
  status: DebtStatus;
  /** Short line for the focus debt's hang tag, e.g. "$640 left". */
  detail?: string;
}

export interface PlacedChip { box: Box; text: string; anchor: [number, number]; from: [number, number] }

export interface PlacedPost {
  id: string;
  status: DebtStatus;
  layer: Layer;
  x: number;
  y: number;
  s: number;
  dir: 1 | -1;
  /** Board geometry in the post's local units (before scale). */
  bx: number;
  bw: number;
  bh: number;
  boardText: string | null;
  tag: string | null;
  /** Where the tag hangs, in local units (under the board's middle). */
  tagX: number;
  chip: PlacedChip | null;
}

/** Board top in local units (the post is 62 units tall to the board top). */
export const POST_H = 62;
const MAX_LABEL = 16;

export interface LayoutInput {
  comp: Composition;
  trail: Trail;
  debts: RanchDebt[];
  friendPct: number;
  friendSize: number;
  /** Banner and pole of the debt-free flag. */
  flagBoxes: Box[];
  hasBubble: boolean;
  /** Area kept clear around the barn, silo and Debtsy. */
  keepOut: Box[];
}

const boardBox = (x: number, y: number, s: number, bx: number, bw: number, bh: number): Box => ({
  x0: x + bx * s, x1: x + (bx + bw) * s, y0: y - POST_H * s - 2 * s, y1: y + (-POST_H + bh) * s,
});

export function friendBoxAt(trail: Trail, comp: Composition, pct: number) {
  const q = trail.at(pct);
  const sz = comp.friendSize * Math.max(0.5, q.w / comp.wRef);
  return { q, sz, box: { x0: q.x - sz * 0.42, y0: q.y - sz * 0.98, x1: q.x + sz * 0.42, y1: q.y + 2 } as Box };
}

export function layoutPosts(inp: LayoutInput): PlacedPost[] {
  const { comp, trail, friendPct } = inp;
  const cap = comp.id === 'wide' ? 8 : 6;

  // Who gets a post: the focus debt, then the nearest upcoming ones, then the most recent paid ones.
  const focus = inp.debts.filter((d) => d.status === 'focus');
  const upcoming = inp.debts.filter((d) => d.status === 'upcoming').sort((a, b) => a.position - b.position);
  const paid = inp.debts.filter((d) => d.status === 'paid').sort((a, b) => b.position - a.position);
  const chosen = [...focus, ...upcoming, ...paid].slice(0, cap);

  const fb = friendBoxAt(trail, comp, friendPct);
  const obstacles: Box[] = [...inp.flagBoxes, fb.box, ...inp.keepOut];
  // Lettering on a board must not hide behind the friend or Debtsy (keepOut[1]).
  const softs: Box[] = [fb.box, inp.keepOut[1]].filter(Boolean);
  if (comp.id === 'wide') obstacles.push(comp.copyBox);
  if (inp.hasBubble && comp.bubble.above) {
    const headY = fb.q.y - fb.sz * 0.95;
    obstacles.push({ x0: fb.q.x - 36, y0: headY - 14 - comp.bubble.h, x1: fb.q.x - 36 + comp.bubble.w, y1: headY - 8 });
  }
  const taken: Box[] = [];
  const free = (b: Box, pad = 3) => {
    const sf = comp.safe;
    if (b.x0 < sf.x0 || b.x1 > sf.x1 || b.y0 < sf.y0 || b.y1 > sf.y1) return false;
    return !obstacles.some((o) => overlaps(b, o, pad)) && !taken.some((o) => overlaps(b, o, pad));
  };

  const out: PlacedPost[] = [];
  const bh = Math.round(comp.boardFont * 1.72);
  for (const d of chosen) {
    const pct0 = Math.max(1.5, Math.min(98.5, d.position * 100));
    const label = clip(d.name, MAX_LABEL);
    const tag = d.status === 'focus' && d.detail ? clip(d.detail, 18) : null;
    const fullW = textEm(label) * comp.boardFont + 26;
    const tw = tag ? textEm(tag) * comp.chipFont * 0.92 + 18 : 0;
    // A post may slide a little along the trail, away from the friend, without changing what it says:
    // paid posts only slide back (still behind), the rest only slide ahead (still ahead).
    const away = d.status === 'paid' ? -1 : 1;
    const onRightSide = (pct0 - friendPct) * away >= 0;
    const nudges = onRightSide ? [0, 1.5, 3, 4.5, 6].map((n) => pct0 + n * away) : [pct0];
    const at = (pct: number) => {
      const q = trail.at(Math.max(1.5, Math.min(98.5, pct)));
      const s = Math.max(0.3, q.w / comp.wRef) * comp.postScale;
      const forward: 1 | -1 = q.tx >= 0 ? 1 : -1;
      // Paid boards point back toward the barn; the rest point ahead.
      const dir = (d.status === 'paid' ? -forward : forward) as 1 | -1;
      return { q, s, dir };
    };
    const lettered = at(pct0).s >= comp.boardTextMin;
    // Board alignments to try: centred over the post, then anchored ahead or behind it.
    const alignsFor = (bw: number, dir: 1 | -1) => d.status === 'paid'
      ? [dir < 0 ? -bw + 3 : -3, -bw / 2]
      : [-bw / 2 + dir * 6, dir > 0 ? -6 : -bw + 6, dir > 0 ? -bw + 6 : -6];
    const hitsHard = (b: Box) => taken.some((o) => overlaps(b, o, 2)) || inp.flagBoxes.some((o) => overlaps(b, o, 2)) || (comp.id === 'wide' && overlaps(b, comp.copyBox, 0));
    const hitsSoft = (b: Box) => softs.some((o) => overlaps(b, o, 1));

    const make = (pct: number, side: 1 | -1, bxOf: (bw: number, dir: 1 | -1) => number, bw: number, text: boolean): PlacedPost => {
      const { q, s, dir } = at(pct);
      const [fx, fy] = farNormal(q);
      const off = q.w / 2 + 7 * s;
      const bx = bxOf(bw, dir);
      return {
        id: d.id, status: d.status, layer: comp.trail[q.seg].layer,
        x: q.x + fx * off * side, y: q.y + fy * off * side, s, dir, bx, bw, bh,
        boardText: text ? label : null, tag: text ? tag : null, tagX: bx + bw / 2, chip: null,
      };
    };
    const boxesOf = (p: PlacedPost) => {
      const bb = boardBox(p.x, p.y, p.s, p.bx, p.bw, p.bh);
      const out: Box[] = [bb];
      if (p.tag) {
        const cx = p.x + p.tagX * p.s;
        out.push({ x0: cx - (tw * p.s) / 2, x1: cx + (tw * p.s) / 2, y0: bb.y1, y1: bb.y1 + (8 + comp.chipFont * 1.5) * p.s });
      }
      return out;
    };

    let placed: PlacedPost | null = null;
    if (lettered) {
      search: for (const pct of nudges) {
        for (const side of [1, -1] as const) {
          const n = alignsFor(fullW, at(pct).dir).length;
          for (let k = 0; k < n; k++) {
            const cand = make(pct, side, (bw, dir) => alignsFor(bw, dir)[k], fullW, true);
            const boxes = boxesOf(cand);
            if (boxes.some(hitsHard) || boxes.some(hitsSoft)) continue;
            placed = cand;
            taken.push(...boxes);
            break search;
          }
        }
      }
    }
    // Too far to letter, or lettering would be hidden: a blank board, labelled with a chip.
    placed ??= make(pct0, 1, (bw, dir) => alignsFor(bw, dir)[0], 30, false);
    const q = at(pct0).q;

    if (!placed.boardText) {
      const text = d.status === 'focus' && d.detail ? `${label} · ${clip(d.detail, 14)}` : label;
      placed.chip = placeChip(comp, placed, text, free, Math.abs(q.ty) > 0.45);
      if (placed.chip) taken.push(placed.chip.box);
    }
    out.push(placed);
  }
  return out;
}

function placeChip(comp: Composition, p: PlacedPost, text: string, free: (b: Box) => boolean, steep: boolean): PlacedChip | null {
  const f = comp.chipFont;
  const icon = p.status === 'paid' ? f * 0.95 : 0;
  const w = textEm(text) * f + f * 1.25 + icon;
  const h = f * 1.62;
  const bb = boardBox(p.x, p.y, p.s, p.bx, p.bw, p.bh);
  const ax = (bb.x0 + bb.x1) / 2, ay = bb.y0;
  const mid = (bb.y0 + bb.y1) / 2;
  const g = 7;
  const above: [Box, [number, number]][] = [
    [{ x0: ax - w / 2, y0: ay - g - h, x1: ax + w / 2, y1: ay - g }, [ax, ay]],
    [{ x0: ax - w + 14, y0: ay - g - h, x1: ax + 14, y1: ay - g }, [ax, ay]],
    [{ x0: ax - 14, y0: ay - g - h, x1: ax - 14 + w, y1: ay - g }, [ax, ay]],
  ];
  // Beside the board, sliding up and down a little to find a gap.
  const sides: [Box, [number, number]][] = [g, g + 16].flatMap((gg) => [0, -8, 8, -16, 16, -24, 24].flatMap((dy): [Box, [number, number]][] => [
    [{ x0: bb.x0 - gg - w, y0: mid + dy - h / 2, x1: bb.x0 - gg, y1: mid + dy + h / 2 }, [bb.x0, mid]],
    [{ x0: bb.x1 + gg, y0: mid + dy - h / 2, x1: bb.x1 + gg + w, y1: mid + dy + h / 2 }, [bb.x1, mid]],
  ]));
  const high: [Box, [number, number]][] = [
    [{ x0: ax - w / 2, y0: ay - 2 * g - 2 * h, x1: ax + w / 2, y1: ay - 2 * g - h }, [ax, ay]],
    [{ x0: ax - w + 14, y0: ay - 2 * g - 2 * h, x1: ax + 14, y1: ay - 2 * g - h }, [ax, ay]],
    [{ x0: ax - 14, y0: ay - 2 * g - 2 * h, x1: ax - 14 + w, y1: ay - 2 * g - h }, [ax, ay]],
  ];
  // On a steep stretch posts stack vertically, so labels go beside them first.
  const cands = steep ? [...sides, ...above, ...high] : [...above, ...sides, ...high];
  for (const [box, anchor] of cands) {
    if (!free(box)) continue;
    // Leader starts at the chip edge nearest the anchor.
    const from: [number, number] = [
      Math.max(box.x0 + 8, Math.min(box.x1 - 8, anchor[0])),
      anchor[1] <= box.y0 ? box.y0 : anchor[1] >= box.y1 ? box.y1 : (box.y0 + box.y1) / 2,
    ];
    if (anchor[0] < box.x0) from[0] = box.x0;
    else if (anchor[0] > box.x1) from[0] = box.x1;
    return { box, text, anchor, from };
  }
  return null;
}
