"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TemplateTrendPoint } from "@/lib/queries/stats"

const TEMPLATE_COLORS: Record<string, string> = {
  "初診": "#2563eb",
  "治療中": "#16a34a",
  "定期検診": "#f59e0b",
}

const DEFAULT_COLOR = "#6b7280"

interface TemplateTrendChartProps {
  initialData: TemplateTrendPoint[]
  selectedPeriod: number
}

interface ChartDataPoint {
  date: string
  [templateName: string]: string | number | null
}

export function TemplateTrendChart({ initialData, selectedPeriod }: TemplateTrendChartProps) {
  const [data, setData] = useState<TemplateTrendPoint[]>(initialData)
  const [loading, setLoading] = useState(false)
  const isInitialMount = useRef(true)

  const fetchData = useCallback(async (days: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/template-trend?days=${days}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
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
    fetchData(selectedPeriod)
  }, [selectedPeriod, fetchData])

  const { chartData, templateNames } = useMemo(() => {
    const names = new Set<string>()
    const dateMap = new Map<string, Record<string, number | null>>()

    for (const point of data) {
      names.add(point.templateName)
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, {})
      }
      dateMap.get(point.date)![point.templateName] = point.avgScore
    }

    const result: ChartDataPoint[] = []
    dateMap.forEach((scores, date) => {
      result.push({ date, ...scores })
    })

    return { chartData: result, templateNames: Array.from(names).sort() }
  }, [data])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">テンプレート別 満足度推移</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">データがありません</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={11}
                interval={chartData.length > 60 ? Math.floor(chartData.length / 10) : chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
                tick={{ fill: "#666" }}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                fontSize={10}
                tick={{ fill: "#666" }}
                label={{ value: "満足度", angle: -90, position: "insideLeft", fontSize: 10, fill: "#666" }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-md">
                      <p className="mb-1 text-xs font-medium text-gray-900">{label}</p>
                      {payload.map((entry) => (
                        <p key={entry.dataKey as string} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: <span className="font-bold">{typeof entry.value === "number" ? entry.value.toFixed(2) : "-"}</span> / 5.0
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              {templateNames.map((name) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={TEMPLATE_COLORS[name] ?? DEFAULT_COLOR}
                  strokeWidth={2}
                  dot={chartData.length <= 30 ? { r: 3 } : false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
