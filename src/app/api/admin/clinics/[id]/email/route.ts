import { NextRequest } from "next/server"
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

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  // クリニックのclinic_adminユーザー一覧（メール確認用）
  const admins = await prisma.user.findMany({
    where: { clinicId: id, role: "clinic_admin" },
    select: { id: true, name: true, email: true, isActive: true },
    orderBy: { createdAt: "asc" },
  })

  return successResponse({ admins })
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

  // 対象ユーザーがこのクリニックのclinic_adminであることを確認
  const user = await prisma.user.findFirst({
    where: { id: userId, clinicId: id, role: "clinic_admin" },
  })
  if (!user) {
    return errorResponse(messages.apiErrors.userNotClinicAdmin, 400)
  }

  // 同じメールなら何もしない
  if (user.email === trimmedEmail) {
    return successResponse({ email: user.email })
  }

  // メール重複チェック
  const existing = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  })
  if (existing) {
    return errorResponse(messages.auth.emailAlreadyUsed, 400)
  }

  // メール更新
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { email: trimmedEmail },
    select: { email: true },
  })

  return successResponse({ email: updated.email })
}
