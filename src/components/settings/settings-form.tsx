"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { CalendarOff } from "lucide-react"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const

interface SettingsFormProps {
  clinic: {
    id: string
    name: string
  }
  regularClosedDays?: number[]
}

export function SettingsForm({ clinic, regularClosedDays = [] }: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(clinic.name)
  const [closedDays, setClosedDays] = useState<number[]>(regularClosedDays)
  const [isLoading, setIsLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function handleToggleClosedDay(day: number) {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSaved(false)

    try {
      const body: Record<string, string | number | number[]> = {
        name,
        regularClosedDays: closedDays,
      }

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.common.error)
        return
      }

      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {messages.settings.clinicInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">{messages.settings.clinicName}</Label>
            <Input
              id="clinicName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalendarOff className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle className="text-base">{messages.settings.regularClosedDaysLabel}</CardTitle>
              <CardDescription>{messages.settings.regularClosedDaysDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleToggleClosedDay(idx)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors disabled:opacity-50",
                  closedDays.includes(idx)
                    ? "bg-orange-100 text-orange-600 ring-2 ring-orange-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {messages.settings.surveySettings}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {messages.settings.customQuestionsNote}
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? messages.common.loading : messages.common.save}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">{messages.common.saved}</span>
        )}
      </div>
    </form>
  )
}
