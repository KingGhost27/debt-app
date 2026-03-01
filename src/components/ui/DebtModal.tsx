/**
 * Debt Modal Component - Kawaii Edition
 *
 * Cute modal for adding/editing debts with delightful styling.
 * Features gradient header, rounded inputs, and playful animations.
 */

import { useState, useEffect } from 'react';
import { X, Plus, CreditCard, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Debt, DebtCategory } from '../../types';
import { CATEGORY_INFO } from '../../types';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: Debt | null;
}

interface FormData {
  name: string;
  category: string;
  balance: string;
  originalBalance: string;
  apr: string;
  minimumPayment: string;
  dueDay: string;
  creditLimit: string;
}

// Convert a day-of-month number (1-31) to a YYYY-MM-DD string for the date input
function dueDayToDateString(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const maxDay = new Date(year, month, 0).getDate();
  const clamped = Math.min(Math.max(day, 1), maxDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

function getInitialFormData(): FormData {
  return {
    name: '',
    category: 'credit_card',
    balance: '',
    originalBalance: '',
    apr: '',
    minimumPayment: '',
    dueDay: dueDayToDateString(1),
    creditLimit: '',
  };
}

export function DebtModal({ isOpen, onClose, debt }: DebtModalProps) {
  const { addDebt, updateDebt, customCategories, addCustomCategory } = useApp();
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#a855f7');

  const isEditing = !!debt;

  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        category: debt.category,
        balance: debt.balance.toString(),
        originalBalance: debt.originalBalance.toString(),
        apr: debt.apr.toString(),
        minimumPayment: debt.minimumPayment.toString(),
        dueDay: dueDayToDateString(debt.dueDay),
        creditLimit: debt.creditLimit?.toString() || '',
      });
    } else {
      setFormData(getInitialFormData());
    }
    setErrors({});
    setShowNewCategory(false);
    setNewCategoryName('');
  }, [debt, isOpen]);

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    addCustomCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });

    setFormData((prev) => ({ ...prev, category: 'new_custom' }));
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const balance = parseFloat(formData.balance);
    if (isNaN(balance) || balance < 0) {
      newErrors.balance = 'Valid balance is required';
    }

    const apr = parseFloat(formData.apr);
    if (isNaN(apr) || apr < 0 || apr > 100) {
      newErrors.apr = 'APR must be between 0 and 100';
    }

    const minimumPayment = parseFloat(formData.minimumPayment);
    if (isNaN(minimumPayment) || minimumPayment < 0) {
      newErrors.minimumPayment = 'Valid minimum payment is required';
    }

    if (!formData.dueDay) {
      newErrors.dueDay = 'Due date is required';
    }

    if (formData.creditLimit) {
      const creditLimit = parseFloat(formData.creditLimit);
      if (isNaN(creditLimit) || creditLimit < 0) {
        newErrors.creditLimit = 'Valid credit limit is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const balance = parseFloat(formData.balance);
    const originalBalance = formData.originalBalance
      ? parseFloat(formData.originalBalance)
      : balance;

    let finalCategory = formData.category;
    if (finalCategory === 'new_custom' && customCategories.length > 0) {
      finalCategory = customCategories[customCategories.length - 1].id;
    }

    const debtData = {
      name: formData.name.trim(),
      category: finalCategory as DebtCategory,
      balance,
      originalBalance: isEditing ? parseFloat(formData.originalBalance) || balance : originalBalance,
      apr: parseFloat(formData.apr),
      minimumPayment: parseFloat(formData.minimumPayment),
      dueDay: parseInt(formData.dueDay.split('-')[2] ?? '1', 10),
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
    };

    if (isEditing && debt) {
      updateDebt(debt.id, debtData);
    } else {
      addDebt(debtData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 pb-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/30 px-5 py-4 border-b border-primary-100/50 dark:border-primary-700/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/30">
                <CreditCard size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isEditing ? 'Edit Debt' : 'Add New Debt'}
                </h2>
                <p className="text-xs text-gray-500">
                  {isEditing ? 'Update your debt details' : 'Track a new debt'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Name <span className="text-primary-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Chase Sapphire"
              className={`input ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>*</span> {errors.name}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category <span className="text-primary-400">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowNewCategory(true);
                } else {
                  handleChange(e);
                  setShowNewCategory(false);
                }
              }}
              className="input"
            >
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
              {customCategories.length > 0 && (
                <>
                  <option disabled>──────────</option>
                  {customCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </>
              )}
              <option disabled>──────────</option>
              <option value="__new__">+ Add new category...</option>
            </select>

            {/* New category form */}
            {showNewCategory && (
              <div className="mt-3 p-4 bg-gradient-to-r from-primary-50 to-white rounded-2xl border border-primary-200/50 animate-slide-up">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary-400" />
                  Create new category
                </p>
                <div className="flex gap-3 mb-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 hover:border-primary-300 transition-colors"
                      style={{ padding: '2px' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategoryName('');
                    }}
                    className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-lg shadow-primary-300/30"
                  >
                    <Plus size={14} />
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Balance & Original Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Balance <span className="text-primary-400">*</span>
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`input ${errors.balance ? 'border-red-400' : ''}`}
              />
              {errors.balance && (
                <p className="text-red-500 text-xs mt-1">{errors.balance}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Original Balance
              </label>
              <input
                type="number"
                name="originalBalance"
                value={formData.originalBalance}
                onChange={handleChange}
                placeholder="Same as balance"
                step="0.01"
                min="0"
                className="input"
              />
            </div>
          </div>

          {/* APR & Minimum Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                APR (%) <span className="text-primary-400">*</span>
              </label>
              <input
                type="number"
                name="apr"
                value={formData.apr}
                onChange={handleChange}
                placeholder="15.99"
                step="0.01"
                min="0"
                max="100"
                className={`input ${errors.apr ? 'border-red-400' : ''}`}
              />
              {errors.apr && (
                <p className="text-red-500 text-xs mt-1">{errors.apr}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Min. Payment <span className="text-primary-400">*</span>
              </label>
              <input
                type="number"
                name="minimumPayment"
                value={formData.minimumPayment}
                onChange={handleChange}
                placeholder="25.00"
                step="0.01"
                min="0"
                className={`input ${errors.minimumPayment ? 'border-red-400' : ''}`}
              />
              {errors.minimumPayment && (
                <p className="text-red-500 text-xs mt-1">{errors.minimumPayment}</p>
              )}
            </div>
          </div>

          {/* Due Date & Credit Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Due Date <span className="text-primary-400">*</span>
              </label>
              <input
                type="date"
                name="dueDay"
                value={formData.dueDay}
                onChange={handleChange}
                className={`input ${errors.dueDay ? 'border-red-400' : ''}`}
              />
              {errors.dueDay && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDay}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Credit Limit
              </label>
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                placeholder="Optional"
                step="0.01"
                min="0"
                className={`input ${errors.creditLimit ? 'border-red-400' : ''}`}
              />
              {errors.creditLimit && (
                <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-300/40 hover:shadow-xl hover:shadow-primary-400/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              {isEditing ? 'Save Changes' : 'Add Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
