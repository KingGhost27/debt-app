/**
 * Ranch scene model: the trail, hill crests and flag geometry for one
 * composition. Pure data, shared by the layers, the signpost layout and
 * the walk animation.
 */

import { crestFn, makeTrail, textEm, type Box, type Trail } from './geometry';
import type { Composition } from './compositions';

type Crest = (x: number) => number;
type HillKey = 'A1' | 'A2' | 'B' | 'C' | 'D';

export interface SceneModel {
  comp: Composition;
  trail: Trail;
  crest: Record<HillKey, Crest>;
  flag: FlagGeom;
}

export interface FlagGeom { x: number; y: number; s: number; font: number; len: number; boxes: Box[] }

export function makeModel(comp: Composition, goalLabel: string): SceneModel {
  const trail = makeTrail(comp.trail, comp.anchors);
  const crest = {
    A1: crestFn(comp.hills.A1), A2: crestFn(comp.hills.A2), B: crestFn(comp.hills.B),
    C: crestFn(comp.hills.C), D: crestFn(comp.hills.D),
  };
  const end = trail.at(100);
  const s = comp.flag.s;
  const font = comp.id === 'wide' ? 16 : 12.5;
  const len = Math.max(comp.flag.bannerLen, textEm(goalLabel) * font + 40 * s);
  const top = end.y - 78 * s;
  const by = top + 6 * s;
  const bh = Math.max(24 * s, font * 1.55);
  const boxes = [
    { x0: end.x - len - 4, y0: by - 9 * s, x1: end.x + 6 * s, y1: by + bh + 10 * s },
    { x0: end.x - 4 * s, y0: top - 6 * s, x1: end.x + 4 * s, y1: end.y + 2 },
  ];
  return { comp, trail, crest, flag: { x: end.x, y: end.y, s, font, len, boxes } };
}
