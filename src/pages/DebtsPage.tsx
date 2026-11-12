/**
 * Debts Page - the ranch.
 *
 * Manage all debts: add, edit, delete, update a balance from a statement.
 * The debt-free countdown leads, then collapsible insights (balance chart,
 * monthly interest, APR comparison, payoff timeline), then the searchable,
 * sortable debt list on ranch cards. The focus debt and paid-off debts carry
 * the same badges as the dashboard; a sparkline shows a debt's balance over
 * its payment history. debts.css reads only --ranch-* tokens (plus the user's
 * category colors, which are data).
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronDown, ArrowUpDown, Calendar, HelpCircle, RefreshCw, Check, X, Sparkles, TrendingDown, Flame, Lock, CreditCard, PieChart as PieChartIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { DebtModal } from '../components/ui/DebtModal';
import { Plank } from '../components/dashboard/RanchPanels';
import { AnimatedTabs } from '../components/plan/AnimatedTabs';
import { Sparkline, SparklineChart, SparklineLabel, SparklineValue } from '../components/plan/Sparkline';
import { nextDue, orderDebts } from '../lib/dashboardTrail';
import './debts.css';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { FREE_LIMITS } from '../lib/tierLimits';
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

// 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th, 21st, 22nd
const ordinalSuffix = (n: number) => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
};

export function DebtsPage() {
  const { debts, deleteDebt, updateDebt, settings, customCategories, strategy, payments } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('balance');
  const [sortAscending, setSortAscending] = useState(false);
  const [chartView, setChartView] = useState<ChartView>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showAPRTooltip, setShowAPRTooltip] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canAddDebt, isPro } = useFeatureGate();

  const handleAddDebtClick = () => {
    if (!canAddDebt) {
      setShowUpgrade(true);
      return;
    }
    setIsModalOpen(true);
  };
  const [recalibratingDebtId, setRecalibratingDebtId] = useState<string | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [insightsExpanded, setInsightsExpanded] = useState(false);
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

  // APR risk level: high (>=20), medium (>=10), low. The page styles each with a ranch token.
  const aprLevel = (apr: number): 'high' | 'mid' | 'low' => (apr >= 20 ? 'high' : apr >= 10 ? 'mid' : 'low');

  // Focus debt = the one the active strategy clears next (same rule as the dashboard)
  const focusId = useMemo(() => {
    if (debts.length === 0) return null;
    return orderDebts(debts, generatePayoffPlan(debts, strategy)).find((t) => t.status === 'focus')?.debt.id ?? null;
  }, [debts, strategy]);

  // Balance over each debt's completed payments, rebuilt backwards from today's balance
  const balanceHistory = useMemo(() => {
    const out = new Map<string, { data: number[]; labels: string[] }>();
    debts.forEach((d) => {
      const done = payments.filter((p) => p.debtId === d.id && p.isCompleted).sort((a, b) => a.date.localeCompare(b.date));
      if (done.length < 2) return;
      let bal = d.balance + done.reduce((s, p) => s + p.principal, 0);
      const data = [bal];
      const labels = ['Before first payment'];
      done.forEach((p) => {
        bal -= p.principal;
        data.push(Math.max(0, bal));
        labels.push(format(parseISO(p.date), 'MMM d, yyyy'));
      });
      out.set(d.id, { data, labels });
    });
    return out;
  }, [debts, payments]);

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

  const chartTabs = [
    { id: 'category', label: 'Category' },
    { id: 'debt', label: 'By Debt' },
  ];
  const money0 = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const;

  return (
    <div className="db animate-page-enter">
      <PageHeader
        title="Debts"
        subtitle="Manage all your debts in one place"
        action={
          <button
            type="button"
            onClick={handleAddDebtClick}
            className="db-add"
            aria-label="Add Debt"
            title={
              !canAddDebt
                ? `Free plan is limited to ${FREE_LIMITS.DEBTS} debts — upgrade for unlimited`
                : 'Add a new debt'
            }
          >
            <Plus size={20} aria-hidden="true" />
            <span className="db-add-t">Add Debt</span>
            {!isPro && !canAddDebt && (
              <span className="db-lock"><Lock size={11} strokeWidth={3} aria-hidden="true" /></span>
            )}
          </button>
        }
      />

      <div className="db-body">
        {/* Debt-Free Countdown */}
        {debtFreeDate && (
          <section className="rui-card db-hero" aria-label="Debt-free countdown">
            <div className="db-hero-main">
              <span className="db-chip"><Calendar size={20} aria-hidden="true" /></span>
              <div>
                <p className="db-hero-t">{format(debtFreeDate, 'MMMM yyyy')}</p>
                {timeUntilDebtFree && (
                  <p className="db-hero-s"><Sparkles size={14} aria-hidden="true" />{timeUntilDebtFree} to go!</p>
                )}
              </div>
            </div>
            <div className="db-hero-r">
              <span className="num">{formatCurrency(totalBalance)}</span>
              <span>left across {debts.length} debt{debts.length !== 1 ? 's' : ''}</span>
            </div>
          </section>
        )}

        {/* Insights Section - Collapsible */}
        {debts.length > 0 && (
          <section className="rui-card db-ins">
            <button type="button" className="db-ins-btn" aria-expanded={insightsExpanded} aria-controls="db-insights" onClick={() => setInsightsExpanded(!insightsExpanded)}>
              <Plank icon={<Sparkles size={18} aria-hidden="true" />}>Insights</Plank>
              <span className="db-note">({debts.length} debts)</span>
              <ChevronDown size={20} className={`db-chev${insightsExpanded ? ' is-open' : ''}`} aria-hidden="true" />
            </button>

            <div id="db-insights" className={`db-collapse${insightsExpanded ? ' is-open' : ''}`}>
              <div className="db-collapse-in">
                <div className="db-ins-grid">
                  {/* Balance Chart */}
                  <div className="db-mod">
                    <div className="db-mod-h">
                      <h2 className="db-h2"><PieChartIcon size={17} aria-hidden="true" />Balance by {chartView === 'category' ? 'category' : 'debt'}</h2>
                      <AnimatedTabs variant="underline" tabs={chartTabs} activeTab={chartView} onChange={(id) => setChartView(id as ChartView)} label="Balance view" />
                    </div>
                    <div className="db-chart">
                      <div className="db-donut">
                        <svg viewBox="0 0 100 100" role="img" aria-label={`Balance by ${chartView === 'category' ? 'category' : 'debt'}, total ${formatCompactCurrency(totalBalance)}`}>
                          {(() => {
                            const radius = 40;
                            const circumference = 2 * Math.PI * radius;
                            return chartData.reduce(
                              (acc, item) => {
                                const fraction = totalBalance > 0 ? item.balance / totalBalance : 0;
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
                        <span className="num db-donut-c">{formatCompactCurrency(totalBalance)}</span>
                      </div>

                      <ul className="db-legend">
                        {chartData.map((item) => {
                          const percent = totalBalance > 0 ? (item.balance / totalBalance) * 100 : 0;
                          const key = 'id' in item ? item.id : item.category;
                          const label = 'name' in item ? item.name : item.label;
                          return (
                            <li key={key}>
                              <i className="db-dot" style={{ background: item.color }} aria-hidden="true" />
                              <div>
                                <p><span>{label}</span><b className="num">{formatCurrency(item.balance)}</b></p>
                                <span className="db-bar"><i style={{ width: `${percent}%`, background: item.color }} /></span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {/* Monthly Interest Cost */}
                  <div className="db-mod db-cost">
                    <div className="db-mod-h">
                      <h2 className="db-h2"><TrendingDown size={17} aria-hidden="true" />Monthly Interest Cost</h2>
                    </div>
                    <p className="db-cost-n num">{formatCurrency(monthlyInterestCost)}<span>/mo</span></p>
                    <p className="db-note">This is how much your debt costs you every month in interest alone.</p>
                    <dl className="db-sum">
                      <div><dt>Daily cost</dt><dd className="num">{formatCurrency(monthlyInterestCost / 30)}/day</dd></div>
                      <div><dt>Yearly cost</dt><dd className="num">{formatCurrency(monthlyInterestCost * 12)}/yr</dd></div>
                    </dl>
                  </div>
                </div>

                {/* APR Comparison Chart */}
                <div className="db-mod db-rule">
                  <div className="db-mod-h">
                    <h2 className="db-h2"><Flame size={17} aria-hidden="true" />APR Comparison</h2>
                    <div className="db-tipwrap">
                      <button
                        type="button"
                        className="db-icon-btn"
                        aria-label="What is APR?"
                        aria-expanded={showAPRTooltip}
                        onMouseEnter={() => setShowAPRTooltip(true)}
                        onMouseLeave={() => setShowAPRTooltip(false)}
                        onClick={() => setShowAPRTooltip(!showAPRTooltip)}
                      >
                        <HelpCircle size={18} aria-hidden="true" />
                      </button>
                      {showAPRTooltip && (
                        <div className="db-tip" role="tooltip">
                          <p><Sparkles size={13} aria-hidden="true" />What is APR?</p>
                          <p>
                            APR (Annual Percentage Rate) is the yearly interest rate you pay on your debt.
                            Higher APR means more money going to interest instead of paying down your balance.
                          </p>
                          <p>
                            <b className="lo">Green</b> = Low risk (&lt;10%)<br />
                            <b className="mid">Amber</b> = Medium (10-20%)<br />
                            <b className="hi">Red</b> = High (&gt;20%)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <ul className="db-apr">
                    {debtsByAPR.map((debt) => {
                      const barWidth = (debt.apr / maxAPR) * 100;
                      return (
                        <li key={debt.id}>
                          <span className="n">{debt.name}</span>
                          <span className="db-bar big"><i className={`lv-${aprLevel(debt.apr)}`} style={{ width: `${Math.max(barWidth, 4)}%` }} /></span>
                          <b className={`num v lv-${aprLevel(debt.apr)}`}>{debt.apr.toFixed(1)}%</b>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="db-key">
                    <span><i className="lv-low" />&lt;10%</span>
                    <span><i className="lv-mid" />10-20%</span>
                    <span><i className="lv-high" />&gt;20%</span>
                  </div>
                </div>

                {/* Payoff Timeline */}
                {payoffMilestones.length > 0 && (
                  <div className="db-mod db-rule">
                    <div className="db-mod-h">
                      <h2 className="db-h2"><Calendar size={17} aria-hidden="true" />Payoff Timeline</h2>
                    </div>
                    <ol className="db-tl">
                      {payoffMilestones.map((milestone, index) => (
                        <li key={milestone.debtId}>
                          <span className="pt">{index + 1}</span>
                          <span className="nm">{milestone.debtName}</span>
                          <span className="dt">{format(new Date(milestone.payoffDate), 'MMM yyyy')}</span>
                        </li>
                      ))}
                      <li className="end">
                        <span className="pt"><Check size={16} strokeWidth={3} aria-hidden="true" /></span>
                        <span className="nm">Debt Free!</span>
                        <span className="dt">
                          {payoffMilestones.length > 0 &&
                            format(new Date(payoffMilestones[payoffMilestones.length - 1].payoffDate), 'MMM yyyy')}
                        </span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Debts List Header */}
        <div className="db-list-h">
          <Plank icon={<CreditCard size={18} aria-hidden="true" />}>Debts</Plank>
          <span className="db-note">({debts.length})</span>
        </div>

        {/* Search and Sort */}
        {debts.length > 0 && (
        <div className="db-tools">
          <div className="db-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search debts..."
              aria-label="Search debts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="db-select">
            <select value={sortBy} aria-label="Sort debts by" onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="balance">Balance</option>
              <option value="apr">APR</option>
              <option value="minimum">Minimum</option>
              <option value="dueDay">Due Date</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
          <button
            type="button"
            className="db-sortdir"
            aria-pressed={sortAscending}
            aria-label={sortAscending ? 'Ascending (Low to High)' : 'Descending (High to Low)'}
            title={sortAscending ? 'Ascending (Low to High)' : 'Descending (High to Low)'}
            onClick={() => setSortAscending(!sortAscending)}
          >
            <ArrowUpDown size={18} aria-hidden="true" />
          </button>
        </div>
        )}

        {/* Debt Cards */}
        {filteredDebts.length === 0 ? (
          debts.length === 0 ? (
            <div className="rui-card db-empty">
              <span className="big"><CreditCard size={36} aria-hidden="true" /></span>
              <h2>No Debts Yet</h2>
              <p>Add your debts to start tracking your payoff journey.</p>
              <button type="button" className="db-btn" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} aria-hidden="true" />
                Add Your First Debt
              </button>
              <small>You've got this!</small>
            </div>
          ) : (
            <div className="rui-card db-empty">
              <span className="big"><Search size={34} aria-hidden="true" /></span>
              <h2>No debts match your search</h2>
              <p>Try a different search term</p>
            </div>
          )
        ) : (
          <ul className="db-cards">
            {filteredDebts.map((debt) => {
              const percentPaid =
                debt.originalBalance > 0 ? ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100 : 0;
              const utilization = debt.creditLimit ? calculateUtilization(debt.balance, debt.creditLimit) : null;
              const categoryInfo = getCategoryInfo(debt.category);
              const isPaid = debt.balance <= 0;
              const isFocus = debt.id === focusId;
              const dueIn = isPaid ? null : nextDue([debt]);
              const soon = dueIn && dueIn.days <= 7;
              const history = balanceHistory.get(debt.id);

              return (
                <li key={debt.id} className={`rui-card db-card${isFocus ? ' is-focus' : ''}${isPaid ? ' is-paid' : ''}`}>
                  <div className="db-card-h">
                    <span className="db-swatch" style={{ background: `${categoryInfo.color}26`, color: 'var(--ranch-ink)' }}>
                      <CreditCard size={22} aria-hidden="true" />
                    </span>
                    <div className="db-card-n">
                      <h3>{debt.name}</h3>
                      <div className="db-badges">
                        <span className="db-cat"><i style={{ background: categoryInfo.color }} aria-hidden="true" />{categoryInfo.label}</span>
                        {isFocus && <span className="rui-badge focus"><Sparkles size={13} aria-hidden="true" />Focus</span>}
                        {soon && <span className="rui-badge soon">Due soon</span>}
                        {isPaid && <span className="rui-badge ok"><Check size={13} aria-hidden="true" />Paid off</span>}
                      </div>
                    </div>
                    <div className="db-acts">
                      <button type="button" onClick={() => handleEdit(debt)} className="db-icon-btn" aria-label={`Edit ${debt.name}`}>
                        <Pencil size={17} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDelete(debt)} className="db-icon-btn danger" aria-label={`Delete ${debt.name}`}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="db-card-b">
                    <dl className="db-stats">
                      <div>
                        <dt>
                          Balance
                          {recalibratingDebtId !== debt.id && (
                            <button type="button" className="db-recal" onClick={() => startRecalibration(debt)} title="Update balance from statement" aria-label={`Update ${debt.name} balance from statement`}>
                              <RefreshCw size={13} aria-hidden="true" />
                            </button>
                          )}
                        </dt>
                        <dd>
                          {recalibratingDebtId === debt.id ? (
                            <span className="db-edit">
                              <span className="cur" aria-hidden="true">$</span>
                              <input
                                type="number"
                                value={newBalanceInput}
                                onChange={(e) => setNewBalanceInput(e.target.value)}
                                aria-label={`New balance for ${debt.name}`}
                                autoFocus
                                step="0.01"
                                min="0"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRecalibration(debt.id);
                                  if (e.key === 'Escape') cancelRecalibration();
                                }}
                              />
                              <button type="button" onClick={() => saveRecalibration(debt.id)} className="db-icon-btn ok" title="Save" aria-label="Save balance">
                                <Check size={16} aria-hidden="true" />
                              </button>
                              <button type="button" onClick={cancelRecalibration} className="db-icon-btn" title="Cancel" aria-label="Cancel">
                                <X size={16} aria-hidden="true" />
                              </button>
                            </span>
                          ) : (
                            <span className={`num big${isPaid ? ' paid' : ''}`}>{formatCurrency(debt.balance)}</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Minimum</dt>
                        <dd><span className="num big">{formatCurrency(debt.minimumPayment)}</span></dd>
                      </div>
                      <div>
                        <dt>APR</dt>
                        <dd><span className={`num lv-${aprLevel(debt.apr)} t`}>{formatPercent(debt.apr, 2)}</span></dd>
                      </div>
                      <div>
                        <dt><Calendar size={12} aria-hidden="true" />Due</dt>
                        <dd>
                          <span className="num">
                            {debt.dueDay}{ordinalSuffix(debt.dueDay)}
                          </span>
                        </dd>
                      </div>
                    </dl>
                    {percentPaid > 0 && (
                      <div className="db-paid">
                        <div className="db-paid-t">
                          <span>{isPaid ? 'Paid off' : 'Paid down'}</span>
                          <b className="num">{Math.round(percentPaid)}%</b>
                        </div>
                        <span className="db-bar big" role="img" aria-label={`${Math.round(percentPaid)}% paid off`}>
                          <i style={{ width: `${Math.min(100, percentPaid)}%`, background: isPaid ? 'var(--ranch-ok-fill)' : categoryInfo.color }} />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Estimated Interest Fee */}
                  <div className="db-foot">
                    <span><Flame size={14} aria-hidden="true" />Est. monthly interest</span>
                    <b className="num bad">{formatCurrency(debt.balance * (debt.apr / 100) / 12)}/mo</b>
                  </div>

                  {/* Utilization bar */}
                  {utilization !== null && (
                    <div className="db-foot col">
                      <div className="row">
                        <span>Credit utilization</span>
                        <b className={`num ${utilization > 30 ? 'bad' : 'good'}`}>{formatPercent(utilization, 0)}</b>
                      </div>
                      <span className="db-bar big" role="img" aria-label={`${Math.round(utilization)}% of the credit limit used`}>
                        <i className={utilization > 30 ? 'lv-high' : 'lv-low'} style={{ width: `${Math.min(100, utilization)}%` }} />
                      </span>
                    </div>
                  )}

                  {/* Balance over its payment history */}
                  {history && (
                    <div className="db-foot col">
                      <Sparkline data={history.data} labels={history.labels} color={categoryInfo.color} format={money0}>
                        <div className="row">
                          <span>Balance over {history.data.length - 1} payments</span>
                          <span className="db-spk-r"><SparklineLabel /><SparklineValue /></span>
                        </div>
                        <SparklineChart variant="area" baseline={Math.min(...history.data)} height={46} tooltip aria-label={`${debt.name} balance over its payments`} />
                      </Sparkline>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add/Edit Modal */}
      <DebtModal isOpen={isModalOpen} onClose={handleCloseModal} debt={editingDebt} />

      <ConfirmDialog {...dialogProps} />

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </div>
  );
}
