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
  const hasExistingLogin = isEdit && staff.hasLogin
  const [name, setName] = useState(staff?.name ?? "")
  const [role, setRole] = useState(staff?.role ?? "staff")
  const [enableLogin, setEnableLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userRole, setUserRole] = useState<"staff" | "clinic_admin">("staff")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const url = isEdit ? `/api/staff/${staff.id}` : "/api/staff"
      const method = isEdit ? "PATCH" : "POST"

      const payload: Record<string, unknown> = { name, role, clinicId }
      if (enableLogin && !hasExistingLogin) {
        payload.email = email
        payload.password = password
        payload.userRole = userRole
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

          {/* ログイン設定（未設定の場合のみ表示） */}
          {!hasExistingLogin && (
            <div className="space-y-3 rounded-md border p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLogin}
                  onChange={(e) => setEnableLogin(e.target.checked)}
                  disabled={isLoading}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium">{messages.staff.enableLogin}</span>
                  <p className="text-xs text-muted-foreground">{messages.staff.enableLoginDesc}</p>
                </div>
              </label>

              {enableLogin && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm">{messages.staff.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={enableLogin}
                      disabled={isLoading}
                      placeholder="staff@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-sm">{messages.staff.password}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={enableLogin}
                      disabled={isLoading}
                      minLength={6}
                      placeholder={messages.staff.passwordMinLength}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="userRole" className="text-sm">{messages.staff.userRole}</Label>
                    <select
                      id="userRole"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as "staff" | "clinic_admin")}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="staff">{messages.staff.userRoleStaff}</option>
                      <option value="clinic_admin">{messages.staff.userRoleAdmin}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

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
