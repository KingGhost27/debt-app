/**
 * Paycheck Modal Component
 *
 * Modal for logging actual paycheck amounts received.
 * Allows tracking expected vs actual income per pay period.
 */

import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { useApp } from '../../context/AppContext';
import {
  calculateExpectedPaycheck,
  formatCurrency,
} from '../../lib/calculations';
import type { ReceivedPaycheck, IncomeSource } from '../../types';

interface PaycheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  paycheck?: ReceivedPaycheck | null;
  preselectedSourceId?: string;
  preselectedDate?: string;
}

interface FormData {
  incomeSourceId: string;
  payDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  actualAmount: string;
  note: string;
}

const initialFormData: FormData = {
  incomeSourceId: '',
  payDate: format(new Date(), 'yyyy-MM-dd'),
  payPeriodStart: '',
  payPeriodEnd: '',
  actualAmount: '',
  note: '',
};

/**
 * Calculate default pay period based on pay frequency and pay date
 */
function getDefaultPayPeriod(
  source: IncomeSource,
  payDate: Date
): { start: Date; end: Date } {
  const freq = source.payFrequency;

  switch (freq) {
    case 'weekly':
      // 7-day period ending on payday
      return {
        start: addDays(payDate, -6),
        end: payDate,
      };
    case 'bi-weekly':
      // 14-day period ending on payday
      return {
        start: addDays(payDate, -13),
        end: payDate,
      };
    case 'semi-monthly':
      // Roughly 15-day periods (1st-15th or 16th-end)
      const day = payDate.getDate();
      if (day <= 15) {
        return {
          start: new Date(payDate.getFullYear(), payDate.getMonth(), 1),
          end: new Date(payDate.getFullYear(), payDate.getMonth(), 15),
        };
      } else {
        const lastDay = new Date(payDate.getFullYear(), payDate.getMonth() + 1, 0).getDate();
        return {
          start: new Date(payDate.getFullYear(), payDate.getMonth(), 16),
          end: new Date(payDate.getFullYear(), payDate.getMonth(), lastDay),
        };
      }
    case 'monthly':
      // Full month
      return {
        start: new Date(payDate.getFullYear(), payDate.getMonth(), 1),
        end: new Date(payDate.getFullYear(), payDate.getMonth() + 1, 0),
      };
    default:
      return {
        start: addDays(payDate, -13),
        end: payDate,
      };
  }
}

export function PaycheckModal({
  isOpen,
  onClose,
  paycheck,
  preselectedSourceId,
  preselectedDate,
}: PaycheckModalProps) {
  const { budget, addPaycheck, updatePaycheck } = useApp();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isEditing = !!paycheck;
  const incomeSources = budget.incomeSources;

  // Get selected income source
  const selectedSource = useMemo(() => {
    return incomeSources.find((s) => s.id === formData.incomeSourceId);
  }, [incomeSources, formData.incomeSourceId]);

  // Calculate expected amount for selected source
  const expectedAmount = useMemo(() => {
    if (!selectedSource) return 0;
    return calculateExpectedPaycheck(selectedSource);
  }, [selectedSource]);

  // Calculate variance
  const variance = useMemo(() => {
    const actual = parseFloat(formData.actualAmount) || 0;
    return actual - expectedAmount;
  }, [formData.actualAmount, expectedAmount]);

  // Populate form when editing or with preselected values
  useEffect(() => {
    if (paycheck) {
      setFormData({
        incomeSourceId: paycheck.incomeSourceId,
        payDate: paycheck.payDate.split('T')[0],
        payPeriodStart: paycheck.payPeriodStart.split('T')[0],
        payPeriodEnd: paycheck.payPeriodEnd.split('T')[0],
        actualAmount: paycheck.actualAmount.toString(),
        note: paycheck.note || '',
      });
    } else {
      const sourceId = preselectedSourceId || incomeSources[0]?.id || '';
      const payDate = preselectedDate || format(new Date(), 'yyyy-MM-dd');

      setFormData({
        ...initialFormData,
        incomeSourceId: sourceId,
        payDate,
      });
    }
  }, [paycheck, preselectedSourceId, preselectedDate, incomeSources, isOpen]);

  // Update pay period when source or date changes
  useEffect(() => {
    if (selectedSource && formData.payDate && !isEditing) {
      const payDate = parseISO(formData.payDate);
      const { start, end } = getDefaultPayPeriod(selectedSource, payDate);
      setFormData((prev) => ({
        ...prev,
        payPeriodStart: format(start, 'yyyy-MM-dd'),
        payPeriodEnd: format(end, 'yyyy-MM-dd'),
      }));
    }
  }, [selectedSource, formData.payDate, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.incomeSourceId) {
      newErrors.incomeSourceId = 'Please select an income source';
    }
    if (!formData.payDate) {
      newErrors.payDate = 'Pay date is required';
    }
    if (!formData.payPeriodStart) {
      newErrors.payPeriodStart = 'Pay period start is required';
    }
    if (!formData.payPeriodEnd) {
      newErrors.payPeriodEnd = 'Pay period end is required';
    }
    if (!formData.actualAmount || parseFloat(formData.actualAmount) <= 0) {
      newErrors.actualAmount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Store dates with noon time to avoid timezone day-shift issues
    const paycheckData = {
      incomeSourceId: formData.incomeSourceId,
      payDate: formData.payDate,
      payPeriodStart: formData.payPeriodStart,
      payPeriodEnd: formData.payPeriodEnd,
      expectedAmount,
      actualAmount: parseFloat(formData.actualAmount),
      note: formData.note.trim() || undefined,
    };

    if (isEditing && paycheck) {
      updatePaycheck(paycheck.id, paycheckData);
    } else {
      addPaycheck(paycheckData);
    }

    onClose();
  };

  const handleUseExpected = () => {
    setFormData((prev) => ({
      ...prev,
      actualAmount: expectedAmount.toFixed(2),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 pb-24 overflow-y-auto">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/30 px-6 py-4 border-b border-primary-200 dark:border-primary-700/50 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-900/30 flex items-center justify-center shadow-sm">
                <DollarSign className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-900">
                  {isEditing ? 'Edit Paycheck' : 'Log Paycheck'}
                </h2>
                <p className="text-sm text-primary-600">
                  Record your actual take-home pay
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-primary-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* No income sources warning */}
          {incomeSources.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-amber-800 text-sm">
                You need to add an income source first in the Budget page.
              </p>
            </div>
          )}

          {/* Income Source */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Income Source
            </label>
            <select
              name="incomeSourceId"
              value={formData.incomeSourceId}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                errors.incomeSourceId
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 focus:border-primary-400'
              }`}
              disabled={incomeSources.length === 0}
            >
              <option value="">Select income source...</option>
              {incomeSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            {errors.incomeSourceId && (
              <p className="mt-1 text-sm text-red-500">{errors.incomeSourceId}</p>
            )}
          </div>

          {/* Pay Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Pay Date
            </label>
            <input
              type="date"
              name="payDate"
              value={formData.payDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                errors.payDate
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 focus:border-primary-400'
              }`}
            />
            {errors.payDate && (
              <p className="mt-1 text-sm text-red-500">{errors.payDate}</p>
            )}
          </div>

          {/* Pay Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Period Start
              </label>
              <input
                type="date"
                name="payPeriodStart"
                value={formData.payPeriodStart}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                  errors.payPeriodStart
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 focus:border-primary-400'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Period End
              </label>
              <input
                type="date"
                name="payPeriodEnd"
                value={formData.payPeriodEnd}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                  errors.payPeriodEnd
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 focus:border-primary-400'
                }`}
              />
            </div>
          </div>

          {/* Expected Amount Display */}
          {selectedSource && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(expectedAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Actual Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Actual Amount Received
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                name="actualAmount"
                value={formData.actualAmount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                  errors.actualAmount
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 focus:border-primary-400'
                }`}
              />
            </div>
            {errors.actualAmount && (
              <p className="mt-1 text-sm text-red-500">{errors.actualAmount}</p>
            )}
            {selectedSource && expectedAmount > 0 && (
              <button
                type="button"
                onClick={handleUseExpected}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Use expected amount
              </button>
            )}
          </div>

          {/* Variance Display */}
          {formData.actualAmount && expectedAmount > 0 && (
            <div
              className={`rounded-xl p-4 border ${
                variance >= 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    variance >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {variance >= 0 ? 'Over expected' : 'Under expected'}
                </span>
                <span
                  className={`font-bold ${
                    variance >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {variance >= 0 ? '+' : ''}
                  {formatCurrency(variance)}
                </span>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note (optional)
            </label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="e.g., Overtime pay, Holiday bonus"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={incomeSources.length === 0}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {isEditing ? 'Update Paycheck' : 'Log Paycheck'}
          </button>
        </form>
      </div>
    </div>
  );
}
