import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { MonthlyMetricsView } from "@/components/dashboard/monthly-metrics-view"
import { MetricsPinLock } from "@/components/dashboard/metrics-pin-lock"
import { MetricsTabNav } from "@/components/dashboard/metrics-tab-nav"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { ROLES } from "@/lib/constants"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"
import type { ClinicSettings } from "@/types"

export default async function MetricsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const isOperatorMode = !!operatorClinicId
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  // プランゲート
  if (session.user.role !== "system_admin") {
    const planInfo = await getClinicPlanInfo(clinicId)
    if (!hasFeature(planInfo.effectivePlan, "business_metrics")) {
      return (
        <UpgradePrompt
          feature="business_metrics"
          featureLabel={messages.plan.featureMetrics}
          requiredPlan="standard"
          planInfo={planInfo}
        />
      )
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Fetch entered months for the last 6 months (for alert)
  const monthKeys: { year: number; month: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(year, month - 1 - i, 1)
    monthKeys.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const [enteredRows, clinic] = await Promise.all([
    prisma.monthlyClinicMetrics.findMany({
      where: {
        clinicId,
        OR: monthKeys.map((k) => ({ year: k.year, month: k.month })),
      },
      select: { year: true, month: true },
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { settings: true },
    }),
  ])

  const enteredMonths = enteredRows.map((r) => `${r.year}-${r.month}`)
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const clinicType = settings.clinicType ?? "general"
  const hasMetricsPin = !!settings.metricsPin

  const content = (
    <div className="space-y-6">
      <MetricsTabNav active="summary" />
      <MonthlyMetricsView enteredMonths={enteredMonths} clinicType={clinicType} />
    </div>
  )

  // PINロック: PIN設定済み かつ 運営モードでない場合
  if (hasMetricsPin && !isOperatorMode) {
    return <MetricsPinLock>{content}</MetricsPinLock>
  }

  return content
}
