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

// ---------------------------------------------------------------------------
// Lavender Dream by day, Midnight Grape by night (a Pro perk)
// ---------------------------------------------------------------------------
import {
  DAY_FACE,
  NIGHT_FACE,
  PICKER_PRESETS,
  themeWithDarkMode,
  themeWithTile,
  tileFace,
} from '../src/lib/themes';
import { FRIENDS, barnHerd } from '../src/components/ranch/friends';
import type { RanchFriend } from '../src/lib/ranchScenes';

const BOTH = [true, false];

describe('picker tiles', () => {
  test('seven tiles, and Midnight Grape has none of its own', () => {
    expect(PICKER_PRESETS).toHaveLength(7);
    expect(PICKER_PRESETS).toContain(DAY_FACE);
    expect(PICKER_PRESETS).not.toContain(NIGHT_FACE);
    expect([...PICKER_PRESETS, NIGHT_FACE].sort()).toEqual([...IDS].sort());
  });

  test('only the Lavender Dream tile changes face, and only at night with Pro', () => {
    for (const tile of PICKER_PRESETS) {
      for (const night of BOTH) {
        for (const pro of BOTH) {
          const expected = tile === DAY_FACE && night && pro ? NIGHT_FACE : tile;
          expect([tile, night, pro, tileFace(tile, night, pro)]).toEqual([tile, night, pro, expected]);
        }
      }
    }
  });

  test('each blurb names the friend its scene draws', () => {
    for (const id of IDS) {
      expect([id, THEME_METADATA[id].description.includes(RANCH_SCENES[id].friendName)]).toEqual([id, true]);
    }
  });
});

describe('the Day/Night switch', () => {
  const day = (preset: ThemePreset): ThemeSettings => ({ preset, darkMode: false });

  test('with Pro, Lavender Dream becomes Midnight Grape at night and comes back by day', () => {
    const night = themeWithDarkMode(day(DAY_FACE), true, true);
    expect(night).toEqual({ preset: NIGHT_FACE, darkMode: true });
    expect(THEME_METADATA[night.preset as typeof NIGHT_FACE].name).toBe('Midnight Grape');
    const back = themeWithDarkMode(night, false, true);
    expect(back).toEqual({ preset: DAY_FACE, darkMode: false });
    expect(THEME_METADATA[back.preset as typeof DAY_FACE].name).toBe('Lavender Dream');
  });

  test('without Pro, night on Lavender Dream is the plain dark mode, as before', () => {
    expect(themeWithDarkMode(day(DAY_FACE), true, false)).toEqual({ preset: DAY_FACE, darkMode: true });
  });

  test('every other theme only flips dark mode', () => {
    for (const preset of [...PICKER_PRESETS.filter((p) => p !== DAY_FACE), 'custom' as const]) {
      for (const pro of BOTH) {
        expect(themeWithDarkMode(day(preset), true, pro)).toEqual({ preset, darkMode: true });
        expect(themeWithDarkMode({ preset, darkMode: true }, false, pro)).toEqual({ preset, darkMode: false });
      }
    }
  });

  test('night then day always lands back where it started', () => {
    for (const preset of [...PICKER_PRESETS, 'custom' as const]) {
      for (const pro of BOTH) {
        const there = themeWithDarkMode(day(preset), true, pro);
        expect(themeWithDarkMode(there, false, pro)).toEqual(day(preset));
      }
    }
  });

  test('someone left on Midnight Grape without Pro can still switch back to day', () => {
    expect(themeWithDarkMode({ preset: NIGHT_FACE, darkMode: true }, false, false)).toEqual(day(DAY_FACE));
  });

  test('custom colors survive the switch', () => {
    const custom: ThemeSettings = { preset: 'custom', darkMode: false, customColors: THEME_PRESETS.maple };
    expect(themeWithDarkMode(custom, true, true)).toEqual({ ...custom, darkMode: true });
  });
});

describe('picking a tile', () => {
  test('without Pro no tile ever gives Midnight Grape', () => {
    for (const tile of PICKER_PRESETS) {
      for (const darkMode of BOTH) {
        expect(themeWithTile({ preset: 'maple', darkMode }, tile, false).preset).toBe(tile);
      }
    }
  });

  test('with Pro the Lavender Dream tile gives Midnight Grape at night and Lavender Dream by day', () => {
    expect(themeWithTile({ preset: 'maple', darkMode: true }, DAY_FACE, true)).toEqual({
      preset: NIGHT_FACE,
      darkMode: true,
    });
    expect(themeWithTile({ preset: 'maple', darkMode: false }, DAY_FACE, true)).toEqual({
      preset: DAY_FACE,
      darkMode: false,
    });
  });

  test('Midnight Grape is never produced as a day theme', () => {
    for (const from of [...IDS, 'custom' as const]) {
      for (const fromDark of BOTH) {
        for (const pro of BOTH) {
          const start: ThemeSettings = { preset: from, darkMode: fromDark };
          const results = [
            themeWithDarkMode(start, true, pro),
            themeWithDarkMode(start, false, pro),
            ...PICKER_PRESETS.map((tile) => themeWithTile(start, tile, pro)),
          ];
          for (const r of results) {
            if (r.preset === NIGHT_FACE) expect([from, fromDark, pro, r.darkMode]).toEqual([from, fromDark, pro, true]);
          }
        }
      }
    }
  });

  test('a profile saved on Midnight Grape in day mode loads as night', () => {
    expect(normalizeTheme({ preset: NIGHT_FACE, darkMode: false })).toEqual({ preset: NIGHT_FACE, darkMode: true });
    expect(normalizeTheme({ preset: NIGHT_FACE })).toEqual({ preset: NIGHT_FACE, darkMode: true });
  });
});

describe('the barn', () => {
  const everyone = Object.keys(FRIENDS) as RanchFriend[];

  test('eight friends, one per scene', () => {
    expect(everyone).toHaveLength(8);
    expect(IDS.map((id) => RANCH_SCENES[id].friend).sort()).toEqual([...everyone].sort());
  });

  test('whoever walks, the other seven are all seated once: one in the loft, three behind, three in front', () => {
    for (const active of everyone) {
      const { loft, back, front } = barnHerd(active);
      expect(back).toHaveLength(3);
      expect(front).toHaveLength(3);
      const seated = [loft, ...back, ...front];
      expect(new Set(seated).size).toBe(7);
      expect(seated).not.toContain(active);
      expect([...seated, active].sort()).toEqual([...everyone].sort());
    }
  });
});
