/**
 * Debt Over Time Chart
 *
 * Line chart showing total debt balance decreasing over time. Themed from the
 * ranch tokens; also rendered on the dashboard.
 */

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { PayoffPlan } from '../../types';
import { formatCurrency } from '../../lib/calculations';
import { chartAxisLine, chartGrid, chartTick, chartTooltip, moneyTick } from '../analytics/chartTheme';
import '../../pages/track.css';

interface DebtOverTimeChartProps {
  plan: PayoffPlan;
  startingBalance: number;
}

export function DebtOverTimeChart({ plan, startingBalance }: DebtOverTimeChartProps) {
  const chartData = useMemo(() => {
    if (!plan.monthlyBreakdown || plan.monthlyBreakdown.length === 0) {
      return [];
    }

    // Start with current balance
    const data = [
      {
        month: 'Now',
        balance: startingBalance,
      },
    ];

    // Add each month's remaining balance
    plan.monthlyBreakdown.forEach((monthData) => {
      const totalRemaining = monthData.payments.reduce(
        (sum, payment) => sum + payment.remainingBalance,
        0
      );

      const monthDate = parseISO(monthData.month + '-01');
      data.push({
        month: format(monthDate, 'MMM yy'),
        balance: totalRemaining,
      });
    });

    return data;
  }, [plan.monthlyBreakdown, startingBalance]);

  if (chartData.length === 0) {
    return <p className="cht-empty">No payoff data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid {...chartGrid} />
        <XAxis dataKey="month" tick={chartTick} tickLine={false} axisLine={chartAxisLine} interval="preserveStartEnd" />
        <YAxis tick={chartTick} tickLine={false} axisLine={false} tickFormatter={moneyTick} width={48} />
        <Tooltip {...chartTooltip} formatter={(value) => [formatCurrency(value as number), 'Balance']} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="var(--ranch-fill)"
          strokeWidth={3}
          fill="var(--ranch-fill)"
          fillOpacity={0.14}
          dot={false}
          activeDot={{ r: 5, fill: 'var(--ranch-fill)', stroke: 'var(--ranch-page)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
