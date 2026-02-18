import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getOperatorClinicId } from "@/lib/admin-mode"
import { getDashboardStats, getCombinedMonthlyTrends, getQuestionBreakdown, getHourlyHeatmapData } from "@/lib/queries/stats"
import { SatisfactionTrendChart } from "@/components/dashboard/satisfaction-trend"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { InsightCards } from "@/components/dashboard/insight-cards"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import { SatisfactionHeatmap } from "@/components/dashboard/satisfaction-heatmap"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

  const [stats, trends, questionBreakdown, heatmapData, lastMonthSummary, clinic] =
    await Promise.all([
      getDashboardStats(clinicId),
      getCombinedMonthlyTrends(clinicId),
      getQuestionBreakdown(clinicId),
      getHourlyHeatmapData(clinicId),
      prisma.monthlyClinicMetrics.findUnique({
        where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
        select: { totalVisits: true },
      }),
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true },
      }),
    ])

  const { satisfactionTrend } = trends

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{clinic?.name ?? messages.dashboard.satisfaction}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.dashboard.thisMonth}: {stats.totalResponses}{messages.common.countSuffix}
        </p>
      </div>

      <div className="space-y-4">
        {/* Hero score card */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{messages.dashboard.satisfaction}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "-"}
                  </span>
                  {stats.averageScore > 0 && (
                    <span className="text-lg text-muted-foreground">/ 5.0</span>
                  )}
                </div>
              </div>
              {stats.prevAverageScore != null && stats.averageScore > 0 && (
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  stats.averageScore > stats.prevAverageScore
                    ? "bg-green-100 text-green-700"
                    : stats.averageScore < stats.prevAverageScore
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                }`}>
                  {stats.averageScore > stats.prevAverageScore ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : stats.averageScore < stats.prevAverageScore ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {stats.prevAverageScore > 0 && (
                    <span>
                      {stats.averageScore > stats.prevAverageScore ? "+" : ""}
                      {(stats.averageScore - stats.prevAverageScore).toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <InsightCards
          averageScore={stats.averageScore}
          prevAverageScore={stats.prevAverageScore ?? null}
          totalResponses={stats.totalResponses}
          lowScoreQuestions={lowScoreQuestions}
          showSummaryBanner={showSummaryBanner}
        />

        <QuestionBreakdown data={questionBreakdown} />
        <SatisfactionHeatmap data={heatmapData} />
        <SatisfactionTrendChart data={satisfactionTrend} />
        <StaffLeaderboard />
      </div>
    </div>
  )
}
