import type { PlatformActionOutcome } from "@/lib/queries/platform-action-stats"

/**
 * デモクリニック用の他院実績サンプルデータを生成
 *
 * デモクリニック（slug: demo-dental）でのみ使用。
 * 実際のクロスクリニックデータが蓄積されていない状態でも
 * 「他院実績」欄の表示イメージを確認できるようにする。
 */

interface PlatformActionRef {
  id: string
  title: string
}

/** タイトル別のサンプルデータ定義（プラットフォームアクション用） */
const DEMO_OUTCOMES: Record<string, Omit<PlatformActionOutcome, "platformActionId">> = {
  "待ち時間の見える化と声がけ": {
    qualifiedCount: 8,
    adoptCount: 12,
    avgScoreImprovement: 0.42,
    avgRevenueChangePct: 3.2,
    avgPatientCountChange: 18,
    avgCancelRateChangePt: -1.3,
    metricsClinicCount: 6,
    avgDurationDays: 75,
    establishedRate: 75,
    confidence: "high",
  },
  "受付マニュアルの作成と研修": {
    qualifiedCount: 6,
    adoptCount: 9,
    avgScoreImprovement: 0.35,
    avgRevenueChangePct: 2.1,
    avgPatientCountChange: 12,
    avgCancelRateChangePt: -0.8,
    metricsClinicCount: 5,
    avgDurationDays: 90,
    establishedRate: 83,
    confidence: "high",
  },
  "痛みへの配慮を言語化して伝える": {
    qualifiedCount: 5,
    adoptCount: 7,
    avgScoreImprovement: 0.38,
    avgRevenueChangePct: 1.5,
    avgPatientCountChange: 8,
    avgCancelRateChangePt: -0.5,
    metricsClinicCount: 4,
    avgDurationDays: 60,
    establishedRate: 80,
    confidence: "high",
  },
  "フォローアップ体制の強化": {
    qualifiedCount: 4,
    adoptCount: 6,
    avgScoreImprovement: 0.31,
    avgRevenueChangePct: 4.8,
    avgPatientCountChange: 15,
    avgCancelRateChangePt: -2.1,
    metricsClinicCount: 3,
    avgDurationDays: 105,
    establishedRate: 75,
    confidence: "moderate",
  },
  "視覚資料を活用した治療説明": {
    qualifiedCount: 3,
    adoptCount: 5,
    avgScoreImprovement: 0.28,
    avgRevenueChangePct: 2.8,
    avgPatientCountChange: 10,
    avgCancelRateChangePt: -0.6,
    metricsClinicCount: 3,
    avgDurationDays: 85,
    establishedRate: 67,
    confidence: "moderate",
  },
}

/** 提案カード用のサンプルデータ（タイトル → outcome） */
const DEMO_SUGGESTION_OUTCOMES: Record<string, Omit<PlatformActionOutcome, "platformActionId">> = {
  // clinic_environment
  "待合室の清掃チェックリスト導入": {
    qualifiedCount: 5, adoptCount: 8, avgScoreImprovement: 0.22,
    avgRevenueChangePct: 1.2, avgPatientCountChange: 5, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 4, avgDurationDays: 45, establishedRate: 80, confidence: "high",
  },
  "院内BGM・アロマの見直し": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.18,
    avgRevenueChangePct: 0.8, avgPatientCountChange: 3, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 30, establishedRate: 75, confidence: "moderate",
  },
  "掲示物・インテリアの更新": {
    qualifiedCount: 3, adoptCount: 5, avgScoreImprovement: 0.15,
    avgRevenueChangePct: 0.5, avgPatientCountChange: 2, avgCancelRateChangePt: -0.1,
    metricsClinicCount: 3, avgDurationDays: 40, establishedRate: 67, confidence: "moderate",
  },
  "院内の動線と導線サインの改善": {
    qualifiedCount: 3, adoptCount: 4, avgScoreImprovement: 0.20,
    avgRevenueChangePct: 1.0, avgPatientCountChange: 4, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 55, establishedRate: 67, confidence: "moderate",
  },
  "トイレ・洗面台の快適化": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.16,
    avgRevenueChangePct: 0.6, avgPatientCountChange: 3, avgCancelRateChangePt: -0.1,
    metricsClinicCount: 3, avgDurationDays: 35, establishedRate: 75, confidence: "moderate",
  },
  // reception
  "受付時の笑顔と挨拶を徹底": {
    qualifiedCount: 7, adoptCount: 10, avgScoreImprovement: 0.40,
    avgRevenueChangePct: 2.5, avgPatientCountChange: 14, avgCancelRateChangePt: -0.9,
    metricsClinicCount: 5, avgDurationDays: 60, establishedRate: 86, confidence: "high",
  },
  "患者情報の事前確認で待機時間短縮": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.25,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 8, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 3, avgDurationDays: 50, establishedRate: 75, confidence: "moderate",
  },
  "受付の第一声を統一する": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.30,
    avgRevenueChangePct: 1.8, avgPatientCountChange: 10, avgCancelRateChangePt: -0.6,
    metricsClinicCount: 4, avgDurationDays: 45, establishedRate: 80, confidence: "high",
  },
  "会計時のお見送り声がけの徹底": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.22,
    avgRevenueChangePct: 1.2, avgPatientCountChange: 6, avgCancelRateChangePt: -0.4,
    metricsClinicCount: 3, avgDurationDays: 40, establishedRate: 75, confidence: "moderate",
  },
  // wait_time
  "予約枠の見直しと時間管理": {
    qualifiedCount: 6, adoptCount: 9, avgScoreImprovement: 0.45,
    avgRevenueChangePct: 3.5, avgPatientCountChange: 20, avgCancelRateChangePt: -1.5,
    metricsClinicCount: 5, avgDurationDays: 90, establishedRate: 83, confidence: "high",
  },
  "待合室の快適性向上": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.20,
    avgRevenueChangePct: 1.0, avgPatientCountChange: 5, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 4, avgDurationDays: 50, establishedRate: 80, confidence: "high",
  },
  "急患対応用バッファ枠の確保": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.35,
    avgRevenueChangePct: 2.0, avgPatientCountChange: 10, avgCancelRateChangePt: -1.0,
    metricsClinicCount: 3, avgDurationDays: 60, establishedRate: 75, confidence: "moderate",
  },
  "待ち時間の有効活用コンテンツ": {
    qualifiedCount: 3, adoptCount: 4, avgScoreImprovement: 0.15,
    avgRevenueChangePct: 0.5, avgPatientCountChange: 3, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 45, establishedRate: 67, confidence: "moderate",
  },
  // hearing
  "初診ヒアリングシートの改善": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.32,
    avgRevenueChangePct: 2.0, avgPatientCountChange: 10, avgCancelRateChangePt: -0.7,
    metricsClinicCount: 4, avgDurationDays: 65, establishedRate: 80, confidence: "high",
  },
  "カウンセリング時間の確保": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.28,
    avgRevenueChangePct: 1.8, avgPatientCountChange: 8, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 3, avgDurationDays: 55, establishedRate: 75, confidence: "moderate",
  },
  "主訴以外の潜在ニーズの確認": {
    qualifiedCount: 3, adoptCount: 5, avgScoreImprovement: 0.22,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 6, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 3, avgDurationDays: 50, establishedRate: 67, confidence: "moderate",
  },
  "患者の生活背景に寄り添う問診": {
    qualifiedCount: 3, adoptCount: 4, avgScoreImprovement: 0.20,
    avgRevenueChangePct: 1.2, avgPatientCountChange: 5, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 60, establishedRate: 67, confidence: "moderate",
  },
  "ヒアリング内容の申し送り徹底": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.25,
    avgRevenueChangePct: 1.3, avgPatientCountChange: 7, avgCancelRateChangePt: -0.4,
    metricsClinicCount: 3, avgDurationDays: 70, establishedRate: 75, confidence: "moderate",
  },
  // explanation
  "視覚資料を活用した説明": {
    qualifiedCount: 3, adoptCount: 5, avgScoreImprovement: 0.28,
    avgRevenueChangePct: 2.8, avgPatientCountChange: 10, avgCancelRateChangePt: -0.6,
    metricsClinicCount: 3, avgDurationDays: 85, establishedRate: 67, confidence: "moderate",
  },
  "治療計画書の書面交付": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.30,
    avgRevenueChangePct: 2.5, avgPatientCountChange: 12, avgCancelRateChangePt: -0.8,
    metricsClinicCount: 3, avgDurationDays: 75, establishedRate: 75, confidence: "moderate",
  },
  "説明後の理解度確認": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.26,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 8, avgCancelRateChangePt: -0.4,
    metricsClinicCount: 4, avgDurationDays: 45, establishedRate: 80, confidence: "high",
  },
  "治療の選択肢を複数提示する": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.32,
    avgRevenueChangePct: 3.0, avgPatientCountChange: 11, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 3, avgDurationDays: 60, establishedRate: 75, confidence: "moderate",
  },
  "治療前の「今日やること」宣言": {
    qualifiedCount: 6, adoptCount: 8, avgScoreImprovement: 0.35,
    avgRevenueChangePct: 1.8, avgPatientCountChange: 9, avgCancelRateChangePt: -0.6,
    metricsClinicCount: 5, avgDurationDays: 35, establishedRate: 83, confidence: "high",
  },
  // cost_explanation
  "費用の事前説明と選択肢の提示": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.33,
    avgRevenueChangePct: 3.5, avgPatientCountChange: 12, avgCancelRateChangePt: -0.7,
    metricsClinicCount: 4, avgDurationDays: 70, establishedRate: 80, confidence: "high",
  },
  "費用に関するパンフレット作成": {
    qualifiedCount: 3, adoptCount: 5, avgScoreImprovement: 0.20,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 6, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 3, avgDurationDays: 50, establishedRate: 67, confidence: "moderate",
  },
  "会計時の明細説明を丁寧に": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.22,
    avgRevenueChangePct: 1.0, avgPatientCountChange: 5, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 40, establishedRate: 75, confidence: "moderate",
  },
  "自費治療の費用をオープンに提示": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.28,
    avgRevenueChangePct: 4.2, avgPatientCountChange: 8, avgCancelRateChangePt: -0.4,
    metricsClinicCount: 3, avgDurationDays: 55, establishedRate: 75, confidence: "moderate",
  },
  "分割払い・デンタルローンの案内整備": {
    qualifiedCount: 3, adoptCount: 4, avgScoreImprovement: 0.15,
    avgRevenueChangePct: 2.5, avgPatientCountChange: 4, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 45, establishedRate: 67, confidence: "moderate",
  },
  // comfort
  "質問しやすい雰囲気づくり": {
    qualifiedCount: 6, adoptCount: 8, avgScoreImprovement: 0.36,
    avgRevenueChangePct: 2.0, avgPatientCountChange: 12, avgCancelRateChangePt: -0.8,
    metricsClinicCount: 5, avgDurationDays: 55, establishedRate: 83, confidence: "high",
  },
  "患者の不安に寄り添う声がけ研修": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.30,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 8, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 3, avgDurationDays: 75, establishedRate: 75, confidence: "moderate",
  },
  "相談専用の時間・チャネルを用意": {
    qualifiedCount: 3, adoptCount: 4, avgScoreImprovement: 0.18,
    avgRevenueChangePct: 1.0, avgPatientCountChange: 5, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 3, avgDurationDays: 60, establishedRate: 67, confidence: "moderate",
  },
  "目線を合わせて話す習慣づけ": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.28,
    avgRevenueChangePct: 1.2, avgPatientCountChange: 7, avgCancelRateChangePt: -0.4,
    metricsClinicCount: 4, avgDurationDays: 40, establishedRate: 80, confidence: "high",
  },
  "治療後の「まとめ」を3点で伝える": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.25,
    avgRevenueChangePct: 1.0, avgPatientCountChange: 6, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 3, avgDurationDays: 35, establishedRate: 75, confidence: "moderate",
  },
  // pain_care
  "痛みのシグナルルールの導入": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.35,
    avgRevenueChangePct: 1.2, avgPatientCountChange: 7, avgCancelRateChangePt: -0.4,
    metricsClinicCount: 4, avgDurationDays: 40, establishedRate: 80, confidence: "high",
  },
  "最新の痛み軽減技術の導入": {
    qualifiedCount: 3, adoptCount: 5, avgScoreImprovement: 0.40,
    avgRevenueChangePct: 2.5, avgPatientCountChange: 10, avgCancelRateChangePt: -0.7,
    metricsClinicCount: 3, avgDurationDays: 90, establishedRate: 67, confidence: "moderate",
  },
  "治療中のこまめな声かけの標準化": {
    qualifiedCount: 6, adoptCount: 8, avgScoreImprovement: 0.32,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 9, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 5, avgDurationDays: 45, establishedRate: 83, confidence: "high",
  },
  "治療後の痛みケア説明の徹底": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.25,
    avgRevenueChangePct: 1.0, avgPatientCountChange: 5, avgCancelRateChangePt: -0.3,
    metricsClinicCount: 3, avgDurationDays: 50, establishedRate: 75, confidence: "moderate",
  },
  // staff_courtesy
  "接遇マナー研修の定期実施": {
    qualifiedCount: 7, adoptCount: 10, avgScoreImprovement: 0.38,
    avgRevenueChangePct: 2.8, avgPatientCountChange: 15, avgCancelRateChangePt: -1.0,
    metricsClinicCount: 5, avgDurationDays: 85, establishedRate: 86, confidence: "high",
  },
  "スタッフ間の声がけ・チームワーク強化": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.25,
    avgRevenueChangePct: 1.5, avgPatientCountChange: 8, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 3, avgDurationDays: 60, establishedRate: 75, confidence: "moderate",
  },
  "患者名での呼びかけを徹底": {
    qualifiedCount: 6, adoptCount: 8, avgScoreImprovement: 0.30,
    avgRevenueChangePct: 1.8, avgPatientCountChange: 10, avgCancelRateChangePt: -0.6,
    metricsClinicCount: 5, avgDurationDays: 40, establishedRate: 83, confidence: "high",
  },
  "担当衛生士制の導入": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.35,
    avgRevenueChangePct: 3.0, avgPatientCountChange: 12, avgCancelRateChangePt: -1.2,
    metricsClinicCount: 3, avgDurationDays: 100, establishedRate: 75, confidence: "moderate",
  },
  "患者の前でスタッフを紹介・称賛する": {
    qualifiedCount: 3, adoptCount: 4, avgScoreImprovement: 0.18,
    avgRevenueChangePct: 0.8, avgPatientCountChange: 4, avgCancelRateChangePt: -0.2,
    metricsClinicCount: 3, avgDurationDays: 35, establishedRate: 67, confidence: "moderate",
  },
  // loyalty
  "患者の期待を超える「+α」の体験設計": {
    qualifiedCount: 4, adoptCount: 6, avgScoreImprovement: 0.40,
    avgRevenueChangePct: 3.5, avgPatientCountChange: 15, avgCancelRateChangePt: -1.0,
    metricsClinicCount: 3, avgDurationDays: 80, establishedRate: 75, confidence: "moderate",
  },
  "治療のビフォーアフターを共有する": {
    qualifiedCount: 5, adoptCount: 7, avgScoreImprovement: 0.32,
    avgRevenueChangePct: 2.5, avgPatientCountChange: 12, avgCancelRateChangePt: -0.8,
    metricsClinicCount: 4, avgDurationDays: 55, establishedRate: 80, confidence: "high",
  },
  "家族ぐるみで通える医院づくり": {
    qualifiedCount: 3, adoptCount: 5, avgScoreImprovement: 0.22,
    avgRevenueChangePct: 2.0, avgPatientCountChange: 8, avgCancelRateChangePt: -0.5,
    metricsClinicCount: 3, avgDurationDays: 90, establishedRate: 67, confidence: "moderate",
  },
  "患者とのリレーション強化": {
    qualifiedCount: 4, adoptCount: 5, avgScoreImprovement: 0.28,
    avgRevenueChangePct: 1.8, avgPatientCountChange: 10, avgCancelRateChangePt: -0.7,
    metricsClinicCount: 3, avgDurationDays: 65, establishedRate: 75, confidence: "moderate",
  },
  "通院の成果を定期的にフィードバック": {
    qualifiedCount: 5, adoptCount: 6, avgScoreImprovement: 0.30,
    avgRevenueChangePct: 2.2, avgPatientCountChange: 11, avgCancelRateChangePt: -0.8,
    metricsClinicCount: 4, avgDurationDays: 50, establishedRate: 80, confidence: "high",
  },
}

/** タイトルに一致しないアクション用のデフォルト値 */
const DEFAULT_DEMO_OUTCOME: Omit<PlatformActionOutcome, "platformActionId"> = {
  qualifiedCount: 3,
  adoptCount: 4,
  avgScoreImprovement: 0.25,
  avgRevenueChangePct: 1.8,
  avgPatientCountChange: 7,
  avgCancelRateChangePt: -0.4,
  metricsClinicCount: 3,
  avgDurationDays: 70,
  establishedRate: 67,
  confidence: "moderate",
}

/** プラットフォームアクション用のデモ実績データを生成 */
export function generateDemoActionOutcomes(
  platformActions: PlatformActionRef[]
): Record<string, PlatformActionOutcome> {
  const result: Record<string, PlatformActionOutcome> = {}

  for (const pa of platformActions) {
    const data = DEMO_OUTCOMES[pa.title] ?? DEMO_SUGGESTION_OUTCOMES[pa.title] ?? DEFAULT_DEMO_OUTCOME
    result[pa.id] = {
      ...data,
      platformActionId: pa.id,
    }
  }

  return result
}

/**
 * 提案カード用のデモ実績データを取得（タイトルベース）
 * suggestionOutcomeMap で platformAction とマッチしない提案にも
 * サンプルデータを表示するために使用
 */
export function getDemoSuggestionOutcome(
  title: string
): PlatformActionOutcome | null {
  const data = DEMO_SUGGESTION_OUTCOMES[title] ?? DEMO_OUTCOMES[title]
  if (!data) return null
  return {
    ...data,
    platformActionId: `demo-${title}`,
  }
}
