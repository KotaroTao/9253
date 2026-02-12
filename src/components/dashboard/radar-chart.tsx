"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import type { StaffSurveyCategoryScore } from "@/types"

interface EmployeeRadarChartProps {
  categoryScores: StaffSurveyCategoryScore[]
  surveyTitle?: string
}

export function EmployeeRadarChart({ categoryScores, surveyTitle }: EmployeeRadarChartProps) {
  if (categoryScores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{messages.staffSurvey.radarChart}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {messages.staffSurvey.minResponsesNote}
          </p>
        </CardContent>
      </Card>
    )
  }

  const data = categoryScores.map((cs) => ({
    category: cs.label,
    score: cs.score,
    fullMark: 5,
  }))

  const lowScoreCategories = categoryScores.filter((cs) => cs.score < 3.0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {messages.staffSurvey.radarChart}
          {surveyTitle && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({surveyTitle})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="category" fontSize={11} />
            <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value: number) => [value.toFixed(1), "スコア"]}
            />
            <Radar
              name="スコア"
              dataKey="score"
              stroke="hsl(142, 71%, 45%)"
              fill="hsl(142, 71%, 45%)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        {lowScoreCategories.length > 0 && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-xs font-medium text-orange-800">
              ⚠ {messages.dashboard.improvementSuggestion}
            </p>
            <p className="mt-1 text-xs text-orange-700">
              {lowScoreCategories.map((cs) => `${cs.label}（${cs.score.toFixed(1)}）`).join("、")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
