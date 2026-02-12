import { prisma } from "@/lib/prisma"
import type { TallyType } from "@/lib/constants"

function todayDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function incrementTally(
  staffId: string,
  clinicId: string,
  type: TallyType,
  delta: number
) {
  const date = todayDate()

  const existing = await prisma.staffDailyTally.findUnique({
    where: { staffId_date_type: { staffId, date, type } },
  })

  const newCount = Math.max(0, (existing?.count ?? 0) + delta)

  if (existing) {
    return prisma.staffDailyTally.update({
      where: { id: existing.id },
      data: { count: newCount },
    })
  }

  if (newCount <= 0) return null

  return prisma.staffDailyTally.create({
    data: { staffId, clinicId, date, type, count: newCount },
  })
}

export async function getTodayTallies(staffId: string) {
  const date = todayDate()

  const tallies = await prisma.staffDailyTally.findMany({
    where: { staffId, date },
  })

  const result: Record<string, number> = {
    new_patient: 0,
    maintenance_transition: 0,
    self_pay_proposal: 0,
    self_pay_conversion: 0,
  }

  for (const t of tallies) {
    result[t.type] = t.count
  }

  return result
}

export async function getStaffMonthlyTallies(
  clinicId: string,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // last day of month

  const tallies = await prisma.staffDailyTally.findMany({
    where: {
      clinicId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      staff: { select: { id: true, name: true, role: true } },
    },
  })

  // Group by staffId → type → sum
  const staffMap = new Map<
    string,
    {
      name: string
      role: string
      new_patient: number
      maintenance_transition: number
      self_pay_proposal: number
      self_pay_conversion: number
    }
  >()

  for (const t of tallies) {
    const existing = staffMap.get(t.staffId) ?? {
      name: t.staff.name,
      role: t.staff.role,
      new_patient: 0,
      maintenance_transition: 0,
      self_pay_proposal: 0,
      self_pay_conversion: 0,
    }
    if (t.type in existing) {
      ;(existing as Record<string, unknown>)[t.type] =
        ((existing as Record<string, unknown>)[t.type] as number) + t.count
    }
    staffMap.set(t.staffId, existing)
  }

  return Array.from(staffMap.entries()).map(([staffId, data]) => ({
    staffId,
    name: data.name,
    role: data.role,
    newPatientCount: data.new_patient,
    maintenanceTransitionCount: data.maintenance_transition,
    selfPayProposalCount: data.self_pay_proposal,
    selfPayConversionCount: data.self_pay_conversion,
    maintenanceRate:
      data.new_patient > 0
        ? Math.round((data.maintenance_transition / data.new_patient) * 1000) / 10
        : null,
    selfPayRate:
      data.self_pay_proposal > 0
        ? Math.round((data.self_pay_conversion / data.self_pay_proposal) * 1000) / 10
        : null,
  }))
}

export async function getClinicMonthlyTallyTotals(
  clinicId: string,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const tallies = await prisma.staffDailyTally.findMany({
    where: {
      clinicId,
      date: { gte: startDate, lte: endDate },
    },
  })

  const totals = {
    new_patient: 0,
    maintenance_transition: 0,
    self_pay_proposal: 0,
    self_pay_conversion: 0,
  }

  for (const t of tallies) {
    if (t.type in totals) {
      totals[t.type as keyof typeof totals] += t.count
    }
  }

  return {
    newPatientCount: totals.new_patient,
    maintenanceTransitionCount: totals.maintenance_transition,
    selfPayProposalCount: totals.self_pay_proposal,
    selfPayConversionCount: totals.self_pay_conversion,
    maintenanceRate:
      totals.new_patient > 0
        ? Math.round(
            (totals.maintenance_transition / totals.new_patient) * 1000
          ) / 10
        : null,
    selfPayRate:
      totals.self_pay_proposal > 0
        ? Math.round(
            (totals.self_pay_conversion / totals.self_pay_proposal) * 1000
          ) / 10
        : null,
  }
}

export async function getLatestTallyMetrics(clinicId: string) {
  // Find the most recent month with tally data
  const latest = await prisma.staffDailyTally.findFirst({
    where: { clinicId },
    orderBy: { date: "desc" },
    select: { date: true },
  })

  if (!latest) return null

  const year = latest.date.getFullYear()
  const month = latest.date.getMonth() + 1

  return getClinicMonthlyTallyTotals(clinicId, year, month)
}
