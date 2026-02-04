/**
 * Subscription Modal Component - Kawaii Edition
 *
 * Modal for adding/editing subscriptions with custom billing frequencies.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Subscription, SubscriptionCategory, SubscriptionFrequencyUnit } from '../../types';
import { SUBSCRIPTION_CATEGORY_INFO } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
}

interface FormData {
  name: string;
  amount: string;
  frequencyValue: string;
  frequencyUnit: SubscriptionFrequencyUnit;
  nextBillingDate: string;
  category: SubscriptionCategory;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  amount: '',
  frequencyValue: '1',
  frequencyUnit: 'months',
  nextBillingDate: '',
  category: 'entertainment',
  isActive: true,
};

export function SubscriptionModal({ isOpen, onClose, subscription }: SubscriptionModalProps) {
  const { addSubscription, updateSubscription } = useApp();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isEditing = !!subscription;

  // Populate form when editing
  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        frequencyValue: subscription.frequency.value.toString(),
        frequencyUnit: subscription.frequency.unit,
        nextBillingDate: subscription.nextBillingDate.split('T')[0],
        category: subscription.category,
        isActive: subscription.isActive,
      });
    } else {
      // Default to today for new subscriptions
      const today = new Date().toISOString().split('T')[0];
      setFormData({ ...initialFormData, nextBillingDate: today });
    }
    setErrors({});
  }, [subscription, isOpen]);

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

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }

    const freqValue = parseInt(formData.frequencyValue);
    if (isNaN(freqValue) || freqValue <= 0) {
      newErrors.frequencyValue = 'Enter a valid frequency';
    }

    if (!formData.nextBillingDate) {
      newErrors.nextBillingDate = 'Next billing date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const subscriptionData = {
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      frequency: {
        value: parseInt(formData.frequencyValue),
        unit: formData.frequencyUnit,
      },
      nextBillingDate: formData.nextBillingDate,
      category: formData.category,
      isActive: formData.isActive,
    };

    if (isEditing && subscription) {
      updateSubscription(subscription.id, subscriptionData);
    } else {
      addSubscription(subscriptionData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto mb-16 sm:mb-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <RefreshCw size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Subscription' : 'Add Subscription'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Subscription Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Netflix, Spotify, Adobe"
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Amount *
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
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                  errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Billing Frequency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Billing Frequency *
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Every</label>
                <input
                  type="number"
                  name="frequencyValue"
                  value={formData.frequencyValue}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                    errors.frequencyValue ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Period</label>
                <select
                  name="frequencyUnit"
                  value={formData.frequencyUnit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                >
                  <option value="days">Day(s)</option>
                  <option value="weeks">Week(s)</option>
                  <option value="months">Month(s)</option>
                  <option value="years">Year(s)</option>
                </select>
              </div>
            </div>
            {errors.frequencyValue && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.frequencyValue}</p>
            )}
          </div>

          {/* Next Billing Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Next Billing Date *
            </label>
            <input
              type="date"
              name="nextBillingDate"
              value={formData.nextBillingDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                errors.nextBillingDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
            {errors.nextBillingDate && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.nextBillingDate}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            >
              {Object.entries(SUBSCRIPTION_CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 text-primary-500 rounded-lg focus:ring-primary-500 border-2 border-gray-300"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active subscription</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Uncheck if paused or cancelled</p>
            </div>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {isEditing ? 'Save Changes' : 'Add Subscription'}
          </button>
        </form>
      </div>
    </div>
  );
}
