/**
 * Payment History Summary
 *
 * Bar chart of actual completed payments by month,
 * plus summary stats (total paid, principal, interest).
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../lib/calculations';
import type { Payment } from '../../types';
import { chartAxisLine, chartGrid, chartTick, chartTooltip, moneyTick } from './chartTheme';
import '../../pages/track.css';

interface PaymentHistorySummaryProps {
  payments: Payment[];
}

export function PaymentHistorySummary({ payments }: PaymentHistorySummaryProps) {
  const { monthlyData, stats } = useMemo(() => {
    const completed = payments.filter((p) => p.isCompleted && p.completedAt);

    // Group by month
    const grouped: Record<string, { total: number; principal: number; interest: number; count: number }> = {};

    completed.forEach((p) => {
      const month = format(parseISO(p.completedAt!), 'yyyy-MM');
      if (!grouped[month]) grouped[month] = { total: 0, principal: 0, interest: 0, count: 0 };
      grouped[month].total += p.amount;
      grouped[month].principal += p.principal;
      grouped[month].interest += p.interest;
      grouped[month].count += 1;
    });

    const monthlyData = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months max
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yy'),
        total: Math.round(data.total * 100) / 100,
        principal: Math.round(data.principal * 100) / 100,
        interest: Math.round(data.interest * 100) / 100,
        count: data.count,
      }));

    const stats = {
      totalPaid: completed.reduce((sum, p) => sum + p.amount, 0),
      totalPrincipal: completed.reduce((sum, p) => sum + p.principal, 0),
      totalInterest: completed.reduce((sum, p) => sum + p.interest, 0),
      count: completed.length,
    };

    return { monthlyData, stats };
  }, [payments]);

  if (stats.count === 0) {
    return <p className="cht-empty">No payments recorded yet. Log your first payment to see history!</p>;
  }

  return (
    <div className="cht-stack">
      {monthlyData.length > 0 && (
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={monthlyData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="month" tick={chartTick} tickLine={false} axisLine={chartAxisLine} />
            <YAxis tick={chartTick} tickLine={false} axisLine={false} tickFormatter={moneyTick} width={44} />
            <Tooltip
              {...chartTooltip}
              cursor={{ fill: 'var(--ranch-page2)' }}
              formatter={(value, name) => [formatCurrency(value as number), name === 'principal' ? 'Principal' : 'Interest']}
            />
            <Bar dataKey="principal" stackId="payments" fill="var(--ranch-fill)" />
            <Bar dataKey="interest" stackId="payments" fill="var(--ranch-focus)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <dl className="cht-stats">
        <div>
          <dd className="num">{formatCurrency(stats.totalPaid)}</dd>
          <dt>Total Paid</dt>
        </div>
        <div>
          <dd className="num is-ok">{formatCurrency(stats.totalPrincipal)}</dd>
          <dt>Principal</dt>
        </div>
        <div>
          <dd className="num is-bad">{formatCurrency(stats.totalInterest)}</dd>
          <dt>Interest</dt>
        </div>
      </dl>
    </div>
  );
}
