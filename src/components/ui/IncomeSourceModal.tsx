/**
 * Income Source Modal Component
 *
 * Modal for adding/editing income sources with support for
 * salary-based or hourly income calculations, including paycheck deductions.
 */

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateGrossMonthlyIncome,
  calculateNetMonthlyIncome,
  formatCurrency,
} from '../../lib/calculations';
import { HelpTooltip } from './HelpTooltip';
import type { IncomeSource, PayFrequency, EmploymentType, PaycheckDeductions } from '../../types';
import { DEFAULT_DEDUCTIONS } from '../../types';

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
  deductions: {
    federalTax: string;
    stateTax: string;
    medicare: string;
    socialSecurity: string;
    retirement401k: string;
    other: string;
  };
}

const initialFormData: FormData = {
  name: '',
  type: 'salary',
  payFrequency: 'bi-weekly',
  amount: '',
  hourlyRate: '',
  hoursPerWeek: '40',
  isPartTime: false,
  deductions: {
    federalTax: '',
    stateTax: '',
    medicare: '1.45',
    socialSecurity: '6.2',
    retirement401k: '',
    other: '',
  },
};

const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly (every 2 weeks)',
  'semi-monthly': 'Semi-monthly (twice a month)',
  monthly: 'Monthly',
};

const DEDUCTION_HELP = {
  federalTax: {
    title: 'Federal Tax',
    content:
      "Check your pay stub for 'Federal Withholding' or 'Federal Tax'. This varies based on your income and W-4 filing. Most people are between 12-22%.",
  },
  stateTax: {
    title: 'State Tax',
    content:
      "Check your pay stub for 'State Tax' or 'State Withholding'. This varies by state (0-13%). Some states like Texas, Florida, and Nevada have no state income tax.",
  },
  medicare: {
    title: 'Medicare Tax',
    content:
      'Medicare tax is 1.45% for most employees (part of FICA). This is a fixed rate set by federal law. High earners may pay an additional 0.9%.',
  },
  socialSecurity: {
    title: 'Social Security Tax',
    content:
      'Social Security tax is 6.2% for employees (part of FICA). This is a fixed rate set by federal law, capped at $168,600 annual income (2024).',
  },
  retirement401k: {
    title: '401(k) / Retirement',
    content:
      'Check your benefits enrollment for your contribution percentage. Common amounts are 3-10% of gross pay. Some employers match a portion of this.',
  },
  other: {
    title: 'Other Deductions',
    content:
      'Include other pre-tax deductions like health insurance premiums, HSA contributions, FSA contributions, union dues, or life insurance.',
  },
};

export function IncomeSourceModal({ isOpen, onClose, source }: IncomeSourceModalProps) {
  const { addIncomeSource, updateIncomeSource } = useApp();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showDeductions, setShowDeductions] = useState(false);

  const isEditing = !!source;

  // Populate form when editing
  useEffect(() => {
    if (source) {
      const d = source.deductions || DEFAULT_DEDUCTIONS;
      setFormData({
        name: source.name,
        type: source.type,
        payFrequency: source.payFrequency,
        amount: source.amount?.toString() || '',
        hourlyRate: source.hourlyRate?.toString() || '',
        hoursPerWeek: source.hoursPerWeek?.toString() || '40',
        isPartTime: source.isPartTime || false,
        deductions: {
          federalTax: d.federalTax?.toString() || '',
          stateTax: d.stateTax?.toString() || '',
          medicare: d.medicare?.toString() || '1.45',
          socialSecurity: d.socialSecurity?.toString() || '6.2',
          retirement401k: d.retirement401k?.toString() || '',
          other: d.other?.toString() || '',
        },
      });
      // Show deductions section if any were previously set
      if (source.deductions && (d.federalTax > 0 || d.stateTax > 0 || d.retirement401k > 0)) {
        setShowDeductions(true);
      }
    } else {
      setFormData(initialFormData);
      setShowDeductions(false);
    }
    setErrors({});
  }, [source, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDeductionChange = (field: keyof PaycheckDeductions, value: string) => {
    setFormData((prev) => ({
      ...prev,
      deductions: { ...prev.deductions, [field]: value },
    }));
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

    const deductions: PaycheckDeductions = {
      federalTax: parseFloat(formData.deductions.federalTax) || 0,
      stateTax: parseFloat(formData.deductions.stateTax) || 0,
      medicare: parseFloat(formData.deductions.medicare) || 1.45,
      socialSecurity: parseFloat(formData.deductions.socialSecurity) || 6.2,
      retirement401k: parseFloat(formData.deductions.retirement401k) || 0,
      other: parseFloat(formData.deductions.other) || 0,
    };

    const sourceData = {
      name: formData.name.trim(),
      type: formData.type,
      payFrequency: formData.payFrequency,
      amount: formData.type === 'salary' ? parseFloat(formData.amount) : undefined,
      hourlyRate: formData.type === 'hourly' ? parseFloat(formData.hourlyRate) : undefined,
      hoursPerWeek: formData.type === 'hourly' ? parseFloat(formData.hoursPerWeek) : undefined,
      isPartTime: formData.type === 'hourly' ? formData.isPartTime : undefined,
      deductions,
    };

    if (isEditing && source) {
      updateIncomeSource(source.id, sourceData);
    } else {
      addIncomeSource(sourceData);
    }

    onClose();
  };

  // Calculate estimated monthly income for preview
  const { grossMonthly, netMonthly } = (() => {
    const tempSource: IncomeSource = {
      id: '',
      name: '',
      type: formData.type,
      payFrequency: formData.payFrequency,
      amount: parseFloat(formData.amount) || 0,
      hourlyRate: parseFloat(formData.hourlyRate) || 0,
      hoursPerWeek: parseFloat(formData.hoursPerWeek) || 0,
      deductions: {
        federalTax: parseFloat(formData.deductions.federalTax) || 0,
        stateTax: parseFloat(formData.deductions.stateTax) || 0,
        medicare: parseFloat(formData.deductions.medicare) || 1.45,
        socialSecurity: parseFloat(formData.deductions.socialSecurity) || 6.2,
        retirement401k: parseFloat(formData.deductions.retirement401k) || 0,
        other: parseFloat(formData.deductions.other) || 0,
      },
      createdAt: '',
      updatedAt: '',
    };
    return {
      grossMonthly: calculateGrossMonthlyIncome(tempSource),
      netMonthly: calculateNetMonthlyIncome(tempSource),
    };
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center p-4 border-b border-gray-100 z-10">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Income Type *</label>
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
                Salary / Fixed
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
                Hourly
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
                  Gross Amount per Paycheck *
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
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
                  {errors.hourlyRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>
                  )}
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
                  {errors.hoursPerWeek && (
                    <p className="text-red-500 text-sm mt-1">{errors.hoursPerWeek}</p>
                  )}
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

          {/* Deductions Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDeductions(!showDeductions)}
              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div>
                <span className="font-medium text-gray-900">Paycheck Deductions</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add taxes and deductions for accurate take-home pay
                </p>
              </div>
              {showDeductions ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>

            {showDeductions && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {/* Federal Tax */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">Federal Tax</label>
                    <div className="relative">
                      <HelpTooltip
                        title={DEDUCTION_HELP.federalTax.title}
                        content={DEDUCTION_HELP.federalTax.content}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.deductions.federalTax}
                      onChange={(e) => handleDeductionChange('federalTax', e.target.value)}
                      placeholder="0"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                {/* State Tax */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">State Tax</label>
                    <div className="relative">
                      <HelpTooltip
                        title={DEDUCTION_HELP.stateTax.title}
                        content={DEDUCTION_HELP.stateTax.content}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.deductions.stateTax}
                      onChange={(e) => handleDeductionChange('stateTax', e.target.value)}
                      placeholder="0"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                {/* FICA - Medicare & Social Security */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm font-medium text-gray-700">Medicare</label>
                      <div className="relative">
                        <HelpTooltip
                          title={DEDUCTION_HELP.medicare.title}
                          content={DEDUCTION_HELP.medicare.content}
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.deductions.medicare}
                        onChange={(e) => handleDeductionChange('medicare', e.target.value)}
                        placeholder="1.45"
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm font-medium text-gray-700">Social Security</label>
                      <div className="relative">
                        <HelpTooltip
                          title={DEDUCTION_HELP.socialSecurity.title}
                          content={DEDUCTION_HELP.socialSecurity.content}
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.deductions.socialSecurity}
                        onChange={(e) => handleDeductionChange('socialSecurity', e.target.value)}
                        placeholder="6.2"
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 401k */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">401(k) / Retirement</label>
                    <div className="relative">
                      <HelpTooltip
                        title={DEDUCTION_HELP.retirement401k.title}
                        content={DEDUCTION_HELP.retirement401k.content}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.deductions.retirement401k}
                      onChange={(e) => handleDeductionChange('retirement401k', e.target.value)}
                      placeholder="0"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                {/* Other */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">Other Deductions</label>
                    <div className="relative">
                      <HelpTooltip
                        title={DEDUCTION_HELP.other.title}
                        content={DEDUCTION_HELP.other.content}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.deductions.other}
                      onChange={(e) => handleDeductionChange('other', e.target.value)}
                      placeholder="0"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Monthly estimate preview */}
          {grossMonthly > 0 && (
            <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Gross monthly</span>
                <span className="text-gray-900">{formatCurrency(grossMonthly)}</span>
              </div>
              {netMonthly < grossMonthly && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Deductions</span>
                  <span className="text-red-500">-{formatCurrency(grossMonthly - netMonthly)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Take-home pay</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(netMonthly)}
                </span>
              </div>
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
