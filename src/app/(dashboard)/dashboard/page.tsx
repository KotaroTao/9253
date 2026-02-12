import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getDashboardStats, getMonthlyTrend, getFourMetricsTrend } from "@/lib/queries/stats"
import { getLatestStaffSurveyScore } from "@/lib/queries/staff-surveys"
import { getLatestTallyMetrics } from "@/lib/queries/tallies"
import { FourMetricsCards } from "@/components/dashboard/four-metrics-cards"
import { FourMetricsTrendChart } from "@/components/dashboard/four-metrics-trend"
import { EmployeeRadarChart } from "@/components/dashboard/radar-chart"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { RecentResponses } from "@/components/dashboard/recent-responses"
import { StaffRanking } from "@/components/dashboard/staff-ranking"
import { messages } from "@/lib/messages"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  // Check if last month's summary is entered
  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  const [stats, monthlyTrend, fourMetricsTrend, staffSurveyScore, latestTallyMetrics, lastMonthSummary] =
    await Promise.all([
      getDashboardStats(clinicId),
      getMonthlyTrend(clinicId),
      getFourMetricsTrend(clinicId),
      getLatestStaffSurveyScore(clinicId),
      getLatestTallyMetrics(clinicId),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: { totalVisits: true },
      }),
    ])

  const showSummaryBanner = !lastMonthSummary?.totalVisits

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.dashboard.title}</h1>

      {showSummaryBanner && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            {prevYear}年{prevMonth}月の{messages.monthlyMetrics.summaryNotEntered}
          </p>
          <Link
            href="/dashboard/metrics"
            className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            {messages.monthlyMetrics.enterSummary}
          </Link>
        </div>
      )}

      {/* 4 KPI Cards */}
      <FourMetricsCards
        data={{
          patientSatisfaction: {
            current: stats.averageScore,
            prev: stats.prevAverageScore ?? null,
          },
          employeeSatisfaction: {
            current: staffSurveyScore?.overallScore ?? null,
          },
          maintenanceRate: {
            current: latestTallyMetrics?.maintenanceRate ?? null,
            prev: latestTallyMetrics?.prevMaintenanceRate ?? null,
          },
          selfPayRate: {
            current: latestTallyMetrics?.selfPayRate ?? null,
            prev: latestTallyMetrics?.prevSelfPayRate ?? null,
          },
        }}
      />

      {/* 4 Metrics Trend + Radar Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FourMetricsTrendChart data={fourMetricsTrend} />
        <EmployeeRadarChart
          categoryScores={staffSurveyScore?.categoryScores ?? []}
          surveyTitle={staffSurveyScore?.surveyTitle}
        />
      </div>

      {/* Patient satisfaction trend + Staff ranking */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyChart data={monthlyTrend} />
        <StaffRanking ranking={stats.staffRanking} />
      </div>

      <RecentResponses responses={stats.recentResponses} />
    </div>
  )
}
