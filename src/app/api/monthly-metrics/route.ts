import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { prisma } from "@/lib/prisma"
import { getMonthlySurveyCount } from "@/lib/queries/stats"
import { calcWorkingDays } from "@/lib/metrics-utils"
import type { ClinicSettings } from "@/types"

const METRICS_SELECT = {
  firstVisitCount: true,
  revisitCount: true,
  insuranceRevenue: true,
  selfPayRevenue: true,
  cancellationCount: true,
} as const

const PROFILE_SELECT = {
  chairCount: true,
  dentistCount: true,
  hygienistCount: true,
  totalVisitCount: true,
  workingDays: true,
  laborCost: true,
} as const

const FULL_SELECT = {
  ...METRICS_SELECT,
  ...PROFILE_SELECT,
} as const

export async function GET(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const yearParam = request.nextUrl.searchParams.get("year")
  const monthParam = request.nextUrl.searchParams.get("month")

  // trend mode: return N months of data (default 12) or custom range
  if (request.nextUrl.searchParams.get("mode") === "trend") {
    const fromMonth = request.nextUrl.searchParams.get("fromMonth") // YYYY-MM
    const toMonth = request.nextUrl.searchParams.get("toMonth")     // YYYY-MM

    if (fromMonth && toMonth) {
      const [fy, fm] = fromMonth.split("-").map(Number)
      const [ty, tm] = toMonth.split("-").map(Number)
      if (!fy || !fm || !ty || !tm) return errorResponse("無効な月指定です", 400)
      const rows = await prisma.monthlyClinicMetrics.findMany({
        where: {
          clinicId,
          OR: [
            { year: { gt: fy, lt: ty } },
            { year: fy, month: { gte: fm } },
            ...(fy !== ty ? [{ year: ty, month: { lte: tm } }] : []),
          ],
        },
        select: { year: true, month: true, ...FULL_SELECT },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      })
      return successResponse(rows)
    }

    const monthsParam = request.nextUrl.searchParams.get("months")
    const take = monthsParam ? Math.min(Math.max(parseInt(monthsParam) || 12, 1), 360) : 12
    const rows = await prisma.monthlyClinicMetrics.findMany({
      where: { clinicId },
      select: { year: true, month: true, ...FULL_SELECT },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take,
    })
    return successResponse(rows.reverse())
  }

  const now = new Date()
  const year = yearParam ? parseInt(yearParam) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

  // Fetch current and previous month
  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  const [summary, prevSummary, surveyCount, clinic] =
    await Promise.all([
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year, month } },
        select: FULL_SELECT,
      }),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: FULL_SELECT,
      }),
      getMonthlySurveyCount(clinicId, year, month),
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { unitCount: true, settings: true },
      }),
    ])

  // 診療日数の自動算出
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const autoWorkingDays = calcWorkingDays(
    year, month,
    settings.regularClosedDays ?? [],
    settings.closedDates ?? [],
    settings.openDates ?? [],
  )

  // 医院体制の前月値からの自動コピー候補
  const profileDefaults = {
    chairCount: prevSummary?.chairCount ?? clinic?.unitCount ?? null,
    dentistCount: prevSummary?.dentistCount ?? null,
    hygienistCount: prevSummary?.hygienistCount ?? null,
  }

  return successResponse({
    summary: summary ?? null,
    prevSummary: prevSummary?.firstVisitCount != null ? prevSummary : null,
    surveyCount,
    autoWorkingDays,
    profileDefaults,
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
  const { year, month } = body

  if (typeof year !== "number" || typeof month !== "number" || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const clampInt = (v: unknown) => v != null ? Math.max(0, Math.round(Number(v))) : null
  const clampFloat = (v: unknown) => v != null ? Math.max(0, Math.round(Number(v) * 10) / 10) : null

  const firstVisitCount = clampInt(body.firstVisitCount)
  const revisitCount = clampInt(body.revisitCount)
  const insuranceRevenue = clampInt(body.insuranceRevenue)
  const selfPayRevenue = clampInt(body.selfPayRevenue)
  const cancellationCount = clampInt(body.cancellationCount)

  // New fields
  const chairCount = clampInt(body.chairCount)
  const dentistCount = clampFloat(body.dentistCount)
  const hygienistCount = clampFloat(body.hygienistCount)
  const totalVisitCount = clampInt(body.totalVisitCount)
  const workingDays = clampInt(body.workingDays)
  const laborCost = clampInt(body.laborCost)

  // Auto-compute totalRevenue from components
  const totalRevenue = insuranceRevenue != null && selfPayRevenue != null
    ? insuranceRevenue + selfPayRevenue : null

  const data = {
    firstVisitCount,
    revisitCount,
    totalRevenue,
    insuranceRevenue,
    selfPayRevenue,
    cancellationCount,
    chairCount,
    dentistCount,
    hygienistCount,
    totalVisitCount,
    workingDays,
    laborCost,
  }

  const result = await prisma.monthlyClinicMetrics.upsert({
    where: { clinicId_year_month: { clinicId, year, month } },
    update: data,
    create: { clinicId, year, month, ...data },
    select: FULL_SELECT,
  })

  return successResponse(result)
}
