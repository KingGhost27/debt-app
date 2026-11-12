/**
 * Update Balance Modal Component
 *
 * Quick modal for updating an asset's balance with optional note.
 */

import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useApp } from '../../context/AppContext';
import type { Asset } from '../../types';
import { formatCurrency } from '../../lib/calculations';

interface UpdateBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export function UpdateBalanceModal({ isOpen, onClose, asset }: UpdateBalanceModalProps) {
  const { updateAssetBalance } = useApp();
  const [balance, setBalance] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (asset && isOpen) {
      setBalance(asset.balance.toString());
      setNote('');
      setError('');
    }
  }, [asset, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newBalance = parseFloat(balance);
    if (isNaN(newBalance) || newBalance < 0) {
      setError('Enter a valid balance');
      return;
    }

    if (asset) {
      updateAssetBalance(asset.id, newBalance, note.trim() || undefined);
    }

    onClose();
  };

  if (!isOpen || !asset) return null;

  const difference = parseFloat(balance) - asset.balance;
  const isIncrease = difference > 0;

  return (
    <ModalShell onClose={onClose} size="md" title="Update Balance" subtitle={asset.name} icon={<Wallet size={18} />}>
        <form onSubmit={handleSubmit} className="mdl-form">
          {/* Current Balance Display */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(asset.balance)}</p>
          </div>

          {/* New Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Balance
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={balance}
                onChange={(e) => {
                  setBalance(e.target.value);
                  setError('');
                }}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  error ? 'border-red-500' : 'border-gray-200'
                }`}
                autoFocus
              />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

            {/* Difference indicator */}
            {!isNaN(difference) && difference !== 0 && (
              <p
                className={`mt-2 text-sm font-medium ${
                  isIncrease ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isIncrease ? '+' : ''}
                {formatCurrency(difference)} {isIncrease ? 'increase' : 'decrease'}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Monthly contribution, Interest earned"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            Update Balance
          </button>
        </form>
    </ModalShell>
  );
}
