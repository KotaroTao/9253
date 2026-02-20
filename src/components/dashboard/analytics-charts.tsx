"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import { TemplateTrendSmallMultiples } from "@/components/dashboard/template-trend-small-multiples"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import { PurposeSatisfaction } from "@/components/dashboard/purpose-satisfaction"
import type { DailyTrendPoint, TemplateTrendPoint, TemplateQuestionScores, HeatmapCell } from "@/lib/queries/stats"

export interface CustomRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

const PERIOD_PRESETS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "180日", value: 180 },
  { label: "1年", value: 365 },
] as const

export function formatPeriodLabel(days: number): string {
  if (days >= 365 && days % 365 === 0) return `${days / 365}年`
  return `${days}日`
}

/** APIクエリパラメータ文字列を構築 */
export function buildPeriodQuery(customRange: CustomRange | null, days: number): string {
  if (customRange) return `from=${customRange.from}&to=${customRange.to}`
  return `days=${days}`
}

/** 表示用の期間ラベル */
export function periodDisplayLabel(customRange: CustomRange | null, days: number): string {
  if (customRange) {
    const f = customRange.from.replace(/-/g, "/")
    const t = customRange.to.replace(/-/g, "/")
    return `${f}〜${t}`
  }
  return `直近${formatPeriodLabel(days)}`
}

function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

interface AnalyticsChartsProps {
  initialDailyTrend: DailyTrendPoint[]
  initialTemplateTrend: TemplateTrendPoint[]
  initialTemplateTrendPrev: TemplateTrendPoint[]
  initialQuestionBreakdown: TemplateQuestionScores[]
  heatmapData: HeatmapCell[]
}

export function AnalyticsCharts({
  initialDailyTrend,
  initialTemplateTrend,
  initialTemplateTrendPrev,
  initialQuestionBreakdown,
  heatmapData,
}: AnalyticsChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [customRange, setCustomRange] = useState<CustomRange | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(() => daysAgoStr(90))
  const [customTo, setCustomTo] = useState(todayStr)
  const [questionData, setQuestionData] = useState<TemplateQuestionScores[]>(initialQuestionBreakdown)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [templateTrendData, setTemplateTrendData] = useState<TemplateTrendPoint[]>(initialTemplateTrend)
  const [templateTrendPrevData, setTemplateTrendPrevData] = useState<TemplateTrendPoint[]>(initialTemplateTrendPrev)
  const [templateTrendLoading, setTemplateTrendLoading] = useState(false)
  const isInitialMount = useRef(true)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  const periodQuery = buildPeriodQuery(customRange, selectedPeriod)

  const fetchQuestionBreakdown = useCallback(async (query: string) => {
    setQuestionLoading(true)
    try {
      const res = await fetch(`/api/question-breakdown?${query}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setQuestionData(json)
      }
    } finally {
      setQuestionLoading(false)
    }
  }, [])

  const fetchTemplateTrend = useCallback(async (query: string, isCustom: boolean, days: number) => {
    setTemplateTrendLoading(true)
    try {
      // For custom range, compute prev period from/to
      let prevQuery: string
      if (isCustom) {
        // prev period: shift back by same duration
        const fromDate = new Date(query.match(/from=([^&]+)/)?.[1] ?? "")
        const toDate = new Date(query.match(/to=([^&]+)/)?.[1] ?? "")
        const durationMs = toDate.getTime() - fromDate.getTime()
        const prevTo = new Date(fromDate.getTime() - 1)
        const prevFrom = new Date(prevTo.getTime() - durationMs)
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        prevQuery = `from=${fmt(prevFrom)}&to=${fmt(prevTo)}`
      } else {
        prevQuery = `days=${days}&offset=${days}`
      }

      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/template-trend?${query}`, { cache: "no-store" }),
        fetch(`/api/template-trend?${prevQuery}`, { cache: "no-store" }),
      ])
      if (currentRes.ok) {
        setTemplateTrendData(await currentRes.json())
      }
      if (prevRes.ok) {
        setTemplateTrendPrevData(await prevRes.json())
      }
    } finally {
      setTemplateTrendLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const query = buildPeriodQuery(customRange, selectedPeriod)
    fetchQuestionBreakdown(query)
    fetchTemplateTrend(query, customRange !== null, selectedPeriod)
  }, [selectedPeriod, customRange, fetchQuestionBreakdown, fetchTemplateTrend])

  function handlePresetClick(value: number) {
    setShowCustom(false)
    setCustomRange(null)
    setSelectedPeriod(value)
  }

  function handleCustomSubmit() {
    if (!customFrom || !customTo || customFrom >= customTo) return
    setCustomRange({ from: customFrom, to: customTo })
    setShowCustom(false)
  }

  const isPreset = !customRange && PERIOD_PRESETS.some((o) => o.value === selectedPeriod)
  const label = periodDisplayLabel(customRange, selectedPeriod)

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {label}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_PRESETS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePresetClick(opt.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !customRange && selectedPeriod === opt.value
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
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            />
            <span className="text-xs text-muted-foreground">〜</span>
            <input
              type="date"
              value={customTo}
              max={todayStr()}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border bg-card px-2 py-1 text-xs"
            />
            <button
              onClick={handleCustomSubmit}
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
              customRange
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {customRange ? label : "カスタム"}
          </button>
        )}
      </div>
      {/* Mobile: セレクト */}
      <select
        value={customRange ? "custom" : isPreset ? selectedPeriod : "custom"}
        onChange={(e) => {
          const val = e.target.value
          if (val === "custom") {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            setCustomRange(null)
            setSelectedPeriod(Number(val))
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
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-md border bg-card px-2 py-1 text-xs"
          />
          <span className="text-xs text-muted-foreground">〜</span>
          <input
            type="date"
            value={customTo}
            max={todayStr()}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-md border bg-card px-2 py-1 text-xs"
          />
          <button
            onClick={handleCustomSubmit}
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          >
            適用
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
        customRange={customRange}
      />

      <TemplateTrendChart
        data={templateTrendData}
        loading={templateTrendLoading}
      />

      <TemplateTrendSmallMultiples
        data={templateTrendData}
        prevData={templateTrendPrevData}
        selectedPeriod={selectedPeriod}
        customRange={customRange}
      />

      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown data={questionData} selectedPeriod={selectedPeriod} customRange={customRange} />
      )}

      <PurposeSatisfaction selectedPeriod={selectedPeriod} customRange={customRange} />

      {/* ヒートマップ + リーダーボード */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SatisfactionHeatmap initialData={heatmapData} selectedPeriod={selectedPeriod} customRange={customRange} />
        <StaffLeaderboard />
      </div>
    </div>
  )
}
