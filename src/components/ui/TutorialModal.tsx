/**
 * TutorialModal
 *
 * First-run walkthrough: 7 info slides → add first debt → add income source.
 * Forces data entry so the app is populated before the user starts exploring.
 * X button is always available as an escape hatch.
 */

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, CreditCard, ClipboardList, BarChart3, Home, Sparkles, PartyPopper } from 'lucide-react';
import type { ComponentType } from 'react';
import { ModalShell } from './ModalShell';
import { SegmentedControl } from './SegmentedControl';
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
    title: 'Welcome to Cowculator!',
    body: "You're one step away from your debt-free journey. Here's how to get started in 3 steps.",
  },
  {
    emoji: 'card',
    title: 'Step 1: Add Your Debts',
    body: 'Head to Debts and add everything — credit cards, loans, student debt. Include balance, APR, and minimum payment.',
  },
  {
    emoji: 'plan',
    title: 'Step 2: Build Your Plan',
    body: 'Go to Plan to set your monthly budget and pick a strategy: Avalanche (saves money) or Snowball (quick wins).',
  },
  {
    emoji: 'track',
    title: 'Step 3: Track Your Progress',
    body: "Use Track to log paychecks and mark payments. The app does the math — you just follow the plan.",
  },
  {
    emoji: 'home',
    title: 'Your Dashboard',
    body: 'Home shows your progress rings, debt payoff timeline, and milestones. Check here for motivation.',
  },
  {
    emoji: 'more',
    title: 'More Features',
    body: "Assets track what you own. Subscriptions track what you're paying. Find both in the nav or Settings.",
  },
  {
    emoji: 'ready',
    title: "You're Ready!",
    body: "Let's set up your account so your dashboard comes to life right away. It only takes a minute!",
  },
] as const;

const SLIDE_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  card: CreditCard, plan: ClipboardList, track: BarChart3, home: Home, more: Sparkles, ready: PartyPopper,
};

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

// Field, label and button styling comes from the shared ranch modal layer (modal.css).
const ERROR = 'mdl-err';

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
  const slide = SLIDES[currentSlide];
  const SlideIcon = slide.emoji ? SLIDE_ICONS[slide.emoji] : null;
  const title = phase === 'slides' ? slide.title : phase === 'debt' ? 'Add Your First Debt' : 'Add Your Income';
  const subtitle = phase === 'debt' ? 'Setup: step 1 of 2. This powers your payoff timeline and progress rings'
    : phase === 'income' ? 'Setup: step 2 of 2. Used to calculate how much you can put toward debt' : undefined;

  return (
    <ModalShell onClose={onComplete} size="sm" title={title} subtitle={subtitle} closeLabel="Skip tutorial">
      {/* ── PHASE: SLIDES ─────────────────────────────────────────────────── */}
      {phase === 'slides' && (
        <>
          <div className="tut-slide">
            <div className="tut-art" aria-hidden="true">
              {SlideIcon ? <SlideIcon size={34} /> : <DebtsyCow size={88} />}
            </div>
            <p className="tut-body">{slide.body}</p>
            {isLast && (
              <button type="button" onClick={() => setPhase('debt')} className="mdl-btn">
                Set Up My App <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="tut-nav">
            <button type="button" onClick={() => setCurrentSlide((s) => s - 1)} disabled={isFirst} className="mdl-x" aria-label="Previous step" style={{ visibility: isFirst ? 'hidden' : 'visible' }}>
              <ChevronLeft size={22} />
            </button>
            <div className="tut-dots" role="group" aria-label="Tutorial progress">
              {SLIDES.map((_, i) => (
                <button type="button" key={i} onClick={() => setCurrentSlide(i)} aria-label={`Go to step ${i + 1}`} aria-current={i === currentSlide ? 'step' : undefined}
                  className={`tut-dot${i === currentSlide ? ' is-on' : ''}`} />
              ))}
            </div>
            {isLast ? (
              <button type="button" onClick={onComplete} className="tut-skip">Skip</button>
            ) : (
              <button type="button" onClick={() => setCurrentSlide((s) => s + 1)} className="mdl-x" aria-label="Next step">
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        </>
      )}

      {/* ── PHASE: DEBT FORM ──────────────────────────────────────────────── */}
      {phase === 'debt' && (
        <div className="mdl-form">
          <div className="grid gap-1.5">
            <label>Debt name</label>
            <input type="text" value={debtForm.name} onChange={(e) => debtChange('name', e.target.value)}
              placeholder="e.g. Chase Sapphire, Sallie Mae" className={debtErrors.name ? 'border-red-500' : ''} />
            {debtErrors.name && <p className={ERROR}>{debtErrors.name}</p>}
          </div>

          <div className="grid gap-1.5">
            <label>Type</label>
            <select value={debtForm.category} onChange={(e) => debtChange('category', e.target.value)}>
              {DEBT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5 content-start">
              <label>Current balance ($)</label>
              <input type="number" value={debtForm.balance} onChange={(e) => debtChange('balance', e.target.value)}
                placeholder="5000" min="0" step="0.01" inputMode="decimal" className={debtErrors.balance ? 'border-red-500' : ''} />
              {debtErrors.balance && <p className={ERROR}>{debtErrors.balance}</p>}
            </div>
            <div className="grid gap-1.5 content-start">
              <label>APR (%)</label>
              <input type="number" value={debtForm.apr} onChange={(e) => debtChange('apr', e.target.value)}
                placeholder="19.99" min="0" max="100" step="0.01" inputMode="decimal" className={debtErrors.apr ? 'border-red-500' : ''} />
              {debtErrors.apr && <p className={ERROR}>{debtErrors.apr}</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <label>Minimum monthly payment ($)</label>
            <input type="number" value={debtForm.minimumPayment} onChange={(e) => debtChange('minimumPayment', e.target.value)}
              placeholder="150" min="0" step="0.01" inputMode="decimal" className={debtErrors.minimumPayment ? 'border-red-500' : ''} />
            {debtErrors.minimumPayment && <p className={ERROR}>{debtErrors.minimumPayment}</p>}
          </div>

          <div className="grid gap-2 pt-1">
            <button type="button" onClick={handleDebtSubmit} disabled={isSubmitting} className="mdl-btn">
              {isSubmitting ? 'Saving...' : <>Save Debt <ChevronRight size={18} /></>}
            </button>
            <button type="button" onClick={() => setPhase('income')} className="tut-skip">Skip this step</button>
          </div>
        </div>
      )}

      {/* ── PHASE: INCOME FORM ────────────────────────────────────────────── */}
      {phase === 'income' && (
        <div className="mdl-form">
          <div className="grid gap-1.5">
            <label>Job / income name</label>
            <input type="text" value={incomeForm.name} onChange={(e) => incomeChange('name', e.target.value)}
              placeholder="e.g. Full-time Job, Freelance" className={incomeErrors.name ? 'border-red-500' : ''} />
            {incomeErrors.name && <p className={ERROR}>{incomeErrors.name}</p>}
          </div>

          <div className="grid gap-1.5">
            <label id="tut-inc-type">Income type</label>
            <SegmentedControl
              label="Income type"
              value={incomeForm.type}
              onValueChange={(v) => incomeChange('type', v)}
              options={[{ value: 'salary', label: 'Salary' }, { value: 'hourly', label: 'Hourly' }]}
              className="seg-block"
            />
          </div>

          <div className="grid gap-1.5">
            <label>Pay frequency</label>
            <select value={incomeForm.payFrequency} onChange={(e) => incomeChange('payFrequency', e.target.value)}>
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {incomeForm.type === 'salary' ? (
            <div className="grid gap-1.5">
              <label>Gross pay per period ($)</label>
              <input type="number" value={incomeForm.amount} onChange={(e) => incomeChange('amount', e.target.value)}
                placeholder="2500" min="0" step="0.01" inputMode="decimal" className={incomeErrors.amount ? 'border-red-500' : ''} />
              {incomeErrors.amount && <p className={ERROR}>{incomeErrors.amount}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5 content-start">
                <label>Hourly rate ($)</label>
                <input type="number" value={incomeForm.hourlyRate} onChange={(e) => incomeChange('hourlyRate', e.target.value)}
                  placeholder="22.50" min="0" step="0.01" inputMode="decimal" className={incomeErrors.hourlyRate ? 'border-red-500' : ''} />
                {incomeErrors.hourlyRate && <p className={ERROR}>{incomeErrors.hourlyRate}</p>}
              </div>
              <div className="grid gap-1.5 content-start">
                <label>Hours/week</label>
                <input type="number" value={incomeForm.hoursPerWeek} onChange={(e) => incomeChange('hoursPerWeek', e.target.value)}
                  placeholder="40" min="1" max="168" inputMode="numeric" />
              </div>
            </div>
          )}

          <div className="grid gap-2 pt-1">
            <button type="button" onClick={handleIncomeSubmit} disabled={isSubmitting} className="mdl-btn">
              {isSubmitting ? 'Saving...' : <><Check size={18} /> Let's Go!</>}
            </button>
            <button type="button" onClick={onComplete} className="tut-skip">Skip this step</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
