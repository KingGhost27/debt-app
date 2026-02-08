/**
 * Expense Tracker Component
 *
 * Breaks down monthly expenses into categories.
 * Auto-sums entries and syncs with monthlyExpenses.
 * Falls back to single input when no entries exist.
 */

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { formatCurrency } from '../../lib/calculations';
import type { ExpenseEntry, ExpenseCategory, BudgetSettings } from '../../types';
import { EXPENSE_CATEGORY_INFO } from '../../types';

interface ExpenseTrackerProps {
  budget: BudgetSettings;
  onBudgetChange: (updates: Partial<BudgetSettings>) => void;
}

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_INFO) as ExpenseCategory[];

export function ExpenseTracker({ budget, onBudgetChange }: ExpenseTrackerProps) {
  const entries = budget.expenseEntries || [];
  const [isExpanded, setIsExpanded] = useState(entries.length > 0);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('other');

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
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Monthly Expenses</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
        >
          {isExpanded ? 'Simple' : 'Itemize'}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!isExpanded ? (
        /* Simple single input mode */
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Rent, utilities, groceries, etc.
          </p>
          <div className="relative">
            <DollarSign
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="number"
              value={budget.monthlyExpenses || ''}
              onChange={(e) => handleManualTotal(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      ) : (
        /* Itemized expense entries */
        <div className="space-y-3">
          {/* Category breakdown bar */}
          {categoryTotals.length > 0 && (
            <div>
              <div className="flex rounded-xl overflow-hidden h-3 mb-2">
                {categoryTotals.map(({ category, total }) => (
                  <div
                    key={category}
                    style={{
                      width: `${(total / totalFromEntries) * 100}%`,
                      backgroundColor: EXPENSE_CATEGORY_INFO[category].color,
                    }}
                    title={`${EXPENSE_CATEGORY_INFO[category].label}: ${formatCurrency(total)}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {categoryTotals.map(({ category, total }) => (
                  <span key={category} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: EXPENSE_CATEGORY_INFO[category].color }}
                    />
                    {EXPENSE_CATEGORY_INFO[category].emoji} {formatCurrency(total)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entries list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {entries.map((entry) => {
              const catInfo = EXPENSE_CATEGORY_INFO[entry.category];
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl group"
                >
                  <span className="text-sm">{catInfo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{entry.name}</p>
                    <p className="text-xs text-gray-400">{catInfo.label}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatCurrency(entry.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add entry form */}
          {isAdding ? (
            <div className="p-3 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Expense name"
                maxLength={40}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {EXPENSE_CATEGORY_INFO[cat].emoji} {EXPENSE_CATEGORY_INFO[cat].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="flex-1 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2 text-sm font-medium text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              Add Expense
            </button>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalFromEntries)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
