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

export function formatPeriodLabel(days: number): string {
  if (days >= 365 && days % 365 === 0) return `${days / 365}年`
  return `${days}日`
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
  const [customInput, setCustomInput] = useState("")
  const [showCustom, setShowCustom] = useState(false)
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
      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/template-trend?days=${days}`, { cache: "no-store" }),
        fetch(`/api/template-trend?days=${days}&offset=${days}`, { cache: "no-store" }),
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
    fetchQuestionBreakdown(selectedPeriod)
    fetchTemplateTrend(selectedPeriod)
  }, [selectedPeriod, fetchQuestionBreakdown, fetchTemplateTrend])

  const isPreset = PERIOD_PRESETS.some((o) => o.value === selectedPeriod)
  const periodLabel = formatPeriodLabel(selectedPeriod)

  function handlePresetClick(value: number) {
    setShowCustom(false)
    setSelectedPeriod(value)
  }

  function handleCustomSubmit() {
    const v = parseInt(customInput, 10)
    if (!isNaN(v) && v >= 1 && v <= MAX_DAYS) {
      setSelectedPeriod(v)
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
              selectedPeriod === opt.value
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
            onClick={() => { setShowCustom(true); setCustomInput(isPreset ? "" : String(selectedPeriod)) }}
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
        value={isPreset ? selectedPeriod : "custom"}
        onChange={(e) => {
          const val = e.target.value
          if (val === "custom") {
            setShowCustom(true)
          } else {
            setShowCustom(false)
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

      <TemplateTrendSmallMultiples
        data={templateTrendData}
        prevData={templateTrendPrevData}
        selectedPeriod={selectedPeriod}
      />

      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown data={questionData} selectedPeriod={selectedPeriod} />
      )}

      <PurposeSatisfaction selectedPeriod={selectedPeriod} />

      {/* ヒートマップ + リーダーボード */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SatisfactionHeatmap initialData={heatmapData} selectedPeriod={selectedPeriod} />
        <StaffLeaderboard />
      </div>
    </div>
  )
}
