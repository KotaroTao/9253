import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import type { ClinicSettings, PlanTier } from "@/types"

const VALID_PLANS: PlanTier[] = ["free", "starter", "standard", "enterprise", "demo"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const { id } = await params

  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.apiErrors.invalidRequest, 400)
  }

  const { plan } = body

  if (!plan || !VALID_PLANS.includes(plan as PlanTier)) {
    return errorResponse(messages.apiErrors.invalidPlan, 400)
  }

  // クリニック存在チェック
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, name: true, settings: true },
  })
  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  const updated = await updateClinicSettings(id, { plan: plan as PlanTier })

  return successResponse({
    id: clinic.id,
    name: clinic.name,
    plan: (updated as ClinicSettings).plan ?? "free",
  })
}
