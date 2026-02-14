"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MonthlySummarySection } from "./monthly-summary-section"

interface MonthlySummary {
  totalVisits: number | null
  totalRevenue: number | null
  selfPayRevenue: number | null
  googleReviewCount: number | null
  googleReviewRating: number | null
}

interface SurveyQuality {
  lowScoreCount: number
  freeTextRate: number | null
}

interface MonthlyMetricsViewProps {
  initialSummary: MonthlySummary | null
  initialPrevSummary: MonthlySummary | null
  initialSurveyCount: number
  initialSurveyQuality: SurveyQuality | null
  initialYear: number
  initialMonth: number
}

export function MonthlyMetricsView({
  initialSummary,
  initialPrevSummary,
  initialSurveyCount,
  initialSurveyQuality,
  initialYear,
  initialMonth,
}: MonthlyMetricsViewProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(initialPrevSummary)
  const [surveyCount, setSurveyCount] = useState(initialSurveyCount)
  const [surveyQuality, setSurveyQuality] = useState<SurveyQuality | null>(initialSurveyQuality)
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const monthOptions: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    })
  }

  async function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear)
    setMonth(newMonth)
    setLoading(true)

    try {
      const res = await fetch(
        `/api/monthly-metrics?year=${newYear}&month=${newMonth}`
      )
      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary ?? null)
        setPrevSummary(data.prevSummary ?? null)
        setSurveyCount(data.surveyCount ?? 0)
        setSurveyQuality(data.surveyQuality ?? null)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {monthOptions.map((opt) => (
          <Button
            key={`${opt.year}-${opt.month}`}
            variant={year === opt.year && month === opt.month ? "default" : "outline"}
            size="sm"
            onClick={() => handleMonthChange(opt.year, opt.month)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{messages.common.loading}</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <MonthlySummarySection
          year={year}
          month={month}
          initialSummary={summary}
          prevSummary={prevSummary}
          surveyCount={surveyCount}
          surveyQuality={surveyQuality}
        />
      )}
    </div>
  )
}
