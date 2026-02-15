import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * GET /api/improvement-actions
 * List improvement actions for the clinic
 */
export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const actions = await prisma.improvementAction.findMany({
    where: { clinicId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return successResponse(actions)
}

/**
 * POST /api/improvement-actions
 * Create a new improvement action
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  try {
    const body = await request.json()
    const { title, description, targetQuestion, baselineScore, targetScore } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const action = await prisma.improvementAction.create({
      data: {
        clinicId,
        title: title.trim(),
        description: description?.trim() || null,
        targetQuestion: targetQuestion?.trim() || null,
        baselineScore: typeof baselineScore === "number" ? baselineScore : null,
        targetScore: typeof targetScore === "number" ? targetScore : null,
      },
    })

    return successResponse(action, 201)
  } catch {
    return errorResponse(messages.improvementActions.createFailed, 500)
  }
}
