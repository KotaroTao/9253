import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * GET /api/admin/platform-actions
 * List all platform improvement actions (system_admin only)
 */
export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const actions = await prisma.platformImprovementAction.findMany({
    orderBy: [{ isPickup: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { clinicActions: true } },
    },
  })

  // Compute average improvement and completion reason breakdown for each platform action
  const result = await Promise.all(
    actions.map(async (action) => {
      const completedActions = await prisma.improvementAction.findMany({
        where: {
          platformActionId: action.id,
          status: "completed",
        },
        select: { baselineScore: true, resultScore: true, completionReason: true },
      })
      const withScores = completedActions.filter(
        (a) => a.baselineScore != null && a.resultScore != null
      )
      const avgImprovement =
        withScores.length > 0
          ? Math.round(
              (withScores.reduce(
                (sum, a) => sum + (a.resultScore! - a.baselineScore!),
                0
              ) /
                withScores.length) *
                100
            ) / 100
          : null

      // Completion reason breakdown
      const completionReasons: Record<string, number> = {}
      for (const a of completedActions) {
        const reason = a.completionReason || "none"
        completionReasons[reason] = (completionReasons[reason] || 0) + 1
      }

      return {
        ...action,
        adoptCount: action._count.clinicActions,
        avgImprovement,
        completedCount: completedActions.length,
        completionReasons,
      }
    })
  )

  return successResponse(result)
}

/**
 * POST /api/admin/platform-actions
 * Create a new platform improvement action (system_admin only)
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const body = await request.json()
    const {
      title,
      description,
      detailedContent,
      targetQuestionIds,
      category,
      isPickup,
      serviceUrl,
      serviceProvider,
      displayOrder,
    } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    const action = await prisma.platformImprovementAction.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        detailedContent: detailedContent?.trim() || null,
        targetQuestionIds: targetQuestionIds ?? null,
        category: category?.trim() || null,
        isPickup: isPickup === true,
        serviceUrl: serviceUrl?.trim() || null,
        serviceProvider: serviceProvider?.trim() || null,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      },
    })

    return successResponse(action, 201)
  } catch {
    return errorResponse(messages.improvementActions.createFailed, 500)
  }
}
