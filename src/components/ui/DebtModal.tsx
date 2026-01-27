/**
 * Debt Modal Component
 *
 * Modal for adding/editing debts with form validation.
 * Supports both built-in and custom categories.
 */

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Debt, DebtCategory } from '../../types';
import { CATEGORY_INFO } from '../../types';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: Debt | null; // If provided, we're editing
}

interface FormData {
  name: string;
  category: string; // Can be DebtCategory or custom category ID
  balance: string;
  originalBalance: string;
  apr: string;
  minimumPayment: string;
  dueDay: string;
  creditLimit: string;
}

const initialFormData: FormData = {
  name: '',
  category: 'credit_card',
  balance: '',
  originalBalance: '',
  apr: '',
  minimumPayment: '',
  dueDay: '1',
  creditLimit: '',
};

export function DebtModal({ isOpen, onClose, debt }: DebtModalProps) {
  const { addDebt, updateDebt, customCategories, addCustomCategory } = useApp();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6');

  const isEditing = !!debt;

  // Populate form when editing
  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        category: debt.category,
        balance: debt.balance.toString(),
        originalBalance: debt.originalBalance.toString(),
        apr: debt.apr.toString(),
        minimumPayment: debt.minimumPayment.toString(),
        dueDay: debt.dueDay.toString(),
        creditLimit: debt.creditLimit?.toString() || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setShowNewCategory(false);
    setNewCategoryName('');
  }, [debt, isOpen]);

  // Handle creating a new category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    addCustomCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });

    // Find the newly created category and select it
    // The category will be available after state updates
    setFormData((prev) => ({ ...prev, category: 'new_custom' }));
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
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

    const dueDay = parseInt(formData.dueDay);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      newErrors.dueDay = 'Due day must be between 1 and 31';
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

    // Get the final category - check if we need to use the most recently added custom category
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
      dueDay: parseInt(formData.dueDay),
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Debt' : 'Add New Debt'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Chase Sapphire"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
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
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {/* Built-in categories */}
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
              {/* Custom categories */}
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
              {/* Add new option */}
              <option disabled>──────────</option>
              <option value="__new__">+ Add new category...</option>
            </select>

            {/* New category form */}
            {showNewCategory && (
              <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Create new category</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
                    className="flex-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Balance & Original Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance *
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.balance ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.balance && (
                <p className="text-red-500 text-sm mt-1">{errors.balance}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* APR & Minimum Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                APR (%) *
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
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.apr ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.apr && (
                <p className="text-red-500 text-sm mt-1">{errors.apr}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payment *
              </label>
              <input
                type="number"
                name="minimumPayment"
                value={formData.minimumPayment}
                onChange={handleChange}
                placeholder="25.00"
                step="0.01"
                min="0"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.minimumPayment ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.minimumPayment && (
                <p className="text-red-500 text-sm mt-1">{errors.minimumPayment}</p>
              )}
            </div>
          </div>

          {/* Due Day & Credit Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Day *
              </label>
              <input
                type="number"
                name="dueDay"
                value={formData.dueDay}
                onChange={handleChange}
                placeholder="15"
                min="1"
                max="31"
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.dueDay ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.dueDay && (
                <p className="text-red-500 text-sm mt-1">{errors.dueDay}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.creditLimit ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.creditLimit && (
                <p className="text-red-500 text-sm mt-1">{errors.creditLimit}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Add Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
