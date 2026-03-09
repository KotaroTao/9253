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
  const [successMsg, setSuccessMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // パスワードリセット
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")

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

  async function handleResetPassword() {
    if (!staff || !newPassword) return
    setError("")
    setSuccessMsg("")
    setIsLoading(true)

    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        return
      }

      setSuccessMsg(messages.staff.passwordResetSuccess)
      setNewPassword("")
      setShowResetPassword(false)
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveLogin() {
    if (!staff) return
    if (!confirm(messages.staff.removeLoginConfirm)) return
    setError("")
    setSuccessMsg("")
    setIsLoading(true)

    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeLogin: true }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        return
      }

      setSuccessMsg(messages.staff.removeLoginSuccess)
      onSuccess()
    } catch {
      setError(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
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

          {/* ログイン設定（未設定の場合のみ：新規追加UI） */}
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

          {/* 既存ログイン管理（設定済みの場合） */}
          {hasExistingLogin && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">{messages.staff.loginSettings}</p>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{messages.staff.loginCurrentEmail}</p>
                <p className="text-sm">{staff.userEmail}</p>
              </div>

              {/* パスワードリセット */}
              {!showResetPassword ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetPassword(true)}
                  disabled={isLoading}
                >
                  {messages.staff.resetPassword}
                </Button>
              ) : (
                <div className="space-y-2 rounded border bg-muted/30 p-2">
                  <p className="text-xs text-muted-foreground">{messages.staff.resetPasswordDesc}</p>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={messages.staff.passwordMinLength}
                    minLength={6}
                    disabled={isLoading}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={isLoading || newPassword.length < 6}
                    >
                      {messages.staff.resetPassword}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowResetPassword(false); setNewPassword("") }}
                      disabled={isLoading}
                    >
                      {messages.common.cancel}
                    </Button>
                  </div>
                </div>
              )}

              {/* ログイン削除 */}
              <div className="pt-1 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleRemoveLogin}
                  disabled={isLoading}
                >
                  {messages.staff.removeLogin}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {successMsg}
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
