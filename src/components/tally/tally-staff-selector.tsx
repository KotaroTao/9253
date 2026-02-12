"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TallyTapUI } from "@/components/tally/tally-tap-ui"
import { messages } from "@/lib/messages"
import { ArrowLeft } from "lucide-react"

interface StaffItem {
  id: string
  name: string
  role: string
  qrToken: string
}

interface TallyStaffSelectorProps {
  staffList: StaffItem[]
}

const ROLE_COLORS: Record<string, string> = {
  dentist: "bg-blue-100 text-blue-700",
  hygienist: "bg-green-100 text-green-700",
  assistant: "bg-orange-100 text-orange-700",
  receptionist: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
}

export function TallyStaffSelector({ staffList }: TallyStaffSelectorProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)

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
          スタッフ選択に戻る
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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        記録するスタッフを選択してください
      </p>
      {staffList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{messages.common.noData}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((staff) => (
            <button
              key={staff.id}
              onClick={() => setSelectedStaff(staff)}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {staff.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{staff.name}</p>
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[staff.role] ?? ROLE_COLORS.other}`}
                >
                  {staff.role}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
