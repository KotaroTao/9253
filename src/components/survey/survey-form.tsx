"use client"

import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/survey/star-rating"
import { messages } from "@/lib/messages"
import { cn } from "@/lib/utils"
import { DEFAULTS, DENTAL_TIPS } from "@/lib/constants"
import { Lightbulb, ExternalLink, Globe, FlaskConical } from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import type { SurveyPageData, PatientAttributes } from "@/types/survey"
import type { PostSurveyLinks } from "@/types"

interface SurveyFormProps {
  data: SurveyPageData
  onComplete?: () => void
  kioskMode?: boolean
  patientAttributes?: PatientAttributes
  staffId?: string
  deviceUuid?: string
  postSurveyLinks?: PostSurveyLinks
  isTestMode?: boolean
}

type Step = "welcome" | "survey" | "submitting" | "thanks"

export function SurveyForm({ data, onComplete, kioskMode = false, patientAttributes, staffId, deviceUuid, postSurveyLinks, isTestMode = false }: SurveyFormProps) {
  const [step, setStep] = useState<Step>(kioskMode ? "survey" : "welcome")
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [freeText, setFreeText] = useState("")
  const [error, setError] = useState("")
  const [randomTip] = useState(() => DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])

  // Speed tracking: record when survey step begins
  const surveyStartTime = useRef<number | null>(null)
  useEffect(() => {
    if (step === "survey") {
      surveyStartTime.current = Date.now()
    }
  }, [step])

  // Filter questions by condition (dynamic question set based on patient attributes)
  const visibleQuestions = useMemo(() => {
    return data.questions.filter((q) => {
      if (!q.condition) return true
      if (q.condition.chiefComplaint && patientAttributes?.chiefComplaint) {
        return q.condition.chiefComplaint.includes(patientAttributes.chiefComplaint)
      }
      return true
    })
  }, [data.questions, patientAttributes])

  const ratingQuestions = visibleQuestions.filter((q) => q.type === "rating")
  const allAnswered = ratingQuestions.every((q) => answers[q.id] && answers[q.id] > 0)
  const answeredCount = ratingQuestions.filter((q) => answers[q.id] && answers[q.id] > 0).length
  const totalQuestions = ratingQuestions.length

  // Calculate average score for the thank you page
  const avgScore = useMemo(() => {
    const scores = Object.values(answers)
    if (scores.length === 0) return 0
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  }, [answers])

  function handleRating(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (error) setError("")
  }

  const scrollToFirstUnanswered = useCallback(() => {
    const firstUnanswered = ratingQuestions.find((q) => !answers[q.id] || answers[q.id] <= 0)
    if (firstUnanswered) {
      const el = document.getElementById(`question-${firstUnanswered.id}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-destructive/50")
        setTimeout(() => el.classList.remove("ring-2", "ring-destructive/50"), 2000)
      }
    }
  }, [ratingQuestions, answers])

  async function handleSubmit() {
    if (!allAnswered) {
      scrollToFirstUnanswered()
      return
    }
    setStep("submitting")
    setError("")

    // Calculate response duration
    const responseDurationMs = surveyStartTime.current
      ? Date.now() - surveyStartTime.current
      : undefined

    try {
      const res = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicSlug: data.clinicSlug,
          staffId: staffId || undefined,
          templateId: data.templateId,
          answers,
          freeText: freeText || undefined,
          patientAttributes: patientAttributes || undefined,
          responseDurationMs,
          deviceUuid: deviceUuid || undefined,
          ...(isTestMode ? { isTest: true } : {}),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        setStep("survey")
        return
      }

      setStep("thanks")
      onComplete?.()
    } catch {
      setError(messages.common.error)
      setStep("survey")
    }
  }

  const testBanner = isTestMode ? (
    <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
      <FlaskConical className="h-3.5 w-3.5" />
      {messages.kiosk.testModeBanner}
    </div>
  ) : null

  if (step === "welcome") {
    return (
      <>
      {testBanner}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-muted" />
        <CardHeader className="pb-3 text-center">
          <p className="text-sm text-muted-foreground">{data.clinicName}</p>
          <CardTitle className="text-xl">{messages.survey.welcome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <Button onClick={() => setStep("survey")} size="lg" className="w-full h-14 text-base">
            {messages.survey.startButton}
          </Button>
          <p className="text-xs text-muted-foreground">
            {messages.survey.estimatedTime} ・ {messages.survey.anonymous}
          </p>
        </CardContent>
      </Card>
      </>
    )
  }

  if (step === "survey") {
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

    return (
      <>
      {testBanner}
      <Card className="overflow-hidden">
        {/* Animated progress bar */}
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <CardHeader className="pb-2 text-center">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{data.clinicName}</p>
            {/* Progress counter */}
            <p className="text-xs font-medium text-primary">
              {messages.survey.progressLabel} {answeredCount}{messages.survey.progressOf}{totalQuestions}
            </p>
          </div>
          <CardTitle className={kioskMode ? "text-xl" : "text-lg"}>
            {messages.survey.welcome}
          </CardTitle>
          {data.templateName && (
            <p className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {data.templateName}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5 pb-8">
          {ratingQuestions.map((q, index) => {
            const isAnswered = answers[q.id] && answers[q.id] > 0
            return (
              <div
                key={q.id}
                id={`question-${q.id}`}
                className={`space-y-2 rounded-xl p-3 transition-all ${
                  isAnswered ? "bg-primary/5" : ""
                }`}
              >
                <p className={`font-medium ${kioskMode ? "text-base" : "text-sm"}`}>
                  <span className={`mr-1.5 ${isAnswered ? "text-primary" : "text-muted-foreground"}`}>
                    {index + 1}.
                  </span>
                  {q.text}
                </p>
                <div className="flex justify-center">
                  <StarRating
                    value={answers[q.id] || 0}
                    onChange={(v) => handleRating(q.id, v)}
                    large={kioskMode}
                  />
                </div>
              </div>
            )
          })}

          <div className="space-y-2 pt-2">
            <p className={`font-medium ${kioskMode ? "text-base" : "text-sm"}`}>
              {messages.survey.freeTextLabel}
            </p>
            <label htmlFor="survey-freetext" className="sr-only">{messages.survey.freeTextLabel}</label>
            <textarea
              id="survey-freetext"
              className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm min-h-[100px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={messages.survey.freeTextPlaceholder}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={DEFAULTS.MAX_FREE_TEXT_LENGTH}
            />
            <p className="text-right text-xs text-muted-foreground">
              {freeText.length} / {DEFAULTS.MAX_FREE_TEXT_LENGTH}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button
            className={`w-full ${kioskMode ? "h-16 text-lg" : "h-12 text-base"}`}
            onClick={handleSubmit}
          >
            {messages.common.submit}
          </Button>

          {!allAnswered && (
            <p className="text-center text-xs text-muted-foreground">
              {messages.survey.allRequiredHint}（残り{totalQuestions - answeredCount}問）
            </p>
          )}
        </CardContent>
      </Card>
      </>
    )
  }

  if (step === "submitting") {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-primary" />
        <CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{messages.common.loading}</p>
        </CardContent>
      </Card>
    )
  }

  // Thanks step
  return (
    <>
      <Confetti />
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-green-500" />
        <CardHeader className="text-center pt-8">
          <div className="mb-3 text-5xl">🎉</div>
          <CardTitle className="text-xl">{messages.survey.thankYou}</CardTitle>
          <p className="text-sm text-muted-foreground">{messages.survey.thankYouSub}</p>
          {/* Score display */}
          {avgScore > 0 && (
            <div className="mx-auto mt-3 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-lg ${s <= Math.round(avgScore) ? "text-yellow-400" : "text-gray-200"}`}>
                  ★
                </span>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pb-8 text-center">
          {/* Dental tip */}
          <div className="mx-auto max-w-xs rounded-xl bg-blue-50 p-4 text-left">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Lightbulb className="h-3.5 w-3.5" />
              {messages.survey.tipLabel}
            </p>
            <p className="text-sm text-blue-800">{randomTip}</p>
          </div>
          {/* LINE誘導CTA — 全員一律表示 */}
          {postSurveyLinks?.lineUrl && (
            <div className="mx-auto max-w-xs rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="mb-1 text-sm font-medium text-green-800">
                {messages.postSurvey.lineText}
              </p>
              <p className="mb-3 text-xs text-green-700">
                {messages.postSurvey.lineSubText}
              </p>
              <a
                href={postSurveyLinks.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#06C755] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#05b04d]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {messages.postSurvey.lineButton}
              </a>
              <p className="mt-2 text-[10px] text-green-600">
                {messages.postSurvey.lineNote}
              </p>
            </div>
          )}
          {/* 医院ホームページリンク（メイン誘導がある場合は控えめ表示） */}
          {postSurveyLinks?.clinicHomepageUrl && (
            <div className="mx-auto max-w-xs text-center">
              <a
                href={postSurveyLinks.clinicHomepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 transition-colors",
                  postSurveyLinks.lineUrl
                    ? "text-xs text-muted-foreground hover:text-foreground"
                    : "rounded-lg border px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                {messages.postSurvey.homepageButton}
              </a>
            </div>
          )}
          <div className="pt-2 text-sm text-muted-foreground">
            <p>{messages.survey.closeMessage}</p>
            <p>{messages.survey.visitAgain}</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
