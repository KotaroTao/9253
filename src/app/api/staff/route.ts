import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createStaffSchema } from "@/lib/validations/staff"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if (isAuthError(authResult)) return authResult

  try {
    const body = await request.json()
    const parsed = createStaffSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("入力内容に不備があります", 400)
    }

    const clinicId = body.clinicId || authResult.user.clinicId
    if (!clinicId) {
      return errorResponse("クリニックが指定されていません", 400)
    }

    // clinic_admin can only create staff in their own clinic
    if (
      authResult.user.role === "clinic_admin" &&
      authResult.user.clinicId !== clinicId
    ) {
      return errorResponse("アクセス権限がありません", 403)
    }

    const staff = await prisma.staff.create({
      data: {
        clinicId,
        name: parsed.data.name,
        role: parsed.data.role,
      },
    })

    return successResponse(staff, 201)
  } catch {
    return errorResponse("スタッフの作成に失敗しました", 500)
  }
}
