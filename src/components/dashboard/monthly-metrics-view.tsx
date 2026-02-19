"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"
import { MonthlyTrendSummary } from "./monthly-trend-summary"
import type { MonthlySummary } from "./monthly-summary-section"
import { ChevronDown, ChevronUp, PenSquare } from "lucide-react"

const PERIOD_OPTIONS = [
  { label: "7ヶ月", value: 7 },
  { label: "12ヶ月", value: 12 },
  { label: "24ヶ月", value: 24 },
] as const

interface MonthlyMetricsViewProps {
  initialSummary: MonthlySummary | null
  initialPrevSummary: MonthlySummary | null
  initialSurveyCount: number
  initialYear: number
  initialMonth: number
  enteredMonths?: string[]
}

export function MonthlyMetricsView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialYear,
  initialMonth,
  enteredMonths = [],
}: MonthlyMetricsViewProps) {
  const [selectedMonths, setSelectedMonths] = useState(12)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [loading, setLoading] = useState(false)
  const [entered, setEntered] = useState<Set<string>>(new Set(enteredMonths))
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)
  const [inputOpen, setInputOpen] = useState(false)

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  const m = messages.monthlyMetrics

  const now = new Date()
  const monthOptions: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    })
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

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        直近{PERIOD_OPTIONS.find((o) => o.value === selectedMonths)?.label ?? ""}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedMonths(opt.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              selectedMonths === opt.value
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
        value={selectedMonths}
        onChange={(e) => setSelectedMonths(Number(e.target.value))}
        className="rounded-md border bg-card px-2 py-1.5 text-xs sm:hidden"
      >
        {PERIOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            直近{opt.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="space-y-6">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      {/* グラフ（期間セレクタと連動） */}
      <MonthlyTrendSummary months={selectedMonths} />

      {/* データ入力セクション */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setInputOpen(!inputOpen)}
          className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{m.tabInput}</span>
            <span className="text-xs text-muted-foreground">{m.summaryHint}</span>
          </div>
          {inputOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {inputOpen && (
          <div className="space-y-4">
            {/* Month selector */}
            <div className="flex flex-wrap gap-2">
              {monthOptions.map((opt) => {
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
                    {opt.label}
                    {!isEntered && (
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </Button>
                )
              })}
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
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
