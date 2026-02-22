// Shared types and utilities for monthly metrics
// This file has NO "use client" directive so it can be imported by both server and client components

export interface MonthlySummary {
  totalPatientCount: number | null
  firstVisitCount: number | null
  revisitCount: number | null
  totalRevenue: number | null
  insuranceRevenue: number | null
  selfPayRevenue: number | null
  cancellationCount: number | null
}

/** 医院体制データ（半固定項目 + 毎月入力項目） */
export interface ClinicProfile {
  chairCount: number | null
  dentistCount: number | null
  hygienistCount: number | null
  totalVisitCount: number | null
  workingDays: number | null
  laborCost: number | null
}

export type MonthStatus = "full" | "partial" | "empty"

const INPUT_FIELDS: (keyof MonthlySummary)[] = [
  "totalPatientCount", "firstVisitCount", "revisitCount", "totalRevenue", "insuranceRevenue", "selfPayRevenue", "cancellationCount",
]

export function getMonthStatus(summary: MonthlySummary | null): MonthStatus {
  if (!summary) return "empty"
  const filled = INPUT_FIELDS.filter((k) => summary[k] != null).length
  if (filled === 0) return "empty"
  if (filled === INPUT_FIELDS.length) return "full"
  return "partial"
}

/** 既存の基本KPI */
export function calcDerived(s: MonthlySummary | null, surveyCount: number) {
  if (!s) return null
  const first = s.firstVisitCount
  const revisit = s.revisitCount
  // 総実人数: 入力値優先、なければ初診+再診から算出
  const totalPatients = s.totalPatientCount ?? (first != null && revisit != null ? first + revisit : null)
  const insRev = s.insuranceRevenue
  const spRev = s.selfPayRevenue
  // 総売上: 入力値優先、なければ保険+自費から算出
  const totalRevenue = s.totalRevenue ?? (insRev != null && spRev != null ? insRev + spRev : null)
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

/** 医院体制データから算出する拡張KPI */
export function calcProfileDerived(s: MonthlySummary | null, profile: ClinicProfile | null) {
  if (!s || !profile) return null

  const first = s.firstVisitCount
  const revisit = s.revisitCount
  const totalPatients = s.totalPatientCount ?? (first != null && revisit != null ? first + revisit : null)
  const totalRevenue = s.totalRevenue ?? (s.insuranceRevenue != null && s.selfPayRevenue != null ? s.insuranceRevenue + s.selfPayRevenue : null)

  const { chairCount, dentistCount, hygienistCount, totalVisitCount, workingDays, laborCost } = profile

  const round1 = (v: number) => Math.round(v * 10) / 10

  // 1日あたり来院数 = 総患者数 ÷ 診療日数
  const dailyPatients = totalPatients != null && workingDays != null && workingDays > 0
    ? round1(totalPatients / workingDays) : null

  // 日商 = 総売上 ÷ 診療日数
  const dailyRevenue = totalRevenue != null && workingDays != null && workingDays > 0
    ? round1(totalRevenue / workingDays) : null

  // チェアあたり日次来院数 = 延べ来院数 ÷ (チェア数 × 診療日数)
  const chairDailyVisits = totalVisitCount != null && chairCount != null && chairCount > 0
    && workingDays != null && workingDays > 0
    ? round1(totalVisitCount / (chairCount * workingDays)) : null

  // Dr1人あたり売上 = 総売上 ÷ 歯科医師数
  const revenuePerDentist = totalRevenue != null && dentistCount != null && dentistCount > 0
    ? round1(totalRevenue / dentistCount) : null

  // Dr1人あたり患者数 = 総患者数 ÷ 歯科医師数
  const patientsPerDentist = totalPatients != null && dentistCount != null && dentistCount > 0
    ? round1(totalPatients / dentistCount) : null

  // DH1人あたり患者数 = 再診患者数 ÷ 衛生士数
  const patientsPerHygienist = revisit != null && hygienistCount != null && hygienistCount > 0
    ? round1(revisit / hygienistCount) : null

  // 来院1回あたり単価 = 総売上 ÷ 延べ来院数
  const revenuePerReceipt = totalRevenue != null && totalVisitCount != null && totalVisitCount > 0
    ? round1(totalRevenue / totalVisitCount) : null

  // 平均通院回数 = 延べ来院数 ÷ 実患者数
  const avgVisitsPerPatient = totalVisitCount != null && totalPatients != null && totalPatients > 0
    ? round1(totalVisitCount / totalPatients) : null

  // 人件費率 = 人件費 ÷ 総売上 × 100
  const laborCostRatio = laborCost != null && totalRevenue != null && totalRevenue > 0
    ? round1((laborCost / totalRevenue) * 100) : null

  // Dr+DH1人あたり売上 = 総売上 ÷ (Dr数+DH数)
  const totalStaff = (dentistCount ?? 0) + (hygienistCount ?? 0)
  const revenuePerStaff = totalRevenue != null && totalStaff > 0
    ? round1(totalRevenue / totalStaff) : null

  // チェア1台あたり売上 = 総売上 ÷ チェア数
  const revenuePerChair = totalRevenue != null && chairCount != null && chairCount > 0
    ? round1(totalRevenue / chairCount) : null

  return {
    dailyPatients,
    dailyRevenue,
    chairDailyVisits,
    revenuePerDentist,
    patientsPerDentist,
    patientsPerHygienist,
    revenuePerReceipt,
    avgVisitsPerPatient,
    laborCostRatio,
    revenuePerStaff,
    revenuePerChair,
  }
}

/**
 * 指定年月の診療日数をカレンダー設定から自動算出
 * @param year 年
 * @param month 月 (1-based)
 * @param regularClosedDays 定休日の曜日配列 (0=日, 1=月, ..., 6=土)
 * @param closedDates 臨時休診日の配列 (YYYY-MM-DD)
 * @param openDates 定休日の営業日オーバーライド (YYYY-MM-DD)
 */
export function calcWorkingDays(
  year: number,
  month: number,
  regularClosedDays: number[] = [],
  closedDates: string[] = [],
  openDates: string[] = [],
): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  const closedSet = new Set(closedDates)
  const openSet = new Set(openDates)
  let count = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dayOfWeek = date.getDay()
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`

    // 臨時休診日
    if (closedSet.has(dateStr)) continue

    // 定休日だが営業日オーバーライド
    if (regularClosedDays.includes(dayOfWeek) && !openSet.has(dateStr)) continue

    count++
  }

  return count
}
