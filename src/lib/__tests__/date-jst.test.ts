import { describe, expect, test } from 'vitest';
import {
  formatDateKeyJST,
  daysBetween,
  jstStartOfMonth,
  jstEndOfMonth,
  parseJSTDate,
  parseJSTDateEnd,
  getDayOfWeekJaJST,
} from '../date-jst';

describe('formatDateKeyJST', () => {
  test('UTC 2024-01-15T00:00:00Z → JST 2024-01-15', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    expect(formatDateKeyJST(date)).toBe('2024-01-15');
  });

  test('UTC深夜はJSTでは翌日: 2024-01-14T15:00:00Z → JST 2024-01-15', () => {
    // UTC 15:00 + 9h = JST 翌日 00:00
    const date = new Date('2024-01-14T15:00:00Z');
    expect(formatDateKeyJST(date)).toBe('2024-01-15');
  });

  test('UTC 14:59 はまだJSTで同日: 2024-01-14T14:59:00Z → JST 2024-01-14', () => {
    const date = new Date('2024-01-14T14:59:00Z');
    expect(formatDateKeyJST(date)).toBe('2024-01-14');
  });

  test('年末の境界: 2024-12-31T15:00:00Z → JST 2025-01-01', () => {
    const date = new Date('2024-12-31T15:00:00Z');
    expect(formatDateKeyJST(date)).toBe('2025-01-01');
  });

  test('月のゼロパディング: 2024-03-05', () => {
    const date = new Date('2024-03-05T00:00:00Z');
    expect(formatDateKeyJST(date)).toBe('2024-03-05');
  });
});

describe('daysBetween', () => {
  test('同じ日時は1を返す（最小値1）', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(daysBetween(date, date)).toBe(1);
  });

  test('7日間の差は7', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const to = new Date('2024-01-08T00:00:00Z');
    expect(daysBetween(from, to)).toBe(7);
  });

  test('1ミリ秒の差でも最低1を返す', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-01T00:00:00.001Z');
    expect(daysBetween(from, to)).toBe(1);
  });

  test('30日間', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const to = new Date('2024-01-31T00:00:00Z');
    expect(daysBetween(from, to)).toBe(30);
  });
});

describe('jstStartOfMonth', () => {
  test('2024年1月の開始 → UTC 2023-12-31T15:00:00Z', () => {
    const result = jstStartOfMonth(2024, 1);
    expect(result.toISOString()).toBe('2023-12-31T15:00:00.000Z');
  });

  test('2024年7月の開始 → UTC 2024-06-30T15:00:00Z', () => {
    const result = jstStartOfMonth(2024, 7);
    expect(result.toISOString()).toBe('2024-06-30T15:00:00.000Z');
  });

  test('月は1ベース（month=12 → 12月）', () => {
    const result = jstStartOfMonth(2024, 12);
    expect(result.toISOString()).toBe('2024-11-30T15:00:00.000Z');
  });
});

describe('jstEndOfMonth', () => {
  test('2024年1月の末日 → JST 1月31日 23:59:59', () => {
    const result = jstEndOfMonth(2024, 1);
    // JST 2024-01-31 23:59:59 = UTC 2024-01-31 14:59:59
    expect(result.toISOString()).toBe('2024-01-31T14:59:59.000Z');
  });

  test('2024年2月（うるう年）の末日 → JST 2月29日', () => {
    const result = jstEndOfMonth(2024, 2);
    expect(result.toISOString()).toBe('2024-02-29T14:59:59.000Z');
  });

  test('2023年2月（平年）の末日 → JST 2月28日', () => {
    const result = jstEndOfMonth(2023, 2);
    expect(result.toISOString()).toBe('2023-02-28T14:59:59.000Z');
  });
});

describe('parseJSTDate', () => {
  test('YYYY-MM-DD → JST 00:00のUTC Date', () => {
    const result = parseJSTDate('2024-03-15');
    // JST 2024-03-15 00:00 = UTC 2024-03-14 15:00
    expect(result.toISOString()).toBe('2024-03-14T15:00:00.000Z');
  });
});

describe('parseJSTDateEnd', () => {
  test('YYYY-MM-DD → JST 23:59:59のUTC Date', () => {
    const result = parseJSTDateEnd('2024-03-15');
    // JST 2024-03-15 23:59:59 = UTC 2024-03-15 14:59:59
    expect(result.toISOString()).toBe('2024-03-15T14:59:59.000Z');
  });
});

describe('getDayOfWeekJaJST', () => {
  test('JST基準で曜日を返す', () => {
    // 2024-01-15 (月) JST = UTC 2024-01-14T15:00:00Z
    const monday = new Date('2024-01-14T15:00:00Z');
    expect(getDayOfWeekJaJST(monday)).toBe('月');
  });

  test('日曜日', () => {
    // 2024-01-14 (日) JST = UTC 2024-01-13T15:00:00Z
    const sunday = new Date('2024-01-13T15:00:00Z');
    expect(getDayOfWeekJaJST(sunday)).toBe('日');
  });
});
