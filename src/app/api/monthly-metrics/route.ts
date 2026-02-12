import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { monthlyMetricsSchema } from "@/lib/validations/staff-survey"
import { upsertMonthlyMetrics, getMonthlyMetrics } from "@/lib/queries/monthly-metrics"

export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const metrics = await getMonthlyMetrics(clinicId)
  return successResponse(metrics)
}

export async function POST(request: Request) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const body = await request.json()
  const parsed = monthlyMetricsSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const metrics = await upsertMonthlyMetrics(clinicId, parsed.data)
  return successResponse(metrics)
}
