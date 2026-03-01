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

/** タイトル別のサンプルデータ定義 */
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

export function generateDemoActionOutcomes(
  platformActions: PlatformActionRef[]
): Record<string, PlatformActionOutcome> {
  const result: Record<string, PlatformActionOutcome> = {}

  for (const pa of platformActions) {
    const data = DEMO_OUTCOMES[pa.title] ?? DEFAULT_DEMO_OUTCOME
    result[pa.id] = {
      ...data,
      platformActionId: pa.id,
    }
  }

  return result
}
