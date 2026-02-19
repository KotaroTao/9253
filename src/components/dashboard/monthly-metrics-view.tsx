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
import { formatPeriodLabel } from "./analytics-charts"

const PERIOD_PRESETS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "180日", value: 180 },
  { label: "1年", value: 365 },
  { label: "2年", value: 730 },
  { label: "3年", value: 1095 },
] as const

const MAX_DAYS = 10950

function daysToMonths(days: number): number {
  return Math.ceil(days / 30) + 1
}

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
  const [selectedDays, setSelectedDays] = useState(30)
  const [customInput, setCustomInput] = useState("")
  const [showCustom, setShowCustom] = useState(false)
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

  const isPreset = PERIOD_PRESETS.some((o) => o.value === selectedDays)
  const periodLabel = formatPeriodLabel(selectedDays)

  function handlePresetClick(value: number) {
    setShowCustom(false)
    setSelectedDays(value)
  }

  function handleCustomSubmit() {
    const v = parseInt(customInput, 10)
    if (!isNaN(v) && v >= 1 && v <= MAX_DAYS) {
      setSelectedDays(v)
      setShowCustom(false)
    }
  }

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        直近{periodLabel}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_PRESETS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePresetClick(opt.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              selectedDays === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {showCustom ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleCustomSubmit() }}
            className="flex items-center gap-1"
          >
            <input
              type="number"
              min={1}
              max={MAX_DAYS}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="日数"
              className="w-16 rounded-md border bg-card px-2 py-1 text-xs"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
            >
              適用
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              x
            </button>
          </form>
        ) : (
          <button
            onClick={() => { setShowCustom(true); setCustomInput(isPreset ? "" : String(selectedDays)) }}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !isPreset
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {!isPreset ? `${periodLabel}` : "カスタム"}
          </button>
        )}
      </div>
      {/* Mobile: セレクト */}
      <select
        value={isPreset ? selectedDays : "custom"}
        onChange={(e) => {
          const val = e.target.value
          if (val === "custom") {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            setSelectedDays(Number(val))
          }
        }}
        className="rounded-md border bg-card px-2 py-1.5 text-xs sm:hidden"
      >
        {PERIOD_PRESETS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            直近{opt.label}
          </option>
        ))}
        <option value="custom">カスタム...</option>
      </select>
      {showCustom && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleCustomSubmit() }}
          className="flex items-center gap-1 sm:hidden"
        >
          <input
            type="number"
            min={1}
            max={MAX_DAYS}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="日数"
            className="w-16 rounded-md border bg-card px-2 py-1 text-xs"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          >
            適用
          </button>
        </form>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      {/* グラフ（期間セレクタと連動） */}
      <MonthlyTrendSummary months={daysToMonths(selectedDays)} />

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
            {/* Month selector — grouped by year */}
            <div className="space-y-2">
              {years.map((y) => (
                <div key={y} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{y}年</p>
                  <div className="flex flex-wrap gap-1.5">
                    {monthOptions
                      .filter((opt) => opt.year === y)
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
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
