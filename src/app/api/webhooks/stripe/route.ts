import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import {
  constructWebhookEvent,
  syncSubscriptionToClinic,
  recordBillingEvent,
  retrieveSubscription,
  BILLING_EVENT_TYPES,
} from "@/lib/stripe"
import type { BillingEventType } from "@/lib/stripe"
import { logger } from "@/lib/logger"

// 永続的エラー（リトライしても解決しない）
class PermanentError extends Error {}

/**
 * POST /api/webhooks/stripe
 * Stripe Webhook ハンドラ。認証不要（Stripe署名で検証）。
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "stripe-signature ヘッダーがありません" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await request.text()
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error("Webhook署名検証失敗", {
      component: "stripe-webhook",
      error: message,
    })
    return NextResponse.json({ error: "Webhook署名検証に失敗しました" }, { status: 400 })
  }

  logger.info(`Stripe webhook received: ${event.type}`, {
    component: "stripe-webhook",
    eventId: event.id,
    type: event.type,
  })

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event)
        break

      case "invoice.paid":
        await handleInvoiceEvent(event, BILLING_EVENT_TYPES.PAYMENT_SUCCEEDED, (inv) => inv.amount_paid)
        break

      case "invoice.payment_failed":
        await handleInvoiceEvent(event, BILLING_EVENT_TYPES.PAYMENT_FAILED, (inv) => inv.amount_due, (inv) => ({
          attemptCount: inv.attempt_count,
        }))
        break

      case "customer.subscription.updated":
        await handleSubscriptionEvent(event, BILLING_EVENT_TYPES.SUBSCRIPTION_UPDATED)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event, BILLING_EVENT_TYPES.SUBSCRIPTION_DELETED)
        break

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`, {
          component: "stripe-webhook",
        })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Webhook handler error for ${event.type}`, {
      component: "stripe-webhook",
      eventId: event.id,
      error: message,
    })

    // 永続的エラーはリトライしても無駄なので 200 を返す
    // 一時的エラー（DB接続失敗等）は 500 を返してStripeにリトライさせる
    if (err instanceof PermanentError) {
      return NextResponse.json({ received: true })
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ─── Helpers ───

/** Invoice から subscription ID を抽出 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === "string" ? sub : sub.id
}

// ─── Event Handlers ───

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const clinicId = session.metadata?.clinicId
  if (!clinicId) {
    throw new PermanentError("checkout.session missing clinicId metadata")
  }

  // Subscription を取得して同期
  if (session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id
    const subscription = await retrieveSubscription(subscriptionId)
    await syncSubscriptionToClinic(subscription)
  }

  await recordBillingEvent({
    clinicId,
    type: BILLING_EVENT_TYPES.CHECKOUT_COMPLETED,
    stripeEventId: event.id,
    amount: session.amount_total ?? undefined,
    currency: session.currency ?? "jpy",
    metadata: {
      sessionId: session.id,
      plan: session.metadata?.plan,
      cycle: session.metadata?.cycle,
    },
  })
}

/** invoice.paid / invoice.payment_failed の共通ハンドラ */
async function handleInvoiceEvent(
  event: Stripe.Event,
  eventType: BillingEventType,
  getAmount: (invoice: Stripe.Invoice) => number | undefined,
  getExtraMetadata?: (invoice: Stripe.Invoice) => Record<string, unknown>
) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) {
    throw new PermanentError("Invoice missing subscription reference")
  }

  const subscription = await retrieveSubscription(subscriptionId)
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) {
    throw new PermanentError("Subscription missing clinicId metadata")
  }

  // sync と record は独立しているので並列実行
  await Promise.all([
    syncSubscriptionToClinic(subscription),
    recordBillingEvent({
      clinicId,
      type: eventType,
      stripeEventId: event.id,
      amount: getAmount(invoice),
      currency: invoice.currency ?? "jpy",
      metadata: {
        invoiceId: invoice.id,
        subscriptionId,
        ...getExtraMetadata?.(invoice),
      },
    }),
  ])
}

/** customer.subscription.updated / deleted の共通ハンドラ */
async function handleSubscriptionEvent(
  event: Stripe.Event,
  eventType: BillingEventType
) {
  const subscription = event.data.object as Stripe.Subscription
  const clinicId = subscription.metadata.clinicId
  if (!clinicId) {
    throw new PermanentError("Subscription missing clinicId metadata")
  }

  await Promise.all([
    syncSubscriptionToClinic(subscription),
    recordBillingEvent({
      clinicId,
      type: eventType,
      stripeEventId: event.id,
      metadata: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.metadata.plan,
        canceledAt: subscription.canceled_at,
      },
    }),
  ])
}
