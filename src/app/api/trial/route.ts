import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { startTrial, getClinicPlanInfo, canStartTrial as checkCanStartTrial } from "@/lib/plan"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"
import { PLAN_ORDER } from "@/lib/constants"
import type { ClinicSettings, PlanTier } from "@/types"

/** トライアル開始 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const targetPlan = body.plan as PlanTier | undefined
  if (!targetPlan || !PLAN_ORDER.includes(targetPlan)) {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  // トライアル可能かチェック
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  if (!checkCanStartTrial(settings)) {
    return errorResponse(messages.plan.trialAlreadyUsed, 400)
  }

  try {
    const planInfo = await startTrial(clinicId, targetPlan)
    return successResponse(planInfo)
  } catch {
    return errorResponse(messages.common.error, 500)
  }
}

/** 現在のプラン情報を取得 */
export async function GET() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const planInfo = await getClinicPlanInfo(clinicId)
  return successResponse(planInfo)
}
