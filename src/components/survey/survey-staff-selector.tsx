"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import { ArrowLeft } from "lucide-react"
import type { SurveyPageData } from "@/types/survey"

interface SurveyStaffSelectorProps {
  clinicName: string
  clinicSlug: string
  templateId: string
  questions: SurveyPageData["questions"]
}

export function SurveyStaffSelector({
  clinicName,
  clinicSlug,
  templateId,
  questions,
}: SurveyStaffSelectorProps) {
  const [started, setStarted] = useState(false)

  if (started) {
    const pageData: SurveyPageData = {
      clinicName,
      clinicSlug,
      templateId,
      templateName: "",
      questions,
    }

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setStarted(false)}
        >
          <ArrowLeft className="h-4 w-4" />
          {messages.common.back}
        </Button>
        <div className="mx-auto max-w-md">
          <SurveyForm data={pageData} />
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <Button onClick={() => setStarted(true)} size="lg">
        {messages.survey.startButton}
      </Button>
    </div>
  )
}
