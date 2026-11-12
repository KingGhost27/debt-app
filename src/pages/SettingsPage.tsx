/**
 * Settings Page: ranch edition.
 *
 * Profile, plan, theme picker (live scene thumbnails), categories, bill
 * reminders, help, data backup, celebration previews and account deletion.
 * Cards sit on the ranch ground with plank headings, like the dashboard
 * modules. Styles: pages/settings.css. Behavior is unchanged.
 */

import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Trash2, ChevronLeft, ChevronRight, Heart, Check, LogOut, FileSpreadsheet, Bell, BellOff, Play, Crown } from 'lucide-react';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { DebtsyCow } from '../components/ui/DebtsyCow';
import './settings.css';
import { useSubscription } from '../hooks/useSubscription';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { CelebrationModal } from '../components/ui/CelebrationModal';
import type { MilestoneEvent, CelebrationStats } from '../types/celebrations';
import { useNotificationSettings } from '../hooks/useNotifications';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { CategoryManager } from '../components/ui/CategoryManager';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { DeleteAccountSection } from '../components/settings/DeleteAccountSection';
import { isRunningInTwa } from '../lib/twa';
import { PageHeader } from '../components/layout/PageHeader';
import { ProLockBadge } from '../components/ui/ProLockBadge';

export function SettingsPage() {
  const navigate = useNavigate();
  const { exportAppData, exportPaymentHistory, importAppData, clearAllData, settings, updateSettings } = useApp();
  const { signOut, user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState(settings.userName || '');
  const [nameSaved, setNameSaved] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();
  const { settings: notifSettings, save: saveNotif, requestPermission, permissionState } = useNotificationSettings();
  const [testMilestone, setTestMilestone] = useState<MilestoneEvent | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isPro, planType, stripeCustomerId, currentPeriodEnd, cancelAtPeriodEnd, isLoading: subLoading, refetch: refetchSubscription } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  // Play consumption-only: no purchase or checkout link-out inside the Android wrapper.
  const inTwa = isRunningInTwa();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('upgraded') !== '1') return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts += 1;
        await refetchSubscription();
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 1500));
      }
    };

    showToast('Welcome to Pro! Updating your account…', 'success');
    poll();

    const params = new URLSearchParams(searchParams);
    params.delete('upgraded');
    setSearchParams(params, { replace: true });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) return;
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Please sign in again to manage your subscription', 'error');
        return;
      }
      const res = await fetch('/api/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) window.location.href = data.url;
    } catch {
      showToast('Failed to open subscription portal', 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  const testStats: CelebrationStats = {
    userName: settings.userName || 'Flora',
    totalOriginal: 22000,
    totalPaid: 10520.75,
    percentPaid: 47.8,
    interestSaved: 1234.56,
    debtFreeDate: '2027-06-15',
    paidOffDebtName: 'Chase Credit Card',
  };

  const TEST_MILESTONES: Array<{ event: MilestoneEvent; label: string }> = [
    { label: 'First Payment', event: { type: 'first_payment', isFullHerd: false, headline: 'First Payment Made!', subtext: 'Every journey starts with a single step' } },
    { label: '25% Progress', event: { type: 'progress_25', isFullHerd: false, headline: 'Quarter of the Way There!', subtext: "You've crushed 25% of your debt!" } },
    { label: '50% Progress', event: { type: 'progress_50', isFullHerd: false, headline: 'Halfway Point!', subtext: "You've demolished HALF your debt!" } },
    { label: '75% Progress', event: { type: 'progress_75', isFullHerd: false, headline: 'Almost There!', subtext: "75% done — the finish line is in sight!" } },
    { label: '3-Month Streak', event: { type: 'streak_3', isFullHerd: false, headline: '3-Month Streak!', subtext: 'Three months of consistent payments!' } },
    { label: '6-Month Streak', event: { type: 'streak_6', isFullHerd: false, headline: '6-Month Streak!', subtext: 'Half a year of crushing it!' } },
    { label: '$500 Interest Saved', event: { type: 'interest_500', isFullHerd: false, headline: '$500 in Interest Saved!', subtext: "That's money that stays in YOUR pocket!" } },
    { label: '$1K Interest Saved', event: { type: 'interest_1000', isFullHerd: false, headline: '$1,000 in Interest Saved!', subtext: 'A thousand reasons to celebrate!' } },
    { label: '$5K Interest Saved', event: { type: 'interest_5000', isFullHerd: false, headline: '$5,000 in Interest Saved!', subtext: "You're a debt-fighting legend!" } },
    { label: 'Debt Paid Off (Full Herd)', event: { type: 'debt_paid_off', isFullHerd: true, headline: 'Chase Credit Card — PAID OFF!', subtext: 'One down, the herd celebrates with you!', debtName: 'Chase Credit Card' } },
    { label: '100% DEBT FREE (Full Herd)', event: { type: 'debt_free', isFullHerd: true, headline: "YOU'RE DEBT FREE!", subtext: 'The entire herd is celebrating!' } },
  ];

  const handleSaveName = () => {
    updateSettings({ userName: nameInput.trim() });
    setNameSaved(true);
    showToast('Name saved!', 'success');
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importAppData(file);
      showToast('Data imported successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to import data', 'error');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const planLabel = planType === 'lifetime' ? 'Lifetime' : planType === 'annual' ? 'Annual' : 'Monthly';

  return (
    <div className="min-h-screen animate-page-enter set">
      <PageHeader
        title="Settings"
        subtitle="Make it yours!"
        action={
          <button onClick={() => navigate(-1)} className="btn-icon" aria-label="Go back">
            <ChevronLeft size={20} />
          </button>
        }
      />

      <div className="set-body">
        <div className="set-col">
          {/* Profile */}
          <section className="rui-card set-sec" aria-labelledby="set-profile">
            <div className="set-sec-h">
              <h2 id="set-profile" className="rui-plank">Profile</h2>
              <p className="set-sub">Personalize your experience</p>
            </div>

            <div className="set-field">
              <label htmlFor="set-name" className="set-label">Your Name</label>
              <div className="set-inline">
                <input
                  id="set-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="set-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                />
                <button onClick={handleSaveName} className={`set-btn${nameSaved ? ' ok' : ''}`}>
                  {nameSaved ? (<><Check size={16} />Saved!</>) : 'Save'}
                </button>
              </div>
              <p className="set-hint">This will be shown in your home page greeting</p>
            </div>

            <div className="set-rows">
              {/* Account info + sign out */}
              <div className="set-row">
                <p className="set-email">{user?.email}</p>
                <button
                  onClick={() => confirm({
                    title: 'Sign Out',
                    message: 'Are you sure you want to sign out?',
                    confirmLabel: 'Sign Out',
                    variant: 'danger',
                    onConfirm: () => signOut(),
                  })}
                  className="set-btn ghost sm"
                  style={{ color: 'var(--ranch-focus)', boxShadow: 'inset 0 0 0 2px var(--ranch-focus)' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>

              {/* Legal — must stay reachable in-app for app store review */}
              <div className="set-row">
                <div className="set-legal">
                  <a href="/privacy" className="set-link">Privacy Policy</a>
                  <a href="/terms" className="set-link">Terms of Service</a>
                </div>
              </div>
            </div>
          </section>

          {/* Subscription / Plan */}
          <section className="rui-card set-sec" aria-label="Your plan">
            {subLoading ? (
              <div className="set-plan" role="status">
                <span className="set-ic gold"><Crown size={20} /></span>
                <p className="set-hint">Loading plan...</p>
              </div>
            ) : isPro ? (
              <div className="set-plan">
                <span className="set-ic gold"><Crown size={20} /></span>
                <div className="set-plan-copy">
                  <p className="set-plan-t">Pro — {planLabel}</p>
                  {currentPeriodEnd && planType !== 'lifetime' && (
                    <p className="set-hint">
                      {cancelAtPeriodEnd ? 'Until' : 'Renews'} {new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                {cancelAtPeriodEnd && <span className="rui-badge focus">Canceling</span>}
                {/* The billing portal is a link out to Stripe — not permitted inside the
                    Play-distributed wrapper under the consumption-only exception. */}
                {stripeCustomerId && planType !== 'lifetime' && !inTwa && (
                  <button onClick={handleManageSubscription} disabled={portalLoading} className="set-btn ghost sm">
                    {portalLoading ? '...' : 'Manage'}
                  </button>
                )}
                {stripeCustomerId && planType !== 'lifetime' && inTwa && (
                  <span className="set-hint" style={{ textAlign: 'right' }}>
                    Manage at
                    <br />
                    cowculator.net
                  </span>
                )}
              </div>
            ) : (
              <div className="set-plan">
                <span className="set-ic gold"><Crown size={20} /></span>
                <div className="set-plan-copy">
                  <p className="set-plan-t">Free plan</p>
                  <p className="set-hint">
                    {inTwa ? 'Pro is managed on cowculator.net' : 'Unlock unlimited debts + all themes'}
                  </p>
                </div>
                {!inTwa && (
                  <button onClick={() => setShowUpgradeModal(true)} className="set-btn sm">Upgrade</button>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="set-col">
          {/* Theme */}
          <section className="rui-card set-sec" aria-labelledby="set-theme">
            <div className="set-sec-h">
              <h2 id="set-theme" className="rui-plank">Theme & Colors</h2>
              <p className="set-sub">Make it yours!</p>
            </div>
            <ThemeSelector />
          </section>

          {/* Categories */}
          <section className="rui-card set-sec" aria-labelledby="set-cats">
            <div className="set-sec-h">
              <h2 id="set-cats" className="rui-plank">Categories</h2>
            </div>
            <CategoryManager />
          </section>
        </div>

        <div className="set-col">
          {/* Notifications */}
          <section className="rui-card set-sec" aria-labelledby="set-bills">
            <div className="set-sec-h">
              <h2 id="set-bills" className="rui-plank">Bill Reminders</h2>
              <p className="set-sub">Get notified before payments are due</p>
            </div>

            {permissionState === 'denied' ? (
              <div className="set-note-box" role="alert">
                <BellOff size={20} />
                <p>Notifications are blocked. Please allow them in your browser settings, then come back here.</p>
              </div>
            ) : permissionState === 'default' ? (
              <button
                onClick={async () => {
                  const result = await requestPermission();
                  if (result === 'denied') showToast('Notifications blocked — allow them in browser settings', 'error');
                  else if (result === 'granted') showToast('Notifications enabled!', 'success');
                }}
                className="set-act"
              >
                <span className="set-ic"><Bell size={20} /></span>
                <span style={{ flex: 1 }}>
                  <span className="set-act-t">Allow Notifications</span>
                  <span className="set-act-d">Tap to enable bill reminders on this device</span>
                </span>
                <ChevronRight size={20} />
              </button>
            ) : (
              <div className="set-row" style={{ padding: 0 }}>
                <span className="set-label" id="set-rem-l" style={{ fontSize: 17 }}>
                  {notifSettings.enabled ? 'Reminders on' : 'Reminders off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifSettings.enabled}
                  aria-labelledby="set-rem-l"
                  onClick={() => saveNotif({ enabled: !notifSettings.enabled })}
                  className="set-switch"
                />
              </div>
            )}

            {permissionState === 'granted' && notifSettings.enabled && (
              <>
                <div className="set-field">
                  <p className="set-label">Remind me how far in advance?</p>
                  <SegmentedControl
                    label="Days in advance"
                    value={String(notifSettings.daysInAdvance)}
                    onValueChange={(v) => saveNotif({ daysInAdvance: Number(v) })}
                    options={[1, 3, 5, 7].map((d) => ({ value: String(d), label: `${d}d` }))}
                    className="seg-block"
                  />
                </div>

                <div className="set-field">
                  <p className="set-label">Remind me about</p>
                  <label className="set-check">
                    <input type="checkbox" checked={notifSettings.remindSubscriptions} onChange={() => saveNotif({ remindSubscriptions: !notifSettings.remindSubscriptions })} />
                    Subscription renewals
                  </label>
                  <label className="set-check">
                    <input type="checkbox" checked={notifSettings.remindPayments} onChange={() => saveNotif({ remindPayments: !notifSettings.remindPayments })} />
                    Debt payment due dates
                  </label>
                </div>
              </>
            )}
          </section>

          {/* Help & Tutorial */}
          <section className="rui-card set-sec" aria-labelledby="set-help">
            <div className="set-sec-h">
              <h2 id="set-help" className="rui-plank">Help & Tutorial</h2>
              <p className="set-sub">See how all the features work</p>
            </div>
            <button onClick={() => navigate('/?tutorial=1')} className="set-act">
              <span className="set-ic"><Play size={18} /></span>
              <span style={{ flex: 1 }}>
                <span className="set-act-t">Replay Tutorial</span>
                <span className="set-act-d">Walk through the app guide again</span>
              </span>
              <ChevronRight size={20} />
            </button>
          </section>

          {/* Data Management */}
          <section className="rui-card set-sec" aria-labelledby="set-data">
            <div className="set-sec-h">
              <h2 id="set-data" className="rui-plank">Data Management</h2>
              <p className="set-sub">Backup & restore</p>
            </div>

            <div className="set-acts">
              <button onClick={() => (isPro ? exportAppData() : setShowUpgradeModal(true))} className="set-act">
                <span className="set-ic"><Download size={20} /></span>
                <span style={{ flex: 1 }}>
                  <span className="set-act-t">Export Data {!isPro && <ProLockBadge size="xs" />}</span>
                  <span className="set-act-d">Download your data as a backup</span>
                </span>
              </button>

              <button onClick={() => (isPro ? exportPaymentHistory() : setShowUpgradeModal(true))} className="set-act">
                <span className="set-ic"><FileSpreadsheet size={20} /></span>
                <span style={{ flex: 1 }}>
                  <span className="set-act-t">Export Payment History {!isPro && <ProLockBadge size="xs" />}</span>
                  <span className="set-act-d">Download payments as CSV spreadsheet</span>
                </span>
              </button>

              <button onClick={handleImportClick} className="set-act">
                <span className="set-ic"><Upload size={20} /></span>
                <span style={{ flex: 1 }}>
                  <span className="set-act-t">Import Data</span>
                  <span className="set-act-d">Restore from a backup file</span>
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" aria-label="Choose a backup file" />

              <button
                onClick={() => confirm({
                  title: 'Clear All Data',
                  message: 'Are you sure you want to delete all data? This cannot be undone. You will lose all debts, payments, and settings.',
                  confirmLabel: 'Delete Everything',
                  variant: 'danger',
                  onConfirm: () => clearAllData(),
                })}
                className="set-act is-danger"
              >
                <span className="set-ic red"><Trash2 size={20} /></span>
                <span style={{ flex: 1 }}>
                  <span className="set-act-t">Clear All Data</span>
                  <span className="set-act-d">Delete everything and start fresh</span>
                </span>
              </button>
            </div>
          </section>

          {/* Milestone card testing */}
          <section className="rui-card set-sec" aria-labelledby="set-test">
            <div className="set-sec-h">
              <h2 id="set-test" className="rui-plank">Test Celebrations</h2>
              <p className="set-sub">Preview all milestone card types</p>
            </div>

            <p className="set-group-t">Two Animals (Theme + Debtsy)</p>
            <div className="set-chips">
              {TEST_MILESTONES.filter(m => !m.event.isFullHerd).map((m) => (
                <button key={m.event.type} onClick={() => setTestMilestone(m.event)} className="set-chip">{m.label}</button>
              ))}
            </div>

            <p className="set-group-t">Full Herd (All 10 Animals)</p>
            <div className="set-chips one">
              {TEST_MILESTONES.filter(m => m.event.isFullHerd).map((m) => (
                <button key={m.event.type} onClick={() => setTestMilestone(m.event)} className="set-chip">{m.label}</button>
              ))}
            </div>
          </section>
        </div>

        {/* Danger zone — self-serve deletion, as promised in the privacy policy */}
        <div className="span-2"><DeleteAccountSection /></div>

        {/* App Info */}
        <div className="set-foot span-2">
          <span className="rui-badge"><DebtsyCow size={22} />Cowculator v1.2.0</span>
          <p className="set-made">
            Made with <Heart size={14} fill="currentColor" aria-label="love" /> for your financial freedom
          </p>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />

      {testMilestone && (
        <CelebrationModal
          event={testMilestone}
          stats={testMilestone.type === 'debt_free' ? { ...testStats, percentPaid: 100, totalPaid: 22000 } : testStats}
          themePreset={settings.theme.preset}
          onDismiss={() => setTestMilestone(null)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal onDismiss={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
