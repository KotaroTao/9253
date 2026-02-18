import { prisma } from "@/lib/prisma"
import { DEFAULTS, MILESTONES, getRank, getNextRank } from "@/lib/constants"
import type { Rank } from "@/lib/constants"
import type { ClinicSettings } from "@/types"

export interface StreakBreakInfo {
  date: string // YYYY-MM-DD
  dayOfWeek: string // 月, 火, 水...
}

export interface WeekDayData {
  date: string // YYYY-MM-DD
  dayLabel: string // 月, 火, 水...
  count: number
  isClosed: boolean
  isToday: boolean
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
  weekDays: WeekDayData[]
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

  // Week start (past 7 days: today - 6 days)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)

  // Consolidate count/avg queries into a single raw SQL to reduce round-trips (7→4)
  interface AggRow {
    total_count: bigint
    today_count: bigint
    today_avg: number | null
    week_count: bigint
    week_avg: number | null
  }
  const [aggRows, streakResponses, positiveComments, clinic] =
    await Promise.all([
      prisma.$queryRaw<AggRow[]>`
        SELECT
          COUNT(*) AS total_count,
          COUNT(*) FILTER (WHERE responded_at >= ${todayStart}) AS today_count,
          ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${todayStart})::numeric, 1)::float AS today_avg,
          COUNT(*) FILTER (WHERE responded_at >= ${weekStart}) AS week_count,
          ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${weekStart})::numeric, 1)::float AS week_avg
        FROM survey_responses
        WHERE clinic_id = ${clinicId}::uuid
      `,

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
    ])

  const agg = aggRows[0]
  const totalCount = Number(agg.total_count)
  const todayCount = Number(agg.today_count)
  const weekCount = Number(agg.week_count)
  const weekAvgScore = agg.week_avg
  const todayAvgScore = agg.today_avg

  // Extract settings
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const dailyGoal = settings.dailyGoal ?? DEFAULTS.DAILY_SURVEY_GOAL
  const workingDaysPerWeek = settings.workingDaysPerWeek ?? 6
  const closedDates = new Set<string>(settings.closedDates ?? [])

  const todayKey = formatDateKey(todayStart)

  // Build date set for streak + weekly activity
  const dateSet = new Set<string>()
  for (const r of streakResponses) {
    const d = new Date(r.respondedAt)
    dateSet.add(formatDateKey(d))
  }

  // Calculate weekly active days (past 7 days) and per-day data
  let weekActiveDays = 0
  const weekDays: WeekDayData[] = []

  // Build per-day count map for the week
  const weekDayCountMap = new Map<string, number>()
  for (const r of streakResponses) {
    const d = new Date(r.respondedAt)
    const key = formatDateKey(d)
    if (key >= formatDateKey(weekStart) && key <= todayKey) {
      weekDayCountMap.set(key, (weekDayCountMap.get(key) ?? 0) + 1)
    }
  }

  const weekCheck = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const key = formatDateKey(weekCheck)
    const count = weekDayCountMap.get(key) ?? 0
    if (count > 0) {
      weekActiveDays++
    }
    weekDays.push({
      date: key,
      dayLabel: getDayOfWeekJa(weekCheck),
      count,
      isClosed: closedDates.has(key),
      isToday: key === todayKey,
    })
    weekCheck.setDate(weekCheck.getDate() + 1)
  }

  // Calculate streak: skip closed dates (treat as non-existent days)
  let streak = 0
  let streakBreak: StreakBreakInfo | null = null
  const checkDate = new Date(todayStart)

  // If today has no surveys yet, start counting from yesterday
  // (today is still in progress, not a "missed" day)
  if (!dateSet.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  for (let i = 0; i < 90; i++) {
    const key = formatDateKey(checkDate)
    if (closedDates.has(key)) {
      // Closed day — skip entirely, doesn't count as gap or active
      checkDate.setDate(checkDate.getDate() - 1)
      continue
    }
    if (dateSet.has(key)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      // Only show streak break if:
      // 1. The day is NOT today (today is still in progress)
      // 2. There was a prior streak (don't show break if brand new)
      if (key !== todayKey && streak > 0) {
        streakBreak = { date: key, dayOfWeek: getDayOfWeekJa(checkDate) }
      }
      break
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
    rankProgress = Math.min(Math.round(((totalCount - currentMin) / (nextMin - currentMin)) * 100), 100)
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
    weekCount,
    weekAvgScore: weekAvgScore ?? null,
    weekActiveDays,
    workingDaysPerWeek,
    weekDays,
    todayAvgScore: todayAvgScore ?? null,
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
