"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyTrendPoint, TrendGranularity } from "@/lib/queries/stats"
import { buildPeriodQuery, periodDisplayLabel } from "./analytics-charts"
import type { CustomRange } from "./analytics-charts"

const GRANULARITY_LABELS: Record<TrendGranularity, string> = {
  day: "日次",
  week: "週次",
  month: "月次",
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: DailyTrendPoint }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md">
      <p className="mb-1 text-xs font-medium text-gray-900">{data.date}</p>
      <p className="text-sm">
        回答数: <span className="font-bold">{data.count}</span>件
      </p>
      {data.avgScore != null && (
        <p className="text-sm">
          満足度: <span className="font-bold">{data.avgScore.toFixed(1)}</span> / 5.0
        </p>
      )}
    </div>
  )
}

interface DailyTrendChartProps {
  initialData: DailyTrendPoint[]
  selectedPeriod: number
  customRange?: CustomRange | null
}

export function DailyTrendChart({ initialData, selectedPeriod, customRange = null }: DailyTrendChartProps) {
  const [data, setData] = useState<DailyTrendPoint[]>(initialData)
  const [granularity, setGranularity] = useState<TrendGranularity>("day")
  const [loading, setLoading] = useState(false)
  const isInitialMount = useRef(true)

  const fetchData = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/daily-trend?${query}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
        setGranularity(json.granularity)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    fetchData(buildPeriodQuery(customRange ?? null, selectedPeriod))
  }, [selectedPeriod, customRange, fetchData])

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const yCountMax = Math.ceil(maxCount * 1.2)

  const summary = useMemo(() => {
    const totalCount = data.reduce((sum, d) => sum + d.count, 0)
    const scoreDays = data.filter((d) => d.avgScore != null)
    const weightedSum = scoreDays.reduce((sum, d) => sum + d.avgScore! * d.count, 0)
    const totalWithScore = scoreDays.reduce((sum, d) => sum + d.count, 0)
    const avgScore = totalWithScore > 0 ? weightedSum / totalWithScore : null
    return { totalCount, avgScore }
  }, [data])

  const label = periodDisplayLabel(customRange ?? null, selectedPeriod)
  const granLabel = GRANULARITY_LABELS[granularity]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">回答数・満足度推移</CardTitle>
        {granularity !== "day" && (
          <p className="text-xs text-muted-foreground">{granLabel}集計で表示中</p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">データがありません</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  fontSize={11}
                  interval={data.length > 60 ? Math.floor(data.length / 10) : data.length > 14 ? Math.floor(data.length / 7) : 0}
                  tick={{ fill: "#666" }}
                />
                <YAxis
                  yAxisId="count"
                  orientation="left"
                  domain={[0, yCountMax]}
                  fontSize={10}
                  tick={{ fill: "#666" }}
                  label={{ value: "回答数", angle: -90, position: "insideLeft", fontSize: 10, fill: "#666" }}
                />
                <YAxis
                  yAxisId="score"
                  orientation="right"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  fontSize={10}
                  tick={{ fill: "#2563eb" }}
                  label={{ value: "満足度", angle: 90, position: "insideRight", fontSize: 10, fill: "#2563eb" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => {
                    if (value === "count") return "回答数"
                    if (value === "avgScore") return "満足度"
                    return value
                  }}
                />
                <Bar
                  yAxisId="count"
                  dataKey="count"
                  fill="#93c5fd"
                  radius={[2, 2, 0, 0]}
                  barSize={data.length > 90 ? 4 : data.length > 30 ? 8 : 16}
                />
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={data.length <= 30 ? { r: 3, fill: "#2563eb" } : false}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center gap-6 border-t pt-3">
              <div>
                <p className="text-xs text-muted-foreground">{label}の回答数</p>
                <p className="text-xl font-bold">{summary.totalCount}<span className="text-sm font-normal text-muted-foreground">件</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}の平均満足度</p>
                <p className="text-xl font-bold text-blue-600">
                  {summary.avgScore != null ? summary.avgScore.toFixed(1) : "-"}
                  <span className="text-sm font-normal text-muted-foreground"> / 5.0</span>
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
