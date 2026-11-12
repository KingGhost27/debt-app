/**
 * RanchScene — the dashboard's illustrated ranch.
 *
 * The trail from the barn to the debt-free flag is the user's real
 * progress: the theme's friend stands on it at `paidShare`, each debt is
 * a signpost where it gets paid off, and Debtsy grazes by the barn. Every
 * theme preset is its own time of day or season (see lib/ranchScenes).
 *
 * Layout: a wide 1300×600 stage at container widths ≥ 768px and a
 * dedicated 390×420 phone stage below that. `children` sit in the sky
 * (greeting, headline); `actions` sit in the sky on wide and under the
 * art on phones. The art is decorative (aria-hidden); a text alternative
 * summarizes progress for assistive tech.
 *
 * Walk the trail: pass `walk={{ id, from }}` with a new id after logging a
 * payment. The friend hops from `from` to the current `paidShare` and a
 * flower pops up where it set off. Under prefers-reduced-motion the end
 * state appears at once.
 */

import { useEffect, useId, useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { DebtsyCow } from '../ui/DebtsyCow';
import {
  BooBoo, ChaiBear, CherryKitty, LiloOtter, LunaBunny, MapleFox, MochiFrog, ShadowBunny, SunshineChick,
} from '../ui/mascots';
import { RANCH_SCENES, ranchArtVars, type RanchFriend, type RanchSceneKey } from '../../lib/ranchScenes';
import { PHONE, WIDE, type Composition } from './compositions';
import { Bloom, Chip, Defs, Signpost } from './art';
import { buildArt } from './layers';
import { makeModel, type SceneModel } from './model';
import { friendBoxAt, layoutPosts, type PlacedPost, type RanchDebt } from './signposts';
import { r1 } from './geometry';
import './ranch.css';

export type { RanchDebt, DebtStatus } from './signposts';

type MascotProps = { size?: number; className?: string; animated?: boolean };

const FRIENDS: Record<RanchFriend, ComponentType<MascotProps>> = {
  LunaBunny, BooBoo, ShadowBunny, LiloOtter, SunshineChick, CherryKitty, MochiFrog, ChaiBear, MapleFox,
};

export interface RanchWalk {
  /** Change this to play the walk once. */
  id: string | number;
  /** Paid share (0–1) the friend sets off from. */
  from: number;
}

export interface RanchSceneProps {
  /** Scene for the active theme: `sceneKeyForPreset(theme.preset)`. */
  sceneKey: RanchSceneKey;
  /** Share of the original total that has been paid, 0–1. */
  paidShare: number;
  /** Debts as signposts along the trail. */
  debts: RanchDebt[];
  /** Flag text at the end of the trail. Only include a date the plan backs. */
  goalLabel?: string;
  /** The friend's speech bubble. */
  friendLine?: ReactNode;
  /** Plays the walk-the-trail move when `walk.id` changes. */
  walk?: RanchWalk | null;
  onWalkEnd?: () => void;
  /** Sky copy: greeting, headline, summary line. */
  children?: ReactNode;
  /** Primary action row ("Log a payment"). */
  actions?: ReactNode;
  /** Overrides the generated text alternative. */
  summary?: string;
  className?: string;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
const WALK_MS = 860;

interface Stage {
  comp: Composition;
  model: SceneModel;
}

export function RanchScene({
  sceneKey, paidShare, debts, goalLabel = 'Debt-free', friendLine, walk, onWalkEnd, children, actions, summary, className,
}: RanchSceneProps) {
  const idp = 'rs' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const def = RANCH_SCENES[sceneKey] ?? RANCH_SCENES.default;
  const share = clamp01(paidShare);
  const Friend = FRIENDS[def.friend];

  /* walk state, derived from the `walk` prop without effects */
  const [seenWalk, setSeenWalk] = useState(walk?.id);
  const [active, setActive] = useState<RanchWalk | null>(null);
  const [blooms, setBlooms] = useState<{ key: string; at: number; pop: boolean }[]>([]);
  if (walk && walk.id !== seenWalk) {
    setSeenWalk(walk.id);
    const from = clamp01(walk.from);
    setActive({ id: walk.id, from });
    setBlooms((b) => [...b.slice(-5).map((x) => ({ ...x, pop: false })), { key: String(walk.id), at: from, pop: true }]);
  }
  const restShare = active ? active.from : share;

  const stages = useMemo<Stage[]>(
    () => [WIDE, PHONE].map((comp) => ({ comp, model: makeModel(comp, goalLabel) })),
    [goalLabel],
  );
  const art = useMemo(
    () => stages.map((st) => buildArt(st.model, def, `${idp}-${st.comp.id}`, goalLabel)),
    [stages, def, idp, goalLabel],
  );
  const hasBubble = friendLine != null && friendLine !== false;
  const posts = useMemo(
    () => stages.map((st) => layoutPosts({
      comp: st.comp, trail: st.model.trail, debts, friendPct: restShare * 100, friendSize: st.comp.friendSize,
      flagBoxes: st.model.flag.boxes, hasBubble, keepOut: keepOutFor(st.comp),
    })),
    [stages, debts, restShare, hasBubble],
  );

  /* the walk itself: transform the friend groups directly, once per frame */
  const friendRefs = useRef<(SVGGElement | null)[]>([]);
  const innerRefs = useRef<(SVGGElement | null)[]>([]);
  const target = useRef(share);
  const onEnd = useRef(onWalkEnd);
  useEffect(() => {
    target.current = share;
    onEnd.current = onWalkEnd;
  });
  useEffect(() => {
    if (!active) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;
    const finish = () => {
      flushSync(() => setActive(null));
      innerRefs.current.forEach((g) => g?.removeAttribute('transform'));
      onEnd.current?.();
    };
    const frame = (now: number) => {
      const p = reduce ? 1 : Math.min(1, (now - t0) / WALK_MS);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const hop = Math.sin(Math.min(1, p / 0.82) * Math.PI);
      const sq = p < 0.12 ? (p / 0.12) * 0.6 : p > 0.82 ? Math.sin(((p - 0.82) / 0.18) * Math.PI) : 0;
      const pct = (active.from + (target.current - active.from) * Math.min(1, e / 0.98)) * 100;
      stages.forEach((st, i) => {
        const g = friendRefs.current[i], inner = innerRefs.current[i];
        if (!g || !inner) return;
        const q = st.model.trail.at(pct);
        const sz0 = friendBoxAt(st.model.trail, st.comp, active.from * 100).sz;
        const sz = st.comp.friendSize * Math.max(0.5, q.w / st.comp.wRef);
        const k = sz / sz0;
        g.setAttribute('transform', `translate(${q.x.toFixed(2)} ${q.y.toFixed(2)})`);
        inner.setAttribute('transform', `translate(0 ${(-hop * sz * 0.4).toFixed(2)}) scale(${(k * (1 + sq * 0.08)).toFixed(3)} ${(k * (1 - sq * 0.12)).toFixed(3)})`);
      });
      if (p < 1) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, stages]);

  /* text alternative */
  const text = summary ?? describe(def.moment, share, debts, goalLabel);

  /* bubble anchor: friend head on wide (bubble above), feet on phone (bubble below) */
  const fw = friendBoxAt(stages[0].model.trail, WIDE, restShare * 100);
  const fp = friendBoxAt(stages[1].model.trail, PHONE, restShare * 100);
  const style = {
    ...ranchArtVars(def.art),
    '--bxw': r1(fw.q.x), '--byw': r1(fw.q.y - fw.sz * 0.95),
    '--bxp': r1(fp.q.x), '--byp': r1(fp.q.y),
  } as CSSProperties;

  return (
    <section className={`ranch${def.ui.scheme === 'dark' ? ' ranch-night' : ''}${className ? ` ${className}` : ''}`} style={style} data-scene={def.key}>
      <div className="ranch-layer">
        {stages.map((st, i) => {
          const a = art[i];
          const sid = `${idp}-${st.comp.id}`;
          const ps = posts[i];
          const on = (layer: string) => ps.filter((p) => (layer === 'D' ? p.layer === 'D' || p.layer === 'top' : p.layer === layer));
          const post = (p: PlacedPost) => <Signpost key={p.id} p={p} comp={st.comp} snow={def.features.snow} />;
          const f = friendBoxAt(st.model.trail, st.comp, restShare * 100);
          const [dx, dy, dsz, drot] = st.comp.debtsy;
          const debtsy = (
            <g className="r-debtsy" transform={`rotate(${drot} ${dx} ${dy})`}>
              <ellipse className="r-gshadow" cx={dx} cy={r1(dy + 1)} rx={r1(dsz * 0.36)} ry={r1(dsz * 0.06)} />
              <g transform={`translate(${r1(dx - dsz / 2)} ${r1(dy - dsz * 0.95)})`}>
                <DebtsyCow size={dsz} animated={false} />
              </g>
            </g>
          );
          return (
            <svg
              key={st.comp.id}
              className={`ranch-art ranch-art-${st.comp.id}`}
              viewBox={`0 0 ${st.comp.W} ${st.comp.H}`}
              preserveAspectRatio="xMidYMax slice"
              aria-hidden="true"
              focusable="false"
            >
              <Defs idp={sid} />
              {a.sky}
              {a.hillsA}
              {a.trailOf('A')}
              {a.flag}
              {on('A').map(post)}
              {a.hillB}
              {a.trailOf('B')}
              {on('B').map(post)}
              {a.hillC}
              {a.trailOf('C')}
              {on('C').map(post)}
              {!st.comp.debtsyFront && debtsy}
              {a.hillD}
              {st.comp.debtsyFront && debtsy}
              {a.front}
              {on('D').map(post)}
              {blooms.map((b) => {
                const bq = st.model.trail.at(b.at * 100);
                const bs = (st.comp.friendSize * Math.max(0.5, bq.w / st.comp.wRef)) / 78;
                return <Bloom key={b.key} x={bq.x - 22 * bs} y={bq.y - bq.w * 0.5 + 1} s={bs} pop={b.pop} />;
              })}
              <g ref={(el) => { friendRefs.current[i] = el; }} transform={`translate(${r1(f.q.x)} ${r1(f.q.y)})`}>
                <g ref={(el) => { innerRefs.current[i] = el; }}>
                  {def.features.friendGlow && <ellipse fill={`url(#${sid}-fglow)`} cx="0" cy={r1(-f.sz * 0.45)} rx={r1(f.sz * 0.85)} ry={r1(f.sz * 0.75)} />}
                  <ellipse className="r-gshadow" cx="0" cy="1" rx={r1(f.sz * 0.33)} ry={r1(f.sz * 0.07)} />
                  <g transform={`translate(${r1(-f.sz / 2)} ${r1(-f.sz * 0.95)})`}>
                    <Friend size={r1(f.sz)} animated={false} />
                  </g>
                </g>
              </g>
              {a.fx}
              {ps.map((p) => <Chip key={p.id} p={p} comp={st.comp} idp={sid} />)}
              {a.edge}
            </svg>
          );
        })}
      </div>
      {hasBubble && <p className={`ranch-bubble${active ? ' is-hushed' : ''}`}>{friendLine}</p>}
      <div className="ranch-sky">
        {children != null && <div className="ranch-copy">{children}</div>}
        {actions != null && <div className="ranch-act">{actions}</div>}
      </div>
      <p className="ranch-sr">{text}</p>
    </section>
  );
}

/** Keep labels off the barn, silo and Debtsy. */
function keepOutFor(comp: Composition) {
  const [bx, by, bs] = comp.barn;
  const [dx, dy, dsz] = comp.debtsy;
  return [
    { x0: bx - 12 * bs, y0: by - 270 * bs, x1: bx + 310 * bs, y1: by + 4 },
    { x0: dx - dsz * 0.5, y0: dy - dsz, x1: dx + dsz * 0.5, y1: dy + 4 },
  ];
}

function describe(moment: string, share: number, debts: RanchDebt[], goal: string) {
  const pct = Math.round(share * 100);
  const names = (s: RanchDebt['status']) => debts.filter((d) => d.status === s).sort((a, b) => a.position - b.position).map((d) => d.name);
  const paid = names('paid'), focus = names('focus'), ahead = names('upcoming');
  const parts = [`Ranch at ${moment}. Your friend is ${pct}% of the way along the trail to the flag: ${goal}.`];
  if (paid.length) parts.push(`Paid off: ${paid.join(', ')}.`);
  if (focus.length) parts.push(`Working on now: ${focus.join(', ')}.`);
  if (ahead.length) parts.push(`Still ahead: ${ahead.join(', ')}.`);
  if (!debts.length) parts.push('No debts on the trail yet.');
  return parts.join(' ');
}
