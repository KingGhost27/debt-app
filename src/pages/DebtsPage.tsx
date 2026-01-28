/**
 * Debts Page
 *
 * Manage all debts - add, edit, delete.
 * Shows balance by category chart and sortable debt list.
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronDown, ArrowUpDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { DebtModal } from '../components/ui/DebtModal';
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  calculateUtilization,
  calculatePayoffDate,
} from '../lib/calculations';
import type { Debt, DebtCategory } from '../types';
import { CATEGORY_INFO } from '../types';

type SortOption = 'balance' | 'apr' | 'name' | 'minimum';
type ChartView = 'category' | 'debt';

// Distinct color palette for individual debts in "By Debt" view
const DEBT_COLORS = [
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
  '#eab308', // yellow
  '#22c55e', // green
  '#0ea5e9', // sky
];

export function DebtsPage() {
  const { debts, deleteDebt, settings, customCategories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('balance');
  const [sortAscending, setSortAscending] = useState(false);
  const [chartView, setChartView] = useState<ChartView>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Helper to get category info (supports custom categories)
  const getCategoryInfo = (categoryId: string) => {
    // Check built-in categories first
    if (categoryId in CATEGORY_INFO) {
      const info = CATEGORY_INFO[categoryId as DebtCategory];
      // Check for color override
      const overrideColor = settings.categoryColors[categoryId];
      return {
        label: info.label,
        color: overrideColor || info.color,
      };
    }
    // Check custom categories
    const custom = customCategories.find((c) => c.id === categoryId);
    if (custom) {
      return {
        label: custom.name,
        color: custom.color,
      };
    }
    // Fallback
    return { label: 'Other', color: '#6b7280' };
  };

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
        category,
        balance,
        ...getCategoryInfo(category),
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [debts, settings.categoryColors, customCategories]);

  // Individual debt chart data grouped by category, with unique colors per debt
  const debtTotals = useMemo(() => {
    return debts
      .map((d) => ({
        id: d.id,
        name: d.name,
        balance: d.balance,
        category: d.category,
        color: '', // assigned after sorting
      }))
      .sort((a, b) => {
        // Group by category first, then by balance within category
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return b.balance - a.balance;
      })
      .map((d, index) => ({
        ...d,
        color: DEBT_COLORS[index % DEBT_COLORS.length],
      }));
  }, [debts]);

  // Chart data based on view
  const chartData = chartView === 'category' ? categoryTotals : debtTotals;

  // Filter and sort debts
  const filteredDebts = useMemo(() => {
    let result = [...debts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          getCategoryInfo(d.category).label.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'balance':
          comparison = b.balance - a.balance;
          break;
        case 'apr':
          comparison = b.apr - a.apr;
          break;
        case 'minimum':
          comparison = b.minimumPayment - a.minimumPayment;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortAscending ? -comparison : comparison;
    });

    return result;
  }, [debts, searchQuery, sortBy, sortAscending, settings.categoryColors, customCategories]);

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
        {/* Balance Chart */}
        {debts.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-500">
                Balance by {chartView === 'category' ? 'category' : 'debt'}
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setChartView('category')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    chartView === 'category'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Category
                </button>
                <button
                  onClick={() => setChartView('debt')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    chartView === 'debt'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  By Debt
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Donut chart - larger size */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    return chartData.reduce(
                      (acc, item) => {
                        const fraction = item.balance / totalBalance;
                        const arcLength = fraction * circumference;
                        acc.elements.push(
                          <circle
                            key={'id' in item ? item.id : item.category}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                            strokeDashoffset={-acc.offset}
                          />
                        );
                        acc.offset += arcLength;
                        return acc;
                      },
                      { elements: [] as React.ReactElement[], offset: 0 }
                    ).elements;
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{formatCompactCurrency(totalBalance)}</span>
                </div>
              </div>

              {/* Enhanced Legend with amounts and progress bars */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-40 pr-4">
                {(chartView === 'category' ? categoryTotals : debtTotals).map((item) => {
                  const percent = totalBalance > 0 ? (item.balance / totalBalance) * 100 : 0;
                  const key = 'id' in item ? item.id : item.category;
                  const label = 'name' in item ? item.name : item.label;

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate">{label}</span>
                          <span className="font-medium text-gray-900 ml-2 flex-shrink-0">
                            {formatCurrency(item.balance)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Debts List Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Debts ({debts.length})</h2>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-2">
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
              className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
            >
              <option value="balance">Balance</option>
              <option value="apr">APR</option>
              <option value="minimum">Minimum</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
          <button
            onClick={() => setSortAscending(!sortAscending)}
            className={`p-2 border rounded-xl transition-colors ${
              sortAscending
                ? 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
            title={sortAscending ? 'Ascending (Low to High)' : 'Descending (High to Low)'}
          >
            <ArrowUpDown size={18} />
          </button>
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
              const categoryInfo = getCategoryInfo(debt.category);

              // Calculate payoff estimate (minimum payment only)
              const payoffEstimate = debt.minimumPayment > 0
                ? calculatePayoffDate(debt, debt.minimumPayment)
                : null;

              return (
                <div
                  key={debt.id}
                  className="card"
                  style={{ borderLeftColor: categoryInfo.color, borderLeftWidth: 4 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <div>
                        <span className="font-semibold text-lg">{debt.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{categoryInfo.label}</span>
                      </div>
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
                      {payoffEstimate && (
                        <div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={10} />
                            Est. payoff
                          </p>
                          <p className="font-semibold text-primary-600">
                            {format(payoffEstimate.date, 'MMM yyyy')}
                          </p>
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
