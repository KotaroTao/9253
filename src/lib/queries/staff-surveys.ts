import { prisma } from "@/lib/prisma"
import {
  STAFF_SURVEY_QUESTIONS,
  STAFF_SURVEY_CATEGORIES,
  DEFAULTS,
  type StaffSurveyCategory,
} from "@/lib/constants"
import type { StaffSurveyCategoryScore } from "@/types"

export async function createStaffSurvey(clinicId: string, title: string) {
  return prisma.staffSurvey.create({
    data: { clinicId, title },
  })
}

export async function closeStaffSurvey(surveyId: string, clinicId: string) {
  return prisma.staffSurvey.update({
    where: { id: surveyId, clinicId },
    data: { status: "closed", endsAt: new Date() },
  })
}

export async function getActiveStaffSurvey(clinicId: string) {
  return prisma.staffSurvey.findFirst({
    where: { clinicId, status: "active" },
    include: { _count: { select: { responses: true } } },
  })
}

export async function getStaffSurveyById(surveyId: string) {
  return prisma.staffSurvey.findUnique({
    where: { id: surveyId },
    include: { _count: { select: { responses: true } } },
  })
}

export async function getStaffSurveys(clinicId: string) {
  const surveys = await prisma.staffSurvey.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  })

  return surveys.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    responseCount: s._count.responses,
    overallScore: null as number | null,
  }))
}

export async function submitStaffSurveyResponse(
  surveyId: string,
  answers: Record<string, number>,
  freeText?: string
) {
  const ratingValues = Object.values(answers).filter(
    (v): v is number => typeof v === "number"
  )
  const overallScore =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
      : null

  // Calculate category scores
  const categoryScores: Record<string, { total: number; count: number }> = {}
  for (const q of STAFF_SURVEY_QUESTIONS) {
    const val = answers[q.id]
    if (typeof val === "number") {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0 }
      }
      categoryScores[q.category].total += val
      categoryScores[q.category].count++
    }
  }

  const catScoreMap: Record<string, number> = {}
  for (const [cat, data] of Object.entries(categoryScores)) {
    catScoreMap[cat] = data.count > 0 ? data.total / data.count : 0
  }

  return prisma.staffSurveyResponse.create({
    data: {
      surveyId,
      answers,
      freeText,
      overallScore,
      categoryScores: catScoreMap,
    },
  })
}

export async function getStaffSurveyResults(surveyId: string, clinicId: string) {
  const survey = await prisma.staffSurvey.findFirst({
    where: { id: surveyId, clinicId },
  })

  if (!survey) return null

  const responses = await prisma.staffSurveyResponse.findMany({
    where: { surveyId },
  })

  const responseCount = responses.length
  if (responseCount < DEFAULTS.STAFF_SURVEY_MIN_RESPONSES) {
    return {
      id: survey.id,
      title: survey.title,
      status: survey.status,
      responseCount,
      overallScore: null,
      categoryScores: [],
      freeTexts: [],
    }
  }

  // Aggregate overall score
  const totalScore = responses.reduce(
    (sum, r) => sum + (r.overallScore ?? 0),
    0
  )
  const overallScore =
    responseCount > 0
      ? Math.round((totalScore / responseCount) * 10) / 10
      : null

  // Aggregate category scores
  const catTotals: Record<string, { total: number; count: number }> = {}
  for (const r of responses) {
    const scores = r.categoryScores as Record<string, number> | null
    if (!scores) continue
    for (const [cat, score] of Object.entries(scores)) {
      if (!catTotals[cat]) catTotals[cat] = { total: 0, count: 0 }
      catTotals[cat].total += score
      catTotals[cat].count++
    }
  }

  const categoryScores: StaffSurveyCategoryScore[] = Object.entries(catTotals)
    .map(([cat, data]) => ({
      category: cat,
      label: STAFF_SURVEY_CATEGORIES[cat as StaffSurveyCategory] ?? cat,
      score:
        data.count > 0
          ? Math.round((data.total / data.count) * 10) / 10
          : 0,
    }))

  // Collect free texts (anonymized)
  const freeTexts = responses
    .map((r) => r.freeText)
    .filter((t): t is string => !!t)

  return {
    id: survey.id,
    title: survey.title,
    status: survey.status,
    responseCount,
    overallScore,
    categoryScores,
    freeTexts,
  }
}

export async function getLatestStaffSurveyScore(clinicId: string) {
  const latestSurvey = await prisma.staffSurvey.findFirst({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    include: {
      responses: {
        select: { overallScore: true, categoryScores: true },
      },
      _count: { select: { responses: true } },
    },
  })

  if (
    !latestSurvey ||
    latestSurvey._count.responses < DEFAULTS.STAFF_SURVEY_MIN_RESPONSES
  ) {
    return null
  }

  const responses = latestSurvey.responses
  const totalScore = responses.reduce(
    (sum, r) => sum + (r.overallScore ?? 0),
    0
  )
  const overallScore = Math.round((totalScore / responses.length) * 10) / 10

  // Aggregate category scores
  const catTotals: Record<string, { total: number; count: number }> = {}
  for (const r of responses) {
    const scores = r.categoryScores as Record<string, number> | null
    if (!scores) continue
    for (const [cat, score] of Object.entries(scores)) {
      if (!catTotals[cat]) catTotals[cat] = { total: 0, count: 0 }
      catTotals[cat].total += score
      catTotals[cat].count++
    }
  }

  const categoryScores: StaffSurveyCategoryScore[] = Object.entries(catTotals)
    .map(([cat, data]) => ({
      category: cat,
      label: STAFF_SURVEY_CATEGORIES[cat as StaffSurveyCategory] ?? cat,
      score:
        data.count > 0
          ? Math.round((data.total / data.count) * 10) / 10
          : 0,
    }))

  return { overallScore, categoryScores, surveyTitle: latestSurvey.title }
}
