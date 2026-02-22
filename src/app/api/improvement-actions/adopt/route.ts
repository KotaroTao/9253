import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getCurrentSatisfactionScore, getQuestionCurrentScore } from "@/lib/queries/stats"

/**
 * POST /api/improvement-actions/adopt
 * Adopt a platform improvement action for the clinic.
 * Creates a new ImprovementAction linked to the platform action.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  try {
    const body = await request.json()
    const { platformActionId, targetQuestionId } = body

    if (!platformActionId || typeof platformActionId !== "string") {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Fetch the platform action
    const platformAction = await prisma.platformImprovementAction.findUnique({
      where: { id: platformActionId },
    })
    if (!platformAction || !platformAction.isActive) {
      return errorResponse(messages.errors.notFound, 404)
    }

    // Check if already adopted
    const existing = await prisma.improvementAction.findFirst({
      where: { clinicId, platformActionId, status: "active" },
    })
    if (existing) {
      return errorResponse(messages.platformActions.adopted, 409)
    }

    // Resolve target question text from templates
    let targetQuestion: string | null = null
    if (targetQuestionId) {
      const templates = await prisma.surveyTemplate.findMany({
        where: { clinicId, isActive: true },
        select: { questions: true },
      })
      for (const t of templates) {
        const questions = t.questions as Array<{ id: string; text: string; type: string }>
        const q = questions.find((q) => q.id === targetQuestionId)
        if (q) {
          targetQuestion = q.text
          break
        }
      }
    }

    // Auto-capture current scores
    const [currentScore, questionScore] = await Promise.all([
      getCurrentSatisfactionScore(clinicId),
      targetQuestionId ? getQuestionCurrentScore(clinicId, targetQuestionId) : Promise.resolve(null),
    ])

    const action = await prisma.improvementAction.create({
      data: {
        clinicId,
        platformActionId,
        title: platformAction.title,
        description: platformAction.description,
        targetQuestion,
        targetQuestionId: targetQuestionId || null,
        baselineScore: questionScore,
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
