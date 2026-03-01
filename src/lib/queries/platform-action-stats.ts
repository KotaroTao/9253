import { prisma } from "@/lib/prisma"

/**
 * プラットフォームアクション別の他院実績集計
 *
 * 各プラットフォームアクションについて、有効な完了クリニックの
 * 満足度改善幅と経営指標変化の平均値を返す。
 *
 * ■ 採用条件（満足度集計・経営指標共通）
 *   - completionReason が "established" or "uncertain"（"suspended" = 中断は除外）
 *   - 実施期間が30日以上
 *   - baselineScore と resultScore の両方が存在（満足度集計のみ）
 *   - 開始月・完了月の両方に経営データが存在（経営指標のみ）
 *
 * ■ 表示条件
 *   - 有効完了 3院以上で表示（MIN_CLINICS_FOR_DISPLAY）
 *   - 5院以上で信頼度「高」バッジ（MIN_CLINICS_HIGH_CONFIDENCE）
 */

/** 表示に必要な最低完了院数 */
export const MIN_CLINICS_FOR_DISPLAY = 3
/** 信頼度「高」の閾値 */
export const MIN_CLINICS_HIGH_CONFIDENCE = 5
/** 最低実施日数 */
const MIN_DURATION_DAYS = 30

export interface PlatformActionOutcome {
  platformActionId: string
  /** 有効完了クリニック数（中断・短期間を除く） */
  qualifiedCount: number
  /** 導入クリニック数（active + completed + cancelled） */
  adoptCount: number
  /** 満足度スコアの平均改善幅 (resultScore - baselineScore) */
  avgScoreImprovement: number | null
  /** 経営指標の平均変化（完了アクションの開始月→完了月） */
  avgRevenueChangePct: number | null
  avgPatientCountChange: number | null
  avgCancelRateChangePt: number | null
  /** 経営指標比較に使えたクリニック数 */
  metricsClinicCount: number
  /** 平均実施期間（日数）— 有効完了アクションのみ */
  avgDurationDays: number | null
  /** 定着率（%）— completionReason="established" の割合 */
  establishedRate: number | null
  /** 信頼度レベル: "high" (5院以上) | "moderate" (3-4院) | "insufficient" (2院以下) */
  confidence: "high" | "moderate" | "insufficient"
}

export async function getPlatformActionOutcomes(
  platformActionIds: string[]
): Promise<Record<string, PlatformActionOutcome>> {
  if (platformActionIds.length === 0) return {}

  // 全プラットフォームアクションに紐づく改善アクションを一括取得
  const allActions = await prisma.improvementAction.findMany({
    where: {
      platformActionId: { in: platformActionIds },
    },
    select: {
      platformActionId: true,
      clinicId: true,
      status: true,
      baselineScore: true,
      resultScore: true,
      completionReason: true,
      startedAt: true,
      completedAt: true,
    },
  })

  // platformActionId ごとにグループ化
  const grouped = new Map<string, typeof allActions>()
  for (const a of allActions) {
    if (!a.platformActionId) continue
    const list = grouped.get(a.platformActionId) ?? []
    list.push(a)
    grouped.set(a.platformActionId, list)
  }

  // 有効完了の判定: suspended除外 + 30日以上実施
  function isQualifiedCompletion(a: (typeof allActions)[0]): boolean {
    if (a.status !== "completed" || !a.completedAt) return false
    if (a.completionReason === "suspended") return false
    const days = Math.floor(
      (new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days >= MIN_DURATION_DAYS
  }

  // 経営指標取得に必要なclinicIdを収集（有効完了アクションのみ）
  const qualifiedActions = allActions.filter(isQualifiedCompletion)
  const clinicIds = Array.from(new Set(qualifiedActions.map((a) => a.clinicId)))

  // 関連クリニックの全経営指標を一括取得
  const metricsMap = new Map<string, Array<{
    year: number
    month: number
    totalRevenue: number | null
    totalPatientCount: number | null
    cancellationCount: number | null
    totalVisitCount: number | null
  }>>()

  if (clinicIds.length > 0) {
    const metrics = await prisma.monthlyClinicMetrics.findMany({
      where: { clinicId: { in: clinicIds } },
      select: {
        clinicId: true,
        year: true,
        month: true,
        totalRevenue: true,
        totalPatientCount: true,
        cancellationCount: true,
        totalVisitCount: true,
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    })
    for (const m of metrics) {
      const list = metricsMap.get(m.clinicId) ?? []
      list.push(m)
      metricsMap.set(m.clinicId, list)
    }
  }

  // 信頼度レベル判定
  function getConfidence(count: number): PlatformActionOutcome["confidence"] {
    if (count >= MIN_CLINICS_HIGH_CONFIDENCE) return "high"
    if (count >= MIN_CLINICS_FOR_DISPLAY) return "moderate"
    return "insufficient"
  }

  // 各プラットフォームアクションの集計
  const result: Record<string, PlatformActionOutcome> = {}

  for (const paId of platformActionIds) {
    const actions = grouped.get(paId) ?? []
    const qualified = actions.filter(isQualifiedCompletion)

    // 満足度改善（両スコアがある有効完了のみ）
    const withScores = qualified.filter(
      (a) => a.baselineScore != null && a.resultScore != null
    )
    const avgScoreImprovement =
      withScores.length > 0
        ? Math.round(
            (withScores.reduce(
              (sum, a) => sum + (a.resultScore! - a.baselineScore!),
              0
            ) /
              withScores.length) *
              100
          ) / 100
        : null

    // 経営指標変化
    const revChanges: number[] = []
    const patientChanges: number[] = []
    const cancelRateChanges: number[] = []

    for (const a of qualified) {
      if (!a.completedAt) continue
      const clinicMetrics = metricsMap.get(a.clinicId)
      if (!clinicMetrics || clinicMetrics.length < 2) continue

      const startDate = new Date(a.startedAt)
      const endDate = new Date(a.completedAt)
      const startYear = startDate.getFullYear()
      const startMonth = startDate.getMonth() + 1
      const endYear = endDate.getFullYear()
      const endMonth = endDate.getMonth() + 1

      const startMetric = clinicMetrics.find(
        (m) => m.year === startYear && m.month === startMonth
      )
      const endMetric = clinicMetrics.find(
        (m) => m.year === endYear && m.month === endMonth
      )
      if (!startMetric || !endMetric) continue
      if (startMetric === endMetric) continue

      // 売上変化率
      if (startMetric.totalRevenue != null && endMetric.totalRevenue != null && startMetric.totalRevenue > 0) {
        revChanges.push(
          ((endMetric.totalRevenue - startMetric.totalRevenue) / startMetric.totalRevenue) * 100
        )
      }
      // 実人数変化
      if (startMetric.totalPatientCount != null && endMetric.totalPatientCount != null) {
        patientChanges.push(endMetric.totalPatientCount - startMetric.totalPatientCount)
      }
      // キャンセル率変化
      const startCR =
        startMetric.cancellationCount != null && startMetric.totalVisitCount
          ? (startMetric.cancellationCount / startMetric.totalVisitCount) * 100
          : null
      const endCR =
        endMetric.cancellationCount != null && endMetric.totalVisitCount
          ? (endMetric.cancellationCount / endMetric.totalVisitCount) * 100
          : null
      if (startCR != null && endCR != null) {
        cancelRateChanges.push(endCR - startCR)
      }
    }

    const avg = (arr: number[]) =>
      arr.length > 0
        ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
        : null

    const qualifiedCount = qualified.length

    // 平均実施期間（日数）
    const durations = qualified
      .filter((a) => a.completedAt)
      .map((a) =>
        Math.floor(
          (new Date(a.completedAt!).getTime() - new Date(a.startedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    const avgDurationDays =
      durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : null

    // 定着率: completionReason="established" の割合
    const establishedCount = qualified.filter((a) => a.completionReason === "established").length
    const establishedRate =
      qualifiedCount > 0
        ? Math.round((establishedCount / qualifiedCount) * 100)
        : null

    result[paId] = {
      platformActionId: paId,
      qualifiedCount,
      adoptCount: actions.length,
      avgScoreImprovement,
      avgRevenueChangePct: avg(revChanges),
      avgPatientCountChange: avg(patientChanges),
      avgCancelRateChangePt: avg(cancelRateChanges),
      metricsClinicCount: Math.max(revChanges.length, patientChanges.length, cancelRateChanges.length),
      avgDurationDays,
      establishedRate,
      confidence: getConfidence(qualifiedCount),
    }
  }

  return result
}
