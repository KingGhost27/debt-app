/**
 * Pieces of the farm stand home page: the re-lettering date, the friends who
 * work the stand, the painted date sign and the bunting.
 *
 * The re-lettering is adapted from 21st.dev "Text Roll" (#19782 by
 * cnippet-dev), rebuilt in CSS so it needs no motion library.
 */

import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import {
  BooBoo,
  ChaiBear,
  CherryKitty,
  LiloOtter,
  LunaBunny,
  MapleFox,
  MochiFrog,
  ShadowBunny,
  SunshineChick,
} from '../../ui/mascots';
import { DebtsyCow } from '../../ui/DebtsyCow';
import { Rosette, Sparkle } from './art';
import { useSettled } from './useSettled';

type MascotProps = { size?: number; className?: string; animated?: boolean };

const FRIENDS = {
  Debtsy: DebtsyCow,
  Luna: LunaBunny,
  BooBoo,
  Shadow: ShadowBunny,
  Lilo: LiloOtter,
  Sunshine: SunshineChick,
  Cherry: CherryKitty,
  Mochi: MochiFrog,
  Chai: ChaiBear,
  Maple: MapleFox,
} satisfies Record<string, ComponentType<MascotProps>>;

export type FriendName = keyof typeof FRIENDS;

type Roll = { from: string; to: string; n: number; done: boolean };

// A plain space would collapse inside its letter box; a no-break space keeps the gap.
const nb = (ch: string) => (ch === ' ' ? '\u00A0' : ch);

/**
 * Letters that roll over like a sign painter's flip board when the text changes.
 * Unchanged letters stay put; changed ones roll out and the new ones roll in, one after another.
 */
export function RollText({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [roll, setRoll] = useState<Roll>({ from: '', to: text, n: 0, done: false });
  // A new text starts a new roll (state derived from the prop during render, not in an effect).
  if (roll.to !== text) setRoll({ from: roll.to, to: text, n: roll.n + 1, done: false });

  // Once the letters have landed, drop the old ones so the DOM holds only the current text.
  useEffect(() => {
    if (roll.done) return;
    const ms = (roll.n === 0 ? startDelay * 1000 : 0) + Math.max(roll.from.length, roll.to.length) * 34 + 700;
    const t = window.setTimeout(() => setRoll((r) => (r.n === roll.n ? { ...r, from: r.to, done: true } : r)), ms);
    return () => window.clearTimeout(t);
  }, [roll.n, roll.done, roll.from.length, roll.to.length, startDelay]);

  if (roll.done) {
    // Same letter boxes as the roll, so nothing shifts when it settles.
    return (
      <span className="fs-roll" key={roll.n}>
        {roll.to.split('').map((ch, i) => (
          <span className="fs-roll-slot" aria-hidden="true" key={i}>
            <span className="fs-roll-keep">{nb(ch)}</span>
          </span>
        ))}
        <span className="fs-sr">{roll.to}</span>
      </span>
    );
  }
  const len = Math.max(roll.from.length, roll.to.length);
  return (
    <span className="fs-roll" key={roll.n} style={{ '--d0': `${roll.n === 0 ? startDelay : 0}s` } as CSSProperties}>
      {Array.from({ length: len }, (_, i) => {
        const a = roll.from[i] ?? '';
        const b = roll.to[i] ?? '';
        const keep = roll.n > 0 && a === b;
        return (
          <span className="fs-roll-slot" aria-hidden="true" key={i} style={{ '--i': i } as CSSProperties}>
            {!keep && a && <span className="fs-roll-out">{nb(a)}</span>}
            <span className={keep ? 'fs-roll-keep' : 'fs-roll-in'}>{nb(b)}</span>
          </span>
        );
      })}
      <span className="fs-sr">{roll.to}</span>
    </span>
  );
}

/** A RollText that waits for typing to settle before it re-letters. */
export function SettledRoll({ text }: { text: string }) {
  return <RollText text={useSettled(text)} startDelay={1.1} />;
}

/** One of the friends, working the stand. Tap to make them hop. */
export function Friend({
  name,
  i = 0,
  className = '',
  children,
  paws,
}: {
  name: FriendName;
  i?: number;
  className?: string;
  children?: ReactNode;
  paws?: { fill: string; edge: string };
}) {
  const Comp = FRIENDS[name];
  const [hops, setHops] = useState(0);
  return (
    <span
      className={`fs-friend cb-body ${className}`}
      data-friend={name}
      role="img"
      aria-label={name}
      style={{ '--i': i } as CSSProperties}
      onClick={() => setHops((h) => h + 1)}
    >
      <span className="fs-friend-head" key={hops} data-hop={hops > 0 ? '' : undefined}>
        <Comp size={96} animated={false} />
      </span>
      {paws && (
        <span className="fs-paws" aria-hidden="true" style={{ '--paw': paws.fill, '--paw-edge': paws.edge } as CSSProperties}>
          <span key={`l${hops}`} data-hop={hops > 0 ? '' : undefined} />
          <span key={`r${hops}`} data-hop={hops > 0 ? '' : undefined} />
        </span>
      )}
      {children}
    </span>
  );
}

const SPARKS: { top: string; left: string; size: number; d: string }[] = [
  { top: '-14px', left: '12%', size: 22, d: '0s' },
  { top: '18%', left: '96%', size: 16, d: '.9s' },
  { top: '78%', left: '-3%', size: 18, d: '1.6s' },
  { top: '92%', left: '70%', size: 14, d: '.4s' },
];

/** The painted "Debt-free by" sign on the counter: the answer to the board. */
export function DateSign({ dateText, hasDate, empty, className }: { dateText: string; hasDate: boolean; empty: boolean; className: string }) {
  return (
    <div className={`fs-date ${className}`}>
      <Rosette className="fs-rosette" />
      {SPARKS.map((s, k) => (
        <Sparkle key={k} size={s.size} className="fs-tw" style={{ top: s.top, left: s.left, '--tw': s.d } as CSSProperties} />
      ))}
      {empty ? (
        <p className="fs-date-empty">Fill in at least one debt to see your plan</p>
      ) : (
        <>
          {hasDate && <p className="fs-date-label">Debt-free by</p>}
          <p className="fs-date-value" data-cb-date aria-live="polite">
            <RollText text={dateText} startDelay={1.0} />
          </p>
        </>
      )}
      <span className="fs-easel" aria-hidden="true" />
    </div>
  );
}

const FLAG_COLORS = ['#F2789F', '#F6C75B', '#FFF4F7', '#A8DCC6', '#DCC0F7', '#E46A95'];

/** Paper bunting strung across the stand; one line also carries the path into "How it works". */
export function Bunting({ className = '' }: { className?: string }) {
  return (
    <div className={`fs-bunting ${className}`} aria-hidden="true">
      <svg className="fs-bunting-string" viewBox="0 0 1440 20" preserveAspectRatio="none">
        <path d="M0 4 Q 180 16 360 6 T 720 6 T 1080 6 T 1440 4" fill="none" stroke="#9A6238" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="fs-flags">
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} className="fs-flag" style={{ background: FLAG_COLORS[i % FLAG_COLORS.length], '--i': i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
