import { describe, expect, test } from 'bun:test';
import { standContrastRows } from '../scripts/stand-contrast';
import { STAND_ORDER, STAND_PALETTES, standVars } from '../src/components/landing/stand/palettes';
import { THEME_PRESETS } from '../src/lib/themes';

describe('farm stand palettes', () => {
  test('one stand palette per app theme, in the app picker order', () => {
    expect(STAND_ORDER).toEqual(Object.keys(THEME_PRESETS) as typeof STAND_ORDER);
    expect(Object.keys(STAND_PALETTES).sort()).toEqual([...STAND_ORDER].sort());
  });

  test('every text, large-text and control pairing meets WCAG AA in every theme', () => {
    const misses = standContrastRows()
      .filter((r) => !r.pass)
      .map((r) => `${r.theme}: ${r.what} ${r.ratio.toFixed(2)}`);
    expect(misses).toEqual([]);
  });

  test('Rose Milk keeps the approved sample colors', () => {
    const v = standVars(STAND_PALETTES['my-melody']);
    expect(v['--fs-straw']).toBe('#F2789F');
    expect(v['--fs-board']).toBe('#2F4A3A');
    expect(v['--fs-candy-ink']).toBe('#D43F78');
    expect(v['--fs-berry']).toBe('#7A1F45');
    expect(v['--fs-gold']).toBe('#F6C75B');
    expect(v['--fs-wood']).toBe('#C98F5E');
    expect(v['--fs-counter']).toBe('#F7B6CB');
    expect(v['--fs-bl-pink-inner']).toBe('#F2789F');
  });
});
