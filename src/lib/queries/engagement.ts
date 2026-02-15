import { prisma } from "@/lib/prisma"
import { DEFAULTS, MILESTONES, getRank, getNextRank } from "@/lib/constants"
import type { Rank } from "@/lib/constants"

export interface StreakBreakInfo {
  date: string // YYYY-MM-DD
  dayOfWeek: string // 月, 火, 水...
}

export interface EngagementData {
  todayCount: number
  dailyGoal: number
  streak: number
  totalCount: number
  currentMilestone: number | null
  nextMilestone: number | null
  positiveComment: string | null
  // Rank system
  rank: Rank
  nextRank: Rank | null
  rankProgress: number // 0-100
  // Week data
  weekCount: number
  weekAvgScore: number | null
  weekActiveDays: number
  workingDaysPerWeek: number
  // Today's mood
  todayAvgScore: number | null
  // Streak break recovery
  streakBreak: StreakBreakInfo | null
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

  // Week start (Monday)
  const weekStart = new Date(todayStart)
  const dayOfWeek = weekStart.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  weekStart.setDate(weekStart.getDate() - daysToMonday)

  const [todayCount, totalCount, streakResponses, positiveComments, clinic, weekData, todayData] =
    await Promise.all([
      prisma.surveyResponse.count({
        where: { clinicId, respondedAt: { gte: todayStart } },
      }),

      prisma.surveyResponse.count({
        where: { clinicId },
      }),

      // Only fetch respondedAt for streak calculation (minimal data)
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

      // Week aggregate
      prisma.surveyResponse.aggregate({
        where: { clinicId, respondedAt: { gte: weekStart } },
        _count: { _all: true },
        _avg: { overallScore: true },
      }),

      // Today's average score for happiness meter
      prisma.surveyResponse.aggregate({
        where: { clinicId, respondedAt: { gte: todayStart } },
        _avg: { overallScore: true },
      }),
    ])

  // Extract settings
  const settings = clinic?.settings as Record<string, unknown> | null
  const dailyGoal =
    typeof settings?.dailyGoal === "number"
      ? settings.dailyGoal
      : DEFAULTS.DAILY_SURVEY_GOAL
  const workingDaysPerWeek =
    typeof settings?.workingDaysPerWeek === "number"
      ? settings.workingDaysPerWeek
      : 6
  const closedDates = new Set<string>(
    Array.isArray(settings?.closedDates) ? (settings.closedDates as string[]) : []
  )

  // Build date set for streak + weekly activity
  const dateSet = new Set<string>()
  for (const r of streakResponses) {
    const d = new Date(r.respondedAt)
    dateSet.add(formatDateKey(d))
  }

  // Calculate weekly active days (Mon-Sun)
  let weekActiveDays = 0
  const weekCheck = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    if (dateSet.has(formatDateKey(weekCheck))) {
      weekActiveDays++
    }
    weekCheck.setDate(weekCheck.getDate() + 1)
  }

  // Calculate streak: skip closed dates (treat as non-existent days)
  let streak = 0
  let streakBreak: StreakBreakInfo | null = null
  const checkDate = new Date(todayStart)

  // If today has no surveys yet, start counting from yesterday
  if (!dateSet.has(formatDateKey(checkDate))) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  let consecutiveGaps = 0
  const MAX_GRACE_DAYS = 1

  for (let i = 0; i < 90; i++) {
    const key = formatDateKey(checkDate)
    if (closedDates.has(key)) {
      // Closed day — skip entirely, doesn't count as gap or active
      checkDate.setDate(checkDate.getDate() - 1)
      continue
    }
    if (dateSet.has(key)) {
      streak++
      consecutiveGaps = 0
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      consecutiveGaps++
      if (consecutiveGaps > MAX_GRACE_DAYS) {
        // Streak broke here — record for recovery UI
        if (streak > 0 || consecutiveGaps === MAX_GRACE_DAYS + 1) {
          streakBreak = { date: key, dayOfWeek: getDayOfWeekJa(checkDate) }
        }
        break
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

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

  // Rank system
  const rank = getRank(totalCount)
  const nextRankObj = getNextRank(totalCount)
  let rankProgress = 100
  if (nextRankObj) {
    const currentMin = rank.minCount
    const nextMin = nextRankObj.minCount
    rankProgress = Math.round(((totalCount - currentMin) / (nextMin - currentMin)) * 100)
  }

  return {
    todayCount,
    dailyGoal,
    streak,
    totalCount,
    currentMilestone,
    nextMilestone,
    positiveComment,
    rank,
    nextRank: nextRankObj,
    rankProgress,
    weekCount: weekData._count._all,
    weekAvgScore: weekData._avg.overallScore
      ? Math.round(weekData._avg.overallScore * 10) / 10
      : null,
    weekActiveDays,
    workingDaysPerWeek,
    todayAvgScore: todayData._avg.overallScore
      ? Math.round(todayData._avg.overallScore * 10) / 10
      : null,
    streakBreak,
  }
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const DAY_NAMES_JA = ["日", "月", "火", "水", "木", "金", "土"]
function getDayOfWeekJa(date: Date): string {
  return DAY_NAMES_JA[date.getDay()]
}
