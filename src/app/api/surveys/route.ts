import { NextRequest } from "next/server"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { errorResponse, successResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { ROLES } from "@/lib/constants"
import { getSurveyResponses } from "@/lib/queries/surveys"
import { parseOffsetParams } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result

  if (user.role === ROLES.STAFF) {
    return errorResponse(messages.errors.accessDenied, 403)
  }

  const clinicId = user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  const { page, limit } = parseOffsetParams(request.nextUrl.searchParams, { maxLimit: 50 })

  const data = await getSurveyResponses(clinicId, { page, limit })

  return successResponse(data)
}
