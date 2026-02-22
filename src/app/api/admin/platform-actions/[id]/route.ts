import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * PATCH /api/admin/platform-actions/[id]
 * Update a platform improvement action (system_admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const existing = await prisma.platformImprovementAction.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse(messages.errors.notFound, 404)
  }

  try {
    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim()
    }
    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null
    }
    if (typeof body.detailedContent === "string") {
      updateData.detailedContent = body.detailedContent.trim() || null
    }
    if (body.targetQuestionIds !== undefined) {
      updateData.targetQuestionIds = body.targetQuestionIds
    }
    if (typeof body.category === "string") {
      updateData.category = body.category.trim() || null
    }
    if (typeof body.isPickup === "boolean") {
      updateData.isPickup = body.isPickup
    }
    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive
    }
    if (typeof body.serviceUrl === "string") {
      updateData.serviceUrl = body.serviceUrl.trim() || null
    }
    if (typeof body.serviceProvider === "string") {
      updateData.serviceProvider = body.serviceProvider.trim() || null
    }
    if (typeof body.displayOrder === "number") {
      updateData.displayOrder = body.displayOrder
    }

    const action = await prisma.platformImprovementAction.update({
      where: { id },
      data: updateData,
    })

    return successResponse(action)
  } catch {
    return errorResponse(messages.improvementActions.updateFailed, 500)
  }
}

/**
 * DELETE /api/admin/platform-actions/[id]
 * Delete a platform improvement action (system_admin only)
 * Clinic actions with this platformActionId will have it set to null (onDelete: SetNull)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  const existing = await prisma.platformImprovementAction.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse(messages.errors.notFound, 404)
  }

  await prisma.platformImprovementAction.delete({ where: { id } })
  return successResponse({ success: true })
}
