import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getCurrentSatisfactionScore } from "@/lib/queries/stats"

/**
 * PATCH /api/improvement-actions/[id]
 * Update an improvement action (status change, result score, etc.)
 * Auto-records a log entry with current satisfaction score on status change.
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

    let statusChanged = false
    let newStatus: string | null = null
    if (typeof body.status === "string" && ["active", "completed", "cancelled"].includes(body.status)) {
      if (body.status !== existing.status) {
        statusChanged = true
        newStatus = body.status
      }
      updateData.status = body.status
      if (body.status === "completed" || body.status === "cancelled") {
        updateData.completedAt = new Date()
      }
      if (body.status === "active") {
        updateData.completedAt = null
      }
    }

    // Auto-capture satisfaction score on status change
    let currentScore: number | null = null
    if (statusChanged) {
      currentScore = await getCurrentSatisfactionScore(clinicId)
    }

    // Use transaction to update action and create log atomically
    const action = await prisma.$transaction(async (tx) => {
      const updated = await tx.improvementAction.update({
        where: { id },
        data: updateData,
        include: { logs: { orderBy: { createdAt: "asc" } } },
      })

      if (statusChanged && newStatus) {
        const logAction = newStatus === "active" ? "reactivated" : newStatus
        await tx.improvementActionLog.create({
          data: {
            improvementActionId: id,
            action: logAction,
            satisfactionScore: currentScore,
          },
        })
        // Re-fetch with updated logs
        return tx.improvementAction.findUniqueOrThrow({
          where: { id },
          include: { logs: { orderBy: { createdAt: "asc" } } },
        })
      }

      return updated
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
