import { prisma } from "@/lib/prisma"
import {
  ADVISORY,
  QUESTION_CATEGORY_MAP,
  CATEGORY_LABELS,
  CROSS_TEMPLATE_CATEGORIES,
  DENTAL_INSIGHT_RULES,
  DAY_LABELS,
  getTimeSlotLabel,
} from "@/lib/constants"
import { jstDaysAgo, jstNowParts } from "@/lib/date-jst"
import {
  getQuestionBreakdownByDays,
  getDashboardStats,
  getDailyTrend,
  getPurposeSatisfaction,
  getHourlyHeatmapData,
  getQuestionCurrentScores,
  getMonthlyTrend,
} from "@/lib/queries/stats"
import type {
  ClinicSettings,
  AdvisoryReportData,
  AdvisoryProgress,
  AdvisorySection,
} from "@/types"
import type {
  TemplateQuestionScores,
  DailyTrendPoint,
  HeatmapCell,
  PurposeSatisfactionRow,
} from "@/lib/queries/stats"

// ─── 内部型定義 ───

interface AnalysisData {
  stats: { totalResponses: number; averageScore: number; prevAverageScore: number | null }
  questionBreakdown: TemplateQuestionScores[]
  prevQuestionBreakdown: TemplateQuestionScores[]
  dailyTrend: DailyTrendPoint[]
  heatmap: HeatmapCell[]
  purposeSatisfaction: PurposeSatisfactionRow[]
  recentComments: Array<{ freeText: string | null; overallScore: number | null }>
  activeActions: Array<{
    title: string
    targetQuestion: string | null
    targetQuestionId: string | null
    baselineScore: number | null
    startedAt: Date
  }>
  scoreDistribution: Array<{ score: number; count: number }>
  actionCurrentScores: Record<string, number>
  /** カテゴリ → 平均スコアのマップ（全テンプレート横断） */
  categoryScores: Map<string, { total: number; count: number }>
  /** 月次経営データ（直近24ヶ月） */
  monthlyMetrics: MonthlyMetricRow[]
  /** 月次満足度トレンド（直近24ヶ月） */
  monthlyScoreTrend: Array<{ month: string; avgScore: number; count: number }>
}

interface MonthlyMetricRow {
  year: number
  month: number
  firstVisitCount: number | null
  revisitCount: number | null
  insuranceRevenue: number | null
  selfPayRevenue: number | null
  cancellationCount: number | null
}

interface ScoreDistRow {
  score: number
  count: bigint
}

// ─── Public API (変更なし) ───

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

// ─── データ収集（拡張版） ───

async function collectAnalysisData(clinicId: string): Promise<AnalysisData> {
  const prevRange = { from: jstDaysAgo(60), to: jstDaysAgo(30) }

  const [
    stats,
    questionBreakdown,
    prevQuestionBreakdown,
    dailyTrend,
    heatmap,
    purposeSatisfaction,
    recentComments,
    activeActions,
    scoreDistRows,
    monthlyMetrics,
    monthlyScoreTrend,
  ] = await Promise.all([
    getDashboardStats(clinicId),
    getQuestionBreakdownByDays(clinicId, 30),
    getQuestionBreakdownByDays(clinicId, 30, prevRange),
    getDailyTrend(clinicId, 30),
    getHourlyHeatmapData(clinicId, 90),
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
      select: {
        title: true,
        targetQuestion: true,
        targetQuestionId: true,
        baselineScore: true,
        startedAt: true,
      },
    }),
    prisma.$queryRaw<ScoreDistRow[]>`
      SELECT overall_score::int AS score, COUNT(*) AS count
      FROM survey_responses
      WHERE clinic_id = ${clinicId}::uuid
        AND responded_at >= ${jstDaysAgo(30)}
        AND overall_score IS NOT NULL
      GROUP BY score
      ORDER BY score
    `,
    prisma.monthlyClinicMetrics.findMany({
      where: { clinicId },
      select: {
        year: true,
        month: true,
        firstVisitCount: true,
        revisitCount: true,
        insuranceRevenue: true,
        selfPayRevenue: true,
        cancellationCount: true,
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      take: 24,
    }),
    getMonthlyTrend(clinicId, 24),
  ])

  const scoreDistribution = scoreDistRows.map((r) => ({
    score: r.score,
    count: Number(r.count),
  }))

  // 改善アクション対象設問の現在スコアを取得
  const actionQIds = activeActions
    .map((a) => a.targetQuestionId)
    .filter((id): id is string => !!id)
  const actionCurrentScores =
    actionQIds.length > 0 ? await getQuestionCurrentScores(clinicId, actionQIds) : {}

  // カテゴリ別スコア集計（全テンプレート横断）
  const categoryScores = new Map<string, { total: number; count: number }>()
  for (const template of questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore <= 0 || q.count < ADVISORY.MIN_SAMPLES_FOR_INSIGHT) continue
      const cat = QUESTION_CATEGORY_MAP[q.questionId]
      if (!cat) continue
      const entry = categoryScores.get(cat) ?? { total: 0, count: 0 }
      entry.total += q.avgScore * q.count
      entry.count += q.count
      categoryScores.set(cat, entry)
    }
  }

  return {
    stats,
    questionBreakdown,
    prevQuestionBreakdown,
    dailyTrend,
    heatmap,
    purposeSatisfaction,
    recentComments,
    activeActions,
    scoreDistribution,
    actionCurrentScores,
    categoryScores,
    monthlyMetrics,
    monthlyScoreTrend,
  }
}

// ─── ヘルパー ───

function getCategoryAvg(scores: Map<string, { total: number; count: number }>, cat: string): number | null {
  const entry = scores.get(cat)
  if (!entry || entry.count === 0) return null
  return entry.total / entry.count
}

/** スコアに応じたラベル */
function scoreLabel(score: number): string {
  if (score >= 4.5) return "非常に高い"
  if (score >= 4.0) return "良好"
  if (score >= 3.5) return "標準的"
  if (score >= 3.0) return "改善の余地あり"
  return "早急な改善が必要"
}

// ─── 分析エンジン（各1セクションを生成、該当なしならnull） ───

/** 1. 総合評価 */
function analyzeOverall(data: AnalysisData): AdvisorySection {
  const { stats } = data
  const label = scoreLabel(stats.averageScore)

  let trendText = ""
  if (stats.prevAverageScore !== null) {
    const delta = Math.round((stats.averageScore - stats.prevAverageScore) * 100) / 100
    if (delta > 0.05) trendText = `前月比 +${delta.toFixed(2)}ポイントの上昇傾向です。`
    else if (delta < -0.05) trendText = `前月比 ${delta.toFixed(2)}ポイントの低下傾向です。`
    else trendText = "前月と同水準を維持しています。"
  }

  // 回答ペース
  const validDays = data.dailyTrend.filter((d) => d.count > 0)
  const avgPerDay = validDays.length > 0
    ? (validDays.reduce((s, d) => s + d.count, 0) / validDays.length).toFixed(1)
    : "0"

  return {
    title: "総合評価",
    content: `患者満足度スコアは ${stats.averageScore.toFixed(2)} で ${label}水準です。${trendText}\n総回答数: ${stats.totalResponses}件（直近30日の診療日平均: ${avgPerDay}件/日）`,
    type: "summary",
  }
}

/** 2. 強み分析（前期比較付き） */
function analyzeStrengths(data: AnalysisData): AdvisorySection | null {
  const prevScoreMap = new Map<string, number>()
  for (const t of data.prevQuestionBreakdown) {
    for (const q of t.questions) {
      prevScoreMap.set(`${t.templateName}:${q.questionId}`, q.avgScore)
    }
  }

  const strengths: Array<{ text: string; score: number; delta: number | null; templateName: string }> = []
  for (const template of data.questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore >= ADVISORY.HIGH_SCORE_THRESHOLD && q.count >= ADVISORY.MIN_SAMPLES_FOR_INSIGHT) {
        const prevScore = prevScoreMap.get(`${template.templateName}:${q.questionId}`) ?? null
        const delta = prevScore !== null && prevScore > 0 ? q.avgScore - prevScore : null
        strengths.push({ text: q.text, score: q.avgScore, delta, templateName: template.templateName })
      }
    }
  }

  if (strengths.length === 0) return null

  strengths.sort((a, b) => b.score - a.score)
  const lines = strengths.slice(0, 5).map((s) => {
    let line = `- ${s.text}（${s.templateName}）: ${s.score.toFixed(2)}点`
    if (s.delta !== null) {
      if (s.delta > 0.1) line += ` ↑前期比+${s.delta.toFixed(2)}`
      else if (s.delta < -0.1) line += ` ↓前期比${s.delta.toFixed(2)}`
      else line += ` →維持`
    }
    return line
  })

  return {
    title: "強み — 高評価項目",
    content: `以下の項目で高い評価を得ています。スタッフへの共有・モチベーション向上に活用してください。\n${lines.join("\n")}`,
    type: "strength",
  }
}

/** 3. 設問間相関パターン分析（歯科コンサル知見） */
function analyzeCorrelations(data: AnalysisData): AdvisorySection | null {
  const { categoryScores } = data
  const matched: Array<{ insight: string; recommendation: string }> = []

  for (const rule of DENTAL_INSIGHT_RULES) {
    // high条件: 全てのカテゴリが閾値以上
    const highOk =
      rule.high.length === 0 ||
      rule.high.every((cat) => {
        const avg = getCategoryAvg(categoryScores, cat)
        return avg !== null && avg >= ADVISORY.HIGH_SCORE_THRESHOLD
      })

    // low条件: 全てのカテゴリが閾値未満
    const lowOk =
      rule.low.length === 0 ||
      rule.low.every((cat) => {
        const avg = getCategoryAvg(categoryScores, cat)
        return avg !== null && avg < ADVISORY.LOW_SCORE_THRESHOLD
      })

    if (highOk && lowOk) {
      // スコア値を付記
      const scoreSummary = [...rule.high, ...rule.low]
        .map((cat) => {
          const avg = getCategoryAvg(categoryScores, cat)
          return avg !== null ? `${CATEGORY_LABELS[cat] ?? cat}: ${avg.toFixed(2)}点` : null
        })
        .filter(Boolean)
        .join("、")

      matched.push({
        insight: `${rule.insight}\n（${scoreSummary}）`,
        recommendation: rule.recommendation,
      })
    }
  }

  if (matched.length === 0) return null

  const content = matched
    .slice(0, 3)
    .map((m, i) => `【パターン${i + 1}】\n${m.insight}\n→ ${m.recommendation}`)
    .join("\n\n")

  return {
    title: "設問間パターン分析",
    content,
    type: "correlation",
  }
}

/** 4. 初診 vs 再診ギャップ分析 */
function analyzeFirstRevisitGap(data: AnalysisData): AdvisorySection | null {
  const firstVisit = data.questionBreakdown.find((t) => t.templateName === "初診")
  const revisit = data.questionBreakdown.find((t) => t.templateName === "再診")
  if (!firstVisit || !revisit) return null
  if (firstVisit.responseCount < ADVISORY.MIN_SAMPLES_FOR_INSIGHT ||
      revisit.responseCount < ADVISORY.MIN_SAMPLES_FOR_INSIGHT) return null

  const fvMap = new Map(firstVisit.questions.map((q) => [q.questionId, q]))
  const rvMap = new Map(revisit.questions.map((q) => [q.questionId, q]))

  const gaps: Array<{ label: string; fvScore: number; rvScore: number; gap: number }> = []

  for (const cross of CROSS_TEMPLATE_CATEGORIES) {
    const fv = fvMap.get(cross.firstVisitId)
    const rv = rvMap.get(cross.revisitId)
    if (!fv || !rv || fv.count < 3 || rv.count < 3) continue

    const gap = fv.avgScore - rv.avgScore
    if (Math.abs(gap) >= ADVISORY.SIGNIFICANT_GAP) {
      gaps.push({ label: cross.label, fvScore: fv.avgScore, rvScore: rv.avgScore, gap })
    }
  }

  if (gaps.length === 0) return null

  gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))

  const lines = gaps.map((g) => {
    const direction = g.gap > 0 ? "初診 > 再診" : "再診 > 初診"
    const interpretation = g.gap > 0
      ? "再診患者の満足度が低下しています。「慣れ」による対応の省略や説明不足が疑われます。"
      : "初診患者の体験に課題があります。初来院時の不安やプロセスの分かりにくさが影響している可能性があります。"
    return `- ${g.label}: 初診 ${g.fvScore.toFixed(2)} / 再診 ${g.rvScore.toFixed(2)}（差 ${g.gap > 0 ? "+" : ""}${g.gap.toFixed(2)}、${direction}）\n  ${interpretation}`
  })

  return {
    title: "初診 vs 再診ギャップ",
    content: `初診（${firstVisit.responseCount}件）と再診（${revisit.responseCount}件）で有意なスコア差がある項目:\n${lines.join("\n")}`,
    type: "first_revisit_gap",
  }
}

/** 5. 曜日・時間帯パターン分析 */
function analyzeTimePatterns(data: AnalysisData): AdvisorySection | null {
  const { heatmap } = data
  if (heatmap.length < 5) return null

  // 全体平均
  const totalCount = heatmap.reduce((s, h) => s + h.count, 0)
  if (totalCount < 20) return null
  const overallAvg = heatmap.reduce((s, h) => s + h.avgScore * h.count, 0) / totalCount

  // 曜日別集計
  const dayAgg = new Map<number, { total: number; count: number }>()
  for (const h of heatmap) {
    const entry = dayAgg.get(h.dayOfWeek) ?? { total: 0, count: 0 }
    entry.total += h.avgScore * h.count
    entry.count += h.count
    dayAgg.set(h.dayOfWeek, entry)
  }

  type DayScore = { day: number; avg: number; count: number }
  const dayScores: DayScore[] = []
  Array.from(dayAgg.entries()).forEach(([day, agg]) => {
    if (agg.count >= ADVISORY.MIN_SAMPLES_FOR_INSIGHT) {
      dayScores.push({ day, avg: agg.total / agg.count, count: agg.count })
    }
  })

  if (dayScores.length < 2) return null

  dayScores.sort((a, b) => a.avg - b.avg)
  const lowest = dayScores[0]
  const highest = dayScores[dayScores.length - 1]

  const lines: string[] = []

  // 曜日別の最低/最高
  if (highest.avg - lowest.avg >= 0.2) {
    lines.push(
      `${DAY_LABELS[lowest.day]}曜日のスコアが最も低く（${lowest.avg.toFixed(2)}点、${lowest.count}件）、` +
      `${DAY_LABELS[highest.day]}曜日が最も高い（${highest.avg.toFixed(2)}点、${highest.count}件）状態です。` +
      `差は${(highest.avg - lowest.avg).toFixed(2)}ポイントあります。`
    )
  }

  // 時間帯別（午前/午後/夕方）集計
  const slotAgg = new Map<string, { total: number; count: number }>()
  for (const h of heatmap) {
    const slot = getTimeSlotLabel(h.hour)
    const entry = slotAgg.get(slot) ?? { total: 0, count: 0 }
    entry.total += h.avgScore * h.count
    entry.count += h.count
    slotAgg.set(slot, entry)
  }

  const slotScores = Array.from(slotAgg.entries())
    .filter(([, agg]) => agg.count >= ADVISORY.MIN_SAMPLES_FOR_INSIGHT)
    .map(([slot, agg]) => ({ slot, avg: agg.total / agg.count, count: agg.count }))
    .sort((a, b) => a.avg - b.avg)

  if (slotScores.length >= 2) {
    const slotLow = slotScores[0]
    const slotHigh = slotScores[slotScores.length - 1]
    if (slotHigh.avg - slotLow.avg >= 0.15) {
      lines.push(
        `時間帯別では${slotLow.slot}（${slotLow.avg.toFixed(2)}点）が低く、` +
        `${slotHigh.slot}（${slotHigh.avg.toFixed(2)}点）が高い傾向です。`
      )
      if (slotLow.slot === "午後") {
        lines.push("午後のスコア低下は、待ち時間の延長やスタッフ疲労が要因として多く見られます。予約枠の間隔見直しや午後の急患バッファ確保を検討してください。")
      }
    }
  }

  // 特定の低スコアセル（平均-0.5以下）
  const alertCells = heatmap
    .filter((h) => h.count >= 3 && h.avgScore < overallAvg - 0.5)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3)

  if (alertCells.length > 0) {
    const cellTexts = alertCells.map(
      (c) => `${DAY_LABELS[c.dayOfWeek]}曜${c.hour}時台（${c.avgScore.toFixed(2)}点/${c.count}件）`
    )
    lines.push(`特にスコアが低いスロット: ${cellTexts.join("、")}`)
  }

  if (lines.length === 0) return null

  return {
    title: "曜日・時間帯パターン",
    content: lines.join("\n"),
    type: "time_pattern",
  }
}

/** 6. スコア分布分析 */
function analyzeDistribution(data: AnalysisData): AdvisorySection | null {
  const dist = data.scoreDistribution
  if (dist.length === 0) return null

  const total = dist.reduce((s, d) => s + d.count, 0)
  if (total < 20) return null

  const mean = dist.reduce((s, d) => s + d.score * d.count, 0) / total
  const variance = dist.reduce((s, d) => s + d.count * (d.score - mean) ** 2, 0) / total
  const stddev = Math.sqrt(variance)

  const lowCount = dist.filter((d) => d.score <= 2).reduce((s, d) => s + d.count, 0)
  const highCount = dist.filter((d) => d.score >= 4).reduce((s, d) => s + d.count, 0)
  const lowPct = (lowCount / total) * 100
  const highPct = (highCount / total) * 100

  const lines: string[] = []

  // 分布サマリー
  const distBar = dist.map((d) => `${d.score}点: ${d.count}件（${((d.count / total) * 100).toFixed(0)}%）`).join("、")
  lines.push(`スコア分布: ${distBar}`)
  lines.push(`平均: ${mean.toFixed(2)}点 / 標準偏差: ${stddev.toFixed(2)}`)

  // パターン検出
  const isPolarized = lowPct >= ADVISORY.POLARIZATION_LOW_PCT && highPct >= ADVISORY.POLARIZATION_HIGH_PCT
  const isConsistent = stddev < ADVISORY.CONSISTENCY_STDDEV

  if (isPolarized) {
    lines.push(
      `⚠ スコアが二極化しています（低評価${lowPct.toFixed(0)}% / 高評価${highPct.toFixed(0)}%）。` +
      `患者によって体験の質にバラつきがある状態です。担当スタッフや曜日・時間帯による差が原因の可能性があります。` +
      `ヒートマップで低スコアが集中するスロットを特定し、そのスロットの運用を重点的に見直してください。`
    )
  } else if (isConsistent && mean >= 4.0) {
    lines.push(
      `安定して高い評価を維持しています（標準偏差${stddev.toFixed(2)}）。` +
      `スタッフ全体で均質なサービスが提供できている証拠です。この状態を維持してください。`
    )
  } else if (lowPct >= 10) {
    lines.push(
      `低評価（1-2点）が${lowPct.toFixed(0)}%あります。` +
      `一部の患者に不満足な体験が発生しています。フリーテキストのコメントから具体的な不満要因を特定してください。`
    )
  }

  return {
    title: "スコア分布分析",
    content: lines.join("\n"),
    type: "distribution",
  }
}

/** 7. 改善ポイント（前期比較付き） */
function analyzeImprovements(data: AnalysisData): AdvisorySection | null {
  const prevScoreMap = new Map<string, number>()
  for (const t of data.prevQuestionBreakdown) {
    for (const q of t.questions) {
      prevScoreMap.set(`${t.templateName}:${q.questionId}`, q.avgScore)
    }
  }

  const improvements: Array<{
    text: string
    score: number
    delta: number | null
    templateName: string
    questionId: string
    category: string | null
  }> = []

  for (const template of data.questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore > 0 && q.avgScore < ADVISORY.HIGH_SCORE_THRESHOLD && q.count >= 3) {
        const prevScore = prevScoreMap.get(`${template.templateName}:${q.questionId}`) ?? null
        const delta = prevScore !== null && prevScore > 0 ? q.avgScore - prevScore : null
        const category = QUESTION_CATEGORY_MAP[q.questionId] ?? null
        improvements.push({
          text: q.text,
          score: q.avgScore,
          delta,
          templateName: template.templateName,
          questionId: q.questionId,
          category,
        })
      }
    }
  }

  if (improvements.length === 0) return null

  improvements.sort((a, b) => a.score - b.score)

  const lines = improvements.slice(0, 5).map((imp) => {
    let line = `- ${imp.text}（${imp.templateName}）: ${imp.score.toFixed(2)}点`
    if (imp.delta !== null) {
      if (imp.delta > 0.1) line += ` ↑前期比+${imp.delta.toFixed(2)}（改善傾向）`
      else if (imp.delta < -0.1) line += ` ↓前期比${imp.delta.toFixed(2)}（悪化傾向）`
      else line += ` →横ばい`
    }
    if (imp.category) {
      line += ` [${CATEGORY_LABELS[imp.category] ?? imp.category}]`
    }
    return line
  })

  // 悪化している項目を特別に強調
  const worsening = improvements.filter((i) => i.delta !== null && i.delta < -0.2)
  if (worsening.length > 0) {
    lines.push(`\n⚠ 前期比で悪化が顕著な項目: ${worsening.map((w) => `「${w.text}」(${w.delta!.toFixed(2)})`).join("、")}`)
    lines.push("悪化傾向は早期に原因を特定し対処することが重要です。")
  }

  return {
    title: "改善ポイント",
    content: `スコアが${ADVISORY.HIGH_SCORE_THRESHOLD}点未満の項目（優先度順）:\n${lines.join("\n")}`,
    type: "improvement",
  }
}

/** 8. 改善アクション効果検証 */
function analyzeActionEffectiveness(data: AnalysisData): AdvisorySection | null {
  const { activeActions, actionCurrentScores } = data
  if (activeActions.length === 0) return null

  const lines: string[] = []

  for (const action of activeActions) {
    const qId = action.targetQuestionId
    if (!qId || action.baselineScore === null) continue

    const currentScore = actionCurrentScores[qId]
    if (currentScore === undefined) continue

    const delta = currentScore - action.baselineScore
    const daysSince = Math.floor(
      (Date.now() - new Date(action.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    let status: string
    if (delta >= 0.3) status = "✅ 効果あり"
    else if (delta >= 0.1) status = "📈 やや改善"
    else if (delta > -0.1) status = "➡️ 変化なし"
    else status = "⚠️ 悪化"

    lines.push(
      `- 「${action.title}」（${daysSince}日経過）\n` +
      `  ベースライン: ${action.baselineScore.toFixed(2)} → 現在: ${currentScore.toFixed(2)}（${delta >= 0 ? "+" : ""}${delta.toFixed(2)}）${status}`
    )
  }

  if (lines.length === 0) {
    lines.push(
      `現在${activeActions.length}件の改善アクションが進行中ですが、ベースラインスコアまたは対象設問が未設定のため効果測定ができません。` +
      `改善アクション管理画面でベースラインと対象設問を設定してください。`
    )
  }

  return {
    title: "改善アクション効果検証",
    content: lines.join("\n"),
    type: "action_effect",
  }
}

/** 9. トレンド分析（拡張版） */
function analyzeTrend(data: AnalysisData): AdvisorySection | null {
  const { dailyTrend } = data
  if (dailyTrend.length < 7) return null

  const recentWeek = dailyTrend.slice(-7)
  const prevWeek = dailyTrend.length >= 14 ? dailyTrend.slice(-14, -7) : null

  const recentValid = recentWeek.filter((d) => d.avgScore !== null)
  const recentAvg =
    recentValid.length > 0
      ? recentValid.reduce((sum, d) => sum + (d.avgScore ?? 0), 0) / recentValid.length
      : 0
  const recentCount = recentWeek.reduce((sum, d) => sum + d.count, 0)

  const lines: string[] = []
  lines.push(`直近1週間: 回答数${recentCount}件、平均スコア${recentAvg.toFixed(2)}点`)

  if (prevWeek) {
    const prevValid = prevWeek.filter((d) => d.avgScore !== null)
    const prevAvg =
      prevValid.length > 0
        ? prevValid.reduce((sum, d) => sum + (d.avgScore ?? 0), 0) / prevValid.length
        : 0
    const prevCount = prevWeek.reduce((sum, d) => sum + d.count, 0)

    const delta = recentAvg - prevAvg
    if (delta > 0.1) {
      lines.push(`前週比 +${delta.toFixed(2)}ポイントの上昇。改善施策の効果が出ている可能性があります。`)
    } else if (delta < -0.1) {
      lines.push(`前週比 ${delta.toFixed(2)}ポイントの低下。一時的な変動か持続的な低下かを次週も確認してください。`)
    } else {
      lines.push("前週とほぼ同水準です。")
    }

    if (recentCount < prevCount * 0.7 && prevCount > 0) {
      lines.push(`回答数が前週（${prevCount}件）から大きく減少しています。アンケート配布の促進を検討してください。`)
    }
  }

  // 30日間の全体傾向（線形回帰）
  const validPoints = dailyTrend
    .map((d, i) => (d.avgScore !== null ? { x: i, y: d.avgScore } : null))
    .filter((p): p is { x: number; y: number } => p !== null)

  if (validPoints.length >= 10) {
    const n = validPoints.length
    const sumX = validPoints.reduce((s, p) => s + p.x, 0)
    const sumY = validPoints.reduce((s, p) => s + p.y, 0)
    const sumXY = validPoints.reduce((s, p) => s + p.x * p.y, 0)
    const sumXX = validPoints.reduce((s, p) => s + p.x * p.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const monthlySlope = slope * 30 // 30日あたりの変化量

    if (Math.abs(monthlySlope) >= 0.1) {
      if (monthlySlope > 0) {
        lines.push(`30日間の全体傾向: 月あたり+${monthlySlope.toFixed(2)}の上昇トレンド。`)
      } else {
        lines.push(`30日間の全体傾向: 月あたり${monthlySlope.toFixed(2)}の下降トレンド。原因の特定を推奨します。`)
      }
    } else {
      lines.push("30日間のスコアは横ばいで安定しています。")
    }
  }

  return {
    title: "トレンド分析",
    content: lines.join("\n"),
    type: "trend",
  }
}

/** 10. 経営指標×満足度の相関分析 */
function analyzeBusinessCorrelation(data: AnalysisData): AdvisorySection | null {
  const { monthlyMetrics, monthlyScoreTrend } = data
  if (monthlyMetrics.length < 3 || monthlyScoreTrend.length < 3) return null

  // 月次データを結合（YYYY-MM キーで突合）
  type Joined = {
    key: string
    score: number
    totalVisits: number | null
    selfPayRate: number | null
    cancelRate: number | null
  }

  const scoreMap = new Map(monthlyScoreTrend.map((m) => [m.month, m]))
  const joined: Joined[] = []

  for (const m of monthlyMetrics) {
    const key = `${m.year}-${String(m.month).padStart(2, "0")}`
    const s = scoreMap.get(key)
    if (!s) continue

    const totalVisits =
      m.firstVisitCount != null && m.revisitCount != null
        ? m.firstVisitCount + m.revisitCount
        : null
    const totalRevenue =
      m.insuranceRevenue != null && m.selfPayRevenue != null
        ? m.insuranceRevenue + m.selfPayRevenue
        : null
    const selfPayRate =
      totalRevenue != null && totalRevenue > 0 && m.selfPayRevenue != null
        ? (m.selfPayRevenue / totalRevenue) * 100
        : null
    const cancelRate =
      totalVisits != null && totalVisits > 0 && m.cancellationCount != null
        ? (m.cancellationCount / totalVisits) * 100
        : null

    joined.push({
      key,
      score: s.avgScore,
      totalVisits,
      selfPayRate,
      cancelRate,
    })
  }

  if (joined.length < 3) return null

  const lines: string[] = []

  // 満足度×来院数の相関
  const visitPairs = joined.filter((j) => j.totalVisits !== null)
  if (visitPairs.length >= 3) {
    const corr = pearsonCorrelation(
      visitPairs.map((j) => j.score),
      visitPairs.map((j) => j.totalVisits!)
    )
    if (Math.abs(corr) >= 0.4) {
      const direction = corr > 0 ? "正の相関" : "負の相関"
      lines.push(
        `満足度スコアと来院数に${direction}があります（相関係数: ${corr.toFixed(2)}）。` +
        (corr > 0
          ? "満足度が高い月は来院数も多い傾向です。患者体験の向上が集患に直結していることを示しています。"
          : "来院数が多い月は満足度が下がる傾向です。混雑時の待ち時間やスタッフの余裕不足が影響している可能性があります。")
      )
    }
  }

  // 満足度×自費率の相関
  const selfPayPairs = joined.filter((j) => j.selfPayRate !== null)
  if (selfPayPairs.length >= 3) {
    const corr = pearsonCorrelation(
      selfPayPairs.map((j) => j.score),
      selfPayPairs.map((j) => j.selfPayRate!)
    )
    if (Math.abs(corr) >= 0.4) {
      const direction = corr > 0 ? "正の相関" : "負の相関"
      lines.push(
        `満足度スコアと自費率に${direction}があります（相関係数: ${corr.toFixed(2)}）。` +
        (corr > 0
          ? "満足度が高い月は自費率も高い傾向です。丁寧な説明と信頼構築が自費選択を後押ししていることを示唆しています。"
          : "自費率が高い月は満足度が下がる傾向です。自費治療時の費用説明や期待値コントロールに課題がある可能性があります。")
      )
    }
  }

  // 満足度×キャンセル率の相関
  const cancelPairs = joined.filter((j) => j.cancelRate !== null)
  if (cancelPairs.length >= 3) {
    const corr = pearsonCorrelation(
      cancelPairs.map((j) => j.score),
      cancelPairs.map((j) => j.cancelRate!)
    )
    if (Math.abs(corr) >= 0.4) {
      lines.push(
        `満足度スコアとキャンセル率に相関があります（相関係数: ${corr.toFixed(2)}）。` +
        (corr < 0
          ? "満足度が高い月はキャンセルが少ない傾向です。体験改善が直接的にキャンセル率低下に貢献しています。"
          : "キャンセル率が高い月は満足度も高い傾向です。キャンセル枠に余裕ができ一人ひとりへの対応時間が増えていると考えられます。")
      )
    }
  }

  // 月次推移のハイライト
  if (joined.length >= 6) {
    const recent3 = joined.slice(-3)
    const prev3 = joined.slice(-6, -3)
    const recentAvgVisits = avg(recent3.map((j) => j.totalVisits).filter((v): v is number => v !== null))
    const prevAvgVisits = avg(prev3.map((j) => j.totalVisits).filter((v): v is number => v !== null))

    if (recentAvgVisits !== null && prevAvgVisits !== null && prevAvgVisits > 0) {
      const visitChange = ((recentAvgVisits - prevAvgVisits) / prevAvgVisits) * 100
      if (Math.abs(visitChange) >= 5) {
        lines.push(
          `直近3ヶ月の平均来院数は${Math.round(recentAvgVisits)}人/月で、その前の3ヶ月（${Math.round(prevAvgVisits)}人/月）から${visitChange > 0 ? "+" : ""}${visitChange.toFixed(0)}%${visitChange > 0 ? "増加" : "減少"}しています。`
        )
      }
    }
  }

  if (lines.length === 0) return null

  return {
    title: "経営指標×満足度",
    content: `経営データと満足度スコアの相関（${joined.length}ヶ月分）:\n${lines.join("\n")}`,
    type: "business_correlation",
  }
}

/** 11. 季節性・前年同月比分析 */
function analyzeSeasonality(data: AnalysisData): AdvisorySection | null {
  const { monthlyScoreTrend } = data
  if (monthlyScoreTrend.length < 6) return null

  const { year: currentYear, month: currentMonth } = jstNowParts()
  const lines: string[] = []

  // 前年同月比
  const currentKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`
  const prevYearKey = `${currentYear - 1}-${String(currentMonth).padStart(2, "0")}`

  const current = monthlyScoreTrend.find((m) => m.month === currentKey)
  const prevYear = monthlyScoreTrend.find((m) => m.month === prevYearKey)

  if (current && prevYear && prevYear.count >= 10) {
    const delta = current.avgScore - prevYear.avgScore
    lines.push(
      `前年同月比（${currentYear - 1}年${currentMonth}月 vs 今月）: ` +
      `${prevYear.avgScore.toFixed(2)} → ${current.avgScore.toFixed(2)}（${delta >= 0 ? "+" : ""}${delta.toFixed(2)}）` +
      (Math.abs(delta) >= 0.2
        ? delta > 0
          ? "。1年間で大きな改善を達成しています。"
          : "。前年より低下しています。長期的な原因の調査を推奨します。"
        : "。ほぼ同水準を維持しています。")
    )
  }

  // 前年同月比（来院数）
  const { monthlyMetrics } = data
  if (monthlyMetrics.length >= 12) {
    const curMetric = monthlyMetrics.find((m) => m.year === currentYear && m.month === currentMonth)
    const prevMetric = monthlyMetrics.find((m) => m.year === currentYear - 1 && m.month === currentMonth)
    if (curMetric && prevMetric) {
      const curVisits = (curMetric.firstVisitCount ?? 0) + (curMetric.revisitCount ?? 0)
      const prevVisits = (prevMetric.firstVisitCount ?? 0) + (prevMetric.revisitCount ?? 0)
      if (prevVisits > 0) {
        const change = ((curVisits - prevVisits) / prevVisits) * 100
        lines.push(
          `来院数の前年同月比: ${prevVisits}人 → ${curVisits}人（${change >= 0 ? "+" : ""}${change.toFixed(0)}%）`
        )
      }
    }
  }

  // 季節性パターンの検出（12ヶ月以上のデータがある場合）
  if (monthlyScoreTrend.length >= 12) {
    // 月別平均を計算
    const monthAvgs = new Map<number, { total: number; count: number }>()
    for (const m of monthlyScoreTrend) {
      const mo = parseInt(m.month.split("-")[1])
      const entry = monthAvgs.get(mo) ?? { total: 0, count: 0 }
      entry.total += m.avgScore
      entry.count += 1
      monthAvgs.set(mo, entry)
    }

    const monthScores = Array.from(monthAvgs.entries())
      .filter(([, v]) => v.count >= 1)
      .map(([mo, v]) => ({ month: mo, avg: v.total / v.count }))
      .sort((a, b) => a.avg - b.avg)

    if (monthScores.length >= 6) {
      const low = monthScores[0]
      const high = monthScores[monthScores.length - 1]
      const gap = high.avg - low.avg

      if (gap >= 0.2) {
        lines.push(
          `季節パターン: ${low.month}月が最もスコアが低く（平均${low.avg.toFixed(2)}）、${high.month}月が最も高い（平均${high.avg.toFixed(2)}）傾向です。`
        )

        // 歯科特有の季節性解釈
        if (low.month === 12 || low.month === 1) {
          lines.push("年末年始は駆け込み受診や急患が増え、通常より対応が手薄になりやすい時期です。この時期は特にスタッフ配置と予約枠管理を強化してください。")
        } else if (low.month >= 6 && low.month <= 8) {
          lines.push("夏場はお子さまの受診が増える時期です。小児対応の待ち時間管理やキッズ対応の強化が満足度改善に効果的です。")
        } else if (low.month >= 3 && low.month <= 4) {
          lines.push("年度替わりの時期は転入・新規患者が増えやすく、初診対応の質がスコアに影響しやすい時期です。")
        }
      }
    }
  }

  // 回答数の季節性
  if (monthlyScoreTrend.length >= 12) {
    const countByMonth = new Map<number, { total: number; count: number }>()
    for (const m of monthlyScoreTrend) {
      const mo = parseInt(m.month.split("-")[1])
      const entry = countByMonth.get(mo) ?? { total: 0, count: 0 }
      entry.total += m.count
      entry.count += 1
      countByMonth.set(mo, entry)
    }

    const countScores = Array.from(countByMonth.entries())
      .filter(([, v]) => v.count >= 1)
      .map(([mo, v]) => ({ month: mo, avgCount: v.total / v.count }))
      .sort((a, b) => a.avgCount - b.avgCount)

    if (countScores.length >= 6) {
      const lowMonth = countScores[0]
      const highMonth = countScores[countScores.length - 1]
      if (highMonth.avgCount > lowMonth.avgCount * 1.5) {
        lines.push(
          `回答数の季節変動: ${lowMonth.month}月が最少（平均${Math.round(lowMonth.avgCount)}件）、${highMonth.month}月が最多（平均${Math.round(highMonth.avgCount)}件）。回答が少ない月はスコアの振れ幅が大きくなるため、解釈に注意してください。`
        )
      }
    }
  }

  if (lines.length === 0) return null

  return {
    title: "季節性・前年同月比",
    content: lines.join("\n"),
    type: "seasonality",
  }
}

// ─── 統計ヘルパー ───

/** ピアソン相関係数 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0)
  const sumXX = x.reduce((a, xi) => a + xi * xi, 0)
  const sumYY = y.reduce((a, yi) => a + yi * yi, 0)

  const denom = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  if (denom === 0) return 0
  return (n * sumXY - sumX * sumY) / denom
}

/** 配列の平均値（空ならnull） */
function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** 12. 推奨アクション（全分析結果を統合） */
function buildRecommendations(
  data: AnalysisData,
  findings: AdvisorySection[]
): AdvisorySection {
  const actions: Array<{ priority: number; text: string }> = []

  // 改善ポイントから最優先項目
  const improvements: Array<{ text: string; score: number; category: string | null }> = []
  for (const template of data.questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore > 0 && q.avgScore < ADVISORY.LOW_SCORE_THRESHOLD && q.count >= 3) {
        improvements.push({
          text: q.text,
          score: q.avgScore,
          category: QUESTION_CATEGORY_MAP[q.questionId] ?? null,
        })
      }
    }
  }
  improvements.sort((a, b) => a.score - b.score)

  // 改善アクション未登録の低スコア項目
  const activeTargetIds = new Set(
    data.activeActions.map((a) => a.targetQuestionId).filter(Boolean)
  )
  const unaddressed = improvements.filter(
    (imp) => imp.category && !data.activeActions.some((a) => a.targetQuestion === imp.category)
  )

  if (unaddressed.length > 0 && data.activeActions.length === 0) {
    actions.push({
      priority: 1,
      text: `最優先: 「${unaddressed[0].text}」（${unaddressed[0].score.toFixed(2)}点）に対する改善アクションを登録してください。改善アクション管理画面から具体的な施策を選択できます。`,
    })
  } else if (unaddressed.length > 0) {
    actions.push({
      priority: 2,
      text: `「${unaddressed[0].text}」（${unaddressed[0].score.toFixed(2)}点）はまだ改善アクションが未登録です。対策の検討を推奨します。`,
    })
  }

  // 診療内容別で低スコアがある場合
  const lowPurpose = data.purposeSatisfaction.filter((p) => p.avgScore < 3.5 && p.count >= 3)
  if (lowPurpose.length > 0) {
    const worst = lowPurpose.sort((a, b) => a.avgScore - b.avgScore)[0]
    actions.push({
      priority: 3,
      text: `「${worst.purpose}」（${worst.insuranceType}）の患者満足度が${worst.avgScore.toFixed(2)}点と低めです。この診療内容の説明プロセスや痛みケアを重点的に見直してください。`,
    })
  }

  // フリーテキストの低スコアコメント
  const negativeComments = data.recentComments.filter(
    (c) => c.overallScore !== null && c.overallScore < 3
  )
  if (negativeComments.length >= 3) {
    actions.push({
      priority: 4,
      text: `低スコア（3点未満）の回答が${negativeComments.length}件あります。フリーテキストを確認し、共通する不満パターンを特定してください。`,
    })
  }

  // 相関パターンからの推奨
  const correlationSection = findings.find((f) => f.type === "correlation")
  if (correlationSection) {
    actions.push({
      priority: 2,
      text: "設問間パターン分析で検出されたパターンへの対応を検討してください。複数の設問に影響するため、改善効果が大きい可能性があります。",
    })
  }

  // 時間帯パターンからの推奨
  const timeSection = findings.find((f) => f.type === "time_pattern")
  if (timeSection) {
    actions.push({
      priority: 5,
      text: "曜日・時間帯パターンで低スコアのスロットが検出されています。該当時間帯のスタッフ配置や予約枠を見直してください。",
    })
  }

  // 改善アクションの進捗モニタリング
  if (data.activeActions.length > 0) {
    const effectSection = findings.find((f) => f.type === "action_effect")
    if (effectSection && effectSection.content.includes("変化なし")) {
      actions.push({
        priority: 3,
        text: "進行中の改善アクションで効果が出ていない項目があります。施策の見直しまたは別のアプローチを検討してください。",
      })
    }
  }

  // 経営×満足度の相関からの推奨
  const bizSection = findings.find((f) => f.type === "business_correlation")
  if (bizSection && bizSection.content.includes("負の相関")) {
    actions.push({
      priority: 4,
      text: "満足度と来院数に負の相関が検出されています。繁忙月のスタッフ増員や予約枠調整で、混雑時の患者体験を維持する対策を検討してください。",
    })
  }

  // 季節性への事前対策
  const seasonSection = findings.find((f) => f.type === "seasonality")
  if (seasonSection && seasonSection.content.includes("最もスコアが低く")) {
    actions.push({
      priority: 5,
      text: "季節性パターンが検出されています。低スコア月に向けた事前の体制強化（スタッフ配置・予約枠調整）を計画してください。",
    })
  }

  // ポジティブ強化
  const positiveComments = data.recentComments.filter(
    (c) => c.overallScore !== null && c.overallScore >= 4.5 && c.freeText
  )
  if (positiveComments.length >= 5) {
    actions.push({
      priority: 6,
      text: `高スコアの回答に${positiveComments.length}件のポジティブなコメントが寄せられています。スタッフミーティングで共有し、モチベーション向上に活用しましょう。`,
    })
  }

  // 経営データ未入力の促進
  if (data.monthlyMetrics.length < 3) {
    actions.push({
      priority: 7,
      text: "経営データ（来院数・売上）の入力が3ヶ月未満です。経営レポートにデータを入力すると、満足度との相関分析や季節性パターンの検出が可能になります。",
    })
  }

  if (actions.length === 0) {
    actions.push({
      priority: 10,
      text: "現在の患者満足度は良好です。アンケート回答数を増やし、より精度の高い分析を目指しましょう。",
    })
  }

  actions.sort((a, b) => a.priority - b.priority)

  return {
    title: "推奨アクション",
    content: actions.map((a) => `${a.text}`).join("\n\n"),
    type: "action",
  }
}

// ─── メインジェネレーター ───

export async function generateAdvisoryReport(
  clinicId: string,
  triggerType: "threshold" | "scheduled" | "manual"
): Promise<AdvisoryReportData> {
  const data = await collectAnalysisData(clinicId)

  // 各分析エンジンを実行（nullは除外）
  const analysisResults = [
    analyzeOverall(data),
    analyzeStrengths(data),
    analyzeCorrelations(data),
    analyzeFirstRevisitGap(data),
    analyzeTimePatterns(data),
    analyzeDistribution(data),
    analyzeImprovements(data),
    analyzeActionEffectiveness(data),
    analyzeTrend(data),
    analyzeBusinessCorrelation(data),
    analyzeSeasonality(data),
  ].filter((s): s is AdvisorySection => s !== null)

  // 推奨アクション（全分析結果を統合）
  analysisResults.push(buildRecommendations(data, analysisResults))

  // 最優先改善領域の特定
  let priority: string | null = null
  const improvementSection = analysisResults.find((s) => s.type === "improvement")
  if (improvementSection) {
    // 改善ポイントの最初の項目からテキストを抽出
    const match = improvementSection.content.match(/- (.+?)（/)
    if (match) priority = match[1]
  }

  // サマリー生成
  const label = scoreLabel(data.stats.averageScore)
  const sectionCount = analysisResults.filter(
    (s) => s.type !== "summary" && s.type !== "action"
  ).length

  const summary =
    data.stats.averageScore >= 4.0
      ? `患者満足度は${label}水準（${data.stats.averageScore.toFixed(2)}点）。${sectionCount}項目の分析を実施しました。${priority ? `重点改善領域:「${priority}」` : "現在の水準を維持しましょう。"}`
      : `患者満足度は${data.stats.averageScore.toFixed(2)}点（${label}）。${sectionCount}項目の分析を実施しました。${priority ? `最優先で「${priority}」への対策を進めてください。` : "改善施策の検討をお勧めします。"}`

  // DBに保存
  const report = await prisma.advisoryReport.create({
    data: {
      clinicId,
      triggerType,
      responseCount: data.stats.totalResponses,
      sections: JSON.parse(JSON.stringify(analysisResults)),
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
    sections: analysisResults,
    summary,
    priority,
    generatedAt: report.generatedAt.toISOString(),
  }
}

// ─── カウンター ───

export async function incrementAdvisoryCounter(clinicId: string): Promise<boolean> {
  await prisma.$executeRaw`
    UPDATE clinics SET settings = jsonb_set(
      settings,
      '{responsesSinceLastAdvisory}',
      to_jsonb(COALESCE((settings->>'responsesSinceLastAdvisory')::int, 0) + 1)
    )
    WHERE id = ${clinicId}::uuid
  `

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const threshold = settings.advisoryThreshold ?? ADVISORY.DEFAULT_THRESHOLD
  const current = settings.responsesSinceLastAdvisory ?? 0

  return current >= threshold
}
