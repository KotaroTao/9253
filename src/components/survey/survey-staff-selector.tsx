"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { StaffCardGrid, type StaffCardItem } from "@/components/staff/staff-card-grid"
import { messages } from "@/lib/messages"
import { ArrowLeft } from "lucide-react"
import type { SurveyPageData } from "@/types/survey"

interface SurveyStaffSelectorProps {
  staffList: StaffCardItem[]
  clinicName: string
  templateId: string
  questions: SurveyPageData["questions"]
  enableReviewRequest: boolean
  googleReviewUrl: string | null
}

export function SurveyStaffSelector({
  staffList,
  clinicName,
  templateId,
  questions,
  enableReviewRequest,
  googleReviewUrl,
}: SurveyStaffSelectorProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffCardItem | null>(null)
  // key to force re-mount SurveyForm on staff change
  const [formKey, setFormKey] = useState(0)

  function handleSelectStaff(staff: StaffCardItem) {
    setSelectedStaff(staff)
    setFormKey((k) => k + 1)
  }

  if (selectedStaff) {
    const pageData: SurveyPageData = {
      staffName: selectedStaff.name,
      clinicName,
      templateId,
      questions,
      qrToken: selectedStaff.qrToken,
    }

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setSelectedStaff(null)}
        >
          <ArrowLeft className="h-4 w-4" />
          {messages.tally.backToStaffSelect}
        </Button>
        <div className="mx-auto max-w-md">
          <SurveyForm
            key={formKey}
            data={pageData}
            enableReviewRequest={enableReviewRequest}
            googleReviewUrl={googleReviewUrl}
          />
        </div>
      </div>
    )
  }

  return (
    <StaffCardGrid
      staffList={staffList}
      onSelect={handleSelectStaff}
      hint={messages.nav.selectStaffForSurvey}
    />
  )
}
