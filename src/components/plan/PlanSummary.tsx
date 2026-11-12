/**
 * Plan Summary - ranch edition.
 *
 * The strategy comparison: an animated segment switch picks snowball or
 * avalanche, and a table compares the two on debt-free time, interest and
 * total paid, marking the better one in each row.
 */

import { parseISO } from 'date-fns';
import { Trophy, TrendingDown, DollarSign, Check, Sparkles, Mountain, Snowflake, Crown } from 'lucide-react';
import { formatCurrency, formatTimeUntil } from '../../lib/calculations';
import { Plank } from '../dashboard/RanchPanels';
import { AnimatedTabs } from './AnimatedTabs';
import type { PayoffPlan, PayoffStrategy } from '../../types';

interface PlanSummaryProps {
  avalanchePlan: PayoffPlan;
  snowballPlan: PayoffPlan;
  strategy: PayoffStrategy;
  onStrategyChange: (strategy: PayoffStrategy) => void;
}

const TABS = [
  { id: 'avalanche', label: 'Avalanche', icon: <Mountain size={17} aria-hidden="true" /> },
  { id: 'snowball', label: 'Snowball', icon: <Snowflake size={17} aria-hidden="true" /> },
];

export function PlanSummary({ avalanchePlan, snowballPlan, strategy, onStrategyChange }: PlanSummaryProps) {
  const avalancheDate = avalanchePlan.debtFreeDate ? parseISO(avalanchePlan.debtFreeDate) : null;
  const snowballDate = snowballPlan.debtFreeDate ? parseISO(snowballPlan.debtFreeDate) : null;

  // lower is better for each metric
  const betterTime: PayoffStrategy = (() => {
    if (avalanchePlan.debtFreeDate && snowballPlan.debtFreeDate) {
      return avalanchePlan.debtFreeDate <= snowballPlan.debtFreeDate ? 'avalanche' : 'snowball';
    }
    if (avalanchePlan.debtFreeDate) return 'avalanche';
    if (snowballPlan.debtFreeDate) return 'snowball';
    // both plans stall, so there is no meaningful time winner
    return 'avalanche';
  })();
  const betterInterest = avalanchePlan.totalInterest <= snowballPlan.totalInterest ? 'avalanche' : 'snowball';
  const betterTotal = avalanchePlan.totalPayments <= snowballPlan.totalPayments ? 'avalanche' : 'snowball';
  const interestSavings = Math.abs(avalanchePlan.totalInterest - snowballPlan.totalInterest);

  const cell = (who: PayoffStrategy, text: string, best: boolean, tone: 'dim' | 'worse' | 'plain') => (
    <td className={strategy === who ? 'is-sel' : undefined}>
      <span className={`val ${best ? 'best' : tone === 'plain' ? '' : tone}`.trim()}>
        {text}
        {best && <span className="tick"><Check size={12} strokeWidth={3} aria-label="Best of the two" /></span>}
      </span>
    </td>
  );

  const head = (who: PayoffStrategy, name: string) => (
    <th scope="col" className={strategy === who ? 'is-sel' : undefined}>
      {name}
      {betterInterest === who && (
        <div><span className="rui-badge ok"><Crown size={13} aria-hidden="true" />Best Value!</span></div>
      )}
    </th>
  );

  return (
    <section className="rui-card pl-sum">
      <div className="pl-h"><Plank icon={<Sparkles size={18} aria-hidden="true" />}>Strategy Comparison</Plank></div>

      <AnimatedTabs tabs={TABS} activeTab={strategy} onChange={(id) => onStrategyChange(id as PayoffStrategy)} label="Payoff strategy" />

      <table className="pl-cmp">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Measure</span></th>
            {head('avalanche', 'Avalanche')}
            {head('snowball', 'Snowball')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row"><span className="rowh"><span className="pl-chip"><Trophy size={16} aria-hidden="true" /></span>Debt-Free</span></th>
            {cell('avalanche', avalancheDate ? formatTimeUntil(avalancheDate) : 'N/A', betterTime === 'avalanche', 'dim')}
            {cell('snowball', snowballDate ? formatTimeUntil(snowballDate) : 'N/A', betterTime === 'snowball', 'dim')}
          </tr>
          <tr>
            <th scope="row"><span className="rowh"><span className="pl-chip"><TrendingDown size={16} aria-hidden="true" /></span>Interest</span></th>
            {cell('avalanche', formatCurrency(avalanchePlan.totalInterest), betterInterest === 'avalanche', 'worse')}
            {cell('snowball', formatCurrency(snowballPlan.totalInterest), betterInterest === 'snowball', 'worse')}
          </tr>
          <tr>
            <th scope="row"><span className="rowh"><span className="pl-chip"><DollarSign size={16} aria-hidden="true" /></span>Total Paid</span></th>
            {cell('avalanche', formatCurrency(avalanchePlan.totalPayments), betterTotal === 'avalanche', 'plain')}
            {cell('snowball', formatCurrency(snowballPlan.totalPayments), betterTotal === 'snowball', 'plain')}
          </tr>
        </tbody>
      </table>

      <div className="pl-strat">
        {strategy === 'avalanche' ? <Mountain size={20} aria-hidden="true" /> : <Snowflake size={20} aria-hidden="true" />}
        <div>
          <strong>{strategy === 'avalanche' ? 'Avalanche Strategy' : 'Snowball Strategy'}</strong>
          <p>
            {strategy === 'avalanche' ? (
              <>
                Pays off highest interest debts first, saving you the most money.
                {interestSavings > 0 && betterInterest === 'avalanche' && (
                  <> You'll save <b>{formatCurrency(interestSavings)}</b> in interest vs Snowball!</>
                )}
              </>
            ) : (
              <>
                Pays off smallest balances first, giving you quick wins to stay motivated.
                {interestSavings > 0 && betterInterest === 'avalanche' && (
                  <> Trade-off: <b>{formatCurrency(interestSavings)}</b> more interest vs Avalanche.</>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
