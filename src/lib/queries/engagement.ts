import { prisma } from "@/lib/prisma"
import { MILESTONES, getRank, getNextRank } from "@/lib/constants"
import type { Rank } from "@/lib/constants"
import type { ClinicSettings } from "@/types"
import {
  jstToday,
  jstDaysAgo,
  formatDateKeyJST,
  getDayOfWeekJaJST,
  getDayJST,
} from "@/lib/date-jst"

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
  streak: number
  totalCount: number
  currentMilestone: number | null
  nextMilestone: number | null
  positiveComment: string | null
  positiveCommentScore: number | null
  // Rank system
  rank: Rank
  nextRank: Rank | null
  rankProgress: number // 0-100
  // Week data
  weekCount: number
  weekAvgScore: number | null
  weekActiveDays: number
  weekDays: WeekDayData[]
  // Today's mood
  todayAvgScore: number | null
  // Streak break recovery
  streakBreak: StreakBreakInfo | null
}

export async function getStaffEngagementData(
  clinicId: string
): Promise<EngagementData> {
  // All date boundaries are JST-aware (midnight JST expressed as UTC timestamps)
  const todayStart = jstToday()
  const streakStart = jstDaysAgo(90)
  const commentStart = jstDaysAgo(30)

  // Week start (past 7 days: today - 6 days)
  const weekStart = jstDaysAgo(6)

  // Consolidate count/avg queries into a single raw SQL to reduce round-trips
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
        select: { freeText: true, overallScore: true },
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
  const closedDates = new Set<string>(settings.closedDates ?? [])
  const openDates = new Set<string>(settings.openDates ?? [])
  const regularClosedDays = new Set<number>(settings.regularClosedDays ?? [])

  const DAY_MS = 24 * 60 * 60 * 1000

  // Helper: check if a date is closed (ad-hoc or regular, with open override)
  function isClosedDate(dateKey: string, date: Date): boolean {
    if (openDates.has(dateKey)) return false
    return closedDates.has(dateKey) || regularClosedDays.has(getDayJST(date))
  }

  const todayKey = formatDateKeyJST(todayStart)

  // Build date→count map and dateSet from all responses (last 90 days)
  const dateCountMap = new Map<string, number>()
  const dateSet = new Set<string>()
  for (const r of streakResponses) {
    const key = formatDateKeyJST(new Date(r.respondedAt))
    dateSet.add(key)
    dateCountMap.set(key, (dateCountMap.get(key) ?? 0) + 1)
  }

  // Calculate weekly active days (past 7 days) and per-day data
  let weekActiveDays = 0
  const weekDays: WeekDayData[] = []
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart.getTime() + i * DAY_MS)
    const key = formatDateKeyJST(dayDate)
    const count = dateCountMap.get(key) ?? 0
    if (count > 0) {
      weekActiveDays++
    }
    weekDays.push({
      date: key,
      dayLabel: getDayOfWeekJaJST(dayDate),
      count,
      isClosed: isClosedDate(key, dayDate),
      isToday: key === todayKey,
    })
  }

  // Calculate streak: consecutive business days with 1+ responses (skip closed dates)
  let streak = 0
  let streakBreak: StreakBreakInfo | null = null
  let checkTime = todayStart.getTime()

  // If today has no surveys yet, start counting from yesterday
  // (today is still in progress, not a "missed" day)
  if (!dateSet.has(todayKey)) {
    checkTime -= DAY_MS
  }

  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(checkTime)
    const key = formatDateKeyJST(checkDate)
    if (isClosedDate(key, checkDate)) {
      // Closed day — skip entirely, doesn't count as gap or active
      checkTime -= DAY_MS
      continue
    }
    if (dateSet.has(key)) {
      streak++
      checkTime -= DAY_MS
    } else {
      // Only show streak break if:
      // 1. The day is NOT today (today is still in progress)
      // 2. There was a prior streak (don't show break if brand new)
      if (key !== todayKey && streak > 0) {
        streakBreak = { date: key, dayOfWeek: getDayOfWeekJaJST(checkDate) }
      }
      break
    }
  }

  // Milestones
  const currentMilestone =
    MILESTONES.filter((m) => totalCount >= m).pop() ?? null
  const nextMilestone = MILESTONES.find((m) => totalCount < m) ?? null

  // Pick a random positive comment (with score)
  const candidates = positiveComments.filter((c) => c.freeText)
  const picked =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null
  const positiveComment = picked?.freeText ?? null
  const positiveCommentScore = picked?.overallScore ?? null

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
    streak,
    totalCount,
    currentMilestone,
    nextMilestone,
    positiveComment,
    positiveCommentScore,
    rank,
    nextRank: nextRankObj,
    rankProgress,
    weekCount,
    weekAvgScore: weekAvgScore ?? null,
    weekActiveDays,
    weekDays,
    todayAvgScore: todayAvgScore ?? null,
    streakBreak,
  }
}
