"use client"

import { useRouter } from "next/navigation"
import { StaffCardGrid, type StaffCardItem } from "@/components/staff/staff-card-grid"
import { messages } from "@/lib/messages"

interface SurveyKioskLauncherProps {
  staffList: StaffCardItem[]
  autoSelectedToken: string | null
}

export function SurveyKioskLauncher({
  staffList,
}: SurveyKioskLauncherProps) {
  const router = useRouter()

  function handleSelect(staff: StaffCardItem) {
    router.push(`/kiosk/${encodeURIComponent(staff.qrToken)}`)
  }

  return (
    <StaffCardGrid
      staffList={staffList}
      onSelect={handleSelect}
      hint={messages.nav.selectStaffForSurvey}
    />
  )
}
