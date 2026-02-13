"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { TALLY_TYPE_LABELS } from "@/lib/constants"
import { Undo2, Check } from "lucide-react"

interface TallyTapUIProps {
  staffName: string
  staffToken: string
}

interface UndoAction {
  type: string
  delta: number
  label: string
}

const TALLY_ITEMS = [
  { type: "new_patient", color: "bg-blue-500", hoverColor: "hover:bg-blue-600", flashColor: "bg-blue-100", icon: "👤" },
  { type: "maintenance_transition", color: "bg-orange-500", hoverColor: "hover:bg-orange-600", flashColor: "bg-orange-100", icon: "🔄" },
  { type: "self_pay_proposal", color: "bg-purple-500", hoverColor: "hover:bg-purple-600", flashColor: "bg-purple-100", icon: "💬" },
  { type: "self_pay_conversion", color: "bg-green-500", hoverColor: "hover:bg-green-600", flashColor: "bg-green-100", icon: "✅" },
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
  const [flashType, setFlashType] = useState<string | null>(null)
  const [lockedOut, setLockedOut] = useState(false)
  const [error, setError] = useState("")
  const [lastAction, setLastAction] = useState<UndoAction | null>(null)

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

  // Auto-clear undo after 10 seconds
  useEffect(() => {
    if (!lastAction) return
    const timer = setTimeout(() => setLastAction(null), 10000)
    return () => clearTimeout(timer)
  }, [lastAction])

  // Auto-clear flash
  useEffect(() => {
    if (!flashType) return
    const timer = setTimeout(() => setFlashType(null), 600)
    return () => clearTimeout(timer)
  }, [flashType])

  async function handleTap(type: string, delta: number, isUndo = false) {
    if (delta < 0 && (tallies[type] ?? 0) <= 0) return

    setTapping(type)
    setError("")

    // Positive tap: show flash feedback
    if (delta > 0) setFlashType(type)

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
        if (!isUndo) {
          setLastAction({
            type,
            delta,
            label: TALLY_TYPE_LABELS[type] ?? type,
          })
        }
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

  async function handleUndo() {
    if (!lastAction) return
    const action = lastAction
    setLastAction(null)
    await handleTap(action.type, -action.delta, true)
  }

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  const totalToday = Object.values(tallies).reduce((sum, v) => sum + v, 0)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <Button variant="outline" onClick={() => { setLockedOut(false); fetchTallies() }}>
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
          const isFlashing = flashType === item.type
          return (
            <div
              key={item.type}
              className={`flex items-center gap-3 rounded-xl border p-4 transition-colors duration-300 ${isFlashing ? item.flashColor : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">
                    {TALLY_TYPE_LABELS[item.type]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTap(item.type, -1)}
                  disabled={count <= 0 || tapping === item.type}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold text-muted-foreground transition-all hover:bg-muted active:scale-90 disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-12 text-center text-2xl font-bold tabular-nums">
                  {count}
                </span>
                <button
                  onClick={() => handleTap(item.type, 1)}
                  disabled={tapping === item.type}
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white shadow-sm transition-all ${item.color} ${item.hoverColor} active:scale-90`}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}

        {/* Summary */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">合計</span>
          <span className="text-lg font-bold tabular-nums">{totalToday}</span>
        </div>

        {lastAction && (
          <button
            onClick={handleUndo}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed p-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {messages.tally.undo}: {lastAction.label} {lastAction.delta > 0 ? "+1" : "-1"}
          </button>
        )}

        {flashType && (
          <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-green-600">
            <Check className="h-3.5 w-3.5" />
            {messages.tally.recorded}
          </div>
        )}

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
            onClick={() => setLockedOut(true)}
          >
            {messages.common.logout}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
