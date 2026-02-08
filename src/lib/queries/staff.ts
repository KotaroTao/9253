import { prisma } from "@/lib/prisma"

export async function getStaffByClinic(
  clinicId: string,
  includeInactive = false
) {
  return prisma.staff.findMany({
    where: {
      clinicId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { surveyResponses: true },
      },
    },
  })
}

export async function getStaffWithStats(clinicId: string) {
  const [staff, stats] = await Promise.all([
    prisma.staff.findMany({
      where: { clinicId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.surveyResponse.groupBy({
      by: ["staffId"],
      where: { clinicId },
      _count: { id: true },
      _avg: { overallScore: true },
    }),
  ])

  const statsMap = new Map(
    stats.map((s) => [
      s.staffId,
      {
        surveyCount: s._count.id,
        avgScore: s._avg.overallScore
          ? Math.round(s._avg.overallScore * 10) / 10
          : 0,
      },
    ])
  )

  return staff.map((s) => {
    const stat = statsMap.get(s.id)
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      qrToken: s.qrToken,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      surveyCount: stat?.surveyCount ?? 0,
      avgScore: stat?.avgScore ?? 0,
    }
  })
}
