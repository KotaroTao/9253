import { prisma } from "@/lib/prisma"
import { MILESTONES, DEFAULTS, getRank, getNextRank } from "@/lib/constants"
import type { Rank } from "@/lib/constants"
import type { ClinicSettings } from "@/types"
import {
  jstToday,
  jstDaysAgo,
  jstNowParts,
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

export interface PatientComment {
  text: string
  score: number
  respondedAt: string // ISO string
}

export interface EngagementData {
  todayCount: number
  streak: number
  totalCount: number
  currentMilestone: number | null
  nextMilestone: number | null
  patientComments: PatientComment[]
  improvementComments: PatientComment[]
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
  // Daily goal
  dailyGoal: number
  dailyGoalSource: "metrics" | "responses" | "fallback"
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

  const [aggRows, streakResponses, positiveComments, lowScoreComments, clinic, prevMetrics] =
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
          overallScore: { gte: 4.5 },
          freeText: { not: null },
          isVerified: true,
          respondedAt: { gte: commentStart },
        },
        select: { freeText: true, overallScore: true, respondedAt: true },
        orderBy: { respondedAt: "desc" },
        take: 10,
      }),

      prisma.surveyResponse.findMany({
        where: {
          clinicId,
          overallScore: { lte: 3.0 },
          freeText: { not: null },
          isVerified: true,
          respondedAt: { gte: commentStart },
        },
        select: { freeText: true, overallScore: true, respondedAt: true },
        orderBy: { respondedAt: "desc" },
        take: 5,
      }),

      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { settings: true },
      }),

      // Previous month metrics for daily goal calculation
      (() => {
        const { year, month } = jstNowParts()
        const prevYear = month === 1 ? year - 1 : year
        const prevMonth = month === 1 ? 12 : month - 1
        return prisma.monthlyClinicMetrics.findUnique({
          where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
          select: { firstVisitCount: true, revisitCount: true, workingDays: true },
        })
      })(),
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

  // ─── Daily Goal Calculation ───
  let goalLevel = settings.goalLevel ?? 0
  let dailyGoal: number
  let dailyGoalSource: "metrics" | "responses" | "fallback"

  // Priority 1: Previous month's metrics
  const prevFirst = prevMetrics?.firstVisitCount ?? 0
  const prevRevisit = prevMetrics?.revisitCount ?? 0
  const prevWorkDays = prevMetrics?.workingDays ?? 0
  if (prevFirst + prevRevisit > 0 && prevWorkDays > 0) {
    const multiplier = DEFAULTS.GOAL_MULTIPLIERS[goalLevel] ?? 0.3
    dailyGoal = Math.max(1, Math.ceil(((prevFirst + prevRevisit) / prevWorkDays) * multiplier))
    dailyGoalSource = "metrics"
  } else {
    // Priority 2: Last 30 business days average response count
    let bizDays = 0
    let totalResponses = 0
    for (let i = 1; i <= 30; i++) {
      const d = new Date(todayStart.getTime() - i * DAY_MS)
      const key = formatDateKeyJST(d)
      if (isClosedDate(key, d)) continue
      bizDays++
      totalResponses += dateCountMap.get(key) ?? 0
    }
    if (bizDays > 0 && totalResponses > 0) {
      dailyGoal = Math.max(1, Math.ceil(totalResponses / bizDays))
      dailyGoalSource = "responses"
    } else {
      // Priority 3: Fallback
      dailyGoal = DEFAULTS.DAILY_GOAL_FALLBACK
      dailyGoalSource = "fallback"
    }
  }

  // ─── Goal Streak Evaluation (lazy, on dashboard load) ───
  // Only first request of the day per clinic triggers this (idempotent).
  // Uses atomic JSONB update to avoid read-modify-write races, and
  // fire-and-forget to avoid blocking the dashboard render.
  if (settings.goalLastCheckedDate !== todayKey) {
    let achieveStreak = settings.goalAchieveStreak ?? 0
    let missStreak = settings.goalMissStreak ?? 0

    // Walk backward from yesterday through unchecked business days
    for (let i = 1; i <= 30; i++) {
      const d = new Date(todayStart.getTime() - i * DAY_MS)
      const key = formatDateKeyJST(d)
      // Stop at the last checked date
      if (key === settings.goalLastCheckedDate) break
      // Skip closed days
      if (isClosedDate(key, d)) continue
      const dayCount = dateCountMap.get(key) ?? 0
      if (dayCount >= dailyGoal) {
        achieveStreak++
        missStreak = 0
      } else {
        missStreak++
        achieveStreak = 0
      }
      // Level adjustment
      if (achieveStreak >= DEFAULTS.GOAL_STREAK_THRESHOLD) {
        goalLevel = Math.min(2, goalLevel + 1)
        achieveStreak = 0
      }
      if (missStreak >= DEFAULTS.GOAL_STREAK_THRESHOLD) {
        goalLevel = Math.max(0, goalLevel - 1)
        missStreak = 0
      }
    }

    // Atomic JSONB merge — no read-modify-write race.
    // Fire-and-forget (not awaited) so dashboard render isn't blocked.
    // Concurrent requests produce identical values so duplicates are harmless.
    prisma.$executeRaw`
      UPDATE clinics
      SET settings = COALESCE(settings, '{}'::jsonb)
        || jsonb_build_object(
          'goalLevel', ${goalLevel}::int,
          'goalAchieveStreak', ${achieveStreak}::int,
          'goalMissStreak', ${missStreak}::int,
          'goalLastCheckedDate', ${todayKey}::text
        )
      WHERE id = ${clinicId}::uuid
    `.catch((err) => {
      console.error("[dailyGoal] Failed to persist goal streak:", err)
    })

    // Recalculate dailyGoal if level changed and source is metrics
    if (goalLevel !== (settings.goalLevel ?? 0) && dailyGoalSource === "metrics" && prevWorkDays > 0) {
      const multiplier = DEFAULTS.GOAL_MULTIPLIERS[goalLevel] ?? 0.3
      dailyGoal = Math.max(1, Math.ceil(((prevFirst + prevRevisit) / prevWorkDays) * multiplier))
    }
  }

  // Milestones
  const currentMilestone =
    MILESTONES.filter((m) => totalCount >= m).pop() ?? null
  const nextMilestone = MILESTONES.find((m) => totalCount < m) ?? null

  // Build patient comment arrays (positive + improvement hints)
  const patientComments: PatientComment[] = positiveComments
    .filter((c) => c.freeText && c.overallScore != null)
    .map((c) => ({
      text: c.freeText!,
      score: c.overallScore!,
      respondedAt: c.respondedAt.toISOString(),
    }))

  const improvementComments: PatientComment[] = lowScoreComments
    .filter((c) => c.freeText && c.overallScore != null)
    .map((c) => ({
      text: c.freeText!,
      score: c.overallScore!,
      respondedAt: c.respondedAt.toISOString(),
    }))

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
    patientComments,
    improvementComments,
    rank,
    nextRank: nextRankObj,
    rankProgress,
    weekCount,
    weekAvgScore: weekAvgScore ?? null,
    weekActiveDays,
    weekDays,
    todayAvgScore: todayAvgScore ?? null,
    streakBreak,
    dailyGoal,
    dailyGoalSource,
  }
}
