import { prisma } from "@/lib/prisma"
import { CLINIC_TYPE_LABELS } from "@/lib/metrics-utils"
import type { ClinicType } from "@/types"

/**
 * 季節指数エンジン
 *
 * 3段階フォールバック方式で月別の季節指数を算出する。
 * 季節指数 = その月の平均値 ÷ 年間平均値（1.0 = 年間平均）
 *
 * ■ レベル1: 自院データ（最も正確）
 *   - 条件: 12ヶ月以上の経営データが存在
 *   - 計算: 自院の月別平均 ÷ 自院の年間平均
 *
 * ■ レベル2: 同診療科目の中央値
 *   - 条件: レベル1不可、同科目5院以上が各12ヶ月以上保有
 *   - 計算: 各院の季節指数の中央値
 *
 * ■ レベル3: プラットフォーム全体の中央値
 *   - 条件: レベル1・2いずれも不可
 *   - 計算: 全院の季節指数の中央値
 *
 * ■ フォールバック: 調整なし（データ不足時）
 */

/** 季節指数レベル */
export type SeasonalLevel = "self" | "specialty" | "platform" | "none"

/** 1つの指標に対する月別季節指数 */
export interface MetricSeasonalIndices {
  /** 月番号(1-12) → 季節指数 (1.0 = 年間平均) */
  byMonth: Record<number, number>
}

/** 全指標の季節指数 */
export interface SeasonalIndices {
  level: SeasonalLevel
  revenue: MetricSeasonalIndices
  patientCount: MetricSeasonalIndices
  /** 使用されたクリニック数 (level=self時は1) */
  clinicCount: number
  /** データ元のラベル（"自院データ" | "一般歯科 5院" | "全体 12院" | null） */
  label: string | null
}

/** 最低データ月数（自院用） */
const MIN_MONTHS_SELF = 12
/** 最低クリニック数（同科目集計用） */
const MIN_CLINICS_SPECIALTY = 5
/** 最低クリニック数（全体集計用） */
const MIN_CLINICS_PLATFORM = 5

/** 全月デフォルト(1.0)の指数 */
function defaultIndices(): MetricSeasonalIndices {
  const byMonth: Record<number, number> = {}
  for (let m = 1; m <= 12; m++) byMonth[m] = 1.0
  return { byMonth }
}

/**
 * 月別平均値から季節指数を算出
 * 各月の平均値 ÷ 全月の平均値 = 季節指数
 */
function computeIndicesFromMonthlyAverages(
  monthlyAvgs: Record<number, number>,
): MetricSeasonalIndices {
  const values = Object.values(monthlyAvgs).filter((v: number) => v > 0)
  if (values.length === 0) return defaultIndices()

  const overallAvg = values.reduce((a: number, b: number) => a + b, 0) / values.length
  const byMonth: Record<number, number> = {}
  for (let m = 1; m <= 12; m++) {
    const monthAvg = monthlyAvgs[m]
    byMonth[m] = monthAvg != null && monthAvg > 0 && overallAvg > 0
      ? Math.round((monthAvg / overallAvg) * 1000) / 1000
      : 1.0
  }
  return { byMonth }
}

/**
 * 中央値を計算
 */
function median(arr: number[]): number {
  if (arr.length === 0) return 1.0
  const sorted = [...arr].sort((a: number, b: number) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * 複数クリニックの季節指数から中央値で統合
 */
function mergeIndicesByMedian(
  allIndices: MetricSeasonalIndices[],
): MetricSeasonalIndices {
  const byMonth: Record<number, number> = {}
  for (let m = 1; m <= 12; m++) {
    const values = allIndices.map((idx) => idx.byMonth[m]).filter((v): v is number => v != null)
    byMonth[m] = Math.round(median(values) * 1000) / 1000
  }
  return { byMonth }
}

/**
 * 月別メトリクス行から季節指数ペア（売上＋患者数）を算出
 */
function computeClinicIndicesFromRows(
  rows: Array<{ month: number; totalRevenue: number | null; totalPatientCount: number | null }>,
): { rev: MetricSeasonalIndices; pat: MetricSeasonalIndices } {
  // 月ごとに値を蓄積
  const revSums: Record<number, { total: number; count: number }> = {}
  const patSums: Record<number, { total: number; count: number }> = {}

  for (const r of rows) {
    if (r.totalRevenue != null) {
      if (!revSums[r.month]) revSums[r.month] = { total: 0, count: 0 }
      revSums[r.month].total += r.totalRevenue
      revSums[r.month].count++
    }
    if (r.totalPatientCount != null) {
      if (!patSums[r.month]) patSums[r.month] = { total: 0, count: 0 }
      patSums[r.month].total += r.totalPatientCount
      patSums[r.month].count++
    }
  }

  const revAvgs: Record<number, number> = {}
  const patAvgs: Record<number, number> = {}
  for (let m = 1; m <= 12; m++) {
    if (revSums[m] && revSums[m].count > 0) revAvgs[m] = revSums[m].total / revSums[m].count
    if (patSums[m] && patSums[m].count > 0) patAvgs[m] = patSums[m].total / patSums[m].count
  }

  return {
    rev: computeIndicesFromMonthlyAverages(revAvgs),
    pat: computeIndicesFromMonthlyAverages(patAvgs),
  }
}

// ----- レベル1: 自院データ -----

interface MonthMetricRow {
  month: number
  avgRevenue: number | null
  avgPatients: number | null
}

async function computeSelfIndices(clinicId: string): Promise<SeasonalIndices | null> {
  const rows = await prisma.$queryRaw<MonthMetricRow[]>`
    SELECT
      month,
      AVG(total_revenue)::float AS "avgRevenue",
      AVG(total_patient_count)::float AS "avgPatients"
    FROM monthly_clinic_metrics
    WHERE clinic_id = ${clinicId}::uuid
      AND total_revenue IS NOT NULL
      AND total_patient_count IS NOT NULL
    GROUP BY month
    ORDER BY month
  `

  if (rows.length < MIN_MONTHS_SELF) return null

  const revAvgs: Record<number, number> = {}
  const patAvgs: Record<number, number> = {}
  for (const row of rows) {
    if (row.avgRevenue != null) revAvgs[row.month] = row.avgRevenue
    if (row.avgPatients != null) patAvgs[row.month] = row.avgPatients
  }

  return {
    level: "self",
    revenue: computeIndicesFromMonthlyAverages(revAvgs),
    patientCount: computeIndicesFromMonthlyAverages(patAvgs),
    clinicCount: 1,
    label: "自院データ",
  }
}

// ----- レベル2・3共通: 複数クリニック集計 -----

interface MetricRow {
  clinicId: string
  month: number
  totalRevenue: number | null
  totalPatientCount: number | null
}

function computeMultiClinicIndices(
  allMetrics: MetricRow[],
  minClinics: number,
): { revIndices: MetricSeasonalIndices; patIndices: MetricSeasonalIndices; clinicCount: number } | null {
  // クリニックごとにグループ化
  const byClinic: Record<string, MetricRow[]> = {}
  for (const m of allMetrics) {
    if (!byClinic[m.clinicId]) byClinic[m.clinicId] = []
    byClinic[m.clinicId].push(m)
  }

  // 12ヶ月以上データがあるクリニックだけ使う
  const qualifiedClinicIds: string[] = []
  for (const cid of Object.keys(byClinic)) {
    const months = new Set(byClinic[cid].map((r: MetricRow) => r.month))
    if (months.size >= MIN_MONTHS_SELF) {
      qualifiedClinicIds.push(cid)
    }
  }

  if (qualifiedClinicIds.length < minClinics) return null

  // 各クリニックの季節指数を計算
  const allRevIndices: MetricSeasonalIndices[] = []
  const allPatIndices: MetricSeasonalIndices[] = []

  for (const cid of qualifiedClinicIds) {
    const { rev, pat } = computeClinicIndicesFromRows(byClinic[cid])
    allRevIndices.push(rev)
    allPatIndices.push(pat)
  }

  return {
    revIndices: mergeIndicesByMedian(allRevIndices),
    patIndices: mergeIndicesByMedian(allPatIndices),
    clinicCount: qualifiedClinicIds.length,
  }
}

// ----- レベル2: 同診療科目 -----

async function computeSpecialtyIndices(
  excludeClinicId: string,
  clinicType: ClinicType,
): Promise<SeasonalIndices | null> {
  // Filter by clinicType in SQL using JSONB, avoiding fetching all clinics into JS
  const sameTypeClinics = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM clinics
    WHERE id != ${excludeClinicId}::uuid
      AND COALESCE(settings->>'clinicType', 'general') = ${clinicType}
  `

  const clinicIds = sameTypeClinics.map((c) => c.id)
  if (clinicIds.length === 0) return null

  const allMetrics = await prisma.monthlyClinicMetrics.findMany({
    where: {
      clinicId: { in: clinicIds },
      totalRevenue: { not: null },
      totalPatientCount: { not: null },
    },
    select: {
      clinicId: true,
      month: true,
      totalRevenue: true,
      totalPatientCount: true,
    },
  })

  const result = computeMultiClinicIndices(allMetrics, MIN_CLINICS_SPECIALTY)
  if (!result) return null

  const typeLabel = CLINIC_TYPE_LABELS[clinicType] ?? clinicType

  return {
    level: "specialty",
    revenue: result.revIndices,
    patientCount: result.patIndices,
    clinicCount: result.clinicCount,
    label: `${typeLabel} ${result.clinicCount}院`,
  }
}

// ----- レベル3: プラットフォーム全体 -----

async function computePlatformIndices(
  excludeClinicId: string,
): Promise<SeasonalIndices | null> {
  const allMetrics = await prisma.monthlyClinicMetrics.findMany({
    where: {
      clinicId: { not: excludeClinicId },
      totalRevenue: { not: null },
      totalPatientCount: { not: null },
    },
    select: {
      clinicId: true,
      month: true,
      totalRevenue: true,
      totalPatientCount: true,
    },
  })

  const result = computeMultiClinicIndices(allMetrics, MIN_CLINICS_PLATFORM)
  if (!result) return null

  return {
    level: "platform",
    revenue: result.revIndices,
    patientCount: result.patIndices,
    clinicCount: result.clinicCount,
    label: `全体 ${result.clinicCount}院`,
  }
}

// ----- 公開API -----

/**
 * クリニックの季節指数を3段階フォールバックで取得
 */
export async function getSeasonalIndices(
  clinicId: string,
  clinicType?: ClinicType,
): Promise<SeasonalIndices> {
  const noAdjustment: SeasonalIndices = {
    level: "none",
    revenue: defaultIndices(),
    patientCount: defaultIndices(),
    clinicCount: 0,
    label: null,
  }

  // レベル1: 自院データ
  const selfIndices = await computeSelfIndices(clinicId)
  if (selfIndices) return selfIndices

  // レベル2: 同診療科目
  const ct = clinicType ?? "general"
  const specialtyIndices = await computeSpecialtyIndices(clinicId, ct)
  if (specialtyIndices) return specialtyIndices

  // レベル3: プラットフォーム全体
  const platformIndices = await computePlatformIndices(clinicId)
  if (platformIndices) return platformIndices

  // フォールバック: 調整なし
  return noAdjustment
}

