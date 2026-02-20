import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { getMonthlySurveyCount } from "@/lib/queries/stats"
import { MetricsInputView } from "@/components/dashboard/metrics-input-view"
import { ROLES } from "@/lib/constants"

const METRICS_SELECT = {
  firstVisitCount: true,
  firstVisitInsurance: true,
  firstVisitSelfPay: true,
  revisitCount: true,
  revisitInsurance: true,
  revisitSelfPay: true,
  totalRevenue: true,
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

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  // Fetch entered months for the last 6 months
  const monthKeys: { year: number; month: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(year, month - 1 - i, 1)
    monthKeys.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const [summary, prevSummary, surveyCount, enteredRows] =
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
        select: { year: true, month: true },
      }),
    ])

  const enteredMonths = enteredRows.map((r) => `${r.year}-${r.month}`)

  return (
    <div className="space-y-6">
      <MetricsInputView
        initialSummary={summary ?? null}
        initialPrevSummary={prevSummary?.firstVisitCount != null ? prevSummary : null}
        initialSurveyCount={surveyCount}
        initialYear={year}
        initialMonth={month}
        enteredMonths={enteredMonths}
      />
    </div>
  )
}
