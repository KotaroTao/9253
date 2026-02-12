"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { TALLY_TYPE_LABELS } from "@/lib/constants"

interface TallyTapUIProps {
  staffName: string
  staffToken: string
}

const TALLY_ITEMS = [
  { type: "new_patient", color: "bg-blue-500", hoverColor: "hover:bg-blue-600", icon: "👤" },
  { type: "maintenance_transition", color: "bg-orange-500", hoverColor: "hover:bg-orange-600", icon: "🔄" },
  { type: "self_pay_proposal", color: "bg-purple-500", hoverColor: "hover:bg-purple-600", icon: "💬" },
  { type: "self_pay_conversion", color: "bg-green-500", hoverColor: "hover:bg-green-600", icon: "✅" },
] as const

export function TallyTapUI({ staffName, staffToken }: TallyTapUIProps) {
  const [tallies, setTallies] = useState<Record<string, number>>({
    new_patient: 0,
    maintenance_transition: 0,
    self_pay_proposal: 0,
    self_pay_conversion: 0,
  })
  const [loading, setLoading] = useState(true)
  const [tapping, setTapping] = useState<string | null>(null)
  const [lockedOut, setLockedOut] = useState(false)
  const [error, setError] = useState("")

  const fetchTallies = useCallback(async () => {
    try {
      const res = await fetch(`/api/tally?staffToken=${staffToken}`)
      if (res.ok) {
        setTallies(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [staffToken])

  useEffect(() => {
    fetchTallies()
  }, [fetchTallies])

  async function handleTap(type: string, delta: number) {
    // Prevent negative
    if (delta < 0 && (tallies[type] ?? 0) <= 0) return

    setTapping(type)
    setError("")

    // Optimistic update
    const prev = { ...tallies }
    setTallies((p) => ({
      ...p,
      [type]: Math.max(0, (p[type] ?? 0) + delta),
    }))

    try {
      const res = await fetch("/api/tally", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffToken, type, delta }),
      })
      if (res.ok) {
        setTallies(await res.json())
      } else {
        setTallies(prev)
        setError(messages.tally.tapError)
      }
    } catch {
      setTallies(prev)
      setError(messages.tally.tapError)
    } finally {
      setTapping(null)
    }
  }

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  function handleLogout() {
    setLockedOut(true)
  }

  function handleUnlock() {
    setLockedOut(false)
    fetchTallies()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{messages.common.loading}</p>
        </CardContent>
      </Card>
    )
  }

  if (lockedOut) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="text-4xl">🔒</div>
          <p className="text-sm text-muted-foreground">{messages.tally.loggedOut}</p>
          <Button variant="outline" onClick={handleUnlock}>
            {messages.tally.unlockButton}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center pb-3">
        <p className="text-sm text-muted-foreground">{staffName}</p>
        <CardTitle className="text-lg">{messages.tally.todayRecord}</CardTitle>
        <p className="text-xs text-muted-foreground">{today}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {TALLY_ITEMS.map((item) => {
          const count = tallies[item.type] ?? 0
          return (
            <div
              key={item.type}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">
                    {TALLY_TYPE_LABELS[item.type]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTap(item.type, -1)}
                  disabled={count <= 0 || tapping === item.type}
                  className="flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-10 text-center text-xl font-bold tabular-nums">
                  {count}
                </span>
                <button
                  onClick={() => handleTap(item.type, 1)}
                  disabled={tapping === item.type}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white transition-colors ${item.color} ${item.hoverColor} active:scale-95`}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-center text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleLogout}
          >
            {messages.common.logout}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
