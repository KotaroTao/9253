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
import { Users, Banknote, BarChart3, Wallet, XCircle } from "lucide-react"
import { calcDerived } from "@/lib/metrics-utils"
import type { MonthlySummary } from "@/lib/metrics-utils"

interface TrendRow extends MonthlySummary {
  year: number
  month: number
}

function formatMonth(year: number, month: number) {
  return `${year}/${String(month).padStart(2, "0")}`
}

function formatMonthShort(_year: number, month: number) {
  return `${month}月`
}

interface MonthRange {
  from: string // YYYY-MM
  to: string   // YYYY-MM
}

interface MonthlyTrendSummaryProps {
  months?: number
  customRange?: MonthRange | null
}

// Reusable data table below charts
function DataTable({ rows, data }: {
  rows: { label: string; key: string; format?: (v: number) => string; color?: string }[]
  data: Record<string, unknown>[]
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[500px] text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
              月
            </th>
            {data.map((d) => (
              <th key={d.month as string} className="px-2.5 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                {d.monthShort as string}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key} className={i < rows.length - 1 ? "border-b" : ""}>
              <td className="sticky left-0 z-10 bg-card px-3 py-1.5 whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                  {row.color && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                  )}
                  <span className="font-medium text-muted-foreground">{row.label}</span>
                </span>
              </td>
              {data.map((d) => {
                const val = d[row.key] as number | null
                return (
                  <td key={d.month as string} className="px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap">
                    {val != null ? (row.format ? row.format(val) : val.toLocaleString()) : (
                      <span className="text-muted-foreground/40">-</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Chart section wrapper with icon and accent
function ChartSection({ icon, title, accentColor, children }: {
  icon: React.ReactNode
  title: string
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {children}
      </CardContent>
    </Card>
  )
}

// Summary stat card
function SummaryStat({ label, value, sub, color }: {
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold"
        style={{ backgroundColor: `${color}12`, color }}
      >
        {value.replace(/[^0-9.,-]/g, "").slice(0, 4)}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold">{value}{sub && <span className="ml-1 text-xs font-normal text-muted-foreground">{sub}</span>}</p>
      </div>
    </div>
  )
}

export function MonthlyTrendSummary({ months = 12, customRange }: MonthlyTrendSummaryProps) {
  const [data, setData] = useState<TrendRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function fetchTrend() {
      try {
        const query = customRange
          ? `mode=trend&fromMonth=${customRange.from}&toMonth=${customRange.to}`
          : `mode=trend&months=${months}`
        const res = await fetch(`/api/monthly-metrics?${query}`, { cache: "no-store" })
        if (res.ok && !cancelled) {
          setData(await res.json())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTrend()
    return () => { cancelled = true }
  }, [months, customRange])

  const m = messages.monthlyMetrics

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-sm text-muted-foreground">{m.noData}</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for charts
  const chartData = data.map((row) => {
    const derived = calcDerived(row, 0)
    const totalRevenue = row.insuranceRevenue != null && row.selfPayRevenue != null
      ? row.insuranceRevenue + row.selfPayRevenue : null
    return {
      month: formatMonth(row.year, row.month),
      monthShort: formatMonthShort(row.year, row.month),
      firstVisitCount: row.firstVisitCount,
      revisitCount: row.revisitCount,
      totalPatients: derived?.totalPatients ?? null,
      totalRevenue,
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

  // Latest month summary for quick stats
  const latest = chartData[chartData.length - 1]
  const prev = chartData.length > 1 ? chartData[chartData.length - 2] : null

  const COLORS = {
    blue: "hsl(221, 83%, 53%)",
    blueLight: "hsl(221, 83%, 75%)",
    gold: "hsl(38, 92%, 50%)",
    green: "hsl(142, 71%, 45%)",
    red: "hsl(0, 84%, 60%)",
    redDark: "hsl(0, 60%, 45%)",
    purple: "hsl(262, 83%, 58%)",
  }

  return (
    <div className="space-y-5">
      {/* Quick summary cards */}
      {latest && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryStat
            label="直近月 総実人数"
            value={latest.totalPatients != null ? `${latest.totalPatients}人` : "-"}
            sub={prev?.totalPatients != null && latest.totalPatients != null
              ? `(前月比 ${latest.totalPatients - prev.totalPatients >= 0 ? "+" : ""}${latest.totalPatients - prev.totalPatients})`
              : undefined}
            color={COLORS.blue}
          />
          <SummaryStat
            label="直近月 総売上"
            value={latest.totalRevenue != null ? `${latest.totalRevenue}万円` : "-"}
            sub={prev?.totalRevenue != null && latest.totalRevenue != null
              ? `(前月比 ${latest.totalRevenue - prev.totalRevenue >= 0 ? "+" : ""}${latest.totalRevenue - prev.totalRevenue})`
              : undefined}
            color={COLORS.gold}
          />
          <SummaryStat
            label="直近月 自費率"
            value={latest.selfPayRatioAmount != null ? `${latest.selfPayRatioAmount}%` : "-"}
            color={COLORS.purple}
          />
          <SummaryStat
            label="直近月 患者単価"
            value={latest.revenuePerVisit != null ? `${latest.revenuePerVisit}万円` : "-"}
            color={COLORS.green}
          />
        </div>
      )}

      {/* 来院数推移 */}
      <ChartSection
        icon={<Users className="h-4 w-4" />}
        title="来院数推移"
        accentColor={COLORS.blue}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="firstVisitCount" name={m.firstVisitCount} fill={COLORS.blue} stackId="visits" radius={[0, 0, 0, 0]} />
            <Bar dataKey="revisitCount" name={m.revisitCount} fill={COLORS.blueLight} stackId="visits" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <DataTable
          data={chartData}
          rows={[
            { label: m.firstVisitCount, key: "firstVisitCount", color: COLORS.blue, format: (v) => `${v}人` },
            { label: m.revisitCount, key: "revisitCount", color: COLORS.blueLight, format: (v) => `${v}人` },
            { label: m.totalPatients, key: "totalPatients", color: undefined, format: (v) => `${v}人` },
          ]}
        />
      </ChartSection>

      {/* 売上推移 */}
      <ChartSection
        icon={<Banknote className="h-4 w-4" />}
        title="売上推移（万円）"
        accentColor={COLORS.gold}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              formatter={(value: number) => `${value}万円`}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="insuranceRevenue" name={m.insuranceRevenue} fill={COLORS.blue} stackId="rev" radius={[0, 0, 0, 0]} />
            <Bar dataKey="selfPayRevenue" name={m.selfPayRevenue} fill={COLORS.gold} stackId="rev" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <DataTable
          data={chartData}
          rows={[
            { label: m.insuranceRevenue, key: "insuranceRevenue", color: COLORS.blue, format: (v) => `${v}万` },
            { label: m.selfPayRevenue, key: "selfPayRevenue", color: COLORS.gold, format: (v) => `${v}万` },
            { label: m.totalRevenue, key: "totalRevenue", color: undefined, format: (v) => `${v}万` },
          ]}
        />
      </ChartSection>

      {/* 経営指標推移 */}
      <ChartSection
        icon={<BarChart3 className="h-4 w-4" />}
        title="経営指標推移"
        accentColor={COLORS.purple}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              formatter={(value: number) => `${value}%`}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Line type="monotone" dataKey="selfPayRatioAmount" name={m.selfPayRatioAmount} stroke={COLORS.gold} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="newPatientRate" name={m.newPatientRate} stroke={COLORS.blue} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="returnRate" name={m.returnRate} stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="cancellationRate" name={m.cancellationRate} stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <DataTable
          data={chartData}
          rows={[
            { label: m.selfPayRatioAmount, key: "selfPayRatioAmount", color: COLORS.gold, format: (v) => `${v}%` },
            { label: m.newPatientRate, key: "newPatientRate", color: COLORS.blue, format: (v) => `${v}%` },
            { label: m.returnRate, key: "returnRate", color: COLORS.green, format: (v) => `${v}%` },
            { label: m.cancellationRate, key: "cancellationRate", color: COLORS.red, format: (v) => `${v}%` },
          ]}
        />
      </ChartSection>

      {/* 患者単価推移 */}
      <ChartSection
        icon={<Wallet className="h-4 w-4" />}
        title="平均患者単価推移（万円）"
        accentColor={COLORS.green}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              formatter={(value: number) => `${value}万円`}
            />
            <Line type="monotone" dataKey="revenuePerVisit" name={m.revenuePerVisit} stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.green }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <DataTable
          data={chartData}
          rows={[
            { label: m.revenuePerVisit, key: "revenuePerVisit", color: COLORS.green, format: (v) => `${v.toFixed(1)}万` },
          ]}
        />
      </ChartSection>

      {/* キャンセル件数・キャンセル率推移 */}
      <ChartSection
        icon={<XCircle className="h-4 w-4" />}
        title="キャンセル件数・キャンセル率推移"
        accentColor={COLORS.red}
      >
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, (max: number) => Math.max(Math.ceil(max / 5) * 5, 10)]} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
              formatter={(value: number, name: string) => name === m.cancellationRate ? `${value}%` : `${value}件`}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar yAxisId="left" dataKey="cancellationCount" name={m.cancellationCount} fill={COLORS.red} radius={[3, 3, 0, 0]} opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="cancellationRate" name={m.cancellationRate} stroke={COLORS.redDark} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
        <DataTable
          data={chartData}
          rows={[
            { label: m.cancellationCount, key: "cancellationCount", color: COLORS.red, format: (v) => `${v}件` },
            { label: m.cancellationRate, key: "cancellationRate", color: COLORS.redDark, format: (v) => `${v}%` },
          ]}
        />
      </ChartSection>
    </div>
  )
}
