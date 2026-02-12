"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/survey/star-rating"
import { messages } from "@/lib/messages"
import { STAFF_SURVEY_QUESTIONS, STAFF_SURVEY_CATEGORIES, DEFAULTS } from "@/lib/constants"
import type { StaffSurveyCategory } from "@/lib/constants"

interface StaffSurveyFormProps {
  surveyId: string
}

type Step = "welcome" | "questions" | "freetext" | "submitting" | "thanks"

export function StaffSurveyForm({ surveyId }: StaffSurveyFormProps) {
  const [step, setStep] = useState<Step>("welcome")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [freeText, setFreeText] = useState("")
  const [error, setError] = useState("")

  const questions = STAFF_SURVEY_QUESTIONS

  function handleRating(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setStep("freetext")
      }
    }, 300)
  }

  async function handleSubmit() {
    setStep("submitting")
    setError("")

    try {
      const res = await fetch("/api/staff-surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
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
    } catch {
      setError(messages.common.error)
      setStep("freetext")
    }
  }

  // Welcome screen
  if (step === "welcome") {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">📋</div>
          <CardTitle className="text-xl">{messages.staffSurvey.welcome}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {messages.staffSurvey.welcomeSub}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              🔒 {messages.staffSurvey.anonymous}
            </p>
          </div>
          <Button onClick={() => setStep("questions")} className="w-full">
            {messages.staffSurvey.startButton}
          </Button>
          <p className="text-xs text-muted-foreground">
            {messages.staffSurvey.estimatedTime}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Rating questions
  if (step === "questions") {
    const q = questions[currentQuestion]
    const categoryLabel = STAFF_SURVEY_CATEGORIES[q.category as StaffSurveyCategory]

    return (
      <Card>
        <CardHeader className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentQuestion + 1} / {questions.length}
            {messages.staffSurvey.questionProgress}
          </p>
          <div className="mb-1 mt-1">
            <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {categoryLabel}
            </span>
          </div>
          <CardTitle className="text-lg">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <StarRating
            value={answers[q.id] || 0}
            onChange={(v) => handleRating(q.id, v)}
          />
          <div className="flex w-full justify-between text-xs text-muted-foreground">
            <span>全くそう思わない</span>
            <span>とてもそう思う</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
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
            {messages.staffSurvey.freeTextLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder={messages.staffSurvey.freeTextPlaceholder}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            maxLength={1000}
          />
          <p className="text-right text-xs text-muted-foreground">
            {freeText.length} / 1000
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
                setCurrentQuestion(questions.length - 1)
                setStep("questions")
              }}
            >
              {messages.common.back}
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {messages.common.submit}
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

  // Thanks
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <CardTitle className="text-xl">{messages.staffSurvey.thankYou}</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          {messages.staffSurvey.thankYouSub}
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-xs text-muted-foreground">
          このページを閉じてください
        </p>
      </CardContent>
    </Card>
  )
}
