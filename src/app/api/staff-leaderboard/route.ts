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
    take: 100,
  })

  if (staffList.length === 0) {
    return successResponse([])
  }

  const staffIds = staffList.map((s) => s.id)

  // Aggregate per-staff: count only (score is clinic-wide, not attributable to individual staff)
  const [totalStats, monthStats] = await Promise.all([
    prisma.surveyResponse.groupBy({
      by: ["staffId"],
      where: { clinicId, staffId: { in: staffIds } },
      _count: { _all: true },
    }),
    prisma.surveyResponse.groupBy({
      by: ["staffId"],
      where: { clinicId, staffId: { in: staffIds }, respondedAt: { gte: monthStart } },
      _count: { _all: true },
    }),
  ])

  const totalMap = new Map(totalStats.map((s) => [s.staffId, s]))
  const monthMap = new Map(monthStats.map((s) => [s.staffId, s]))

  const leaderboard = staffList
    .map((staff) => {
      const total = totalMap.get(staff.id)
      const month = monthMap.get(staff.id)
      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        totalCount: total?._count._all ?? 0,
        monthCount: month?._count._all ?? 0,
      }
    })
    .filter((s) => s.totalCount > 0 || s.monthCount > 0)

  // Sort by month count descending, then by name for stability
  leaderboard.sort((a, b) => b.monthCount - a.monthCount || a.name.localeCompare(b.name))

  return successResponse(leaderboard)
}
