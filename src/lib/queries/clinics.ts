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

/**
 * クリニックIDリストに対して、各クリニックの主要KPIをバッチ取得する。
 * 管理画面の一覧で各クリニックの状態を一目で把握するために使用。
 */
export interface ClinicHealthStats {
  clinicId: string
  avgScore: number | null
  thisMonthCount: number
  todayCount: number
  prevMonthAvg: number | null
  lastResponseAt: Date | null
}

export async function getClinicHealthBatch(clinicIds: string[]): Promise<Map<string, ClinicHealthStats>> {
  if (clinicIds.length === 0) return new Map()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  interface Row {
    clinic_id: string
    avg_score: number | null
    this_month_count: bigint
    today_count: bigint
    prev_month_avg: number | null
    last_response_at: Date | null
  }

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      clinic_id,
      ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${thisMonthStart})::numeric, 2)::float AS avg_score,
      COUNT(*) FILTER (WHERE responded_at >= ${thisMonthStart}) AS this_month_count,
      COUNT(*) FILTER (WHERE responded_at >= ${todayStart}) AS today_count,
      ROUND(AVG(overall_score) FILTER (WHERE responded_at >= ${prevMonthStart} AND responded_at <= ${prevMonthEnd})::numeric, 2)::float AS prev_month_avg,
      MAX(responded_at) AS last_response_at
    FROM survey_responses
    WHERE clinic_id = ANY(${clinicIds}::uuid[])
    GROUP BY clinic_id
  `

  const map = new Map<string, ClinicHealthStats>()
  // Initialize all clinics with defaults
  for (const id of clinicIds) {
    map.set(id, {
      clinicId: id,
      avgScore: null,
      thisMonthCount: 0,
      todayCount: 0,
      prevMonthAvg: null,
      lastResponseAt: null,
    })
  }
  // Fill in from DB results
  for (const row of rows) {
    map.set(row.clinic_id, {
      clinicId: row.clinic_id,
      avgScore: row.avg_score,
      thisMonthCount: Number(row.this_month_count),
      todayCount: Number(row.today_count),
      prevMonthAvg: row.prev_month_avg,
      lastResponseAt: row.last_response_at,
    })
  }

  return map
}
