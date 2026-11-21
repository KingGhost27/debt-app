import { describe, expect, test } from 'bun:test';
import { BOARD_SLOTS, LANDING_SEED_ROWS, fillSlots, holdsOnlySample, isBlankRow, isSampleRow, withoutSampleRows } from '../src/lib/landingSeed';
import { FREE_LIMITS } from '../src/lib/tierLimits';

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

describe('the board shows every slot from the start', () => {
  const blank = () => ({ id: 'blank', name: '', balance: '', apr: '', minimumPayment: '' });

  test('the board never offers more slots than a free account holds', () => {
    expect(BOARD_SLOTS).toBeGreaterThan(LANDING_SEED_ROWS.length);
    expect(BOARD_SLOTS).toBeLessThanOrEqual(FREE_LIMITS.DEBTS);
  });

  test('a fresh board is the sample rows, then empty slots', () => {
    const board = fillSlots(sample, blank);
    expect(board).toHaveLength(BOARD_SLOTS);
    expect(board.slice(0, sample.length)).toEqual(sample);
    expect(board.slice(sample.length).every(isBlankRow)).toBe(true);
    expect(holdsOnlySample(board)).toBe(true);
  });

  test('two rows saved before this change come back as a full board, still the sample', () => {
    expect(holdsOnlySample(fillSlots(sample, blank))).toBe(true);
    expect(holdsOnlySample(sample)).toBe(true);
  });

  test('saved rows keep their order and are never dropped or reordered when topped up', () => {
    const typed = [
      { id: 'a', name: 'Visa', balance: '4200', apr: '22.9', minimumPayment: '110' },
      blank(),
      { id: 'c', name: 'Car', balance: '900', apr: '0', minimumPayment: '25' },
    ];
    const board = fillSlots(typed, blank);
    expect(board).toHaveLength(BOARD_SLOTS);
    expect(board.slice(0, 3)).toEqual(typed);
  });

  test('more saved rows than slots are cut to the slots', () => {
    const many = Array.from({ length: BOARD_SLOTS + 3 }, (_, i) => ({ id: `r${i}`, name: `Debt ${i}`, balance: '100', apr: '1', minimumPayment: '10' }));
    expect(fillSlots(many, blank)).toEqual(many.slice(0, BOARD_SLOTS));
  });

  test('typing in any slot, or changing a sample, ends the sample state', () => {
    const board = fillSlots(sample, blank);
    expect(holdsOnlySample(board.map((r, i) => (i === 3 ? { ...r, name: 'Visa' } : r)))).toBe(false);
    expect(holdsOnlySample(board.map((r, i) => (i === 0 ? { ...r, balance: '1' } : r)))).toBe(false);
    expect(holdsOnlySample(board.map((r, i) => (i === 1 ? blank() : r)))).toBe(false);
  });

  test('a row is blank only when every field is empty', () => {
    expect(isBlankRow(blank())).toBe(true);
    expect(isBlankRow({ ...blank(), apr: '0' })).toBe(false);
    expect(isBlankRow({ ...blank(), name: ' ' })).toBe(false);
  });

  test('empty slots and untouched samples never count as rows the visitor typed', () => {
    const board = fillSlots(sample, blank);
    expect(withoutSampleRows(board).every(isBlankRow)).toBe(true);
  });
});
