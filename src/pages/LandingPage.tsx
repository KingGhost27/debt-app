/**
 * LandingPage: the public home page at /, "The Farm Stand".
 *
 * A roadside flower-and-berry stand whose chalkboard is the free calculator:
 * the visitor's debts are written on the board, and the painted "Debt-free by"
 * sign on the counter is the answer. Real payoff math, no signup.
 *
 * The cursor, trail and tap pops are the shared stardust layer
 * (src/components/landing/delight, adapted from 21st.dev #44750).
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { generatePayoffPlan } from '../lib/calculations';
import type { Debt, PayoffMilestone } from '../types';
import { DebtsyCow } from '../components/ui/DebtsyCow';
import { Stardust } from '../components/landing/delight/Stardust';
import { celebrateCloser } from '../components/landing/delight/stardust';
import {
  AppleCrate,
  BerryPint,
  Bouquet,
  ChalkArrow,
  ChalkLoop,
  ChalkPlus,
  ChalkX,
  FlowerBucket,
  FlowerSpray,
  HangingBasket,
  HoneyJar,
  Meadow,
  Register,
  RoseCluster,
  Sparkle,
  WateringCan,
} from '../components/landing/stand/art';
import { Bunting, DateSign, Friend, SettledRoll } from '../components/landing/stand/parts';
import { useSettled } from '../components/landing/stand/useSettled';
// Card scenes: ChatGPT image generation from prompts written for this page; provenance beside the files.
import snowballArt from '../components/landing/stand/img/snowball.webp';
import avalancheArt from '../components/landing/stand/img/avalanche.webp';
import '../components/landing/stand/stand.css';

type DraftDebt = { id: string; name: string; balance: string; apr: string; minimumPayment: string };

const blankDebt = (): DraftDebt => ({ id: uuidv4(), name: '', balance: '', apr: '', minimumPayment: '' });

// Sample entries, editable. Chosen so snowball and avalanche give different dates out of the box.
const seedDebts = (): DraftDebt[] => [
  { id: uuidv4(), name: 'Credit Card', balance: '6800', apr: '24', minimumPayment: '170' },
  { id: uuidv4(), name: 'Car Loan', balance: '3900', apr: '6.9', minimumPayment: '240' },
];

// The engine wants timestamps on a Debt; drafts never persist as debts, so one stamp per load is enough.
const DRAFT_STAMP = new Date().toISOString();

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const asDate = (iso: string) => new Date(iso.slice(0, 10) + 'T00:00:00');
const monthYear = (iso: string, month: 'long' | 'short' = 'long') =>
  asDate(iso).toLocaleDateString('en-US', { month, year: 'numeric' });
const monthIndex = (iso: string) => {
  const d = asDate(iso);
  return d.getFullYear() * 12 + d.getMonth();
};

export function LandingPage() {
  const navigate = useNavigate();
  const [debts, setDebts] = useState<DraftDebt[]>(seedDebts);
  const [extraFunding, setExtraFunding] = useState('200');
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const firstInput = useRef<HTMLInputElement>(null);

  // Smooth in-page scrolling and the overscroll color belong to this page only.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('fs-html');
    return () => root.classList.remove('fs-html');
  }, []);

  const validDebts: Debt[] = useMemo(() => {
    const out: Debt[] = [];
    for (const d of debts) {
      const balance = parseFloat(d.balance);
      const apr = parseFloat(d.apr);
      const minimumPayment = parseFloat(d.minimumPayment);
      if (!balance || balance <= 0) continue;
      if (isNaN(apr) || apr < 0) continue;
      if (!minimumPayment || minimumPayment <= 0) continue;
      out.push({
        id: d.id,
        name: d.name || 'Debt',
        category: 'credit_card',
        balance,
        originalBalance: balance,
        apr,
        minimumPayment,
        dueDay: 1,
        createdAt: DRAFT_STAMP,
        updatedAt: DRAFT_STAMP,
      });
    }
    return out;
  }, [debts]);

  const totalMinimums = validDebts.reduce((s, d) => s + d.minimumPayment, 0);
  const extra = Math.max(0, parseFloat(extraFunding) || 0);
  const monthlyFunding = totalMinimums + extra;

  const plans = useMemo(() => {
    if (validDebts.length === 0) return null;
    const run = (s: 'snowball' | 'avalanche') =>
      generatePayoffPlan(validDebts, {
        strategy: s,
        recurringFunding: { amount: monthlyFunding, dayOfMonth: 1, extraAmount: extra },
        oneTimeFundings: [],
      });
    return { snowball: run('snowball'), avalanche: run('avalanche') };
  }, [validDebts, monthlyFunding, extra]);

  const plan = plans ? plans[strategy] : null;
  const order: PayoffMilestone[] = useMemo(
    () => (plan ? plan.steps.flatMap((s) => s.milestonesInStep).sort((a, b) => a.payoffDate.localeCompare(b.payoffDate)) : []),
    [plan],
  );
  const stalled = plan?.stalledDebts ?? [];
  const dateText = plan ? (plan.debtFreeDate ? monthYear(plan.debtFreeDate) : 'Never pays off') : '';
  const shownDate = useSettled(dateText);
  const avalancheSaves = plans ? Math.max(0, plans.snowball.totalInterest - plans.avalanche.totalInterest) : 0;

  // A debt-free date that lands at least a month sooner gets a little celebration.
  const settledIso = useSettled(plan?.debtFreeDate ?? null, 450);
  const lastIso = useRef<string | null>(null);
  useEffect(() => {
    const before = lastIso.current;
    lastIso.current = settledIso;
    if (before && settledIso && monthIndex(before) - monthIndex(settledIso) >= 1) celebrateCloser();
  }, [settledIso]);

  const update = (id: string, field: keyof DraftDebt, value: string) =>
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  const addDebt = () => setDebts((prev) => (prev.length >= 5 ? prev : [...prev, blankDebt()]));
  const removeDebt = (id: string) => setDebts((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== id) : prev));
  // Drafts are already in localStorage; the signup flow reads them and seeds the new account.
  const savePlan = () => navigate('/auth?from=landing');
  const signIn = () => navigate('/auth');
  const toBoard = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => firstInput.current?.focus({ preventScroll: true }), 450);
  };

  const empty = validDebts.length === 0;
  const hasDate = !!plan?.debtFreeDate;

  return (
    <div className="fs-page">
      <Stardust ink="#7A1F45" theme="#F2789F" accent="#F6C75B" />

      <header className="fs-awning">
        <div className="fs-valance">
          <a className="fs-name" href="#top">
            <DebtsyCow size={40} animated={false} />
            <span>Cowculator</span>
          </a>
          <nav className="fs-nav" aria-label="Main">
            <a className="fs-tag fs-tag--milk" href="#how-it-works">How it works</a>
            <button type="button" className="fs-tag fs-tag--gold" onClick={signIn}>Sign in</button>
          </nav>
        </div>
        <div className="fs-stripes" />
        <div className="fs-scallop" />
        <HangingBasket className="fs-basket fs-basket--l" />
        <HangingBasket className="fs-basket fs-basket--r" />
      </header>
      <Bunting />

      <main id="top">
        <section className="fs-stand" aria-label="Free debt payoff calculator">
          {(['l', 'r'] as const).map((side) => (
            <div className={`fs-post fs-post--${side}`} aria-hidden="true" key={side}>
              {['6%', '30%', '54%', '78%'].map((top, k) => (
                <RoseCluster key={top} className="fs-rose" flip={(k % 2 === 1) !== (side === 'r')} style={{ top }} />
              ))}
            </div>
          ))}
          <div className="fs-stage">
            <div className="fs-sign-col">
              <Friend name="Shadow" i={0} className="fs-peek fs-peek--sign" paws={{ fill: '#FFFFFF', edge: '#7C3AED' }} />
              <div className="fs-sign">
                <FlowerSpray className="fs-spray fs-spray--tl" />
                <FlowerSpray className="fs-spray fs-spray--br" variant="b" />
                <Sparkle size={20} className="fs-tw" style={{ top: '16%', right: '9%', '--tw': '.3s' } as CSSProperties} />
                <Sparkle size={14} className="fs-tw" style={{ top: '30%', right: '18%', '--tw': '1.4s' } as CSSProperties} />
                <Sparkle size={16} className="fs-tw" style={{ top: '47%', right: '6%', '--tw': '2.1s' } as CSSProperties} />
                <h1>Free debt payoff calculator</h1>
                <p className="fs-sign-copy">
                  <strong>No signup. No credit card.</strong> Compare the snowball and avalanche methods, see your debt-free
                  date in seconds, and find out exactly how much interest you'll save.
                </p>
                <div className="fs-sign-actions">
                  <button type="button" className="fs-tag fs-tag--gold fs-tag--big cb-glint" onClick={savePlan}>
                    Save my plan — free
                  </button>
                  <a className="fs-tag fs-tag--milk fs-tag--big" href="#board" onClick={toBoard}>
                    Try the Cowculator
                  </a>
                </div>
                <p className="fs-fine">Pro unlocks themes, asset tracking &amp; unlimited debts. The calculator is always free.</p>
              </div>
            </div>

            <DateSign className="fs-date--phone" dateText={shownDate} hasDate={hasDate} empty={empty} />

            <div className="fs-board-col">
              <Friend name="Sunshine" i={1} className="fs-peek fs-peek--board" paws={{ fill: '#FDE68A', edge: '#D9A400' }} />
              <Friend name="Cherry" i={2} className="fs-peek fs-peek--side" />
              <form className="fs-board" id="board" aria-label="Your debts" onSubmit={(e) => e.preventDefault()}>
                <div className="fs-board-head">
                  <h2 className="fs-board-title">Your debts</h2>
                  <span className="fs-count">{debts.length} / 5</span>
                </div>
                <div className="fs-cols" aria-hidden="true">
                  <span>Name</span>
                  <span>Balance</span>
                  <span>APR %</span>
                  <span>Min payment</span>
                  <span />
                </div>
                <ul className="fs-rows">
                  {debts.map((d, i) => {
                    const label = d.name || `Debt ${i + 1}`;
                    return (
                      <li className="fs-row" key={d.id}>
                        <label className="fs-field fs-field--name">
                          <span className="fs-mini">Name</span>
                          <input
                            ref={i === 0 ? firstInput : undefined}
                            type="text"
                            value={d.name}
                            onChange={(e) => update(d.id, 'name', e.target.value)}
                            placeholder={`Debt ${i + 1} (e.g. Visa)`}
                            aria-label={`Debt ${i + 1} name`}
                          />
                        </label>
                        <label className="fs-field">
                          <span className="fs-mini">Balance</span>
                          <span className="fs-affix">$</span>
                          <input type="number" inputMode="decimal" value={d.balance} onChange={(e) => update(d.id, 'balance', e.target.value)} placeholder="5000" aria-label={`${label} balance`} />
                        </label>
                        <label className="fs-field">
                          <span className="fs-mini">APR %</span>
                          <input type="number" inputMode="decimal" value={d.apr} onChange={(e) => update(d.id, 'apr', e.target.value)} placeholder="22" aria-label={`${label} APR %`} />
                        </label>
                        <label className="fs-field">
                          <span className="fs-mini">Min payment</span>
                          <span className="fs-affix">$</span>
                          <input type="number" inputMode="decimal" value={d.minimumPayment} onChange={(e) => update(d.id, 'minimumPayment', e.target.value)} placeholder="125" aria-label={`${label} min payment`} />
                        </label>
                        {debts.length > 1 ? (
                          <button type="button" className="fs-remove" onClick={() => removeDebt(d.id)} aria-label={`Remove ${label}`}>
                            <ChalkX />
                          </button>
                        ) : (
                          <span className="fs-remove-gap" />
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="fs-mid">
                  <button type="button" className="fs-add" onClick={addDebt} disabled={debts.length >= 5}>
                    <ChalkPlus /> Add another debt
                  </button>

                  <div className="fs-extra-wrap">
                    <label className="fs-extra">
                      <span className="fs-extra-label">Extra you can pay each month (on top of minimums)</span>
                      <span className="fs-extra-input">
                        <span className="fs-affix">$</span>
                        <input type="number" inputMode="decimal" value={extraFunding} onChange={(e) => setExtraFunding(e.target.value)} placeholder="200" />
                        <span className="fs-per">/ month</span>
                      </span>
                    </label>
                    <p className="fs-total">
                      Total monthly payment: <b>{money(monthlyFunding)}</b>
                      {totalMinimums > 0 && (
                        <> ({money(totalMinimums)} minimums + {money(extra)} extra)</>
                      )}
                    </p>
                  </div>
                </div>

                <svg className="fs-chalkline" viewBox="0 0 600 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 6 C 120 2, 260 8, 380 4 S 560 6, 596 4" stroke="#F4F0E6" strokeOpacity=".55" strokeWidth="2" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>

                <div className="fs-result">
                  <fieldset className="fs-strategy">
                    <legend className="fs-sr">Payoff strategy</legend>
                    {(['snowball', 'avalanche'] as const).map((s) => (
                      <label className={`fs-strat${strategy === s ? ' is-on' : ''}`} key={s}>
                        <input type="radio" name="fs-strategy" value={s} checked={strategy === s} onChange={() => setStrategy(s)} className="fs-sr" />
                        <span className="fs-strat-name">{s === 'snowball' ? 'Snowball' : 'Avalanche'}</span>
                        <span className="fs-strat-hint">{s === 'snowball' ? 'Smallest balance first' : 'Highest APR first'}</span>
                        {strategy === s && <ChalkLoop className="fs-loop" />}
                      </label>
                    ))}
                  </fieldset>

                  <div className="fs-result-list">
                    {empty ? (
                      <p className="fs-empty">Fill in at least one debt to see your plan</p>
                    ) : (
                      <ol className="fs-order">
                        {order.map((m, i) => (
                          <li className="fs-order-row" key={m.debtId}>
                            <span className="fs-order-n">{i + 1}</span>
                            <span className="fs-order-name">{m.debtName}</span>
                            <span className="fs-leader" aria-hidden="true" />
                            <span className="fs-order-date">
                              <SettledRoll text={monthYear(m.payoffDate, 'short')} />
                            </span>
                            {i < order.length - 1 + stalled.length && <ChalkArrow className="fs-arrow" />}
                          </li>
                        ))}
                        {stalled.map((s, i) => (
                          <li className="fs-order-row" key={s.debtId}>
                            <span className="fs-order-n">{order.length + i + 1}</span>
                            <span className="fs-order-name">{s.debtName}</span>
                            <span className="fs-leader" aria-hidden="true" />
                            <span className="fs-order-date">Never pays off</span>
                          </li>
                        ))}
                      </ol>
                    )}
                    {plans && (
                      <p className="fs-saves">
                        Avalanche saves you <b>{money(avalancheSaves)}</b> in interest, vs snowball
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="fs-counter">
            <div className="fs-shelf">
              <div className="fs-group fs-group--left">
                <Friend name="Luna" i={0}>
                  <FlowerBucket className="fs-prop" />
                </Friend>
                <Friend name="Mochi" i={1}>
                  <BerryPint className="fs-prop" />
                </Friend>
                <Friend name="Debtsy" i={2} className="fs-friend--wide">
                  <Register className="fs-prop" />
                </Friend>
                <Friend name="Maple" i={3}>
                  <AppleCrate className="fs-prop" />
                </Friend>
              </div>
              <div className="fs-group fs-group--right">
                <DateSign className="fs-date--desk" dateText={shownDate} hasDate={hasDate} empty={empty} />
                <Friend name="BooBoo" i={4}>
                  <Bouquet className="fs-prop" />
                </Friend>
                <Friend name="Chai" i={5}>
                  <HoneyJar className="fs-prop" />
                </Friend>
                <Friend name="Lilo" i={6}>
                  <WateringCan className="fs-prop" />
                </Friend>
              </div>
            </div>
            <div className="fs-ledge" />
            <div className="fs-front" />
          </div>
          <Meadow className="fs-meadow" />
        </section>

        <section id="how-it-works" className="fs-how" aria-labelledby="fs-how-title">
          <Bunting className="fs-bunting--path" />
          <h2 id="fs-how-title" data-cb-sparkle>
            Snowball vs Avalanche — what's the difference?
          </h2>
          <p className="fs-how-lede">
            Both methods work. They just attack your debts in a different order — and that order changes how fast you finish
            and how much interest you pay.
          </p>
          <div className="fs-packets">
            <article className="fs-packet">
              <div className="fs-packet-art">
                <img src={snowballArt} alt="" width={1200} height={800} loading="lazy" decoding="async" />
              </div>
              <h3>Snowball</h3>
              <p className="fs-packet-tag">Smallest balance first</p>
              <p>
                You pay the minimum on every debt, but throw all your extra money at your <strong>smallest balance</strong>. Once
                it's gone, you "roll" that payment onto the next-smallest. Quick wins build momentum.
              </p>
              <p className="fs-best">
                <strong>Best for:</strong> people who need motivation and small wins to stay in the game.
              </p>
            </article>
            <article className="fs-packet fs-packet--b">
              <div className="fs-packet-art">
                <img src={avalancheArt} alt="" width={1200} height={800} loading="lazy" decoding="async" />
              </div>
              <h3>Avalanche</h3>
              <p className="fs-packet-tag">Highest APR first</p>
              <p>
                You pay the minimum on every debt, but throw all your extra money at your <strong>highest-interest debt</strong>.
                Mathematically optimal — saves the most money and is usually the fastest path out.
              </p>
              <p className="fs-best">
                <strong>Best for:</strong> people who can stay disciplined without instant gratification.
              </p>
            </article>
          </div>
          <aside className="fs-take">
            <Friend name="Mochi" i={0} className="fs-take-friend" />
            <h3>Cowculator's take</h3>
            <p>
              Pick the one you'll actually <em>stick to</em>. The "best" strategy is the one you don't quit. The Cowculator shows
              you both side-by-side so you can decide with real numbers, not vibes.
            </p>
          </aside>
        </section>

        <section className="fs-close" aria-labelledby="fs-close-title">
          <div className="fs-close-sign">
            <FlowerSpray className="fs-spray fs-spray--tl" />
            <FlowerSpray className="fs-spray fs-spray--br" variant="b" />
            <h2 id="fs-close-title" data-cb-sparkle>
              Your debt-free date is closer than you think.
            </h2>
            <p>Save your plan, log your payments, and let Debtsy &amp; Luna cheer you on the whole way.</p>
            <button type="button" className="fs-tag fs-tag--gold fs-tag--big cb-glint" onClick={savePlan}>
              Save my plan — free
            </button>
            <p className="fs-close-fine">No credit card. Pro available later if you want it.</p>
          </div>
          <div className="fs-close-friends">
            <Friend name="Debtsy" i={0} className="fs-friend--big" />
            <Friend name="Luna" i={1} className="fs-friend--big" />
          </div>
          <Meadow className="fs-meadow fs-meadow--close" />
        </section>
      </main>

      <footer className="fs-foot">
        <span className="fs-foot-name">
          <DebtsyCow size={28} animated={false} />
          <b>Cowculator</b>
        </span>
        <span>The free debt payoff calculator that moos at your debt</span>
        <span className="fs-foot-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </span>
      </footer>
    </div>
  );
}
