"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import type { MonthlySummary } from "./monthly-summary-section"
import { calcDerived } from "./monthly-summary-section"

interface TrendRow extends MonthlySummary {
  year: number
  month: number
}

function formatMonth(year: number, month: number) {
  return `${year}/${String(month).padStart(2, "0")}`
}

interface MonthlyTrendSummaryProps {
  months?: number
}

export function MonthlyTrendSummary({ months = 12 }: MonthlyTrendSummaryProps) {
  const [data, setData] = useState<TrendRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function fetchTrend() {
      try {
        const res = await fetch(`/api/monthly-metrics?mode=trend&months=${months}`, { cache: "no-store" })
        if (res.ok && !cancelled) {
          setData(await res.json())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTrend()
    return () => { cancelled = true }
  }, [months])

  const m = messages.monthlyMetrics

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">{messages.common.loading}</p>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">{m.noData}</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for charts
  const chartData = data.map((row) => {
    const derived = calcDerived(row, 0)
    return {
      month: formatMonth(row.year, row.month),
      firstVisitCount: row.firstVisitCount,
      revisitCount: row.revisitCount,
      totalPatients: derived?.totalPatients ?? null,
      totalRevenue: row.totalRevenue,
      selfPayRevenue: row.selfPayRevenue,
      insuranceRevenue: row.insuranceRevenue,
      cancellationCount: row.cancellationCount,
      selfPayRatioAmount: derived?.selfPayRatioAmount ?? null,
      newPatientRate: derived?.newPatientRate ?? null,
      returnRate: derived?.returnRate ?? null,
      cancellationRate: derived?.cancellationRate ?? null,
      revenuePerVisit: derived?.revenuePerVisit ?? null,
    }
  })

  return (
    <div className="space-y-4">
      {/* 来院数推移 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">来院数推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="firstVisitCount" name={m.firstVisitCount} fill="hsl(221, 83%, 53%)" stackId="visits" />
              <Bar dataKey="revisitCount" name={m.revisitCount} fill="hsl(221, 83%, 75%)" stackId="visits" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 売上推移 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">売上推移（万円）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="insuranceRevenue" name={m.insuranceRevenue} fill="hsl(221, 83%, 53%)" stackId="rev" />
              <Bar dataKey="selfPayRevenue" name={m.selfPayRevenue} fill="hsl(38, 92%, 50%)" stackId="rev" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 自動算出指標の推移 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">経営指標推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="selfPayRatioAmount" name={m.selfPayRatioAmount} stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="newPatientRate" name={m.newPatientRate} stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="returnRate" name={m.returnRate} stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="cancellationRate" name={m.cancellationRate} stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 患者単価推移 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">平均患者単価推移（万円）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="revenuePerVisit" name={m.revenuePerVisit} stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* キャンセル件数・キャンセル率推移 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">キャンセル件数・キャンセル率推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis yAxisId="left" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} unit="%" domain={[0, (max: number) => Math.max(Math.ceil(max / 5) * 5, 10)]} />
              <Tooltip formatter={(value: number, name: string) => name === m.cancellationRate ? `${value}%` : value} />
              <Legend />
              <Bar yAxisId="left" dataKey="cancellationCount" name={m.cancellationCount} fill="hsl(0, 84%, 60%)" />
              <Line yAxisId="right" type="monotone" dataKey="cancellationRate" name={m.cancellationRate} stroke="hsl(0, 60%, 45%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
