import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isStaffViewOverride, getOperatorClinicId } from "@/lib/admin-mode"
import { getDashboardStats, getCombinedMonthlyTrends, getQuestionBreakdown } from "@/lib/queries/stats"
import type { TemplateQuestionScores } from "@/lib/queries/stats"
import type { SatisfactionTrend } from "@/types"
import { getStaffEngagementData } from "@/lib/queries/engagement"
import { SatisfactionTrendChart } from "@/components/dashboard/satisfaction-trend"
import { RecentResponses } from "@/components/dashboard/recent-responses"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { StaffEngagement } from "@/components/dashboard/staff-engagement"
import { InsightCards } from "@/components/dashboard/insight-cards"
import { StaffLeaderboard } from "@/components/dashboard/staff-leaderboard"
import { messages } from "@/lib/messages"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ROLES } from "@/lib/constants"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // 運営モード: system_adminが特定クリニックとして操作
  const operatorClinicId = session.user.role === ROLES.SYSTEM_ADMIN ? getOperatorClinicId() : null
  const isOperatorMode = !!operatorClinicId
  const clinicId = operatorClinicId ?? session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  // ロールベースで管理者ビューを判定
  const role = session.user.role
  const isAdmin = role === "clinic_admin" || role === "system_admin"
  const staffViewOverride = isAdmin && !isOperatorMode && isStaffViewOverride()
  const adminMode = isOperatorMode || (isAdmin && !staffViewOverride)

  // Get clinic info for kiosk link and admin greeting
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true, name: true },
  })
  const kioskUrl = clinic ? `/kiosk/${encodeURIComponent(clinic.slug)}` : "/dashboard/survey-start"

  // --- Conditional data fetching based on mode ---
  let engagement: Awaited<ReturnType<typeof getStaffEngagementData>> | null = null
  let activeActions: Array<{ id: string; title: string; description: string | null; targetQuestion: string | null }> = []

  let adminData: {
    stats: Awaited<ReturnType<typeof getDashboardStats>>
    satisfactionTrend: SatisfactionTrend[]
    questionBreakdown: TemplateQuestionScores[]
    showSummaryBanner: boolean
    summaryBannerLabel: string
    lowScoreQuestions: Array<{ questionId: string; text: string; avgScore: number }>
  } | null = null

  if (adminMode) {
    const now = new Date()
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevYear = prevDate.getFullYear()
    const prevMonth = prevDate.getMonth() + 1

    const [stats, trends, questionBreakdown, lastMonthSummary] =
      await Promise.all([
        getDashboardStats(clinicId),
        getCombinedMonthlyTrends(clinicId),
        getQuestionBreakdown(clinicId),
        prisma.monthlyClinicMetrics.findUnique({
          where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
          select: { totalVisits: true },
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

    adminData = {
      stats,
      satisfactionTrend,
      questionBreakdown,
      showSummaryBanner: lastMonthSummary == null,
      summaryBannerLabel: `${prevYear}年${prevMonth}月`,
      lowScoreQuestions,
    }
  } else {
    // Staff view: fetch engagement + active improvement actions
    const [engagementData, actions] = await Promise.all([
      getStaffEngagementData(clinicId),
      prisma.improvementAction.findMany({
        where: { clinicId, status: "active" },
        select: { id: true, title: true, description: true, targetQuestion: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    engagement = engagementData
    activeActions = actions
  }

  return (
    <div className="space-y-6">
      {/* Greeting — view-specific */}
      {adminMode ? (
        <div>
          <h1 className="text-2xl font-bold">{clinic?.name ?? messages.dashboard.satisfaction}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {messages.dashboard.thisMonth}: {adminData?.stats.totalResponses ?? 0}{messages.common.countSuffix}
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{messages.dashboard.staffDashboardGreeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {messages.dashboard.staffDashboardMessage}
          </p>
        </div>
      )}

      {/* Staff view */}
      {!adminMode && engagement && (
        <StaffEngagement data={engagement} kioskUrl={kioskUrl} activeActions={activeActions} />
      )}

      {/* Admin analytics — single consolidated section */}
      {adminData && (
        <div className="space-y-4">
          {/* Hero score card */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{messages.dashboard.satisfaction}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-blue-600">
                      {adminData.stats.averageScore > 0 ? adminData.stats.averageScore.toFixed(1) : "-"}
                    </span>
                    {adminData.stats.averageScore > 0 && (
                      <span className="text-lg text-muted-foreground">/ 5.0</span>
                    )}
                  </div>
                </div>
                {adminData.stats.prevAverageScore != null && adminData.stats.averageScore > 0 && (
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    adminData.stats.averageScore > adminData.stats.prevAverageScore
                      ? "bg-green-100 text-green-700"
                      : adminData.stats.averageScore < adminData.stats.prevAverageScore
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                    {adminData.stats.averageScore > adminData.stats.prevAverageScore ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : adminData.stats.averageScore < adminData.stats.prevAverageScore ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    {adminData.stats.prevAverageScore > 0 && (
                      <span>
                        {adminData.stats.averageScore > adminData.stats.prevAverageScore ? "+" : ""}
                        {(adminData.stats.averageScore - adminData.stats.prevAverageScore).toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <InsightCards
            averageScore={adminData.stats.averageScore}
            prevAverageScore={adminData.stats.prevAverageScore ?? null}
            totalResponses={adminData.stats.totalResponses}
            lowScoreQuestions={adminData.lowScoreQuestions}
            showSummaryBanner={adminData.showSummaryBanner}
          />

          <QuestionBreakdown data={adminData.questionBreakdown} />
          <SatisfactionTrendChart data={adminData.satisfactionTrend} />
          <RecentResponses responses={adminData.stats.recentResponses} />
          <StaffLeaderboard />
        </div>
      )}
    </div>
  )
}
