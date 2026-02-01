/**
 * useTheme Hook
 *
 * Manages theme application and provides theme utilities.
 * Automatically applies theme on mount and when settings change.
 */

import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { applyTheme, generateThemeFromColor, THEME_PRESETS, THEME_METADATA } from '../lib/themes';
import type { ThemePreset, ThemeColors } from '../types';

export function useTheme() {
  const { settings, updateTheme } = useApp();

  // Apply theme on mount and when theme settings change
  useEffect(() => {
    if (settings.theme) {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  // Set a preset theme
  const setPreset = useCallback((preset: ThemePreset) => {
    updateTheme({ ...settings.theme, preset });
  }, [updateTheme, settings.theme]);

  // Set a custom theme with specific colors
  const setCustomColors = useCallback((colors: ThemeColors) => {
    updateTheme({ ...settings.theme, preset: 'custom', customColors: colors });
  }, [updateTheme, settings.theme]);

  // Generate and set a custom theme from a single base color
  const setCustomFromColor = useCallback((baseColor: string) => {
    const colors = generateThemeFromColor(baseColor);
    updateTheme({ ...settings.theme, preset: 'custom', customColors: colors });
  }, [updateTheme, settings.theme]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    updateTheme({ ...settings.theme, darkMode: !settings.theme?.darkMode });
  }, [updateTheme, settings.theme]);

  // Set dark mode explicitly
  const setDarkMode = useCallback((enabled: boolean) => {
    updateTheme({ ...settings.theme, darkMode: enabled });
  }, [updateTheme, settings.theme]);

  return {
    // Current theme settings
    theme: settings.theme,
    currentPreset: settings.theme?.preset || 'default',
    isDarkMode: settings.theme?.darkMode || false,

    // Theme setters
    setPreset,
    setCustomColors,
    setCustomFromColor,
    toggleDarkMode,
    setDarkMode,

    // Theme data
    presets: THEME_PRESETS,
    metadata: THEME_METADATA,
  };
}

export { THEME_PRESETS, THEME_METADATA } from '../lib/themes';
