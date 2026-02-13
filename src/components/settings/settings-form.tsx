"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { Shield, Check } from "lucide-react"

interface SettingsFormProps {
  clinic: {
    id: string
    name: string
  }
  hasAdminPassword?: boolean
}

export function SettingsForm({ clinic, hasAdminPassword = false }: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(clinic.name)
  const [adminPassword, setAdminPassword] = useState("")
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSaved(false)

    try {
      const body: Record<string, string> = { name }
      if (adminPassword.length >= 6) {
        body.adminPassword = adminPassword
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
      setAdminPassword("")
      setShowPasswordField(false)
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
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{messages.settings.adminPassword}</CardTitle>
              <CardDescription>{messages.settings.adminPasswordDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAdminPassword && !showPasswordField ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {messages.settings.adminPasswordSet}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordField(true)}
              >
                {messages.settings.adminPasswordChange}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="adminPassword">
                {hasAdminPassword ? messages.settings.adminPasswordChange : messages.settings.adminPasswordNew}
              </Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder={messages.settings.adminPasswordPlaceholder}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={isLoading}
              />
              {showPasswordField && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowPasswordField(false); setAdminPassword("") }}
                >
                  {messages.common.cancel}
                </Button>
              )}
            </div>
          )}
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
