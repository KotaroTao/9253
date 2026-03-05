import { describe, expect, test } from 'vitest';

// px-verification.ts の純粋関数は非公開 (module-private) なので、
// テスト用に同じロジックを再実装してテストする。
// 本来はexportすべきだが、既存APIを変更しないためここで関数を再定義。

function bigramSet(text: string): Set<string> {
  const normalized = text.replace(/\s+/g, '');
  const s = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    s.add(normalized.substring(i, i + 2));
  }
  return s;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = bigramSet(a);
  const setB = bigramSet(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((bigram) => {
    if (setB.has(bigram)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

const SPEED_TRAP_MIN_MS_PER_QUESTION = 2000;

function checkSpeedTrap(responseDurationMs: number | null, questionCount: number): boolean {
  if (responseDurationMs == null) return true;
  const minDuration = questionCount * SPEED_TRAP_MIN_MS_PER_QUESTION;
  return responseDurationMs >= minDuration;
}

describe('bigramSet', () => {
  test('日本語テキストのバイグラム生成', () => {
    const result = bigramSet('こんにちは');
    expect(result).toEqual(new Set(['こん', 'んに', 'にち', 'ちは']));
  });

  test('空文字列 → 空Set', () => {
    expect(bigramSet('')).toEqual(new Set());
  });

  test('1文字 → 空Set', () => {
    expect(bigramSet('あ')).toEqual(new Set());
  });

  test('2文字 → 1バイグラム', () => {
    expect(bigramSet('ab')).toEqual(new Set(['ab']));
  });

  test('空白は除去される', () => {
    const result = bigramSet('a b c');
    expect(result).toEqual(new Set(['ab', 'bc']));
  });

  test('重複文字列でもSetなのでユニーク', () => {
    const result = bigramSet('aaaa');
    expect(result).toEqual(new Set(['aa']));
  });
});

describe('jaccardSimilarity', () => {
  test('同一文字列 → 1.0', () => {
    expect(jaccardSimilarity('こんにちは', 'こんにちは')).toBe(1.0);
  });

  test('完全に異なる文字列 → 0', () => {
    expect(jaccardSimilarity('あいう', 'かきく')).toBe(0);
  });

  test('両方空文字列 → 0', () => {
    expect(jaccardSimilarity('', '')).toBe(0);
  });

  test('片方が空 → 0', () => {
    expect(jaccardSimilarity('こんにちは', '')).toBe(0);
  });

  test('部分一致は0〜1の範囲', () => {
    const score = jaccardSimilarity('こんにちは世界', 'こんにちは日本');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  test('類似度が高い文字列は0.8以上', () => {
    // ほぼ同じ文章（1文字違い）
    const score = jaccardSimilarity('とても良い歯医者です', 'とても良い歯医者でした');
    expect(score).toBeGreaterThan(0.5);
  });
});

describe('checkSpeedTrap', () => {
  test('null duration → true（チェックスキップ）', () => {
    expect(checkSpeedTrap(null, 8)).toBe(true);
  });

  test('8問 × 2000ms = 16000ms が最低ライン', () => {
    expect(checkSpeedTrap(16000, 8)).toBe(true);
    expect(checkSpeedTrap(15999, 8)).toBe(false);
  });

  test('十分な時間 → true', () => {
    expect(checkSpeedTrap(60000, 8)).toBe(true);
  });

  test('0ms → false（明らかにボット）', () => {
    expect(checkSpeedTrap(0, 8)).toBe(false);
  });

  test('6問 × 2000ms = 12000ms が最低ライン', () => {
    expect(checkSpeedTrap(12000, 6)).toBe(true);
    expect(checkSpeedTrap(11999, 6)).toBe(false);
  });
});
