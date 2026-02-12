import { prisma } from "@/lib/prisma"
import { DEFAULTS } from "@/lib/constants"
import type { FourMetricsTrend } from "@/types"

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

  const [totalResponses, avgScore, recentResponses, staffRanking] =
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
        include: {
          staff: { select: { name: true, role: true } },
        },
      }),

      prisma.surveyResponse.groupBy({
        by: ["staffId"],
        where,
        _avg: { overallScore: true },
        _count: { id: true },
      }),
    ])

  // Enrich staff ranking with names
  const staffIds = staffRanking.map((s) => s.staffId)
  const staffNames = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, name: true, role: true },
  })
  const staffNameMap = new Map(staffNames.map((s) => [s.id, s]))

  const enrichedStaffRanking = staffRanking
    .map((s) => ({
      staffId: s.staffId,
      name: staffNameMap.get(s.staffId)?.name ?? "不明",
      role: staffNameMap.get(s.staffId)?.role ?? "staff",
      avgScore: s._avg.overallScore ?? 0,
      responseCount: s._count.id,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

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
    staffRanking: enrichedStaffRanking,
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

export async function getFourMetricsTrend(
  clinicId: string,
  months: number = 12
): Promise<FourMetricsTrend[]> {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  // 1. Patient satisfaction (from survey responses, monthly)
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

  // 2. Employee satisfaction (from staff surveys)
  const staffSurveys = await prisma.staffSurvey.findMany({
    where: { clinicId, createdAt: { gte: startDate } },
    include: {
      responses: { select: { overallScore: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const employeeMonthly = new Map<string, number>()
  for (const s of staffSurveys) {
    if (s._count.responses < DEFAULTS.STAFF_SURVEY_MIN_RESPONSES) continue
    const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`
    const total = s.responses.reduce((sum, r) => sum + (r.overallScore ?? 0), 0)
    employeeMonthly.set(key, Math.round((total / s.responses.length) * 10) / 10)
  }

  // 3. Tally-based metrics (staff daily tallies aggregated by month)
  const tallies = await prisma.staffDailyTally.findMany({
    where: { clinicId, date: { gte: startDate } },
    select: { date: true, type: true, count: true },
  })

  const tallyMonthly = new Map<
    string,
    { new_patient: number; maintenance_transition: number; self_pay_proposal: number; self_pay_conversion: number }
  >()
  for (const t of tallies) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`
    const e = tallyMonthly.get(key) ?? {
      new_patient: 0, maintenance_transition: 0, self_pay_proposal: 0, self_pay_conversion: 0,
    }
    if (t.type in e) {
      e[t.type as keyof typeof e] += t.count
    }
    tallyMonthly.set(key, e)
  }

  const metricsMonthly = new Map<
    string,
    { maintenanceRate: number | null; selfPayRate: number | null }
  >()
  for (const [key, m] of Array.from(tallyMonthly.entries())) {
    metricsMonthly.set(key, {
      maintenanceRate:
        m.new_patient > 0
          ? Math.round((m.maintenance_transition / m.new_patient) * 1000) / 10
          : null,
      selfPayRate:
        m.self_pay_proposal > 0
          ? Math.round((m.self_pay_conversion / m.self_pay_proposal) * 1000) / 10
          : null,
    })
  }

  // Merge all months
  const allMonths = new Set<string>([
    ...Array.from(patientMonthly.keys()),
    ...Array.from(employeeMonthly.keys()),
    ...Array.from(metricsMonthly.keys()),
  ])

  return Array.from(allMonths)
    .sort()
    .map((month) => {
      const patient = patientMonthly.get(month)
      const metrics = metricsMonthly.get(month)
      return {
        month,
        patientSatisfaction: patient && patient.count > 0
          ? Math.round((patient.total / patient.count) * 10) / 10
          : null,
        employeeSatisfaction: employeeMonthly.get(month) ?? null,
        maintenanceRate: metrics?.maintenanceRate ?? null,
        selfPayRate: metrics?.selfPayRate ?? null,
      }
    })
}
