import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getTemplateTrend } from "@/lib/queries/stats"
import { jstParseDate, jstParseDateEnd } from "@/lib/date-jst"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const ALLOWED_DAYS = [7, 30, 90, 180, 365]
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/template-trend?days=30&offset=0
 * GET /api/template-trend?from=2025-06-01&to=2025-12-31
 */
export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const sp = request.nextUrl.searchParams
  const fromStr = sp.get("from")
  const toStr = sp.get("to")

  if (fromStr && toStr) {
    if (!DATE_REGEX.test(fromStr) || !DATE_REGEX.test(toStr)) {
      return errorResponse("無効な日付形式です", 400)
    }
    const fromDate = jstParseDate(fromStr)
    const toDate = jstParseDateEnd(toStr)
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
      return errorResponse("無効な日付範囲です", 400)
    }
    const data = await getTemplateTrend(clinicId, 0, 0, fromDate, toDate)
    return successResponse(data)
  }

  const daysParam = sp.get("days")
  const days = daysParam ? parseInt(daysParam, 10) : 30
  if (!ALLOWED_DAYS.includes(days)) {
    return errorResponse("無効な期間です", 400)
  }

  const offsetParam = sp.get("offset")
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0
  if (offset < 0 || offset > 730) {
    return errorResponse("無効なオフセットです", 400)
  }

  const data = await getTemplateTrend(clinicId, days, offset)
  return successResponse(data)
}
