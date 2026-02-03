/**
 * Asset Modal Component
 *
 * Modal for adding/editing assets with form validation.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Asset' : 'Add Asset'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Chase Savings, Fidelity 401k"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Balance *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
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
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.balance ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.balance && (
              <p className="mt-1 text-sm text-red-500">{errors.balance}</p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g., Chase, Fidelity, Vanguard"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Interest Rate (APY) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.interestRate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
            {errors.interestRate && (
              <p className="mt-1 text-sm text-red-500">{errors.interestRate}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Add Asset'}
          </button>
        </form>
      </div>
    </div>
  );
}
