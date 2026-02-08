import { auth } from "@/auth"
import { errorResponse } from "@/lib/api-helpers"
import type { UserRole } from "@/types"

interface AuthResult {
  user: {
    id: string
    role: string
    clinicId: string | null
    name?: string | null
    email?: string | null
  }
}

/**
 * API Route用の認証チェック。
 * 認証されていない場合は401エラーレスポンスを返す。
 */
export async function requireAuth(): Promise<AuthResult | Response> {
  const session = await auth()

  if (!session?.user) {
    return errorResponse("認証が必要です", 401)
  }

  return { user: session.user }
}

/**
 * 特定ロール以上の権限チェック。
 * 権限不足の場合は403エラーレスポンスを返す。
 */
export async function requireRole(
  ...roles: UserRole[]
): Promise<AuthResult | Response> {
  const result = await requireAuth()

  if (result instanceof Response) {
    return result
  }

  if (!roles.includes(result.user.role as UserRole)) {
    return errorResponse("アクセス権限がありません", 403)
  }

  return result
}

/**
 * クリニック管理者の認証チェック。
 * 自分のクリニックのみアクセス可能であることを確認する。
 */
export async function requireClinicAccess(
  clinicId: string
): Promise<AuthResult | Response> {
  const result = await requireAuth()

  if (result instanceof Response) {
    return result
  }

  // system_admin は全クリニックにアクセス可能
  if (result.user.role === "system_admin") {
    return result
  }

  // clinic_admin は自分のクリニックのみ
  if (result.user.clinicId !== clinicId) {
    return errorResponse("アクセス権限がありません", 403)
  }

  return result
}

/**
 * レスポンスがエラーかどうかをチェックするヘルパー
 */
export function isAuthError(result: AuthResult | Response): result is Response {
  return result instanceof Response
}
