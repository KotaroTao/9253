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

// ===== ベンチマーク判定 =====

export type BenchmarkStatus = "good" | "warning" | "danger"

/** 診療科目タイプ */
export type ClinicType =
  | "general"        // 一般歯科
  | "orthodontic"    // 矯正歯科
  | "pediatric"      // 小児歯科
  | "cosmetic"       // 審美歯科
  | "oral_surgery"   // 口腔外科
  | "periodontal"    // 歯周病専門

export const CLINIC_TYPE_LABELS: Record<ClinicType, string> = {
  general: "一般歯科",
  orthodontic: "矯正歯科",
  pediatric: "小児歯科",
  cosmetic: "審美歯科",
  oral_surgery: "口腔外科",
  periodontal: "歯周病専門",
}

interface BenchmarkRange {
  good: [number, number]  // [min, max] — この範囲内なら良好
  warning: [number, number] // この範囲なら注意
  // それ以外は要改善
}

type BenchmarkPreset = Record<string, BenchmarkRange>

/** 診療科目別ベンチマーク定義 */
const BENCHMARK_PRESETS: Record<ClinicType, BenchmarkPreset> = {
  general: {
    selfPayRatioAmount: { good: [20, 100], warning: [15, 20] },
    newPatientRate: { good: [15, 30], warning: [10, 15] },
    returnRate: { good: [75, 100], warning: [65, 75] },
    cancellationRate: { good: [0, 8], warning: [8, 12] },
    revenuePerVisit: { good: [1.0, 100], warning: [0.7, 1.0] },
    laborCostRatio: { good: [0, 30], warning: [30, 35] },
  },
  orthodontic: {
    selfPayRatioAmount: { good: [70, 100], warning: [50, 70] },
    newPatientRate: { good: [5, 20], warning: [3, 5] },
    returnRate: { good: [80, 100], warning: [70, 80] },
    cancellationRate: { good: [0, 5], warning: [5, 10] },
    revenuePerVisit: { good: [3.0, 200], warning: [2.0, 3.0] },
    laborCostRatio: { good: [0, 25], warning: [25, 30] },
  },
  pediatric: {
    selfPayRatioAmount: { good: [5, 100], warning: [3, 5] },
    newPatientRate: { good: [20, 40], warning: [15, 20] },
    returnRate: { good: [70, 100], warning: [60, 70] },
    cancellationRate: { good: [0, 10], warning: [10, 15] },
    revenuePerVisit: { good: [0.5, 100], warning: [0.3, 0.5] },
    laborCostRatio: { good: [0, 35], warning: [35, 40] },
  },
  cosmetic: {
    selfPayRatioAmount: { good: [60, 100], warning: [40, 60] },
    newPatientRate: { good: [20, 45], warning: [10, 20] },
    returnRate: { good: [50, 100], warning: [35, 50] },
    cancellationRate: { good: [0, 8], warning: [8, 12] },
    revenuePerVisit: { good: [2.0, 200], warning: [1.5, 2.0] },
    laborCostRatio: { good: [0, 25], warning: [25, 30] },
  },
  oral_surgery: {
    selfPayRatioAmount: { good: [10, 100], warning: [5, 10] },
    newPatientRate: { good: [25, 50], warning: [15, 25] },
    returnRate: { good: [50, 100], warning: [40, 50] },
    cancellationRate: { good: [0, 8], warning: [8, 12] },
    revenuePerVisit: { good: [1.5, 200], warning: [1.0, 1.5] },
    laborCostRatio: { good: [0, 30], warning: [30, 35] },
  },
  periodontal: {
    selfPayRatioAmount: { good: [15, 100], warning: [10, 15] },
    newPatientRate: { good: [10, 25], warning: [5, 10] },
    returnRate: { good: [80, 100], warning: [70, 80] },
    cancellationRate: { good: [0, 8], warning: [8, 12] },
    revenuePerVisit: { good: [0.8, 100], warning: [0.5, 0.8] },
    laborCostRatio: { good: [0, 30], warning: [30, 35] },
  },
}

function getBenchmarksForClinic(clinicType?: ClinicType): BenchmarkPreset {
  return BENCHMARK_PRESETS[clinicType ?? "general"]
}

export function getBenchmarkStatus(key: string, value: number | null, clinicType?: ClinicType): BenchmarkStatus | null {
  if (value == null) return null
  const benchmarks = getBenchmarksForClinic(clinicType)
  const b = benchmarks[key]
  if (!b) return null
  if (value >= b.good[0] && value <= b.good[1]) return "good"
  if (value >= b.warning[0] && value <= b.warning[1]) return "warning"
  return "danger"
}

export const BENCHMARK_COLORS: Record<BenchmarkStatus, string> = {
  good: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
}

export const BENCHMARK_BG: Record<BenchmarkStatus, string> = {
  good: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50",
  warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50",
  danger: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
}

export const BENCHMARK_DOT: Record<BenchmarkStatus, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
}

// ===== インサイト自動生成 =====

export interface MetricsInsight {
  type: "positive" | "warning" | "info"
  message: string
}

interface InsightInput {
  current: ReturnType<typeof calcDerived>
  prev: ReturnType<typeof calcDerived>
  yoy: ReturnType<typeof calcDerived>
  currentSummary: MonthlySummary | null
  prevSummary: MonthlySummary | null
  yoySummary: MonthlySummary | null
  satisfactionScore: number | null
  prevSatisfactionScore: number | null
}

export function generateInsights(input: InsightInput): MetricsInsight[] {
  const insights: MetricsInsight[] = []
  const { current, prev, yoy, currentSummary, satisfactionScore, prevSatisfactionScore } = input

  if (!current || !currentSummary) return insights

  // 自費率の変動
  if (current.selfPayRatioAmount != null && prev?.selfPayRatioAmount != null) {
    const delta = Math.round((current.selfPayRatioAmount - prev.selfPayRatioAmount) * 10) / 10
    if (delta >= 2) {
      insights.push({
        type: "positive",
        message: `自費率が前月比+${delta}pt上昇し${current.selfPayRatioAmount}%に。${current.selfPayRatioAmount >= 25 ? "高水準を維持しています" : "改善傾向です"}`,
      })
    } else if (delta <= -3) {
      insights.push({
        type: "warning",
        message: `自費率が前月比${delta}pt低下し${current.selfPayRatioAmount}%に。自費メニューの提案強化を検討してください`,
      })
    }
  }

  // キャンセル率の悪化
  if (current.cancellationRate != null && prev?.cancellationRate != null) {
    const delta = Math.round((current.cancellationRate - prev.cancellationRate) * 10) / 10
    if (delta >= 1.5) {
      insights.push({
        type: "warning",
        message: `キャンセル率が前月比+${delta}ptで${current.cancellationRate}%に上昇。リマインド施策の見直しを推奨します`,
      })
    }
  }

  // 新患数の前年同月比
  if (currentSummary.firstVisitCount != null && input.yoySummary?.firstVisitCount != null && input.yoySummary.firstVisitCount > 0) {
    const ratio = Math.round((currentSummary.firstVisitCount / input.yoySummary.firstVisitCount) * 100) - 100
    if (ratio >= 15) {
      insights.push({
        type: "positive",
        message: `新患数が前年同月比+${ratio}%。集患施策が効果を発揮しています`,
      })
    } else if (ratio <= -20) {
      insights.push({
        type: "warning",
        message: `新患数が前年同月比${ratio}%。集患チャネルの見直しを検討してください`,
      })
    }
  }

  // 満足度と売上の連動
  if (satisfactionScore != null && prevSatisfactionScore != null) {
    const scoreDelta = Math.round((satisfactionScore - prevSatisfactionScore) * 100) / 100
    if (scoreDelta >= 0.2 && current.totalPatients != null && prev?.totalPatients != null && current.totalPatients > prev.totalPatients) {
      insights.push({
        type: "positive",
        message: `満足度スコアが${prevSatisfactionScore.toFixed(1)}→${satisfactionScore.toFixed(1)}に改善。来院数も増加傾向で、PX改善の成果が表れています`,
      })
    }
  }

  // 前年同月比の売上
  if (currentSummary.totalRevenue != null && input.yoySummary?.totalRevenue != null && input.yoySummary.totalRevenue > 0) {
    const ratio = Math.round((currentSummary.totalRevenue / input.yoySummary.totalRevenue) * 100) - 100
    if (ratio >= 10) {
      insights.push({
        type: "positive",
        message: `総売上が前年同月比+${ratio}%で成長中`,
      })
    }
  }

  // 人件費率
  if (yoy) {
    // using yoy just for reference
  }

  return insights.slice(0, 3)
}

// ===== KPIヘルスマップ用 =====

export interface KpiHealthItem {
  key: string
  label: string
  value: number | null
  format: (v: number) => string
  status: BenchmarkStatus | null
  momDelta: number | null // 前月比
  yoyDelta: number | null // 前年同月比
}

export function buildKpiHealthItems(
  current: ReturnType<typeof calcDerived>,
  prev: ReturnType<typeof calcDerived>,
  yoy: ReturnType<typeof calcDerived>,
  clinicType?: ClinicType,
): KpiHealthItem[] {
  if (!current) return []

  const items: { key: string; label: string; value: number | null; format: (v: number) => string }[] = [
    { key: "selfPayRatioAmount", label: "自費率", value: current.selfPayRatioAmount, format: (v) => `${v}%` },
    { key: "newPatientRate", label: "新患比率", value: current.newPatientRate, format: (v) => `${v}%` },
    { key: "returnRate", label: "再来院率", value: current.returnRate, format: (v) => `${v}%` },
    { key: "cancellationRate", label: "キャンセル率", value: current.cancellationRate, format: (v) => `${v}%` },
    { key: "revenuePerVisit", label: "患者単価", value: current.revenuePerVisit, format: (v) => `${v}万` },
  ]

  return items.map((item) => ({
    ...item,
    status: getBenchmarkStatus(item.key, item.value, clinicType),
    momDelta: item.value != null && prev?.[item.key as keyof typeof prev] != null
      ? Math.round((item.value - (prev[item.key as keyof typeof prev] as number)) * 10) / 10
      : null,
    yoyDelta: item.value != null && yoy?.[item.key as keyof typeof yoy] != null
      ? Math.round((item.value - (yoy[item.key as keyof typeof yoy] as number)) * 10) / 10
      : null,
  }))
}
