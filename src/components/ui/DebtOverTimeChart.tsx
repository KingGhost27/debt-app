/**
 * Debt Over Time Chart
 *
 * Line chart showing total debt balance decreasing over time.
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { PayoffPlan } from '../../types';
import { formatCurrency } from '../../lib/calculations';

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
      // Sum up remaining balances for all debts in this month
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
    return (
      <div className="text-center text-gray-500 py-8">
        No payoff data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          width={45}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), 'Balance']}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="var(--color-primary-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--color-primary-500)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
