import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import {
  getStaffMonthlyTallies,
  getClinicMonthlyTallyTotals,
} from "@/lib/queries/tallies"
import { getMonthlySurveyCount } from "@/lib/queries/stats"

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

  const [staffMetrics, clinicTotals, prevTotals, summary, prevSummary, surveyCount] =
    await Promise.all([
      getStaffMonthlyTallies(clinicId, year, month),
      getClinicMonthlyTallyTotals(clinicId, year, month),
      getClinicMonthlyTallyTotals(clinicId, prevYear, prevMonth),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year, month } },
        select: { totalVisits: true, totalRevenue: true, selfPayRevenue: true },
      }),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: { totalVisits: true, totalRevenue: true, selfPayRevenue: true },
      }),
      getMonthlySurveyCount(clinicId, year, month),
    ])

  const hasPrev = prevTotals.newPatientCount > 0 || prevTotals.selfPayProposalCount > 0

  return successResponse({
    staffMetrics,
    clinicTotals,
    prevTotals: hasPrev ? prevTotals : null,
    summary: summary ?? null,
    prevSummary: prevSummary?.totalVisits != null ? prevSummary : null,
    surveyCount,
  })
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const body = await request.json()
  const { year, month, totalVisits, totalRevenue, selfPayRevenue } = body

  if (!year || !month) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  // Validate: all values must be non-negative integers or null
  const visits = totalVisits != null ? Math.max(0, Math.round(totalVisits)) : null
  const revenue = totalRevenue != null ? Math.max(0, Math.round(totalRevenue)) : null
  const selfPay = selfPayRevenue != null ? Math.max(0, Math.round(selfPayRevenue)) : null

  // selfPayRevenue cannot exceed totalRevenue
  const safeSelfPay = revenue != null && selfPay != null ? Math.min(selfPay, revenue) : selfPay

  const result = await prisma.monthlyClinicMetrics.upsert({
    where: { clinicId_year_month: { clinicId, year, month } },
    update: {
      totalVisits: visits,
      totalRevenue: revenue,
      selfPayRevenue: safeSelfPay,
    },
    create: {
      clinicId,
      year,
      month,
      totalVisits: visits,
      totalRevenue: revenue,
      selfPayRevenue: safeSelfPay,
    },
    select: { totalVisits: true, totalRevenue: true, selfPayRevenue: true },
  })

  return successResponse(result)
}
