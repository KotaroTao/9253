import { prisma } from "@/lib/prisma"

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

  const [totalResponses, avgScore, reviewStats, recentResponses, staffRanking] =
    await Promise.all([
      prisma.surveyResponse.count({ where }),

      prisma.surveyResponse.aggregate({
        where,
        _avg: { overallScore: true },
      }),

      prisma.surveyResponse.aggregate({
        where: { ...where, reviewRequested: true },
        _count: { _all: true },
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

  // Get review click count separately
  const reviewClickCount = await prisma.surveyResponse.count({
    where: { ...where, reviewClicked: true },
  })

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

  return {
    totalResponses,
    averageScore: avgScore._avg.overallScore ?? 0,
    reviewClickRate:
      totalResponses > 0
        ? Math.round((reviewClickCount / totalResponses) * 1000) / 10
        : 0,
    reviewClickCount,
    reviewRequestedCount: reviewStats._count._all,
    recentResponses,
    staffRanking: enrichedStaffRanking,
  }
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
