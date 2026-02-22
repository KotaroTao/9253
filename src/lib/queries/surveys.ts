import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function getClinicBySlug(slug: string) {
  return prisma.clinic.findUnique({
    where: { slug },
    include: {
      surveyTemplates: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function createSurveyResponse(data: {
  clinicId: string
  staffId?: string
  templateId: string
  answers: Prisma.InputJsonValue
  overallScore: number | null
  weightedScore?: number | null
  trustFactor?: number | null
  responseDurationMs?: number | null
  isVerified?: boolean
  deviceType?: string | null
  freeText?: string
  patientAttributes?: Prisma.InputJsonValue
  ipHash: string
}) {
  return prisma.surveyResponse.create({ data })
}

export async function hasRecentSubmission(
  ipHash: string,
  clinicId: string
): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 86400000)
  const count = await prisma.surveyResponse.count({
    where: {
      ipHash,
      clinicId,
      respondedAt: { gte: oneDayAgo },
    },
  })
  return count > 0
}

export async function getSurveyResponses(
  clinicId: string,
  options?: {
    page?: number
    limit?: number
    staffId?: string
    from?: Date
    to?: Date
  }
) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const skip = (page - 1) * limit

  const where = {
    clinicId,
    ...(options?.staffId && { staffId: options.staffId }),
    ...(options?.from &&
      options?.to && {
        respondedAt: { gte: options.from, lte: options.to },
      }),
  }

  const [responses, total] = await Promise.all([
    prisma.surveyResponse.findMany({
      where,
      orderBy: { respondedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        overallScore: true,
        freeText: true,
        patientAttributes: true,
        respondedAt: true,
        staff: { select: { name: true, role: true } },
        template: { select: { name: true } },
      },
    }),
    prisma.surveyResponse.count({ where }),
  ])

  return { responses, total, page, limit, totalPages: Math.ceil(total / limit) }
}
