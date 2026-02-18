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

const TEMPLATE_COLORS: Record<string, string> = {
  "初診": "#2563eb",
  "治療中": "#16a34a",
  "定期検診": "#f59e0b",
}

const DEFAULT_COLOR = "#6b7280"

interface Props {
  data: TemplateTrendPoint[]
}

interface TemplateStats {
  name: string
  color: string
  avgScore: number | null
  totalCount: number
  trend: "up" | "down" | "flat"
  trendDiff: number
  chartData: { date: string; score: number | null }[]
}

export function TemplateTrendSmallMultiples({ data }: Props) {
  const templates = useMemo(() => {
    // Group by template
    const groups = new Map<string, TemplateTrendPoint[]>()
    for (const point of data) {
      if (!groups.has(point.templateName)) {
        groups.set(point.templateName, [])
      }
      groups.get(point.templateName)!.push(point)
    }

    const result: TemplateStats[] = []
    // Sort in a fixed order
    const order = ["初診", "治療中", "定期検診"]
    const sortedNames = Array.from(groups.keys()).sort(
      (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
    )

    for (const name of sortedNames) {
      const points = groups.get(name)!
      const color = TEMPLATE_COLORS[name] ?? DEFAULT_COLOR

      // Calculate average and total count
      const scored = points.filter((p) => p.avgScore != null)
      const totalCount = points.reduce((sum, p) => sum + p.count, 0)
      const avgScore =
        scored.length > 0
          ? Math.round((scored.reduce((sum, p) => sum + p.avgScore!, 0) / scored.length) * 100) / 100
          : null

      // Calculate trend: compare first half vs second half
      const mid = Math.floor(scored.length / 2)
      const firstHalf = scored.slice(0, mid)
      const secondHalf = scored.slice(mid)
      let trend: "up" | "down" | "flat" = "flat"
      let trendDiff = 0
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg = firstHalf.reduce((s, p) => s + p.avgScore!, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((s, p) => s + p.avgScore!, 0) / secondHalf.length
        trendDiff = Math.round((secondAvg - firstAvg) * 100) / 100
        if (trendDiff > 0.05) trend = "up"
        else if (trendDiff < -0.05) trend = "down"
      }

      // Chart data
      const chartData = points.map((p) => ({
        date: p.date,
        score: p.avgScore,
      }))

      result.push({ name, color, avgScore, totalCount, trend, trendDiff, chartData })
    }

    return result
  }, [data])

  if (templates.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-3">
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
            <p className="text-xs text-muted-foreground">
              回答 {t.totalCount.toLocaleString()}件
            </p>

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
  )
}
