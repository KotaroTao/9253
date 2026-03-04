import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { ROLES } from "@/lib/constants"
import { buildPlanInfo } from "@/lib/plan"
import { isStripeConfigured } from "@/lib/stripe"
import { BillingPage } from "@/components/billing/billing-page"
import type { ClinicSettings } from "@/types"

export default async function BillingSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  // Stripe 未設定時は設定ページにリダイレクト
  if (!isStripeConfigured()) {
    redirect("/dashboard/settings")
  }

  const [clinic, billingEvents] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, settings: true },
    }),
    prisma.billingEvent.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        createdAt: true,
      },
    }),
  ])

  if (!clinic) {
    redirect("/dashboard")
  }

  const settings = (clinic.settings ?? {}) as ClinicSettings
  const planInfo = buildPlanInfo(settings)

  return (
    <BillingPage
      planInfo={planInfo}
      billingCycle={settings.billingCycle ?? null}
      billingStatus={settings.billingStatus ?? null}
      hasStripeCustomer={!!settings.stripeCustomerId}
      hasSubscription={!!settings.stripeSubscriptionId}
      billingEvents={billingEvents.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }))}
      isOperatorMode={!!operatorClinicId}
    />
  )
}
