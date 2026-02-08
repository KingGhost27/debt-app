/**
 * Payment History Summary
 *
 * Bar chart of actual completed payments by month,
 * plus summary stats (total paid, principal, interest).
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../lib/calculations';
import type { Payment } from '../../types';

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
    return (
      <div className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">
        No payments recorded yet. Log your first payment to see history!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bar chart */}
      {monthlyData.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              width={40}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value as number),
                name === 'principal' ? 'Principal' : 'Interest',
              ]}
              labelStyle={{ color: '#374151', fontWeight: 600 }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
            <Bar
              dataKey="principal"
              stackId="payments"
              fill="var(--color-primary-500)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="interest"
              stackId="payments"
              fill="#f87171"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(stats.totalPaid)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(stats.totalPrincipal)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Principal</p>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <p className="text-lg font-bold text-red-500 dark:text-red-400">
            {formatCurrency(stats.totalInterest)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Interest</p>
        </div>
      </div>
    </div>
  );
}
