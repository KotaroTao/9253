"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/survey/star-rating"
import { messages } from "@/lib/messages"
import { DEFAULTS, DENTAL_TIPS } from "@/lib/constants"
import { ChevronLeft, Lightbulb, MessageSquarePlus } from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import type { SurveyPageData } from "@/types/survey"

interface SurveyFormProps {
  data: SurveyPageData
  onComplete?: () => void
  kioskMode?: boolean
}

type Step = "welcome" | "questions" | "freetext" | "submitting" | "thanks"

export function SurveyForm({ data, onComplete, kioskMode = false }: SurveyFormProps) {
  // In kiosk mode, skip welcome screen
  const [step, setStep] = useState<Step>(kioskMode ? "questions" : "welcome")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [freeText, setFreeText] = useState("")
  const [showFreeText, setShowFreeText] = useState(false)
  const [error, setError] = useState("")
  const [randomTip] = useState(() => DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])

  const ratingQuestions = data.questions.filter((q) => q.type === "rating")

  function handleRating(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setTimeout(() => {
      if (currentQuestion < ratingQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setStep("freetext")
      }
    }, 400)
  }

  async function handleSubmit() {
    setStep("submitting")
    setError("")

    try {
      const res = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffToken: data.qrToken,
          templateId: data.templateId,
          answers,
          freeText: freeText || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        setStep("freetext")
        return
      }

      setStep("thanks")
      onComplete?.()
    } catch {
      setError(messages.common.error)
      setStep("freetext")
    }
  }

  const totalSteps = ratingQuestions.length + 1
  const progressCurrent = step === "welcome" ? 0 : step === "questions" ? currentQuestion + 1 : totalSteps
  const progressPercent = step === "thanks" || step === "submitting" ? 100 : Math.round((progressCurrent / totalSteps) * 100)

  if (step === "welcome") {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-muted">
          <div className="h-full bg-primary/30 transition-all duration-300" style={{ width: "0%" }} />
        </div>
        <CardHeader className="pb-3 text-center">
          <p className="text-sm text-muted-foreground">{data.clinicName}</p>
          <CardTitle className="text-xl">{messages.survey.welcome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <p className="text-sm text-muted-foreground">担当: {data.staffName}</p>
          <Button onClick={() => setStep("questions")} size="lg" className="w-full h-14 text-base">
            {messages.survey.startButton}
          </Button>
          <p className="text-xs text-muted-foreground">
            {messages.survey.estimatedTime} ・ {messages.survey.anonymous}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (step === "questions") {
    const q = ratingQuestions[currentQuestion]
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <CardHeader className="pb-2 text-center">
          <p className="text-xs text-muted-foreground">
            {currentQuestion + 1} / {ratingQuestions.length}
          </p>
          <CardTitle className={`leading-relaxed ${kioskMode ? "text-xl" : "text-lg"}`}>{q.text}</CardTitle>
        </CardHeader>
        <CardContent className={`flex flex-col items-center gap-6 ${kioskMode ? "pb-10" : "pb-8"}`}>
          <StarRating
            value={answers[q.id] || 0}
            onChange={(v) => handleRating(q.id, v)}
            large={kioskMode}
          />
          {currentQuestion > 0 && (
            <button
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              {messages.common.back}
            </button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === "freetext") {
    // Kiosk mode: "Submit" is primary, free text is optional toggle
    if (kioskMode) {
      return (
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-primary" />
          <CardContent className="space-y-4 py-8">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            {showFreeText ? (
              <>
                <label htmlFor="survey-freetext" className="sr-only">{messages.survey.freeTextLabel}</label>
                <textarea
                  id="survey-freetext"
                  className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base min-h-[120px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={messages.survey.freeTextPlaceholder}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  maxLength={DEFAULTS.MAX_FREE_TEXT_LENGTH}
                  autoFocus
                />
                <Button className="w-full h-14 text-lg" onClick={handleSubmit}>
                  {messages.common.submit}
                </Button>
              </>
            ) : (
              <>
                <Button className="w-full h-16 text-lg" onClick={handleSubmit}>
                  {messages.common.submit}
                </Button>
                <button
                  className="flex w-full items-center justify-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowFreeText(true)}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  {messages.survey.addComment}
                </button>
              </>
            )}
          </CardContent>
        </Card>
      )
    }

    // Non-kiosk: show full free text form
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-muted">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
        <CardHeader className="text-center">
          <CardTitle className="text-lg">{messages.survey.freeTextLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label htmlFor="survey-freetext" className="sr-only">{messages.survey.freeTextLabel}</label>
          <textarea
            id="survey-freetext"
            className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm min-h-[120px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder={messages.survey.freeTextPlaceholder}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            maxLength={DEFAULTS.MAX_FREE_TEXT_LENGTH}
          />
          <p className="text-right text-xs text-muted-foreground">
            {freeText.length} / {DEFAULTS.MAX_FREE_TEXT_LENGTH}
          </p>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12" onClick={() => { setCurrentQuestion(ratingQuestions.length - 1); setStep("questions") }}>
              {messages.common.back}
            </Button>
            <Button className="flex-1 h-12 text-base" onClick={handleSubmit}>{messages.common.submit}</Button>
          </div>
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

  return (
    <>
      <Confetti />
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-primary" />
        <CardHeader className="text-center pt-8">
          <div className="mb-3 text-5xl">🎉</div>
          <CardTitle className="text-xl">{messages.survey.thankYou}</CardTitle>
          <p className="text-sm text-muted-foreground">{messages.survey.thankYouSub}</p>
        </CardHeader>
        <CardContent className="space-y-4 pb-8 text-center">
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
        </CardContent>
      </Card>
    </>
  )
}
