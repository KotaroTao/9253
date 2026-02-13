"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import { MessageSquare, LogOut, Lightbulb, RotateCcw } from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import { DENTAL_TIPS } from "@/lib/constants"
import type { SurveyPageData } from "@/types/survey"

interface KioskSurveyProps {
  data: SurveyPageData
  initialTodayCount: number
}

type KioskState = "ready" | "survey" | "thanks"

export function KioskSurvey({ data, initialTodayCount }: KioskSurveyProps) {
  const router = useRouter()
  const [state, setState] = useState<KioskState>("ready")
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [formKey, setFormKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [randomTip, setRandomTip] = useState(() => DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])
  const [showConfetti, setShowConfetti] = useState(false)

  const resetToReady = useCallback(() => {
    setFormKey((k) => k + 1)
    setState("ready")
    setShowConfetti(false)
  }, [])

  const handleSurveyComplete = useCallback(() => {
    setTodayCount((c) => c + 1)
    setRandomTip(DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])
    setShowConfetti(true)
    setState("thanks")
  }, [])

  const handleStartSurvey = useCallback(() => {
    setState("survey")
  }, [])

  const handleExit = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  // Ready screen
  if (state === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 to-white px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{data.clinicName}</p>
            {data.templateName && (
              <p className="mt-2 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                {data.templateName}
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="h-20 w-full text-xl shadow-lg shadow-blue-200/50"
            onClick={handleStartSurvey}
          >
            {messages.survey.startButton}
          </Button>

          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {messages.kiosk.todayCount}: {todayCount}{messages.common.countSuffix}
          </div>
        </div>

        {/* Exit button - intentionally subtle */}
        <div className="fixed bottom-4 right-4">
          {showExitConfirm ? (
            <div className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-lg">
              <p className="text-sm">{messages.kiosk.exitConfirm}</p>
              <Button size="sm" variant="outline" onClick={() => setShowExitConfirm(false)}>
                {messages.common.cancel}
              </Button>
              <Button size="sm" onClick={handleExit}>
                {messages.kiosk.exitKiosk}
              </Button>
            </div>
          ) : (
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/15 transition-colors hover:bg-muted hover:text-muted-foreground"
              onClick={() => setShowExitConfirm(true)}
              aria-label={messages.kiosk.exitKiosk}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Thanks screen - stays until "TOPに戻る" is pressed
  if (state === "thanks") {
    return (
      <>
        {showConfetti && <Confetti />}
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50/60 to-white px-4">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold">{messages.survey.thankYou}</h1>

            <div className="rounded-xl bg-blue-50 p-4 text-left">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <Lightbulb className="h-3.5 w-3.5" />
                {messages.survey.tipLabel}
              </p>
              <p className="text-sm text-blue-800">{randomTip}</p>
            </div>

            <p className="text-sm text-muted-foreground">{messages.survey.closeMessage}</p>

            <Button
              className="h-16 w-full text-lg"
              onClick={resetToReady}
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              {messages.survey.backToTop}
            </Button>
          </div>
        </div>
      </>
    )
  }

  // Survey - patient answering
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <SurveyForm
          key={formKey}
          data={data}
          onComplete={handleSurveyComplete}
          kioskMode
        />
      </div>
    </div>
  )
}
