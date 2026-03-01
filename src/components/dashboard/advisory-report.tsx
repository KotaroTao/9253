"use client"

import { useState, Fragment } from "react"
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
  DollarSign,
  Snowflake,
  Users,
  MessageSquareText,
  UserCircle,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  FileText,
  Hash,
  Zap,
  SearchCheck,
  ListOrdered,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { KawaiiTeethReveal } from "@/components/dashboard/kawaii-teeth-reveal"
import type { AdvisoryReportData, AdvisoryProgress, AdvisorySection } from "@/types"

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
  business_correlation: {
    icon: DollarSign,
    label: messages.advisory.sectionBusinessCorrelation,
    color: "cyan",
  },
  seasonality: {
    icon: Snowflake,
    label: messages.advisory.sectionSeasonality,
    color: "sky",
  },
  staff_performance: {
    icon: Users,
    label: messages.advisory.sectionStaffPerformance,
    color: "violet",
  },
  comment_themes: {
    icon: MessageSquareText,
    label: messages.advisory.sectionCommentThemes,
    color: "pink",
  },
  patient_segments: {
    icon: UserCircle,
    label: messages.advisory.sectionPatientSegments,
    color: "lime",
  },
  purpose_deep_dive: {
    icon: Stethoscope,
    label: messages.advisory.sectionPurposeDeepDive,
    color: "fuchsia",
  },
  retention_signals: {
    icon: HeartPulse,
    label: messages.advisory.sectionRetentionSignals,
    color: "red",
  },
  response_quality: {
    icon: ShieldCheck,
    label: messages.advisory.sectionResponseQuality,
    color: "stone",
  },
  executive_summary: {
    icon: Zap,
    label: messages.advisory.sectionExecutiveSummary,
    color: "amber",
  },
  root_cause: {
    icon: SearchCheck,
    label: messages.advisory.sectionRootCause,
    color: "rose",
  },
  strategic_actions: {
    icon: ListOrdered,
    label: messages.advisory.sectionStrategicActions,
    color: "indigo",
  },
} as const

const COLOR_MAP: Record<string, { border: string; bg: string; icon: string; text: string; muted: string }> = {
  blue: { border: "border-blue-200", bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-800", muted: "text-blue-600/70" },
  green: { border: "border-green-200", bg: "bg-green-50", icon: "text-green-600", text: "text-green-800", muted: "text-green-600/70" },
  amber: { border: "border-amber-200", bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-800", muted: "text-amber-600/70" },
  purple: { border: "border-purple-200", bg: "bg-purple-50", icon: "text-purple-600", text: "text-purple-800", muted: "text-purple-600/70" },
  rose: { border: "border-rose-200", bg: "bg-rose-50", icon: "text-rose-600", text: "text-rose-800", muted: "text-rose-600/70" },
  indigo: { border: "border-indigo-200", bg: "bg-indigo-50", icon: "text-indigo-600", text: "text-indigo-800", muted: "text-indigo-600/70" },
  teal: { border: "border-teal-200", bg: "bg-teal-50", icon: "text-teal-600", text: "text-teal-800", muted: "text-teal-600/70" },
  orange: { border: "border-orange-200", bg: "bg-orange-50", icon: "text-orange-600", text: "text-orange-800", muted: "text-orange-600/70" },
  emerald: { border: "border-emerald-200", bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-800", muted: "text-emerald-600/70" },
  slate: { border: "border-slate-200", bg: "bg-slate-50", icon: "text-slate-600", text: "text-slate-800", muted: "text-slate-600/70" },
  cyan: { border: "border-cyan-200", bg: "bg-cyan-50", icon: "text-cyan-600", text: "text-cyan-800", muted: "text-cyan-600/70" },
  sky: { border: "border-sky-200", bg: "bg-sky-50", icon: "text-sky-600", text: "text-sky-800", muted: "text-sky-600/70" },
  violet: { border: "border-violet-200", bg: "bg-violet-50", icon: "text-violet-600", text: "text-violet-800", muted: "text-violet-600/70" },
  pink: { border: "border-pink-200", bg: "bg-pink-50", icon: "text-pink-600", text: "text-pink-800", muted: "text-pink-600/70" },
  lime: { border: "border-lime-200", bg: "bg-lime-50", icon: "text-lime-600", text: "text-lime-800", muted: "text-lime-600/70" },
  fuchsia: { border: "border-fuchsia-200", bg: "bg-fuchsia-50", icon: "text-fuchsia-600", text: "text-fuchsia-800", muted: "text-fuchsia-600/70" },
  red: { border: "border-red-200", bg: "bg-red-50", icon: "text-red-600", text: "text-red-800", muted: "text-red-600/70" },
  stone: { border: "border-stone-200", bg: "bg-stone-50", icon: "text-stone-600", text: "text-stone-800", muted: "text-stone-600/70" },
}

const TRIGGER_LABELS: Record<string, string> = {
  threshold: messages.advisory.triggerThreshold,
  scheduled: messages.advisory.triggerScheduled,
  manual: messages.advisory.triggerManual,
}

// ─── リッチコンテンツレンダラー ───

function RichContent({ content, textClass, mutedClass }: { content: string; textClass: string; mutedClass: string }) {
  const lines = content.split("\n")

  return (
    <div className={cn("text-sm space-y-1", textClass)}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (trimmed === "") return <div key={i} className="h-1" />

        // 「⚠」「⚠️」警告行
        if (trimmed.startsWith("⚠") || trimmed.startsWith("⚠️")) {
          return (
            <div key={i} className="mt-2 flex gap-2 rounded-md bg-amber-100/60 px-3 py-2 text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="text-xs leading-relaxed">{trimmed.replace(/^⚠️?\s*/, "")}</span>
            </div>
          )
        }

        // 「→」推奨行
        if (trimmed.startsWith("→")) {
          return (
            <p key={i} className={cn("text-xs pl-5 leading-relaxed", mutedClass)}>
              {trimmed}
            </p>
          )
        }

        // 「▼」「▲」見出し行
        if (trimmed.startsWith("▼") || trimmed.startsWith("▲")) {
          return (
            <p key={i} className="mt-2 text-xs font-bold">
              {trimmed}
            </p>
          )
        }

        // 「【】」パターン見出し
        if (trimmed.startsWith("【")) {
          return (
            <p key={i} className="mt-2 text-xs font-bold">
              {trimmed}
            </p>
          )
        }

        // 箇条書き「- 」
        if (trimmed.startsWith("- ")) {
          const text = trimmed.slice(2)

          // スコア値のハイライト（例: 4.25点、+0.15）
          const parts = text.split(/([\d.]+点|[+\-][\d.]+(?:ポイント)?|↑[^\s]+|↓[^\s]+|→[^\s]+|✅[^\s]+|📈[^\s]+|➡️[^\s]+|⚠️[^\s]+)/)

          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
              <span className="text-xs leading-relaxed">
                {parts.map((part, j) => {
                  // ステータスバッジ
                  if (/^[✅📈➡️⚠️]/.test(part)) {
                    return <span key={j} className="font-medium">{part}</span>
                  }
                  // 正の変化
                  if (/^\+[\d.]+/.test(part) || part.startsWith("↑")) {
                    return <span key={j} className="font-medium text-green-700">{part}</span>
                  }
                  // 負の変化
                  if (/^-[\d.]+/.test(part) || part.startsWith("↓")) {
                    return <span key={j} className="font-medium text-red-700">{part}</span>
                  }
                  // 維持
                  if (part.startsWith("→")) {
                    return <span key={j} className="text-muted-foreground">{part}</span>
                  }
                  // スコア値
                  if (/[\d.]+点/.test(part)) {
                    return <span key={j} className="font-medium tabular-nums">{part}</span>
                  }
                  return <Fragment key={j}>{part}</Fragment>
                })}
              </span>
            </div>
          )
        }

        // インデント行（「  」で始まる）
        if (line.startsWith("  ")) {
          return (
            <p key={i} className="text-xs pl-5 leading-relaxed">
              {trimmed}
            </p>
          )
        }

        // 通常のテキスト行
        return (
          <p key={i} className="text-xs leading-relaxed">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}

// ─── セクションカード（折りたたみ対応） ───

function SectionCard({
  section,
  index,
  isOpen,
  onToggle,
}: {
  section: AdvisorySection
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const config =
    SECTION_CONFIG[section.type as keyof typeof SECTION_CONFIG] ??
    SECTION_CONFIG.summary
  const colors = COLOR_MAP[config.color]
  const Icon = config.icon

  // summary と action はデフォルト展開、折りたたみボタンなし
  const alwaysOpen = section.type === "summary" || section.type === "action" || section.type === "executive_summary" || section.type === "strategic_actions"

  return (
    <div className={cn("rounded-lg border", colors.border, colors.bg)}>
      <button
        type="button"
        onClick={alwaysOpen ? undefined : onToggle}
        className={cn(
          "flex w-full items-center gap-2 p-4",
          !alwaysOpen && "cursor-pointer hover:opacity-80",
          (isOpen || alwaysOpen) ? "pb-2" : ""
        )}
        disabled={alwaysOpen}
      >
        <Icon className={cn("h-4 w-4 shrink-0", colors.icon)} />
        <span className={cn("text-sm font-medium flex-1 text-left", colors.text)}>
          {section.title}
        </span>
        {!alwaysOpen && (
          isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )
        )}
      </button>
      {(isOpen || alwaysOpen) && (
        <div className="px-4 pb-4">
          <RichContent content={section.content} textClass={colors.text} mutedClass={colors.muted} />
        </div>
      )}
    </div>
  )
}

// ─── メインコンポーネント ───

interface AdvisoryReportViewProps {
  progress: AdvisoryProgress
  reports: AdvisoryReportData[]
}

interface AcquiredCharacter {
  character: { id: string; name: string; description: string; imageData: string }
  count: number
  isNew: boolean
}

export function AdvisoryReportView({ progress, reports }: AdvisoryReportViewProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedReport, setExpandedReport] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  )
  // 個別セクションの展開状態（レポートID:インデックス）
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [acquiredChar, setAcquiredChar] = useState<AcquiredCharacter | null>(null)
  // 生成直後のレポートID（キャラ獲得演出後にスクロール対象）
  const [newReportId, setNewReportId] = useState<string | null>(null)

  function toggleSection(reportId: string, index: number) {
    const key = `${reportId}:${index}`
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function handleRevealClose() {
    setAcquiredChar(null)
    // キャラ獲得演出が閉じたら、新規レポートにスクロール
    if (newReportId) {
      setExpandedReport(newReportId)
      setNewReportId(null)
      // DOM更新後にスクロール
      setTimeout(() => {
        const el = document.getElementById(`report-${newReportId}`)
        el?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }

  async function handleGenerate() {
    if (!confirm(messages.advisory.generateConfirm)) return

    setIsGenerating(true)
    try {
      const res = await fetch("/api/advisory", { method: "POST" })
      if (res.ok) {
        const { report } = await res.json()
        const reportId = report?.id as string | undefined

        // AI分析成功 → Kawaii Teethをランダム獲得
        let charAcquired = false
        try {
          const acquireRes = await fetch("/api/kawaii-teeth/acquire", { method: "POST" })
          if (acquireRes.ok) {
            const acquired = await acquireRes.json()
            setAcquiredChar(acquired)
            charAcquired = true
            if (reportId) setNewReportId(reportId)
          }
        } catch {
          // キャラ獲得失敗はサイレントに無視
        }

        router.refresh()

        // キャラ獲得演出がなかった場合は直接レポートへスクロール
        if (!charAcquired && reportId) {
          setExpandedReport(reportId)
          setTimeout(() => {
            const el = document.getElementById(`report-${reportId}`)
            el?.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 300)
        }
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

  const sectionCount = reports.length > 0
    ? reports[0].sections.filter((s) => s.type !== "summary" && s.type !== "action").length
    : 0

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
      <Card className="border-purple-100">
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-medium">
                {messages.advisory.progressLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {reports.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {reports.length}回実施
                </span>
              )}
              {progress.daysSinceLastReport !== null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {progress.daysSinceLastReport === 0
                    ? "本日"
                    : `${progress.daysSinceLastReport}日前`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 overflow-hidden rounded-full bg-purple-100">
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
            <span className="text-sm font-bold text-purple-700 tabular-nums whitespace-nowrap">
              {progress.current} / {progress.threshold}
            </span>
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
            <span className="flex items-center gap-1 tabular-nums">
              <Hash className="h-3 w-3" />
              合計 {progress.totalResponses.toLocaleString()}件
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card className="border-dashed border-purple-200">
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
              <Brain className="h-8 w-8 text-purple-300" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {messages.advisory.noReport}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {messages.advisory.noReportDesc.replace("{threshold}", String(progress.threshold))}
            </p>

            <div className="mt-6 mx-auto max-w-xs space-y-2">
              <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wider">分析に含まれる項目</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {(Object.keys(SECTION_CONFIG) as Array<keyof typeof SECTION_CONFIG>)
                  .filter((k) => k !== "summary" && k !== "action")
                  .map((key) => {
                    const cfg = SECTION_CONFIG[key]
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600"
                      >
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    )
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {messages.advisory.previousReports}
          </h2>
          {reports.map((report) => {
            const isExpanded = expandedReport === report.id
            const analysisCount = report.sections.filter(
              (s) => s.type !== "summary" && s.type !== "action"
            ).length

            return (
              <Card key={report.id} id={`report-${report.id}`}>
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
                      <span className="text-xs text-muted-foreground">
                        {analysisCount}項目
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Summary & Priority always visible */}
                  <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
                  {report.priority && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">
                        {messages.advisory.priority}:
                      </span>
                      <span className="text-xs text-amber-800">{report.priority}</span>
                    </div>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {report.sections.map((section, i) => (
                        <SectionCard
                          key={i}
                          section={section}
                          index={i}
                          isOpen={!collapsedSections.has(`${report.id}:${i}`)}
                          onToggle={() => toggleSection(report.id, i)}
                        />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Kawaii Teeth reveal overlay */}
      <KawaiiTeethReveal
        acquired={acquiredChar}
        onClose={handleRevealClose}
      />
    </div>
  )
}
