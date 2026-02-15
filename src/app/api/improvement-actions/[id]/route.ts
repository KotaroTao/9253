import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * PATCH /api/improvement-actions/[id]
 * Update an improvement action (status change, result score, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const { id } = await params

  try {
    // Verify action belongs to clinic
    const existing = await prisma.improvementAction.findFirst({
      where: { id, clinicId },
    })
    if (!existing) {
      return errorResponse(messages.errors.invalidInput, 404)
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim()
    }
    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null
    }
    if (typeof body.resultScore === "number") {
      if (body.resultScore < 1 || body.resultScore > 5) {
        return errorResponse(messages.improvementActions.scoreOutOfRange, 400)
      }
      updateData.resultScore = body.resultScore
    }
    if (typeof body.status === "string" && ["active", "completed", "cancelled"].includes(body.status)) {
      updateData.status = body.status
      if (body.status === "completed" || body.status === "cancelled") {
        updateData.completedAt = new Date()
      }
      if (body.status === "active") {
        updateData.completedAt = null
      }
    }

    const action = await prisma.improvementAction.update({
      where: { id },
      data: updateData,
    })

    return successResponse(action)
  } catch {
    return errorResponse(messages.improvementActions.updateFailed, 500)
  }
}

/**
 * DELETE /api/improvement-actions/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const { id } = await params

  const existing = await prisma.improvementAction.findFirst({
    where: { id, clinicId },
  })
  if (!existing) {
    return errorResponse(messages.errors.invalidInput, 404)
  }

  await prisma.improvementAction.delete({ where: { id } })
  return successResponse({ success: true })
}
