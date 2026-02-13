"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import { MessageSquare, LogOut } from "lucide-react"
import type { SurveyPageData } from "@/types/survey"

interface KioskSurveyProps {
  data: SurveyPageData
  initialTodayCount: number
}

type KioskState = "ready" | "survey" | "cooldown"

export function KioskSurvey({ data, initialTodayCount }: KioskSurveyProps) {
  const router = useRouter()
  const [state, setState] = useState<KioskState>("ready")
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [formKey, setFormKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const handleSurveyComplete = useCallback(() => {
    setTodayCount((c) => c + 1)
    setState("cooldown")
    // Auto-reset to ready after 5 seconds
    setTimeout(() => {
      setFormKey((k) => k + 1)
      setState("ready")
    }, 5000)
  }, [])

  const handleStartSurvey = useCallback(() => {
    setState("survey")
  }, [])

  const handleExit = useCallback(() => {
    router.push("/dashboard/survey-start")
  }, [router])

  // Ready screen - shown to staff before handing to patient
  if (state === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Today's count badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <MessageSquare className="h-4 w-4" />
            {messages.kiosk.todayCount}: {todayCount}{messages.common.countSuffix}
          </div>

          {/* Main message */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              {messages.kiosk.readyMessage}
            </h1>
            <p className="text-lg text-muted-foreground">
              {messages.kiosk.handToPatient}
            </p>
          </div>

          {/* Start button */}
          <Button
            size="lg"
            className="h-16 w-full max-w-xs text-lg"
            onClick={handleStartSurvey}
          >
            {messages.survey.startButton}
          </Button>

          {/* Clinic & staff info (subtle) */}
          <p className="text-xs text-muted-foreground/60">
            {data.clinicName} ・ {data.staffName}
          </p>
        </div>

        {/* Exit button - bottom corner, subtle */}
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
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-muted hover:text-muted-foreground"
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

  // Cooldown screen - after survey completion, auto-resets
  if (state === "cooldown") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="text-xl font-bold">{messages.survey.thankYou}</h1>
          <p className="text-muted-foreground">{messages.survey.thankYouSub}</p>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">{messages.survey.closeMessage}</p>
          </div>
          <div className="pt-8">
            <Button
              variant="outline"
              onClick={() => {
                setFormKey((k) => k + 1)
                setState("ready")
              }}
            >
              {messages.kiosk.nextPatient}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Survey state - patient is answering
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <SurveyForm
          key={formKey}
          data={data}
          onComplete={handleSurveyComplete}
        />
      </div>
    </div>
  )
}
