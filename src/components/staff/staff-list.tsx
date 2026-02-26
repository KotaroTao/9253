"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import { StaffFormDialog } from "@/components/staff/staff-form-dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { StaffWithStats } from "@/types"

interface StaffListProps {
  staffList: StaffWithStats[]
  clinicId: string
}

export function StaffList({ staffList, clinicId }: StaffListProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffWithStats | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleToggleActive(staffId: string, isActive: boolean) {
    await fetch(`/api/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
  }

  async function handleDelete(staff: StaffWithStats) {
    const msg = messages.staff.deleteConfirm.replace("{name}", staff.name)
    if (!confirm(msg)) return

    setDeletingId(staff.id)
    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: "DELETE" })
      if (!res.ok) {
        alert(messages.staff.deleteFailed)
        return
      }
      router.refresh()
    } finally {
      setDeletingId(null)
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
                <div>
                  <h3 className="font-semibold">{staff.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {STAFF_ROLE_LABELS[staff.role] ?? staff.role}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    staff.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {staff.isActive ? messages.staff.active : messages.staff.inactive}
                </span>
              </div>

              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">
                  {messages.staff.surveyCollected} : {staff.surveyCount}件
                </span>
              </div>

              <div className="mt-3 flex gap-2">
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
                  onClick={() => handleToggleActive(staff.id, staff.isActive)}
                >
                  {staff.isActive ? messages.staff.deactivate : messages.staff.activate}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(staff)}
                  disabled={deletingId === staff.id}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  {messages.staff.delete}
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
    </>
  )
}
