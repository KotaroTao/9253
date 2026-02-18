"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import type { DailyTrendPoint, TemplateQuestionScores } from "@/lib/queries/stats"

interface AnalyticsChartsProps {
  initialDailyTrend: DailyTrendPoint[]
  initialQuestionBreakdown: TemplateQuestionScores[]
}

export function AnalyticsCharts({ initialDailyTrend, initialQuestionBreakdown }: AnalyticsChartsProps) {
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

  return (
    <>
      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      {questionLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      ) : (
        <QuestionBreakdown data={questionData} selectedPeriod={selectedPeriod} />
      )}
    </>
  )
}
