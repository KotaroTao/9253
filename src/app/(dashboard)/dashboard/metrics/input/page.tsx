import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { getMonthlySurveyCount } from "@/lib/queries/stats"
import { MetricsInputView } from "@/components/dashboard/metrics-input-view"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { getMonthStatus } from "@/lib/metrics-utils"
import type { MonthStatus } from "@/lib/metrics-utils"
import { ROLES } from "@/lib/constants"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"

const METRICS_SELECT = {
  firstVisitCount: true,
  revisitCount: true,
  insuranceRevenue: true,
  selfPayRevenue: true,
  cancellationCount: true,
} as const

export default async function MetricsInputPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "staff") {
    redirect("/dashboard")
  }

  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
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

  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  // Generate month keys from 2025-01 to current month
  const monthKeys: { year: number; month: number }[] = []
  const startYear = 2025
  const startMonth = 1
  for (let y = startYear; y <= year; y++) {
    const mStart = y === startYear ? startMonth : 1
    const mEnd = y === year ? month : 12
    for (let m = mStart; m <= mEnd; m++) {
      monthKeys.push({ year: y, month: m })
    }
  }

  const [summary, prevSummary, surveyCount, statusRows] =
    await Promise.all([
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year, month } },
        select: METRICS_SELECT,
      }),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: METRICS_SELECT,
      }),
      getMonthlySurveyCount(clinicId, year, month),
      prisma.monthlyClinicMetrics.findMany({
        where: {
          clinicId,
          OR: monthKeys.map((k) => ({ year: k.year, month: k.month })),
        },
        select: { year: true, month: true, ...METRICS_SELECT },
      }),
    ])

  // Build month status map
  const statusMap = new Map(statusRows.map((r) => [`${r.year}-${r.month}`, r]))
  const monthStatuses: Record<string, MonthStatus> = {}
  for (const k of monthKeys) {
    const key = `${k.year}-${k.month}`
    const row = statusMap.get(key)
    monthStatuses[key] = getMonthStatus(row ?? null)
  }

  return (
    <div className="space-y-6">
      <MetricsInputView
        initialSummary={summary ?? null}
        initialPrevSummary={prevSummary?.firstVisitCount != null ? prevSummary : null}
        initialSurveyCount={surveyCount}
        initialYear={year}
        initialMonth={month}
        monthStatuses={monthStatuses}
      />
    </div>
  )
}
