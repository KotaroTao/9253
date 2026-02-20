import { prisma } from "@/lib/prisma"
import { DEFAULTS, MILESTONES, getRank, getNextRank } from "@/lib/constants"
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

  // Consolidate count/avg queries into a single raw SQL to reduce round-trips (7→4)
  interface AggRow {
    total_count: bigint
    today_count: bigint
    today_avg: number | null
    week_count: bigint
    week_avg: number | null
  }
  // Previous month for daily goal calculation
  const { year: nowYear, month: nowMonth } = jstNowParts()
  const prevMonthDate = new Date(Date.UTC(nowYear, nowMonth - 2, 1))
  const prevYear = prevMonthDate.getUTCFullYear()
  const prevMonth = prevMonthDate.getUTCMonth() + 1

  const [aggRows, streakResponses, positiveComments, clinic, prevMetrics] =
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

      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: { firstVisitCount: true, revisitCount: true },
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
  const JST_OFFSET = 9 * 60 * 60 * 1000

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

  // Calculate base daily patients from previous month (totalPatients / businessDays)
  const totalPatients = (prevMetrics?.firstVisitCount ?? 0) + (prevMetrics?.revisitCount ?? 0)
  const baseDaily = (() => {
    if (totalPatients <= 0) return 0
    const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate()
    let businessDays = 0
    for (let d = 1; d <= daysInPrevMonth; d++) {
      const date = new Date(Date.UTC(prevYear, prevMonth - 1, d))
      const dateKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      if (openDates.has(dateKey)) {
        businessDays++
      } else if (closedDates.has(dateKey) || regularClosedDays.has(date.getUTCDay())) {
        // closed
      } else {
        businessDays++
      }
    }
    return businessDays > 0 ? totalPatients / businessDays : 0
  })()

  // Dynamic goal multiplier: 0.3 → 0.4 → 0.5 (level 0/1/2)
  // 7日連続達成で1段階UP、7日連続未達成で1段階DOWN
  const { GOAL_MULTIPLIERS, GOAL_STREAK_THRESHOLD } = DEFAULTS
  let goalLevel = Math.max(0, Math.min(2, settings.goalLevel ?? 0))
  let goalAchieveStreak = settings.goalAchieveStreak ?? 0
  let goalMissStreak = settings.goalMissStreak ?? 0
  const goalLastCheckedDate = settings.goalLastCheckedDate ?? null
  const yesterdayKey = formatDateKeyJST(new Date(todayStart.getTime() - DAY_MS))

  if (baseDaily > 0 && goalLastCheckedDate) {
    // Evaluate each business day from the day after lastCheckedDate to yesterday
    const [ly, lm, ld] = goalLastCheckedDate.split("-").map(Number)
    let evalTime = Date.UTC(ly, lm - 1, ld) - JST_OFFSET + DAY_MS

    for (let i = 0; i < 90; i++) {
      const evalDate = new Date(evalTime)
      const evalKey = formatDateKeyJST(evalDate)
      if (evalKey > yesterdayKey) break

      if (!isClosedDate(evalKey, evalDate)) {
        const goal = Math.max(1, Math.round(baseDaily * GOAL_MULTIPLIERS[goalLevel]))
        const count = dateCountMap.get(evalKey) ?? 0

        if (count >= goal) {
          goalAchieveStreak++
          goalMissStreak = 0
          if (goalAchieveStreak >= GOAL_STREAK_THRESHOLD && goalLevel < 2) {
            goalLevel++
            goalAchieveStreak = 0
          }
        } else {
          goalMissStreak++
          goalAchieveStreak = 0
          if (goalMissStreak >= GOAL_STREAK_THRESHOLD && goalLevel > 0) {
            goalLevel--
            goalMissStreak = 0
          }
        }
      }

      evalTime += DAY_MS
    }
  }

  // Persist updated goal tracking (atomic JSONB merge, fire-and-forget)
  const newLastCheckedDate = yesterdayKey
  if (
    goalLevel !== (settings.goalLevel ?? 0) ||
    goalAchieveStreak !== (settings.goalAchieveStreak ?? 0) ||
    goalMissStreak !== (settings.goalMissStreak ?? 0) ||
    newLastCheckedDate !== goalLastCheckedDate
  ) {
    const patch = JSON.stringify({
      goalLevel,
      goalAchieveStreak,
      goalMissStreak,
      goalLastCheckedDate: newLastCheckedDate,
    })
    prisma.$executeRaw`
      UPDATE clinics SET settings = settings || ${patch}::jsonb
      WHERE id = ${clinicId}::uuid
    `.catch(() => {})
  }

  // Final daily goal with dynamic multiplier
  const dailyGoal = baseDaily > 0
    ? Math.max(1, Math.round(baseDaily * GOAL_MULTIPLIERS[goalLevel]))
    : DEFAULTS.DAILY_GOAL_FALLBACK

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

  // Calculate streak: skip closed dates (treat as non-existent days)
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
    weekDays,
    todayAvgScore: todayAvgScore ?? null,
    streakBreak,
  }
}
