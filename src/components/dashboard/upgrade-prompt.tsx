"use client"

import { useState } from "react"
import { Lock, Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { PLANS } from "@/lib/constants"
import type { PlanInfo, PlanTier } from "@/types"

interface UpgradePromptProps {
  feature: string
  featureLabel: string
  requiredPlan: PlanTier
  planInfo: PlanInfo
}

export function UpgradePrompt({ feature, featureLabel, requiredPlan, planInfo }: UpgradePromptProps) {
  const [starting, setStarting] = useState(false)
  const [trialStarted, setTrialStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requiredPlanDef = PLANS[requiredPlan]

  async function handleStartTrial() {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: requiredPlan }),
      })
      if (res.ok) {
        setTrialStarted(true)
        // Reload to apply new plan
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const data = await res.json()
        setError(data.error || messages.common.error)
      }
    } catch {
      setError(messages.common.error)
    } finally {
      setStarting(false)
    }
  }

  if (trialStarted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Sparkles className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold">{messages.plan.trialStarted}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {requiredPlanDef.name}プランの全機能を14日間お試しいただけます
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            ページを再読み込み中...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold">{featureLabel}</h2>
        <p className="mt-2 text-muted-foreground">
          {messages.plan.upgradePromptDesc.replace("{plan}", requiredPlanDef.name)}
        </p>

        {/* Required plan features */}
        <div className="mt-6 rounded-xl bg-muted/50 p-5 text-left">
          <p className="mb-3 text-sm font-semibold">
            {requiredPlanDef.name}プラン（{requiredPlanDef.priceLabel}{requiredPlanDef.priceNote}）
          </p>
          <ul className="space-y-1.5">
            {requiredPlanDef.features.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-3">
          {planInfo.canStartTrial && (
            <Button
              onClick={handleStartTrial}
              disabled={starting}
              size="lg"
              className="w-full shadow-lg shadow-primary/25"
            >
              {starting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {messages.plan.startTrial}
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href="/#cta">
              {planInfo.canStartTrial ? messages.plan.contactForUpgrade : messages.plan.upgradePromptUpgradeCta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {planInfo.canStartTrial && (
          <p className="mt-3 text-xs text-muted-foreground">
            {messages.plan.startTrialDesc}
          </p>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
