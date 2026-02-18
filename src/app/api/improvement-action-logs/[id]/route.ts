import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * PATCH /api/improvement-action-logs/[id]
 * Update a log entry (satisfactionScore, note, createdAt)
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
    // Verify log belongs to clinic's action
    const existing = await prisma.improvementActionLog.findFirst({
      where: { id, improvementAction: { clinicId } },
    })
    if (!existing) {
      return errorResponse(messages.errors.invalidInput, 404)
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.satisfactionScore !== undefined) {
      if (body.satisfactionScore === null) {
        updateData.satisfactionScore = null
      } else {
        const score = Number(body.satisfactionScore)
        if (isNaN(score) || score < 1 || score > 5) {
          return errorResponse(messages.improvementActions.scoreOutOfRange, 400)
        }
        updateData.satisfactionScore = Math.round(score * 100) / 100
      }
    }

    if (typeof body.note === "string") {
      updateData.note = body.note.trim() || null
    }

    if (body.createdAt !== undefined) {
      const date = new Date(body.createdAt)
      if (isNaN(date.getTime())) {
        return errorResponse(messages.errors.invalidInput, 400)
      }
      updateData.createdAt = date
    }

    const updated = await prisma.improvementActionLog.update({
      where: { id },
      data: updateData,
    })

    return successResponse(updated)
  } catch {
    return errorResponse(messages.improvementActions.updateFailed, 500)
  }
}

/**
 * DELETE /api/improvement-action-logs/[id]
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

  const existing = await prisma.improvementActionLog.findFirst({
    where: { id, improvementAction: { clinicId } },
  })
  if (!existing) {
    return errorResponse(messages.errors.invalidInput, 404)
  }

  await prisma.improvementActionLog.delete({ where: { id } })
  return successResponse({ success: true })
}
