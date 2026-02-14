import { prisma } from "@/lib/prisma"
import { DEFAULTS, MILESTONES } from "@/lib/constants"

export interface EngagementData {
  todayCount: number
  dailyGoal: number
  streak: number
  totalCount: number
  currentMilestone: number | null
  nextMilestone: number | null
  positiveComment: string | null
}

export async function getStaffEngagementData(
  clinicId: string
): Promise<EngagementData> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const streakStart = new Date(todayStart)
  streakStart.setDate(streakStart.getDate() - 90)

  const commentStart = new Date(todayStart)
  commentStart.setDate(commentStart.getDate() - 30)

  const [todayCount, totalCount, streakResponses, positiveComments, clinic] =
    await Promise.all([
      prisma.surveyResponse.count({
        where: { clinicId, respondedAt: { gte: todayStart } },
      }),

      prisma.surveyResponse.count({
        where: { clinicId },
      }),

      prisma.surveyResponse.findMany({
        where: { clinicId, respondedAt: { gte: streakStart } },
        select: { respondedAt: true },
        orderBy: { respondedAt: "desc" },
      }),

      prisma.surveyResponse.findMany({
        where: {
          clinicId,
          overallScore: { gte: 4 },
          freeText: { not: null },
          respondedAt: { gte: commentStart },
        },
        select: { freeText: true },
        orderBy: { respondedAt: "desc" },
        take: 20,
      }),

      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { settings: true },
      }),
    ])

  // Calculate streak: consecutive days with surveys
  const dateSet = new Set<string>()
  for (const r of streakResponses) {
    const d = new Date(r.respondedAt)
    dateSet.add(formatDateKey(d))
  }

  let streak = 0
  const checkDate = new Date(todayStart)

  // If today has no surveys yet, start counting from yesterday
  if (!dateSet.has(formatDateKey(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  for (let i = 0; i < 90; i++) {
    if (dateSet.has(formatDateKey(checkDate))) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Daily goal from clinic settings or default
  const settings = clinic?.settings as Record<string, unknown> | null
  const dailyGoal =
    typeof settings?.dailyGoal === "number"
      ? settings.dailyGoal
      : DEFAULTS.DAILY_SURVEY_GOAL

  // Milestones
  const currentMilestone =
    MILESTONES.filter((m) => totalCount >= m).pop() ?? null
  const nextMilestone = MILESTONES.find((m) => totalCount < m) ?? null

  // Pick a random positive comment
  const candidates = positiveComments.filter((c) => c.freeText)
  const positiveComment =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)].freeText
      : null

  return {
    todayCount,
    dailyGoal,
    streak,
    totalCount,
    currentMilestone,
    nextMilestone,
    positiveComment,
  }
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
