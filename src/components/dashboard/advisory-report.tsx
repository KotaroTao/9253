"use client"

import { useState, useCallback, Fragment } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
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
  Plus,
  Check,
  ArrowRight,
  BookOpen,
  Star,
  MessageCircle,
  Crosshair,
  Grid3x3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Confetti } from "@/components/survey/confetti"
import type { AdvisoryReportData, AdvisoryProgress, AdvisorySection } from "@/types"

// ─── セクション設定 ───

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
    color: "yellow",
  },
  root_cause: {
    icon: SearchCheck,
    label: messages.advisory.sectionRootCause,
    color: "red",
  },
  strategic_actions: {
    icon: ListOrdered,
    label: messages.advisory.sectionStrategicActions,
    color: "blue",
  },
  // 新しいセクションタイプ（発見カード表示で使用、通常セクション表示はしない）
  highlight_discovery: {
    icon: Target,
    label: messages.advisory.discoveryLabel,
    color: "blue",
  },
  highlight_strength: {
    icon: Star,
    label: messages.advisory.strengthLabel,
    color: "green",
  },
  clinic_story: {
    icon: BookOpen,
    label: messages.advisory.clinicStoryTitle,
    color: "purple",
  },
  advisor_comment: {
    icon: MessageCircle,
    label: messages.advisory.advisorName,
    color: "purple",
  },
  monthly_focus: {
    icon: Crosshair,
    label: messages.advisory.monthlyFocusTitle,
    color: "rose",
  },
  priority_matrix: {
    icon: Grid3x3,
    label: messages.advisory.priorityMatrixTitle,
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
  yellow: { border: "border-yellow-200", bg: "bg-yellow-50", icon: "text-yellow-600", text: "text-yellow-800", muted: "text-yellow-600/70" },
}

const TRIGGER_LABELS: Record<string, string> = {
  threshold: messages.advisory.triggerThreshold,
  scheduled: messages.advisory.triggerScheduled,
  manual: messages.advisory.triggerManual,
}

// 特別表示するセクションタイプ（通常のセクションリストから除外）
const SPECIAL_SECTION_TYPES = new Set(["highlight_discovery", "highlight_strength", "clinic_story", "advisor_comment", "monthly_focus", "priority_matrix"])

// ─── リッチコンテンツレンダラー ───

function RichContent({ content, textClass, mutedClass }: { content: string; textClass: string; mutedClass: string }) {
  const lines = content.split("\n")

  return (
    <div className={cn("text-sm space-y-1", textClass)}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (trimmed === "") return <div key={i} className="h-1" />

        if (trimmed.startsWith("⚠") || trimmed.startsWith("⚠️")) {
          return (
            <div key={i} className="mt-2 flex gap-2 rounded-md bg-amber-100/60 px-3 py-2 text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="text-xs leading-relaxed">{trimmed.replace(/^⚠️?\s*/, "")}</span>
            </div>
          )
        }

        if (trimmed.startsWith("→")) {
          return (
            <p key={i} className={cn("text-xs pl-5 leading-relaxed", mutedClass)}>
              {trimmed}
            </p>
          )
        }

        if (trimmed.startsWith("▼") || trimmed.startsWith("▲")) {
          return (
            <p key={i} className="mt-2 text-xs font-bold">
              {trimmed}
            </p>
          )
        }

        if (trimmed.startsWith("【")) {
          return (
            <p key={i} className="mt-2 text-xs font-bold">
              {trimmed}
            </p>
          )
        }

        if (trimmed.startsWith("- ")) {
          const text = trimmed.slice(2)
          const parts = text.split(/([\d.]+点|[+\-][\d.]+(?:ポイント)?|↑[^\s]+|↓[^\s]+|→[^\s]+|✅[^\s]+|📈[^\s]+|➡️[^\s]+|⚠️[^\s]+)/)

          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
              <span className="text-xs leading-relaxed">
                {parts.map((part, j) => {
                  if (/^[✅📈➡️⚠️]/.test(part)) {
                    return <span key={j} className="font-medium">{part}</span>
                  }
                  if (/^\+[\d.]+/.test(part) || part.startsWith("↑")) {
                    return <span key={j} className="font-medium text-green-700">{part}</span>
                  }
                  if (/^-[\d.]+/.test(part) || part.startsWith("↓")) {
                    return <span key={j} className="font-medium text-red-700">{part}</span>
                  }
                  if (part.startsWith("→")) {
                    return <span key={j} className="text-muted-foreground">{part}</span>
                  }
                  if (/[\d.]+点/.test(part)) {
                    return <span key={j} className="font-medium tabular-nums">{part}</span>
                  }
                  return <Fragment key={j}>{part}</Fragment>
                })}
              </span>
            </div>
          )
        }

        if (line.startsWith("  ")) {
          return (
            <p key={i} className="text-xs pl-5 leading-relaxed">
              {trimmed}
            </p>
          )
        }

        return (
          <p key={i} className="text-xs leading-relaxed">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}

// ─── ワンクリック改善アクション作成ボタン ───

function CreateActionButton({ title, description }: { title: string; description?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")

  const handleCreate = useCallback(async () => {
    setState("loading")
    try {
      const res = await fetch("/api/improvement-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description ?? null }),
      })
      if (res.ok) {
        setState("done")
      } else {
        alert(messages.advisory.createActionFailed)
        setState("idle")
      }
    } catch {
      alert(messages.advisory.createActionFailed)
      setState("idle")
    }
  }, [title, description])

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
        <Check className="h-3 w-3" />
        {messages.advisory.createActionSuccess}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50"
    >
      {state === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Plus className="h-3 w-3" />
      )}
      {messages.advisory.createAction}
    </button>
  )
}

/** 改善ポイント・戦略アクションからアクション項目を抽出 */
function extractActionItems(section: AdvisorySection): Array<{ title: string; description: string }> {
  const items: Array<{ title: string; description: string }> = []

  if (section.type === "improvement") {
    // 「- 質問テキスト（テンプレート名）: スコア」パターン
    const lines = section.content.split("\n")
    for (const line of lines) {
      const match = line.match(/^- (.+?)（(.+?)）/)
      if (match) {
        items.push({
          title: `${match[1]}の改善`,
          description: line.replace(/^- /, ""),
        })
      }
    }
  } else if (section.type === "strategic_actions") {
    // 「【優先度X】タイトル」パターン
    const blocks = section.content.split(/(?=【優先度)/)
    for (const block of blocks) {
      const titleMatch = block.match(/【優先度\d+】(.+?)(?:\n|$)/)
      if (titleMatch) {
        items.push({
          title: titleMatch[1].trim(),
          description: block.trim(),
        })
      }
    }
  }

  return items.slice(0, 5)
}

// ─── セクションカード（折りたたみ対応 + アクション作成） ───

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

  const alwaysOpen = section.type === "summary" || section.type === "action" || section.type === "executive_summary" || section.type === "strategic_actions"
  const showActionButtons = section.type === "improvement" || section.type === "strategic_actions"

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

          {/* ワンクリック改善アクション作成 */}
          {showActionButtons && (
            <div className="mt-3 space-y-1.5 border-t border-current/10 pt-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {messages.advisory.createAction}
              </p>
              {extractActionItems(section).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CreateActionButton title={item.title} description={item.description} />
                  <span className="text-[10px] text-muted-foreground truncate">{item.title}</span>
                </div>
              ))}
              {extractActionItems(section).length === 0 && (
                <CreateActionButton
                  title={section.title}
                  description={section.content.slice(0, 500)}
                />
              )}
            </div>
          )}

          {/* 「詳しく知りたい」ボタン */}
          <div className="mt-3 border-t border-current/10 pt-3">
            <LearnMoreButton />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── クリニックストーリー ───

function ClinicStoryCard({ section }: { section: AdvisorySection }) {
  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-bold text-purple-800">{messages.advisory.clinicStoryTitle}</h3>
      </div>
      <p className="text-sm leading-relaxed text-purple-900/80">
        {section.content}
      </p>
    </div>
  )
}

// ─── ハイライトカード（レポート内表示） ───

function HighlightCards({ sections }: { sections: AdvisorySection[] }) {
  const discovery = sections.find((s) => s.type === "highlight_discovery")
  const strength = sections.find((s) => s.type === "highlight_strength")

  if (!discovery && !strength) return null

  const cards = [discovery, strength].filter(Boolean) as AdvisorySection[]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const lines = card.content.split("\n")
        const emoji = lines[0] || (i === 0 ? "🎯" : "🌟")
        const text = lines.slice(1).join("\n") || card.content
        const isDiscovery = card.type === "highlight_discovery"

        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border-2 p-4 transition-all",
              isDiscovery
                ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
            )}
          >
            <div className="text-2xl mb-2">{emoji}</div>
            <h4 className={cn(
              "text-xs font-bold uppercase tracking-wider mb-1",
              isDiscovery ? "text-blue-600" : "text-emerald-600"
            )}>
              {card.title}
            </h4>
            <p className={cn(
              "text-sm leading-relaxed",
              isDiscovery ? "text-blue-800" : "text-emerald-800"
            )}>
              {text}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── アドバイザーコメント ───

function AdvisorCommentCard({ comment }: { comment: string }) {
  return (
    <div className="flex gap-3 items-start rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white shadow-md">
        <Brain className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">
          {messages.advisory.advisorName}
        </p>
        <p className="text-sm leading-relaxed text-purple-900/80">
          {comment}
        </p>
      </div>
    </div>
  )
}

// ─── 「詳しく知りたい」ボタン ───

function LearnMoreButton() {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowHint(!showHint)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-[11px] font-medium text-purple-600 hover:bg-purple-50 transition-colors"
      >
        <MessageCircle className="h-3 w-3" />
        {messages.advisory.advisorLearnMore}
      </button>
      {showHint && (
        <div className="mt-1.5 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-[10px] text-purple-600 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {messages.advisory.advisorLearnMoreHint}
        </div>
      )}
    </div>
  )
}

// ─── 今月のフォーカス ───

function MonthlyFocusCard({ section }: { section: AdvisorySection }) {
  const [reason, stepsBlock] = section.content.split("\n---\n")
  const steps = stepsBlock
    ? stepsBlock.split("\n").filter((l) => l.trim())
    : []

  return (
    <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white shadow">
          <Crosshair className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
            {messages.advisory.monthlyFocusLabel}
          </span>
          <h3 className="text-sm font-bold text-rose-800">{section.title}</h3>
        </div>
      </div>

      {reason && (
        <p className="text-xs text-rose-700/80 mb-4 leading-relaxed">{reason}</p>
      )}

      {steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            {messages.advisory.monthlyFocusSteps}
          </p>
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-sm">
                {i + 1}
              </span>
              <p className="text-sm text-rose-800 leading-relaxed pt-0.5">
                {step.replace(/^\d+\.\s*/, "")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 優先度マトリクス ───

interface MatrixItem {
  action: string
  impact: number
  ease: number
}

function PriorityMatrixChart({ section }: { section: AdvisorySection }) {
  const items: MatrixItem[] = section.content
    .split("\n")
    .filter((l) => l.includes("|"))
    .map((line) => {
      const [action, impactStr, easeStr] = line.split("|")
      return {
        action: action?.trim() ?? "",
        impact: Number(impactStr) || 3,
        ease: Number(easeStr) || 3,
      }
    })
    .filter((item) => item.action)

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-indigo-800">{messages.advisory.priorityMatrixTitle}</h3>
      </div>

      {/* 2x2 Matrix Grid */}
      <div className="relative aspect-square max-w-xs mx-auto">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-indigo-200 rounded-lg overflow-hidden">
          {/* Top-left: high impact, low ease */}
          <div className="bg-amber-50/80 flex items-center justify-center p-1">
            <span className="text-[8px] text-amber-600/60 font-medium text-center">
              効果大・難易度高
            </span>
          </div>
          {/* Top-right: high impact, high ease = BEST */}
          <div className="bg-emerald-50/80 flex items-center justify-center p-1">
            <span className="text-[8px] text-emerald-600/60 font-medium text-center">
              効果大・実行容易
            </span>
          </div>
          {/* Bottom-left: low impact, low ease */}
          <div className="bg-slate-50/80 flex items-center justify-center p-1">
            <span className="text-[8px] text-slate-500/60 font-medium text-center">
              効果小・難易度高
            </span>
          </div>
          {/* Bottom-right: low impact, high ease */}
          <div className="bg-blue-50/80 flex items-center justify-center p-1">
            <span className="text-[8px] text-blue-600/60 font-medium text-center">
              効果小・実行容易
            </span>
          </div>
        </div>

        {/* Axis labels */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold text-indigo-600 whitespace-nowrap">
          {messages.advisory.priorityMatrixImpact} →
        </div>
        <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-600 whitespace-nowrap">
          {messages.advisory.priorityMatrixEase} →
        </div>

        {/* Data points */}
        {items.map((item, i) => {
          // Convert 1-5 to percentage (inverted Y for impact: 5=top, 1=bottom)
          const xPct = ((item.ease - 0.5) / 5) * 100
          const yPct = ((5.5 - item.impact) / 5) * 100
          const isTopRight = item.impact >= 3.5 && item.ease >= 3.5

          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform group-hover:scale-125",
                  isTopRight
                    ? "bg-emerald-500 ring-2 ring-emerald-300"
                    : "bg-indigo-400"
                )}
              >
                {i + 1}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                <div className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white shadow-lg">
                  {item.action}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-1">
        {items.map((item, i) => {
          const isTopRight = item.impact >= 3.5 && item.ease >= 3.5
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                  isTopRight ? "bg-emerald-500" : "bg-indigo-400"
                )}
              >
                {i + 1}
              </span>
              <span className={cn("truncate", isTopRight ? "font-medium text-emerald-800" : "text-indigo-700")}>
                {item.action}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                効果{item.impact} / 容易度{item.ease}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 発見カードオーバーレイ（新規レポート生成時） ───

interface AcquiredCharacter {
  character: { id: string; name: string; description: string; imageData: string }
  count: number
  isNew: boolean
}

interface FlipCardData {
  category: string
  emoji: string
  content: string
  title: string
  gradient: string
  textColor: string
  imageData?: string
}

function DiscoveryOverlay({
  highlightSections,
  acquiredChar,
  onClose,
}: {
  highlightSections: AdvisorySection[]
  acquiredChar: AcquiredCharacter | null
  onClose: () => void
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [showConfetti, setShowConfetti] = useState(false)

  const discovery = highlightSections.find((s) => s.type === "highlight_discovery")
  const strength = highlightSections.find((s) => s.type === "highlight_strength")

  const cards: FlipCardData[] = []

  if (discovery) {
    const lines = discovery.content.split("\n")
    cards.push({
      category: messages.advisory.discoveryLabel,
      emoji: lines[0] || "🎯",
      content: lines.slice(1).join("\n") || discovery.content,
      title: discovery.title,
      gradient: "from-blue-500 to-indigo-600",
      textColor: "text-blue-800",
    })
  }

  if (strength) {
    const lines = strength.content.split("\n")
    cards.push({
      category: messages.advisory.strengthLabel,
      emoji: lines[0] || "🌟",
      content: lines.slice(1).join("\n") || strength.content,
      title: strength.title,
      gradient: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-800",
    })
  }

  if (acquiredChar) {
    cards.push({
      category: messages.advisory.kawaiiTeethLabel,
      emoji: "🦷",
      content: acquiredChar.character.description,
      title: acquiredChar.isNew
        ? `NEW! ${acquiredChar.character.name}`
        : `${acquiredChar.character.name} x${acquiredChar.count}`,
      gradient: "from-pink-500 to-purple-600",
      textColor: "text-pink-800",
      imageData: acquiredChar.character.imageData,
    })
  }

  if (cards.length === 0) return null

  const totalCards = cards.length
  const allFlipped = flipped.size >= totalCards

  const handleFlip = (index: number) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      next.add(index)
      if (next.size >= totalCards && !showConfetti) {
        setShowConfetti(true)
      }
      return next
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" />

      {showConfetti && <Confetti />}

      <div className="relative z-10 w-full max-w-lg">
        {/* タイトル */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            {messages.advisory.discoveryOverlayTitle}
          </h2>
          <p className="mt-1 text-sm text-white/70">
            {messages.advisory.discoveryOverlayDesc}
          </p>
        </div>

        {/* カードグリッド */}
        <div className={cn(
          "grid gap-3",
          totalCards === 3 ? "grid-cols-3" : totalCards === 2 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {cards.map((card, i) => {
            const isFlipped = flipped.has(i)

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleFlip(i)}
                className="group"
                style={{ perspective: "800px" }}
              >
                <div
                  className="relative w-full transition-transform duration-700"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    minHeight: "180px",
                  }}
                >
                  {/* Front (face-down) */}
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br p-4 shadow-lg",
                      card.gradient,
                      !isFlipped && "group-hover:scale-[1.02] transition-transform"
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-3xl mb-2">{card.emoji}</span>
                    <span className="text-xs font-bold text-white/90 uppercase tracking-wider text-center">
                      {card.category}
                    </span>
                    <span className="mt-2 text-[10px] text-white/60">
                      {messages.advisory.flipToReveal}
                    </span>
                  </div>

                  {/* Back (revealed) */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 bg-white p-4 shadow-lg"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {card.imageData ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.imageData}
                          alt={card.title}
                          className="h-16 w-16 rounded-xl object-contain mb-2"
                        />
                        <h4 className="text-xs font-bold text-pink-600 text-center">{card.title}</h4>
                        <p className="mt-1 text-[10px] text-muted-foreground text-center line-clamp-3">
                          {card.content}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-xl mb-1">{card.emoji}</span>
                        <h4 className={cn("text-xs font-bold text-center", card.textColor)}>
                          {card.title}
                        </h4>
                        <p className="mt-1 text-[10px] text-muted-foreground text-center leading-relaxed line-clamp-4">
                          {card.content}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 全カードめくった後のボタン */}
        {allFlipped && (
          <div className="mt-6 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-purple-700 shadow-lg hover:bg-purple-50 transition-colors"
            >
              {messages.advisory.viewFullReport}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ─── メインコンポーネント ───

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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [discoveryData, setDiscoveryData] = useState<{
    sections: AdvisorySection[]
    acquiredChar: AcquiredCharacter | null
    reportId: string
  } | null>(null)

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

  function handleDiscoveryClose() {
    const reportId = discoveryData?.reportId
    setDiscoveryData(null)
    router.refresh()

    if (reportId) {
      setExpandedReport(reportId)
      setTimeout(() => {
        const el = document.getElementById(`report-${reportId}`)
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
        const sections = (report?.sections ?? []) as AdvisorySection[]

        // ハイライトセクションを抽出
        const highlightSections = sections.filter((s: AdvisorySection) =>
          s.type === "highlight_discovery" || s.type === "highlight_strength"
        )

        // Kawaii Teeth をランダム獲得
        let acquiredChar: AcquiredCharacter | null = null
        try {
          const acquireRes = await fetch("/api/kawaii-teeth/acquire", { method: "POST" })
          if (acquireRes.ok) {
            acquiredChar = await acquireRes.json()
          }
        } catch {
          // キャラ獲得失敗はサイレントに無視
        }

        // 発見カードオーバーレイを表示
        if (highlightSections.length > 0 || acquiredChar) {
          setDiscoveryData({
            sections: highlightSections,
            acquiredChar,
            reportId: reportId ?? "",
          })
        } else {
          // ハイライトもキャラもない場合はそのまま表示
          router.refresh()
          if (reportId) {
            setExpandedReport(reportId)
            setTimeout(() => {
              const el = document.getElementById(`report-${reportId}`)
              el?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 300)
          }
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
                  .filter((k) => k !== "summary" && k !== "action" && !SPECIAL_SECTION_TYPES.has(k))
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
            const regularSections = report.sections.filter(
              (s) => !SPECIAL_SECTION_TYPES.has(s.type)
            )
            const analysisCount = regularSections.filter(
              (s) => s.type !== "summary" && s.type !== "action"
            ).length

            // 特別セクション
            const clinicStory = report.sections.find((s) => s.type === "clinic_story")
            const hasHighlights = report.sections.some(
              (s) => s.type === "highlight_discovery" || s.type === "highlight_strength"
            )

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

                {isExpanded && (() => {
                  const advisorComments = report.sections.filter((s) => s.type === "advisor_comment")
                  const monthlyFocus = report.sections.find((s) => s.type === "monthly_focus")
                  const priorityMatrix = report.sections.find((s) => s.type === "priority_matrix")

                  // advisor_comment の title に対象セクションタイプが入っている
                  const getAdvisorCommentAfter = (sectionType: string) =>
                    advisorComments.find((c) => c.title === sectionType)

                  return (
                    <CardContent className="pt-0 space-y-4">
                      {/* クリニックストーリー */}
                      {clinicStory && <ClinicStoryCard section={clinicStory} />}

                      {/* ハイライトカード */}
                      {hasHighlights && <HighlightCards sections={report.sections} />}

                      {/* 今月のフォーカス */}
                      {monthlyFocus && <MonthlyFocusCard section={monthlyFocus} />}

                      {/* 優先度マトリクス */}
                      {priorityMatrix && <PriorityMatrixChart section={priorityMatrix} />}

                      {/* 改善アクション管理へのリンク */}
                      {regularSections.some((s) => s.type === "improvement" || s.type === "strategic_actions") && (
                        <a
                          href="/dashboard/actions"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          <Target className="h-3.5 w-3.5" />
                          {messages.advisory.viewActions}
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      )}

                      {/* 通常セクション（アドバイザーコメント挟み込み） */}
                      <div className="space-y-2">
                        {regularSections.map((section, i) => (
                          <Fragment key={i}>
                            <SectionCard
                              section={section}
                              index={i}
                              isOpen={!collapsedSections.has(`${report.id}:${i}`)}
                              onToggle={() => toggleSection(report.id, i)}
                            />
                            {/* セクション後にアドバイザーコメントを挿入 */}
                            {getAdvisorCommentAfter(section.type) && (
                              <AdvisorCommentCard
                                comment={getAdvisorCommentAfter(section.type)!.content}
                              />
                            )}
                          </Fragment>
                        ))}
                      </div>
                    </CardContent>
                  )
                })()}
              </Card>
            )
          })}
        </div>
      )}

      {/* 発見カードオーバーレイ */}
      {discoveryData && (
        <DiscoveryOverlay
          highlightSections={discoveryData.sections}
          acquiredChar={discoveryData.acquiredChar}
          onClose={handleDiscoveryClose}
        />
      )}
    </div>
  )
}
