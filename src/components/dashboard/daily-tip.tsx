"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lightbulb, Pencil, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"

export type DailyTipData = {
  category: string
  title: string
  content: string
}

interface DailyTipProps {
  tip: DailyTipData
  canEdit?: boolean
  isCustom?: boolean
}

export function DailyTip({ tip, canEdit = false, isCustom = false }: DailyTipProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [category, setCategory] = useState(tip.category)
  const [title, setTitle] = useState(tip.title)
  const [content, setContent] = useState(tip.content)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function openEdit() {
    setCategory(tip.category)
    setTitle(tip.title)
    setContent(tip.content)
    setError("")
    setEditing(true)
  }

  async function handleSave() {
    if (!category.trim() || !title.trim() || !content.trim()) {
      setError(messages.errors.invalidInput)
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/daily-tip", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTip: {
            category: category.trim(),
            title: title.trim(),
            content: content.trim(),
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.common.error)
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReset() {
    if (!confirm(messages.dailyTip.resetConfirm)) return
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/daily-tip", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyTip: null }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.common.error)
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Lightbulb className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-amber-700">
              {messages.dailyTip.editTitle}
            </p>
          </div>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tip-category" className="text-xs">{messages.dailyTip.category}</Label>
            <Input
              id="tip-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={messages.dailyTip.categoryPlaceholder}
              disabled={isLoading}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tip-title" className="text-xs">{messages.dailyTip.title}</Label>
            <Input
              id="tip-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={messages.dailyTip.titlePlaceholder}
              disabled={isLoading}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tip-content" className="text-xs">{messages.dailyTip.content}</Label>
            <textarea
              id="tip-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={messages.dailyTip.contentPlaceholder}
              disabled={isLoading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              {isLoading ? messages.common.loading : messages.common.save}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={isLoading}>
              {messages.common.cancel}
            </Button>
            {isCustom && (
              <Button size="sm" variant="ghost" onClick={handleReset} disabled={isLoading} className="ml-auto text-muted-foreground">
                <RotateCcw className="mr-1 h-3 w-3" />
                {messages.dailyTip.resetToDefault}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-white px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-amber-700">
              {messages.dailyTip.label}
            </p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              {tip.category}
            </span>
            {isCustom && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                {messages.dailyTip.customTipActive}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-bold text-gray-900">{tip.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
            {tip.content}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openEdit}
            className="mt-0.5 shrink-0 rounded-md p-1.5 text-amber-500 transition-colors hover:bg-amber-100"
            title={messages.dailyTip.editTitle}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
