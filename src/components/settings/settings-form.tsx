"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { CalendarOff, MessageCircle, ExternalLink, Info, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClinicSettings } from "@/types"

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const

type PostSurveyAction = NonNullable<ClinicSettings["postSurveyAction"]>

const POST_SURVEY_OPTIONS: { value: PostSurveyAction; label: string; desc: string; icon: string }[] = [
  { value: "none", label: messages.settings.postSurveyNone, desc: messages.settings.postSurveyNoneDesc, icon: "✅" },
  { value: "google_review", label: messages.settings.postSurveyGoogleReview, desc: messages.settings.postSurveyGoogleReviewDesc, icon: "⭐" },
  { value: "line", label: messages.settings.postSurveyLine, desc: messages.settings.postSurveyLineDesc, icon: "💬" },
]

interface SettingsFormProps {
  clinic: {
    id: string
    name: string
  }
  regularClosedDays?: number[]
  postSurveyAction?: PostSurveyAction
  googleReviewUrl?: string
  lineUrl?: string
  clinicHomepageUrl?: string
}

export function SettingsForm({
  clinic,
  regularClosedDays = [],
  postSurveyAction: initialAction = "none",
  googleReviewUrl: initialGoogleUrl = "",
  lineUrl: initialLineUrl = "",
  clinicHomepageUrl: initialHomepageUrl = "",
}: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(clinic.name)
  const [closedDays, setClosedDays] = useState<number[]>(regularClosedDays)
  const [action, setAction] = useState<PostSurveyAction>(initialAction)
  const [googleUrl, setGoogleUrl] = useState(initialGoogleUrl)
  const [lineUrl, setLineUrl] = useState(initialLineUrl)
  const [homepageUrl, setHomepageUrl] = useState(initialHomepageUrl)
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
      const body = {
        name,
        regularClosedDays: closedDays,
        postSurveyAction: action,
        googleReviewUrl: googleUrl,
        lineUrl,
        clinicHomepageUrl: homepageUrl,
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

      {/* アンケート完了後の誘導設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-base">{messages.settings.postSurveyTitle}</CardTitle>
              <CardDescription>{messages.settings.postSurveyDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 3択ラジオ */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{messages.settings.postSurveyActionLabel}</Label>
            <div className="space-y-2">
              {POST_SURVEY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setAction(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all disabled:opacity-50",
                    action === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/30"
                  )}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border-2",
                    action === opt.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}>
                    {action === opt.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Google口コミURL入力 */}
          {action === "google_review" && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3">
              <Label htmlFor="googleReviewUrl">{messages.settings.googleReviewUrlLabel}</Label>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="googleReviewUrl"
                  type="url"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder={messages.settings.googleReviewUrlPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* LINE URL入力 */}
          {action === "line" && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3">
              <Label htmlFor="lineUrl">{messages.settings.lineUrlLabel}</Label>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  id="lineUrl"
                  type="url"
                  value={lineUrl}
                  onChange={(e) => setLineUrl(e.target.value)}
                  placeholder={messages.settings.lineUrlPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* コンプライアンス注記 */}
          {action !== "none" && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs text-blue-800">
                {messages.settings.complianceNote}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 医院ホームページ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-teal-500" />
            <div>
              <CardTitle className="text-base">{messages.settings.clinicHomepageTitle}</CardTitle>
              <CardDescription>{messages.settings.clinicHomepageDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="clinicHomepageUrl">{messages.settings.clinicHomepageUrlLabel}</Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                id="clinicHomepageUrl"
                type="url"
                value={homepageUrl}
                onChange={(e) => setHomepageUrl(e.target.value)}
                placeholder={messages.settings.clinicHomepageUrlPlaceholder}
                disabled={isLoading}
              />
            </div>
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
