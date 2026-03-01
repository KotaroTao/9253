import { prisma } from "@/lib/prisma"

/**
 * プラットフォームアクション別の他院実績集計
 *
 * 各プラットフォームアクションについて、完了済みクリニックの
 * 満足度改善幅と経営指標変化の平均値を返す。
 */

export interface PlatformActionOutcome {
  platformActionId: string
  /** 完了クリニック数 */
  completedCount: number
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

  // 経営指標取得に必要なclinicIdを収集（完了アクションのみ）
  const completedActions = allActions.filter(
    (a) => a.status === "completed" && a.completedAt
  )
  const clinicIds = Array.from(new Set(completedActions.map((a) => a.clinicId)))

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

  // 各プラットフォームアクションの集計
  const result: Record<string, PlatformActionOutcome> = {}

  for (const paId of platformActionIds) {
    const actions = grouped.get(paId) ?? []
    const completed = actions.filter((a) => a.status === "completed")

    // 満足度改善
    const withScores = completed.filter(
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
    let revChanges: number[] = []
    let patientChanges: number[] = []
    let cancelRateChanges: number[] = []

    for (const a of completed) {
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

    result[paId] = {
      platformActionId: paId,
      completedCount: completed.length,
      adoptCount: actions.length,
      avgScoreImprovement,
      avgRevenueChangePct: avg(revChanges),
      avgPatientCountChange: avg(patientChanges),
      avgCancelRateChangePt: avg(cancelRateChanges),
      metricsClinicCount: Math.max(revChanges.length, patientChanges.length, cancelRateChanges.length),
    }
  }

  return result
}
