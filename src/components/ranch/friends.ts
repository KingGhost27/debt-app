/**
 * The barn friends: one per theme. The theme's own friend walks the trail
 * home; `barnHerd` picks where everyone else waits in the barn.
 */

import type { ComponentType } from 'react';
import {
  BooBoo, ChaiBear, CherryKitty, LiloOtter, LunaBunny, MapleFox, MochiFrog, ShadowBunny, SunshineChick,
} from '../ui/mascots';
import type { RanchFriend } from '../../lib/ranchScenes';

type MascotProps = { size?: number; className?: string; animated?: boolean };

export const FRIENDS: Record<RanchFriend, ComponentType<MascotProps>> = {
  LunaBunny, BooBoo, ShadowBunny, LiloOtter, SunshineChick, CherryKitty, MochiFrog, ChaiBear, MapleFox,
};

/** Who peeks from the hayloft when free; the rest fill the doorway in this order (back row first). */
const LOFT_PICK: RanchFriend[] = ['SunshineChick', 'MochiFrog'];
const ORDER: RanchFriend[] = [
  'ChaiBear', 'LiloOtter', 'ShadowBunny', 'MapleFox',
  'CherryKitty', 'LunaBunny', 'BooBoo', 'MochiFrog', 'SunshineChick',
];

/** Everyone but the walking friend: one in the hayloft, four at the back of the doorway, three in front. */
export function barnHerd(active: RanchFriend) {
  const others = ORDER.filter((f) => f !== active);
  const loft = LOFT_PICK.find((f) => f !== active) ?? others[others.length - 1];
  const rest = others.filter((f) => f !== loft);
  return { loft, back: rest.slice(0, 4), front: rest.slice(4, 7) };
}
