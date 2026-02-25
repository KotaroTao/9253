import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { MetricsInputView } from "@/components/dashboard/metrics-input-view"
import { MetricsPinLock } from "@/components/dashboard/metrics-pin-lock"
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt"
import { getMonthStatus, calcWorkingDays } from "@/lib/metrics-utils"
import type { MonthStatus, ClinicProfile } from "@/lib/metrics-utils"
import type { ClinicSettings } from "@/types"
import { ROLES } from "@/lib/constants"
import { getClinicPlanInfo, hasFeature } from "@/lib/plan"
import { messages } from "@/lib/messages"

const METRICS_SELECT = {
  totalPatientCount: true,
  firstVisitCount: true,
  revisitCount: true,
  totalRevenue: true,
  insuranceRevenue: true,
  selfPayRevenue: true,
  cancellationCount: true,
} as const

const PROFILE_SELECT = {
  chairCount: true,
  dentistCount: true,
  hygienistCount: true,
  totalVisitCount: true,
  workingDays: true,
  laborCost: true,
} as const

const FULL_SELECT = {
  ...METRICS_SELECT,
  ...PROFILE_SELECT,
} as const

function extractProfile(row: { chairCount: number | null; dentistCount: number | null; hygienistCount: number | null; totalVisitCount: number | null; workingDays: number | null; laborCost: number | null } | null): ClinicProfile | null {
  if (!row) return null
  return {
    chairCount: row.chairCount,
    dentistCount: row.dentistCount,
    hygienistCount: row.hygienistCount,
    totalVisitCount: row.totalVisitCount,
    workingDays: row.workingDays,
    laborCost: row.laborCost,
  }
}

export default async function MetricsInputPage() {
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

  const [summary, prevSummary, statusRows, clinic] =
    await Promise.all([
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year, month } },
        select: FULL_SELECT,
      }),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: FULL_SELECT,
      }),
      prisma.monthlyClinicMetrics.findMany({
        where: {
          clinicId,
          OR: monthKeys.map((k) => ({ year: k.year, month: k.month })),
        },
        select: { year: true, month: true, ...METRICS_SELECT },
      }),
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { unitCount: true, settings: true },
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

  // Auto-calculate working days from clinic calendar
  const settings = (clinic?.settings ?? {}) as ClinicSettings
  const autoWorkingDays = calcWorkingDays(
    year, month,
    settings.regularClosedDays ?? [],
    settings.closedDates ?? [],
    settings.openDates ?? [],
  )

  // Profile defaults from previous month or clinic settings
  const profileDefaults = {
    chairCount: prevSummary?.chairCount ?? clinic?.unitCount ?? null,
    dentistCount: prevSummary?.dentistCount ?? null,
    hygienistCount: prevSummary?.hygienistCount ?? null,
  }

  const hasMetricsPin = !!settings.metricsPin

  const content = (
    <div className="space-y-6">
      <MetricsInputView
        initialSummary={summary ?? null}
        initialYear={year}
        initialMonth={month}
        monthStatuses={monthStatuses}
        initialProfile={extractProfile(summary)}
        initialAutoWorkingDays={autoWorkingDays}
        initialProfileDefaults={profileDefaults}
      />
    </div>
  )

  // PINロック: PIN設定済み かつ 運営モードでない場合
  if (hasMetricsPin && !isOperatorMode) {
    return <MetricsPinLock>{content}</MetricsPinLock>
  }

  return content
}
