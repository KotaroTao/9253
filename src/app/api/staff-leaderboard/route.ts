import { prisma } from "@/lib/prisma"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"

/**
 * GET /api/staff-leaderboard
 * Returns per-staff performance metrics (this month + total)
 */
export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) return errorResponse(messages.errors.clinicNotAssociated, 400)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get active staff
  const staffList = await prisma.staff.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { createdAt: "asc" },
  })

  if (staffList.length === 0) {
    return successResponse([])
  }

  const staffIds = staffList.map((s) => s.id)

  // Aggregate per-staff: total count + avg, this month count + avg
  const [totalStats, monthStats] = await Promise.all([
    prisma.surveyResponse.groupBy({
      by: ["staffId"],
      where: { clinicId, staffId: { in: staffIds } },
      _count: { _all: true },
      _avg: { overallScore: true },
    }),
    prisma.surveyResponse.groupBy({
      by: ["staffId"],
      where: { clinicId, staffId: { in: staffIds }, respondedAt: { gte: monthStart } },
      _count: { _all: true },
      _avg: { overallScore: true },
    }),
  ])

  const totalMap = new Map(totalStats.map((s) => [s.staffId, s]))
  const monthMap = new Map(monthStats.map((s) => [s.staffId, s]))

  const leaderboard = staffList.map((staff) => {
    const total = totalMap.get(staff.id)
    const month = monthMap.get(staff.id)
    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      totalCount: total?._count._all ?? 0,
      totalAvgScore: total?._avg.overallScore
        ? Math.round(total._avg.overallScore * 10) / 10
        : null,
      monthCount: month?._count._all ?? 0,
      monthAvgScore: month?._avg.overallScore
        ? Math.round(month._avg.overallScore * 10) / 10
        : null,
    }
  })

  // Sort by month count descending
  leaderboard.sort((a, b) => b.monthCount - a.monthCount)

  return successResponse(leaderboard)
}
