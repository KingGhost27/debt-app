/**
 * Local Storage Service
 *
 * Handles saving/loading app data to localStorage,
 * plus export/import functionality for data portability.
 */

import type { AppData } from '../types';
import { DEFAULT_APP_DATA } from '../types';

const STORAGE_KEY = 'debt-payoff-app-data';

/**
 * Save app data to localStorage
 */
export function saveData(data: AppData): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    throw new Error('Failed to save data');
  }
}

/**
 * Load app data from localStorage
 * Returns default data if nothing saved yet
 */
export function loadData(): AppData {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return { ...DEFAULT_APP_DATA };
    }

    const data = JSON.parse(serialized) as AppData;

    // Migrate old data if needed (version check)
    return migrateData(data);
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return { ...DEFAULT_APP_DATA };
  }
}

/**
 * Clear all saved data
 */
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export app data as a downloadable JSON file
 */
export function exportData(data: AppData): void {
  const exportData: AppData = {
    ...data,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `debt-payoff-backup-${formatDateForFilename(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import app data from a JSON file
 * Returns the parsed data for the caller to merge/replace
 */
export async function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as AppData;

        // Validate the imported data has required fields
        if (!validateImportedData(data)) {
          reject(new Error('Invalid file format. Please select a valid backup file.'));
          return;
        }

        // Migrate if needed
        const migratedData = migrateData(data);
        resolve(migratedData);
      } catch {
        reject(new Error('Failed to parse file. Please select a valid JSON file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate imported data has the required structure
 */
function validateImportedData(data: unknown): data is AppData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  // Check required fields exist
  if (!Array.isArray(d.debts)) return false;
  if (!d.strategy || typeof d.strategy !== 'object') return false;

  return true;
}

/**
 * Migrate data from older versions
 * Add migration logic here as the schema evolves
 */
function migrateData(data: AppData): AppData {
  let migrated = { ...data };

  // Ensure all required fields exist (for backwards compatibility)
  if (!migrated.version) {
    migrated.version = '1.0.0';
  }

  if (!migrated.payments) {
    migrated.payments = [];
  }

  if (!migrated.settings) {
    migrated.settings = DEFAULT_APP_DATA.settings;
  }

  if (!migrated.strategy) {
    migrated.strategy = DEFAULT_APP_DATA.strategy;
  }

  // Future migrations would go here:
  // if (migrated.version === '1.0.0') {
  //   // migrate to 1.1.0
  //   migrated.version = '1.1.0';
  // }

  return migrated;
}

/**
 * Format date for filename
 */
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
