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
import { Smartphone, ClipboardPen, ArrowRight, Star, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const clinicId = session.user.clinicId
  if (!clinicId) {
    redirect("/login")
  }

  const isStaff = session.user.role === "staff"

  // Staff view: personal stats + quick actions
  if (isStaff) {
    const staffId = session.user.staffId

    // Count today's surveys for this staff
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayCount, staffStats] = await Promise.all([
      staffId
        ? prisma.surveyResponse.count({
            where: { staffId, respondedAt: { gte: todayStart } },
          })
        : Promise.resolve(0),
      staffId
        ? prisma.surveyResponse.aggregate({
            where: { staffId },
            _avg: { overallScore: true },
            _count: { _all: true },
          })
        : Promise.resolve(null),
    ])

    const myScore = staffStats?._avg?.overallScore
    const totalCount = staffStats?._count?._all ?? 0

    // Time-aware greeting
    const hour = new Date().getHours()
    const greeting = hour < 12
      ? messages.dashboard.staffGreetingMorning
      : hour < 17
        ? messages.dashboard.staffGreetingAfternoon
        : messages.dashboard.staffGreetingEvening

    // Milestone message
    const milestoneMsg = todayCount >= 20
      ? messages.dashboard.staffMilestone20
      : todayCount >= 10
        ? messages.dashboard.staffMilestone10
        : null

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {milestoneMsg || messages.dashboard.staffDashboardMessage}
          </p>
        </div>

        {/* Staff personal stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{messages.dashboard.staffTodayCount}</p>
                <p className="text-2xl font-bold">{todayCount}<span className="text-sm font-normal text-muted-foreground ml-1">{messages.common.countSuffix}</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{messages.dashboard.staffMyScore}</p>
                {myScore != null && totalCount > 0 ? (
                  <p className="text-2xl font-bold">{myScore.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">/ 5.0（{totalCount}{messages.common.countSuffix}）</span></p>
                ) : (
                  <p className="text-sm text-muted-foreground">{messages.dashboard.staffNoScoreYet}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/survey-start"
            className="group flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-blue-900">{messages.dashboard.startSurvey}</p>
              <p className="text-sm text-blue-600/70">{messages.dashboard.startSurveyDesc}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard/tally"
            className="group flex items-center gap-4 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 transition-all hover:border-emerald-400 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <ClipboardPen className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-emerald-900">{messages.dashboard.startTally}</p>
              <p className="text-sm text-emerald-600/70">{messages.dashboard.startTallyDesc}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    )
  }

  // Admin view: full dashboard
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

  const showSummaryBanner = lastMonthSummary == null

  return (
    <div className="space-y-6">
      {/* Header with concept subtitle */}
      <div>
        <h1 className="text-2xl font-bold">{messages.dashboard.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{messages.dashboard.subtitle}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/survey-start"
          className="group flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
            <Smartphone className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-blue-900">{messages.dashboard.startSurvey}</p>
            <p className="text-sm text-blue-600/70">{messages.dashboard.startSurveyDesc}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/dashboard/tally"
          className="group flex items-center gap-4 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 transition-all hover:border-emerald-400 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
            <ClipboardPen className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-emerald-900">{messages.dashboard.startTally}</p>
            <p className="text-sm text-emerald-600/70">{messages.dashboard.startTallyDesc}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

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

      {/* Section: 患者体験 (primary) */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {messages.dashboard.sectionPatientExperience}
        </h2>

        {/* Hero: Patient Satisfaction */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
          <CardContent className="flex items-center gap-6 py-6">
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
              <p className="mt-1 text-xs text-muted-foreground">
                {messages.dashboard.thisMonth}: {stats.totalResponses}{messages.common.countSuffix}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient satisfaction trend + Staff ranking */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MonthlyChart data={monthlyTrend} />
          <StaffRanking ranking={stats.staffRanking} />
        </div>

        <RecentResponses responses={stats.recentResponses} />
      </div>

      {/* Section: 経営指標 (secondary) */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {messages.dashboard.sectionClinicPerformance}
        </h2>

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

        <div className="grid gap-6 lg:grid-cols-2">
          <FourMetricsTrendChart data={fourMetricsTrend} />
          <EmployeeRadarChart
            categoryScores={staffSurveyScore?.categoryScores ?? []}
            surveyTitle={staffSurveyScore?.surveyTitle}
          />
        </div>
      </div>
    </div>
  )
}
