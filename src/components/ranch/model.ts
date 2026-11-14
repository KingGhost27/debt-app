/**
 * Ranch scene model: the trail and hill crests for one composition. Pure
 * data, shared by the layers, the signpost layout and the walk animation.
 *
 * The trail is walked home: progress 0% is its far end out in the hills and
 * 100% is the barn door, where the other friends are waiting. `trail.at()`
 * takes that progress and returns a point whose tangent faces the barn.
 */

import { crestFn, makeTrail, type Trail } from './geometry';
import type { Composition } from './compositions';

type Crest = (x: number) => number;
type HillKey = 'A1' | 'A2' | 'B' | 'C' | 'D';

export interface SceneModel {
  comp: Composition;
  trail: Trail;
  crest: Record<HillKey, Crest>;
}

export function makeModel(comp: Composition): SceneModel {
  const drawn = makeTrail(comp.trail, comp.anchors);
  // The segments are drawn from the barn outward; walking home runs the other way.
  const trail: Trail = {
    ...drawn,
    at: (pct) => {
      const q = drawn.at(pct);
      return { ...q, tx: -q.tx, ty: -q.ty };
    },
  };
  const crest = {
    A1: crestFn(comp.hills.A1), A2: crestFn(comp.hills.A2), B: crestFn(comp.hills.B),
    C: crestFn(comp.hills.C), D: crestFn(comp.hills.D),
  };
  return { comp, trail, crest };
}
