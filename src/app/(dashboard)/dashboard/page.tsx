import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getDashboardStats, getMonthlyTrend, getFourMetricsTrend } from "@/lib/queries/stats"
import { getLatestStaffSurveyScore } from "@/lib/queries/staff-surveys"
import { getLatestMonthlyMetrics } from "@/lib/queries/monthly-metrics"
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

  const [stats, monthlyTrend, fourMetricsTrend, staffSurveyScore, latestMetrics] =
    await Promise.all([
      getDashboardStats(clinicId),
      getMonthlyTrend(clinicId),
      getFourMetricsTrend(clinicId),
      getLatestStaffSurveyScore(clinicId),
      getLatestMonthlyMetrics(clinicId),
    ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{messages.dashboard.title}</h1>

      {/* 4 KPI Cards */}
      <FourMetricsCards
        data={{
          patientSatisfaction: stats.averageScore,
          employeeSatisfaction: staffSurveyScore?.overallScore ?? null,
          maintenanceRate: latestMetrics?.maintenanceRate ?? null,
          selfPayRate: latestMetrics?.selfPayRate ?? null,
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
