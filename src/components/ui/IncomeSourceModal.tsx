/**
 * Income Source Modal Component - Kawaii Edition
 *
 * Modal for adding/editing income sources with support for
 * salary-based or hourly income calculations, including paycheck deductions.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Sparkles, Briefcase } from 'lucide-react';
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
  nextPayDate: string;
  payCycleEndDate: string;
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
  nextPayDate: '',
  payCycleEndDate: '',
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
      // Convert ISO date to yyyy-MM-dd format for date input
      const nextPayDateValue = source.nextPayDate
        ? source.nextPayDate.split('T')[0]
        : '';
      const payCycleEndDateValue = source.payCycleEndDate
        ? source.payCycleEndDate.split('T')[0]
        : '';
      setFormData({
        name: source.name,
        type: source.type,
        payFrequency: source.payFrequency,
        amount: source.amount?.toString() || '',
        hourlyRate: source.hourlyRate?.toString() || '',
        hoursPerWeek: source.hoursPerWeek?.toString() || '40',
        isPartTime: source.isPartTime || false,
        nextPayDate: nextPayDateValue,
        payCycleEndDate: payCycleEndDateValue,
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
      nextPayDate: formData.nextPayDate || undefined,
      payCycleEndDate: formData.payCycleEndDate || undefined,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-xl animate-slide-up max-h-[75vh] sm:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Income Source' : 'Add Income Source'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(75vh-72px)] sm:max-h-[calc(85vh-72px)]">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Primary Job, Side Gig"
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* Income Type Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Income Type *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'salary' }))}
                className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-semibold transition-all ${
                  formData.type === 'salary'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                }`}
              >
                Salary / Fixed
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'hourly' }))}
                className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-semibold transition-all ${
                  formData.type === 'hourly'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pay Frequency *
                </label>
                <select
                  name="payFrequency"
                  value={formData.payFrequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
                >
                  {Object.entries(PAY_FREQUENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className={`w-full pl-8 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                      errors.amount ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-xs mt-1 font-medium">{errors.amount}</p>}
              </div>
            </>
          )}

          {/* Hourly-based fields */}
          {formData.type === 'hourly' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                        errors.hourlyRate ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.hourlyRate && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.hourlyRate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                      errors.hoursPerWeek ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.hoursPerWeek && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.hoursPerWeek}</p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  name="isPartTime"
                  checked={formData.isPartTime}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-500 rounded-lg focus:ring-primary-500 border-2 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">This is a part-time position</span>
              </label>
            </>
          )}

          {/* Next Payday */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Next Payday
            </label>
            <input
              type="date"
              name="nextPayDate"
              value={formData.nextPayDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Used to show paydays on your calendar
            </p>
          </div>

          {/* Pay Cycle End */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pay Cycle Ends
            </label>
            <input
              type="date"
              name="payCycleEndDate"
              value={formData.payCycleEndDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              When does your current pay period end?
            </p>
          </div>

          {/* Deductions Section */}
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDeductions(!showDeductions)}
              className="w-full flex justify-between items-center p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
            >
              <div className="text-left">
                <span className="font-semibold text-gray-900">Paycheck Deductions</span>
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
              <div className="p-4 space-y-4 border-t-2 border-gray-200 bg-white">
                {/* Federal Tax */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-semibold text-gray-700">Federal Tax</label>
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
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                {/* State Tax */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-semibold text-gray-700">State Tax</label>
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
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                {/* FICA - Medicare & Social Security */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="text-sm font-semibold text-gray-700">Medicare</label>
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
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="text-sm font-semibold text-gray-700">Social Security</label>
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
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 401k */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-semibold text-gray-700">401(k) / Retirement</label>
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
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      %
                    </span>
                  </div>
                </div>

                {/* Other */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="text-sm font-semibold text-gray-700">Other Deductions</label>
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
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
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
            <div className="p-4 bg-gradient-to-br from-primary-50 to-white rounded-2xl space-y-2 border-2 border-primary-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Gross monthly</span>
                <span className="text-gray-900 font-medium">{formatCurrency(grossMonthly)}</span>
              </div>
              {netMonthly < grossMonthly && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Deductions</span>
                  <span className="text-red-500 font-medium">-{formatCurrency(grossMonthly - netMonthly)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                <span className="font-semibold text-gray-900">Take-home pay</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(netMonthly)}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              {isEditing ? 'Save Changes' : 'Add Income Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
