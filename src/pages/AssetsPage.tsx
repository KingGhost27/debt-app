/**
 * Assets Page - the ranch's savings barn.
 *
 * Track savings accounts, retirement accounts, and other assets.
 * Net worth leads, then allocation and balance trend (charts themed from the
 * ranch tokens), then one ranch card per account. Styled in assets.css.
 */

import { useState, useMemo, type ComponentType, type CSSProperties } from 'react';
import {
  Banknote, History, HeartPulse, Landmark, Pencil, PiggyBank, Plus, RefreshCw, Sparkles, Trash2, TrendingUp, Wallet,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Plank } from '../components/dashboard/RanchPanels';
import { AssetModal } from '../components/ui/AssetModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { UpdateBalanceModal } from '../components/ui/UpdateBalanceModal';
import { EmptyState } from '../components/ui/EmptyState';
import { ProLockedOverlay } from '../components/ui/ProLockedOverlay';
import { RollingNumber } from '../components/ui/RollingNumber';
import { chartAxisLine, chartGrid, chartTick, chartTooltip } from '../components/analytics/chartTheme';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { PRO_FEATURE_COPY } from '../lib/tierLimits';
import {
  formatCurrency,
  calculateTotalAssets,
  calculateTotalDebt,
  calculateNetWorth,
  calculateAssetsByType,
  calculateAssetBalanceHistory,
} from '../lib/calculations';
import type { Asset, AssetType } from '../types';
import { ASSET_TYPE_INFO } from '../types';
import './assets.css';

// Recharts entrance animation is skipped under prefers-reduced-motion (also keeps stills deterministic).
const CHART_ANIMATE =
  typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const TYPE_ICONS: Record<AssetType, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  savings: PiggyBank,
  checking: Landmark,
  roth_ira: TrendingUp,
  '401k': TrendingUp,
  brokerage: TrendingUp,
  hsa: HeartPulse,
  money_market: Banknote,
  cd: Banknote,
  other: Wallet,
};

export function AssetsPage() {
  const { assets, debts, deleteAsset } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [updatingAsset, setUpdatingAsset] = useState<Asset | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();
  const { isAssetTrackingLocked, isLoading: gateLoading } = useFeatureGate();

  // Calculate totals (hooks stay above the early returns below)
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
  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);

  // Prepare line chart data (last 12 entries or all if fewer)
  const lineData = useMemo(() => {
    return balanceHistory.slice(-12).map((entry) => ({
      date: format(parseISO(entry.date), 'MMM d'),
      balance: entry.totalBalance,
    }));
  }, [balanceHistory]);

  if (!gateLoading && isAssetTrackingLocked) {
    return (
      <div className="ast animate-page-enter">
        <PageHeader title="Assets" subtitle="Track your savings & investments" />
        <div className="ast-body">
          <ProLockedOverlay
            title={PRO_FEATURE_COPY.asset_tracking.title}
            description={PRO_FEATURE_COPY.asset_tracking.description}
          />
        </div>
      </div>
    );
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    confirm({
      title: 'Delete Asset',
      message: `Are you sure you want to delete "${asset.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteAsset(asset.id),
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  // Empty state
  if (assets.length === 0) {
    return (
      <div className="ast animate-page-enter">
        <PageHeader title="Assets" subtitle="Track your savings & investments" />
        <div className="ast-body">
          <EmptyState
            icon={PiggyBank}
            title="No Assets Yet"
            description="Add your savings accounts, retirement funds, and other assets to track your net worth."
            action={{
              label: 'Add Your First Asset',
              onClick: () => setIsModalOpen(true),
            }}
            encouragement="Start building wealth!"
          />
        </div>
        <AssetModal isOpen={isModalOpen} onClose={handleCloseModal} asset={editingAsset} />
      </div>
    );
  }

  const debtPaidDown = debts.reduce((sum, d) => sum + Math.max(0, d.originalBalance - d.balance), 0);

  return (
    <div className="ast animate-page-enter">
      <PageHeader
        title="Assets"
        subtitle="Track your savings & investments"
        action={
          <button type="button" onClick={() => setIsModalOpen(true)} className="ast-btn" aria-label="Add Asset">
            <Plus size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Add Asset</span>
          </button>
        }
      />

      <div className="ast-body">
        {/* Net Worth */}
        <section className="rui-card ast-net">
          <div className="ast-mod-h">
            <Plank icon={<PiggyBank size={18} aria-hidden="true" />}>Net Worth</Plank>
            {netWorth > 0 && (
              <span className="rui-badge ok"><Sparkles size={13} aria-hidden="true" />You're in the green!</span>
            )}
          </div>

          <dl className="ast-rows">
            <div>
              <dt>Assets held</dt>
              <dd className="num">{formatCurrency(totalAssets)}</dd>
            </div>
            <div>
              <dt>Debt paid down</dt>
              <dd className="num">{formatCurrency(debtPaidDown)}</dd>
            </div>
            <div>
              <dt>Still owed</dt>
              <dd className="num">{formatCurrency(totalDebt)}</dd>
            </div>
            <div className="is-net">
              <dt>Net worth</dt>
              <dd className="num"><RollingNumber value={netWorth} decimals={2} /></dd>
            </div>
          </dl>
        </section>

        {/* Charts Row */}
        {(pieData.length > 0 || lineData.length > 1) && (
          <div className="ast-charts">
            {/* Asset Allocation Pie */}
            {pieData.length > 0 && (
              <section className="rui-card ast-mod">
                <div className="ast-mod-h"><Plank icon={<Sparkles size={18} aria-hidden="true" />}>Allocation</Plank></div>
                <div className="ast-donut">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={74}
                        paddingAngle={pieData.length > 1 ? 3 : 0}
                        stroke="var(--ranch-page)"
                        strokeWidth={3}
                        isAnimationActive={CHART_ANIMATE}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip {...chartTooltip} formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <ul className="ast-legend">
                  {pieData.map((entry) => (
                    <li key={entry.name}>
                      <i style={{ background: entry.color }} />
                      <span>{entry.name}</span>
                      <b className="num">{Math.round((entry.value / pieTotal) * 100)}%</b>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Balance Trend */}
            {lineData.length > 1 && (
              <section className="rui-card ast-mod">
                <div className="ast-mod-h"><Plank icon={<TrendingUp size={18} aria-hidden="true" />}>Trend</Plank></div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={lineData} margin={{ top: 6, right: 12, left: 12, bottom: 0 }}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis dataKey="date" tick={chartTick} tickLine={false} axisLine={chartAxisLine} interval={Math.max(0, lineData.length - 2)} padding={{ left: 22, right: 22 }} />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip
                      {...chartTooltip}
                      formatter={(value) => [formatCurrency(value as number), 'Balance']}
                      labelFormatter={(label) => String(label)}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="var(--ranch-ok-fill)"
                      strokeWidth={3}
                      isAnimationActive={CHART_ANIMATE}
                      fill="var(--ranch-ok-fill)"
                      fillOpacity={0.16}
                      dot={false}
                      activeDot={{ r: 5, fill: 'var(--ranch-ok-fill)', stroke: 'var(--ranch-page)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="ast-note">{lineData.length} updates tracked</p>
              </section>
            )}
          </div>
        )}

        {/* Asset Cards */}
        <section className="ast-sec">
          <div className="ast-mod-h"><Plank icon={<Wallet size={18} aria-hidden="true" />}>Your Accounts</Plank></div>
          <div className="ast-accts">
            {assets.map((asset) => {
              const typeInfo = ASSET_TYPE_INFO[asset.type];
              const Icon = TYPE_ICONS[asset.type] ?? Wallet;

              return (
                <article key={asset.id} className="rui-card ast-acct" style={{ '--ast-c': typeInfo.color } as CSSProperties}>
                  <div className="ast-acct-top">
                    <span className="ast-ic"><Icon size={22} aria-hidden={true} /></span>
                    <div className="ast-acct-n">
                      <h3>{asset.name}</h3>
                      <p>
                        <span className="ast-type"><i />{typeInfo.label}</span>
                        {asset.institution && <span>{asset.institution}</span>}
                      </p>
                    </div>
                    <div className="ast-acts">
                      <button type="button" onClick={() => handleEdit(asset)} className="ast-icon-btn" title="Edit" aria-label={`Edit ${asset.name}`}>
                        <Pencil size={17} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDelete(asset)} className="ast-icon-btn is-bad" title="Delete" aria-label={`Delete ${asset.name}`}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="ast-acct-mid">
                    <div>
                      <p className="ast-bal num">{formatCurrency(asset.balance)}</p>
                      {asset.interestRate && (
                        <span className="rui-badge ok"><TrendingUp size={13} aria-hidden="true" />{asset.interestRate}% APY</span>
                      )}
                    </div>
                    <div className="ast-acct-btns">
                      <button type="button" onClick={() => setUpdatingAsset(asset)} className="ast-btn is-ghost">
                        <RefreshCw size={16} aria-hidden="true" />
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowHistory(showHistory === asset.id ? null : asset.id)}
                        className="ast-link"
                        aria-expanded={showHistory === asset.id}
                      >
                        <History size={15} aria-hidden="true" />
                        History
                      </button>
                    </div>
                  </div>

                  {/* Last updated */}
                  <p className="ast-upd">Updated {format(parseISO(asset.updatedAt), 'MMM d, yyyy')}</p>

                  {/* History dropdown */}
                  {showHistory === asset.id && (
                    <ul className="ast-hist">
                      {asset.balanceHistory
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map((entry) => (
                          <li key={entry.id}>
                            <span>
                              {format(parseISO(entry.date), 'MMM d, yyyy')}
                              {entry.note && <small> - {entry.note}</small>}
                            </span>
                            <b className="num">{formatCurrency(entry.balance)}</b>
                          </li>
                        ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Modals */}
      <AssetModal isOpen={isModalOpen} onClose={handleCloseModal} asset={editingAsset} />
      <UpdateBalanceModal isOpen={!!updatingAsset} onClose={() => setUpdatingAsset(null)} asset={updatingAsset} />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
