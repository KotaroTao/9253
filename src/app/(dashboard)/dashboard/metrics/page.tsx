import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { prisma } from "@/lib/prisma"
import { getMonthlySurveyCount, getMonthlySurveyQuality } from "@/lib/queries/stats"
import { MonthlyMetricsView } from "@/components/dashboard/monthly-metrics-view"
import { ROLES } from "@/lib/constants"

export default async function MetricsPage() {
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

  const [summary, prevSummary, surveyCount, surveyQuality] =
    await Promise.all([
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year, month } },
        select: { totalVisits: true, totalRevenue: true, selfPayRevenue: true, googleReviewCount: true, googleReviewRating: true },
      }),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: { totalVisits: true, totalRevenue: true, selfPayRevenue: true, googleReviewCount: true, googleReviewRating: true },
      }),
      getMonthlySurveyCount(clinicId, year, month),
      getMonthlySurveyQuality(clinicId, year, month),
    ])

  return (
    <div className="space-y-6">
      <MonthlyMetricsView
        initialSummary={summary ?? null}
        initialPrevSummary={prevSummary?.totalVisits != null ? prevSummary : null}
        initialSurveyCount={surveyCount}
        initialSurveyQuality={surveyQuality}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}
