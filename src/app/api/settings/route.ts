import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateClinicSchema } from "@/lib/validations/clinic"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse("クリニックが関連付けられていません", 400)
  }

  try {
    const body = await request.json()
    const parsed = updateClinicSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("入力内容に不備があります", 400)
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: parsed.data,
    })

    return successResponse(clinic)
  } catch {
    return errorResponse("設定の更新に失敗しました", 500)
  }
}
