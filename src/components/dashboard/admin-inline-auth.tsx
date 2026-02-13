"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Unlock, KeyRound, Check, ChevronDown, ChevronUp } from "lucide-react"
import { messages } from "@/lib/messages"

interface AdminInlineAuthProps {
  isAdminMode: boolean
  hasAdminPassword: boolean
}

export function AdminInlineAuth({ isAdminMode, hasAdminPassword }: AdminInlineAuthProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Password change state
  const [showChange, setShowChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [changeError, setChangeError] = useState("")
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        return
      }

      setPassword("")
      router.refresh()
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLock() {
    await fetch("/api/admin-mode", { method: "DELETE" })
    router.refresh()
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsChanging(true)
    setChangeError("")
    setChangeSuccess(false)

    try {
      const res = await fetch("/api/admin-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!res.ok) {
        const body = await res.json()
        setChangeError(body.error || messages.adminMode.passwordChangeError)
        return
      }

      setChangeSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => {
        setChangeSuccess(false)
        setShowChange(false)
      }, 2000)
    } catch {
      setChangeError(messages.adminMode.passwordChangeError)
    } finally {
      setIsChanging(false)
    }
  }

  if (isAdminMode) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <Unlock className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-emerald-700">{messages.adminMode.active}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChange(!showChange)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {messages.adminMode.changePassword}
              {showChange ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              onClick={handleLock}
              className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              {messages.adminMode.lock}
            </button>
          </div>
        </div>

        {showChange && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="password"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={messages.adminMode.currentPassword}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={messages.adminMode.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {changeError && <p className="text-sm text-destructive">{changeError}</p>}
            {changeSuccess && (
              <p className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                {messages.adminMode.passwordChanged}
              </p>
            )}
            <button
              type="submit"
              disabled={isChanging || !currentPassword || !newPassword}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isChanging ? messages.common.loading : messages.common.save}
            </button>
          </form>
        )}
      </div>
    )
  }

  // Not admin mode: show password input
  return (
    <div className="rounded-xl border border-muted bg-muted/30 p-5">
      <form onSubmit={handleUnlock} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">{messages.adminMode.unlock}</span>
        </div>
        <div className="flex flex-1 gap-2">
          <input
            type="password"
            className="flex h-9 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={messages.adminMode.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading || !password}
            className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? messages.common.loading : messages.adminMode.unlockButton}
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!hasAdminPassword && (
          <p className="text-xs text-muted-foreground">{messages.adminMode.defaultHint}</p>
        )}
      </form>
    </div>
  )
}
