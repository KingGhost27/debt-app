/**
 * Expense Tracker Component
 *
 * Breaks down monthly expenses into categories.
 * Auto-sums entries and syncs with monthlyExpenses.
 * Falls back to single input when no entries exist. Ranch card, styled in
 * pages/track.css (.exp-*); category icons are lucide, colors are the data's.
 */

import { useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, DollarSign, Lock, Home, ShoppingBasket, Zap, Car, Shield, Utensils, Film, Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Plank } from '../dashboard/RanchPanels';
import { v4 as uuid } from 'uuid';
import { formatCurrency } from '../../lib/calculations';
import type { ExpenseEntry, ExpenseCategory, BudgetSettings } from '../../types';
import { EXPENSE_CATEGORY_INFO } from '../../types';
import { UpgradeModal } from './UpgradeModal';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { FREE_LIMITS } from '../../lib/tierLimits';
import '../../pages/track.css';

interface ExpenseTrackerProps {
  budget: BudgetSettings;
  onBudgetChange: (updates: Partial<BudgetSettings>) => void;
}

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_INFO) as ExpenseCategory[];

// Real icons per expense category (the data's emoji field is not rendered).
const CATEGORY_ICONS: Partial<Record<string, LucideIcon>> = {
  housing: Home, groceries: ShoppingBasket, utilities: Zap, transport: Car, insurance: Shield, dining: Utensils, entertainment: Film,
};

export function ExpenseTracker({ budget, onBudgetChange }: ExpenseTrackerProps) {
  const entries = budget.expenseEntries || [];
  const [isExpanded, setIsExpanded] = useState(entries.length > 0);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('other');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canAddExpenseEntry, isPro } = useFeatureGate();

  const handleAddClick = () => {
    if (!canAddExpenseEntry) {
      setShowUpgrade(true);
      return;
    }
    setIsAdding(true);
  };

  const totalFromEntries = entries.reduce((sum, e) => sum + e.amount, 0);

  const updateEntries = (newEntries: ExpenseEntry[]) => {
    const total = newEntries.reduce((sum, e) => sum + e.amount, 0);
    onBudgetChange({
      expenseEntries: newEntries,
      monthlyExpenses: total,
    });
  };

  const handleAddEntry = () => {
    const amount = parseFloat(newAmount);
    if (!newName.trim() || isNaN(amount) || amount <= 0) return;

    const newEntry: ExpenseEntry = {
      id: uuid(),
      name: newName.trim(),
      category: newCategory,
      amount,
    };

    updateEntries([...entries, newEntry]);
    setNewName('');
    setNewAmount('');
    setNewCategory('other');
    setIsAdding(false);
  };

  const handleDeleteEntry = (id: string) => {
    updateEntries(entries.filter((e) => e.id !== id));
  };

  const handleManualTotal = (value: string) => {
    onBudgetChange({ monthlyExpenses: parseFloat(value) || 0 });
  };

  // Group entries by category for the summary bar
  const categoryTotals = CATEGORIES.map((cat) => {
    const total = entries
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return { category: cat, total };
  }).filter((c) => c.total > 0);

  return (
    <section className="rui-card exp">
      <div className="trk-mod-h">
        <Plank>Monthly Expenses</Plank>
        <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="exp-switch" aria-expanded={isExpanded}>
          {isExpanded ? 'Simple' : 'Itemize'}
          {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      </div>

      {!isExpanded ? (
        /* Simple single input mode */
        <div>
          <p className="trk-note exp-help">Rent, utilities, groceries, etc.</p>
          <label className="exp-field">
            <DollarSign size={17} aria-hidden="true" />
            <input
              type="number"
              value={budget.monthlyExpenses || ''}
              onChange={(e) => handleManualTotal(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              aria-label="Monthly expenses"
            />
          </label>
        </div>
      ) : (
        /* Itemized expense entries */
        <div className="exp-stack">
          {/* Category breakdown bar */}
          {categoryTotals.length > 0 && (
            <div>
              <div className="exp-bar" role="img" aria-label="Expenses by category">
                {categoryTotals.map(({ category, total }) => (
                  <i
                    key={category}
                    style={{ width: `${(total / totalFromEntries) * 100}%`, backgroundColor: EXPENSE_CATEGORY_INFO[category].color }}
                    title={`${EXPENSE_CATEGORY_INFO[category].label}: ${formatCurrency(total)}`}
                  />
                ))}
              </div>
              <ul className="cht-legend">
                {categoryTotals.map(({ category, total }) => (
                  <li key={category}>
                    <i className="cht-dot" style={{ background: EXPENSE_CATEGORY_INFO[category].color }} />
                    <span>{EXPENSE_CATEGORY_INFO[category].label} <b className="num">{formatCurrency(total)}</b></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Entries list */}
          <ul className="exp-list">
            {entries.map((entry) => {
              const catInfo = EXPENSE_CATEGORY_INFO[entry.category];
              const Icon = CATEGORY_ICONS[entry.category] ?? Tag;
              return (
                <li key={entry.id}>
                  <span className="exp-ic" style={{ color: catInfo.color }}><Icon size={16} aria-hidden="true" /></span>
                  <span className="exp-n">
                    <b>{entry.name}</b>
                    <small>{catInfo.label}</small>
                  </span>
                  <b className="num">{formatCurrency(entry.amount)}</b>
                  <button type="button" onClick={() => handleDeleteEntry(entry.id)} className="trk-icon-btn is-bad" aria-label={`Delete ${entry.name}`}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Add entry form */}
          {isAdding ? (
            <div className="exp-form">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Expense name"
                maxLength={40}
                aria-label="Expense name"
              />
              <div className="exp-form-r">
                <label className="exp-field">
                  <DollarSign size={15} aria-hidden="true" />
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    aria-label="Amount"
                  />
                </label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)} aria-label="Category">
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{EXPENSE_CATEGORY_INFO[cat].label}</option>
                  ))}
                </select>
              </div>
              <div className="exp-form-r">
                <button type="button" onClick={() => setIsAdding(false)} className="trk-btn is-ghost">Cancel</button>
                <button type="button" onClick={handleAddEntry} className="trk-btn">Add</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddClick}
              className="trk-btn is-ghost exp-add"
              title={!canAddExpenseEntry ? `Free plan is limited to ${FREE_LIMITS.EXPENSE_ENTRIES} expense entries` : 'Add an expense'}
            >
              {!isPro && !canAddExpenseEntry ? <Lock size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              {!isPro && !canAddExpenseEntry ? 'Upgrade for more' : 'Add Expense'}
            </button>
          )}

          {/* Total */}
          <p className="exp-total">
            <span>Total</span>
            <b className="num">{formatCurrency(totalFromEntries)}</b>
          </p>
        </div>
      )}

      {showUpgrade && <UpgradeModal onDismiss={() => setShowUpgrade(false)} />}
    </section>
  );
}
