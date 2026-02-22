"use client"

import { useState } from "react"
import { LogIn, Loader2, Settings2 } from "lucide-react"
import { PlanSwitcher } from "@/components/admin/plan-switcher"
import { PLANS } from "@/lib/constants"
import type { PlanTier } from "@/types"

const PLAN_BADGE_COLORS: Record<PlanTier, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  standard: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
}

interface ClinicRowProps {
  clinicId: string
  clinicName: string
  plan?: PlanTier
  children: React.ReactNode
}

export function ClinicRow({ clinicId, clinicName, plan, children }: ClinicRowProps) {
  const [loading, setLoading] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanTier>(plan ?? "free")

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/operator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (res.ok) {
        window.open("/dashboard", "_blank")
      }
    } finally {
      setLoading(false)
    }
  }

  function handlePlanClick(e: React.MouseEvent) {
    e.stopPropagation()
    setPlanDialogOpen(true)
  }

  const planDef = PLANS[currentPlan]

  return (
    <>
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        className="group cursor-pointer rounded-lg border p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
      >
        {children}
        {/* Plan badge + Login overlay */}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePlanClick}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80 ${PLAN_BADGE_COLORS[currentPlan]}`}
          >
            <Settings2 className="h-2.5 w-2.5" />
            {planDef.name}
          </button>
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            {loading ? (
              <span className="flex items-center gap-1.5 text-xs text-violet-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                ログイン中...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-violet-500">
                <LogIn className="h-3 w-3" />
                クリックでダッシュボードを開く
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan switcher dialog */}
      {planDialogOpen && (
        <PlanSwitcher
          clinicId={clinicId}
          clinicName={clinicName}
          currentPlan={currentPlan}
          onClose={() => setPlanDialogOpen(false)}
          onUpdated={(newPlan) => setCurrentPlan(newPlan)}
        />
      )}
    </>
  )
}
