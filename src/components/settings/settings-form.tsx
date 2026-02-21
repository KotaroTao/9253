"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { CalendarOff, MessageCircle, ExternalLink, Info, Globe, Check, Loader2 } from "lucide-react"
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

type SaveStatus = "idle" | "saving" | "saved" | "error"

function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const markSaving = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus("saving")
    setErrorMsg("")
  }, [])

  const markSaved = useCallback(() => {
    setStatus("saved")
    timerRef.current = setTimeout(() => setStatus("idle"), 2000)
  }, [])

  const markError = useCallback((msg: string) => {
    setStatus("error")
    setErrorMsg(msg)
  }, [])

  return { status, errorMsg, markSaving, markSaved, markError }
}

function SaveIndicator({ status, errorMsg }: { status: SaveStatus; errorMsg: string }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {messages.common.loading}
      </span>
    )
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
        <Check className="h-3 w-3" />
        {messages.common.saved}
      </span>
    )
  }
  if (status === "error") {
    return <span className="text-xs text-destructive">{errorMsg}</span>
  }
  return null
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

  const clinicNameSave = useSaveStatus()
  const closedDaysSave = useSaveStatus()
  const postSurveySave = useSaveStatus()
  const homepageSave = useSaveStatus()

  const savePartial = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || messages.common.error)
    }
    router.refresh()
  }, [router])

  // 定休日: 即時保存
  async function handleToggleClosedDay(day: number) {
    const next = closedDays.includes(day)
      ? closedDays.filter((d) => d !== day)
      : [...closedDays, day]
    setClosedDays(next)
    closedDaysSave.markSaving()
    try {
      await savePartial({ regularClosedDays: next })
      closedDaysSave.markSaved()
    } catch (err) {
      // revert
      setClosedDays(closedDays)
      closedDaysSave.markError(err instanceof Error ? err.message : messages.common.error)
    }
  }

  // 誘導先ラジオ: 即時保存
  async function handleActionChange(value: PostSurveyAction) {
    const prev = action
    setAction(value)
    postSurveySave.markSaving()
    try {
      await savePartial({ postSurveyAction: value })
      postSurveySave.markSaved()
    } catch (err) {
      setAction(prev)
      postSurveySave.markError(err instanceof Error ? err.message : messages.common.error)
    }
  }

  // クリニック名: カード内保存
  async function handleSaveName() {
    clinicNameSave.markSaving()
    try {
      await savePartial({ name })
      clinicNameSave.markSaved()
    } catch (err) {
      clinicNameSave.markError(err instanceof Error ? err.message : messages.common.error)
    }
  }

  // 誘導URL: カード内保存
  async function handleSavePostSurveyUrls() {
    postSurveySave.markSaving()
    try {
      await savePartial({
        postSurveyAction: action,
        googleReviewUrl: googleUrl,
        lineUrl,
      })
      postSurveySave.markSaved()
    } catch (err) {
      postSurveySave.markError(err instanceof Error ? err.message : messages.common.error)
    }
  }

  // ホームページURL: カード内保存
  async function handleSaveHomepage() {
    homepageSave.markSaving()
    try {
      await savePartial({ clinicHomepageUrl: homepageUrl })
      homepageSave.markSaved()
    } catch (err) {
      homepageSave.markError(err instanceof Error ? err.message : messages.common.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* クリニック情報 */}
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
              disabled={clinicNameSave.status === "saving"}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveName}
              disabled={clinicNameSave.status === "saving"}
            >
              {messages.common.save}
            </Button>
            <SaveIndicator status={clinicNameSave.status} errorMsg={clinicNameSave.errorMsg} />
          </div>
        </CardContent>
      </Card>

      {/* 定休日 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalendarOff className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <CardTitle className="text-base">{messages.settings.regularClosedDaysLabel}</CardTitle>
              <CardDescription>{messages.settings.regularClosedDaysDesc}</CardDescription>
            </div>
            <SaveIndicator status={closedDaysSave.status} errorMsg={closedDaysSave.errorMsg} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                disabled={closedDaysSave.status === "saving"}
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
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">{messages.settings.postSurveyActionLabel}</Label>
              {/* ラジオ変更時のステータス（URL保存中でない場合のみ表示） */}
              {(action === "none" || (!googleUrl && !lineUrl)) && (
                <SaveIndicator status={postSurveySave.status} errorMsg={postSurveySave.errorMsg} />
              )}
            </div>
            <div className="space-y-2">
              {POST_SURVEY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={postSurveySave.status === "saving"}
                  onClick={() => handleActionChange(opt.value)}
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
            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
              <div className="space-y-2">
                <Label htmlFor="googleReviewUrl">{messages.settings.googleReviewUrlLabel}</Label>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    id="googleReviewUrl"
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder={messages.settings.googleReviewUrlPlaceholder}
                    disabled={postSurveySave.status === "saving"}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSavePostSurveyUrls}
                  disabled={postSurveySave.status === "saving"}
                >
                  {messages.common.save}
                </Button>
                <SaveIndicator status={postSurveySave.status} errorMsg={postSurveySave.errorMsg} />
              </div>
            </div>
          )}

          {/* LINE URL入力 */}
          {action === "line" && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
              <div className="space-y-2">
                <Label htmlFor="lineUrl">{messages.settings.lineUrlLabel}</Label>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    id="lineUrl"
                    type="url"
                    value={lineUrl}
                    onChange={(e) => setLineUrl(e.target.value)}
                    placeholder={messages.settings.lineUrlPlaceholder}
                    disabled={postSurveySave.status === "saving"}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSavePostSurveyUrls}
                  disabled={postSurveySave.status === "saving"}
                >
                  {messages.common.save}
                </Button>
                <SaveIndicator status={postSurveySave.status} errorMsg={postSurveySave.errorMsg} />
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
        <CardContent className="space-y-4">
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
                disabled={homepageSave.status === "saving"}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveHomepage}
              disabled={homepageSave.status === "saving"}
            >
              {messages.common.save}
            </Button>
            <SaveIndicator status={homepageSave.status} errorMsg={homepageSave.errorMsg} />
          </div>
        </CardContent>
      </Card>

      {/* アンケート設定（情報のみ） */}
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
    </div>
  )
}
