"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import type { DailyTrendPoint, TemplateTrendPoint, TemplateQuestionScores, HeatmapCell } from "@/lib/queries/stats"
import { BarChart3 } from "lucide-react"

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
  const isInitialMount = useRef(true)

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

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    fetchQuestionBreakdown(selectedPeriod)
  }, [selectedPeriod, fetchQuestionBreakdown])

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === selectedPeriod)?.label ?? ""

  return (
    <div className="space-y-4">
      {/* 固定ヘッダー: ページタイトル + 期間セレクタ */}
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:-mx-6 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">分析レポート</h1>
            <span className="text-sm text-muted-foreground">直近{periodLabel}</span>
          </div>
          <div className="flex gap-1">
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
        </div>
      </div>

      {/* チャートセクション */}
      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
      />

      <TemplateTrendChart
        initialData={initialTemplateTrend}
        selectedPeriod={selectedPeriod}
      />

      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown data={questionData} selectedPeriod={selectedPeriod} />
      )}

      {/* ヒートマップ + リーダーボード */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SatisfactionHeatmap data={heatmapData} />
        <StaffLeaderboard />
      </div>
    </div>
  )
}
