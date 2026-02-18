import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getTemplateTrend } from "@/lib/queries/stats"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const ALLOWED_DAYS = [7, 30, 90, 180, 365]

/**
 * GET /api/template-trend?days=30&offset=0
 * Returns daily avg satisfaction score per template type
 * offset: shift the window back by N days (e.g. offset=30 with days=30 → 60〜30日前)
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

  const offsetParam = request.nextUrl.searchParams.get("offset")
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0
  if (offset < 0 || offset > 730) {
    return errorResponse("無効なオフセットです", 400)
  }

  const data = await getTemplateTrend(clinicId, days, offset)
  return successResponse(data)
}
