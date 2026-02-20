"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { Calendar } from "lucide-react"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import { TemplateTrendSmallMultiples } from "@/components/dashboard/template-trend-small-multiples"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import type { DailyTrendPoint, TemplateTrendPoint, TemplateQuestionScores, HeatmapCell } from "@/lib/queries/stats"

export const PERIOD_OPTIONS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "180日", value: 180 },
  { label: "365日", value: 365 },
  { label: "カスタム", value: 0 },
] as const

/** Build API query string from period selection */
export function buildPeriodQuery(period: number, customFrom?: string, customTo?: string): string {
  if (period > 0) return `days=${period}`
  if (customFrom && customTo) return `from=${customFrom}&to=${customTo}`
  return ""
}

/** Build period label for display */
export function getPeriodLabel(period: number, customFrom?: string, customTo?: string): string {
  if (period > 0) {
    return PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? ""
  }
  if (customFrom && customTo) {
    return `${customFrom}〜${customTo}`
  }
  return ""
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
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
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

  const isCustomReady = selectedPeriod === 0 && customFrom !== "" && customTo !== ""

  const query = useMemo(() => buildPeriodQuery(selectedPeriod, customFrom, customTo), [selectedPeriod, customFrom, customTo])

  const fetchQuestionBreakdown = useCallback(async (q: string) => {
    setQuestionLoading(true)
    try {
      const res = await fetch(`/api/question-breakdown?${q}`, { cache: "no-store" })
      if (res.ok) setQuestionData(await res.json())
    } finally {
      setQuestionLoading(false)
    }
  }, [])

  const fetchTemplateTrend = useCallback(async (q: string, prevQ: string) => {
    setTemplateTrendLoading(true)
    try {
      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/template-trend?${q}`, { cache: "no-store" }),
        prevQ ? fetch(`/api/template-trend?${prevQ}`, { cache: "no-store" }) : Promise.resolve(null),
      ])
      if (currentRes.ok) setTemplateTrendData(await currentRes.json())
      if (prevRes?.ok) {
        setTemplateTrendPrevData(await prevRes.json())
      } else {
        setTemplateTrendPrevData([])
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
    if (!query) return

    let prevQuery: string
    if (selectedPeriod > 0) {
      prevQuery = `days=${selectedPeriod}&offset=${selectedPeriod}`
    } else if (customFrom && customTo) {
      const fromMs = new Date(customFrom).getTime()
      const toMs = new Date(customTo).getTime()
      const duration = toMs - fromMs
      const prevFromDate = new Date(fromMs - duration - 86400000)
      const prevToDate = new Date(fromMs - 86400000)
      prevQuery = `from=${prevFromDate.toISOString().slice(0, 10)}&to=${prevToDate.toISOString().slice(0, 10)}`
    } else {
      prevQuery = ""
    }

    fetchQuestionBreakdown(query)
    fetchTemplateTrend(query, prevQuery)
  }, [query, selectedPeriod, customFrom, customTo, fetchQuestionBreakdown, fetchTemplateTrend])

  function handlePeriodChange(newPeriod: number) {
    if (newPeriod === 0 && selectedPeriod > 0) {
      const today = new Date()
      const from = new Date(today.getTime() - selectedPeriod * 86400000)
      setCustomFrom(from.toISOString().slice(0, 10))
      setCustomTo(today.toISOString().slice(0, 10))
    }
    setSelectedPeriod(newPeriod)
  }

  const periodLabel = getPeriodLabel(selectedPeriod, customFrom, customTo)

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {selectedPeriod > 0 ? `直近${periodLabel}` : isCustomReady ? periodLabel : "期間を選択"}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              selectedPeriod === opt.value
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
        value={selectedPeriod}
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
  )

  return (
    <div className="space-y-4">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      {/* Custom date range picker */}
      {selectedPeriod === 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">開始日</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground">〜</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">終了日</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
        customFrom={customFrom}
        customTo={customTo}
      />

      <TemplateTrendChart
        data={templateTrendData}
        loading={templateTrendLoading}
      />

      <TemplateTrendSmallMultiples
        data={templateTrendData}
        prevData={templateTrendPrevData}
        selectedPeriod={selectedPeriod}
        customFrom={customFrom}
        customTo={customTo}
      />

      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown
          data={questionData}
          selectedPeriod={selectedPeriod}
          customFrom={customFrom}
          customTo={customTo}
        />
      )}

      {/* ヒートマップ + リーダーボード */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SatisfactionHeatmap
          initialData={heatmapData}
          selectedPeriod={selectedPeriod}
          customFrom={customFrom}
          customTo={customTo}
        />
        <StaffLeaderboard />
      </div>
    </div>
  )
}
