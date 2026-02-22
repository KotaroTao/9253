"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { messages } from "@/lib/messages"
import { MonthlyTrendSummary } from "./monthly-trend-summary"
import { AlertTriangle, X, ChevronLeft, ChevronRight } from "lucide-react"

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
      options.push({ year: y, month: m, label: `${y}年${m}月` })
    }
  }
  return options
}

interface MonthlyMetricsViewProps {
  enteredMonths?: string[]
  clinicType?: string
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
  enteredMonths = [],
  clinicType,
}: MonthlyMetricsViewProps) {
  const enteredSet = useMemo(() => new Set(enteredMonths), [enteredMonths])

  // Default to previous month
  const defaultDate = useMemo(() => {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  }, [])

  const [year, setYear] = useState(defaultDate.year)
  const [month, setMonth] = useState(defaultDate.month)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(defaultDate.year)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  // Dismissible alert state
  const [alertDismissed, setAlertDismissed] = useState(false)
  useEffect(() => {
    const now = new Date()
    const key = `${ALERT_STORAGE_KEY_PREFIX}${now.getFullYear()}-${now.getMonth() + 1}`
    setAlertDismissed(localStorage.getItem(key) === "true")
  }, [])

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  // Close month picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false)
      }
    }
    if (showMonthPicker) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMonthPicker])

  const missingRecentMonths = useMemo(() => getRecentMissingMonths(enteredSet), [enteredSet])
  const monthOptions = useMemo(() => generateMonthOptions(), [])
  const years = useMemo(() => Array.from(new Set(monthOptions.map((o) => o.year))), [monthOptions])

  function dismissAlert() {
    const now = new Date()
    const key = `${ALERT_STORAGE_KEY_PREFIX}${now.getFullYear()}-${now.getMonth() + 1}`
    localStorage.setItem(key, "true")
    setAlertDismissed(true)
  }

  function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear)
    setMonth(newMonth)
    setShowMonthPicker(false)
  }

  function navigateMonth(direction: -1 | 1) {
    const idx = monthOptions.findIndex((o) => o.year === year && o.month === month)
    const nextIdx = idx - direction
    if (nextIdx >= 0 && nextIdx < monthOptions.length) {
      const opt = monthOptions[nextIdx]
      handleMonthChange(opt.year, opt.month)
    }
  }

  const canGoPrev = monthOptions.findIndex((o) => o.year === year && o.month === month) < monthOptions.length - 1
  const canGoNext = monthOptions.findIndex((o) => o.year === year && o.month === month) > 0

  const m = messages.monthlyMetrics

  const monthSelector = (
    <div className="relative flex items-center gap-1 shrink-0" ref={pickerRef}>
      <button
        onClick={() => navigateMonth(-1)}
        disabled={!canGoPrev}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        aria-label="前月"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={() => {
          setPickerYear(year)
          setShowMonthPicker((v) => !v)
        }}
        className="rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors min-w-[100px] text-center"
      >
        {year}年{month}月
      </button>

      <button
        onClick={() => navigateMonth(1)}
        disabled={!canGoNext}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        aria-label="翌月"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Month picker dropdown */}
      {showMonthPicker && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border bg-card p-4 shadow-lg z-50">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPickerYear((y) => Math.max(y - 1, years[years.length - 1]))}
              disabled={pickerYear <= years[years.length - 1]}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold">{pickerYear}年</span>
            <button
              onClick={() => setPickerYear((y) => Math.min(y + 1, years[0]))}
              disabled={pickerYear >= years[0]}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => {
              const opt = monthOptions.find((o) => o.year === pickerYear && o.month === mo)
              if (!opt) {
                return (
                  <div key={mo} className="rounded-md px-2 py-2 text-center text-sm text-muted-foreground/30">
                    {mo}月
                  </div>
                )
              }
              const isSelected = year === opt.year && month === opt.month
              const key = `${opt.year}-${opt.month}`
              const isEntered = enteredSet.has(key)

              let statusDot = ""
              if (!isSelected) {
                statusDot = isEntered ? "bg-emerald-400" : "bg-red-400"
              }

              return (
                <button
                  key={key}
                  onClick={() => handleMonthChange(opt.year, opt.month)}
                  className={`relative rounded-md px-2 py-2 text-center text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {mo}月
                  {statusDot && (
                    <span className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${statusDot}`} />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />入力済</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />未入力</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {headerSlot && createPortal(monthSelector, headerSlot)}

      {/* 未入力アラート */}
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
            <Link
              href="/dashboard/metrics/input"
              className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900"
            >
              {m.enterSummary}
            </Link>
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

      {/* レポート本体 */}
      <MonthlyTrendSummary year={year} month={month} clinicType={clinicType} />
    </div>
  )
}
