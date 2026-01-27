/**
 * Theme System
 *
 * Preset theme definitions and utilities for applying themes dynamically.
 * Supports My Melody (pink), Kuromi (purple), and custom themes.
 */

import type { ThemeColors, ThemePreset, ThemeSettings } from '../types';

// ============================================
// THEME PRESETS
// ============================================

export const THEME_PRESETS: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  // Default: Teal/Cyan (current theme)
  default: {
    primary50: '#ecfeff',
    primary100: '#cffafe',
    primary200: '#a5f3fc',
    primary300: '#67e8f9',
    primary400: '#22d3ee',
    primary500: '#06b6d4',
    primary600: '#0891b2',
    primary700: '#0e7490',
    primary800: '#155e75',
    primary900: '#164e63',
    accent: '#22d3ee',
    accentLight: '#a5f3fc',
    gradientFrom: '#a5f3fc',
    gradientTo: '#ecfeff',
  },

  // My Melody: Soft Pink/White (cute, dreamy)
  'my-melody': {
    primary50: '#fff5f7',
    primary100: '#ffe0e6',
    primary200: '#ffb8c6',
    primary300: '#ff8fa8',
    primary400: '#ff6b8a',
    primary500: '#ff4d6d',
    primary600: '#e63950',
    primary700: '#cc2d42',
    primary800: '#b32236',
    primary900: '#99172a',
    accent: '#ffd6e0',
    accentLight: '#fff0f3',
    gradientFrom: '#ffb8c6',
    gradientTo: '#fff5f7',
  },

  // Kuromi: Purple/Dark (edgy, cool)
  kuromi: {
    primary50: '#f5f3ff',
    primary100: '#ede9fe',
    primary200: '#ddd6fe',
    primary300: '#c4b5fd',
    primary400: '#a78bfa',
    primary500: '#8b5cf6',
    primary600: '#7c3aed',
    primary700: '#6d28d9',
    primary800: '#5b21b6',
    primary900: '#4c1d95',
    accent: '#c4b5fd',
    accentLight: '#ede9fe',
    gradientFrom: '#c4b5fd',
    gradientTo: '#f5f3ff',
  },
};

// ============================================
// THEME METADATA (for UI display)
// ============================================

export const THEME_METADATA: Record<Exclude<ThemePreset, 'custom'>, {
  name: string;
  description: string;
  emoji: string;
}> = {
  default: {
    name: 'Ocean Breeze',
    description: 'Clean teal & cyan tones',
    emoji: '🌊',
  },
  'my-melody': {
    name: 'My Melody',
    description: 'Soft pink & white, sweet & dreamy',
    emoji: '🎀',
  },
  kuromi: {
    name: 'Kuromi',
    description: 'Purple & lavender, cool & edgy',
    emoji: '💜',
  },
};

// ============================================
// THEME APPLICATION
// ============================================

/**
 * Apply a theme by setting CSS custom properties on the document root
 */
export function applyTheme(theme: ThemeSettings): void {
  const colors = getThemeColors(theme);
  const root = document.documentElement;

  // Set all color variables
  root.style.setProperty('--theme-primary-50', colors.primary50);
  root.style.setProperty('--theme-primary-100', colors.primary100);
  root.style.setProperty('--theme-primary-200', colors.primary200);
  root.style.setProperty('--theme-primary-300', colors.primary300);
  root.style.setProperty('--theme-primary-400', colors.primary400);
  root.style.setProperty('--theme-primary-500', colors.primary500);
  root.style.setProperty('--theme-primary-600', colors.primary600);
  root.style.setProperty('--theme-primary-700', colors.primary700);
  root.style.setProperty('--theme-primary-800', colors.primary800);
  root.style.setProperty('--theme-primary-900', colors.primary900);
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-accent-light', colors.accentLight);
  root.style.setProperty('--theme-gradient-from', colors.gradientFrom);
  root.style.setProperty('--theme-gradient-to', colors.gradientTo);
}

/**
 * Get the color values for a theme
 */
export function getThemeColors(theme: ThemeSettings): ThemeColors {
  if (theme.preset === 'custom' && theme.customColors) {
    return theme.customColors;
  }
  return THEME_PRESETS[theme.preset as Exclude<ThemePreset, 'custom'>] || THEME_PRESETS.default;
}

/**
 * Generate a complete ThemeColors object from a base color
 * Useful for custom theme creation with a single primary color
 */
export function generateThemeFromColor(baseColor: string): ThemeColors {
  // This is a simplified version - in production you might want
  // a more sophisticated color palette generator
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Generate shades by adjusting lightness
  const lighten = (factor: number) => {
    const nr = Math.min(255, Math.round(r + (255 - r) * factor));
    const ng = Math.min(255, Math.round(g + (255 - g) * factor));
    const nb = Math.min(255, Math.round(b + (255 - b) * factor));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };

  const darken = (factor: number) => {
    const nr = Math.round(r * (1 - factor));
    const ng = Math.round(g * (1 - factor));
    const nb = Math.round(b * (1 - factor));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };

  return {
    primary50: lighten(0.95),
    primary100: lighten(0.9),
    primary200: lighten(0.7),
    primary300: lighten(0.5),
    primary400: lighten(0.25),
    primary500: baseColor,
    primary600: darken(0.1),
    primary700: darken(0.25),
    primary800: darken(0.4),
    primary900: darken(0.55),
    accent: lighten(0.3),
    accentLight: lighten(0.85),
    gradientFrom: lighten(0.7),
    gradientTo: lighten(0.95),
  };
}
