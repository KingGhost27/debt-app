/**
 * Debts Page - Kawaii Edition
 *
 * Manage all debts - add, edit, delete.
 * Shows balance by category chart and sortable debt list.
 * Features cute animations, soft gradients, and delightful interactions.
 */

import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronDown, ArrowUpDown, Calendar, HelpCircle, RefreshCw, Check, X, Sparkles, TrendingDown, Flame } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { ProgressRing } from '../components/ui/ProgressRing';
import { DebtModal } from '../components/ui/DebtModal';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  calculateUtilization,
  generatePayoffPlan,
  formatTimeUntil,
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
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const insightsRef = useRef<HTMLDivElement>(null);
  const { confirm, dialogProps } = useConfirmDialog();

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

  // Individual debt chart data sorted by balance (highest to lowest)
  const debtTotals = useMemo(() => {
    return debts
      .map((d) => ({
        id: d.id,
        name: d.name,
        balance: d.balance,
        category: d.category,
        color: '', // assigned after sorting
      }))
      .sort((a, b) => b.balance - a.balance) // Sort by balance, highest first
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

  // Calculate debt-free date and countdown
  const { debtFreeDate, timeUntilDebtFree } = useMemo(() => {
    if (debts.length === 0 || strategy.recurringFunding.amount <= 0) {
      return { debtFreeDate: null, timeUntilDebtFree: null };
    }
    const plan = generatePayoffPlan(debts, strategy);
    if (!plan?.debtFreeDate) {
      return { debtFreeDate: null, timeUntilDebtFree: null };
    }
    const date = parseISO(plan.debtFreeDate);
    return {
      debtFreeDate: date,
      timeUntilDebtFree: formatTimeUntil(date),
    };
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
    confirm({
      title: 'Delete Debt',
      message: `Are you sure you want to delete "${debt.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteDebt(debt.id),
    });
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
    <div className="min-h-screen bg-gray-50 animate-page-enter">
      <PageHeader
        title="Debts"
        subtitle="Manage all your debts in one place"
        emoji="💳"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 transition-all hover:scale-105 active:scale-95 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 sm:gap-1.5 sm:text-sm sm:font-semibold"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Debt</span>
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Debt-Free Countdown */}
        {debtFreeDate && (
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-5 text-white overflow-hidden shadow-lg shadow-primary-400/30">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <Sparkles size={16} className="absolute top-4 right-16 text-white/30 animate-kawaii-pulse" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary-200" />
                <p className="text-primary-200 text-xs font-semibold tracking-wider uppercase">Debt-Free Countdown</p>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {format(debtFreeDate, 'MMMM yyyy')}
              </p>
              {timeUntilDebtFree && (
                <p className="text-primary-200 text-sm mt-1 flex items-center gap-1">
                  <Sparkles size={12} className="animate-kawaii-pulse" />
                  {timeUntilDebtFree} to go!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Insights Section - Collapsible */}
        {debts.length > 0 && (
          <div>
            <button
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              className="w-full flex items-center justify-between py-3 group"
            >
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-primary-400" />
                Insights
                <span className="text-sm font-normal text-gray-500">
                  ({debts.length} debts)
                </span>
              </h2>
              <ChevronDown
                size={20}
                className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-300 ${
                  insightsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              ref={insightsRef}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: insightsExpanded
                  ? `${insightsRef.current?.scrollHeight || 2000}px`
                  : '0px',
                opacity: insightsExpanded ? 1 : 0,
              }}
            >
              <div className="space-y-6 pb-2">

        {/* Balance Chart & Monthly Interest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Chart Card */}
            <div className="card bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary-400" />
                  Balance by {chartView === 'category' ? 'category' : 'debt'}
                </h2>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setChartView('category')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      chartView === 'category'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    onClick={() => setChartView('debt')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      chartView === 'debt'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    By Debt
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* Donut chart - centered above legend on mobile */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 mx-auto sm:mx-0">
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
                              className="transition-all duration-500"
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
                    <span className="text-sm font-bold text-gray-900">{formatCompactCurrency(totalBalance)}</span>
                  </div>
                </div>

                {/* Enhanced Legend with amounts and progress bars */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-40">
                  {(chartView === 'category' ? categoryTotals : debtTotals).map((item) => {
                    const percent = totalBalance > 0 ? (item.balance / totalBalance) * 100 : 0;
                    const key = 'id' in item ? item.id : item.category;
                    const label = 'name' in item ? item.name : item.label;

                    return (
                      <div key={key} className="flex items-center gap-2 group">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-700 truncate group-hover:text-gray-900 transition-colors">{label}</span>
                            <span className="font-semibold text-gray-900 ml-2 flex-shrink-0">
                              {formatCurrency(item.balance)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
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
            <div className="card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/20 rounded-3xl border border-red-100/50 dark:border-red-800/30 flex flex-col justify-center relative overflow-hidden">
              {/* Decorative flame */}
              <div className="absolute top-4 right-4 text-red-200">
                <Flame size={48} className="opacity-50" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg shadow-red-300/30">
                    <TrendingDown size={20} className="text-white" />
                  </div>
                  <h2 className="text-sm font-medium text-gray-600">Monthly Interest Cost</h2>
                </div>
                <p className="text-3xl font-bold text-red-500">
                  {formatCurrency(monthlyInterestCost)}
                  <span className="text-lg font-normal text-gray-400">/mo</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This is how much your debt costs you every month in interest alone.
                </p>
                <div className="mt-4 pt-4 border-t border-red-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daily cost</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(monthlyInterestCost / 30)}/day</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Yearly cost</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(monthlyInterestCost * 12)}/yr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* APR Comparison Chart */}
          <div className="card bg-white rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Flame size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-medium text-gray-600">APR Comparison</h2>
              <div className="relative ml-auto">
                <button
                  onMouseEnter={() => setShowAPRTooltip(true)}
                  onMouseLeave={() => setShowAPRTooltip(false)}
                  onClick={() => setShowAPRTooltip(!showAPRTooltip)}
                  className="text-gray-400 hover:text-primary-500 transition-colors p-1 rounded-lg hover:bg-primary-50"
                >
                  <HelpCircle size={16} />
                </button>
                {showAPRTooltip && (
                  <div className="absolute z-20 right-0 top-8 w-56 p-4 bg-gray-900 text-white text-xs rounded-2xl shadow-xl">
                    <div className="absolute -top-2 right-4 border-8 border-transparent border-b-gray-900" />
                    <p className="font-semibold mb-2 flex items-center gap-1">
                      <Sparkles size={12} className="text-primary-400" />
                      What is APR?
                    </p>
                    <p className="text-gray-300">
                      APR (Annual Percentage Rate) is the yearly interest rate you pay on your debt.
                      Higher APR means more money going to interest instead of paying down your balance.
                    </p>
                    <p className="mt-3 text-gray-300">
                      <span className="text-green-400 font-medium">Green</span> = Low risk (&lt;10%)<br/>
                      <span className="text-amber-400 font-medium">Amber</span> = Medium (10-20%)<br/>
                      <span className="text-red-400 font-medium">Red</span> = High (&gt;20%)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {debtsByAPR.map((debt) => {
                const barWidth = (debt.apr / maxAPR) * 100;
                const color = getAPRColor(debt.apr);

                return (
                  <div key={debt.id} className="flex items-center gap-3 group">
                    <span className="w-24 text-sm text-gray-700 truncate flex-shrink-0 group-hover:text-gray-900 transition-colors">
                      {debt.name}
                    </span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-xl overflow-hidden">
                      <div
                        className="h-full rounded-xl transition-all duration-500 flex items-center justify-end pr-2 shadow-sm"
                        style={{
                          width: `${Math.max(barWidth, 10)}%`,
                          backgroundColor: color,
                        }}
                      >
                        {barWidth > 20 && (
                          <span className="text-xs font-semibold text-white drop-shadow-sm">
                            {debt.apr.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {barWidth <= 20 && (
                      <span className="text-sm font-semibold text-gray-700 w-14 text-right">
                        {debt.apr.toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200" />
                <span>&lt;10%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                <span>10-20%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200" />
                <span>&gt;20%</span>
              </div>
            </div>
          </div>

        {/* Payoff Timeline */}
        {payoffMilestones.length > 0 && (
          <div className="card bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Calendar size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-medium text-gray-600">Payoff Timeline</h2>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-300 to-green-300 dark:from-primary-700 dark:via-primary-600 dark:to-green-700 rounded-full" />

              {/* Timeline markers */}
              <div className="relative flex justify-between">
                {payoffMilestones.map((milestone, index) => (
                  <div
                    key={milestone.debtId}
                    className="flex flex-col items-center group"
                    style={{ flex: 1 }}
                  >
                    {/* Dot */}
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold z-10 shadow-lg shadow-primary-300/40 group-hover:scale-110 transition-transform ring-2 ring-white"
                    >
                      {index + 1}
                    </div>
                    {/* Debt name */}
                    <span className="mt-2 text-xs font-semibold text-gray-700 text-center max-w-[80px] truncate group-hover:text-primary-600 transition-colors">
                      {milestone.debtName}
                    </span>
                    {/* Date */}
                    <span className="text-[10px] text-gray-400">
                      {format(new Date(milestone.payoffDate), 'MMM yyyy')}
                    </span>
                  </div>
                ))}

                {/* Debt Free marker */}
                <div className="flex flex-col items-center group" style={{ flex: 1 }}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center z-10 shadow-lg shadow-green-300/40 group-hover:scale-110 transition-transform ring-2 ring-white">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="mt-2 text-xs font-bold text-green-600 text-center flex items-center gap-1">
                    <Sparkles size={10} className="animate-kawaii-pulse" />
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

              </div>
            </div>
          </div>
        )}

        {/* Debts List Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">💳</span>
            Debts
            <span className="text-sm font-normal text-gray-500">({debts.length})</span>
          </h2>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search debts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-9 py-2.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 text-sm font-medium cursor-pointer transition-all"
            >
              <option value="balance">Balance</option>
              <option value="apr">APR</option>
              <option value="minimum">Minimum</option>
              <option value="dueDay">Due Date</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
          <button
            onClick={() => setSortAscending(!sortAscending)}
            className={`p-2.5 border-2 rounded-2xl transition-all ${
              sortAscending
                ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm'
                : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
            title={sortAscending ? 'Ascending (Low to High)' : 'Descending (High to Low)'}
          >
            <ArrowUpDown size={18} />
          </button>
        </div>

        {/* Debt Cards */}
        {filteredDebts.length === 0 ? (
          debts.length === 0 ? (
            <EmptyState
              icon="💳"
              title="No Debts Yet"
              description="Add your debts to start tracking your payoff journey."
              action={{
                label: 'Add Your First Debt',
                onClick: () => setIsModalOpen(true),
              }}
              encouragement="You've got this!"
            />
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Search size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No debts match your search</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )
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
                  className="card bg-white rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  {/* Category color bar at top */}
                  <div
                    className="h-1.5 -mx-4 -mt-4 mb-4"
                    style={{ backgroundColor: categoryInfo.color }}
                  />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                        style={{ backgroundColor: `${categoryInfo.color}20` }}
                      >
                        💳
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{debt.name}</h3>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${categoryInfo.color}20`,
                            color: categoryInfo.color
                          }}
                        >
                          {categoryInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(debt)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(debt)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {percentPaid > 0 && (
                      <ProgressRing
                        percentage={percentPaid}
                        size={64}
                        strokeWidth={7}
                        color={categoryInfo.color}
                      />
                    )}

                    <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          Balance
                          {recalibratingDebtId !== debt.id && (
                            <button
                              onClick={() => startRecalibration(debt)}
                              className="text-primary-500 hover:text-primary-600 transition-colors hover:scale-110"
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
                              className="w-24 text-lg font-bold border-b-2 border-primary-500 focus:outline-none bg-transparent text-gray-900"
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
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelRecalibration}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(debt.balance)}</p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 flex items-center mb-1">Minimum</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(debt.minimumPayment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">APR</p>
                        <p className="font-bold" style={{ color: getAPRColor(debt.apr) }}>{formatPercent(debt.apr, 2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <Calendar size={10} />
                          Due
                        </p>
                        <p className="font-bold text-gray-900">
                          {debt.dueDay}{debt.dueDay === 1 ? 'st' : debt.dueDay === 2 ? 'nd' : debt.dueDay === 3 ? 'rd' : 'th'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Interest Fee */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Flame size={12} className="text-red-400" />
                        Est. monthly interest
                      </span>
                      <span className="text-sm font-bold text-red-500">
                        {formatCurrency(debt.balance * (debt.apr / 100) / 12)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  {utilization !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Credit utilization</span>
                        <span
                          className={`font-semibold ${utilization > 30 ? 'text-red-500' : 'text-green-500'}`}
                        >
                          {formatPercent(utilization, 0)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            utilization > 100
                              ? 'bg-gradient-to-r from-red-400 to-red-500'
                              : utilization > 30
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-green-400 to-emerald-500'
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

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
