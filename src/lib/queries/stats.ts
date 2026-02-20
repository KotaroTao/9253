import { prisma } from "@/lib/prisma"
import type { SatisfactionTrend } from "@/types"
import {
  jstNowParts,
  jstDaysAgo,
  jstEndOfDay,
  jstStartOfMonth,
  jstEndOfMonth,
  jstMonthsAgoStart,
  jstMonthKey,
} from "@/lib/date-jst"

export async function getDashboardStats(
  clinicId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  // Previous month boundaries (JST)
  const { year, month } = jstNowParts()
  const prevStart = jstStartOfMonth(year, month - 1)
  const prevEnd = jstEndOfMonth(year, month - 1)

  // Consolidate count + avg + prevAvg into single raw SQL (4 queries → 1 + 1)
  interface StatsRow {
    total_responses: bigint
    avg_score: number | null
    prev_avg_score: number | null
    prev_count: bigint
  }
  const hasDateRange = dateFrom && dateTo

  const statsRows = await (hasDateRange
    ? prisma.$queryRaw<StatsRow[]>`
        SELECT
          COUNT(*) FILTER (WHERE responded_at >= ${dateFrom} AND responded_at <= ${dateTo}) AS total_responses,
          ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${dateFrom} AND responded_at <= ${dateTo})::numeric, 2)::float AS avg_score,
          ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${prevStart} AND responded_at <= ${prevEnd})::numeric, 2)::float AS prev_avg_score,
          COUNT(*) FILTER (WHERE responded_at >= ${prevStart} AND responded_at <= ${prevEnd}) AS prev_count
        FROM survey_responses
        WHERE clinic_id = ${clinicId}::uuid
      `
    : prisma.$queryRaw<StatsRow[]>`
        SELECT
          COUNT(*) AS total_responses,
          ROUND(AVG(overall_score)::numeric, 2)::float AS avg_score,
          ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${prevStart} AND responded_at <= ${prevEnd})::numeric, 2)::float AS prev_avg_score,
          COUNT(*) FILTER (WHERE responded_at >= ${prevStart} AND responded_at <= ${prevEnd}) AS prev_count
        FROM survey_responses
        WHERE clinic_id = ${clinicId}::uuid
      `)

  const stats = statsRows[0]

  return {
    totalResponses: Number(stats.total_responses),
    averageScore: stats.avg_score ?? 0,
    prevAverageScore:
      Number(stats.prev_count) > 0 ? (stats.prev_avg_score ?? null) : null,
  }
}

export async function getMonthlySurveyQuality(
  clinicId: string,
  year: number,
  month: number
) {
  const startDate = jstStartOfMonth(year, month)
  const endDate = jstEndOfMonth(year, month)

  const [lowScoreCount, breakdown] = await Promise.all([
    prisma.surveyResponse.count({
      where: { clinicId, respondedAt: { gte: startDate, lte: endDate }, overallScore: { lte: 3 } },
    }),
    getQuestionBreakdownByDays(clinicId, 30),
  ])

  const lowScoreQuestions: Array<{ text: string; avgScore: number }> = []
  for (const template of breakdown) {
    for (const q of template.questions) {
      if (q.avgScore > 0 && q.avgScore < 4.0) {
        lowScoreQuestions.push({ text: q.text, avgScore: q.avgScore })
      }
    }
  }
  lowScoreQuestions.sort((a, b) => a.avgScore - b.avgScore)

  return { lowScoreCount, lowScoreQuestions }
}

export async function getMonthlySurveyCount(
  clinicId: string,
  year: number,
  month: number
) {
  const startDate = jstStartOfMonth(year, month)
  const endDate = jstEndOfMonth(year, month)

  return prisma.surveyResponse.count({
    where: {
      clinicId,
      respondedAt: { gte: startDate, lte: endDate },
    },
  })
}

interface MonthlyTrendRow {
  month: string
  avg_score: number | null
  count: bigint
}

export async function getMonthlyTrend(clinicId: string, months: number = 6) {
  const startDate = jstMonthsAgoStart(months)

  const rows = await prisma.$queryRaw<MonthlyTrendRow[]>`
    SELECT
      TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') as month,
      ROUND(AVG(overall_score)::numeric, 1)::float as avg_score,
      COUNT(*) as count
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${startDate}
    GROUP BY TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM')
    ORDER BY month ASC
  `

  return rows.map((r) => ({
    month: r.month,
    avgScore: r.avg_score ?? 0,
    count: Number(r.count),
  }))
}

/**
 * Combined monthly trends — fetches 12 months of data in a single query
 * and returns both monthlyTrend (last 6 months) and satisfactionTrend (last 12 months).
 * This replaces separate getMonthlyTrend + getSatisfactionTrend calls on the dashboard.
 */
export async function getCombinedMonthlyTrends(clinicId: string) {
  const startDate = jstMonthsAgoStart(12)

  const rows = await prisma.$queryRaw<MonthlyTrendRow[]>`
    SELECT
      TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') as month,
      ROUND(AVG(overall_score)::numeric, 1)::float as avg_score,
      COUNT(*) as count
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${startDate}
    GROUP BY TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM')
    ORDER BY month ASC
  `

  // satisfactionTrend = full 12 months
  const satisfactionTrend: SatisfactionTrend[] = rows.map((r) => ({
    month: r.month,
    patientSatisfaction: r.avg_score ?? null,
  }))

  // monthlyTrend = last 6 months only
  const sixMonthKey = jstMonthKey(6)

  const monthlyTrend = rows
    .filter((r) => r.month >= sixMonthKey)
    .map((r) => ({
      month: r.month,
      avgScore: r.avg_score ?? 0,
      count: Number(r.count),
    }))

  return { monthlyTrend, satisfactionTrend }
}

export interface QuestionScore {
  questionId: string
  text: string
  avgScore: number
  count: number
}

export interface TemplateQuestionScores {
  templateName: string
  responseCount: number
  questions: QuestionScore[]
}

interface QuestionBreakdownRow {
  template_id: string
  question_id: string
  avg_score: number | null
  count: bigint
}

export async function getQuestionBreakdown(
  clinicId: string,
  months: number = 3
): Promise<TemplateQuestionScores[]> {
  // Get active templates with question definitions
  const templates = await prisma.surveyTemplate.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, questions: true },
  })

  if (templates.length === 0) return []

  // Limit to recent N months to avoid full table scan on JSONB expansion
  const sinceDate = jstMonthsAgoStart(months)

  // Aggregate scores per template + question key in DB
  const templateIds = templates.map((t) => t.id)
  const rows = await prisma.$queryRaw<QuestionBreakdownRow[]>`
    SELECT
      template_id,
      key as question_id,
      ROUND(AVG(value::numeric), 1)::float as avg_score,
      COUNT(*) as count
    FROM survey_responses,
      jsonb_each_text(answers)
    WHERE clinic_id = ${clinicId}::uuid
      AND template_id = ANY(${templateIds}::uuid[])
      AND responded_at >= ${sinceDate}
    GROUP BY template_id, key
  `

  // Count responses per template (same date range)
  const responseCounts = await prisma.surveyResponse.groupBy({
    by: ["templateId"],
    where: { clinicId, templateId: { in: templateIds }, respondedAt: { gte: sinceDate } },
    _count: { _all: true },
  })
  const countMap = new Map(responseCounts.map((r) => [r.templateId, r._count._all]))

  // Build score map: templateId -> questionId -> { avgScore, count }
  const scoreMap = new Map<string, Map<string, { avgScore: number; count: number }>>()
  for (const row of rows) {
    if (!scoreMap.has(row.template_id)) {
      scoreMap.set(row.template_id, new Map())
    }
    scoreMap.get(row.template_id)!.set(row.question_id, {
      avgScore: row.avg_score ?? 0,
      count: Number(row.count),
    })
  }

  const result: TemplateQuestionScores[] = []

  for (const template of templates) {
    const responseCount = countMap.get(template.id) ?? 0
    if (responseCount === 0) continue

    const questions = template.questions as Array<{ id: string; text: string }>
    const templateScores = scoreMap.get(template.id)

    const questionScores: QuestionScore[] = questions.map((q) => {
      const score = templateScores?.get(q.id)
      return {
        questionId: q.id,
        text: q.text,
        avgScore: score?.avgScore ?? 0,
        count: score?.count ?? 0,
      }
    })

    result.push({
      templateName: template.name,
      responseCount,
      questions: questionScores,
    })
  }

  return result
}

export async function getQuestionBreakdownByDays(
  clinicId: string,
  days: number = 30,
  fromDate?: Date,
  toDate?: Date,
): Promise<TemplateQuestionScores[]> {
  const templates = await prisma.surveyTemplate.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, questions: true },
  })

  if (templates.length === 0) return []

  const sinceDate = fromDate ?? jstDaysAgo(days)
  const untilDate = toDate ?? jstEndOfDay(0)

  const templateIds = templates.map((t) => t.id)
  const rows = await prisma.$queryRaw<QuestionBreakdownRow[]>`
    SELECT
      template_id,
      key as question_id,
      ROUND(AVG(value::numeric), 2)::float as avg_score,
      COUNT(*) as count
    FROM survey_responses,
      jsonb_each_text(answers)
    WHERE clinic_id = ${clinicId}::uuid
      AND template_id = ANY(${templateIds}::uuid[])
      AND responded_at >= ${sinceDate}
      AND responded_at <= ${untilDate}
    GROUP BY template_id, key
  `

  const responseCounts = await prisma.surveyResponse.groupBy({
    by: ["templateId"],
    where: { clinicId, templateId: { in: templateIds }, respondedAt: { gte: sinceDate, lte: untilDate } },
    _count: { _all: true },
  })
  const countMap = new Map(responseCounts.map((r) => [r.templateId, r._count._all]))

  const scoreMap = new Map<string, Map<string, { avgScore: number; count: number }>>()
  for (const row of rows) {
    if (!scoreMap.has(row.template_id)) {
      scoreMap.set(row.template_id, new Map())
    }
    scoreMap.get(row.template_id)!.set(row.question_id, {
      avgScore: row.avg_score ?? 0,
      count: Number(row.count),
    })
  }

  const result: TemplateQuestionScores[] = []

  for (const template of templates) {
    const responseCount = countMap.get(template.id) ?? 0
    if (responseCount === 0) continue

    const questions = template.questions as Array<{ id: string; text: string }>
    const templateScores = scoreMap.get(template.id)

    const questionScores: QuestionScore[] = questions.map((q) => {
      const score = templateScores?.get(q.id)
      return {
        questionId: q.id,
        text: q.text,
        avgScore: score?.avgScore ?? 0,
        count: score?.count ?? 0,
      }
    })

    result.push({
      templateName: template.name,
      responseCount,
      questions: questionScores,
    })
  }

  return result
}

/**
 * Get current overall satisfaction score for a clinic (last 30 days average)
 */
export async function getCurrentSatisfactionScore(clinicId: string): Promise<number | null> {
  const since = jstDaysAgo(30)

  interface ScoreRow { avg_score: number | null }
  const rows = await prisma.$queryRaw<ScoreRow[]>`
    SELECT ROUND(AVG(overall_score)::numeric, 2)::float AS avg_score
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${since}
      AND overall_score IS NOT NULL
  `
  return rows[0]?.avg_score ?? null
}

/**
 * Get current average score for a specific question (last 30 days)
 */
export async function getQuestionCurrentScore(
  clinicId: string,
  questionId: string,
): Promise<number | null> {
  const since = jstDaysAgo(30)

  interface QScoreRow { avg_score: number | null }
  const rows = await prisma.$queryRaw<QScoreRow[]>`
    SELECT ROUND(AVG((answers->> ${questionId})::numeric), 2)::float AS avg_score
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${since}
      AND answers ? ${questionId}
  `
  return rows[0]?.avg_score ?? null
}

/**
 * Get current average scores for multiple questions at once (last 30 days)
 */
export async function getQuestionCurrentScores(
  clinicId: string,
  questionIds: string[],
): Promise<Record<string, number>> {
  if (questionIds.length === 0) return {}

  const since = jstDaysAgo(30)

  interface QScoresRow { question_id: string; avg_score: number | null }
  const rows = await prisma.$queryRaw<QScoresRow[]>`
    SELECT
      key AS question_id,
      ROUND(AVG(value::numeric), 2)::float AS avg_score
    FROM survey_responses,
      jsonb_each_text(answers)
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${since}
      AND key = ANY(${questionIds}::text[])
    GROUP BY key
  `

  const result: Record<string, number> = {}
  for (const row of rows) {
    if (row.avg_score != null) {
      result[row.question_id] = row.avg_score
    }
  }
  return result
}

// --- Daily trend data (response count + avg score per day) ---

export interface DailyTrendPoint {
  date: string      // "MM/DD" format
  count: number
  avgScore: number | null
}

interface DailyTrendRow {
  date_label: string
  avg_score: number | null
  count: bigint
}

export async function getDailyTrend(
  clinicId: string,
  days: number = 30,
  fromDate?: Date,
  toDate?: Date,
): Promise<DailyTrendPoint[]> {
  const sinceDate = fromDate ?? jstDaysAgo(days)
  const untilDate = toDate ?? jstEndOfDay(0)

  const rows = await prisma.$queryRaw<DailyTrendRow[]>`
    SELECT
      TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'MM/DD') AS date_label,
      ROUND(AVG(overall_score)::numeric, 2)::float AS avg_score,
      COUNT(*) AS count
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${sinceDate}
      AND responded_at <= ${untilDate}
      AND overall_score IS NOT NULL
    GROUP BY (responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date, date_label
    ORDER BY (responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date ASC
  `

  return rows.map((r) => ({
    date: r.date_label,
    count: Number(r.count),
    avgScore: r.avg_score ?? null,
  }))
}

// --- Template-wise daily trend (avg score per template per day) ---

export interface TemplateTrendPoint {
  date: string
  templateName: string
  avgScore: number | null
  count: number
}

interface TemplateTrendRow {
  date_label: string
  template_name: string
  avg_score: number | null
  count: bigint
}

export async function getTemplateTrend(
  clinicId: string,
  days: number = 30,
  offsetDays: number = 0,
  fromDate?: Date,
  toDate?: Date,
): Promise<TemplateTrendPoint[]> {
  const untilDate = toDate ?? jstEndOfDay(offsetDays)
  const sinceDate = fromDate ?? jstDaysAgo(offsetDays + days)

  const rows = await prisma.$queryRaw<TemplateTrendRow[]>`
    SELECT
      TO_CHAR(sr.responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'MM/DD') AS date_label,
      st.name AS template_name,
      ROUND(AVG(sr.overall_score)::numeric, 2)::float AS avg_score,
      COUNT(*) AS count
    FROM survey_responses sr
    JOIN survey_templates st ON sr.template_id = st.id
    WHERE sr.clinic_id = ${clinicId}::uuid
      AND sr.responded_at >= ${sinceDate}
      AND sr.responded_at <= ${untilDate}
      AND sr.overall_score IS NOT NULL
    GROUP BY (sr.responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date, date_label, st.name
    ORDER BY (sr.responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date ASC, st.name
  `

  return rows.map((r) => ({
    date: r.date_label,
    templateName: r.template_name,
    avgScore: r.avg_score ?? null,
    count: Number(r.count),
  }))
}

// --- Hourly heatmap data (day-of-week × hour) ---

export interface HeatmapCell {
  dayOfWeek: number // 0=Sun, 1=Mon, ..., 6=Sat
  hour: number      // 0-23
  avgScore: number
  count: number
}

interface HeatmapRow {
  day_of_week: number
  hour: number
  avg_score: number
  count: bigint
}

export async function getHourlyHeatmapData(
  clinicId: string,
  days: number = 90,
  fromDate?: Date,
  toDate?: Date,
): Promise<HeatmapCell[]> {
  const sinceDate = fromDate ?? jstDaysAgo(days)
  const untilDate = toDate ?? jstEndOfDay(0)

  const rows = await prisma.$queryRaw<HeatmapRow[]>`
    SELECT
      EXTRACT(DOW FROM responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::int AS day_of_week,
      EXTRACT(HOUR FROM responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::int AS hour,
      ROUND(AVG(overall_score)::numeric, 2)::float AS avg_score,
      COUNT(*) AS count
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${sinceDate}
      AND responded_at <= ${untilDate}
      AND overall_score IS NOT NULL
    GROUP BY day_of_week, hour
    ORDER BY day_of_week, hour
  `

  return rows.map((r) => ({
    dayOfWeek: r.day_of_week,
    hour: r.hour,
    avgScore: r.avg_score,
    count: Number(r.count),
  }))
}

interface SatisfactionTrendRow {
  month: string
  patient_satisfaction: number | null
}

export async function getSatisfactionTrend(
  clinicId: string,
  months: number = 12
): Promise<SatisfactionTrend[]> {
  const startDate = jstMonthsAgoStart(months)

  const rows = await prisma.$queryRaw<SatisfactionTrendRow[]>`
    SELECT
      TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') as month,
      ROUND(AVG(overall_score)::numeric, 1)::float as patient_satisfaction
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${startDate}
    GROUP BY TO_CHAR(responded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM')
    ORDER BY month ASC
  `

  return rows.map((r) => ({
    month: r.month,
    patientSatisfaction: r.patient_satisfaction,
  }))
}
