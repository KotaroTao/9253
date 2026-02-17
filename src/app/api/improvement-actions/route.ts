import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getCurrentSatisfactionScore } from "@/lib/queries/stats"

/**
 * GET /api/improvement-actions
 * List improvement actions for the clinic (with logs)
 */
export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const actions = await prisma.improvementAction.findMany({
    where: { clinicId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  return successResponse(actions)
}

/**
 * POST /api/improvement-actions
 * Create a new improvement action (with auto-captured satisfaction score log)
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

    // Validate score range (1-5)
    const isValidScore = (v: unknown): v is number =>
      typeof v === "number" && v >= 1 && v <= 5
    const parsedBaseline = typeof baselineScore === "number" ? baselineScore : null
    const parsedTarget = typeof targetScore === "number" ? targetScore : null
    if ((parsedBaseline !== null && !isValidScore(parsedBaseline)) ||
        (parsedTarget !== null && !isValidScore(parsedTarget))) {
      return errorResponse(messages.improvementActions.scoreOutOfRange, 400)
    }

    // Auto-capture current satisfaction score
    const currentScore = await getCurrentSatisfactionScore(clinicId)

    const action = await prisma.improvementAction.create({
      data: {
        clinicId,
        title: title.trim(),
        description: description?.trim() || null,
        targetQuestion: targetQuestion?.trim() || null,
        baselineScore: parsedBaseline,
        targetScore: parsedTarget,
        logs: {
          create: {
            action: "started",
            satisfactionScore: currentScore,
          },
        },
      },
      include: { logs: { orderBy: { createdAt: "asc" } } },
    })

    return successResponse(action, 201)
  } catch {
    return errorResponse(messages.improvementActions.createFailed, 500)
  }
}
