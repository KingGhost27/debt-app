/**
 * Debt Breakdown Chart
 *
 * Stacked area chart showing each individual debt's remaining
 * balance declining over time as colored layers.
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../lib/calculations';
import type { Debt, MonthlyPayment } from '../../types';

interface DebtBreakdownChartProps {
  monthlyBreakdown: MonthlyPayment[];
  debts: Debt[];
}

const DEBT_COLORS = [
  '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b',
  '#ec4899', '#ef4444', '#06b6d4', '#6366f1',
  '#14b8a6', '#f97316', '#a855f7', '#10b981',
];

export function DebtBreakdownChart({ monthlyBreakdown, debts }: DebtBreakdownChartProps) {
  const { chartData, debtInfo } = useMemo(() => {
    if (!monthlyBreakdown || monthlyBreakdown.length === 0 || debts.length === 0) {
      return { chartData: [], debtInfo: [] };
    }

    // Build color map for debts
    const info = debts.map((debt, i) => ({
      id: debt.id,
      name: debt.name,
      color: DEBT_COLORS[i % DEBT_COLORS.length],
    }));

    // Sample data if too many months
    const data = monthlyBreakdown.length > 60
      ? monthlyBreakdown.filter((_, i) => i % Math.ceil(monthlyBreakdown.length / 60) === 0)
      : monthlyBreakdown;

    const points = data.map((month) => {
      const point: Record<string, string | number> = {
        month: format(parseISO(month.month + '-01'), 'MMM yy'),
      };
      // Set balance for each debt (default to 0 if not in this month's payments)
      for (const debt of debts) {
        const payment = month.payments.find((p) => p.debtId === debt.id);
        point[debt.id] = payment ? Math.round(payment.remainingBalance * 100) / 100 : 0;
      }
      return point;
    });

    return { chartData: points, debtInfo: info };
  }, [monthlyBreakdown, debts]);

  if (chartData.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
        No payoff data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
            width={45}
          />
          <Tooltip
            formatter={(value, name) => {
              const debt = debtInfo.find((d) => d.id === (name as string));
              return [formatCurrency(value as number), debt?.name || (name as string)];
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
              fillOpacity={0.5}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3">
        {debtInfo.map((debt) => (
          <div key={debt.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: debt.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
              {debt.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
