"use client"

import { useState } from "react"
import { Lock, Check, Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

const PIN_RE = /^\d{4}$/
const m = messages.metricsPin

interface MetricsPinSettingsProps {
  hasPin: boolean
}

export function MetricsPinSettings({ hasPin: initialHasPin }: MetricsPinSettingsProps) {
  const [hasPin, setHasPin] = useState(initialHasPin)
  const [mode, setMode] = useState<"idle" | "set" | "change" | "remove">("idle")
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function reset() {
    setMode("idle")
    setCurrentPin("")
    setNewPin("")
    setConfirmPin("")
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (mode === "set") {
      if (!PIN_RE.test(newPin)) {
        setError(m.pinInvalid)
        return
      }
      if (newPin !== confirmPin) {
        setError(m.pinMismatch)
        return
      }
    } else if (mode === "change") {
      if (!PIN_RE.test(currentPin)) {
        setError(m.pinInvalid)
        return
      }
      if (!PIN_RE.test(newPin)) {
        setError(m.pinInvalid)
        return
      }
      if (newPin !== confirmPin) {
        setError(m.pinMismatch)
        return
      }
    } else if (mode === "remove") {
      if (!PIN_RE.test(currentPin)) {
        setError(m.pinInvalid)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/metrics-pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          currentPin: currentPin || undefined,
          newPin: newPin || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.common.error)
        return
      }

      if (mode === "set") {
        setSuccess(m.pinSet)
        setHasPin(true)
      } else if (mode === "change") {
        setSuccess(m.pinChanged)
      } else if (mode === "remove") {
        setSuccess(m.pinRemoved)
        setHasPin(false)
      }

      setTimeout(reset, 1500)
    } catch {
      setError(messages.common.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-violet-500" />
          <div className="flex-1">
            <CardTitle className="text-base">{m.title}</CardTitle>
            <CardDescription>{m.desc}</CardDescription>
          </div>
          {hasPin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
              <ShieldCheck className="h-3 w-3" />
              {m.status}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <ShieldOff className="h-3 w-3" />
              {m.statusNone}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {mode === "idle" && (
          <div className="flex gap-2">
            {!hasPin ? (
              <Button size="sm" variant="default" onClick={() => setMode("set")}>
                {m.setPinButton}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setMode("change")}>
                  {m.changePinButton}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode("remove")}>
                  {m.removePinButton}
                </Button>
              </>
            )}
          </div>
        )}

        {mode !== "idle" && (
          <div className="space-y-3">
            {/* 現在のPIN（変更・解除時） */}
            {(mode === "change" || mode === "remove") && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium shrink-0">{m.currentPinLabel}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={m.pinPlaceholder}
                  className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
            )}

            {/* 新しいPIN（設定・変更時） */}
            {(mode === "set" || mode === "change") && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium shrink-0">{m.newPinLabel}</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder={m.pinPlaceholder}
                    className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus={mode === "set"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium shrink-0">{m.confirmPinLabel}</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder={m.pinPlaceholder}
                    className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="inline-flex items-center gap-1.5 text-sm text-green-600">
                <Check className="h-3.5 w-3.5" />
                {success}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {messages.common.save}
              </Button>
              <Button size="sm" variant="outline" onClick={reset} disabled={saving}>
                {messages.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
