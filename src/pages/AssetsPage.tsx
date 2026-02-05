/**
 * Assets Page - Kawaii Edition
 *
 * Track savings accounts, retirement accounts, and other assets.
 * Shows net worth summary, asset allocation, and balance history.
 * Features cute styling, animations, and delightful interactions.
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown, History, Sparkles, PiggyBank } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { AssetModal } from '../components/ui/AssetModal';
import { UpdateBalanceModal } from '../components/ui/UpdateBalanceModal';
import { EmptyState } from '../components/ui/EmptyState';
import {
  formatCurrency,
  calculateTotalAssets,
  calculateTotalDebt,
  calculateNetWorth,
  calculateAssetsByType,
  calculateAssetBalanceHistory,
} from '../lib/calculations';
import type { Asset} from '../types';
import { ASSET_TYPE_INFO } from '../types';
import { Wallet } from 'lucide-react';

export function AssetsPage() {
  const { assets, debts, deleteAsset } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [updatingAsset, setUpdatingAsset] = useState<Asset | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  // Calculate totals
  const totalAssets = useMemo(() => calculateTotalAssets(assets), [assets]);
  const totalDebt = useMemo(() => calculateTotalDebt(debts), [debts]);
  const netWorth = useMemo(() => calculateNetWorth(assets, debts), [assets, debts]);
  const assetsByType = useMemo(() => calculateAssetsByType(assets), [assets]);
  const balanceHistory = useMemo(() => calculateAssetBalanceHistory(assets), [assets]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    return Object.entries(assetsByType)
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        name: ASSET_TYPE_INFO[type as keyof typeof ASSET_TYPE_INFO]?.label || type,
        value,
        color: ASSET_TYPE_INFO[type as keyof typeof ASSET_TYPE_INFO]?.color || '#6b7280',
      }));
  }, [assetsByType]);

  // Prepare line chart data (last 12 entries or all if fewer)
  const lineData = useMemo(() => {
    const data = balanceHistory.slice(-12).map((entry) => ({
      date: format(parseISO(entry.date), 'MMM d'),
      balance: entry.totalBalance,
    }));
    return data;
  }, [balanceHistory]);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    if (window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) {
      deleteAsset(asset.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  // Empty state
  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Assets"
          subtitle="Track your savings & investments"
          emoji="💎"
        />
        <div className="px-4">
          <EmptyState
            icon="💰"
            title="No Assets Yet"
            description="Add your savings accounts, retirement funds, and other assets to track your net worth."
            action={{
              label: 'Add Your First Asset',
              onClick: () => setIsModalOpen(true),
            }}
            encouragement="Start building wealth!"
          />
        </div>
        <AssetModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          asset={editingAsset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Assets"
        subtitle="Track your savings & investments"
        emoji="💎"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            Add Asset
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Net Worth Card */}
        <div className="card bg-gradient-to-br from-primary-50 to-white rounded-3xl border border-primary-100 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <Sparkles size={14} className="absolute top-4 right-6 text-primary-300 animate-kawaii-pulse" />

          <div className="relative z-10 text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PiggyBank size={18} className="text-primary-500" />
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Net Worth</p>
            </div>
            <p
              className={`text-4xl font-bold ${
                netWorth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(netWorth)}
            </p>
          </div>

          {/* Assets vs Debts bar */}
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
            {totalAssets + totalDebt > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(totalAssets / (totalAssets + totalDebt)) * 100}%`,
                  }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                  style={{
                    width: `${(totalDebt / (totalAssets + totalDebt)) * 100}%`,
                  }}
                />
              </>
            )}
          </div>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-gray-600">Assets:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(totalAssets)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl">
              <TrendingDown size={16} className="text-red-400" />
              <span className="text-gray-600">Debts:</span>
              <span className="font-bold text-red-500">
                {formatCurrency(totalDebt)}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Asset Allocation Pie */}
          {pieData.length > 0 && (
            <div className="card bg-white rounded-3xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <Sparkles size={12} className="text-primary-400" />
                Allocation
              </h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-3 space-y-1.5">
                {pieData.slice(0, 3).map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-600 truncate">{entry.name}</span>
                  </div>
                ))}
                {pieData.length > 3 && (
                  <p className="text-xs text-gray-400">+{pieData.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {/* Balance Trend */}
          {lineData.length > 1 && (
            <div className="card bg-white rounded-3xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <TrendingUp size={12} className="text-green-500" />
                Trend
              </h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label) => String(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {lineData.length} updates tracked
              </p>
            </div>
          )}
        </div>

        {/* Asset Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Wallet size={14} />
            Your Accounts
          </h3>
          {assets.map((asset) => {
            const typeInfo = ASSET_TYPE_INFO[asset.type];

            return (
              <div key={asset.id} className="card bg-white rounded-3xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
                {/* Type color bar */}
                <div
                  className="h-1.5 -mx-4 -mt-4 mb-4"
                  style={{ backgroundColor: typeInfo.color }}
                />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${typeInfo.color}20` }}
                    >
                      <Wallet size={22} style={{ color: typeInfo.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{asset.name}</p>
                      <p className="text-sm text-gray-500">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${typeInfo.color}20`,
                            color: typeInfo.color
                          }}
                        >
                          {typeInfo.label}
                        </span>
                        {asset.institution && <span className="ml-2">{asset.institution}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(asset.balance)}
                    </p>
                    {asset.interestRate && (
                      <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
                        <TrendingUp size={14} />
                        {asset.interestRate}% APY
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setUpdatingAsset(asset)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all"
                  >
                    <RefreshCw size={14} />
                    Update
                  </button>
                </div>

                {/* Last updated */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Updated {format(parseISO(asset.updatedAt), 'MMM d, yyyy')}
                  </p>
                  <button
                    onClick={() =>
                      setShowHistory(showHistory === asset.id ? null : asset.id)
                    }
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                  >
                    <History size={12} />
                    History
                  </button>
                </div>

                {/* History dropdown */}
                {showHistory === asset.id && (
                  <div className="mt-3 bg-gray-50 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                    {asset.balanceHistory
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex justify-between text-sm"
                        >
                          <div>
                            <span className="text-gray-500">
                              {format(parseISO(entry.date), 'MMM d, yyyy')}
                            </span>
                            {entry.note && (
                              <span className="text-gray-400 ml-2">
                                - {entry.note}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(entry.balance)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        asset={editingAsset}
      />
      <UpdateBalanceModal
        isOpen={!!updatingAsset}
        onClose={() => setUpdatingAsset(null)}
        asset={updatingAsset}
      />
    </div>
  );
}
