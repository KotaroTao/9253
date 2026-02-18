"use client"

import { useState } from "react"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { TemplateTrendChart } from "@/components/dashboard/template-trend-chart"
import type { DailyTrendPoint, TemplateTrendPoint } from "@/lib/queries/stats"

interface AnalyticsChartsProps {
  initialDailyTrend: DailyTrendPoint[]
  initialTemplateTrend: TemplateTrendPoint[]
}

export function AnalyticsCharts({ initialDailyTrend, initialTemplateTrend }: AnalyticsChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  return (
    <>
      <DailyTrendChart
        initialData={initialDailyTrend}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      <TemplateTrendChart
        initialData={initialTemplateTrend}
        selectedPeriod={selectedPeriod}
      />
    </>
  )
}
