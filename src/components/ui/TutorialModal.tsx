/**
 * TutorialModal
 *
 * First-run walkthrough: 7 info slides → add first debt → add income source.
 * Forces data entry so the app is populated before the user starts exploring.
 * X button is always available as an escape hatch.
 */

import { useState } from 'react';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';
import { DebtsyCow } from './DebtsyCow';
import { useApp } from '../../context/AppContext';
import type { DebtCategoryExtended, PayFrequency, EmploymentType } from '../../types';

interface TutorialModalProps {
  onComplete: () => void;
}

type TutorialPhase = 'slides' | 'debt' | 'income';

const SLIDES = [
  {
    emoji: null,
    title: 'Welcome to Cowculator! 🐄',
    body: "You're one step away from your debt-free journey. Here's how to get started in 3 steps.",
  },
  {
    emoji: '💳',
    title: 'Step 1: Add Your Debts',
    body: 'Head to Debts and add everything — credit cards, loans, student debt. Include balance, APR, and minimum payment.',
  },
  {
    emoji: '📋',
    title: 'Step 2: Build Your Plan',
    body: 'Go to Plan to set your monthly budget and pick a strategy: Avalanche (saves money) or Snowball (quick wins).',
  },
  {
    emoji: '📊',
    title: 'Step 3: Track Your Progress',
    body: "Use Track to log paychecks and mark payments. The app does the math — you just follow the plan.",
  },
  {
    emoji: '🏠',
    title: 'Your Dashboard',
    body: 'Home shows your progress rings, debt payoff timeline, and milestones. Check here for motivation.',
  },
  {
    emoji: '✨',
    title: 'More Features',
    body: "Assets track what you own. Subscriptions track what you're paying. Find both in the nav or Settings.",
  },
  {
    emoji: '🎉',
    title: "You're Ready!",
    body: "Let's set up your account so your dashboard comes to life right away. It only takes a minute!",
  },
] as const;

const DEBT_CATEGORIES: { value: DebtCategoryExtended; label: string; emoji: string }[] = [
  { value: 'credit_card', label: 'Credit Card', emoji: '💳' },
  { value: 'student_loan', label: 'Student Loan', emoji: '🎓' },
  { value: 'auto_loan', label: 'Auto Loan', emoji: '🚗' },
  { value: 'personal_loan', label: 'Personal Loan', emoji: '💰' },
  { value: 'medical', label: 'Medical', emoji: '🏥' },
  { value: 'other', label: 'Other', emoji: '📋' },
];

const FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'semi-monthly', label: 'Twice a month' },
  { value: 'monthly', label: 'Monthly' },
];

// ─── Input styling ────────────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition text-sm';
const LABEL = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';
const ERROR = 'text-xs text-red-500 mt-1';

export function TutorialModal({ onComplete }: TutorialModalProps) {
  const { addDebt, addIncomeSource } = useApp();

  // ── Phase / slide state ─────────────────────────────────────────────────────
  const [phase, setPhase] = useState<TutorialPhase>('slides');
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Debt form state ─────────────────────────────────────────────────────────
  const [debtForm, setDebtForm] = useState({
    name: '',
    category: 'credit_card' as DebtCategoryExtended,
    balance: '',
    apr: '',
    minimumPayment: '',
  });
  const [debtErrors, setDebtErrors] = useState<Partial<Record<keyof typeof debtForm, string>>>({});

  // ── Income form state ───────────────────────────────────────────────────────
  const [incomeForm, setIncomeForm] = useState({
    name: '',
    type: 'salary' as EmploymentType,
    payFrequency: 'bi-weekly' as PayFrequency,
    amount: '',
    hourlyRate: '',
    hoursPerWeek: '40',
  });
  const [incomeErrors, setIncomeErrors] = useState<Partial<Record<keyof typeof incomeForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Slide helpers ───────────────────────────────────────────────────────────
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === SLIDES.length - 1;

  // ── Debt form validation + submit ───────────────────────────────────────────
  const handleDebtSubmit = async () => {
    const errors: typeof debtErrors = {};
    if (!debtForm.name.trim()) errors.name = 'Name is required';
    const balance = parseFloat(debtForm.balance);
    if (isNaN(balance) || balance < 0) errors.balance = 'Enter a valid balance';
    const apr = parseFloat(debtForm.apr);
    if (isNaN(apr) || apr < 0 || apr > 100) errors.apr = 'APR must be 0–100';
    const min = parseFloat(debtForm.minimumPayment);
    if (isNaN(min) || min < 0) errors.minimumPayment = 'Enter a valid amount';

    if (Object.keys(errors).length > 0) { setDebtErrors(errors); return; }

    setIsSubmitting(true);
    await addDebt({
      name: debtForm.name.trim(),
      category: debtForm.category,
      balance,
      originalBalance: balance,
      apr,
      minimumPayment: min,
      dueDay: 1,
    });
    setIsSubmitting(false);
    setPhase('income');
  };

  // ── Income form validation + submit ────────────────────────────────────────
  const handleIncomeSubmit = async () => {
    const errors: typeof incomeErrors = {};
    if (!incomeForm.name.trim()) errors.name = 'Name is required';
    if (incomeForm.type === 'salary') {
      const amount = parseFloat(incomeForm.amount);
      if (isNaN(amount) || amount <= 0) errors.amount = 'Enter your pay per period';
    } else {
      const rate = parseFloat(incomeForm.hourlyRate);
      if (isNaN(rate) || rate <= 0) errors.hourlyRate = 'Enter your hourly rate';
    }

    if (Object.keys(errors).length > 0) { setIncomeErrors(errors); return; }

    setIsSubmitting(true);
    await addIncomeSource({
      name: incomeForm.name.trim(),
      type: incomeForm.type,
      payFrequency: incomeForm.payFrequency,
      ...(incomeForm.type === 'salary'
        ? { amount: parseFloat(incomeForm.amount) }
        : { hourlyRate: parseFloat(incomeForm.hourlyRate), hoursPerWeek: parseFloat(incomeForm.hoursPerWeek) || 40 }
      ),
    });
    setIsSubmitting(false);
    onComplete();
  };

  // ── Shared input change handler ─────────────────────────────────────────────
  const debtChange = (field: keyof typeof debtForm, value: string) => {
    setDebtForm((p) => ({ ...p, [field]: value }));
    if (debtErrors[field]) setDebtErrors((p) => ({ ...p, [field]: undefined }));
  };

  const incomeChange = (field: keyof typeof incomeForm, value: string) => {
    setIncomeForm((p) => ({ ...p, [field]: value }));
    if (incomeErrors[field]) setIncomeErrors((p) => ({ ...p, [field]: undefined }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-primary-200/30 dark:shadow-black/40 border border-primary-100/50 dark:border-gray-800 overflow-hidden">

        {/* Floating decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {['🌸', '💫', '✨', '🌷', '💖'].map((emoji, i) => (
            <span key={i} className="absolute text-xl opacity-10 animate-kawaii-float"
              style={{ top: `${8 + (i * 18) % 75}%`, left: `${5 + (i * 17) % 88}%`, animationDelay: `${i * 0.8}s`, animationDuration: `${5 + (i % 3) * 2}s` }}>
              {emoji}
            </span>
          ))}
        </div>

        {/* Skip / X button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Skip tutorial"
        >
          <X size={18} />
        </button>

        {/* ── PHASE: SLIDES ─────────────────────────────────────────────────── */}
        {phase === 'slides' && (() => {
          const slide = SLIDES[currentSlide];
          return (
            <>
              <div className="px-8 pt-8 pb-6 text-center min-h-[240px] flex flex-col items-center justify-center relative z-[1]">
                <div className="mb-4">
                  {slide.emoji === null ? (
                    <div className="relative inline-block">
                      <DebtsyCow size={72} />
                      <span className="absolute -top-1 -right-2 text-xl animate-kawaii-float" style={{ animationDuration: '2s' }}>✨</span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center text-3xl shadow-inner">
                      {slide.emoji}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">{slide.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[260px]">{slide.body}</p>

                {/* Last slide CTA — starts setup flow */}
                {isLast && (
                  <button
                    onClick={() => setPhase('debt')}
                    className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-semibold shadow-lg shadow-primary-300/40 transition-all active:scale-95 text-sm"
                  >
                    Set Up My App →
                  </button>
                )}
              </div>

              {/* Navigation */}
              <div className="px-6 pb-6 flex items-center justify-between relative z-[1]">
                <button onClick={() => setCurrentSlide((s) => s - 1)} disabled={isFirst}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-0 disabled:pointer-events-none">
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      className={`rounded-full transition-all duration-300 ${i === currentSlide ? 'w-4 h-2 bg-primary-500' : 'w-2 h-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}
                    />
                  ))}
                </div>

                {isLast ? (
                  <button onClick={onComplete}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Skip
                  </button>
                ) : (
                  <button onClick={() => setCurrentSlide((s) => s + 1)}
                    className="p-2 rounded-xl text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </>
          );
        })()}

        {/* ── PHASE: DEBT FORM ──────────────────────────────────────────────── */}
        {phase === 'debt' && (
          <div className="px-6 pt-6 pb-6 relative z-[1]">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                <span>Setup — Step 1 of 2</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Your First Debt</h2>
              <p className="text-xs text-gray-400 mt-1">This powers your payoff timeline and progress rings</p>
            </div>

            <div className="space-y-3">
              {/* Debt name */}
              <div>
                <label className={LABEL}>Debt name</label>
                <input type="text" value={debtForm.name} onChange={(e) => debtChange('name', e.target.value)}
                  placeholder="e.g. Chase Sapphire, Sallie Mae" className={INPUT} autoFocus />
                {debtErrors.name && <p className={ERROR}>{debtErrors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label className={LABEL}>Type</label>
                <select value={debtForm.category} onChange={(e) => debtChange('category', e.target.value)} className={INPUT}>
                  {DEBT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              {/* Balance + APR row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LABEL}>Current balance ($)</label>
                  <input type="number" value={debtForm.balance} onChange={(e) => debtChange('balance', e.target.value)}
                    placeholder="5000" min="0" step="0.01" className={INPUT} inputMode="decimal" />
                  {debtErrors.balance && <p className={ERROR}>{debtErrors.balance}</p>}
                </div>
                <div>
                  <label className={LABEL}>APR (%)</label>
                  <input type="number" value={debtForm.apr} onChange={(e) => debtChange('apr', e.target.value)}
                    placeholder="19.99" min="0" max="100" step="0.01" className={INPUT} inputMode="decimal" />
                  {debtErrors.apr && <p className={ERROR}>{debtErrors.apr}</p>}
                </div>
              </div>

              {/* Minimum payment */}
              <div>
                <label className={LABEL}>Minimum monthly payment ($)</label>
                <input type="number" value={debtForm.minimumPayment} onChange={(e) => debtChange('minimumPayment', e.target.value)}
                  placeholder="150" min="0" step="0.01" className={INPUT} inputMode="decimal" />
                {debtErrors.minimumPayment && <p className={ERROR}>{debtErrors.minimumPayment}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <button onClick={handleDebtSubmit} disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-semibold shadow-lg shadow-primary-300/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <>Save Debt <ChevronRight size={16} /></>
                )}
              </button>
              <button onClick={() => setPhase('income')}
                className="w-full text-xs text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 py-1.5 transition-colors">
                Skip this step →
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE: INCOME FORM ────────────────────────────────────────────── */}
        {phase === 'income' && (
          <div className="px-6 pt-6 pb-6 relative z-[1]">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                <Check size={12} />
                <span>Setup — Step 2 of 2</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Your Income</h2>
              <p className="text-xs text-gray-400 mt-1">Used to calculate how much you can put toward debt</p>
            </div>

            <div className="space-y-3">
              {/* Income name */}
              <div>
                <label className={LABEL}>Job / income name</label>
                <input type="text" value={incomeForm.name} onChange={(e) => incomeChange('name', e.target.value)}
                  placeholder="e.g. Full-time Job, Freelance" className={INPUT} autoFocus />
                {incomeErrors.name && <p className={ERROR}>{incomeErrors.name}</p>}
              </div>

              {/* Salary vs Hourly toggle */}
              <div>
                <label className={LABEL}>Income type</label>
                <div className="flex gap-2">
                  {(['salary', 'hourly'] as EmploymentType[]).map((t) => (
                    <button key={t} onClick={() => incomeChange('type', t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                        incomeForm.type === t
                          ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-md shadow-primary-300/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay frequency */}
              <div>
                <label className={LABEL}>Pay frequency</label>
                <select value={incomeForm.payFrequency} onChange={(e) => incomeChange('payFrequency', e.target.value)} className={INPUT}>
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Amount or hourly rate */}
              {incomeForm.type === 'salary' ? (
                <div>
                  <label className={LABEL}>Gross pay per period ($)</label>
                  <input type="number" value={incomeForm.amount} onChange={(e) => incomeChange('amount', e.target.value)}
                    placeholder="2500" min="0" step="0.01" className={INPUT} inputMode="decimal" />
                  {incomeErrors.amount && <p className={ERROR}>{incomeErrors.amount}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>Hourly rate ($)</label>
                    <input type="number" value={incomeForm.hourlyRate} onChange={(e) => incomeChange('hourlyRate', e.target.value)}
                      placeholder="22.50" min="0" step="0.01" className={INPUT} inputMode="decimal" />
                    {incomeErrors.hourlyRate && <p className={ERROR}>{incomeErrors.hourlyRate}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Hours/week</label>
                    <input type="number" value={incomeForm.hoursPerWeek} onChange={(e) => incomeChange('hoursPerWeek', e.target.value)}
                      placeholder="40" min="1" max="168" className={INPUT} inputMode="numeric" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <button onClick={handleIncomeSubmit} disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-green-300/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <>Let's Go! 🎉</>
                )}
              </button>
              <button onClick={onComplete}
                className="w-full text-xs text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 py-1.5 transition-colors">
                Skip this step →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
