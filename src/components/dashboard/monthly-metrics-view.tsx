"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"

interface MonthlySummary {
  totalVisits: number | null
  totalRevenue: number | null
  selfPayRevenue: number | null
  returnVisitRate: number | null
  googleReviewCount: number | null
  googleReviewRating: number | null
}

interface SurveyQuality {
  lowScoreCount: number
  lowScoreQuestions: Array<{ text: string; avgScore: number }>
}

interface MonthlyMetricsViewProps {
  initialSummary: MonthlySummary | null
  initialPrevSummary: MonthlySummary | null
  initialSurveyCount: number
  initialSurveyQuality: SurveyQuality | null
  initialYear: number
  initialMonth: number
}

const PERIOD_OPTIONS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "180日", value: 180 },
  { label: "365日", value: 365 },
  { label: "カスタム", value: 0 },
] as const

const DAYS_TO_MONTHS: Record<number, number> = {
  7: 1,
  30: 2,
  90: 3,
  180: 6,
  365: 12,
}

function generateMonthOptions(count: number): { year: number; month: number; label: string }[] {
  const now = new Date()
  const opts = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    })
  }
  return opts
}

function generateMonthRange(fromYM: string, toYM: string): { year: number; month: number; label: string }[] {
  const [fy, fm] = fromYM.split("-").map(Number)
  const [ty, tm] = toYM.split("-").map(Number)
  const opts = []
  let cy = ty, cm = tm
  while (cy > fy || (cy === fy && cm >= fm)) {
    opts.push({
      year: cy,
      month: cm,
      label: `${cy}年${cm}月`,
    })
    cm--
    if (cm === 0) { cm = 12; cy-- }
  }
  return opts
}

export function MonthlyMetricsView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialSurveyQuality,
  initialYear,
  initialMonth,
}: MonthlyMetricsViewProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [surveyQuality, setSurveyQuality] = useState<SurveyQuality | null>(initialSurveyQuality)
  const [loading, setLoading] = useState(false)

  const [periodDays, setPeriodDays] = useState(180)
  const [customFromMonth, setCustomFromMonth] = useState("")
  const [customToMonth, setCustomToMonth] = useState("")

  const monthOptions = useMemo(() => {
    if (periodDays > 0) {
      const monthCount = DAYS_TO_MONTHS[periodDays] ?? 6
      return generateMonthOptions(monthCount)
    }
    if (customFromMonth && customToMonth) {
      return generateMonthRange(customFromMonth, customToMonth)
    }
    return generateMonthOptions(6)
  }, [periodDays, customFromMonth, customToMonth])

  function handlePeriodChange(newPeriod: number) {
    if (newPeriod === 0 && periodDays > 0) {
      const now = new Date()
      const monthCount = DAYS_TO_MONTHS[periodDays] ?? 6
      const fromDate = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1)
      setCustomFromMonth(`${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`)
      setCustomToMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    }
    setPeriodDays(newPeriod)
  }

  async function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear)
    setMonth(newMonth)
    setLoading(true)

    try {
      const res = await fetch(
        `/api/monthly-metrics?year=${newYear}&month=${newMonth}`
      )
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary ?? null)
        setPrevSummary(data.prevSummary ?? null)
        setSurveyCount(data.surveyCount ?? 0)
        setSurveyQuality(data.surveyQuality ?? null)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Auto-select first month in range if current selection is not in range
  const isInitialPeriodChange = useRef(true)
  useEffect(() => {
    if (isInitialPeriodChange.current) {
      isInitialPeriodChange.current = false
      return
    }
    const isCurrentInRange = monthOptions.some((o) => o.year === year && o.month === month)
    if (!isCurrentInRange && monthOptions.length > 0) {
      const first = monthOptions[0]
      handleMonthChange(first.year, first.month)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOptions])

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Desktop: ボタン群 */}
          <div className="hidden gap-1 sm:flex">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handlePeriodChange(opt.value)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  periodDays === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Mobile: セレクト */}
          <select
            value={periodDays}
            onChange={(e) => handlePeriodChange(Number(e.target.value))}
            className="rounded-md border bg-card px-2 py-1.5 text-xs sm:hidden"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value > 0 ? `直近${opt.label}` : opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom month range picker */}
        {periodDays === 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">開始月</label>
              <input
                type="month"
                value={customFromMonth}
                onChange={(e) => setCustomFromMonth(e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <span className="text-xs text-muted-foreground">〜</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">終了月</label>
              <input
                type="month"
                value={customToMonth}
                onChange={(e) => setCustomToMonth(e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Month buttons */}
      <div className="flex flex-wrap gap-2">
        {monthOptions.map((opt) => (
          <Button
            key={`${opt.year}-${opt.month}`}
            variant={year === opt.year && month === opt.month ? "default" : "outline"}
            size="sm"
            onClick={() => handleMonthChange(opt.year, opt.month)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{messages.common.loading}</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <MonthlySummarySection
          year={year}
          month={month}
          initialSummary={summary}
          prevSummary={prevSummary}
          surveyCount={surveyCount}
          surveyQuality={surveyQuality}
        />
      )}
    </div>
  )
}
