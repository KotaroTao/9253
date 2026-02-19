import { NextRequest } from "next/server"
import { requireAuth, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { getSegmentAnalysis } from "@/lib/queries/px-stats"

export async function GET(request: NextRequest) {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  const { user } = result
  if (!user.clinicId) {
    return errorResponse(messages.errors.clinicNotFound, 400)
  }

  const days = Number(request.nextUrl.searchParams.get("days") ?? "90")

  try {
    const segments = await getSegmentAnalysis(user.clinicId, days)
    return successResponse(segments)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}
