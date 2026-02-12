"use client"

import { Card, CardContent } from "@/components/ui/card"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import { messages } from "@/lib/messages"

export interface StaffCardItem {
  id: string
  name: string
  role: string
  qrToken: string
  todayCount?: number
}

const ROLE_COLORS: Record<string, string> = {
  dentist: "bg-blue-100 text-blue-700",
  hygienist: "bg-green-100 text-green-700",
  staff: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
}

interface StaffCardGridProps {
  staffList: StaffCardItem[]
  onSelect: (staff: StaffCardItem) => void
  hint: string
}

export function StaffCardGrid({ staffList, onSelect, hint }: StaffCardGridProps) {
  if (staffList.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{messages.common.noData}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => (
          <button
            key={staff.id}
            onClick={() => onSelect(staff)}
            className="flex items-center gap-4 rounded-xl border-2 bg-card p-5 text-left transition-all hover:border-primary/40 hover:bg-accent hover:shadow-sm active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {staff.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium truncate">{staff.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[staff.role] ?? ROLE_COLORS.other}`}
                >
                  {STAFF_ROLE_LABELS[staff.role] ?? staff.role}
                </span>
                {staff.todayCount != null && staff.todayCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {messages.tally.todaySurveys} {staff.todayCount}{messages.common.countSuffix}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
