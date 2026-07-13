/**
 * LandingPage — Public marketing + calculator at /
 *
 * Goals:
 *  - Rank for "free debt payoff calculator" (root-domain SEO)
 *  - Deliver instant value: type a debt → see payoff date + interest saved
 *  - Funnel into signup with localStorage handoff
 */

import type { CSSProperties, ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { generatePayoffPlan } from '../lib/calculations';
import type { Debt, ThemePreset } from '../types';
import {
  LunaBunny,
  BooBoo,
  ShadowBunny,
  LiloOtter,
  SunshineChick,
  CherryKitty,
  MochiFrog,
  ChaiBear,
  MapleFox,
} from '../components/ui/mascots';
import { DebtsyCow } from '../components/ui/DebtsyCow';
import { THEME_PRESETS } from '../lib/themes';

const LANDING_DEBTS_KEY = 'cowculator_landing_debts';
const LANDING_FUNDING_KEY = 'cowculator_landing_funding';

type MascotProps = { size?: number; className?: string; animated?: boolean };
type Mascot = {
  preset: Exclude<ThemePreset, 'custom'>;
  Component: ComponentType<MascotProps>;
  name: string;
};

const MASCOTS: Mascot[] = [
  { preset: 'default', Component: LunaBunny, name: 'Luna' },
  { preset: 'my-melody', Component: BooBoo, name: 'BooBoo' },
  { preset: 'kuromi', Component: ShadowBunny, name: 'Shadow' },
  { preset: 'cinnamoroll', Component: LiloOtter, name: 'Lilo' },
  { preset: 'pompompurin', Component: SunshineChick, name: 'Sunshine' },
  { preset: 'hello-kitty', Component: CherryKitty, name: 'Cherry' },
  { preset: 'keroppi', Component: MochiFrog, name: 'Mochi' },
  { preset: 'chococat', Component: ChaiBear, name: 'Chai' },
  { preset: 'maple', Component: MapleFox, name: 'Maple' },
];

type DraftDebt = {
  id: string;
  name: string;
  balance: string;
  apr: string;
  minimumPayment: string;
};

const blankDebt = (): DraftDebt => ({
  id: uuidv4(),
  name: '',
  balance: '',
  apr: '',
  minimumPayment: '',
});

const SEED_DEBTS: DraftDebt[] = [
  { id: uuidv4(), name: 'Credit Card', balance: '5000', apr: '22', minimumPayment: '125' },
  { id: uuidv4(), name: 'Car Loan', balance: '12000', apr: '7.5', minimumPayment: '300' },
];

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id: string, data: object) {
  let el = document.head.querySelector(`script[data-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-jsonld', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function LandingPage() {
  const navigate = useNavigate();
  const [mascot, setMascot] = useState<Mascot>(() => MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
  const theme = THEME_PRESETS[mascot.preset];

  const rerollMascot = () => {
    // Pick a different mascot than the current one for guaranteed visible change.
    const others = MASCOTS.filter((m) => m.preset !== mascot.preset);
    setMascot(others[Math.floor(Math.random() * others.length)]);
  };

  const [debts, setDebts] = useState<DraftDebt[]>(() => {
    try {
      const saved = localStorage.getItem(LANDING_DEBTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return SEED_DEBTS;
  });
  const [extraFunding, setExtraFunding] = useState<string>(() => {
    return localStorage.getItem(LANDING_FUNDING_KEY) || '200';
  });
  const [strategyView, setStrategyView] = useState<'comparison' | 'snowball' | 'avalanche'>('comparison');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // SEO + social meta — set once on mount
  useEffect(() => {
    document.title = 'Free Debt Payoff Calculator — Snowball & Avalanche | Cowculator';
    setMeta(
      'description',
      'Free debt payoff calculator. No signup. No credit card. Compare the snowball vs avalanche methods, see your debt-free date instantly, and build a real plan to be debt free.'
    );
    setMeta('keywords', 'free debt payoff calculator, debt snowball calculator, debt avalanche calculator, debt-free date, debt tracker, no signup');
    setCanonical('https://cowculator.net/');
    setMeta('og:title', 'Free Debt Payoff Calculator — Cowculator', 'property');
    setMeta('og:description', 'Snowball & avalanche calculators. See your debt-free date in seconds. No signup needed.', 'property');
    setMeta('og:url', 'https://cowculator.net/', 'property');
    setMeta('twitter:title', 'Free Debt Payoff Calculator — Cowculator');
    setMeta('twitter:description', 'Snowball & avalanche calculators. See your debt-free date in seconds. No signup needed.');

    setJsonLd('webapp', {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Cowculator',
      url: 'https://cowculator.net/',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Free debt payoff calculator with snowball and avalanche strategies.',
    });

    setJsonLd('faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }, []);

  // Persist drafts so signup flow can pick them up
  useEffect(() => {
    localStorage.setItem(LANDING_DEBTS_KEY, JSON.stringify(debts));
  }, [debts]);
  useEffect(() => {
    localStorage.setItem(LANDING_FUNDING_KEY, extraFunding);
  }, [extraFunding]);

  // Convert drafts → real Debt[] for the calc engine, filtering invalid rows
  const validDebts: Debt[] = useMemo(() => {
    const out: Debt[] = [];
    for (const d of debts) {
      const balance = parseFloat(d.balance);
      const apr = parseFloat(d.apr);
      const minimumPayment = parseFloat(d.minimumPayment);
      if (!balance || balance <= 0) continue;
      if (isNaN(apr) || apr < 0) continue;
      if (!minimumPayment || minimumPayment <= 0) continue;
      const now = new Date().toISOString();
      out.push({
        id: d.id,
        name: d.name || 'Debt',
        category: 'credit_card',
        balance,
        originalBalance: balance,
        apr,
        minimumPayment,
        dueDay: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
    return out;
  }, [debts]);

  const totalMinimums = validDebts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalBalance = validDebts.reduce((s, d) => s + d.balance, 0);
  const extra = Math.max(0, parseFloat(extraFunding) || 0);
  const monthlyFunding = totalMinimums + extra;

  const snowballPlan = useMemo(() => {
    if (validDebts.length === 0) return null;
    return generatePayoffPlan(validDebts, {
      strategy: 'snowball',
      recurringFunding: { amount: monthlyFunding, dayOfMonth: 1, extraAmount: extra },
      oneTimeFundings: [],
    });
  }, [validDebts, monthlyFunding]);

  const avalanchePlan = useMemo(() => {
    if (validDebts.length === 0) return null;
    return generatePayoffPlan(validDebts, {
      strategy: 'avalanche',
      recurringFunding: { amount: monthlyFunding, dayOfMonth: 1, extraAmount: extra },
      oneTimeFundings: [],
    });
  }, [validDebts, monthlyFunding]);

  const minimumOnlyPlan = useMemo(() => {
    if (validDebts.length === 0) return null;
    return generatePayoffPlan(validDebts, {
      strategy: 'avalanche',
      recurringFunding: { amount: totalMinimums, dayOfMonth: 1, extraAmount: 0 },
      oneTimeFundings: [],
    });
  }, [validDebts, totalMinimums]);

  const interestSaved = minimumOnlyPlan && avalanchePlan
    ? Math.max(0, minimumOnlyPlan.totalInterest - avalanchePlan.totalInterest)
    : 0;

  const updateDebt = (id: string, field: keyof DraftDebt, value: string) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const addDebt = () => {
    if (debts.length >= 5) return;
    setDebts((prev) => [...prev, blankDebt()]);
  };

  const removeDebt = (id: string) => {
    setDebts((prev) => (prev.length > 1 ? prev.filter((d) => d !== prev.find((x) => x.id === id)) : prev));
  };

  const handleSavePlan = () => {
    // Drafts are already in localStorage — signup flow will read & seed Supabase
    navigate('/auth?from=landing');
  };

  const Mascot = mascot.Component;

  return (
    <div
      className="min-h-screen w-full text-slate-900 antialiased"
      style={{
        fontFamily: '"Quicksand", system-ui, sans-serif',
        background: `linear-gradient(180deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 60%, #ffffff 100%)`,
      }}
    >
      {/* ─────────────────────────  TOP BAR  ───────────────────────── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/60 border-b border-white/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={rerollMascot}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl px-1 py-1 -ml-1 transition-transform active:scale-95"
            style={{ '--tw-ring-color': theme.primary400 } as CSSProperties}
            aria-label="Cowculator — click to change theme"
            title="Click to change theme ✨"
          >
            <DebtsyCow size={36} animated />
            <span
              className="text-2xl font-bold tracking-tight transition-colors"
              style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: theme.primary700 }}
            >
              Cowculator
            </span>
            <Sparkle size={14} color={theme.primary500} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <a href="#how-it-works" className="hidden sm:inline text-slate-600 hover:text-slate-900">How it works</a>
            <a href="#faq" className="hidden sm:inline text-slate-600 hover:text-slate-900">FAQ</a>
            <button
              onClick={() => navigate('/auth')}
              className="px-3 sm:px-4 py-2 rounded-full text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: theme.primary500 }}
            >
              Sign in
            </button>
          </nav>
        </div>
      </header>

      {/* ─────────────────────────  HERO  ───────────────────────── */}
      <section className="relative overflow-hidden">
        <SparkleField color={theme.primary400} />
        {/* Floating mascots — decorative */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-12 left-[8%] opacity-30 animate-pulse" style={{ animationDuration: '4s' }}>
            <Mascot size={64} animated={false} />
          </div>
          <div className="absolute top-32 right-[10%] opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}>
            <DebtsyCow size={56} animated={false} />
          </div>
          <div className="absolute bottom-10 left-[15%] opacity-25 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}>
            <Mascot size={48} animated={false} />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT: copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-white/80 text-xs font-semibold text-slate-700 mb-6">
                <span className="text-base">🐄</span> Built by someone paying off debt — for you.
              </div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
                style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: '#1e1b4b' }}
              >
                Free debt payoff{' '}
                <span style={{ color: theme.primary600 }}>calculator</span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-slate-700 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                <strong>No signup. No credit card.</strong> Compare the snowball and avalanche methods,
                see your debt-free date in seconds, and find out exactly how much interest you'll save.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="#calculator"
                  className="px-7 py-3.5 rounded-full text-white font-semibold text-base whitespace-nowrap shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  style={{ backgroundColor: theme.primary600 }}
                >
                  Try the Cowculator
                </a>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-7 py-3.5 rounded-full bg-white/80 text-slate-800 font-semibold text-base whitespace-nowrap border border-white shadow-sm hover:bg-white transition-all"
                >
                  Save my plan — free
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Pro unlocks themes, asset tracking & unlimited debts. The calculator is always free.
              </p>
            </div>

            {/* RIGHT: payoff date hero card — the wow */}
            <div className="relative">
              <Sparkle size={28} color={theme.accent} className="absolute -top-3 -left-2 animate-sparkle-twinkle" style={{ animationDuration: '2.2s' }} />
              <Sparkle size={20} color={theme.primary400} className="absolute -top-4 right-8 animate-sparkle-twinkle" style={{ animationDuration: '2.6s', animationDelay: '0.5s' }} />
              <Sparkle size={24} color={theme.accent} className="absolute -bottom-2 right-2 animate-sparkle-twinkle" style={{ animationDuration: '3s', animationDelay: '1s' }} />
              <div
                className="rounded-[2rem] bg-white/85 backdrop-blur-xl shadow-2xl border border-white p-6 sm:p-8"
                style={{ boxShadow: `0 30px 60px -20px ${theme.primary300}88` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mascot size={48} animated />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Your debt-free date</p>
                      <p className="text-xs text-slate-400">Live preview · {mascot.name} is helping</p>
                    </div>
                  </div>
                </div>
                {avalanchePlan && validDebts.length > 0 ? (
                  <div>
                    <p
                      className="text-5xl sm:text-6xl font-bold tracking-tight"
                      style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: theme.primary700 }}
                    >
                      {formatDate(avalanchePlan.debtFreeDate)}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-4" style={{ backgroundColor: theme.primary50 }}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total balance</p>
                        <p className="text-xl font-bold mt-1" style={{ color: theme.primary800 }}>
                          {formatCurrency(totalBalance)}
                        </p>
                      </div>
                      <div className="rounded-2xl p-4" style={{ backgroundColor: theme.accentLight }}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Interest saved</p>
                        <p className="text-xl font-bold mt-1" style={{ color: theme.primary800 }}>
                          {formatCurrency(interestSaved)}
                        </p>
                      </div>
                    </div>
                    <a
                      href="#calculator"
                      className="mt-5 block text-center text-sm font-semibold py-2.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 transition-colors"
                    >
                      Edit your debts ↓
                    </a>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-slate-500">Add a debt below to see your debt-free date appear here ✨</p>
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-4 -right-4 -z-10 w-full h-full rounded-[2rem] opacity-40"
                style={{ background: `linear-gradient(135deg, ${theme.primary300}, ${theme.accent})` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────  BENEFITS ROW  ─────────────────────── */}
      <section className="bg-white/40 backdrop-blur-sm border-y border-white/60 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            {[
              { icon: '💸', title: 'Both strategies, side by side', desc: 'Snowball or avalanche — see which one frees you faster.' },
              { icon: '🔒', title: 'Private by default', desc: 'No signup required. Your numbers never leave your browser.' },
              { icon: '⚡', title: 'Instant results', desc: 'Real payoff math, not a vague estimate. Updates as you type.' },
            ].map((b) => (
              <div key={b.title} className="px-4">
                <div className="text-4xl mb-2">{b.icon}</div>
                <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
                  {b.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────  CALCULATOR  ───────────────────────── */}
      <section id="calculator" className="relative py-16 sm:py-24 overflow-hidden">
        <SparkleField color={theme.primary400} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2
              className="text-3xl sm:text-5xl font-bold tracking-tight"
              style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: '#1e1b4b' }}
            >
              Run the numbers
            </h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">
              Add up to 5 debts. Add what extra you can throw at them each month. We'll do the rest.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Inputs */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-5 sm:p-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-900" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
                    Your debts
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">{debts.length} / 5</span>
                </div>

                <div className="space-y-3">
                  {debts.map((d, i) => (
                    <div
                      key={d.id}
                      className="rounded-2xl border-2 border-slate-100 p-4 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={d.name}
                          onChange={(e) => updateDebt(d.id, 'name', e.target.value)}
                          placeholder={`Debt ${i + 1} (e.g. Visa)`}
                          className="text-base font-semibold bg-transparent border-none outline-none flex-1 placeholder:text-slate-400 placeholder:font-normal"
                        />
                        {debts.length > 1 && (
                          <button
                            onClick={() => removeDebt(d.id)}
                            className="text-slate-400 hover:text-red-500 text-sm w-7 h-7 rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Remove debt"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <NumberField label="Balance" prefix="$" value={d.balance} onChange={(v) => updateDebt(d.id, 'balance', v)} placeholder="5000" />
                        <NumberField label="APR %" value={d.apr} onChange={(v) => updateDebt(d.id, 'apr', v)} placeholder="22" />
                        <NumberField label="Min payment" prefix="$" value={d.minimumPayment} onChange={(v) => updateDebt(d.id, 'minimumPayment', v)} placeholder="125" />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addDebt}
                  disabled={debts.length >= 5}
                  className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-semibold text-sm hover:border-slate-300 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  + Add another debt
                </button>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Extra you can pay each month (on top of minimums)
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-100 px-4 py-3 focus-within:border-slate-300 transition-colors">
                    <span className="text-slate-400 font-semibold">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={extraFunding}
                      onChange={(e) => setExtraFunding(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-lg font-semibold"
                      placeholder="200"
                    />
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Total monthly payment: <strong>{formatCurrency(monthlyFunding)}</strong>
                    {totalMinimums > 0 && <> ({formatCurrency(totalMinimums)} minimums + {formatCurrency(extra)} extra)</>}
                  </p>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <div className="rounded-3xl bg-gradient-to-br shadow-xl border border-white p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${theme.primary600}, ${theme.primary800})` }}
                >
                  <div className="flex gap-1 p-1 bg-white/15 rounded-full mb-5 text-xs font-semibold">
                    {(['comparison', 'snowball', 'avalanche'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setStrategyView(opt)}
                        className={`flex-1 px-3 py-2 rounded-full transition-all capitalize ${
                          strategyView === opt ? 'bg-white text-slate-900 shadow' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        {opt === 'comparison' ? 'Compare' : opt}
                      </button>
                    ))}
                  </div>

                  {validDebts.length === 0 ? (
                    <div className="py-12 text-center text-white/80 text-sm">
                      Fill in at least one debt to see your plan ✨
                    </div>
                  ) : strategyView === 'comparison' && snowballPlan && avalanchePlan ? (
                    <div className="space-y-4">
                      <ComparisonRow label="Snowball" plan={snowballPlan} accent />
                      <ComparisonRow label="Avalanche" plan={avalanchePlan} />
                      <div className="pt-3 border-t border-white/20">
                        <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Avalanche saves you</p>
                        <p className="text-3xl font-bold mt-1" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
                          {formatCurrency(Math.max(0, snowballPlan.totalInterest - avalanchePlan.totalInterest))}
                        </p>
                        <p className="text-xs text-white/70 mt-1">in interest, vs snowball</p>
                      </div>
                    </div>
                  ) : (
                    <SinglePlanView plan={strategyView === 'snowball' ? snowballPlan! : avalanchePlan!} />
                  )}
                </div>

                {/* Save CTA */}
                {validDebts.length > 0 && (
                  <div className="mt-4 rounded-3xl bg-white border border-slate-100 shadow-md p-5 text-center">
                    <p className="text-sm text-slate-700 font-semibold mb-1">Want to track your progress?</p>
                    <p className="text-xs text-slate-500 mb-4">
                      Save your plan, log payments, and watch your debt-free date get closer.
                    </p>
                    <button
                      onClick={handleSavePlan}
                      className="w-full py-3 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                      style={{ backgroundColor: theme.primary600 }}
                    >
                      Save my plan — free 🐄
                    </button>
                    <p className="mt-2 text-[10px] text-slate-400">No credit card. 30 seconds to sign up.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────  HOW IT WORKS / EXPLAINER  ─────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight text-center"
            style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: '#1e1b4b' }}
          >
            Snowball vs Avalanche — what's the difference?
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
            Both methods work. They just attack your debts in a different order — and that order changes
            how fast you finish and how much interest you pay.
          </p>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <article className="rounded-3xl bg-white border border-slate-100 shadow-md p-6 sm:p-7">
              <div className="text-3xl mb-3">⛄</div>
              <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
                Snowball
              </h3>
              <p className="mt-1 text-sm font-semibold" style={{ color: theme.primary600 }}>Smallest balance first</p>
              <p className="mt-3 text-slate-700 leading-relaxed">
                You pay the minimum on every debt, but throw all your extra money at your <strong>smallest balance</strong>.
                Once it's gone, you "roll" that payment onto the next-smallest. Quick wins build momentum.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
                <strong>Best for:</strong> people who need motivation and small wins to stay in the game.
              </div>
            </article>

            <article className="rounded-3xl bg-white border border-slate-100 shadow-md p-6 sm:p-7">
              <div className="text-3xl mb-3">🏔️</div>
              <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
                Avalanche
              </h3>
              <p className="mt-1 text-sm font-semibold" style={{ color: theme.primary600 }}>Highest APR first</p>
              <p className="mt-3 text-slate-700 leading-relaxed">
                You pay the minimum on every debt, but throw all your extra money at your <strong>highest-interest debt</strong>.
                Mathematically optimal — saves the most money and is usually the fastest path out.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
                <strong>Best for:</strong> people who can stay disciplined without instant gratification.
              </div>
            </article>
          </div>

          <div className="mt-8 p-6 rounded-3xl text-white" style={{ backgroundColor: theme.primary700 }}>
            <p className="text-sm uppercase tracking-wider font-semibold opacity-80">Cowculator's take</p>
            <p className="mt-2 text-lg leading-relaxed">
              Pick the one you'll actually <em>stick to</em>. The "best" strategy is the one you don't quit.
              The Cowculator shows you both side-by-side so you can decide with real numbers, not vibes.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────  FAQ  ───────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight text-center"
            style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: '#1e1b4b' }}
          >
            Questions?
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={i}
                open={openFaq === i}
                onToggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open) setOpenFaq(i);
                  else if (openFaq === i) setOpenFaq(null);
                }}
                className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-slate-900 pr-4">{f.q}</span>
                  <span className="text-2xl text-slate-400 leading-none transition-transform" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                </summary>
                <div className="px-5 pb-5 text-slate-700 leading-relaxed text-[15px]">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────  FINAL CTA  ──────────────────────── */}
      <section className="relative py-16 sm:py-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary100}, ${theme.gradientFrom})` }}>
        <SparkleField color={theme.primary500} />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <DebtsyCow size={64} animated />
            <Mascot size={56} animated />
          </div>
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight"
            style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: '#1e1b4b' }}
          >
            Your debt-free date is closer than you think.
          </h2>
          <p className="mt-4 text-slate-700 text-lg">
            Save your plan, log your payments, and let Debtsy & {mascot.name} cheer you on the whole way.
          </p>
          <button
            onClick={handleSavePlan}
            className="mt-7 px-8 py-4 rounded-full text-white font-bold text-base shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: theme.primary600 }}
          >
            Save my plan — free 🐄
          </button>
          <p className="mt-3 text-xs text-slate-500">No credit card. Pro available later if you want it.</p>
        </div>
      </section>

      {/* ────────────────────────  FOOTER  ──────────────────────── */}
      <footer
        className="py-10 border-t"
        style={{
          background: `linear-gradient(180deg, ${theme.gradientTo} 0%, ${theme.primary100} 100%)`,
          borderColor: `${theme.primary200}80`,
          color: theme.primary800,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DebtsyCow size={28} animated={false} />
            <span
              className="font-bold"
              style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif', color: theme.primary800 }}
            >
              Cowculator
            </span>
            <span style={{ color: theme.primary400 }}>·</span>
            <span style={{ color: theme.primary700, opacity: 0.85 }}>
              The free debt payoff calculator that moos at your debt 🐄
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="font-medium transition-opacity hover:opacity-70"
              style={{ color: theme.primary700 }}
            >
              Sign in
            </button>
            <a
              href="#faq"
              className="font-medium transition-opacity hover:opacity-70"
              style={{ color: theme.primary700 }}
            >
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ───────────────────────────  SUB-COMPONENTS  ───────────────────────────

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1 flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200 transition-all">
        {prefix && <span className="text-sm text-slate-400 font-medium">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm font-semibold text-slate-900"
        />
      </div>
    </label>
  );
}

function ComparisonRow({ label, plan, accent }: { label: string; plan: { debtFreeDate: string; totalInterest: number }; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? 'bg-white/15' : 'bg-white/10'}`}>
      <p className="text-xs uppercase tracking-wider font-semibold opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
        {formatDate(plan.debtFreeDate)}
      </p>
      <p className="text-xs opacity-80 mt-1">{formatCurrency(plan.totalInterest)} total interest</p>
    </div>
  );
}

function SinglePlanView({ plan }: { plan: { debtFreeDate: string; totalInterest: number; totalPayments: number } }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Debt free</p>
        <p className="text-4xl font-bold mt-1" style={{ fontFamily: '"Bagel Fat One", "Fredoka", "Bagel Fat One Fallback", "Fredoka Fallback", system-ui, sans-serif' }}>
          {formatDate(plan.debtFreeDate)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/15 p-3">
          <p className="text-[10px] uppercase tracking-wider opacity-80">Total interest</p>
          <p className="text-lg font-bold mt-0.5">{formatCurrency(plan.totalInterest)}</p>
        </div>
        <div className="rounded-xl bg-white/15 p-3">
          <p className="text-[10px] uppercase tracking-wider opacity-80">Total paid</p>
          <p className="text-lg font-bold mt-0.5">{formatCurrency(plan.totalPayments)}</p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────  SPARKLES  ───────────────────────────

function Sparkle({ size = 16, color = '#a855f7', className = '', style }: { size?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M12 0L13.8 8.2C14.1 9.6 15.2 10.7 16.6 11L24 12L16.6 13C15.2 13.3 14.1 14.4 13.8 15.8L12 24L10.2 15.8C9.9 14.4 8.8 13.3 7.4 13L0 12L7.4 11C8.8 10.7 9.9 9.6 10.2 8.2L12 0Z"
        fill={color}
      />
    </svg>
  );
}

type SparkleSpec = {
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  opacity: number;
};

const SPARKLE_FIELD: SparkleSpec[] = [
  { top: '8%', left: '4%', size: 18, delay: 0, duration: 2.4, rotation: 0, opacity: 0.7 },
  { top: '14%', left: '92%', size: 14, delay: 0.6, duration: 3.1, rotation: 25, opacity: 0.6 },
  { top: '24%', left: '48%', size: 10, delay: 1.2, duration: 2.6, rotation: 12, opacity: 0.55 },
  { top: '38%', left: '6%', size: 22, delay: 0.3, duration: 3.4, rotation: -10, opacity: 0.6 },
  { top: '46%', left: '88%', size: 12, delay: 1.5, duration: 2.8, rotation: 30, opacity: 0.65 },
  { top: '58%', left: '14%', size: 16, delay: 0.9, duration: 2.5, rotation: -20, opacity: 0.55 },
  { top: '66%', left: '78%', size: 20, delay: 0.4, duration: 3.2, rotation: 15, opacity: 0.6 },
  { top: '78%', left: '32%', size: 12, delay: 1.8, duration: 2.7, rotation: -5, opacity: 0.5 },
  { top: '86%', left: '90%', size: 18, delay: 1.1, duration: 3.0, rotation: 20, opacity: 0.6 },
  { top: '92%', left: '8%', size: 14, delay: 0.7, duration: 2.9, rotation: -15, opacity: 0.55 },
  { top: '20%', left: '20%', size: 10, delay: 2.0, duration: 2.4, rotation: 5, opacity: 0.5 },
  { top: '52%', left: '52%', size: 14, delay: 1.4, duration: 3.3, rotation: -25, opacity: 0.5 },
];

function SparkleField({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {SPARKLE_FIELD.map((s, i) => (
        <Sparkle
          key={i}
          size={s.size}
          color={color}
          className="absolute animate-sparkle-twinkle"
          style={{
            top: s.top,
            left: s.left,
            opacity: s.opacity,
            transform: `rotate(${s.rotation}deg)`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ───────────────────────────  FAQ CONTENT  ───────────────────────────

const FAQS = [
  {
    q: 'Is the Cowculator really free?',
    a: 'Yes. The debt payoff calculator on this page is 100% free — no signup, no credit card, no email. If you sign up to save and track your plan, the free account stays free forever (with sensible caps). Pro is optional and unlocks extras like asset tracking, advanced charts, themes, and unlimited debts.',
  },
  {
    q: 'What is the debt snowball method?',
    a: 'The debt snowball is a payoff strategy where you pay the minimum on every debt and throw all your extra money at the smallest balance first. Once that debt is gone, you roll its payment into the next-smallest. The wins are quick and motivating, even if the math isn\'t the most efficient.',
  },
  {
    q: 'What is the debt avalanche method?',
    a: 'The debt avalanche pays minimums on every debt and attacks the highest-interest-rate (APR) debt first. It\'s mathematically optimal — you pay the least interest and (usually) finish faster. The downside is your first payoff might take a while, so it requires more patience.',
  },
  {
    q: 'Snowball vs avalanche — which is better?',
    a: 'Avalanche almost always saves more money. Snowball almost always feels better and keeps people in the game. The truth: the best strategy is the one you actually stick to. Use the calculator above to compare both with your real numbers, then pick the one you can commit to.',
  },
  {
    q: 'Do you store my data?',
    a: 'On this calculator page, no. All math runs in your browser and the numbers stay on your device. If you choose to create a free account to save your plan, your data is stored encrypted in our database (Supabase) and only you can see it.',
  },
  {
    q: 'How is Cowculator different from other debt apps?',
    a: 'Most debt payoff tools are either bare spreadsheets or paid apps that hide the calculator behind a paywall. Cowculator is genuinely free, doesn\'t need your credit card, runs both strategies side-by-side, and (let\'s be honest) is a lot cuter than the others. The cow is named Debtsy.',
  },
  {
    q: 'Can I use this on my phone?',
    a: 'Yes. Cowculator works in any browser on any device. You can also install it as an app on your phone\'s home screen for a native-app feel.',
  },
];
