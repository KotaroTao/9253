import { prisma } from "@/lib/prisma"
import type { MonthlyMetrics } from "@/types"

export async function upsertMonthlyMetrics(
  clinicId: string,
  data: {
    year: number
    month: number
    newPatientCount?: number | null
    maintenanceTransitionCount?: number | null
    selfPayProposalCount?: number | null
    selfPayConversionCount?: number | null
  }
) {
  return prisma.monthlyClinicMetrics.upsert({
    where: {
      clinicId_year_month: {
        clinicId,
        year: data.year,
        month: data.month,
      },
    },
    update: {
      newPatientCount: data.newPatientCount,
      maintenanceTransitionCount: data.maintenanceTransitionCount,
      selfPayProposalCount: data.selfPayProposalCount,
      selfPayConversionCount: data.selfPayConversionCount,
    },
    create: {
      clinicId,
      ...data,
    },
  })
}

export async function getMonthlyMetrics(
  clinicId: string,
  months: number = 12
): Promise<MonthlyMetrics[]> {
  const records = await prisma.monthlyClinicMetrics.findMany({
    where: { clinicId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: months,
  })

  return records.map((r) => ({
    id: r.id,
    year: r.year,
    month: r.month,
    newPatientCount: r.newPatientCount,
    maintenanceTransitionCount: r.maintenanceTransitionCount,
    selfPayProposalCount: r.selfPayProposalCount,
    selfPayConversionCount: r.selfPayConversionCount,
    maintenanceRate:
      r.newPatientCount && r.maintenanceTransitionCount && r.newPatientCount > 0
        ? Math.round((r.maintenanceTransitionCount / r.newPatientCount) * 1000) / 10
        : null,
    selfPayRate:
      r.selfPayProposalCount && r.selfPayConversionCount && r.selfPayProposalCount > 0
        ? Math.round((r.selfPayConversionCount / r.selfPayProposalCount) * 1000) / 10
        : null,
  }))
}

export async function getMonthlyMetricsByYearMonth(
  clinicId: string,
  year: number,
  month: number
) {
  return prisma.monthlyClinicMetrics.findUnique({
    where: {
      clinicId_year_month: { clinicId, year, month },
    },
  })
}

export async function getLatestMonthlyMetrics(clinicId: string) {
  const record = await prisma.monthlyClinicMetrics.findFirst({
    where: { clinicId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })

  if (!record) return null

  return {
    year: record.year,
    month: record.month,
    maintenanceRate:
      record.newPatientCount && record.maintenanceTransitionCount && record.newPatientCount > 0
        ? Math.round((record.maintenanceTransitionCount / record.newPatientCount) * 1000) / 10
        : null,
    selfPayRate:
      record.selfPayProposalCount && record.selfPayConversionCount && record.selfPayProposalCount > 0
        ? Math.round((record.selfPayConversionCount / record.selfPayProposalCount) * 1000) / 10
        : null,
  }
}
