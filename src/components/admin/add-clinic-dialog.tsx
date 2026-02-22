"use client"

import { useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import { messages } from "@/lib/messages"
import { PLANS, ALL_PLAN_TIERS } from "@/lib/constants"
import type { PlanTier } from "@/types"

interface AddClinicDialogProps {
  onCreated?: () => void
}

export function AddClinicDialog({ onCreated }: AddClinicDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [plan, setPlan] = useState<PlanTier>("free")

  function handleNameChange(value: string) {
    setName(value)
    // スラッグ自動生成（手動で変更されていない場合）
    const auto = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
    setSlug(auto)
  }

  function resetForm() {
    setName("")
    setSlug("")
    setAdminEmail("")
    setAdminPassword("")
    setPlan("free")
    setError(null)
    setSuccess(false)
  }

  function handleClose() {
    setOpen(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const res = await fetch("/api/admin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, adminEmail, adminPassword, plan }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "作成に失敗しました")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        handleClose()
        onCreated?.()
      }, 1000)
    } catch {
      setError("通信エラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  const m = messages.admin

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        {m.addClinic}
      </button>

      {/* Backdrop + Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{m.addClinic}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* クリニック名 */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.clinicName}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="例: さくら歯科クリニック"
                />
              </div>

              {/* スラッグ */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.clinicSlug}</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">/s/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="sakura-dental"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.clinicSlugHint}</p>
              </div>

              {/* 管理者メール */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.adminEmail}</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="admin@sakura-dental.com"
                />
              </div>

              {/* 管理者パスワード */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.adminPassword}</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="6文字以上"
                />
              </div>

              {/* プラン */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{m.planLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PLAN_TIERS.map((tier) => {
                    const p = PLANS[tier]
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setPlan(tier)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          plan === tier
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:border-muted-foreground/30"
                        }`}
                      >
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.priceLabel}{p.priceNote}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {m.addSuccess}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {messages.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving || success}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {m.addClinicSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
