"use client"

import { useState } from "react"
import { Loader2, X, Check } from "lucide-react"
import { messages } from "@/lib/messages"
import { PLANS } from "@/lib/constants"
import type { PlanTier } from "@/types"

interface PlanSwitcherProps {
  clinicId: string
  clinicName: string
  currentPlan: PlanTier
  onClose: () => void
  onUpdated?: (newPlan: PlanTier) => void
}

export function PlanSwitcher({ clinicId, clinicName, currentPlan, onClose, onUpdated }: PlanSwitcherProps) {
  const [selected, setSelected] = useState<PlanTier>(currentPlan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const m = messages.admin

  async function handleSave() {
    if (selected === currentPlan) {
      onClose()
      return
    }

    setError(null)
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "更新に失敗しました")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onUpdated?.(selected)
        onClose()
      }, 800)
    } catch {
      setError("通信エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{m.planSwitch}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{clinicName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plan options */}
        <div className="px-6 py-5 space-y-2">
          {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
            const p = PLANS[tier]
            const isCurrent = tier === currentPlan
            const isSelected = tier === selected
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelected(tier)}
                className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-muted-foreground/30"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    {isCurrent && (
                      <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                        {m.currentPlan}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.priceLabel}{p.priceNote}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            )
          })}

          {/* Error / Success */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              {m.planSwitchSuccess}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {messages.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || success || selected === currentPlan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {m.planSwitchSubmit}
          </button>
        </div>
      </div>
    </div>
  )
}
