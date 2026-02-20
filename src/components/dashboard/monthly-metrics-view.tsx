"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { messages } from "@/lib/messages"
import { MonthlyTrendSummary } from "./monthly-trend-summary"
import { AlertTriangle, X } from "lucide-react"

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

interface MonthlyMetricsViewProps {
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
  enteredMonths = [],
}: MonthlyMetricsViewProps) {
  const enteredSet = useMemo(() => new Set(enteredMonths), [enteredMonths])

  const [selectedMonths, setSelectedMonths] = useState(12)
  const [customMonthRange, setCustomMonthRange] = useState<MonthRange | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customMonthFrom, setCustomMonthFrom] = useState(() => monthsAgoYearMonth(12))
  const [customMonthTo, setCustomMonthTo] = useState(currentYearMonth)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  // Dismissible alert state — persisted per month in localStorage
  const [alertDismissed, setAlertDismissed] = useState(false)
  useEffect(() => {
    const now = new Date()
    const key = `${ALERT_STORAGE_KEY_PREFIX}${now.getFullYear()}-${now.getMonth() + 1}`
    setAlertDismissed(localStorage.getItem(key) === "true")
  }, [])

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  // Recalculate missing months reactively
  const missingRecentMonths = useMemo(() => getRecentMissingMonths(enteredSet), [enteredSet])

  function dismissAlert() {
    const now = new Date()
    const key = `${ALERT_STORAGE_KEY_PREFIX}${now.getFullYear()}-${now.getMonth() + 1}`
    localStorage.setItem(key, "true")
    setAlertDismissed(true)
  }

  const m = messages.monthlyMetrics

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

      {/* グラフ（期間セレクタと連動） */}
      <MonthlyTrendSummary months={selectedMonths} customRange={customMonthRange} />
    </div>
  )
}
