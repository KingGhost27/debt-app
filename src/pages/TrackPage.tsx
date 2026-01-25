/**
 * Track Page
 *
 * Track upcoming and completed payments.
 */

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { formatCurrency, generatePayoffPlan } from '../lib/calculations';

type TabType = 'upcoming' | 'complete' | 'calendar';

export function TrackPage() {
  const { debts, strategy, payments } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  // Generate upcoming payments from payoff plan
  const plan = useMemo(
    () => generatePayoffPlan(debts, strategy),
    [debts, strategy]
  );

  // Group monthly breakdown by month
  const upcomingByMonth = useMemo(() => {
    const grouped: Record<string, typeof plan.monthlyBreakdown[0]['payments']> = {};

    // Take next 6 months of payments
    plan.monthlyBreakdown.slice(0, 6).forEach((month) => {
      const monthKey = month.month;
      grouped[monthKey] = month.payments;
    });

    return grouped;
  }, [plan]);

  // Get completed payments
  const completedPayments = useMemo(
    () => payments.filter((p) => p.isCompleted).sort(
      (a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    ),
    [payments]
  );

  if (debts.length === 0) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Tracking" subtitle="Record your transactions" />
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">Add debts to start tracking payments.</p>
          <a
            href="/debts"
            className="inline-flex items-center mt-4 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            Add Debts
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Tracking" subtitle="Record your transactions" />

      <div className="px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          {(['upcoming', 'complete', 'calendar'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Upcoming Tab */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {Object.entries(upcomingByMonth).map(([monthKey, monthPayments]) => {
              const monthDate = parseISO(`${monthKey}-01`);

              return (
                <div key={monthKey}>
                  <h3 className="text-lg font-semibold mb-3">
                    {format(monthDate, 'MMMM yyyy')}
                  </h3>

                  <div className="space-y-3">
                    {/* Recurring funding entry */}
                    {strategy.recurringFunding.amount > 0 && (
                      <div className="card flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">💵</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Recurring funding</p>
                          <p className="text-sm text-gray-500">
                            {format(monthDate, 'MMM')} {strategy.recurringFunding.dayOfMonth}, {format(monthDate, 'yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(strategy.recurringFunding.amount)}
                          </p>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Fund
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Individual debt payments */}
                    {monthPayments.map((payment) => {
                      const debt = debts.find((d) => d.id === payment.debtId);
                      if (!debt) return null;

                      return (
                        <div
                          key={`${monthKey}-${payment.debtId}`}
                          className="card flex items-center gap-4"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">💳</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{payment.debtName}</p>
                            <p className="text-sm text-gray-500">
                              {format(monthDate, 'MMM')} {debt.dueDay}, {format(monthDate, 'yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                payment.type === 'extra'
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {payment.type === 'extra' ? 'Extra' : 'Minimum'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {Object.keys(upcomingByMonth).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Set your monthly budget in Strategy to see upcoming payments.</p>
              </div>
            )}
          </div>
        )}

        {/* Complete Tab */}
        {activeTab === 'complete' && (
          <div className="space-y-3">
            {completedPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No completed payments yet.</p>
                <p className="text-sm mt-2">
                  Mark payments as complete when you make them.
                </p>
              </div>
            ) : (
              completedPayments.map((payment) => {
                const debt = debts.find((d) => d.id === payment.debtId);

                return (
                  <div key={payment.id} className="card flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{debt?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {payment.completedAt
                          ? format(parseISO(payment.completedAt), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="text-center py-8 text-gray-500">
            <p>Calendar view coming soon!</p>
            <p className="text-sm mt-2">
              This will show a monthly calendar with payment due dates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
