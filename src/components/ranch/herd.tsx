/**
 * The barn friends. The theme's own friend walks the trail home; everyone
 * else waits for them in the open barn: three in the doorway, four behind,
 * and one peeking out of the hayloft. Drawn in the barn's local units
 * (door opening x 35–125, y −88–0; hayloft window x 62–98, y −174–−139).
 */

import type { RanchFriend } from '../../lib/ranchScenes';
import { FRIENDS, barnHerd } from './friends';
import { r1 } from './geometry';

/** Feet at (x, y), mascot box `size` units square; the art's feet sit ~95% down the box. */
function Critter({ who, x, y, size, flip }: { who: RanchFriend; x: number; y: number; size: number; flip?: boolean }) {
  const M = FRIENDS[who];
  const tx = flip ? `translate(${r1(x + size / 2)} ${r1(y - size * 0.95)}) scale(-1 1)` : `translate(${r1(x - size / 2)} ${r1(y - size * 0.95)})`;
  return (
    <g transform={tx} data-herd={who}>
      <M size={size} animated={false} />
    </g>
  );
}

/** Doorway crowd, clipped to the door opening by the caller. */
export function DoorwayHerd({ active }: { active: RanchFriend }) {
  const { back, front } = barnHerd(active);
  const backX = [44, 66, 94, 116];
  const frontX = [50, 80, 110];
  return (
    <g className="r-herd">
      {back.map((who, i) => (
        <Critter key={who} who={who} x={backX[i]} y={-19} size={36} flip={i >= 2} />
      ))}
      <ellipse className="r-herd-floor" cx="80" cy="-1" rx="46" ry="5" />
      {front.map((who, i) => (
        <Critter key={who} who={who} x={frontX[i]} y={2} size={46} flip={i === 2} />
      ))}
    </g>
  );
}

/** The friend in the hayloft, clipped to the window by the caller. */
export function LoftHerd({ active }: { active: RanchFriend }) {
  const { loft } = barnHerd(active);
  return (
    <g className="r-herd">
      <Critter who={loft} x={80} y={-136} size={34} />
    </g>
  );
}
