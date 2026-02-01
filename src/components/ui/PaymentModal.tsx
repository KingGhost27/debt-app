/**
 * Payment Modal Component
 *
 * Modal for logging manual payments (extra, one-time, or minimum payments).
 * Supports both creating new payments and editing existing ones.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
      };
    }
    // New payment mode
    return {
      debtId: preselectedDebt?.id || (debts.length > 0 ? debts[0].id : ''),
      amount: preselectedAmount?.toString() || '',
      date: new Date().toISOString().split('T')[0],
      type: preselectedType || 'extra',
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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditMode ? 'Edit Payment' : 'Log Payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Debt Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debt
            </label>
            <select
              name="debtId"
              value={formData.debtId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.debtId ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              {debts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.name} ({formatCurrency(debt.balance)})
                </option>
              ))}
            </select>
            {errors.debtId && (
              <p className="text-red-500 text-xs mt-1">{errors.debtId}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                className={`w-full pl-7 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}

            {/* Quick amount buttons */}
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {qa.label} ({formatCurrency(qa.value)})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.date ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <div className="flex gap-2">
              {(['minimum', 'extra', 'one_time'] as PaymentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`flex-1 py-2 px-3 text-sm rounded-xl border transition-colors ${
                    formData.type === type
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type === 'minimum' && 'Minimum'}
                  {type === 'extra' && 'Extra'}
                  {type === 'one_time' && 'One-time'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {isEditMode ? 'Update Payment' : 'Log Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
