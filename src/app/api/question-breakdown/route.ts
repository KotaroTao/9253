import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse, parseDateRangeParams, parseAttributeFilters } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getQuestionBreakdownByDays } from "@/lib/queries/stats"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const MAX_DAYS = 10950 // 30 years

/**
 * GET /api/question-breakdown?days=30
 * GET /api/question-breakdown?from=2025-01-01&to=2025-06-30
 * Supports attribute filters: visitType, insuranceType, purpose, ageGroup, gender
 * Returns per-question avg scores grouped by template for the given period
 */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const params = request.nextUrl.searchParams
  const rangeResult = parseDateRangeParams(params, MAX_DAYS)
  if (rangeResult && "error" in rangeResult) return errorResponse(rangeResult.error, 400)
  const attrFilters = parseAttributeFilters(params)

  if (rangeResult) {
    const data = await getQuestionBreakdownByDays(clinicId, rangeResult.days, rangeResult.range, attrFilters)
    return successResponse(data)
  }

  const daysParam = params.get("days")
  const days = daysParam ? parseInt(daysParam, 10) : 30
  if (isNaN(days) || days < 1 || days > MAX_DAYS) {
    return errorResponse("無効な期間です", 400)
  }

  const data = await getQuestionBreakdownByDays(clinicId, days, undefined, attrFilters)
  return successResponse(data)
}
