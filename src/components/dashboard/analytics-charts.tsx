"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import { TemplateTrendSmallMultiples } from "@/components/dashboard/template-trend-small-multiples"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import type { DailyTrendPoint, TemplateTrendPoint, TemplateQuestionScores, HeatmapCell } from "@/lib/queries/stats"

const PERIOD_OPTIONS = [
  { label: "7日", value: 7 },
  { label: "30日", value: 30 },
  { label: "90日", value: 90 },
  { label: "180日", value: 180 },
  { label: "365日", value: 365 },
] as const

interface AnalyticsChartsProps {
  initialDailyTrend: DailyTrendPoint[]
  initialTemplateTrend: TemplateTrendPoint[]
  initialQuestionBreakdown: TemplateQuestionScores[]
  heatmapData: HeatmapCell[]
}

export function AnalyticsCharts({
  initialDailyTrend,
  initialTemplateTrend,
  initialQuestionBreakdown,
  heatmapData,
}: AnalyticsChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [questionData, setQuestionData] = useState<TemplateQuestionScores[]>(initialQuestionBreakdown)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [templateTrendData, setTemplateTrendData] = useState<TemplateTrendPoint[]>(initialTemplateTrend)
  const [templateTrendLoading, setTemplateTrendLoading] = useState(false)
  const isInitialMount = useRef(true)
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setHeaderSlot(document.getElementById("header-actions"))
  }, [])

  const fetchQuestionBreakdown = useCallback(async (days: number) => {
    setQuestionLoading(true)
    try {
      const res = await fetch(`/api/question-breakdown?days=${days}`, {
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

  const fetchTemplateTrend = useCallback(async (days: number) => {
    setTemplateTrendLoading(true)
    try {
      const res = await fetch(`/api/template-trend?days=${days}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setTemplateTrendData(json)
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
    fetchQuestionBreakdown(selectedPeriod)
    fetchTemplateTrend(selectedPeriod)
  }, [selectedPeriod, fetchQuestionBreakdown, fetchTemplateTrend])

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === selectedPeriod)?.label ?? ""

  const periodSelector = (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        直近{periodLabel}
      </span>
      {/* Desktop: ボタン群 */}
      <div className="hidden gap-1 sm:flex">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedPeriod(opt.value)}
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
        onChange={(e) => setSelectedPeriod(Number(e.target.value))}
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
    <div className="space-y-4">
      {headerSlot && createPortal(periodSelector, headerSlot)}

      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
      />

      <TemplateTrendChart
        data={templateTrendData}
        loading={templateTrendLoading}
      />

      <TemplateTrendSmallMultiples data={templateTrendData} />

      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown data={questionData} selectedPeriod={selectedPeriod} />
      )}

      {/* ヒートマップ + リーダーボード */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SatisfactionHeatmap initialData={heatmapData} selectedPeriod={selectedPeriod} />
        <StaffLeaderboard />
      </div>
    </div>
  )
}
