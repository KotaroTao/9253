import { describe, expect, test } from 'vitest';
import { classifySegment } from '../px-segmentation';

describe('classifySegment', () => {
  // --- 入力なし / null ---
  test('null → general', () => {
    expect(classifySegment(null)).toBe('general');
  });

  test('undefined → general', () => {
    expect(classifySegment(undefined)).toBe('general');
  });

  test('空オブジェクト → general', () => {
    expect(classifySegment({})).toBe('general');
  });

  // --- 新フォーマット (insuranceType + purpose) ---
  describe('新フォーマット', () => {
    test('emergency → emergency', () => {
      expect(classifySegment({ insuranceType: 'insurance', purpose: 'emergency' })).toBe(
        'emergency',
      );
    });

    test('自費のemergency → emergency（insuranceTypeに関係なし）', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'emergency' })).toBe(
        'emergency',
      );
    });

    test('periodontal → maintenance', () => {
      expect(classifySegment({ insuranceType: 'insurance', purpose: 'periodontal' })).toBe(
        'maintenance',
      );
    });

    test('checkup_insurance → maintenance', () => {
      expect(classifySegment({ insuranceType: 'insurance', purpose: 'checkup_insurance' })).toBe(
        'maintenance',
      );
    });

    test('self_pay_cleaning → maintenance', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'self_pay_cleaning' })).toBe(
        'maintenance',
      );
    });

    test('self_pay + implant → highValue', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'implant' })).toBe('highValue');
    });

    test('self_pay + wire_orthodontics → highValue', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'wire_orthodontics' })).toBe(
        'highValue',
      );
    });

    test('self_pay + aligner → highValue', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'aligner' })).toBe('highValue');
    });

    test('self_pay + whitening → highValue', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'whitening' })).toBe(
        'highValue',
      );
    });

    test('self_pay + prosthetic_self_pay → highValue', () => {
      expect(classifySegment({ insuranceType: 'self_pay', purpose: 'prosthetic_self_pay' })).toBe(
        'highValue',
      );
    });

    test('insurance + implant → general（保険でインプラントはhighValueにならない）', () => {
      expect(classifySegment({ insuranceType: 'insurance', purpose: 'implant' })).toBe('general');
    });

    test('insurance + cavity_treatment → general', () => {
      expect(classifySegment({ insuranceType: 'insurance', purpose: 'cavity_treatment' })).toBe(
        'general',
      );
    });

    test('self_pay + cavity_treatment_self → general（自費でも一般治療はgeneral）', () => {
      expect(
        classifySegment({ insuranceType: 'self_pay', purpose: 'cavity_treatment_self' }),
      ).toBe('general');
    });
  });

  // --- レガシーフォーマット (chiefComplaint + treatmentType) ---
  describe('レガシーフォーマット', () => {
    test('pain → emergency', () => {
      expect(classifySegment({ chiefComplaint: 'pain' })).toBe('emergency');
    });

    test('checkup → maintenance', () => {
      expect(classifySegment({ treatmentType: 'checkup' })).toBe('maintenance');
    });

    test('prevention → maintenance', () => {
      expect(classifySegment({ chiefComplaint: 'prevention' })).toBe('maintenance');
    });

    test('orthodontics → highValue', () => {
      expect(classifySegment({ chiefComplaint: 'orthodontics' })).toBe('highValue');
    });

    test('cosmetic → highValue', () => {
      expect(classifySegment({ chiefComplaint: 'cosmetic' })).toBe('highValue');
    });

    test('denture_implant → highValue', () => {
      expect(classifySegment({ chiefComplaint: 'denture_implant' })).toBe('highValue');
    });

    test('filling_crown → general', () => {
      expect(classifySegment({ chiefComplaint: 'filling_crown' })).toBe('general');
    });
  });
});
