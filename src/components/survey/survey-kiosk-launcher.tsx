"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StaffCardGrid, type StaffCardItem } from "@/components/staff/staff-card-grid"
import { messages } from "@/lib/messages"
import { Smartphone, ArrowLeft } from "lucide-react"

interface SurveyKioskLauncherProps {
  staffList: StaffCardItem[]
  autoSelectedToken: string | null
}

export function SurveyKioskLauncher({
  staffList,
  autoSelectedToken,
}: SurveyKioskLauncherProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffCardItem | null>(
    autoSelectedToken
      ? staffList.find((s) => s.qrToken === autoSelectedToken) ?? null
      : null
  )

  // If staff is selected, show kiosk launch screen
  if (selectedStaff) {
    const kioskUrl = `/kiosk/${selectedStaff.qrToken}`

    return (
      <div className="space-y-4">
        {!autoSelectedToken && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setSelectedStaff(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.tally.backToStaffSelect}
          </Button>
        )}

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md">
              <Smartphone className="h-10 w-10" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">{messages.kiosk.readyMessage}</h2>
              <p className="text-muted-foreground">
                担当: {selectedStaff.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {messages.kiosk.handToPatient}
              </p>
            </div>

            <Link href={kioskUrl} className="w-full max-w-xs">
              <Button size="lg" className="h-14 w-full text-base gap-2">
                <Smartphone className="h-5 w-5" />
                {messages.dashboard.startSurvey}
              </Button>
            </Link>

            {selectedStaff.todayCount != null && selectedStaff.todayCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {messages.kiosk.todayCount}: {selectedStaff.todayCount}{messages.common.countSuffix}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin view: show staff selector
  return (
    <StaffCardGrid
      staffList={staffList}
      onSelect={setSelectedStaff}
      hint={messages.nav.selectStaffForSurvey}
    />
  )
}
