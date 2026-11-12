/**
 * What-If Scenario Tool - ranch edition.
 *
 * Lets users see how an extra monthly payment moves their debt-free date and
 * total interest: a slider and presets drive three result rows.
 */

import { useState, useMemo } from 'react';
import { Sparkles, TrendingDown, Calendar, DollarSign, Zap } from 'lucide-react';
import { parseISO, differenceInMonths, format } from 'date-fns';
import { generatePayoffPlan, formatCurrency } from '../../lib/calculations';
import { Plank } from '../dashboard/RanchPanels';
import type { Debt, StrategySettings } from '../../types';

interface WhatIfScenarioProps {
  debts: Debt[];
  strategy: StrategySettings;
}

const SLIDER_PRESETS = [50, 100, 200, 300, 500];

export function WhatIfScenario({ debts, strategy }: WhatIfScenarioProps) {
  const [extraAmount, setExtraAmount] = useState(100);

  // Current plan (baseline)
  const currentPlan = useMemo(() => generatePayoffPlan(debts, strategy), [debts, strategy]);

  // What-if plan with extra monthly payment
  const whatIfPlan = useMemo(() => {
    const modifiedStrategy: StrategySettings = {
      ...strategy,
      recurringFunding: {
        ...strategy.recurringFunding,
        amount: strategy.recurringFunding.amount + extraAmount,
      },
    };
    return generatePayoffPlan(debts, modifiedStrategy);
  }, [debts, strategy, extraAmount]);

  const currentDate = currentPlan.debtFreeDate ? parseISO(currentPlan.debtFreeDate) : null;
  const whatIfDate = whatIfPlan.debtFreeDate ? parseISO(whatIfPlan.debtFreeDate) : null;
  const monthsSaved = currentDate && whatIfDate ? differenceInMonths(currentDate, whatIfDate) : 0;
  const interestSaved = currentPlan.totalInterest - whatIfPlan.totalInterest;

  return (
    <section className="rui-card pl-what">
      <div className="pl-what-top">
        <Plank icon={<Zap size={18} aria-hidden="true" />}>What If...?</Plank>
        <p className="pl-note">Extra payment impact</p>
        <span className="num pl-what-amt" aria-live="polite">+{formatCurrency(extraAmount)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1000}
        step={25}
        value={extraAmount}
        onChange={(e) => setExtraAmount(Number(e.target.value))}
        className="pl-range"
        aria-label="Extra monthly payment"
      />
      <div className="pl-range-ends" aria-hidden="true">
        <span>$0</span>
        <span>$500</span>
        <span>$1,000</span>
      </div>

      <div className="pl-presets">
        {SLIDER_PRESETS.map((amount) => (
          <button key={amount} type="button" className="pl-preset" aria-pressed={extraAmount === amount} onClick={() => setExtraAmount(amount)}>
            +${amount}
          </button>
        ))}
      </div>

      {extraAmount > 0 ? (
        <>
          <dl className="pl-res">
            <div>
              <span className="pl-chip good"><Calendar size={17} aria-hidden="true" /></span>
              <div>
                <dt>Time saved</dt>
                <dd className="good">
                  {monthsSaved > 0 ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner` : 'Same timeline'}
                  {monthsSaved > 0 && whatIfDate && <small>Free by {format(whatIfDate, 'MMM yyyy')}</small>}
                </dd>
              </div>
            </div>
            <div>
              <span className="pl-chip"><DollarSign size={17} aria-hidden="true" /></span>
              <div>
                <dt>Interest saved</dt>
                <dd className="num">{interestSaved > 0 ? formatCurrency(interestSaved) : '$0.00'}</dd>
              </div>
            </div>
            <div>
              <span className="pl-chip"><TrendingDown size={17} aria-hidden="true" /></span>
              <div>
                <dt>New total interest</dt>
                <dd className="num">
                  {formatCurrency(whatIfPlan.totalInterest)}
                  <small>vs {formatCurrency(currentPlan.totalInterest)}</small>
                </dd>
              </div>
            </div>
          </dl>

          {monthsSaved >= 12 && (
            <p className="pl-cheer">
              <Sparkles size={15} aria-hidden="true" />
              That's {Math.floor(monthsSaved / 12)} year{Math.floor(monthsSaved / 12) !== 1 ? 's' : ''} closer to freedom!
            </p>
          )}
        </>
      ) : (
        <p className="pl-empty">Move the slider to see how extra payments help</p>
      )}
    </section>
  );
}
