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
  const staff = await prisma.staff.findMany({
    where: { clinicId },
    orderBy: { createdAt: "asc" },
    include: {
      surveyResponses: {
        select: { overallScore: true },
      },
    },
  })

  return staff.map((s) => {
    const scores = s.surveyResponses
      .map((r) => r.overallScore)
      .filter((score): score is number => score !== null)
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0

    return {
      id: s.id,
      name: s.name,
      role: s.role,
      qrToken: s.qrToken,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      surveyCount: s.surveyResponses.length,
      avgScore,
    }
  })
}
