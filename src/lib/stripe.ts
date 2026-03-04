import Stripe from "stripe"
import type { PlanTier, ClinicSettings } from "@/types"
import { logger } from "@/lib/logger"
import { PLANS, ALL_PLAN_TIERS } from "@/lib/constants"
import { updateClinicSettings } from "@/lib/queries/clinics"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// ─── Billing Event Types ───

export const BILLING_EVENT_TYPES = {
  CHECKOUT_COMPLETED: "checkout_completed",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_DELETED: "subscription_deleted",
} as const

export type BillingEventType = typeof BILLING_EVENT_TYPES[keyof typeof BILLING_EVENT_TYPES]

// ─── Yearly Pricing ───

/** 年払い月数（12ヶ月中10ヶ月分 = 2ヶ月分お得） */
export const YEARLY_BILLING_MONTHS = 10

// ─── Stripe Client (internal) ───

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key, { apiVersion: "2026-02-25.clover" })
}

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = getStripeClient()
  }
  return _stripe
}

/** Stripe が設定済みかどうか（UI表示の制御用） */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

// ─── Price ID Mapping ───

/**
 * 環境変数から Stripe Price ID を取得する。
 * 例: STRIPE_PRICE_STARTER_MONTHLY=price_xxx
 *     STRIPE_PRICE_STANDARD_YEARLY=price_yyy
 */
export function getStripePriceId(
  plan: PlanTier,
  cycle: "monthly" | "yearly"
): string | null {
  const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${cycle.toUpperCase()}`
  return process.env[envKey] ?? null
}

/** 有料プランかどうか */
export function isPaidPlan(plan: PlanTier): boolean {
  return PLANS[plan].price > 0
}

// ─── Stripe Customer ───

/** Stripe Customer を取得 or 作成してIDを返す（SELECT FOR UPDATE で排他制御） */
export async function getOrCreateStripeCustomer(
  clinicId: string,
  email: string,
  clinicName: string
): Promise<string> {
  // SELECT FOR UPDATE で排他制御し、同時リクエストでの二重作成を防止
  interface LockedRow { settings: Prisma.JsonValue }
  const rows = await prisma.$queryRaw<LockedRow[]>`
    SELECT settings FROM clinics WHERE id = ${clinicId}::uuid FOR UPDATE
  `
  const settings = (rows[0]?.settings ?? {}) as ClinicSettings

  // 既存のCustomer IDがあればそのまま返す
  if (settings.stripeCustomerId) {
    return settings.stripeCustomerId
  }

  // Stripe Customer を作成
  const customer = await getStripe().customers.create({
    email,
    name: clinicName,
    metadata: { clinicId },
  })

  // settings に保存
  await updateClinicSettings(clinicId, { stripeCustomerId: customer.id })

  logger.info("Stripe customer created", {
    component: "stripe",
    clinicId,
    customerId: customer.id,
  })

  return customer.id
}

// ─── Checkout Session ───

export async function createCheckoutSession(params: {
  clinicId: string
  customerId: string
  plan: PlanTier
  cycle: "monthly" | "yearly"
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const priceId = getStripePriceId(params.plan, params.cycle)
  if (!priceId) {
    throw new Error(`Stripe Price ID not configured for ${params.plan}/${params.cycle}`)
  }

  return getStripe().checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        clinicId: params.clinicId,
        plan: params.plan,
        cycle: params.cycle,
      },
    },
    metadata: {
      clinicId: params.clinicId,
      plan: params.plan,
      cycle: params.cycle,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    locale: "ja",
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
  })
}

// ─── Customer Portal ───

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: "ja",
  })
}

// ─── Webhook Signature Verification ───

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured")
  }
  return getStripe().webhooks.constructEvent(body, signature, webhookSecret)
}

// ─── Subscription Helpers ───

/** Stripe Subscription を ID で取得 */
export async function retrieveSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.retrieve(subscriptionId)
}

/** Stripe Subscription Status → billingStatus マッピング */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): ClinicSettings["billingStatus"] {
  switch (status) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled"
    case "trialing":
      return "trialing"
    case "incomplete":
      return "incomplete"
    default:
      return "canceled"
  }
}

/** metadata.plan の安全なバリデーション */
function validatePlanFromMetadata(value: string | undefined, fallback: PlanTier): PlanTier {
  if (value && ALL_PLAN_TIERS.includes(value as PlanTier)) {
    return value as PlanTier
  }
  return fallback
}

/** clinicId からサブスクリプションの metadata.plan を取得して settings を更新 */
export async function syncSubscriptionToClinic(
  subscription: Stripe.Subscription
): Promise<void> {
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) {
    logger.warn("Subscription missing clinicId metadata", {
      component: "stripe",
      subscriptionId: subscription.id,
    })
    return
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { settings: true },
  })
  if (!clinic) {
    logger.warn("Clinic not found for subscription sync", {
      component: "stripe",
      clinicId,
      subscriptionId: subscription.id,
    })
    return
  }

  const settings = (clinic.settings ?? {}) as ClinicSettings
  const plan = validatePlanFromMetadata(subscription.metadata.plan, settings.plan ?? "free")
  const cycle = (subscription.metadata.cycle === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly"
  const billingStatus = mapSubscriptionStatus(subscription.status)

  const patch: Partial<ClinicSettings> = {
    stripeSubscriptionId: subscription.id,
    billingStatus,
    billingCycle: cycle,
  }

  // サブスクリプションがアクティブなら plan を反映
  if (billingStatus === "active" || billingStatus === "trialing") {
    patch.plan = plan
  }

  // キャンセル済みならfreeに戻す（demo/specialは除外）
  if (billingStatus === "canceled" && settings.plan !== "demo" && settings.plan !== "special") {
    patch.plan = "free"
  }

  await updateClinicSettings(clinicId, patch)

  logger.info("Subscription synced to clinic", {
    component: "stripe",
    clinicId,
    subscriptionId: subscription.id,
    plan: patch.plan,
    billingStatus,
  })
}

/** BillingEvent を冪等に記録 */
export async function recordBillingEvent(params: {
  clinicId: string
  type: BillingEventType
  stripeEventId: string
  amount?: number
  currency?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.billingEvent.create({
      data: {
        clinicId: params.clinicId,
        type: params.type,
        stripeEventId: params.stripeEventId,
        amount: params.amount ?? null,
        currency: params.currency ?? "jpy",
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  } catch (err: unknown) {
    // Unique constraint violation = 既に処理済み（冪等性）
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      logger.info("Duplicate billing event ignored", {
        component: "stripe",
        stripeEventId: params.stripeEventId,
      })
      return
    }
    throw err
  }
}
