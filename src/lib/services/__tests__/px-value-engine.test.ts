import { describe, expect, test } from 'vitest';
import { getPxRank } from '../px-value-engine';

describe('getPxRank', () => {
  test('70以上 → SSS', () => {
    expect(getPxRank(70)).toBe('SSS');
    expect(getPxRank(85)).toBe('SSS');
    expect(getPxRank(100)).toBe('SSS');
  });

  test('60-69.9 → S', () => {
    expect(getPxRank(60)).toBe('S');
    expect(getPxRank(69.9)).toBe('S');
  });

  test('50-59.9 → A', () => {
    expect(getPxRank(50)).toBe('A');
    expect(getPxRank(59.9)).toBe('A');
  });

  test('50未満 → B', () => {
    expect(getPxRank(49.9)).toBe('B');
    expect(getPxRank(0)).toBe('B');
    expect(getPxRank(-10)).toBe('B');
  });

  test('境界値: 69.9はS、70はSSS', () => {
    expect(getPxRank(69.9)).toBe('S');
    expect(getPxRank(70)).toBe('SSS');
  });

  test('境界値: 59.9はA、60はS', () => {
    expect(getPxRank(59.9)).toBe('A');
    expect(getPxRank(60)).toBe('S');
  });

  test('境界値: 49.9はB、50はA', () => {
    expect(getPxRank(49.9)).toBe('B');
    expect(getPxRank(50)).toBe('A');
  });
});
