import { describe, expect, test } from 'bun:test';
import {
  THEME_METADATA,
  THEME_PRESETS,
  getThemeColors,
  getThemeDecorations,
  normalizeTheme,
} from '../src/lib/themes';
import { RANCH_SCENES, sceneKeyForPreset } from '../src/lib/ranchScenes';
import { FREE_THEMES } from '../src/lib/tierLimits';
import type { ThemePreset, ThemeSettings } from '../src/types';

const IDS = Object.keys(THEME_PRESETS) as Array<Exclude<ThemePreset, 'custom'>>;
/** Ids a profile might still hold from an older build, plus names that live on Object.prototype. */
const UNKNOWN = ['a-theme-from-an-older-build', '', 'toString', 'constructor', '__proto__'];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '-');

describe('theme ids', () => {
  test('every id is built from our own theme name', () => {
    for (const id of IDS) {
      if (id === 'default') continue;
      expect([id, slug(THEME_METADATA[id].name).startsWith(id)]).toEqual([id, true]);
    }
  });

  test('colors, picker text and ranch scenes all cover the same themes', () => {
    expect(Object.keys(THEME_METADATA).sort()).toEqual([...IDS].sort());
    expect(Object.keys(RANCH_SCENES).sort()).toEqual([...IDS].sort());
    for (const id of FREE_THEMES) expect(IDS).toContain(id as (typeof IDS)[number]);
  });
});

describe('normalizeTheme', () => {
  test('keeps every theme this build knows, and custom colors', () => {
    for (const preset of [...IDS, 'custom' as const]) {
      const saved: ThemeSettings = { preset, darkMode: true };
      expect(normalizeTheme(saved)).toBe(saved);
    }
  });

  test('a saved id this build does not know becomes the default theme, light or dark kept', () => {
    for (const preset of UNKNOWN) {
      for (const darkMode of [true, false]) {
        expect(normalizeTheme({ preset, darkMode } as unknown as ThemeSettings)).toEqual({
          preset: 'default',
          darkMode,
        });
      }
    }
  });

  test('no saved theme at all is the default, light', () => {
    for (const saved of [null, undefined]) {
      expect(normalizeTheme(saved)).toEqual({ preset: 'default', darkMode: false });
    }
  });

  test('an unknown id can never leave a lookup empty', () => {
    // normalizeTheme is the gate for odd names; these lookups see ordinary unknown ids.
    for (const preset of ['a-theme-from-an-older-build', '']) {
      const theme = { preset, darkMode: false } as unknown as ThemeSettings;
      expect(getThemeColors(theme)).toBe(THEME_PRESETS.default);
      expect(getThemeDecorations(theme)).toBeDefined();
      expect(sceneKeyForPreset(preset as ThemePreset)).toBe('default');
    }
  });
});
