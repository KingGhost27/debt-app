/**
 * Signpost layout for the ranch trail.
 *
 * Each debt is a wooden post beside the trail at the point it gets paid
 * off. Near posts carry their name on the board itself. Posts too far
 * down the trail to letter legibly get a label chip at a fixed reading
 * size, placed where it collides with nothing (copy, bubble, friend,
 * barn, other labels). A label that cannot be placed cleanly is
 * dropped rather than shrunk: readable or absent, never tiny.
 */

import { clip, farNormal, goalSignRect, overlaps, textEm, type Box, type Layer, type Trail } from './geometry';
import type { Composition } from './compositions';

export type DebtStatus = 'paid' | 'focus' | 'upcoming';

export interface RanchDebt {
  id: string;
  name: string;
  /** Where the debt clears along the walk home: 0 = the far end of the trail, 1 = the barn. */
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
  hasBubble: boolean;
  /** Wide stage: the bubble sits under the friend's feet instead of over its head. */
  bubbleLow?: boolean;
  /** Area kept clear around the barn, silo and Debtsy. */
  keepOut: Box[];
}

const boardBox = (x: number, y: number, s: number, bx: number, bw: number, bh: number): Box => ({
  x0: x + bx * s, x1: x + (bx + bw) * s, y0: y - POST_H * s - 2 * s, y1: y + (-POST_H + bh) * s,
});

/** The walking friend shrinks with distance, but never below this share of its near size. */
export const FRIEND_MIN = 0.66;
export const friendScale = (comp: Composition, w: number) => Math.max(FRIEND_MIN, w / comp.wRef);

/**
 * The "you are here" pin floats over the friend's head. It shrinks less
 * than the friend does, so it still reads as a map pin out in the far hills.
 * `h` is its height; `tip` and `top` are y offsets from the friend's feet.
 * Right by the barn it steps sideways (`dx`, away from the barn) so it
 * never covers the goal sign over the door. Once the friend stands under
 * the sign there is no room left, and the pin bows out (`show` false):
 * the friend is visibly at the door by then.
 */
const PIN_MAX_STEP = 0.45;
export function pinFor(comp: Composition, q: { x: number; y: number }, sz: number) {
  const h = comp.friendSize * 0.26 + sz * 0.16;
  const tip = -sz * 0.95 - sz * 0.04;
  const half = h * 0.36;
  const [bx, by, bs] = comp.barn;
  const g = goalSignRect(bs);
  const pad = 3;
  const sign: Box = { x0: bx + g.sx * bs, y0: by + g.sy * bs, x1: bx + (g.sx + g.sw) * bs, y1: by + (g.sy + g.sh + 2.5) * bs };
  const pinBox: Box = { x0: q.x - half, y0: q.y + tip - h, x1: q.x + half, y1: q.y + tip };
  const step = overlaps(pinBox, sign, pad) ? sign.x1 + pad - pinBox.x0 : 0;
  const show = step <= sz * PIN_MAX_STEP;
  return { h, tip, top: show ? tip - h : -sz * 0.98, dx: show ? step : 0, half, show };
}

export function friendBoxAt(trail: Trail, comp: Composition, pct: number) {
  const q = trail.at(pct);
  const sz = comp.friendSize * friendScale(comp, q.w);
  const pin = pinFor(comp, q, sz);
  // The box covers the pin too, so labels and the bubble keep clear of it.
  const box: Box = {
    x0: q.x - sz * 0.42, y0: q.y + pin.top - 2,
    x1: pin.show ? Math.max(q.x + sz * 0.42, q.x + pin.dx + pin.half + 2) : q.x + sz * 0.42, y1: q.y + 2,
  };
  return { q, sz, pin, box };
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
  const obstacles: Box[] = [fb.box, ...inp.keepOut];
  // Lettering on a board must not hide behind the friend or Debtsy (keepOut[1]).
  const softs: Box[] = [fb.box, inp.keepOut[1]].filter(Boolean);
  if (comp.id === 'wide') obstacles.push(comp.copyBox);
  if (inp.hasBubble && comp.bubble.above) {
    if (inp.bubbleLow) {
      obstacles.push({ x0: fb.q.x - 36, y0: fb.q.y + 8, x1: fb.q.x - 36 + comp.bubble.w, y1: fb.q.y + 14 + comp.bubble.h });
    } else {
      const headY = fb.q.y + fb.pin.top;
      obstacles.push({ x0: fb.q.x - 36, y0: headY - 14 - comp.bubble.h, x1: fb.q.x - 36 + comp.bubble.w, y1: headY - 8 });
    }
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
    // Posts stop short of the barn door so the doorway and its herd stay clear,
    // but a debt still ahead never ends up behind the friend.
    const lim = d.status === 'paid' ? comp.postMax : Math.min(98.5, Math.max(comp.postMax, friendPct + 2));
    const pct0 = Math.max(1.5, Math.min(lim, d.position * 100));
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
      const q = trail.at(Math.max(1.5, Math.min(lim, pct)));
      const s = Math.max(0.3, q.w / comp.wRef) * comp.postScale;
      const forward: 1 | -1 = q.tx >= 0 ? 1 : -1;
      // Paid boards point back the way the friend came; the rest point ahead, toward the barn.
      const dir = (d.status === 'paid' ? -forward : forward) as 1 | -1;
      return { q, s, dir };
    };
    const lettered = at(pct0).s >= comp.boardTextMin;
    // Board alignments to try: centred over the post, then anchored ahead or behind it.
    const alignsFor = (bw: number, dir: 1 | -1) => d.status === 'paid'
      ? [dir < 0 ? -bw + 3 : -3, -bw / 2]
      : [-bw / 2 + dir * 6, dir > 0 ? -6 : -bw + 6, dir > 0 ? -bw + 6 : -6];
    const hitsHard = (b: Box) => taken.some((o) => overlaps(b, o, 2)) || (comp.id === 'wide' && overlaps(b, comp.copyBox, 0));
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
      // The last debt's post stands at the barn door, inside the keep-out. Its name
      // may sit on the barn wall (the chip has its own background) rather than go unlabelled.
      if (!placed.chip) {
        const barn = inp.keepOut[0];
        const freeAtBarn = (b: Box, pad = 3) => {
          const sf = comp.safe;
          if (b.x0 < sf.x0 || b.x1 > sf.x1 || b.y0 < sf.y0 || b.y1 > sf.y1) return false;
          const hard = [fb.box, ...inp.keepOut.filter((o) => o !== barn)];
          return !hard.some((o) => overlaps(b, o, pad)) && !taken.some((o) => overlaps(b, o, pad));
        };
        placed.chip = placeChip(comp, placed, label, freeAtBarn, Math.abs(q.ty) > 0.45, true);
      }
      if (placed.chip) taken.push(placed.chip.box);
    }
    out.push(placed);
  }
  return out;
}

function placeChip(comp: Composition, p: PlacedPost, text: string, free: (b: Box) => boolean, steep: boolean, allowBelow = false): PlacedChip | null {
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
  // Last resorts for a post boxed in by the barn and Debtsy: up on the barn wall, or under the post's foot.
  const fy = p.y + 8;
  const below: [Box, [number, number]][] = allowBelow ? [
    [{ x0: p.x - w / 2, y0: fy, x1: p.x + w / 2, y1: fy + h }, [p.x, p.y]],
    [{ x0: p.x - w + 14, y0: fy, x1: p.x + 14, y1: fy + h }, [p.x, p.y]],
    [{ x0: p.x - 14, y0: fy, x1: p.x - 14 + w, y1: fy + h }, [p.x, p.y]],
  ] : [];
  const higher: [Box, [number, number]][] = allowBelow ? [3, 4].flatMap((k): [Box, [number, number]][] => [
    [{ x0: ax - w / 2, y0: ay - k * (g + h), x1: ax + w / 2, y1: ay - k * (g + h) + h }, [ax, ay]],
    [{ x0: ax - 14, y0: ay - k * (g + h), x1: ax - 14 + w, y1: ay - k * (g + h) + h }, [ax, ay]],
  ]) : [];
  const cands = steep ? [...sides, ...above, ...high, ...higher, ...below] : [...above, ...sides, ...high, ...higher, ...below];
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
