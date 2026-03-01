import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getCurrentSatisfactionScore, getQuestionCurrentScore } from "@/lib/queries/stats"
import { parseOffsetParams, calcOffsetMeta } from "@/lib/pagination"

/**
 * GET /api/improvement-actions
 * List improvement actions for the clinic (with logs).
 * Supports optional offset pagination (?page=&limit=). Default: all (up to 200).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const { page, limit } = parseOffsetParams(request.nextUrl.searchParams, { limit: 200, maxLimit: 200 })
  const skip = (page - 1) * limit

  const actions = await prisma.improvementAction.findMany({
    where: { clinicId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip,
    take: limit,
    include: {
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  // 遅延カウント: 1ページ目でlimit未満ならtotalは確定（countクエリ不要）
  const total = actions.length < limit && skip === 0
    ? actions.length
    : await prisma.improvementAction.count({ where: { clinicId } })

  return successResponse({ items: actions, ...calcOffsetMeta(total, { page, limit }) })
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
    const { title, description, targetQuestion, targetQuestionId } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return errorResponse(messages.errors.invalidInput, 400)
    }

    // Auto-capture current scores
    const [currentScore, questionScore] = await Promise.all([
      getCurrentSatisfactionScore(clinicId),
      targetQuestionId ? getQuestionCurrentScore(clinicId, targetQuestionId) : Promise.resolve(null),
    ])

    const action = await prisma.improvementAction.create({
      data: {
        clinicId,
        title: title.trim(),
        description: description?.trim() || null,
        targetQuestion: targetQuestion?.trim() || null,
        targetQuestionId: targetQuestionId?.trim() || null,
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
