/**
 * Kawaii Theme System
 *
 * Delightful, cute theme presets with customizable options.
 * Features soft pastels, playful accents, and dreamy gradients.
 */

import type { ThemeColors, ThemePreset, ThemeSettings } from '../types';
import { ranchUiFor, ranchUiVars, sceneKeyForPreset } from './ranchScenes';

// ============================================
// THEME PRESETS - Expanded Kawaii Collection
// ============================================

export const THEME_PRESETS: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  // Lavender Dream: lavender-field dusk
  default: {
    primary50: '#F7F2FC',
    primary100: '#EEE5F9',
    primary200: '#DDCCF3',
    primary300: '#C3A9EA',
    primary400: '#A584DD',
    primary500: '#8560C9',
    primary600: '#6C47B5',
    primary700: '#563797',
    primary800: '#3A2466',
    primary900: '#2B1A4F',
    accent: '#F2A7C3',
    accentLight: '#FBE4EC',
    gradientFrom: '#DDCCF3',
    gradientTo: '#F7F2FC',
  },

  // Rose Milk: strawberry-field sunrise
  'rose-milk': {
    primary50: '#FFF5F7',
    primary100: '#FDE8EE',
    primary200: '#FACFDB',
    primary300: '#F4A8BE',
    primary400: '#EA7E9D',
    primary500: '#C44A72',
    primary600: '#AE3860',
    primary700: '#8F2C4F',
    primary800: '#6E2440',
    primary900: '#4A1A2C',
    accent: '#FFC9A6',
    accentLight: '#FFEEE2',
    gradientFrom: '#FACFDB',
    gradientTo: '#FFF5F7',
  },

  // Midnight Grape: starry night
  'midnight-grape': {
    primary50: '#F3EFFF',
    primary100: '#E6DEFF',
    primary200: '#CDBEFF',
    primary300: '#B39CFF',
    primary400: '#9677F2',
    primary500: '#7556D6',
    primary600: '#6343C2',
    primary700: '#4E33A0',
    primary800: '#352470',
    primary900: '#1D1344',
    accent: '#FFD58A',
    accentLight: '#FFF1D6',
    gradientFrom: '#CDBEFF',
    gradientTo: '#F3EFFF',
  },

  // Cloud Nine: bright day by the pond
  'cloud-nine': {
    primary50: '#F2F8FD',
    primary100: '#E2EFFA',
    primary200: '#C4E0F6',
    primary300: '#97CBF0',
    primary400: '#63B0E6',
    primary500: '#2C7AB6',
    primary600: '#2170AE',
    primary700: '#1C5D93',
    primary800: '#184872',
    primary900: '#12324F',
    accent: '#F5C451',
    accentLight: '#FFF3D1',
    gradientFrom: '#C4E0F6',
    gradientTo: '#F2F8FD',
  },

  // Golden Hour: golden sunset over the wheat
  'golden-hour': {
    primary50: '#FFFAEE',
    primary100: '#FEF1D4',
    primary200: '#FCE1A6',
    primary300: '#F8CA6C',
    primary400: '#EFAE3E',
    primary500: '#A6680E',
    primary600: '#9A5A0C',
    primary700: '#7D480C',
    primary800: '#5E380C',
    primary900: '#3B2408',
    accent: '#F28C5B',
    accentLight: '#FDE4D5',
    gradientFrom: '#FCE1A6',
    gradientTo: '#FFFAEE',
  },

  // Fresh Mint: spring morning by the lily pond
  'fresh-mint': {
    primary50: '#F2FAF5',
    primary100: '#E1F3E8',
    primary200: '#C3E7D1',
    primary300: '#97D6B0',
    primary400: '#62BE8A',
    primary500: '#2C8457',
    primary600: '#24784F',
    primary700: '#1D5C44',
    primary800: '#18503B',
    primary900: '#143D2E',
    accent: '#FFE27A',
    accentLight: '#FFF6D1',
    gradientFrom: '#C3E7D1',
    gradientTo: '#F2FAF5',
  },

  // Maple Season: autumn afternoon in the maples
  maple: {
    primary50: '#FFF7F0',
    primary100: '#FDEBDC',
    primary200: '#FAD3B5',
    primary300: '#F5B384',
    primary400: '#EE8F52',
    primary500: '#C2551C',
    primary600: '#A84A18',
    primary700: '#8A3C16',
    primary800: '#6A3118',
    primary900: '#3A1F0F',
    accent: '#F2B13C',
    accentLight: '#FDEFCD',
    gradientFrom: '#FAD3B5',
    gradientTo: '#FFF7F0',
  },

  // Cocoa Dream: snowy winter evening
  'cocoa-dream': {
    primary50: '#FBF7F3',
    primary100: '#F4EAE2',
    primary200: '#E8D5C6',
    primary300: '#D6B8A2',
    primary400: '#BF967A',
    primary500: '#946A50',
    primary600: '#7E553F',
    primary700: '#6B3A2A',
    primary800: '#553528',
    primary900: '#3A2419',
    accent: '#FFC873',
    accentLight: '#FFF0D6',
    gradientFrom: '#E8D5C6',
    gradientTo: '#FBF7F3',
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
  'rose-milk': {
    name: 'Rose Milk',
    description: 'BooBoo the pig\'s sweet strawberry world',
    emoji: '🐷',
    mascot: '🐷',
  },
  'midnight-grape': {
    name: 'Midnight Grape',
    description: 'Shadow the bunny\'s starry night',
    emoji: '🌙',
    mascot: '🐰',
  },
  'cloud-nine': {
    name: 'Cloud Nine',
    description: 'Lilo the otter\'s sky blue dream',
    emoji: '🦦',
    mascot: '🦦',
  },
  'golden-hour': {
    name: 'Golden Hour',
    description: 'Sunshine the chick\'s golden world',
    emoji: '🐥',
    mascot: '🐥',
  },
  'fresh-mint': {
    name: 'Fresh Mint',
    description: 'Mochi the frog\'s cool green world',
    emoji: '🐸',
    mascot: '🐸',
  },
  'cocoa-dream': {
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
  'rose-milk': {
    pattern: 'hearts',
    floatingEmojis: ['🐷', '🌸', '💕', '🍓'],
  },
  'midnight-grape': {
    pattern: 'stars',
    floatingEmojis: ['🐰', '🌙', '💜', '⭐'],
  },
  'cloud-nine': {
    pattern: 'clouds',
    floatingEmojis: ['🦦', '☁️', '💙', '🌊'],
  },
  'golden-hour': {
    pattern: 'dots',
    floatingEmojis: ['🐥', '⭐', '💛', '🌻'],
  },
  'fresh-mint': {
    pattern: 'leaves',
    floatingEmojis: ['🐸', '🌿', '💚', '🍀'],
  },
  'cocoa-dream': {
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
  const decorations = getThemeDecorations(theme);
  root.dataset.pattern = decorations.pattern;

  // Ranch surfaces: the scene key plus the --ranch-* product tokens for this preset.
  root.dataset.scene = sceneKeyForPreset(theme.preset);
  for (const [name, value] of Object.entries(ranchUiVars(ranchUiFor(theme)))) {
    root.style.setProperty(name, value);
  }
}

/**
 * A saved theme in a shape this build can use.
 *
 * A preset id this build does not know (one renamed or retired since it was
 * saved) becomes the default theme, keeping the person's light or dark choice.
 */
export function normalizeTheme(saved: ThemeSettings | null | undefined): ThemeSettings {
  if (!saved || typeof saved !== 'object') {
    return { preset: 'default', darkMode: false };
  }
  const known =
    saved.preset === 'custom' || Object.prototype.hasOwnProperty.call(THEME_PRESETS, saved.preset);
  if (!known) return { ...saved, preset: 'default' };
  // Midnight Grape is the night itself, so it is never saved as a day theme.
  if (saved.preset === NIGHT_FACE && !saved.darkMode) return { ...saved, darkMode: true };
  return saved;
}

// ============================================
// DAY AND NIGHT: one tile, two faces
// ============================================

/**
 * Lavender Dream and Midnight Grape are one theme with two faces: Luna's
 * lavender dusk by day, Shadow's starry night after dark. Midnight Grape has no
 * tile of its own. The Day/Night switch is the way in, and it is a Pro perk:
 * without Pro, night on Lavender Dream is the plain dark mode.
 */
export const DAY_FACE = 'default';
export const NIGHT_FACE = 'midnight-grape';

type PresetId = Exclude<ThemePreset, 'custom'>;

/** The themes that get a tile in the picker, in display order. */
export const PICKER_PRESETS: ReadonlyArray<PresetId> = (
  Object.keys(THEME_PRESETS) as PresetId[]
).filter((preset) => preset !== NIGHT_FACE);

/** The preset a tile stands for right now. Only the Lavender Dream tile changes face. */
export function tileFace(tile: PresetId, darkMode: boolean, hasNightFace: boolean): PresetId {
  return tile === DAY_FACE && darkMode && hasNightFace ? NIGHT_FACE : tile;
}

/** The theme after the Day/Night switch is set. */
export function themeWithDarkMode(
  theme: ThemeSettings,
  darkMode: boolean,
  hasNightFace: boolean,
): ThemeSettings {
  if (theme.preset === DAY_FACE && darkMode && hasNightFace) {
    return { ...theme, preset: NIGHT_FACE, darkMode: true };
  }
  if (theme.preset === NIGHT_FACE && !darkMode) {
    return { ...theme, preset: DAY_FACE, darkMode: false };
  }
  return { ...theme, darkMode };
}

/** The theme after a tile is picked. */
export function themeWithTile(theme: ThemeSettings, tile: PresetId, hasNightFace: boolean): ThemeSettings {
  return { ...theme, preset: tileFace(tile, Boolean(theme.darkMode), hasNightFace) };
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
