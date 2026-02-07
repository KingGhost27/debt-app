/**
 * Payment Modal Component - Kawaii Edition
 *
 * Modal for logging manual payments (extra, one-time, or minimum payments).
 * Supports both creating new payments and editing existing ones.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import type { Debt, PaymentType, Payment } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDebt?: Debt;
  preselectedAmount?: number;
  preselectedType?: PaymentType;
  editingPayment?: Payment; // If provided, modal is in edit mode
}

interface FormData {
  debtId: string;
  amount: string;
  date: string;
  type: PaymentType;
  note: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  preselectedDebt,
  preselectedAmount,
  preselectedType,
  editingPayment,
}: PaymentModalProps) {
  const { debts, addPayment, updatePayment, updateDebt } = useApp();

  const isEditMode = !!editingPayment;

  const getInitialFormData = (): FormData => {
    if (editingPayment) {
      // Edit mode: populate from existing payment
      return {
        debtId: editingPayment.debtId,
        amount: editingPayment.amount.toString(),
        date: editingPayment.date,
        type: editingPayment.type,
        note: editingPayment.note || '',
      };
    }
    // New payment mode
    return {
      debtId: preselectedDebt?.id || (debts.length > 0 ? debts[0].id : ''),
      amount: preselectedAmount?.toString() || '',
      date: new Date().toISOString().split('T')[0],
      type: preselectedType || 'extra',
      note: '',
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Reset form when modal opens/closes or preselected values change
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
    }
  }, [isOpen, preselectedDebt, preselectedAmount, preselectedType, editingPayment]);

  if (!isOpen) return null;

  const selectedDebt = debts.find((d) => d.id === formData.debtId);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.debtId) {
      newErrors.debtId = 'Please select a debt';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedDebt) return;

    const amount = parseFloat(formData.amount);

    // Calculate principal and interest split
    // Simple approximation: monthly interest = balance * (apr/100/12)
    const monthlyInterestRate = selectedDebt.apr / 100 / 12;

    if (isEditMode && editingPayment) {
      // Edit mode: calculate the difference and adjust balance
      const oldPrincipal = editingPayment.principal;

      // For edit, we need to calculate interest based on what the balance would be
      // after restoring the old principal (to get accurate new split)
      const restoredBalance = selectedDebt.balance + oldPrincipal;
      const interestPortion = Math.min(
        restoredBalance * monthlyInterestRate,
        amount
      );
      const newPrincipal = Math.max(0, amount - interestPortion);

      // Calculate balance adjustment: restore old principal, then subtract new principal
      const balanceAdjustment = oldPrincipal - newPrincipal;

      // Update the payment record
      updatePayment(editingPayment.id, {
        amount,
        principal: newPrincipal,
        interest: Math.max(0, interestPortion),
        date: formData.date,
        type: formData.type,
        note: formData.note.trim() || undefined,
      });

      // Adjust debt balance by the difference
      updateDebt(selectedDebt.id, {
        balance: Math.max(0, selectedDebt.balance + balanceAdjustment),
      });
    } else {
      // New payment mode
      const interestPortion = Math.min(
        selectedDebt.balance * monthlyInterestRate,
        amount
      );
      const principalPortion = amount - interestPortion;

      addPayment({
        debtId: formData.debtId,
        amount,
        principal: Math.max(0, principalPortion),
        interest: Math.max(0, interestPortion),
        date: formData.date,
        type: formData.type,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        note: formData.note.trim() || undefined,
      });

      // Update debt balance (reduce by principal amount)
      updateDebt(selectedDebt.id, {
        balance: Math.max(0, selectedDebt.balance - principalPortion),
      });
    }

    onClose();
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

  // Quick amount buttons
  const quickAmounts = selectedDebt
    ? [
        { label: 'Minimum', value: selectedDebt.minimumPayment },
        { label: '2x Min', value: selectedDebt.minimumPayment * 2 },
        { label: '$50 extra', value: selectedDebt.minimumPayment + 50 },
        { label: '$100 extra', value: selectedDebt.minimumPayment + 100 },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEditMode ? 'Edit Payment' : 'Log Payment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Debt Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Debt
            </label>
            <select
              name="debtId"
              value={formData.debtId}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                errors.debtId ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              {debts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.name} ({formatCurrency(debt.balance)})
                </option>
              ))}
            </select>
            {errors.debtId && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.debtId}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                $
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                  errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.amount}</p>
            )}

            {/* Quick amount buttons */}
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: qa.value.toFixed(2),
                      }))
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300 rounded-xl transition-all"
                  >
                    {qa.label} ({formatCurrency(qa.value)})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.date}</p>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Type
            </label>
            <div className="flex gap-2">
              {(['minimum', 'extra', 'one_time'] as PaymentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl border-2 transition-all ${
                    formData.type === type
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  {type === 'minimum' && 'Minimum'}
                  {type === 'extra' && 'Extra'}
                  {type === 'one_time' && 'One-time'}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note..."
              maxLength={100}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {isEditMode ? 'Update Payment' : 'Log Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
