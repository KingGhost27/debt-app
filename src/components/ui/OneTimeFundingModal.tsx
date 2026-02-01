/**
 * One-Time Funding Modal Component
 *
 * Modal for adding/editing one-time fundings like tax refunds, bonuses, etc.
 */

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Gift } from 'lucide-react';
import type { OneTimeFunding } from '../../types';

interface OneTimeFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (funding: Omit<OneTimeFunding, 'id' | 'isApplied'>) => void;
  onUpdate?: (id: string, updates: Partial<OneTimeFunding>) => void;
  funding?: OneTimeFunding | null; // If provided, we're editing
}

interface FormData {
  name: string;
  amount: string;
  date: string;
}

const PRESET_NAMES = [
  { label: 'Tax Refund', emoji: '💰' },
  { label: 'Work Bonus', emoji: '🎯' },
  { label: 'Gift', emoji: '🎁' },
  { label: 'Side Hustle', emoji: '💼' },
  { label: 'Sold Item', emoji: '📦' },
];

const initialFormData: FormData = {
  name: '',
  amount: '',
  date: '',
};

export function OneTimeFundingModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  funding,
}: OneTimeFundingModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isEditing = !!funding;

  // Populate form when editing
  useEffect(() => {
    if (funding) {
      setFormData({
        name: funding.name,
        amount: funding.amount.toString(),
        date: funding.date.split('T')[0], // Extract date part
      });
    } else {
      // Set default date to next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setFormData({
        ...initialFormData,
        date: nextMonth.toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [funding, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePresetClick = (presetName: string) => {
    setFormData((prev) => ({ ...prev, name: presetName }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const fundingData = {
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      date: formData.date,
    };

    if (isEditing && funding && onUpdate) {
      onUpdate(funding.id, fundingData);
    } else {
      onSave(fundingData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold">
              {isEditing ? 'Edit Funding' : 'Add One-Time Funding'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Preset buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick select
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_NAMES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset.label)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    formData.name === preset.label
                      ? 'bg-amber-100 border-amber-300 text-amber-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {preset.emoji} {preset.label}
                </button>
              ))}
            </div>
          </div>

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
              placeholder="e.g., Tax Refund 2026"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.amount ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Date *
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              When do you expect to receive this money?
            </p>
          </div>

          {/* Info box */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm text-amber-800">
              💡 This amount will be applied as an extra payment to your focus debt on the specified date, accelerating your payoff.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Add Funding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
