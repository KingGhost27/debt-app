/**
 * Asset Modal Component - Kawaii Edition
 *
 * Modal for adding/editing assets with form validation.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, PiggyBank } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Asset, AssetType } from '../../types';
import { ASSET_TYPE_INFO } from '../../types';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
}

interface FormData {
  name: string;
  type: AssetType;
  balance: string;
  institution: string;
  interestRate: string;
}

const initialFormData: FormData = {
  name: '',
  type: 'savings',
  balance: '',
  institution: '',
  interestRate: '',
};

export function AssetModal({ isOpen, onClose, asset }: AssetModalProps) {
  const { addAsset, updateAsset } = useApp();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const isEditing = !!asset;

  // Populate form when editing
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        type: asset.type,
        balance: asset.balance.toString(),
        institution: asset.institution || '',
        interestRate: asset.interestRate?.toString() || '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [asset, isOpen]);

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
      newErrors.balance = 'Enter a valid balance';
    }

    if (formData.interestRate) {
      const rate = parseFloat(formData.interestRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.interestRate = 'Enter a valid rate (0-100)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const assetData = {
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance),
      institution: formData.institution.trim() || undefined,
      interestRate: formData.interestRate
        ? parseFloat(formData.interestRate)
        : undefined,
    };

    if (isEditing && asset) {
      updateAsset(asset.id, assetData);
    } else {
      addAsset(assetData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 pb-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <PiggyBank size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Asset' : 'Add Asset'}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Chase Savings, Fidelity 401k"
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
            >
              {Object.entries(ASSET_TYPE_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Balance *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                  errors.balance ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.balance && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.balance}</p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Institution
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g., Chase, Fidelity, Vanguard"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all"
            />
          </div>

          {/* Interest Rate (APY) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interest Rate (APY)
            </label>
            <div className="relative">
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                className={`w-full px-4 py-3 pr-10 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 transition-all ${
                  errors.interestRate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                %
              </span>
            </div>
            {errors.interestRate && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.interestRate}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {isEditing ? 'Save Changes' : 'Add Asset'}
          </button>
        </form>
      </div>
    </div>
  );
}
