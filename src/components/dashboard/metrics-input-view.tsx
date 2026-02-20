"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"
import { getMonthStatus } from "@/lib/metrics-utils"
import type { MonthlySummary, MonthStatus } from "@/lib/metrics-utils"

// 2025年1月から当月までの月リストを生成
function generateMonthOptions(): { year: number; month: number; label: string }[] {
  const now = new Date()
  const startYear = 2025
  const startMonth = 1
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 1

  const options: { year: number; month: number; label: string }[] = []
  for (let y = endYear; y >= startYear; y--) {
    const mEnd = y === endYear ? endMonth : 12
    const mStart = y === startYear ? startMonth : 1
    for (let m = mEnd; m >= mStart; m--) {
      options.push({
        year: y,
        month: m,
        label: `${y}年${m}月`,
      })
    }
  }
  return options
}

interface MetricsInputViewProps {
  initialSummary: MonthlySummary | null
  initialPrevSummary: MonthlySummary | null
  initialSurveyCount: number
  initialYear: number
  initialMonth: number
  monthStatuses?: Record<string, MonthStatus>
}

export function MetricsInputView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialYear,
  initialMonth,
  monthStatuses: initialMonthStatuses = {},
}: MetricsInputViewProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [loading, setLoading] = useState(false)
  const [monthStatuses, setMonthStatuses] = useState<Record<string, MonthStatus>>(initialMonthStatuses)
  const [selectorYear, setSelectorYear] = useState(initialYear)

  const m = messages.monthlyMetrics

  const monthOptions = useMemo(() => generateMonthOptions(), [])

  // 年ごとにグループ化
  const years = useMemo(() => Array.from(new Set(monthOptions.map((o) => o.year))), [monthOptions])

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
        const fetchedSummary = data.summary ?? null
        setSummary(fetchedSummary)
        setPrevSummary(data.prevSummary ?? null)
        setSurveyCount(data.surveyCount ?? 0)
        const key = `${newYear}-${newMonth}`
        setMonthStatuses((prev) => ({
          ...prev,
          [key]: getMonthStatus(fetchedSummary),
        }))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{m.summaryHint}</p>

      {/* Month selector — year dropdown + month buttons */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select
                value={selectorYear}
                onChange={(e) => setSelectorYear(Number(e.target.value))}
                className="rounded-md border bg-card px-3 py-1.5 text-sm font-medium"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">月を選択</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {monthOptions
                .filter((opt) => opt.year === selectorYear)
                .sort((a, b) => a.month - b.month)
                .map((opt) => {
                  const isSelected = year === opt.year && month === opt.month
                  const key = `${opt.year}-${opt.month}`
                  const status = monthStatuses[key] ?? "empty"

                  let statusClass = ""
                  if (!isSelected) {
                    if (status === "empty") {
                      statusClass = "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
                    } else if (status === "partial") {
                      statusClass = "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60"
                    }
                  }

                  return (
                    <Button
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMonthChange(opt.year, opt.month)}
                      className={statusClass || undefined}
                    >
                      {opt.month}月
                    </Button>
                  )
                })}
            </div>
          </div>
        </CardContent>
      </Card>

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
        />
      )}
    </div>
  )
}
