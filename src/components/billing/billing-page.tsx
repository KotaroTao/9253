"use client"

import { useState } from "react"
import { CreditCard, ExternalLink, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { PLANS, PLAN_ORDER } from "@/lib/constants"
import { YEARLY_BILLING_MONTHS } from "@/lib/stripe"
import type { PlanInfo, PlanTier } from "@/types"

const YEARLY_DISCOUNT_PERCENT = Math.round((1 - YEARLY_BILLING_MONTHS / 12) * 100)

interface BillingEvent {
  id: string
  type: string
  amount: number | null
  currency: string | null
  createdAt: string
}

interface BillingPageProps {
  planInfo: PlanInfo
  billingCycle: "monthly" | "yearly" | null
  billingStatus: string | null
  hasStripeCustomer: boolean
  hasSubscription: boolean
  billingEvents: BillingEvent[]
  isOperatorMode: boolean
}

export function BillingPage({
  planInfo,
  billingCycle,
  billingStatus,
  hasStripeCustomer,
  hasSubscription,
  billingEvents,
  isOperatorMode,
}: BillingPageProps) {
  const searchParams = useSearchParams()
  const checkoutSuccess = searchParams.get("success") === "1"
  const checkoutCanceled = searchParams.get("canceled") === "1"

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <Link
          href="/dashboard/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {messages.settings.title}
        </Link>
        <h1 className="text-xl font-bold">{messages.billing.title}</h1>
        <p className="text-sm text-muted-foreground">{messages.billing.subtitle}</p>
      </div>

      {/* Checkoutの結果メッセージ */}
      {checkoutSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {messages.billing.checkoutSuccess}
        </div>
      )}
      {checkoutCanceled && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {messages.billing.checkoutCanceled}
        </div>
      )}

      {/* 現在のプラン */}
      <CurrentPlanCard
        planInfo={planInfo}
        billingCycle={billingCycle}
        billingStatus={billingStatus}
        isOperatorMode={isOperatorMode}
      />

      {/* プラン選択 */}
      <PlanSelector
        planInfo={planInfo}
        hasSubscription={hasSubscription}
      />

      {/* お支払い情報管理 */}
      {hasStripeCustomer && (
        <PaymentManagementCard />
      )}

      {/* お支払い履歴 */}
      <BillingHistoryCard events={billingEvents} />

      {/* 税表示注記 */}
      <p className="text-xs text-muted-foreground">{messages.billing.taxNote}</p>
    </div>
  )
}

// ─── Current Plan Card ───

function CurrentPlanCard({
  planInfo,
  billingCycle,
  billingStatus,
  isOperatorMode,
}: {
  planInfo: PlanInfo
  billingCycle: "monthly" | "yearly" | null
  billingStatus: string | null
  isOperatorMode: boolean
}) {
  const planDef = PLANS[planInfo.effectivePlan]

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 text-base font-semibold">{messages.billing.currentPlanLabel}</h2>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{planDef.name}</span>
            <StatusBadge status={billingStatus} isTrialing={planInfo.isTrialActive} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{planDef.description}</p>
          {billingCycle && (
            <p className="mt-1 text-sm text-muted-foreground">
              {messages.billing.billingCycleLabel}: {billingCycle === "monthly" ? messages.billing.monthly : messages.billing.yearly}
            </p>
          )}
          {planInfo.isTrialActive && planInfo.trialDaysRemaining !== null && (
            <p className="mt-1 text-sm text-violet-600">
              {messages.plan.trialDaysRemaining.replace("{days}", String(planInfo.trialDaysRemaining))}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold">{planDef.priceLabel}</span>
          <span className="text-sm text-muted-foreground">{planDef.priceNote}</span>
        </div>
      </div>
      {isOperatorMode && (
        <p className="mt-3 text-xs text-amber-600">{messages.billing.adminOverride}</p>
      )}
    </div>
  )
}

// ─── Status Badge ───

function StatusBadge({ status, isTrialing }: { status: string | null; isTrialing: boolean }) {
  if (isTrialing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
        <Clock className="h-3 w-3" />
        {messages.billing.statusTrialing}
      </span>
    )
  }

  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          {messages.billing.statusActive}
        </span>
      )
    case "past_due":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          {messages.billing.statusPastDue}
        </span>
      )
    case "canceled":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" />
          {messages.billing.statusCanceled}
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {messages.billing.statusFree}
        </span>
      )
  }
}

// ─── Plan Selector ───

function PlanSelector({
  planInfo,
  hasSubscription,
}: {
  planInfo: PlanInfo
  hasSubscription: boolean
}) {
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe(plan: PlanTier) {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle: selectedCycle }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || messages.common.error)
      }
    } catch {
      setError(messages.common.error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{messages.billing.changePlan}</h2>
        {/* サイクル切替 */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            onClick={() => setSelectedCycle("monthly")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              selectedCycle === "monthly"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {messages.billing.monthlyShort}
          </button>
          <button
            onClick={() => setSelectedCycle("yearly")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              selectedCycle === "yearly"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {messages.billing.yearlyShort}
            <span className="ml-1 text-xs text-emerald-600">-{YEARLY_DISCOUNT_PERCENT}%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((tier) => {
          const plan = PLANS[tier]
          const isCurrent = planInfo.effectivePlan === tier
          const isEnterprise = tier === "enterprise"
          const yearlyPrice = plan.price > 0 ? plan.price * YEARLY_BILLING_MONTHS : 0
          const displayPrice = selectedCycle === "yearly" && plan.price > 0
            ? `¥${yearlyPrice.toLocaleString()}`
            : plan.priceLabel
          const priceSuffix = plan.price > 0
            ? selectedCycle === "yearly"
              ? messages.billing.perYear
              : messages.billing.perMonth
            : ""

          return (
            <div
              key={tier}
              className={`relative rounded-xl border p-5 ${
                plan.highlighted
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "bg-card"
              } ${isCurrent ? "ring-2 ring-primary" : ""}`}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {messages.billing.recommended}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-medium text-white">
                  {messages.billing.currentBadge}
                </span>
              )}

              <h3 className="text-base font-bold">{plan.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>

              <div className="mt-3">
                <span className="text-2xl font-bold">{displayPrice}</span>
                {priceSuffix && (
                  <span className="text-sm text-muted-foreground">{priceSuffix}</span>
                )}
              </div>

              <ul className="mt-3 space-y-1">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                {isCurrent ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    {messages.billing.currentBadge}
                  </Button>
                ) : isEnterprise ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href="/#cta">{messages.billing.contactSales}</a>
                  </Button>
                ) : plan.price > 0 ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleSubscribe(tier)}
                    disabled={loading !== null}
                  >
                    {loading === tier ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : null}
                    {loading === tier ? messages.billing.subscribing : messages.billing.subscribe}
                  </Button>
                ) : (
                  <div className="text-center text-xs text-muted-foreground">
                    {hasSubscription
                      ? messages.billing.freePlanDesc
                      : plan.priceNote}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// ─── Payment Management Card ───

function PaymentManagementCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenPortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || messages.common.error)
      }
    } catch {
      setError(messages.common.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">{messages.billing.managePayment}</h2>
          <p className="text-sm text-muted-foreground">{messages.billing.managePaymentDesc}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleOpenPortal}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          {messages.billing.openPortal}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// ─── Billing History Card ───

const EVENT_LABELS: Record<string, string> = {
  checkout_completed: messages.billing.eventCheckout,
  payment_succeeded: messages.billing.eventPaymentSuccess,
  payment_failed: messages.billing.eventPaymentFailed,
  subscription_updated: messages.billing.eventSubscriptionUpdated,
  subscription_deleted: messages.billing.eventSubscriptionDeleted,
}

const EVENT_ICONS: Record<string, typeof CheckCircle2> = {
  checkout_completed: CheckCircle2,
  payment_succeeded: CheckCircle2,
  payment_failed: XCircle,
  subscription_updated: Clock,
  subscription_deleted: XCircle,
}

function BillingHistoryCard({ events }: { events: BillingEvent[] }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 text-base font-semibold">{messages.billing.billingHistory}</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{messages.billing.noBillingHistory}</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type] ?? Clock
            const isFailed = event.type.includes("failed") || event.type.includes("deleted")
            return (
              <div key={event.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Icon className={`h-4 w-4 shrink-0 ${isFailed ? "text-red-500" : "text-emerald-500"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {EVENT_LABELS[event.type] ?? event.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {event.amount !== null && event.amount > 0 && (
                  <span className="text-sm font-medium">
                    ¥{event.amount.toLocaleString()}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
