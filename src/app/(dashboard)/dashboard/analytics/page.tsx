import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getDashboardStats, getQuestionBreakdown, getHourlyHeatmapData, getDailyTrend } from "@/lib/queries/stats"
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { InsightCards } from "@/components/dashboard/insight-cards"
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

  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  const [stats, questionBreakdown, heatmapData, dailyTrend, lastMonthSummary] =
    await Promise.all([
      getDashboardStats(clinicId),
      getQuestionBreakdown(clinicId),
      getHourlyHeatmapData(clinicId),
      getDailyTrend(clinicId, 30),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: { totalVisits: true },
      }),
    ])

  const lowScoreQuestions: Array<{ questionId: string; text: string; avgScore: number }> = []
  for (const template of questionBreakdown) {
    for (const q of template.questions) {
      if (q.avgScore > 0 && q.avgScore < 4.0) {
        lowScoreQuestions.push({ questionId: q.questionId, text: q.text, avgScore: q.avgScore })
      }
    }
  }
  lowScoreQuestions.sort((a, b) => a.avgScore - b.avgScore)

  const showSummaryBanner = lastMonthSummary == null

  return (
    <div className="space-y-4">
      <DailyTrendChart initialData={dailyTrend} />

      <InsightCards
        averageScore={stats.averageScore}
        prevAverageScore={stats.prevAverageScore ?? null}
        totalResponses={stats.totalResponses}
        lowScoreQuestions={lowScoreQuestions}
        showSummaryBanner={showSummaryBanner}
      />

      <QuestionBreakdown data={questionBreakdown} />
      <SatisfactionHeatmap data={heatmapData} />
      <StaffLeaderboard />
    </div>
  )
}
