import { NextRequest } from "next/server"
import { Prisma } from "@prisma/client"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  // clinic存在チェックとadmin一覧を1クエリで取得
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: {
      id: true,
      users: {
        where: { role: "clinic_admin" },
        select: { id: true, name: true, email: true, isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  return successResponse({ admins: clinic.users })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  let body: { userId?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.apiErrors.invalidRequest, 400)
  }

  const { userId, email } = body

  if (!userId || !email) {
    return errorResponse(messages.apiErrors.invalidRequest, 400)
  }

  const trimmedEmail = email.trim().toLowerCase()

  // メール形式バリデーション
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return errorResponse(messages.auth.emailRequired, 400)
  }

  // ユーザー検証とメール重複チェックを並列実行
  const [user, existing] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, clinicId: id, role: "clinic_admin" },
      select: { id: true, email: true },
    }),
    prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    }),
  ])

  if (!user) {
    return errorResponse(messages.apiErrors.userNotClinicAdmin, 400)
  }

  // 同じメールなら何もしない
  if (user.email === trimmedEmail) {
    return successResponse({ email: user.email })
  }

  // メール重複チェック
  if (existing) {
    return errorResponse(messages.auth.emailAlreadyUsed, 400)
  }

  // メール更新（unique制約違反をキャッチしてレースコンディションに対応）
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { email: trimmedEmail },
      select: { email: true },
    })
    return successResponse({ email: updated.email })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return errorResponse(messages.auth.emailAlreadyUsed, 400)
    }
    throw e
  }
}
