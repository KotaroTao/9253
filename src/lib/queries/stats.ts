import { prisma } from "@/lib/prisma"
import type { SatisfactionTrend } from "@/types"

export async function getDashboardStats(
  clinicId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const where = {
    clinicId,
    ...(dateFrom &&
      dateTo && {
        respondedAt: { gte: dateFrom, lte: dateTo },
      }),
  }

  const [totalResponses, avgScore, recentResponses] =
    await Promise.all([
      prisma.surveyResponse.count({ where }),

      prisma.surveyResponse.aggregate({
        where,
        _avg: { overallScore: true },
      }),

      prisma.surveyResponse.findMany({
        where: { clinicId },
        orderBy: { respondedAt: "desc" },
        take: 10,
        select: {
          id: true,
          overallScore: true,
          freeText: true,
          patientAttributes: true,
          respondedAt: true,
          staff: { select: { name: true, role: true } },
        },
      }),
    ])

  // Previous month avg for comparison
  const prevStart = new Date()
  prevStart.setMonth(prevStart.getMonth() - 1)
  prevStart.setDate(1)
  prevStart.setHours(0, 0, 0, 0)
  const prevEnd = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0, 23, 59, 59)

  const prevAvg = await prisma.surveyResponse.aggregate({
    where: { clinicId, respondedAt: { gte: prevStart, lte: prevEnd } },
    _avg: { overallScore: true },
    _count: { _all: true },
  })

  return {
    totalResponses,
    averageScore: avgScore._avg.overallScore ?? 0,
    prevAverageScore:
      prevAvg._count._all > 0 ? (prevAvg._avg.overallScore ?? null) : null,
    recentResponses,
  }
}

export async function getMonthlySurveyQuality(
  clinicId: string,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)
  const where = { clinicId, respondedAt: { gte: startDate, lte: endDate } }

  const [lowScoreCount, freeTextCount, totalCount] = await Promise.all([
    prisma.surveyResponse.count({ where: { ...where, overallScore: { lte: 3 } } }),
    prisma.surveyResponse.count({ where: { ...where, freeText: { not: null } } }),
    prisma.surveyResponse.count({ where }),
  ])

  return {
    lowScoreCount,
    freeTextRate: totalCount > 0 ? Math.round((freeTextCount / totalCount) * 1000) / 10 : null,
  }
}

export async function getMonthlySurveyCount(
  clinicId: string,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

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
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const rows = await prisma.$queryRaw<MonthlyTrendRow[]>`
    SELECT
      TO_CHAR(responded_at, 'YYYY-MM') as month,
      ROUND(AVG(overall_score)::numeric, 1)::float as avg_score,
      COUNT(*) as count
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${startDate}
    GROUP BY TO_CHAR(responded_at, 'YYYY-MM')
    ORDER BY month ASC
  `

  return rows.map((r) => ({
    month: r.month,
    avgScore: r.avg_score ?? 0,
    count: Number(r.count),
  }))
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
  clinicId: string
): Promise<TemplateQuestionScores[]> {
  // Get active templates with question definitions
  const templates = await prisma.surveyTemplate.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, questions: true },
  })

  if (templates.length === 0) return []

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
    GROUP BY template_id, key
  `

  // Count responses per template
  const responseCounts = await prisma.surveyResponse.groupBy({
    by: ["templateId"],
    where: { clinicId, templateId: { in: templateIds } },
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

interface SatisfactionTrendRow {
  month: string
  patient_satisfaction: number | null
}

export async function getSatisfactionTrend(
  clinicId: string,
  months: number = 12
): Promise<SatisfactionTrend[]> {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const rows = await prisma.$queryRaw<SatisfactionTrendRow[]>`
    SELECT
      TO_CHAR(responded_at, 'YYYY-MM') as month,
      ROUND(AVG(overall_score)::numeric, 1)::float as patient_satisfaction
    FROM survey_responses
    WHERE clinic_id = ${clinicId}::uuid
      AND responded_at >= ${startDate}
    GROUP BY TO_CHAR(responded_at, 'YYYY-MM')
    ORDER BY month ASC
  `

  return rows.map((r) => ({
    month: r.month,
    patientSatisfaction: r.patient_satisfaction,
  }))
}
