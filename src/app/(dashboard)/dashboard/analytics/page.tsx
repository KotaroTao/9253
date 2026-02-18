import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getHourlyHeatmapData, getDailyTrend, getTemplateTrend, getQuestionBreakdownByDays } from "@/lib/queries/stats"
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { ROLES } from "@/lib/constants"

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  if (role === "staff") {
    redirect("/dashboard")
  }

  // 運営モード: system_adminが特定クリニックとして操作
  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const [heatmapData, dailyTrend, templateTrend, questionBreakdown] =
    await Promise.all([
      getHourlyHeatmapData(clinicId),
      getDailyTrend(clinicId, 30),
      getTemplateTrend(clinicId, 30),
      getQuestionBreakdownByDays(clinicId, 30),
    ])

  return (
    <div className="space-y-4">
      <AnalyticsCharts
        initialDailyTrend={dailyTrend}
        initialTemplateTrend={templateTrend}
        initialQuestionBreakdown={questionBreakdown}
      />

      <SatisfactionHeatmap data={heatmapData} />
      <StaffLeaderboard />
    </div>
  )
}
