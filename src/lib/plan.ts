import type { Prisma } from "@prisma/client"
import type { ClinicSettings, PlanTier, PlanInfo } from "@/types"
import { PLAN_ORDER, FEATURE_REQUIREMENTS, TRIAL_DURATION_DAYS } from "@/lib/constants"
import { prisma } from "@/lib/prisma"

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
