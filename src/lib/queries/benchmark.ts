import { prisma } from "@/lib/prisma"

export interface BenchmarkMetric {
  clinicValue: number
  platformAvg: number
  /** 0-100, higher = better relative position */
  percentile: number
}

export interface BenchmarkData {
  satisfaction: BenchmarkMetric | null
  monthlyCount: BenchmarkMetric | null
  totalClinics: number
  hasEnoughData: boolean
}

const MIN_CLINICS = 3
const MIN_RESPONSES_PER_CLINIC = 5

export async function getClinicBenchmark(
  clinicId: string
): Promise<BenchmarkData> {
  const now = new Date()

  // Last 3 months for satisfaction comparison
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  // This month for response count comparison
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [scoresByClinic, countsByClinic] = await Promise.all([
    // Average satisfaction per clinic (last 3 months, min responses required)
    prisma.surveyResponse.groupBy({
      by: ["clinicId"],
      where: { respondedAt: { gte: threeMonthsAgo } },
      _avg: { overallScore: true },
      _count: { _all: true },
      having: { id: { _count: { gte: MIN_RESPONSES_PER_CLINIC } } },
    }),

    // This month's response count per clinic
    prisma.surveyResponse.groupBy({
      by: ["clinicId"],
      where: { respondedAt: { gte: thisMonthStart } },
      _count: { _all: true },
    }),
  ])

  const totalClinics = scoresByClinic.length
  const hasEnoughData = totalClinics >= MIN_CLINICS

  let satisfaction: BenchmarkMetric | null = null
  let monthlyCount: BenchmarkMetric | null = null

  if (hasEnoughData) {
    // Satisfaction benchmark
    const scores = scoresByClinic
      .map((c) => ({
        clinicId: c.clinicId,
        avg: c._avg.overallScore ?? 0,
      }))
      .filter((c) => c.avg > 0)

    const myScore = scores.find((c) => c.clinicId === clinicId)
    if (myScore) {
      const allScores = scores.map((c) => c.avg)
      const platformAvg =
        allScores.reduce((sum, v) => sum + v, 0) / allScores.length

      satisfaction = {
        clinicValue: Math.round(myScore.avg * 10) / 10,
        platformAvg: Math.round(platformAvg * 10) / 10,
        percentile: calcPercentile(allScores, myScore.avg),
      }
    }

    // Monthly count benchmark
    const counts = countsByClinic.map((c) => ({
      clinicId: c.clinicId,
      count: c._count._all,
    }))

    const myCount = counts.find((c) => c.clinicId === clinicId)
    // Even if clinic has 0 this month, show position
    const clinicMonthlyCount = myCount?.count ?? 0
    const allCounts = counts.map((c) => c.count)
    // Include 0 for this clinic if not already present
    if (!myCount) allCounts.push(0)
    const platformAvgCount =
      allCounts.reduce((sum, v) => sum + v, 0) / allCounts.length

    monthlyCount = {
      clinicValue: clinicMonthlyCount,
      platformAvg: Math.round(platformAvgCount),
      percentile: calcPercentile(allCounts, clinicMonthlyCount),
    }
  }

  return { satisfaction, monthlyCount, totalClinics, hasEnoughData }
}

function calcPercentile(values: number[], target: number): number {
  if (values.length <= 1) return 100
  const sorted = [...values].sort((a, b) => a - b)
  const below = sorted.filter((v) => v < target).length
  return Math.round((below / (sorted.length - 1)) * 100)
}
