"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  ClipboardCheck,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Link2,
  GitCompareArrows,
  CalendarClock,
  Activity,
  PieChart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdvisoryReportData, AdvisoryProgress } from "@/types"

const SECTION_CONFIG = {
  summary: {
    icon: ClipboardCheck,
    label: messages.advisory.sectionSummary,
    color: "blue",
  },
  strength: {
    icon: TrendingUp,
    label: messages.advisory.sectionStrength,
    color: "green",
  },
  improvement: {
    icon: AlertTriangle,
    label: messages.advisory.sectionImprovement,
    color: "amber",
  },
  trend: {
    icon: BarChart3,
    label: messages.advisory.sectionTrend,
    color: "purple",
  },
  action: {
    icon: Target,
    label: messages.advisory.sectionAction,
    color: "rose",
  },
  correlation: {
    icon: Link2,
    label: messages.advisory.sectionCorrelation,
    color: "indigo",
  },
  first_revisit_gap: {
    icon: GitCompareArrows,
    label: messages.advisory.sectionFirstRevisitGap,
    color: "teal",
  },
  time_pattern: {
    icon: CalendarClock,
    label: messages.advisory.sectionTimePattern,
    color: "orange",
  },
  action_effect: {
    icon: Activity,
    label: messages.advisory.sectionActionEffect,
    color: "emerald",
  },
  distribution: {
    icon: PieChart,
    label: messages.advisory.sectionDistribution,
    color: "slate",
  },
} as const

const COLOR_MAP: Record<string, { border: string; bg: string; icon: string; text: string }> = {
  blue: { border: "border-blue-200", bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-800" },
  green: { border: "border-green-200", bg: "bg-green-50", icon: "text-green-600", text: "text-green-800" },
  amber: { border: "border-amber-200", bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-800" },
  purple: { border: "border-purple-200", bg: "bg-purple-50", icon: "text-purple-600", text: "text-purple-800" },
  rose: { border: "border-rose-200", bg: "bg-rose-50", icon: "text-rose-600", text: "text-rose-800" },
  indigo: { border: "border-indigo-200", bg: "bg-indigo-50", icon: "text-indigo-600", text: "text-indigo-800" },
  teal: { border: "border-teal-200", bg: "bg-teal-50", icon: "text-teal-600", text: "text-teal-800" },
  orange: { border: "border-orange-200", bg: "bg-orange-50", icon: "text-orange-600", text: "text-orange-800" },
  emerald: { border: "border-emerald-200", bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-800" },
  slate: { border: "border-slate-200", bg: "bg-slate-50", icon: "text-slate-600", text: "text-slate-800" },
}

const TRIGGER_LABELS: Record<string, string> = {
  threshold: messages.advisory.triggerThreshold,
  scheduled: messages.advisory.triggerScheduled,
  manual: messages.advisory.triggerManual,
}

interface AdvisoryReportViewProps {
  progress: AdvisoryProgress
  reports: AdvisoryReportData[]
}

export function AdvisoryReportView({ progress, reports }: AdvisoryReportViewProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedReport, setExpandedReport] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  )

  async function handleGenerate() {
    if (!confirm(messages.advisory.generateConfirm)) return

    setIsGenerating(true)
    try {
      const res = await fetch("/api/advisory", { method: "POST" })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || messages.advisory.generateFailed)
      }
    } catch {
      alert(messages.advisory.generateFailed)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Brain className="h-5 w-5 text-purple-600" />
            {messages.advisory.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {messages.advisory.subtitle}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !progress.canGenerate}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            progress.canGenerate
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {messages.advisory.generating}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {messages.advisory.generateButton}
            </>
          )}
        </button>
      </div>

      {/* Progress card */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {messages.advisory.progressLabel}
            </p>
            <span className="text-sm font-bold">
              {progress.current} / {progress.threshold}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress.percentage >= 100
                  ? "bg-purple-500"
                  : progress.percentage > 50
                    ? "bg-purple-400"
                    : "bg-purple-300"
              )}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            {progress.percentage >= 100 ? (
              <span className="font-medium text-purple-600">
                {messages.advisory.progressReady}
              </span>
            ) : (
              <span>
                {messages.advisory.progressRemaining.replace(
                  "{remaining}",
                  String(progress.threshold - progress.current)
                )}
              </span>
            )}
            {progress.lastReport && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {messages.advisory.lastReport}: {new Date(progress.lastReport.generatedAt).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {messages.advisory.noReport}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {messages.advisory.noReportDesc.replace("{threshold}", String(progress.threshold))}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {messages.advisory.previousReports}
          </h2>
          {reports.map((report) => {
            const isExpanded = expandedReport === report.id
            return (
              <Card key={report.id}>
                <CardHeader
                  className="cursor-pointer pb-3"
                  onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-4 w-4 text-purple-500" />
                      {new Date(report.generatedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {TRIGGER_LABELS[report.triggerType] ?? report.triggerType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {messages.advisory.responseCount.replace("{count}", String(report.responseCount))}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {/* Summary always visible */}
                  <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
                  {report.priority && (
                    <p className="mt-1 text-xs">
                      <span className="font-medium text-amber-600">
                        {messages.advisory.priority}:
                      </span>{" "}
                      <span className="text-muted-foreground">{report.priority}</span>
                    </p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {report.sections.map((section, i) => {
                        const config =
                          SECTION_CONFIG[section.type as keyof typeof SECTION_CONFIG] ??
                          SECTION_CONFIG.summary
                        const colors = COLOR_MAP[config.color]
                        const Icon = config.icon

                        return (
                          <div
                            key={i}
                            className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`h-4 w-4 ${colors.icon}`} />
                              <span className={`text-sm font-medium ${colors.text}`}>
                                {section.title}
                              </span>
                            </div>
                            <div className={`text-sm ${colors.text} whitespace-pre-line`}>
                              {section.content}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
