/**
 * Debts Page
 *
 * Manage all debts - add, edit, delete.
 * Shows balance by category chart and sortable debt list.
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { DebtModal } from '../components/ui/DebtModal';
import { formatCurrency, formatPercent, calculateUtilization } from '../lib/calculations';
import type { Debt, DebtCategory } from '../types';
import { CATEGORY_INFO } from '../types';

type SortOption = 'balance' | 'apr' | 'name' | 'minimum';

export function DebtsPage() {
  const { debts, deleteDebt } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('balance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Calculate total balance
  const totalBalance = useMemo(
    () => debts.reduce((sum, d) => sum + d.balance, 0),
    [debts]
  );

  // Group balances by category
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    debts.forEach((d) => {
      totals[d.category] = (totals[d.category] || 0) + d.balance;
    });
    return Object.entries(totals)
      .map(([category, balance]) => ({
        category: category as DebtCategory,
        balance,
        ...CATEGORY_INFO[category as DebtCategory],
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [debts]);

  // Filter and sort debts
  const filteredDebts = useMemo(() => {
    let result = [...debts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          CATEGORY_INFO[d.category].label.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return b.balance - a.balance;
        case 'apr':
          return b.apr - a.apr;
        case 'minimum':
          return b.minimumPayment - a.minimumPayment;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [debts, searchQuery, sortBy]);

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setIsModalOpen(true);
  };

  const handleDelete = (debt: Debt) => {
    if (window.confirm(`Are you sure you want to delete "${debt.name}"?`)) {
      deleteDebt(debt.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDebt(null);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Debts"
        subtitle="Manage all your debts in one place"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Balance by Category */}
        {categoryTotals.length > 0 && (
          <div className="card">
            <h2 className="text-sm text-gray-500 mb-4">Balance by category</h2>
            <div className="flex items-center gap-6">
              {/* Simple donut representation */}
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {categoryTotals.reduce(
                    (acc, cat) => {
                      const percentage = (cat.balance / totalBalance) * 100;
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      acc.elements.push(
                        <circle
                          key={cat.category}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-acc.offset}
                        />
                      );
                      acc.offset += percentage;
                      return acc;
                    },
                    { elements: [] as React.ReactElement[], offset: 0 }
                  ).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{formatCurrency(totalBalance)}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1">
                {categoryTotals.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-600">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Debts List Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Debts ({debts.length})</h2>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="balance">Balance</option>
              <option value="apr">APR</option>
              <option value="minimum">Minimum</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Debt Cards */}
        {filteredDebts.length === 0 ? (
          <div className="text-center py-12">
            {debts.length === 0 ? (
              <>
                <p className="text-gray-500 mb-4">No debts added yet</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
                >
                  <Plus size={20} />
                  Add Your First Debt
                </button>
              </>
            ) : (
              <p className="text-gray-500">No debts match your search</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDebts.map((debt) => {
              const percentPaid =
                debt.originalBalance > 0
                  ? ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100
                  : 0;
              const utilization = debt.creditLimit
                ? calculateUtilization(debt.balance, debt.creditLimit)
                : null;
              const categoryInfo = CATEGORY_INFO[debt.category];

              return (
                <div
                  key={debt.id}
                  className="card"
                  style={{ borderLeftColor: categoryInfo.color, borderLeftWidth: 4 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <span className="font-semibold text-lg">{debt.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(debt)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(debt)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {percentPaid > 0 && (
                      <ProgressRing
                        percentage={percentPaid}
                        size={60}
                        strokeWidth={6}
                        color={categoryInfo.color}
                      />
                    )}

                    <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className="text-xl font-bold">{formatCurrency(debt.balance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Minimum</p>
                        <p className="font-semibold">{formatCurrency(debt.minimumPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">APR</p>
                        <p className="font-semibold">{formatPercent(debt.apr)}</p>
                      </div>
                      {debt.creditLimit && (
                        <div>
                          <p className="text-xs text-gray-500">Credit limit</p>
                          <p className="font-semibold">{formatCurrency(debt.creditLimit)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Utilization bar */}
                  {utilization !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Credit utilization</span>
                        <span
                          className={utilization > 30 ? 'text-red-500 font-medium' : ''}
                        >
                          {formatPercent(utilization, 0)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilization > 100
                              ? 'bg-red-500'
                              : utilization > 30
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <DebtModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        debt={editingDebt}
      />
    </div>
  );
}
