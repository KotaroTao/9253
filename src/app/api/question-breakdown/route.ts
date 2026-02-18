import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getQuestionBreakdownByDays } from "@/lib/queries/stats"
import { NextRequest } from "next/server"

const ALLOWED_DAYS = [7, 30, 90, 180, 365]

/**
 * GET /api/question-breakdown?days=30
 * Returns per-question avg scores grouped by template for the given period
 */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const daysParam = request.nextUrl.searchParams.get("days")
  const days = daysParam ? parseInt(daysParam, 10) : 30
  if (!ALLOWED_DAYS.includes(days)) {
    return errorResponse("無効な期間です", 400)
  }

  const data = await getQuestionBreakdownByDays(clinicId, days)
  return successResponse(data)
}
