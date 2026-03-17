/**
 * Settings Page - Kawaii Edition
 *
 * Cute app customization including theme selection, category management,
 * and data import/export with delightful styling.
 */

import { useRef, useState } from 'react';
import { Download, Upload, Trash2, ChevronLeft, Sparkles, Database, Heart, User, Check, LogOut, FileSpreadsheet, Bell, BellOff, HelpCircle, Play, FlaskConical } from 'lucide-react';
import { CelebrationModal } from '../components/ui/CelebrationModal';
import type { MilestoneEvent, CelebrationStats } from '../types/celebrations';
import { useNotificationSettings } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { CategoryManager } from '../components/ui/CategoryManager';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

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

  const testStats: CelebrationStats = {
    userName: settings.userName || 'Flora',
    totalOriginal: 22000,
    totalPaid: 10520.75,
    percentPaid: 47.8,
    interestSaved: 1234.56,
    debtFreeDate: '2027-06-15',
    paidOffDebtName: 'Chase Credit Card',
  };

  const TEST_MILESTONES: Array<{ event: MilestoneEvent; label: string; color: string }> = [
    { label: 'First Payment', color: 'bg-green-100 text-green-700', event: { type: 'first_payment', isFullHerd: false, headline: 'First Payment Made!', subtext: 'Every journey starts with a single step 🐄' } },
    { label: '25% Progress', color: 'bg-blue-100 text-blue-700', event: { type: 'progress_25', isFullHerd: false, headline: 'Quarter of the Way There!', subtext: "You've crushed 25% of your debt!" } },
    { label: '50% Progress', color: 'bg-purple-100 text-purple-700', event: { type: 'progress_50', isFullHerd: false, headline: 'Halfway Point!', subtext: "You've demolished HALF your debt!" } },
    { label: '75% Progress', color: 'bg-orange-100 text-orange-700', event: { type: 'progress_75', isFullHerd: false, headline: 'Almost There!', subtext: "75% done — the finish line is in sight!" } },
    { label: '3-Month Streak', color: 'bg-yellow-100 text-yellow-700', event: { type: 'streak_3', isFullHerd: false, headline: '3-Month Streak!', subtext: 'Three months of consistent payments!' } },
    { label: '6-Month Streak', color: 'bg-amber-100 text-amber-700', event: { type: 'streak_6', isFullHerd: false, headline: '6-Month Streak!', subtext: 'Half a year of crushing it!' } },
    { label: '$500 Interest Saved', color: 'bg-emerald-100 text-emerald-700', event: { type: 'interest_500', isFullHerd: false, headline: '$500 in Interest Saved!', subtext: "That's money that stays in YOUR pocket!" } },
    { label: '$1K Interest Saved', color: 'bg-teal-100 text-teal-700', event: { type: 'interest_1000', isFullHerd: false, headline: '$1,000 in Interest Saved!', subtext: 'A thousand reasons to celebrate!' } },
    { label: '$5K Interest Saved', color: 'bg-cyan-100 text-cyan-700', event: { type: 'interest_5000', isFullHerd: false, headline: '$5,000 in Interest Saved!', subtext: "You're a debt-fighting legend!" } },
    { label: 'Debt Paid Off (Full Herd)', color: 'bg-pink-100 text-pink-700', event: { type: 'debt_paid_off', isFullHerd: true, headline: 'Chase Credit Card — PAID OFF!', subtext: 'One down, the herd celebrates with you!', debtName: 'Chase Credit Card' } },
    { label: '100% DEBT FREE (Full Herd)', color: 'bg-red-100 text-red-700 font-bold', event: { type: 'debt_free', isFullHerd: true, headline: "YOU'RE DEBT FREE!", subtext: 'The entire herd is celebrating!' } },
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

  // Get theme-appropriate emoji
  const getThemeEmoji = () => {
    const emojiMap: Record<string, string> = {
      'my-melody': '🐷',
      'kuromi': '🌙',
      'cinnamoroll': '🦦',
      'pompompurin': '🐥',
      'hello-kitty': '🍒',
      'keroppi': '🐸',
      'chococat': '🐻',
      'maple': '🦊',
      'default': '🐰',
    };
    return emojiMap[settings.theme.preset] || '✨';
  };

  return (
    <div className="min-h-screen animate-page-enter">
      {/* Header */}
      <header className="page-header bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-8 pb-6 sm:pt-12 sm:pb-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-300/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
        <Sparkles size={16} className="absolute top-8 right-12 text-primary-400/40 animate-kawaii-pulse" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl animate-kawaii-float" style={{ animationDuration: '3s' }}>
              {getThemeEmoji()}
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Make it yours!</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn-icon"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-4 overflow-hidden">
          <svg viewBox="0 0 1200 30" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,15 Q300,30 600,15 T1200,15 L1200,30 L0,30 Z" fill="currentColor" className="text-gray-50" />
          </svg>
        </div>
      </header>

      <div className="px-4 py-6 space-y-5">
        {/* Profile Section */}
        <div className="card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/30">
              <User size={16} className="text-white sm:hidden" />
              <User size={20} className="text-white hidden sm:block" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Profile</h3>
              <p className="text-xs sm:text-sm text-gray-500">Personalize your experience</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Your Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 text-sm placeholder-gray-400 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    nameSaved
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-300/30'
                  }`}
                >
                  {nameSaved ? (
                    <>
                      <Check size={16} />
                      Saved!
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">
                This will be shown in your home page greeting
              </p>
            </div>

            {/* Account info + sign out */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{user?.email}</p>
              <button
                onClick={() => confirm({
                  title: 'Sign Out',
                  message: 'Are you sure you want to sign out?',
                  confirmLabel: 'Sign Out',
                  variant: 'danger',
                  onConfirm: () => signOut(),
                })}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="card">
          <ThemeSelector />
        </div>

        {/* Categories Section */}
        <div className="card">
          <CategoryManager />
        </div>

        {/* Notifications Section */}
        <div className="card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-300/30">
              <Bell size={16} className="text-white sm:hidden" />
              <Bell size={20} className="text-white hidden sm:block" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Bill Reminders</h3>
              <p className="text-xs sm:text-sm text-gray-500">Get notified before payments are due</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Permission / enable toggle */}
            {permissionState === 'denied' ? (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
                <BellOff size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">Notifications are blocked. Please allow them in your browser settings, then come back here.</p>
              </div>
            ) : permissionState === 'default' ? (
              <button
                onClick={async () => {
                  const result = await requestPermission();
                  if (result === 'denied') showToast('Notifications blocked — allow them in browser settings', 'error');
                  else if (result === 'granted') showToast('Notifications enabled! 🔔', 'success');
                }}
                className="w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-white rounded-xl sm:rounded-2xl border border-amber-100 hover:shadow-md transition-all text-left"
              >
                <Bell size={18} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">Allow Notifications</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Tap to enable bill reminders on this device</p>
                </div>
                <Sparkles size={14} className="text-amber-300" />
              </button>
            ) : (
              /* Permission granted — show toggle */
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  {notifSettings.enabled ? <Bell size={18} className="text-amber-500" /> : <BellOff size={18} className="text-gray-400" />}
                  <span className="text-sm font-medium text-gray-700">
                    {notifSettings.enabled ? 'Reminders on' : 'Reminders off'}
                  </span>
                </div>
                <button
                  onClick={() => saveNotif({ enabled: !notifSettings.enabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${notifSettings.enabled ? 'bg-amber-400' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${notifSettings.enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            )}

            {/* Options — only show when enabled + permitted */}
            {permissionState === 'granted' && notifSettings.enabled && (
              <>
                {/* Days in advance */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Remind me how far in advance?</p>
                  <div className="flex gap-2">
                    {[1, 3, 5, 7].map((days) => (
                      <button
                        key={days}
                        onClick={() => saveNotif({ daysInAdvance: days })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                          notifSettings.daysInAdvance === days
                            ? 'bg-amber-400 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* What to remind */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Remind me about</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => saveNotif({ remindSubscriptions: !notifSettings.remindSubscriptions })}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${notifSettings.remindSubscriptions ? 'bg-amber-400 border-amber-400' : 'border-gray-300'}`}
                      >
                        {notifSettings.remindSubscriptions && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">Subscription renewals</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => saveNotif({ remindPayments: !notifSettings.remindPayments })}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${notifSettings.remindPayments ? 'bg-amber-400 border-amber-400' : 'border-gray-300'}`}
                      >
                        {notifSettings.remindPayments && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">Debt payment due dates</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help & Tutorial Section */}
        <div className="card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-300/30">
              <HelpCircle size={16} className="text-white sm:hidden" />
              <HelpCircle size={20} className="text-white hidden sm:block" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Help & Tutorial</h3>
              <p className="text-xs sm:text-sm text-gray-500">See how all the features work</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/?tutorial=1')}
            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-sky-50 to-white dark:from-sky-900/20 dark:to-gray-800 rounded-xl sm:rounded-2xl border border-sky-100/50 dark:border-sky-700/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-sky-300/30 group-hover:scale-105 transition-transform">
              <Play size={14} className="text-white sm:hidden" />
              <Play size={18} className="text-white hidden sm:block" />
            </div>
            <div className="flex-1">
              <p className="text-sm sm:text-base font-semibold text-gray-900">Replay Tutorial</p>
              <p className="text-xs sm:text-sm text-gray-500">Walk through the app guide again</p>
            </div>
            <Sparkles size={14} className="text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Data Management Section */}
        <div className="card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <Database size={16} className="text-white sm:hidden" />
              <Database size={20} className="text-white hidden sm:block" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Data Management</h3>
              <p className="text-xs sm:text-sm text-gray-500">Backup & restore</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={exportAppData}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/30 dark:to-gray-800 rounded-xl sm:rounded-2xl border border-primary-100/50 dark:border-primary-700/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-300/30 group-hover:scale-105 transition-transform">
                <Download size={16} className="text-white sm:hidden" />
                <Download size={22} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">Export Data</p>
                <p className="text-xs sm:text-sm text-gray-500">Download your data as a backup</p>
              </div>
              <Sparkles size={16} className="text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Export Payment History */}
            <button
              onClick={exportPaymentHistory}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 rounded-xl sm:rounded-2xl border border-purple-100/50 dark:border-purple-700/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-300/30 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={16} className="text-white sm:hidden" />
                <FileSpreadsheet size={22} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">Export Payment History</p>
                <p className="text-xs sm:text-sm text-gray-500">Download payments as CSV spreadsheet</p>
              </div>
              <Sparkles size={16} className="text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Import */}
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-white dark:from-green-900/30 dark:to-gray-800 rounded-xl sm:rounded-2xl border border-green-100/50 dark:border-green-800/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-300/30 group-hover:scale-105 transition-transform">
                <Upload size={16} className="text-white sm:hidden" />
                <Upload size={22} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">Import Data</p>
                <p className="text-xs sm:text-sm text-gray-500">Restore from a backup file</p>
              </div>
              <Sparkles size={16} className="text-green-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Clear Data */}
            <button
              onClick={() => confirm({
                title: 'Clear All Data',
                message: 'Are you sure you want to delete all data? This cannot be undone. You will lose all debts, payments, and settings.',
                confirmLabel: 'Delete Everything',
                variant: 'danger',
                onConfirm: () => clearAllData(),
              })}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-white dark:from-red-900/30 dark:to-gray-800 rounded-xl sm:rounded-2xl border border-red-100/50 dark:border-red-800/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-red-300/30 group-hover:scale-105 transition-transform">
                <Trash2 size={16} className="text-white sm:hidden" />
                <Trash2 size={22} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-red-700">Clear All Data</p>
                <p className="text-xs sm:text-sm text-red-400">Delete everything and start fresh</p>
              </div>
            </button>
          </div>
        </div>

        {/* Milestone Card Testing */}
        <div className="card">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-300/30">
              <FlaskConical size={16} className="text-white sm:hidden" />
              <FlaskConical size={20} className="text-white hidden sm:block" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Test Celebrations</h3>
              <p className="text-xs sm:text-sm text-gray-500">Preview all milestone card types</p>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">Two Animals (Theme + Debtsy)</p>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {TEST_MILESTONES.filter(m => !m.event.isFullHerd).map((m) => (
                <button
                  key={m.event.type}
                  onClick={() => setTestMilestone(m.event)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 ${m.color}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Full Herd (All 10 Animals)</p>
            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
              {TEST_MILESTONES.filter(m => m.event.isFullHerd).map((m) => (
                <button
                  key={m.event.type}
                  onClick={() => setTestMilestone(m.event)}
                  className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.01] active:scale-95 ${m.color}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-4 sm:py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-50/50 rounded-full mb-2 sm:mb-3">
            <span className="text-base sm:text-lg">{getThemeEmoji()}</span>
            <span className="text-xs sm:text-sm font-medium text-primary-600">Cowculator v1.2.0</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 flex items-center justify-center gap-1">
            Made with <Heart size={12} className="text-red-400 animate-heartbeat sm:hidden" fill="currentColor" /><Heart size={14} className="text-red-400 animate-heartbeat hidden sm:block" fill="currentColor" /> for your financial freedom
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
    </div>
  );
}
