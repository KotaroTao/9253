"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import { MessageSquare, LogOut, Sparkles } from "lucide-react"
import type { SurveyPageData } from "@/types/survey"

interface KioskSurveyProps {
  data: SurveyPageData
  initialTodayCount: number
}

type KioskState = "ready" | "survey" | "cooldown"

const COOLDOWN_SECONDS = 6

export function KioskSurvey({ data, initialTodayCount }: KioskSurveyProps) {
  const router = useRouter()
  const [state, setState] = useState<KioskState>("ready")
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [formKey, setFormKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [cooldownProgress, setCooldownProgress] = useState(100)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetToReady = useCallback(() => {
    setFormKey((k) => k + 1)
    setState("ready")
    setCooldownProgress(100)
  }, [])

  const handleSurveyComplete = useCallback(() => {
    setTodayCount((c) => c + 1)
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
    router.push("/dashboard/survey-start")
  }, [router])

  // Ready screen - staff sees this before handing tablet to patient
  if (state === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 to-white px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Today's count */}
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2.5 text-sm font-medium text-blue-700">
            <MessageSquare className="h-4 w-4" />
            {messages.kiosk.todayCount}: {todayCount}{messages.common.countSuffix}
          </div>

          {/* Animated pulse ring */}
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-200/40" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-2 animate-ping rounded-full bg-blue-200/30" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
              <Sparkles className="h-10 w-10" />
            </div>
          </div>

          {/* Main message for staff */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {messages.kiosk.readyTitle}
            </h1>
            <p className="text-base text-muted-foreground">
              {messages.kiosk.staffGuide}
            </p>
          </div>

          {/* Start button */}
          <Button
            size="lg"
            className="h-16 w-full max-w-xs text-lg shadow-md shadow-blue-200/50"
            onClick={handleStartSurvey}
          >
            {messages.survey.startButton}
          </Button>

          {/* Clinic & staff info */}
          <p className="text-xs text-muted-foreground/50">
            {data.clinicName} ・ {data.staffName}
          </p>
        </div>

        {/* Exit button */}
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
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/20 transition-colors hover:bg-muted hover:text-muted-foreground"
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

  // Cooldown - thank you + countdown
  if (state === "cooldown") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50/60 to-white px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="text-6xl">
            {todayCount % 10 === 0 && todayCount > 0 ? "🎊" : "🎉"}
          </div>
          <h1 className="text-2xl font-bold">{messages.survey.thankYou}</h1>
          <p className="text-muted-foreground">{messages.survey.thankYouSub}</p>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">{messages.survey.closeMessage}</p>
            <p className="text-sm text-muted-foreground">{messages.survey.visitAgain}</p>
          </div>

          {/* Countdown bar */}
          <div className="mx-auto max-w-xs space-y-2 pt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/40 transition-all duration-100 ease-linear"
                style={{ width: `${cooldownProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground/60">{messages.kiosk.autoReturn}</p>
          </div>

          <Button variant="ghost" size="sm" className="text-muted-foreground/50" onClick={resetToReady}>
            {messages.kiosk.nextPatient}
          </Button>
        </div>
      </div>
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
