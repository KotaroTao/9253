"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import { MIN_CLINICS_FOR_DISPLAY } from "@/lib/queries/platform-action-stats"
import {
  QUESTION_CATEGORY_MAP,
  IMPROVEMENT_SUGGESTIONS,
  CATEGORY_LABELS,
} from "@/lib/constants"
import type { ImprovementSuggestion } from "@/lib/constants"
import {
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Lightbulb,
  Pencil,
  Trash2,
  Clock,
  Play,
  Ban,
  RefreshCw,
  AlertTriangle,
  MessageSquarePlus,
  StickyNote,
  CalendarClock,
  BarChart3,
  Tag,
  Megaphone,
  ExternalLink,
  Check,
  Sparkles,
  Users,
} from "lucide-react"

interface ActionLog {
  id: string
  action: string // started, completed, cancelled, reactivated
  satisfactionScore: number | null
  note: string | null
  createdAt: string | Date
}

interface ImprovementAction {
  id: string
  title: string
  description: string | null
  targetQuestion: string | null
  targetQuestionId: string | null
  baselineScore: number | null
  resultScore: number | null
  completionReason: string | null
  completionNote: string | null
  status: string
  platformActionId?: string | null
  startedAt: string | Date
  completedAt: string | Date | null
  logs?: ActionLog[]
}

interface PlatformActionData {
  id: string
  title: string
  description: string | null
  detailedContent: string | null
  targetQuestionIds: string[] | null
  category: string | null
  isPickup: boolean
  serviceUrl: string | null
  serviceProvider: string | null
}

interface TemplateQuestion {
  id: string
  text: string
  type: string
}

interface TemplateData {
  name: string
  questions: TemplateQuestion[]
}

interface MonthlyMetric {
  year: number
  month: number
  totalPatientCount: number | null
  totalRevenue: number | null
  cancellationCount: number | null
  totalVisitCount: number | null
}

interface PlatformActionOutcome {
  platformActionId: string
  qualifiedCount: number
  adoptCount: number
  avgScoreImprovement: number | null
  avgRevenueChangePct: number | null
  avgPatientCountChange: number | null
  avgCancelRateChangePt: number | null
  metricsClinicCount: number
  avgDurationDays: number | null
  establishedRate: number | null
  confidence: "high" | "moderate" | "insufficient"
}

interface Props {
  initialActions: ImprovementAction[]
  templateQuestions?: TemplateData[]
  questionScores?: Record<string, number>
  platformActions?: PlatformActionData[]
  adoptedPlatformActionIds?: string[]
  isSystemAdmin?: boolean
  monthlyMetrics?: MonthlyMetric[]
  platformActionOutcomes?: Record<string, PlatformActionOutcome>
}

export function ImprovementActionsView({
  initialActions,
  templateQuestions = [],
  questionScores = {},
  platformActions = [],
  adoptedPlatformActionIds: initialAdopted = [],
  isSystemAdmin = false,
  monthlyMetrics = [],
  platformActionOutcomes = {},
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actions, setActions] = useState(initialActions)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set(initialAdopted))
  const [adoptingId, setAdoptingId] = useState<string | null>(null)
  const [adoptQuestionSelect, setAdoptQuestionSelect] = useState<{ platformActionId: string; questionIds: string[] } | null>(null)
  const [selectedAdoptQuestionId, setSelectedAdoptQuestionId] = useState("")

  // Form state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editQuestionIds, setEditQuestionIds] = useState<Set<string>>(new Set())

  // All questions flattened for lookup
  const allQuestions = useMemo(() => {
    const map = new Map<string, { text: string; templateName: string }>()
    for (const t of templateQuestions) {
      for (const q of t.questions) {
        map.set(q.id, { text: q.text, templateName: t.name })
      }
    }
    return map
  }, [templateQuestions])

  // Auto-open form with pre-selected question from URL param (?question=fv2) — system_admin only
  useEffect(() => {
    const questionParam = searchParams.get("question")
    if (questionParam && allQuestions.has(questionParam)) {
      setShowForm(true)
      if (isSystemAdmin) {
        setSelectedQuestionIds(new Set([questionParam]))
      }
      // Clean up URL
      router.replace("/dashboard/actions", { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: parse comma-separated targetQuestionId into Set
  function parseQuestionIds(targetQuestionId: string | null): Set<string> {
    if (!targetQuestionId) return new Set()
    return new Set(targetQuestionId.split(",").map((s) => s.trim()).filter(Boolean))
  }

  // Get suggestions based on selected questions' categories
  const suggestions = useMemo((): ImprovementSuggestion[] => {
    if (selectedQuestionIds.size === 0) return []
    const seen = new Set<string>()
    const result: ImprovementSuggestion[] = []
    for (const qId of Array.from(selectedQuestionIds)) {
      const category = QUESTION_CATEGORY_MAP[qId]
      if (!category || seen.has(category)) continue
      seen.add(category)
      const items = IMPROVEMENT_SUGGESTIONS[category] ?? []
      result.push(...items)
    }
    return result
  }, [selectedQuestionIds])

  function handleToggleQuestion(questionId: string) {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
    // Reset title/description when changing questions
    setTitle("")
    setDescription("")
  }

  function handleSelectSuggestion(suggestion: ImprovementSuggestion) {
    setTitle(suggestion.title)
    setDescription(suggestion.description)
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    setSelectedQuestionIds(new Set())
  }

  async function handleCreate() {
    if (!title.trim() || loading) return
    setLoading(true)
    setErrorMsg(null)

    // Build comma-separated question IDs and texts
    const qIds = Array.from(selectedQuestionIds)
    const targetQuestionId = qIds.length > 0 ? qIds.join(",") : undefined
    const targetQuestionText = qIds.length > 0
      ? qIds.map((id) => allQuestions.get(id)?.text).filter(Boolean).join("、")
      : undefined

    try {
      const res = await fetch("/api/improvement-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetQuestion: targetQuestionText,
          targetQuestionId,
        }),
      })
      if (res.ok) {
        resetForm()
        setShowForm(false)
        router.refresh()
        const data = await res.json()
        setActions([data, ...actions])
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.saveFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.saveFailed)
    } finally {
      setLoading(false)
    }
  }

  // Edit existing action
  function startEdit(action: ImprovementAction) {
    setEditingId(action.id)
    setEditTitle(action.title)
    setEditDescription(action.description ?? "")
    setEditQuestionIds(parseQuestionIds(action.targetQuestionId))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle("")
    setEditDescription("")
    setEditQuestionIds(new Set())
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim() || loading) return
    setLoading(true)
    setErrorMsg(null)

    const qIds = Array.from(editQuestionIds)
    const targetQuestionId = qIds.length > 0 ? qIds.join(",") : null
    const targetQuestion = qIds.length > 0
      ? qIds.map((qId) => allQuestions.get(qId)?.text).filter(Boolean).join("、")
      : null

    try {
      const res = await fetch(`/api/improvement-actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          targetQuestionId,
          targetQuestion,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setActions(actions.map((a) => (a.id === id ? updated : a)))
        cancelEdit()
        router.refresh()
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.editFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.editFailed)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: string, extra?: { completionReason?: string; completionNote?: string }) {
    setLoading(true)
    setErrorMsg(null)
    try {
      const body: Record<string, unknown> = { status, ...extra }
      const res = await fetch(`/api/improvement-actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.refresh()
        const updated = await res.json()
        setActions(actions.map((a) => (a.id === id ? updated : a)))
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.statusChangeFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.statusChangeFailed)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(messages.improvementActions.deleteConfirm)) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/improvement-actions/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
        setActions(actions.filter((a) => a.id !== id))
        setExpandedId(null)
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.deleteFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.deleteFailed)
    } finally {
      setLoading(false)
    }
  }

  function handleLogUpdated(actionId: string, updatedLog: ActionLog) {
    setActions(actions.map((a) => {
      if (a.id !== actionId || !a.logs) return a
      return {
        ...a,
        logs: a.logs.map((l) => (l.id === updatedLog.id ? updatedLog : l)),
      }
    }))
  }

  const activeActions = actions.filter((a) => a.status === "active")
  const completedActions = actions.filter((a) => a.status !== "active")
  const doneActions = actions.filter((a) => a.status === "completed")
  const cancelledActions = actions.filter((a) => a.status === "cancelled")

  const hasTemplates = templateQuestions.length > 0

  // Summary statistics
  const summaryStats = useMemo(() => {
    const completedWithScores = doneActions.filter(
      (a) => a.baselineScore != null && a.resultScore != null
    )
    const avgImprovement =
      completedWithScores.length > 0
        ? completedWithScores.reduce(
            (sum, a) => sum + (a.resultScore! - a.baselineScore!),
            0
          ) / completedWithScores.length
        : null
    return {
      activeCount: activeActions.length,
      completedCount: doneActions.length,
      cancelledCount: cancelledActions.length,
      avgImprovement:
        avgImprovement != null ? Math.round(avgImprovement * 100) / 100 : null,
    }
  }, [activeActions.length, doneActions, cancelledActions.length])

  // Compute top 3 lowest-score questions (excluding those with active actions)
  const recommendedItems = useMemo(() => {
    const activeQuestionIds = new Set(
      actions
        .filter((a) => a.status === "active" && a.targetQuestionId)
        .flatMap((a) => a.targetQuestionId!.split(",").map((s) => s.trim()))
    )
    const scored: { questionId: string; text: string; templateName: string; score: number; category: string }[] = []
    for (const [qId, score] of Object.entries(questionScores)) {
      if (activeQuestionIds.has(qId)) continue
      const q = allQuestions.get(qId)
      if (!q) continue
      const category = QUESTION_CATEGORY_MAP[qId]
      if (!category) continue
      scored.push({ questionId: qId, text: q.text, templateName: q.templateName, score, category })
    }
    scored.sort((a, b) => a.score - b.score)
    return scored.slice(0, 3)
  }, [questionScores, actions, allQuestions])

  function handleRecommendedClick(questionId: string) {
    setShowForm(true)
    setSelectedQuestionIds(new Set([questionId]))
    setTitle("")
    setDescription("")
  }

  // Adopt a platform action
  async function handleAdopt(platformActionId: string, targetQuestionId?: string) {
    setAdoptingId(platformActionId)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/improvement-actions/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformActionId, targetQuestionId }),
      })
      if (res.ok) {
        const data = await res.json()
        setActions([data, ...actions])
        setAdoptedIds(new Set([...Array.from(adoptedIds), platformActionId]))
        setAdoptQuestionSelect(null)
        router.refresh()
      } else {
        const err = await res.json().catch(() => null)
        setErrorMsg(err?.error || messages.improvementActions.saveFailed)
      }
    } catch {
      setErrorMsg(messages.improvementActions.saveFailed)
    } finally {
      setAdoptingId(null)
    }
  }

  function handleAdoptClick(pa: PlatformActionData) {
    const questionIds = pa.targetQuestionIds ?? []
    if (questionIds.length > 1) {
      // Multiple target questions — show selection dialog
      setAdoptQuestionSelect({ platformActionId: pa.id, questionIds })
      setSelectedAdoptQuestionId(questionIds[0])
    } else {
      // 0 or 1 target question — adopt directly
      handleAdopt(pa.id, questionIds[0])
    }
  }

  // Pickup (isPickup) platform actions to show
  // ピックアップアクションを導入数の多い順にソート
  const pickupActions = platformActions
    .filter((pa) => pa.isPickup)
    .sort((a, b) => {
      const adoptA = platformActionOutcomes[a.id]?.adoptCount ?? 0
      const adoptB = platformActionOutcomes[b.id]?.adoptCount ?? 0
      return adoptB - adoptA
    })

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      {actions.length > 0 && !showForm && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-blue-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{summaryStats.activeCount}</p>
            <p className="text-[11px] text-blue-600/70">{messages.improvementActions.summaryActive}</p>
          </div>
          <div className="rounded-lg border bg-green-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{summaryStats.completedCount}</p>
            <p className="text-[11px] text-green-600/70">{messages.improvementActions.summaryCompleted}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            {summaryStats.avgImprovement != null ? (
              <>
                <p className={`text-2xl font-bold ${summaryStats.avgImprovement >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {summaryStats.avgImprovement > 0 ? "+" : ""}{summaryStats.avgImprovement}
                </p>
                <p className="text-[11px] text-muted-foreground">{messages.improvementActions.summaryAvgImprovement}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-muted-foreground/50">—</p>
                <p className="text-[11px] text-muted-foreground/50">{messages.improvementActions.summaryNoCompletedYet}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pickup platform actions */}
      {!showForm && pickupActions.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/40 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-800">
              <Megaphone className="h-4 w-4" />
              {messages.platformActions.pickup}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {messages.platformActions.pickupDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pickupActions.map((pa) => {
              const isAdopted = adoptedIds.has(pa.id)
              const isAdopting = adoptingId === pa.id
              const categoryLabel = pa.category ? CATEGORY_LABELS[pa.category] : null
              const targetQIds = pa.targetQuestionIds ?? []
              return (
                <div
                  key={pa.id}
                  className="rounded-lg border border-purple-100 bg-white p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{pa.title}</p>
                        {categoryLabel && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {categoryLabel}
                          </span>
                        )}
                        {(() => {
                          const oc = platformActionOutcomes[pa.id]
                          if (!oc || oc.adoptCount === 0) return null
                          return (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              <Users className="h-2.5 w-2.5" />
                              {oc.adoptCount}{messages.platformActions.outcomeAdoptBadge}
                            </span>
                          )
                        })()}
                        {pa.serviceProvider && (
                          <span className="text-[10px] text-muted-foreground">
                            {messages.platformActions.provider}: {pa.serviceProvider}
                          </span>
                        )}
                      </div>
                      {pa.description && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {pa.description}
                        </p>
                      )}
                      {/* Target question scores */}
                      {targetQIds.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {targetQIds.map((qId) => {
                            const q = allQuestions.get(qId)
                            const score = questionScores[qId]
                            if (!q) return null
                            return (
                              <span key={qId} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                {q.text}
                                {score != null && (
                                  <span className="font-semibold text-amber-700">{score}</span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Cross-clinic outcomes */}
                  {(() => {
                    const outcome = platformActionOutcomes[pa.id]
                    if (!outcome) return null
                    if (outcome.confidence === "insufficient") {
                      // データ不足：収集中メッセージを表示
                      if (outcome.adoptCount === 0) return null // 導入ゼロなら非表示
                      const remaining = MIN_CLINICS_FOR_DISPLAY - outcome.qualifiedCount
                      return (
                        <div className="rounded-md border border-dashed border-purple-200 bg-purple-50/30 px-3 py-2">
                          <p className="text-[11px] text-purple-600 flex items-center gap-1.5">
                            <BarChart3 className="h-3 w-3 text-purple-400" />
                            <span className="font-medium">{messages.platformActions.outcomeCollecting}</span>
                          </p>
                          <p className="mt-1 text-[10px] text-purple-400">
                            {messages.platformActions.outcomeCollectingDetail(remaining, outcome.qualifiedCount)}
                          </p>
                          {outcome.adoptCount > 0 && (
                            <p className="mt-0.5 text-[10px] text-purple-400">
                              {messages.platformActions.outcomeAdoptCount(outcome.adoptCount)}
                            </p>
                          )}
                        </div>
                      )
                    }
                    return (
                      <div className="rounded-md bg-purple-50/60 border border-purple-100 px-3 py-2 space-y-1.5">
                        <p className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {messages.platformActions.outcomeTitle}
                          <span className="font-normal text-purple-500 ml-1">
                            {outcome.qualifiedCount}{messages.platformActions.outcomeClinics}
                          </span>
                          {outcome.confidence === "high" ? (
                            <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                              {messages.platformActions.confidenceHigh}
                            </span>
                          ) : (
                            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                              {messages.platformActions.confidenceModerate}
                            </span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {outcome.avgScoreImprovement != null && (
                            <div className="text-center">
                              <p className="text-[9px] text-purple-500">{messages.platformActions.outcomeScore}</p>
                              <p className={`text-xs font-bold ${outcome.avgScoreImprovement > 0 ? "text-green-600" : outcome.avgScoreImprovement < 0 ? "text-red-500" : "text-slate-400"}`}>
                                {outcome.avgScoreImprovement > 0 ? "+" : ""}{outcome.avgScoreImprovement}
                              </p>
                            </div>
                          )}
                          {outcome.metricsClinicCount > 0 && (
                            <>
                              {outcome.avgRevenueChangePct != null && (
                                <div className="text-center">
                                  <p className="text-[9px] text-purple-500">{messages.improvementActions.metricsRevenue}</p>
                                  <p className={`text-xs font-bold ${outcome.avgRevenueChangePct > 0 ? "text-green-600" : outcome.avgRevenueChangePct < 0 ? "text-red-500" : "text-slate-400"}`}>
                                    {outcome.avgRevenueChangePct > 0 ? "+" : ""}{outcome.avgRevenueChangePct.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                              {outcome.avgPatientCountChange != null && (
                                <div className="text-center">
                                  <p className="text-[9px] text-purple-500">{messages.improvementActions.metricsPatients}</p>
                                  <p className={`text-xs font-bold ${outcome.avgPatientCountChange > 0 ? "text-green-600" : outcome.avgPatientCountChange < 0 ? "text-red-500" : "text-slate-400"}`}>
                                    {outcome.avgPatientCountChange > 0 ? "+" : ""}{outcome.avgPatientCountChange}{messages.platformActions.outcomePatientUnit}
                                  </p>
                                </div>
                              )}
                              {outcome.avgCancelRateChangePt != null && (
                                <div className="text-center">
                                  <p className="text-[9px] text-purple-500">{messages.improvementActions.metricsCancelRate}</p>
                                  <p className={`text-xs font-bold ${outcome.avgCancelRateChangePt < 0 ? "text-green-600" : outcome.avgCancelRateChangePt > 0 ? "text-red-500" : "text-slate-400"}`}>
                                    {outcome.avgCancelRateChangePt > 0 ? "+" : ""}{outcome.avgCancelRateChangePt.toFixed(1)}pt
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {outcome.avgDurationDays != null && (
                            <div className="text-center">
                              <p className="text-[9px] text-purple-500">{messages.platformActions.outcomeDuration}</p>
                              <p className="text-xs font-bold text-slate-600">
                                {outcome.avgDurationDays < 60
                                  ? `${outcome.avgDurationDays}${messages.platformActions.outcomeDaysUnit}`
                                  : `${(outcome.avgDurationDays / 30).toFixed(1)}${messages.platformActions.outcomeMonthsUnit}`
                                }
                              </p>
                            </div>
                          )}
                          {outcome.establishedRate != null && (
                            <div className="text-center">
                              <p className="text-[9px] text-purple-500">{messages.platformActions.outcomeEstablished}</p>
                              <p className={`text-xs font-bold ${outcome.establishedRate >= 70 ? "text-green-600" : outcome.establishedRate >= 40 ? "text-amber-600" : "text-slate-400"}`}>
                                {outcome.establishedRate}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                  <div className="flex items-center gap-2">
                    {isAdopted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" />
                        {messages.platformActions.adopted}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAdoptClick(pa)}
                        disabled={isAdopting}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isAdopting ? (
                          messages.common.loading
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            {messages.platformActions.adopt}
                          </>
                        )}
                      </Button>
                    )}
                    {pa.serviceUrl && (
                      <a
                        href={pa.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {messages.platformActions.learnMore}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Question selection dialog for adopt */}
      {adoptQuestionSelect && (
        <Card className="border-purple-300 bg-purple-50/50">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">{messages.platformActions.selectTargetQuestion}</p>
            <select
              value={selectedAdoptQuestionId}
              onChange={(e) => setSelectedAdoptQuestionId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {adoptQuestionSelect.questionIds.map((qId) => {
                const q = allQuestions.get(qId)
                return (
                  <option key={qId} value={qId}>
                    {q ? q.text : qId}
                  </option>
                )
              })}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAdopt(adoptQuestionSelect.platformActionId, selectedAdoptQuestionId)}
                disabled={adoptingId !== null}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {adoptingId ? messages.common.loading : messages.platformActions.adopt}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdoptQuestionSelect(null)}
              >
                {messages.common.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add action button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {messages.improvementActions.addAction}
        </Button>
      )}

      {/* Recommended improvements */}
      {!showForm && recommendedItems.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/40 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {messages.improvementActions.recommendedTitle}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {messages.improvementActions.recommendedDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendedItems.map((item) => (
              <button
                key={item.questionId}
                type="button"
                onClick={() => handleRecommendedClick(item.questionId)}
                className="flex w-full items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2.5 text-left transition-all hover:border-amber-300 hover:bg-amber-50/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.templateName} ・ {CATEGORY_LABELS[item.category] ?? item.category}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-lg font-bold text-amber-700">{item.score}</p>
                  <p className="text-[10px] text-muted-foreground">{messages.improvementActions.recommendedScore}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rotating tips */}
      {!showForm && <RotatingTip />}

      {/* Error message */}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">{messages.improvementActions.addAction}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Question selector (checkboxes) — system_admin only */}
            {isSystemAdmin && hasTemplates && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {messages.improvementActions.selectQuestion}
                </Label>
                <QuestionCheckboxList
                  templateQuestions={templateQuestions}
                  selectedIds={selectedQuestionIds}
                  questionScores={questionScores}
                  onToggle={handleToggleQuestion}
                />
              </div>
            )}

            {/* Step 2: Suggestion cards (shown when question is selected) — system_admin only */}
            {isSystemAdmin && selectedQuestionIds.size > 0 && suggestions.length > 0 && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-amber-700">
                    <Lightbulb className="mr-1 inline h-3.5 w-3.5" />
                    {messages.improvementActions.suggestedActions}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {messages.improvementActions.suggestedActionsDesc}
                  </p>
                </div>
                <div className="grid gap-2">
                  {suggestions.map((s, i) => {
                    const isSelected = title === s.title && description === s.description
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                        }`}
                      >
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>
                      </button>
                    )
                  })}
                  {/* Custom action option */}
                  <button
                    type="button"
                    onClick={() => {
                      setTitle("")
                      setDescription("")
                    }}
                    className={`rounded-lg border border-dashed p-3 text-left transition-all ${
                      title && !suggestions.some((s) => s.title === title)
                        ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                        : "border-gray-300 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-muted-foreground">
                      <Pencil className="mr-1 inline h-3.5 w-3.5" />
                      {messages.improvementActions.customAction}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {messages.improvementActions.customActionDesc}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Title & description (always shown, pre-filled from suggestion or manual) */}
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.actionTitle}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={messages.improvementActions.actionTitlePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.description}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={messages.improvementActions.descriptionPlaceholder}
              />
            </div>

            {/* Current scores of selected questions (auto-populated, last 30 days) — system_admin only */}
            {isSystemAdmin && selectedQuestionIds.size > 0 && (
              <SelectedQuestionsScores
                selectedIds={selectedQuestionIds}
                questionScores={questionScores}
                allQuestions={allQuestions}
              />
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={!title.trim() || loading}>
                {loading ? messages.common.loading : messages.common.save}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
              >
                {messages.common.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {actions.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {messages.improvementActions.noActions}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {messages.improvementActions.noActionsDesc}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active actions */}
      {activeActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {messages.improvementActions.statusActive}
          </h2>
          {activeActions.map((action) => {
            const qIds = parseQuestionIds(action.targetQuestionId)
            const questionLabels = Array.from(qIds)
              .map((qId) => {
                const q = allQuestions.get(qId)
                return q ? `${q.text}（${q.templateName}）` : null
              })
              .filter(Boolean)
            const questionLabel = questionLabels.length > 0 ? questionLabels.join("、") : action.targetQuestion
            const categories = Array.from(qIds)
              .map((qId) => QUESTION_CATEGORY_MAP[qId])
              .filter(Boolean)
            const category = categories[0]
            // Average score across selected questions
            const qScores = Array.from(qIds)
              .map((qId) => questionScores[qId])
              .filter((s): s is number => s != null)
            const avgCurrentScore = qScores.length > 0
              ? Math.round(qScores.reduce((a, b) => a + b, 0) / qScores.length * 100) / 100
              : undefined
            return (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedId === action.id}
                onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onLogUpdated={handleLogUpdated}
                onLogAdded={(actionId, newLog) => {
                  setActions(actions.map((a) => {
                    if (a.id !== actionId) return a
                    return { ...a, logs: [...(a.logs ?? []), newLog] }
                  }))
                }}
                loading={loading}
                currentQuestionScore={avgCurrentScore}
                questionLabel={questionLabel}
                category={category}
                isEditing={editingId === action.id}
                onStartEdit={() => startEdit(action)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(action.id)}
                editTitle={editTitle}
                editDescription={editDescription}
                editQuestionIds={editQuestionIds}
                onEditTitleChange={setEditTitle}
                onEditDescriptionChange={setEditDescription}
                onEditToggleQuestion={(qId) => {
                  setEditQuestionIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(qId)) next.delete(qId)
                    else next.add(qId)
                    return next
                  })
                }}
                templateQuestions={templateQuestions}
                questionScores={questionScores}
                allQuestions={allQuestions}
                isSystemAdmin={isSystemAdmin}
                monthlyMetrics={monthlyMetrics}
              />
            )
          })}
        </div>
      )}

      {/* Completed / cancelled actions */}
      {completedActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {messages.improvementActions.statusCompleted}
          </h2>
          {completedActions.map((action) => {
            const qIds = parseQuestionIds(action.targetQuestionId)
            const questionLabels = Array.from(qIds)
              .map((qId) => {
                const q = allQuestions.get(qId)
                return q ? `${q.text}（${q.templateName}）` : null
              })
              .filter(Boolean)
            const questionLabel = questionLabels.length > 0 ? questionLabels.join("、") : action.targetQuestion
            const categories = Array.from(qIds)
              .map((qId) => QUESTION_CATEGORY_MAP[qId])
              .filter(Boolean)
            const category = categories[0]
            return (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedId === action.id}
                onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onLogUpdated={handleLogUpdated}
                onLogAdded={() => {}}
                loading={loading}
                questionLabel={questionLabel}
                category={category}
                isEditing={editingId === action.id}
                onStartEdit={() => startEdit(action)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(action.id)}
                editTitle={editTitle}
                editDescription={editDescription}
                editQuestionIds={editQuestionIds}
                onEditTitleChange={setEditTitle}
                onEditDescriptionChange={setEditDescription}
                onEditToggleQuestion={(qId) => {
                  setEditQuestionIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(qId)) next.delete(qId)
                    else next.add(qId)
                    return next
                  })
                }}
                templateQuestions={templateQuestions}
                questionScores={questionScores}
                allQuestions={allQuestions}
                isSystemAdmin={isSystemAdmin}
                monthlyMetrics={monthlyMetrics}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ActionCard({
  action,
  expanded,
  onToggle,
  onStatusChange,
  onDelete,
  onLogUpdated,
  onLogAdded,
  loading,
  currentQuestionScore,
  questionLabel,
  category,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  editTitle,
  editDescription,
  editQuestionIds,
  onEditTitleChange,
  onEditDescriptionChange,
  onEditToggleQuestion,
  templateQuestions,
  questionScores,
  allQuestions,
  isSystemAdmin,
  monthlyMetrics,
}: {
  action: ImprovementAction
  expanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string, extra?: { completionReason?: string; completionNote?: string }) => void
  onDelete: (id: string) => void
  onLogUpdated: (actionId: string, updatedLog: ActionLog) => void
  onLogAdded: (actionId: string, newLog: ActionLog) => void
  loading: boolean
  currentQuestionScore?: number
  questionLabel?: string | null
  category?: string
  isEditing?: boolean
  onStartEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: () => void
  editTitle?: string
  editDescription?: string
  editQuestionIds?: Set<string>
  onEditTitleChange?: (v: string) => void
  onEditDescriptionChange?: (v: string) => void
  onEditToggleQuestion?: (qId: string) => void
  templateQuestions?: TemplateData[]
  questionScores?: Record<string, number>
  allQuestions?: Map<string, { text: string; templateName: string }>
  isSystemAdmin?: boolean
  monthlyMetrics?: MonthlyMetric[]
}) {
  const isActive = action.status === "active"
  const isCompleted = action.status === "completed"

  // Completion dialog state
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completionReason, setCompletionReason] = useState<string>("")
  const [completionNote, setCompletionNote] = useState("")

  // Elapsed days since start
  const elapsedDays = useMemo(() => {
    const start = new Date(action.startedAt)
    const end = action.completedAt ? new Date(action.completedAt) : new Date()
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, [action.startedAt, action.completedAt])

  // Business metrics comparison: start month vs latest month
  const metricsComparison = useMemo(() => {
    if (!monthlyMetrics || monthlyMetrics.length < 2) return null
    const startDate = new Date(action.startedAt)
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1 // 1-based

    // Find the metric for the start month (or closest earlier)
    const startMetric = monthlyMetrics
      .filter((m) => m.year < startYear || (m.year === startYear && m.month <= startMonth))
      .at(-1)

    // Latest metric (must be different from start)
    const latestMetric = monthlyMetrics.at(-1)

    if (!startMetric || !latestMetric) return null
    if (startMetric.year === latestMetric.year && startMetric.month === latestMetric.month) return null

    const items: Array<{
      label: string
      startValue: string
      latestValue: string
      changeText: string
      changeType: "positive" | "negative" | "neutral"
    }> = []

    // Total revenue
    if (startMetric.totalRevenue != null && latestMetric.totalRevenue != null) {
      const pct = startMetric.totalRevenue > 0
        ? ((latestMetric.totalRevenue - startMetric.totalRevenue) / startMetric.totalRevenue) * 100
        : 0
      items.push({
        label: messages.improvementActions.metricsRevenue,
        startValue: `${Math.round(startMetric.totalRevenue / 10000)}`,
        latestValue: `${Math.round(latestMetric.totalRevenue / 10000)}`,
        changeText: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
        changeType: pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral",
      })
    }

    // Total patient count
    if (startMetric.totalPatientCount != null && latestMetric.totalPatientCount != null) {
      const diff = latestMetric.totalPatientCount - startMetric.totalPatientCount
      items.push({
        label: messages.improvementActions.metricsPatients,
        startValue: `${startMetric.totalPatientCount}`,
        latestValue: `${latestMetric.totalPatientCount}`,
        changeText: `${diff >= 0 ? "+" : ""}${diff}`,
        changeType: diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral",
      })
    }

    // Cancellation rate
    const startCancelRate = startMetric.cancellationCount != null && startMetric.totalVisitCount
      ? (startMetric.cancellationCount / startMetric.totalVisitCount) * 100
      : null
    const latestCancelRate = latestMetric.cancellationCount != null && latestMetric.totalVisitCount
      ? (latestMetric.cancellationCount / latestMetric.totalVisitCount) * 100
      : null
    if (startCancelRate != null && latestCancelRate != null) {
      const diff = latestCancelRate - startCancelRate
      items.push({
        label: messages.improvementActions.metricsCancelRate,
        startValue: `${startCancelRate.toFixed(1)}%`,
        latestValue: `${latestCancelRate.toFixed(1)}%`,
        changeText: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pt`,
        changeType: diff < 0 ? "positive" : diff > 0 ? "negative" : "neutral", // lower is better
      })
    }

    if (items.length === 0) return null

    return {
      items,
      startLabel: `${startMetric.year}/${startMetric.month}`,
      latestLabel: `${latestMetric.year}/${latestMetric.month}`,
    }
  }, [monthlyMetrics, action.startedAt])

  // For active: compare baseline vs current question score
  // For completed: compare baseline vs resultScore (auto-captured at completion)
  const compareScore = isActive ? (currentQuestionScore ?? null) : (action.resultScore ?? null)
  const scoreChange =
    compareScore != null && action.baselineScore != null
      ? Math.round((compareScore - action.baselineScore) * 10) / 10
      : null

  const categoryLabel = category ? CATEGORY_LABELS[category] : null

  return (
    <Card
      className={
        isActive
          ? "border-blue-200 bg-gradient-to-r from-blue-50/30 to-white"
          : isCompleted
            ? "border-green-200 bg-gradient-to-r from-green-50/30 to-white"
            : "opacity-60"
      }
    >
      <CardContent className="py-4">
        <button
          onClick={onToggle}
          className="flex w-full items-start justify-between text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-sm font-medium truncate">{action.title}</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-6">
              {action.platformActionId && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                  <Megaphone className="h-2.5 w-2.5" />
                  {messages.platformActions.fromPlatform}
                </span>
              )}
              {categoryLabel && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  <Tag className="h-2.5 w-2.5" />
                  {categoryLabel}
                </span>
              )}
              {isActive && elapsedDays > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100/70 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  <CalendarClock className="h-2.5 w-2.5" />
                  {elapsedDays}{messages.improvementActions.elapsedDays}
                </span>
              )}
              {(questionLabel || action.targetQuestion) && (
                <span className="text-xs text-muted-foreground truncate">
                  {questionLabel || action.targetQuestion}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Score change badge */}
            {scoreChange !== null && (
              <div
                className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  scoreChange > 0
                    ? "bg-green-100 text-green-700"
                    : scoreChange < 0
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {scoreChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : scoreChange < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {scoreChange > 0 ? "+" : ""}
                {scoreChange}
              </div>
            )}
            {/* Score pills */}
            {action.baselineScore != null && (
              <span className="text-xs text-muted-foreground">
                {action.baselineScore}
                {compareScore != null ? ` → ${compareScore}` : ""}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && !isEditing && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {action.description && (
              <p className="text-sm text-muted-foreground">{action.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                {messages.improvementActions.startedAt}:{" "}
                {new Date(action.startedAt).toLocaleDateString("ja-JP")}
              </span>
              {action.completedAt && (
                <span>
                  {messages.improvementActions.completedAt}:{" "}
                  {new Date(action.completedAt).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>

            {/* History timeline */}
            {action.logs && action.logs.length > 0 && (
              <ActionTimeline logs={action.logs} onLogUpdated={(updatedLog) => onLogUpdated(action.id, updatedLog)} />
            )}

            {/* Score comparison: baseline → current/completion */}
            {action.baselineScore != null && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    {messages.improvementActions.baselineScore}
                  </p>
                  <p className="text-lg font-bold">{action.baselineScore}</p>
                  <p className="text-[9px] text-muted-foreground/60">
                    {messages.improvementActions.baselineScoreNote}
                  </p>
                </div>
                {isActive && currentQuestionScore != null && (
                  <div className="rounded-lg bg-blue-50 p-2 text-center">
                    <p className="text-[10px] text-blue-600">
                      {messages.improvementActions.currentScore}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {currentQuestionScore}
                    </p>
                    <p className="text-[9px] text-blue-500/60">
                      {messages.improvementActions.currentScoreNote}
                    </p>
                  </div>
                )}
                {!isActive && action.resultScore != null && (
                  <div
                    className={`rounded-lg p-2 text-center ${
                      action.resultScore >= action.baselineScore
                        ? "bg-green-50"
                        : "bg-orange-50"
                    }`}
                  >
                    <p
                      className={`text-[10px] ${
                        action.resultScore >= action.baselineScore
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {messages.improvementActions.completionScore}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        action.resultScore >= action.baselineScore
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {action.resultScore}
                    </p>
                    <p
                      className={`text-[9px] ${
                        action.resultScore >= action.baselineScore
                          ? "text-green-500/60"
                          : "text-orange-500/60"
                      }`}
                    >
                      {messages.improvementActions.completionScoreNote}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Business metrics comparison */}
            {metricsComparison && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {messages.improvementActions.metricsTitle}
                  <span className="font-normal text-slate-400 ml-1">
                    {metricsComparison.startLabel} → {metricsComparison.latestLabel}
                  </span>
                </p>
                <div className={`grid gap-2 ${metricsComparison.items.length === 3 ? "grid-cols-3" : metricsComparison.items.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {metricsComparison.items.map((item) => (
                    <div key={item.label} className="rounded-md bg-white p-2 text-center">
                      <p className="text-[9px] text-slate-500">{item.label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {item.startValue} → <span className="font-semibold">{item.latestValue}</span>
                        {item.label === messages.improvementActions.metricsRevenue && (
                          <span className="text-[9px] text-slate-400 ml-0.5">{messages.improvementActions.metricsRevenueUnit}</span>
                        )}
                      </p>
                      <p className={`text-[11px] font-bold mt-0.5 ${
                        item.changeType === "positive" ? "text-green-600" :
                        item.changeType === "negative" ? "text-red-500" :
                        "text-slate-400"
                      }`}>
                        {item.changeText}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400">{messages.improvementActions.metricsNote}</p>
              </div>
            )}
            {!metricsComparison && expanded && monthlyMetrics && monthlyMetrics.length < 2 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  <BarChart3 className="inline h-3 w-3 mr-1" />
                  {messages.improvementActions.metricsEmpty}
                </p>
              </div>
            )}

            {/* Completion reason (shown for completed actions) */}
            {!isActive && action.completionReason && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                <p>
                  <span className="font-medium">{messages.improvementActions.completionReasonLabel}: </span>
                  {action.completionReason === "established" && `✅ ${messages.improvementActions.completionReasonEstablished}`}
                  {action.completionReason === "uncertain" && `🔄 ${messages.improvementActions.completionReasonUncertain}`}
                  {action.completionReason === "suspended" && `⏸️ ${messages.improvementActions.completionReasonSuspended}`}
                </p>
                {action.completionNote && (
                  <p>
                    <span className="font-medium">{messages.improvementActions.completionNoteLabel}: </span>
                    {action.completionNote}
                  </p>
                )}
              </div>
            )}

            {/* Add progress note */}
            {isActive && (
              <AddLogForm actionId={action.id} onLogAdded={onLogAdded} />
            )}

            {/* Actions */}
            {isActive && !showCompletionDialog && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowCompletionDialog(true)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.complete}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(action.id, "cancelled")}
                  disabled={loading}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.cancel}
                </Button>
              </div>
            )}

            {/* Completion confirmation dialog */}
            {isActive && showCompletionDialog && (
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">{messages.improvementActions.completionDialogTitle}</p>
                  <p className="text-xs text-muted-foreground">{messages.improvementActions.completionDialogDesc}</p>
                </div>
                <div className="space-y-2">
                  {([
                    { value: "established", label: messages.improvementActions.completionReasonEstablished, desc: messages.improvementActions.completionReasonEstablishedDesc, icon: "✅" },
                    { value: "uncertain", label: messages.improvementActions.completionReasonUncertain, desc: messages.improvementActions.completionReasonUncertainDesc, icon: "🔄" },
                    { value: "suspended", label: messages.improvementActions.completionReasonSuspended, desc: messages.improvementActions.completionReasonSuspendedDesc, icon: "⏸️" },
                  ] as const).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all ${
                        completionReason === option.value
                          ? "border-green-400 bg-white ring-1 ring-green-400"
                          : "border-gray-200 bg-white hover:border-green-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`completion-${action.id}`}
                        value={option.value}
                        checked={completionReason === option.value}
                        onChange={() => setCompletionReason(option.value)}
                        className="mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          <span className="mr-1">{option.icon}</span>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Input
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder={messages.improvementActions.completionNotePlaceholder}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onStatusChange(action.id, "completed", {
                        completionReason,
                        completionNote: completionNote.trim() || undefined,
                      })
                      setShowCompletionDialog(false)
                      setCompletionReason("")
                      setCompletionNote("")
                    }}
                    disabled={!completionReason || loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {messages.improvementActions.complete}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCompletionDialog(false)
                      setCompletionReason("")
                      setCompletionNote("")
                    }}
                  >
                    {messages.common.cancel}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(action.id, "active")}
                  disabled={loading}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.reactivate}
                </Button>
              )}
              {onStartEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onStartEdit() }}
                  disabled={loading}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  {messages.improvementActions.editAction}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(action.id)}
                disabled={loading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {messages.improvementActions.delete}
              </Button>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {expanded && isEditing && onCancelEdit && onSaveEdit && onEditTitleChange && onEditDescriptionChange && (
          <div className="mt-3 space-y-4 border-t pt-3">
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.actionTitle}</Label>
              <Input
                value={editTitle ?? ""}
                onChange={(e) => onEditTitleChange(e.target.value)}
                placeholder={messages.improvementActions.actionTitlePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.description}</Label>
              <Input
                value={editDescription ?? ""}
                onChange={(e) => onEditDescriptionChange(e.target.value)}
                placeholder={messages.improvementActions.descriptionPlaceholder}
              />
            </div>
            {isSystemAdmin && onEditToggleQuestion && templateQuestions && questionScores && allQuestions && editQuestionIds && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {messages.improvementActions.selectQuestion}
                  </Label>
                  <QuestionCheckboxList
                    templateQuestions={templateQuestions}
                    selectedIds={editQuestionIds}
                    questionScores={questionScores}
                    onToggle={onEditToggleQuestion}
                  />
                </div>
                {editQuestionIds.size > 0 && (
                  <SelectedQuestionsScores
                    selectedIds={editQuestionIds}
                    questionScores={questionScores}
                    allQuestions={allQuestions}
                  />
                )}
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={onSaveEdit} disabled={!(editTitle?.trim()) || loading}>
                {loading ? messages.common.loading : messages.common.save}
              </Button>
              <Button variant="ghost" onClick={onCancelEdit}>
                {messages.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Checkbox question list ───

function QuestionCheckboxList({
  templateQuestions,
  selectedIds,
  questionScores,
  onToggle,
}: {
  templateQuestions: TemplateData[]
  selectedIds: Set<string>
  questionScores: Record<string, number>
  onToggle: (questionId: string) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-input bg-background p-3 max-h-64 overflow-y-auto">
      {templateQuestions.map((t) => (
        <div key={t.name}>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t.name}</p>
          <div className="space-y-1">
            {t.questions.map((q) => {
              const isChecked = selectedIds.has(q.id)
              const score = questionScores[q.id]
              return (
                <label
                  key={q.id}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-all ${
                    isChecked
                      ? "bg-blue-50 border border-blue-300"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(q.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm">{q.text}</span>
                  {score != null && (
                    <span className={`text-xs font-semibold tabular-nums ${score < 3.5 ? "text-amber-700" : "text-muted-foreground"}`}>
                      {score}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Selected questions scores display ───

function SelectedQuestionsScores({
  selectedIds,
  questionScores,
  allQuestions,
}: {
  selectedIds: Set<string>
  questionScores: Record<string, number>
  allQuestions: Map<string, { text: string; templateName: string }>
}) {
  const qIds = Array.from(selectedIds)
  const scored = qIds
    .map((qId) => ({ qId, text: allQuestions.get(qId)?.text, score: questionScores[qId] }))
    .filter((x): x is { qId: string; text: string; score: number } => x.text != null && x.score != null)

  if (scored.length === 0) return null

  const avg = Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length * 100) / 100

  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-1">
      <p className="text-xs text-muted-foreground">
        {messages.improvementActions.baselineScore}
        <span className="ml-1 text-[10px] text-muted-foreground/70">
          （{messages.improvementActions.baselineScoreNote}）
        </span>
      </p>
      {scored.length === 1 ? (
        <p className="text-lg font-bold">{scored[0].score}</p>
      ) : (
        <>
          <div className="space-y-0.5">
            {scored.map((s) => (
              <div key={s.qId} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{s.text}</span>
                <span className="font-semibold tabular-nums">{s.score}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">平均</span>
            <span className="text-lg font-bold">{avg}</span>
          </div>
        </>
      )}
    </div>
  )
}

const LOG_ACTION_CONFIG: Record<string, {
  label: string
  icon: typeof Play
  color: string
  dotColor: string
}> = {
  started: {
    label: messages.improvementActions.logStarted,
    icon: Play,
    color: "text-blue-600",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: messages.improvementActions.logCompleted,
    icon: CheckCircle2,
    color: "text-green-600",
    dotColor: "bg-green-500",
  },
  cancelled: {
    label: messages.improvementActions.logCancelled,
    icon: Ban,
    color: "text-gray-500",
    dotColor: "bg-gray-400",
  },
  reactivated: {
    label: messages.improvementActions.logReactivated,
    icon: RefreshCw,
    color: "text-amber-600",
    dotColor: "bg-amber-500",
  },
  note: {
    label: messages.improvementActions.addLog,
    icon: StickyNote,
    color: "text-purple-600",
    dotColor: "bg-purple-400",
  },
}

function ActionTimeline({ logs, onLogUpdated }: { logs: ActionLog[]; onLogUpdated: (updatedLog: ActionLog) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editScore, setEditScore] = useState("")
  const [editNote, setEditNote] = useState("")
  const [saving, setSaving] = useState(false)

  function startEdit(log: ActionLog) {
    setEditingId(log.id)
    const d = new Date(log.createdAt)
    setEditDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
    setEditScore(log.satisfactionScore != null ? String(log.satisfactionScore) : "")
    setEditNote(log.note ?? "")
  }

  async function handleSave(logId: string) {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (editDate) body.createdAt = new Date(editDate).toISOString()
      body.satisfactionScore = editScore ? Number(editScore) : null
      body.note = editNote || ""
      const res = await fetch(`/api/improvement-action-logs/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        onLogUpdated(updated)
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Clock className="h-3 w-3" />
        {messages.improvementActions.history}
      </p>
      <div className="relative ml-1.5 border-l-2 border-muted pl-4 space-y-2">
        {logs.map((log) => {
          const config = LOG_ACTION_CONFIG[log.action] ?? LOG_ACTION_CONFIG.started
          const Icon = config.icon
          const isEditing = editingId === log.id

          if (isEditing) {
            return (
              <div key={log.id} className="relative">
                <div className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${config.dotColor}`} />
                <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3 w-3 shrink-0 ${config.color}`} />
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-muted-foreground">日付</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">{messages.improvementActions.satisfactionAt}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max="5"
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        placeholder="例: 3.82"
                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">メモ</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="任意のメモ"
                      className="w-full rounded border bg-background px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleSave(log.id)}
                      disabled={saving}
                      className="rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? messages.common.loading : messages.common.save}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
                    >
                      {messages.common.cancel}
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={log.id} className="group relative">
              <div className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${config.dotColor}`} />
              <div className="flex items-center gap-2">
                <Icon className={`h-3 w-3 shrink-0 ${config.color}`} />
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleDateString("ja-JP")}
                </span>
                <button
                  onClick={() => startEdit(log)}
                  className="ml-auto hidden text-muted-foreground/50 hover:text-muted-foreground group-hover:inline-flex"
                  title="編集"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              {log.satisfactionScore != null && (
                <p className="mt-0.5 text-[11px] text-muted-foreground ml-5">
                  {messages.improvementActions.satisfactionAt}: <span className="font-semibold">{log.satisfactionScore}</span>
                </p>
              )}
              {log.note && (
                <p className="mt-0.5 text-[11px] text-muted-foreground ml-5">
                  {log.note}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AddLogForm({ actionId, onLogAdded }: { actionId: string; onLogAdded: (actionId: string, newLog: ActionLog) => void }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!note.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/improvement-actions/${actionId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      })
      if (res.ok) {
        const newLog = await res.json()
        onLogAdded(actionId, newLog)
        setNote("")
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 transition-colors"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        {messages.improvementActions.addLog}
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-md border border-purple-200 bg-purple-50/30 p-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700">
        <StickyNote className="h-3.5 w-3.5" />
        {messages.improvementActions.addLog}
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={messages.improvementActions.addLogPlaceholder}
        className="w-full rounded border bg-background px-2.5 py-1.5 text-xs"
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        autoFocus
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={!note.trim() || saving}
          className="rounded bg-purple-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? messages.common.loading : messages.common.save}
        </button>
        <button
          onClick={() => { setOpen(false); setNote("") }}
          className="rounded px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
        >
          {messages.common.cancel}
        </button>
      </div>
    </div>
  )
}

function RotatingTip() {
  const tips = messages.improvementActions.tips
  const [index, setIndex] = useState(() => Math.floor(Math.random() * tips.length))

  function goPrev() {
    setIndex((prev) => (prev - 1 + tips.length) % tips.length)
  }

  function goNext() {
    setIndex((prev) => (prev + 1) % tips.length)
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-3 min-h-[56px]">
      <button
        type="button"
        onClick={goPrev}
        className="shrink-0 rounded p-0.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
        aria-label="前のヒント"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p className="flex-1 text-xs leading-relaxed text-blue-800">
        {tips[index]}
      </p>
      <button
        type="button"
        onClick={goNext}
        className="shrink-0 rounded p-0.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
        aria-label="次のヒント"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
