import { NextRequest } from "next/server"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { PLAN_ORDER } from "@/lib/constants"
import { getOrCreateStripeCustomer, createCheckoutSession, isPaidPlan } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import type { PlanTier } from "@/types"

/**
 * POST /api/billing/checkout
 * Stripe Checkout Session を作成し、URLを返す。
 * Body: { plan: PlanTier, cycle: "monthly" | "yearly" }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  let body: { plan?: string; cycle?: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse(messages.errors.invalidInput, 400)
  }

  const { plan, cycle } = body

  // バリデーション: plan
  if (!plan || !PLAN_ORDER.includes(plan as PlanTier)) {
    return errorResponse(messages.billing.invalidPlan, 400)
  }

  // 無料プランにはCheckoutは不要
  if (!isPaidPlan(plan as PlanTier)) {
    return errorResponse(messages.billing.freeNoCheckout, 400)
  }

  // バリデーション: cycle
  if (!cycle || !["monthly", "yearly"].includes(cycle)) {
    return errorResponse(messages.billing.invalidCycle, 400)
  }

  // クリニック情報取得
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true },
  })
  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  try {
    // Stripe Customer を取得 or 作成
    const customerId = await getOrCreateStripeCustomer(
      clinicId,
      authResult.user.email ?? "",
      clinic.name
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Checkout Session を作成
    const session = await createCheckoutSession({
      clinicId,
      customerId,
      plan: plan as PlanTier,
      cycle: cycle as "monthly" | "yearly",
      successUrl: `${appUrl}/dashboard/settings/billing?success=1`,
      cancelUrl: `${appUrl}/dashboard/settings/billing?canceled=1`,
    })

    return successResponse({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return errorResponse(messages.billing.checkoutFailed + ": " + message, 500)
  }
}
