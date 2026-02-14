import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { BarChart3 } from "lucide-react"
import type { BenchmarkData, BenchmarkMetric } from "@/lib/queries/benchmark"

interface ClinicBenchmarkProps {
  data: BenchmarkData
}

export function ClinicBenchmark({ data }: ClinicBenchmarkProps) {
  const { satisfaction, monthlyCount, totalClinics, hasEnoughData } = data

  if (!hasEnoughData) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <p className="text-sm font-medium">{messages.dashboard.benchmarkTitle}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {messages.dashboard.benchmarkNotEnoughData}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <BarChart3 className="h-4 w-4" />
            <p className="text-sm font-bold">{messages.dashboard.benchmarkTitle}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalClinics}{messages.dashboard.benchmarkClinicsCompared}
          </span>
        </div>

        <div className="mt-4 space-y-5">
          {satisfaction && (
            <BenchmarkRow
              label={messages.dashboard.benchmarkSatisfaction}
              metric={satisfaction}
              format={(v) => `${v.toFixed(1)}`}
              formatAvg={(v) => `${v.toFixed(1)}`}
            />
          )}

          {monthlyCount && (
            <BenchmarkRow
              label={messages.dashboard.benchmarkMonthlyCount}
              metric={monthlyCount}
              format={(v) => `${v}${messages.common.countSuffix}`}
              formatAvg={(v) => `${v}${messages.common.countSuffix}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BenchmarkRow({
  label,
  metric,
  format,
  formatAvg,
}: {
  label: string
  metric: BenchmarkMetric
  format: (v: number) => string
  formatAvg: (v: number) => string
}) {
  const topPercent = 100 - metric.percentile

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{format(metric.clinicValue)}</span>
          <span className="text-xs text-muted-foreground">
            {messages.dashboard.benchmarkPlatformAvg}: {formatAvg(metric.platformAvg)}
          </span>
        </div>
        {topPercent <= 50 && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            topPercent <= 10
              ? "bg-green-100 text-green-700"
              : topPercent <= 25
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700"
          }`}>
            {messages.dashboard.benchmarkTopPercent}{topPercent}%
          </span>
        )}
      </div>

      {/* Position bar */}
      <div className="mt-2 relative h-2 w-full rounded-full bg-slate-100">
        {/* Platform average marker */}
        <div
          className="absolute top-0 h-2 w-0.5 bg-slate-300"
          style={{ left: `50%` }}
        />
        {/* This clinic's position */}
        <div
          className="absolute top-[-2px] h-3 w-3 rounded-full border-2 border-white shadow-sm"
          style={{
            left: `${Math.max(2, Math.min(98, metric.percentile))}%`,
            transform: "translateX(-50%)",
            backgroundColor: metric.percentile >= 75
              ? "#22c55e"
              : metric.percentile >= 50
                ? "#3b82f6"
                : metric.percentile >= 25
                  ? "#f59e0b"
                  : "#94a3b8",
          }}
        />
      </div>
    </div>
  )
}
