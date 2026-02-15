"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/survey/star-rating"
import { messages } from "@/lib/messages"
import { DEFAULTS, DENTAL_TIPS } from "@/lib/constants"
import { Lightbulb, RotateCcw } from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import type { SurveyPageData, PatientAttributes } from "@/types/survey"

interface SurveyFormProps {
  data: SurveyPageData
  onComplete?: () => void
  kioskMode?: boolean
  patientAttributes?: PatientAttributes
}

type Step = "welcome" | "survey" | "submitting" | "thanks"

export function SurveyForm({ data, onComplete, kioskMode = false, patientAttributes }: SurveyFormProps) {
  const [step, setStep] = useState<Step>(kioskMode ? "survey" : "welcome")
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [freeText, setFreeText] = useState("")
  const [error, setError] = useState("")
  const [randomTip] = useState(() => DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])

  const ratingQuestions = data.questions.filter((q) => q.type === "rating")
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
  }

  function handleReset() {
    setStep(kioskMode ? "survey" : "welcome")
    setAnswers({})
    setFreeText("")
    setError("")
  }

  async function handleSubmit() {
    if (!allAnswered) return
    setStep("submitting")
    setError("")

    try {
      const res = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicSlug: data.clinicSlug,
          templateId: data.templateId,
          answers,
          freeText: freeText || undefined,
          patientAttributes: patientAttributes || undefined,
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

  if (step === "welcome") {
    return (
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
    )
  }

  if (step === "survey") {
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

    return (
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
                className={`space-y-2 rounded-xl p-3 transition-colors ${
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
            disabled={!allAnswered}
          >
            {messages.common.submit}
          </Button>

          {!allAnswered && (
            <p className="text-center text-xs text-muted-foreground">
              {messages.survey.allRequiredHint}
            </p>
          )}
        </CardContent>
      </Card>
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
          <div className="pt-2 text-sm text-muted-foreground">
            <p>{messages.survey.closeMessage}</p>
            <p>{messages.survey.visitAgain}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 h-12 w-full text-base"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {messages.survey.backToTop}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
