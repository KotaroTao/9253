"use client"

import { useState, useEffect } from "react"
import { Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

const PIN_RE = /^\d{4}$/
const SESSION_KEY = "metricsUnlocked"
const m = messages.metricsPin

interface MetricsPinLockProps {
  children: React.ReactNode
}

export function MetricsPinLock({ children }: MetricsPinLockProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true)
    }
  }, [])

  async function handleUnlock() {
    if (!PIN_RE.test(pin)) {
      setError(m.pinInvalid)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/settings/metrics-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || m.wrongPin)
        setPin("")
        return
      }

      sessionStorage.setItem(SESSION_KEY, "1")
      setUnlocked(true)
    } catch {
      setError(messages.common.error)
    } finally {
      setLoading(false)
    }
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
          <Lock className="h-7 w-7 text-violet-600" />
        </div>
        <h2 className="text-lg font-bold">{m.lockTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{m.lockDesc}</p>

        <div className="mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setError(null)
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUnlock()
            }}
            placeholder={m.pinPlaceholder}
            className="mx-auto block w-40 rounded-lg border bg-background px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleUnlock}
            disabled={loading || pin.length < 4}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {m.unlockButton}
          </Button>
        </div>
      </div>
    </div>
  )
}
