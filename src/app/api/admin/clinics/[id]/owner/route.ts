import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
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
    select: {
      ownerUserId: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  if (!clinic) {
    return errorResponse("クリニックが見つかりません", 404)
  }

  // クリニックのclinic_adminユーザー一覧（オーナー候補）
  const admins = await prisma.user.findMany({
    where: { clinicId: id, role: "clinic_admin", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })

  return successResponse({
    owner: clinic.owner,
    admins,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  let body: { ownerUserId?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse("リクエストが不正です", 400)
  }

  const { ownerUserId } = body
  if (!ownerUserId) {
    return errorResponse("オーナーユーザーIDが必要です", 400)
  }

  // ユーザーが対象クリニックのclinic_adminであることを確認
  const user = await prisma.user.findFirst({
    where: { id: ownerUserId, clinicId: id, role: "clinic_admin", isActive: true },
  })
  if (!user) {
    return errorResponse("指定されたユーザーはこのクリニックの管理者ではありません", 400)
  }

  await prisma.clinic.update({
    where: { id },
    data: { ownerUserId },
  })

  return successResponse({ message: "オーナーを変更しました" })
}
