/**
 * Pieces of the farm stand home page: the re-lettering date, the friends who
 * work the stand, the painted date sign, the bunting, the paint rack, the
 * garden-marker promises, the recipe-card FAQ and the price board.
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
import { THEME_METADATA } from '../../../lib/themes';
import { isThemeFree } from '../../../lib/tierLimits';
import { PLANS } from '../../../lib/plans';
import { ChalkPlus, MarkerBloom, PaintPot, Rosette, Sparkle } from './art';
import { STAND_ORDER, STAND_PALETTES, type StandTheme } from './palettes';
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

/** Paper bunting strung across the stand; one line also carries the path into "How it works". */
export function Bunting({ className = '' }: { className?: string }) {
  return (
    <div className={`fs-bunting ${className}`} aria-hidden="true">
      <svg className="fs-bunting-string" viewBox="0 0 1440 20" preserveAspectRatio="none">
        <path d="M0 4 Q 180 16 360 6 T 720 6 T 1080 6 T 1440 4" fill="none" stroke="var(--fs-wood-deep)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="fs-flags">
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} className="fs-flag" style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

const tier = (t: StandTheme) => (isThemeFree(t) ? 'free theme' : 'Pro theme');

/**
 * The paint rack on the counter front: one tin per app theme. Picking a tin
 * repaints the whole stand at once (native radios, so arrow keys move the pick).
 */
export function ThemeRack({ theme, onPick }: { theme: StandTheme; onPick: (t: StandTheme) => void }) {
  return (
    <fieldset className="fs-rack">
      <legend className="fs-sr">Paint the stand in an app theme</legend>
      <div className="fs-rack-in">
        <div className="fs-rack-sign" aria-hidden="true">
          <span className="fs-rack-title">Paint the stand</span>
          <span className="fs-rack-now">
            {THEME_METADATA[theme].name} · {tier(theme)}
          </span>
        </div>
        <div className="fs-pots">
          {STAND_ORDER.map((t) => (
            <label className={`fs-pot${t === theme ? ' is-on' : ''}`} key={t} title={THEME_METADATA[t].name}>
              <input type="radio" name="fs-theme" value={t} checked={t === theme} onChange={() => onPick(t)} className="fs-sr" />
              <PaintPot p={STAND_PALETTES[t]} />
              <span className="fs-sr">
                {THEME_METADATA[t].name}, {tier(t)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

const PROMISES = [
  { title: 'Both strategies, side by side', text: 'Snowball or avalanche: see which one frees you faster.' },
  { title: 'Private by default', text: 'No signup required. Your numbers never leave your browser.' },
  { title: 'Instant results', text: 'Real payoff math, not a vague estimate. Updates as you type.' },
];

/** The stand's three promises, painted on garden markers staked in the meadow. */
export function Promises() {
  return (
    <section className="fs-promises" aria-label="Why use the Cowculator">
      <ul className="fs-markers">
        {PROMISES.map((m, i) => (
          <li className="fs-marker" key={m.title}>
            <MarkerBloom className="fs-marker-bloom" kind={i as 0 | 1 | 2} />
            <div className="fs-marker-board">
              <strong className="fs-marker-title">{m.title}</strong>
              <span className="fs-marker-text">{m.text}</span>
            </div>
            <span className="fs-marker-stake" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Questions on recipe cards, taped up with washi tape. One opens at a time (native details). */
export function FaqCards({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <section id="faq" className="fs-faq" aria-labelledby="fs-faq-title">
      <h2 id="fs-faq-title" data-cb-sparkle>
        Questions?
      </h2>
      <div className="fs-cards">
        {faqs.map((f, i) => (
          <details className="fs-card" name="fs-faq" open={i === 0} key={f.q}>
            <summary>
              <span>{f.q}</span>
              <ChalkPlus className="fs-card-mark" />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * The stand's price board: the three Pro plans chalked up like a menu, read
 * from the same PLANS the in-app upgrade dialog uses. It only shows prices;
 * buying happens inside the app, so the tag opens the account page.
 */
export function PriceBoard({ onStart }: { onStart: () => void }) {
  return (
    <section className="fs-prices-wrap" aria-labelledby="fs-prices-title">
      <div className="fs-prices">
        <h2 id="fs-prices-title">Pro, if you want it</h2>
        <p className="fs-prices-free">Pro unlocks themes, asset tracking &amp; unlimited debts. The calculator is always free.</p>
        <ul className="fs-menu">
          {PLANS.map((p) => (
            <li className="fs-menu-row" key={p.id}>
              <span className="fs-menu-name">{p.name}</span>
              <span className="fs-leader" aria-hidden="true" />
              <span className="fs-menu-price">
                <b>{p.price}</b> <small>{p.period}</small>
              </span>
              {p.boardNotes.length > 0 && <span className="fs-menu-notes">{p.boardNotes.join(' · ')}</span>}
            </li>
          ))}
        </ul>
        <div className="fs-prices-cta">
          <button type="button" className="fs-tag fs-tag--gold fs-tag--big" onClick={onStart}>
            Make a free account
          </button>
        </div>
      </div>
    </section>
  );
}
