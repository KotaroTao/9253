"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TallyTapUI } from "@/components/tally/tally-tap-ui"
import { StaffCardGrid, type StaffCardItem } from "@/components/staff/staff-card-grid"
import { messages } from "@/lib/messages"
import { ArrowLeft } from "lucide-react"

interface TallyStaffSelectorProps {
  staffList: StaffCardItem[]
}

export function TallyStaffSelector({ staffList }: TallyStaffSelectorProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffCardItem | null>(null)

  if (selectedStaff) {
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
        <div className="mx-auto max-w-sm">
          <TallyTapUI
            staffName={selectedStaff.name}
            staffToken={selectedStaff.qrToken}
          />
        </div>
      </div>
    )
  }

  return (
    <StaffCardGrid
      staffList={staffList}
      onSelect={setSelectedStaff}
      hint={messages.tally.selectStaff}
    />
  )
}
