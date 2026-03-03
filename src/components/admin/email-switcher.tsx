"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, X, Mail, Pencil, Check } from "lucide-react"
import { messages } from "@/lib/messages"

interface AdminUser {
  id: string
  name: string
  email: string
  isActive: boolean
}

interface EmailSwitcherProps {
  clinicId: string
  clinicName: string
  ownerUserId?: string | null
  onClose: () => void
  onUpdated?: (email: string) => void
}

export function EmailSwitcher({ clinicId, clinicName, ownerUserId, onClose, onUpdated }: EmailSwitcherProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ id: string; email: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const res = await fetch(`/api/admin/clinics/${clinicId}/email`)
        if (res.ok) {
          const data = await res.json()
          setAdmins(data.admins)
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || messages.admin.fetchError)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAdmins()
  }, [clinicId])

  function startEdit(admin: AdminUser) {
    setEditing({ id: admin.id, email: admin.email })
    setError(null)
    setSuccess(null)
  }

  function cancelEdit() {
    setEditing(null)
    setError(null)
  }

  async function handleSave(userId: string) {
    if (!editing) return
    const trimmed = editing.email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes("@")) {
      setError(messages.auth.emailRequired)
      return
    }

    const currentAdmin = admins.find((a) => a.id === userId)
    if (currentAdmin?.email === trimmed) {
      cancelEdit()
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setAdmins((prev) =>
          prev.map((a) => (a.id === userId ? { ...a, email: data.email } : a))
        )
        setEditing(null)
        setSuccess(messages.admin.emailChangeSuccess)
        // オーナーのメールが変更された場合のみ親に通知
        if (userId === ownerUserId) {
          onUpdated?.(data.email)
        }
        successTimerRef.current = setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || messages.common.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Mail className="h-4 w-4 text-sky-500" />
            {messages.admin.emailManagement}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">{clinicName}</p>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : admins.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {messages.admin.noAdminUsers}
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{admin.name}</span>
                      {!admin.isActive && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          {messages.admin.inactive}
                        </span>
                      )}
                    </div>
                  </div>
                  {editing?.id !== admin.id && (
                    <button
                      type="button"
                      onClick={() => startEdit(admin)}
                      className="ml-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={messages.admin.emailChangeTitle}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {editing?.id === admin.id ? (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={editing.email}
                        onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                        className="flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-300"
                        placeholder="email@example.com"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(admin.id)
                          if (e.key === "Escape") cancelEdit()
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSave(admin.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                      >
                        {messages.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{admin.email}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {success && <p className="mt-2 text-xs text-emerald-600">{success}</p>}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            {messages.common.close}
          </button>
        </div>
      </div>
    </div>
  )
}
