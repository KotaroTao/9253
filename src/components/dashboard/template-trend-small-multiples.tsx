"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { TemplateTrendPoint } from "@/lib/queries/stats"
import type { CustomRange } from "./analytics-charts"

const TEMPLATE_COLORS: Record<string, string> = {
  "初診": "#2563eb",
  "再診": "#16a34a",
}

const DEFAULT_COLOR = "#6b7280"

interface Props {
  data: TemplateTrendPoint[]
  prevData: TemplateTrendPoint[]
  selectedPeriod: number
  customRange?: CustomRange | null
}

interface TemplateStats {
  name: string
  color: string
  avgScore: number | null
  prevAvgScore: number | null
  totalCount: number
  trend: "up" | "down" | "flat"
  trendDiff: number
  chartData: { date: string; score: number | null }[]
}

function formatPeriodLabel(days: number, offset: number): string {
  const end = new Date()
  end.setDate(end.getDate() - offset)
  const start = new Date()
  start.setDate(start.getDate() - offset - days + 1)

  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)}〜${fmt(end)}`
}

function calcWeightedAvg(points: TemplateTrendPoint[]): number | null {
  const totalCount = points.reduce((s, p) => s + p.count, 0)
  if (totalCount === 0) return null
  const weightedSum = points.reduce(
    (s, p) => s + (p.avgScore ?? 0) * p.count,
    0,
  )
  return Math.round((weightedSum / totalCount) * 100) / 100
}

export function TemplateTrendSmallMultiples({ data, prevData, selectedPeriod, customRange = null }: Props) {
  let currentLabel: string
  let prevLabel: string
  if (customRange) {
    const f = customRange.from.replace(/-/g, "/")
    const t = customRange.to.replace(/-/g, "/")
    currentLabel = `${f}〜${t}`
    // prev period label: compute from duration
    const fromDate = new Date(customRange.from)
    const toDate = new Date(customRange.to)
    const durationMs = toDate.getTime() - fromDate.getTime()
    const prevTo = new Date(fromDate.getTime() - 1)
    const prevFrom = new Date(prevTo.getTime() - durationMs)
    const fmt = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
    prevLabel = `${fmt(prevFrom)}〜${fmt(prevTo)}`
  } else {
    currentLabel = formatPeriodLabel(selectedPeriod, 0)
    prevLabel = formatPeriodLabel(selectedPeriod, selectedPeriod)
  }

  const templates = useMemo(() => {
    // Group current period by template
    const currentGroups = new Map<string, TemplateTrendPoint[]>()
    for (const point of data) {
      if (!currentGroups.has(point.templateName)) {
        currentGroups.set(point.templateName, [])
      }
      currentGroups.get(point.templateName)!.push(point)
    }

    // Group previous period by template
    const prevGroups = new Map<string, TemplateTrendPoint[]>()
    for (const point of prevData) {
      if (!prevGroups.has(point.templateName)) {
        prevGroups.set(point.templateName, [])
      }
      prevGroups.get(point.templateName)!.push(point)
    }

    const result: TemplateStats[] = []
    const order = ["初診", "再診"]
    const allNames = new Set([...Array.from(currentGroups.keys()), ...Array.from(prevGroups.keys())])
    const sortedNames = Array.from(allNames).sort(
      (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
    )

    for (const name of sortedNames) {
      const currentPoints = currentGroups.get(name) ?? []
      const prevPoints = prevGroups.get(name) ?? []
      const color = TEMPLATE_COLORS[name] ?? DEFAULT_COLOR

      const totalCount = currentPoints.reduce((sum, p) => sum + p.count, 0)
      const avgScore = calcWeightedAvg(currentPoints)
      const prevAvgScore = calcWeightedAvg(prevPoints)

      let trend: "up" | "down" | "flat" = "flat"
      let trendDiff = 0
      if (avgScore != null && prevAvgScore != null) {
        trendDiff = Math.round((avgScore - prevAvgScore) * 100) / 100
        if (trendDiff > 0.05) trend = "up"
        else if (trendDiff < -0.05) trend = "down"
      }

      const chartData = currentPoints.map((p) => ({
        date: p.date,
        score: p.avgScore,
      }))

      result.push({ name, color, avgScore, prevAvgScore, totalCount, trend, trendDiff, chartData })
    }

    return result
  }, [data, prevData])

  if (templates.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.name}>
            <CardContent className="py-4">
              {/* Header: name + color dot */}
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <p className="text-sm font-medium">{t.name}</p>
              </div>

              {/* Stats row */}
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-2xl font-bold">
                  {t.avgScore != null ? t.avgScore.toFixed(2) : "-"}
                </span>
                {t.trend !== "flat" && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      t.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.trend === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {t.trendDiff > 0 ? "+" : ""}
                    {t.trendDiff.toFixed(2)}
                  </span>
                )}
                {t.trend === "flat" && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                    <Minus className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* Period info */}
              <div className="mt-1 space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  {currentLabel}（回答 {t.totalCount.toLocaleString()}件）
                </p>
                <p className="text-xs text-muted-foreground">
                  前期 {prevLabel}: {t.prevAvgScore != null ? t.prevAvgScore.toFixed(2) : "-"}
                </p>
              </div>

              {/* Mini chart */}
              {t.chartData.length > 1 ? (
                <div className="mt-3">
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={t.chartData} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[1, 5]} hide />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          const val = payload[0].value
                          return (
                            <div className="rounded border bg-white px-2 py-1 text-xs shadow">
                              <p className="text-muted-foreground">{label}</p>
                              <p className="font-bold" style={{ color: t.color }}>
                                {typeof val === "number" ? val.toFixed(2) : "-"}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={t.color}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-3 flex h-[80px] items-center justify-center">
                  <p className="text-xs text-muted-foreground">データ不足</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
