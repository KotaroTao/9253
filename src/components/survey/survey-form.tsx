"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/survey/star-rating"
import { messages } from "@/lib/messages"
import { DEFAULTS } from "@/lib/constants"
import type { SurveyPageData, SurveySubmitResult } from "@/types/survey"

interface SurveyFormProps {
  data: SurveyPageData
  enableReviewRequest: boolean
  googleReviewUrl: string | null
}

type Step = "welcome" | "questions" | "freetext" | "submitting" | "thanks"

export function SurveyForm({
  data,
  enableReviewRequest,
  googleReviewUrl,
}: SurveyFormProps) {
  const [step, setStep] = useState<Step>("welcome")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [freeText, setFreeText] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SurveySubmitResult | null>(
    null
  )

  const ratingQuestions = data.questions.filter((q) => q.type === "rating")

  function handleRating(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    // Auto-advance after short delay
    setTimeout(() => {
      if (currentQuestion < ratingQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setStep("freetext")
      }
    }, 300)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
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
        setIsSubmitting(false)
        setStep("freetext")
        return
      }

      const result: SurveySubmitResult = await res.json()
      setSubmitResult(result)
      setStep("thanks")
    } catch {
      setError(messages.common.error)
      setIsSubmitting(false)
      setStep("freetext")
    }
  }

  async function handleReviewClick() {
    if (!submitResult) return
    try {
      await fetch("/api/reviews/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: submitResult.id }),
      })
    } catch {
      // ignore - best effort
    }
    if (submitResult.googleReviewUrl) {
      window.open(submitResult.googleReviewUrl, "_blank")
    }
  }

  // Welcome screen
  if (step === "welcome") {
    return (
      <Card>
        <CardHeader className="text-center">
          <p className="text-sm text-muted-foreground">{data.clinicName}</p>
          <CardTitle className="text-xl">
            {messages.survey.welcome}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            担当: {data.staffName}
          </p>
          <Button onClick={() => setStep("questions")} className="w-full">
            {messages.survey.startButton}
          </Button>
          <p className="text-xs text-muted-foreground">
            {messages.survey.estimatedTime} ・ {messages.survey.anonymous}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Rating questions
  if (step === "questions") {
    const q = ratingQuestions[currentQuestion]
    return (
      <Card>
        <CardHeader className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentQuestion + 1} / {ratingQuestions.length}
          </p>
          <CardTitle className="text-lg">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <StarRating
            value={answers[q.id] || 0}
            onChange={(v) => handleRating(q.id, v)}
          />
          <div className="flex w-full justify-between text-xs text-muted-foreground">
            <span>{DEFAULTS.MIN_STAR_RATING}点</span>
            <span>{DEFAULTS.MAX_STAR_RATING}点</span>
          </div>
          {currentQuestion > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
            >
              {messages.common.back}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Free text step
  if (step === "freetext") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            {messages.survey.freeTextLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder={messages.survey.freeTextPlaceholder}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            maxLength={DEFAULTS.MAX_FREE_TEXT_LENGTH}
          />
          <p className="text-right text-xs text-muted-foreground">
            {freeText.length} / {DEFAULTS.MAX_FREE_TEXT_LENGTH}
          </p>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCurrentQuestion(ratingQuestions.length - 1)
                setStep("questions")
              }}
            >
              {messages.common.back}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? messages.common.loading : messages.common.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Submitting
  if (step === "submitting") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mb-4 text-2xl">⏳</div>
          <p className="text-muted-foreground">{messages.common.loading}</p>
        </CardContent>
      </Card>
    )
  }

  // Thanks + Review prompt
  const showReview =
    enableReviewRequest && googleReviewUrl && submitResult?.reviewRequested

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <CardTitle className="text-xl">{messages.survey.thankYou}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {messages.survey.thankYouSub}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {showReview && (
          <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm">{messages.survey.reviewPrompt}</p>
            <Button onClick={handleReviewClick} className="w-full">
              {messages.survey.reviewButton}
            </Button>
            <p className="text-xs text-muted-foreground">
              {messages.survey.reviewNote}
            </p>
          </div>
        )}
        <div className="pt-4 text-sm text-muted-foreground">
          <p>{messages.survey.closeMessage}</p>
          <p>{messages.survey.visitAgain}</p>
        </div>
      </CardContent>
    </Card>
  )
}
