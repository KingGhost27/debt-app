/**
 * Debts Page
 *
 * Manage all debts - add, edit, delete.
 * Shows balance by category chart and sortable debt list.
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronDown, ArrowUpDown, Calendar, HelpCircle, RefreshCw, Check, X } from 'lucide-react';
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
  generatePayoffPlan,
} from '../lib/calculations';
import type { Debt, DebtCategory } from '../types';
import { CATEGORY_INFO } from '../types';

type SortOption = 'balance' | 'apr' | 'name' | 'minimum' | 'dueDay';
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
  const { debts, deleteDebt, updateDebt, settings, customCategories, strategy } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('balance');
  const [sortAscending, setSortAscending] = useState(false);
  const [chartView, setChartView] = useState<ChartView>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showAPRTooltip, setShowAPRTooltip] = useState(false);
  const [recalibratingDebtId, setRecalibratingDebtId] = useState<string | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');

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

  // Calculate monthly interest cost across all debts
  const monthlyInterestCost = useMemo(() => {
    return debts.reduce((sum, debt) => {
      return sum + (debt.balance * (debt.apr / 100) / 12);
    }, 0);
  }, [debts]);

  // Get debts sorted by APR for comparison chart
  const debtsByAPR = useMemo(() => {
    return [...debts]
      .sort((a, b) => b.apr - a.apr)
      .map((debt) => ({
        id: debt.id,
        name: debt.name,
        apr: debt.apr,
      }));
  }, [debts]);

  // Find max APR for scaling the bar chart
  const maxAPR = useMemo(() => {
    if (debts.length === 0) return 30; // Default scale
    return Math.max(...debts.map(d => d.apr), 30); // At least 30% for scale
  }, [debts]);

  // Generate payoff plan for timeline milestones
  const payoffMilestones = useMemo(() => {
    if (debts.length === 0 || strategy.recurringFunding.amount <= 0) return [];

    const plan = generatePayoffPlan(debts, strategy);
    if (!plan) return [];

    // Extract all milestones from steps
    const milestones: { debtId: string; debtName: string; payoffDate: string }[] = [];
    plan.steps.forEach(step => {
      step.milestonesInStep.forEach(milestone => {
        milestones.push({
          debtId: milestone.debtId,
          debtName: milestone.debtName,
          payoffDate: milestone.payoffDate,
        });
      });
    });

    return milestones;
  }, [debts, strategy]);

  // Get APR color based on risk level
  const getAPRColor = (apr: number): string => {
    if (apr >= 20) return '#ef4444'; // red - high risk
    if (apr >= 10) return '#f59e0b'; // amber - medium risk
    return '#22c55e'; // green - low risk
  };

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
        case 'dueDay':
          comparison = a.dueDay - b.dueDay;
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

  // Recalibration handlers
  const startRecalibration = (debt: Debt) => {
    setRecalibratingDebtId(debt.id);
    setNewBalanceInput(debt.balance.toFixed(2));
  };

  const cancelRecalibration = () => {
    setRecalibratingDebtId(null);
    setNewBalanceInput('');
  };

  const saveRecalibration = (debtId: string) => {
    const newBalance = parseFloat(newBalanceInput);
    if (!isNaN(newBalance) && newBalance >= 0) {
      const debt = debts.find(d => d.id === debtId);
      // If new balance is higher than original, update original too
      // This keeps the progress ring working correctly
      if (debt && newBalance > debt.originalBalance) {
        updateDebt(debtId, { balance: newBalance, originalBalance: newBalance });
      } else {
        updateDebt(debtId, { balance: newBalance });
      }
    }
    cancelRecalibration();
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
        {/* Balance Chart & Monthly Interest */}
        {debts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Chart Card */}
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

            {/* Monthly Interest Cost Card */}
            <div className="card flex flex-col justify-center">
              <h2 className="text-sm text-gray-500 mb-2">Monthly Interest Cost</h2>
              <p className="text-3xl font-bold text-red-500">
                {formatCurrency(monthlyInterestCost)}
                <span className="text-lg font-normal text-gray-400">/mo</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This is how much your debt costs you every month in interest alone.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Daily cost</span>
                  <span className="font-medium">{formatCurrency(monthlyInterestCost / 30)}/day</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Yearly cost</span>
                  <span className="font-medium">{formatCurrency(monthlyInterestCost * 12)}/yr</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APR Comparison Chart */}
        {debts.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-1.5 mb-4">
              <h2 className="text-sm text-gray-500">APR Comparison</h2>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowAPRTooltip(true)}
                  onMouseLeave={() => setShowAPRTooltip(false)}
                  onClick={() => setShowAPRTooltip(!showAPRTooltip)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HelpCircle size={14} />
                </button>
                {showAPRTooltip && (
                  <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">What is APR?</p>
                    <p className="text-gray-300">
                      APR (Annual Percentage Rate) is the yearly interest rate you pay on your debt.
                      Higher APR means more money going to interest instead of paying down your balance.
                    </p>
                    <p className="mt-2 text-gray-300">
                      <span className="text-green-400">Green</span> = Low risk (&lt;10%),
                      <span className="text-amber-400"> Amber</span> = Medium (10-20%),
                      <span className="text-red-400"> Red</span> = High (&gt;20%)
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {debtsByAPR.map((debt) => {
                const barWidth = (debt.apr / maxAPR) * 100;
                const color = getAPRColor(debt.apr);

                return (
                  <div key={debt.id} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-700 truncate flex-shrink-0">
                      {debt.name}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(barWidth, 10)}%`,
                          backgroundColor: color,
                        }}
                      >
                        {barWidth > 20 && (
                          <span className="text-xs font-medium text-white">
                            {debt.apr.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {barWidth <= 20 && (
                      <span className="text-sm font-medium text-gray-700 w-14 text-right">
                        {debt.apr.toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>&lt;10%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>10-20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>&gt;20%</span>
              </div>
            </div>
          </div>
        )}

        {/* Payoff Timeline */}
        {payoffMilestones.length > 0 && (
          <div className="card">
            <h2 className="text-sm text-gray-500 mb-4">Payoff Timeline</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />

              {/* Timeline markers */}
              <div className="relative flex justify-between">
                {payoffMilestones.map((milestone, index) => (
                  <div
                    key={milestone.debtId}
                    className="flex flex-col items-center"
                    style={{ flex: 1 }}
                  >
                    {/* Dot */}
                    <div
                      className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold z-10"
                    >
                      {index + 1}
                    </div>
                    {/* Debt name */}
                    <span className="mt-2 text-xs font-medium text-gray-700 text-center max-w-[80px] truncate">
                      {milestone.debtName}
                    </span>
                    {/* Date */}
                    <span className="text-[10px] text-gray-400">
                      {format(new Date(milestone.payoffDate), 'MMM yyyy')}
                    </span>
                  </div>
                ))}

                {/* Debt Free marker */}
                <div className="flex flex-col items-center" style={{ flex: 1 }}>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="mt-2 text-xs font-bold text-green-600 text-center">
                    Debt Free!
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {payoffMilestones.length > 0 &&
                      format(
                        new Date(payoffMilestones[payoffMilestones.length - 1].payoffDate),
                        'MMM yyyy'
                      )}
                  </span>
                </div>
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
              <option value="dueDay">Due Date</option>
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
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          Balance
                          {recalibratingDebtId !== debt.id && (
                            <button
                              onClick={() => startRecalibration(debt)}
                              className="text-primary-500 hover:text-primary-600 transition-colors"
                              title="Update balance from statement"
                            >
                              <RefreshCw size={10} />
                            </button>
                          )}
                        </p>
                        {recalibratingDebtId === debt.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">$</span>
                            <input
                              type="number"
                              value={newBalanceInput}
                              onChange={(e) => setNewBalanceInput(e.target.value)}
                              className="w-24 text-lg font-bold border-b-2 border-primary-500 focus:outline-none bg-transparent"
                              autoFocus
                              step="0.01"
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRecalibration(debt.id);
                                if (e.key === 'Escape') cancelRecalibration();
                              }}
                            />
                            <button
                              onClick={() => saveRecalibration(debt.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelRecalibration}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xl font-bold">{formatCurrency(debt.balance)}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Minimum</p>
                        <p className="font-semibold">{formatCurrency(debt.minimumPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">APR</p>
                        <p className="font-semibold">{formatPercent(debt.apr, 2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={10} />
                          Due
                        </p>
                        <p className="font-semibold">
                          {debt.dueDay}{debt.dueDay === 1 ? 'st' : debt.dueDay === 2 ? 'nd' : debt.dueDay === 3 ? 'rd' : 'th'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Interest Fee */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Est. monthly interest</span>
                      <span className="text-sm font-semibold text-red-500">
                        {formatCurrency(debt.balance * (debt.apr / 100) / 12)}/mo
                      </span>
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
