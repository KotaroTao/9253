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

  // Compute average improvement for each platform action
  const result = await Promise.all(
    actions.map(async (action) => {
      const completedActions = await prisma.improvementAction.findMany({
        where: {
          platformActionId: action.id,
          status: "completed",
          baselineScore: { not: null },
          resultScore: { not: null },
        },
        select: { baselineScore: true, resultScore: true },
      })
      const avgImprovement =
        completedActions.length > 0
          ? Math.round(
              (completedActions.reduce(
                (sum, a) => sum + (a.resultScore! - a.baselineScore!),
                0
              ) /
                completedActions.length) *
                100
            ) / 100
          : null

      return {
        ...action,
        adoptCount: action._count.clinicActions,
        avgImprovement,
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
