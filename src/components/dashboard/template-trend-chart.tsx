"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TemplateQuestionScores } from "@/lib/queries/stats"
import { PERIOD_OPTIONS } from "@/components/dashboard/daily-trend-chart"

const SCORE_THRESHOLD = 4.0

const TEMPLATE_COLORS: Record<string, { bar: string; low: string }> = {
  "初診": { bar: "hsl(221, 83%, 53%)", low: "hsl(0, 84%, 60%)" },
  "治療中": { bar: "hsl(142, 71%, 45%)", low: "hsl(0, 84%, 60%)" },
  "定期検診": { bar: "hsl(262, 83%, 58%)", low: "hsl(0, 84%, 60%)" },
}

function shortenLabel(text: string): string {
  return text
    .replace(/はいかがでしたか？$/, "")
    .replace(/と思いますか？$/, "")
    .replace(/でしたか？$/, "")
    .replace(/ですか？$/, "")
    .replace(/ましたか？$/, "")
    .replace(/ありますか？$/, "")
    .replace(/？$/, "")
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { fullText: string; avgScore: number; count: number } }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <p className="mb-1 text-xs font-medium text-gray-900">{data.fullText}</p>
      <p className="text-sm">
        平均スコア: <span className="font-bold">{data.avgScore}</span> / 5.0
      </p>
      <p className="text-xs text-muted-foreground">{data.count}件の回答</p>
    </div>
  )
}

interface TemplateTrendChartProps {
  initialData: TemplateQuestionScores[]
  selectedPeriod: number
}

export function TemplateTrendChart({ initialData, selectedPeriod }: TemplateTrendChartProps) {
  const [data, setData] = useState<TemplateQuestionScores[]>(initialData)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (days: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/question-breakdown?days=${days}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPeriod !== 30) {
      fetchData(selectedPeriod)
    } else {
      setData(initialData)
    }
  }, [selectedPeriod, initialData, fetchData])

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === selectedPeriod)?.label ?? ""

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">テンプレート別 設問スコア</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">テンプレート別 設問スコア</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">データがありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((template) => {
        const colors = TEMPLATE_COLORS[template.templateName] ?? TEMPLATE_COLORS["初診"]
        const chartData = template.questions.map((q) => ({
          label: shortenLabel(q.text),
          fullText: q.text,
          avgScore: q.avgScore,
          count: q.count,
          questionId: q.questionId,
        }))

        return (
          <Card key={template.templateName}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{template.templateName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  （直近{periodLabel} / {template.responseCount}件の回答）
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={template.questions.length * 52 + 20}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={260}
                    fontSize={11}
                    tick={{ fill: "#666" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={SCORE_THRESHOLD} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.questionId}
                        fill={entry.avgScore < SCORE_THRESHOLD ? colors.low : colors.bar}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
