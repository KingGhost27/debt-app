import { describe, expect, test } from 'bun:test';
import { LANDING_SEED_ROWS, isSampleRow, withoutSampleRows } from '../src/lib/landingSeed';

// Drafts as the home page stores them: ids plus string fields.
const sample = LANDING_SEED_ROWS.map((row, i) => ({ id: `seed-${i}`, ...row }));

describe('signup handoff skips the home page sample rows', () => {
  test('an untouched board imports nothing', () => {
    expect(withoutSampleRows(sample)).toEqual([]);
  });

  test('one edited row and one untouched row: only the edited one imports', () => {
    const edited = { ...sample[0], balance: '3000' };
    expect(withoutSampleRows([edited, sample[1]])).toEqual([edited]);
  });

  test('restored drafts the visitor edited all import', () => {
    const restored = [
      { id: 'a', name: 'Visa', balance: '4200', apr: '22.9', minimumPayment: '110' },
      { ...sample[1], name: 'Car' },
      { id: 'c', name: '', balance: '900', apr: '0', minimumPayment: '25' },
    ];
    expect(withoutSampleRows(restored)).toEqual(restored);
  });

  test('a row only counts as a sample when every field matches', () => {
    expect(isSampleRow(LANDING_SEED_ROWS[0])).toBe(true);
    expect(isSampleRow({ ...LANDING_SEED_ROWS[0], apr: '24.0' })).toBe(false);
    expect(isSampleRow({ ...LANDING_SEED_ROWS[1], name: 'car loan' })).toBe(false);
  });

  test('a sample row in another position is still skipped', () => {
    const typed = { id: 'x', name: 'Store card', balance: '650', apr: '29.9', minimumPayment: '35' };
    expect(withoutSampleRows([typed, sample[1], sample[0]])).toEqual([typed]);
  });
});
