import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { messages } from "@/lib/messages"
import { createBillingPortalSession } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import type { ClinicSettings } from "@/types"

/**
 * POST /api/billing/portal
 * Stripe Customer Portal Session を作成し、URLを返す。
 */
export async function POST() {
  const authResult = await requireRole("clinic_admin", "system_admin")
  if (isAuthError(authResult)) return authResult

  const clinicId = authResult.user.clinicId
  if (!clinicId) {
    return errorResponse(messages.errors.clinicNotAssociated, 400)
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  if (!clinic) {
    return errorResponse(messages.errors.clinicNotFound, 404)
  }

  const settings = (clinic.settings ?? {}) as ClinicSettings

  if (!settings.stripeCustomerId) {
    return errorResponse(messages.billing.noSubscription, 400)
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const session = await createBillingPortalSession(
      settings.stripeCustomerId,
      `${appUrl}/dashboard/settings/billing`
    )

    return successResponse({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return errorResponse(messages.billing.portalFailed + ": " + message, 500)
  }
}
