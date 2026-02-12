import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import {
  getStaffMonthlyTallies,
  getClinicMonthlyTallyTotals,
} from "@/lib/queries/tallies"

export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const yearParam = request.nextUrl.searchParams.get("year")
  const monthParam = request.nextUrl.searchParams.get("month")
  const now = new Date()
  const year = yearParam ? parseInt(yearParam) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

  // Fetch current and previous month
  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  const [staffMetrics, clinicTotals, prevTotals] = await Promise.all([
    getStaffMonthlyTallies(clinicId, year, month),
    getClinicMonthlyTallyTotals(clinicId, year, month),
    getClinicMonthlyTallyTotals(clinicId, prevYear, prevMonth),
  ])

  const hasPrev = prevTotals.newPatientCount > 0 || prevTotals.selfPayProposalCount > 0

  return successResponse({
    staffMetrics,
    clinicTotals,
    prevTotals: hasPrev ? prevTotals : null,
  })
}
