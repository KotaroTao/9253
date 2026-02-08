"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import { STAFF_ROLE_LABELS } from "@/lib/constants"
import type { StaffWithStats } from "@/types"

interface StaffFormDialogProps {
  clinicId: string
  staff?: StaffWithStats
  onClose: () => void
  onSuccess: () => void
}

export function StaffFormDialog({
  clinicId,
  staff,
  onClose,
  onSuccess,
}: StaffFormDialogProps) {
  const isEdit = !!staff
  const [name, setName] = useState(staff?.name ?? "")
  const [role, setRole] = useState(staff?.role ?? "staff")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const url = isEdit ? `/api/staff/${staff.id}` : "/api/staff"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, clinicId }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        return
      }

      onSuccess()
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {isEdit ? messages.staff.editStaff : messages.staff.addStaff}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{messages.staff.name}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{messages.staff.role}</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? messages.common.loading : messages.common.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
