import { describe, expect, test } from 'vitest';
import { getRank, getNextRank, getTimeSlotLabel, RANKS } from '../constants';

describe('getRank', () => {
  test('0件はルーキー', () => {
    expect(getRank(0).name).toBe('ルーキー');
  });

  test('境界値: 49件ルーキー → 50件ブロンズ', () => {
    expect(getRank(49).name).toBe('ルーキー');
    expect(getRank(50).name).toBe('ブロンズ');
  });

  test('境界値: 99件ブロンズ → 100件シルバー', () => {
    expect(getRank(99).name).toBe('ブロンズ');
    expect(getRank(100).name).toBe('シルバー');
  });

  test('境界値: 249件シルバー → 250件ゴールド', () => {
    expect(getRank(249).name).toBe('シルバー');
    expect(getRank(250).name).toBe('ゴールド');
  });

  test('境界値: 499件ゴールド → 500件プラチナ', () => {
    expect(getRank(499).name).toBe('ゴールド');
    expect(getRank(500).name).toBe('プラチナ');
  });

  test('境界値: 999件プラチナ → 1000件ダイヤモンド', () => {
    expect(getRank(999).name).toBe('プラチナ');
    expect(getRank(1000).name).toBe('ダイヤモンド');
  });

  test('境界値: 1999件ダイヤモンド → 2000件マスター', () => {
    expect(getRank(1999).name).toBe('ダイヤモンド');
    expect(getRank(2000).name).toBe('マスター');
  });

  test('境界値: 4999件マスター → 5000件レジェンド', () => {
    expect(getRank(4999).name).toBe('マスター');
    expect(getRank(5000).name).toBe('レジェンド');
  });

  test('大きな値でもレジェンド', () => {
    expect(getRank(100000).name).toBe('レジェンド');
  });

  test('全ランクの数は8段階', () => {
    expect(RANKS).toHaveLength(8);
  });
});

describe('getNextRank', () => {
  test('ルーキーの次はブロンズ', () => {
    expect(getNextRank(0)?.name).toBe('ブロンズ');
  });

  test('ブロンズの次はシルバー', () => {
    expect(getNextRank(50)?.name).toBe('シルバー');
  });

  test('レジェンド到達後はnull', () => {
    expect(getNextRank(5000)).toBeNull();
    expect(getNextRank(10000)).toBeNull();
  });

  test('各ランク境界の直前では現在のランクの次が返る', () => {
    expect(getNextRank(49)?.name).toBe('ブロンズ');
    expect(getNextRank(99)?.name).toBe('シルバー');
    expect(getNextRank(249)?.name).toBe('ゴールド');
  });
});

describe('getTimeSlotLabel', () => {
  test('0-11時は午前', () => {
    expect(getTimeSlotLabel(0)).toBe('午前');
    expect(getTimeSlotLabel(9)).toBe('午前');
    expect(getTimeSlotLabel(11)).toBe('午前');
  });

  test('12-16時は午後', () => {
    expect(getTimeSlotLabel(12)).toBe('午後');
    expect(getTimeSlotLabel(14)).toBe('午後');
    expect(getTimeSlotLabel(16)).toBe('午後');
  });

  test('17時以降は夕方', () => {
    expect(getTimeSlotLabel(17)).toBe('夕方');
    expect(getTimeSlotLabel(20)).toBe('夕方');
    expect(getTimeSlotLabel(23)).toBe('夕方');
  });
});
