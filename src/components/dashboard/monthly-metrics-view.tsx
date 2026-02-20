"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"
import { MonthlyTrendSummary } from "./monthly-trend-summary"
import type { MonthlySummary } from "./monthly-summary-section"
import { ChevronDown, ChevronUp, PenSquare, AlertTriangle, X } from "lucide-react"

export interface MonthRange {
  from: string // YYYY-MM
  to: string   // YYYY-MM
}

const PERIOD_PRESETS = [
  { label: "6ヶ月", value: 6 },
  { label: "1年", value: 12 },
  { label: "2年", value: 24 },
  { label: "3年", value: 36 },
] as const

function formatMonthPreset(months: number): string {
  if (months >= 12 && months % 12 === 0) return `${months / 12}年`
  return `${months}ヶ月`
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function monthsAgoYearMonth(n: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
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

// Check if recent months (last 1-2 completed months) have missing data
function getRecentMissingMonths(enteredSet: Set<string>): { year: number; month: number }[] {
  const now = new Date()
  const result: { year: number; month: number }[] = []
  for (let i = 1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    if (!enteredSet.has(key)) {
      result.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
    }
  }
  return result
}

const ALERT_STORAGE_KEY_PREFIX = "metrics-alert-dismissed-"

export function MonthlyMetricsView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialYear,
  initialMonth,
  enteredMonths = [],
}: MonthlyMetricsViewProps) {
  const initialEnteredSet = useMemo(() => new Set(enteredMonths), [enteredMonths])
  const initialMissing = useMemo(() => getRecentMissingMonths(initialEnteredSet), [initialEnteredSet])

  const [selectedMonths, setSelectedMonths] = useState(12)
  const [customMonthRange, setCustomMonthRange] = useState<MonthRange | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customMonthFrom, setCustomMonthFrom] = useState(() => monthsAgoYearMonth(12))
  const [customMonthTo, setCustomMonthTo] = useState(currentYearMonth)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [loading, setLoading] = useState(false)
  const [entered, setEntered] = useState<Set<string>>(initialEnteredSet)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)
  // Auto-open when there are missing recent months
  const [inputOpen, setInputOpen] = useState(initialMissing.length > 0)
  const [selectorYear, setSelectorYear] = useState(initialYear)

  // Dismissible alert state — persisted per month in localStorage
  const [alertDismissed, setAlertDismissed] = useState(false)
  useEffect(() => {
    const now = new Date()
    const key = `${ALERT_STORAGE_KEY_PREFIX}${now.getFullYear()}-${now.getMonth() + 1}`
    setAlertDismissed(localStorage.getItem(key) === "true")
  }, [])

  const inputSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  // Recalculate missing months reactively
  const missingRecentMonths = useMemo(() => getRecentMissingMonths(entered), [entered])

  function dismissAlert() {
    const now = new Date()
    const key = `${ALERT_STORAGE_KEY_PREFIX}${now.getFullYear()}-${now.getMonth() + 1}`
    localStorage.setItem(key, "true")
    setAlertDismissed(true)
  }

  function handleAlertAction() {
    setInputOpen(true)
    // Navigate to first missing month
    if (missingRecentMonths.length > 0) {
      const target = missingRecentMonths[0]
      setSelectorYear(target.year)
      handleMonthChange(target.year, target.month)
    }
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

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

  const isPreset = !customMonthRange && PERIOD_PRESETS.some((o) => o.value === selectedMonths)
  const periodLabel = customMonthRange
    ? `${customMonthRange.from}〜${customMonthRange.to}`
    : `直近${formatMonthPreset(selectedMonths)}`

  function handlePresetClick(value: number) {
    setShowCustom(false)
    setCustomMonthRange(null)
    setSelectedMonths(value)
  }

  function handleCustomMonthSubmit() {
    if (!customMonthFrom || !customMonthTo || customMonthFrom > customMonthTo) return
    setCustomMonthRange({ from: customMonthFrom, to: customMonthTo })
    setShowCustom(false)
  }

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {periodLabel}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_PRESETS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePresetClick(opt.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !customMonthRange && selectedMonths === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {showCustom ? (
          <div className="flex items-center gap-1">
            <input
              type="month"
              value={customMonthFrom}
              onChange={(e) => setCustomMonthFrom(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            />
            <span className="text-xs text-muted-foreground">〜</span>
            <input
              type="month"
              value={customMonthTo}
              max={currentYearMonth()}
              onChange={(e) => setCustomMonthTo(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            />
            <button
              onClick={handleCustomMonthSubmit}
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
            >
              適用
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              x
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              customMonthRange
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {customMonthRange ? periodLabel : "カスタム"}
          </button>
        )}
      </div>
      {/* Mobile: セレクト */}
      <select
        value={customMonthRange ? "custom" : isPreset ? selectedMonths : "custom"}
        onChange={(e) => {
          const val = e.target.value
          if (val === "custom") {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            setCustomMonthRange(null)
            setSelectedMonths(Number(val))
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
        <div className="flex items-center gap-1 sm:hidden">
          <input
            type="month"
            value={customMonthFrom}
            onChange={(e) => setCustomMonthFrom(e.target.value)}
            className="rounded-md border bg-card px-2 py-1 text-xs"
          />
          <span className="text-xs text-muted-foreground">〜</span>
          <input
            type="month"
            value={customMonthTo}
            max={currentYearMonth()}
            onChange={(e) => setCustomMonthTo(e.target.value)}
            className="rounded-md border bg-card px-2 py-1 text-xs"
          />
          <button
            onClick={handleCustomMonthSubmit}
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          >
            適用
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      {/* 未入力アラート（非侵入的・dismiss可能） */}
      {missingRecentMonths.length > 0 && !alertDismissed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {m.missingDataAlert}
              <span className="ml-1.5 font-normal text-amber-600 dark:text-amber-400">
                ({missingRecentMonths.map((mm) => `${mm.month}月`).join("・")})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
              {m.missingDataAlertDetail}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={handleAlertAction}
              className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900"
            >
              {m.enterSummary}
            </button>
            <button
              onClick={dismissAlert}
              className="rounded-md p-1 text-amber-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/50"
              title={m.dismissAlert}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* グラフ（期間セレクタと連動） */}
      <MonthlyTrendSummary months={selectedMonths} customRange={customMonthRange} />

      {/* データ入力セクション */}
      <div ref={inputSectionRef}>
        <button
          type="button"
          onClick={() => setInputOpen(!inputOpen)}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 transition-colors hover:bg-muted/50 ${
            !inputOpen && missingRecentMonths.length > 0
              ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
              : "bg-card"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <PenSquare className={`h-4 w-4 ${!inputOpen && missingRecentMonths.length > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className="text-sm font-semibold">{m.tabInput}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{m.summaryHint}</span>
            {!inputOpen && missingRecentMonths.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                {missingRecentMonths.length}ヶ月未入力
              </span>
            )}
          </div>
          {inputOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {inputOpen && (
          <div className="mt-4 space-y-4">
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
        )}
      </div>
    </div>
  )
}
