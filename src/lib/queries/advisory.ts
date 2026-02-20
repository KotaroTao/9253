import { prisma } from "@/lib/prisma"
import { ADVISORY } from "@/lib/constants"
import { jstDaysAgo } from "@/lib/date-jst"
import { getQuestionBreakdownByDays, getDashboardStats, getDailyTrend, getPurposeSatisfaction } from "@/lib/queries/stats"
import type { ClinicSettings, AdvisoryReportData, AdvisoryProgress, AdvisorySection } from "@/types"

/**
 * AI Advisory のプログレス情報を取得
 */
export async function getAdvisoryProgress(clinicId: string): Promise<AdvisoryProgress> {
  const [clinic, lastReport, totalResponses] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    }),
    prisma.advisoryReport.findFirst({
      where: { clinicId },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.surveyResponse.count({ where: { clinicId } }),
  ])

  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const threshold = settings.advisoryThreshold ?? ADVISORY.DEFAULT_THRESHOLD
  const current = settings.responsesSinceLastAdvisory ?? 0

  let daysSinceLastReport: number | null = null
  if (lastReport) {
    const now = new Date()
    daysSinceLastReport = Math.floor(
      (now.getTime() - new Date(lastReport.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  const canGenerate =
    totalResponses >= ADVISORY.MIN_RESPONSES_FOR_FIRST &&
    (current >= threshold ||
      (daysSinceLastReport !== null && daysSinceLastReport >= ADVISORY.SCHEDULED_INTERVAL_DAYS) ||
      (!lastReport && totalResponses >= ADVISORY.MIN_RESPONSES_FOR_FIRST))

  const lastReportData: AdvisoryReportData | null = lastReport
    ? {
        id: lastReport.id,
        triggerType: lastReport.triggerType,
        responseCount: lastReport.responseCount,
        sections: lastReport.sections as unknown as AdvisorySection[],
        summary: lastReport.summary,
        priority: lastReport.priority,
        generatedAt: lastReport.generatedAt.toISOString(),
      }
    : null

  return {
    current,
    threshold,
    percentage: Math.min(Math.round((current / threshold) * 100), 100),
    totalResponses,
    lastReport: lastReportData,
    canGenerate,
    daysSinceLastReport,
  }
}

/**
 * AI Advisory レポート一覧を取得
 */
export async function getAdvisoryReports(
  clinicId: string,
  limit: number = 10
): Promise<AdvisoryReportData[]> {
  const reports = await prisma.advisoryReport.findMany({
    where: { clinicId },
    orderBy: { generatedAt: "desc" },
    take: limit,
  })

  return reports.map((r) => ({
    id: r.id,
    triggerType: r.triggerType,
    responseCount: r.responseCount,
    sections: r.sections as unknown as AdvisorySection[],
    summary: r.summary,
    priority: r.priority,
    generatedAt: r.generatedAt.toISOString(),
  }))
}

/**
 * AI分析のためのデータ収集
 */
async function collectAnalysisData(clinicId: string) {
  const [stats, questionBreakdown, dailyTrend, purposeSatisfaction, recentComments, activeActions] =
    await Promise.all([
      getDashboardStats(clinicId),
      getQuestionBreakdownByDays(clinicId, 30),
      getDailyTrend(clinicId, 30),
      getPurposeSatisfaction(clinicId, 30),
      prisma.surveyResponse.findMany({
        where: {
          clinicId,
          freeText: { not: null },
          respondedAt: { gte: jstDaysAgo(30) },
        },
        select: { freeText: true, overallScore: true },
        orderBy: { respondedAt: "desc" },
        take: 50,
      }),
      prisma.improvementAction.findMany({
        where: { clinicId, status: "active" },
        select: { title: true, targetQuestion: true, baselineScore: true },
      }),
    ])

  return { stats, questionBreakdown, dailyTrend, purposeSatisfaction, recentComments, activeActions }
}

/**
 * 分析データからAIレポートを生成（ルールベース）
 * 注: 将来的にはClaude APIを使用する予定。現在はルールベースで分析を生成。
 */
export async function generateAdvisoryReport(
  clinicId: string,
  triggerType: "threshold" | "scheduled" | "manual"
): Promise<AdvisoryReportData> {
  const data = await collectAnalysisData(clinicId)
  const { stats, questionBreakdown, dailyTrend, purposeSatisfaction, recentComments, activeActions } = data

  const sections: AdvisorySection[] = []

  // 1. 総合評価
  const scoreLabel =
    stats.averageScore >= 4.5 ? "非常に高い" :
    stats.averageScore >= 4.0 ? "良好" :
    stats.averageScore >= 3.5 ? "標準的" :
    stats.averageScore >= 3.0 ? "改善の余地あり" : "早急な改善が必要"

  let trendText = ""
  if (stats.prevAverageScore !== null) {
    const delta = Math.round((stats.averageScore - stats.prevAverageScore) * 10) / 10
    if (delta > 0) trendText = `前月比 +${delta}ポイントの上昇傾向です。`
    else if (delta < 0) trendText = `前月比 ${delta}ポイントの低下傾向です。改善施策の検討をお勧めします。`
    else trendText = "前月と同水準を維持しています。"
  }

  sections.push({
    title: "総合評価",
    content: `現在の患者満足度スコアは ${stats.averageScore.toFixed(1)} で、${scoreLabel}水準です。${trendText}総回答数は ${stats.totalResponses}件です。`,
    type: "summary",
  })

  // 2. 強み分析
  const strengths: string[] = []
  for (const template of questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore >= 4.5 && q.count >= 5) {
        strengths.push(`「${q.text}」(${q.avgScore.toFixed(1)}点)`)
      }
    }
  }
  if (strengths.length > 0) {
    sections.push({
      title: "強み",
      content: `以下の項目で高い評価を得ています: ${strengths.slice(0, 5).join("、")}。これらの強みを維持し、患者さまへの訴求ポイントとして活用しましょう。`,
      type: "strength",
    })
  }

  // 3. 改善ポイント
  const improvements: Array<{ text: string; score: number }> = []
  for (const template of questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore > 0 && q.avgScore < 4.0 && q.count >= 3) {
        improvements.push({ text: q.text, score: q.avgScore })
      }
    }
  }
  improvements.sort((a, b) => a.score - b.score)

  if (improvements.length > 0) {
    const top = improvements.slice(0, 3)
    const items = top.map((i) => `「${i.text}」(${i.score.toFixed(1)}点)`).join("、")
    sections.push({
      title: "改善ポイント",
      content: `以下の項目でスコアが低めです: ${items}。特に最もスコアの低い「${top[0].text}」への対策を優先的に検討してください。`,
      type: "improvement",
    })
  }

  // 4. トレンド分析
  if (dailyTrend.length >= 7) {
    const recentWeek = dailyTrend.slice(-7)
    const prevWeek = dailyTrend.length >= 14 ? dailyTrend.slice(-14, -7) : null

    const recentAvg =
      recentWeek.filter((d) => d.avgScore !== null).reduce((sum, d) => sum + (d.avgScore ?? 0), 0) /
      Math.max(recentWeek.filter((d) => d.avgScore !== null).length, 1)
    const recentCount = recentWeek.reduce((sum, d) => sum + d.count, 0)

    let trendAnalysis = `直近1週間の回答数は${recentCount}件、平均スコアは${recentAvg.toFixed(1)}点です。`

    if (prevWeek) {
      const prevAvg =
        prevWeek.filter((d) => d.avgScore !== null).reduce((sum, d) => sum + (d.avgScore ?? 0), 0) /
        Math.max(prevWeek.filter((d) => d.avgScore !== null).length, 1)
      const prevCount = prevWeek.reduce((sum, d) => sum + d.count, 0)

      if (recentAvg > prevAvg + 0.1) {
        trendAnalysis += `前週(${prevAvg.toFixed(1)}点)から上昇しており、良い傾向です。`
      } else if (recentAvg < prevAvg - 0.1) {
        trendAnalysis += `前週(${prevAvg.toFixed(1)}点)から低下しています。原因の特定が必要です。`
      }

      if (recentCount > prevCount) {
        trendAnalysis += `回答数も前週(${prevCount}件)から増加しています。`
      } else if (recentCount < prevCount * 0.7) {
        trendAnalysis += `回答数が前週(${prevCount}件)から減少しています。アンケート配布を促進しましょう。`
      }
    }

    sections.push({
      title: "トレンド分析",
      content: trendAnalysis,
      type: "trend",
    })
  }

  // 5. 推奨アクション
  const actions: string[] = []

  if (improvements.length > 0 && activeActions.length === 0) {
    actions.push(`最もスコアの低い「${improvements[0].text}」に対する改善アクションを登録しましょう。`)
  }

  if (purposeSatisfaction.length > 0) {
    const lowPurpose = purposeSatisfaction.filter((p) => p.avgScore < 3.5 && p.count >= 3)
    if (lowPurpose.length > 0) {
      actions.push(`「${lowPurpose[0].purpose}」の患者満足度が${lowPurpose[0].avgScore.toFixed(1)}点と低めです。診療プロセスの見直しを検討してください。`)
    }
  }

  const negativeComments = recentComments.filter((c) => c.overallScore !== null && c.overallScore < 3)
  if (negativeComments.length >= 3) {
    actions.push(`低スコア(3点未満)の回答が${negativeComments.length}件あります。フリーテキストのコメントを確認し、具体的な不満を把握しましょう。`)
  }

  const positiveComments = recentComments.filter((c) => c.overallScore !== null && c.overallScore >= 4.5 && c.freeText)
  if (positiveComments.length >= 5) {
    actions.push(`高スコアの回答に${positiveComments.length}件のコメントが寄せられています。スタッフのモチベーション向上に活用しましょう。`)
  }

  if (activeActions.length > 0) {
    actions.push(`現在${activeActions.length}件の改善アクションが進行中です。効果をモニタリングし、スコアの変化を確認しましょう。`)
  }

  if (actions.length === 0) {
    actions.push("現在の患者満足度は良好です。アンケート回答数を増やし、より精度の高い分析を目指しましょう。")
  }

  sections.push({
    title: "推奨アクション",
    content: actions.join("\n"),
    type: "action",
  })

  // サマリー
  const priority = improvements.length > 0 ? improvements[0].text : null
  const summary =
    stats.averageScore >= 4.0
      ? `患者満足度は${scoreLabel}水準（${stats.averageScore.toFixed(1)}点）です。${improvements.length > 0 ? `「${improvements[0].text}」の改善に取り組むことでさらなる向上が期待できます。` : "現在の水準を維持しましょう。"}`
      : `患者満足度は${stats.averageScore.toFixed(1)}点で${scoreLabel}です。${improvements.length > 0 ? `「${improvements[0].text}」への対策を最優先で進めてください。` : "改善施策の検討をお勧めします。"}`

  // DBに保存
  const report = await prisma.advisoryReport.create({
    data: {
      clinicId,
      triggerType,
      responseCount: stats.totalResponses,
      sections: JSON.parse(JSON.stringify(sections)),
      summary,
      priority,
    },
  })

  // カウンターリセット
  const patch = JSON.stringify({ responsesSinceLastAdvisory: 0 })
  await prisma.$executeRaw`
    UPDATE clinics SET settings = settings || ${patch}::jsonb
    WHERE id = ${clinicId}::uuid
  `

  return {
    id: report.id,
    triggerType: report.triggerType,
    responseCount: report.responseCount,
    sections,
    summary,
    priority,
    generatedAt: report.generatedAt.toISOString(),
  }
}

/**
 * 回答送信時にカウンターをインクリメントし、閾値に達したらtrueを返す
 */
export async function incrementAdvisoryCounter(clinicId: string): Promise<boolean> {
  // Atomic increment via JSONB
  await prisma.$executeRaw`
    UPDATE clinics SET settings = jsonb_set(
      settings,
      '{responsesSinceLastAdvisory}',
      to_jsonb(COALESCE((settings->>'responsesSinceLastAdvisory')::int, 0) + 1)
    )
    WHERE id = ${clinicId}::uuid
  `

  // Check if threshold reached
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const threshold = settings.advisoryThreshold ?? ADVISORY.DEFAULT_THRESHOLD
  const current = settings.responsesSinceLastAdvisory ?? 0

  return current >= threshold
}
