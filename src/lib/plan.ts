import type { Prisma } from "@prisma/client"
import type { ClinicSettings, PlanTier, PlanInfo, SpecialPlanProgress } from "@/types"
import { PLAN_ORDER, FEATURE_REQUIREMENTS, TRIAL_DURATION_DAYS, DEFAULTS } from "@/lib/constants"
import { prisma } from "@/lib/prisma"
import { jstNowParts, jstStartOfMonth, jstEndOfMonth } from "@/lib/date-jst"

/** プランの数値レベルを返す（比較用） */
export function planLevel(plan: PlanTier): number {
  // special / demo は standard と同等の機能レベル
  if (plan === "special" || plan === "demo") {
    return PLAN_ORDER.indexOf("standard")
  }
  return PLAN_ORDER.indexOf(plan)
}

/** 基本プランを取得（トライアル考慮なし） */
export function getClinicPlan(settings: ClinicSettings): PlanTier {
  return settings.plan ?? "free"
}

/** トライアルがアクティブかどうか */
export function isTrialActive(settings: ClinicSettings): boolean {
  if (!settings.trialPlan || !settings.trialEndsAt) return false
  return new Date(settings.trialEndsAt) > new Date()
}

/** 実効プランを取得（トライアル込み） */
export function getEffectivePlan(settings: ClinicSettings): PlanTier {
  const basePlan = getClinicPlan(settings)
  if (isTrialActive(settings) && settings.trialPlan) {
    return planLevel(settings.trialPlan) > planLevel(basePlan)
      ? settings.trialPlan
      : basePlan
  }
  return basePlan
}

/** 指定機能が利用可能かチェック */
export function hasFeature(effectivePlan: PlanTier, feature: string): boolean {
  const requiredPlan = FEATURE_REQUIREMENTS[feature]
  if (!requiredPlan) return true // 未定義の機能はアクセス可
  return planLevel(effectivePlan) >= planLevel(requiredPlan)
}

/** 指定プラン以上かチェック */
export function hasPlanLevel(effectivePlan: PlanTier, requiredPlan: PlanTier): boolean {
  return planLevel(effectivePlan) >= planLevel(requiredPlan)
}

/** トライアル残日数 */
export function getTrialDaysRemaining(settings: ClinicSettings): number | null {
  if (!isTrialActive(settings) || !settings.trialEndsAt) return null
  const diff = new Date(settings.trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/** トライアル開始可能か（未使用の場合のみ） */
export function canStartTrial(settings: ClinicSettings): boolean {
  if (settings.trialUsed) return false
  if (isTrialActive(settings)) return false
  // enterprise は既に最上位
  const basePlan = getClinicPlan(settings)
  return basePlan !== "enterprise"
}

/** 次のアップグレード先プランを返す */
export function getNextPlan(currentPlan: PlanTier): PlanTier | null {
  const idx = PLAN_ORDER.indexOf(currentPlan)
  if (idx < 0 || idx >= PLAN_ORDER.length - 1) return null
  return PLAN_ORDER[idx + 1]
}

/** トライアル対象プランを返す（現在のプランの1つ上） */
export function getTrialTargetPlan(settings: ClinicSettings): PlanTier | null {
  if (!canStartTrial(settings)) return null
  const basePlan = getClinicPlan(settings)
  // free/starter → standard をトライアル
  if (basePlan === "free" || basePlan === "starter") return "standard"
  return getNextPlan(basePlan)
}

/** クリニックのプラン情報を取得 */
export async function getClinicPlanInfo(clinicId: string): Promise<PlanInfo> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  return buildPlanInfo(settings)
}

/** ClinicSettingsからPlanInfoを構築 */
export function buildPlanInfo(settings: ClinicSettings): PlanInfo {
  return {
    plan: getClinicPlan(settings),
    effectivePlan: getEffectivePlan(settings),
    isTrialActive: isTrialActive(settings),
    trialDaysRemaining: getTrialDaysRemaining(settings),
    trialPlan: isTrialActive(settings) ? (settings.trialPlan ?? null) : null,
    canStartTrial: canStartTrial(settings),
  }
}

/** トライアルを開始する */
export async function startTrial(clinicId: string, targetPlan: PlanTier): Promise<PlanInfo> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings

  if (!canStartTrial(settings)) {
    throw new Error("トライアルを開始できません")
  }

  const now = new Date()
  const endsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const patch: Partial<ClinicSettings> = {
    trialPlan: targetPlan,
    trialStartedAt: now.toISOString(),
    trialEndsAt: endsAt.toISOString(),
    trialUsed: true,
  }

  const merged = { ...settings, ...patch }

  await prisma.clinic.update({
    where: { id: clinicId },
    data: { settings: merged as unknown as Prisma.InputJsonValue },
  })

  return buildPlanInfo(merged)
}

// ─── 特別プラン無料継続条件 ───

/** 当月の YYYY-MM キーを返す */
function currentMonthKey(): string {
  const { year, month } = jstNowParts()
  return `${year}-${String(month).padStart(2, "0")}`
}

/** 前月の YYYY-MM キー + 境界日時を返す */
function prevMonthBounds(): { key: string; start: Date; end: Date } {
  const { year, month } = jstNowParts()
  const prevYear = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1
  return {
    key: `${prevYear}-${String(prevMonth).padStart(2, "0")}`,
    start: jstStartOfMonth(prevYear, prevMonth),
    end: jstEndOfMonth(prevYear, prevMonth),
  }
}

/** クリニックの登録月 YYYY-MM を返す */
async function getClinicCreatedMonth(clinicId: string): Promise<string> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { createdAt: true },
  })
  if (!clinic) return "9999-12"
  const d = clinic.createdAt
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

/**
 * 特別プラン条件の遅延評価（ダッシュボード表示時に呼ぶ）。
 * 前月が未評価なら条件チェックし、warning / suspended / active を更新。
 * Fire-and-forget で DB 書き込みするため戻り値は現在の進捗データのみ。
 */
export async function evaluateSpecialPlanProgress(
  clinicId: string,
  settings: ClinicSettings
): Promise<SpecialPlanProgress> {
  const monthKey = currentMonthKey()
  const required = {
    responses: DEFAULTS.SPECIAL_PLAN_MIN_RESPONSES,
    actions: DEFAULTS.SPECIAL_PLAN_MIN_ACTIONS,
  }

  // 当月の回答数 + アクション数を取得（進捗表示用）
  const { year, month } = jstNowParts()
  const thisMonthStart = jstStartOfMonth(year, month)
  const thisMonthEnd = jstEndOfMonth(year, month)

  const [responseCount, actionCount] = await Promise.all([
    prisma.surveyResponse.count({
      where: { clinicId, respondedAt: { gte: thisMonthStart, lte: thisMonthEnd } },
    }),
    prisma.improvementAction.count({
      where: { clinicId, startedAt: { gte: thisMonthStart, lte: thisMonthEnd } },
    }),
  ])

  // 登録初月は grace 期間
  const createdMonth = await getClinicCreatedMonth(clinicId)
  if (monthKey === createdMonth) {
    return {
      isSpecialPlan: true,
      status: "grace",
      monthlyResponses: responseCount,
      monthlyActions: actionCount,
      requiredResponses: required.responses,
      requiredActions: required.actions,
      currentMonth: monthKey,
    }
  }

  // 前月の評価（未評価の場合のみ）
  const prevStatus = settings.specialPlanStatus ?? "active"
  let newStatus = prevStatus
  const prev = prevMonthBounds()
  if (settings.specialPlanLastEvaluatedMonth !== prev.key && prev.key !== createdMonth) {
    const [prevResponses, prevActions] = await Promise.all([
      prisma.surveyResponse.count({
        where: { clinicId, respondedAt: { gte: prev.start, lte: prev.end } },
      }),
      prisma.improvementAction.count({
        where: { clinicId, startedAt: { gte: prev.start, lte: prev.end } },
      }),
    ])

    const met = prevResponses >= required.responses && prevActions >= required.actions

    if (met) {
      newStatus = "active"
    } else if (prevStatus === "active") {
      // 初回未達 → 警告
      newStatus = "warning"
    } else if (prevStatus === "warning") {
      // 2ヶ月連続未達 → 降格
      newStatus = "suspended"
    }
    // suspended は変わらない（system_admin 手動復帰）

    // Atomic JSONB merge (fire-and-forget)
    const planValue = newStatus === "suspended" ? "free" : "special"
    prisma.$executeRaw`
      UPDATE clinics
      SET settings = COALESCE(settings, '{}'::jsonb)
        || jsonb_build_object(
          'specialPlanStatus', ${newStatus}::text,
          'specialPlanLastEvaluatedMonth', ${prev.key}::text,
          'plan', ${planValue}::text
        )
      WHERE id = ${clinicId}::uuid
    `.catch((err) => {
      console.error("[specialPlan] Failed to persist evaluation:", err)
    })
  }

  return {
    isSpecialPlan: true,
    status: newStatus === "suspended" ? "suspended" : (monthKey === createdMonth ? "grace" : newStatus),
    monthlyResponses: responseCount,
    monthlyActions: actionCount,
    requiredResponses: required.responses,
    requiredActions: required.actions,
    currentMonth: monthKey,
  }
}
