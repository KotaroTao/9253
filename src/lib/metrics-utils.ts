// Shared types and utilities for monthly metrics
// This file has NO "use client" directive so it can be imported by both server and client components

export interface MonthlySummary {
  firstVisitCount: number | null
  revisitCount: number | null
  insuranceRevenue: number | null
  selfPayRevenue: number | null
  cancellationCount: number | null
}

export type MonthStatus = "full" | "partial" | "empty"

const INPUT_FIELDS: (keyof MonthlySummary)[] = [
  "firstVisitCount", "revisitCount", "insuranceRevenue", "selfPayRevenue", "cancellationCount",
]

export function getMonthStatus(summary: MonthlySummary | null): MonthStatus {
  if (!summary) return "empty"
  const filled = INPUT_FIELDS.filter((k) => summary[k] != null).length
  if (filled === 0) return "empty"
  if (filled === INPUT_FIELDS.length) return "full"
  return "partial"
}

export function calcDerived(s: MonthlySummary | null, surveyCount: number) {
  if (!s) return null
  const first = s.firstVisitCount
  const revisit = s.revisitCount
  const totalPatients = first != null && revisit != null ? first + revisit : null
  const insRev = s.insuranceRevenue
  const spRev = s.selfPayRevenue
  const totalRevenue = insRev != null && spRev != null ? insRev + spRev : null
  const cancel = s.cancellationCount

  return {
    totalPatients,
    revenuePerVisit: totalPatients != null && totalPatients > 0 && totalRevenue != null
      ? Math.round((totalRevenue / totalPatients) * 10) / 10 : null,
    selfPayRatioAmount: totalRevenue != null && totalRevenue > 0 && spRev != null
      ? Math.round((spRev / totalRevenue) * 1000) / 10 : null,
    returnRate: totalPatients != null && totalPatients > 0 && revisit != null
      ? Math.round((revisit / totalPatients) * 1000) / 10 : null,
    newPatientRate: totalPatients != null && totalPatients > 0 && first != null
      ? Math.round((first / totalPatients) * 1000) / 10 : null,
    cancellationRate: totalPatients != null && totalPatients > 0 && cancel != null
      ? Math.round((cancel / (totalPatients + cancel)) * 1000) / 10 : null,
    surveyResponseRate: totalPatients != null && totalPatients > 0
      ? Math.round((surveyCount / totalPatients) * 1000) / 10 : null,
  }
}
