"use client"

import { useState, useEffect, useRef } from "react"
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
  ReferenceLine,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  Users, Banknote, XCircle,
  TrendingUp, TrendingDown, Minus,
  AlertCircle, HelpCircle, X, ChevronDown,
  Gauge, Briefcase, Lightbulb,
  BarChart3, CalendarClock,
} from "lucide-react"
import { calcDerived, calcProfileDerived, getBenchmarkStatus, generateInsights } from "@/lib/metrics-utils"
import type { MonthlySummary, ClinicProfile, MetricsInsight, BenchmarkStatus, ClinicType } from "@/lib/metrics-utils"

interface TrendRow extends MonthlySummary {
  year: number
  month: number
  satisfactionScore?: number | null
  surveyCount?: number
}

type FullMetrics = MonthlySummary & ClinicProfile & Record<string, unknown>

interface SeasonalIndicesData {
  level: "self" | "specialty" | "platform" | "none"
  revenue: { byMonth: Record<number, number> }
  patientCount: { byMonth: Record<number, number> }
  clinicCount: number
  label: string | null
}

interface SingleMonthData {
  summary: FullMetrics | null
  prevSummary: FullMetrics | null
  yoySummary: FullMetrics | null
  surveyCount: number
  satisfactionScore: number | null
  prevSatisfactionScore: number | null
  seasonalIndices?: SeasonalIndicesData
}

function formatMonth(year: number, month: number) {
  return `${year}/${String(month).padStart(2, "0")}`
}

function formatMonthShort(_year: number, month: number) {
  return `${month}月`
}

interface MonthlyTrendSummaryProps {
  year: number
  month: number
  clinicType?: string
}

// Data table (always visible)
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

// KPI card for section headers
function KpiCard({ label, value, sub, momDelta, yoyDelta, seasonalDelta, statusColor, helpKey }: {
  label: string
  value: string
  sub?: string
  momDelta?: string | null
  yoyDelta?: string | null
  seasonalDelta?: string | null
  statusColor?: string
  helpKey?: KpiHelpKey
}) {
  return (
    <div className={`rounded-xl border p-4 ${statusColor ? statusColor : "bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {label}
        {helpKey && <KpiHelpButton helpKey={helpKey} />}
      </p>
      <p className="text-2xl font-bold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-muted-foreground">{sub}</span>}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
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
        {seasonalDelta != null && (
          <span className={`flex items-center gap-0.5 ${seasonalDelta.startsWith("+") ? "text-blue-600" : seasonalDelta.startsWith("-") ? "text-orange-500" : "text-muted-foreground"}`}>
            <CalendarClock className="h-3 w-3" />
            季節調整{seasonalDelta}
          </span>
        )}
      </div>
    </div>
  )
}

// Sub-metric (small inline display below cards)
function SubMetric({ label, value, unit }: { label: string; value: string | null; unit: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {label}{" "}
      <span className="font-medium text-foreground tabular-nums">{value ?? "-"}</span>
      {value != null && unit}
    </span>
  )
}

function formatDelta(current: number | null, prev: number | null, unit: string = ""): string | null {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return "±0" + unit
  return `${diff > 0 ? "+" : ""}${diff}${unit}`
}

// KPI help tooltip
type KpiHelpKey = keyof typeof messages.monthlyMetrics.kpiHelp

function KpiHelpButton({ helpKey }: { helpKey?: KpiHelpKey }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  if (!helpKey) return null
  const help = messages.monthlyMetrics.kpiHelp[helpKey]
  if (!help) return null

  return (
    <span className="relative inline-block align-middle" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="ml-1 inline-flex items-center text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        aria-label="指標の説明"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-56 rounded-lg border bg-popover p-3 shadow-lg text-left">
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs text-popover-foreground leading-relaxed">{help.desc}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            <span className="font-medium">目安:</span> {help.benchmark}
          </p>
        </div>
      )}
    </span>
  )
}

// Section wrapper with icon + title
function Section({ icon, title, accentColor, children }: {
  icon: React.ReactNode
  title: string
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

// Collapsible section
function CollapsibleSection({ icon, title, accentColor, children }: {
  icon: React.ReactNode
  title: string
  accentColor: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardContent className="pt-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {icon}
            </span>
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  )
}

// Derived KPI card in a grid
function DerivedKpiCard({ label, value, format, prev, helpKey, benchmarkKey, ct }: {
  label: string
  value: number | null
  format: (v: number) => string
  prev: number | null
  helpKey?: KpiHelpKey
  benchmarkKey?: string
  ct: ClinicType
}) {
  const status: BenchmarkStatus | null = benchmarkKey ? getBenchmarkStatus(benchmarkKey, value, ct) : null
  const m = messages.monthlyMetrics
  return (
    <div className={`rounded-lg border p-3 ${
      status === "good" ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/30" :
      status === "warning" ? "bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30" :
      status === "danger" ? "bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-900/30" :
      "bg-muted/30"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {label}
          <KpiHelpButton helpKey={helpKey} />
        </p>
        {status && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            status === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
            status === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
            "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
          }`}>
            {status === "good" ? m.statusGood : status === "warning" ? m.statusWarning : m.statusDanger}
          </span>
        )}
      </div>
      <p className="text-lg font-bold">
        {value != null ? format(value) : <span className="text-muted-foreground/50">-</span>}
        <DerivedDelta current={value} prev={prev} />
      </p>
    </div>
  )
}

// Derived KPI delta indicator
function DerivedDelta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current == null || prev == null) return null
  const diff = Math.round((current - prev) * 10) / 10
  if (diff === 0) return null
  const isUp = diff > 0
  return (
    <span className={`ml-1 text-xs ${isUp ? "text-emerald-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
      {" "}{isUp ? "+" : ""}{diff}
    </span>
  )
}

export function MonthlyTrendSummary({ year, month, clinicType }: MonthlyTrendSummaryProps) {
  const ct = (clinicType ?? "general") as ClinicType
  const [trendData, setTrendData] = useState<TrendRow[]>([])
  const [monthData, setMonthData] = useState<SingleMonthData | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if selected month is the current month
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchData() {
      try {
        // Calculate 12-month range ending at the selected month
        const toYM = `${year}-${String(month).padStart(2, "0")}`
        const fromDate = new Date(year, month - 12, 1)
        const fromYM = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`

        // Fetch single-month data and trend data in parallel
        const [monthRes, trendRes] = await Promise.all([
          fetch(`/api/monthly-metrics?year=${year}&month=${month}`, { cache: "no-store" }),
          fetch(`/api/monthly-metrics?mode=trend&fromMonth=${fromYM}&toMonth=${toYM}&withSatisfaction=1`, { cache: "no-store" }),
        ])

        if (!cancelled) {
          if (monthRes.ok) {
            const data = await monthRes.json()
            setMonthData(data)
          }
          if (trendRes.ok) {
            setTrendData(await trendRes.json())
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [year, month])

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

  // Single month derived data
  const summary = monthData?.summary ?? null
  const prevSummary = monthData?.prevSummary ?? null
  const yoySummary = monthData?.yoySummary ?? null
  const surveyCount = monthData?.surveyCount ?? 0

  const derived = calcDerived(summary, surveyCount)
  const prevDerived = calcDerived(prevSummary, 0)
  const yoyDerived = calcDerived(yoySummary, 0)

  // Profile derived
  function extractProfile(data: FullMetrics | null): ClinicProfile | null {
    if (!data) return null
    return {
      chairCount: data.chairCount ?? null,
      dentistCount: data.dentistCount ?? null,
      hygienistCount: data.hygienistCount ?? null,
      totalVisitCount: data.totalVisitCount ?? null,
      workingDays: data.workingDays ?? null,
      laborCost: data.laborCost ?? null,
    }
  }
  const currentProfile = extractProfile(summary)
  const prevProfileData = extractProfile(prevSummary)
  const profileDerived = calcProfileDerived(summary, currentProfile)
  const prevProfileDerived = calcProfileDerived(prevSummary, prevProfileData)

  // Total revenue
  const totalRevenue = summary?.insuranceRevenue != null && summary?.selfPayRevenue != null
    ? summary.insuranceRevenue + summary.selfPayRevenue : (summary?.totalRevenue ?? null)
  const prevTotalRevenue = prevSummary?.insuranceRevenue != null && prevSummary?.selfPayRevenue != null
    ? prevSummary.insuranceRevenue + prevSummary.selfPayRevenue : (prevSummary?.totalRevenue ?? null)
  const yoyTotalRevenue = yoySummary?.insuranceRevenue != null && yoySummary?.selfPayRevenue != null
    ? yoySummary.insuranceRevenue + yoySummary.selfPayRevenue : (yoySummary?.totalRevenue ?? null)

  // Seasonal indices
  const si = monthData?.seasonalIndices ?? null
  const hasSeasonal = si && si.level !== "none"
  const revIdx = hasSeasonal ? (si.revenue.byMonth[month] ?? 1.0) : 1.0
  const patIdx = hasSeasonal ? (si.patientCount.byMonth[month] ?? 1.0) : 1.0

  // Seasonal-adjusted MoM deltas
  const prevMonth2 = month === 1 ? 12 : month - 1
  const prevRevIdx = hasSeasonal ? (si.revenue.byMonth[prevMonth2] ?? 1.0) : 1.0
  const prevPatIdx = hasSeasonal ? (si.patientCount.byMonth[prevMonth2] ?? 1.0) : 1.0

  function formatSeasonalDelta(current: number | null, prev: number | null, curIdx: number, prevIdx: number): string | null {
    if (!hasSeasonal || current == null || prev == null || curIdx <= 0 || prevIdx <= 0) return null
    const normCurrent = current / curIdx
    const normPrev = prev / prevIdx
    const diff = Math.round((normCurrent - normPrev) * 10) / 10
    if (diff === 0) return "±0"
    return `${diff > 0 ? "+" : ""}${diff}`
  }

  const seasonalRevDelta = formatSeasonalDelta(totalRevenue, prevTotalRevenue, revIdx, prevRevIdx)
  const seasonalPatDelta = hasSeasonal && derived?.totalPatients != null && prevDerived?.totalPatients != null && patIdx > 0 && prevPatIdx > 0
    ? (() => {
        const norm = derived.totalPatients / patIdx
        const normPrev = prevDerived.totalPatients / prevPatIdx
        const diff = Math.round((norm - normPrev) * 10) / 10
        if (diff === 0) return "±0"
        return `${diff > 0 ? "+" : ""}${diff}`
      })()
    : null

  // Generate insights
  const insights = generateInsights({
    current: derived,
    prev: prevDerived,
    yoy: yoyDerived,
    currentSummary: summary,
    prevSummary: prevSummary,
    yoySummary: yoySummary,
    satisfactionScore: monthData?.satisfactionScore ?? null,
    prevSatisfactionScore: monthData?.prevSatisfactionScore ?? null,
  })

  // Seasonal insights
  const seasonalInsights: Array<{ type: "high" | "low" | "normal"; message: string }> = []
  if (hasSeasonal) {
    const sm = messages.monthlyMetrics.seasonal
    if (revIdx >= 1.05) {
      seasonalInsights.push({ type: "high", message: sm.insightAboveSeasonal("売上", Math.round((revIdx - 1) * 1000) / 10) })
    } else if (revIdx <= 0.95) {
      seasonalInsights.push({ type: "low", message: sm.insightBelowSeasonal("売上", Math.round((1 - revIdx) * 1000) / 10) })
    }
    if (patIdx >= 1.05) {
      seasonalInsights.push({ type: "high", message: sm.insightAboveSeasonal("患者数", Math.round((patIdx - 1) * 1000) / 10) })
    } else if (patIdx <= 0.95) {
      seasonalInsights.push({ type: "low", message: sm.insightBelowSeasonal("患者数", Math.round((1 - patIdx) * 1000) / 10) })
    }
  }

  // Transform trend data for charts
  const chartData = trendData.map((row) => {
    const d = calcDerived(row, 0)
    const tRev = row.insuranceRevenue != null && row.selfPayRevenue != null
      ? row.insuranceRevenue + row.selfPayRevenue : null
    return {
      month: formatMonth(row.year, row.month),
      monthShort: formatMonthShort(row.year, row.month),
      firstVisitCount: row.firstVisitCount,
      revisitCount: row.revisitCount,
      totalPatients: d?.totalPatients ?? null,
      totalRevenue: tRev,
      selfPayRevenue: row.selfPayRevenue,
      insuranceRevenue: row.insuranceRevenue,
      cancellationCount: row.cancellationCount,
      selfPayRatioAmount: d?.selfPayRatioAmount ?? null,
      returnRate: d?.returnRate ?? null,
      cancellationRate: d?.cancellationRate ?? null,
      satisfactionScore: row.satisfactionScore ?? null,
      surveyCount: row.surveyCount ?? 0,
    }
  })

  const hasNoData = !summary

  const COLORS = {
    blue: "hsl(221, 83%, 53%)",
    blueLight: "hsl(221, 83%, 75%)",
    gold: "hsl(38, 92%, 50%)",
    goldDark: "hsl(38, 70%, 40%)",
    green: "hsl(142, 71%, 45%)",
    red: "hsl(0, 84%, 60%)",
    redDark: "hsl(0, 60%, 45%)",
    teal: "hsl(174, 72%, 40%)",
    tealLight: "hsl(174, 55%, 65%)",
    purple: "hsl(262, 60%, 50%)",
  }

  if (hasNoData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">{m.noData}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* 当月表示の注意バナー */}
      {isCurrentMonth && (
        <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {m.currentMonthNotice}
          </p>
        </div>
      )}

      {/* 季節傾向バナー */}
      {hasSeasonal && (revIdx >= 1.05 || revIdx <= 0.95 || patIdx >= 1.05 || patIdx <= 0.95) && (
        <div className="flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-3 dark:border-purple-900/50 dark:bg-purple-950/20">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
          <div className="text-sm text-purple-700 dark:text-purple-300">
            <p className="font-medium">{month}月の季節傾向</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
              <span>
                売上指数: <span className="font-semibold">{revIdx.toFixed(2)}</span>
                {revIdx >= 1.05 && <span className="ml-1 text-emerald-600">({m.seasonal.highSeason})</span>}
                {revIdx <= 0.95 && <span className="ml-1 text-amber-600">({m.seasonal.lowSeason})</span>}
              </span>
              <span>
                患者数指数: <span className="font-semibold">{patIdx.toFixed(2)}</span>
                {patIdx >= 1.05 && <span className="ml-1 text-emerald-600">({m.seasonal.highSeason})</span>}
                {patIdx <= 0.95 && <span className="ml-1 text-amber-600">({m.seasonal.lowSeason})</span>}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-purple-500">
              {si.label} {m.seasonal.noteForMetrics}
            </p>
          </div>
        </div>
      )}

      {/* ① 売上・収益 */}
      <Section icon={<Banknote className="h-4 w-4" />} title="売上・収益" accentColor={COLORS.gold}>
        {/* Main KPI cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="総売上"
            value={totalRevenue != null ? `${totalRevenue}` : "-"}
            sub="万円"
            momDelta={formatDelta(totalRevenue, prevTotalRevenue)}
            yoyDelta={formatDelta(totalRevenue, yoyTotalRevenue)}
            seasonalDelta={seasonalRevDelta}
          />
          <KpiCard
            label={m.selfPayRatioAmount}
            value={derived?.selfPayRatioAmount != null ? `${derived.selfPayRatioAmount}` : "-"}
            sub="%"
            momDelta={formatDelta(derived?.selfPayRatioAmount ?? null, prevDerived?.selfPayRatioAmount ?? null, "pt")}
            statusColor={getBenchmarkStatus("selfPayRatioAmount", derived?.selfPayRatioAmount ?? null, ct) === "good" ? "bg-emerald-50/50 dark:bg-emerald-950/20" : undefined}
            helpKey="selfPayRatioAmount"
          />
          <KpiCard
            label={m.revenuePerVisit}
            value={derived?.revenuePerVisit != null ? `${derived.revenuePerVisit}` : "-"}
            sub="万円"
            momDelta={formatDelta(derived?.revenuePerVisit ?? null, prevDerived?.revenuePerVisit ?? null)}
            helpKey="revenuePerVisit"
          />
          <KpiCard
            label={m.dailyRevenue}
            value={profileDerived?.dailyRevenue != null ? `${profileDerived.dailyRevenue}` : "-"}
            sub="万円"
            momDelta={formatDelta(profileDerived?.dailyRevenue ?? null, prevProfileDerived?.dailyRevenue ?? null)}
            helpKey="dailyRevenue"
          />
        </div>
        {/* Sub-metrics */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
          <SubMetric label={m.insuranceRevenue} value={summary?.insuranceRevenue != null ? `${summary.insuranceRevenue}` : null} unit="万円" />
          <SubMetric label={m.selfPayRevenue} value={summary?.selfPayRevenue != null ? `${summary.selfPayRevenue}` : null} unit="万円" />
          <SubMetric label={m.revenuePerReceipt} value={profileDerived?.revenuePerReceipt != null ? `${profileDerived.revenuePerReceipt}` : null} unit="万円" />
        </div>
        {/* Revenue trend chart */}
        {chartData.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">売上推移</p>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  formatter={(value: number, name: string) => {
                    if (name === m.selfPayRatioAmount) return `${value}%`
                    return `${value}万円`
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar yAxisId="left" dataKey="insuranceRevenue" name={m.insuranceRevenue} fill={COLORS.blue} stackId="rev" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="selfPayRevenue" name={m.selfPayRevenue} fill={COLORS.gold} stackId="rev" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="selfPayRatioAmount" name={m.selfPayRatioAmount} stroke={COLORS.goldDark} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <DataTable
              data={chartData}
              rows={[
                { label: m.insuranceRevenue, key: "insuranceRevenue", color: COLORS.blue, format: (v) => `${v}万` },
                { label: m.selfPayRevenue, key: "selfPayRevenue", color: COLORS.gold, format: (v) => `${v}万` },
                { label: m.totalRevenue, key: "totalRevenue", format: (v) => `${v}万` },
                { label: m.selfPayRatioAmount, key: "selfPayRatioAmount", color: COLORS.goldDark, format: (v) => `${v}%` },
              ]}
            />
          </div>
        )}
      </Section>

      {/* ② 患者数・集患 */}
      <Section icon={<Users className="h-4 w-4" />} title="患者数・集患" accentColor={COLORS.blue}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label={m.totalPatients}
            value={derived?.totalPatients != null ? `${derived.totalPatients}` : "-"}
            sub="人"
            momDelta={formatDelta(derived?.totalPatients ?? null, prevDerived?.totalPatients ?? null)}
            yoyDelta={formatDelta(derived?.totalPatients ?? null, yoyDerived?.totalPatients ?? null)}
            seasonalDelta={seasonalPatDelta}
          />
          <KpiCard
            label="新患数"
            value={summary?.firstVisitCount != null ? `${summary.firstVisitCount}` : "-"}
            sub="人"
            momDelta={formatDelta(summary?.firstVisitCount ?? null, prevSummary?.firstVisitCount ?? null)}
            yoyDelta={formatDelta(summary?.firstVisitCount ?? null, yoySummary?.firstVisitCount ?? null)}
          />
          <KpiCard
            label={m.newPatientRate}
            value={derived?.newPatientRate != null ? `${derived.newPatientRate}` : "-"}
            sub="%"
            momDelta={formatDelta(derived?.newPatientRate ?? null, prevDerived?.newPatientRate ?? null, "pt")}
            helpKey="newPatientRate"
          />
          <KpiCard
            label={m.returnRate}
            value={derived?.returnRate != null ? `${derived.returnRate}` : "-"}
            sub="%"
            momDelta={formatDelta(derived?.returnRate ?? null, prevDerived?.returnRate ?? null, "pt")}
            statusColor={getBenchmarkStatus("returnRate", derived?.returnRate ?? null, ct) === "good" ? "bg-emerald-50/50 dark:bg-emerald-950/20" : undefined}
            helpKey="returnRate"
          />
        </div>
        {/* Patient trend chart */}
        {chartData.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">来院数推移</p>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  formatter={(value: number, name: string) => {
                    if (name === m.returnRate) return `${value}%`
                    return `${value}人`
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar yAxisId="left" dataKey="firstVisitCount" name={m.firstVisitCount} fill={COLORS.blue} stackId="visits" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="revisitCount" name={m.revisitCount} fill={COLORS.blueLight} stackId="visits" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="returnRate" name={m.returnRate} stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <DataTable
              data={chartData}
              rows={[
                { label: m.firstVisitCount, key: "firstVisitCount", color: COLORS.blue, format: (v) => `${v}人` },
                { label: m.revisitCount, key: "revisitCount", color: COLORS.blueLight, format: (v) => `${v}人` },
                { label: m.totalPatients, key: "totalPatients", format: (v) => `${v}人` },
                { label: m.returnRate, key: "returnRate", color: COLORS.green, format: (v) => `${v}%` },
              ]}
            />
          </div>
        )}
      </Section>

      {/* ③ 運営効率 */}
      <Section icon={<Gauge className="h-4 w-4" />} title="運営効率" accentColor={COLORS.red}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label={m.cancellationCount}
            value={summary?.cancellationCount != null ? `${summary.cancellationCount}` : "-"}
            sub="件"
            momDelta={formatDelta(summary?.cancellationCount ?? null, prevSummary?.cancellationCount ?? null)}
          />
          <KpiCard
            label={m.cancellationRate}
            value={derived?.cancellationRate != null ? `${derived.cancellationRate}` : "-"}
            sub="%"
            momDelta={formatDelta(derived?.cancellationRate ?? null, prevDerived?.cancellationRate ?? null, "pt")}
            statusColor={getBenchmarkStatus("cancellationRate", derived?.cancellationRate ?? null, ct) === "danger" ? "bg-red-50/50 dark:bg-red-950/20" : undefined}
            helpKey="cancellationRate"
          />
          <KpiCard
            label={m.chairDailyVisits}
            value={profileDerived?.chairDailyVisits != null ? `${profileDerived.chairDailyVisits}` : "-"}
            sub={m.unitVisitsPerChairDay}
            momDelta={formatDelta(profileDerived?.chairDailyVisits ?? null, prevProfileDerived?.chairDailyVisits ?? null)}
            helpKey="chairDailyVisits"
          />
          <KpiCard
            label={m.surveyResponseRate}
            value={derived?.surveyResponseRate != null ? `${derived.surveyResponseRate}` : "-"}
            sub="%"
            helpKey="surveyResponseRate"
          />
        </div>
        {/* Cancellation trend chart */}
        {chartData.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">キャンセル推移</p>
            <ResponsiveContainer width="100%" height={240}>
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
          </div>
        )}
      </Section>

      {/* ④ 生産性・スタッフ（折りたたみ可能） */}
      <CollapsibleSection icon={<Briefcase className="h-4 w-4" />} title="生産性・スタッフ" accentColor={COLORS.purple}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <DerivedKpiCard label={m.revenuePerDentist} value={profileDerived?.revenuePerDentist ?? null} format={(v) => `${v}${m.unitMan}`} prev={prevProfileDerived?.revenuePerDentist ?? null} helpKey="revenuePerDentist" ct={ct} />
          <DerivedKpiCard label={m.patientsPerDentist} value={profileDerived?.patientsPerDentist ?? null} format={(v) => `${v}${m.unitPersons}`} prev={prevProfileDerived?.patientsPerDentist ?? null} helpKey="patientsPerDentist" ct={ct} />
          <DerivedKpiCard label={m.patientsPerHygienist} value={profileDerived?.patientsPerHygienist ?? null} format={(v) => `${v}${m.unitPersons}`} prev={prevProfileDerived?.patientsPerHygienist ?? null} helpKey="patientsPerHygienist" ct={ct} />
          <DerivedKpiCard label={m.revenuePerChair} value={profileDerived?.revenuePerChair ?? null} format={(v) => `${v}${m.unitMan}`} prev={prevProfileDerived?.revenuePerChair ?? null} helpKey="revenuePerChair" ct={ct} />
          <DerivedKpiCard label={m.revenuePerStaff} value={profileDerived?.revenuePerStaff ?? null} format={(v) => `${v}${m.unitMan}`} prev={prevProfileDerived?.revenuePerStaff ?? null} helpKey="revenuePerStaff" ct={ct} />
          <DerivedKpiCard label={m.laborCostRatio} value={profileDerived?.laborCostRatio ?? null} format={(v) => `${v}%`} prev={prevProfileDerived?.laborCostRatio ?? null} helpKey="laborCostRatio" benchmarkKey="laborCostRatio" ct={ct} />
          <DerivedKpiCard label={m.avgVisitsPerPatient} value={profileDerived?.avgVisitsPerPatient ?? null} format={(v) => `${v}${m.unitTimes}`} prev={prevProfileDerived?.avgVisitsPerPatient ?? null} helpKey="avgVisitsPerPatient" ct={ct} />
          <DerivedKpiCard label={m.dailyPatients} value={profileDerived?.dailyPatients ?? null} format={(v) => `${v}${m.unitVisitsPerDay}`} prev={prevProfileDerived?.dailyPatients ?? null} helpKey="dailyPatients" ct={ct} />
        </div>
      </CollapsibleSection>

      {/* ⑤ 月次インサイト */}
      {(insights.length > 0 || seasonalInsights.length > 0) && (
        <Section icon={<Lightbulb className="h-4 w-4" />} title={m.insightTitle} accentColor={COLORS.teal}>
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
            {seasonalInsights.map((si2, i) => (
              <div
                key={`seasonal-${i}`}
                className="flex items-start gap-2.5 rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-3 text-sm dark:border-purple-900/50 dark:bg-purple-950/20"
              >
                <span className="mt-0.5">
                  <CalendarClock className="h-4 w-4 text-purple-600" />
                </span>
                <p className="leading-relaxed text-purple-700 dark:text-purple-300">{si2.message}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
