/**
 * Interest vs Principal Chart
 *
 * Stacked area chart showing how payments split between
 * principal and interest over the payoff timeline.
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
import type { MonthlyPayment } from '../../types';

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
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
        No payoff data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="principal"
            stackId="payments"
            stroke="var(--color-primary-500)"
            fill="url(#principalGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="payments"
            stroke="#ef4444"
            fill="url(#interestGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Principal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Interest</span>
        </div>
      </div>
    </div>
  );
}
