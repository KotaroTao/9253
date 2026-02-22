"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Megaphone,
  Target,
  ExternalLink,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { CATEGORY_LABELS } from "@/lib/constants"

interface PlatformAction {
  id: string
  title: string
  description: string | null
  detailedContent: string | null
  targetQuestionIds: string[] | null
  category: string | null
  isPickup: boolean
  isActive: boolean
  serviceUrl: string | null
  serviceProvider: string | null
  displayOrder: number
  adoptCount: number
  completedCount: number
  avgImprovement: number | null
  completionReasons: Record<string, number>
  createdAt: string
}

type FormData = {
  title: string
  description: string
  detailedContent: string
  targetQuestionIds: string
  category: string
  isPickup: boolean
  serviceUrl: string
  serviceProvider: string
  displayOrder: string
}

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  detailedContent: "",
  targetQuestionIds: "",
  category: "",
  isPickup: false,
  serviceUrl: "",
  serviceProvider: "",
  displayOrder: "0",
}

const categoryOptions = Object.entries(CATEGORY_LABELS)

export function PlatformActionsManager() {
  const [actions, setActions] = useState<PlatformAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null) // null = closed, "new" = creating
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/platform-actions")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setActions(data)
    } catch {
      setError("データの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  function openCreate() {
    setEditingId("new")
    setForm(EMPTY_FORM)
    setError("")
    setSuccess("")
  }

  function openEdit(action: PlatformAction) {
    setEditingId(action.id)
    setForm({
      title: action.title,
      description: action.description ?? "",
      detailedContent: action.detailedContent ?? "",
      targetQuestionIds: action.targetQuestionIds?.join(", ") ?? "",
      category: action.category ?? "",
      isPickup: action.isPickup,
      serviceUrl: action.serviceUrl ?? "",
      serviceProvider: action.serviceProvider ?? "",
      displayOrder: String(action.displayOrder),
    })
    setError("")
    setSuccess("")
  }

  function closeForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.title.trim() || saving) return
    setSaving(true)
    setError("")
    setSuccess("")

    const questionIds = form.targetQuestionIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const body = {
      title: form.title,
      description: form.description,
      detailedContent: form.detailedContent,
      targetQuestionIds: questionIds.length > 0 ? questionIds : null,
      category: form.category || null,
      isPickup: form.isPickup,
      serviceUrl: form.serviceUrl,
      serviceProvider: form.serviceProvider,
      displayOrder: parseInt(form.displayOrder) || 0,
    }

    try {
      const isNew = editingId === "new"
      const url = isNew
        ? "/api/admin/platform-actions"
        : `/api/admin/platform-actions/${editingId}`
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSuccess(isNew ? messages.platformActions.createSuccess : messages.platformActions.updateSuccess)
        closeForm()
        fetchActions()
      } else {
        const err = await res.json().catch(() => null)
        setError(err?.error || messages.improvementActions.saveFailed)
      }
    } catch {
      setError(messages.improvementActions.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(messages.platformActions.deleteConfirm)) return
    try {
      const res = await fetch(`/api/admin/platform-actions/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSuccess(messages.platformActions.deleteSuccess)
        setActions(actions.filter((a) => a.id !== id))
      }
    } catch {
      setError(messages.improvementActions.deleteFailed)
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/platform-actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) {
        setActions(actions.map((a) => (a.id === id ? { ...a, isActive: !currentActive } : a)))
      }
    } catch {
      setError(messages.improvementActions.updateFailed)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{messages.common.loading}</p>
  }

  const pickupActions = actions.filter((a) => a.isPickup)
  const normalActions = actions.filter((a) => !a.isPickup)

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Create button */}
      {editingId === null && (
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {messages.platformActions.create}
        </Button>
      )}

      {/* Form */}
      {editingId !== null && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingId === "new" ? messages.platformActions.create : messages.platformActions.edit}
              </CardTitle>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{messages.platformActions.formTitle} *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例: 受付時の笑顔と挨拶を徹底する研修パッケージ"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{messages.platformActions.formDescription}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="概要を入力"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{messages.platformActions.formDetailedContent}</Label>
              <textarea
                value={form.detailedContent}
                onChange={(e) => setForm({ ...form, detailedContent: e.target.value })}
                placeholder="詳細な説明を入力"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{messages.platformActions.formCategory}</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">未設定</option>
                  {categoryOptions.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{messages.platformActions.formTargetQuestions}</Label>
                <Input
                  value={form.targetQuestionIds}
                  onChange={(e) => setForm({ ...form, targetQuestionIds: e.target.value })}
                  placeholder="例: fv2, tr5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{messages.platformActions.formServiceUrl}</Label>
                <Input
                  value={form.serviceUrl}
                  onChange={(e) => setForm({ ...form, serviceUrl: e.target.value })}
                  placeholder="https://example.com/service"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{messages.platformActions.formServiceProvider}</Label>
                <Input
                  value={form.serviceProvider}
                  onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })}
                  placeholder="提供元の名称"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{messages.platformActions.formDisplayOrder}</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isPickup"
                  checked={form.isPickup}
                  onChange={(e) => setForm({ ...form, isPickup: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPickup" className="flex items-center gap-1.5 cursor-pointer">
                  <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                  {messages.platformActions.formIsPickup}
                </Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
                {saving ? messages.common.loading : messages.common.save}
              </Button>
              <Button variant="ghost" onClick={closeForm}>
                {messages.common.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup actions */}
      {pickupActions.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Megaphone className="h-4 w-4" />
            {messages.platformActions.pickup}
          </h2>
          {pickupActions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Normal actions */}
      {normalActions.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Target className="h-4 w-4" />
            {messages.platformActions.title}
          </h2>
          {normalActions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {actions.length === 0 && editingId === null && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {messages.platformActions.noActions}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ActionRow({
  action,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  action: PlatformAction
  onEdit: (action: PlatformAction) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentActive: boolean) => void
}) {
  const categoryLabel = action.category ? CATEGORY_LABELS[action.category] : null

  return (
    <Card className={action.isActive ? "" : "opacity-50"}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{action.title}</p>
              {action.isPickup && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <Megaphone className="h-2.5 w-2.5" />
                  {messages.platformActions.pickup}
                </span>
              )}
              {categoryLabel && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {categoryLabel}
                </span>
              )}
              {!action.isActive && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                  無効
                </span>
              )}
            </div>
            {action.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{action.description}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {action.serviceProvider && (
                <span className="flex items-center gap-1">
                  {messages.platformActions.provider}: {action.serviceProvider}
                </span>
              )}
              {action.serviceUrl && (
                <a
                  href={action.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  URL
                </a>
              )}
              {action.targetQuestionIds && (
                <span>対象: {(action.targetQuestionIds as string[]).join(", ")}</span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-blue-600">
                <Users className="h-3 w-3" />
                {messages.platformActions.adoptCount}: {action.adoptCount}
              </span>
              {action.completedCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  {messages.platformActions.completedCount}: {action.completedCount}
                </span>
              )}
              {action.avgImprovement != null && (
                <span className={`flex items-center gap-1 ${action.avgImprovement >= 0 ? "text-green-600" : "text-red-600"}`}>
                  <TrendingUp className="h-3 w-3" />
                  {messages.platformActions.avgImprovement}: {action.avgImprovement > 0 ? "+" : ""}{action.avgImprovement}
                </span>
              )}
            </div>
            {action.completedCount > 0 && Object.keys(action.completionReasons).length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                {action.completionReasons.established > 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                    ✅ {messages.platformActions.reasonEstablished}: {action.completionReasons.established}
                  </span>
                )}
                {action.completionReasons.uncertain > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                    🔄 {messages.platformActions.reasonUncertain}: {action.completionReasons.uncertain}
                  </span>
                )}
                {action.completionReasons.suspended > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
                    ⏸️ {messages.platformActions.reasonSuspended}: {action.completionReasons.suspended}
                  </span>
                )}
                {action.completionReasons.none > 0 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">
                    {messages.platformActions.reasonNone}: {action.completionReasons.none}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleActive(action.id, action.isActive)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted"
              title={messages.platformActions.toggleActive}
            >
              {action.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onEdit(action)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(action.id)}
              className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
