import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateStaffSchema } from "@/lib/validations/staff"
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

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
      return errorResponse(messages.errors.staffNotFound, 404)
    }

    if (
      authResult.user.role === "clinic_admin" &&
      authResult.user.clinicId !== existing.clinicId
    ) {
      return errorResponse(messages.errors.accessDenied, 403)
    }

    const body = await request.json()
    const parsed = updateStaffSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return successResponse(staff)
  } catch {
    return errorResponse(messages.errors.staffUpdateFailed, 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const existing = await prisma.staff.findUnique({
      where: { id: params.id },
      select: { clinicId: true },
    })

    if (!existing) {
      return errorResponse(messages.errors.staffNotFound, 404)
    }

    if (
      authResult.user.role === "clinic_admin" &&
      authResult.user.clinicId !== existing.clinicId
    ) {
      return errorResponse(messages.errors.accessDenied, 403)
    }

    // アンケート回答データを保護: staffId を null に設定してから削除
    await prisma.$transaction([
      prisma.surveyResponse.updateMany({
        where: { staffId: params.id },
        data: { staffId: null },
      }),
      prisma.user.updateMany({
        where: { staffId: params.id },
        data: { staffId: null },
      }),
      prisma.staff.delete({ where: { id: params.id } }),
    ])

    return successResponse({ deleted: true })
  } catch {
    return errorResponse(messages.errors.staffDeleteFailed, 500)
  }
}
