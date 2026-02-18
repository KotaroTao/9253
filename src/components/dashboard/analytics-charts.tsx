"use client"

import { useState } from "react"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import type { DailyTrendPoint, TemplateQuestionScores } from "@/lib/queries/stats"

interface AnalyticsChartsProps {
  initialDailyTrend: DailyTrendPoint[]
  initialQuestionBreakdown: TemplateQuestionScores[]
}

export function AnalyticsCharts({ initialDailyTrend, initialQuestionBreakdown }: AnalyticsChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  return (
    <>
      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      <TemplateTrendChart
        initialData={initialQuestionBreakdown}
        selectedPeriod={selectedPeriod}
      />
    </>
  )
}
