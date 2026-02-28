/**
 * Kawaii Theme System
 *
 * Delightful, cute theme presets with customizable options.
 * Features soft pastels, playful accents, and dreamy gradients.
 */

import type { ThemeColors, ThemePreset, ThemeSettings } from '../types';

// ============================================
// THEME PRESETS - Expanded Kawaii Collection
// ============================================

export const THEME_PRESETS: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  // Default: Soft Lavender Dream
  default: {
    primary50: '#faf5ff',
    primary100: '#f3e8ff',
    primary200: '#e9d5ff',
    primary300: '#d8b4fe',
    primary400: '#c084fc',
    primary500: '#a855f7',
    primary600: '#9333ea',
    primary700: '#7e22ce',
    primary800: '#6b21a8',
    primary900: '#581c87',
    accent: '#f0abfc',
    accentLight: '#fae8ff',
    gradientFrom: '#e9d5ff',
    gradientTo: '#faf5ff',
  },

  // Rose Milk: Strawberry Pink
  'my-melody': {
    primary50: '#fff0f3',
    primary100: '#ffe4e9',
    primary200: '#ffccd7',
    primary300: '#ffa3b8',
    primary400: '#ff7096',
    primary500: '#ff4778',
    primary600: '#ed1c5a',
    primary700: '#c80d48',
    primary800: '#a70f41',
    primary900: '#8c113c',
    accent: '#ffb7c5',
    accentLight: '#fff0f3',
    gradientFrom: '#ffccd7',
    gradientTo: '#fff0f3',
  },

  // Midnight Grape: Deep Indigo-Violet
  kuromi: {
    primary50: '#f0edff',
    primary100: '#e0d9ff',
    primary200: '#c4b5ff',
    primary300: '#a38bff',
    primary400: '#7c5cf6',
    primary500: '#5b21b6',
    primary600: '#4c1d95',
    primary700: '#3b1578',
    primary800: '#2c0f5e',
    primary900: '#1a0a3d',
    accent: '#a78bfa',
    accentLight: '#ede9fe',
    gradientFrom: '#c4b5ff',
    gradientTo: '#f0edff',
  },

  // Cloud Nine: Sky Blue
  cinnamoroll: {
    primary50: '#f0f9ff',
    primary100: '#e0f2fe',
    primary200: '#bae6fd',
    primary300: '#7dd3fc',
    primary400: '#38bdf8',
    primary500: '#0ea5e9',
    primary600: '#0284c7',
    primary700: '#0369a1',
    primary800: '#075985',
    primary900: '#0c4a6e',
    accent: '#7dd3fc',
    accentLight: '#e0f2fe',
    gradientFrom: '#bae6fd',
    gradientTo: '#f0f9ff',
  },

  // Golden Hour: Yellow/Gold
  pompompurin: {
    primary50: '#fffbeb',
    primary100: '#fef3c7',
    primary200: '#fde68a',
    primary300: '#fcd34d',
    primary400: '#fbbf24',
    primary500: '#f59e0b',
    primary600: '#d97706',
    primary700: '#b45309',
    primary800: '#92400e',
    primary900: '#78350f',
    accent: '#fcd34d',
    accentLight: '#fef3c7',
    gradientFrom: '#fde68a',
    gradientTo: '#fffbeb',
  },

  // Cherry Pop: True Cherry Red
  'hello-kitty': {
    primary50: '#fff1f2',
    primary100: '#ffe4e6',
    primary200: '#fecdd3',
    primary300: '#fda4af',
    primary400: '#fb7185',
    primary500: '#f43f5e',
    primary600: '#e11d48',
    primary700: '#be123c',
    primary800: '#9f1239',
    primary900: '#881337',
    accent: '#fda4af',
    accentLight: '#ffe4e6',
    gradientFrom: '#fecdd3',
    gradientTo: '#fff1f2',
  },

  // Fresh Mint: Green
  keroppi: {
    primary50: '#ecfdf5',
    primary100: '#d1fae5',
    primary200: '#a7f3d0',
    primary300: '#6ee7b7',
    primary400: '#34d399',
    primary500: '#10b981',
    primary600: '#059669',
    primary700: '#047857',
    primary800: '#065f46',
    primary900: '#064e3b',
    accent: '#6ee7b7',
    accentLight: '#d1fae5',
    gradientFrom: '#a7f3d0',
    gradientTo: '#ecfdf5',
  },

  // Maple: Warm Orange
  maple: {
    primary50: '#fff7ed',
    primary100: '#ffedd5',
    primary200: '#fed7aa',
    primary300: '#fdba74',
    primary400: '#fb923c',
    primary500: '#f97316',
    primary600: '#ea580c',
    primary700: '#c2410c',
    primary800: '#9a3412',
    primary900: '#7c2d12',
    accent: '#fdba74',
    accentLight: '#ffedd5',
    gradientFrom: '#fed7aa',
    gradientTo: '#fff7ed',
  },

  // Cocoa Dream: Brown/Mocha
  chococat: {
    primary50: '#fdf8f6',
    primary100: '#f2e8e5',
    primary200: '#eaddd7',
    primary300: '#e0cec7',
    primary400: '#d2bab0',
    primary500: '#c69f94',
    primary600: '#a47c6d',
    primary700: '#8c6458',
    primary800: '#755248',
    primary900: '#5f443c',
    accent: '#e0cec7',
    accentLight: '#f2e8e5',
    gradientFrom: '#eaddd7',
    gradientTo: '#fdf8f6',
  },
};

// ============================================
// THEME METADATA (for UI display)
// ============================================

export const THEME_METADATA: Record<Exclude<ThemePreset, 'custom'>, {
  name: string;
  description: string;
  emoji: string;
  mascot?: string;
}> = {
  default: {
    name: 'Lavender Dream',
    description: 'Luna the bunny\'s dreamy purple world',
    emoji: '🐰',
    mascot: '🐰',
  },
  'my-melody': {
    name: 'Rose Milk',
    description: 'BooBoo the pig\'s sweet strawberry world',
    emoji: '🐷',
    mascot: '🐷',
  },
  kuromi: {
    name: 'Midnight Grape',
    description: 'Luna\'s mysterious deep violet night',
    emoji: '🌙',
    mascot: '🐰',
  },
  cinnamoroll: {
    name: 'Cloud Nine',
    description: 'Lilo the otter\'s sky blue dream',
    emoji: '🦦',
    mascot: '🦦',
  },
  pompompurin: {
    name: 'Golden Hour',
    description: 'Sunshine the chick\'s golden world',
    emoji: '🐥',
    mascot: '🐥',
  },
  'hello-kitty': {
    name: 'Cherry Pop',
    description: 'BooBoo\'s bold cherry red side',
    emoji: '🍒',
    mascot: '🐷',
  },
  keroppi: {
    name: 'Fresh Mint',
    description: 'Mochi the frog\'s cool green world',
    emoji: '🐸',
    mascot: '🐸',
  },
  chococat: {
    name: 'Cocoa Dream',
    description: 'Chai the bear\'s cozy mocha corner',
    emoji: '🐻',
    mascot: '🐻',
  },
  maple: {
    name: 'Maple Season',
    description: 'Maple the fox\'s warm autumn world',
    emoji: '🦊',
    mascot: '🦊',
  },
};

// ============================================
// DECORATIVE ELEMENTS
// ============================================

export const THEME_DECORATIONS: Record<Exclude<ThemePreset, 'custom'>, {
  pattern: 'stars' | 'hearts' | 'clouds' | 'flowers' | 'dots' | 'sparkles' | 'leaves' | 'beans' | 'maple-leaves';
  floatingEmojis: string[];
}> = {
  default: {
    pattern: 'sparkles',
    floatingEmojis: ['🐰', '💜', '✨', '🌙'],
  },
  'my-melody': {
    pattern: 'hearts',
    floatingEmojis: ['🐷', '🌸', '💕', '🍓'],
  },
  kuromi: {
    pattern: 'stars',
    floatingEmojis: ['🐰', '🌙', '💜', '⭐'],
  },
  cinnamoroll: {
    pattern: 'clouds',
    floatingEmojis: ['🦦', '☁️', '💙', '🌊'],
  },
  pompompurin: {
    pattern: 'dots',
    floatingEmojis: ['🐥', '⭐', '💛', '🌻'],
  },
  'hello-kitty': {
    pattern: 'flowers',
    floatingEmojis: ['🐷', '🍒', '❤️', '🌹'],
  },
  keroppi: {
    pattern: 'leaves',
    floatingEmojis: ['🐸', '🌿', '💚', '🍀'],
  },
  chococat: {
    pattern: 'beans',
    floatingEmojis: ['🐻', '☕', '🤎', '🍂'],
  },
  maple: {
    pattern: 'maple-leaves',
    floatingEmojis: ['🦊', '🍁', '🧡', '🌻'],
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

  // Apply dark mode class and gradient adjustments
  if (theme.darkMode) {
    root.classList.add('dark');
    // Override gradient colors for dark mode (darker versions)
    root.style.setProperty('--theme-gradient-from', colors.primary800);
    root.style.setProperty('--theme-gradient-to', colors.primary900);
  } else {
    root.classList.remove('dark');
    // Restore light mode gradients
    root.style.setProperty('--theme-gradient-from', colors.gradientFrom);
    root.style.setProperty('--theme-gradient-to', colors.gradientTo);
  }

  // Set decoration pattern as data attribute
  const decorations = theme.preset !== 'custom'
    ? THEME_DECORATIONS[theme.preset as Exclude<ThemePreset, 'custom'>]
    : THEME_DECORATIONS.default;
  root.dataset.pattern = decorations.pattern;
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
 * Get decorations for a theme
 */
export function getThemeDecorations(theme: ThemeSettings) {
  if (theme.preset === 'custom') {
    return THEME_DECORATIONS.default;
  }
  return THEME_DECORATIONS[theme.preset as Exclude<ThemePreset, 'custom'>] || THEME_DECORATIONS.default;
}

/**
 * Generate a complete ThemeColors object from a base color
 * Useful for custom theme creation with a single primary color
 */
export function generateThemeFromColor(baseColor: string): ThemeColors {
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
