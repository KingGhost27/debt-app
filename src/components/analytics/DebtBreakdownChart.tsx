/**
 * Debt Breakdown Chart
 *
 * Stacked area chart showing each individual debt's remaining
 * balance declining over time as colored layers. Colors, grid, axis text and
 * tooltip come from the ranch tokens (see chartTheme).
 */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../lib/calculations';
import type { Debt, MonthlyPayment } from '../../types';
import { SERIES_COLORS, chartAxisLine, chartGrid, chartTick, chartTooltip, moneyTick } from './chartTheme';
import '../../pages/track.css';

interface DebtBreakdownChartProps {
  monthlyBreakdown: MonthlyPayment[];
  debts: Debt[];
}

export function DebtBreakdownChart({ monthlyBreakdown, debts }: DebtBreakdownChartProps) {
  const { chartData, debtInfo } = useMemo(() => {
    if (!monthlyBreakdown || monthlyBreakdown.length === 0 || debts.length === 0) {
      return { chartData: [], debtInfo: [] };
    }

    const info = debts.map((debt, i) => ({
      id: debt.id,
      name: debt.name,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }));

    // Sample data if too many months
    const data = monthlyBreakdown.length > 60
      ? monthlyBreakdown.filter((_, i) => i % Math.ceil(monthlyBreakdown.length / 60) === 0)
      : monthlyBreakdown;

    const points = data.map((month) => {
      const point: Record<string, string | number> = {
        month: format(parseISO(month.month + '-01'), 'MMM yy'),
      };
      for (const debt of debts) {
        const payment = month.payments.find((p) => p.debtId === debt.id);
        point[debt.id] = payment ? Math.round(payment.remainingBalance * 100) / 100 : 0;
      }
      return point;
    });

    return { chartData: points, debtInfo: info };
  }, [monthlyBreakdown, debts]);

  if (chartData.length === 0) {
    return <p className="cht-empty">No payoff data available</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="month" tick={chartTick} tickLine={false} axisLine={chartAxisLine} interval="preserveStartEnd" />
          <YAxis tick={chartTick} tickLine={false} axisLine={false} tickFormatter={moneyTick} width={48} />
          <Tooltip
            {...chartTooltip}
            formatter={(value, name) => {
              const debt = debtInfo.find((d) => d.id === (name as string));
              return [formatCurrency(value as number), debt?.name || (name as string)];
            }}
          />
          {debtInfo.map((debt) => (
            <Area
              key={debt.id}
              type="monotone"
              dataKey={debt.id}
              name={debt.id}
              stackId="debts"
              stroke={debt.color}
              fill={debt.color}
              fillOpacity={0.55}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <ul className="cht-legend">
        {debtInfo.map((debt) => (
          <li key={debt.id}>
            <i className="cht-dot" style={{ background: debt.color }} />
            <span>{debt.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
