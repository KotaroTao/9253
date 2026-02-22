import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * POST /api/improvement-actions/[id]/logs
 * Add a progress note log to an improvement action
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const { id } = await params

  try {
    const existing = await prisma.improvementAction.findFirst({
      where: { id, clinicId, status: "active" },
    })
    if (!existing) {
      return errorResponse(messages.errors.invalidInput, 404)
    }

    const body = await request.json()
    const note = typeof body.note === "string" ? body.note.trim() : ""
    if (!note) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const log = await prisma.improvementActionLog.create({
      data: {
        improvementActionId: id,
        action: "note",
        note,
        satisfactionScore: null,
      },
    })

    return successResponse(log, 201)
  } catch {
    return errorResponse(messages.improvementActions.addLogFailed, 500)
  }
}
