import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { errorResponse, successResponse } from "@/lib/api-helpers"
import { ROLES } from "@/lib/constants"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result

  // スタッフロールは削除不可
  if (user.role === ROLES.STAFF) {
    return errorResponse("アクセス権限がありません", 403)
  }

  const clinicId = user.clinicId
  if (!clinicId) {
    return errorResponse("クリニックが見つかりません", 400)
  }

  // 対象の回答が自クリニックに属するか確認
  const response = await prisma.surveyResponse.findUnique({
    where: { id: params.id },
    select: { clinicId: true },
  })

  if (!response) {
    return errorResponse("アンケート回答が見つかりません", 404)
  }

  if (response.clinicId !== clinicId) {
    return errorResponse("アクセス権限がありません", 403)
  }

  await prisma.surveyResponse.delete({
    where: { id: params.id },
  })

  return successResponse({ success: true })
}
