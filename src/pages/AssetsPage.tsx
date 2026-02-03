/**
 * Assets Page
 *
 * Track savings accounts, retirement accounts, and other assets.
 * Shows net worth summary, asset allocation, and balance history.
 */

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown, History } from 'lucide-react';
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
      <div className="min-h-screen">
        <PageHeader
          title="Assets"
          subtitle="Track your savings & investments"
        />
        <div className="px-4">
          <EmptyState
            icon={Wallet}
            title="No Assets Yet"
            description="Add your savings accounts, retirement funds, and other assets to track your net worth."
            action={{
              label: 'Add Your First Asset',
              onClick: () => setIsModalOpen(true),
            }}
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
    <div className="min-h-screen">
      <PageHeader
        title="Assets"
        subtitle="Track your savings & investments"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Net Worth Card */}
        <div className="card">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 font-medium">NET WORTH</p>
            <p
              className={`text-3xl font-bold ${
                netWorth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(netWorth)}
            </p>
          </div>

          {/* Assets vs Debts bar */}
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
            {totalAssets + totalDebt > 0 && (
              <>
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                  style={{
                    width: `${(totalAssets / (totalAssets + totalDebt)) * 100}%`,
                  }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-red-400 transition-all"
                  style={{
                    width: `${(totalDebt / (totalAssets + totalDebt)) * 100}%`,
                  }}
                />
              </>
            )}
          </div>

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-gray-600">Assets:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totalAssets)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" />
              <span className="text-gray-600">Debts:</span>
              <span className="font-semibold text-red-500">
                {formatCurrency(totalDebt)}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Asset Allocation Pie */}
          {pieData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Allocation</h3>
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
              <div className="mt-2 space-y-1">
                {pieData.slice(0, 3).map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
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
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Trend</h3>
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
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {lineData.length} updates tracked
              </p>
            </div>
          )}
        </div>

        {/* Asset Cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">YOUR ACCOUNTS</h3>
          {assets.map((asset) => {
            const typeInfo = ASSET_TYPE_INFO[asset.type];

            return (
              <div key={asset.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${typeInfo.color}20` }}
                    >
                      <Wallet size={20} style={{ color: typeInfo.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{asset.name}</p>
                      <p className="text-sm text-gray-500">
                        {typeInfo.label}
                        {asset.institution && ` • ${asset.institution}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                      <p className="text-sm text-green-600">
                        {asset.interestRate}% APY
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setUpdatingAsset(asset)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Update
                  </button>
                </div>

                {/* Last updated */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Updated {format(parseISO(asset.updatedAt), 'MMM d, yyyy')}
                  </p>
                  <button
                    onClick={() =>
                      setShowHistory(showHistory === asset.id ? null : asset.id)
                    }
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <History size={12} />
                    History
                  </button>
                </div>

                {/* History dropdown */}
                {showHistory === asset.id && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
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
                          <span className="font-medium">
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
