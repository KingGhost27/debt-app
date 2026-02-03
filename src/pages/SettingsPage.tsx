/**
 * Settings Page
 *
 * App customization including theme selection, category management,
 * and data import/export.
 */

import { useRef } from 'react';
import { Settings, Download, Upload, Trash2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { CategoryManager } from '../components/ui/CategoryManager';

export function SettingsPage() {
  const navigate = useNavigate();
  const { exportAppData, importAppData, clearAllData } = useApp();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Settings"
        subtitle="Customize your experience"
        action={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
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
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Settings size={20} />
            Data Management
          </h3>

          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={exportAppData}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Download size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-500">Download your data as a JSON backup file</p>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Upload size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium">Import Data</p>
                <p className="text-sm text-gray-500">Restore from a backup file</p>
              </div>
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
              className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-700">Clear All Data</p>
                <p className="text-sm text-red-500">Delete everything and start fresh</p>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-400 py-4">
          <p>Debt Payoff App v1.1.0</p>
          <p className="mt-1">Made with 💖</p>
        </div>
      </div>
    </div>
  );
}
