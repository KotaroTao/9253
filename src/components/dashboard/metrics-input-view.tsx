"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"
import type { MonthlySummary } from "./monthly-summary-section"

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
  enteredMonths?: string[]
}

export function MetricsInputView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialYear,
  initialMonth,
  enteredMonths = [],
}: MetricsInputViewProps) {
  const initialEnteredSet = useMemo(() => new Set(enteredMonths), [enteredMonths])

  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [loading, setLoading] = useState(false)
  const [entered, setEntered] = useState<Set<string>>(initialEnteredSet)
  const [selectorYear, setSelectorYear] = useState(initialYear)

  const m = messages.monthlyMetrics

  const monthOptions = generateMonthOptions()

  // 年ごとにグループ化
  const years = Array.from(new Set(monthOptions.map((o) => o.year)))

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
        const key = `${newYear}-${newMonth}`
        if (data.summary) {
          setEntered((prev) => { const next = new Set(Array.from(prev)); next.add(key); return next })
        } else {
          setEntered((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        }
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
                  const isEntered = entered.has(`${opt.year}-${opt.month}`)
                  return (
                    <Button
                      key={`${opt.year}-${opt.month}`}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMonthChange(opt.year, opt.month)}
                      className={
                        !isSelected && !isEntered
                          ? "border-dashed border-amber-300 text-amber-600 hover:border-amber-400 hover:text-amber-700"
                          : undefined
                      }
                    >
                      {opt.month}月
                      {!isEntered && (
                        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}
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
