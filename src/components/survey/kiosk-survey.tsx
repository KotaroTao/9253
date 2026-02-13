"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import { MessageSquare, LogOut, Lightbulb } from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import { DENTAL_TIPS } from "@/lib/constants"
import type { SurveyPageData } from "@/types/survey"

interface KioskSurveyProps {
  data: SurveyPageData
  initialTodayCount: number
}

type KioskState = "ready" | "survey" | "cooldown"

const COOLDOWN_SECONDS = 4

export function KioskSurvey({ data, initialTodayCount }: KioskSurveyProps) {
  const router = useRouter()
  const [state, setState] = useState<KioskState>("ready")
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [formKey, setFormKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [cooldownProgress, setCooldownProgress] = useState(100)
  const [randomTip, setRandomTip] = useState(() => DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])
  const [showConfetti, setShowConfetti] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetToReady = useCallback(() => {
    setFormKey((k) => k + 1)
    setState("ready")
    setCooldownProgress(100)
    setShowConfetti(false)
  }, [])

  const handleSurveyComplete = useCallback(() => {
    setTodayCount((c) => c + 1)
    setRandomTip(DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])
    setShowConfetti(true)
    setState("cooldown")
  }, [])

  // Cooldown timer with smooth progress bar
  useEffect(() => {
    if (state !== "cooldown") return

    const startTime = Date.now()
    const duration = COOLDOWN_SECONDS * 1000

    cooldownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setCooldownProgress(remaining)

      if (elapsed >= duration) {
        if (cooldownRef.current) clearInterval(cooldownRef.current)
        resetToReady()
      }
    }, 50)

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [state, resetToReady])

  const handleStartSurvey = useCallback(() => {
    setState("survey")
  }, [])

  const handleExit = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  // Ready screen - staff hands tablet to patient, patient taps to start
  if (state === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 to-white px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <p className="text-sm text-muted-foreground">{data.staffName}</p>

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

  // Cooldown - thank you + tip + countdown
  if (state === "cooldown") {
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

            <div className="mx-auto max-w-xs space-y-1 pt-2">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/40 transition-all duration-100 ease-linear"
                  style={{ width: `${cooldownProgress}%` }}
                />
              </div>
            </div>
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
