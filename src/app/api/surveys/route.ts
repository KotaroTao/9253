import { NextRequest } from "next/server"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { errorResponse, successResponse } from "@/lib/api-helpers"
import { ROLES } from "@/lib/constants"
import { getSurveyResponses } from "@/lib/queries/surveys"

export async function GET(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result

  if (user.role === ROLES.STAFF) {
    return errorResponse("アクセス権限がありません", 403)
  }

  const clinicId = user.clinicId
  if (!clinicId) {
    return errorResponse("クリニックが見つかりません", 400)
  }

  const params = request.nextUrl.searchParams
  const page = Math.max(1, Number(params.get("page")) || 1)
  const limit = Math.min(50, Math.max(1, Number(params.get("limit")) || 20))

  const data = await getSurveyResponses(clinicId, { page, limit })

  return successResponse(data)
}
