import { prisma } from "@/lib/prisma"

export async function getClinicById(clinicId: string) {
  return prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      _count: {
        select: {
          staff: { where: { isActive: true } },
          surveyResponses: true,
        },
      },
    },
  })
}

export async function getAllClinics(options?: {
  page?: number
  limit?: number
}) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const skip = (page - 1) * limit

  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            staff: { where: { isActive: true } },
            surveyResponses: true,
          },
        },
      },
    }),
    prisma.clinic.count(),
  ])

  return { clinics, total, page, limit, totalPages: Math.ceil(total / limit) }
}
