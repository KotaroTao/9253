"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import { StaffFormDialog } from "@/components/staff/staff-form-dialog"
import { QrCodeDialog } from "@/components/staff/qr-code-dialog"
import { Star, QrCode, Plus, Pencil } from "lucide-react"
import type { StaffWithStats } from "@/types"

interface StaffListProps {
  staffList: StaffWithStats[]
  clinicId: string
}

export function StaffList({ staffList, clinicId }: StaffListProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffWithStats | null>(null)
  const [qrStaff, setQrStaff] = useState<StaffWithStats | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggleActive(staffId: string, isActive: boolean) {
    const confirmMsg = isActive
      ? messages.staff.deactivateConfirm
      : messages.staff.activateConfirm
    if (!window.confirm(confirmMsg)) return

    setTogglingId(staffId)
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) {
        const body = await res.json()
        alert(body.error || messages.common.error)
        return
      }
      router.refresh()
    } catch {
      alert(messages.common.error)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {messages.staff.addStaff}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staffList.map((staff) => (
          <Card key={staff.id} className={!staff.isActive ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{staff.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {STAFF_ROLE_LABELS[staff.role] ?? staff.role}
                  </p>
                </div>
                <span
                  className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    staff.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {staff.isActive ? messages.staff.active : messages.staff.inactive}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{staff.avgScore > 0 ? staff.avgScore.toFixed(1) : "-"}</span>
                </div>
                <span className="text-muted-foreground">
                  {staff.surveyCount} {messages.staff.surveyCount}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrStaff(staff)}
                >
                  <QrCode className="mr-1 h-3.5 w-3.5" />
                  QR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStaff(staff)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  {messages.common.edit}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={togglingId === staff.id}
                  onClick={() => handleToggleActive(staff.id, staff.isActive)}
                >
                  {togglingId === staff.id
                    ? messages.common.loading
                    : staff.isActive
                      ? messages.staff.deactivate
                      : messages.staff.activate}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddForm && (
        <StaffFormDialog
          clinicId={clinicId}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            router.refresh()
          }}
        />
      )}

      {editingStaff && (
        <StaffFormDialog
          clinicId={clinicId}
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={() => {
            setEditingStaff(null)
            router.refresh()
          }}
        />
      )}

      {qrStaff && (
        <QrCodeDialog
          staff={qrStaff}
          onClose={() => setQrStaff(null)}
        />
      )}
    </>
  )
}
