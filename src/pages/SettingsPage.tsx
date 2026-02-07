/**
 * Settings Page - Kawaii Edition
 *
 * Cute app customization including theme selection, category management,
 * and data import/export with delightful styling.
 */

import { useRef, useState } from 'react';
import { Download, Upload, Trash2, ChevronLeft, Sparkles, Database, Heart, User, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { CategoryManager } from '../components/ui/CategoryManager';

export function SettingsPage() {
  const navigate = useNavigate();
  const { exportAppData, importAppData, clearAllData, settings, updateSettings } = useApp();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState(settings.userName || '');
  const [nameSaved, setNameSaved] = useState(false);

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
      'my-melody': '🎀',
      'kuromi': '💜',
      'cinnamoroll': '☁️',
      'pompompurin': '🍮',
      'hello-kitty': '🌸',
      'keroppi': '🐸',
      'chococat': '☕',
      'default': '✨',
    };
    return emojiMap[settings.theme.preset] || '✨';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="page-header bg-gradient-to-b from-primary-200 to-primary-100/50 px-4 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-300/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
        <Sparkles size={16} className="absolute top-8 right-12 text-primary-400/40 animate-kawaii-pulse" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-kawaii-float" style={{ animationDuration: '3s' }}>
              {getThemeEmoji()}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm">Make it yours!</p>
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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-300/30">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Profile</h3>
              <p className="text-sm text-gray-500">Personalize your experience</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className={`px-4 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                    nameSaved
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-300/30'
                  }`}
                >
                  {nameSaved ? (
                    <>
                      <Check size={18} />
                      Saved!
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This will be shown in your home page greeting
              </p>
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

        {/* Data Management Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Data Management</h3>
              <p className="text-sm text-gray-500">Backup & restore</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={exportAppData}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/30 dark:to-gray-800 rounded-2xl border border-primary-100/50 dark:border-primary-700/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-300/30 group-hover:scale-105 transition-transform">
                <Download size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download your data as a backup</p>
              </div>
              <Sparkles size={16} className="text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Import */}
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-white dark:from-green-900/30 dark:to-gray-800 rounded-2xl border border-green-100/50 dark:border-green-800/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-300/30 group-hover:scale-105 transition-transform">
                <Upload size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Import Data</p>
                <p className="text-sm text-gray-500">Restore from a backup file</p>
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
              onClick={clearAllData}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-white dark:from-red-900/30 dark:to-gray-800 rounded-2xl border border-red-100/50 dark:border-red-800/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-300/30 group-hover:scale-105 transition-transform">
                <Trash2 size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-700">Clear All Data</p>
                <p className="text-sm text-red-400">Delete everything and start fresh</p>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50/50 rounded-full mb-3">
            <span className="text-lg">{getThemeEmoji()}</span>
            <span className="text-sm font-medium text-primary-600">Debt Payoff App v1.2.0</span>
          </div>
          <p className="text-sm text-gray-400 flex items-center justify-center gap-1">
            Made with <Heart size={14} className="text-red-400 animate-heartbeat" fill="currentColor" /> for your financial freedom
          </p>
        </div>
      </div>
    </div>
  );
}
