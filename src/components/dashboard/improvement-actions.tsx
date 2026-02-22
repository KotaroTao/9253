"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
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
  status: string
  startedAt: string | Date
  completedAt: string | Date | null
  logs?: ActionLog[]
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

interface Props {
  initialActions: ImprovementAction[]
  templateQuestions?: TemplateData[]
  questionScores?: Record<string, number>
}

export function ImprovementActionsView({ initialActions, templateQuestions = [], questionScores = {} }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [actions, setActions] = useState(initialActions)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form state
  const [selectedQuestionId, setSelectedQuestionId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetQuestion, setTargetQuestion] = useState("")

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

  // Auto-open form with pre-selected question from URL param (?question=fv2)
  useEffect(() => {
    const questionParam = searchParams.get("question")
    if (questionParam && allQuestions.has(questionParam)) {
      setShowForm(true)
      setSelectedQuestionId(questionParam)
      const q = allQuestions.get(questionParam)
      if (q) setTargetQuestion(q.text)
      // Clean up URL
      router.replace("/dashboard/actions", { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Get suggestions for selected question
  const suggestions = useMemo((): ImprovementSuggestion[] => {
    if (!selectedQuestionId) return []
    const category = QUESTION_CATEGORY_MAP[selectedQuestionId]
    if (!category) return []
    return IMPROVEMENT_SUGGESTIONS[category] ?? []
  }, [selectedQuestionId])

  function handleSelectQuestion(questionId: string) {
    setSelectedQuestionId(questionId)
    // Set targetQuestion text from the selected question
    const q = allQuestions.get(questionId)
    if (q) {
      setTargetQuestion(q.text)
    }
    // Reset title/description when changing question (unless user manually typed)
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
    setTargetQuestion("")
    setSelectedQuestionId("")
  }

  async function handleCreate() {
    if (!title.trim() || loading) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/improvement-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetQuestion: targetQuestion.trim() || undefined,
          targetQuestionId: selectedQuestionId || undefined,
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

  async function handleStatusChange(id: string, status: string) {
    setLoading(true)
    setErrorMsg(null)
    try {
      const body: Record<string, unknown> = { status }
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
        .map((a) => a.targetQuestionId!)
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
    handleSelectQuestion(questionId)
  }

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
            {/* Step 1: Question selector */}
            {hasTemplates && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {messages.improvementActions.selectQuestion}
                </Label>
                <select
                  value={selectedQuestionId}
                  onChange={(e) => handleSelectQuestion(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">
                    {messages.improvementActions.selectQuestionPlaceholder}
                  </option>
                  {templateQuestions.map((t) => (
                    <optgroup key={t.name} label={t.name}>
                      {t.questions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.text}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {/* Step 2: Suggestion cards (shown when question is selected) */}
            {selectedQuestionId && suggestions.length > 0 && (
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

            {/* Target question (manual entry if no templates, or hidden since auto-set) */}
            {!hasTemplates && (
              <div className="space-y-1.5">
                <Label>{messages.improvementActions.targetQuestion}</Label>
                <Input
                  value={targetQuestion}
                  onChange={(e) => setTargetQuestion(e.target.value)}
                  placeholder="例: 受付の対応は丁寧でしたか？"
                />
              </div>
            )}

            {/* Current score of selected question (auto-populated, last 30 days) */}
            {selectedQuestionId && questionScores[selectedQuestionId] != null && (
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {messages.improvementActions.baselineScore}
                  <span className="ml-1 text-[10px] text-muted-foreground/70">
                    （{messages.improvementActions.baselineScoreNote}）
                  </span>
                </p>
                <p className="text-lg font-bold">
                  {questionScores[selectedQuestionId]}
                </p>
              </div>
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
            const q = action.targetQuestionId ? allQuestions.get(action.targetQuestionId) : null
            const questionLabel = q ? `${q.text}（${q.templateName}）` : action.targetQuestion
            const category = action.targetQuestionId ? QUESTION_CATEGORY_MAP[action.targetQuestionId] : undefined
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
                currentQuestionScore={action.targetQuestionId ? questionScores[action.targetQuestionId] : undefined}
                questionLabel={questionLabel}
                category={category}
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
            const q = action.targetQuestionId ? allQuestions.get(action.targetQuestionId) : null
            const questionLabel = q ? `${q.text}（${q.templateName}）` : action.targetQuestion
            const category = action.targetQuestionId ? QUESTION_CATEGORY_MAP[action.targetQuestionId] : undefined
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
}: {
  action: ImprovementAction
  expanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  onLogUpdated: (actionId: string, updatedLog: ActionLog) => void
  onLogAdded: (actionId: string, newLog: ActionLog) => void
  loading: boolean
  currentQuestionScore?: number
  questionLabel?: string | null
  category?: string
}) {
  const isActive = action.status === "active"
  const isCompleted = action.status === "completed"

  // Elapsed days since start
  const elapsedDays = useMemo(() => {
    const start = new Date(action.startedAt)
    const end = action.completedAt ? new Date(action.completedAt) : new Date()
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, [action.startedAt, action.completedAt])

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

        {expanded && (
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

            {/* Add progress note */}
            {isActive && (
              <AddLogForm actionId={action.id} onLogAdded={onLogAdded} />
            )}

            {/* Actions */}
            {isActive && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onStatusChange(action.id, "completed")}
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
      </CardContent>
    </Card>
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
  const [visible, setVisible] = useState(true)

  const advance = useCallback(() => {
    setVisible(false)
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % tips.length)
      setVisible(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [tips.length])

  useEffect(() => {
    const id = setInterval(advance, 6000)
    return () => clearInterval(id)
  }, [advance])

  return (
    <div className="flex gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 min-h-[56px]">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p
        className={`text-xs leading-relaxed text-blue-800 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {tips[index]}
      </p>
    </div>
  )
}
