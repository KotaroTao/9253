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
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { messages } from "@/lib/messages"
import {
  Users, Banknote, BarChart3, Wallet, XCircle,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Heart, Smile,
} from "lucide-react"
import { calcDerived, getBenchmarkStatus, generateInsights, buildKpiHealthItems, BENCHMARK_DOT } from "@/lib/metrics-utils"
import type { MonthlySummary, MetricsInsight, KpiHealthItem, ClinicType } from "@/lib/metrics-utils"

interface TrendRow extends MonthlySummary {
  year: number
  month: number
  satisfactionScore?: number | null
  surveyCount?: number
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
  clinicType?: string
}

// Collapsible data table below charts
function DataTable({ rows, data }: {
  rows: { label: string; key: string; format?: (v: number) => string; color?: string }[]
  data: Record<string, unknown>[]
}) {
  const [expanded, setExpanded] = useState(false)
  const m = messages.monthlyMetrics
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? m.hideDataTable : m.showDataTable}
      </button>
      {expanded && (
        <div className="mt-2 overflow-x-auto rounded-lg border">
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
      )}
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
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      {children}
    </div>
  )
}

// Scorecard stat item
function ScorecardStat({ label, value, sub, momDelta, yoyDelta, statusColor }: {
  label: string
  value: string
  sub?: string
  momDelta?: string | null
  yoyDelta?: string | null
  statusColor?: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${statusColor ? statusColor : "bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-muted-foreground">{sub}</span>}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-xs">
        {momDelta != null && (
          <span className={`flex items-center gap-0.5 ${momDelta.startsWith("+") ? "text-emerald-600" : momDelta.startsWith("-") ? "text-red-500" : "text-muted-foreground"}`}>
            {momDelta.startsWith("+") ? <TrendingUp className="h-3 w-3" /> : momDelta.startsWith("-") ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            前月{momDelta}
          </span>
        )}
        {yoyDelta != null && (
          <span className={`flex items-center gap-0.5 ${yoyDelta.startsWith("+") ? "text-emerald-600" : yoyDelta.startsWith("-") ? "text-red-500" : "text-muted-foreground"}`}>
            前年{yoyDelta}
          </span>
        )}
      </div>
    </div>
  )
}

function formatDelta(current: number | null, prev: number | null, unit: string = ""): string | null {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return "±0" + unit
  return `${diff > 0 ? "+" : ""}${diff}${unit}`
}

export function MonthlyTrendSummary({ months = 12, customRange, clinicType }: MonthlyTrendSummaryProps) {
  const ct = (clinicType ?? "general") as ClinicType
  const [data, setData] = useState<TrendRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function fetchTrend() {
      try {
        const query = customRange
          ? `mode=trend&fromMonth=${customRange.from}&toMonth=${customRange.to}&withSatisfaction=1`
          : `mode=trend&months=${months}&withSatisfaction=1`
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
      satisfactionScore: row.satisfactionScore ?? null,
    }
  })

  // Latest month summary for scorecard
  const latest = chartData[chartData.length - 1]
  const prev = chartData.length > 1 ? chartData[chartData.length - 2] : null

  // Find YoY data (same month, last year)
  const latestRow = data[data.length - 1]
  const yoyRow = data.find((r) => r.year === latestRow.year - 1 && r.month === latestRow.month)
  const yoyDerived = yoyRow ? calcDerived(yoyRow, 0) : null
  const latestDerived = calcDerived(latestRow, 0)
  const prevDerived = prev ? calcDerived(data[data.length - 2], 0) : null

  // Generate insights
  const insights = generateInsights({
    current: latestDerived,
    prev: prevDerived,
    yoy: yoyDerived,
    currentSummary: latestRow,
    prevSummary: data.length > 1 ? data[data.length - 2] : null,
    yoySummary: yoyRow ?? null,
    satisfactionScore: latest.satisfactionScore,
    prevSatisfactionScore: prev?.satisfactionScore ?? null,
  })

  // Build KPI health items
  const kpiHealth = buildKpiHealthItems(latestDerived, prevDerived, yoyDerived, ct)

  const yoyTotalRevenue = yoyRow?.insuranceRevenue != null && yoyRow?.selfPayRevenue != null
    ? yoyRow.insuranceRevenue + yoyRow.selfPayRevenue : null

  const COLORS = {
    blue: "hsl(221, 83%, 53%)",
    blueLight: "hsl(221, 83%, 75%)",
    gold: "hsl(38, 92%, 50%)",
    green: "hsl(142, 71%, 45%)",
    red: "hsl(0, 84%, 60%)",
    redDark: "hsl(0, 60%, 45%)",
    purple: "hsl(262, 83%, 58%)",
    pink: "hsl(330, 70%, 55%)",
  }

  return (
    <div className="space-y-5">
      {/* 1. 経営スコアカード */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          {m.scorecardTitle}
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <ScorecardStat
            label="総売上"
            value={latest.totalRevenue != null ? `${latest.totalRevenue}` : "-"}
            sub="万円"
            momDelta={formatDelta(latest.totalRevenue, prev?.totalRevenue ?? null)}
            yoyDelta={formatDelta(latest.totalRevenue, yoyTotalRevenue)}
          />
          <ScorecardStat
            label="総実人数"
            value={latest.totalPatients != null ? `${latest.totalPatients}` : "-"}
            sub="人"
            momDelta={formatDelta(latest.totalPatients, prev?.totalPatients ?? null)}
            yoyDelta={formatDelta(latest.totalPatients, yoyDerived?.totalPatients ?? null)}
          />
          <ScorecardStat
            label="新患数"
            value={latest.firstVisitCount != null ? `${latest.firstVisitCount}` : "-"}
            sub="人"
            momDelta={formatDelta(latest.firstVisitCount ?? null, prev?.firstVisitCount ?? null)}
            yoyDelta={formatDelta(latest.firstVisitCount ?? null, yoyRow?.firstVisitCount ?? null)}
          />
          <ScorecardStat
            label="自費率"
            value={latest.selfPayRatioAmount != null ? `${latest.selfPayRatioAmount}` : "-"}
            sub="%"
            momDelta={formatDelta(latest.selfPayRatioAmount, prev?.selfPayRatioAmount ?? null, "pt")}
            statusColor={getBenchmarkStatus("selfPayRatioAmount", latest.selfPayRatioAmount, ct) === "good" ? "bg-emerald-50/50 dark:bg-emerald-950/20" : undefined}
          />
          <ScorecardStat
            label="患者単価"
            value={latest.revenuePerVisit != null ? `${latest.revenuePerVisit}` : "-"}
            sub="万円"
            momDelta={formatDelta(latest.revenuePerVisit, prev?.revenuePerVisit ?? null)}
          />
          <ScorecardStat
            label="キャンセル率"
            value={latest.cancellationRate != null ? `${latest.cancellationRate}` : "-"}
            sub="%"
            momDelta={formatDelta(latest.cancellationRate, prev?.cancellationRate ?? null, "pt")}
            statusColor={getBenchmarkStatus("cancellationRate", latest.cancellationRate, ct) === "danger" ? "bg-red-50/50 dark:bg-red-950/20" : undefined}
          />
        </div>
      </div>

      {/* 2. PX × 経営トレンド */}
      {chartData.some((d) => d.satisfactionScore != null) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${COLORS.pink}15`, color: COLORS.pink }}>
                <Heart className="h-4 w-4" />
              </span>
              {m.pxHighlightTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  formatter={(value: number, name: string) => {
                    if (name === m.satisfactionScore) return `${value}点`
                    return `${value}人`
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar yAxisId="left" dataKey="totalPatients" name={m.totalPatients} fill={COLORS.blue} radius={[3, 3, 0, 0]} opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="satisfactionScore" name={m.satisfactionScore} stroke={COLORS.pink} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.pink }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 3. KPI ヘルスチェック */}
      {kpiHealth.length > 0 && kpiHealth.some((k) => k.value != null) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                <Smile className="h-4 w-4" />
              </span>
              {m.kpiHealthTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {kpiHealth.filter((k) => k.value != null).map((item: KpiHealthItem) => (
                <div key={item.key} className="flex items-center gap-3 rounded-lg border px-4 py-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.status ? BENCHMARK_DOT[item.status] : "bg-muted"}`} />
                  <span className="text-sm font-medium flex-1 min-w-0">{item.label}</span>
                  <span className="text-sm font-bold tabular-nums">{item.value != null ? item.format(item.value) : "-"}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[100px] justify-end">
                    {item.momDelta != null && (
                      <span className={item.momDelta > 0 ? "text-emerald-600" : item.momDelta < 0 ? "text-red-500" : ""}>
                        {item.momDelta > 0 ? "+" : ""}{item.momDelta}
                      </span>
                    )}
                    {item.status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        item.status === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                        item.status === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      }`}>
                        {item.status === "good" ? m.statusGood : item.status === "warning" ? m.statusWarning : m.statusDanger}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. 月次インサイト */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{m.insightTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight: MetricsInsight, i: number) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                    insight.type === "positive" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20" :
                    insight.type === "warning" ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20" :
                    "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20"
                  }`}
                >
                  <span className="mt-0.5">
                    {insight.type === "positive" ? <TrendingUp className="h-4 w-4 text-emerald-600" /> :
                     insight.type === "warning" ? <TrendingDown className="h-4 w-4 text-amber-600" /> :
                     <BarChart3 className="h-4 w-4 text-blue-600" />}
                  </span>
                  <p className="leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. トレンドチャート（タブ化） */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="visits">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="visits" className="text-xs">{m.tabVisits}</TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs">{m.tabRevenue}</TabsTrigger>
              <TabsTrigger value="kpi" className="text-xs">{m.tabKpi}</TabsTrigger>
              <TabsTrigger value="unitprice" className="text-xs">{m.tabUnitPrice}</TabsTrigger>
              <TabsTrigger value="cancel" className="text-xs">{m.tabCancel}</TabsTrigger>
            </TabsList>

            {/* 来院数推移 */}
            <TabsContent value="visits">
              <ChartSection icon={<Users className="h-3.5 w-3.5" />} title="来院数推移" accentColor={COLORS.blue}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
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
                    { label: m.totalPatients, key: "totalPatients", format: (v) => `${v}人` },
                  ]}
                />
              </ChartSection>
            </TabsContent>

            {/* 売上推移 */}
            <TabsContent value="revenue">
              <ChartSection icon={<Banknote className="h-3.5 w-3.5" />} title="売上推移（万円）" accentColor={COLORS.gold}>
                <ResponsiveContainer width="100%" height={280}>
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
                    { label: m.totalRevenue, key: "totalRevenue", format: (v) => `${v}万` },
                  ]}
                />
              </ChartSection>
            </TabsContent>

            {/* 経営指標推移 */}
            <TabsContent value="kpi">
              <ChartSection icon={<BarChart3 className="h-3.5 w-3.5" />} title="経営指標推移" accentColor={COLORS.purple}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                      formatter={(value: number) => `${value}%`}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    {/* ベンチマーク参考線 */}
                    <ReferenceLine y={20} yAxisId={0} stroke={COLORS.gold} strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "自費率目安20%", position: "insideTopRight", fontSize: 9, fill: COLORS.gold }} />
                    <ReferenceLine y={10} yAxisId={0} stroke={COLORS.red} strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "ｷｬﾝｾﾙ率上限10%", position: "insideBottomRight", fontSize: 9, fill: COLORS.red }} />
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
            </TabsContent>

            {/* 患者単価推移 */}
            <TabsContent value="unitprice">
              <ChartSection icon={<Wallet className="h-3.5 w-3.5" />} title="平均患者単価推移（万円）" accentColor={COLORS.green}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                      formatter={(value: number) => `${value}万円`}
                    />
                    <ReferenceLine y={1.0} stroke={COLORS.green} strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "目安1.0万", position: "insideTopRight", fontSize: 9, fill: COLORS.green }} />
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
            </TabsContent>

            {/* キャンセル推移 */}
            <TabsContent value="cancel">
              <ChartSection icon={<XCircle className="h-3.5 w-3.5" />} title="キャンセル件数・キャンセル率推移" accentColor={COLORS.red}>
                <ResponsiveContainer width="100%" height={260}>
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
                    <ReferenceLine yAxisId="right" y={10} stroke={COLORS.redDark} strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "上限10%", position: "insideTopRight", fontSize: 9, fill: COLORS.redDark }} />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
