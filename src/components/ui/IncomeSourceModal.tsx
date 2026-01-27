/**
 * Income Source Modal Component
 *
 * Modal for adding/editing income sources with support for
 * salary-based or hourly income calculations.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateMonthlyIncome, formatCurrency } from '../../lib/calculations';
import type { IncomeSource, PayFrequency, EmploymentType } from '../../types';

interface IncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: IncomeSource | null;
}

interface FormData {
  name: string;
  type: EmploymentType;
  payFrequency: PayFrequency;
  amount: string;
  hourlyRate: string;
  hoursPerWeek: string;
  isPartTime: boolean;
}

const initialFormData: FormData = {
  name: '',
  type: 'salary',
  payFrequency: 'bi-weekly',
  amount: '',
  hourlyRate: '',
  hoursPerWeek: '40',
  isPartTime: false,
};

const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly (every 2 weeks)',
  'semi-monthly': 'Semi-monthly (twice a month)',
  monthly: 'Monthly',
};

export function IncomeSourceModal({ isOpen, onClose, source }: IncomeSourceModalProps) {
  const { addIncomeSource, updateIncomeSource } = useApp();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isEditing = !!source;

  // Populate form when editing
  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        payFrequency: source.payFrequency,
        amount: source.amount?.toString() || '',
        hourlyRate: source.hourlyRate?.toString() || '',
        hoursPerWeek: source.hoursPerWeek?.toString() || '40',
        isPartTime: source.isPartTime || false,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [source, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.type === 'salary') {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Valid amount is required';
      }
    } else {
      const hourlyRate = parseFloat(formData.hourlyRate);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        newErrors.hourlyRate = 'Valid hourly rate is required';
      }

      const hoursPerWeek = parseFloat(formData.hoursPerWeek);
      if (isNaN(hoursPerWeek) || hoursPerWeek <= 0 || hoursPerWeek > 168) {
        newErrors.hoursPerWeek = 'Hours must be between 1 and 168';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const sourceData = {
      name: formData.name.trim(),
      type: formData.type,
      payFrequency: formData.payFrequency,
      amount: formData.type === 'salary' ? parseFloat(formData.amount) : undefined,
      hourlyRate: formData.type === 'hourly' ? parseFloat(formData.hourlyRate) : undefined,
      hoursPerWeek: formData.type === 'hourly' ? parseFloat(formData.hoursPerWeek) : undefined,
      isPartTime: formData.type === 'hourly' ? formData.isPartTime : undefined,
    };

    if (isEditing && source) {
      updateIncomeSource(source.id, sourceData);
    } else {
      addIncomeSource(sourceData);
    }

    onClose();
  };

  // Calculate estimated monthly income for preview
  const estimatedMonthly = (() => {
    const tempSource: IncomeSource = {
      id: '',
      name: '',
      type: formData.type,
      payFrequency: formData.payFrequency,
      amount: parseFloat(formData.amount) || 0,
      hourlyRate: parseFloat(formData.hourlyRate) || 0,
      hoursPerWeek: parseFloat(formData.hoursPerWeek) || 0,
      createdAt: '',
      updatedAt: '',
    };
    return calculateMonthlyIncome(tempSource);
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Income Source' : 'Add Income Source'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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
              placeholder="e.g., Primary Job, Side Gig"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Income Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Type *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'salary' }))}
                className={`flex-1 py-2 px-4 rounded-xl border-2 font-medium transition-colors ${
                  formData.type === 'salary'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                💰 Salary / Fixed
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'hourly' }))}
                className={`flex-1 py-2 px-4 rounded-xl border-2 font-medium transition-colors ${
                  formData.type === 'hourly'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                ⏰ Hourly
              </button>
            </div>
          </div>

          {/* Salary-based fields */}
          {formData.type === 'salary' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pay Frequency *
                </label>
                <select
                  name="payFrequency"
                  value={formData.payFrequency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {Object.entries(PAY_FREQUENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount per Paycheck *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
              </div>
            </>
          )}

          {/* Hourly-based fields */}
          {formData.type === 'hourly' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-8 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.hourlyRate ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours per Week *
                  </label>
                  <input
                    type="number"
                    name="hoursPerWeek"
                    value={formData.hoursPerWeek}
                    onChange={handleChange}
                    placeholder="40"
                    min="1"
                    max="168"
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.hoursPerWeek ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.hoursPerWeek && <p className="text-red-500 text-sm mt-1">{errors.hoursPerWeek}</p>}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPartTime"
                  checked={formData.isPartTime}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">This is a part-time position</span>
              </label>
            </>
          )}

          {/* Monthly estimate preview */}
          {estimatedMonthly > 0 && (
            <div className="p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-gray-600">Estimated monthly income</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(estimatedMonthly)}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Add Income Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
