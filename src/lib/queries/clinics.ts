import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { ClinicSettings } from "@/types"

/**
 * Settings JSONB の安全な部分更新
 * 最新のsettingsを読み取り、部分マージして保存する。
 * 同時リクエストでの上書きリスクを軽減するため、1関数に集約。
 */
export async function updateClinicSettings(
  clinicId: string,
  patch: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const existing = (clinic?.settings ?? {}) as ClinicSettings
  const merged = { ...existing, ...patch }
  // Remove keys explicitly set to undefined (e.g., dailyTip reset)
  for (const key of Object.keys(merged) as Array<keyof ClinicSettings>) {
    if (merged[key] === undefined) delete merged[key]
  }
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { settings: merged as unknown as Prisma.InputJsonValue },
  })
  return merged
}

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
  search?: string
}) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const skip = (page - 1) * limit
  const search = options?.search?.trim()

  const where: Prisma.ClinicWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}

  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
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
    prisma.clinic.count({ where }),
  ])

  return { clinics, total, page, limit, totalPages: Math.ceil(total / limit) }
}
