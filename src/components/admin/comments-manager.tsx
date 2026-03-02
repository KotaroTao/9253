"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, RotateCcw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { MESSAGE_CATEGORIES } from "@/lib/dynamic-messages"
import type { StoredComment } from "@/lib/dynamic-messages"

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  goalAchieved: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  almostGoal: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  todayZero: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
  streak: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  highScore: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  lowScore: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  morning: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  evening: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  generic: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
}

function getCategoryLabel(key: string): string {
  const cat = MESSAGE_CATEGORIES.find((c) => c.key === key)
  return cat?.label ?? key
}

function getCategoryColor(key: string) {
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.generic
}

export function CommentsManager() {
  const [comments, setComments] = useState<StoredComment[]>([])
  const [isCustom, setIsCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<StoredComment>({ category: "generic", text: "" })
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // Auto-clear success message with cleanup
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(""), 3000)
    return () => clearTimeout(timer)
  }, [success])

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/comments")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setComments(data.comments ?? [])
      setIsCustom(data.isCustom ?? false)
    } catch {
      setError(messages.commentsManager.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  async function sendCommentsRequest(body: object): Promise<boolean> {
    setIsSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/admin/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.commentsManager.saveFailed)
        return false
      }
      const data = await res.json()
      setComments(data.comments)
      setIsCustom(data.isCustom)
      setSuccess(messages.commentsManager.saveSuccess)
      return true
    } catch {
      setError(messages.commentsManager.saveFailed)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function saveComments(newComments: StoredComment[]) {
    return sendCommentsRequest({ comments: newComments })
  }

  async function handleResetToDefaults() {
    if (!confirm(messages.commentsManager.resetConfirm)) return
    await sendCommentsRequest({ resetToDefaults: true })
  }

  function startAdd() {
    setEditForm({ category: filterCategory !== "all" ? filterCategory : "generic", text: "" })
    setEditingIndex(-1)
    setError("")
  }

  function startEdit(index: number) {
    setEditForm({ ...comments[index] })
    setEditingIndex(index)
    setError("")
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditForm({ category: "generic", text: "" })
  }

  async function handleSaveEdit() {
    if (!editForm.text.trim()) {
      setError(messages.errors.invalidInput)
      return
    }
    const newComments = [...comments]
    if (editingIndex === -1) {
      newComments.push({ ...editForm })
    } else if (editingIndex !== null) {
      newComments[editingIndex] = { ...editForm }
    }
    const ok = await saveComments(newComments)
    if (ok) cancelEdit()
  }

  async function handleDelete(index: number) {
    if (!confirm(messages.commentsManager.deleteConfirm)) return
    const newComments = comments.filter((_, i) => i !== index)
    await saveComments(newComments)
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= comments.length) return
    const newComments = [...comments]
    ;[newComments[index], newComments[newIndex]] = [newComments[newIndex], newComments[index]]
    await saveComments(newComments)
  }

  // Category counts for filter badges
  const categoryCounts = comments.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1
    return acc
  }, {})

  const filteredComments = filterCategory === "all"
    ? comments
    : comments.filter((c) => c.category === filterCategory)

  // Map from filtered index to original index
  const filteredIndices = filterCategory === "all"
    ? comments.map((_, i) => i)
    : comments.reduce<number[]>((acc, c, i) => {
        if (c.category === filterCategory) acc.push(i)
        return acc
      }, [])

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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{messages.commentsManager.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{messages.commentsManager.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isCustom ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600"}`}>
              {isCustom ? messages.commentsManager.usingCustom : messages.commentsManager.usingDefaults}
            </span>
            {isCustom && (
              <Button size="sm" variant="outline" onClick={handleResetToDefaults} disabled={isSaving}>
                <RotateCcw className="mr-1 h-3 w-3" />
                {messages.commentsManager.resetToDefaults}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feedback messages */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              filterCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            すべて ({comments.length})
          </button>
          {MESSAGE_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.key] ?? 0
            const color = getCategoryColor(cat.key)
            return (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterCategory === cat.key
                    ? `${color.bg} ${color.text}`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Add button + count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filterCategory === "all"
              ? `${comments.length}${messages.commentsManager.commentCount}`
              : `${filteredComments.length}${messages.commentsManager.commentCount}（${getCategoryLabel(filterCategory)}）`}
          </p>
          <Button size="sm" onClick={startAdd} disabled={editingIndex !== null || isSaving}>
            <Plus className="mr-1 h-3 w-3" />
            {messages.commentsManager.addComment}
          </Button>
        </div>

        {/* Add form (when adding new) */}
        {editingIndex === -1 && (
          <CommentEditForm
            form={editForm}
            onChange={setEditForm}
            onSave={handleSaveEdit}
            onCancel={cancelEdit}
            isSaving={isSaving}
            isNew
          />
        )}

        {/* Comment list */}
        {filteredComments.length === 0 && editingIndex !== -1 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {messages.commentsManager.noComments}
          </p>
        )}
        <div className="space-y-2">
          {filteredComments.map((comment, filteredIdx) => {
            const originalIndex = filteredIndices[filteredIdx]
            const color = getCategoryColor(comment.category)
            return (
              <div key={originalIndex}>
                {editingIndex === originalIndex ? (
                  <CommentEditForm
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
                        onClick={() => handleMove(originalIndex, "up")}
                        disabled={originalIndex === 0 || isSaving || editingIndex !== null}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                        title={messages.commentsManager.moveUp}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleMove(originalIndex, "down")}
                        disabled={originalIndex === comments.length - 1 || isSaving || editingIndex !== null}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                        title={messages.commentsManager.moveDown}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color.bg} ${color.text}`}>
                          {getCategoryLabel(comment.category)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{comment.text}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => startEdit(originalIndex)}
                        disabled={isSaving || editingIndex !== null}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                        title={messages.commentsManager.editComment}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(originalIndex)}
                        disabled={isSaving || editingIndex !== null}
                        className="rounded-md p-1.5 text-destructive/60 transition-colors hover:bg-destructive/10 disabled:opacity-30"
                        title={messages.commentsManager.deleteComment}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function CommentEditForm({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isNew,
}: {
  form: StoredComment
  onChange: (f: StoredComment) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  isNew: boolean
}) {
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {isNew ? messages.commentsManager.addComment : messages.commentsManager.editComment}
        </p>
        <button onClick={onCancel} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-category" className="text-xs">{messages.commentsManager.categoryLabel}</Label>
        <select
          id="edit-category"
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
          disabled={isSaving}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {MESSAGE_CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-text" className="text-xs">{messages.commentsManager.textLabel}</Label>
        <textarea
          id="edit-text"
          value={form.text}
          onChange={(e) => onChange({ ...form, text: e.target.value })}
          placeholder={messages.commentsManager.textPlaceholder}
          disabled={isSaving}
          rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          <Check className="mr-1 h-3 w-3" />
          {isSaving ? messages.common.loading : messages.common.save}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          {messages.common.cancel}
        </Button>
      </div>
    </div>
  )
}
