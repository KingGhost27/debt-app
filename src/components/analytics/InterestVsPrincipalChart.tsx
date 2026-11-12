/**
 * Interest vs Principal Chart
 *
 * Stacked area chart showing how payments split between
 * principal and interest over the payoff timeline. Principal reads as the
 * ranch fill, interest as the focus color; everything else is ranch tokens.
 */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../lib/calculations';
import type { MonthlyPayment } from '../../types';
import { chartAxisLine, chartGrid, chartTick, chartTooltip, moneyTick } from './chartTheme';
import '../../pages/track.css';

interface InterestVsPrincipalChartProps {
  monthlyBreakdown: MonthlyPayment[];
}

export function InterestVsPrincipalChart({ monthlyBreakdown }: InterestVsPrincipalChartProps) {
  const chartData = useMemo(() => {
    if (!monthlyBreakdown || monthlyBreakdown.length === 0) return [];

    // Sample data if too many months (keep ~60 points max)
    const data = monthlyBreakdown.length > 60
      ? monthlyBreakdown.filter((_, i) => i % Math.ceil(monthlyBreakdown.length / 60) === 0)
      : monthlyBreakdown;

    return data.map((month) => ({
      month: format(parseISO(month.month + '-01'), 'MMM yy'),
      principal: Math.round(month.totalPrincipal * 100) / 100,
      interest: Math.round(month.totalInterest * 100) / 100,
    }));
  }, [monthlyBreakdown]);

  if (chartData.length === 0) {
    return <p className="cht-empty">No payoff data available</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="month" tick={chartTick} tickLine={false} axisLine={chartAxisLine} interval="preserveStartEnd" />
          <YAxis tick={chartTick} tickLine={false} axisLine={false} tickFormatter={moneyTick} width={48} />
          <Tooltip
            {...chartTooltip}
            formatter={(value, name) => [formatCurrency(value as number), name === 'principal' ? 'Principal' : 'Interest']}
          />
          <Area type="monotone" dataKey="principal" stackId="payments" stroke="var(--ranch-fill)" fill="var(--ranch-fill)" fillOpacity={0.5} strokeWidth={2} />
          <Area type="monotone" dataKey="interest" stackId="payments" stroke="var(--ranch-focus)" fill="var(--ranch-focus)" fillOpacity={0.45} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      <ul className="cht-legend">
        <li><i className="cht-dot" style={{ background: 'var(--ranch-fill)' }} /><span>Principal</span></li>
        <li><i className="cht-dot" style={{ background: 'var(--ranch-focus)' }} /><span>Interest</span></li>
      </ul>
    </div>
  );
}
