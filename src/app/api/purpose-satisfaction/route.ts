import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse, parseDateRangeParams } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getPurposeSatisfaction } from "@/lib/queries/stats"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const MAX_DAYS = 10950 // 30 years

/**
 * GET /api/purpose-satisfaction?days=30
 * GET /api/purpose-satisfaction?from=2025-01-01&to=2025-06-30
 * Returns satisfaction breakdown by insuranceType x purpose
 */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const rangeResult = parseDateRangeParams(request.nextUrl.searchParams, MAX_DAYS)
  if (rangeResult && "error" in rangeResult) return errorResponse(rangeResult.error, 400)

  if (rangeResult) {
    const data = await getPurposeSatisfaction(clinicId, rangeResult.days, rangeResult.range)
    return successResponse(data)
  }

  const daysParam = request.nextUrl.searchParams.get("days")
  const days = daysParam ? parseInt(daysParam, 10) : 30
  if (isNaN(days) || days < 1 || days > MAX_DAYS) {
    return errorResponse("無効な期間です", 400)
  }

  const data = await getPurposeSatisfaction(clinicId, days)
  return successResponse(data)
}
