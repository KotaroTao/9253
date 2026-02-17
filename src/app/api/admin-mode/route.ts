import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse } from "@/lib/api-helpers"
import { setStaffViewCookie, clearStaffViewCookie } from "@/lib/admin-mode"

/**
 * POST: スタッフビューに切替（clinic_admin/system_admin用）
 */
export async function POST() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  setStaffViewCookie()
  return successResponse({ success: true })
}

/**
 * DELETE: 管理者ビューに戻す（スタッフビューCookieを削除）
 */
export async function DELETE() {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  clearStaffViewCookie()
  return successResponse({ success: true })
}
