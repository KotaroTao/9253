"use client"

import { useState, useEffect, useCallback } from "react"
import { Lightbulb, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"

type TipItem = {
  category: string
  title: string
  content: string
}

export function TipManager() {
  const [tips, setTips] = useState<TipItem[]>([])
  const [rotationMinutes, setRotationMinutes] = useState(1440)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<TipItem>({ category: "", title: "", content: "" })

  const fetchTips = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tips")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTips(data.tips ?? [])
      setRotationMinutes(data.rotationMinutes ?? 1440)
    } catch {
      setError(messages.tipManager.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTips()
  }, [fetchTips])

  async function saveTips(newTips: TipItem[], newRotation?: number) {
    setIsSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/admin/tips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tips: newTips,
          rotationMinutes: newRotation ?? rotationMinutes,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.tipManager.saveFailed)
        return false
      }
      const data = await res.json()
      setTips(data.tips)
      setRotationMinutes(data.rotationMinutes)
      setSuccess(messages.tipManager.saveSuccess)
      setTimeout(() => setSuccess(""), 3000)
      return true
    } catch {
      setError(messages.tipManager.saveFailed)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  function startAdd() {
    setEditForm({ category: "", title: "", content: "" })
    setEditingIndex(-1)
    setError("")
  }

  function startEdit(index: number) {
    setEditForm({ ...tips[index] })
    setEditingIndex(index)
    setError("")
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditForm({ category: "", title: "", content: "" })
  }

  async function handleSaveEdit() {
    if (!editForm.category.trim() || !editForm.title.trim() || !editForm.content.trim()) {
      setError(messages.errors.invalidInput)
      return
    }
    const newTips = [...tips]
    if (editingIndex === -1) {
      newTips.push({ ...editForm })
    } else if (editingIndex !== null) {
      newTips[editingIndex] = { ...editForm }
    }
    const ok = await saveTips(newTips)
    if (ok) cancelEdit()
  }

  async function handleDelete(index: number) {
    if (!confirm(messages.tipManager.deleteConfirm)) return
    const newTips = tips.filter((_, i) => i !== index)
    await saveTips(newTips)
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= tips.length) return
    const newTips = [...tips]
    ;[newTips[index], newTips[newIndex]] = [newTips[newIndex], newTips[index]]
    await saveTips(newTips)
  }

  async function handleRotationSave() {
    await saveTips(tips, rotationMinutes)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {messages.common.loading}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">{messages.tipManager.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{messages.tipManager.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rotation interval */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <Label htmlFor="rotation-minutes" className="text-sm font-medium">
              {messages.tipManager.rotationInterval}
            </Label>
            <p className="text-xs text-muted-foreground">
              {messages.tipManager.rotationDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="rotation-minutes"
              type="number"
              min={1}
              value={rotationMinutes}
              onChange={(e) => setRotationMinutes(Math.max(1, Number(e.target.value) || 1))}
              className="h-8 w-24 text-right text-sm"
              disabled={isSaving}
            />
            <span className="text-sm text-muted-foreground">{messages.tipManager.rotationMinutes}</span>
            <Button size="sm" variant="outline" onClick={handleRotationSave} disabled={isSaving}>
              {messages.common.save}
            </Button>
          </div>
        </div>

        {/* Feedback messages */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {/* Add button + count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {tips.length}{messages.tipManager.tipCount}
          </p>
          <Button size="sm" onClick={startAdd} disabled={editingIndex !== null || isSaving}>
            <Plus className="mr-1 h-3 w-3" />
            {messages.tipManager.addTip}
          </Button>
        </div>

        {/* Add/Edit form (when adding new) */}
        {editingIndex === -1 && (
          <TipEditForm
            form={editForm}
            onChange={setEditForm}
            onSave={handleSaveEdit}
            onCancel={cancelEdit}
            isSaving={isSaving}
            isNew
          />
        )}

        {/* Tip list */}
        {tips.length === 0 && editingIndex !== -1 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {messages.tipManager.noTips}
          </p>
        )}
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div key={index}>
              {editingIndex === index ? (
                <TipEditForm
                  form={editForm}
                  onChange={setEditForm}
                  onSave={handleSaveEdit}
                  onCancel={cancelEdit}
                  isSaving={isSaving}
                  isNew={false}
                />
              ) : (
                <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0 || isSaving || editingIndex !== null}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      title={messages.tipManager.moveUp}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMove(index, "down")}
                      disabled={index === tips.length - 1 || isSaving || editingIndex !== null}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      title={messages.tipManager.moveDown}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        {tip.category}
                      </span>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium">{tip.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{tip.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => startEdit(index)}
                      disabled={isSaving || editingIndex !== null}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                      title={messages.tipManager.editTip}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      disabled={isSaving || editingIndex !== null}
                      className="rounded-md p-1.5 text-destructive/60 transition-colors hover:bg-destructive/10 disabled:opacity-30"
                      title={messages.tipManager.deleteTip}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TipEditForm({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isNew,
}: {
  form: TipItem
  onChange: (f: TipItem) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  isNew: boolean
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {isNew ? messages.tipManager.addTip : messages.tipManager.editTip}
        </p>
        <button onClick={onCancel} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="edit-category" className="text-xs">{messages.tipManager.categoryLabel}</Label>
          <Input
            id="edit-category"
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            placeholder={messages.dailyTip.categoryPlaceholder}
            disabled={isSaving}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-title" className="text-xs">{messages.tipManager.titleLabel}</Label>
          <Input
            id="edit-title"
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder={messages.dailyTip.titlePlaceholder}
            disabled={isSaving}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-content" className="text-xs">{messages.tipManager.contentLabel}</Label>
        <textarea
          id="edit-content"
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          placeholder={messages.dailyTip.contentPlaceholder}
          disabled={isSaving}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? messages.common.loading : messages.common.save}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {messages.common.cancel}
        </Button>
      </div>
    </div>
  )
}
