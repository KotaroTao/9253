"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
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
} from "lucide-react"

interface ImprovementAction {
  id: string
  title: string
  description: string | null
  targetQuestion: string | null
  baselineScore: number | null
  targetScore: number | null
  resultScore: number | null
  status: string
  startedAt: string | Date
  completedAt: string | Date | null
}

interface Props {
  initialActions: ImprovementAction[]
}

export function ImprovementActionsView({ initialActions }: Props) {
  const router = useRouter()
  const [actions, setActions] = useState(initialActions)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetQuestion, setTargetQuestion] = useState("")
  const [baselineScore, setBaselineScore] = useState("")
  const [targetScore, setTargetScore] = useState("")

  async function handleCreate() {
    if (!title.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/improvement-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetQuestion: targetQuestion.trim() || undefined,
          baselineScore: baselineScore ? Number(baselineScore) : undefined,
          targetScore: targetScore ? Number(targetScore) : undefined,
        }),
      })
      if (res.ok) {
        setTitle("")
        setDescription("")
        setTargetQuestion("")
        setBaselineScore("")
        setTargetScore("")
        setShowForm(false)
        router.refresh()
        const data = await res.json()
        setActions([data, ...actions])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: string, resultScore?: number) {
    setLoading(true)
    try {
      const body: Record<string, unknown> = { status }
      if (typeof resultScore === "number") {
        body.resultScore = resultScore
      }
      const res = await fetch(`/api/improvement-actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.refresh()
        const updated = await res.json()
        setActions(actions.map((a) => (a.id === id ? updated : a)))
      }
    } finally {
      setLoading(false)
    }
  }

  const activeActions = actions.filter((a) => a.status === "active")
  const completedActions = actions.filter((a) => a.status !== "active")

  return (
    <div className="space-y-4">
      {/* Add action button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {messages.improvementActions.addAction}
        </Button>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">{messages.improvementActions.addAction}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="space-y-1.5">
              <Label>{messages.improvementActions.targetQuestion}</Label>
              <Input
                value={targetQuestion}
                onChange={(e) => setTargetQuestion(e.target.value)}
                placeholder="例: 受付の対応は丁寧でしたか？"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{messages.improvementActions.baselineScore}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={baselineScore}
                  onChange={(e) => setBaselineScore(e.target.value)}
                  placeholder="3.2"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{messages.improvementActions.targetScore}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="4.0"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={!title.trim() || loading}>
                {loading ? messages.common.loading : messages.common.save}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
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
          {activeActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              expanded={expandedId === action.id}
              onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
              onStatusChange={handleStatusChange}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* Completed / cancelled actions */}
      {completedActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {messages.improvementActions.statusCompleted}
          </h2>
          {completedActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              expanded={expandedId === action.id}
              onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
              onStatusChange={handleStatusChange}
              loading={loading}
            />
          ))}
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
  loading,
}: {
  action: ImprovementAction
  expanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string, resultScore?: number) => void
  loading: boolean
}) {
  const [resultInput, setResultInput] = useState(
    action.resultScore?.toString() ?? ""
  )
  const isActive = action.status === "active"
  const isCompleted = action.status === "completed"

  const scoreChange =
    action.resultScore != null && action.baselineScore != null
      ? Math.round((action.resultScore - action.baselineScore) * 10) / 10
      : null

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
            {action.targetQuestion && (
              <p className="mt-1 text-xs text-muted-foreground pl-6">
                {action.targetQuestion}
              </p>
            )}
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
                {action.resultScore != null ? ` → ${action.resultScore}` : ""}
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

            {/* Score comparison */}
            {(action.baselineScore != null || action.targetScore != null) && (
              <div className="grid grid-cols-3 gap-2">
                {action.baselineScore != null && (
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      {messages.improvementActions.baselineScore}
                    </p>
                    <p className="text-lg font-bold">{action.baselineScore}</p>
                  </div>
                )}
                {action.targetScore != null && (
                  <div className="rounded-lg bg-blue-50 p-2 text-center">
                    <p className="text-[10px] text-blue-600">
                      {messages.improvementActions.targetScore}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {action.targetScore}
                    </p>
                  </div>
                )}
                {action.resultScore != null && (
                  <div
                    className={`rounded-lg p-2 text-center ${
                      action.resultScore >= (action.targetScore ?? 0)
                        ? "bg-green-50"
                        : "bg-orange-50"
                    }`}
                  >
                    <p
                      className={`text-[10px] ${
                        action.resultScore >= (action.targetScore ?? 0)
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {messages.improvementActions.resultScore}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        action.resultScore >= (action.targetScore ?? 0)
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {action.resultScore}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {isActive && (
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">
                      {messages.improvementActions.resultScore}
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={resultInput}
                      onChange={(e) => setResultInput(e.target.value)}
                      placeholder="4.2"
                      className="h-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      onStatusChange(
                        action.id,
                        "completed",
                        resultInput ? Number(resultInput) : undefined
                      )
                    }
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
              </div>
            )}

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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
