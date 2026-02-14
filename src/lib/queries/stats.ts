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

export async function getMonthlyTrend(clinicId: string, months: number = 6) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const responses = await prisma.surveyResponse.findMany({
    where: {
      clinicId,
      respondedAt: { gte: startDate },
    },
    select: {
      overallScore: true,
      respondedAt: true,
    },
    orderBy: { respondedAt: "asc" },
  })

  // Group by month
  const monthlyData = new Map<
    string,
    { totalScore: number; count: number }
  >()

  for (const r of responses) {
    const month = `${r.respondedAt.getFullYear()}-${String(r.respondedAt.getMonth() + 1).padStart(2, "0")}`
    const existing = monthlyData.get(month) ?? { totalScore: 0, count: 0 }
    existing.totalScore += r.overallScore ?? 0
    existing.count++
    monthlyData.set(month, existing)
  }

  return Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    avgScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 10) / 10 : 0,
    count: data.count,
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

export async function getQuestionBreakdown(
  clinicId: string
): Promise<TemplateQuestionScores[]> {
  // Get active templates with question definitions
  const templates = await prisma.surveyTemplate.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, questions: true },
  })

  // Get all survey responses grouped by template
  const responses = await prisma.surveyResponse.findMany({
    where: { clinicId },
    select: { templateId: true, answers: true },
  })

  const result: TemplateQuestionScores[] = []

  for (const template of templates) {
    const questions = template.questions as Array<{ id: string; text: string }>
    const templateResponses = responses.filter((r) => r.templateId === template.id)

    if (templateResponses.length === 0) continue

    const questionScores: QuestionScore[] = questions.map((q) => {
      let total = 0
      let count = 0
      for (const r of templateResponses) {
        const answers = r.answers as Record<string, number>
        if (answers[q.id] != null) {
          total += answers[q.id]
          count++
        }
      }
      return {
        questionId: q.id,
        text: q.text,
        avgScore: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
        count,
      }
    })

    result.push({
      templateName: template.name,
      responseCount: templateResponses.length,
      questions: questionScores,
    })
  }

  return result
}

export async function getSatisfactionTrend(
  clinicId: string,
  months: number = 12
): Promise<SatisfactionTrend[]> {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const patientResponses = await prisma.surveyResponse.findMany({
    where: { clinicId, respondedAt: { gte: startDate } },
    select: { overallScore: true, respondedAt: true },
    orderBy: { respondedAt: "asc" },
  })

  const patientMonthly = new Map<string, { total: number; count: number }>()
  for (const r of patientResponses) {
    const key = `${r.respondedAt.getFullYear()}-${String(r.respondedAt.getMonth() + 1).padStart(2, "0")}`
    const e = patientMonthly.get(key) ?? { total: 0, count: 0 }
    e.total += r.overallScore ?? 0
    e.count++
    patientMonthly.set(key, e)
  }

  return Array.from(patientMonthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      patientSatisfaction: data.count > 0
        ? Math.round((data.total / data.count) * 10) / 10
        : null,
    }))
}
