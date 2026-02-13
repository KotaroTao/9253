"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Unlock, KeyRound } from "lucide-react"
import { messages } from "@/lib/messages"

interface AdminUnlockDialogProps {
  isAdminMode: boolean
  hasAdminPassword: boolean
  compact?: boolean
}

export function AdminUnlockDialog({ isAdminMode, hasAdminPassword, compact = false }: AdminUnlockDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

      setIsOpen(false)
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

  if (isAdminMode) {
    if (compact) {
      return (
        <button
          onClick={handleLock}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-primary transition-colors active:bg-muted"
        >
          <Unlock className="h-5 w-5" />
          <span className="text-[10px] font-medium">{messages.adminMode.active}</span>
        </button>
      )
    }
    return (
      <button
        onClick={handleLock}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Unlock className="h-4 w-4" />
        {messages.adminMode.lock}
      </button>
    )
  }

  if (!hasAdminPassword) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={compact
          ? "flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors active:bg-muted"
          : "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        }
      >
        <Lock className={compact ? "h-5 w-5" : "h-4 w-4"} />
        {compact
          ? <span className="text-[10px] font-medium">{messages.adminMode.unlock}</span>
          : messages.adminMode.unlock
        }
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{messages.adminMode.unlock}</h3>
                <p className="text-xs text-muted-foreground">{messages.adminMode.unlockDesc}</p>
              </div>
            </div>
            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={messages.adminMode.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setPassword(""); setError("") }}
                  className="flex-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {messages.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? messages.common.loading : messages.adminMode.unlockButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
