import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdminMode } from "@/lib/admin-mode"
import { getDashboardStats, getMonthlyTrend, getSatisfactionTrend, getQuestionBreakdown } from "@/lib/queries/stats"
import type { TemplateQuestionScores } from "@/lib/queries/stats"
import { getLatestStaffSurveyScore } from "@/lib/queries/staff-surveys"
import { getStaffEngagementData } from "@/lib/queries/engagement"
import { SatisfactionCards } from "@/components/dashboard/satisfaction-cards"
import { SatisfactionTrendChart } from "@/components/dashboard/satisfaction-trend"
import { EmployeeRadarChart } from "@/components/dashboard/radar-chart"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { RecentResponses } from "@/components/dashboard/recent-responses"
import { AdminInlineAuth } from "@/components/dashboard/admin-inline-auth"
import { QuestionBreakdown } from "@/components/dashboard/question-breakdown"
import { StaffEngagement } from "@/components/dashboard/staff-engagement"
import { messages } from "@/lib/messages"
import { Smartphone, ArrowRight } from "lucide-react"
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

  const adminMode = isAdminMode()

  // Check if clinic has admin password set + get slug for kiosk link
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { slug: true, settings: true },
  })
  const settings = clinic?.settings as Record<string, unknown> | null
  const hasAdminPassword = !!settings?.adminPassword
  const kioskUrl = clinic ? `/kiosk/${encodeURIComponent(clinic.slug)}` : "/dashboard/survey-start"

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12
    ? messages.dashboard.staffGreetingMorning
    : hour < 17
      ? messages.dashboard.staffGreetingAfternoon
      : messages.dashboard.staffGreetingEvening

  // Staff engagement data (always fetched for staff home screen)
  const engagement = await getStaffEngagementData(clinicId)

  // Admin analytics data (only fetch when admin mode is active)
  let adminData: {
    stats: Awaited<ReturnType<typeof getDashboardStats>>
    monthlyTrend: Awaited<ReturnType<typeof getMonthlyTrend>>
    satisfactionTrend: Awaited<ReturnType<typeof getSatisfactionTrend>>
    staffSurveyScore: Awaited<ReturnType<typeof getLatestStaffSurveyScore>>
    questionBreakdown: TemplateQuestionScores[]
    showSummaryBanner: boolean
  } | null = null

  if (adminMode) {
    const now = new Date()
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevYear = prevDate.getFullYear()
    const prevMonth = prevDate.getMonth() + 1

    const [stats, monthlyTrend, satisfactionTrend, staffSurveyScore, questionBreakdown, lastMonthSummary] =
      await Promise.all([
        getDashboardStats(clinicId),
        getMonthlyTrend(clinicId),
        getSatisfactionTrend(clinicId),
        getLatestStaffSurveyScore(clinicId),
        getQuestionBreakdown(clinicId),
        prisma.monthlyClinicMetrics.findUnique({
          where: { clinicId_year_month: { clinicId, year: prevYear, month: prevMonth } },
          select: { totalVisits: true },
        }),
      ])

    adminData = {
      stats,
      monthlyTrend,
      satisfactionTrend,
      staffSurveyScore,
      questionBreakdown,
      showSummaryBanner: lastMonthSummary == null,
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.dashboard.staffDashboardMessage}
        </p>
      </div>

      {/* Action card - only shown when NOT in admin mode */}
      {!adminMode && (
        <a
          href={kioskUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-blue-900">{messages.dashboard.startSurvey}</p>
            <p className="text-sm text-blue-600/70">{messages.dashboard.startSurveyDesc}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" />
        </a>
      )}

      {/* Staff engagement - only shown when NOT in admin mode */}
      {!adminMode && <StaffEngagement data={engagement} />}

      {/* Admin analytics - only when admin mode is active */}
      {adminData && (
        <>
          {adminData.showSummaryBanner && (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                {new Date().getFullYear()}年{new Date().getMonth()}月の{messages.monthlyMetrics.summaryNotEntered}
              </p>
              <Link
                href="/dashboard/metrics"
                className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                {messages.monthlyMetrics.enterSummary}
              </Link>
            </div>
          )}

          {/* Patient Experience Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {messages.dashboard.sectionPatientExperience}
            </h2>

            <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-white">
              <CardContent className="flex items-center gap-6 py-6">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {messages.dashboard.thisMonth}: {adminData.stats.totalResponses}{messages.common.countSuffix}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Question-level breakdown chart + improvement advice */}
            <QuestionBreakdown data={adminData.questionBreakdown} />

            <MonthlyChart data={adminData.monthlyTrend} />

            <RecentResponses responses={adminData.stats.recentResponses} />
          </div>

          {/* Satisfaction Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {messages.dashboard.sectionSatisfaction}
            </h2>

            <SatisfactionCards
              data={{
                patientSatisfaction: {
                  current: adminData.stats.averageScore,
                  prev: adminData.stats.prevAverageScore ?? null,
                },
                employeeSatisfaction: {
                  current: adminData.staffSurveyScore?.overallScore ?? null,
                },
              }}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <SatisfactionTrendChart data={adminData.satisfactionTrend} />
              <EmployeeRadarChart
                categoryScores={adminData.staffSurveyScore?.categoryScores ?? []}
                surveyTitle={adminData.staffSurveyScore?.surveyTitle}
              />
            </div>
          </div>
        </>
      )}

      {/* Admin password section - always at bottom */}
      <AdminInlineAuth isAdminMode={adminMode} hasAdminPassword={hasAdminPassword} />
    </div>
  )
}
