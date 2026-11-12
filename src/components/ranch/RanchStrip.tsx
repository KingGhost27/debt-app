/**
 * RanchStrip — the slim ranch band at the top of every non-dashboard page.
 *
 * It reuses the scene's palette (RANCH_SCENES art vars), its sky and hill
 * layers (buildArt) and its fence, on a squashed copy of the wide
 * composition so sky, hills, a bit of fence and the theme's friend all fit
 * in about 150px. The art is decorative (aria-hidden). Children (title,
 * actions) are laid over it by the caller.
 */

import { useId, useMemo, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import {
  BooBoo, ChaiBear, CherryKitty, LiloOtter, LunaBunny, MapleFox, MochiFrog, ShadowBunny, SunshineChick,
} from '../ui/mascots';
import { RANCH_SCENES, ranchArtVars, type RanchFriend, type RanchSceneKey } from '../../lib/ranchScenes';
import { WIDE, type Composition } from './compositions';
import { Defs } from './art';
import { Fence, buildArt } from './layers';
import { makeModel } from './model';
import { chainD, hillD, r1, type Cubic } from './geometry';

type MascotProps = { size?: number; className?: string; animated?: boolean };

const FRIENDS: Record<RanchFriend, ComponentType<MascotProps>> = {
  LunaBunny, BooBoo, ShadowBunny, LiloOtter, SunshineChick, CherryKitty, MochiFrog, ChaiBear, MapleFox,
};

/* squash the wide composition's hills toward a baseline so they fit a short band */
const BASE = 318;
const K = 0.3;
const sq = (ch: Cubic[]): Cubic[] =>
  ch.map((c) => c.map(([x, y]) => [x, r1(BASE + (y - BASE) * K)]) as Cubic);

/** The sky is drawn this far below its own coordinates so stars and the orb land in the visible band. */
const SKY_SHIFT = 100;
/** Visible window of the 1300-wide stage. */
const VIEW_Y = 225;
const VIEW_H = 160;

const orb = ([, , s]: [number, number, number]): [number, number, number] => [820, 178, s * 0.8];

const STRIP: Composition = {
  ...WIDE,
  hills: { A1: sq(WIDE.hills.A1), A2: sq(WIDE.hills.A2), B: sq(WIDE.hills.B), C: sq(WIDE.hills.C), D: sq(WIDE.hills.D) },
  trees: [],
  fenceC: null,
  fenceB: null,
  birds: [],
  clouds: [[470, 128, 0.7], [1010, 150, 0.5], [640, 190, 0.45]],
  fluffyClouds: [[480, 116, 0.95], [1020, 140, 0.7], [660, 196, 0.6]],
  starCount: 420,
  copyBox: { x0: 0, y0: 0, x1: 0, y1: 0 },
  celestial: {
    moon: orb(WIDE.celestial.moon), sun: orb(WIDE.celestial.sun), crescent: orb(WIDE.celestial.crescent),
    sunrise: orb(WIDE.celestial.sunrise), sunset: orb(WIDE.celestial.sunset),
    softSun: orb(WIDE.celestial.softSun), winterMoon: orb(WIDE.celestial.winterMoon),
  },
  depth: () => 0.55,
};

const FENCE: Cubic[] = STRIP.hills.C.slice(2, 4);
const FRIEND_X = 640;
const FRIEND_SIZE = 62;

export function RanchStrip({ sceneKey, children }: { sceneKey: RanchSceneKey; children?: ReactNode }) {
  const idp = 'rst' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const def = RANCH_SCENES[sceneKey] ?? RANCH_SCENES.default;
  const Friend = FRIENDS[def.friend];
  const model = useMemo(() => makeModel(STRIP, ''), []);
  const art = useMemo(() => buildArt(model, def, idp, ''), [model, def, idp]);
  const fy = model.crest.C(FRIEND_X) + 6;
  const snow = def.features.snow;

  return (
    <header
      className={`ranch rui-strip${def.ui.scheme === 'dark' ? ' ranch-night' : ''}`}
      style={ranchArtVars(def.art) as CSSProperties}
      data-scene={def.key}
    >
      <svg
        className="rui-strip-art"
        viewBox={`0 ${VIEW_Y} ${STRIP.W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        <Defs idp={idp} />
        <g transform={`translate(0 ${SKY_SHIFT})`}>{art.sky}</g>
        {art.hillsA}
        {art.hillB}
        <path fill={`url(#${idp}-hC)`} d={hillD(STRIP.hills.C, STRIP.H)} />
        <path className="r-rim" d={chainD(STRIP.hills.C)} />
        <Fence ch={FENCE} step={26} h0={34} depth={() => 0.9} snow={snow} />
        <g transform={`translate(${FRIEND_X} ${r1(fy)})`}>
          <ellipse className="r-gshadow" cx="0" cy="1" rx={r1(FRIEND_SIZE * 0.33)} ry={r1(FRIEND_SIZE * 0.07)} />
          <g transform={`translate(${r1(-FRIEND_SIZE / 2)} ${r1(-FRIEND_SIZE * 0.95)})`}>
            <Friend size={FRIEND_SIZE} animated={false} />
          </g>
        </g>
      </svg>
      {children}
    </header>
  );
}
