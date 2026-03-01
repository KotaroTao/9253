"use client"

import { useState, useEffect } from "react"
import { Loader2, X, Crown } from "lucide-react"

interface Admin {
  id: string
  name: string
  email: string
}

interface OwnerSwitcherProps {
  clinicId: string
  clinicName: string
  onClose: () => void
  onUpdated?: (name: string) => void
}

export function OwnerSwitcher({ clinicId, clinicName, onClose, onUpdated }: OwnerSwitcherProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOwnerData() {
      try {
        const res = await fetch(`/api/admin/clinics/${clinicId}/owner`)
        if (res.ok) {
          const data = await res.json()
          setAdmins(data.data.admins)
          setCurrentOwnerId(data.data.owner?.id ?? null)
          setSelected(data.data.owner?.id ?? null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchOwnerData()
  }, [clinicId])

  async function handleSave() {
    if (!selected || selected === currentOwnerId) {
      onClose()
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerUserId: selected }),
      })
      if (res.ok) {
        const admin = admins.find((a) => a.id === selected)
        onUpdated?.(admin?.name ?? "")
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || "エラーが発生しました")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-500" />
            オーナー変更
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-3">{clinicName}</p>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            管理者ユーザーがいません
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {admins.map((admin) => (
              <button
                key={admin.id}
                type="button"
                onClick={() => setSelected(admin.id)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  selected === admin.id
                    ? "border-amber-400 bg-amber-50"
                    : "border-muted hover:border-amber-200"
                }`}
              >
                <div className="font-medium">{admin.name}</div>
                <div className="text-xs text-muted-foreground">{admin.email}</div>
                {admin.id === currentOwnerId && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    <Crown className="h-2.5 w-2.5" />
                    現在のオーナー
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selected || selected === currentOwnerId}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {saving && <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />}
            変更
          </button>
        </div>
      </div>
    </div>
  )
}
