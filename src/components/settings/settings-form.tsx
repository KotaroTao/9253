"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays } from "lucide-react"

interface SettingsFormProps {
  clinic: {
    id: string
    name: string
  }
  workingDaysPerWeek?: number
}

export function SettingsForm({ clinic, workingDaysPerWeek = 6 }: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(clinic.name)
  const [workingDays, setWorkingDays] = useState(String(workingDaysPerWeek))
  const [isLoading, setIsLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSaved(false)

    try {
      const body: Record<string, string | number> = { name, workingDaysPerWeek: Number(workingDays) }

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
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{messages.settings.workingDaysLabel}</CardTitle>
              <CardDescription>{messages.settings.workingDaysDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={workingDays} onValueChange={setWorkingDays} disabled={isLoading}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 6, 7].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}{messages.settings.workingDaysSuffix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
