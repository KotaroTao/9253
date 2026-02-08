import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateStaffSchema } from "@/lib/validations/staff"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  try {
    // Check staff exists and belongs to user's clinic
    const existing = await prisma.staff.findUnique({
      where: { id: params.id },
      select: { clinicId: true },
    })

    if (!existing) {
      return errorResponse("スタッフが見つかりません", 404)
    }

    if (
      authResult.user.role === "clinic_admin" &&
      authResult.user.clinicId !== existing.clinicId
    ) {
      return errorResponse("アクセス権限がありません", 403)
    }

    const body = await request.json()
    const parsed = updateStaffSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("入力内容に不備があります", 400)
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return successResponse(staff)
  } catch {
    return errorResponse("スタッフの更新に失敗しました", 500)
  }
}
